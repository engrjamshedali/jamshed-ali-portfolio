import { build } from 'esbuild';

try {
  await build({
    entryPoints: {
      app: 'src/app.jsx',
      admin: 'src/admin/admin.jsx'
    },
    bundle: true,
    write: false,
    outdir: 'Asset/dist',
    loader: { '.jsx': 'jsx' },
    jsx: 'automatic',
    target: ['es2020'],
    define: { 'process.env.NODE_ENV': '"production"' }
  });
  console.log('Check passed: no build or syntax errors in portfolio or admin.');
} catch (err) {
  console.error('Check failed:', err);
  process.exit(1);
}
