import {RedisDataCache} from './index';


import {expect} from 'chai';
import 'mocha';

class ExampleTest {
    id: number;
    name: string;
}

let cache;

before(async () => {
    cache = new RedisDataCache();
    return await cache.connect();
});

after(() => {
    if (cache) {
        cache.disconnect();
    }
    process.exit();
});

describe('RedisDataCache test suite', async () => {

    await it('should create default Redis connection', async () => {
        await expect(['connect', 'connecting', 'ready'].indexOf(cache.status())).is.greaterThan(-1);
    });

    await it('should create Redis connection by url', async () => {
        cache = await new RedisDataCache({url: 'redis://127.0.0.1:6379'});
        await expect(cache.status()).is.equal('connecting');
    });

    const example = new ExampleTest();
    example.id = 1;
    example.name = 'Hello';

    await it('should create object in Redis', async () => {
        await cache.create(example).then((ok) => {
            expect(ok).equal('OK');
        }).catch(e => {
            console.error(e);
        });
    });

    await it('should exists created object in Redis', async () => {
        await cache.create(example).then(async (ok) => {
            expect(ok).equal('OK');
            await cache.findById(ExampleTest, example.id).then(e => {
                expect(e).to.deep.equal(example);
            }).catch(e => {
                console.error(e);
            });
        }).catch(e => {
            console.error(e);
        });
    });

    await it('should exists created object in Redis by findByIds', async () => {
        await cache.create(example).then(async (ok) => {
            expect(ok).equal('OK');
            await cache.findByIds(ExampleTest, [example.id]).then(e => {
                expect(e[0]).to.deep.equal(example);
            }).catch(e => {
                console.error(e);
            });
        }).catch(e => {
            console.error(e);
        });
    });
});
