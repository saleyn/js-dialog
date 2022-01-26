GIT_ROOT=$(shell A=$$(git rev-parse --show-toplevel); [ -z $$A ] && echo ".git" || echo "$$A/.git")
MASTER=$(shell [ -f $(GIT_ROOT)/refs/heads/master ] && echo master || echo main)

all: dist/dialog.min.js dist/dialog.js

dist/dialog.min.js: src/dialog.js esbuild dist
	assets/node_modules/.bin/esbuild $< --bundle --minify --sourcemap=external --outfile=$@

dist/dialog.js: src/dialog.js esbuild dist
	assets/node_modules/.bin/esbuild $< --bundle --outfile=$@

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

github-docs gh-pages: GVER=$(shell git ls-tree --name-only -r $(MASTER) build-aux | grep 'google.*\.html')
github-docs gh-pages: LOCAL_GVER=$(notdir $(GVER))
github-docs gh-pages:
	@# The git config params must be set when this target is executed by a GitHub workflow
	@[ -z "$(git config user.name)" ] && \
		git config user.name  github-actions && \
		git config user.email github-actions@github.com
	@if git branch | grep -q gh-pages ; then \
		git checkout gh-pages; \
	else \
		git checkout -b gh-pages; \
	fi
	@echo "Git root: $(git rev-parse --show-toplevel)"
	@echo "Main branch: $(MASTER)"
	@rm -fr assets src package*
	git checkout $(MASTER) -- dist Makefile test/test.html
	@mv test/test.html index.html
	@FILES=`git status -uall --porcelain | sed -n '/^?? [A-Za-z0-9]/{s/?? //p}'`; \
	for f in $$FILES ; do \
		echo "Adding $$f"; git add $$f; \
	done
	#@sh -c "ret=0; set +e; \
		if   git commit -a --amend -m 'Documentation updated'; \
		then git push origin +gh-pages; echo 'Pushed gh-pages to origin'; \
		else ret=1; git reset --hard; \
		fi; \
		set -e; git checkout $(MASTER) && echo 'Switched to $(MASTER)'; exit $$ret"
