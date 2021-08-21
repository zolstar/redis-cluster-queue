"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var RULES = {
    required: 'required',
    integer: 'integer',
    max: 'max',
    min: 'min',
    regex: 'regex',
};
var validateRequired = function (data) { return __awaiter(void 0, void 0, void 0, function () {
    var error;
    return __generator(this, function (_a) {
        error = false;
        if (typeof data === 'undefined') {
            error = true;
        }
        else if (typeof data === 'boolean') {
            error = false;
        }
        else if (typeof data === 'string') {
            error = !data;
        }
        else if (typeof data === 'number') {
            error = false;
        }
        else {
            error = !data;
        }
        return [2 /*return*/, {
                error: error,
                message: 'This field\'s value is required',
            }];
    });
}); };
var validateInteger = function (data) {
    if (!data)
        return { error: false };
    return {
        error: !Number.isInteger(data),
        message: 'must be an integer',
    };
};
var validateMin = function (data, ruleOptions) {
    if (data === null || data === '')
        return { error: false };
    var _a = ruleOptions[0], min = _a === void 0 ? '' : _a;
    return {
        error: data < +min,
        message: "Please enter a value greater than or equal to " + +min,
    };
};
var validateMax = function (data, ruleOptions) {
    if (data === null || data === '')
        return { error: false };
    var _a = ruleOptions[0], max = _a === void 0 ? '' : _a;
    return {
        error: data > +max,
        message: "Please enter a value less than or equal to " + +max,
    };
};
var validateRegex = function (data, ruleOptions) {
    if (data === null || data === '')
        return { error: false };
    var _a = ruleOptions[0], regexStr = _a === void 0 ? '' : _a;
    try {
        var regex = new RegExp(regexStr);
        return {
            error: !regex.test(data),
            message: 'Please enter value contains these valid characters a-z, A-Z, 0-9, _, -',
        };
    }
    catch (e) {
        return {
            error: false,
            message: 'Please enter value contains these valid characters a-z, A-Z, 0-9, _, -',
        };
    }
};
var ruleToMethod = (_a = {},
    _a[RULES.required] = validateRequired,
    _a[RULES.integer] = validateInteger,
    _a[RULES.min] = validateMin,
    _a[RULES.max] = validateMax,
    _a[RULES.regex] = validateRegex,
    _a);
var Validator = /** @class */ (function () {
    function Validator(data, rules) {
        this.rules = rules !== null && typeof rules === 'object' ? rules : {};
        this.data = data;
    }
    Validator.prototype.validateObject = function (data, rules) {
        return __awaiter(this, void 0, void 0, function () {
            var validateResults, errors;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(Object.keys(rules).map(function (field) { return __awaiter(_this, void 0, void 0, function () {
                            var result;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.validateField(data[field], rules[field] || [])];
                                    case 1:
                                        result = _a.sent();
                                        return [2 /*return*/, {
                                                error: result.error,
                                                field: field,
                                                errors: result.errors,
                                            }];
                                }
                            });
                        }); }))];
                    case 1:
                        validateResults = _a.sent();
                        errors = validateResults.filter(function (item) { return item.error; });
                        return [2 /*return*/, {
                                error: !!errors.length,
                                errors: errors,
                            }];
                }
            });
        });
    };
    Validator.prototype.validateField = function (data, rules) {
        return __awaiter(this, void 0, void 0, function () {
            var results, errors;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(rules.map(function (rule) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, _b, fieldRule, ruleOptions;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        if (!rule.includes(':')) return [3 /*break*/, 2];
                                        _a = rule.split(':'), _b = _a[0], fieldRule = _b === void 0 ? '' : _b, ruleOptions = _a.slice(1);
                                        return [4 /*yield*/, ruleToMethod[fieldRule](data, ruleOptions || [])];
                                    case 1: return [2 /*return*/, _c.sent()];
                                    case 2: return [4 /*yield*/, ruleToMethod[rule](data, [])];
                                    case 3: return [2 /*return*/, _c.sent()];
                                }
                            });
                        }); }))];
                    case 1:
                        results = _a.sent();
                        errors = results.filter(function (item) { return item.error; }).map(function (item) { return item.message || ''; });
                        return [2 /*return*/, {
                                error: !!errors.length,
                                errors: errors,
                            }];
                }
            });
        });
    };
    Validator.prototype.validate = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.validateObject(this.data, this.rules)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return Validator;
}());
exports.default = Validator;
