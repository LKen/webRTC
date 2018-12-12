import { debounce } from '@/utils'
export default {
  // 将在组件同名钩子被调用前 调用
  mounted() {
    this.__resizeHanlder = debounce(() => {
      console.log(132)
    }, 100)
    window.addEventListener('resize', this.__resizeHanlder)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.__resizeHanlder)
  }
}
