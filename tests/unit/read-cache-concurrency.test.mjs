import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Database} from '../../js/modules/db.js';

test('simultaneous reads of the same dashboard data share one request',async()=>{
 const db=new Database();let requests=0,release;
 const ready=new Promise(resolve=>{release=resolve;});
 const read=()=>db.getCached('dashboard:users',30000,async()=>{requests++;await ready;return[{id:'sample'}];});
 const reads=Array.from({length:20},read);
 await Promise.resolve();assert.equal(requests,1);
 release();const values=await Promise.all(reads);
 assert.ok(values.every(value=>value===values[0]));
 await read();assert.equal(requests,1);
});

test('a failed shared request is removed so retry can succeed',async()=>{
 const db=new Database();let requests=0;
 const read=()=>db.getCached('failed',1000,async()=>{requests++;throw new Error('temporary failure');});
 const outcomes=await Promise.allSettled([read(),read()]);
 assert.equal(requests,1);assert.ok(outcomes.every(result=>result.status==='rejected'));
 assert.equal(await db.getCached('failed',1000,async()=>42),42);
});

test('invalidated in-flight data cannot overwrite a newer result',async()=>{
 const db=new Database();const key=db.getCacheKey('sample','users',{});let release;
 const pending=db.getCached(key,30000,()=>new Promise(resolve=>{release=resolve;}));
 await Promise.resolve();db.invalidateCollectionCache('users');
 const fresh=await db.getCached(key,30000,async()=>({version:'fresh'}));
 release({version:'old'});await pending;
 assert.equal(await db.getCached(key,30000,async()=>null),fresh);
});

test('different queries remain separate and expired data reloads',async()=>{
 const db=new Database();let requests=0;
 await Promise.all(['one','two'].map(key=>db.getCached(key,0,async()=>++requests)));
 assert.equal(requests,2);
 await db.getCached('one',0,async()=>++requests);assert.equal(requests,3);
});
