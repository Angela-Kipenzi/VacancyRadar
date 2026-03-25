import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { colors } from '../../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getButtonStyle = (): StyleProp<ViewStyle>[] => {
    const sizeStyle = size === 'small' ? styles.button_small : size === 'large' ? styles.button_large : styles.button_medium;
    const result: StyleProp<ViewStyle>[] = [styles.button, sizeStyle];

    if (fullWidth) result.push(styles.fullWidth);
    if (disabled || loading) {
      result.push(styles.disabled);
      return result;
    }

    switch (variant) {
      case 'primary':
        result.push(styles.primary);
        break;
      case 'secondary':
        result.push(styles.secondary);
        break;
      case 'outline':
        result.push(styles.outline);
        break;
      case 'text':
        result.push(styles.text);
        break;
    }

    return result;
  };

  const getTextStyle = (): StyleProp<TextStyle>[] => {
    const sizeStyle = size === 'small' ? styles.text_small : size === 'large' ? styles.text_large : styles.text_medium;
    const result: StyleProp<TextStyle>[] = [styles.buttonText, sizeStyle];

    switch (variant) {
      case 'outline':
        result.push(styles.outlineText as any);
        break;
      case 'text':
        result.push(styles.textButtonText as any);
        break;
      default:
        result.push(styles.whiteText as any);
        break;
    }

    return result;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primary} />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  button_medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  button_large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  text: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: colors.gray[300],
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '600',
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
  whiteText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.primary,
  },
  textButtonText: {
    color: colors.primary,
  },
});
