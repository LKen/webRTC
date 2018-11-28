import { debounce } from '@/utils'

// 获取原有属性 ie dom元素.currentStyle 火狐谷歌 window.getComputedStyle(dom元素, null);
const getStyle = (function() {
  if (window.document.currentStyle) {
    return (dom, attr) => dom.currentStyle[attr]
  } else {
    return (dom, attr) => getComputedStyle(dom, false)[attr]
  }
})()

export default {
  bind(el, binding, vnode) {
    const dialogHeaderEl = el.querySelector('.webrtc-room-dialog__body')
    const dragDom = el

    dialogHeaderEl.onmousedown = (e) => {
      // 鼠标按下，计算当前元素距离可视区的距离
      const disX = e.clientX - dialogHeaderEl.offsetLeft
      const disY = e.clientY - dialogHeaderEl.offsetTop

      const dragDomWidth = dragDom.offsetWidth
      const dragDomheight = dragDom.offsetHeight

      const screenWidth = document.body.clientWidth
      const screenHeight = document.body.clientHeight

      const minDragDomLeft = dragDom.offsetLeft
      const maxDragDomLeft = screenWidth - dragDom.offsetLeft - dragDomWidth

      const minDragDomTop = dragDom.offsetTop
      const maxDragDomTop = screenHeight - dragDom.offsetTop - dragDomheight

      // 获取到的值带px 正则匹配替换
      let styL = getStyle(dragDom, 'left')
      let styT = getStyle(dragDom, 'top')

      if (styL.includes('%')) {
        styL = +document.body.clientWidth * (+styL.replace(/\%/g, '') / 100)
        styT = +document.body.clientHeight * (+styT.replace(/\%/g, '') / 100)
      } else {
        styL = +styL.replace(/\px/g, '')
        styT = +styT.replace(/\px/g, '')
      }

      document.onmousemove = function(e) {
        // 通过事件委托，计算移动的距离
        let left = e.clientX - disX
        let top = e.clientY - disY

        // 边界处理
        if (-(left) > minDragDomLeft) {
          left = -minDragDomLeft
        } else if (left > maxDragDomLeft) {
          left = maxDragDomLeft
        }

        if (-(top) > minDragDomTop) {
          top = -minDragDomTop
        } else if (top > maxDragDomTop) {
          top = maxDragDomTop
        }

        // 移动当前元素
        dragDom.style.cssText += `;left:${left + styL}px;top:${top + styT}px;`

        // emit onDrag event for component
        // vnode.child.$emit('dragDialog')
      }

      document.onmouseup = function(e) {
        document.onmousemove = null
        document.onmouseup = null
      }
    }
  },
  inserted(el, binding, vnode) {
    const dialogHeaderEl = el.querySelector('.webrtc-room-dialog__body')
    const dragDom = el
    const parentDom = dragDom.parentNode
    dialogHeaderEl.style.cssText += ';cursor:move;'

    adjust()

    el.__resizeHanlder = debounce(adjust, 100)

    window.addEventListener('resize', el.__resizeHanlder)

    function adjust() {
      const ratio = 320 / 240
      const width = window.innerWidth * 0.25 < 160 ? 160
        : window.innerWidth * 0.25 > 320 ? 320
          : window.innerWidth * 0.25
      const height = width / ratio < 120 ? 120
        : width / ratio > 320 ? 320
          : width / ratio
      const pwidth = parentDom.clientWidth
      dragDom.style.cssText += `;top:0px;left:${pwidth - width}px;width:${width}px;height:${height}px`
    }
  },
  unbind(el) {
    el.__resizeHanlder && window.removeEventListener('resize', el.__resizeHanlder)
  }
}
