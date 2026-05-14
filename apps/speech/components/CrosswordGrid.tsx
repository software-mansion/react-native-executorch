import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { CrosswordPreset } from '../assets/crossword-data';

export interface CellData {
  row: number;
  col: number;
  isActive: boolean;
  value: string;
  wordIds: number[];
  numbers: number[];
}

interface CrosswordGridProps {
  grid: CellData[][];
  preset: CrosswordPreset;
  wordStatuses: Record<number, 'correct' | 'incorrect' | 'incomplete'>;
  onCellChange: (text: string, row: number, col: number) => void;
  onFocusedCellChange?: (cell: { r: number; c: number } | null) => void;
}

export const CrosswordGrid = ({
  grid,
  preset,
  wordStatuses,
  onCellChange,
  onFocusedCellChange,
}: CrosswordGridProps) => {
  const inputsRef = useRef<Record<string, TextInput | null>>({});
  const [focusedCell, setFocusedCellState] = useState<{
    r: number;
    c: number;
  } | null>(null);
  const setFocusedCell = (cell: { r: number; c: number } | null) => {
    setFocusedCellState(cell);
    onFocusedCellChange?.(cell);
  };

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const horizontalPadding = 32;
  const verticalPadding = 32;
  const maxGridHeight = screenHeight - 200; // Increased allowance for UI elements to prevent overlap

  const cellSizeByCols =
    Math.floor((screenWidth - horizontalPadding) / (preset.cols || 10)) - 4;
  const cellSizeByRows =
    Math.floor((maxGridHeight - verticalPadding) / (preset.rows || 10)) - 4;

  const calculatedCellSize = Math.max(
    25,
    Math.min(cellSizeByCols, cellSizeByRows)
  );

  const handleTextChange = (text: string, row: number, col: number) => {
    const val = text.toUpperCase().replace(/[^A-Z]/g, '');
    onCellChange(val, row, col);

    // Auto-advance
    if (val.length > 0) {
      const cell = grid[row][col];
      if (cell.wordIds.length > 0) {
        // Pick primary word direction to advance
        const word = preset.words.find((w) => w.id === cell.wordIds[0]);
        if (word) {
          let nextRow = row;
          let nextCol = col;
          if (word.direction === 'across') {
            nextCol += 1;
          } else {
            nextRow += 1;
          }

          // Check if next cell is active
          if (
            grid[nextRow] &&
            grid[nextRow][nextCol] &&
            grid[nextRow][nextCol].isActive
          ) {
            const nextKey = `${nextRow}-${nextCol}`;
            if (inputsRef.current[nextKey]) {
              inputsRef.current[nextKey]?.focus();
            }
          }
        }
      }
    }
  };

  const getCellStyle = (cell: CellData) => {
    if (!cell.isActive) return styles.cellInactive;

    let isCorrect = false;
    let isIncorrect = false;

    cell.wordIds.forEach((id) => {
      if (wordStatuses[id] === 'correct') isCorrect = true;
      if (wordStatuses[id] === 'incorrect') isIncorrect = true;
    });

    const isFocused =
      focusedCell?.r === cell.row && focusedCell?.c === cell.col;

    const baseStyles: any[] = [styles.cellActive];

    if (isIncorrect) baseStyles.push(styles.cellIncorrect);
    else if (isCorrect) baseStyles.push(styles.cellCorrect);
    else if (isFocused) {
      baseStyles.push(styles.cellFocusedBg);
      baseStyles.push({ backgroundColor: '#e8f0fe' }); // Subtle blue background for focused row/column logic if needed
    }

    if (isFocused) baseStyles.push(styles.cellFocusedBorder);

    return baseStyles;
  };

  const handleKeyPress = (e: any, row: number, col: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      const cell = grid[row][col];
      if (cell.value === '') {
        if (cell.wordIds.length > 0) {
          const word = preset.words.find((w) => w.id === cell.wordIds[0]);
          if (word) {
            let prevRow = row;
            let prevCol = col;
            if (word.direction === 'across') {
              prevCol -= 1;
            } else {
              prevRow -= 1;
            }
            if (
              grid[prevRow] &&
              grid[prevRow][prevCol] &&
              grid[prevRow][prevCol].isActive
            ) {
              const prevKey = `${prevRow}-${prevCol}`;
              if (inputsRef.current[prevKey]) {
                inputsRef.current[prevKey]?.focus();
              }
            }
          }
        }
      }
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollWrapper}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.verticalScroll}
      >
        <Pressable
          onPress={() => setFocusedCell(null)}
          style={styles.pressableOuter}
        >
          <View style={styles.gridContainer}>
            {grid.map((row, rIdx) => (
              <View key={`row-${rIdx}`} style={styles.row}>
                {row.map((cell, cIdx) => {
                  const cellSizeStyle = {
                    width: calculatedCellSize,
                    height: calculatedCellSize,
                  };
                  const cellFontSize = Math.max(12, calculatedCellSize * 0.6);
                  return (
                    <View
                      key={`cell-${rIdx}-${cIdx}`}
                      style={[
                        styles.cellWrapper,
                        cellSizeStyle,
                        cell.isActive ? {} : styles.cellInactiveWrapper,
                      ]}
                    >
                      {cell.isActive ? (
                        <>
                          <View
                            style={StyleSheet.absoluteFill}
                            pointerEvents="none"
                          >
                            <TextInput
                              style={[
                                styles.cellInput,
                                getCellStyle(cell),
                                {
                                  fontSize: cellFontSize,
                                  fontWeight: '800',
                                  padding: 0,
                                },
                              ]}
                              value={cell.value}
                              onChangeText={(t) =>
                                handleTextChange(t, cell.row, cell.col)
                              }
                              onKeyPress={(e) =>
                                handleKeyPress(e, cell.row, cell.col)
                              }
                              onFocus={() =>
                                setFocusedCell({ r: cell.row, c: cell.col })
                              }
                              onBlur={() => {
                                if (
                                  focusedCell?.r === cell.row &&
                                  focusedCell?.c === cell.col
                                ) {
                                  // We don't null here because Pressable will handle it
                                }
                              }}
                              maxLength={1}
                              autoCapitalize="characters"
                              selectTextOnFocus
                              ref={(el) => {
                                inputsRef.current[`${cell.row}-${cell.col}`] =
                                  el;
                              }}
                            />
                          </View>
                          {cell.numbers && cell.numbers.length > 0 && (
                            <View
                              style={styles.cellNumberContainer}
                              pointerEvents="none"
                            >
                              <Text
                                style={[
                                  styles.cellNumber,
                                  {
                                    fontSize: Math.max(
                                      6,
                                      calculatedCellSize * 0.25
                                    ),
                                  },
                                ]}
                              >
                                {cell.numbers.join(',')}
                              </Text>
                            </View>
                          )}
                          <Pressable
                            style={StyleSheet.absoluteFill}
                            onPress={() => {
                              const isSelected =
                                focusedCell?.r === cell.row &&
                                focusedCell?.c === cell.col;
                              if (isSelected) {
                                inputsRef.current[
                                  `${cell.row}-${cell.col}`
                                ]?.focus();
                              } else {
                                setFocusedCell({ r: cell.row, c: cell.col });
                              }
                            }}
                          />
                        </>
                      ) : (
                        <View style={styles.cellBlank} />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </Pressable>
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollWrapper: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressableOuter: {
    flex: 1,
    width: '100%',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flex: 1,
    width: '100%',
    flexDirection: 'column',
    backgroundColor: '#f5f6fa',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e4eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cellWrapper: {
    position: 'relative',
    margin: 2,
  },
  cellInactiveWrapper: {
    backgroundColor: 'transparent',
  },
  cellBlank: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cellInput: {
    flex: 1,
    backgroundColor: 'white',
    textAlign: 'center',
    color: '#0f186e',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#d0d5e0',
    padding: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cellFocusedBg: {
    backgroundColor: '#f8f9fc',
  },
  cellFocusedBorder: {
    borderColor: '#0f186e',
    shadowColor: '#0f186e',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  cellActive: {
    backgroundColor: 'white',
  },
  cellInactive: {
    backgroundColor: 'transparent',
  },
  cellCorrect: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    borderColor: '#4CAF50',
  },
  cellIncorrect: {
    backgroundColor: '#FFEBEE',
    color: '#D32F2F',
    borderColor: '#F44336',
  },
  cellNumberContainer: {
    position: 'absolute',
    top: 3,
    left: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  cellNumber: {
    fontSize: 10,
    color: '#0f186e',
    fontWeight: 'bold',
  },
});
