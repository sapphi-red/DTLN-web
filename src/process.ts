import * as tf from '@tensorflow/tfjs-core'
import { blockLen, blockShift } from './constants'
import { addHead, angle, imagExp, irfft, rfft } from './fn'
import { Model1, Model2 } from './model'

export const createProcess = (model1: Model1, model2: Model2) => {
  const inputDetails1 = model1.inputs
  const outputDetails1 = model1.outputs

  const inputDetails2 = model2.inputs
  const outputDetails2 = model2.outputs

  let states1 = tf.zeros(inputDetails1[0].shape, 'float32')
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
      [inputDetails1[0].name]: states1,
      [inputDetails1[1].name]: inMag
    })
    states1.dispose()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outMask = res1[outputDetails1[0].name]!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    states1 = tf.tensor(res1[outputDetails1[1].name]!.arraySync()) // recreate to avoid "Cannot perform %TypedArray%.prototype.values on a detached ArrayBuffer"

    const estimatedComplex = tf.tidy(() =>
      tf.mul(tf.mul(inMag, outMask), imagExp(inPhase))
    )
    inMag.dispose()
    outMask.dispose()
    inPhase.dispose()
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outBlock = res2[outputDetails2[1].name]!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    states2 = tf.tensor(res2[outputDetails2[0].name]!.arraySync()) // recreate to avoid "Cannot perform %TypedArray%.prototype.values on a detached ArrayBuffer"

    outBuffer.copyWithin(0, blockShift)
    outBuffer.fill(0, -blockShift)
    addHead(outBuffer, outBlock.dataSync())
    outBlock.dispose()

    output.set(outBuffer.subarray(0, blockShift))
  }
}
