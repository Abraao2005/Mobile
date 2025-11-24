import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: { backgroundColor: '#2196F3' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="produtos" options={{ title: 'Produtos', tabBarIcon: ({ color, size }) => <Ionicons name="pricetag" size={size} color={color} /> }} />
      <Tabs.Screen name="vendas" options={{ title: 'Vendas', tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} /> }} />
      <Tabs.Screen name="relatorios" options={{ href: null }} />
      <Tabs.Screen name="configuracoes" options={{ href: null }} />
    </Tabs>
  );
}
