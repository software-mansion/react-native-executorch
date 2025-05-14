import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';
import { ImageSegmentationModule } from '../../modules/computer_vision/ImageSegmentationModule';

interface Props {
  modelSource: ResourceSource;
}

export const useImageSegmentation = ({ modelSource }: Props) =>
  useNonStaticModule<
    typeof ImageSegmentationModule,
    Parameters<(typeof ImageSegmentationModule)['load']>,
    [string, string[], boolean],
    { [category: string]: number[] }
  >({ module: ImageSegmentationModule, loadArgs: [modelSource] });
