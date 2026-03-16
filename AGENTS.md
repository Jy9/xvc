# AGENTS.md - AI 辅助开发规范

## 项目概述

本项目是一个原生 Web Components 实现的虚拟滚动条组件 (v-scroll)，使用浏览器原生 API，零依赖，支持 Vite 构建。

## 文件结构

```
├── demo.html           # 演示页面（可直接运行）
├── v-scroll.js         # 核心组件文件（ESM）
├── v-scroll.css        # 组件样式文件（CSS 伪元素）
├── vite.config.js      # Vite 配置及自定义插件
├── package.json        # 项目配置
├── svg/                # SVG 资源文件
│   ├── grab.svg        # 抓手光标
│   └── scroll.svg      # 滚动光标
└── AGENTS.md          # 本文件
```

## 技术实现要点

### 1. 结构与样式隔离

- 使用 `customElements.define('v-scroll', VScroll)` 注册组件
- 使用 `::part()` 伪元素暴露内部结构给外部 CSS 控制
- 样式独立于 `v-scroll.css`，通过 CSS 变量实现主题定制
- 外层容器使用 `overflow: auto` 原生滚动，CSS 隐藏默认滚动条

### 2. 尺寸探测与生命周期管理

- 使用 `ResizeObserver` 监听容器尺寸变化
- 使用 `MutationObserver` 监听内容变化
- 滑块高度自适应，最小高度 16px
- `disconnectedCallback` 中销毁所有监听器和观察者

### 3. 指针捕捉与拖拽映射

- 使用原生 `Pointer Events` API
- `setPointerCapture()` / `releasePointerCapture()` 实现指针捕捉
- 拖拽映射算法：Y 轴偏移量按比例映射到 `scrollTop`
- 考虑 3px CSS 预留间距

### 4. Vite CSS 模块化构建

- 自定义 Vite 插件 `css-to-js-plugin`
- 使用 `configResolved` 钩子读取 CSS 源码
- 压缩 CSS 并包装为 `export default '...'` 格式
- 支持 Import Map 切换主题

## 命名规范

- **类名**: 使用 PascalCase，如 `VScroll`
- **私有属性/方法**: 使用 `_` 前缀，如 `_container`, `_render()`
- **常量**: 使用 UPPER_SNAKE_CASE，如 `TRACK_PADDING`, `THUMB_MIN_HEIGHT`
- **CSS 变量**: 使用 `--v-scroll-` 前缀，如 `--v-scroll-thumb-bg`

## CSS 伪元素

组件通过 `::part()` 暴露以下部分：

| 伪元素 | 说明 |
|--------|------|
| `::part(container)` | 滚动容器 |
| `::part(content)` | 内容包装器 |
| `::part(scrollbar)` | 滚动条容器 |
| `::part(track)` | 滚动轨道 |
| `::part(thumb)` | 滚动滑块 |

## CSS 变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `--v-scroll-track-bg` | transparent | 轨道背景色 |
| `--v-scroll-track-bg-hover` | rgba(0, 0, 0, 0.05) | 轨道悬浮背景色 |
| `--v-scroll-thumb-bg` | rgba(0, 0, 0, 0.2) | 滑块背景色 |
| `--v-scroll-thumb-bg-hover` | rgba(0, 0, 0, 0.4) | 滑块悬浮背景色 |
| `--v-scroll-thumb-bg-dragging` | rgba(0, 0, 0, 0.5) | 滑块拖拽背景色 |
| `--v-scroll-thumb-radius` | 5px | 滑块圆角 |
| `--v-scroll-thumb-min-height` | 16px | 滑块最小高度 |
| `--v-scroll-track-padding` | 3px | 轨道内边距 |
| `--v-scroll-width` | 14px | 滚动条宽度 |

## 使用方式

### 基本使用

```html
<script type="importmap">
{
  "imports": {
    "$/": "./"
  }
}
</script>
<script type="module" src="./v-scroll.js"></script>

<v-scroll style="height: 400px;">
  <div>内容 1</div>
  <div>内容 2</div>
  <!-- 更多内容... -->
</v-scroll>
```

### 自定义样式

```css
v-scroll {
  --v-scroll-thumb-bg: #007bff;
  --v-scroll-thumb-bg-hover: #0056b3;
  --v-scroll-thumb-bg-dragging: #004494;
}

v-scroll::part(thumb):hover {
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.5);
}
```

## API

### 属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `disabled` | Boolean | false | 禁用滚动条 |

### 方法

| 方法名 | 参数 | 说明 |
|--------|------|------|
| `scrollTo(options)` | ScrollToOptions | 滚动到指定位置 |
| `refresh()` | - | 刷新滚动条状态 |

### 属性访问

| 属性 | 类型 | 说明 |
|------|------|------|
| `scrollTop` | Number | 获取/设置滚动位置 |

## 浏览器兼容性

- Chrome 54+
- Firefox 63+
- Safari 10.1+
- Edge 79+

## 构建命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```
