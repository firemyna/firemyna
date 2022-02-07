# Contributing

To get started working on the project, clone the repo and run `npm install`:

```bash
git clone https://github.com/kossnocorp/firemyna.git
cd firemyna
npm intall
```

## Running test

Firemyna uses [Jest](https://jestjs.io/) to run the tests. Use `npm test` to
run the tests:

```bash
# Run all tests:
npm test
# Or in watch mode:
npm test -- --watch
```

## Testing commands

To run one of the CLI commands, use `./bin/dev`:

```bash
# Execute the init command:
./bin/dev init
```

All Firemyna commands allows to pass `cwd` argument which is helpful when
testing commands on a specific directory:

```bash
# Run the init command on examples/vanilla directory:
./bin/dev init --cwd ./examples/vanilla
```
