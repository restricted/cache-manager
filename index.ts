import * as Ioredis from 'ioredis';

/**
 * @class RedisDataCache
 * @description Redis backed data caching with partial find / update.
 * @version 0.0.1
 */
export class RedisDataCache {

    private url;
    private prefix = 'rdc:';
    private hostname = 'localhost';
    private port = 6379;
    private password = '';
    private redis: Ioredis.Redis;

    constructor(options?: { url?: string, hostname?: string, port?: number, password?: string, prefix?: string }) {
        if (options) {
            Object.keys(options).map(key => {
                this[key] = options[key];
            });
        }
        if (this.url) {
            this.redis = new Ioredis(this.url);
        } else {
            this.redis = new Ioredis({
                host: this.hostname,
                port: this.port,
                password: this.password,
                keyPrefix: this.prefix
            })
        }
    }

    addListener(event: string, listener: (...args: any) => void) {
        this.redis.on(event, listener);
    }

    onConnect(listener: (...args: any) => void) {
        this.addListener('connect', listener);
    }

    onReady(listener: (...args: any) => void) {
        this.addListener('ready', listener);
    }

    onClose(listener: (...args: any) => void) {
        this.addListener('close', listener);
    }

    onReconnect(listener: (...args: any) => void) {
        this.addListener('reconnecting', listener);
    }

    onEnd(listener: (...args: any) => void) {
        this.addListener('end', listener);
    }

    onSelect(listener: (...args: any) => void) {
        this.addListener('select', listener);
    }

    find<T>(options?: { fields?: string[], where?: any }) {

    }

    findById<T>(id: string | number, options?: { fields?: string[], where?: any }) {

    }

    findByIds<T>(id: string[] | number[], options?: { fields?: string[], where?: any }) {

    }

    create<T>(data: { id: string | number }) {

    }

    createBatch(data: { id: string | number }[]) {

    }

    update<T>(data: { id: string | number }) {

    }

    updatePartial<T>(id: string | number, key: string, data: any) {

    }

    delete<T>(data: { id: string | number }) {

    }


}
