/**
 * This script can be used to interact with the Actions contracts, after deploying them.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ npm run interact:update`
 */
import { Field, Mina, Poseidon, PrivateKey, fetchAccount } from 'snarkyjs';
import fs from 'fs/promises';
import { LotsOfActions1, LotsOfActions2 } from '../Actions.js';

// check command line arg
let deployAlias = process.argv[2];
if (!deployAlias)
  throw Error(`Missing <deployAlias> argument.

Example:
npm run interact:update
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
let zkApp = new LotsOfActions1(zkAppAddress);

// feePayer of transaction
let feePayer: { privateKey: string } = JSON.parse(
  await fs.readFile(configJson.deployAliases['fee_payer'].keyPath, 'utf-8')
);
let feePayerKey = PrivateKey.fromBase58(feePayer.privateKey);
let feePayerAddress = feePayerKey.toPublicKey();

// compile the contract to create prover keys
console.log('compiling original contract...');
console.time('compile');
let { verificationKey: vk1 } = await LotsOfActions1.compile();
console.timeEnd('compile');

let info = await fetchAccount({ publicKey: zkAppAddress });

let oldVK = info.account?.zkapp?.verificationKey;
console.assert(oldVK?.hash.equals(vk1?.hash), 'Verification keys do not match');
console.log('on-chain vk hash:  ', oldVK?.hash.toString());
console.log('calculated vk hash:', vk1?.hash.toString());

/**
 * update verification key
 */

console.log('compiling new contract...');
console.time('compile');
let { verificationKey: vk2 } = await LotsOfActions2.compile();
console.timeEnd('compile');

console.log('sending transaction...');
console.time('transaction');
let tx = await Mina.transaction({ sender: feePayerAddress, fee: 1e9 }, () => {
  zkApp.account.verificationKey.set(vk2);
  zkApp.account.delegate.set(feePayerAddress);
  zkApp.account.zkappUri.set('bogus uri');
});
console.timeEnd('transaction');

console.log('proving...');
console.time('proof');
await tx.prove();
console.timeEnd('proof');

console.log('signing...');
console.time('sign');
let sentTx = await tx.sign([feePayerKey, zkAppKey]).send();
console.timeEnd('sign');

let currVK = Mina.getAccount(zkAppAddress).zkapp?.verificationKey;
console.log('new vk: ', vk2?.hash?.toString());
console.log('curr vk:', currVK?.hash?.toString());

console.assert(sentTx.hash() !== undefined, 'tx hash is undefined');
