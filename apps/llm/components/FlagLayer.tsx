import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { presets, presetOrder } from '../assets/presets';

type Props = {
  flagStyles: Record<string, object>;
  flagFontSize: number;
};

export default function FlagLayer({ flagStyles, flagFontSize }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {presetOrder.map((id) => (
        <Animated.Text
          key={id}
          style={[
            styles.singleFlag,
            { fontSize: flagFontSize },
            flagStyles[id] as object,
          ]}
        >
          {presets[id].flag}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  singleFlag: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
