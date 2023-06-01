/**
 * This script can be used to interact with the Transfer contract, after deploying it.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ npm run interact:network`.
 */
import { Mina } from 'snarkyjs';

Error.stackTraceLimit = 1000;

// set up Mina instance
const Network = Mina.Network('https://proxy.berkeley.minaexplorer.com/graphql');
Mina.setActiveInstance(Network);

// get network state info
let {
  snarkedLedgerHash,
  blockchainLength,
  minWindowDensity,
  totalCurrency,
  globalSlotSinceGenesis,
  stakingEpochData,
  nextEpochData,
} = Mina.getNetworkState();

console.log('snarkedLedgerHash:     ', snarkedLedgerHash.toString());
console.log('blockchainLength:      ', blockchainLength.toString());
console.log('minWindowDensity:      ', minWindowDensity.toString());
console.log('totalCurrency:         ', totalCurrency.toString());
console.log('globalSlotSinceGenesis:', globalSlotSinceGenesis.toString());

console.log('\n=== Staking epoch ledger ===');
console.log('epoch length:    ', stakingEpochData.epochLength.toString());
console.log('start checkpoint:', stakingEpochData.startCheckpoint.toString());
console.log('lock checkpoint: ', stakingEpochData.lockCheckpoint.toString());
console.log('seed:            ', stakingEpochData.seed.toString());
console.log('ledger hash:     ', stakingEpochData.ledger.hash.toString());
console.log(
  'total currency:  ',
  stakingEpochData.ledger.totalCurrency.toString()
);

console.log('\n=== Next epoch ledger ===');
console.log('epoch length:    ', nextEpochData.epochLength.toString());
console.log('start checkpoint:', nextEpochData.startCheckpoint.toString());
console.log('lock checkpoint: ', nextEpochData.lockCheckpoint.toString());
console.log('seed:            ', nextEpochData.seed.toString());
console.log('ledger hash:     ', nextEpochData.ledger.hash.toString());
console.log('total currency:  ', nextEpochData.ledger.totalCurrency.toString());
