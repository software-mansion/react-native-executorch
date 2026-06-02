import { BubbleData } from '../types/bubbleTypes';

export const bubbleData: BubbleData[] = [
  {
    renderQualityAndSpeed: {
      metersDepth: {
        value: 3.75,
        minValue: 0.5,
        maxValue: 6,
      },
      stepLength: {
        value: 0.04,
        minValue: 0.02,
        maxValue: 0.15,
      },
      varyingStepLength: {
        value: false,
      },
      optimisedNoise: {
        value: true,
      },
      dithering: {
        value: true,
      },
    },
    lighting: {
      angleDistortion: {
        value: 0.5,
        minValue: 0.2,
        maxValue: 4,
      },
      lightAbsorbtion: {
        value: 0.85,
        minValue: 0,
        maxValue: 1,
      },
    },
    colors: {
      colorOne: {
        value: [0.0, 0.0, 0.21],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorTwo: {
        value: [0.38, 0.0, 1.0],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorThree: {
        value: [1.0, 0.0, 0.93],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorFour: {
        value: [0.0, 0.95, 1.0],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorDensity: {
        value: 0.22,
        minValue: 0,
        maxValue: 1,
      },
      colorMultiplier: {
        value: 2.91,
        minValue: 1,
        maxValue: 100,
      },
    },
    noise: {
      scale: {
        value: 0.08,
        minValue: 0,
        maxValue: 1,
      },
      scaleMultiplier: {
        value: 1.49,
        minValue: 0,
        maxValue: 5,
      },
      factor: {
        value: 4.03,
        minValue: 0,
        maxValue: 5,
      },
      numberOfOctaves: {
        value: 3.14,
        minValue: 1,
        maxValue: 8,
      },
      shiftVector: {
        value: [-0.1, 0.15, 0.01],
        minValue: [-1, -1, -1],
        maxValue: [1, 1, 1],
      },
    },
    sphere: {
      sphereRadius: {
        value: 1.6,
        minValue: 0.5,
        maxValue: 2,
      },
      sphereThickness: {
        value: 0.07,
        minValue: 0,
        maxValue: 0.5,
      },
      sphereNoiseMultiplier: {
        value: 0.31,
        minValue: 0,
        maxValue: 10,
      },
    },
    additionalDeformations: {
      additionalLayerOfDeformations: {
        value: false,
      },
      absInFormula: {
        value: true,
      },
      noiseIsAdded: {
        value: true,
      },
      addNoiseMultiplier: {
        value: 0,
        minValue: 0,
        maxValue: 10,
      },
    },
    volumeControl: {
      volumeMultiplier: {
        value: 50,
        minValue: 0,
        maxValue: 50,
      },
    },
  },
  {
    renderQualityAndSpeed: {
      metersDepth: {
        value: 4,
        minValue: 0.5,
        maxValue: 6,
      },
      stepLength: {
        value: 0.019999999552965164,
        minValue: 0.02,
        maxValue: 0.15,
      },
      varyingStepLength: {
        value: false,
      },
      optimisedNoise: {
        value: false,
      },
      dithering: {
        value: true,
      },
    },
    lighting: {
      angleDistortion: {
        value: 0.6233883500099182,
        minValue: 0.2,
        maxValue: 4,
      },
      lightAbsorbtion: {
        value: 0.8,
        minValue: 0,
        maxValue: 1,
      },
    },
    colors: {
      colorOne: {
        value: [0.19, 0.12, 0.9],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorTwo: {
        value: [0.64, 0.91, 0.79],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorThree: {
        value: [0.44, 0.72, 0],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorFour: {
        value: [0.62, 0.67, 0],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorDensity: {
        value: 0.14,
        minValue: 0,
        maxValue: 1,
      },
      colorMultiplier: {
        value: 96.44474792480469,
        minValue: 1,
        maxValue: 100,
      },
    },
    noise: {
      scale: {
        value: 0.04,
        minValue: 0,
        maxValue: 1,
      },
      scaleMultiplier: {
        value: 1,
        minValue: 0,
        maxValue: 5,
      },
      factor: {
        value: 2.5,
        minValue: 0,
        maxValue: 5,
      },
      numberOfOctaves: {
        value: 2,
        minValue: 1,
        maxValue: 8,
      },
      shiftVector: {
        value: [0.3, 0.2, 0.4],
        minValue: [-1, -1, -1],
        maxValue: [1, 1, 1],
      },
    },
    sphere: {
      sphereRadius: {
        value: 1.4571822881698608,
        minValue: 0.5,
        maxValue: 2,
      },
      sphereThickness: {
        value: 0.06952115148305893,
        minValue: 0,
        maxValue: 0.5,
      },
      sphereNoiseMultiplier: {
        value: 3,
        minValue: 0,
        maxValue: 10,
      },
    },
    additionalDeformations: {
      additionalLayerOfDeformations: {
        value: true,
      },
      absInFormula: {
        value: true,
      },
      noiseIsAdded: {
        value: false,
      },
      addNoiseMultiplier: {
        value: 10,
        minValue: 0,
        maxValue: 10,
      },
    },
    volumeControl: {
      volumeMultiplier: {
        value: 20,
        minValue: 0,
        maxValue: 20,
      },
    },
  },
  {
    renderQualityAndSpeed: {
      metersDepth: {
        value: 4,
        minValue: 0.5,
        maxValue: 6,
      },
      stepLength: {
        value: 0.04,
        minValue: 0.02,
        maxValue: 0.15,
      },
      varyingStepLength: {
        value: false,
      },
      optimisedNoise: {
        value: false,
      },
      dithering: {
        value: true,
      },
    },
    lighting: {
      angleDistortion: {
        value: 1.0,
        minValue: 0.2,
        maxValue: 4,
      },
      lightAbsorbtion: {
        value: 0.8,
        minValue: 0,
        maxValue: 1,
      },
    },
    colors: {
      colorOne: {
        value: [0.16, 0.23, 1.0],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorTwo: {
        value: [0.07, 0.5, 0.43],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorThree: {
        value: [0.2, 1.0, 0],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorFour: {
        value: [0.0, 0.0, 0],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorDensity: {
        value: 0.08,
        minValue: 0,
        maxValue: 1,
      },
      colorMultiplier: {
        value: 6.01,
        minValue: 1,
        maxValue: 100,
      },
    },
    noise: {
      scale: {
        value: 0.15,
        minValue: 0,
        maxValue: 1,
      },
      scaleMultiplier: {
        value: 1.98,
        minValue: 0,
        maxValue: 5,
      },
      factor: {
        value: 2.03,
        minValue: 0,
        maxValue: 5,
      },
      numberOfOctaves: {
        value: 1,
        minValue: 1,
        maxValue: 8,
      },
      shiftVector: {
        value: [-0.018691759556531906, -0.06355157494544983, 1],
        minValue: [-1, -1, -1],
        maxValue: [1, 1, 1],
      },
    },
    sphere: {
      sphereRadius: {
        value: 1.11,
        minValue: 0.5,
        maxValue: 2,
      },
      sphereThickness: {
        value: 0.11,
        minValue: 0,
        maxValue: 0.5,
      },
      sphereNoiseMultiplier: {
        value: 2.42,
        minValue: 0,
        maxValue: 10,
      },
    },
    additionalDeformations: {
      additionalLayerOfDeformations: {
        value: true,
      },
      absInFormula: {
        value: true,
      },
      noiseIsAdded: {
        value: true,
      },
      addNoiseMultiplier: {
        value: 1.3351744413375854,
        minValue: 0,
        maxValue: 10,
      },
    },
    volumeControl: {
      volumeMultiplier: {
        value: 20,
        minValue: 0,
        maxValue: 20,
      },
    },
  },
  {
    renderQualityAndSpeed: {
      metersDepth: {
        value: 4.05,
        minValue: 0.5,
        maxValue: 6,
      },
      stepLength: {
        value: 0.15,
        minValue: 0.02,
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
        value: 1.06,
        minValue: 0.2,
        maxValue: 4,
      },
      lightAbsorbtion: {
        value: 0.66,
        minValue: 0,
        maxValue: 1,
      },
    },
    colors: {
      colorOne: {
        value: [0, 0.15, 0],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorTwo: {
        value: [0, 0.56, 0],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorThree: {
        value: [0.5, 0.65, 0],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorFour: {
        value: [0, 0, 0],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorDensity: {
        value: 0.32,
        minValue: 0,
        maxValue: 1,
      },
      colorMultiplier: {
        value: 48.31,
        minValue: 1,
        maxValue: 100,
      },
    },
    noise: {
      scale: {
        value: 0.013812154531478882,
        minValue: 0,
        maxValue: 1,
      },
      scaleMultiplier: {
        value: 5,
        minValue: 0,
        maxValue: 5,
      },
      factor: {
        value: 3.1,
        minValue: 0,
        maxValue: 5,
      },
      numberOfOctaves: {
        value: 2.36,
        minValue: 1,
        maxValue: 8,
      },
      shiftVector: {
        value: [0, 0, -0.22],
        minValue: [-1, -1, -1],
        maxValue: [1, 1, 1],
      },
    },
    sphere: {
      sphereRadius: {
        value: 1.05,
        minValue: 0.5,
        maxValue: 2,
      },
      sphereThickness: {
        value: 0.05,
        minValue: 0,
        maxValue: 0.5,
      },
      sphereNoiseMultiplier: {
        value: 6.55,
        minValue: 0,
        maxValue: 10,
      },
    },
    additionalDeformations: {
      additionalLayerOfDeformations: {
        value: false,
      },
      absInFormula: {
        value: true,
      },
      noiseIsAdded: {
        value: true,
      },
      addNoiseMultiplier: {
        value: 0,
        minValue: 0,
        maxValue: 10,
      },
    },
    volumeControl: {
      volumeMultiplier: {
        value: 20,
        minValue: 0,
        maxValue: 20,
      },
    },
  },
  {
    renderQualityAndSpeed: {
      metersDepth: {
        value: 4,
        minValue: 0.5,
        maxValue: 6,
      },
      stepLength: {
        value: 0.019999999552965164,
        minValue: 0.02,
        maxValue: 0.15,
      },
      varyingStepLength: {
        value: false,
      },
      optimisedNoise: {
        value: true,
      },
      dithering: {
        value: true,
      },
    },
    lighting: {
      angleDistortion: {
        value: 0.7,
        minValue: 0.2,
        maxValue: 4,
      },
      lightAbsorbtion: {
        value: 0.8,
        minValue: 0,
        maxValue: 1,
      },
    },
    colors: {
      colorOne: {
        value: [0.4999999403953552, 0.5056074261665344, 0.5056074261665344],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorTwo: {
        value: [0.5205607414245605, 0.5056074261665344, 0.5112149119377136],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorThree: {
        value: [1, 1, 1],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorFour: {
        value: [0, 0.33177563548088074, 0.6607476472854614],
        minValue: [0, 0, 0],
        maxValue: [1, 1, 1],
      },
      colorDensity: {
        value: 0.0727439597249031,
        minValue: 0,
        maxValue: 1,
      },
      colorMultiplier: {
        value: 25.522096633911133,
        minValue: 1,
        maxValue: 100,
      },
    },
    noise: {
      scale: {
        value: 0.013812154531478882,
        minValue: 0,
        maxValue: 1,
      },
      scaleMultiplier: {
        value: 2.2513811588287354,
        minValue: 0,
        maxValue: 5,
      },
      factor: {
        value: 2.2513811588287354,
        minValue: 0,
        maxValue: 5,
      },
      numberOfOctaves: {
        value: 2.7854506969451904,
        minValue: 1,
        maxValue: 8,
      },
      shiftVector: {
        value: [1, -0.09345800429582596, -0.04112166538834572],
        minValue: [-1, -1, -1],
        maxValue: [1, 1, 1],
      },
    },
    sphere: {
      sphereRadius: {
        value: 1.2582873106002808,
        minValue: 0.5,
        maxValue: 2,
      },
      sphereThickness: {
        value: 0.013351735658943653,
        minValue: 0,
        maxValue: 0.5,
      },
      sphereNoiseMultiplier: {
        value: 6.565377235412598,
        minValue: 0,
        maxValue: 10,
      },
    },
    additionalDeformations: {
      additionalLayerOfDeformations: {
        value: false,
      },
      absInFormula: {
        value: true,
      },
      noiseIsAdded: {
        value: true,
      },
      addNoiseMultiplier: {
        value: 0,
        minValue: 0,
        maxValue: 10,
      },
    },
    volumeControl: {
      volumeMultiplier: {
        value: 20,
        minValue: 0,
        maxValue: 20,
      },
    },
  },
];
