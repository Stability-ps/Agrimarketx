import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "za.co.agrimarketx.app",
  appName: "AgriMarketX",
  webDir: "public",
  server: {
    url: "https://agrimarketx.co.za",
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      // Android already shows the native launch screen through
      // AppTheme.NoActionBarLaunch. Do not add a second Capacitor
      // splash overlay after the WebView starts rendering.
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      showSpinner: false
    }
  }
};

export default config;
