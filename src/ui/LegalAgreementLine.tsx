import React from 'react';
import { Linking, StyleSheet } from 'react-native';
import { Text } from './Text';

interface LegalAgreementLineProps {
  termsUrl: string;
  privacyUrl: string;
  align?: 'left' | 'center';
}

export function LegalAgreementLine({
  termsUrl,
  privacyUrl,
  align = 'left',
}: LegalAgreementLineProps) {
  const open = (url: string) => {
    void Linking.openURL(url).catch(() => undefined);
  };
  return (
    <Text
      variant="caption"
      color="secondary"
      style={[styles.line, { textAlign: align }]}
    >
      By continuing you agree to the{' '}
      <Text
        variant="caption"
        color="secondary"
        style={styles.link}
        onPress={() => open(termsUrl)}
        accessibilityRole="link"
      >
        Terms
      </Text>{' '}
      and{' '}
      <Text
        variant="caption"
        color="secondary"
        style={styles.link}
        onPress={() => open(privacyUrl)}
        accessibilityRole="link"
      >
        Privacy Policy
      </Text>
      .
    </Text>
  );
}

const styles = StyleSheet.create({
  line: { lineHeight: 18 },
  link: { textDecorationLine: 'underline' },
});
