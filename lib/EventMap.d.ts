import { RunResults } from "./RunResults";
import { TestResult } from "./TestResult";
import { TestInfo } from "./TestInfo";
/**
 * The type-safe map of all event names to their payloads.
 *
 * TODO: Move this to function signatures.
 */
interface EventMap {
    /**
     * Fired directly before a test has started.
     *
     * @param TestInfo
     */
    "onTestStart": [TestInfo];
    /**
     * Fired directly after a test has completed.
     */
    "onTestEnd": [TestResult];
    /**
     * Fired once all tests have been executed.
     */
    "onRunEnd": [RunResults];
    /**
     * Fired before a test has successfully completed. Enables tooling to change succeeding tests into failures
     * via returning a Promise or throwing an error.
     */
    "onBeforeTestEnd": [TestResult];
}
export { EventMap };
