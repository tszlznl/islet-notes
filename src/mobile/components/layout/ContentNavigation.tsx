import { useService } from '@/hooks/use-service';
import { getBackFallbackPath } from '@/mobile/route';
import { IHostService } from '@/services/native/common/hostService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

export function ContentNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationService = useService(INavigationService);
  const hostService = useService(IHostService);

  useEffect(() => {
    const listener = navigationService.listenBackButton(() => {
      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
        return;
      }
      const fallbackPath = getBackFallbackPath(location.pathname, location.search);
      if (fallbackPath) {
        navigate(fallbackPath, { replace: true });
        return;
      }
      if (hostService.isNative) hostService.exitApp();
    });
    return () => listener.dispose();
  }, [location.pathname, location.search, hostService, navigate, navigationService]);

  useEffect(() => {
    const navigateListener = navigationService.onNavigate((event) => {
      navigate(event.path, { replace: event.replace, state: event.state });
    });
    const backListener = navigationService.onGoBack((event) => {
      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
        return;
      }
      if (event?.fallbackPath) {
        navigate(event.fallbackPath, { replace: event.replaceFallback ?? true });
      }
    });
    return () => {
      navigateListener.dispose();
      backListener.dispose();
    };
  }, [navigate, navigationService]);

  return <Outlet />;
}
