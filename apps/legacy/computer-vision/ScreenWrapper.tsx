import { useIsFocused } from 'expo-router';
import { PropsWithChildren } from 'react';

export default function ScreenWrapper({ children }: PropsWithChildren) {
  const isFocused = useIsFocused();

  return isFocused ? <>{children}</> : null;
}
