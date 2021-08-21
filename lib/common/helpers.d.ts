import { IQueueKeyParams } from './interfaces';
export declare function uuidv4(): string;
export declare function padZeroLeft(num: number, count: number): string;
export declare function getQueueKey(params: IQueueKeyParams): {
    key: string;
    uidKey: string;
    infoKey: string;
};
