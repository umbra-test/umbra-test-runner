import {TestInfo} from "./TestInfo";

/**
 * Results from an individual test. This will be fired for each and every test, including those which have failed.
 */
interface TestResult {

    result: "success" | "fail" | "timeout" | "skipped";

    /**
     * Information regarding the test case, including title, timeout values, and other metadata.
     */
    testInfo: TestInfo;

    /**
     * The amount of time it took the test case to fully run.
     */
    elapsedMs: number;

    /**
     * If the result is "fail", then this is the associated error.
     */
    error?: Error;
}

export {TestResult};
