/**
* @license
* Rxjs 7.0.0 (Custom Build) <https://github.com/ReactiveX/rxjs>
* Apache License 2.0 <https://github.com/ReactiveX/rxjs/blob/master/LICENSE.txt>
* Build By: ExiaHuang 
* Build Date: 2020-11-29
* lwc-rxjs: https://github.com/exiahuang/lwc-rxjs
*/
import { O as Observable, S as Subscription, g as nextNotification, h as errorNotification, C as COMPLETE_NOTIFICATION, t as timeoutProvider } from './Observable-e9323dae.js';
import { V as VirtualTimeScheduler, b as VirtualAction, a as animationFrameProvider, i as immediateProvider, p as performanceTimestampProvider } from './VirtualTimeScheduler-bb035abd.js';
import { S as Subject, d as dateTimestampProvider } from './dateTimestampProvider-00364774.js';
import { g as observeNotification, h as intervalProvider } from './Notification-bc209f77.js';
import './from-3e8021ae.js';

class SubscriptionLog {
    constructor(subscribedFrame, unsubscribedFrame = Infinity) {
        this.subscribedFrame = subscribedFrame;
        this.unsubscribedFrame = unsubscribedFrame;
    }
}

class SubscriptionLoggable {
    constructor() {
        this.subscriptions = [];
    }
    logSubscribedFrame() {
        this.subscriptions.push(new SubscriptionLog(this.scheduler.now()));
        return this.subscriptions.length - 1;
    }
    logUnsubscribedFrame(index) {
        const subscriptionLogs = this.subscriptions;
        const oldSubscriptionLog = subscriptionLogs[index];
        subscriptionLogs[index] = new SubscriptionLog(oldSubscriptionLog.subscribedFrame, this.scheduler.now());
    }
}

function applyMixins(derivedCtor, baseCtors) {
    for (let i = 0, len = baseCtors.length; i < len; i++) {
        const baseCtor = baseCtors[i];
        const propertyKeys = Object.getOwnPropertyNames(baseCtor.prototype);
        for (let j = 0, len2 = propertyKeys.length; j < len2; j++) {
            const name = propertyKeys[j];
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        }
    }
}

class ColdObservable extends Observable {
    constructor(messages, scheduler) {
        super(function (subscriber) {
            const observable = this;
            const index = observable.logSubscribedFrame();
            const subscription = new Subscription();
            subscription.add(new Subscription(() => {
                observable.logUnsubscribedFrame(index);
            }));
            observable.scheduleMessages(subscriber);
            return subscription;
        });
        this.messages = messages;
        this.subscriptions = [];
        this.scheduler = scheduler;
    }
    scheduleMessages(subscriber) {
        const messagesLength = this.messages.length;
        for (let i = 0; i < messagesLength; i++) {
            const message = this.messages[i];
            subscriber.add(this.scheduler.schedule((state) => {
                const { message: { notification }, subscriber: destination } = state;
                observeNotification(notification, destination);
            }, message.frame, { message, subscriber }));
        }
    }
}
applyMixins(ColdObservable, [SubscriptionLoggable]);

class HotObservable extends Subject {
    constructor(messages, scheduler) {
        super();
        this.messages = messages;
        this.subscriptions = [];
        this.scheduler = scheduler;
    }
    _subscribe(subscriber) {
        const subject = this;
        const index = subject.logSubscribedFrame();
        const subscription = new Subscription();
        subscription.add(new Subscription(() => {
            subject.logUnsubscribedFrame(index);
        }));
        subscription.add(super._subscribe(subscriber));
        return subscription;
    }
    setup() {
        const subject = this;
        const messagesLength = subject.messages.length;
        for (let i = 0; i < messagesLength; i++) {
            (() => {
                const { notification, frame } = subject.messages[i];
                subject.scheduler.schedule(() => {
                    observeNotification(notification, subject);
                }, frame);
            })();
        }
    }
}
applyMixins(HotObservable, [SubscriptionLoggable]);

const defaultMaxFrame = 750;
class TestScheduler extends VirtualTimeScheduler {
    constructor(assertDeepEqual) {
        super(VirtualAction, defaultMaxFrame);
        this.assertDeepEqual = assertDeepEqual;
        this.hotObservables = [];
        this.coldObservables = [];
        this.flushTests = [];
        this.runMode = false;
    }
    createTime(marbles) {
        const indexOf = this.runMode ? marbles.trim().indexOf('|') : marbles.indexOf('|');
        if (indexOf === -1) {
            throw new Error('marble diagram for time should have a completion marker "|"');
        }
        return indexOf * TestScheduler.frameTimeFactor;
    }
    createColdObservable(marbles, values, error) {
        if (marbles.indexOf('^') !== -1) {
            throw new Error('cold observable cannot have subscription offset "^"');
        }
        if (marbles.indexOf('!') !== -1) {
            throw new Error('cold observable cannot have unsubscription marker "!"');
        }
        const messages = TestScheduler.parseMarbles(marbles, values, error, undefined, this.runMode);
        const cold = new ColdObservable(messages, this);
        this.coldObservables.push(cold);
        return cold;
    }
    createHotObservable(marbles, values, error) {
        if (marbles.indexOf('!') !== -1) {
            throw new Error('hot observable cannot have unsubscription marker "!"');
        }
        const messages = TestScheduler.parseMarbles(marbles, values, error, undefined, this.runMode);
        const subject = new HotObservable(messages, this);
        this.hotObservables.push(subject);
        return subject;
    }
    materializeInnerObservable(observable, outerFrame) {
        const messages = [];
        observable.subscribe((value) => {
            messages.push({ frame: this.frame - outerFrame, notification: nextNotification(value) });
        }, (error) => {
            messages.push({ frame: this.frame - outerFrame, notification: errorNotification(error) });
        }, () => {
            messages.push({ frame: this.frame - outerFrame, notification: COMPLETE_NOTIFICATION });
        });
        return messages;
    }
    expectObservable(observable, subscriptionMarbles = null) {
        const actual = [];
        const flushTest = { actual, ready: false };
        const subscriptionParsed = TestScheduler.parseMarblesAsSubscriptions(subscriptionMarbles, this.runMode);
        const subscriptionFrame = subscriptionParsed.subscribedFrame === Infinity ?
            0 : subscriptionParsed.subscribedFrame;
        const unsubscriptionFrame = subscriptionParsed.unsubscribedFrame;
        let subscription;
        this.schedule(() => {
            subscription = observable.subscribe(x => {
                let value = x;
                if (x instanceof Observable) {
                    value = this.materializeInnerObservable(value, this.frame);
                }
                actual.push({ frame: this.frame, notification: nextNotification(value) });
            }, (error) => {
                actual.push({ frame: this.frame, notification: errorNotification(error) });
            }, () => {
                actual.push({ frame: this.frame, notification: COMPLETE_NOTIFICATION });
            });
        }, subscriptionFrame);
        if (unsubscriptionFrame !== Infinity) {
            this.schedule(() => subscription.unsubscribe(), unsubscriptionFrame);
        }
        this.flushTests.push(flushTest);
        const { runMode } = this;
        return {
            toBe(marbles, values, errorValue) {
                flushTest.ready = true;
                flushTest.expected = TestScheduler.parseMarbles(marbles, values, errorValue, true, runMode);
            }
        };
    }
    expectSubscriptions(actualSubscriptionLogs) {
        const flushTest = { actual: actualSubscriptionLogs, ready: false };
        this.flushTests.push(flushTest);
        const { runMode } = this;
        return {
            toBe(marblesOrMarblesArray) {
                const marblesArray = (typeof marblesOrMarblesArray === 'string') ? [marblesOrMarblesArray] : marblesOrMarblesArray;
                flushTest.ready = true;
                flushTest.expected = marblesArray.map(marbles => TestScheduler.parseMarblesAsSubscriptions(marbles, runMode)).filter(marbles => marbles.subscribedFrame !== Infinity);
            }
        };
    }
    flush() {
        const hotObservables = this.hotObservables;
        while (hotObservables.length > 0) {
            hotObservables.shift().setup();
        }
        super.flush();
        this.flushTests = this.flushTests.filter(test => {
            if (test.ready) {
                this.assertDeepEqual(test.actual, test.expected);
                return false;
            }
            return true;
        });
    }
    static parseMarblesAsSubscriptions(marbles, runMode = false) {
        if (typeof marbles !== 'string') {
            return new SubscriptionLog(Infinity);
        }
        const len = marbles.length;
        let groupStart = -1;
        let subscriptionFrame = Infinity;
        let unsubscriptionFrame = Infinity;
        let frame = 0;
        for (let i = 0; i < len; i++) {
            let nextFrame = frame;
            const advanceFrameBy = (count) => {
                nextFrame += count * this.frameTimeFactor;
            };
            const c = marbles[i];
            switch (c) {
                case ' ':
                    if (!runMode) {
                        advanceFrameBy(1);
                    }
                    break;
                case '-':
                    advanceFrameBy(1);
                    break;
                case '(':
                    groupStart = frame;
                    advanceFrameBy(1);
                    break;
                case ')':
                    groupStart = -1;
                    advanceFrameBy(1);
                    break;
                case '^':
                    if (subscriptionFrame !== Infinity) {
                        throw new Error('found a second subscription point \'^\' in a ' +
                            'subscription marble diagram. There can only be one.');
                    }
                    subscriptionFrame = groupStart > -1 ? groupStart : frame;
                    advanceFrameBy(1);
                    break;
                case '!':
                    if (unsubscriptionFrame !== Infinity) {
                        throw new Error('found a second unsubscription point \'!\' in a ' +
                            'subscription marble diagram. There can only be one.');
                    }
                    unsubscriptionFrame = groupStart > -1 ? groupStart : frame;
                    break;
                default:
                    if (runMode && c.match(/^[0-9]$/)) {
                        if (i === 0 || marbles[i - 1] === ' ') {
                            const buffer = marbles.slice(i);
                            const match = buffer.match(/^([0-9]+(?:\.[0-9]+)?)(ms|s|m) /);
                            if (match) {
                                i += match[0].length - 1;
                                const duration = parseFloat(match[1]);
                                const unit = match[2];
                                let durationInMs;
                                switch (unit) {
                                    case 'ms':
                                        durationInMs = duration;
                                        break;
                                    case 's':
                                        durationInMs = duration * 1000;
                                        break;
                                    case 'm':
                                        durationInMs = duration * 1000 * 60;
                                        break;
                                }
                                advanceFrameBy(durationInMs / this.frameTimeFactor);
                                break;
                            }
                        }
                    }
                    throw new Error('there can only be \'^\' and \'!\' markers in a ' +
                        'subscription marble diagram. Found instead \'' + c + '\'.');
            }
            frame = nextFrame;
        }
        if (unsubscriptionFrame < 0) {
            return new SubscriptionLog(subscriptionFrame);
        }
        else {
            return new SubscriptionLog(subscriptionFrame, unsubscriptionFrame);
        }
    }
    static parseMarbles(marbles, values, errorValue, materializeInnerObservables = false, runMode = false) {
        if (marbles.indexOf('!') !== -1) {
            throw new Error('conventional marble diagrams cannot have the ' +
                'unsubscription marker "!"');
        }
        const len = marbles.length;
        const testMessages = [];
        const subIndex = runMode ? marbles.replace(/^[ ]+/, '').indexOf('^') : marbles.indexOf('^');
        let frame = subIndex === -1 ? 0 : (subIndex * -this.frameTimeFactor);
        const getValue = typeof values !== 'object' ?
            (x) => x :
            (x) => {
                if (materializeInnerObservables && values[x] instanceof ColdObservable) {
                    return values[x].messages;
                }
                return values[x];
            };
        let groupStart = -1;
        for (let i = 0; i < len; i++) {
            let nextFrame = frame;
            const advanceFrameBy = (count) => {
                nextFrame += count * this.frameTimeFactor;
            };
            let notification;
            const c = marbles[i];
            switch (c) {
                case ' ':
                    if (!runMode) {
                        advanceFrameBy(1);
                    }
                    break;
                case '-':
                    advanceFrameBy(1);
                    break;
                case '(':
                    groupStart = frame;
                    advanceFrameBy(1);
                    break;
                case ')':
                    groupStart = -1;
                    advanceFrameBy(1);
                    break;
                case '|':
                    notification = COMPLETE_NOTIFICATION;
                    advanceFrameBy(1);
                    break;
                case '^':
                    advanceFrameBy(1);
                    break;
                case '#':
                    notification = errorNotification(errorValue || 'error');
                    advanceFrameBy(1);
                    break;
                default:
                    if (runMode && c.match(/^[0-9]$/)) {
                        if (i === 0 || marbles[i - 1] === ' ') {
                            const buffer = marbles.slice(i);
                            const match = buffer.match(/^([0-9]+(?:\.[0-9]+)?)(ms|s|m) /);
                            if (match) {
                                i += match[0].length - 1;
                                const duration = parseFloat(match[1]);
                                const unit = match[2];
                                let durationInMs;
                                switch (unit) {
                                    case 'ms':
                                        durationInMs = duration;
                                        break;
                                    case 's':
                                        durationInMs = duration * 1000;
                                        break;
                                    case 'm':
                                        durationInMs = duration * 1000 * 60;
                                        break;
                                }
                                advanceFrameBy(durationInMs / this.frameTimeFactor);
                                break;
                            }
                        }
                    }
                    notification = nextNotification(getValue(c));
                    advanceFrameBy(1);
                    break;
            }
            if (notification) {
                testMessages.push({ frame: groupStart > -1 ? groupStart : frame, notification });
            }
            frame = nextFrame;
        }
        return testMessages;
    }
    createAnimator() {
        if (!this.runMode) {
            throw new Error('animate() must only be used in run mode');
        }
        let lastHandle = 0;
        let map;
        const delegate = {
            requestAnimationFrame(callback) {
                if (!map) {
                    throw new Error("animate() was not called within run()");
                }
                const handle = ++lastHandle;
                map.set(handle, callback);
                return handle;
            },
            cancelAnimationFrame(handle) {
                if (!map) {
                    throw new Error("animate() was not called within run()");
                }
                map.delete(handle);
            }
        };
        const animate = (marbles) => {
            if (map) {
                throw new Error('animate() must not be called more than once within run()');
            }
            if (/[|#]/.test(marbles)) {
                throw new Error('animate() must not complete or error');
            }
            map = new Map();
            const messages = TestScheduler.parseMarbles(marbles, undefined, undefined, undefined, true);
            for (const message of messages) {
                this.schedule(() => {
                    const now = this.now();
                    const callbacks = Array.from(map.values());
                    map.clear();
                    for (const callback of callbacks) {
                        callback(now);
                    }
                }, message.frame);
            }
        };
        return { animate, delegate };
    }
    createDelegates() {
        let lastHandle = 0;
        const scheduleLookup = new Map();
        const run = () => {
            const now = this.now();
            const scheduledRecords = Array.from(scheduleLookup.values());
            const scheduledRecordsDue = scheduledRecords.filter(({ due }) => due <= now);
            const dueImmediates = scheduledRecordsDue.filter(({ type }) => type === 'immediate');
            if (dueImmediates.length > 0) {
                const { handle, handler } = dueImmediates[0];
                scheduleLookup.delete(handle);
                handler();
                return;
            }
            const dueIntervals = scheduledRecordsDue.filter(({ type }) => type === 'interval');
            if (dueIntervals.length > 0) {
                const firstDueInterval = dueIntervals[0];
                const { duration, handler } = firstDueInterval;
                firstDueInterval.due = now + duration;
                firstDueInterval.subscription = this.schedule(run, duration);
                handler();
                return;
            }
            const dueTimeouts = scheduledRecordsDue.filter(({ type }) => type === 'timeout');
            if (dueTimeouts.length > 0) {
                const { handle, handler } = dueTimeouts[0];
                scheduleLookup.delete(handle);
                handler();
                return;
            }
            throw new Error('Expected a due immediate or interval');
        };
        const immediate = {
            setImmediate: (handler) => {
                const handle = ++lastHandle;
                scheduleLookup.set(handle, {
                    due: this.now(),
                    duration: 0,
                    handle,
                    handler,
                    subscription: this.schedule(run, 0),
                    type: 'immediate',
                });
                return handle;
            },
            clearImmediate: (handle) => {
                const value = scheduleLookup.get(handle);
                if (value) {
                    value.subscription.unsubscribe();
                    scheduleLookup.delete(handle);
                }
            }
        };
        const interval = {
            setInterval: (handler, duration = 0) => {
                const handle = ++lastHandle;
                scheduleLookup.set(handle, {
                    due: this.now() + duration,
                    duration,
                    handle,
                    handler,
                    subscription: this.schedule(run, duration),
                    type: 'interval',
                });
                return handle;
            },
            clearInterval: (handle) => {
                const value = scheduleLookup.get(handle);
                if (value) {
                    value.subscription.unsubscribe();
                    scheduleLookup.delete(handle);
                }
            }
        };
        const timeout = {
            setTimeout: (handler, duration = 0) => {
                const handle = ++lastHandle;
                scheduleLookup.set(handle, {
                    due: this.now() + duration,
                    duration,
                    handle,
                    handler,
                    subscription: this.schedule(run, duration),
                    type: 'timeout',
                });
                return handle;
            },
            clearTimeout: (handle) => {
                const value = scheduleLookup.get(handle);
                if (value) {
                    value.subscription.unsubscribe();
                    scheduleLookup.delete(handle);
                }
            }
        };
        return { immediate, interval, timeout };
    }
    run(callback) {
        const prevFrameTimeFactor = TestScheduler.frameTimeFactor;
        const prevMaxFrames = this.maxFrames;
        TestScheduler.frameTimeFactor = 1;
        this.maxFrames = Infinity;
        this.runMode = true;
        const animator = this.createAnimator();
        const delegates = this.createDelegates();
        animationFrameProvider.delegate = animator.delegate;
        dateTimestampProvider.delegate = this;
        immediateProvider.delegate = delegates.immediate;
        intervalProvider.delegate = delegates.interval;
        timeoutProvider.delegate = delegates.timeout;
        performanceTimestampProvider.delegate = this;
        const helpers = {
            cold: this.createColdObservable.bind(this),
            hot: this.createHotObservable.bind(this),
            flush: this.flush.bind(this),
            time: this.createTime.bind(this),
            expectObservable: this.expectObservable.bind(this),
            expectSubscriptions: this.expectSubscriptions.bind(this),
            animate: animator.animate,
        };
        try {
            const ret = callback(helpers);
            this.flush();
            return ret;
        }
        finally {
            TestScheduler.frameTimeFactor = prevFrameTimeFactor;
            this.maxFrames = prevMaxFrames;
            this.runMode = false;
            animationFrameProvider.delegate = undefined;
            dateTimestampProvider.delegate = undefined;
            immediateProvider.delegate = undefined;
            intervalProvider.delegate = undefined;
            timeoutProvider.delegate = undefined;
            performanceTimestampProvider.delegate = undefined;
        }
    }
}
TestScheduler.frameTimeFactor = 10;

export { TestScheduler };
