var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AsyncPromisifier } from "./Async/AsyncPromisifier";
import { TimeoutError, TimeoutPromisifier } from "./Async/TimeoutPromisifier";
import { mergeConfig } from "./Config/TestRunnerConfig";
import { DefaultTestRunnerConfig } from "./Config/DefaultTestRunnerConfig";
import { SimpleEventEmitter } from "./EventEmitter/SimpleEventEmitter";
const QueueStackTypes = ["before", "beforeEach", "after", "afterEach"];
/**
 * before -> beforeEach -> beforeHook -> it -> afterHook -> afterEach -> after
 */
class TestRunner {
    constructor(config, eventEmitter = new SimpleEventEmitter()) {
        this.asyncPromisifier = new AsyncPromisifier();
        this.timeoutPromisifier = new TimeoutPromisifier();
        this.testQueueStack = [];
        this.queueStacks = {
            "before": [],
            "beforeEach": [],
            "after": [],
            "afterEach": []
        };
        this.currentTest = null;
        this.testRunCancelled = false;
        // This madness is needed to support function/object hybrids, which is remarkably useful but obnoxious in TS.
        this.describe = ((title, execBlock) => {
            this.throwIfTestInProgress("describe");
            this.pushToCurrentTestQueue("describe", title, execBlock);
        });
        this.describeOnly = (title, execBlock) => {
            this.throwIfTestInProgress("describe.only");
            this.pushToCurrentTestQueue("describe", title, execBlock, true);
        };
        this.it = ((title, execBlock, options) => {
            this.throwIfTestInProgress("it");
            this.pushToCurrentTestQueue("it", title, execBlock, false, options ? options.timeoutMs : undefined);
        });
        this.itOnly = (title, execBlock, options) => {
            this.throwIfTestInProgress("it.only");
            this.pushToCurrentTestQueue("it", title, execBlock, true, options ? options.timeoutMs : undefined);
        };
        this.runNextTestQueue = () => __awaiter(this, void 0, void 0, function* () {
            if (this.testQueueStack.length === 0) {
                return;
            }
            let evaluatedTest = false;
            const queue = this.testQueueStack.shift();
            if (queue.firstOnlyIndex !== null) {
                evaluatedTest = yield this.executeTest(queue, queue.tests[queue.firstOnlyIndex]);
            }
            else {
                for (let i = 0; i < queue.tests.length; i++) {
                    const testExecuted = yield this.executeTest(queue, queue.tests[i]);
                    evaluatedTest = evaluatedTest || testExecuted;
                }
            }
            if (evaluatedTest) {
                yield this.evaluateQueueWithTimeout("after");
            }
        });
        this.throwIfTestInProgress = (name) => {
            if (this.currentTest) {
                throw new Error(`Cannot add an ${name} block while executing a test!`);
            }
        };
        this.resetRunResults = () => {
            this.runResults = {
                elapsedTimeMs: 0,
                totalTests: 0,
                totalSuccesses: 0,
                totalFailures: 0,
                totalTimeouts: 0,
                failureInfo: [],
                timeoutInfo: []
            };
        };
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
    setCurrentFile(absolutePath) {
        this.lastFilePathSet = absolutePath;
    }
    on(event, callback) {
        this.eventEmitter.on(event, callback);
    }
    once(event, callback) {
        this.eventEmitter.once(event, callback);
    }
    off(event, callback) {
        this.eventEmitter.off(event, callback);
    }
    before(execBlock) {
        this.throwIfTestInProgress("before");
        const beforeQueueStack = this.queueStacks["before"];
        if (beforeQueueStack.length === 0) {
            beforeQueueStack.push([execBlock]);
        }
        else {
            beforeQueueStack[0].push(execBlock);
        }
    }
    beforeEach(execBlock) {
        this.throwIfTestInProgress("beforeEach");
        const beforeEachQueueStack = this.queueStacks["beforeEach"];
        if (beforeEachQueueStack.length === 0) {
            beforeEachQueueStack.push([execBlock]);
        }
        else {
            beforeEachQueueStack[0].push(execBlock);
        }
    }
    after(execBlock) {
        this.throwIfTestInProgress("after");
        const afterQueueStack = this.queueStacks["after"];
        if (afterQueueStack.length === 0) {
            afterQueueStack.push([execBlock]);
        }
        else {
            afterQueueStack[0].push(execBlock);
        }
    }
    afterEach(execBlock) {
        this.throwIfTestInProgress("afterEach");
        const afterEachQueueStack = this.queueStacks["afterEach"];
        if (afterEachQueueStack.length === 0) {
            afterEachQueueStack.push([execBlock]);
        }
        else {
            afterEachQueueStack[0].push(execBlock);
        }
    }
    /**
     * Triggers a test run based on the describes and its added previously.
     *
     * If a test is already in progress, an error will be returned.
     */
    run() {
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
    getCurrentTestInfo() {
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
    reset() {
        if (this.currentRun) {
            throw new Error("Can't reset if a test run is already in progress!");
        }
        this.resetRunResults();
        this.testRunCancelled = false;
        this.testQueueStack = [];
        for (const type of QueueStackTypes) {
            this.queueStacks[type] = [[]];
        }
    }
    cancel() {
        if (!this.currentRun) {
            return Promise.reject(new Error("Not currently executing a test run! Unable to cancel accordingly."));
        }
        this.testRunCancelled = true;
        return this.currentRun.then((results) => {
            this.reset();
            return results;
        });
    }
    pushToCurrentTestQueue(type, title, execBlock, only, timeoutMs) {
        if (this.testQueueStack.length === 0) {
            const testQueue = {
                titleChain: [],
                tests: [],
                evaluatedBefores: false,
                firstOnlyIndex: only ? 0 : null
            };
            this.testQueueStack.push(testQueue);
        }
        const currentEntry = this.testQueueStack[this.testQueueStack.length - 1];
        const testEntry = {
            title: title,
            type: type,
            callback: execBlock,
            absoluteFilePath: this.lastFilePathSet
        };
        if (only && currentEntry.firstOnlyIndex === null) {
            currentEntry.firstOnlyIndex = currentEntry.tests.length;
        }
        if (timeoutMs > 0) {
            testEntry.timeoutMs = timeoutMs;
        }
        currentEntry.tests.push(testEntry);
    }
    executeTest(queue, entry) {
        return __awaiter(this, void 0, void 0, function* () {
            if (entry.absoluteFilePath !== this.currentlyExecutingFilePath) {
                this.currentlyExecutingFilePath = entry.absoluteFilePath;
                this.eventEmitter.emit("activeFileChanged", this.currentlyExecutingFilePath);
            }
            if (this.testRunCancelled) {
                return false;
            }
            else if (entry.type === "describe") {
                return this.evaluateDescribe(queue, entry);
            }
            else {
                return this.evaluateTest(queue, entry);
            }
        });
    }
    evaluateDescribe(queue, entry) {
        return __awaiter(this, void 0, void 0, function* () {
            this.testQueueStack.push({
                titleChain: [].concat(queue.titleChain, entry.title),
                tests: [],
                evaluatedBefores: false,
                firstOnlyIndex: null
            });
            for (const type of QueueStackTypes) {
                this.queueStacks[type].push([]);
            }
            this.eventEmitter.emit("beforeDescribe", entry.title);
            const startTime = Date.now();
            yield this.asyncPromisifier.exec(entry.callback, "describe");
            yield this.runNextTestQueue();
            for (const type of QueueStackTypes) {
                // Befores operate outside-in, first-last.
                if (type === "before" || type === "beforeEach") {
                    this.queueStacks[type].pop();
                }
                else {
                    this.queueStacks[type].shift();
                }
            }
            const describeDurationMs = Date.now() - startTime;
            this.eventEmitter.emit("afterDescribe", entry.title, describeDurationMs);
            return false;
        });
    }
    evaluateTest(queue, entry) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!queue.evaluatedBefores) {
                queue.evaluatedBefores = true;
                yield this.evaluateQueueWithTimeout("before");
            }
            return this.evaluateQueueWithTimeout("beforeEach")
                .then(() => {
                this.eventEmitter.emit("beforeTest", entry.title);
                const startTime = Date.now();
                this.currentTest = entry;
                const timeoutValue = entry.timeoutMs >= 0 ? entry.timeoutMs : this.getTimeoutValue("it");
                return this.timeoutPromisifier.wrap(this.asyncPromisifier.exec(entry.callback, "Test: " + entry.title), timeoutValue)
                    .then(() => this.eventEmitter.emitAndWaitForCompletion("beforeTestSuccess", entry.title))
                    .then(() => {
                    this.runResults.totalSuccesses++;
                    const testDurationMs = Date.now() - startTime;
                    this.eventEmitter.emit("testSuccess", entry.title, testDurationMs);
                })
                    .catch((error) => {
                    if (error instanceof TimeoutError) {
                        this.runResults.totalTimeouts++;
                        this.runResults.timeoutInfo.push({
                            describeChain: queue.titleChain,
                            title: entry.title,
                            elapsedMs: error.elapsedMs,
                            timeoutMs: error.timeoutMs
                        });
                        this.eventEmitter.emit("testTimeout", entry.title, error.elapsedMs, error.timeoutMs);
                    }
                    else {
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
                    .then(() => {
                    this.runResults.totalTests++;
                    this.currentTest = null;
                })
                    .catch((e) => {
                    this.runResults.totalTests++;
                    this.currentTest = null;
                    throw e;
                });
            }).then(() => true);
        });
    }
    evaluateQueueWithTimeout(type) {
        return this.timeoutPromisifier.wrap(this.evaluateQueue(type), this.getTimeoutValue(type));
    }
    evaluateQueue(type) {
        const queueStack = this.queueStacks[type];
        let promise = Promise.resolve();
        if (type === "before" || type === "beforeEach") {
            // Befores operate outside-in, first-last.
            for (let i = 0; i < queueStack.length; i++) {
                const queue = queueStack[i];
                for (let j = 0; j < queue.length; j++) {
                    promise = promise.then(() => this.asyncPromisifier.exec(queue[j], type));
                }
            }
        }
        else {
            // Afters operate inside-out, last-first
            for (let i = queueStack.length - 1; i >= 0; i--) {
                const queue = queueStack[i];
                for (let j = queue.length - 1; j >= 0; j--) {
                    promise = promise.then(() => this.asyncPromisifier.exec(queue[j], type));
                }
            }
        }
        return promise;
    }
    getTimeoutValue(type) {
        if (typeof this.config.timeoutMs === "number") {
            return this.config.timeoutMs;
        }
        else {
            return this.config.timeoutMs[type];
        }
    }
}
export { TestRunner };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVzdFJ1bm5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9UZXN0UnVubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUdBLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQzFELE9BQU8sRUFBQyxZQUFZLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM1RSxPQUFPLEVBQUMsV0FBVyxFQUFrQyxNQUFNLDJCQUEyQixDQUFDO0FBQ3ZGLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBRXpFLE9BQU8sRUFBZ0Isa0JBQWtCLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQWVwRixNQUFNLGVBQWUsR0FBRyxDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBY3ZFOztHQUVHO0FBQ0gsTUFBTSxVQUFVO0lBeUJaLFlBQVksTUFBeUIsRUFBRSxlQUFlLElBQUksa0JBQWtCLEVBQVk7UUF2QnZFLHFCQUFnQixHQUFHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztRQUMxQyx1QkFBa0IsR0FBRyxJQUFJLGtCQUFrQixFQUFFLENBQUM7UUFLdkQsbUJBQWMsR0FBZ0IsRUFBRSxDQUFDO1FBQ2pDLGdCQUFXLEdBQXdDO1lBQ3ZELFFBQVEsRUFBRSxFQUFFO1lBQ1osWUFBWSxFQUFFLEVBQUU7WUFDaEIsT0FBTyxFQUFFLEVBQUU7WUFDWCxXQUFXLEVBQUUsRUFBRTtTQUNsQixDQUFDO1FBRU0sZ0JBQVcsR0FBcUIsSUFBSSxDQUFDO1FBQ3JDLHFCQUFnQixHQUFZLEtBQUssQ0FBQztRQXNDMUMsNkdBQTZHO1FBQ3BHLGFBQVEsR0FBMkIsQ0FBQyxDQUFDLEtBQWEsRUFBRSxTQUFxQixFQUFFLEVBQUU7WUFDbEYsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxzQkFB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