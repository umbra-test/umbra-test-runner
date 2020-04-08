"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.union = union;
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
exports.without = without;
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
exports.SimpleEventEmitter = SimpleEventEmitter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2ltcGxlRXZlbnRFbWl0dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL0V2ZW50RW1pdHRlci9TaW1wbGVFdmVudEVtaXR0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQTs7Ozs7Ozs7R0FRRztBQUNILFNBQVMsS0FBSyxDQUFJLE1BQVcsRUFBRSxNQUFXO0lBQ3RDLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDVCxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDL0I7SUFFRCxJQUFJLENBQUMsTUFBTSxFQUFFO1FBQ1QsT0FBTyxNQUFNLENBQUM7S0FDakI7SUFFRCxLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sRUFBRTtRQUN2QixJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDN0IsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNyQjtLQUNKO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDbEIsQ0FBQztBQXlHcUQsc0JBQUs7QUF2RzNEOzs7Ozs7Ozs7O0dBVUc7QUFDSCxTQUFTLE9BQU8sQ0FBSSxLQUFVLEVBQUUsSUFBTztJQUNuQyxJQUFJLENBQUMsS0FBSyxFQUFFO1FBQ1IsT0FBTyxFQUFFLENBQUM7S0FDYjtJQUVELE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEMsSUFBSSxXQUFXLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDcEIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDaEM7SUFFRCxPQUFPLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBaUY0RCwwQkFBTztBQS9FcEU7Ozs7R0FJRztBQUNILE1BQU0sa0JBQWtCO0lBQXhCO1FBRUksK0RBQStEO1FBQzlDLGdCQUFXLEdBQXFFLEVB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