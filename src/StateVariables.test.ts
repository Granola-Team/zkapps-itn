import { StateVariables } from './StateVariables';
import {
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Reducer,
  Field,
} from 'snarkyjs';

let proofsEnabled = false;

describe('Actions', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    account1: PublicKey,
    key1: PrivateKey,
    account2: PublicKey,
    key2: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: StateVariables;

  beforeAll(async () => {
    if (proofsEnabled) await StateVariables.compile();
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
    zkApp = new StateVariables(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('successfully gets and sets state variable a ton', async () => {
    await localDeploy();

    const txn1 = await Mina.transaction(account1, () => {
      zkApp.getAndSetTons();
    });
    await txn1.prove();
    await txn1.sign([key1]).send();
  });
});
