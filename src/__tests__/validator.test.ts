import Validator from '../common/validator';

describe('Validator',  () => {
  it('1. object should be valid', async () => {
    const obj = {
      id: 1,
      name: 'alice'
    };
    const rules = {
      id: ['required', 'integer'],
      name: ['required'],
    }
    const result = await (new Validator(obj, rules)).validate();
    expect(result.error).toBe(false);
  })
  it('2. object should be valid', async () => {
    const obj = {
      id: 1,
      name: 'alice'
    };
    const rules = {
      id: ['required', 'integer', 'min:0', 'max:5'],
      name: ['required'],
    }
    const result = await (new Validator(obj, rules)).validate();
    expect(result.error).toBe(false);
  })
  it('3. object should be invalid', async () => {
    const obj = {
      id: 7,
      name: 'alice'
    };
    const rules = {
      id: ['required', 'integer', 'min:0', 'max:5'],
      name: ['required'],
    }
    const result = await (new Validator(obj, rules)).validate();
    expect(result.error).toBe(true);
  })
  it('4. object should be invalid', async () => {
    const obj = {
      id: 2.2,
      name: 2
    };
    const rules = {
      id: ['required', 'integer'],
      name: ['required'],
    }
    const result = await (new Validator(obj, rules)).validate();
    expect(result.error).toBe(true);
  })
  it('5. object should be invalid', async () => {
    const obj = {
      id: 2,
    };
    const rules = {
      id: ['required', 'integer'],
      name: ['required'],
    }
    const result = await (new Validator(obj, rules)).validate();
    expect(result.error).toBe(true);
  })
})
