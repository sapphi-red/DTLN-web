import { defineConfig } from 'vite'
import { staticCopyPlugin } from './vite-static-copy-plugin'

export default defineConfig({
  build: {
    target: 'esnext'
  },
  plugins: [
    staticCopyPlugin({
      targets: [
        {
          src: 'node_modules/@sapphi-red/dtln-web/node_modules/@tensorflow/tfjs-tflite/dist/**/tflite_web_api_cc*',
          dest: 'tfjs-tflite'
        },
        {
          src: 'node_modules/@sapphi-red/dtln-web/dist/*.tflite',
          dest: 'models'
        }
      ]
    })
  ]
})
