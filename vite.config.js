import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages는 https://<계정>.github.io/<저장소>/ 아래에서 열리므로 빌드 시 경로를 저장소 이름으로 맞춘다
// (npm run preview 도 배포와 같은 경로로 확인할 수 있도록 isPreview 포함)
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/money-tracker/' : '/',
  plugins: [react()],
}));
