import type { CapacitorConfig } from "@capacitor/cli";

// Production loads the live site. CAP_SERVER_URL is a local-testing override
// only, e.g. CAP_SERVER_URL=http://localhost:3000 npx cap sync android
const serverUrl = process.env.CAP_SERVER_URL ?? "https://agrimarketx.co.za";

const config: CapacitorConfig = {
  appId: "za.co.agrimarketx.app",
  appName: "AgriMarketX",
  webDir: "public",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://")
  },
  android: {
    // Android uses the native branded splash in MainActivity/BrandedSplashPlugin,
    // which also answers the website's SplashScreen.hide() call. The npm
    // splash plugin can only show the small Android 12 launcher icon.
    includePlugins: ["@capacitor/app", "@capacitor/status-bar"]
  },
  plugins: {
    SystemBars: {
      // The site declares viewport-fit=cover. Without this hint Capacitor pads
      // the window by the system bars until the page commits, then removes the
      // padding, which resizes the WebView and shifts the native splash.
      initialViewportFitValueHint: "cover"
    },
    SplashScreen: {
      // iOS only (see android.includePlugins). Keeps the launch screen up
      // until NativeAppBridge calls SplashScreen.hide() after hydration;
      // the duration is only a safety cap.
      launchShowDuration: 6000,
      launchAutoHide: true,
      launchFadeOutDuration: 200,
      backgroundColor: "#ffffff",
      showSpinner: false
    }
  }
};

export default config;
