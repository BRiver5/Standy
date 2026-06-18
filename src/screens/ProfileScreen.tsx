import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, ScreenHeader, Button, Card, Icon, PressableScale, EntranceView } from '../components';
import { colors, fontSize, fontWeight, radii, spacing } from '../theme';
import { getProfile, updateProfile } from '../services/profile';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const profile = await getProfile();
      setName(profile.name ?? '');
      setPhoto(profile.photo_path);
    })();
  }, []);

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

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim().length ? name.trim() : null,
        photo_path: photo,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <ScreenHeader title="Profile" onBack={() => navigation.goBack()} />

      <EntranceView style={styles.cardWrap}>
        <Card style={styles.card}>
          <PressableScale onPress={pickPhoto} style={styles.avatarWrap}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="camera" size={28} color={colors.textSecondary} />
              </View>
            )}
            <Text style={styles.avatarHint}>{photo ? 'Change photo' : 'Add a photo'}</Text>
          </PressableScale>

          {photo ? (
            <PressableScale onPress={() => setPhoto(null)} style={styles.removeWrap}>
              <Text style={styles.removeText}>Remove photo</Text>
            </PressableScale>
          ) : null}

          <Text style={styles.label}>Your name</Text>
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

      <EntranceView index={1} style={styles.actions}>
        <Button label="Save" onPress={save} disabled={saving} />
        <Button label="Cancel" variant="ghost" onPress={() => navigation.goBack()} disabled={saving} />
      </EntranceView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
  },
  cardWrap: {
    marginTop: spacing.lg,
  },
  card: {
    alignItems: 'stretch',
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
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
  removeWrap: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  removeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
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
