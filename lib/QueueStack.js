"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueStack = void 0;
/**
 * A very creatively named Queue of Stacks, with some simple helper methods for operating on them.
 */
class QueueStack {
    constructor() {
        this.queue = [];
    }
    /**
     * Pushes the given element onto the end of the top stack, on the top queue.
     * @param element
     */
    pushOnTop(element) {
        if (this.queue.length === 0) {
            this.queue.push([element]);
        }
        else {
            this.queue[0].push(element);
        }
    }
    /**
     * Pushes a new stack onto the end of the queue.
     *
     * @param stack
     */
    pushStack(stack) {
        this.queue.push(stack);
    }
    /**
     * Removes the last stack from the queue and returns it.
     */
    popStack() {
        return this.queue.pop();
    }
    /**
     * Removes the first stack from the queue and returns it.
     */
    shiftStack() {
        return this.queue.shift();
    }
    /**
     * Traverses the queue stack, starting at the top, first element and proceeding down level by level.
     *
     * @param callback
     */
    traverseLevelOrder(callback) {
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
    traverseInverseLevelOrder(callback) {
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
    reset() {
        this.queue = [];
    }
}
exports.QueueStack = QueueStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUXVldWVTdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9RdWV1ZVN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBOztHQUVHO0FBQ0gsTUFBTSxVQUFVO0lBQWhCO1FBRVksVUFBSyxHQUFVLEVBQUUsQ0FBQztJQTZFOUIsQ0FBQztJQTNFRzs7O09BR0c7SUFDSCxTQUFTLENBQUMsT0FBVTtRQUNoQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUN6QixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7U0FDOUI7YUFBTTtZQUNILElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQy9CO0lBQ0wsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxTQUFTLENBQUMsS0FBVTtRQUNoQixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxRQUFRO1FBQ0osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFRDs7T0FFRztJQUNILFVBQVU7UUFDTixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxrQkFBa0IsQ0FBQyxRQUF1QztRQUN0RCxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3hDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ25DLE9BQU8sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3BEO1NBQ0o7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILHlCQUF5QixDQUFDLFFBQThCO1FBQ3BELElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoQyxLQUFLLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzdDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN4QyxPQUFPLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNwRDtTQUNKO1FBRUQsT0FBTyxPQUFPLENBQUM7SUFDbkIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSztRQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ3BCLENBQUM7Q0FDSjtBQUVPLGdDQUFVIn0=