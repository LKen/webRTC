<template>
  <div class="webrtc-container">
    <transition name="collapse-transform">
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
                <i slot='reference' class="el-icon-back registered" @click="handleRegistered"></i>
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
      <div class="top-menu">
        <span class="top-menuItem top-menu__text">欢迎，<label>{{ username }}</label></span>
        <div class="top-menuItem top-menu__select">
          <span class="label">在线用户：</span>
          <el-select v-model="selectedName" filterable placeholder="请选择" @change="handleSelectName">
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </div>
        <span class="top-menuItem top-menu__icon">
          <svg-icon :icon-class="computedStatusOfPhone" :className="'is-' + computedStatusOfPhone"></svg-icon>
        </span>
      </div>
    </div>

    <el-dialog
      custom-class="webrtc-receive"
      title="提示"
      :visible.sync="isRing"
      :modal="false"
      width="30%"
      center>
      <span>需要注意的是内容是默认不居中的</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="isRing = false">取 消</el-button>
        <el-button type="primary" @click="handlePhoneReceive">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import MdInput from '@/components/MDinput'

const CALL = 1
const CALLING = 2
const RING = 3

export default {
  name: 'Dashboard',
  components: {
    MdInput
  },
  data() {
    return {
      isRegistered: true,
      username: 'KLEN',
      isPopover: false,
      statusOfPhone: 1,
      isRing: true,
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
      selectedName: ''
    }
  },
  created() {},
  mounted() {
    /* global particlesJS */
    Promise.all([
      import('particles.js'),
      import('./particles.config.js')
    ]).then(([particles, config]) => {
      particlesJS('particles-js', config)
    })
  },
  methods: {
    handleRegistered() {
      const { username } = this
      if (username.trim() === '') {
        this.isPopover = true
        setTimeout(() => { this.isPopover = false }, 3000)
      } else {
        this.isRegistered = true
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
      console.log(event)
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
.webrtc-container {
  position: relative;
  width: 100%;
  height: 100vh;
  padding: 0;
  margin: 0;
  overflow: hidden;
  .webrtc-register {
    z-index: 1;
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
    .top-menu {
      height: 60px;
      line-height: 60px;
      position: relative;
      background: #fff;
      box-shadow: 0 -1px 10px rgba(0, 0, 0, 0.41);
      font-size: 16px;
      color: #555;
      overflow: hidden;
      .top-menuItem {
        // display: inline-block;
        float: left;
      }
      .top-menu__text {
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
      .top-menu__select {
        margin-left: 120px;
      }
      .top-menu__icon {
        margin-left: 25px;
        & > svg {
          padding: 6px;
          width: 30px;
          height: 30px;
          vertical-align: middle;
          border-radius: 5px;
          fill: #feffff !important;
          user-select: none;
          cursor: pointer;
          transition: all .3 linear;
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
          background: $--color-warning;
        }
        // 通话中
        .is-phone_off {
          background: $--color-danger;
          &:hover {
            transform: scale(1.1)
            
          }
        }
      }
    }
  }
  /deep/ .webrtc-receive {
    margin-top: 0 !important; // 修改dialog样式
    top: 50%;
    transform: translateY(-50%);
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
    transform: rotate(30deg)
  }
  50% {
    transform: rotate(0deg)
  }
  75% {
    transform: rotate(-30deg)
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