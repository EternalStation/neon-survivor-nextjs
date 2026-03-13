export interface IElectronAPI {
  isElectron: boolean;
  toggleFullscreen: () => Promise<void>;
  getSteamUser: () => Promise<{ username: string; steamId: string } | null>;
  getSteamAuthTicket: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
