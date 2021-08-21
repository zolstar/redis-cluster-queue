import { IQueueKeyParams } from './interfaces';

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function padZeroLeft(num: number, count: number) {
  return ((Math.pow(10, count) + num) + "").substr(1);
}

export function getQueueKey(params: IQueueKeyParams) {
  const key = `${params.namespace}:${params.queueName}:{${params.queueUid}}`;
  return {
    key,
    uidKey: `${params.namespace}:${params.queueName}`,
    infoKey: `${key}:Q`,
  }
}