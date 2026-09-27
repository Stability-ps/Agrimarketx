package za.co.agrimarketx.app;

import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // Safety cap in case the remote site never loads or never calls hide().
    private static final long BRANDED_SPLASH_MAX_MS = 10000;
    private static final long BRANDED_SPLASH_FADE_MS = 200;
    private static final float LOGO_WIDTH_FRACTION = 0.8f;
    private static final int LOGO_MAX_WIDTH_DP = 480;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private FrameLayout brandedSplash;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Android 12+ shows its system splash (launcher icon) until our first
        // frame. That first frame already contains the branded splash below,
        // so the hand-over is seamless and the WebView is never visible while
        // https://agrimarketx.co.za is loading.
        SplashScreen.installSplashScreen(this);
        registerPlugin(BrandedSplashPlugin.class);
        super.onCreate(savedInstanceState);
        showBrandedSplash();
    }

    private void showBrandedSplash() {
        ViewGroup content = findViewById(android.R.id.content);

        brandedSplash = new FrameLayout(this);
        brandedSplash.setBackgroundColor(Color.WHITE);
        brandedSplash.setClickable(true);
        brandedSplash.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS);

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.splash_logo);
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        logo.setAdjustViewBounds(true);
        brandedSplash.addView(
            logo,
            new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER)
        );

        // Size the logo from the real container width so it adapts to phones,
        // tablets and both Fold screens (including fold/unfold while visible).
        final int maxWidthPx = Math.round(LOGO_MAX_WIDTH_DP * getResources().getDisplayMetrics().density);
        brandedSplash.addOnLayoutChangeListener((view, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom) -> {
            int width = Math.min(Math.round((right - left) * LOGO_WIDTH_FRACTION), maxWidthPx);
            ViewGroup.LayoutParams params = logo.getLayoutParams();
            if (width > 0 && params.width != width) {
                params.width = width;
                logo.setLayoutParams(params);
            }
        });

        content.addView(brandedSplash, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        handler.postDelayed(this::hideBrandedSplash, BRANDED_SPLASH_MAX_MS);
    }

    /** Removes the branded splash once; later calls are no-ops. */
    void hideBrandedSplash() {
        runOnUiThread(() -> {
            final View splash = brandedSplash;
            if (splash == null) {
                return;
            }

            brandedSplash = null;
            handler.removeCallbacksAndMessages(null);
            splash
                .animate()
                .alpha(0f)
                .setDuration(BRANDED_SPLASH_FADE_MS)
                .withEndAction(() -> {
                    ViewGroup parent = (ViewGroup) splash.getParent();
                    if (parent != null) {
                        parent.removeView(splash);
                    }
                })
                .start();
        });
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }
}
