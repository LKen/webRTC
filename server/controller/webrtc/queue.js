/**
 * 加入视频聊天的队列
 */
const chalk = require('chalk')
const moment = require('moment')

class Queue extends Array {
  // constructor(args) {
  //   super(args)
  // }

  static get [Symbol.species]() { return Array }

  /**
   * 通过socket 删除队列中的元素
   * @param {socket.io} socket
   * @return {WebrtcUer} 用户
   */
  deleteBySocket(socket) {
    if (typeof socket === 'undefined') {
      throw new SyntaxError('(Queue deleteBySocket) Arguments Error: missing first param <socket>')
    }

    const self = this
    const id = socket.id
    let del = null
    self.some((item, index) => {
      if (item.socket.id === id) {
        del = self.splice(index, 1)[0]
        return true
      }
      return false
    })

    const ms = new Date() - new Date(del.time)
    console.log(
      chalk.cyan(`Delete  "${del.username}"  from Queue for ${ms}ms`)
    )

    return del
  }

  findByUuid(uuid) {
    if (typeof uuid === 'undefined') {
      throw new SyntaxError('(Queue findByUuid) Arguments Error: missing first param <uuid>')
    }

    const self = this
    const find = self.filter(item => {
      if (item.uuid === uuid) {
        return true
      }
      return false
    })

    return find[0]
  }

  findBySocket(socket) {
    if (typeof socket === 'undefined') {
      throw new SyntaxError('(Queue findBySocket) Arguments Error: missing first param <socket>')
    }

    const id = socket.id
    const self = this
    const find = self.filter(item => {
      if (item.socket.id === id) {
        return true
      }
      return false
    })

    return find[0]
  }

  findByName(name) {
    if (typeof name === 'undefined') {
      throw new SyntaxError('(Queue findByName) Arguments Error: missing first param <name>')
    }

    const self = this
    const find = self.filter(item => {
      if (item.username === name) {
        return true
      }
      return false
    })

    return find[0]
  }

  checckUniqueByName(name) {
    if (typeof name === 'undefined') {
      throw new SyntaxError('(Queue checckUniqueByName) Arguments Error: missing first param <name>')
    }
    const self = this
    return !self.some(item => {
      if (item.username === name) {
        return true
      }
      return false
    })
  }

  checckUniqueByUuid(uuid) {
    if (typeof uuid === 'undefined') {
      throw new SyntaxError('(Queue checckUniqueByUuid) Arguments Error: missing first param <uuid>')
    }
    const self = this
    return !self.some(item => {
      if (item.uuid === uuid) {
        return true
      }
      return false
    })
  }

  toString() {
    const self = this
    return self.map(item => {
      const { username: label, uuid: value } = item
      return { label, value }
    })
  }
}

Queue.prototype.push = function(args) {
  if (args instanceof Object) {
    const { uuid, username, time } = args
    if (this.checckUniqueByUuid(uuid)) {
      Array.prototype.push.call(this, args)
      console.log(
        chalk.cyan(`Welcome  "${username}"  join in the webrtc, at ${moment(time).format('YYYY-MM-DD hH:mm:ss a')}`)
      )
    } else {
      throw new Error('(Queue) UUID Error: 用户名重复')
    }
  } else {
    throw new TypeError('(Room) push：类型错误')
  }
}

module.exports = Queue
