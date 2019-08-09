import {runTests} from "../TestRunnerForTestRunner";
import {TestRunner} from "../../src/TestRunner";

describe("before", () => {
    runTests("should not run a before if there are no tests", {
        type: "before",
        order: null
    });

    runTests("should not run a before if there are no tests and its in a describe", {
        type: "describe",
        order: 0,
        children: [{
            type: "before",
            order: null
        }]
    });

    runTests("should not run a before if there are no tests and its a sibling to a describe", {
        type: "describe",
        order: 0
    }, {
        type: "before",
        order: null
    });

    runTests("should run a before if its an earlier sibling to a test without a describe", {
        type: "before",
        order: 0
    }, {
        type: "it",
        order: 1
    });

    runTests("should run a before if its a later sibling to a test without a describe", {
        type: "it",
        order: 1
    }, {
        type: "before",
        order: 0
    });

    runTests("should run a before if its in a describe and an earlier sibling to a test", {
        type: "describe",
        order: 0,
        children: [{
            type: "before",
            order: 1
        }, {
            type: "it",
            order: 2
        }]
    });

    runTests("should run a before if its in a describe and a later sibling to a test", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 2
        }, {
            type: "before",
            order: 1
        }]
    });

    runTests("should run a before if its earlier and outside a describe which has a test", {
        type: "before",
        order: 1
    }, {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 2
        }]
    });

    runTests("should run a before if its later and outside a describe which has a test", {
        type: "before",
        order: 1
    }, {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 2
        }]
    });

    runTests("should run a before if its later and outside a describe which has a test", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 2
        }]
    }, {
        type: "before",
        order: 1
    });

    runTests("should run a before if there's one both outside and inside a describe with a test", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 3
        }, {
            type: "before",
            order: 2
        }]
    }, {
        type: "before",
        order: 1
    });

    runTests("should run run befores in the order they come in, if they're at the same level", {
        type: "it",
        order: 2
    }, {
        type: "before",
        order: 0
    }, {
        type: "before",
        order: 1
    });

    runTests("should not run a before if there are no tests at it or its children's level", {
        type: "describe",
        order: 0,
        children: [{
            type: "before",
            order: null
        }]
    }, {
        type: "it",
        order: 1
    });
});
