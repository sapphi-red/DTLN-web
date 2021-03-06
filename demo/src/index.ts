import {
  setup,
  sampleRate,
  createDtlnProcessorNode,
  loadModel
} from '@sapphi-red/dtln-web'
import { getSourceNode } from './inputs'

//
;(async () => {
  const pageParams = new URLSearchParams(location.search)
  const type = (() => {
    const t = pageParams.get('type')
    if (t === 'tflite') return 'tflite' as const
    if (t === 'tflite-quant-dynamic') return 'tflite-quant-dynamic'
    if (t === 'tflite-quant-f16') return 'tflite-quant-f16'
    return 'tflite' as const
  })()
  const quant = (() => {
    switch (type) {
      case 'tflite':
        return undefined
      case 'tflite-quant-dynamic':
        return 'dynamic'
      case 'tflite-quant-f16':
        return 'f16'
      default: {
        const t: never = type
        throw new Error(`Unknown type: ${t}`)
      }
    }
  })()

  const $type = document.getElementById(
    `link-type-${type}`
  ) as HTMLAnchorElement
  $type.innerHTML = `<b>${$type.innerHTML}</b>`
  $type.removeAttribute('href')

  console.log('1: Setup...')
  await setup('/dtln-web/')
  await loadModel({ path: '/dtln-web/', quant })
  console.log('1: Setup done')

  const $startButton = document.getElementById(
    'start-button'
  ) as HTMLButtonElement
  const $form = document.getElementById('form') as HTMLFormElement

  const ctx = new AudioContext({ sampleRate })

  let dtln: ScriptProcessorNode | undefined
  let gain: GainNode | undefined
  $form.addEventListener('submit', async e => {
    e.preventDefault()
    $startButton.disabled = true
    ctx.resume()

    const formData = new FormData($form)
    const input = formData.get('input')
    const enabled = formData.has('enabled')
    const channelCount = formData.get('channelCount')
    if (typeof input !== 'string') return
    if (typeof channelCount !== 'string') return
    if (!/\d+/.test(channelCount.trim())) {
      throw new Error('channelCount must be number')
    }
    if (+channelCount < 0 || +channelCount > 2) {
      throw new Error('channelCount must be 1 or 2')
    }

    console.log('2: Loading...')
    const source = await getSourceNode(ctx, input)
    console.log('2: Loaded')

    console.log('3: Start')
    dtln?.disconnect()
    gain?.disconnect()
    dtln = createDtlnProcessorNode(ctx, { channelCount: +channelCount })
    gain = new GainNode(ctx, { gain: 1 })

    if (enabled) {
      source.connect(dtln)
      dtln.connect(gain)
    } else {
      source.connect(gain)
    }
    gain.connect(ctx.destination)
    if (input !== 'microphone') {
      ;(source as AudioBufferSourceNode).start()
    }
    console.log('$START$') // for puppeteer

    source.addEventListener(
      'ended',
      () => {
        console.log('3: Done')
        console.log('$DONE$') // for puppeteer

        dtln?.disconnect()
        gain?.disconnect()
        dtln = undefined
        gain = undefined
      },
      { once: true }
    )

    $startButton.disabled = false
  })

  $startButton.disabled = false
})()
