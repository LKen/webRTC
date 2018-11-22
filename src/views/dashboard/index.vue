<template>
  <div class="app-container">
    <div>
      <div class="container text-center" v-show="show">
          <div class="row">
              <div class="col-md-4 col-md-offset-4">
                  <form class="form" action="" @submit.prevent="submit()">
                      <h2>WebRTC Video Demo. Please Sign In</h2><br/>
                      <input class="form-control" type="text" placeholder="请输入您的昵称" required="" autofocus="" v-model="user_name"><br/>
                      <button class="btn btn-primary btn-block" type="submit">创建昵称</button>
                  </form>
              </div>
          </div>
      </div>
      <div class="container text-center" v-show="! show">
          <div class="row">
              <div class="col-md-3" style="height: 50%">
                  <ul class="list-group">
                      <li class="list-group-item">昵称: {{user_name}}</li>
                      <li class="list-group-item">当前在线人数: {{Object.getOwnPropertyNames(users).length - 1}}</li>
                      <li class="list-group-item">在线用户:
                          <div v-for="(user, index) in users" :key="index">
                              <br><span>{{index}}</span>
                              <span :class="[user ? 'green_color' : 'red_color']">{{user ? '(在线)' : '(正在通话)'}}</span>
                          </div>
                      </li>
                  </ul>
                  <div class="row text-center">
                      <div class="col-md-12">
                          <input class="form-control" type="text" v-model="call_username" placeholder="username to call"/>
                          <br>
                          <button class="btn-success btn" :disabled="!users[user_name]" @click="call">Call</button>
                          <button class="btn-danger btn" :disabled="users[user_name]" @click="hangUp">Hang Up</button>
                      </div>
                  </div>
              </div>
              <div class="col-md-9">
                  <video ref="localVideo" id="localVideo" :src="local_video"></video>
                  <video ref="remoteVideo" id="remoteVideo" :src="remote_video" autoplay></video>
              </div>
          </div>
      </div>
      <div class="preview" v-show="accept_video">
          <div class="preview-wrapper">
              <div class="preview-container">
                  <div class="preview-body">
                      <h4>您有视频邀请，是否接受?</h4>
                      <button class="btn-success btn" @click="accept">接受</button>
                      <button class="btn-danger btn" style="margin-right: 70px" @click="reject">拒绝</button>
                  </div>
                  <div class="confirm" @click="closePreview">×</div>
              </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client'

window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate
window.RTCSessionDescription =
  window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription

let localStream
var peerConn
var connectedUser = null
var configuration = {
  iceServers: [
    {
      url: 'turn:115.28.170.217:3478',
      credential: 'zmecust',
      username: 'zmecust'
    }
  ]
}
export default {
  name: 'Dashboard',
  data() {
    return {
      socket: null,
      user_name: '',
      show: true,
      users: '',
      call_username: '',
      local_video: '',
      remote_video: '',
      accept_video: false,
      local_srcObject: null
    }
  },
  created() {
    this.handleMediaDevicesPolyfill()
  },
  mounted() {
    this.socket = io.connect('http://localhost:8080')

    this.socket.on('message', (data) => {
      switch (data.event) {
        case 'show':
          this.users = data.allUsers
          break
        case 'join':
          this.handleLogin(data)
          break
        case 'call':
          this.handleCall(data)
          break
        case 'accept':
          this.handleAccept(data)
          break
        case 'offer':
          this.handleOffer(data)
          break
        case 'candidate':
          this.handleCandidate(data)
          break
        case 'msg':
          this.handleMsg(data)
          break
        case 'answer':
          this.handleAnswer(data)
          break
        case 'leave':
          this.handleLeave()
          break
        default:
          break
      }
      console.log(data)
    })

    this.socket.on('connect_error', (err) => {
      console.log(err)
    })
  },
  methods: {
    /**
     * 处理新老版本的差异
     */
    handleMediaDevicesPolyfill() {
      // 老的浏览器可能根本没有实现 mediaDevices，所以我们可以先设置一个空的对象
      if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {}
      }

      // 一些浏览器部分支持 mediaDevices。我们不能直接给对象设置 getUserMedia
      // 因为这样可能会覆盖已有的属性。这里我们只会在没有getUserMedia属性的时候添加它。
      if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = function(constraints) {
        // 首先，如果有getUserMedia的话，就获得它
          var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia

          // 一些浏览器根本没实现它 - 那么就返回一个error到promise的reject来保持一个统一的接口
          if (!getUserMedia) {
            return Promise.reject(new Error('getUserMedia is not implemented in this browser'))
          }

          // 否则，为老的navigator.getUserMedia方法包裹一个Promise
          return new Promise(function(resolve, reject) {
            getUserMedia.call(navigator, constraints, resolve, reject)
          })
        }
      }
    },
    /**
     * 获取硬件媒体设备的数据流
     */
    initCreate(videoDom) {
      const constraints = {
        audio: true,
        video: {
          width: 320,
          height: 240
        },
        // 帧率限制
        frameRate: { ideal: 10, max: 15 }
      }
      return navigator.mediaDevices.getUserMedia(constraints).then(this.handleMediaResolve.bind(this, videoDom)).catch(this.handleMediaReject)
    },
    /**
     * 获取数据流 - 成功回调
     */
    handleMediaResolve(videoDom, stream) {
      // 旧的浏览器可能没有srcObject
      if ('srcObject' in videoDom) {
        videoDom.srcObject = stream
      } else {
        // 防止再新的浏览器里使用它，应为它已经不再支持了
        videoDom.src = window.URL.createObjectURL(stream)
      }
      videoDom.onloadedmetadata = function(e) {
        videoDom.play()
      }
      return stream
    },
    /**
     * 获取数据流 - 失败回调
     */
    handleMediaReject(err) {
      const { name } = err
      switch (name) {
        case 'AbortError':
          alert('中止错误: 异常的硬件问题')
          break
        case 'NotAllowedError':
          alert('拒绝错误: 用户拒绝了当前会话的访问')
          break
        case 'NotFoundError':
          alert('找不到错误: 找不到满足请求参数的媒体类型')
          break
        case 'OverConstrainedError':
          alert('无法满足要求错误: 摄像头属性配置不一致')
          break
        case 'NotReadableError':
          alert('无法读取错误: 用户已经授权使用相应的设备，操作系统上某个硬件、浏览器或者网页层面发生的错误导致设备无法被访问')
          break
        case 'SecurityError':
          alert('安全错误: 使用设备媒体被禁止')
          break
        case 'TypeError':
          alert('类型错误: constraints对象未设置［空')
          break
      }
      console.log(err.name + ': ' + err.message)
    },

    submit() {
      if (this.user_name !== '') {
        this.send({
          event: 'join',
          name: this.user_name
        })
      }
    },
    send(message) {
      if (connectedUser != null) {
        message.connectedUser = connectedUser
      }
      this.socket.send(JSON.stringify(message))
    },
    handleLogin(data) {
      if (data.success === false) {
        alert('Ooops...please try a different username')
      } else {
        this.show = false
        this.users = data.allUsers
        this.$refs['localVideo'] && this.initCreate(this.$refs['localVideo'])
          .then((stream) => {
            localStream = stream
          })
      }
    },
    call() {
      if (this.call_username.length > 0) {
        if (this.users[this.call_username] === true) {
          connectedUser = this.call_username
          this.createConnection()
          this.send({
            event: 'call'
          })
        } else {
          alert('The current user is calling, try another')
        }
      } else {
        alert('Ooops...this username cannot be empty, please try again')
      }
    },
    createConnection() {
      peerConn = new RTCPeerConnection(configuration)
      peerConn.addStream(localStream)
      peerConn.onaddstream = e => {
        const vid = this.refs['remoteVideo']
        const mediaSource = e.stream
        try {
          vid.srcObject = mediaSource
          vid.muted = true
        } catch (err) {
          console.log(err)
          this.remote_video = window.URL.createObjectURL(mediaSource)
          vid.muted = true
        }
      }
      peerConn.onicecandidate = event => {
        setTimeout(() => {
          if (event.candidate) {
            this.send({
              event: 'candidate',
              candidate: event.candidate
            })
          }
        })
      }
    },
    handleCall(data) {
      this.accept_video = true
      connectedUser = data.name
    },
    reject() {
      this.send({
        event: 'accept',
        accept: false
      })
      this.accept_video = false
    },
    accept() {
      this.send({
        event: 'accept',
        accept: true
      })
      this.accept_video = false
    },
    handleAccept(data) {
      if (data.accept) {
        // create an offer
        peerConn.createOffer(
          offer => {
            this.send({
              event: 'offer',
              offer: offer
            })
            peerConn.setLocalDescription(offer)
          },
          error => {
            console.log(error)
            alert('Error when creating an offer')
          }
        )
      } else {
        alert('对方已拒绝')
      }
    },
    handleOffer(data) {
      connectedUser = data.name
      this.createConnection()
      peerConn.setRemoteDescription(new RTCSessionDescription(data.offer))
      // create an answer to an offer
      peerConn.createAnswer(
        answer => {
          peerConn.setLocalDescription(answer)
          this.send({
            event: 'answer',
            answer: answer
          })
        },
        error => {
          console.log(error)
          alert('Error when creating an answer')
        }
      )
    },
    handleMsg(data) {
      console.log(data.message)
    },
    handleAnswer(data) {
      peerConn.setRemoteDescription(new RTCSessionDescription(data.answer))
    },
    handleCandidate(data) {
      // ClientB通过PeerConnection的AddIceCandidate方法保存起来
      peerConn.addIceCandidate(new RTCIceCandidate(data.candidate))
    },
    hangUp() {
      this.send({
        event: 'leave'
      })
      this.handleLeave()
    },
    handleLeave() {
      alert('通话已结束')
      connectedUser = null
      this.remote_video = ''
      peerConn.close()
      peerConn.onicecandidate = null
      peerConn.onaddstream = null
      if (peerConn.signalingState === 'closed') {
        this.initCreate()
      }
    },
    closePreview() {
      this.accept_video = false
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
/* 遵循BEM的命名方式
.block{}
.block__element{}
.block--modifier{} */
.app-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 84px);
  padding: 5px;
}
.preview {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: table;
  transition: opacity 0.3s ease;
}
.preview-wrapper {
  display: table-cell;
  vertical-align: middle;
}
.preview-container {
  width: 400px;
  height: 150px;
  margin: 0px auto;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
  font-family: Helvetica, Arial, sans-serif;
  position: relative;
}
.confirm {
  position: absolute;
  right: 10px;
  top: 0px;
  font-size: 40px;
}
.confirm:hover {
  color: red;
  cursor: pointer;
}
.preview-body {
  position: absolute;
  width: 380px;
  height: 130px;
  margin: 10px 10px 10px 10px;
}
.preview-body > h4 {
  position: absolute;
  top: 25%;
  left: 20%;
}
.preview-body > button {
  position: absolute;
  right: 10px;
  bottom: 0px;
}
.green_color {
  color: green;
}
.red_color {
  color: red;
}
</style>