import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createFirestoreMock } from '../helpers/firestore-mock.mjs';
import { Database } from '../../js/modules/db.js';
const require=createRequire(import.meta.url);
let db, viewer;
const helper=require.resolve('../../api/_firebase-admin.js');
require.cache[helper]={id:helper,filename:helper,loaded:true,exports:{getDb:()=>db,getAdmin:()=>null}};
const authPath=require.resolve('../../api/_api-auth.js');
require.cache[authPath]={id:authPath,filename:authPath,loaded:true,exports:{authenticateRequest:async()=>({ok:true,user:viewer}),sendAuthError:(res,auth)=>res.status(auth.status).json({error:auth.error})}};
const {default:readHandler,visibleStaffRows,validateStaffRead,encodeStaffCursor,decodeStaffCursor}=await import('../../api/_staff-data.js');
const minutesHandler=require('../../api/_minutes-action.js');
const taskHandler=require('../../api/_staff-task-response.js');
const roster=[{id:'staff',name:'Staff',role:'Employee',permissions:{}},{id:'other',name:'Other',role:'Employee',permissions:{}},{id:'former',name:'Former',employmentStatus:'former'}];
async function call(handler,body){let code=200,result;await handler({method:'POST',body},{setHeader(){},status(value){code=value;return this;},json(value){result=value;return this;}});return{code,result};}
beforeEach(()=>{
 viewer={uid:'staff',name:'Staff',isAdmin:false,permissions:{}};
 db=createFirestoreMock({users:Object.fromEntries(roster.map(user=>[user.id,user])),attendance:{a:{user_id:'staff',date:'2026-10-30'},f:{user_id:'former',date:'2026-09-30'}},
 minutes:{m:{createdBy:'other',title:'Protected minute',body:'Confidential details',locked:true,approvals:{},attendeeIds:['staff'],actionItems:[{task:'Assigned task',assignedTo:'staff',status:'pending'},{task:'Other task',assignedTo:'other',status:'pending'}]}},
 staff_messages:{msg:{type:'task',fromId:'other',toId:'staff',title:'Approved handoff',dueDate:'2026-10-30',status:'pending',history:[]}},work_plans:{}});
});
test('normal staff gateway returns active attendance and rejects former-history requests',async()=>{
 const response=await call(readHandler,{collection:'attendance'});assert.equal(response.code,200);assert.equal(response.result.data.length,1);assert.equal(response.result.data[0].user_id,'staff');
 assert.equal((await call(readHandler,{collection:'attendance',includeFormer:true})).code,403);
 assert.equal((await call(readHandler,{collection:'attendance',id:'f'})).result.data.length,0);
});
test('current users administrators can inspect retained history through the gateway',async()=>{
 viewer.permissions={users:'admin'};const response=await call(readHandler,{collection:'attendance',includeFormer:true});assert.equal(response.code,200);assert.equal(response.result.data.length,2);
});
test('gateway strips passwords and other people’s sessions, notifications and banking fields',()=>{
 const data=visibleStaffRows('users',[{...roster[1],password:'secret',activeSessions:[{token:'private'}],notifications:[{message:'private'}],bankAccount:'private'}],roster,{id:'staff'},false)[0];
 for(const field of ['password','activeSessions','notifications','bankAccount'])assert.equal(data[field],undefined);
});
test('gateway payroll access and safe query validation fail closed',async()=>{
 assert.equal((await call(readHandler,{collection:'salaries'})).code,403);
 assert.throws(()=>validateStaffRead({collection:'staff_employment'}));assert.throws(()=>validateStaffRead({collection:'users',id:'../staff'}));assert.throws(()=>validateStaffRead({collection:'attendance',filters:[{field:'date',operator:'unexpected'}]}));
});
test('minutes read preserves request metadata but redacts details without permission',()=>{
 const minute={id:'m',createdBy:'other',title:'Meeting',body:'Private',actionItems:[]};
 const data=visibleStaffRows('minutes',[minute],roster,{id:'staff'},false)[0];assert.equal(data.title,'Meeting');assert.equal(data.body,undefined);assert.equal(data.detailsRestricted,true);
});
test('non-owner assigned staff can update only their own minutes action via the server',async()=>{
 assert.equal((await call(minutesHandler,{id:'m',action:'task-status',taskIndex:0,status:'completed',title:'Forged'})).code,200);
 assert.equal(db._data.minutes.m.title,'Protected minute');assert.equal(db._data.minutes.m.actionItems[0].status,'completed');
 assert.equal((await call(minutesHandler,{id:'m',action:'task-status',taskIndex:1,status:'completed'})).code,403);
});
test('minutes attendees approve as themselves; strangers cannot approve or review requests',async()=>{
 assert.equal((await call(minutesHandler,{id:'m',action:'approve',userId:'other'})).code,200);assert.ok(db._data.minutes.m.approvals.staff);assert.equal(db._data.minutes.m.approvals.other,undefined);
 viewer={uid:'stranger',permissions:{}};assert.equal((await call(minutesHandler,{id:'m',action:'approve'})).code,403);assert.equal((await call(minutesHandler,{id:'m',action:'review-access',userId:'staff',status:'approved'})).code,403);
});
test('minutes access requests are self-only and repeated requests are idempotent',async()=>{
 await call(minutesHandler,{id:'m',action:'request-access',userId:'other'});await call(minutesHandler,{id:'m',action:'request-access'});assert.equal(db._data.minutes.m.accessRequests.length,1);assert.equal(db._data.minutes.m.accessRequests[0].userId,'staff');assert.equal(db._data.minutes.m.auditLog.length,1);
});
test('former-owned minutes stay admin-only even through specialized actions',async()=>{
 db._data.minutes.m.createdBy='former';assert.equal((await call(minutesHandler,{id:'m',action:'approve'})).code,403);
});
test('task acceptance is atomic and idempotent without broad cross-staff write grants',async()=>{
 assert.equal((await call(taskHandler,{messageId:'msg',response:'approved'})).code,200);
 assert.equal(db._data.staff_messages.msg.status,'approved');assert.equal(db._data.work_plans['plan_staff_2026-10-30'].plans.length,1);assert.equal(db._data.work_plans['plan_other_2026-10-30'].plans.length,1);
 await call(taskHandler,{messageId:'msg',response:'approved'});assert.equal(db._data.work_plans['plan_staff_2026-10-30'].plans.length,1);assert.equal(db._data.users.other.notifications.length,1);
});
test('only the recipient can accept a task and former senders cannot assign work',async()=>{
 viewer.uid='other';assert.equal((await call(taskHandler,{messageId:'msg',response:'approved'})).code,403);
 viewer.uid='staff';db._data.users.other.employmentStatus='former';assert.equal((await call(taskHandler,{messageId:'msg',response:'approved'})).code,409);
});
test('client pagination and result caches respect limits and never fall back to direct reads',async()=>{
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;let calls=0;
 globalThis.window={AppFirebaseAuth:{currentUser:{uid:'staff',getIdToken:async()=>'sample'}},location:{hash:'#master-sheet'},AppAuth:{getUser:()=>({id:'staff'})}};
 globalThis.fetch=async(_url,options)=>{calls++;const body=JSON.parse(options.body);return{ok:true,json:async()=>({data:Array.from({length:Math.min(body.pageSize,2)},(_,i)=>({id:String(i)})),nextCursor:null})};};
 try{const adapter=new Database();assert.equal((await adapter.readStaffData('attendance',{}, {limit:1})).length,1);assert.equal((await adapter.readStaffData('attendance',{}, {limit:2})).length,2);assert.equal(calls,2);
 globalThis.fetch=async()=>({ok:false,json:async()=>({error:'Denied'})});await assert.rejects(adapter.readStaffData('attendance',{}, {source:'server'}),/Denied/);
 }finally{globalThis.window=oldWindow;globalThis.fetch=oldFetch;}
});

test('delegation validates source ownership and preserves private-task boundaries',async()=>{
 db._data.work_plans.p={id:'p',userId:'staff',createdById:'staff',date:'2026-10-30',plans:[{task:'Delegate this',status:'pending'}]};
 assert.equal((await call(taskHandler,{action:'delegate',planId:'p',taskIndex:0,targetUserId:'other'})).code,200);
 assert.equal(db._data.work_plans['plan_other_2026-10-30'].plans[0].sourcePlanId,'p');
 viewer.uid='former';assert.equal((await call(taskHandler,{action:'delegate',planId:'p',taskIndex:0,targetUserId:'other'})).code,403);
});
test('a legacy creator cannot use delegation to extract a former owner’s history',async()=>{
 db._data.work_plans.p={id:'p',userId:'former',createdById:'staff',date:'2026-10-30',plans:[{task:'Former private history'}]};
 assert.equal((await call(taskHandler,{action:'delegate',planId:'p',taskIndex:0,targetUserId:'other'})).code,403);
});
test('a forged private-task pointer cannot extract another person’s private task',async()=>{
 db._data.work_plans.p={id:'p',userId:'staff',date:'2026-10-30',plans:[{isPrivate:true,privateTaskId:'victim'}]};
 db._data.private_work_plan_tasks={victim:{ownerId:'other',planId:'victim-plan',task:{task:'Victim private content'}}};
 assert.equal((await call(taskHandler,{action:'delegate',planId:'p',taskIndex:0,targetUserId:'other'})).code,403);
 assert.equal(db._data.work_plans['plan_other_2026-10-30'],undefined);
});
test('legitimate private delegation stores the copy outside the public plan',async()=>{
 db._data.work_plans.p={id:'p',userId:'staff',date:'2026-10-30',plans:[{isPrivate:true,privateTaskId:'own'}]};
 db._data.private_work_plan_tasks={own:{ownerId:'staff',planId:'p',task:{task:'Own private content',isPrivate:true}}};
 assert.equal((await call(taskHandler,{action:'delegate',planId:'p',taskIndex:0,targetUserId:'other'})).code,200);
 const copy=db._data.work_plans['plan_other_2026-10-30'].plans[0];assert.equal(copy.task,undefined);assert.equal(copy.isPrivate,true);
 assert.equal(db._data.private_work_plan_tasks[copy.privateTaskId].ownerId,'other');
});
test('query cursors do not expose former document ids and are bound to user and query',()=>{
 const query=validateStaffRead({collection:'attendance'});const id='former-sensitive-attendance-id';const cursor=encodeStaffCursor(id,query,'staff');
 assert.equal(decodeStaffCursor(cursor,query,'staff'),id);assert.equal(Buffer.from(cursor,'base64url').includes(Buffer.from(id)),false);
 assert.throws(()=>decodeStaffCursor(cursor,query,'other'));assert.throws(()=>decodeStaffCursor(cursor,{...query,collection:'users'},'staff'));
});
test('canonical minutes ownership cannot be overridden with an unrelated userId alias',()=>{
 const rows=visibleStaffRows('minutes',[{id:'m',createdBy:'former',userId:'staff',title:'Former history'}],roster,{id:'staff'},false);assert.equal(rows.length,0);
});
test('ordinary staff calculate a local summary without writing shared rankings',async()=>{
 const old=globalThis.window;globalThis.window={AppAuth:{getUser:()=>({id:'staff',isAdmin:false})}};
 try{const adapter=new Database();adapter.getDailySummaryWithFallback=async()=>({summary:null,source:'none'});adapter.hasAttendanceSignalForDate=async()=>true;adapter.acquireSummaryLock=async()=>{throw new Error('Unexpected shared write');};
 const result=await adapter.getOrCreateDailySummary({dateKey:'2026-10-30',generatorFn:async()=>({hero:{winner:{id:'staff'}}})});assert.equal(result._source,'local_calculated');
 }finally{globalThis.window=old;}
});
