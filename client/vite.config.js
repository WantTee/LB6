import { defineConfig } from "vite";

export default defineConfig({
  base: "/LB6/",
  root: ".",
  server: {
    port: 5173,
    historyApiFallback: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "terser",
    rollupOptions: {
      output: {
        entryFileNames: "js/app.min.js",
        chunkFileNames: "js/[name].min.js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "css/style.min.css";
          }
          return "assets/[name][extname]";
        },
      },
    },
  },
});
