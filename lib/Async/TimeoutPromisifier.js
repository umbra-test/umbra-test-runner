"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutPromisifier = exports.TimeoutError = void 0;
/**
 * Internal error type for differentiating timeouts from other promise failures.
 */
class TimeoutError extends Error {
    constructor(message, elapsedMs, timeoutMs) {
        super(message);
        this.timeoutMs = timeoutMs;
    }
}
exports.TimeoutError = TimeoutError;
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
exports.TimeoutPromisifier = TimeoutPromisifier;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGltZW91dFByb21pc2lmaWVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL0FzeW5jL1RpbWVvdXRQcm9taXNpZmllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7R0FFRztBQUNILE1BQU0sWUFBYSxTQUFRLEtBQUs7SUFJNUIsWUFBWSxPQUFlLEVBQUUsU0FBaUIsRUFBRSxTQUFpQjtRQUM3RCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDZixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztJQUMvQixDQUFDO0NBQ0o7QUEyQ08sb0NBQVk7QUF6Q3BCOzs7R0FHRztBQUNILE1BQU0sa0JBQWtCO0lBRXBCOzs7Ozs7O09BT0c7SUFDSCxJQUFJLENBQUksT0FBbUIsRUFBRSxTQUFpQjtRQUMxQyxJQUFJLFNBQVMsSUFBSSxDQUFDLEVBQUU7WUFDaEIsT0FBTyxPQUFPLENBQUM7U0FDbEI7UUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDN0IsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ25CLE1BQU0sY0FBYyxHQUFHLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ25ELE9BQU8sR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUN0QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDO2dCQUN6QyxNQUFNLENBQUMsSUFBSSxZQUFZLENBQUMseUNBQXlDLFNBQVMsY0FBYyxTQUFTLEtBQUssRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNuSSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbEIsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNmLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztRQUVILG9HQUFvRztRQUNwRyxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFlLEVBQUUsRUFBRTtZQUNwRSxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdEIsT0FBTyxNQUFXLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBRUo7QUFFcUIsZ0RBQWtCIn0=