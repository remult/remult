## review
1. Write the code once, and both the `backend` and `frontend` use the same code.

## Setup for the Tutorial
1. Clone the repository
2. **review** setup steps and focus on `index.ts` for the  er:
3. code .
4. start server from ui

## Entities
1. create `task.ts` **LOWERCASE!!**
2. create Task class with title field.
3. Add `@Entity` decorator
4. extend `IdEntity`
5. add `@Field` decorator
6. import in `server/index.ts`
7. **Show that an api endpoint was created**.

## Create new task
1. add constructor with `remult`
2. add `taskRepo`
3. add `newTask`
4. add `createNewTask` method
5. In the `html` add a `div` with the input.
6. create a few tasks 
7. show the rows in the api end point
8. **explain tha json db**

## Display the list of tasks
1. add tasks array, and load tasks.
2. add `ngOnInit` to call the load tasks.
3. add ul
4. add `loadTasks` to createNewTasks **explain that we're calling the load tasks, to verify that the task was added on the server** 

## Delete tasks

## Making the task titles editable
1. add the input
2. add the button and remember the `[disabled]` property

## Mark tasks as completed
1. add the completed field
2. add the checkbox
3. **remember the `[style.TextDecoration]` and `line-through`**

## Sorting and Filtering
### Show uncompleted tasks first
### Hide completed tasks
### Optionally hide completed tasks
1. label `for`



## Validation
1. required
2. demo server side validation using curl

## Backend methods
1. create `setAll` method
2. use iterate

## Authentication and Authorization
1. restrict crud and server method to `Allow.authenticated`
2. Hide UI, and add not signed in text.
3. restrict `loadTasks` 
4. setup
5. review `server.auth`

## Sign In
1. **Add `auth` to the constructor**
2. add `username`, `signIn` and `signOut`

## Role-based authorization
1. add `roles.ts` **LOWERCASE!!!!!**
2. restrict insert and `update`
3. restrict update of `title`.
4. restring Backend method
5. Add role to Jane