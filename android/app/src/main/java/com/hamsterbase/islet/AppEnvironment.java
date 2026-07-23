package com.hamsterbase.islet;

import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;

/** 识别 Android 应用当前所在的安装与运行环境。 */
final class AppEnvironment {
  private static final String ZHUOYI_INSTALLER_PACKAGE = "com.zhuoyi.appstore.lite";

  private AppEnvironment() {}

  /** 卓易通安装的应用由其内置应用商店记录为安装来源。 */
  static boolean isInstalledByZhuoyi(Context context) {
    if (context == null) return false;

    try {
      PackageManager packageManager = context.getPackageManager();
      String packageName = context.getPackageName();
      String installerPackageName;
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        installerPackageName = packageManager
          .getInstallSourceInfo(packageName)
          .getInstallingPackageName();
      } else {
        installerPackageName = packageManager.getInstallerPackageName(packageName);
      }
      return ZHUOYI_INSTALLER_PACKAGE.equals(installerPackageName);
    } catch (Exception ignored) {
      return false;
    }
  }
}
