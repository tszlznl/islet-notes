import { OverlayHost } from '@/mobile/overlay/OverlayHost';
import { routes } from '@/mobile/route';
import { useAttachmentUploadCommitter } from '@/mobile/hooks/useAttachmentUploadCommitter';
import { useNativeSystemBarIconStyle } from '@/mobile/hooks/useNativeSystemBarIconStyle';
import React, { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { ContentNavigation } from './components/layout/ContentNavigation';
import { HomeRedirect } from './components/layout/HomeRedirect';
import { PageRouteElement } from './components/PageRouteElement';

export function App() {
  useNativeSystemBarIconStyle();
  useAttachmentUploadCommitter();

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
