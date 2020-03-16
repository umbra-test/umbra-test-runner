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
            "before": [[]],
            "beforeEach": [[]],
            "after": [[]],
            "afterEach": [[]]
        };
        this.hasAnOnlyDescribe = false;
        this.hasAnOnlyIt = false;
        this.currentTest = null;
        this.testRunCancelled = false;
        // This madness is needed to support function/object hybrids, which is remarkably useful but obnoxious in TS.
        this.describe = ((title, execBlock) => {
            this.throwIfTestInProgress("describe");
            this.pushToCurrentTestQueue("describe", title, execBlock);
        });
        this.describeOnly = (title, execBlock) => {
            this.throwIfTestInProgress("describe.only");
            this.hasAnOnlyDescribe = true;
            this.pushToCurrentTestQueue("describe", title, execBlock, true);
        };
        this.it = ((title, execBlock, options) => {
            this.throwIfTestInProgress("it");
            this.pushToCurrentTestQueue("it", title, execBlock, false, options ? options.timeoutMs : undefined);
        });
        this.itOnly = (title, execBlock, options) => {
            this.throwIfTestInProgress("it.only");
            this.hasAnOnlyIt = true;
            this.pushToCurrentTestQueue("it", title, execBlock, true, options ? options.timeoutMs : undefined);
        };
        this.runNextTestQueue = () => {
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
                    }
                    else {
                        return this.evaluateTest(queue, entry)
                            .then((evaluatedATest) => {
                            evaluatedTest = evaluatedATest;
                        });
                    }
                });
            }
            return promise.then(() => {
                if (evaluatedTest) {
                    return this.evaluateQueueWithTimeout("after");
                }
            });
        };
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
        beforeQueueStack[0].push(execBlock);
    }
    beforeEach(execBlock) {
        this.throwIfTestInProgress("beforeEach");
        const beforeEachQueueStack = this.queueStacks["beforeEach"];
        beforeEachQueueStack[0].push(execBlock);
    }
    after(execBlock) {
        this.throwIfTestInProgress("after");
        const afterQueueStack = this.queueStacks["after"];
        afterQueueStack[0].push(execBlock);
    }
    afterEach(execBlock) {
        this.throwIfTestInProgress("afterEach");
        const afterEachQueueStack = this.queueStacks["afterEach"];
        afterEachQueueStack[0].push(execBlock);
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
        this.hasAnOnlyIt = false;
        this.hasAnOnlyDescribe = false;
        this.testQueueStack = [];
        for (const type of QueueStackTypes) {
            this.queueStacks[type] = [[]];
        }
    }
    cancel() {
        if (!this.currentRun) {
            return;
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
                evaluatedBefores: false
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
        if (only) {
            testEntry.only = only;
        }
        if (timeoutMs > 0) {
            testEntry.timeoutMs = timeoutMs;
        }
        currentEntry.tests.push(testEntry);
    }
    evaluateDescribe(queue, entry) {
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
    evaluateTest(queue, entry) {
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
                .finally(() => {
                this.runResults.totalTests++;
                this.currentTest = null;
            });
        })).then(() => true);
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
                    promise = promise.then(() => this.asyncPromisifier.exec(queue[j]));
                }
            }
        }
        else {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVzdFJ1bm5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9UZXN0UnVubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQzFELE9BQU8sRUFBQyxZQUFZLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM1RSxPQUFPLEVBQUMsV0FBVyxFQUFrQyxNQUFNLDJCQUEyQixDQUFDO0FBQ3ZGLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBRXpFLE9BQU8sRUFBZ0Isa0JBQWtCLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQWNwRixNQUFNLGVBQWUsR0FBRyxDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBY3ZFOztHQUVHO0FBQ0gsTUFBTSxVQUFVO0lBMkJaLFlBQVksTUFBeUIsRUFBRSxlQUFlLElBQUksa0JBQWtCLEVBQVk7UUF6QnZFLHFCQUFnQixHQUFHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztRQUMxQyx1QkFBa0IsR0FBRyxJQUFJLGtCQUFrQixFQUFFLENBQUM7UUFLdkQsbUJBQWMsR0FBZ0IsRUFBRSxDQUFDO1FBQ2pDLGdCQUFXLEdBQXdDO1lBQ3ZELFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNkLFlBQVksRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNsQixPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDYixXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUM7U0FDcEIsQ0FBQztRQUVNLHNCQUFpQixHQUFZLEtBQUssQ0FBQztRQUNuQyxnQkFBVyxHQUFZLEtBQUssQ0FBQztRQUM3QixnQkFBVyxHQUFxQixJQUFJLENBQUM7UUFDckMscUJBQWdCLEdBQVksS0FBSyxDQUFDO1FBc0MxQyw2R0FBNkc7UUFDcEcsYUFBUSxHQUEyQixDQUFDLENBQUMsS0FB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