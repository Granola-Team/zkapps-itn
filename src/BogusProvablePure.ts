import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Permissions,
  Reducer,
  ProvablePure,
} from 'snarkyjs';

/**
 * Bogus ProvablePure Examples
 */

class Bogus<T> implements ProvablePure<T> {
  toFields: (x: T) => Field[];
  toAuxiliary: (x?: T) => [];
  fromFields: (x: Field[]) => T;
  sizeInFields(): number {
    return 0;
  }
  check: (x: T) => void;
}

export class BogusProvablePure extends SmartContract {
  @state(Field) field = State<Field>();

  reducer = Reducer({ actionType: Field });

  init() {
    super.init();
    this.account.permissions.set(Permissions.default());
  }

  /** Dispatch the max number of actions per transaction, i.e. 100 */
  @method dispatchLotsOfActions(multiplier: Field) {
    for (let i = 0; i < 100; i++) {
      this.reducer.dispatch(multiplier.mul(i));
    }
  }
}
