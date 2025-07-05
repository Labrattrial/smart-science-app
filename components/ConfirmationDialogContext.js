import React, { createContext, useContext, useState } from 'react';
import ConfirmationDialog from './ConfirmationDialog';

const ConfirmationDialogContext = createContext();

export const ConfirmationDialogProvider = ({ children }) => {
  const [dialogConfig, setDialogConfig] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: 'Yes',
    cancelText: 'Cancel'
  });

  const showConfirmation = (config) => {
    setDialogConfig({
      ...config,
      visible: true
    });
  };

  const hideConfirmation = () => {
    setDialogConfig(prev => ({
      ...prev,
      visible: false
    }));
  };

  const handleConfirm = () => {
    dialogConfig.onConfirm();
    hideConfirmation();
  };

  const handleCancel = () => {
    dialogConfig.onCancel();
    hideConfirmation();
  };

  return (
    <ConfirmationDialogContext.Provider value={{ showConfirmation }}>
      {children}
      <ConfirmationDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
      />
    </ConfirmationDialogContext.Provider>
  );
};

export const useConfirmationDialog = () => {
  const context = useContext(ConfirmationDialogContext);
  if (!context) {
    throw new Error('useConfirmationDialog must be used within a ConfirmationDialogProvider');
  }
  return context;
}; 
 