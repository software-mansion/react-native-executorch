import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
  return (
    <Drawer>
      <Drawer.Screen
        name="index"
        options={{ drawerLabel: 'Chat', title: 'Chat' }}
      />
      <Drawer.Screen
        name="model-hub/index"
        options={{ drawerLabel: 'Model Hub', title: 'Model Hub' }}
      />
    </Drawer>
  );
}
