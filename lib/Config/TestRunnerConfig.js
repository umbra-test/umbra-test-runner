"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeConfig = void 0;
/**
 * A helper method to merge multiple sources of configuration.
 *
 * @param to - The base configuration object to be merged into.
 * @param from - The configuration object to merge from.
 */
function mergeConfig(to, from) {
    if (!from || typeof from !== "object") {
        return to;
    }
    if (typeof to.timeoutMs === "object" && typeof from.timeoutMs === "object") {
        for (const entryType of ["it", "before", "beforeEach", "after", "afterEach"]) {
            if (typeof from.timeoutMs[entryType] === "number") {
                to.timeoutMs[entryType] = from.timeoutMs[entryType];
            }
        }
    }
    else if (typeof from.timeoutMs !== "undefined") {
        to.timeoutMs = from.timeoutMs;
    }
    if (to.stopOnFirstFail !== from.stopOnFirstFail) {
        to.stopOnFirstFail = from.stopOnFirstFail;
    }
    return to;
}
exports.mergeConfig = mergeConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVzdFJ1bm5lckNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Db25maWcvVGVzdFJ1bm5lckNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUE4QkE7Ozs7O0dBS0c7QUFDSCxTQUFTLFdBQVcsQ0FBQyxFQUFvQixFQUFFLElBQWdDO0lBQ3ZFLElBQUksQ0FBQyxJQUFJLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO1FBQ25DLE9BQU8sRUFBRSxDQUFDO0tBQ2I7SUFFRCxJQUFJLE9BQU8sRUFBRSxDQUFDLFNBQVMsS0FBSyxRQUFRLElBQUksT0FBTyxJQUFJLENBQUMsU0FBUyxLQUFLLFFBQVEsRUFBRTtRQUN4RSxLQUFLLE1BQU0sU0FBUyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxFQUFFO1lBQzFFLElBQUksT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLFFBQVEsRUFBRTtnQkFDL0MsRUFBRSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ3ZEO1NBQ0o7S0FDSjtTQUFNLElBQUksT0FBTyxJQUFJLENBQUMsU0FBUyxLQUFLLFdBQVcsRUFBRTtRQUM5QyxFQUFFLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7S0FDakM7SUFFRCxJQUFJLEVBQUUsQ0FBQyxlQUFlLEtBQUssSUFBSSxDQUFDLGVBQWUsRUFBRTtRQUM3QyxFQUFFLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7S0FDN0M7SUFFRCxPQUFPLEVBQUUsQ0FBQztBQUNkLENBQUM7QUFFd0Msa0NBQVcifQ==