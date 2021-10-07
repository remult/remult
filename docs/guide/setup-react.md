```sh
npx create-react-app remult-react-todo --template typescript
cd remult-react-todo
npm i remult express
npm i --save-dev @types/express ts-node-dev
```

for prod
```sh
express-jwt compression helmet pg jwt-decode axios
npm i --save-dev @types/compression @types/express-jwt @types/jsonwebtoken @types/pg
```


## Fixes
go through the warnings of react and make them go away


git diff after-ng-new..remult-setup -- :!package-lock.json** > ../remult-setup.diff

curl https://gist.githubusercontent.com/noam-honig/c665824fa08094ae227e22e368ad058a/raw/7ac653fd88a9c815da9dfd9ffed0a57c2e359e10/remult-setup.diff | git apply