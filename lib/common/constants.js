"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessageEnum = exports.MESSAGE_MAX_SIZE = exports.MESSAGE_MIN_SIZE = exports.DELAY_MAX = exports.DELAY_MIN = exports.DEFAULT_VISIBILITY_TIMEOUT = void 0;
exports.DEFAULT_VISIBILITY_TIMEOUT = 30;
exports.DELAY_MIN = 0;
exports.DELAY_MAX = 9999999;
exports.MESSAGE_MIN_SIZE = 1024;
exports.MESSAGE_MAX_SIZE = 65536;
var ErrorMessageEnum;
(function (ErrorMessageEnum) {
    ErrorMessageEnum["QUEUE_EXISTS"] = "Queue exists";
    ErrorMessageEnum["QUEUE_NOT_FOUND"] = "Queue not found";
    ErrorMessageEnum["NO_ATTRIBUTE_SUPPLY"] = "No attribute was supplied";
})(ErrorMessageEnum = exports.ErrorMessageEnum || (exports.ErrorMessageEnum = {}));
