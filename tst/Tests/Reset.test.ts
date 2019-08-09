import * as chai from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

chai.use(sinonChai);
const expect = chai.expect;
import {TestRunner} from "../../src/TestRunner";
import {runTests} from "../TestRunnerForTestRunner";

describe("reset", () => {
    it("should reset it.only and describe.only", () => {
        const testRunner = new TestRunner();

        const shouldntBeCalled = sinon.spy();
        testRunner.it.only("don't call me", shouldntBeCalled);
        testRunner.describe.only("don't call me", shouldntBeCalled);

        testRunner.reset();

        const shouldBeCalled = sinon.spy();
        testRunner.it.only("call me", shouldBeCalled);
        testRunner.describe.only("call me", shouldBeCalled);

        return testRunner.run().then(() => {
            expect(shouldBeCalled).to.have.been.calledTwice;
            expect(shouldntBeCalled).to.have.not.been.called;
        });
    });

    it("should remove any pending tests to be executed", () => {
        const testRunner = new TestRunner();

        const shouldntBeCalled = sinon.spy();
        testRunner.it("don't call me", shouldntBeCalled);

        testRunner.reset();
        return testRunner.run().then(() => {
            expect(shouldntBeCalled).to.have.not.been.called;
        });
    });
});
