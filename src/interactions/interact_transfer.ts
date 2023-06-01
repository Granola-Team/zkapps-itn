/**
 * This script can be used to interact with the Transfer contract, after deploying it.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ npm run interact:transfer`.
 */
import { Mina, PrivateKey, UInt32, UInt64, fetchAccount } from 'snarkyjs';
import fs from 'fs/promises';
import { Transfer } from '../Transfer.js';

// check command line arg
let deployAlias = process.argv[2];
if (!deployAlias)
  throw Error(`Missing <deployAlias> argument.

Usage:
npm run interact:transfer
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
let zkApp = new Transfer(zkAppAddress);

// feePayer of transaction
let feePayer: { privateKey: string } = JSON.parse(
  await fs.readFile(configJson.deployAliases['fee_payer2'].keyPath, 'utf-8')
);
let feePayerKey = PrivateKey.fromBase58(feePayer.privateKey);
let feePayerAddress = feePayerKey.toPublicKey();

// compile the contract to create prover keys
console.log('compiling the contract...');
console.time('compile');
await Transfer.compile();
console.timeEnd('compile');

// fetch fee payer account and check nonce
let { account: feePayerAccount } = await fetchAccount({
  publicKey: feePayerAddress,
});
console.log(
  'fee payer nonce first transaction:',
  feePayerAccount?.nonce.toString()
);

// valid transfer
console.log('building transaction...');
console.time('transaction');
let tx1 = await Mina.transaction(
  { sender: feePayerAddress, fee: 0.1e9 },
  () => {
    zkApp.validTransfer(UInt64.one);
  }
);
console.timeEnd('transaction');

console.log('proving...');
console.time('proof');
await tx1.prove();
console.timeEnd('proof');

console.log('signing...');
console.time('sign');
let sentTx1 = await tx1.sign([feePayerKey, zkAppKey]).send();
console.timeEnd('sign');

if (sentTx1.hash() !== undefined) {
  console.log(`
Success! Transaction sent.

Your smart contract state will be updated
as soon as the transaction is included in a block:
https://berkeley.minaexplorer.com/transaction/${sentTx1.hash()}
`);
}

function wellDefine(n: UInt32 | undefined) {
  if (n === undefined) {
    return UInt32.zero;
  } else {
    return n;
  }
}

// invalid transfer
let nonce = 0;
while (
  UInt32.from(nonce)
    .lessThanOrEqual(wellDefine(feePayerAccount?.nonce))
    .toBoolean()
) {
  nonce += 1;
}
console.log('fee payer nonce second transaction:', nonce.toString());

console.log('building transaction...');
console.time('transaction');
let tx2 = await Mina.transaction(
  { sender: feePayerAddress, fee: 0.1e9, nonce },
  () => {
    let balance = Mina.getBalance(feePayerAddress);
    console.log("sender's balance:", balance.toString());
    zkApp.invalidTransfer(balance);
  }
);
console.timeEnd('transaction');

console.log('proving...');
console.time('proof');
let proofs = await tx2.prove();
console.timeEnd('proof');

console.log(
  'proofs',
  proofs.map((proof) => proof?.toJSON())
);

console.log('signing...');
console.time('sign');
let sentTx2 = await tx2.sign([feePayerKey, zkAppKey]).send();
console.timeEnd('sign');

console.assert(sentTx2.hash() === undefined, 'tx2 should fail');
