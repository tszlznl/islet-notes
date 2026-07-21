package com.hamsterbase.islet;

import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.Executor;

@CapacitorPlugin(name = "DeviceAuth")
public class DeviceAuthPlugin extends Plugin {
  // 允许生物识别或设备锁屏密码，弱生物识别兜底覆盖仅支持面部/指纹其一的设备。
  private static final int ALLOWED_AUTHENTICATORS =
    BiometricManager.Authenticators.BIOMETRIC_WEAK | BiometricManager.Authenticators.DEVICE_CREDENTIAL;

  @PluginMethod
  public void canAuthenticate(PluginCall call) {
    int status = BiometricManager.from(getContext()).canAuthenticate(ALLOWED_AUTHENTICATORS);
    JSObject result = new JSObject();
    result.put("available", status == BiometricManager.BIOMETRIC_SUCCESS);
    call.resolve(result);
  }

  @PluginMethod
  public void authenticate(PluginCall call) {
    String title = call.getString("title");
    if (title == null || title.isEmpty()) {
      call.reject("title is required");
      return;
    }
    String subtitle = call.getString("subtitle");

    FragmentActivity activity = getActivity();
    if (activity == null) {
      call.reject("Activity is not available");
      return;
    }

    activity.runOnUiThread(() -> {
      Executor executor = ContextCompat.getMainExecutor(activity);
      BiometricPrompt prompt = new BiometricPrompt(
        activity,
        executor,
        new BiometricPrompt.AuthenticationCallback() {
          @Override
          public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
            resolveSuccess(call, true);
          }

          @Override
          public void onAuthenticationError(int errorCode, CharSequence errString) {
            // 用户取消、锁定等终止性错误统一按验证未通过返回。
            resolveSuccess(call, false);
          }

          @Override
          public void onAuthenticationFailed() {
            // 单次比对失败后系统弹窗仍在重试中，等待终态回调。
          }
        }
      );

      BiometricPrompt.PromptInfo.Builder builder = new BiometricPrompt.PromptInfo.Builder()
        .setTitle(title)
        .setAllowedAuthenticators(ALLOWED_AUTHENTICATORS);
      if (subtitle != null && !subtitle.isEmpty()) {
        builder.setSubtitle(subtitle);
      }
      prompt.authenticate(builder.build());
    });
  }

  private void resolveSuccess(PluginCall call, boolean success) {
    JSObject result = new JSObject();
    result.put("success", success);
    call.resolve(result);
  }
}
