/**
 * This script can be used to interact with the HiddenFields contract, after deploying it.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ npm run interact:hidden`.
 */
import { Mina, PrivateKey } from 'snarkyjs';
import fs from 'fs/promises';
import { Hidden } from '../HiddenFields.js';

// check command line arg
let deployAlias = process.argv[2];
if (!deployAlias)
  throw Error(`Missing <network> argument.

Usage:
npm run interact:hidden
`);
Error.stackTraceLimit = 1000;

// parse config and private key from file
type Config = {
  deployAliases: Record<string, { url: string; keyPath: string }>;
};
let configJson: Config = JSON.parse(await fs.readFile('config.json', 'utf8'));
let config = configJson.deployAliases[deployAlias];
let key: { privateKey: string } = JSON.parse(
  await fs.readFile(config.keyPath, 'utf8')
);
let zkAppKey = PrivateKey.fromBase58(key.privateKey);

// set up Mina instance and contract we interact with
const Network = Mina.Network(config.url);
Mina.setActiveInstance(Network);
let zkAppAddress = zkAppKey.toPublicKey();
let zkApp = new Hidden(zkAppAddress);

// feePayer of transaction
let feePayer: { privateKey: string } = JSON.parse(
  await fs.readFile(configJson.deployAliases['fee_payer2'].keyPath, 'utf-8')
);
let feePayerKey = PrivateKey.fromBase58(feePayer.privateKey);
let feePayerAddress = feePayerKey.toPublicKey();

console.log('compiling the contract...');
await Hidden.compile();

console.log('building transaction...');
console.time('transaction');
let tx = await Mina.transaction({ sender: feePayerAddress, fee: 0.1e9 }, () => {
  console.log(zkApp.field.toString());
  zkApp.method();
});
console.timeEnd('transaction');

console.log('proving...');
console.time('proof');
await tx.prove();
console.timeEnd('proof');

console.log('signing...');
console.time('sign');
let sentTx = await tx.sign([zkAppKey]).send();
console.timeEnd('sign');

if (sentTx.hash() !== undefined) {
  console.log(`
Success! Update transaction sent.

Your smart contract state will be updated
as soon as the transaction is included in a block:
https://berkeley.minaexplorer.com/transaction/${sentTx.hash()}
`);
}
