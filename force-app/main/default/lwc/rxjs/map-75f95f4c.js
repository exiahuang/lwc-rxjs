/**
* @license
* Rxjs 7.0.0 (Custom Build) <https://github.com/ReactiveX/rxjs>
* Apache License 2.0 <https://github.com/ReactiveX/rxjs/blob/master/LICENSE.txt>
* Build By: ExiaHuang 
* Build Date: 2020-11-29
* lwc-rxjs: https://github.com/exiahuang/lwc-rxjs
*/
import { i as isFunction } from './Observable-e9323dae.js';
import { O as OperatorSubscriber } from './OperatorSubscriber-f3d1dca1.js';

function hasLift(source) {
    return isFunction(source === null || source === void 0 ? void 0 : source.lift);
}
function operate(init) {
    return (source) => {
        if (hasLift(source)) {
            return source.lift(function (liftedSource) {
                try {
                    return init(liftedSource, this);
                }
                catch (err) {
                    this.error(err);
                }
            });
        }
        throw new TypeError('Unable to lift unknown Observable type');
    };
}

function map(project, thisArg) {
    return operate((source, subscriber) => {
        let index = 0;
        source.subscribe(new OperatorSubscriber(subscriber, (value) => {
            subscriber.next(project.call(thisArg, value, index++));
        }));
    });
}

export { hasLift as h, map as m, operate as o };
