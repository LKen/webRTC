/**
 * 正在通话的房间， 引入多人通话概念
 */
const chalk = require('chalk')

class Room extends Array {
  static get [Symbol.species]() { return Array }

  /**
   * 通过socket 删除队列中的元素
   * @param {socket.io} socket
   * @return {WebrtcUer} 用户
   */
  deleteBySocket(socket) {
    if (typeof socket === 'undefined') {
      throw new SyntaxError('(Room deleteBySocket) Arguments Error: missing first param <socket>')
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
      chalk.cyan(`"${del.username}" quited from Room for ${ms}ms`)
    )

    return del
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
}

Room.prototype.push = function(args) {
  if (args instanceof Object) {
    const { uuid, username, time } = args
    if (this.checckUniqueByUuid(uuid)) {
      Array.prototype.push.call(this, args)
      const ms = new Date() - new Date(time)
      console.log(
        chalk.cyan(`"${username}" is on the line, at ${ms}ms`)
      )
    } else {
      throw new Error('(Room) UUID Error: 用户名重复')
    }
  } else {
    throw new TypeError('(Room) push：类型错误')
  }
}

module.exports = Room
