import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  secureToggle?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureToggle = false,
  secureTextEntry,
  style,
  ...props
}: InputProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(secureTextEntry ?? false);

  const borderColor = error
    ? colors.destructive
    : focused
    ? colors.accent
    : colors.border;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            backgroundColor: focused ? colors.card : colors.muted,
            borderRadius: colors.radius - 2,
          },
        ]}
      >
        {leftIcon && (
          <Feather
            name={leftIcon}
            size={18}
            color={focused ? colors.accent : colors.mutedForeground}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            { color: colors.foreground, flex: 1 },
            Platform.OS === 'web' && (styles.webNoOutline as object),
            style,
          ]}
          placeholderTextColor={colors.mutedForeground}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureToggle ? secure : secureTextEntry}
          {...props}
        />
        {secureToggle && (
          <Pressable
            onPress={() => setSecure(s => !s)}
            style={styles.rightIconBtn}
          >
            <Feather
              name={secure ? 'eye-off' : 'eye'}
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>
        )}
        {!secureToggle && rightIcon && (
          <Pressable onPress={onRightIconPress} style={styles.rightIconBtn}>
            <Feather name={rightIcon} size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    paddingVertical: 0,
  },
  // react-native-web renders TextInput as a native <input>, which keeps
  // the browser's own focus outline on top of our custom border --
  // producing a doubled/clashing ring while actively typing.
  webNoOutline: {
    outlineStyle: 'none' as 'solid',
    outlineWidth: 0,
  },
  leftIcon: { marginRight: 10 },
  rightIconBtn: { padding: 4, marginLeft: 6 },
  error: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
