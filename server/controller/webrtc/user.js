/**
 * 用户信息 Class
 */

function uuid(len, radix) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
  const uuid = []
  let i
  radix = radix || chars.length
  if (len) {
    // Compact form
    for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix]
  } else {
    // rfc4122, version 4 form
    let r

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
    uuid[14] = '4'

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | Math.random() * 16
        uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r]
      }
    }
  }

  return uuid.join('')
}

const connectedUser = Symbol('other')

class WebrtcUer {
  constructor(username, socket) {
    if (typeof username === 'undefined') {
      throw new SyntaxError('(WebrtcUer) Arguments Error: missing first param <name>')
    }
    if (typeof socket === 'undefined') {
      throw new SyntaxError('(WebrtcUer) Arguments Error: missing second param <socket>')
    }
    this.username = username
    this.time = Date.now() // 加入的时间
    this.calling = false // 是否在忙线
    this.socket = socket
    this._uuid = uuid()
  }

  setConnectedUser(user) {
    this[connectedUser] = user
    return true
  }

  getConnectedUser() {
    return this[connectedUser]
  }

  toString() {
    return this.username
  }
}

module.exports = WebrtcUer