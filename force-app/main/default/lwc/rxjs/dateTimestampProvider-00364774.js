/**
* @license
* Rxjs 7.0.0 (Custom Build) <https://github.com/ReactiveX/rxjs>
* Apache License 2.0 <https://github.com/ReactiveX/rxjs/blob/master/LICENSE.txt>
* Build By: ExiaHuang 
* Build Date: 2020-11-29
* lwc-rxjs: https://github.com/exiahuang/lwc-rxjs
*/
import { e as createErrorClass, O as Observable, E as EMPTY_SUBSCRIPTION, S as Subscription, f as arrRemove } from './Observable-e9323dae.js';

const ObjectUnsubscribedError = createErrorClass((_super) => function ObjectUnsubscribedErrorImpl() {
    _super(this);
    this.name = 'ObjectUnsubscribedError';
    this.message = 'object unsubscribed';
});

class Subject extends Observable {
    constructor() {
        super();
        this.observers = [];
        this.closed = false;
        this.isStopped = false;
        this.hasError = false;
        this.thrownError = null;
    }
    lift(operator) {
        const subject = new AnonymousSubject(this, this);
        subject.operator = operator;
        return subject;
    }
    _throwIfClosed() {
        if (this.closed) {
            throw new ObjectUnsubscribedError();
        }
    }
    next(value) {
        this._throwIfClosed();
        if (!this.isStopped) {
            const copy = this.observers.slice();
            for (const observer of copy) {
                observer.next(value);
            }
        }
    }
    error(err) {
        this._throwIfClosed();
        if (!this.isStopped) {
            this.hasError = this.isStopped = true;
            this.thrownError = err;
            const { observers } = this;
            while (observers.length) {
                observers.shift().error(err);
            }
        }
    }
    complete() {
        this._throwIfClosed();
        if (!this.isStopped) {
            this.isStopped = true;
            const { observers } = this;
            while (observers.length) {
                observers.shift().complete();
            }
        }
    }
    unsubscribe() {
        this.isStopped = this.closed = true;
        this.observers = null;
    }
    _trySubscribe(subscriber) {
        this._throwIfClosed();
        return super._trySubscribe(subscriber);
    }
    _subscribe(subscriber) {
        this._throwIfClosed();
        this._checkFinalizedStatuses(subscriber);
        return this._innerSubscribe(subscriber);
    }
    _innerSubscribe(subscriber) {
        const { hasError, isStopped, observers } = this;
        return hasError || isStopped
            ? EMPTY_SUBSCRIPTION
            : (observers.push(subscriber), new Subscription(() => arrRemove(this.observers, subscriber)));
    }
    _checkFinalizedStatuses(subscriber) {
        const { hasError, thrownError, isStopped } = this;
        if (hasError) {
            subscriber.error(thrownError);
        }
        else if (isStopped) {
            subscriber.complete();
        }
    }
    asObservable() {
        const observable = new Observable();
        observable.source = this;
        return observable;
    }
}
Subject.create = (destination, source) => {
    return new AnonymousSubject(destination, source);
};
class AnonymousSubject extends Subject {
    constructor(destination, source) {
        super();
        this.destination = destination;
        this.source = source;
    }
    next(value) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.next) === null || _b === void 0 ? void 0 : _b.call(_a, value);
    }
    error(err) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.call(_a, err);
    }
    complete() {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.complete) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    _subscribe(subscriber) {
        var _a, _b;
        return (_b = (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber)) !== null && _b !== void 0 ? _b : EMPTY_SUBSCRIPTION;
    }
}

const dateTimestampProvider = {
    now() {
        return (dateTimestampProvider.delegate || Date).now();
    },
    delegate: undefined,
};

export { AnonymousSubject as A, ObjectUnsubscribedError as O, Subject as S, dateTimestampProvider as d };
