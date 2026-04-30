import { bubbleData } from '@/assets/data/bubblePresets';
import { BubbleData, variableBubbleData } from '@/assets/types/bubbleTypes';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Property from './Property';
import { camelToTitle } from './utils/camelToTitle';

interface EqualiserOptionsModalProps {
  isVisible: boolean;
  onClose: () => void;
  equaliserData: React.RefObject<BubbleData>;
}

interface SectionInfo {
  key: keyof BubbleData;
  label: string;
}

const EqualiserOptionsModal: React.FC<EqualiserOptionsModalProps> = ({
  isVisible,
  onClose,
  equaliserData,
}) => {
  const modalRef = useRef<BottomSheetModal>(null);
  const handleSheetChanges = useCallback((index: number) => {}, []);

  const [exampleId, setExampleId] = React.useState<number>(0);

  const handleExamplePress = (id: number) => {
    setExampleId(id);
    equaliserData.current = bubbleData[id];
  };

  const handleDataChange = <
    K extends keyof BubbleData,
    P extends keyof BubbleData[K],
  >(
    section: K,
    key: P,
    newValue: BubbleData[K][P] extends { value: infer V } ? V : never
  ) => {
    if (equaliserData.current) {
      const item = equaliserData.current[section][key] as {
        value: typeof newValue;
      };
      item.value = newValue;
    }
  };

  const images = [
    { source: require('../assets/images/examples/1_example.jpg'), id: 0 },
    { source: require('../assets/images/examples/2_example.jpg'), id: 1 },
    { source: require('../assets/images/examples/3_example.jpg'), id: 2 },
    { source: require('../assets/images/examples/4_example.jpg'), id: 3 },
    { source: require('../assets/images/examples/5_example.jpg'), id: 4 },
  ];

  useEffect(() => {
    if (isVisible) {
      modalRef.current?.present();
    } else {
      onClose();
      modalRef.current?.dismiss();
    }
  }, [isVisible]);

  const snapPoints = useMemo(() => ['50%'], []);

  const sectionKeys = useMemo<SectionInfo[]>(() => {
    if (!bubbleData) return [];

    return (Object.keys(bubbleData[0]) as (keyof BubbleData)[])
      .filter(
        (k) => typeof bubbleData[0][k] === 'object' && bubbleData[0][k] !== null
      )
      .map((k) => ({
        key: k,
        label: camelToTitle(k as string),
      }));
  }, [bubbleData]);

  return (
    <BottomSheetModal
      ref={modalRef}
      onChange={handleSheetChanges}
      index={0}
      enableDynamicSizing={false}
      onDismiss={() => {
        onClose();
      }}
      backgroundStyle={{ backgroundColor: '#FFFFFFDD' }}
      snapPoints={snapPoints}
      enableDismissOnClose
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      )}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.row}>
          <Text style={styles.title}>Examples (click to view)</Text>
          <View style={styles.divider} />
        </View>
        <ScrollView
          horizontal={true}
          contentContainerStyle={{ paddingVertical: 8 }}
        >
          {images.map((item) => (
            <View
              key={item.id}
              style={{ width: 110, height: 110, marginRight: 16 }}
            >
              <TouchableOpacity onPress={() => handleExamplePress(item.id)}>
                <Image
                  source={item.source}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 70,
                    padding: 4,
                  }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        {sectionKeys.map((section, i) => {
          const properties = bubbleData[exampleId][section.key];
          return (
            <View key={String(section.key)} style={{ marginBottom: 16 }}>
              <View style={styles.row}>
                <Text style={styles.title}>{section.label}</Text>
                <View style={styles.divider} />
              </View>
              {properties &&
                Object.entries(properties).map(([propKey, descriptor]) => {
                  const { value } = descriptor as variableBubbleData;

                  return (
                    <Property
                      key={String(propKey)}
                      propKey={propKey}
                      value={
                        (equaliserData.current?.[section.key] as any)?.[propKey]
                          ?.value || value
                      }
                      handleDataChange={handleDataChange}
                      section={section}
                    />
                  );
                })}
            </View>
          );
        })}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
    color: '#001A72',
    marginRight: 8,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#001A72',
  },
});

export default EqualiserOptionsModal;
