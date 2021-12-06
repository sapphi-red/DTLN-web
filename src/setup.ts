import * as tf from '@tensorflow/tfjs'
import * as tflite from '@tensorflow/tfjs-tflite'

export const setup = async (tfliteWasmPath: string) => {
  tf.setBackend('cpu')

  tflite.setWasmPath(tfliteWasmPath)

  await tf.ready()
}
