/**
 * This script can be used to interact with the Transfer contract, after deploying it.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ npm run interact:on-chain`.
 */
import { Mina, PublicKey, fetchAccount } from 'snarkyjs';
import fs from 'fs/promises';

Error.stackTraceLimit = 1000;

// set up Mina instance
const Network = Mina.Network('https://proxy.berkeley.minaexplorer.com/graphql');
Mina.setActiveInstance(Network);

type Config = {
  deployAliases: Record<string, { url: string; keyPath: string }>;
};

// get public key from config file
async function getPublicKey(deployAlias: string): Promise<PublicKey> {
  let configJson: Config = JSON.parse(await fs.readFile('config.json', 'utf8'));
  let { publicKey } = JSON.parse(
    await fs.readFile(configJson.deployAliases[deployAlias].keyPath, 'utf8')
  );
  return PublicKey.fromBase58(publicKey);
}

// fetch zkApp
async function displayZkApp(deployAlias: string) {
  let publicKey = await getPublicKey(deployAlias);
  let { account } = await fetchAccount({ publicKey });
  let zkApp = account?.zkapp;
  console.log(`\n=== ${deployAlias} ===`);
  console.log(
    'app state:    ',
    zkApp?.appState.map((f) => f.toString())
  );
  console.log(
    'action state: ',
    zkApp?.actionState.map((f) => f.toString())
  );
  console.log('zkapp uri:    ', zkApp?.zkappUri);
  console.log('zkapp version:', zkApp?.zkappVersion.toString());
}

// display zkApp data
await displayZkApp('actions');
await displayZkApp('circular');
await displayZkApp('hidden');
await displayZkApp('transfer');
await displayZkApp('vars');
