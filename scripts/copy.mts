import fs from 'fs/promises'
import fg from 'fast-glob'
import path from 'path'

const modelFiles = await fg([
  './models/*.tflite',
  './DTLN-aec/pretrained_models/*.tflite'
])
await Promise.all(
  modelFiles.map(modelFile => {
    const filename = path.basename(modelFile)
    return fs.copyFile(modelFile, path.join('dist/', filename))
  })
)
