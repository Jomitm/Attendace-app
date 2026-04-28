(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(s){if(s.ep)return;s.ep=!0;const i=t(s);fetch(s.href,i)}})();const N={WORK_START_TIME:"09:00",LATE_CUTOFF_TIME:"09:15",WORK_END_TIME:"17:00",LATE_CUTOFF_MINUTES:555,MINOR_LATE_END_MINUTES:615,LATE_END_MINUTES:720,POST_NOON_END_MINUTES:810,AFTERNOON_START_MINUTES:720,EARLY_DEPARTURE_MINUTES:1020,FY_START_MONTH:3,IS_SATURDAY_OFF:a=>{const t=new Date(a).getDate(),n=Math.ceil(t/7);return n===2||n===4},LATE_GRACE_COUNT:3,LATE_DEDUCTION_PER_BLOCK:.5,EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4,READ_CACHE_TTLS:{users:6e4,settings:3e5,minutes:3e4,attendanceSummary:3e4,staffMessages:2e4,dailySummaryReadMs:6e4},READ_OPT_FLAGS:{FF_READ_OPT_DB_QUERIES:!0,FF_READ_OPT_TARGETED_REALTIME:!0,FF_READ_OPT_ANALYTICS_CACHE:!0,FF_SHARED_DAILY_SUMMARY:!0,FF_SUMMARY_LOCKING:!0,ENABLE_SIMULATION_MODULE:!1,ENABLE_READ_TELEMETRY:!0,ENABLE_PRESENCE_HEARTBEAT:!1},SUMMARY_POLICY:{STALENESS_MS:1440*60*1e3,TEAM_ACTIVITY_LIMIT:15,LOCK_TTL_MS:9e4,SCHEMA_VERSION:4,GENERATE_ON_FIRST_CHECKIN:!0,RECOMPUTE_CUTOFF_HOUR_IST:17,FALLBACK_TO_PREVIOUS_DAY:!0},HERO_POLICY:{SCHEMA_VERSION:4,WINDOW_DAYS:7,FALLBACK_LOOKBACK_DAYS:90,WEIGHTS:{taskExecution:.45,taskCompletionRate:.2,taskInProgressSupport:.1,taskMissPenalty:.1},ATTENDANCE_MODIFIER:{base:.9,maxBonus:.15,consistencyImpact:.65,effortImpact:.35},CAPS:{hours:40,qualityChars:500},DEFAULT_ACTIVITY_SCORE:70,MIN_EVIDENCE:{minDays:1,minDurationMs:1,minPlannedTasks:1}},SIMULATION_POLICY:{LEGACY_DUMMY_CLEANUP:{ENABLED:!0,FLAG_KEY:"legacy_dummy_cleanup_v1",TARGET_USER_IDS:["sim_punctual","sim_admin_new"],TARGET_USERNAMES:["jomit_p","maria"],AUDIT_COLLECTION:"system_audit_logs"}}},Bs={apiKey:"AIzaSyC7a8AxukI0-egXimYTedwCa2RFnMTBu84",authDomain:"crwiattendance.firebaseapp.com",projectId:"crwiattendance",storageBucket:"crwiattendance.firebasestorage.app",messagingSenderId:"462155106938",appId:"1:462155106938:web:18291b04a5a3bec185c9c3",measurementId:"G-X6W45TV4QR"};typeof firebase<"u"&&!firebase.apps.length&&(firebase.initializeApp(Bs),console.log("Firebase Initialized (Compat Mode)"));const Tn=typeof firebase<"u"?firebase.firestore():null;typeof window<"u"&&(window.AppFirestore=Tn);class Rs{constructor(){this.db=Tn,this.cache=new Map,this.telemetry={get:0,getAll:0,query:0,queryMany:0,listen:0,listenQuery:0,writes:0,docsRead:0,byCollection:{}}}async init(){if(!this.db){console.error("Firebase not initialized! Check config.");return}console.log("Firestore adapter ready.")}getFlags(){return N&&N.READ_OPT_FLAGS||{}}track(e,t,n=0){this.getFlags().ENABLE_READ_TELEMETRY&&(typeof this.telemetry[e]=="number"&&(this.telemetry[e]+=1),this.telemetry.docsRead+=Math.max(0,Number(n)||0),this.telemetry.byCollection[t]||(this.telemetry.byCollection[t]={ops:0,docsRead:0}),this.telemetry.byCollection[t].ops+=1,this.telemetry.byCollection[t].docsRead+=Math.max(0,Number(n)||0))}getReadTelemetry(){return JSON.parse(JSON.stringify(this.telemetry))}clearReadTelemetry(){this.telemetry={get:0,getAll:0,query:0,queryMany:0,listen:0,listenQuery:0,writes:0,docsRead:0,byCollection:{}}}getCacheKey(e,t,n={}){return`${e}:${t}:${JSON.stringify(n)}`}invalidateCollectionCache(e){const t=`:${e}:`;for(const n of this.cache.keys())n.includes(t)&&this.cache.delete(n)}async getCached(e,t,n){const s=Date.now(),i=this.cache.get(e);if(i&&i.expiresAt>s)return i.value;const o=await n();return this.cache.set(e,{value:o,expiresAt:s+Math.max(0,Number(t)||0)}),o}async getOrGenerateSummary(e,t,n){if(!e||typeof t!="function")throw new Error("getOrGenerateSummary requires a key and generator function.");const s=this.getCacheKey("summary","computed",{summaryKey:e}),i=typeof n=="number"?n:N?.READ_CACHE_TTLS?.attendanceSummary||3e4;return this.getCached(s,i,t)}async sleep(e){return new Promise(t=>setTimeout(t,Math.max(0,Number(e)||0)))}getSummarySchemaVersion(){return Number(N?.SUMMARY_POLICY?.SCHEMA_VERSION||1)}getIstNow(){const e=new Date;return new Date(e.toLocaleString("en-US",{timeZone:"Asia/Kolkata"}))}toDateKey(e){const t=e instanceof Date?e:new Date(e),n=t.getFullYear(),s=String(t.getMonth()+1).padStart(2,"0"),i=String(t.getDate()).padStart(2,"0");return`${n}-${s}-${i}`}getISTDateKeys(){const e=this.getIstNow(),t=new Date(e);return t.setDate(t.getDate()-1),{todayKey:this.toDateKey(e),yesterdayKey:this.toDateKey(t)}}getISTDayRange(e){const t=String(e||"").trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(t))return null;const n=new Date(`${t}T00:00:00+05:30`),s=new Date(`${t}T23:59:59.999+05:30`);return Number.isNaN(n.getTime())||Number.isNaN(s.getTime())?null:{start:n,end:s,startMs:n.getTime(),endMs:s.getTime()}}shouldRecomputeNowIST(e){const t=Number.isFinite(Number(e))?Number(e):Number(N?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST||17);return this.getIstNow().getHours()>=Math.max(0,Math.min(23,t))}async hasAttendanceSignalForDate(e){const t=String(e||"").trim();if(!t)return!1;try{if(this.queryMany){const o=await this.queryMany("attendance",[{field:"date",operator:"==",value:t}],{limit:1});if(Array.isArray(o)&&o.length>0)return!0}const n=this.getISTDayRange(t);if(!n)return!1;if(this.queryMany){const o=await this.queryMany("users",[{field:"lastCheckIn",operator:">=",value:n.startMs},{field:"lastCheckIn",operator:"<=",value:n.endMs}],{limit:1});return Array.isArray(o)&&o.length>0}const[s,i]=await Promise.all([this.getAll("attendance"),this.getAll("users")]);return(s||[]).some(o=>String(o?.date||"")===t)?!0:(i||[]).some(o=>{const r=Number(o?.lastCheckIn||0);return Number.isFinite(r)&&r>=n.startMs&&r<=n.endMs})}catch(n){return console.warn("Failed to check attendance signal for date:",t,n),!1}}isSummaryFresh(e,t){if(!e||typeof e!="object")return!1;const n=Number(e.generatedAt||0),s=Number(e.version||0);return!n||!s||s!==this.getSummarySchemaVersion()?!1:Date.now()-n<=Math.max(0,Number(t)||0)}async getDailySummary(e){const t=String(e||"").trim();if(!t)return null;const n=N?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4,s=this.getCacheKey("dailySummary","daily_summaries",{key:t});return this.getCached(s,n,()=>this.get("daily_summaries",t))}listenDailySummary(e,t){const n=String(e||"").trim();if(!n)return null;const s=this.getCacheKey("dailySummary","daily_summaries",{key:n});return this.listenDoc("daily_summaries",n,(i,o)=>{if(i){const r=N?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4;this.cache.set(s,{value:i,expiresAt:Date.now()+r})}t&&t(i,o)})}async getSummaryByDateKey(e){return this.getDailySummary(e)}async getLatestSuccessfulSummaryMeta(){const e=N?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4,t=this.getCacheKey("dailySummaryMeta","daily_summaries_meta",{key:"latest_success"});return this.getCached(t,e,()=>this.get("daily_summaries_meta","latest_success"))}async setLatestSuccessfulSummaryMeta({dateKey:e,generatedAt:t,version:n}={}){const s=String(e||"").trim();if(!s)return;const i={id:"latest_success",dateKey:s,generatedAt:Number(t||Date.now()),version:Number(n||this.getSummarySchemaVersion())};await this.put("daily_summaries_meta",i)}async getDailySummaryWithFallback({todayKey:e,yesterdayKey:t,staleAfterMs:n}={}){const s=Math.max(1e3,Number(n)||Number(N?.SUMMARY_POLICY?.STALENESS_MS)||864e5),i=N?.SUMMARY_POLICY?.FALLBACK_TO_PREVIOUS_DAY!==!1,o=await this.getSummaryByDateKey(e);if(this.isSummaryFresh(o,s))return{summary:o,source:"today"};if(i){const d=await this.getSummaryByDateKey(t);if(d&&typeof d=="object")return{summary:d,source:"yesterday"}}const r=await this.getLatestSuccessfulSummaryMeta(),l=String(r?.dateKey||"").trim();if(l){const d=await this.getSummaryByDateKey(l);if(d&&typeof d=="object")return{summary:d,source:"latest_success"}}return{summary:o||null,source:"none"}}async putDailySummary(e,t={}){const n=String(e||"").trim();if(!n)throw new Error("putDailySummary requires dateKey.");const s={id:n,dateKey:n,version:this.getSummarySchemaVersion(),...t};return this.put("daily_summaries",s)}async acquireSummaryLock(e,t,n){const s=String(e||"").trim(),i=String(t||"").trim();if(!s||!i||!this.db||!this.db.runTransaction)return!1;if(N?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING===!1)return!0;const o=Math.max(1e3,Number(n)||Number(N?.SUMMARY_POLICY?.LOCK_TTL_MS)||9e4),r=this.db.collection("summary_locks").doc(s),l=Date.now();try{return await this.db.runTransaction(async c=>{const p=await c.get(r);if(p.exists){const u=p.data()||{},m=String(u.ownerId||"");if(Number(u.expiresAt||0)>l&&m&&m!==i)return!1}return c.set(r,{id:s,dateKey:s,ownerId:i,createdAt:l,expiresAt:l+o},{merge:!0}),!0})===!0}catch(d){return console.warn("Failed to acquire summary lock:",d),!1}}async releaseSummaryLock(e,t){const n=String(e||"").trim(),s=String(t||"").trim();if(!n||!s||!this.db||!this.db.runTransaction||N?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING===!1)return;const i=this.db.collection("summary_locks").doc(n);try{await this.db.runTransaction(async o=>{const r=await o.get(i);if(!r.exists)return;const l=r.data()||{};String(l.ownerId||"")===s&&o.delete(i)})}catch(o){console.warn("Failed to release summary lock:",o)}}async getOrCreateDailySummary({dateKey:e,yesterdayKey:t,generatorFn:n,staleAfterMs:s,lockTtlMs:i}={}){const o=this.getISTDateKeys(),r=String(e||o.todayKey||"").trim(),l=String(t||o.yesterdayKey||"").trim();if(!r||typeof n!="function")throw new Error("getOrCreateDailySummary requires dateKey and generatorFn.");const d=Math.max(1e3,Number(s)||Number(N?.SUMMARY_POLICY?.STALENESS_MS)||864e5),c=Math.max(1e3,Number(i)||Number(N?.SUMMARY_POLICY?.LOCK_TTL_MS)||9e4),p=String(window.AppAuth?.getUser?.()?.id||`anon_${Math.random().toString(36).slice(2,10)}`),u=await this.getDailySummaryWithFallback({todayKey:r,yesterdayKey:l,staleAfterMs:d});if(u.summary&&u.source==="today"&&this.isSummaryFresh(u.summary,d))return{...u.summary,_source:"shared_today"};if(N?.SUMMARY_POLICY?.GENERATE_ON_FIRST_CHECKIN!==!1){if(!await this.hasAttendanceSignalForDate(r))return u.summary?{...u.summary,_source:`fallback_${u.source}`}:null}else if(!this.shouldRecomputeNowIST(N?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST))return u.summary?{...u.summary,_source:`fallback_${u.source}`}:null;if(await this.acquireSummaryLock(r,p,c))try{const S={...await n()||{},generatedAt:Date.now(),generatedBy:p,version:this.getSummarySchemaVersion()};return await this.putDailySummary(r,S),await this.setLatestSuccessfulSummaryMeta({dateKey:r,generatedAt:S.generatedAt,version:S.version}),{dateKey:r,...S,_source:"generated"}}finally{await this.releaseSummaryLock(r,p)}const f=[350,700,1200,1800];for(const g of f){await this.sleep(g);const S=await this.getDailySummary(r);if(this.isSummaryFresh(S,d))return{...S,_source:"shared"}}return u.summary?{...u.summary,_source:`fallback_${u.source}`}:null}applyFilters(e,t=[]){let n=e;return(t||[]).forEach(s=>{!s||!s.field||!s.operator||(n=n.where(s.field,s.operator,s.value))}),n}applyOptions(e,t={}){let n=e;return t.orderBy&&(Array.isArray(t.orderBy)?t.orderBy:[t.orderBy]).forEach(i=>{i&&(typeof i=="string"?n=n.orderBy(i):i.field&&(n=n.orderBy(i.field,i.direction||"asc")))}),t.limit&&(n=n.limit(t.limit)),t.startAt!==void 0&&(n=n.startAt(t.startAt)),t.endAt!==void 0&&(n=n.endAt(t.endAt)),n}isPermissionDenied(e){const t=String(e?.code||"").toLowerCase(),n=String(e?.message||"").toLowerCase();return t.includes("permission-denied")||n.includes("missing or insufficient permissions")}async getAll(e,t={}){try{const n=String(t?.source||"").trim().toLowerCase(),o=(n==="server"||n==="cache"?await this.db.collection(e).get({source:n}):await this.db.collection(e).get()).docs.map(r=>({...r.data(),id:r.id}));return this.track("getAll",e,o.length),o}catch(n){if(t?.silentPermissionDenied&&this.isPermissionDenied(n))return[];throw console.error(`Error getting all from ${e}:`,n),n}}async get(e,t,n={}){if(!t)return null;try{const s=String(t),i=this.db.collection(e).doc(s),o=String(n?.source||"").trim().toLowerCase(),l=o==="server"||o==="cache"?await i.get({source:o}):await i.get();return l.exists?(this.track("get",e,1),{...l.data(),id:l.id}):(this.track("get",e,0),null)}catch(s){throw console.error(`Error getting ${t} from ${e}:`,s),s}}async add(e,t){if(t.id)return this.put(e,t);try{const n=await this.db.collection(e).add(t);return this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"add"}})),n.id}catch(n){throw console.error(`Error adding to ${e}:`,n),n}}async put(e,t){if(!t.id)throw new Error("Item must have an ID for 'put' operation.");try{const n=String(t.id);return await this.db.collection(e).doc(n).set(t,{merge:!0}),this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"put"}})),n}catch(n){throw console.error(`Error putting ${t.id} to ${e}:`,n),n}}async delete(e,t){if(t)try{const n=String(t);await this.db.collection(e).doc(n).delete(),this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"delete"}}))}catch(n){throw console.error(`Error deleting ${t} from ${e}:`,n),n}}async deleteMany(e,t=[],n={}){const s=Array.from(new Set((t||[]).filter(Boolean).map(r=>String(r))));if(!s.length)return 0;const i=Math.max(1,Math.min(450,Number(n.chunkSize)||400));let o=0;try{for(let r=0;r<s.length;r+=i){const l=s.slice(r,r+i),d=this.db.batch();l.forEach(c=>{const p=this.db.collection(e).doc(c);d.delete(p)}),await d.commit(),o+=l.length}return this.telemetry.writes+=o,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"deleteMany",count:o}})),o}catch(r){throw console.error(`Error deleting many from ${e}:`,r),r}}async deleteAllInCollection(e,t={}){const s=(await this.getAll(e,t)||[]).map(i=>i?.id).filter(Boolean);return s.length?this.deleteMany(e,s,t):0}async query(e,t,n,s){try{const o=(await this.db.collection(e).where(t,n,s).get()).docs.map(r=>({...r.data(),id:r.id}));return this.track("query",e,o.length),o}catch(i){throw console.error(`Error querying ${e}:`,i),i}}async queryMany(e,t=[],n={}){if(!this.getFlags().FF_READ_OPT_DB_QUERIES)return this.getAll(e);try{let i=this.db.collection(e);i=this.applyFilters(i,t),i=this.applyOptions(i,n);const r=(await i.get()).docs.map(l=>({...l.data(),id:l.id}));return this.track("queryMany",e,r.length),r}catch(i){return console.warn(`queryMany failed for ${e}, falling back to getAll`,i),this.getAll(e)}}async getManyByIds(e,t=[]){const n=Array.from(new Set((t||[]).filter(Boolean).map(o=>String(o))));if(!n.length)return[];const s=[];for(let o=0;o<n.length;o+=10)s.push(n.slice(o,o+10));return(await Promise.all(s.map(async o=>{try{const r=await this.queryMany(e,[{field:"id",operator:"in",value:o}]);return r&&r.length?r:Promise.all(o.map(l=>this.get(e,l)))}catch{return Promise.all(o.map(r=>this.get(e,r)))}}))).flat().filter(Boolean)}listenDoc(e,t,n){if(!this.db||!t)return null;const s=String(t);try{return this.db.collection(e).doc(s).onSnapshot(i=>{const o=i.exists?{...i.data(),id:i.id}:null;this.track("listen",e,1),n(o,i)},i=>{console.error(`Realtime listener error in ${e}/${s}:`,i)})}catch(i){return console.error(`Error setting up listener for ${e}/${s}:`,i),null}}listenQuery(e,t=[],n={},s){if(!this.db)return null;try{let i=this.db.collection(e);return i=this.applyFilters(i,t),i=this.applyOptions(i,n),i.onSnapshot(o=>{const r=o.docs.map(l=>({...l.data(),id:l.id}));this.track("listenQuery",e,r.length),s(r,o)},o=>{console.error(`Realtime query listener error in ${e}:`,o)})}catch(i){return console.warn(`listenQuery failed for ${e}, falling back to listen`,i),this.listen(e,s)}}listen(e,t){return this.db?this.db.collection(e).onSnapshot(n=>{const s=n.docs.map(i=>({...i.data(),id:i.id}));this.track("listen",e,s.length),t(s,n)},n=>{console.error(`Realtime listener error in ${e}:`,n)}):null}}const X=new Rs;typeof window<"u"&&(window.AppDB=X);class Os{constructor(){this.currentUser=null,this.sessionKey="crwi_session_user",this.heartbeatInterval=null,this.userDocUnsubscribe=null}async init(){await X.init();const e=localStorage.getItem(this.sessionKey);e&&(this.currentUser=await X.get("users",e),this.currentUser&&(this.startHeartbeat(),this.startCurrentUserSync()))}async refreshCurrentUserFromDB(){const e=localStorage.getItem(this.sessionKey);if(!e)return this.currentUser=null,null;if(this.userDocUnsubscribe&&this.currentUser&&this.currentUser.id===e)return this.currentUser;const t=await X.get("users",e);return this.currentUser=t||null,this.currentUser}async login(e,t){const n=X.getCached?await X.getCached(X.getCacheKey("authUsers","users",{mode:"login"}),N?.READ_CACHE_TTLS?.users||6e4,()=>X.getAll("users")):await X.getAll("users"),s=e.trim().toLowerCase(),i=t.trim(),o=n.find(r=>{const l=(r.username||"").toLowerCase().trim(),d=(r.email||"").toLowerCase().trim();return(l===s||d===s)&&r.password.trim()===i});return o?(this.currentUser=o,localStorage.setItem(this.sessionKey,o.id),this.startHeartbeat(),this.startCurrentUserSync(),!0):(console.warn("Login failed: invalid credentials."),!1)}async logout(){this.stopHeartbeat(),this.stopCurrentUserSync(),this.currentUser=null,localStorage.removeItem(this.sessionKey),window.location.reload()}getUser(){return this.currentUser}async updateUser(e){const t=await X.get("users",e.id);if(!t)return!1;const n={...t,...e};return e.isAdmin===!0||e.isAdmin==="true"?n.isAdmin=!0:n.isAdmin=!1,n.role=e.role||t.role||"Employee",console.log(`Auth: User ${n.id} update - Role: ${n.role}, Admin: ${n.isAdmin}`),e.name&&e.name!==t.name&&!e.avatar&&(n.avatar=`https://ui-avatars.com/api/?name=${e.name}&background=random&color=fff`),await X.put("users",n),this.currentUser&&this.currentUser.id===n.id&&(this.currentUser=n),!0}startHeartbeat(){if(!(N&&N.READ_OPT_FLAGS||{}).ENABLE_PRESENCE_HEARTBEAT){this.stopHeartbeat();return}this.heartbeatInterval&&clearInterval(this.heartbeatInterval);const t=async()=>{if(this.currentUser&&X)try{await X.put("users",{id:this.currentUser.id,lastSeen:Date.now()})}catch(n){console.warn("Heartbeat update failed:",n)}};t(),this.heartbeatInterval=setInterval(t,12e4),console.log("Presence Heartbeat started.")}stopHeartbeat(){this.heartbeatInterval&&(clearInterval(this.heartbeatInterval),this.heartbeatInterval=null,console.log("Presence Heartbeat stopped."))}startCurrentUserSync(){this.stopCurrentUserSync();const e=localStorage.getItem(this.sessionKey);if(!(!e||!window.AppFirestore))try{this.userDocUnsubscribe=window.AppFirestore.collection("users").doc(String(e)).onSnapshot(t=>{if(!t.exists){this.currentUser=null;return}const n={...t.data(),id:t.id};this.currentUser=n,window.dispatchEvent(new CustomEvent("app:user-sync",{detail:n}))},t=>{console.warn("Current user realtime sync failed:",t)})}catch(t){console.warn("Failed to start current user sync:",t)}}stopCurrentUserSync(){typeof this.userDocUnsubscribe=="function"&&this.userDocUnsubscribe(),this.userDocUnsubscribe=null}}const te=new Os;typeof window<"u"&&(window.AppAuth=te);const nn=(a,e)=>Number.isFinite(Number(a))&&Number.isFinite(Number(e));class Fs{async getStatus(){const e=await(te.refreshCurrentUserFromDB?te.refreshCurrentUserFromDB():te.getUser());if(!e)return{status:"out",lastCheckIn:null,isPaused:!1,pauseStartedAt:null,totalPausedMs:0};if(e.status==="in"&&e.lastCheckIn)try{const t=new Date(e.lastCheckIn),n=new Date,s=t.toISOString().split("T")[0],i=n.toISOString().split("T")[0];if(s<i)return{status:"out",lastCheckIn:null,isPaused:!1,pauseStartedAt:null,totalPausedMs:0,staleSession:!0};if(await this.hasRecordedCheckoutForSession(e.id,t,n)){const r={...e,status:"out",lastCheckIn:null,isPaused:!1,pauseStartedAt:null,totalPausedMs:0};try{await X.put("users",r)}catch(l){console.warn("Failed to self-heal stale checked-in status from attendance logs:",l)}return te&&(te.currentUser=r),{status:"out",lastCheckIn:null,isPaused:!1,pauseStartedAt:null,totalPausedMs:0,healedFromAttendanceLog:!0}}}catch(t){console.warn("Date parsing error in getStatus:",t)}return{status:e.status||"out",lastCheckIn:e.lastCheckIn,isPaused:e.isPaused===!0,pauseStartedAt:e.pauseStartedAt||null,totalPausedMs:Number(e.totalPausedMs)||0}}async checkIn(e,t,n="Unknown Location"){const s=await(te.refreshCurrentUserFromDB?te.refreshCurrentUserFromDB():te.getUser());if(!s)throw new Error("User not authenticated");if(!nn(e,t))throw new Error("Location is required for check-in. Please enable location and try again.");let i=!1,o="",r=null,l=null;if(s.status==="in"&&s.lastCheckIn){const c=new Date(s.lastCheckIn),p=new Date,u=`${c.getFullYear()}-${String(c.getMonth()+1).padStart(2,"0")}-${String(c.getDate()).padStart(2,"0")}`,m=`${p.getFullYear()}-${String(p.getMonth()+1).padStart(2,"0")}-${String(p.getDate()).padStart(2,"0")}`;if(u<m)if(await this.hasRecordedCheckoutForSession(s.id,c,p))s.status="out",s.lastCheckIn=null,s.isPaused=!1,s.pauseStartedAt=null,s.totalPausedMs=0,s.pauseEvents=[],s.currentLocation=null,s.locationMismatched=!1,o="Recovered previous checkout record and cleared stale session status.";else{const g=new Date(c.getTime()+144e5),S={status:"Half Day",dayCredit:this.getDayCredit("Half Day"),lateCountable:!1},A=s.currentLocation||s.lastLocation||null,b=new Date().toISOString(),x={id:String(Date.now()),user_id:s.id,date:g.toISOString().split("T")[0],checkIn:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:g.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),duration:this.msToTime(144e5),durationMs:144e5,type:S.status,dayCredit:S.dayCredit,lateCountable:S.lateCountable,extraWorkedMs:0,policyVersion:"v2",location:A?.address||"Missed checkout session",lat:A?.lat??null,lng:A?.lng??null,checkOutLocation:"System closure on next check-in",outLat:null,outLng:null,workDescription:"System closure: missed checkout auto-closed as half day. Reason required on next login.",locationMismatched:!1,locationExplanation:"",activityScore:0,autoCheckout:!0,autoCheckoutReason:"missed_checkout_next_login",autoCheckoutAt:b,autoCheckoutRequiresApproval:!1,autoCheckoutExtraApproved:null,missedCheckoutResolved:!0,missedCheckoutPolicy:"half_day_on_missed_checkout",missedCheckoutReasonRequired:!0,missedCheckoutReasonStatus:"pending",missedCheckoutReason:"",missedCheckoutReasonSubmittedAt:null,missedCheckoutReviewedBy:"",missedCheckoutReviewedAt:"",missedCheckoutReviewNote:"",systemClosedAt:b,synced:!1};await X.add("attendance",x),r=x.id,l=x.date,s.status="out",s.lastCheckOut=g.getTime(),s.lastLocation=A,s.lastCheckOutLocation={lat:null,lng:null,address:"System closure on next check-in"},s.locationMismatched=!1,s.lastCheckIn=null,s.isPaused=!1,s.pauseStartedAt=null,s.totalPausedMs=0,s.pauseEvents=[],s.currentLocation=null,i=!0,o="Previous open session was closed as half day because checkout was missed. Please submit a reason for admin verification."}else return{ok:!1,conflict:!0,message:"Status updated from another device."}}s.status="in",s.lastCheckIn=Date.now(),s.isPaused=!1,s.pauseStartedAt=null,s.totalPausedMs=0,s.pauseEvents=[];const d=n&&n!=="Unknown Location"?n:e&&t?`Lat: ${Number(e).toFixed(4)}, Lng: ${Number(t).toFixed(4)}`:"Unknown Location";return s.currentLocation={lat:e,lng:t,address:d},await X.put("users",s),{ok:!0,resolvedMissedCheckout:i,noticeMessage:o,missedCheckoutReasonRequired:i,missedCheckoutLogId:r,missedCheckoutDate:l}}async pauseSession(){const e=await(te.refreshCurrentUserFromDB?te.refreshCurrentUserFromDB():te.getUser());if(!e||e.status!=="in")return{ok:!1,conflict:!0,message:"Status updated from another device."};if(e.isPaused===!0)return{ok:!1,conflict:!0,message:"Session is already paused."};const t=Date.now(),n=Array.isArray(e.pauseEvents)?e.pauseEvents.slice(-99):[];return n.push({type:"pause",at:new Date(t).toISOString(),atMs:t}),e.isPaused=!0,e.pauseStartedAt=t,e.totalPausedMs=Number(e.totalPausedMs)||0,e.pauseEvents=n,await X.put("users",e),{ok:!0}}async resumeSession(){const e=await(te.refreshCurrentUserFromDB?te.refreshCurrentUserFromDB():te.getUser());if(!e||e.status!=="in")return{ok:!1,conflict:!0,message:"Status updated from another device."};if(e.isPaused!==!0)return{ok:!1,conflict:!0,message:"Session is not paused."};const t=Date.now(),n=Number(e.pauseStartedAt)||t,s=Math.max(0,t-n),i=Array.isArray(e.pauseEvents)?e.pauseEvents.slice(-99):[];return i.push({type:"resume",at:new Date(t).toISOString(),atMs:t}),e.totalPausedMs=(Number(e.totalPausedMs)||0)+s,e.isPaused=!1,e.pauseStartedAt=null,e.pauseEvents=i,await X.put("users",e),{ok:!0,resumedPausedMs:s,totalPausedMs:e.totalPausedMs}}async checkOut(e="",t=null,n=null,s="Detected Location",i=!1,o="",r={}){const l=await(te.refreshCurrentUserFromDB?te.refreshCurrentUserFromDB():te.getUser());if(!l||l.status!=="in")return{ok:!1,conflict:!0,message:"Status updated from another device."};if(!r.autoCheckout&&!nn(t,n))throw new Error("Location is required for check-out. Please enable location and try again.");const d=new Date(l.lastCheckIn),c=r.checkOutTime?new Date(r.checkOutTime):new Date,p=d.getTime(),u=c.getTime(),m=Number(l.totalPausedMs)||0,h=Number(l.pauseStartedAt)||0;let f=0;l.isPaused===!0&&h>0&&u>h&&(f=u-h);const g=Math.max(0,m+f),S=Math.max(0,u-p-g),A=this.evaluateAttendanceStatus(d,S),b=window.AppActivity?window.AppActivity.getStats():{score:0},x=Array.isArray(l.pauseEvents)?l.pauseEvents.slice():[];f>0&&x.push({type:"resume",at:c.toISOString(),atMs:u,autoClosedOnCheckout:!0});const D=x.filter(_=>_&&_.type==="pause").length,T={id:String(Date.now()),user_id:l.id,date:c.toISOString().split("T")[0],checkIn:d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),duration:this.msToTime(S),durationMs:S,pausedMs:g,pauseCount:D,pauseEvents:x,type:A.status,dayCredit:A.dayCredit,lateCountable:A.lateCountable,extraWorkedMs:A.extraWorkedMs||0,policyVersion:"v2",location:l.currentLocation?.address||"Checked In Location",lat:l.currentLocation?.lat,lng:l.currentLocation?.lng,checkOutLocation:s||(t&&n?`Lat: ${Number(t).toFixed(4)}, Lng: ${Number(n).toFixed(4)}`:"Detected Location"),outLat:t,outLng:n,workDescription:e||"",locationMismatched:i,locationExplanation:o||"",activityScore:b.score,autoCheckout:!!r.autoCheckout,autoCheckoutReason:r.autoCheckoutReason||"",autoCheckoutAt:r.autoCheckoutAt||null,autoCheckoutRequiresApproval:!!r.autoCheckoutRequiresApproval,autoCheckoutExtraApproved:r.autoCheckoutExtraApproved??null,overtimePrompted:!!r.overtimePrompted,overtimeReasonTag:r.overtimeReasonTag||"",overtimeExplanation:r.overtimeExplanation||"",overtimeCappedToEightHours:!!r.overtimeCappedToEightHours,taskUpdates:Array.isArray(r.taskUpdates)?r.taskUpdates:[],entrySource:"checkin_checkout",attendanceEligible:!0,synced:!1};return await X.add("attendance",T),l.status="out",l.lastCheckOut=Date.now(),l.lastLocation=l.currentLocation,l.lastCheckOutLocation={lat:t,lng:n,address:s},l.locationMismatched=i,l.lastCheckIn=null,l.isPaused=!1,l.pauseStartedAt=null,l.totalPausedMs=0,l.pauseEvents=[],l.currentLocation=null,await X.put("users",l),window.AppActivity&&window.AppActivity.stop(),{ok:!0,conflict:!1}}async addAdminLog(e,t){const n={id:String(Date.now()),user_id:e,...t,isManualOverride:t.isManualOverride===!0,entrySource:t.entrySource||"admin_override",attendanceEligible:Object.prototype.hasOwnProperty.call(t,"attendanceEligible")?t.attendanceEligible===!0:!0,synced:!1};return await X.add("attendance",n),n}async deleteLog(e){if(e)return await X.delete("attendance",e),!0}async updateLog(e,t){if(!e)return;const n=await X.get("attendance",e);if(!n)throw new Error("Log not found");const s={...n,...t,isManualOverride:Object.prototype.hasOwnProperty.call(t,"isManualOverride")?t.isManualOverride===!0:!!n.isManualOverride,entrySource:t.entrySource||n.entrySource||"admin_override",attendanceEligible:Object.prototype.hasOwnProperty.call(t,"attendanceEligible")?t.attendanceEligible===!0:Object.prototype.hasOwnProperty.call(n,"attendanceEligible")?n.attendanceEligible===!0:!0,id:e};return await X.put("attendance",s),s}async addManualLog(e){const t=te.getUser();if(!t)return;const n=this.buildDateTime(e.date,e.checkIn),s=this.buildDateTime(e.date,e.checkOut),i=n&&s?s-n:0,o=this.evaluateAttendanceStatus(n||new Date,i),r=String(e.type||"").trim(),l=!r||r==="Manual"?o.status:r,d=Object.prototype.hasOwnProperty.call(e,"attendanceEligible")?e.attendanceEligible===!0:l!=="Work Log",c=d?l:r||"Work Log",p={id:String(Date.now()),user_id:t.id,...e,type:c,durationMs:typeof e.durationMs=="number"?e.durationMs:i,dayCredit:d?typeof e.dayCredit=="number"?e.dayCredit:o.dayCredit:0,lateCountable:d&&(e.lateCountable===!0||c==="Late"),extraWorkedMs:d?typeof e.extraWorkedMs=="number"?e.extraWorkedMs:o.extraWorkedMs||0:0,entrySource:e.entrySource||"staff_manual_work",attendanceEligible:d,synced:!1};return await X.add("attendance",p),p}async getLogs(e=null){const t=e||te.getUser()?.id;if(!t)return[];try{const n=window.AppFirestore;if(!n)return[];let s=n.collection("attendance");s=s.where("user_id","==",t);const r=(await s.get()).docs.map(c=>({...c.data(),id:c.id})).sort((c,p)=>p.id-c.id).map(c=>((!c.location||c.location==="Unknown Location")&&c.lat&&c.lng&&(c.location=`Lat: ${Number(c.lat).toFixed(4)}, Lng: ${Number(c.lng).toFixed(4)}`),c)),l=new Set,d=r.filter(c=>{const p=`${c.date}|${c.checkIn}`;return l.has(p)?!1:(l.add(p),!0)});try{const c=await X.get("users",t);if(c&&c.status==="in"&&c.lastCheckIn){const p=new Date(c.lastCheckIn),u={id:"active_now",date:p.toLocaleDateString(),checkIn:p.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:"Active Now",duration:"Working...",type:"Office",location:c.currentLocation?.address&&c.currentLocation.address!=="Unknown Location"?c.currentLocation.address:c.currentLocation?.lat&&c.currentLocation?.lng?`Lat: ${Number(c.currentLocation.lat).toFixed(4)}, Lng: ${Number(c.currentLocation.lng).toFixed(4)}`:"Current Session"};d.unshift(u)}}catch(c){console.warn("Could not fetch active status for logs",c)}return d.slice(0,50)}catch(n){return console.warn("Optimized log fetch failed, falling back to simple filter",n),[]}}async getAllLogs(){return await X.getAll("attendance")}msToTime(e){let t=Math.floor(e/6e4%60);return`${Math.floor(e/(1e3*60*60)%24)}h ${t}m`}async hasRecordedCheckoutForSession(e,t,n=new Date){if(!e||!(t instanceof Date)||Number.isNaN(t.getTime()))return!1;try{const s=await X.query("attendance","user_id","==",e);if(!Array.isArray(s)||s.length===0)return!1;const i=300*1e3,o=new Date(t);o.setSeconds(0,0);const r=n instanceof Date&&!Number.isNaN(n.getTime())?n.getTime()+i:Date.now()+i;return s.some(l=>{if(!l||!l.checkOut||l.checkOut==="Active Now"||l.autoCheckout&&l.autoCheckoutReason==="missed_checkout_next_login")return!1;const d=this.buildDateTime(l.date,l.checkIn),c=this.buildDateTime(l.date,l.checkOut);if(!d||!c||c.getTime()<d.getTime())return!1;const p=new Date(d);if(p.setSeconds(0,0),!(Math.abs(p.getTime()-o.getTime())<=i))return!1;const m=c.getTime();return m>=t.getTime()&&m<=r})}catch(s){return console.warn("Failed to verify prior checkout record before auto-closing session:",s),!1}}buildDateTime(e,t){if(!e||!t)return null;const n=String(e).trim(),s=String(t).trim(),i=new Date(`${n}T00:00:00`);if(Number.isNaN(i.getTime()))return null;const o=s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);if(o){const d=Number(o[1]),c=Number(o[2]),p=Number(o[3]||0);return d<0||d>23||c<0||c>59||p<0||p>59?null:(i.setHours(d,c,p,0),i)}const r=s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)$/i);if(r){let d=Number(r[1]);const c=Number(r[2]),p=Number(r[3]||0),u=String(r[4]||"").toUpperCase();return d<1||d>12||c<0||c>59||p<0||p>59?null:(d===12&&(d=0),u==="PM"&&(d+=12),i.setHours(d,c,p,0),i)}const l=new Date(`${n}T${s}`);return Number.isNaN(l.getTime())?null:l}normalizeType(e){const t=String(e||"").trim();if(!t||t==="Manual")return"Present";if(t==="Manual/WFH")return"Work - Home";const n=t.toLowerCase().replace(/\s+/g,"");return n==="wfh"||n==="workfromhome"||n==="work-home"?"Work - Home":t}getDayCredit(e){const t=this.normalizeType(e);return t==="Half Day"?.5:t==="Absent"?0:t==="Present"||t==="Present (Late Waived)"||t==="Late"||t==="Work - Home"||t==="On Duty"?1:0}evaluateAttendanceStatus(e,t=0){if(!e||Number.isNaN(e.getTime()))return{status:"Absent",dayCredit:0,lateCountable:!1,extraWorkedMs:0};if(e.getDay()===0)return{status:"Present",dayCredit:1,lateCountable:!1,extraWorkedMs:0};const s=e.getHours()*60+e.getMinutes(),i=Math.max(0,t)/(1e3*60*60),o=(typeof N<"u"&&N?N.LATE_CUTOFF_MINUTES:555)||555,r=(typeof N<"u"&&N?N.MINOR_LATE_END_MINUTES:615)||615,l=(typeof N<"u"&&N?N.LATE_END_MINUTES:720)||720,d=(typeof N<"u"&&N?N.POST_NOON_END_MINUTES:810)||810,c=(typeof N<"u"&&N?N.AFTERNOON_START_MINUTES:720)||720;let p="Present",u=!1,m=0;return s>=c?(i>=8?p="Present":i>=4?p="Half Day":p="Absent",i>4&&(m=Math.max(0,t-14400*1e3)),{status:p,dayCredit:this.getDayCredit(p),lateCountable:!1,extraWorkedMs:m}):(s>d?p="Absent":s>l||s>r?p=i>=4?"Half Day":"Absent":s>o?i>=8?p="Present (Late Waived)":(p="Late",u=!0):i>=8?p="Present":i>=4?p="Half Day":p="Absent",{status:p,dayCredit:this.getDayCredit(p),lateCountable:u,extraWorkedMs:m})}calculateStatus(e){return this.evaluateAttendanceStatus(e,480*60*1e3).status}}const In=new Fs;typeof window<"u"&&(window.AppAttendance=In);function v(a){return a==null?"":String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Oe(a){return v(a)}function Hs(a){return String(a??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,"\\n").replace(/\r/g,"\\r")}function Ge(a,e="https://via.placeholder.com/24"){return!a||typeof a!="string"?e:a.startsWith("http")||a.startsWith("data:")||a.startsWith("/")||a.startsWith("./")?a:e}function ua(a){if(!a)return"Never";const e=new Date(a);if(isNaN(e.getTime()))return"Unknown";const t=Math.floor((new Date-e)/1e3);if(t<60)return"just now";let n=t/31536e3;return n>1?Math.floor(n)+" years ago":(n=t/2592e3,n>1?Math.floor(n)+" months ago":(n=t/86400,n>1?Math.floor(n)+" days ago":(n=t/3600,n>1?Math.floor(n)+" hours ago":(n=t/60,n>1?Math.floor(n)+" mins ago":Math.floor(t)+" seconds ago"))))}typeof window<"u"&&(window.safeHtml=v,window.safeAttr=Oe,window.safeJsStr=Hs,window.safeUrl=Ge,window.timeAgo=ua);function Us(a,e=!0){const t=Math.max(0,Math.min(5,Number(a)||0)),n=Math.floor(t),s=t-n>=.5,i=5-n-(s?1:0);let o='<div class="star-rating-display">';for(let r=0;r<n;r++)o+='<i class="fa-solid fa-star star-filled"></i>';s&&(o+='<i class="fa-solid fa-star-half-stroke star-filled"></i>');for(let r=0;r<i;r++)o+='<i class="fa-regular fa-star star-empty"></i>';return e&&(o+=`<span class="star-rating-number">${t.toFixed(1)}</span>`),o+="</div>",o}function Mn(a,e=!0){const t=String(a||"to-be-started").toLowerCase();let n="To Be Started",s="fa-circle-dot",i="status-badge-to-be-started";return t==="in-process"||t==="in-progress"?(n="In Progress",s="fa-spinner fa-spin",i="status-badge-in-process"):t==="completed"?(n="Completed",s="fa-circle-check",i="status-badge-completed"):t==="overdue"?(n="Overdue",s="fa-circle-exclamation",i="status-badge-overdue"):(t==="not-completed"||t==="cancelled")&&(n="Not Completed",s="fa-circle-xmark",i="status-badge-not-completed"),`
        <div class="status-badge ${i}">
            ${e?`<i class="fa-solid ${s}"></i>`:""}
            <span>${n}</span>
        </div>
    `}const Ta=a=>{const e=new Date,t=window.AppAuth?.getUser(),n=!!(t&&(window.app_isAdminUser?.(t)||t.role==="Administrator"||window.app_canManageAttendanceSheet?.(t)));window.app_calMonth===void 0&&(window.app_calMonth=e.getMonth()),window.app_calYear===void 0&&(window.app_calYear=e.getFullYear());const s=window.app_calYear,i=window.app_calMonth,o=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],r=new Date(s,i,1).getDay(),l=new Date(s,i+1,0).getDate();let d="";for(let c=0;c<r;c++)d+='<div class="cal-day empty"></div>';for(let c=1;c<=l;c++){const p=`${s}-${String(i+1).padStart(2,"0")}-${String(c).padStart(2,"0")}`,u=typeof window.app_getDayEvents=="function"?window.app_getDayEvents(p,a):[],m=u.some(A=>A.type==="leave"),h=u.some(A=>A.type==="event"),f=u.some(A=>A.type==="work"),g=c===e.getDate()&&i===e.getMonth()&&s===e.getFullYear(),S=window.AppAnalytics?window.AppAnalytics.getDayType(new Date(s,i,c)):"Work Day";d+=`
            <div class="cal-day ${g?"today":""} ${m?"has-leave":""} ${h?"has-event":""} ${f?"has-work":""} ${S==="Holiday"?"is-holiday":""} ${S==="Half Day"?"is-half-day":""}" 
                    onclick="window.app_openDayPlan('${p}')" style="cursor:pointer;" title="${S}">
                ${c}
            </div>
        `}return window._currentPlans=a,`
        <div class="card dashboard-team-schedule-card" style="padding: 0.75rem; display:flex; flex-direction:column;">
            <div style="margin-bottom:0.75rem; border-bottom:1px solid #f3f4f6; padding-bottom:0.4rem;">
                    <h4 style="margin:0; color:#1f2937; font-size: 1rem;">Team Schedule</h4>
                    <span style="font-size:0.7rem; color:#6b7280;">Planned Leaves & Events</span>
            </div>

            <div style="margin-bottom:0.6rem; padding-bottom:0.4rem; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:0.4rem;">
                    <button onclick="window.app_changeCalMonth(-1)" style="background:none; border:none; color:#6b7280; cursor:pointer; padding:2px;"><i class="fa-solid fa-chevron-left"></i></button>
                    <div style="text-align:center; min-width:70px;">
                        <h4 style="margin:0; color:#1f2937; font-size:0.9rem;">${o[i]} ${s}</h4>
                    </div>
                    <button onclick="window.app_changeCalMonth(1)" style="background:none; border:none; color:#6b7280; cursor:pointer; padding:2px;"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                    ${n?'<button onclick="window.app_openEventModal()" style="background:none; border:none; color:var(--primary); cursor:pointer;" title="Add Holiday / Event"><i class="fa-solid fa-plus-circle"></i></button>':""}
            </div>
            <div class="calendar-grid-mini" style="display:grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align:center; font-size: 0.65rem;">
                <div style="font-weight:700; color:#9ca3af;">S</div>
                <div style="font-weight:700; color:#9ca3af;">M</div>
                <div style="font-weight:700; color:#9ca3af;">T</div>
                <div style="font-weight:700; color:#9ca3af;">W</div>
                <div style="font-weight:700; color:#9ca3af;">T</div>
                <div style="font-weight:700; color:#9ca3af;">F</div>
                <div style="font-weight:700; color:#9ca3af;">S</div>
                ${d}
            </div>
            <div style="margin-top:0.6rem; display:flex; flex-wrap:wrap; gap:0.4rem; font-size:0.55rem; color:#6b7280; justify-content:center;">
                <span style="display:flex; align-items:center; gap:2px;"><span style="width:5px; height:5px; background:#b91c1c; border-radius:50%;"></span> Leave</span>
                <span style="display:flex; align-items:center; gap:2px;"><span style="width:5px; height:5px; background:#166534; border-radius:50%;"></span> Event</span>
                <span style="display:flex; align-items:center; gap:2px;"><span style="width:5px; height:5px; background:#eee; border-radius:50%; border:0.5px solid #ccc;"></span> Holiday</span>
                <span style="display:flex; align-items:center; gap:2px;"><span style="width:5px; height:5px; background:#fffbeb; border-radius:50%; border:0.5px solid #d97706;"></span> Half</span>
            </div>
            <style>
                .cal-day { padding: 4px; border-radius: 4px; position: relative; transition: all 0.2s; border: 1px solid transparent; }
                .cal-day:hover:not(.empty) { background: #f3f4f6; }
                .cal-day.today { background: var(--primary) !important; color: white !important; font-weight: 700; border-color: transparent !important; }
                .cal-day.has-leave { background: #fee2e2; color: #b91c1c; }
                .cal-day.has-event { background: #dcfce7; color: #166534; }
                .cal-day.has-work { border-color: #818cf8; }
                .cal-day.is-holiday { background: #f9fafb; color: #9ca3af; opacity: 0.8; }
                .cal-day.is-half-day { background: #fffbeb; color: #d97706; border-color: #fde68a; }
                .cal-day.empty { visibility: hidden; }
            </style>
        </div>
    `},we=a=>String(a??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'"),ma="dashboard-card-max-overlay",fa="dashboard-card-max-title",qt="dashboard-card-max-body",ye="tile",Cn="original",ue="fullscreen",Ln=new Set([ye,Cn,ue]),qs=["dashboard-hero-card"],zs=new Set(["checkin","worklog","team-activity","team-schedule","staff-directory","leave-requests","leave-history","missed-checkout","stats-monthly","stats-yearly"]),js=()=>{let a=document.getElementById(ma);return a||(a=document.createElement("div"),a.id=ma,a.className="dashboard-max-overlay",a.innerHTML=`
            <div class="dashboard-max-window" role="dialog" aria-modal="true" aria-labelledby="${fa}">
                <div class="dashboard-max-header">
                    <h2 id="${fa}"></h2>
                    <button type="button" class="dashboard-max-close" onclick="window.app_closeDashboardCardMaximize?.()" aria-label="Close maximized card">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="${qt}" class="dashboard-max-body"></div>
            </div>
        `,a.addEventListener("click",e=>{e.target===a&&window.app_closeDashboardCardMaximize?.()}),document.body.appendChild(a)),a},En=a=>{document?.body&&document.body.classList.toggle("dashboard-max-open",!!a)},rt=()=>{const a=window._dashboardMaxCardId?String(window._dashboardMaxCardId):"",e=document.getElementById(ma);e&&(e.classList.remove("open"),e.remove());const t=document.getElementById(qt);t&&(t.innerHTML=""),En(!1),document?.body&&(document.body.style.overflow="");const n=window._dashboardMaxTriggerEl;if(window._dashboardMaxTriggerEl=null,window._dashboardMaxCardId=null,a){const s=Ia(a);s&&(Pn(s,ye),s.dataset.dashboardCardMode=ye),window._dashboardCardModeState&&(window._dashboardCardModeState[a]=ye)}if(n&&typeof n.focus=="function")try{n.focus()}catch{}},Ys=(a,e=null)=>{rt();const t=(window._dashboardCardTemplates||{})[a];if(!t)return;const n=js(),s=document.getElementById(fa),i=document.getElementById(qt);if(!s||!i)return;s.textContent=t.title||"Dashboard Card",i.innerHTML=`<div class="dashboard-max-card-content">${t.expandedHtml||t.originalHtml||t.tileHtml||""}</div>`,window._dashboardMaxTriggerEl=e,window._dashboardMaxCardId=a,En(!0),n.classList.add("open");const o=n.querySelector(".dashboard-max-close");if(o)try{o.focus()}catch{}},Ia=a=>a?document.querySelector(`.dashboard-staff-view .card[data-dashboard-card-id="${a}"]`):null,Pn=(a,e)=>{a&&(a.classList.remove("dashboard-card-mode-tile","dashboard-card-mode-original"),e===Cn?(a.classList.add("dashboard-card-mode-original"),a.dataset.dashboardOriginalFullWidth==="1"&&a.classList.add("full-width")):(a.classList.add("dashboard-card-mode-tile"),a.classList.remove("full-width")))},ta=(a,e,t=null)=>{if(!Ln.has(e))return;const n=document.querySelectorAll(".dashboard-staff-view .card[data-dashboard-card-id]");n.length&&(n.forEach(s=>{const o=s.dataset.dashboardCardId===String(a)?e:ye;Pn(s,o),s.dataset.dashboardCardMode=o}),window._dashboardCardModeState=window._dashboardCardModeState||{},window._dashboardCardModeState[a]=e,window._dashboardActiveCardModeId=a,e===ue?Ys(a,t||Ia(a)):rt())},Ws=a=>{if(a.classList.contains("dashboard-hero-stats-card"))return"Hero of the Week";const e=a.querySelector(".dashboard-card-title, .dashboard-stats-card-title, .dashboard-worklog-head h4, .dashboard-team-activity-head h4, .dashboard-staff-directory-head h4, .dashboard-tagged-head h4, .dashboard-leave-requests-head h4, .dashboard-leave-history-head h4, h3, h4");return String(e?.textContent||"").trim()||"Dashboard Card"},Ks=(a,e)=>a.classList.contains("dashboard-hero-stats-card")?"hero-week":a.classList.contains("dashboard-checkin-card")?"checkin":a.classList.contains("dashboard-worklog-card")?"worklog":a.classList.contains("dashboard-team-activity-card")?"team-activity":a.classList.contains("dashboard-team-schedule-card")?"team-schedule":a.classList.contains("dashboard-staff-directory-card")?"staff-directory":a.classList.contains("dashboard-leave-requests-card")?"leave-requests":a.classList.contains("dashboard-leave-history-card")?"leave-history":a.classList.contains("dashboard-tagged-card")?"missed-checkout":a.classList.contains("dashboard-stats-card")?`stats-${a.getAttribute("data-stats-type")||e}`:`dashboard-card-${e}`,Vs=a=>{let e=a.innerHTML||"";if(e=e.replace(/<div[^>]*class="[^"]*dashboard-card-mode-controls[^"]*"[^>]*>[\s\S]*?<\/div>/gi,"").replace(/<button[^>]*class="[^"]*dashboard-card-max-btn[^"]*"[^>]*>[\s\S]*?<\/button>/gi,"").replace(/<button[^>]*class="[^"]*dashboard-expand-inline-btn[^"]*"[^>]*>[\s\S]*?<\/button>/gi,""),a.classList.contains("dashboard-worklog-card")&&(e=e.replace(/id="act-start"/g,'id="act-start-max"').replace(/id="act-end"/g,'id="act-end-max"').replace(/id="activity-list"/g,'id="activity-list-max"').replace(/window\.app_filterActivity\(\)/g,"window.app_filterActivity?.('act-start-max','act-end-max','activity-list-max')")),a.classList.contains("dashboard-team-activity-card")&&(e=e.replace(/id="staff-activity-list"/g,'id="staff-activity-list-max"').replace(/id="staff-activity-range-label"/g,'id="staff-activity-range-label-max"').replace(/window\.app_setStaffActivityMonth\(this\.value\)/g,"window.app_setStaffActivityMonth(this.value, 'staff-activity-list-max', 'staff-activity-range-label-max')").replace(/window\.app_setStaffActivitySort\(this\.value\)/g,"window.app_setStaffActivitySort(this.value, 'staff-activity-list-max', 'staff-activity-range-label-max')")),a.classList.contains("dashboard-stats-card")){const t=String(a.getAttribute("data-stats-type")||"").trim();t&&(e+=ei(t))}return a.classList.contains("dashboard-hero-stats-card")&&(e+=Bn(window.app_dashboardHeroLeaderboard,window.app_dashboardHeroData)),e},Gs=a=>{let e=a.innerHTML||"";return e=e.replace(/<div[^>]*class="[^"]*dashboard-card-mode-controls[^"]*"[^>]*>[\s\S]*?<\/div>/gi,"").replace(/<button[^>]*class="[^"]*dashboard-card-max-btn[^"]*"[^>]*>[\s\S]*?<\/button>/gi,""),e},Js=()=>`${De(window.app_dashboardHeroData,window.app_dashboardHeroMeta||{})}${Bn(window.app_dashboardHeroLeaderboard,window.app_dashboardHeroData)}`,sn=()=>{if(window._dashboardMaxCardId!=="hero-week")return;const a=document.getElementById(qt);a&&(a.innerHTML=`<div class="dashboard-max-card-content">${Js()}</div>`)},on=(a,e,t)=>{const n=document.createElement("button");return n.type="button",n.className=`dashboard-card-mode-btn dashboard-card-mode-btn-${t}`,n.setAttribute("data-mode",t),n.setAttribute("aria-label",`Show fullscreen ${e}`),n.innerHTML='<i class="fa-solid fa-expand"></i>',n.addEventListener("click",()=>window.app_toggleDashboardCardMode?.(a,t,n)),n},Xs=(a,e,t)=>{let n=a.querySelector(".dashboard-card-mode-controls");n?(n.innerHTML="",n.appendChild(on(e,t,ue))):(n=document.createElement("div"),n.className="dashboard-card-mode-controls",n.setAttribute("role","group"),n.setAttribute("aria-label",`${t} view controls`),n.appendChild(on(e,t,ue)),a.appendChild(n))},rn=()=>{const a=document.querySelector(".dashboard-staff-view");if(!a)return;const e=a.querySelectorAll(".card"),t={};Array.from(e).forEach((n,s)=>{if(qs.some(r=>n.classList.contains(r))){n.classList.remove("dashboard-card-compact","dashboard-card-mode-tile","dashboard-card-mode-original","dashboard-card-has-controls"),n.dataset.dashboardCardId="",n.dataset.dashboardCardMode="";const r=n.querySelector(".dashboard-card-mode-controls");r&&r.remove();return}const i=Ks(n,s),o=Ws(n);n.classList.add("dashboard-card-compact","dashboard-card-mode-tile"),n.classList.remove("dashboard-card-mode-original"),n.dataset.dashboardOriginalFullWidth=n.classList.contains("full-width")?"1":"0",n.classList.remove("full-width"),n.dataset.dashboardCardId=i,n.dataset.dashboardCardMode=ye,Xs(n,i,o),t[i]={title:o,tileHtml:n.innerHTML,originalHtml:Gs(n),expandedHtml:Vs(n)}}),window._dashboardCardTemplates=t,window._dashboardCardModeState={}},We={controllers:new WeakMap,elements:new Set},Ke={controllers:new WeakMap,elements:new Set};function Ve(){return window.app_staffActivityState||(window.app_staffActivityState={selectedMonth:new Date().toISOString().slice(0,7),sortKey:"date-desc",logs:[],leaveHistoryDate:new Date().toISOString().slice(0,10)}),window.app_staffActivityState.leaveHistoryDate||(window.app_staffActivityState.leaveHistoryDate=new Date().toISOString().slice(0,10)),window.app_staffActivityState}function Et(a){const e=a?new Date(`${a}T00:00:00`):new Date;if(Number.isNaN(e.getTime()))return Et(new Date().toISOString().slice(0,10));const t=e.getDay(),n=t===0?-6:1-t,s=new Date(e);s.setDate(e.getDate()+n),s.setHours(0,0,0,0);const i=new Date(s);i.setDate(s.getDate()+6),i.setHours(23,59,59,999);const o=r=>{const l=r.getFullYear(),d=String(r.getMonth()+1).padStart(2,"0"),c=String(r.getDate()).padStart(2,"0");return`${l}-${d}-${c}`};return{start:s,end:i,startKey:o(s),endKey:o(i),label:`${s.toLocaleDateString("en-US",{month:"short",day:"numeric"})} - ${i.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`}}let dn=!1;function Qs(){dn||typeof document>"u"||(dn=!0,document.addEventListener("click",async a=>{const e=a.target&&a.target.closest?a.target.closest(".dashboard-leave-btn[data-action][data-leave-id]"):null;if(!e)return;a.preventDefault();const t=String(e.dataset.action||""),n=String(e.dataset.leaveId||"");if(n)try{if(t==="export"){typeof window.app_exportLeaveRequestPdf=="function"&&await window.app_exportLeaveRequestPdf(n);return}if(t==="comment"){typeof window.app_addLeaveComment=="function"&&await window.app_addLeaveComment(n);return}(t==="approve"||t==="reject")&&(t==="approve"&&typeof window.app_approveLeave=="function"?await window.app_approveLeave(n):t==="reject"&&typeof window.app_rejectLeave=="function"&&await window.app_rejectLeave(n))}catch(s){console.error("Dashboard leave action failed:",s)}}))}function De(a,e={}){const t=a?.state||(a?.user?"winner":"no_eligible_data");if(!a||t!=="winner"){const g=a?.reason||(t==="fetch_error"?"Hero stats are temporarily unavailable.":"No eligible hero data available."),S=t==="fetch_error"?"Fetch Error":"No Eligible Data";return`
            <div class="card dashboard-hero-stats-card hero-slot">
                <div class="dashboard-hero-stats-head">
                    <div class="hero-label-badge">Hero of the Week</div>
                    ${e.generatedAt?`<span class="hero-sync-time" title="Source: ${e.source||a?.source||"unknown"}">Synced ${ua(e.generatedAt)}</span>`:""}
                </div>
                <div class="dashboard-activity-empty">
                    ${v(g)}
                </div>
                <div class="dashboard-hero-stats-foot">
                    <span class="dashboard-kpi-tag">${S}</span>
                </div>
            </div>`}const{user:n,stats:s}=a,i=Number(s?.taskPlanned??0),o=Number(s?.taskCompleted??0),r=Number(s?.taskInProgress??0),l=Number(s?.taskMissed??0),d=Number(s?.taskPostponed??0),c=Number(s?.days??0),p=Number(s?.hours??0),u=Number(s?.attendanceFactor??1),m=e.source==="generated",h=Number.isFinite(Number(a?.confidence))?Math.round(Number(a.confidence)*100):0,f=a?.period==="yesterday_back_7_days"?"Last 7 Completed Days":"Weekly";return`
        <div class="card dashboard-hero-stats-card hero-slot ${m?"is-new-summary":""}">
            <div class="dashboard-hero-stats-head">
                <div class="hero-label-badge">Hero of the Week</div>
                ${e.generatedAt?`<span class="hero-sync-time" title="Source: ${e.source||a?.source||"unknown"}">Synced ${ua(e.generatedAt)}</span>`:""}
            </div>
            <div class="dashboard-hero-stats-body">
                <div class="hero-profile">
                    <img src="${Ge(n.avatar)}" alt="${v(n.name)}" class="hero-avatar">
                    <div class="hero-info">
                        <div class="hero-name">${v(n.name)}</div>
                        <div class="hero-role">${v(n.role||"Staff")}</div>
                    </div>
                </div>
                <div class="hero-metrics">
                    <div class="hero-metric">
                        <div class="hero-metric-value">${i}</div>
                        <div class="hero-metric-label">Planned</div>
                    </div>
                    <div class="hero-metric">
                        <div class="hero-metric-value">${o}</div>
                        <div class="hero-metric-label">Completed</div>
                    </div>
                    <div class="hero-metric">
                        <div class="hero-metric-value">${r}</div>
                        <div class="hero-metric-label">In Progress</div>
                    </div>
                    <div class="hero-metric">
                        <div class="hero-metric-value">${d}</div>
                        <div class="hero-metric-label">Postponed</div>
                    </div>
                    <div class="hero-metric">
                        <div class="hero-metric-value">${l}</div>
                        <div class="hero-metric-label">Missed</div>
                    </div>
                </div>
                <div class="hero-attendance-modifier-row">
                    <span class="hero-attendance-pill">Days <strong>${c}</strong></span>
                    <span class="hero-attendance-pill">Hours <strong>${p}h</strong></span>
                    <span class="hero-attendance-pill">Factor <strong>x${u.toFixed(2)}</strong></span>
                </div>
            </div>
            <div class="dashboard-hero-stats-foot">
                <span class="dashboard-kpi-tag">${v(f)}</span>
                <span class="dashboard-kpi-tag">Confidence ${h}%</span>
            </div>
        </div>`}function Nn(a,e=[],t=null,n=[]){const s=Et(new Date().toISOString().slice(0,10)),i=s.startKey,o=s.endKey,r=t?t.id:window.AppAuth.getUser().id,l=t&&t.name||window.AppAuth.getUser().name;return`
        <div class="card dashboard-worklog-card">
            <div class="dashboard-worklog-head">
                 <h4>Work Log <span class="dashboard-worklog-staff">(${v(l)})</span></h4>
                 <span>Ongoing & Historical Tasks</span>
            </div>
             <div class="dashboard-worklog-filter-row">
                <input type="date" id="act-start" value="${i}" class="dashboard-worklog-date-input">
                <span class="dashboard-worklog-to">to</span>
                <input type="date" id="act-end" value="${o}" class="dashboard-worklog-date-input">
                <button onclick="window.app_filterActivity()" class="dashboard-worklog-go-btn">Go</button>
            </div>
            <div id="activity-list" class="dashboard-worklog-list">
                ${zt(a,i,o,r,e,n)}
            </div>
        </div>
    `}function zt(a,e,t,n,s=[],i=[]){const o=new Date(e),r=new Date(t);r.setHours(23,59,59,999);const l=a.filter(A=>{const b=new Date(A.date),x=A.workDescription||(A.location&&!A.location.startsWith("Lat:")?A.location:"Standard Activity");return A._displayDesc=x,A._isCollab=!1,A._sortTime=A.checkOut||"00:00",b>=o&&b<=r}),d=[];s.forEach(A=>{const b=new Date(A.date);if(b<o||b>r)return;A.plans.filter(D=>D.tags&&D.tags.some(T=>T.id===n&&T.status==="accepted")).forEach(D=>{d.push({date:A.date,workDescription:`[Collab] Collaborated with ${A.userName}: ${D.task}${D.subPlans&&D.subPlans.length>0?` (Sub-tasks: ${D.subPlans.join(", ")})`:""}`,checkOut:"Planned / Accepted",_displayDesc:`[Collab] Collaborated with ${A.userName}: ${D.task}${D.subPlans&&D.subPlans.length>0?` (Sub-tasks: ${D.subPlans.join(", ")})`:""}`,_isCollab:!0,_sortTime:"23:59"})})});const c=[];i.forEach(A=>{(A.actionItems||[]).forEach(b=>{if(b.assignedTo!==n)return;const x=b.dueDate||A.date,D=new Date(x);D<o||D>r||c.push({date:x,workDescription:`[Meeting] Task: ${b.task} (from ${A.title})`,status:b.status||"pending",checkOut:"Action Item",_displayDesc:`[Meeting] Task: ${b.task} (from ${A.title})`,_isCollab:!1,_isMinute:!0,_meetingId:A.id,_sortTime:"09:00"})})});const p=[...l,...d,...c].sort((A,b)=>{const x=new Date(b.date)-new Date(A.date);return x!==0?x:b._sortTime.localeCompare(A._sortTime)});if(p.length===0)return'<div class="dashboard-activity-empty">No activity descriptions found.</div>';let u="",m="";const h=window.AppAuth.getUser(),f=window.app_hasPerm("dashboard","admin",h),g=h&&String(n||"")===String(h.id||""),S=!!(f||g);return p.forEach(A=>{A.date!==m&&(u+=`<div class="dashboard-activity-date">${A.date}</div>`,m=A.date);const x=A._isCollab?"#10b981":A._isMinute?"#6366f1":"#e5e7eb",D=A._isCollab?"dashboard-activity-item-collab":A._isMinute?"dashboard-activity-item-minute":"",T=Rn(A),_=A._isMinute?"minute":!A._isCollab&&A.id&&A.id!=="active_now"?"attendance":"plan",E=S?`<div class="dashboard-activity-edit-wrap"><button onclick="window.app_editDashboardActivity('${we(_)}','${we(A.id||"")}','${we(A.date||"")}','${we(n||"")}','${we(A._meetingId||"")}')" class="dashboard-activity-edit-btn" title="Edit Activity"><i class="fa-solid fa-pen-to-square"></i></button></div>`:"";let M="";if(A._isCollab||A.status||A._isMinute){const w=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(A.date,A.status):A.status||"to-be-started";M=`
                <div class="dashboard-activity-status-row">
                    ${Mn(w)}
                    ${E}
                </div>`}else E&&(M=`
                <div class="dashboard-activity-status-row">
                    <span></span>
                    ${E}
                </div>`);u+=`<div class="dashboard-activity-item ${D}" style="border-left-color:${x};"><div class="dashboard-activity-desc">${v(A._displayDesc)}</div>${T}${M}<div class="dashboard-activity-meta">${v(A.checkOut||(A.status==="completed"?"Completed":"Planned Activity"))}</div></div>`}),u}function Bn(a,e=null){const t=Array.isArray(a?.rows)?a.rows:[],n=a?.meta||{},s=String(a?.winnerUserId||e?.user?.id||""),i=n.startDate&&n.endDate?`${v(n.startDate)} to ${v(n.endDate)}`:"Last 7 completed days";if(!t.length)return`
            <section class="hero-leaderboard-panel">
                <div class="hero-leaderboard-head">
                    <div>
                        <h4>Weekly Hero Audit</h4>
                        <p>Scored range: ${i}</p>
                    </div>
                </div>
                <div class="dashboard-activity-empty">No staff leaderboard data available for this week.</div>
            </section>
        `;const o=(l,d,c,p)=>{const u=String(l?.user?.id||""),m=Number(c||0);return!m||!u?`<span class="hero-leaderboard-count">${m}</span>`:`<button type="button" class="hero-leaderboard-count-btn" onclick="window.app_openHeroTaskList('${v(u)}','${v(d)}')">${m}<span class="sr-only">${v(p)}</span></button>`},r=t.map(l=>{const d=l?.user||{},c=l?.stats||{},p=String(d.id||""),u=s&&p===s,m=l?.isEligible?"is-eligible":"is-ineligible",h=l?.isEligible?"Eligible":v(l?.eligibilityReason||"Not eligible"),f=Number.isFinite(Number(l?.rank))?`#${Number(l.rank)}`:"NR";return`
            <tr class="hero-leaderboard-row ${u?"is-winner":""}">
                <td class="hero-leaderboard-rank">${f}</td>
                <td class="hero-leaderboard-staff">
                    <div class="hero-leaderboard-staff-wrap">
                        <img src="${Ge(d.avatar)}" alt="${v(d.name||"Staff")}" class="hero-leaderboard-avatar">
                        <div>
                            <div class="hero-leaderboard-name">${v(d.name||"Unknown Staff")}</div>
                            <div class="hero-leaderboard-role">${v(d.role||"Staff")}</div>
                        </div>
                    </div>
                </td>
                <td>${Number(c.taskPlanned||0)}</td>
                <td>${o(l,"completed",c.taskCompleted,"completed tasks")}</td>
                <td>${o(l,"in_progress",c.taskInProgress,"in progress tasks")}</td>
                <td>${o(l,"postponed",c.taskPostponed,"postponed tasks")}</td>
                <td>${o(l,"missed",c.taskMissed,"missed tasks")}</td>
                <td>${Number(c.days||0)}</td>
                <td>${Number(c.hours||0).toFixed(1)}h</td>
                <td>${Number(c.completionRate||0).toFixed(1)}%</td>
                <td>x${Number(c.attendanceFactor||1).toFixed(2)}</td>
                <td>${Number(c.finalScore||0).toFixed(2)}</td>
                <td><span class="hero-leaderboard-pill ${m}">${h}</span></td>
            </tr>
        `}).join("");return`
        <section class="hero-leaderboard-panel">
            <div class="hero-leaderboard-head">
                <div>
                    <h4>Weekly Hero Audit</h4>
                    <p>Scored range: ${i}</p>
                </div>
                <div class="hero-leaderboard-summary">
                    <span class="dashboard-kpi-tag">Staff ${t.length}</span>
                    <span class="dashboard-kpi-tag">Winner ${v(e?.user?.name||t.find(l=>String(l?.user?.id||"")===s)?.user?.name||"None")}</span>
                </div>
            </div>
            <div class="table-container hero-leaderboard-table-wrap">
                <table class="hero-leaderboard-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Staff</th>
                            <th>Planned</th>
                            <th>Completed</th>
                            <th>In Progress</th>
                            <th>Postponed</th>
                            <th>Missed</th>
                            <th>Days</th>
                            <th>Hours</th>
                            <th>Completion</th>
                            <th>Factor</th>
                            <th>Score</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>${r}</tbody>
                </table>
            </div>
        </section>
    `}function Zs(a,e){const t=a?.user||{},n=a?.stats||{},s=a?.taskBuckets||{},i=Array.isArray(s?.[e])?s[e]:[],r={completed:"Completed Tasks",in_progress:"In Progress Tasks",postponed:"Postponed Tasks",missed:"Missed Tasks"}[e]||"Tasks",l=i.map((d,c)=>{const p=Array.isArray(d.subPlans)&&d.subPlans.length?`<div class="hero-task-item-subplans">${v(d.subPlans.join(", "))}</div>`:"",u=d.completedDate?`<span class="hero-task-item-chip">Completed ${v(d.completedDate)}</span>`:"",m=d.rawStatus?`<span class="hero-task-item-chip">Status ${v(d.rawStatus)}</span>`:"",h=we(String(t.id||"")),f=we(String(d.planId||"")),g=we(String(d.date||"")),S=we(String(e||"")),A=e==="completed"?`
                <button type="button" class="action-btn danger" onclick="window.app_deleteHeroTaskAction('${f}', ${Number(d.taskIndex)}, '${h}', '${S}')">Delete</button>
            `:e==="missed"?`
                    <button type="button" class="action-btn" onclick="window.app_completeHeroTaskAction('${f}', ${Number(d.taskIndex)}, '${h}', '${S}')">Complete</button>
                    <button type="button" class="action-btn secondary" onclick="window.app_postponeHeroTaskAction('${f}', ${Number(d.taskIndex)}, '${h}', '${S}')">Postpone</button>
                    <button type="button" class="action-btn danger" onclick="window.app_deleteHeroTaskAction('${f}', ${Number(d.taskIndex)}, '${h}', '${S}')">Delete</button>
                `:e==="postponed"?`
                        <button type="button" class="action-btn" onclick="window.app_completeHeroTaskAction('${f}', ${Number(d.taskIndex)}, '${h}', '${S}')">Complete</button>
                        <button type="button" class="action-btn secondary" onclick="window.app_postponeHeroTaskAction('${f}', ${Number(d.taskIndex)}, '${h}', '${S}')">Postpone Again</button>
                        <button type="button" class="action-btn danger" onclick="window.app_deleteHeroTaskAction('${f}', ${Number(d.taskIndex)}, '${h}', '${S}')">Delete</button>
                    `:`
                        <button type="button" class="action-btn" onclick="window.app_completeHeroTaskAction('${f}', ${Number(d.taskIndex)}, '${h}', '${S}')">Complete</button>
                        <button type="button" class="action-btn danger" onclick="window.app_deleteHeroTaskAction('${f}', ${Number(d.taskIndex)}, '${h}', '${S}')">Delete</button>
                    `;return`
            <div class="hero-task-item">
                <div class="hero-task-item-main">
                    <div class="hero-task-item-title">${c+1}. ${v(d.task||"Untitled task")}</div>
                    ${p}
                    <div class="hero-task-item-meta">
                        <span class="hero-task-item-chip">${v(d.date||"--")}</span>
                        ${m}
                        ${u}
                    </div>
                </div>
                <div class="hero-task-item-actions">
                    <button type="button" class="action-btn secondary" onclick="window.app_editHeroTaskAction('${g}','${h}')">Edit Plan</button>
                    ${A}
                </div>
            </div>
        `}).join("");return`
        <div class="hero-task-modal-head">
            <div>
                <h3>${v(r)}</h3>
                <p>${v(t.name||"Staff")} • ${Number(n.taskPlanned||0)} planned</p>
            </div>
            <button type="button" class="dashboard-max-close" onclick="window.app_closeHeroTaskList?.()" aria-label="Close task list">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="hero-task-modal-body">
            ${i.length?l:'<div class="dashboard-activity-empty">No tasks in this category for the scored range.</div>'}
        </div>
    `}function ha(a){const e=Ve();e.logs=Array.isArray(a)?a:[],setTimeout(()=>{const s=document.getElementById("staff-activity-list");s&&zn(s)},0);const t=ii(8),n=Pa(e.selectedMonth);return`
        <div class="card dashboard-team-activity-card">
            <div class="dashboard-team-activity-head">
                <div style="display:flex; align-items:center; gap:0.5rem;"><h4>Team Activity</h4></div>
                <span id="staff-activity-range-label">${v(n)}</span>
            </div>
            <div class="dashboard-team-activity-filters dashboard-team-activity-filters-compact">
                <select class="dashboard-team-select" onchange="window.app_setStaffActivityMonth(this.value)">
                    ${t.map(s=>`<option value="${s.key}" ${s.key===e.selectedMonth?"selected":""}>${v(s.label)}</option>`).join("")}
                </select>
                <select class="dashboard-team-select" onchange="window.app_setStaffActivitySort(this.value)">
                    <option value="date-desc" ${e.sortKey==="date-desc"?"selected":""}>Date (Newest)</option>
                    <option value="date-asc" ${e.sortKey==="date-asc"?"selected":""}>Date (Oldest)</option>
                    <option value="completed-first" ${e.sortKey==="completed-first"?"selected":""}>Completed First</option>
                    <option value="incomplete-first" ${e.sortKey==="incomplete-first"?"selected":""}>Incomplete First</option>
                    <option value="status-priority" ${e.sortKey==="status-priority"?"selected":""}>Status Priority</option>
                    <option value="staff-asc" ${e.sortKey==="staff-asc"?"selected":""}>Staff (A-Z)</option>
                    <option value="staff-desc" ${e.sortKey==="staff-desc"?"selected":""}>Staff (Z-A)</option>
                </select>
            </div>
            <div id="staff-activity-list" class="dashboard-team-activity-list dashboard-team-activity-list-split">
                ${Ma(e.logs,e.sortKey)}
            </div>
        </div>`}function Ma(a,e){const t=oi(a);if(t.length===0)return'<div class="dashboard-activity-empty">No team activities found for the selected month.</div>';const n=ri(t,e),s=n.filter(o=>o._taskStatus==="completed"),i=n.filter(o=>o._taskStatus!=="completed");return`
        <div class="dashboard-team-activity-split-grid">
            ${ya("Completed",s,"No completed tasks in this month.")}
            ${ya("In Progress / Incomplete",i,"No in-progress or incomplete tasks in this month.")}
        </div>
    `}function ya(a,e,t){const n=window.AppAuth.getUser(),s=window.app_hasPerm("dashboard","admin",n),i=e.length===0?`<div class="dashboard-activity-empty">${t}</div>`:e.map(o=>{const r=n&&o.userId===n.id,l=s||r,d=Rn(o),c=`
                <div class="dashboard-activity-status-row">
                    ${Mn(o._taskStatus)}
                    ${l?`<div class="dashboard-activity-edit-wrap"><button onclick="window.app_openDayPlan('${o.date}', '${o.userId||""}')" class="dashboard-activity-edit-btn" title="Edit/Reassign"><i class="fa-solid fa-pen-to-square"></i></button></div>`:""}
                </div>`;return`
                <div class="dashboard-staff-activity-item dashboard-staff-activity-item-compact">
                    <div class="dashboard-staff-name">${v(o.staffName||"Unknown Staff")}<span class="dashboard-team-activity-item-date">${o.date||""}</span></div>
                    <div class="dashboard-activity-desc dashboard-staff-activity-desc">${v(o._displayDesc||"Work Plan Task")}</div>
                    ${d}
                    ${c}
                    <div class="dashboard-activity-meta">${o._taskStatus==="completed"?"Completed":"Work Plan"}</div>
                </div>`}).join("");return`
        <div class="dashboard-team-activity-col">
            <div class="dashboard-team-activity-col-head">
                <span>${v(a)}</span>
                <span class="dashboard-team-activity-count">${e.length}</span>
            </div>
            <div class="dashboard-team-activity-col-list">${i}</div>
        </div>
    `}function Rn(a){if(!a)return"";const e=Number.isFinite(Number(a.progressPercent)),t=a.progressStatus?String(a.progressStatus).replace(/_/g," "):"",n=String(a.progressNote||"").trim();if(!e&&!t&&!n&&Array.isArray(a.taskUpdates)&&a.taskUpdates.length>0){const r=a.taskUpdates[0]||{},l=Number.isFinite(Number(r.progressPercent))?`${Number(r.progressPercent)}%`:"",d=r.progressStatus?String(r.progressStatus).replace(/_/g," "):"",c=String(r.progressNote||"").trim();if(!l&&!d&&!c)return"";const p=c?` title="${v(c)}"`:"",u=`${l}${l&&d?" - ":""}${v(d)}`;return`<div class="dashboard-progress-chip"${p}>${u}</div>`}if(!e&&!t&&!n)return"";const s=e?`${Number(a.progressPercent)}%`:"",i=n?` title="${v(n)}"`:"",o=`${s}${s&&t?" - ":""}${v(t)}`;return`<div class="dashboard-progress-chip"${i}>${o}</div>`}function je(a,e,t,n=""){const i=Number(t.penalty??t.penaltyLeaves??0)>0?'<span class="dashboard-penalty-badge">Penalty Applies</span>':"";return`
        <div class="card dashboard-stats-card" ${n?` data-stats-type="${v(n)}"`:""} role="button" tabindex="0" aria-label="Open ${v(a)} details">
            <div class="dashboard-stats-card-head">
                <div>
                    <h4 class="dashboard-stats-card-title">${v(a)}</h4>
                    <span class="dashboard-stats-card-subtitle">${v(e)}</span>
                </div>
                ${i}
            </div>

            <div class="dashboard-stats-metric-grid">
                 <div class="dashboard-stats-metric dashboard-stats-metric-late">
                    <div class="dashboard-stats-metric-value">${v(t.totalLateDuration)}</div>
                    <div class="dashboard-stats-metric-label">Late</div>
                 </div>
                 <div class="dashboard-stats-metric dashboard-stats-metric-extra">
                    <div class="dashboard-stats-metric-value">${v(t.totalExtraDuration)}</div>
                    <div class="dashboard-stats-metric-label">Extra</div>
                 </div>
            </div>

            <div class="dashboard-breakdown-grid">
                ${On(t.breakdown)}
            </div>
        </div>
    `}function ei(a){const e=String(a||"").trim()==="yearly"?"yearly":"monthly",t=window.app_dashboardStatsStore||{},n=e==="yearly"?t.yearly||{}:t.monthly||{},s=e==="yearly"?t.yearlyTitle||"Yearly Summary":t.monthlyTitle||"Monthly Summary",i=e==="yearly"?t.yearlySubtitle||"":t.monthlySubtitle||"",o=n.breakdown||{},r=t.ranges?e==="yearly"?t.ranges.yearly:t.ranges.monthly:null,l=ai(t.logs||[],r),d={late:l.late||[],early:l.early||[],extra:l.extra||[]},c=(p,u)=>`
        <div class="dashboard-inline-stats-section">
            <div class="dashboard-inline-stats-label">${v(p)}</div>
            <div class="dashboard-inline-stats-dates">
                ${u.length?u.map(m=>`<span class="dashboard-inline-stats-date">${v(m)}</span>`).join(""):'<span class="dashboard-inline-stats-empty">No dates</span>'}
            </div>
        </div>
    `;return`
        <div class="dashboard-inline-stats-detail">
            <div class="dashboard-inline-stats-head">
                <h5>${v(s)}</h5>
                <span>${v(i||"Detailed summary")}</span>
            </div>
            <div class="dashboard-inline-stats-grid">
                <div class="dashboard-inline-stats-tile"><strong>${v(n.late??0)}</strong><span>Late Count</span></div>
                <div class="dashboard-inline-stats-tile"><strong>${v(n.totalLateDuration||"0h 0m")}</strong><span>Late Duration</span></div>
                <div class="dashboard-inline-stats-tile"><strong>${v(n.earlyDepartures??0)}</strong><span>Early Exits</span></div>
                <div class="dashboard-inline-stats-tile"><strong>${v(n.extraWorkedHours??0)}h</strong><span>Extra Hours</span></div>
            </div>
            ${c("Late Dates",d.late)}
            ${c("Early Departure Dates",d.early)}
            ${c("Extra Hours Dates",d.extra)}
            <div class="dashboard-inline-stats-breakdown">
                ${Object.entries(o).map(([p,u])=>`<div class="dashboard-inline-stats-breakdown-row"><span>${v(p)}</span><strong>${v(u)}</strong></div>`).join("")}
            </div>
        </div>
    `}function On(a){const e=Object.entries(a),t={Present:{color:"#166534",bg:"#f0fdf4",label:"Office"},"Work - Home":{color:"#0369a1",bg:"#e0f2fe",label:"WFH"},Training:{color:"#4338ca",bg:"#eef2ff",label:"Training"},Late:{color:"#c2410c",bg:"#fff7ed",label:"Late"},"Sick Leave":{color:"#991b1b",bg:"#fef2f2",label:"Sick"},"Casual Leave":{color:"#9d174d",bg:"#fce7f3",label:"Casual"},"Earned Leave":{color:"#be185d",bg:"#fdf2f8",label:"Earned"},"Paid Leave":{color:"#be123c",bg:"#ffe4e6",label:"Paid"},"Maternity Leave":{color:"#a21caf",bg:"#fae8ff",label:"Maternity"},Absent:{color:"#7f1d1d",bg:"#fee2e2",label:"Absent"},"Early Departure":{color:"#991b1b",bg:"#fff1f2",label:"Early Exit"},Holiday:{color:"#1e293b",bg:"#f1f5f9",label:"Holiday"},"National Holiday":{color:"#334155",bg:"#f8fafc",label:"Nat. Hol"},"Regional Holidays":{color:"#475569",bg:"#f8fafc",label:"Reg. Hol"}};return e.map(([n,s])=>{const i=t[n]||{color:"#374151",bg:"#f3f4f6",label:n};return s===0&&!["Present","Late","Absent","Early Departure"].includes(n)?"":`
            <div class="dashboard-breakdown-item" style="background:${i.bg};">
                <span class="dashboard-breakdown-count" style="color:${i.color}">${s}</span>
                <span class="dashboard-breakdown-label" style="color:${i.color};">${i.label}</span>
            </div>
         `}).join("")}function ti(){document.querySelectorAll(".dashboard-stats-card[data-stats-type]").forEach(a=>{if(a.dataset.bound==="1")return;a.dataset.bound="1";const e=a.getAttribute("data-stats-type")||"";a.addEventListener("click",t=>{t.target&&t.target.closest&&t.target.closest(".dashboard-card-mode-controls")||window.app_toggleDashboardCardMode?.(`stats-${e}`,ue,a)}),a.addEventListener("keydown",t=>{(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),window.app_toggleDashboardCardMode?.(`stats-${e}`,ue,a))})})}function Fn(){document.querySelectorAll(".dashboard-hero-stats-card.hero-slot").forEach(a=>{a.dataset.heroBound!=="1"&&(a.dataset.heroBound="1",a.setAttribute("tabindex","0"),a.setAttribute("role","button"),a.setAttribute("aria-label","Open Hero of the Week details"),a.addEventListener("click",e=>{e.target&&e.target.closest&&e.target.closest(".dashboard-card-mode-controls")||window.app_toggleDashboardCardMode?.("hero-week",ue,a)}),a.addEventListener("keydown",e=>{(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),window.app_toggleDashboardCardMode?.("hero-week",ue,a))}))})}function ln(a){const e=String(a||"").trim();if(!e||e.toLowerCase().includes("active"))return null;const t=e.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);if(!t)return null;let n=Number(t[1]);const s=Number(t[2]),i=t[3]?t[3].toUpperCase():"";return i==="PM"&&n<12&&(n+=12),i==="AM"&&n===12&&(n=0),n*60+s}function ai(a,e){const t={late:new Set,early:new Set,extra:new Set,breakdown:{Present:new Set,"Work - Home":new Set,Training:new Set,"Sick Leave":new Set,"Casual Leave":new Set,"Earned Leave":new Set,"Paid Leave":new Set,"Maternity Leave":new Set,Absent:new Set,Holiday:new Set,"National Holiday":new Set,"Regional Holidays":new Set,Late:new Set,"Early Departure":new Set}},n=e?.start?new Date(e.start):new Date("1970-01-01"),s=e?.end?new Date(e.end):new Date;n.setHours(0,0,0,0),s.setHours(23,59,59,999);let i=Array.isArray(a)?a:[];if(window.AppAnalytics&&window.AppAnalytics.pickBestAttendanceLogPerDay)try{i=window.AppAnalytics.pickBestAttendanceLogPerDay(i,n,s)}catch(d){console.warn("pickBestAttendanceLogPerDay failed",d)}else{const d=new Map;i.forEach(c=>{const p=c.date||"";p&&(d.has(p)||d.set(p,c))}),i=Array.from(d.values())}const o=(typeof N<"u"&&N?N.LATE_CUTOFF_MINUTES:555)||555,r=(typeof N<"u"&&N?N.EARLY_DEPARTURE_MINUTES:1020)||1020;i.forEach(d=>{const c=d.date?new Date(d.date):null;if(!c||Number.isNaN(c.getTime())||c<n||c>s)return;const p=d.date,u=String(d.type||""),m=ln(d.checkIn),h=ln(d.checkOut),f=d.isManualOverride===!0;(d.lateCountable===!0||!Object.prototype.hasOwnProperty.call(d,"lateCountable")&&m!==null&&m>o)&&(t.late.add(p),t.breakdown.Late.add(p)),f?u==="Early Departure"&&(t.early.add(p),t.breakdown["Early Departure"].add(p)):h!==null&&h<r&&!String(u).includes("Leave")&&u!=="Absent"&&(t.early.add(p),t.breakdown["Early Departure"].add(p));const S=typeof d.extraWorkedMs=="number"?Math.max(0,Math.round(d.extraWorkedMs/(1e3*60))):0,A=!(d.autoCheckout&&!d.autoCheckoutExtraApproved);(S>0||A&&(m!==null&&m<o||h!==null&&h>r))&&t.extra.add(p),u==="Work - Home"?t.breakdown["Work - Home"].add(p):u==="Training"?t.breakdown.Training.add(p):u==="Sick Leave"?t.breakdown["Sick Leave"].add(p):u==="Casual Leave"?t.breakdown["Casual Leave"].add(p):u==="Earned Leave"?t.breakdown["Earned Leave"].add(p):u==="Paid Leave"?t.breakdown["Paid Leave"].add(p):u==="Maternity Leave"?t.breakdown["Maternity Leave"].add(p):u==="Absent"?t.breakdown.Absent.add(p):u==="National Holiday"?t.breakdown["National Holiday"].add(p):u==="Regional Holidays"?t.breakdown["Regional Holidays"].add(p):String(u).includes("Holiday")?t.breakdown.Holiday.add(p):d.checkIn&&t.breakdown.Present.add(p)});const l=d=>Array.from(d||[]).sort((c,p)=>new Date(c)-new Date(p));return{late:l(t.late),early:l(t.early),extra:l(t.extra),breakdown:Object.fromEntries(Object.entries(t.breakdown).map(([d,c])=>[d,l(c)]))}}function Ca(a,e=[]){const t=Array.isArray(a)&&a.length>0,n=Array.isArray(e)&&e.length>0;if(!t&&!n)return`
            <div class="card dashboard-leave-requests-card">
                <div class="dashboard-leave-requests-head"><h4>Pending Leaves & Work From Home</h4><span>Review requirements</span></div>
                <div class="dashboard-leave-requests-list">
                    <div class="dashboard-activity-empty">No pending leave or work from home records.</div>
                </div>
            </div>`;const s=t?a.slice(0,5).map(o=>`
            <div class="dashboard-leave-row">
                <div class="dashboard-leave-info">
                    <div class="dashboard-leave-name">${v(o.userName||"Staff")}</div>
                    <div class="dashboard-leave-type">${v(o.type)} • ${o.daysCount} days</div>
                    <div class="dashboard-leave-date">${o.startDate} to ${o.endDate}</div>
                    <div class="dashboard-leave-meta">ID: ${v(String(o.id||"--"))}</div>
                    ${o.reason?`<div class="dashboard-leave-reason">${v(o.reason)}</div>`:""}
                </div>
                <div class="dashboard-leave-actions">
                    <button class="dashboard-leave-btn export" data-action="export" data-leave-id="${o.id}" title="Export PDF"><i class="fa-solid fa-file-pdf"></i></button>
                    <button class="dashboard-leave-btn comment" data-action="comment" data-leave-id="${o.id}" title="Add Comment"><i class="fa-solid fa-comment-dots"></i></button>
                    <button class="dashboard-leave-btn approve" data-action="approve" data-leave-id="${o.id}" title="Approve"><i class="fa-solid fa-check"></i></button>
                    <button class="dashboard-leave-btn reject" data-action="reject" data-leave-id="${o.id}" title="Reject"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
        `).join(""):"",i=n?e.slice(0,5).map(o=>`
            <div class="dashboard-leave-row">
                <div class="dashboard-leave-info">
                    <div class="dashboard-leave-name">${v(o.userName||"Staff")}</div>
                    <div class="dashboard-leave-type">Work From Home • 1 day</div>
                    <div class="dashboard-leave-date">${v(o.date||"--")} • ${v(o.checkIn||"--")} to ${v(o.checkOut||"Active")}</div>
                </div>
                <div class="dashboard-leave-actions">
                    <span class="dashboard-tagged-pill accepted">WFH</span>
                </div>
            </div>
        `).join(""):"";return`
        <div class="card dashboard-leave-requests-card">
            <div class="dashboard-leave-requests-head"><h4>Pending Leaves & Work From Home</h4><span>Review requirements</span></div>
            <div class="dashboard-leave-requests-list">
                ${s}
                ${i}
            </div>
            ${t&&a.length>5?`<div class="dashboard-leave-footer"><button onclick="window.location.hash = 'leaves'">View all ${a.length} leave requests</button></div>`:""}
        </div>`}function ni(a){return!a||a.length===0?`
            <div class="card full-width dashboard-tagged-card">
                <div class="dashboard-tagged-head"><h4>Missed Checkout Requests</h4><span>Pending admin review</span></div>
                <div class="dashboard-tagged-list">
                    <div class="dashboard-activity-empty">No missed checkout requests waiting for review.</div>
                </div>
            </div>`:`
        <div class="card full-width dashboard-tagged-card">
            <div class="dashboard-tagged-head"><h4>Missed Checkout Requests</h4><span>Pending admin review</span></div>
            <div class="dashboard-tagged-list">
                ${a.map(e=>`
                    <div class="dashboard-tagged-item">
                        <div class="dashboard-tagged-main">
                            <div class="dashboard-tagged-title">${v(e.staffName||"Staff")}</div>
                            <div class="dashboard-tagged-desc">${v(e.reason||"Reason not available.")}</div>
                            <div class="dashboard-tagged-meta">${v(e.date||"--")} | ${v(e.staffRole||"Employee")}${e.submittedAt?` | Submitted ${v(new Date(e.submittedAt).toLocaleString())}`:""}</div>
                        </div>
                        <div class="dashboard-tagged-status">
                            <span class="dashboard-tagged-pill pending">PENDING</span>
                            ${e.notificationId?`
                                <div class="dashboard-tagged-actions">
                                    <button class="dashboard-tagged-btn accept" onclick='window.app_reviewMissedCheckoutReasonFromNotification(-1, ${JSON.stringify(String(e.notificationId))}, "approved")'>Approve</button>
                                    <button class="dashboard-tagged-btn reject" onclick='window.app_reviewMissedCheckoutReasonFromNotification(-1, ${JSON.stringify(String(e.notificationId))}, "rejected")'>Reject</button>
                                </div>
                            `:'<span class="text-muted" style="font-size:0.7rem;">Notification sync pending</span>'}
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>`}function La(a,e={}){const t=e.title||"Leave History",n=e.subtitle||"Past records",s=e.selectedDate||new Date().toISOString().slice(0,10),i=e.canUndo===!0;if(!a||a.length===0)return`
            <div class="card dashboard-leave-history-card">
                <div class="dashboard-leave-history-head">
                    <div>
                        <h4>${v(t)}</h4>
                        <span>${v(n)}</span>
                    </div>
                    <input type="date" class="dashboard-team-select" value="${v(s)}" onchange="window.app_setDashboardLeaveHistoryDate(this.value)">
                </div>
                <div class="dashboard-activity-empty">No leave history found.</div>
            </div>`;const o=r=>r==="Approved"?"#166534":r==="Rejected"?"#b91c1c":"#854d0e";return`
        <div class="card dashboard-leave-history-card">
            <div class="dashboard-leave-history-head">
                <div>
                    <h4>${v(t)}</h4>
                    <span>${v(n)}</span>
                </div>
                <input type="date" class="dashboard-team-select" value="${v(s)}" onchange="window.app_setDashboardLeaveHistoryDate(this.value)">
            </div>
            <div class="dashboard-leave-history-list">
                ${a.map(r=>`
                    <div class="dashboard-leave-history-row">
                        <div class="dashboard-leave-history-main">
                            <div class="dashboard-leave-history-user">${v(r.userName||"Staff")}</div>
                            <div class="dashboard-leave-history-type">${v(r.type)} - ${r.daysCount} days</div>
                            <div class="dashboard-leave-meta">ID: ${v(String(r.id||"--"))}</div>
                            ${r.reason?`<div class="dashboard-leave-reason">${v(r.reason)}</div>`:""}
                            <div class="dashboard-leave-history-date">${r.startDate} to ${r.endDate}${r.adminComment?` • ${v(r.adminComment)}`:""}</div>
                        </div>
                        <div class="dashboard-leave-history-status">
                            <span class="status-pill" style="background: ${o(r.status)}15; color: ${o(r.status)}">${v(r.status)}</span>
                            ${i&&["Approved","Rejected"].includes(String(r.status||""))?`
                                <button type="button" class="dashboard-tagged-btn" style="margin-top:0.45rem;" onclick="window.app_undoLeaveDecision('${v(r.id)}')">Undo</button>
                            `:""}
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>`}function Hn(a,e){return""}function Un(a){return""}function si(a,e,t){if(!a||a.length===0)return`
            <div class="card dashboard-staff-directory-card">
                <div class="dashboard-staff-directory-head"><h4>Staff Directory</h4><span>Quick actions</span></div>
                <div class="dashboard-staff-directory-list">
                    <div class="dashboard-activity-empty">No staff loaded.</div>
                </div>
            </div>`;const n=Date.now(),s=o=>{const r=(o.notifications||[]).map(l=>new Date(l.taggedAt||l.date||l.respondedAt||0).getTime()).filter(Boolean);return r.length?Math.max(...r):0};return`
        <div class="card dashboard-staff-directory-card">
            <div class="dashboard-staff-directory-head"><h4>Staff Directory</h4><span>Message or assign</span></div>
            <div class="dashboard-staff-directory-list">
                ${a.filter(o=>o.id!==t.id).sort((o,r)=>s(r)-s(o)||o.name.localeCompare(r.name)).map(o=>{const r=s(o);return`
                <div class="dashboard-staff-row ${r&&n-r<12e4?"dashboard-staff-row-new":""}">
                    <div class="dashboard-staff-meta">
                        <div class="dashboard-staff-avatar">
                            <img src="${Ge(o.avatar)}" alt="${v(o.name)}">
                        </div>
                        <div class="dashboard-staff-text">
                            <div class="dashboard-staff-name">${v(o.name)}</div>
                            <div class="dashboard-staff-role">${v(o.role||"Staff")}</div>
                        </div>
                    </div>
                    <div class="dashboard-staff-actions">
                        <button class="dashboard-staff-btn" onclick="window.location.hash = 'staff-directory'; window.app_openStaffThread('${o.id}')" title="Message"><i class="fa-solid fa-message"></i></button>
                    </div>
                </div>
            `}).join("")}
            </div>
        </div>`}async function Ea(){window.app_closeDashboardCardMaximize?.();const a=window.AppAuth.getUser(),e=window.app_hasPerm("dashboard","view",a),t=window.app_hasPerm("dashboard","admin",a),n=Ve(),s=n.selectedMonth,i=n.leaveHistoryDate||new Date().toISOString().slice(0,10),o=window.AppDB?.getISTDateKeys?window.AppDB.getISTDateKeys():{todayKey:new Date().toISOString().split("T")[0],yesterdayKey:new Date(Date.now()-1440*60*1e3).toISOString().split("T")[0]},r=o.todayKey,l=o.yesterdayKey,d=!!N?.READ_OPT_FLAGS?.FF_SHARED_DAILY_SUMMARY,c=Number(window.AppAnalytics?.getHeroPolicy?.()?.SCHEMA_VERSION||N?.HERO_POLICY?.SCHEMA_VERSION||1),p=`hero_stats_v${c}_${r}`,u=`hero_leaderboard_v${c}_${r}`,m=1440*60*1e3,h=e&&window.app_selectedSummaryStaffId?window.app_selectedSummaryStaffId:a.id;console.time("DashboardFetch");const f=async()=>{try{return await window.AppDB.getOrGenerateSummary(p,async()=>{const Y=await window.AppAnalytics.getHeroOfTheWeek({source:"direct_cache"});if(!Y||Y.state==="fetch_error")throw new Error("direct hero unavailable");return Y},m)}catch(Y){return console.warn("Direct hero cache read failed:",Y),null}},g=d?Promise.resolve(null):f(),S=!d&&window.AppDB?.getOrGenerateSummary?window.AppDB.getOrGenerateSummary(u,async()=>window.AppAnalytics.getHeroLeaderboard({source:"direct_cache"}),m).catch(Y=>(console.warn("Hero leaderboard cache read failed:",Y),null)):Promise.resolve(null),A=d?Promise.resolve([]):window.AppDB.getOrGenerateSummary(`team_activity_${s}_${r}_all_v2`,()=>window.AppAnalytics.getAllStaffActivities({mode:"month",month:s,scope:"all",sideEffects:!1})),b=d&&window.AppDB.getOrCreateDailySummary?window.AppDB.getOrCreateDailySummary({dateKey:r,yesterdayKey:l,staleAfterMs:N?.SUMMARY_POLICY?.STALENESS_MS,lockTtlMs:N?.SUMMARY_POLICY?.LOCK_TTL_MS,generatorFn:()=>window.AppAnalytics.buildDailyDashboardSummary({dateKey:r,selectedMonth:s})}).catch(Y=>(console.warn("Daily summary fetch/generation failed:",Y),null)):null,x=b?Promise.race([b,new Promise(Y=>setTimeout(()=>Y(null),1500))]):Promise.resolve(null);if(!window._dashboardRefreshScheduled){window._dashboardRefreshScheduled=!0;try{const Y=window.AppDB.getIstNow(),se=new Date(Y);se.setDate(se.getDate()+1),se.setHours(0,0,5,0);const me=se.getTime()-Y.getTime();setTimeout(()=>{Ea().then(de=>{const re=document.getElementById("page-content");re&&(re.innerHTML=de)}),window._dashboardRefreshScheduled=!1},Math.max(0,me))}catch(Y){console.warn("failed to schedule dashboard refresh",Y)}}const D=e?(Array.isArray(a.notifications)?a.notifications:[]).filter(Y=>Y&&Y.type==="missed-checkout-reason"&&String(Y.status||"pending").toLowerCase()==="pending"&&Y.logId):[],T=Array.from(new Set(D.map(Y=>String(Y.logId||"")).filter(Boolean))),_=Et(i),[E,M,w,y,k,P,R,C,B,O,F,U,W,$,I,H]=await Promise.all([window.AppAttendance.getStatus(),window.AppAttendance.getLogs(h),window.AppAnalytics.getUserMonthlyStats(h),window.AppAnalytics.getUserYearlyStats(h),g,S,window.AppCalendar?window.AppCalendar.getPlans():{leaves:[],events:[]},A,window.app_hasPerm("leaves","view")?window.AppLeaves.getPendingLeaves():Promise.resolve([]),window.AppDB.getCached?window.AppDB.getCached(window.AppDB.getCacheKey("dashboardUsers","users",{}),N?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):window.AppDB.getAll("users"),window.AppCalendar?window.AppCalendar.getCollaborations(h):Promise.resolve([]),window.app_hasPerm("leaves","view")?window.AppDB.getAll("leaves"):Promise.resolve([]),x,window.AppMinutes?window.AppMinutes.getMinutes():Promise.resolve([]),e&&T.length?window.AppDB.getManyByIds?window.AppDB.getManyByIds("attendance",T):Promise.all(T.map(Y=>window.AppDB.get("attendance",Y))).then(Y=>Y.filter(Boolean)):Promise.resolve([]),e&&window.app_hasPerm("leaves","view")?window.AppDB.queryMany?window.AppDB.queryMany("attendance",[{field:"date",operator:">=",value:_.startKey},{field:"date",operator:"<=",value:_.endKey}]):window.AppDB.getAll("attendance").then(Y=>(Y||[]).filter(se=>{const me=String(se?.date||"");return me>=_.startKey&&me<=_.endKey})):Promise.resolve([])]);console.timeEnd("DashboardFetch");const L=d?{lowRead:!1,generatedAt:W?.generatedAt||W?.meta?.generatedAt||0,source:W?._source||""}:{};let z=d?W?.hero||null:k,q=d?Array.isArray(W?.teamActivityPreview)?W.teamActivityPreview:[]:C;window.app_dashboardHeroLeaderboard=d?W?.heroLeaderboard||null:P,window.app_dashboardHeroData=z,window.app_dashboardHeroMeta=L,d&&(!W||!Array.isArray(W.teamActivityPreview))&&setTimeout(()=>Tt(!0),0);const j=De(z,L);if(d&&z==null&&b){const Y="app_hero_fallback_attempted_date",se=()=>{try{return localStorage.getItem(Y)===r}catch{return!1}},me=()=>{try{localStorage.setItem(Y,r)}catch{}},de=re=>{const le=document.querySelector(".hero-slot");le&&(le.outerHTML=re,setTimeout(()=>{rn(),Fn()},0))};b.then(async re=>{const le=re&&re.hero?re.hero:null,xe=re&&re.heroLeaderboard?re.heroLeaderboard:null;if(le){const fe={...L,lowRead:!1,generatedAt:re.generatedAt||L.generatedAt,source:re._source||L.source};window.app_dashboardHeroLeaderboard=xe,window.app_dashboardHeroData=le,window.app_dashboardHeroMeta=fe,de(De(le,fe));return}const ea=await f();if(ea){const fe=d?await window.AppAnalytics.getHeroLeaderboard({source:"direct_cache"}).catch(()=>null):await S;window.app_dashboardHeroLeaderboard=fe,window.app_dashboardHeroData=ea,window.app_dashboardHeroMeta={...L,lowRead:!1,generatedAt:Date.now(),source:"direct_cache"},de(De(ea,{...L,generatedAt:Date.now(),source:"direct_cache"}));return}if(de(De({state:"no_eligible_data",reason:"No eligible hero data available.",source:"shared_summary"},{...L,generatedAt:re?.generatedAt||L.generatedAt,source:re?._source||"shared_missing"})),!se()){me();try{const fe=await window.AppAnalytics.getHeroOfTheWeek({source:"direct_fallback"}),qe=await window.AppAnalytics.getHeroLeaderboard({source:"direct_fallback"});if(!fe||fe.state==="fetch_error"){window.app_dashboardHeroLeaderboard=qe&&qe.state!=="fetch_error"?qe:null,window.app_dashboardHeroData={state:"fetch_error",reason:"Hero stats are temporarily unavailable.",source:"direct_fallback"},window.app_dashboardHeroMeta={...L,lowRead:!1,generatedAt:Date.now(),source:"direct_fallback"},de(De({state:"fetch_error",reason:"Hero stats are temporarily unavailable.",source:"direct_fallback"},{...L,lowRead:!1,generatedAt:Date.now(),source:"direct_fallback"}));return}await window.AppDB.getOrGenerateSummary(p,async()=>fe,m);const an={...L,lowRead:!1,generatedAt:Date.now(),source:"direct_fallback"};window.app_dashboardHeroLeaderboard=qe&&qe.state!=="fetch_error"?qe:null,window.app_dashboardHeroData=fe,window.app_dashboardHeroMeta=an,de(De(fe,an))}catch(fe){console.warn("Hero fallback direct fetch failed:",fe),window.app_dashboardHeroLeaderboard=null,window.app_dashboardHeroData={state:"fetch_error",reason:"Hero stats are temporarily unavailable.",source:"direct_fallback"},window.app_dashboardHeroMeta={...L,lowRead:!1,generatedAt:Date.now(),source:"direct_fallback"},de(De({state:"fetch_error",reason:"Hero stats are temporarily unavailable.",source:"direct_fallback"},{...L,generatedAt:Date.now(),source:"direct_fallback"}))}}}).catch(()=>{window.app_dashboardHeroLeaderboard=null,window.app_dashboardHeroData={state:"fetch_error",reason:"Hero stats are temporarily unavailable.",source:"shared_error"},window.app_dashboardHeroMeta={...L,lowRead:!1,source:"shared_error"},de(De({state:"fetch_error",reason:"Hero stats are temporarily unavailable.",source:"shared_error"},{...L,source:"shared_error"}))})}window.AppRating&&a.rating===void 0&&window.AppRating.updateUserRating(a.id).then(Y=>{Object.assign(a,Y)}).catch(()=>{});const J=(O||[]).find(Y=>Y.id===h),Q=h===a.id,ae=!Q&&J?J:a,Ae=e&&!Q&&!t,pe=new Date,Gt=new Date(pe.getFullYear(),pe.getMonth(),1),Jt=new Date(pe.getFullYear(),pe.getMonth()+1,0),Qe=window.AppAnalytics&&window.AppAnalytics.getFinancialYearDates?window.AppAnalytics.getFinancialYearDates():{start:new Date(pe.getFullYear(),0,1),end:new Date(pe.getFullYear(),11,31)};window.app_dashboardStatsStore={monthly:w||{},yearly:y||{},monthlyTitle:Q?w.label:`${w.label} - ${J?.name||"Staff"}`,monthlySubtitle:Q?"Monthly Stats":"Viewing Staff Monthly Stats",yearlyTitle:"Yearly Summary",yearlySubtitle:Q?y.label:`${y.label} for ${J?.name||"Staff"}`,logs:Array.isArray(M)?M:[],ranges:{monthly:{start:Gt.toISOString().split("T")[0],end:Jt.toISOString().split("T")[0]},yearly:{start:Qe.start.toISOString().split("T")[0],end:Qe.end.toISOString().split("T")[0]}}};const Me=Ae?{status:ae.status||"out",lastCheckIn:ae.lastCheckIn||null,isPaused:ae.isPaused===!0,pauseStartedAt:ae.pauseStartedAt||null,totalPausedMs:Number(ae.totalPausedMs)||0}:E,Be=Me.status==="in",Xt=a.notifications||[];a.tagHistory;const Ze=new Map((O||[]).map(Y=>[String(Y.id),Y])),Is=e?(I||[]).filter(Y=>Y&&Y.missedCheckoutReasonRequired&&Y.missedCheckoutReasonSubmittedAt&&String(Y.missedCheckoutReasonStatus||"").toLowerCase()==="pending").map(Y=>{const se=Ze.get(String(Y.user_id));return{notificationId:Xt.find(de=>de&&de.type==="missed-checkout-reason"&&String(de.logId||"")===String(Y.id||"")&&String(de.status||"pending").toLowerCase()==="pending")?.id||"",staffName:se?.name||"Staff",staffRole:se?.role||"Employee",reason:Y.missedCheckoutReason||"",date:Y.date||"",submittedAt:Y.missedCheckoutReasonSubmittedAt||""}}).sort((Y,se)=>new Date(se.submittedAt||se.date||0)-new Date(Y.submittedAt||Y.date||0)):[],Ms=e?(H||[]).filter(Y=>(window.AppAttendance?.normalizeType?window.AppAttendance.normalizeType(Y?.type||""):String(Y?.type||""))==="Work - Home").map(Y=>({userName:Ze.get(String(Y.user_id||Y.userId||""))?.name||Y.userName||"Staff",date:Y.date||"",checkIn:Y.checkIn||"",checkOut:Y.checkOut||""})).sort((Y,se)=>new Date(se.date||0)-new Date(Y.date||0)):[];let Xa="00 : 00 : 00",Qa="Check-in",Za="action-btn";Be&&(Qa="Check-out",Za="action-btn checkout");const Cs=Be&&!Ae?`<button class="action-btn secondary dashboard-checkin-btn dashboard-checkin-pause-btn" id="attendance-pause-btn" onclick="window.${Me.isPaused?"app_resumeSession":"app_pauseSession"}()">
            ${Me.isPaused?"Resume":"Pause"} <i class="fa-solid ${Me.isPaused?"fa-play":"fa-pause"}"></i>
        </button>`:"",Ls=Y=>{const se=Math.max(0,Y||0);let me=Math.floor(se/(1e3*60*60)),de=Math.floor(se/(1e3*60)%60),re=Math.floor(se/1e3%60);return`${String(me).padStart(2,"0")} : ${String(de).padStart(2,"0")} : ${String(re).padStart(2,"0")}`};if(Be&&Me.lastCheckIn){const Y=new Date(Me.lastCheckIn).getTime();Xa=Ls(Date.now()-Y)}const Es=Hn(),Ps=Un();let en="";e&&!Q&&J&&(en=`
            <div class="card full-width dashboard-staff-view-banner">
                <div class="dashboard-staff-view-banner-inner">
                    <div class="dashboard-staff-view-banner-profile">
                        <div class="dashboard-staff-view-avatar-wrap">
                            <img src="${Ge(J.avatar)}" alt="${v(J.name)}" class="dashboard-staff-view-avatar">
                            <div class="dashboard-staff-view-avatar-badge">
                                <i class="fa-solid fa-eye"></i>
                            </div>
                        </div>
                        <div class="dashboard-staff-view-copy">
                            <div class="dashboard-staff-view-eyebrow">Currently Viewing</div>
                            <h3 class="dashboard-staff-view-title">${v(J.name)}'s Dashboard</h3>
                            <div class="dashboard-staff-view-meta">${v(J.role)} - ${v(J.dept||"General")}</div>
                        </div>
                    </div>
                    <button onclick="window.app_changeSummaryStaff('${a.id}')" class="dashboard-staff-view-back-btn">
                        <i class="fa-solid fa-arrow-left"></i> Back to My Dashboard
                    </button>
                </div>
            </div>`);let Qt="";const tn=Ta(R);if(e){const Y=!!window.app_selectedSummaryStaffId&&window.app_selectedSummaryStaffId!==a.id,se=Et(i),me=(U||[]).filter(le=>{const xe=String(le.appliedOn||le.actionDate||le.startDate||"").slice(0,10);return xe&&xe>=se.startKey&&xe<=se.endKey}).sort((le,xe)=>new Date(xe.appliedOn||xe.actionDate||xe.startDate||0)-new Date(le.appliedOn||le.actionDate||le.startDate||0)),de=Y?me.filter(le=>(le.userId||le.user_id)===h).slice(0,8):me.slice(0,8),re=La(de,{title:Y?`${J?.name||"Staff"} Leave History`:"Leave Request History",subtitle:Y?`Current week (${se.label}) for selected staff`:`Current week (${se.label}) across all staff`,selectedDate:i,canUndo:!0});Qt=`
            <div class="dashboard-summary-row">
                <div style="flex: 2; min-width: 350px; display: flex; flex-direction: column;">${Ca(B,Ms)}${ni(Is)}${re}</div>
                <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 1rem;">${tn}${j}</div>
            </div>
            <div class="dashboard-stats-row">
                ${je(Q?w.label:`${w.label} - ${J?.name||"Staff"}`,Q?"Monthly Stats":"Viewing Staff Monthly Stats",w,"monthly")}
                ${je("Yearly Summary",Q?y.label:`${y.label} for ${J?.name||"Staff"}`,y,"yearly")}
            </div>`}else Qt=`
            <div class="dashboard-summary-row">
                <div class="dashboard-summary-col dashboard-summary-col-wide">${ha(q)}</div>
                <div class="dashboard-summary-col dashboard-summary-col-narrow">${j}</div>
            </div>
            <div class="dashboard-stats-row">
                ${je(w.label,"Monthly Stats",w,"monthly")}
                ${je("Yearly Summary",y.label,y,"yearly")}
            </div>`;const Ns=e?ha(q):tn,Zt=window.app_getReleaseUpdateState&&window.app_getReleaseUpdateState()||{active:!1};return setTimeout(()=>Qs(),0),window.app_dashboardWorklogContext={logs:Array.isArray(M)?M:[],collaborations:Array.isArray(F)?F:[],minutesData:Array.isArray($)?$:[],targetStaffId:h},setTimeout(()=>jn(document),0),setTimeout(()=>rn(),0),`
        <div class="dashboard-grid dashboard-modern dashboard-staff-view">
            ${Es}
            ${Ps}
            ${en}
            <div class="card full-width dashboard-hero-card">
                <div class="dashboard-hero-orb dashboard-hero-orb-top"></div>
                <div class="dashboard-hero-orb dashboard-hero-orb-bottom"></div>
                <div class="dashboard-hero-content">
                    <div class="dashboard-hero-row">
                        <div class="dashboard-hero-copy">
                            <h2 class="dashboard-hero-title">Welcome back, ${a.name.split(" ")[0]}!</h2>
                            <p class="dashboard-hero-date">${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
                            ${a.rating!==void 0?`<div class="dashboard-hero-chip-row"><div class="dashboard-hero-chip"><span class="dashboard-hero-chip-label">Your Rating:</span>${Us(a.rating,!0)}</div>${a.completionStats?`<div class="dashboard-hero-chip"><i class="fa-solid fa-check-circle dashboard-hero-chip-icon"></i><span>${(a.completionStats.completionRate*100).toFixed(0)}% Complete</span></div>`:""}</div>`:""}
                        </div>
                        <div class="dashboard-hero-aside">
                            ${e?`<div class="dashboard-viewing-box"><div class="dashboard-viewing-inner"><i class="fa-solid fa-users-viewfinder dashboard-viewing-icon"></i><div class="dashboard-viewing-meta"><div class="dashboard-viewing-head"><div class="dashboard-viewing-label">Viewing Summary For</div>${h!==a.id?'<span class="dashboard-viewing-state">STAFF VIEW ACTIVE</span>':""}</div><select onchange="window.app_changeSummaryStaff(this.value)" class="dashboard-viewing-select"><option value="${a.id}">My Own Summary</option><optgroup label="Staff Members">${(O||[]).filter(Y=>Y.id!==a.id).sort((Y,se)=>Y.name.localeCompare(se.name)).map(Y=>`<option value="${Y.id}" ${Y.id===h?"selected":""}>${Y.name}</option>`).join("")}</optgroup></select></div></div></div>`:""}
                            <div class="dashboard-hero-brand" aria-hidden="true">
                                <img src="crwi-logo.png" alt="CRWI logo" class="dashboard-hero-brand-logo">
                            </div>
                        </div>
                    </div>
                </div>
                <button class="${Zt.active?"dashboard-refresh-link is-update-pending":"dashboard-refresh-link"}" onclick="window.app_checkForSystemUpdate()" title="${Zt.active?"Update available. Click to refresh into the new version.":"Check for System Update"}">
                    ${Zt.active?"System update available":"Check for System Update"}
                </button>
            </div>
            <div class="dashboard-primary-row">
                <div class="card check-in-widget dashboard-primary-card dashboard-checkin-card">
                    <div class="dashboard-checkin-head">
                        <div class="dashboard-checkin-avatar-wrap">
                            <img src="${Ge(ae.avatar)}" alt="Profile" class="dashboard-checkin-avatar">
                            <div class="dashboard-checkin-status-dot" style="background: ${Be?"#10b981":"#94a3b8"};"></div>
                        </div>
                        <div class="dashboard-checkin-identity">
                            <h4 class="dashboard-checkin-name">${v(ae.name)}</h4>
                            <p class="text-muted dashboard-checkin-role">${v(ae.role)}</p>
                        </div>
                    </div>
                    <div class="dashboard-checkin-timer-wrap">
                        <div class="timer-display dashboard-checkin-timer" id="timer-display">${Xa}</div>
                        <div id="timer-label" class="dashboard-checkin-timer-label">Elapsed Time Today</div>
                    </div>
                    <div id="countdown-container" class="dashboard-checkin-countdown">
                        <div class="dashboard-checkin-countdown-meta"><span id="countdown-label">Time to checkout</span><span id="countdown-value" class="dashboard-checkin-countdown-value">--:--:--</span></div>
                        <div class="dashboard-checkin-countdown-bar"><div id="countdown-progress" class="dashboard-checkin-countdown-progress"></div></div>
                    </div>
                    <div id="overtime-container" class="dashboard-checkin-overtime">
                        <div class="dashboard-checkin-overtime-label">OVERTIME</div>
                        <div id="overtime-value" class="dashboard-checkin-overtime-value">00:00:00</div>
                    </div>
                    <div class="dashboard-checkin-action-row">
                        <button class="${Za} dashboard-checkin-btn" id="attendance-btn" ${Ae?"disabled":""} title="${Ae?"View only":""}">${Qa} <i class="fa-solid fa-fingerprint"></i></button>
                        ${Cs}
                    </div>
                    <div class="location-text dashboard-checkin-location" id="location-text"><i class="fa-solid fa-location-dot"></i><span>${Be&&ae.currentLocation?`Lat: ${Number(ae.currentLocation.lat).toFixed(4)}, Lng: ${Number(ae.currentLocation.lng).toFixed(4)}`:"Waiting for location..."}</span></div>
                </div>
                <div class="dashboard-primary-col ${Q?"":"dashboard-primary-col-highlight"}">${Nn(M,F,J,$)}</div>
                <div class="dashboard-primary-col">${Ns}</div>
            </div>
            ${Qt}
        </div>`}function Pa(a){const[e,t]=String(a||"").split("-"),n=Number(e),s=Number(t)-1;return!Number.isInteger(n)||!Number.isInteger(s)||s<0||s>11?a||"Current Month":new Date(n,s,1).toLocaleDateString("en-US",{month:"long",year:"numeric"})}function ii(a=8){const e=[],t=new Date;t.setDate(1);for(let n=0;n<a;n++){const s=new Date(t);s.setMonth(t.getMonth()-n);const i=s.toISOString().slice(0,7);e.push({key:i,label:Pa(i)})}return e}function oi(a){const e={completed:0,"in-process":1,"to-be-started":2,overdue:3,"not-completed":4},t=s=>window.AppCalendar?window.AppCalendar.getSmartTaskStatus(s.date,s.status||""):s.status||"to-be-started",n=new Map;return(a||[]).forEach(s=>{const i=(s._displayDesc||"").trim(),o=`${s.staffName||""}|${s.date||""}|${i}`,r=t(s),l={...s,_taskStatus:r,_taskGroup:r==="completed"?"completed":"incomplete"},d=n.get(o);if(!d){n.set(o,l);return}const c=e[d._taskStatus]??99;(e[l._taskStatus]??99)<c&&n.set(o,l)}),Array.from(n.values())}function ri(a,e){const t=[...a],n={completed:0,"in-process":1,overdue:2,"not-completed":3,"to-be-started":4};return t.sort((s,i)=>{const o=new Date(i.date)-new Date(s.date),r=String(s.staffName||"").toLowerCase().localeCompare(String(i.staffName||"").toLowerCase());return e==="date-asc"?new Date(s.date)-new Date(i.date)||r:e==="staff-asc"?r||o:e==="staff-desc"?-r||o:e==="completed-first"?s._taskGroup.localeCompare(i._taskGroup)||o:e==="incomplete-first"?i._taskGroup.localeCompare(s._taskGroup)||o:e==="status-priority"?(n[s._taskStatus]??99)-(n[i._taskStatus]??99)||o||r:o||r}),t}function di(a){if(!a)return;const e=We.controllers.get(a);e&&(e.intervalId&&clearInterval(e.intervalId),e.pauseTimeoutId&&clearTimeout(e.pauseTimeoutId),e.resumeTimeoutId&&clearTimeout(e.resumeTimeoutId),a.removeEventListener("mouseenter",e.onMouseEnter),a.removeEventListener("mouseleave",e.onMouseLeave),a.removeEventListener("touchstart",e.onTouchStart),a.removeEventListener("touchend",e.onTouchEnd),a.removeEventListener("touchcancel",e.onTouchCancel),We.controllers.delete(a),We.elements.delete(a))}function qn(){Array.from(We.elements).forEach(a=>di(a))}function zn(a){if(!a)return;qn();const e=1.2,t=35,n=1400,s=900,i=2,o=20;a.querySelectorAll(".dashboard-team-activity-col-list").forEach(l=>{const d={intervalId:null,pauseTimeoutId:null,resumeTimeoutId:null,direction:1,isPausedByUser:!1,isWaitingAtEdge:!1,lastScrollTop:0,stallTicks:0},c=(u,m)=>{d.isWaitingAtEdge=!0,d.pauseTimeoutId&&clearTimeout(d.pauseTimeoutId),d.pauseTimeoutId=setTimeout(()=>{d.direction=u,d.isWaitingAtEdge=!1,d.stallTicks=0},m)},p=()=>{if(d.isPausedByUser||d.isWaitingAtEdge||!l.isConnected)return;const u=Math.max(0,l.scrollHeight-l.clientHeight);if(u<=0){d.stallTicks=0,d.lastScrollTop=0;return}l.scrollTop+=e*d.direction;const m=l.scrollTop>=u-i,h=l.scrollTop<=i;if(d.direction===1&&m){l.scrollTop=u,c(-1,n);return}if(d.direction===-1&&h){l.scrollTop=0,c(1,s);return}Math.abs(l.scrollTop-d.lastScrollTop)<.2?(d.stallTicks+=1,d.stallTicks>=o&&(d.direction*=-1,d.stallTicks=0)):d.stallTicks=0,d.lastScrollTop=l.scrollTop};d.onMouseEnter=()=>{d.isPausedByUser=!0},d.onMouseLeave=()=>{d.isPausedByUser=!1},d.onTouchStart=()=>{d.isPausedByUser=!0,d.resumeTimeoutId&&clearTimeout(d.resumeTimeoutId)},d.onTouchEnd=()=>{d.resumeTimeoutId&&clearTimeout(d.resumeTimeoutId),d.resumeTimeoutId=setTimeout(()=>{d.isPausedByUser=!1},400)},d.onTouchCancel=()=>{d.isPausedByUser=!1},l.addEventListener("mouseenter",d.onMouseEnter),l.addEventListener("mouseleave",d.onMouseLeave),l.addEventListener("touchstart",d.onTouchStart,{passive:!0}),l.addEventListener("touchend",d.onTouchEnd,{passive:!0}),l.addEventListener("touchcancel",d.onTouchCancel,{passive:!0}),d.intervalId=setInterval(p,t),We.controllers.set(l,d),We.elements.add(l)})}function li(a){if(!a)return;const e=Ke.controllers.get(a);e&&(e.intervalId&&clearInterval(e.intervalId),e.pauseTimeoutId&&clearTimeout(e.pauseTimeoutId),e.resumeTimeoutId&&clearTimeout(e.resumeTimeoutId),a.removeEventListener("mouseenter",e.onMouseEnter),a.removeEventListener("mouseleave",e.onMouseLeave),a.removeEventListener("touchstart",e.onTouchStart),a.removeEventListener("touchend",e.onTouchEnd),a.removeEventListener("touchcancel",e.onTouchCancel),Ke.controllers.delete(a),Ke.elements.delete(a))}function ci(){Array.from(Ke.elements).forEach(a=>li(a))}function jn(a=document){if(!a)return;ci();const e=1,t=38,n=1200,s=900,i=2,o=20;a.querySelectorAll(".dashboard-worklog-list").forEach(l=>{const d={intervalId:null,pauseTimeoutId:null,resumeTimeoutId:null,direction:1,isPausedByUser:!1,isWaitingAtEdge:!1,lastScrollTop:0,stallTicks:0},c=(u,m)=>{d.isWaitingAtEdge=!0,d.pauseTimeoutId&&clearTimeout(d.pauseTimeoutId),d.pauseTimeoutId=setTimeout(()=>{d.direction=u,d.isWaitingAtEdge=!1,d.stallTicks=0},m)},p=()=>{if(d.isPausedByUser||d.isWaitingAtEdge||!l.isConnected)return;const u=Math.max(0,l.scrollHeight-l.clientHeight);if(u<=0){d.stallTicks=0,d.lastScrollTop=0;return}l.scrollTop+=e*d.direction;const m=l.scrollTop>=u-i,h=l.scrollTop<=i;if(d.direction===1&&m){l.scrollTop=u,c(-1,n);return}if(d.direction===-1&&h){l.scrollTop=0,c(1,s);return}Math.abs(l.scrollTop-d.lastScrollTop)<.2?(d.stallTicks+=1,d.stallTicks>=o&&(d.direction*=-1,d.stallTicks=0)):d.stallTicks=0,d.lastScrollTop=l.scrollTop};d.onMouseEnter=()=>{d.isPausedByUser=!0},d.onMouseLeave=()=>{d.isPausedByUser=!1},d.onTouchStart=()=>{d.isPausedByUser=!0,d.resumeTimeoutId&&clearTimeout(d.resumeTimeoutId)},d.onTouchEnd=()=>{d.resumeTimeoutId&&clearTimeout(d.resumeTimeoutId),d.resumeTimeoutId=setTimeout(()=>{d.isPausedByUser=!1},350)},d.onTouchCancel=()=>{d.isPausedByUser=!1},l.addEventListener("mouseenter",d.onMouseEnter),l.addEventListener("mouseleave",d.onMouseLeave),l.addEventListener("touchstart",d.onTouchStart,{passive:!0}),l.addEventListener("touchend",d.onTouchEnd,{passive:!0}),l.addEventListener("touchcancel",d.onTouchCancel,{passive:!0}),d.intervalId=setInterval(p,t),Ke.controllers.set(l,d),Ke.elements.add(l)})}const Tt=async(a=!0,e={})=>{const t=Ve(),n=e.listId||"staff-activity-list",s=e.labelId||"staff-activity-range-label",i=document.getElementById(n),o=document.getElementById("staff-activity-list-modal");if(!i&&!o)return;qn(),a&&window.AppAnalytics&&(t.logs=await window.AppAnalytics.getAllStaffActivities({mode:"month",month:t.selectedMonth,scope:"all",sideEffects:!1}));const r=Ma(t.logs,t.sortKey);i&&(i.innerHTML=r,zn(i)),o&&(o.innerHTML=r);const l=document.getElementById(s)||document.getElementById("staff-activity-range-label");l&&(l.textContent=Pa(t.selectedMonth))};typeof window<"u"&&(window.__dashboardMaxEscHandlerBound||(document.addEventListener("keydown",a=>{a.key==="Escape"&&document.body.classList.contains("dashboard-max-open")&&window.app_closeDashboardCardMaximize?.()}),window.__dashboardMaxEscHandlerBound=!0),window.app_closeDashboardCardFullscreen=rt,window.app_closeDashboardCardMaximize=rt,window.app_toggleDashboardCardMode=(a,e=ye,t=null)=>{if(!a)return;const n=Ln.has(e)?e:ye;if(n===ue&&zs.has(String(a||"").trim())&&typeof window.app_openDashboardSection=="function"){window.app_openDashboardSection(String(a||"").trim());return}const s=Ia(a);if(String(s?.dataset?.dashboardCardMode||ye)===n&&n!==ye){ta(a,ye,t||null);return}if(n===ue&&window._dashboardMaxCardId===a){rt(),ta(a,ye);return}ta(a,n,t||null),n===ue&&String(a||"").trim()==="hero-week"&&setTimeout(()=>{window.app_refreshHeroAuditLive?.()},0)},window.app_toggleDashboardCardMaximize=(a,e=null)=>{window.app_toggleDashboardCardMode?.(a,ue,e||null)},window.app_editDashboardActivity=async function(a,e,t,n,s){const i=String(a||"").trim();if(i==="minute"){window.app_openMinuteDetails?window.app_openMinuteDetails(String(s||"")):window.location.hash="minutes";return}if(i==="attendance"){const o=String(e||"").trim();if(!o||o==="active_now")return;let r="";try{const d=await window.AppDB.get("attendance",o);r=String(d?.workDescription||"")}catch{r=""}let l=null;if(window.appPrompt?l=await window.appPrompt("Update Work Summary:",r,{title:"Update Work Summary",confirmText:"Save"}):l=window.prompt("Update Work Summary:",r),l===null)return;await window.AppAttendance.updateLog(o,{workDescription:String(l)}),window.app_refreshDashboard&&await window.app_refreshDashboard();return}window.app_openDayPlan&&window.app_openDayPlan(String(t||""),String(n||""))},window.app_filterActivity=async function(a="act-start",e="act-end",t="activity-list"){const n=document.getElementById(a)?.value,s=document.getElementById(e)?.value,i=document.getElementById(t),o=window.app_dashboardWorklogContext||{};!n||!s||!i||(i.innerHTML=zt(Array.isArray(o.logs)?o.logs:[],n,s,o.targetStaffId||window.AppAuth?.getUser?.()?.id||"",Array.isArray(o.collaborations)?o.collaborations:[],Array.isArray(o.minutesData)?o.minutesData:[]),jn(document))},window.app_setStaffActivityMonth=async function(a,e="staff-activity-list",t="staff-activity-range-label"){const n=Ve(),s=String(a||"").trim();/^\d{4}-\d{2}$/.test(s)&&(n.selectedMonth=s,await Tt(!0,{listId:e,labelId:t}))},window.app_setStaffActivitySort=async function(a,e="staff-activity-list",t="staff-activity-range-label"){const n=Ve(),s=String(a||"").trim()||"date-newest";n.sortKey=s,await Tt(!1,{listId:e,labelId:t})},window.app_setDashboardLeaveHistoryDate=async function(a){const e=Ve();e.leaveHistoryDate=a||new Date().toISOString().slice(0,10);const t=document.getElementById("page-content");window.app_closeDashboardCardFullscreen?.(),t&&(t.innerHTML=await Ea())},window.app_expandTeamActivity=function(){const a=document.querySelector(".dashboard-staff-view .dashboard-team-activity-card");window.app_toggleDashboardCardMode?.("team-activity",ue,a||null)},window.app_openStatsDetailModal=function(a){const e=String(a||"").trim()==="yearly"?"yearly":"monthly",t=document.querySelector(`.dashboard-staff-view .dashboard-stats-card[data-stats-type="${e}"]`);window.app_toggleDashboardCardMode?.(`stats-${e}`,ue,t||null)},window.app_closeStatsDetailModal=function(){window.app_closeDashboardCardFullscreen?.()},window.app_updateStatsDetailView=function(){},window.app_attachStatsCardHandlers=function(){ti(),Fn()},window.app_openHeroTaskList=function(a,e){const t=window.app_dashboardHeroLeaderboard,s=(Array.isArray(t?.rows)?t.rows:[]).find(o=>String(o?.user?.id||"")===String(a||""));if(!s)return;let i=document.getElementById("hero-task-modal-overlay");i||(i=document.createElement("div"),i.id="hero-task-modal-overlay",i.className="modal-overlay hero-task-modal-overlay",i.addEventListener("click",o=>{o.target===i&&window.app_closeHeroTaskList?.()}),document.body.appendChild(i)),window.app_heroTaskModalState={userId:String(a||""),bucketKey:String(e||"")},i.innerHTML=`<div class="modal-content hero-task-modal-shell">${Zs(s,String(e||""))}</div>`,i.style.display="flex"},window.app_refreshHeroAuditLive=async function({reopenTaskList:a=!1}={}){try{const[e,t]=await Promise.all([window.AppAnalytics.getHeroOfTheWeek({source:"live_audit"}),window.AppAnalytics.getHeroLeaderboard({source:"live_audit"})]);e&&e.state!=="fetch_error"&&(window.app_dashboardHeroData=e),t&&t.state!=="fetch_error"&&(window.app_dashboardHeroLeaderboard=t),window.app_dashboardHeroMeta={...window.app_dashboardHeroMeta||{},generatedAt:Date.now(),source:"live_audit"},sn(),a&&window.app_heroTaskModalState?.userId&&window.app_heroTaskModalState?.bucketKey&&window.app_openHeroTaskList(window.app_heroTaskModalState.userId,window.app_heroTaskModalState.bucketKey)}catch(e){console.warn("Failed to refresh live hero audit:",e)}},window.app_closeHeroTaskList=function(){const a=document.getElementById("hero-task-modal-overlay");a&&a.remove(),window.app_heroTaskModalState=null},window.app_refreshHeroTaskList=async function(a,e){window.app_heroTaskModalState={userId:String(a||""),bucketKey:String(e||"")},await window.app_refreshHeroAuditLive({reopenTaskList:!0})},window.app_applyHeroTaskOptimisticUpdate=function(a,e,t,n,s){const i=window.app_dashboardHeroLeaderboard,o=Array.isArray(i?.rows)?i.rows:null;if(!o)return;const r=o.find(m=>String(m?.user?.id||"")===String(a||""));if(!r||!r.taskBuckets||!r.stats)return;const l=String(e||""),d=r.taskBuckets,c=Array.isArray(d[l])?d[l]:[],p=c.findIndex(m=>String(m?.planId||"")===String(t||"")&&Number(m?.taskIndex)===Number(n));if(p<0)return;const[u]=c.splice(p,1);if(r.stats.taskPlanned=Math.max(0,Number(r.stats.taskPlanned||0)-(s==="delete"?1:0)),l==="completed"&&(r.stats.taskCompleted=Math.max(0,Number(r.stats.taskCompleted||0)-1)),l==="in_progress"&&(r.stats.taskInProgress=Math.max(0,Number(r.stats.taskInProgress||0)-1)),l==="postponed"&&(r.stats.taskPostponed=Math.max(0,Number(r.stats.taskPostponed||0)-1)),l==="missed"&&(r.stats.taskMissed=Math.max(0,Number(r.stats.taskMissed||0)-1)),s==="complete"){const m={...u,status:"completed",rawStatus:"completed",completedDate:new Date().toISOString().split("T")[0]};d.completed=Array.isArray(d.completed)?d.completed:[],d.completed.unshift(m),r.stats.taskCompleted=Number(r.stats.taskCompleted||0)+1}else if(s==="postpone"){const m={...u,status:"postponed",rawStatus:"postponed"};d.postponed=Array.isArray(d.postponed)?d.postponed:[],d.postponed.unshift(m),r.stats.taskPostponed=Number(r.stats.taskPostponed||0)+1}sn()},window.app_scheduleHeroAuditRefresh=function(a,e){setTimeout(()=>{window.app_refreshHeroTaskList(a,e).catch(t=>{console.warn("Delayed hero audit refresh failed:",t)})},150)},window.app_completeHeroTaskAction=async function(a,e,t,n){window.app_applyHeroTaskOptimisticUpdate(t,n,a,e,"complete"),await window.app_markTaskCompleted(a,e),window.app_heroTaskModalState={userId:String(t||""),bucketKey:String(n||"")},window.app_openHeroTaskList?.(t,n),window.app_scheduleHeroAuditRefresh(t,n)},window.app_postponeHeroTaskAction=async function(a,e,t,n){const s="postpone-task-modal";document.getElementById(s)?.remove();const i=new Date(Date.now()+864e5).toISOString().split("T")[0],o=`
            <div class="modal-overlay" id="${s}" style="display:flex;">
                <div class="modal-content" style="max-width:420px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                        <h3 style="margin:0; font-size:1.05rem;">Postpone Task</h3>
                        <button type="button" onclick="document.getElementById('${s}')?.remove()" style="background:none; border:none; font-size:1.1rem; cursor:pointer;">&times;</button>
                    </div>
                    <label for="hero-postpone-date-input" style="display:block; margin-bottom:0.35rem; font-size:0.85rem; color:#475569; font-weight:600;">Select date</label>
                    <input id="hero-postpone-date-input" type="date" value="${i}" style="width:100%; padding:0.6rem; border:1px solid #d1d5db; border-radius:8px;">
                    <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
                        <button type="button" class="action-btn secondary" onclick="document.getElementById('${s}')?.remove()" style="padding:0.55rem 0.9rem;">Cancel</button>
                        <button type="button" class="action-btn" onclick="window.app_confirmHeroPostponeTask('${we(String(a||""))}', ${Number(e)}, '${we(String(t||""))}', '${we(String(n||""))}')" style="padding:0.55rem 0.9rem;">Confirm</button>
                    </div>
                </div>
            </div>`;window.app_showModal(o,s)},window.app_confirmHeroPostponeTask=async function(a,e,t,n){const s=document.getElementById("hero-postpone-date-input")?.value;if(!s){alert("Please select a date.");return}document.getElementById("postpone-task-modal")?.remove(),window.app_applyHeroTaskOptimisticUpdate(t,n,a,e,"postpone"),window.app_heroTaskModalState={userId:String(t||""),bucketKey:String(n||"")},window.app_openHeroTaskList?.(t,n),await window.app_postponeTask(a,e,s),window.app_scheduleHeroAuditRefresh(t,n)},window.app_deleteHeroTaskAction=async function(a,e,t,n){window.AppCalendar?.removeTask&&await window.appConfirm("Delete this plan from the hero audit list?")&&(window.app_applyHeroTaskOptimisticUpdate(t,n,a,e,"delete"),window.app_openHeroTaskList?.(t,n),await window.AppCalendar.removeTask(a,e),window.app_scheduleHeroAuditRefresh(t,n))},window.app_editHeroTaskAction=async function(a,e){window.app_closeHeroTaskList?.(),window.app_closeDashboardCardFullscreen?.();const t=String(a||"").trim(),n=String(e||"").trim();setTimeout(async()=>{try{window.AppDayPlan?.openDayPlan?await window.AppDayPlan.openDayPlan(t,n):window.app_openDayPlan&&await window.app_openDayPlan(t,n);const s=document.getElementById("day-plan-modal");if(s){const o=Array.from(document.querySelectorAll(".dashboard-max-overlay, .dashboard-max-window, .hero-task-modal-overlay, .hero-task-modal-shell")).filter(r=>r&&r!==s).reduce((r,l)=>{const d=Number.parseInt(window.getComputedStyle(l).zIndex,10);return Number.isFinite(d)?Math.max(r,d):r},1400);s.style.zIndex=String(o+20)}}catch(s){console.error("Failed to open day plan from hero audit:",s),alert(`Unable to open plan editor: ${s.message||s}`)}},80)},window.app_expandTeamActivityRefresh=async function(){await Tt(!1,{listId:"staff-activity-list-max",labelId:"staff-activity-range-label-max"})},window.app_closeTeamActivityExpanded=function(){const a=document.getElementById("team-activity-modal-overlay");a&&(a.remove(),document.body.style.overflow="",window.removeEventListener("keydown",window._teamActivityEscHandler))});async function Yn(){const a=window.AppAuth.getUser(),e=window.AppDB.getCached?await window.AppDB.getCached(window.AppDB.getCacheKey("staffUsers","users",{}),N?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):await window.AppDB.getAll("users"),t=window.app_getMyMessages?await window.app_getMyMessages():await window.AppDB.getAll("staff_messages"),n=e.filter(m=>m.id!==a.id).sort((m,h)=>m.name.localeCompare(h.name));!window.app_staffThreadId&&n.length>0&&(window.app_staffThreadId=n[0].id);const s=e.find(m=>m.id===window.app_staffThreadId),i=m=>v(m).replace(/(https?:\/\/[^\s]+)/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'),o=t.filter(m=>m.fromId===a.id&&m.toId===window.app_staffThreadId||m.fromId===window.app_staffThreadId&&m.toId===a.id).sort((m,h)=>new Date(m.createdAt||0)-new Date(h.createdAt||0)),r=o.filter(m=>m.type==="text"),l=o.filter(m=>m.type==="task"),d={};t.forEach(m=>{m.toId===a.id&&!m.read&&(d[m.fromId]=(d[m.fromId]||0)+1)});const c=n.map(m=>{const h=d[m.id]||0;return`
            <button class="staff-directory-item ${m.id===window.app_staffThreadId?"active":""}" onclick="window.app_openStaffThread('${m.id}')">
                <div class="staff-directory-avatar">
                    <img src="${m.avatar}" alt="${v(m.name)}">
                </div>
                <div class="staff-directory-info">
                    <div class="staff-directory-name">${v(m.name)}</div>
                    <div class="staff-directory-role">${v(m.role||"Staff")}</div>
                </div>
                ${h?`<span class="staff-directory-badge">${h}</span>`:""}
            </button>
        `}).join(""),p=s?r.length?r.map(m=>`
        <div class="staff-message ${m.fromId===a.id?"outgoing":"incoming"}">
            <div class="staff-message-meta">${v(m.fromName)} • ${new Date(m.createdAt).toLocaleString()}</div>
            <div class="staff-message-body">${i(m.message||"")}</div>
            ${m.link?`<div class="staff-message-link"><a href="${m.link}" target="_blank" rel="noopener noreferrer">${m.link}</a></div>`:""}
        </div>
    `).join(""):'<div class="staff-message-empty">No messages yet.</div>':'<div class="staff-message-empty">Select a staff member to view messages.</div>',u=s?l.length?l.map(m=>`
        <div class="staff-task-card">
            <div class="staff-task-head">
                <div>
                    <div class="staff-task-title">${v(m.title||"Task")}</div>
                    <div class="staff-task-meta">From ${v(m.fromName)} • Due ${m.dueDate||"No date"}</div>
                </div>
                <span class="staff-task-status ${m.status||"pending"}">${(m.status||"pending").toUpperCase()}</span>
            </div>
            <div class="staff-task-desc">${v(m.description||"")}</div>
            ${m.status==="pending"&&m.toId===a.id?`
                <div class="staff-task-actions">
                    <button onclick="window.app_respondStaffTask('${m.id}', 'approved')" class="staff-task-btn approve">Approve</button>
                    <button onclick="window.app_respondStaffTask('${m.id}', 'rejected')" class="staff-task-btn reject">Reject</button>
                </div>
            `:""}
            ${m.rejectReason?`<div class="staff-task-reason">Reason: ${v(m.rejectReason)}</div>`:""}
        </div>
    `).join(""):'<div class="staff-message-empty">No tasks yet.</div>':'<div class="staff-message-empty">Select a staff member to view tasks.</div>';return`
        <div class="staff-directory-page">
            <aside class="staff-directory-panel">
                <div class="staff-directory-panel-head">
                    <h3>Staff Directory</h3>
                    <span>Messages & tasks</span>
                </div>
                <div class="staff-directory-list">
                    ${c||'<div class="staff-message-empty">No staff found.</div>'}
                </div>
            </aside>
            <section class="staff-thread-panel">
                <div class="staff-thread-head">
                    <div>
                        <h3>${s?v(s.name):"Select a staff member"}</h3>
                        <span>${s?v(s.role||"Staff"):""}</span>
                    </div>
                    <div class="staff-thread-actions">
                        <button class="staff-thread-action-btn" ${s?"":"disabled"} onclick="window.app_openStaffMessageModal('${s?s.id:""}', '${s?v(s.name):""}')">
                            <i class="fa-solid fa-message"></i> Send Message
                        </button>
                        <button class="staff-thread-action-btn secondary" ${s?"":"disabled"} onclick="window.app_openStaffTaskModal('${s?s.id:""}', '${s?v(s.name):""}')">
                            <i class="fa-solid fa-list-check"></i> Send Task
                        </button>
                    </div>
                </div>
                <div class="staff-thread-columns">
                    <div class="staff-thread-column">
                        <div class="staff-thread-column-head">Text Messages</div>
                        <div class="staff-thread-history">
                            ${p}
                        </div>
                    </div>
                    <div class="staff-thread-column">
                        <div class="staff-thread-column-head">Tasks</div>
                        <div class="staff-thread-history">
                            ${u}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `}let cn=!1;function pi(){cn||typeof document>"u"||(cn=!0,document.addEventListener("click",a=>{const e=a.target.closest("[data-annual-open-day]");if(e){window.app_openAnnualDayPlan?.(e.dataset.annualOpenDay);return}const t=a.target.closest("[data-annual-view]");if(t){window.app_toggleAnnualView?.(t.dataset.annualView);return}if(a.target.closest("[data-annual-jump-today]")){window.app_jumpToAnnualToday?.();return}const s=a.target.closest("[data-annual-year-delta]");if(s){window.app_changeAnnualYear?.(Number(s.dataset.annualYearDelta||0));return}const i=a.target.closest("[data-annual-legend]");if(i){window.app_toggleAnnualLegendFilter?.(i.dataset.annualLegend);return}a.target.closest("[data-annual-export]")&&window.AppReports?.exportAnnualListViewCSV?.(window._annualListItems||[])}),document.addEventListener("input",a=>{const e=a.target.closest("[data-annual-staff-filter]");e&&window.app_setAnnualStaffFilter?.(e.value)}),document.addEventListener("change",a=>{const e=a.target.closest("[data-annual-list-sort]");e&&window.app_setAnnualListSort?.(e.value)}),document.addEventListener("keydown",a=>{const e=a.target.closest("[data-annual-list-search]");e&&a.key==="Enter"&&window.app_setAnnualListSearch?.(e.value)}),document.addEventListener("mouseover",a=>{const e=a.target.closest("[data-annual-preview-date]");!e||e.contains(a.relatedTarget)||window.app_showAnnualHoverPreview?.(a,e.dataset.annualPreviewDate)}),document.addEventListener("mouseout",a=>{const e=a.target.closest("[data-annual-preview-date]");!e||e.contains(a.relatedTarget)||window.app_hideAnnualHoverPreview?.()}))}async function nt(){typeof window.app_setAnnualStaffFilter!="function"&&(window.app_setAnnualStaffFilter=async C=>{window.app_annualStaffFilter=String(C||"").trim();const B=document.getElementById("page-content");B&&(B.innerHTML=await nt())}),typeof window.app_toggleAnnualView!="function"&&(window.app_toggleAnnualView=async C=>{window.app_annualViewMode=C;const B=document.getElementById("page-content");B&&(B.innerHTML=await nt())}),typeof window.app_setAnnualListSearch!="function"&&(window.app_setAnnualListSearch=async C=>{window.app_annualListSearch=String(C||"").trim();const B=document.getElementById("page-content");B&&(B.innerHTML=await nt())}),typeof window.app_setAnnualListSort!="function"&&(window.app_setAnnualListSort=async C=>{window.app_annualListSort=String(C||"date-asc").trim();const B=document.getElementById("page-content");B&&(B.innerHTML=await nt())});const a=new Date,e=`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`,t=window.app_annualYear||a.getFullYear(),n=await window.AppCalendar.getPlans(),s=await window.AppDB.getAll("users").catch(()=>[]),i=`${t}-01-01`,o=`${t}-12-31`,r=await(window.AppDB.queryMany?window.AppDB.queryMany("attendance",[{field:"date",operator:">=",value:i},{field:"date",operator:"<=",value:o}]).catch(()=>window.AppDB.getAll("attendance")):window.AppDB.getAll("attendance")).catch(()=>[]);window._currentPlans=n;const l=["January","February","March","April","May","June","July","August","September","October","November","December"],d={};(s||[]).forEach(C=>{d[C.id]=C.name}),window._annualUserMap=d;const c=(C,B)=>d[C]||B||"Staff",p=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0,overdue:!0,completed:!0};window.app_annualLegendFilters=p;let u=window.app_selectedAnnualDate||(t===a.getFullYear()?e:null);u=u?String(u):null,u&&!u.startsWith(`${t}-`)&&(u=null),window.app_selectedAnnualDate=u;const m=String(window.app_annualStaffFilter||"").trim(),h=m.toLowerCase(),f=String(window.app_annualListSearch||"").trim(),g=f.toLowerCase(),S=String(window.app_annualListSort||"date-asc"),A=(s||[]).map(C=>`<option value="${v(C.name)}"></option>`).join(""),b=C=>h?String(C||"").toLowerCase().includes(h):!0,x={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11},D=(C="")=>{const B=String(C||"").trim();if(!B)return null;const O=B.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);if(!O)return null;const F=Number(O[1]),U=Number(O[2]),W=String(O[3]||"").toLowerCase(),$=Number(O[4]),I=x[W];if(!Number.isInteger(F)||!Number.isInteger(U)||!Number.isInteger(I)||!Number.isInteger($))return null;const H=new Date($,I,F),L=new Date($,I,U);if(Number.isNaN(H.getTime())||Number.isNaN(L.getTime()))return null;const z=`${H.getFullYear()}-${String(H.getMonth()+1).padStart(2,"0")}-${String(H.getDate()).padStart(2,"0")}`,q=`${L.getFullYear()}-${String(L.getMonth()+1).padStart(2,"0")}-${String(L.getDate()).padStart(2,"0")}`;return q<z?null:{startDate:z,endDate:q}},T=(C,B)=>{const O=!C?.startDate&&!C?.endDate?D(C?.task||""):null,F=C?.startDate||O?.startDate||B,U=C?.endDate||O?.endDate||C?.startDate||B;return{startDate:F,endDate:U}},_=(C,B,O)=>{const{startDate:F,endDate:U}=T(C,B);return!F||!U?B===O:!(O<F||O>U||C?.completedDate&&C.completedDate<O)},E=(n.workPlans||[]).filter(C=>{if((C.planScope||"personal")==="annual"){if(!h)return!0;const F=c(C.userId,C.userName);return b(F)?!0:(C.plans||[]).some(U=>{const W=c(U.assignedTo||C.userId,F),$=(U.tags||[]).map(I=>I.name||I).join(" ");return b(W)||b($)})}if(!h)return!0;const O=c(C.userId,C.userName);return b(O)?!0:(C.plans||[]).some(F=>{const U=c(F.assignedTo||C.userId,O),W=(F.tags||[]).map($=>$.name||$).join(" ");return b(U)||b(W)})}),M=(n.leaves||[]).filter(C=>b(c(C.userId,C.userName))),w=(r||[]).filter(C=>{if(!String(C.date||"").startsWith(String(t)))return!1;const O=C.user_id||C.userId,F=c(O,"");return h?b(F):!0}),y=(C,B,O)=>{const F=`${O}-${String(B+1).padStart(2,"0")}-${String(C).padStart(2,"0")}`,U=M.some(z=>F>=z.startDate&&F<=z.endDate),W=!h&&(n.events||[]).some(z=>z.date===F),$=w.some(z=>z.date===F),I=E.some(z=>!Array.isArray(z.plans)||!z.plans.length?z.date===F:z.plans.some(q=>_(q,z.date,F)))||$;let H="",L=!1;if(I){const z=E.filter(j=>!Array.isArray(j.plans)||!j.plans.length?j.date===F:j.plans.some(J=>_(J,j.date,F)));let q="to-be-started";z.forEach(j=>{(j.plans||[]).forEach(J=>{if(!_(J,j.date,F))return;const{startDate:Q,endDate:ae}=T(J,j.date);Q&&ae&&Q!==ae&&ae===F&&(L=!0);const Ae=J.completedDate||ae||j.date||F,pe=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(Ae,J.status):J.status||"pending";pe==="overdue"?q="overdue":pe==="in-process"&&q!=="overdue"?q="in-process":pe==="completed"&&q!=="overdue"&&q!=="in-process"&&(q="completed")})}),$&&q==="to-be-started"&&(q="completed"),H=q}return{hasLeave:U,hasEvent:W,hasWork:I,workStatus:H,hasRangeEnd:L}};let k="";for(let C=0;C<12;C++){const B=new Date(t,C,1).getDay(),O=new Date(t,C+1,0).getDate();let F="";for(let U=0;U<B;U++)F+='<div class="annual-day empty"></div>';for(let U=1;U<=O;U++){const W=y(U,C,t),$=U===a.getDate()&&C===a.getMonth()&&t===a.getFullYear(),I=`${t}-${String(C+1).padStart(2,"0")}-${String(U).padStart(2,"0")}`,H=W.hasLeave&&p.leave,L=W.hasEvent&&p.event,z=W.hasWork&&p.work&&(W.workStatus==="overdue"?p.overdue:W.workStatus==="completed"?p.completed:!0),q=H||L||z,j=z?`has-work work-${W.workStatus}`:"";F+=`
                <div class="annual-day ${$?"today":""} ${j} ${u===I?"selected":""} ${q?"":"annual-day-muted"}" data-annual-open-day="${I}" data-annual-preview-date="${I}">
                    ${U}
                    <div class="dot-container">
                        ${H?'<span class="status-dot dot-leave"></span>':""}
                        ${L?'<span class="status-dot dot-event"></span>':""}
                        ${z?'<span class="status-dot dot-work"></span>':""}
                        ${W.hasRangeEnd?'<span class="status-dot" title="Task ends today" style="background:#f97316;"></span>':""}
                    </div>
                </div>`}k+=`
            <div class="annual-month-card">
                <div class="annual-month-head">
                    <span class="annual-month-title">${l[C]}</span>
                    <span class="annual-month-year">${t}</span>
                </div>
                <div class="annual-cal-mini">
                    <div class="annual-weekday">S</div>
                    <div class="annual-weekday">M</div>
                    <div class="annual-weekday">T</div>
                    <div class="annual-weekday">W</div>
                    <div class="annual-weekday">T</div>
                    <div class="annual-weekday">F</div>
                    <div class="annual-weekday">S</div>
                    ${F}
                </div>
            </div>`}const P=window.app_annualViewMode||"grid",R=(()=>{const C=[],B=new Set,O=L=>{if(!L)return"";const z=String(L).replace(/_/g,"-").toLowerCase();return{"in-process":"In Process","to-be-started":"To Be Started","not-completed":"Not Completed",completed:"Completed",overdue:"Overdue",pending:"Pending",approved:"Approved",holiday:"Holiday",event:"Event"}[z]||z.replace(/\b\w/g,j=>j.toUpperCase())},F=(L,z)=>z||(window.AppCalendar&&L?window.AppCalendar.getSmartTaskStatus(L,z):"pending");if(!h&&window.AppAnalytics){const L=new Date(t,0,1),z=new Date(t,11,31);for(let q=new Date(L);q<=z;q.setDate(q.getDate()+1)){const j=q.toISOString().split("T")[0],J=window.AppAnalytics.getDayType(q);J==="Holiday"?C.push({date:j,type:"holiday",title:"Company Holiday (Weekend)",staffName:"All Staff",assignedBy:"System",assignedTo:"All Staff",selfAssigned:!1,dueDate:j,status:"holiday",comments:"",scope:"Shared"}):J==="Half Day"&&C.push({date:j,type:"event",title:"Half Working Day (Sat)",staffName:"All Staff",assignedBy:"System",assignedTo:"All Staff",selfAssigned:!1,dueDate:j,status:"event",comments:"",scope:"Shared"})}}M.forEach(L=>{const z=new Date(L.startDate),q=new Date(L.endDate||L.startDate),j=c(L.userId,L.userName);for(let J=new Date(z);J<=q;J.setDate(J.getDate()+1)){const Q=J.toISOString().split("T")[0];Q.startsWith(String(t))&&C.push({date:Q,type:"leave",title:`${j} (${L.type||"Leave"})`,staffName:j,assignedBy:j,assignedTo:j,selfAssigned:!0,dueDate:L.endDate||L.startDate||Q,status:(L.status||"approved").toLowerCase(),comments:L.reason||"",scope:"Personal"})}}),(n.events||[]).forEach(L=>{if(!h&&String(L.date||"").startsWith(String(t))){const z=[String(L.date||"").trim(),String(L.title||"").trim().toLowerCase(),String(L.type||"event").trim().toLowerCase(),String(L.createdById||L.createdByName||"").trim().toLowerCase()].join("|");if(B.has(z))return;B.add(z),C.push({date:L.date,type:L.type||"event",title:L.title||"Company Event",staffName:"All Staff",assignedBy:L.createdByName||"Admin",assignedTo:"All Staff",selfAssigned:!1,dueDate:L.date,status:"event",comments:L.description||"",scope:"Shared"})}}),E.forEach(L=>{if(String(L.date||"").startsWith(String(t))){const z=(L.planScope||"personal")==="annual",q=c(L.userId,L.userName)||(z?"All Staff":"Staff"),j=z?"Annual":"Personal",J=L.date;L.plans&&L.plans.length>0&&L.plans.forEach(Q=>{const ae=z?L.createdByName||Q.taggedByName||"Admin":Q.taggedByName||q,Ae=Q.assignedTo||L.userId,pe=z?ae:c(Ae,q),Gt=(Q.tags||[]).map(Ze=>Ze.name||Ze).filter(Boolean),{startDate:Jt,endDate:Qe}=T(Q,J),Me=Q.completedDate||Qe||J,Be=F(Me,Q.status),Xt=Q.subPlans&&Q.subPlans.length?Q.subPlans.join("; "):Q.comment||Q.notes||"";C.push({date:Jt||J,type:"work",title:Q.task||"Work Plan Task",staffName:z?ae:pe,assignedBy:ae,assignedTo:z?ae:pe,selfAssigned:ae===pe,dueDate:Q.dueDate||Qe||J,status:Be,comments:Xt,tags:Gt,scope:j})})}}),w.forEach(L=>{const z=L.user_id||L.userId,q=c(z,"Staff"),j=(L.workDescription||L.location||"").trim()||"Manual log entry";C.push({date:L.date,type:"work",title:j,staffName:q,assignedBy:q,assignedTo:q,selfAssigned:!0,dueDate:L.date,status:"completed",comments:j,tags:["Manual Log"],scope:"Personal"})});const U=[],W=new Set;C.forEach(L=>{const z=`${L.date||""}|${L.type||""}|${L.title||""}|${L.staffName||""}|${L.status||""}`.toLowerCase();W.has(z)||(W.add(z),U.push(L))}),U.sort((L,z)=>L.date.localeCompare(z.date)||L.type.localeCompare(z.type)),U.forEach(L=>{L.statusLabel=O(L.status),L.statusClass=String(L.status||"pending").replace(/[^a-z0-9]+/gi,"-").toLowerCase()});let $=g?U.filter(L=>[L.date,L.staffName,L.title,L.statusLabel,L.comments].join(" ").toLowerCase().includes(g)):U;const I={"date-asc":(L,z)=>String(L.date||"").localeCompare(String(z.date||"")),"date-desc":(L,z)=>String(z.date||"").localeCompare(String(L.date||"")),"staff-asc":(L,z)=>String(L.staffName||"").localeCompare(String(z.staffName||"")),"staff-desc":(L,z)=>String(z.staffName||"").localeCompare(String(L.staffName||"")),"status-asc":(L,z)=>String(L.statusLabel||"").localeCompare(String(z.statusLabel||"")),"status-desc":(L,z)=>String(z.statusLabel||"").localeCompare(String(L.statusLabel||""))},H=I[S]||I["date-asc"];return $.slice().sort(H)})();return window._annualListItems=R,setTimeout(()=>pi(),0),`
        <div class="annual-plan-shell annual-v2-shell">
            <div class="card annual-plan-header annual-v2-header">
                <div class="annual-plan-title-wrap annual-v2-title-wrap">
                    <h2 class="annual-plan-title annual-v2-title">NGO Annual Planning</h2>
                    <p class="annual-plan-subtitle annual-v2-subtitle">Overview of activities for ${t}.</p>
                </div>
                <div class="annual-plan-controls annual-v2-controls">
                    <div class="annual-staff-filter annual-v2-staff-filter">
                        <i class="fa-solid fa-user"></i>
                        <input type="text" list="annual-staff-names" value="${v(m)}" placeholder="Filter by staff name" data-annual-staff-filter="1">
                        <datalist id="annual-staff-names">${A}</datalist>
                    </div>
                    <div class="annual-view-toggle annual-v2-view-toggle">
                        <button data-annual-view="grid" class="annual-toggle-btn annual-v2-toggle-btn ${P==="grid"?"active":""}">
                            <i class="fa-solid fa-calendar-days"></i> Grid
                        </button>
                        <button data-annual-view="list" class="annual-toggle-btn annual-v2-toggle-btn ${P==="list"?"active":""}">
                            <i class="fa-solid fa-list"></i> List
                        </button>
                    </div>
                    <button data-annual-jump-today="1" class="annual-today-btn annual-v2-today-btn" title="Jump to today">
                        <i class="fa-solid fa-bullseye"></i> Today
                    </button>
                    <div class="annual-year-switch annual-v2-year-switch">
                        <button data-annual-year-delta="-1"><i class="fa-solid fa-chevron-left"></i></button>
                        <div class="annual-year-label">${t}</div>
                        <button data-annual-year-delta="1"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </div>
            </div>

            <div id="annual-grid-view" style="display:${P==="grid"?"block":"none"};">
                <div class="card annual-legend-bar annual-v2-legend-bar">
                    <button class="annual-legend-chip ${p.leave?"active":""}" data-annual-legend="leave"><span class="annual-dot leave"></span> Staff Leave</button>
                    <button class="annual-legend-chip ${p.event?"active":""}" data-annual-legend="event"><span class="annual-dot event"></span> Company Event</button>
                    <button class="annual-legend-chip ${p.work?"active":""}" data-annual-legend="work"><span class="annual-dot work"></span> Work Plan</button>
                    <button class="annual-legend-chip ${p.overdue?"active":""}" data-annual-legend="overdue">Overdue Border</button>
                    <button class="annual-legend-chip ${p.completed?"active":""}" data-annual-legend="completed">Completed Border</button>
                </div>
                <div class="annual-grid-layout annual-v2-grid-layout">
                    <div class="annual-plan-grid annual-v2-plan-grid">
                        ${k}
                    </div>
                </div>
            </div>

            <div id="annual-list-view" style="display:${P==="list"?"block":"none"};">
                <div class="card annual-list-card annual-v2-list-card">
                    <div class="annual-list-head annual-v2-list-head">
                        <h4>Annual Timeline</h4>
                        <div class="annual-list-actions annual-v2-list-actions">
                            <div class="annual-list-search-wrap annual-v2-search-wrap">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="text" value="${v(f)}" placeholder="Search list..." data-annual-list-search="1">
                            </div>
                            <select class="annual-v2-sort-select" data-annual-list-sort="1">
                                <option value="date-asc" ${S==="date-asc"?"selected":""}>Date: Oldest First</option>
                                <option value="date-desc" ${S==="date-desc"?"selected":""}>Date: Newest First</option>
                                <option value="staff-asc" ${S==="staff-asc"?"selected":""}>Staff: A-Z</option>
                                <option value="staff-desc" ${S==="staff-desc"?"selected":""}>Staff: Z-A</option>
                            </select>
                            <button class="annual-v2-export-btn" data-annual-export="1">
                                <i class="fa-solid fa-file-export"></i> Export Excel
                            </button>
                        </div>
                    </div>
                    ${R.length===0?'<div class="annual-list-empty">No items found.</div>':`
                        <div class="annual-list-table-wrap">
                            <div class="annual-list-table">
                                <div class="annual-list-header">
                                    <div>Date</div><div>Staff Name</div><div>Task</div><div>Assigned By</div><div>Status</div><div>Comments</div><div>Scope</div>
                                </div>
                                ${R.map(C=>`
                                    <div class="annual-list-row">
                                        <div class="annual-list-cell">${C.date}</div>
                                        <div class="annual-list-cell">${v(C.staffName)}</div>
                                        <div class="annual-list-cell annual-list-task">${v(C.title)}</div>
                                        <div class="annual-list-cell">${v(C.assignedBy)}</div>
                                        <div class="annual-list-cell"><span class="annual-list-status status-${C.statusClass}">${C.statusLabel}</span></div>
                                        <div class="annual-list-cell annual-list-comments">${v(C.comments||"--")}</div>
                                        <div class="annual-list-cell">${C.scope}</div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                    `}
                </div>
            </div>
        </div>`}let pn=!1;function ui(){pn||typeof document>"u"||(pn=!0,document.addEventListener("click",a=>{const e=a.target.closest("[data-timesheet-open-day]");if(e){window.app_openTimesheetDayDetail?.(e.dataset.timesheetOpenDay);return}if(a.target.closest("[data-timesheet-request-leave]")){const c=document.getElementById("leave-modal");c&&(c.style.display="flex");return}if(a.target.closest("[data-timesheet-manual-log]")){document.dispatchEvent(new CustomEvent("open-log-modal"));return}const s=a.target.closest("[data-timesheet-month-delta]");if(s){window.app_changeTimesheetMonth?.(Number(s.dataset.timesheetMonthDelta||0));return}if(a.target.closest("[data-timesheet-today]")){window.app_jumpTimesheetToday?.();return}const o=a.target.closest("[data-timesheet-export]");if(o){window.AppReports?.exportUserLogs?.(o.dataset.timesheetExportUser||"");return}const r=a.target.closest("[data-timesheet-edit-log]");if(r){window.app_editWorkSummary?.(r.dataset.timesheetEditLog);return}const l=a.target.closest("[data-timesheet-detail-log]");if(l){const c=l.dataset.timesheetDetailLog;alert("Detailed analysis for log "+c+" coming soon!");return}const d=a.target.closest("[data-timesheet-close-modal]");d&&d.closest(".modal-overlay")?.remove()}),document.addEventListener("change",a=>{const e=a.target.closest("[data-timesheet-view-select]");e&&window.app_toggleTimesheetViewSelect?.(e.value)}))}async function st(){setTimeout(()=>ui(),0),typeof window.app_setTimesheetView!="function"&&(window.app_setTimesheetView=async D=>{window.app_timesheetViewMode=D==="calendar"?"calendar":"list";const T=document.getElementById("page-content");T&&(T.innerHTML=await st())}),typeof window.app_changeTimesheetMonth!="function"&&(window.app_changeTimesheetMonth=async D=>{const T=new Date,_=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:T.getMonth(),E=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:T.getFullYear(),M=new Date(E,_,1);M.setMonth(M.getMonth()+D),window.app_timesheetMonth=M.getMonth(),window.app_timesheetYear=M.getFullYear();const w=document.getElementById("page-content");w&&(w.innerHTML=await st())}),typeof window.app_jumpTimesheetToday!="function"&&(window.app_jumpTimesheetToday=async()=>{const D=new Date;window.app_timesheetMonth=D.getMonth(),window.app_timesheetYear=D.getFullYear();const T=document.getElementById("page-content");T&&(T.innerHTML=await st())});const a=window.AppAuth.getUser(),e=await window.AppAttendance.getLogs(),t=await window.AppCalendar.getPlans().catch(()=>({workPlans:[]})),n=new Date,s=window.app_timesheetViewMode||"list",i=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:n.getMonth(),o=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:n.getFullYear(),r=new Date(o,i,1).toLocaleString("en-US",{month:"long",year:"numeric"}),l=`${o}-${String(i+1).padStart(2,"0")}-01`,d=`${o}-${String(i+1).padStart(2,"0")}-31`,c=e.filter(D=>D.date&&D.date>=l&&D.date<=d),p=(t.workPlans||[]).filter(D=>D.userId===a.id&&D.date&&D.date>=l&&D.date<=d),u={};c.forEach(D=>{u[D.date]||(u[D.date]=[]),u[D.date].push(D)});const m={};p.forEach(D=>{m[D.date]||(m[D.date]=[]),(Array.isArray(D.plans)?D.plans:[]).forEach(_=>{m[D.date].push(_.task||"Planned task")})}),window._timesheetLogsByDate=u,window._timesheetPlansByDate=m;let h=0,f=0;const g=new Set;c.forEach(D=>{D.durationMs&&(h+=D.durationMs/(1e3*60)),(D.lateCountable||window.AppAttendance&&window.AppAttendance.normalizeType(D.type)==="Late")&&f++,D.date&&g.add(D.date)});const S=`${Math.floor(h/60)}h ${Math.round(h%60)}m`,A=Math.floor(f/(N?.LATE_GRACE_COUNT||3))*(N?.LATE_DEDUCTION_PER_BLOCK||.5),b=D=>window.AppAttendance&&window.AppAttendance.normalizeType?window.AppAttendance.normalizeType(D):D;window.app_editWorkSummary=async D=>{const _=(await window.AppAttendance.getLogs()).find(w=>w.id===D),E=_?_.workDescription:"",M=await window.appPrompt("Update Work Summary:",E||"",{title:"Update Work Summary",confirmText:"Save"});if(M!==null){await window.AppAttendance.updateLog(D,{workDescription:M});const w=document.getElementById("page-content");w&&(w.innerHTML=await st())}},window.app_switchTimesheetPanel=(D,T)=>{const _=D==="calendar"?"calendar":"list";window.app_timesheetViewMode=_;const E=document.getElementById("timesheet-list-panel"),M=document.getElementById("timesheet-calendar-panel"),w=document.getElementById("timesheet-view-select");E&&(E.style.display=_==="list"?"block":"none"),M&&(M.style.display=_==="calendar"?"block":"none"),w&&(w.value=_);const y=T&&T.closest?T.closest(".timesheet-view-toggle"):null;(y?y.querySelectorAll(".annual-toggle-btn"):[]).forEach(P=>P.classList.remove("active")),T&&T.classList&&T.classList.add("active")},window.app_openTimesheetDayDetail=D=>{const T=window._timesheetLogsByDate&&window._timesheetLogsByDate[D]||[],_=window._timesheetPlansByDate&&window._timesheetPlansByDate[D]||[],E=T.length?T.map(k=>`
                <div class="timesheet-day-detail-item">
                    <div class="timesheet-day-detail-head">
                        <span>${v(k.checkIn||"--")} - ${v(k.checkOut||"--")}</span>
                        <span class="timesheet-day-status-chip">${v(b(k.type))}</span>
                    </div>
                    <div class="timesheet-day-detail-text">${v(k.workDescription||k.location||"No summary")}</div>
                    ${k.id&&k.id!=="active_now"?`<button type="button" class="action-btn secondary" data-timesheet-edit-log="${k.id}">Edit</button>`:""}
                </div>
            `).join(""):'<div class="timesheet-day-detail-empty">No attendance logs for this date.</div>',M=_.length?_.map(k=>`<div class="timesheet-day-plan-item">${v(k)}</div>`).join(""):'<div class="timesheet-day-detail-empty">No planned tasks for this date.</div>',w=`timesheet-day-detail-${Date.now()}`,y=`
            <div class="modal-overlay" id="${w}" style="display:flex;">
                <div class="modal-content" style="max-width:560px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <h3 style="margin:0;">${v(D)} Details</h3>
                        <button type="button" class="app-system-dialog-close" data-timesheet-close-modal="1">&times;</button>
                    </div>
                    <div style="display:grid; gap:0.9rem;">
                        <div>
                            <h4 style="margin:0 0 0.45rem 0; color:#334155;">Logged Work</h4>
                            ${E}
                        </div>
                        <div>
                            <h4 style="margin:0 0 0.45rem 0; color:#334155;">Planned Tasks</h4>
                            ${M}
                        </div>
                    </div>
                </div>
            </div>`;typeof window.app_showModal=="function"?window.app_showModal(y,w):(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",y)};const x=()=>{const D=new Date(o,i,1).getDay(),T=new Date(o,i+1,0).getDate();let _="";for(let E=0;E<D;E++)_+='<div class="timesheet-cal-day empty"></div>';for(let E=1;E<=T;E++){const M=`${o}-${String(i+1).padStart(2,"0")}-${String(E).padStart(2,"0")}`,w=u[M]||[],y=w.length?w.slice().sort((U,W)=>{const $=I=>{const H=b(I.type);return H==="Absent"?4:H==="Half Day"?3:H==="Late"?2:H==="Present (Late Waived)"?1:0};return $(W)-$(U)})[0]:null,k=m[M]||[],P=M===new Date().toISOString().split("T")[0],R=y?b(y.type):"",C=y?R==="Absent"?"absent":R==="Half Day"||R==="Late"?"late":"present":"none",B=y?R:"No log",O=w.map(U=>(U.workDescription||U.location||"").trim()).filter(Boolean),F=O.length?O.slice(0,2).map(U=>`<div class="timesheet-cal-plan">${v(U)}</div>`).join("")+(O.length>2?`<div class="timesheet-cal-more">+${O.length-2} more logs</div>`:""):k.length?k.slice(0,2).map(U=>`<div class="timesheet-cal-plan">${v(U)}</div>`).join("")+(k.length>2?`<div class="timesheet-cal-more">+${k.length-2} more</div>`:""):'<div class="timesheet-cal-empty">No plans</div>';_+=`
                <div class="timesheet-cal-day ${P?"today":""}" data-timesheet-open-day="${M}" style="cursor:pointer;">
                    <div class="timesheet-cal-day-head">
                        <span class="timesheet-cal-date">${E}</span>
                        <span class="timesheet-cal-attendance ${C}">${B}</span>
                    </div>
                    <div class="timesheet-cal-plans">${F}</div>
                </div>`}return`
            <div class="timesheet-calendar-wrap">
                <div class="timesheet-calendar-weekdays">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div class="timesheet-calendar-grid">${_}</div>
            </div>`};return`
        <div class="card full-width timesheet-modern">
            <div class="timesheet-modern-head">
                <div>
                    <h3>My Timesheet</h3>
                    <p>View and manage your attendance logs</p>
                </div>
                <div class="timesheet-modern-actions">
                    <button class="action-btn secondary timesheet-modern-btn-secondary" data-timesheet-request-leave="1">
                        <i class="fa-solid fa-calendar-xmark"></i> Request Leave
                    </button>
                    <button class="action-btn timesheet-modern-btn-primary" data-timesheet-manual-log="1">
                        <i class="fa-solid fa-plus"></i> Manual Log
                    </button>
                </div>
            </div>

            <div class="stat-grid timesheet-modern-stats">
                <div class="stat-card">
                    <div class="label">Total Hours</div>
                    <div class="value">${S}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Days Present</div>
                    <div class="value">${g.size} <span class="timesheet-stat-sub">Days</span></div>
                </div>
                <div class="stat-card">
                    <div class="label">Late Count</div>
                    <div class="value" style="color:${f>2?"var(--accent)":"var(--text-main)"}">${f}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Late Deduction</div>
                    <div class="value">${A.toFixed(1)} <span class="timesheet-stat-sub">Days</span></div>
                </div>
            </div>

            <div class="timesheet-modern-toolbar">
                <div class="timesheet-view-mode-wrap">
                    <label for="timesheet-view-select" class="timesheet-view-label">View</label>
                    <select id="timesheet-view-select" class="timesheet-view-select" data-timesheet-view-select="1">
                        <option value="list" ${s==="list"?"selected":""}>List View</option>
                        <option value="calendar" ${s==="calendar"?"selected":""}>Calendar View</option>
                    </select>
                </div>
                <div class="timesheet-month-switch">
                    <button type="button" data-timesheet-month-delta="-1"><i class="fa-solid fa-chevron-left"></i></button>
                    <div class="timesheet-month-label">${r}</div>
                    <button type="button" data-timesheet-month-delta="1"><i class="fa-solid fa-chevron-right"></i></button>
                    <button type="button" class="timesheet-today-btn" data-timesheet-today="1">Today</button>
                </div>
                <button class="timesheet-export-btn" data-timesheet-export-user="${a.id}" data-timesheet-export="1">
                    <i class="fa-solid fa-download"></i> Export CSV
                </button>
            </div>

            <div id="timesheet-list-panel" class="table-container mobile-table-card timesheet-modern-table-wrap" style="display:${s==="list"?"block":"none"};">
                <table class="compact-table timesheet-modern-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Timings</th>
                            <th>Status</th>
                            <th>Work Summary</th>
                            <th class="text-right">Detail</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${c.length?c.map(D=>`
                            <tr>
                                <td data-label="Date">
                                    <div class="timesheet-log-date">${D.date||"Active Session"}</div>
                                    <div class="timesheet-log-id">Log ID: ${D.id==="active_now"?"N/A":D.id.slice(-4)}</div>
                                </td>
                                <td data-label="Timings">
                                    <div class="time-badge">
                                        <span class="in"><i class="fa-solid fa-caret-right"></i> ${D.checkIn}</span>
                                        <span class="out"><i class="fa-solid fa-caret-left"></i> ${D.checkOut||"--:--"}</span>
                                    </div>
                                </td>
                                <td data-label="Status">
                                    <div class="timesheet-status-col">
                                        <span class="badge" style="background:${b(D.type)==="Absent"?"#fef2f2":b(D.type)==="Half Day"||b(D.type)==="Late"?"#fff7ed":"#f0fdf4"}; color:${b(D.type)==="Absent"?"#991b1b":b(D.type)==="Half Day"||b(D.type)==="Late"?"#c2410c":"#15803d"}; border:1px solid ${b(D.type)==="Absent"?"#fecaca":b(D.type)==="Half Day"||b(D.type)==="Late"?"#fed7aa":"#dcfce7"};">${b(D.type)}</span>
                                        <div class="timesheet-duration">${D.duration||"--"}</div>
                                    </div>
                                </td>
                                <td data-label="Work Summary" class="timesheet-summary-cell">
                                    <div class="timesheet-summary-wrap">
                                        <div class="dashboard-viewing-meta">
                                            <div class="timesheet-summary-text">${v(D.workDescription)||'<span class="timesheet-empty-summary">No summary provided</span>'}</div>
                                            ${D.location?`<div class="timesheet-location"><i class="fa-solid fa-location-dot"></i> ${v(D.location)}</div>`:""}
                                        </div>
                                        ${D.id!=="active_now"?`<button data-timesheet-edit-log="${D.id}" class="timesheet-edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>`:""}
                                    </div>
                                </td>
                                <td data-label="Detail" class="text-right">
                                    ${D.id!=="active_now"?`<button class="icon-btn timesheet-detail-btn" title="View Detailed Log" data-timesheet-detail-log="${D.id}"><i class="fa-solid fa-circle-info"></i></button>`:'<span class="timesheet-live">SESSION LIVE</span>'}
                                </td>
                            </tr>
                        `).join(""):'<tr><td colspan="5" class="timesheet-empty-row">No attendance records found for this period.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div id="timesheet-calendar-panel" style="display:${s==="calendar"?"block":"none"};">
                ${x()}
            </div>
        </div>
    `}async function Wn(){try{const a=window.AppAuth.getUser();if(!a)return'<div class="card">User state lost. Please <a href="#" onclick="window.AppAuth.logout()">Login Again</a></div>';const e=a.role==="Administrator"||a.isAdmin,t=e?await window.AppDB.getAll("users"):[],n=e&&window.app_profileTargetUserId?window.app_profileTargetUserId:a.id,s=e&&t.find(T=>T.id===n)||a,i=(T,_)=>{const E=String(T||"").trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(E))return"NA";const M=E.replace(/-/g,""),w=String(_||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase().slice(-3)||"USR";return`EMP-${M}-${w}`},o=typeof s.joinDate=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s.joinDate)?s.joinDate:"",r=o?s.employeeId||i(o,s.id):"NA",l=Number(s.birthDay||0),d=Number(s.birthMonth||0),c=Number(s.birthYear||0),p=[l?String(l).padStart(2,"0"):"--",d>=1&&d<=12?new Date(2026,d-1,1).toLocaleString("en-US",{month:"long"}):"--",c?String(c):""].filter(Boolean).join(" ").trim(),[u,m,h]=await Promise.all([window.AppAnalytics?window.AppAnalytics.getUserMonthlyStats(s.id):null,window.AppAnalytics?window.AppAnalytics.getUserYearlyStats(s.id):null,window.AppLeaves?window.AppLeaves.getUserLeaves(s.id):[]]);window.app_changeProfileStaff=async T=>{window.app_profileTargetUserId=T||a.id;const _=document.getElementById("page-content");_&&(_.innerHTML=await Wn())},window.app_confirmSignOut=()=>{confirm("Are you sure you want to sign out?")&&window.AppAuth.logout()};const f=s.id===a.id,g=u?.attendanceRate??"—",S=u?.punctualityRate??"—",A=u?.totalHours??"—",b=m?.totalDays??"—",x=T=>T==="Approved"?"#16a34a":T==="Rejected"?"#dc2626":"#d97706",D=(s.name||"U").split(" ").map(T=>T[0]).join("").slice(0,2).toUpperCase();return`
            <div class="pro-profile-root">

                <!-- ── Hero Banner ── -->
                <div class="pro-profile-hero">
                    <div class="pro-profile-hero-bg"></div>
                    <div class="pro-profile-hero-inner">
                        <!-- Avatar -->
                        <div class="pro-profile-avatar-ring">
                            ${s.avatar?`<img src="${v(s.avatar)}" alt="${v(s.name)}" class="pro-profile-avatar-img">`:`<div class="pro-profile-avatar-initials">${D}</div>`}
                            <span class="pro-profile-status-dot ${s.status==="in"?"online":"offline"}"
                                  title="${s.status==="in"?"Currently checked in":"Not checked in"}"></span>
                        </div>

                        <!-- Identity -->
                        <div class="pro-profile-identity">
                            <div class="pro-profile-name-row">
                                <h1 class="pro-profile-name">${v(s.name)}</h1>
                                <span class="pro-profile-role-badge">${v(s.role||"Staff")}</span>
                            </div>
                            <div class="pro-profile-email">
                                <i class="fa-solid fa-envelope"></i>
                                ${v(s.email||"—")}
                            </div>
                            <div class="pro-profile-meta-row">
                                <span class="pro-profile-chip">
                                    <i class="fa-solid fa-id-card"></i>${v(r)}
                                </span>
                                ${o?`<span class="pro-profile-chip">
                                    <i class="fa-solid fa-calendar-check"></i>Joined ${o}
                                </span>`:""}
                                ${s.department?`<span class="pro-profile-chip">
                                    <i class="fa-solid fa-building"></i>${v(s.department)}
                                </span>`:""}
                            </div>
                        </div>

                        <!-- Header Actions -->
                        <div class="pro-profile-header-actions">
                            ${e?`
                            <select class="pro-profile-staff-picker" onchange="window.app_changeProfileStaff(this.value)">
                                <option value="">My Profile</option>
                                ${t.map(T=>`<option value="${T.id}" ${T.id===n?"selected":""}>${v(T.name)}</option>`).join("")}
                            </select>`:""}
                            ${f?`
                            <button class="pro-profile-signout-btn" onclick="window.app_confirmSignOut()" title="Sign Out">
                                <i class="fa-solid fa-right-from-bracket"></i>
                                Sign Out
                            </button>`:""}
                        </div>
                    </div>
                </div>

                <!-- ── Stats Strip ── -->
                <div class="pro-profile-stats-strip">
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-circle-check pro-stat-icon" style="color:#6366f1;"></i>
                        <div class="pro-stat-value">${g}${typeof g=="number"?"%":""}</div>
                        <div class="pro-stat-label">Attendance</div>
                    </div>
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-clock pro-stat-icon" style="color:#f59e0b;"></i>
                        <div class="pro-stat-value">${S}${typeof S=="number"?"%":""}</div>
                        <div class="pro-stat-label">Punctuality</div>
                    </div>
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-hourglass-half pro-stat-icon" style="color:#10b981;"></i>
                        <div class="pro-stat-value">${A}${typeof A=="number"?"h":""}</div>
                        <div class="pro-stat-label">Hours (MTD)</div>
                    </div>
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-calendar-days pro-stat-icon" style="color:#8b5cf6;"></i>
                        <div class="pro-stat-value">${b}</div>
                        <div class="pro-stat-label">Days (YTD)</div>
                    </div>
                </div>

                <!-- ── Body Grid ── -->
                <div class="pro-profile-body">

                    <!-- Left: Leave History -->
                    <div class="pro-profile-main">
                        <div class="pro-card">
                            <div class="pro-card-head">
                                <span class="pro-card-title"><i class="fa-solid fa-umbrella-beach"></i> Leave History</span>
                                <span class="pro-card-sub">${h.length} record${h.length!==1?"s":""}</span>
                            </div>
                            ${h.length?`
                            <table class="pro-leave-table">
                                <thead>
                                    <tr>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Type</th>
                                        <th>Days</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${h.slice(0,8).map(T=>`
                                    <tr>
                                        <td>${v(T.startDate||"—")}</td>
                                        <td>${v(T.endDate||"—")}</td>
                                        <td>${v(T.type||"—")}</td>
                                        <td>${T.daysCount??"—"}</td>
                                        <td>
                                            <span class="pro-status-pill" style="background:${x(T.status)}18;color:${x(T.status)};">
                                                ${v(T.status||"Pending")}
                                            </span>
                                        </td>
                                    </tr>`).join("")}
                                </tbody>
                            </table>
                            ${h.length>8?`<div class="pro-table-footer">Showing 8 of ${h.length} records</div>`:""}
                            `:'<div class="pro-empty-state"><i class="fa-regular fa-folder-open"></i><p>No leave records found.</p></div>'}
                        </div>

                        <!-- Yearly Breakdown -->
                        ${m?.breakdown?`
                        <div class="pro-card" style="margin-top:1rem;">
                            <div class="pro-card-head">
                                <span class="pro-card-title"><i class="fa-solid fa-chart-bar"></i> Yearly Breakdown</span>
                                <span class="pro-card-sub">${m.label||""}</span>
                            </div>
                            <div class="pro-breakdown-grid">
                                ${Object.entries(m.breakdown||{}).filter(([,T])=>T>0).map(([T,_])=>`
                                <div class="pro-breakdown-chip">
                                    <span class="pro-breakdown-count">${_}</span>
                                    <span class="pro-breakdown-key">${v(T)}</span>
                                </div>`).join("")}
                            </div>
                        </div>`:""}
                    </div>

                    <!-- Right Sidebar -->
                    <aside class="pro-profile-side">

                        <!-- Employment -->
                        <div class="pro-card">
                            <div class="pro-card-head">
                                <span class="pro-card-title"><i class="fa-solid fa-briefcase"></i> Employment</span>
                            </div>
                            <div class="pro-detail-list">
                                ${[["Department",s.department||"Operations"],["Role",s.role||"Staff"],["Level",s.level||"—"],["Reports To",s.reportsTo||"Admin"],["Employee ID",r],["Join Date",o||"N/A"],["Birthday",p||"N/A"],["Payroll Cycle","Monthly (25th)"]].map(([T,_])=>`
                                <div class="pro-detail-row">
                                    <div class="pro-detail-label">${T}</div>
                                    <div class="pro-detail-value">${v(String(_))}</div>
                                </div>`).join("")}
                            </div>
                        </div>

                        <!-- Quick Actions -->
                        <div class="pro-card" style="margin-top:1rem;">
                            <div class="pro-card-head">
                                <span class="pro-card-title"><i class="fa-solid fa-bolt"></i> Quick Actions</span>
                            </div>
                            <div class="pro-quick-list">
                                <button class="pro-quick-item" onclick="window.location.hash='timesheet'">
                                    <span class="pro-quick-icon" style="background:#eef2ff;color:#4f46e5;"><i class="fa-solid fa-table-list"></i></span>
                                    <span>My Timesheet</span>
                                    <i class="fa-solid fa-chevron-right pro-quick-arrow"></i>
                                </button>
                                <button class="pro-quick-item" onclick="window.location.hash='leaves'">
                                    <span class="pro-quick-icon" style="background:#fef3c7;color:#d97706;"><i class="fa-solid fa-umbrella-beach"></i></span>
                                    <span>Apply Leave</span>
                                    <i class="fa-solid fa-chevron-right pro-quick-arrow"></i>
                                </button>
                                <button class="pro-quick-item" onclick="window.location.hash='analytics'">
                                    <span class="pro-quick-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fa-solid fa-chart-line"></i></span>
                                    <span>My Analytics</span>
                                    <i class="fa-solid fa-chevron-right pro-quick-arrow"></i>
                                </button>
                                ${f?`
                                <button class="pro-quick-item pro-quick-item-danger" onclick="window.app_confirmSignOut()">
                                    <span class="pro-quick-icon" style="background:#fef2f2;color:#dc2626;"><i class="fa-solid fa-right-from-bracket"></i></span>
                                    <span>Sign Out</span>
                                    <i class="fa-solid fa-chevron-right pro-quick-arrow"></i>
                                </button>`:""}
                            </div>
                        </div>

                    </aside>
                </div>
            </div>
        `}catch(a){return console.error("Profile Render Error:",a),`<div class="card error-card">Failed to load profile: ${v(a.message)}</div>`}}async function Kn(a=null,e=null){const t=window.AppAuth.getUser(),n=window.app_hasPerm("attendance","admin",t),s=await window.AppDB.getAll("users"),i=new Date,o=a!==null?parseInt(a):i.getMonth(),r=e!==null?parseInt(e):i.getFullYear(),l=`${r}-${String(o+1).padStart(2,"0")}-01`,d=`${r}-${String(o+1).padStart(2,"0")}-31`;let c=[];try{c=(await window.AppDB.query("attendance","date",">=",l)).filter(k=>k.date<=d)}catch(y){console.warn("MasterSheet: query failed, fetching all attendance logs",y),c=(await window.AppDB.getAll("attendance")).filter(P=>P.date>=l&&P.date<=d)}let p=[];try{window.AppDB.queryMany?p=await window.AppDB.queryMany("events",[{field:"date",operator:">=",value:l},{field:"date",operator:"<=",value:d}]):p=(await window.AppDB.getAll("events")||[]).filter(k=>{const P=String(k?.date||"").trim();return P>=l&&P<=d})}catch(y){console.warn("MasterSheet: events query failed, continuing without calendar holidays",y),p=[]}let u=[];try{if(window.AppPolicies?.getHolidaysForYear)u=await window.AppPolicies.getHolidaysForYear(r,!1);else{const y=await window.AppDB.get("settings","holidays").catch(()=>null);u=Array.isArray(y?.byYear?.[String(r)])?y.byYear[String(r)]:[]}}catch(y){console.warn("MasterSheet: holiday settings lookup failed, continuing without configured holidays",y),u=[]}const m=y=>{const k=String(y||"").trim();if(!k)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(k))return k;const P=new Date(k);return Number.isNaN(P.getTime())?"":`${P.getFullYear()}-${String(P.getMonth()+1).padStart(2,"0")}-${String(P.getDate()).padStart(2,"0")}`},h=y=>{const k=String(y?.type||"").trim().toLowerCase(),P=String(y?.title||"").trim().toLowerCase();return k.includes("holiday")||P.includes("holiday")},f=new Map;(p||[]).forEach(y=>{if(!h(y))return;const k=m(y?.date);if(!k||k<l||k>d)return;f.has(k)||f.set(k,[]);const P=String(y?.title||"").trim()||"Holiday";f.get(k).push(P)}),(u||[]).forEach(y=>{const k=m(y?.date);if(!k||k<l||k>d)return;f.has(k)||f.set(k,[]);const P=String(y?.name||y?.title||"Holiday").trim()||"Holiday";f.get(k).push(P)});const g=new Date(r,o+1,0).getDate(),S=Array.from({length:g},(y,k)=>k+1),A=["January","February","March","April","May","June","July","August","September","October","November","December"],b=y=>{const k=new Date(`${y}T00:00:00`),P=k.getDay();if(P===0)return"holiday";if(P===6){const R=Math.floor((k.getDate()-1)/7)+1;if(R===2||R===4)return"holiday";if(R===1||R===3||R===5)return"halfday"}return"working"},x=y=>String(y?.type||"").includes("Leave")||y?.location==="On Leave",D=y=>!y||!y.checkOut||y.checkOut==="Active Now"?!1:typeof y.activityScore<"u"||typeof y.locationMismatched<"u"||!!y.checkOutLocation||typeof y.outLat<"u"||typeof y.outLng<"u",T=y=>!y||!y.autoCheckout?"":String(y.missedCheckoutReasonStatus||"").toLowerCase()==="approved"||y.missedCheckoutApprovedAsFullDay?"Auto-closed due to missed checkout. Admin approved and converted this entry to full day.":String(y.missedCheckoutReasonStatus||"").toLowerCase()==="rejected"?"Auto-closed due to missed checkout. Admin rejected the submitted reason.":String(y.missedCheckoutReasonStatus||"").toLowerCase()==="approved"?"Auto-closed due to missed checkout. Admin approved the submitted reason.":"Auto-closed due to missed checkout.",_=y=>y?.isManualOverride?4:x(y)?3:D(y)?2:1,E=y=>{if(Object.prototype.hasOwnProperty.call(y||{},"attendanceEligible"))return y.attendanceEligible===!0;const k=String(y?.entrySource||"");return k==="staff_manual_work"?!1:k==="admin_override"||k==="checkin_checkout"||y?.isManualOverride||y?.location==="Office (Manual)"||y?.location==="Office (Override)"||typeof y?.activityScore<"u"||typeof y?.locationMismatched<"u"||typeof y?.autoCheckout<"u"||!!y?.checkOutLocation||typeof y?.outLat<"u"||typeof y?.outLng<"u"?!0:String(y?.type||"").includes("Leave")||y?.location==="On Leave"},M=new Date().toISOString().split("T")[0],w=y=>{const k=new Date(y);return`${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`};return window.app_refreshMasterSheet=async()=>{const y=document.getElementById("sheet-month")?.value,k=document.getElementById("sheet-year")?.value,P=document.getElementById("page-content");P&&(P.innerHTML=await Kn(y,k))},`
        <div class="dashboard-grid dashboard-modern dashboard-admin-view">
            <div class="card full-width">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                    <div>
                        <h2 style="font-size:1.1rem; margin-bottom:0.1rem;">Attendance Sheet</h2>
                        <p style="color:var(--text-muted); font-size:0.75rem;">Master grid view for all staff logs, including Work From Home (WFH).</p>
                    </div>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <select onchange="window.app_refreshMasterSheet()" id="sheet-month" style="padding:0.4rem; border-radius:6px; border:1px solid #ddd; font-size:0.8rem;">
                            ${A.map((y,k)=>`<option value="${k}" ${k===o?"selected":""}>${y}</option>`).join("")}
                        </select>
                        <select onchange="window.app_refreshMasterSheet()" id="sheet-year" style="padding:0.4rem; border-radius:6px; border:1px solid #ddd; font-size:0.8rem;">
                            <option value="${r}" selected>${r}</option>
                            <option value="${r-1}">${r-1}</option>
                        </select>
                        ${n?`
                        <button onclick="window.app_exportMasterSheet()" class="action-btn secondary" style="padding:0.4rem 0.75rem; font-size:0.8rem;">
                            <i class="fa-solid fa-file-excel"></i> Export Excel
                        </button>
                        `:""}
                    </div>
                </div>

                <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.65rem; font-size:0.72rem; color:#475569;">
                    <span style="padding:0.2rem 0.45rem; border:1px solid #e2e8f0; border-radius:999px; background:#f8fafc;"><strong>P</strong> = Present</span>
                    <span style="padding:0.2rem 0.45rem; border:1px solid #e2e8f0; border-radius:999px; background:#fff7ed;"><strong>L</strong> = Late</span>
                    <span style="padding:0.2rem 0.45rem; border:1px solid #e2e8f0; border-radius:999px; background:#fff7ed;"><strong>HD</strong> = Half Day</span>
                    <span style="padding:0.2rem 0.45rem; border:1px solid #e2e8f0; border-radius:999px; background:#fef2f2;"><strong>A</strong> = Absent</span>
                    <span style="padding:0.2rem 0.45rem; border:1px solid #e2e8f0; border-radius:999px; background:#f5f3ff;"><strong>C</strong> = Leave</span>
                    <span style="padding:0.2rem 0.45rem; border:1px solid #e2e8f0; border-radius:999px; background:#f0f9ff;"><strong>W</strong> = Work From Home</span>
                    <span style="padding:0.2rem 0.45rem; border:1px solid #e2e8f0; border-radius:999px; background:#eff6ff;"><strong>D</strong> = On Duty</span>
                    <span style="padding:0.2rem 0.45rem; border:1px solid #e2e8f0; border-radius:999px; background:#f8fafc;"><strong>H</strong> = Holiday</span>
                    <span style="padding:0.2rem 0.45rem; border:1px solid #e2e8f0; border-radius:999px; background:#f8fafc;"><strong>-</strong> = No Log / Future</span>
                    <span style="padding:0.2rem 0.45rem; border:1px solid #c7d2fe; border-radius:999px; background:#eef2ff; color:#4338ca;"><strong>•</strong> = Auto-closed entry</span>
                </div>

                <div class="table-container" style="max-height: 70vh; overflow: auto; border: 1px solid #eee; border-radius: 8px;">
                    <table style="font-size:0.85rem; border-collapse: separate; border-spacing: 0;">
                        <thead>
                            <tr style="position: sticky; top: 0; z-index: 10; background: #f8fafc;">
                                <th style="border-right: 1px solid #eee; padding:6px; position: sticky; left: 0; background: #f8fafc; z-index: 20; font-size:0.75rem;">S.No</th>
                                <th style="border-right: 2px solid #ddd; padding:6px; position: sticky; left: 35px; background: #f8fafc; z-index: 20; min-width: 120px; font-size:0.75rem;">Staff Name</th>
                                ${S.map(y=>`<th style="text-align:center; min-width: 28px; padding:4px; border-right: 1px solid #eee; font-size:0.75rem;">${y}</th>`).join("")}
                            </tr>
                        </thead>
                        <tbody>
                            ${s.sort((y,k)=>y.name.localeCompare(k.name)).map((y,k)=>`
                                <tr>
                                    <td style="text-align:center; border-right: 1px solid #eee; position: sticky; left: 0; background: #fff; z-index: 5; padding:4px; font-size:0.75rem;">${k+1}</td>
                                    <td style="border-right: 2px solid #ddd; position: sticky; left: 35px; background: #fff; z-index: 5; font-weight: 500; padding:4px;">
                                        <div style="display:flex; flex-direction:column;">
                                            <span style="font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px;">${v(y.name)}</span>
                                            <span style="font-size:0.65rem; color:#666; font-weight:400;">${v(y.dept||"General")}</span>
                                        </div>
                                    </td>
                                    ${S.map(P=>{const R=`${r}-${String(o+1).padStart(2,"0")}-${String(P).padStart(2,"0")}`,B=c.filter(L=>(L.userId===y.id||L.user_id===y.id)&&L.date===R).filter(E),O=b(R),F=f.get(R)||[],U=F.length>0;let W="-",$="",I="No log";if(B.length>0){const L=B.slice().sort((J,Q)=>_(Q)-_(J))[0],z=L.autoCheckout&&String(L.missedCheckoutReasonStatus||"").toLowerCase()==="approved"?"Present":L.type,q=window.AppAttendance&&window.AppAttendance.normalizeType?window.AppAttendance.normalizeType(z):z,j=T(L);W=q.charAt(0).toUpperCase(),I=`${L.checkIn} - ${L.checkOut||"Active"}
${q}`,j&&(I+=`
${j}`),q==="Present"?$="color: #10b981; font-weight: bold; font-size: 0.9rem;":q==="Late"?($="color: #f59e0b; font-weight: bold;",W="L"):q==="Half Day"?($="color: #c2410c; font-weight: bold;",W="HD"):q==="Absent"?($="color: #ef4444; font-weight: bold;",W="A"):q.includes("Leave")&&q.includes("Half Day")?($="color: #7c3aed; font-weight: bold;",W="HD"):q.includes("Leave")?($="color: #8b5cf6; font-weight: bold;",W="C"):q==="Work - Home"||/work\s*[- ]?\s*from\s*[- ]?\s*home|wfh/i.test(String(q||""))?($="color: #0ea5e9; font-weight: bold;",W="W"):q==="On Duty"&&($="color: #0369a1; font-weight: bold;",W="D"),L.isManualOverride&&($="color: #be185d; font-weight: bold; background: #fdf2f8;"),j&&(W=`<span style="display:inline-flex; align-items:flex-start; gap:2px;"><span>${W}</span><span style="color:#4338ca; font-size:0.7rem; line-height:1;">•</span></span>`)}else{const L=R===M&&y.status==="in"&&y.lastCheckIn&&w(y.lastCheckIn)===R,z=typeof y.joinDate=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(y.joinDate)?R<y.joinDate:!1,q=R>M;L?(W="P",$="color: #10b981; font-weight: bold; font-size: 0.9rem;",I="Checked in (pending checkout)"):q||z?(W="-",$="color: #94a3b8; font-weight: 600;",I=q?"Future date":`Before joining date (${y.joinDate})`):U||O==="holiday"?(W="H",$="color: #64748b; font-weight: 700;",I=U?`Holiday: ${Array.from(new Set(F)).join(", ")}`:"Holiday"):(W="A",$="color: #ef4444; font-weight: bold;",I="Absent")}return n||t&&(y.id===t.id||y.user_id===t.id||y.username&&t.username&&y.username===t.username||y.email&&t.email&&y.email===t.email)||(I=""),`<td style="text-align:center; ${n?"cursor:pointer;":""} border-right: 1px solid #eee; padding:2px; font-size:0.75rem; ${$}" ${I?`title="${I}"`:""} ${n?`onclick="window.app_openCellOverride('${y.id}', '${R}')"`:""}>${W}</td>`}).join("")}
                                </tr>`).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`}const wa="admin-card-max-overlay",ga="admin-card-max-title",Na="admin-card-max-body",be="tile",Vn="original",Pt="fullscreen",Gn=new Set([be,Vn,Pt]),mi=()=>{let a=document.getElementById(wa);return a||(a=document.createElement("div"),a.id=wa,a.className="admin-max-overlay",a.innerHTML=`
            <div class="admin-max-window" role="dialog" aria-modal="true" aria-labelledby="${ga}">
                <div class="admin-max-header">
                    <h2 id="${ga}"></h2>
                    <button type="button" class="admin-max-close" onclick="window.app_closeAdminCardMaximize?.()" aria-label="Close maximized card">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="${Na}" class="admin-max-body"></div>
            </div>
        `,a.addEventListener("click",e=>{e.target===a&&window.app_closeAdminCardMaximize?.()}),document.body.appendChild(a)),window.__adminMaxKeyHandlerBound||(document.addEventListener("keydown",e=>{e.key==="Escape"&&document.body.classList.contains("admin-max-open")&&window.app_closeAdminCardMaximize?.()}),window.__adminMaxKeyHandlerBound=!0),a},Jn=a=>{document?.body&&document.body.classList.toggle("admin-max-open",!!a)},dt=()=>{const a=window._adminMaxCardId?String(window._adminMaxCardId):"",e=document.getElementById(wa);e&&(e.classList.remove("open"),e.remove());const t=document.getElementById(Na);t&&(t.innerHTML=""),Jn(!1);const n=window._adminMaxTriggerEl;if(window._adminMaxTriggerEl=null,window._adminMaxCardId=null,a){const s=Ba(a);s&&(Xn(s,be),s.dataset.adminCardMode=be),window._adminCardModeState&&(window._adminCardModeState[a]=be)}if(n&&typeof n.focus=="function")try{n.focus()}catch{}},fi=(a,e=null)=>{dt();const n=(window._adminCardTemplates||{})[a];if(!n)return;const s=mi(),i=document.getElementById(ga),o=document.getElementById(Na);if(!i||!o)return;i.textContent=n.title||"Admin Card",o.innerHTML=`<div class="admin-max-card-content" data-admin-card-max="${v(a)}">${n.expandedHtml||n.originalHtml||n.tileHtml||""}</div>`,window._adminMaxTriggerEl=e,window._adminMaxCardId=a,Jn(!0),s.classList.add("open");const r=s.querySelector(".admin-max-close");if(r)try{r.focus()}catch{}},Ba=a=>a?document.querySelector(`.dashboard-admin-view .admin-card-compact[data-admin-card="${a}"]`):null,Xn=(a,e)=>{a&&(a.classList.remove("admin-card-mode-tile","admin-card-mode-original"),e===Vn?(a.classList.add("admin-card-mode-original"),a.dataset.adminOriginalFullWidth==="1"&&a.classList.add("full-width")):(a.classList.add("admin-card-mode-tile"),a.classList.remove("full-width")))},aa=(a,e,t=null)=>{if(!Gn.has(e))return;const n=document.querySelectorAll(".dashboard-admin-view .admin-card-compact[data-admin-card]");n.length&&(n.forEach(s=>{const o=s.getAttribute("data-admin-card")===String(a)?e:be;Xn(s,o),s.dataset.adminCardMode=o}),window._adminCardModeState=window._adminCardModeState||{},window._adminCardModeState[a]=e,window._adminActiveCardModeId=a,e===Pt?fi(a,t||Ba(a)):dt())},hi=a=>String(a||"").replace(/<div[^>]*class="[^"]*admin-card-mode-controls[^"]*"[^>]*>[\s\S]*?<\/div>/gi,"");typeof window<"u"&&(window.app_closeAdminCardFullscreen=dt,window.app_closeAdminCardMaximize=dt,window.app_toggleAdminCardMode=(a,e=be,t=null)=>{if(!a)return;const n=Gn.has(e)?e:be,s=Ba(a);if(String(s?.dataset?.adminCardMode||be)===n&&n!==be){aa(a,be,t||null);return}if(n===Pt&&window._adminMaxCardId===a){dt(),aa(a,be);return}aa(a,n,t||null)},window.app_toggleAdminCardMaximize=(a,e=null)=>{window.app_toggleAdminCardMode?.(a,Pt,e||null)});async function ba(a=null,e=null){let t=[],n=[],s=[],i=[],o=[],r=[],l=null,d={avgScore:0,trendData:[0,0,0,0,0,0,0],labels:[]},c=[],p=[];try{const $=new Date().toISOString().split("T")[0];a=a||$,e=e||$;const I=await Promise.allSettled([window.AppDB.getCached?window.AppDB.getCached(window.AppDB.getCacheKey("adminUsers","users",{}),N?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):window.AppDB.getAll("users"),window.AppAnalytics.getSystemPerformance(),window.AppDB.queryMany?window.AppDB.queryMany("location_audits",[],{orderBy:[{field:"timestamp",direction:"desc"}],limit:300}).catch(()=>window.AppDB.getAll("location_audits")):window.AppDB.getAll("location_audits"),window.AppLeaves.getAllLeaves?window.AppLeaves.getAllLeaves():window.AppDB.getAll("leaves"),window.AppLeaves.getPendingLeaves(),window.AppDB.queryMany?window.AppDB.queryMany("system_audit_logs",[],{orderBy:[{field:"createdAt",direction:"desc"}],limit:80}).catch(()=>window.AppDB.getAll("system_audit_logs")):window.AppDB.getAll("system_audit_logs")]),H=(q,j,J)=>{const Q=I[q];return Q&&Q.status==="fulfilled"?Q.value:(Q&&Q.status==="rejected"&&console.warn(`Admin data fetch failed for ${J}:`,Q.reason),j)};t=H(0,[],"users"),d=H(1,{avgScore:0,trendData:[0,0,0,0,0,0,0],labels:[]},"performance"),c=H(2,[],"location_audits"),n=H(3,[],"all_leaves"),s=H(4,[],"pending_leaves"),p=H(5,[],"system_audit_logs"),c=c.filter(q=>{const j=new Date(q.timestamp).toISOString().split("T")[0];return j>=a&&j<=e}).sort((q,j)=>j.timestamp-q.timestamp),p=(p||[]).filter(q=>q&&q.module==="simulation"&&String(q.type||"").startsWith("legacy_dummy_cleanup_")).sort((q,j)=>Number(j.createdAt||0)-Number(q.createdAt||0)).slice(0,25);const L=window.AppAuth?.getUser?.();l=L?t.find(q=>String(q.id)===String(L.id))||L:null,o=(Array.isArray(l?.notifications)?l.notifications:[]).filter(q=>q&&q.type==="missed-checkout-reason"&&String(q.status||"pending").toLowerCase()==="pending"&&q.logId),r=(Array.isArray(l?.notifications)?l.notifications:[]).filter(q=>q&&q.type==="missed-checkout-reason"&&["approved","rejected"].includes(String(q.status||"").toLowerCase())&&q.logId);const z=Array.from(new Set([...o,...r].map(q=>String(q.logId||"")).filter(Boolean)));i=z.length?window.AppDB.getManyByIds?await window.AppDB.getManyByIds("attendance",z):(await Promise.all(z.map(q=>window.AppDB.get("attendance",q)))).filter(Boolean):[]}catch($){console.error("Failed to fetch admin data",$)}const u=t.filter($=>$.status==="in").length,m=t.filter($=>$.role==="Administrator"||$.isAdmin===!0).length,h=t.filter($=>Number($.birthMonth||0)>=1&&Number($.birthDay||0)>=1).length,f=[...t].filter($=>Number($.birthMonth||0)>=1).sort(($,I)=>{const H=`${String(Number($.birthMonth||99)).padStart(2,"0")}-${String(Number($.birthDay||99)).padStart(2,"0")}-${String($.name||"").toLowerCase()}`,L=`${String(Number(I.birthMonth||99)).padStart(2,"0")}-${String(Number(I.birthDay||99)).padStart(2,"0")}-${String(I.name||"").toLowerCase()}`;return H.localeCompare(L)}).slice(0,5),g=new Map(t.map($=>[String($.id),$])),S=new Map((i||[]).filter(Boolean).map($=>[String($.id||""),$])),A=o.map($=>{const I=S.get(String($.logId||""))||null,H=String($.staffId||$.taggedById||I?.user_id||I?.userId||""),L=g.get(H);return{...I||{},staffName:$.staffName||L?.name||"Staff",staffRole:L?.role||"Employee",notificationId:$.id||"",user_id:I?.user_id||I?.userId||H,date:I?.date||$.missedCheckoutDate||$.date||"",missedCheckoutReason:I?.missedCheckoutReason||$.missedCheckoutReason||"",missedCheckoutReasonSubmittedAt:I?.missedCheckoutReasonSubmittedAt||$.missedCheckoutReasonSubmittedAt||$.date||"",missedCheckoutReasonStatus:String(I?.missedCheckoutReasonStatus||$.status||"pending").toLowerCase(),missedCheckoutReasonRequired:I?.missedCheckoutReasonRequired!==!1}}).filter($=>$&&$.notificationId&&$.missedCheckoutReasonRequired&&$.missedCheckoutReasonSubmittedAt&&String($.missedCheckoutReasonStatus||"").toLowerCase()==="pending").sort(($,I)=>new Date(I.missedCheckoutReasonSubmittedAt||I.systemClosedAt||I.date||0)-new Date($.missedCheckoutReasonSubmittedAt||$.systemClosedAt||$.date||0)),b=r.map($=>{const I=S.get(String($.logId||""))||null,H=String($.staffId||$.taggedById||I?.user_id||I?.userId||""),L=g.get(H);return{...I||{},staffName:$.staffName||L?.name||"Staff",staffRole:L?.role||"Employee",notificationId:$.id||"",date:I?.date||$.missedCheckoutDate||$.date||"",reviewStatus:String($.status||I?.missedCheckoutReasonStatus||"").trim()||"pending",reviewNote:String(I?.missedCheckoutReviewNote||$.reviewNote||"").trim(),reviewedAt:I?.missedCheckoutReviewedAt||$.respondedAt||$.date||""}}).sort(($,I)=>new Date(I.reviewedAt||I.date||0)-new Date($.reviewedAt||$.date||0)).slice(0,12),x=(n||[]).filter($=>["approved","rejected"].includes(String($?.status||"").toLowerCase())).sort(($,I)=>new Date(I.actionDate||I.appliedOn||0)-new Date($.actionDate||$.appliedOn||0)).slice(0,12),D=$=>{const I=$&&$.payload?$.payload:{},H=I.deleted||{},L=I.configuredTargets||{};if($.type==="legacy_dummy_cleanup_completed")return[`users=${Number(H.users||0)}`,`attendance=${Number(H.attendance||0)}`,`leaves=${Number(H.leaves||0)}`,`workPlans=${Number(H.workPlans||0)}`].join(", ");if($.type==="legacy_dummy_cleanup_skipped"){const z=I.reason||"unknown",q=Array.isArray(L.ids)?L.ids.length:0,j=Array.isArray(L.usernames)?L.usernames.length:0;return`reason=${z}, targetIds=${q}, targetUsernames=${j}`}return $.type==="legacy_dummy_cleanup_failed"?String(I.message||"Unknown error"):"-"},T=($=!1)=>{const I=$?"staff-reset-start-date-max":"staff-reset-start-date",H=$?"staff-reset-end-date-max":"staff-reset-end-date",L=`document.getElementById('${I}')?.value || ''`,z=`document.getElementById('${H}')?.value || ''`;return`
            <p class="text-muted">Create a full backup before running a staff activity reset.</p>
            <div class="admin-data-actions">
                <button class="action-btn secondary" onclick="(typeof window.app_backupStaffData === 'function') ? window.app_backupStaffData() : alert('Backup tools are not loaded yet. Please refresh this page.')">
                    <i class="fa-solid fa-download"></i> Backup Staff Data
                </button>
                <button class="action-btn secondary" onclick="(typeof window.app_backupStaffDataCSV === 'function') ? window.app_backupStaffDataCSV() : alert('Backup tools are not loaded yet. Please refresh this page.')">
                    <i class="fa-solid fa-file-csv"></i> Backup Staff Data (CSV)
                </button>
            </div>
            <div class="admin-data-range">
                <label>
                    <span>From Date</span>
                    <input type="date" id="${I}">
                </label>
                <label>
                    <span>To Date</span>
                    <input type="date" id="${H}">
                </label>
                <button class="action-btn danger" onclick="(typeof window.app_resetStaffData === 'function') ? window.app_resetStaffData({ startDate: ${L}, endDate: ${z} }) : alert('Reset tools are not loaded yet. Please refresh this page.')">
                    <i class="fa-solid fa-triangle-exclamation"></i> Reset Staff Data
                </button>
            </div>
            <div class="admin-card-note">
                Choose a date range to delete only that period. Keep both dates empty to reset all staff activity data. User accounts are always kept.
            </div>
        `},_=($=!1)=>{const I=$?"audit-start-max":"audit-start",H=$?"audit-end-max":"audit-end",L=`document.getElementById('${I}')?.value || ''`,z=`document.getElementById('${H}')?.value || ''`;return`
            <div class="admin-audit-filter-row">
                <input type="date" id="${I}" value="${a}" style="font-size:0.75rem;">
                <input type="date" id="${H}" value="${e}" style="font-size:0.75rem;">
                <button type="button" onclick="window.app_applyAuditFilter(${L}, ${z})" class="action-btn">Filter</button>
            </div>
            <div class="table-container ${$?"admin-table-expanded":""}">
                <table>
                    <thead><tr><th>Staff</th><th>Slot</th><th>Time</th><th>Status</th></tr></thead>
                    <tbody>
                        ${c.length?c.map(q=>`
                            <tr>
                                <td>${v(q.userName)}</td>
                                <td>${v(q.slot)}</td>
                                <td>${new Date(q.timestamp).toLocaleTimeString()}</td>
                                <td style="color:${q.status==="Success"?"green":"red"}">${q.status}</td>
                            </tr>
                        `).join(""):'<tr><td colspan="4" class="text-center">No audits found</td></tr>'}
                    </tbody>
                </table>
            </div>
        `},E=($=!1)=>`
        <span class="text-muted" style="font-size:0.75rem;">Last ${p.length} entries</span>
        <div class="table-container ${$?"admin-table-expanded":""}">
            <table>
                <thead><tr><th>Time</th><th>Event</th><th>Summary</th></tr></thead>
                <tbody>
                    ${p.length?p.map(I=>`
                        <tr>
                            <td>${new Date(Number(I.createdAt||0)).toLocaleString()}</td>
                            <td>${v(I.type||"-")}</td>
                            <td>${v(D(I))}</td>
                        </tr>
                    `).join(""):'<tr><td colspan="3" class="text-center">No simulation cleanup audit entries found</td></tr>'}
                </tbody>
            </table>
        </div>
    `,M=($=!1)=>`
        <div class="admin-staff-head">
            <div class="admin-staff-head-actions">
                ${window.app_isAdminUser?.()||window.app_canManageBirthdays?.()?`<button type="button" class="action-btn secondary" onclick="window.location.hash='birthday-calendar'"><i class="fa-solid fa-cake-candles"></i> Birthday Calendar</button>`:""}
                ${window.app_hasPerm("users","admin")?`<button type="button" class="action-btn" onclick="document.getElementById('add-user-modal').style.display='flex'"><i class="fa-solid fa-user-plus"></i> Add Staff</button>`:""}
            </div>
        </div>
        <div class="table-container ${$?"admin-table-expanded":""} mobile-table-card">
            <table>
                <thead>
                    <tr><th>Staff Member</th><th>Status</th><th>In / Out</th><th>Role / Dept</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${t.map(I=>{const H=I.lastSeen&&Date.now()-I.lastSeen<12e4;return`
                        <tr>
                            <td>
                                <div class="admin-user-cell">
                                    <img src="${I.avatar}" class="admin-user-avatar">
                                    <div>
                                        <div class="admin-user-name-row">${v(I.name)} ${H?'<span class="admin-user-live-tag">LIVE</span>':""}</div>
                                        <div class="admin-user-id">${v(I.username)}</div>
                                    </div>
                                </div>
                            </td>
                            <td><span class="status-badge ${I.status==="in"?"in":"out"}">${I.status?.toUpperCase()}</span></td>
                            <td>${I.lastCheckIn?new Date(I.lastCheckIn).toLocaleTimeString():"--"} / ${I.lastCheckOut?new Date(I.lastCheckOut).toLocaleTimeString():"--"}</td>
                            <td>${v(I.role)} / ${v(I.dept||"--")}</td>
                            <td>
                                <div class="admin-row-actions">
                                    <button type="button" onclick="window.app_viewLogs('${I.id}')" class="admin-icon-btn"><i class="fa-solid fa-list-check"></i></button>
                                    ${window.app_hasPerm("users","admin")?`<button type="button" onclick="window.app_editUser('${I.id}')" class="admin-icon-btn"><i class="fa-solid fa-pen"></i></button>`:""}
                                </div>
                            </td>
                        </tr>`}).join("")}
                </tbody>
            </table>
        </div>
    `,w=Array.from((s||[]).reduce(($,I)=>{const H=String(I?.userId||I?.id||"unknown"),L=$.get(H)||{userId:H,userName:I?.userName||"Staff",latestAppliedOn:I?.appliedOn||I?.startDate||"",totalDays:0,requests:[]};return L.userName=L.userName||I?.userName||"Staff",L.latestAppliedOn=[L.latestAppliedOn,I?.appliedOn,I?.startDate].filter(Boolean).sort((z,q)=>new Date(q)-new Date(z))[0]||L.latestAppliedOn,L.totalDays+=Number(I?.daysCount||0),L.requests.push(I),$.set(H,L),$},new Map).values()).sort(($,I)=>new Date(I.latestAppliedOn||0)-new Date($.latestAppliedOn||0)),y=$=>{const I=String($?.startDate||"").trim(),H=String($?.endDate||"").trim();return!I&&!H?"--":I&&H&&I!==H?`${new Date(I).toLocaleDateString()} - ${new Date(H).toLocaleDateString()}`:new Date(I||H).toLocaleDateString()},k=($=null)=>`
        <div style="margin-top:0.9rem; border-top:1px solid #e2e8f0; padding-top:0.9rem;">
            <div style="font-weight:700; color:#0f172a; margin-bottom:0.6rem;">Recent Decisions</div>
            ${x.length?x.slice(0,$||x.length).map(I=>`
                <div style="display:flex; justify-content:space-between; gap:0.75rem; align-items:flex-start; border:1px solid #e2e8f0; border-radius:12px; padding:0.7rem 0.8rem; background:rgba(255,255,255,0.9); margin-bottom:0.55rem;">
                    <div>
                        <div style="font-weight:700; color:#334155;">${v(I.userName||g.get(String(I.userId||""))?.name||"Staff")}</div>
                        <div style="font-size:0.8rem; color:#475569;">${v(y(I))} • ${v(I.type||"--")} • <span style="color:${String(I.status)==="Approved"?"#166534":"#b91c1c"};">${v(I.status||"--")}</span></div>
                        <div style="font-size:0.75rem; color:#64748b;">${I.actionDate?`Reviewed ${v(new Date(I.actionDate).toLocaleString())}`:"Reviewed recently"}${I.adminComment?` • ${v(I.adminComment)}`:""}</div>
                    </div>
                    <div class="admin-leave-actions">
                        <button type="button" onclick="window.app_undoLeaveDecision('${I.id}')" class="admin-btn admin-btn-secondary">Undo</button>
                    </div>
                </div>
            `).join(""):'<div class="text-muted" style="font-size:0.8rem;">No recent leave decisions.</div>'}
        </div>
    `,P=($=!1)=>w.length===0?`${$?k():x.length?k(3):'<p class="text-muted">No pending requests.</p>'}`:`
            <div class="table-container ${$?"admin-table-expanded":""}">
                <table class="compact-table">
                    <thead>
                        <tr><th>Staff</th><th>Requests</th><th>Total Days</th></tr>
                    </thead>
                    <tbody>
                        ${w.map(I=>`
                            <tr>
                                <td>
                                    <div style="font-weight:700; color:#0f172a;">${v(I.userName)}</div>
                                    <div class="text-muted" style="font-size:0.78rem;">${I.requests.length} request${I.requests.length===1?"":"s"}</div>
                                </td>
                                <td>
                                    <div style="display:flex; flex-direction:column; gap:0.7rem;">
                                        ${I.requests.sort((H,L)=>new Date(L.appliedOn||L.startDate||0)-new Date(H.appliedOn||H.startDate||0)).map(H=>`
                                                <div style="border:1px solid #e2e8f0; border-radius:12px; padding:0.7rem 0.8rem; background:rgba(248,250,252,0.92);">
                                                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem 0.9rem; align-items:center; margin-bottom:0.45rem;">
                                                        <span style="font-weight:700; color:#334155;">${v(y(H))}</span>
                                                        <span class="admin-leave-type-badge">${v(H.type)}</span>
                                                        <span style="font-size:0.78rem; color:#475569;">${v(String(H.daysCount||0))} day${Number(H.daysCount||0)===1?"":"s"}</span>
                                                    </div>
                                                    <div style="display:flex; justify-content:space-between; gap:0.75rem; align-items:flex-start; flex-wrap:wrap;">
                                                        <div class="text-muted" style="font-size:0.75rem;">
                                                            Applied ${v(H.appliedOn?new Date(H.appliedOn).toLocaleDateString():"--")}
                                                        </div>
                                                        <div class="admin-leave-actions">
                                                            ${window.app_hasPerm("leaves","admin")?`
                                                                <button type="button" onclick="window.app_approveLeave('${H.id}')" class="admin-btn admin-btn-success">Approve</button>
                                                                <button type="button" onclick="window.app_rejectLeave('${H.id}')" class="admin-btn admin-btn-danger">Reject</button>
                                                            `:'<span class="text-muted" style="font-size:0.7rem;">View Only</span>'}
                                                        </div>
                                                    </div>
                                                </div>
                                            `).join("")}
                                        ${$?k():""}
                                    </div>
                                </td>
                                <td>${I.totalDays}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
            ${!$&&x.length?k(3):""}
        `,R=($=null)=>`
        <div style="margin-top:0.85rem; border-top:1px solid #e2e8f0; padding-top:0.85rem;">
            <div style="font-weight:700; color:#0f172a; margin-bottom:0.55rem;">Recent Decisions</div>
            ${b.length?b.slice(0,$||b.length).map(I=>`
                <div class="dashboard-tagged-item">
                    <div>
                        <div class="dashboard-tagged-title">${v(I.staffName)}</div>
                        <div class="dashboard-tagged-desc">${v(I.reviewNote||I.missedCheckoutReason||"No review note recorded.")}</div>
                        <div class="dashboard-tagged-meta">${v(I.date||"--")} | ${v(I.staffRole||"Employee")}${I.reviewedAt?` | Reviewed ${v(new Date(I.reviewedAt).toLocaleString())}`:""}</div>
                    </div>
                    <div class="dashboard-tagged-status">
                        <span class="dashboard-tagged-pill ${String(I.reviewStatus).toLowerCase()==="approved"?"accepted":"rejected"}">${v(String(I.reviewStatus||"").toUpperCase())}</span>
                        <div class="dashboard-tagged-actions">
                            <button type="button" class="dashboard-tagged-btn" onclick="window.app_undoMissedCheckoutReview(${JSON.stringify(String(I.notificationId||""))})">Undo</button>
                        </div>
                    </div>
                </div>
            `).join(""):'<div class="text-muted" style="font-size:0.8rem;">No recent missed checkout decisions.</div>'}
        </div>
    `,C=($=!1)=>A.length===0?`${$?R():b.length?R(3):'<p class="text-muted">No missed checkout reasons waiting for review.</p>'}`:`
            <div class="dashboard-tagged-list ${$?"admin-list-expanded":""}">
                ${A.map(I=>`
                    <div class="dashboard-tagged-item">
                        <div>
                            <div class="dashboard-tagged-title">${v(I.staffName)}</div>
                            <div class="dashboard-tagged-desc">${v(I.missedCheckoutReason||"Reason not submitted yet.")}</div>
                            <div class="dashboard-tagged-meta">
                                ${v(I.date||"--")} | ${v(I.staffRole||"Employee")}
                                ${I.missedCheckoutReasonSubmittedAt?` | Submitted ${v(new Date(I.missedCheckoutReasonSubmittedAt).toLocaleString())}`:""}
                            </div>
                        </div>
                        <div class="dashboard-tagged-status">
                            <span class="dashboard-tagged-pill pending">Pending</span>
                            ${I.notificationId?`
                                <div class="dashboard-tagged-actions">
                                    <button type="button" class="dashboard-tagged-btn accept" onclick='window.app_reviewMissedCheckoutReasonFromNotification(-1, ${JSON.stringify(String(I.notificationId))}, "approved")'>Approve</button>
                                    <button type="button" class="dashboard-tagged-btn reject" onclick='window.app_reviewMissedCheckoutReasonFromNotification(-1, ${JSON.stringify(String(I.notificationId))}, "rejected")'>Reject</button>
                                </div>
                            `:'<span class="text-muted" style="font-size:0.7rem;">Notification sync pending</span>'}
                        </div>
                    </div>
                `).join("")}
                ${$?R():""}
            </div>
            ${!$&&b.length?R(3):""}
        `,B=()=>`
        <p class="text-muted">${h} staff with reminder-ready birthdays</p>
        <div style="display:flex; flex-direction:column; gap:0.55rem; margin-bottom:0.65rem;">
            ${f.length?f.map($=>`
                    <div style="display:flex; justify-content:space-between; gap:0.75rem; border:1px solid #fdba74; border-radius:12px; padding:0.7rem 0.8rem; background:rgba(255,255,255,0.72);">
                        <div>
                            <div style="font-weight:700; color:#7c2d12;">${v($.name||"Staff")}</div>
                            <div style="font-size:0.8rem; color:#9a3412;">${v($.role||"Employee")} / ${v($.dept||"General")}</div>
                        </div>
                        <div style="text-align:right; color:#9a3412; font-weight:700;">${v(String($.birthDay||"--"))}/${v(String($.birthMonth||"--"))}${$.birthYear?`/${v(String($.birthYear))}`:""}</div>
                    </div>
                `).join(""):'<div style="color:#9a3412; font-size:0.85rem;">No birthdays saved yet.</div>'}
        </div>
        <button type="button" class="action-btn" onclick="window.location.hash='birthday-calendar'"><i class="fa-solid fa-cake-candles"></i> Open</button>
    `,O=[],F={},U=($,I)=>`
        <div class="admin-card-mode-controls" role="group" aria-label="${v(I)} view controls">
            <button type="button" class="admin-card-mode-btn admin-card-mode-btn-original" onclick="window.app_toggleAdminCardMode('${$}', 'original', this)" aria-label="Show original size ${v(I)}">
                <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
            </button>
            <button type="button" class="admin-card-mode-btn admin-card-mode-btn-fullscreen" onclick="window.app_toggleAdminCardMode('${$}', 'fullscreen', this)" aria-label="Show fullscreen ${v(I)}">
                <i class="fa-solid fa-expand"></i>
            </button>
        </div>
    `,W=({id:$,title:I,compactHtml:H,expandedHtml:L="",className:z="",accentClass:q=""})=>{if(!$||!I)return;const j=U($,I);F[$]={title:I,tileHtml:`${j}${H}`,originalHtml:`${j}${hi(H)}`,expandedHtml:L||H},O.push(`
            <section class="card admin-card-compact admin-card-mode-tile ${z} ${q}" data-admin-card="${$}" data-admin-card-mode="tile" data-admin-original-full-width="0">
                <div class="admin-card-header-row">
                    <h3 class="admin-card-title">${v(I)}</h3>
                    ${U($,I)}
                </div>
                <div class="admin-card-content">
                    ${H}
                </div>
            </section>
        `)};return W({id:"staff-kpi",title:"Staff Snapshot",className:"admin-kpi-card",compactHtml:`
            <span class="admin-kpi-label">Total Registered Staff</span>
            <h2 class="admin-kpi-value">${t.length}</h2>
            <div class="admin-kpi-grid">
                <div class="admin-kpi-pill">
                    <div class="admin-kpi-pill-value">${u}</div>
                    <div class="admin-kpi-pill-label">Active</div>
                </div>
                <div class="admin-kpi-pill">
                    <div class="admin-kpi-pill-value">${m}</div>
                    <div class="admin-kpi-pill-label">Admins</div>
                </div>
            </div>
        `}),window.app_hasPerm("users","admin")&&W({id:"data-management",title:"Data Management",className:"admin-performance-card",accentClass:"admin-card-accent-blue",compactHtml:T(!1),expandedHtml:T(!0)}),window.app_hasPerm("leaves","view")&&W({id:"pending-leaves",title:`Pending Leave Requests (${w.length} staff / ${s.length} requests)`,className:"admin-section-card",compactHtml:P(!1),expandedHtml:P(!0)}),window.app_hasPerm("dashboard","admin")&&W({id:"missed-checkout",title:`Missed Checkout Requests (${A.length})`,className:"dashboard-tagged-card",compactHtml:C(!1),expandedHtml:C(!0)}),(window.app_isAdminUser?.()||window.app_canManageBirthdays?.())&&W({id:"birthday-calendar",title:"Birthday Calendar",className:"admin-performance-card",accentClass:"admin-card-accent-amber",compactHtml:B(),expandedHtml:B()}),window.app_hasPerm("users","view")&&W({id:"staff-management",title:"Staff Management",compactHtml:M(!1),expandedHtml:M(!0)}),W({id:"security-audits",title:"Security Audits",compactHtml:_(!1),expandedHtml:_(!0)}),W({id:"simulation-audit",title:"Simulation Cleanup Audit (Debug)",compactHtml:E(!1),expandedHtml:E(!0)}),window._adminCardTemplates=F,window._adminCardModeState={},window.app_applyAuditFilter=async($="",I="")=>{const H=String($||"").trim()||document.getElementById("audit-start")?.value||document.getElementById("audit-start-max")?.value,L=String(I||"").trim()||document.getElementById("audit-end")?.value||document.getElementById("audit-end-max")?.value,z=document.getElementById("page-content");window.app_closeAdminCardMaximize?.(),z&&(z.innerHTML=await ba(H,L))},window.app_refreshAdminPage=async()=>{const $=document.getElementById("audit-start")?.value||document.getElementById("audit-start-max")?.value||a,I=document.getElementById("audit-end")?.value||document.getElementById("audit-end-max")?.value||e,H=document.getElementById("page-content");window.app_closeAdminCardMaximize?.(),H&&(H.innerHTML=await ba($,I))},`
        <div class="dashboard-grid dashboard-modern dashboard-admin-view admin-grid-compact">
            ${O.join("")}
        </div>`}const Te=["January","February","March","April","May","June","July","August","September","October","November","December"],yi=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],wi=a=>String(a).padStart(2,"0"),Qn=()=>window.AppDB?.getIstNow?new Date(window.AppDB.getIstNow()):new Date,gi=()=>{const a=Qn(),e=window.app_birthdayCalendarState||{},t=Number(e.selectedMonth||a.getMonth()+1),n=Number(e.selectedYear||a.getFullYear()),s=e.view==="year"?"year":"month";return window.app_birthdayCalendarState={view:s,selectedMonth:t,selectedYear:n},window.app_birthdayCalendarState},Zn=a=>{const e=Number(a?.birthDay||0),t=Number(a?.birthMonth||0),n=Number(a?.birthYear||0),s=e?wi(e):"--",i=t?Te[t-1]:"--";return`${s} ${i}${n?` ${n}`:""}`.trim()},Ye=a=>{const e=Number(a?.birthMonth||99),t=Number(a?.birthDay||99),n=String(a?.name||"").toLowerCase();return`${String(e).padStart(2,"0")}-${String(t).padStart(2,"0")}-${n}`},bi=a=>{const e=a?.role||"Employee",t=a?.dept||a?.department||"General";return`${a?.name||"Staff"} - ${e} / ${t}`},es=a=>a?.source==="external"?'<span class="birthday-source-pill external">External</span>':'<span class="birthday-source-pill staff">Staff</span>',ts=a=>a?.source==="external"?`${a?.position||"Position not set"} • ${a?.location||"Location not set"}`:`${a?.role||"Employee"} • ${a?.dept||"General"}`,vi=a=>Number(a?.birthDay||0)>0?'<span class="birthday-status ok">Reminder eligible</span>':'<span class="birthday-status warn">Add day to enable reminder</span>',as=(a,e)=>e?`<button type="button" class="action-btn secondary" style="margin-top:0.55rem; padding:0.42rem 0.72rem;" onclick="window.app_openBirthdayEditor('${v(a?.source||"user")}', '${v(a?.id||"")}')">Edit</button>`:"",Si=a=>{const e=new Map;for(let t=1;t<=12;t+=1)e.set(t,[]);a.forEach(t=>{const n=Number(t?.birthMonth||0);n>=1&&n<=12&&e.get(n).push(t)});for(let t=1;t<=12;t+=1)e.get(t).sort((n,s)=>Ye(n).localeCompare(Ye(s)));return e},ki=(a,e)=>{const n=new Date(e,a-1,1).getDay(),s=new Date(e,a,0).getDate(),i=[];for(let o=0;o<n;o+=1)i.push({type:"empty",key:`e-${a}-${o}`});for(let o=1;o<=s;o+=1)i.push({type:"day",day:o,key:`d-${a}-${o}`});for(;i.length%7!==0;)i.push({type:"empty",key:`tail-${a}-${i.length}`});return i},Ai=(a,e)=>`
    <article class="birthday-agenda-card">
        <div class="birthday-agenda-head">
            <div>
                <div class="birthday-agenda-name">${v(a.name||"Staff")}</div>
                <div class="birthday-agenda-meta">${v(ts(a))}</div>
            </div>
            ${es(a)}
        </div>
        <div class="birthday-agenda-date">${v(Zn(a))}</div>
        <div class="birthday-agenda-foot">
            ${vi(a)}
            ${as(a,e)}
        </div>
    </article>
`,Di=(a,e,t)=>{const n=e.slice(0,3).map(s=>`
        <div class="birthday-mini-chip">
            <span>${v(String(s.birthDay||"--"))}</span>
            <span>${v(s.name||"Staff")}</span>
        </div>
    `).join("");return`
        <button type="button" class="birthday-mini-month ${t===a?"is-selected":""}" onclick="window.app_goToBirthdayCalendarMonth(${a})">
            <div class="birthday-mini-month-head">
                <span>${v(Te[a-1])}</span>
                <strong>${e.length}</strong>
            </div>
            <div class="birthday-mini-month-body">
                ${n||'<div class="birthday-mini-empty">No birthdays saved</div>'}
            </div>
        </button>
    `};async function _i(){const a=window.AppAuth?.getUser?.(),e=window.app_canManageBirthdays?.(a),t=window.app_canAdminBirthdays?.(a),n=window.app_canSeeAdminPanel?.(a);if(!a||!e)return`
            <div class="card" style="max-width:720px; margin:1rem auto;">
                <h3 style="margin-top:0;">Birthday Calendar</h3>
                <p style="color:#64748b; margin-bottom:0;">You do not have permission to view the birthday calendar.</p>
            </div>
        `;const[s,i]=await Promise.all([window.AppDB.getAll("users").catch(()=>[]),window.AppDB.getAll("birthday_people",{silentPermissionDenied:!0}).catch(()=>[])]),o=[...s].sort((w,y)=>Ye(w).localeCompare(Ye(y))),r=[...o.map(w=>({...w,source:"user"})),...i.map(w=>({...w,source:"external"}))].sort((w,y)=>Ye(w).localeCompare(Ye(y))),l=r.filter(w=>Number(w?.birthMonth||0)>=1&&Number(w?.birthMonth||0)<=12),d=r.filter(w=>!(Number(w?.birthMonth||0)>=1&&Number(w?.birthMonth||0)<=12)),c=Si(l),p=gi(),u=p.selectedMonth,m=p.selectedYear,h=Qn(),f=u===h.getMonth()+1&&m===h.getFullYear(),g=c.get(u)||[],S=o.map(w=>`
        <option value="${v(w.id)}">${v(bi(w))}</option>
    `).join(""),A=ki(u,m),b=new Map;g.forEach(w=>{const y=Number(w?.birthDay||0);if(!y)return;const k=b.get(y)||[];k.push(w),b.set(y,k)});const x=A.map(w=>{if(w.type==="empty")return'<div class="birthday-day-cell empty"></div>';const y=b.get(w.day)||[],k=f&&w.day===h.getDate(),P=y.slice(0,2).map(R=>`
            <div class="birthday-day-chip ${R.source==="external"?"external":"staff"}">
                <span>${v(R.name||"Staff")}</span>
            </div>
        `).join("");return`
            <div class="birthday-day-cell ${y.length?"has-birthday":""} ${k?"is-today":""}">
                <div class="birthday-day-number">${w.day}</div>
                <div class="birthday-day-stack">
                    ${P||'<div class="birthday-day-placeholder">No birthdays</div>'}
                    ${y.length>2?`<div class="birthday-day-more">+${y.length-2} more</div>`:""}
                </div>
            </div>
        `}).join(""),D=Te.map((w,y)=>`
        <button type="button" class="birthday-month-tab ${u===y+1?"is-active":""}" onclick="window.app_goToBirthdayCalendarMonth(${y+1})">${v(w.slice(0,3))}</button>
    `).join(""),T=g.length?g.map(w=>Ai(w,t)).join(""):'<div class="birthday-empty-panel">No birthdays have been assigned to this month yet.</div>',_=Te.map((w,y)=>Di(y+1,c.get(y+1)||[],u)).join(""),E=d.length?d.map(w=>`
            <article class="birthday-incomplete-row">
                <div>
                    <div class="birthday-incomplete-name-wrap">
                        <strong>${v(w.name||"Staff")}</strong>
                        ${es(w)}
                    </div>
                    <div class="birthday-incomplete-meta">${v(ts(w))}</div>
                </div>
                <div style="text-align:right;">
                    <div class="birthday-incomplete-date">${v(Zn(w))}</div>
                    <div class="birthday-status warn">Month missing or incomplete</div>
                    ${as(w,t)}
                </div>
            </article>
        `).join(""):'<div class="birthday-empty-panel">All saved birthday records already have a month assigned.</div>',M=t?`
        <section class="birthday-side-card birthday-actions-card">
            <div class="birthday-section-kicker">Manage This Month</div>
            <h3>${v(Te[u-1])} Actions</h3>
            <form id="birthday-month-form-${u}" onsubmit="window.app_submitBirthdayMonthForm(event, ${u})" class="birthday-add-form">
                <label>
                    <span>Add staff to ${v(Te[u-1])}</span>
                    <select name="userId" required>
                        <option value="">Select staff</option>
                        ${S}
                    </select>
                </label>
                <div class="birthday-add-grid">
                    <label>
                        <span>Day</span>
                        <input type="number" name="birthDay" min="1" max="31" placeholder="DD">
                    </label>
                    <label>
                        <span>Year</span>
                        <input type="number" name="birthYear" min="1900" max="2100" placeholder="YYYY">
                    </label>
                </div>
                <button type="submit" class="action-btn">Save Staff Birthday</button>
            </form>
            <button type="button" class="action-btn secondary" onclick="window.app_openExternalBirthdayPersonModal(${u})">Add Person Not In System</button>
        </section>
    `:"";return`
        <style>
            .birthday-modern { --birthday-bg: linear-gradient(180deg, #f5f8ff 0%, #fcfdff 100%); --birthday-border: rgba(107, 133, 194, 0.24); --birthday-surface: rgba(255,255,255,0.92); display:grid; gap:1rem; justify-items:center; }
            .birthday-shell { background:var(--birthday-bg); border:1px solid var(--birthday-border); border-radius:28px; box-shadow:0 18px 48px rgba(40, 63, 124, 0.14); overflow:hidden; position:relative; width:min(1200px, 96vw); height:min(86vh, 900px); display:flex; flex-direction:column; }
            .birthday-shell::before { content:""; position:absolute; inset:0; background:radial-gradient(circle at top right, rgba(147, 197, 253, 0.3), transparent 28%), radial-gradient(circle at bottom left, rgba(191, 219, 254, 0.28), transparent 34%); pointer-events:none; }
            .birthday-shell>* { position:relative; z-index:1; }
            .birthday-hero { padding:1.2rem 1.2rem 1rem; display:grid; gap:0.85rem; background:linear-gradient(135deg, #19376d, #284b9b 56%, #4f7cff); color:#f8fbff; flex:0 0 auto; }
            .birthday-hero-top, .birthday-toolbar, .birthday-panel-head, .birthday-agenda-head, .birthday-mini-month-head, .birthday-incomplete-row { display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; }
            .birthday-kicker, .birthday-section-kicker { font-size:0.72rem; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; }
            .birthday-title { margin:0.25rem 0 0.15rem; font-size:1.55rem; line-height:1.1; }
            .birthday-copy { margin:0; max-width:780px; opacity:0.92; font-size:0.9rem; }
            .birthday-hero-actions, .birthday-period-nav { display:flex; gap:0.55rem; flex-wrap:wrap; align-items:center; }
            .birthday-view-switch { display:inline-flex; padding:0.28rem; border-radius:999px; background:rgba(255,255,255,0.16); border:1px solid rgba(255,255,255,0.18); gap:0.28rem; }
            .birthday-view-switch button, .birthday-nav-btn, .birthday-month-tab, .birthday-mini-month { cursor:pointer; }
            .birthday-view-switch button { border:none; border-radius:999px; padding:0.55rem 0.9rem; font-weight:700; font-size:0.88rem; background:transparent; color:rgba(255,255,255,0.82); }
            .birthday-view-switch button.is-active { background:#f8fbff; color:#1f3f83; }
            .birthday-nav-btn { border:none; width:2.15rem; height:2.15rem; border-radius:999px; background:rgba(255,255,255,0.18); color:#fff; font-size:0.92rem; }
            .birthday-period-label { padding:0.62rem 0.9rem; border-radius:16px; background:rgba(255,255,255,0.14); border:1px solid rgba(255,255,255,0.2); min-width:210px; }
            .birthday-period-title { display:block; font-size:0.98rem; font-weight:800; }
            .birthday-period-sub, .birthday-panel-sub, .birthday-agenda-meta, .birthday-incomplete-meta, .birthday-empty-panel, .birthday-mini-empty { display:block; font-size:0.84rem; color:#78716c; }
            .birthday-period-sub { font-size:0.8rem; color:rgba(248, 251, 255, 0.96); font-weight:600; }
            .birthday-month-tabs { display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:0.35rem; }
            .birthday-month-tab { border:none; border-radius:14px; background:rgba(255,255,255,0.14); color:rgba(255,255,255,0.86); padding:0.45rem 0; font-weight:700; font-size:0.82rem; }
            .birthday-month-tab.is-active { background:#f8fbff; color:#1f3f83; }
            .birthday-body { padding:1rem; display:grid; gap:0.9rem; flex:1 1 auto; overflow:auto; }
            .birthday-month-layout { display:grid; grid-template-columns:minmax(0,1.6fr) minmax(300px,0.95fr); gap:1rem; align-items:start; }
            .birthday-panel, .birthday-side-card, .birthday-year-panel { background:var(--birthday-surface); border:1px solid var(--birthday-border); border-radius:24px; box-shadow:0 12px 28px rgba(40, 63, 124, 0.08); backdrop-filter:blur(14px); }
            .birthday-panel, .birthday-side-card, .birthday-year-panel, .birthday-incomplete-wrap { padding:0.9rem; }
            .birthday-panel-head h3, .birthday-side-card h3, .birthday-year-panel h3 { margin:0; color:#1f3f83; font-size:1.05rem; }
            .birthday-weekdays, .birthday-calendar-grid { display:grid; grid-template-columns:repeat(7, minmax(0,1fr)); gap:0.6rem; }
            .birthday-weekdays { margin-bottom:0.6rem; }
            .birthday-weekdays span { text-align:center; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; color:#5d77b0; font-weight:800; }
            .birthday-day-cell { min-height:110px; padding:0.55rem; border-radius:18px; border:1px solid rgba(134, 157, 214, 0.16); background:linear-gradient(180deg,#ffffff,#f6f9ff); display:flex; flex-direction:column; gap:0.45rem; overflow:hidden; }
            .birthday-day-cell.empty { background:rgba(148,163,184,0.08); border-style:dashed; min-height:90px; }
            .birthday-day-cell.has-birthday { border-color:rgba(79, 124, 255, 0.26); box-shadow:inset 0 0 0 1px rgba(147, 197, 253, 0.22); }
            .birthday-day-cell.is-today { outline:2px solid rgba(40, 75, 155, 0.26); }
            .birthday-day-number, .birthday-agenda-name, .birthday-mini-month-head, .birthday-incomplete-name-wrap strong { font-weight:800; color:#0f172a; }
            .birthday-day-number { font-size:0.82rem; }
            .birthday-day-stack, .birthday-agenda, .birthday-actions-card, .birthday-add-form, .birthday-add-grid, .birthday-mini-month-body { display:grid; gap:0.5rem; }
            .birthday-day-stack { align-content:start; min-height:0; overflow:hidden; }
            .birthday-day-chip, .birthday-mini-chip { display:flex; align-items:center; justify-content:space-between; gap:0.35rem; border-radius:10px; padding:0.28rem 0.42rem; font-size:0.68rem; font-weight:700; background:#e8f0ff; color:#21418b; min-width:0; }
            .birthday-day-chip span, .birthday-mini-chip span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
            .birthday-day-chip.external { background:#eef4ff; color:#4c67a1; }
            .birthday-day-placeholder { color:#94a3b8; font-size:0.68rem; }
            .birthday-day-more { font-size:0.66rem; color:#5d77b0; font-weight:700; }
            .birthday-side { display:grid; gap:1rem; }
            .birthday-agenda { max-height:520px; overflow:auto; }
            .birthday-agenda-card { border-radius:18px; padding:0.85rem; background:linear-gradient(180deg,#fff,#f6f9ff); border:1px solid rgba(107, 133, 194, 0.18); display:grid; gap:0.45rem; }
            .birthday-agenda-date, .birthday-incomplete-date { font-size:0.84rem; font-weight:800; color:#21418b; }
            .birthday-source-pill, .birthday-status { display:inline-flex; align-items:center; border-radius:999px; padding:0.2rem 0.48rem; font-size:0.66rem; font-weight:800; }
            .birthday-source-pill.external { background:#eef4ff; color:#4c67a1; }
            .birthday-source-pill.staff, .birthday-status.ok { background:#e7f0ff; color:#21418b; }
            .birthday-status.warn { background:#eef2ff; color:#4f5f9c; }
            .birthday-add-grid { grid-template-columns:repeat(2, minmax(0,1fr)); }
            .birthday-add-form label { display:grid; gap:0.32rem; }
            .birthday-add-form span { font-size:0.72rem; font-weight:700; color:#36548f; }
            .birthday-add-form select, .birthday-add-form input { width:100%; padding:0.65rem 0.75rem; border-radius:14px; border:1px solid #c6d4f7; background:#fff; font-size:0.88rem; }
            .birthday-year-grid { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:0.9rem; }
            .birthday-mini-month { border:1px solid rgba(107, 133, 194, 0.18); border-radius:22px; background:linear-gradient(180deg,#fff,#f6f9ff); padding:0.85rem; display:grid; gap:0.7rem; text-align:left; }
            .birthday-mini-month.is-selected { border-color:rgba(40, 75, 155, 0.35); box-shadow:inset 0 0 0 1px rgba(79, 124, 255, 0.18); }
            .birthday-mini-month-head strong { font-size:1.05rem; color:#1f3f83; }
            .birthday-incomplete-wrap { background:var(--birthday-surface); border:1px solid var(--birthday-border); border-radius:24px; box-shadow:0 12px 28px rgba(40, 63, 124, 0.08); }
            .birthday-incomplete-row { padding:0.8rem 0; border-bottom:1px solid rgba(226,232,240,0.8); }
            .birthday-incomplete-row:last-child { border-bottom:none; }
            .birthday-incomplete-name-wrap { display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap; }
            @media (max-width:1100px) { .birthday-month-layout { grid-template-columns:1fr; } .birthday-year-grid { grid-template-columns:repeat(2, minmax(0,1fr)); } }
            @media (max-width:780px) { .birthday-shell { height:auto; width:min(96vw, 720px); } .birthday-hero, .birthday-body, .birthday-incomplete-wrap { padding:0.85rem; } .birthday-month-tabs { grid-template-columns:repeat(4, minmax(0,1fr)); } .birthday-weekdays, .birthday-calendar-grid { gap:0.35rem; } .birthday-day-cell { min-height:88px; padding:0.45rem; } .birthday-year-grid { grid-template-columns:1fr; } }
        </style>
        <div class="birthday-modern">
            <section class="birthday-shell">
                <div class="birthday-hero">
                    <div class="birthday-hero-top">
                        <div>
                            <div class="birthday-kicker">Birthday Calendar</div>
                            <h2 class="birthday-title">Birthday planner</h2>
                            <p class="birthday-copy">Start from the current month, move through the year only when you need to, and manage staff plus outside people from one calendar view.</p>
                        </div>
                        <div class="birthday-hero-actions">
                            ${t?`<button type="button" class="action-btn" onclick="window.app_openExternalBirthdayPersonModal(${u})">Add Person Not In System</button>`:""}
                            <button type="button" class="action-btn secondary" onclick="window.location.hash='${n?"admin":"dashboard"}'">${n?"Back to Admin":"Back to Dashboard"}</button>
                        </div>
                    </div>
                    <div class="birthday-toolbar">
                        <div class="birthday-period-nav">
                            <button type="button" class="birthday-nav-btn" onclick="window.app_changeBirthdayCalendarMonth(-1)">&larr;</button>
                            <div class="birthday-period-label">
                                <span class="birthday-period-title">${v(Te[u-1])} ${m}</span>
                                <span class="birthday-period-sub">${g.length} birthdays this month</span>
                            </div>
                            <button type="button" class="birthday-nav-btn" onclick="window.app_changeBirthdayCalendarMonth(1)">&rarr;</button>
                        </div>
                        <div class="birthday-view-switch">
                            <button type="button" class="${p.view==="month"?"is-active":""}" onclick="window.app_setBirthdayCalendarView('month')">Monthly View</button>
                            <button type="button" class="${p.view==="year"?"is-active":""}" onclick="window.app_setBirthdayCalendarView('year')">Yearly View</button>
                        </div>
                    </div>
                    <div class="birthday-month-tabs">${D}</div>
                </div>
                <div class="birthday-body">
                    ${p.view==="month"?`
                        <div class="birthday-month-layout">
                            <section class="birthday-panel">
                                <div class="birthday-panel-head">
                                    <div>
                                        <h3>${v(Te[u-1])} Calendar</h3>
                                        <div class="birthday-panel-sub">Default focus is the current month. Switch month whenever you need another view.</div>
                                    </div>
                                    <div class="birthday-status ok">${g.length} saved</div>
                                </div>
                                <div class="birthday-weekdays">${yi.map(w=>`<span>${w}</span>`).join("")}</div>
                                <div class="birthday-calendar-grid">${x}</div>
                            </section>
                            <div class="birthday-side">
                                <section class="birthday-side-card">
                                    <div class="birthday-section-kicker">This Month</div>
                                    <h3>${v(Te[u-1])} Birthdays</h3>
                                    <div class="birthday-agenda">${T}</div>
                                </section>
                                ${M}
                            </div>
                        </div>
                    `:`
                        <section class="birthday-year-panel">
                            <div class="birthday-panel-head">
                                <div>
                                    <h3>Yearly Birthday View</h3>
                                    <div class="birthday-panel-sub">See all 12 months together, then open any month for detail.</div>
                                </div>
                                <div class="birthday-status ok">${l.length} annual records</div>
                            </div>
                            <div class="birthday-year-grid">${_}</div>
                        </section>
                    `}
                </div>
            </section>
            <section class="birthday-incomplete-wrap">
                <div class="birthday-panel-head">
                    <div>
                        <h3>Incomplete Birthday Records</h3>
                        <div class="birthday-panel-sub">These entries still need a birth month or fuller details before they can behave like normal calendar records.</div>
                    </div>
                    <div class="birthday-status warn">${d.length} incomplete</div>
                </div>
                ${E}
            </section>
            <section class="birthday-incomplete-wrap">
                <div class="birthday-panel-head">
                    <div>
                        <h3>How Birthday Reminder Works</h3>
                        <div class="birthday-panel-sub">Quick guide for admins and birthday managers.</div>
                    </div>
                    <div class="birthday-status ok">Reminder guide</div>
                </div>
                <div style="display:grid; gap:0.85rem; color:#475569; line-height:1.6;">
                    <div><strong style="color:#7c2d12;">1. Required details:</strong> the reminder works when a person has both birthday day and birthday month saved. Year is optional.</div>
                    <div><strong style="color:#7c2d12;">2. When it appears:</strong> the system checks the birthday date for the current year and shows the reminder on the previous working day.</div>
                    <div><strong style="color:#7c2d12;">3. Weekend or holiday case:</strong> if the birthday comes after a weekend or holiday, the reminder moves back to the last working day before it.</div>
                    <div><strong style="color:#7c2d12;">4. Who receives it:</strong> admins and users with birthday permission receive the personalized birthday popup and notification.</div>
                    <div><strong style="color:#7c2d12;">5. Who is included:</strong> reminders work for both staff in the system and people added separately in the birthday planner.</div>
                    <div><strong style="color:#7c2d12;">6. Duplicate protection:</strong> reopening or refreshing the app does not keep creating the same reminder again.</div>
                </div>
            </section>
        </div>
    `}async function $i(){const a=await window.AppAnalytics.getSystemMonthlySummary(),e=new Date,t=window.AppAuth.getUser(),n=window.app_hasPerm("reports","admin",t);return`
        <div class="card full-width">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h3 style="font-size: 1.25rem;">Salary Processing</h3>
                    <p class="text-muted">Period: ${e.toLocaleDateString("default",{month:"long",year:"numeric"})}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="background: #f8fafc; padding: 0.5rem 1rem; border-radius: 0.6rem; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 0.5rem;">
                        <label style="font-weight: 600; color: #64748b; font-size: 0.85rem;">Global TDS:</label>
                        <input type="number" id="global-tds-percent" value="0" min="0" max="100" style="width: 60px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px;" onchange="window.app_recalculateAllSalaries()">
                        <span style="font-weight: 600; color: #64748b;">%</span>
                    </div>
                    ${n?'<button class="action-btn" onclick="window.app_saveAllSalaries()" style="padding: 0.6rem 1.2rem;">Save All & Lock</button>':""}
                </div>
            </div>

            <div class="table-container salary-processing-table-wrap">
                <table class="salary-processing-table">
                    <thead>
                        <tr>
                            <th>Staff Member</th>
                            <th>Base Salary</th>
                            <th>Present</th>
                            <th>Late</th>
                            <th>Unpaid</th>
                            <th>Extra Hrs</th>
                            <th>Late Raw</th>
                            <th>Offset</th>
                            <th>Late Ded</th>
                            <th>Ded Days</th>
                            <th>Attendance Ded</th>
                            <th>Calculated</th>
                            <th>TDS %</th>
                            <th>Final Net</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${a.map(i=>{const{user:o,stats:r}=i,l=Number(o.baseSalary||0),d=Number(r.unpaidLeaves||0),c=Number(r.late||0),p=Number(r.extraWorkedHours||0),u=window.AppConfig?.LATE_GRACE_COUNT||3,m=window.AppConfig?.LATE_DEDUCTION_PER_BLOCK||.5,h=window.AppConfig?.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4,f=Math.floor(c/u)*m,g=Math.floor(p/h)*m,S=Math.min(f,g),A=Math.max(0,f-S),b=d+A,x=Math.round(l/22*b),D=Math.round(Math.max(0,l-x)),T=o.employeeId||"",_=o.designation||o.role||"",E=o.dept||o.department||"",M=o.joinDate||"",w=o.bankName||"",y=o.bankAccount||o.accountNumber||"",k=o.pan||o.PAN||"",P=o.uan||o.UAN||"",R=Number(o.otherAllowances||0),C=Number(o.providentFund||0),B=Number(o.professionalTax||0),O=Number(o.loanAdvance||0);return`
                                <tr data-user-id="${o.id}">
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                                            <img src="${o.avatar}" style="width: 28px; height: 28px; border-radius: 50%;">
                                            <div style="font-weight: 600;">${v(o.name)}</div>
                                        </div>
                                    </td>
                                    <td><input type="number" class="base-salary-input" value="${l}" style="width: 80px;" onchange="window.app_recalculateRow(this.closest('tr'))"></td>
                                    <td><span class="present-count">${r.present}</span></td>
                                    <td><span class="late-count">${c}</span></td>
                                    <td><span class="unpaid-leaves-count">${d}</span></td>
                                    <td><span class="extra-work-hours">${p.toFixed(2)}</span></td>
                                    <td><span class="late-deduction-raw">${f.toFixed(1)}</span></td>
                                    <td><span class="penalty-offset-days">${S.toFixed(1)}</span></td>
                                    <td><span class="late-deduction-days">${A.toFixed(1)}</span></td>
                                    <td><span class="deduction-days">${b.toFixed(1)}</span></td>
                                    <td class="attendance-deduction-amount" style="color:#ef4444;">-Rs ${x.toLocaleString()}</td>
                                    <td class="deduction-amount" style="display:none;">-Rs ${x.toLocaleString()}</td>
                                    <td><input type="number" class="salary-input" value="${D}" style="width: 90px;"></td>
                                    <td><input type="number" class="tds-input" value="" placeholder="Global" style="width: 60px;" onchange="window.app_recalculateRow(this.closest('tr'))"></td>
                                    <td class="final-net-salary" data-value="${D}" style="font-weight:700; color:#1e40af;">Rs ${D.toLocaleString()}</td>
                                    <td class="tds-amount" data-value="0" style="display:none;">Rs 0</td>

                                    <td style="display:none;"><input class="employee-id-input" type="text" value="${v(T)}"></td>
                                    <td style="display:none;"><input class="designation-input" type="text" value="${v(_)}"></td>
                                    <td style="display:none;"><input class="department-input" type="text" value="${v(E)}"></td>
                                    <td style="display:none;"><input class="join-date-input" type="date" value="${v(M)}"></td>
                                    <td style="display:none;"><input class="bank-name-input" type="text" value="${v(w)}"></td>
                                    <td style="display:none;"><input class="bank-account-input" type="text" value="${v(y)}"></td>
                                    <td style="display:none;"><input class="pan-input" type="text" value="${v(k)}"></td>
                                    <td style="display:none;"><input class="uan-input" type="text" value="${v(P)}"></td>
                                    <td style="display:none;"><input class="other-allowances-input" type="number" value="${R}"></td>
                                    <td style="display:none;"><input class="pf-input" type="number" value="${C}"></td>
                                    <td style="display:none;"><input class="professional-tax-input" type="number" value="${B}"></td>
                                    <td style="display:none;"><input class="loan-advance-input" type="number" value="${O}"></td>
                                    <td style="display:none;"><input class="comment-input" type="text" value=""></td>

                                    <td><button class="action-btn secondary" onclick="window.app_generateSalarySlip('${o.id}')">Slip</button></td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `}async function xi(){const a=new Date().toISOString().split("T")[0];return window.app_runPolicyTest=()=>{const e=document.getElementById("policy-test-checkin")?.value,t=document.getElementById("policy-test-checkout")?.value,n=document.getElementById("policy-test-output");if(!e||!t||!n)return;const s=document.getElementById("policy-test-date")?.value,i=new Date(`${s}T${e}`),r=(new Date(`${s}T${t}`)-i)/(1e3*60*60);let l="Absent";r>=8?l="Present":r>=4&&(l="Half Day"),n.innerHTML=`
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <div class="stat-card"><div class="label">Status</div><div class="value">${l}</div></div>
                <div class="stat-card"><div class="label">Duration</div><div class="value">${r.toFixed(2)} hrs</div></div>
            </div>
        `},`
        <div class="card full-width">
            <h3 style="margin-bottom:1rem;">Policy Simulator</h3>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1rem; margin-bottom:1rem;">
                <input type="date" id="policy-test-date" value="${a}">
                <input type="time" id="policy-test-checkin" value="09:00">
                <input type="time" id="policy-test-checkout" value="18:00">
            </div>
            <button class="action-btn" onclick="window.app_runPolicyTest()">Test Outcome</button>
            <div id="policy-test-output" style="margin-top:1.5rem;"></div>
        </div>
    `}async function ns(){const a=await window.AppMinutes.getMinutes(),e=window.AppDB?.getAll?await window.AppDB.getAll("users"):[],t=window.AppAuth.getUser(),n=window.AppCalendar?await window.AppCalendar.getPlans():{leaves:[],events:[],work:[]},s=new Date,i=`${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}`;window._minutesUiState?(window._minutesUiState.viewMode=window._minutesUiState.viewMode||"list",window._minutesUiState.searchQuery=window._minutesUiState.searchQuery||"",window._minutesUiState.monthKey=window._minutesUiState.monthKey||i):window._minutesUiState={viewMode:"list",searchQuery:"",monthKey:i};const o=window._minutesUiState,r=(w,y=t)=>!w||!y?!1:!!(window.app_hasPerm("minutes","view",y)||w.createdBy===y.id||(w.attendeeIds||[]).includes(y.id)||(w.allowedViewers||[]).includes(y.id)||(w.actionItems||[]).some(k=>k.assignedTo===y.id)),l=(w,y=t.id)=>{const k=(w.accessRequests||[]).find(P=>P.userId===y);return k?k.status:""},d=(w="")=>{const P=new DOMParser().parseFromString(`<div>${w||""}</div>`,"text/html").body.firstElementChild;if(!P)return"";const R=new Set(["P","BR","B","STRONG","I","EM","U","H2","H3","UL","OL","LI","A"]),C={A:new Set(["href","target","rel"])},B=O=>{!O||!O.childNodes||Array.from(O.childNodes).forEach(F=>{if(F.nodeType===Node.ELEMENT_NODE){const U=F;if(!R.has(U.tagName)){for(;U.firstChild;)O.insertBefore(U.firstChild,U);O.removeChild(U);return}if(Array.from(U.attributes).forEach(W=>{const $=C[U.tagName];(!$||!$.has(W.name.toLowerCase()))&&U.removeAttribute(W.name)}),U.tagName==="A"){const W=(U.getAttribute("href")||"").trim();/^(https?:|mailto:|#)/i.test(W)?(U.setAttribute("target","_blank"),U.setAttribute("rel","noopener noreferrer")):U.removeAttribute("href")}}B(F)})};return B(P),P.innerHTML.trim()},c=(w="")=>{const y=document.createElement("div");return y.innerHTML=w||"",(y.innerText||y.textContent||"").replace(/\r/g,"").trim()},p=(w="")=>v(w||"").replace(/\n/g,"<br>"),u=w=>{if(!w)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(w))return new Date(`${w}T00:00:00`);const y=new Date(w);return Number.isNaN(y.getTime())?null:y},m=(w,y={day:"numeric",month:"short",year:"numeric"})=>{const k=u(w);return k?k.toLocaleDateString(void 0,y):"Date not set"},h=w=>{const[y,k]=String(w||i).split("-").map(Number);return!y||!k?new Date(s.getFullYear(),s.getMonth(),1):new Date(y,k-1,1)},f=w=>{const y=(w.attendeeIds||[]).map(k=>e.find(P=>P.id===k)?.name||e.find(P=>P.id===k)?.username||"").join(" ");return[w.title,w.date,w.content,y].join(" ").toLowerCase()},g=(w,y="")=>{const k=document.getElementById(w),P=k?k.innerHTML:"",R=d(P);let C=c(R);return!C&&y&&(C=(document.getElementById(y)?.value||"").trim()),{html:R,text:C}},S=(w="",y="")=>{const k=d(w||"");return k||v(y||"").replace(/\n/g,"<br>")};let A=new Set;window.app_toggleNewMinuteForm=()=>{const w=document.getElementById("new-minute-form");if(w&&(w.style.display=w.style.display==="none"?"block":"none",w.style.display==="block")){A=new Set,window.app_refreshAttendeeChips(),document.querySelectorAll('.attendee-grid input[type="checkbox"]').forEach(P=>P.checked=!1);const y=document.getElementById("action-items-container");y&&(y.innerHTML="",window.app_addActionItemRow());const k=document.getElementById("new-minute-content-editor");k&&(k.innerHTML="")}},window.app_refreshMinutesView=async()=>{const w=document.getElementById("page-content");w&&(w.innerHTML=await ns(),window.setTimeout(()=>window.app_filterMinutes(o.searchQuery||""),0))},window.app_minutesExec=(w,y,k=null)=>{const P=document.getElementById(w);P&&(P.focus(),document.execCommand(y,!1,k))},window.app_minutesFormatBlock=(w,y)=>{window.app_minutesExec(w,"formatBlock",y)},window.app_filterAttendees=w=>{const y=w.toLowerCase();document.querySelectorAll(".attendee-item-modern").forEach(k=>{const P=(k.dataset.name||"").toLowerCase();k.style.display=P.includes(y)?"flex":"none"})},window.app_filterMinutes=w=>{o.searchQuery=w||"";const y=o.searchQuery.toLowerCase().trim();let k=0;document.querySelectorAll(".minute-card-modern").forEach(C=>{const B=(C.dataset.searchText||"").toLowerCase(),O=!y||B.includes(y);C.style.display=O?"flex":"none",O&&(k+=1)}),document.querySelectorAll(".minutes-calendar-entry").forEach(C=>{const B=(C.dataset.searchText||"").toLowerCase(),O=!y||B.includes(y);C.style.display=O?"flex":"none"}),document.querySelectorAll(".minutes-calendar-day").forEach(C=>{const B=Array.from(C.querySelectorAll(".minutes-calendar-entry")),O=B.some(U=>U.style.display!=="none"),F=C.querySelector(".minutes-calendar-count");C.classList.toggle("has-visible-meeting",O),F&&(F.textContent=O?`${B.filter(U=>U.style.display!=="none").length} meeting${B.filter(U=>U.style.display!=="none").length===1?"":"s"}`:""),O&&(k+=1)});const P=document.getElementById("minutes-list-empty-state");P&&(P.style.display=k===0?"block":"none");const R=document.getElementById("minutes-calendar-empty-state");R&&(R.style.display=k===0?"block":"none")},window.app_setMinutesView=w=>{o.viewMode=w==="calendar"?"calendar":"list",window.app_refreshMinutesView()},window.app_shiftMinutesMonth=w=>{const y=h(o.monthKey);y.setMonth(y.getMonth()+Number(w||0)),o.monthKey=`${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,"0")}`,window.app_refreshMinutesView()},window.app_toggleAttendeePick=w=>{w.checked?A.add(w.value):A.delete(w.value),window.app_refreshAttendeeChips()},window.app_refreshAttendeeChips=()=>{const w=document.getElementById("minutes-attendee-chips");w&&(w.innerHTML=Array.from(A).map(y=>{const k=e.find(P=>P.id===y);return`
                <div class="chip-modern">
                    <span>${v(k?.name||k?.username||"Unknown")}</span>
                    <i class="fa-solid fa-circle-xmark" onclick="window.app_removeAttendee('${y}')"></i>
                </div>
            `}).join(""))},window.app_removeAttendee=w=>{A.delete(w);const y=document.querySelector(`.attendee-item-modern input[value="${w}"]`);y&&(y.checked=!1),window.app_refreshAttendeeChips()},window.app_addActionItemRow=()=>{const w=document.getElementById("action-items-container");if(!w)return;const y=document.createElement("div");y.className="action-item-row-card",y.innerHTML=`
            <div class="field-group">
                <input type="text" placeholder="What needs to be done?" class="input-premium action-task">
            </div>
            <div class="field-group">
                <select class="input-premium action-assignee">
                    <option value="">Assignee...</option>
                    ${e.map(k=>`<option value="${k.id}">${v(k.name||k.username)}</option>`).join("")}
                </select>
            </div>
            <div class="field-group">
                <input type="date" class="input-premium action-due" value="${new Date().toISOString().split("T")[0]}">
            </div>
            <button type="button" onclick="this.parentElement.remove()" class="icon-btn-danger" style="background:#fee2e2; color:#ef4444; border:none; width:40px; height:40px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `,w.appendChild(y)},window.app_submitNewMinutes=async()=>{const w=document.getElementById("new-minute-title").value.trim(),y=document.getElementById("new-minute-date").value,k=g("new-minute-content-editor","new-minute-content"),P=k.text,R=Array.from(A),C=Array.from(document.querySelectorAll(".action-item-row-card")).map(B=>({task:B.querySelector(".action-task").value.trim(),assignedTo:B.querySelector(".action-assignee").value,dueDate:B.querySelector(".action-due").value,status:"pending"})).filter(B=>B.task);if(!w||!P)return alert("Title and content are required.");try{await window.AppMinutes.addMinute({title:w,date:y,content:P,contentHtml:k.html,attendeeIds:R,actionItems:C}),alert("Meeting minutes recorded!"),window.app_refreshMinutesView()}catch(B){alert("Error saving: "+B.message)}},window.app_requestMinuteAccess=async w=>{try{await window.AppMinutes.requestAccess(w),alert("Access requested!"),window.app_refreshMinutesView()}catch(y){alert("Error: "+y.message)}},window.app_handleMinuteApproval=async w=>{if(confirm("Are you sure you want to approve these minutes? This will lock the record if you are the last attendee to sign."))try{await window.AppMinutes.approveMinute(w),alert("Minutes approved!"),window.app_openMinuteDetails(w),window.app_refreshMinutesView()}catch(y){alert("Error: "+y.message)}},window.app_handleActionItemStatus=async(w,y,k)=>{try{await window.AppMinutes.updateActionItemStatus(w,y,k),alert(`Task marked as ${k}!`),window.app_openMinuteDetails(w)}catch(P){alert("Error: "+P.message)}},window.app_handleAccessDecision=async(w,y,k)=>{try{await window.AppMinutes.handleAccessRequest(w,y,k),alert(`Request ${k}!`),window.app_openMinuteDetails(w)}catch(P){alert("Error: "+P.message)}},window.app_saveMinuteEdits=async w=>{try{const k=(await window.AppMinutes.getMinutes()).find(I=>I.id===w);if(!k)return alert("Minute not found.");const P=window.AppAuth.getUser(),R=k.createdBy===P.id,C=window.app_hasPerm("minutes","admin",P);if(!R&&!C)return alert("Only owner or admin can edit these minutes.");if(k.locked)return alert("This record is locked after final approvals.");const B=document.getElementById("minute-edit-title"),O=document.getElementById("minute-edit-date"),F=g("minute-edit-content-editor","minute-edit-content"),U=(B?.value||"").trim(),W=(O?.value||"").trim(),$=F.text;if(!U||!$)return alert("Title and content are required.");await window.AppMinutes.updateMinute(w,{title:U,date:W||k.date,content:$,contentHtml:F.html},"Edited meeting details"),alert("Minutes updated successfully."),window.app_openMinuteDetails(w),window.app_refreshMinutesView()}catch(y){alert("Error updating minutes: "+y.message)}},window.app_openMinuteDetails=async w=>{const k=(await window.AppMinutes.getMinutes()).find(j=>j.id===w);if(!k)return;if(!r(k))return alert("Access Restricted. Please request access from the list view.");const P=(k.attendeeIds||[]).includes(t.id),R=k.approvals&&k.approvals[t.id],C=k.createdBy===t.id,B=window.app_hasPerm("minutes","admin",t),O=(C||B)&&!k.locked,F=k.createdByName||e.find(j=>j.id===k.createdBy)?.name||"Unknown",U=k.lastEditedByName||F,W=k.lastEditedAt||k.createdAt,$=d(k.contentHtml||p(k.content||"")),I=(k.attendeeIds||[]).map(j=>{const J=e.find(ae=>ae.id===j),Q=k.approvals&&k.approvals[j];return`
                <div class="approval-chip ${Q?"approved":"pending"}">
                    <i class="fa-solid fa-${Q?"check-circle":"clock"}"></i>
                    ${v(J?.name||"Unknown")}
                </div>
            `}).join(""),H=(k.actionItems||[]).map((j,J)=>{const Q=e.find(Ae=>Ae.id===j.assignedTo),ae=j.assignedTo===t.id;return`
                <div class="detail-action-item">
                    <div class="action-status-dot ${j.status||"pending"}"></div>
                    <div class="action-main">
                        <strong>${v(j.task)}</strong>
                        <span class="action-meta">Assigned: ${v(Q?.name||"Unassigned")} | Due: ${j.dueDate||"N/A"}</span>
                    </div>
                    ${ae&&j.status!=="completed"?`
                        <div class="action-btns">
                            ${j.status==="pending"?`<button class="mini-btn" onclick="window.app_handleActionItemStatus('${k.id}', ${J}, 'accepted')">Accept</button>`:""}
                            <button class="mini-btn success" onclick="window.app_handleActionItemStatus('${k.id}', ${J}, 'completed')">Complete</button>
                        </div>
                    `:""}
                </div>
            `}).join(""),L=(k.accessRequests||[]).filter(j=>j.status==="pending").map(j=>`
            <div class="access-request-row">
                <span>${v(j.userName)}</span>
                <div class="req-btns">
                    <button class="mini-btn success" onclick="window.app_handleAccessDecision('${k.id}', '${j.userId}', 'approved')">Approve</button>
                    <button class="mini-btn danger" onclick="window.app_handleAccessDecision('${k.id}', '${j.userId}', 'rejected')">Deny</button>
                </div>
            </div>
        `).join(""),z=(k.auditLog||[]).slice().reverse().map(j=>`
            <div class="access-request-row" style="justify-content:space-between; align-items:flex-start;">
                <div style="display:flex; flex-direction:column; gap:0.2rem;">
                    <strong style="font-size:0.82rem;">${v(j.userName||"Unknown")}</strong>
                    <span style="font-size:0.75rem; color:#64748b;">${v(j.action||"Updated")}</span>
                </div>
                <span style="font-size:0.74rem; color:#64748b; white-space:nowrap;">${j.timestamp?new Date(j.timestamp).toLocaleString():"-"}</span>
            </div>
        `).join(""),q=`
            <div class="modal-overlay" id="minute-detail-modal" style="display:flex;">
                <div class="modal-content minutes-detail-wide">
                    <div class="modal-header">
                        <div>
                            <span class="detail-date">${new Date(k.date).toLocaleDateString()}</span>
                            <h2 style="margin:0; color:#1e1b4b;">${v(k.title)}</h2>
                            <div style="font-size:0.78rem; color:#64748b; margin-top:0.35rem;">
                                Created by ${v(F)} on ${k.createdAt?new Date(k.createdAt).toLocaleString():"-"}
                            </div>
                            <div style="font-size:0.78rem; color:#64748b;">
                                Last edited by ${v(U)} on ${W?new Date(W).toLocaleString():"-"}
                            </div>
                        </div>
                        <button onclick="document.getElementById('minute-detail-modal').remove()" class="close-modal-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-grid">
                            <div class="main-column">
                                <section>
                                    <label><i class="fa-solid fa-file-lines"></i> Discussion & Decisions</label>
                                    ${O?`
                                        <div style="display:grid; gap:0.6rem; margin-top:0.55rem;">
                                            <input id="minute-edit-title" class="input-premium" value="${Oe(k.title||"")}" />
                                            <input id="minute-edit-date" class="input-premium" type="date" value="${Oe(k.date||"")}" />
                                            <textarea id="minute-edit-content" class="textarea-premium" style="display:none;">${v(k.content||"")}</textarea>
                                            <div class="rich-editor-shell">
                                                <div class="rich-editor-toolbar">
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','bold')"><i class="fa-solid fa-bold"></i></button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','italic')"><i class="fa-solid fa-italic"></i></button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesFormatBlock('minute-edit-content-editor','H2')">H2</button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesFormatBlock('minute-edit-content-editor','H3')">H3</button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','insertUnorderedList')"><i class="fa-solid fa-list-ul"></i></button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','insertOrderedList')"><i class="fa-solid fa-list-ol"></i></button>
                                                </div>
                                                <div id="minute-edit-content-editor" class="rich-editor-area" contenteditable="true">${$}</div>
                                            </div>
                                        </div>
                                    `:`<div class="content-text rich-minutes-content">${S(k.contentHtml,k.content)}</div>`}
                                </section>
                                ${H?`
                                <section>
                                    <label><i class="fa-solid fa-list-check"></i> Action Items</label>
                                    <div class="action-items-list">${H}</div>
                                </section>
                                `:""}
                                <section>
                                    <label><i class="fa-solid fa-clock-rotate-left"></i> Edit History</label>
                                    <div class="access-requests-list" style="max-height:230px;">${z||'<p class="empty">No edit history yet.</p>'}</div>
                                </section>
                            </div>
                            <div class="side-column">
                                <section>
                                    <label><i class="fa-solid fa-users-check"></i> Approvals</label>
                                    <div class="approvals-stack">${I||'<p class="empty">No attendees defined</p>'}</div>
                                    ${P&&!R&&!k.locked?`<button class="action-btn wide" onclick="window.app_handleMinuteApproval('${k.id}')" style="margin-top:1rem;">Approve Minutes</button>`:""}
                                </section>
                                ${(C||B)&&L?`
                                <section class="owner-only">
                                    <label><i class="fa-solid fa-key"></i> Access Requests</label>
                                    <div class="access-requests-list">${L}</div>
                                </section>
                                `:""}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${k.locked?'<span class="status-locked-msg"><i class="fa-solid fa-lock"></i> Record Locked (All approved)</span>':""}
                        <div style="flex:1"></div>
                        <button class="action-btn secondary" onclick="document.getElementById('minute-detail-modal').remove()">Close</button>
                        ${O?`<button class="action-btn" onclick="window.app_saveMinuteEdits('${k.id}')">Save Changes</button>`:""}
                        ${C||B?`<button class="action-btn danger" onclick="window.app_deleteMinute('${k.id}')">Delete</button>`:""}
                    </div>
                </div>
            </div>
        `;if(!document.getElementById("modal-container")){const j=document.createElement("div");j.id="modal-container",document.body.appendChild(j)}document.getElementById("modal-container").innerHTML=q},window.app_deleteMinute=async w=>{if(confirm("Are you sure?"))try{await window.AppMinutes.deleteMinute(w),document.getElementById("minute-detail-modal")?.remove(),window.app_refreshMinutesView()}catch(y){alert("Error: "+y.message)}};const b=[...a].sort((w,y)=>{const k=u(w.date)?.getTime()||0;return(u(y.date)?.getTime()||0)-k}),x=h(o.monthKey),D=x.toLocaleDateString(void 0,{month:"long",year:"numeric"}),T=new Date(x.getFullYear(),x.getMonth(),1),_=new Date(T);_.setDate(T.getDate()-T.getDay());const E=Array.from({length:42},(w,y)=>{const k=new Date(_);return k.setDate(_.getDate()+y),k}),M=b.reduce((w,y)=>{const k=u(y.date);if(!k)return w;const P=`${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;return w[P]||(w[P]=[]),w[P].push(y),w},{});return window.setTimeout(()=>window.app_filterMinutes(o.searchQuery||""),0),`
        <div class="minutes-container">
            <style>
                :root {
                    --minutes-primary: #4f46e5;
                    --minutes-secondary: #6366f1;
                    --minutes-bg: #f8fafc;
                    --minutes-card-bg: #ffffff;
                    --minutes-text: #1e293b;
                    --minutes-muted: #64748b;
                    --minutes-border: #e2e8f0;
                    --minutes-success: #10b981;
                    --minutes-danger: #ef4444;
                    --minutes-warning: #f59e0b;
                    --minutes-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
                }

                .minutes-container {
                    padding: 0.5rem;
                    color: var(--minutes-text);
                    font-family: 'Manrope', sans-serif;
                }

                .minutes-header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 2.5rem;
                    border-bottom: 1px solid var(--minutes-border);
                    padding-bottom: 1.5rem;
                }

                .minutes-header-info h2 {
                    font-family: 'Sora', sans-serif;
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 0.5rem;
                }

                .minutes-header-info p {
                    color: var(--minutes-muted);
                    font-size: 0.95rem;
                }

                .btn-record-meeting {
                    background: var(--minutes-primary);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
                }

                .btn-record-meeting:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
                    background: var(--minutes-secondary);
                }

                .minutes-view-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .minutes-toggle-group {
                    display: inline-flex;
                    padding: 0.3rem;
                    border-radius: 14px;
                    background: #eef2ff;
                    border: 1px solid #c7d2fe;
                }

                .minutes-toggle-btn {
                    border: none;
                    background: transparent;
                    color: #4338ca;
                    padding: 0.65rem 1rem;
                    border-radius: 10px;
                    font-weight: 800;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.55rem;
                }

                .minutes-toggle-btn.active {
                    background: #fff;
                    color: #1e1b4b;
                    box-shadow: 0 8px 18px rgba(79, 70, 229, 0.12);
                }

                /* Form Styling */
                .form-glass-card {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 20px;
                    padding: 2.5rem;
                    margin-bottom: 3rem;
                    box-shadow: var(--minutes-shadow);
                    animation: slideDown 0.4s ease-out;
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .form-section-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .form-section-header h3 {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #0f172a;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    margin-bottom: 2rem;
                }

                .field-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .field-label {
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: var(--minutes-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .input-premium {
                    background: white;
                    border: 2px solid var(--minutes-border);
                    border-radius: 12px;
                    padding: 0.875rem 1rem;
                    font-size: 1rem;
                    transition: border-color 0.2s;
                    outline: none;
                }

                .input-premium:focus {
                    border-color: var(--minutes-primary);
                }

                /* Attendee Picker */
                .attendee-picker-container {
                    background: #f1f5f9;
                    border-radius: 12px;
                    padding: 0.9rem;
                    margin-bottom: 2rem;
                }

                .attendee-chips-wrapper {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.35rem;
                    margin-bottom: 1rem;
                    min-height: 28px;
                }

                .chip-modern {
                    background: var(--minutes-primary);
                    color: white;
                    padding: 0.2rem 0.55rem;
                    border-radius: 999px;
                    font-size: 0.78rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
                    animation: fadeIn 0.2s ease-out;
                }

                .chip-modern i {
                    cursor: pointer;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }

                .chip-modern i:hover {
                    opacity: 1;
                }

                .search-staff-input {
                    width: 100%;
                    background: white;
                    border: 1px solid var(--minutes-border);
                    border-radius: 10px;
                    padding: 0.45rem 0.7rem;
                    margin-bottom: 1rem;
                    font-size: 0.82rem;
                }

                .attendee-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
                    gap: 0.5rem;
                    max-height: 150px;
                    overflow-y: auto;
                    padding-right: 0.5rem;
                }

                .attendee-item-modern {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: white;
                    padding: 0.48rem 0.6rem;
                    border-radius: 10px;
                    border: 1px solid var(--minutes-border);
                    cursor: pointer;
                    transition: all 0.2s;
                    user-select: none;
                }

                .attendee-item-modern:hover {
                    border-color: var(--minutes-secondary);
                    background: #f8fafc;
                }

                .attendee-item-modern input {
                    width: 15px;
                    height: 15px;
                    cursor: pointer;
                }

                .attendee-item-modern span {
                    font-size: 0.82rem;
                    font-weight: 500;
                    color: var(--minutes-text);
                }

                /* Discussion Area */
                .discussion-area {
                    margin-bottom: 2rem;
                }

                .textarea-premium {
                    width: 100%;
                    min-height: 180px;
                    background: white;
                    border: 2px solid var(--minutes-border);
                    border-radius: 12px;
                    padding: 1.25rem;
                    font-size: 1rem;
                    line-height: 1.6;
                    outline: none;
                    resize: vertical;
                    transition: border-color 0.2s;
                }

                .textarea-premium:focus {
                    border-color: var(--minutes-primary);
                }

                .rich-editor-shell {
                    border: 2px solid var(--minutes-border);
                    border-radius: 12px;
                    background: #fff;
                    overflow: hidden;
                }

                .rich-editor-toolbar {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.35rem;
                    padding: 0.65rem;
                    border-bottom: 1px solid var(--minutes-border);
                    background: #f8fafc;
                }

                .rich-editor-btn {
                    border: 1px solid #cbd5e1;
                    background: #fff;
                    color: #0f172a;
                    border-radius: 8px;
                    min-width: 34px;
                    height: 32px;
                    padding: 0 0.55rem;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                }

                .rich-editor-btn:hover {
                    border-color: var(--minutes-primary);
                    color: var(--minutes-primary);
                }

                .rich-editor-area {
                    min-height: 180px;
                    padding: 1rem;
                    outline: none;
                    line-height: 1.6;
                    font-size: 0.95rem;
                }

                .rich-editor-area:empty:before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                }

                .rich-editor-area h2,
                .rich-minutes-content h2 {
                    font-size: 1.2rem;
                    margin: 0.55rem 0;
                }

                .rich-editor-area h3,
                .rich-minutes-content h3 {
                    font-size: 1.05rem;
                    margin: 0.45rem 0;
                }

                .rich-editor-area ul,
                .rich-editor-area ol,
                .rich-minutes-content ul,
                .rich-minutes-content ol {
                    margin: 0.45rem 0 0.45rem 1.1rem;
                }

                .rich-minutes-content p {
                    margin: 0.4rem 0;
                }

                /* Action Items */
                .action-items-section {
                    margin-bottom: 2.5rem;
                }

                .action-item-row-card {
                    display: grid;
                    grid-template-columns: 1fr 200px 160px auto;
                    gap: 1rem;
                    background: white;
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid var(--minutes-border);
                    margin-bottom: 0.75rem;
                    align-items: center;
                    animation: slideRight 0.3s ease-out;
                }

                @keyframes slideRight {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .btn-add-task {
                    background: #f1f5f9;
                    color: var(--minutes-primary);
                    border: 2px dashed var(--minutes-primary);
                    padding: 0.75rem;
                    border-radius: 12px;
                    width: 100%;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .btn-add-task:hover {
                    background: #eef2ff;
                    border-style: solid;
                }

                .form-footer-modern {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    border-top: 1px solid var(--minutes-border);
                    padding-top: 2rem;
                }

                .btn-secondary-modern {
                    background: #f1f5f9;
                    color: var(--minutes-muted);
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-secondary-modern:hover {
                    background: #e2e8f0;
                    color: var(--minutes-text);
                }

                .minute-card-modern {
                    background: var(--minutes-card-bg);
                    border-radius: 20px;
                    border: 1px solid var(--minutes-border);
                    padding: 1.75rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .minute-card-modern:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    border-color: var(--minutes-primary);
                }

                .minutes-list-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.25rem;
                }

                .minute-card-status {
                    position: absolute;
                    top: 1.5rem;
                    right: 1.5rem;
                }

                .card-date-badge {
                    display: inline-block;
                    background: #f1f5f9;
                    color: var(--minutes-muted);
                    padding: 0.35rem 0.75rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                }

                .card-title-modern {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 1rem;
                    line-height: 1.4;
                }

                .card-metrics {
                    display: flex;
                    gap: 1.25rem;
                    margin-top: auto;
                    padding-top: 1.5rem;
                    border-top: 1px solid #f1f5f9;
                }

                .metric-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    color: var(--minutes-muted);
                    font-weight: 600;
                }

                .metric-item i {
                    color: var(--minutes-primary);
                }

                .restricted-tag {
                    background: #fef2f2;
                    color: #991b1b;
                    padding: 1rem;
                    border-radius: 12px;
                    font-size: 0.875rem;
                    text-align: center;
                    margin-top: 1.5rem;
                    font-weight: 600;
                }

                .empty-state-modern {
                    grid-column: 1 / -1;
                    padding: 5rem;
                    text-align: center;
                    background: white;
                    border-radius: 20px;
                    border: 2px dashed var(--minutes-border);
                }

                .empty-state-modern i {
                    font-size: 4rem;
                    color: var(--minutes-border);
                    margin-bottom: 1.5rem;
                }

                .empty-state-modern h4 {
                    font-size: 1.5rem;
                    color: var(--minutes-muted);
                    font-weight: 700;
                }

                .minutes-calendar-shell {
                    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                    border: 1px solid var(--minutes-border);
                    border-radius: 24px;
                    padding: 1.25rem;
                    box-shadow: var(--minutes-shadow);
                }

                .minutes-calendar-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    flex-wrap: wrap;
                }

                .minutes-calendar-month {
                    font-family: 'Sora', sans-serif;
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: #0f172a;
                }

                .minutes-month-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.65rem;
                }

                .minutes-month-btn {
                    width: 40px;
                    height: 40px;
                    border: 1px solid #cbd5e1;
                    background: #fff;
                    border-radius: 12px;
                    cursor: pointer;
                    color: #334155;
                }

                .minutes-calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, minmax(0, 1fr));
                    gap: 0.75rem;
                }

                .minutes-calendar-weekday {
                    text-align: center;
                    font-size: 0.78rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--minutes-muted);
                    padding: 0.35rem 0;
                }

                .minutes-calendar-day {
                    min-height: 150px;
                    padding: 0.85rem;
                    border-radius: 18px;
                    border: 1px solid #dbe4f0;
                    background: #fff;
                    display: flex;
                    flex-direction: column;
                    gap: 0.65rem;
                }

                .minutes-calendar-day.is-outside-month {
                    background: #f8fafc;
                    opacity: 0.65;
                }

                .minutes-calendar-day.is-today {
                    border-color: #818cf8;
                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12);
                }

                .minutes-calendar-day.has-visible-meeting {
                    background: linear-gradient(180deg, #ffffff 0%, #eef2ff 100%);
                }

                .minutes-calendar-dayhead {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 0.5rem;
                }

                .minutes-calendar-date {
                    font-weight: 800;
                    color: #0f172a;
                }

                .minutes-calendar-count {
                    font-size: 0.72rem;
                    color: var(--minutes-muted);
                }

                .minutes-calendar-items {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .minutes-calendar-entry {
                    border: 1px solid #c7d2fe;
                    background: rgba(238, 242, 255, 0.9);
                    border-radius: 14px;
                    padding: 0.65rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                }

                .minutes-calendar-entry.clickable {
                    cursor: pointer;
                }

                .minutes-calendar-entry-title {
                    font-size: 0.84rem;
                    font-weight: 800;
                    color: #312e81;
                    line-height: 1.35;
                }

                .minutes-calendar-entry-meta {
                    display: flex;
                    justify-content: space-between;
                    gap: 0.5rem;
                    font-size: 0.72rem;
                    color: #475569;
                }

                .minutes-calendar-restricted {
                    margin-top: 0.2rem;
                    border: none;
                    background: #fff;
                    color: #991b1b;
                    border-radius: 10px;
                    padding: 0.45rem 0.55rem;
                    font-size: 0.72rem;
                    font-weight: 700;
                    cursor: pointer;
                }

                .minutes-no-results {
                    margin-top: 1rem;
                    padding: 1rem 1.25rem;
                    border-radius: 16px;
                    background: #fff7ed;
                    border: 1px solid #fed7aa;
                    color: #9a3412;
                    font-weight: 700;
                    display: none;
                }

                @media (max-width: 768px) {
                    .form-row { grid-template-columns: 1fr; gap: 1rem; }
                    .form-glass-card { padding: 1rem; }
                    .action-item-row-card { grid-template-columns: 1fr; padding: 1rem; }
                    .minutes-header-section { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .btn-record-meeting { width: 100%; justify-content: center; }
                    .minutes-view-controls { width: 100%; }
                    .minutes-toggle-group { width: 100%; justify-content: space-between; }
                    .minutes-toggle-btn { flex: 1; justify-content: center; }
                    .rich-editor-toolbar { gap: 0.25rem; padding: 0.45rem; }
                    .rich-editor-btn { min-width: 30px; height: 30px; font-size: 0.78rem; }
                    .rich-editor-area { font-size: 0.88rem; min-height: 140px; }
                    .attendee-picker-container { padding: 0.7rem; }
                    .attendee-grid { grid-template-columns: 1fr; max-height: 170px; }
                    .minutes-list-header { flex-direction: column; align-items: stretch !important; gap: 1rem; }
                    .minutes-calendar-grid { gap: 0.5rem; }
                    .minutes-calendar-day { min-height: 130px; padding: 0.7rem; }
                }
            </style>

            <div class="minutes-header-section">
                <div class="minutes-header-info">
                    <h2>Meeting Minutes</h2>
                    <p>Document decisions and track team accountability.</p>
                </div>
                <div class="minutes-view-controls">
                    <div class="minutes-toggle-group">
                        <button class="minutes-toggle-btn ${o.viewMode==="list"?"active":""}" onclick="window.app_setMinutesView('list')">
                            <i class="fa-solid fa-table-list"></i>
                            List View
                        </button>
                        <button class="minutes-toggle-btn ${o.viewMode==="calendar"?"active":""}" onclick="window.app_setMinutesView('calendar')">
                            <i class="fa-solid fa-calendar-days"></i>
                            Month View
                        </button>
                    </div>
                    <button class="btn-record-meeting" onclick="window.app_toggleNewMinuteForm()">
                        <i class="fa-solid fa-plus-circle"></i>
                        Record Meeting
                    </button>
                </div>
            </div>

            <div id="new-minute-form" class="form-glass-card" style="display:none;">
                <div class="form-section-header">
                    <div style="background: var(--minutes-primary); color: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid fa-microphone-lines"></i>
                    </div>
                    <h3>Record New Meeting Details</h3>
                </div>

                <div class="form-row">
                    <div class="field-group">
                        <label class="field-label">Meeting Title</label>
                        <input type="text" id="new-minute-title" class="input-premium" placeholder="e.g. Monthly Strategy Review">
                    </div>
                    <div class="field-group">
                        <label class="field-label">Date</label>
                        <input type="date" id="new-minute-date" class="input-premium" value="${new Date().toISOString().split("T")[0]}">
                    </div>
                </div>

                <div class="field-group" style="margin-bottom: 2rem;">
                    <label class="field-label">Required Approvers & Attendees</label>
                    <div class="attendee-picker-container">
                        <div id="minutes-attendee-chips" class="attendee-chips-wrapper"></div>
                        <div style="position: relative;">
                            <i class="fa-solid fa-search" style="position: absolute; left: 0.75rem; top: 0.55rem; color: var(--minutes-muted);"></i>
                            <input type="text" placeholder="Search staff members..." oninput="window.app_filterAttendees(this.value)" class="search-staff-input" style="padding-left: 2.2rem;">
                        </div>
                        <div class="attendee-grid">
                            ${e.map(w=>`
                                <label class="attendee-item-modern" data-name="${Oe(w.name||w.username)}">
                                    <input type="checkbox" value="${w.id}" onchange="window.app_toggleAttendeePick(this)">
                                    <span>${v(w.name||w.username)}</span>
                                </label>
                            `).join("")}
                        </div>
                    </div>
                </div>

                <div class="discussion-area">
                    <label class="field-label" style="margin-bottom: 0.75rem; display: block;">Discussion & Key Decisions</label>
                    <textarea id="new-minute-content" class="textarea-premium" placeholder="Summarize what was discussed and the final decisions made..." style="display:none;"></textarea>
                    <div class="rich-editor-shell">
                        <div class="rich-editor-toolbar">
                            <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('new-minute-content-editor','bold')"><i class="fa-solid fa-bold"></i></button>
                            <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('new-minute-content-editor','italic')"><i class="fa-solid fa-italic"></i></button>
                            <button type="button" class="rich-editor-btn" onclick="window.app_minutesFormatBlock('new-minute-content-editor','H2')">H2</button>
                            <button type="button" class="rich-editor-btn" onclick="window.app_minutesFormatBlock('new-minute-content-editor','H3')">H3</button>
                            <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('new-minute-content-editor','insertUnorderedList')"><i class="fa-solid fa-list-ul"></i></button>
                            <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('new-minute-content-editor','insertOrderedList')"><i class="fa-solid fa-list-ol"></i></button>
                        </div>
                        <div id="new-minute-content-editor" class="rich-editor-area" contenteditable="true" data-placeholder="Summarize what was discussed and the final decisions made..."></div>
                    </div>
                </div>

                <div class="action-items-section">
                    <label class="field-label" style="margin-bottom: 1rem; display: block;">Action Items & Accountability</label>
                    <div id="action-items-container"></div>
                    <button type="button" onclick="window.app_addActionItemRow()" class="btn-add-task">
                        <i class="fa-solid fa-plus-circle"></i>
                        Add New Action Item
                    </button>
                </div>

                <div class="ngo-plans-section">
                    <div class="form-section-header">
                        <i class="fa-solid fa-calendar-star" style="color:#db2777; font-size:1.5rem;"></i>
                        <h3>Schedule NGO Activities</h3>
                    </div>
                    <div class="minutes-calendar-widget-wrapper">
                        ${Ta(n)}
                    </div>
                </div>

                <div class="form-footer-modern">
                    <button class="btn-secondary-modern" onclick="window.app_toggleNewMinuteForm()">Dismiss</button>
                    <button class="btn-record-meeting" onclick="window.app_submitNewMinutes()">Create Meeting Record</button>
                </div>
            </div>

            <div class="minutes-list-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; margin-top: 2rem;">
                <h3 style="margin:0; font-family:'Sora'; font-weight:800; color:#0f172a;">${o.viewMode==="calendar"?"Monthly Meeting Calendar":"Recent Meetings"}</h3>
                <div style="position: relative; width: 300px;">
                    <i class="fa-solid fa-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--minutes-muted);"></i>
                    <input type="text" placeholder="Search meetings..." value="${Oe(o.searchQuery||"")}" oninput="window.app_filterMinutes(this.value)" class="input-premium" style="padding-left: 2.75rem; width: 100%; padding-top: 0.6rem; padding-bottom: 0.6rem; font-size: 0.9rem;">
                </div>
            </div>

            ${o.viewMode==="calendar"?`
                <div class="minutes-calendar-shell">
                    <div class="minutes-calendar-toolbar">
                        <div>
                            <div class="minutes-calendar-month">${D}</div>
                            <div style="font-size:0.85rem; color:var(--minutes-muted);">Browse every meeting record in a monthly calendar format.</div>
                        </div>
                        <div class="minutes-month-actions">
                            <button class="minutes-month-btn" onclick="window.app_shiftMinutesMonth(-1)" aria-label="Previous month">
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>
                            <button class="minutes-month-btn" onclick="window.app_shiftMinutesMonth(1)" aria-label="Next month">
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    <div class="minutes-calendar-grid">
                        ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(w=>`<div class="minutes-calendar-weekday">${w}</div>`).join("")}
                        ${E.map(w=>{const y=`${w.getFullYear()}-${String(w.getMonth()+1).padStart(2,"0")}-${String(w.getDate()).padStart(2,"0")}`,k=M[y]||[],P=w.getMonth()===x.getMonth(),R=w.toDateString()===s.toDateString();return`
                                <div class="minutes-calendar-day ${P?"":"is-outside-month"} ${R?"is-today":""} ${k.length?"has-visible-meeting":""}">
                                    <div class="minutes-calendar-dayhead">
                                        <span class="minutes-calendar-date">${w.getDate()}</span>
                                        <span class="minutes-calendar-count">${k.length?`${k.length} meeting${k.length===1?"":"s"}`:""}</span>
                                    </div>
                                    <div class="minutes-calendar-items">
                                        ${k.map(C=>{const B=r(C),O=l(C);return`
                                                <div class="minutes-calendar-entry ${B?"clickable":""}" data-search-text="${Oe(f(C))}" ${B?`onclick="window.app_openMinuteDetails('${C.id}')"`:""}>
                                                    <div class="minutes-calendar-entry-title">${v(C.title)}</div>
                                                    <div class="minutes-calendar-entry-meta">
                                                        <span>${C.attendeeIds?.length||0} attendees</span>
                                                        <span>${C.locked?"Locked":"Open"}</span>
                                                    </div>
                                                    ${B?"":`
                                                        <button class="minutes-calendar-restricted" onclick="event.stopPropagation(); window.app_requestMinuteAccess('${C.id}')">
                                                            ${O==="pending"?"Access Pending":O==="rejected"?"Access Denied":"Request Access"}
                                                        </button>
                                                    `}
                                                </div>
                                            `}).join("")}
                                    </div>
                                </div>
                            `}).join("")}
                    </div>
                    <div id="minutes-calendar-empty-state" class="minutes-no-results">No meetings match this search in ${D}.</div>
                </div>
            `:`
            <div class="minutes-list-container">
                ${b.length?b.map(w=>{const y=r(w),k=l(w);return`
                        <div class="minute-card-modern ${y?"clickable":""}" data-search-text="${Oe(f(w))}" ${y?`onclick="window.app_openMinuteDetails('${w.id}')"`:""}>
                            <div class="card-date-badge">${m(w.date)}</div>
                            
                            <div class="minute-card-status">
                                ${w.locked?'<span style="background:#dcfce7; color:#166534; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:700;"><i class="fa-solid fa-lock" style="margin-right:0.35rem;"></i>Locked</span>':'<span style="background:#fff7ed; color:#9a3412; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:700;">Open</span>'}
                            </div>

                            <h4 class="card-title-modern">${v(w.title)}</h4>
                            
                            <div class="card-metrics">
                                <div class="metric-item">
                                    <i class="fa-solid fa-users"></i>
                                    ${w.attendeeIds?.length||0} Attendees
                                </div>
                                <div class="metric-item">
                                    <i class="fa-solid fa-check-circle"></i>
                                    ${w.actionItems?.length||0} Tasks
                                </div>
                            </div>

                            ${y?"":`
                                <div class="restricted-tag">
                                    <i class="fa-solid fa-shield-halved" style="margin-right: 0.5rem;"></i>
                                    Access Restricted
                                    ${k==="pending"?'<div style="margin-top:0.5rem; font-size:0.7rem; color:#f59e0b;">Request Pending Review</div>':k==="rejected"?'<div style="margin-top:0.5rem; font-size:0.7rem; color:#ef4444;">Access Denied</div>':`<button class="mini-btn" style="margin-top:0.75rem; width:100%; border-color:#991b1b; color:#991b1b;" onclick="window.app_requestMinuteAccess('${w.id}')">Request View Access</button>`}
                                </div>
                            `}
                        </div>
                    `}).join(""):`
                    <div class="empty-state-modern">
                        <i class="fa-solid fa-file-invoice"></i>
                        <h4>No Meeting Minutes Recorded Yet</h4>
                        <p style="color:var(--minutes-muted); margin-top:0.5rem;">Click "Record Meeting" to document your first session.</p>
                    </div>
                `}
            </div>
            <div id="minutes-list-empty-state" class="minutes-no-results">No meetings match this search.</div>
            `}
        </div>
    `}function Ti(a=[]){let e="";a&&a.length>0&&(e=`
            <div style="margin-bottom:1.5rem; padding-bottom:1.5rem; border-bottom:1px dashed #cbd5e1;">
                 <label style="display:block; font-size:0.85rem; font-weight:700; color:#334155; margin-bottom:0.75rem;">📋 Your Planned Tasks</label>
                 <div style="max-height:150px; overflow-y:auto; padding-right:4px;">
                    ${a.map(i=>`<div style="padding:8px 12px; background:#f0f9ff; border-left:3px solid #0284c7; border-radius:6px; font-size:0.9rem; color:#0c4a6e; margin-bottom:8px;">
                <span style="font-weight:600;">•</span> ${v(i.task)}
                ${i.subPlans&&i.subPlans.length>0?`<div style="font-size:0.8rem; color:#0369a1; margin-left:12px; margin-top:2px;">+ ${i.subPlans.length} sub-tasks</div>`:""}
             </div>`).join("")}
                 </div>
            </div>
        `);const t=a&&a.length>0?"✨ Add another task? (Optional)":"📝 What's your main focus today?",n=a&&a.length>0?"":"required";return`
    <div class="modal-overlay" id="checkin-modal" style="display:flex;">
        <div class="modal-content" style="max-width: 500px; width: 95%; padding: 1.5rem; border-radius: 16px;">
             <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.3);">
                        <i class="fa-solid fa-user-check" style="color:white; font-size:1.1rem;"></i>
                    </div>
                    <div>
                        <h3 style="font-size: 1.2rem; margin:0; font-weight:700; color:#111827;">Start Your Day</h3>
                        <p style="font-size:0.8rem; color:#64748b; margin:0.25rem 0 0 0;">Set your goal and check in</p>
                    </div>
                </div>
                <button onclick="document.getElementById('checkin-modal').remove()" style="background:#f1f5f9; border:none; width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; transition: all 0.2s;">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>

            <form onsubmit="window.app_submitCheckIn(event)">
                ${e}
                <div style="margin-bottom:1.25rem;">
                     <label style="display:block; font-size:0.85rem; font-weight:700; color:#334155; margin-bottom:0.5rem;">${t}</label>
                     <div style="position:relative;">
                        <textarea id="checkin-task" ${n} placeholder="e.g. Complete the monthly financial report..." style="width:100%; height:80px; padding:0.75rem; border:2px solid #e2e8f0; border-radius:10px; font-family:inherit; resize:none; font-size:0.95rem; line-height:1.5; transition: border-color 0.2s;"></textarea>
                     </div>
                </div>

                <div style="display:flex; gap:1rem;">
                    <button type="button" onclick="document.getElementById('checkin-modal').remove()" style="flex:1; padding:0.75rem; background:white; border:1px solid #e2e8f0; color:#64748b; border-radius:10px; font-weight:600; cursor:pointer;">Cancel</button>
                    <button type="submit" style="flex:2; padding:0.75rem; background:linear-gradient(135deg, #16a34a 0%, #15803d 100%); border:none; color:white; border-radius:10px; font-weight:700; cursor:pointer; box-shadow:0 4px 6px -1px rgba(22, 163, 74, 0.4);">
                        <span>🚀 Confirm & Check In</span>
                    </button>
                </div>
            </form>
        </div>
    </div>`}function Ii(){if(typeof window>"u")return;const a=new MutationObserver(t=>{t.forEach(()=>{const n=document.getElementById("checkout-modal"),s=document.getElementById("checkout-intro-panel");n&&s&&n.style.display!=="none"&&(localStorage.getItem("checkoutIntroSeen")||(s.style.display="block"))})}),e=()=>{const t=document.body;t&&a.observe(t,{attributes:!0,subtree:!0,attributeFilter:["style"]})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e):e()}typeof window<"u"&&Ii();function Mi(){return`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 2rem;">
            <div class="card" style="width: 100%; max-width: 400px; text-align: center;">
                <div class="logo-circle" style="width: 60px; height: 60px; margin: 0 auto 1.5rem auto;">
                    <img src="https://ui-avatars.com/api/?name=CRWI&background=random" alt="Logo">
                </div>
                <h2 style="margin-bottom: 0.5rem;">CRWI Attendance</h2>
                <p class="text-muted" style="margin-bottom: 2rem;">Please sign in to continue</p>
                
                <form id="login-form" style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
                    <div>
                        <label style="font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem; display: block;">Login ID / Email</label>
                        <input type="text" name="username" placeholder="Enter Login ID" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem;">
                    </div>
                    <div>
                        <label style="font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem; display: block;">Password</label>
                        <input type="password" name="password" placeholder="Enter Password" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem;">
                    </div>
                    
                    <button type="submit" class="action-btn" style="margin-top: 1rem; width: 100%;">Sign In</button>
                </form>
                
                <p style="margin-top: 2rem; font-size: 0.85rem; color: #6b7280;">
                    Contact Admin for login credentials.
                </p>
            </div>
        </div>
     `}function Ci(){return window.AppAuth?.getUser()?`
        <!-- Check-Out Modal -->
        <div id="checkout-modal" class="modal-overlay checkout-main-modal" style="display: none;">
            <div class="modal-content checkout-main-content" style="width: 100%; max-width: 620px;">
                <h3 style="margin-bottom: 1rem;">Check Out</h3>
                <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem;">Work summary is optional for completed tasks, but required if you postpone or delegate anything during check-out.</p>
                <form id="checkout-form" novalidate>
                    <textarea name="description" placeholder="- Completed monthly report&#10;- Fixed login bug..." style="width: 100%; height: 120px; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; resize: none; font-family: inherit; margin-bottom: 1.5rem;"></textarea>
                    <div id="checkout-plan-ref" style="display:none; background:#f0f9ff; padding:12px; border-radius:10px; border:1px solid #bae6fd; margin-bottom:1.5rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <label style="font-size:0.7rem; font-weight:800; color:#0369a1; text-transform:uppercase; letter-spacing:0.5px;">Today's Work Plan</label>
                            <button type="button" onclick="window.app_useWorkPlan()" style="background:#0284c7; color:white; border:none; padding:3px 8px; border-radius:4px; font-size:0.65rem; font-weight:600; cursor:pointer;">Use This</button>
                        </div>
                        <div id="checkout-plan-text" style="font-size:0.85rem; color:#0c4a6e; line-height:1.4;"></div>
                    </div>

                    <!-- Work Plan Checklist (New for Checkout Flow) -->
                    <div id="checkout-task-checklist" style="margin-bottom: 1.5rem;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #4b5563; margin-bottom: 0.75rem;">Today's Task Status</label>
                        <div id="checkout-task-list" style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 200px; overflow-y: auto; padding-right: 5px;">
                            <!-- Populated by JS -->
                        </div>
                    </div>

                    <!-- Action Preview (Inline Summary) -->
                    <div id="checkout-action-preview" style="margin-bottom: 1.5rem; display: none;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #4b5563; margin-bottom: 0.75rem;">Action Preview</label>
                        <div id="checkout-action-preview-list" class="checkout-action-preview-list">
                            <!-- Populated by JS -->
                        </div>
                    </div>

                    <!-- Delegate Selection Panel (Initially Hidden) -->
                    <div id="delegate-panel" style="display:none; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:1rem; margin-bottom:1.5rem;">
                        <h4 id="delegate-selected-task" style="font-size:0.8rem; color:#1e293b; margin-top:0; margin-bottom:0.75rem; line-height:1.4;"></h4>
                        <label style="display:block; font-size:0.75rem; font-weight:600; color:#64748b; margin-bottom:0.5rem;">Choose staff member:</label>
                        <div id="delegate-list" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:0.5rem; max-height:180px; overflow-y:auto; padding:2px;">
                            <!-- Populated by JS -->
                        </div>
                        <div style="margin-top:1rem; display:flex; justify-content:flex-end;">
                            <button type="button" onclick="window.app_handleChecklistAction(null, null, null)" class="action-btn secondary" style="font-size:0.75rem; padding:0.4rem 0.8rem;">Cancel Delegation</button>
                        </div>
                    </div>
                    
                    <!-- Plan for Tomorrow -->
                    <div style="margin-bottom:1.5rem;">
                        <label style="display:block; font-size:0.85rem; font-weight:700; color:#4b5563; margin-bottom:0.5rem;">🗓️ What's your top goal for tomorrow? (Optional)</label>
                        <textarea name="tomorrowGoal" placeholder="e.g., Finalize the project report..." style="width:100%; height:60px; padding:0.75rem; border:1px solid #d1d5db; border-radius:0.5rem; resize:none; font-family:inherit;"></textarea>
                    </div>

                    <div id="checkout-location-loading" style="display:none; font-size:0.75rem; color:#6b7280; margin-bottom:1rem; text-align:center;">
                         <i class="fa-solid fa-spinner fa-spin"></i> Verifying location...
                    </div>
                    <div id="checkout-location-mismatch" style="display:none; background:#fff1f2; padding:12px; border-radius:10px; border:1px solid #fecaca; margin-bottom:1.5rem;">
                         <div style="color:#991b1b; font-size:0.85rem; font-weight:700; display:flex; gap:6px; align-items:center; margin-bottom:4px;">
                            <i class="fa-solid fa-triangle-exclamation"></i> Location Mismatch
                         </div>
                         <p style="font-size:0.8rem; color:#7f1d1d; margin-bottom:0.75rem;">You are checking out from a different location than where you checked in. Please explain:</p>
                         <textarea name="locationExplanation" placeholder="e.g. Field visit, Client site..." style="width:100%; height:60px; padding:0.5rem; border:1px solid #fecaca; border-radius:6px; font-size:0.85rem; resize:none; font-family:inherit;"></textarea>
                    </div>

                    <div style="display: flex; gap: 1rem;">
                        <button type="button" onclick="document.getElementById('checkout-modal').style.display = 'none'" style="flex: 1; padding: 0.75rem; background: white; border: 1px solid #d1d5db; border-radius: 0.5rem; cursor: pointer;">Cancel</button>
                        <button type="submit" class="action-btn" style="flex: 1; justify-content: center;">Complete Check-Out</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Add Log Modal (Modern) -->
        <div id="log-modal" class="modal-overlay" style="display: none;">
            <div class="modal-content" style="width: 100%; max-width: 500px; padding: 0;">
                <div style="padding: 1.5rem; border-bottom: 1px solid #f3f4f6;">
                    <h3 style="margin: 0;">New Time Entry</h3>
                    <p style="color: #6b7280; font-size: 0.9rem; margin-top: 0.25rem;">Log past or off-site work</p>
                </div>
                
                <form id="manual-log-form" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
                    <div>
                        <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Date</label>
                        <input type="date" name="date" id="log-date" required style="width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; background: #f9fafb; font-family: inherit;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Start Time</label>
                            <input type="time" name="checkIn" id="log-start-time" required style="width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; background: #fff; font-family: inherit;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">End Time</label>
                            <input type="time" name="checkOut" id="log-end-time" required style="width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; background: #fff; font-family: inherit;">
                        </div>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Quick Duration</label>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <button type="button" class="chip-btn" onclick="document.dispatchEvent(new CustomEvent('set-duration', {detail: 30}))">30m</button>
                            <button type="button" class="chip-btn" onclick="document.dispatchEvent(new CustomEvent('set-duration', {detail: 60}))">1h</button>
                            <button type="button" class="chip-btn" onclick="document.dispatchEvent(new CustomEvent('set-duration', {detail: 240}))">4h</button>
                            <button type="button" class="chip-btn" onclick="document.dispatchEvent(new CustomEvent('set-duration', {detail: 480}))">8h</button>
                        </div>
                    </div>

                     <div>
                        <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Activity Type</label>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
                            <button type="button" class="chip-btn" onclick="document.getElementById('log-location').value = 'Work - Home'">🏠 Work - Home</button>
                            <button type="button" class="chip-btn" onclick="document.getElementById('log-location').value = 'Training'">🎓 Training</button>
                            <button type="button" class="chip-btn" onclick="document.getElementById('log-location').value = 'Client Visit'">🤝 Client Visit</button>
                            <button type="button" class="chip-btn" onclick="document.getElementById('log-location').value = 'Field Work'">🚧 Field Work</button>
                        </div>
                        <input type="text" name="location" id="log-location" placeholder="Or type activity description..." required style="width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
                    </div>

                    <div style="display: flex; gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f3f4f6;">
                        <button type="button" onclick="document.getElementById('log-modal').style.display = 'none'" style="flex: 1; padding: 0.75rem; border: 1px solid #e5e7eb; background: white; border-radius: 0.5rem; cursor: pointer; color: #374151; font-weight: 500;">Cancel</button>
                        <button type="submit" class="action-btn" style="flex: 2; padding: 0.75rem; border-radius: 0.5rem;">
                            <i class="fa-solid fa-check"></i> Save Entry
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Request Leave Modal -->
        <div id="leave-modal" class="modal-overlay" style="display: none;">
            <div class="modal-content" style="width: 100%; max-width: 500px;">
                <h3>Request Leave</h3>
                <form id="leave-request-form" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                    <div style="display: flex; gap: 1rem;">
                        <label style="flex:1">From
                            <input type="date" name="startDate" required style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;">
                        </label>
                        <label style="flex:1">To
                            <input type="date" name="endDate" required style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;">
                        </label>
                    </div>
                    <label>Type
                        <select name="type" required style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;">
                            <option value="Half Day">Half Day</option>
                            <option value="Casual Leave">Casual Leave</option>
                            <option value="Sick Leave">Sick Leave</option>
                            <option value="Earned Leave">Earned Leave</option>
                            <option value="Paid Leave">Paid Leave</option>
                            <option value="Maternity Leave">Maternity Leave</option>
                            <option value="Regional Holidays">Regional Holidays</option>
                            <option value="National Holiday">National Holiday</option>
                            <option value="Holiday">Holiday</option>
                            <option value="Absent">Absent</option>
                            <option value="Work - Home">Work from Home</option>
                        </select>
                    </label>
                    <label>Reason
                        <textarea name="reason" rows="3" required style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;"></textarea>
                        <div style="margin-top:0.35rem; font-size:0.75rem; color:#92400e; line-height:1.4;">Please mention the reason specifically. If the reason is vague or not clearly mentioned, the leave may not be sanctioned.</div>
                    </label>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="button" onclick="document.getElementById('leave-modal').style.display = 'none'" style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; background: white; border-radius: 0.5rem; cursor: pointer;">Cancel</button>
                        <button type="submit" class="action-btn" style="flex: 1; padding: 0.75rem; border-radius: 0.5rem; background: #be123c;">Submit Request</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Edit User Modal -->
        <div id="edit-user-modal" class="modal-overlay" style="display: none;">
            <div class="modal-content">
                <h3>Edit Staff Details</h3>
                <form id="edit-user-form" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                    <input type="hidden" name="id" id="edit-user-id">
                    <label>
                        Full Name
                        <input type="text" name="name" id="edit-user-name" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                    </label>
                    
                    <div style="display: flex; gap: 1rem; background: #fffbeb; padding: 1rem; border-radius: 0.5rem; border: 1px dashed #f59e0b;">
                        <label style="flex:1">
                            Login ID
                            <input type="text" name="username" id="edit-user-username" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                        </label>
                        <label style="flex:1">
                            Password
                            <input type="text" name="password" id="edit-user-password" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                        </label>
                    </div>

                    <label>
                        Role / Designation
                        <select name="role" id="edit-user-role" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;" onchange="const cb = document.getElementById('edit-user-isAdmin'); cb.checked = (this.value === 'Administrator');">
                            <option value="Employee">Employee</option>
                            <option value="Administrator">Administrator</option>
                            <option value="Guest">Guest</option>
                            <option value="Intern">Intern</option>
                        </select>
                    </label>
                    <label>
                        Department
                        <select name="dept" id="edit-user-dept" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            <option value="Administration">Administration</option>
                            <option value="IT Department">IT Department</option>
                            <option value="HR">HR</option>
                            <option value="Sales">Sales</option>
                            <option value="Operations">Operations</option>
                            <option value="General">General</option>
                        </select>
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 0.5rem; background: #f0f7ff; padding: 0.75rem; border-radius: 0.5rem; cursor: pointer;">
                        <input type="checkbox" name="isAdmin" id="edit-user-isAdmin" style="width: 1.2rem; height: 1.2rem;" onchange="const sel = document.getElementById('edit-user-role'); if(this.checked) { sel.value = 'Administrator'; } else { if(sel.value === 'Administrator') sel.value = 'Employee'; }">
                        <div style="font-weight: 600; color: #1e40af;">Grant Full Administrator Rights</div>
                    </label>

                    <div id="edit-user-permissions-panel" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; margin-top: 0.5rem;">
                        <div style="font-weight: 700; font-size: 0.85rem; color: #475569; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fa-solid fa-shield-halved"></i> Section-Specific Permissions
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 0.75rem; align-items: center;">
                            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Section</div>
                            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: center;">View Only</div>
                            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: center;">Full Admin</div>
                            
                            <!-- Dashboard -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Dashboard</div>
                            <input type="checkbox" class="perm-check" data-module="dashboard" data-level="view" id="edit-perm-dashboard-view">
                            <input type="checkbox" class="perm-check" data-module="dashboard" data-level="admin" id="edit-perm-dashboard-admin">

                            <!-- Leaves -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Leaves</div>
                            <input type="checkbox" class="perm-check" data-module="leaves" data-level="view" id="edit-perm-leaves-view">
                            <input type="checkbox" class="perm-check" data-module="leaves" data-level="admin" id="edit-perm-leaves-admin">

                            <!-- Users -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">User Management</div>
                            <input type="checkbox" class="perm-check" data-module="users" data-level="view" id="edit-perm-users-view">
                            <input type="checkbox" class="perm-check" data-module="users" data-level="admin" id="edit-perm-users-admin">

                            <!-- Attendance -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Attendance Sheet</div>
                            <input type="checkbox" class="perm-check" data-module="attendance" data-level="view" id="edit-perm-attendance-view">
                            <input type="checkbox" class="perm-check" data-module="attendance" data-level="admin" id="edit-perm-attendance-admin">

                            <!-- Reports -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Reports</div>
                            <input type="checkbox" class="perm-check" data-module="reports" data-level="view" id="edit-perm-reports-view">
                            <input type="checkbox" class="perm-check" data-module="reports" data-level="admin" id="edit-perm-reports-admin">

                            <!-- Minutes -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Meeting Minutes</div>
                            <input type="checkbox" class="perm-check" data-module="minutes" data-level="view" id="edit-perm-minutes-view">
                            <input type="checkbox" class="perm-check" data-module="minutes" data-level="admin" id="edit-perm-minutes-admin">

                            <!-- Policies -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Company Policies</div>
                            <input type="checkbox" class="perm-check" data-module="policies" data-level="view" id="edit-perm-policies-view">
                            <input type="checkbox" class="perm-check" data-module="policies" data-level="admin" id="edit-perm-policies-admin">

                            <!-- Birthday -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Birthday Calendar</div>
                            <input type="checkbox" class="perm-check" data-module="birthday" data-level="view" id="edit-perm-birthday-view">
                            <input type="checkbox" class="perm-check" data-module="birthday" data-level="admin" id="edit-perm-birthday-admin">
                        </div>
                    </div>
                     <div style="display: flex; gap: 1rem;">
                        <label style="flex:1">
                            Email
                            <input type="email" name="email" id="edit-user-email" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                        </label>
                        <label style="flex:1">
                            Phone
                            <input type="tel" name="phone" id="edit-user-phone" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                        </label>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 0.45rem;">Date of Birth</div>
                        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem;">
                            <label>
                                <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Day</span>
                                <input type="number" name="birthDay" id="edit-user-birth-day" min="1" max="31" placeholder="DD" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                            <label>
                                <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Month</span>
                                <input type="number" name="birthMonth" id="edit-user-birth-month" min="1" max="12" placeholder="MM" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                            <label>
                                <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Year</span>
                                <input type="number" name="birthYear" id="edit-user-birth-year" min="1900" max="2100" placeholder="YYYY" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                        </div>
                        <div style="font-size:0.78rem; color:#64748b; margin-top:0.35rem;">You can save any one or more birthday fields. Day and month are required only for reminders.</div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="button" onclick="document.getElementById('edit-user-modal').style.display = 'none'" style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; background: white; border-radius: 0.5rem; cursor: pointer;">Cancel</button>
                        <button type="submit" class="action-btn" style="flex: 1; padding: 0.75rem; border-radius: 0.5rem;">Update Details</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- User Details Modal (Logs) -->
        <div id="user-details-modal" class="modal-overlay" style="display: none;">
            <div class="modal-content" style="max-width: 700px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h3>Staff Attendance Record</h3>
                    <button onclick="document.getElementById('user-details-modal').style.display='none'" style="background:none; border:none; cursor:pointer; font-size:1.2rem;"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div id="user-details-content">
                    <!-- Injected by JS -->
                </div>
            </div>
        </div>

        <!-- Send Notification Modal -->
         <div id="notify-modal" class="modal-overlay" style="display: none;">
            <div class="modal-content">
                <h3>Send Notification</h3>
                <form id="notify-form" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                    <input type="hidden" name="toUserId" id="notify-user-id">
                    <label>
                        Message
                        <textarea name="message" required rows="4" placeholder="Type your message here..." style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem; font-family: inherit;"></textarea>
                    </label>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="button" onclick="document.getElementById('notify-modal').style.display = 'none'" style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; background: white; border-radius: 0.5rem; cursor: pointer;">Cancel</button>
                        <button type="submit" class="action-btn" style="flex: 1; padding: 0.75rem; border-radius: 0.5rem;">Send Message</button>
                    </div>
                </form>
            </div>
        </div>
        
         <!-- Add User Modal -->
        <div id="add-user-modal" class="modal-overlay" style="display: none;">
            <div class="modal-content">
                <h3>Create New Account</h3>
                <form id="add-user-form" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                    <label>
                        Full Name
                        <input type="text" name="name" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                    </label>
                    
                    <div style="display: flex; gap: 1rem; background: #f9fafb; padding: 1rem; border-radius: 0.5rem; border: 1px dashed #d1d5db;">
                        <label style="flex:1">
                            Login ID
                            <input type="text" name="username" placeholder="e.g. jomit" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                        </label>
                        <label style="flex:1">
                            Password
                            <input type="text" name="password" placeholder="e.g. secret123" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                        </label>
                    </div>

                    <label>
                        Role / Designation
                        <select name="role" id="add-user-role" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;" onchange="const cb = document.getElementById('add-user-isAdmin'); cb.checked = (this.value === 'Administrator');">
                            <option value="Employee">Employee</option>
                            <option value="Administrator">Administrator</option>
                            <option value="Guest">Guest</option>
                            <option value="Intern">Intern</option>
                        </select>
                    </label>
                    <label>
                        Department
                        <select name="dept" id="add-user-dept" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            <option value="Administration">Administration</option>
                            <option value="IT Department">IT Department</option>
                            <option value="HR">HR</option>
                            <option value="Sales">Sales</option>
                            <option value="Operations">Operations</option>
                            <option value="General">General</option>
                        </select>
                    </label>

                    <label style="display: flex; align-items: center; gap: 0.5rem; background: #f0f7ff; padding: 0.75rem; border-radius: 0.5rem; cursor: pointer; margin-top: 0.5rem;">
                        <input type="checkbox" name="isAdmin" id="add-user-isAdmin" style="width: 1.2rem; height: 1.2rem;" onchange="const sel = document.getElementById('add-user-role'); if(this.checked) { sel.value = 'Administrator'; } else { if(sel.value === 'Administrator') sel.value = 'Employee'; }">
                        <div style="font-weight: 600; color: #1e40af;">Grant Full Administrator Rights</div>
                    </label>

                    <div id="add-user-permissions-panel" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; margin-top: 0.5rem;">
                        <div style="font-weight: 700; font-size: 0.85rem; color: #475569; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fa-solid fa-shield-halved"></i> Section-Specific Permissions
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 0.75rem; align-items: center;">
                            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Section</div>
                            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: center;">View Only</div>
                            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: center;">Full Admin</div>
                            
                            <!-- Dashboard -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Dashboard</div>
                            <input type="checkbox" class="perm-check" data-module="dashboard" data-level="view" id="add-perm-dashboard-view">
                            <input type="checkbox" class="perm-check" data-module="dashboard" data-level="admin" id="add-perm-dashboard-admin">

                            <!-- Leaves -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Leaves</div>
                            <input type="checkbox" class="perm-check" data-module="leaves" data-level="view" id="add-perm-leaves-view">
                            <input type="checkbox" class="perm-check" data-module="leaves" data-level="admin" id="add-perm-leaves-admin">

                            <!-- Users -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">User Management</div>
                            <input type="checkbox" class="perm-check" data-module="users" data-level="view" id="add-perm-users-view">
                            <input type="checkbox" class="perm-check" data-module="users" data-level="admin" id="add-perm-users-admin">

                            <!-- Attendance -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Attendance Sheet</div>
                            <input type="checkbox" class="perm-check" data-module="attendance" data-level="view" id="add-perm-attendance-view">
                            <input type="checkbox" class="perm-check" data-module="attendance" data-level="admin" id="add-perm-attendance-admin">

                            <!-- Reports -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Reports</div>
                            <input type="checkbox" class="perm-check" data-module="reports" data-level="view" id="add-perm-reports-view">
                            <input type="checkbox" class="perm-check" data-module="reports" data-level="admin" id="add-perm-reports-admin">

                            <!-- Minutes -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Meeting Minutes</div>
                            <input type="checkbox" class="perm-check" data-module="minutes" data-level="view" id="add-perm-minutes-view">
                            <input type="checkbox" class="perm-check" data-module="minutes" data-level="admin" id="add-perm-minutes-admin">

                            <!-- Policies -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Company Policies</div>
                            <input type="checkbox" class="perm-check" data-module="policies" data-level="view" id="add-perm-policies-view">
                            <input type="checkbox" class="perm-check" data-module="policies" data-level="admin" id="add-perm-policies-admin">

                            <!-- Birthday -->
                            <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">Birthday Calendar</div>
                            <input type="checkbox" class="perm-check" data-module="birthday" data-level="view" id="add-perm-birthday-view">
                            <input type="checkbox" class="perm-check" data-module="birthday" data-level="admin" id="add-perm-birthday-admin">
                        </div>
                    </div>
                     <div style="display: flex; gap: 1rem;">
                        <label style="flex:1">
                            Email
                            <input type="email" name="email" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                        </label>
                        <label style="flex:1">
                            Phone
                            <input type="tel" name="phone" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                        </label>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 0.45rem;">Date of Birth</div>
                        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem;">
                            <label>
                                <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Day</span>
                                <input type="number" name="birthDay" min="1" max="31" placeholder="DD" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                            <label>
                                <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Month</span>
                                <input type="number" name="birthMonth" min="1" max="12" placeholder="MM" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                            <label>
                                <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Year</span>
                                <input type="number" name="birthYear" min="1900" max="2100" placeholder="YYYY" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                            </label>
                        </div>
                        <div style="font-size:0.78rem; color:#64748b; margin-top:0.35rem;">You can save any one or more birthday fields. Day and month are required only for reminders.</div>
                    </div>
                    <label>
                        Joining Date
                        <input type="date" name="joinDate" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                    </label>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="button" onclick="document.getElementById('add-user-modal').style.display = 'none'" style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; background: white; border-radius: 0.5rem; cursor: pointer;">Cancel</button>
                        <button type="submit" class="action-btn" style="flex: 1; padding: 0.75rem; border-radius: 0.5rem;">Create Account</button>
                    </div>
                </form>
            </div>
        </div>
    `:""}const Nt=50,Li=250;function ss(){const a=new Date,e=new Date(a),n=(e.getDay()+6)%7;return e.setDate(e.getDate()-n),e.setHours(0,0,0,0),{startIso:e.toISOString().split("T")[0],endIso:a.toISOString().split("T")[0]}}function ve(){if(!window.app_teamActivitiesState){const a=ss();window.app_teamActivitiesState={startIso:a.startIso,endIso:a.endIso,weeksLoaded:1,staffIds:[],status:"all",type:"all",search:"",sortKey:"date-desc",page:1,pageSize:Nt,columnFilters:{date:"",staff:"",description:"",time:"",type:"",status:""},selectedKeys:[],columnVisibility:{type:!0,status:!0,sourceTime:!0},users:[],data:[],filtered:[],lastRefreshed:null}}return window.app_teamActivitiesState}function Ei(a){const e=(t={})=>{const n=String(t.checkOut||t._sortTime||"").trim();if(!n||n.toLowerCase()==="active now"||n==="00:00"||n==="09:00")return"";const i=n.match(/^(\d{1,2}):(\d{2})/);return i?`${String(Number(i[1])).padStart(2,"0")}:${i[2]}`:n};return(a||[]).map(t=>{const n=t.type||(t.workDescription?"attendance":"work"),s=t._displayDesc||t.workDescription||t.task||"Activity",i=e(t),o=t.status||(n==="attendance"?"completed":""),r=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(t.date,o):o||"to-be-started";return{date:t.date||"",staffName:t.staffName||t.userName||"Unknown Staff",type:n,description:s,status:r,sourceTime:i,userId:t.userId||t.user_id||"",planId:t.planId||t.id||"",taskIndex:Number.isInteger(t.taskIndex)?t.taskIndex:null,planScope:t.planScope||"personal",progressPercent:Number.isFinite(Number(t.progressPercent))?Number(t.progressPercent):null,progressStatus:t.progressStatus||"",progressNote:t.progressNote||""}})}function un(a){const e=String(a||"").toLowerCase();return["overdue","not-completed","to-be-started","in-process"].includes(e)}function Pi(a){const e=new Date(a);return Number.isNaN(e.getTime())?new Date().toISOString().split("T")[0]:(e.setDate(e.getDate()+1),e.toISOString().split("T")[0])}function Ni(a){const e=String(a||"").trim();if(!e||!/^\d{4}-\d{2}-\d{2}$/.test(e))return!1;const t=new Date(e);return!Number.isNaN(t.getTime())&&t.toISOString().startsWith(e)}function Bi(a,e){return new Promise(t=>{if(!a){t(null);return}const n=document.getElementById("team-activities-postpone-popover");n&&n.remove();const s=document.createElement("div");s.id="team-activities-postpone-popover",s.className="team-activities-postpone-popover",s.innerHTML=`
            <div class="team-activities-postpone-head">Postpone to</div>
            <input type="date" class="team-activities-postpone-input" value="${e}">
            <div class="team-activities-postpone-actions">
                <button type="button" class="team-activities-row-btn warn" data-postpone-cancel>Cancel</button>
                <button type="button" class="team-activities-row-btn success" data-postpone-confirm>Confirm</button>
            </div>
        `,document.body.appendChild(s);const i=a.getBoundingClientRect(),o=i.bottom+window.scrollY+8,r=Math.min(i.left+window.scrollX,window.innerWidth-260);s.style.top=`${o}px`,s.style.left=`${r}px`;const l=s.querySelector(".team-activities-postpone-input");l&&l.focus();const d=p=>{document.removeEventListener("click",c,!0),s.remove(),t(p)},c=p=>{!s.contains(p.target)&&p.target!==a&&d(null)};document.addEventListener("click",c,!0),s.addEventListener("click",p=>{const u=p.target;if(u.closest("[data-postpone-cancel]")&&d(null),u.closest("[data-postpone-confirm]")){const m=l?l.value:"";d(m||null)}})})}function Ri(a){const e=a.search.trim().toLowerCase(),t=new Set(a.staffIds||[]),n=a.status,s=a.type,i=a.columnFilters||{},o=String(i.date||"").trim(),r=String(i.staff||"").trim().toLowerCase(),l=String(i.description||"").trim().toLowerCase(),d=String(i.time||"").trim().toLowerCase(),c=String(i.type||"").trim().toLowerCase(),p=String(i.status||"").trim().toLowerCase();let u=a.data.filter(m=>!(t.size&&!t.has(m.userId)||s!=="all"&&m.type!==s||n!=="all"&&String(m.status||"").toLowerCase()!==n||e&&!`${m.date} ${m.staffName} ${m.description} ${m.status} ${m.type}`.toLowerCase().includes(e)||o&&String(m.date||"")!==o||r&&!String(m.staffName||"").toLowerCase().includes(r)||l&&!String(m.description||"").toLowerCase().includes(l)||d&&!String(m.sourceTime||"").toLowerCase().includes(d)||c&&!String(m.type||"").toLowerCase().includes(c)||p&&!String(m.status||"").toLowerCase().includes(p)));return u=Oi(u,a.sortKey),a.filtered=u,u}function Oi(a,e){const t=[...a];return t.sort((n,s)=>{const i=new Date(s.date)-new Date(n.date),o=String(s.sourceTime||"").localeCompare(String(n.sourceTime||"")),r=String(n.staffName||"").localeCompare(String(s.staffName||"")),l=d=>d.type==="work"&&d.planId&&Number.isInteger(d.taskIndex);return e==="date-desc"?i||o:e==="date-asc"?new Date(n.date)-new Date(s.date)||o:e==="staff-asc"?r||i:e==="staff-desc"?-r||i:e==="status"?String(n.status||"").localeCompare(String(s.status||""))||i:e==="status-desc"?String(s.status||"").localeCompare(String(n.status||""))||i:e==="type"?String(n.type||"").localeCompare(String(s.type||""))||i:e==="type-desc"?String(s.type||"").localeCompare(String(n.type||""))||i:e==="description"?String(n.description||"").localeCompare(String(s.description||""))||i:e==="description-desc"?String(s.description||"").localeCompare(String(n.description||""))||i:e==="time"?String(n.sourceTime||"").localeCompare(String(s.sourceTime||""))||i:e==="time-desc"?String(s.sourceTime||"").localeCompare(String(n.sourceTime||""))||i:e==="actions"?Number(l(s))-Number(l(n))||i:e==="actions-desc"?Number(l(n))-Number(l(s))||i:i||o}),t}function Fi(a,e,t){const s=(Math.max(1,e)-1)*t;return a.slice(s,s+t)}function is(a){const e=a.filtered.length,t=new Set(a.filtered.map(i=>i.userId).filter(Boolean)),n=a.filtered.filter(i=>String(i.status).toLowerCase()==="completed").length,s=e-n;return`
        <div class="team-activities-chip">Total: <strong>${e}</strong></div>
        <div class="team-activities-chip">Staff: <strong>${t.size}</strong></div>
        <div class="team-activities-chip">Completed: <strong>${n}</strong></div>
        <div class="team-activities-chip">Incomplete: <strong>${s}</strong></div>
    `}function Hi(a){const e=a.users||[],t=new Set(a.staffIds||[]),n=t.size?`${t.size} selected`:"All staff",s=e.map(i=>`
        <label class="team-activities-checkbox">
            <input type="checkbox" data-staff-id="${i.id}" ${t.has(i.id)?"checked":""}>
            <span>${v(i.name||"Staff")}</span>
        </label>
    `).join("");return`
        <div class="team-activities-dropdown">
            <button class="team-activities-dropdown-btn" type="button" data-team-activities-staff-toggle>
                <i class="fa-solid fa-users"></i>
                <span>Staff: ${v(n)}</span>
                <i class="fa-solid fa-chevron-down"></i>
            </button>
            <div class="team-activities-dropdown-panel" id="team-activities-staff-panel">
                <div class="team-activities-dropdown-actions">
                    <button type="button" class="team-activities-link" data-staff-select-all>Select all</button>
                    <button type="button" class="team-activities-link" data-staff-clear>Clear</button>
                </div>
                <div class="team-activities-dropdown-list">
                    ${s||'<div class="team-activities-empty">No staff found.</div>'}
                </div>
            </div>
        </div>
    `}function Ui(a){const e=a.columnVisibility;return`
        <div class="team-activities-columns-popover" id="team-activities-columns-popover">
            <label class="team-activities-checkbox">
                <input type="checkbox" data-column="type" ${e.type?"checked":""}>
                <span>Type</span>
            </label>
            <label class="team-activities-checkbox">
                <input type="checkbox" data-column="status" ${e.status?"checked":""}>
                <span>Status</span>
            </label>
            <label class="team-activities-checkbox">
                <input type="checkbox" data-column="sourceTime" ${e.sourceTime?"checked":""}>
                <span>Time</span>
            </label>
        </div>
    `}function Re(a,e,t,n){const s=n.sortKey===e?"▼":n.sortKey===t?"▲":"⇅";return`${v(a)} <span class="team-activities-sort">${s}</span>`}function qi(a){const e=a.columnVisibility,t=Fi(a.filtered,a.page,a.pageSize);if(!t.length)return'<div class="team-activities-empty">No activities found for the selected filters.</div>';const n=new Set(a.selectedKeys||[]),s=window.AppAuth?.getUser?window.AppAuth.getUser()?.id:null,i=window.AppAuth?.getUser?window.AppAuth.getUser():null,o=!!(i&&(i.role==="Administrator"||i.isAdmin)),r=`
        <th data-sort="date-desc" data-sort-alt="date-asc">${Re("Date","date-desc","date-asc",a)}</th>
        <th data-sort="staff-asc" data-sort-alt="staff-desc">${Re("Staff","staff-asc","staff-desc",a)}</th>
        ${e.type?`<th data-sort="type" data-sort-alt="type-desc">${Re("Type","type","type-desc",a)}</th>`:""}
        ${e.status?`<th data-sort="status" data-sort-alt="status-desc">${Re("Status","status","status-desc",a)}</th>`:""}
        <th data-sort="description" data-sort-alt="description-desc">${Re("Description","description","description-desc",a)}</th>
        ${e.sourceTime?`<th data-sort="time" data-sort-alt="time-desc">${Re("Time","time","time-desc",a)}</th>`:""}
        <th data-sort="actions" data-sort-alt="actions-desc">${Re("Actions","actions","actions-desc",a)}</th>
    `,l=[],d=t.map(m=>{const h=String(m.status||"").toLowerCase().replace(/\s+/g,"-"),f=s&&m.userId&&s===m.userId,g=m.type==="work"&&m.planId&&Number.isInteger(m.taskIndex)&&(f||o),S=m.type==="work"&&un(m.status)&&m.planId&&Number.isInteger(m.taskIndex)&&(f||o),A=`${m.planId||""}__${Number.isInteger(m.taskIndex)?m.taskIndex:""}`;g&&l.push(A);const b=m.type==="work"&&(m.progressPercent!==null||m.progressStatus||m.progressNote),x=m.progressStatus?String(m.progressStatus).replace(/_/g," "):"",D=m.progressPercent!==null?`${m.progressPercent}%`:"",T=String(m.progressNote||"").trim(),_=T?` title="${v(T)}"`:"",E=b?`<div class="team-activities-progress"${_}>${v(D)}${D&&x?" &bull; ":""}${v(x)}</div>`:"";return`
        <tr>
            ${o?`
            <td class="team-activities-select-col">
                ${g?`<input type="checkbox" class="team-activities-row-select" data-row-key="${v(A)}" ${n.has(A)?"checked":""}>`:""}
            </td>
        `:'<td class="team-activities-select-col"></td>'}
            <td>${v(m.date)}</td>
            <td>${v(m.staffName)}</td>
            ${e.type?`<td class="team-activities-type">${v(m.type)}</td>`:""}
            ${e.status?`<td><span class="team-activities-status status-${v(h)}">${v(m.status)}</span></td>`:""}
            <td class="team-activities-desc">${v(m.description)}${E}</td>
            ${e.sourceTime?`<td>${v(m.sourceTime||"--")}</td>`:""}
            <td>
                <div class="team-activities-row-actions">
                    <button class="team-activities-row-btn" data-view-date="${v(m.date)}" data-view-user="${v(m.userId)}">
                        <i class="fa-solid fa-eye"></i> View
                    </button>
                    ${m.type==="work"&&f&&un(m.status)&&m.planId&&Number.isInteger(m.taskIndex)?`
                        <button class="team-activities-row-btn warn" data-action="postpone" data-plan-id="${v(m.planId)}" data-task-index="${m.taskIndex}" data-plan-scope="${v(m.planScope)}" data-user-id="${v(m.userId)}" data-date="${v(m.date)}">
                            <i class="fa-solid fa-clock"></i> Postpone
                        </button>
                    `:""}
                    ${S?`
                        <button class="team-activities-row-btn success" data-action="complete" data-plan-id="${v(m.planId)}" data-task-index="${m.taskIndex}" data-user-id="${v(m.userId)}" onclick="window.app_teamActivitiesCompleteTask(this)">
                            <i class="fa-solid fa-check"></i> Complete
                        </button>
                    `:""}
                    ${g?`
                        <button class="team-activities-row-btn danger" data-action="remove" data-plan-id="${v(m.planId)}" data-task-index="${m.taskIndex}" data-user-id="${v(m.userId)}">
                            <i class="fa-solid fa-trash"></i> Remove
                        </button>
                    `:""}
                </div>
            </td>
        </tr>
    `}).join(""),c=l.length>0&&l.every(m=>n.has(m)),p=o?`
        <div class="team-activities-bulk-bar">
            <div><strong>${n.size}</strong> selected</div>
            <div class="team-activities-bulk-actions">
                <button type="button" class="team-activities-row-btn secondary" data-bulk-clear ${n.size?"":"disabled"}>Clear</button>
                <button type="button" class="team-activities-row-btn danger" data-bulk-remove ${n.size?"":"disabled"}>Bulk Remove</button>
            </div>
        </div>
    `:"",u=o?`<th class="team-activities-select-col"><input type="checkbox" data-select-visible ${l.length?"":"disabled"} ${c?"checked":""}></th>`:'<th class="team-activities-select-col"></th>';return`
        ${p}
        <table class="team-activities-table">
            <thead><tr>${u}${r}</tr></thead>
            <tbody>${d}</tbody>
        </table>
    `}function zi(a,e){if(!a)return;const t=a.closest("tr"),n=t?t.querySelector(".team-activities-row-actions"):null;if(!n)return;let s=n.querySelector(".team-activities-inline-toast");s||(s=document.createElement("span"),s.className="team-activities-inline-toast",n.appendChild(s)),s.textContent=e,s.classList.add("show"),clearTimeout(s._hideTimer),s._hideTimer=setTimeout(()=>{s.classList.remove("show")},2e3)}function ji(a){const e=a.filtered.length,t=Math.max(1,Math.ceil(e/a.pageSize)),n=Math.min(a.page,t);return`
        <div class="team-activities-pagination">
            <button class="team-activities-page-btn" data-page="prev" ${n<=1?"disabled":""}>Prev</button>
            <span>Page ${n} of ${t}</span>
            <button class="team-activities-page-btn" data-page="next" ${n>=t?"disabled":""}>Next</button>
        </div>
    `}function ie(){const a=ve();a.columnVisibility.sourceTime=!0,Ri(a);const e=Math.max(1,Math.ceil(a.filtered.length/a.pageSize));a.page>e&&(a.page=e);const t=document.getElementById("team-activities-summary"),n=document.getElementById("team-activities-table-wrap"),s=document.getElementById("team-activities-pagination-wrap"),i=document.getElementById("team-activities-last-updated"),o=document.getElementById("team-activities-columns-wrap"),r=document.getElementById("team-activities-staff-wrap");t&&(t.innerHTML=is(a)),n&&(n.innerHTML=qi(a)),s&&(s.innerHTML=ji(a)),o&&(o.innerHTML=Ui(a)),r&&(r.innerHTML=Hi(a)),i&&a.lastRefreshed&&(i.textContent=new Date(a.lastRefreshed).toLocaleString());const l=n?.querySelector("[data-select-visible]");if(l){const d=Array.from(n.querySelectorAll("input[data-row-key]")),c=d.filter(p=>p.checked).length;l.indeterminate=c>0&&c<d.length}}function Yi(a,e=1){if(!a)return;const t=new Date(`${a.startIso}T00:00:00`);Number.isNaN(t.getTime())||(t.setDate(t.getDate()-7*Math.max(1,Number(e)||1)),a.startIso=t.toISOString().split("T")[0])}async function Ie(){const a=ve(),e=document.getElementById("team-activities-loading");e&&(e.style.display="block");try{const t=await window.AppAnalytics.getAllStaffActivities({mode:"range",startIso:a.startIso,endIso:a.endIso,scope:"work",sideEffects:!1});a.data=Ei(t),a.lastRefreshed=Date.now(),a.page=1,a.selectedKeys=[]}catch(t){console.error("Team Activities fetch failed",t)}finally{e&&(e.style.display="none")}ie()}function It(){const a=ve(),e=document.getElementById("team-activities-start"),t=document.getElementById("team-activities-end"),n=document.getElementById("team-activities-type"),s=document.getElementById("team-activities-status"),i=document.getElementById("team-activities-search"),o=document.getElementById("team-activities-page-size");e&&(a.startIso=e.value||a.startIso),t&&(a.endIso=t.value||a.endIso),n&&(a.type=n.value||"all"),s&&(a.status=s.value||"all"),i&&(a.search=i.value||""),o&&(a.pageSize=Number(o.value)||Nt),a.page=1,ie()}function Wi(){const a=ve();if(a.bound)return;a.bound=!0;let e=null;document.addEventListener("click",async t=>{const n=t.target,s=n.closest("[data-team-activities-staff-toggle]"),i=document.getElementById("team-activities-staff-panel"),o=n.closest("[data-team-activities-columns-toggle]"),r=document.getElementById("team-activities-columns-popover");s&&i?i.classList.toggle("open"):i&&!i.contains(n)&&i.classList.remove("open"),o&&r?r.classList.toggle("open"):r&&!r.contains(n)&&r.classList.remove("open");const l=n.closest(".team-activities-page-btn");if(l){const S=l.dataset.page,A=Math.max(1,Math.ceil(a.filtered.length/a.pageSize));S==="prev"&&(a.page=Math.max(1,a.page-1)),S==="next"&&(a.page=Math.min(A,a.page+1)),ie()}const d=n.closest("[data-view-date]");if(d){const S=d.getAttribute("data-view-date"),A=d.getAttribute("data-view-user");window.app_openDayPlan&&window.app_openDayPlan(S,A||"")}const c=n.closest("[data-action]");if(c){const S=c.getAttribute("data-action");S==="complete"&&window.app_teamActivitiesCompleteTask&&await window.app_teamActivitiesCompleteTask(c),S==="postpone"&&window.app_teamActivitiesPostponeTask&&await window.app_teamActivitiesPostponeTask(c),S==="remove"&&window.app_teamActivitiesRemoveTask&&await window.app_teamActivitiesRemoveTask(c)}const p=n.closest("th[data-sort]");if(p){const S=p.dataset.sort,A=p.dataset.sortAlt;let b=S;a.sortKey===S&&A?b=A:a.sortKey===A&&S&&(b=S),b&&(a.sortKey=b,ie())}n.closest("[data-staff-select-all]")&&(a.staffIds=(a.users||[]).map(S=>S.id),ie()),n.closest("[data-staff-clear]")&&(a.staffIds=[],ie()),n.closest("[data-bulk-clear]")&&(a.selectedKeys=[],ie()),n.closest("[data-bulk-remove]")&&window.app_teamActivitiesBulkRemove&&await window.app_teamActivitiesBulkRemove(),n.closest("[data-load-more-week]")&&(Yi(a,1),a.weeksLoaded=Math.max(1,Number(a.weeksLoaded||1)+1),ie(),await Ie())}),document.addEventListener("change",t=>{const n=t.target;if(n.matches("#team-activities-start, #team-activities-end")?(a.weeksLoaded=1,It(),Ie()):n.matches("#team-activities-type, #team-activities-status, #team-activities-page-size")&&It(),n.matches('#team-activities-columns-popover input[type="checkbox"]')){const s=n.getAttribute("data-column");s&&(a.columnVisibility[s]=n.checked),ie()}if(n.matches('#team-activities-staff-panel input[type="checkbox"]')){const s=n.getAttribute("data-staff-id");if(!s)return;n.checked?a.staffIds.includes(s)||a.staffIds.push(s):a.staffIds=a.staffIds.filter(i=>i!==s),ie()}if(n.matches("#team-activities-filter-date")&&(a.columnFilters.date=n.value||"",ie()),n.matches("#team-activities-filter-staff")&&(a.columnFilters.staff=n.value||"",ie()),n.matches("#team-activities-filter-desc")&&(a.columnFilters.description=n.value||"",ie()),n.matches("#team-activities-filter-time")&&(a.columnFilters.time=n.value||"",ie()),n.matches("#team-activities-filter-type")&&(a.columnFilters.type=n.value||"",ie()),n.matches("#team-activities-filter-status")&&(a.columnFilters.status=n.value||"",ie()),n.matches("input[data-row-key]")){const s=n.getAttribute("data-row-key");if(!s)return;const i=new Set(a.selectedKeys||[]);n.checked?i.add(s):i.delete(s),a.selectedKeys=Array.from(i),ie()}if(n.matches("[data-select-visible]")){const s=document.getElementById("team-activities-table-wrap"),i=Array.from(s?.querySelectorAll("input[data-row-key]")||[]),o=new Set(a.selectedKeys||[]);i.forEach(r=>{const l=r.getAttribute("data-row-key");l&&(r.checked=n.checked,n.checked?o.add(l):o.delete(l))}),a.selectedKeys=Array.from(o),ie()}}),document.addEventListener("input",t=>{t.target.matches("#team-activities-search")&&(e&&clearTimeout(e),e=setTimeout(()=>It(),Li))})}function Ki(a){const e=["Date","Staff","Type","Status","Description","Time"],t=a.map(n=>[n.date,n.staffName,n.type,n.status,n.description,n.sourceTime].map(s=>`"${String(s||"").replace(/"/g,'""')}"`).join(","));return[e.join(","),...t].join(`
`)}typeof window<"u"&&(window.app_initTeamActivities=async function(){const a=ve(),e=await window.AppAnalytics.getUsersCached();a.users=e||[];try{const t="purge_carried_2026-03-25";if(localStorage.getItem(t)!=="1"&&window.AppCalendar?.purgeCarriedForwardTasksByDate){const n=await window.AppCalendar.purgeCarriedForwardTasksByDate("2026-03-25",{scopes:["personal","annual"]});(n?.removedTasks||0)>0&&console.log(`Purged ${n.removedTasks} carried-forward task(s) on 2026-03-25.`),localStorage.setItem(t,"1")}}catch(t){console.warn("Purge 2026-03-25 failed:",t)}Wi(),ie(),await Ie()},window.app_teamActivitiesRefresh=async function(){It(),await Ie()},window.app_teamActivitiesResetFilters=function(){const a=ve(),e=ss();a.startIso=e.startIso,a.endIso=e.endIso,a.weeksLoaded=1,a.staffIds=[],a.status="all",a.type="all",a.search="",a.columnFilters={date:"",staff:"",description:"",time:"",type:"",status:""},a.sortKey="date-desc",a.page=1,a.pageSize=Nt,a.selectedKeys=[];const t=document.getElementById("team-activities-start"),n=document.getElementById("team-activities-end"),s=document.getElementById("team-activities-type"),i=document.getElementById("team-activities-status"),o=document.getElementById("team-activities-search"),r=document.getElementById("team-activities-page-size");t&&(t.value=a.startIso),n&&(n.value=a.endIso),s&&(s.value="all"),i&&(i.value="all"),o&&(o.value=""),r&&(r.value=String(Nt)),ie(),Ie()},window.app_teamActivitiesCopyCSV=async function(){const a=ve(),e=Ki(a.filtered);try{await navigator.clipboard.writeText(e),alert("Table copied to clipboard.")}catch(t){console.warn("Clipboard copy failed",t),alert("Copy failed. Please use Export Excel instead.")}},window.app_teamActivitiesExportXLSX=function(){const a=ve();window.AppReports?.exportTeamActivitiesXLSX?window.AppReports.exportTeamActivitiesXLSX(a.filtered,{start:a.startIso,end:a.endIso}):alert("Export module not available.")},window.app_teamActivitiesCompleteTask=async function(a){try{const e=window.AppAuth?.getUser?window.AppAuth.getUser():null,t=e?.id||null,n=!!(e&&(e.role==="Administrator"||e.isAdmin)),s=a.getAttribute("data-plan-id"),i=Number(a.getAttribute("data-task-index")),o=a.getAttribute("data-user-id")||"";if(!n&&(!t||t!==o)){alert("Only the assigned staff member or an admin can complete this task.");return}if(!s||!Number.isInteger(i)||!window.AppCalendar?.updateTaskStatus)return;a.disabled=!0,await window.AppCalendar.updateTaskStatus(s,i,"completed");const r=ve();Array.isArray(r.data)&&(r.data=r.data.map(l=>l.planId===s&&l.taskIndex===i?{...l,status:"completed"}:l),ie()),zi(a,"Marked completed"),setTimeout(()=>Ie(),400),window.app_showSyncToast&&window.app_showSyncToast("Task marked as completed.")}catch(e){console.error("Complete task failed",e),alert("Failed to complete task.")}},window.app_teamActivitiesPostponeTask=async function(a){try{const e=window.AppAuth?.getUser?window.AppAuth.getUser()?.id:null,t=a.getAttribute("data-plan-id"),n=Number(a.getAttribute("data-task-index")),s=a.getAttribute("data-plan-scope")||"personal",i=a.getAttribute("data-user-id")||"",o=a.getAttribute("data-date")||"";if(!e||e!==i){alert("Only the assigned staff member can postpone this task.");return}if(!t||!Number.isInteger(n)||!window.AppDB||!window.AppCalendar)return;a.disabled=!0;const r=await window.AppDB.get("work_plans",t);if(!r||!Array.isArray(r.plans)||!r.plans[n])throw new Error("Plan or task not found");const l=Pi(o),d=await Bi(a,l);if(!d){a.disabled=!1;return}const c=String(d).trim();if(!Ni(c)){alert("Invalid date. Please use YYYY-MM-DD."),a.disabled=!1;return}const[p]=r.plans.splice(n,1);r.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",r);const u=c,m=s||r.planScope||"personal",h=m==="annual"?"annual_shared":r.userId||i,f=window.AppCalendar.getWorkPlanId(u,h,m),g={...p,status:"",startDate:u,endDate:u};delete g.completedDate;const S=await window.AppDB.get("work_plans",f);if(S)S.plans=Array.isArray(S.plans)?S.plans:[],S.plans.push(g),S.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",S);else{const A=m==="annual"?null:h;await window.AppCalendar.setWorkPlan(u,[g],A,{planScope:m})}await Ie(),window.app_showSyncToast&&window.app_showSyncToast(`Task postponed to ${u}.`)}catch(e){console.error("Postpone task failed",e),alert("Failed to postpone task.")}},window.app_teamActivitiesBulkRemove=async function(){try{const a=ve(),e=window.AppAuth?.getUser?window.AppAuth.getUser():null;if(!!!(e&&(e.role==="Administrator"||e.isAdmin))){alert("Only admins can bulk remove tasks.");return}if(!window.AppCalendar?.removeTask){alert("Remove action is not available.");return}const n=new Set(a.selectedKeys||[]);if(!n.size){alert("Select at least one removable task.");return}const s=a.filtered.filter(i=>{const o=`${i.planId||""}__${Number.isInteger(i.taskIndex)?i.taskIndex:""}`;return n.has(o)&&i.type==="work"&&i.planId&&Number.isInteger(i.taskIndex)});if(!s.length){alert("No removable tasks in selection.");return}if(!window.appConfirm||!await window.appConfirm(`Remove ${s.length} selected task(s) so they stop carrying forward?`))return;for(const i of s)await window.AppCalendar.removeTask(i.planId,i.taskIndex);a.selectedKeys=[],await Ie(),window.app_showSyncToast&&window.app_showSyncToast(`${s.length} task(s) removed.`)}catch(a){console.error("Bulk remove failed",a),alert("Failed to bulk remove tasks.")}},window.app_teamActivitiesRemoveTask=async function(a){try{const e=window.AppAuth?.getUser?window.AppAuth.getUser():null,t=e?.id||null,n=!!(e&&(e.role==="Administrator"||e.isAdmin)),s=a.getAttribute("data-plan-id"),i=Number(a.getAttribute("data-task-index")),o=a.getAttribute("data-user-id")||"";if(!s||!Number.isInteger(i)||!window.AppCalendar?.removeTask)return;if(!n&&(!t||t!==o)){alert("Only the assigned staff member or an admin can remove this task.");return}if(!window.appConfirm||!await window.appConfirm("Remove this task so it stops carrying forward?"))return;a.disabled=!0,await window.AppCalendar.removeTask(s,i),await Ie(),window.app_showSyncToast&&window.app_showSyncToast("Task removed.")}catch(e){console.error("Remove task failed",e),alert("Failed to remove task.")}});async function Vi(){const a=ve(),e=window.AppAuth?.getUser?window.AppAuth.getUser():null;return`
        <div class="team-activities-page">
            <div class="team-activities-header">
                <div>
                    <h2>Team Activities</h2>
                    <div class="team-activities-meta">Last updated: <span id="team-activities-last-updated">--</span></div>
                </div>
                <div class="team-activities-actions">
                    <button class="action-btn" onclick="window.app_teamActivitiesRefresh()"><i class="fa-solid fa-rotate"></i> Refresh</button>
                    ${!!(e&&(e.role==="Administrator"||e.isAdmin))?`
                        <button class="action-btn secondary" onclick="window.app_teamActivitiesResetFilters()"><i class="fa-solid fa-filter-circle-xmark"></i> Reset</button>
                        <button class="action-btn secondary" onclick="window.app_findCarryForwardIssues && window.app_findCarryForwardIssues()"><i class="fa-solid fa-triangle-exclamation"></i> Find Auto-Forward Issues</button>
                    `:""}
                </div>
            </div>
            <div class="team-activities-summary" id="team-activities-summary">${is(a)}</div>
            <div class="team-activities-filters compact" aria-label="Activity filters">
                <div class="team-activities-filter-group">
                    <label>Date range</label>
                    <div class="team-activities-date-range">
                        <input type="date" id="team-activities-start" value="${a.startIso}">
                        <span>to</span>
                        <input type="date" id="team-activities-end" value="${a.endIso}">
                    </div>
                </div>
                <div class="team-activities-filter-group">
                    <label>Search</label>
                    <input type="text" id="team-activities-search" placeholder="Search by staff, description, date...">
                </div>
            </div>
            <div id="team-activities-loading" class="team-activities-loading">Loading data...</div>
            <div class="team-activities-table-wrap" id="team-activities-table-wrap"></div>
            <div id="team-activities-pagination-wrap"></div>
            <div class="team-activities-load-more">
                <button class="action-btn secondary" data-load-more-week>Load 1 more week</button>
            </div>
        </div>
    `}const Gi=45e3,Bt="dashboard-section/",Rt=new Set(["checkin","worklog","team-activity","team-schedule","staff-directory","leave-requests","leave-history","missed-checkout","stats-monthly","stats-yearly"]),Ji=(a=new Date)=>{const e=a instanceof Date?a:new Date(a);return new Date(e.toLocaleString("en-US",{timeZone:"Asia/Kolkata"}))},va=a=>{const e=a instanceof Date?a:new Date(a);if(Number.isNaN(e.getTime()))return"";const t=e.getFullYear(),n=String(e.getMonth()+1).padStart(2,"0"),s=String(e.getDate()).padStart(2,"0");return`${t}-${n}-${s}`},Je=a=>{const e=String(a||"").trim();if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?"":va(t)},jt=(a,e=[])=>{for(const t of e){const n=Je(a?.[t]);if(n)return n}return""},Ot=()=>{const a=Ji(),t=(a.getDay()+6)%7,n=new Date(a);n.setDate(a.getDate()-t),n.setHours(0,0,0,0);const s=new Date(n);return s.setDate(n.getDate()+6),s.setHours(23,59,59,999),{from:va(n),to:va(s)}},bt=()=>(window.app_dashboardSectionState||(window.app_dashboardSectionState={rangeBySection:{},errorsBySection:{},cache:{}}),window.app_dashboardSectionState),Xi=a=>{const e=bt();return e.rangeBySection[a]||(e.rangeBySection[a]=Ot()),e.rangeBySection[a]},Qi=(a,e,t)=>{const n=bt();n.rangeBySection[a]={from:e,to:t}},mn=(a,e="")=>{const t=bt();t.errorsBySection[a]=String(e||"")},Zi=a=>{const e=bt();return String(e.errorsBySection?.[a]||"")},Yt=(a,e,t)=>{const n=Je(a);return!!n&&n>=e&&n<=t},Wt=async(a,e,t=Gi)=>{const n=bt(),s=Date.now(),i=n.cache[a];if(i&&i.expiresAt>s)return i.value;const o=await e();return n.cache[a]={value:o,expiresAt:s+t},o},Ra=async(a,e,t)=>{if(!window.AppDB?.query)return[];try{return await window.AppDB.query(a,e,">=",t)}catch(n){return console.warn(`Date-bounded query failed for ${a}.${e}:`,n),[]}},Oa=()=>{const a=window.AppAuth?.getUser?.();return a?!!window.app_hasPerm?.("dashboard","view",a)&&window.app_selectedSummaryStaffId?window.app_selectedSummaryStaffId:a.id:""},Fa=async(a,e,t)=>{const n=`att-target:${a}:${e}:${t}`;return Wt(n,async()=>(await window.AppDB.query("attendance","user_id","==",a)||[]).map(i=>({...i,_dateKey:jt(i,["date"])})).filter(i=>Yt(i._dateKey,e,t)).sort((i,o)=>new Date(o._dateKey)-new Date(i._dateKey)).slice(0,400))},eo=async(a,e)=>{const t=`att-all:${a}:${e}`;return Wt(t,async()=>(await Ra("attendance","date",a)||[]).map(s=>({...s,_dateKey:jt(s,["date"])})).filter(s=>Yt(s._dateKey,a,e)).slice(0,800))},Ha=async(a,e)=>{const t=`leaves:${a}:${e}`;return Wt(t,async()=>(await Ra("leaves","startDate",a)||[]).map(s=>({...s,_dateKey:jt(s,["appliedOn","actionDate","startDate"])})).filter(s=>Yt(s._dateKey,a,e)).slice(0,500))},to=async(a,e)=>{const t=`work-plans:${a}:${e}`;return Wt(t,async()=>(await Ra("work_plans","date",a)||[]).map(s=>({...s,_dateKey:jt(s,["date"])})).filter(s=>Yt(s._dateKey,a,e)).slice(0,600))},ao=(a,e)=>{const t={Present:0,Late:0,"Early Departure":0,"Work - Home":0,Training:0,"Sick Leave":0,"Casual Leave":0,"Earned Leave":0,"Paid Leave":0,"Maternity Leave":0,Absent:0,Holiday:0,"National Holiday":0,"Regional Holidays":0};(a||[]).forEach(r=>{const l=String(r?.type||"").trim();l in t?t[l]+=1:l.includes("Holiday")?t.Holiday+=1:r?.checkIn&&(t.Present+=1),(r?.lateCountable===!0||l==="Late")&&(t.Late+=1)});const n=t.Present+t["Work - Home"]+t.Training,s=t["Sick Leave"]+t["Casual Leave"]+t["Earned Leave"]+t["Paid Leave"]+t["Maternity Leave"]+t.Absent,i=t.Late,o=Math.floor((i||0)/3)*.5;return{present:n,late:i,leaves:s,unpaidLeaves:t["Sick Leave"]+t.Absent,penalty:o,penaltyOffset:0,effectivePenalty:o,extraWorkedHours:0,earlyDepartures:t["Early Departure"],label:e,breakdown:t,totalLateDuration:"0h 0m",totalExtraDuration:"0h 0m"}},no=({sectionKey:a,title:e,from:t,to:n,bodyHtml:s})=>{const i=Zi(a);return`
        <div class="dashboard-section-page" data-dashboard-section="${v(a)}">
            <div class="dashboard-section-head">
                <div>
                    <h2>${v(e)}</h2>
                    <p>Weekly-first data loading. Expand only when needed.</p>
                </div>
                <button class="action-btn secondary" type="button" onclick="window.app_backToDashboard()">
                    <i class="fa-solid fa-arrow-left"></i> Back to Dashboard
                </button>
            </div>
            <div class="dashboard-section-filter-bar">
                <label>From <input id="dashboard-section-from-${v(a)}" type="date" value="${v(t)}"></label>
                <label>To <input id="dashboard-section-to-${v(a)}" type="date" value="${v(n)}"></label>
                <button class="action-btn" type="button" onclick="window.app_applyDashboardSectionDateRange('${v(a)}')">Apply</button>
                <button class="action-btn secondary" type="button" onclick="window.app_setDashboardSectionDateRange('${v(a)}','','')">Reset to Current Week</button>
            </div>
            ${i?`<div class="dashboard-section-error">${v(i)}</div>`:""}
            <div class="dashboard-section-body">${s}</div>
        </div>
    `},so=async(a,e)=>{const t=window.AppAuth?.getUser?.(),n=Oa(),[s,i]=await Promise.all([window.AppAttendance?.getStatus?.(),Fa(n,a,e)]),o=new Set((i||[]).map(d=>d._dateKey)).size,r=n===t?.id?"My Check-in & Status":"Staff Check-in & Status",l=(i||[]).slice(0,50).map(d=>`
        <tr>
            <td>${v(d._dateKey||"--")}</td>
            <td>${v(d.checkIn||"--")}</td>
            <td>${v(d.checkOut||"--")}</td>
            <td>${v(d.type||"Attendance")}</td>
        </tr>
    `).join("");return{title:r,html:`
            <div class="card">
                <div class="dashboard-section-kpis">
                    <div class="dashboard-section-kpi"><span>Status</span><strong>${v(s?.status||"out")}</strong></div>
                    <div class="dashboard-section-kpi"><span>Days Present</span><strong>${o}</strong></div>
                    <div class="dashboard-section-kpi"><span>Range</span><strong>${v(a)} to ${v(e)}</strong></div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Type</th></tr></thead>
                        <tbody>${l||'<tr><td colspan="4">No check-in logs in this range.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>`}},io=async(a,e)=>{const t=Oa(),n=await Fa(t,a,e);return{title:"Work Log",html:`
            <div class="card dashboard-worklog-card dashboard-section-card-no-shadow">
                <div class="dashboard-worklog-head">
                    <h4>Work Log</h4>
                    <span>Date-bounded results (${v(a)} to ${v(e)})</span>
                </div>
                <div id="dashboard-section-worklog-list" class="dashboard-worklog-list">
                    ${zt(n,a,e,t,[],[])}
                </div>
            </div>`}},oo=async(a,e)=>({title:"Team Activity",html:`
            <div class="card">
                <div class="dashboard-section-inline-actions">
                    <button class="action-btn secondary" onclick="window.location.hash='team-activities'">Open Advanced Team Activities Page</button>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead><tr><th>Date</th><th>Staff</th><th>Type</th><th>Status</th><th>Description</th></tr></thead>
                        <tbody>${(await window.AppAnalytics.getAllStaffActivities({mode:"range",startIso:a,endIso:e,scope:"all",sideEffects:!1})||[]).slice(0,150).map(s=>`
        <tr>
            <td>${v(s.date||"--")}</td>
            <td>${v(s.staffName||s.userName||"--")}</td>
            <td>${v(s.type||"work")}</td>
            <td>${v(s.status||"--")}</td>
            <td>${v(s._displayDesc||s.workDescription||s.task||"--")}</td>
        </tr>
    `).join("")||'<tr><td colspan="5">No team activities in this range.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>`}),ro=async(a,e)=>{const[t,n]=await Promise.all([to(a,e),Ha(a,e)]),s=(t||[]).slice(0,120).map(o=>`
        <tr>
            <td>${v(o._dateKey||"--")}</td>
            <td>${v(o.userName||o.userId||"--")}</td>
            <td>${Array.isArray(o.plans)?o.plans.length:0}</td>
            <td><button class="action-btn secondary" onclick="window.app_openDayPlan('${v(o._dateKey||"")}','${v(o.userId||"")}')">Open Day Plan</button></td>
        </tr>
    `).join(""),i=(n||[]).slice(0,80).map(o=>`
        <tr>
            <td>${v(o.userName||o.userId||"--")}</td>
            <td>${v(o.type||"--")}</td>
            <td>${v(o.startDate||"--")}</td>
            <td>${v(o.endDate||"--")}</td>
            <td>${v(o.status||"Pending")}</td>
        </tr>
    `).join("");return{title:"Team Schedule",html:`
            <div class="card">
                <h4>Planned Work</h4>
                <div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Staff</th><th>Tasks</th><th>Action</th></tr></thead><tbody>${s||'<tr><td colspan="4">No planned work in range.</td></tr>'}</tbody></table></div>
            </div>
            <div class="card">
                <h4>Leaves in Range</h4>
                <div class="table-container"><table class="data-table"><thead><tr><th>Staff</th><th>Type</th><th>Start</th><th>End</th><th>Status</th></tr></thead><tbody>${i||'<tr><td colspan="5">No leaves in range.</td></tr>'}</tbody></table></div>
            </div>`}},lo=async()=>({title:"Staff Directory",html:await Yn()}),co=async(a,e)=>{const n=(await Ha(a,e)||[]).filter(s=>{const i=String(s.status||"").toLowerCase();return!i||i==="pending"});return{title:"Leave Requests",html:Ca(n)}},po=async(a,e)=>{const n=(await Ha(a,e)||[]).slice().sort((s,i)=>new Date(i._dateKey||0)-new Date(s._dateKey||0)).slice(0,150);return{title:"Leave History",html:La(n,{title:"Leave History",subtitle:`${a} to ${e}`,selectedDate:e})}},uo=async(a,e)=>{const[t,n]=await Promise.all([eo(a,e),window.AppDB.getCached?window.AppDB.getCached(window.AppDB.getCacheKey("sectionUsers","users",{}),6e4,()=>window.AppDB.getAll("users")):window.AppDB.getAll("users")]),s=new Map((n||[]).map(r=>[String(r.id),r]));return{title:"Missed Checkout Requests",html:`
            <div class="card">
                <div class="table-container">
                    <table class="data-table">
                        <thead><tr><th>Date</th><th>Staff</th><th>Reason</th><th>Status</th></tr></thead>
                        <tbody>${(t||[]).filter(r=>r?.missedCheckoutReasonRequired&&r?.missedCheckoutReasonSubmittedAt&&String(r?.missedCheckoutReasonStatus||"").toLowerCase()==="pending").slice(0,200).map(r=>{const l=s.get(String(r.user_id||r.userId||""));return`
            <tr>
                <td>${v(r._dateKey||"--")}</td>
                <td>${v(l?.name||"Staff")}</td>
                <td>${v(r.missedCheckoutReason||"Reason not provided")}</td>
                <td>${v(r.missedCheckoutReasonStatus||"pending")}</td>
            </tr>
        `}).join("")||'<tr><td colspan="4">No missed checkout requests in this range.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>`}},fn=async(a,e,t)=>{const n=Oa(),s=await Fa(n,a,e),i=t==="yearly"?"Yearly Stats View":"Monthly Stats View",o=ao(s,`${a} to ${e}`);return{title:i,html:je(i,"Date-range attendance metrics",o,"")}},hn={checkin:(a,e)=>so(a,e),worklog:(a,e)=>io(a,e),"team-activity":(a,e)=>oo(a,e),"team-schedule":(a,e)=>ro(a,e),"staff-directory":()=>lo(),"leave-requests":(a,e)=>co(a,e),"leave-history":(a,e)=>po(a,e),"missed-checkout":(a,e)=>uo(a,e),"stats-monthly":(a,e)=>fn(a,e,"monthly"),"stats-yearly":(a,e)=>fn(a,e,"yearly")},mo=(a="")=>{const e=String(a||"").replace(/^#/,"").trim();if(!e.startsWith(Bt))return"";const t=e.slice(Bt.length).trim();return Rt.has(t)?t:""},fo=async a=>{const e=Rt.has(a)?a:"worklog",t=Xi(e),n=Je(t.from)||Ot().from,s=Je(t.to)||Ot().to,o=await(hn[e]||hn.worklog)(n,s);return no({sectionKey:e,title:o.title||"Dashboard Section",from:n,to:s,bodyHtml:o.html||'<div class="card">No data available.</div>'})};async function os(a){return fo(a)}const na=async a=>{const e=mo(window.location.hash);if(!e||e!==a)return;const t=document.getElementById("page-content");t&&(t.innerHTML='<div class="loading-spinner"></div>',t.innerHTML=await os(a),rs())};function rs(){window.__dashboardSectionGlobalsBound||(window.__dashboardSectionGlobalsBound=!0,window.app_openDashboardSection=function(a){const e=Rt.has(String(a||"").trim())?String(a).trim():"worklog";if(window.location.hash===`#${Bt}${e}`){na(e);return}window.location.hash=`${Bt}${e}`},window.app_backToDashboard=function(){window.location.hash="dashboard"},window.app_setDashboardSectionDateRange=async function(a,e,t){const n=Rt.has(String(a||"").trim())?String(a).trim():"worklog",s=Ot(),i=Je(e)||s.from,o=Je(t)||s.to;return i>o?(mn(n,'Invalid date range: "From" must be before or equal to "To".'),await na(n),!1):(mn(n,""),Qi(n,i,o),await na(n),!0)},window.app_applyDashboardSectionDateRange=async function(a){const e=document.getElementById(`dashboard-section-from-${a}`),t=document.getElementById(`dashboard-section-to-${a}`),n=e?e.value:"",s=t?t.value:"";await window.app_setDashboardSectionDateRange(a,n,s)})}const K={renderDashboard:Ea,renderHeroCard:De,renderWorkLog:Nn,renderActivityList:zt,renderActivityLog:ha,renderStaffActivityListSplit:Ma,renderStaffActivityColumn:ya,renderStatsCard:je,renderBreakdown:On,renderLeaveRequests:Ca,renderLeaveHistory:La,renderNotificationPanel:Hn,renderTaggedItems:Un,renderStaffDirectory:si,renderStaffDirectoryPage:Yn,renderAnnualPlan:nt,renderTimesheet:st,renderProfile:Wn,renderMasterSheet:Kn,renderAdmin:ba,renderBirthdayCalendar:_i,renderSalaryProcessing:$i,renderPolicyTest:xi,renderMinutes:ns,renderCheckInModal:Ti,renderLogin:Mi,renderModals:Ci,renderYearlyPlan:Ta,renderTeamActivitiesPage:Vi,renderDashboardSectionPage:os,initDashboardSectionPage:rs};typeof window<"u"&&(window.AppUI=K);class ho{constructor(){this.db=X}normalizePlanTasks(e){return Array.isArray(e?.plans)?e.plans.filter(t=>t&&t.isRemoved!==!0):[]}getSmartTaskStatus(e,t=null){if(t==="completed"||t==="not-completed")return t;const n=new Date().toISOString().split("T")[0],s=typeof e=="string"?e:e.toISOString().split("T")[0];return s>n?"to-be-started":s===n?"in-process":s<n?"overdue":"in-process"}calculateTaskPoints(e,t){const n=this.getSmartTaskStatus(t,e.status);let s=0;switch(n){case"completed":if(s=10,e.completedDate){const i=this.getDaysDifference(t,e.completedDate);i===0?s+=3:i===1?s-=1:i>=2&&(s-=2)}break;case"in-process":s=5;break;case"to-be-started":s=0;break;case"overdue":s=-8;break;case"not-completed":s=-3;break}return s}getDaysDifference(e,t){const n=new Date(e),i=new Date(t)-n;return Math.floor(i/(1e3*60*60*24))}getCompletionStats(e){let t=0,n=0,s=0,i=0,o=0,r=0;e.forEach(d=>{this.normalizePlanTasks(d).forEach(p=>{switch(r++,this.getSmartTaskStatus(d.date,p.status)){case"completed":t++;break;case"in-process":n++;break;case"not-completed":s++;break;case"overdue":i++;break;case"to-be-started":o++;break}})});const l=r>0?t/r:0;return{completed:t,inProcess:n,notCompleted:s,overdue:i,toBeStarted:o,totalTasks:r,completionRate:parseFloat(l.toFixed(2)),lastCalculated:new Date().toISOString()}}async calculateUserRating(e,t=30){try{const n=await this.db.getAll("work_plans"),s=new Date;s.setDate(s.getDate()-t);const i=s.toISOString().split("T")[0],o=n.filter(c=>c.userId===e&&c.date>=i);if(o.length===0)return{rating:3,rawScore:0,stats:{completed:0,inProcess:0,notCompleted:0,overdue:0,toBeStarted:0,totalTasks:0,completionRate:0,lastCalculated:new Date().toISOString()}};let r=0;o.forEach(c=>{this.normalizePlanTasks(c).forEach(u=>{r+=this.calculateTaskPoints(u,c.date)})});const l=this.getCompletionStats(o),d=this.normalizeScore(r,-50,150);return{rating:parseFloat(d.toFixed(1)),rawScore:r,stats:l}}catch(n){return console.error("Rating calculation failed:",n),{rating:3,rawScore:0,stats:{completed:0,inProcess:0,notCompleted:0,overdue:0,toBeStarted:0,totalTasks:0,completionRate:0,lastCalculated:new Date().toISOString()}}}}normalizeScore(e,t,n){const i=1+(Math.max(t,Math.min(n,e))-t)/(n-t)*4;return Math.max(1,Math.min(5,i))}async updateUserRating(e){try{const t=await this.calculateUserRating(e),n=await this.db.get("users",e);if(!n)throw new Error("User not found");n.ratingHistory||(n.ratingHistory=[]);const s=new Date().toISOString().split("T")[0];return n.ratingHistory.push({date:s,rating:t.rating,reason:"auto-calculated"}),n.ratingHistory.length>90&&(n.ratingHistory=n.ratingHistory.slice(-90)),n.rating=t.rating,n.completionStats=t.stats,await this.db.put("users",n),n}catch(t){throw console.error("Failed to update user rating:",t),t}}async updateAllRatings(){try{const e=await this.db.getAll("users"),t=[];for(const n of e)try{const s=await this.updateUserRating(n.id);t.push(s)}catch(s){console.error(`Failed to update rating for ${n.name}:`,s)}return t}catch(e){throw console.error("Failed to update all ratings:",e),e}}async getTopPerformers(e=5){try{return(await this.db.getAll("users")).filter(s=>s.rating!==void 0).sort((s,i)=>(i.rating||0)-(s.rating||0)).slice(0,e).map(s=>({id:s.id,name:s.name,avatar:s.avatar,rating:s.rating||0,completionStats:s.completionStats||{}}))}catch(t){return console.error("Failed to get top performers:",t),[]}}async getRatingHistory(e,t=90){try{const n=await this.db.get("users",e);if(!n||!n.ratingHistory)return[];const s=new Date;s.setDate(s.getDate()-t);const i=s.toISOString().split("T")[0];return n.ratingHistory.filter(o=>o.date>=i)}catch(n){return console.error("Failed to get rating history:",n),[]}}}const it=new ho;typeof window<"u"&&(window.AppRating=it);class yo{constructor(){this.db=X}getTodayKey(){const e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}normalizePlanScope(e){return String(e||"").toLowerCase()==="annual"?"annual":"personal"}normalizeTaskStatus(e){const t=String(e||"").trim().toLowerCase();return t==="in-progress"?"in-process":t}getTaskRootId(e={},t="",n=0){return e.carryForwardRootId?String(e.carryForwardRootId):e.sourcePlanId&&Number.isInteger(e.sourceTaskIndex)?`${e.sourcePlanId}::${e.sourceTaskIndex}`:`${t}::${n}`}sanitizePlanTasks(e=[]){return(Array.isArray(e)?e:[]).filter(t=>t&&t.isRemoved!==!0)}isTaskClosed(e={},t=""){if(!e||e.isRemoved===!0)return!0;const n=this.normalizeTaskStatus(e.status);if(n==="completed"||n==="not-completed"||n==="cancelled")return!0;const s=this.getSmartTaskStatus(t||e.startDate||"",n||null);return s==="completed"||s==="not-completed"}cloneTaskForDate(e={},t,n,s={}){const i={...e,startDate:t,endDate:t,carryForwardRootId:n,carriedForwardFromDate:s.date||e.startDate||"",carriedForwardFromPlanId:s.id||e.carriedForwardFromPlanId||null,autoForwardedAt:new Date().toISOString(),isAutoForwarded:!0,carryForwardPolicy:"next_day_only",carryForwardReason:s.carryForwardReason||e.carryForwardReason||""};return this.normalizeTaskStatus(i.status)!=="in-process"&&(i.status=""),delete i.completedDate,delete i.removedAt,delete i.removedBy,i.isRemoved=!1,i}async getAllWorkPlansUntil(e){return this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:"<=",value:e}]).catch(()=>this.db.getAll("work_plans")):this.db.getAll("work_plans")}buildDateRange(e,t){const n=new Date(`${e}T00:00:00`),s=new Date(`${t}T00:00:00`);if(Number.isNaN(n.getTime())||Number.isNaN(s.getTime())||n>s)return[];const i=[],o=new Date(n);for(;o<=s;)i.push(`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`),o.setDate(o.getDate()+1);return i}getPreviousDateKey(e){const t=new Date(`${String(e||"").trim()}T00:00:00`);return Number.isNaN(t.getTime())?"":(t.setDate(t.getDate()-1),`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`)}isImmediateNextDay(e,t){const n=String(e||"").trim(),s=String(t||"").trim();return!n||!s?!1:this.getPreviousDateKey(s)===n}async getCarryForwardExceptionReason(e,t){const n=String(e||"").trim(),s=String(t||"").trim();if(!n||!s)return"";this._carryForwardExceptionCache||(this._carryForwardExceptionCache=new Map);const i=`${n}::${s}`;if(this._carryForwardExceptionCache.has(i))return this._carryForwardExceptionCache.get(i);let o="";return((this.db.queryMany?await this.db.queryMany("attendance",[{field:"date",operator:"==",value:s}]).catch(()=>this.db.getAll("attendance")):await this.db.getAll("attendance"))||[]).filter(d=>{const c=String(d?.user_id||d?.userId||"").trim();return d&&c===n&&String(d.date||"")===s}).some(d=>String(d.autoCheckoutReason||"").trim()==="missed_checkout_next_login")&&(o="missed_checkout"),o||((this.db.queryMany?await this.db.queryMany("leaves",[{field:"status",operator:"==",value:"Approved"}]).catch(()=>this.db.getAll("leaves")):await this.db.getAll("leaves"))||[]).some(p=>{if(!p||String(p.userId||p.user_id||"").trim()!==n||String(p.status||"")!=="Approved")return!1;const m=String(p.startDate||"").trim(),h=String(p.endDate||"").trim();return!m||!h?!1:m<=s&&s<=h})&&(o="leave_day"),this._carryForwardExceptionCache.set(i,o),o}async isCarryForwardExceptionDay(e,t){return!!await this.getCarryForwardExceptionReason(e,t)}async isEligibleNextDayCarryTask(e={},t,n,s){return!e||e.isRemoved===!0||!this.isImmediateNextDay(t,n)||this.isTaskClosed(e,t)?!1:this.isCarryForwardExceptionDay(s,t)}async ensureCarryForwardForRange(e,t,n={}){const s=String(t||"").trim();if(!s)return{created:0,updatedPlans:[]};const i=this.getTodayKey(),o=s>i?i:s,r=String(e||o).trim()||o;if(r>o)return{created:0,updatedPlans:[]};const l=Array.isArray(n.userIds)?n.userIds.map(m=>String(m||"").trim()).filter(Boolean):null;this._carryForwardExceptionCache=new Map;const d=(await this.getAllWorkPlansUntil(o)).filter(m=>!!m&&!!m.date&&m.date<=o),c=new Map,p=(m,h,f)=>{const g=`${h}::${f}`;c.has(g)||c.set(g,new Map),c.get(g).set(m.date,{...m,planScope:h,plans:Array.isArray(m.plans)?[...m.plans]:[]})};d.forEach(m=>{if(this.normalizePlanScope(m.planScope)!=="personal")return;const f=String(m.userId||"").trim();!f||f==="annual_shared"||l&&!l.includes(f)||p(m,"personal",f)});const u=[];for(const[m,h]of c.entries()){const[f,g]=m.split("::"),S=this.buildDateRange(r,o);for(const A of S){let b=h.get(A)||null;const x=b&&Array.isArray(b.plans)?[...b.plans]:[],D=new Set;x.forEach((y,k)=>{D.add(this.getTaskRootId(y,b?.id||this.getWorkPlanId(A,g,f),k))});const T=[],_=this.getPreviousDateKey(A),E=_?h.get(_):null,M=_?await this.getCarryForwardExceptionReason(g,_):"",w=E&&Array.isArray(E.plans)?E.plans:[];if(M&&E&&w.length>0)for(let y=0;y<w.length;y+=1){const k=w[y];if(!await this.isEligibleNextDayCarryTask(k,_,A,g))continue;const P=this.getTaskRootId(k,E.id,y);D.has(P)||(T.push(this.cloneTaskForDate(k,A,P,{id:E.id,date:E.date,sourceTaskIndex:y,carryForwardReason:M})),D.add(P))}if(T.length>0){const k=T[0]?.assignedToName||E?.userName||"";b||(b={id:this.getWorkPlanId(A,g,f),userId:g,userName:k,date:A,plans:[],planScope:f}),b.plans=[...x,...T],b.updatedAt=new Date().toISOString(),await this.db.put("work_plans",b),h.set(A,b),u.push(b.id)}}}return{created:u.length,updatedPlans:u}}async ensureCarryForwardForDate(e,t={}){const n=String(e||"").trim();return n?this.ensureCarryForwardForRange(n,n,t):{created:0,updatedPlans:[]}}getWorkPlanId(e,t=null,n="personal"){return this.normalizePlanScope(n)==="annual"?`plan_annual_${e}`:`plan_${t}_${e}`}async getPlans(){try{const e=new Date,t=new Date(e.getFullYear(),e.getMonth()-2,1).toISOString().split("T")[0],n=new Date(e.getFullYear(),e.getMonth()+3,0).toISOString().split("T")[0],[s,i,o,r]=await Promise.all([this.db.getAll("leaves"),this.db.getAll("events").catch(()=>[]),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:t},{field:"date",operator:"<=",value:n}]).catch(()=>this.db.getAll("work_plans")):this.db.getAll("work_plans"),this.db.getCached?this.db.getCached(this.db.getCacheKey("calendarUsers","users",{}),N?.READ_CACHE_TTLS?.users||6e4,()=>this.db.getAll("users")).catch(()=>[]):this.db.getAll("users").catch(()=>[])]),l={};r.forEach(u=>{l[u.id]=u.name});const d=(s||[]).filter(u=>u.status==="Approved").map(u=>({...u,userName:u.userName||l[u.userId]||"Staff"})),c=(()=>{const u=new Map;return(i||[]).forEach(m=>{const h=[String(m.date||"").trim(),String(m.title||"").trim().toLowerCase(),String(m.type||"event").trim().toLowerCase(),String(m.createdById||m.createdByName||"").trim().toLowerCase()].join("|");u.has(h)||u.set(h,m)}),Array.from(u.values())})(),p=(o||[]).map(u=>({...u,plans:this.sanitizePlanTasks(u.plans)})).filter(u=>u.plans.length>0);return{leaves:d,events:c,workPlans:p}}catch(e){return console.error("Failed to fetch calendar plans:",e),{leaves:[],events:[],workPlans:[]}}}async setWorkPlan(e,t=[],n=null,s={}){const i=te.getUser();if(!i)throw new Error("Not authenticated");const o=this.normalizePlanScope(s.planScope),r=n||i.id,l=await this.db.getAll("users"),d=l.find(p=>p.id===r);if(!d)throw console.error("setWorkPlan Error: Target user not found",{targetId:r,currentUser:i,allUsersCount:l.length}),new Error("Target user not found");const c={id:this.getWorkPlanId(e,r,o),userId:o==="annual"?"annual_shared":r,userName:o==="annual"?"All Staff":d.name,date:e,plans:Array.isArray(t)?t:[],planScope:o,createdById:i.id,createdByName:i.name||"Admin",updatedAt:new Date().toISOString()};return await this.db.put("work_plans",c)}async addWorkPlanTask(e,t,n,s=[],i={}){let o=await this.getWorkPlan(t,e);if(!o){const l=(await this.db.getAll("users")).find(d=>d.id===t);if(!l)throw new Error("Target user not found");o={id:`plan_${t}_${e}`,userId:t,userName:l.name,date:e,plans:[],updatedAt:new Date().toISOString()}}if(o.plans||(o.plans=[]),o.plans=this.sanitizePlanTasks(o.plans),i.sourcePlanId!==void 0&&i.sourceTaskIndex!==void 0&&i.sourcePlanId!==null){const r=o.plans.find(l=>l.sourcePlanId===i.sourcePlanId&&l.sourceTaskIndex===i.sourceTaskIndex&&l.addedFrom===(i.addedFrom||"minutes"));if(r)return r.task=n,r.subPlans=i.subPlans||r.subPlans||[],r.tags=s,r.status=i.status||r.status||"pending",r.startDate=i.startDate||r.startDate||e,r.endDate=i.endDate||r.endDate||r.startDate||e,r.updatedAt=new Date().toISOString(),o.updatedAt=new Date().toISOString(),await this.db.put("work_plans",o)}return o.plans.push({task:n,subPlans:i.subPlans||[],tags:s,status:i.status||"pending",startDate:i.startDate||e,endDate:i.endDate||i.startDate||e,addedFrom:i.addedFrom||"minutes",sourcePlanId:i.sourcePlanId||null,sourceTaskIndex:i.sourceTaskIndex??null,taggedById:i.taggedById||null,taggedByName:i.taggedByName||null}),o.updatedAt=new Date().toISOString(),await this.db.put("work_plans",o)}extractDateFromPlanToken(e=""){const n=String(e||"").trim().match(/(\d{4}-\d{2}-\d{2})/);return n?n[1]:""}extractOwnerFromPlanToken(e=""){const t=String(e||"").trim();if(!t)return"";if(t.startsWith("plan_annual_"))return"annual_shared";const n=t.match(/^plan_([^_]+)_\d{4}-\d{2}-\d{2}/);return n?n[1]:""}resolveTaskOriginDate(e={}){const t=String(e.carriedForwardFromDate||"").trim();if(/^\d{4}-\d{2}-\d{2}$/.test(t))return t;const n=this.extractDateFromPlanToken(e.carryForwardRootId);if(n)return n;const s=this.extractDateFromPlanToken(e.carriedForwardFromPlanId);if(s)return s;const i=this.extractDateFromPlanToken(e.sourcePlanId);if(i)return i;const o=String(e.startDate||"").trim();if(/^\d{4}-\d{2}-\d{2}$/.test(o))return o;const r=String(e.endDate||"").trim();return/^\d{4}-\d{2}-\d{2}$/.test(r)?r:""}isTaggedCopyOriginTask(e={}){const t=String(e.addedFrom||"").toLowerCase().trim(),n=t==="tag"||t==="delegated"||t==="staff",s=!!e.sourcePlanId||Number.isInteger(e.sourceTaskIndex)||Number.isFinite(Number(e.sourceTaskIndex));return n||s}hasLegacyTaggedTextPattern(e={}){const t=String(e.task||"");return t?(t.match(/\(Responsible:/gi)||[]).length>1:!1}hasResponsibleMarker(e={}){const t=String(e.task||"");return/\((Responsible|Assigned to):/i.test(t)}normalizeTaskForStaleCompare(e=""){return String(e||"").replace(/\s*\((Responsible|Assigned to):[^)]*\)\s*/gi," ").replace(/\s+/g," ").trim().toLowerCase()}hasCarryForwardLineage(e={}){return!!(e.carryForwardRootId||e.isAutoForwarded===!0||e.carriedForwardFromDate||e.carriedForwardFromPlanId)}async findCarryForwardIssues(e={}){const t=e.includeAssignedMismatch===!0,n=await this.db.getAll("work_plans"),s=[];return(n||[]).forEach(i=>{if(!i||this.normalizePlanScope(i.planScope)!=="personal")return;const o=String(i.userId||"").trim();!o||!Array.isArray(i.plans)||i.plans.length===0||i.plans.forEach((r,l)=>{if(!r||r.isRemoved===!0||!this.hasCarryForwardLineage(r))return;const d=String(r.carryForwardRootId||r.carriedForwardFromPlanId||r.sourcePlanId||"").trim(),c=this.extractOwnerFromPlanToken(d),p=String(r.assignedTo||"").trim(),u=!!(c&&o&&c!==o),m=!!(p&&o&&p!==o);!u&&!(t&&m)||s.push({planId:i.id||"",planDate:i.date||"",planUserId:o,planUserName:i.userName||"",taskIndex:l,taskText:r.task||"",originDate:this.resolveTaskOriginDate(r),rootToken:d,rootOwner:c,assignedTo:p,isAutoForwarded:r.isAutoForwarded===!0,carryForwardReason:String(r.carryForwardReason||"").trim(),ownerMismatch:u,assignedMismatch:m})})}),s.sort((i,o)=>{const r=String(o.planDate||"").localeCompare(String(i.planDate||""));return r||String(i.planUserName||"").localeCompare(String(o.planUserName||""))}),s}async cleanupInvalidTodayCarryForward(e,t,n={}){const s=String(e||"").trim(),i=String(t||"").trim();if(!s||!i)return{ok:!1,removed:0,reason:"invalid_input"};const o=n.onlyToday!==!1,r=this.getTodayKey();if(o&&i!==r)return{ok:!0,removed:0,reason:"not_today"};const l=this.getPreviousDateKey(i),d=await this.getWorkPlan(s,i,{planScope:"personal"});if(!d||!Array.isArray(d.plans)||d.plans.length===0)return{ok:!0,removed:0,reason:"no_plan"};const c=[];let p=0;for(const u of d.plans){if(!u||u.isRemoved===!0){c.push(u);continue}if(this.isTaskClosed(u,i)){c.push(u);continue}const m=this.hasCarryForwardLineage(u),h=this.resolveTaskOriginDate(u);let f=!1;if(h&&h<l)f=!0;else if(m)if(!h||h!==l)f=!0;else{const g=await this.isEligibleNextDayCarryTask(u,h,i,s),S=await this.getCarryForwardExceptionReason(s,h),A=String(u.carryForwardReason||"").trim(),b=String(u.carryForwardPolicy||"").trim();g||(f=!0),!f&&b&&b!=="next_day_only"&&(f=!0),!f&&S&&A&&A!==S&&(f=!0)}if(f){p+=1;continue}c.push(u)}return p===0?{ok:!0,removed:0,reason:"no_matches"}:(d.plans=c,d.updatedAt=new Date().toISOString(),await this.db.put("work_plans",d),{ok:!0,removed:p,planId:d.id,date:i})}async cleanupInvalidTodayCarryForwardForDate(e,t={}){const n=String(e||"").trim();if(!n)return{ok:!1,removed:0,scannedPlans:0,reason:"invalid_date"};const s=t.onlyToday!==!1,i=this.getTodayKey();if(s&&n!==i)return{ok:!0,removed:0,scannedPlans:0,reason:"not_today"};const r=((this.db.queryMany?await this.db.queryMany("work_plans",[{field:"date",operator:"==",value:n}]).catch(()=>this.db.getAll("work_plans")):await this.db.getAll("work_plans"))||[]).filter(d=>d&&String(d.date||"")===n&&this.normalizePlanScope(d.planScope)==="personal"&&Array.isArray(d.plans)&&d.plans.length>0);let l=0;for(const d of r){const c=String(d.userId||"").trim();if(!c)continue;const p=await this.cleanupInvalidTodayCarryForward(c,n,{onlyToday:s});l+=Number(p?.removed||0)}return{ok:!0,removed:l,scannedPlans:r.length,date:n}}async cleanupOldCarryForwardTaggedTasks(e,t,n={}){return this.cleanupInvalidTodayCarryForward(e,t,n)}async cleanupOldCarryForwardTaggedTasksForDate(e,t={}){return this.cleanupInvalidTodayCarryForwardForDate(e,t)}async deleteWorkPlan(e,t=null,n={}){const s=te.getUser();if(!s)throw new Error("Not authenticated");const i=this.normalizePlanScope(n.planScope),o=t||s.id;return await this.db.delete("work_plans",this.getWorkPlanId(e,o,i))}async purgeWorkPlansByDate(e,t={}){const n=String(e||"").trim();if(!n)return{ok:!1,removedPlans:0,reason:"invalid_date"};const s=Array.isArray(t.scopes)&&t.scopes.length?t.scopes.map(r=>this.normalizePlanScope(r)):["personal","annual"],o=((this.db.queryMany?await this.db.queryMany("work_plans",[{field:"date",operator:"==",value:n}]).catch(()=>this.db.getAll("work_plans")):await this.db.getAll("work_plans"))||[]).filter(r=>r&&String(r.date||"")===n&&s.includes(this.normalizePlanScope(r.planScope))&&Array.isArray(r.plans)&&r.plans.length>0);for(const r of o)r.plans=[],r.updatedAt=new Date().toISOString(),await this.db.put("work_plans",r);return{ok:!0,removedPlans:o.length,date:n}}async purgeCarriedForwardTasksByDate(e,t={}){const n=String(e||"").trim();if(!n)return{ok:!1,removedTasks:0,touchedPlans:0,reason:"invalid_date"};const s=Array.isArray(t.scopes)&&t.scopes.length?t.scopes.map(d=>this.normalizePlanScope(d)):["personal","annual"],o=((this.db.queryMany?await this.db.queryMany("work_plans",[{field:"date",operator:"==",value:n}]).catch(()=>this.db.getAll("work_plans")):await this.db.getAll("work_plans"))||[]).filter(d=>d&&String(d.date||"")===n&&s.includes(this.normalizePlanScope(d.planScope))&&Array.isArray(d.plans)&&d.plans.length>0);let r=0,l=0;for(const d of o){const c=d.plans.length;d.plans=d.plans.filter(u=>!this.hasCarryForwardLineage(u));const p=d.plans.length;p!==c&&(r+=c-p,l+=1,d.updatedAt=new Date().toISOString(),await this.db.put("work_plans",d))}return{ok:!0,removedTasks:r,touchedPlans:l,date:n}}async getWorkPlan(e,t,n={}){const s=!!n.includeAnnual,i=!!n.mergeAnnual,o=n.planScope?this.normalizePlanScope(n.planScope):null,r=!!n.preferAnnual;if(o){const u=await this.db.get("work_plans",this.getWorkPlanId(t,e,o));return u?{...u,plans:this.sanitizePlanTasks(u.plans)}:null}const l=await this.db.get("work_plans",this.getWorkPlanId(t,e,"personal")),d=l?{...l,plans:this.sanitizePlanTasks(l.plans)}:null;if(!s)return d;const c=await this.db.get("work_plans",this.getWorkPlanId(t,e,"annual")),p=c?{...c,plans:this.sanitizePlanTasks(c.plans)}:null;if(i&&p&&d){const u=[];return(p.plans||[]).forEach((m,h)=>{u.push({...m,_planId:p.id,_taskIndex:h,_planDate:p.date,_planScope:"annual"})}),(d.plans||[]).forEach((m,h)=>{u.push({...m,_planId:d.id,_taskIndex:h,_planDate:d.date,_planScope:"personal"})}),{id:`plan_merged_${e}_${t}`,userId:e,userName:d.userName||"Staff",date:t,planScope:"mixed",plans:u,personalPlanId:d.id,annualPlanId:p.id}}return r?p||d:d||p}getSmartTaskStatus(e,t=null){if(it)return it.getSmartTaskStatus(e,t);if(t==="completed"||t==="not-completed")return t;const n=new Date().toISOString().split("T")[0],s=typeof e=="string"?e:e.toISOString().split("T")[0];return s>n?"to-be-started":s===n?"in-process":s<n?"overdue":"in-process"}async updateTaskStatus(e,t,n,s=null){try{const i=await this.db.get("work_plans",e);if(!i||!i.plans||!i.plans[t])throw new Error("Plan or task not found");return i.plans[t].status=n,n==="completed"&&!i.plans[t].completedDate&&(i.plans[t].completedDate=s||new Date().toISOString().split("T")[0]),i.updatedAt=new Date().toISOString(),await this.db.put("work_plans",i),it&&await it.updateUserRating(i.userId),i}catch(i){throw console.error("Failed to update task status:",i),i}}async removeTask(e,t){try{const n=te.getUser(),s=await this.db.get("work_plans",e);if(!s||!Array.isArray(s.plans)||!s.plans[t])throw new Error("Plan or task not found");return s.plans[t]={...s.plans[t],status:"not-completed",isRemoved:!0,removedAt:new Date().toISOString(),removedBy:n?.id||""},s.updatedAt=new Date().toISOString(),await this.db.put("work_plans",s),s}catch(n){throw console.error("Failed to remove task:",n),n}}async reassignTask(e,t,n){try{const s=await this.db.get("work_plans",e);if(!s||!s.plans||!s.plans[t])throw new Error("Plan or task not found");if(!(await this.db.getAll("users")).find(r=>r.id===n))throw new Error("New user not found");return s.plans[t].assignedTo=n,s.updatedAt=new Date().toISOString(),await this.db.put("work_plans",s),s}catch(s){throw console.error("Failed to reassign task:",s),s}}async getTasksByStatus(e,t,n=null,s=null){try{const o=(await this.db.getAll("work_plans")).filter(l=>l.userId===e),r=[];return o.forEach(l=>{n&&l.date<n||s&&l.date>s||l.plans&&Array.isArray(l.plans)&&l.plans.forEach((d,c)=>{if(d.isRemoved===!0)return;const p=this.getSmartTaskStatus(l.date,d.status);p===t&&r.push({...d,planId:l.id,taskIndex:c,planDate:l.date,calculatedStatus:p})})}),r}catch(i){return console.error("Failed to get tasks by status:",i),[]}}async getCollaborations(e,t=null){try{return(await this.db.getAll("work_plans")).filter(s=>(!t||s.date===t)&&s.plans&&s.plans.some(i=>i.tags&&i.tags.some(o=>o.id===e&&o.status==="accepted")))}catch(n){return console.error("Failed to fetch collaborations:",n),[]}}async addEvent(e){const t={id:"ev_"+Date.now(),...e,createdOn:new Date().toISOString()};return await this.db.add("events",t)}_toLocalISO(e){const t=new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`}async getMonthEvents(e,t){const n=await this.getPlans(),s=[];n.leaves.forEach(r=>{const l=new Date(r.startDate),d=new Date(r.endDate);let c=new Date(l);for(;c<=d;)s.push({date:this._toLocalISO(c),title:`${r.userName||"Staff"} (Leave)`,type:"leave",userId:r.userId}),c.setDate(c.getDate()+1)});const i=n.workPlans.map(r=>{const l=[];return r.plans.forEach(d=>{let c=d.task;d.subPlans&&d.subPlans.length>0&&(c+=" ("+d.subPlans.join(", ")+")"),d.tags&&d.tags.length>0&&(c+=" with "+d.tags.map(p=>p.name).join(", ")),l.push(c)}),{date:r.date,title:`${r.userName}: ${l.join("; ")}`,type:"work",userId:r.userId,plans:r.plans}});return[...s,...n.events,...i].filter(r=>{const l=new Date(r.date);return l.getFullYear()===e&&l.getMonth()===t})}}const he=new yo;typeof window<"u"&&(window.AppCalendar=he);class wo{constructor(){this.isActive=!1,this.activeMinutes=0,this.totalMinutes=0,this.monitorInterval=null,this.lastActivityTime=Date.now(),this.isCurrentlyActive=!1,this.performedAudits={},this.commandListener=null,this.processedCommandIds=new Set,this.startTime=Date.now(),this.handleActivity=this.handleActivity.bind(this),this.tick=this.tick.bind(this),X&&this.initCommandListener()}initCommandListener(){this.commandListener||X&&X.listen&&(console.log("Activity Monitor: Initializing System Command Listener..."),this.commandListener=X.listen("system_commands",e=>{const t=te.getUser();if(!t){console.log("[Audit] Command detected but user not authenticated yet. Waiting...");return}const n=e.filter(s=>s.type==="audit"&&s.timestamp>this.startTime-6e5&&!this.processedCommandIds.has(s.id)).sort((s,i)=>i.timestamp-s.timestamp);if(n.length>0){const s=n[0];console.log("[Audit] Manual Command Received!",s.id),this.processedCommandIds.add(s.id);const i=s.slotName||`Manual Audit @ ${new Date().toLocaleTimeString()}`;console.log(`[Audit] Executing for user: ${t.name} in slot: ${i}`),this.performSilentAudit(i)}}))}async performSilentAudit(e){const t=te.getUser();if(!t)return;const n=new Date().toISOString().split("T")[0];if(this.performedAudits[n]||(this.performedAudits[n]={}),this.performedAudits[n][e])return;console.log(`Executing Silent Location Audit for slot: ${e}`),this.performedAudits[n][e]=!0;let s={userId:t.id,userName:t.name,timestamp:Date.now(),slot:e,status:"Success",lat:0,lng:0};try{if(window.getLocation){const i=await window.getLocation().catch(o=>(console.warn("Silent Audit Location Failed:",o),null));i?(s.lat=i.lat,s.lng=i.lng):s.status="Location service disabled"}else s.status="Location service disabled (missing helper)"}catch{s.status="Location service disabled"}try{await X.add("location_audits",s),console.log("Silent Audit Log Saved.")}catch(i){console.error("Failed to save audit log:",i)}}start(){this.isActive||(this.isActive=!0,this.activeMinutes=0,this.totalMinutes=0,this.isCurrentlyActive=!1,this.lastActivityTime=Date.now(),document.addEventListener("mousemove",this.handleActivity),document.addEventListener("click",this.handleActivity),document.addEventListener("keydown",this.handleActivity),document.addEventListener("scroll",this.handleActivity),this.monitorInterval=setInterval(this.tick,6e4),console.log("Activity Monitoring Started"))}stop(){if(this.isActive)return this.isActive=!1,document.removeEventListener("mousemove",this.handleActivity),document.removeEventListener("click",this.handleActivity),document.removeEventListener("keydown",this.handleActivity),document.removeEventListener("scroll",this.handleActivity),this.monitorInterval&&clearInterval(this.monitorInterval),console.log("Activity Monitoring Stopped. Score:",this.getScore()),this.getStats()}handleActivity(){this.isCurrentlyActive||(this.isCurrentlyActive=!0,this.lastActivityTime=Date.now())}tick(){this.totalMinutes++,this.isCurrentlyActive&&this.activeMinutes++;const e=te.getUser();e&&e.status==="in"&&(e.activityScore=this.getScore(),e.lastActive=this.lastActivityTime,X.put("users",e)),this.isCurrentlyActive=!1}getScore(){return this.totalMinutes===0?100:Math.round(this.activeMinutes/this.totalMinutes*100)}getStats(){return{score:this.getScore(),activeMinutes:this.activeMinutes,totalMinutes:this.totalMinutes}}}const go=new wo;typeof window<"u"&&(window.AppActivity=go);class bo{constructor(){this.active=!1,this.currentStep=0,this.steps=[],this.overlay=null,this.tooltip=null,this.highlight=null,this.tourKey="crwi_tour_completed"}init(e){if(e){if(localStorage.getItem(this.tourKey+"_"+e.id)){console.log("Tour already completed for user:",e.id);return}this.defineSteps(e),setTimeout(()=>{this.startTour(e)},2e3)}}defineSteps(e){e.isAdmin||e.role==="Administrator"?this.steps=[{element:".sidebar-header",title:"Welcome, Admin!",content:"This is your CRWI Attendance management console. Let us walk you through the key features.",position:"right"},{element:'.nav-item[data-page="admin"]',title:"User Management",content:"In the Admin Panel, you can add new staff, edit details, and manage roles.",position:"right"},{element:'.nav-item[data-page="master-sheet"]',title:"Attendance Sheet",content:"View and export the master attendance sheet for all employees here.",position:"right"},{element:'.nav-item[data-page="salary"]',title:"Salary Processing",content:"Calculate and process salaries based on attendance logs and penalties.",position:"right"},{element:".main-content",title:"Dashboard Overview",content:"The dashboard gives you real-time insights into who is in, pending leaves, and team activity.",position:"bottom"}]:this.steps=[{element:".sidebar-header",title:"Welcome to CRWI!",content:"This portal helps you track your attendance and work logs. Here is a quick guide.",position:"right"},{element:".action-btn",title:"Check-In / Out",content:"Use this button daily to mark your attendance. Don't forget to add a summary when checking out!",position:"bottom"},{element:'.nav-item[data-page="timesheet"]',title:"Your Timesheet",content:"Review your past logs and request leaves from here.",position:"right"},{element:'.nav-item[data-page="profile"]',title:"Your Profile",content:"View your stats, rewards, and manage your account details.",position:"right"}]}startTour(e){this.steps.length!==0&&(this.active=!0,this.currentStep=0,this.createUIElements(),this.showStep(),localStorage.setItem(this.tourKey+"_"+e.id,"true"))}createUIElements(){this.overlay=document.createElement("div"),this.overlay.className="tour-overlay",this.highlight=document.createElement("div"),this.highlight.className="tour-highlight",this.tooltip=document.createElement("div"),this.tooltip.className="tour-tooltip",document.body.appendChild(this.overlay),document.body.appendChild(this.highlight),document.body.appendChild(this.tooltip)}showStep(){const e=this.steps[this.currentStep],t=document.querySelector(e.element);if(!t||t.offsetParent===null){console.warn("Tour target not found:",e.element),this.nextStep();return}const n=t.getBoundingClientRect(),s=5;this.highlight.style.top=n.top-s+"px",this.highlight.style.left=n.left-s+"px",this.highlight.style.width=n.width+s*2+"px",this.highlight.style.height=n.height+s*2+"px",t.scrollIntoView({behavior:"smooth",block:"center"}),this.tooltip.innerHTML=`
                <div class="tour-tooltip-header">
                    <h4>${e.title}</h4>
                    <span class="tour-progress">${this.currentStep+1} / ${this.steps.length}</span>
                </div>
                <div class="tour-tooltip-content">${e.content}</div>
                <div class="tour-tooltip-footer">
                    <button class="tour-btn-skip" onclick="window.AppTour.endTour()">Skip</button>
                    <button class="tour-btn-next" onclick="window.AppTour.nextStep()">
                        ${this.currentStep===this.steps.length-1?"Finish":"Next"}
                    </button>
                </div>
            `,this.positionTooltip(n,e.position),this.tooltip.classList.add("active")}positionTooltip(e,t){const n=this.tooltip.getBoundingClientRect(),s=15;let i,o;switch(t){case"right":i=e.top+e.height/2-n.height/2,o=e.right+s;break;case"bottom":i=e.bottom+s,o=e.left+e.width/2-n.width/2;break;case"left":i=e.top+e.height/2-n.height/2,o=e.left-n.width-s;break;case"top":i=e.top-n.height-s,o=e.left+e.width/2-n.width/2;break;default:i=e.bottom+s,o=e.left}const r=window.innerWidth,l=window.innerHeight;o<10&&(o=10),o+n.width>r-10&&(o=r-n.width-10),i<10&&(i=10),i+n.height>l-10&&(i=l-n.height-10),this.tooltip.style.top=i+"px",this.tooltip.style.left=o+"px"}nextStep(){this.currentStep++,this.currentStep<this.steps.length?this.showStep():this.endTour()}endTour(){this.active=!1,this.overlay&&this.overlay.remove(),this.highlight&&this.highlight.remove(),this.tooltip&&this.tooltip.remove()}resetTour(e){localStorage.removeItem(this.tourKey+"_"+e),window.location.reload()}}const vo=new bo;typeof window<"u"&&(window.AppTour=vo);class So{constructor(){this.db=X,this.chartInstance=null,this.memo=new Map,typeof window<"u"&&window.addEventListener&&window.addEventListener("app:db-write",e=>{const t=e?.detail?.collection;["attendance","users","work_plans","leaves","minutes"].includes(t)&&this.clearMemo()})}getFlags(){return N&&N.READ_OPT_FLAGS||{}}getTtls(){return N&&N.READ_CACHE_TTLS||{}}async memoize(e,t,n){if(!this.getFlags().FF_READ_OPT_ANALYTICS_CACHE)return n();const i=Date.now(),o=this.memo.get(e);if(o&&o.expiresAt>i)return o.value;const r=await n();return this.memo.set(e,{value:r,expiresAt:i+Math.max(0,Number(t)||0)}),r}clearMemo(e=""){if(!e){this.memo.clear();return}for(const t of this.memo.keys())t.startsWith(e)&&this.memo.delete(t)}async getUsersCached(){const e=this.getTtls().users||6e4;return this.memoize("analytics:users",e,async()=>{if(X&&X.getCached){const t=X.getCacheKey("analyticsUsers","users",{ttl:e});return X.getCached(t,e,()=>this.db.getAll("users"))}return this.db.getAll("users")})}async getAttendanceInRange(e,t,n=""){const s=this.getTtls().attendanceSummary||3e4,i=typeof e=="string"?e:e.toISOString().split("T")[0],o=typeof t=="string"?t:t.toISOString().split("T")[0],r=`analytics:attendance:${i}:${o}:${n}`;return this.memoize(r,s,async()=>this.db.queryMany?this.db.queryMany("attendance",[{field:"date",operator:">=",value:i},{field:"date",operator:"<=",value:o}]):(await this.db.getAll("attendance")).filter(d=>d.date>=i&&d.date<=o))}async initAdminCharts(){const e=document.getElementById("admin-stats-chart");if(!e)return;this.chartInstance&&(this.chartInstance.destroy(),this.chartInstance=null);const t=new Date,n=new Date;n.setDate(n.getDate()-14);const[s,i]=await Promise.all([this.getAttendanceInRange(n,t,"adminChart"),this.getUsersCached()]),o=this.processLast7Days(s,i),r=e.getContext("2d");try{this.chartInstance=new Chart(r,{type:"line",data:{labels:o.labels,datasets:[{label:"Staff Present",data:o.present,borderColor:"#10b981",backgroundColor:"rgba(16, 185, 129, 0.1)",fill:!0,tension:.4,borderWidth:3,pointBackgroundColor:"#10b981",pointRadius:4},{label:"On Leave",data:o.onLeave,borderColor:"#ef4444",backgroundColor:"transparent",borderDash:[5,5],tension:.1,pointRadius:0}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{intersect:!1,mode:"index"},plugins:{legend:{position:"top",labels:{usePointStyle:!0,boxWidth:6}},tooltip:{backgroundColor:"rgba(30, 27, 75, 0.9)",padding:12,titleFont:{size:14,weight:"bold"},bodyFont:{size:13},cornerRadius:8}},scales:{y:{beginAtZero:!0,ticks:{stepSize:1,color:"#6b7280"},grid:{color:"rgba(0,0,0,0.05)"}},x:{grid:{display:!1},ticks:{color:"#6b7280"}}}}})}catch(l){console.error("Chart.js Error:",l),e.parentNode.innerHTML=`<div style="color:red; text-align:center; padding:1rem;">Failed to load chart: ${l.message}</div>`}}processLast7Days(e,t=[]){const n=[],s=[],i=[],o=l=>{if(Object.prototype.hasOwnProperty.call(l||{},"attendanceEligible"))return l.attendanceEligible===!0;const d=String(l?.entrySource||"");return d==="staff_manual_work"?!1:d==="admin_override"||d==="checkin_checkout"||l?.isManualOverride||l?.location==="Office (Manual)"||l?.location==="Office (Override)"||typeof l?.activityScore<"u"||typeof l?.locationMismatched<"u"||typeof l?.autoCheckout<"u"||!!l?.checkOutLocation||typeof l?.outLat<"u"||typeof l?.outLng<"u"?!0:String(l?.type||"").includes("Leave")||l?.location==="On Leave"},r=(l,d)=>l.getFullYear()===d.getFullYear()&&l.getMonth()===d.getMonth()&&l.getDate()===d.getDate();for(let l=6;l>=0;l--){const d=new Date;d.setDate(d.getDate()-l);const c=d.toLocaleDateString("en-US",{weekday:"short",day:"numeric"});n.push(c);const p=e.filter(h=>{const f=new Date(h.date);return isNaN(f.getTime())?!1:r(f,d)}),u=new Set,m=new Set;p.forEach(h=>{if(!o(h))return;const f=h.user_id||h.userId;if(!f)return;String(h.type||"").toLowerCase().includes("leave")||h.location==="On Leave"||h.type==="Absent"?m.add(f):u.add(f)}),l===0&&t.forEach(h=>{h.status==="in"&&u.add(h.id)}),s.push(u.size),i.push(m.size)}return console.log("Weekly Stats Generated (Unique):",{labels:n,present:s}),{labels:n,present:s,onLeave:i}}parseTimeToMinutes(e){if(!e)return null;const[t,n]=e.split(" ");let[s,i]=t.split(":");return s==="12"&&(s="00"),n==="PM"&&(s=parseInt(s,10)+12),parseInt(s,10)*60+parseInt(i,10)}isAttendanceEligibleLog(e){if(Object.prototype.hasOwnProperty.call(e||{},"attendanceEligible"))return e.attendanceEligible===!0;const t=String(e?.entrySource||"");return t==="staff_manual_work"?!1:t==="admin_override"||t==="checkin_checkout"||e?.isManualOverride||e?.location==="Office (Manual)"||e?.location==="Office (Override)"||typeof e?.activityScore<"u"||typeof e?.locationMismatched<"u"||typeof e?.autoCheckout<"u"||!!e?.checkOutLocation||typeof e?.outLat<"u"||typeof e?.outLng<"u"?!0:String(e?.type||"").includes("Leave")||e?.location==="On Leave"}getAttendanceLogPriority(e){const n=String(e?.type||"").includes("Leave")||e?.location==="On Leave",s=!!e?.checkOut&&e.checkOut!=="Active Now"&&(typeof e?.activityScore<"u"||typeof e?.locationMismatched<"u"||!!e?.checkOutLocation||typeof e?.outLat<"u"||typeof e?.outLng<"u");let i=1;return s&&(i=2),n&&(i=3),e?.isManualOverride&&(i=4),i}pickBestAttendanceLogPerDay(e,t,n){const s=new Map,i=o=>`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`;return e.forEach(o=>{const r=new Date(o?.date);if(Number.isNaN(r.getTime())||r<t||r>n)return;const l=/^\d{4}-\d{2}-\d{2}$/.test(String(o?.date||""))?String(o.date):i(r),d=s.get(l);(!d||this.getAttendanceLogPriority(o)>this.getAttendanceLogPriority(d))&&s.set(l,o)}),Array.from(s.values())}formatDuration(e){const t=Math.floor(e/60),n=e%60;return`${t}h ${n}m`}getWeekNumber(e){const t=new Date(e);t.setHours(0,0,0,0),t.setDate(t.getDate()+4-(t.getUTCDay()||7));const n=new Date(t.getFullYear(),0,1);return Math.ceil(((t-n)/864e5+1)/7)}async getUserMonthlyStats(e){const t=new Date,n=new Date(t.getFullYear(),t.getMonth(),1),s=new Date(t.getFullYear(),t.getMonth()+1,0),o=(await this.getAttendanceInRange(n,s,`monthly:${e}`)).filter(r=>r.userId===e||r.user_id===e);return this.calculateStatsForLogs(o)}getWeekendPolicy(e){const t=new Date(`${e}T00:00:00`),n=t.getDay();if(n===0)return"holiday";if(n===6){const s=Math.floor((t.getDate()-1)/7)+1;if(s===2||s===4)return"holiday";if(s===1||s===3||s===5)return"halfday"}return"working"}async getHolidayDateSetInRange(e,t){const n=`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`,s=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;let i=[];try{window.AppDB?.queryMany?i=await window.AppDB.queryMany("events",[{field:"date",operator:">=",value:n},{field:"date",operator:"<=",value:s}]):i=(await window.AppDB.getAll("events")||[]).filter(p=>{const u=String(p?.date||"").trim();return u>=n&&u<=s})}catch(c){console.warn("Analytics: events query failed, continuing without calendar holidays",c),i=[]}let o=[];try{if(window.AppPolicies?.getHolidaysForYear)o=await window.AppPolicies.getHolidaysForYear(e.getFullYear(),!1);else{const c=await window.AppDB.get("settings","holidays").catch(()=>null);o=Array.isArray(c?.byYear?.[String(e.getFullYear())])?c.byYear[String(e.getFullYear())]:[]}}catch(c){console.warn("Analytics: holiday settings lookup failed, continuing without configured holidays",c),o=[]}const r=c=>{const p=String(c||"").trim();if(!p)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(p))return p;const u=new Date(p);return Number.isNaN(u.getTime())?"":`${u.getFullYear()}-${String(u.getMonth()+1).padStart(2,"0")}-${String(u.getDate()).padStart(2,"0")}`},l=c=>{const p=String(c?.type||"").trim().toLowerCase(),u=String(c?.title||"").trim().toLowerCase();return p.includes("holiday")||u.includes("holiday")},d=new Set;return(i||[]).forEach(c=>{if(!l(c))return;const p=r(c?.date);!p||p<n||p>s||d.add(p)}),(o||[]).forEach(c=>{const p=r(c?.date);!p||p<n||p>s||d.add(p)}),d}applyImpliedMonthlyAbsences(e,t,n,s,i,o=new Set){const r=new Date,l=`${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,"0")}-${String(r.getDate()).padStart(2,"0")}`,d=String(e?.joinDate||"").trim(),c=/^\d{4}-\d{2}-\d{2}$/.test(d)?d:"",p=this.pickBestAttendanceLogPerDay(t,s,i),u=new Set(p.filter(m=>this.isAttendanceEligibleLog(m)).map(m=>String(m?.date||"").trim()).filter(Boolean));for(let m=new Date(s);m<=i;m.setDate(m.getDate()+1)){const h=`${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,"0")}-${String(m.getDate()).padStart(2,"0")}`;h>l||c&&h<c||o.has(h)||this.getWeekendPolicy(h)!=="holiday"&&(u.has(h)||(n.unpaidLeaves+=1,n.breakdown.Absent+=1,n.leaves+=1))}return n}async getSystemMonthlySummary(){const e=new Date,t=new Date(e.getFullYear(),e.getMonth(),1),n=new Date(e.getFullYear(),e.getMonth()+1,0),[s,i,o]=await Promise.all([this.getUsersCached(),this.getAttendanceInRange(t,n,"sysMonthly"),this.getHolidayDateSetInRange(t,n)]);return await Promise.all(s.map(async l=>{const d=i.filter(p=>(p.userId===l.id||p.user_id===l.id)&&new Date(p.date)>=t&&new Date(p.date)<=n),c=this.applyImpliedMonthlyAbsences(l,d,this.calculateStatsForLogs(d),t,n,o);return{user:l,stats:c}}))}calculateStatsForLogs(e){const t=new Date,n=t.getFullYear(),s=t.getMonth(),i=new Date(n,s,1),o=new Date(n,s+1,0),r={Present:0,Late:0,"Early Departure":0,"Work - Home":0,Training:0,"Sick Leave":0,"Casual Leave":0,"Earned Leave":0,"Paid Leave":0,"Maternity Leave":0,Absent:0,Holiday:0,"National Holiday":0,"Regional Holidays":0},l={present:0,late:0,leaves:0,unpaidLeaves:0,penalty:0,penaltyOffset:0,effectivePenalty:0,extraWorkedHours:0,earlyDepartures:0,label:i.toLocaleDateString("default",{month:"long",year:"numeric"}),breakdown:r,totalLateDuration:"0h 0m",totalExtraDuration:"0h 0m"};let d=0,c=0;this.pickBestAttendanceLogPerDay(e,i,o).forEach(h=>{if(!this.isAttendanceEligibleLog(h))return;let f=h.type||"";const g=this.parseTimeToMinutes(h.checkIn),S=this.parseTimeToMinutes(h.checkOut);if(h.isManualOverride===!0)if(f==="Late"){l.late++,r.Late++;const T=(typeof N<"u"&&N?N.LATE_CUTOFF_MINUTES:555)||555;g!==null&&g>T&&(d+=g-T)}else f==="Early Departure"&&(l.earlyDepartures++,r["Early Departure"]++);else{const T=(typeof N<"u"&&N?N.LATE_CUTOFF_MINUTES:555)||555;(h.lateCountable===!0||!Object.prototype.hasOwnProperty.call(h,"lateCountable")&&g!==null&&g>T)&&(r.Late++,l.late++,g!==null&&(d+=Math.max(0,g-T)));const E=(typeof N<"u"&&N?N.EARLY_DEPARTURE_MINUTES:1020)||1020;S!==null&&S<E&&!String(f).includes("Leave")&&f!=="Absent"&&(l.earlyDepartures++,r["Early Departure"]++)}const b=(typeof N<"u"&&N?N.LATE_CUTOFF_MINUTES:555)||555,x=(typeof N<"u"&&N?N.EARLY_DEPARTURE_MINUTES:1020)||1020,D=typeof h.extraWorkedMs=="number"?Math.max(0,Math.round(h.extraWorkedMs/(1e3*60))):0;D>0?c+=D:!(h.autoCheckout&&!h.autoCheckoutExtraApproved)&&(g!==null&&g<b&&(c+=b-g),S!==null&&S>x&&(c+=S-x)),f==="Work - Home"?r["Work - Home"]++:f==="Training"?r.Training++:f==="Sick Leave"?(r["Sick Leave"]++,l.unpaidLeaves++):f==="Casual Leave"?r["Casual Leave"]++:f==="Earned Leave"?r["Earned Leave"]++:f==="Paid Leave"?r["Paid Leave"]++:f==="Maternity Leave"?r["Maternity Leave"]++:f==="Absent"?(r.Absent++,l.unpaidLeaves++):f==="National Holiday"?r["National Holiday"]++:f==="Regional Holidays"?r["Regional Holidays"]++:String(f).includes("Holiday")?r.Holiday++:h.checkIn&&r.Present++}),l.present=r.Present+r["Work - Home"]+r.Training,l.leaves=r["Sick Leave"]+r["Casual Leave"]+r["Earned Leave"]+r["Paid Leave"]+r["Maternity Leave"]+r.Absent,l.extraWorkedHours=Number((c/60).toFixed(2)),l.penalty=Math.floor((l.late||0)/((typeof N<"u"&&N?N.LATE_GRACE_COUNT:3)||3))*((typeof N<"u"&&N?N.LATE_DEDUCTION_PER_BLOCK:.5)||.5);const u=(typeof N<"u"&&N?N.EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4)||4,m=(typeof N<"u"&&N?N.LATE_DEDUCTION_PER_BLOCK:.5)||.5;return l.penaltyOffset=Math.floor((l.extraWorkedHours||0)/u)*m,l.effectivePenalty=Math.max(0,l.penalty-l.penaltyOffset),l.totalLateDuration=this.formatDuration(d),l.totalExtraDuration=this.formatDuration(c),l}async getUserYearlyStats(e){const{start:t,end:n,label:s}=this.getFinancialYearDates(),o=(await this.getAttendanceInRange(t,n,`yearly:${e}`)).filter(h=>h.userId===e||h.user_id===e),r={Present:0,Late:0,"Early Departure":0,"Work - Home":0,Training:0,"Sick Leave":0,"Casual Leave":0,"Earned Leave":0,"Paid Leave":0,"Maternity Leave":0,Absent:0,Holiday:0,"National Holiday":0,"Regional Holidays":0},l={present:0,late:0,leaves:0,earlyDepartures:0,penaltyLeaves:0,penaltyOffset:0,effectivePenalty:0,extraWorkedHours:0,label:s,breakdown:r,totalLateDuration:"0h 0m",totalExtraDuration:"0h 0m"};let d=0,c=0;this.pickBestAttendanceLogPerDay(o,t,n).forEach(h=>{if(!this.isAttendanceEligibleLog(h))return;let f=h.type||"";const g=this.parseTimeToMinutes(h.checkIn),S=this.parseTimeToMinutes(h.checkOut),A=(typeof N<"u"&&N?N.LATE_CUTOFF_MINUTES:555)||555,b=(typeof N<"u"&&N?N.EARLY_DEPARTURE_MINUTES:1020)||1020;h.isManualOverride===!0?f==="Late"?(r.Late++,g!==null&&g>A&&(d+=g-A)):f==="Early Departure"&&(l.earlyDepartures++,r["Early Departure"]++):((h.lateCountable===!0||!Object.prototype.hasOwnProperty.call(h,"lateCountable")&&g!==null&&g>A)&&(r.Late++,g!==null&&(d+=Math.max(0,g-A))),S!==null&&S<b&&!String(f).includes("Leave")&&f!=="Absent"&&(l.earlyDepartures++,r["Early Departure"]++));const D=typeof h.extraWorkedMs=="number"?Math.max(0,Math.round(h.extraWorkedMs/(1e3*60))):0;D>0?c+=D:!(h.autoCheckout&&!h.autoCheckoutExtraApproved)&&(g!==null&&g<A&&(c+=A-g),S!==null&&S>b&&(c+=S-b)),f==="Work - Home"?r["Work - Home"]++:f==="Training"?r.Training++:f==="Sick Leave"?r["Sick Leave"]++:f==="Casual Leave"?r["Casual Leave"]++:f==="Earned Leave"?r["Earned Leave"]++:f==="Paid Leave"?r["Paid Leave"]++:f==="Maternity Leave"?r["Maternity Leave"]++:f==="Absent"?r.Absent++:f==="National Holiday"?r["National Holiday"]++:f==="Regional Holidays"?r["Regional Holidays"]++:String(f).includes("Holiday")?r.Holiday++:h.checkIn&&r.Present++}),l.present=r.Present+r["Work - Home"]+r.Training,l.leaves=r["Sick Leave"]+r["Casual Leave"]+r["Earned Leave"]+r["Paid Leave"]+r["Maternity Leave"]+r.Absent,l.late=r.Late,l.extraWorkedHours=Number((c/60).toFixed(2)),l.totalLateDuration=this.formatDuration(d),l.totalExtraDuration=this.formatDuration(c),l.penaltyLeaves=Math.floor((r.Late||0)/((typeof N<"u"&&N?N.LATE_GRACE_COUNT:3)||3))*((typeof N<"u"&&N?N.LATE_DEDUCTION_PER_BLOCK:.5)||.5);const u=(typeof N<"u"&&N?N.EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4)||4,m=(typeof N<"u"&&N?N.LATE_DEDUCTION_PER_BLOCK:.5)||.5;return l.penaltyOffset=Math.floor((l.extraWorkedHours||0)/u)*m,l.effectivePenalty=Math.max(0,l.penaltyLeaves-l.penaltyOffset),l}getFinancialYearDates(){const e=new Date,t=e.getFullYear(),n=e.getMonth(),s=(typeof N<"u"&&N?N.FY_START_MONTH:3)||3;let i=t;n<s&&(i=t-1);const o=new Date(i,s,1),r=new Date(i+1,s,0);return{start:o,end:r,label:`FY ${i}-${i+1}`}}getDayType(e){const t=typeof e=="string"?new Date(e):e,n=t.getDay();return n===0||n===6&&typeof N<"u"&&N&&N.IS_SATURDAY_OFF&&N.IS_SATURDAY_OFF(t)?"Holiday":"Work Day"}getHeroPolicy(){return N?.HERO_POLICY||{}}getHeroScoreRange(e=null){const t=e instanceof Date&&!Number.isNaN(e.getTime())?new Date(e):window.AppDB?.getIstNow?window.AppDB.getIstNow():new Date,n=new Date(t);n.setDate(t.getDate()-1),n.setHours(23,59,59,999);const s=new Date(n);return s.setDate(n.getDate()-6),s.setHours(0,0,0,0),{start:s,end:n}}createZeroHeroStats(e=""){return{userId:String(e||""),days:0,hours:0,totalDurationMs:0,activityLogDepth:0,taskPlanned:0,taskCompleted:0,taskInProgress:0,taskMissed:0,completionRate:0,taskScore:0,attendanceFactor:Number((this.getHeroPolicy()?.ATTENDANCE_MODIFIER?.base??.9).toFixed(3)),finalScore:0}}parseHeroLogDate(e){if(!e)return null;if(e instanceof Date&&!Number.isNaN(e.getTime()))return e;if(typeof e!="string")return null;const t=e.trim();if(!t)return null;const n=new Date(t);if(!Number.isNaN(n.getTime()))return n;const s=t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);if(!s)return null;const i=Number(s[1]),o=Number(s[2]);let r=Number(s[3]);if(r<100&&(r+=2e3),!Number.isFinite(i)||!Number.isFinite(o)||!Number.isFinite(r))return null;const l=i>12?o:i,d=i>12?i:o,c=new Date(r,l-1,d);return Number.isNaN(c.getTime())?null:c}resolveHeroUserId(e){const t=e?.user_id??e?.userId??e?.uid??e?.user??"";return String(t||"").trim()||null}resolveHeroDurationMs(e){let t=Number(e?.durationMs);if(Number.isFinite(t)||(t=0),t>0)return t;if(e?.checkIn&&e?.checkOut&&e.checkOut!=="Active Now"){const n=this.parseTimeToMinutes(e.checkIn),s=this.parseTimeToMinutes(e.checkOut);n!==null&&s!==null&&(t=(s-n)*60*1e3)}return Math.max(0,Number(t)||0)}normalizeHeroLogs(e=[]){return(e||[]).map(t=>{const n=this.parseHeroLogDate(t?.date),s=this.resolveHeroUserId(t);if(!n||!s)return null;const i=this.resolveHeroDurationMs(t),o=Number(t?.activityScore);return{userId:s,logDate:n,dateKey:n.toISOString().split("T")[0],durationMs:i,activityLogDepth:String(t?.workDescription||"").length,activityScore:Number.isFinite(o)?o:null}}).filter(Boolean)}buildHeroCandidateStats(e=[]){const t=new Map;return e.forEach(n=>{t.has(n.userId)||t.set(n.userId,{userId:n.userId,totalDurationMs:0,daysSet:new Set,activityLogDepth:0,activityScoreTotal:0,activityScoreCount:0});const s=t.get(n.userId);s.totalDurationMs+=Math.max(0,Number(n.durationMs)||0),s.daysSet.add(n.dateKey),s.activityLogDepth+=Math.max(0,Number(n.activityLogDepth)||0),Number.isFinite(n.activityScore)&&(s.activityScoreTotal+=n.activityScore,s.activityScoreCount+=1)}),Array.from(t.values())}classifyHeroTaskStatus(e,t=null){const n=String(e||"").toLowerCase().trim();if(n==="postponed")return"postponed";const s=window.AppCalendar?.getSmartTaskStatus?String(window.AppCalendar.getSmartTaskStatus(t,n)||n):n;return s==="completed"?"completed":s==="in-process"||s==="in progress"||s==="to-be-started"||s==="pending"||s===""?"in_progress":s==="not-completed"||s==="overdue"||s==="missed"?"missed":"in_progress"}normalizeHeroTasks(e=[]){const t=[];return(e||[]).forEach(n=>{const s=String(n?.userId||n?.user_id||"").trim();!s||!Array.isArray(n?.plans)||n.plans.forEach((i,o)=>{if(!i||!String(i.task||"").trim())return;const r=this.classifyHeroTaskStatus(i.status,n.date);t.push({userId:s,status:r,date:n.date,planId:String(n?.id||""),taskIndex:o,rawStatus:String(i.status||"").trim().toLowerCase(),task:String(i.task||""),subPlans:Array.isArray(i.subPlans)?i.subPlans.slice():[],completedDate:i.completedDate||null,assignedTo:String(i.assignedTo||n?.userId||n?.user_id||"").trim(),assignedToName:String(i.assignedToName||n?.userName||"").trim()})})}),t}buildHeroTaskBuckets(e=[]){const t=new Map,n=s=>(t.has(s)||t.set(s,{completed:[],in_progress:[],postponed:[],missed:[]}),t.get(s));return e.forEach(s=>{if(!s?.userId)return;const i=n(String(s.userId)),o=["completed","in_progress","postponed","missed"].includes(s.status)?s.status:"in_progress";i[o].push({userId:String(s.userId),planId:String(s.planId||""),taskIndex:Number(s.taskIndex),date:String(s.date||""),task:String(s.task||""),subPlans:Array.isArray(s.subPlans)?s.subPlans.slice():[],status:o,rawStatus:String(s.rawStatus||""),completedDate:s.completedDate||null,assignedTo:String(s.assignedTo||""),assignedToName:String(s.assignedToName||"")})}),t}buildHeroTaskStats(e=[]){const t=new Map;return e.forEach(n=>{t.has(n.userId)||t.set(n.userId,{planned:0,completed:0,inProgress:0,missed:0,postponed:0});const s=t.get(n.userId);s.planned+=1,n.status==="completed"?s.completed+=1:n.status==="postponed"?s.postponed+=1:n.status==="missed"?s.missed+=1:s.inProgress+=1}),t}rankHeroCandidates(e=[],t=new Map,n={}){const s=n.WEIGHTS||{},i=n.CAPS||{},o=Math.max(1,Number(n.WINDOW_DAYS||7)),r=Math.max(1,Number(i.hours||40)),l=n.ATTENDANCE_MODIFIER||{},d=Number(s.taskExecution??.45),c=Number(s.taskCompletionRate??.2),p=Number(s.taskInProgressSupport??.1),u=Number(s.taskMissPenalty??.1),m=Number(l.base??.9),h=Number(l.maxBonus??.15),f=Number(l.consistencyImpact??.65),g=Number(l.effortImpact??.35),S=new Map(e.map(b=>[String(b.userId),b])),A=new Set([...S.keys(),...t.keys()]);return Array.from(A).map(b=>{const x=S.get(String(b))||{totalDurationMs:0,daysSet:new Set,activityLogDepth:0},D=t.get(String(b))||{planned:0,completed:0,inProgress:0,missed:0,postponed:0},T=x.daysSet.size,_=x.totalDurationMs/(1e3*60*60),E=Math.max(0,Number(D.planned)||0),M=Math.max(0,Number(D.completed)||0),w=Math.max(0,Number(D.postponed)||0),y=Math.max(0,Number(D.inProgress)||0),k=Math.max(0,Number(D.missed)||0),P=k+w,R=E>0?M/E*100:0,C=E>0?Math.max(0,Math.min(100,(M+y*.5-P)/E*100)):0,B=E>0?Math.max(0,Math.min(100,y/E*100)):0,O=E>0?Math.max(0,Math.min(100,P/E*100)):0,F=T/o*100,U=Math.min(_/r*100,100),W=C*d+R*c+B*p-O*u,$=F/100*f+U/100*g,I=Math.max(0,Math.min(h,$*h)),H=Math.max(.5,m+I),L=W*H;return{userId:b,days:T,hours:Number(_.toFixed(1)),totalDurationMs:Math.max(0,Number(x.totalDurationMs)||0),activityLogDepth:x.activityLogDepth,taskPlanned:E,taskCompleted:M,taskInProgress:y,taskMissed:k,taskPostponed:w,completionRate:Number(R.toFixed(1)),taskScore:Number(Math.max(0,W).toFixed(2)),attendanceFactor:Number(H.toFixed(3)),finalScore:Number(Math.max(0,L).toFixed(2))}}).sort((b,x)=>x.finalScore!==b.finalScore?x.finalScore-b.finalScore:x.taskCompleted!==b.taskCompleted?x.taskCompleted-b.taskCompleted:b.taskMissed!==x.taskMissed?b.taskMissed-x.taskMissed:x.days!==b.days?x.days-b.days:x.totalDurationMs!==b.totalDurationMs?x.totalDurationMs-b.totalDurationMs:String(b.userId).localeCompare(String(x.userId)))}createNoHeroPayload({reason:e="No eligible attendance data found.",period:t="weekly",source:n="direct_cache"}={}){return{state:"no_eligible_data",user:null,stats:null,reason:e,period:t,source:n,confidence:0,schemaVersion:Number(this.getHeroPolicy()?.SCHEMA_VERSION||1)}}scoreHeroFromLogs(e=[],t=[],n={}){const s=String(n.period||"weekly"),i=String(n.source||"direct_cache"),o=this.getHeroPolicy(),r=o.MIN_EVIDENCE||{},l=Math.max(1,Number(r.minDays||1)),d=Math.max(0,Number(r.minDurationMs||1)),c=Math.max(0,Number(r.minPlannedTasks||1)),p=this.normalizeHeroLogs(e),u=Array.isArray(n.workPlans)?n.workPlans:[],m=this.normalizeHeroTasks(u);if(p.length===0&&m.length===0)return this.createNoHeroPayload({period:s,source:i});const f=this.rankHeroCandidates(this.buildHeroCandidateStats(p),this.buildHeroTaskStats(m),o).filter(T=>T.taskPlanned>=c&&(T.days>=l||T.totalDurationMs>=d));if(f.length===0)return this.createNoHeroPayload({reason:"No staff met the minimum hero criteria this period.",period:s,source:i});const g=f[0],S=(t||[]).find(T=>String(T.id)===String(g.userId));if(!S)return this.createNoHeroPayload({reason:"No valid user mapping found for hero candidates.",period:s,source:i});const A=g.taskPlanned>0?Math.min(1,g.taskCompleted/g.taskPlanned):0,b=Math.min(1,g.days/Math.max(1,Number(o.WINDOW_DAYS||7))),x=Math.min(1,g.totalDurationMs/(1e3*60*60*Math.max(1,Number(o?.CAPS?.hours||40)))),D=Number(((A+b+x)/3).toFixed(2));return{state:"winner",user:S,stats:g,reason:this.determineHeroReason(g),period:s,source:i,confidence:D,schemaVersion:Number(o.SCHEMA_VERSION||1)}}async getHeroOfTheWeek(e={}){try{const t=this.getHeroPolicy(),n=Math.max(1,Number(t.WINDOW_DAYS||7)),{start:s,end:i}=this.getHeroScoreRange(e.baseDate),[o,r,l]=await Promise.all([this.getAttendanceInRange(s,i,"hero_yesterday_window"),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:s.toISOString().split("T")[0]},{field:"date",operator:"<=",value:i.toISOString().split("T")[0]}]):this.db.getAll("work_plans"),this.getUsersCached()]),d=this.scoreHeroFromLogs(o,l,{period:"yesterday_back_7_days",source:String(e.source||"direct_cache"),workPlans:r});return d.state==="winner"?{...d,meta:{startDate:s.toISOString().split("T")[0],endDate:i.toISOString().split("T")[0],windowDays:n}}:{...d,period:"yesterday_back_7_days",source:String(e.source||"direct_cache"),reason:d.reason||"No staff met the minimum hero criteria in the last 7 completed days.",schemaVersion:Number(t.SCHEMA_VERSION||1),meta:{windowDays:n,startDate:s.toISOString().split("T")[0],endDate:i.toISOString().split("T")[0]}}}catch(t){return console.error("Hero Calculation Error:",t),{state:"fetch_error",user:null,stats:null,reason:"Unable to calculate hero right now.",period:"weekly",source:String(e.source||"direct_cache"),confidence:0,schemaVersion:Number(this.getHeroPolicy()?.SCHEMA_VERSION||1)}}}async getHeroLeaderboard(e={}){try{const t=this.getHeroPolicy(),n=t.MIN_EVIDENCE||{},s=Math.max(1,Number(n.minDays||1)),i=Math.max(0,Number(n.minDurationMs||1)),o=Math.max(0,Number(n.minPlannedTasks||1)),{start:r,end:l}=this.getHeroScoreRange(e.baseDate),[d,c,p]=await Promise.all([this.getAttendanceInRange(r,l,"hero_yesterday_window"),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:r.toISOString().split("T")[0]},{field:"date",operator:"<=",value:l.toISOString().split("T")[0]}]):this.db.getAll("work_plans"),this.getUsersCached()]),u=this.normalizeHeroLogs(d),m=this.normalizeHeroTasks(c),h=this.rankHeroCandidates(this.buildHeroCandidateStats(u),this.buildHeroTaskStats(m),t),f=this.buildHeroTaskBuckets(m),g=new Map(h.map((A,b)=>[String(A.userId),{...A,rank:b+1}])),S=(Array.isArray(p)?p:[]).map(A=>{const b=String(A?.id||"").trim(),x=g.get(b)||{...this.createZeroHeroStats(b),rank:null},D=x.taskPlanned>=o&&(x.days>=s||x.totalDurationMs>=i);return{user:A,stats:x,rank:x.rank,isEligible:D,taskBuckets:f.get(b)||{completed:[],in_progress:[],postponed:[],missed:[]},eligibilityReason:D?"Eligible":`Needs at least ${o} planned task${o===1?"":"s"} and ${s} day${s===1?"":"s"} or tracked time.`,period:"yesterday_back_7_days"}}).sort((A,b)=>{const x=Number.isFinite(A.rank)?A.rank:Number.MAX_SAFE_INTEGER,D=Number.isFinite(b.rank)?b.rank:Number.MAX_SAFE_INTEGER;return x!==D?x-D:String(A.user?.name||"").localeCompare(String(b.user?.name||""))});return{state:"ok",period:"yesterday_back_7_days",source:String(e.source||"direct_cache"),rows:S,winnerUserId:S.find(A=>A.isEligible&&Number(A.rank)===1)?.user?.id||null,meta:{startDate:r.toISOString().split("T")[0],endDate:l.toISOString().split("T")[0],schemaVersion:Number(t.SCHEMA_VERSION||1)}}}catch(t){return console.error("Hero Leaderboard Error:",t),{state:"fetch_error",period:"yesterday_back_7_days",source:String(e.source||"direct_cache"),rows:[],winnerUserId:null,meta:{schemaVersion:Number(this.getHeroPolicy()?.SCHEMA_VERSION||1)}}}}determineHeroReason(e){const t=Number(e?.taskPlanned||0),n=Number(e?.taskCompleted||0),s=Number(e?.taskInProgress||0),i=Number(e?.taskMissed||0),o=t>0?n/t*100:0,r=Number(e?.attendanceFactor||1);return t>=6&&o>=80?"Execution Champion":n>=4&&s>=2?"Delivery Momentum":o>=70&&r>=1?"Reliable Executor":t>0&&i===0&&o>=60?"Reliable Finisher":"Top Performer"}async getSystemPerformance(){try{const e=new Date;e.setDate(e.getDate()-7);const t=await this.getAttendanceInRange(e,new Date,"performance"),n=[],s=[];let i=0,o=0;const r=(d,c)=>d.getFullYear()===c.getFullYear()&&d.getMonth()===c.getMonth()&&d.getDate()===c.getDate();for(let d=6;d>=0;d--){const c=new Date;c.setDate(c.getDate()-d);const p=c.toLocaleDateString("en-US",{weekday:"narrow"});s.push(p);const u=t.filter(m=>{const h=new Date(m.date);return!isNaN(h.getTime())&&r(h,c)});if(u.length===0)n.push(0);else{const m=u.map(f=>f.activityScore||0).filter(f=>f>0),h=m.length>0?m.reduce((f,g)=>f+g,0)/m.length:0;n.push(Math.round(h)),h>0&&(i+=h,o++)}}return{avgScore:o>0?Math.round(i/o):0,trendData:n,labels:s}}catch(e){return console.error("System Performance Calculation Error:",e),{avgScore:0,trendData:[0,0,0,0,0,0,0]}}}async buildDailyDashboardSummary(e={}){const t=new Date,n=String(e.dateKey||t.toISOString().split("T")[0]),s=String(e.selectedMonth||t.toISOString().slice(0,7)),[i,o]=s.split("-"),r=Number(i),l=Number(o)-1,d=Number.isInteger(r)&&Number.isInteger(l)&&l>=0&&l<=11?new Date(r,l,1):new Date(t.getFullYear(),t.getMonth(),1),c=Number.isInteger(r)&&Number.isInteger(l)&&l>=0&&l<=11?new Date(r,l+1,0):new Date(t.getFullYear(),t.getMonth()+1,0),p=Math.max(1,Number(N?.SUMMARY_POLICY?.TEAM_ACTIVITY_LIMIT)||15),[u,m,h]=await Promise.all([this.getHeroOfTheWeek({source:"shared_summary"}),this.getHeroLeaderboard({source:"shared_summary"}),this.getAllStaffActivities({mode:"month",month:s,scope:"all",sideEffects:!1})]);return{dateKey:n,monthKey:s,version:Number(N?.SUMMARY_POLICY?.SCHEMA_VERSION||1),generatedAt:Date.now(),hero:u&&u.state!=="fetch_error"?u:null,heroLeaderboard:m&&m.state!=="fetch_error"?m:null,teamActivityPreview:(h||[]).slice(0,p),range:{startIso:d.toISOString().split("T")[0],endIso:c.toISOString().split("T")[0]},meta:{generatedAt:Date.now(),source:"client_first_writer",generationGate:"first_checkin"}}}async getAllStaffActivities(e={}){try{const t=e||{},n=t.mode||"month",s=t.scope||"all",i=t.sideEffects!==!1,o=_=>{const E=String(_||"").trim();if(!E)return"";const M=E.replace(/\s+/g,"");if(/^\d{4}-\d{2}-\d{2}$/.test(M))return M;if(/^\d{2}-\d{2}-\d{4}$/.test(M)){const[y,k,P]=M.split("-");return`${P}-${k}-${y}`}if(/^\d{4}\/\d{2}\/\d{2}$/.test(M))return M.replace(/\//g,"-");if(/^\d{2}\/\d{2}\/\d{4}$/.test(M)){const[y,k,P]=M.split("/");return`${P}-${k}-${y}`}const w=new Date(E);return Number.isNaN(w.getTime())?"":w.toISOString().split("T")[0]},r=new Date,l=new Date;if(n==="range"){const _=String(t.startIso||""),E=String(t.endIso||"");let M=o(_),w=o(E);if(!M||!w){console.warn("Invalid range dates, falling back to last 30 days:",_,E);const P=new Date,R=new Date;R.setDate(P.getDate()-30),M=R.toISOString().split("T")[0],w=P.toISOString().split("T")[0]}if(M>w){const P=M;M=w,w=P}const y=new Date(M),k=new Date(w);l.setTime(y.getTime()),r.setTime(k.getTime()),l.setHours(0,0,0,0),r.setHours(23,59,59,999)}else if(n==="days"){const _=Number.isFinite(Number(t.daysBack))?Number(t.daysBack):7;r.setHours(23,59,59,999),l.setDate(l.getDate()-_),l.setHours(0,0,0,0)}else{const _=String(t.month||new Date().toISOString().slice(0,7)),[E,M]=_.split("-"),w=Number(E),y=Number(M)-1;if(!Number.isInteger(w)||!Number.isInteger(y)||y<0||y>11)throw new Error(`Invalid month key: ${_}`);const k=new Date(w,y,1),P=new Date(w,y+1,0);l.setTime(k.getTime()),r.setTime(P.getTime()),l.setHours(0,0,0,0),r.setHours(23,59,59,999)}const d=l.toISOString().split("T")[0],c=r.toISOString().split("T")[0];if(i&&window.AppCalendar?.ensureCarryForwardForRange&&await window.AppCalendar.ensureCarryForwardForRange(d,c),i&&window.AppCalendar?.cleanupInvalidTodayCarryForwardForDate){const _=window.AppCalendar.getTodayKey?window.AppCalendar.getTodayKey():"";if(_&&_>=d&&_<=c)try{const E=await window.AppCalendar.cleanupInvalidTodayCarryForwardForDate(_,{onlyToday:!0});(E?.removed||0)>0&&console.log(`Team activity global cleanup removed ${E.removed} invalid carry task(s) for ${_}.`)}catch(E){console.warn("Global invalid carry cleanup failed:",E)}}const p=s!=="work",[u,m,h]=await Promise.all([p?this.getAttendanceInRange(l,r,`staffAct:${d}:${c}:${s}`):Promise.resolve([]),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:d},{field:"date",operator:"<=",value:c}]):X.getAll("work_plans"),this.getUsersCached()]),f={};h.forEach(_=>{f[_.id]=_.name});const g=[],S={},A=(_={})=>{if(window.AppCalendar?.isTaggedCopyOriginTask)return window.AppCalendar.isTaggedCopyOriginTask(_);const E=String(_.addedFrom||"").toLowerCase().trim(),M=E==="tag"||E==="delegated"||E==="staff",w=!!_.sourcePlanId||Number.isInteger(_.sourceTaskIndex)||Number.isFinite(Number(_.sourceTaskIndex));return M||w},b=(_={})=>window.AppCalendar?.hasCarryForwardLineage?window.AppCalendar.hasCarryForwardLineage(_):!!(_.carryForwardRootId||_.isAutoForwarded===!0||_.carriedForwardFromDate||_.carriedForwardFromPlanId),x=(_={})=>{if(window.AppCalendar?.resolveTaskOriginDate)return String(window.AppCalendar.resolveTaskOriginDate(_)||"");const E=String(_.carriedForwardFromDate||"").trim();if(/^\d{4}-\d{2}-\d{2}$/.test(E))return E;const M=String(_.sourcePlanId||"").match(/(\d{4}-\d{2}-\d{2})/);if(M)return M[1];const w=String(_.carryForwardRootId||"").match(/(\d{4}-\d{2}-\d{2})/);return w?w[1]:""},D=(_={})=>{if(window.AppCalendar?.hasLegacyTaggedTextPattern)return!!window.AppCalendar.hasLegacyTaggedTextPattern(_);const E=String(_.task||"");return E?(E.match(/\(Responsible:/gi)||[]).length>1:!1},T=(_={})=>{const E=String(_.status||"").trim().toLowerCase();return["completed","complete","done","finished","closed"].includes(E)?"completed":["not-completed","not completed","cancelled","canceled","removed"].includes(E)?"not-completed":["in-process","in process","working","started"].includes(E)?"in-process":["to-be-started","to be started","pending","planned"].includes(E)?"to-be-started":_.completedDate||_.completedAt||_.completed_on?"completed":""};return p&&u.forEach(_=>{const E=o(_.date);if(E&&E>=d&&E<=c&&_.workDescription){const M=_.user_id||_.userId,w=`${M}:${E}`;S[w]||(S[w]=[]),S[w].push(_.workDescription.toLowerCase().trim()),g.push({..._,type:"attendance",staffName:f[M]||_.userName||"Unknown Staff",_displayDesc:_.workDescription,_sortTime:_.checkOut||"00:00",status:"completed",date:E})}}),m.forEach(_=>{const E=o(_.date);if(E&&E>=d&&E<=c&&_.plans){const M=`${_.userId}:${E}`,w=S[M]||[];_.plans.forEach((y,k)=>{if(y?.isRemoved===!0||(()=>{const F=String(y?.status||"").trim().toLowerCase();if(F==="completed"||F==="not-completed"||F==="cancelled")return!1;const W=b(y),$=x(y),I=window.AppCalendar?.getPreviousDateKey?window.AppCalendar.getPreviousDateKey(E):(()=>{const H=new Date(`${E}T00:00:00`);return Number.isNaN(H.getTime())?"":(H.setDate(H.getDate()-1),`${H.getFullYear()}-${String(H.getMonth()+1).padStart(2,"0")}-${String(H.getDate()).padStart(2,"0")}`)})();return!!(W&&($&&I&&$<I||$&&I&&$>I||!$||I&&$&&$!==I||String(y.carryForwardPolicy||"")&&String(y.carryForwardPolicy)!=="next_day_only")||A(y)&&D(y))})())return;const R=(y.task||"").trim().toLowerCase();if(R&&w.length>0&&w.some(U=>U.includes(R)))return;const C=_.userId||_.user_id;let B=f[C]||_.userName;B||(B=C==="annual_shared"?"All Staff":"Unknown Staff");const O=T(y);g.push({...y,date:E,id:_.id,planId:_.id,taskIndex:k,planScope:y.planScope||_.planScope||"personal",userId:C,type:"work",staffName:B,status:O,_displayDesc:y.task,_sortTime:""})})}}),g.sort((_,E)=>{const M=new Date(E.date)-new Date(_.date);return M!==0?M:E._sortTime.localeCompare(_._sortTime)}),g}catch(t){return console.error("Error fetching all staff activities:",t),[]}}}const ko=new So;typeof window<"u"&&(window.AppAnalytics=ko);class Ao{constructor(){this.db=X}convertToCSV(e,t,n){const s=t.join(","),i=e.map(o=>n.map(r=>{let l=o[r]||"";return l=String(l).replace(/"/g,'""'),l.search(/("|,|\n)/g)>=0&&(l=`"${l}"`),l}).join(","));return[s,...i].join(`
`)}downloadFile(e,t,n){const s=new Blob([e],{type:n}),i=URL.createObjectURL(s),o=document.createElement("a");o.href=i,o.download=t,document.body.appendChild(o),o.click(),setTimeout(()=>{document.body.removeChild(o),window.URL.revokeObjectURL(i)},0)}summarizeTaskUpdates(e){return!Array.isArray(e)||e.length===0?"":e.map(t=>{const n=t.action||"action",s=Number.isFinite(Number(t.progressPercent))?`${Number(t.progressPercent)}%`:"",i=t.progressStatus?String(t.progressStatus).replace(/_/g," "):"",o=t.progressNote?` - ${t.progressNote}`:"",r=`${s}${s&&i?" ":""}${i}`.trim(),l=r?` (${r})`:"";return`${n}${l}${o}`.trim()}).join(" | ")}async exportAttendanceCSV(){try{const e=await this.db.getAll("users"),t=await this.db.getAll("attendance"),n={};e.forEach(d=>n[d.id]=d);const s=t.map(d=>{const c=d.user_id||d.userId,p=n[c]||{name:"Unknown",role:"N/A",rating:0,completionStats:{}};let u=d.location||"N/A";return d.lat&&d.lng&&(u=`Lat: ${Number(d.lat).toFixed(5)}, Lng: ${Number(d.lng).toFixed(5)}`),{date:d.date,name:p.name,role:p.role,rating:p.rating?p.rating.toFixed(1):"N/A",completionRate:p.completionStats?.completionRate?`${(p.completionStats.completionRate*100).toFixed(0)}%`:"N/A",checkIn:d.checkIn,checkOut:d.checkOut||"--",duration:d.duration||"--",workSummary:d.workDescription||"--",taskUpdates:this.summarizeTaskUpdates(d.taskUpdates||[]),inLocation:u,outLocation:d.checkOutLocation||"--",type:d.type||"Standard"}});e.forEach(d=>{if(d.status==="in"&&d.lastCheckIn){const c=new Date(d.lastCheckIn);s.push({date:c.toLocaleDateString(),name:d.name,role:d.role,checkIn:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:"Active Now",duration:"Working...",workSummary:"Current Session (Active)",inLocation:d.currentLocation?.address||"Current Session",outLocation:"--",type:"Office (Active)"})}}),s.sort((d,c)=>new Date(c.date)-new Date(d.date));const i=["Date","Staff Name","Role","Star Rating","Completion Rate","Check In","Check Out","Duration","Work Summary","Task Updates","Check-in Location","Check-out Location","Type"],o=["date","name","role","rating","completionRate","checkIn","checkOut","duration","workSummary","taskUpdates","inLocation","outLocation","type"],r=this.convertToCSV(s,i,o),l=`Attendance_Report_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(r,l,"text/csv"),!0}catch(e){throw console.error("Export Failed:",e),new Error("Failed to generate report")}}async exportUserLogsCSV(e,t){try{const n=t.map(l=>{let d=l.location||"N/A";return l.lat&&l.lng&&(d=`Lat: ${Number(l.lat).toFixed(5)}, Lng: ${Number(l.lng).toFixed(5)}`),{date:l.date,name:e.name,role:e.role,checkIn:l.checkIn,checkOut:l.checkOut||"--",duration:l.duration||"--",workSummary:l.workDescription||"--",taskUpdates:this.summarizeTaskUpdates(l.taskUpdates||[]),inLocation:d,outLocation:l.checkOutLocation||"--",type:l.type||"Standard"}});n.sort((l,d)=>new Date(d.date)-new Date(l.date));const s=["Date","Staff Name","Role","Check In","Check Out","Duration","Work Summary","Task Updates","Check-in Location","Check-out Location","Type"],i=["date","name","role","checkIn","checkOut","duration","workSummary","taskUpdates","inLocation","outLocation","type"],o=this.convertToCSV(n,s,i),r=`Attendance_Report_${e.name.replace(/ /g,"_")}_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(o,r,"text/csv"),!0}catch(n){console.error("Export Failed:",n),alert("Failed to export logs: "+n.message)}}async exportMasterSheetCSV(e,t,n,s){try{const i=new Date(t,e+1,0).getDate(),o=["S.No","Staff Name","Department"];for(let p=1;p<=i;p++)o.push(String(p));const r=n.sort((p,u)=>p.name.localeCompare(u.name)).map((p,u)=>{const m=[u+1,p.name,p.dept||"General"];for(let h=1;h<=i;h++){const f=`${t}-${String(e+1).padStart(2,"0")}-${String(h).padStart(2,"0")}`,g=s.filter(S=>(S.userId===p.id||S.user_id===p.id)&&S.date===f);if(g.length>0){const S=g[0];let A=S.type||"P";A==="Short Leave"&&S.durationHours&&(A=`SL(${S.durationHours}h)`),m.push(`${A} (${S.checkIn}-${S.checkOut||"Active"})`)}else m.push("-")}return m}),l=[o.join(","),...r.map(p=>p.join(","))].join(`
`),c=`Attendance_Sheet_${new Date(t,e).toLocaleString("default",{month:"long"})}_${t}.csv`;return this.downloadFile(l,c,"text/csv"),!0}catch(i){console.error("Export Failed:",i),alert("Export Failed: "+i.message)}}async exportLeavesCSV(e){try{const t=["Applied On","Staff Name","FY","Type","From","To","Days/Hrs","Reason","Status","Admin Comment"],n=["appliedOn","userName","financialYear","type","startDate","endDate","daysCount","reason","status","adminComment"],s=e.map(r=>({...r,daysCount:r.type==="Short Leave"?`${r.durationHours||0}h`:r.daysCount})),i=this.convertToCSV(s,t,n),o=`Leave_Requests_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(i,o,"text/csv"),!0}catch(t){console.error("Leave Export Failed:",t),alert("Export Failed: "+t.message)}}async exportCalendarPlansCSV(e,t,n){try{const s=[],i=new Date(n,t+1,0).getDate(),o=new Date(n,t).toLocaleString("default",{month:"long"});for(let p=1;p<=i;p++){const u=`${n}-${String(t+1).padStart(2,"0")}-${String(p).padStart(2,"0")}`;e.leaves.forEach(m=>{u>=m.startDate&&u<=m.endDate&&s.push({date:u,category:"Leave",subject:`${m.userName||"Staff"} - ${m.type}`,details:m.reason||"No reason provided",staff:m.userName||"Staff"})}),e.events.forEach(m=>{m.date===u&&s.push({date:u,category:"Event",subject:m.title,details:m.type||"General Event",staff:"Organization"})}),e.workPlans.forEach(m=>{if(m.date===u){const h=Array.isArray(m.plans)?m.plans:[],f=h.length>0?h.map((g,S)=>{let A=`${S+1}. ${g.task}`;return g.subPlans&&g.subPlans.length>0&&(A+=` (Steps: ${g.subPlans.join(", ")})`),g.tags&&g.tags.length>0&&(A+=` [With: ${g.tags.map(b=>`@${b.name} (${b.status||"pending"})`).join(", ")}]`),A}).join(" | "):"Work Plan";s.push({date:u,category:"Work Plan",subject:"Daily Goals",details:f,staff:m.userName||"Staff"})}})}if(s.length===0)return alert("No plans found for the selected month."),!1;const r=["Date","Category","Subject","Details","Staff Member"],l=["date","category","subject","details","staff"],d=this.convertToCSV(s,r,l),c=`Team_Schedule_${o}_${n}.csv`;return this.downloadFile(d,c,"text/csv"),!0}catch(s){console.error("Calendar Export Failed:",s),alert("Failed to export calendar: "+s.message)}}async exportAnnualListViewCSV(e){try{const t=(e||[]).map(r=>({date:r.date||"",staffName:r.staffName||r.staff||"",assignedBy:r.assignedBy||"",assignedTo:r.assignedTo||"",selfAssigned:r.selfAssigned?"Yes":"No",dueDate:r.dueDate||"",status:r.statusLabel||r.status||"",comments:r.comments||"",tags:Array.isArray(r.tags)?r.tags.join(", "):r.tags||""})),n=["Date","Staff Name","Assigned By","Assigned To","Self Assigned","Due Date","Completion Status","Comments","Tags"],s=["date","staffName","assignedBy","assignedTo","selfAssigned","dueDate","status","comments","tags"],i=this.convertToCSV(t,n,s),o=`Annual_Plan_List_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(i,o,"text/csv"),!0}catch(t){throw console.error("List Export Failed:",t),new Error("Failed to export list: "+t.message)}}exportTeamActivitiesXLSX(e,t={}){try{if(typeof window>"u"||!window.XLSX)return alert("Excel export library not loaded."),!1;const n=(e||[]).map(p=>[p.date||"",p.staffName||"",p.type||"",p.status||"",p.description||"",p.sourceTime||""]),s=["Date","Staff","Type","Status","Description","Time"],i=window.XLSX.utils.aoa_to_sheet([s,...n]),o=window.XLSX.utils.book_new();window.XLSX.utils.book_append_sheet(o,i,"Team Activities");const r=(t.start||"").replace(/[^a-zA-Z0-9_-]/g,"_"),l=(t.end||"").replace(/[^a-zA-Z0-9_-]/g,"_"),c=`Team_Activities_${r&&l?`${r}_to_${l}`:r||l||"export"}.xlsx`;return window.XLSX.writeFile(o,c),!0}catch(n){return console.error("Team Activities Export Failed:",n),alert("Export Failed: "+n.message),!1}}}const Do=new Ao;typeof window<"u"&&(window.AppReports=Do);class _o{constructor(){this.db=X,this.cache={},this.defaultPolicy={"Annual Leave":{total:10,minDays:3,accrual:"annual"},"Casual Leave":{total:6,maxDays:2,accrual:"monthly"},"Medical Leave":{total:6,certificateThreshold:2,accrual:"annual"},"Maternity Leave":{total:180,paid:!0,gender:"female"},"Paternity Leave":{total:10,paid:!0,gender:"male",minServiceYears:0},"Study Leave":{total:5,paid:!1,requireApproval:!0},"Compassionate Leave":{total:3,paid:!0}}}dedupeLeaves(e=[]){const t=new Map;(Array.isArray(e)?e:[]).forEach(s=>{if(!s)return;const i=String(s.userId||s.user_id||"").trim(),o=String(s.type||"").trim().toLowerCase(),r=String(s.startDate||"").trim(),l=String(s.endDate||"").trim(),d=String(s.status||"").trim().toLowerCase(),c=String(s.reason||"").trim().toLowerCase(),p=String(s.daysCount??"").trim(),u=String(s.id||"").trim(),m=[i,o,r,l,p,c,d].join("|"),h=u||m,f=t.get(h);if(!f){t.set(h,s);return}const g=new Date(f.actionDate||f.appliedOn||f.startDate||0).getTime();new Date(s.actionDate||s.appliedOn||s.startDate||0).getTime()>=g&&t.set(h,{...f,...s})});const n=new Map;return Array.from(t.values()).forEach(s=>{const i=[String(s.userId||s.user_id||"").trim(),String(s.type||"").trim().toLowerCase(),String(s.startDate||"").trim(),String(s.endDate||"").trim(),String(s.daysCount??"").trim(),String(s.reason||"").trim().toLowerCase(),String(s.status||"").trim().toLowerCase()].join("|"),o=n.get(i);if(!o){n.set(i,s);return}const r=new Date(o.actionDate||o.appliedOn||o.startDate||0).getTime();new Date(s.actionDate||s.appliedOn||s.startDate||0).getTime()>=r&&n.set(i,{...o,...s})}),Array.from(n.values())}async getPolicy(){if(this.cache.policy)return this.cache.policy;try{if(window.AppFirestore){const e=await window.AppFirestore.collection("settings").doc("policies").get();e.exists?this.cache.policy={...this.defaultPolicy,...e.data()}:this.cache.policy=this.defaultPolicy}else this.cache.policy=this.defaultPolicy}catch(e){console.warn("Failed to fetch dynamic policy, using default.",e),this.cache.policy=this.defaultPolicy}return this.cache.policy}async updatePolicy(e){try{if(window.AppFirestore)return await window.AppFirestore.collection("settings").doc("policies").set(e,{merge:!0}),this.cache.policy=null,!0;throw new Error("Database not connected")}catch(t){throw console.error("Failed to update policy:",t),t}}async getFinancialYear(e=new Date){const t=e.getMonth(),n=e.getFullYear();return t<3?{label:`${n-1}-${n}`,start:new Date(n-1,3,1),end:new Date(n,2,31)}:{label:`${n}-${n+1}`,start:new Date(n,3,1),end:new Date(n+1,2,31)}}async getUserLeaves(e,t=null){t||(t=(await this.getFinancialYear()).label);try{if(this.db.queryMany&&N?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES)return(await this.db.queryMany("leaves",[{field:"userId",operator:"==",value:e},{field:"financialYear",operator:"==",value:t}])).sort((i,o)=>new Date(o.startDate)-new Date(i.startDate))}catch(s){console.warn("Scoped getUserLeaves query failed, using fallback",s)}return(await this.db.getAll("leaves")).filter(s=>s.userId===e&&s.financialYear===t).sort((s,i)=>new Date(i.startDate)-new Date(s.startDate))}async getLeaveUsage(e,t,n){return(await this.getUserLeaves(e,n.label)).filter(o=>o.type===t&&(o.status==="Approved"||o.status==="Pending")).reduce((o,r)=>o+(parseFloat(r.daysCount)||0),0)}async getMonthlyShortLeaveUsage(e,t){const n=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}`;let s=[];try{this.db.queryMany&&N?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES&&(s=(await this.db.queryMany("leaves",[{field:"userId",operator:"==",value:e},{field:"type",operator:"==",value:"Short Leave"},{field:"startDate",operator:">=",value:`${n}-01`},{field:"startDate",operator:"<=",value:`${n}-31`}])).filter(o=>o.status==="Approved"||o.status==="Pending"))}catch(i){console.warn("Scoped short leave query failed, using fallback",i)}return s.length||(s=(await this.db.getAll("leaves")).filter(o=>o.userId===e&&o.type==="Short Leave"&&String(o.startDate||"").startsWith(n)&&(o.status==="Approved"||o.status==="Pending"))),s.reduce((i,o)=>i+(parseFloat(o.daysCount||o.durationHours)||0),0)}async getPendingLeaves(){try{let e=[];if(this.db.queryMany&&N?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES){const t=await this.db.queryMany("leaves",[{field:"status",operator:"==",value:"Pending"}],{orderBy:[{field:"appliedOn",direction:"desc"}]});e=this.dedupeLeaves(t).sort((n,s)=>new Date(s.appliedOn)-new Date(n.appliedOn))}else{const t=await this.db.getAll("leaves");e=this.dedupeLeaves(t).filter(n=>n.status==="Pending").sort((n,s)=>new Date(s.appliedOn)-new Date(n.appliedOn))}if(e.length>0){const t=await this.db.getAll("users"),n={};t.forEach(s=>{n[s.id]=s.name}),e.forEach(s=>{!s.userName&&n[s.userId]&&(s.userName=n[s.userId])})}return e}catch(e){console.warn("getPendingLeaves failed, using fallback",e);const t=await this.db.getAll("leaves").catch(()=>[]);return this.dedupeLeaves(t).filter(n=>n.status==="Pending").sort((n,s)=>new Date(s.appliedOn)-new Date(n.appliedOn))}}async getAllLeaves(){return(this.dedupeLeaves(await this.db.getAll("leaves").catch(()=>[]))||[]).sort((t,n)=>{const s=new Date(n.actionDate||n.appliedOn||n.startDate||0).getTime(),i=new Date(t.actionDate||t.appliedOn||t.startDate||0).getTime();return s-i})}async requestLeave(e){const{userId:t,startDate:n,endDate:s,type:i,durationHours:o}=e,r=String(i||"").trim(),l=r.toLowerCase().replace(/\s+/g,""),d=l==="work-home"||l==="workfromhome"||l==="wfh"?"Work - Home":r;e.type=d;const c=new Date(n),p=new Date(s);let u=Math.ceil((p-c)/(1e3*60*60*24))+1;if(u<=0&&d!=="Short Leave")throw new Error("Invalid date range");const m=await this.getFinancialYear(c),h=await this.getLeaveUsage(t,d,m),g=(await this.getPolicy())[d],S=[];if(d==="Half Day")u=.5,e.daysCount=.5;else if(d==="Short Leave"){const b=await this.getMonthlyShortLeaveUsage(t,c);let x=parseFloat(o||0);x>2&&S.push("Short Leave exceeds 2 hours (standard)."),b+x>4&&S.push(`Monthly Short Leave limit exceeded (${b+x}/4 hours).`),e.daysCount=x}else if(d==="Work - Home")e.daysCount=u;else if(d==="Annual Leave")u<(g.minDays||1)&&S.push(`Annual Leave requested is less than required minimum (${g.minDays||1} days).`),h+u>g.total&&S.push(`Annual Leave balance exceeded (${h+u}/${g.total}).`);else if(d==="Casual Leave")u>g.maxDays&&S.push(`Casual Leave exceeds maximum allowed per request (${g.maxDays} days).`),h+u>g.total&&S.push(`Casual Leave balance exceeded (${h+u}/${g.total}).`);else if(d==="Medical Leave")h+u>g.total&&S.push(`Medical Leave balance exceeded (${h+u}/${g.total}).`),u>g.certificateThreshold&&(e.requireCertificate=!0);else if(d==="Paternity Leave"){const b=await this.db.get("users",t),x=new Date(b.joinDate),D=(c-x)/(1e3*60*60*24*365.25);g.minServiceYears&&D<g.minServiceYears&&S.push(`User has not completed ${g.minServiceYears} year(s) of service (required for Paternity Leave).`),u>g.total&&S.push(`Paternity Leave exceeds limit of ${g.total} days.`)}else["Study Leave","Compassionate Leave"].includes(d)&&g&&u>g.total&&S.push(`${d} exceeds limit of ${g.total} days.`);const A={id:"l"+Date.now(),...e,status:"Pending",appliedOn:new Date().toISOString(),financialYear:m.label,daysCount:u,policyWarnings:S};return await this.db.add("leaves",A),A}async generateApprovedLeaveAttendance(e){const t=new Date(e.startDate),n=new Date(e.endDate),s=String(e.type||"").toLowerCase().replace(/\s+/g,""),i=s==="workfromhome"||s==="work-home"||s==="wfh"?"Work - Home":e.type,o=i==="Work - Home";let r=new Date(t);for(;r<=n;){const l=r.toISOString().split("T")[0],d={id:"att_"+e.userId+"_"+l,user_id:e.userId,date:l,checkIn:"09:00",checkOut:"17:00",duration:"8h 0m",location:o?"Work - Home":"On Leave",type:o?"Work - Home":i,status:"in",synced:!1,leaveRequestId:e.id,leaveGenerated:!0};await this.db.put("attendance",d),r.setDate(r.getDate()+1)}}async removeApprovedLeaveAttendance(e){const t=new Date(e.startDate),n=new Date(e.endDate),s=String(e.type||"").toLowerCase().replace(/\s+/g,""),i=s==="workfromhome"||s==="work-home"||s==="wfh"?"Work - Home":e.type;let o=new Date(t);for(;o<=n;){const r=o.toISOString().split("T")[0],l="att_"+e.userId+"_"+r,d=await this.db.get("attendance",l).catch(()=>null);if(d){const c=String(d.leaveRequestId||"")===String(e.id||""),p=!d.checkOutLocation&&String(d.user_id||"")===String(e.userId||"")&&String(d.date||"")===r&&String(d.type||"")===String(i||"")&&(String(d.location||"")==="On Leave"||String(d.location||"")==="Work - Home");(c||p)&&await this.db.delete("attendance",l).catch(()=>null)}o.setDate(o.getDate()+1)}}async updateLeaveStatus(e,t,n,s=""){const i=await this.db.get("leaves",e);if(!i)throw new Error("Leave not found");const o=n||window.AppAuth?.getUser?.()?.id||null,r=i.status||"Pending",l=t||r,d=new Date().toISOString();Array.isArray(i.reviewHistory)||(i.reviewHistory=[]);const c=r!==l,p=!c&&typeof s=="string"&&s!==(i.adminComment||"");return i.status=l,i.actionDate=d,i.adminComment=s,o?i.actionBy=o:delete i.actionBy,c?i.reviewHistory.unshift({id:`leave_hist_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,previousStatus:r,nextStatus:l,at:d,by:o||"",comment:s||""}):p&&i.reviewHistory.unshift({id:`leave_note_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,previousStatus:r,nextStatus:l,at:d,by:o||"",comment:s||"",noteOnly:!0}),await this.db.put("leaves",i),c&&r==="Approved"&&l!=="Approved"&&await this.removeApprovedLeaveAttendance(i),c&&l==="Approved"&&await this.generateApprovedLeaveAttendance(i),i}}const Ee=new _o;typeof window<"u"&&(window.AppLeaves=Ee);class $o{constructor(){this.db=X,this.cleanupFlag=N?.SIMULATION_POLICY?.LEGACY_DUMMY_CLEANUP?.FLAG_KEY||"legacy_dummy_cleanup_v1",this.simulationFlag="simulation_run_v2"}getCleanupPolicy(){const e=N?.SIMULATION_POLICY?.LEGACY_DUMMY_CLEANUP||{},t=new Set((e.TARGET_USER_IDS||[]).map(s=>String(s||"").trim()).filter(Boolean)),n=new Set((e.TARGET_USERNAMES||[]).map(s=>String(s||"").trim().toLowerCase()).filter(Boolean));return{enabled:e.ENABLED!==!1,targetIds:t,targetUsernames:n,auditCollection:String(e.AUDIT_COLLECTION||"system_audit_logs")}}async writeCleanupAudit(e,t={}){const n=this.getCleanupPolicy();try{await this.db.add(n.auditCollection,{type:e,module:"simulation",payload:t,createdAt:Date.now()})}catch(s){console.warn("Simulation audit log write failed:",s)}}async run(){const e=N&&N.READ_OPT_FLAGS||{},t=typeof window<"u"&&window.location&&window.location.hostname?window.location.hostname:"",n=t==="localhost"||t==="127.0.0.1";if(!(!e.ENABLE_SIMULATION_MODULE&&!n)){if(localStorage.getItem(this.cleanupFlag)||(await this.cleanupLegacyDummyData(),localStorage.setItem(this.cleanupFlag,"true")),localStorage.getItem(this.simulationFlag)){console.log("Simulation already ran. Use window.AppSimulation.forceRun() to force.");return}await this.forceRun(),localStorage.setItem(this.simulationFlag,"true")}}async cleanupLegacyDummyData(){const e=this.getCleanupPolicy();if(e.enabled){if(e.targetIds.size===0&&e.targetUsernames.size===0){await this.writeCleanupAudit("legacy_dummy_cleanup_skipped",{reason:"no_targets"});return}try{const n=(await this.db.getAll("users")).filter(u=>e.targetIds.has(u.id)||e.targetUsernames.has((u.username||"").trim().toLowerCase())),s=new Set(n.map(u=>u.id));if(s.size===0){await this.writeCleanupAudit("legacy_dummy_cleanup_skipped",{reason:"no_matches",configuredTargets:{ids:Array.from(e.targetIds),usernames:Array.from(e.targetUsernames)}});return}let i=0,o=0,r=0,l=0;const d=await this.db.getAll("attendance");for(const u of d){const m=u.user_id||u.userId;s.has(m)&&(await this.db.delete("attendance",u.id),i+=1)}const c=await this.db.getAll("leaves");for(const u of c){const m=u.userId||u.user_id;s.has(m)&&(await this.db.delete("leaves",u.id),o+=1)}const p=await this.db.getAll("work_plans");for(const u of p){const m=u.userId||u.user_id;s.has(m)&&(await this.db.delete("work_plans",u.id),r+=1)}for(const u of n)await this.db.delete("users",u.id),l+=1;await this.writeCleanupAudit("legacy_dummy_cleanup_completed",{matchedUserIds:Array.from(s),deleted:{attendance:i,leaves:o,workPlans:r,users:l}}),console.log("Legacy dummy users and linked records removed.",{users:l,attendance:i,leaves:o,workPlans:r})}catch(t){await this.writeCleanupAudit("legacy_dummy_cleanup_failed",{message:t?.message||String(t)}),console.warn("Legacy dummy cleanup failed:",t)}}}async forceRun(){console.log("Starting Office Scenario Simulation (V2)...");const e=new Date;if(window.AppCalendar){const t=new Date(e);t.setDate(t.getDate()+1),await window.AppCalendar.addEvent({title:"Office Picnic/Holiday",date:t.toISOString().split("T")[0],type:"holiday"})}console.log("Simulation Complete.")}}const yn=new $o;typeof window<"u"&&(window.AppSimulation=yn,setTimeout(()=>yn.run(),2e3));const oe="minutes";function He(){const a=window.AppAuth.getUser();if(!a||!a.id)throw new Error("User not authenticated");return a}function vt(a){return!!(window.app_hasPerm&&window.app_hasPerm("minutes","admin",a))}function xo(a,e,t,n={}){const s=a&&a.createdBy===e.id,i=vt(e),o=n&&n.allowNonOwner===!0;if(!s&&!i&&!o)throw new Error("You do not have permission to edit these minutes.");if(a&&a.locked&&!(n&&n.allowOnLocked===!0))throw new Error("This record is locked.");return!t||!String(t).trim()?"Updated minutes":String(t).trim()}async function To(a={}){try{const e=a.limit||150;return window.AppDB?.queryMany?await window.AppDB.queryMany(oe,[],{orderBy:[{field:"date",direction:"desc"}],limit:e}):window.AppDB?.getAll?(await window.AppDB.getAll(oe)).sort((s,i)=>String(i.date||"").localeCompare(String(s.date||""))).slice(0,e):(await window.AppFirestore.collection(oe).orderBy("date","desc").limit(e).get()).docs.map(n=>({id:n.id,...n.data()}))}catch(e){throw console.error("Error fetching minutes:",e),e}}async function Io(a){try{const e=He(),t=new Date().toISOString(),n=e.name||e.username||"Unknown",s={...a,createdBy:e.id,createdByName:n,createdAt:t,lastEditedBy:e.id,lastEditedByName:n,lastEditedAt:t,auditLog:[{userId:e.id,userName:n,timestamp:t,action:"Created meeting minutes"}],approvals:{},locked:!1,restrictedFrom:[],allowedViewers:[],accessRequests:[]};return window.AppDB?await window.AppDB.add(oe,s):(await window.AppFirestore.collection(oe).add(s)).id}catch(e){throw console.error("Error adding minute:",e),e}}async function St(a,e,t,n={}){try{const s=He(),i=await(window.AppDB?window.AppDB.get(oe,a):window.AppFirestore.collection(oe).doc(a).get().then(p=>p.data()));if(!i)throw new Error("Minute not found");const o=xo(i,s,t,n),r=new Date().toISOString(),l=s.name||s.username||"Unknown",d={userId:s.id,userName:l,timestamp:r,action:o},c={...i,...e,id:a,lastEditedBy:s.id,lastEditedByName:l,lastEditedAt:r,auditLog:[...i.auditLog||[],d]};return window.AppDB?await window.AppDB.put(oe,c):await window.AppFirestore.collection(oe).doc(a).update(c),!0}catch(s){throw console.error("Error updating minute:",s),s}}async function Mo(a){try{const e=He(),t=await(window.AppDB?window.AppDB.get(oe,a):window.AppFirestore.collection(oe).doc(a).get().then(s=>s.data()));if(!t)throw new Error("Minute not found");const n=t.accessRequests||[];return n.some(s=>s.userId===e.id)?!0:(n.push({userId:e.id,userName:e.name||e.username||"Unknown",status:"pending",requestedAt:new Date().toISOString()}),await St(a,{accessRequests:n},`Requested access for ${e.name||e.username}`,{allowNonOwner:!0,allowOnLocked:!0}))}catch(e){throw console.error("Error requesting access:",e),e}}async function Co(a,e,t){try{const n=He(),s=await(window.AppDB?window.AppDB.get(oe,a):window.AppFirestore.collection(oe).doc(a).get().then(c=>c.data()));if(!s)throw new Error("Minute not found");const i=s.createdBy===n.id,o=vt(n);if(!i&&!o)throw new Error("Only owner or admin can review access requests.");const r=s.accessRequests||[],l=r.find(c=>c.userId===e);if(!l)return!0;l.status=t;const d=s.allowedViewers||[];return t==="approved"&&!d.includes(e)&&d.push(e),await St(a,{accessRequests:r,allowedViewers:d},`${String(t||"").toUpperCase()} access request for userId: ${e}`,{allowOnLocked:!0})}catch(n){throw console.error("Error handling access request:",n),n}}async function Lo(a,e,t){try{const n=He(),s=await(window.AppDB?window.AppDB.get(oe,a):window.AppFirestore.collection(oe).doc(a).get().then(d=>d.data()));if(!s||!s.actionItems)throw new Error("Minute or tasks not found");const i=s.actionItems[e];if(!i)throw new Error("Task not found");const o=s.createdBy===n.id,r=vt(n),l=i.assignedTo===n.id;if(!o&&!r&&!l)throw new Error("Only owner, admin, or assignee can update this task.");return i.status=t,t==="completed"&&(i.completedAt=new Date().toISOString()),await St(a,{actionItems:s.actionItems},`Updated Task: ${i.task} to ${t}`,{allowNonOwner:!0,allowOnLocked:!0})}catch(n){throw console.error("Error updating action item:",n),n}}async function Eo(a){try{const e=He(),t=await(window.AppDB?window.AppDB.get(oe,a):window.AppFirestore.collection(oe).doc(a).get().then(c=>c.data()));if(!t)throw new Error("Minute not found");const n=t.attendeeIds||[],s=n.includes(e.id),i=t.createdBy===e.id,o=vt(e);if(!s&&!i&&!o)throw new Error("Only attendees, owner, or admin can approve minutes.");const r=t.approvals||{};r[e.id]=new Date().toISOString();const l=n.length>0&&n.every(c=>r[c]),d={approvals:r};return l&&(d.locked=!0),await St(a,d,`${l?"FINAL APPROVAL & LOCK":"Signed"} by ${e.name||e.username}`,{allowNonOwner:!0,allowOnLocked:!0})}catch(e){throw console.error("Error approving minute:",e),e}}async function Po(a){try{const e=He(),t=await(window.AppDB?window.AppDB.get(oe,a):window.AppFirestore.collection(oe).doc(a).get().then(i=>i.data()));if(!t)throw new Error("Minute not found");const n=t.createdBy===e.id,s=vt(e);if(!n&&!s)throw new Error("Only owner or admin can delete minutes.");return window.AppDB?await window.AppDB.delete(oe,a):(await window.AppFirestore.collection(oe).doc(a).delete(),!0)}catch(e){throw console.error("Error deleting minute:",e),e}}const No={getMinutes:To,addMinute:Io,updateMinute:St,approveMinute:Eo,deleteMinute:Po,requestAccess:Mo,handleAccessRequest:Co,updateActionItemStatus:Lo};typeof window<"u"&&(window.AppMinutes=No);const Ua={async renderPolicyEditor(){const a=await Ee.getPolicy();return`
        <div class="card full-width" style="margin-top: 2rem; border-top: 4px solid #4f46e5;">
            <h3 style="margin-bottom: 1rem; color: #1e1b4b; font-size: 1.1rem;">
                <i class="fa-solid fa-screwdriver-wrench" style="margin-right: 8px;"></i> Manage Leave Policies (Admin)
            </h3>
            <form onsubmit="window.app_savePolicyChanges(event)">
                <div class="table-container">
                    <table class="compact-table" style="font-size: 0.85rem;">
                        <thead>
                            <tr style="background: #f8fafc;">
                                <th style="padding: 8px;">Leave Type</th>
                                <th style="padding: 8px; width: 80px;">Total</th>
                                <th style="padding: 8px; width: 80px;">Min Days</th>
                                <th style="padding: 8px; width: 80px;">Max Days</th>
                                <th style="padding: 8px;">Other Rules</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(a).map(e=>{const t=a[e];return`
                                <tr>
                                    <td style="padding: 6px 8px;"><strong>${e}</strong></td>
                                    <td style="padding: 6px 8px;">
                                        <input type="number" name="${e}_total" value="${t.total}" style="width: 100%; padding: 2px; border: 1px solid #cbd5e1; border-radius: 4px;">
                                    </td>
                                    <td style="padding: 6px 8px;">
                                        <input type="number" name="${e}_min" value="${t.minDays||""}" placeholder="-" style="width: 100%; padding: 2px; border: 1px solid #cbd5e1; border-radius: 4px;">
                                    </td>
                                    <td style="padding: 6px 8px;">
                                        <input type="number" name="${e}_max" value="${t.maxDays||""}" placeholder="-" style="width: 100%; padding: 2px; border: 1px solid #cbd5e1; border-radius: 4px;">
                                    </td>
                                    <td style="padding: 6px 8px; color: #64748b;">
                                        ${t.gender?`<span class="tag">${t.gender}</span>`:""}
                                        ${t.paid?'<span class="tag success">Paid</span>':""}
                                    </td>
                                </tr>
                                `}).join("")}
                        </tbody>
                    </table>
                </div>
                <div style="margin-top: 0.75rem; text-align: right;">
                     <button type="submit" class="action-btn" style="padding: 6px 16px; font-size: 0.85rem;">
                        <i class="fa-solid fa-save"></i> Save Changes
                     </button>
                </div>
            </form>
        </div>
        `},setupGlobalHandlers(){window.app_savePolicyChanges=async a=>{a.preventDefault();const e=new FormData(a.target),t=await Ee.getPolicy(),n={};Object.keys(t).forEach(s=>{n[s]={...t[s]};const i=d=>{const c=e.get(d);return c!==""&&c!==null?parseInt(c):void 0},o=i(`${s}_total`);o!==void 0&&(n[s].total=o);const r=i(`${s}_min`);r!==void 0?n[s].minDays=r:delete n[s].minDays;const l=i(`${s}_max`);l!==void 0?n[s].maxDays=l:delete n[s].maxDays});try{await Ee.updatePolicy(n);const s=a.target.querySelector("button"),i=s.innerHTML;s.innerHTML='<i class="fa-solid fa-check"></i> Saved!',s.style.background="#166534",setTimeout(()=>{s.innerHTML=i,s.style.background="",window.location.reload()},1e3)}catch(s){alert("Failed to update policy: "+s.message)}},window.app_approveLeaveWithWarning=async a=>{const e=await window.appPrompt("Reason for override:","",{title:"Leave Override",confirmText:"Approve With Reason",placeholder:"Enter reason"});if(e)try{await Ee.updateLeaveStatus(a,"Approved",te.getUser().id,`[Overridden] ${e}`),window.location.reload()}catch(t){alert(t.message)}}}};Ua.setupGlobalHandlers();typeof window<"u"&&(window.AppAdminPolicies=Ua);const Bo={currentYear:new Date().getFullYear(),holidayCache:null,baseline2025:[{name:"Republic Day",date:"2025-01-26",type:"National"},{name:"Maha Shivaratri",date:"2025-02-26",type:"Regional"},{name:"Holi",date:"2025-03-14",type:"Regional"},{name:"Id-ul-Fitr",date:"2025-03-31",type:"Regional"},{name:"Good Friday",date:"2025-04-18",type:"Regional"},{name:"Independence Day",date:"2025-08-15",type:"National"},{name:"Dussehra",date:"2025-10-02",type:"Regional"},{name:"Gandhi Jayanti",date:"2025-10-02",type:"National"},{name:"Diwali",date:"2025-10-20",type:"Regional"},{name:"Christmas",date:"2025-12-25",type:"Regional"}],canManageHolidays(a=te.getUser()){return a?!!(window.app_isAdminUser?.(a)||a.role==="Administrator"||window.app_hasPerm?.("policies","admin",a)||window.app_hasPerm?.("attendance","admin",a)||window.app_canManageAttendanceSheet?.(a)):!1},async render(){const a=await Ee.getPolicy(),e=te.getUser(),t=await Ee.getFinancialYear(),n=window.app_hasPerm("policies","admin",e),s=this.canManageHolidays(e);let i=0;try{const d=new Date,c=d.getDay(),p=d.getDate()-c+(c===0?-6:1),u=new Date(d.setDate(p));u.setHours(0,0,0,0);const m=u.toISOString().split("T")[0];i=(await X.getAll("attendance")).filter(g=>g.user_id===e.id&&g.date>=m).filter(g=>g.checkIn?g.lateCountable===!0?!0:In.normalizeType(g.type)==="Late":!1).length}catch(d){console.warn("Error calc lates",d)}const o=Object.keys(a).map(async d=>{const c=await Ee.getLeaveUsage(e.id,d,t);return{type:d,usage:c,total:a[d].total,icon:this.getIconForType(d),color:this.getColorForType(d)}}),r=await Promise.all(o),l=await this.renderHolidayTable(this.currentYear,s);return`
            <div class="content-container slide-in policies-modern">
                <section class="card policies-hero">
                    <p class="policies-kicker">Policies and Benefits</p>
                    <h1>Work Guidelines at CRWI</h1>
                    <p class="policies-hero-text">
                        Clear leave rules, attendance expectations, and holiday visibility to keep planning simple and fair.
                    </p>
                    <div class="policies-value-row">
                        <span><i class="fa-solid fa-shield-heart"></i> Integrity</span>
                        <span><i class="fa-solid fa-eye"></i> Transparency</span>
                        <span><i class="fa-solid fa-handshake"></i> Accountability</span>
                        <span><i class="fa-solid fa-seedling"></i> Growth</span>
                    </div>
                </section>

                <div class="dashboard-grid">
                    <section class="card full-width policies-balance-card">
                        <div class="policies-row-head">
                            <div>
                                <h2>My Leave Balance</h2>
                                <p class="text-muted">Financial Year ${t.label}</p>
                            </div>
                            <button onclick="document.getElementById('leave-modal').style.display='flex'" class="action-btn policies-request-btn">
                                <i class="fa-solid fa-paper-plane"></i> Request Leave
                            </button>
                        </div>

                        <div class="policies-late-chip">
                            <div class="policies-late-icon"><i class="fa-solid fa-clock"></i></div>
                            <div>
                                <div class="policies-late-label">Late Arrivals This Week</div>
                                <div class="policies-late-value">${i} <span>(${Math.floor(i/3)} block(s) reached)</span></div>
                            </div>
                        </div>

                        <div class="policies-leave-grid">
                            ${r.map(d=>this.renderLeaveCard(d.type,d,d.icon,d.color)).join("")}
                        </div>
                    </section>

                    <section class="card policies-guidelines">
                        <h3><i class="fa-solid fa-clock"></i> Working at CRWI</h3>
                        <div class="policies-hours-box">
                            <label>Standard Hours</label>
                            <div>9:00 AM - 5:00 PM</div>
                            <p>Monday to Saturday (2nd/4th Saturday Off)</p>
                        </div>
                        <div class="policies-guidelines-list">
                            <label>Attendance Policy</label>
                            <ul>
                                <li><i class="fa-solid fa-caret-right"></i>Late arrival is marked after <strong>9:15 AM</strong>.</li>
                                <li><i class="fa-solid fa-caret-right"></i>Every <strong>3 Late marks</strong> causes a <strong>0.5 day salary deduction</strong> (mandatory).</li>
                                <li><i class="fa-solid fa-caret-right"></i>Final status is decided using check-in band and net worked hours.</li>
                                <li><i class="fa-solid fa-caret-right"></i><strong>Work From Home</strong> can be requested from <strong>Request Leave</strong> and requires approval.</li>
                            </ul>
                        </div>
                        <div class="policies-zero-box">
                            <h4><i class="fa-solid fa-triangle-exclamation"></i> Zero Tolerance</h4>
                            <p>CRWI maintains a strict policy on <strong>corruption, harassment, and discrimination</strong>.</p>
                        </div>
                    </section>

                    <section class="card policies-holidays">
                        <div class="policies-row-head">
                            <h3><i class="fa-solid fa-umbrella-beach"></i> Holidays</h3>
                            <div class="policies-year-switch">
                                <button onclick="window.AppPolicies.changeYear(-1)"><i class="fa-solid fa-chevron-left"></i></button>
                                <span id="policy-year-label">${this.currentYear}</span>
                                <button onclick="window.AppPolicies.changeYear(1)"><i class="fa-solid fa-chevron-right"></i></button>
                            </div>
                        </div>
                        ${s?`
                            <div style="display:flex; justify-content:flex-end; margin-bottom:0.5rem;">
                                <button class="action-btn" onclick="window.AppPolicies.openHolidayEditor()">
                                    <i class="fa-solid fa-plus"></i> Add Holiday
                                </button>
                            </div>
                        `:""}
                        <div id="holidays-container" class="table-container policies-holidays-table">
                            ${l}
                        </div>
                    </section>

                    <section class="card full-width policies-manual-card">
                        <div class="policies-row-head">
                            <h3><i class="fa-solid fa-book-open-reader"></i> Attendance User Manual</h3>
                            <span class="policies-manual-chip">Live Rule Guide</span>
                        </div>

                        <div class="policies-manual-grid">
                            <div class="policies-manual-block">
                                <h4>Standard Timing</h4>
                                <ul>
                                    <li><i class="fa-solid fa-caret-right"></i>Office timing is <strong>9:00 AM to 5:00 PM</strong>.</li>
                                    <li><i class="fa-solid fa-caret-right"></i>Late starts after <strong>9:15 AM</strong>.</li>
                                    <li><i class="fa-solid fa-caret-right"></i>2nd and 4th Saturday are holidays.</li>
                                </ul>
                            </div>

                            <div class="policies-manual-block">
                                <h4>Status Decision</h4>
                                <ul>
                                    <li><i class="fa-solid fa-caret-right"></i>If worked <strong>&lt; 4h</strong>: Absent.</li>
                                    <li><i class="fa-solid fa-caret-right"></i>If worked <strong>4h to &lt; 8h</strong>: Half Day.</li>
                                    <li><i class="fa-solid fa-caret-right"></i>If worked <strong>&ge; 8h</strong>: Present.</li>
                                    <li><i class="fa-solid fa-caret-right"></i>For morning entry, late bands still apply.</li>
                                </ul>
                            </div>

                            <div class="policies-manual-block">
                                <h4>Late and Penalty</h4>
                                <ul>
                                    <li><i class="fa-solid fa-caret-right"></i>Every <strong>3 Late marks</strong> = <strong>0.5 day deduction</strong>.</li>
                                    <li><i class="fa-solid fa-caret-right"></i>Late waived when eligible by worked-hour rules.</li>
                                    <li><i class="fa-solid fa-caret-right"></i>Late count is tracked in reports and salary.</li>
                                </ul>
                            </div>

                            <div class="policies-manual-block">
                                <h4>Extra Hours Offset</h4>
                                <ul>
                                    <li><i class="fa-solid fa-caret-right"></i>Extra hours above threshold are tracked.</li>
                                    <li><i class="fa-solid fa-caret-right"></i>Each <strong>4 extra hours</strong> offsets <strong>0.5 day penalty</strong>.</li>
                                    <li><i class="fa-solid fa-caret-right"></i>Salary uses effective penalty after offset.</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>

                ${n?await Ua.renderPolicyEditor():""}
            </div>
            `},async loadHolidaySettings(){if(this.holidayCache)return this.holidayCache;const a=await X.get("settings","holidays").catch(()=>null),e=a&&a.byYear?a:{id:"holidays",byYear:{}};return this.holidayCache=e,e},async saveHolidaySettings(a){const e={id:"holidays",byYear:a.byYear||{}};await X.put("settings",e),this.holidayCache=e},buildYearFromBaseline(a){return this.baseline2025.map(e=>{const t=String(e.date).slice(5);return{name:e.name,date:`${a}-${t}`,type:e.type||"Regional"}}).sort((e,t)=>new Date(e.date)-new Date(t.date))},async getHolidaysForYear(a,e=!0){const t=await this.loadHolidaySettings(),n=String(a);return(!Array.isArray(t.byYear[n])||t.byYear[n].length===0)&&(t.byYear[n]=this.buildYearFromBaseline(a),e&&await this.saveHolidaySettings(t)),[...t.byYear[n]].sort((s,i)=>new Date(s.date)-new Date(i.date))},async renderHolidayTable(a,e){const t=await this.getHolidaysForYear(a);return`
                <table class="compact-table">
                    <thead>
                        <tr>
                            <th>Occasion</th>
                            <th>Date</th>
                            ${e?'<th class="text-right">Actions</th>':""}
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderHolidayRows(a,t,e)}
                    </tbody>
                </table>
            `},renderHolidayRows(a,e,t){return e.length?e.map((n,s)=>{const o=new Date(n.date).toLocaleDateString("en-US",{month:"short",day:"numeric"});return`
                <tr>
                    <td>
                        <div class="policies-holiday-name">${n.name}</div>
                        ${n.type==="National"?'<span class="policies-holiday-chip">Compulsory</span>':""}
                    </td>
                    <td class="policies-holiday-date">${o}</td>
                    ${t?`
                        <td class="text-right">
                            <button class="icon-btn" title="Edit" onclick="window.AppPolicies.openHolidayEditor(${s})"><i class="fa-solid fa-pen"></i></button>
                            <button class="icon-btn" title="Delete" onclick="window.AppPolicies.deleteHoliday(${s})"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    `:""}
                </tr>
            `}).join(""):`<tr><td colspan="${t?3:2}" class="policies-empty-holiday">No holiday data available for ${a}</td></tr>`},async changeYear(a){this.currentYear+=a;const e=document.getElementById("policy-year-label"),t=document.getElementById("holidays-container"),n=te.getUser(),s=this.canManageHolidays(n);e&&t&&(e.textContent=this.currentYear,t.innerHTML=await this.renderHolidayTable(this.currentYear,s))},async openHolidayEditor(a=null){const e=te.getUser();if(!this.canManageHolidays(e))return;const t=this.currentYear,n=await this.getHolidaysForYear(t),s=Number.isInteger(a)?n[a]:null,i=`holiday-editor-${Date.now()}`,o=`
                <div class="modal-overlay" id="${i}" style="display:flex;">
                    <div class="modal-content" style="max-width:460px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.65rem;">
                            <h3 style="margin:0;">${s?"Edit Holiday":"Add Holiday"} (${t})</h3>
                            <button type="button" class="app-system-dialog-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                        </div>
                        <form onsubmit="window.AppPolicies.saveHoliday(event, ${Number.isInteger(a)?a:"null"})">
                            <div style="display:grid; gap:0.55rem;">
                                <div>
                                    <label>Holiday Name</label>
                                    <input id="holiday-name-input" type="text" required value="${s?String(s.name||"").replace(/"/g,"&quot;"):""}">
                                </div>
                                <div>
                                    <label>Date</label>
                                    <input id="holiday-date-input" type="date" required value="${s?s.date:`${t}-01-01`}">
                                </div>
                                <div>
                                    <label>Type</label>
                                    <select id="holiday-type-input">
                                        <option value="National" ${s&&s.type==="National"?"selected":""}>National</option>
                                        <option value="Regional" ${!s||s.type!=="National"?"selected":""}>Regional</option>
                                    </select>
                                </div>
                            </div>
                            <div style="display:flex; gap:0.5rem; margin-top:0.85rem;">
                                <button type="button" class="action-btn secondary" style="flex:1;" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                                <button type="submit" class="action-btn" style="flex:1;">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;typeof window.app_showModal=="function"?window.app_showModal(o,i):(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",o)},async saveHoliday(a,e=null){a.preventDefault();const t=(document.getElementById("holiday-name-input")?.value||"").trim(),n=String(document.getElementById("holiday-date-input")?.value||"").trim(),s=(document.getElementById("holiday-type-input")?.value||"Regional").trim();if(!t||!n){alert("Please provide holiday name and date.");return}if(!/^\d{4}-\d{2}-\d{2}$/.test(n)){alert("Please select a valid date.");return}const i=await this.loadHolidaySettings(),o=String(this.currentYear),r=String(n).slice(0,4),l=Number(o),d=Number(r);let c=Array.isArray(i.byYear[o])?[...i.byYear[o]]:this.buildYearFromBaseline(l),p=Array.isArray(i.byYear[r])?[...i.byYear[r]]:this.buildYearFromBaseline(d);const u={name:t,date:n,type:s==="National"?"National":"Regional"};Number.isInteger(e)&&c[e]&&(c.splice(e,1),i.byYear[o]=c.sort((m,h)=>new Date(m.date)-new Date(h.date))),p.push(u),i.byYear[r]=p.sort((m,h)=>new Date(m.date)-new Date(h.date)),await this.saveHolidaySettings(i),this.currentYear=d,document.querySelector('.modal-overlay[id^="holiday-editor-"]')?.remove(),await this.changeYear(0)},async deleteHoliday(a){const e=te.getUser();if(!this.canManageHolidays(e)||!await window.appConfirm("Delete this holiday from current year?"))return;const n=this.currentYear,s=await this.loadHolidaySettings(),i=String(n),o=Array.isArray(s.byYear[i])?[...s.byYear[i]]:[];o[a]&&(o.splice(a,1),s.byYear[i]=o,await this.saveHolidaySettings(s),await this.changeYear(0))},getIconForType(a){return{"Annual Leave":"calendar-check","Casual Leave":"mug-hot","Medical Leave":"staff-snake","Maternity Leave":"baby-carriage","Paternity Leave":"baby","Study Leave":"graduation-cap","Compassionate Leave":"hand-holding-heart","Short Leave":"clock"}[a]||"file-circle-check"},getColorForType(a){return{"Annual Leave":"#0f766e","Casual Leave":"#ea580c","Medical Leave":"#dc2626","Maternity Leave":"#be185d","Paternity Leave":"#1d4ed8","Study Leave":"#6d28d9","Compassionate Leave":"#9333ea","Short Leave":"#475569"}[a]||"#64748b"},renderLeaveCard(a,e,t,n){const s=Math.min(100,e.usage/e.total*100);return`
            <div class="policies-leave-item">
                <div class="policies-leave-bg-icon" style="color:${n};"><i class="fa-solid fa-${t}"></i></div>
                <h4>${a}</h4>
                <div class="policies-leave-count">
                    <span>${e.total-e.usage}</span>
                    <small>/ ${e.total}</small>
                </div>
                <div class="policies-leave-bar"><div style="width:${s}%; background:${n};"></div></div>
                <div class="policies-leave-used">${e.usage} used</div>
            </div>
            `}};typeof window<"u"&&(window.AppPolicies=Bo);function Z(a,e={}){const t=document.createElement(a);if(e.id&&(t.id=e.id),e.className&&(t.className=e.className),e.textContent&&(t.textContent=e.textContent),e.innerHTML&&(t.innerHTML=e.innerHTML),e.attributes)for(const[n,s]of Object.entries(e.attributes))t.setAttribute(n,s);if(e.children)for(const n of e.children)t.appendChild(n);return t}function Se(a={}){const e=Z("button",{className:a.className,textContent:a.textContent,innerHTML:a.innerHTML,attributes:{type:"button",...a.attributes}});return a.onClick&&e.addEventListener("click",a.onClick),e}const Ce=a=>String(a??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");function Ro(a,e,t,n,s){const i=Z("h3",{textContent:"Plan Your Day"}),o=Z("p",{className:"day-plan-subline",textContent:`${a}${e?` - Editing for ${t}`:""}`}),r=n?Se({className:"day-plan-delete-btn",attributes:{title:"Delete plan"},innerHTML:'<i class="fa-solid fa-trash"></i>',onClick:()=>window.app_deleteDayPlan(a,s)}):null,l=Se({className:"day-plan-close-btn",attributes:{title:"Close"},innerHTML:'<i class="fa-solid fa-xmark"></i>',onClick:c=>c.currentTarget.closest(".day-plan-modal-overlay").remove()}),d=Z("div",{className:"day-plan-header-actions",children:[r,l].filter(Boolean)});return Z("div",{className:"day-plan-header",children:[Z("div",{className:"day-plan-headline",children:[i,o]}),d]})}function Oo(a,e,t,n,s,i,o,r,l,d){const c=Z("div",{className:"day-plan-scroll-area personal-plans-container",attributes:{"data-scope":"personal"}}),p=Z("div",{className:"day-plan-scroll-area others-plans-container",attributes:{"data-scope":"annual"}});s.forEach((S,A)=>{const b=ft({plan:S,idx:A,allUsers:i,targetId:e,defaultScope:o,selectableCollaborators:r,isAdmin:l,currentUserId:d.id,isReference:S.isReference});(S.planScope||S._planScope||o)==="annual"||S.isReference?p.appendChild(b):c.appendChild(b)});const u=Z("div",{className:"day-plan-columns",children:[Z("div",{className:"day-plan-column",children:[Z("div",{className:"day-plan-column-head",children:[Z("h4",{className:"day-plan-column-title",textContent:"Self Plan"}),Se({className:"btn-premium-add",innerHTML:'<i class="fa-solid fa-plus-circle"></i> <span>Add Personal Plan (@)</span>',onClick:()=>mt({date:a,targetId:e,scope:"personal",allUsers:i,selectableCollaborators:r,isAdmin:l,container:c})})]}),c]}),Z("div",{className:"day-plan-column",children:[Z("div",{className:"day-plan-column-head",children:[Z("h4",{className:"day-plan-column-title",textContent:"Others' & Annual Plans"}),Se({className:"btn-premium-add",innerHTML:'<i class="fa-solid fa-plus-circle"></i> <span>Add Annual Plan (@)</span>',onClick:()=>mt({date:a,targetId:e,scope:"annual",allUsers:i,selectableCollaborators:r,isAdmin:l,container:p})})]}),p]})]}),m=Se({className:"day-plan-discard-btn",textContent:"Discard",onClick:S=>S.currentTarget.closest(".day-plan-modal-overlay").remove()}),h=Se({className:"day-plan-save-btn",innerHTML:'<i class="fa-solid fa-check-circle"></i> <span>Save Plan</span>',attributes:{type:"submit"}}),f=Z("div",{className:"day-plan-footer",children:[Z("div",{className:"day-plan-actions",children:[m,h]})]}),g=Z("form",{className:"day-plan-form",attributes:{"data-had-personal":t?"1":"0","data-had-annual":n?"1":"0","data-removed-tasks":"[]"},children:[u,f]});return g.addEventListener("submit",S=>window.app_saveDayPlan(S,a,e)),g}function mt(a){const{date:e,targetId:t,scope:n,allUsers:s,selectableCollaborators:i,isAdmin:o,container:r,existingBlock:l=null}=a,d=te.getUser(),c=l?window.app_extractBlockData(l):{task:"",subPlans:[],tags:[],status:null,assignedTo:t,startDate:e,endDate:e,planScope:n,carryForwardRootId:"",isRemoved:!1},p=Z("div",{className:"plan-editor-overlay"}),u=Z("div",{className:"plan-editor-modal"}),m=Z("div",{className:"plan-editor-head",innerHTML:`<h4>${l?"Edit":"Add"} ${n==="annual"?"Annual":"Personal"} Plan</h4>`}),h=Z("div",{className:"plan-editor-body"}),f=Z("textarea",{className:"plan-editor-textarea",textContent:c.task,attributes:{placeholder:"What is the objective or task for today?",required:!0}}),g=Z("div",{className:"plan-editor-grid"}),S=Z("div",{className:"plan-editor-field"});S.innerHTML="<label>Status</label>";const A=Z("select",{className:"plan-editor-select"});A.innerHTML=`
        <option value="" ${c.status?"":"selected"}>Auto-Track</option>
        <option value="completed" ${c.status==="completed"?"selected":""}>Completed</option>
        <option value="in-process" ${c.status==="in-process"?"selected":""}>In Progress</option>
        <option value="not-completed" ${c.status==="not-completed"?"selected":""}>Not Completing</option>
    `,S.appendChild(A);let b=null;if(o){const _=Z("div",{className:"plan-editor-field"});_.innerHTML="<label>Assign To</label>",b=Z("select",{className:"plan-editor-select"}),s.forEach(E=>{const M=Z("option",{textContent:E.name,attributes:{value:E.id,selected:E.id===c.assignedTo}});b.appendChild(M)}),_.appendChild(b),g.appendChild(_)}h.appendChild(f),h.appendChild(g);const x=Z("div",{className:"plan-editor-footer"}),D=Se({className:"day-plan-discard-btn",textContent:"Cancel",onClick:()=>p.remove()}),T=Se({className:"day-plan-save-btn",textContent:l?"Update":"Add to List",onClick:()=>{const _=f.value.trim();if(!_)return alert("Please enter a task description");const M={plan:{...c,task:_,status:A.value,assignedTo:b?b.value:c.assignedTo||t,tags:Array.isArray(c.tags)?c.tags:[]},allUsers:s,targetId:t,selectableCollaborators:i,isAdmin:o,currentUserId:d.id};if(l){const w=ft({...M,idx:Number.parseInt(l.getAttribute("data-index"))});l.replaceWith(w)}else{const w=ft({...M,idx:r.querySelectorAll(".plan-block").length});r.appendChild(w)}p.remove()}});x.appendChild(D),x.appendChild(T),u.appendChild(m),u.appendChild(h),u.appendChild(x),p.appendChild(u),document.getElementById("modal-container").appendChild(p),f.focus()}function ft(a){const{plan:e={},idx:t=0,allUsers:n=[],targetId:s,defaultScope:i="personal",selectableCollaborators:o=[],isAdmin:r=!1,currentUserId:l="",isReference:d=!1}=a||{},c=String(e.task||""),p=e.assignedTo||s||l,u=e.startDate||"",m=e.endDate||"",h=String(e.planScope||e._planScope||i)==="annual"?"annual":"personal",f=d?e.userName?`${e.userName}'s Plan`:"Others Plan":h==="annual"?"Annual Plan":"Personal Plan",g=c.trim()?c.trim().length>120?`${c.trim().slice(0,120)}...`:c.trim():"New task",S=Z("div",{className:(d?"plan-block-ref":"plan-block")+(d?" is-reference-only":""),attributes:{"data-index":t}}),A=Z("div",{className:"dp-hidden-data",attributes:{style:"display:none;"}});A.innerHTML=`
        <textarea class="plan-task">${Ce(c)}</textarea>
        <select class="plan-status"><option value="${Ce(e.status||"")}" selected></option></select>
        <select class="plan-scope"><option value="${Ce(h)}" selected></option></select>
        <select class="plan-assignee"><option value="${Ce(p)}" selected></option></select>
        <input class="plan-start-date" value="${Ce(u)}">
        <input class="plan-end-date" value="${Ce(m)}">
        <input class="plan-root-id" value="${Ce(e.carryForwardRootId||"")}">
        <input class="plan-removed-flag" value="${e.isRemoved===!0?"1":"0"}">
    `,e.subPlans&&e.subPlans.forEach(T=>{const _=Z("input",{className:"sub-plan-input",attributes:{value:Ce(T)}});A.appendChild(_)}),e.tags&&e.tags.forEach(T=>{const _=Z("div",{className:"tag-chip",attributes:{"data-id":T.id,"data-name":T.name,"data-status":T.status||"pending"}});A.appendChild(_)}),S.appendChild(A);const b=Z("div",{className:"plan-block-header"}),x=Z("div",{className:"plan-block-title-group"});x.appendChild(Z("span",{className:"day-plan-index-badge",textContent:t+1})),x.appendChild(Z("span",{className:"plan-block-summary",textContent:g}));const D=Z("div",{className:"plan-block-actions"});if(D.appendChild(Z("span",{className:"day-plan-scope-pill",textContent:f})),d||(D.appendChild(Se({className:"day-plan-edit-btn",attributes:{title:"Edit plan"},innerHTML:'<i class="fa-solid fa-pen-to-square"></i>',onClick:()=>mt({date:u,targetId:s,scope:h,allUsers:n,selectableCollaborators:o,isAdmin:r,container:S.parentElement,existingBlock:S})})),t>0?D.appendChild(Se({className:"day-plan-remove-btn",attributes:{title:"Remove task"},innerHTML:'<i class="fa-solid fa-trash-can"></i>',onClick:()=>window.app_markTaskRemoved(S)})):D.appendChild(Se({className:"day-plan-remove-btn",attributes:{title:"Remove task"},innerHTML:'<i class="fa-solid fa-trash-can"></i>',onClick:()=>window.app_markTaskRemoved(S)}))),b.appendChild(x),b.appendChild(D),S.appendChild(b),e.tags&&e.tags.length>0){const T=Z("div",{className:"plan-block-body"});e.tags.forEach(_=>{const E=Z("span",{className:"day-plan-tag-pill",textContent:`@${_.name}`});T.appendChild(E)}),S.appendChild(T)}return S}function qa(a){if(!a)return null;const e=a.querySelector(".plan-task")?.value||"",t=a.querySelector(".plan-status")?.value||"",n=a.querySelector(".plan-scope")?.value||"personal",s=a.querySelector(".plan-assignee")?.value||"",i=a.querySelector(".plan-start-date")?.value||"",o=a.querySelector(".plan-end-date")?.value||"",r=a.querySelector(".plan-root-id")?.value||"",l=a.querySelector(".plan-removed-flag")?.value==="1",d=Array.from(a.querySelectorAll(".sub-plan-input")).map(p=>p.value),c=Array.from(a.querySelectorAll(".tag-chip")).map(p=>({id:p.dataset.id,name:p.dataset.name,status:p.dataset.status}));return{task:e,status:t,planScope:n,assignedTo:s,startDate:i,endDate:o,subPlans:d,tags:c,carryForwardRootId:r,isRemoved:l}}const Fo=a=>!a||typeof a!="object"?!1:a.isAutoForwarded===!0||!!a.carryForwardRootId||!!a.carriedForwardFromDate||!!a.carriedForwardFromPlanId||!!a.autoForwardedAt;async function ds(a,e=null,t=null,n={}){const s=te.getUser(),i=String(e??"").trim(),o=!i||i==="undefined"||i==="null"?s.id:i,r=await X.getAll("users"),l=s.role==="Administrator"||s.isAdmin,d=o!==s.id,c=t==="annual"?"annual":"personal",p=n?.hideAutoForwardedTasks===!0,u=n?.skipCarryForwardSync===!0,m=n?.skipCarryForwardCleanup===!0;window.app_currentDayPlanTargetId=o,!u&&he?.ensureCarryForwardForDate&&a<=he.getTodayKey()&&await he.ensureCarryForwardForDate(a,{userIds:[o]});const h=he?.getTodayKey?he.getTodayKey():"";if(!m&&he?.cleanupInvalidTodayCarryForward&&a===h)try{const C=await he.cleanupInvalidTodayCarryForward(o,a,{onlyToday:!0});(C?.removed||0)>0&&console.log(`Day plan cleanup removed ${C.removed} invalid carry-forward task(s) for ${o} on ${a}.`)}catch(C){console.warn("Failed to cleanup invalid today carry-forward tasks:",C)}const[f,g,S]=await Promise.all([he.getWorkPlan(o,a,{planScope:"personal"}),he.getWorkPlan(o,a,{planScope:"annual"}),X.queryMany("work_plans",[{field:"date",operator:"==",value:a}])]),A=!!(f||g),b=r.find(C=>C.id===o),x=b?b.name:"Staff",D=r.filter(C=>C.id!==o),T=(C,B,O=null)=>C?Array.isArray(C.plans)&&C.plans.length>0?C.plans.map(F=>({...F,planScope:B,userName:O||C.userName,isReference:!!O})).filter(F=>F.isRemoved!==!0&&(!p||!Fo(F))):[]:[],_=(S||[]).filter(C=>C.id!==he.getWorkPlanId(a,o,"personal")&&C.id!==he.getWorkPlanId(a,o,"annual")),E=[];_.forEach(C=>{E.push(...T(C,C.planScope,C.userName))});const M=[...T(f,"personal"),...T(g,"annual"),...E];M.length===0&&M.push({task:"",subPlans:[],tags:[],status:null,assignedTo:o,startDate:a,endDate:a,planScope:c});const w=Z("div",{id:"day-plan-modal",className:"day-plan-modal-overlay"}),y=Z("div",{className:"day-plan-content"});y.appendChild(Ro(a,d,x,A,o)),y.appendChild(Oo(a,o,f,g,M,r,c,D,l,s)),w.appendChild(y);const k=document.getElementById("modal-container");if(!k)return;const P=document.getElementById("day-plan-modal");P&&P.remove(),k.appendChild(w);const R=document.getElementById("day-plan-modal");if(R){const B=Array.from(document.querySelectorAll(".modal-overlay, .modal, .dashboard-max-overlay, .dashboard-max-window, .hero-task-modal-overlay, .hero-task-modal-shell")).filter(O=>O!==R).reduce((O,F)=>{const U=Number.parseInt(window.getComputedStyle(F).zIndex,10);return Number.isFinite(U)?Math.max(O,U):O},1e3);R.style.zIndex=String(B+20)}}async function ls(a=null){const e=document.getElementById("day-plan-modal");if(!e)return;const t=a||"personal",n=t==="annual"?e.querySelector(".others-plans-container"):e.querySelector(".personal-plans-container"),s=e.querySelector(".day-plan-headline p")?.textContent?.match(/\d{4}-\d{2}-\d{2}/),i=s?s[0]:new Date().toISOString().split("T")[0],o=await X.getAll("users"),r=te.getUser(),l=window.app_currentDayPlanTargetId||r.id,d=r.role==="Administrator"||r.isAdmin,c=o.filter(p=>p.id!==l);mt({date:i,targetId:l,scope:t,allUsers:o,selectableCollaborators:c,isAdmin:d,container:n})}const Ho={openDayPlan:ds,dayPlanRenderBlockV3:ft,addPlanBlockUI:ls,openPlanEditor:mt,app_extractBlockData:qa};window.AppDayPlan=Ho;window.app_openDayPlan=ds;window.app_dayPlanRenderBlockV3=ft;window.app_addPlanBlockUI=ls;window.app_extractBlockData=qa;window.app_markTaskRemoved=function(a){if(!a)return;const e=a.closest(".day-plan-form"),t=qa(a),n=t?.carryForwardRootId||"";if(e&&n){let s=[];try{s=JSON.parse(e.dataset.removedTasks||"[]")}catch{s=[]}const i=t?.planScope==="annual"?"annual":"personal";s.find(o=>o&&o.rootId===n&&o.scope===i)||(s.push({rootId:n,scope:i}),e.dataset.removedTasks=JSON.stringify(s))}a.remove()};const wn={isWidgetMode:!1,syncInterval:null,init(){console.log("Widget Module Initialized"),new URLSearchParams(window.location.search).get("mode")==="widget"&&(this.isWidgetMode=!0),this.isWidgetMode&&this.enableWidgetMode()},toggle(){if(this.isWidgetMode)this.isWidgetMode=!1,window.opener||window.name==="CRWIWidget"?window.close():this.disableWidgetMode();else{const t=window.screen.width-320-20;window.open(window.location.origin+window.location.pathname+"?mode=widget#dashboard","CRWIWidget",`width=320,height=420,left=${t},top=40,menubar=no,toolbar=no,location=no,status=no,resizable=yes`)}},enableWidgetMode(){document.body.classList.add("widget-mode"),this.renderWidgetView(),this.startSync(),window.resizeTo&&window.resizeTo(320,420)},disableWidgetMode(){document.body.classList.remove("widget-mode");const a=document.getElementById("widget-view");a&&a.remove(),this.stopSync()},startSync(){this.syncInterval&&clearInterval(this.syncInterval),this.syncInterval=setInterval(()=>this.sync(),500)},stopSync(){this.syncInterval&&clearInterval(this.syncInterval)},sync(){if(!this.isWidgetMode)return;const a=document.getElementById("timer-display"),e=document.getElementById("timer-label"),t=document.querySelector(".check-in-widget .status-dot")||document.querySelector('.check-in-widget [style*="background: #10b981"]')||document.querySelector('.check-in-widget [style*="background: #94a3b8"]'),n=document.getElementById("attendance-btn"),s=document.getElementById("attendance-pause-btn"),i=document.getElementById("location-text"),o=document.getElementById("countdown-container"),r=document.getElementById("countdown-label"),l=document.getElementById("countdown-value"),d=document.getElementById("countdown-progress"),c=document.getElementById("overtime-container"),p=document.getElementById("overtime-value"),u=document.getElementById("widget-view");if(!u)return;const m=u.querySelector("#timer-display"),h=u.querySelector("#timer-label"),f=u.querySelector(".status-dot-indicator"),g=u.querySelector("#attendance-btn"),S=u.querySelector("#widget-pause-btn"),A=u.querySelector("#location-text"),b=u.querySelector("#countdown-container"),x=u.querySelector("#countdown-label"),D=u.querySelector("#countdown-value"),T=u.querySelector("#countdown-progress"),_=u.querySelector("#overtime-container"),E=u.querySelector("#overtime-value");if(a&&m&&(m.innerHTML=a.innerHTML,m.style.color=a.style.color),e&&h&&(h.innerHTML=e.innerHTML),t&&f&&(f.style.background=t.style.background||(t.classList.contains("online")?"#10b981":"#94a3b8")),o&&b&&(b.style.display=o.style.display,r&&x&&(x.innerHTML=r.innerHTML),l&&D&&(D.innerHTML=l.innerHTML),d&&T&&(T.style.width=d.style.width)),c&&_&&(_.style.display=c.style.display,p&&E&&(E.innerHTML=p.innerHTML)),n&&g&&(g.innerHTML=n.innerHTML,g.className=n.className,g.disabled=n.disabled),S)if(s){S.style.display="",S.innerHTML=s.innerHTML,S.className=s.className,S.disabled=s.disabled;const M=String(s.getAttribute("onclick")||"");S.dataset.action=M.includes("app_resumeSession")?"resume":"pause"}else S.style.display="none",S.dataset.action="",S.disabled=!0;i&&A&&(A.innerHTML=i.innerHTML)},handleWidgetAction(){if(window.opener&&!window.opener.closed)try{if(window.opener.focus(),window.opener.location.hash!=="#dashboard"&&(window.opener.location.hash="#dashboard"),window.opener.app_handleAttendance){window.opener.app_handleAttendance();return}}catch(t){console.warn("Could not communicate with main window:",t)}console.log("Opener lost or closed. Reopening main app...");const a=window.location.origin+window.location.pathname+"#dashboard",e=window.open(a,"CRWIMainApp");if(e){e.focus();const t=document.getElementById("attendance-btn");if(t){const n=t.innerHTML;t.innerHTML='<i class="fa-solid fa-arrow-up-right-from-square"></i> Opening App...',setTimeout(()=>{t.innerHTML=n},3e3)}}else alert("Please allow popups or open the main application window manually.")},handleWidgetPauseAction(){const a=document.getElementById("widget-pause-btn"),e=(a?.dataset?.action||"").toLowerCase(),t=i=>i?e==="resume"&&typeof i.app_resumeSession=="function"?(i.app_resumeSession(),!0):e==="pause"&&typeof i.app_pauseSession=="function"?(i.app_pauseSession(),!0):!1:!1;if(window.opener&&!window.opener.closed)try{if(window.opener.focus(),window.opener.location.hash!=="#dashboard"&&(window.opener.location.hash="#dashboard"),t(window.opener))return}catch(i){console.warn("Could not communicate with main window for pause action:",i)}const n=window.location.origin+window.location.pathname+"#dashboard",s=window.open(n,"CRWIMainApp");if(s){if(s.focus(),a){const i=a.innerHTML;a.innerHTML='<i class="fa-solid fa-arrow-up-right-from-square"></i> Opening App...',setTimeout(()=>{a.innerHTML=i},3e3)}}else alert("Please allow popups or open the main application window manually.")},renderWidgetView(){let a=document.getElementById("widget-view");a||(a=document.createElement("div"),a.id="widget-view",document.body.appendChild(a));const e=window.AppAuth&&window.AppAuth.getUser()||{name:"User",role:"Staff",avatar:"https://via.placeholder.com/48"};a.innerHTML=`
            <div class="widget-chrome-header">
                <div class="widget-drag-handle">
                    <i class="fa-solid fa-grip-lines"></i>
                </div>
                <div class="widget-controls">
                    <i class="fa-solid fa-expand widget-close" onclick="window.Widget.toggle()" title="Full View"></i>
                </div>
            </div>
            <div class="card check-in-widget">
                <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 0.75rem;">
                    <div style="position: relative;">
                        <img src="${e.avatar}" alt="Profile" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #e0e7ff;">
                        <div class="status-dot-indicator" style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border-radius: 50%; background: #94a3b8; border: 2px solid white;"></div>
                    </div>
                    <div style="text-align: left;">
                        <h4 style="font-size: 0.95rem; margin: 0; color: #1e1b4b;">${e.name}</h4>
                        <p class="text-muted" style="font-size: 0.75rem; margin: 0;">${e.role}</p>
                    </div>
                </div>

                <div style="text-align:center; padding: 0.5rem 0;">
                    <div class="timer-display" id="timer-display" style="font-size: 2.25rem; font-weight: 800; color: #1e1b4b; line-height: 1; letter-spacing: -1px;">00:00:00</div>
                    <div id="timer-label" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 6px; font-weight: 600;">Elapsed Time Today</div>
                </div>

                <div id="countdown-container" style="display: none; margin-bottom: 0.75rem; width: 100%;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #4b5563; margin-bottom: 4px;">
                        <span id="countdown-label">Time to checkout</span>
                        <span id="countdown-value" style="font-weight: 600;">--:--:--</span>
                    </div>
                    <div style="width: 100%; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
                        <div id="countdown-progress" style="width: 0%; height: 100%; background: var(--primary); transition: width 1s linear;"></div>
                    </div>
                </div>

                <div id="overtime-container" style="display: none; background: #fff7ed; border: 1px solid #ffedd5; padding: 0.5rem; border-radius: 8px; margin-bottom: 0.75rem; text-align: center;">
                    <div style="color: #c2410c; font-weight: 700; font-size: 0.8rem; margin-bottom: 2px;">OVERTIME</div>
                    <div id="overtime-value" style="color: #ea580c; font-size: 1.1rem; font-weight: 800; font-family: monospace;">00:00:00</div>
                </div>

                <div class="widget-action-row" style="display:flex; gap:0.5rem; margin-top: 0.5rem;">
                    <button class="btn btn-primary" id="attendance-btn" onclick="window.Widget.handleWidgetAction()" style="width: 100%; padding: 0.75rem; font-size: 0.9rem; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s ease;">
                        Action <i class="fa-solid fa-fingerprint"></i>
                    </button>
                    <button class="btn btn-secondary" id="widget-pause-btn" data-action="" onclick="window.Widget.handleWidgetPauseAction()" style="display:none; width:100%; padding:0.75rem; font-size:0.9rem; border-radius:10px; border:1px solid #cbd5e1; background:#f8fafc; color:#334155;">
                        Pause <i class="fa-solid fa-pause"></i>
                    </button>
                </div>

                <div class="location-text" id="location-text" style="font-size: 0.65rem; color: #94a3b8; text-align: center; margin-top: 0.5rem;">
                    <i class="fa-solid fa-location-dot"></i><span>Waiting for location...</span>
                </div>
            </div>
        `}};typeof window<"u"&&(window.Widget=wn,wn.init());var sa={buildId:"8721bcc-1777353230436",commitSha:"8721bcce92ca714fc26b2bb4efb0b0cef46da2de",builtAt:"2026-04-28T05:13:50.435Z"};let ia=null,_e=[],Le=null,ze=null,et=0,ke=!1,ot=null,oa=!1,cs=0,Sa=null,Mt=null,Ct=null,ka=!1,lt=null,tt=null;const Lt=Object.freeze(typeof sa=="object"&&sa?sa:{buildId:"local",commitSha:"",builtAt:""}),Uo="/version.json",qo=6e4,Aa="release_signal",gn="app_meta",ps="app_last_seen_release_id",ee={active:!1,releaseId:"",buildId:"",commitSha:"",deployedAt:"",notes:"",source:"",popupDismissed:!1},zo=18e4,jo=6e5;window.app_annualYear=new Date().getFullYear();const Yo=()=>{try{return localStorage.getItem(ps)||""}catch{return""}},us=a=>{try{localStorage.setItem(ps,String(a||""))}catch{}},ms=(a={},e="version")=>{const t=String(a.buildId||a.releaseId||a.commitSha||"").trim();return t?{releaseId:t,buildId:t,commitSha:String(a.commitSha||"").trim(),deployedAt:String(a.deployedAt||a.builtAt||"").trim(),notes:String(a.notes||"").trim(),source:String(e||a.source||"version").trim()}:null},kt=()=>({active:!!ee.active,releaseId:ee.releaseId||"",buildId:ee.buildId||"",commitSha:ee.commitSha||"",deployedAt:ee.deployedAt||"",notes:ee.notes||"",source:ee.source||"",popupDismissed:!!ee.popupDismissed,currentBuildId:Lt.buildId||"",currentCommitSha:Lt.commitSha||"",currentBuiltAt:Lt.builtAt||""});window.app_getReleaseUpdateState=()=>kt();const ht=()=>{const a=kt(),e=document.querySelector(".dashboard-refresh-link");e&&(a.active?(e.classList.add("is-update-pending"),e.setAttribute("title","Update available. Click to refresh into the new version."),e.textContent="System update available"):(e.classList.remove("is-update-pending"),e.setAttribute("title","Check for System Update (Ctrl+Shift+R)"),e.textContent="Check for System Update"))};window.app_applyUpdateCtaState=ht;const za=()=>{ht(),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:update-state",{detail:kt()}))},ja=(a=!1)=>{const e=ee.releaseId;ee.active=!1,ee.releaseId="",ee.buildId="",ee.commitSha="",ee.deployedAt="",ee.notes="",ee.source="",ee.popupDismissed=!1,ee.lastPopupReleaseId="",a&&e&&us(e),za()};window.app_dismissReleaseUpdatePrompt=()=>{ee.active&&(ee.releaseId&&us(ee.releaseId),ee.popupDismissed=!0,document.getElementById("system-update-modal")?.remove(),za())};const fs=(a,e={})=>{const t=ms(a,a?.source||"version");if(!t)return!1;if(t.buildId===Lt.buildId)return ja(!1),!1;const n=e.forcePopup===!0,s=Yo(),i=ee.active&&ee.releaseId===t.releaseId;return ee.active=!0,ee.releaseId=t.releaseId,ee.buildId=t.buildId,ee.commitSha=t.commitSha,ee.deployedAt=t.deployedAt,ee.notes=t.notes,ee.source=t.source,ee.popupDismissed=t.releaseId===s,i||window.app_showSyncToast("New version available."),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:update-available",{detail:kt()})),za(),!(ee.lastPopupReleaseId===t.releaseId)&&(n||!ee.popupDismissed)&&(ee.popupDismissed=!1,window.app_showSystemUpdatePopup()),!0},Wo=async({manual:a=!1}={})=>{try{const e=await fetch(`${Uo}?t=${Date.now()}`,{cache:"no-store",headers:{"cache-control":"no-cache"}});if(!e.ok)throw new Error(`Version check failed with ${e.status}`);const t=await e.json();return ms(t,"version")}catch(e){return console.warn("Unable to fetch deployed version manifest:",e),a&&window.app_showSyncToast("Could not check for updates right now."),null}},yt=async(a={})=>{if(tt)return tt;tt=(async()=>{const e=await Wo({manual:a.manual===!0});return e?fs(e,{forcePopup:a.forcePopup===!0}):!1})();try{return await tt}finally{tt=null}},hs=()=>{lt||(lt=setInterval(()=>{document.visibilityState==="visible"&&window.AppAuth?.getUser()&&yt()},qo),yt())},Ko=()=>{lt&&(clearInterval(lt),lt=null)},Vo=()=>{document.visibilityState==="visible"&&window.AppAuth?.getUser()&&yt()},bn=()=>{window.AppAuth?.getUser()&&yt()},vn=a=>{!a||a.id!==Aa||a.active!==!1&&fs({...a,source:"release-signal"},{forcePopup:!0})},ys=()=>{if(!ka){if(ka=!0,window.AppDB&&typeof window.AppDB.listenDoc=="function"){Mt=window.AppDB.listenDoc(gn,Aa,a=>{a&&vn(a)});return}Ct=setInterval(async()=>{try{const a=await window.AppDB.get(gn,Aa);a&&vn(a)}catch{}},3e4)}},Go=()=>{typeof Mt=="function"&&(Mt(),Mt=null),Ct&&(clearInterval(Ct),Ct=null),ka=!1};window.app_checkForSystemUpdate=async()=>{if(ee.active)return window.app_showSystemUpdatePopup(),!0;const a=await yt({manual:!0,forcePopup:!0});return a||window.app_showSyncToast("You are already using the latest version."),a};window.app_isAdminUser=(a=window.AppAuth?.getUser())=>a?a.isAdmin===!0:!1;window.app_canSeeAdminPanel=(a=window.AppAuth?.getUser())=>a?window.app_isAdminUser(a)?!0:a.permissions?Object.entries(a.permissions).some(([e,t])=>e!=="birthday"&&t==="admin"):!1:!1;window.app_hasPerm=(a,e="view",t=window.AppAuth?.getUser())=>{if(!t)return!1;if(t.isAdmin===!0)return!0;if(!t.permissions||!t.permissions[a])return!1;const n=t.permissions[a];return e==="view"?n==="view"||n==="admin":e==="admin"?n==="admin":!1};window.app_canManageAttendanceSheet=(a=window.AppAuth?.getUser())=>a?window.app_hasPerm("attendance","admin",a)||!!a.canManageAttendanceSheet:!1;window.app_canManageBirthdays=(a=window.AppAuth?.getUser())=>a?window.app_isAdminUser(a)||a.role==="Administrator"||!!a.canManageBirthdays||window.app_hasPerm("birthday","view",a):!1;window.app_canAdminBirthdays=(a=window.AppAuth?.getUser())=>a?window.app_isAdminUser(a)||a.role==="Administrator"||!!a.canManageBirthdays||window.app_hasPerm("birthday","admin",a):!1;window.app_getReadTelemetry=()=>!window.AppDB||!window.AppDB.getReadTelemetry?{}:window.AppDB.getReadTelemetry();window.app_resetReadTelemetry=()=>{!window.AppDB||!window.AppDB.clearReadTelemetry||window.AppDB.clearReadTelemetry()};window.app_getMyMessages=async()=>{const a=window.AppAuth.getUser();if(!a)return[];try{const[e,t]=await Promise.all([window.AppDB.query("staff_messages","toId","==",a.id),window.AppDB.query("staff_messages","fromId","==",a.id)]),n=new Map;return(e||[]).forEach(s=>n.set(s.id,s)),(t||[]).forEach(s=>n.set(s.id,s)),Array.from(n.values())}catch(e){return console.warn("Message fetch failed, falling back to getAll",e),window.AppDB.getAll("staff_messages")}};const ne=document.getElementById("page-content"),_t=document.querySelector(".sidebar"),$t=document.querySelector(".mobile-header"),xt=document.querySelector(".mobile-nav");window.app_initTheme=()=>{const a=localStorage.getItem("theme")||"light";document.documentElement.setAttribute("data-theme",a),ws(a)};window.app_toggleTheme=()=>{const e=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",e),localStorage.setItem("theme",e),ws(e)};function ws(a){document.querySelectorAll(".theme-toggle i").forEach(e=>{a==="dark"?(e.classList.remove("fa-moon"),e.classList.add("fa-sun")):(e.classList.remove("fa-sun"),e.classList.add("fa-moon"))})}window.addEventListener("load",()=>{window.app_showLastNotifError&&window.app_showLastNotifError()},{once:!0});function Jo(){if(!("serviceWorker"in navigator))return;const a=async()=>{try{Sa=await navigator.serviceWorker.register("/sw.js"),console.log("ServiceWorker registered")}catch(e){console.log("ServiceWorker registration failed: ",e)}};if(document.readyState==="complete"){a();return}window.addEventListener("load",()=>{a()},{once:!0})}const Sn=(a=new Date)=>`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`;window.app_showAttendanceNotice=a=>{if(!a)return;const e=document.getElementById("page-content");if(!e)return;const t=document.getElementById("attendance-policy-notice");t&&t.remove();const n=document.createElement("div");n.id="attendance-policy-notice",n.style.background="#fff7ed",n.style.border="1px solid #fdba74",n.style.color="#9a3412",n.style.padding="0.85rem 1rem",n.style.borderRadius="10px",n.style.marginBottom="0.9rem",n.style.fontSize="0.9rem",n.style.fontWeight="600",n.innerHTML=`<i class="fa-solid fa-circle-info" style="margin-right:0.45rem;"></i>${a}`,e.prepend(n),setTimeout(()=>{const s=document.getElementById("attendance-policy-notice");s&&s.remove()},1e4)};window.app_promptMissedCheckoutReason=(a={})=>{const{logId:e,date:t}=a||{};if(!e||document.getElementById("missed-checkout-reason-modal"))return;const n=t?new Date(`${t}T00:00:00`).toLocaleDateString():"previous day",s=`
        <div class="modal-overlay" id="missed-checkout-reason-modal" style="display:flex;">
            <div class="modal-content" style="max-width:560px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:0.75rem;">
                    <div>
                        <h3 style="margin:0;">Missed Checkout</h3>
                        <p style="margin:0.35rem 0 0 0; font-size:0.85rem; color:#6b7280;">
                            Your session on ${V(n)} was auto-checked out and counted as a half day.
                        </p>
                    </div>
                    <button type="button" onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
                </div>
                <form onsubmit="window.app_submitMissedCheckoutReason(event, '${String(e)}')">
                    <label style="display:block; font-size:0.85rem; margin-bottom:0.35rem;">Reason for not checking out</label>
                    <textarea name="reason" required placeholder="Share what happened..." style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px; min-height:110px;"></textarea>
                    <div style="font-size:0.8rem; color:#92400e; margin-top:0.5rem;">
                        This will be sent to admin for verification.
                    </div>
                    <div style="display:flex; justify-content:flex-end; margin-top:1rem;">
                        <button type="submit" class="action-btn">Submit Reason</button>
                    </div>
                </form>
            </div>
        </div>
    `;(document.body||document.getElementById("modal-container")).insertAdjacentHTML("beforeend",s);const i=document.getElementById("missed-checkout-reason-modal");i?.addEventListener("click",o=>{o.target===i&&i.remove()})};window.app_submitMissedCheckoutReason=async(a,e)=>{a.preventDefault();const t=a.target,n=String(new FormData(t).get("reason")||"").trim();if(!n){alert("Please enter a reason.");return}try{const s=window.AppAuth.getUser();if(!s)throw new Error("User not authenticated");const i=await window.AppDB.get("attendance",e);if(!i)throw new Error("Attendance record not found.");const o=new Date().toISOString(),r={...i,missedCheckoutReason:n,missedCheckoutReasonSubmittedAt:o,missedCheckoutReasonStatus:"pending"};await window.AppDB.put("attendance",r);const l=await window.AppDB.get("users",s.id);l&&(l.notifications||(l.notifications=[]),l.notifications.unshift({id:`mcr_sub_${Date.now()}`,type:"missed-checkout-reason-submitted",title:"Missed checkout reason submitted",message:`Reason sent for ${i.date}. Awaiting admin verification.`,status:"submitted",date:o,read:!0}),await window.AppDB.put("users",l),window.AppAuth?.getUser&&Object.assign(window.AppAuth.getUser(),{notifications:l.notifications}));const d=(await window.AppDB.getAll("users")).filter(c=>c.isAdmin||c.role==="Administrator");await Promise.all(d.map(async c=>{c.notifications||(c.notifications=[]),c.notifications.unshift({id:`mcr_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"missed-checkout-reason",title:"Missed checkout reason submitted",message:`${s.name} submitted a reason for missed checkout on ${i.date}.`,description:n,staffId:s.id,staffName:s.name,missedCheckoutDate:i.date,logId:String(i.id||""),taggedById:s.id,taggedByName:s.name,taggedAt:o,status:"pending",date:o,read:!1}),await window.AppDB.put("users",c)})),document.getElementById("missed-checkout-reason-modal")?.remove(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell(),window.app_showSyncToast("Reason submitted for admin verification.")}catch(s){console.error("Missed checkout reason submit failed:",s),alert("Failed to submit reason: "+s.message)}};window.app_showSyncToast=(a="Status updated from another device.")=>{const e="app-sync-toast",t=document.getElementById(e);t&&t.remove();const n=document.createElement("div");n.id=e,n.style.position="fixed",n.style.top="14px",n.style.right="14px",n.style.zIndex="10020",n.style.background="#0f172a",n.style.color="#f8fafc",n.style.padding="0.7rem 0.9rem",n.style.borderRadius="10px",n.style.fontSize="0.82rem",n.style.fontWeight="600",n.style.boxShadow="0 8px 25px rgba(15, 23, 42, 0.3)",n.textContent=a,document.body.appendChild(n),setTimeout(()=>{const s=document.getElementById(e);s&&s.remove()},2800)};const Xo=Object.freeze({"team-activities":{title:"How To Use This Page",why:"This page helps you review what the team has been working on, track progress, and spot overdue or blocked work in one place.",how:"Use the filters to narrow by date, type, status, or staff member. Open the records to review details, compare activity across people, and move through pages when the list is long."},"staff-directory":{title:"How To Use This Page",why:"This page is for staff communication and quick follow-up. It keeps person-to-person messages and task discussions organized by staff member.",how:"Choose a staff member from the list, read the conversation history, then send a message or review assigned tasks. Return here whenever you need to continue a discussion with someone on the team."},policies:{title:"How To Use This Page",why:"This page explains attendance rules, holidays, working hours, and policy settings so everyone follows the same process.",how:"Read the sections before taking action on attendance, leave, or office timing questions. Admin users can update policy values here, while staff should use it as the main reference page."},"annual-plan":{title:"How To Use This Page",why:"This page gives a year-wide view of planned work so you can understand schedules, deadlines, and major activities across the calendar.",how:"Switch between views, filter by staff, search the list, and jump to important dates. Open a day when you want to inspect or plan work for that specific date."},"birthday-calendar":{title:"How To Use This Page",why:"This page keeps birthday records organized so the team can manage celebrations and maintain correct staff details.",how:"Review upcoming birthdays, add missing entries, or update existing records when details change. Use it as the central place for birthday-related staff information."},timesheet:{title:"How To Use This Page",why:"This page is for checking attendance history, work duration, and day-by-day time records.",how:"Use the available filters or date controls to inspect your logs, verify hours, and open details when something looks incorrect. It is the best page to review your past attendance entries."},profile:{title:"How To Use This Page",why:"This page shows your personal staff profile, attendance summary, and leave-related information in one place.",how:"Use it to review your details, check your current status, and look at summary numbers for attendance and leave. Admin users can also switch between staff profiles when needed."},minutes:{title:"How To Use This Page",why:"This page is for recording meeting discussions, decisions, action items, and approvals so nothing important is lost after a meeting.",how:"Create a meeting record, write the discussion summary, add action items with owners, and review approval or edit history. Use search to quickly find older meetings."},admin:{title:"How To Use This Page",why:"This page gives administrators control over reports, staff management, attendance monitoring, and approval workflows.",how:"Use the filters and admin tools to inspect records, approve requests, review trends, and take corrective actions. Changes here can affect multiple users, so review entries carefully before saving."},"master-sheet":{title:"How To Use This Page",why:"This page provides a sheet-style attendance view so you can inspect staff presence, absences, holidays, and exceptions across many dates at once.",how:"Scan rows and columns to compare attendance patterns quickly. Admin users can open cells for detailed review or corrections where needed."},salary:{title:"How To Use This Page",why:"This page supports salary preparation by combining attendance-based calculations and payroll-related values in one working area.",how:"Review staff rows carefully, check attendance-driven inputs, and update values before final processing. Use it when payroll needs to be prepared from attendance data."},"policy-test":{title:"How To Use This Page",why:"This page helps verify whether policy logic and rules are behaving as expected before relying on them in day-to-day use.",how:"Run the available checks, compare outcomes, and confirm that policy behavior matches the intended rules. It is mainly for validation and troubleshooting."}}),Qo=a=>{const e=Xo[a];if(!e)return"";const t=V(e.title||"How To Use This Page"),n=V(e.why||""),s=V(e.how||"");return`
        <section class="page-usage-note" id="page-usage-note" data-page-key="${V(a)}" aria-label="Page help note">
            <div class="page-usage-note-header">
                <i class="fa-solid fa-circle-info"></i>
                <h3>${t}</h3>
            </div>
            <p><strong>Why this page exists:</strong> ${n}</p>
            <p><strong>How to use it:</strong> ${s}</p>
        </section>
    `},ra=()=>{const a=document.getElementById("page-content");if(!a)return;const e=String(window.location.hash||"").replace(/^#/,"")||"dashboard",t=a.querySelector("#page-usage-note");if(e==="dashboard"){t?.remove();return}const n=Qo(e);if(!n){t?.remove();return}t?.dataset.pageKey!==e&&(t?.remove(),a.insertAdjacentHTML("beforeend",n))},Zo=()=>{if(window.__appPageUsageNotesInitialized)return;window.__appPageUsageNotesInitialized=!0;const a=()=>{const e=document.getElementById("page-content");if(!e||e.__pageUsageObserverBound)return;new MutationObserver(()=>{if(e.dataset.applyingUsageNote!=="1"){e.dataset.applyingUsageNote="1";try{ra()}finally{delete e.dataset.applyingUsageNote}}}).observe(e,{childList:!0}),e.__pageUsageObserverBound=!0,ra()};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",a,{once:!0}):a(),window.addEventListener("hashchange",()=>{requestAnimationFrame(()=>{ra()})})},kn=()=>!ke&&Date.now()>cs,wt=()=>{cs=Date.now()+3500},er=a=>{const e=a.detail;if(!e)return;window.app_refreshNotificationBell&&window.app_refreshNotificationBell().catch(()=>{});const t=e.status||"out",n=ot!==null&&t!==ot,s=ot===null&&t==="in";if(ot=t,!(n||s)||oa)return;const i=!window.location.hash||window.location.hash==="#dashboard",o=document.getElementById("checkout-modal"),r=!!(o&&o.style.display==="flex");if(t==="out"&&r&&(o.style.display="none"),!i){kn()&&window.app_showSyncToast("Status updated from another device.");return}oa=!0,(async()=>{try{const l=document.getElementById("page-content");l&&(l.innerHTML=await K.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),kn()&&window.app_showSyncToast("Status updated from another device.")}catch(l){console.warn("Realtime dashboard sync failed:",l)}finally{oa=!1}})()},Ya=async()=>{if(window.AppAuth?.refreshCurrentUserFromDB)try{const a=await window.AppAuth.refreshCurrentUserFromDB();if(!a)return;window.dispatchEvent(new CustomEvent("app:user-sync",{detail:a}))}catch(a){console.warn("Current user attendance reconciliation failed:",a)}},tr=()=>{document.visibilityState==="visible"&&Ya()};window.app_reconcileCurrentUserAttendanceState=Ya;window.addEventListener("focus",()=>{Ya()});document.addEventListener("visibilitychange",tr);function Da(a){const e=document.querySelector(".sidebar"),t=document.getElementById("sidebar-overlay");e&&t&&(a?(e.classList.add("open"),t.classList.add("active")):(e.classList.remove("open"),t.classList.remove("active")))}function ar(){if(window.location.search){const a=window.location.protocol+"//"+window.location.host+window.location.pathname+window.location.hash;window.history.replaceState({path:a},"",a),console.log("Address bar cleaned of query parameters.")}}window.app_toggleSidebar=(a=null)=>{const e=document.querySelector(".sidebar"),t=document.querySelector("#desktop-sidebar-toggle i");if(!e)return;(a!==null?a:!e.classList.contains("collapsed"))?(e.classList.add("collapsed"),t&&(t.classList.remove("fa-angles-left"),t.classList.add("fa-angles-right"))):(e.classList.remove("collapsed"),t&&(t.classList.remove("fa-angles-right"),t.classList.add("fa-angles-left")))};window.app_showModal=(a,e)=>{const t=document.getElementById("modal-container");if(!t)return;const n=document.getElementById(e);n&&n.remove(),t.insertAdjacentHTML("beforeend",a);const s=document.getElementById(e);if(s&&(s.classList.contains("modal-overlay")||s.classList.contains("modal"))){const o=Array.from(document.querySelectorAll(".modal-overlay, .modal")).filter(r=>r!==s).reduce((r,l)=>{const d=Number.parseInt(window.getComputedStyle(l).zIndex,10);return Number.isFinite(d)?Math.max(r,d):r},1e3);s.style.zIndex=String(o+2)}};window.app_renderCarryForwardIssues=function(a="date-desc"){const e=Array.isArray(window.app_carryForwardIssues)?window.app_carryForwardIssues:[],t=200,n=String(a||"date-desc"),i=[...e].sort((d,c)=>n==="date-asc"?String(d.planDate||"").localeCompare(String(c.planDate||"")):n==="owner-asc"?String(d.planUserName||"").localeCompare(String(c.planUserName||""))||String(c.planDate||"").localeCompare(String(d.planDate||"")):n==="owner-desc"?String(c.planUserName||"").localeCompare(String(d.planUserName||""))||String(c.planDate||"").localeCompare(String(d.planDate||"")):n==="origin-asc"?String(d.originDate||"").localeCompare(String(c.originDate||"")):n==="origin-desc"?String(c.originDate||"").localeCompare(String(d.originDate||"")):String(c.planDate||"").localeCompare(String(d.planDate||""))).slice(0,t).map(d=>{const c=[d.ownerMismatch?"Owner mismatch":"",d.assignedMismatch?"Assigned mismatch":"",d.isAutoForwarded?"Auto-forwarded":""].filter(Boolean).join(", ")||"—";return`
            <tr>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${G(d.planDate||"")}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${G(d.planUserName||d.planUserId||"")}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${G(d.taskText||"")}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${G(d.originDate||"")}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${G(d.rootToken||"")}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${G(c)}</td>
            </tr>
        `}).join(""),o=e.length>t?`<div style="font-size:0.8rem; color:#94a3b8;">Showing first ${t} of ${e.length} items.</div>`:`<div style="font-size:0.8rem; color:#94a3b8;">Total items: ${e.length}.</div>`,r=`
        <div class="modal-overlay" id="carryforward-issues-modal" style="display:flex;">
            <div class="modal-content" style="max-width:960px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                    <h3 style="margin:0;">Auto-Forward Issues</h3>
                    <button type="button" onclick="window.app_closeModal(this)" class="day-plan-close-btn" title="Close">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div style="font-size:0.85rem; color:#64748b; margin-bottom:0.6rem;">
                    These are carry-forward tasks that look assigned to the wrong staff or plan owner.
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:0.6rem; align-items:center; margin-bottom:0.6rem;">
                    <label style="font-size:0.8rem; color:#64748b;">Sort by</label>
                    <select id="carryforward-issues-sort" class="app-select" style="padding:6px 8px; border-radius:8px; border:1px solid #e2e8f0;">
                        <option value="date-desc" ${n==="date-desc"?"selected":""}>Date (Newest)</option>
                        <option value="date-asc" ${n==="date-asc"?"selected":""}>Date (Oldest)</option>
                        <option value="owner-asc" ${n==="owner-asc"?"selected":""}>Owner (A-Z)</option>
                        <option value="owner-desc" ${n==="owner-desc"?"selected":""}>Owner (Z-A)</option>
                        <option value="origin-desc" ${n==="origin-desc"?"selected":""}>Origin (Newest)</option>
                        <option value="origin-asc" ${n==="origin-asc"?"selected":""}>Origin (Oldest)</option>
                    </select>
                    <button type="button" class="action-btn danger" onclick="window.app_removeCarryForwardIssues && window.app_removeCarryForwardIssues()">
                        <i class="fa-solid fa-trash"></i> Delete All Listed
                    </button>
                </div>
                ${o}
                <div style="margin-top:0.6rem; border:1px solid #e2e8f0; border-radius:10px; overflow:auto; max-height:60vh;">
                    <table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
                        <thead style="background:#f8fafc; position:sticky; top:0;">
                            <tr>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0;">Date</th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0;">Plan Owner</th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0;">Task</th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0;">Origin Date</th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0;">Root Token</th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0;">Flags</th>
                            </tr>
                        </thead>
                        <tbody>${i}</tbody>
                    </table>
                </div>
            </div>
        </div>
    `;window.app_showModal(r,"carryforward-issues-modal");const l=document.getElementById("carryforward-issues-sort");l&&l.addEventListener("change",d=>{const c=d.target?.value||"date-desc";window.app_renderCarryForwardIssues(c)},{once:!0})};window.app_removeCarryForwardIssues=async function(){try{const a=Array.isArray(window.app_carryForwardIssues)?window.app_carryForwardIssues:[];if(!a.length){alert("No items to remove.");return}const e=`Remove ${a.length} task(s) so they stop carrying forward?`;if(!(window.appConfirm?await window.appConfirm(e):window.confirm(e)))return;if(!window.AppCalendar?.removeTask){alert("Remove action is not available.");return}let n=0,s=0,i=0;const o=window.AppAuth?.getUser?window.AppAuth.getUser():null;for(const d of a){if(!d.planId){s+=1;continue}try{const c=await window.AppDB.get("work_plans",d.planId);if(!c||!Array.isArray(c.plans)||c.plans.length===0){s+=1;continue}let p=-1;const u=String(d.rootToken||"").trim();if(u&&(p=c.plans.findIndex(m=>m&&(String(m.carryForwardRootId||"")===u||String(m.carriedForwardFromPlanId||"")===u||String(m.sourcePlanId||"")===u))),p<0&&Number.isInteger(d.taskIndex)&&(p=d.taskIndex),p<0||!c.plans[p]){s+=1;continue}c.plans[p]={...c.plans[p],status:"not-completed",isRemoved:!0,removedAt:new Date().toISOString(),removedBy:o?.id||""},c.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",c),n+=1}catch(c){i+=1,console.warn("Carry-forward remove failed",{issue:d,err:c})}}const r=`Removed: ${n}. Skipped: ${s}. Failed: ${i}.`;window.app_showSyncToast?window.app_showSyncToast(r):alert(r);const l=window.AppCalendar?.findCarryForwardIssues?await window.AppCalendar.findCarryForwardIssues({includeAssignedMismatch:!0}):[];if(window.app_carryForwardIssues=l,!l.length){window.app_renderCarryForwardIssues("date-desc");return}window.app_renderCarryForwardIssues("date-desc")}catch(a){console.error("Bulk remove carry-forward issues failed:",a),alert("Failed to remove carry-forward issues.")}};window.app_findCarryForwardIssues=async function(){try{if(!window.AppCalendar?.findCarryForwardIssues){alert("Carry-forward scan is not available in this build.");return}const a=await window.AppCalendar.findCarryForwardIssues({includeAssignedMismatch:!0});if(!a.length){alert("No auto-forwarded tasks assigned to other staff were found.");return}window.app_carryForwardIssues=a,window.app_renderCarryForwardIssues("date-desc")}catch(a){console.error("Carry-forward scan failed:",a),alert("Failed to scan carry-forward tasks. Please try again.")}};const V=a=>String(a??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),nr=a=>V(a).replace(/\n/g,"<br>"),_a=a=>String(a?.status||"pending").toLowerCase(),ct=a=>a?.type==="birthday-reminder"?a?.read!==!0:_a(a)==="pending",$a=a=>{if(!a)return!1;if(a.autoPostponed===!0||a.isAutoForwarded===!0)return!0;const e=String(a.type||"").toLowerCase();if(e.includes("auto-forward")||e.includes("carry-forward")||e.includes("system-postponed"))return!0;const t=`${a.title||""} ${a.message||""} ${a.description||""}`.toLowerCase();return/postponed from|auto[- ]?forward|carried forward|carry forward|system postponed/.test(t)},da=a=>a?.type==="birthday-reminder"?"Birthday":a?.type==="minute-access-request"?"Minutes":String(a?.type||"").includes("missed-checkout")?"Attendance":a?.type==="task"?"Task":a?.type==="tag"||a?.type==="mention"?"Tag":a?.type==="reminder"?"Reminder":"Notification",sr=a=>a?a.type==="minute-access-request"||String(a.type||"").includes("missed-checkout")?!0:a.type==="tag"||a.type==="mention":!1,An=a=>String(a?.description||a?.message||a?.title||"").trim(),ir=a=>{const e=a?.respondedAt||a?.taggedAt||a?.date,t=new Date(e).getTime();if(!t)return"Unknown time";const n=Math.max(0,Math.floor((Date.now()-t)/6e4)),s=n<1?"just now":n<60?`${n} mins ago`:n<1440?`${Math.floor(n/60)} hrs ago`:`${Math.floor(n/1440)} days ago`;return`${new Date(t).toLocaleString()} (${s})`};window.app_refreshNotificationBell=async()=>{const a=document.querySelectorAll(".top-notification-btn");if(!a.length)return;const e=window.AppAuth.getUser(),t=Array.isArray(e?.notifications)?e.notifications:[],n=t.filter(i=>!$a(i)),s=n.filter(ct).length;if(e&&n.length!==t.length)try{const i=await window.AppDB.get("users",e.id).catch(()=>null);i&&Array.isArray(i.notifications)&&(i.notifications=i.notifications.filter(o=>!$a(o)),await window.AppDB.put("users",i),Object.assign(e,{notifications:i.notifications}))}catch(i){console.warn("Failed to clean postponed notifications during bell refresh:",i)}a.forEach(i=>{const o=i.querySelector(".top-notification-badge");if(!e){i.classList.remove("has-pending"),o&&(o.style.display="none");return}i.classList.toggle("has-pending",s>0),i.setAttribute("title",s>0?`${s} pending notification${s>1?"s":""}`:"Notification history"),o&&(s>0?(o.textContent=s>99?"99+":String(s),o.style.display=""):o.style.display="none")})};window.app_closeNotificationHistory=()=>{const a=document.getElementById("notification-history-modal"),e=document.getElementById("notif-drawer-backdrop");a&&a.classList.remove("notif-drawer-open"),e&&e.classList.remove("notif-drawer-backdrop-visible"),setTimeout(()=>document.getElementById("notif-drawer-root")?.remove(),320)};window.app_recordNotifError=(a,e={})=>{try{const t={message:String(a?.message||a||"Unknown error"),time:new Date().toISOString(),context:e};localStorage.setItem("notif_last_error",JSON.stringify(t))}catch{}};window.app_showLastNotifError=()=>{try{const a=localStorage.getItem("notif_last_error");if(!a)return;localStorage.removeItem("notif_last_error");const e=JSON.parse(a),t=`
            <div class="modal-overlay" id="notif-error-modal" style="display:flex;">
                <div class="modal-content" style="max-width:560px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                        <h3 style="margin:0;">Notification Error</h3>
                        <button type="button" onclick="window.app_closeModal(this)" class="day-plan-close-btn" title="Close">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div style="font-size:0.85rem; color:#64748b; margin-bottom:0.6rem;">
                        The last notification action failed. Details below:
                    </div>
                    <div style="background:#fef2f2; border:1px solid #fecaca; color:#991b1b; padding:0.65rem; border-radius:8px; font-size:0.85rem;">
                        ${V(e?.message||"Unknown error")}
                    </div>
                    <div style="margin-top:0.6rem; font-size:0.78rem; color:#64748b;">
                        Time: ${V(e?.time||"")}
                    </div>
                </div>
            </div>
        `;window.app_showModal(t,"notif-error-modal")}catch{}};window.app_markNotificationResponded=async(a,e,t)=>{const n=window.AppAuth.getUser();if(!n)return!1;const s=await window.AppDB.get("users",n.id).catch(()=>null);if(!s||!Array.isArray(s.notifications))return!1;let i=null;if(Number.isInteger(e)&&e>=0&&s.notifications[e]?i=s.notifications[e]:a&&(i=s.notifications.find(r=>String(r.id||"")===String(a))),!i)return!1;const o=new Date().toISOString();return i.status=t,i.respondedAt=o,i.read=!0,i.dismissedAt=o,await window.AppDB.put("users",s),await window.app_refreshNotificationBell?.(),!0};window.app_respondNotificationFromHistory=async(a,e,t)=>{const n=window.AppAuth.getUser();if(!n)return;const s=t==="approve"?"approve":"reject",i=await window.AppDB.get("users",n.id);if(!i||!Array.isArray(i.notifications)){alert("Notification not found.");return}let o=null,r=-1;if(Number.isInteger(a)&&a>=0&&i.notifications[a]&&(o=i.notifications[a],r=a),!o&&e&&(r=i.notifications.findIndex(l=>String(l.id)===String(e)),r>=0&&(o=i.notifications[r])),!o){alert("This notification is no longer available.");return}if(!ct(o)){alert("This notification has already been responded."),await window.app_refreshNotificationBell();return}window.app_closeNotificationHistory();try{if(o.type==="minute-access-request"&&window.app_hasPerm("minutes","admin",n)){await window.app_reviewMinuteAccessFromNotification(r,o.id,s==="approve"?"approved":"rejected");return}if(o.type==="missed-checkout-reason"&&(n.isAdmin||n.role==="Administrator")){await window.app_reviewMissedCheckoutReasonFromNotification(r,o.id,s==="approve"?"approved":"rejected");return}const l=Number(o.taskIndex);if(o.planId&&Number.isInteger(l)&&l>=0){await window.app_handleTagResponse(o.planId,l,s==="approve"?"accepted":"rejected",r);return}if(o.id){await window.app_handleTagDecision(o.id,s==="approve"?"accepted":"rejected");return}await window.app_markNotificationResponded(o.id,r,s==="approve"?"accepted":"rejected")||alert("This notification cannot be approved or rejected from history.")}catch(l){if(console.error("Notification response error:",l),window.app_recordNotifError(l,{notifId:o?.id||"",action:s}),await window.app_markNotificationResponded(o?.id,r,s==="approve"?"accepted":"rejected")){alert("Action recorded in notifications, but the full workflow failed. Please refresh.");return}alert("Failed to process notification: "+l.message)}};window.app_openNotificationHistory=async()=>{const a=window.AppAuth.getUser();if(!a)return;const e=await window.AppDB.get("users",a.id).catch(()=>a),t=Array.isArray(e?.notifications)?e.notifications:[],n=t.filter(M=>!$a(M));if(n.length!==t.length&&e)try{e.notifications=n,await window.AppDB.put("users",e),window.AppAuth?.getUser&&Object.assign(window.AppAuth.getUser(),{notifications:n}),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}catch(M){console.warn("Failed to clean postponed notifications:",M)}const s=n,i=Array.isArray(e?.tagHistory)?e.tagHistory:[],o=a.isAdmin||a.role==="Administrator",r=[...s.map((M,w)=>({...M,_source:"live",_index:w})),...i.map(M=>({...M,_source:"history",_index:-1}))],l=M=>new Date(M.respondedAt||M.taggedAt||M.date||0).getTime()||0,d=M=>String(M||"").trim().toLowerCase(),p=['<option value="all">All Sources</option>',...Array.from(new Set(r.map(M=>da(M)))).filter(Boolean).sort((M,w)=>M.localeCompare(w)).map(M=>`<option value="${V(M.toLowerCase())}">${V(M)}</option>`)].join(""),u={search:"",status:"all",source:"all",sort:"newest"},m=M=>{const w=_a(M),y=w==="pending"&&M._source==="live",k=da(M),P=M.taggedByName||"System",R=M.title||`${k} from ${P}`,C=An(M),B=ce(String(M.id||"")),O={pending:{bg:"#fff7ed",border:"#fdba74",badge:"#f97316"},accepted:{bg:"#f0fdf4",border:"#86efac",badge:"#16a34a"},rejected:{bg:"#fef2f2",border:"#fca5a5",badge:"#dc2626"},default:{bg:"#f8fafc",border:"#e2e8f0",badge:"#6b7280"}},F=O[w]||O.default,U=y&&sr(M)||o&&M.type==="minute-access-request"?`
            <div class="notif-drawer-actions">
                <button type="button" class="notif-drawer-btn approve" onclick="window.app_respondNotificationFromHistory(${Number(M._index)}, '${B}', 'approve')">
                    <i class="fa-solid fa-check"></i> Approve
                </button>
                <button type="button" class="notif-drawer-btn reject" onclick="window.app_respondNotificationFromHistory(${Number(M._index)}, '${B}', 'reject')">
                    <i class="fa-solid fa-xmark"></i> Reject
                </button>
            </div>`:"";return`
            <div class="notif-drawer-item ${y?"is-pending":""}" style="border-color:${F.border}; background:${F.bg};" data-notif-id="${V(String(M.id||""))}">
                <div class="notif-drawer-item-head">
                    <div class="notif-drawer-item-left">
                        <div class="notif-drawer-source-icon">
                            <i class="fa-solid ${M.type==="tag"||M.type==="mention"?"fa-at":M.type==="birthday-reminder"?"fa-cake-candles":M.type==="task"?"fa-list-check":M.type==="minute-access-request"?"fa-file-lines":String(M.type||"").includes("missed-checkout")?"fa-user-clock":"fa-bell"}"></i>
                        </div>
                        <div>
                            <div class="notif-drawer-title">${V(R)}</div>
                            <div class="notif-drawer-meta">${V(k)} • ${V(P)} • ${V(ir(M))}</div>
                        </div>
                    </div>
                    <div class="notif-drawer-item-right">
                        <span class="notif-drawer-badge" style="background:${F.badge}">${V(w)}</span>
                    </div>
                </div>
                ${C?`<div class="notif-drawer-text">${V(C)}</div>`:""}
                ${U}
            </div>`},h=()=>{const M=r.filter(w=>{const y=_a(w),k=da(w),P=w.taggedByName||"System",R=w.title||`${k} from ${P}`,C=An(w),B=`${R} ${C} ${k} ${P} ${y}`;return!(u.status!=="all"&&y!==u.status||u.source!=="all"&&d(k)!==u.source||u.search&&!d(B).includes(u.search))});return u.sort==="oldest"?M.sort((w,y)=>l(w)-l(y)):u.sort==="pending"?M.sort((w,y)=>{const k=ct(w)?1:0,P=ct(y)?1:0;return k!==P?P-k:l(y)-l(w)}):M.sort((w,y)=>l(y)-l(w)),M},f=s.filter(ct).length,g=`
        <div class="notif-drawer-backdrop" id="notif-drawer-backdrop" onclick="window.app_closeNotificationHistory()"></div>
        <div class="notif-drawer" id="notification-history-modal">
            <div class="notif-drawer-header">
                <div class="notif-drawer-header-left">
                    <i class="fa-solid fa-bell notif-drawer-header-icon"></i>
                    <div>
                        <div class="notif-drawer-header-title">Notifications</div>
                        <div class="notif-drawer-header-sub">${f>0?`${f} pending action${f>1?"s":""}`:"All caught up"}</div>
                    </div>
                </div>
            </div>
            <div class="notif-drawer-tools">
                <div class="notif-drawer-search-wrap">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="search" id="notif-drawer-search" class="notif-drawer-search-input" placeholder="Search title, sender, message">
                </div>
                <div class="notif-drawer-controls">
                    <div class="notif-drawer-status-tabs" id="notif-drawer-status-tabs">
                        <button type="button" class="notif-drawer-status-tab is-active" data-notif-status="all">All</button>
                        <button type="button" class="notif-drawer-status-tab" data-notif-status="pending">Pending</button>
                        <button type="button" class="notif-drawer-status-tab" data-notif-status="accepted">Accepted</button>
                        <button type="button" class="notif-drawer-status-tab" data-notif-status="rejected">Rejected</button>
                    </div>
                    <div class="notif-drawer-selects">
                        <select id="notif-drawer-source">${p}</select>
                        <select id="notif-drawer-sort">
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="pending">Pending First</option>
                        </select>
                    </div>
                </div>
                <div class="notif-drawer-results" id="notif-drawer-results"></div>
            </div>
            <div class="notif-drawer-list" id="notif-drawer-list"></div>
        </div>`,S=document.createElement("div");S.id="notif-drawer-root",S.innerHTML=g,document.body.appendChild(S),requestAnimationFrame(()=>{const M=document.getElementById("notification-history-modal");M&&M.classList.add("notif-drawer-open");const w=document.getElementById("notif-drawer-backdrop");w&&w.classList.add("notif-drawer-backdrop-visible")});const A=document.getElementById("notif-drawer-list"),b=document.getElementById("notif-drawer-results"),x=document.getElementById("notif-drawer-search"),D=document.getElementById("notif-drawer-source"),T=document.getElementById("notif-drawer-sort"),_=document.getElementById("notif-drawer-status-tabs"),E=()=>{if(!A)return;const M=h();A.innerHTML=M.length?M.map(m).join(""):'<div class="notif-drawer-empty"><i class="fa-regular fa-bell-slash"></i><p>No notifications match your search/filter.</p></div>',b&&(b.textContent=`Showing ${M.length} of ${r.length}`)};x?.addEventListener("input",M=>{u.search=d(M.target.value),E()}),D?.addEventListener("change",M=>{u.source=d(M.target.value)||"all",E()}),T?.addEventListener("change",M=>{u.sort=d(M.target.value)||"newest",E()}),_?.addEventListener("click",M=>{const w=M.target.closest("[data-notif-status]");w&&(u.status=d(w.getAttribute("data-notif-status"))||"all",_.querySelectorAll(".notif-drawer-status-tab").forEach(y=>y.classList.remove("is-active")),w.classList.add("is-active"),E())}),E(),await window.app_refreshNotificationBell()};window.app_openBirthdayEditor=async a=>{const e=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(e)){alert("You do not have permission to manage birthdays.");return}const t=await window.AppDB.get("users",a);if(!t){alert("Staff member not found.");return}const n=`
        <div class="modal-overlay" id="birthday-details-modal" style="display:flex;">
            <div class="modal-content" style="max-width:560px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1rem;">
                    <div>
                        <div style="font-size:0.78rem; font-weight:800; color:#9a3412; text-transform:uppercase; letter-spacing:0.08em;">Birthday Details</div>
                        <h3 style="margin:0.35rem 0 0.2rem 0;">${V(t.name||"Staff")}</h3>
                        <div style="font-size:0.84rem; color:#64748b;">${V(t.role||"Employee")} • ${V(t.dept||"General")}</div>
                    </div>
                    <button type="button" onclick="document.getElementById('birthday-details-modal')?.remove()" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">&times;</button>
                </div>
                <form id="birthday-details-form">
                    <input type="hidden" name="userId" value="${V(t.id)}">
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem;">
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Day</span>
                            <input type="number" name="birthDay" min="1" max="31" placeholder="DD" value="${V(t.birthDay||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Month</span>
                            <input type="number" name="birthMonth" min="1" max="12" placeholder="MM" value="${V(t.birthMonth||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Year</span>
                            <input type="number" name="birthYear" min="1900" max="2100" placeholder="YYYY" value="${V(t.birthYear||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                    </div>
                    <div style="margin-top:0.65rem; font-size:0.8rem; color:#64748b;">Save one field, two fields, or all three. Reminders need day and month.</div>
                    <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.2rem;">
                        <button type="button" class="action-btn secondary" onclick="document.getElementById('birthday-details-modal')?.remove()">Cancel</button>
                        <button type="submit" class="action-btn">Save Birthday</button>
                    </div>
                </form>
            </div>
        </div>`;window.app_showModal(n,"birthday-details-modal")};window.app_submitBirthdayDetails=async a=>{a.preventDefault();const e=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(e)){alert("You do not have permission to manage birthdays.");return}const t=new FormData(a.target),n=String(t.get("userId")||"").trim();if(!n){alert("Missing staff record.");return}try{const s=Xe(t),i=await window.AppDB.get("users",n);if(!i)throw new Error("Staff member not found.");if(!await window.AppAuth.updateUser({id:n,birthDay:s.birthDay,birthMonth:s.birthMonth,birthYear:s.birthYear}))throw new Error("Unable to save birthday details.");if(document.getElementById("birthday-details-modal")?.remove(),window.app_showSyncToast(`Birthday details saved for ${i.name||"staff member"}.`),(window.location.hash.slice(1)||"dashboard")==="birthday-calendar"){const r=document.getElementById("page-content");r&&(r.innerHTML=await K.renderBirthdayCalendar())}else window.app_refreshAdminPage&&await window.app_refreshAdminPage()}catch(s){alert(`Failed to save birthday details: ${s.message}`)}};window.app_submitBirthdayMonthForm=async(a,e)=>{a.preventDefault();const t=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(t)){alert("You do not have permission to manage birthdays.");return}const n=Number(e||0);if(!n||n<1||n>12){alert("Invalid birthday month.");return}const s=new FormData(a.target),i=String(s.get("userId")||"").trim();if(!i){alert("Please select a staff member.");return}try{const o=Xe(s),r=await window.AppDB.get("users",i);if(!r)throw new Error("Staff member not found.");const l={id:i,birthMonth:n,birthDay:o.birthDay,birthYear:o.birthYear};if(!await window.AppAuth.updateUser(l))throw new Error("Unable to save birthday details.");a.target.reset();const c=document.getElementById("page-content");c&&(c.innerHTML=await K.renderBirthdayCalendar()),window.app_showSyncToast(`Birthday updated for ${r.name||"staff member"}.`)}catch(o){alert(`Failed to save birthday details: ${o.message}`)}};window.app_syncBirthdayReminders=async()=>{const a=window.AppAuth?.getUser?.();if(!window.app_canManageBirthdays(a))return;const e=Dt();e.setHours(0,0,0,0);const t=$e(e),n=`birthday_sync_${String(a?.id||"unknown")}`;if(window._birthdaySyncDoneForKey===n&&window._birthdaySyncDayKey===t)return;try{if(localStorage.getItem(n)===t){window._birthdaySyncDoneForKey=n,window._birthdaySyncDayKey=t;return}}catch{}const s=await window.AppDB.getAll("users").catch(()=>[]);if(!Array.isArray(s)||!s.length)return;const i=s.filter(r=>window.app_canManageBirthdays(r));if(!i.length)return;let o=Array.isArray(a?.notifications)?[...a.notifications]:[];for(const r of s){const l=Ss(r,e);if(!l)continue;const d=ks(l),c=$e(d);if(c!==t)continue;const p=$e(l),u=As(l,d),m=`Upcoming Staff Birthday: ${r.name||"Staff"}`,h=`${r.name||"Staff"} has a birthday on ${Ft(r.birthDay,r.birthMonth)}.`;for(const f of i){const g=Array.isArray(f.notifications)?[...f.notifications]:[];g.some(A=>A?.type==="birthday-reminder"&&String(A.birthdayStaffId||"")===String(r.id||"")&&String(A.birthdayDate||"")===p&&String(A.reminderDate||"")===c)||(g.unshift({id:`birthday_${p}_${r.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"birthday-reminder",title:m,message:h,description:`${u}. ${r.role||"Employee"} • ${r.dept||"General"}`,status:"pending",date:new Date().toISOString(),read:!1,taggedByName:"Birthday Calendar",birthdayStaffId:r.id,birthdayStaffName:r.name||"Staff",birthdayDate:p,reminderDate:c,birthdayDisplay:Ft(r.birthDay,r.birthMonth,r.birthYear),birthdayReason:u,role:r.role||"",dept:r.dept||""}),await window.AppDB.put("users",{...f,notifications:g}),a&&String(a.id)===String(f.id)&&(o=g))}}a&&Array.isArray(o)&&(a.notifications=o),window._birthdaySyncDoneForKey=n,window._birthdaySyncDayKey=t;try{localStorage.setItem(n,t)}catch{}};window.app_dismissBirthdayPopup=async({openCalendar:a=!1}={})=>{const e=window.AppAuth?.getUser?.();if(!e)return;const t=await window.AppDB.get("users",e.id).catch(()=>e);if(!t||!Array.isArray(t.notifications))return;let n=!1;t.notifications=t.notifications.map(s=>s?.type==="birthday-reminder"&&s?.read!==!0?(n=!0,{...s,read:!0,status:"seen",dismissedAt:new Date().toISOString()}):s),n&&await window.AppAuth.updateUser(t),document.getElementById("birthday-reminder-modal")?.remove(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell(),a&&(window.location.hash="birthday-calendar")};window.app_maybeOpenBirthdayPopup=async()=>{const a=window.AppAuth?.getUser?.();if(!window.app_canManageBirthdays(a)||document.getElementById("birthday-reminder-modal"))return;const e=await window.AppDB.get("users",a.id).catch(()=>a),t=Array.isArray(e?.notifications)?e.notifications.filter(i=>i?.type==="birthday-reminder"&&i?.read!==!0):[];if(!t.length)return;const s=`
        <div class="modal-overlay" id="birthday-reminder-modal" style="display:flex;">
            <div class="modal-content" style="max-width:720px; border-radius:22px; padding:0; overflow:hidden;">
                <div style="padding:1.35rem 1.4rem; background:linear-gradient(135deg, #9a3412, #f97316); color:#fff;">
                    <div style="display:flex; justify-content:space-between; gap:1rem; align-items:flex-start;">
                        <div>
                            <div style="font-size:0.78rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; opacity:0.9;">Birthday Reminder</div>
                            <h3 style="margin:0.35rem 0 0.2rem 0;">Staff birthdays are coming up</h3>
                            <p style="margin:0; opacity:0.92;">Review the upcoming birthdays and update any missing details before the next working day.</p>
                        </div>
                        <button type="button" onclick="window.app_dismissBirthdayPopup()" style="background:none; border:none; color:#fff; font-size:1.3rem; cursor:pointer;">&times;</button>
                    </div>
                </div>
                <div style="padding:1.2rem 1.4rem; display:flex; flex-direction:column; gap:0.85rem; max-height:60vh; overflow:auto;">
                    ${t.map(i=>`
        <div style="border:1px solid #fed7aa; background:linear-gradient(135deg, #fff7ed, #fffbeb); border-radius:16px; padding:1rem;">
            <div style="display:flex; justify-content:space-between; gap:0.75rem; align-items:flex-start;">
                <div>
                    <div style="font-size:0.78rem; font-weight:800; color:#9a3412; text-transform:uppercase; letter-spacing:0.08em;">Upcoming Staff Birthday</div>
                    <h4 style="margin:0.35rem 0 0.2rem 0; color:#7c2d12;">${V(i.birthdayStaffName||"Staff")}</h4>
                    <div style="font-size:0.84rem; color:#9a3412;">${V(i.birthdayDisplay||i.birthdayDate||"")}</div>
                    <div style="font-size:0.8rem; color:#7c2d12; margin-top:0.35rem;">${V(i.birthdayReason||"Upcoming birthday")}</div>
                    <div style="font-size:0.8rem; color:#92400e; margin-top:0.25rem;">${V(i.role||"Employee")} • ${V(i.dept||"General")}</div>
                </div>
                <button type="button" class="action-btn secondary" style="padding:0.45rem 0.7rem;" onclick="window.app_openBirthdayEditor('${V(i.birthdayStaffId||"")}')">Edit Birthday Details</button>
            </div>
        </div>
    `).join("")}
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.75rem; padding:1rem 1.4rem 1.3rem; border-top:1px solid #e5e7eb; background:#fff;">
                    <button type="button" class="action-btn secondary" onclick="window.app_dismissBirthdayPopup()">Dismiss</button>
                    <button type="button" class="action-btn" onclick="window.app_dismissBirthdayPopup({ openCalendar: true })">View Birthday Calendar</button>
                </div>
            </div>
        </div>`;window.app_showModal(s,"birthday-reminder-modal")};window.app_openBirthdayEditor=async(a,e)=>{const t=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(t)){alert("You do not have permission to manage birthdays.");return}const n=e?a:"user",s=e||a,i=Vt(n),o=await window.AppDB.get(i.collection,s);if(!o){alert(i.emptyMessage);return}const r=fr(o,i.source),l=i.source==="external"?`
                    <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.75rem; margin-bottom:0.75rem;">
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Name</span>
                            <input type="text" name="name" value="${V(o.name||"")}" placeholder="Full name" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Position</span>
                            <input type="text" name="position" value="${V(o.position||"")}" placeholder="President / Trustee / etc." style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                    </div>
                    <label style="display:block; margin-bottom:0.75rem;">
                        <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Location</span>
                        <input type="text" name="location" value="${V(o.location||"")}" placeholder="City / Office / Campus" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                    </label>
    `:"",d=`
        <div class="modal-overlay" id="birthday-details-modal" style="display:flex;">
            <div class="modal-content" style="max-width:560px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1rem;">
                    <div>
                        <div style="font-size:0.78rem; font-weight:800; color:#9a3412; text-transform:uppercase; letter-spacing:0.08em;">Birthday Details</div>
                        <h3 style="margin:0.35rem 0 0.2rem 0;">${V(r.title)}</h3>
                        <div style="font-size:0.84rem; color:#64748b;">${V(r.subtitle)}</div>
                    </div>
                    <button type="button" onclick="document.getElementById('birthday-details-modal')?.remove()" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">&times;</button>
                </div>
                <form id="birthday-details-form">
                    <input type="hidden" name="birthdaySource" value="${V(i.source)}">
                    <input type="hidden" name="recordId" value="${V(o.id)}">
                    ${l}
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem;">
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Day</span>
                            <input type="number" name="birthDay" min="1" max="31" placeholder="DD" value="${V(o.birthDay||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Month</span>
                            <input type="number" name="birthMonth" min="1" max="12" placeholder="MM" value="${V(o.birthMonth||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Year</span>
                            <input type="number" name="birthYear" min="1900" max="2100" placeholder="YYYY" value="${V(o.birthYear||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                    </div>
                    <div style="margin-top:0.65rem; font-size:0.8rem; color:#64748b;">Save one field, two fields, or all three. Reminders need day and month.</div>
                    <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.2rem;">
                        <button type="button" class="action-btn secondary" onclick="document.getElementById('birthday-details-modal')?.remove()">Cancel</button>
                        <button type="submit" class="action-btn">Save Birthday</button>
                    </div>
                </form>
            </div>
        </div>`;window.app_showModal(d,"birthday-details-modal")};window.app_submitBirthdayDetails=async a=>{a.preventDefault();const e=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(e)){alert("You do not have permission to manage birthdays.");return}const t=new FormData(a.target),n=String(t.get("birthdaySource")||"user").trim().toLowerCase(),s=String(t.get("recordId")||"").trim(),i=Vt(n);if(!s){alert(`Missing ${i.label.toLowerCase()} record.`);return}try{const o=Xe(t),r=await window.AppDB.get(i.collection,s);if(!r)throw new Error(i.emptyMessage);if(i.source==="external"){const l=String(t.get("name")||"").trim();if(!l)throw new Error("Name is required.");await window.AppDB.put(i.collection,{...r,name:l,position:String(t.get("position")||"").trim(),location:String(t.get("location")||"").trim(),birthDay:o.birthDay,birthMonth:o.birthMonth,birthYear:o.birthYear,updatedAt:new Date().toISOString(),updatedById:e?.id||""})}else if(!await window.AppAuth.updateUser({id:s,birthDay:o.birthDay,birthMonth:o.birthMonth,birthYear:o.birthYear}))throw new Error("Unable to save birthday details.");if(document.getElementById("birthday-details-modal")?.remove(),window.app_showSyncToast(`Birthday details saved for ${r.name||i.label.toLowerCase()}.`),(window.location.hash.slice(1)||"dashboard")==="birthday-calendar"){const l=document.getElementById("page-content");l&&(l.innerHTML=await K.renderBirthdayCalendar())}else window.app_refreshAdminPage&&await window.app_refreshAdminPage()}catch(o){alert(`Failed to save birthday details: ${o.message}`)}};window.app_openExternalBirthdayPersonModal=async(a="")=>{const e=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(e)){alert("You do not have permission to manage birthdays.");return}const t=`
        <div class="modal-overlay" id="birthday-external-modal" style="display:flex;">
            <div class="modal-content" style="max-width:620px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1rem;">
                    <div>
                        <div style="font-size:0.78rem; font-weight:800; color:#9a3412; text-transform:uppercase; letter-spacing:0.08em;">Person Not In System</div>
                        <h3 style="margin:0.35rem 0 0.2rem 0;">Add Birthday Person</h3>
                        <div style="font-size:0.84rem; color:#64748b;">Save birthdays for trustees, president, or any other person who is not a staff account.</div>
                    </div>
                    <button type="button" onclick="document.getElementById('birthday-external-modal')?.remove()" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">&times;</button>
                </div>
                <form id="birthday-external-form">
                    <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.75rem; margin-bottom:0.75rem;">
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Name</span>
                            <input type="text" name="name" required placeholder="Full name" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Position</span>
                            <input type="text" name="position" placeholder="President / Trustee / etc." style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                    </div>
                    <label style="display:block; margin-bottom:0.75rem;">
                        <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Location</span>
                        <input type="text" name="location" placeholder="City / Office / Campus" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                    </label>
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem;">
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Day</span>
                            <input type="number" name="birthDay" min="1" max="31" placeholder="DD" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Month</span>
                            <input type="number" name="birthMonth" min="1" max="12" placeholder="MM" value="${V(a||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Year</span>
                            <input type="number" name="birthYear" min="1900" max="2100" placeholder="YYYY" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                    </div>
                    <div style="margin-top:0.65rem; font-size:0.8rem; color:#64748b;">Name is required. Day, month, and year can be saved separately.</div>
                    <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.2rem;">
                        <button type="button" class="action-btn secondary" onclick="document.getElementById('birthday-external-modal')?.remove()">Cancel</button>
                        <button type="submit" class="action-btn">Save Person</button>
                    </div>
                </form>
            </div>
        </div>`;window.app_showModal(t,"birthday-external-modal")};window.app_submitExternalBirthdayPerson=async a=>{a.preventDefault();const e=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(e)){alert("You do not have permission to manage birthdays.");return}const t=new FormData(a.target),n=String(t.get("name")||"").trim();if(!n){alert("Please enter a name.");return}try{const s=Xe(t),i={id:`birthday_person_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,name:n,position:String(t.get("position")||"").trim(),location:String(t.get("location")||"").trim(),birthDay:s.birthDay,birthMonth:s.birthMonth,birthYear:s.birthYear,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),createdById:e?.id||"",updatedById:e?.id||""};await window.AppDB.put("birthday_people",i),document.getElementById("birthday-external-modal")?.remove();const o=document.getElementById("page-content");o&&(window.location.hash.slice(1)||"dashboard")==="birthday-calendar"&&(o.innerHTML=await K.renderBirthdayCalendar()),window.app_showSyncToast(`Birthday person saved for ${n}.`)}catch(s){alert(`Failed to save birthday person: ${s.message}`)}};window.app_refreshBirthdayCalendar=async()=>{if((window.location.hash.slice(1)||"dashboard")!=="birthday-calendar")return;const a=document.getElementById("page-content");a&&(a.innerHTML=await K.renderBirthdayCalendar())};window.app_setBirthdayCalendarView=async a=>{const e=window.app_birthdayCalendarState||{};window.app_birthdayCalendarState={...e,view:String(a||"month").toLowerCase()==="year"?"year":"month"},await window.app_refreshBirthdayCalendar()};window.app_goToBirthdayCalendarMonth=async(a,e=null)=>{const t=Number(a||0);if(!t||t<1||t>12)return;const n=Dt(),s=window.app_birthdayCalendarState||{};window.app_birthdayCalendarState={...s,selectedMonth:t,selectedYear:Number(e||s.selectedYear||n.getFullYear()),view:"month"},await window.app_refreshBirthdayCalendar()};window.app_changeBirthdayCalendarMonth=async a=>{const e=Number(a||0);if(!e)return;const t=Dt(),n=window.app_birthdayCalendarState||{},s=Number(n.selectedMonth||t.getMonth()+1),i=Number(n.selectedYear||t.getFullYear()),o=new Date(i,s-1+e,1);window.app_birthdayCalendarState={...n,selectedMonth:o.getMonth()+1,selectedYear:o.getFullYear(),view:"month"},await window.app_refreshBirthdayCalendar()};window.app_syncBirthdayReminders=async()=>{const a=window.AppAuth?.getUser?.();if(!window.app_canManageBirthdays(a))return;const[e,t]=await Promise.all([window.AppDB.getAll("users").catch(()=>[]),window.AppDB.getAll("birthday_people",{silentPermissionDenied:!0}).catch(()=>[])]),n=[...Array.isArray(e)?e.map(l=>({...l,birthdaySource:"user"})):[],...Array.isArray(t)?t.map(l=>({...l,birthdaySource:"external"})):[]];if(!n.length)return;const s=Dt();s.setHours(0,0,0,0);const i=$e(s),o=e.filter(l=>window.app_canManageBirthdays(l));if(!o.length)return;let r=Array.isArray(a?.notifications)?[...a.notifications]:[];for(const l of n){const d=Ss(l,s);if(!d)continue;const c=ks(d),p=$e(c);if(p!==i)continue;const u=$e(d);for(const m of o){const h=Array.isArray(m.notifications)?[...m.notifications]:[];h.some(g=>g?.type==="birthday-reminder"&&String(g.birthdayStaffId||"")===String(l.id||"")&&String(g.birthdaySource||"user")===String(l.birthdaySource||"user")&&String(g.birthdayDate||"")===u&&String(g.reminderDate||"")===p)||(h.unshift(hr(l,l.birthdaySource||"user",d,c)),await window.AppDB.put("users",{...m,notifications:h}),a&&String(a.id)===String(m.id)&&(r=h))}}a&&Array.isArray(r)&&(a.notifications=r)};window.app_maybeOpenBirthdayPopup=async()=>{const a=window.AppAuth?.getUser?.();if(!window.app_canManageBirthdays(a)||document.getElementById("birthday-reminder-modal"))return;const e=await window.AppDB.get("users",a.id).catch(()=>a),t=Array.isArray(e?.notifications)?e.notifications.filter(i=>i?.type==="birthday-reminder"&&i?.read!==!0):[];if(!t.length)return;const s=`
        <div class="modal-overlay" id="birthday-reminder-modal" style="display:flex;">
            <div class="modal-content" style="max-width:720px; border-radius:22px; padding:0; overflow:hidden;">
                <div style="padding:1.35rem 1.4rem; background:linear-gradient(135deg, #9a3412, #f97316); color:#fff;">
                    <div style="display:flex; justify-content:space-between; gap:1rem; align-items:flex-start;">
                        <div>
                            <div style="font-size:0.78rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; opacity:0.9;">Birthday Reminder</div>
                            <h3 style="margin:0.35rem 0 0.2rem 0;">Birthdays are coming up</h3>
                            <p style="margin:0; opacity:0.92;">Review the upcoming birthdays and update any missing details before the next working day.</p>
                        </div>
                        <button type="button" onclick="window.app_dismissBirthdayPopup()" style="background:none; border:none; color:#fff; font-size:1.3rem; cursor:pointer;">&times;</button>
                    </div>
                </div>
                <div style="padding:1.2rem 1.4rem; display:flex; flex-direction:column; gap:0.85rem; max-height:60vh; overflow:auto;">
                    ${t.map(i=>`
        <div style="border:1px solid #fed7aa; background:linear-gradient(135deg, #fff7ed, #fffbeb); border-radius:16px; padding:1rem;">
            <div style="display:flex; justify-content:space-between; gap:0.75rem; align-items:flex-start;">
                <div>
                    <div style="font-size:0.78rem; font-weight:800; color:#9a3412; text-transform:uppercase; letter-spacing:0.08em;">Upcoming Birthday</div>
                    <h4 style="margin:0.35rem 0 0.2rem 0; color:#7c2d12;">${V(i.birthdayStaffName||"Staff")}</h4>
                    <div style="font-size:0.84rem; color:#9a3412;">${V(i.birthdayDisplay||i.birthdayDate||"")}</div>
                    <div style="font-size:0.8rem; color:#7c2d12; margin-top:0.35rem;">${V(i.birthdayReason||"Upcoming birthday")}</div>
                    <div style="font-size:0.8rem; color:#92400e; margin-top:0.25rem;">${V(i.role||"Employee")} • ${V(i.dept||"General")}</div>
                </div>
                <button type="button" class="action-btn secondary" style="padding:0.45rem 0.7rem;" onclick="window.app_openBirthdayEditor('${V(i.birthdaySource||"user")}', '${V(i.birthdayStaffId||"")}')">Edit Birthday Details</button>
            </div>
        </div>
    `).join("")}
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.75rem; padding:1rem 1.4rem 1.3rem; border-top:1px solid #e5e7eb; background:#fff;">
                    <button type="button" class="action-btn secondary" onclick="window.app_dismissBirthdayPopup()">Dismiss</button>
                    <button type="button" class="action-btn" onclick="window.app_dismissBirthdayPopup({ openCalendar: true })">View Birthday Calendar</button>
                </div>
            </div>
        </div>`;window.app_showModal(s,"birthday-reminder-modal")};window.app_systemDialog=function({title:a="Notice",message:e="",mode:t="alert",defaultValue:n="",confirmText:s="OK",cancelText:i="Cancel",placeholder:o=""}={}){return new Promise(r=>{const l=`system-dialog-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,d=`${l}-input`,c=t==="prompt",p=t==="confirm"||t==="prompt",u=`
                <div class="modal-overlay app-system-dialog-overlay" id="${l}" style="display:flex;">
                    <div class="modal-content app-system-dialog">
                        <div class="app-system-dialog-head">
                            <h3>${V(a)}</h3>
                            <button type="button" class="app-system-dialog-close" aria-label="Close dialog">&times;</button>
                        </div>
                        <div class="app-system-dialog-body">
                            <p>${nr(e)}</p>
                            ${c?`<input id="${d}" class="app-system-dialog-input" type="text" value="${V(n)}" placeholder="${V(o)}" autocomplete="off">`:""}
                        </div>
                        <div class="app-system-dialog-actions">
                            ${p?`<button type="button" class="action-btn secondary app-system-dialog-cancel">${V(i)}</button>`:""}
                            <button type="button" class="action-btn app-system-dialog-confirm">${V(s)}</button>
                        </div>
                    </div>
                </div>
            `;(document.body||document.getElementById("modal-container")).insertAdjacentHTML("beforeend",u);const m=document.getElementById(l);if(!m){r(c?null:!1);return}m.style.zIndex="20000";const h=m.querySelector(".app-system-dialog-confirm"),f=m.querySelector(".app-system-dialog-cancel"),g=m.querySelector(".app-system-dialog-close"),S=c?m.querySelector(`#${d}`):null,A=b=>{m.remove(),r(b)};h?.addEventListener("click",()=>{A(c?S?S.value:"":!0)}),f?.addEventListener("click",()=>A(c?null:!1)),g?.addEventListener("click",()=>A(c?null:!1)),m.addEventListener("click",b=>{b.target===m&&A(c?null:!1)}),m.addEventListener("keydown",b=>{b.key==="Escape"&&A(c?null:!1),b.key==="Enter"&&(b.preventDefault(),A(c?S?S.value:"":!0))}),S?(S.focus(),S.select()):h?.focus()})};window.appAlert=(a,e="Notice")=>window.app_systemDialog({title:e,message:a,mode:"alert",confirmText:"OK"});window.appConfirm=(a,e="Please Confirm")=>window.app_systemDialog({title:e,message:a,mode:"confirm",confirmText:"Confirm",cancelText:"Cancel"});window.appPrompt=(a,e="",t={})=>window.app_systemDialog({title:t.title||"Enter Details",message:a,mode:"prompt",defaultValue:e,confirmText:t.confirmText||"Save",cancelText:t.cancelText||"Cancel",placeholder:t.placeholder||""});window.app_requestMandatoryRejectionReason=async function({title:a="Reject Item",message:e="Please enter the rejection reason.",confirmText:t="Submit Reason"}={}){for(;;){const n=await window.appPrompt(e,"",{title:a,confirmText:t});if(n===null)return null;const s=String(n||"").trim();if(s)return s;await window.appAlert("A rejection reason is required to continue.","Reason Required")}};window.alert=a=>{window.appAlert(a)};window.app_canManageHolidays=(a=window.AppAuth?.getUser())=>a?!!(window.app_isAdminUser?.(a)||a.role==="Administrator"||window.app_canManageAttendanceSheet?.(a)):!1;window.app_openEventModal=()=>{const a=window.AppAuth?.getUser?.();if(!window.app_canManageHolidays(a)){alert("Only admin and attendance admin can add holidays.");return}window.app_showModal(`
            <div class="modal-overlay" id="event-modal" style="display:flex;">
                <div class="modal-content">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3 style="font-size: 1.1rem;">Add Shared Event</h3>
                        <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.1rem; cursor:pointer;">&times;</button>
                    </div>
                    <form onsubmit="window.app_submitEvent(event)">
                        <div style="display:flex; flex-direction:column; gap:0.75rem;">
                            <div>
                                <label style="display:block; font-size:0.8rem; margin-bottom:0.2rem;">Event Title</label>
                                <input type="text" id="event-title" required style="width:100%; padding:0.6rem; border:1px solid #ddd; border-radius:8px; font-size:0.9rem;">
                            </div>
                            <div>
                                <label style="display:block; font-size:0.8rem; margin-bottom:0.2rem;">Date</label>
                                <input type="date" id="event-date" required style="width:100%; padding:0.6rem; border:1px solid #ddd; border-radius:8px; font-size:0.9rem;">
                            </div>
                            <div>
                                <label style="display:block; font-size:0.8rem; margin-bottom:0.2rem;">Type</label>
                                <select id="event-type" style="width:100%; padding:0.6rem; border:1px solid #ddd; border-radius:8px; font-size:0.9rem;">
                                    <option value="holiday">Holiday</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="event">Other Event</option>
                                </select>
                            </div>
                            <button type="submit" class="action-btn" style="width:100%; margin-top:0.5rem; padding: 0.75rem;">Save Event</button>
                        </div>
                    </form>
                </div>
            </div>
        `,"event-modal")};window.app_submitEvent=async a=>{a.preventDefault();const e=window.AppAuth?.getUser?.();if(!window.app_canManageHolidays(e)){alert("Only admin and attendance admin can add holidays.");return}const t=document.getElementById("event-title").value,n=document.getElementById("event-date").value,s=document.getElementById("event-type").value;try{await window.AppCalendar.addEvent({title:t,date:n,type:s}),alert("Event added successfully!"),document.getElementById("event-modal")?.remove();const i=document.getElementById("page-content");i.innerHTML=await K.renderDashboard(),Ue()}catch(i){alert("Error: "+i.message)}};const Dn="work_plan_schema_v2_migrated",or=async()=>{try{if(!window.AppDB||typeof window.AppDB.getAll!="function"||typeof window.AppDB.put!="function"||localStorage.getItem(Dn)==="true")return;const a=await window.AppDB.getAll("work_plans");let e=0;for(const t of a){if(!t||Array.isArray(t.plans))continue;const n=typeof t.plan=="string"?t.plan.trim():"";if(!n)continue;const s={...t,plans:[{task:n,subPlans:Array.isArray(t.subPlans)?t.subPlans:[],tags:Array.isArray(t.tags)?t.tags:[],status:t.status||null,completedDate:t.completedDate||null,startDate:t.startDate||t.date,endDate:t.endDate||t.startDate||t.date}]};delete s.plan,delete s.subPlans,delete s.tags,delete s.status,delete s.completedDate,delete s.startDate,delete s.endDate,await window.AppDB.put("work_plans",s),e+=1}localStorage.setItem(Dn,"true"),e>0&&console.log(`Work plan schema migration complete. Updated: ${e}`)}catch(a){console.warn("Work plan schema migration failed:",a)}};async function rr(){window.app_initTheme(),Zo(),ar(),window.addEventListener("app:user-sync",er),window.addEventListener("app:update-available",ht),window.addEventListener("app:update-state",ht),document.addEventListener("visibilitychange",Vo),window.addEventListener("focus",bn),window.addEventListener("online",bn);try{await window.AppAuth.init();const e=window.AppAuth.getUser();e&&(ot=e.status||"out",ys(),hs()),Jo(),await or(),window.AppActivity&&window.AppActivity.initCommandListener()}catch(e){console.error("Initialization Failed:",e),ne&&(ne.innerHTML=`<div style="text-align:center; padding:2rem; color:red;">Failed to load application.<br><small>${e.message}</small></div>`)}document.addEventListener("click",e=>{e.target.id==="sidebar-toggle"||e.target.closest("#sidebar-toggle")?Da(!0):e.target.id==="sidebar-overlay"&&Da(!1)}),window.addEventListener("hashchange",xa),window.AppUI?.initDashboardSectionPage&&window.AppUI.initDashboardSectionPage(),xa();const a=window.AppAuth.getUser();a&&window.AppTour&&window.AppTour.init(a)}async function xa(){const a=window.AppAuth.getUser(),e=window.location.hash.slice(1)||"dashboard",t=e.startsWith("dashboard-section/"),n=t?e.split("/")[1]:"",s=t?"dashboard-section":e;if(s!=="admin"&&_e&&_e.length>0&&(console.log("Cleaning up Admin Realtime Listener."),_e.forEach(u=>typeof u=="function"&&u()),_e=[]),s!=="minutes"&&typeof Le=="function"&&(console.log("Cleaning up Minutes Realtime Listener."),Le(),Le=null),!a){Go(),Ko(),ja(!1),_t&&(_t.style.display="none"),$t&&($t.style.display="none"),xt&&(xt.style.display="none"),document.body.style.background="#f3f4f6",ne&&(ne.innerHTML=K.renderLogin()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell();return}ys(),hs(),Da(!1),_t&&(_t.style.display=""),$t&&($t.style.display=""),xt&&(xt.style.display="");const i=document.querySelector(".sidebar-footer .user-mini-profile");i&&(i.innerHTML=`
                <img src="${a.avatar||"https://ui-avatars.com/api/?name=User"}" alt="User">
                <div>
                    <p class="user-name">${a.name||"Staff Member"}</p>
                </div>
                <i class="fa-solid fa-gear user-settings-icon"></i>
            `);const o=window.app_hasPerm("attendance","view",a),r=window.app_hasPerm("reports","view",a),l=window.app_hasPerm("policies","view",a),d=window.app_canSeeAdminPanel(a),c=window.app_canManageBirthdays(a);document.querySelectorAll('a[data-page="admin"]').forEach(u=>{u.style.display=d?"flex":"none",d||u.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="master-sheet"]').forEach(u=>{u.style.display=o?"flex":"none",o||u.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="salary"]').forEach(u=>{u.style.display=r?"flex":"none",r||u.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="policy-test"]').forEach(u=>{u.style.display=l?"flex":"none",l||u.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="birthday-calendar"]').forEach(u=>{u.style.display=c?"flex":"none",c||u.style.setProperty("display","none","important")}),document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(u=>{const m=t&&u.dataset.page==="dashboard";u.dataset.page===s||m?u.classList.add("active"):u.classList.remove("active")});try{const u=document.getElementById("modal-container");if(u&&!document.getElementById("checkout-modal")&&u.insertAdjacentHTML("beforeend",K.renderModals()),ne&&(ne.innerHTML='<div class="loading-spinner"></div>'),s==="dashboard")ne.innerHTML=await K.renderDashboard(),Ue();else if(s==="dashboard-section")ne.innerHTML=await K.renderDashboardSectionPage(n||"worklog"),window.AppUI?.initDashboardSectionPage&&window.AppUI.initDashboardSectionPage(n||"worklog");else if(s==="team-activities")ne.innerHTML=await K.renderTeamActivitiesPage(),window.app_initTeamActivities&&await window.app_initTeamActivities();else if(s==="staff-directory")ne.innerHTML=await K.renderStaffDirectoryPage();else if(s==="policies")window.AppPolicies&&typeof window.AppPolicies.render=="function"?ne.innerHTML=await window.AppPolicies.render():ne.innerHTML='<div style="padding:1rem; color:#b91c1c;">Policies module failed to load.</div>';else if(s==="annual-plan")ne.innerHTML=await K.renderAnnualPlan();else if(s==="birthday-calendar"){if(!window.app_canManageBirthdays(a)){window.location.hash="dashboard";return}ne.innerHTML=await K.renderBirthdayCalendar()}else if(s==="timesheet")ne.innerHTML=await K.renderTimesheet();else if(s==="profile")ne.innerHTML=await K.renderProfile();else if(s==="salary"){if(!window.app_hasPerm("reports","view",a)){window.location.hash="dashboard";return}ne.innerHTML=await K.renderSalaryProcessing?await K.renderSalaryProcessing():await K.renderSalary()}else if(s==="policy-test"){if(!window.app_hasPerm("policies","view",a)){window.location.hash="dashboard";return}ne.innerHTML=await K.renderPolicyTest()}else if(s==="master-sheet"){if(!(window.app_hasPerm("attendance","view",a)||window.app_canManageAttendanceSheet(a))){window.location.hash="dashboard";return}ne.innerHTML=await K.renderMasterSheet()}else if(s==="minutes")ne.innerHTML=await K.renderMinutes(),lr();else if(s==="admin"){if(!window.app_canSeeAdminPanel(a)){window.location.hash="dashboard";return}ne.innerHTML=await K.renderAdmin(),window.AppAnalytics.initAdminCharts(),dr()}await window.app_syncBirthdayReminders?.(),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell(),await window.app_maybeOpenBirthdayPopup?.()}catch(u){console.error("Render Error:",u),ne.innerHTML=`<div style="text-align:center; color:red; padding:2rem;">Error loading page: ${u.message}</div>`}}function dr(){_e.forEach(s=>typeof s=="function"&&s()),_e=[],console.log("Starting Admin Realtime Listeners (Users & Audits)...");let a=null;const e=()=>{a&&clearTimeout(a),a=setTimeout(async()=>{a=null,await t()},600)},t=async()=>{if(window.location.hash.slice(1)!=="admin")return;if(document.querySelector('.modal-overlay[style*="display: flex"], .modal[style*="display: flex"]'))console.log("Admin Update received but skipped because a modal is open.");else{console.log("Admin Data Update Received (Realtime) - Refreshing UI");const o=document.getElementById("page-content");if(o){const r=document.getElementById("audit-start")?.value,l=document.getElementById("audit-end")?.value;o.innerHTML=await K.renderAdmin(r,l),window.AppAnalytics&&window.AppAnalytics.initAdminCharts()}}};if((N&&N.READ_OPT_FLAGS||{}).FF_READ_OPT_TARGETED_REALTIME&&window.AppDB.listenQuery){_e.push(window.AppDB.listenQuery("users",[{field:"status",operator:"in",value:["in","out"]}],{limit:300},e));const s=new Date;s.setDate(s.getDate()-2),_e.push(window.AppDB.listenQuery("location_audits",[{field:"timestamp",operator:">=",value:s.getTime()}],{orderBy:[{field:"timestamp",direction:"desc"}],limit:300},e))}else _e.push(window.AppDB.listen("users",e)),_e.push(window.AppDB.listen("location_audits",e))}function lr(){if(!window.AppDB||!window.AppDB.listen)return;typeof Le=="function"&&(Le(),Le=null);const a=async()=>{if((window.location.hash.slice(1)||"dashboard")!=="minutes"||document.getElementById("minute-detail-modal"))return;const n=document.getElementById("page-content");n&&(n.innerHTML=await K.renderMinutes())};(N&&N.READ_OPT_FLAGS||{}).FF_READ_OPT_TARGETED_REALTIME&&window.AppDB.listenQuery?Le=window.AppDB.listenQuery("minutes",[],{orderBy:[{field:"date",direction:"desc"}],limit:150},a):Le=window.AppDB.listen("minutes",a)}function cr(a=null,e=!1){ia&&clearInterval(ia),(async()=>{let n="out",s=null,i=!1,o=null,r=0;if(a)n=a.status||"out",s=a.lastCheckIn||null,i=a.isPaused===!0,o=a.pauseStartedAt||null,r=Number(a.totalPausedMs)||0;else{const f=await window.AppAttendance.getStatus();n=f.status,s=f.lastCheckIn,i=f.isPaused===!0,o=f.pauseStartedAt||null,r=Number(f.totalPausedMs)||0}const l=document.getElementById("timer-display"),d=document.getElementById("countdown-container"),c=document.getElementById("overtime-container"),p=document.getElementById("countdown-value"),u=document.getElementById("countdown-progress"),m=document.getElementById("overtime-value"),h=document.getElementById("timer-label");if(n==="in"&&s){const f=new Date(s),g=new Date,S=`${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,"0")}-${String(f.getDate()).padStart(2,"0")}`,A=`${g.getFullYear()}-${String(g.getMonth()+1).padStart(2,"0")}-${String(g.getDate()).padStart(2,"0")}`,b=S!==A,x=new Date(f);x.setHours(17,0,0,0);const D=f.getDay();D===6&&x.setHours(13,0,0,0),D===0&&x.setHours(17,0,0,0),ia=setInterval(()=>{const T=Date.now(),_=Number(o)||0,E=i&&_>0?Math.max(0,T-_):0,M=Math.max(0,T-s-r-E);if(l){let k=Math.floor(M/36e5),P=Math.floor(M/(1e3*60)%60),R=Math.floor(M/1e3%60);k=k<10?"0"+k:k,P=P<10?"0"+P:P,R=R<10?"0"+R:R,l.textContent=`${k} : ${P} : ${R}`}if(b){d&&(d.style.display="none"),c&&(c.style.display="none"),l&&(l.style.color="#b45309"),h&&(h.textContent="Session Carryover (Please Check Out)",h.style.color="#b45309");return}const w=Math.max(0,x.getTime()-s),y=w-M;if(y>0){d&&(d.style.display="block"),c&&(c.style.display="none"),h&&(h.textContent=i?"Paused":"Elapsed Time",h.style.color=i?"#b45309":"#6b7280"),l&&(l.style.color=i?"#b45309":"#1f2937");let k=Math.floor(y/(1e3*60*60)%24),P=Math.floor(y/(1e3*60)%60),R=Math.floor(y/1e3%60);k=k<10?"0"+k:k,P=P<10?"0"+P:P,R=R<10?"0"+R:R;const C=w>0?Math.min(100,M/w*100):100;p&&(p.textContent=`${k}:${P}:${R}`),u&&(u.style.width=`${C}%`),u&&(u.style.background=i?"#f59e0b":"var(--primary)")}else{d&&(d.style.display="none"),c&&(c.style.display="block");const k=Math.abs(y);let P=Math.floor(k/(1e3*60*60)),R=Math.floor(k/(1e3*60)%60),C=Math.floor(k/1e3%60);P=P<10?"0"+P:P,R=R<10?"0"+R:R,C=C<10?"0"+C:C,m&&(m.textContent=`+ ${P}:${R}:${C}`),l&&(l.style.color=i?"#b45309":"#c2410c"),h&&(h.textContent=i?"Paused (Overtime)":"Total Elapsed (Overtime)",h.style.color=i?"#b45309":"#c2410c")}},1e3),!e&&window.AppActivity&&(i&&window.AppActivity.stop?window.AppActivity.stop():!i&&window.AppActivity.start&&window.AppActivity.start())}else l&&(l.textContent="00 : 00 : 00",l.style.color=""),h&&(h.textContent="Elapsed Time",h.style.color=""),d&&(d.style.display="none"),c&&(c.style.display="none"),!e&&window.AppActivity&&window.AppActivity.stop&&window.AppActivity.stop()})()}window.getLocation=function(e={}){return new Promise((t,n)=>{(async()=>{const s=e&&e.forceFresh===!0,i=!(e&&e.allowStaleFallback===!1),o=window.location&&window.location.hostname?window.location.hostname:"",r=o==="localhost"||o==="127.0.0.1"||o==="::1";if(!window.isSecureContext&&!r){n("Location requires HTTPS on mobile. Open this app using an HTTPS URL and allow location access.");return}const l=Date.now();if(!s&&ze&&l-et<zo){console.log("Using cached location (freshness: "+(l-et)+"ms)"),t(ze);return}if(!navigator.geolocation){n("Geolocation is not supported by your browser.");return}try{if(navigator.permissions&&navigator.permissions.query){const c=await navigator.permissions.query({name:"geolocation"});if(c&&c.state==="denied"){n("Location permission is blocked. Enable location for this site in browser settings and try again.");return}}}catch{}const d=c=>new Promise((p,u)=>{navigator.geolocation.getCurrentPosition(p,u,c)});try{console.log("Requesting Location: Quick/Low Accuracy...");const c=await d({enableHighAccuracy:!1,timeout:5e3,maximumAge:s?0:12e4}),p={lat:c.coords.latitude,lng:c.coords.longitude};ze=p,et=Date.now(),t(p);return}catch(c){console.warn("Quick location attempt failed:",c.message)}try{console.log("Requesting Location: High Accuracy (GPS fallback)...");const c=await d({enableHighAccuracy:!0,timeout:8e3,maximumAge:s?0:1e4}),p={lat:c.coords.latitude,lng:c.coords.longitude};ze=p,et=Date.now(),t(p);return}catch(c){console.warn("High accuracy fallback failed:",c.message)}if(i&&ze&&Date.now()-et<jo){console.warn("Using stale cached location fallback."),t(ze);return}n("Location request timed out. Move to open sky or better network and try again.")})().catch(s=>{n(s&&s.message?s.message:"Unable to retrieve location.")})})};const pr=a=>{const e=Number(a?.lat),t=Number(a?.lng);return Number.isFinite(e)&&Number.isFinite(t)};async function pt(){const a=await window.getLocation({forceFresh:!0,allowStaleFallback:!1});if(!pr(a))throw new Error("Location capture returned invalid coordinates. Please enable location and try again.");return{lat:Number(a.lat),lng:Number(a.lng)}}const ge=a=>/^\d{4}-\d{2}-\d{2}$/.test(String(a||"")),ur={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11},mr=(a="")=>{const e=String(a||"").trim();if(!e)return null;const t=e.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);if(!t)return null;const n=Number(t[1]),s=Number(t[2]),i=String(t[3]||"").toLowerCase(),o=Number(t[4]),r=ur[i];if(!Number.isInteger(n)||!Number.isInteger(s)||!Number.isInteger(r)||!Number.isInteger(o))return null;const l=new Date(o,r,n),d=new Date(o,r,s);if(Number.isNaN(l.getTime())||Number.isNaN(d.getTime()))return null;const c=`${l.getFullYear()}-${String(l.getMonth()+1).padStart(2,"0")}-${String(l.getDate()).padStart(2,"0")}`,p=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;return p<c?null:{startDate:c,endDate:p}},gs=(a,e,t=null)=>{const n=ge(e)?String(e):null,s=a?.startDate,i=a?.endDate,o=!ge(s)&&!ge(i)?mr(a?.task||""):null;let r=ge(s)?String(s):o?.startDate||n,l=ge(i)?String(i):o?.endDate||r||n;if((!ge(s)||!ge(i))&&a?.sourcePlanId&&t?.workPlans){const d=(t.workPlans||[]).find(u=>u.id===a.sourcePlanId),c=Number.isInteger(a.sourceTaskIndex)?a.sourceTaskIndex:Number(a.sourceTaskIndex),p=d&&Array.isArray(d.plans)&&Number.isInteger(c)?d.plans[c]:null;if(p){const u=ge(p.startDate)?p.startDate:d.date||r,m=ge(p.endDate)?p.endDate:p.startDate||d.date||l;ge(s)||(r=u),ge(i)||(l=m)}}return r&&l&&l<r?{startDate:r,endDate:r}:{startDate:r,endDate:l}},bs=(a,e,t,n=null)=>{const{startDate:s,endDate:i}=gs(a,e,n);return!s||!i?e===t:!(t<s||t>i||a?.completedDate&&a.completedDate<t)};window.app_getDayEvents=(a,e,t={})=>{const n=t.includeAuto!==!1,s=t.dedupe!==!1,i=t.userId||null;if(!e)return[];if(Array.isArray(e))return e.filter(d=>d.date===a);const o=new Date(a),r=[];if(n&&window.AppAnalytics){const d=window.AppAnalytics.getDayType(o);d==="Holiday"?r.push({title:"Company Holiday (Weekend)",type:"holiday",date:a}):d==="Half Day"&&r.push({title:"Half Working Day (Sat)",type:"event",date:a})}if((e.leaves||[]).forEach(d=>{a>=d.startDate&&a<=d.endDate&&r.push({title:`${d.userName||"Staff"} (Leave)`,type:"leave",userId:d.userId,date:a})}),(e.events||[]).forEach(d=>{d.date===a&&r.push({title:d.title,type:d.type||"event",date:a})}),(e.workPlans||[]).forEach(d=>{if(d.date>a)return;const p=(Array.isArray(d.plans)?d.plans:[]).filter(f=>bs(f,d.date,a,e));if(!p.length)return;const h=`${(d.planScope||"personal")==="annual"?"All Staff (Annual)":d.userName||"Staff"}: ${p.map(f=>f.task).join("; ")}`;r.push({title:h,type:"work",userId:d.userId,plans:p,date:a,planScope:d.planScope||"personal"})}),i){const d=[];r.forEach(c=>{if(c.type!=="work"){d.push(c);return}if((c.planScope||"").toLowerCase()==="annual"){d.push(c);return}if(c.userId===i){d.push(c);return}if(Array.isArray(c.plans)&&c.plans.some(u=>Array.isArray(u.tags)&&u.tags.some(m=>m.id===i&&m.status==="accepted"))){d.push(c);return}}),r.length=0,r.push(...d)}if(!s)return r;const l=new Set;return r.filter(d=>{const c=d.type||"event";if(c!=="holiday"&&c!=="event")return!0;const p=`${c}|${d.title||""}|${d.userId||""}|${d.date||a}`;return l.has(p)?!1:(l.add(p),!0)})};const Wa=(a,e)=>{const t=String(a??"").trim();return!t||t==="undefined"||t==="null"?e:t},G=a=>String(a??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),ce=a=>String(a??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'"),At=a=>{const e=String(a||"").trim();if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?"":`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`},Kt=(a,e)=>{const t=At(a);if(!t)return"NA";const n=t.replace(/-/g,""),s=String(e||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase().slice(-3)||"USR";return`EMP-${n}-${s}`},la=(a,e,t)=>{const n=String(a??"").trim();if(!n)return null;if(!/^\d+$/.test(n))throw new Error("Birthday fields must be numeric.");const s=Number(n);if(!Number.isInteger(s)||s<e||s>t)throw new Error(`Birthday value must be between ${e} and ${t}.`);return s},vs=(a,e)=>new Date(a,e,0).getDate(),Xe=a=>{const e=new Date().getFullYear()+1,t=la(a.get("birthDay"),1,31),n=la(a.get("birthMonth"),1,12),s=la(a.get("birthYear"),1900,e);if(t&&n){const o=vs(s||2024,n);if(t>o)throw new Error(`Birthday day is not valid for month ${n}.`)}return{birthDay:t,birthMonth:n,birthYear:s}},Ft=(a,e,t=null)=>{const n=Number(a||0),s=Number(e||0),i=Number(t||0),o=s>=1&&s<=12?new Date(2026,s-1,1).toLocaleString("en-US",{month:"long"}):"--",r=n?String(n).padStart(2,"0"):"--",l=i?` ${i}`:"";return`${r} ${o}${l}`.trim()},Vt=(a="user")=>(String(a||"user").trim().toLowerCase()==="external"?"external":"user")==="external"?{source:"external",collection:"birthday_people",label:"Birthday Person",emptyMessage:"Birthday person not found.",roleLabel:"Position",deptLabel:"Location"}:{source:"user",collection:"users",label:"Staff",emptyMessage:"Staff member not found.",roleLabel:"Role",deptLabel:"Department"},fr=(a,e="user")=>Vt(e).source==="external"?{title:a?.name||"Birthday Person",subtitle:`${a?.position||"Position not set"} • ${a?.location||"Location not set"}`}:{title:a?.name||"Staff",subtitle:`${a?.role||"Employee"} • ${a?.dept||"General"}`},hr=(a,e,t,n)=>{const s=Vt(e),i=$e(t),o=$e(n),r=As(t,n),l=s.source==="external",d=l?a?.position||"":a?.role||"",c=l?a?.location||"":a?.dept||"",p=l?"Birthday Person":"Staff";return{id:`birthday_${s.source}_${i}_${a.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"birthday-reminder",title:`Upcoming Birthday: ${a.name||p}`,message:`${a.name||p} has a birthday on ${Ft(a.birthDay,a.birthMonth)}.`,description:`${r}. ${d||(l?"Position not set":"Employee")} • ${c||(l?"Location not set":"General")}`,status:"pending",date:new Date().toISOString(),read:!1,taggedByName:"Birthday Calendar",birthdayStaffId:a.id,birthdayStaffName:a.name||p,birthdaySource:s.source,birthdayDate:i,reminderDate:o,birthdayDisplay:Ft(a.birthDay,a.birthMonth,a.birthYear),birthdayReason:r,role:d,dept:c}},Dt=()=>window.AppDB&&typeof window.AppDB.getIstNow=="function"?window.AppDB.getIstNow():new Date,$e=a=>{const e=a instanceof Date?new Date(a):new Date(a);return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`},Ss=(a,e=Dt())=>{const t=Number(a?.birthDay||0),n=Number(a?.birthMonth||0);if(!t||!n)return null;const s=new Date(e),i=l=>{const d=vs(l,n),c=Math.min(t,d);return new Date(l,n-1,c)};let o=i(s.getFullYear());o.setHours(0,0,0,0);const r=$e(s);return $e(o)<r&&(o=i(s.getFullYear()+1),o.setHours(0,0,0,0)),o},yr=a=>window.AppAnalytics?.getDayType?.(a)!=="Holiday",ks=a=>{const e=new Date(a);for(e.setHours(0,0,0,0),e.setDate(e.getDate()-1);!yr(e);)e.setDate(e.getDate()-1);return e},As=(a,e)=>Math.round((a.getTime()-e.getTime())/864e5)<=1?"Birthday is tomorrow":"Birthday is on the next working day",at=(a,e="NA")=>{if(a==null||a==="")return e;const t=a instanceof Date?a:new Date(a);return Number.isNaN(t.getTime())?e:t.toLocaleDateString("en-GB")},wr=(a,e="NA")=>{if(a==null||a==="")return e;const t=a instanceof Date?a:new Date(a);return Number.isNaN(t.getTime())?e:t.toLocaleString("en-GB")},gr=a=>`Rs ${Number(a||0).toLocaleString("en-IN")}`,br=(a="")=>{const e=String(a||"").replace(/\s+/g," ").trim();return e?e.length>72?`${e.slice(0,72)}...`:e:"New task"},Ka=()=>`
        <div class="no-tags-placeholder day-plan-no-tags-placeholder">
            <p class="day-plan-no-tags-text">No collaborators yet</p>
        </div>
    `,Ds=(a,e,t="pending")=>`
        <div class="tag-chip day-plan-tag-chip" data-id="${G(a)}" data-name="${G(e)}" data-status="${G(t)}">
            <span class="day-plan-tag-main">@${G(e)} <span class="day-plan-tag-pending">(${G(t)})</span></span>
            <i class="fa-solid fa-times day-plan-remove-collab-btn" onclick="window.app_removeTagHint(this)"></i>
        </div>
    `;window.app_refreshPlanBlockSummary=a=>{if(!a)return;const e=a.querySelector(".plan-task"),t=a.querySelector(".day-plan-task-summary"),n=a.querySelector(".plan-scope"),s=a.querySelector(".day-plan-scope-pill"),i=br(e?e.value:"");t&&(t.textContent=i),s&&n&&(s.textContent=n.value==="annual"?"Annual Plan":"Personal Plan")};window.app_togglePlanBlockCollapse=a=>{const e=a.closest(".plan-block");if(!e)return;e.classList.toggle("is-collapsed");const t=e.classList.contains("is-collapsed"),n=a.querySelector("i");n&&(n.classList.toggle("fa-chevron-down",!t),n.classList.toggle("fa-chevron-up",t));const s=a.querySelector(".day-plan-collapse-label");s&&(s.textContent=t?"Expand":"Minimize"),window.app_refreshPlanBlockSummary(e)};window.app_toggleTaskCollaborator=(a,e,t)=>{const n=a.closest(".plan-block");if(!n)return;const s=n.querySelector(".tags-container");if(!s)return;const i=typeof CSS<"u"&&CSS.escape?CSS.escape(e):e.replace(/"/g,'\\"'),o=s.querySelector(`[data-id="${i}"]`);if(o)o.remove(),a.classList.remove("selected");else{const r=s.querySelector(".no-tags-placeholder");r&&r.remove(),s.insertAdjacentHTML("beforeend",Ds(e,t,"pending")),a.classList.add("selected")}s.querySelectorAll(".tag-chip").length===0&&(s.innerHTML=Ka())};window.app_getAnnualDayStaffPlans=a=>{const e=window._currentPlans||{},t=window._annualUserMap||{},s=(e.workPlans||[]).filter(r=>r.date<=a).map(r=>{const l=t[r.userId]||r.userName||"Staff",d=new Map,c=h=>String(h||"").toLowerCase().replace(/\d{1,2}\s*-\s*\d{1,2}\s+[a-z]+\s+\d{4}/g," ").replace(/\([^)]*\)/g," ").replace(/[^a-z\s]/g," ").split(/\s+/).filter(Boolean).slice(0,8).join(" "),p=(h,f="")=>{const g=String(h).trim();if(!g)return;const S=c(g)||g.toLowerCase().replace(/\s+/g," "),A=`${g}${f||""}`;if(!d.has(S)){d.set(S,A);return}(d.get(S)||"")===g&&A!==g&&d.set(S,A)},u=(Array.isArray(r.plans)?r.plans:[]).filter(h=>bs(h,r.date,a,e)).map(h=>{const{startDate:f,endDate:g}=gs(h,r.date,e),S=!!(f&&g&&f!==g),A=g===a,b=f===a,D=h.completedDate&&h.completedDate<g&&h.completedDate===a?" (Completed Early)":S&&A?" (Ends Today)":S&&b?" (Starts Today)":"";return p(h.task||"Planned task",D),""}).filter(Boolean),m=Array.from(d.values());return!m.length&&u.length?{name:l,tasks:u}:m.length?{name:l,tasks:m}:null}).filter(Boolean),i=r=>String(r||"").toLowerCase().replace(/\d{1,2}\s*-\s*\d{1,2}\s+[a-z]+\s+\d{4}/g," ").replace(/\([^)]*\)/g," ").replace(/[^a-z\s]/g," ").split(/\s+/).filter(Boolean).slice(0,8).join(" "),o=new Map;return s.forEach(r=>{const l=r.name||"Staff";o.has(l)||o.set(l,new Map);const d=o.get(l);(r.tasks||[]).forEach(c=>{const p=i(c)||String(c||"").toLowerCase();if(!d.has(p))d.set(p,c);else{const u=d.get(p)||"",m=String(c||"");u.length<m.length&&d.set(p,m)}})}),Array.from(o.entries()).map(([r,l])=>({name:r,tasks:Array.from(l.values())}))};window.app_showAnnualHoverPreview=(a,e)=>{const t="annual-hover-preview";document.getElementById(t)?.remove();const n=window.app_getAnnualDayStaffPlans(e),s=n.length?n.map(o=>`
                <div style="margin-bottom:0.45rem;">
                    <div style="font-size:0.76rem; font-weight:700; color:#334155;">${o.name}</div>
                    <div style="font-size:0.72rem; color:#64748b;">${o.tasks.slice(0,2).join(" | ")}${o.tasks.length>2?` (+${o.tasks.length-2} more)`:""}</div>
                </div>
            `).join(""):'<div style="font-size:0.74rem; color:#94a3b8;">No staff plans for this date</div>',i=`
            <div id="${t}" style="position:fixed; z-index:12000; left:${Math.min((a.clientX||0)+12,window.innerWidth-290)}px; top:${Math.min((a.clientY||0)+12,window.innerHeight-220)}px; width:280px; background:#fff; border:1px solid #dbeafe; border-radius:12px; box-shadow:0 12px 26px rgba(15,23,42,0.18); padding:0.65rem;">
                <div style="font-size:0.76rem; font-weight:800; color:#1e3a8a; margin-bottom:0.5rem;">${e} Plans</div>
                ${s}
            </div>`;(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",i)};window.app_hideAnnualHoverPreview=()=>{document.getElementById("annual-hover-preview")?.remove()};window.app_openAnnualDayPlan=async a=>{window.app_hideAnnualHoverPreview();const e=`annual-day-click-${Date.now()}`,t=window.app_getAnnualDayStaffPlans(a),n=t.length?t.map(i=>`
                <div style="border:1px solid #e2e8f0; border-radius:10px; padding:0.55rem; margin-bottom:0.45rem;">
                    <div style="font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:0.25rem;">${i.name}</div>
                    <div style="font-size:0.76rem; color:#64748b;">${i.tasks.join(" | ")}</div>
                </div>
            `).join(""):'<div style="font-size:0.8rem; color:#94a3b8;">No plans yet for this date.</div>',s=`
            <div class="modal-overlay annual-v2-modal" id="${e}" style="display:flex;">
                <div class="modal-content annual-day-plan-content annual-v2-modal-content" style="max-width:560px;">
                    <div class="annual-day-plan-head annual-v2-modal-head" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.7rem;">
                        <h3 style="margin:0;">${a}</h3>
                        <button type="button" class="app-system-dialog-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="annual-day-plan-list annual-v2-modal-list" style="max-height:46vh; overflow:auto; margin-bottom:0.75rem;">${n}</div>
                    <button type="button" class="action-btn" style="width:100%;" onclick="this.closest('.modal-overlay').remove(); window.app_openDayPlan('${a}')">
                        <i class="fa-solid fa-pen-to-square"></i> Add / Edit Day Plan
                    </button>
                </div>
            </div>`;window.app_showModal(s,e)};window.app_addPlanBlockUI=async()=>{const a=document.getElementById("plans-container");if(!a)return;const e=await window.AppDB.getAll("users"),t=window.AppAuth.getUser(),n=t.role==="Administrator"||t.isAdmin,s=Wa(window.app_currentDayPlanTargetId,t.id),i=a.dataset.defaultScope==="annual"?"annual":"personal",r=e.filter(h=>h.id!==s).map(h=>`
            <button
                type="button"
                class="day-plan-collab-option"
                data-id="${G(h.id)}"
                onclick="window.app_toggleTaskCollaborator(this, '${ce(h.id)}', '${ce(h.name)}')"
                title="Add or remove ${G(h.name)}"
            >${G(h.name)}</button>
        `).join(""),l=document.createElement("div");l.className="plan-block day-plan-block-shell",l.innerHTML=`
            <div class="day-plan-block-head" style="display:flex; align-items:center; justify-content:space-between; gap:0.7rem; padding:0.62rem 0.8rem; border-bottom:1px solid #dbeafe; background:linear-gradient(90deg,#f7faff 0%,#ecf4ff 100%);">
                <div class="day-plan-block-head-main" style="display:flex; align-items:center; gap:0.55rem; min-width:0;">
                    <span class="day-plan-index-badge-step" style="background:#1d4ed8; color:#fff;">${a.querySelectorAll(".plan-block").length+1}</span>
                    <span class="day-plan-task-summary">New task</span>
                    <span class="day-plan-scope-pill" style="background:#dbeafe; color:#1e3a8a; border-color:#bfdbfe;">${i==="annual"?"Annual Plan":"Personal Plan"}</span>
                </div>
                <div class="day-plan-block-head-actions">
                    <button type="button" onclick="this.closest('.plan-block').remove()" title="Remove this task" class="day-plan-remove-task-btn"><i class="fa-solid fa-times"></i></button>
                    <button type="button" class="day-plan-collapse-btn" onclick="window.app_togglePlanBlockCollapse(this)" style="border-color:#bfdbfe; background:#fff;">
                        <i class="fa-solid fa-chevron-down"></i>
                        <span class="day-plan-collapse-label">Minimize</span>
                    </button>
                </div>
            </div>
            <div class="day-plan-block-body" style="padding:0.8rem;">
                <div class="day-plan-left-panel day-plan-main-panel">
                    <div style="display:flex; gap:0.6rem; align-items:center; justify-content:space-between; flex-wrap:wrap;">
                        <label class="day-plan-label" style="margin:0;">What will you work on?</label>
                        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center; justify-content:flex-end;">
                            <input type="date" class="plan-start-date day-plan-select" title="From Date">
                            <input type="date" class="plan-end-date day-plan-select" title="To Date">
                            <span style="font-size:0.72rem; color:#64748b; font-weight:700;">Optional range</span>
                        </div>
                    </div>
                    <p class="day-plan-help-text">Be specific. Pick collaborators here or use @ mention.</p>
                    <textarea class="plan-task day-plan-task-input" required placeholder="Describe your plan for the day..." style="min-height:104px;"></textarea>
                    <div class="day-plan-inline-work-controls" style="border:1px solid #dbeafe; background:#f8fbff; border-radius:12px; padding:0.6rem;">
                        <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
                            <label class="day-plan-mini-label" style="margin:0;">Plan Type</label>
                            <select class="plan-scope day-plan-select day-plan-scope-select">
                                <option value="personal" ${i==="personal"?"selected":""}>Personal Plan</option>
                                <option value="annual" ${i==="annual"?"selected":""}>Annual Plan</option>
                            </select>
                        </div>
                        <div class="day-plan-collab-inline" style="margin-top:0.42rem;">
                            <div class="day-plan-collab-head">
                                <span class="day-plan-mini-label">Collaborators</span>
                                <span class="day-plan-collab-hint">Click names to tag/un-tag.</span>
                            </div>
                            <div class="day-plan-collab-picker">
                                ${r||'<span class="day-plan-collab-empty">No teammates available.</span>'}
                            </div>
                        </div>
                        <div class="tags-container day-plan-tags-inline">
                            ${Ka()}
                        </div>
                    </div>
                    <div class="day-plan-sub-section">
                        <label class="day-plan-mini-label">Break into steps (optional)</label>
                        <div class="sub-plans-list day-plan-sub-list"></div>
                        <button type="button" onclick="window.app_addSubPlanRow(this)" class="day-plan-add-step-btn"><i class="fa-solid fa-plus"></i> Add Step</button>
                    </div>
                </div>
            </div>
            <div class="day-plan-bottom-controls" style="padding:0 0.8rem 0.8rem 0.8rem;">
                <div style="display:flex; align-items:center; gap:0.6rem;">
                    <label class="day-plan-mini-label">Status</label>
                    <select class="plan-status day-plan-select">
                        <option value="" selected>Auto-Track (Recommended)</option>
                        <option value="completed">Completed</option>
                        <option value="not-completed">Not Completing</option>
                        <option value="in-process">In Progress</option>
                    </select>
                </div>
                ${n?`
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <label class="day-plan-mini-label">Assign To</label>
                        <select class="plan-assignee day-plan-select">
                            ${e.map(h=>`<option value="${h.id}" ${h.id===t.id?"selected":""}>${h.name}</option>`).join("")}
                        </select>
                    </div>
                `:""}
            </div>
        `,a.appendChild(l);const d=l.querySelector(".plan-start-date"),c=l.querySelector(".plan-end-date"),p=document.querySelector("#day-plan-modal .day-plan-head p")?.textContent?.match(/\d{4}-\d{2}-\d{2}/),u=p?p[0]:"";d&&(d.value=u),c&&(c.value=u);const m=l.querySelector(".plan-task");window.app_refreshPlanBlockSummary(l),m&&m.focus()};window.app_addSubPlanRow=a=>{const e=a.closest(".plan-block")?.querySelector(".sub-plans-list");if(!e)return;const t=document.createElement("div");t.className="sub-plan-row day-plan-sub-row",t.innerHTML=`
            <div class="day-plan-step-dot"></div>
            <input type="text" class="sub-plan-input day-plan-sub-input" placeholder="Add a step...">
            <button type="button" onclick="this.parentElement.remove()" title="Remove step" class="day-plan-remove-step-btn"><i class="fa-solid fa-circle-xmark"></i></button>
        `,e.appendChild(t);const n=t.querySelector("input");n&&n.focus()};window.app_checkMentions=(a,e)=>{const t=a.value,n=a.selectionStart,s=t.lastIndexOf("@",n-1),i=document.getElementById("mention-dropdown");if(i)if(s!==-1&&!t.substring(s,n).includes(" ")){const o=t.substring(s+1,n).toLowerCase(),r=e.filter(l=>l.name.toLowerCase().includes(o));if(a.id||(a.id="ta-"+Date.now()),r.length>0){const l=a.getBoundingClientRect();i.innerHTML=r.map(d=>`
                    <div onclick="window.app_applyMention('${a.id}', '${d.id}', '${d.name.replace(/'/g,"\\'")}', ${s})" class="mention-item day-plan-mention-item">
                        <img src="${d.avatar}" class="day-plan-mention-avatar" />
                        <span>${d.name}</span>
                    </div>
                `).join(""),i.style.top=`${l.bottom+6}px`,i.style.left=`${l.left}px`,i.style.display="block"}else i.style.display="none"}else i.style.display="none"};window.app_applyMention=(a,e,t,n)=>{const s=document.getElementById(a);if(!s)return;const i=s.selectionStart,o=s.value.substring(0,n),r=s.value.substring(i);s.value=`${o}${t} ${r}`,s.focus();const l=s.closest(".plan-block"),d=l?.querySelector(".tags-container");if(!d)return;const c=document.getElementById("mention-dropdown");if(c&&(c.style.display="none"),d.querySelector(`[data-id="${e}"]`))return;const u=d.querySelector(".no-tags-placeholder");u&&u.remove(),d.insertAdjacentHTML("beforeend",Ds(e,t,"pending"));const m=typeof CSS<"u"&&CSS.escape?CSS.escape(e):e.replace(/"/g,'\\"'),h=l?.querySelector(`.day-plan-collab-option[data-id="${m}"]`);h&&h.classList.add("selected")};window.app_removeTagHint=a=>{const e=a.closest(".tags-container"),t=a.closest(".tag-chip"),n=t?t.dataset.id:"",s=a.closest(".plan-block");if(a.parentElement.remove(),s&&n){const i=typeof CSS<"u"&&CSS.escape?CSS.escape(n):n.replace(/"/g,'\\"'),o=s.querySelector(`.day-plan-collab-option[data-id="${i}"]`);o&&o.classList.remove("selected")}e&&e.querySelectorAll(".tag-chip").length===0&&(e.innerHTML=Ka())};window.app_showStatusTooltip=()=>{};window.app_hideCheckoutIntro=()=>{const a=document.getElementById("checkout-intro-panel");a&&(a.style.display="none",localStorage.setItem("checkoutIntroSeen","true"))};window.app_updateCharCounter=a=>{const e=document.getElementById("char-counter");if(e){const t=a.value.length;e.textContent=`${t} / 500 recommended`,t>500?e.style.color="#f59e0b":t>300?e.style.color="#10b981":e.style.color="#94a3b8"}};window.app_selectLocationReason=a=>{const e=document.getElementById("location-explanation");e&&(document.querySelectorAll(".location-reason-btn").forEach(t=>{t.style.background="#e0f2fe",t.style.borderColor="#7dd3fc"}),event.target.style.background="#0ea5e9",event.target.style.borderColor="#0ea5e9",event.target.style.color="white",e.value=a,e.focus())};window.app_selectOvertimeReason=(a,e,t="overtime_work")=>{const n=document.getElementById("checkout-overtime-explanation"),s=document.getElementById("checkout-overtime-mode");document.querySelectorAll(".overtime-reason-btn").forEach(i=>{i.style.background="#fef3c7",i.style.borderColor="#fcd34d",i.style.color="#92400e"}),a&&(a.style.background="#f59e0b",a.style.borderColor="#f59e0b",a.style.color="white"),s&&(s.value=t),n&&(n.value=e,n.focus())};window.app_useWorkPlan=()=>{const a=document.getElementById("checkout-plan-text"),e=document.getElementById("checkout-work-summary"),t=a?.dataset?.rawText;t&&e&&(e.value=t,window.app_updateCharCounter&&window.app_updateCharCounter(e),e.focus(),e.style.borderColor="#8b5cf6",e.style.background="#f5f3ff",setTimeout(()=>{e.style.borderColor="#e2e8f0",e.style.background="#ffffff"},1e3))};const _s={started:"Started",half_done:"Half Done",blocked:"Blocked",waiting:"Waiting",done:"Done"},Pe=a=>typeof CSS<"u"&&CSS.escape?CSS.escape(a):String(a||"").replace(/"/g,'\\"');window.app_getCheckoutTaskKey=(a,e)=>`${a}:${e}`;window.app_parseCheckoutTaskKey=a=>{const e=String(a||""),t=e.lastIndexOf(":");if(t<=0)return{planId:e,taskIndex:-1};const n=e.slice(0,t),s=Number(e.slice(t+1));return{planId:n,taskIndex:s}};window.app_initCheckoutTaskDetails=(a,e,t)=>{window.app_checkoutTaskDetails=window.app_checkoutTaskDetails||{};const n=window.app_getCheckoutTaskKey(a,e);if(!window.app_checkoutTaskDetails[n]){const s=Number(t?.progressPercent),i=Number.isFinite(s)?Math.min(100,Math.max(0,s)):t?.status==="completed"?100:0,o=t?.progressStatus||(i>=100?"done":i>0?"started":"waiting");window.app_checkoutTaskDetails[n]={action:"",progressPercent:i,progressStatus:o,progressNote:t?.progressNote||"",actionMeta:{},lastUpdatedAt:null}}return window.app_checkoutTaskDetails[n]};window.app_markCheckoutTaskSaved=a=>{const t=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Pe(a)}"]`)?.querySelector("[data-saved-indicator]");t&&(t.classList.add("is-visible"),clearTimeout(t._hideTimeout),t._hideTimeout=setTimeout(()=>{t.classList.remove("is-visible")},1400))};window.app_setCheckoutTaskStatus=(a,e)=>{const t=window.app_checkoutTaskDetails?.[a];t&&(t.progressStatus=e,t.lastUpdatedAt=new Date().toISOString(),window.app_syncCheckoutTaskPanel(a),window.app_markCheckoutTaskSaved(a),window.app_renderCheckoutActionPreview())};window.app_updateCheckoutTaskProgress=(a,e)=>{const t=window.app_checkoutTaskDetails?.[a];if(!t)return;const n=Math.min(100,Math.max(0,Number(e||0)));t.progressPercent=n,n>=100&&(t.progressStatus="done"),t.lastUpdatedAt=new Date().toISOString(),window.app_syncCheckoutTaskPanel(a),window.app_markCheckoutTaskSaved(a),window.app_renderCheckoutActionPreview()};window.app_updateCheckoutTaskNote=(a,e)=>{const t=window.app_checkoutTaskDetails?.[a];t&&(t.progressNote=String(e||""),t.lastUpdatedAt=new Date().toISOString(),window.app_markCheckoutTaskSaved(a),window.app_renderCheckoutActionPreview())};window.app_updateCheckoutTaskActionMeta=(a,e,t)=>{const n=window.app_checkoutTaskDetails?.[a];n&&(n.actionMeta=n.actionMeta||{},n.actionMeta[e]=t,n.lastUpdatedAt=new Date().toISOString(),window.app_markCheckoutTaskSaved(a),window.app_renderCheckoutActionPreview())};window.app_clearCheckoutTaskError=a=>{const e=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Pe(a)}"]`);if(!e)return;e.classList.remove("has-error");const t=e.querySelector("[data-inline-error]");t&&(t.textContent="")};window.app_setCheckoutTaskError=(a,e)=>{const t=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Pe(a)}"]`);if(!t)return;t.classList.add("has-error");const n=t.querySelector("[data-inline-error]");n&&(n.textContent=e)};window.app_syncCheckoutTaskPanel=a=>{const e=window.app_checkoutTaskDetails?.[a],t=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Pe(a)}"]`);if(!t||!e)return;const n=t.querySelector("[data-progress-value]"),s=t.querySelector("[data-progress-input]");s&&(s.value=e.progressPercent),n&&(n.textContent=`${e.progressPercent}%`);const i=t.querySelector("[data-progress-note]");i&&i.value!==e.progressNote&&(i.value=e.progressNote||""),t.querySelectorAll("[data-status-chip]").forEach(o=>{const r=o.getAttribute("data-status-chip");o.classList.toggle("is-selected",r===e.progressStatus)}),t.querySelectorAll("[data-action-panel-section]").forEach(o=>{const r=o.getAttribute("data-action-panel-section");o.style.display=e.action===r?"block":"none"}),t.querySelectorAll("[data-action-field]").forEach(o=>{const r=o.getAttribute("data-action-field"),l=e.actionMeta?.[r]??"";o.value!==String(l)&&(o.value=String(l))})};window.app_collectCheckoutTaskUpdates=()=>{const a=[],e=[],t=window.app_checkoutTaskDetails||{};return Object.keys(t).forEach(n=>{const s=t[n];if(!s||!s.action)return;const{planId:i,taskIndex:o}=window.app_parseCheckoutTaskKey(n);let r="";if(s.action==="postpone"&&(s.actionMeta?.postponeDate||(r="Select a new date to postpone.")),s.action==="delegate"&&(String(s.actionMeta?.delegateUserId||"").trim()||(r="Select a staff member to delegate.")),r){e.push({key:n,message:r});return}a.push({key:n,planId:i,taskIndex:o,action:s.action,progressPercent:s.progressPercent,progressStatus:s.progressStatus,progressNote:s.progressNote,actionMeta:s.actionMeta||{},timestamp:new Date().toISOString()})}),{updates:a,errors:e}};window.app_closeCheckoutActionModal=()=>{document.getElementById("checkout-action-detail-modal")?.remove()};window.app_openCheckoutActionModal=a=>{const e=window.app_checkoutTaskDetails?.[a];if(!e||!e.action)return;const t=window.app_checkoutTaskMeta?.[a]||{},n=window.app_checkoutUserMap||{},s=window.AppAuth.getUser()?.id,i=document.getElementById("checkout-action-detail-modal");i&&i.remove();const o=e.action==="complete"?"Complete":e.action==="postpone"?"Postpone":e.action==="delegate"?"Delegate":"Action",r="",l=G(e.actionMeta?.postponeDate||new Date(Date.now()+864e5).toISOString().split("T")[0]),d=G(e.actionMeta?.postponeReason||""),c="",p=G(e.actionMeta?.delegateNote||""),u=G(e.actionMeta?.delegateUserId||""),m="",h=Object.keys(n).filter(g=>String(g)!==String(s)).map(g=>{const S=u&&u===String(g)?"selected":"";return`<option value="${G(g)}" ${S}>${G(n[g])}</option>`}).join(""),f=document.createElement("div");f.id="checkout-action-detail-modal",f.className="modal-overlay checkout-action-detail-modal",f.setAttribute("data-checkout-key",a),f.innerHTML=`
        <div class="modal-content checkout-action-detail-content">
            <div class="checkout-action-detail-header">
                <div>
                    <div class="checkout-action-detail-title">${G(t.text||"Task")}</div>
                    <div class="checkout-action-detail-sub">${G(o)} • ${e.progressPercent}% • ${G(_s[e.progressStatus]||"")}</div>
                </div>
                <button type="button" class="checkout-action-detail-close" onclick="window.app_closeCheckoutActionModal()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="checkout-task-panel-body">
                <div class="checkout-task-panel-header">
                    <span>Action Details</span>
                    <span class="checkout-task-saved" data-saved-indicator>Saved</span>
                </div>
                <div class="checkout-task-field">
                    <label>Progress <span class="checkout-task-progress-value" data-progress-value>${e.progressPercent}%</span></label>
                    <input type="range" min="0" max="100" value="${e.progressPercent}" data-progress-input oninput="window.app_updateCheckoutTaskProgress('${ce(a)}', this.value)">
                </div>
                <div class="checkout-task-field">
                    <label>Status</label>
                    <div class="checkout-task-status-chips">
                        ${r}
                    </div>
                </div>
                <div class="checkout-task-field">
                    <label>Note</label>
                    <textarea rows="2" data-progress-note placeholder="What changed? (optional)" oninput="window.app_updateCheckoutTaskNote('${ce(a)}', this.value)">${m}</textarea>
                </div>
                <div class="checkout-task-action-extra" data-action-panel-section="complete" style="display:${e.action==="complete"?"block":"none"};">
                    <label>Completion Note</label>
                    <textarea rows="2" data-action-field="completionNote" placeholder="Optional details for completion." oninput="window.app_updateCheckoutTaskActionMeta('${ce(a)}','completionNote', this.value)">${c}</textarea>
                </div>
                <div class="checkout-task-action-extra" data-action-panel-section="postpone" style="display:${e.action==="postpone"?"block":"none"};">
                    <label>New Date</label>
                    <input type="date" data-action-field="postponeDate" value="${l}" onchange="window.app_updateCheckoutTaskActionMeta('${ce(a)}','postponeDate', this.value)">
                    <label>Reason</label>
                    <textarea rows="2" data-action-field="postponeReason" placeholder="Why postponed?" oninput="window.app_updateCheckoutTaskActionMeta('${ce(a)}','postponeReason', this.value)">${d}</textarea>
                </div>
                <div class="checkout-task-action-extra" data-action-panel-section="delegate" style="display:${e.action==="delegate"?"block":"none"};">
                    <label>Assign To</label>
                    <select data-action-field="delegateUserId" onchange="window.app_updateCheckoutTaskActionMeta('${ce(a)}','delegateUserId', this.value)">
                        <option value="">Select staff</option>
                        ${h}
                    </select>
                    <label>Handoff Note</label>
                    <textarea rows="2" data-action-field="delegateNote" placeholder="Handoff context (optional)." oninput="window.app_updateCheckoutTaskActionMeta('${ce(a)}','delegateNote', this.value)">${p}</textarea>
                </div>
                <div class="checkout-task-inline-error" data-inline-error></div>
            </div>
            <div class="checkout-action-detail-footer">
                <button type="button" class="action-btn secondary" onclick="window.app_closeCheckoutActionModal()">Done</button>
            </div>
        </div>
    `,document.body.appendChild(f),window.app_syncCheckoutTaskPanel(a)};window.app_renderCheckoutActionPreview=()=>{const a=document.getElementById("checkout-action-preview"),e=document.getElementById("checkout-action-preview-list");if(!a||!e)return;const t=window.app_checkoutTaskDetails||{},n=window.app_checkoutTaskMeta||{},s=window.app_checkoutUserMap||{},i=Object.keys(t).map(o=>{const r=t[o];if(!r||!r.action)return null;const d=(n[o]||{}).text||"Task",c=r.action==="complete"?"Complete":r.action==="postpone"?"Postpone":r.action==="delegate"?"Delegate":r.action,p=_s[r.progressStatus]||"Waiting",u=String(r.progressNote||"").trim();let m="";if(r.action==="postpone"){const h=At(r.actionMeta?.postponeDate)||"—",f=String(r.actionMeta?.postponeReason||"").trim();m=`New date: ${G(h)}${f?` • Reason: ${G(f)}`:""}`}if(r.action==="delegate"){const h=String(r.actionMeta?.delegateUserId||""),f=s[h]||"—",g=String(r.actionMeta?.delegateNote||"").trim();m=`Assigned to: ${G(f)}${g?` • Note: ${G(g)}`:""}`}if(r.action==="complete"){const h=String(r.actionMeta?.completionNote||"").trim();m=h?`Completion note: ${G(h)}`:""}return`
            <div class="checkout-action-preview-item">
                <div class="checkout-action-preview-title">${G(d)}</div>
                <div class="checkout-action-preview-meta">
                    <span class="checkout-action-preview-chip">${G(c)}</span>
                    <span>${r.progressPercent}% • ${G(p)}</span>
                </div>
                ${u?`<div class="checkout-action-preview-note">${G(u)}</div>`:""}
                ${m?`<div class="checkout-action-preview-extra">${m}</div>`:""}
            </div>
        `}).filter(Boolean);if(i.length===0){a.style.display="none",e.innerHTML="";return}a.style.display="block",e.innerHTML=i.join("")};window.app_openCheckoutActionModal=a=>{const e=window.app_checkoutTaskDetails?.[a];if(!e||!e.action)return;const t=window.app_checkoutTaskMeta?.[a]||{},n=window.app_checkoutUserMap||{},s=window.AppAuth.getUser()?.id;document.getElementById("checkout-action-detail-modal")?.remove();const i=e.action==="complete"?"Complete":e.action==="postpone"?"Postpone":e.action==="delegate"?"Delegate":"Action",o=G(e.actionMeta?.postponeDate||new Date(Date.now()+864e5).toISOString().split("T")[0]),r=G(e.actionMeta?.postponeReason||""),l=G(e.actionMeta?.delegateNote||""),d=G(e.actionMeta?.delegateUserId||""),c=Object.keys(n).filter(u=>String(u)!==String(s)).map(u=>{const m=d&&d===String(u)?"selected":"";return`<option value="${G(u)}" ${m}>${G(n[u])}</option>`}).join(""),p=document.createElement("div");p.id="checkout-action-detail-modal",p.className="modal-overlay checkout-action-detail-modal",p.setAttribute("data-checkout-key",a),p.innerHTML=`
        <div class="modal-content checkout-action-detail-content">
            <div class="checkout-action-detail-header">
                <div>
                    <div class="checkout-action-detail-title">${G(t.text||"Task")}</div>
                    <div class="checkout-action-detail-sub">${G(i)} details</div>
                </div>
                <button type="button" class="checkout-action-detail-close" onclick="window.app_closeCheckoutActionModal()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="checkout-task-panel-body">
                <div class="checkout-task-panel-header">
                    <span>${G(i)}</span>
                    <span class="checkout-task-saved" data-saved-indicator>Saved</span>
                </div>
                <div class="checkout-task-action-extra" data-action-panel-section="complete" style="display:${e.action==="complete"?"block":"none"};">
                    <div class="checkout-task-action-help">This task will be marked completed during check-out.</div>
                </div>
                <div class="checkout-task-action-extra" data-action-panel-section="postpone" style="display:${e.action==="postpone"?"block":"none"};">
                    <label>New Date</label>
                    <input type="date" data-action-field="postponeDate" value="${o}" onchange="window.app_updateCheckoutTaskActionMeta('${ce(a)}','postponeDate', this.value)">
                    <label>Reason</label>
                    <textarea rows="2" data-action-field="postponeReason" placeholder="Optional reason" oninput="window.app_updateCheckoutTaskActionMeta('${ce(a)}','postponeReason', this.value)">${r}</textarea>
                </div>
                <div class="checkout-task-action-extra" data-action-panel-section="delegate" style="display:${e.action==="delegate"?"block":"none"};">
                    <label>Assign To</label>
                    <select data-action-field="delegateUserId" onchange="window.app_updateCheckoutTaskActionMeta('${ce(a)}','delegateUserId', this.value)">
                        <option value="">Select staff</option>
                        ${c}
                    </select>
                    <label>Handoff Note</label>
                    <textarea rows="2" data-action-field="delegateNote" placeholder="Handoff context (optional)." oninput="window.app_updateCheckoutTaskActionMeta('${ce(a)}','delegateNote', this.value)">${l}</textarea>
                </div>
                <div class="checkout-task-inline-error" data-inline-error></div>
            </div>
            <div class="checkout-action-detail-footer">
                <button type="button" class="action-btn secondary" onclick="window.app_closeCheckoutActionModal()">Done</button>
            </div>
        </div>
    `,document.body.appendChild(p),window.app_syncCheckoutTaskPanel(a)};window.app_renderCheckoutActionPreview=()=>{const a=document.getElementById("checkout-action-preview"),e=document.getElementById("checkout-action-preview-list");if(!a||!e)return;const t=window.app_checkoutTaskDetails||{},n=window.app_checkoutTaskMeta||{},s=window.app_checkoutUserMap||{},i=Object.keys(t).map(o=>{const r=t[o];if(!r||!r.action)return null;const d=(n[o]||{}).text||"Task",c=r.action==="complete"?"Complete":r.action==="postpone"?"Postpone":r.action==="delegate"?"Delegate":r.action;let p="";if(r.action==="postpone"){const u=At(r.actionMeta?.postponeDate)||"--",m=String(r.actionMeta?.postponeReason||"").trim();p=`New date: ${G(u)}${m?` • Reason: ${G(m)}`:""}`}if(r.action==="delegate"){const u=String(r.actionMeta?.delegateUserId||""),m=s[u]||"--",h=String(r.actionMeta?.delegateNote||"").trim();p=`Assigned to: ${G(m)}${h?` • Note: ${G(h)}`:""}`}return`
            <div class="checkout-action-preview-item">
                <div class="checkout-action-preview-title">${G(d)}</div>
                <div class="checkout-action-preview-meta">
                    <span class="checkout-action-preview-chip">${G(c)}</span>
                </div>
                ${p?`<div class="checkout-action-preview-extra">${p}</div>`:""}
            </div>
        `}).filter(Boolean);if(i.length===0){a.style.display="none",e.innerHTML="";return}a.style.display="block",e.innerHTML=i.join("")};window.app_applyCheckoutTaskUpdates=async(a=[])=>{if(!Array.isArray(a)||a.length===0)return;const e=window.AppAuth.getUser(),t=e?.id||e?.name||"staff",n=new Date().toISOString().split("T")[0];for(const s of a){const i=await window.AppDB.get("work_plans",s.planId).catch(()=>null);if(!i||!Array.isArray(i.plans))continue;const o=i.plans[s.taskIndex];if(o){if(o.progressPercent=s.progressPercent,o.progressStatus=s.progressStatus,o.progressNote=s.progressNote,o.lastProgressUpdateAt=s.timestamp,o.lastProgressUpdateBy=t,o.lastCheckoutAction=s.action,s.action==="complete"&&(o.status="completed",o.completedDate||(o.completedDate=n)),s.action==="postpone"&&(o.status="postponed"),i.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",i),s.action==="postpone"){const r=At(s.actionMeta?.postponeDate);if(r){const l=o.subPlans&&o.subPlans.length?` - ${o.subPlans.join(", ")}`:"",d=`${o.task}${l}`,c=i.date||n,u=`${d.replace(/\s*\(Postponed from [^)]+\)\s*$/i,"")} (Postponed from ${c})`;await window.AppCalendar.addWorkPlanTask(r,e.id,u,[],{addedFrom:"postponed",sourcePlanId:s.planId,sourceTaskIndex:s.taskIndex,postponedFromDate:c})}}if(s.action==="delegate"){const r=String(s.actionMeta?.delegateUserId||"").trim();r&&await window.app_delegateTo(s.planId,s.taskIndex,r)}}}window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans()};window.app_deleteDayPlan=async(a,e=null,t=null)=>{if(!await window.appConfirm("Are you sure you want to delete this work plan?"))return;const n=window.AppAuth.getUser(),s=Wa(e,n.id);try{t==="personal"||t==="annual"?await window.AppCalendar.deleteWorkPlan(a,s,{planScope:t}):await Promise.all([window.AppCalendar.deleteWorkPlan(a,s,{planScope:"personal"}),window.AppCalendar.deleteWorkPlan(a,s,{planScope:"annual"})]),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert("Plan deleted!"),document.getElementById("day-plan-modal")?.remove();const o=await K.renderDashboard(),r=document.getElementById("page-content");r&&(r.innerHTML=o,window.setupDashboardEvents&&window.setupDashboardEvents())}catch(i){alert(i.message)}};window.app_saveDayPlan=async(a,e,t=null)=>{a.preventDefault();const n=window.AppAuth.getUser(),s=Wa(t,n.id),i=a.target,o=i?.dataset?.hadPersonal==="1",r=i?.dataset?.hadAnnual==="1";let l=[];try{l=JSON.parse(i?.dataset?.removedTasks||"[]")}catch{l=[]}const d=document.querySelectorAll(".plan-block"),c=[],p=[],u=[],m={};let h="";if(d.forEach(f=>{const g=f.querySelector(".plan-task").value.trim(),S=f.querySelectorAll(".sub-plan-input"),A=Array.from(S).map(B=>B.value.trim()).filter(B=>B!==""),b=f.querySelectorAll(".tag-chip"),x=Array.from(b).map(B=>({id:B.dataset.id,name:B.dataset.name,status:B.dataset.status||"pending"})),D=f.querySelector(".plan-status").value,T=f.querySelector(".plan-assignee"),_=T?T.value:s,E=f.querySelector(".plan-start-date"),M=f.querySelector(".plan-end-date"),w=E?String(E.value||"").trim():"",y=M?String(M.value||"").trim():"",k=f.querySelector(".plan-root-id"),P=k?String(k.value||"").trim():"",R=f.querySelector(".plan-scope"),C=R&&R.value==="annual"?"annual":"personal";if(g){if(w&&!y||!w&&y){h="Please select both From Date and To Date for ranged tasks.";return}if(w&&y&&y<w){h="To Date cannot be earlier than From Date.";return}const F={task:g,subPlans:A,tags:x,status:D||null,assignedTo:_||null,startDate:w||e,endDate:y||e,planScope:C,carryForwardRootId:P||null,completedDate:D==="completed"?new Date().toISOString().split("T")[0]:null};c.push(F),C==="annual"?u.push(F):p.push(F)}}),l.forEach(f=>{const g=String(f?.rootId||"").trim(),S=f?.scope==="annual"?"annual":"personal";if(!g)return;const A={task:"[Removed Task]",subPlans:[],tags:[],status:"not-completed",assignedTo:s||null,startDate:e,endDate:e,planScope:S,carryForwardRootId:g,isRemoved:!0,removedAt:new Date().toISOString()};c.push(A),S==="annual"?u.push(A):p.push(A)}),h){alert(h);return}try{if(c.length===0&&(o&&await window.AppCalendar.deleteWorkPlan(e,s,{planScope:"personal"}),r&&await window.AppCalendar.deleteWorkPlan(e,s,{planScope:"annual"}),!o&&!r)){alert("Please add at least one task.");return}p.length>0?(await window.AppCalendar.setWorkPlan(e,p,s,{planScope:"personal"}),m.personal=window.AppCalendar.getWorkPlanId(e,s,"personal")):o&&await window.AppCalendar.deleteWorkPlan(e,s,{planScope:"personal"}),u.length>0?(await window.AppCalendar.setWorkPlan(e,u,s,{planScope:"annual"}),m.annual=window.AppCalendar.getWorkPlanId(e,s,"annual")):r&&await window.AppCalendar.deleteWorkPlan(e,s,{planScope:"annual"}),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans();const f=await window.AppDB.getAll("users");if(s!==n.id&&(n.role==="Administrator"||n.isAdmin)){const b=f.find(x=>x.id===s);if(b){b.notifications||(b.notifications=[]);const x=b.notifications[b.notifications.length-1];(!x||x.message!==`Admin ${n.name} has edited your Work Plan for ${e}`)&&(b.notifications.push({type:"admin_edit",message:`Admin ${n.name} has edited your Work Plan for ${e}`,date:new Date().toLocaleString(),read:!1}),await window.AppDB.put("users",b))}}const g=new Set;if(c.forEach(b=>{b.tags&&b.tags.forEach(x=>g.add(x.id))}),g.size>0){for(const b of g){const x=f.find(D=>D.id===b);x&&b!==n.id&&(x.notifications||(x.notifications=[]),c.forEach((D,T)=>{if(D.tags&&D.tags.some(_=>_.id===b)){const _=D.planScope==="annual"?"annual":"personal",E=m[_]||window.AppCalendar.getWorkPlanId(e,s,_);x.notifications.some(w=>{const y=String(w?.type||"").toLowerCase();return(y==="tag"||y==="mention")&&String(w.planId||"")===String(E||"")&&Number(w.taskIndex)===Number(T)&&String(w.taggedById||"")===String(n.id||"")})||x.notifications.push({id:`tag_${Date.now()}_${b}_${T}`,type:"tag",title:D.task||"Tagged task",description:D.subPlans&&D.subPlans.length>0?D.subPlans.join(", "):"",taggedById:n.id,taggedByName:n.name,taggedAt:new Date().toISOString(),status:"pending",source:"plan",planId:E,taskIndex:T,message:`${n.name} tagged you in: "${D.task}" for ${e}`,date:new Date().toLocaleString(),read:!1})}}),await window.AppDB.put("users",x))}for(let b=0;b<c.length;b++){const x=c[b];if(x.tags)for(const D of x.tags){if(D.id===s)continue;const T=f.find(y=>y.id===D.id);if(!T||!window.AppCalendar)continue;const _=x.planScope==="annual"?"annual":"personal",E=m[_]||window.AppCalendar.getWorkPlanId(e,s,_),M=x.subPlans&&x.subPlans.length>0?` - ${x.subPlans.join(", ")}`:"",w=`${x.task}${M} (Responsible: ${T.name})`;await window.AppCalendar.addWorkPlanTask(e,T.id,w,[{id:n.id,name:n.name,status:"pending"}],{addedFrom:"tag",sourcePlanId:E,sourceTaskIndex:b,taggedById:n.id,taggedByName:n.name,status:"pending",subPlans:x.subPlans||[],startDate:x.startDate||e,endDate:x.endDate||x.startDate||e})}}}alert("Plans saved successfully!"),document.getElementById("day-plan-modal")?.remove();const S=await K.renderDashboard(),A=document.getElementById("page-content");A&&(A.innerHTML=S,window.setupDashboardEvents&&window.setupDashboardEvents())}catch(f){alert(f.message)}};window.app_handleTagResponse=async(a,e,t,n)=>{const s=window.AppAuth.getUser();try{const i=a?await window.AppDB.get("work_plans",a).catch(()=>null):null;if(!i||!i.plans||!i.plans[e]){console.warn(`app_handleTagResponse: plan/task not found for planId=${a}, taskIdx=${e}. Falling back to notification-only update.`);const c=await window.AppDB.get("users",s.id).catch(()=>null),p=c?.notifications?.[n]?.id||null;if(p||n>=0)await window.app_handleTagDecision(p||String(n),t);else{if(c?.notifications?.[n]){const m=new Date().toISOString();c.notifications[n].status=t,c.notifications[n].respondedAt=m,c.notifications[n].read=!0,c.notifications[n].dismissedAt=m,await window.AppDB.put("users",c)}const u=document.getElementById("page-content");u&&(u.innerHTML=await K.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),alert(`You have ${t} the request.`)}return}const o=i.plans[e];if(o.tags){const c=o.tags.find(p=>p.id===s.id);c&&(c.status=t)}await window.AppDB.put("work_plans",i);const r=await window.AppDB.get("users",s.id);let l="";if(t==="rejected"&&(l=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Task",confirmText:"Submit Reason"})||""),r&&r.notifications){const c=r.notifications[n];if(c){const p=new Date().toISOString();c.status=t,c.respondedAt=p,c.read=!0,c.dismissedAt=p,l&&(c.rejectReason=l)}r.tagHistory||(r.tagHistory=[]),r.tagHistory.unshift({id:`taghist_${Date.now()}`,type:"tag_response",title:c?.title||i.plans[e].task||"Tagged task",taggedByName:c?.taggedByName||i.userName||"Staff",status:t,reason:l,date:new Date().toISOString()}),await window.AppDB.put("users",r)}if(i.userId){const c=await window.AppDB.get("users",i.userId);c&&(c.notifications||(c.notifications=[]),c.notifications.unshift({id:`tagresp_${Date.now()}`,type:"tag_response",message:`${s.name} ${t} your tag request.`,title:i.plans[e].task,taggedByName:s.name,status:t,reason:l,date:new Date().toISOString(),read:!1}),await window.AppDB.put("users",c))}window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans();const d=document.getElementById("page-content");d&&(d.innerHTML=await K.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),alert(`You have ${t} the collaboration request.`)}catch(i){console.error("app_handleTagResponse error:",i),alert("Error processing your response. Please try again.")}};window.app_changeCalMonth=a=>{let e=window.app_calMonth+a;e<0&&(window.app_calYear--,e=11),e>11&&(window.app_calYear++,e=0),window.app_calMonth=e,K.renderDashboard().then(async t=>{const n=document.getElementById("page-content");n.innerHTML=t,Ue()})};window.app_exportCalendar=async()=>{const a=window._currentPlans,e=window.app_calMonth,t=window.app_calYear;if(!a){alert("Calendar data not loaded yet.");return}try{await window.AppReports.exportCalendarPlansCSV(a,e,t)}catch(n){alert("Export failed: "+n.message)}};window.app_newMeeting=async()=>{const a=window.AppAuth.getUser(),e={id:"meeting_"+Date.now(),title:"",date:new Date().toISOString().split("T")[0],minutes:"",author:a.name,timestamp:new Date().toISOString()};await window.AppDB.put("meetings",e),window._selectedMeetingId=e.id;const t=document.getElementById("page-content");t.innerHTML=await K.renderMinutes()};window.app_selectMeeting=async a=>{window._selectedMeetingId=a;const e=document.getElementById("page-content");e.innerHTML=await K.renderMinutes()};window.app_saveMeeting=async()=>{const a=document.getElementById("meeting-title")?.value,e=document.getElementById("meeting-date")?.value,t=document.getElementById("meeting-minutes")?.value;if(!window._selectedMeetingId){alert("No meeting selected");return}const n=await window.AppDB.get("meetings",window._selectedMeetingId);if(!n){alert("Meeting not found");return}n.title=a,n.date=e,n.minutes=t,n.timestamp=new Date().toISOString(),await window.AppDB.put("meetings",n);const s=document.getElementById("page-content");s.innerHTML=await K.renderMinutes(),alert("Meeting minutes saved successfully!")};window.app_deleteMeeting=async a=>{if(!await window.appConfirm("Are you sure you want to delete this meeting?"))return;await window.AppDB.delete("meetings",a),window._selectedMeetingId=null;const e=document.getElementById("page-content");e.innerHTML=await K.renderMinutes()};window.app_postponeTask=async(a,e,t)=>{if(t)try{await window.AppCalendar.updateTaskStatus(a,e,"postponed");const n=await window.AppDB.get("work_plans",a),s=n?.plans?.[e],i=String(n?.userId||window.AppAuth.getUser()?.id||"").trim();if(!i)throw new Error("Task owner not found.");const o=s&&s.subPlans&&s.subPlans.length?` - ${s.subPlans.join(", ")}`:"",r=s?`${s.task}${o}`:"",l=n?.date||new Date().toISOString().split("T")[0],c=`${r.replace(/\s*\(Postponed from [^)]+\)\s*$/i,"")} (Postponed from ${l})`;await window.AppCalendar.addWorkPlanTask(t,i,c,[],{addedFrom:"postponed",sourcePlanId:a,sourceTaskIndex:e,postponedFromDate:l}),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert(`Task postponed to ${t}`),typeof Fe=="function"&&await Fe()}catch(n){alert("Failed to postpone task: "+n.message)}};window.app_openPostponeModal=function(a,e){const t="postpone-task-modal";document.getElementById(t)?.remove();const n=new Date(Date.now()+864e5).toISOString().split("T")[0],s=`
            <div class="modal-overlay" id="${t}" style="display:flex;">
                <div class="modal-content" style="max-width:420px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                        <h3 style="margin:0; font-size:1.05rem;">Postpone Task</h3>
                        <button type="button" onclick="document.getElementById('${t}')?.remove()" style="background:none; border:none; font-size:1.1rem; cursor:pointer;">&times;</button>
                    </div>
                    <label for="postpone-date-input" style="display:block; margin-bottom:0.35rem; font-size:0.85rem; color:#475569; font-weight:600;">Select date</label>
                    <input id="postpone-date-input" type="date" value="${n}" style="width:100%; padding:0.6rem; border:1px solid #d1d5db; border-radius:8px;">
                    <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
                        <button type="button" class="action-btn secondary" onclick="document.getElementById('${t}')?.remove()" style="padding:0.55rem 0.9rem;">Cancel</button>
                        <button type="button" class="action-btn" onclick="window.app_confirmPostponeTask('${a}', ${e})" style="padding:0.55rem 0.9rem;">Confirm</button>
                    </div>
                </div>
            </div>`;window.app_showModal(s,t)};window.app_confirmPostponeTask=async function(a,e){const t=document.getElementById("postpone-date-input")?.value;if(!t)return alert("Please select a date.");document.getElementById("postpone-task-modal")?.remove(),await window.app_postponeTask(a,e,t)};window.app_openDelegateModal=async function(a,e){const t="delegate-task-modal";document.getElementById(t)?.remove();const n=await window.AppDB.getAll("users").catch(()=>[]),s=window.AppAuth.getUser(),i=(n||[]).filter(l=>l.id!==s.id);window.app_delegateModalContext={planId:a,taskIndex:e,selectedUserId:""};const o=i.map(l=>`
            <button type="button" class="delegate-picker-item" data-user-id="${l.id}" data-name="${(l.name||"").toLowerCase()}" onclick="window.app_selectDelegateUser('${l.id}')">
                <img src="${l.avatar||""}" alt="${l.name}" class="delegate-user-avatar">
                <span>${l.name}</span>
            </button>
        `).join(""),r=`
            <div class="modal-overlay" id="${t}" style="display:flex;">
                <div class="modal-content" style="max-width:480px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                        <h3 style="margin:0; font-size:1.05rem;">Delegate Task</h3>
                        <button type="button" onclick="document.getElementById('${t}')?.remove()" style="background:none; border:none; font-size:1.1rem; cursor:pointer;">&times;</button>
                    </div>
                    <input id="delegate-search-input" type="text" placeholder="Search staff..." oninput="window.app_filterDelegateUsers(this.value)" style="width:100%; padding:0.6rem; border:1px solid #d1d5db; border-radius:8px; margin-bottom:0.7rem;">
                    <div id="delegate-picker-list" class="delegate-picker-list">${o||'<div style="font-size:0.85rem; color:#64748b;">No staff available.</div>'}</div>
                    <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
                        <button type="button" class="action-btn secondary" onclick="document.getElementById('${t}')?.remove()" style="padding:0.55rem 0.9rem;">Cancel</button>
                        <button type="button" id="delegate-confirm-btn" class="action-btn" onclick="window.app_confirmDelegateTask()" style="padding:0.55rem 0.9rem;" disabled>Delegate</button>
                    </div>
                </div>
            </div>`;window.app_showModal(r,t)};window.app_filterDelegateUsers=function(a){const e=String(a||"").toLowerCase().trim();Array.from(document.querySelectorAll("#delegate-picker-list .delegate-picker-item")).forEach(t=>{const n=t.getAttribute("data-name")||"";t.style.display=!e||n.includes(e)?"flex":"none"})};window.app_selectDelegateUser=function(a){if(!window.app_delegateModalContext)return;window.app_delegateModalContext.selectedUserId=a,Array.from(document.querySelectorAll("#delegate-picker-list .delegate-picker-item")).forEach(t=>{t.classList.toggle("selected",t.getAttribute("data-user-id")===a)});const e=document.getElementById("delegate-confirm-btn");e&&(e.disabled=!a)};window.app_confirmDelegateTask=async function(){const a=window.app_delegateModalContext;if(!a||!a.selectedUserId)return alert("Please select a staff member.");document.getElementById("delegate-task-modal")?.remove(),await window.app_delegateTo(a.planId,a.taskIndex,a.selectedUserId)};window.app_formatTaskWithPostponeChip=function(a){const e=String(a||""),t=e.match(/^(.*)\s+\(Postponed from ([^)]+)\)\s*$/i);if(!t)return e;const n=t[1].trim(),s=t[2].trim();return`${n} <span class="postponed-source-chip">Postponed from ${s}</span>`};window.app_appendCompletedTaskToSummary=async function(a,e){const n=(await window.AppDB.get("work_plans",a))?.plans?.[e];if(!n)return;const s=n.subPlans&&n.subPlans.length?` (${n.subPlans.join(", ")})`:"",i=`- ${n.task}${s}`,o=document.getElementById("checkout-work-summary"),r=(o?.value||window.app_checkoutSummaryDraft||"").trim(),d=r.split(`
`).some(c=>c.trim()===i.trim())?r:r?`${r}
${i}`:i;window.app_checkoutSummaryDraft=d,o&&(o.value=d,window.app_updateCharCounter&&window.app_updateCharCounter(o))};window.app_handleChecklistAction=async function(a,e,t){const n=document.getElementById("checkout-task-checklist"),s=document.getElementById("delegate-panel");window.app_checkoutTaskActions=window.app_checkoutTaskActions||{};const i=`${a}:${e}`;if(!t){delete window.app_checkoutTaskActions[i],window.app_checkoutTaskDetails&&delete window.app_checkoutTaskDetails[i],s&&(s.style.display="none"),n&&n.classList.remove("delegate-open");const l=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Pe(i)}"]`);l&&l.remove();const d=document.querySelector(`.checkout-task-detail-btn[data-checkout-detail-key="${Pe(i)}"]`);d&&(d.disabled=!0),window.app_renderCheckoutActionPreview();return}window.app_checkoutTaskActions[i]=t,window.app_checkoutTaskDetails=window.app_checkoutTaskDetails||{};const o=window.app_checkoutTaskDetails[i]||{action:"",progressPercent:0,progressStatus:"waiting",progressNote:"",actionMeta:{}};o.action=t,t==="complete"&&(o.progressPercent=100,o.progressStatus="done",await window.app_appendCompletedTaskToSummary(a,e)),t==="postpone"&&(o.actionMeta?.postponeDate||(o.actionMeta=o.actionMeta||{},o.actionMeta.postponeDate=new Date(Date.now()+864e5).toISOString().split("T")[0])),window.app_checkoutTaskDetails[i]=o,s&&(s.style.display="none"),n&&n.classList.remove("delegate-open");const r=document.querySelector(`.checkout-task-detail-btn[data-checkout-detail-key="${Pe(i)}"]`);r&&(r.disabled=!1),window.app_openCheckoutActionModal(i),window.app_clearCheckoutTaskError(i),window.app_renderCheckoutActionPreview()};window.app_markTaskCompleted=async function(a,e){try{const t=new Date().toISOString().split("T")[0];await window.AppCalendar.updateTaskStatus(a,e,"completed",t),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert("Task marked as completed."),typeof Fe=="function"&&await Fe()}catch(t){alert("Failed to mark completed: "+t.message)}};window.app_delegateTask=async function(a,e){try{const t=await window.AppDB.getAll("users"),n=t.map(o=>o.name).join(", "),s=await window.appPrompt(`Delegate to which staff? Enter name.
Available: ${n}`,"",{title:"Delegate Task",placeholder:"Type staff name"});if(!s)return;const i=t.find(o=>o.name.toLowerCase()===s.toLowerCase());if(!i){alert("Staff not found.");return}await window.app_delegateTo(a,e,i.id)}catch(t){alert("Failed to delegate task: "+t.message)}};window.app_delegateTo=async function(a,e,t){try{const n=await window.AppDB.get("work_plans",a);if(!n||!n.plans||!n.plans[e]){alert("Task not found.");return}const s=window.AppAuth.getUser(),i=n.plans[e],o=i.subPlans&&i.subPlans.length?` — ${i.subPlans.join(", ")}`:"",r=`${i.task}${o}`;i.tags||(i.tags=[]);const d=(await window.AppDB.getAll("users")).find(p=>p.id===t);if(!d){alert("Staff not found.");return}i.tags.some(p=>p.id===d.id)||i.tags.push({id:d.id,name:d.name,status:"pending"}),i.status=i.status||"pending",n.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",n),await window.AppCalendar.addWorkPlanTask(n.date,d.id,r,[{id:s.id,name:s.name,status:"pending"}],{addedFrom:"delegated",sourcePlanId:a,sourceTaskIndex:e,taggedById:s.id,taggedByName:s.name,status:"pending",subPlans:i.subPlans||[]});const c=await window.AppDB.get("users",d.id);c&&(c.notifications||(c.notifications=[]),c.notifications.unshift({id:`task_${Date.now()}`,type:"task",title:i.task||"Delegated task",description:i.subPlans&&i.subPlans.length>0?i.subPlans.join(", "):"",taggedById:s.id,taggedByName:s.name,taggedAt:new Date().toISOString(),status:"pending",source:"delegation",date:new Date().toLocaleString(),read:!1}),await window.AppDB.put("users",c)),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert(`Task delegated to ${d.name}.`),typeof Fe=="function"&&await Fe()}catch(n){alert("Failed to delegate task: "+n.message)}};function $s(a,e,t,n){if(!a||!e||!t||!n)return 0;const s=6371e3,i=a*Math.PI/180,o=t*Math.PI/180,r=(t-a)*Math.PI/180,l=(n-e)*Math.PI/180,d=Math.sin(r/2)*Math.sin(r/2)+Math.cos(i)*Math.cos(o)*Math.sin(l/2)*Math.sin(l/2),c=2*Math.atan2(Math.sqrt(d),Math.sqrt(1-d));return s*c}const xs=480*60*1e3,vr=540*60*1e3,_n=(a,e)=>{if(!a||!e)return null;const t=String(a).trim(),n=String(e).trim();if(!t||!n||n.toLowerCase().includes("active now"))return null;const s=new Date(`${t}T${n}`);if(!Number.isNaN(s.getTime()))return s;const i=new Date(`${t} ${n}`);return Number.isNaN(i.getTime())?null:i},Sr=async(a,e,t)=>{if(!a||!window.AppDB||t<=e)return!1;const n=await window.AppDB.getAll("attendance"),s=String(a);return(n||[]).some(i=>{if(!i||String(i.user_id||"")!==s||!i.isManualOverride)return!1;const o=_n(i.date,i.checkIn),r=_n(i.date,i.checkOut);if(!o||!r)return!1;let l=o.getTime(),d=r.getTime();d<=l&&(d+=1440*60*1e3);const c=Math.max(e,l);return Math.min(t,d)>c})},kr=async a=>{const e={showPrompt:!1,hasManualLog:!1,overtimeStartMs:null,overtimeEndMs:null};if(!a||!a.lastCheckIn)return e;const t=Number(a.lastCheckIn);if(!Number.isFinite(t))return e;const n=Date.now();if(n-t<=vr)return e;const i=t+xs;return await Sr(a.id,i,n)?{showPrompt:!1,hasManualLog:!0,overtimeStartMs:i,overtimeEndMs:n}:{showPrompt:!0,hasManualLog:!1,overtimeStartMs:i,overtimeEndMs:n}};window.app_prepareCheckoutOvertimeSection=async a=>{const e=document.getElementById("checkout-overtime-section"),t=document.getElementById("checkout-overtime-explanation"),n=document.getElementById("checkout-overtime-mode"),s=document.getElementById("checkout-overtime-hint");if(window.app_checkoutOvertimeState={showPrompt:!1,hasManualLog:!1},!(!e||!t||!n)){e.style.display="none",t.required=!1,t.value="",n.value="overtime_work",document.querySelectorAll(".overtime-reason-btn").forEach(i=>{i.style.background="#fef3c7",i.style.borderColor="#fcd34d",i.style.color="#92400e"});try{const i=await kr(a);if(window.app_checkoutOvertimeState=i,!i.showPrompt)return;s&&(s.textContent="You worked over 1 hour extra. Please capture what was done during overtime."),e.style.display="block",t.required=!0}catch(i){console.warn("Overtime prompt check failed:",i)}}};async function Fe(){const a=document.getElementById("attendance-btn"),e=document.getElementById("location-text"),{status:t}=await window.AppAttendance.getStatus();a&&(a.disabled=!0),ke=!0;try{if(t==="out"){a&&(a.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Locating...');const n=await pt(),s=`Lat: ${n.lat.toFixed(4)}, Lng: ${n.lng.toFixed(4)}`;e&&(e.innerHTML=`<i class="fa-solid fa-location-dot"></i> ${s}`);const i=await window.AppAttendance.checkIn(n.lat,n.lng,s);if(i&&i.conflict){window.app_showSyncToast(i.message||"Status updated from another device."),window.app_refreshDashboard&&await window.app_refreshDashboard();return}wt(),window.app_refreshDashboard&&await window.app_refreshDashboard(),i&&i.resolvedMissedCheckout&&i.noticeMessage&&window.app_showAttendanceNotice(i.noticeMessage),i&&i.missedCheckoutReasonRequired&&i.missedCheckoutLogId&&window.app_promptMissedCheckoutReason({logId:i.missedCheckoutLogId,date:i.missedCheckoutDate}),window.AppDayPlan&&typeof window.AppDayPlan.openDayPlan=="function"&&await window.AppDayPlan.openDayPlan(Sn(),null,null,{hideAutoForwardedTasks:!0,skipCarryForwardSync:!0,skipCarryForwardCleanup:!0})}else{const n=window.AppAuth.getUser(),s=Sn(),i=await window.AppCalendar.getWorkPlan(n.id,s,{includeAnnual:!0,mergeAnnual:!0}),o=await window.AppCalendar.getCollaborations(n.id,s);window.app_checkoutSummaryDate!==s&&(window.app_checkoutSummaryDate=s,window.app_checkoutSummaryDraft=""),window.app_checkoutActionDate!==s&&(window.app_checkoutActionDate=s,window.app_checkoutTaskActions={},window.app_checkoutTaskDetails={},window.app_checkoutTaskMeta={},window.app_checkoutUserMap={});const r=document.getElementById("modal-container");r&&!document.getElementById("checkout-modal")&&r.insertAdjacentHTML("beforeend",K.renderModals());const l=document.getElementById("checkout-modal");if(l){const d=document.getElementById("checkout-plan-text"),c=l.querySelector('textarea[name="description"]');if(i&&(i.plans||i.plan)){let m="",h="";if(i.plans&&i.plans.length>0?(m=i.plans.map((x,D)=>`<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; padding-bottom:12px; border-bottom:1px dashed #e9d5ff;">
                                    <div style="flex:1;">
                                        <div style="font-weight:600; color:#4c1d95;">${window.app_formatTaskWithPostponeChip(x.task)}</div>
                                        ${x.subPlans&&x.subPlans.length>0?`<div style="font-size:0.75rem; color:#7c3aed; margin-top:2px;">👣 ${x.subPlans.join(", ")}</div>`:""}
                                    </div>
                                    <div style="display:flex; gap:6px; flex-shrink:0;">
                                        ${x.status==="completed"?'<span style="font-size:0.75rem; color:#059669; font-weight:700;">✅ Done</span>':`<button type="button" onclick="window.app_postponeTask('${x._planId||i.id}', ${typeof x._taskIndex=="number"?x._taskIndex:D})" style="background:#f3e8ff; color:#7c3aed; border:1px solid #ddd6fe; border-radius:8px; padding:6px 12px; font-size:0.8rem; font-weight:600; cursor:pointer;" onmouseover="this.style.background='#ddd6fe'" onmouseout="this.style.background='#f3e8ff'">⌛ Postpone</button>`}
                                    </div>
                                </div>`).join(""),h=i.plans.filter(x=>window.AppCalendar.getSmartTaskStatus(i.date,x.status)==="completed").map(x=>{let D=`• ${x.task}`;return x.subPlans&&x.subPlans.length>0&&(D+=` (${x.subPlans.join(", ")})`),D}).join(`
`)):i.plan&&(m=`<div style="font-weight:600; color:#4c1d95;">${i.plan}</div>`,h=`• ${i.plan}`,i.subPlans&&i.subPlans.length>0&&(m+=`<div style="font-size:0.75rem; color:#7c3aed; margin-top:2px;">👣 ${i.subPlans.join(", ")}</div>`,h+=` (${i.subPlans.join(", ")})`)),o&&o.length>0){const b=o.map(x=>x.plans.filter(D=>D.tags&&D.tags.some(T=>T.id===n.id&&T.status==="accepted")).map(D=>{let T=`🤝 [Collaborated with ${x.userName}] ${D.task}`;return D.subPlans&&D.subPlans.length>0&&(T+=`
👣 Steps: `+D.subPlans.join(", ")),T}).join(`
`)).join(`

`);m?m+=`

`+b:m=b}d&&(d.innerHTML=m),d&&(d.dataset.rawText=h),c&&!c.value.trim()&&window.app_checkoutSummaryDraft&&(c.value=window.app_checkoutSummaryDraft,window.app_updateCharCounter&&window.app_updateCharCounter(c));const f=document.getElementById("checkout-task-list"),g=document.getElementById("delegate-panel"),S=document.getElementById("delegate-list"),A=document.getElementById("delegate-selected-task");if(f)if(i&&Array.isArray(i.plans)&&i.plans.length>0){const b=await window.AppDB.getAll("users").catch(()=>[]);window.app_checkoutUserMap={},(b||[]).forEach(_=>{window.app_checkoutUserMap[String(_.id)]=_.name});const x=window.AppAuth.getUser(),D=(b||[]).filter(_=>_.id!==x.id),T=i.plans.map((_,E)=>{const M=_.subPlans&&_.subPlans.length?` — ${_.subPlans.join(", ")}`:"",w=`${_.task}${M}`,y=_._planId||i.id,k=typeof _._taskIndex=="number"?_._taskIndex:E,P=window.AppCalendar.getSmartTaskStatus(_._planDate||i.date,_.status),R=`${y}:${k}`;window.app_checkoutTaskMeta=window.app_checkoutTaskMeta||{},window.app_checkoutTaskMeta[R]={text:w,planId:y,taskIndex:k};const B=(window.app_checkoutTaskActions&&window.app_checkoutTaskActions[R]?window.app_checkoutTaskActions[R]:"")||(_.status==="completed"||P==="completed"?"complete":_.status==="postponed"?"postpone":""),O=window.app_initCheckoutTaskDetails(y,k,_),F=O.action||B||"";F&&O.action!==F&&(O.action=F,F==="complete"&&(O.progressPercent=100,O.progressStatus="done")),window.app_checkoutTaskActions&&F&&(window.app_checkoutTaskActions[R]=F);const U=P==="completed"?"Completed":P==="in-process"?"In Process":P==="overdue"?"Overdue":P==="to-be-started"?"To Be Started":_.status||"Pending",W=G(O.actionMeta?.postponeDate||new Date(Date.now()+864e5).toISOString().split("T")[0]),$=G(O.actionMeta?.postponeReason||""),I=G(O.actionMeta?.delegateUserId||""),H=G(O.actionMeta?.delegateNote||""),L=G(O.actionMeta?.completionNote||""),z=G(O.progressNote||"");return`
                                        <div class="checkout-task-row">
                                            <div class="checkout-task-copy">
                                                <div class="checkout-task-title">${window.app_formatTaskWithPostponeChip(w)}</div>
                                                <div class="checkout-task-status">Status: ${U}</div>
                                            </div>
                                            <div class="checkout-task-controls">
                                                <select onchange="window.app_handleChecklistAction('${y}', ${k}, this.value)" class="checkout-task-action-select">
                                                    <option value="" ${F?"":"selected"}>Choose Action</option>
                                                    <option value="complete" ${F==="complete"?"selected":""}>Complete</option>
                                                    <option value="postpone" ${F==="postpone"?"selected":""}>Postpone</option>
                                                    <option value="delegate" ${F==="delegate"?"selected":""}>Delegate</option>
                                                </select>
                                                <button type="button" class="checkout-task-detail-btn" data-checkout-detail-key="${G(R)}" onclick="window.app_openCheckoutActionModal('${ce(R)}')" ${F?"":"disabled"}>Details</button>
                                            </div>
                                        </div>`}).join("");if(f.innerHTML=T,window.app_renderCheckoutActionPreview(),g&&S&&A){g.style.display="none";const _=document.getElementById("checkout-task-checklist");_&&_.classList.remove("delegate-open"),S.innerHTML=D.map(E=>`
                                        <button type="button" data-user-id="${E.id}" class="delegate-user-btn">
                                            <img src="${E.avatar}" alt="${E.name}" class="delegate-user-avatar">
                                            <span style="flex:1;">${E.name}</span>
                                        </button>
                                    `).join("")}}else f.innerHTML='<div style="font-size:0.8rem; color:#6b7280;">No tasks planned for today.</div>',window.app_renderCheckoutActionPreview()}await window.app_prepareCheckoutOvertimeSection(n),l.style.display="flex",a&&(a.disabled=!1);const p=document.getElementById("checkout-location-mismatch"),u=document.getElementById("checkout-location-loading");u&&(u.style.display="block"),p&&(p.style.display="none"),(async()=>{try{const m=await pt(),h=n.currentLocation||n.lastLocation;u&&(u.style.display="none"),h&&h.lat&&h.lng&&($s(m.lat,m.lng,h.lat,h.lng)>500?p&&(p.style.display="block"):p&&(p.style.display="none"))}catch(m){console.warn("Background location check failed:",m),u&&(u.style.display="none")}})()}else{const d=await pt(),c=`Lat: ${Number(d.lat).toFixed(4)}, Lng: ${Number(d.lng).toFixed(4)}`,p=await window.AppAttendance.checkOut("",d.lat,d.lng,c,!1,"");p&&!p.conflict&&wt(),p&&p.conflict&&window.app_showSyncToast(p.message||"Status updated from another device."),await Ne()}}}catch(n){alert(n.message||n),a&&(a.disabled=!1,a.innerHTML=t==="out"?'Check-in <i class="fa-solid fa-fingerprint"></i>':'Check-out <i class="fa-solid fa-fingerprint"></i>')}finally{ke=!1}}window.app_pauseSession=async function(){if(ke)return;ke=!0;const a=document.getElementById("attendance-btn"),e=document.getElementById("attendance-pause-btn");try{a&&(a.disabled=!0),e&&(e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Pausing...');const t=await window.AppAttendance.pauseSession();if(t&&t.conflict){window.app_showSyncToast(t.message||"Status updated from another device."),await Ne();return}t&&t.ok&&(window.AppActivity&&window.AppActivity.stop&&window.AppActivity.stop(),wt(),await Ne())}catch(t){alert(t.message||t)}finally{ke=!1}};window.app_resumeSession=async function(){if(ke)return;ke=!0;const a=document.getElementById("attendance-btn"),e=document.getElementById("attendance-pause-btn");try{a&&(a.disabled=!0),e&&(e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Resuming...');const t=await window.AppAttendance.resumeSession();if(t&&t.conflict){window.app_showSyncToast(t.message||"Status updated from another device."),await Ne();return}t&&t.ok&&(window.AppActivity&&window.AppActivity.start&&window.AppActivity.start(),wt(),await Ne())}catch(t){alert(t.message||t)}finally{ke=!1}};window.app_triggerCheckoutFromButton=function(a){const e=a?.closest?a.closest("form"):document.getElementById("checkout-form");if(!e){alert("Check-out form is not available. Please close and reopen the checkout window.");return}return window.app_submitCheckOut({preventDefault:()=>{},target:e,submitter:a||null})};window.app_showCheckoutValidationPopup=async function(a=[]){const e=Array.isArray(a)?a.map(n=>String(n||"").trim()).filter(Boolean):[String(a||"").trim()].filter(Boolean);if(!e.length)return;const t=e.map((n,s)=>`${s+1}. ${n}`).join(`
`);if(window.appAlert){await window.appAlert(t,"Checkout Incomplete");return}alert(t)};window.app_submitCheckOut=async function(a){a.preventDefault();const e=a?.target?.tagName==="FORM"?a.target:a?.submitter?.closest?a.submitter.closest("form"):document.getElementById("checkout-form");if(!e){alert("Check-out form is not available. Please close and reopen the checkout window.");return}const t=String(e.description?.value||"").trim(),n=a?.submitter||e.querySelector('button[type="submit"]')||e.querySelector(".action-btn");ke=!0;try{n&&(n.disabled=!0,n.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Locating & Saving...'),Object.keys(window.app_checkoutTaskDetails||{}).forEach(b=>window.app_clearCheckoutTaskError(b));const{updates:i,errors:o}=window.app_collectCheckoutTaskUpdates();if(o.length>0){o.forEach(x=>window.app_setCheckoutTaskError(x.key,x.message));const b=o[0]?.key;if(b){const x=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Pe(b)}"]`);x&&x.scrollIntoView({behavior:"smooth",block:"center"})}await window.app_showCheckoutValidationPopup(o.map(x=>x.message)),n&&(n.disabled=!1,n.textContent="Complete Check-Out");return}if(i.some(b=>b&&(b.action==="postpone"||b.action==="delegate"))&&!t){await window.app_showCheckoutValidationPopup("Please add a short check-out summary when postponing or delegating tasks."),e.description?.focus(),n&&(n.disabled=!1,n.textContent="Complete Check-Out");return}let l=null;try{l=await Promise.race([pt(),new Promise((x,D)=>setTimeout(()=>D(new Error("Location request timed out.")),9e3))])}catch(b){const x=String(b?.message||b||"Unable to capture location.");await window.app_showCheckoutValidationPopup(`Location is required for check-out. ${x}`),n&&(n.disabled=!1,n.textContent="Complete Check-Out");return}let d=!1;const c=window.AppAuth.getUser()?.currentLocation;c&&c.lat&&c.lng&&l.lat&&l.lng&&$s(l.lat,l.lng,c.lat,c.lng)>500&&(d=!0);let p=e.locationExplanation?e.locationExplanation.value.trim():"";const u=window.app_checkoutOvertimeState||{},m=e.overtimeExplanation?e.overtimeExplanation.value.trim():"",h=e.overtimeMode?String(e.overtimeMode.value||"overtime_work"):"overtime_work",f={};if(u.showPrompt){if(!m){await window.app_showCheckoutValidationPopup("Please describe the overtime work before checkout."),n&&(n.disabled=!1,n.textContent="Complete Check-Out");return}if(f.overtimePrompted=!0,f.overtimeExplanation=m,f.overtimeReasonTag=h,h==="forgot_checkout"){const b=Number(window.AppAuth.getUser()?.lastCheckIn);Number.isFinite(b)&&(f.checkOutTime=new Date(b+xs).toISOString(),f.overtimeCappedToEightHours=!0)}}i.length>0&&(f.taskUpdates=i.map(b=>({planId:b.planId,taskIndex:b.taskIndex,action:b.action,progressPercent:b.progressPercent,progressStatus:b.progressStatus,progressNote:b.progressNote,actionMeta:b.actionMeta||{},timestamp:b.timestamp})));const g=`Lat: ${Number(l.lat).toFixed(4)}, Lng: ${Number(l.lng).toFixed(4)}`,S=e.tomorrowGoal?e.tomorrowGoal.value.trim():"";if(S){const b=new Date(Date.now()+864e5).toISOString().split("T")[0];await window.AppCalendar.addWorkPlanTask(b,window.AppAuth.getUser().id,S),console.log("Tomorrow's goal saved:",S)}const A=await window.AppAttendance.checkOut(t,l?l.lat:null,l?l.lng:null,g,d,p,f);if(A&&A.conflict){const b=document.getElementById("checkout-modal");b&&(b.style.display="none"),window.app_showSyncToast(A.message||"Status updated from another device."),await Ne();return}if(wt(),window.app_checkoutSummaryDraft="",window.app_checkoutTaskActions={},window.app_checkoutTaskDetails={},window.app_checkoutTaskMeta={},window.app_checkoutUserMap={},window.app_renderCheckoutActionPreview(),document.getElementById("checkout-modal").style.display="none",i.length>0)try{await window.app_applyCheckoutTaskUpdates(i)}catch(b){console.error("Checkout task side-effects failed after successful checkout:",b),window.app_showSyncToast?window.app_showSyncToast(`Checked out, but some task updates need review: ${b.message||b}`):alert(`Checked out, but some task updates need review: ${b.message||b}`)}await Ne()}catch(s){alert("Check-out failed: "+s.message),n&&(n.disabled=!1,n.textContent="Complete Check-Out")}finally{ke=!1}};async function Ar(a){a.preventDefault();const e=new FormData(a.target),t=Va(e.get("checkIn"),e.get("checkOut"));if(t==="Invalid"){alert("End time must be after Start time");return}const n=e.get("date"),s=e.get("checkIn"),i=e.get("checkOut"),o=window.AppAttendance.buildDateTime(n,s),r=window.AppAttendance.buildDateTime(n,i),l=o&&r?r-o:0,d=Math.max(0,l)/(1e3*60*60),c=d>=4;let p="Work Log",u=0;d>=8?(p="Present",u=1):d>=4&&(p="Half Day",u=.5);const m={date:e.get("date"),checkIn:s,checkOut:i,duration:t,durationMs:l,location:e.get("location"),workDescription:e.get("location"),type:p,dayCredit:u,lateCountable:!1,extraWorkedMs:0,policyVersion:"v2",entrySource:"staff_manual_work",attendanceEligible:c,isManualOverride:!1};await window.AppAttendance.addManualLog(m),alert("Log added successfully!"),document.getElementById("log-modal").style.display="none",ne.innerHTML=await K.renderTimesheet()}async function Dr(a){a.preventDefault();const e=new FormData(a.target),t=e.get("name").trim(),n=e.get("username").trim(),s=e.get("password").trim(),i=e.get("email").trim(),o=e.get("isAdmin")==="on"||e.get("isAdmin")==="true",r=e.get("canManageAttendanceSheet")==="on"||e.get("canManageAttendanceSheet")==="true";let l;try{l=Xe(e)}catch(c){alert(c.message);return}const d={id:"u"+Date.now(),name:t,username:n,password:s,role:e.get("role"),dept:e.get("dept"),email:i,phone:e.get("phone"),joinDate:e.get("joinDate"),isAdmin:o,canManageAttendanceSheet:r,canManageBirthdays:!1,birthDay:l.birthDay,birthMonth:l.birthMonth,birthYear:l.birthYear,permissions:window.app_getPermissionsFromUI("add"),avatar:`https://ui-avatars.com/api/?name=${e.get("name")}&background=random&color=fff`,status:"out",lastCheckIn:null};try{d.isAdmin?(d.role="Administrator",d.canManageAttendanceSheet=!0,d.canManageBirthdays=!0,d.permissions={...d.permissions||{},birthday:"admin"}):(d.isAdmin=!1,d.canManageBirthdays=d.permissions?.birthday==="admin"),await window.AppDB.add("users",d),alert("Success! Account created."),document.getElementById("add-user-modal").style.display="none";const c=document.getElementById("page-content");c&&(c.innerHTML=await K.renderAdmin())}catch(c){alert("Error creating user: "+c.message)}}window.app_getPermissionsFromUI=a=>{const e={};return["dashboard","leaves","users","attendance","reports","minutes","policies","birthday"].forEach(n=>{const s=document.getElementById(`${a}-perm-${n}-view`),i=document.getElementById(`${a}-perm-${n}-admin`);i&&i.checked?e[n]="admin":s&&s.checked?e[n]="view":e[n]=null}),e};window.app_submitEditUser=async a=>{a&&a.preventDefault();const e=a&&a.target&&a.target.tagName==="FORM"?a.target:document.getElementById("edit-user-form");if(!e){console.error("Critical Failure: Edit user form not found."),alert("Error: Form missing.");return}const t=new FormData(e),n=(t.get("id")||"").trim();if(!n){console.error("Data Failure: No 'id' name attribute found in form data.",{target:a.target,allData:Object.fromEntries(t.entries())}),alert("Error: User ID missing. Please refresh.");return}const s=e.querySelector('[name="isAdmin"]'),i=!!(s&&s.checked),o=e.querySelector('[name="canManageAttendanceSheet"]'),r=!!(o&&o.checked),l=String(t.get("pan")||"").trim().toUpperCase(),d=String(t.get("bankIfsc")||"").trim().toUpperCase(),c=String(t.get("joinDate")||"").trim(),p=String(t.get("employeeId")||"").trim();let u;try{u=Xe(t)}catch(S){alert(S.message);return}const m=/^[A-Z]{5}[0-9]{4}[A-Z]$/,h=/^[A-Z]{4}0[A-Z0-9]{6}$/;if(c){const S=new Date,A=`${S.getFullYear()}-${String(S.getMonth()+1).padStart(2,"0")}-${String(S.getDate()).padStart(2,"0")}`;if(c>A){alert("Join Date cannot be in the future.");return}}if(l&&!m.test(l)){alert("Invalid PAN format. Use format like ABCDE1234F");return}if(d&&!h.test(d)){alert("Invalid IFSC format. Use format like SBIN0001234");return}const f=c?p||Kt(c,n):"NA",g={id:n,name:(t.get("name")||"").trim(),username:(t.get("username")||"").trim(),password:(t.get("password")||"").trim(),role:t.get("role"),dept:t.get("dept"),email:(t.get("email")||"").trim(),phone:(t.get("phone")||"").trim(),isAdmin:i,canManageAttendanceSheet:r,canManageBirthdays:!1,employeeId:f,joinDate:c||null,birthDay:u.birthDay,birthMonth:u.birthMonth,birthYear:u.birthYear,baseSalary:Number(t.get("baseSalary")||0),otherAllowances:Number(t.get("otherAllowances")||0),providentFund:Number(t.get("providentFund")||0),professionalTax:Number(t.get("professionalTax")||0),loanAdvance:Number(t.get("loanAdvance")||0),tdsPercent:Number(t.get("tdsPercent")||0),bankName:(t.get("bankName")||"").trim(),bankAccount:(t.get("bankAccount")||"").trim(),bankIfsc:d,pan:l,uan:(t.get("uan")||"").trim(),permissions:window.app_getPermissionsFromUI("edit")};console.log("Executing Update for User:",g),g.isAdmin?(g.canManageAttendanceSheet=!0,g.canManageBirthdays=!0,g.role="Administrator",g.permissions={...g.permissions||{},birthday:"admin"}):g.canManageBirthdays=g.permissions?.birthday==="admin";try{if(await window.AppAuth.updateUser(g)){console.log("Success: User updated in DB."),alert(`SUCCESS: Details for '${g.name}' have been saved.`),document.getElementById("edit-user-modal").style.display="none";const A=document.getElementById("page-content");A&&setTimeout(async()=>{A.innerHTML=await K.renderAdmin(),window.AppAnalytics&&await window.AppAnalytics.initAdminCharts()},50)}else alert("Update failed: User not found.")}catch(S){console.error("Update Error:",S),alert("Error: "+S.message)}};function Va(a,e){const[t,n]=a.split(":"),[s,i]=e.split(":"),o=parseInt(s)*60+parseInt(i)-(parseInt(t)*60+parseInt(n));if(o<0)return"Invalid";const r=Math.floor(o/60),l=o%60;return`${r}h ${l}m`}function Ue(){const a=document.getElementById("attendance-btn"),e=!!window.app_dashboardReadOnly,t=window.app_dashboardTargetUser||null;a&&!e&&a.addEventListener("click",Fe),cr(t,e),ht(),window.app_refreshNotificationBell&&window.app_refreshNotificationBell().catch(()=>{}),window.app_attachStatsCardHandlers&&window.app_attachStatsCardHandlers()}window.setupDashboardEvents=Ue;async function Ne(){const a=document.getElementById("page-content");if(a)try{a.innerHTML=await K.renderDashboard(),Ue()}catch(e){console.error("Dashboard refresh after attendance failed:",e),typeof window.app_showSyncToast=="function"&&window.app_showSyncToast("Attendance saved. Refresh the page if the dashboard looks stale.")}}window.app_refreshDashboard=Ne;window.app_refreshCurrentPage=async function(){await xa()};document.addEventListener("submit",a=>{if(a.preventDefault(),a.target?.classList?.contains("day-plan-form"))return;const e=String(a.target.getAttribute("id")||"");if(e==="manual-log-form")Ar(a);else if(e==="checkout-form")window.app_submitCheckOut(a);else if(e==="add-user-form")Dr(a);else if(e==="login-form")(async()=>{const t=new FormData(a.target);try{const n=await pt();if(!await window.AppAuth.login(t.get("username"),t.get("password"))){alert("Invalid Credentials");return}const i=window.AppAuth.getUser();i&&(i.lastLoginLocation={lat:n.lat,lng:n.lng,capturedAt:Date.now()},await window.AppDB.put("users",i)),window.location.reload()}catch(n){const s=String(n);s.includes("permission-denied")||s.includes("FirebaseError")?alert(`Database Error: ${s}

Access to the database was blocked. Please check your Firebase Firestore Security Rules.`):alert(`Login blocked: ${s}

Please enable location and try again.`)}})();else if(e==="edit-user-form")console.log("Routing to app_submitEditUser..."),window.app_submitEditUser(a);else if(e==="birthday-details-form")window.app_submitBirthdayDetails(a);else if(e==="birthday-external-form")window.app_submitExternalBirthdayPerson(a);else if(e.startsWith("birthday-month-form-")){const t=Number(e.replace("birthday-month-form-",""));window.app_submitBirthdayMonthForm(a,t)}else e==="notify-form"?$r(a):e==="leave-request-form"?_r(a):console.warn("Unhandled form submission ID:",e,"Target:",a.target)});async function _r(a){a.preventDefault();const e=a.target;if(!e||e.dataset.submitting==="1")return;e.dataset.submitting="1";const t=new FormData(a.target),n=window.AppAuth.getUser(),s=t.get("startDate");let i=t.get("endDate");const o=t.get("type"),r=e.querySelector('button[type="submit"]'),l=r?r.innerHTML:"";try{r&&(r.disabled=!0,r.innerHTML="Submitting..."),o==="Half Day"&&(i=s),await window.AppLeaves.requestLeave({userId:n.id,userName:n.name,startDate:s,endDate:i,startTime:t.get("startTime")||"",endTime:t.get("endTime")||"",type:o,reason:t.get("reason"),durationHours:t.get("durationHours")||""}),alert("Leave requested successfully!"),document.getElementById("leave-modal").style.display="none",a.target.reset()}finally{e.dataset.submitting="0",r&&(r.disabled=!1,r.innerHTML=l)}}async function $r(a){a.preventDefault();const e=new FormData(a.target),t=e.get("toUserId"),n=e.get("reminderMessage")||"",s=e.get("reminderLink")||"",i=e.get("taskTitle")||"",o=e.get("taskDescription")||"",r=e.get("taskDueDate")||"";try{if(!n.trim()&&!i.trim()){alert("Please enter a reminder or a task.");return}const l=await window.AppDB.get("users",t);if(!l)throw new Error("User not found");const d=window.AppAuth.getUser(),c=new Date().toISOString();l.notifications||(l.notifications=[]),n.trim()&&(l.notifications.unshift({id:`rem_${Date.now()}`,type:"reminder",message:n.trim(),taggedById:d.id,taggedByName:d.name,taggedAt:c,status:"pending",date:c,read:!1}),await window.AppDB.add("staff_messages",{id:`msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"text",message:n.trim(),link:s.trim(),fromId:d.id,fromName:d.name,toId:t,toName:l.name,createdAt:c,read:!1})),i.trim()&&(l.notifications.unshift({id:`task_${Date.now()}`,type:"task",title:i.trim(),description:o.trim(),taggedById:d.id,taggedByName:d.name,taggedAt:c,status:"pending",dueDate:r||"",date:c,read:!1}),await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:i.trim(),description:o.trim(),dueDate:r||"",status:"pending",fromId:d.id,fromName:d.name,toId:t,toName:l.name,createdAt:c,read:!1,history:[{action:"created",byId:d.id,byName:d.name,at:c}]})),await window.AppAuth.updateUser(l),alert("Notification sent!"),document.getElementById("notify-modal").style.display="none",window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()}catch(l){alert("Failed to send: "+l.message)}}window.app_openStaffThread=async a=>{window.app_staffThreadId=a;const e=window.AppAuth.getUser();if(!e)return;const n=(await window.app_getMyMessages()).filter(i=>i.toId===e.id&&i.fromId===a&&!i.read);for(const i of n)i.read=!0,i.readAt=new Date().toISOString(),await window.AppDB.put("staff_messages",i);const s=document.getElementById("page-content");s&&(s.innerHTML=await K.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_sendStaffText=async a=>{a.preventDefault();const e=window.AppAuth.getUser(),t=new FormData(a.target),n=t.get("toUserId"),s=(t.get("message")||"").trim(),i=(t.get("link")||"").trim();if(!s){alert("Please type a message.");return}const o=await window.AppDB.get("users",n);if(!o){alert("Staff member not found.");return}await window.AppDB.add("staff_messages",{id:`msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"text",message:s,link:i,fromId:e.id,fromName:e.name,toId:n,toName:o.name,createdAt:new Date().toISOString(),read:!1}),a.target.reset();const r=document.getElementById("staff-message-modal");r&&r.remove();const l=document.getElementById("page-content");l&&(l.innerHTML=await K.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_sendStaffTask=async a=>{a.preventDefault();const e=window.AppAuth.getUser(),t=new FormData(a.target),n=t.get("toUserId"),s=(t.get("taskTitle")||"").trim(),i=(t.get("taskDescription")||"").trim(),o=(t.get("taskDueDate")||"").trim();if(!s){alert("Please provide a task title.");return}const r=await window.AppDB.get("users",n);if(!r){alert("Staff member not found.");return}await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:s,description:i,dueDate:o,status:"pending",fromId:e.id,fromName:e.name,toId:n,toName:r.name,createdAt:new Date().toISOString(),read:!1,history:[{action:"created",byId:e.id,byName:e.name,at:new Date().toISOString()}]}),a.target.reset();const l=document.getElementById("staff-task-modal");l&&l.remove();const d=document.getElementById("page-content");d&&(d.innerHTML=await K.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_openStaffMessageModal=(a,e)=>{if(!a){alert("Select a staff member first.");return}const n=`
            <div class="modal-overlay" id="staff-message-modal" style="display:flex;">
                <div class="modal-content staff-message-modal">
                    <div class="staff-modal-head">
                        <div>
                            <h3>Send Message</h3>
                            <span>To ${String(e||"").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</span>
                        </div>
                        <button onclick="this.closest('.modal-overlay').remove()" class="staff-modal-close">&times;</button>
                    </div>
                    <form onsubmit="window.app_sendStaffText(event)" class="staff-modal-form">
                        <input type="hidden" name="toUserId" value="${a}">
                        <textarea name="message" rows="4" placeholder="Type a message... (text + links only)" required></textarea>
                        <input type="url" name="link" placeholder="Optional link (https://...)">
                        <button type="submit" class="action-btn">Send Message</button>
                    </form>
                </div>
            </div>
        `;window.app_showModal(n,"staff-message-modal")};window.app_openStaffTaskModal=(a,e)=>{if(!a){alert("Select a staff member first.");return}const n=`
            <div class="modal-overlay" id="staff-task-modal" style="display:flex;">
                <div class="modal-content staff-message-modal">
                    <div class="staff-modal-head">
                        <div>
                            <h3>Send Task</h3>
                            <span>To ${String(e||"").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</span>
                        </div>
                        <button onclick="this.closest('.modal-overlay').remove()" class="staff-modal-close">&times;</button>
                    </div>
                    <form onsubmit="window.app_sendStaffTask(event)" class="staff-modal-form">
                        <input type="hidden" name="toUserId" value="${a}">
                        <input type="text" name="taskTitle" placeholder="Task title" required>
                        <textarea name="taskDescription" rows="3" placeholder="Task details"></textarea>
                        <input type="date" name="taskDueDate">
                        <button type="submit" class="action-btn">Send Task</button>
                    </form>
                </div>
            </div>
        `;window.app_showModal(n,"staff-task-modal")};window.app_respondStaffTask=async(a,e)=>{const t=window.AppAuth.getUser(),n=await window.AppDB.get("staff_messages",a);if(!n){alert("Task not found.");return}if(n.toId!==t.id){alert("Only the recipient can approve or reject this task.");return}let s="";if(e==="rejected"&&(s=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Task",confirmText:"Submit Reason"})||""),n.status=e,n.respondedAt=new Date().toISOString(),s&&(n.rejectReason=s),n.history||(n.history=[]),n.history.unshift({action:e,byId:t.id,byName:t.name,at:n.respondedAt,reason:s}),e==="approved"&&!n.calendarSynced){const r=n.dueDate||new Date().toISOString().split("T")[0],l=n.toName||t.name,d=`${n.title}${n.description?` - ${n.description}`:""}`;window.AppCalendar&&(await window.AppCalendar.addWorkPlanTask(r,n.toId,`${d} (Responsible: ${l})`,[],{addedFrom:"staff",sourcePlanId:n.id,sourceTaskIndex:0,taggedById:n.fromId,taggedByName:n.fromName,status:"pending"}),await window.AppCalendar.addWorkPlanTask(r,n.fromId,`${d} (Assigned to ${l})`,[],{addedFrom:"staff",sourcePlanId:n.id,sourceTaskIndex:1,taggedById:n.fromId,taggedByName:n.fromName,status:"pending"}),n.calendarSynced=!0)}await window.AppDB.put("staff_messages",n);const i=await window.AppDB.get("users",n.fromId);i&&(i.notifications||(i.notifications=[]),i.notifications.unshift({id:`taskresp_${Date.now()}`,type:"task_response",message:`${t.name} ${e} a task.`,title:n.title,taggedByName:t.name,status:e,reason:s,date:n.respondedAt,read:!1}),await window.AppDB.put("users",i));const o=document.getElementById("page-content");o&&(o.innerHTML=await K.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_updateStaffNavIndicator=async()=>{const a=window.AppAuth.getUser();if(!a)return;const e=document.querySelectorAll('[data-page="staff-directory"]');if(!e.length)return;const n=(await window.app_getMyMessages()).some(s=>s.toId===a.id&&!s.read);e.forEach(s=>{n?s.classList.add("has-new-msg"):s.classList.remove("has-new-msg")})};window.app_handleTagDecision=async(a,e)=>{const t=window.AppAuth.getUser();try{const n=await window.AppDB.get("users",t.id);if(!n||!n.notifications)throw new Error("Notification not found");const s=n.notifications.find(l=>l.id===a);if(!s)throw new Error("Notification not found");let i="";e==="rejected"&&(i=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Item",confirmText:"Submit Reason"})||"");const o=new Date().toISOString();if(s.status=e,s.respondedAt=o,s.read=!0,s.dismissedAt=o,i&&(s.rejectReason=i),n.tagHistory||(n.tagHistory=[]),n.tagHistory.unshift({id:`taghist_${Date.now()}`,type:"tag_response",title:s.title||s.message||"Tagged item",taggedByName:s.taggedByName||"Staff",status:e,reason:i,date:new Date().toISOString()}),await window.AppDB.put("users",n),s.taggedById){const l=await window.AppDB.get("users",s.taggedById);l&&(l.notifications||(l.notifications=[]),l.notifications.unshift({id:`tagresp_${Date.now()}`,type:"tag_response",message:`${t.name} ${e} your ${s.type||"tag"}.`,title:s.title||"",taggedByName:t.name,status:e,reason:i,date:new Date().toISOString(),read:!1}),await window.AppDB.put("users",l))}const r=document.getElementById("page-content");r&&(r.innerHTML=await K.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents())}catch(n){alert("Failed to update tag: "+n.message)}};document.addEventListener("auth-logout",()=>window.AppAuth.logout());window.app_reviewMinuteAccessFromNotification=async(a,e,t)=>{try{const n=window.AppAuth.getUser();if(!(n&&(n.isAdmin||n.role==="Administrator"))){alert("Only admin can review access requests.");return}const i=await window.AppDB.get("users",n.id);if(!i||!Array.isArray(i.notifications)){alert("Notification not found.");return}let o=null;if(typeof a=="number"&&i.notifications[a]&&(o=i.notifications[a]),!o&&e&&(o=i.notifications.find(g=>String(g.id)===String(e))),!o||o.type!=="minute-access-request"){alert("This notification is no longer available.");return}const r=o.minuteId,l=o.taggedById||o.requesterId;if(!r||!l){alert("Invalid access request payload.");return}const d=await window.AppDB.get("minutes",r);if(!d){alert("Minute not found.");return}const c=Array.isArray(d.accessRequests)?d.accessRequests.slice():[];c.findIndex(g=>g.userId===l)<0&&c.push({userId:l,userName:o.taggedByName||"Staff",requestedAt:o.taggedAt||o.date||new Date().toISOString(),status:"pending",reviewedAt:"",reviewedBy:""});const u=c.findIndex(g=>g.userId===l);c[u]={...c[u],status:t,reviewedAt:new Date().toISOString(),reviewedBy:n.name};let m=Array.isArray(d.allowedViewers)?d.allowedViewers.slice():[];t==="approved"?m.includes(l)||m.push(l):m=m.filter(g=>g!==l),await window.AppMinutes.updateMinute(r,{accessRequests:c,allowedViewers:m},t==="approved"?"Admin approved minutes access from notification":"Admin rejected minutes access from notification");const h=await window.AppDB.get("users",l);h&&(h.notifications||(h.notifications=[]),h.notifications.unshift({id:Date.now()+Math.random(),type:"minute-access-reviewed",title:"Minutes Access Update",message:`Your request for "${d.title}" was ${t}.`,minuteId:r,taggedById:n.id,taggedByName:n.name,status:t,taggedAt:new Date().toISOString(),date:new Date().toISOString()}),await window.AppDB.put("users",h));const f=i.notifications.find(g=>String(g.id)===String(o.id));f&&(f.status=t,f.respondedAt=new Date().toISOString(),f.read=!0,await window.AppAuth.updateUser(i)),ne.innerHTML=await K.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}catch(n){alert("Failed to review access request: "+n.message)}};window.app_reviewMissedCheckoutReasonFromNotification=async(a,e,t)=>{try{const n=window.AppAuth.getUser();if(!(n&&(n.isAdmin||n.role==="Administrator"))){alert("Only admin can review missed checkout reasons.");return}const i=await window.AppDB.get("users",n.id);if(!i||!Array.isArray(i.notifications)){alert("Notification not found.");return}let o=null;if(typeof a=="number"&&i.notifications[a]&&(o=i.notifications[a]),!o&&e&&(o=i.notifications.find(S=>String(S.id)===String(e))),!o||o.type!=="missed-checkout-reason"){alert("This notification is no longer available.");return}const r=o.staffId||o.taggedById,l=o.logId;if(!r||!l){alert("Invalid missed checkout payload.");return}let d="";if(t==="rejected"&&(d=await window.app_requestMandatoryRejectionReason({title:"Reject Auto Checkout",message:"Please enter why this missed/auto checkout request is being rejected.",confirmText:"Submit Reason"}),d===null))return;const c=await window.AppDB.get("attendance",l);if(c){const S=t==="approved"&&c.autoCheckout?{type:"Present",missedCheckoutOriginalType:c.missedCheckoutOriginalType||c.type||"Absent",dayCredit:window.AppAttendance&&typeof window.AppAttendance.getDayCredit=="function"?window.AppAttendance.getDayCredit("Present"):1,lateCountable:!1,missedCheckoutApprovedAsFullDay:!0,missedCheckoutApprovedAt:new Date().toISOString(),missedCheckoutApprovedBy:n.name}:{};await window.AppDB.put("attendance",{...c,...S,missedCheckoutReasonStatus:t,missedCheckoutReviewedBy:n.name,missedCheckoutReviewedAt:new Date().toISOString(),missedCheckoutReviewNote:d||""})}const p=new Date().toISOString(),u=i.notifications.find(S=>String(S.id)===String(o.id));u&&(u.status=t,u.respondedAt=p,u.read=!0,await window.AppAuth.updateUser(i));const m=await window.AppDB.get("users",r),h=o.missedCheckoutDate||(c?c.date:"the previous day");m&&(m.notifications||(m.notifications=[]),m.notifications.unshift({id:`mcr_rev_${Date.now()}`,type:"missed-checkout-reason-reviewed",title:"Missed checkout reason reviewed",message:`Admin ${t} your missed checkout reason for ${h}.`,status:t,date:p,taggedById:n.id,taggedByName:n.name,reviewNote:d||""}),await window.AppDB.put("users",m)),ne.innerHTML=await K.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell();const f=t==="approved"?"approved":"rejected",g=`${o.staffName||"Staff"}'s missed checkout for ${h} was ${f}.`;window.appAlert?await window.appAlert(g,"Review Complete"):alert(g)}catch(n){alert("Failed to review missed checkout reason: "+n.message)}};window.app_undoMissedCheckoutReview=async a=>{try{const e=window.AppAuth.getUser();if(!(e&&(e.isAdmin||e.role==="Administrator"))){alert("Only admin can undo missed checkout reviews.");return}const n=await window.AppDB.get("users",e.id);if(!n||!Array.isArray(n.notifications)){alert("Notification not found.");return}const s=n.notifications.find(d=>d&&d.type==="missed-checkout-reason"&&String(d.id||"")===String(a||""));if(!s){alert("This missed checkout review is no longer available.");return}const i=s.logId;if(!i){alert("Invalid missed checkout review payload.");return}const o=await window.AppDB.get("attendance",i);if(o){const d=o.missedCheckoutOriginalType||o.originalTypeBeforeApproval||(o.autoCheckout?"Absent":o.type);await window.AppDB.put("attendance",{...o,type:d,dayCredit:window.AppAttendance&&typeof window.AppAttendance.getDayCredit=="function"?window.AppAttendance.getDayCredit(d):d==="Present"?1:0,lateCountable:d==="Late",missedCheckoutApprovedAsFullDay:!1,missedCheckoutApprovedAt:"",missedCheckoutApprovedBy:"",missedCheckoutReasonStatus:"pending",missedCheckoutReviewedBy:"",missedCheckoutReviewedAt:"",missedCheckoutReviewNote:""})}s.status="pending",s.respondedAt="",s.read=!1,await window.AppAuth.updateUser(n);const r=s.staffId||s.taggedById,l=r?await window.AppDB.get("users",r):null;l&&(Array.isArray(l.notifications)||(l.notifications=[]),l.notifications.unshift({id:`mcr_undo_${Date.now()}`,type:"missed-checkout-review-undone",title:"Missed checkout review reopened",message:`Admin moved your missed checkout request for ${s.missedCheckoutDate||o?.date||"the selected date"} back to pending review.`,status:"pending",date:new Date().toISOString(),taggedById:e.id,taggedByName:e.name}),await window.AppDB.put("users",l)),typeof window.app_refreshAdminPage=="function"?await window.app_refreshAdminPage():ne&&(ne.innerHTML=await K.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}catch(e){alert("Failed to undo missed checkout review: "+e.message)}};document.addEventListener("dismiss-notification",async a=>{const e=a.detail,t=typeof e=="object"&&e!==null?e.notifIndex:e,n=typeof e=="object"&&e!==null?String(e.notifId||""):"",s=window.AppAuth.getUser();if(s&&s.notifications&&Number.isInteger(t)&&t>=0){let i=s.notifications[t];if(!i&&n&&(i=s.notifications.find(r=>String(r.id||"")===n)),!i)return;i.read=!0,i.dismissedAt=new Date().toISOString(),await window.AppAuth.updateUser(s),(window.location.hash.slice(1)||"dashboard")==="dashboard"&&(ne.innerHTML=await K.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}else if(s&&s.notifications&&n){const i=s.notifications.find(r=>String(r.id||"")===n);if(!i)return;i.read=!0,i.dismissedAt=new Date().toISOString(),await window.AppAuth.updateUser(s),(window.location.hash.slice(1)||"dashboard")==="dashboard"&&(ne.innerHTML=await K.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}});document.addEventListener("dismiss-tag-history",async a=>{const e=String(a.detail||""),t=window.AppAuth.getUser();if(!e||!t||!Array.isArray(t.tagHistory))return;const n=t.tagHistory.findIndex(s=>String(s.id)===e);n<0||(t.tagHistory.splice(n,1),await window.AppAuth.updateUser(t),ne.innerHTML=await K.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents())});document.addEventListener("open-log-modal",()=>{const a=document.getElementById("log-modal");if(!a)return;const e=new Date,t=s=>s.toString().padStart(2,"0");document.getElementById("log-date").value=e.toISOString().split("T")[0],document.getElementById("log-start-time").value=`${t(e.getHours())}:${t(e.getMinutes())}`;const n=new Date(e.getTime()+36e5);document.getElementById("log-end-time").value=`${t(n.getHours())}:${t(n.getMinutes())}`,a.style.display="flex"});document.addEventListener("set-duration",a=>{const e=a.detail,t=document.getElementById("log-start-time"),n=document.getElementById("log-end-time");if(t.value){const[s,i]=t.value.split(":").map(Number),o=new Date;o.setHours(s,i);const r=new Date(o.getTime()+e*60*1e3),l=d=>d.toString().padStart(2,"0");n.value=`${l(r.getHours())}:${l(r.getMinutes())}`}});window.app_editUser=async a=>{console.log("Opening Edit Modal for ID:",a);const e=await window.AppDB.get("users",a);if(console.log("User Data Found:",e),!e)return;const t=document.getElementById("edit-user-form");if(!t)return;const n=(d,c)=>{const p=t.querySelector(d);p&&(p.value=c!==void 0?c:"")},s=(d,c)=>{const p=t.querySelector(d);p&&(p.checked=!!c)};n("#edit-user-id",e.id),n("#edit-user-name",e.name),n("#edit-user-username",e.username),n("#edit-user-password",e.password),n("#edit-user-role",e.role),n("#edit-user-dept",e.dept),n("#edit-user-email",e.email),n("#edit-user-phone",e.phone),s("#edit-user-isAdmin",!!(e.isAdmin||e.role==="Administrator")),s("#edit-user-can-manage-attendance-sheet",!!(e.canManageAttendanceSheet||e.isAdmin||e.role==="Administrator")),n("#edit-user-birth-day",e.birthDay||""),n("#edit-user-birth-month",e.birthMonth||""),n("#edit-user-birth-year",e.birthYear||"");const i=At(e.joinDate);n("#edit-user-join-date",i),n("#edit-user-employee-id",i?e.employeeId||Kt(i,e.id):"NA"),n("#edit-user-base-salary",Number(e.baseSalary||0)),n("#edit-user-other-allowances",Number(e.otherAllowances||0)),n("#edit-user-pf",Number(e.providentFund||0)),n("#edit-user-professional-tax",Number(e.professionalTax||0)),n("#edit-user-loan-advance",Number(e.loanAdvance||0)),n("#edit-user-tds-percent",Number(e.tdsPercent||0)),n("#edit-user-bank-name",e.bankName||""),n("#edit-user-bank-account",e.bankAccount||e.accountNumber||""),n("#edit-user-bank-ifsc",e.bankIfsc||e.ifsc||""),n("#edit-user-pan",e.pan||e.PAN||""),n("#edit-user-uan",e.uan||e.UAN||"");const o=["dashboard","leaves","users","attendance","reports","minutes","policies","birthday"],r=e.permissions||{};if(o.forEach(d=>{const c=r[d],p=document.getElementById(`edit-perm-${d}-view`),u=document.getElementById(`edit-perm-${d}-admin`);p&&(p.checked=c==="view"||c==="admin"),u&&(u.checked=c==="admin")}),!r.birthday&&(e.canManageBirthdays||e.isAdmin||e.role==="Administrator")){const d=document.getElementById("edit-perm-birthday-view"),c=document.getElementById("edit-perm-birthday-admin");d&&(d.checked=!0),c&&(c.checked=!0)}const l=document.getElementById("edit-user-modal");if(l){l.style.display="flex";const d=document.getElementById("edit-user-permissions-panel");d&&(d.style.display="block")}};window.app_notifyUser=a=>{console.log("Opening Notify for:",a),document.getElementById("notify-user-id").value=a,document.getElementById("notify-modal").style.display="flex"};window.app_quickAddTask=async a=>{const e=window.AppAuth.getUser();if(!(e&&(e.role==="Administrator"||e.isAdmin))&&a!==e.id){alert("Only administrators can assign tasks to other staff.");return}const n=await window.appPrompt("Task to assign:","",{title:"Assign Task",placeholder:"Enter task title",confirmText:"Next"});if(!n||!n.trim())return;const s=await window.appPrompt("Task date (YYYY-MM-DD). Leave blank for today:","",{title:"Assign Task Date",placeholder:"YYYY-MM-DD",confirmText:"Create Task"}),i=s&&s.trim()?s.trim():new Date().toISOString().split("T")[0];try{if(!window.AppCalendar)throw new Error("Calendar module not available.");await window.AppCalendar.addWorkPlanTask(i,a,n.trim()),await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:n.trim(),description:"",dueDate:i,status:"pending",fromId:e.id,fromName:e.name,toId:a,toName:(await window.AppDB.get("users",a))?.name||"Staff",createdAt:new Date().toISOString(),read:!1,history:[{action:"created",byId:e.id,byName:e.name,at:new Date().toISOString()}]}),alert("Task added successfully.");const o=document.getElementById("page-content");o&&(o.innerHTML=await K.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()}catch(o){alert("Failed to add task: "+o.message)}};window.app_viewLogs=async a=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}console.log("Viewing details for:",a);const e=await window.AppDB.get("users",a);let t=await window.AppAttendance.getLogs(a);window.currentViewedLogs=t,window.currentViewedUser=e;const n=t.length?`
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>In</th>
                            <th>Out</th>
                            <th>Duration</th>
                            <th>Type</th>
                            <th>Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${t.map(s=>{let i=s.location||"N/A";return s.lat&&s.lng&&(i=`<a href="https://www.google.com/maps?q=${s.lat},${s.lng}" target="_blank" style="color:var(--primary);text-decoration:none;">
                                    <i class="fa-solid fa-map-pin"></i> ${Number(s.lat).toFixed(4)}, ${Number(s.lng).toFixed(4)}
                                </a>`),`
                            <tr>
                                <td>${s.date}</td>
                                <td>${s.checkIn}</td>
                                <td>${s.checkOut||"--"}</td>
                                <td>${s.duration||"--"}</td>
                                <td><span class="badge ${s.isManualOverride?"manual":""}" style="font-size:0.7rem; padding: 2px 6px;">${s.type||"Office"}</span></td>
                                <td style="font-size:0.85rem; color:#6b7280;">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        ${i}
                                        <button onclick="window.app_deleteLog('${s.id}', '${a}')" style="background:none; border:none; color:#ef4444; cursor:pointer;" title="Delete Log"><i class="fa-solid fa-trash"></i></button>
                                    </div>
                                </td>
                            </tr>`}).join("")}
                    </tbody>
                </table>
            </div>`:'<p style="text-align:center; padding:1rem; color:#6b7280;">No logs found for this user.</p>';document.getElementById("user-details-content").innerHTML=`
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <div>
                     <h3>${e.name}</h3>
                     <p style="color:#6b7280; font-size:0.9rem;">${e.role} | ${e.dept||"General"}</p>
                </div>
                <div style="display:flex; gap:0.5rem;">
                    <button onclick="window.app_openManualLogModal('${e.id}')" class="action-btn" style="padding:0.5rem 1rem; font-size:0.9rem; background:#10b981; border:none;">
                        <i class="fa-solid fa-plus"></i> Add Manual Log
                    </button>
                    <button onclick="window.AppReports.exportUserLogsCSV(window.currentViewedUser, window.currentViewedLogs)" class="action-btn secondary" style="padding:0.5rem 1rem; font-size:0.9rem;">
                        <i class="fa-solid fa-file-export"></i> Export Report
                    </button>
                </div>
            </div>
            ${n}
        `,document.getElementById("user-details-modal").style.display="flex"};window.app_openManualLogModal=a=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}const e=`
            <div class="modal-overlay" id="manual-admin-log-modal" style="display:flex;">
                <div class="modal-content">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h3>Add Manual Attendance</h3>
                        <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
                    </div>
                    <form onsubmit="window.app_submitManualLog(event, '${a}')">
                        <div style="display:flex; flex-direction:column; gap:1rem;">
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Date</label>
                                <input type="date" name="date" required value="${new Date().toISOString().split("T")[0]}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                            </div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time In</label>
                                    <input type="time" name="checkIn" required value="09:00" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time Out</label>
                                    <input type="time" name="checkOut" required value="17:00" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Category / Rule Override</label>
                                <select name="type" required style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                    <option value="Present">Present (Full Day)</option>
                                    <option value="Work - Home">Work from Home</option>
                                    <option value="Late">Late (Mark as Late)</option>
                                    <option value="Early Departure">Early Departure</option>
                                    <option value="Training">Training</option>
                                    <option value="Absent">Absent</option>
                                </select>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Admin Comment</label>
                                <textarea name="description" placeholder="Reason for manual entry..." style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px; height:60px;"></textarea>
                            </div>
                            <button type="submit" class="action-btn" style="width:100%; margin-top:1rem;">Save Manual Entry</button>
                        </div>
                    </form>
                </div>
            </div>
        `;window.app_showModal(e,"manual-admin-log-modal")};window.app_submitManualLog=async(a,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}a.preventDefault();const t=new FormData(a.target),n=t.get("checkIn"),s=t.get("checkOut"),i=Va(n,s);if(i==="Invalid"){alert("End time must be after Start time");return}const o=t.get("date"),r=window.AppAttendance.buildDateTime(o,n),l=window.AppAttendance.buildDateTime(o,s),d=r&&l?l-r:0,c=window.AppAttendance.evaluateAttendanceStatus(r||new Date,d),p=m=>{const[h,f]=m.split(":"),g=parseInt(h),S=g>=12?"PM":"AM",A=g%12||12;return`${String(A).padStart(2,"0")}:${f} ${S}`},u={date:o,checkIn:p(n),checkOut:p(s),duration:i,type:c.status,workDescription:t.get("description")||"Manual Entry by Admin",location:"Office (Manual)",durationMs:d,dayCredit:c.dayCredit,lateCountable:c.lateCountable,extraWorkedMs:c.extraWorkedMs||0,policyVersion:"v2",isManualOverride:!0,entrySource:"admin_override",attendanceEligible:!0};try{await window.AppAttendance.addAdminLog(e,u),alert("Attendance added manually."),document.getElementById("manual-admin-log-modal")?.remove(),window.app_viewLogs(e)}catch(m){alert("Error: "+m.message)}};window.app_deleteLog=async(a,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Are you sure you want to delete this attendance record?"))try{await window.AppAttendance.deleteLog(a),alert("Record deleted."),window.app_viewLogs(e)}catch(t){alert("Error: "+t.message)}};const Ga=async()=>{if(typeof window.app_refreshAdminPage=="function"&&(window.location.hash||"").includes("admin")){await window.app_refreshAdminPage();return}ne&&(ne.innerHTML=await K.renderDashboard(),Ue())};window.app_approveLeave=async a=>{if(await window.appConfirm("Are you sure you want to APPROVE this leave request?"))try{const e=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(a,"Approved",e.id),alert("Leave Approved! Attendance logs have been automatically generated."),await Ga()}catch(e){alert("Error: "+e.message)}};window.app_rejectLeave=async a=>{const e=await window.app_requestMandatoryRejectionReason({title:"Reject Leave",message:"Please enter why this leave request is being rejected.",confirmText:"Reject Leave"});if(e!==null)try{const t=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(a,"Rejected",t.id,e),alert("Leave Rejected."),await Ga()}catch(t){alert("Error: "+t.message)}};window.app_undoLeaveDecision=async a=>{try{const e=await window.AppDB.get("leaves",a);if(!e){alert("Leave request not found.");return}if(String(e.status||"").toLowerCase()==="pending"){alert("This leave request is already pending.");return}if(!await window.appConfirm("Move this leave request back to pending review?"))return;const t=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(a,"Pending",t?.id||""),alert("Leave request moved back to pending."),await Ga()}catch(e){alert("Error: "+e.message)}};window.app_addLeaveComment=async a=>{const e=await window.AppDB.get("leaves",a),t=await window.appPrompt("Enter/Edit Admin Comment:",e.adminComment||"",{title:"Admin Comment",confirmText:"Save Comment"});if(t!==null)try{const n=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(a,e.status,n.id,t),alert("Comment saved.");const s=document.getElementById("page-content");s&&(s.innerHTML=await K.renderDashboard(),Ue())}catch(n){alert("Error: "+n.message)}};window.app_exportLeaves=async()=>{try{const a=await window.AppLeaves.getAllLeaves();if(a.length===0){alert("No leave requests found to export.");return}await window.AppReports.exportLeavesCSV(a)}catch(a){alert("Export Failed: "+a.message)}};window.app_exportLeaveRequestPdf=async a=>{try{const e=await window.AppDB.get("leaves",a);if(!e){alert("Leave request not found.");return}const t=await window.AppDB.get("users",e.userId).catch(()=>null),n=e.userName||t?.name||"Staff",s=String(e.status||"Pending"),i=s==="Approved"?"#166534":s==="Rejected"?"#b91c1c":"#854d0e",o=window.open("","_blank","width=920,height=760");if(!o){alert("Please allow popups to open the printable leave slip.");return}const r=d=>String(d||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),l=`
            <!doctype html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Leave Slip - ${r(n)}</title>
                <style>
                    body { font-family: "Segoe UI", Tahoma, sans-serif; margin: 0; background: #eef4fb; color: #1f2937; }
                    .sheet { max-width: 820px; margin: 32px auto; background: #fff; border-radius: 24px; padding: 32px; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.14); }
                    .head { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; margin-bottom: 24px; }
                    .brand { font-size: 28px; font-weight: 800; color: #1e3a5f; margin: 0 0 6px; }
                    .sub { margin: 0; color: #64748b; font-size: 14px; }
                    .status { padding: 10px 16px; border-radius: 999px; font-weight: 700; color: ${i}; background: ${i}15; border: 1px solid ${i}33; }
                    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
                    .card { border: 1px solid #dbe5f1; border-radius: 18px; padding: 16px 18px; background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%); }
                    .label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; margin-bottom: 6px; font-weight: 700; }
                    .value { font-size: 18px; font-weight: 700; color: #0f172a; }
                    .full { grid-column: 1 / -1; }
                    .reason { min-height: 84px; white-space: pre-wrap; line-height: 1.55; }
                    .actions { margin-top: 28px; display: flex; justify-content: flex-end; }
                    button { border: 0; border-radius: 14px; padding: 12px 18px; background: linear-gradient(135deg, #355b86 0%, #28496f 100%); color: #fff; font-weight: 700; cursor: pointer; }
                    @media print {
                        body { background: #fff; }
                        .sheet { margin: 0; box-shadow: none; border-radius: 0; max-width: none; }
                        .actions { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="sheet">
                    <div class="head">
                        <div>
                            <h1 class="brand">CRWI Attendance</h1>
                            <p class="sub">Leave request slip</p>
                        </div>
                        <div class="status">${r(s)}</div>
                    </div>
                    <div class="grid">
                        <div class="card"><span class="label">Staff</span><div class="value">${r(n)}</div></div>
                        <div class="card"><span class="label">Type</span><div class="value">${r(e.type||"--")}</div></div>
                        <div class="card"><span class="label">From</span><div class="value">${r(e.startDate||"--")}</div></div>
                        <div class="card"><span class="label">To</span><div class="value">${r(e.endDate||"--")}</div></div>
                        <div class="card"><span class="label">Days</span><div class="value">${r(e.daysCount||"--")}</div></div>
                        <div class="card"><span class="label">Applied On</span><div class="value">${r(e.appliedOn?new Date(e.appliedOn).toLocaleString():"--")}</div></div>
                        <div class="card full"><span class="label">Reason</span><div class="value reason">${r(e.reason||"No reason provided.")}</div></div>
                        <div class="card full"><span class="label">Admin Comment</span><div class="value reason">${r(e.adminComment||"No admin comment added.")}</div></div>
                    </div>
                    <div class="actions">
                        <button onclick="window.print()">Print / Save PDF</button>
                    </div>
                </div>
            </body>
            </html>
        `;o.document.open(),o.document.write(l),o.document.close(),o.focus()}catch(e){alert("Failed to open leave slip: "+e.message)}};window.app_refreshMasterSheet=async()=>{const a=document.getElementById("page-content");if(a){const e=document.getElementById("sheet-month")?.value,t=document.getElementById("sheet-year")?.value;a.innerHTML=await K.renderMasterSheet(e,t)}};window.app_exportMasterSheet=async()=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}const a=parseInt(document.getElementById("sheet-month").value),e=parseInt(document.getElementById("sheet-year").value),t=await window.AppDB.getAll("users"),n=`${e}-${String(a+1).padStart(2,"0")}-01`,s=`${e}-${String(a+1).padStart(2,"0")}-31`,o=(await window.AppDB.query("attendance","date",">=",n)).filter(r=>r.date<=s);await window.AppReports.exportMasterSheetCSV(a,e,t,o)};window.app_openCellOverride=async(a,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}const t=(await window.AppDB.getAll("users")).find(p=>p.id===a),n=await window.AppDB.getAll("attendance"),s=p=>{if(Object.prototype.hasOwnProperty.call(p||{},"attendanceEligible"))return p.attendanceEligible===!0;const u=String(p?.entrySource||"");return u==="staff_manual_work"?!1:u==="admin_override"||u==="checkin_checkout"||p?.isManualOverride||p?.location==="Office (Manual)"||p?.location==="Office (Override)"||typeof p?.activityScore<"u"||typeof p?.locationMismatched<"u"||typeof p?.autoCheckout<"u"||!!p?.checkOutLocation||typeof p?.outLat<"u"||typeof p?.outLng<"u"?!0:String(p?.type||"").includes("Leave")||p?.location==="On Leave"},i=n.filter(p=>(p.userId===a||p.user_id===a)&&p.date===e&&s(p)).sort((p,u)=>Number(u.id||0)-Number(p.id||0))[0],o=["Present","Half Day","Late","Present (Late Waived)","Work - Home","On Duty","Absent","Half Day Leave","Short Leave","Casual Leave","Sick Leave","Medical Leave","Annual Leave","Earned Leave","Paid Leave","Maternity Leave","Paternity Leave","Study Leave","Compassionate Leave","Regional Holidays","National Holiday","Holiday"],r={"Work - Home":"WFH"},l=String(i?.type||"").trim();l&&!o.includes(l)&&o.unshift(l);const d=o.map(p=>{const u=r[p]||p;return`<option value="${p}" ${l===p?"selected":""}>${u}</option>`}).join(""),c=`
            <div class="modal-overlay" id="cell-override-modal" style="display:flex;">
                <div class="modal-content">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <div>
                            <h3 style="margin:0;">Edit Attendance</h3>
                            <p style="font-size:0.8rem; color:#666; margin:4px 0 0 0;">${t.name} | ${e}</p>
                        </div>
                        <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
                    </div>
                        <form onsubmit="window.app_submitCellOverride(event, '${a}', '${e}', '${i?.id||""}')">
                            <div style="display:flex; flex-direction:column; gap:1rem;">
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time In</label>
                                    <input type="time" name="checkIn" required value="${i?Ht(i.checkIn):"09:00"}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time Out</label>
                                    <input type="time" name="checkOut" required value="${i?Ht(i.checkOut):"17:00"}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Entry Type</label>
                                <select name="type" required style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                    ${d}
                                </select>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Admin Reason</label>
                                <textarea name="description" placeholder="Override reason..." style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px; height:60px;">${i?.workDescription||""}</textarea>
                            </div>
                            ${i?.autoCheckoutRequiresApproval?`
                                <div style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem 0.75rem; border:1px solid #fde68a; border-radius:8px; background:#fffbeb;">
                                    <input type="checkbox" name="autoCheckoutExtraApproved" id="auto-extra-approve" ${i?.autoCheckoutExtraApproved?"checked":""}>
                                    <label for="auto-extra-approve" style="font-size:0.8rem; color:#92400e; cursor:pointer;">Approve extra hours for auto check-out</label>
                                </div>
                            `:""}
                            <div style="display:flex; gap:0.75rem;">
                                <button type="submit" class="action-btn" style="flex:2;">${i?"Update Log":"Create Log"}</button>
                                ${i?`<button type="button" onclick="window.app_deleteCellLog('${i.id}', '${a}')" class="action-btn checkout" style="flex:1; padding:0;">Delete</button>`:""}
                            </div>
                            <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem;">
                                <input type="checkbox" name="isManualOverride" id="override-check" ${i?.isManualOverride?"checked":""}>
                                <label for="override-check" style="font-size:0.8rem; color:#666; cursor:pointer;">Mark as Manual Override</label>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;window.app_showModal(c,"cell-override-modal")};window.app_submitCellOverride=async(a,e,t,n)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}a.preventDefault();const s=new FormData(a.target),i=s.get("checkIn"),o=s.get("checkOut"),r=Va(i,o);if(r==="Invalid"){alert("End time must be after Start time");return}const l=window.AppAttendance.buildDateTime(t,i),d=window.AppAttendance.buildDateTime(t,o),c=l&&d?d-l:0,p=window.AppAttendance.evaluateAttendanceStatus(l||new Date,c),u=s.get("isManualOverride")==="on",m=String(s.get("type")||"").trim(),h=u&&m?m:p.status,f=S=>{if(!S||S==="--")return"--";const[A,b]=S.split(":"),x=parseInt(A),D=x>=12?"PM":"AM",T=x%12||12;return`${String(T).padStart(2,"0")}:${b} ${D}`},g={date:t,checkIn:f(i),checkOut:f(o),duration:r,type:h,workDescription:s.get("description")||"Admin Override",location:"Office (Override)",durationMs:c,dayCredit:p.dayCredit,lateCountable:p.lateCountable,extraWorkedMs:p.extraWorkedMs||0,policyVersion:"v2",isManualOverride:u,entrySource:"admin_override",attendanceEligible:!0,autoCheckoutExtraApproved:s.get("autoCheckoutExtraApproved")==="on"};try{n?await window.AppAttendance.updateLog(n,g):await window.AppAttendance.addAdminLog(e,g),alert("Override successful."),document.getElementById("cell-override-modal")?.remove(),window.app_refreshMasterSheet()}catch(S){alert("Error: "+S.message)}};window.app_deleteCellLog=async(a,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Delete this attendance record?"))try{await window.AppAttendance.deleteLog(a),document.getElementById("cell-override-modal")?.remove(),window.app_refreshMasterSheet()}catch(t){alert("Error: "+t.message)}};function Ht(a){if(!a||a==="--"||a==="Active Now")return"09:00";const[e,t]=a.split(" ");let[n,s]=e.split(":"),i=parseInt(n);return t==="PM"&&i<12&&(i+=12),t==="AM"&&i===12&&(i=0),`${String(i).padStart(2,"0")}:${s}`}const xr=a=>{if(!a)return null;const e=String(a).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);if(!Number.isNaN(t.getTime())){const s=t.getFullYear(),i=String(t.getMonth()+1).padStart(2,"0"),o=String(t.getDate()).padStart(2,"0");return`${s}-${i}-${o}`}const n=e.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);if(n){const s=Number(n[1]),i=Number(n[2]),o=Number(n[3]);let r=s,l=i;return l>12&&s<=12&&(l=s,r=i),l<1||l>12||r<1||r>31?null:`${o}-${String(l).padStart(2,"0")}-${String(r).padStart(2,"0")}`}return null};window.app_runAttendancePolicyMigration=async()=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Recalculate historical attendance logs with the current policy? This updates stored status/credits for existing office logs.","Run Attendance Migration"))try{const e=await window.AppDB.getAll("attendance");let t=0,n=0,s=0;const i=new Set(["Work - Home","Training","On Duty","Holiday","National Holiday","Regional Holidays"]);let o=0,r=0;const l=new Map,d=new Map,c=f=>{const g=xr(f?.date),S=typeof f?.activityScore<"u"||typeof f?.locationMismatched<"u"||typeof f?.autoCheckout<"u"||!!f?.checkOutLocation||typeof f?.outLat<"u"||typeof f?.outLng<"u";let b=String(f?.entrySource||"").trim();b||(f?.isManualOverride||f?.location==="Office (Manual)"||f?.location==="Office (Override)"?b="admin_override":S?b="checkin_checkout":b="staff_manual_work");const x=f?.checkIn&&f?.checkOut&&f?.checkOut!=="Active Now"?Ht(f.checkIn):null,D=f?.checkIn&&f?.checkOut&&f?.checkOut!=="Active Now"?Ht(f.checkOut):null,T=g&&x?window.AppAttendance.buildDateTime(g,x):null,_=g&&D?window.AppAttendance.buildDateTime(g,D):null,E=!!(T&&_&&_>T),M=E?_-T:null,w=typeof f?.durationMs=="number"?f.durationMs:M,y=typeof w=="number"?Math.max(0,w)/(1e3*60*60):0;let k;return Object.prototype.hasOwnProperty.call(f||{},"attendanceEligible")?k=f.attendanceEligible===!0:b==="staff_manual_work"?k=y>=4:k=!0,{dateIso:g,inDt:T,outDt:_,validTimeRange:E,resolvedDurationMs:w,workedHours:y,inferredSource:b,inferredAttendanceEligible:k}},p=(f,g)=>{const S=window.AppAttendance.normalizeType(f?.type);let A=0;g.inferredSource==="staff_manual_work"?g.workedHours>=8?A=100:g.workedHours>=4&&(A=50):A=Number(window.AppAttendance.getDayCredit(S)||0)*100;let b=0;return b+=A,b+=Math.min(20,Math.floor(Math.max(0,g.workedHours||0))),g.inferredAttendanceEligible&&(b+=40),g.validTimeRange&&(b+=10),g.inferredSource==="checkin_checkout"?b+=8:g.inferredSource==="admin_override"?b+=6:b+=4,f?.isManualOverride&&(b+=4),(String(f?.type||"").includes("Leave")||f?.location==="On Leave")&&(b+=6),b+=Number(f?.id||0)/1e13,b};for(const f of e){if(!f||!f.id)continue;const g=c(f);l.set(f.id,g);const S=f.user_id||f.userId;if(!S||!g.dateIso)continue;const A=`${S}|${g.dateIso}`;d.has(A)||d.set(A,[]),d.get(A).push(f)}const u=new Map;for(const[f,g]of d.entries()){if(!g||g.length===0)continue;const S=g.slice().sort((A,b)=>{const x=l.get(A.id)||c(A),D=l.get(b.id)||c(b);return p(b,D)-p(A,x)});u.set(f,S[0]?.id)}for(const f of e){if(t++,!f||!f.id){s++;continue}const g=window.AppAttendance.normalizeType(f.type),S=l.get(f.id)||c(f),A=S.dateIso,b=S.inDt,x=S.outDt,D=S.resolvedDurationMs,T=S.workedHours,_=S.inferredSource;let E=S.inferredAttendanceEligible;const M=f.user_id||f.userId,w=M&&A?`${M}|${A}`:null,y=w?u.get(w):null,k=!!(y&&y!==f.id),R=!!(f.checkIn&&f.checkOut&&f.checkOut!=="Active Now")&&!!(b&&x&&x<=b),C=!!(f.autoCheckout&&String(f.missedCheckoutReasonStatus||"").toLowerCase()==="approved");let B=f.type,O=f.dayCredit,F=f.lateCountable,U=f.extraWorkedMs||0;if(k&&(E=!1,String(f.type||"").includes("Leave")||(B="Work Log"),O=0,F=!1,U=0,o++),R&&(E=!1,String(f.type||"").includes("Leave")||(B="Work Log"),O=0,F=!1,U=0,r++),C&&!k&&!R)B="Present",O=window.AppAttendance&&typeof window.AppAttendance.getDayCredit=="function"?window.AppAttendance.getDayCredit("Present"):1,F=!1,U=0;else if(_==="staff_manual_work"&&!k&&!R)T>=8?(B="Present",O=1):T>=4?(B="Half Day",O=.5):(B="Work Log",O=0),F=!1,U=0;else if(!f.isManualOverride&&E&&!(i.has(g)||String(g).includes("Leave")||g==="Office")&&b&&x&&x>b){const H=window.AppAttendance.evaluateAttendanceStatus(b,x-b);B=H.status,O=H.dayCredit,F=H.lateCountable,U=H.extraWorkedMs||0}const $={...f,entrySource:_,attendanceEligible:E,type:B,dayCredit:typeof O=="number"?O:0,lateCountable:F===!0,extraWorkedMs:U||0,durationMs:typeof D=="number"?D:null,missedCheckoutApprovedAsFullDay:C?!0:f.missedCheckoutApprovedAsFullDay,policyVersion:"v2"};if(!(f.entrySource!==$.entrySource||f.attendanceEligible!==$.attendanceEligible||f.type!==$.type||f.dayCredit!==$.dayCredit||f.lateCountable!==$.lateCountable||(f.extraWorkedMs||0)!==($.extraWorkedMs||0)||f.durationMs!==$.durationMs||f.policyVersion!=="v2")){s++;continue}await window.AppDB.put("attendance",$),n++}alert(`Migration complete.
Scanned: ${t}
Updated: ${n}
Skipped: ${s}
Duplicates neutralized: ${o}
Invalid-time logs neutralized: ${r}`);const m=window.location.hash.slice(1),h=document.getElementById("page-content");if(!h)return;m==="policy-test"?h.innerHTML=await K.renderPolicyTest():m==="dashboard"?(h.innerHTML=await K.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()):m==="salary"?(h.innerHTML=await K.renderSalaryProcessing(),window.app_recalculateAllSalaries&&window.app_recalculateAllSalaries()):m==="timesheet"&&(h.innerHTML=await K.renderTimesheet())}catch(e){console.error("Attendance migration failed:",e),alert("Migration failed: "+e.message)}};window.app_deleteUser=async a=>{if(await window.appConfirm("Are you sure you want to delete this user? This action cannot be undone."))try{await window.AppDB.delete("users",a),alert("User deleted successfully.");const e=document.getElementById("page-content");e&&(e.innerHTML=await K.renderAdmin())}catch(e){alert("Failed to delete user: "+e.message)}};window.app_recalculateRow=a=>{const e=parseFloat(a.querySelector(".base-salary-input").value)||0,t=e/22,n=parseFloat(a.querySelector(".unpaid-leaves-count").innerText)||0,s=parseFloat(a.querySelector(".late-count")?.innerText||"0")||0,i=Math.floor(s/(N.LATE_GRACE_COUNT||3))*(N.LATE_DEDUCTION_PER_BLOCK||.5),o=parseFloat(a.querySelector(".extra-work-hours")?.innerText||"0")||0,r=Math.floor(o/(N.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4))*(N.LATE_DEDUCTION_PER_BLOCK||.5),l=Math.max(0,i-r),d=n+l,c=parseFloat(document.getElementById("global-tds-percent").value)||0,p=a.querySelector(".tds-input");p&&!p.dataset.manual&&(p.value=c);const u=p?parseFloat(p.value)||0:c,m=Math.round(t*d),h=a.querySelector(".late-deduction-days"),f=a.querySelector(".late-deduction-raw"),g=a.querySelector(".penalty-offset-days"),S=a.querySelector(".deduction-days"),A=a.querySelector(".attendance-deduction-amount");f&&(f.innerText=i.toFixed(1)),g&&(g.innerText=r.toFixed(1)),h&&(h.innerText=l.toFixed(1)),S&&(S.innerText=d.toFixed(1)),A&&(A.innerText="-Rs "+m.toLocaleString()),a.querySelector(".deduction-amount").innerText="-Rs "+m.toLocaleString();const b=a.querySelector(".salary-input");b.dataset.manual||(b.value=Math.max(0,e-m));const x=parseFloat(b.value)||0,D=Math.round(x*(u/100)),T=Math.max(0,x-D);a.querySelector(".tds-amount").innerText="Rs "+D.toLocaleString(),a.querySelector(".tds-amount").dataset.value=D,a.querySelector(".final-net-salary").innerText="Rs "+T.toLocaleString(),a.querySelector(".final-net-salary").dataset.value=T};const Ts=a=>{const e=parseFloat(a.querySelector(".unpaid-leaves-count")?.innerText||"0")||0,t=parseFloat(a.querySelector(".late-count")?.innerText||"0")||0,n=parseFloat(a.querySelector(".extra-work-hours")?.innerText||"0")||0,s=Math.floor(t/(N.LATE_GRACE_COUNT||3))*(N.LATE_DEDUCTION_PER_BLOCK||.5),i=Math.floor(n/(N.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4))*(N.LATE_DEDUCTION_PER_BLOCK||.5),o=Math.max(0,s-i),r=e+o;return{unpaidLeaves:e,lateCount:t,extraWorkedHours:n,rawLateDeductionDays:s,penaltyOffsetDays:i,lateDeductionDays:o,deductionDays:r}};window.app_recalculateAllSalaries=()=>{document.querySelectorAll("tr[data-user-id]").forEach(a=>{window.app_recalculateRow(a)})};const ca=(a,e=new Date)=>{if(/^\d{4}-\d{2}$/.test(String(a||"").trim())){const[t,n]=String(a).split("-").map(Number);if(Number.isFinite(t)&&Number.isFinite(n)&&n>=1&&n<=12)return{year:t,monthIndex:n-1}}return{year:e.getFullYear(),monthIndex:e.getMonth()}};window.app_toggleSalaryPeriodMode=function(){const a=document.getElementById("salary-period-mode")?.value||"single",e=document.getElementById("salary-period-single-wrap"),t=document.getElementById("salary-period-range-wrap");e&&(e.style.display=a==="range"?"none":"block"),t&&(t.style.display=a==="range"?"flex":"none")};window.app_getSalaryPayPeriodInfo=function(){const a=new Date;if((document.getElementById("salary-period-mode")?.value||"single")==="range"){const r=document.getElementById("salary-pay-period-from")?.value||"",l=document.getElementById("salary-pay-period-to")?.value||"";let d=ca(r,a),c=ca(l,a);const p=d.year*100+(d.monthIndex+1);if(c.year*100+(c.monthIndex+1)<p){const S=d;d=c,c=S}const m=new Date(d.year,d.monthIndex,1),h=new Date(c.year,c.monthIndex+1,0),f=`${d.year}-${String(d.monthIndex+1).padStart(2,"0")}`,g=`${c.year}-${String(c.monthIndex+1).padStart(2,"0")}`;return{mode:"range",startDate:m,endDate:h,startKey:f,endKey:g,key:`${f}_to_${g}`,label:`${m.toLocaleDateString("en-GB",{month:"long",year:"numeric"})} to ${h.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}`}}const t=document.getElementById("salary-pay-period")?.value||"",n=ca(t,a),s=new Date(n.year,n.monthIndex,1),i=new Date(n.year,n.monthIndex+1,0),o=`${n.year}-${String(n.monthIndex+1).padStart(2,"0")}`;return{mode:"single",startDate:s,endDate:i,startKey:o,endKey:o,key:o,label:s.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}};window.app_saveAllSalaries=async()=>{const a=document.querySelectorAll("tr[data-user-id]"),e=[],t=[],n=window.app_getSalaryPayPeriodInfo(),s=n.key,i=document.getElementById("salary-pay-date")?.value||"",o=i?new Date(i).getTime():Date.now(),r=parseFloat(document.getElementById("global-tds-percent").value)||0;for(const l of a){const d=l.dataset.userId,c=l.querySelector(".base-salary-input").value,p=l.querySelector(".salary-input").value,u=l.querySelector(".comment-input").value,m=l.querySelector(".tds-input"),h=m?parseFloat(m.value)||0:r,f=l.querySelector(".tds-amount").dataset.value||0,g=l.querySelector(".final-net-salary").dataset.value||0,S=Ts(l),A=S.unpaidLeaves,b=S.lateCount,x=S.extraWorkedHours,D=S.rawLateDeductionDays,T=S.penaltyOffsetDays,_=S.lateDeductionDays,E=S.deductionDays,M=Number(String(l.querySelector(".attendance-deduction-amount")?.innerText||"0").replace(/[^0-9.-]+/g,"")),w=String(l.querySelector(".employee-id-input")?.value||"").trim(),y=String(l.querySelector(".designation-input")?.value||"").trim(),k=String(l.querySelector(".department-input")?.value||"").trim(),P=String(l.querySelector(".join-date-input")?.value||"").trim(),R=P?w||Kt(P,d):"NA",C=String(l.querySelector(".bank-name-input")?.value||"").trim(),B=String(l.querySelector(".bank-account-input")?.value||"").trim(),O=String(l.querySelector(".pan-input")?.value||"").trim(),F=String(l.querySelector(".uan-input")?.value||"").trim(),U=Number(l.querySelector(".other-allowances-input")?.value||0),W=Number(l.querySelector(".pf-input")?.value||0),$=Number(l.querySelector(".professional-tax-input")?.value||0),I=Number(l.querySelector(".loan-advance-input")?.value||0);if(l.querySelector(".comment-input").required&&!u){alert(`Please provide a comment for user ID: ${d} as the salary was adjusted.`);return}e.push({id:`salary_${d}_${s}`,userId:d,month:s,periodMode:n.mode,periodStart:n.startKey,periodEnd:n.endKey,periodLabel:n.label,payDate:o,baseAmount:Number(c),otherAllowances:U,providentFund:W,professionalTax:$,loanAdvance:I,employeeId:R,designation:y,department:k,joinDate:P||null,bankName:C,bankAccount:B,pan:O,uan:F,attendanceDeduction:M,deductions:Number(l.querySelector(".deduction-amount").innerText.replace(/[^0-9.-]+/g,"")),unpaidLeaves:A,lateCount:b,extraWorkedHours:x,lateDeductionRawDays:D,penaltyOffsetDays:T,lateDeductionDays:_,deductionDays:E,adjustedAmount:Number(p),tdsPercent:h,tdsAmount:Number(f),finalNet:Number(g),comment:u||"",processedAt:Date.now()}),t.push({id:d,baseSalary:Number(c),tdsPercent:h,employeeId:R,designation:y,dept:k,joinDate:P||null,bankName:C,bankAccount:B,pan:O,uan:F,otherAllowances:U,providentFund:W,professionalTax:$,loanAdvance:I})}try{for(const d of e)await window.AppDB.put("salaries",d);for(const d of t){const c=await window.AppDB.get("users",d.id);c&&(Object.assign(c,d),await window.AppDB.put("users",c))}alert("All records and TDS details saved successfully!");const l=document.getElementById("page-content");l.innerHTML=await K.renderSalaryProcessing()}catch(l){console.error("Salary Save Error:",l),alert("Failed to save records: "+l.message)}};window.app_exportSalaryCSV=()=>{const a=document.querySelectorAll("tr[data-user-id]");let e=`Staff Name,Emp ID,Designation,Department,Join Date,Bank Name,Bank Account,PAN,UAN,Base Salary,Other Allowances,PF,Professional Tax,Loan Advance,Present,Late,Unpaid Leaves,Extra Work Hours,Late Deduction Raw,Penalty Offset Days,Late Deduction Days,Total Deduction Days,Attendance Deduction,Total Deductions,Adjusted Salary,TDS (%),TDS Amount,Final Net,Comment
`;a.forEach(o=>{const r=o.querySelector('div[style*="font-weight: 600"]').innerText,l=o.querySelector(".base-salary-input").value,d=o.querySelector(".employee-id-input")?.value||"",c=o.querySelector(".designation-input")?.value||"",p=o.querySelector(".department-input")?.value||"",u=o.querySelector(".join-date-input")?.value||"",m=o.querySelector(".bank-name-input")?.value||"",h=o.querySelector(".bank-account-input")?.value||"",f=o.querySelector(".pan-input")?.value||"",g=o.querySelector(".uan-input")?.value||"",S=o.querySelector(".other-allowances-input")?.value||"0",A=o.querySelector(".pf-input")?.value||"0",b=o.querySelector(".professional-tax-input")?.value||"0",x=o.querySelector(".loan-advance-input")?.value||"0",D=o.querySelector(".present-count")?.innerText||"0",T=o.querySelector(".late-count")?.innerText||"0",_=o.querySelector(".unpaid-leaves-count")?.innerText||"0",E=o.querySelector(".extra-work-hours")?.innerText||"0",M=o.querySelector(".late-deduction-raw")?.innerText||"0",w=o.querySelector(".penalty-offset-days")?.innerText||"0",y=o.querySelector(".late-deduction-days")?.innerText||"0",k=o.querySelector(".deduction-days")?.innerText||"0",P=(o.querySelector(".attendance-deduction-amount")?.innerText||"").replace(/[^0-9.-]+/g,"")||"0",R=(o.querySelector(".deduction-amount").innerText||"").replace(/[^0-9.-]+/g,""),C=o.querySelector(".salary-input").value,B=parseFloat(document.getElementById("global-tds-percent").value)||0,O=o.querySelector(".tds-input"),F=O&&O.value!==""?O.value:B,U=(o.querySelector(".tds-amount").innerText||"").replace(/[^0-9.-]+/g,""),W=(o.querySelector(".final-net-salary").innerText||"").replace(/[^0-9.-]+/g,""),$=o.querySelector(".comment-input").value;e+=`"${r}","${d}","${c}","${p}","${u}","${m}","${h}","${f}","${g}",${l},${S},${A},${b},${x},${D},${T},${_},${E},${M},${w},${y},${k},${P},${R},${C},${F},${U},${W},"${$}"
`});const t=new Blob([e],{type:"text/csv"}),n=window.URL.createObjectURL(t),s=document.createElement("a"),i=window.app_getSalaryPayPeriodInfo();s.setAttribute("href",n),s.setAttribute("download",`Salaries_${i.key.replace(/[^a-zA-Z0-9_-]/g,"_")}.csv`),s.click()};const pa=(a,e=4)=>{const t=String(a||"").trim();return t?t.length<=e?t:`${"*".repeat(Math.max(0,t.length-e))}${t.slice(-e)}`:"NA"},Tr=a=>{const e=Math.floor(Number(a)||0);if(e===0)return"Zero";const t=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"],n=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"],s=u=>{if(u<20)return t[u];const m=Math.floor(u/10),h=u%10;return`${n[m]}${h?` ${t[h]}`:""}`.trim()},i=u=>{const m=Math.floor(u/100),h=u%100;return m?`${t[m]} Hundred${h?` ${s(h)}`:""}`.trim():s(h)};let o=e;const r=Math.floor(o/1e7);o%=1e7;const l=Math.floor(o/1e5);o%=1e5;const d=Math.floor(o/1e3);o%=1e3;const c=o,p=[];return r&&p.push(`${s(r)} Crore`),l&&p.push(`${s(l)} Lakh`),d&&p.push(`${s(d)} Thousand`),c&&p.push(i(c)),p.join(" ").trim()};window.app_printSalarySlip=function(){const a=document.getElementById("salary-slip-modal");if(!a)return;const e=a.querySelector(".salary-slip-print-root");e&&(document.body.classList.add("salary-slip-print-mode"),e.classList.add("print-active"),setTimeout(()=>{window.print(),setTimeout(()=>{e.classList.remove("print-active"),document.body.classList.remove("salary-slip-print-mode")},150)},60))};window.app_generateSalarySlip=async function(a){try{const e=document.querySelector(`tr[data-user-id="${a}"]`);if(!e){alert("Unable to locate salary row for this user.");return}const t=await window.AppDB.get("users",a);if(!t){alert("User details not found.");return}const n=new Date,s=window.app_getSalaryPayPeriodInfo(),i=s.label,o=at(s.startDate),r=at(s.endDate),l=document.getElementById("salary-pay-date")?.value||"",d=at(l||n),c=wr(n),p=`CRWI-${s.key.replace(/[^a-zA-Z0-9]/g,"")}-${a}-${String(n.getTime()).slice(-5)}`,u=Number(e.querySelector(".base-salary-input")?.value||0),m=Number(e.querySelector(".salary-input")?.value||0),h=Number(e.querySelector(".tds-input")?.value||0),f=Number(e.querySelector(".tds-amount")?.dataset?.value||"0"),g=Number(e.querySelector(".final-net-salary")?.dataset?.value||"0"),S=Number(String(e.querySelector(".attendance-deduction-amount")?.innerText||"0").replace(/[^0-9.-]+/g,""))||0,A=Ts(e),b=A.rawLateDeductionDays,x=A.penaltyOffsetDays,D=A.lateDeductionDays,T=A.deductionDays,_=A.unpaidLeaves,E=A.lateCount,M=String(e.querySelector(".comment-input")?.value||"").trim(),w=Number(e.querySelector(".other-allowances-input")?.value||t.otherAllowances||0),y=u+w,k=Number(e.querySelector(".loan-advance-input")?.value||t.loanAdvance||0),P=Number(e.querySelector(".pf-input")?.value||t.providentFund||0),R=Number(e.querySelector(".professional-tax-input")?.value||t.professionalTax||0),C=String(e.querySelector(".join-date-input")?.value||t.joinDate||"").trim(),B=String(e.querySelector(".employee-id-input")?.value||t.employeeId||"").trim(),O=C?B||Kt(C,t.id):"NA",F=String(e.querySelector(".designation-input")?.value||t.designation||t.role||"").trim(),U=String(e.querySelector(".department-input")?.value||t.dept||t.department||"").trim(),W=String(e.querySelector(".join-date-input")?.value||t.joinDate||"").trim(),$=String(e.querySelector(".bank-name-input")?.value||t.bankName||"").trim(),I=String(e.querySelector(".bank-account-input")?.value||t.bankAccount||t.accountNumber||"").trim(),H=String(e.querySelector(".pan-input")?.value||t.pan||t.PAN||"").trim(),L=String(e.querySelector(".uan-input")?.value||t.uan||t.UAN||"").trim(),z=S+f+k+P+R,q=`${Tr(g)} Rupees Only`,j=[{label:"Attendance Deduction",amount:S,remarks:`Unpaid Leaves: ${_}, Late Count: ${E}, Late Raw: ${b.toFixed(1)}, Offset: ${x.toFixed(1)}, Late Deduction: ${D.toFixed(1)}, Total Deduction Days: ${T.toFixed(1)}`},{label:"TDS",amount:f,remarks:`Applied at ${h.toFixed(2)}%`},{label:"Provident Fund",amount:P,remarks:P?"Configured as per employee profile":"NA"},{label:"Professional Tax",amount:R,remarks:R?"Configured as per employee profile":"NA"},{label:"Loan / Advance",amount:k,remarks:k?"Recovered in this cycle":"Nil"}],J=ae=>gr(ae),Q=`
                <div class="modal-overlay" id="salary-slip-modal" style="display:flex;">
                    <div class="salary-slip-modal-shell salary-slip-print-root">
                        <div class="salary-slip-actions no-print">
                            <button type="button" class="action-btn secondary" onclick="window.app_printSalarySlip()"><i class="fa-solid fa-print"></i> Print / Save PDF</button>
                            <button type="button" class="action-btn secondary" title="Planned enhancement" disabled style="opacity:0.6; cursor:not-allowed;"><i class="fa-solid fa-file-pdf"></i> html2pdf (Later)</button>
                            <button type="button" class="action-btn" onclick="window.app_closeModal(this)"><i class="fa-solid fa-xmark"></i> Close</button>
                        </div>
                        <div class="salary-slip-paper">
                            <div class="salary-slip-header">
                                <img src="Logo/LOGO USED IN WEB.png" alt="CRWI Logo" class="salary-slip-logo">
                                <div class="salary-slip-org">
                                    <h2>Conference Of Religious Women India</h2>
                                    <div>CRI House, Women Section, Masihgarh, Sukhdev Vihar, New Friends Colony PO, New Delhi-110 025</div>
                                    <div>Phone: 63649 19152 | Email: fin@crwi.org.in / executivedirector@crwi.org.in</div>
                                </div>
                            </div>
                            <div class="salary-slip-title">
                                <h3>Salary Slip</h3>
                                <div>Pay Period: ${i} (${o} to ${r})</div>
                                <div>Pay Date: ${d}</div>
                            </div>

                            <div class="salary-slip-section">
                                <h4>Employee Details</h4>
                                <div class="salary-slip-grid">
                                    <div><b>Employee Name:</b> ${t.name||"Staff"}</div>
                                    <div><b>Employee ID:</b> ${O||"NA"}</div>
                                    <div><b>Designation:</b> ${F||"NA"}</div>
                                    <div><b>Department:</b> ${U||"NA"}</div>
                                    <div><b>Date of Joining:</b> ${at(W)}</div>
                                    <div><b>Bank Name:</b> ${$||"NA"}</div>
                                    <div><b>UAN:</b> ${pa(L)}</div>
                                    <div><b>PAN:</b> ${pa(H)}</div>
                                    <div><b>Bank A/C:</b> ${pa(I)}</div>
                                </div>
                            </div>

                            <div class="salary-slip-split">
                                <div class="salary-slip-section">
                                    <h4>Earnings</h4>
                                    <table class="salary-slip-table">
                                        <tr><td>Basic Salary</td><td>${J(u)}</td></tr>
                                        <tr><td>HRA</td><td>NA</td></tr>
                                        <tr><td>Conveyance Allowance</td><td>NA</td></tr>
                                        <tr><td>Special Allowance</td><td>NA</td></tr>
                                        <tr><td>Other Allowances</td><td>${J(w)}</td></tr>
                                        <tr class="total"><td>Gross Earnings</td><td>${J(y)}</td></tr>
                                    </table>
                                </div>
                                <div class="salary-slip-section">
                                    <h4>Deductions (Breakdown)</h4>
                                    <table class="salary-slip-table">
                                        ${j.map(ae=>`<tr><td>${ae.label}<div class="remark">${ae.remarks}</div></td><td>${ae.amount?J(ae.amount):"NA"}</td></tr>`).join("")}
                                        <tr class="total"><td>Total Deductions</td><td>${J(z)}</td></tr>
                                    </table>
                                </div>
                            </div>

                            <div class="salary-slip-net">
                                <div><b>Adjusted Salary:</b> ${J(m)}</div>
                                <div><b>Net Salary:</b> ${J(g)}</div>
                                <div><b>Net Salary in Words:</b> ${q}</div>
                            </div>

                            <div class="salary-slip-footer">
                                <div>This is a system-generated salary slip and does not require a signature.</div>
                                <div>Generated: ${c} | Payroll Ref ID: ${p}</div>
                                ${M?`<div>Payroll Comment: ${M}</div>`:""}
                            </div>
                        </div>
                    </div>
                </div>
            `;window.app_showModal(Q,"salary-slip-modal")}catch(e){console.error("Salary slip generation failed:",e),alert(`Failed to generate salary slip: ${e.message}`)}};window.app_editTaskStatus=async function(a,e,t){try{const n=window.AppAuth.getUser(),s=t==="completed"?new Date().toISOString().split("T")[0]:null;await window.AppCalendar.updateTaskStatus(a,e,t,s);const i=document.getElementById("page-content");i.innerHTML=await K.renderDashboard(),alert(`Task status updated to: ${t}`)}catch(n){console.error("Failed to update task status:",n),alert("Failed to update task status. Please try again.")}};window.app_reassignTask=async function(a,e,t){try{const n=window.AppAuth.getUser();if(n.role!=="Administrator"&&!n.isAdmin){alert("Only administrators can reassign tasks.");return}await window.AppCalendar.reassignTask(a,e,t);const s=document.getElementById("page-content");s.innerHTML=await K.renderDashboard(),alert("Task reassigned successfully!")}catch(n){console.error("Failed to reassign task:",n),alert("Failed to reassign task. Please try again.")}};window.app_viewTaskDetails=async function(a,e){try{const t=await window.AppDB.get("work_plans",a);if(!t||!t.plans||!t.plans[e]){alert("Task not found.");return}const n=t.plans[e],s=window.AppCalendar.getSmartTaskStatus(t.date,n.status),i={"to-be-started":"#3b82f6","in-process":"#eab308",completed:"#22c55e",overdue:"#ef4444","not-completed":"#6b7280"},o={"to-be-started":"🔵 To Be Started","in-process":"🟡 In Process",completed:"🟢 Completed",overdue:"🔴 Overdue","not-completed":"⚫ Not Completed"},r=`
                <div class="modal-overlay" id="task-details-modal" style="display: flex;">
                    <div class="modal-content" style="max-width: 500px;">
                        <h2 style="margin-bottom: 1rem;">Task Details</h2>
                        
                        <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                            <div style="margin-bottom: 0.75rem;">
                                <label style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Task</label>
                                <p style="margin: 0.25rem 0 0 0; font-weight: 500;">${n.task}</p>
                            </div>
                            
                            <div style="margin-bottom: 0.75rem;">
                                <label style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Planned Date</label>
                                <p style="margin: 0.25rem 0 0 0;">${t.date}</p>
                            </div>
                            
                            <div style="margin-bottom: 0.75rem;">
                                <label style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Status</label>
                                <p style="margin: 0.25rem 0 0 0;">
                                    <span style="background: ${i[s]}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.875rem; font-weight: 600;">
                                        ${o[s]}
                                    </span>
                                </p>
                            </div>
                            
                            ${n.completedDate?`
                                <div style="margin-bottom: 0.75rem;">
                                    <label style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Completed Date</label>
                                    <p style="margin: 0.25rem 0 0 0;">${n.completedDate}</p>
                                </div>
                            `:""}
                            
                            ${n.subPlans&&n.subPlans.length>0?`
                                <div>
                                    <label style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Sub-tasks</label>
                                    <ul style="margin: 0.25rem 0 0 0; padding-left: 1.5rem;">
                                        ${n.subPlans.map(l=>`<li>${l}</li>`).join("")}
                                    </ul>
                                </div>
                            `:""}
                        </div>
                        
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="document.getElementById('task-details-modal').remove()" class="action-btn" style="flex: 1;">Close</button>
                        </div>
                    </div>
                </div>
            `;document.getElementById("modal-container").innerHTML=r}catch(t){console.error("Failed to view task details:",t),alert("Failed to load task details.")}};window.app_recalculateRatings=async function(){try{const a=window.AppAuth.getUser();if(a.role!=="Administrator"&&!a.isAdmin){alert("Only administrators can recalculate ratings.");return}if(!await window.appConfirm("This will recalculate ratings for all users. Continue?"))return;const e=await window.AppRating.updateAllRatings();alert(`Successfully updated ratings for ${e.length} users!`);const t=document.getElementById("page-content");t.innerHTML=await K.renderDashboard()}catch(a){console.error("Failed to recalculate ratings:",a),alert("Failed to recalculate ratings. Please try again.")}};window.app_triggerManualAudit=async()=>{if(!await window.appConfirm("Trigger a manual location audit for all active staff?"))return;const a=`Manual Audit @ ${new Date().toLocaleTimeString()}`;try{await window.AppDB.add("system_commands",{type:"audit",slotName:a,timestamp:Date.now(),requestedBy:window.AppAuth.getUser()?.name||"Admin",status:"pending"}),alert("Manual audit command sent. All active staff devices will now perform a stealth check.")}catch(e){console.error("Failed to trigger manual audit:",e),alert("Error: "+e.message)}};window.app_applyAuditFilter=async()=>{const a=document.getElementById("audit-start")?.value,e=document.getElementById("audit-end")?.value,t=document.getElementById("page-content");t&&(t.innerHTML=await K.renderAdmin(a,e),window.AppAnalytics&&window.AppAnalytics.initAdminCharts())};window.app_exportAudits=async()=>{const a=document.getElementById("audit-start")?.value,e=document.getElementById("audit-end")?.value;try{let t=await window.AppDB.getAll("location_audits");if(a&&e&&(t=t.filter(d=>{const c=new Date(d.timestamp).toISOString().split("T")[0];return c>=a&&c<=e})),t.sort((d,c)=>c.timestamp-d.timestamp),t.length===0){alert("No audits found for the selected range.");return}const n=["Timestamp","Date","Time","Staff Member","Slot","Status","Latitude","Longitude"],s=t.map(d=>[d.timestamp,new Date(d.timestamp).toLocaleDateString(),new Date(d.timestamp).toLocaleTimeString(),d.userName||"Unknown",d.slot,d.status,d.lat||"",d.lng||""]),i=[n,...s].map(d=>d.join(",")).join(`
`),o=new Blob([i],{type:"text/csv;charset=utf-8;"}),r=document.createElement("a"),l=URL.createObjectURL(o);r.setAttribute("href",l),r.setAttribute("download",`security_audits_${a||"export"}.csv`),r.style.visibility="hidden",document.body.appendChild(r),r.click(),document.body.removeChild(r)}catch(t){console.error("Export failed:",t),alert("Export failed: "+t.message)}};const gt=["attendance","leaves","work_plans","staff_messages","meetings","minutes","salaries","location_audits","system_audit_logs","system_commands","daily_summaries","daily_summaries_meta","summary_locks"],Ja=(a=window.AppAuth?.getUser?.())=>a?window.app_hasPerm?.("users","admin",a)?!0:a.isAdmin===!0||a.role==="Administrator":!1,Ut=a=>{try{if(window.AppDB?.isPermissionDenied?.(a))return!0}catch{}const e=String(a?.code||"").toLowerCase(),t=String(a?.message||"").toLowerCase();return e.includes("permission-denied")||t.includes("missing or insufficient permissions")},ut=a=>{if(a==null)return"";if(a instanceof Date&&!Number.isNaN(a.getTime()))return a.toISOString().split("T")[0];if(typeof a=="number"&&Number.isFinite(a)){const n=new Date(a);return Number.isNaN(n.getTime())?"":n.toISOString().split("T")[0]}const e=String(a||"").trim();if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;if(/^\d{4}-\d{2}$/.test(e))return`${e}-01`;if(/^\d{4}-\d{2}-\d{2}T/i.test(e))return e.slice(0,10);if(/^\d+$/.test(e)){const n=new Date(Number(e));if(!Number.isNaN(n.getTime()))return n.toISOString().split("T")[0]}const t=new Date(e);return Number.isNaN(t.getTime())?"":t.toISOString().split("T")[0]},Ir=a=>{switch(a){case"attendance":return["date","createdAt","updatedAt"];case"work_plans":return["date","createdAt","updatedAt"];case"staff_messages":return["createdAt","date","updatedAt"];case"meetings":return["date","timestamp","createdAt","updatedAt"];case"minutes":return["date","createdAt","updatedAt","timestamp"];case"salaries":return["payDate","processedAt","month","periodStart","periodEnd","createdAt","updatedAt"];case"birthday_people":return["date","birthDate","dob","createdAt","updatedAt"];case"location_audits":return["timestamp","date","createdAt","updatedAt"];case"system_audit_logs":return["createdAt","timestamp","date","updatedAt"];case"system_commands":return["timestamp","createdAt","date","updatedAt"];case"daily_summaries":return["date","summaryDate","createdAt","updatedAt","id"];case"daily_summaries_meta":return["date","createdAt","updatedAt","lastSuccessAt","id"];case"summary_locks":return["date","createdAt","updatedAt","lockedAt","expiresAt","id"];default:return["date","createdAt","updatedAt","timestamp","id"]}},$n=(a,e,t,n)=>{if(!t||!n)return{matches:!0,hasDate:!0};if(!e||typeof e!="object")return{matches:!1,hasDate:!1};if(a==="leaves"){const i=ut(e.startDate||e.appliedOn||e.createdAt||e.date),o=ut(e.endDate||e.startDate||e.appliedOn||e.createdAt||e.date);if(!i&&!o)return{matches:!1,hasDate:!1};const r=i||o;return{matches:!((o||i)<t||r>n),hasDate:!0}}const s=Ir(a);for(const i of s){const o=ut(e[i]);if(o)return{matches:o>=t&&o<=n,hasDate:!0}}return{matches:!1,hasDate:!1}},Mr=(a,e)=>{const t=new Blob([JSON.stringify(a,null,2)],{type:"application/json;charset=utf-8;"}),n=URL.createObjectURL(t),s=document.createElement("a");s.href=n,s.download=e,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(n)},xn=a=>{if(a==null)return"";let e="";return typeof a=="object"?e=JSON.stringify(a):e=String(a),e=e.replace(/"/g,'""'),/[",\n]/.test(e)?`"${e}"`:e},Cr=(a=[])=>{const e=Array.isArray(a)?a:[],t=new Set;e.forEach(o=>{!o||typeof o!="object"||Object.keys(o).forEach(r=>t.add(String(r)))});const n=Array.from(t);if(!n.length)return`id
`;const s=n.map(xn).join(","),i=e.map(o=>n.map(r=>xn(o?.[r])).join(","));return[s,...i].join(`
`)},Lr=(a,e)=>{const t=new Blob([a],{type:"text/csv;charset=utf-8;"}),n=URL.createObjectURL(t),s=document.createElement("a");s.href=n,s.download=e,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(n)};window.app_backupStaffData=async(a={})=>{const e=window.AppAuth?.getUser?.();if(!Ja(e))return alert("Only admin users can run staff data backup."),{success:!1,reason:"not_authorized"};const t={},n={},s=[],i=[];if((await Promise.all(gt.map(async u=>{try{const m=await window.AppDB.getAll(u);return{collection:u,rows:m||[],warning:null}}catch(m){return Ut(m)?{collection:u,rows:[],warning:`Permission denied for ${u}. Backed up as empty.`}:{collection:u,rows:[],error:m}}}))).forEach(u=>{const m=u.collection;if(u.error){i.push(m);return}u.warning&&s.push(u.warning),t[m]=u.rows||[],n[m]=(u.rows||[]).length}),i.length)throw new Error(`Backup failed while reading: ${i.join(", ")}`);const l=new Date().toISOString(),c=`staff_backup_${l.replace(/[:.]/g,"-")}.json`,p={meta:{generatedAt:l,generatedById:e?.id||"",generatedByName:e?.name||"",reason:a.reason||"manual_backup",scope:"staff_activity_reset",usersRetained:!0,collections:[...gt],warnings:s},counts:n,data:t};return Mr(p,c),a.showSuccess!==!1&&alert(`Backup downloaded successfully as ${c}.`),{success:!0,fileName:c,counts:n}};window.app_backupStaffDataCSV=async()=>{const a=window.AppAuth?.getUser?.();if(!Ja(a))return alert("Only admin users can run staff data backup."),{success:!1,reason:"not_authorized"};const t=new Date().toISOString().replace(/[:.]/g,"-"),n=[],s=[],i={};let o=0;if((await Promise.all(gt.map(async d=>{try{const c=await window.AppDB.getAll(d);return{collection:d,rows:c||[],warning:null}}catch(c){return Ut(c)?{collection:d,rows:[],warning:`Permission denied for ${d}. Backed up as empty.`}:{collection:d,rows:[],error:c}}}))).forEach(d=>{const c=d.collection;if(d.error){s.push(c);return}d.warning&&n.push(d.warning),i[c]=(d.rows||[]).length;const p=Cr(d.rows||[]);Lr(p,`staff_backup_${c}_${t}.csv`),o+=1}),s.length)throw new Error(`CSV backup failed while reading: ${s.join(", ")}`);const l=n.length?`
Warnings:
- ${n.join(`
- `)}`:"";return alert(`CSV backup downloaded (${o} files).${l}`),{success:!0,downloadedFiles:o,counts:i,warnings:n}};window.app_resetStaffData=async(a={})=>{const e=window.AppAuth?.getUser?.();if(!Ja(e)){alert("Only admin users can reset staff data.");return}const t=ut(a.startDate||""),n=ut(a.endDate||""),s=!!(t||n);if(t&&!n||!t&&n){alert("Please select both From Date and To Date for range reset.");return}if(s&&t>n){alert("From Date cannot be after To Date.");return}const i=s?`${t} to ${n}`:"All dates",o=!s;if(!await window.appConfirm(`This will permanently remove staff activity data (attendance, leaves, plans, messages, audits, minutes, and related records) for: ${i}. User accounts will be kept. Continue?`))return;const l="RESET STAFF DATA",d=await window.appPrompt(`Type ${l} to continue.`,"",{title:"Final Confirmation",confirmText:"Run Reset",placeholder:l});if(d===null)return;if(String(d||"").trim().toUpperCase()!==l){alert("Confirmation text did not match. Reset cancelled.");return}let c=null;try{c=await window.app_backupStaffData({reason:s?`pre_reset_backup_${t}_to_${n}`:"pre_reset_backup",showSuccess:!1})}catch(D){console.error("Pre-reset backup failed:",D),alert(`Reset cancelled because backup failed: ${D.message}`);return}if(!c?.success){alert("Reset cancelled because backup did not complete.");return}const p={},u={},m=[],h={},f=[];for(const D of gt)try{if(o){const w=window.AppDB.deleteAllInCollection?await window.AppDB.deleteAllInCollection(D,{source:"server"}):0;p[D]=Number(w||0);continue}const T=await window.AppDB.getAll(D,{source:"server"}),_=[];let E=0;for(const w of T||[]){const y=$n(D,w,t,n);y.hasDate||(E+=1),y.matches&&w?.id&&_.push(String(w.id))}const M=_.length&&window.AppDB.deleteMany?await window.AppDB.deleteMany(D,_):0;p[D]=Number(M||0),E>0&&(u[D]=E)}catch(T){if(Ut(T)){p[D]=Number(p[D]||0),m.push(D);continue}console.error(`Failed resetting ${D}:`,T),p[D]=Number(p[D]||0),f.push(`${D}: ${T.message}`)}for(const D of gt)try{const T=await window.AppDB.getAll(D,{source:"server",silentPermissionDenied:!0});let _=0;o?_=Number((T||[]).length||0):_=Number((T||[]).filter(E=>$n(D,E,t,n).matches).length||0),_>0&&(h[D]=_)}catch(T){Ut(T)||f.push(`verify(${D}): ${T.message}`)}let g=0;if(o)try{const D=await window.AppDB.getAll("users");for(const T of D)!T||!T.id||(await window.AppDB.put("users",{id:T.id,status:"out",lastCheckIn:null,lastCheckOut:null,currentLocation:null,notifications:[],lastSeen:null}),g+=1)}catch(D){console.error("Failed to normalize users after reset:",D),f.push(`users(normalization): ${D.message}`)}const S=Object.values(p).reduce((D,T)=>D+Number(T||0),0),A=Object.values(u).reduce((D,T)=>D+Number(T||0),0),b=Object.values(h).reduce((D,T)=>D+Number(T||0),0),x=[`Backup: ${c.fileName}`,`Range: ${i}`,`Deleted records: ${S}`,`Users normalized: ${g}`,A>0?`Skipped (no date in selected mode): ${A}`:"",m.length?`Skipped (permission denied): ${m.join(", ")}`:"",b>0?`Still present after reset: ${b}`:"Verification: no matching records remain on Firestore"].filter(Boolean).join(`
`);try{window.AppDB?.cache?.clear&&window.AppDB.cache.clear(),window.AppAnalytics?.memo?.clear&&window.AppAnalytics.memo.clear(),window.AppLeaves?.cache&&typeof window.AppLeaves.cache=="object"&&(window.AppLeaves.cache={}),window._currentPlans=null}catch{}if(window.AppAuth?.refreshCurrentUserFromDB)try{await window.AppAuth.refreshCurrentUserFromDB()}catch{}if(window.location.hash.replace("#","")==="admin"&&window.app_refreshAdminPage&&await window.app_refreshAdminPage(),f.length){alert(`Reset completed with issues.
${x}

Errors:
${f.join(`
`)}`);return}alert(`Staff activity data reset completed.
${x}`)};window.app_changeAnnualYear=a=>{window.app_annualYear=(window.app_annualYear||new Date().getFullYear())+a,window.app_renderAnnualPlanPage()};window.app_toggleAnnualLegendFilter=a=>{const e=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0,overdue:!0,completed:!0};Object.prototype.hasOwnProperty.call(e,a)&&(e[a]=!e[a],window.app_annualLegendFilters=e,window.app_renderAnnualPlanPage())};window.app_showAnnualDayDetails=async a=>{if(!a)return;const e=window._currentPlans||await window.AppCalendar.getPlans(),t=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0},n=window.AppAuth.getUser()||{},s=n.role==="Administrator"||n.isAdmin,i=(window.app_getDayEvents(a,e,{includeAuto:!1,userId:s?null:n.id})||[]).filter(l=>l.type==="leave"?!!t.leave:l.type==="work"?!!t.work:(l.type==="holiday",!!t.event)),o=i.length?i.map(l=>{const d=l.type||"event",c=d==="leave"?"background:#fee2e2;color:#991b1b;":d==="work"?"background:#e0e7ff;color:#3730a3;":d==="holiday"?"background:#f1f5f9;color:#334155;":"background:#dcfce7;color:#166534;",p=d==="work"&&Array.isArray(l.plans)&&l.plans.length?`<ul style="margin:0.5rem 0 0 1rem; padding:0; color:#475569; font-size:0.8rem;">
                    ${l.plans.map(u=>`<li>${window.app_formatTaskWithPostponeChip(u.task||"Work plan item")}</li>`).join("")}
                   </ul>`:"";return`
                <div class="annual-v2-detail-item" style="border:1px solid #eef2f7; border-radius:12px; padding:0.75rem;">
                    <div class="annual-v2-detail-item-head" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                        <span class="annual-v2-detail-tag" style="padding:2px 8px; border-radius:999px; font-size:0.7rem; font-weight:700; ${c}">${d.toUpperCase()}</span>
                        <div class="annual-v2-detail-title" style="font-size:0.9rem; color:#1f2937; font-weight:600;">${l.title||"Event"}</div>
                    </div>
                    ${p}
                </div>`}).join(""):'<div style="text-align:center; color:#94a3b8; padding:1rem;">No visible items for this date with current filters.</div>',r=`
            <div class="modal-overlay annual-v2-modal" id="annual-day-detail-modal" style="display:flex;">
                <div class="annual-detail-modal annual-v2-modal-content">
                    <div class="annual-detail-modal-header annual-v2-detail-head">
                        <div>
                            <div style="font-size:0.8rem; color:#64748b;">Date</div>
                            <div style="font-size:1rem; font-weight:700; color:#1e1b4b;">${a}</div>
                        </div>
                        <button type="button" onclick="window.app_closeModal(this)" class="day-plan-close-btn" title="Close">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="annual-v2-detail-list" style="display:flex; flex-direction:column; gap:0.6rem; max-height:60vh; overflow:auto;">
                        ${o}
                    </div>
                </div>
            </div>`;window.app_showModal(r,"annual-day-detail-modal")};window.app_toggleAnnualView=a=>{window.app_annualViewMode=a,window.app_renderAnnualPlanPage()};window.app_jumpToAnnualToday=()=>{const a=new Date;window.app_annualYear=a.getFullYear(),window.app_selectedAnnualDate=a.toISOString().split("T")[0],window.app_renderAnnualPlanPage().then(()=>{window.app_showAnnualDayDetails(window.app_selectedAnnualDate)})};window.app_renderAnnualPlanPage=async()=>{const a=document.getElementById("page-content");a&&(a.innerHTML=await K.renderAnnualPlan())};window.app_setAnnualStaffFilter=a=>{window.app_annualStaffFilter=String(a||"").trim(),window.app_renderAnnualPlanPage()};window.app_setAnnualListSearch=a=>{window.app_annualListSearch=String(a||"").trim(),window.app_renderAnnualPlanPage()};window.app_setAnnualListSort=a=>{window.app_annualListSort=String(a||"date-asc").trim(),window.app_renderAnnualPlanPage()};window.app_renderTimesheetPage=async()=>{const a=document.getElementById("page-content");a&&(a.innerHTML=await K.renderTimesheet())};window.app_setTimesheetView=a=>{window.app_timesheetViewMode=a==="calendar"?"calendar":"list",window.app_renderTimesheetPage()};window.app_changeTimesheetMonth=a=>{const e=new Date,t=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:e.getMonth(),n=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:e.getFullYear(),s=new Date(n,t,1);s.setMonth(s.getMonth()+a),window.app_timesheetMonth=s.getMonth(),window.app_timesheetYear=s.getFullYear(),window.app_renderTimesheetPage()};window.app_jumpTimesheetToday=()=>{const a=new Date;window.app_timesheetMonth=a.getMonth(),window.app_timesheetYear=a.getFullYear(),window.app_renderTimesheetPage()};window.app_closeModal=a=>{const e=a&&a.closest?a.closest(".modal-overlay"):null;e&&e.remove()};window.app_getSystemUpdateNotes=()=>[{date:"2026-02-21",summary:"Check for System Update now shows this quick update popup before refreshing."},{date:"2026-02-21",summary:"The update action shortcut was changed from Ctrl+F5 to Ctrl+Shift+R."}];window.app_showSystemUpdatePopup=()=>{if(document.getElementById("system-update-modal"))return;const a="system-update-modal",e=kt();ee.lastPopupReleaseId=e.releaseId||"";const t=e.active&&e.buildId&&e.buildId!==e.currentBuildId,n=(window.app_getSystemUpdateNotes()||[]).slice(0,5),s=n.length?n.map(d=>`
                <li style="margin:0 0 0.7rem 0; color:#334155; line-height:1.45;">
                    <span style="display:block; font-size:0.72rem; color:#64748b; font-weight:700;">${V(d.date||"")}</span>
                    <span>${V(d.summary||"")}</span>
                </li>
            `).join(""):'<li style="color:#64748b;">No update notes available.</li>',i=t?`
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0.6rem 0.75rem; margin-bottom:0.8rem;">
                    <div style="font-size:0.78rem; font-weight:700; color:#0f172a;">New version available</div>
                    <div style="font-size:0.74rem; color:#475569; margin-top:0.15rem;">
                        Running build: ${V((e.currentCommitSha||"").slice(0,7)||e.currentBuildId||"local")}
                        ${e.currentBuiltAt?` | Built: ${V(e.currentBuiltAt)}`:""}
                    </div>
                    <div style="font-size:0.74rem; color:#475569; margin-top:0.25rem;">
                        Available build: ${V((e.commitSha||"").slice(0,7)||e.buildId)}
                        ${e.deployedAt?` | Deployed: ${V(e.deployedAt)}`:""}
                    </div>
                    ${e.notes?`<div style="font-size:0.78rem; color:#0f172a; margin-top:0.45rem;">${V(e.notes)}</div>`:""}
                </div>
            `:`
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0.6rem 0.75rem; margin-bottom:0.8rem;">
                    <div style="font-size:0.78rem; font-weight:700; color:#0f172a;">You are on the latest version</div>
                    <div style="font-size:0.74rem; color:#475569; margin-top:0.15rem;">
                        Current build: ${V((e.currentCommitSha||"").slice(0,7)||e.currentBuildId||"local")}
                        ${e.currentBuiltAt?` | Built: ${V(e.currentBuiltAt)}`:""}
                    </div>
                </div>
            `,o=t?"window.app_dismissReleaseUpdatePrompt()":"this.closest('.modal-overlay').remove()",l=`
            <div class="modal-overlay" id="${a}" style="display:flex;">
                <div class="modal-content" style="max-width:560px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.8rem;">
                        <h3 style="margin:0; font-size:1.1rem;">${t?"System Update Available":"System Updates"}</h3>
                        <button type="button" onclick="${o}" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">&times;</button>
                    </div>
                    ${i}
                    <p style="margin:0 0 0.8rem 0; color:#64748b; font-size:0.86rem;">Recent functionality changes</p>
                    <ul style="margin:0; padding-left:1rem; max-height:260px; overflow:auto;">
                        ${s}
                    </ul>
                    <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem;">
                        <button type="button" class="action-btn secondary" onclick="${o}">${t?"Later":"Close"}</button>
                        ${t?`<button type="button" class="action-btn" onclick="this.closest('.modal-overlay').remove(); window.app_forceRefresh();">Update now</button>`:""}
                    </div>
                </div>
            </div>
        `;window.app_showModal(l,a)};const Er=async a=>{if(!a?.waiting||!navigator.serviceWorker)return!1;const e=a.waiting;return new Promise(t=>{let n=!1;const s=r=>{n||(n=!0,navigator.serviceWorker.removeEventListener("controllerchange",i),clearTimeout(o),t(r))},i=()=>s(!0),o=setTimeout(()=>s(!1),3e3);navigator.serviceWorker.addEventListener("controllerchange",i,{once:!0}),e.postMessage({type:"SKIP_WAITING"})})};window.app_forceRefresh=async()=>{try{if(navigator.serviceWorker){const a=await navigator.serviceWorker.getRegistrations();Sa?.update&&await Sa.update();for(const e of a)await Er(e)}if(window.caches){const a=await caches.keys();await Promise.all(a.map(e=>caches.delete(e)))}}catch(a){console.warn("Force refresh cleanup failed:",a)}ja(!0),window.location.reload()};rr();console.log("App.js Loaded & Globals Ready");
