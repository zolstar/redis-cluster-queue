interface IFieldError {
    error: boolean;
    errors: string[];
    field?: string;
}
interface IObjectError {
    error: boolean;
    errors: IFieldError[];
}
interface IRules {
    [field: string]: string[];
}
export default class Validator {
    private readonly rules;
    private data;
    constructor(data: Record<string, any>, rules: IRules);
    validateObject(data: Record<string, any>, rules: IRules): Promise<IObjectError>;
    validateField(data: any, rules: string[]): Promise<IFieldError>;
    validate(): Promise<IObjectError>;
}
export {};
