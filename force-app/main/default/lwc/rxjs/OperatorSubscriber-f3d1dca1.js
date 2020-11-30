/**
* @license
* Rxjs 7.0.0 (Custom Build) <https://github.com/ReactiveX/rxjs>
* Apache License 2.0 <https://github.com/ReactiveX/rxjs/blob/master/LICENSE.txt>
* Build By: ExiaHuang 
* Build Date: 2020-11-29
* lwc-rxjs: https://github.com/exiahuang/lwc-rxjs
*/
import { c as Subscriber } from './Observable-e9323dae.js';

class OperatorSubscriber extends Subscriber {
    constructor(destination, onNext, onError, onComplete, onUnsubscribe) {
        super(destination);
        this.onUnsubscribe = onUnsubscribe;
        if (onNext) {
            this._next = function (value) {
                try {
                    onNext(value);
                }
                catch (err) {
                    this.destination.error(err);
                }
            };
        }
        if (onError) {
            this._error = function (err) {
                try {
                    onError(err);
                }
                catch (err) {
                    this.destination.error(err);
                }
                this.unsubscribe();
            };
        }
        if (onComplete) {
            this._complete = function () {
                try {
                    onComplete();
                }
                catch (err) {
                    this.destination.error(err);
                }
                this.unsubscribe();
            };
        }
    }
    unsubscribe() {
        var _a;
        !this.closed && ((_a = this.onUnsubscribe) === null || _a === void 0 ? void 0 : _a.call(this));
        super.unsubscribe();
    }
}

export { OperatorSubscriber as O };
