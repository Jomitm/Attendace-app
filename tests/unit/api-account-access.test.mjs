import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let profile, claims, unavailable, readError, tokenError, revokedCheck;
const admin={auth:()=>({verifyIdToken:async(_token,checkRevoked)=>{revokedCheck=checkRevoked;if(tokenError)throw new Error('expired');return claims;}})};
const db={collection:()=>({doc:()=>({get:async()=>{if(readError)throw new Error('offline');return{exists:profile!==null,data:()=>profile};}})})};
const helper=require.resolve('../../api/_firebase-admin.js');
require.cache[helper]={id:helper,filename:helper,loaded:true,exports:{getAdmin:()=>admin,getDb:()=>unavailable?null:db}};
const {authenticateRequest,isReportsAdmin}=require('../../api/_api-auth.js');
const request=()=>authenticateRequest({headers:{authorization:'Bearer sample'}});
beforeEach(()=>{profile={isAdmin:false,role:'Employee',permissions:{}};claims={uid:'staff',isAdmin:true,role:'Administrator'};unavailable=false;readError=false;tokenError=false;revokedCheck=null;});
test('API authorization replaces stale roles with the current staff profile',async()=>{
 const result=await request();assert.equal(result.ok,true);assert.equal(result.user.isAdmin,false);assert.equal(result.user.role,'Employee');assert.equal(revokedCheck,true);
});
test('current API grants work without refreshing old token claims',async()=>{
 claims.isAdmin=false;profile={isAdmin:true,role:'Administrator',permissions:{reports:'admin'}};
 const result=await request();assert.equal(result.user.isAdmin,true);assert.equal(isReportsAdmin(result.user),true);
});
for(const status of ['former','resigned','retired','inactive'])test(`API rejects ${status} profiles despite an otherwise valid admin token`,async()=>{
 profile={isAdmin:true,employmentStatus:status};const result=await request();assert.equal(result.ok,false);assert.equal(result.status,403);
});
test('API rejects legacy inactive and missing staff accounts',async()=>{
 profile={status:'inactive'};assert.equal((await request()).status,403);profile=null;assert.equal((await request()).status,403);
});
test('API account lookup failure fails closed with a retryable response',async()=>{
 readError=true;assert.equal((await request()).status,503);readError=false;unavailable=true;assert.equal((await request()).status,503);
});
test('invalid or missing bearer tokens are rejected',async()=>{
 tokenError=true;assert.equal((await request()).status,401);assert.equal((await authenticateRequest({headers:{}})).status,401);
});
test('a stale payroll mirror cannot grant API report privileges',()=>{
 assert.equal(isReportsAdmin({isAdmin:false,permissions:{}},{permissions:{reports:'admin'}}),false);
 assert.equal(isReportsAdmin({permissions:{reports:'admin'}}),true);
});
