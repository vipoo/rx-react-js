# rx-react-js

Library to facilitate use of rxjs(5) streams into a react component

This library contains a set of functions, to facilitate connecting RxJS(https://github.com/ReactiveX/rxjs) streams to react components

NB: At the moment, this project is very much a work in progress

Some of the operators within this library may be duplicates of
official operators within the rxjs library


## Installation

Install from github repo

```shell
npm install rxjs
npm install https://github.com/vipoo/rx-react-js.git
```

## Usage

Some of the examples below, use the draft bind operator https://github.com/tc39/proposal-bind-operator

### Create Subject/Observer stores

```javascript
import { Subject } from 'rxjs/Subject'
import { shared, replayLastValue, transform } from 'general/rx_operators'

export const MySubject = new Subject()
export const MyObserver = MySubject::shared()::replayLastValue()
```

You can add any operators (including your own custom operators) to the
streams.

For example, if you want an observer that only emits a sub-set of
data from the main stream:

```javascript
import { Subject } from 'rxjs/Subject'
import { shared, replayLastValue, transform } from 'general/rx_operators'

export const MySubject = new Subject()
export const MyMainObserver = MySubject::shared()::replayLastValue()

export const MySubObserver = MySubject.map(d => d.subData)::shared()::replayLastValue()
```

### Subscribing to data in components

In your react components, you can subscribe to your observer of interest,
in the `componentWillMount` method:

```javascript
  componentWillMount() {
    this.unsubscribe = MyObserver::listen(this)
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  render() {
    // this.state will have a copy of the streams data
  }
```

### Injecting data into streams, to eventually update components

```javascript
  MySubject.next({some: 'value'})
```

### Syncing data to backend

There are a few options of how data may be synced to the back end.  One option
is to use websockets, that as data is received is forwarded to the appropriate streams

Another options, is to use simple ajax functions, to post and receive data: eg:

```javascript

  fetch(url, { method: 'post', body: this.state })
    .then(response => response.json())
    .then(json => MySubject.next(json))

```
