import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ListRenderItemInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';

const { width: SCREEN_W } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  gradientColors: [string, string, string];
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'zap',
    title: 'Welcome to ChamaYetu',
    description: 'The premium platform for managing your Chama, SACCO, and investment group with the precision of professional banking.',
    gradientColors: ['#0F2D5E', '#1B3A6B', '#2563EB'],
  },
  {
    id: '2',
    icon: 'bar-chart-2',
    title: 'Complete Financial Control',
    description: 'Track contributions, loans, expenses, and investments in real-time. Multi-currency support for organizations across Africa and beyond.',
    gradientColors: ['#052E16', '#065F46', '#059669'],
  },
  {
    id: '3',
    icon: 'shield',
    title: 'Bank-Level Security',
    description: 'Every transaction is protected with enterprise-grade security. Immutable audit trails ensure complete financial accountability.',
    gradientColors: ['#1E1B4B', '#3730A3', '#6366F1'],
  },
  {
    id: '4',
    icon: 'layers',
    title: 'Multiple Organizations',
    description: 'Manage all your Chamas and SACCOs from one app. Switch between organizations instantly with a single tap.',
    gradientColors: ['#431407', '#9A3412', '#EA580C'],
  },
  {
    id: '5',
    icon: 'cpu',
    title: 'AI-Powered Insights',
    description: 'Your intelligent financial assistant understands your organization and helps leaders make data-driven decisions.',
    gradientColors: ['#0C4A6E', '#0369A1', '#0EA5E9'],
  },
  {
    id: '6',
    icon: 'check-circle',
    title: 'Built for Africa',
    description: 'Designed specifically for African savings groups with support for KES, UGX, TZS, NGN, GHS, and 20+ currencies.',
    gradientColors: ['#1E3A5F', '#1A4080', '#2563EB'],
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SlideItem({ item }: { item: Slide }) {
  return (
    <LinearGradient
      colors={item.gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.slide, { width: SCREEN_W }]}
    >
      <View style={styles.slideContent}>
        <View style={styles.iconContainer}>
          <Feather name={item.icon} size={52} color="#FFFFFF" />
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>
    </LinearGradient>
  );
}

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = useApp();
  const btnScale = useSharedValue(1);

  const isLast = currentIndex === SLIDES.length - 1;

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setCurrentIndex(idx);
  }

  async function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (isLast) {
      await completeOnboarding();
      router.replace('/(auth)/login' as never);
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }

  async function handleSkip() {
    await completeOnboarding();
    router.replace('/(auth)/login' as never);
  }

  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  return (
    <View style={styles.container}>
      <FlatList<Slide>
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        renderItem={({ item }: ListRenderItemInfo<Slide>) => <SlideItem item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      />

      {/* Skip button */}
      {!isLast && (
        <Pressable
          onPress={handleSkip}
          style={[styles.skipBtn, { top: insets.top + 16 }]}
          hitSlop={12}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 24 }]}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <AnimatedPressable
          onPress={handleNext}
          onPressIn={() => { btnScale.value = withSpring(0.96, { damping: 15, stiffness: 400 }); }}
          onPressOut={() => { btnScale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
          style={[btnAnimStyle, styles.nextBtn]}
        >
          <Text style={styles.nextText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
          <Feather
            name={isLast ? 'arrow-right' : 'chevron-right'}
            size={18}
            color="#FFFFFF"
          />
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F2D5E' },
  slide: { flex: 1 },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingTop: 60,
    paddingBottom: 160,
    gap: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8,
  },
  slideTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
  },
  slideDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 26,
  },
  skipBtn: {
    position: 'absolute',
    right: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 100,
  },
  skipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    gap: 28,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  nextText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
