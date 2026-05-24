import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirmation prompt.
 * - Web: uses window.confirm (Alert.alert with multiple buttons is unreliable on RN web).
 * - Native: uses Alert.alert with Cancel + destructive Confirm buttons.
 */
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  confirmLabel: string = 'Delete',
): void {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    // eslint-disable-next-line no-alert
    if (typeof window !== 'undefined' && window.confirm(text)) {
      void onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: () => void onConfirm() },
  ]);
}
