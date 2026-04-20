import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

interface AuthBackgroundProps {
  children: ReactNode;
  variant?: 'light' | 'tenantLanding';
}

export const AuthBackground = ({ children, variant = 'light' }: AuthBackgroundProps) => {
  const tenantLanding = variant === 'tenantLanding';

  return (
    <View style={[styles.screen, tenantLanding ? styles.screenTenantLanding : styles.screenLight]}>
      <View
        pointerEvents="none"
        style={[styles.topWash, tenantLanding ? styles.topWashTenantLanding : styles.topWashLight]}
      />
      <View
        pointerEvents="none"
        style={[styles.bottomWash, tenantLanding ? styles.bottomWashTenantLanding : styles.bottomWashLight]}
      />
      {tenantLanding ? <View pointerEvents="none" style={styles.midGlowTenantLanding} /> : null}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
  screenLight: {
    backgroundColor: colors.authBackgroundStart,
  },
  screenTenantLanding: {
    backgroundColor: colors.tenantLandingBackground,
  },
  topWash: {
    position: 'absolute',
  },
  topWashLight: {
    top: -120,
    left: -150,
    width: 440,
    height: 300,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    transform: [{ rotate: '-16deg' }],
  },
  topWashTenantLanding: {
    top: -120,
    left: -110,
    width: 330,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    transform: [{ rotate: '-18deg' }],
  },
  bottomWash: {
    position: 'absolute',
  },
  bottomWashLight: {
    right: -170,
    bottom: -150,
    width: 620,
    height: 620,
    borderRadius: 220,
    backgroundColor: colors.authBackgroundEnd,
    transform: [{ rotate: '-20deg' }],
  },
  bottomWashTenantLanding: {
    right: -120,
    bottom: -160,
    width: 500,
    height: 500,
    borderRadius: 210,
    backgroundColor: colors.tenantLandingGlow,
    opacity: 0.9,
    transform: [{ rotate: '-22deg' }],
  },
  midGlowTenantLanding: {
    position: 'absolute',
    top: 150,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
});
