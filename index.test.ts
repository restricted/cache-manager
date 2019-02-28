import {RedisDataCache} from './index';

let s = process.hrtime();
const precision = 3;

let elapsed = process.hrtime(s)[1] / 1000000;
console.debug('[START] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
s = process.hrtime();

const cache = new RedisDataCache();

elapsed = process.hrtime(s)[1] / 1000000;
console.debug('[RedisDataCache instance] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
s = process.hrtime();

export class Deal {
    id: string;
    name: string;
    nested: {
        name: {
            hi: string,
            last?: number
        }
    }
}

export class Client {
    id: number;
    description: string;
}

const deal = new Deal();
deal.id = '1';
deal.name = 'Master data';
deal.nested = {
    name: {hi: 'asdasdasd'}
};
elapsed = process.hrtime(s)[1] / 1000000;
console.debug('[Deal instance] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
s = process.hrtime();


const deal2 = new Deal();
deal2.id = '4';
deal2.name = 'Slave data';

const client = new Client();
client.id = 22;
client.description = 'Very very very very very very very very very very very long description';
elapsed = process.hrtime(s)[1] / 1000000;
console.debug('[Client instance] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
s = process.hrtime();


async function start() {

    s = process.hrtime();
    await cache.create(deal);
    elapsed = process.hrtime(s)[1] / 1000000;
    console.debug('[Caching deal] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
    s = process.hrtime();

    s = process.hrtime();
    await cache.create(deal2);
    elapsed = process.hrtime(s)[1] / 1000000;
    console.debug('[Caching deal2] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
    s = process.hrtime();

    await cache.create(client);
    elapsed = process.hrtime(s)[1] / 1000000;
    console.debug('[Caching client] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
    s = process.hrtime();

    await cache.create(deal);
    elapsed = process.hrtime(s)[1] / 1000000;
    console.debug('[Caching deal again] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
    s = process.hrtime();

    await cache.create(client);
    elapsed = process.hrtime(s)[1] / 1000000;
    console.debug('[Caching client again] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
    s = process.hrtime();

    const batch = [deal, deal, client, client];
    await cache.createBatch(batch);
    elapsed = process.hrtime(s)[1] / 1000000;
    console.debug('[Caching batch] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
    s = process.hrtime();

    const r: Deal = await cache.findById<Deal>(Deal, 1);
    console.log(r);
    elapsed = process.hrtime(s)[1] / 1000000;
    console.debug('[Caching findById] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
    s = process.hrtime();

    const as: Deal = await cache.findById<Deal>(Deal, 111);
    console.log(as);
    elapsed = process.hrtime(s)[1] / 1000000;
    console.debug('[Caching findById err] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
    s = process.hrtime();

    const a: Deal = await cache.findById<Deal>(Deal, 1, {fields: ['id', 'name']});
    console.log(a);
    elapsed = process.hrtime(s)[1] / 1000000;
    console.debug('[Caching findById with fields] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
    s = process.hrtime();

    await cache.find<Deal>(Deal);
    elapsed = process.hrtime(s)[1] / 1000000;
    console.debug('[Caching find] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
    s = process.hrtime();

    const c: Deal[] = await cache.find<Deal>(Deal, {fields: ['id', 'name']});
    console.log(c);
    elapsed = process.hrtime(s)[1] / 1000000;
    console.debug('[Caching find with fields] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
    s = process.hrtime();

    const ca: Deal[] = await cache.findByIds<Deal>(Deal, [1, 3, 4], {fields: ['id', 'name']});
    console.log(ca);
    elapsed = process.hrtime(s)[1] / 1000000;
    console.debug('[Caching findByIds] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
    s = process.hrtime();

    await cache.delete<Deal>(Deal, 1);
    elapsed = process.hrtime(s)[1] / 1000000;
    console.debug('[Caching delete] ' + process.hrtime(s)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - ');
    s = process.hrtime();

    await cache.update(deal);

    deal.nested.name.hi = 'Partial update';
    deal.nested.name.last = 22;
    await cache.updatePartial(Deal, deal);
}

setTimeout(() => {
    start().then(() => {
        cache.disconnect();
    });
}, 1000);

