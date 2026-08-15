const { contextBridge, ipcRenderer } = require('electron');

const printerAPI = {
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printSilent: (payload) => ipcRenderer.invoke('print-silent', payload),
  openCustomerDisplay: () => ipcRenderer.invoke('open-customer-display'),
  closeCustomerDisplay: () => ipcRenderer.invoke('close-customer-display'),
  // B4: ล็อก/ปลดล็อกการปิด-รีเฟรชหน้าต่าง ระหว่างอยู่หน้าชำระเงิน (กันทุจริต)
  setPayLock: (locked) => ipcRenderer.invoke('set-pay-lock', locked),
};

contextBridge.exposeInMainWorld('electronAPI', {
  connectServer: (ip) => ipcRenderer.invoke('connect-server', ip),
  connectLocalhost: () => ipcRenderer.invoke('connect-localhost'),
  testConnection: (target) => ipcRenderer.invoke('test-connection', target),
  getLauncherState: () => ipcRenderer.invoke('get-launcher-state'),
  showAlertSync: (message) => ipcRenderer.sendSync('show-alert-sync', String(message ?? '')),
  showConfirmSync: (message) => ipcRenderer.sendSync('show-confirm-sync', String(message ?? '')),
  getPrinters: printerAPI.getPrinters,
  printSilent: printerAPI.printSilent,
  openCustomerDisplay: printerAPI.openCustomerDisplay,
  closeCustomerDisplay: printerAPI.closeCustomerDisplay,
  getSavedIP: () => ipcRenderer.invoke('get-saved-ip'),
  clearSavedIP: () => ipcRenderer.invoke('clear-saved-ip'),
  startSmartcardAgent: () => ipcRenderer.invoke('start-smartcard-agent'),
  checkSmartcardAgent: () => ipcRenderer.invoke('check-smartcard-agent'),
  getPowerSchedule: () => ipcRenderer.invoke('power-schedule:get'),
  setPowerSchedule: (payload) => ipcRenderer.invoke('power-schedule:set', payload),
  previewPowerOffCommand: () => ipcRenderer.invoke('power-schedule:preview-off'),
});

contextBridge.exposeInMainWorld('electron', printerAPI);
