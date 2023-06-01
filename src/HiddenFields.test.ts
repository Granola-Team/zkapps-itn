import { Hidden } from './HiddenFields';
import { Mina, PrivateKey, PublicKey, AccountUpdate } from 'snarkyjs';

let proofsEnabled = false;

describe('Hidden fields', () => {
  let deployer: PublicKey,
    deployerKey: PrivateKey,
    account1: PublicKey,
    key1: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Hidden;

  beforeAll(async () => {
    if (proofsEnabled) await Hidden.compile();
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    // deployer
    ({ privateKey: deployerKey, publicKey: deployer } = Local.testAccounts[0]);
    // account1
    ({ privateKey: key1, publicKey: account1 } = Local.testAccounts[1]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Hidden(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployer, () => {
      AccountUpdate.fundNewAccount(deployer);
      zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('fails on infinitely recursive method call', async () => {
    await localDeploy();

    const txn = await Mina.transaction(account1, () => {
      zkApp.method();
    });
    await txn.prove();
    await txn.sign([key1]).send();

    console.log(zkApp.num.get().toJSON());
  });
});
