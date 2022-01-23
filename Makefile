all: dist/dialog.min.js

dist/dialog.min.js: src/dialog.js esbuild dist
	assets/node_modules/.bin/esbuild $< --bundle --minify --outfile=$@

assets dist:
	mkdir -p $@

esbuild: assets/node_modules/.bin/esbuild

assets/node_modules/.bin/esbuild: assets
	cd assets && npm i esbuild

clean:
	rm -fr dist

distclean: clean
	rm -fr assets/node_modules assets/package-lock.json

publish:
	npm publish --access public

npm-update:
	@[ -z "$(version)" ] && echo "Run as: make $@ version=X.Y.Z" && false || true
	npm version $(version)
	npm publish

npm-deprecate:
	@[ -z "$(version)" ] && echo "Run as: make $@ version=X.Y.Z" && false || true
	npm deprecate @saleyn/js-dialog@${version} "This version no longer supported. Update to @latest"
