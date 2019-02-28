import * as Ioredis from 'ioredis';

/**
 * @description Interface for type checking
 */
export interface Type<T> extends Function {
    new(...args: any[]): T;
}

/**
 * @class RedisDataCache
 * @description Redis backed data caching with partial find / update.
 * @version 0.0.1
 */
export class RedisDataCache {

    /**
     * Redis connection url
     */
    private url;

    /**
     * Redis prefix for keys
     */
    private prefix = 'rdc:';

    /**
     * Redis connection host
     */
    private hostname = 'localhost';

    /**
     * Redis connection port
     */
    private port = 6379;

    /**
     * Redis connection password
     */
    private password = '';

    /**
     * Redis connection
     */
    private redis: Ioredis.Redis;

    /**
     * Debug
     */
    private debug = true;

    /**
     * Field name for id
     */
    private idField = 'id';

    /**
     * Parse connection settings and create redis connection
     * @param options
     */
    constructor(options?: { url?: string, hostname?: string, port?: number, password?: string, prefix?: string }) {
        if (options) {
            Object.keys(options).map(key => {
                this[key] = options[key];
            });
        }
        this.createRedisInstance();
    }

    /**
     * Set field name for id dynamically
     * @param name
     */
    setIdFieldName(name: string) {
        this.idField = name;
    }

    /**
     * Set prefix for keys
     * @param prefix
     */
    setPrefix(prefix: string) {
        this.prefix = prefix;
        this.createRedisInstance();
    }

    /**
     * Redis on connect listener
     * @param listener
     */
    onConnect(listener: () => void) {
        this.addListener('connect', listener);
    }

    /**
     * Redis on ready listener
     * @param listener
     */
    onReady(listener: () => void) {
        this.addListener('ready', listener);
    }

    /**
     * Redis on close listener
     * @param listener
     */
    onClose(listener: () => void) {
        this.addListener('close', listener);
    }

    /**
     * Redis on reconnect listener
     * @param listener
     */
    onReconnect(listener: () => void) {
        this.addListener('reconnecting', listener);
    }

    /**
     * Redis on error listener
     * @param listener
     */
    onError(listener: () => void) {
        this.addListener('reconnecting', listener);
    }

    /**
     * Redis on end listener
     * @param listener
     */
    onEnd(listener: () => void) {
        this.addListener('end', listener);
    }

    /**
     * Redis on select listener
     * @param listener
     */
    onSelect(listener: () => void) {
        this.addListener('select', listener);
    }

    /**
     * Disconnect from Redis server
     */
    disconnect() {
        if (this.debug) {
            console.info('STATE Redis disconnect.');
        }
        return this.redis.disconnect();
    }

    /**
     * Async / await find all
     * @param type
     * @param fields
     */
    async find<T>(type: Type<T>, fields?: string[]): Promise<any> {
        let classname = type.name;

        if (!classname) {
            return Promise.reject('No class specified!');
        }

        if (this.debug) {
            console.info('STATE find: ' + (classname));
        }

        try {
            const keys = await this.redis.keys(classname + '_*');
            if (keys.length === 0) {
                return Promise.resolve(null);
            } else {
                const arr = await this.redis.mget(keys);
                return Promise.resolve(arr.map(s => {
                    let tmpObject: T = new type();
                    if (fields) {
                        tmpObject = Object.assign(tmpObject, this.filterObject<T>(this.filterObject<T>(JSON.parse(s), fields), fields));
                    } else {
                        tmpObject = Object.assign(tmpObject, JSON.parse(s));
                    }
                    return tmpObject;
                }));
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Async / await find by id
     * @param type
     * @param id
     * @param fields
     */
    async findById<T>(type: Type<T>, id: string | number, fields?: string[]): Promise<T> {

        let classname = type.name;

        if (!classname) {
            return Promise.reject('No class specified!');
        }

        if (this.debug) {
            console.info('STATE findById: ' + (classname) + ' id: ' + id);
        }

        try {
            const result = JSON.parse(await this.redis.get(classname + '_' + id));
            if (!result) {
                return Promise.resolve(null);
            }
            let tmpObject: T = new type();
            if (fields) {
                tmpObject = Object.assign(tmpObject, this.filterObject<T>(this.filterObject<T>(result, fields), fields));
            } else {
                tmpObject = Object.assign(tmpObject, result);
            }
            return Promise.resolve(tmpObject);
        } catch (e) {
            return Promise.reject(e);
        }

    }

    /**
     * Async / await find many by ids
     * @param type
     * @param ids
     * @param fields
     */
    async findByIds<T>(type: Type<T>, ids: any[], fields?: string[]) {

        let classname = type.name;

        if (!classname) {
            return Promise.reject('No class specified!');
        }

        const keys = ids.map(id => {
            return type.name + '_' + id.toString();
        });

        if (this.debug) {
            console.info('STATE findByIds: ' + (classname) + ' ids: ' + ids.join(', '));
        }

        try {
            if (keys.length === 0) {
                return Promise.resolve(null);
            } else {
                const arr = await this.redis.mget(keys);
                return Promise.resolve(arr.filter(s => s).map(s => {
                    let tmpObject: T = new type();
                    if (fields) {
                        tmpObject = Object.assign(tmpObject, this.filterObject<T>(this.filterObject<T>(JSON.parse(s), fields), fields));
                    } else {
                        tmpObject = Object.assign(tmpObject, JSON.parse(s));
                    }
                    return tmpObject;
                }));
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Async / await create object in Redis
     * @param data
     */
    async create<T>(data: T): Promise<string> {

        let className = data.constructor.name;

        if (this.debug) {
            console.info('STATE CREATE: ' + (className) + ' id: ' + data[this.idField]);
            console.debug(data);
        }

        try {
            return await this.redis.set(className + '_' + data[this.idField], JSON.stringify(data));
        } catch (e) {
            return Promise.reject(new Error(e));
        }
    }

    /**
     * Async / await create array of objects in Redis
     * @param data
     */
    async createBatch<T>(data: T[]): Promise<string[]> {

        if (data && data.length > 0) {
            return Promise.all(await data.map(async d => {
                let className = d.constructor.name;

                if (this.debug) {
                    console.info('STATE CREATE: ' + (className) + ' id: ' + d[this.idField]);
                    console.debug(d);
                }

                try {
                    return await this.redis.set(className + '_' + d[this.idField], JSON.stringify(d));
                } catch (e) {
                    return Promise.reject(new Error(e));
                }
            }));
        } else {
            return Promise.reject(new Error('No array or empty array specified'));
        }
    }

    /**
     * Async / await update object in Redis
     * @param data
     */
    async update<T>(data: T): Promise<string> {
        if (this.debug) {
            console.info('STATE update: ' + data.constructor.name + ' id: ' + data[this.idField]);
        }
        return this.create(data);
    }

    /**
     * Async / await update object partial (Object.assign)
     * @param type
     * @param data
     */
    async updatePartial<T>(type: Type<T>, data: T): Promise<string> {
        if (this.debug) {
            console.info('STATE partial update: ' + type.name + ' id: ' + data[this.idField]);
        }
        let find: T = await this.findById<T>(type, data[this.idField]);
        return this.create(Object.assign(find, data));
    }

    async connect() {
        if (['connect', 'connecting', 'connected', 'ready'].indexOf(this.status()) === -1) {
            return await this.redis.connect();
        } else {
            return Promise.resolve();
        }
    }

    status() {
        return this.redis.status;
    }

    /**
     * Delete object from Redis
     * @param type
     * @param id
     */
    delete<T>(type: Type<T>, id: string | number) {
        if (this.debug) {
            console.info('STATE delete: ' + type.name + ' id: ' + id);
        }

        return this.redis.del(type.name + '_' + id);
    }

    async exists<T>(type: Type<T>, id: string | number) {
        if (this.debug) {
            console.info('STATE exists: ' + type.name + ' id: ' + id);
        }

        return this.redis.exists(type.name + '_' + id);
    }

    /**
     * Clear keys with current prefix
     */
    async clear() {
        try {
            const keys = await this.redis.keys(this.prefix + '*');
            if (keys.length === 0) {
                return Promise.resolve(null);
            } else {
                return Promise.all(await keys.map(async key => {
                    return this.redis.del(key.substr(this.prefix.length));
                }));
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Create Redis instance
     */
    private createRedisInstance() {
        if (this.url) {
            this.redis = new Ioredis(this.url);
        } else {
            this.redis = new Ioredis({
                host: this.hostname,
                port: this.port,
                password: this.password,
                keyPrefix: this.prefix,
                ready: true
            });
        }
    }

    /**
     * Add listener for Redis events
     * @param event
     * @param listener
     */
    private addListener(event: string, listener: () => void) {
        this.redis.on(event, listener);
    }

    /**
     * Filter object properties by provided fields
     * @param obj
     * @param fields
     */
    private filterObject<T>(obj, fields): T {
        const t: T = <T>{};
        Object.keys(obj).map(k => {
            if (fields.indexOf(k) > -1) {
                t[k] = obj[k];
            }
        });
        return t;
    }

}
