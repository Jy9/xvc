# XVC - 虚拟滚动条 Web Component

一个基于原生 Web Components 实现的虚拟滚动条组件（v-scroll），替代浏览器默认滚动条，支持自定义样式、拖拽、轨道点击等交互。

## 功能特性

- 零依赖，纯原生 Web Components
- Shadow DOM 样式隔离
- `::part()` 伪元素暴露内部结构
- CSS 变量主题定制
- ResizeObserver + MutationObserver 自动更新
- Pointer Events 拖拽实现
- Vite 构建打包
- 支持 `disabled` 属性、`scrollTo()` 方法、`scrollTop` 属性

## 技术栈

- 原生 Web Components（Custom Elements + Shadow DOM）
- Vite
- CSS Variables

## 使用方式

```html
<v-scroll style="height: 300px;">
  <div>你的内容...</div>
</v-scroll>
```

## 开发

```bash
npm install
npm run dev
```
