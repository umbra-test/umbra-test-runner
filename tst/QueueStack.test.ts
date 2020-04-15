import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

import {QueueStack} from "../src/QueueStack";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;

describe("QueueStack", () => {

    let queueStack: QueueStack<Object>;
    beforeEach(() => {
        queueStack = new QueueStack<Object>();
    });

    describe("pushOnTop", () => {
        it("should push an element onto a new stack on a new queue, if the queueStack is empty", () => {
            const obj = {};
            queueStack.pushOnTop(obj);

            const topStack = queueStack.popStack();
            expect(topStack).to.have.length(1);
            expect(topStack.pop()).to.equal(obj);
        });

        it("should push an element onto the top stack, if the queue has one empty stack", () => {
            queueStack.pushStack([]);

            const obj = {};
            queueStack.pushOnTop(obj);

            const topStack = queueStack.popStack();
            expect(topStack).to.have.length(1);
            expect(topStack.pop()).to.equal(obj);
        });

        it("should push an element onto the top stack, if the queue has one stack with entries", () => {
            queueStack.pushStack([{}, {}]);

            const obj = {};
            queueStack.pushOnTop(obj);

            const topStack = queueStack.popStack();
            expect(topStack).to.have.length(3);
            expect(topStack.pop()).to.equal(obj);
        });

        it("should push an element onto the top stack, if the queue has multiple stacks with entries", () => {
            queueStack.pushStack([{}]);
            queueStack.pushStack([{}, {}]);

            const obj = {};
            queueStack.pushOnTop(obj);

            const topStack = queueStack.shiftStack();
            expect(topStack).to.have.length(2);
            expect(topStack.pop()).to.equal(obj);
        });
    });

    describe("pushStack", () => {
        it("should push a stack onto the queue if none exist", () => {
            const stack = [];
            queueStack.pushStack(stack);

            expect(queueStack.shiftStack()).to.equal(stack);
        });

        it("should push a stack onto the end of the queue", () => {
            queueStack.pushStack([]);

            const stack = [];
            queueStack.pushStack(stack);

            expect(queueStack.popStack()).to.equal(stack);
        });
    });

    describe("popStack", () => {
        it("should return undefined if the queue is empty", () => {
            expect(queueStack.popStack()).to.equal(undefined);
        });

        it("should return the stack at the end of the queue", () => {
            queueStack.pushStack([]);

            const stack = [];
            queueStack.pushStack(stack);

            expect(queueStack.popStack()).to.equal(stack);
        });

        it("should remove the entry returned", () => {
            const stack = [];
            queueStack.pushStack(stack);
            expect(queueStack.popStack()).to.equal(stack);
            expect(queueStack.popStack()).to.equal(undefined);
        });
    });

    describe("shiftStack", () => {
        it("should return undefined if the queue is empty", () => {
            expect(queueStack.shiftStack()).to.equal(undefined);
        });

        it("should return the stack at the start of the queue", () => {
            const stack = [];
            queueStack.pushStack(stack);
            queueStack.pushStack([]);

            expect(queueStack.shiftStack()).to.equal(stack);
        });

        it("should remove the entry returned", () => {
            const stack = [];
            queueStack.pushStack(stack);
            expect(queueStack.shiftStack()).to.equal(stack);
            expect(queueStack.shiftStack()).to.equal(undefined);
        });
    });

    describe("traverseLevelOrder", () => {
        it("should do nothing if there are no elements", () => {
            const spy = sinon.spy();

            return queueStack.traverseLevelOrder(spy).then(() => {
                expect(spy).to.not.have.been.called;
            });
        });

        it("should call the callback for each element in order", () => {
            const a = {};
            const b = {};
            const c = {};

            queueStack.pushStack([a]);
            queueStack.pushStack([b, c]);

            let aCalled = false;
            let bCalled = false;
            let cCalled = false;

            return queueStack.traverseLevelOrder((element) => {
                if (element === a && !aCalled && !bCalled && !cCalled) {
                    aCalled = true;
                    return Promise.resolve();
                }

                if (element === b && aCalled && !bCalled && !cCalled) {
                    bCalled = true;
                    return Promise.resolve();
                }

                if (element === c && aCalled && bCalled && !cCalled) {
                    cCalled = true;
                    return Promise.resolve();
                }

                return Promise.reject(new Error("Traversed out of order!"));
            });
        });
    });

    describe("traverseInverseLevelOrder", () => {
        it("should do nothing if there are no elements", () => {
            const spy = sinon.spy();

            return queueStack.traverseInverseLevelOrder(spy).then(() => {
                expect(spy).to.not.have.been.called;
            });
        });

        it("should call the callback for each element in inverse order", () => {
            const a = {};
            const b = {};
            const c = {};

            queueStack.pushStack([a]);
            queueStack.pushStack([b, c]);

            let aCalled = false;
            let bCalled = false;
            let cCalled = false;

            return queueStack.traverseInverseLevelOrder((element) => {
                if (element === c && !aCalled && !bCalled && !cCalled) {
                    cCalled = true;
                    return Promise.resolve();
                }

                if (element === b && !aCalled && !bCalled && cCalled) {
                    bCalled = true;
                    return Promise.resolve();
                }

                if (element === a && !aCalled && bCalled && cCalled) {
                    aCalled = true;
                    return Promise.resolve();
                }

                return Promise.reject(new Error("Traversed out of expected order!"));
            });
        });
    });

    describe("reset", () => {
        it("should empty the queue", () => {
            queueStack.pushStack([]);
            queueStack.reset();

            expect(queueStack.popStack()).to.be.undefined;
        });
    });
});
