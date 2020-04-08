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
declare class AsyncPromisifier {
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
    exec<T>(fn: SyncCallback<T> | AsyncCallback<T> | PromiseCallback<T>, name: string): Promise<T>;
}
export { AsyncPromisifier, AsyncCallback, SyncCallback, PromiseCallback };
