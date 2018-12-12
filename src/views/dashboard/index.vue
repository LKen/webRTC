<template>
  <div class="webrtc-container">
    <transition name="collapse-transform" v-on:after-leave="afterLeave">
      <div v-if="!isRegistered" class="webrtc-register">
        <div class="webrtc-register__head">
          <div class="logo">
            <img id="logo" src="~assets/logo.png" alt="logo">
          </div>
        </div>
        <div class="webrtc-register__body">
          <div class="center">
            <span class="label">机器人视频聊天室</span>
            <div>
              <md-input class="username" type="text" icon="service" name="title" placeholder="" v-model="username" @keyup.enter.native="handleRegistered">用户名称</md-input>
              <el-popover
                placement="right"
                width="140"
                trigger="manual"
                content="名称不能为空哦"
                v-model="isPopover">
                <i slot='reference' class="el-icon-back registered" @click="handleRegistered" style="cursor: pointer;"></i>
              </el-popover>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <div class="webrtc-room">
      <!-- 全屏背景粒子动态效果 -->
      <div id="particles-js"></div>
      <!-- 全屏壁纸 -->
      <!-- top menu -->
      <!-- <div class="webrtc-room-topmenu">
        <span class="webrtc-room-topmenu__item webrtc-room-topmenu__text">欢迎，<label>{{ username }}</label></span>
        <div class="webrtc-room-topmenu__item webrtc-room-topmenu__select">
          <span class="label">在线用户：</span>
          <el-select :disabled="disabledSelect" v-model="selectedName" filterable placeholder="请选择" @change="handleSelectName">
            <el-option
              v-for="(item, index) in computedUser"
              :key="index"
              :label="item"
              :value="item">
            </el-option>
          </el-select>
        </div>
        <span class="webrtc-room-topmenu__item top-menu__icon">
          <svg-icon :icon-class="computedStatusOfPhone" :className="'is-' + computedStatusOfPhone" @click.native="handlePhoneStatus"></svg-icon>
        </span>

        <span v-show="connectedUser" class="webrtc-room-topmenu__item webrtc-room-topmenu__text">正在通话的用户：<q><b>{{ connectedUser }}</b></q></span>
      </div> -->
      <!-- /top menu -->

      <!-- video内容 -->
      <div class="webrtc-room-content">
        <!-- custom camera -->
        <div v-drag-dialog class="webrtc-room-dialog">
          <!-- <div class="webrtc-room-dialog__head">
            <span class="webrtc-room-dialog__title">{{ cameraInfo }}</span>
            <button type="button" aria-label="Close" class="webrtc-room-dialog__headerbtn">
              <i class="webrtc-room-dialog__close el-icon el-icon-close"></i>
            </button>
          </div> -->
          <div class="webrtc-room-dialog__body">
            <video v-show="isShow_selfVideo" ref="selfVideo" width="320" height="240"></video>
          </div>
        </div>
        <!-- /custom camera -->
        <!-- remote camera -->
        <div class="webrtc-room-content__video">
          <video v-show="isShow_remoteVideo" ref="remoteVideo" class="remoteVideo" width="320" height="240"></video>
        </div>
        <!-- /remote camera -->
      </div>
      <!-- 、video内容 -->

      <!-- footer -->
      <div v-if="connectedUser && !isRing"  class="webrtc-room-footer">
        <span class="footer__icon">
          <svg-icon :icon-class="computedStatusOfPhone" :className="'is-' + computedStatusOfPhone" @click.native="handlePhoneStatus"></svg-icon>
        </span>
        <!-- <span class="footer__icon">
          <svg-icon icon-class="phone_call" className="is-phone_call" @click.native="call"></svg-icon>
        </span> -->
      </div>
      <!-- ./footer -->
    </div>
    <!-- 来电提示  -->
    <el-dialog
      custom-class="webrtc-receive"
      title="来电提示"
      :visible.sync="isRing"
      :close-on-click-modal="false"
      :modal="false"
      width="70.6%"
      center>

      <div class="avatar-wrapper">
        <div class="avatar">
          <svg-icon v-if="!otherInfo.avatar" icon-class="user"></svg-icon>
          <img v-else :src="otherInfo.avatar" alt="">
        </div>
      </div>
      <p class="othername hidden-xs-only">{{ connectedUser }}</p>
      <span slot="footer" class="dialog-footer">
        <svg-icon icon-class="phone_ring" className="is-phone_ring" @click.native="handlePhoneReceive"></svg-icon>
        <svg-icon icon-class="phone_off" className="is-phone_off" @click.native="handleOhoneReject"></svg-icon>
      </span>
    </el-dialog>
    <!-- ./来电提示  -->
  </div>
</template>

<script>
import io from 'socket.io-client'
import adapter from 'webrtc-adapter'
import MdInput from '@/components/MDinput'
import dragDialog from './directive/dragDialog' // base on element-ui
import { param2Obj } from '@/utils'

const CALL = 1
const WAITING = 2
const RING = 3
const HANGUP = 4

let localStream
let startTime
let pc = '' // RTCPeerConnection 实例
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
}

export default {
  name: 'Dashboard',
  directives: { dragDialog },
  components: {
    MdInput
  },
  data() {
    return {
      socket: '', // socket.io
      isRegistered: true, // 是否已经有登记的用户名称，local
      isPopover: false, // 判断用户是否存在username，无则显示弹窗
      disabledSelect: false, // 用于控制在线用户下拉列表
      isRing: false, // 响铃弹窗展示
      isShow_selfVideo: true, // 控制显示本地摄像头
      isShow_remoteVideo: false, // 控制远程摄像头
      username: '', // 用户名称
      statusOfPhone: 1, // 状态按钮 控制
      users: null,
      otherInfo: {
        name: '未知',
        avatar: ''
      },
      selectedName: '', // 下拉框选中的值
      connectedUser: '', // 远程连接的用户名称
      cameraInfo: '1080 P', // 摄像头信息，用于文本显示
      configuration: {
        iceServers: [
          { urls: ['stun:stun01.sipphone.com', 'stun:stun.ekiga.net', 'stun:stun.fwdnet.net'] },
          { urls: 'stun:stun.ideasip.com' },
          { urls: 'stun:stun.iptel.org' },
          { urls: 'stun:stun.rixtelecom.se' },
          { urls: 'stun:stun.schlund.de' },
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:stunserver.org' },
          { urls: 'stun:stun.softjoys.com' },
          { urls: 'stun:stun.voiparound.com' },
          { urls: 'stun:stun.voipbuster.com' },
          { urls: 'stun:stun.voipstunt.com' },
          { urls: 'stun:stun.voxgratia.org' },
          { urls: 'stun:stun.xten.com' },
          {
            urls: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com'
          },
          // {
          //   urls: 'turn:192.158.29.39:3478?transport=udp',
          //   credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
          //   username: '28224511:1379330808'
          // },
          // {
          //   urls: 'turn:192.158.29.39:3478?transport=tcp',
          //   credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
          //   username: '28224511:1379330808'
          // },
          {
            urls: 'turn:115.28.170.217:3478',
            credential: 'zmecust',
            username: 'zmecust'
          }
        ]
      },
      constraints: {
        audio: true,
        video: {
          width: {
            min: 320,
            max: 1920,
            ideal: 320
          },
          height: {
            min: 240,
            max: 1080,
            ideal: 240
          }
        }
      },
      videoConstraints: {
        width: 320,
        height: 240,
        frameRate: { ideal: 10, max: 15 }
      }
    }
  },
  /**
   * fetch user name
   */
  created() {
    const search = param2Obj(location.search)
    if (search.name) {
      this.username = search.name
    } else {
      this.isRegistered = false
    }
    if (search.connectedUser) {
      this.connectedUser = search.connectedUser
      this.statusOfPhone = 1
    }
  },
  mounted() {
    console.info(adapter.browserDetails.browser)

    /* global particlesJS */
    Promise.all([
      import('particles.js'),
      import('./particles.config.js')
    ]).then(([particles, config]) => {
      particlesJS('particles-js', config)
    })
    this.createSocketIO()

    if (this.isRegistered) {
      if (this.username.trim()) {
        this.send({
          event: 'join',
          name: this.username.trim()
        })
      } else {
        this.$notify({
          title: 'Socket.io',
          message: 'IO参数错误： 缺少username',
          type: 'error',
          duration: 2500
        })
        this.isRegistered = false
      }
      // establish socket.io
      // getMediaStream
      // this.getStream()
    }
  },
  beforeRouteLeave(to, from, next) {
    new Promise((resolve, reject) => {
      if (to.path === '/404') {
        if (to.redirectedFrom) {
          const path = to.redirectedFrom
          const parse = param2Obj(path.replace('!', '?'))
          const { connectedUser = '', device = '' } = parse
          if (device === 'wpf' && connectedUser !== '') {
            // 干点事
            this.connectedUser = connectedUser
            this.statusOfPhone = 1
            reject()
          } else {
            resolve()
          }
        }
      } else {
        resolve()
      }
    }).then(() => {
      // 处理Socket.io 断开
      if (this.socket) {
        this.send({
          event: 'leave'
        })
        this.socket.disconnect()
        console.log('Socket.io: closeed connection by page jumping')
      }
      next()
    }, () => {
      next(false)
    })
  },
  methods: {
    /**
     * 处理用户聊天登记事件
     */
    handleRegistered() {
      const { username } = this
      if (username.trim() === '') {
        this.isPopover = true
        setTimeout(() => { this.isPopover = false }, 3000)
      } else {
        this.send({
          event: 'join',
          name: this.username.trim()
        })
      }
    },
    /**
     * 登记后，执行的事件
     */
    afterLeave(el) {
      this.getStream()
    },

    /**
     * 建立socket.io连接
     */
    createSocketIO() {
      const url = 'localhost:2100'
      this.socket = io.connect(url)
      this.socket.on('message', (data) => {
        console.log(data.event, data)
        switch (data.event) {
          case 'show':
            this.users = data.allUsers
            break
          case 'join':
            this.handleJoinChartRoom(data)
            break
          case 'call':
            this.handleCalled(data)
            break
          case 'accept':
            this.handleAccept(data)
            break
          case 'offer':
            this.handleOffer(data)
            break
          case 'answer':
            this.handleAnswer(data)
            break
          case 'candidate':
            this.handleCandidate(data)
            break
          case 'msg':
            this.handleMsg(data)
            break
          case 'leave':
            this.handleLeave()
            break
          default:
            break
        }
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

      this.socket.on('connect_error', (err) => {
        this.$notify({
          title: 'Socket.io',
          message: 'IO连接错误',
          type: 'error',
          duration: 1500
        })
        console.log(err)
      })

      // before the site closed
      window.onbeforeunload = function(event) {
        if (this.socket) {
          this.send({
            event: 'leave'
          })
          this.socket.disconnect()
          console.log('Socket.io: closeed connection by reload(F5)')
        }
      }
    },
    /**
     * handle the socket-event: join
     */
    handleJoinChartRoom(data) {
      if (data.success === false) {
        this.$message({
          message: 'Socket错误，登录名（username）已被占用',
          type: 'warning'
        })
      } else {
        this.isRegistered = true
        this.users = data.allUsers
        if (!localStream) {
          // getMediaStream
          this.getStream()
        }
      }
    },
    /**
     * handle the socket-event: call
     */
    handleCalled(data) {
      if (!data) return
      const { name } = data
      console.log(`receive a phone call from ${name}`)
      this.connectedUser = name
      this.selectedName = name
      this.isRing = true
      this.statusOfPhone = 3
    },
    /**
     * handle the socket-event: accept, then create RTCPeerConnection
     */
    async handleAccept(data) {
      if (!data) return
      if (data.accept) {
        // create webrtc
        this.createRTCPeerConnection()
        try {
          // createOffer The return from this of this is passed an RTCSessionDescription
          const offer = await pc.createOffer(offerOptions)
          // ote that RTCPeerConnection won't start gathering candidates until setLocalDescription() is called: this is codified in JSEP IETF draft. ( important, important, important )
          await pc.setLocalDescription(offer)
          console.log('pc set local session description: offer')
          // send the offer to the other peer
          this.send({ event: 'offer', offer })
        } catch (err) {
          const errname = err.name
          let errTxt
          switch (errname) {
            case 'InvalidStateError':
              errTxt = '将RTCPeerConnection被关闭'
              break
            case 'NotReadableError':
              errTxt = '未提供用于保护连接的证书或证书集，并且createOffer()无法创建新证书'
              break
            case 'OperationError':
              errTxt = '由于某种原因，检查系统状态以确定资源可用性以生成报价失败'
              break
          }
          this.$notify({
            title: '媒体设备错误',
            message: errTxt,
            type: 'error',
            duration: 1500
          })
          console.log(err.name + ': ' + err.message)
        }
      } else {
        this.$notify({
          title: 'Socket.io',
          message: '对方已拒绝',
          type: 'error',
          duration: 1500
        })
        this.statusOfPhone = 1
      }
    },
    /**
     * handle the socket-event: offer
     */
    async handleOffer(data) {
      if (!data) return
      const { name, offer } = data
      this.createRTCPeerConnection()
      try {
        console.log(`receive the offer from ${name}`)
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        console.log('pc set remote session description: offer')
      } catch (e) {
        console.log(`Failed to set session description: ${e.toString()}`)
      }
      // Since the 'remote' side has no media stream we need
      // to pass in the right constraints in order for it to
      // accept the incoming offer of audio and video.
      try {
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        this.send({ event: 'answer', answer })
        console.log('pc set local session description: answer')
      } catch (e) {
        console.log(`Failed to create session description: ${e.toString()}`)
      }
    },
    /**
     * handle the socket-event: answer
     */
    async handleAnswer(data) {
      if (!data) return
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
        console.log('pc set remote session description: answer')
      } catch (e) {
        console.log(`Failed to create session description: ${e.toString()}`)
      }
    },
    /**
     * handle the socket-event: Candidate
     */
    async handleCandidate(data) {
      if (!data) return
      const { candidate } = data
      try {
        await pc.addIceCandidate(candidate)
        console.log('pc addIceCandidate success')
      } catch (e) {
        console.log(`pc failed to add ICE Candidate: ${e.toString()}`)
      }
    },
    /**
     * handle the socket-event: msg , other message
     */
    handleMsg(data) {
      if (data.event === 'msg') {
        this.$message({
          message: data.message,
          type: 'error'
        })
      }
    },

    /**
     * handle the socket-event: leave
     */
    handleLeave(data) {
      pc.close()
      this.statusOfPhone = 1 // change status
      this.isShow_remoteVideo = false
      const remoteVideo = this.$refs['remoteVideo']
      remoteVideo.pause()
      if ('srcObject' in remoteVideo) {
        remoteVideo.srcObject = null
      }
      this.$notify({
        title: 'WebRTC',
        message: '视频连接断开',
        type: 'warning',
        duration: 2000
      })
    },

    /**
     * webRTC 的准备工作
     */
    async getStream() {
      if (localStream) {
        return
      }
      const self = this
      /** 绑定事件，检测完成的程度 */
      const selfVideo = this.$refs['selfVideo']
      const remoteVideo = this.$refs['remoteVideo']

      selfVideo.addEventListener('loadedmetadata', function() {
        selfVideo.play()
        console.log(`Local video loadedmetadata videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`)
      })

      remoteVideo.addEventListener('loadedmetadata', function() {
        remoteVideo.play()
        self.statusOfPhone = 4
        self.$notify({
          title: 'WebRTC',
          message: '视频连接成功',
          type: 'success',
          duration: 1500
        })
        console.log(`Remote video loadedmetadata videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`)
      })

      remoteVideo.addEventListener('resize', () => {
        console.log(`Remote video size changed to ${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`)
        // We'll use the first onsize callback as an indication that video has started
        // playing out.
        if (startTime) {
          const elapsedTime = window.performance.now() - startTime
          console.log('Setup time: ' + elapsedTime.toFixed(3) + 'ms')
          startTime = null
        }
      })

      /** fetch the mediaStream */
      const { constraints } = this
      try {
        // get local stream, show it in self-view and add it to be sent
        const stream = await navigator.mediaDevices.getUserMedia(constraints)

        localStream = stream

        const videoTracks = localStream.getVideoTracks()
        const audioTracks = localStream.getAudioTracks()
        if (videoTracks.length > 0) {
          this.cameraInfo = videoTracks[0].label
          console.log(`Using video device: ${videoTracks[0].label}`)
        }
        if (audioTracks.length > 0) {
          console.log(`Using audio device: ${audioTracks[0].label}`)
        }

        // stream.getTracks().forEach((track) => pc.addTrack(track, stream))
        // 旧的浏览器可能没有srcObject
        if ('srcObject' in selfVideo) {
          selfVideo.srcObject = stream
        } else {
        // 防止再新的浏览器里使用它，应为它已经不再支持了
          selfVideo.src = window.URL.createObjectURL(stream)
        }
      } catch (err) {
        const { name } = err
        let errTxt = ''
        switch (name) {
          case 'AbortError':
            errTxt = '中止错误: 异常的硬件问题'
            break
          case 'NotAllowedError':
            errTxt = '拒绝错误: 用户拒绝了当前会话的访问'
            break
          case 'NotFoundError':
            errTxt = '找不到错误: 找不到满足请求参数的媒体类型'
            break
          case 'OverConstrainedError':
            errTxt = '无法满足要求错误: 摄像头属性配置不一致'
            break
          case 'NotReadableError':
            errTxt = '无法读取错误: 用户已经授权使用相应的设备，操作系统上某个硬件、浏览器或者网页层面发生的错误导致设备无法被访问'
            break
          case 'SecurityError':
            errTxt = '安全错误: 使用设备媒体被禁止'
            break
          case 'TypeError':
            errTxt = '类型错误: constraints对象未设置［空]'
            break
        }
        this.$notify({
          title: '媒体设备错误',
          message: errTxt,
          type: 'error',
          duration: 1500
        })
        console.log(err.name + ': ' + err.message)
      }
    },
    /**
     * 建立RTCPeerConnection,绑定相关事件，开始尝试连接
     */
    createRTCPeerConnection() {
      console.log('Starting call')
      startTime = window.performance.now()

      const { configuration } = this
      pc = new RTCPeerConnection(configuration)
      console.log('Created local peer connection object pc')

      // send any ice candidates to the other peer, only when exchange the sessionDescription each other.
      pc.onicecandidate = (e) => {
        e.candidate && this.send({
          event: 'candidate',
          candidate: e.candidate
        })
      }

      pc.addEventListener('iceconnectionstatechange', e => console.log(`ICE state: ${pc.iceConnectionState}`))

      // once remote track media arrives, show it in remote video element
      // when fetch the stream, show the video
      pc.ontrack = (event) => {
        const remoteVideo = this.$refs['remoteVideo']
        this.isShow_remoteVideo = true
        if (remoteVideo.srcObject !== event.streams[0]) {
          remoteVideo.srcObject = event.streams[0]
          console.log('pc received remote stream')
        }
      }

      /** 降低流失败 */
      // const { videoConstraints } = this
      // const videoTracks = localStream.getVideoTracks()
      // const audioTracks = localStream.getAudioTracks()
      // const newStream = new MediaStream()

      // if (videoTracks.length > 0) {
      //   const v = localStream.getVideoTracks()[0].clone()
      //   // change the size
      //   v.applyConstraints(videoConstraints)
      //   newStream.addTrack(v)
      // }
      // if (audioTracks.length > 0) {
      //   const a = localStream.getAudioTracks()[0].clone()
      //   newStream.addTrack(a)
      // }
      // console.log(newStream)
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream))
      console.log('Added new stream to pc')

      /**
       * !let the "negotiationneeded" event trigger offer generation
       * 该函数negotiationneeded在RTCPeerConnection
       * 实例上发生时被调用以处理该事件,比如添加新的track 发生需要会话协商的更改时会触发此事件。此协商应作为提议者进行，因为某些会话更改无法作为回答者进行协商
       */
      // pc.onnegotiationneeded = async(e) => {
      //   try {
      //     // createOffer The return from this of this is passed an RTCSessionDescription
      //     const offer = await pc.createOffer()
      //     console.log('negotiationneeded: create new offer', offer)
      //     // ote that RTCPeerConnection won't start gathering candidates until setLocalDescription() is called: this is codified in JSEP IETF draft. ( important, important, important )
      //     await pc.setLocalDescription(offer)
      //     // send the offer to the other peer
      //     this.send({ event: 'offer', offer })
      //   } catch (err) {
      //     const errname = err.name
      //     let errTxt
      //     switch (errname) {
      //       case 'InvalidStateError':
      //         errTxt = '将RTCPeerConnection被关闭'
      //         break
      //       case 'NotReadableError':
      //         errTxt = '未提供用于保护连接的证书或证书集，并且createOffer()无法创建新证书'
      //         break
      //       case 'OperationError':
      //         errTxt = '由于某种原因，检查系统状态以确定资源可用性以生成报价失败'
      //         break
      //     }
      //     this.$notify({
      //       title: '媒体设备错误',
      //       message: errTxt,
      //       type: 'error',
      //       duration: 1500
      //     })
      //     console.log(err.name + ': ' + err.message)
      //   }
      // }
    },

    /**
     * select event
     */
    handleSelectName() {
      const { selectedName } = this
      this.connectedUser = selectedName
    },

    /**
     * 处理电话接受
     */
    handlePhoneReceive(event) {
      this.handlePhoneStatus()
      this.statusOfPhone = 2
    },
    handleOhoneReject(event) {
      this.isRing = false
      this.selectedName = ''
      this.statusOfPhone = 1
      this.send({
        event: 'accept',
        accept: false
      })
    },
    /**
     * 处理电话事件：phone 状态事件
     */
    handlePhoneStatus() {
      const { statusOfPhone } = this
      switch (statusOfPhone) {
        case CALL:
          this.callTo()
          break
        case WAITING:
          this.handleWaiting()
          break
        case RING:
          this.handleRing()
          break
        case HANGUP:
          this.handleHandup()
          break
      }
    },
    /**
     * 打电话
     */
    callTo() {
      const { connectedUser, users } = this
      this.statusOfPhone = 2 // status to 2
      try {
        if (users[connectedUser] === undefined) throw new Error('拨打的用户不存在')
        if (users[connectedUser] === true) {
          this.send({
            event: 'call'
          })
        } else {
          throw new Error('当前拨打的用户正忙')
        }
      } catch (e) {
        this.$message({
          type: 'error',
          message: e.message
        })
        console.log(e)
        this.statusOfPhone = 1
      }
    },
    handleWaiting() {
      // this.$confirm('取消通话?', '提示', {
      //     confirmButtonText: '确定',
      //     cancelButtonText: '取消',
      //     type: 'warning'
      //   }).then(() => {
      //     this.statusOfPhone = 1
      //   }).catch(() => {
      //   })
      console.log(123)
    },
    /**
     * 接受电话
     */
    handleRing() {
      console.log('accept ring')
      this.isRing = false
      this.disabledSelect = true

      this.send({
        event: 'accept',
        accept: true
      })
    },

    /**
     * 挂断电话
     */
    handleHandup() {
      console.log('hangup')
      this.send({
        event: 'leave'
      })
      this.disabledSelect = false
      this.handleLeave()
    },
    /**
     * send data through the socket.io
     */
    send(message) {
      const { connectedUser } = this
      if (connectedUser != null) {
        message.connectedUser = connectedUser
      } else {
        console.log('send ' + message.event + ' miss the connectedUser')
      }
      this.socket.send(JSON.stringify(message))
    }
  },
  computed: {
    computedStatusOfPhone() {
      const { statusOfPhone } = this
      return statusOfPhone === CALL ? 'phone_call'
        : statusOfPhone === WAITING ? 'phone_waiting'
          : statusOfPhone === RING ? 'phone_ring'
            : 'phone_off'
    },
    computedUser() {
      const { users, username } = this
      if (users) {
        return Object.keys(users).filter(item => {
          if (item === username || item.trim() === '') {
            return false
          }
          return true
        })
      } else {
        return []
      }
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
/* 遵循BEM的命名方式
.block{}
.block__element{}
.block--modifier{} */
$bg: #304156;
$light_gray:#eee;
$dark_gray:#889aa4;
$cursor: #fff;
$color-theme: #c1a67b;
$--color-success: #67c23a !default;
$--color-warning: #e6a23c !default;
$--color-danger: #f56c6c !default;
$--color-primary: rgb(10, 171, 192);

* {
  box-sizing: border-box;
}
%full-screen {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  overflow: hidden;
}
%svg {
  padding: 6px;
  width: 30px;
  height: 30px;
  vertical-align: middle;
  border-radius: 5px;
  fill: #feffff !important;
  user-select: none;
  cursor: pointer;
  transition: all .3s linear;
}
.webrtc-container {
  position: relative;
  width: 100%;
  height: 100vh;
  padding: 0;
  margin: 0;
  overflow: hidden;
  .webrtc-register {
    z-index: 3;
    background: #fff;
    box-shadow: 0px -2px 12px rgba(0, 0, 0, 0.36);
    @extend %full-screen;
    .webrtc-register__head {
      position: absolute;
      height: 80px;
      line-height: 80px;
      width: 100%;
      padding: 0 35px;
      margin: 0;
      border: none;
      top: 0;
      left: 0;
      z-index: 1;
      .logo {
        display: inline-block;
        height: 100%;
        line-height: inherit;
        overflow: hidden;
        & > * {
          position: relative;
          display: inline-block;
          vertical-align: middle;
        }
        & > #logo {
          width: 179px;
          height: 48px;
          position: relative;
        }
      }
    }
    .webrtc-register__body {
      position: relative;
      width: 100%;
      height: 100%;
      .center {
        position: absolute;
        top: 45%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        .label {
          position: relative;
          display: block;
          padding-bottom: 15px;
          -webkit-font-smoothing: antialiased;
          font-size: 2.6rem;
          font-family: "Microsoft YaHei","Hiragino Sans GB","PingFang SC","SimHei","宋体","Arial Unicode MS";
        }
        /deep/ .username {
          display: inline-block;
          width: 68.333%;
          margin: 76px auto 0;
          .material-input__icon {
            height: 30px;
            padding-bottom: 6px;
            font-size: 18px;
            color: inherit;
          }
          .material-input {
            font-size: 16px;
            padding-bottom: 6px;
            color: #333;
          }
          .material-label {
            top: 16px;
            left: 40px;
            font-size: 16px;
          }
          &.material--raised {
            .material-label {
              top: -28px;
              left: 0;
            }
          }
        }
        .registered {
          user-select: none;
          margin-left: 15px;
          transform: rotate(180deg);
          padding: 6px;
          border-radius: 5px;
          box-shadow: -1px -1px 3px rgba(0, 0, 0, 0.29);
          &:active {
            box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.77);
          }
        }
      }
    }
  }
  .webrtc-room {
    position: relative;
    width: 100%;
    height: 100%;
    background: #f7f7f7;
    .webrtc-room-topmenu {
      width: 100%;
      height: 60px;
      line-height: 60px;
      position: absolute;
      background: #fff;
      box-shadow: 0 -1px 10px rgba(0, 0, 0, 0.41);
      font-size: 16px;
      color: #555;
      overflow: hidden;
      z-index: 1;
      .webrtc-room-topmenu__item {
        // display: inline-block;
        float: left;
      }
      .webrtc-room-topmenu__text {
        margin-left: 15px;
        & > label {
          display: inline-block;
          width: 100px;
          font-size: 24px;
          color: #000;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
          vertical-align: sub;
          line-height: 1;
        }
      }
      .webrtc-room-topmenu__select {
        margin-left: 120px;
      }
      .top-menu__icon {
        margin-left: 25px;
        margin-right: 60px;
        & > svg {
          @extend %svg;
        }
      }
    }
    .webrtc-room-content {
      position: relative;
      width: 100%;
      height: 100%;
      // padding-top: 60px;
      overflow: hidden;
      .webrtc-room-dialog {
        background: #fff;
        border-radius: 2px;
        box-shadow: 0 1px 5px rgba(0, 0, 0, 0.38);
        box-sizing: border-box;
        position: absolute;
        max-width: 320px;
        max-height: 240px;
        min-width: 160px;
        min-height: 120px;
        border-radius: 5px;
        transform: none;
        z-index: 2;
        .webrtc-room-dialog__head {
          position: absolute;
          top: 0;
          left: 0;
          padding: 6px 10px;
          user-select: none;
          width: 100%;
          z-index: 1;
          background: rgba(255, 255, 255, 0.4);
          color: #ccc;
          display: none;
          .webrtc-room-dialog__title {
            color: inherit;
            font-size: 16px;
            line-height: 24px;
          }
          .webrtc-room-dialog__headerbtn {
            -webkit-appearance: button;
            background: 0 0;
            border: none;
            cursor: pointer;
            font-size: 16px;
            outline: 0;
            padding: 0;
            position: absolute;
            right: 20px;
            top: 10px;
          }
        }
        .webrtc-room-dialog__body {
          position: relative;
          width: 100%;
          height: 100%;
          line-height: 0;
          font-size: 0;
          background-color: #000;
          & > video {
            position: relative;
            width: 100%;
            height: 100%;
          }
        }
      }
      .webrtc-room-content__video {
        position: relative;
        width: 100%;
        height: 100%;

        .remoteVideo {
          position: relative;
          user-select: none;
          width: 100vh;
          height: 100vw;
          // max-width: 640px;
          // max-height: 480px;
          top: 50%;
          left: 50%;
          transform: translate3d(-50% , -50%, 0) rotate(-90deg);
          transform-origin: 50% 50%;
          // background-color: rgba(0, 0, 0, 0.3);
        }
      }
    }
    .webrtc-room-footer {
      position: fixed;
      width: 100%;
      bottom: 5%;
      text-align: center;
      .footer__icon {
        svg {
          @extend %svg;
          padding: 12px;
          width: 50px;
          height: 50px;
        }
      }
    }
  }
  /deep/ .webrtc-receive {
    margin-top: 0 !important; // 修改dialog样式
    top: 50%;
    transform: translateY(-50%);
    min-width: 190px;
    max-width: 300px;
    .avatar-wrapper {
      display: inline-block;
      position: relative;
      width: 72px;
      padding: 15px;
      left: 50%;
      transform: translateX(-50%);
      line-height: 0;
      font-size: 0;
      overflow: hidden;
      border: 1px solid #606266;
      border-radius: 100%;
      .avatar {
        position: relative;
        display: inline-block;
        width: 100%;
        svg, img {
          position: absolute;
          top: 0;
          width: 100%
        }
        svg {
          height: 100%;
        }
        &::after {
          content: '';
          display: block;
          margin-top: 100%; //margin 百分比相对父元素宽度计算
        }
      }
    }
    .othername {
      text-align: center;
      font-size: 24px;
      color: #000;
      margin-top: 40px;
    }
    .dialog-footer {
      svg {
        @extend %svg;
        width: 40px;
        height: 40px;
        padding: 8px;
        margin: 0 15px;
      }

    }
  }
}

// 未拨打
.is-phone_call {
  background: $--color-success;
  &:hover {
    animation: shake .2s infinite;
  }
}
// 拨打中
.is-phone_waiting {
  background: $--color-primary;
  /deep/ & > use {
    animation: waiting 1s steps(3, start) infinite;
  }
}
// 响铃中
.is-phone_ring {
  background: $--color-success;
  animation: shake .2s infinite;
}
// 通话中
.is-phone_off {
  background: $--color-danger;
  &:hover {
    transform: scale(1.1)
  }
}

#particles-js {
  position: absolute;
  height: 100%;
  width: 100%;
}

@keyframes shake {
  0% {
    transform: rotate(0deg)
  }
  25% {
    transform: rotate(25deg)
  }
  50% {
    transform: rotate(0deg)
  }
  75% {
    transform: rotate(-25deg)
  }
  100% {
    transform: rotate(0deg)
  }
}
@keyframes scale {
  0% {
    transform: scale(1)
  }

  50% {
    transform: scale(1.2)
  }

  100% {
    transform: scale(1)
  }
}
@keyframes waiting {
  0% {
    transform: translateX(-26.12px)
  }
  100% {
    transform: translateX(0px)
  }
}
</style>
