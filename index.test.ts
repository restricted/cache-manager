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

after(async () => {
    if (cache) {
        return await cache.disconnect();
    }
});

describe('RedisDataCache test suite', () => {

    it('should create default Redis connection', () => {
        expect(['connect', 'connecting', 'ready'].indexOf(cache.status())).is.greaterThan(-1);
    });

    it('should create Redis connection by url', () => {
        cache = new RedisDataCache({url: 'redis://127.0.0.1:6379'});
        expect(cache.status()).is.equal('connecting');
    });

    const example = new ExampleTest();
    example.id = 1;
    example.name = 'Hello';

    it('should create object in Redis', () => {
        cache.create(example).then((ok) => {
            expect(ok).equal('OK');
        }).catch(e => {
            console.error(e);
        });
    });

    it('should exists created object in Redis', () => {
        cache.create(example).then((ok) => {
            expect(ok).equal('OK');
            cache.findById(ExampleTest, example.id).then(e => {
                expect(e).to.deep.equal(example);
            }).catch(e => {
                console.error(e);
            });
        }).catch(e => {
            console.error(e);
        });
    });

    it('should exists created object in Redis by findByIds', () => {
        cache.create(example).then((ok) => {
            expect(ok).equal('OK');
            cache.findByIds(ExampleTest, [example.id]).then(e => {
                expect(e[0]).to.deep.equal(example);
            }).catch(e => {
                console.error(e);
            });
        }).catch(e => {
            console.error(e);
        });
    });
})
;
