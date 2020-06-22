import { RunResults } from "./RunResults";
import { TestResults } from "./TestResults";
import { TestInfo } from "./TestInfo";
/**
 * The type-safe map of all event names to their payloads.
 *
 * TODO: Move this to function signatures.
 */
interface EventMap {
    "onTestStart": [TestInfo];
    "onTestResult": [TestResults];
    "onRunComplete": [RunResults];
    /**
     * Fired before a test has successfully completed. Enables tooling to change succeeding tests into failures
     * via returning a Promise or throwing an error.
     *
     * @param TestInfo
     */
    "beforeTestSuccess": [TestInfo];
}
export { EventMap };
