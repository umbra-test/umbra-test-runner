/**
 * Internal error type for differentiating timeouts from other promise failures.
 */
class TimeoutError extends Error {
    constructor(message, elapsedMs, timeoutMs) {
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
    wrap(promise, timeoutMs) {
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
        promise.catch(() => {
            clearTimeout(timerId);
        });
        // timeoutPromise will never resolve, thus we can safely assume that the result is the original one.
        return Promise.race([promise, timeoutPromise]).then((result) => {
            clearTimeout(timerId);
            return result;
        });
    }
}
export { TimeoutError, TimeoutPromisifier };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGltZW91dFByb21pc2lmaWVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL0FzeW5jL1RpbWVvdXRQcm9taXNpZmllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUNILE1BQU0sWUFBYSxTQUFRLEtBQUs7SUFJNUIsWUFBWSxPQUFlLEVBQUUsU0FBaUIsRUFBRSxTQUFpQjtRQUM3RCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDZixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztJQUMvQixDQUFDO0NBQ0o7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLGtCQUFrQjtJQUVwQjs7Ozs7OztPQU9HO0lBQ0gsSUFBSSxDQUFJLE9BQW1CLEVBQUUsU0FBaUI7UUFDMUMsSUFBSSxTQUFTLElBQUksQ0FBQyxFQUFFO1lBQ2hCLE9BQU8sT0FBTyxDQUFDO1NBQ2xCO1FBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzdCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztRQUNuQixNQUFNLGNBQWMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNuRCxPQUFPLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDdEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQztnQkFDekMsTUFBTSxDQUFDLElBQUksWUFBWSxDQUFDLHlDQUF5QyxTQUFTLGNBQWMsU0FBUyxLQUFLLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDbkksQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2xCLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDZixZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxvR0FBb0c7UUFDcEcsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBZSxFQUFFLEVBQUU7WUFDcEUsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RCLE9BQU8sTUFBVyxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUVKO0FBRUQsT0FBTyxFQUFDLFlBQVksRUFBRSxrQkFBa0IsRUFBQyxDQUFDIn0=