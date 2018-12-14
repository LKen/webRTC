/**
 * webrtc 视频聊天室
 */
const IO = require('socket.io')
const WebrtcUer = require('../webrtc/user')
const Queue = require('../webrtc/queue')

const queueInstance = new Queue()

// 通话错误状态码

/* eslint-disable no-unused-vars */
const REJECT_TYPE = {
  '5001': '对方正在通话',
  '5002': '对方已挂断',
  '5003': '对方不存在',
  '5004': '正在拨打中，请勿重复拨打',
  '5005': '当前用户不在通话中，错误请求',
  '5006': '对方拒绝通话',
  '5007': '对方正忙，请稍后在拨'
}

const ERROR_TYPE = {
  '5101': '参数格式无效（json）',
  '5102': '缺少uuid',
  '5103': '无效事件'
}

function handleError(socket, type) {
  socket.send({ event: 'error', message: ERROR_TYPE[type] })
}

const eventType = {
  offer: Symbol('offer'), // 代理转发
  answer: Symbol('answer'), // 代理转发
  candidate: Symbol('candidate'), // 代理转发
  call: Symbol('call'), // 代理转发
  accept: Symbol('accept'), // 代理转发
  reject: Symbol('reject'), // 代理转发
  hangup: Symbol('hangup') // 代理转发
}

function handleMessage(data, socket) {
  const { event, message, success } = data
  switch (eventType[event]) {
    case eventType.offer:
      handleOffer.bind(this, socket)(message)
      break
    case eventType.answer:
      handleAnswer.bind(this, socket)(message)
      break
    case eventType.candidate:
      handleCandidate.bind(this, socket)(message)
      break
    case eventType.call:
      if (typeof message === 'undefined') {
        handleError(socket, '5102')
        throw new SyntaxError('(handleMessage) Arguments Error: missing second param')
      }
      handleCall.bind(this, socket)(message)
      break
    case eventType.accept:
      if (typeof message === 'undefined') {
        handleError(socket, '5102')
        throw new SyntaxError('(handleMessage) Arguments Error: missing second param')
      }
      handleAccept.bind(this, socket)(message, success)
      break
    case eventType.hangup:
      handleHangup.bind(this, socket)(message)
      break
    default:
      handleError(socket, 5103)
  }
}

function handleUpdate() {
  // If you just want the WebSocket semantics, you can do that too. Simply leverage send and listen on the message event
  this.send({ event: 'update', message: queueInstance.toString() })
  return true
}

function handleOffer(socket, message) {
  const customUser = queueInstance.findBySocket(socket)
  const connectedUser = customUser.getConnectedUser()
  try {
    const otherSocket = connectedUser.socket
    otherSocket.send({ event: 'offer', message })
    return true
  } catch (err) {
    console.log('(SocketEvent) Offer: 对方不存在')
    console.log(err)
    return false
  }
}

function handleAnswer(socket, message) {
  const customUser = queueInstance.findBySocket(socket)
  const connectedUser = customUser.getConnectedUser()
  try {
    const otherSocket = connectedUser.socket
    otherSocket.send({ event: 'answer', message })
    return true
  } catch (err) {
    console.log('(SocketEvent) Answer: 对方不存在')
    console.log(err)
    return false
  }
}

function handleCandidate(socket, message) {
  const customUser = queueInstance.findBySocket(socket)
  const connectedUser = customUser.getConnectedUser()
  try {
    const otherSocket = connectedUser.socket
    otherSocket.send({ event: 'candidate', message })
    return true
  } catch (err) {
    console.log('(SocketEvent) Candidate: 对方不存在')
    console.log(err)
    return false
  }
}
/**
 * 判断是否在通话当中
 * setTimeout ping 60s, 否则抛出错误
 * @param {*} socket
 * @param {*} uuid
 */
function handleCall(socket, uuid) {
  const connectedUser = queueInstance.findByUuid(uuid)
  const customUser = queueInstance.findBySocket(socket)
  try {
    if (customUser.calling) {
      throw new Error(5004)
    }
    if (!connectedUser) {
      throw new Error(5003)
    }
    if (connectedUser.calling) {
      throw new Error(5001)
    }
    customUser.calling = true // 更改状态
    customUser.setConnectedUser(connectedUser)
    connectedUser.socket.send({ event: 'call', message: customUser.uuid })
    console.log(`User "${customUser.username}" is calling...`)

    // 设置超时判断
    customUser.setWaiting(true)

    return true
  } catch (err) {
    console.log(`webrtc reject code: ${+err.message}`)
    socket.send({ event: 'reject', message: +err.message })
    return false
  }
}

function handleAccept(socket, uuid, success) {
  try {
    const customUser = queueInstance.findBySocket(socket)
    const connectedUser = queueInstance.findByUuid(uuid)
    connectedUser.setWaiting(false)
    if (success) {
      // 判断对方是否还在socket队列中
      // 对方下线了
      if (!connectedUser) {
        throw new Error(5002)
      }
      // 对面挂断了 或者 60s 后自动挂断了
      if (!connectedUser.calling) {
        throw new Error(5002)
      }

      customUser.calling = true // 更改状态
      connectedUser.socket.send({ event: 'accept', message: customUser.uuid, success: true })
      console.log(`User "${customUser.username}" had accepted...`)
      // 在各自信息中缓存对方的信息
      customUser.setConnectedUser(connectedUser)
    } else {
      if (connectedUser && connectedUser.calling) {
        connectedUser.recover()
        connectedUser.socket.send({ event: 'reject', message: 5006 })
        console.log(`User "${customUser.username}" had turned down ${connectedUser.username}'s call...`)
      }
    }
    return true
  } catch (err) {
    const message = +err.message
    socket.send({ event: 'reject', message })
    return false
  }
}

function handleHangup(socket) {
  const customUser = queueInstance.findBySocket(socket)
  try {
    if (!customUser.calling) {
      return true
    }
    console.log(`User ${customUser.username} had stopped Chatting`)
    const connectedUser = customUser.getConnectedUser()
    if (connectedUser) {
      if (connectedUser.calling) {
        // 双方通话中
        connectedUser.recover()
        connectedUser.socket.send({ event: 'hangup' })
        console.log(`User ${connectedUser.username} had stopped Chatting together`)
      }
    }
    customUser.recover()
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

module.exports = function(server) {
  const io = IO(server, {
    serveClient: false,
    // below are engine.IO options
    pingInterval: 10000,
    pingTimeout: 10000,
    cookie: false
  })

  io
    .use((socket, next) => {
      const { name } = socket.handshake.query
      if (name) {
        try {
          if (!queueInstance.checckUniqueByName(name)) {
            throw new Error('用户名重复')
          }
        } catch (err) {
          console.log(err)
          return next(new SyntaxError(err.message))
        }
        return next()
      }
      // throw new Error('authentication error')
      return next(new SyntaxError('用户名称不可缺少'))
    })

  io
    .of('/chat')
    .on('connection', function(socket) {
      const self = this
      const { name } = socket.handshake.query
      try {
        queueInstance.push(new WebrtcUer(name, socket))
      } catch (err) {
        throw new Error(err)
      }

      handleUpdate.bind(self)()

      socket
        .on('message', (data) => {
          let _data = null
          try {
            _data = JSON.parse(data)
          } catch (err) {
            socket.send({ event: 'error', message: ERROR_TYPE['5101'] })
            console.log(err)
          }

          _data && handleMessage(_data, socket)
        })
        .on('disconnect', (reason) => {
          try {
            const del = queueInstance.deleteBySocket(socket)

            if (del.calling) {
              const connectedUser = del.getConnectedUser()
              // 判断是否有对方信息
              if (connectedUser) {
                // 如果正在通话中，告诉对方已经离开
                const otherSocket = connectedUser.socket
                connectedUser.recover()
                otherSocket.send({ event: 'hangup', message: reason })
              }
            }

            handleUpdate.bind(self)()
          } catch (err) {
            console.log(err)
          }
        })
        .on('error', (error) => {
          console.log(error)
        })
    })
}

