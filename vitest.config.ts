import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Exclude the stale `src_checkpoint/` snapshot tree from the live suite.
    // It is a duplicate of an earlier `src/` (kept for reference, not shipped)
    // and must not be collected as part of the live Vitest run. The directory
    // and its files are preserved on disk.
    exclude: [...configDefaults.exclude, 'src_checkpoint/**'],
  },
});
