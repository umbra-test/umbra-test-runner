/**
 * A class that massages synchronous and some async functions into promises. Expects very specific function signatures.
 */
class AsyncPromisifier {
    /**
     * Takes a function and executes it as a Promise.
     *
     * Supports:
     *  - Promises
     *  - "done" callback
     *  - sync returns
     *
     * @param {(done) => any} fn
     * @returns {Promise<T>}
     */
    exec(fn) {
        /*
         * 2nd param is "done" -- if the user fn has exactly two params then it is expected that they are using a
         * classic asynchronous function and will call "done" when complete.
         */
        if (fn.length === 1) {
            return new Promise((resolve, reject) => {
                fn((result) => {
                    if (result instanceof Error) {
                        reject(result);
                    }
                    else {
                        resolve(result);
                    }
                });
            });
        }
        else {
            try {
                return Promise.resolve(fn());
            }
            catch (e) {
                return Promise.reject(e);
            }
        }
    }
}
export { AsyncPromisifier };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXN5bmNQcm9taXNpZmllci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Bc3luYy9Bc3luY1Byb21pc2lmaWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVlBOztHQUVHO0FBQ0gsTUFBTSxnQkFBZ0I7SUFFbEI7Ozs7Ozs7Ozs7T0FVRztJQUNILElBQUksQ0FBSSxFQUEyRDtRQUUvRDs7O1dBR0c7UUFDSCxJQUFJLEVBQUUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ2pCLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQ2YsRUFBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7b0JBQy9CLElBQUksTUFBTSxZQUFZLEtBQUssRUFBRTt3QkFDekIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3FCQUNsQjt5QkFBTTt3QkFDSCxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQ25CO2dCQUNMLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUM7U0FDTjthQUFNO1lBQ0gsSUFBSTtnQkFDQSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQW9CLEVBQUcsRUFBRSxDQUFDLENBQUM7YUFDcEQ7WUFBQyxPQUFPLENBQUMsRUFBRTtnQkFDUixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDNUI7U0FDSjtJQUNMLENBQUM7Q0FDSjtBQUVELE9BQU8sRUFBRSxnQkFBZ0IsRUFBZ0QsQ0FBQyJ9