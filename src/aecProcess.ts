import * as tf from '@tensorflow/tfjs-core'
import { blockLen, blockShift } from './constants'
import { addHead, irfft, rfft } from './fn'
import { AecModel1, AecModel2 } from './model'

export const createAecProcess = (model1: AecModel1, model2: AecModel2) => {
  const inputDetails1 = model1.inputs
  const outputDetails1 = model1.outputs

  const inputDetails2 = model2.inputs
  const outputDetails2 = model2.outputs

  let states1 = tf.zeros(inputDetails1[2].shape, 'float32')
  let states2 = tf.zeros(inputDetails2[1].shape, 'float32')

  const inBuffer = new Float32Array(blockLen)
  const inBufferLpb = new Float32Array(blockLen)
  const outBuffer = new Float32Array(blockLen)

  /**
   * @param inputMic must be 128 len
   * @param inputLpb must be 128 len
   * @param output must be 128 len
   */
  return (
    inputMic: Float32Array,
    inputLpb: Float32Array,
    output: Float32Array
  ) => {
    if (inputMic.length !== blockShift) {
      throw new Error(`the length of inputMic must be ${blockShift}.`)
    }
    if (inputLpb.length !== blockShift) {
      throw new Error(`the length of inputLpb must be ${blockShift}.`)
    }
    if (output.length !== blockShift) {
      throw new Error(`the length of output must be ${blockShift}.`)
    }

    inBuffer.copyWithin(0, blockShift)
    inBuffer.set(inputMic, inBuffer.length - blockShift)
    inBufferLpb.copyWithin(0, blockShift)
    inBufferLpb.set(inputLpb, inBuffer.length - blockShift)

    const inBlockFft = rfft(inBuffer)
    const inMag = tf.tidy(() => tf.reshape(tf.abs(inBlockFft), [1, 1, -1]))

    const lpbBlockFft = rfft(inBufferLpb)
    const lpbMag = tf.tidy(() => tf.reshape(tf.abs(lpbBlockFft), [1, 1, -1]))
    lpbBlockFft.dispose()

    const res1 = model1.predict({
      [inputDetails1[1].name]: inMag,
      [inputDetails1[0].name]: lpbMag,
      [inputDetails1[2].name]: states1
    })
    inMag.dispose()
    lpbMag.dispose()
    states1.dispose()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outMask = res1[outputDetails1[1].name]!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    states1 = tf.tensor(res1[outputDetails1[0].name]!.arraySync()) // recreate to avoid "Cannot perform %TypedArray%.prototype.values on a detached ArrayBuffer"

    const estimatedBlockMasked = tf.mul(inBlockFft, outMask)
    inBlockFft.dispose()
    outMask.dispose()
    const estimatedBlockTemp = irfft(estimatedBlockMasked)
    estimatedBlockMasked.dispose()
    const estimatedBlock = tf.tidy(() =>
      tf.reshape(estimatedBlockTemp, [1, 1, -1])
    )
    estimatedBlockTemp.dispose()
    const inLpb = tf.tidy(() => tf.reshape(tf.tensor(inBufferLpb), [1, 1, -1]))

    const res2 = model2.predict({
      [inputDetails2[1].name]: states2,
      [inputDetails2[0].name]: estimatedBlock,
      [inputDetails2[2].name]: inLpb
    })
    states2.dispose()
    estimatedBlock.dispose()
    inLpb.dispose()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outBlock = res2[outputDetails2[1].name]!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    states2 = tf.tensor(res2[outputDetails2[0].name]!.arraySync()) // recreate to avoid "Cannot perform %TypedArray%.prototype.values on a detached ArrayBuffer"

    outBuffer.copyWithin(0, blockShift)
    outBuffer.fill(0, -blockShift)
    addHead(outBuffer, outBlock.dataSync())
    outBlock.dispose()

    // check for clipping
    // const m = tf.tidy(
    //   () => tf.max(outBuffer.subarray(0, blockShift)).dataSync()[0]!
    // )
    // if (m > 1) {
    //   console.log('m > 1: ', m)
    // }

    output.set(outBuffer.subarray(0, blockShift))
  }
}
