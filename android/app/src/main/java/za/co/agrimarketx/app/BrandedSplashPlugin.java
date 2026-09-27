package za.co.agrimarketx.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Android implementation of the SplashScreen JS API used by the website's
 * NativeAppBridge. The npm @capacitor/splash-screen plugin is excluded on
 * Android (android.includePlugins in capacitor.config.ts) because its
 * Android 12 path can only show the small launcher icon; this plugin
 * dismisses MainActivity's large branded splash instead.
 */
@CapacitorPlugin(name = "SplashScreen")
public class BrandedSplashPlugin extends Plugin {

    @PluginMethod
    public void hide(PluginCall call) {
        if (getActivity() instanceof MainActivity) {
            ((MainActivity) getActivity()).hideBrandedSplash();
        }
        call.resolve();
    }

    // The branded splash is launch-only and must never be shown again.
    @PluginMethod
    public void show(PluginCall call) {
        call.resolve();
    }
}
