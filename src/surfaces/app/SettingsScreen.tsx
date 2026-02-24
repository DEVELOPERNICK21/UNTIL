import React, { useState, useEffect, useMemo } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text, ScreenGradient, Card } from '../../ui';
import { useObserveTimeState, useUpdateUserProfile } from '../../hooks';
import { syncWidgetCache } from '../../infrastructure';
import { Colors, Spacing, Radius } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';

function parseBirthDate(str: string): Date {
  if (!str || str.length < 10) return new Date(1990, 0, 1);
  const [y, m, d] = str.split('-').map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return new Date(1990, 0, 1);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return isNaN(date.getTime()) ? new Date(1990, 0, 1) : date;
}

function toBirthDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Settings'>>();
  const { userProfile } = useObserveTimeState();
  const updateUserProfile = useUpdateUserProfile();

  const [birthInput, setBirthInput] = useState(userProfile.birthDate ?? '');
  const [deathInput, setDeathInput] = useState(String(userProfile.deathAge));
  const [showBirthPicker, setShowBirthPicker] = useState(false);

  const birthDateForPicker = useMemo(() => parseBirthDate(birthInput), [birthInput]);

  useEffect(() => {
    setBirthInput(userProfile.birthDate ?? '');
    setDeathInput(String(userProfile.deathAge));
  }, [userProfile.birthDate, userProfile.deathAge]);

  const handleSave = () => {
    if (birthInput) {
      const age = parseInt(deathInput, 10);
      updateUserProfile(birthInput, isNaN(age) || age <= 0 ? 80 : age);
      syncWidgetCache();
      navigation.navigate('Home');
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
                Birth date
              </Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowBirthPicker(true)}
              >
                <Text variant="body" color={birthInput ? 'primary' : 'secondary'} style={styles.inputText}>
                  {birthInput || 'Tap to pick date'}
                </Text>
              </TouchableOpacity>
              {showBirthPicker && (
                <DateTimePicker
                  value={birthDateForPicker}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(_, d) => {
                    if (Platform.OS === 'android') setShowBirthPicker(false);
                    if (d) setBirthInput(toBirthDateString(d));
                  }}
                />
              )}
              {Platform.OS === 'ios' && showBirthPicker && (
                <TouchableOpacity style={styles.pickerDone} onPress={() => setShowBirthPicker(false)}>
                  <Text variant="caption" color="primary">Done</Text>
                </TouchableOpacity>
              )}

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
    minHeight: 48,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
  },
  pickerDone: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing[1],
    marginBottom: Spacing[2],
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