# zkApps for ITN track 2

These smart contracts were crafted to black box test various features of [Mina Protocol](https://github.com/MinaProtocol/mina) zkApps.

## Install dependencies

These contracts were tested with `node v19.9.0` but should work with all node versions `>= 16`.

```sh
npm install
```

Make sure you now have the `zkapp-cli`

```sh
zk --version
```

## How to build

```sh
npm run build
```

## How to run tests

```sh
npm run test
npm run testw # watch mode
```

## How to run coverage

```sh
npm run coverage
```

## Deploying and interacting with contracts on chain

Create a deploy alias for the contract of interest

```sh
zk config
```

Follow the directions to create a deploy alias and fund the account. Or you can generate a keypair match the `keyPath` of a delpoy alias in `config.json`.

Deploy the contract

```sh
zk deploy <alias>
```

Each contract has an accompanying "interaction script" in `src/interactions`. In general, the pattern is

```sh
npm run interact:<alias>
```

Checkout `package.json` for more info or to modify the scripts.

## License

[Mozilla-2.0](LICENSE)
