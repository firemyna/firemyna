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

- [`firemyna help [COMMAND]`](#firemyna-help-command)
- [`firemyna init [FILE]`](#firemyna-init-file)

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

## `firemyna init [FILE]`

describe the command here

```
USAGE
  $ firemyna init [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ firemyna hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/init.ts](https://github.com/firemyna/firemyna/blob/v0.6.1/src/commands/init.ts)_

<!-- commandsstop -->
