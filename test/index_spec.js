import { replayLastValue, shared, listen, withMutations, filterSet, latestValue } from './../lib/index'
import { Subject } from 'rxjs/Subject'
import { _do } from 'rxjs/operator/do'

function collect(observer, store) {
  store.length = 0
  const unsub = observer.subscribe(x => store.push(x))
  return () => unsub.unsubscribe()
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

    expect(sideEffects).to.deep.equal([ 'a', '1-a', '2-a', 'b', '1-b', '2-b'])
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

  it('listen to react component', () => {
    const sub = new Subject()

    const result = []
    const comp = { setState: x => result.push(x) }
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

    expect(source::latestValue()).to.deep.equal({ result: undefined, receivedValue: false })

    sub.next(87)

    expect(source::latestValue()).to.deep.equal({ result: 87, receivedValue: true })
  })

})
