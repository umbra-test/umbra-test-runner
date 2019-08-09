import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon from "sinon";

import {TestRunner} from "../../src/TestRunner";
import {RunResults} from "../../src/RunResults";

chai.use(chaiAsPromised);
const expect = chai.expect;

const runExpectedFailure = (title: string, innerBlock: (testRunner: TestRunner, title: string, error: Error) => any): any => {
    it(title, () => {
        const testRunner = new TestRunner();
        const expectedError = new Error("expected error");

        innerBlock(testRunner, title, expectedError);

        return testRunner.run().catch((error) => {
            expect(error).to.equal(expectedError);
        });
    });
};

describe(`"it" errors`, () => {
    runExpectedFailure("should fail if an it throws an error", (testRunner: TestRunner, title: string, error: Error) => {
        testRunner.it(title, sinon.stub().throws(error));
    });

    runExpectedFailure("should fail if an it returns a rejected promise", (testRunner: TestRunner, title: string, error: Error) => {
        testRunner.it(title, () => Promise.reject(error));
    });

    runExpectedFailure("should fail if an it calls done with an error", (testRunner: TestRunner, title, error: Error) => {
        testRunner.it(title, (done) => done(error));
    });

    it("should not fail if an it returns an error", () => {
        const testRunner = new TestRunner();
        testRunner.it("should not fail if an it returns an error", () => new Error("should-not-fail") as any);
        return testRunner.run();
    });

    it("should not stop on the first failure if not set so in the config", () => {
        const testRunner = new TestRunner({
            stopOnFirstFail: false
        });

        testRunner.it("is going to fail", sinon.stub().throws(new Error("definite error")));

        const spy = sinon.spy();
        testRunner.it("should still be called", spy);

        return testRunner.run().then((results: RunResults) => {
            expect(spy).to.have.been.calledOnce;

            expect(results.totalTests).to.equal(2);
            expect(results.totalSuccesses).to.equal(1);
            expect(results.totalFailures).to.equal(1);
            expect(results.totalTimeouts).to.equal(0);
        });
    });

    it("should stop on the first failure if set so in the config", () => {
        const testRunner = new TestRunner({
            stopOnFirstFail: true
        });

        testRunner.it("is going to fail", sinon.stub().throws(new Error("definite error")));

        const spy = sinon.spy();
        testRunner.it("should not be called", spy);

        return testRunner.run().then((results: RunResults) => {
            expect(spy).to.not.have.been.called;

            expect(results.totalTests).to.equal(1);
            expect(results.totalSuccesses).to.equal(0);
            expect(results.totalFailures).to.equal(1);
            expect(results.totalTimeouts).to.equal(0);
        });
    });

    it("should skip all describes after the first failure if set so in the config", () => {
        const testRunner = new TestRunner({
            stopOnFirstFail: true
        });

        testRunner.it("is going to fail", sinon.stub().throws(new Error("definite error")));

        const spy = sinon.spy();
        testRunner.describe("should not be called", spy);

        return testRunner.run().then((results: RunResults) => {
            expect(spy).to.not.have.been.called;

            expect(results.totalTests).to.equal(1);
            expect(results.totalSuccesses).to.equal(0);
            expect(results.totalFailures).to.equal(1);
            expect(results.totalTimeouts).to.equal(0);
        });
    });

    it("should include the full describe chain in errors", function () {
        const testRunner = new TestRunner();
        const firstDescribeTitle = "first-describe-title";
        const secondDescribeTitle = "second-describe-title";
        testRunner.describe(firstDescribeTitle, () => {
            testRunner.describe(secondDescribeTitle, () => {
                testRunner.it("random-failing-it", sinon.stub().throws(new Error("nested-describe-it-error")));
            });
        });

        return testRunner.run().then((results: RunResults) => {
            const failureInfo = results.failureInfo[0];
            expect(failureInfo.describeChain).to.deep.equal([firstDescribeTitle, secondDescribeTitle]);
        });
    });
});

describe(`"describe" errors`, () => {
    runExpectedFailure("should fail if a describe throws an error", (testRunner: TestRunner, title: string, error: Error) => {
        testRunner.describe(title, sinon.stub().throws(error));
    });

    it("should not fail if an it returns an error", () => {
        const testRunner = new TestRunner();
        testRunner.it("should not fail if an it returns an error", () => new Error("should-not-fail") as any);
        return testRunner.run();
    });
});

for (const type of ["before", "beforeEach", "after", "afterEach"]) {
    describe(`"${type}" errors`, () => {
        runExpectedFailure(`should fail if a ${type} throws an error`, (testRunner: TestRunner, title: string, error: Error) => {
            testRunner[type](() => {
                throw error;
            });
            testRunner.it(`Needs an empty test`, () => {
            });
        });
    });
}

describe("Adding things while executing tests", () => {
    const expectFailure = (testRunner: TestRunner, title: string) =>
        testRunner.run().then((results: RunResults) => {
            expect(results.totalTests).to.equal(1);
            expect(results.totalSuccesses).to.equal(0);
            expect(results.totalFailures).to.equal(1);

            expect(results.failureInfo).to.have.lengthOf(1);
            expect(results.failureInfo[0].title).to.equal(title);
        });

    for (const type of ["before", "beforeEach", "after", "afterEach"]) {
        const title = `should throw an error if you try to call "${type}" while executing a test`;
        it(title, () => {
            const testRunner = new TestRunner();
            testRunner.it(title, () => {
                testRunner[type](() => null);
            });
            return expectFailure(testRunner, title);
        });
    }

    for (const type of ["it", "it.only", "describe", "describe.only"]) {
        const title = `should throw an error if you try to call "${type}" while executing a test`;
        it(title, () => {
            const testRunner = new TestRunner();
            testRunner.it(title, () => {
                testRunner[type](title + "-inner", () => null);
            });
            return expectFailure(testRunner, title);
        });
    }
});

describe("Calling functions that can't be called when a test run is in progress", function () {

    it("should throw an error if attempting to call run when a test run is in progress", function () {
        const testRunner = new TestRunner();
        testRunner.it("is waiting", sinon.spy());
        testRunner.run();

        expect(() => {
            testRunner.run();
        }).to.throw();
    });

    it("should throw an error if attempting to call reset when a test run is in progress", function () {
        const testRunner = new TestRunner();
        testRunner.it("is waiting", sinon.spy());

        testRunner.run();
        expect(() => {
            testRunner.reset();
        }).to.throw();
    });

});