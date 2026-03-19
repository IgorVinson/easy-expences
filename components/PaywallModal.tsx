import React from 'react';
import { Modal } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <RevenueCatUI.Paywall
        onPurchaseCompleted={() => onClose()}
        onRestoreCompleted={() => onClose()}
        onDismiss={() => onClose()}
      />
    </Modal>
  );
};
