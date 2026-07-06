import { OverlayHost } from '@/mobile/overlay/OverlayHost';
import { routes } from '@/mobile/route';
import { useAttachmentUploadCommitter } from '@/mobile/hooks/useAttachmentUploadCommitter';
import { useNativeSystemBarIconStyle } from '@/mobile/hooks/useNativeSystemBarIconStyle';
import { useService } from '@/hooks/use-service';
import { IHostService } from '@/services/native/common/hostService';
import React, { Suspense } from 'react';
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router';
import { ContentNavigation } from './components/layout/ContentNavigation';
import { HomeRedirect } from './components/layout/HomeRedirect';
import { PageRouteElement } from './components/PageRouteElement';

export function App() {
  useNativeSystemBarIconStyle();
  useAttachmentUploadCommitter();
  const hostService = useService(IHostService);
  const Router = hostService.routerType === 'hash' ? HashRouter : BrowserRouter;

  return (
    <Router>
      <OverlayHost />
      <Suspense fallback={null}>
        <Routes>
          <Route element={<ContentNavigation />}>
            <Route path='/' element={<HomeRedirect />} />
            {routes.map((route) => (
              <Route
                key={route.url}
                path={route.url}
                element={<PageRouteElement route={route} />}
              />
            ))}
            <Route path='*' element={<Navigate to='/' replace />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}
