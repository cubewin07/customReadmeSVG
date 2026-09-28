import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'
import { vitePluginSvg } from './src/runtime/vitePluginSvg.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.VITE_GITHUB_TOKEN && !process.env.VITE_GITHUB_TOKEN) {
    process.env.VITE_GITHUB_TOKEN = env.VITE_GITHUB_TOKEN;
  }
  if (env.GITHUB_TOKEN && !process.env.GITHUB_TOKEN) {
    process.env.GITHUB_TOKEN = env.GITHUB_TOKEN;
  }

  return {
    plugins: [react(), vitePluginSvg()],
    base: '/',
  };
})
