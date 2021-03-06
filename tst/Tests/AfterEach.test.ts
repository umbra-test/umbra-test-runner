import {runTests} from "../TestRunnerForTestRunner";

describe("afterEach", () => {
    runTests("should not run a afterEach if there are no tests", {
        type: "afterEach",
        order: null
    });

    runTests("should not run a afterEach if there are no tests and its in a describe", {
        type: "describe",
        order: 0,
        children: [{
            type: "afterEach",
            order: null
        }]
    });

    runTests("should not run a afterEach if there are no tests and its a sibling to a describe", {
        type: "describe",
        order: 0
    }, {
        type: "afterEach",
        order: null
    });

    runTests("should run a afterEach if its an earlier sibling to a test without a describe", {
        type: "afterEach",
        order: 1
    }, {
        type: "it",
        order: 0
    });

    runTests("should run a afterEach once for every later sibling without a describe", {
        type: "afterEach",
        order: [1, 3],
    }, {
        type: "it",
        order: 0
    }, {
        type: "it",
        order: 2
    });

    runTests("should run a afterEach if its a later sibling to a test without a describe", {
        type: "it",
        order: 0
    }, {
        type: "afterEach",
        order: 1
    });

    runTests("should run a afterEach once for every earlier sibling without a describe", {
        type: "it",
        order: 0
    }, {
        type: "it",
        order: 2
    }, {
        type: "afterEach",
        order: [1, 3],
    });

    runTests("should run a afterEach if its in a describe has a single later test sibling", {
        type: "describe",
        order: 0,
        children: [{
            type: "afterEach",
            order: 2
        }, {
            type: "it",
            order: 1
        }]
    });

    runTests("should run a afterEach if its in a describe and has multiple later test siblings", {
        type: "describe",
        order: 0,
        children: [{
            type: "afterEach",
            order: [2, 4]
        }, {
            type: "it",
            order: 1
        }, {
            type: "it",
            order: 3
        }]
    });

    runTests("should run a afterEach if its in a describe has a single earlier test siblings", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 1
        }, {
            type: "afterEach",
            order: 2
        }]
    });

    runTests("should run a afterEach if its in a describe has multiple earlier test siblings", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 1
        }, {
            type: "it",
            order: 3
        }, {
            type: "afterEach",
            order: [2, 4],
        }]
    });

    runTests("should run a afterEach if its earlier and outside a describe which has a test", {
        type: "afterEach",
        order: 2
    }, {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 1
        }]
    });

    runTests("should run a afterEach if its earlier and outside a describe which has a test", {
        type: "afterEach",
        order: [2, 4],
    }, {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 1
        }, {
            type: "it",
            order: 3
        }]
    });

    runTests("should run a afterEach if its later and outside a describe which has a test", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 1
        }]
    }, {
        type: "afterEach",
        order: 2
    });

    runTests("should run a afterEach if its later and outside a describe which has a test", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 1
        }, {
            type: "it",
            order: 3
        }]
    }, {
        type: "afterEach",
        order: [2, 4],
    });

    runTests("should run a afterEach if there's one both outside and inside a describe with a test", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 1
        }, {
            type: "afterEach",
            order: 2
        }]
    }, {
        type: "afterEach",
        order: 3
    });

    runTests("should run afterEachs in the order they come in, if they're at the same level", {
        type: "it",
        order: 0
    }, {
        type: "afterEach",
        order: 1
    }, {
        type: "afterEach",
        order: 2
    });

    runTests("should handle afters and afterEaches with after being prioritized after afterEach, per level", {
        type: "describe",
        order: 0,
        children: [{
            type: "it",
            order: 1
        }, {
            type: "it",
            order: 4
        }, {
            type: "afterEach",
            order: [2, 5]
        }, {
            type: "after",
            order: 7
        }]
    }, {
        type: "afterEach",
        order: [3, 6],
    }, {
        type: "after",
        order: 8
    });

    runTests("should not run an afterEach if there are no tests at it or its children's level", {
        type: "describe",
        order: 0,
        children: [{
            type: "afterEach",
            order: null
        }]
    }, {
        type: "it",
        order: 1
    });

    runTests("should execute afterEaches for the given level and any parents if they exist", {
        type: "describe",
        order: 0,
        children: [
            {
                type: "afterEach",
                order: [4, 8]
            },
            {
                type: "describe",
                order: 1,
                children: [{
                    type: "afterEach",
                    order: 3
                }, {
                    type: "it",
                    order: 2
                }]
            }, {
                type: "describe",
                order: 5,
                children: [{
                    type: "afterEach",
                    order: 7
                }, {
                    type: "it",
                    order: 6
                }]
            }
        ]
    });
});
