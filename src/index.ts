import * as Redis from "ioredis"
import { EventEmitter } from "events"
import {
  IChangeMessageVisibilityOptions,
  ICreateQueueOptions, IDeleteMessageOptions,
  IDeleteQueueOptions,
  IGetQueueAttributesOptions, IPopMessageOptions, IQueue, IReceiveMessageOptions,
  IRedisClusterQueueOptions, IRedisTime, ISendMessageOptions, ISetQueueAttributesOptions, ISlotInfo
} from './common/interfaces';
import { getQueueKey, padZeroLeft, uuidv4 } from './common/helpers';
import {
  DEFAULT_VISIBILITY_TIMEOUT, DELAY_MAX,
  DELAY_MIN, ErrorMessageEnum,
  MESSAGE_MAX_SIZE, MESSAGE_MIN_SIZE,
} from './common/constants';
import Validator from './common/validator';

export default class RedisClusterQueue extends EventEmitter {
  private connected = false;
  private readonly redisNamespace: string = '';
  private redis: any;
  private changeMessageVisibilityScriptId = '';
  private popMessageScriptId = '';
  private receiveMessageScriptId = '';
  private isCluster = false;
  private slotInfo: ISlotInfo = {
    currentNodeIndex: 0,
    numOfMasterNode: 1,
    slotAllocate: {},
  }

  constructor(private options: IRedisClusterQueueOptions = {
    host: "127.0.0.1",
    port: 6379,
    namespace: 'rcq',
    keyPrefix: ''
  }) {
    super();
    this.redisNamespace = (options.namespace || 'rcq');

    this.initCLuster();
  }

  /*
  * Init redis connection
  * If it is cluster mode, auto change the connection to Redis Cluster
  */
  private async initCLuster() {
    this.redis = new Redis({
      port: this.options.port || 6379,
      host: this.options.host || '127.0.0.1',
      password: this.options.password || '',
      keyPrefix: this.options.keyPrefix || ''
    });

    const redisInfo = await this.redis.call('info');

    if (redisInfo.includes('cluster_enabled:1')) {
      this.isCluster = true;
      await this.redis.quit();
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
    }

    this.connected = this.redis.status === 'ready' || this.redis.status === 'connect' || false;

    if (this.connected) {
      await this.initScript();
      this.emit("connect");
    }
    this.redis.on("connect", async () => {
      const slotResult = await this.redis.call('cluster', 'slots');
      if (Array.isArray(slotResult)) {
        this.slotInfo.numOfMasterNode = slotResult.length;
        slotResult.forEach((node, index) => {
          this.slotInfo.slotAllocate[index] = {
            from: node[0],
            to: node[1],
          }
        }) 
      }
      await this.initScript();
      this.connected = true;
      this.emit("connect");
    });

    this.redis.on("error", (err: any) => {
      if (err.message.indexOf("ECONNREFUSED")) {
        this.connected = false;
        this.emit("disconnect");
      } else {
        console.error(new Date().toISOString(), "Redis ERROR", err)
        this.emit("error")
      }
    });
  }

  /*
  * Wait until connection established and create all needed scripts
  */
  async waitForConnected() {
    if (this.connected) return 1;
    return new Promise((resolve) => {
      const myInterval = setInterval(() => {
        if (this.connected) {
          console.log(new Date().toISOString(), 'Redis connected');
          clearInterval(myInterval);
          resolve(1);
        } else {
          console.log(new Date().toISOString(), 'Redis connecting');
        }
      }, 1000);
    })
  }

  /*
  * Allocate the queue to specific shard in cluster mode
  * and move to the next shard to ensure the number of queues on each shard is nearly equal
  */
  private async getQueueKeyForNextMasterNode() {
    if (!this.isCluster) {
      return uuidv4();
    }
    this.slotInfo.currentNodeIndex++;
    if (this.slotInfo.currentNodeIndex > this.slotInfo.numOfMasterNode - 1) {
      this.slotInfo.currentNodeIndex = 0;
    }
    return await this.generateKeyForSlotRange(this.slotInfo.slotAllocate[this.slotInfo.currentNodeIndex].from, this.slotInfo.slotAllocate[this.slotInfo.currentNodeIndex].to);
  }

  /*
  * Each shard has the own slot range (ex: 0 - 8191)
  * Generate uuid key to match slot range of specific shard
  */
  private async generateKeyForSlotRange(fromSlot: number, toSlot: number): Promise<string> {
    const key = uuidv4();
    const slotNumber = await this.redis.call('cluster', 'keyslot', key);
    if (slotNumber >= fromSlot && slotNumber <= toSlot) {
      return key;
    }
    return await this.generateKeyForSlotRange(fromSlot, toSlot);
  }

  /*
  * Get list queue's name
  * @return {string[]} return array of all queue's name
  */
  public async listQueues(): Promise<string[]> {
    await this.waitForConnected();
    return await this.redis.smembers(this.getListQueueKey());
  }

  /*
  * Create queue
  * @param {*} options object of params needed
  * @param {string} options.name the name of queue, should contains only these characters a-z,A-Z, 0-0, _, -
  * @param {number} [options.visibilityTimeout=30] The message's invisible time, in seconds, after message received, it hidden until timeout
  * @param {number} [options.delay=0] The time in seconds that the delivery of all new messages in the queue will be delayed. Allowed values: 0-9999999 (around 115 days)
  * @param {number} [options.maxsize=65536] The maximum message size in bytes. Allowed values: 1024-65536 and -1 (for unlimited size)
  * @return {number} return 1 if queue created
  */
  public async createQueue(options: ICreateQueueOptions): Promise<number> {
    await this.waitForConnected();
    await this.validateObject(options, {
      name: ['required', 'regex:^([a-zA-Z0-9_-]){1,160}$'],
      visibilityTimeout: ['integer'],
      delay: ['integer', `min:${DELAY_MIN}`, `max:${DELAY_MAX}`],
      maxsize: ['integer', `min:${MESSAGE_MIN_SIZE}`, `max:${MESSAGE_MAX_SIZE}`],
    });
    const queueName = options.name;

    const vt = options.visibilityTimeout || DEFAULT_VISIBILITY_TIMEOUT;
    const delay = options.delay || DELAY_MIN;
    const maxsize = options.maxsize || MESSAGE_MAX_SIZE;

    const resp = await this.redis.time();
    const timestamp = resp[0] || Math.floor(Date.now() / 1000);
    const queueUid = await this.getQueueKeyForNextMasterNode();
    const {infoKey, uidKey} = getQueueKey({
      namespace: this.redisNamespace,
      queueName: queueName,
      queueUid: queueUid,
    });
    const result = await this.redis.call("hsetnx", uidKey, "uid", queueUid);
    if (result === 0) {
      throw new Error(ErrorMessageEnum.QUEUE_EXISTS);
    }

    const mc = [
      ["hsetnx", infoKey, "vt", vt],
      ["hsetnx", infoKey, "delay", delay],
      ["hsetnx", infoKey, "maxsize", maxsize],
      ["hsetnx", infoKey, "created", timestamp],
      ["hsetnx", infoKey, "modified", timestamp],
    ];

    await this.redis.multi(mc).exec();
    await this.redis.sadd(this.getListQueueKey(), queueName);
    return 1;
  }

  /*
  * Delete queue
  * @param {*} options object of params needed
  * @param {string} options.name the name of queue, should contains only these characters a-z,A-Z, 0-0, _, -
  * @return {number} return 1 if ok
  */
  public async deleteQueue(options: IDeleteQueueOptions): Promise<number> {
    await this.waitForConnected();
    await this.validateObject(options, {
      name: ['required'],
    });
    const { name } = options;

    const {queue} = await this.getQueueInfo(name);

    const {key, infoKey, uidKey} = getQueueKey({
      namespace: this.redisNamespace,
      queueName: name,
      queueUid: queue.uid,
    });
    // need exec 2 commands because of difference key pattern
    await Promise.all([
      this.redis.call("del", uidKey),
      this.redis.call("del", infoKey, key),
      this.redis.call("srem", this.getListQueueKey(), name),
    ])
    return 1;
  }

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
  public async getQueueAttributes(options: IGetQueueAttributesOptions): Promise<IQueue> {
    await this.validateObject(options, {
      name: ['required'],
    });

    const {queue, time} = await this.getQueueInfo(options.name);

    const {key, infoKey} = getQueueKey({
      namespace: this.redisNamespace,
      queueName: options.name,
      queueUid: queue.uid,
    })

    const mc = [
      ["hmget", infoKey, "vt", "delay", "maxsize", "totalReceived", "totalSent", "created", "modified"],
      ["zcard", key],
      ["zcount", key, time.currentTimestamp + "000", "+inf"]
    ];
    const results = await this.redis.multi(mc).exec();
    if (results[0][1] === null) {
      throw new Error(ErrorMessageEnum.QUEUE_NOT_FOUND);
    }
    return {
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
    };
  }

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
  public async setQueueAttributes(options: ISetQueueAttributesOptions) {
    await this.waitForConnected();
    await this.validateObject(options, {
      name: ['required'],
      maxsize: ['integer'],
      visibilityTimeout: ['integer'],
      delay: ['integer'],
    });
    const props: string[] = ["visibilityTimeout", "maxsize", "delay"]
    const attributes: string[] = []
    for (const item of props) {
      if (options[item]) {
        attributes.push(item);
      }
    }

    if (attributes.length === 0) {
      throw new Error(ErrorMessageEnum.NO_ATTRIBUTE_SUPPLY)
    }

    const { queue } = await this.getQueueInfo(options.name);
    const {infoKey} = getQueueKey({
      namespace: this.redisNamespace,
      queueName: options.name,
      queueUid: queue.uid,
    });
    const resp = await this.redis.time();

    const mc = [
      ["hset", infoKey, "modified", resp[0]]
    ];
    for (const item of attributes) {
      mc.push(["hset", infoKey, item === 'visibilityTimeout' ? 'vt' : item, options[item]])
    }
    await this.redis.multi(mc).exec();
    return await this.getQueueAttributes(options);
  }

  /*
  * Send message to the queue
  * @param {*} options object of params needed
  * @param {string} options.queueName the name of queue, should contains only these characters a-z,A-Z, 0-0, _, -
  * @param {string} options.message the message
  * @param {number} [options.delay=0] The time in seconds that the delivery of all new messages in the queue will be delayed. Allowed values: 0-9999999 (around 115 days)
  * @return {string} return message's id
  */
  public async sendMessage(options: ISendMessageOptions) {
    await this.waitForConnected();
    await this.validateObject(options, {
      queueName: ['required'],
      message: ['required', `min:${MESSAGE_MIN_SIZE}`, `max:${MESSAGE_MAX_SIZE}`],
      delay: ['integer', `min:${DELAY_MIN}`, `max:${DELAY_MAX}`],
    });
    const {queueName, message} = options || {};

    const { queue, time} = await this.getQueueInfo(queueName);
    const delay = options.delay != null ? options.delay : queue.delay;

    const {key, infoKey} = getQueueKey({
      namespace: this.redisNamespace,
      queueName: queueName,
      queueUid: queue.uid,
    });
    const messageId = Number(time.currentTimestamp + time.microsecond).toString(36) + '-' + uuidv4();
    const mc = [
      ["zadd", key, +time.currentTimestamp + delay * 1000, messageId],
      ["hset", infoKey, messageId, message],
      ["hincrby", infoKey, "totalSent", 1]
    ];
    await this.redis.multi(mc).exec();
    return messageId;
  }

  /*
  * Change visibility timeout of specific message
  * @param {*} options object of params needed
  * @param {string} options.queueName the name of queue, should contains only these characters a-z,A-Z, 0-0, _, -
  * @param {string} options.messageId the message's id
  * @param {number} options.visibilityTimeout The message's invisible time, in seconds, after message received, it hidden until timeout
  * @return {number} return 1 if ok
  */
  public async changeMessageVisibility(options: IChangeMessageVisibilityOptions) {
    await this.waitForConnected();
    await this.validateObject(options, {
      queueName: ['required'],
      messageId: ['required'],
      visibilityTimeout: ['required', 'integer']
    });
    const {queue, time} = await this.getQueueInfo(options.queueName);

    options.visibilityTimeout = options.visibilityTimeout || queue.visibilityTimeout;

    // Make really sure that the LUA script is loaded
    return await this.changeMessageVisibilityByScript(options, queue, time);

  }

  /*
  * Delete message from queue
  * @param {*} options object of params needed
  * @param {string} options.queueName the name of queue, should contains only these characters a-z,A-Z, 0-0, _, -
  * @param {string} options.messageId the message's id
  * @return {number} return 1 if ok, 0 if something went wrong
  */
  public async deleteMessage(options: IDeleteMessageOptions) {
    await this.waitForConnected();
    await this.validateObject(options, {
      queueName: ['required'],
      messageId: ['required'],
    });
    const {queue} = await this.getQueueInfo(options.queueName);
    const { messageId } = options;
    const {key, infoKey} = getQueueKey({
      namespace: this.redisNamespace,
      queueName: options.queueName,
      queueUid: queue.uid,
    });
    const mc = [
      ["zrem", key, messageId],
      ["hdel", infoKey, messageId, `${messageId}:rc`, `${messageId}:fr`]
    ];

    const resp = await this.redis.multi(mc).exec();
    return resp[0][1] === 1 && resp[1][1] > 0 ? 1 : 0;
  }

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
  public async popMessage(options: IPopMessageOptions) {
    await this.waitForConnected();
    await this.validateObject(options, {
      queueName: ['required'],
    });

    const { queue, time } = await this.getQueueInfo(options.queueName)
    return await this.popMessageByScript(options, queue, time);
  }

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
  public async receiveMessage(options: IReceiveMessageOptions) {
    await this.waitForConnected();
    await this.validateObject(options, {
      queueName: ['required'],
      visibilityTimeout: ['integer']
    });
    const { queue, time } = await this.getQueueInfo(options.queueName);
    options.visibilityTimeout = options.visibilityTimeout || queue.visibilityTimeout;

    return await this.receiveMessageByScript(options, queue, time);
  }

  /*
  * Disconnect the redis
  */
  async quit() {
    await this.redis.quit();
  }

  /*
  * Create scripts in redis
  */
  private async initScript() {
    // The popMessage LUA Script
    //
    // Parameters:
    //
    // KEYS[1]: the zset key
    // ARGV[1]: the current time in ms
    //
    // * Find a message id
    // * Get the message
    // * Increase the rc (receive count)
    // * Use hset to set the fr (first receive) time
    // * Return the message and the counters
    //
    // Returns:
    //
    // {id, message, totalReceived, firstReceiveTime}

    const popMessageScript = `local msg = redis.call("ZRANGEBYSCORE", KEYS[1], "-inf", ARGV[1], "LIMIT", "0", "1")
			if #msg == 0 then
				return {}
			end
			redis.call("HINCRBY", KEYS[1] .. ":Q", "totalReceived", 1)
			local mbody = redis.call("HGET", KEYS[1] .. ":Q", msg[1])
			local rc = redis.call("HINCRBY", KEYS[1] .. ":Q", msg[1] .. ":rc", 1)
			local o = {msg[1], mbody, rc}
			if rc==1 then
				table.insert(o, ARGV[1])
			else
				local fr = redis.call("HGET", KEYS[1] .. ":Q", msg[1] .. ":fr")
				table.insert(o, fr)
			end
			redis.call("ZREM", KEYS[1], msg[1])
			redis.call("HDEL", KEYS[1] .. ":Q", msg[1], msg[1] .. ":rc", msg[1] .. ":fr")
			return o`

    // The receiveMessage LUA Script
    //
    // Parameters:
    //
    // KEYS[1]: the zset key
    // ARGV[1]: the current time in ms
    // ARGV[2]: the new calculated time when the vt runs out
    //
    // * Find a message id
    // * Get the message
    // * Increase the rc (receive count)
    // * Use hset to set the fr (first receive) time
    // * Return the message and the counters
    //
    // Returns:
    //
    // {id, message, totalReceived, firstReceiveTime}

    const receiveMessageScript = `local msg = redis.call("ZRANGEBYSCORE", KEYS[1], "-inf", ARGV[1], "LIMIT", "0", "1")
			if #msg == 0 then
				return {}
			end
			redis.call("ZADD", KEYS[1], ARGV[2], msg[1])
			redis.call("HINCRBY", KEYS[1] .. ":Q", "totalReceived", 1)
			local mbody = redis.call("HGET", KEYS[1] .. ":Q", msg[1])
			local rc = redis.call("HINCRBY", KEYS[1] .. ":Q", msg[1] .. ":rc", 1)
			local o = {msg[1], mbody, rc}
			if rc==1 then
				redis.call("HSET", KEYS[1] .. ":Q", msg[1] .. ":fr", ARGV[1])
				table.insert(o, ARGV[1])
			else
				local fr = redis.call("HGET", KEYS[1] .. ":Q", msg[1] .. ":fr")
				table.insert(o, fr)
			end
			return o`;

    // The changeMessageVisibility LUA Script
    //
    // Parameters:
    //
    // KEYS[1]: the zset key
    // ARGV[1] the message id
    //
    //
    // * Find the message id
    // * Set the new timer
    //
    // Returns:
    //
    // 0 or 1

    const changeMessageVisibilityScript = `local msg = redis.call("ZSCORE", KEYS[1], ARGV[1])
			if not msg then
				return 0
			end
			redis.call("ZADD", KEYS[1], ARGV[2], ARGV[1])
			return 1`

    this.popMessageScriptId = await this.redis.script("load", popMessageScript);
    this.receiveMessageScriptId = await this.redis.script("load", receiveMessageScript);
    this.changeMessageVisibilityScriptId = await this.redis.script("load", changeMessageVisibilityScript);

    this.emit("scriptload:popMessage");
    this.emit("scriptload:receiveMessage");
    this.emit('scriptload:changeMessageVisibility');
  }

  /*
  * Create scripts in redis
  * @param {string} name queue's name
  * @return {*} return object queue, time in redis
  */
  private async getQueueInfo (name: string): Promise<{queue: IQueue; time: IRedisTime}> {
    const {uidKey} = getQueueKey({
      namespace: this.redisNamespace,
      queueName: name,
      queueUid: '',
    });
    const queue = await this.redis.call("hmget", uidKey, "uid");
    if (!queue || queue[0] === null) {
      throw new Error(ErrorMessageEnum.QUEUE_NOT_FOUND);
    }
    const queueUid = queue[0];
    const {infoKey} = getQueueKey({
      namespace: this.redisNamespace,
      queueName: name,
      queueUid: queueUid,
    });
    const commands = [
      ["hmget", infoKey, "vt", "delay", "maxsize"],
      ["time"]
    ];
    const results = await this.redis.multi(commands).exec();

    if (!results || results[0][1][0] === null || results[0][1][1] === null || results[0][1][2] === null) {
      throw new Error(ErrorMessageEnum.QUEUE_NOT_FOUND);
    }

    return {
      queue: {
        visibilityTimeout: parseInt(results[0][1][0], 10),
        delay: parseInt(results[0][1][1], 10),
        maxsize: parseInt(results[0][1][2], 10),
        uid: queueUid,
      },
      time: {
        currentTimestamp: +results[1][1][0],
        microsecond: padZeroLeft(Number(results[1][1][1]), 6)
      }
    };
  }

  private async changeMessageVisibilityByScript(options: IChangeMessageVisibilityOptions, queue: IQueue, time: IRedisTime) {
    const {key} = getQueueKey({
      namespace: this.redisNamespace,
      queueName: options.queueName,
      queueUid: queue.uid,
    });
    return await this.redis.evalsha(this.changeMessageVisibilityScriptId, 1, key, options.messageId, time.currentTimestamp + options.visibilityTimeout * 1000);
  }

  private async popMessageByScript(options: IPopMessageOptions, queue: IQueue, time: IRedisTime) {
    const {key} = getQueueKey({
      namespace: this.redisNamespace,
      queueName: options.queueName,
      queueUid: queue.uid,
    });
    const result = await this.redis.evalsha(this.popMessageScriptId, 1, key, time.currentTimestamp);
    return this.handleReceivedMessageResponse(result);
  }

  private async receiveMessageByScript (options: IReceiveMessageOptions, queue: IQueue, time: IRedisTime) {
    const {key} = getQueueKey({
      namespace: this.redisNamespace,
      queueName: options.queueName,
      queueUid: queue.uid,
    });
    const result = await this.redis.evalsha(this.receiveMessageScriptId, 1, key, time.currentTimestamp, time.currentTimestamp + (options.visibilityTimeout || 30) * 1000);
    return this.handleReceivedMessageResponse(result);
  }

  private handleReceivedMessageResponse(result: any) {
    if (!result.length) {
      return {}
    }
    return {
      id: result[0],
      message: result[1],
      totalReceived: result[2],
      firstReceivedTimestamp: Number(result[3]),
      createdAt: parseInt((parseInt(result[0].slice(0, 10), 36) / 1000).toString())
    }
  }

  private async validateObject(data: Record<string, any>, rules: any) {
    const result = await (new Validator(data, rules)).validate();
    if (result.error) {
      const { field, errors: [message]} = result.errors[0];
      throw new Error(`${field}: ${message}`);
    }
  }

  private getListQueueKey() {
    return `${this.redisNamespace}:queues`;
  }

}