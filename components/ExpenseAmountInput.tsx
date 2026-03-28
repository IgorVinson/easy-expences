import React from 'react';
import { StyleProp, Text, TextInput, TextStyle, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type CalculatorButton = {
  label: string;
  flex?: number;
  variant?: 'number' | 'operator' | 'utility';
};

const CALCULATOR_ROWS: CalculatorButton[][] = [
  [
    { label: 'AC', variant: 'utility', flex: 2 },
    { label: '⌫', variant: 'utility' },
    { label: '÷', variant: 'operator' },
  ],
  [{ label: '7' }, { label: '8' }, { label: '9' }, { label: '×', variant: 'operator' }],
  [{ label: '4' }, { label: '5' }, { label: '6' }, { label: '-', variant: 'operator' }],
  [{ label: '1' }, { label: '2' }, { label: '3' }, { label: '+', variant: 'operator' }],
  [{ label: '0', flex: 2 }, { label: '.' }, { label: '=', variant: 'operator' }],
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
  label: string;
  placeholder: string;
  isCalculatorVisible: boolean;
  inputStyle: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  inputClassName?: string;
  inputMarginBottomWhenHidden?: number;
  inputMarginBottomWhenVisible?: number;
  calculatorMarginBottom?: number;
  accentColor?: string;
};

export const ExpenseAmountInput: React.FC<ExpenseAmountInputProps> = ({
  value,
  expression,
  onValueChange,
  onExpressionChange,
  onShowCalculator,
  label,
  placeholder,
  isCalculatorVisible,
  inputStyle,
  labelStyle,
  inputClassName,
  inputMarginBottomWhenHidden = 24,
  inputMarginBottomWhenVisible = 12,
  calculatorMarginBottom = 24,
  accentColor,
}) => {
  const { theme } = useTheme();
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

  return (
    <>
      <Text style={labelStyle}>{label}</Text>
      <TextInput
        className={inputClassName}
        value={value}
        onChangeText={handleAmountChange}
        onFocus={onShowCalculator}
        onPressIn={onShowCalculator}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        keyboardType="decimal-pad"
        showSoftInputOnFocus={false}
        caretHidden
        style={[
          inputStyle,
          {
            marginBottom: isCalculatorVisible
              ? inputMarginBottomWhenVisible
              : inputMarginBottomWhenHidden,
          },
        ]}
      />
      {isCalculatorVisible ? (
        <View style={{ marginBottom: calculatorMarginBottom, gap: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 4,
            }}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={{
                flex: 1,
                color: theme.textPrimary,
                fontSize: 24,
                fontWeight: '700',
              }}>
              {expression || value || '0'}
            </Text>
            {calculatorPreview ? (
              <Text
                style={{
                  marginLeft: 12,
                  color: theme.textSecondary,
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                = {calculatorPreview}
              </Text>
            ) : null}
          </View>

          {CALCULATOR_ROWS.map((row, rowIndex) => (
            <View key={`calculator-row-${rowIndex}`} style={{ flexDirection: 'row', gap: 8 }}>
              {row.map((button) => {
                const isOperatorButton = button.variant === 'operator';
                const isUtilityButton = button.variant === 'utility';

                return (
                  <TouchableOpacity
                    key={button.label}
                    onPress={() => handleCalculatorPress(button.label)}
                    activeOpacity={0.8}
                    style={{
                      flex: button.flex ?? 1,
                      minHeight: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 14,
                      borderWidth: isOperatorButton ? 0 : 1,
                      borderColor: theme.border,
                      backgroundColor: isOperatorButton
                        ? operatorColor
                        : isUtilityButton
                          ? theme.cardBg
                          : theme.bg,
                    }}>
                    <Text
                      style={{
                        color: isOperatorButton ? '#fff' : theme.textPrimary,
                        fontSize: 18,
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
      ) : null}
    </>
  );
};
