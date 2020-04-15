"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUXVldWVTdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9RdWV1ZVN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7O0dBRUc7QUFDSCxNQUFNLFVBQVU7SUFBaEI7UUFFWSxVQUFLLEdBQVUsRUFBRSxDQUFDO0lBNkU5QixDQUFDO0lBM0VHOzs7T0FHRztJQUNILFNBQVMsQ0FBQyxPQUFVO1FBQ2hCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ3pCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUM5QjthQUFNO1lBQ0gsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDL0I7SUFDTCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFNBQVMsQ0FBQyxLQUFVO1FBQ2hCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRDs7T0FFRztJQUNILFFBQVE7UUFDSixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsVUFBVTtRQUNOLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILGtCQUFrQixDQUFDLFFBQXVDO1FBQ3RELElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDeEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDbkMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDcEQ7U0FDSjtRQUVELE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gseUJBQXlCLENBQUMsUUFBOEI7UUFDcEQsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hDLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDN0MsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3hDLE9BQU8sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3BEO1NBQ0o7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLO1FBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7SUFDcEIsQ0FBQztDQUNKO0FBRU8sZ0NBQVUifQ==