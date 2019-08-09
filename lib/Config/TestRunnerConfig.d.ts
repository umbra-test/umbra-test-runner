/**
 * Async-method-specific timeout config. These timeout values are applied to each named method accordingly.
 */
interface TimeoutConfig {
    it?: number;
    before?: number;
    beforeEach?: number;
    after?: number;
    afterEach?: number;
}
/**
 * Configuration to be set by the user for an instance of an Umbra Test Runner.
 */
interface TestRunnerConfig {
    /**
     * The amount of time to wait until cancelling a long-running test. If a single value is given, this timeout is
     * applied to all asynchronous execution (it, before, beforeEach, after, afterEach).
     *
     * Alternatively, an object may be used to set these individually.
     */
    timeoutMs?: number | TimeoutConfig;
    /**
     * Whether test execution should stop on the first seen failure. Defaults to false.
     */
    stopOnFirstFail?: boolean;
}
/**
 * A helper method to merge multiple sources of configuration.
 *
 * @param to - The base configuration object to be merged into.
 * @param from - The configuration object to merge from.
 */
declare function mergeConfig(to: TestRunnerConfig, from?: Partial<TestRunnerConfig>): TestRunnerConfig;
export { TimeoutConfig, TestRunnerConfig, mergeConfig };
