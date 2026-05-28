import { MD3DarkTheme } from 'react-native-paper';

export type StylePreset = {
  id: string;
  flag: string;
  label: string;
  paperTheme: {
    primary: string;
    onPrimary: string;
    secondaryContainer: string;
    surface: string;
    surfaceContainerHigh: string;
    background: string;
    onSurface: string;
    onSurfaceVariant: string;
    backdrop: string;
    elevation: {
      level1: string;
      level2: string;
      level3: string;
    };
  };
  ui: {
    placeholder: string;
    gradientTop: string;
    containerBackground: string;
    inputBackground: string;
    inputOutline: string;
    inputActiveOutline: string;
    inputText: string;
    inputPlaceholder: string;
    inputCursor: string;
    inputSelection: string;
    inputIcon: string;
    fabBackground: string;
    fabIcon: string;
  };
};

export const presets: Record<string, StylePreset> = {
  us: {
    id: 'us',
    flag: '\uD83C\uDDFA\uD83C\uDDF8',
    label: 'English',
    paperTheme: {
      primary: '#9CA3AF',
      onPrimary: '#FFFFFF',
      secondaryContainer: '#22262D',
      surface: '#0D0F11',
      surfaceContainerHigh: '#1C1F25',
      background: '#0D0F11',
      onSurface: '#E6EDF3',
      onSurfaceVariant: '#8B949E',
      backdrop: 'rgba(0,0,0,0.6)',
      elevation: {
        level1: '#1A1D22',
        level2: '#22262D',
        level3: '#2A2E36',
      },
    },
    ui: {
      placeholder: 'Ask Gemma...',
      gradientTop: '#1A1D22',
      containerBackground: '#0D0F11',
      inputBackground: '#1A1D22',
      inputOutline: '#30363D',
      inputActiveOutline: '#9CA3AF',
      inputText: '#E6EDF3',
      inputPlaceholder: '#484F58',
      inputCursor: '#9CA3AF',
      inputSelection: 'rgba(156,163,175,0.3)',
      inputIcon: '#9CA3AF',
      fabBackground: '#66696e',
      fabIcon: '#FFFFFF',
    },
  },
  es: {
    id: 'es',
    flag: '\uD83C\uDDEA\uD83C\uDDF8',
    label: 'Spanish',
    paperTheme: {
      primary: '#F1BF00',
      onPrimary: '#000000',
      secondaryContainer: '#1E1A12',
      surface: '#0D0D0A',
      surfaceContainerHigh: '#1A1610',
      background: '#0D0D0A',
      onSurface: '#EDE8D8',
      onSurfaceVariant: '#8A8470',
      backdrop: 'rgba(0,0,0,0.6)',
      elevation: {
        level1: '#1A1610',
        level2: '#1E1A12',
        level3: '#241E16',
      },
    },
    ui: {
      placeholder: 'Pregunta a Gemma...',
      gradientTop: '#221808',
      containerBackground: '#0D0D0A',
      inputBackground: '#1A1610',
      inputOutline: '#3D3020',
      inputActiveOutline: '#F1BF00',
      inputText: '#EDE8D8',
      inputPlaceholder: '#5C5040',
      inputCursor: '#F1BF00',
      inputSelection: 'rgba(241,191,0,0.3)',
      inputIcon: '#F1BF00',
      fabBackground: '#F1BF00',
      fabIcon: '#000000',
    },
  },
  pt: {
    id: 'pt',
    flag: '\uD83C\uDDF5\uD83C\uDDF9',
    label: 'Portuguese',
    paperTheme: {
      primary: '#1B5E20',
      onPrimary: '#A5D6A7',
      secondaryContainer: '#141C14',
      surface: '#070A07',
      surfaceContainerHigh: '#0E140E',
      background: '#070A07',
      onSurface: '#DCE4DC',
      onSurfaceVariant: '#6E7A6E',
      backdrop: 'rgba(0,0,0,0.6)',
      elevation: {
        level1: '#0E140E',
        level2: '#141C14',
        level3: '#1A221A',
      },
    },
    ui: {
      placeholder: 'Pergunte à Gemma...',
      gradientTop: '#0A180A',
      containerBackground: '#070A07',
      inputBackground: '#0E140E',
      inputOutline: '#1E2E1E',
      inputActiveOutline: '#1B5E20',
      inputText: '#DCE4DC',
      inputPlaceholder: '#3A4A3A',
      inputCursor: '#1B5E20',
      inputSelection: 'rgba(27,94,32,0.3)',
      inputIcon: '#2E7D32',
      fabBackground: '#1B5E20',
      fabIcon: '#A5D6A7',
    },
  },
  fr: {
    id: 'fr',
    flag: '\uD83C\uDDEB\uD83C\uDDF7',
    label: 'French',
    paperTheme: {
      primary: '#3B82F6',
      onPrimary: '#FFFFFF',
      secondaryContainer: '#161D36',
      surface: '#0A0D14',
      surfaceContainerHigh: '#12172B',
      background: '#0A0D14',
      onSurface: '#E2E6F0',
      onSurfaceVariant: '#7B8294',
      backdrop: 'rgba(0,0,0,0.6)',
      elevation: {
        level1: '#12172B',
        level2: '#161D36',
        level3: '#1C2440',
      },
    },
    ui: {
      placeholder: 'Demande à Gemma...',
      gradientTop: '#101E3A',
      containerBackground: '#0A0D14',
      inputBackground: '#12172B',
      inputOutline: '#2A3555',
      inputActiveOutline: '#3B82F6',
      inputText: '#E2E6F0',
      inputPlaceholder: '#4A5270',
      inputCursor: '#3B82F6',
      inputSelection: 'rgba(59,130,246,0.3)',
      inputIcon: '#3B82F6',
      fabBackground: '#286cd8',
      fabIcon: '#FFFFFF',
    },
  },
  in: {
    id: 'in',
    flag: '\uD83C\uDDEE\uD83C\uDDF3',
    label: 'Hindi',
    paperTheme: {
      primary: '#FF9933',
      onPrimary: '#1A1A10',
      secondaryContainer: '#1E1C12',
      surface: '#0D0D0A',
      surfaceContainerHigh: '#1A1A10',
      background: '#0D0D0A',
      onSurface: '#EDE8D8',
      onSurfaceVariant: '#8A8470',
      backdrop: 'rgba(0,0,0,0.6)',
      elevation: {
        level1: '#1A1A10',
        level2: '#1E1C12',
        level3: '#242016',
      },
    },
    ui: {
      placeholder: 'Gemma se pūchhein...',
      gradientTop: '#221808',
      containerBackground: '#0D0D0A',
      inputBackground: '#1A1A10',
      inputOutline: '#3D3520',
      inputActiveOutline: '#FF9933',
      inputText: '#EDE8D8',
      inputPlaceholder: '#665544',
      inputCursor: '#FF9933',
      inputSelection: 'rgba(255,153,51,0.3)',
      inputIcon: '#FF9933',
      fabBackground: '#FF9933',
      fabIcon: '#FFFFFF',
    },
  },
  pl: {
    id: 'pl',
    flag: '\uD83C\uDDF5\uD83C\uDDF1',
    label: 'Polish',
    paperTheme: {
      primary: '#DC143C',
      onPrimary: '#FFFFFF',
      secondaryContainer: '#1E1418',
      surface: '#0D0D0D',
      surfaceContainerHigh: '#1A1214',
      background: '#0D0D0D',
      onSurface: '#EDE6E8',
      onSurfaceVariant: '#8A7B7E',
      backdrop: 'rgba(0,0,0,0.6)',
      elevation: {
        level1: '#1A1214',
        level2: '#1E1418',
        level3: '#24181C',
      },
    },
    ui: {
      placeholder: 'Zapytaj Gemmę...',
      gradientTop: '#201418',
      containerBackground: '#0D0D0D',
      inputBackground: '#1A1214',
      inputOutline: '#3D2528',
      inputActiveOutline: '#DC143C',
      inputText: '#EDE6E8',
      inputPlaceholder: '#5C4045',
      inputCursor: '#DC143C',
      inputSelection: 'rgba(220,20,60,0.3)',
      inputIcon: '#DC143C',
      fabBackground: '#DC143C',
      fabIcon: '#FFFFFF',
    },
  },
  it: {
    id: 'it',
    flag: '\uD83C\uDDEE\uD83C\uDDF9',
    label: 'Italian',
    paperTheme: {
      primary: '#009246',
      onPrimary: '#FFFFFF',
      secondaryContainer: '#1A1F1A',
      surface: '#0A0D0A',
      surfaceContainerHigh: '#121712',
      background: '#0A0D0A',
      onSurface: '#E2E8E2',
      onSurfaceVariant: '#7A827A',
      backdrop: 'rgba(0,0,0,0.6)',
      elevation: {
        level1: '#121712',
        level2: '#1A1F1A',
        level3: '#202520',
      },
    },
    ui: {
      placeholder: 'Chiedi a Gemma...',
      gradientTop: '#0C1C0C',
      containerBackground: '#0A0D0A',
      inputBackground: '#121712',
      inputOutline: '#2A352A',
      inputActiveOutline: '#009246',
      inputText: '#E2E8E2',
      inputPlaceholder: '#4A554A',
      inputCursor: '#009246',
      inputSelection: 'rgba(0,146,70,0.3)',
      inputIcon: '#009246',
      fabBackground: '#009246',
      fabIcon: '#FFFFFF',
    },
  },
  de: {
    id: 'de',
    flag: '\uD83C\uDDE9\uD83C\uDDEA',
    label: 'German',
    paperTheme: {
      primary: '#383838',
      onPrimary: '#CCCCCC',
      secondaryContainer: '#222222',
      surface: '#0E0E0E',
      surfaceContainerHigh: '#181818',
      background: '#0E0E0E',
      onSurface: '#E0E0E0',
      onSurfaceVariant: '#A0A0A0',
      backdrop: 'rgba(0,0,0,0.65)',
      elevation: {
        level1: '#1A1A1A',
        level2: '#222222',
        level3: '#282828',
      },
    },
    ui: {
      placeholder: 'Frage Gemma...',
      gradientTop: '#1A1A1A',
      containerBackground: '#0E0E0E',
      inputBackground: '#181818',
      inputOutline: '#404040',
      inputActiveOutline: '#DD0000',
      inputText: '#E0E0E0',
      inputPlaceholder: '#606060',
      inputCursor: '#DD0000',
      inputSelection: 'rgba(221,0,0,0.3)',
      inputIcon: '#DD0000',
      fabBackground: '#383838',
      fabIcon: '#DD0000',
    },
  },
};

export function buildTheme(preset: StylePreset) {
  return {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      ...preset.paperTheme,
      elevation: {
        ...MD3DarkTheme.colors.elevation,
        ...preset.paperTheme.elevation,
      },
    },
  };
}

export const presetOrder: string[] = [
  'us',
  'es',
  'pt',
  'fr',
  'it',
  'de',
  'pl',
  'in',
];
