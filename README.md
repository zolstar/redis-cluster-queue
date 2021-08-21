# Redis Cluster Queue

Simple queue on Redis Cluster and single redis instance. This plugin also supports AWS ElastiCache as well.
Auto discover redis is enable cluster mode or not and recreate connection again.

[![Build Status](https://app.travis-ci.com/zolstar/redis-cluster-queue.svg?branch=main)](https://app.travis-ci.com/zolstar/redis-cluster-queue.svg?branch=main)

## License

This plugin is licensed under the MIT license and can ve viewed in the LICENSE file.

## Installation

Install using [npm](https://npmjs.org)

```
npm install redis-cluster-queue --save
```

## Tests

IMPORTANT: You need to have Redis running to run tests

```
npm test
```

## Typescript

```ts
import { RedisClusterQueue } from 'redis-cluster-queue';

const redisClusterQueue = new RedisClusterQueue({
  host: 'localhost',
  port: 6379
});

const queueName = 'queue_' + new Date().getTime();

await redisClusterQueue.createQueue({
  name: queueName,
});

const messageId = await redisClusterQueue.sendMessage({
  queueName: queueName,
  message: 'hihi'
});

await redisClusterQueue.changeMessageVisibility({
  queueName: queueName,
  messageId,
  visibilityTimeout: 40,
});

const attributes = await redisClusterQueue.getQueueAttributes({
  name: queueName,
});

const message = await redisClusterQueue.receiveMessage({
  queueName: queueName,
});

const deleted = await redisClusterQueue.deleteMessage({
  queueName: queueName,
  messageId: message.id,
});

const queueAttributes = await redisClusterQueue.setQueueAttributes({
  name: queueName,
  visibilityTimeout: 30,
  maxsize: 2000,
  delay: 0,
});

const message2 = await redisClusterQueue.popMessage({
  queueName: queueName,
});

const queues = await redisClusterQueue.listQueues();

const queueDeleted = await redisClusterQueue.deleteQueue({
  name: queueName,
});
// in case you want to disconnect
await redisClusterQueue.quit();
```


### Methods

#### Constructor
Create a new instance of RedisClusterQueue

Parameters:

| Param        | Type           | Required | Default | Note  |
| ------------- |-------------| ---- | ---| -----|
| host     | string | true | | redis host name |
| port      | number     | true | |   redis port number |
| password | string     |    false | | redis auth password |
| namespace | string     |    false | rcq | namespace for the queue
| keyPrefix | string     |    false |  | redis prefix's key for whole project

#### listQueues()
Get list queue's name

Return array: 
######`['queue_1']`

---

#### createQueue(options)
Create queue

Params of options:

| Param        | Type           | Required | Default | Note  |
| ------------- |-------------| ---- | ---| -----|
| name     | string | true | | the name of queue, should contains only these characters a-z,A-Z, 0-0, _, - |
| visibilityTimeout     | number | false | 30 | The message's invisible time, in seconds, after message received, it hidden until timeout |
| delay     | number | false | 0 | The time in seconds that the delivery of all new messages in the queue will be delayed. Allowed values: 0-9999999 (around 115 days) |
| maxsize     | number | false | 65536 | The maximum message size in bytes. Allowed values: 1024-65536 |

Return: 
######`1` if queue created

---

#### deleteQueue(options)
Delete queue

Params of options:

| Param        | Type           | Required | Default | Note  |
| ------------- |-------------| ---- | ---| -----|
| name     | string | true | | the name of queue, should contains only these characters a-z,A-Z, 0-0, _, - |

Return: 
######`1` if queue deleted

---

#### getQueueAttributes(options)
Get queue's attributes

Params of options:

| Param        | Type           | Required | Default | Note  |
| ------------- |-------------| ---- | ---| -----|
| name     | string | true | | the name of queue, should contains only these characters a-z,A-Z, 0-0, _, - |

Return Object: 

| Property | Type | Note |
|---|---| --- |
| visibilityTimeout | number | The message's invisible time, in seconds, after message received, it hidden until timeout |
| delay | number | The time in seconds that the delivery of all new messages in the queue will be delayed |
| maxsize | number | The maximum message size in bytes |
| totalReceived | number | The total number of message received |
| totalSent | number | The total number of message sent to queue |
| created | number | The timestamp when queue created |
| modified | number | The timestamp when the last time queue modified |
| uid | string | Queue's unique id |
| numOfMessages | number | Current number of messages in queue |
| numOfHiddenMessages | number | Current number of messages in flight |

---

#### setQueueAttributes(options)
Get queue's attributes

Params of options(*Requires at least one in three params visibilityTimeout, delay, maxsize*):

| Param        | Type           | Required | Default | Note  |
| ------------- |-------------| ---- | ---| -----|
| name     | string | true | | the name of queue, should contains only these characters a-z,A-Z, 0-0, _, - |
| visibilityTimeout     | number | false | 30 | The message's invisible time, in seconds, after message received, it hidden until timeout |
| delay     | number | false | 0 | The time in seconds that the delivery of all new messages in the queue will be delayed. Allowed values: 0-9999999 (around 115 days) |
| maxsize     | number | false | 65536 | The maximum message size in bytes. Allowed values: 1024-65536 |

Return Object: 

| Property | Type | Note |
|---|---| --- |
| visibilityTimeout | number | The message's invisible time, in seconds, after message received, it hidden until timeout |
| delay | number | The time in seconds that the delivery of all new messages in the queue will be delayed |
| maxsize | number | The maximum message size in bytes |
| totalReceived | number | The total number of message received |
| totalSent | number | The total number of message sent to queue |
| created | number | The timestamp when queue created |
| modified | number | The timestamp when the last time queue modified |
| uid | string | Queue's unique id |
| numOfMessages | number | Current number of messages in queue |
| numOfHiddenMessages | number | Current number of messages in flight |

---

#### sendMessage(options)
Send a message to the queue

Params of options:

| Param        | Type           | Required | Default | Note  |
| ------------- |-------------| ---- | ---| -----|
| queueName     | string | true | | the name of queue, should contains only these characters a-z,A-Z, 0-0, _, - |
| message     | string | true |  |  |
| delay     | number | false | 0 | The time in seconds that the delivery of all new messages in the queue will be delayed. Allowed values: 0-9999999 (around 115 days) |

Return message's id: 

######`g1mia8gfux-b336fd53-d4ea-4b1e-8fad-c6217e313133`

---

#### popMessage(options)
Get and delete one message immediately from queue

Params of options:

| Param        | Type           | Required | Default | Note  |
| ------------- |-------------| ---- | ---| -----|
| queueName     | string | true | | the name of queue, should contains only these characters a-z,A-Z, 0-0, _, - |

Return Object: 

| Property | Type | Note |
|---|---| --- |
| id | string | message's id |
| message | string | message's content |
| totalReceived | number | total time received of this message |
| firstReceivedTimestamp | number | the timestamp of first time received of this message |
| createdAt | number | the timestamp when message created |

---

#### receiveMessage(options)
Get message from queue

Params of options:

| Param        | Type           | Required | Default | Note  |
| ------------- |-------------| ---- | ---| -----|
| queueName     | string | true | | the name of queue, should contains only these characters a-z,A-Z, 0-0, _, - |
| visibilityTimeout | number | false | | The message's invisible time, in seconds, after message received, it hidden until timeout |

Return Object: 

| Property | Type | Note |
|---|---| --- |
| id | string | message's id |
| message | string | message's content |
| totalReceived | number | total time received of this message |
| firstReceivedTimestamp | number | the timestamp of first time received of this message |
| createdAt | number | the timestamp when message created |

---

#### deleteMessage(options)
Delete the message from queue

Params of options:

| Param        | Type           | Required | Default | Note  |
| ------------- |-------------| ---- | ---| -----|
| queueName     | string | true | | the name of queue, should contains only these characters a-z,A-Z, 0-0, _, - |
| messageId | string | true | | The message's id |

Return: 
######`1` if message deleted

---

#### changeMessageVisibility(options)
Change visibility timeout of specific message

Params of options:

| Param        | Type           | Required | Default | Note  |
| ------------- |-------------| ---- | ---| -----|
| queueName     | string | true | | the name of queue, should contains only these characters a-z,A-Z, 0-0, _, - |
| messageId | string | true | | The message's id |
| visibilityTimeout     | number | true | 30 | The message's invisible time, in seconds, after message received, it hidden until timeout |

Return: 
######`1` if ok

---

#### quit()
Disconnect redis