import { StyleSheet } from 'react-native';
import { theme } from './theme';

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
