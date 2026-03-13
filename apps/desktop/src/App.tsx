import { App, setApiUrl } from '@neon-survivor/shared';

// Use production endpoint if not defined locally
setApiUrl(import.meta.env.VITE_API_URL || 'https://neon-survivor.vercel.app/api');

export function DesktopApp() {
  // We can pass Steam auth token via authOverride here if steam works
  return <App isDesktop={true} />;
}
