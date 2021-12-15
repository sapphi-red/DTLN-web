import fs from 'fs/promises'
import fg from 'fast-glob'
import path from 'path'

const modelFiles = await fg(['./models/*.tflite'])
await Promise.all(
  modelFiles.map(modelFile => {
    const filename = path.basename(modelFile)
    return fs.copyFile(modelFile, path.join('dist/', filename))
  })
)

const tfliteWasmFiles = await fg([
  './node_modules/@tensorflow/tfjs-tflite/dist/tflite_web_api_cc*'
])
await Promise.all(
  tfliteWasmFiles.map(tfliteWasmFile => {
    const filename = path.basename(tfliteWasmFile)
    return fs.copyFile(tfliteWasmFile, path.join('dist/', filename))
  })
)
