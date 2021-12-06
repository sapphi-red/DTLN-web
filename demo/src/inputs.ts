const inputMap = {
  sample1: '/inputs/audioset_realrec_airconditioner_2TE3LoA2OUQ.wav',
  sample2: '/inputs/clnsp52_amMeH4u6AO4_snr5_tl-18_fileid_19.wav',
  sample3: '/inputs/clnsp57_bus_84241_3_snr2_tl-30_fileid_300.wav'
}

const load = async (ctx: AudioContext, input: keyof typeof inputMap) => {
  const src = inputMap[input]

  const res = await fetch(src)
  const arrBuf = await res.arrayBuffer()
  const buf = await ctx.decodeAudioData(arrBuf)
  return buf
}

export const getSourceNode = async (ctx: AudioContext, input: string) => {
  if (input === 'microphone') {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const source = ctx.createMediaStreamSource(stream)
    return source
  }
  if (input !== 'sample1' && input !== 'sample2' && input !== 'sample3') {
    throw new Error('Invalid input name')
  }

  const inputBuffer = await load(ctx, input)

  const source = ctx.createBufferSource()
  source.buffer = inputBuffer

  return source
}
