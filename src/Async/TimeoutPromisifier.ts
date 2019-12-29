/**
 * Internal error type for differentiating timeouts from other promise failures.
 */
class TimeoutError extends Error {
    public elapsedMs: number;
    public timeoutMs: number;

    constructor(message: string, elapsedMs: number, timeoutMs: number) {
        super(message);
        this.timeoutMs = timeoutMs;
    }
}

/**
 * A simple promise wrapper, which enables promises to "timeout". It does *NOT* actually manipulate or otherwise
 * interrupt long-running tasks, but rather simply ignores their result if they eventually do complete.
 */
class TimeoutPromisifier {

    /**
     * Wraps the Promise in another Promise, which will resolve/reject based on the former, or if a given amount of time
     * has passed.
     *
     * @param promise
     * @param timeoutMs
     * @return A new promise, which will resolve if the given promise resolves, or reject if the timeout occurs first.
     */
    wrap<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        if (timeoutMs <= 0) {
            return promise;
        }

        const startTime = Date.now();
        let timerId = null;
        const timeoutPromise = new Promise((resolve, reject) => {
            timerId = setTimeout(() => {
                const elapsedMs = Date.now() - startTime;
                reject(new TimeoutError(`Async task timeout exceeded! Elapsed: ${elapsedMs}, timeout: ${timeoutMs}ms.`, elapsedMs, timeoutMs));
            }, timeoutMs);
        });

        // timeoutPromise will never resolve, thus we can safely assume that the result is the original one.
        return Promise.race([promise, timeoutPromise]).then((result: void | T) => {
            clearTimeout(timerId);
            return result as T;
        });
    }

}

export {TimeoutError, TimeoutPromisifier};
