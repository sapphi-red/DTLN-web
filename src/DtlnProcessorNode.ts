import { loadTFLiteModel } from '@tensorflow/tfjs-tflite'
import { blockShift } from './constants'
import { createProcess } from './process'
import { Model1, Model2 } from './model'

/*!
 * Model files license
 * Copyright (c) 2020 Nils L. Westhausen
 * https://github.com/breizhn/DTLN/blob/master/LICENSE
 */
let model1: Model1 | undefined
let model2: Model2 | undefined

export const loadModel = async ({
  path,
  quant
}: {
  path: string
  quant?: 'dynamic' | 'f16'
}) => {
  if (!model1 || !model2) {
    const suffix = quant === undefined ? '' : `_quant_${quant}`
    const [_model1, _model2] = await Promise.all([
      loadTFLiteModel(`${path}model${suffix}_1.tflite`),
      loadTFLiteModel(`${path}model${suffix}_2.tflite`)
    ])
    model1 = _model1 as Model1
    model2 = _model2 as Model2
  }
}

export type DtlnProcessorNodeOptions = {
  /**
   * the number of channels
   *
   * Preferred to set this value to 1 with mobile devices
   * for performance reasons.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createScriptProcessor
   * @default 2
   */
  channelCount: number
}

export const createDtlnProcessorNode = (
  ctx: BaseAudioContext,
  { channelCount = 2 }: DtlnProcessorNodeOptions
) => {
  if (!model1 || !model2) {
    throw new Error(
      'loadModel() should be called before calling createDtlnProcessorNode'
    )
  }

  const shiftCount = 2

  const node = ctx.createScriptProcessor(
    blockShift * shiftCount,
    channelCount,
    channelCount
  )
  const processes = Array.from({ length: channelCount }, () =>
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    createProcess(model1!, model2!)
  )

  node.addEventListener('audioprocess', ({ inputBuffer, outputBuffer }) => {
    for (let i = 0; i < shiftCount; i++) {
      const start = i * blockShift
      const end = (i + 1) * blockShift
      for (
        let channel = 0;
        channel < outputBuffer.numberOfChannels;
        channel++
      ) {
        const input = inputBuffer.getChannelData(channel)
        const output = outputBuffer.getChannelData(channel)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const process = processes[channel]!

        process(input.subarray(start, end), output.subarray(start, end))
      }
    }
  })
  return node
}
