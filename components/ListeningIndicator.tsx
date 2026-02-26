import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const VoiceBar = ({
  delay,
  color,
  minHeight = 5,
  maxHeight = 18,
}: {
  delay: number;
  color: string;
  minHeight?: number;
  maxHeight?: number;
}) => {
  const height = useRef(new Animated.Value(minHeight)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(height, {
          toValue: maxHeight,
          duration: 320,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(height, {
          toValue: minHeight,
          duration: 320,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, height, maxHeight, minHeight]);

  return <Animated.View style={[styles.bar, { height, backgroundColor: color }]} />;
};

const ListeningIndicator = () => {
  const { theme, isDarkMode } = useTheme();
  const bars = [0, 90, 180, 270, 220, 140, 60, 120, 200, 280];
  const dotOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, {
          toValue: 0.35,
          duration: 520,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [dotOpacity]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.waveformContainer}>
        {bars.map((delay, index) => (
          <VoiceBar
            key={index}
            delay={delay}
            color={isDarkMode ? '#F87171' : '#EF4444'}
            minHeight={5}
            maxHeight={index % 2 === 0 ? 18 : 14}
          />
        ))}
      </View>
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: isDarkMode ? '#F87171' : '#EF4444' },
          { opacity: dotOpacity },
        ]}
      />
      <Text style={[styles.text, { color: theme.textSecondary }]}>Voice recording...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 18,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    marginHorizontal: 1.5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 10,
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ListeningIndicator;
