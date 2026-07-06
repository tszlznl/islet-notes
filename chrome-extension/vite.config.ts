import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

const extensionDir = __dirname;
const appRoot = path.resolve(extensionDir, '..');

function getGitCommitHash() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

const commitHash = getGitCommitHash();
const appVersion = process.env.ISLET_APP_VERSION ?? process.env.npm_package_version ?? '0.1.0';

function releaseConfigPlugin(): Plugin {
  return {
    name: 'islet-extension-release-config',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'release_config.json',
        source: `${JSON.stringify(
          {
            productName: 'Islet',
            commitHash,
            version: appVersion,
            builtAt: new Date().toISOString(),
          },
          null,
          2,
        )}\n`,
      });
    },
  };
}

function chromeExtensionManifestPlugin(): Plugin {
  return {
    name: 'islet-chrome-extension-manifest',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: `${JSON.stringify(
          {
            manifest_version: 3,
            name: 'Islet',
            description: 'Journal your day like a chat.',
            version: normalizeExtensionVersion(appVersion),
            minimum_chrome_version: '114',
            action: {
              default_title: 'Islet',
            },
            icons: {
              128: 'apple-touch-icon.png',
            },
            side_panel: {
              default_path: 'index.html',
            },
            background: {
              service_worker: 'background.js',
            },
            content_security_policy: {
              extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
            },
            permissions: ['sidePanel'],
            optional_permissions: ['unlimitedStorage'],
            // 屿声自有后端（会员等接口）安装即授权，无需运行时申请；
            // 用户自配的 S3/WebDAV 端点仍走可选主机权限，按需申请。
            host_permissions: ['https://cloud.hamsterbase.com/*'],
            optional_host_permissions: ['https://*/*', 'http://*/*'],
          },
          null,
          2,
        )}\n`,
      });
    },
  };
}

export default defineConfig({
  root: extensionDir,
  publicDir: path.join(appRoot, 'public'),
  define: {
    __PROJECT_COMMIT_HASH__: JSON.stringify(commitHash),
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    outDir: path.join(extensionDir, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.join(extensionDir, 'index.html'),
        background: path.join(extensionDir, 'background.ts'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.join(appRoot, './src'),
      vscf: path.join(appRoot, './src/packages/vscf'),
      vs: path.join(appRoot, './src/packages/vscf/internal'),
    },
  },
  plugins: [react(), releaseConfigPlugin(), chromeExtensionManifestPlugin()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
});

function normalizeExtensionVersion(version: string): string {
  const parts = version
    .split(/[^0-9]+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => String(Number(part)));
  while (parts.length < 3) parts.push('0');
  return parts.join('.');
}
