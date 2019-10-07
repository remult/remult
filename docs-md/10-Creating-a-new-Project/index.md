The first thing we'll do is let angular create the project using it's CLI.

## Create the Angular Project
Open a command prompt in a folder that'll be the parent of your new project (in my case I use `c:\repos\`) and run the following command, replacing `my-project` with the name of the project you want to use:
```
ng new --style=scss --routing=true  my-project
```

## Install radweb
Next go into the folder of your new project
```
cd my-project
```

And run the following command to install the `radweb` framework starter kit. 
```
ng add radweb@pre-alpha
```
You'll be prompted to chose a prebuilt theme for the material design, choose one and continue

## Commit to Git
In the command prompt run:
```
git add .
git commit -m "install radweb"
```

## Change the password for the postgres connection.
If you did not use the default password we've used (MASTERKEY), then you can change the postgres password, in the `.env` file,
just replace the word (MASTERKEY) with the password you've chosen for the postgres database.

Don't worry, your password is safe, the `.env` file exists only locally on your dev machine and is never sent anywhere.

## open vs code in the `my-project` directory
In the command prompt type:
```
code .
```