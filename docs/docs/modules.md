# Module Driven Development

# DRAFT! IDEATION!

We belive in Module Driven Development (`MDD` 😎), let us explain what it is and how it works.

It would be great to be able to share modules between projects at the same time, you always need to customize the code for your project... So it's challenging to distribute modules in the same way we do with npm packages.

That's why we have this `module` concept in remult.

You have 2 sort of modules:

- packaged modules: these are modules that are published on npm and can be installed like any other npm package.
- local modules: these are modules that are not published on npm that you can "clone" from a github repository and use in your project.

## Packaged modules

// TODO: give an example ?

### Benefits

- You can start quickly and tune to your needs

## Local modules

```bash
# npx degit [github-org]/[github-project]/[path-to-the-module]

# example
npx degit remult/official-modules/media
```

As you see, a modules can be any folder in a github repository!

### Benefits

- You can fully customize the code for your project (`allowApiRead: Allow.authenticated` for example!)
- You can share entities, controllers, and even ui components between projects
- You can develop and share modules with the community

## File structure

Basicly, a module is a folder with the following structure:

```
modules
  [MODULE_NAME]
    README.md           // the module documentation (deps, how to use, etc...)
    index.ts            // @entity or any other code that can go to the client
    server
      index.ts          // the module definition
```
