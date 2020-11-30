/**
* @license
* Rxjs 7.0.0 (Custom Build) <https://github.com/ReactiveX/rxjs>
* Apache License 2.0 <https://github.com/ReactiveX/rxjs/blob/master/LICENSE.txt>
* Build By: ExiaHuang 
* Build Date: 2020-11-29
* lwc-rxjs: https://github.com/exiahuang/lwc-rxjs
*/
import { O as Observable, i as isFunction, o as observable, S as Subscription, r as reportUnhandledError } from './Observable-e9323dae.js';

function scheduleArray(input, scheduler) {
    return new Observable((subscriber) => {
        let i = 0;
        return scheduler.schedule(function () {
            if (i === input.length) {
                subscriber.complete();
            }
            else {
                subscriber.next(input[i++]);
                if (!subscriber.closed) {
                    this.schedule();
                }
            }
        });
    });
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0
THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.
See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}
function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}
function __values(o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
}
function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

const isArrayLike = ((x) => x && typeof x.length === 'number' && typeof x !== 'function');

function isPromise(value) {
    return isFunction(value === null || value === void 0 ? void 0 : value.then);
}

function getSymbolIterator() {
    if (typeof Symbol !== 'function' || !Symbol.iterator) {
        return '@@iterator';
    }
    return Symbol.iterator;
}
const iterator = getSymbolIterator();

function scheduleObservable(input, scheduler) {
    return new Observable(subscriber => {
        const sub = new Subscription();
        sub.add(scheduler.schedule(() => {
            const observable$1 = input[observable]();
            sub.add(observable$1.subscribe({
                next(value) { sub.add(scheduler.schedule(() => subscriber.next(value))); },
                error(err) { sub.add(scheduler.schedule(() => subscriber.error(err))); },
                complete() { sub.add(scheduler.schedule(() => subscriber.complete())); },
            }));
        }));
        return sub;
    });
}

function schedulePromise(input, scheduler) {
    return new Observable((subscriber) => {
        return scheduler.schedule(() => input.then((value) => {
            subscriber.add(scheduler.schedule(() => {
                subscriber.next(value);
                subscriber.add(scheduler.schedule(() => subscriber.complete()));
            }));
        }, (err) => {
            subscriber.add(scheduler.schedule(() => subscriber.error(err)));
        }));
    });
}

function caughtSchedule(subscriber, scheduler, execute, delay = 0) {
    const subscription = scheduler.schedule(function () {
        try {
            execute.call(this);
        }
        catch (err) {
            subscriber.error(err);
        }
    }, delay);
    subscriber.add(subscription);
    return subscription;
}

function scheduleIterable(input, scheduler) {
    return new Observable((subscriber) => {
        let iterator$1;
        subscriber.add(scheduler.schedule(() => {
            iterator$1 = input[iterator]();
            caughtSchedule(subscriber, scheduler, function () {
                const { value, done } = iterator$1.next();
                if (done) {
                    subscriber.complete();
                }
                else {
                    subscriber.next(value);
                    this.schedule();
                }
            });
        }));
        return () => isFunction(iterator$1 === null || iterator$1 === void 0 ? void 0 : iterator$1.return) && iterator$1.return();
    });
}

function isInteropObservable(input) {
    return isFunction(input[observable]);
}

function isIterable(input) {
    return isFunction(input === null || input === void 0 ? void 0 : input[iterator]);
}

function scheduleAsyncIterable(input, scheduler) {
    if (!input) {
        throw new Error('Iterable cannot be null');
    }
    return new Observable(subscriber => {
        const sub = new Subscription();
        sub.add(scheduler.schedule(() => {
            const iterator = input[Symbol.asyncIterator]();
            sub.add(scheduler.schedule(function () {
                iterator.next().then(result => {
                    if (result.done) {
                        subscriber.complete();
                    }
                    else {
                        subscriber.next(result.value);
                        this.schedule();
                    }
                });
            }));
        }));
        return sub;
    });
}

function isAsyncIterable(obj) {
    return Symbol.asyncIterator && isFunction(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
}

function createInvalidObservableTypeError(input) {
    return new TypeError(`You provided ${input !== null && typeof input === 'object' ? 'an invalid object' : `'${input}'`} where a stream was expected. You can provide an Observable, Promise, Array, AsyncIterable, or Iterable.`);
}

function scheduled(input, scheduler) {
    if (input != null) {
        if (isInteropObservable(input)) {
            return scheduleObservable(input, scheduler);
        }
        if (isArrayLike(input)) {
            return scheduleArray(input, scheduler);
        }
        if (isPromise(input)) {
            return schedulePromise(input, scheduler);
        }
        if (isAsyncIterable(input)) {
            return scheduleAsyncIterable(input, scheduler);
        }
        if (isIterable(input)) {
            return scheduleIterable(input, scheduler);
        }
    }
    throw createInvalidObservableTypeError(input);
}

function from(input, scheduler) {
    return scheduler ? scheduled(input, scheduler) : innerFrom(input);
}
function innerFrom(input) {
    if (input instanceof Observable) {
        return input;
    }
    if (input != null) {
        if (isInteropObservable(input)) {
            return fromInteropObservable(input);
        }
        if (isArrayLike(input)) {
            return fromArrayLike(input);
        }
        if (isPromise(input)) {
            return fromPromise(input);
        }
        if (isAsyncIterable(input)) {
            return fromAsyncIterable(input);
        }
        if (isIterable(input)) {
            return fromIterable(input);
        }
    }
    throw createInvalidObservableTypeError(input);
}
function fromInteropObservable(obj) {
    return new Observable((subscriber) => {
        const obs = obj[observable]();
        if (isFunction(obs.subscribe)) {
            return obs.subscribe(subscriber);
        }
        throw new TypeError('Provided object does not correctly implement Symbol.observable');
    });
}
function fromArrayLike(array) {
    return new Observable((subscriber) => {
        for (let i = 0; i < array.length && !subscriber.closed; i++) {
            subscriber.next(array[i]);
        }
        subscriber.complete();
    });
}
function fromPromise(promise) {
    return new Observable((subscriber) => {
        promise
            .then((value) => {
            if (!subscriber.closed) {
                subscriber.next(value);
                subscriber.complete();
            }
        }, (err) => subscriber.error(err))
            .then(null, reportUnhandledError);
    });
}
function fromIterable(iterable) {
    return new Observable((subscriber) => {
        const iterator$1 = iterable[iterator]();
        while (!subscriber.closed) {
            const { done, value } = iterator$1.next();
            if (done) {
                subscriber.complete();
            }
            else {
                subscriber.next(value);
            }
        }
        return () => isFunction(iterator$1 === null || iterator$1 === void 0 ? void 0 : iterator$1.return) && iterator$1.return();
    });
}
function fromAsyncIterable(asyncIterable) {
    return new Observable((subscriber) => {
        process(asyncIterable, subscriber).catch((err) => subscriber.error(err));
    });
}
function process(asyncIterable, subscriber) {
    var asyncIterable_1, asyncIterable_1_1;
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            for (asyncIterable_1 = __asyncValues(asyncIterable); asyncIterable_1_1 = yield asyncIterable_1.next(), !asyncIterable_1_1.done;) {
                const value = asyncIterable_1_1.value;
                subscriber.next(value);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return)) yield _a.call(asyncIterable_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        subscriber.complete();
    });
}

export { __rest as _, isArrayLike as a, scheduled as b, caughtSchedule as c, scheduleArray as d, fromArrayLike as e, from as f, innerFrom as i, scheduleIterable as s };
