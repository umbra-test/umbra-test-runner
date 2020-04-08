"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVzdFJ1bm5lckNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Db25maWcvVGVzdFJ1bm5lckNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQThCQTs7Ozs7R0FLRztBQUNILFNBQVMsV0FBVyxDQUFDLEVBQW9CLEVBQUUsSUFBZ0M7SUFDdkUsSUFBSSxDQUFDLElBQUksSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7UUFDbkMsT0FBTyxFQUFFLENBQUM7S0FDYjtJQUVELElBQUksT0FBTyxFQUFFLENBQUMsU0FBUyxLQUFLLFFBQVEsSUFBSSxPQUFPLElBQUksQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUFFO1FBQ3hFLEtBQUssTUFBTSxTQUFTLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLEVBQUU7WUFDMUUsSUFBSSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssUUFBUSxFQUFFO2dCQUMvQyxFQUFFLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDdkQ7U0FDSjtLQUNKO1NBQU0sSUFBSSxPQUFPLElBQUksQ0FBQyxTQUFTLEtBQUssV0FBVyxFQUFFO1FBQzlDLEVBQUUsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztLQUNqQztJQUVELElBQUksRUFBRSxDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUMsZUFBZSxFQUFFO1FBQzdDLEVBQUUsQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztLQUM3QztJQUVELE9BQU8sRUFBRSxDQUFDO0FBQ2QsQ0FBQztBQUV3QyxrQ0FBVyJ9