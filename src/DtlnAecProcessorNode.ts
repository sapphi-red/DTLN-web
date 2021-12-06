import { loadTFLiteModel } from '@tensorflow/tfjs-tflite'
import { blockShift } from './constants'
import { createAecProcess } from './aecProcess'
import { AecModel1, AecModel2 } from './model'

/*!
 * Model files license
 * Copyright (c) 2020 Nils L. Westhausen
 * https://github.com/breizhn/DTLN-aec/blob/master/LICENSE
 */
let model1: AecModel1 | undefined
let model2: AecModel2 | undefined

export const loadAecModel = async ({
  path = '/models',
  units = 512
}: {
  path?: string
  units?: 128 | 256 | 512
}) => {
  if (!model1 || !model2) {
    const [_model1, _model2] = await Promise.all([
      loadTFLiteModel(`${path}/dtln_aec_${units}_1.tflite`),
      loadTFLiteModel(`${path}/dtln_aec_${units}_2.tflite`)
    ])
    model1 = _model1 as AecModel1
    model2 = _model2 as AecModel2
  }
}

/**
 * connect mic first and lpb second
 */
export const createDtlnAecProcessorNode = (ctx: BaseAudioContext) => {
  if (!model1 || !model2) {
    throw new Error(
      'loadModel() should be called before calling createDtlnProcessorNode'
    )
  }

  const inputChannelCount = 2
  const outputChannelCount = 1
  const shiftCount = 2

  const node = ctx.createScriptProcessor(
    blockShift * shiftCount,
    inputChannelCount,
    outputChannelCount
  )
  const processes = Array.from({ length: inputChannelCount / 2 }, () =>
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    createAecProcess(model1!, model2!)
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
        const inputMic = inputBuffer.getChannelData(2 * channel)
        const inputLpb = inputBuffer.getChannelData(2 * channel + 1)
        const output = outputBuffer.getChannelData(channel)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const process = processes[channel]!

        process(
          inputMic.subarray(start, end),
          inputLpb.subarray(start, end),
          output.subarray(start, end)
        )
      }
    }
  })
  return node
}
