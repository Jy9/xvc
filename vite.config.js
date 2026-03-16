import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const css_to_js_plugin = () => ({
  name: 'css-to-js-plugin',
  
  configResolved(config) {
    const css_path = join(config.root, 'v-scroll.css');
    const js_path = join(config.root, 'dist', 'v-scroll.css.js');
    
    if (existsSync(css_path)) {
      let css_content = readFileSync(css_path, 'utf-8');
      
      css_content = css_content
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{};:,])\s*/g, '$1')
        .replace(/;}/g, '}')
        .trim();
      
      const js_content = `export default ${JSON.stringify(css_content)};`;
      
      const dist_dir = dirname(js_path);
      if (!existsSync(dist_dir)) {
        mkdirSync(dist_dir, { recursive: true });
      }
      
      writeFileSync(js_path, js_content, 'utf-8');
      
      console.log(`[css-to-js-plugin] Generated ${js_path}`);
    }
  }
});

export default {
  plugins: [css_to_js_plugin()],
  
  resolve: {
    alias: {
      '$': __dirname
    }
  },
  
  build: {
    lib: {
      entry: 'v-scroll.js',
      name: 'VScroll',
      fileName: 'v-scroll',
      formats: ['es', 'umd']
    },
    
    rollupOptions: {
      output: {
        assetFileNames: '[name].[ext]'
      }
    }
  },
  
  server: {
    port: 3005,
    open: '/demo.html'
  }
};