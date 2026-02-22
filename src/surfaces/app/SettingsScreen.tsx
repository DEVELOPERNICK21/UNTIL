import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient, Card } from '../../ui';
import { useObserveTimeState, useUpdateUserProfile } from '../../hooks';
import { syncWidgetCache } from '../../infrastructure';
import { Colors, Spacing, Radius } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Settings'>>();
  const { userProfile } = useObserveTimeState();
  const updateUserProfile = useUpdateUserProfile();

  const [birthInput, setBirthInput] = useState(userProfile.birthDate ?? '');
  const [deathInput, setDeathInput] = useState(String(userProfile.deathAge));

  useEffect(() => {
    setBirthInput(userProfile.birthDate ?? '');
    setDeathInput(String(userProfile.deathAge));
  }, [userProfile.birthDate, userProfile.deathAge]);

  const handleSave = () => {
    if (birthInput) {
      const age = parseInt(deathInput, 10);
      updateUserProfile(birthInput, isNaN(age) || age <= 0 ? 80 : age);
      syncWidgetCache();
    }
  };

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text variant="sectionTitle" color="primary" style={styles.title}>
              Settings
            </Text>

            <Card style={styles.card}>
              <Text variant="caption" color="secondary" style={styles.label}>
                Birth date (YYYY-MM-DD)
              </Text>
              <TextInput
                style={styles.input}
                value={birthInput}
                onChangeText={setBirthInput}
                placeholder="1990-01-15"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
              />

              <Text variant="caption" color="secondary" style={styles.label}>
                Expected lifespan (years)
              </Text>
              <TextInput
                style={styles.input}
                value={deathInput}
                onChangeText={setDeathInput}
                placeholder="80"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
              />
            </Card>

            <TouchableOpacity style={styles.cta} onPress={handleSave}>
              <Text variant="sectionTitle" color="primary">
                Save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.widgetLink}
              onPress={() => navigation.navigate('Widget')}
            >
              <Text variant="body" color="secondary">Widgets</Text>
              <Text variant="caption" color="secondary">Info and status</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  content: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[5],
  },
  title: {
    marginBottom: Spacing[4],
  },
  card: {
    marginBottom: Spacing[4],
  },
  label: {
    marginBottom: Spacing[2],
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.sm,
    padding: Spacing[3],
    marginBottom: Spacing[3],
    color: Colors.textPrimary,
    fontSize: 16,
  },
  cta: {
    backgroundColor: Colors.divider,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  widgetLink: {
    marginTop: Spacing[4],
    paddingVertical: Spacing[2],
  },
});