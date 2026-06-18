import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Button, Card, Icon, PressableScale, EntranceView } from '../components';
import { colors, fontSize, fontWeight, radii, spacing } from '../theme';
import { updateProfile } from '../services/profile';
import { setOnboarded } from '../services/meta';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  const finish = async (withProfile: boolean) => {
    setSaving(true);
    try {
      if (withProfile) {
        await updateProfile({
          name: name.trim().length ? name.trim() : null,
          photo_path: photo,
        });
      }
      await setOnboarded();
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <EntranceView>
        <Text style={styles.brand}>Standy</Text>
        <Text style={styles.tagline}>Standy got your back. Literally.</Text>
      </EntranceView>

      <EntranceView index={1} style={styles.cardWrap}>
        <Card style={styles.card}>
          <PressableScale onPress={pickPhoto} style={styles.avatarWrap}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="camera" size={28} color={colors.textSecondary} />
              </View>
            )}
            <Text style={styles.avatarHint}>Add a photo (optional)</Text>
          </PressableScale>

          <Text style={styles.label}>Your name (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Alex"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            maxLength={40}
          />
        </Card>
      </EntranceView>

      <EntranceView index={2} style={styles.actions}>
        <Button label="Get started" onPress={() => finish(true)} disabled={saving} />
        <Button
          label="Skip for now"
          variant="ghost"
          onPress={() => finish(false)}
          disabled={saving}
        />
      </EntranceView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  brand: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tagline: {
    marginTop: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cardWrap: {
    marginTop: spacing.xxxl,
  },
  card: {
    alignItems: 'stretch',
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  actions: {
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
});
