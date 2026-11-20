import './styles/main.css';
import { mountGameShell } from './ui/gameShell';
import { mountLanding } from './ui/landing';

const appRoot = document.querySelector<HTMLElement>('#app')!;

let cleanupCurrent: (() => void) | null = null;

function renderRoute(): void {
  if (cleanupCurrent) {
    cleanupCurrent();
    cleanupCurrent = null;
  }

  const isPlay = window.location.hash === '#play';
  if (isPlay) {
    cleanupCurrent = mountGameShell(appRoot, () => {
      window.location.hash = '';
    });
  } else {
    cleanupCurrent = mountLanding(appRoot, () => {
      window.location.hash = '#play';
    });
  }
}

window.addEventListener('hashchange', renderRoute);
renderRoute();
