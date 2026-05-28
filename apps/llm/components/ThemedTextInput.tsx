import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  type Ref,
} from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { TextInput } from 'react-native-paper';
import type { StylePreset } from '../assets/presets';

export type ThemedTextInputHandle = {
  blur: () => void;
};

type Props = {
  text: string;
  onChangeText: (text: string) => void;
  activePreset: StylePreset;
  pendingPreset: StylePreset;
  activeLayerStyle: object;
  pendingLayerStyle: object;
  onSend?: (text: string) => void;
};

function renderTextInput(
  p: StylePreset,
  text: string,
  onChangeText: (text: string) => void,
  ref: Ref<any>,
  onSend?: (text: string) => void
) {
  return (
    <TextInput
      ref={ref}
      mode="outlined"
      value={text}
      onChangeText={onChangeText}
      placeholder={p.ui.placeholder}
      placeholderTextColor={p.ui.inputPlaceholder}
      style={[{ backgroundColor: p.ui.inputBackground }]}
      textColor={p.ui.inputText}
      outlineColor={p.ui.inputOutline}
      activeOutlineColor={p.ui.inputActiveOutline}
      cursorColor={p.ui.inputCursor}
      selectionColor={p.ui.inputSelection}
      right={
        <TextInput.Icon
          icon={onSend ? 'send' : 'arrow-up-circle'}
          color={p.ui.inputIcon}
          onPress={() => {
            if (onSend && text) {
              onSend(text);
            } else {
              text && onChangeText('');
            }
          }}
          size={30}
        />
      }
    />
  );
}

const ThemedTextInput = forwardRef<ThemedTextInputHandle, Props>(
  (
    {
      text,
      onChangeText,
      activePreset,
      pendingPreset,
      activeLayerStyle,
      pendingLayerStyle,
      onSend,
    },
    ref
  ) => {
    const activeRef = useRef<React.ElementRef<typeof TextInput>>(null);
    const pendingRef = useRef<React.ElementRef<typeof TextInput>>(null);

    useImperativeHandle(ref, () => ({
      blur: () => {
        activeRef.current?.blur();
        pendingRef.current?.blur();
      },
    }));

    return (
      <View style={styles.wrapper}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 4,
              left: 16,
              right: 16,
              bottom: 4,
            },
            pendingLayerStyle,
          ]}
        >
          {renderTextInput(
            pendingPreset,
            text,
            onChangeText,
            pendingRef,
            onSend
          )}
        </Animated.View>
        <Animated.View style={[{ zIndex: 2 }, activeLayerStyle]}>
          {renderTextInput(activePreset, text, onChangeText, activeRef, onSend)}
        </Animated.View>
      </View>
    );
  }
);

export default ThemedTextInput;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
});
