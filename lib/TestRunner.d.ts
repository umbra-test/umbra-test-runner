import { EventMap } from "./EventMap";
import { TestInfo } from "./TestInfo";
import { RunResults } from "./RunResults";
import { TestRunnerConfig } from "./Config/TestRunnerConfig";
import { ItOptions } from "./Config/ItOptions";
import { EventCallback, SimpleEventEmitter } from "./EventEmitter/SimpleEventEmitter";
interface ItWithSubMethods {
    (title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any, options?: Partial<ItOptions>): void;
    only(title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any, options?: Partial<ItOptions>): any;
}
interface DescribeWithSubMethods {
    (title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any): void;
    only(title: string, execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any): any;
}
/**
 * before -> beforeEach -> beforeHook -> it -> afterHook -> afterEach -> after
 */
declare class TestRunner {
    private readonly asyncPromisifier;
    private readonly timeoutPromisifier;
    private readonly eventEmitter;
    private readonly config;
    private testQueueStack;
    private queueStacks;
    private currentTest;
    private testRunCancelled;
    private currentlyExecutingFilePath;
    private lastFilePathSet;
    private currentRun;
    private runResults;
    constructor(config?: TestRunnerConfig, eventEmitter?: SimpleEventEmitter<EventMap>);
    /**
     * Sets the current file name for all subsequent calls to describe/it/etc. This is used for logging where tests
     * are sourced from.
     */
    setCurrentFile(absolutePath: string): void;
    on<Event extends keyof EventMap>(event: Event, callback: EventCallback<EventMap, Event>): void;
    once<Event extends keyof EventMap>(event: Event, callback: EventCallback<EventMap, Event>): void;
    off<Event extends keyof EventMap>(event: Event, callback: EventCallback<EventMap, Event>): void;
    readonly describe: DescribeWithSubMethods;
    private describeOnly;
    readonly it: ItWithSubMethods;
    private itOnly;
    before(execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any): void;
    beforeEach(execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any): void;
    after(execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any): void;
    afterEach(execBlock: (done?: (result?: Error | any) => void) => Promise<Error | any> | any): void;
    /**
     * Triggers a test run based on the describes and its added previously.
     *
     * If a test is already in progress, an error will be returned.
     */
    run(): Promise<RunResults>;
    /**
     * If a test is in progress, the current information for the test will be returned.
     *
     * If not, an error will be thrown.
     */
    getCurrentTestInfo(): TestInfo;
    /**
     * Resets all pending state, including all attached before, beforeEach, after, afterEach, tests, describes, etc.
     *
     * If a test run is already in progress, an error will be thrown.
     */
    reset(): void;
    cancel(): Promise<RunResults>;
    private pushToCurrentTestQueue;
    private runNextTestQueue;
    private executeTest;
    private evaluateDescribe;
    private evaluateTest;
    private executeTestCallback;
    private evaluateQueueWithTimeout;
    private evaluateQueue;
    private getTimeoutValue;
    private throwIfTestInProgress;
    private resetRunResults;
}
export { TestRunner };
