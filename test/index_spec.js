import {replayLastValue, shared, listen,
         withMutations, filterSet, latestValue, reloadInto,
         immediateThrottlePromise} from './../lib/index'
import {Subject} from 'rxjs/Subject'
import {_do} from 'rxjs/operator/do'
import when from 'when'

function collect(observer, store) {
  store.length = 0
  const unsub = observer.subscribe(x => store.push(x))
  return () => unsub.unsubscribe()
}

function collectPromise(observer, expectedLastValue, store = []) {
  return new Promise((res) => {
    const unsub = observer.subscribe(x => {
      store.push(x)
      if(x === expectedLastValue) {
        unsub.unsubscribe()
        res(store)
      }
    })
  })
}

describe('rx_operators', () => {
  it('replayLastValue', () => {
    const sub = new Subject()
    const souceReplayed = sub::replayLastValue()

    const result = []
    collect(souceReplayed, result)()
    expect(result).to.deep.equal([])

    sub.next(2)
    sub.next(3)

    collect(souceReplayed, result)()

    expect(result).to.deep.equal([3])
  })

  it('shared', () => {
    const sub = new Subject()

    const sideEffects = []

    const obs = sub::_do(x => sideEffects.push(x))::shared()

    const sub1 = obs::listen(x => sideEffects.push('1-' + x))
    const sub2 = obs::listen(x => sideEffects.push('2-' + x))

    sub.next('a')
    sub.next('b')

    sub1()
    sub2()

    expect(sideEffects).to.deep.equal(['a', '1-a', '2-a', 'b', '1-b', '2-b'])
  })

  it('listen to subscribing function', () => {
    const sub = new Subject()

    const result = []
    const unsub = sub::listen(x => result.push(x))
    sub.next(1)
    sub.next(2)
    unsub()

    expect(result).to.deep.equal([1, 2])
  })

  it('listen handles errors', () => {
    const sub = new Subject()

    const result = []
    const errorResult = []
    const unsub = sub::listen(x => result.push(x), {error: x => errorResult.push(x)})
    sub.error('Something wrong')
    unsub()

    expect(result).to.deep.equal([])
    expect(errorResult).to.deep.equal(['Something wrong'])
  })

  it('listen to react component', () => {
    const sub = new Subject()

    const result = []
    const comp = {setState: x => result.push(x)}
    const unsub = sub::listen(comp)
    sub.next({a: 1})
    sub.next({a: 2})
    unsub()

    expect(result).to.deep.equal([{a: 1}, {a: 2}])
  })

  it('withMutations', () => {
    const sub = new Subject()
    const souceReplayed = sub::withMutations()

    const result = []
    const unsub = souceReplayed.subscribe(x => result.push({...x}))
    sub.next({a: 1})
    sub.next(x => x.b = 2)
    unsub.unsubscribe()

    expect(result).to.deep.equal([{a: 1}, {a: 1, b: 2}])
  })

  it('filterSet', () => {
    const sub = new Subject()
    const souceReplayed = sub::filterSet((a, b) => (a+1) === b)

    const result = []
    const unsub = collect(souceReplayed, result)
    sub.next(1)
    sub.next(2)
    sub.next(4)
    sub.next(3)
    unsub()

    expect(result).to.deep.equal([1, 2, 3])
  })

  it('latestValue', () => {
    const sub = new Subject()
    const source = sub::replayLastValue()

    expect(source::latestValue()).to.deep.equal({result: undefined, receivedValue: false})

    sub.next(87)

    expect(source::latestValue()).to.deep.equal({result: 87, receivedValue: true})
  })

  it('reloadInto', () => {
    const sourceSubject = new Subject()
    const sourceObserver = sourceSubject

    const destinationSubject = new Subject()
    const destinationObserver = destinationSubject

    const result = []

    const destinationSubscription = destinationObserver::listen(x => result.push(x))

    const test = sourceObserver
      ::reloadInto(destinationSubject, x => x * 10)
      .then(() => expect(result).to.deep.equal([20]))
      .then(() => destinationSubscription())

    sourceSubject.next(2)

    return test
  })

  describe('immediateThrottlePromise', () => {
    it('passes result of resolved promise', () => {
      const p = when(12)
      const sub = new Subject()
      const souceReplayed = sub::immediateThrottlePromise(() => p, 500)
      const resultPromise = collectPromise(souceReplayed, 12)
      sub.next(1)

      return expect(resultPromise).to.eventually.deep.equal([12])
    })

    it('throttles 2nd emitted data', () => {
      const p = x => when(x)
      const sub = new Subject()
      const souceReplayed = sub::immediateThrottlePromise(x => p(x * 10), 300)

      const result = []
      const unsub = collect(souceReplayed, result)
      sub.next(1)
      sub.next(1)

      return when(null)
        .delay(80)
        .then(() => expect(result).to.deep.equal([10]))
        .finally(() => unsub())
    })

    it('after period, emit throttled value', () => {
      const p = x => when(x * 10)
      const sub = new Subject()
      const souceReplayed = sub::immediateThrottlePromise(x => p(x), 20)

      const resultPromise = collectPromise(souceReplayed, 20)
      sub.next(1)
      sub.next(2)

      return expect(resultPromise).to.eventually.deep.equal([10, 20])
    })

    it('throttle period is from point when promise is resolved', () => {
      const sub = new Subject()
      const promisePeriod = 40
      const delayPeriod = 10
      const result = []
      const p = x => {
        result.push('promiseStart-' + x)
        return when('promiseResolved-' + x).delay(promisePeriod)
      }

      const souceReplayed = sub::immediateThrottlePromise(x => p(x), delayPeriod)
      const resultPromise = collectPromise(souceReplayed, 'promiseResolved-2', result)
      sub.next(1)
      sub.next(2)

      return expect(resultPromise).to.eventually.deep.equal([
        'promiseStart-1', 'promiseResolved-1',
        'promiseStart-2', 'promiseResolved-2'])
    })
  })
})
