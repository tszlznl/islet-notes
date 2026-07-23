declare const __PROJECT_COMMIT_HASH__: string;
declare const __APP_VERSION__: string;
declare var __ISLET_ANDROID_ENVIRONMENT__: { isInstalledByZhuoyi(): boolean } | undefined;
declare var language: string;
declare var i18nMessages: Record<string, string | { content: string }>;

declare module '*.css';

declare module 'loro-crdt/web/loro_wasm_bg.wasm?url' {
  const url: string;
  export default url;
}
