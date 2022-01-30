# Firemyna

Firemyna speeds ups Firebase applications development by providing a solid foundation without locking into any particular framework.

## Why?

🏎️ **Quickstart** working on a project with sane defaults.

🤝 **Share code** between the web application and backend.

⚡️ **Lightning-fast** development server enabled by [esbuild](https://esbuild.github.io/).

🌈 **Universal** - bring your own framework or use built-in presets for Next.js (coming soon) [Astro](./examples/astro#readme), [Create React App](./examples/create-react-app#readme), or [Vite](./examples/vite#readme).

## Installation

The library is available as an npm package published at the npm registry. To install firemyna run:

```sh
npm install firemyna --save
# Or using Yarn:
yarn add firemyna
```

# Usage

<!-- usage -->

```sh-session
$ npm install -g firemyna
$ firemyna COMMAND
running command...
$ firemyna (-v|--version|version)
firemyna/0.6.1 linux-x64 node-v14.18.0
$ firemyna --help [COMMAND]
USAGE
  $ firemyna COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`firemyna build [FILE]`](#firemyna-build-file)
- [`firemyna help [COMMAND]`](#firemyna-help-command)
- [`firemyna init`](#firemyna-init)
- [`firemyna start [FILE]`](#firemyna-start-file)

## `firemyna build [FILE]`

describe the command here

```
USAGE
  $ firemyna build [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src/commands/build.ts](https://github.com/firemyna/firemyna/blob/v0.6.1/src/commands/build.ts)_

## `firemyna help [COMMAND]`

display help for firemyna

```
USAGE
  $ firemyna help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.4/src/commands/help.ts)_

## `firemyna init`

Init Firemyna project

```
USAGE
  $ firemyna init

OPTIONS
  -f, --format=(ts|js)           Source format to generate code
  -m, --module=(esm|cjs)         [default: esm] Module format to use when generating code
  -p, --preset=(astro|cra|vite)  (required) Preset to use
  --cwd=cwd                      [default: /home/koss/src/kossnocorp/firemyna] Current working directory
```

_See code: [src/commands/init.ts](https://github.com/firemyna/firemyna/blob/v0.6.1/src/commands/init.ts)_

## `firemyna start [FILE]`

describe the command here

```
USAGE
  $ firemyna start [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src/commands/start.ts](https://github.com/firemyna/firemyna/blob/v0.6.1/src/commands/start.ts)_

<!-- commandsstop -->
