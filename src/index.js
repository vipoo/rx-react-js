import {Observable} from 'rxjs/Observable'
import {Subject} from 'rxjs/Subject'
import {multicast} from 'rxjs/operator/multicast'
import {first} from 'rxjs/operator/first'
import {toPromise} from 'rxjs/operator/toPromise'

function nullFunction() {
}

export function replayLastValue(autoSubscription = true) {
  let captured = undefined

  const observable = Observable.create(observer => {
    if(captured !== undefined)
      observer.next(captured)

    return this.subscribe({
      next: v => {
        captured = v
        observer.next(v)
      },
      error: err => observer.error(err),
      complete: () => observer.complete()
    })
  })

  if(autoSubscription)
    observable.subscribe({next: nullFunction})

  return observable
}

export function shared() {
  const singleSubject = new Subject()

  return this::multicast(singleSubject).refCount()
}

export function listen(fn, optional = {}) {
  const next = fn.setState ? s => fn.setState(Object.assign({}, s)) : fn
  const subscription = this.subscribe({...optional, next})
  return () => subscription.unsubscribe()
}

export function withMutations() {
  return Observable.create(observer => {
    let captured = undefined

    return this.subscribe({
      next: v => {
        if(captured && typeof(v) === 'function') {
          v(captured)
          observer.next(captured)
          return
        }

        captured = v
        observer.next(v)
      },
      error: err => observer.error(err),
      complete: () => observer.complete()
    })
  })
}

export function filterSet(fn) {
  return Observable.create(observer => {
    let captured = undefined

    return this.subscribe({
      next: v => {
        if(!captured) {
          captured = v
          observer.next(v)
          return
        }

        if(fn(captured, v)) {
          captured = v
          observer.next(v)
        }
      },
      error: err => observer.error(err),
      complete: () => observer.complete()
    })
  })
}

export function latestValue() {
  let result = undefined
  let receivedValue = false
  const subscription = this::first().subscribe({next: s => {
    receivedValue = true
    result = s
  }})
  subscription.unsubscribe()
  return {result, receivedValue}
}

import root from 'rxjs/util/root'

function buildResolvedPromise(v = null) {
  if(root.Rx && root.Rx.config && root.Rx.config.Promise)
    return root.Rx.config.Promise.resolve(v)

  return Promise.resolve(v)
}

export function reloadInto(subject, fn) {
  const {result, receivedValue} = this::latestValue()
  if(receivedValue) {
    subject.next(fn(result))
    return buildResolvedPromise()
  }

  return this::first()::toPromise().then(s => subject.next(fn(s)))
}

export function immediateThrottlePromise(fnPromise, period, keyFn = () => false) {
  return Observable.create(observer => {
    let captured = undefined
    let subscribed = true
    let waitingForPromise = false
    let timer = null
    let requestAgainAfterPeriod = false
    let lastKey = false

    function delayEmit(emitKey) {
      if(!subscribed)
        return
      timer = setTimeout(() => {
        if(requestAgainAfterPeriod)
          emit(emitKey)
        requestAgainAfterPeriod = false
        clearTimeout(timer)
        timer = null
      }, period)
    }

    function emit(emitKey) {
      if(!subscribed)
        return
      waitingForPromise = true
      fnPromise(captured)
        .then(data => subscribed && emitKey == lastKey ? observer.next(data) : null)
        .catch(err => {
          clearTimeout(timer)
          timer = null
          if(subscribed)
            observer.error(err)
        })
        .tap(() => emitKey == lastKey ? delayEmit(emitKey) : null)
        .finally(() => {
          if(emitKey == lastKey)
            waitingForPromise = false
        })
    }

    const x = this.subscribe({
      next: v => {
        captured = v
        const newLastKey = keyFn(v)

        if(newLastKey !== lastKey) {
          clearTimeout(timer)
          lastKey = newLastKey
          waitingForPromise = false
          emit(lastKey)
          return
        }

        if(!waitingForPromise && !timer) {
          emit(lastKey)
          return
        }

        if(waitingForPromise || timer) {
          requestAgainAfterPeriod = true
          return
        }
      },
      error: err => {
        clearTimeout(timer)
        return observer.error(err)
      },
      complete: () => {
        clearTimeout(timer)
        return observer.complete()
      }
    })

    const unsubscribe = x.unsubscribe
    x.unsubscribe = function() {
      clearTimeout(timer)
      subscribed = false
      return unsubscribe.call(x)
    }

    return x
  })
}

export function memoriseLastValue(autoSubscription = true) {
  return this::shared()::replayLastValue(autoSubscription)
}
