// 虚拟滚动条组件 - 符合文档需求实现

class VScroll extends HTMLElement {
  static get observedAttributes() {
    return ['disabled'];
  }

  constructor() {
    super();
    // 私有属性
    this._root = null;
    this._container = null;
    this._scrollbar = null;
    this._track = null;
    this._thumb = null;
    this._resizeObserver = null;
    this._mutationObserver = null;
    this._isDragging = false;
    this._dragStartY = 0;
    this._dragStartScrollTop = 0;
    this._contentHeight = 0;
    this._containerHeight = 0;
    this._scrollbarVisible = false;
    this._isScrolling = false;
    this._scrollTimeout = null;
    
    // 常量
    this.TRACK_PADDING = 3;
    this.THUMB_MIN_HEIGHT = 16;
  }

  connectedCallback() {
    this._root = this.attachShadow({ mode: 'open' });
    this._render();
    this._setupEventListeners();
    this._setupObservers();
    this._updateScrollbar();
  }

  disconnectedCallback() {
    this._cleanup();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'disabled') {
      this._updateScrollbar();
    }
  }

  _render() {
    // 保存原始内容
    const content = this.innerHTML;
    this.innerHTML = '';
    this._root.innerHTML = '';
    
    // 注入CSS
    const style = document.createElement('style');
    style.textContent = this._getCSS();
    this._root.appendChild(style);
    
    // 创建容器
    this._container = document.createElement('div');
    this._container.setAttribute('part', 'container');
    
    // 创建内容包装器
    const contentWrapper = document.createElement('div');
    contentWrapper.setAttribute('part', 'content');
    contentWrapper.innerHTML = content;
    
    this._container.appendChild(contentWrapper);
    this._root.appendChild(this._container);
    
    // 创建滚动条
    this._scrollbar = document.createElement('div');
    this._scrollbar.setAttribute('part', 'scrollbar');
    
    // 创建轨道
    this._track = document.createElement('div');
    this._track.setAttribute('part', 'track');
    
    // 创建滑块
    this._thumb = document.createElement('div');
    this._thumb.setAttribute('part', 'thumb');
    
    this._scrollbar.appendChild(this._track);
    this._scrollbar.appendChild(this._thumb);
    this._root.appendChild(this._scrollbar);
  }

  _getCSS() {
    return `
      :host {
        --v-scroll-track-bg: transparent;
        --v-scroll-track-bg-hover: rgba(0, 0, 0, 0.05);
        --v-scroll-thumb-bg: rgba(0, 0, 0, 0.2);
        --v-scroll-thumb-bg-hover: rgba(0, 0, 0, 0.4);
        --v-scroll-thumb-bg-dragging: rgba(0, 0, 0, 0.5);
        --v-scroll-thumb-radius: 5px;
        --v-scroll-thumb-min-height: 16px;
        --v-scroll-track-padding: 3px;
        --v-scroll-width: 14px;
        display: block;
        position: relative;
        overflow: hidden;
      }

      [part="container"] {
        position: absolute;
        top: 0;
        left: 0;
        right: var(--v-scroll-width);
        bottom: 0;
        overflow-y: auto;
        overflow-x: hidden;
      }

      [part="container"]::-webkit-scrollbar {
        width: 0;
        height: 0;
      }

      [part="scrollbar"] {
        position: absolute;
        top: 0;
        right: 0;
        width: var(--v-scroll-width);
        height: 100%;
        background: var(--v-scroll-track-bg);
        z-index: 10;
        transition: background-color 0.15s ease;
      }

      [part="scrollbar"]:hover {
        background: var(--v-scroll-track-bg-hover);
      }

      [part="track"] {
        position: absolute;
        top: var(--v-scroll-track-padding);
        right: var(--v-scroll-track-padding);
        width: calc(var(--v-scroll-width) - var(--v-scroll-track-padding) * 2);
        bottom: var(--v-scroll-track-padding);
        background: transparent;
        border-radius: var(--v-scroll-thumb-radius);
      }

      [part="thumb"] {
        position: absolute;
        right: var(--v-scroll-track-padding);
        width: calc(var(--v-scroll-width) - var(--v-scroll-track-padding) * 2);
        min-height: var(--v-scroll-thumb-min-height);
        background: var(--v-scroll-thumb-bg);
        border-radius: var(--v-scroll-thumb-radius);
        cursor: grab;
        transition: background-color 0.15s ease, opacity 0.15s ease;
        opacity: 0.8;
      }

      [part="thumb"]:hover {
        background: var(--v-scroll-thumb-bg-hover);
        opacity: 1;
      }

      [part="thumb"].dragging {
        background: var(--v-scroll-thumb-bg-dragging);
        opacity: 1;
        cursor: grabbing;
      }

      :host(.scrolling) [part="container"],
      :host(.scrolling) [part="thumb"] {
        cursor: ns-resize !important;
      }
    `;
  }

  _setupEventListeners() {
    // 滚动事件
    this._container.addEventListener('scroll', () => {
      this._updateThumbPosition();
      
      if (!this._isScrolling) {
        this._isScrolling = true;
        this.classList.add('scrolling');
      }
      
      if (this._scrollTimeout) {
        clearTimeout(this._scrollTimeout);
      }
      
      this._scrollTimeout = setTimeout(() => {
        this._isScrolling = false;
        this.classList.remove('scrolling');
      }, 150);
    });

    // 滑块拖拽事件
    this._thumb.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      
      this._isDragging = true;
      this._dragStartY = e.clientY;
      this._dragStartScrollTop = this._container.scrollTop;
      
      this._thumb.classList.add('dragging');
      this._thumb.setPointerCapture(e.pointerId);
      document.body.style.userSelect = 'none';
    });

    this._thumb.addEventListener('pointermove', (e) => {
      if (!this._isDragging) return;
      
      const deltaY = e.clientY - this._dragStartY;
      const thumbHeight = this._getThumbHeight();
      const trackHeight = this._containerHeight - this.TRACK_PADDING * 2;
      const maxThumbTop = trackHeight - thumbHeight;
      const maxScrollTop = this._contentHeight - this._containerHeight;
      
      if (maxThumbTop <= 0 || maxScrollTop <= 0) return;
      
      const scrollRatio = deltaY / maxThumbTop;
      const newScrollTop = Math.max(0, Math.min(maxScrollTop, this._dragStartScrollTop + scrollRatio * maxScrollTop));
      this._container.scrollTop = newScrollTop;
    });

    this._thumb.addEventListener('pointerup', (e) => {
      if (!this._isDragging) return;
      this._isDragging = false;
      this._thumb.classList.remove('dragging');
      this._thumb.releasePointerCapture(e.pointerId);
      document.body.style.userSelect = '';
    });

    this._thumb.addEventListener('pointercancel', (e) => {
      if (!this._isDragging) return;
      this._isDragging = false;
      this._thumb.classList.remove('dragging');
      this._thumb.releasePointerCapture(e.pointerId);
      document.body.style.userSelect = '';
    });

    // 轨道点击事件
    this._track.addEventListener('pointerdown', (e) => {
      if (e.target !== this._track) return;
      
      const rect = this._track.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const thumbHeight = this._getThumbHeight();
      const trackHeight = this._containerHeight - this.TRACK_PADDING * 2;
      const maxThumbTop = trackHeight - thumbHeight;
      const maxScrollTop = this._contentHeight - this._containerHeight;
      
      if (maxThumbTop <= 0 || maxScrollTop <= 0) return;
      
      const newThumbTop = Math.max(0, Math.min(maxThumbTop, clickY - thumbHeight / 2));
      this._container.scrollTop = (newThumbTop / maxThumbTop) * maxScrollTop;
    });
  }

  _setupObservers() {
    // 监听尺寸变化
    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this) {
          // 组件自身尺寸变化
          this._containerHeight = entry.contentRect.height;
        } else if (entry.target === this._container) {
          // 容器尺寸变化
          this._contentHeight = this._container.scrollHeight;
          this._containerHeight = this._container.clientHeight;
        }
        this._updateScrollbar();
      }
    });
    this._resizeObserver.observe(this);
    this._resizeObserver.observe(this._container);
    
    // 监听内容变化
    this._mutationObserver = new MutationObserver(() => {
      this._contentHeight = this._container.scrollHeight;
      this._updateScrollbar();
    });
    this._mutationObserver.observe(this._container, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  _getThumbHeight() {
    if (this._contentHeight <= 0 || this._containerHeight <= 0) return this.THUMB_MIN_HEIGHT;
    const trackHeight = this._containerHeight - this.TRACK_PADDING * 2;
    const thumbHeight = (this._containerHeight / this._contentHeight) * trackHeight;
    return Math.max(this.THUMB_MIN_HEIGHT, Math.min(thumbHeight, trackHeight));
  }

  _updateThumbPosition() {
    if (!this._thumb || !this._scrollbarVisible) return;
    
    const thumbHeight = this._getThumbHeight();
    const trackHeight = this._containerHeight - this.TRACK_PADDING * 2;
    const maxScrollTop = this._contentHeight - this._containerHeight;
    const maxThumbTop = trackHeight - thumbHeight;
    
    this._thumb.style.height = `${thumbHeight}px`;
    
    if (maxScrollTop > 0 && maxThumbTop > 0) {
      const thumbTop = this.TRACK_PADDING + (this._container.scrollTop / maxScrollTop) * maxThumbTop;
      this._thumb.style.top = `${thumbTop}px`;
    } else {
      this._thumb.style.top = `${this.TRACK_PADDING}px`;
    }
  }

  _updateScrollbar() {
    this._contentHeight = this._container.scrollHeight;
    this._containerHeight = this._container.clientHeight;
    
    const shouldShow = this._containerHeight > 0 && this._contentHeight > this._containerHeight && !this.hasAttribute('disabled');
    
    if (shouldShow !== this._scrollbarVisible) {
      this._scrollbarVisible = shouldShow;
      this._scrollbar.style.display = shouldShow ? 'block' : 'none';
    }
    
    if (shouldShow) {
      this._updateThumbPosition();
    }
  }

  _cleanup() {
    // 移除事件监听器
    if (this._container) {
      this._container.removeEventListener('scroll', this._handleScroll);
    }
    if (this._thumb) {
      this._thumb.removeEventListener('pointerdown', this._handlePointerDown);
      this._thumb.removeEventListener('pointermove', this._handlePointerMove);
      this._thumb.removeEventListener('pointerup', this._handlePointerUp);
      this._thumb.removeEventListener('pointercancel', this._handlePointerUp);
    }
    if (this._track) {
      this._track.removeEventListener('pointerdown', this._handleTrackClick);
    }
    
    // 断开观察者
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._mutationObserver) {
      this._mutationObserver.disconnect();
      this._mutationObserver = null;
    }
    
    // 清除定时器
    if (this._scrollTimeout) {
      clearTimeout(this._scrollTimeout);
      this._scrollTimeout = null;
    }
    
    this._isDragging = false;
  }

  // 公共方法
  scrollTo(options) {
    if (this._container) {
      this._container.scrollTo(options);
    }
  }

  get scrollTop() {
    return this._container ? this._container.scrollTop : 0;
  }

  set scrollTop(value) {
    if (this._container) {
      this._container.scrollTop = value;
    }
  }

  refresh() {
    this._updateScrollbar();
  }
}

// 注册组件
customElements.define('v-scroll', VScroll);

export default VScroll;