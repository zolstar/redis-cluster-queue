export interface IRedisClusterQueueOptions {
    host: string;
    port: number;
    password?: string;
    namespace?: string;
    realtime?: boolean;
    keyPrefix?: string;
}
export interface ICreateQueueOptions {
    name: string;
    visibilityTimeout?: number;
    delay?: number;
    maxsize?: number;
}
export interface IDeleteQueueOptions {
    name: string;
}
export interface IGetQueueAttributesOptions {
    name: string;
}
export interface ISetQueueAttributesOptions {
    name: string;
    visibilityTimeout?: number;
    maxsize?: number;
    delay?: number;
    [key: string]: any;
}
export interface ISendMessageOptions {
    queueName: string;
    delay?: number;
    message: string;
}
export interface IQueue {
    uid: string;
    visibilityTimeout: number;
    delay: number;
    maxsize: number;
    totalReceived?: number;
    totalSent?: number;
    created?: number;
    modified?: number;
    numOfMessages?: number;
    numOfHiddenMessages?: number;
}
export interface IRedisTime {
    currentTimestamp: number;
    microsecond: string;
}
export interface IChangeMessageVisibilityOptions {
    queueName: string;
    messageId: string;
    visibilityTimeout: number;
}
export interface IDeleteMessageOptions {
    queueName: string;
    messageId: string;
}
export interface IPopMessageOptions {
    queueName: string;
}
export interface IReceiveMessageOptions {
    queueName: string;
    visibilityTimeout?: number;
}
export interface IQueueKeyParams {
    namespace: string;
    queueName: string;
    queueUid: string;
}
export interface ISlotInfo {
    currentNodeIndex: number;
    numOfMasterNode: number;
    slotAllocate: {
        [key: string]: {
            from: number;
            to: number;
        };
    };
}
