import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthBackground } from '../../components/auth/AuthBackground';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { ScreenProps } from '../../types';

const heroImage =
  'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80';

const headerBlue = '#4F46E5';
const buttonBlue = '#4F46E5';
const pageText = '#1F1F1F';
const mutedText = '#6B6B6B';
const linkBlue = '#3654FF';

export const LandingScreen = ({ navigation }: ScreenProps) => {
  return (
    <AuthBackground>
      <View style={styles.headerShape} />
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <MaterialCommunityIcons name="office-building" size={24} color={colors.white} />
            </View>
            <Text style={styles.appName}>VacancyRadar</Text>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <View>
            <Text style={styles.title}>Find Your Dream Place</Text>
            <Text style={styles.subtitle}>Provide best home options for your next move.</Text>
          </View>

          <View style={styles.imageCard}>
            <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
          </View>

          <View style={styles.actions}>
            <Button
              title="Get Started"
              onPress={() => navigation.navigate('Login')}
              fullWidth
              size="large"
              style={styles.primaryAction}
              textStyle={styles.primaryActionText}
            />
            <View style={styles.linkRow}>
              <Text style={styles.linkPrompt}>New here?</Text>
              <Text style={styles.linkText} onPress={() => navigation.navigate('Register')}>
                Create Account
              </Text>
            </View>
            <View style={styles.linkRow}>
              <Text style={styles.linkPrompt}>Already have an account?</Text>
              <Text style={styles.linkText} onPress={() => navigation.navigate('Login')}>
                Sign In
              </Text>
            </View>
          </View>
        </View>
      </View>
    </AuthBackground>
  );
};

const styles = StyleSheet.create({
  headerShape: {
    position: 'absolute',
    top: 0,
    left: -20,
    right: -30,
    width: '110%',
    height: 200,
    backgroundColor: headerBlue,
    borderBottomLeftRadius: 1000,
    borderBottomRightRadius: 1000,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 20,
  },
  hero: {
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 34,
  },
  brandBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bottomSection: {
    marginTop: 100,
    flex: 1,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: pageText,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: mutedText,
    maxWidth: 290,
    marginBottom: 14,
  },
  imageCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#E8ECF7',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  heroImage: {
    width: '100%',
    height: 320,
  },
  actions: {
    marginTop: 24,
  },
  primaryAction: {
    backgroundColor: buttonBlue,
    borderRadius: 12,
    paddingVertical: 16,
  },
  primaryActionText: {
    color: colors.white,
    fontWeight: '700',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  linkPrompt: {
    color: mutedText,
    fontSize: 14,
    marginRight: 6,
  },
  linkText: {
    color: linkBlue,
    fontSize: 14,
    fontWeight: '700',
  },
});
