export interface variableBubbleData {
  minValue?: number | [number, number, number];
  maxValue?: number | [number, number, number];
  value: number | boolean | [number, number, number];
  description?: string;
}

export interface BubbleData {
  renderQualityAndSpeed: {
    metersDepth: variableBubbleData;
    stepLength: variableBubbleData;
    varyingStepLength: variableBubbleData;
    optimisedNoise: variableBubbleData;
    dithering: variableBubbleData;
  };
  lighting: {
    angleDistortion: variableBubbleData;
    lightAbsorbtion: variableBubbleData;
  };
  colors: {
    colorOne: variableBubbleData;
    colorTwo: variableBubbleData;
    colorThree: variableBubbleData;
    colorFour: variableBubbleData;
    colorDensity: variableBubbleData;
    colorMultiplier: variableBubbleData;
  };
  noise: {
    scale: variableBubbleData;
    scaleMultiplier: variableBubbleData;
    factor: variableBubbleData;
    numberOfOctaves: variableBubbleData;
    shiftVector: variableBubbleData;
  };
  sphere: {
    sphereRadius: variableBubbleData;
    sphereThickness: variableBubbleData;
    sphereNoiseMultiplier: variableBubbleData;
  };
  additionalDeformations: {
    additionalLayerOfDeformations: variableBubbleData;
    absInFormula: variableBubbleData;
    noiseIsAdded: variableBubbleData;
    addNoiseMultiplier: variableBubbleData;
  };
  volumeControl: {
    volumeMultiplier: variableBubbleData;
  };
}
