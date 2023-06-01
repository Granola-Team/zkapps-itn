import { Circular } from './Circular';
import { Mina, PrivateKey, PublicKey, AccountUpdate } from 'snarkyjs';

let proofsEnabled = false;

describe('Circular', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    account1: PublicKey,
    key1: PrivateKey,
    account2: PublicKey,
    key2: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Circular;

  beforeAll(async () => {
    if (proofsEnabled) await Circular.compile();
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: key1, publicKey: account1 } = Local.testAccounts[1]);
    ({ privateKey: key2, publicKey: account2 } = Local.testAccounts[2]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Circular(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('fails on infinitely recursive method call', async () => {
    await localDeploy();

    const txn = await Mina.transaction(account1, () => {
      zkApp.recursiveGetAndSet();
    });
    await txn.prove();
    await txn.sign([key1]).send();
  });
});
