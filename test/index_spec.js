import { replayLastValue, shared, listen } from './../lib/index'
import { Subject } from 'rxjs/Subject'

import 'rxjs/add/operator/do'

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

    const obs = sub.do(x => sideEffects.push(x))::shared()

    const sub1 = obs::listen(x => sideEffects.push('1-' + x))
    const sub2 = obs::listen(x => sideEffects.push('2-' + x))

    sub.next('a')
    sub.next('b')

    sub1()
    sub2()

    expect(sideEffects).to.deep.equal([ 'a', '1-a', '2-a', 'b', '1-b', '2-b'])
  })

})
