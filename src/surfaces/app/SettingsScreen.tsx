import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from '../../ui';
import { useObserveTimeState, useUpdateUserProfile } from '../../hooks';
import { Colors, Spacing } from '../../theme';

export function SettingsScreen() {
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
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text variant="label" color="primary" style={styles.title}>
          Settings
        </Text>

        <Text variant="label" color="secondary" style={styles.label}>
          Birth Date (YYYY-MM-DD)
        </Text>
        <TextInput
          style={styles.input}
          value={birthInput}
          onChangeText={setBirthInput}
          placeholder="1990-01-15"
          placeholderTextColor={Colors.secondaryText}
          autoCapitalize="none"
        />

        <Text variant="label" color="secondary" style={styles.label}>
          Expected Lifespan (years)
        </Text>
        <TextInput
          style={styles.input}
          value={deathInput}
          onChangeText={setDeathInput}
          placeholder="80"
          placeholderTextColor={Colors.secondaryText}
          keyboardType="number-pad"
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text variant="label" color="primary">
            Save
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  title: { marginBottom: Spacing.lg },
  label: { marginBottom: Spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 8,
    padding: 12,
    marginBottom: Spacing.md,
    color: Colors.primaryText,
  },
  button: {
    backgroundColor: Colors.divider,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
});
