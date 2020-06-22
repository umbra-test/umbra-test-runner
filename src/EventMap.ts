import {RunResults} from "./RunResults";
import {TestResults} from "./TestResults";
import {TestInfo} from "./TestInfo";

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
    "onTestResult": [TestResults];

    /**
     * Fired once all tests have been executed.
     */
    "onRunComplete": [RunResults];

    /**
     * Fired before a test has successfully completed. Enables tooling to change succeeding tests into failures
     * via returning a Promise or throwing an error.
     *
     * @param TestInfo
     */
    "beforeTestSuccess": [TestInfo];

}

export {EventMap};
