/**
 * webrtc 视频聊天室
 */
const IO = require('socket.io')

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
      console.log(socket.handshake.query)
      if (name) {
        return next()
      }
      socket.emit('message', { type: 'join', msg: '123' })
      // throw new Error('authentication error')
      return next(new Error('authentication error'))
    })

  io
    .of(('/chat'))
    .on('connect', (socket) => {
    })
    .on('disconnect', (socket) => {

    })
}

