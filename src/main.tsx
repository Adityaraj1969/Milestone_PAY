import { createRoot } from 'react-dom/client';
import './index.css';

if (typeof window !== 'undefined') {
  const win = window as unknown as { __agGridTrialFilterInstalled?: boolean };
  if (!win.__agGridTrialFilterInstalled) {
    win.__agGridTrialFilterInstalled = true;
    const origError = console.error.bind(console);
    const origWarn = console.warn.bind(console);

    const isAgGridLicenseNoise = (args: unknown[]) => {
      const msg = args.map((a) => String(a ?? '')).join(' ').toLowerCase();
      return (
        msg.includes('ag grid enterprise license') ||
        msg.includes('license key not found') ||
        msg.includes('all ag grid enterprise features are unlocked') ||
        msg.includes('info@ag-grid.com') ||
        (msg.includes('ag grid') && msg.includes('license')) ||
        /\*{8,}/.test(msg)
      );
    };

    console.error = (...args: unknown[]) => {
      if (isAgGridLicenseNoise(args)) return;
      origError(...args);
    };
    console.warn = (...args: unknown[]) => {
      if (isAgGridLicenseNoise(args)) return;
      origWarn(...args);
    };
  }
}

import App from './App.tsx';

createRoot(document.getElementById('root')!).render(<App />);

