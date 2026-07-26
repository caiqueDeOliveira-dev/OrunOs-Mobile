/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import path from "path";

const mockDir = path.resolve(__dirname, "src/test/__mocks__");

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    exclude: [
      "**/*.test.tsx",
      "**/*.rn-test.tsx",
      "**/*.spec.tsx",
      "**/node_modules/**",
    ],
  },
  resolve: {
    alias: [
      {
        find: "react-native-url-polyfill/auto",
        replacement: path.join(mockDir, "react-native-url-polyfill-auto.ts"),
      },
      {
        find: "react-native-url-polyfill",
        replacement: path.join(mockDir, "react-native-url-polyfill.ts"),
      },
      {
        find: "react-native",
        replacement: path.join(mockDir, "react-native.ts"),
      },
    ],
  },
});
