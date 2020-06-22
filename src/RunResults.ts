/**
 * Results from the end of the test run. These results only include the tests that have been evaluated; if `only` or
 * `cancel()` is used then the skipped tests are not included in the total test count.
 */
import {TestResults} from "./TestResults";

interface RunResults {

    /**
     * The total elapsed time for the test run.
     */
    elapsedTimeMs: number;

    /**
     * The total number of tests evaluated.
     */
    totalTests: number;

    /**
     * The total number of successful tests.
     */
    totalSuccesses: number;

    /**
     * The total number of test failures. This does NOT include test timeouts.
     */
    totalFailures: number;

    /**
     * The total number of tests which failed due to timeout.
     */
    totalTimeouts: number;

    /**
     * A list of information for each and every test success.
     */
    testResults: TestResults[];

}

export {RunResults};
