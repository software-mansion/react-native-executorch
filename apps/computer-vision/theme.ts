import { StyleSheet } from 'react-native';

export const ColorPalette = {
  primary: '#001A72',
  strongPrimary: '#020F3C',
};

export const theme = {
  colors: {
    primary: ColorPalette.primary,
    strongPrimary: ColorPalette.strongPrimary,
    secondary: '#ffffff',
    accent: '#1a73e8',
    background: '#f5f5f5',
    cardBackground: '#ffffff',
    placeholderBackground: '#eaeaea',
    border: '#ccc',
    lightBorder: '#e9ecef',
    errorBackground: '#ffe3e3',
    errorText: '#d63031',
    textPrimary: '#ffffff',
    textSecondary: '#000000',
    textMuted: '#666666',
    textPlaceholder: '#868e96',
  },
  radius: {
    small: 8,
    medium: 12,
    large: 16,
  },
  spacing: {
    small: 8,
    medium: 12,
    large: 16,
  },
  typography: {
    title: {
      fontSize: 22,
      fontWeight: '700' as const,
    },
    body: {
      fontSize: 14,
      color: '#333333',
    },
  },
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.large,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
    color: theme.colors.strongPrimary,
    marginBottom: theme.spacing.large,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.small,
    width: '100%',
    marginBottom: theme.spacing.large,
  },
  description: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.large,
    paddingHorizontal: theme.spacing.medium,
  },
});
