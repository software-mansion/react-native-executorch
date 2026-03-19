import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ColorPalette from '../colors';

interface Props {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

export default function SuggestedPrompts({ prompts, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {prompts.map((prompt, i) => (
        <TouchableOpacity
          key={i}
          style={styles.chip}
          onPress={() => onSelect(prompt)}
        >
          <Text style={styles.chipText}>{prompt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  chip: {
    borderWidth: 1,
    borderColor: ColorPalette.blueLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fafbff',
  },
  chipText: {
    fontFamily: 'regular',
    fontSize: 13,
    color: ColorPalette.primary,
  },
});
