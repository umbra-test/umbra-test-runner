"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGltZW91dFByb21pc2lmaWVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL0FzeW5jL1RpbWVvdXRQcm9taXNpZmllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOztHQUVHO0FBQ0gsTUFBTSxZQUFhLFNBQVEsS0FBSztJQUk1QixZQUFZLE9BQWUsRUFBRSxTQUFpQixFQUFFLFNBQWlCO1FBQzdELEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNmLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0lBQy9CLENBQUM7Q0FDSjtBQTJDTyxvQ0FBWTtBQXpDcEI7OztHQUdHO0FBQ0gsTUFBTSxrQkFBa0I7SUFFcEI7Ozs7Ozs7T0FPRztJQUNILElBQUksQ0FBSSxPQUFtQixFQUFFLFNBQWlCO1FBQzFDLElBQUksU0FBUyxJQUFJLENBQUMsRUFBRTtZQUNoQixPQUFPLE9BQU8sQ0FBQztTQUNsQjtRQUVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM3QixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDbkIsTUFBTSxjQUFjLEdBQUcsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDbkQsT0FBTyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3RCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUM7Z0JBQ3pDLE1BQU0sQ0FBQyxJQUFJLFlBQVksQ0FBQyx5Q0FBeUMsU0FBUyxjQUFjLFNBQVMsS0FBSyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ25JLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNsQixDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ2YsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFCLENBQUMsQ0FBQyxDQUFDO1FBRUgsb0dBQW9HO1FBQ3BHLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQWUsRUFBRSxFQUFFO1lBQ3BFLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN0QixPQUFPLE1BQVcsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FFSjtBQUVxQixnREFBa0IifQ==