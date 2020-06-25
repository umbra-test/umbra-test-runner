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
     * Whether or not verbose logging should be enabled.
     */
    verboseLogging?: boolean;

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
function mergeConfig(to: TestRunnerConfig, from?: Partial<TestRunnerConfig>): TestRunnerConfig {
    if (!from || typeof from !== "object") {
        return to;
    }

    if (typeof to.timeoutMs === "object" && typeof from.timeoutMs === "object") {
        for (const entryType of ["it", "before", "beforeEach", "after", "afterEach"]) {
            if (typeof from.timeoutMs[entryType] === "number") {
                to.timeoutMs[entryType] = from.timeoutMs[entryType];
            }
        }
    } else if (typeof from.timeoutMs !== "undefined") {
        to.timeoutMs = from.timeoutMs;
    }

    if (to.stopOnFirstFail !== from.stopOnFirstFail) {
        to.stopOnFirstFail = from.stopOnFirstFail;
    }

    return to;
}

export {TimeoutConfig, TestRunnerConfig, mergeConfig};
