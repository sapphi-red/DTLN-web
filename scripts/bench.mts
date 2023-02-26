import playwright, { CDPSession, ConsoleMessage, Page } from 'playwright-core'

interface CPUUsage {
  timestamp: number
  usage: number
}

// https://github.com/microsoft/playwright/issues/18071
async function getMetrics(client: CDPSession) {
  const perfMetricObject = await client.send('Performance.getMetrics')
  const metricObject = Object.fromEntries(
    perfMetricObject.metrics.map(metric => [metric.name, metric.value])
  )
  return metricObject
}

const fetchMetrics = async (client: CDPSession) => {
  const { Timestamp, TaskDuration } = await getMetrics(client)
  return {
    timestamp: Timestamp ?? 0,
    activeTime: TaskDuration ?? 0
  }
}

const logMetrics = async (page: Page, interval: number) => {
  const client = await page.context().newCDPSession(page)
  await client.send('Performance.enable')

  const { timestamp: startTime, activeTime: startActiveTime } =
    await fetchMetrics(client)
  const snapshots: CPUUsage[] = []

  let lastTimestamp = startTime
  let lastActiveTime = startActiveTime
  const timer = setInterval(async () => {
    const { timestamp, activeTime } = await fetchMetrics(client)
    const frameDuration = timestamp - lastTimestamp
    const activeTimeDiff = activeTime - startActiveTime
    let usage = activeTimeDiff / frameDuration

    if (usage > 1) usage = 1
    snapshots.push({
      timestamp,
      usage
    })

    lastTimestamp = timestamp
    lastActiveTime = activeTime
  }, interval)

  return async () => {
    clearInterval(timer)

    const elapsedTime = lastTimestamp - startTime
    return {
      average: (lastActiveTime - startActiveTime) / elapsedTime,
      snapshots,
      elapsedTime: elapsedTime
    }
  }
}

// -----

const setCPUThrottlingRate = (cdp: CDPSession, rate: number) => {
  cdp.send('Emulation.setCPUThrottlingRate', { rate })
}

const waitForConsole = (page: Page, includeText: string) =>
  new Promise<void>((resolve, reject) => {
    const f = (msg: ConsoleMessage) => {
      try {
        if (msg.type() === 'log') {
          if (msg.text().includes(includeText)) {
            resolve()
            page.off('console', f)
          }
        }
      } catch (e) {
        reject(e)
      }
    }
    page.on('console', f)
  })

const recordMetrics = async (
  page: Page,
  title: string,
  path: string,
  rate: number
) => {
  await page.goto(`http://localhost:5000${path}`)
  const cdpSession = await page.context().newCDPSession(page)
  setCPUThrottlingRate(cdpSession, rate)

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const $startButton = (await page.waitForSelector(
    '#start-button:not([disabled])'
  ))!
  $startButton.click()
  await waitForConsole(page, '$START$')
  const stopLogMetrics = await logMetrics(page, 100)

  await waitForConsole(page, '$DONE$')
  const metricsResult = await stopLogMetrics()

  console.log(`${title}: ${metricsResult.average}`)
}

//
;(async () => {
  const browser = await playwright.chromium.launch()
  const page = await browser.newPage()

  const benchs = [
    {
      title: 'DTLN (CPU throttle x1)',
      url: '/',
      rate: 1
    },
    {
      title: 'DTLN (CPU throttle x2)',
      url: '/',
      rate: 2
    },
    {
      title: 'DTLN[quant dynamic] (CPU throttle x1)',
      url: '/?type=tflite-quant-dynamic',
      rate: 1
    },
    {
      title: 'DTLN[quant dynamic] (CPU throttle x2)',
      url: '/?type=tflite-quant-dynamic',
      rate: 2
    },
    {
      title: 'DTLN[quant f16] (CPU throttle x1)',
      url: '/?type=tflite-quant-f16',
      rate: 1
    },
    {
      title: 'DTLN[quant f16] (CPU throttle x2)',
      url: '/?type=tflite-quant-f16',
      rate: 2
    },
    {
      title: 'DTLN-aec[128] (CPU throttle x1)',
      url: '/aec/',
      rate: 1
    },
    {
      title: 'DTLN-aec[128] (CPU throttle x2)',
      url: '/aec/',
      rate: 2
    },
    {
      title: 'DTLN-aec[128 quant dynamic] (CPU throttle x1)',
      url: '/aec/?quant=dynamic',
      rate: 1
    },
    {
      title: 'DTLN-aec[128 quant dynamic] (CPU throttle x2)',
      url: '/aec/?quant=dynamic',
      rate: 2
    },
    {
      title: 'DTLN-aec[128 quant f16] (CPU throttle x1)',
      url: '/aec/?quant=f16',
      rate: 1
    },
    {
      title: 'DTLN-aec[128 quant f16] (CPU throttle x2)',
      url: '/aec/?quant=f16',
      rate: 2
    },
    {
      title: 'DTLN-aec[512] (CPU throttle x1)',
      url: '/aec/?units=512',
      rate: 1
    },
    {
      title: 'DTLN-aec[512] (CPU throttle x2)',
      url: '/aec/?units=512',
      rate: 2
    }
  ]

  for (const bench of benchs) {
    await recordMetrics(page, bench.title, bench.url, bench.rate)
  }

  await browser.close()
})()
