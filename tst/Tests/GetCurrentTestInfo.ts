import * as chai from "chai";

import {TestRunner} from "../../src/TestRunner";

const expect = chai.expect;

describe("GetCurrentTestInfo", function () {

    let testRunner: TestRunner;

    beforeEach(() => {
        testRunner = new TestRunner();
    });

    it("should throw an error if there is no active test in progress", function () {
        expect(() => testRunner.getCurrentTestInfo()).to.throw();
    });

    it("should return the current test info if its within the test", function () {
        const title = "random-test-title-1";
        const timeoutMs = 1234;
        testRunner.it(title, () => {
            const testInfo = testRunner.getCurrentTestInfo();
            expect(testInfo.title).to.equal(title);
            expect(testInfo.timeoutMs).to.equal(timeoutMs);
        }, {timeoutMs: 1234});

        return testRunner.run().then((runResults) => {
            expect(runResults.totalSuccesses).to.equal(1);
        });
    });
});
