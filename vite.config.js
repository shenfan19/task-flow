import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import { builtinModules } from 'node:module';

export default defineConfig({
  publicDir: false,
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '.'
        }
      ]
    })
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'main.ts'),
      name: 'TasksFlowchart',
      fileName: () => 'main.js',
      formats: ['cjs']
    },
    // dist/ is one of the folders Obsidian's community directory checks for
    // main.js when it verifies a release against the source. It holds a
    // complete plugin folder: main.js, styles.css and manifest.json.
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'obsidian',
        'electron',
        ...builtinModules
      ],
      output: {
        globals: {
          obsidian: 'obsidian'
        },
        banner: '/* Tasks Flowchart Obsidian Plugin */',
        // Obsidian loads a plugin's CSS from styles.css; library mode would
        // otherwise name it style.css.
        assetFileNames: (asset) => (asset.name === 'style.css' ? 'styles.css' : asset.name),
      }
    }
  }
});
