import React from 'react';
import { Platform } from 'react-native';
import { presentAppPicker } from '../utils/familyControls';

export interface FamilyActivityPickerModalProps {
  visible: boolean;
  onComplete: (success: boolean, cancelled?: boolean) => void;
}

const FamilyActivityPickerModal: React.FC<FamilyActivityPickerModalProps> = ({
  visible,
  onComplete,
}) => {
  React.useEffect(() => {
    if (visible && Platform.OS === 'ios') {
      presentAppPicker().then((result) => {
        onComplete(result.success, result.cancelled);
      });
    }
  }, [visible, onComplete]);

  return null;
};

export default FamilyActivityPickerModal;
