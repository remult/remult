call xcopy ..\..\projects\core\*.* ..\..\dist\generate\*.* /s /Y
cd ..
cd ..
cd dist
cd generate
call del src\backend-tests\*.* /q
rem call npm i typescript typedoc
call npx typedoc index.ts server/index.ts --json the.json
cd..
cd..
call npm run build-ref-ts