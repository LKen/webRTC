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
              <md-input class="username" type="text" icon="service" name="title" placeholder="" v-model="username">用户名称</md-input>
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
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </div>
        <span class="webrtc-room-topmenu__item top-menu__icon">
          <svg-icon :icon-class="computedStatusOfPhone" :className="'is-' + computedStatusOfPhone" @click.native="handlePhoneStatus"></svg-icon>
        </span>

        <span v-show="connectedName" class="webrtc-room-topmenu__item webrtc-room-topmenu__text">正在通话的用户：<q><b>{{ connectedName }}</b></q></span>
      </div> -->
      <!-- /top menu -->

      <!-- video内容 -->
      <div class="webrtc-room-content">
        <!-- custom camera -->
        <div v-drag-dialog class="webrtc-room-dialog hidden-xs-only">
          <!-- <div class="webrtc-room-dialog__head">
            <span class="webrtc-room-dialog__title">{{ cameraInfo }}</span>
            <button type="button" aria-label="Close" class="webrtc-room-dialog__headerbtn">
              <i class="webrtc-room-dialog__close el-icon el-icon-close"></i>
            </button>
          </div> -->
          <div class="webrtc-room-dialog__body">
            <video v-show="isShow_selfVideo" ref="selfVideo" src="" width="320" height="240"></video>
          </div>
        </div>
        <!-- /custom camera -->
        <!-- remote camera -->
        <div class="webrtc-room-content__video">
          <video v-show="isShow_remoteVideo" ref="remoteView" class="remoteVideo" src=""></video>
        </div>
        <!-- /remote camera -->
      </div>
      <!-- 、video内容 -->

      <!-- footer -->
      <div v-if="statusOfPhone === 4" class="webrtc-room-footer">
        <span class="footer__icon">
          <svg-icon :icon-class="computedStatusOfPhone" :className="'is-' + computedStatusOfPhone" @click.native="handlePhoneStatus"></svg-icon>
        </span>
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
      <p class="othername hidden-xs-only">{{ otherInfo.name }}</p>
      <span slot="footer" class="dialog-footer">
        <svg-icon icon-class="phone_ring" className="is-phone_ring" @click.native="handlePhoneReceive"></svg-icon>
        <svg-icon icon-class="phone_off" className="is-phone_off" @click.native="isRing = false"></svg-icon>
      </span>
    </el-dialog>
    <!-- ./来电提示  -->
  </div>
</template>

<script>
import adapter from 'webrtc-adapter'
import MdInput from '@/components/MDinput'
import dragDialog from './directive/dragDialog' // base on element-ui
import { param2Obj } from '@/utils'

const CALL = 1
const CALLING = 2
const RING = 3
const HANGUP = 4

export default {
  name: 'Dashboard',
  directives: { dragDialog },
  components: {
    MdInput
  },
  data() {
    return {
      isRegistered: true,
      isPopover: false,
      disabledSelect: false,
      isRing: false,
      isShow_selfVideo: true,
      isShow_remoteVideo: true,
      username: '',
      statusOfPhone: 4,
      options: [{
        value: '选项1',
        label: '黄金糕'
      }, {
        value: '选项2',
        label: '双皮奶'
      }, {
        value: '选项3',
        label: '蚵仔煎'
      }, {
        value: '选项4',
        label: '龙须面'
      }, {
        value: '选项5',
        label: '北京烤鸭'
      }],
      otherInfo: {
        name: '有一个可爱的人',
        avatar: ''
      },
      selectedName: '',
      connectedName: '',
      cameraInfo: '1080 P'
    }
  },
  created() {
    const search = param2Obj(location.search)
    if (search.name) {
      this.username = search.name
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
    this.start()
  },
  beforeRouteLeave(to, from, next) {
    new Promise((resolve, reject) => {
      if (to.path === '/404') {
        if (to.redirectedFrom) {
          const path = to.redirectedFrom
          const parse = param2Obj(path.replace('!', '?'))
          const device = parse.device || ''
          if (device === 'wpf') {
            // 干点事
            console.log(parse)
            reject()
          } else {
            resolve()
          }
        }
      } else {
        resolve()
      }
    }).then(() => {
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
        this.isRegistered = true
      }
    },
    /**
     * 登记后，执行的事件
     */
    afterLeave(el) {
      this.start()
    },
    /**
     * webRTC 的准备工作
     */
    async start() {
      const constraints = {
        audio: true,
        video: {
          width: 1920,
          height: 1080
        }
      }
      try {
        // get local stream, show it in self-view and add it to be sent
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        // stream.getTracks().forEach((track) => pc.addTrack(track, stream))
        const selfView = this.$refs['selfVideo']
        // 旧的浏览器可能没有srcObject
        if ('srcObject' in selfView) {
          selfView.srcObject = stream
          selfView.muted = true
        } else {
        // 防止再新的浏览器里使用它，应为它已经不再支持了
          selfView.src = window.URL.createObjectURL(stream)
        }
        selfView.onloadedmetadata = function(e) {
          selfView.play()
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
    handleSelectName() {
      const { selectedName } = this
      console.log(selectedName)
    },
    /**
     * 处理电话接受
     */
    handlePhoneReceive(event) {
      this.statusOfPhone = 3
      this.handlePhoneStatus()
    },
    /**
     * 处理事件：phone 状态事件
     */
    handlePhoneStatus() {
      const { statusOfPhone } = this
      switch (statusOfPhone) {
        case CALL:
          this.handleCall()
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
     * call
     */
    handleCall() {
      console.log('call')
      this.disabledSelect = true
      this.statusOfPhone = 2
    },
    /**
     * ring
     */
    handleRing() {
      console.log('ring')
      this.isRing = false
      this.disabledSelect = true
      this.connectedName = this.otherInfo.name
      this.statusOfPhone = 4
    },
    /**
     * ring
     */
    handleHandup() {
      console.log('hangup')
      this.disabledSelect = false
      this.statusOfPhone = 1
    }
  },
  computed: {
    computedStatusOfPhone() {
      const { statusOfPhone } = this
      return statusOfPhone === CALL ? 'phone_call'
        : statusOfPhone === CALLING ? 'phone_calling'
          : statusOfPhone === RING ? 'phone_ring'
            : 'phone_off'
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
      height: 100vh;
      // padding-top: 60px;
      overflow: hidden;
      .webrtc-room-dialog {
        background: #fff;
        border-radius: 2px;
        box-shadow: 0 1px 5px rgba(0, 0, 0, 0.38);
        box-sizing: border-box;
        position: absolute;
        width: 320px;
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
          line-height: 0;
          font-size: 0;
          background-color: #000;
        }
      }
      .webrtc-room-content__video {
        position: relative;
        width: 100%;
        height: 100%;
        .remoteVideo {
          position: relative;
          width: 100%;
          height: 100%;
          top: 50%;
          left: 50%;
          transform: translate3d(-50%,-50%,0);
          background-color: rgba(0, 0, 0, 0.3);
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
.is-phone_calling {
  background: $--color-primary;
  // animation: scale .6s infinite;
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
</style>
