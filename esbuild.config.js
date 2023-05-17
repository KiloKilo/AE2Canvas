import { context } from 'esbuild'
import fs from 'fs-extra'

const dist_folder = 'dist'
const dev = process.argv[2] === 'mode=development'

fs.removeSync(dist_folder)
fs.mkdirpSync(dist_folder)

const ctx = await context({
	entryPoints: ['./src/index.js'],
	outdir: dist_folder,
	format: 'esm',
	logLevel: 'debug',
	bundle: true,
	minify: true,
	sourcemap: true,
})

if (dev) {
	await ctx.watch()
	await ctx.serve({ servedir: '/' })
} else {
	await ctx.rebuild()
	await ctx.cancel()
	await ctx.dispose()
}
