.PHONY: build

test:
	npx vitest run

test-watch:
	npx vitest

build: prepare-build
	npx oclif manifest
	npx tsc -p tsconfig.lib.json 

build-watch: prepare-build
	node watch.mjs &
	npx tsc -p tsconfig.lib.json --watch

prepare-build:
	rm -rf build
	mkdir -p build