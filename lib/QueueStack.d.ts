/**
 * A very creatively named Queue of Stacks, with some simple helper methods for operating on them.
 */
declare class QueueStack<T> {
    private queue;
    /**
     * Pushes the given element onto the end of the top stack, on the top queue.
     * @param element
     */
    pushOnTop(element: T): void;
    /**
     * Pushes a new stack onto the end of the queue.
     *
     * @param stack
     */
    pushStack(stack: T[]): void;
    /**
     * Removes the last stack from the queue and returns it.
     */
    popStack(): T[] | undefined;
    /**
     * Removes the first stack from the queue and returns it.
     */
    shiftStack(): T[] | undefined;
    /**
     * Traverses the queue stack, starting at the top, first element and proceeding down level by level.
     *
     * @param callback
     */
    traverseLevelOrder(callback: (element: T) => Promise<void>): Promise<void>;
    /**
     * Traverses the queue stack, starting at the bottom, last element and proceeding up level by level.
     *
     * @param callback
     */
    traverseInverseLevelOrder(callback: (element: T) => void): Promise<void>;
    /**
     * Resets the stack, removing all previously pushed queues and elements.
     */
    reset(): void;
}
export { QueueStack };
