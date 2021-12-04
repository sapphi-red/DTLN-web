import * as tf from '@tensorflow/tfjs-core'
import { blockLen, blockShift } from './constants'
import { angle, imagExp, irfft, rfft } from './fn'
import { Model1, Model2 } from './model'

export const createProcess = (model1: Model1, model2: Model2) => {
  const inputDetails1 = model1.inputs
  // const outputDetails1 = model1.outputs

  const inputDetails2 = model2.inputs
  // const outputDetails2 = model2.outputs

  let states1 = tf.zeros(inputDetails1[1].shape, 'float32')
  let states2 = tf.zeros(inputDetails2[1].shape, 'float32')

  const inBuffer = new Float32Array(blockLen)
  const outBuffer = new Float32Array(blockLen)

  /**
   * @param input must be 128 len
   * @param output must be 128 len
   */
  return (input: Float32Array, output: Float32Array) => {
    if (input.length !== blockShift) {
      throw new Error(`the length of input must be ${blockShift}.`)
    }
    if (output.length !== blockShift) {
      throw new Error(`the length of output must be ${blockShift}.`)
    }

    inBuffer.copyWithin(0, blockShift)
    inBuffer.set(input, inBuffer.length - blockShift)

    const inBlockFft = rfft(inBuffer)
    const inMag = tf.tidy(() => tf.reshape(tf.abs(inBlockFft), [1, 1, -1]))
    const inPhase = angle(inBlockFft)
    inBlockFft.dispose()

    const res1 = model1.predict({
      [inputDetails1[1].name]: states1,
      [inputDetails1[0].name]: inMag
    })
    states1.dispose()
    const outMask = res1['Identity' /* outputDetails1[0].name */]
    states1 = res1['Identity_1' /* outputDetails1[1].name */]

    const estimatedComplex = tf.tidy(() =>
      tf.mul(tf.mul(inMag, outMask), imagExp(inPhase))
    )
    const estimatedBlockTemp = irfft(estimatedComplex)
    estimatedComplex.dispose()
    const estimatedBlock = tf.tidy(() =>
      tf.reshape(estimatedBlockTemp, [1, 1, -1])
    )
    estimatedBlockTemp.dispose()

    const res2 = model2.predict({
      [inputDetails2[1].name]: states2,
      [inputDetails2[0].name]: estimatedBlock
    })
    states2.dispose()
    estimatedBlock.dispose()
    const outBlock = res2['Identity' /* outputDetails2[0].name */]
    states2 = res2['Identity_1' /* outputDetails2[1].name */]

    outBuffer.copyWithin(0, blockShift)
    outBuffer.fill(0, -blockShift)
    const outBufferHeadResult = tf.tidy(() =>
      tf.add(outBuffer.subarray(0, blockLen), tf.squeeze(outBlock))
    )
    outBuffer.set(outBufferHeadResult.dataSync(), 0)
    outBufferHeadResult.dispose()
    outBlock.dispose()

    output.set(outBuffer.subarray(0, blockShift))
  }
}
