import * as tf from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-cpu'
import * as tflite from '@tensorflow/tfjs-tflite'

export const setup = async () => {
  tf.setBackend('cpu')

  tflite.setWasmPath('tfjs-tflite/')

  await tf.ready()
}
