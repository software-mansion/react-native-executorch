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
      primary: '#3B82F6',
      onPrimary: '#FFFFFF',
      secondaryContainer: '#1C2128',
      surface: '#0D1117',
      surfaceContainerHigh: '#161B22',
      background: '#0D1117',
      onSurface: '#E6EDF3',
      onSurfaceVariant: '#8B949E',
      backdrop: 'rgba(0,0,0,0.6)',
      elevation: {
        level1: '#161B22',
        level2: '#1C2128',
        level3: '#22272E',
      },
    },
    ui: {
      placeholder: 'Ask Gemma...',
      gradientTop: '#122445',
      containerBackground: '#0D1117',
      inputBackground: '#161B22',
      inputOutline: '#30363D',
      inputActiveOutline: '#3B82F6',
      inputText: '#E6EDF3',
      inputPlaceholder: '#484F58',
      inputCursor: '#3B82F6',
      inputSelection: 'rgba(59,130,246,0.3)',
      inputIcon: '#3B82F6',
      fabBackground: '#3B82F6',
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
      fabBackground: '#C62828',
      fabIcon: '#FFFFFF',
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
      fabBackground: '#DC2626',
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

export const presetOrder: string[] = ['us', 'es', 'fr', 'in', 'pl'];
