import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue';
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      includeAssets: ['favicon.ico','robots.txt','apple-touch-icon.png','icon.png','icon512.png'],
      //assetsInclude: ['*.*','assets/*.woff','assets/*.svg','assets/*.eot','*.png'],
      manifest: {
        name: 'JSEdit',
        short_name: "JSEdit",
        description: "Ein JavaScript-Editor für die Entwicklung mit AppJS.",
        theme_color: "#fff",
        icons: [
          {
            src: 'icon.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: 'icon512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  base: "./"
});
