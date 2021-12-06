const inputMap = {
  sample1: {
    mic: '/inputs/9mkQhVtzTEy2hDk-6u2Sww_farend_singletalk_mic.wav',
    lpb: '/inputs/9mkQhVtzTEy2hDk-6u2Sww_farend_singletalk_lpb.wav'
  },
  sample2: {
    mic: '/inputs/DLhjtuwiEkS-68TsUVvW5g_nearend_singletalk_mic.wav',
    lpb: '/inputs/DLhjtuwiEkS-68TsUVvW5g_nearend_singletalk_lpb.wav'
  },
  sample3: {
    mic: '/inputs/DMTgmZwtgUilp4omPK7-OQ_doubletalk_mic.wav',
    lpb: '/inputs/DMTgmZwtgUilp4omPK7-OQ_doubletalk_lpb.wav'
  }
}

const load = async (ctx: AudioContext, src: string) => {
  const res = await fetch(src)
  const arrBuf = await res.arrayBuffer()
  const buf = await ctx.decodeAudioData(arrBuf)
  return buf
}

const loadBoth = async (ctx: AudioContext, input: keyof typeof inputMap) => {
  const src = inputMap[input]
  return await Promise.all([load(ctx, src.mic), load(ctx, src.lpb)])
}

export const getSourceNodes = async (ctx: AudioContext, input: string) => {
  if (input === 'microphone') {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const source = ctx.createMediaStreamSource(stream)
    return [source, source]
  }
  if (input !== 'sample1' && input !== 'sample2' && input !== 'sample3') {
    throw new Error('Invalid input name')
  }

  const [inputBufferMic, inputBufferLpb] = await loadBoth(ctx, input)

  const sourceMic = ctx.createBufferSource()
  sourceMic.buffer = inputBufferMic

  const sourceLpb = ctx.createBufferSource()
  sourceLpb.buffer = inputBufferLpb

  return [sourceMic, sourceLpb] as const
}
