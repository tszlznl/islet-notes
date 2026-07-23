import { useService } from '@/hooks/use-service';
import { getBackFallbackPath } from '@/mobile/route';
import { IHostService } from '@/services/native/common/hostService';
import {
  INavigationService,
  type NavigateTransition,
} from '@/services/navigationService/common/navigationService';
import { PageTransitionPreference } from '@/services/preferences/common/appPreferences';
import React, { useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Outlet, useLocation, useNavigate } from 'react-router';

/**
 * 用 View Transition 包裹路由切换，按方向在 html 上标注 data-page-transition，
 * 动画样式见 styles/main.css。不支持的浏览器或用户偏好减少动效时直接切换。
 */
function runWithPageTransition(direction: NavigateTransition, task: () => void) {
  const root = document.documentElement;
  if (
    direction === 'none' ||
    typeof document.startViewTransition !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    task();
    return;
  }
  root.dataset.pageTransition = direction;
  const transition = document.startViewTransition(() => {
    flushSync(task);
  });
  void transition.finished.finally(() => {
    if (root.dataset.pageTransition === direction) {
      delete root.dataset.pageTransition;
    }
  });
}

export function ContentNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationService = useService(INavigationService);
  const hostService = useService(IHostService);

  useEffect(() => {
    const resolveTransition = (direction: NavigateTransition): NavigateTransition =>
      hostService.getPreference(PageTransitionPreference) ? direction : 'none';
    const listener = navigationService.listenBackButton(() => {
      if (window.history.state && window.history.state.idx > 0) {
        runWithPageTransition(resolveTransition('pop'), () => navigate(-1));
        return;
      }
      const fallbackPath = getBackFallbackPath(location.pathname, location.search);
      if (fallbackPath) {
        runWithPageTransition(resolveTransition('pop'), () =>
          navigate(fallbackPath, { replace: true }),
        );
        return;
      }
      if (hostService.isNative) hostService.exitApp();
    });
    return () => listener.dispose();
  }, [location.pathname, location.search, hostService, navigate, navigationService]);

  useEffect(() => {
    const resolveTransition = (direction: NavigateTransition): NavigateTransition =>
      hostService.getPreference(PageTransitionPreference) ? direction : 'none';
    const navigateListener = navigationService.onNavigate((event) => {
      runWithPageTransition(resolveTransition(event.transition ?? 'push'), () =>
        navigate(event.path, { replace: event.replace, state: event.state }),
      );
    });
    const backListener = navigationService.onGoBack((event) => {
      if (window.history.state && window.history.state.idx > 0) {
        runWithPageTransition(resolveTransition('pop'), () => navigate(-1));
        return;
      }
      if (event?.fallbackPath) {
        runWithPageTransition(resolveTransition('pop'), () =>
          navigate(event.fallbackPath!, { replace: event.replaceFallback ?? true }),
        );
      }
    });
    return () => {
      navigateListener.dispose();
      backListener.dispose();
    };
  }, [hostService, navigate, navigationService]);

  return <Outlet />;
}
