import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  Modal,
  Platform,
  StyleProp,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

type CalculatorButton = {
  label: string;
  flex?: number;
  variant?: 'number' | 'operator' | 'utility';
};

// The approve/OK key — evaluates the expression and closes the calculator.
const APPROVE_LABEL = '✓';

const CALCULATOR_ROWS: CalculatorButton[][] = [
  [
    { label: 'AC', variant: 'utility', flex: 2 },
    { label: '⌫', variant: 'utility' },
    { label: '÷', variant: 'operator' },
  ],
  [{ label: '7' }, { label: '8' }, { label: '9' }, { label: '×', variant: 'operator' }],
  [{ label: '4' }, { label: '5' }, { label: '6' }, { label: '-', variant: 'operator' }],
  [{ label: '1' }, { label: '2' }, { label: '3' }, { label: '+', variant: 'operator' }],
  [{ label: '0' }, { label: '.' }, { label: APPROVE_LABEL, variant: 'operator', flex: 2 }],
];

function isCalculatorOperator(value: string) {
  return value === '+' || value === '-' || value === '×' || value === '÷';
}

function isNumericDraft(value: string) {
  return /^\d*\.?\d*$/.test(value);
}

export function sanitizeManualAmountInput(value: string) {
  const cleanedValue = value.replace(/[^0-9.]/g, '');

  if (!cleanedValue) {
    return '';
  }

  const normalizedValue = cleanedValue.startsWith('.') ? `0${cleanedValue}` : cleanedValue;
  const [wholePart, ...decimalParts] = normalizedValue.split('.');

  if (decimalParts.length === 0) {
    return wholePart;
  }

  return `${wholePart}.${decimalParts.join('')}`;
}

export function formatCalculatorValue(value: number) {
  const roundedValue = Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
  return roundedValue.toString();
}

export function evaluateCalculatorExpression(expression: string) {
  const normalizedExpression = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');

  if (
    !normalizedExpression ||
    normalizedExpression.startsWith('+') ||
    normalizedExpression.startsWith('*') ||
    normalizedExpression.startsWith('/') ||
    /[+\-*/.]$/.test(normalizedExpression)
  ) {
    return null;
  }

  const tokens = normalizedExpression.match(/\d*\.?\d+|[+\-*/]/g);

  if (!tokens || tokens.join('') !== normalizedExpression || tokens.length % 2 === 0) {
    return null;
  }

  const firstValue = Number.parseFloat(tokens[0]);

  if (Number.isNaN(firstValue)) {
    return null;
  }

  const collapsedTokens: (number | string)[] = [firstValue];

  for (let index = 1; index < tokens.length; index += 2) {
    const operator = tokens[index];
    const nextValue = Number.parseFloat(tokens[index + 1]);

    if (Number.isNaN(nextValue)) {
      return null;
    }

    if (operator === '*' || operator === '/') {
      const previousValue = collapsedTokens[collapsedTokens.length - 1];

      if (typeof previousValue !== 'number') {
        return null;
      }

      if (operator === '/' && nextValue === 0) {
        return null;
      }

      collapsedTokens[collapsedTokens.length - 1] =
        operator === '*' ? previousValue * nextValue : previousValue / nextValue;
    } else {
      collapsedTokens.push(operator, nextValue);
    }
  }

  let total = collapsedTokens[0];

  if (typeof total !== 'number') {
    return null;
  }

  for (let index = 1; index < collapsedTokens.length; index += 2) {
    const operator = collapsedTokens[index];
    const nextValue = collapsedTokens[index + 1];

    if (typeof operator !== 'string' || typeof nextValue !== 'number') {
      return null;
    }

    total = operator === '+' ? total + nextValue : total - nextValue;
  }

  return Number.isFinite(total) ? total : null;
}

export function resolveCalculatedAmount(expression: string, amount: string) {
  if (/[+\-×÷]/.test(expression)) {
    const calculatedAmount = evaluateCalculatorExpression(expression);
    return calculatedAmount === null ? null : formatCalculatorValue(calculatedAmount);
  }

  return sanitizeManualAmountInput(amount || expression);
}

type ExpenseAmountInputProps = {
  value: string;
  expression: string;
  onValueChange: (value: string) => void;
  onExpressionChange: (expression: string) => void;
  onShowCalculator: () => void;
  onHideCalculator: () => void;
  label: string;
  placeholder: string;
  isCalculatorVisible: boolean;
  inputStyle: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  inputClassName?: string;
  inputMarginBottomWhenHidden?: number;
  accentColor?: string;
};

export const ExpenseAmountInput: React.FC<ExpenseAmountInputProps> = ({
  value,
  expression,
  onValueChange,
  onExpressionChange,
  onShowCalculator,
  onHideCalculator,
  label,
  placeholder,
  isCalculatorVisible,
  inputStyle,
  labelStyle,
  inputClassName,
  inputMarginBottomWhenHidden = 24,
  accentColor,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const operatorColor = accentColor ?? theme.purple;

  const calculatorPreview = React.useMemo(() => {
    if (!/[+\-×÷]/.test(expression)) {
      return null;
    }

    const calculatedAmount = evaluateCalculatorExpression(expression);
    return calculatedAmount === null ? null : formatCalculatorValue(calculatedAmount);
  }, [expression]);

  function updateCalculatorExpression(nextExpression: string) {
    onExpressionChange(nextExpression);

    if (!nextExpression) {
      onValueChange('');
      return;
    }

    if (isNumericDraft(nextExpression)) {
      onValueChange(nextExpression);
      return;
    }

    const calculatedAmount = evaluateCalculatorExpression(nextExpression);

    if (calculatedAmount !== null) {
      onValueChange(formatCalculatorValue(calculatedAmount));
    }
  }

  function handleAmountChange(nextValue: string) {
    const sanitizedAmount = sanitizeManualAmountInput(nextValue);
    onValueChange(sanitizedAmount);
    onExpressionChange(sanitizedAmount);
  }

  function handleCalculatorPress(labelValue: string) {
    if (labelValue === 'AC') {
      updateCalculatorExpression('');
      return;
    }

    if (labelValue === '⌫') {
      updateCalculatorExpression(expression.slice(0, -1));
      return;
    }

    if (labelValue === '=') {
      const calculatedAmount = evaluateCalculatorExpression(expression);

      if (calculatedAmount === null) {
        return;
      }

      const normalizedAmount = formatCalculatorValue(calculatedAmount);
      onValueChange(normalizedAmount);
      onExpressionChange(normalizedAmount);
      return;
    }

    if (isCalculatorOperator(labelValue)) {
      if (!expression) {
        return;
      }

      let nextExpression = expression;
      const lastCharacter = nextExpression[nextExpression.length - 1];

      if (!lastCharacter) {
        return;
      }

      if (isCalculatorOperator(lastCharacter)) {
        updateCalculatorExpression(`${nextExpression.slice(0, -1)}${labelValue}`);
        return;
      }

      if (lastCharacter === '.') {
        nextExpression = `${nextExpression}0`;
      }

      updateCalculatorExpression(`${nextExpression}${labelValue}`);
      return;
    }

    if (labelValue === '.') {
      const parts = expression.split(/[+\-×÷]/);
      const currentSegment = parts[parts.length - 1] ?? '';

      if (currentSegment.includes('.')) {
        return;
      }

      if (!expression || isCalculatorOperator(expression[expression.length - 1] ?? '')) {
        updateCalculatorExpression(`${expression}0.`);
        return;
      }
    }

    updateCalculatorExpression(
      expression === '0' && labelValue !== '.' ? labelValue : `${expression}${labelValue}`
    );
  }

  function handleOpenCalculator() {
    Keyboard.dismiss();
    onShowCalculator();
  }

  function handleDone() {
    // Resolve any trailing partial expression (e.g. "12+3") into a final value.
    handleCalculatorPress('=');
    onHideCalculator();
  }

  return (
    <>
      <Text style={labelStyle}>{label}</Text>
      <View style={{ position: 'relative', marginBottom: inputMarginBottomWhenHidden }}>
        <TextInput
          className={inputClassName}
          value={value}
          onChangeText={handleAmountChange}
          placeholder={placeholder}
          placeholderTextColor={theme.textTertiary}
          keyboardType="decimal-pad"
          style={[inputStyle, { paddingRight: 52 }]}
        />
        <TouchableOpacity
          onPress={handleOpenCalculator}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            position: 'absolute',
            right: 8,
            top: 0,
            bottom: 0,
            width: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name="calculator-outline" size={22} color={operatorColor} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isCalculatorVisible}
        animationType="slide"
        statusBarTranslucent={Platform.OS === 'android'}
        onRequestClose={onHideCalculator}>
        <View
          style={{
            flex: 1,
            backgroundColor: theme.bg,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 20,
          }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
            }}>
            <TouchableOpacity
              onPress={onHideCalculator}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 16, fontWeight: '600' }}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '700' }}>
              {label}
            </Text>
            <TouchableOpacity
              onPress={handleDone}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: operatorColor, fontSize: 16, fontWeight: '700' }}>
                {t('common.done')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Display */}
          <View style={{ flex: 1, justifyContent: 'flex-end', paddingVertical: 24 }}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.4}
              style={{
                color: theme.textPrimary,
                fontSize: 48,
                fontWeight: '700',
                textAlign: 'right',
              }}>
              {expression || value || '0'}
            </Text>
            {calculatorPreview ? (
              <Text
                style={{
                  marginTop: 8,
                  color: theme.textSecondary,
                  fontSize: 22,
                  fontWeight: '600',
                  textAlign: 'right',
                }}>
                = {calculatorPreview}
              </Text>
            ) : null}
          </View>

          {/* Keypad */}
          <View style={{ gap: 10 }}>
            {CALCULATOR_ROWS.map((row, rowIndex) => (
              <View key={`calculator-row-${rowIndex}`} style={{ flexDirection: 'row', gap: 10 }}>
                {row.map((button) => {
                  const isApproveButton = button.label === APPROVE_LABEL;
                  const isOperatorButton = button.variant === 'operator';
                  const isUtilityButton = button.variant === 'utility';

                  return (
                    <TouchableOpacity
                      key={button.label}
                      onPress={() =>
                        button.label === APPROVE_LABEL
                          ? handleDone()
                          : handleCalculatorPress(button.label)
                      }
                      activeOpacity={0.8}
                      style={{
                        flex: button.flex ?? 1,
                        minHeight: 64,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 16,
                        borderWidth: isOperatorButton ? 0 : 1,
                        borderColor: theme.border,
                        backgroundColor: isApproveButton
                          ? theme.success
                          : isOperatorButton
                            ? operatorColor
                            : isUtilityButton
                              ? theme.cardBg
                              : theme.bg,
                      }}>
                      <Text
                        style={{
                          color: isOperatorButton ? '#fff' : theme.textPrimary,
                          fontSize: 24,
                          fontWeight: button.label === 'AC' ? '700' : '600',
                        }}>
                        {button.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
};
