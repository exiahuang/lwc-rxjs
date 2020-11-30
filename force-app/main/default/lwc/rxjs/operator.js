/**
* @license
* Rxjs 7.0.0 (Custom Build) <https://github.com/ReactiveX/rxjs>
* Apache License 2.0 <https://github.com/ReactiveX/rxjs/blob/master/LICENSE.txt>
* Build By: ExiaHuang 
* Build Date: 2020-11-29
* lwc-rxjs: https://github.com/exiahuang/lwc-rxjs
*/
import { f as arrRemove, S as Subscription, n as noop, p as pipe, b as identity, i as isFunction, O as Observable } from './Observable-e9323dae.js';
import { o as operate, m as map, h as hasLift } from './map-75f95f4c.js';
export { m as map } from './map-75f95f4c.js';
import { O as OperatorSubscriber } from './OperatorSubscriber-f3d1dca1.js';
import { h as async, t as timer, i as asyncScheduler, m as mapOneOrManyArgs, b as mergeMap, k as combineLatest$1, q as combineLatestInit, c as argsOrArgArray, u as concatAll, l as concat$1, E as EmptyError, j as ArgumentOutOfRangeError, g as filter, v as mergeInternals, e as mergeAll, C as ConnectableObservable, n as not, B as BehaviorSubject, A as AsyncSubject, w as raceInit, p as interval, x as refCount, S as SequenceError, N as NotFoundError, d as defer, y as timeout, D as isValidDate, z as zip$1 } from './zip-6d1bfeab.js';
export { u as concatAll, g as filter, F as flatMap, e as mergeAll, b as mergeMap, o as observeOn, f as onErrorResumeNext, x as refCount, s as subscribeOn, y as timeout } from './zip-6d1bfeab.js';
import { S as Subject, d as dateTimestampProvider } from './dateTimestampProvider-00364774.js';
import { R as ReplaySubject } from './ReplaySubject-df5e1759.js';
import { c as popScheduler, p as popResultSelector, b as internalFromArray, E as EMPTY, g as observeNotification, o as of, N as Notification, d as popNumber } from './Notification-bc209f77.js';
import { i as innerFrom } from './from-3e8021ae.js';

function audit(durationSelector) {
    return operate((source, subscriber) => {
        let hasValue = false;
        let lastValue = null;
        let durationSubscriber = null;
        let isComplete = false;
        const endDuration = () => {
            durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
            durationSubscriber = null;
            if (hasValue) {
                hasValue = false;
                const value = lastValue;
                lastValue = null;
                subscriber.next(value);
            }
            isComplete && subscriber.complete();
        };
        const cleanupDuration = () => {
            durationSubscriber = null;
            isComplete && subscriber.complete();
        };
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            hasValue = true;
            lastValue = value;
            if (!durationSubscriber) {
                innerFrom(durationSelector(value)).subscribe((durationSubscriber = new OperatorSubscriber(subscriber, endDuration, undefined, cleanupDuration)));
            }
        }, undefined, () => {
            isComplete = true;
            (!hasValue || !durationSubscriber || durationSubscriber.closed) && subscriber.complete();
        }));
    });
}

function auditTime(duration, scheduler = async) {
    return audit(() => timer(duration, scheduler));
}

function buffer(closingNotifier) {
    return operate((source, subscriber) => {
        let currentBuffer = [];
        source.subscribe(new OperatorSubscriber(subscriber, (value) => currentBuffer.push(value)));
        closingNotifier.subscribe(new OperatorSubscriber(subscriber, () => {
            const b = currentBuffer;
            currentBuffer = [];
            subscriber.next(b);
        }));
        return () => {
            currentBuffer = null;
        };
    });
}

function bufferCount(bufferSize, startBufferEvery = null) {
    startBufferEvery = startBufferEvery !== null && startBufferEvery !== void 0 ? startBufferEvery : bufferSize;
    return operate((source, subscriber) => {
        let buffers = [];
        let count = 0;
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            let toEmit = null;
            if (count++ % startBufferEvery === 0) {
                buffers.push([]);
            }
            for (const buffer of buffers) {
                buffer.push(value);
                if (bufferSize <= buffer.length) {
                    toEmit = toEmit !== null && toEmit !== void 0 ? toEmit : [];
                    toEmit.push(buffer);
                }
            }
            if (toEmit) {
                for (const buffer of toEmit) {
                    arrRemove(buffers, buffer);
                    subscriber.next(buffer);
                }
            }
        }, undefined, () => {
            for (const buffer of buffers) {
                subscriber.next(buffer);
            }
            subscriber.complete();
        }, () => {
            buffers = null;
        }));
    });
}

function bufferTime(bufferTimeSpan, ...otherArgs) {
    var _a, _b;
    const scheduler = (_a = popScheduler(otherArgs)) !== null && _a !== void 0 ? _a : asyncScheduler;
    const bufferCreationInterval = (_b = otherArgs[0]) !== null && _b !== void 0 ? _b : null;
    const maxBufferSize = otherArgs[1] || Infinity;
    return operate((source, subscriber) => {
        let bufferRecords = [];
        let restartOnEmit = false;
        const emit = (record) => {
            const { buffer, subs } = record;
            subs.unsubscribe();
            arrRemove(bufferRecords, record);
            subscriber.next(buffer);
            restartOnEmit && startBuffer();
        };
        const startBuffer = () => {
            if (bufferRecords) {
                const subs = new Subscription();
                subscriber.add(subs);
                const buffer = [];
                const record = {
                    buffer,
                    subs,
                };
                bufferRecords.push(record);
                subs.add(scheduler.schedule(() => emit(record), bufferTimeSpan));
            }
        };
        bufferCreationInterval !== null && bufferCreationInterval >= 0
            ?
                subscriber.add(scheduler.schedule(function () {
                    startBuffer();
                    !this.closed && subscriber.add(this.schedule(null, bufferCreationInterval));
                }, bufferCreationInterval))
            : (restartOnEmit = true);
        startBuffer();
        const bufferTimeSubscriber = new OperatorSubscriber(subscriber, (value) => {
            const recordsCopy = bufferRecords.slice();
            for (const record of recordsCopy) {
                const { buffer } = record;
                buffer.push(value);
                maxBufferSize <= buffer.length && emit(record);
            }
        }, undefined, () => {
            while (bufferRecords === null || bufferRecords === void 0 ? void 0 : bufferRecords.length) {
                subscriber.next(bufferRecords.shift().buffer);
            }
            bufferTimeSubscriber === null || bufferTimeSubscriber === void 0 ? void 0 : bufferTimeSubscriber.unsubscribe();
            subscriber.complete();
            subscriber.unsubscribe();
        }, () => (bufferRecords = null));
        source.subscribe(bufferTimeSubscriber);
    });
}

function bufferToggle(openings, closingSelector) {
    return operate((source, subscriber) => {
        const buffers = [];
        innerFrom(openings).subscribe(new OperatorSubscriber(subscriber, (openValue) => {
            const buffer = [];
            buffers.push(buffer);
            const closingSubscription = new Subscription();
            const emitBuffer = () => {
                arrRemove(buffers, buffer);
                subscriber.next(buffer);
                closingSubscription.unsubscribe();
            };
            closingSubscription.add(innerFrom(closingSelector(openValue)).subscribe(new OperatorSubscriber(subscriber, emitBuffer, undefined, noop)));
        }, undefined, noop));
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            for (const buffer of buffers) {
                buffer.push(value);
            }
        }, undefined, () => {
            while (buffers.length > 0) {
                subscriber.next(buffers.shift());
            }
            subscriber.complete();
        }));
    });
}

function bufferWhen(closingSelector) {
    return operate((source, subscriber) => {
        let buffer = null;
        let closingSubscriber = null;
        const openBuffer = () => {
            closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
            const b = buffer;
            buffer = [];
            b && subscriber.next(b);
            innerFrom(closingSelector()).subscribe((closingSubscriber = new OperatorSubscriber(subscriber, openBuffer, undefined, noop)));
        };
        openBuffer();
        source.subscribe(new OperatorSubscriber(subscriber, (value) => buffer === null || buffer === void 0 ? void 0 : buffer.push(value), undefined, () => {
            buffer && subscriber.next(buffer);
            subscriber.complete();
        }, () => (buffer = closingSubscriber = null)));
    });
}

function catchError(selector) {
    return operate((source, subscriber) => {
        let innerSub = null;
        let syncUnsub = false;
        let handledResult;
        innerSub = source.subscribe(new OperatorSubscriber(subscriber, undefined, (err) => {
            handledResult = innerFrom(selector(err, catchError(selector)(source)));
            if (innerSub) {
                innerSub.unsubscribe();
                innerSub = null;
                handledResult.subscribe(subscriber);
            }
            else {
                syncUnsub = true;
            }
        }));
        if (syncUnsub) {
            innerSub.unsubscribe();
            innerSub = null;
            handledResult.subscribe(subscriber);
        }
    });
}

function scanInternals(accumulator, seed, hasSeed, emitOnNext, emitBeforeComplete) {
    return (source, subscriber) => {
        let hasState = hasSeed;
        let state = seed;
        let index = 0;
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            const i = index++;
            state = hasState
                ?
                    accumulator(state, value, i)
                :
                    ((hasState = true), value);
            emitOnNext && subscriber.next(state);
        }, undefined, emitBeforeComplete &&
            (() => {
                hasState && subscriber.next(state);
                subscriber.complete();
            })));
    };
}

function reduce(accumulator, seed) {
    return operate(scanInternals(accumulator, seed, arguments.length >= 2, false, true));
}

const arrReducer = (arr, value) => (arr.push(value), arr);
function toArray() {
    return operate((source, subscriber) => {
        reduce(arrReducer, [])(source).subscribe(subscriber);
    });
}

function joinAllInternals(joinFn, project) {
    return pipe(toArray(), mergeMap((sources) => joinFn(sources)), project ? mapOneOrManyArgs(project) : identity);
}

function combineAll(project) {
    return joinAllInternals(combineLatest$1, project);
}

function combineLatest(...args) {
    const resultSelector = popResultSelector(args);
    return resultSelector
        ? pipe(combineLatest(...args), mapOneOrManyArgs(resultSelector))
        : operate((source, subscriber) => {
            combineLatestInit([source, ...argsOrArgArray(args)])(subscriber);
        });
}
function combineLatestWith(...otherSources) {
    return combineLatest(...otherSources);
}

function concatMap(project, resultSelector) {
    return isFunction(resultSelector) ? mergeMap(project, resultSelector, 1) : mergeMap(project, 1);
}

function concatMapTo(innerObservable, resultSelector) {
    return isFunction(resultSelector) ? concatMap(() => innerObservable, resultSelector) : concatMap(() => innerObservable);
}

function concatWith(...otherSources) {
    return concat(...otherSources);
}
function concat(...args) {
    const scheduler = popScheduler(args);
    return operate((source, subscriber) => {
        concatAll()(internalFromArray([source, ...args], scheduler)).subscribe(subscriber);
    });
}

function count(predicate) {
    return reduce((total, value, i) => (!predicate || predicate(value, i) ? total + 1 : total), 0);
}

function debounce(durationSelector) {
    return operate((source, subscriber) => {
        let hasValue = false;
        let lastValue = null;
        let durationSubscriber = null;
        const emit = () => {
            durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
            durationSubscriber = null;
            if (hasValue) {
                hasValue = false;
                const value = lastValue;
                lastValue = null;
                subscriber.next(value);
            }
        };
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
            hasValue = true;
            lastValue = value;
            durationSubscriber = new OperatorSubscriber(subscriber, emit, undefined, noop);
            innerFrom(durationSelector(value)).subscribe(durationSubscriber);
        }, undefined, () => {
            emit();
            subscriber.complete();
        }, () => {
            lastValue = durationSubscriber = null;
        }));
    });
}

function debounceTime(dueTime, scheduler = asyncScheduler) {
    const duration = timer(dueTime, scheduler);
    return debounce(() => duration);
}

function defaultIfEmpty(defaultValue = null) {
    return operate((source, subscriber) => {
        let hasValue = false;
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            hasValue = true;
            subscriber.next(value);
        }, undefined, () => {
            if (!hasValue) {
                subscriber.next(defaultValue);
            }
            subscriber.complete();
        }));
    });
}

function take(count) {
    return count <= 0
        ?
            () => EMPTY
        : operate((source, subscriber) => {
            let seen = 0;
            source.subscribe(new OperatorSubscriber(subscriber, (value) => {
                if (++seen <= count) {
                    subscriber.next(value);
                    if (count <= seen) {
                        subscriber.complete();
                    }
                }
            }));
        });
}

function ignoreElements() {
    return operate((source, subscriber) => {
        source.subscribe(new OperatorSubscriber(subscriber, noop));
    });
}

function mapTo(value) {
    return operate((source, subscriber) => {
        source.subscribe(new OperatorSubscriber(subscriber, () => subscriber.next(value)));
    });
}

function delayWhen(delayDurationSelector, subscriptionDelay) {
    if (subscriptionDelay) {
        return (source) => concat$1(subscriptionDelay.pipe(take(1), ignoreElements()), source.pipe(delayWhen(delayDurationSelector)));
    }
    return mergeMap((value, index) => delayDurationSelector(value, index).pipe(take(1), mapTo(value)));
}

function delay(due, scheduler = asyncScheduler) {
    const duration = timer(due, scheduler);
    return delayWhen(() => duration);
}

function dematerialize() {
    return operate((source, subscriber) => {
        source.subscribe(new OperatorSubscriber(subscriber, (notification) => observeNotification(notification, subscriber)));
    });
}

function distinct(keySelector, flushes) {
    return operate((source, subscriber) => {
        const distinctKeys = new Set();
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            const key = keySelector ? keySelector(value) : value;
            if (!distinctKeys.has(key)) {
                distinctKeys.add(key);
                subscriber.next(value);
            }
        }));
        flushes === null || flushes === void 0 ? void 0 : flushes.subscribe(new OperatorSubscriber(subscriber, () => distinctKeys.clear(), undefined, noop));
    });
}

function distinctUntilChanged(compare, keySelector) {
    compare = compare !== null && compare !== void 0 ? compare : defaultCompare;
    return operate((source, subscriber) => {
        let prev;
        let first = true;
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            ((first && ((prev = value), 1)) || !compare(prev, (prev = keySelector ? keySelector(value) : value))) &&
                subscriber.next(value);
            first = false;
        }));
    });
}
function defaultCompare(a, b) {
    return a === b;
}

function distinctUntilKeyChanged(key, compare) {
    return distinctUntilChanged((x, y) => compare ? compare(x[key], y[key]) : x[key] === y[key]);
}

function throwIfEmpty(errorFactory = defaultErrorFactory) {
    return operate((source, subscriber) => {
        let hasValue = false;
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            hasValue = true;
            subscriber.next(value);
        }, undefined, () => (hasValue ? subscriber.complete() : subscriber.error(errorFactory()))));
    });
}
function defaultErrorFactory() {
    return new EmptyError();
}

function elementAt(index, defaultValue) {
    if (index < 0) {
        throw new ArgumentOutOfRangeError();
    }
    const hasDefaultValue = arguments.length >= 2;
    return (source) => source.pipe(filter((v, i) => i === index), take(1), hasDefaultValue
        ? defaultIfEmpty(defaultValue)
        : throwIfEmpty(() => new ArgumentOutOfRangeError()));
}

function endWith(...values) {
    return (source) => concat$1(source, of(...values));
}

function every(predicate, thisArg) {
    return operate((source, subscriber) => {
        let index = 0;
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            if (!predicate.call(thisArg, value, index++, source)) {
                subscriber.next(false);
                subscriber.complete();
            }
        }, undefined, () => {
            subscriber.next(true);
            subscriber.complete();
        }));
    });
}

function exhaust() {
    return operate((source, subscriber) => {
        let isComplete = false;
        let innerSub = null;
        source.subscribe(new OperatorSubscriber(subscriber, (inner) => {
            if (!innerSub) {
                innerSub = innerFrom(inner).subscribe(new OperatorSubscriber(subscriber, undefined, undefined, () => {
                    innerSub = null;
                    isComplete && subscriber.complete();
                }));
            }
        }, undefined, () => {
            isComplete = true;
            !innerSub && subscriber.complete();
        }));
    });
}

function exhaustMap(project, resultSelector) {
    if (resultSelector) {
        return (source) => source.pipe(exhaustMap((a, i) => innerFrom(project(a, i)).pipe(map((b, ii) => resultSelector(a, b, i, ii)))));
    }
    return operate((source, subscriber) => {
        let index = 0;
        let innerSub = null;
        let isComplete = false;
        source.subscribe(new OperatorSubscriber(subscriber, (outerValue) => {
            if (!innerSub) {
                innerSub = new OperatorSubscriber(subscriber, undefined, undefined, () => {
                    innerSub = null;
                    isComplete && subscriber.complete();
                });
                innerFrom(project(outerValue, index++)).subscribe(innerSub);
            }
        }, undefined, () => {
            isComplete = true;
            !innerSub && subscriber.complete();
        }));
    });
}

function expand(project, concurrent = Infinity, scheduler) {
    concurrent = (concurrent || 0) < 1 ? Infinity : concurrent;
    return operate((source, subscriber) => mergeInternals(source, subscriber, project, concurrent, undefined, true, scheduler));
}

function finalize(callback) {
    return operate((source, subscriber) => {
        source.subscribe(subscriber);
        subscriber.add(callback);
    });
}

function find(predicate, thisArg) {
    return operate(createFind(predicate, thisArg, 'value'));
}
function createFind(predicate, thisArg, emit) {
    const findIndex = emit === 'index';
    return (source, subscriber) => {
        let index = 0;
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            const i = index++;
            if (predicate.call(thisArg, value, i, source)) {
                subscriber.next(findIndex ? i : value);
                subscriber.complete();
            }
        }, undefined, () => {
            subscriber.next(findIndex ? -1 : undefined);
            subscriber.complete();
        }));
    };
}

function findIndex(predicate, thisArg) {
    return operate(createFind(predicate, thisArg, 'index'));
}

function first(predicate, defaultValue) {
    const hasDefaultValue = arguments.length >= 2;
    return (source) => source.pipe(predicate ? filter((v, i) => predicate(v, i, source)) : identity, take(1), hasDefaultValue ? defaultIfEmpty(defaultValue) : throwIfEmpty(() => new EmptyError()));
}

function groupBy(keySelector, elementSelector, durationSelector, subjectSelector) {
    return operate((source, subscriber) => {
        const groups = new Map();
        const notify = (cb) => {
            groups.forEach(cb);
            cb(subscriber);
        };
        const handleError = (err) => notify((consumer) => consumer.error(err));
        const groupBySourceSubscriber = new GroupBySubscriber(subscriber, (value) => {
            try {
                const key = keySelector(value);
                let group = groups.get(key);
                if (!group) {
                    groups.set(key, (group = subjectSelector ? subjectSelector() : new Subject()));
                    const grouped = createGroupedObservable(key, group);
                    subscriber.next(grouped);
                    if (durationSelector) {
                        const durationSubscriber = new OperatorSubscriber(group, () => {
                            group.complete();
                            durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
                        }, undefined, undefined, () => groups.delete(key));
                        groupBySourceSubscriber.add(durationSelector(grouped).subscribe(durationSubscriber));
                    }
                }
                group.next(elementSelector ? elementSelector(value) : value);
            }
            catch (err) {
                handleError(err);
            }
        }, handleError, () => notify((consumer) => consumer.complete()), () => groups.clear());
        source.subscribe(groupBySourceSubscriber);
        function createGroupedObservable(key, groupSubject) {
            const result = new Observable((groupSubscriber) => {
                groupBySourceSubscriber.activeGroups++;
                const innerSub = groupSubject.subscribe(groupSubscriber);
                return () => {
                    innerSub.unsubscribe();
                    --groupBySourceSubscriber.activeGroups === 0 &&
                        groupBySourceSubscriber.teardownAttempted &&
                        groupBySourceSubscriber.unsubscribe();
                };
            });
            result.key = key;
            return result;
        }
    });
}
class GroupBySubscriber extends OperatorSubscriber {
    constructor() {
        super(...arguments);
        this.activeGroups = 0;
        this.teardownAttempted = false;
    }
    unsubscribe() {
        this.teardownAttempted = true;
        this.activeGroups === 0 && super.unsubscribe();
    }
}

function isEmpty() {
    return operate((source, subscriber) => {
        source.subscribe(new OperatorSubscriber(subscriber, () => {
            subscriber.next(false);
            subscriber.complete();
        }, undefined, () => {
            subscriber.next(true);
            subscriber.complete();
        }));
    });
}

function takeLast(count) {
    return count <= 0
        ? () => EMPTY
        : operate((source, subscriber) => {
            let buffer = [];
            source.subscribe(new OperatorSubscriber(subscriber, (value) => {
                buffer.push(value);
                count < buffer.length && buffer.shift();
            }, undefined, () => {
                for (const value of buffer) {
                    subscriber.next(value);
                }
                subscriber.complete();
            }, () => {
                buffer = null;
            }));
        });
}

function last(predicate, defaultValue) {
    const hasDefaultValue = arguments.length >= 2;
    return (source) => source.pipe(predicate ? filter((v, i) => predicate(v, i, source)) : identity, takeLast(1), hasDefaultValue ? defaultIfEmpty(defaultValue) : throwIfEmpty(() => new EmptyError()));
}

function materialize() {
    return operate((source, subscriber) => {
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            subscriber.next(Notification.createNext(value));
        }, (err) => {
            subscriber.next(Notification.createError(err));
            subscriber.complete();
        }, () => {
            subscriber.next(Notification.createComplete());
            subscriber.complete();
        }));
    });
}

function max(comparer) {
    return reduce(isFunction(comparer) ? (x, y) => (comparer(x, y) > 0 ? x : y) : (x, y) => (x > y ? x : y));
}

function merge(...args) {
    const scheduler = popScheduler(args);
    const concurrent = popNumber(args, Infinity);
    args = argsOrArgArray(args);
    return operate((source, subscriber) => {
        mergeAll(concurrent)(internalFromArray([source, ...args], scheduler)).subscribe(subscriber);
    });
}
function mergeWith(...otherSources) {
    return merge(...otherSources);
}

function mergeMapTo(innerObservable, resultSelector, concurrent = Infinity) {
    if (isFunction(resultSelector)) {
        return mergeMap(() => innerObservable, resultSelector, concurrent);
    }
    if (typeof resultSelector === 'number') {
        concurrent = resultSelector;
    }
    return mergeMap(() => innerObservable, concurrent);
}

function mergeScan(accumulator, seed, concurrent = Infinity) {
    return operate((source, subscriber) => {
        let state = seed;
        return mergeInternals(source, subscriber, (value, index) => accumulator(state, value, index), concurrent, (value) => {
            state = value;
        }, false, undefined, () => (state = null));
    });
}

function min(comparer) {
    return reduce(isFunction(comparer) ? (x, y) => (comparer(x, y) < 0 ? x : y) : (x, y) => (x < y ? x : y));
}

function multicast(subjectOrSubjectFactory, selector) {
    const subjectFactory = isFunction(subjectOrSubjectFactory) ? subjectOrSubjectFactory : () => subjectOrSubjectFactory;
    if (isFunction(selector)) {
        return operate((source, subscriber) => {
            const subject = subjectFactory();
            selector(subject).subscribe(subscriber).add(source.subscribe(subject));
        });
    }
    return (source) => {
        const connectable = new ConnectableObservable(source, subjectFactory);
        if (hasLift(source)) {
            connectable.lift = source.lift;
        }
        connectable.source = source;
        connectable.subjectFactory = subjectFactory;
        return connectable;
    };
}

function pairwise() {
    return operate((source, subscriber) => {
        let prev;
        let hasPrev = false;
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            const p = prev;
            prev = value;
            hasPrev && subscriber.next([p, value]);
            hasPrev = true;
        }));
    });
}

function partition(predicate, thisArg) {
    return (source) => [
        filter(predicate, thisArg)(source),
        filter(not(predicate, thisArg))(source)
    ];
}

function pluck(...properties) {
    const length = properties.length;
    if (length === 0) {
        throw new Error('list of properties cannot be empty.');
    }
    return map((x) => {
        let currentProp = x;
        for (let i = 0; i < length; i++) {
            const p = currentProp === null || currentProp === void 0 ? void 0 : currentProp[properties[i]];
            if (typeof p !== 'undefined') {
                currentProp = p;
            }
            else {
                return undefined;
            }
        }
        return currentProp;
    });
}

function publish(selector) {
    return selector ?
        multicast(() => new Subject(), selector) :
        multicast(new Subject());
}

function publishBehavior(value) {
    return (source) => multicast(new BehaviorSubject(value))(source);
}

function publishLast() {
    return (source) => multicast(new AsyncSubject())(source);
}

function publishReplay(bufferSize, windowTime, selectorOrScheduler, scheduler) {
    if (selectorOrScheduler && !isFunction(selectorOrScheduler)) {
        scheduler = selectorOrScheduler;
    }
    const selector = isFunction(selectorOrScheduler) ? selectorOrScheduler : undefined;
    const subject = new ReplaySubject(bufferSize, windowTime, scheduler);
    return (source) => multicast(() => subject, selector)(source);
}

function race(...args) {
    return raceWith(...argsOrArgArray(args));
}
function raceWith(...otherSources) {
    return !otherSources.length ? identity : operate((source, subscriber) => {
        raceInit([source, ...otherSources])(subscriber);
    });
}

function repeat(count = Infinity) {
    return count <= 0
        ? () => EMPTY
        : operate((source, subscriber) => {
            let soFar = 0;
            let innerSub;
            const subscribeForRepeat = () => {
                let syncUnsub = false;
                innerSub = source.subscribe(new OperatorSubscriber(subscriber, undefined, undefined, () => {
                    if (++soFar < count) {
                        if (innerSub) {
                            innerSub.unsubscribe();
                            innerSub = null;
                            subscribeForRepeat();
                        }
                        else {
                            syncUnsub = true;
                        }
                    }
                    else {
                        subscriber.complete();
                    }
                }));
                if (syncUnsub) {
                    innerSub.unsubscribe();
                    innerSub = null;
                    subscribeForRepeat();
                }
            };
            subscribeForRepeat();
        });
}

function repeatWhen(notifier) {
    return operate((source, subscriber) => {
        let innerSub;
        let syncResub = false;
        let completions$;
        let isNotifierComplete = false;
        let isMainComplete = false;
        const checkComplete = () => isMainComplete && isNotifierComplete && (subscriber.complete(), true);
        const getCompletionSubject = () => {
            if (!completions$) {
                completions$ = new Subject();
                notifier(completions$).subscribe(new OperatorSubscriber(subscriber, () => {
                    if (innerSub) {
                        subscribeForRepeatWhen();
                    }
                    else {
                        syncResub = true;
                    }
                }, undefined, () => {
                    isNotifierComplete = true;
                    checkComplete();
                }));
            }
            return completions$;
        };
        const subscribeForRepeatWhen = () => {
            isMainComplete = false;
            innerSub = source.subscribe(new OperatorSubscriber(subscriber, undefined, undefined, () => {
                isMainComplete = true;
                !checkComplete() && getCompletionSubject().next();
            }));
            if (syncResub) {
                innerSub.unsubscribe();
                innerSub = null;
                syncResub = false;
                subscribeForRepeatWhen();
            }
        };
        subscribeForRepeatWhen();
    });
}

function retry(configOrCount = Infinity) {
    let config;
    if (configOrCount && typeof configOrCount === 'object') {
        config = configOrCount;
    }
    else {
        config = {
            count: configOrCount,
        };
    }
    const { count, resetOnSuccess = false } = config;
    return count <= 0
        ? () => EMPTY
        : operate((source, subscriber) => {
            let soFar = 0;
            let innerSub;
            const subscribeForRetry = () => {
                let syncUnsub = false;
                innerSub = source.subscribe(new OperatorSubscriber(subscriber, (value) => {
                    if (resetOnSuccess) {
                        soFar = 0;
                    }
                    subscriber.next(value);
                }, (err) => {
                    if (soFar++ < count) {
                        if (innerSub) {
                            innerSub.unsubscribe();
                            innerSub = null;
                            subscribeForRetry();
                        }
                        else {
                            syncUnsub = true;
                        }
                    }
                    else {
                        subscriber.error(err);
                    }
                }));
                if (syncUnsub) {
                    innerSub.unsubscribe();
                    innerSub = null;
                    subscribeForRetry();
                }
            };
            subscribeForRetry();
        });
}

function retryWhen(notifier) {
    return operate((source, subscriber) => {
        let innerSub;
        let syncResub = false;
        let errors$;
        const subscribeForRetryWhen = () => {
            innerSub = source.subscribe(new OperatorSubscriber(subscriber, undefined, (err) => {
                if (!errors$) {
                    errors$ = new Subject();
                    notifier(errors$).subscribe(new OperatorSubscriber(subscriber, () => innerSub ? subscribeForRetryWhen() : (syncResub = true)));
                }
                if (errors$) {
                    errors$.next(err);
                }
            }));
            if (syncResub) {
                innerSub.unsubscribe();
                innerSub = null;
                syncResub = false;
                subscribeForRetryWhen();
            }
        };
        subscribeForRetryWhen();
    });
}

function sample(notifier) {
    return operate((source, subscriber) => {
        let hasValue = false;
        let lastValue = null;
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            hasValue = true;
            lastValue = value;
        }));
        const emit = () => {
            if (hasValue) {
                hasValue = false;
                const value = lastValue;
                lastValue = null;
                subscriber.next(value);
            }
        };
        notifier.subscribe(new OperatorSubscriber(subscriber, emit, undefined, noop));
    });
}

function sampleTime(period, scheduler = asyncScheduler) {
    return sample(interval(period, scheduler));
}

function scan(accumulator, seed) {
    return operate(scanInternals(accumulator, seed, arguments.length >= 2, true));
}

function sequenceEqual(compareTo, comparator = (a, b) => a === b) {
    return operate((source, subscriber) => {
        const aState = createState();
        const bState = createState();
        const emit = (isEqual) => {
            subscriber.next(isEqual);
            subscriber.complete();
        };
        const createSubscriber = (selfState, otherState) => {
            const sequenceEqualSubscriber = new OperatorSubscriber(subscriber, (a) => {
                const { buffer, complete } = otherState;
                if (buffer.length === 0) {
                    complete ? emit(false) : selfState.buffer.push(a);
                }
                else {
                    !comparator(a, buffer.shift()) && emit(false);
                }
            }, undefined, () => {
                selfState.complete = true;
                const { complete, buffer } = otherState;
                complete && emit(buffer.length === 0);
                sequenceEqualSubscriber === null || sequenceEqualSubscriber === void 0 ? void 0 : sequenceEqualSubscriber.unsubscribe();
            });
            return sequenceEqualSubscriber;
        };
        source.subscribe(createSubscriber(aState, bState));
        compareTo.subscribe(createSubscriber(bState, aState));
    });
}
function createState() {
    return {
        buffer: [],
        complete: false,
    };
}

function shareSubjectFactory() {
    return new Subject();
}
function share() {
    return (source) => refCount()(multicast(shareSubjectFactory)(source));
}

function shareReplay(configOrBufferSize, windowTime, scheduler) {
    let config;
    if (configOrBufferSize && typeof configOrBufferSize === 'object') {
        config = configOrBufferSize;
    }
    else {
        config = {
            bufferSize: configOrBufferSize,
            windowTime,
            refCount: false,
            scheduler
        };
    }
    return operate(shareReplayOperator(config));
}
function shareReplayOperator({ bufferSize = Infinity, windowTime = Infinity, refCount: useRefCount, scheduler }) {
    let subject;
    let refCount = 0;
    let subscription;
    return (source, subscriber) => {
        refCount++;
        let innerSub;
        if (!subject) {
            subject = new ReplaySubject(bufferSize, windowTime, scheduler);
            innerSub = subject.subscribe(subscriber);
            subscription = source.subscribe({
                next(value) { subject.next(value); },
                error(err) {
                    const dest = subject;
                    subscription = undefined;
                    subject = undefined;
                    dest.error(err);
                },
                complete() {
                    subscription = undefined;
                    subject.complete();
                },
            });
            if (subscription.closed) {
                subscription = undefined;
            }
        }
        else {
            innerSub = subject.subscribe(subscriber);
        }
        subscriber.add(() => {
            refCount--;
            innerSub.unsubscribe();
            if (useRefCount && refCount === 0 && subscription) {
                subscription.unsubscribe();
                subscription = undefined;
                subject = undefined;
            }
        });
    };
}

function single(predicate) {
    return operate((source, subscriber) => {
        let hasValue = false;
        let singleValue;
        let seenValue = false;
        let index = 0;
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            seenValue = true;
            if (!predicate || predicate(value, index++, source)) {
                hasValue && subscriber.error(new SequenceError('Too many matching values'));
                hasValue = true;
                singleValue = value;
            }
        }, undefined, () => {
            if (hasValue) {
                subscriber.next(singleValue);
                subscriber.complete();
            }
            else {
                subscriber.error(seenValue ? new NotFoundError('No matching values') : new EmptyError());
            }
        }));
    });
}

function skip(count) {
    return filter((_, index) => count <= index);
}

function skipLast(skipCount) {
    return skipCount <= 0
        ? identity
        : operate((source, subscriber) => {
            let ring = new Array(skipCount);
            let count = 0;
            source.subscribe(new OperatorSubscriber(subscriber, (value) => {
                const currentCount = count++;
                if (currentCount < skipCount) {
                    ring[currentCount] = value;
                }
                else {
                    const index = currentCount % skipCount;
                    const oldValue = ring[index];
                    ring[index] = value;
                    subscriber.next(oldValue);
                }
            }, undefined, undefined, () => (ring = null)));
        });
}

function skipUntil(notifier) {
    return operate((source, subscriber) => {
        let taking = false;
        const skipSubscriber = new OperatorSubscriber(subscriber, () => {
            skipSubscriber === null || skipSubscriber === void 0 ? void 0 : skipSubscriber.unsubscribe();
            taking = true;
        }, undefined, noop);
        innerFrom(notifier).subscribe(skipSubscriber);
        source.subscribe(new OperatorSubscriber(subscriber, (value) => taking && subscriber.next(value)));
    });
}

function skipWhile(predicate) {
    return operate((source, subscriber) => {
        let taking = false;
        let index = 0;
        source.subscribe(new OperatorSubscriber(subscriber, (value) => (taking || (taking = !predicate(value, index++))) && subscriber.next(value)));
    });
}

function startWith(...values) {
    const scheduler = popScheduler(values);
    return operate((source, subscriber) => {
        (scheduler ? concat$1(values, source, scheduler) : concat$1(values, source)).subscribe(subscriber);
    });
}

function switchMap(project, resultSelector) {
    return operate((source, subscriber) => {
        let innerSubscriber = null;
        let index = 0;
        let isComplete = false;
        const checkComplete = () => isComplete && !innerSubscriber && subscriber.complete();
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            innerSubscriber === null || innerSubscriber === void 0 ? void 0 : innerSubscriber.unsubscribe();
            let innerIndex = 0;
            const outerIndex = index++;
            innerFrom(project(value, outerIndex)).subscribe((innerSubscriber = new OperatorSubscriber(subscriber, (innerValue) => subscriber.next(resultSelector ? resultSelector(value, innerValue, outerIndex, innerIndex++) : innerValue), undefined, () => {
                innerSubscriber = null;
                checkComplete();
            })));
        }, undefined, () => {
            isComplete = true;
            checkComplete();
        }));
    });
}

function switchAll() {
    return switchMap(identity);
}

function switchMapTo(innerObservable, resultSelector) {
    return resultSelector ? switchMap(() => innerObservable, resultSelector) : switchMap(() => innerObservable);
}

function switchScan(accumulator, seed) {
    return operate((source, subscriber) => {
        let state = seed;
        switchMap((value, index) => accumulator(state, value, index), (_, innerValue) => ((state = innerValue), innerValue))(source).subscribe(subscriber);
        return () => {
            state = null;
        };
    });
}

function takeUntil(notifier) {
    return operate((source, subscriber) => {
        innerFrom(notifier).subscribe(new OperatorSubscriber(subscriber, () => subscriber.complete(), undefined, noop));
        !subscriber.closed && source.subscribe(subscriber);
    });
}

function takeWhile(predicate, inclusive = false) {
    return operate((source, subscriber) => {
        let index = 0;
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            const result = predicate(value, index++);
            (result || inclusive) && subscriber.next(value);
            !result && subscriber.complete();
        }));
    });
}

function tap(observerOrNext, error, complete) {
    const tapObserver = isFunction(observerOrNext) || error || complete ? { next: observerOrNext, error, complete } : observerOrNext;
    return tapObserver
        ? operate((source, subscriber) => {
            source.subscribe(new OperatorSubscriber(subscriber, (value) => {
                var _a;
                (_a = tapObserver.next) === null || _a === void 0 ? void 0 : _a.call(tapObserver, value);
                subscriber.next(value);
            }, (err) => {
                var _a;
                (_a = tapObserver.error) === null || _a === void 0 ? void 0 : _a.call(tapObserver, err);
                subscriber.error(err);
            }, () => {
                var _a;
                (_a = tapObserver.complete) === null || _a === void 0 ? void 0 : _a.call(tapObserver);
                subscriber.complete();
            }));
        })
        :
            identity;
}

const defaultThrottleConfig = {
    leading: true,
    trailing: false,
};
function throttle(durationSelector, { leading, trailing } = defaultThrottleConfig) {
    return operate((source, subscriber) => {
        let hasValue = false;
        let sendValue = null;
        let throttled = null;
        let isComplete = false;
        const endThrottling = () => {
            throttled === null || throttled === void 0 ? void 0 : throttled.unsubscribe();
            throttled = null;
            if (trailing) {
                send();
                isComplete && subscriber.complete();
            }
        };
        const cleanupThrottling = () => {
            throttled = null;
            isComplete && subscriber.complete();
        };
        const startThrottle = (value) => (throttled = innerFrom(durationSelector(value)).subscribe(new OperatorSubscriber(subscriber, endThrottling, undefined, cleanupThrottling)));
        const send = () => {
            if (hasValue) {
                subscriber.next(sendValue);
                !isComplete && startThrottle(sendValue);
            }
            hasValue = false;
            sendValue = null;
        };
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            hasValue = true;
            sendValue = value;
            !(throttled && !throttled.closed) && (leading ? send() : startThrottle(value));
        }, undefined, () => {
            isComplete = true;
            !(trailing && hasValue && throttled && !throttled.closed) && subscriber.complete();
        }));
    });
}

function throttleTime(duration, scheduler = asyncScheduler, config = defaultThrottleConfig) {
    const duration$ = timer(duration, scheduler);
    return throttle(() => duration$, config);
}

function timeInterval(scheduler = async) {
    return (source) => defer(() => {
        return source.pipe(scan(({ current }, value) => ({ value, current: scheduler.now(), last: current }), { current: scheduler.now(), value: undefined, last: undefined }), map(({ current, last, value }) => new TimeInterval(value, current - last)));
    });
}
class TimeInterval {
    constructor(value, interval) {
        this.value = value;
        this.interval = interval;
    }
}

function timeoutWith(due, withObservable, scheduler) {
    let first;
    let each;
    let _with;
    scheduler = scheduler !== null && scheduler !== void 0 ? scheduler : async;
    if (isValidDate(due)) {
        first = due;
    }
    else if (typeof due === 'number') {
        each = due;
    }
    if (withObservable) {
        _with = () => withObservable;
    }
    else {
        throw new TypeError('No observable provided to switch to');
    }
    if (first == null && each == null) {
        throw new TypeError('No timeout provided.');
    }
    return timeout({
        first,
        each,
        scheduler,
        with: _with,
    });
}

function timestamp(timestampProvider = dateTimestampProvider) {
    return map((value) => ({ value, timestamp: timestampProvider.now() }));
}

function window(windowBoundaries) {
    return operate((source, subscriber) => {
        let windowSubject = new Subject();
        subscriber.next(windowSubject.asObservable());
        const windowSubscribe = (sourceOrNotifier, next) => sourceOrNotifier.subscribe(new OperatorSubscriber(subscriber, next, (err) => {
            windowSubject.error(err);
            subscriber.error(err);
        }, () => {
            windowSubject.complete();
            subscriber.complete();
        }));
        windowSubscribe(source, (value) => windowSubject.next(value));
        windowSubscribe(windowBoundaries, () => {
            windowSubject.complete();
            subscriber.next((windowSubject = new Subject()));
        });
        return () => {
            windowSubject.unsubscribe();
            windowSubject = null;
        };
    });
}

function windowCount(windowSize, startWindowEvery = 0) {
    const startEvery = startWindowEvery > 0 ? startWindowEvery : windowSize;
    return operate((source, subscriber) => {
        let windows = [new Subject()];
        let starts = [];
        let count = 0;
        subscriber.next(windows[0].asObservable());
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            for (const window of windows) {
                window.next(value);
            }
            const c = count - windowSize + 1;
            if (c >= 0 && c % startEvery === 0) {
                windows.shift().complete();
            }
            if (++count % startEvery === 0) {
                const window = new Subject();
                windows.push(window);
                subscriber.next(window.asObservable());
            }
        }, (err) => {
            while (windows.length > 0) {
                windows.shift().error(err);
            }
            subscriber.error(err);
        }, () => {
            while (windows.length > 0) {
                windows.shift().complete();
            }
            subscriber.complete();
        }, () => {
            starts = null;
            windows = null;
        }));
    });
}

function windowTime(windowTimeSpan, ...otherArgs) {
    var _a, _b;
    const scheduler = (_a = popScheduler(otherArgs)) !== null && _a !== void 0 ? _a : asyncScheduler;
    const windowCreationInterval = (_b = otherArgs[0]) !== null && _b !== void 0 ? _b : null;
    const maxWindowSize = otherArgs[1] || Infinity;
    return operate((source, subscriber) => {
        let windowRecords = [];
        let restartOnClose = false;
        const closeWindow = (record) => {
            const { window, subs } = record;
            window.complete();
            subs.unsubscribe();
            arrRemove(windowRecords, record);
            restartOnClose && startWindow();
        };
        const startWindow = () => {
            if (windowRecords) {
                const subs = new Subscription();
                subscriber.add(subs);
                const window = new Subject();
                const record = {
                    window,
                    subs,
                    seen: 0,
                };
                windowRecords.push(record);
                subscriber.next(window.asObservable());
                subs.add(scheduler.schedule(() => closeWindow(record), windowTimeSpan));
            }
        };
        windowCreationInterval !== null && windowCreationInterval >= 0
            ?
                subscriber.add(scheduler.schedule(function () {
                    startWindow();
                    !this.closed && subscriber.add(this.schedule(null, windowCreationInterval));
                }, windowCreationInterval))
            : (restartOnClose = true);
        startWindow();
        const loop = (cb) => windowRecords.slice().forEach(cb);
        const terminate = (cb) => {
            loop(({ window }) => cb(window));
            cb(subscriber);
            subscriber.unsubscribe();
        };
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            loop((record) => {
                record.window.next(value);
                maxWindowSize <= ++record.seen && closeWindow(record);
            });
        }, (err) => terminate((consumer) => consumer.error(err)), () => terminate((consumer) => consumer.complete())));
        return () => {
            windowRecords = null;
        };
    });
}

function windowToggle(openings, closingSelector) {
    return operate((source, subscriber) => {
        const windows = [];
        const handleError = (err) => {
            while (0 < windows.length) {
                windows.shift().error(err);
            }
            subscriber.error(err);
        };
        innerFrom(openings).subscribe(new OperatorSubscriber(subscriber, (openValue) => {
            const window = new Subject();
            windows.push(window);
            const closingSubscription = new Subscription();
            const closeWindow = () => {
                arrRemove(windows, window);
                window.complete();
                closingSubscription.unsubscribe();
            };
            let closingNotifier;
            try {
                closingNotifier = innerFrom(closingSelector(openValue));
            }
            catch (err) {
                handleError(err);
                return;
            }
            subscriber.next(window.asObservable());
            closingSubscription.add(closingNotifier.subscribe(new OperatorSubscriber(subscriber, closeWindow, handleError, noop)));
        }, undefined, noop));
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            const windowsCopy = windows.slice();
            for (const window of windowsCopy) {
                window.next(value);
            }
        }, handleError, () => {
            while (0 < windows.length) {
                windows.shift().complete();
            }
            subscriber.complete();
        }, () => {
            while (0 < windows.length) {
                windows.shift().unsubscribe();
            }
        }));
    });
}

function windowWhen(closingSelector) {
    return operate((source, subscriber) => {
        let window;
        let closingSubscriber;
        const handleError = (err) => {
            window.error(err);
            subscriber.error(err);
        };
        const openWindow = () => {
            closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
            window === null || window === void 0 ? void 0 : window.complete();
            window = new Subject();
            subscriber.next(window.asObservable());
            let closingNotifier;
            try {
                closingNotifier = innerFrom(closingSelector());
            }
            catch (err) {
                handleError(err);
                return;
            }
            closingNotifier.subscribe((closingSubscriber = new OperatorSubscriber(subscriber, openWindow, handleError, openWindow)));
        };
        openWindow();
        source.subscribe(new OperatorSubscriber(subscriber, (value) => window.next(value), handleError, () => {
            window.complete();
            subscriber.complete();
        }, () => {
            closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
            window = null;
        }));
    });
}

function withLatestFrom(...inputs) {
    const project = popResultSelector(inputs);
    return operate((source, subscriber) => {
        const len = inputs.length;
        const otherValues = new Array(len);
        let hasValue = inputs.map(() => false);
        let ready = false;
        for (let i = 0; i < len; i++) {
            innerFrom(inputs[i]).subscribe(new OperatorSubscriber(subscriber, (value) => {
                otherValues[i] = value;
                if (!ready && !hasValue[i]) {
                    hasValue[i] = true;
                    (ready = hasValue.every(identity)) && (hasValue = null);
                }
            }, undefined, noop));
        }
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            if (ready) {
                const values = [value, ...otherValues];
                subscriber.next(project ? project(...values) : values);
            }
        }));
    });
}

function zip(...sources) {
    return operate((source, subscriber) => {
        zip$1(source, ...sources).subscribe(subscriber);
    });
}
function zipWith(...otherInputs) {
    return zip(...otherInputs);
}

function zipAll(project) {
    return joinAllInternals(zip$1, project);
}

export { audit, auditTime, buffer, bufferCount, bufferTime, bufferToggle, bufferWhen, catchError, combineAll, combineLatest, combineLatestWith, concat, concatMap, concatMapTo, concatWith, count, debounce, debounceTime, defaultIfEmpty, delay, delayWhen, dematerialize, distinct, distinctUntilChanged, distinctUntilKeyChanged, elementAt, endWith, every, exhaust, exhaustMap, expand, finalize, find, findIndex, first, groupBy, ignoreElements, isEmpty, last, mapTo, materialize, max, merge, mergeMapTo, mergeScan, mergeWith, min, multicast, pairwise, partition, pluck, publish, publishBehavior, publishLast, publishReplay, race, raceWith, reduce, repeat, repeatWhen, retry, retryWhen, sample, sampleTime, scan, sequenceEqual, share, shareReplay, single, skip, skipLast, skipUntil, skipWhile, startWith, switchAll, switchMap, switchMapTo, switchScan, take, takeLast, takeUntil, takeWhile, tap, throttle, throttleTime, throwIfEmpty, timeInterval, timeoutWith, timestamp, toArray, window, windowCount, windowTime, windowToggle, windowWhen, withLatestFrom, zip, zipAll, zipWith };
