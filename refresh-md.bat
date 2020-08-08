call typedoc  --ignoreCompilerErrors --exclude *.spec.ts --exclude **/schematics/**  --out ./tmp/ref   --excludeExternals ./projects/core/src/entity.ts
node docs-work