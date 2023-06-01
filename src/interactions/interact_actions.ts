/**
 * This script can be used to interact with the Actions contracts, after deploying them.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ npm run interact:actions`.
 */
import { Field, Mina, PrivateKey, fetchAccount } from 'snarkyjs';
import fs from 'fs/promises';
import { LotsOfActions1, LotsOfActions2, /*HugeActions*/ } from '../Actions.js';

// check command line arg
let alias = process.argv[2];
if (!alias)
  throw Error(`Missing <deployAlias> argument.

Example:
npm run interact:actions
`);
Error.stackTraceLimit = 1000;

// parse config and private key from file
type Config = {
  deployAliases: Record<string, { url: string; keyPath: string }>;
};
let configJson: Config = JSON.parse(await fs.readFile('config.json', 'utf8'));
let config = configJson.deployAliases[alias];
let key: { privateKey: string } = JSON.parse(
  await fs.readFile(config.keyPath, 'utf8')
);

// set up Mina instance and contract we interact with
const Network = Mina.Network(config.url);
Mina.setActiveInstance(Network);
let zkAppKey = PrivateKey.fromBase58(key.privateKey);
let zkAppAddress = zkAppKey.toPublicKey();
let zkApp1 = new LotsOfActions1(zkAppAddress);

// feePayer of transaction
let feePayer: { privateKey: string } = JSON.parse(
  await fs.readFile(configJson.deployAliases['fee_payer'].keyPath, 'utf-8')
);
let feePayerKey = PrivateKey.fromBase58(feePayer.privateKey);
let feePayerAddress = feePayerKey.toPublicKey();

let info = await fetchAccount({ publicKey: zkAppAddress });

// compile the contract to create prover keys
console.log('compiling original contract...');
console.time('compile');
let { verificationKey: oldVK } = await LotsOfActions1.compile();
console.timeEnd('compile');

let vk1 = info.account?.zkapp?.verificationKey;
console.assert(oldVK === vk1);
console.log('vk1:', vk1?.hash.toString());

console.log('building transaction...');
console.time('transaction');
let tx1 = await Mina.transaction({ sender: feePayerAddress, fee: 0.1e9 }, () => {
  zkApp1.dispatchLotsOfActions(Field(2));
});
console.timeEnd('transaction');

console.log('proving...');
console.time('proof');
await tx1.prove();
console.timeEnd('proof');

console.time('send');
let sentTx1 = await tx1.sign([feePayerKey, zkAppKey]).send();
console.timeEnd('send');

// first transaction should be successful
console.assert(sentTx1.hash() !== undefined, 'tx1 hash undefined');
console.log('tx1 hash:', sentTx1.hash());

if (sentTx1.hash() !== undefined) {
  console.log(`
Success! Update transaction sent.

Your smart contract state will be updated
as soon as the transaction is included in a block:
https://berkeley.minaexplorer.com/transaction/${sentTx1.hash()}
`);
}

/**
 * update verification key
 */

console.log('compiling new contract...');
console.time('compile');
let { verificationKey: vk2 } = await LotsOfActions2.compile();
console.timeEnd('compile');

console.log('sending transaction...');
console.time('transaction');
let tx2 = await Mina.transaction(zkAppAddress, () => {
  zkApp1.account.verificationKey.set(vk2);
});
console.timeEnd('transaction');

console.log('proving...');
console.time('proof');
await tx2.prove();
console.timeEnd('proof');

console.log('signing...');
console.time('sign');
let sentTx2 = await tx2.sign([zkAppKey]).send();
console.timeEnd('sign');

let newVK = Mina.getAccount(zkAppAddress).zkapp?.verificationKey;
console.log('new vk:', newVK?.hash?.toString());

console.assert(sentTx2.hash() === undefined, 'tx2 hash undefined');
