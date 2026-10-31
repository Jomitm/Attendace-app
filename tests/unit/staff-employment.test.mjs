import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { isFormerStaff, filterFormerStaffRecords, formerStaffIds } from '../../js/utils/staff-employment.js';
import { Database } from '../../js/modules/db.js';
import { Auth } from '../../js/modules/auth.js';
import { createFirestoreMock } from '../helpers/firestore-mock.mjs';
const require = createRequire(import.meta.url);
const core = require('../../api/_staff-employment-core.js');
const source = readFileSync(new URL('../../api/_staff-employment.js', import.meta.url),'utf8');
const actor = { id:'admin', name:'Admin',isAdmin:true };
const staff = { id:'staff',name:'Staff',status:'in',activeSessions:[{token:'device'}] };
function harness({ actorData=actor, target=staff, otherAdmin=true, authError=false }={}) {
 const store=new Map([['users/admin',actorData],['users/staff',target]]);
 if(otherAdmin)store.set('users/backup',{id:'backup',isAdmin:true});
 const calls=[];
 const snap=key=>({exists:store.has(key),id:key.split('/')[1],data:()=>store.get(key)});
 const db={collection:name=>({doc:id=>({key:`${name}/${id}`,get:async()=>snap(`${name}/${id}`)}),where:()=>({query:name})}),runTransaction:async fn=>{
  const ops=[];const tx={get:async ref=>ref.query?{docs:[...store].filter(([key,data])=>key.startsWith('users/')&&data.isAdmin).map(([key])=>snap(key))}:snap(ref.key),update:(ref,data)=>ops.push([ref.key,{...store.get(ref.key),...data}]),set:(ref,data)=>ops.push([ref.key,data])};
  await fn(tx);ops.forEach(([key,data])=>store.set(key,data));
 }};
 const admin={auth:()=>({getUser:async()=>({disabled:false}),updateUser:async(id,data)=>{if(authError)throw new Error('Auth unavailable');calls.push(['update',id,data]);},revokeRefreshTokens:async id=>calls.push(['revoke',id])})};
 const context={module:{exports:{}},require:name=>name==='crypto'?require('node:crypto'):name==='./_firebase-admin.js'?{getDb:()=>db}:name==='./_api-auth.js'?{authenticateRequest:async()=>({ok:true,admin,user:{uid:'admin'}}),sendAuthError:()=>{}}:core,console:{error(){}},Intl,Date};
 vm.runInNewContext(source,context);
 const run=async body=>{let status=200,result;const res={status(code){status=code;return this;},json(data){result=data;return this;}};await context.module.exports({method:'POST',body},res);return{status,result};};
 return {run,store,calls};
}
const archive={userId:'staff',action:'archive',lastWorkingDate:'2026-10-29',reason:'Resigned',note:'Handover complete'};

test('server and client employment predicates agree, legacy accounts stay active',()=>{
 for(const user of [{},null,{status:'in'},{employmentStatus:'former'},{employmentStatus:'resigned'},{status:'inactive'},{employmentStatus:'active'}])assert.equal(isFormerStaff(user),core.isFormerStaff(user));
});
test('leaving validation rejects invalid and future dates and oversized notes',()=>{
 assert.throws(()=>core.validateEmploymentChange({...archive,lastWorkingDate:'2026-02-30'},'2026-10-30'));
 assert.throws(()=>core.validateEmploymentChange({...archive,lastWorkingDate:'2027-01-01'},'2026-10-30'));
 assert.throws(()=>core.validateEmploymentChange({...archive,note:'x'.repeat(1001)},'2026-10-30'));
});
test('archive clears sessions, retains records, records admin-only notes and revokes Auth',async()=>{
 const f=harness();const out=await f.run(archive);assert.equal(out.status,200);assert.equal(f.store.get('users/staff').employmentStatus,'former');assert.equal(f.store.get('users/staff').activeSessions.length,0);
 assert.equal(f.store.get('staff_employment/staff').note,'Handover complete');assert.equal(f.store.get('users/staff').note,undefined);assert.equal(f.calls.length,2);
 assert.equal([...f.store.keys()].filter(key=>key.startsWith('system_audit_logs/')).length,1);
});
test('restore keeps audit history and resets sessions',async()=>{
 const f=harness();await f.run(archive);const out=await f.run({userId:'staff',action:'restore'});assert.equal(out.status,200);assert.equal(f.store.get('users/staff').employmentStatus,'active');assert.equal(f.store.get('staff_employment/staff').history.length,2);assert.equal(f.calls[2][2].disabled,false);
});
test('self-deactivation and unprivileged actors are denied',async()=>{
 assert.equal((await harness().run({...archive,userId:'admin'})).status,403);
 const f=harness({actorData:{id:'admin',isAdmin:false}});assert.equal((await f.run(archive)).status,403);assert.equal(f.store.get('users/staff').employmentStatus,undefined);
});
test('a scoped staff admin cannot deactivate a full administrator',async()=>{
 const f=harness({actorData:{id:'admin',permissions:{users:'admin'}},target:{...staff,isAdmin:true}});assert.equal((await f.run(archive)).status,403);
});
test('Auth synchronization failures are explicit and do not reactivate former staff',async()=>{
 const f=harness({authError:true});const out=await f.run(archive);assert.equal(out.status,200);assert.match(out.result.warning,/synchronization/);assert.equal(f.store.get('users/staff').employmentStatus,'former');
});
test('staff data filters exclude former owners, assignments and tags without modifying saved data',()=>{
 const ids=formerStaffIds([{id:'former',employmentStatus:'former'}]);
 const rows=[{id:'active-plan',userId:'active',plans:[{task:'Retired assignment',assignedTo:'former'},{task:'Active work',tags:[{id:'former'},{id:'active'}]}]},{id:'old-plan',userId:'former'}];
 const before=JSON.stringify(rows);const filtered=filterFormerStaffRecords('work_plans',rows,ids);assert.equal(filtered.length,1);assert.equal(filtered[0].plans[0].isEmploymentHidden,true);assert.equal(filtered[0].plans[1].tags.length,1);assert.equal(JSON.stringify(rows),before);
});
test('database read boundary allows former records only on authorized admin requests',async()=>{
 globalThis.window={location:{hash:'#master-sheet'},AppAuth:{getUser:()=>actor}};
 const db=new Database();db.employmentUsers=[{id:'former',employmentStatus:'former'},actor];
 const rows=[{user_id:'former'},{user_id:'admin'}];
 assert.equal((await db.filterStaffRows('attendance',rows,{includeFormer:true})).length,1);
 window.location.hash='#admin';assert.equal((await db.filterStaffRows('attendance',rows,{includeFormer:true})).length,2);
 window.AppAuth.getUser=()=>({id:'ordinary'});assert.equal((await db.filterStaffRows('attendance',rows,{includeFormer:true})).length,1);
 delete globalThis.window;
});

test('former staff are signed out before the localhost session exemption',()=>{
 globalThis.window={location:{hostname:'localhost'}};
 const auth=new Auth();let message='';auth.forceLogout=text=>{message=text;};
 assert.equal(auth._validateUserSession({employmentStatus:'former'}),false);
 assert.match(message,/no longer active/);delete globalThis.window;
});
test('former staff cannot establish a local fallback session',async()=>{
 const auth=new Auth();const result=await auth._establishSession({id:'former',employmentStatus:'former'});
 assert.match(result.serverError,/no longer active/);
});
test('messages involving former staff disappear from normal staff views',()=>{
 const rows=[{fromId:'former',toId:'active'},{fromId:'active',toId:'former'},{fromId:'active',toId:'other'}];
 assert.equal(filterFormerStaffRecords('staff_messages',rows,new Set(['former'])).length,1);
});
test('saving a visible plan preserves hidden former-staff task bodies',async()=>{
 globalThis.window={AppAuth:{getUser:()=>({id:'active'})}};
 const original={task:'Past assignment',assignedTo:'former',notes:'Retained history'};
 const db=new Database();db.db=createFirestoreMock({work_plans:{p:{id:'p',userId:'active',plans:[original,{task:'Current work'}]}}});
 const view=filterFormerStaffRecords('work_plans',[{id:'p',userId:'active',plans:[original,{task:'Edited current work'}]}],new Set(['former']))[0];
 await db.putWorkPlan(view);
 assert.deepEqual(db.db._data.work_plans.p.plans[0],original);
 assert.equal(db.db._data.work_plans.p.plans[1].task,'Edited current work');delete globalThis.window;
});
test('cached shared summaries from before a departure are discarded',async()=>{
 globalThis.window={location:{hash:'#dashboard'},AppAuth:{getUser:()=>actor}};
 const db=new Database();db.employmentUsers=[{id:'former',employmentStatus:'former'},actor];db.employmentSignature='current-roster';
 assert.equal((await db.filterStaffRows('daily_summaries',[{id:'old',hero:{winner:{id:'former'}}}])).length,0);
 assert.equal((await db.filterStaffRows('daily_summaries',[{id:'fresh',staffEmploymentSignature:'current-roster'}])).length,1);
 delete globalThis.window;
});
