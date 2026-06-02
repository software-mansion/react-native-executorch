import { BubbleData } from '../types/bubbleTypes';

export const bubbleConstants: BubbleData = {
  renderQualityAndSpeed: {
    metersDepth: {
      value: 0.0,
      minValue: 0.5,
      maxValue: 6,
    },
    stepLength: {
      minValue: 0.02,
      value: 0.02,
      maxValue: 0.15,
    },
    varyingStepLength: {
      value: false,
    },
    optimisedNoise: {
      value: false,
    },
    dithering: {
      value: false,
    },
  },
  lighting: {
    angleDistortion: {
      value: 0.0,
      minValue: 0.2,
      maxValue: 4,
    },
    lightAbsorbtion: {
      value: 0.0,
      minValue: 0,
      maxValue: 1,
    },
  },
  colors: {
    colorOne: {
      value: [0.0, 0.0, 0.0],
      minValue: [0, 0, 0],
      maxValue: [1, 1, 1],
    },
    colorTwo: {
      value: [0.0, 0.0, 0.0],
      minValue: [0, 0, 0],
      maxValue: [1, 1, 1],
    },
    colorThree: {
      value: [0.0, 0.0, 0.0],
      minValue: [0, 0, 0],
      maxValue: [1, 1, 1],
    },
    colorFour: {
      value: [0.0, 0.0, 0.0],
      minValue: [0, 0, 0],
      maxValue: [1, 1, 1],
    },
    colorDensity: {
      value: 0.0,
      minValue: 0,
      maxValue: 1,
    },
    colorMultiplier: {
      value: 0,
      minValue: 1,
      maxValue: 100,
    },
  },
  noise: {
    scale: {
      value: 0,
      minValue: 0,
      maxValue: 1,
    },
    scaleMultiplier: {
      value: 0,
      minValue: 0,
      maxValue: 5,
    },
    factor: {
      value: 0,
      minValue: 0,
      maxValue: 5,
    },
    numberOfOctaves: {
      value: 0,
      minValue: 1,
      maxValue: 8,
    },
    shiftVector: {
      value: [0.0, 0.0, 0.0],
      minValue: [-1, -1, -1],
      maxValue: [1, 1, 1],
    },
  },
  sphere: {
    sphereRadius: {
      value: 0.0,
      minValue: 0.5,
      maxValue: 2,
    },
    sphereThickness: {
      value: 0.0,
      minValue: 0,
      maxValue: 0.5,
    },
    sphereNoiseMultiplier: {
      value: 0.0,
      minValue: 0,
      maxValue: 10,
    },
  },
  additionalDeformations: {
    additionalLayerOfDeformations: {
      value: false,
    },
    absInFormula: {
      value: false,
    },
    noiseIsAdded: {
      value: false,
    },
    addNoiseMultiplier: {
      value: 0.0,
      minValue: 0,
      maxValue: 10,
    },
  },
  volumeControl: {
    volumeMultiplier: {
      value: 0.0,
      minValue: 0,
      maxValue: 50,
    },
  },
};
