//@ts-expect-error d.ts missing?
import { defineConfig } from 'tsup'
import { Plugin } from 'esbuild'
import path from 'path'

const resolveCustomTfjsPlugin: Plugin = {
  name: 'resolve-custom-tfjs-plugin',
  setup(build) {
    build.onResolve({ filter: /^@tensorflow\/tfjs/ }, args => {
      if (args.path === '@tensorflow/tfjs') {
        return {
          path: path.resolve(__dirname, './custom_tfjs/custom_tfjs.js')
        }
      }
      if (args.path === '@tensorflow/tfjs-core') {
        return {
          path: path.resolve(__dirname, './custom_tfjs/custom_tfjs_core.js')
        }
      }
      if (args.path === '@tensorflow/tfjs-core/dist/ops/ops_for_converter') {
        return {
          path: path.resolve(
            __dirname,
            './custom_tfjs/custom_ops_for_converter.js'
          )
        }
      }
      return
    })
  }
}

export default defineConfig({
  target: 'es2019',
  platform: 'browser',
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  esbuildPlugins: [resolveCustomTfjsPlugin]
})
