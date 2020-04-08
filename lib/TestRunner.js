"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVzdFJ1bm5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9UZXN0UnVubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFHQSwrREFBMEQ7QUFDMUQsbUVBQTRFO0FBQzVFLGdFQUF1RjtBQUN2Riw4RUFBeUU7QUFFekUsMEVBQW9GO0FBQ3BGLDZDQUF3QztBQWV4QyxNQUFNLGVBQWUsR0FBRyxDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBY3ZFOztHQUVHO0FBQ0gsTUFBTSxVQUFVO0lBeUJaLFlBQVksTUFBeUIsRUFBRSxlQUFlLElBQUksdUNBQWtCLEVBQVk7UUF2QnZFLHFCQUFnQixHQUFHLElBQUksbUNBQWdCLEVBQUUsQ0FBQztRQUMxQyx1QkFBa0IsR0FBRyxJQUFJLHVDQUFrQixFQUFFLENBQUM7UUFLdkQsbUJBQWMsR0FBZ0IsRUFBRSxDQUFDO1FBQ2pDLGdCQUFXLEdBQWtFO1lBQ2pGLFFBQVEsRUFBRSxJQUFJLHVCQUFVLEVBQUU7WUFDMUIsWUFBWSxFQUFFLElBQUksdUJBQVUsRUFBRTtZQUM5QixPQUFPLEVBQUUsSUFBSSx1QkFBVSxFQUFFO1lBQ3pCLFdBQVcsRUFBRSxJQUFJLHVCQUFVLEVBQUU7U0FDaEMsQ0FBQztRQUVNLGdCQUFXLEdBQXFCLElBQUksQ0FBQztRQUNyQyxxQkFBZ0IsR0FBWSxLQUFLLENBQUM7UUFzQzFDLDZHQUE2RztRQUNwRyxhQUFRLEdBQTJCLENBQUMsQ0FBQyxLQUFhLEVBQUUsU0FBcUIsRUFBRSxFQUFFO1lBQ2xGLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsc0JBQXNCLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztRQUM5RCxDQUFDLENBQTJCLENBQUM7UUFFckIsaUJBQVksR0FBRyxDQUFDLEtBQWEsRUFBRSxTQUFnRixFQUFRLEVB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