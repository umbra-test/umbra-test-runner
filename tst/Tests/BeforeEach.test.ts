import {runTests} from "../TestRunnerForTestRunner";
import {TestRunner} from "../../src/TestRunner";

describe("beforeEach", () => {
    runTests("should not run a beforeEach if there are no tests", {
        type: "beforeEach",
        order: null
    });

    runTests("should not run a beforeEach if there are no tests and its in a describe", {
        type: "describe",
        order: 0,
        children: [{
            type: "beforeEach",
            order: null
        }]
    });

    runTests("should not run a beforeEach if there are no tests and its a sibling to a describe", {
        type: "describe",
        order: 0
    }, {
        type: "beforeEach",
        order: null
    });

    runTests("should run a beforeEach if its an earlier sibling to a test without a describe", {
        type: "beforeEach",
        order: 0
    }, {
        type: "it",
        order: 1
    });

    runTests("should run a beforeEach once for every later sibling without a describe", {
        type: "beforeEach",
        order: 0,
        times: 2
    }, {
        type: "it",
        order: 1
    }, {
        type: "it",
        order: 2
    });

    runTests("should run a beforeEach if its a later sibling to a test without a describe", {
        type: "it",
        order: 1
    }, {
        type: "beforeEach",
        order: 0
    });

    runTests("should run a beforeEach once for every earlier sibling without a describe", {
        type: "it",
        order: 1
    }, {
        type: "it",
        order: 2
    }, {
        type: "beforeEach",
        order: 0,
        times: 2
    });

    runTests("should run a beforeEach if its in a describe has a single later test sibling", {
        type: "describe",
        order: 0,
        children: [{
            type: "beforeEach",
            order: 1
        }, {
            type: "it",
            order: 2
        }]
    });

    runTests("should run a beforeEach if its in a describe and has multiple later test siblings", {
        type: "describe",
        order: 0,
        children: [{
            type: "beforeEach",
            order: 1,
            times: 2
        }, {
            type: "it",
            order: 2
        }, {
            type: "it",
            order: 3
        }]
    });

    runTests("should run a beforeEach if its in a describe has a single earlier test sibling", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 2
        }, {
            type: "beforeEach",
            order: 1
        }]
    });

    runTests("should run a beforeEach if its in a describe has multiple earlier test sibling", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 2
        }, {
            type: "it",
            order: 3
        }, {
            type: "beforeEach",
            order: 1,
            times: 2
        }]
    });

    runTests("should run a beforeEach if its earlier and outside a describe which has a test", {
        type: "beforeEach",
        order: 1
    }, {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 2
        }]
    });

    runTests("should run a beforeEach if its earlier and outside a describe which has a test", {
        type: "beforeEach",
        order: 1,
        times: 2
    }, {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 2
        }, {
            type: "it",
            order: 2
        }]
    });

    runTests("should run a beforeEach if its later and outside a describe which has a test", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 2
        }]
    }, {
        type: "beforeEach",
        order: 1
    });

    runTests("should run a beforeEach if its later and outside a describe which has a test", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 2
        }, {
            type: "it",
            order: 3
        }]
    }, {
        type: "beforeEach",
        order: 1,
        times: 2
    });

    runTests("should run a beforeEach if there's one both outside and inside a describe with a test", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 3
        }, {
            type: "beforeEach",
            order: 2
        }]
    }, {
        type: "beforeEach",
        order: 1
    });

    runTests("should run beforeEachs in the order they come in, if they're at the same level", {
        type: "it",
        order: 2
    }, {
        type: "beforeEach",
        order: 0
    }, {
        type: "beforeEach",
        order: 1
    });

    runTests("should handle befores and beforeEaches with before being priorited before beforeEach, per level", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 5
        }, {
            type: "it",
            order: 6
        }, {
            type: "beforeEach",
            order: 4,
            times: 2
        }, {
            type: "before",
            order: 2
        }]
    }, {
        type: "beforeEach",
        order: 3,
        times: 2
    }, {
        type: "before",
        order: 1
    });
});
