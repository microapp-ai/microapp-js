import type { WindowMicroapp } from './types';

declare global {
  interface Window {
    __MICROAPP__?: WindowMicroapp;
  }
}

export {};
