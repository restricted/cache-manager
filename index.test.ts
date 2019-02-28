import {RedisDataCache} from './index';


import {expect} from 'chai';
import 'mocha';

class ExampleTest {
    id: number;
    name: string;
}

describe('Connection', () => {
    let cache;
    it('should create default Redis connection', () => {
        cache = new RedisDataCache();
        expect(cache.status()).is.equal('connecting');
    });

    it('should create Redis connection by url', () => {
        cache = new RedisDataCache({url: 'redis://127.0.0.1:6379'});
        cache.connect().then(() => {
            expect(cache.status()).is.equal('connecting');
        });
    });
    after(() => {
        cache.disconnect();
    });
});

describe('Manipulation', () => {

    const cache = new RedisDataCache();

    const example = new ExampleTest();
    example.id = 1;
    example.name = 'Hello';

    it('should create object in Redis', () => {
        cache.connect().then(() => {
            cache.create(example).then((ok) => {
                expect(ok).equal('OK');
            }).catch(e => {
                console.error(e);
            });
        });
    });

    it('should exists created object in Redis', () => {
        cache.connect().then(() => {
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
    });

    it('should exists created object in Redis by findByIds', () => {
        cache.connect().then(() => {
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
    });
    after(() => {
        cache.disconnect();
    });
});
