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
  plugins: {
    SplashScreen: {
      // Android shows one native launch screen (AppTheme.NoActionBarLaunch).
      // The plugin keeps that same screen up until NativeAppBridge calls
      // SplashScreen.hide() after the remote site hydrates, so there is no
      // blank WebView while https://agrimarketx.co.za loads. The duration is
      // only a safety cap in case the site never loads.
      launchShowDuration: 6000,
      launchAutoHide: true,
      launchFadeOutDuration: 200,
      backgroundColor: "#ffffff",
      showSpinner: false
    }
  }
};

export default config;
