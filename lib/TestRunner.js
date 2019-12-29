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
            callback: execBlock
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVzdFJ1bm5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9UZXN0UnVubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQzFELE9BQU8sRUFBQyxZQUFZLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM1RSxPQUFPLEVBQUMsV0FBVyxFQUFrQyxNQUFNLDJCQUEyQixDQUFDO0FBQ3ZGLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBRXpFLE9BQU8sRUFBZ0Isa0JBQWtCLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQWFwRixNQUFNLGVBQWUsR0FBRyxDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBY3ZFOztHQUVHO0FBQ0gsTUFBTSxVQUFVO0lBd0JaLFlBQVksTUFBeUIsRUFBRSxlQUFlLElBQUksa0JBQWtCLEVBQVk7UUF0QnZFLHFCQUFnQixHQUFHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztRQUMxQyx1QkFBa0IsR0FBRyxJQUFJLGtCQUFrQixFQUFFLENBQUM7UUFLdkQsbUJBQWMsR0FBZ0IsRUFBRSxDQUFDO1FBQ2pDLGdCQUFXLEdBQXdDO1lBQ3ZELFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNkLFlBQVksRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNsQixPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDYixXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUM7U0FDcEIsQ0FBQztRQUVNLHNCQUFpQixHQUFZLEtBQUssQ0FBQztRQUNuQyxnQkFBVyxHQUFZLEtBQUssQ0FBQztRQUM3QixnQkFBVyxHQUFxQixJQUFJLENBQUM7UUFDckMscUJBQWdCLEdBQVksS0FBSyxDQUFDO1FBMkIxQyw2R0FBNkc7UUFDcEcsYUFBUSxHQUEyQixDQUFDLENBQUMsS0FB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