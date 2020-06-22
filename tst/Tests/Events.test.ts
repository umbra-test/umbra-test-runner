import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

import {TestRunner} from "../../src/TestRunner";
import {TestResults} from "../../src";

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
            const expectedEvent = "onTestStart";
            const expectedCallback = sinon.spy();

            testRunner.on(expectedEvent, expectedCallback);
            expect(mockEventEmitter.on).to.have.been.calledWith(expectedEvent, expectedCallback);
        });

        it("should delegate once to an underlying event emitter", () => {
            const expectedEvent = "onTestStart";
            const expectedCallback = sinon.spy();

            testRunner.once(expectedEvent, expectedCallback);
            expect(mockEventEmitter.once).to.have.been.calledWith(expectedEvent, expectedCallback);
        });

        it("should delegate off to an underlying event emitter", () => {
            const expectedEvent = "onTestStart";
            const expectedCallback = sinon.spy();

            testRunner.off(expectedEvent, expectedCallback);
            expect(mockEventEmitter.off).to.have.been.calledWith(expectedEvent, expectedCallback);
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
                expect(eventSpy).to.have.been.calledWithMatch({
                    title: expectedTitle
                });
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
                expect(eventSpy).to.have.been.calledWithMatch({
                    title: expectedTitleA
                });
                expect(eventSpy).to.have.been.calledWithMatch({
                    title: expectedTitleB
                });
            });
        });

        it("should allow transforming a successful test into a failing one via throwing an error", () => {
            const error = new Error("success->error");
            const eventSpy = sinon.stub().throws(error);
            testRunner.on("beforeTestSuccess", eventSpy);

            const resultSpy = sinon.spy();
            testRunner.on("onTestResult", resultSpy);

            const testName = "success->error";
            testRunner.it(testName, sinon.spy());

            return testRunner.run().catch(() => {
                expect(resultSpy).to.have.been.calledWithMatch({
                    error: error
                });
            });
        });

        it("should allow transforming a successful test into a failing one via returning a rejected Promise", () => {
            const error = new Error("success->error");
            testRunner.on("beforeTestSuccess", () => Promise.reject(error));

            const resultSpy = sinon.spy();
            testRunner.on("onTestResult", resultSpy);

            const testName = "success->error";
            testRunner.it(testName, sinon.spy());

            return testRunner.run().catch(() => {
                expect(resultSpy).to.have.been.calledWithMatch({
                    error: error
                });
            });
        });
    });

    describe("changing test files", () => {
        it("should emit test cases per file they're executed in", () => {
            const expectedCallback = sinon.spy();
            testRunner.on("onTestResult", expectedCallback);

            const testFileA = "test-file-a";
            testRunner.setCurrentFile(testFileA);

            const testFileATestTitle = "test-title-a";
            testRunner.it(testFileATestTitle, sinon.spy());

            const testFileB = "test-file-b";
            testRunner.setCurrentFile(testFileB);

            const testFileBTestTitle = "test-title-b";
            testRunner.it(testFileBTestTitle, sinon.spy());

            return testRunner.run().then(() => {
                expect(expectedCallback).to.have.been.calledWithMatch({
                    testInfo: {
                        title: testFileATestTitle,
                        absoluteFilePath: testFileA
                    }
                } as Partial<TestResults>);

                expect(expectedCallback).to.have.been.calledWithMatch({
                    testInfo: {
                        title: testFileBTestTitle,
                        absoluteFilePath: testFileB
                    }
                } as Partial<TestResults>);
            });
        });
    });
});
