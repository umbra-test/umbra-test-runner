import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

import {TestRunner} from "../../src/TestRunner";
import {TestResult} from "../../src";

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

    describe("failing tests", () => {
        it("should update the run results if the test case throws", () => {
            const error = new Error("random-error");

            testRunner.it("should throw", () => {
                throw error;
            });

            return testRunner.run().then((runResults) => {
                expect(runResults.totalFailures).to.equal(1);
                expect(runResults.testResults[0].error).to.equal(error);
            });
        });

        it("should update the run results if the test case returns a rejected promise", () => {
            const error = new Error("random-error");
            testRunner.it("should throw", () => Promise.reject(error));

            return testRunner.run().then((runResults) => {
                expect(runResults.totalFailures).to.equal(1);
                expect(runResults.testResults[0].error).to.equal(error);
            });
        });
    });

    describe("onBeforeTestEnd", () => {
        it("should be emitted before a test returns success", () => {
            const testSpy = sinon.spy();
            const expectedTitle = "title";

            const eventSpy = sinon.spy();
            testRunner.on("onBeforeTestEnd", eventSpy);

            testRunner.it(expectedTitle, testSpy);

            return testRunner.run().then(() => {
                expect(eventSpy).to.have.been.calledWithMatch({
                    testInfo: {
                        title: expectedTitle
                    }
                });
            });
        });

        it("should be emitted for every test", () => {
            const expectedTitleA = "titleA";
            const expectedTitleB = "titleB";

            const eventSpy = sinon.spy();
            testRunner.on("onBeforeTestEnd", eventSpy);

            testRunner.it(expectedTitleA, sinon.spy());
            testRunner.it(expectedTitleB, sinon.spy());

            return testRunner.run().then(() => {
                expect(eventSpy).to.have.been.calledWithMatch({
                    testInfo: {
                        title: expectedTitleA
                    }
                });
                expect(eventSpy).to.have.been.calledWithMatch({
                    testInfo: {
                        title: expectedTitleB
                    }
                });
            });
        });

        it("should allow transforming a successful test into a failing one via throwing an error", () => {
            const error = new Error("success->error");
            const eventSpy = sinon.stub().throws(error);
            testRunner.on("onBeforeTestEnd", eventSpy);

            const resultSpy = sinon.spy();
            testRunner.on("onTestEnd", resultSpy);

            const testName = "success->error";
            testRunner.it(testName, sinon.spy());

            return testRunner.run().then(() => {
                expect(resultSpy).to.have.been.calledWithMatch({
                    error: error
                });
            });
        });

        it("should allow transforming a successful test into a failing one via returning a rejected Promise", () => {
            const error = new Error("success->error");
            testRunner.on("onBeforeTestEnd", () => Promise.reject(error));

            const resultSpy = sinon.spy();
            testRunner.on("onTestEnd", resultSpy);

            const testName = "success->error";
            testRunner.it(testName, sinon.spy());

            return testRunner.run().then(() => {
                expect(resultSpy).to.have.been.calledWithMatch({
                    error: error
                });
            });
        });

        it("should allow transforming a successful test into a failing one via modifying of the TestResult", () => {
            const error = new Error("success->error");
            testRunner.on("onBeforeTestEnd", (testResult) => {
                testResult.error = error;
                testResult.result = "fail";
            });

            const resultSpy = sinon.spy();
            testRunner.on("onTestEnd", resultSpy);

            const testName = "success->error";
            testRunner.it(testName, sinon.spy());

            return testRunner.run().then(() => {
                expect(resultSpy).to.have.been.calledWithMatch({
                    error: error
                });
            });
        });

        it("should allow transforming a failing test into a succeeding one via modifying of the TestResult", () => {
            testRunner.on("onBeforeTestEnd", (testResult) => {
                delete testResult.error;
                testResult.result = "success";
            });

            const resultSpy = sinon.spy();
            testRunner.on("onTestEnd", resultSpy);

            const testName = "error->success";
            testRunner.it(testName, () => Promise.reject(new Error("random-error")));

            return testRunner.run().then((runResults) => {
                expect(runResults.totalTests).to.equal(1);
                expect(runResults.totalSuccesses).to.equal(1);
                expect(runResults.totalFailures).to.equal(0);
                expect(runResults.testResults[0].result).to.equal("success");
                expect(resultSpy).to.have.been.calledWithMatch({
                    error: undefined
                });
            });
        });
    });

    describe("changing test files", () => {
        it("should emit test cases per file they're executed in", () => {
            const expectedCallback = sinon.spy();
            testRunner.on("onTestEnd", expectedCallback);

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
                } as Partial<TestResult>);

                expect(expectedCallback).to.have.been.calledWithMatch({
                    testInfo: {
                        title: testFileBTestTitle,
                        absoluteFilePath: testFileB
                    }
                } as Partial<TestResult>);
            });
        });
    });
});
