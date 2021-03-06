import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";

import {TestRunner} from "../../src/TestRunner";
import {RunResults} from "../../src/RunResults";

chai.use(chaiAsPromised);
const expect = chai.expect;

let testRunner: TestRunner;

const runTimeoutTests = () => {
    it("should fail if an it takes too long to execute", () => {
        const title = "timeout-exceeded";
        testRunner.it(title, (done) => {
            setTimeout(done, 100);
        });

        return testRunner.run().then((results: RunResults) => {
            expect(results.totalTests).to.equal(1);
            expect(results.totalSuccesses).to.equal(0);
            expect(results.totalFailures).to.equal(0);
            expect(results.totalTimeouts).to.equal(1);

            const failureCases = results.testResults.filter((result) => result.result === "fail");
            expect(failureCases).to.have.lengthOf(0);

            const timeoutCases = results.testResults.filter((result) => result.result === "timeout");
            expect(timeoutCases).to.have.lengthOf(1);
            expect(timeoutCases[0].testInfo.title).to.equal(title);
        });
    });

    const verifyFailure = () => {
        testRunner.it("is a no-op", () => 1);
        return expect(testRunner.run()).to.eventually.be.rejected;
    };

    it("should fail if a before takes too long to execute", () => {
        testRunner.before((done) => {
            setTimeout(done, 10);
        });

        return verifyFailure();
    });

    it("should fail if a beforeEach takes too long to execute", () => {
        testRunner.beforeEach((done) => {
            setTimeout(done, 10);
        });

        return verifyFailure();
    });

    it("should fail if a after takes too long to execute", () => {
        testRunner.after((done) => {
            setTimeout(done, 10);
        });

        return verifyFailure();
    });

    it("should fail if a afterEach takes too long to execute", () => {
        testRunner.afterEach((done) => {
            setTimeout(done, 10);
        });

        return verifyFailure();
    });
};

describe("timeoutConfig", () => {
    describe("should individually set timeouts values via config", () => {
        beforeEach(() => {
            testRunner = new TestRunner({
                timeoutMs: {
                    "it": 1,
                    "before": 1,
                    "beforeEach": 1,
                    "after": 1,
                    "afterEach": 1
                }
            });
        });

        runTimeoutTests();
    });

    describe("should singularly set timeout values via config", () => {
        beforeEach(() => {
            testRunner = new TestRunner({
                timeoutMs: 10
            });
        });

        runTimeoutTests();
    });

    it("should allow setting timeouts per test, via it options", () => {
        testRunner = new TestRunner({timeoutMs: 1000});
        const title = "timeout-per-test";
        testRunner.it(title, (done) => {
            setTimeout(done, 500);
        }, {timeoutMs: 1});

        return testRunner.run().then((results: RunResults) => {
            expect(results.totalTests).to.equal(1);
            expect(results.totalSuccesses).to.equal(0);
            expect(results.totalFailures).to.equal(0);
            expect(results.totalTimeouts).to.equal(1);

            const failureCases = results.testResults.filter((result) => result.result === "fail");
            expect(failureCases).to.have.lengthOf(0);

            const timeoutCases = results.testResults.filter((result) => result.result === "timeout");
            expect(timeoutCases).to.have.lengthOf(1);
            expect(timeoutCases[0].testInfo.title).to.equal(title);
        });
    });

    it("should allow setting timeouts per test, via it.only options", () => {
        testRunner = new TestRunner({timeoutMs: 1000});
        const title = "timeout-per-test";
        testRunner.it.only(title, (done) => {
            setTimeout(done, 10);
        }, {timeoutMs: 1});

        return testRunner.run().then((results: RunResults) => {
            expect(results.totalTests).to.equal(1);
            expect(results.totalSuccesses).to.equal(0);
            expect(results.totalFailures).to.equal(0);
            expect(results.totalTimeouts).to.equal(1);

            const failureCases = results.testResults.filter((result) => result.result === "fail");
            expect(failureCases).to.have.lengthOf(0);

            const timeoutCases = results.testResults.filter((result) => result.result === "timeout");
            expect(timeoutCases).to.have.lengthOf(1);
            expect(timeoutCases[0].testInfo.title).to.equal(title);
        });
    });
});

describe("Additional timeout tests", function () {
    it("should include the full describe chain in timeouts", function () {
        testRunner = new TestRunner({timeoutMs: 1});
        const firstDescribeTitle = "first-describe-title";
        const secondDescribeTitle = "second-describe-title";
        testRunner.describe(firstDescribeTitle, () => {
            testRunner.describe(secondDescribeTitle, () => {
                testRunner.it("random-failing-it", (done) => {
                    setTimeout(done, 10);
                });
            });
        });

        return testRunner.run().then((results: RunResults) => {
            const timeoutCases = results.testResults.filter((result) => result.result === "timeout");
            expect(timeoutCases[0].testInfo.describeTitleChain).to.deep.equal([firstDescribeTitle, secondDescribeTitle]);
        });
    });

    it("should not complete before valid async functions have completed", function () {
        let timeoutElapsed = false;
        testRunner = new TestRunner({timeoutMs: 100});
        testRunner.it("long timeout", (done) => {
            setTimeout(() => {
                timeoutElapsed = true;
                done();
            }, 10);
        });

        return testRunner.run().then(() => {
            if (!timeoutElapsed) {
                throw new Error("run() should not succeed before all tests complete.");
            }
        })
    });
});