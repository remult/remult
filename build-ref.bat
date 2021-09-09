call xcopy projects\core\*.* dist\generate\*.* /s /Y
cd dist
cd generate
rem call npm i typescript typedoc
call npx typedoc index.ts --json the.json
cd..
cd..
call npm run build-ref-ts