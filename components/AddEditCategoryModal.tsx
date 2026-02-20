import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { BudgetCategory, NewBudgetCategory } from '../types';

// ─── Icon picker options ──────────────────────────────────────────────────────

const ICON_OPTIONS: (keyof typeof Ionicons.glyphMap)[] = [
  'restaurant', 'car', 'bulb', 'ticket', 'cart',
  'home', 'medkit', 'school', 'airplane', 'fitness',
  'paw', 'game-controller', 'musical-notes', 'book', 'wallet',
  'gift', 'heart', 'briefcase', 'cash', 'phone-portrait',
];

// ─── Color options ────────────────────────────────────────────────────────────

const COLOR_OPTIONS: { light: string; dark: string; label: string }[] = [
  { light: '#FED7AA', dark: '#FB923C', label: 'Orange' },
  { light: '#E2E8F0', dark: '#94A3B8', label: 'Slate' },
  { light: '#FEF08A', dark: '#FACC15', label: 'Yellow' },
  { light: '#FECACA', dark: '#F87171', label: 'Red' },
  { light: '#BFDBFE', dark: '#60A5FA', label: 'Blue' },
  { light: '#BBF7D0', dark: '#4ADE80', label: 'Green' },
  { light: '#E9D5FF', dark: '#A855F7', label: 'Purple' },
  { light: '#FBCFE8', dark: '#EC4899', label: 'Pink' },
  { light: '#CFFAFE', dark: '#22D3EE', label: 'Cyan' },
  { light: '#FEF3C7', dark: '#F59E0B', label: 'Amber' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddEditCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  category?: BudgetCategory | null;
  onSave: (data: NewBudgetCategory) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const SHEET_HEIGHT = Dimensions.get('window').height * 0.88;

// ─── Component ────────────────────────────────────────────────────────────────

export const AddEditCategoryModal: React.FC<AddEditCategoryModalProps> = ({
  visible,
  onClose,
  category,
  onSave,
  onDelete,
}) => {
  const { theme, isDarkMode } = useTheme();
  const isEdit = Boolean(category);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>('cash');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setBudget(String(category.budget));
      setSelectedIcon(category.icon);
      const matched = COLOR_OPTIONS.find((c) => c.dark === category.colorDark);
      setSelectedColor(matched ?? COLOR_OPTIONS[0]);
    } else {
      resetForm();
    }
  }, [category, visible]);

  function resetForm() {
    setName('');
    setBudget('');
    setSelectedIcon('cash');
    setSelectedColor(COLOR_OPTIONS[0]);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a name for the category.');
      return;
    }
    const parsedBudget = parseFloat(budget);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      Alert.alert('Invalid budget', 'Please enter a valid positive budget amount.');
      return;
    }
    try {
      setSaving(true);
      await onSave({
        name: name.trim(),
        budget: parsedBudget,
        icon: selectedIcon,
        colorLight: selectedColor.light,
        colorDark: selectedColor.dark,
      });
      resetForm();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  }

  function handleDeletePress() {
    if (!category) return;
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This won't delete existing expenses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await onDelete?.(category.id);
              resetForm();
              onClose();
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to delete category.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={handleClose}>

      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>

          {/* Sheet */}
          <TouchableWithoutFeedback>
            <View
              className="overflow-hidden rounded-t-3xl"
              style={{ height: SHEET_HEIGHT, backgroundColor: theme.bg }}>

              {/* Drag handle */}
              <View className="items-center pb-1 pt-3">
                <View
                  className="h-1 w-10 rounded-full"
                  style={{ backgroundColor: theme.border }}
                />
              </View>

              {/* Header */}
              <View className="flex-row items-center justify-between px-6 py-3">
                <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                  {isEdit ? 'Edit Category' : 'Add Category'}
                </Text>
                <TouchableOpacity
                  onPress={handleClose}
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.iconBg }}>
                  <Ionicons name="close" size={20} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Scrollable form */}
              <ScrollView
                className="flex-1 px-6"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>

                {/* Name */}
                <Text className="mb-2.5 text-xs font-semibold" style={{ color: theme.textSecondary }}>
                  Category Name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Food & Dining"
                  placeholderTextColor={theme.textTertiary}
                  className="mb-5 rounded-2xl px-4 py-3.5 text-base"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                    borderWidth: 1,
                    color: theme.textPrimary,
                  }}
                />

                {/* Budget */}
                <Text className="mb-2.5 text-xs font-semibold" style={{ color: theme.textSecondary }}>
                  Monthly Budget ($)
                </Text>
                <TextInput
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="0.00"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="decimal-pad"
                  className="mb-5 rounded-2xl px-4 py-3.5 text-base"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                    borderWidth: 1,
                    color: theme.textPrimary,
                  }}
                />

                {/* Icon picker */}
                <Text className="mb-2.5 text-xs font-semibold" style={{ color: theme.textSecondary }}>
                  Icon
                </Text>
                <View className="mb-5 flex-row flex-wrap gap-2.5">
                  {ICON_OPTIONS.map((icon) => {
                    const isSelected = selectedIcon === icon;
                    return (
                      <TouchableOpacity
                        key={icon}
                        onPress={() => setSelectedIcon(icon)}
                        className="h-12 w-12 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: isSelected
                            ? isDarkMode ? selectedColor.dark + '33' : selectedColor.light
                            : theme.cardBg,
                          borderWidth: isSelected ? 2 : 1,
                          borderColor: isSelected ? selectedColor.dark : theme.border,
                        }}>
                        <Ionicons
                          name={icon}
                          size={22}
                          color={isSelected ? selectedColor.dark : theme.textTertiary}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Color picker */}
                <Text className="mb-2.5 text-xs font-semibold" style={{ color: theme.textSecondary }}>
                  Color
                </Text>
                <View className="mb-6 flex-row flex-wrap gap-2.5">
                  {COLOR_OPTIONS.map((color) => {
                    const isSelected = selectedColor.dark === color.dark;
                    return (
                      <TouchableOpacity
                        key={color.dark}
                        onPress={() => setSelectedColor(color)}
                        className="h-10 w-10 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: color.dark,
                          borderWidth: isSelected ? 3 : 0,
                          borderColor: theme.bg,
                          shadowColor: color.dark,
                          shadowOpacity: isSelected ? 0.6 : 0,
                          shadowRadius: isSelected ? 4 : 0,
                          shadowOffset: { width: 0, height: 0 },
                          elevation: isSelected ? 4 : 0,
                        }}>
                        {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Preview */}
                <Text className="mb-2.5 text-xs font-semibold" style={{ color: theme.textSecondary }}>
                  Preview
                </Text>
                <View
                  className="mb-4 flex-row items-center rounded-2xl p-4"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}>
                  <View
                    className="h-12 w-12 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: isDarkMode ? selectedColor.dark + '33' : selectedColor.light,
                    }}>
                    <Ionicons name={selectedIcon} size={24} color={selectedColor.dark} />
                  </View>
                  <View className="ml-3.5 flex-1">
                    <Text className="text-base font-semibold" style={{ color: theme.textPrimary }}>
                      {name || 'Category Name'}
                    </Text>
                    <Text className="mt-0.5 text-xs" style={{ color: theme.textTertiary }}>
                      ${budget || '0'} / month
                    </Text>
                  </View>
                </View>

                {/* Delete button — inside body, edit mode only */}
                {isEdit && onDelete && (
                  <TouchableOpacity
                    onPress={handleDeletePress}
                    disabled={saving || deleting}
                    className="mb-4 flex-row items-center justify-center self-center gap-1.5 rounded-xl border px-4 py-2"
                    style={{
                      borderColor: '#F87171',
                      opacity: saving || deleting ? 0.5 : 1,
                    }}>
                    {deleting ? (
                      <ActivityIndicator color="#F87171" size="small" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={15} color="#F87171" />
                        <Text className="text-sm font-semibold" style={{ color: '#F87171' }}>
                          Delete Category
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </ScrollView>

              {/* Save button — pinned footer */}
              <View
                className="px-6 pt-3"
                style={{
                  paddingBottom: Platform.OS === 'ios' ? 40 : 24,
                  borderTopWidth: 1,
                  borderTopColor: theme.border,
                  backgroundColor: theme.bg,
                }}>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving || deleting}
                  className="items-center rounded-2xl py-4"
                  style={{
                    backgroundColor: theme.purple,
                    opacity: saving || deleting ? 0.7 : 1,
                  }}>
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-base font-bold text-white">
                      {isEdit ? 'Save Changes' : 'Add Category'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
