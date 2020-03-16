import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon from "sinon";

import {TestRunner} from "../../src/TestRunner";
import {RunResults} from "../../src/RunResults";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("Test Cancellation", () => {

    let testRunner: TestRunner;

    beforeEach(() => {
        testRunner = new TestRunner();
    });

    it("calling cancel does nothing if there are no tests", () => {
        return expect(testRunner.cancel()).to.eventually.be.rejected;
    });

    it("should stop executing after the current test", () => {
        testRunner.it("will cancel subsequent tests", () => {
            testRunner.cancel();
        });

        const itSpy = sinon.spy();
        testRunner.it("won't be called (it)", itSpy);

        const describeSpy = sinon.spy();
        testRunner.describe("won't be called (describe)", describeSpy);

        return testRunner.run().then((results: RunResults) => {
            expect(itSpy).to.not.have.been.called;
            expect(describeSpy).to.not.have.been.called;

            expect(results.totalTests).to.equal(1);
            expect(results.totalSuccesses).to.equal(1);
            expect(results.totalFailures).to.equal(0);
            expect(results.totalTimeouts).to.equal(0);
        });
    });
});