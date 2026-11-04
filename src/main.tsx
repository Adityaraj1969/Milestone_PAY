import { createRoot } from 'react-dom/client';
import './index.css';

if (typeof window !== 'undefined') {
  const win = window as unknown as { __agGridTrialFilterInstalled?: boolean };
  if (!win.__agGridTrialFilterInstalled) {
    win.__agGridTrialFilterInstalled = true;
    const origError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      const msg = args.map((a) => String(a ?? '')).join(' ');
      if (
        msg.includes('AG Grid Enterprise License') ||
        msg.includes('License Key Not Found') ||
        msg.includes('All AG Grid Enterprise features are unlocked') ||
        msg.includes('info@ag-grid.com') ||
        /^\*{10,}/.test(msg.trim())
      ) {
        return;
      }
      origError(...args);
    };
  }
}

import App from './App.tsx';

createRoot(document.getElementById('root')!).render(<App />);

