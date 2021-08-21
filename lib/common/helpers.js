"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueueKey = exports.padZeroLeft = exports.uuidv4 = void 0;
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
exports.uuidv4 = uuidv4;
function padZeroLeft(num, count) {
    return ((Math.pow(10, count) + num) + "").substr(1);
}
exports.padZeroLeft = padZeroLeft;
function getQueueKey(params) {
    var key = params.namespace + ":" + params.queueName + ":{" + params.queueUid + "}";
    return {
        key: key,
        uidKey: params.namespace + ":" + params.queueName,
        infoKey: key + ":Q",
    };
}
exports.getQueueKey = getQueueKey;
