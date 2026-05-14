export interface CrosswordWord {
  id: number;
  answer: string;
  clue: string;
  row?: number;
  col?: number;
  direction?: 'across' | 'down';
}

export interface CrosswordPreset {
  id: string;
  rows?: number;
  cols?: number;
  words: CrosswordWord[];
}

export const CROSSWORDS: CrosswordPreset[] = [
  {
    id: 'Level 1',
    rows: 10,
    cols: 8,
    words: [
      { id: 1, answer: 'STORM', clue: 'Heavy rain and wind' },
      { id: 2, answer: 'SPACE', clue: 'The final frontier' },
      { id: 3, answer: 'VALVE', clue: 'Controls flow of liquid' },
      { id: 4, answer: 'BREAD', clue: 'Basis of a sandwich' },
      { id: 5, answer: 'MUSIC', clue: 'Melody and rhythm' },
      { id: 6, answer: 'OCEAN', clue: 'Large body of salt water' },
      { id: 7, answer: 'CHAIR', clue: 'Something to sit on' },
      { id: 8, answer: 'LIGHT', clue: 'Opposite of dark' },
    ],
  },
  {
    id: 'Level 2',
    rows: 10,
    cols: 11,
    words: [
      { id: 1, answer: 'MOUNTAIN', clue: 'Very high land mass' },
      { id: 2, answer: 'PLANET', clue: 'Earth or Mars' },
      { id: 3, answer: 'RIVER', clue: 'Flowing water' },
      { id: 4, answer: 'BRIDGE', clue: 'Path over water' },
      { id: 5, answer: 'COFFEE', clue: 'Morning caffeine drink' },
      { id: 6, answer: 'WINTER', clue: 'Coldest season' },
      { id: 7, answer: 'SILVER', clue: 'Shiny precious metal' },
      { id: 8, answer: 'GARDEN', clue: 'Place to grow plants' },
      { id: 9, answer: 'CLOUDS', clue: 'White shapes in the sky' },
      { id: 10, answer: 'FOREST', clue: 'Many trees together' },
    ],
  },
  {
    id: 'Level 3',
    rows: 8,
    cols: 8,
    words: [
      { id: 1, answer: 'YELLOW', clue: 'Color of the sun' },
      { id: 2, answer: 'SCHOOL', clue: 'Place for learning' },
      { id: 3, answer: 'ORANGE', clue: 'Citrus fruit' },
      { id: 4, answer: 'SUMMER', clue: 'Hottest season' },
      { id: 5, answer: 'WINDOW', clue: 'Glass in a wall' },
      { id: 6, answer: 'GUITAR', clue: 'Stringed instrument' },
    ],
  },
  {
    id: 'Level 4',
    rows: 7,
    cols: 7,
    words: [
      { id: 1, answer: 'PIZZA', clue: 'Italian dish with cheese' },
      { id: 2, answer: 'TIGER', clue: 'Large striped cat' },
      { id: 3, answer: 'HONEY', clue: 'Sweet bee product' },
      { id: 4, answer: 'SNAKE', clue: 'Slithering reptile' },
      { id: 5, answer: 'PLANE', clue: 'It flies in the sky' },
    ],
  },
  {
    id: 'Level 5',
    rows: 9,
    cols: 9,
    words: [
      { id: 1, answer: 'BICYCLE', clue: 'Two-wheeled transport' },
      { id: 2, answer: 'CAKE', clue: 'Sweet birthday treat' },
      { id: 3, answer: 'TRAIN', clue: 'Goes on tracks' },
      { id: 4, answer: 'HEART', clue: 'Pumps your blood' },
      { id: 5, answer: 'LEMON', clue: 'Sour yellow fruit' },
    ],
  },
  {
    id: 'Level 6',
    rows: 6,
    cols: 6,
    words: [
      { id: 1, answer: 'APPLE', clue: 'Red or green fruit' },
      { id: 2, answer: 'CLOCK', clue: 'Tells the time' },
      { id: 3, answer: 'SHOES', clue: 'Wear them on feet' },
      { id: 4, answer: 'DESK', clue: 'Work table' },
    ],
  },
  {
    id: 'Level 7',
    rows: 8,
    cols: 9,
    words: [
      { id: 1, answer: 'CAMERA', clue: 'Takes photographs' },
      { id: 2, answer: 'PHONE', clue: 'Device for calling' },
      { id: 3, answer: 'RADIO', clue: 'Listen to music or news' },
      { id: 4, answer: 'TABLET', clue: 'Flat computer' },
    ],
  },
  {
    id: 'Level 8',
    rows: 5,
    cols: 5,
    words: [
      { id: 1, answer: 'BOOKS', clue: 'Things to read' },
      { id: 2, answer: 'GLOVE', clue: 'Hand warmer' },
      { id: 3, answer: 'LAMP', clue: 'Source of indoor light' },
      { id: 4, answer: 'MOUSE', clue: 'Small rodent or PC tool' },
    ],
  },
  {
    id: 'Level 9',
    rows: 7,
    cols: 8,
    words: [
      { id: 1, answer: 'DREAMS', clue: 'Thoughts while sleeping' },
      { id: 2, answer: 'FRIEND', clue: 'A person you like' },
      { id: 3, answer: 'FAMILY', clue: 'Parents and children' },
      { id: 4, answer: 'LAUGH', clue: 'Sound of being happy' },
    ],
  },
  {
    id: 'Level 10',
    rows: 6,
    cols: 6,
    words: [
      { id: 1, answer: 'FLOWER', clue: 'Bloom in a garden' },
      { id: 2, answer: 'GASSY', clue: 'Like a balloon' },
      { id: 3, answer: 'BEACH', clue: 'Sandy place by sea' },
      { id: 4, answer: 'CRAB', clue: 'Clawed sea creature' },
    ],
  },
];
