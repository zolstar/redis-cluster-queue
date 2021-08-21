export const DEFAULT_VISIBILITY_TIMEOUT = 30;
export const DELAY_MIN = 0;
export const DELAY_MAX = 9999999;
export const MESSAGE_MIN_SIZE = 1024;
export const MESSAGE_MAX_SIZE = 65536;
export enum ErrorMessageEnum {
  QUEUE_EXISTS = 'Queue exists',
  QUEUE_NOT_FOUND = 'Queue not found',
  NO_ATTRIBUTE_SUPPLY = 'No attribute was supplied',
}