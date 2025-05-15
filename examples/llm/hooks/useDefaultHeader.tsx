import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import DrawerToggleButton from '../components/DrawerToggleButton';

export const useDefaultHeader = () => {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <DrawerToggleButton />,
    });
  }, [navigation]);
};
