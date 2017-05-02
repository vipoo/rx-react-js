import {Observable} from 'rxjs/Observable'
import {Subject} from 'rxjs/Subject'

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

