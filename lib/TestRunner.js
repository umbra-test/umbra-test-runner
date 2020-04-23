"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const AsyncPromisifier_1 = require("./Async/AsyncPromisifier");
const TimeoutPromisifier_1 = require("./Async/TimeoutPromisifier");
const TestRunnerConfig_1 = require("./Config/TestRunnerConfig");
const DefaultTestRunnerConfig_1 = require("./Config/DefaultTestRunnerConfig");
const SimpleEventEmitter_1 = require("./EventEmitter/SimpleEventEmitter");
const QueueStack_1 = require("./QueueStack");
const QueueStackTypes = ["before", "beforeEach", "after", "afterEach"];
/**
 * before -> beforeEach -> beforeHook -> it -> afterHook -> afterEach -> after
 */
class TestRunner {
    constructor(config, eventEmitter = new SimpleEventEmitter_1.SimpleEventEmitter()) {
        this.asyncPromisifier = new AsyncPromisifier_1.AsyncPromisifier();
        this.timeoutPromisifier = new TimeoutPromisifier_1.TimeoutPromisifier();
        this.testQueueStack = [];
        this.queueStacks = {
            "before": new QueueStack_1.QueueStack(),
            "beforeEach": new QueueStack_1.QueueStack(),
            "after": new QueueStack_1.QueueStack(),
            "afterEach": new QueueStack_1.QueueStack()
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
        this.describeSkip = (title, execBlock, options) => {
            this.throwIfTestInProgress("describe.skip");
            this.pushToCurrentTestQueue("describe", title, execBlock, false, undefined, true);
        };
        this.it = ((title, execBlock, options) => {
            this.throwIfTestInProgress("it");
            this.pushToCurrentTestQueue("it", title, execBlock, false, options ? options.timeoutMs : undefined);
        });
        this.itOnly = (title, execBlock, options) => {
            this.throwIfTestInProgress("it.only");
            this.pushToCurrentTestQueue("it", title, execBlock, true, options ? options.timeoutMs : undefined);
        };
        this.itSkip = (title, execBlock, options) => {
            this.throwIfTestInProgress("it.skip");
            this.pushToCurrentTestQueue("it", title, execBlock, false, undefined, true);
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
                    evaluatedTest = (yield this.executeTest(queue, queue.tests[i])) || evaluatedTest;
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
        this.config = TestRunnerConfig_1.mergeConfig(DefaultTestRunnerConfig_1.DefaultTestRunnerConfig, config);
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
        this.queueStacks["before"].pushOnTop(execBlock);
    }
    beforeEach(execBlock) {
        this.throwIfTestInProgress("beforeEach");
        this.queueStacks["beforeEach"].pushOnTop(execBlock);
    }
    after(execBlock) {
        this.throwIfTestInProgress("after");
        this.queueStacks["after"].pushOnTop(execBlock);
    }
    afterEach(execBlock) {
        this.throwIfTestInProgress("afterEach");
        this.queueStacks["afterEach"].pushOnTop(execBlock);
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
            this.queueStacks[type].reset();
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
    pushToCurrentTestQueue(type, title, execBlock, only, timeoutMs, skip) {
        if (this.testQueueStack.length === 0) {
            const testQueue = {
                titleChain: [],
                tests: [],
                evaluatedBefores: false,
                skipAllTests: type === "describe" && skip,
                firstOnlyIndex: only ? 0 : null
            };
            this.testQueueStack.push(testQueue);
        }
        const currentEntry = this.testQueueStack[this.testQueueStack.length - 1];
        const testEntry = {
            title: title,
            type: type,
            callback: execBlock,
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
                skipAllTests: entry.skip,
                firstOnlyIndex: null
            });
            for (const type of QueueStackTypes) {
                this.queueStacks[type].pushStack([]);
            }
            this.eventEmitter.emit("beforeDescribe", entry.title);
            const startTime = Date.now();
            yield this.asyncPromisifier.exec(entry.callback, "describe");
            yield this.runNextTestQueue();
            for (const type of QueueStackTypes) {
                // Befores operate outside-in, first-last.
                if (type === "before" || type === "beforeEach") {
                    this.queueStacks[type].popStack();
                }
                else {
                    this.queueStacks[type].shiftStack();
                }
            }
            const describeDurationMs = Date.now() - startTime;
            this.eventEmitter.emit("afterDescribe", entry.title, describeDurationMs);
            return false;
        });
    }
    evaluateTest(queue, entry) {
        return __awaiter(this, void 0, void 0, function* () {
            if (entry.skip) {
                this.eventEmitter.emit("testSkipped", entry.title);
                return false;
            }
            if (!queue.evaluatedBefores) {
                queue.evaluatedBefores = true;
                yield this.evaluateQueueWithTimeout("before");
            }
            yield this.evaluateQueueWithTimeout("beforeEach");
            this.eventEmitter.emit("beforeTest", entry.title);
            this.currentTest = entry;
            try {
                yield this.executeTestCallback(entry, queue.titleChain);
                yield this.evaluateQueueWithTimeout("afterEach");
            }
            finally {
                this.runResults.totalTests++;
                this.currentTest = null;
            }
            return true;
        });
    }
    executeTestCallback(entry, titleChain) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const timeoutValue = entry.timeoutMs >= 0 ? entry.timeoutMs : this.getTimeoutValue("it");
            try {
                yield this.timeoutPromisifier.wrap(this.asyncPromisifier.exec(entry.callback, "Test: " + entry.title), timeoutValue);
                yield this.eventEmitter.emitAndWaitForCompletion("beforeTestSuccess", entry.title);
                this.runResults.totalSuccesses++;
                const testDurationMs = Date.now() - startTime;
                this.eventEmitter.emit("testSuccess", entry.title, testDurationMs);
            }
            catch (error) {
                if (error instanceof TimeoutPromisifier_1.TimeoutError) {
                    this.runResults.totalTimeouts++;
                    this.runResults.timeoutInfo.push({
                        describeChain: titleChain,
                        title: entry.title,
                        elapsedMs: error.elapsedMs,
                        timeoutMs: error.timeoutMs
                    });
                    this.eventEmitter.emit("testTimeout", entry.title, error.elapsedMs, error.timeoutMs);
                }
                else {
                    this.runResults.totalFailures++;
                    this.runResults.failureInfo.push({
                        describeChain: titleChain,
                        title: entry.title,
                        error: error
                    });
                    this.eventEmitter.emit("testFail", entry.title, error, Date.now() - startTime);
                }
                // If we want to stop additional execution on the first fail, just cancel the rest of the run.
                if (this.config.stopOnFirstFail) {
                    this.testRunCancelled = true;
                }
            }
        });
    }
    evaluateQueueWithTimeout(type) {
        return this.timeoutPromisifier.wrap(this.evaluateQueue(type), this.getTimeoutValue(type));
    }
    evaluateQueue(type) {
        const queueStack = this.queueStacks[type];
        if (type === "before" || type === "beforeEach") {
            return queueStack.traverseLevelOrder((callback) => this.asyncPromisifier.exec(callback, type));
        }
        else {
            return queueStack.traverseInverseLevelOrder((callback) => this.asyncPromisifier.exec(callback, type));
        }
    }
    getTimeoutValue(type) {
        const timeout = this.config.timeoutMs;
        return typeof timeout === "number" ? timeout : timeout[type];
    }
}
exports.TestRunner = TestRunner;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVzdFJ1bm5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9UZXN0UnVubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBR0EsK0RBQTBEO0FBQzFELG1FQUE0RTtBQUM1RSxnRUFBdUY7QUFDdkYsOEVBQXlFO0FBRXpFLDBFQUFvRjtBQUNwRiw2Q0FBd0M7QUFpQnhDLE1BQU0sZUFBZSxHQUFHLENBQUMsUUFBUSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFrQnZFOztHQUVHO0FBQ0gsTUFBTSxVQUFVO0lBeUJaLFlBQVksTUFBeUIsRUFBRSxlQUFlLElBQUksdUNBQWtCLEVBQVk7UUF2QnZFLHFCQUFnQixHQUFHLElBQUksbUNBQWdCLEVBQUUsQ0FBQztRQUMxQyx1QkFBa0IsR0FBRyxJQUFJLHVDQUFrQixFQUFFLENBQUM7UUFLdkQsbUJBQWMsR0FBZ0IsRUFBRSxDQUFDO1FBQ2pDLGdCQUFXLEdBQWtFO1lBQ2pGLFFBQVEsRUFBRSxJQUFJLHVCQUFVLEVBQUU7WUFDMUIsWUFBWSxFQUFFLElBQUksdUJBQVUsRUFBRTtZQUM5QixPQUFPLEVBQUUsSUFBSSx1QkFBVSxFQUFFO1lBQ3pCLFdBQVcsRUFBRSxJQUFJLHVCQUFVLEVBQUU7U0FDaEMsQ0FBQztRQUVNLGdCQUFXLEdBQXFCLElBQUksQ0FBQztRQUNyQyxxQkFBZ0IsR0FBWSxLQUFLLENBQUM7UUF5QzFDLDZHQUE2RztRQUNwRyxhQUFRLEdBQTJCLENBQUMsQ0FBQyxLQUFhLEVBQUUsU0FBcUIsRUFBRSxFQUFFO1lBQ2xGLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsc0JBQXNCLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztRQUM5RCxDQUFDLENBQTJCLENBQUM7UUFFckIsaUJBQVksR0FBRyxDQUFDLEtBQWEsRUFBRSxTQUFnRixFQUFR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