import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";

import {AsyncPromisifier} from "../../src/Async/AsyncPromisifier";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("AsyncPromisifier", () => {
    let promisifier: AsyncPromisifier;
    let results: object;
    beforeEach(() => {
        promisifier = new AsyncPromisifier();
        results = {};
    });

    const expectSuccess = (fn, expectedResult: any, name: string = "name") => {
        return expect(promisifier.exec(fn, name)).to.eventually.equal(expectedResult);
    };

    const expectFailure = (fn, expectedResult: any, name: string = "name") => {
        return expect(promisifier.exec(fn, name)).to.eventually.be.rejectedWith(expectedResult);
    };

    describe("synchronous results", () => {
        it("should resolve with the result returned by the function", () => {
            const expectedResult = 1701;
            return expectSuccess(() => expectedResult, expectedResult);
        });

        it("should resolve with null if returned by the function", () => {
            const expectedResult = null;
            return expectSuccess(() => expectedResult, expectedResult);
        });

        it("should resolve with undefined if returned by the function", () => {
            return expectSuccess(() => {
            }, undefined);
        });

        it("should reject if an error is thrown", () => {
            const error = new Error("Rejected!");

            return expectFailure(() => {
                throw error;
            }, error);
        });
    });

    describe("promises", () => {
        it("should pass the result of the promise directly through", () => {
            const expectedResult = 1701;
            return expectSuccess(() => Promise.resolve(expectedResult), expectedResult);
        });

        it("should reject if the promise rejects", () => {
            const error = new Error("Rejected!");
            return expectFailure(() => Promise.reject(error), error);
        });
    });

    describe("done callback", () => {
        it("should resolve the promise with the result of calling done", () => {
            const expectedResult = 1701;
            const fn = (done) => {
                done(expectedResult);
            };

            return expectSuccess(fn, expectedResult);
        });

        it("should reject the promise if the result of calling done is an error", () => {
            const error = new Error("Rejected!");
            const fn = (done) => {
                done(error);
            };

            return expectFailure(fn, error);
        });
    });

    describe("naming", () => {
        it("should name the function based on the provided param", () => {
            const expectedResult = 1701;
            const fn = () => expectedResult;
            const expectedName = "expectedName";
            const promise = expectSuccess(fn, expectedResult, expectedName);
            expect(fn["name"]).to.equal(expectedName);
            return promise;
        });
    });
});
