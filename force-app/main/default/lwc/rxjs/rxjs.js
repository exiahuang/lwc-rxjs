/**
* @license
* Rxjs 7.0.0 (Custom Build) <https://github.com/ReactiveX/rxjs>
* Apache License 2.0 <https://github.com/ReactiveX/rxjs/blob/master/LICENSE.txt>
* Build By: ExiaHuang 
* Build Date: 2020-11-29
* lwc-rxjs: https://github.com/exiahuang/lwc-rxjs
*/
import { O as Observable, S as Subscription, i as isFunction, a as SafeSubscriber, b as identity, n as noop } from './Observable-e9323dae.js';
export { O as Observable, c as Subscriber, S as Subscription, U as UnsubscriptionError, d as config, b as identity, n as noop, o as observable, p as pipe } from './Observable-e9323dae.js';
import { m as map } from './map-75f95f4c.js';
import './OperatorSubscriber-f3d1dca1.js';
import { E as EmptyError, m as mapOneOrManyArgs, s as subscribeOn, o as observeOn, A as AsyncSubject, a as argsArgArrayOrObject, b as mergeMap, d as defer, c as argsOrArgArray, e as mergeAll, f as onErrorResumeNext$1, g as filter, n as not } from './zip-6d1bfeab.js';
export { j as ArgumentOutOfRangeError, A as AsyncSubject, B as BehaviorSubject, C as ConnectableObservable, E as EmptyError, N as NotFoundError, S as SequenceError, T as TimeoutError, h as async, i as asyncScheduler, k as combineLatest, l as concat, d as defer, p as interval, r as race, t as timer, z as zip } from './zip-6d1bfeab.js';
import { a as animationFrameProvider, p as performanceTimestampProvider, i as immediateProvider } from './VirtualTimeScheduler-bb035abd.js';
export { b as VirtualAction, V as VirtualTimeScheduler } from './VirtualTimeScheduler-bb035abd.js';
export { O as ObjectUnsubscribedError, S as Subject } from './dateTimestampProvider-00364774.js';
export { R as ReplaySubject } from './ReplaySubject-df5e1759.js';
import { A as AsyncAction, a as AsyncScheduler, i as isScheduler, p as popResultSelector, b as internalFromArray, c as popScheduler, d as popNumber, E as EMPTY } from './Notification-bc209f77.js';
export { E as EMPTY, N as Notification, e as NotificationKind, S as Scheduler, f as empty, o as of, t as throwError } from './Notification-bc209f77.js';
import { i as innerFrom, a as isArrayLike, s as scheduleIterable, f as from } from './from-3e8021ae.js';
export { f as from, b as scheduled } from './from-3e8021ae.js';

function animationFrames(timestampProvider) {
    return timestampProvider ? animationFramesFactory(timestampProvider) : DEFAULT_ANIMATION_FRAMES;
}
function animationFramesFactory(timestampProvider) {
    const { schedule } = animationFrameProvider;
    return new Observable(subscriber => {
        const subscription = new Subscription();
        const provider = timestampProvider || performanceTimestampProvider;
        const start = provider.now();
        const run = (timestamp) => {
            const now = provider.now();
            subscriber.next({
                timestamp: timestampProvider ? now : timestamp,
                elapsed: now - start
            });
            if (!subscriber.closed) {
                subscription.add(schedule(run));
            }
        };
        subscription.add(schedule(run));
        return subscription;
    });
}
const DEFAULT_ANIMATION_FRAMES = animationFramesFactory();

class AsapAction extends AsyncAction {
    constructor(scheduler, work) {
        super(scheduler, work);
        this.scheduler = scheduler;
        this.work = work;
    }
    requestAsyncId(scheduler, id, delay = 0) {
        if (delay !== null && delay > 0) {
            return super.requestAsyncId(scheduler, id, delay);
        }
        scheduler.actions.push(this);
        return scheduler.scheduled || (scheduler.scheduled = immediateProvider.setImmediate(scheduler.flush.bind(scheduler, undefined)));
    }
    recycleAsyncId(scheduler, id, delay = 0) {
        if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
            return super.recycleAsyncId(scheduler, id, delay);
        }
        if (scheduler.actions.length === 0) {
            immediateProvider.clearImmediate(id);
            scheduler.scheduled = undefined;
        }
        return undefined;
    }
}

class AsapScheduler extends AsyncScheduler {
    flush(action) {
        this.active = true;
        this.scheduled = undefined;
        const { actions } = this;
        let error;
        let index = -1;
        action = action || actions.shift();
        const count = actions.length;
        do {
            if (error = action.execute(action.state, action.delay)) {
                break;
            }
        } while (++index < count && (action = actions.shift()));
        this.active = false;
        if (error) {
            while (++index < count && (action = actions.shift())) {
                action.unsubscribe();
            }
            throw error;
        }
    }
}

const asapScheduler = new AsapScheduler(AsapAction);
const asap = asapScheduler;

class QueueAction extends AsyncAction {
    constructor(scheduler, work) {
        super(scheduler, work);
        this.scheduler = scheduler;
        this.work = work;
    }
    schedule(state, delay = 0) {
        if (delay > 0) {
            return super.schedule(state, delay);
        }
        this.delay = delay;
        this.state = state;
        this.scheduler.flush(this);
        return this;
    }
    execute(state, delay) {
        return (delay > 0 || this.closed) ?
            super.execute(state, delay) :
            this._execute(state, delay);
    }
    requestAsyncId(scheduler, id, delay = 0) {
        if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
            return super.requestAsyncId(scheduler, id, delay);
        }
        return scheduler.flush(this);
    }
}

class QueueScheduler extends AsyncScheduler {
}

const queueScheduler = new QueueScheduler(QueueAction);
const queue = queueScheduler;

class AnimationFrameAction extends AsyncAction {
    constructor(scheduler, work) {
        super(scheduler, work);
        this.scheduler = scheduler;
        this.work = work;
    }
    requestAsyncId(scheduler, id, delay = 0) {
        if (delay !== null && delay > 0) {
            return super.requestAsyncId(scheduler, id, delay);
        }
        scheduler.actions.push(this);
        return scheduler.scheduled || (scheduler.scheduled = animationFrameProvider.requestAnimationFrame(() => scheduler.flush(undefined)));
    }
    recycleAsyncId(scheduler, id, delay = 0) {
        if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
            return super.recycleAsyncId(scheduler, id, delay);
        }
        if (scheduler.actions.length === 0) {
            animationFrameProvider.cancelAnimationFrame(id);
            scheduler.scheduled = undefined;
        }
        return undefined;
    }
}

class AnimationFrameScheduler extends AsyncScheduler {
    flush(action) {
        this.active = true;
        this.scheduled = undefined;
        const { actions } = this;
        let error;
        let index = -1;
        action = action || actions.shift();
        const count = actions.length;
        do {
            if (error = action.execute(action.state, action.delay)) {
                break;
            }
        } while (++index < count && (action = actions.shift()));
        this.active = false;
        if (error) {
            while (++index < count && (action = actions.shift())) {
                action.unsubscribe();
            }
            throw error;
        }
    }
}

const animationFrameScheduler = new AnimationFrameScheduler(AnimationFrameAction);
const animationFrame = animationFrameScheduler;

function isObservable(obj) {
    return !!obj && (obj instanceof Observable || (isFunction(obj.lift) && isFunction(obj.subscribe)));
}

function lastValueFrom(source) {
    return new Promise((resolve, reject) => {
        let _hasValue = false;
        let _value;
        source.subscribe({
            next: value => {
                _value = value;
                _hasValue = true;
            },
            error: reject,
            complete: () => {
                if (_hasValue) {
                    resolve(_value);
                }
                else {
                    reject(new EmptyError());
                }
            },
        });
    });
}

function firstValueFrom(source) {
    return new Promise((resolve, reject) => {
        const subscriber = new SafeSubscriber({
            next: value => {
                resolve(value);
                subscriber.unsubscribe();
            },
            error: reject,
            complete: () => {
                reject(new EmptyError());
            },
        });
        source.subscribe(subscriber);
    });
}

function bindCallbackInternals(isNodeStyle, callbackFunc, resultSelector, scheduler) {
    if (resultSelector) {
        if (isScheduler(resultSelector)) {
            scheduler = resultSelector;
        }
        else {
            return function (...args) {
                return bindCallbackInternals(isNodeStyle, callbackFunc, scheduler)
                    .apply(this, args)
                    .pipe(mapOneOrManyArgs(resultSelector));
            };
        }
    }
    if (scheduler) {
        return function (...args) {
            return bindCallbackInternals(isNodeStyle, callbackFunc)
                .apply(this, args)
                .pipe(subscribeOn(scheduler), observeOn(scheduler));
        };
    }
    const subject = new AsyncSubject();
    return function (...args) {
        let uninitialized = true;
        return new Observable((subscriber) => {
            const subs = subject.subscribe(subscriber);
            if (uninitialized) {
                uninitialized = false;
                let isAsync = false;
                let isComplete = false;
                callbackFunc.apply(this, [
                    ...args,
                    (...results) => {
                        if (isNodeStyle) {
                            const err = results.shift();
                            if (err != null) {
                                subject.error(err);
                                return;
                            }
                        }
                        subject.next(1 < results.length ? results : results[0]);
                        isComplete = true;
                        if (isAsync) {
                            subject.complete();
                        }
                    },
                ]);
                if (isComplete) {
                    subject.complete();
                }
                isAsync = true;
            }
            return subs;
        });
    };
}

function bindCallback(callbackFunc, resultSelector, scheduler) {
    return bindCallbackInternals(false, callbackFunc, resultSelector, scheduler);
}

function bindNodeCallback(callbackFunc, resultSelector, scheduler) {
    return bindCallbackInternals(true, callbackFunc, resultSelector, scheduler);
}

function forkJoin(...args) {
    const resultSelector = popResultSelector(args);
    const { args: sources, keys } = argsArgArrayOrObject(args);
    if (resultSelector) {
        return forkJoinInternal(sources, keys).pipe(map((values) => resultSelector(...values)));
    }
    return forkJoinInternal(sources, keys);
}
function forkJoinInternal(sources, keys) {
    return new Observable((subscriber) => {
        const len = sources.length;
        if (len === 0) {
            subscriber.complete();
            return;
        }
        const values = new Array(len);
        let completed = 0;
        let emitted = 0;
        for (let sourceIndex = 0; sourceIndex < len; sourceIndex++) {
            const source = innerFrom(sources[sourceIndex]);
            let hasValue = false;
            subscriber.add(source.subscribe({
                next: (value) => {
                    if (!hasValue) {
                        hasValue = true;
                        emitted++;
                    }
                    values[sourceIndex] = value;
                },
                error: (err) => subscriber.error(err),
                complete: () => {
                    completed++;
                    if (completed === len || !hasValue) {
                        if (emitted === len) {
                            subscriber.next(keys ? keys.reduce((result, key, i) => ((result[key] = values[i]), result), {}) : values);
                        }
                        subscriber.complete();
                    }
                },
            }));
        }
    });
}

const nodeEventEmitterMethods = ['addListener', 'removeListener'];
const eventTargetMethods = ['addEventListener', 'removeEventListener'];
const jqueryMethods = ['on', 'off'];
function fromEvent(target, eventName, options, resultSelector) {
    if (isFunction(options)) {
        resultSelector = options;
        options = undefined;
    }
    if (resultSelector) {
        return fromEvent(target, eventName, options).pipe(mapOneOrManyArgs(resultSelector));
    }
    const [add, remove] = isEventTarget(target)
        ? eventTargetMethods.map((methodName) => (handler) => target[methodName](eventName, handler, options))
        :
            isNodeStyleEventEmitter(target)
                ? nodeEventEmitterMethods.map(toCommonHandlerRegistry(target, eventName))
                : isJQueryStyleEventEmitter(target)
                    ? jqueryMethods.map(toCommonHandlerRegistry(target, eventName))
                    : [];
    if (!add) {
        if (isArrayLike(target)) {
            return mergeMap((subTarget) => fromEvent(subTarget, eventName, options))(internalFromArray(target));
        }
    }
    return new Observable((subscriber) => {
        if (!add) {
            throw new TypeError('Invalid event target');
        }
        const handler = (...args) => subscriber.next(1 < args.length ? args : args[0]);
        add(handler);
        return () => remove(handler);
    });
}
function toCommonHandlerRegistry(target, eventName) {
    return (methodName) => (handler) => target[methodName](eventName, handler);
}
function isNodeStyleEventEmitter(target) {
    return isFunction(target.addListener) && isFunction(target.removeListener);
}
function isJQueryStyleEventEmitter(target) {
    return isFunction(target.on) && isFunction(target.off);
}
function isEventTarget(target) {
    return isFunction(target.addEventListener) && isFunction(target.removeEventListener);
}

function fromEventPattern(addHandler, removeHandler, resultSelector) {
    if (resultSelector) {
        return fromEventPattern(addHandler, removeHandler).pipe(mapOneOrManyArgs(resultSelector));
    }
    return new Observable((subscriber) => {
        const handler = (...e) => subscriber.next(e.length === 1 ? e[0] : e);
        const retValue = addHandler(handler);
        return isFunction(removeHandler) ? () => removeHandler(handler, retValue) : undefined;
    });
}

function generate(initialStateOrOptions, condition, iterate, resultSelectorOrScheduler, scheduler) {
    let resultSelector;
    let initialState;
    if (arguments.length === 1) {
        ({
            initialState,
            condition,
            iterate,
            resultSelector = identity,
            scheduler,
        } = initialStateOrOptions);
    }
    else {
        initialState = initialStateOrOptions;
        if (!resultSelectorOrScheduler || isScheduler(resultSelectorOrScheduler)) {
            resultSelector = identity;
            scheduler = resultSelectorOrScheduler;
        }
        else {
            resultSelector = resultSelectorOrScheduler;
        }
    }
    function* gen() {
        for (let state = initialState; !condition || condition(state); state = iterate(state)) {
            yield resultSelector(state);
        }
    }
    return defer((scheduler
        ?
            () => scheduleIterable(gen(), scheduler)
        :
            gen));
}

function iif(condition, trueResult, falseResult) {
    return defer(() => (condition() ? trueResult : falseResult));
}

function merge(...args) {
    const scheduler = popScheduler(args);
    const concurrent = popNumber(args, Infinity);
    const sources = argsOrArgArray(args);
    return !sources.length
        ?
            EMPTY
        : sources.length === 1
            ?
                innerFrom(sources[0])
            :
                mergeAll(concurrent)(internalFromArray(sources, scheduler));
}

const NEVER = new Observable(noop);
function never() {
    return NEVER;
}

function onErrorResumeNext(...sources) {
    return onErrorResumeNext$1(argsOrArgArray(sources))(EMPTY);
}

function pairs(obj, scheduler) {
    return from(Object.entries(obj), scheduler);
}

function partition(source, predicate, thisArg) {
    return [
        filter(predicate, thisArg)(innerFrom(source)),
        filter(not(predicate, thisArg))(innerFrom(source))
    ];
}

function range(start, count, scheduler) {
    if (count == null) {
        count = start;
        start = 0;
    }
    if (count <= 0) {
        return EMPTY;
    }
    const end = count + start;
    return new Observable(scheduler
        ?
            (subscriber) => {
                let n = start;
                return scheduler.schedule(function () {
                    if (n < end) {
                        subscriber.next(n++);
                        this.schedule();
                    }
                    else {
                        subscriber.complete();
                    }
                });
            }
        :
            (subscriber) => {
                let n = start;
                while (n < end && !subscriber.closed) {
                    subscriber.next(n++);
                }
                subscriber.complete();
            });
}

function using(resourceFactory, observableFactory) {
    return new Observable((subscriber) => {
        const resource = resourceFactory();
        const result = observableFactory(resource);
        const source = result ? innerFrom(result) : EMPTY;
        source.subscribe(subscriber);
        return () => {
            if (resource) {
                resource.unsubscribe();
            }
        };
    });
}

export { NEVER, animationFrame, animationFrameScheduler, animationFrames, asap, asapScheduler, bindCallback, bindNodeCallback, firstValueFrom, forkJoin, fromEvent, fromEventPattern, generate, iif, isObservable, lastValueFrom, merge, never, onErrorResumeNext, pairs, partition, queue, queueScheduler, range, using };
import * as operator from './operator';
export { operator };

export { AjaxError, AjaxResponse, AjaxTimeoutError, ajax } from './ajax';
export { fromFetch } from './fetch';
export { TestScheduler } from './testing';
export { WebSocketSubject, webSocket } from './webSocket';

