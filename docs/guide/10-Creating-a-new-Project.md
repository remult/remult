# Creating a new Project

The first thing we'll do is let angular create the project using it's CLI.

## Create the Angular Project
Open a command prompt in a folder that'll be the parent of your new project (in my case I use `c:\repos\`) and run the following command, replacing `my-project` with the name of the project you want to use:
```sh
ng new --style=scss --routing=true --strict=false  my-project
```

## Install remult
Next go into the folder of your new project
```sh
cd my-project
```

And run the following command to install the `remult` framework starter kit. 
```sh
ng add @remult/angular@next
```

## open vs code in the `my-project` directory
In the command prompt type:
```
code .
```