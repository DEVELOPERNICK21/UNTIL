import React from 'react';
import { Linking, StyleSheet } from 'react-native';
import { Text } from './Text';
import { parseLinkedText } from '../i18n/linkedText';
import { useTranslation } from '../i18n/useTranslation';

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
  const { t } = useTranslation();
  const urls = [termsUrl, privacyUrl];
  let linkIndex = 0;
  const open = (url: string) => {
    void Linking.openURL(url).catch(() => undefined);
  };
  return (
    <Text
      variant="caption"
      color="secondary"
      style={[styles.line, { textAlign: align }]}
    >
      {parseLinkedText(t('common.legal.line')).map((segment, index) => {
        if (!segment.link) return segment.text;
        const url = urls[linkIndex++];
        return (
          <Text
            key={index}
            variant="caption"
            color="secondary"
            style={styles.link}
            onPress={() => open(url)}
            accessibilityRole="link"
          >
            {segment.text}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  line: { lineHeight: 18 },
  link: { textDecorationLine: 'underline' },
});
