import {
  Shape,
  ModelTensorInfo,
  ModelPredictConfig,
  NamedTensorMap,
  Tensor
} from '@tensorflow/tfjs'
import { TFLiteModel } from '@tensorflow/tfjs-tflite'

type ModelTensorInfoWithShape = ModelTensorInfo & { shape: Shape }

interface Model1OutputNamedTensorMap extends NamedTensorMap {
  Identity: Tensor
  Identity_1: Tensor
}

export declare class Model1 extends TFLiteModel {
  readonly inputs: [ModelTensorInfoWithShape, ModelTensorInfoWithShape]
  readonly outputs: [ModelTensorInfoWithShape, ModelTensorInfoWithShape]
  predict(
    inputs: NamedTensorMap,
    config?: ModelPredictConfig
  ): Model1OutputNamedTensorMap
}

interface Model2OutputNamedTensorMap extends NamedTensorMap {
  Identity: Tensor
  Identity_1: Tensor
}

export declare class Model2 extends TFLiteModel {
  readonly inputs: [ModelTensorInfoWithShape, ModelTensorInfoWithShape]
  readonly outputs: [ModelTensorInfoWithShape, ModelTensorInfoWithShape]
  predict(
    inputs: NamedTensorMap,
    config?: ModelPredictConfig
  ): Model2OutputNamedTensorMap
}
