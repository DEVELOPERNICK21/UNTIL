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
} from '../services/analytics';

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
      return (
        <View style={styles.container} accessibilityRole="alert">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            The app hit an unexpected error. You can try again.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.buttonLabel}>Try again</Text>
          </Pressable>
        </View>
      );
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
