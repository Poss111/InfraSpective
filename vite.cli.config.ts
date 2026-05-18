import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/cli/infraspective.ts',
      formats: ['es'],
      fileName: () => 'infraspective.js',
    },
    outDir: 'dist/cli',
    rollupOptions: {
      external: [...builtinModules, ...builtinModules.map((module) => `node:${module}`)],
    },
    target: 'node20',
  },
});
