import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Permissions,
  Reducer,
  Struct,
} from 'snarkyjs';

/**
 * Actions Examples
 */

/**
 * Lots of Actions
 */
export class LotsOfActions1 extends SmartContract {
  @state(Field) field = State<Field>();

  reducer = Reducer({ actionType: Field });
  events = {
    'verification key updated': Field,
    'update uri': Field,
  };

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

  // TODO can actions be removed after being reduced?
}

export class LotsOfActions2 extends SmartContract {
  @state(Field) field = State<Field>();

  reducer = Reducer({ actionType: Field });

  init() {
    super.init();
    this.account.permissions.set(Permissions.default());
    this.field.set(Field(42));
  }

  /** Dispatch 16 actions */
  @method dispatchAFewActions(multiplier: Field) {
    for (let i = 0; i < 16; i++) {
      this.reducer.dispatch(multiplier.mul(i));
    }
  }
}

function randoms(): [
  Field,
  Field,
  Field,
  Field,
  Field,
  Field,
  Field,
  Field,
  Field,
  Field
] {
  return [
    Field.random(),
    Field.random(),
    Field.random(),
    Field.random(),
    Field.random(),
    Field.random(),
    Field.random(),
    Field.random(),
    Field.random(),
    Field.random(),
  ];
}

/**
 * Huge Actions
 */

export class Huge extends Struct({
  fields0: [
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
  ],
  fields1: [
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
  ],
  fields2: [
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
  ],
  fields3: [
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
  ],
  fields4: [
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
  ],
  fields5: [
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
  ],
  fields6: [
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
  ],
  fields7: [
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
  ],
  fields8: [
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
  ],
  fields9: [
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
  ],
  fields10: [
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
    Field,
  ],
}) {
  toString(): string {
    return `
      fields0:  ${this.fields0},
      fields1:  ${this.fields1},
      fields2:  ${this.fields2},
      fields3:  ${this.fields3},
      fields4:  ${this.fields4},
      fields5:  ${this.fields5},
      fields6:  ${this.fields6},
      fields7:  ${this.fields7},
      fields8:  ${this.fields8},
      fields9:  ${this.fields9},
      fields10: ${this.fields10}`;
  }
}

export function randomHuge(): Huge {
  let fields0 = randoms();
  let fields1 = randoms();
  let fields2 = randoms();
  let fields3 = randoms();
  let fields4 = randoms();
  let fields5 = randoms();
  let fields6 = randoms();
  let fields7 = randoms();
  let fields8 = randoms();
  let fields9 = randoms();
  let fields10 = randoms();
  return new Huge({
    fields0,
    fields1,
    fields2,
    fields3,
    fields4,
    fields5,
    fields6,
    fields7,
    fields8,
    fields9,
    fields10,
  });
}

class Optional {
  isSome: boolean;
  value: Huge | null;

  constructor(x: Huge | null) {
    if (x === null) {
      this.isSome = false;
      this.value = x;
    } else {
      this.isSome = true;
      this.value = x;
    }
  }
}

class MaybeHuge extends Struct({
  x: Optional,
}) {}

export class HugeActions extends SmartContract {
  @state(Huge) huge = State<Huge>();

  reducer = Reducer({ actionType: Field });

  init() {
    super.init();
    this.account.permissions.set(Permissions.default());
    this.huge.set(randomHuge());
  }

  @method dispatchHugeAction() {
    this.huge.set(randomHuge());
  }

  @method async reduceHugeAction() {
    await this.reducer.fetchActions({ fromActionState: Field(0) });
  }
}
