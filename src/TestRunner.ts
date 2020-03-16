import {EventMap} from "./EventMap";
import {TestInfo} from "./TestInfo";
import {RunResults} from "./RunResults";
import {AsyncPromisifier} from "./Async/AsyncPromisifier";
import {TimeoutError, TimeoutPromisifier} from "./Async/TimeoutPromisifier";
import {mergeConfig, TestRunnerConfig, TimeoutConfig} from "./Config/TestRunnerConfig";
import {DefaultTestRunnerConfig} from "./Config/DefaultTestRunnerConfig";
import {ItOptions} from "./Config/ItOptions";
import {EventCallback, SimpleEventEmitter} from "./EventEmitter/SimpleEventEmitter";

interface TestEntry extends TestInfo {
    type: "describe" | "it";
    absoluteFilePath: string | undefined;
}

interface TestQueue {
    titleChain: string[];
    tests: TestEntry[];
    evaluatedBefores: boolean;
}

type QueueStackType = "before" | "beforeEach" | "after" | "afterEach";
const QueueStackTypes = ["before", "beforeEach", "after", "afterEach"];

interface ItWithSubMethods {
    (title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any, options?: Partial<ItOptions>): void;

    only(title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any, options?: Partial<ItOptions>);
}

interface DescribeWithSubMethods {
    (title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any): void;

    only(title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any);
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
    private queueStacks: { [key: string]: (() => void)[][] } = {
        "before": [[]],
        "beforeEach": [[]],
        "after": [[]],
        "afterEach": [[]]
    };

    private hasAnOnlyDescribe: boolean = false;
    private hasAnOnlyIt: boolean = false;
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
        this.hasAnOnlyDescribe = true;
        this.pushToCurrentTestQueue("describe", title, execBlock, true);
    };

    readonly it: ItWithSubMethods = ((title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any, options?: Partial<ItOptions>): void => {
        this.throwIfTestInProgress("it");
        this.pushToCurrentTestQueue("it", title, execBlock, false, options ? options.timeoutMs : undefined);
    }) as ItWithSubMethods;

    private itOnly = (title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any, options?: Partial<ItOptions>): void => {
        this.throwIfTestInProgress("it.only");
        this.hasAnOnlyIt = true;
        this.pushToCurrentTestQueue("it", title, execBlock, true, options ? options.timeoutMs : undefined);
    };

    before(execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any) {
        this.throwIfTestInProgress("before");
        const beforeQueueStack = this.queueStacks["before"];
        beforeQueueStack[0].push(execBlock);
    }

    beforeEach(execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any) {
        this.throwIfTestInProgress("beforeEach");
        const beforeEachQueueStack = this.queueStacks["beforeEach"];
        beforeEachQueueStack[0].push(execBlock);
    }

    after(execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any) {
        this.throwIfTestInProgress("after");
        const afterQueueStack = this.queueStacks["after"];
        afterQueueStack[0].push(execBlock);
    }

    afterEach(execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any) {
        this.throwIfTestInProgress("afterEach");
        const afterEachQueueStack = this.queueStacks["afterEach"];
        afterEachQueueStack[0].push(execBlock);
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

        this.currentRun = this.runNextTestQueue().then(() => {
            const results = this.runResults;
            this.resetRunResults();

            return results;
        }).finally(() => {
            this.currentRun = null;
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
        this.hasAnOnlyIt = false;
        this.hasAnOnlyDescribe = false;
        this.testQueueStack = [];
        for (const type of QueueStackTypes) {
            this.queueStacks[type] = [[]];
        }
    }

    cancel(): Promise<RunResults> {
        if (!this.currentRun) {
            return;
        }

        this.testRunCancelled = true;
        return this.currentRun.then((results) => {
            this.reset();
            return results;
        });
    }

    private pushToCurrentTestQueue(type: "it" | "describe", title: string, execBlock: () => void, only?: boolean, timeoutMs?: number) {
        if (this.testQueueStack.length === 0) {
            const testQueue: TestQueue = {
                titleChain: [],
                tests: [],
                evaluatedBefores: false
            };
            this.testQueueStack.push(testQueue);
        }

        const currentEntry = this.testQueueStack[this.testQueueStack.length - 1];
        const testEntry: TestEntry = {
            title: title,
            type: type,
            callback: execBlock,
            absoluteFilePath: this.lastFilePathSet
        };

        if (only) {
            testEntry.only = only;
        }

        if (timeoutMs > 0) {
            testEntry.timeoutMs = timeoutMs;
        }

        currentEntry.tests.push(testEntry);
    }

    private runNextTestQueue = (): Promise<void> => {
        if (this.testQueueStack.length === 0) {
            return Promise.resolve();
        }

        const queue = this.testQueueStack.shift();
        let evaluatedTest = false;

        let promise = Promise.resolve();
        for (let i = 0; i < queue.tests.length; i++) {
            const entry = queue.tests[i];
            if (entry.absoluteFilePath !== this.currentlyExecutingFilePath) {
                this.currentlyExecutingFilePath = entry.absoluteFilePath;
                this.eventEmitter.emit("activeFileChanged", this.currentlyExecutingFilePath);
            }

            promise = promise.then(() => {
                if (this.testRunCancelled) {
                    return;
                }
                if (entry.type === "describe") {
                    return this.evaluateDescribe(queue, entry);
                } else {
                    return this.evaluateTest(queue, entry)
                        .then((evaluatedATest: boolean) => {
                            evaluatedTest = evaluatedATest;
                        });
                }
            });
        }

        return promise.then(() => {
            if (evaluatedTest) {
                return this.evaluateQueueWithTimeout("after")
            }
        });
    };

    private evaluateDescribe(queue: TestQueue, entry: TestEntry): Promise<void> {
        if (this.hasAnOnlyDescribe && !entry.only) {
            return Promise.resolve();
        }

        this.testQueueStack.push({
            titleChain: [].concat(queue.titleChain, entry.title),
            tests: [],
            evaluatedBefores: false
        });

        for (const type of QueueStackTypes) {
            this.queueStacks[type].push([]);
        }

        this.eventEmitter.emit("beforeDescribe", entry.title);

        const startTime = Date.now();
        return this.asyncPromisifier.exec(entry.callback)
            .then(this.runNextTestQueue)
            .then(() => {
                for (const type of QueueStackTypes) {
                    this.queueStacks[type].shift();
                }

                const describeDurationMs = Date.now() - startTime;
                this.eventEmitter.emit("afterDescribe", entry.title, describeDurationMs);
            });
    }

    private evaluateTest(queue: TestQueue, entry: TestEntry): Promise<boolean> {
        if (this.hasAnOnlyIt && !entry.only) {
            return Promise.resolve(false);
        }

        let promise = Promise.resolve();
        if (!queue.evaluatedBefores) {
            queue.evaluatedBefores = true;
            promise = promise.then(() => this.evaluateQueueWithTimeout("before"));
        }

        return promise.then(() => this.evaluateQueueWithTimeout("beforeEach")
            .then(() => {
                    this.eventEmitter.emit("beforeTest", entry.title);
                    const startTime = Date.now();
                    this.currentTest = entry;

                    const timeoutValue = entry.timeoutMs >= 0 ? entry.timeoutMs : this.getTimeoutValue("it");
                    return this.timeoutPromisifier.wrap(this.asyncPromisifier.exec(entry.callback), timeoutValue)
                        .then(() => this.eventEmitter.emitAndWaitForCompletion("beforeTestSuccess", entry.title))
                        .then(() => {
                            this.runResults.totalSuccesses++;

                            const testDurationMs = Date.now() - startTime;
                            this.eventEmitter.emit("testSuccess", entry.title, testDurationMs);
                        })
                        .catch((error: Error) => {
                            if (error instanceof TimeoutError) {
                                this.runResults.totalTimeouts++;
                                this.runResults.timeoutInfo.push({
                                    describeChain: queue.titleChain,
                                    title: entry.title,
                                    elapsedMs: error.elapsedMs,
                                    timeoutMs: error.timeoutMs
                                });
                                this.eventEmitter.emit("testTimeout", entry.title, error.elapsedMs, error.timeoutMs);
                            } else {
                                this.runResults.totalFailures++;
                                this.runResults.failureInfo.push({
                                    describeChain: queue.titleChain,
                                    title: entry.title,
                                    error: error
                                });
                                this.eventEmitter.emit("testFail", entry.title, error, Date.now() - startTime);
                            }

                            // If we want to stop additional execution on the first fail, just cancel the rest of the run.
                            if (this.config.stopOnFirstFail) {
                                this.testRunCancelled = true;
                            }
                        })
                        .then(() => this.evaluateQueueWithTimeout("afterEach"))
                        .finally(() => {
                            this.runResults.totalTests++;
                            this.currentTest = null;
                        });
                }
            )).then(() => true);
    }

    private evaluateQueueWithTimeout(type: QueueStackType): Promise<void> {
        return this.timeoutPromisifier.wrap(this.evaluateQueue(type), this.getTimeoutValue(type));
    }

    private evaluateQueue(type: QueueStackType): Promise<void> {
        const queueStack = this.queueStacks[type];
        let promise = Promise.resolve();

        if (type === "before" || type === "beforeEach") {
            // Befores operate outside-in, first-last.
            for (let i = 0; i < queueStack.length; i++) {
                const queue = queueStack[i];
                for (let j = 0; j < queue.length; j++) {
                    promise = promise.then(() => this.asyncPromisifier.exec(queue[j]));
                }
            }
        } else {
            // Afters operate inside-out, last-first
            for (let i = queueStack.length - 1; i >= 0; i--) {
                const queue = queueStack[i];
                for (let j = queue.length - 1; j >= 0; j--) {
                    promise = promise.then(() => this.asyncPromisifier.exec(queue[j]));
                }
            }
        }

        return promise;
    }

    private getTimeoutValue<T extends keyof TimeoutConfig>(type: T): number {
        if (typeof this.config.timeoutMs === "number") {
            return this.config.timeoutMs;
        } else {
            return this.config.timeoutMs[type];
        }
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
            failureInfo: [],
            timeoutInfo: []
        };
    }
}

export {TestRunner};
