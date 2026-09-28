import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "za.co.agrimarketx.app",
  appName: "AgriMarketX",
  webDir: "public",
  bundledWebRuntime: false,
  server: {
    url: "https://agrimarketx.co.za",
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    }
  }
};

export default config;
