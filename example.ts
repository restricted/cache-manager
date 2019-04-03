import {ExampleListener} from './example-listener';
import {RedisDataCache} from './index';

export class ExampleTest {
    id: number;
    name: string;
    test: string;
}

const cache = new RedisDataCache();

async function run() {
    await cache.connect();

    new ExampleListener(cache);

    const e = new ExampleTest();
    e.id = 2;
    e.name = 'Vasya';

    await cache.create(e).catch(console.error);

    await cache.createBatch([e]).catch(console.error);

    e.name = 'Vasya updated';

    await cache.update(e).catch(console.error);

    await cache.updatePartial(ExampleTest, {id: 2, test: 'TEST'}).catch(console.error);

    await cache.delete(ExampleTest, e.id);

    await cache.clear();
}

run().then(() => {
    cache.disconnect();
}).catch(console.error);
