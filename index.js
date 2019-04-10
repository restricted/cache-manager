"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var Ioredis = require("ioredis");
var EventEmitter = require("events");
/**
 * @class RedisDataCache
 * @description Redis backed data caching with partial find / update.
 * @version 0.0.6
 */
var RedisDataCache = /** @class */ (function () {
    /**
     * Parse connection settings and create redis connection
     * @param options
     */
    function RedisDataCache(options) {
        var _this = this;
        /**
         * Debug
         */
        this.debug = true;
        /**
         * Local event emmiter for events
         */
        this.eventEmmiter = new EventEmitter();
        /**
         * Redis connection host
         */
        this.hostname = 'localhost';
        /**
         * Field name for id
         */
        this.idField = 'id';
        /**
         * Redis connection password
         */
        this.password = '';
        /**
         * Redis connection port
         */
        this.port = 6379;
        /**
         * Redis prefix for keys
         */
        this.prefix = 'rdc:';
        this.eventEmmiter.setMaxListeners(10000);
        if (options) {
            Object.keys(options).map(function (key) {
                _this[key] = options[key];
            });
        }
        this.createRedisInstance();
    }
    /**
     * Clear keys with current prefix
     */
    RedisDataCache.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            var keys, _a, _b, e_1;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.redis.keys(this.prefix + '*')];
                    case 1:
                        keys = _c.sent();
                        if (!(keys.length === 0)) return [3 /*break*/, 2];
                        this.eventEmmiter.emit('Clear');
                        return [2 /*return*/, Promise.resolve(null)];
                    case 2:
                        _b = (_a = Promise).all;
                        return [4 /*yield*/, keys.map(function (key) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, this.redis.del(key.substr(this.prefix.length))];
                                });
                            }); })];
                    case 3: return [4 /*yield*/, _b.apply(_a, [_c.sent()])];
                    case 4:
                        _c.sent();
                        this.eventEmmiter.emit('Clear');
                        return [2 /*return*/, true];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_1 = _c.sent();
                        return [2 /*return*/, Promise.reject(e_1)];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Attach event listener for 'Clear' method
     * @param callback Function
     */
    RedisDataCache.prototype.cleared = function (callback) {
        this.eventEmmiter.on('Clear', callback);
    };
    /**
     * Connect to Redis (async)
     */
    RedisDataCache.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(['connect', 'connecting', 'connected', 'ready'].indexOf(this.status()) === -1)) return [3 /*break*/, 2];
                        if (this.debug) {
                            console.info('STATE Redis connect.');
                        }
                        return [4 /*yield*/, this.redis.connect()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        if (this.debug) {
                            console.info('STATE Redis already connected.');
                        }
                        return [2 /*return*/, Promise.resolve()];
                }
            });
        });
    };
    /**
     * Async / await create object in Redis
     * @param data Instance of class
     */
    RedisDataCache.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var className, created, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        className = data.constructor.name;
                        if (this.debug) {
                            console.info('STATE CREATE: ' + (className) + ' id: ' + data[this.idField]);
                            console.debug(data);
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.redis.set(className + '_' + data[this.idField], JSON.stringify(data))];
                    case 2:
                        created = _a.sent();
                        this.eventEmmiter.emit('Create_' + className, data);
                        return [2 /*return*/, Promise.resolve(created)];
                    case 3:
                        e_2 = _a.sent();
                        return [2 /*return*/, Promise.reject(new Error(e_2))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Async / await create array of objects in Redis
     * @param data Array of instances of any classes
     */
    RedisDataCache.prototype.createBatch = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(data && data.length > 0)) return [3 /*break*/, 2];
                        _b = (_a = Promise).all;
                        return [4 /*yield*/, data.map(function (d) { return __awaiter(_this, void 0, void 0, function () {
                                var className, e_3;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            className = d.constructor.name;
                                            if (this.debug) {
                                                console.info('STATE CREATE: ' + (className) + ' id: ' + d[this.idField]);
                                                console.debug(d);
                                            }
                                            _a.label = 1;
                                        case 1:
                                            _a.trys.push([1, 3, , 4]);
                                            return [4 /*yield*/, this.create(d)];
                                        case 2: return [2 /*return*/, _a.sent()];
                                        case 3:
                                            e_3 = _a.sent();
                                            return [2 /*return*/, Promise.reject(new Error(e_3))];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1: return [2 /*return*/, _b.apply(_a, [_c.sent()])];
                    case 2: return [2 /*return*/, Promise.reject(new Error('No array or empty array specified'))];
                }
            });
        });
    };
    /**
     * Attach listener to any created object of class event
     * @param type
     * @param callback
     */
    RedisDataCache.prototype.created = function (type, callback) {
        this.eventEmmiter.on('Create_' + type.name, callback);
    };
    /**
     * Delete object from Redis
     * @param type Class
     * @param id Instance id
     */
    RedisDataCache.prototype["delete"] = function (type, id) {
        return __awaiter(this, void 0, void 0, function () {
            var e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.debug) {
                            console.info('STATE delete: ' + type.name + ' id: ' + id);
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.redis.del(type.name + '_' + id)];
                    case 2:
                        _a.sent();
                        this.eventEmmiter.emit('Delete_' + type.name, id);
                        this.eventEmmiter.emit('Delete_' + type.name + '_' + id, id);
                        return [2 /*return*/, Promise.resolve()];
                    case 3:
                        e_4 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_4)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Attach listener to any deleted object of class event
     * @param type
     * @param callback
     */
    RedisDataCache.prototype.deleted = function (type, callback) {
        this.eventEmmiter.on('Delete_' + type.name, callback);
    };
    /**
     * Atach listener to deleted object of class by id event
     * @param type
     * @param id
     * @param callback
     */
    RedisDataCache.prototype.deletedById = function (type, id, callback) {
        this.eventEmmiter.on('Delete_' + type.name + '_' + id, callback);
    };
    /**
     * Disconnect from Redis server
     */
    RedisDataCache.prototype.disconnect = function () {
        if (this.debug) {
            console.info('STATE Redis disconnect.');
        }
        return this.redis.disconnect();
    };
    /**
     * Check if object of provided class is exists by id
     * @param type
     * @param id
     */
    RedisDataCache.prototype.exists = function (type, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.debug) {
                    console.info('STATE exists: ' + type.name + ' id: ' + id);
                }
                return [2 /*return*/, this.redis.exists(type.name + '_' + id)];
            });
        });
    };
    /**
     * Async / await find all
     * @param type Class
     * @param fields (optional) array of fetched fields
     */
    RedisDataCache.prototype.find = function (type, fields) {
        return __awaiter(this, void 0, void 0, function () {
            var classname, keys, arr, e_5;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        classname = type.name;
                        if (!classname) {
                            return [2 /*return*/, Promise.reject('No class specified!')];
                        }
                        if (this.debug) {
                            console.info('STATE find: ' + (classname));
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, this.redis.keys(classname + '_*')];
                    case 2:
                        keys = _a.sent();
                        if (!(keys.length === 0)) return [3 /*break*/, 3];
                        return [2 /*return*/, Promise.resolve(null)];
                    case 3: return [4 /*yield*/, this.redis.mget(keys)];
                    case 4:
                        arr = _a.sent();
                        return [2 /*return*/, Promise.resolve(arr.map(function (s) {
                                var tmpObject = new type();
                                if (fields) {
                                    tmpObject = Object.assign(tmpObject, _this.filterObject(_this.filterObject(JSON.parse(s), fields), fields));
                                }
                                else {
                                    tmpObject = Object.assign(tmpObject, JSON.parse(s));
                                }
                                return tmpObject;
                            }))];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_5 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_5)];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Async / await find by id
     * @param type Class
     * @param id Id of object
     * @param fields (optional) array of fetched fields
     */
    RedisDataCache.prototype.findById = function (type, id, fields) {
        return __awaiter(this, void 0, void 0, function () {
            var classname, result, _a, _b, tmpObject, e_6;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        classname = type.name;
                        if (!classname) {
                            return [2 /*return*/, Promise.reject('No class specified!')];
                        }
                        if (this.debug) {
                            console.info('STATE findById: ' + (classname) + ' id: ' + id);
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, this.redis.get(classname + '_' + id)];
                    case 2:
                        result = _b.apply(_a, [_c.sent()]);
                        if (!result) {
                            return [2 /*return*/, Promise.resolve(null)];
                        }
                        tmpObject = new type();
                        if (fields) {
                            tmpObject = Object.assign(tmpObject, this.filterObject(this.filterObject(result, fields), fields));
                        }
                        else {
                            tmpObject = Object.assign(tmpObject, result);
                        }
                        return [2 /*return*/, Promise.resolve(tmpObject)];
                    case 3:
                        e_6 = _c.sent();
                        return [2 /*return*/, Promise.reject(e_6)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Async / await find many by ids
     * @param type Class
     * @param ids Array of object ids
     * @param fields (optional) array of fetched fields
     */
    RedisDataCache.prototype.findByIds = function (type, ids, fields) {
        return __awaiter(this, void 0, void 0, function () {
            var classname, keys, arr, e_7;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        classname = type.name;
                        if (!classname) {
                            return [2 /*return*/, Promise.reject('No class specified!')];
                        }
                        keys = ids.map(function (id) {
                            return type.name + '_' + id.toString();
                        });
                        if (this.debug) {
                            console.info('STATE findByIds: ' + (classname) + ' ids: ' + ids.join(', '));
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        if (!(keys.length === 0)) return [3 /*break*/, 2];
                        return [2 /*return*/, Promise.resolve(null)];
                    case 2: return [4 /*yield*/, this.redis.mget(keys)];
                    case 3:
                        arr = _a.sent();
                        return [2 /*return*/, Promise.resolve(arr.filter(function (s) { return s; }).map(function (s) {
                                var tmpObject = new type();
                                if (fields) {
                                    tmpObject = Object.assign(tmpObject, _this.filterObject(_this.filterObject(JSON.parse(s), fields), fields));
                                }
                                else {
                                    tmpObject = Object.assign(tmpObject, JSON.parse(s));
                                }
                                return tmpObject;
                            }))];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        e_7 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_7)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Redis on close listener
     * @param listener Callback for listen on close
     */
    RedisDataCache.prototype.onClose = function (listener) {
        this.addListener('close', listener);
    };
    /**
     * Redis on connect listener
     * @param listener Callback for listen on connect
     */
    RedisDataCache.prototype.onConnect = function (listener) {
        this.addListener('connect', listener);
    };
    /**
     * Redis on end listener
     * @param listener Callback for listen on end
     */
    RedisDataCache.prototype.onEnd = function (listener) {
        this.addListener('end', listener);
    };
    /**
     * Redis on error listener
     * @param listener Callback for listen on error
     */
    RedisDataCache.prototype.onError = function (listener) {
        this.addListener('reconnecting', listener);
    };
    /**
     * Redis on ready listener
     * @param listener Callback for listen on ready
     */
    RedisDataCache.prototype.onReady = function (listener) {
        this.addListener('ready', listener);
    };
    /**
     * Redis on reconnect listener
     * @param listener Callback for listen on reconnect
     */
    RedisDataCache.prototype.onReconnect = function (listener) {
        this.addListener('reconnecting', listener);
    };
    /**
     * Redis on select listener
     * @param listener Callback for listen on select
     */
    RedisDataCache.prototype.onSelect = function (listener) {
        this.addListener('select', listener);
    };
    /**
     * Set field name for id dynamically
     * @param name id field
     */
    RedisDataCache.prototype.setIdFieldName = function (name) {
        this.idField = name;
    };
    /**
     * Set prefix for keys
     * @param prefix Prefix for keys
     */
    RedisDataCache.prototype.setPrefix = function (prefix) {
        this.prefix = prefix;
        this.createRedisInstance();
    };
    /**
     * Redis current connection status
     */
    RedisDataCache.prototype.status = function () {
        return this.redis.status;
    };
    /**
     * Async / await update object in Redis
     * @param data Instance of class
     */
    RedisDataCache.prototype.update = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var className, updated, e_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        className = data.constructor.name;
                        if (this.debug) {
                            console.info('STATE update: ' + className + ' id: ' + data[this.idField]);
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.redis.set(className + '_' + data[this.idField], JSON.stringify(data))];
                    case 2:
                        updated = _a.sent();
                        this.eventEmmiter.emit('Update_' + className + '_' + data[this.idField], data);
                        this.eventEmmiter.emit('Update_' + className, data);
                        return [2 /*return*/, Promise.resolve(updated)];
                    case 3:
                        e_8 = _a.sent();
                        return [2 /*return*/, Promise.reject(new Error(e_8))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Async / await update object partial (Object.assign)
     * @param type Class
     * @param data Partial Object
     */
    RedisDataCache.prototype.updatePartial = function (type, data) {
        return __awaiter(this, void 0, void 0, function () {
            var find;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.debug) {
                            console.info('STATE partial update: ' + type.name + ' id: ' + data[this.idField]);
                        }
                        return [4 /*yield*/, this.findById(type, data[this.idField])];
                    case 1:
                        find = _a.sent();
                        return [2 /*return*/, this.update(Object.assign(find, data))];
                }
            });
        });
    };
    /**
     * Attach listener to EventEmmiter on update any
     * @param type Class
     * @param callback Function
     */
    RedisDataCache.prototype.updated = function (type, callback) {
        this.eventEmmiter.on('Update_' + type.name, callback);
    };
    /**
     * Attach listener to EventEmmiter on update by id
     * @param type Class
     * @param id Object id
     * @param callback Function
     */
    RedisDataCache.prototype.updatedById = function (type, id, callback) {
        this.eventEmmiter.on('Update_' + type.name + '_' + id, callback);
    };
    /**
     * Add listener for Redis events
     * @param event
     * @param listener
     */
    RedisDataCache.prototype.addListener = function (event, listener) {
        this.redis.on(event, listener);
    };
    /**
     * Create Redis instance
     */
    RedisDataCache.prototype.createRedisInstance = function () {
        if (this.url) {
            this.redis = new Ioredis(this.url);
        }
        else {
            this.redis = new Ioredis({
                host: this.hostname,
                port: this.port,
                password: this.password,
                keyPrefix: this.prefix,
                ready: true
            });
        }
    };
    /**
     * Filter object properties by provided fields
     * @private
     * @param obj
     * @param fields
     */
    RedisDataCache.prototype.filterObject = function (obj, fields) {
        var t = {};
        Object.keys(obj).map(function (k) {
            if (fields.indexOf(k) > -1) {
                t[k] = obj[k];
            }
        });
        return t;
    };
    return RedisDataCache;
}());
exports.RedisDataCache = RedisDataCache;
