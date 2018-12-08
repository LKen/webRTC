/**
 * webrtc 视频聊天室
 */
const IO = require('socket.io')
const WebrtcUer = require('../webrtc/user')
const Queue = require('../webrtc/queue')
const Room = require('../webrtc/room')

const queueInstance = new Queue()
const roomInstance = new Room()

// 通话错误状态码
const RTCTYPE_5001 = 5001 // 用户正在通话
const RTCTYPE_5002 = 5002 // 对方已挂断
const RTCTYPE_5003 = 5003 // 对方不存在

const eventType = {
  offer: Symbol('offer'), // 代理转发
  answer: Symbol('answer'), // 代理转发
  candidate: Symbol('candidate'), // 代理转发
  call: Symbol('call'), // 代理转发
  accept: Symbol('accept'), // 代理转发
  reject: Symbol('reject'), // 代理转发
  leave: Symbol('leave') // 代理转发
}

function handleMessage(type, data, socket) {
  if (typeof data === 'undefined') {
    throw new SyntaxError('(handleMessage) Arguments Error: missing second param')
  }
  switch (type) {
    case eventType.offer:
      handleOffer.bind(this, socket)(data)
      break
    case eventType.answer:
      handleAnswer.bind(this, socket)(data)
      break
    case eventType.candidate:
      handleCandidate.bind(this, socket)(data)
      break
    case eventType.call:
      handleCall.bind(this, socket)(data)
      break
    case eventType.accept:
      handleAccept.bind(this, socket)(data)
      break
    case eventType.reject:
      handleReject.bind(this, socket)(data)
      break
    case eventType.leave:
      handleLeave.bind(this, socket)(data)
      break
  }
}

function handleUpdate() {
  // If you just want the WebSocket semantics, you can do that too. Simply leverage send and listen on the message event
  this.send({ event: 'update', message: queueInstance.toString() })
}

function handleOffer() {

}

function handleAnswer() {

}

function handleCandidate() {

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
    connectedUser.socket.send({ event: 'call', message: customUser._uuid })
  } catch (err) {
    socket.send({ event: 'reject', message: RTCTYPE_5003 })
  }

  try {
    customUser.calling = true // 在通话状态
    roomInstance.push(customUser) // 加入通话房间
  } catch (err) {
    socket.send({ event: 'reject', message: RTCTYPE_5001 })
  }
}

function handleAccept(socket, uuid) {
  const connectedUser = queueInstance.findByUuid(uuid)
  const customUser = queueInstance.findBySocket(socket)
  if (connectedUser.calling) {
    connectedUser.socket.send({ event: 'accept', message: customUser._uuid })

    roomInstance.push(customUser) // 加入通话房间

    // 在各自信息中缓存对方的信息
    customUser.setConnectedUser(connectedUser)
    connectedUser.setConnectedUser(customUser)
  } else {
    socket.send({ event: 'reject', message: RTCTYPE_5002 })
  }
}

function handleReject() {

}

function handleLeave() {

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
          const _data = JSON.parse(data)
          const { event, message } = _data
          try {
            handleMessage(eventType[event], message, socket)
          } catch (err) {
            console.log(err)
          }
        })
        .on('disconnect', (reason) => {
          try {
            const del = queueInstance.deleteBySocket(socket)

            if (del.calling) {
              roomInstance.deleteBySocket(socket)

              const { connectedUser } = del
              // 判断是否有对方信息
              if (connectedUser) {
                const otherSocket = connectedUser.socket
                roomInstance.deleteBySocket(otherSocket)
                // 如果正在通话中，告诉对方已经离开
                otherSocket.send({ event: 'leave', message: reason })
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

