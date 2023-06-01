import {
  Field,
  SmartContract,
  state,
  State,
  method,
  AccountUpdate,
  Permissions,
  UInt64,
} from 'snarkyjs';

export class Transfer extends SmartContract {
  @state(Field) num = State<Field>();

  init() {
    super.init();
    this.account.permissions.set(Permissions.default());
    this.num.set(Field(1));
  }

  /**
   * Valid transfer, send <= sender's balance
   */
  @method validTransfer(balance: UInt64) {
    // amount <= balance
    const amount = balance;
    const update = AccountUpdate.createSigned(this.sender);
    update.send({ to: this, amount });

    const currentState = this.num.getAndAssertEquals();
    const newState = currentState.add(1);
    this.num.set(newState);
  }

  /**
   * Invalid transfer, send > sender's balance
   */
  @method invalidTransfer(balance: UInt64) {
    // amount > balance
    const amount = balance.add(1);
    const update = AccountUpdate.createSigned(this.sender);
    update.send({ to: this, amount });

    const currentState = this.num.getAndAssertEquals();
    const newState = currentState.add(1);
    this.num.set(newState);
  }
}
