import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Permissions,
} from 'snarkyjs';

/** Hidden fields */
export class Hidden extends SmartContract {
  @state(Field) num = State<Field>();

  // hidden field
  field = Field(19);

  init() {
    super.init();
    this.account.permissions.set(Permissions.default());
    this.num.set(Field(0));
  }

  @method method() {
    this.field = this.field.add(23);

    this.num.getAndAssertEquals();
    this.num.set(this.field);
  }
}
