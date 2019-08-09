/**
 * Internal error type for differentiating timeouts from other promise failures.
 */
declare class TimeoutError extends Error {
    elapsedMs: number;
    timeoutMs: number;
    constructor(message: string, elapsedMs: number, timeoutMs: number);
}
/**
 * A simple promise wrapper, which enables promises to "timeout". It does *NOT* actually manipulate or otherwise
 * interrupt long-running tasks, but rather simply ignores their result if they eventually do complete.
 */
declare class TimeoutPromisifier {
    /**
     * Wraps the Promise in another Promise, which will resolve/reject based on the former, or if a given amount of time
     * has passed.
     *
     * @param promise
     * @param timeoutMs
     * @return A new promise, which will resolve if the given promise resolves, or reject if the timeout occurs first.
     */
    wrap<T>(promise: Promise<T>, timeoutMs: number): Promise<T>;
}
export { TimeoutError, TimeoutPromisifier };
