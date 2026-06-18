import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { getDb } from './src/db/client';
import { isOnboarded } from './src/services/meta';
import { configureNotifications, scheduleNextReminder } from './src/notifications/scheduler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef, navigate } from './src/navigation/navigationRef';
import { colors, fontSize, fontWeight } from './src/theme';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.textPrimary,
    primary: colors.accent,
    border: colors.border,
  },
};

function openReminder(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as {
    reminderTypeId?: number;
    scheduledAt?: string;
  };
  if (data?.reminderTypeId) {
    navigate('ReminderFire', {
      reminderTypeId: data.reminderTypeId,
      scheduledAt: data.scheduledAt,
    });
  }
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const receivedListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    (async () => {
      await getDb();
      await configureNotifications();
      const done = await isOnboarded();
      setOnboarded(done);
      if (done) {
        await scheduleNextReminder();
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;

    // Foreground: surface the in-app reminder modal and keep the chain going.
    receivedListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as { reminderTypeId?: number; scheduledAt?: string };
      if (data?.reminderTypeId) {
        navigate('ReminderFire', {
          reminderTypeId: data.reminderTypeId,
          scheduledAt: data.scheduledAt,
        });
      }
      scheduleNextReminder();
    });

    // Tapped from background / killed state.
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      openReminder(response);
      scheduleNextReminder();
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openReminder(response);
    });

    return () => {
      receivedListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [ready]);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={styles.brand}>Standy</Text>
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <NavigationContainer ref={navigationRef} theme={navTheme}>
          <RootNavigator initialOnboarded={onboarded} />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  spinner: {
    marginTop: 24,
  },
});
