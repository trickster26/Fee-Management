const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'electron',
    {
        invoke: (channel, data) => {
            // Whitelist channels
            const validChannels = [
                'get-school-info',
                'save-school-info',
                'get-dashboard-stats',
                'get-recent-activities',
                'save-student',
                'get-students',
                'update-student',
                'delete-student',
                'record-payment',
                'get-payments',
                'get-fee-structure',
                'update-fee-structure'
            ];
            
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, data);
            }
            
            return Promise.reject(new Error(`Invalid channel: ${channel}`));
        }
    }
); 