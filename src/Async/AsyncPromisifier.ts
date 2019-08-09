interface AsyncCallback<T> {
    (done?: (result: T) => void): void;
}

interface SyncCallback<T> {
    (): T;
}

interface PromiseCallback<T> {
    (): Promise<T>;
}

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
    exec<T>(fn: SyncCallback<T> | AsyncCallback<T> | PromiseCallback<T>): Promise<T> {

        /*
         * 2nd param is "done" -- if the user fn has exactly two params then it is expected that they are using a
         * classic asynchronous function and will call "done" when complete.
         */
        if (fn.length === 1) {
            return new Promise((resolve, reject) => {
                (<AsyncCallback<T>> fn)((result) => {
                    if (result instanceof Error) {
                        reject(result);
                    } else {
                        resolve(result);
                    }
                });
            });
        } else {
            try {
                return Promise.resolve((<SyncCallback<T>> fn)());
            } catch (e) {
                return Promise.reject(e);
            }
        }
    }
}

export { AsyncPromisifier, AsyncCallback, SyncCallback, PromiseCallback };
