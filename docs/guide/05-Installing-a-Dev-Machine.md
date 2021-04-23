# Installing a Dev Machine
These are the softwares we'll use for the local development environment

## Node js
Node.js is an open-source, cross-platform JavaScript runtime environment for executing JavaScript code server-side.

Install it from: [https://nodejs.org/en/](https://nodejs.org/en/)

(For this demo we've used version 10.16.3 LTS)

## Git Source Control
Git is the most widely used source control and versioning tool. 
Download and install it from:
[https://git-scm.com/download/win](https://git-scm.com/download/win)


## Visual Studio Code 
A source code editor which we use to develop application.

Install it from: [https://code.visualstudio.com/](https://code.visualstudio.com/)

#### Visual Studio Extensions
To install the following recommended extensions, open a command prompt and run the following commands:
```sh
code --install-extension Angular.ng-template
code --install-extension infinity1207.angular2-switcher
code --install-extension CoenraadS.bracket-pair-colorizer
code --install-extension eamodio.gitlens
code --install-extension sibiraj-s.vscode-scss-formatter
```

## Angular Cli
From the command prompt, run the following command to install angular cli with the specific version we used for this demo
```sh
npm install -g @angular/cli@11.2.10
```