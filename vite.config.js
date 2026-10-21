import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { getHousehold, getHouseholdId } from './src/config/households.js';

const REPO_BASE = '/money-tracker/';

// 홈 화면에 추가할 때 쓰는 앱 정보. 가계부마다 이름이 달라서 빌드할 때 만든다
const toManifest = (household) => ({
  name: household.name,
  short_name: household.shortName,
  description: household.description,
  lang: 'ko',
  start_url: './',
  scope: './',
  display: 'standalone',
  background_color: household.themeColor,
  theme_color: household.themeColor,
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
});

// index.html의 {{APP_NAME}}, {{THEME}} 등을 채우고 manifest.webmanifest를 만든다
const householdPlugin = (id, household) => {
  const manifest = JSON.stringify(toManifest(household), null, 2);
  return {
    name: 'household',
    transformIndexHtml: (html) =>
      html
        .replaceAll('{{APP_NAME}}', household.name)
        .replaceAll('{{APP_SHORT_NAME}}', household.shortName)
        .replaceAll('{{APP_DESCRIPTION}}', household.description)
        .replaceAll('{{THEME}}', id)
        .replaceAll('{{THEME_COLOR}}', household.themeColor),
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.endsWith('/manifest.webmanifest')) return next();
        res.setHeader('Content-Type', 'application/manifest+json');
        res.end(manifest);
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifest });
    },
  };
};

// GitHub Pages는 https://<계정>.github.io/<저장소>/ 아래에서 열리므로 빌드 시 경로를 저장소 이름으로 맞춘다
// (npm run preview 도 배포와 같은 경로로 확인할 수 있도록 isPreview 포함)
// 우리 집 가계부는 /money-tracker/, 엄마 가계부(--mode mom)는 /money-tracker/mom/ 에 배포
export default defineConfig(({ command, mode, isPreview }) => {
  const household = getHousehold(mode);
  const id = getHouseholdId(mode);
  return {
    base: command === 'build' || isPreview ? REPO_BASE + household.path : '/',
    build: { outDir: `dist/${household.path}` },
    plugins: [react(), householdPlugin(id, household)],
  };
});
