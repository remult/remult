#!/bin/bash

# Copy core files to generate directory
mkdir ../../dist/generate
cp -r ../../projects/core/* ../../dist/generate/

# Change to dist/generate directory
cd ../../dist/generate

# Remove test files
rm -rf src/backend-tests/*
rm -rf src/tests/*
rm -rf src/tests/test-data-api/*
rm -rf src/shared-tests/*
rm -f src/live-query/*.spec.ts

# Generate TypeDoc JSON
npx typedoc index.ts server/index.ts migrations/index.ts async-hooks.ts --json the.json

# Return to original directory and run build-ref-ts
cd ../..
npm run build-ref-ts 