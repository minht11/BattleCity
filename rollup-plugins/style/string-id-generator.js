// https://stackoverflow.com/questions/12504042/what-is-a-method-that-can-be-used-to-increment-letters/34483399
export default class StringIdGenerator {
  constructor(chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_') {
    this._chars = chars
    this._nextId = [0]
  }

  next() {
    const r = []
    for (const char of this._nextId) {
      r.unshift(this._chars[char])
    }
    this._increment()
    return r.join('')
  }

  _increment() {
    for (let i = 0; i < this._nextId.length; i++) {
      const val = ++this._nextId[i]
      if (val >= this._chars.length) {
        this._nextId[i] = 0
      } else {
        return
      }
    }
    this._nextId.push(0)
  }

  *[Symbol.iterator]() {
    while (true) {
      yield this.next()
    }
  }
}
