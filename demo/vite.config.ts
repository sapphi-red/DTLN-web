import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'

export default defineConfig({
  build: {
    target: 'es2019',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        aec: path.resolve(__dirname, 'aec/index.html')
      }
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@sapphi-red/dtln-web/dist/*',
          dest: 'dtln-web'
        },
        {
          src: '../DTLN-aec/audio_samples/*',
          dest: 'inputs'
        }
      ]
    })
  ]
})
