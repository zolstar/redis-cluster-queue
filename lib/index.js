"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
var Redis = require("ioredis");
var events_1 = require("events");
var helpers_1 = require("./common/helpers");
var constants_1 = require("./common/constants");
var validator_1 = require("./common/validator");
var RedisClusterQueue = /** @class */ (function (_super) {
    __extends(RedisClusterQueue, _super);
    function RedisClusterQueue(options) {
        if (options === void 0) { options = {
            host: "127.0.0.1",
            port: 6379,
            namespace: 'rcq',
            keyPrefix: ''
        }; }
        var _this = _super.call(this) || this;
        _this.options = options;
        _this.connected = false;
        _this.redisNamespace = '';
        _this.changeMessageVisibilityScriptId = '';
        _this.popMessageScriptId = '';
        _this.receiveMessageScriptId = '';
        _this.isCluster = false;
        _this.slotInfo = {
            currentNodeIndex: 0,
            numOfMasterNode: 1,
            slotAllocate: {},
        };
        _this.redisNamespace = (options.namespace || 'rcq');
        _this.initCLuster();
        return _this;
    }
    /*
    * Init redis connection
    * If it is cluster mode, auto change the connection to Redis Cluster
    */
    RedisClusterQueue.prototype.initCLuster = function () {
        return __awaiter(this, void 0, void 0, function () {
            var redisInfo;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.redis = new Redis({
                            port: this.options.port || 6379,
                            host: this.options.host || '127.0.0.1',
                            password: this.options.password || '',
                            keyPrefix: this.options.keyPrefix || ''
                        });
                        return [4 /*yield*/, this.redis.call('info')];
                    case 1:
                        redisInfo = _a.sent();
                        if (!redisInfo.includes('cluster_enabled:1')) return [3 /*break*/, 3];
                        this.isCluster = true;
                        return [4 /*yield*/, this.redis.quit()];
                    case 2:
                        _a.sent();
                        this.redis = new Redis.Cluster([
                            {
                                port: this.options.port,
                                host: this.options.host,
                            },
                        ], {
                            maxRedirections: 16,
                            slotsRefreshTimeout: 3000,
                            slotsRefreshInterval: 30000,
                            redisOptions: {
                                password: this.options.password || '',
                                keyPrefix: this.options.keyPrefix || '',
                            }
                        });
                        _a.label = 3;
                    case 3:
                        this.connected = this.redis.status === 'ready' || this.redis.status === 'connect' || false;
                        if (!this.connected) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.initScript()];
                    case 4:
                        _a.sent();
                        this.emit("connect");
                        _a.label = 5;
                    case 5:
                        this.redis.on("connect", function () { return __awaiter(_this, void 0, void 0, function () {
                            var slotResult;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.redis.call('cluster', 'slots')];
                                    case 1:
                                        slotResult = _a.sent();
                                        if (Array.isArray(slotResult)) {
                                            this.slotInfo.numOfMasterNode = slotResult.length;
                                            slotResult.forEach(function (node, index) {
                                                _this.slotInfo.slotAllocate[index] = {
                                                    from: node[0],
                                                    to: node[1],
                                                };
                                            });
                                        }
                                        return [4 /*yield*/, this.initScript()];
                                    case 2:
                                        _a.sent();
                                        this.connected = true;
                                        this.emit("connect");
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        this.redis.on("error", function (err) {
                            if (err.message.indexOf("ECONNREFUSED")) {
                                _this.connected = false;
                                _this.emit("disconnect");
                            }
                            else {
                                console.error(new Date().toISOString(), "Redis ERROR", err);
                                _this.emit("error");
                            }
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    /*
    * Wait until connection established and create all needed scripts
    */
    RedisClusterQueue.prototype.waitForConnected = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this.connected)
                    return [2 /*return*/, 1];
                return [2 /*return*/, new Promise(function (resolve) {
                        var myInterval = setInterval(function () {
                            if (_this.connected) {
                                console.log(new Date().toISOString(), 'Redis connected');
                                clearInterval(myInterval);
                                resolve(1);
                            }
                            else {
                                console.log(new Date().toISOString(), 'Redis connecting');
                            }
                        }, 1000);
                    })];
            });
        });
    };
    /*
    * Allocate the queue to specific shard in cluster mode
    * and move to the next shard to ensure the number of queues on each shard is nearly equal
    */
    RedisClusterQueue.prototype.getQueueKeyForNextMasterNode = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isCluster) {
                            return [2 /*return*/, helpers_1.uuidv4()];
                        }
                        this.slotInfo.currentNodeIndex++;
                        if (this.slotInfo.currentNodeIndex > this.slotInfo.numOfMasterNode - 1) {
                            this.slotInfo.currentNodeIndex = 0;
                        }
                        return [4 /*yield*/, this.generateKeyForSlotRange(this.slotInfo.slotAllocate[this.slotInfo.currentNodeIndex].from, this.slotInfo.slotAllocate[this.slotInfo.currentNodeIndex].to)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /*
    * Each shard has the own slot range (ex: 0 - 8191)
    * Generate uuid key to match slot range of specific shard
    */
    RedisClusterQueue.prototype.generateKeyForSlotRange = function (fromSlot, toSlot) {
        return __awaiter(this, void 0, void 0, function () {
            var key, slotNumber;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = helpers_1.uuidv4();
                        return [4 /*yield*/, this.redis.call('cluster', 'keyslot', key)];
                    case 1:
                        slotNumber = _a.sent();
                        if (slotNumber >= fromSlot && slotNumber <= toSlot) {
                            return [2 /*return*/, key];
                        }
                        return [4 /*yield*/, this.generateKeyForSlotRange(fromSlot, toSlot)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /*
    * Get list queue's name
    * @return {string[]} return array of all queue's name
    */
    RedisClusterQueue.prototype.listQueues = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.waitForConnected()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.redis.smembers(this.getListQueueKey())];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /*
    * Create queue
    * @param {*} options object of params needed
    * @param {string} options.name the name of queue, should contains only these characters a-z,A-Z, 0-0, _, -
    * @param {number} [options.visibilityTimeout=30] The message's invisible time, in seconds, after message received, it hidden until timeout
    * @param {number} [options.delay=0] The time in seconds that the delivery of all new messages in the queue will be delayed. Allowed values: 0-9999999 (around 115 days)
    * @param {number} [options.maxsize=65536] The maximum message size in bytes. Allowed values: 1024-65536 and -1 (for unlimited size)
    * @return {number} return 1 if queue created
    */
    RedisClusterQueue.prototype.createQueue = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var queueName, vt, delay, maxsize, resp, timestamp, queueUid, _a, infoKey, uidKey, result, mc;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.waitForConnected()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.validateObject(options, {
                                name: ['required', 'regex:^([a-zA-Z0-9_-]){1,160}$'],
                                visibilityTimeout: ['integer'],
                                delay: ['integer', "min:" + constants_1.DELAY_MIN, "max:" + constants_1.DELAY_MAX],
                                maxsize: ['integer', "min:" + constants_1.MESSAGE_MIN_SIZE, "max:" + constants_1.MESSAGE_MAX_SIZE],
                            })];
                    case 2:
                        _b.sent();
                        queueName = options.name;
                        vt = options.visibilityTimeout || constants_1.DEFAULT_VISIBILITY_TIMEOUT;
                        delay = options.delay || constants_1.DELAY_MIN;
                        maxsize = options.maxsize || constants_1.MESSAGE_MAX_SIZE;
                        return [4 /*yield*/, this.redis.time()];
                    case 3:
                        resp = _b.sent();
                        timestamp = resp[0] || Math.floor(Date.now() / 1000);
                        return [4 /*yield*/, this.getQueueKeyForNextMasterNode()];
                    case 4:
                        queueUid = _b.sent();
                        _a = helpers_1.getQueueKey({
                            namespace: this.redisNamespace,
                            queueName: queueName,
                            queueUid: queueUid,
                        }), infoKey = _a.infoKey, uidKey = _a.uidKey;
                        return [4 /*yield*/, this.redis.call("hsetnx", uidKey, "uid", queueUid)];
                    case 5:
                        result = _b.sent();
                        if (result === 0) {
                            throw new Error(constants_1.ErrorMessageEnum.QUEUE_EXISTS);
                        }
                        mc = [
                            ["hsetnx", infoKey, "vt", vt],
                            ["hsetnx", infoKey, "delay", delay],
                            ["hsetnx", infoKey, "maxsize", maxsize],
                            ["hsetnx", infoKey, "created", timestamp],
                            ["hsetnx", infoKey, "modified", timestamp],
                        ];
                        return [4 /*yield*/, this.redis.multi(mc).exec()];
                    case 6:
                        _b.sent();
                        return [4 /*yield*/, this.redis.sadd(this.getListQueueKey(), queueName)];
                    case 7:
                        _b.sent();
                        return [2 /*return*/, 1];
                }
            });
        });
    };
    /*
    * Delete queue
    * @param {*} options object of params needed
    * @param {string} options.name the name of queue, should contains only these characters a-z,A-Z, 0-0, _, -
    * @return {number} return 1 if ok
    */
    RedisClusterQueue.prototype.deleteQueue = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var name, queue, _a, key, infoKey, uidKey;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.waitForConnected()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.validateObject(options, {
                                name: ['required'],
                            })];
                    case 2:
                        _b.sent();
                        name = options.name;
                        return [4 /*yield*/, this.getQueueInfo(name)];
                    case 3:
                        queue = (_b.sent()).queue;
                        _a = helpers_1.getQueueKey({
                            namespace: this.redisNamespace,
                            queueName: name,
                            queueUid: queue.uid,
                        }), key = _a.key, infoKey = _a.infoKey, uidKey = _a.uidKey;
                        // need exec 2 commands because of difference key pattern
                        return [4 /*yield*/, Promise.all([
                                this.redis.call("del", uidKey),
                                this.redis.call("del", infoKey, key),
                                this.redis.call("srem", this.getListQueueKey(), name),
                            ])];
                    case 4:
                        // need exec 2 commands because of difference key pattern
                        _b.sent();
                        return [2 /*return*/, 1];
                }
            });
        });
    };
    /*
   * Get queue's attributes
   * @param {*} options object of params needed
   * @param {string} options.name the name of queue, should contains only these characters a-z,A-Z, 0-0, _, -
   * @return {*} return attributes {
        visibilityTimeout,
        delay,
        maxsize,
        totalReceived,
        totalSent,
        created,
        modified,
        uid,
        numOfMessages,
        numOfHiddenMessages
      }
   */
    RedisClusterQueue.prototype.getQueueAttributes = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, queue, time, _b, key, infoKey, mc, results;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.validateObject(options, {
                            name: ['required'],
                        })];
                    case 1:
                        _c.sent();
                        return [4 /*yield*/, this.getQueueInfo(options.name)];
                    case 2:
                        _a = _c.sent(), queue = _a.queue, time = _a.time;
                        _b = helpers_1.getQueueKey({
                            namespace: this.redisNamespace,
                            queueName: options.name,
                            queueUid: queue.uid,
                        }), key = _b.key, infoKey = _b.infoKey;
                        mc = [
                            ["hmget", infoKey, "vt", "delay", "maxsize", "totalReceived", "totalSent", "created", "modified"],
                            ["zcard", key],
                            ["zcount", key, time.currentTimestamp + "000", "+inf"]
                        ];
                        return [4 /*yield*/, this.redis.multi(mc).exec()];
                    case 3:
                        results = _c.sent();
                        if (results[0][1] === null) {
                            throw new Error(constants_1.ErrorMessageEnum.QUEUE_NOT_FOUND);
                        }
                        return [2 /*return*/, {
                                visibilityTimeout: parseInt(results[0][1][0], 10),
                                delay: parseInt(results[0][1][1], 10),
                                maxsize: parseInt(results[0][1][2], 10),
                                totalReceived: parseInt(results[0][1][3], 10) || 0,
                                totalSent: parseInt(results[0][1][4], 10) || 0,
                                created: parseInt(results[0][1][5], 10),
                                modified: parseInt(results[0][1][6], 10),
                                uid: queue.uid,
                                numOfMessages: results[1][1],
                                numOfHiddenMessages: results[2][1]
                            }];
                }
            });
        });
    };
    /*
    * Set queue's attributes
    * @param {*} options object of params needed
    * @param {string} options.name the name of queue, should contains only these characters a-z,A-Z, 0-0, _, -
    * @param {number} [options.visibilityTimeout=30] The message's invisible time, in seconds, after message received, it hidden until timeout
    * @param {number} [options.delay=0] The time in seconds that the delivery of all new messages in the queue will be delayed. Allowed values: 0-9999999 (around 115 days)
    * @param {number} [options.maxsize=65536] The maximum message size in bytes. Allowed values: 1024-65536 and -1 (for unlimited size)
    * @return {*} return attributes {
        visibilityTimeout,
        delay,
        maxsize,
        totalReceived,
        totalSent,
        created,
        modified,
        uid,
        numOfMessages,
        numOfHiddenMessages
      }
    */
    RedisClusterQueue.prototype.setQueueAttributes = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var props, attributes, _i, props_1, item, queue, infoKey, resp, mc, _a, attributes_1, item;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.waitForConnected()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.validateObject(options, {
                                name: ['required'],
                                maxsize: ['integer'],
                                visibilityTimeout: ['integer'],
                                delay: ['integer'],
                            })];
                    case 2:
                        _b.sent();
                        props = ["visibilityTimeout", "maxsize", "delay"];
                        attributes = [];
                        for (_i = 0, props_1 = props; _i < props_1.length; _i++) {
                            item = props_1[_i];
                            if (options[item]) {
                                attributes.push(item);
                            }
                        }
                        if (attributes.length === 0) {
                            throw new Error(constants_1.ErrorMessageEnum.NO_ATTRIBUTE_SUPPLY);
                        }
                        return [4 /*yield*/, this.getQueueInfo(options.name)];
                    case 3:
                        queue = (_b.sent()).queue;
                        infoKey = helpers_1.getQueueKey({
                            namespace: this.redisNamespace,
                            queueName: options.name,
                            queueUid: queue.uid,
                        }).infoKey;
                        return [4 /*yield*/, this.redis.time()];
                    case 4:
                        resp = _b.sent();
                        mc = [
                            ["hset", infoKey, "modified", resp[0]]
                        ];
                        for (_a = 0, attributes_1 = attributes; _a < attributes_1.length; _a++) {
                            item = attributes_1[_a];
                            mc.push(["hset", infoKey, item === 'visibilityTimeout' ? 'vt' : item, options[item]]);
                        }
                        return [4 /*yield*/, this.redis.multi(mc).exec()];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, this.getQueueAttributes(options)];
                    case 6: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    /*
    * Send message to the queue
    * @param {*} options object of params needed
    * @param {string} options.queueName the name of queue, should contains only these characters a-z,A-Z, 0-0, _, -
    * @param {string} options.message the message
    * @param {number} [options.delay=0] The time in seconds that the delivery of all new messages in the queue will be delayed. Allowed values: 0-9999999 (around 115 days)
    * @return {string} return message's id
    */
    RedisClusterQueue.prototype.sendMessage = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, queueName, message, _b, queue, time, delay, _c, key, infoKey, messageId, mc;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.waitForConnected()];
                    case 1:
                        _d.sent();
                        return [4 /*yield*/, this.validateObject(options, {
                                queueName: ['required'],
                                message: ['required', "min:" + constants_1.MESSAGE_MIN_SIZE, "max:" + constants_1.MESSAGE_MAX_SIZE],
                                delay: ['integer', "min:" + constants_1.DELAY_MIN, "max:" + constants_1.DELAY_MAX],
                            })];
                    case 2:
                        _d.sent();
                        _a = options || {}, queueName = _a.queueName, message = _a.message;
                        return [4 /*yield*/, this.getQueueInfo(queueName)];
                    case 3:
                        _b = _d.sent(), queue = _b.queue, time = _b.time;
                        delay = options.delay != null ? options.delay : queue.delay;
                        _c = helpers_1.getQueueKey({
                            namespace: this.redisNamespace,
                            queueName: queueName,
                            queueUid: queue.uid,
                        }), key = _c.key, infoKey = _c.infoKey;
                        messageId = Number(time.currentTimestamp + time.microsecond).toString(36) + '-' + helpers_1.uuidv4();
                        mc = [
                            ["zadd", key, +time.currentTimestamp + delay * 1000, messageId],
                            ["hset", infoKey, messageId, message],
                            ["hincrby", infoKey, "totalSent", 1]
                        ];
                        return [4 /*yield*/, this.redis.multi(mc).exec()];
                    case 4:
                        _d.sent();
                        return [2 /*return*/, messageId];
                }
            });
        });
    };
    /*
    * Change visibility timeout of specific message
    * @param {*} options object of params needed
    * @param {string} options.queueName the name of queue, should contains only these characters a-z,A-Z, 0-0, _, -
    * @param {string} options.messageId the message's id
    * @param {number} options.visibilityTimeout The message's invisible time, in seconds, after message received, it hidden until timeout
    * @return {number} return 1 if ok
    */
    RedisClusterQueue.prototype.changeMessageVisibility = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, queue, time;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.waitForConnected()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.validateObject(options, {
                                queueName: ['required'],
                                messageId: ['required'],
                                visibilityTimeout: ['required', 'integer']
                            })];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, this.getQueueInfo(options.queueName)];
                    case 3:
                        _a = _b.sent(), queue = _a.queue, time = _a.time;
                        options.visibilityTimeout = options.visibilityTimeout || queue.visibilityTimeout;
                        return [4 /*yield*/, this.changeMessageVisibilityByScript(options, queue, time)];
                    case 4: 
                    // Make really sure that the LUA script is loaded
                    return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    /*
    * Delete message from queue
    * @param {*} options object of params needed
    * @param {string} options.queueName the name of queue, should contains only these characters a-z,A-Z, 0-0, _, -
    * @param {string} options.messageId the message's id
    * @return {number} return 1 if ok, 0 if something went wrong
    */
    RedisClusterQueue.prototype.deleteMessage = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var queue, messageId, _a, key, infoKey, mc, resp;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.waitForConnected()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.validateObject(options, {
                                queueName: ['required'],
                                messageId: ['required'],
                            })];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, this.getQueueInfo(options.queueName)];
                    case 3:
                        queue = (_b.sent()).queue;
                        messageId = options.messageId;
                        _a = helpers_1.getQueueKey({
                            namespace: this.redisNamespace,
                            queueName: options.queueName,
                            queueUid: queue.uid,
                        }), key = _a.key, infoKey = _a.infoKey;
                        mc = [
                            ["zrem", key, messageId],
                            ["hdel", infoKey, messageId, messageId + ":rc", messageId + ":fr"]
                        ];
                        return [4 /*yield*/, this.redis.multi(mc).exec()];
                    case 4:
                        resp = _b.sent();
                        return [2 /*return*/, resp[0][1] === 1 && resp[1][1] > 0 ? 1 : 0];
                }
            });
        });
    };
    /*
    * Get and delete message immediately from queue
    * @param {*} options object of params needed
    * @param {string} options.queueName the name of queue, should contains only these characters a-z,A-Z, 0-0, _, -
    * @return {*} return object {
        id,
        message,
        totalReceived,
        firstReceivedTimestamp,
        createdAt
      }
    */
    RedisClusterQueue.prototype.popMessage = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, queue, time;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.waitForConnected()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.validateObject(options, {
                                queueName: ['required'],
                            })];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, this.getQueueInfo(options.queueName)];
                    case 3:
                        _a = _b.sent(), queue = _a.queue, time = _a.time;
                        return [4 /*yield*/, this.popMessageByScript(options, queue, time)];
                    case 4: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    /*
   * Get message from queue
   * @param {*} options object of params needed
   * @param {string} options.queueName the name of queue, should contains only these characters a-z,A-Z, 0-0, _, -
   * @param {number} [options.visibilityTimeout=30] The message's invisible time, in seconds, after message received, it hidden until timeout
   * @return {*} return object {
       id,
       message,
       totalReceived,
       firstReceivedTimestamp,
       createdAt
     }
   */
    RedisClusterQueue.prototype.receiveMessage = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, queue, time;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.waitForConnected()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.validateObject(options, {
                                queueName: ['required'],
                                visibilityTimeout: ['integer']
                            })];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, this.getQueueInfo(options.queueName)];
                    case 3:
                        _a = _b.sent(), queue = _a.queue, time = _a.time;
                        options.visibilityTimeout = options.visibilityTimeout || queue.visibilityTimeout;
                        return [4 /*yield*/, this.receiveMessageByScript(options, queue, time)];
                    case 4: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    /*
    * Disconnect the redis
    */
    RedisClusterQueue.prototype.quit = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.redis.quit()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /*
    * Create scripts in redis
    */
    RedisClusterQueue.prototype.initScript = function () {
        return __awaiter(this, void 0, void 0, function () {
            var popMessageScript, receiveMessageScript, changeMessageVisibilityScript, _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        popMessageScript = "local msg = redis.call(\"ZRANGEBYSCORE\", KEYS[1], \"-inf\", ARGV[1], \"LIMIT\", \"0\", \"1\")\n\t\t\tif #msg == 0 then\n\t\t\t\treturn {}\n\t\t\tend\n\t\t\tredis.call(\"HINCRBY\", KEYS[1] .. \":Q\", \"totalReceived\", 1)\n\t\t\tlocal mbody = redis.call(\"HGET\", KEYS[1] .. \":Q\", msg[1])\n\t\t\tlocal rc = redis.call(\"HINCRBY\", KEYS[1] .. \":Q\", msg[1] .. \":rc\", 1)\n\t\t\tlocal o = {msg[1], mbody, rc}\n\t\t\tif rc==1 then\n\t\t\t\ttable.insert(o, ARGV[1])\n\t\t\telse\n\t\t\t\tlocal fr = redis.call(\"HGET\", KEYS[1] .. \":Q\", msg[1] .. \":fr\")\n\t\t\t\ttable.insert(o, fr)\n\t\t\tend\n\t\t\tredis.call(\"ZREM\", KEYS[1], msg[1])\n\t\t\tredis.call(\"HDEL\", KEYS[1] .. \":Q\", msg[1], msg[1] .. \":rc\", msg[1] .. \":fr\")\n\t\t\treturn o";
                        receiveMessageScript = "local msg = redis.call(\"ZRANGEBYSCORE\", KEYS[1], \"-inf\", ARGV[1], \"LIMIT\", \"0\", \"1\")\n\t\t\tif #msg == 0 then\n\t\t\t\treturn {}\n\t\t\tend\n\t\t\tredis.call(\"ZADD\", KEYS[1], ARGV[2], msg[1])\n\t\t\tredis.call(\"HINCRBY\", KEYS[1] .. \":Q\", \"totalReceived\", 1)\n\t\t\tlocal mbody = redis.call(\"HGET\", KEYS[1] .. \":Q\", msg[1])\n\t\t\tlocal rc = redis.call(\"HINCRBY\", KEYS[1] .. \":Q\", msg[1] .. \":rc\", 1)\n\t\t\tlocal o = {msg[1], mbody, rc}\n\t\t\tif rc==1 then\n\t\t\t\tredis.call(\"HSET\", KEYS[1] .. \":Q\", msg[1] .. \":fr\", ARGV[1])\n\t\t\t\ttable.insert(o, ARGV[1])\n\t\t\telse\n\t\t\t\tlocal fr = redis.call(\"HGET\", KEYS[1] .. \":Q\", msg[1] .. \":fr\")\n\t\t\t\ttable.insert(o, fr)\n\t\t\tend\n\t\t\treturn o";
                        changeMessageVisibilityScript = "local msg = redis.call(\"ZSCORE\", KEYS[1], ARGV[1])\n\t\t\tif not msg then\n\t\t\t\treturn 0\n\t\t\tend\n\t\t\tredis.call(\"ZADD\", KEYS[1], ARGV[2], ARGV[1])\n\t\t\treturn 1";
                        _a = this;
                        return [4 /*yield*/, this.redis.script("load", popMessageScript)];
                    case 1:
                        _a.popMessageScriptId = _d.sent();
                        _b = this;
                        return [4 /*yield*/, this.redis.script("load", receiveMessageScript)];
                    case 2:
                        _b.receiveMessageScriptId = _d.sent();
                        _c = this;
                        return [4 /*yield*/, this.redis.script("load", changeMessageVisibilityScript)];
                    case 3:
                        _c.changeMessageVisibilityScriptId = _d.sent();
                        this.emit("scriptload:popMessage");
                        this.emit("scriptload:receiveMessage");
                        this.emit('scriptload:changeMessageVisibility');
                        return [2 /*return*/];
                }
            });
        });
    };
    /*
    * Create scripts in redis
    * @param {string} name queue's name
    * @return {*} return object queue, time in redis
    */
    RedisClusterQueue.prototype.getQueueInfo = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var uidKey, queue, queueUid, infoKey, commands, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uidKey = helpers_1.getQueueKey({
                            namespace: this.redisNamespace,
                            queueName: name,
                            queueUid: '',
                        }).uidKey;
                        return [4 /*yield*/, this.redis.call("hmget", uidKey, "uid")];
                    case 1:
                        queue = _a.sent();
                        if (!queue || queue[0] === null) {
                            throw new Error(constants_1.ErrorMessageEnum.QUEUE_NOT_FOUND);
                        }
                        queueUid = queue[0];
                        infoKey = helpers_1.getQueueKey({
                            namespace: this.redisNamespace,
                            queueName: name,
                            queueUid: queueUid,
                        }).infoKey;
                        commands = [
                            ["hmget", infoKey, "vt", "delay", "maxsize"],
                            ["time"]
                        ];
                        return [4 /*yield*/, this.redis.multi(commands).exec()];
                    case 2:
                        results = _a.sent();
                        if (!results || results[0][1][0] === null || results[0][1][1] === null || results[0][1][2] === null) {
                            throw new Error(constants_1.ErrorMessageEnum.QUEUE_NOT_FOUND);
                        }
                        return [2 /*return*/, {
                                queue: {
                                    visibilityTimeout: parseInt(results[0][1][0], 10),
                                    delay: parseInt(results[0][1][1], 10),
                                    maxsize: parseInt(results[0][1][2], 10),
                                    uid: queueUid,
                                },
                                time: {
                                    currentTimestamp: +results[1][1][0],
                                    microsecond: helpers_1.padZeroLeft(Number(results[1][1][1]), 6)
                                }
                            }];
                }
            });
        });
    };
    RedisClusterQueue.prototype.changeMessageVisibilityByScript = function (options, queue, time) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = helpers_1.getQueueKey({
                            namespace: this.redisNamespace,
                            queueName: options.queueName,
                            queueUid: queue.uid,
                        }).key;
                        return [4 /*yield*/, this.redis.evalsha(this.changeMessageVisibilityScriptId, 1, key, options.messageId, time.currentTimestamp + options.visibilityTimeout * 1000)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    RedisClusterQueue.prototype.popMessageByScript = function (options, queue, time) {
        return __awaiter(this, void 0, void 0, function () {
            var key, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = helpers_1.getQueueKey({
                            namespace: this.redisNamespace,
                            queueName: options.queueName,
                            queueUid: queue.uid,
                        }).key;
                        return [4 /*yield*/, this.redis.evalsha(this.popMessageScriptId, 1, key, time.currentTimestamp)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, this.handleReceivedMessageResponse(result)];
                }
            });
        });
    };
    RedisClusterQueue.prototype.receiveMessageByScript = function (options, queue, time) {
        return __awaiter(this, void 0, void 0, function () {
            var key, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = helpers_1.getQueueKey({
                            namespace: this.redisNamespace,
                            queueName: options.queueName,
                            queueUid: queue.uid,
                        }).key;
                        return [4 /*yield*/, this.redis.evalsha(this.receiveMessageScriptId, 1, key, time.currentTimestamp, time.currentTimestamp + (options.visibilityTimeout || 30) * 1000)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, this.handleReceivedMessageResponse(result)];
                }
            });
        });
    };
    RedisClusterQueue.prototype.handleReceivedMessageResponse = function (result) {
        if (!result.length) {
            return {};
        }
        return {
            id: result[0],
            message: result[1],
            totalReceived: result[2],
            firstReceivedTimestamp: Number(result[3]),
            createdAt: parseInt((parseInt(result[0].slice(0, 10), 36) / 1000).toString())
        };
    };
    RedisClusterQueue.prototype.validateObject = function (data, rules) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _a, field, message;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (new validator_1.default(data, rules)).validate()];
                    case 1:
                        result = _b.sent();
                        if (result.error) {
                            _a = result.errors[0], field = _a.field, message = _a.errors[0];
                            throw new Error(field + ": " + message);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    RedisClusterQueue.prototype.getListQueueKey = function () {
        return this.redisNamespace + ":queues";
    };
    return RedisClusterQueue;
}(events_1.EventEmitter));
exports.default = RedisClusterQueue;
