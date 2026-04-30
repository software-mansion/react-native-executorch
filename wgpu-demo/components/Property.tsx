import { bubbleConstants } from '@/assets/constants/bubbleConstants';
import { BubbleData } from '@/assets/types/bubbleTypes';
import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import SwitchToggle from 'react-native-switch-toggle';
import { camelToTitle } from './utils/camelToTitle';

export default function Property({
  propKey,
  value,
  handleDataChange,
  section,
}: any) {
  const { minValue, maxValue } = (bubbleConstants as any)?.[section.key]?.[
    propKey
  ];
  const [propValue, setPropValue] = useState(value);

  const handleValueChange = (
    newValue: number | boolean | any[],
    arrayPosition: number = -1
  ) => {
    if (arrayPosition >= 0) {
      const updatedValue = [...propValue];
      updatedValue[arrayPosition] = newValue;
      setPropValue(updatedValue);
      handleDataChange(section.key, propKey as keyof BubbleData, updatedValue);
    } else {
      setPropValue(newValue);
      handleDataChange(section.key, propKey as keyof BubbleData, newValue);
    }
  };

  useEffect(() => {
    setPropValue(value);
  }, [value]);

  const valueDisplay =
    typeof propValue === 'number'
      ? String(propValue.toFixed(2))
      : typeof propValue === 'boolean'
        ? propValue
          ? 'On'
          : 'Off'
        : null;
  return (
    <View key={propKey} style={styles.row}>
      <Text style={styles.propLabel}>{camelToTitle(propKey)}</Text>
      {valueDisplay ? (
        <Text
          style={
            typeof propValue === 'boolean'
              ? styles.boolPropValue
              : styles.propValue
          }
        >
          {valueDisplay}
        </Text>
      ) : null}
      {typeof propValue === 'number' && (
        <Slider
          style={styles.slider}
          value={propValue}
          minimumValue={typeof minValue === 'number' ? minValue : 0}
          maximumValue={typeof maxValue === 'number' ? maxValue : 1}
          onValueChange={handleValueChange}
          minimumTrackTintColor="#071576"
          maximumTrackTintColor="#aaa"
        />
      )}
      {typeof propValue === 'boolean' && (
        <SwitchToggle
          switchOn={Boolean(propValue)}
          onPress={() => handleValueChange(propValue ? false : true)}
          circleColorOff="#071576"
          circleColorOn="#FFF"
          backgroundColorOn="#071576"
          backgroundColorOff="#00000000"
          containerStyle={styles.containerStyle}
          circleStyle={styles.circleStyle}
        />
      )}
      {typeof propValue !== 'number' && typeof propValue !== 'boolean' && (
        <View style={styles.threeValueContainer}>
          {propValue.map((val: number, index: number) => {
            let componentLabels: string[];
            if (section.key === 'colors') {
              componentLabels = ['R', 'G', 'B'];
            } else {
              componentLabels = ['X', 'Y', 'Z'];
            }
            return (
              <View key={index} style={styles.row}>
                <Text style={styles.componentLabel}>
                  {componentLabels[index]}:
                </Text>
                <Text style={styles.propThreeValue}>
                  {String(val.toFixed(2))}
                </Text>
                <Slider
                  style={styles.slider}
                  value={val}
                  minimumValue={minValue[index]}
                  maximumValue={maxValue[index]}
                  onValueChange={(newValue) =>
                    handleValueChange(newValue, index)
                  }
                  minimumTrackTintColor="#071576"
                  maximumTrackTintColor="#aaa"
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  componentLabel: {
    color: '#444',
    fontWeight: '500',
    fontSize: 12,
    marginRight: 8,
  },
  containerStyle: {
    marginLeft: 8,
    width: 40,
    height: 24,
    borderRadius: 25,
    padding: 2,
    borderWidth: 2,
    borderColor: '#001A72',
    marginBottom: 8,
  },
  circleStyle: {
    left: -6,
    width: 20,
    height: 20,
    borderRadius: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
    color: '#001A72',
    marginRight: 8,
  },
  slider: {
    height: 40,
    marginLeft: 8,
    flex: 15,
  },
  propLabel: {
    flex: 5,
    color: '#444',
    fontWeight: '500',
    fontSize: 12,
    marginRight: 16,
  },
  propValue: {
    color: '#001A72',
    fontWeight: '500',
    fontSize: 12,
    flex: 3,
  },
  boolPropValue: {
    color: '#001A72',
    fontWeight: '500',
    fontSize: 12,
  },
  propThreeValue: {
    color: '#001A72',
    fontWeight: '500',
    fontSize: 12,
    flex: 3,
  },
  threeValueContainer: {
    flexDirection: 'column',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#071576',
    borderStyle: 'solid',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
    marginTop: 4,
    flex: 20,
  },
});
