import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vitePluginSvg } from './src/runtime/vitePluginSvg.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vitePluginSvg()],
  base: './',
})
