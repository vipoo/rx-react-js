import {Observable} from 'rxjs/Observable'
import {Subject} from 'rxjs/Subject'
import 'rxjs/add/operator/multicast'

function nullFunction() {
}

export function replayLastValue() {
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

  observable.subscribe({next: nullFunction})

  return observable
}

export function shared() {
  const singleSubject = new Subject()

  return this.multicast(singleSubject).refCount()
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
