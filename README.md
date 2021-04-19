cfnctl-node
===========

CLI for deploying and managing AWS Cloudformation templates.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/cfnctl-node.svg)](https://npmjs.org/package/cfnctl-node)
[![Downloads/week](https://img.shields.io/npm/dw/cfnctl-node.svg)](https://npmjs.org/package/cfnctl-node)
[![License](https://img.shields.io/npm/l/cfnctl-node.svg)](https://github.com/ncronquist/cfnctl-node/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g cfnctl-node
$ cfnctl COMMAND
running command...
$ cfnctl (-v|--version|version)
cfnctl-node/0.0.0 linux-x64 node-v14.16.0
$ cfnctl --help [COMMAND]
USAGE
  $ cfnctl COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`cfnctl hello [FILE]`](#cfnctl-hello-file)
* [`cfnctl help [COMMAND]`](#cfnctl-help-command)

## `cfnctl hello [FILE]`

describe the command here

```
USAGE
  $ cfnctl hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ cfnctl hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/ncronquist/cfnctl-node/blob/v0.0.0/src/commands/hello.ts)_

## `cfnctl help [COMMAND]`

display help for cfnctl

```
USAGE
  $ cfnctl help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_
<!-- commandsstop -->
