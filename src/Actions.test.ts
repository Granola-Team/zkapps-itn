import { LotsOfActions1, LotsOfActions2, HugeActions, Huge, randomHuge } from './Actions';
import { Mina, PrivateKey, PublicKey, AccountUpdate, Reducer, Field } from 'snarkyjs';

let proofsEnabled = false;

describe('Lots of Actions', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    account1: PublicKey,
    key1: PrivateKey,
    account2: PublicKey,
    key2: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: LotsOfActions1;

  beforeAll(async () => {
    if (proofsEnabled) await LotsOfActions1.compile();
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: key1, publicKey: account1 } =
      Local.testAccounts[1]);
    ({ privateKey: key2, publicKey: account2 } =
      Local.testAccounts[2]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new LotsOfActions1(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('successfully reduces actions', async () => {
    await localDeploy();

    let actions0 = zkApp.reducer.getActions();
    expect(actions0).toEqual([]);

    const txn1 = await Mina.transaction(account1, () => {
      zkApp.dispatchLotsOfActions(Field(1));
    });
    await txn1.prove();
    await txn1.sign([key1]).send();

    let actions1 = zkApp.reducer.getActions();
    expect(actions1.length).toEqual(1);
    // console.log(actions0.map((fs) => fs.map((f) => f.toString())))

    const txn2 = await Mina.transaction(account2, () => {
      zkApp.dispatchLotsOfActions(Field(2));
    });
    await txn2.prove();
    await txn2.sign([key2]).send();

    let actions2 = zkApp.reducer.getActions();
    expect(actions2.length).toEqual(2);
    expect(actions2.at(0)).toEqual(actions1.at(0));
  
    let initialState = { state: Field(0), actionState: Reducer.initialActionState }
    let actions = zkApp.reducer.getActions();
    zkApp.reducer.reduce(
      actions,
      Field,
      (state: Field, action: Field) => state.add(action),
      initialState
    )

    let actions3 = zkApp.reducer.getActions();
    expect(actions3).toEqual(actions2);

    const txn3 = await Mina.transaction(account1, () => {
      zkApp.reducer.dispatch(Field(0));
    });
    await txn3.prove();
    await txn3.sign([key1, zkAppPrivateKey]).send();

    let actions4 = zkApp.reducer.getActions();
    expect(actions4).toEqual(actions3);
  });
});
