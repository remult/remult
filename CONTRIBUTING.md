# Contributing to Remult

Contributions are welcome.

Before contributing please read the [code of conduct](https://github.com/remult/remult/blob/master/CODE_OF_CONDUCT.md) and search the [issue tracker](https://github.com/remult/remult/issues) to find out if your issue has already been discussed before.

To contribute, [fork this repository](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo/), commit your changes, and [send a pull request](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests).

## How to ?

A good way to start is installing everything and running tests.

```bash
npm i
npm run build
npm run test
```

### Focus on a specific area ?

```bash
# Run only test for graphql for example
npm run test projects/tests/graphql.spec.ts
```

### For servers tests

```bash
# in one terminal (to stay in watch mode for build and tests)
npm run build-watch

# in a second terminal (run only sveltekit tests in watch mode)
npm run test projects/tests/backend-tests/test-sveltekit-server.spec.ts

# in a third terminal (run only sveltekit build)
npm run test-servers:sveltekit:setup
```
