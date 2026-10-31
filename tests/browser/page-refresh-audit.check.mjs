// Regression coverage for the seven refresh failures found in the audit.
// Executes current source handlers and the real page updater with dummy services.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { parse } from 'acorn';
import { chromium } from 'playwright';

function sourceNode(file, predicate) {
    const source = readFileSync(file, 'utf8');
    const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
    let found;
    function visit(node) {
        if (!found && predicate(node)) found = source.slice(node.start, node.end);
        if (!found) for (const value of Object.values(node)) {
            if (Array.isArray(value)) value.forEach(child => { if (child?.type) visit(child); });
            else if (value?.type) visit(value);
        }
    }
    visit(ast);
    assert.ok(found, `Source handler not found in ${file}`);
    return found;
}
const fn = (file, name) => sourceNode(file, n => n.type === 'FunctionDeclaration' && n.id?.name === name);
const assignment = (file, name) => sourceNode(file, n => n.type === 'AssignmentExpression' && n.left.object?.name === 'window' && n.left.property?.name === name && n.operator === '=') + ';';
const method = (file, name) => sourceNode(file, n => n.type === 'MethodDefinition' && n.key.name === name);
const refresh = fn('js/app.js', 'refreshDashboardAfterAttendance');
const bindEvents = fn('js/ui/team-activities.js', 'bindEvents');
const complete = assignment('js/ui/team-activities.js', 'app_teamActivitiesCompleteTask');
const minutes = fn('js/app.js', 'startMinutesRealtimeListener');
const listener = method('js/modules/db.js', 'listenStaffData');
const teamRefresh = fn('js/ui/team-activities.js', 'refreshData');
const monthChange = assignment('js/app.js', 'app_changeCalMonth');
const adminListener = fn('js/app.js', 'startAdminRealtimeListener');
const results = [];
const base=process.env.BASE_URL || 'http://127.0.0.1:3031';
assert.ok(!readFileSync('js/ui/team-activities.js','utf8').includes('onclick="window.app_teamActivitiesCompleteTask(this)"'));
const browser = await chromium.launch({ headless: true });
async function run(name, code, check) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
        await page.route('**/__refresh_fixture',route=>route.fulfill({contentType:'text/html',body:'<main id="page-content"><input id="draft" value="unsaved text"><section id="unrelated">Open card</section></main>'}));
        await page.goto(base+'/__refresh_fixture');
        await page.evaluate(async()=>{const module=await import('/js/utils/page-updates.js');window.refreshPage=module.refreshPage;window.patchContent=module.patchContent;window.beginPageUpdate=module.beginPageUpdate;});
        if (name.startsWith('real Admin')) await page.evaluate(() => import('/js/ui/admin.js').then(() => {}));
        if (name.startsWith('real Dashboard')) await page.evaluate(() => import('/js/ui/dashboard.js').then(() => {}));
        await page.addScriptTag({ content: code });
        await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,0)));
        const result = await page.evaluate(() => window.auditResult());
        try { check(result); } catch (error) { console.error(name, result); throw error; }
        assert.deepEqual(errors, []);
        results.push({ name, passed: true, evidence: result });
        console.log('PASS: ' + name + ' ' + JSON.stringify(result));
    } finally { await page.close(); }
}
try {
    await run('one Team Activities click invokes Complete once', `
        const state={bound:false,filtered:[],pageSize:50};
        function getTeamActivitiesState(){return state;}
        let calls=0;
        window.app_teamActivitiesCompleteTask=async()=>{calls++;};
        ${bindEvents}
        bindEvents();
        document.querySelector('main').insertAdjacentHTML('beforeend','<button id="complete" type="button" data-action="complete">Complete</button>');
        window.auditResult=async()=>{document.getElementById('complete').click();await Promise.resolve();return {calls};};
    `, r => assert.equal(r.calls, 1));

    await run('Complete preserves unrelated dashboard DOM and the current draft', `
        location.hash='dashboard';
        const state={data:[]};const pendingTaskActions=new Set();let renders=0;
        function getTeamActivitiesState(){return state;}
        function updateUI(){} function refreshData(){} function setupDashboardEvents(){}
        const AppUI={renderDashboard:async()=>{renders++;return '<input id="draft" value="server default"><section id="unrelated">Open card</section><span id="saved">Done</span>';}};
        window.AppAuth={getUser:()=>({id:'qa'})};
        window.AppCalendar={updateTaskStatus:async()=>({plans:[{task:'Dummy',status:'completed'}]})};
        window.app_promptOptionalComment=async()=>'';
        ${refresh}
        window.app_refreshDashboard=refreshDashboardAfterAttendance;
        ${complete}
        document.querySelector('main').insertAdjacentHTML('beforeend','<div class="dashboard-worklog-card"><span class="dashboard-card-summary">1 task</span><div><div class="dashboard-planned-task-item"><button id="task" data-plan-id="qa-plan" data-task-index="0" data-user-id="qa">Complete</button></div></div></div>');
        window.auditResult=async()=>{const original=document.getElementById('unrelated');const draft=document.getElementById('draft');draft.value='Still typing';draft.dispatchEvent(new Event('input',{bubbles:true}));draft.focus();await window.app_teamActivitiesCompleteTask(document.getElementById('task'),{dashboardAction:true});await Promise.resolve();await Promise.resolve();return {renders,unrelatedPreserved:original.isConnected,draftExists:!!document.getElementById('draft'),draftValue:document.getElementById('draft')?.value,saved:!!document.getElementById('saved')};};
    `, r => { assert.equal(r.renders, 1); assert.equal(r.unrelatedPreserved, true); assert.equal(r.draftExists, true); assert.equal(r.draftValue, 'Still typing'); assert.equal(r.saved,true); });

    await run('slow dashboard refresh leaves the new route intact', `
        location.hash='dashboard';let finish;
        const AppUI={renderDashboard:()=>new Promise(resolve=>{finish=resolve;})};
        function setupDashboardEvents(){}
        ${refresh}
        window.auditResult=async()=>{const pending=refreshDashboardAfterAttendance();location.hash='staff-directory';document.getElementById('page-content').innerHTML='<h2>Staff Directory</h2>';finish('<h2>Dashboard from old request</h2>');await pending;return {hash:location.hash,text:document.getElementById('page-content').textContent};};
    `, r => { assert.equal(r.hash, '#staff-directory'); assert.equal(r.text, 'Staff Directory'); });

    await run('unchanged polling leaves Minutes and its filter intact', `
        location.hash='minutes';
        let minutesListenerUnsubscribe=null,minutesRealtimeDebounceTimer=null,minutesRealtimePending=false;
        let poll,renders=0;
        window.setInterval=(fn,ms)=>{poll={fn,ms};return 1;};window.clearInterval=()=>{};
        const AppConfig={READ_OPT_FLAGS:{}};
        const AppUI={renderMinutes:async()=>{renders++;return '<h2>Minutes render '+renders+'</h2>';}};
        class DummyAdapter { ${listener} }
        const adapter=new DummyAdapter();adapter.readStaffData=async()=>[{id:'same',title:'Unchanged'}];
        window.AppDB={listen:(collection,callback)=>adapter.listenStaffData(collection,[],{},callback)};
        ${minutes}
        window.auditResult=async()=>{startMinutesRealtimeListener();await new Promise(resolve=>setTimeout(resolve,360));const first=renders;document.getElementById('page-content').insertAdjacentHTML('beforeend','<input id="filter" value="current filter">');await poll.fn();await new Promise(resolve=>setTimeout(resolve,360));minutesListenerUnsubscribe();return {first,afterSameData:renders,pollMs:poll.ms,filterPreserved:!!document.getElementById('filter')};};
    `, r => { assert.equal(r.first, 1); assert.equal(r.afterSameData, 1); assert.equal(r.pollMs, 30000); assert.equal(r.filterPreserved, true); });
    await run('Team Activities refresh preserves its page and selection', `
        const state={page:4,selectedKeys:['qa-task'],startIso:'2026-10-01',endIso:'2026-10-30'};
        function getTeamActivitiesState(){return state;} function normalizeActivityRows(rows){return rows;}
        function updateUI(){} function focusConfiguredTask(){}
        window.AppAnalytics={getAllStaffActivities:async()=>[{planId:'qa-plan',taskIndex:0,status:'completed'}]};
        ${teamRefresh}
        window.auditResult=async()=>{await refreshData();return {page:state.page,selectedKeys:state.selectedKeys};};
    `, r => { assert.equal(r.page, 4); assert.deepEqual(r.selectedKeys, ['qa-task']); });

    await run('overlapping month refreshes keep the newest result', `
        window.app_calMonth=8;window.app_calYear=2026;const pending=[];
        const AppUI={renderDashboard:()=>new Promise(resolve=>pending.push({resolve,month:window.app_calMonth}))};
        function setupDashboardEvents(){}
        ${monthChange}
        window.auditResult=async()=>{window.app_changeCalMonth(1);window.app_changeCalMonth(1);pending[1].resolve('Month '+pending[1].month);await Promise.resolve();pending[0].resolve('Month '+pending[0].month);await Promise.resolve();return {selectedMonth:window.app_calMonth,displayed:document.getElementById('page-content').textContent};};
    `, r => { assert.equal(r.selectedMonth, 10); assert.equal(r.displayed, 'Month 10'); });

    await run('background rating change updates Admin without losing a typed input', `
        location.hash='admin';let adminListenerUnsubscribe=[],renders=0;const callbacks={};
        const AppConfig={READ_OPT_FLAGS:{}};
        const AppUI={renderAdmin:async()=>{renders++;return '<input id="draft" value="server default"><h2>Updated Admin</h2>';}};
        window.AppDB={listen:(collection,callback)=>{callbacks[collection]=callback;return()=>{};}};
        ${adminListener}
        window.auditResult=async()=>{const draft=document.getElementById('draft');draft.value='Unsaved edit';draft.dispatchEvent(new Event('input',{bubbles:true}));startAdminRealtimeListener();callbacks.users([{id:'qa',status:'out',rating:1}]);callbacks.users([{id:'qa',status:'out',rating:2}]);await new Promise(resolve=>setTimeout(resolve,680));adminListenerUnsubscribe.forEach(stop=>stop());return {renders,draftPreserved:!!document.getElementById('draft'),draftValue:document.getElementById('draft')?.value};};
    `, r => { assert.equal(r.renders, 1); assert.equal(r.draftPreserved, true); assert.equal(r.draftValue, 'Unsaved edit'); });
    await run('overlapping Complete calls prompt and save only once', `
        const pendingTaskActions=new Set();const state={data:[]};let prompts=0,saves=0,answer;
        function getTeamActivitiesState(){return state;}function updateUI(){}function refreshData(){}function showInlineActionToast(){}
        window.AppAuth={getUser:()=>({id:'qa'})};
        window.AppCalendar={updateTaskStatus:async()=>{saves++;return {plans:[{}]};}};
        window.app_promptOptionalComment=()=>{prompts++;return new Promise(resolve=>{answer=resolve;});};
        ${complete}
        document.querySelector('main').insertAdjacentHTML('beforeend','<button id="task" data-plan-id="qa" data-task-index="0" data-user-id="qa">Complete</button>');
        window.auditResult=async()=>{const btn=document.getElementById('task');const first=window.app_teamActivitiesCompleteTask(btn);const second=window.app_teamActivitiesCompleteTask(btn);answer('');await Promise.all([first,second]);return {prompts,saves,pending:pendingTaskActions.size};};
    `, r => { assert.equal(r.prompts,1);assert.equal(r.saves,1);assert.equal(r.pending,0); });

    await run('updates preserve caret, focus, open details and scroll while changing totals', `
        document.querySelector('main').innerHTML='<div style="height:1100px"></div><input id="edit" value="server"><details id="details"><summary>Open</summary><p>Details</p></details><div id="scroll" style="height:50px;overflow:auto"><div style="height:500px">List</div></div><span id="total">1</span><div style="height:900px"></div>';
        window.auditResult=async()=>{const field=document.getElementById('edit');field.value='Unsaved typing';field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();field.setSelectionRange(3,7);document.getElementById('details').open=true;document.getElementById('scroll').scrollTop=85;window.scrollTo(0,900);const top=scrollY;
        const html=document.querySelector('main').innerHTML.replace('>1</span>','>2</span>');await refreshPage(async()=>html);return {same:field===document.getElementById('edit'),value:field.value,focus:document.activeElement===field,selection:[field.selectionStart,field.selectionEnd],open:document.getElementById('details').open,scroll:document.getElementById('scroll').scrollTop,viewport:scrollY===top,total:document.getElementById('total').textContent};};
    `, r => { assert.equal(r.same,true);assert.equal(r.value,'Unsaved typing');assert.equal(r.focus,true);assert.deepEqual(r.selection,[3,7]);assert.equal(r.open,true);assert.equal(r.scroll,85);assert.equal(r.viewport,true);assert.equal(r.total,'2'); });

    await run('leaving and returning to a route invalidates its old pending render', `
        location.hash='dashboard';let finish;
        window.auditResult=async()=>{const pending=refreshPage(()=>new Promise(resolve=>{finish=resolve;}));location.hash='profile';await new Promise(resolve=>setTimeout(resolve,0));location.hash='dashboard';await new Promise(resolve=>setTimeout(resolve,0));document.querySelector('main').innerHTML='<h2>New visit</h2>';finish('<h2>Old visit</h2>');await pending;return {text:document.querySelector('main').textContent};};
    `, r => assert.equal(r.text,'New visit'));

    await run('changed polling data still reaches subscribers after an unchanged poll', `
        let poll;window.setInterval=fn=>{poll=fn;return 1;};window.clearInterval=()=>{};
        class DummyAdapter { ${listener} }
        const adapter=new DummyAdapter();let value=1;adapter.readStaffData=async()=>[{id:'same',value}];const values=[];
        window.auditResult=async()=>{const stop=adapter.listenStaffData('minutes',[],{},rows=>values.push(rows[0].value));await new Promise(resolve=>setTimeout(resolve,0));await poll();value=2;await poll();stop();return {values};};
    `, r => assert.deepEqual(r.values,[1,2]));
    await run('real Admin renderer preserves the open staff card and updates its rows', `
        location.hash='admin';
        const users=[{id:'qa-admin',name:'Admin',isAdmin:true,status:'out',username:'admin'},{id:'qa-staff',name:'Staff One',status:'out',username:'one'}];
        window.AppAuth={getUser:()=>users[0]};
        window.AppDB={getAll:async name=>name==='users'?users:[],queryMany:async()=>[],get:async()=>null,cache:new Map()};
        window.AppAnalytics={getSystemPerformance:async()=>({}),getAllStaffActivities:async()=>[],memo:new Map()};
        window.AppLeaves={getAllLeaves:async()=>[],getPendingLeaves:async()=>[]};
        window.app_hasPerm=()=>true;window.app_isAdminUser=()=>true;window.app_canManageBirthdays=()=>false;window.app_canAdminBirthdays=()=>false;window.app_canCustomizeDashboard=()=>false;
        window.auditResult=async()=>{const {renderAdmin}=await import('/js/ui/admin.js');document.querySelector('main').innerHTML=await renderAdmin();window.app_toggleAdminCardMode('staff-management','fullscreen');const body=document.getElementById('admin-card-max-body');const search=body.querySelector('[data-staff-employment-search]');search.value='Staff';search.dispatchEvent(new Event('input',{bubbles:true}));search.focus();users.push({id:'qa-new',name:'Staff Two',status:'out',username:'two'});await window.app_refreshAdminPage({preserveCardId:'staff-management'});return {open:window._adminMaxCardId,search:body.querySelector('[data-staff-employment-search]').value,same:search===body.querySelector('[data-staff-employment-search]'),focus:document.activeElement===search,newRow:body.textContent.includes('Staff Two')};};
    `, r => {assert.equal(r.open,'staff-management');assert.equal(r.search,'Staff');assert.equal(r.same,true);assert.equal(r.focus,true);assert.equal(r.newRow,true);});
    await run('real Dashboard renderer leaves the mounted page intact while waiting for data', `
        location.hash='dashboard';let statusRequested=false;
        const user={id:'qa',name:'QA'};
        window.AppAuth={getUser:()=>user};window.app_hasPerm=()=>false;window.app_isAdminUser=()=>false;window.app_canSeeAdminPanel=()=>false;
        window._dashboardRefreshScheduled=true;window._heroEodRefreshScheduled=true;window.AppJourneyReflection=null;window.app_dashboardCustomization=null;
        window.AppDB={getISTDateKeys:()=>({todayKey:'2026-10-30',yesterdayKey:'2026-10-29'})};
        window.AppAttendance={getStatus:()=>{statusRequested=true;return new Promise(()=>{});},getLogs:async()=>[]};
        window.AppAnalytics={getUserMonthlyStats:async()=>({}),getUserYearlyStats:async()=>({})};
        window.AppAnalyticsService={getWorkPlansByDateRange:async()=>[]};window.AppCalendar={getPlans:async()=>({leaves:[],events:[]})};window.AppUserService={getActiveStaff:async()=>[user]};window.AppMinutes={getMinutes:async()=>[]};
        window.auditResult=async()=>{const {renderDashboard}=await import('/js/ui/dashboard.js');const original=document.getElementById('draft');let error=null;void renderDashboard({preserveView:true}).catch(e=>{error=e.message;});await new Promise(resolve=>setTimeout(resolve,40));return {statusRequested,preserved:original===document.getElementById('draft'),error};};
    `, r => {assert.equal(r.statusRequested,true);assert.equal(r.preserved,true);assert.equal(r.error,null);});
    await run('Minutes defers changed data during editing and applies it once the editor closes', `
        location.hash='minutes';let minutesListenerUnsubscribe=null,minutesRealtimeDebounceTimer=null,minutesRealtimePending=false;
        const AppConfig={READ_OPT_FLAGS:{}};let notify,renders=0;
        const AppUI={renderMinutes:async()=>{renders++;return '<h2>Updated notes</h2>';}};
        window.AppDB={listen:(_collection,callback)=>{notify=callback;return()=>{};}};
        window.AppMinutes={isMinutesDirtyState:true};
        ${minutes}
        window.auditResult=async()=>{startMinutesRealtimeListener();notify();await new Promise(resolve=>setTimeout(resolve,350));const duringEdit=renders;window.AppMinutes.isMinutesDirtyState=false;await new Promise(resolve=>setTimeout(resolve,1050));minutesListenerUnsubscribe();return {duringEdit,afterClose:renders};};
    `, r=>{assert.equal(r.duringEdit,0);assert.equal(r.afterClose,1);});
} finally {
    await browser.close();
    mkdirSync('test-results', { recursive: true });
    writeFileSync('test-results/page-refresh-fixed-results.json', JSON.stringify(results, null, 2));
}
