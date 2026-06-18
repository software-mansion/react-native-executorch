import { rnexecutorchJsi } from '../native/bridge';
import { type Tensor } from '../core/tensor';

export function sigmoid(src: Tensor, dst: Tensor): Tensor {
  'worklet';
  return rnexecutorchJsi.math.sigmoid(src, dst);
}

export function softmax(src: Tensor, dst: Tensor, axis: number = -1): Tensor {
  'worklet';
  return rnexecutorchJsi.math.softmax(src, dst, axis);
}

export function argmax(src: Tensor, dst: Tensor, axis: number = -1): Tensor {
  'worklet';
  return rnexecutorchJsi.math.argmax(src, dst, axis);
}
