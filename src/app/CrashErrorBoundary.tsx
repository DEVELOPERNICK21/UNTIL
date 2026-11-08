/**
 * Catches React render errors, reports to Crashlytics, and offers recovery.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  logCrashBreadcrumb,
  recordCrashError,
} from '../shared/analytics/analytics';
import { useTranslation } from '../shared/i18n/useTranslation';

/** The recovery screen. A function component so it follows the language like any other screen. */
function CrashFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.title}>{t('system.crash.title')}</Text>
      <Text style={styles.body}>{t('system.crash.body')}</Text>
      <Pressable
        onPress={onRetry}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={t('system.crash.retry')}
      >
        <Text style={styles.buttonLabel}>{t('system.crash.retry')}</Text>
      </Pressable>
    </View>
  );
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class CrashErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (info.componentStack) {
      logCrashBreadcrumb(
        `componentStack:${info.componentStack.slice(0, 500)}`
      );
    }
    recordCrashError(error, 'CrashErrorBoundary');
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return <CrashFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#0E0E10',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#EDEDED',
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#9A9A9A',
    fontSize: 16,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  buttonLabel: {
    color: '#EDEDED',
    fontSize: 16,
  },
});
