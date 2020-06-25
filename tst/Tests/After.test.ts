import {runTests} from "../TestRunnerForTestRunner";

describe("after", () => {
    runTests("should not run a after if there are no tests", {
        type: "after",
        order: null
    });

    runTests("should not run a after if there are no tests and its in a describe", {
        type: "describe",
        order: 0,
        children: [{
            type: "after",
            order: null
        }]
    });

    runTests("should not run a after if there are no tests and its a sibling to a describe", {
        type: "describe",
        order: 0
    }, {
        type: "after",
        order: null
    });

    runTests("should run a after if its an earlier sibling to a test without a describe", {
        type: "after",
        order: 1
    }, {
        type: "it",
        order: 0
    });

    runTests("should run a after if its a later sibling to a test without a describe", {
        type: "it",
        order: 0
    }, {
        type: "after",
        order: 1
    });

    runTests("should run a after if its in a describe and an earlier sibling to a test", {
        type: "describe",
        order: 0,
        children: [{
            type: "after",
            order: 2
        }, {
            type: "it",
            order: 1
        }]
    });

    runTests("should run a after if its in a describe and a later sibling to a test", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 1
        }, {
            type: "after",
            order: 2
        }]
    });

    runTests("should run a after if its earlier and outside a describe which has a test", {
        type: "after",
        order: 2
    }, {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 1
        }]
    });

    runTests("should run a after if its later and outside a describe which has a test", {
        type: "after",
        order: 2
    }, {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 1
        }]
    });

    runTests("should run a after if its later and outside a describe which has a test", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 1
        }]
    }, {
        type: "after",
        order: 2
    });

    runTests("should run a after if there's one both outside and inside a describe with a test", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 1
        }, {
            type: "after",
            order: 2
        }]
    }, {
        type: "after",
        order: 3
    });

    runTests("should run run afters in the order they come in, if they're at the same level", {
        type: "it",
        order: 0
    }, {
        type: "after",
        order: 1
    }, {
        type: "after",
        order: 2
    });

    runTests("should not run a after if there are no tests at it or its children's level", {
        type: "describe",
        order: 0,
        children: [{
            type: "after",
            order: null
        }]
    }, {
        type: "it",
        order: 1
    });
});
