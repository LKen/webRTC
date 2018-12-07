<template>
  <div class="app-container">
    123123
  </div>
</template>

<script>
import io from 'socket.io-client'

export default {
  name: '',
  data() {
    return {}
  },
  created() {
    const url = 'http://localhost:2100/chat'
    this.socket = io.connect(url, {
      timeout: 5000,
      query: {
        name: '1212333'
      }
    })
    this.socket.on('message', (data) => {
      console.log(data)
    })

    // 回调事件监听
    this.socket.on('connect', () => {
      this.$notify({
        title: 'Socket.io',
        message: 'IO连接成功',
        type: 'success',
        duration: 1500
      })
    })
    this.socket.on('connect_error', () => {
      this.$notify({
        title: 'Socket.io',
        message: 'IO连接错误',
        type: 'error',
        duration: 1500
      })
    })
    this.socket.on('connect_timeout', (err) => {
      console.log(err)
    })
    this.socket.on('error', (err) => {
      console.log(err)
      this.$notify({
        title: 'Socket.io',
        message: err,
        type: 'error',
        duration: 1500
      })
    })

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        console.log(12)
        // the disconnection was initiated by the server, you need to reconnect manually
        this.socket.connect()
      }
      // else the socket will automatically try to reconnect
    })
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
</style>
