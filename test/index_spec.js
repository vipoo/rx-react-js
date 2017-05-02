import { replayLastValue } from './../lib/index'
import { Subject } from 'rxjs/Subject'

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

})
