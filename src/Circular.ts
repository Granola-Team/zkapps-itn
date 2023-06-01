import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Permissions,
  Circuit,
} from 'snarkyjs';

/**
 * Circular smart contract
 */
export class Circular extends SmartContract {
  @state(Field) field = State<Field>();

  init() {
    super.init();
    this.account.permissions.set(Permissions.default());
    this.field.set(Field(0));
  }

  @method method1() {
    let curr = this.field.getAndAssertEquals();
    this.field.set(curr.add(1));
    this.method2();
  }

  @method method2() {
    let curr = this.field.getAndAssertEquals();
    this.field.set(curr.add(1));
    this.method1();
  }

  @method recursiveGetAndSet() {
    let curr = this.field.getAndAssertEquals();
    Circuit.log(curr);
    this.field.set(curr.add(1));
    this.recursiveGetAndSet();
  }
}
