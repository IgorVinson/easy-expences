import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const VoiceBar = ({ delay, color }: { delay: number; color: string }) => {
  const height = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(height, {
          toValue: 14,
          duration: 400,
          delay: delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(height, {
          toValue: 4,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [delay, height]);

  return (
    <Animated.View 
      style={[styles.bar, { height, backgroundColor: color }]}
    />
  );
};

const ListeningIndicator = () => {
  const { theme, isDarkMode } = useTheme();
  
  // Create an array for the 8 bars seen in your image
  const bars = [0, 150, 300, 450, 300, 150, 0, 100, 0, 150, 300, 450, 300, 150, 0, 100];

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : theme.iconBg }]}>
      {/* Waveform Container */}
      <View style={styles.waveformContainer}>
        {bars.map((delay, index) => (
          <VoiceBar key={index} delay={delay} color={theme.textSecondary} />
        ))}
      </View>

      {/* Text Label */}
      <Text className='text-primary text-md font-medium'>
        voice recording
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 14,
    marginRight: 10,
  },
  bar: {
    width: 2.5,
    borderRadius: 1,
    marginHorizontal: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
});

export default ListeningIndicator;