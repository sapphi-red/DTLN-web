/**
 * These values are fixed.
 *
 * > - The sampling rate of this model is fixed at 16 kHz.
 * >   It will not work smoothly with other sampling rates.
 * > - The block length of 32 ms and the block shift of 8 ms are also fixed.
 * >   For changing these values, the model must be retrained.
 * >
 * > https://github.com/breizhn/DTLN/blob/master/README.md#real-time-processing-with-the-savedmodel-format
 */

export const blockLen = 512
export const blockShift = 128
export const sampleRate = 16000
