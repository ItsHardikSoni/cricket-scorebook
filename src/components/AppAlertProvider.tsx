import { Colors } from '@/constants/colors';
import { useCricketStore } from '@/storage/cricketStore';
import { Ionicons } from '@expo/vector-icons';
import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface AppAlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
}

interface AppAlertRequest {
  title: string;
  message?: string;
  buttons: AppAlertButton[];
}

type ShowAppAlert = (title: string, message?: string, buttons?: AppAlertButton[]) => void;

const AppAlertContext = createContext<ShowAppAlert | null>(null);

export function useAppAlert(): ShowAppAlert {
  const showAlert = useContext(AppAlertContext);
  if (!showAlert) throw new Error('useAppAlert must be used inside AppAlertProvider');
  return showAlert;
}

export function AppAlertProvider({ children }: PropsWithChildren) {
  const [activeAlert, setActiveAlert] = useState<AppAlertRequest | null>(null);
  const isDarkMode = useCricketStore((state) => state.settings.darkMode);

  const showAlert: ShowAppAlert = (title, message, buttons) => {
    setActiveAlert({ title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] });
  };

  const closeAlert = () => setActiveAlert(null);
  const handleButtonPress = (button: AppAlertButton) => {
    closeAlert();
    if (!button.onPress) return;

    void Promise.resolve()
      .then(button.onPress)
      .catch((error: unknown) => {
        showAlert(
          'Action failed',
          error instanceof Error ? error.message : 'Please try again.'
        );
      });
  };

  const bgModal = isDarkMode ? Colors.darkBg : Colors.white;
  const textPrimary = isDarkMode ? Colors.darkTextPrimary : Colors.secondary;
  const textSecondary = isDarkMode ? Colors.darkTextSecondary : Colors.neutral;
  const borderColor = isDarkMode ? Colors.darkBorder : Colors.lightBorder;
  const accentColor = isDarkMode ? Colors.accentDark : Colors.primary;
  const hasDestructiveAction = activeAlert?.buttons.some((button) => button.style === 'destructive') ?? false;

  return (
    <AppAlertContext.Provider value={showAlert}>
      {children}
      <Modal
        visible={activeAlert !== null}
        transparent
        animationType="fade"
        onRequestClose={closeAlert}
      >
        {activeAlert && (
          <View style={styles.backdrop}>
            <View style={[styles.dialog, { backgroundColor: bgModal, borderColor }]}>
              <View style={styles.headingRow}>
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: hasDestructiveAction ? Colors.wicketNoticeBgLight : isDarkMode ? Colors.successBgDark : Colors.lightHighlight },
                  ]}
                >
                  <Ionicons
                    name={hasDestructiveAction ? 'warning-outline' : 'information-circle-outline'}
                    size={22}
                    color={hasDestructiveAction ? Colors.trash : accentColor}
                  />
                </View>
                <View style={styles.headingText}>
                  <Text style={[styles.title, { color: textPrimary }]}>{activeAlert.title}</Text>
                  {!!activeAlert.message && (
                    <Text style={[styles.message, { color: textSecondary }]}>{activeAlert.message}</Text>
                  )}
                </View>
              </View>

              <View style={[styles.actions, activeAlert.buttons.length > 2 && styles.verticalActions]}>
                {activeAlert.buttons.map((button, index) => {
                  const destructive = button.style === 'destructive';
                  const cancel = button.style === 'cancel';
                  return (
                    <TouchableOpacity
                      key={`${button.text}-${index}`}
                      style={[
                        styles.actionButton,
                        activeAlert.buttons.length > 1 && styles.multipleActionButton,
                        cancel
                          ? { borderColor, backgroundColor: 'transparent' }
                          : { backgroundColor: destructive ? Colors.trash : accentColor },
                      ]}
                      onPress={() => handleButtonPress(button)}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.actionText, { color: cancel ? textPrimary : Colors.white }]}>
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </Modal>
    </AppAlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.56)',
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingText: {
    flex: 1,
    paddingTop: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 22,
  },
  verticalActions: {
    flexDirection: 'column',
  },
  actionButton: {
    minHeight: 42,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  multipleActionButton: {
    flex: 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});