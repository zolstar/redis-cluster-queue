const RULES = {
  required: 'required',
  integer: 'integer',
  max: 'max',
  min: 'min',
  regex: 'regex',
};

interface IRuleErrorItem {
  error: boolean,
  message?: string,
}

interface IFieldError {
  error: boolean,
  errors: string[],
  field?: string,
}

interface IObjectError {
  error: boolean,
  errors: IFieldError[],
}

interface IRules {
  [field: string]: string[],
}

const validateRequired = async (data: any) => {
  let error = false;
  if (typeof data === 'undefined') {
    error = true;
  } else if (typeof data === 'boolean') {
    error = false;
  } else if (typeof data === 'string') {
    error = !data;
  } else if (typeof data === 'number') {
    error = false;
  } else {
    error = !data;
  }

  return {
    error,
    message: 'This field\'s value is required',
  };
};

const validateInteger = (data: any): IRuleErrorItem => {
  if (!data) return { error: false };
  return {
    error: !Number.isInteger(data),
    message: 'must be an integer',
  };
};

const validateMin = (data: any, ruleOptions: string[]): IRuleErrorItem => {
  if (data === null || data === '') return { error: false };
  const [min = ''] = ruleOptions;
  return {
    error: data < +min,
    message: `Please enter a value greater than or equal to ${+min}`,
  };
};

const validateMax = (data: any, ruleOptions: string[]): IRuleErrorItem => {
  if (data === null || data === '') return { error: false };
  const [max = ''] = ruleOptions;
  return {
    error: data > +max,
    message: `Please enter a value less than or equal to ${+max}`,
  };
};

const validateRegex = (data: any, ruleOptions: string[]): IRuleErrorItem => {
  if (data === null || data === '') return { error: false };
  const [regexStr = ''] = ruleOptions;
  try {
    const regex = new RegExp(regexStr);
    return {
      error: !regex.test(data),
      message: 'Please enter value contains these valid characters a-z, A-Z, 0-9, _, -',
    };
  } catch (e) {
    return {
      error: false,
      message: 'Please enter value contains these valid characters a-z, A-Z, 0-9, _, -',
    };
  }
};

const ruleToMethod = {
  [RULES.required]: validateRequired,
  [RULES.integer]: validateInteger,
  [RULES.min]: validateMin,
  [RULES.max]: validateMax,
  [RULES.regex]: validateRegex,
};

export default class Validator {
  private readonly rules: any;
  private data: any;
  constructor(data: Record<string, any>, rules: IRules) {
    this.rules = rules !== null && typeof rules === 'object' ? rules : {};
    this.data = data;
  }

  async validateObject(data: Record<string, any>, rules: IRules): Promise<IObjectError> {
    const validateResults: IFieldError[] = await Promise.all(Object.keys(rules).map(async (field): Promise<IFieldError> => {
      const result = await this.validateField(data[field], rules[field] || []);
      return {
        error: result.error,
        field,
        errors: result.errors,
      };
    }));
    const errors = validateResults.filter(item => item.error);
    return {
      error: !!errors.length,
      errors,
    };
  }

  async validateField(data: any, rules: string[]): Promise<IFieldError> {
    const results: IRuleErrorItem[] = await Promise.all(rules.map(async (rule): Promise<IRuleErrorItem> => {
      if (rule.includes(':')) {
        const [fieldRule = '', ...ruleOptions] = rule.split(':');
        return await ruleToMethod[fieldRule](data, ruleOptions || []);
      }
      return await ruleToMethod[rule](data, []);
    }));
    const errors = results.filter(item => item.error).map(item => item.message || '');
    return {
      error: !!errors.length,
      errors,
    };
  }

  async validate() {
    return await this.validateObject(this.data, this.rules);
  }
}
