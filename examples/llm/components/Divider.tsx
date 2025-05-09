import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  DimensionValue,
} from 'react-native';

interface DividerProps {
  color?: string;
  thickness?: DimensionValue;
  orientation?: 'horizontal' | 'vertical';
  length?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}

const Divider: React.FC<DividerProps> = ({
  color = '#CED0CE',
  thickness = StyleSheet.hairlineWidth,
  orientation = 'horizontal',
  length = '100%',
  style = {},
}) => {
  const isHorizontal = orientation === 'horizontal';

  const dividerStyle: ViewStyle = {
    backgroundColor: color,
    width: isHorizontal ? length : thickness,
    height: isHorizontal ? thickness : length,
  };

  return <View style={[dividerStyle, style]} />;
};

export default Divider;
