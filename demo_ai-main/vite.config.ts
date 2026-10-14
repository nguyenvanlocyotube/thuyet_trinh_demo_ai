import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // Load tất cả biến từ .env vào process.env cho phía server
  const env = loadEnv(mode, process.cwd(), "");

  Object.assign(process.env, env);

  return {
    plugins: [tsconfigPaths(), tailwindcss(), tanstackStart(), react()],
  };
});
