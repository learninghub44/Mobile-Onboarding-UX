import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/ui/Button';

export default function OrgSetupWelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.gradientCard, colors.gradientCardEnd]}
        style={[styles.header, { paddingTop: insets.top + 40 }]}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Feather name="users" size={48} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>Create Your Organization</Text>
          <Text style={styles.subtitle}>
            Set up your Chama, SACCO, or investment group to start managing finances together
          </Text>

          <View style={styles.features}>
            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Feather name="check" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>Track contributions and loans</Text>
            </View>
            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Feather name="check" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>Schedule meetings and events</Text>
            </View>
            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Feather name="check" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>Generate financial reports</Text>
            </View>
            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Feather name="check" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>AI-powered financial insights</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <View style={styles.primaryBtn}>
              <Button
                title="Create Organization"
                onPress={() => router.push('/(org-setup)/create' as never)}
              />
            </View>
            <Pressable
              onPress={() => router.replace('/(tabs)' as never)}
              style={styles.skipBtn}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: -16,
  },
  features: {
    width: '100%',
    gap: 16,
    marginTop: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  primaryBtn: {
    backgroundColor: '#FFFFFF',
  },
  skipBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
});