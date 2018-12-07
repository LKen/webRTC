/**
 * 用户信息 Class
 */

class WebrtcUer {
  constructor(username, socket) {
    if (typeof username === 'undefined') {
      throw new SyntaxError('Authentication error: arguments missing first param <name>')
    }
    if (typeof socket === 'undefined') {
      throw new SyntaxError('Authentication error: arguments missing second param <socket>')
    }
    this.username = username
    this.time = Date.now() // 加入的时间
    this.calling = false // 是否在忙线
    this.scoket = socket
  }

  setConnectedUser(name) {
    this.connectedUser = name
  }

  toString() {
    return this.username
  }
}

module.exports = WebrtcUer
