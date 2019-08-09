declare type EventArgs<EventMap, Event extends keyof EventMap> = EventMap[Event] extends any[] ? EventMap[Event] : [EventMap[Event]];
declare type EventCallback<EventMap, Event extends keyof EventMap> = (...args: EventArgs<EventMap, Event>) => void;
/**
 * Simple array union with automatic creation if the arrays don't exist. This is a nice optimization which
 * enables the event emitter to lazy-instantiate event callback arrays.
 *
 * @param arrayA
 * @param arrayB
 * @return arrayA, modified to include all items from arrayB that weren't already in arrayA. If arrayA doesn't exist,
 *         an empty array is returned.
 */
declare function union<T>(arrayA: T[], arrayB: T[]): T[];
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
declare function without<T>(array: T[], item: T): T[];
/**
 * A ridiculously simple event emitter with typesafety.
 *
 * TODO: Maybe opensource this under its own package in the future.
 */
declare class SimpleEventEmitter<EventMap> {
    private readonly onListeners;
    private readonly onceListeners;
    on<Event extends keyof EventMap>(event: Event, callback: EventCallback<EventMap, Event>): void;
    once<Event extends keyof EventMap>(event: Event, callback: EventCallback<EventMap, Event>): void;
    off<Event extends keyof EventMap>(event: Event, callback: EventCallback<EventMap, Event>): void;
    emit<Event extends keyof EventMap>(event: Event, ...args: EventArgs<EventMap, Event>): void;
    /**
     * Evaluates each function synchronously, but waits for all to asynchronously complete before returning.
     *
     * TODO: Find a better name for this.
     *
     * @param event - The event to emit.
     * @param args - All args to be emitted for the event.
     */
    emitAndWaitForCompletion<Event extends keyof EventMap>(event: Event, ...args: EventArgs<EventMap, Event>): Promise<void>;
}
export { EventArgs, EventCallback, SimpleEventEmitter, union, without };
