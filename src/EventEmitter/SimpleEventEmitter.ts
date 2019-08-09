type EventArgs<EventMap, Event extends keyof EventMap> = EventMap[Event] extends any[] ? EventMap[Event] : [EventMap[Event]];
type EventCallback<EventMap, Event extends keyof EventMap> = (...args: EventArgs<EventMap, Event>) => void;

/**
 * Simple array union with automatic creation if the arrays don't exist. This is a nice optimization which
 * enables the event emitter to lazy-instantiate event callback arrays.
 *
 * @param arrayA
 * @param arrayB
 * @return arrayA, modified to include all items from arrayB that weren't already in arrayA. If arrayA doesn't exist,
 *         an empty array is returned.
 */
function union<T>(arrayA: T[], arrayB: T[]): T[] {
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
function without<T>(array: T[], item: T): T[] {
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
class SimpleEventEmitter<EventMap> {

    // All event arrays are dynamically filled when calling on/onc.
    private readonly onListeners: { [Event in keyof EventMap]?: EventCallback<EventMap, Event>[] } = {};
    private readonly onceListeners: { [Event in keyof EventMap]?: EventCallback<EventMap, Event>[] } = {};

    on<Event extends keyof EventMap>(event: Event, callback: EventCallback<EventMap, Event>): void {
        (this.onListeners[event]) = union(this.onListeners[event], [callback]);
    }

    once<Event extends keyof EventMap>(event: Event, callback: EventCallback<EventMap, Event>): void {
        this.onceListeners[event] = union(this.onceListeners[event], [callback]);
    }

    off<Event extends keyof EventMap>(event: Event, callback: EventCallback<EventMap, Event>): void {
        this.onListeners[event] = without(this.onListeners[event], callback);
        this.onceListeners[event] = without(this.onceListeners[event], callback);
    }

    emit<Event extends keyof EventMap>(event: Event, ...args: EventArgs<EventMap, Event>): void {
        if (this.onListeners[event]) {
            for (const callback of this.onListeners[event]) {
                (callback as any).call(null, ...args);
            }
        }

        if (this.onceListeners[event] && this.onceListeners[event].length > 0) {
            for (const callback of this.onceListeners[event]) {
                (callback as any).call(null, ...args);
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
    emitAndWaitForCompletion<Event extends keyof EventMap>(event: Event, ...args: EventArgs<EventMap, Event>): Promise<void> {
        const promises: Promise<void>[] = [];
        if (this.onListeners[event]) {
            for (const callback of this.onListeners[event]) {
                try {
                    promises.push(Promise.resolve((callback as any).call(null, ...args)));
                } catch (e) {
                    promises.push(Promise.reject(e));
                }
            }
        }

        if (this.onceListeners[event] && this.onceListeners[event].length > 0) {
            for (const callback of this.onceListeners[event]) {
                try {
                    promises.push(Promise.resolve((callback as any).call(null, ...args)));
                } catch (e) {
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

export {EventArgs, EventCallback, SimpleEventEmitter, union, without};
