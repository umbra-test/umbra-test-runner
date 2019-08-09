import {runTests} from "../TestRunnerForTestRunner";
import {TestRunner} from "../../src/TestRunner";

describe("simple describe and it", () => {
    it("should do nothing if there are no tests", () => {
        const runner = new TestRunner();
        return runner.run();
    });

    runTests("should run a single it", {
        type: "it",
        order: 0
    });

    runTests("should run multiple its", {
        type: "it",
        order: 0
    }, {
        type: "it",
        order: 1
    });

    runTests("should run a describe without any its in it", {
        type: "describe",
        order: 0
    });

    runTests("should run multiple describes without any its in them", {
        type: "describe",
        order: 0
    }, {
        type: "describe",
        order: 1
    });

    runTests("should run a single it within a describe block", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 1
        }]
    });

    runTests("should run multiple its within a describe block", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 1
        }, {
            type: "it",
            order: 2
        }]
    });

    runTests("should run its both inside and outside of a describe block", {
        type: "it",
        order: 0
    }, {
        type: "describe",
        order: 1,
        children: [{
            type: "it",
            order: 2
        }]
    }, {
        type: "it",
        order: 3
    });

    runTests("should run tests within multiple describe blocks", {
        type: "describe",
        order: 0,
        children: [{
            type: "describe",
            order: 1,
            children: [{
                type: "describe",
                order: 2,
                children: [{
                    type: "it",
                    order: 3
                }]
            }]
        }]
    });
});
