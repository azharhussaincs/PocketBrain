import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary — never leave users on a white crash screen.
 */
export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap} accessibilityRole="alert">
          <Text variant="headlineSmall">Something went wrong</Text>
          <Text style={styles.body}>
            PocketBrain hit an unexpected error. Your local files and models were not
            uploaded. You can retry or restart the app.
          </Text>
          <Text selectable style={styles.diag}>
            {this.state.error.message}
          </Text>
          <Button mode="contained" onPress={this.reset}>
            Retry
          </Button>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#F8FAFC' },
  body: { lineHeight: 22, opacity: 0.8 },
  diag: { fontFamily: 'monospace', fontSize: 12, opacity: 0.6 },
});
