
npm run build
cd .vuepress/dist
git init
git add -A
git commit -m 'deploy'
git push -f https://github.com/remult-ts/remult-ts.github.io.git master