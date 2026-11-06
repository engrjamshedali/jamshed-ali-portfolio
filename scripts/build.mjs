import { build } from 'esbuild';

const isWatch = process.argv.includes('--watch');

console.log('Building Portfolio and Admin CMS...');

// 1. Build Public Portfolio
await build({
  entryPoints: ['src/app.jsx'],
  bundle: true,
  minify: true,
  sourcemap: true,
  outfile: 'Asset/dist/app.js',
  loader: { '.jsx': 'jsx' },
  jsx: 'automatic',
  target: ['es2020'],
  define: { 'process.env.NODE_ENV': '"production"' }
});

// 2. Build Admin CMS Dashboard
await build({
  entryPoints: ['src/admin/admin.jsx'],
  bundle: true,
  minify: true,
  sourcemap: true,
  outfile: 'Asset/dist/admin.js',
  loader: { '.jsx': 'jsx' },
  jsx: 'automatic',
  target: ['es2020'],
  define: { 'process.env.NODE_ENV': '"production"' }
});

console.log('Build complete: Asset/dist/app.js + Asset/dist/admin.js');
if (!isWatch) {
  process.exit(0);
}
