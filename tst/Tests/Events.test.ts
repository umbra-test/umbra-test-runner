import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

import {TestRunner} from "../../src/TestRunner";

chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;

describe("Events", () => {

    let testRunner: TestRunner;

    beforeEach(() => {
        testRunner = new TestRunner();
    });

    describe("eventEmitterUsage", () => {
        let mockEventEmitter;
        let testRunner: TestRunner;

        beforeEach(() => {
            mockEventEmitter = {
                on: sinon.spy(),
                once: sinon.spy(),
                off: sinon.spy()
            };
            testRunner = new TestRunner(undefined, mockEventEmitter);
        });

        it("should delegate on to an underlying event emitter", () => {
            const expectedEvent = "beforeTest";
            const expectedCallback = sinon.spy();

            testRunner.on(expectedEvent, expectedCallback);
            expect(mockEventEmitter.on).to.have.been.calledWith(expectedEvent, expectedCallback);
        });

        it("should delegate once to an underlying event emitter", () => {
            const expectedEvent = "beforeTest";
            const expectedCallback = sinon.spy();

            testRunner.once(expectedEvent, expectedCallback);
            expect(mockEventEmitter.once).to.have.been.calledWith(expectedEvent, expectedCallback);
        });

        it("should delegate off to an underlying event emitter", () => {
            const expectedEvent = "beforeTest";
            const expectedCallback = sinon.spy();

            testRunner.off(expectedEvent, expectedCallback);
            expect(mockEventEmitter.off).to.have.been.calledWith(expectedEvent, expectedCallback);
        });
    });

    describe("beforeTest", () => {
        it("should be emitted before a test is evaluated", () => {
            const testSpy = sinon.spy();
            const expectedTitle = "title";

            const eventSpy = sinon.spy();
            testRunner.on("beforeTest", eventSpy);

            testRunner.it(expectedTitle, testSpy);

            return testRunner.run().then(() => {
                expect(eventSpy).to.have.been.calledWith(expectedTitle);
                expect(testSpy).to.have.been.calledAfter(eventSpy);
            });
        });

        it("should be emitted for every test", () => {
            const expectedTitleA = "titleA";
            const expectedTitleB = "titleB";

            const eventSpy = sinon.spy();
            testRunner.on("beforeTest", eventSpy);

            testRunner.it(expectedTitleA, sinon.spy());
            testRunner.it(expectedTitleB, sinon.spy());

            return testRunner.run().then(() => {
                expect(eventSpy).to.have.been.calledWith(expectedTitleA);
                expect(eventSpy).to.have.been.calledWith(expectedTitleB);
            });
        });
    });

    describe("beforeTestSuccess", () => {
        it("should be emitted before a test returns success", () => {
            const testSpy = sinon.spy();
            const expectedTitle = "title";

            const eventSpy = sinon.spy();
            testRunner.on("beforeTestSuccess", eventSpy);

            testRunner.it(expectedTitle, testSpy);

            return testRunner.run().then(() => {
                expect(eventSpy).to.have.been.calledWith(expectedTitle);
            });
        });

        it("should be emitted for every test", () => {
            const expectedTitleA = "titleA";
            const expectedTitleB = "titleB";

            const eventSpy = sinon.spy();
            testRunner.on("beforeTestSuccess", eventSpy);

            testRunner.it(expectedTitleA, sinon.spy());
            testRunner.it(expectedTitleB, sinon.spy());

            return testRunner.run().then(() => {
                expect(eventSpy).to.have.been.calledWith(expectedTitleA);
                expect(eventSpy).to.have.been.calledWith(expectedTitleB);
            });
        });

        it("should allow transforming a successful test into a failing one via throwing an error", () => {
            const error = new Error("success->error");
            const eventSpy = sinon.stub().throws(error);
            testRunner.on("beforeTestSuccess", eventSpy);

            const successSpy = sinon.spy();
            testRunner.on("testSuccess", successSpy);

            const failSpy = sinon.spy();
            testRunner.on("testFail", failSpy);

            const testName = "success->error";
            testRunner.it(testName, sinon.spy());

            return testRunner.run().catch(() => {
                expect(successSpy).to.not.have.been.called;
                expect(failSpy).to.have.been.calledWith(testName, error);
            });
        });

        it("should allow transforming a successful test into a failing one via returning a rejected Promise", () => {
            const error = new Error("success->error");
            const eventSpy = sinon.stub().returns(Promise.reject(error));
            testRunner.on("beforeTestSuccess", eventSpy);

            const successSpy = sinon.spy();
            testRunner.on("testSuccess", successSpy);

            const failSpy = sinon.spy();
            testRunner.on("testFail", failSpy);

            const testName = "success->error";
            testRunner.it(testName, sinon.spy());

            return testRunner.run().catch(() => {
                expect(successSpy).to.not.have.been.called;
                expect(failSpy).to.have.been.calledWith(testName, error);
            });
        });
    });

    describe("testSuccess", () => {
        it("should be emitted only for tests that succeed", () => {
            const testSpy = sinon.spy();
            const expectedTitle = "title";

            const eventSpy = sinon.spy();
            testRunner.on("testSuccess", eventSpy);

            testRunner.it(expectedTitle, testSpy);
            testRunner.it("other-test", sinon.stub().throws(new Error("expected-error")));

            return testRunner.run().catch(() => {
                expect(eventSpy).to.have.been.calledWith(expectedTitle);
                expect(eventSpy).to.have.been.calledAfter(testSpy);
            });
        });

        it("should be emitted for every succeeding test", () => {
            const expectedTitleA = "titleA";
            const expectedTitleB = "titleB";

            const eventSpy = sinon.spy();
            testRunner.on("testSuccess", eventSpy);

            testRunner.it(expectedTitleA, sinon.spy());
            testRunner.it(expectedTitleB, sinon.spy());

            return testRunner.run().then(() => {
                expect(eventSpy).to.have.been.calledWith(expectedTitleA);
                expect(eventSpy).to.have.been.calledWith(expectedTitleB);
            });
        });
    });

    describe("testFail", () => {
        it("should be emitted only for tests that fail", () => {
            const testSpy = sinon.spy();
            const expectedTitle = "title";
            const expectedError = new Error("expected-error");

            const eventSpy = sinon.spy();
            testRunner.on("testFail", eventSpy);

            testRunner.it("other-test", testSpy);
            testRunner.it(expectedTitle, sinon.stub().throws(expectedError));

            return testRunner.run().catch(() => {
                expect(eventSpy).to.have.been.calledWith(expectedTitle, expectedError);
                expect(eventSpy).to.have.been.calledAfter(testSpy);
            });
        });

        it("should be emitted for only the first failing test (all tests after fail aren't executed)", () => {
            const expectedTitleA = "titleA";
            const expectedErrorA = new Error("titleA-error");
            testRunner.it(expectedTitleA, sinon.stub().throws(expectedErrorA));

            const expectedTitleB = "titleB";
            const expectedErrorB = new Error("titleB-error");
            testRunner.it(expectedTitleB, sinon.stub().throws(expectedErrorB));

            const eventSpy = sinon.spy();
            testRunner.on("testFail", eventSpy);


            return testRunner.run().catch(() => {
                expect(eventSpy).to.have.been.calledWith(expectedTitleA, expectedErrorA);
                expect(eventSpy).to.not.have.been.calledWith(expectedTitleB, expectedErrorB);
            });
        });
    });

    describe("testTimeout", () => {
        it("should be emitted only for tests that timeout", () => {

        });

        it("should be emitted for every timing out test", () => {

        });
    });

    describe("beforeDescribe", () => {
        it("should be emitted before a describe is evaluated", () => {

        });

        it("should be emitted for every describe", () => {

        });
    });

    describe("afterDescribe", () => {
        it("should be emitted after a describe is evaluated (and all its tests too)", () => {

        });

        it("should should be emitted for every describe", () => {

        });
    });
});