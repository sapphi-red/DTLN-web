import {
  ModelTensorInfo,
  ModelPredictConfig,
  NamedTensorMap
} from '@tensorflow/tfjs-core'
import { TFLiteModel } from '@tensorflow/tfjs-tflite'

type ModelTensorInfoWithShape = ModelTensorInfo &
  Required<Pick<ModelTensorInfo, 'shape'>>

export declare class Model1 extends TFLiteModel {
  readonly inputs: [ModelTensorInfoWithShape, ModelTensorInfoWithShape]
  readonly outputs: [ModelTensorInfoWithShape, ModelTensorInfoWithShape]
  predict(inputs: NamedTensorMap, config?: ModelPredictConfig): NamedTensorMap
}

export declare class Model2 extends TFLiteModel {
  readonly inputs: [ModelTensorInfoWithShape, ModelTensorInfoWithShape]
  readonly outputs: [ModelTensorInfoWithShape, ModelTensorInfoWithShape]
  predict(inputs: NamedTensorMap, config?: ModelPredictConfig): NamedTensorMap
}

export declare class AecModel1 extends TFLiteModel {
  readonly inputs: [
    ModelTensorInfoWithShape,
    ModelTensorInfoWithShape,
    ModelTensorInfoWithShape
  ]
  readonly outputs: [ModelTensorInfoWithShape, ModelTensorInfoWithShape]
  predict(inputs: NamedTensorMap, config?: ModelPredictConfig): NamedTensorMap
}

export declare class AecModel2 extends TFLiteModel {
  readonly inputs: [
    ModelTensorInfoWithShape,
    ModelTensorInfoWithShape,
    ModelTensorInfoWithShape
  ]
  readonly outputs: [ModelTensorInfoWithShape, ModelTensorInfoWithShape]
  predict(inputs: NamedTensorMap, config?: ModelPredictConfig): NamedTensorMap
}
