# Running the development Environment
Now that we have our new project configured, we want to run it.

Open Visual Studio code in the folder of your project (`my-project` in our case).


## Understanding the different servers
When developing an angular application in a dev environment we'll need two servers,
1. Angular dev server - used by Angular for the front end development (the ui that'll run in the browser). This server will use port 4200
2. Node JS web server - is the Actual server, where all the data access will be and all the heavy lifting will be done. this server will use port 3000.

## Running the servers
We'll use visual studio tasks to run our common tasks. 

To run a visual studio task, we'll go to the menu `Terminal\Run Task...` and select the task we want to run.

Alternatively you can click <kbd>Control</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> to open visual studio's code `command pallet`
and select `Tasks:Run Task`
![](/2019-09-23_14h40_29.png)

And then the task you want to run.

### 1. Run the Node JS server - `npm:node-serve`
1. Go to menu `Terminal\Run Task..."
2. Select `npm:node-serve`

### 2. Run the Angular dev server `npm:ng-serve`
1. Go to menu `Terminal\Run Task..."
2. Select `npm:ng-serve`

**Great, now we can start**
Once both tasks settle down you should see at the bottom of your screen the output of both tasks:
![](/2019-10-06_12h04_03.png)

Simply open a browser with the url `http://localhost:4200` and you'll see your application running

![](/the-first-application-stage.png)


## A little more information
* the task `npm:node-serve` build the code that will run on the NodeJS server and runs it. 

  Whenever a code file changes, it'll automatically rebuild the project and restart it.

* The task `npm:ng-serve` runs the angular dev server, after it completes, you can open a browser using the `http://localhost:4200` url.

  Whenever a code file changes, it'll automatically refresh the browser to reflect that change.

  To read more about this see the [Architecture page](architecture)