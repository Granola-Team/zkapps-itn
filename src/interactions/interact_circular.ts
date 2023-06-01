/**
 * This script can be used to interact with the Circular contract, after deploying them.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ npm run interact:circular`.
 */
import { Mina, PrivateKey } from 'snarkyjs';
import fs from 'fs/promises';
import { Circular } from '../Circular.js';

// check command line arg
let deployAlias = process.argv[2];
if (!deployAlias)
  throw Error(`Missing <network> argument.

Usage:
npm run interact:circular
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
let zkApp = new Circular(zkAppAddress);

// feePayer of transaction
let feePayer: { privateKey: string } = JSON.parse(
  await fs.readFile(configJson.deployAliases['fee_payer'].keyPath, 'utf-8')
);
let feePayerKey = PrivateKey.fromBase58(feePayer.privateKey);
let feePayerAddress = feePayerKey.toPublicKey();

console.log('compile the contract...');
console.time('compile');
let {
  verificationKey: vk,
  verify: _verify,
  provers,
} = await Circular.compile();
console.timeEnd('compile');

console.log('vk:', vk.hash.toString());
console.log(
  'Provers:',
  provers.map((p) => p.toString())
);

console.log('building transaction...');
console.time('transaction');
let tx = await Mina.transaction({ sender: feePayerAddress, fee: 0.1e9 }, () => {
  zkApp.method1();
});
console.timeEnd('transaction');

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

console.log('building transaction...');
console.time('transaction');
let tx2 = await Mina.transaction(
  { sender: feePayerAddress, fee: 0.1e9 },
  () => {
    zkApp.recursiveGetAndSet();
  }
);
console.timeEnd('transaction');

console.time('proof');
await tx2.prove();
console.timeEnd('proof');

console.log('signing...');
console.time('sign');
let sentTx2 = await tx2.sign([zkAppKey]).send();
console.timeEnd('sign');

if (sentTx.hash() !== undefined) {
  console.log(`
Success! Update transaction sent.

Your smart contract state will be updated
as soon as the transaction is included in a block:
https://berkeley.minaexplorer.com/transaction/${sentTx2.hash()}
`);
} else {
  console.log('tx2 failed');
}
