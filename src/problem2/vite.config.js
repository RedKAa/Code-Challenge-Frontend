import { defineConfig } from 'vite';
import svgLoader from 'vite-plugin-svg-loader';

export default defineConfig({
  plugins: [svgLoader.default()],
});
