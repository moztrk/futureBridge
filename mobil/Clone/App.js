import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import FeedScreen from './screens/FeedScreen'; // Ana sayfa (feed) içeriği için yeni bir bileşen
import AI_MentorshipScreen from './screens/AIMentorshipScreen'; // Örnek ekran
import NotificationsScreen from './screens/NotificationsScreen'; // Örnek ekran
import MessagesScreen from './screens/MessagesScreen'; // Örnek ekran
import ProfileScreen from './screens/ProfileScreen'; // Örnek ekran

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        switch (route.name) {
          case 'Ana Sayfa': iconName = focused ? 'home' : 'home-outline'; break;
          case 'Mentorluk': iconName = 'rocket'; break;
          case 'Bildirimler': iconName = 'notifications'; break;
          case 'Mesajlar': iconName = 'mail'; break;
          case 'Profil': iconName = 'person'; break;
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#2563EB',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Ana Sayfa" component={FeedScreen} />
    <Tab.Screen name="Mentorluk" component={AI_MentorshipScreen} />
    <Tab.Screen name="Bildirimler" component={NotificationsScreen} />
    <Tab.Screen name="Mesajlar" component={MessagesScreen} />
    <Tab.Screen name="Profil" component={ProfileScreen} />
  </Tab.Navigator>
);

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={BottomTabNavigator} />
        <Stack.Screen name="Signup" component={SignupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
