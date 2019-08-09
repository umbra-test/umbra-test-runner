/**
 * Simple array union with automatic creation if the arrays don't exist. This is a nice optimization which
 * enables the event emitter to lazy-instantiate event callback arrays.
 *
 * @param arrayA
 * @param arrayB
 * @return arrayA, modified to include all items from arrayB that weren't already in arrayA. If arrayA doesn't exist,
 *         an empty array is returned.
 */
function union(arrayA, arrayB) {
    if (!arrayA) {
        return arrayB ? arrayB : [];
    }
    if (!arrayB) {
        return arrayA;
    }
    for (const item of arrayB) {
        if (arrayA.indexOf(item) === -1) {
            arrayA.push(item);
        }
    }
    return arrayA;
}
/**
 * Simple array item removal with automatic creation if the array doesn't exist. This is a nice optimization which
 * enables the event emitter to lazy-instantiate event callback arrays.
 *
 * DOES NOT REMOVE DUPLICATE VALUES!
 *
 * @param array - The array from which to remove an item.
 * @param item - The item to remove from the given array.
 * @return The original array, modified to remove the item if it existed. If the array doesn't exist, an empty array
 *         is returned.
 */
function without(array, item) {
    if (!array) {
        return [];
    }
    const indexOfItem = array.indexOf(item);
    if (indexOfItem !== -1) {
        array.splice(indexOfItem, 1);
    }
    return array;
}
/**
 * A ridiculously simple event emitter with typesafety.
 *
 * TODO: Maybe opensource this under its own package in the future.
 */
class SimpleEventEmitter {
    constructor() {
        // All event arrays are dynamically filled when calling on/onc.
        this.onListeners = {};
        this.onceListeners = {};
    }
    on(event, callback) {
        (this.onListeners[event]) = union(this.onListeners[event], [callback]);
    }
    once(event, callback) {
        this.onceListeners[event] = union(this.onceListeners[event], [callback]);
    }
    off(event, callback) {
        this.onListeners[event] = without(this.onListeners[event], callback);
        this.onceListeners[event] = without(this.onceListeners[event], callback);
    }
    emit(event, ...args) {
        if (this.onListeners[event]) {
            for (const callback of this.onListeners[event]) {
                callback.call(null, ...args);
            }
        }
        if (this.onceListeners[event] && this.onceListeners[event].length > 0) {
            for (const callback of this.onceListeners[event]) {
                callback.call(null, ...args);
            }
            this.onceListeners[event] = [];
        }
    }
    /**
     * Evaluates each function synchronously, but waits for all to asynchronously complete before returning.
     *
     * TODO: Find a better name for this.
     *
     * @param event - The event to emit.
     * @param args - All args to be emitted for the event.
     */
    emitAndWaitForCompletion(event, ...args) {
        const promises = [];
        if (this.onListeners[event]) {
            for (const callback of this.onListeners[event]) {
                try {
                    promises.push(Promise.resolve(callback.call(null, ...args)));
                }
                catch (e) {
                    promises.push(Promise.reject(e));
                }
            }
        }
        if (this.onceListeners[event] && this.onceListeners[event].length > 0) {
            for (const callback of this.onceListeners[event]) {
                try {
                    promises.push(Promise.resolve(callback.call(null, ...args)));
                }
                catch (e) {
                    promises.push(Promise.reject(e));
                }
            }
            this.onceListeners[event] = [];
        }
        return Promise.all(promises).then((results) => {
            // Intentionally blank, as we want to swallow all actual "valid" values.
            return;
        });
    }
}
export { SimpleEventEmitter, union, without };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2ltcGxlRXZlbnRFbWl0dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL0V2ZW50RW1pdHRlci9TaW1wbGVFdmVudEVtaXR0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0E7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLEtBQUssQ0FBSSxNQUFXLEVBQUUsTUFBVztJQUN0QyxJQUFJLENBQUMsTUFBTSxFQUFFO1FBQ1QsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0tBQy9CO0lBRUQsSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUNULE9BQU8sTUFBTSxDQUFDO0tBQ2pCO0lBRUQsS0FBSyxNQUFNLElBQUksSUFBSSxNQUFNLEVBQUU7UUFDdkIsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO1lBQzdCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDckI7S0FDSjtJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUM7QUFFRDs7Ozs7Ozs7OztHQVVHO0FBQ0gsU0FBUyxPQUFPLENBQUksS0FBVSxFQUFFLElBQU87SUFDbkMsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNSLE9BQU8sRUFBRSxDQUFDO0tBQ2I7SUFFRCxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hDLElBQUksV0FBVyxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQ3BCLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ2hDO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLGtCQUFrQjtJQUF4QjtRQUVJLCtEQUErRDtRQUM5QyxnQkFBVyxHQUFxRSxFQUFFLENBQUM7UUFDbkYsa0JBQWEsR0FBcUUsRUFBRSxD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