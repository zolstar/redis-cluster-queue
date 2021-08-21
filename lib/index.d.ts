/// <reference types="node" />
import { EventEmitter } from "events";
import { IChangeMessageVisibilityOptions, ICreateQueueOptions, IDeleteMessageOptions, IDeleteQueueOptions, IGetQueueAttributesOptions, IPopMessageOptions, IQueue, IReceiveMessageOptions, IRedisClusterQueueOptions, ISendMessageOptions, ISetQueueAttributesOptions } from './common/interfaces';
export default class RedisClusterQueue extends EventEmitter {
    private options;
    private connected;
    private readonly redisNamespace;
    private redis;
    private changeMessageVisibilityScriptId;
    private popMessageScriptId;
    private receiveMessageScriptId;
    private isCluster;
    private slotInfo;
    constructor(options?: IRedisClusterQueueOptions);
    private initCLuster;
    waitForConnected(): Promise<unknown>;
    private getQueueKeyForNextMasterNode;
    private generateKeyForSlotRange;
    listQueues(): Promise<string[]>;
    createQueue(options: ICreateQueueOptions): Promise<number>;
    deleteQueue(options: IDeleteQueueOptions): Promise<number>;
    getQueueAttributes(options: IGetQueueAttributesOptions): Promise<IQueue>;
    setQueueAttributes(options: ISetQueueAttributesOptions): Promise<IQueue>;
    sendMessage(options: ISendMessageOptions): Promise<string>;
    changeMessageVisibility(options: IChangeMessageVisibilityOptions): Promise<any>;
    deleteMessage(options: IDeleteMessageOptions): Promise<0 | 1>;
    popMessage(options: IPopMessageOptions): Promise<{
        id?: undefined;
        message?: undefined;
        totalReceived?: undefined;
        firstReceivedTimestamp?: undefined;
        createdAt?: undefined;
    } | {
        id: any;
        message: any;
        totalReceived: any;
        firstReceivedTimestamp: number;
        createdAt: number;
    }>;
    receiveMessage(options: IReceiveMessageOptions): Promise<{
        id?: undefined;
        message?: undefined;
        totalReceived?: undefined;
        firstReceivedTimestamp?: undefined;
        createdAt?: undefined;
    } | {
        id: any;
        message: any;
        totalReceived: any;
        firstReceivedTimestamp: number;
        createdAt: number;
    }>;
    quit(): Promise<void>;
    private initScript;
    private getQueueInfo;
    private changeMessageVisibilityByScript;
    private popMessageByScript;
    private receiveMessageByScript;
    private handleReceivedMessageResponse;
    private validateObject;
    private getListQueueKey;
}
