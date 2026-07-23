package com.hamsterbase.islet;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.robolectric.Shadows.shadowOf;

import android.content.Context;
import android.os.Build;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;

@RunWith(RobolectricTestRunner.class)
public class AppEnvironmentTest {
  @Test
  public void nullContextIsNotZhuoyi() {
    assertFalse(AppEnvironment.isInstalledByZhuoyi(null));
  }

  @Test
  @Config(sdk = 29)
  public void detectsZhuoyiInstallerWithLegacyApi() {
    Context context = RuntimeEnvironment.getApplication();
    setInstallerPackage(context, "com.zhuoyi.appstore.lite");

    assertTrue(AppEnvironment.isInstalledByZhuoyi(context));
  }

  @Test
  @Config(sdk = 30)
  public void detectsZhuoyiInstallerWithInstallSourceInfo() {
    Context context = RuntimeEnvironment.getApplication();
    setInstallerPackage(context, "com.zhuoyi.appstore.lite");

    assertTrue(AppEnvironment.isInstalledByZhuoyi(context));
  }

  @Test
  public void rejectsOtherInstaller() {
    Context context = RuntimeEnvironment.getApplication();
    setInstallerPackage(context, "com.android.vending");

    assertFalse(AppEnvironment.isInstalledByZhuoyi(context));
  }

  private void setInstallerPackage(Context context, String installerPackage) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      shadowOf(context.getPackageManager())
        .setInstallSourceInfo(context.getPackageName(), installerPackage, installerPackage);
      return;
    }
    context.getPackageManager().setInstallerPackageName(context.getPackageName(), installerPackage);
  }
}
