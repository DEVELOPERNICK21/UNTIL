import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './panel.css';

// Mac draws a blurred popover behind the transparent window; Windows gets a solid panel.
document.documentElement.dataset.platform = /Mac/.test(navigator.userAgent) ? 'mac' : 'win';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
