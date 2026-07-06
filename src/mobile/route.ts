import { matchPath } from 'react-router';

type FallbackPath =
  | string
  | ((params: Record<string, string | undefined>, search: URLSearchParams) => string | undefined);

export interface PageRoute {
  url: string;
  file: `./pages/${string}`;
  component: string;
  fallback?: FallbackPath;
}

export const routes: PageRoute[] = [
  {
    url: '/startup',
    file: './pages/startup/startup',
    component: 'StartupPage',
  },
  {
    url: '/startup/experience',
    file: './pages/startup/experience/experience',
    component: 'StartupExperiencePage',
    fallback: '/startup',
  },
  {
    url: '/startup/setup',
    file: './pages/startup/setup/setup',
    component: 'StartupSetupPage',
    fallback: '/startup',
  },
  {
    url: '/startup/setup/sync',
    file: './pages/startup/setup/sync/sync',
    component: 'StartupSetupSyncPage',
    fallback: '/',
  },
  {
    url: '/startup/setup/sync/s3',
    file: './pages/startup/setup/sync/s3/s3',
    component: 'StartupSetupSyncS3Page',
    fallback: '/',
  },
  {
    url: '/startup/setup/sync/webdav',
    file: './pages/startup/setup/sync/webdav/webdav',
    component: 'StartupSetupSyncWebdavPage',
    fallback: '/',
  },
  {
    url: '/startup/setup/key/init',
    file: './pages/startup/setup/key/init/init',
    component: 'StartupSetupKeyInitPage',
    fallback: '/',
  },
  {
    url: '/startup/setup/key/restore',
    file: './pages/startup/setup/key/restore/restore',
    component: 'StartupSetupKeyRestorePage',
    fallback: '/',
  },
  {
    url: '/diaries',
    file: './pages/diaries/diaries',
    component: 'DiariesPage',
  },
  {
    url: '/calendar',
    file: './pages/calendar/calendar',
    component: 'CalendarPage',
    // 带 notebookId 的作用域日历隐藏了底部标签栏并显示返回,直接打开/刷新时回到该日记本的查找页;
    // 普通日历标签页(无 notebookId)不提供回退,保持根标签页原有行为。
    fallback: (_params, search) => {
      const notebookId = search.get('notebookId');
      return notebookId ? `/diary/${notebookId}/search` : undefined;
    },
  },
  {
    url: '/diaries/new',
    file: './pages/diaries/new/new',
    component: 'DiariesNewPage',
    fallback: '/diaries',
  },
  {
    url: '/diary/:notebookId',
    file: './pages/diary/chat/chat',
    component: 'DiaryChatPage',
    fallback: '/diaries',
  },
  {
    url: '/diary/:notebookId/settings',
    file: './pages/diary/chat/settings/settings',
    component: 'DiaryChatSettingsPage',
    fallback: ({ notebookId }) => (notebookId ? `/diary/${notebookId}` : '/diaries'),
  },
  {
    url: '/diary/:notebookId/name',
    file: './pages/diary/chat/name/name',
    component: 'DiaryChatNamePage',
    fallback: ({ notebookId }) => (notebookId ? `/diary/${notebookId}/settings` : '/diaries'),
  },
  {
    url: '/diary/:notebookId/chat-background',
    file: './pages/diary/chat/background/background',
    component: 'DiaryChatBackgroundPage',
    fallback: ({ notebookId }) => (notebookId ? `/diary/${notebookId}/settings` : '/diaries'),
  },
  {
    url: '/diary/:notebookId/search',
    file: './pages/diary/chat/search/search',
    component: 'DiaryChatSearchPage',
    fallback: ({ notebookId }) => (notebookId ? `/diary/${notebookId}/settings` : '/diaries'),
  },
  {
    url: '/diary/:notebookId/media',
    file: './pages/diary/chat/media/media',
    component: 'DiaryChatMediaPage',
    fallback: ({ notebookId }) => (notebookId ? `/diary/${notebookId}/search` : '/diaries'),
  },
  {
    url: '/me',
    file: './pages/me/me',
    component: 'MePage',
  },
  {
    url: '/identities',
    file: './pages/identities/identities',
    component: 'IdentitiesPage',
    fallback: '/me',
  },
  {
    url: '/identities/new',
    file: './pages/identities/new/new',
    component: 'IdentitiesNewPage',
    fallback: '/identities',
  },
  {
    url: '/identities/archived',
    file: './pages/identities/archived/archived',
    component: 'IdentitiesArchivedPage',
    fallback: '/identities',
  },
  {
    url: '/identity/:identityId',
    file: './pages/identity/identity',
    component: 'IdentityPage',
    fallback: '/identities',
  },
  {
    url: '/identity/:identityId/name',
    file: './pages/identity/name/name',
    component: 'IdentityNamePage',
    fallback: ({ identityId }) => (identityId ? `/identity/${identityId}` : '/identities'),
  },
  {
    url: '/settings',
    file: './pages/settings/settings',
    component: 'SettingsPage',
    fallback: '/me',
  },
  {
    url: '/settings/profile',
    file: './pages/settings/profile/profile',
    component: 'SettingsProfilePage',
    fallback: '/me',
  },
  {
    url: '/settings/membership',
    file: './pages/settings/membership/membership',
    component: 'SettingsMembershipPage',
    fallback: '/settings',
  },
  {
    url: '/settings/membership/purchase',
    file: './pages/settings/membership/purchase',
    component: 'SettingsMembershipPurchasePage',
    fallback: '/settings/membership',
  },
  {
    url: '/settings/membership/purchase/mianbaoduo',
    file: './pages/settings/membership/mianbaoduo',
    component: 'SettingsMembershipMianbaoduoPage',
    fallback: '/settings/membership/purchase',
  },
  {
    url: '/settings/name',
    file: './pages/settings/name/name',
    component: 'SettingsNamePage',
    fallback: '/settings/profile',
  },
  {
    url: '/settings/s3',
    file: './pages/settings/s3/s3',
    component: 'SettingsS3Page',
    fallback: '/settings',
  },
  {
    url: '/settings/ai',
    file: './pages/settings/ai/ai',
    component: 'SettingsAIPage',
    fallback: '/settings',
  },
  {
    url: '/settings/import',
    file: './pages/settings/import/import',
    component: 'SettingsImportPage',
    fallback: '/settings',
  },
  {
    url: '/settings/import/minimal-diary',
    file: './pages/settings/import/minimal/minimal',
    component: 'SettingsImportMinimalDiaryPage',
    fallback: '/settings/import',
  },
  {
    url: '/settings/import/minimal-diary/result',
    file: './pages/settings/import/minimal/result/result',
    component: 'SettingsImportMinimalDiaryResultPage',
    fallback: '/settings/import/minimal-diary',
  },
  {
    url: '/settings/s3/storage',
    file: './pages/settings/s3/storage/storage',
    component: 'SettingsS3StoragePage',
    fallback: '/settings/s3',
  },
  {
    url: '/settings/s3/delete',
    file: './pages/settings/s3/delete/delete',
    component: 'SettingsS3DeletePage',
    fallback: '/settings/s3',
  },
  {
    url: '/settings/speech-recognition',
    file: './pages/settings/speech-recognition/speech-recognition',
    component: 'SettingsSpeechRecognitionPage',
    fallback: '/settings/ai',
  },
  {
    url: '/settings/speech-recognition/add',
    file: './pages/settings/speech-recognition/add/add',
    component: 'SettingsSpeechRecognitionAddPage',
    fallback: '/settings/speech-recognition',
  },
  {
    url: '/settings/language',
    file: './pages/settings/language/language',
    component: 'SettingsLanguagePage',
    fallback: '/settings',
  },
  {
    url: '/settings/theme',
    file: './pages/settings/theme/theme',
    component: 'SettingsThemePage',
    fallback: '/settings',
  },
];

export function getBackFallbackPath(pathname: string, search = ''): string | undefined {
  const searchParams = new URLSearchParams(search);
  for (const route of routes) {
    if (!route.fallback) continue;
    const match = matchPath({ path: route.url, end: true }, pathname);
    if (!match) continue;
    return typeof route.fallback === 'function'
      ? route.fallback(match.params, searchParams)
      : route.fallback;
  }
  return undefined;
}

export function getAnalyticsRoutePath(pathname: string): string {
  for (const route of routes) {
    const match = matchPath({ path: route.url, end: true }, pathname);
    if (!match) continue;
    return route.url;
  }

  return normalizePathname(pathname);
}

function normalizePathname(pathname: string): string {
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '');
}
