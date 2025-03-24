declare global {
  interface Window {
    __MICROAPP__: { id: string }
  }
}

export {}