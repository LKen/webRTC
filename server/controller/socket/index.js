/**
 * webrtc 视频聊天室
 */
const IO = require('socket.io')
const WebrtcUer = require('../webrtc/user')
const Queue = require('../webrtc/queue')
const chalk = require('chalk')

const queueInstance = new Queue()

const eventType = {
  offer: Symbol('offer'), // 代理转发
  answer: Symbol('answer'), // 代理转发
  candidate: Symbol('candidate'), // 代理转发
  call: Symbol('call'), // 代理转发
  accept: Symbol('accept'), // 代理转发
  reject: Symbol('reject'), // 代理转发
  leave: Symbol('leave') // 代理转发
}

function handleMessage(type, data) {
  switch (type) {
    case eventType.offer:
      console.log(data)
      break
    case eventType.answer:
      console.log(data)
      break
    case eventType.candidate:
      console.log(data)
      break
    case eventType.call:
      console.log(data)
      break
    case eventType.accept:
      console.log(data)
      break
    case eventType.reject:
      console.log(data)
      break
    case eventType.leave:
      console.log(data)
      break
  }
}

module.exports = function(server) {
  const io = IO(server, {
    serveClient: false,
    // below are engine.IO options
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
  })

  io
    .use((socket, next) => {
      const { name } = socket.handshake.query
      if (name) {
        try {
          if (!queueInstance.checckUnique(name)) {
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
      const { name } = socket.handshake.query
      try {
        queueInstance.push(new WebrtcUer(name, socket))
      } catch (err) {
        throw new Error(err)
      }
      // If you just want the WebSocket semantics, you can do that too. Simply leverage send and listen on the message event
      this.send({ event: 'update', message: queueInstance.toString() })

      socket
        .on('message', (data) => {
          const { event, message } = data
          handleMessage(eventType[event], message)
        })
        .on('disconnect', (reason) => {
          const { name } = socket.handshake.query
          try {
            const del = queueInstance.deleteByname(name)
            const ms = new Date() - new Date(del.time)
            console.log(
              chalk(`Delete ${del.username} from Queue for ${ms}ms`)
            )
          } catch (err) {
            console.log(err)
          }
        })
        .on('error', (error) => {
          console.log(error)
        })
    })
    .on('disconnect', (socket) => {
    })
}

