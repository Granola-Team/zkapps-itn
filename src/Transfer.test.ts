import { Transfer } from './Transfer';
import { Mina, PrivateKey, PublicKey, AccountUpdate, UInt64 } from 'snarkyjs';

let proofsEnabled = false;

describe('Transfer', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    account1: PublicKey,
    key1: PrivateKey,
    account2: PublicKey,
    key2: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Transfer;

  beforeAll(async () => {
    if (proofsEnabled) await Transfer.compile();
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
    zkApp = new Transfer(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  // valid transfer
  it('proves and applies valid transfer', async () => {
    await localDeploy();

    const beforeAccount = Mina.getAccount(account1);
    const beforeNonce = beforeAccount.nonce;
    const balance = beforeAccount.balance;

    const txn1 = await Mina.transaction(account1, () => {
      zkApp.validTransfer(balance);
    });
    await txn1.prove();
    let sendRes = await txn1.sign([key1]).send();

    const afterAccount = Mina.getAccount(account1);
    expect(afterAccount.balance).toEqual(UInt64.zero);
    expect(afterAccount.nonce).toEqual(beforeNonce.add(1));
    expect(sendRes.isSuccess).toEqual(true);
  });

  // invalid transfer
  it('fails to do invalid transfer', async () => {
    await localDeploy();

    const txn2 = await Mina.transaction(account2, () => {
      const balance = Mina.getAccount(account2).balance;
      zkApp.invalidTransfer(balance);
    });
    await txn2.prove();
    let sendRes = txn2.sign([key2]).send();
    sendRes.catch((_) => console.log('Invalid transaction rejected!'));
  });
});
