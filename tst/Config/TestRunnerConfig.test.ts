import * as chai from "chai";

const expect = chai.expect;

import {mergeConfig} from "../../src/Config/TestRunnerConfig";

describe("TestRunnerConfig", () => {
    describe("mergeConfig", () => {
        it("should return the 'to' object if from doesn't exist or is invalid", () => {
            const to = {};
            for (const from of [undefined, null, 0, "blah"]) {
                expect(mergeConfig(to, from as any)).to.equal(to);
            }
        });

        describe("timeoutConfig", () => {
            it("should merge over individual values if they're set in from, but not if they're not", () => {
                const to = {
                    timeoutMs: {
                        it: 123,
                        before: 234
                    }
                };

                const from = {
                    timeoutMs: {
                        it: 321,
                        beforeEach: 345
                    }
                };

                const expectedObject = {
                    timeoutMs: {
                        it: 321,
                        before: 234,
                        beforeEach: 345
                    }
                };

                expect(mergeConfig(to, from)).to.deep.equal(expectedObject);
            });

            it("should merge over overall values if they're set", () => {
                const to = {
                    timeoutMs: {
                        it: 123
                    }
                };

                const from = {
                    timeoutMs: 321
                };

                const expectedObject = {
                    timeoutMs: 321
                };

                expect(mergeConfig(to, from)).to.deep.equal(expectedObject);
            });

            it("should not merge over timeout values if they're undefined", () => {
                const to = {
                    timeoutMs: {
                        it: 123
                    }
                };

                const from = {};
                const expectedObject = {
                    timeoutMs: {
                        it: 123
                    }
                };

                expect(mergeConfig(to, from)).to.deep.equal(expectedObject);
            });
        });

        describe("stopOnFail", () => {
            it("should change the value to false if it is by default true", () => {
                const to = {
                    stopOnFirstFail: true
                };
                const from = {
                    stopOnFirstFail: false
                };
                const expectedObject = {
                    stopOnFirstFail: false
                };
                expect(mergeConfig(to, from)).to.deep.equal(expectedObject);
            });

            it("should change the value to true if it is by default false", () => {
                const to = {
                    stopOnFirstFail: false
                };
                const from = {
                    stopOnFirstFail: true
                };
                const expectedObject = {
                    stopOnFirstFail: true
                };
                expect(mergeConfig(to, from)).to.deep.equal(expectedObject);
            });
        });

    });
});
