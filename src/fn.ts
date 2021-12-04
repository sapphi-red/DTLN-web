import * as tf from '@tensorflow/tfjs-core'
import FFT from 'fft.js'
import { blockLen } from './constants'

export const angle = (complexes: tf.Tensor) =>
  tf.tidy(() => {
    const reals = tf.squeeze(tf.real(complexes))
    const imags = tf.squeeze(tf.imag(complexes))
    return tf.atan2(imags, reals)
  })

/**
 * f(x) = exp(xj) = cos(x) + jsin(x)
 */
export const imagExp = (x: tf.Tensor) =>
  tf.tidy(() => {
    const real = tf.cos(x)
    const imag = tf.sin(x)
    return tf.complex(real, imag)
  })

const fft = new FFT(blockLen)

/**
 * This function has a same behavior with tf.spectral.rfft(input)
 *
 * Use this instead of it for performance reasons.
 */
export const rfft = (inputArr: ArrayLike<number>) => {
  // const inputArr = input.arraySync()
  const outputArr = fft.createComplexArray()
  fft.realTransform(outputArr, inputArr)

  const resultLen = Math.floor(inputArr.length / 2) + 1
  const realArr = new Float32Array(resultLen)
  const imagArr = new Float32Array(resultLen)
  for (let i = 0; i < resultLen * 2; i += 2) {
    realArr[i / 2] = outputArr[i]
    imagArr[i / 2] = outputArr[i + 1]
  }
  return tf.complex(realArr, imagArr)
}

/**
 * This function has a same behavior with tf.spectral.irfft(input)
 *
 * Use this instead of it for performance reasons.
 */
export const irfft = (input: tf.Tensor) => {
  const inputArr = tf.tidy(() => tf.squeeze(input)).arraySync()
  fft.completeSpectrum(inputArr)

  const outputArr = fft.createComplexArray()
  fft.inverseTransform(outputArr, inputArr)
  const outputReal = fft.fromComplexArray(outputArr, undefined)
  return tf.tensor1d(outputReal)
}
