import { Plugin, Connect } from 'vite'
import fastglob from 'fast-glob'
import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import sirv, { Options } from 'sirv'

export type Target = { src: string | string[]; dest: string }
export type StaticCopyPluginOptions = {
  devCopyDir?: string
  targets: Target[]
  flatten?: boolean
}

type SimpleTarget = { src: string; dest: string }

const collectCopyTargets = async (targets: Target[], flatten: boolean) => {
  const copyTargets: Array<SimpleTarget> = []

  for (const { src, dest } of targets) {
    const matchedPaths = await fastglob(src, {
      onlyFiles: false,
      dot: true
    })

    for (const matchedPath of matchedPaths) {
      // https://github.com/vladshcherbin/rollup-plugin-copy/blob/507bf5e99aa2c6d0d858821e627cb7617a1d9a6d/src/index.js#L32-L35
      const { base, dir } = path.parse(matchedPath)
      const destDir =
        flatten || (!flatten && !dir)
          ? dest
          : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            dir.replace(dir.split('/')[0]!, dest)

      copyTargets.push({ src: matchedPath, dest: path.join(destDir, base) })
    }
  }
  return copyTargets
}
const copyAll = async (
  rootDest: string,
  targets: Target[],
  flatten: boolean
) => {
  const copyTargets = await collectCopyTargets(targets, flatten)
  await Promise.all(
    copyTargets.map(({ src, dest }) => fs.copy(src, path.join(rootDest, dest)))
  )
  return copyTargets.length
}
const outputCopyLog = (copyCount: number) => {
  if (copyCount > 0) {
    console.log(
      chalk.green(`[vite-plugin-static-copy] Copied ${copyCount} items.`)
    )
  } else {
    console.log(chalk.yellow('[vite-plugin-static-copy] No items to copy.'))
  }
}

// -----
// copied from https://github.com/vitejs/vite/blob/7edabb46de3ce63e078e0cda7cd3ed9e5cdd0f2a/packages/vite/src/node/server/middlewares/static.ts#L19-L46

const FS_PREFIX = `/@fs/`
const VALID_ID_PREFIX = `/@id/`
const CLIENT_PUBLIC_PATH = `/@vite/client`
const ENV_PUBLIC_PATH = `/@vite/env`
const importQueryRE = /(\?|&)import=?(?:&|$)/
const internalPrefixes = [
  FS_PREFIX,
  VALID_ID_PREFIX,
  CLIENT_PUBLIC_PATH,
  ENV_PUBLIC_PATH
]
const InternalPrefixRE = new RegExp(`^(?:${internalPrefixes.join('|')})`)
const isImportRequest = (url: string): boolean => importQueryRE.test(url)
const isInternalRequest = (url: string): boolean => InternalPrefixRE.test(url)

const sirvOptions: Options = {
  dev: true,
  etag: true,
  extensions: [],
  setHeaders(res, pathname) {
    // Matches js, jsx, ts, tsx.
    // The reason this is done, is that the .ts file extension is reserved
    // for the MIME type video/mp2t. In almost all cases, we can expect
    // these files to be TypeScript files, and for Vite to serve them with
    // this Content-Type.
    if (/\.[tj]sx?$/.test(pathname)) {
      res.setHeader('Content-Type', 'application/javascript')
    }
  }
}

function servePublicMiddleware(dir: string): Connect.NextHandleFunction {
  const serve = sirv(dir, sirvOptions)

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteServePublicMiddleware(req, res, next) {
    // skip import request and internal requests `/@fs/ /@vite-client` etc...
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (isImportRequest(req.url!) || isInternalRequest(req.url!)) {
      return next()
    }
    serve(req, res, next)
  }
}

// -----

export const staticCopyPlugin = ({
  devCopyDir = 'node_modules/.vite-static-copy',
  targets,
  flatten = true
}: StaticCopyPluginOptions): Plugin[] => {
  const staticCopyPluginServe = (): Plugin => {
    return {
      name: 'vite-plugin-static-copy-serve',
      apply: 'serve',
      async buildStart() {
        // copy again
        try {
          await fs.rm(devCopyDir, { force: true, recursive: true })
          // eslint-disable-next-line no-empty
        } catch {}
        await fs.mkdir(devCopyDir, { recursive: true })

        const copyCount = await copyAll(devCopyDir, targets, flatten)
        outputCopyLog(copyCount)
      },
      configureServer(server) {
        return () => {
          server.middlewares.use(servePublicMiddleware(devCopyDir))
        }
      }
    }
  }

  const staticCopyPluginBuild = (): Plugin => {
    let viteConfigBuildOutDir: string | undefined

    return {
      name: 'vite-plugin-static-copy-build',
      apply: 'build',
      configResolved(config) {
        viteConfigBuildOutDir = config.build.outDir
      },
      async writeBundle() {
        if (viteConfigBuildOutDir === undefined) {
          throw new Error(
            'viteConfigBuildOutDir is undefined. What happened...?'
          )
        }

        const copyCount = await copyAll(viteConfigBuildOutDir, targets, flatten)
        outputCopyLog(copyCount)
      }
    }
  }

  return [staticCopyPluginServe(), staticCopyPluginBuild()]
}
