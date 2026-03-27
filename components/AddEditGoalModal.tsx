import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { GoalWithProgress, NewGoal } from '../types';

const GOAL_ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  'flag', 'trophy', 'star', 'heart', 'home', 'car', 'airplane', 'school',
  'medkit', 'gift', 'briefcase', 'camera', 'musical-notes', 'fitness',
  'bicycle', 'pizza', 'paw', 'leaf', 'diamond', 'rocket',
];

const GOAL_COLORS: Array<{ light: string; dark: string }> = [
  { light: '#D1FAE5', dark: '#10B981' },
  { light: '#BFDBFE', dark: '#3B82F6' },
  { light: '#E9D5FF', dark: '#8B5CF6' },
  { light: '#FCE7F3', dark: '#EC4899' },
  { light: '#FEF3C7', dark: '#F59E0B' },
  { light: '#FEE2E2', dark: '#EF4444' },
  { light: '#CFFAFE', dark: '#06B6D4' },
  { light: '#D1FAE5', dark: '#059669' },
  { light: '#FED7AA', dark: '#F97316' },
  { light: '#E0E7FF', dark: '#6366F1' },
];

type AddEditGoalModalProps = {
  visible: boolean;
  onClose: () => void;
  goal: GoalWithProgress | null;
  onSave: (data: NewGoal) => Promise<void>;
  onDelete?: (id: string) => void;
};

export const AddEditGoalModal: React.FC<AddEditGoalModalProps> = ({
  visible,
  onClose,
  goal,
  onSave,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currency } = useCurrency();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>('flag');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (goal) {
        setName(goal.name);
        setTargetAmount(String(goal.targetAmount));
        setSelectedIcon(goal.icon);
        const idx = GOAL_COLORS.findIndex((c) => c.dark === goal.colorDark);
        setSelectedColorIdx(idx >= 0 ? idx : 0);
      } else {
        setName('');
        setTargetAmount('');
        setSelectedIcon('flag');
        setSelectedColorIdx(0);
      }
    }
  }, [visible, goal]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert(t('addGoal.missingName'), t('addGoal.enterName'));
      return;
    }
    const parsed = parseFloat(targetAmount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert(t('common.error'), 'Please enter a valid target amount.');
      return;
    }
    try {
      setSaving(true);
      await onSave({
        name: name.trim(),
        targetAmount: parsed,
        icon: selectedIcon,
        colorLight: GOAL_COLORS[selectedColorIdx].light,
        colorDark: GOAL_COLORS[selectedColorIdx].dark,
      });
      onClose();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    backgroundColor: theme.cardBg,
    borderColor: theme.border,
    color: theme.textPrimary,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  };

  const labelStyle = {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 8,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: theme.bg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '90%',
            }}>
            {/* Drag handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
                {goal ? t('addGoal.editTitle') : t('addGoal.addTitle')}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: theme.iconBg }}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Name */}
              <Text style={labelStyle}>{t('addGoal.nameLabel')}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('addGoal.namePlaceholder')}
                placeholderTextColor={theme.textTertiary}
                style={[inputStyle, { marginBottom: 20 }]}
              />

              {/* Target amount */}
              <Text style={labelStyle}>{t('addGoal.targetLabel', { currency })}</Text>
              <TextInput
                value={targetAmount}
                onChangeText={setTargetAmount}
                placeholder={t('addGoal.targetPlaceholder')}
                placeholderTextColor={theme.textTertiary}
                keyboardType="decimal-pad"
                style={[inputStyle, { marginBottom: 20 }]}
              />

              {/* Icon picker */}
              <Text style={[labelStyle, { marginBottom: 12 }]}>{t('addGoal.iconLabel')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {GOAL_ICONS.map((iconName) => {
                  const isSelected = selectedIcon === iconName;
                  const color = GOAL_COLORS[selectedColorIdx];
                  return (
                    <TouchableOpacity
                      key={iconName}
                      onPress={() => setSelectedIcon(iconName)}
                      style={{
                        width: 48, height: 48,
                        borderRadius: 14,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isSelected ? (theme.isDark ? color.dark + '33' : color.light) : theme.cardBg,
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? color.dark : theme.border,
                      }}>
                      <Ionicons name={iconName} size={22} color={isSelected ? color.dark : theme.textTertiary} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Color picker */}
              <Text style={[labelStyle, { marginBottom: 12 }]}>{t('addGoal.colorLabel')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                {GOAL_COLORS.map((color, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedColorIdx(idx)}
                    style={{
                      width: 36, height: 36,
                      borderRadius: 18,
                      backgroundColor: color.dark,
                      borderWidth: selectedColorIdx === idx ? 3 : 0,
                      borderColor: theme.textPrimary,
                    }}
                  />
                ))}
              </View>

              {/* Delete (edit mode only) */}
              {goal && onDelete && (
                <TouchableOpacity
                  onPress={() => { onClose(); onDelete(goal.id); }}
                  style={{ paddingVertical: 14, alignItems: 'center', borderRadius: 16, backgroundColor: '#EF444415', marginBottom: 8 }}>
                  <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 15 }}>
                    {t('goals.deleteTitle')}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.bg }}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{ backgroundColor: theme.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: saving ? 0.7 : 1 }}>
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{t('addGoal.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
