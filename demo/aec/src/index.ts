import {
  setup,
  sampleRate,
  createDtlnAecProcessorNode,
  loadAecModel
} from '@sapphi-red/dtln-web'
import { getSourceNodes } from './inputs'

//
;(async () => {
  const pageParams = new URLSearchParams(location.search)
  const units = (() => {
    const t = pageParams.get('units')
    if (t === '128') return 128
    if (t === '256') return 256
    if (t === '512') return 512
    return 128
  })()

  const $units = document.getElementById(
    `link-type-${units}`
  ) as HTMLAnchorElement
  $units.innerHTML = `<b>${$units.innerHTML}</b>`
  $units.removeAttribute('href')

  console.log('1: Setup...')
  await setup('/tfjs-tflite/')
  await loadAecModel({ units })
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
