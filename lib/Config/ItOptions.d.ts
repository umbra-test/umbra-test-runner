/**
 * A set of options which can be passed into individual `it` blocks, overriding the behavior for the individual test.
 */
interface ItOptions {
    /**
     * The amount of time (in milliseconds) to wait before considering this test a timeout failure. This option
     * overwrites any option defined by the user either via constructor or other defaults.
     */
    timeoutMs: number;
}
export { ItOptions };
