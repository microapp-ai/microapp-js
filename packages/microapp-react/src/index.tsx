import * as React from "react";
import { Auth } from "@microapp-io/auth";

export type MicroappContextType = {
  isAuthenticated: boolean;
};

export const MicroappContext = React.createContext<MicroappContextType>({
  isAuthenticated: false,
});

export function MicroappProvider({ children }: { children: React.ReactNode }) {
  const auth = new Auth();

  return (
    <MicroappContext.Provider
      value={{ isAuthenticated: auth.isAuthenticated() }}
    >
      {children}
    </MicroappContext.Provider>
  );
}

export function useAuth(): MicroappContextType {
  const context = React.useContext(MicroappContext);

  if (!context) {
    throw new Error("useAuth must be used within a MicroappProvider");
  }

  return context;
}

// HEY YOU! DON'T TOUCH THIS VARIABLE!
//
// It is replaced with the proper version at build time via a babel plugin in
// the rollup config.
//
// Export a global property onto the window for Microapp JS detection by the
// Core Web Vitals Technology Report. This way they can configure the `wappalyzer`
// to detect and properly classify live websites as being built with Microapp React:
// https://github.com/HTTPArchive/wappalyzer/blob/main/src/technologies/r.json
const MICROAPP_JS_VERSION = "__MICROAPP_JS_VERSION_PLACEHOLDER__";
try {
  window.__microappJsVersion = MICROAPP_JS_VERSION;
} catch (e) {
  // no-op
}

declare global {
  interface Window {
    __microappJsVersion: string;
  }
}
