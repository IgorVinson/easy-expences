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
  'restaurant',
  'car',
  'bulb',
  'ticket',
  'cart',
  'home',
  'medkit',
  'school',
  'airplane',
  'fitness',
  'paw',
  'game-controller',
  'musical-notes',
  'book',
  'wallet',
  'gift',
  'heart',
  'briefcase',
  'cash',
  'phone-portrait',
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
  /** If provided the modal is in edit mode */
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

  // ─── Form state ───────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>('cash');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  // Populate when editing
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
    marginBottom: 10,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={handleClose}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'flex-end',
          }}>
          {/* Sheet */}
          <TouchableWithoutFeedback>
            <View
              style={{
                height: SHEET_HEIGHT,
                backgroundColor: theme.bg,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                overflow: 'hidden',
              }}>
              {/* Drag handle */}
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                <View
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme.border,
                  }}
                />
              </View>

              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                }}>
                <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
                  {isEdit ? 'Edit Category' : 'Add Category'}
                </Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={{
                    width: 40,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 20,
                    backgroundColor: theme.iconBg,
                  }}>
                  <Ionicons name="close" size={20} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Scrollable form */}
              <ScrollView
                style={{ flex: 1, paddingHorizontal: 24 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>

                {/* Name */}
                <Text style={labelStyle}>Category Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Food & Dining"
                  placeholderTextColor={theme.textTertiary}
                  style={[inputStyle, { marginBottom: 20 }]}
                />

                {/* Budget */}
                <Text style={labelStyle}>Monthly Budget ($)</Text>
                <TextInput
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="0.00"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="decimal-pad"
                  style={[inputStyle, { marginBottom: 20 }]}
                />

                {/* Icon picker */}
                <Text style={labelStyle}>Icon</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                  {ICON_OPTIONS.map((icon) => {
                    const isSelected = selectedIcon === icon;
                    return (
                      <TouchableOpacity
                        key={icon}
                        onPress={() => setSelectedIcon(icon)}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isSelected
                            ? isDarkMode
                              ? selectedColor.dark + '33'
                              : selectedColor.light
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
                <Text style={labelStyle}>Color</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                  {COLOR_OPTIONS.map((color) => {
                    const isSelected = selectedColor.dark === color.dark;
                    return (
                      <TouchableOpacity
                        key={color.dark}
                        onPress={() => setSelectedColor(color)}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: color.dark,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: isSelected ? 3 : 0,
                          borderColor: theme.bg,
                          // White ring effect
                          shadowColor: color.dark,
                          shadowOpacity: isSelected ? 0.6 : 0,
                          shadowRadius: isSelected ? 4 : 0,
                          shadowOffset: { width: 0, height: 0 },
                          elevation: isSelected ? 4 : 0,
                        }}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={18} color="#fff" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Preview */}
                <Text style={labelStyle}>Preview</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: theme.cardBg,
                    borderWidth: 1,
                    borderColor: theme.border,
                    marginBottom: 100,
                  }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDarkMode ? selectedColor.dark + '33' : selectedColor.light,
                    }}>
                    <Ionicons name={selectedIcon} size={24} color={selectedColor.dark} />
                  </View>
                  <View style={{ marginLeft: 14, flex: 1 }}>
                    <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '600' }}>
                      {name || 'Category Name'}
                    </Text>
                    <Text style={{ color: theme.textTertiary, fontSize: 13, marginTop: 2 }}>
                      ${budget || '0'} / month
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Save + Delete buttons */}
              <View
                style={{
                  paddingHorizontal: 24,
                  paddingBottom: Platform.OS === 'ios' ? 40 : 24,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.border,
                  backgroundColor: theme.bg,
                  gap: 10,
                }}>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving || deleting}
                  style={{
                    backgroundColor: theme.purple,
                    borderRadius: 16,
                    paddingVertical: 16,
                    alignItems: 'center',
                    opacity: saving || deleting ? 0.7 : 1,
                  }}>
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                      {isEdit ? 'Save Changes' : 'Add Category'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Delete button — edit mode only */}
                {isEdit && onDelete && (
                  <TouchableOpacity
                    onPress={handleDeletePress}
                    disabled={saving || deleting}
                    style={{
                      borderRadius: 16,
                      paddingVertical: 16,
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: '#F87171',
                      opacity: saving || deleting ? 0.5 : 1,
                    }}>
                    {deleting ? (
                      <ActivityIndicator color="#F87171" />
                    ) : (
                      <Text style={{ color: '#F87171', fontSize: 16, fontWeight: 'bold' }}>
                        Delete Category
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
