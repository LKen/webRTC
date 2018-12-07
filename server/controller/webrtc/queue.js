/**
 * 加入视频聊天的队列
 */

class Queue extends Array {
  // constructor(args) {
  //   super(args)
  // }

  static get [Symbol.species]() { return Array }

  deleteByname(name) {
    if (typeof name === 'undefined') {
      throw new SyntaxError('Queue error: deleteByname arguments missing first param <name>')
    }

    const self = this
    let del = null
    self.some((item, index) => {
      if (item.username === name) {
        del = self.splice(index, 1)
        return true
      }
      return false
    })

    return del[0]
  }

  findByName(name) {
    if (typeof name === 'undefined') {
      throw new SyntaxError('Queue error: findByName arguments missing first param <name>')
    }

    const self = this
    const find = self.filter((item, index) => {
      if (item.username === name) {
        return true
      }
      return false
    })

    return find[0]
  }

  checckUnique(name) {
    if (typeof name === 'undefined') {
      throw new SyntaxError('Queue error: checckUnique arguments missing first param <name>')
    }
    const self = this
    return !self.some(item => {
      if (item.username === name) {
        return true
      }
      return false
    })
  }

  toString() {
    const self = this
    return self.map(item => {
      return item.username
    })
  }
}

Queue.prototype.push = function(args) {
  const { username: name } = args
  if (this.checckUnique(name)) {
    Array.prototype.push.call(this, args)
  } else {
    throw new Error('用户名重复')
  }
}

module.exports = Queue
