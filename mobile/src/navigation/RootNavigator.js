import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/theme';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import AddDocumentScreen from '../screens/AddDocumentScreen';
import RenewalScreen from '../screens/RenewalScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DocumentDetailScreen from '../screens/DocumentDetailScreen';
import EditDocumentScreen from '../screens/EditDocumentScreen';
import SearchScreen from '../screens/SearchScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import RenewalDetailScreen from '../screens/RenewalDetailScreen';
import VersionHistoryScreen from '../screens/VersionHistoryScreen';
import ShareScreen from '../screens/ShareScreen';
import { onNotificationTap, registerForPush } from '../services/pushService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  Documents: ['documents', 'documents-outline'],
  Renewal: ['refresh-circle', 'refresh-circle-outline'],
  Profile: ['person', 'person-outline'],
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { height: 58 + insets.bottom, paddingBottom: insets.bottom + 4, paddingTop: 6, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'AddDocument') {
            return (
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: -22, borderWidth: 4, borderColor: colors.bg }}>
                <Ionicons name="add" size={30} color="#fff" />
              </View>
            );
          }
          const [on, off] = TAB_ICONS[route.name];
          return <Ionicons name={focused ? on : off} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Documents" component={DocumentsScreen} />
      <Tab.Screen name="AddDocument" component={AddDocumentScreen} options={{ tabBarLabel: 'Add' }} />
      <Tab.Screen name="Renewal" component={RenewalScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

/** Registers for push once signed in, and opens the renewal guide when a push notification is tapped. */
function PushBridge() {
  const navigation = useNavigation();
  useEffect(() => {
    registerForPush();
    return onNotificationTap((documentId) => navigation.navigate('RenewalDetail', { documentId }));
  }, [navigation]);
  return null;
}

const headerOpts = { headerTintColor: colors.text, headerStyle: { backgroundColor: colors.surface }, headerShadowVisible: false };

export default function RootNavigator() {
  const { token, booting } = useAuth();

  if (booting) return <SplashScreen />;

  if (!token) {
    return (
      <Stack.Navigator screenOptions={{ ...headerOpts, headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: true, title: '' }} />
      </Stack.Navigator>
    );
  }

  return (
    <>
    <PushBridge />
    <Stack.Navigator screenOptions={headerOpts}>
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} options={{ title: 'Document' }} />
      <Stack.Screen name="EditDocument" component={EditDocumentScreen} options={{ title: 'Edit document' }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="RenewalDetail" component={RenewalDetailScreen} options={{ title: 'Renewal guide' }} />
      <Stack.Screen name="VersionHistory" component={VersionHistoryScreen} options={{ title: 'Version history' }} />
      <Stack.Screen name="Share" component={ShareScreen} options={{ title: 'Share securely' }} />
    </Stack.Navigator>
    </>
  );
}
