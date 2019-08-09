import {TestRunnerConfig} from "./TestRunnerConfig";

/**
 * Default configuration to be used if the user does not explicitly set configuration.
 */
const DefaultTestRunnerConfig: TestRunnerConfig = {
    timeoutMs: 100,
    stopOnFirstFail: false
};

export {DefaultTestRunnerConfig};
