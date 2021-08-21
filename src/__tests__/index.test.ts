import RedisClusterQueue from '../index';

const redisClusterQueue = new RedisClusterQueue({
  host: 'localhost',
  port: 6379
});

describe('RedisClusterQueue',  () => {

  const queueName = 'queue_' + new Date().getTime();
  it('Create queue', async () => {
    const result = await redisClusterQueue.createQueue({
      name: queueName,
    });

    expect(typeof result).toBe('number');
  });
  it('send message', async () => {
    const messageId = await redisClusterQueue.sendMessage({
      queueName: queueName,
      message: 'hihi'
    });
    console.log('result', messageId);
    expect(typeof messageId).toBe('string');
    await redisClusterQueue.sendMessage({
      queueName: queueName,
      message: 'haha'
    });
    const result = await redisClusterQueue.changeMessageVisibility({
      queueName: queueName,
      messageId,
      visibilityTimeout: 40,
    });
    console.log('change message visibility result', result);
    expect(typeof result).toBe('number');
  });
  it('get queue attribute', async () => {
    const attributes = await redisClusterQueue.getQueueAttributes({
      name: queueName,
    });
    expect(typeof attributes.uid).toBe('string');
    expect(typeof attributes.visibilityTimeout).toBe('number');
  });
  it('receive message and delete message', async () => {
    const message = await redisClusterQueue.receiveMessage({
      queueName: queueName,
    });
    expect(typeof message?.id).toBe('string');
    const deleted = await redisClusterQueue.deleteMessage({
      queueName: queueName,
      messageId: message.id,
    });
    expect(deleted).toBe(1);
  });
  it('send message', async () => {
    const messageId = await redisClusterQueue.sendMessage({
      queueName: queueName,
      message: 'hihi'
    });
    console.log('result', messageId);
    expect(typeof messageId).toBe('string');
  });
  it('set queue attribute', async () => {
    const attributes = await redisClusterQueue.setQueueAttributes({
      name: queueName,
      visibilityTimeout: 30,
      maxsize: 2000,
      delay: 0,
    });
    expect(typeof attributes.uid).toBe('string');
    expect(typeof attributes.visibilityTimeout).toBe('number');
  });
  it('pop message', async () => {
    const message = await redisClusterQueue.popMessage({
      queueName: queueName,
    });
    expect(typeof message?.id).toBe('string');
  });
  it('list queue', async () => {
    const queues = await redisClusterQueue.listQueues();
    console.log('queues', queues);
    console.log('queues', typeof queues);
    expect(typeof queues).toBe('object');
    expect(typeof queues[0]).toBe('string');
  });
  it('delete queue', async () => {
    const deleted = await redisClusterQueue.deleteQueue({
      name: queueName,
    });
    expect(deleted).toBe(1);
  });
})
afterAll(async () => {
  await redisClusterQueue.quit();
})