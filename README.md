Redis data cache
---

Motivation:
- Support for partial data update by key (only first level, no nested data)
- Support find with partial object / array returns
- Support querying in find methods

Methods:

await create(data) - return Redis status for operation, where data is instance of some class

await createBatch(data[]) - return Redis status for operation, where data is array of instances of some class

await update(data) - return Redis status for operation, where data is instance of some class

await updatePartial(Class, data) - return Redis status for operation, where data is partial instance of some class (update properties with Object.assign)

await find(Class, fields?: ['id', 'name']) - return all instances of provided class with filtered properties

await findById(Class, id: any, fields?: ['id', 'name']) - return finded by id instance with filtered properties

await findById(Class, ids: [any], fields?: ['id', 'name']) - return finded by ids instances of provided class with filtered properties

await delete(Class, id: any) - remove instance from redis


Examples: 

```
import { RedisDataCache } from 'redis-data-cache';

const cache = new RedisDataCache();

class Data {
  id: number;
  name?: string;
}

const data = new Data();

data.id = 20; 

cache.create(data).catch(console.error);

const arrayData = [data];

createBatch(arrayData).catch(console.error)

data.name = 'Help';

update(data).catch(console.error);

find(Data).catch(console.error);

updatePartial(Class, { id: 20, name: 'Help me' }).catch(console.error);

findById(Data, id: 20).catch(console.error);

findByIds(Data, ids: [20, 30, 12]).catch(console.error);

delete(Class, 20).catch(console.error);

```



