# DTLN-web

Use [DTLN real time speech denoising model](https://github.com/breizhn/DTLN) and [DTLN-aec model for real-time acoustic echo cancellation](https://github.com/breizhn/DTLN-aec) in web.

[Demo](https://dtln-web.sapphi.red/)

## Install
```
npm i @sapphi-red/dtln-web # yarn add @sapphi-red/dtln-web
```

## Usage
See demo source code.

- [DTLN (noise reduction) demo source code](https://github.com/sapphi-red/DTLN-web/blob/main/demo/src/index.ts)
- [DTLN-aec (acoustic echo cancellation) demo source code](https://github.com/sapphi-red/DTLN-web/blob/main/demo/aec/src/index.ts)

Also you will need to copy files.
Use CopyWebpackPlugin or vite-plugin-static-copy or something simillar.

See [vite.config.ts used in demo](https://github.com/sapphi-red/DTLN-web/blob/main/demo/vite.config.ts).
