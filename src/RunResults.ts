/**
 * Results from the end of the test run. These results only include the tests that have been evaluated; if `only` or
 * `cancel()` is used then the skipped tests are not included in the total test count.
 */
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
     * The total number of test failures.
     */
    totalFailures: number;

    /**
     * The total number of test timeouts.
     */
    totalTimeouts: number;

    /**
     * A list of information for each and every test failure.
     */
    failureInfo: {

        /**
         * The chain of describes leading to the test itself.
         */
        describeChain: string[];

        /**
         * The title of the test. This is not guaranteed to be unique.
         */
        title: string;

        /**
         * The error which caused this test to fail.
         */
        error: Error;
    }[];

    /**
     * A list of information for each and every test failure.
     */
    timeoutInfo: {
        /**
         * The chain of describes leading to the test itself.
         */
        describeChain: string[];

        /**
         * The title of the test. This is not guaranteed to be unique.
         */
        title: string;

        /**
         * The amount of time it took for the test to timeout. This may be greater than timeoutMs due to the
         * single-threaded nature of many long-running tests.
         */
        elapsedMs: number;

        /**
         * The timeout value set for thie test itself.
         */
        timeoutMs: number;
    }[];
}

export {RunResults};
