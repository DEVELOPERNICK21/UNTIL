import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { NotchIsland } from './NotchIsland';
import { DesktopWidget } from './DesktopWidget';
import './panel.css';

// Mac draws a blurred popover behind the transparent window; Windows gets a solid panel.
document.documentElement.dataset.platform = /Mac/.test(navigator.userAgent) ? 'mac' : 'win';

// The same page serves every window: the panel, the island that grows out of the notch, and the
// desktop widgets.
const requested = new URLSearchParams(window.location.search).get('view');
const view = requested === 'notch' || requested === 'widget' ? requested : 'panel';
document.documentElement.dataset.view = view;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {view === 'notch' ? <NotchIsland /> : view === 'widget' ? <DesktopWidget /> : <App />}
  </React.StrictMode>,
);
