import * as Ioredis from 'ioredis';
import * as EventEmitter from 'events';

/**
 * @description Interface for type checking
 */
export interface Type<T> extends Function {
    new(...args: any[]): T;
}

/**
 * @class RedisDataCache
 * @description Redis backed data caching with partial find / update.
 * @version 0.0.3
 */
export class RedisDataCache {

    /**
     * Debug
     */
    private debug = true;
    /**
     * Local event emmiter for events
     */
    private eventEmmiter: EventEmitter = new EventEmitter();
    /**
     * Redis connection host
     */
    private hostname = 'localhost';
    /**
     * Field name for id
     */
    private idField = 'id';
    /**
     * Redis connection password
     */
    private password = '';
    /**
     * Redis connection port
     */
    private port = 6379;
    /**
     * Redis prefix for keys
     */
    private prefix = 'rdc:';
    /**
     * Redis connection
     */
    private redis: Ioredis.Redis;
    /**
     * Redis connection url
     */
    private url;

    /**
     * Parse connection settings and create redis connection
     * @param options
     */
    constructor(options?: { url?: string, hostname?: string, port?: number, password?: string, prefix?: string, debug?: boolean }) {
        this.eventEmmiter.setMaxListeners(10000);
        if (options) {
            Object.keys(options).map(key => {
                this[key] = options[key];
            });
        }
        this.createRedisInstance();
    }

    /**
     * Clear keys with current prefix
     */
    async clear() {
        try {
            const keys = await this.redis.keys(this.prefix + '*');
            if (keys.length === 0) {
                this.eventEmmiter.emit('Clear');
                return Promise.resolve(null);
            } else {
                await Promise.all(await keys.map(async key => {
                    return this.redis.del(key.substr(this.prefix.length));
                }));
                this.eventEmmiter.emit('Clear');
                return true;
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Attach event listener for 'Clear' method
     * @param callback Function
     */
    cleared(callback: any) {
        this.eventEmmiter.on('Clear', callback);
    }

    /**
     * Connect to Redis (async)
     */
    async connect(): Promise<any> {
        if (['connect', 'connecting', 'connected', 'ready'].indexOf(this.status()) === -1) {
            if (this.debug) {
                console.info('STATE Redis connect.');
            }
            return await this.redis.connect();
        } else {
            if (this.debug) {
                console.info('STATE Redis already connected.');
            }
            return Promise.resolve();
        }
    }

    /**
     * Async / await create object in Redis
     * @param data Instance of class
     */
    async create<T>(data: T): Promise<string> {

        let className = data.constructor.name;

        if (this.debug) {
            console.info('STATE CREATE: ' + (className) + ' id: ' + data[this.idField]);
            console.debug(data);
        }
        try {
            const created = await this.redis.set(className + '_' + data[this.idField], JSON.stringify(data));
            this.eventEmmiter.emit('Create_' + className, data);
            return Promise.resolve(created);
        } catch (e) {
            return Promise.reject(new Error(e));
        }
    }

    /**
     * Async / await create array of objects in Redis
     * @param data Array of instances of any classes
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
                    return await this.create(d);
                } catch (e) {
                    return Promise.reject(new Error(e));
                }
            }));
        } else {
            return Promise.reject(new Error('No array or empty array specified'));
        }
    }

    created<T>(type: Type<T>, callback: any) {
        this.eventEmmiter.on('Create_' + type.name, callback);
    }

    deleted<T>(type: Type<T>, callback: any) {
        this.eventEmmiter.on('Delete_' + type.name, callback);
    }

    deletedById<T>(type: Type<T>, id: string | number, callback: any) {
        this.eventEmmiter.on('Delete_' + type.name + '_' + id, callback);
    }

    /**
     * Delete object from Redis
     * @param type Class
     * @param id Instance id
     */
    async delete<T>(type: Type<T>, id: string | number): Promise<any> {
        if (this.debug) {
            console.info('STATE delete: ' + type.name + ' id: ' + id);
        }
        try {
            await this.redis.del(type.name + '_' + id);
            this.eventEmmiter.emit('Delete_' + type.name, id);
            this.eventEmmiter.emit('Delete_' + type.name + '_' + id, id);
            return Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
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

    async exists<T>(type: Type<T>, id: string | number) {
        if (this.debug) {
            console.info('STATE exists: ' + type.name + ' id: ' + id);
        }

        return this.redis.exists(type.name + '_' + id);
    }

    /**
     * Async / await find all
     * @param type Class
     * @param fields (optional) array of fetched fields
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
     * @param type Class
     * @param id Id of object
     * @param fields (optional) array of fetched fields
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
     * @param type Class
     * @param ids Array of object ids
     * @param fields (optional) array of fetched fields
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
     * Redis on close listener
     * @param listener Callback for listen on close
     */
    onClose(listener: () => void) {
        this.addListener('close', listener);
    }

    /**
     * Redis on connect listener
     * @param listener Callback for listen on connect
     */
    onConnect(listener: () => void) {
        this.addListener('connect', listener);
    }

    /**
     * Redis on end listener
     * @param listener Callback for listen on end
     */
    onEnd(listener: () => void) {
        this.addListener('end', listener);
    }

    /**
     * Redis on error listener
     * @param listener Callback for listen on error
     */
    onError(listener: () => void) {
        this.addListener('reconnecting', listener);
    }

    /**
     * Redis on ready listener
     * @param listener Callback for listen on ready
     */
    onReady(listener: () => void) {
        this.addListener('ready', listener);
    }

    /**
     * Redis on reconnect listener
     * @param listener Callback for listen on reconnect
     */
    onReconnect(listener: () => void) {
        this.addListener('reconnecting', listener);
    }

    /**
     * Redis on select listener
     * @param listener Callback for listen on select
     */
    onSelect(listener: () => void) {
        this.addListener('select', listener);
    }

    /**
     * Set field name for id dynamically
     * @param name id field
     */
    setIdFieldName(name: string) {
        this.idField = name;
    }

    /**
     * Set prefix for keys
     * @param prefix Prefix for keys
     */
    setPrefix(prefix: string) {
        this.prefix = prefix;
        this.createRedisInstance();
    }

    /**
     * Redis current connection status
     */
    status() {
        return this.redis.status;
    }

    /**
     * Async / await update object in Redis
     * @param data Instance of class
     */
    async update<T>(data: T): Promise<string> {
        let className = data.constructor.name;
        if (this.debug) {
            console.info('STATE update: ' + className + ' id: ' + data[this.idField]);
        }
        try {
            const updated = await this.redis.set(className + '_' + data[this.idField], JSON.stringify(data));
            this.eventEmmiter.emit('Update_' + className + '_' + data[this.idField], data);
            this.eventEmmiter.emit('Update_' + className, data);
            return Promise.resolve(updated);
        } catch (e) {
            return Promise.reject(new Error(e));
        }
    }

    /**
     * Async / await update object partial (Object.assign)
     * @param type Class
     * @param data Partial Object
     */
    async updatePartial<T>(type: Type<T>, data: T): Promise<string> {
        if (this.debug) {
            console.info('STATE partial update: ' + type.name + ' id: ' + data[this.idField]);
        }
        let find: T = await this.findById<T>(type, data[this.idField]);
        return this.update(Object.assign(find, data));
    }

    /**
     * Attach listener to EventEmmiter on update by id
     * @param type Class
     * @param id Object id
     * @param callback Function
     */
    updatedById<T>(type: Type<T>, id: string | number, callback: any) {
        this.eventEmmiter.on('Update_' + type.name + '_' + id, callback);
    }

    /**
     * Attach listener to EventEmmiter on update any
     * @param type Class
     * @param callback Function
     */
    updated<T>(type: Type<T>, callback: any) {
        this.eventEmmiter.on('Update_' + type.name, callback);
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
     * Filter object properties by provided fields
     * @private
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
