import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import builtins from 'builtin-modules';

export default defineConfig({
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
      name: 'FlowyTask',
      fileName: () => 'main.js',
      formats: ['cjs']
    },
    outDir: 'flowy-task',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'obsidian',
        'electron',
        ...builtins
      ],
      output: {
        globals: {
          obsidian: 'obsidian'
        },
        banner: '/* FlowyTask Obsidian Plugin */',
      }
    }
  }
});
