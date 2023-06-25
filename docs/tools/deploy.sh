
npm run build
cd .vitepress/dist
git init
git add -A
git commit -m 'deploy'
git push -f https://github.com/remult/remult.github.io.git master