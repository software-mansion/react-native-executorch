import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import SWMIcon from '../assets/swm_icon.svg';
import {
  CROSSWORDS,
  CrosswordPreset,
  CrosswordWord,
} from '../assets/crossword-data';
import {
  CrosswordGrid,
  CellData as GridCellData,
} from '../components/CrosswordGrid';
import { LevelSelector } from '../components/LevelSelector';
import { QuestionsModal } from '../components/QuestionsModal';
import { ClueBar } from '../components/ClueBar';

interface CellData {
  row: number;
  col: number;
  isActive: boolean;
  value: string;
  wordIds: number[];
  numbers: number[];
}

export const Crossword = ({ onBack }: { onBack: () => void }) => {
  const [preset, setPreset] = useState<CrosswordPreset | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    CROSSWORDS[1].id
  ); // Default to preset2 (complex)
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [wordStatuses, setWordStatuses] = useState<
    Record<number, 'correct' | 'incorrect' | 'incomplete'>
  >({});
  const [focusedCell, setFocusedCell] = useState<{
    r: number;
    c: number;
  } | null>(null);
  const [isQuestionsModalVisible, setIsQuestionsModalVisible] = useState(false);
  const [activeDirection, setActiveDirection] = useState<'across' | 'down'>(
    'across'
  );

  useEffect(() => {
    const selectedTemplate =
      CROSSWORDS.find((p) => p.id === selectedTemplateId) || CROSSWORDS[0];

    // Check orientation
    const { width, height } = Dimensions.get('window');
    const isVertical = height > width;

    // Dynamic Layout Generation
    const gridSize = 40;
    const charGrid: (string | null)[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(null));
    const wordGrid: Set<number>[][] = Array(gridSize)
      .fill(null)
      .map(() =>
        Array(gridSize)
          .fill(null)
          .map(() => new Set())
      );

    interface PlacedWord {
      id: number;
      answer: string;
      clue: string;
      direction: 'across' | 'down';
      row: number;
      col: number;
    }

    const placedWords: PlacedWord[] = [];
    const sortedWords = [...selectedTemplate.words].sort(
      (a, b) => b.answer.length - a.answer.length
    );

    const canPlace = (
      wordToPlace: CrosswordWord,
      r: number,
      c: number,
      dir: 'across' | 'down'
    ) => {
      const { answer, id } = wordToPlace;
      for (let i = 0; i < answer.length; i++) {
        const nr = dir === 'across' ? r : r + i;
        const nc = dir === 'across' ? c + i : c;
        if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) return false;

        const cell = charGrid[nr][nc];
        if (cell !== null && cell !== answer[i]) return false;

        // Check for overlaps: Cannot have two words in the same direction sharing a square
        if (cell !== null) {
          const existingWords = wordGrid[nr][nc];
          for (const wordId of existingWords) {
            const existingWord = placedWords.find((w) => w.id === wordId);
            if (existingWord && existingWord.direction === dir) return false;
          }
        }

        const isIntersection = cell === answer[i];

        // Strict adjacency check:
        // For EVERY square of the word, we must check neighbors that aren't in OUR line of placement.
        if (dir === 'across') {
          // Check top and bottom for ANY square (intersection or not)
          if (
            nr - 1 >= 0 &&
            charGrid[nr - 1][nc] !== null &&
            !wordGrid[nr - 1][nc].has(id)
          ) {
            if (!isIntersection) return false;
          }
          if (
            nr + 1 < gridSize &&
            charGrid[nr + 1][nc] !== null &&
            !wordGrid[nr + 1][nc].has(id)
          ) {
            if (!isIntersection) return false;
          }
          // For the first and last letters, check horizontally beyond the word
          if (i === 0 && nc - 1 >= 0 && charGrid[nr][nc - 1] !== null)
            return false;
          if (
            i === answer.length - 1 &&
            nc + 1 < gridSize &&
            charGrid[nr][nc + 1] !== null
          )
            return false;
        } else {
          // dir === 'down'
          // Check left and right for ANY square
          if (
            nc - 1 >= 0 &&
            charGrid[nr][nc - 1] !== null &&
            !wordGrid[nr][nc - 1].has(id)
          ) {
            if (!isIntersection) return false;
          }
          if (
            nc + 1 < gridSize &&
            charGrid[nr][nc + 1] !== null &&
            !wordGrid[nr][nc + 1].has(id)
          ) {
            if (!isIntersection) return false;
          }
          // For the first and last letters, check vertically beyond the word
          if (i === 0 && nr - 1 >= 0 && charGrid[nr - 1][nc] !== null)
            return false;
          if (
            i === answer.length - 1 &&
            nr + 1 < gridSize &&
            charGrid[nr + 1][nc] !== null
          )
            return false;
        }
      }
      return true;
    };

    sortedWords.forEach((word) => {
      if (placedWords.length === 0) {
        const r = Math.floor(gridSize / 2);
        const c = Math.floor(gridSize / 2) - Math.floor(word.answer.length / 2);
        const startDir: 'across' | 'down' = isVertical ? 'down' : 'across';

        for (let i = 0; i < word.answer.length; i++) {
          const nr = startDir === 'across' ? r : r + i;
          const nc = startDir === 'across' ? c + i : c;
          charGrid[nr][nc] = word.answer[i];
          wordGrid[nr][nc].add(word.id);
        }
        placedWords.push({ ...word, row: r, col: c, direction: startDir });
      } else {
        let placed = false;
        // Preferred direction based on orientation
        const preferredDir: 'across' | 'down' = isVertical ? 'down' : 'across';

        // Try placing with preferred direction first if possible by sorting intersection checks
        for (const pWord of placedWords) {
          if (placed) break;
          for (let i = 0; i < word.answer.length; i++) {
            if (placed) break;
            for (let j = 0; j < pWord.answer.length; j++) {
              if (word.answer[i] === pWord.answer[j]) {
                const dir = pWord.direction === 'across' ? 'down' : 'across';
                const r =
                  pWord.direction === 'across'
                    ? pWord.row! - i
                    : pWord.row! + j;
                const c =
                  pWord.direction === 'across'
                    ? pWord.col! + j
                    : pWord.col! - i;

                if (canPlace(word, r, c, dir)) {
                  for (let k = 0; k < word.answer.length; k++) {
                    const nr = dir === 'across' ? r : r + k;
                    const nc = dir === 'across' ? c + k : c;
                    charGrid[nr][nc] = word.answer[k];
                    wordGrid[nr][nc].add(word.id);
                  }
                  placedWords.push({ ...word, row: r, col: c, direction: dir });
                  placed = true;
                  break;
                }
              }
            }
          }
        }
        // If it couldn't be placed via intersection, we skip it to avoid breaking grid rules
      }
    });

    // Calculate crop bounds
    let minR = gridSize,
      maxR = 0,
      minC = gridSize,
      maxC = 0;
    placedWords.forEach((w) => {
      minR = Math.min(minR, w.row);
      minC = Math.min(minC, w.col);
      maxR = Math.max(
        maxR,
        w.direction === 'down' ? w.row + w.answer.length - 1 : w.row
      );
      maxC = Math.max(
        maxC,
        w.direction === 'across' ? w.col + w.answer.length - 1 : w.col
      );
    });

    const finalRows = maxR >= minR ? maxR - minR + 1 : 0;
    const finalCols = maxC >= minC ? maxC - minC + 1 : 0;

    const dynamicPreset: CrosswordPreset = {
      ...selectedTemplate,
      id: selectedTemplate.id + '_dynamic',
      rows: finalRows,
      cols: finalCols,
      words: placedWords.map((w) => ({
        ...w,
        row: w.row - minR,
        col: w.col - minC,
      })),
    };

    setPreset(dynamicPreset);

    // Initialize grid
    const newGrid: CellData[][] = Array(finalRows)
      .fill(null)
      .map((_, r) =>
        Array(finalCols)
          .fill(null)
          .map((_, c) => ({
            row: r,
            col: c,
            isActive: false,
            value: '',
            wordIds: [],
            numbers: [],
          }))
      );

    const initialStatuses: Record<
      number,
      'correct' | 'incorrect' | 'incomplete'
    > = {};

    dynamicPreset.words.forEach((word) => {
      initialStatuses[word.id] = 'incomplete';
      for (let i = 0; i < word.answer.length; i++) {
        const wordRow = word.row ?? 0;
        const wordCol = word.col ?? 0;
        const r = word.direction === 'across' ? wordRow : wordRow + i;
        const c = word.direction === 'across' ? wordCol + i : wordCol;

        if (newGrid[r] && newGrid[r][c]) {
          newGrid[r][c].isActive = true;
          newGrid[r][c].wordIds.push(word.id);
          if (i === 0) {
            newGrid[r][c].numbers.push(word.id);
          }
        }
      }
    });

    setGrid(newGrid);
    setWordStatuses(initialStatuses);
  }, [selectedTemplateId]);

  const handleCellChange = (text: string, row: number, col: number) => {
    const val = text.toUpperCase().replace(/[^A-Z]/g, '');
    const newGrid = [...grid];
    newGrid[row][col].value = val.length > 0 ? val[val.length - 1] : '';
    setGrid(newGrid);
    checkWords(newGrid);
  };

  const checkWords = (currentGrid: CellData[][]) => {
    if (!preset) return;
    const newStatuses = { ...wordStatuses };

    preset.words.forEach((word) => {
      let isComplete = true;
      let isCorrect = true;
      let currentString = '';

      for (let i = 0; i < word.answer.length; i++) {
        const r =
          word.direction === 'across' ? word.row || 0 : (word.row || 0) + i;
        const c =
          word.direction === 'across' ? (word.col || 0) + i : word.col || 0;

        if (!currentGrid[r] || !currentGrid[r][c]) {
          isComplete = false;
          break;
        }

        const cell = currentGrid[r][c];

        if (!cell.value) {
          isComplete = false;
          break;
        }
        currentString += cell.value;
      }

      if (!isComplete) {
        newStatuses[word.id] = 'incomplete';
      } else {
        if (currentString === word.answer.toUpperCase()) {
          newStatuses[word.id] = 'correct';
        } else {
          newStatuses[word.id] = 'incorrect';
        }
      }
    });

    setWordStatuses(newStatuses);
  };

  if (!preset) return <View style={styles.container} />;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <FontAwesome name="chevron-left" size={20} color="#0f186e" />
          </TouchableOpacity>
          <SWMIcon width={40} height={40} />
          <Text style={styles.headerText}>Crossword</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.questionsButton}
              onPress={() => setIsQuestionsModalVisible(true)}
            >
              <Text style={styles.questionsButtonText}>Questions</Text>
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <LevelSelector
            levels={CROSSWORDS}
            selectedTemplateId={selectedTemplateId}
            onSelectLevel={setSelectedTemplateId}
          />
          <View style={styles.gridFill}>
            <CrosswordGrid
              grid={grid}
              preset={preset}
              wordStatuses={wordStatuses}
              onCellChange={handleCellChange}
              onFocusedCellChange={(cell) => {
                setFocusedCell(cell);
                if (cell) {
                  const cellData = grid[cell.r]?.[cell.c];
                  const wordsHere = (cellData?.wordIds ?? [])
                    .map((id) => preset.words.find((w) => w.id === id))
                    .filter(Boolean) as typeof preset.words;
                  if (
                    wordsHere.length > 0 &&
                    !wordsHere.some((w) => w.direction === activeDirection)
                  ) {
                    const dir = wordsHere[0].direction;
                    if (dir) setActiveDirection(dir);
                  }
                }
              }}
            />
          </View>

          <QuestionsModal
            visible={isQuestionsModalVisible}
            words={preset.words}
            wordStatuses={wordStatuses}
            onClose={() => setIsQuestionsModalVisible(false)}
          />

          <View style={styles.clueBarContainer}>
            {focusedCell &&
              (() => {
                const cellData = grid[focusedCell.r]?.[focusedCell.c];
                const wordsHere = (cellData?.wordIds ?? [])
                  .map((id) => preset.words.find((w) => w.id === id))
                  .filter(Boolean) as typeof preset.words;
                if (wordsHere.length === 0) return null;
                const active =
                  wordsHere.find((w) => w.direction === activeDirection) ??
                  wordsHere[0];
                const canToggle = wordsHere.length > 1;
                return (
                  <ClueBar
                    activeWord={active}
                    canToggle={canToggle}
                    onToggleDirection={() => {
                      if (canToggle) {
                        const other = wordsHere.find(
                          (w) => w.direction !== activeDirection
                        );
                        if (other?.direction)
                          setActiveDirection(other.direction);
                      }
                    }}
                  />
                );
              })()}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
  },
  backButton: {
    paddingRight: 15,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f186e',
    marginLeft: 10,
  },
  headerRight: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
  },
  questionsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0f186e',
  },
  questionsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  gridFill: {
    flex: 1,
    width: '100%',
  },
  clueBarContainer: {
    height: 60, // Fixed height to prevent layout shift
    justifyContent: 'center',
  },
});
