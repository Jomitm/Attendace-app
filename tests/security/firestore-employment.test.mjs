// Real Firestore emulator rules tests. No production credentials or database are used.
import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Database } from '../../js/modules/db.js';
const host=process.env.FIRESTORE_RULES_TEST_HOST || '127.0.0.1:8086';
const project='demo-crwi-rules';
if(!/^127\.0\.0\.1:\d+$/.test(host))throw new Error('Rules tests require a loopback emulator.');
const root=`http://${host}/v1/projects/${project}/databases/(default)/documents`;
const profiles={
 admin:{name:'Admin',username:'admin',isAdmin:true,role:'Administrator',permissions:{}},
 staff:{name:'Staff',username:'staff',isAdmin:false,role:'Employee',permissions:{},status:'out',activeSessions:[]},
 manager:{name:'Users manager',isAdmin:false,role:'Employee',permissions:{users:'admin'}},
 payroll:{name:'Payroll manager',isAdmin:false,role:'Employee',permissions:{reports:'admin'}},
 birthday:{name:'Birthday manager',isAdmin:false,role:'Employee',permissions:{birthday:'admin'}},
 revoked:{name:'Revoked admin',isAdmin:false,role:'Employee',permissions:{}},
 former:{name:'Former staff',isAdmin:false,role:'Employee',permissions:{},employmentStatus:'former'},
 formerAdmin:{name:'Former admin',isAdmin:true,role:'Administrator',permissions:{reports:'admin',users:'admin'},employmentStatus:'former'},
 inactive:{name:'Legacy inactive',isAdmin:true,role:'Administrator',status:'inactive'}
};
function token(uid,claims={}){
 const b64=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
 const now=Math.floor(Date.now()/1000);
 return `${b64({alg:'none',typ:'JWT'})}.${b64({iss:`https://securetoken.google.com/${project}`,aud:project,iat:now,exp:now+3600,auth_time:now,sub:uid,user_id:uid,firebase:{identities:{},sign_in_provider:'custom'},...claims})}.`;
}
function value(item){
 if(item===null)return{nullValue:null};if(typeof item==='boolean')return{booleanValue:item};
 if(typeof item==='number')return{integerValue:String(item)};if(typeof item==='string')return{stringValue:item};
 if(Array.isArray(item))return{arrayValue:{values:item.map(value)}};
 return{mapValue:{fields:Object.fromEntries(Object.entries(item).map(([key,val])=>[key,value(val)]))}};
}
async function request(path,{uid='staff',claims={},method='GET',data,owner=false}={}){
 const headers={};if(owner)headers.Authorization='Bearer owner';else if(uid)headers.Authorization='Bearer '+token(uid,claims);
 if(data){headers['Content-Type']='application/json';}
 const mask=method==='PATCH'&&data?'?'+Object.keys(data).map(key=>'updateMask.fieldPaths='+encodeURIComponent(key)).join('&'):'';
 const response=await fetch(root+'/'+path+mask,{method,headers,body:data?JSON.stringify({fields:value(data).mapValue.fields}):undefined});
 const text=await response.text();return{status:response.status,text};
}
const allow=async promise=>{const result=await promise;assert.ok(result.status>=200&&result.status<300,`Expected allow; ${result.status}: ${result.text}`);};
const deny=async promise=>{const result=await promise;assert.equal(result.status,403,`Expected permission denied; ${result.status}: ${result.text}`);};
test('programmes remain server-only even for browser administrators',async()=>{
 await allow(request('programmes/shared',{owner:true,method:'PATCH',data:{title:'Server-owned programme',audience:'all'}}));
 for(const uid of ['staff','manager','admin']){
  await deny(request('programmes/shared',{uid}));
  await deny(request('programmes/new',{uid,method:'PATCH',data:{title:'Bypass attempt'}}));
 }
});
beforeEach(async()=>{
 const clear=await fetch(`http://${host}/emulator/v1/projects/${project}/databases/(default)/documents`,{method:'DELETE'});assert.ok(clear.ok);
 for(const [id,data]of Object.entries(profiles))await allow(request('users/'+id,{owner:true,method:'PATCH',data}));
 for(const [path,data]of Object.entries({
  'staff_employment/former':{id:'former',reason:'Resigned',note:'Private handover note'},
  'user_access/revoked':{permissions:{reports:'admin',users:'admin',birthday:'admin'}},
  'user_private/staff':{baseSalary:1},'salaries/pay':{userId:'staff',finalNet:1},
  'system_audit_logs/employment':{type:'staff-employment',userId:'former',action:'archive'},
  'system_audit_logs/normal':{type:'check-in',userId:'staff'},
  'attendance/day':{user_id:'staff',date:'2026-10-30',type:'Present'},
  'leaves/pending':{userId:'staff',status:'Pending'},
  'work_plans/p':{id:'p',userId:'staff',createdById:'staff',plans:[]}
  ,'work_plans/former-plan':{id:'former-plan',userId:'former',createdById:'staff',plans:[{task:'Former work'}]}
  ,'minutes/shared':{createdBy:'staff',title:'Shared minutes',attendeeIds:['manager'],actionItems:[{task:'Follow up',assignedTo:'manager',status:'pending'}],approvals:{},locked:false}
  ,'minutes/former':{createdBy:'former',title:'Former history',actionItems:[],approvals:{},locked:false}
  ,'staff_messages/thread':{fromId:'staff',toId:'manager',message:'Original message',type:'text',read:false,history:[]}
  ,'staff_messages/former-thread':{fromId:'former',toId:'staff',message:'Private former conversation',history:[]}
  ,'meetings/owned':{createdById:'staff',title:'Owned meeting'}
  ,'events/calendar':{createdById:'admin',type:'holiday',title:'Holiday'}
  ,'events/telemetry':{userId:'staff',type:'check-in',date:'2026-10-30'}
  ,'attendance/former':{user_id:'former',date:'2026-09-30',type:'Present'}
  ,'leaves/former':{userId:'former',status:'Approved'}
  ,'salaries/former':{userId:'former',finalNet:1}
  ,'user_private/former':{baseSalary:1}
  ,'private_work_plan_tasks/former-private':{ownerId:'former',assignedTo:'staff',task:{task:'Former private work'}}
 }))await allow(request(path,{owner:true,method:'PATCH',data}));
});

test('unauthenticated clients cannot read staff or employment notes',async()=>{
 await deny(request('users/staff',{uid:null}));await deny(request('staff_employment/former',{uid:null}));
});
for(const uid of ['former','formerAdmin','inactive'])test(`${uid}: old admin tokens cannot read or write`,async()=>{
 const claims={isAdmin:true,role:'Administrator'};
 await deny(request('users/staff',{uid,claims}));await deny(request('attendance/day',{uid,claims}));
 await deny(request('settings/test',{uid,claims,method:'PATCH',data:{enabled:true}}));
 await deny(request('staff_employment/former',{uid,claims}));
});
test('a token without a staff profile is denied despite admin claims',async()=>{
 await deny(request('users/staff',{uid:'missing',claims:{isAdmin:true}}));
});
test('shared collection reads require the authenticated filtered gateway',async()=>{
 await deny(request('users'));await deny(request('attendance'));await allow(request('attendance/day'));await allow(request('users/staff'));
 await allow(request('users',{uid:'admin'}));
});
test('ordinary staff cannot read or modify employment notes',async()=>{
 await deny(request('staff_employment/former'));await deny(request('staff_employment/former',{method:'PATCH',data:{note:'tampered'}}));
});
test('full admin and users manager can read notes; payroll alone cannot',async()=>{
 await allow(request('staff_employment/former',{uid:'admin'}));await allow(request('staff_employment/former',{uid:'manager'}));await deny(request('staff_employment/former',{uid:'payroll'}));
});
test('even full admins cannot directly create or edit employment note documents',async()=>{
 for(const path of ['staff_employment/former','staff_employment/new'])await deny(request(path,{uid:'admin',method:'PATCH',data:{note:'bypass'}}));
 await deny(request('staff_employment/former',{uid:'admin',method:'DELETE'}));
});
for(const field of ['employmentStatus','employmentEndedAt','employmentChangedAt'])test(`server-only employment field: ${field}`,async()=>{
 const data={[field]:field==='employmentChangedAt'?123:field==='employmentStatus'?'former':'2026-10-29'};
 await deny(request('users/staff',{method:'PATCH',data}));await deny(request('users/staff',{uid:'admin',method:'PATCH',data}));
});
test('a staff member cannot grant their own role or permissions',async()=>{
 for(const data of [{isAdmin:true},{role:'Administrator'},{permissions:{users:'admin'}},{canManageBirthdays:true}])await deny(request('users/staff',{method:'PATCH',data}));
});
test('legacy inactive status cannot bypass the employment endpoint',async()=>{
 await deny(request('users/staff',{method:'PATCH',data:{status:'inactive'}}));
 await deny(request('users/inactive',{uid:'admin',method:'PATCH',data:{status:'out'}}));
 await deny(request('users/fake-inactive',{uid:'admin',method:'PATCH',data:{name:'Inactive account',status:'inactive'}}));
});
test('credentials and migration flags cannot bypass the server password action',async()=>{
 for(const data of [{password:'plaintext'},{authMigrated:true},{passwordSetupRequired:true}])await deny(request('users/staff',{uid:'admin',method:'PATCH',data}));
});
test('ordinary staff can check in, update sessions and update their own basic profile',async()=>{
 await allow(request('users/staff',{method:'PATCH',data:{status:'in',activeSessions:[{token:'sample',signedInAt:1}],phone:'123',lastSeen:1}}));
 await deny(request('users/admin',{method:'PATCH',data:{phone:'123'}}));
});
test('full admin can edit a staff profile and permissions without cached admin claims',async()=>{
 await allow(request('users/staff',{uid:'admin',claims:{isAdmin:false},method:'PATCH',data:{name:'Updated name',permissions:{attendance:'view'}}}));
});
test('revoked full-admin and HR roles cannot be recovered with old token claims',async()=>{
 const opts={uid:'revoked',claims:{isAdmin:true,role:'Administrator'},method:'PATCH',data:{name:'Tampered'}};
 await deny(request('users/staff',opts));await deny(request('settings/policies',{...opts,data:{enabled:true}}));
});
test('stale authorization mirrors do not restore payroll or birthday permissions',async()=>{
 await deny(request('user_private/staff',{uid:'revoked',claims:{isAdmin:true}}));await deny(request('salaries/pay',{uid:'revoked'}));
 await deny(request('birthday_people/person',{uid:'revoked',method:'PATCH',data:{name:'Unauthorized'}}));
});
test('full admin and live report permissions retain payroll access without a mirror',async()=>{
 await allow(request('user_private/staff',{uid:'admin'}));await allow(request('salaries/pay',{uid:'payroll'}));await deny(request('user_private/staff'));
});
test('live birthday permissions allow birthday management',async()=>{
 await allow(request('birthday_people/person',{uid:'birthday',method:'PATCH',data:{name:'Birthday contact'}}));
});
test('active staff creation works; fabricated former staff and credential fields are denied',async()=>{
 await allow(request('users/new',{uid:'admin',method:'PATCH',data:{name:'New staff',isAdmin:false,role:'Employee',permissions:{},status:'out',passwordSetupRequired:true}}));
 await deny(request('users/fake-former',{uid:'admin',method:'PATCH',data:{name:'Fake',employmentStatus:'former'}}));
 await deny(request('users/fake-password',{uid:'admin',method:'PATCH',data:{name:'Fake',password:'plaintext'}}));
});
test('profile validators reject role, permission and flag type changes',async()=>{
 for(const data of [{name:'a'.repeat(201)},{isAdmin:'true'},{permissions:'admin'},{role:123}])await deny(request('users/staff',{uid:'admin',method:'PATCH',data}));
});
test('employment audit records cannot be forged, retagged, edited or deleted by clients',async()=>{
 for(const uid of ['staff','admin'])await deny(request('system_audit_logs/forged',{uid,method:'PATCH',data:{type:'staff-employment',userId:'former'}}));
 await deny(request('system_audit_logs/employment',{uid:'admin',method:'PATCH',data:{action:'restore'}}));
 await deny(request('system_audit_logs/employment',{uid:'admin',method:'DELETE'}));
 await deny(request('system_audit_logs/normal',{uid:'admin',method:'PATCH',data:{type:'staff-employment'}}));
});
test('normal operational audit and attendance/leave/task writes remain usable',async()=>{
 await allow(request('system_audit_logs/operational',{method:'PATCH',data:{type:'check-in',userId:'staff'}}));
 await allow(request('attendance/new',{method:'PATCH',data:{user_id:'staff',date:'2026-10-30',type:'Present'}}));
 await allow(request('leaves/pending',{method:'PATCH',data:{status:'Cancelled'}}));
 await allow(request('work_plans/p',{method:'PATCH',data:{plans:[{task:'Normal work'}]}}));
});

test('missing personal plan cannot be read directly, but its owner can create it',async()=>{
 const path='work_plans/plan_staff_2026-10-31';
 await deny(request(path));
 await allow(request(path,{method:'PATCH',data:{id:'plan_staff_2026-10-31',userId:'staff',createdById:'staff',date:'2026-10-31',plans:[{task:'First daily task'}]}}));
 await allow(request(path));
});

if(process.env.STAFF_TASK_AUDIT_PATH)test('all audited active accounts can create/edit plans and save checkout with current rules',async t=>{
 const audit=JSON.parse(readFileSync(process.env.STAFF_TASK_AUDIT_PATH,'utf8'));
 assert.equal(audit.projectId,'crwiattendance');assert.equal(audit.liveRulesMatchLocal,true);
 const previousWindow=globalThis.window;
 const decode=v=>v.stringValue!==undefined?v.stringValue:v.booleanValue!==undefined?v.booleanValue:
  v.integerValue!==undefined?Number(v.integerValue):v.nullValue!==undefined?null:
  v.arrayValue?(v.arrayValue.values||[]).map(decode):Object.fromEntries(Object.entries(v.mapValue?.fields||{}).map(([k,val])=>[k,decode(val)]));
 try{for(const staff of audit.staff){
  const uid=staff.id,date=audit.today,id=`plan_${uid}_${date}`;
  const profile={name:staff.name,role:staff.role,isAdmin:staff.isAdmin,permissions:staff.usersAdmin?{users:'admin'}:{},status:'in',lastCheckIn:Date.now()-3600000};
  await allow(request('users/'+uid,{owner:true,method:'PATCH',data:profile}));
  globalThis.window={AppFirebaseAuth:{currentUser:{uid,getIdToken(){}}}};
  const db=new Database();
  let fallbackUsed=false;
  const reference=(collection,id)=>({collection,id,get:async()=>{
   const response=await request(collection+'/'+id,{uid});
   if(response.status===403)throw Object.assign(new Error('permission denied'),{code:'permission-denied'});
   if(response.status===404)return{exists:false};
   assert.equal(response.status,200,response.text);
   return{exists:true,data:()=>decode({mapValue:{fields:JSON.parse(response.text).fields}})};
  }});
  db.db={collection:name=>({doc:id=>reference(name,id)}),batch:()=>{
   const writes=[];return{set:(ref,data)=>writes.push({ref,data}),commit:async()=>{
    for(const {ref,data}of writes)await allow(request(ref.collection+'/'+ref.id,{uid,method:'PATCH',data}));
   }};
  }};
  db.readStaffData=async(collection,query,options)=>{
   assert.equal(options.source,'server');fallbackUsed=true;
   const response=await request(collection+'/'+query.id,{owner:true});
   assert.equal(response.status,404,'Fallback must confirm an absent document');return[];
  };
  await db.putWorkPlan({id,userId:uid,date,plans:[{task:'Local test task'}]});
  assert.equal(fallbackUsed,staff.missingPlanReadRisk,staff.name+': missing-plan read access');
  await allow(request('work_plans/'+id,{uid}));
  // Reproduce the other save failure: an administrator originally created
  // the plan and the staff editor sends itself as creator on the next save.
  await allow(request('work_plans/'+id,{owner:true,method:'PATCH',data:{createdById:'admin',createdByName:'Admin'}}));
  await db.putWorkPlan({id,userId:uid,date,createdById:uid,createdByName:staff.name,plans:[{task:'Assigned work'},{task:'Added work'}]});
  const saved=await reference('work_plans',id).get();
  assert.equal(saved.data().createdById,'admin',staff.name+': creator preserved');
  assert.equal(saved.data().plans.length,2);
  await allow(request('attendance/checkout_'+uid,{uid,method:'PATCH',data:{user_id:uid,date,checkInAt:profile.lastCheckIn,checkOutAt:Date.now(),type:'Present',entrySource:'checkin_checkout'}}));
  await allow(request('users/'+uid,{uid,method:'PATCH',data:{status:'out',lastCheckIn:null,lastCheckOut:Date.now(),currentLocation:null}}));
  t.diagnostic(staff.name+': first task, admin-created plan edit, attendance save and checkout status passed');
 }}finally{globalThis.window=previousWindow;}
});

for(const path of ['users/former','attendance/former','leaves/former','minutes/former','staff_messages/former-thread','work_plans/former-plan','private_work_plan_tasks/former-private'])test(`normal staff cannot read former history directly: ${path}`,async()=>{
 await deny(request(path));
});
test('payroll permission alone cannot read former payroll or private records',async()=>{
 await deny(request('salaries/former',{uid:'payroll'}));await deny(request('user_private/former',{uid:'payroll'}));
 await allow(request('salaries/former',{uid:'admin'}));await allow(request('user_private/former',{uid:'admin'}));
});
test('unrelated staff cannot edit another sender’s message',async()=>{
 await deny(request('staff_messages/thread',{uid:'birthday',method:'PATCH',data:{message:'Hijacked'}}));
 await deny(request('staff_messages/thread',{uid:'manager',method:'PATCH',data:{message:'Hijacked'}}));
 await allow(request('staff_messages/thread',{method:'PATCH',data:{message:'Sender edit'}}));
});
test('message recipient can mark read and append their own response, but cannot change participants',async()=>{
 await allow(request('staff_messages/thread',{uid:'manager',method:'PATCH',data:{read:true,status:'approved',history:[{action:'approved',byId:'manager'}]}}));
 await deny(request('staff_messages/thread',{uid:'manager',method:'PATCH',data:{fromId:'manager'}}));
 await deny(request('staff_messages/thread',{uid:'manager',method:'PATCH',data:{history:[{byId:'staff'}]}}));
});
test('message create cannot impersonate another sender or target former staff',async()=>{
 await deny(request('staff_messages/forged',{method:'PATCH',data:{fromId:'manager',toId:'staff',message:'Forged'}}));
 await deny(request('staff_messages/retired',{method:'PATCH',data:{fromId:'staff',toId:'former',message:'Disallowed'}}));
 await allow(request('staff_messages/new',{method:'PATCH',data:{fromId:'staff',toId:'manager',message:'Real message'}}));
});
test('minutes content is editable only by its creator or minutes admin',async()=>{
 await deny(request('minutes/shared',{uid:'manager',method:'PATCH',data:{title:'Hijacked'}}));
 await deny(request('minutes/shared',{uid:'birthday',method:'PATCH',data:{createdBy:'birthday'}}));
 await allow(request('minutes/shared',{method:'PATCH',data:{title:'Creator edit'}}));
 await deny(request('minutes/shared',{method:'PATCH',data:{approvals:{manager:'forged'}}}));
});
test('locked minutes cannot be silently rewritten through the client',async()=>{
 await allow(request('minutes/shared',{owner:true,method:'PATCH',data:{locked:true}}));
 await deny(request('minutes/shared',{method:'PATCH',data:{title:'Rewrite locked'}}));
 await deny(request('minutes/shared',{uid:'admin',method:'PATCH',data:{title:'Rewrite locked'}}));
});
test('meeting and calendar event ownership cannot be hijacked',async()=>{
 await deny(request('meetings/owned',{uid:'manager',method:'PATCH',data:{title:'Hijacked'}}));
 await allow(request('meetings/owned',{method:'PATCH',data:{title:'Owner edit'}}));
 await deny(request('meetings/owned',{method:'PATCH',data:{createdById:'manager'}}));
 await deny(request('events/calendar',{method:'PATCH',data:{title:'Forged holiday'}}));
 await allow(request('events/calendar',{uid:'admin',method:'PATCH',data:{title:'Authorized holiday edit'}}));
});
test('staff telemetry cannot be turned into a calendar holiday',async()=>{
 await deny(request('events/telemetry',{method:'PATCH',data:{type:'holiday'}}));
 await allow(request('events/telemetry',{method:'PATCH',data:{timestamp:123}}));
});
test('location and task activity cannot impersonate another staff member',async()=>{
 await deny(request('location_audits/forged',{method:'PATCH',data:{userId:'manager'}}));
 await deny(request('task_activity_events/forged',{method:'PATCH',data:{userId:'manager'}}));
 await allow(request('location_audits/own',{method:'PATCH',data:{userId:'staff',status:'Success'}}));
 await allow(request('task_activity_events/own',{method:'PATCH',data:{userId:'staff',actorId:'staff',date:'2026-10-30'}}));
});
test('staff cannot corrupt other people’s reflections or work-plan ownership',async()=>{
 await allow(request('journey_reflections/own',{method:'PATCH',data:{userId:'staff',date:'2026-10-30',note:'Reflection'}}));
 await deny(request('journey_reflections/own',{uid:'manager',method:'PATCH',data:{note:'Hijacked'}}));
 await deny(request('work_plans/p',{uid:'manager',method:'PATCH',data:{plans:[{task:'Hijacked'}]}}));
 await deny(request('work_plans/p',{method:'PATCH',data:{userId:'manager'}}));
});

test('staff cannot create a work plan owned by someone else',async()=>{
 await deny(request('work_plans/forged-owner',{method:'PATCH',data:{userId:'manager',createdById:'staff',plans:[]}}));
 await allow(request('work_plans/own-new',{method:'PATCH',data:{userId:'staff',createdById:'staff',plans:[]}}));
});

test('private task creation binds the private body to its real parent owner',async()=>{
 const data={id:'private-own',ownerId:'staff',createdById:'staff',assignedTo:'staff',planId:'p',taskIndex:0,task:{task:'Private'}};
 await allow(request('private_work_plan_tasks/private-own',{method:'PATCH',data}));
 await deny(request('private_work_plan_tasks/forged-parent',{method:'PATCH',data:{...data,id:'forged-parent',planId:'former-plan'}}));
});

test('shared ranking caches cannot be poisoned by ordinary staff',async()=>{
 const data={dateKey:'2026-10-30',version:1,generatedAt:123};
 for(const collection of ['daily_summaries','daily_summaries_meta']){
  await deny(request(collection+'/test',{method:'PATCH',data}));
  await allow(request(collection+'/test',{uid:'admin',method:'PATCH',data}));
  await deny(request(collection+'/invalid',{uid:'admin',method:'PATCH',data:{dateKey:'invalid',version:1}}));
 }
});

test('classification ownership and inactive AI storage reject unauthorized writes',async()=>{
 await allow(request('classification_patterns/own',{method:'PATCH',data:{userId:'staff'}}));
 await deny(request('classification_patterns/own',{uid:'manager',method:'PATCH',data:{userId:'manager'}}));
 await deny(request('ai_memory/forged',{method:'PATCH',data:{userId:'staff'}}));
});
