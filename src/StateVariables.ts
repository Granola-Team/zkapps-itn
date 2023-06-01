import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Permissions,
} from 'snarkyjs';

/**
 * State Examples Example
 */
export class StateVariables extends SmartContract {
  @state(Field) num = State<Field>();

  init() {
    super.init();
    this.account.permissions.set(Permissions.default());
  }

  @method getAndSetTons() {
    for (let i = 0; i < 10_000; i++) {
      this.num.getAndAssertEquals();
      this.num.set(Field(i));
    }
  }
}
