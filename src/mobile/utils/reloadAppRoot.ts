export function reloadAppRoot(): void {
  // hash 路由（如 Chrome 扩展）下路由由 location.hash 承载，
  // 重置 hash 到根路由再刷新；path 路由则直接回到根路径。
  if (window.location.hash.startsWith('#/')) {
    window.history.replaceState(null, '', `${window.location.pathname}#/`);
    window.location.reload();
    return;
  }

  window.location.replace('/');
}
