# Never Say `never`

A TypeScript demo.

## Setup

It's easiest if you enter a `nix-shell` first. That will install a fairly recent version of node.js.

Next, run `yarn` to install dependencies.

Finally, source `.envrc` (or install `direnv`) to add the node.js dependency binaries to your PATH.

## Usage

Run the code as follows:

```
$ node index.js 1 -7 12
Solving for: 1x² + -7x + 12 = 0
Root 1: 4
Root 2: 3
```

Run the TypeScript like this:

```
$ ts-node index.ts 2 9 9
Solving for: 2x² + 9x + 9 = 0
Root 1: -1.5
Root 2: -3
```
