import {ExampleTest} from './example';
import {RedisDataCache} from './index';

export class ExampleListener {
    constructor(cache: RedisDataCache) {
        cache.created(ExampleTest, instance => {
            console.log('[LISTENER] Created', instance);
        });

        cache.updatedById(ExampleTest, 2, instance => {
            console.log('[LISTENER] Updated id 2', instance);
        });

        cache.updated(ExampleTest, instance => {
            console.log('[LISTENER] Updated', instance);
        });

        cache.deleted(ExampleTest, id => {
            console.log('[LISTENER] Deleted', id);
        });

        cache.deletedById(ExampleTest, 2, id => {
            console.log('[LISTENER] Deleted id 2', id);
        });

        cache.cleared(() => {
            console.log('[LISTENER] Data cleared');
        })
    }
}
