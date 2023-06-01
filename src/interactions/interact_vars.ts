/**
 * This script can be used to interact with the HiddenFields contract, after deploying it.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ npm run interact:vars`.
 */
import { Mina, PrivateKey, fetchAccount } from 'snarkyjs';
import fs from 'fs/promises';
import { StateVariables } from '../StateVariables.js';

// check command line arg
let deployAlias = process.argv[2];
if (!deployAlias)
  throw Error(`Missing <deployAlias> argument.

Usage:
node build/src//interactions/interact_vars.js <deployAlias>
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

// set up Mina instance and contract we interact with
const Network = Mina.Network(config.url);
Mina.setActiveInstance(Network);
let zkAppKey = PrivateKey.fromBase58(key.privateKey);
let zkAppAddress = zkAppKey.toPublicKey();
let zkApp = new StateVariables(zkAppAddress);

await fetchAccount({ publicKey: zkAppAddress });
let num0 = zkApp.num.get();
console.log('initial num =', num0.toString());

// feePayer of transaction
let feePayer: { privateKey: string } = JSON.parse(
  await fs.readFile(configJson.deployAliases['fee_payer'].keyPath, 'utf-8')
);
let feePayerKey = PrivateKey.fromBase58(feePayer.privateKey);
let feePayerAddress = feePayerKey.toPublicKey();

console.log('compiling the contract...');
console.time('compile');
await StateVariables.compile();
console.timeEnd('compile');

console.log('building transaction...');
console.time('transaction');
let tx = await Mina.transaction({ sender: feePayerAddress, fee: 0.1e9 }, () => {
  zkApp.getAndSetTons();
});
console.timeEnd('transaction');

console.log('proving...');
console.time('proof');
await tx.prove();
console.timeEnd('proof');

console.log('sending transaction...');
let sentTx = await tx.sign([feePayerKey, zkAppKey]).send();

let num = zkApp.num.get();
console.log('final num =', num.toString());

if (sentTx.hash() !== undefined) {
  console.log(`
Success! Update transaction sent.

Your smart contract state will be updated
as soon as the transaction is included in a block:
https://berkeley.minaexplorer.com/transaction/${sentTx.hash()}
`);
}
