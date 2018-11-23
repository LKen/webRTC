<template>
  <div class="webrtc-container">
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
            <i class="el-icon-back registered"></i>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="webrtc-room"></div>
  </div>
</template>

<script>
import MdInput from '@/components/MDinput'
export default {
  name: 'Dashboard',
  components: {
    MdInput
  },
  data() {
    return {
      isRegistered: false,
      username: ''
    }
  },
  created() {},
  mounted() {}
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
$btn-primary: #00dfb9;
$btn-primary--focus: #55efd5;

* {
  box-sizing: border-box;
}
%full-screen {
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
}
.webrtc-container {
  position: relative;
  width: 100%;
  height: 100vh;
  padding: 0;
  margin: 0;
  overflow: hidden;
  .webrtc-register {
    position: absolute;
    z-index: 1;
    @extend %full-screen;
    .webrtc-register__head {
      position: fixed;
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
          }
          .material-input {
            font-size: 16px;
            padding-bottom: 6px;
            color: #333;
          }
          .material-label {
            top: 14px;
            left: 40px;
          }
          &.material--raised {
            .material-label {
              top: -28px;
              left: 0;
            }
          }
        }
        .registered {
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
}
</style>