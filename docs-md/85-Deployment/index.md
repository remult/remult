This application is a standard node js application, that uses postgres as a database and can be deployed to any web server or cloud service that has node js and postgres.

In this tutorial we'll use heroku as they provide a great free plan that and very easy deployment.

## Step 1 Create an Heroku User and install their tools

Goto, [heroku's signup page](https://signup.heroku.com/) signup and create a user.

The heroku free plan provides for 550 free web server hours (they call it dyno) per month. You can increase that to 1000 hours by just adding your credit card info (no cost)

Next, download and install the [heroku command line tool](https://devcenter.heroku.com/articles/heroku-cli#download-and-install)

After that, goto the command line and run 
```
heroku login
```

And enter your credentials.

## Step 2 Create the Heroku Application

In the Command line, in the project folder, we can use the `apps:create` command to create our project.
1. We can send it the region we want to use (by default it's us, for europe and middleeast we recommend europe: `--region eu`)
2. Specify the name of the project, (`my-project` in our case) - that name will be used as the prefix for your application's url (`https://my-project.herokuapp.com` on our case). 
The name you want may be taken - so keep trying names until you reach a name that is free, or run the command without a name, and `heroku` will generate a name for you.

Here's the command with the specific name `my-project` in the `eu` region
```
heroku apps:create --region eu  my-project
```
> If you want to allow heroku to determine a random name, simply do not include a name and heroku will determine a random name for you.

Here's the result we got, when we allowed heroku to determine the name :)
```
Creating app... done, ⬢ desolate-fjord-53965, region is eu
https://desolate-fjord-53965.herokuapp.com/ | https://git.heroku.com/desolate-fjord-53965.git
```
1. The first part of the result is our website url - once we'll install the app, we can navigate there.
2. The second part of the result is the url for the git repository.

## Step 3 Provision the database on Heroku
run:
```
heroku addons:create heroku-postgresql:hobby-dev
```
## Step 4 Set the Authentication token sign key
The **Authentication token sign key**, is used to authenticate the user that uses the application. It's a secret key, that only the server should know and is used to decrypt information about the user, assuring that it is indeed the correct user.

It's important to set this value to some random crazy value that no one will have. A hacker with this key, will be able to impersonate anyone on your web site.

To read more about it, see [jwt](https://jwt.io/)

This key is required, so set it using:
```
heroku config:set TOKEN_SIGN_KEY=woEczJuvjuOWmIakjdvH
```

## Step 5 Deploy the application using git
```
git push heroku master -f
```

* This will take a few minutes, and will report the process of deploying the app to heroku
* You'll need to repeat this command whenever you want to update the code of your application.



## And We're done
Just run:
```
heroku apps:open
```
 It'll open browser with your application. You'll see the url provided to you in step 2 of this page  (`https://desolate-fjord-53965.herokuapp.com/` in our case).

Don't forget to sign in and declare yourself the admin :)

## Doing it all with a user interface
Heroku has a web user interface to setup your app, define the db and set the config vars, you may find it easier to use.

