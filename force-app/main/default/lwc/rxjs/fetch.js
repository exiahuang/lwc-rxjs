/**
* @license
* Rxjs 7.0.0 (Custom Build) <https://github.com/ReactiveX/rxjs>
* Apache License 2.0 <https://github.com/ReactiveX/rxjs/blob/master/LICENSE.txt>
* Build By: ExiaHuang 
* Build Date: 2020-11-29
* lwc-rxjs: https://github.com/exiahuang/lwc-rxjs
*/
import { O as Observable } from './Observable-e9323dae.js';
import { O as OperatorSubscriber } from './OperatorSubscriber-f3d1dca1.js';
import { _ as __rest, i as innerFrom } from './from-3e8021ae.js';

function fromFetch(input, initWithSelector = {}) {
    const { selector } = initWithSelector, init = __rest(initWithSelector, ["selector"]);
    return new Observable((subscriber) => {
        const controller = new AbortController();
        const { signal } = controller;
        let abortable = true;
        let perSubscriberInit;
        if (init) {
            const { signal: outerSignal } = init;
            if (outerSignal) {
                if (outerSignal.aborted) {
                    controller.abort();
                }
                else {
                    const outerSignalHandler = () => {
                        if (!signal.aborted) {
                            controller.abort();
                        }
                    };
                    outerSignal.addEventListener('abort', outerSignalHandler);
                    subscriber.add(() => outerSignal.removeEventListener('abort', outerSignalHandler));
                }
            }
            perSubscriberInit = Object.assign(Object.assign({}, init), { signal });
        }
        else {
            perSubscriberInit = { signal };
        }
        const handleError = (err) => {
            abortable = false;
            subscriber.error(err);
        };
        fetch(input, perSubscriberInit)
            .then((response) => {
            if (selector) {
                innerFrom(selector(response)).subscribe(new OperatorSubscriber(subscriber, undefined, handleError, () => {
                    abortable = false;
                    subscriber.complete();
                }));
            }
            else {
                abortable = false;
                subscriber.next(response);
                subscriber.complete();
            }
        })
            .catch(handleError);
        return () => {
            if (abortable) {
                controller.abort();
            }
        };
    });
}

export { fromFetch };
