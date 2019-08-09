/**
 * The type-safe map of all event names to their payloads.
 *
 * TODO: Move this to function signatures.
 */
interface EventMap {

    /**
     * Fired before every test is evaluated.
     *
     * @param title - The title of the test being evaluated.
     */
    "beforeTest": [string];

    /**
     * Fired before a test has successfully completed. Enables tooling to change succeeding tests into failures
     * via returning a Promise or throwing an error.
     *
     * @param title - The title of the test having been evaluated.
     */
    "beforeTestSuccess": [string];

    /**
     * Fired after a test has completed successfully. This will be fired in addition to "afterTest".
     *
     * @param title - The title for the test having been evaluated.
     * @param durationMs - The amount of time it took the test to be evaluated.
     */
    "testSuccess": [string, number];

    /**
     * Fired after a test has failed. This will be fired in addition to "afterTest".
     *
     * @param title - The title of the test being evaluated.
     * @param error - The error which resulted in the test failing.
     * @param durationMs - The amount of time it took the test to be evaluated.
     */
    "testFail": [string, Error, number];

    /**
     * Fired after a test has timed out. This will be fired in addition to "afterTest"
     *
     * @param title - The title of the test being evaluated.
     * @param elapsedMs - The amount of time it took the test to be evaluated.
     * @param timeoutMs - The timeout value for this specific test.
     */
    "testTimeout": [string, number, number];

    /**
     * Fired before a describe block is evaluated.
     *
     * @param title -- The title of the describe block being evaluated.
     */
    "beforeDescribe": [string];

    /**
     * Fired after all tests in a describe block have been evaluated.
     *
     * @param title - The title of the describe block having been evaluated.
     * @param durationMs - The amount of time it took for the describe block to be fully evaluated, including any tests,
     *                     setup, and before/beforeEach/after/afterEach.
     */
    "afterDescribe": [string, number];
}

export {EventMap};
