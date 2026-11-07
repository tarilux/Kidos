import * as esbuild from 'esbuild';

async function build() {
  await esbuild.build({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: 'dist/server.js',
    external: ['express', 'path', 'url'],
  });
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
