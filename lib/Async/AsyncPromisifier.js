"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    exec(fn, name) {
        Object.defineProperty(fn, "name", { value: name, writable: false });
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
exports.AsyncPromisifier = AsyncPromisifier;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXN5bmNQcm9taXNpZmllci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Bc3luYy9Bc3luY1Byb21pc2lmaWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBWUE7O0dBRUc7QUFDSCxNQUFNLGdCQUFnQjtJQUVsQjs7Ozs7Ozs7OztPQVVHO0lBQ0gsSUFBSSxDQUFJLEVBQTJELEVBQUUsSUFBWTtRQUU3RSxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3BFOzs7V0FHRztRQUNILElBQUksRUFBRSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDakIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDZixFQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtvQkFDL0IsSUFBSSxNQUFNLFlBQVksS0FBSyxFQUFFO3dCQUN6QixNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQ2xCO3lCQUFNO3dCQUNILE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztxQkFDbkI7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQztTQUNOO2FBQU07WUFDSCxJQUFJO2dCQUNBLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBb0IsRUFBRyxFQUFFLENBQUMsQ0FBQzthQUNwRDtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNSLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUM1QjtTQUNKO0lBQ0wsQ0FBQztDQUNKO0FBRVEsNENBQWdCIn0=