call xcopy ..\..\projects\core\*.* ..\..\dist\generate\*.* /s /Y
cd ..
cd ..
cd dist
cd generate
call del src\backend-tests\*.* /q
call del src\tests\*.* /q
call del src\tests\test-data-api\*.* /q
call del src\shared-tests\*.* /q
call del src\live-query\*.spec.ts /q
rem call npm i typescript typedoc
call npx typedoc index.ts server/index.ts --json the.json
cd..
cd..
call npm run build-ref-ts

rem "typedoc --tsconfig projects/core/tsconfig.build.json  projects/core/index.ts --json tmp/api.json && build-ref.bat" //this is new and better