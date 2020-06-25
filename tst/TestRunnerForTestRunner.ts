import * as chai from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

import {TestRunner} from "../src/TestRunner";

chai.use(sinonChai);
const expect = chai.expect;

interface TestCase {
    type: "it" | "it.only" | "it.skip" | "describe" | "describe.only" | "describe.skip" | "before" | "after" | "beforeEach" | "afterEach";
    order: number | number[] | null;
    times?: number;
    error?: Error;
    children?: TestCase[];
}

interface CallOrderExpectation {
    label: string;
    spy: sinon.SinonSpy;
    times: number;
}

/**
 * A helper class for generating test trees from simple nested objects. Does basic validation including spy execution
 * and call order.
 */
class TestRunnerForTestRunner {

    private umbraOnly: boolean;
    private testRunnerInstance = new TestRunner();

    private callOrder: CallOrderExpectation[] = [];
    private shouldNotBeCalledSpies: sinon.SinonSpy[] = [];

    constructor(umbraOnly = false) {
        this.umbraOnly = umbraOnly;
    }

    runTest(verbose: boolean, ...testCases: TestCase[]): Promise<void> {
        this.addTest(verbose, ...testCases);

        return this.testRunnerInstance.run().then(this.validateCallOrder);
    }

    private validateCallOrder = () => {
        if (this.callOrder.length === 0) {
            return;
        }

        if (!this.callOrder[0]) {
            throw new Error(`Call order must start at 0`);
        }

        for (let i = this.callOrder.length - 1; i >= 0; i--) {
            if (!this.callOrder[i]) {
                throw new Error(`Call order must be contiguous from ${this.callOrder.length} to 0. Missing entry at: ${i}`);
            }

            const call = this.callOrder[i];
            const precedingCall = this.callOrder[i - 1];

            if (precedingCall && call.spy.getCalls().length === 1) {
                expect(call.spy, `umbra should call callbacks in expected order. Expected to receive ${call.label} after ${precedingCall.label}. Call count: (1st: ${call.spy.callCount}, 2nd: ${precedingCall.spy.callCount}`).to.be.calledAfter(precedingCall.spy);
            }

            expect(call.spy).to.have.callCount(call.times);
        }

        for (const uncalledSpy of this.shouldNotBeCalledSpies) {
            expect(uncalledSpy).to.not.been.called;
        }
    };

    private addTest(verbose: boolean, ...testCases: TestCase[]): void {
        if (testCases.length === 0) {
            return;
        }

        for (const testCase of testCases) {
            if (!testCase) {
                return;
            }

            const type = testCase.type;
            const order = testCase.order;
            const title = `${order}->${type}`;
            const runnerSpy: any = sinon.spy(() => {
                if (verbose) {
                    console.log(`-> ${title}`);
                }
                if (testCase.error) {
                    throw testCase.error;
                }
                if (testCase.children) {
                    for (const child of testCase.children) {
                        this.addTest(verbose, child);
                    }
                }
            });

            if (order === null) {
                this.shouldNotBeCalledSpies.push(runnerSpy);
            } else {
                const orderEntries = typeof order === "number" ? [order] : order;
                for (const order of orderEntries) {
                    this.callOrder[order] = {
                        label: title,
                        spy: runnerSpy,
                        times: testCase.times ? testCase.times : orderEntries.length
                    };
                }
            }

            this.addTestRunnerTest(type, title, runnerSpy);
        }
    }

    private addTestRunnerTest(key: string, title: string, spy: sinon.SinonSpy) {
        if (key === "it" || key === "describe") {
            this.testRunnerInstance[key](title, spy);
        } else if (key === "it.only") {
            this.testRunnerInstance.it.only(title, spy);
        } else if (key === "it.skip") {
            this.testRunnerInstance.it.skip(title, spy);
        } else if (key === "describe.only") {
            this.testRunnerInstance.describe.only(title, spy);
        } else if (key === "describe.skip") {
            this.testRunnerInstance.describe.skip(title, spy);
        } else {
            this.testRunnerInstance[key](spy);
        }
    }
}

const runTestsVerbose = (title: string, only = false, ...testCases: TestCase[]) => {
    const runner = new TestRunnerForTestRunner();
    if (only) {
        it.only(title, () => runner.runTest(true, ...testCases));
    } else {
        it(title, () => runner.runTest(true, ...testCases));
    }
};

const runTests = (title: string, ...testCases: TestCase[]) => {
    const runner = new TestRunnerForTestRunner();
    it(title, () => runner.runTest(false, ...testCases));
};

export {TestRunnerForTestRunner, runTests, runTestsVerbose};
