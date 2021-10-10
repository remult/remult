cd\repos\remult-angular-todo
git diff after-ng-new..remult-setup -- :!package-lock.json** > ../radweb/docs/patches/remult-angular-todo/remult-setup.diff
git diff remult-setup..setup-authentication -- :!package-lock.json** > ../radweb/docs/patches/remult-angular-todo/setup-authentication.diff
git diff setup-authentication..setup-deployment -- :!package-lock.json** > ../radweb/docs/patches/remult-angular-todo/setup-deployment.diff
git diff setup-deployment..setup-postgres -- :!package-lock.json** > ../radweb/docs/patches/remult-angular-todo/setup-postgres.diff

cd\repos\remult-react-todo
git diff first-commit..remult-setup -- :!package-lock.json** > ../radweb/docs/patches/remult-react-todo/remult-setup.diff
git diff remult-setup..setup-authentication -- :!package-lock.json** > ../radweb/docs/patches/remult-react-todo/setup-authentication.diff
git diff setup-authentication..setup-deployment -- :!package-lock.json** > ../radweb/docs/patches/remult-react-todo/setup-deployment.diff
git diff setup-deployment..setup-postgres -- :!package-lock.json** > ../radweb/docs/patches/remult-react-todo/setup-postgres.diff