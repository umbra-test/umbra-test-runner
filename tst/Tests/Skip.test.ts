import {runTests} from "../TestRunnerForTestRunner";

describe("skip", () => {
    describe("it.skip", () => {
        runTests("should not run an it.skip", {
            type: "it.skip",
            order: null
        });

        runTests("should not run an it.skip if it is a preceding sibling to an it", {
            type: "it.skip",
            order: null
        }, {
            type: "it",
            order: 0
        });

        runTests("should not run an it.skip if it is a following sibling to an it", {
            type: "it",
            order: 0
        }, {
            type: "it.skip",
            order: null
        });

        runTests("should not run an it.skip if it is a between its", {
            type: "it",
            order: 0
        }, {
            type: "it.skip",
            order: null
        }, {
            type: "it",
            order: 1
        });

        runTests("should skip an it.skip if it's within a describe", {
            type: "describe",
            order: 0,
            children: [{
                type: "it.skip",
                order: null
            }]
        });
    });

    describe("describe.skip", () => {
        runTests("should run the describe.skip, but skip all tests within it", {
            type: "describe.skip",
            order: 0,
            children: [{
                type: "it",
                order: null
            }, {
                type: "it",
                order: null
            }]
        });

        runTests("should run the describe.skip, but skip all tests even if they are it.only", {
            type: "describe.skip",
            order: 0,
            children: [{
                type: "it.only",
                order: null
            }]
        });

        runTests("should run a describe.skip within another describe", {
            type: "describe",
            order: 0,
            children: [{
                type: "describe.skip",
                order: 1
            }]
        });

        runTests("should run a describe within a describe.skip, but not run any of its tests", {
            type: "describe.skip",
            order: 0,
            children: [{
                type: "describe",
                order: 1,
                children: [{
                    type: "it",
                    order: null
                }]
            }]
        });
    });
});
