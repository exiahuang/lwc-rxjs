# LWC Rxjs

[lwc-rxjs](https://github.com/exiahuang/lwc-rxjs) A reactive programming library for salesforce lwc.


<img alt="Home" height="40" src="https://rxjs.dev/assets/images/logos/logo.png" title="Rxjs" width="150" class="ng-star-inserted">

## deploy lwc-rxjs

<a href="https://githubsfdeploy.herokuapp.com?owner=exiahuang&repo=lwc-rxjs">
  <img alt="Deploy to Salesforce"
       src="https://raw.githubusercontent.com/afawcett/githubsfdeploy/master/deploy.png">
</a>

or 

```sh
git clone https://github.com/exiahuang/lwc-rxjs.git
cd lwc-rxjs
sfdx force:source:deploy --loglevel fatal -p force-app/main/default/lwc/rxjs/rxjs.js-meta.xml --targetusername=$username_or_alias_for_your_sfdc_org
```

## usage

create a lwc compnent
```sh
sfdx force:lightning:component:create --type lwc -n RxjsTest
```

```js
import { Observable } from 'c/rxjs';
import { operator } from 'c/rxjs';
import { from, interval, fromEvent } from 'c/rxjs';
import { ajax } from 'c/rxjs';

export default class RxjsTest extends LightningElement {
  rxjsSub;

  handleRxjsClick(event) {
    const observable = new Observable((subscriber) => {
      subscriber.next(1);
      subscriber.next(2);
      subscriber.next(3);
    });

    observable.subscribe((x) => console.log(x));
  }

  handleRxjsOperatorClick(event) {
    const { map, filter, switchMap } = operator;
    const observable = from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      .pipe(
        map((x) => x ** 2),
        filter((x) => x > 5)
      )
      .subscribe((x) => console.log(`value: ${x}`));
  }

  handleRxjsSubClick(event) {
    if (!this.rxjsSub) {
      console.log('>>>>>>subscribe');
      //emit value in sequence every 1 second
      const source = interval(1000);
      //output: 0,1,2,3,4,5....
      this.rxjsSub = source.subscribe((val) => console.log(val));
    }
  }

  handleRxjsUnSubClick(event) {
    if (!!this.rxjsSub) {
      console.log('>>>>>>unsubscribe');
      this.rxjsSub.unsubscribe();
      this.rxjsSub = undefined;
    }
  }

  handleRxjsAjaxClick(event) {
    console.log('>>>>>>handleRxjsAjaxClick');
    const githubUsers = `https://jsonplaceholder.typicode.com/todos/1`;
    const users = ajax(githubUsers);
    const subscribe = users.subscribe(
      (res) => {
        console.log(res);
        console.log(res.status);
        console.log(res.responseType);
        console.log(JSON.stringify(res.response));
        console.log(res.xhr);
      },
      (err) => console.error(err)
    );
  }
}
```

```html
<template>
    <h1>hello Rxjs</h1>
    <p>
        <!-- Rxjs -->
        <lightning-button label="Rxjs" title="Rxjs" onclick={handleRxjsClick} class="slds-m-left_x-small"></lightning-button>
    </p>
    <p>
        <!-- Rxjs Operator -->
        <lightning-button label="Rxjs Operator" title="Rxjs" onclick={handleRxjsOperatorClick} class="slds-m-left_x-small"></lightning-button>
    </p>
    <p>
        <!-- Rxjs interval Subscribe -->
        <lightning-button label="Rxjs interval Subscribe" title="Rxjs" onclick={handleRxjsSubClick} class="slds-m-left_x-small"></lightning-button>
    </p>
    <p>
        <!-- Rxjs interval unSubscribe -->
        <lightning-button label="Rxjs interval unSubscribe" title="Rxjs" onclick={handleRxjsUnSubClick} class="slds-m-left_x-small"></lightning-button>
    </p>
    <p>
        <!-- Rxjs ajax -->
        <lightning-button label="Rxjs ajax" title="Rxjs" onclick={handleRxjsAjaxClick} class="slds-m-left_x-small"></lightning-button>
    </p>
</template>
```

## document

- https://github.com/ReactiveX/rxjs
- https://rxjs.dev/api
