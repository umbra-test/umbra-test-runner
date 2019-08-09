import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";

import {TimeoutPromisifier} from "../../src/Async/TimeoutPromisifier";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("TimeoutPromisifier", () => {
    let promisifier: TimeoutPromisifier;
    beforeEach(() => {
        promisifier = new TimeoutPromisifier();
    });

    it("should return the original promise if the timeout is 0", () => {
        const result = {};
        return expect(promisifier.wrap(Promise.resolve(result), 0)).to.eventually.equal(result);
    });

    it("should return the original promise if the timeout is less than 0", () => {
        const result = {};
        return expect(promisifier.wrap(Promise.resolve(result), -1)).to.eventually.equal(result);
    });

    it("should return the original promise if it is already resolved", () => {
        const result = {};
        return expect(promisifier.wrap(Promise.resolve(result), 100)).to.eventually.equal(result);
    });

    it("should return the original promise if it is already rejected", () => {
        const result = new Error();
        return expect(promisifier.wrap(Promise.reject(result), 100)).to.eventually.be.rejectedWith(result);
    });

    it("should return the original promise if it resolves before the timeout", () => {
        const result = {};
        const promise = new Promise((resolve) => {
            setTimeout(() => resolve(result), 1);
        });

        return expect(promisifier.wrap(promise, 100)).to.eventually.equal(result);
    });

    it("should return the original promise if it rejects before the timeout", () => {
        const result = new Error();
        const promise = new Promise((resolve, reject) => {
            setTimeout(() => reject(result), 1);
        });

        return expect(promisifier.wrap(promise, 100)).to.eventually.be.rejectedWith(result);
    });

    it("should reject if the timeout occurs before the promise", () => {
        const result = {};
        const promise = new Promise((resolve) => {
            setTimeout(() => resolve(result), 10);
        });

        return expect(promisifier.wrap(promise, 1)).to.eventually.be.rejected;
    });

});
