all: dist/dialog.min.js dist/dialog.min.css

dist/dialog.min.js: esbuild dist
	assets/node_modules/.bin/esbuild dialog.js --bundle --minify --outfile=$@

dist/dialog.min.css: esbuild dist
	assets/node_modules/.bin/esbuild dialog.css --bundle --minify --outfile=$@

assets dist:
	mkdir -p $@

esbuild: assets/node_modules/.bin/esbuild

assets/node_modules/.bin/esbuild: assets
	cd assets && npm i esbuild
