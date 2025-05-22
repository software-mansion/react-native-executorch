import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import ColorPalette from '../colors';

interface Props {
  color?: string;
  thickness?: DimensionValue;
  orientation?: 'horizontal' | 'vertical';
  length?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}

const Divider = ({
  color = ColorPalette.seaBlueMedium,
  thickness = StyleSheet.hairlineWidth,
  orientation = 'horizontal',
  length = '100%',
  style = {},
}: Props) => {
  const isHorizontal = orientation === 'horizontal';

  const dividerStyle: ViewStyle = {
    backgroundColor: color,
    width: isHorizontal ? length : thickness,
    height: isHorizontal ? thickness : length,
  };

  return <View style={[dividerStyle, style]} />;
};

export default Divider;
