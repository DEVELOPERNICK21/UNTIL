import React, { useCallback, useState } from 'react';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { formatDateToIso, parseDate, todayIso } from '../../core/time/clock';
import { addDaysIso } from '../../domain/tasks/taskMove';
import { Colors, Radius, Spacing } from '../../theme';
import { Text } from '../../ui';

export interface TaskMoveSheetProps {
  visible: boolean;
  title: string;
  showTodayOption?: boolean;
  onClose: () => void;
  onSelectDate: (dateIso: string) => void;
}

export function TaskMoveSheet({
  visible,
  title,
  showTodayOption = false,
  onClose,
  onSelectDate,
}: TaskMoveSheetProps) {
  const [showPicker, setShowPicker] = useState(false);
  const today = todayIso();
  const tomorrow = addDaysIso(today, 1);

  const closeSheet = useCallback(() => {
    setShowPicker(false);
    onClose();
  }, [onClose]);

  const selectDate = useCallback(
    (dateIso: string) => {
      setShowPicker(false);
      onSelectDate(dateIso);
    },
    [onSelectDate],
  );

  const handlePickerChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      setShowPicker(false);
      if (event.type === 'dismissed' || !date) return;
      onSelectDate(formatDateToIso(date));
    },
    [onSelectDate],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeSheet}
    >
      <Pressable style={styles.modalOverlay} onPress={closeSheet}>
        <Pressable
          style={styles.modalContent}
          onPress={event => event.stopPropagation()}
        >
          <Text
            variant="sectionTitle"
            color="primary"
            style={styles.modalTitle}
          >
            {title}
          </Text>

          {showTodayOption ? (
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => selectDate(today)}
              accessibilityRole="button"
            >
              <Text variant="body" color="primary">
                Today
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => selectDate(tomorrow)}
            accessibilityRole="button"
          >
            <Text variant="body" color="primary">
              Tomorrow
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setShowPicker(current => !current)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showPicker }}
          >
            <Text variant="body" color="primary">
              Pick a date
            </Text>
          </TouchableOpacity>

          {showPicker ? (
            <View style={styles.datePickerWrap}>
              <DateTimePicker
                value={parseDate(tomorrow)}
                mode="date"
                display="spinner"
                minimumDate={parseDate(tomorrow)}
                onChange={handlePickerChange}
              />
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing[4],
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing[4],
  },
  modalTitle: {
    marginBottom: Spacing[3],
  },
  optionButton: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.md,
    backgroundColor: Colors.cardLighter,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[2],
  },
  datePickerWrap: {
    marginTop: Spacing[1],
  },
});
