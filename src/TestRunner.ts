import {EventMap} from "./EventMap";
import {TestInfo} from "./TestInfo";
import {RunResults} from "./RunResults";
import {AsyncPromisifier} from "./Async/AsyncPromisifier";
import {TimeoutError, TimeoutPromisifier} from "./Async/TimeoutPromisifier";
import {mergeConfig, TestRunnerConfig, TimeoutConfig} from "./Config/TestRunnerConfig";
import {DefaultTestRunnerConfig} from "./Config/DefaultTestRunnerConfig";
import {ItOptions} from "./Config/ItOptions";
import {EventCallback, SimpleEventEmitter} from "./EventEmitter/SimpleEventEmitter";
import {QueueStack} from "./QueueStack";
import {TestResults} from "./TestResults";

interface TestEntry extends TestInfo {
    type: "describe" | "it";
}

interface TestQueue {
    describeTitleChain: string[];
    tests: TestEntry[];
    evaluatedBefores: boolean;
    skipAllTests: boolean;
    firstOnlyIndex: null | number;
}

type QueueStackType = "before" | "beforeEach" | "after" | "afterEach";
const QueueStackTypes = ["before", "beforeEach", "after", "afterEach"];

interface ItWithSubMethods {
    (title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any, options?: Partial<ItOptions>): void;

    only(title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any, options?: Partial<ItOptions>);

    skip(title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any, options?: Partial<ItOptions>);
}

interface DescribeWithSubMethods {
    (title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any): void;

    only(title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any);

    skip(title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any, options?: Partial<ItOptions>);
}

/**
 * before -> beforeEach -> beforeHook -> it -> afterHook -> afterEach -> after
 */
class TestRunner {

    private readonly asyncPromisifier = new AsyncPromisifier();
    private readonly timeoutPromisifier = new TimeoutPromisifier();
    private readonly eventEmitter: SimpleEventEmitter<EventMap>;

    private readonly config: TestRunnerConfig;

    private testQueueStack: TestQueue[] = [];
    private queueStacks: { [key: string]: QueueStack<(result?: Error | any) => void> } = {
        "before": new QueueStack(),
        "beforeEach": new QueueStack(),
        "after": new QueueStack(),
        "afterEach": new QueueStack()
    };

    private currentTest: TestEntry | null = null;
    private testRunCancelled: boolean = false;

    private currentlyExecutingFilePath: string;
    private lastFilePathSet: string;

    private currentRun: Promise<RunResults>;
    private runResults: RunResults;

    constructor(config?: TestRunnerConfig, eventEmitter = new SimpleEventEmitter<EventMap>()) {
        this.config = mergeConfig(DefaultTestRunnerConfig, config);
        this.eventEmitter = eventEmitter;

        this.it.only = this.itOnly;
        this.describe.only = this.describeOnly;

        this.it.skip = this.itSkip;
        this.describe.skip = this.describeSkip;

        this.resetRunResults();
    }

    /**
     * Sets the current file name for all subsequent calls to describe/it/etc. This is used for logging where tests
     * are sourced from.
     */
    setCurrentFile(absolutePath: string): void {
        this.lastFilePathSet = absolutePath;
    }

    on<Event extends keyof EventMap>(event: Event, callback: EventCallback<EventMap, Event>): void {
        this.eventEmitter.on(event, callback);
    }

    once<Event extends keyof EventMap>(event: Event, callback: EventCallback<EventMap, Event>): void {
        this.eventEmitter.once(event, callback);
    }

    off<Event extends keyof EventMap>(event: Event, callback: EventCallback<EventMap, Event>): void {
        this.eventEmitter.off(event, callback);
    }

    // This madness is needed to support function/object hybrids, which is remarkably useful but obnoxious in TS.
    readonly describe: DescribeWithSubMethods = ((title: string, execBlock: () => void) => {
        this.throwIfTestInProgress("describe");
        this.pushToCurrentTestQueue("describe", title, execBlock);
    }) as DescribeWithSubMethods;

    private describeOnly = (title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any): void => {
        this.throwIfTestInProgress("describe.only");
        this.pushToCurrentTestQueue("describe", title, execBlock, true);
    };

    private describeSkip = (title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any, options?: Partial<ItOptions>): void => {
        this.throwIfTestInProgress("describe.skip");
        this.pushToCurrentTestQueue("describe", title, execBlock, false, undefined, true);
    };

    readonly it: ItWithSubMethods = ((title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any, options?: Partial<ItOptions>): void => {
        this.throwIfTestInProgress("it");
        this.pushToCurrentTestQueue("it", title, execBlock, false, options ? options.timeoutMs : undefined);
    }) as ItWithSubMethods;

    private itOnly = (title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any, options?: Partial<ItOptions>): void => {
        this.throwIfTestInProgress("it.only");
        this.pushToCurrentTestQueue("it", title, execBlock, true, options ? options.timeoutMs : undefined);
    };

    private itSkip = (title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any, options?: Partial<ItOptions>): void => {
        this.throwIfTestInProgress("it.skip");
        this.pushToCurrentTestQueue("it", title, execBlock, false, undefined, true);
    };

    before(execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any) {
        this.throwIfTestInProgress("before");
        this.queueStacks["before"].pushOnTop(execBlock);
    }

    beforeEach(execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any) {
        this.throwIfTestInProgress("beforeEach");
        this.queueStacks["beforeEach"].pushOnTop(execBlock);
    }

    after(execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any) {
        this.throwIfTestInProgress("after");
        this.queueStacks["after"].pushOnTop(execBlock);
    }

    afterEach(execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any) {
        this.throwIfTestInProgress("afterEach");
        this.queueStacks["afterEach"].pushOnTop(execBlock);
    }

    /**
     * Triggers a test run based on the describes and its added previously.
     *
     * If a test is already in progress, an error will be returned.
     */
    run(): Promise<RunResults> {
        if (this.currentRun) {
            throw new Error("Can't start a test run if one is already in progress!");
        }

        const startTime = Date.now();
        this.currentRun = this.runNextTestQueue().then(() => {
            const results = this.runResults;
            results.elapsedTimeMs = Date.now() - startTime;
            this.currentRun = null;

            this.resetRunResults();
            return results;
        }).catch((e) => {
            this.currentRun = null;
            throw e;
        });

        return this.currentRun;
    }

    /**
     * If a test is in progress, the current information for the test will be returned.
     *
     * If not, an error will be thrown.
     */
    getCurrentTestInfo(): TestInfo {
        if (!this.currentTest) {
            throw new Error("Can't obtain TestInfo if not actively in a test!");
        }

        return this.currentTest;
    }

    /**
     * Resets all pending state, including all attached before, beforeEach, after, afterEach, tests, describes, etc.
     *
     * If a test run is already in progress, an error will be thrown.
     */
    reset(): void {
        if (this.currentRun) {
            throw new Error("Can't reset if a test run is already in progress!");
        }

        this.resetRunResults();
        this.testRunCancelled = false;
        this.testQueueStack = [];
        for (const type of QueueStackTypes) {
            this.queueStacks[type].reset();
        }
    }

    cancel(): Promise<RunResults> {
        if (!this.currentRun) {
            return Promise.reject(new Error("Not currently executing a test run! Unable to cancel accordingly."));
        }

        this.testRunCancelled = true;
        return this.currentRun.then((results) => {
            this.reset();
            return results;
        });
    }

    private pushToCurrentTestQueue(type: "it" | "describe", title: string, execBlock: () => void, only?: boolean, timeoutMs?: number, skip?: boolean) {
        if (this.testQueueStack.length === 0) {
            const testQueue: TestQueue = {
                describeTitleChain: [],
                tests: [],
                evaluatedBefores: false,
                skipAllTests: type === "describe" && skip,
                firstOnlyIndex: only ? 0 : null
            };
            this.testQueueStack.push(testQueue);
        }

        const currentEntry = this.testQueueStack[this.testQueueStack.length - 1];
        const testEntry: TestEntry = {
            type: type,
            callback: execBlock,
            describeTitleChain: currentEntry.describeTitleChain,
            title: title,
            absoluteFilePath: this.lastFilePathSet,
            skip: skip || currentEntry.skipAllTests
        };

        if (only && currentEntry.firstOnlyIndex === null) {
            currentEntry.firstOnlyIndex = currentEntry.tests.length;
        }

        if (timeoutMs > 0) {
            testEntry.timeoutMs = timeoutMs;
        }

        currentEntry.tests.push(testEntry);
    }

    private runNextTestQueue = async (): Promise<void> => {
        if (this.testQueueStack.length === 0) {
            return;
        }

        let evaluatedTest = false;
        const queue = this.testQueueStack.shift();
        if (queue.firstOnlyIndex !== null) {
            evaluatedTest = await this.executeTest(queue, queue.tests[queue.firstOnlyIndex]);
        } else {
            for (let i = 0; i < queue.tests.length; i++) {
                evaluatedTest = await this.executeTest(queue, queue.tests[i]) || evaluatedTest;
            }
        }

        if (evaluatedTest) {
            await this.evaluateQueueWithTimeout("after");
        }
    };

    private async executeTest(queue: TestQueue, entry: TestEntry): Promise<boolean> {
        if (entry.absoluteFilePath !== this.currentlyExecutingFilePath) {
            this.currentlyExecutingFilePath = entry.absoluteFilePath;
        }

        if (this.testRunCancelled) {
            return false;
        } else if (entry.type === "describe") {
            return this.evaluateDescribe(queue, entry);
        } else {
            return this.evaluateTest(queue, entry);
        }
    }

    private async evaluateDescribe(queue: TestQueue, entry: TestEntry): Promise<boolean> {
        this.testQueueStack.push({
            describeTitleChain: [].concat(queue.describeTitleChain, entry.title),
            tests: [],
            evaluatedBefores: false,
            skipAllTests: entry.skip,
            firstOnlyIndex: null
        });

        for (const type of QueueStackTypes) {
            this.queueStacks[type].pushStack([]);
        }

        await this.asyncPromisifier.exec(entry.callback, "describe");
        await this.runNextTestQueue();

        for (const type of QueueStackTypes) {
            this.queueStacks[type].shiftStack();
        }

        return false;
    }

    private async evaluateTest(queue: TestQueue, entry: TestEntry): Promise<boolean> {
        if (entry.skip) {
            const testResults: TestResults = {
                result: "skipped",
                testInfo: entry,
                elapsedMs: 0
            };

            this.eventEmitter.emit("onTestResult", testResults as TestResults);
            return false;
        }

        if (!queue.evaluatedBefores) {
            queue.evaluatedBefores = true;
            await this.evaluateQueueWithTimeout("before");
        }
        await this.evaluateQueueWithTimeout("beforeEach");

        this.currentTest = entry;

        try {
            await this.executeTestCallback(entry, queue.describeTitleChain);
            await this.evaluateQueueWithTimeout("afterEach");
        } finally {
            this.runResults.totalTests++;
            this.currentTest = null;
        }

        return true;
    }

    private async executeTestCallback(entry: TestEntry, titleChain: string[]): Promise<void> {
        const startTime = Date.now();
        const timeoutValue = entry.timeoutMs >= 0 ? entry.timeoutMs : this.getTimeoutValue("it");

        const testResults: Partial<TestResults> = {
            testInfo: entry
        };

        try {
            await this.timeoutPromisifier.wrap(this.asyncPromisifier.exec(entry.callback, "Test: " + entry.title), timeoutValue);
            await this.eventEmitter.emitAndWaitForCompletion("beforeTestSuccess", entry);

            this.runResults.totalSuccesses++;
            testResults.result = "success";
        } catch (error) {
            if (error instanceof TimeoutError) {
                this.runResults.totalTimeouts++;
                testResults.result = "timeout";
            } else {
                this.runResults.totalFailures++;
                testResults.result = "fail";
                testResults.error = error;
            }

            // If we want to stop additional execution on the first fail, just cancel the rest of the run.
            if (this.config.stopOnFirstFail) {
                this.testRunCancelled = true;
            }
        }

        testResults.elapsedMs = Date.now() - startTime;
        this.runResults.testResults.push(testResults as TestResults);
        this.eventEmitter.emit("onTestResult", testResults as TestResults);
    }

    private evaluateQueueWithTimeout(type: QueueStackType): Promise<void> {
        return this.timeoutPromisifier.wrap(this.evaluateQueue(type), this.getTimeoutValue(type));
    }

    private evaluateQueue(type: QueueStackType): Promise<void> {
        const queueStack = this.queueStacks[type];
        if (type === "before" || type === "beforeEach") {
            return queueStack.traverseLevelOrder((callback) => this.asyncPromisifier.exec(callback, type));
        } else {
            return queueStack.traverseInverseLevelOrder((callback) => this.asyncPromisifier.exec(callback, type));
        }
    }

    private getTimeoutValue<T extends keyof TimeoutConfig>(type: T): number {
        const timeout: number | TimeoutConfig = this.config.timeoutMs;
        return typeof timeout === "number" ? timeout : timeout[type];
    }

    private throwIfTestInProgress = (name: string): void => {
        if (this.currentTest) {
            throw new Error(`Cannot add an ${name} block while executing a test!`);
        }
    };

    private resetRunResults = () => {
        this.runResults = {
            elapsedTimeMs: 0,
            totalTests: 0,
            totalSuccesses: 0,
            totalFailures: 0,
            totalTimeouts: 0,
            testResults: []
        };
    }
}

export {TestRunner};
