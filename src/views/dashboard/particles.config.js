const bgColor = '#555'

module.exports = {
  'particles': {
    'number': {
      'value': 50, // 粒子的数量
      'density': { // 粒子的稀密程度
        'enable': true, // 启用粒子的稀密程度 (true 或 false)
        'value_area': 1000 //  每一个粒子占据的空间(启用粒子密度,才可用)
      }
    },
    'color': {
      'value': bgColor //  粒子的颜色 (支持16进制”#b61924”,rgb”{r:182, g:25, b:36}”,hsl,以及random)
    },
    'shape': {
      'type': 'circle', // 粒子的形状 "circle" "edge" "triangle" "polygon" "star" "image" ["circle", "triangle", "image"]
      'stroke': {
        'width': 0, // 边框
        'color': '#000000'
      },
      'polygon': {
        'nb_sides': 6
      },
      'image': {
        'src': 'img/github.svg',
        'width': 100,
        'height': 100
      }
    },
    'opacity': { // 粒子的透明度
      'value': 0.4,
      'random': true,
      'anim': { // 开启透明的变动动画
        'enable': true,
        'speed': 2,
        'opacity_min': 0.1,
        'sync': true
      }
    },
    'size': {
      'value': 4,
      'random': true,
      'anim': { // 是否启用粒子宽度动画(true/false)
        'enable': true,
        'speed': 1, // 粒子动画频率
        'size_min': 0.1,
        'sync': true // 粒子运行速度与动画是否同步
      }
    },
    'line_linked': {
      'enable': true,
      'distance': 180,
      'color': bgColor,
      'opacity': 0.4,
      'width': 1
    },
    'move': { // 粒子移动速度
      'enable': true,
      'speed': 3,
      'direction': 'none', // "none","top","top-right","right","bottom-right","bottom","bottom-left","left","top-left"
      'random': true, // 随机方向
      'straight': false, // 直接移动 直接锁定就有
      'out_mode': 'out',
      'attract': { // 原子之间的吸引
        'enable': true,
        'rotateX': 3000,
        'rotateY': 1500
      }
    }
  },
  'interactivity': {
    'detect_on': 'canvas',
    'events': {
      'onhover': {
        'enable': true,
        'mode': 'grab' // "grab"  抓取临近的  "bubble"  泡沫球效果 "repulse"  击退效果 ["grab", "bubble"]
      },
      'onclick': {
        'enable': true,
        'mode': 'repulse'
      },
      'resize': true
    },
    'modes': {
      'grab': {
        'distance': 200,
        'line_linked': {
          'opacity': 1
        }
      },
      'bubble': {
        'distance': 400,
        'size': 40,
        'duration': 2,
        'opacity': 8,
        'speed': 3
      },
      'repulse': {
        'distance': 200
      },
      'push': {
        'particles_nb': 4
      },
      'remove': {
        'particles_nb': 2
      }
    }
  },
  'retina_detect': true,
  'config_demo': {
    'hide_card': true,
    'background_color': '#b61924',
    'background_image': '',
    'background_position': '50% 50%',
    'background_repeat': 'no-repeat',
    'background_size': 'cover'
  }
}
