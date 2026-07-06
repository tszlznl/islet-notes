import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function getGitCommitHash() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

const coverageEnabled = process.env.COVERAGE === 'true';
const commitHash = getGitCommitHash();
const appVersion = process.env.ISLET_APP_VERSION ?? process.env.npm_package_version ?? '0.1.0';

function releaseConfigPlugin(): Plugin {
  return {
    name: 'islet-release-config',
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

async function createCoveragePlugins(): Promise<Plugin[]> {
  if (!coverageEnabled) return [];

  const importModule = new Function('specifier', 'return import(specifier)') as (
    specifier: string,
  ) => Promise<{ default: (options: Record<string, unknown>) => Plugin }>;
  const { default: istanbul } = await importModule('vite-plugin-istanbul');

  return [
    istanbul({
      include: 'src/*',
      exclude: ['src/packages/vscf/**'],
      extension: ['.js', '.jsx', '.ts', '.tsx'],
      forceBuildInstrument: true,
    }),
  ];
}

export default defineConfig(async () => ({
  root: __dirname,
  define: {
    __PROJECT_COMMIT_HASH__: JSON.stringify(commitHash),
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  // 本地开发时，百度语音接口走反向代理绕过 CORS；原生端用 WebDavHttp 桥接。
  server: {
    proxy: {
      '/api/baidu/aip': {
        target: 'https://aip.baidubce.com',
        changeOrigin: true,
        rewrite: (requestPath: string) => requestPath.replace(/^\/api\/baidu\/aip/, ''),
      },
      '/api/baidu/vop': {
        target: 'https://vop.baidu.com',
        changeOrigin: true,
        rewrite: (requestPath: string) => requestPath.replace(/^\/api\/baidu\/vop/, ''),
      },
      '/jianguoyun': {
        target: 'https://dav.jianguoyun.com',
        changeOrigin: true,
        rewrite: (requestPath: string) => requestPath.replace(/^\/jianguoyun/, '/dav'),
      },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, './src'),
      vscf: path.join(__dirname, './src/packages/vscf'),
      vs: path.join(__dirname, './src/packages/vscf/internal'),
    },
  },
  plugins: [react(), releaseConfigPlugin(), ...(await createCoveragePlugins())],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
}));
