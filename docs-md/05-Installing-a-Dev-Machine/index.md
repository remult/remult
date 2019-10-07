These are the softwares we'll use for the local development environment

## Node js
Node.js is an open-source, cross-platform JavaScript runtime environment for executing JavaScript code server-side.

Install it from: https://nodejs.org/en/

(For this demo we've used version 10.16.3 LTS)

## Git Source Control
Git is the most widely used source control and versioning tool. 
Download and install it from:
https://git-scm.com/download/win

## Postgres database   
We'll use the great and free database called Postgres

Download and install it from:
https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

In this demo we've used Windows x86-64 version, 11.5

When Installing you will be prompted for a password, give it a password, and remember it (we'll need it later)
> (when creating this demo we used the password: MASTERKEY)

[For a step by step walk-through for the postgres setup, click here](install-postgres-step-by-step.html)

## Visual Studio Code 
A source code editor which we use to develop application.

Install it from: https://code.visualstudio.com/

#### Visual Studio Extensions
To install the following recommended extensions, open a command prompt and run the following commands:
```
code --install-extension Angular.ng-template
code --install-extension infinity1207.angular2-switcher
code --install-extension CoenraadS.bracket-pair-colorizer
code --install-extension eamodio.gitlens
code --install-extension sibiraj-s.vscode-scss-formatter
```

## Angular Cli
From the command prompt, run the following command to install angular cli with the specific version we used for this demo
```
npm install -g @angular/cli@7.3.5
```