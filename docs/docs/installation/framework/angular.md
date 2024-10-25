# Angular

## Create an Angular Project

To set up a new Angular project, use the Angular CLI:

```sh
ng new remult-angular
cd remult-angular
```

## Install Remult

Install the latest version of Remult in your Angular project:

```bash
npm install remult@latest
```

## Proxy API Requests from Angular DevServer to the API Server

In development, your Angular app will be served from `http://localhost:4200`, while the API server will run on `http://localhost:3002`. To allow the Angular app to communicate with the API server during development, you can use Angular's [proxy](https://angular.io/guide/build#proxying-to-a-backend-server) feature.

1. Create a file named `proxy.conf.json` in the root folder of your project with the following content:

```json
// proxy.conf.json

{
  "/api": {
    "target": "http://localhost:3002",
    "secure": false
  }
}
```

This configuration redirects all API calls from the Angular dev server to the API server running at `http://localhost:3002`.

## Adjust the `package.json`

Modify the `package.json` to use the newly created proxy configuration when serving the Angular app:

```json
// package.json

"dev": "ng serve --proxy-config proxy.conf.json --open",
```

Running the `dev` script will start the Angular dev server with the proxy configuration enabled.

## Configure a Server

Now that the app is set up, [Select an API Server](../server/)
