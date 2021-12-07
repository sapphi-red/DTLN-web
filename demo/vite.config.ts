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
          src: 'node_modules/@sapphi-red/dtln-web/node_modules/@tensorflow/tfjs-tflite/dist/**/tflite_web_api_cc*',
          dest: 'tfjs-tflite'
        },
        {
          src: 'node_modules/@sapphi-red/dtln-web/dist/*.tflite',
          dest: 'models'
        },
        {
          src: '../DTLN-aec/audio_samples/*',
          dest: 'inputs'
        }
      ]
    })
  ]
})
