import {runTests} from "../TestRunnerForTestRunner";

describe("only", () => {
    describe("it.only", () => {
        runTests("should run an it.only if it is the it.only", {
            type: "it.only",
            order: 0
        });

        runTests("should run an it.only if it comes after an it", {
            type: "it.only",
            order: 0
        }, {
            type: "it",
            order: null
        });

        runTests("should run an it.only if it comes before an it", {
            type: "it",
            order: null
        }, {
            type: "it.only",
            order: 0
        });

        runTests("should run an it.only if its inside of a describe block, with an it outside", {
            type: "describe",
            order: 0,
            children: [{
                type: "it.only",
                order: 1
            }, {
                type: "it",
                order: null
            }]
        }, {
            type: "it",
            order: 2
        });

        runTests("should run an it.only if its outside of a describe block with an it inside", {
            type: "describe",
            order: null,
            children: [{
                type: "it",
                order: null
            }]
        }, {
            type: "it.only",
            order: 0
        });

    });

    describe("describe.only", () => {
        runTests("should run a describe.only if it is the only describe", {
            type: "describe.only",
            order: 0
        });

        runTests("should run a describe.only if there's another describe", {
            type: "describe.only",
            order: 0
        }, {
            type: "describe",
            order: null
        });

        runTests("should only run the first describe.only if there are multiple of them", {
            type: "describe.only",
            order: 0
        }, {
            type: "describe.only",
            order: null
        });

        runTests("should only run the first describe.only if there are multiple of them, out of order", {
            type: "describe",
            order: null
        }, {
            type: "describe.only",
            order: 0
        }, {
            type: "describe.only",
            order: null
        });

        runTests("should run combinations of it.only and describe.only, but not describe and its", {
            type: "describe.only",
            order: 0,
            children: [{
                type: "it.only",
                order: 1
            }]
        }, {
            type: "describe",
            order: null
        }, {
            type: "it",
            order: null
        }, {
            type: "it.only",
            order: null
        });
    });
});
