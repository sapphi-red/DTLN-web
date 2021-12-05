import {
  sampleRate,
  createDtlnProcessorNode,
  loadModel
} from '@sapphi-red/dtln-web'
import { getSourceNode } from './inputs'
import { setup } from './setup'

//
;(async () => {
  const pageParams = new URLSearchParams(location.search)
  const type = (() => {
    const t = pageParams.get('type')
    if (t === 'tflite') return 'tflite' as const
    if (t === 'tflite-quant') return 'tflite-quant'
    return 'tflite' as const
  })()

  const $type = document.getElementById(
    `link-type-${type}`
  ) as HTMLAnchorElement
  $type.innerHTML = `<b>${$type.innerHTML}</b>`
  $type.removeAttribute('href')

  console.log('1: Setup...')
  await setup()
  await loadModel({ quant: type === 'tflite-quant' })
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

    source.addEventListener(
      'ended',
      () => {
        console.log('3: Done')

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
