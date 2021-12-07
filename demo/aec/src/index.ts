import {
  setup,
  sampleRate,
  createDtlnAecProcessorNode,
  loadAecModel
} from '@sapphi-red/dtln-web'
import { getSourceNodes } from './inputs'

const getParams = (url: string) => {
  const pageParams = new URL(url).searchParams
  const units = (() => {
    const t = pageParams.get('units')
    if (t === '128') return 128
    if (t === '256') return 256
    if (t === '512') return 512
    return 128
  })()
  const quant = (() => {
    const q = pageParams.get('quant')
    if (q === 'dynamic') return 'dynamic'
    if (q === 'f16') return 'f16'
    return undefined
  })()
  return { units, quant } as const
}

//
;(async () => {
  const { units, quant } = getParams(location.href)

  const $currentLink = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('#links > a')
  ).find($link => {
    const params = getParams($link.href)
    return params.units === units && params.quant === quant
  })
  if ($currentLink) {
    $currentLink.innerHTML = `<b>${$currentLink.innerHTML}</b>`
    $currentLink.removeAttribute('href')
  }

  console.log('1: Setup...')
  await setup('/tfjs-tflite/')
  await loadAecModel({ units, quant })
  console.log('1: Setup done')

  const $startButton = document.getElementById(
    'start-button'
  ) as HTMLButtonElement
  const $form = document.getElementById('form') as HTMLFormElement

  const ctx = new AudioContext({ sampleRate })

  let source: ChannelMergerNode | undefined
  let dtlnAec: ScriptProcessorNode | undefined
  let gain: GainNode | undefined
  $form.addEventListener('submit', async e => {
    e.preventDefault()
    $startButton.disabled = true
    ctx.resume()

    const formData = new FormData($form)
    const input = formData.get('input')
    const enabled = formData.has('enabled')
    if (typeof input !== 'string') return

    console.log('2: Loading...')
    const [sourceMic, sourceLpb] = await getSourceNodes(ctx, input)
    source?.disconnect()
    source = ctx.createChannelMerger(2)
    console.log('2: Loaded')

    console.log('3: Start')
    dtlnAec?.disconnect()
    gain?.disconnect()
    dtlnAec = createDtlnAecProcessorNode(ctx)
    gain = new GainNode(ctx, { gain: 1 })

    if (enabled) {
      sourceMic.connect(source, 0, 0)
      sourceLpb.connect(source, 0, 1)
      source.connect(dtlnAec)
      dtlnAec.connect(gain)
    } else {
      sourceMic.connect(gain)
    }
    gain.connect(ctx.destination)
    if (input !== 'microphone') {
      ;(sourceMic as AudioBufferSourceNode).start()
      ;(sourceLpb as AudioBufferSourceNode).start()
    }
    console.log('$START$') // for puppeteer

    sourceMic.addEventListener(
      'ended',
      () => {
        console.log('3: Done')
        console.log('$DONE$') // for puppeteer

        source?.disconnect()
        dtlnAec?.disconnect()
        gain?.disconnect()
        source = undefined
        dtlnAec = undefined
        gain = undefined
      },
      { once: true }
    )

    $startButton.disabled = false
  })

  $startButton.disabled = false
})()
