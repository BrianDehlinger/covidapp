import './app/covidapp-root.js';
import './assets/styles/base.scss';
import { ServiceWorkerServiceInit } from './app/services/service-worker-service.js';
import PWAService from './app/services/pwa-service.js';
import SnackBar from './app/components/snackbar.js';

if ('serviceWorker' in navigator) {
  ServiceWorkerServiceInit();
  setTimeout(() => {
    if (PWAService.installable()) {
      window.addEventListener('appinstalled', () => {
        SnackBar.success('PWA installed successfully');
      });
    }
  }, 1000);
}
