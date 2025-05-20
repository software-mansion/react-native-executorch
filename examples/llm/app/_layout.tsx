import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import CustomDrawerLayout from '../components/CustomDrawerLayout';
import { initDatabase } from '../database/initialization';

export default function Layout() {
  return (
    <GestureHandlerRootView>
      <SQLiteProvider databaseName="executorch.db" onInit={initDatabase}>
        <CustomDrawerLayout>
          <Stack>
            <Stack.Screen
              name="modal/add-model"
              options={{
                presentation: 'modal',
                title: 'Add Model',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="model-hub/index"
              options={{ title: 'Model Hub' }}
            />
            <Stack.Screen
              name="index"
              options={{ title: 'Chat', animation: 'none' }}
            />
            <Stack.Screen name="chat/[id]" options={{ animation: 'none' }} />
            <Stack.Screen
              name="chat/[id]/settings"
              options={{
                title: 'Chat Settings',
                presentation: 'modal',
                headerShown: false,
              }}
            />
          </Stack>
        </CustomDrawerLayout>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
