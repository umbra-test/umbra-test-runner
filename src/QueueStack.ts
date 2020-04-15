/**
 * A very creatively named Queue of Stacks, with some simple helper methods for operating on them.
 */
class QueueStack<T> {

    private queue: T[][] = [];

    /**
     * Pushes the given element onto the end of the top stack, on the top queue.
     * @param element
     */
    pushOnTop(element: T): void {
        if (this.queue.length === 0) {
            this.queue.push([element]);
        } else {
            this.queue[0].push(element);
        }
    }

    /**
     * Pushes a new stack onto the end of the queue.
     *
     * @param stack
     */
    pushStack(stack: T[]): void {
        this.queue.push(stack);
    }

    /**
     * Removes the last stack from the queue and returns it.
     */
    popStack(): T[] | undefined {
        return this.queue.pop();
    }

    /**
     * Removes the first stack from the queue and returns it.
     */
    shiftStack(): T[] | undefined {
        return this.queue.shift();
    }

    /**
     * Traverses the queue stack, starting at the top, first element and proceeding down level by level.
     *
     * @param callback
     */
    traverseLevelOrder(callback: (element: T) => Promise<void>): Promise<void> {
        let promise = Promise.resolve();
        for (let i = 0; i < this.queue.length; i++) {
            const queue = this.queue[i];
            for (let j = 0; j < queue.length; j++) {
                promise = promise.then(() => callback(queue[j]));
            }
        }

        return promise;
    }

    /**
     * Traverses the queue stack, starting at the bottom, last element and proceeding up level by level.
     *
     * @param callback
     */
    traverseInverseLevelOrder(callback: (element: T) => void): Promise<void> {
        let promise = Promise.resolve();
        for (let i = this.queue.length - 1; i >= 0; i--) {
            const queue = this.queue[i];
            for (let j = queue.length - 1; j >= 0; j--) {
                promise = promise.then(() => callback(queue[j]));
            }
        }

        return promise;
    }

    /**
     * Resets the stack, removing all previously pushed queues and elements.
     */
    reset(): void {
        this.queue = [];
    }
}

export {QueueStack};
