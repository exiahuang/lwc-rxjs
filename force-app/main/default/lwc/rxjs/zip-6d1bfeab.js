/**
* @license
* Rxjs 7.0.0 (Custom Build) <https://github.com/ReactiveX/rxjs>
* Apache License 2.0 <https://github.com/ReactiveX/rxjs/blob/master/LICENSE.txt>
* Build By: ExiaHuang 
* Build Date: 2020-11-29
* lwc-rxjs: https://github.com/exiahuang/lwc-rxjs
*/
import { O as Observable, S as Subscription, e as createErrorClass, b as identity, c as Subscriber, i as isFunction, n as noop } from './Observable-e9323dae.js';
import { o as operate, m as map } from './map-75f95f4c.js';
import { O as OperatorSubscriber } from './OperatorSubscriber-f3d1dca1.js';
import { S as Subject } from './dateTimestampProvider-00364774.js';
import { a as AsyncScheduler, A as AsyncAction, c as popScheduler, p as popResultSelector, b as internalFromArray, i as isScheduler, E as EMPTY } from './Notification-bc209f77.js';
import { c as caughtSchedule, i as innerFrom, f as from } from './from-3e8021ae.js';

function refCount() {
    return operate((source, subscriber) => {
        let connection = null;
        source._refCount++;
        const refCounter = new OperatorSubscriber(subscriber, undefined, undefined, undefined, () => {
            if (!source || source._refCount <= 0 || 0 < --source._refCount) {
                connection = null;
                return;
            }
            const sharedConnection = source._connection;
            const conn = connection;
            connection = null;
            if (sharedConnection && (!conn || sharedConnection === conn)) {
                sharedConnection.unsubscribe();
            }
            subscriber.unsubscribe();
        });
        source.subscribe(refCounter);
        if (!refCounter.closed) {
            connection = source.connect();
        }
    });
}

class ConnectableObservable extends Observable {
    constructor(source, subjectFactory) {
        super();
        this.source = source;
        this.subjectFactory = subjectFactory;
        this._subject = null;
        this._refCount = 0;
        this._connection = null;
    }
    _subscribe(subscriber) {
        return this.getSubject().subscribe(subscriber);
    }
    getSubject() {
        const subject = this._subject;
        if (!subject || subject.isStopped) {
            this._subject = this.subjectFactory();
        }
        return this._subject;
    }
    _teardown() {
        this._refCount = 0;
        const { _connection } = this;
        this._subject = this._connection = null;
        _connection === null || _connection === void 0 ? void 0 : _connection.unsubscribe();
    }
    connect() {
        let connection = this._connection;
        if (!connection) {
            connection = this._connection = new Subscription();
            const subject = this.getSubject();
            connection.add(this.source.subscribe(new OperatorSubscriber(subject, undefined, (err) => {
                this._teardown();
                subject.error(err);
            }, () => {
                this._teardown();
                subject.complete();
            }, () => this._teardown())));
            if (connection.closed) {
                this._connection = null;
                connection = Subscription.EMPTY;
            }
        }
        return connection;
    }
    refCount() {
        return refCount()(this);
    }
}

class BehaviorSubject extends Subject {
    constructor(_value) {
        super();
        this._value = _value;
    }
    get value() {
        return this.getValue();
    }
    _subscribe(subscriber) {
        const subscription = super._subscribe(subscriber);
        !subscription.closed && subscriber.next(this._value);
        return subscription;
    }
    getValue() {
        const { hasError, thrownError, _value } = this;
        if (hasError) {
            throw thrownError;
        }
        this._throwIfClosed();
        return _value;
    }
    next(value) {
        super.next((this._value = value));
    }
}

class AsyncSubject extends Subject {
    constructor() {
        super(...arguments);
        this.value = null;
        this.hasValue = false;
        this.isComplete = false;
    }
    _checkFinalizedStatuses(subscriber) {
        const { hasError, hasValue, value, thrownError, isStopped } = this;
        if (hasError) {
            subscriber.error(thrownError);
        }
        else if (isStopped) {
            hasValue && subscriber.next(value);
            subscriber.complete();
        }
    }
    next(value) {
        if (!this.isStopped) {
            this.value = value;
            this.hasValue = true;
        }
    }
    complete() {
        const { hasValue, value, isComplete } = this;
        if (!isComplete) {
            this.isComplete = true;
            hasValue && super.next(value);
            super.complete();
        }
    }
}

const asyncScheduler = new AsyncScheduler(AsyncAction);
const async = asyncScheduler;

const EmptyError = createErrorClass((_super) => function EmptyErrorImpl() {
    _super(this);
    this.name = 'EmptyError';
    this.message = 'no elements in sequence';
});

const ArgumentOutOfRangeError = createErrorClass((_super) => function ArgumentOutOfRangeErrorImpl() {
    _super(this);
    this.name = 'ArgumentOutOfRangeError';
    this.message = 'argument out of range';
});

const NotFoundError = createErrorClass((_super) => function NotFoundErrorImpl(message) {
    _super(this);
    this.name = 'NotFoundError';
    this.message = message;
});

const SequenceError = createErrorClass((_super) => function SequenceErrorImpl(message) {
    _super(this);
    this.name = 'SequenceError';
    this.message = message;
});

function isValidDate(value) {
    return value instanceof Date && !isNaN(value);
}

const TimeoutError = createErrorClass((_super) => function TimeoutErrorImpl(info = null) {
    _super(this);
    this.message = 'Timeout has occurred';
    this.name = 'TimeoutError';
    this.info = info;
});
function timeout(config, schedulerArg) {
    const { first, each, with: _with = timeoutErrorFactory, scheduler = schedulerArg !== null && schedulerArg !== void 0 ? schedulerArg : asyncScheduler, meta = null } = (isValidDate(config)
        ? { first: config }
        : typeof config === 'number'
            ? { each: config }
            : config);
    if (first == null && each == null) {
        throw new TypeError('No timeout provided.');
    }
    return operate((source, subscriber) => {
        let originalSourceSubscription;
        let timerSubscription;
        let lastValue = null;
        let seen = 0;
        const startTimer = (delay) => {
            timerSubscription = caughtSchedule(subscriber, scheduler, () => {
                originalSourceSubscription.unsubscribe();
                innerFrom(_with({
                    meta,
                    lastValue,
                    seen,
                })).subscribe(subscriber);
            }, delay);
        };
        originalSourceSubscription = source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.unsubscribe();
            seen++;
            subscriber.next((lastValue = value));
            each > 0 && startTimer(each);
        }, undefined, undefined, () => {
            if (!(timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.closed)) {
                timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.unsubscribe();
            }
            lastValue = null;
        }));
        startTimer(first != null ? (typeof first === 'number' ? first : +first - scheduler.now()) : each);
    });
}
function timeoutErrorFactory(info) {
    throw new TimeoutError(info);
}

function subscribeOn(scheduler, delay = 0) {
    return operate((source, subscriber) => {
        subscriber.add(scheduler.schedule(() => source.subscribe(subscriber), delay));
    });
}

const { isArray } = Array;
function callOrApply(fn, args) {
    return isArray(args) ? fn(...args) : fn(args);
}
function mapOneOrManyArgs(fn) {
    return map(args => callOrApply(fn, args));
}

function observeOn(scheduler, delay = 0) {
    return operate((source, subscriber) => {
        source.subscribe(new OperatorSubscriber(subscriber, (value) => subscriber.add(scheduler.schedule(() => subscriber.next(value), delay)), (err) => subscriber.add(scheduler.schedule(() => subscriber.error(err), delay)), () => subscriber.add(scheduler.schedule(() => subscriber.complete(), delay))));
    });
}

const { isArray: isArray$1 } = Array;
const { getPrototypeOf, prototype: objectProto, keys: getKeys } = Object;
function argsArgArrayOrObject(args) {
    if (args.length === 1) {
        const first = args[0];
        if (isArray$1(first)) {
            return { args: first, keys: null };
        }
        if (isPOJO(first)) {
            const keys = getKeys(first);
            return {
                args: keys.map((key) => first[key]),
                keys,
            };
        }
    }
    return { args: args, keys: null };
}
function isPOJO(obj) {
    return obj && typeof obj === 'object' && getPrototypeOf(obj) === objectProto;
}

function combineLatest(...args) {
    const scheduler = popScheduler(args);
    const resultSelector = popResultSelector(args);
    const { args: observables, keys } = argsArgArrayOrObject(args);
    const result = new Observable(combineLatestInit(observables, scheduler, keys
        ?
            (values) => {
                const value = {};
                for (let i = 0; i < values.length; i++) {
                    value[keys[i]] = values[i];
                }
                return value;
            }
        :
            identity));
    if (resultSelector) {
        return result.pipe(mapOneOrManyArgs(resultSelector));
    }
    return result;
}
class CombineLatestSubscriber extends Subscriber {
    constructor(destination, _next, shouldComplete) {
        super(destination);
        this._next = _next;
        this.shouldComplete = shouldComplete;
    }
    _complete() {
        if (this.shouldComplete()) {
            super._complete();
        }
        else {
            this.unsubscribe();
        }
    }
}
function combineLatestInit(observables, scheduler, valueTransform = identity) {
    return (subscriber) => {
        const primarySubscribe = () => {
            const { length } = observables;
            const values = new Array(length);
            let active = length;
            const hasValues = observables.map(() => false);
            let waitingForFirstValues = true;
            const emit = () => subscriber.next(valueTransform(values.slice()));
            for (let i = 0; i < length; i++) {
                const subscribe = () => {
                    const source = from(observables[i], scheduler);
                    source.subscribe(new CombineLatestSubscriber(subscriber, (value) => {
                        values[i] = value;
                        if (waitingForFirstValues) {
                            hasValues[i] = true;
                            waitingForFirstValues = !hasValues.every(identity);
                        }
                        if (!waitingForFirstValues) {
                            emit();
                        }
                    }, () => --active === 0));
                };
                maybeSchedule(scheduler, subscribe, subscriber);
            }
        };
        maybeSchedule(scheduler, primarySubscribe, subscriber);
    };
}
function maybeSchedule(scheduler, execute, subscription) {
    if (scheduler) {
        subscription.add(scheduler.schedule(execute));
    }
    else {
        execute();
    }
}

function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalTeardown) {
    let buffer = [];
    let active = 0;
    let index = 0;
    let isComplete = false;
    const checkComplete = () => {
        if (isComplete && !buffer.length && !active) {
            subscriber.complete();
        }
    };
    const outerNext = (value) => (active < concurrent ? doInnerSub(value) : buffer.push(value));
    const doInnerSub = (value) => {
        expand && subscriber.next(value);
        active++;
        innerFrom(project(value, index++)).subscribe(new OperatorSubscriber(subscriber, (innerValue) => {
            onBeforeNext === null || onBeforeNext === void 0 ? void 0 : onBeforeNext(innerValue);
            if (expand) {
                outerNext(innerValue);
            }
            else {
                subscriber.next(innerValue);
            }
        }, undefined, () => {
            active--;
            while (buffer.length && active < concurrent) {
                const bufferedValue = buffer.shift();
                innerSubScheduler ? subscriber.add(innerSubScheduler.schedule(() => doInnerSub(bufferedValue))) : doInnerSub(bufferedValue);
            }
            checkComplete();
        }));
    };
    source.subscribe(new OperatorSubscriber(subscriber, outerNext, undefined, () => {
        isComplete = true;
        checkComplete();
    }));
    return () => {
        buffer = null;
        additionalTeardown === null || additionalTeardown === void 0 ? void 0 : additionalTeardown();
    };
}

function mergeMap(project, resultSelector, concurrent = Infinity) {
    if (isFunction(resultSelector)) {
        return mergeMap((a, i) => map((b, ii) => resultSelector(a, b, i, ii))(innerFrom(project(a, i))), concurrent);
    }
    else if (typeof resultSelector === 'number') {
        concurrent = resultSelector;
    }
    return operate((source, subscriber) => mergeInternals(source, subscriber, project, concurrent));
}
const flatMap = mergeMap;

function mergeAll(concurrent = Infinity) {
    return mergeMap(identity, concurrent);
}

function concatAll() {
    return mergeAll(1);
}

function concat(...args) {
    return concatAll()(internalFromArray(args, popScheduler(args)));
}

function defer(observableFactory) {
    return new Observable((subscriber) => {
        innerFrom(observableFactory()).subscribe(subscriber);
    });
}

function timer(dueTime = 0, intervalOrScheduler, scheduler = async) {
    let intervalDuration = -1;
    if (intervalOrScheduler != null) {
        if (isScheduler(intervalOrScheduler)) {
            scheduler = intervalOrScheduler;
        }
        else {
            intervalDuration = intervalOrScheduler;
        }
    }
    return new Observable((subscriber) => {
        let due = isValidDate(dueTime) ? +dueTime - scheduler.now() : dueTime;
        if (due < 0) {
            due = 0;
        }
        let n = 0;
        return scheduler.schedule(function () {
            if (!subscriber.closed) {
                subscriber.next(n++);
                if (0 <= intervalDuration) {
                    this.schedule(undefined, intervalDuration);
                }
                else {
                    subscriber.complete();
                }
            }
        }, due);
    });
}

function interval(period = 0, scheduler = asyncScheduler) {
    if (period < 0) {
        period = 0;
    }
    return timer(period, period, scheduler);
}

const { isArray: isArray$2 } = Array;
function argsOrArgArray(args) {
    return args.length === 1 && isArray$2(args[0]) ? args[0] : args;
}

function onErrorResumeNext(...sources) {
    const nextSources = argsOrArgArray(sources);
    return operate((source, subscriber) => {
        const remaining = [source, ...nextSources];
        const subscribeNext = () => {
            if (!subscriber.closed) {
                if (remaining.length > 0) {
                    let nextSource;
                    try {
                        nextSource = innerFrom(remaining.shift());
                    }
                    catch (err) {
                        subscribeNext();
                        return;
                    }
                    const innerSub = new OperatorSubscriber(subscriber, undefined, noop, noop);
                    subscriber.add(nextSource.subscribe(innerSub));
                    innerSub.add(subscribeNext);
                }
                else {
                    subscriber.complete();
                }
            }
        };
        subscribeNext();
    });
}

function not(pred, thisArg) {
    return (value, index) => !pred.call(thisArg, value, index);
}

function filter(predicate, thisArg) {
    return operate((source, subscriber) => {
        let index = 0;
        source.subscribe(new OperatorSubscriber(subscriber, (value) => predicate.call(thisArg, value, index++) && subscriber.next(value)));
    });
}

function race(...sources) {
    sources = argsOrArgArray(sources);
    return sources.length === 1 ? innerFrom(sources[0]) : new Observable(raceInit(sources));
}
function raceInit(sources) {
    return (subscriber) => {
        let subscriptions = [];
        for (let i = 0; subscriptions && !subscriber.closed && i < sources.length; i++) {
            subscriptions.push(innerFrom(sources[i]).subscribe(new OperatorSubscriber(subscriber, (value) => {
                if (subscriptions) {
                    for (let s = 0; s < subscriptions.length; s++) {
                        s !== i && subscriptions[s].unsubscribe();
                    }
                    subscriptions = null;
                }
                subscriber.next(value);
            })));
        }
    };
}

function zip(...sources) {
    const resultSelector = popResultSelector(sources);
    sources = argsOrArgArray(sources);
    return sources.length
        ? new Observable((subscriber) => {
            let buffers = sources.map(() => []);
            let completed = sources.map(() => false);
            subscriber.add(() => {
                buffers = completed = null;
            });
            for (let sourceIndex = 0; !subscriber.closed && sourceIndex < sources.length; sourceIndex++) {
                innerFrom(sources[sourceIndex]).subscribe(new OperatorSubscriber(subscriber, (value) => {
                    buffers[sourceIndex].push(value);
                    if (buffers.every((buffer) => buffer.length)) {
                        const result = buffers.map((buffer) => buffer.shift());
                        subscriber.next(resultSelector ? resultSelector(...result) : result);
                        if (buffers.some((buffer, i) => !buffer.length && completed[i])) {
                            subscriber.complete();
                        }
                    }
                }, undefined, () => {
                    completed[sourceIndex] = true;
                    !buffers[sourceIndex].length && subscriber.complete();
                }));
            }
            return () => {
                buffers = completed = null;
            };
        })
        : EMPTY;
}

export { AsyncSubject as A, BehaviorSubject as B, ConnectableObservable as C, isValidDate as D, EmptyError as E, flatMap as F, NotFoundError as N, SequenceError as S, TimeoutError as T, argsArgArrayOrObject as a, mergeMap as b, argsOrArgArray as c, defer as d, mergeAll as e, onErrorResumeNext as f, filter as g, async as h, asyncScheduler as i, ArgumentOutOfRangeError as j, combineLatest as k, concat as l, mapOneOrManyArgs as m, not as n, observeOn as o, interval as p, combineLatestInit as q, race as r, subscribeOn as s, timer as t, concatAll as u, mergeInternals as v, raceInit as w, refCount as x, timeout as y, zip as z };
