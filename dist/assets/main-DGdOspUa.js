(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(s){if(s.ep)return;s.ep=!0;const i=t(s);fetch(s.href,i)}})();const N={WORK_START_TIME:"09:00",LATE_CUTOFF_TIME:"09:15",WORK_END_TIME:"17:00",LATE_CUTOFF_MINUTES:555,MINOR_LATE_END_MINUTES:615,LATE_END_MINUTES:720,POST_NOON_END_MINUTES:810,AFTERNOON_START_MINUTES:720,EARLY_DEPARTURE_MINUTES:1020,FY_START_MONTH:3,IS_SATURDAY_OFF:a=>{const t=new Date(a).getDate(),n=Math.ceil(t/7);return n===2||n===4},LATE_GRACE_COUNT:3,LATE_DEDUCTION_PER_BLOCK:.5,EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4,READ_CACHE_TTLS:{users:6e4,settings:3e5,minutes:3e4,attendanceSummary:3e4,staffMessages:2e4,dailySummaryReadMs:6e4},READ_OPT_FLAGS:{FF_READ_OPT_DB_QUERIES:!0,FF_READ_OPT_TARGETED_REALTIME:!0,FF_READ_OPT_ANALYTICS_CACHE:!0,FF_SHARED_DAILY_SUMMARY:!0,FF_SUMMARY_LOCKING:!0,ENABLE_SIMULATION_MODULE:!1,ENABLE_READ_TELEMETRY:!0,ENABLE_PRESENCE_HEARTBEAT:!1},SUMMARY_POLICY:{STALENESS_MS:1440*60*1e3,TEAM_ACTIVITY_LIMIT:15,LOCK_TTL_MS:9e4,SCHEMA_VERSION:2,RECOMPUTE_CUTOFF_HOUR_IST:17,FALLBACK_TO_PREVIOUS_DAY:!0},HERO_POLICY:{SCHEMA_VERSION:2,WINDOW_DAYS:7,FALLBACK_LOOKBACK_DAYS:90,WEIGHTS:{taskExecution:.45,taskCompletionRate:.2,taskInProgressSupport:.1,taskMissPenalty:.1},ATTENDANCE_MODIFIER:{base:.9,maxBonus:.15,consistencyImpact:.65,effortImpact:.35},CAPS:{hours:40,qualityChars:500},DEFAULT_ACTIVITY_SCORE:70,MIN_EVIDENCE:{minDays:1,minDurationMs:1,minPlannedTasks:1}},SIMULATION_POLICY:{LEGACY_DUMMY_CLEANUP:{ENABLED:!0,FLAG_KEY:"legacy_dummy_cleanup_v1",TARGET_USER_IDS:["sim_punctual","sim_admin_new"],TARGET_USERNAMES:["jomit_p","maria"],AUDIT_COLLECTION:"system_audit_logs"}}},gs={apiKey:"AIzaSyC7a8AxukI0-egXimYTedwCa2RFnMTBu84",authDomain:"crwiattendance.firebaseapp.com",projectId:"crwiattendance",storageBucket:"crwiattendance.firebasestorage.app",messagingSenderId:"462155106938",appId:"1:462155106938:web:18291b04a5a3bec185c9c3",measurementId:"G-X6W45TV4QR"};typeof firebase<"u"&&!firebase.apps.length&&(firebase.initializeApp(gs),console.log("Firebase Initialized (Compat Mode)"));const hn=typeof firebase<"u"?firebase.firestore():null;typeof window<"u"&&(window.AppFirestore=hn);class bs{constructor(){this.db=hn,this.cache=new Map,this.telemetry={get:0,getAll:0,query:0,queryMany:0,listen:0,listenQuery:0,writes:0,docsRead:0,byCollection:{}}}async init(){if(!this.db){console.error("Firebase not initialized! Check config.");return}console.log("Firestore adapter ready.")}getFlags(){return N&&N.READ_OPT_FLAGS||{}}track(e,t,n=0){this.getFlags().ENABLE_READ_TELEMETRY&&(typeof this.telemetry[e]=="number"&&(this.telemetry[e]+=1),this.telemetry.docsRead+=Math.max(0,Number(n)||0),this.telemetry.byCollection[t]||(this.telemetry.byCollection[t]={ops:0,docsRead:0}),this.telemetry.byCollection[t].ops+=1,this.telemetry.byCollection[t].docsRead+=Math.max(0,Number(n)||0))}getReadTelemetry(){return JSON.parse(JSON.stringify(this.telemetry))}clearReadTelemetry(){this.telemetry={get:0,getAll:0,query:0,queryMany:0,listen:0,listenQuery:0,writes:0,docsRead:0,byCollection:{}}}getCacheKey(e,t,n={}){return`${e}:${t}:${JSON.stringify(n)}`}invalidateCollectionCache(e){const t=`:${e}:`;for(const n of this.cache.keys())n.includes(t)&&this.cache.delete(n)}async getCached(e,t,n){const s=Date.now(),i=this.cache.get(e);if(i&&i.expiresAt>s)return i.value;const o=await n();return this.cache.set(e,{value:o,expiresAt:s+Math.max(0,Number(t)||0)}),o}async getOrGenerateSummary(e,t,n){if(!e||typeof t!="function")throw new Error("getOrGenerateSummary requires a key and generator function.");const s=this.getCacheKey("summary","computed",{summaryKey:e}),i=typeof n=="number"?n:N?.READ_CACHE_TTLS?.attendanceSummary||3e4;return this.getCached(s,i,t)}async sleep(e){return new Promise(t=>setTimeout(t,Math.max(0,Number(e)||0)))}getSummarySchemaVersion(){return Number(N?.SUMMARY_POLICY?.SCHEMA_VERSION||1)}getIstNow(){const e=new Date;return new Date(e.toLocaleString("en-US",{timeZone:"Asia/Kolkata"}))}toDateKey(e){const t=e instanceof Date?e:new Date(e),n=t.getFullYear(),s=String(t.getMonth()+1).padStart(2,"0"),i=String(t.getDate()).padStart(2,"0");return`${n}-${s}-${i}`}getISTDateKeys(){const e=this.getIstNow(),t=new Date(e);return t.setDate(t.getDate()-1),{todayKey:this.toDateKey(e),yesterdayKey:this.toDateKey(t)}}shouldRecomputeNowIST(e){const t=Number.isFinite(Number(e))?Number(e):Number(N?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST||17);return this.getIstNow().getHours()>=Math.max(0,Math.min(23,t))}isSummaryFresh(e,t){if(!e||typeof e!="object")return!1;const n=Number(e.generatedAt||0),s=Number(e.version||0);return!n||!s||s!==this.getSummarySchemaVersion()?!1:Date.now()-n<=Math.max(0,Number(t)||0)}async getDailySummary(e){const t=String(e||"").trim();if(!t)return null;const n=N?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4,s=this.getCacheKey("dailySummary","daily_summaries",{key:t});return this.getCached(s,n,()=>this.get("daily_summaries",t))}listenDailySummary(e,t){const n=String(e||"").trim();if(!n)return null;const s=this.getCacheKey("dailySummary","daily_summaries",{key:n});return this.listenDoc("daily_summaries",n,(i,o)=>{if(i){const r=N?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4;this.cache.set(s,{value:i,expiresAt:Date.now()+r})}t&&t(i,o)})}async getSummaryByDateKey(e){return this.getDailySummary(e)}async getLatestSuccessfulSummaryMeta(){const e=N?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4,t=this.getCacheKey("dailySummaryMeta","daily_summaries_meta",{key:"latest_success"});return this.getCached(t,e,()=>this.get("daily_summaries_meta","latest_success"))}async setLatestSuccessfulSummaryMeta({dateKey:e,generatedAt:t,version:n}={}){const s=String(e||"").trim();if(!s)return;const i={id:"latest_success",dateKey:s,generatedAt:Number(t||Date.now()),version:Number(n||this.getSummarySchemaVersion())};await this.put("daily_summaries_meta",i)}async getDailySummaryWithFallback({todayKey:e,yesterdayKey:t,staleAfterMs:n}={}){const s=Math.max(1e3,Number(n)||Number(N?.SUMMARY_POLICY?.STALENESS_MS)||864e5),i=N?.SUMMARY_POLICY?.FALLBACK_TO_PREVIOUS_DAY!==!1,o=await this.getSummaryByDateKey(e);if(this.isSummaryFresh(o,s))return{summary:o,source:"today"};if(i){const l=await this.getSummaryByDateKey(t);if(l&&typeof l=="object")return{summary:l,source:"yesterday"}}const r=await this.getLatestSuccessfulSummaryMeta(),d=String(r?.dateKey||"").trim();if(d){const l=await this.getSummaryByDateKey(d);if(l&&typeof l=="object")return{summary:l,source:"latest_success"}}return{summary:o||null,source:"none"}}async putDailySummary(e,t={}){const n=String(e||"").trim();if(!n)throw new Error("putDailySummary requires dateKey.");const s={id:n,dateKey:n,version:this.getSummarySchemaVersion(),...t};return this.put("daily_summaries",s)}async acquireSummaryLock(e,t,n){const s=String(e||"").trim(),i=String(t||"").trim();if(!s||!i||!this.db||!this.db.runTransaction)return!1;if(N?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING===!1)return!0;const o=Math.max(1e3,Number(n)||Number(N?.SUMMARY_POLICY?.LOCK_TTL_MS)||9e4),r=this.db.collection("summary_locks").doc(s),d=Date.now();try{return await this.db.runTransaction(async c=>{const p=await c.get(r);if(p.exists){const u=p.data()||{},m=String(u.ownerId||"");if(Number(u.expiresAt||0)>d&&m&&m!==i)return!1}return c.set(r,{id:s,dateKey:s,ownerId:i,createdAt:d,expiresAt:d+o},{merge:!0}),!0})===!0}catch(l){return console.warn("Failed to acquire summary lock:",l),!1}}async releaseSummaryLock(e,t){const n=String(e||"").trim(),s=String(t||"").trim();if(!n||!s||!this.db||!this.db.runTransaction||N?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING===!1)return;const i=this.db.collection("summary_locks").doc(n);try{await this.db.runTransaction(async o=>{const r=await o.get(i);if(!r.exists)return;const d=r.data()||{};String(d.ownerId||"")===s&&o.delete(i)})}catch(o){console.warn("Failed to release summary lock:",o)}}async getOrCreateDailySummary({dateKey:e,yesterdayKey:t,generatorFn:n,staleAfterMs:s,lockTtlMs:i}={}){const o=this.getISTDateKeys(),r=String(e||o.todayKey||"").trim(),d=String(t||o.yesterdayKey||"").trim();if(!r||typeof n!="function")throw new Error("getOrCreateDailySummary requires dateKey and generatorFn.");const l=Math.max(1e3,Number(s)||Number(N?.SUMMARY_POLICY?.STALENESS_MS)||864e5),c=Math.max(1e3,Number(i)||Number(N?.SUMMARY_POLICY?.LOCK_TTL_MS)||9e4),p=String(window.AppAuth?.getUser?.()?.id||`anon_${Math.random().toString(36).slice(2,10)}`),u=await this.getDailySummaryWithFallback({todayKey:r,yesterdayKey:d,staleAfterMs:l});if(u.summary&&u.source==="today"&&this.isSummaryFresh(u.summary,l))return{...u.summary,_source:"shared_today"};if(!this.shouldRecomputeNowIST(N?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST))return u.summary?{...u.summary,_source:`fallback_${u.source}`}:null;if(await this.acquireSummaryLock(r,p,c))try{const w={...await n()||{},generatedAt:Date.now(),generatedBy:p,version:this.getSummarySchemaVersion()};return await this.putDailySummary(r,w),await this.setLatestSuccessfulSummaryMeta({dateKey:r,generatedAt:w.generatedAt,version:w.version}),{dateKey:r,...w,_source:"generated"}}finally{await this.releaseSummaryLock(r,p)}const h=[350,700,1200,1800];for(const f of h){await this.sleep(f);const w=await this.getDailySummary(r);if(this.isSummaryFresh(w,l))return{...w,_source:"shared"}}return u.summary?{...u.summary,_source:`fallback_${u.source}`}:null}applyFilters(e,t=[]){let n=e;return(t||[]).forEach(s=>{!s||!s.field||!s.operator||(n=n.where(s.field,s.operator,s.value))}),n}applyOptions(e,t={}){let n=e;return t.orderBy&&(Array.isArray(t.orderBy)?t.orderBy:[t.orderBy]).forEach(i=>{i&&(typeof i=="string"?n=n.orderBy(i):i.field&&(n=n.orderBy(i.field,i.direction||"asc")))}),t.limit&&(n=n.limit(t.limit)),t.startAt!==void 0&&(n=n.startAt(t.startAt)),t.endAt!==void 0&&(n=n.endAt(t.endAt)),n}isPermissionDenied(e){const t=String(e?.code||"").toLowerCase(),n=String(e?.message||"").toLowerCase();return t.includes("permission-denied")||n.includes("missing or insufficient permissions")}async getAll(e,t={}){try{const n=String(t?.source||"").trim().toLowerCase(),o=(n==="server"||n==="cache"?await this.db.collection(e).get({source:n}):await this.db.collection(e).get()).docs.map(r=>({...r.data(),id:r.id}));return this.track("getAll",e,o.length),o}catch(n){if(t?.silentPermissionDenied&&this.isPermissionDenied(n))return[];throw console.error(`Error getting all from ${e}:`,n),n}}async get(e,t,n={}){if(!t)return null;try{const s=String(t),i=this.db.collection(e).doc(s),o=String(n?.source||"").trim().toLowerCase(),d=o==="server"||o==="cache"?await i.get({source:o}):await i.get();return d.exists?(this.track("get",e,1),{...d.data(),id:d.id}):(this.track("get",e,0),null)}catch(s){throw console.error(`Error getting ${t} from ${e}:`,s),s}}async add(e,t){if(t.id)return this.put(e,t);try{const n=await this.db.collection(e).add(t);return this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"add"}})),n.id}catch(n){throw console.error(`Error adding to ${e}:`,n),n}}async put(e,t){if(!t.id)throw new Error("Item must have an ID for 'put' operation.");try{const n=String(t.id);return await this.db.collection(e).doc(n).set(t,{merge:!0}),this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"put"}})),n}catch(n){throw console.error(`Error putting ${t.id} to ${e}:`,n),n}}async delete(e,t){if(t)try{const n=String(t);await this.db.collection(e).doc(n).delete(),this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"delete"}}))}catch(n){throw console.error(`Error deleting ${t} from ${e}:`,n),n}}async deleteMany(e,t=[],n={}){const s=Array.from(new Set((t||[]).filter(Boolean).map(r=>String(r))));if(!s.length)return 0;const i=Math.max(1,Math.min(450,Number(n.chunkSize)||400));let o=0;try{for(let r=0;r<s.length;r+=i){const d=s.slice(r,r+i),l=this.db.batch();d.forEach(c=>{const p=this.db.collection(e).doc(c);l.delete(p)}),await l.commit(),o+=d.length}return this.telemetry.writes+=o,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"deleteMany",count:o}})),o}catch(r){throw console.error(`Error deleting many from ${e}:`,r),r}}async deleteAllInCollection(e,t={}){const s=(await this.getAll(e,t)||[]).map(i=>i?.id).filter(Boolean);return s.length?this.deleteMany(e,s,t):0}async query(e,t,n,s){try{const o=(await this.db.collection(e).where(t,n,s).get()).docs.map(r=>({...r.data(),id:r.id}));return this.track("query",e,o.length),o}catch(i){throw console.error(`Error querying ${e}:`,i),i}}async queryMany(e,t=[],n={}){if(!this.getFlags().FF_READ_OPT_DB_QUERIES)return this.getAll(e);try{let i=this.db.collection(e);i=this.applyFilters(i,t),i=this.applyOptions(i,n);const r=(await i.get()).docs.map(d=>({...d.data(),id:d.id}));return this.track("queryMany",e,r.length),r}catch(i){return console.warn(`queryMany failed for ${e}, falling back to getAll`,i),this.getAll(e)}}async getManyByIds(e,t=[]){const n=Array.from(new Set((t||[]).filter(Boolean).map(o=>String(o))));if(!n.length)return[];const s=[];for(let o=0;o<n.length;o+=10)s.push(n.slice(o,o+10));return(await Promise.all(s.map(async o=>{try{const r=await this.queryMany(e,[{field:"id",operator:"in",value:o}]);return r&&r.length?r:Promise.all(o.map(d=>this.get(e,d)))}catch{return Promise.all(o.map(r=>this.get(e,r)))}}))).flat().filter(Boolean)}listenDoc(e,t,n){if(!this.db||!t)return null;const s=String(t);try{return this.db.collection(e).doc(s).onSnapshot(i=>{const o=i.exists?{...i.data(),id:i.id}:null;this.track("listen",e,1),n(o,i)},i=>{console.error(`Realtime listener error in ${e}/${s}:`,i)})}catch(i){return console.error(`Error setting up listener for ${e}/${s}:`,i),null}}listenQuery(e,t=[],n={},s){if(!this.db)return null;try{let i=this.db.collection(e);return i=this.applyFilters(i,t),i=this.applyOptions(i,n),i.onSnapshot(o=>{const r=o.docs.map(d=>({...d.data(),id:d.id}));this.track("listenQuery",e,r.length),s(r,o)},o=>{console.error(`Realtime query listener error in ${e}:`,o)})}catch(i){return console.warn(`listenQuery failed for ${e}, falling back to listen`,i),this.listen(e,s)}}listen(e,t){return this.db?this.db.collection(e).onSnapshot(n=>{const s=n.docs.map(i=>({...i.data(),id:i.id}));this.track("listen",e,s.length),t(s,n)},n=>{console.error(`Realtime listener error in ${e}:`,n)}):null}}const V=new bs;typeof window<"u"&&(window.AppDB=V);class vs{constructor(){this.currentUser=null,this.sessionKey="crwi_session_user",this.heartbeatInterval=null,this.userDocUnsubscribe=null}async init(){await V.init();const e=localStorage.getItem(this.sessionKey);e&&(this.currentUser=await V.get("users",e),this.currentUser&&(this.startHeartbeat(),this.startCurrentUserSync()))}async refreshCurrentUserFromDB(){const e=localStorage.getItem(this.sessionKey);if(!e)return this.currentUser=null,null;if(this.userDocUnsubscribe&&this.currentUser&&this.currentUser.id===e)return this.currentUser;const t=await V.get("users",e);return this.currentUser=t||null,this.currentUser}async login(e,t){const n=V.getCached?await V.getCached(V.getCacheKey("authUsers","users",{mode:"login"}),N?.READ_CACHE_TTLS?.users||6e4,()=>V.getAll("users")):await V.getAll("users"),s=e.trim().toLowerCase(),i=t.trim(),o=n.find(r=>{const d=(r.username||"").toLowerCase().trim(),l=(r.email||"").toLowerCase().trim();return(d===s||l===s)&&r.password.trim()===i});return o?(this.currentUser=o,localStorage.setItem(this.sessionKey,o.id),this.startHeartbeat(),this.startCurrentUserSync(),!0):(console.warn("Login failed: invalid credentials."),!1)}async logout(){this.stopHeartbeat(),this.stopCurrentUserSync(),this.currentUser=null,localStorage.removeItem(this.sessionKey),window.location.reload()}getUser(){return this.currentUser}async updateUser(e){const t=await V.get("users",e.id);if(!t)return!1;const n={...t,...e};return e.isAdmin===!0||e.isAdmin==="true"?n.isAdmin=!0:n.isAdmin=!1,n.role=e.role||t.role||"Employee",console.log(`Auth: User ${n.id} update - Role: ${n.role}, Admin: ${n.isAdmin}`),e.name&&e.name!==t.name&&!e.avatar&&(n.avatar=`https://ui-avatars.com/api/?name=${e.name}&background=random&color=fff`),await V.put("users",n),this.currentUser&&this.currentUser.id===n.id&&(this.currentUser=n),!0}startHeartbeat(){if(!(N&&N.READ_OPT_FLAGS||{}).ENABLE_PRESENCE_HEARTBEAT){this.stopHeartbeat();return}this.heartbeatInterval&&clearInterval(this.heartbeatInterval);const t=async()=>{if(this.currentUser&&V)try{await V.put("users",{id:this.currentUser.id,lastSeen:Date.now()})}catch(n){console.warn("Heartbeat update failed:",n)}};t(),this.heartbeatInterval=setInterval(t,12e4),console.log("Presence Heartbeat started.")}stopHeartbeat(){this.heartbeatInterval&&(clearInterval(this.heartbeatInterval),this.heartbeatInterval=null,console.log("Presence Heartbeat stopped."))}startCurrentUserSync(){this.stopCurrentUserSync();const e=localStorage.getItem(this.sessionKey);if(!(!e||!window.AppFirestore))try{this.userDocUnsubscribe=window.AppFirestore.collection("users").doc(String(e)).onSnapshot(t=>{if(!t.exists){this.currentUser=null;return}const n={...t.data(),id:t.id};this.currentUser=n,window.dispatchEvent(new CustomEvent("app:user-sync",{detail:n}))},t=>{console.warn("Current user realtime sync failed:",t)})}catch(t){console.warn("Failed to start current user sync:",t)}}stopCurrentUserSync(){typeof this.userDocUnsubscribe=="function"&&this.userDocUnsubscribe(),this.userDocUnsubscribe=null}}const te=new vs;typeof window<"u"&&(window.AppAuth=te);class Ss{async getStatus(){const e=await(te.refreshCurrentUserFromDB?te.refreshCurrentUserFromDB():te.getUser());if(!e)return{status:"out",lastCheckIn:null,isPaused:!1,pauseStartedAt:null,totalPausedMs:0};if(e.status==="in"&&e.lastCheckIn)try{const t=new Date(e.lastCheckIn),n=new Date,s=t.toISOString().split("T")[0],i=n.toISOString().split("T")[0];if(s<i)return{status:"out",lastCheckIn:null,isPaused:!1,pauseStartedAt:null,totalPausedMs:0,staleSession:!0}}catch(t){console.warn("Date parsing error in getStatus:",t)}return{status:e.status||"out",lastCheckIn:e.lastCheckIn,isPaused:e.isPaused===!0,pauseStartedAt:e.pauseStartedAt||null,totalPausedMs:Number(e.totalPausedMs)||0}}async checkIn(e,t,n="Unknown Location"){const s=await(te.refreshCurrentUserFromDB?te.refreshCurrentUserFromDB():te.getUser());if(!s)throw new Error("User not authenticated");let i=!1,o="",r=null,d=null;if(s.status==="in"&&s.lastCheckIn){const c=new Date(s.lastCheckIn),p=new Date,u=`${c.getFullYear()}-${String(c.getMonth()+1).padStart(2,"0")}-${String(c.getDate()).padStart(2,"0")}`,m=`${p.getFullYear()}-${String(p.getMonth()+1).padStart(2,"0")}-${String(p.getDate()).padStart(2,"0")}`;if(u<m)if(await this.hasRecordedCheckoutForSession(s.id,c,p))s.status="out",s.lastCheckIn=null,s.isPaused=!1,s.pauseStartedAt=null,s.totalPausedMs=0,s.pauseEvents=[],s.currentLocation=null,s.locationMismatched=!1,o="Recovered previous checkout record and cleared stale session status.";else{const w=new Date(c.getTime()+144e5),v={status:"Half Day",dayCredit:this.getDayCredit("Half Day"),lateCountable:!1},k=s.currentLocation||s.lastLocation||null,b=new Date().toISOString(),M={id:String(Date.now()),user_id:s.id,date:w.toISOString().split("T")[0],checkIn:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:w.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),duration:this.msToTime(144e5),durationMs:144e5,type:v.status,dayCredit:v.dayCredit,lateCountable:v.lateCountable,extraWorkedMs:0,policyVersion:"v2",location:k?.address||"Missed checkout session",lat:k?.lat??null,lng:k?.lng??null,checkOutLocation:"System closure on next check-in",outLat:null,outLng:null,workDescription:"System closure: missed checkout auto-closed as half day. Reason required on next login.",locationMismatched:!1,locationExplanation:"",activityScore:0,autoCheckout:!0,autoCheckoutReason:"missed_checkout_next_login",autoCheckoutAt:b,autoCheckoutRequiresApproval:!1,autoCheckoutExtraApproved:null,missedCheckoutResolved:!0,missedCheckoutPolicy:"half_day_on_missed_checkout",missedCheckoutReasonRequired:!0,missedCheckoutReasonStatus:"pending",missedCheckoutReason:"",missedCheckoutReasonSubmittedAt:null,missedCheckoutReviewedBy:"",missedCheckoutReviewedAt:"",missedCheckoutReviewNote:"",systemClosedAt:b,synced:!1};await V.add("attendance",M),r=M.id,d=M.date,s.status="out",s.lastCheckOut=w.getTime(),s.lastLocation=k,s.lastCheckOutLocation={lat:null,lng:null,address:"System closure on next check-in"},s.locationMismatched=!1,s.lastCheckIn=null,s.isPaused=!1,s.pauseStartedAt=null,s.totalPausedMs=0,s.pauseEvents=[],s.currentLocation=null,i=!0,o="Previous open session was closed as half day because checkout was missed. Please submit a reason for admin verification."}else return{ok:!1,conflict:!0,message:"Status updated from another device."}}s.status="in",s.lastCheckIn=Date.now(),s.isPaused=!1,s.pauseStartedAt=null,s.totalPausedMs=0,s.pauseEvents=[];const l=n&&n!=="Unknown Location"?n:e&&t?`Lat: ${Number(e).toFixed(4)}, Lng: ${Number(t).toFixed(4)}`:"Unknown Location";return s.currentLocation={lat:e,lng:t,address:l},await V.put("users",s),{ok:!0,resolvedMissedCheckout:i,noticeMessage:o,missedCheckoutReasonRequired:i,missedCheckoutLogId:r,missedCheckoutDate:d}}async pauseSession(){const e=await(te.refreshCurrentUserFromDB?te.refreshCurrentUserFromDB():te.getUser());if(!e||e.status!=="in")return{ok:!1,conflict:!0,message:"Status updated from another device."};if(e.isPaused===!0)return{ok:!1,conflict:!0,message:"Session is already paused."};const t=Date.now(),n=Array.isArray(e.pauseEvents)?e.pauseEvents.slice(-99):[];return n.push({type:"pause",at:new Date(t).toISOString(),atMs:t}),e.isPaused=!0,e.pauseStartedAt=t,e.totalPausedMs=Number(e.totalPausedMs)||0,e.pauseEvents=n,await V.put("users",e),{ok:!0}}async resumeSession(){const e=await(te.refreshCurrentUserFromDB?te.refreshCurrentUserFromDB():te.getUser());if(!e||e.status!=="in")return{ok:!1,conflict:!0,message:"Status updated from another device."};if(e.isPaused!==!0)return{ok:!1,conflict:!0,message:"Session is not paused."};const t=Date.now(),n=Number(e.pauseStartedAt)||t,s=Math.max(0,t-n),i=Array.isArray(e.pauseEvents)?e.pauseEvents.slice(-99):[];return i.push({type:"resume",at:new Date(t).toISOString(),atMs:t}),e.totalPausedMs=(Number(e.totalPausedMs)||0)+s,e.isPaused=!1,e.pauseStartedAt=null,e.pauseEvents=i,await V.put("users",e),{ok:!0,resumedPausedMs:s,totalPausedMs:e.totalPausedMs}}async checkOut(e="",t=null,n=null,s="Detected Location",i=!1,o="",r={}){const d=await(te.refreshCurrentUserFromDB?te.refreshCurrentUserFromDB():te.getUser());if(!d||d.status!=="in")return{ok:!1,conflict:!0,message:"Status updated from another device."};const l=new Date(d.lastCheckIn),c=r.checkOutTime?new Date(r.checkOutTime):new Date,p=l.getTime(),u=c.getTime(),m=Number(d.totalPausedMs)||0,h=Number(d.pauseStartedAt)||0;let f=0;d.isPaused===!0&&h>0&&u>h&&(f=u-h);const w=Math.max(0,m+f),v=Math.max(0,u-p-w),k=this.evaluateAttendanceStatus(l,v),b=window.AppActivity?window.AppActivity.getStats():{score:0},M=Array.isArray(d.pauseEvents)?d.pauseEvents.slice():[];f>0&&M.push({type:"resume",at:c.toISOString(),atMs:u,autoClosedOnCheckout:!0});const A=M.filter(S=>S&&S.type==="pause").length,g={id:String(Date.now()),user_id:d.id,date:c.toISOString().split("T")[0],checkIn:l.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),duration:this.msToTime(v),durationMs:v,pausedMs:w,pauseCount:A,pauseEvents:M,type:k.status,dayCredit:k.dayCredit,lateCountable:k.lateCountable,extraWorkedMs:k.extraWorkedMs||0,policyVersion:"v2",location:d.currentLocation?.address||"Checked In Location",lat:d.currentLocation?.lat,lng:d.currentLocation?.lng,checkOutLocation:s||(t&&n?`Lat: ${Number(t).toFixed(4)}, Lng: ${Number(n).toFixed(4)}`:"Detected Location"),outLat:t,outLng:n,workDescription:e||"",locationMismatched:i,locationExplanation:o||"",activityScore:b.score,autoCheckout:!!r.autoCheckout,autoCheckoutReason:r.autoCheckoutReason||"",autoCheckoutAt:r.autoCheckoutAt||null,autoCheckoutRequiresApproval:!!r.autoCheckoutRequiresApproval,autoCheckoutExtraApproved:r.autoCheckoutExtraApproved??null,overtimePrompted:!!r.overtimePrompted,overtimeReasonTag:r.overtimeReasonTag||"",overtimeExplanation:r.overtimeExplanation||"",overtimeCappedToEightHours:!!r.overtimeCappedToEightHours,taskUpdates:Array.isArray(r.taskUpdates)?r.taskUpdates:[],entrySource:"checkin_checkout",attendanceEligible:!0,synced:!1};return await V.add("attendance",g),d.status="out",d.lastCheckOut=Date.now(),d.lastLocation=d.currentLocation,d.lastCheckOutLocation={lat:t,lng:n,address:s},d.locationMismatched=i,d.lastCheckIn=null,d.isPaused=!1,d.pauseStartedAt=null,d.totalPausedMs=0,d.pauseEvents=[],d.currentLocation=null,await V.put("users",d),window.AppActivity&&window.AppActivity.stop(),{ok:!0,conflict:!1}}async addAdminLog(e,t){const n={id:String(Date.now()),user_id:e,...t,isManualOverride:t.isManualOverride===!0,entrySource:t.entrySource||"admin_override",attendanceEligible:Object.prototype.hasOwnProperty.call(t,"attendanceEligible")?t.attendanceEligible===!0:!0,synced:!1};return await V.add("attendance",n),n}async deleteLog(e){if(e)return await V.delete("attendance",e),!0}async updateLog(e,t){if(!e)return;const n=await V.get("attendance",e);if(!n)throw new Error("Log not found");const s={...n,...t,isManualOverride:Object.prototype.hasOwnProperty.call(t,"isManualOverride")?t.isManualOverride===!0:!!n.isManualOverride,entrySource:t.entrySource||n.entrySource||"admin_override",attendanceEligible:Object.prototype.hasOwnProperty.call(t,"attendanceEligible")?t.attendanceEligible===!0:Object.prototype.hasOwnProperty.call(n,"attendanceEligible")?n.attendanceEligible===!0:!0,id:e};return await V.put("attendance",s),s}async addManualLog(e){const t=te.getUser();if(!t)return;const n=this.buildDateTime(e.date,e.checkIn),s=this.buildDateTime(e.date,e.checkOut),i=n&&s?s-n:0,o=this.evaluateAttendanceStatus(n||new Date,i),r=String(e.type||"").trim(),d=!r||r==="Manual"?o.status:r,l=Object.prototype.hasOwnProperty.call(e,"attendanceEligible")?e.attendanceEligible===!0:d!=="Work Log",c=l?d:r||"Work Log",p={id:String(Date.now()),user_id:t.id,...e,type:c,durationMs:typeof e.durationMs=="number"?e.durationMs:i,dayCredit:l?typeof e.dayCredit=="number"?e.dayCredit:o.dayCredit:0,lateCountable:l&&(e.lateCountable===!0||c==="Late"),extraWorkedMs:l?typeof e.extraWorkedMs=="number"?e.extraWorkedMs:o.extraWorkedMs||0:0,entrySource:e.entrySource||"staff_manual_work",attendanceEligible:l,synced:!1};return await V.add("attendance",p),p}async getLogs(e=null){const t=e||te.getUser()?.id;if(!t)return[];try{const n=window.AppFirestore;if(!n)return[];let s=n.collection("attendance");s=s.where("user_id","==",t);const r=(await s.get()).docs.map(c=>({...c.data(),id:c.id})).sort((c,p)=>p.id-c.id).map(c=>((!c.location||c.location==="Unknown Location")&&c.lat&&c.lng&&(c.location=`Lat: ${Number(c.lat).toFixed(4)}, Lng: ${Number(c.lng).toFixed(4)}`),c)),d=new Set,l=r.filter(c=>{const p=`${c.date}|${c.checkIn}`;return d.has(p)?!1:(d.add(p),!0)});try{const c=await V.get("users",t);if(c&&c.status==="in"&&c.lastCheckIn){const p=new Date(c.lastCheckIn),u={id:"active_now",date:p.toLocaleDateString(),checkIn:p.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:"Active Now",duration:"Working...",type:"Office",location:c.currentLocation?.address&&c.currentLocation.address!=="Unknown Location"?c.currentLocation.address:c.currentLocation?.lat&&c.currentLocation?.lng?`Lat: ${Number(c.currentLocation.lat).toFixed(4)}, Lng: ${Number(c.currentLocation.lng).toFixed(4)}`:"Current Session"};l.unshift(u)}}catch(c){console.warn("Could not fetch active status for logs",c)}return l.slice(0,50)}catch(n){return console.warn("Optimized log fetch failed, falling back to simple filter",n),[]}}async getAllLogs(){return await V.getAll("attendance")}msToTime(e){let t=Math.floor(e/6e4%60);return`${Math.floor(e/(1e3*60*60)%24)}h ${t}m`}async hasRecordedCheckoutForSession(e,t,n=new Date){if(!e||!(t instanceof Date)||Number.isNaN(t.getTime()))return!1;try{const s=await V.query("attendance","user_id","==",e);if(!Array.isArray(s)||s.length===0)return!1;const i=300*1e3,o=new Date(t);o.setSeconds(0,0);const r=n instanceof Date&&!Number.isNaN(n.getTime())?n.getTime()+i:Date.now()+i;return s.some(d=>{if(!d||!d.checkOut||d.checkOut==="Active Now"||d.autoCheckout&&d.autoCheckoutReason==="missed_checkout_next_login")return!1;const l=this.buildDateTime(d.date,d.checkIn),c=this.buildDateTime(d.date,d.checkOut);if(!l||!c||c.getTime()<l.getTime())return!1;const p=new Date(l);if(p.setSeconds(0,0),!(Math.abs(p.getTime()-o.getTime())<=i))return!1;const m=c.getTime();return m>=t.getTime()&&m<=r})}catch(s){return console.warn("Failed to verify prior checkout record before auto-closing session:",s),!1}}buildDateTime(e,t){if(!e||!t)return null;const n=String(e).trim(),s=String(t).trim(),i=new Date(`${n}T00:00:00`);if(Number.isNaN(i.getTime()))return null;const o=s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);if(o){const l=Number(o[1]),c=Number(o[2]),p=Number(o[3]||0);return l<0||l>23||c<0||c>59||p<0||p>59?null:(i.setHours(l,c,p,0),i)}const r=s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)$/i);if(r){let l=Number(r[1]);const c=Number(r[2]),p=Number(r[3]||0),u=String(r[4]||"").toUpperCase();return l<1||l>12||c<0||c>59||p<0||p>59?null:(l===12&&(l=0),u==="PM"&&(l+=12),i.setHours(l,c,p,0),i)}const d=new Date(`${n}T${s}`);return Number.isNaN(d.getTime())?null:d}normalizeType(e){const t=String(e||"").trim();return!t||t==="Manual"?"Present":t==="Manual/WFH"?"Work - Home":t}getDayCredit(e){const t=this.normalizeType(e);return t==="Half Day"?.5:t==="Absent"?0:t==="Present"||t==="Present (Late Waived)"||t==="Late"||t==="Work - Home"||t==="On Duty"?1:0}evaluateAttendanceStatus(e,t=0){if(!e||Number.isNaN(e.getTime()))return{status:"Absent",dayCredit:0,lateCountable:!1,extraWorkedMs:0};if(e.getDay()===0)return{status:"Present",dayCredit:1,lateCountable:!1,extraWorkedMs:0};const s=e.getHours()*60+e.getMinutes(),i=Math.max(0,t)/(1e3*60*60),o=(typeof N<"u"&&N?N.LATE_CUTOFF_MINUTES:555)||555,r=(typeof N<"u"&&N?N.MINOR_LATE_END_MINUTES:615)||615,d=(typeof N<"u"&&N?N.LATE_END_MINUTES:720)||720,l=(typeof N<"u"&&N?N.POST_NOON_END_MINUTES:810)||810,c=(typeof N<"u"&&N?N.AFTERNOON_START_MINUTES:720)||720;let p="Present",u=!1,m=0;return s>=c?(i>=8?p="Present":i>=4?p="Half Day":p="Absent",i>4&&(m=Math.max(0,t-14400*1e3)),{status:p,dayCredit:this.getDayCredit(p),lateCountable:!1,extraWorkedMs:m}):(s>l?p="Absent":s>d||s>r?p=i>=4?"Half Day":"Absent":s>o?i>=8?p="Present (Late Waived)":(p="Late",u=!0):i>=8?p="Present":i>=4?p="Half Day":p="Absent",{status:p,dayCredit:this.getDayCredit(p),lateCountable:u,extraWorkedMs:m})}calculateStatus(e){return this.evaluateAttendanceStatus(e,480*60*1e3).status}}const yn=new Ss;typeof window<"u"&&(window.AppAttendance=yn);function D(a){return a==null?"":String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Re(a){return D(a)}function As(a){return String(a??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,"\\n").replace(/\r/g,"\\r")}function ot(a,e="https://via.placeholder.com/24"){return!a||typeof a!="string"?e:a.startsWith("http")||a.startsWith("data:")||a.startsWith("/")||a.startsWith("./")?a:e}function da(a){if(!a)return"Never";const e=new Date(a);if(isNaN(e.getTime()))return"Unknown";const t=Math.floor((new Date-e)/1e3);if(t<60)return"just now";let n=t/31536e3;return n>1?Math.floor(n)+" years ago":(n=t/2592e3,n>1?Math.floor(n)+" months ago":(n=t/86400,n>1?Math.floor(n)+" days ago":(n=t/3600,n>1?Math.floor(n)+" hours ago":(n=t/60,n>1?Math.floor(n)+" mins ago":Math.floor(t)+" seconds ago"))))}typeof window<"u"&&(window.safeHtml=D,window.safeAttr=Re,window.safeJsStr=As,window.safeUrl=ot,window.timeAgo=da);function ks(a,e=!0){const t=Math.max(0,Math.min(5,Number(a)||0)),n=Math.floor(t),s=t-n>=.5,i=5-n-(s?1:0);let o='<div class="star-rating-display">';for(let r=0;r<n;r++)o+='<i class="fa-solid fa-star star-filled"></i>';s&&(o+='<i class="fa-solid fa-star-half-stroke star-filled"></i>');for(let r=0;r<i;r++)o+='<i class="fa-regular fa-star star-empty"></i>';return e&&(o+=`<span class="star-rating-number">${t.toFixed(1)}</span>`),o+="</div>",o}function wn(a,e=!0){const t=String(a||"to-be-started").toLowerCase();let n="To Be Started",s="fa-circle-dot",i="status-badge-to-be-started";return t==="in-process"||t==="in-progress"?(n="In Progress",s="fa-spinner fa-spin",i="status-badge-in-process"):t==="completed"?(n="Completed",s="fa-circle-check",i="status-badge-completed"):t==="overdue"?(n="Overdue",s="fa-circle-exclamation",i="status-badge-overdue"):(t==="not-completed"||t==="cancelled")&&(n="Not Completed",s="fa-circle-xmark",i="status-badge-not-completed"),`
        <div class="status-badge ${i}">
            ${e?`<i class="fa-solid ${s}"></i>`:""}
            <span>${n}</span>
        </div>
    `}const Da=a=>{const e=new Date,t=window.AppAuth?.getUser();window.app_calMonth===void 0&&(window.app_calMonth=e.getMonth()),window.app_calYear===void 0&&(window.app_calYear=e.getFullYear());const n=window.app_calYear,s=window.app_calMonth,i=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],o=new Date(n,s,1).getDay(),r=new Date(n,s+1,0).getDate();let d="";for(let l=0;l<o;l++)d+='<div class="cal-day empty"></div>';for(let l=1;l<=r;l++){const c=`${n}-${String(s+1).padStart(2,"0")}-${String(l).padStart(2,"0")}`,p=typeof window.app_getDayEvents=="function"?window.app_getDayEvents(c,a):[],u=p.some(v=>v.type==="leave"),m=p.some(v=>v.type==="event"),h=p.some(v=>v.type==="work"),f=l===e.getDate()&&s===e.getMonth()&&n===e.getFullYear(),w=window.AppAnalytics?window.AppAnalytics.getDayType(new Date(n,s,l)):"Work Day";d+=`
            <div class="cal-day ${f?"today":""} ${u?"has-leave":""} ${m?"has-event":""} ${h?"has-work":""} ${w==="Holiday"?"is-holiday":""} ${w==="Half Day"?"is-half-day":""}" 
                    onclick="window.app_openDayPlan('${c}')" style="cursor:pointer;" title="${w}">
                ${l}
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
                        <h4 style="margin:0; color:#1f2937; font-size:0.9rem;">${i[s]} ${n}</h4>
                    </div>
                    <button onclick="window.app_changeCalMonth(1)" style="background:none; border:none; color:#6b7280; cursor:pointer; padding:2px;"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                    ${t&&(t.role==="Administrator"||t.isAdmin)?'<button onclick="window.app_openEventModal()" style="background:none; border:none; color:var(--primary); cursor:pointer;"><i class="fa-solid fa-plus-circle"></i></button>':""}
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
    `},Ve=a=>String(a??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'"),la="dashboard-card-max-overlay",ca="dashboard-card-max-title",xa="dashboard-card-max-body",ue="tile",gn="original",we="fullscreen",bn=new Set([ue,gn,we]),Ds=["dashboard-hero-card"],xs=()=>{let a=document.getElementById(la);return a||(a=document.createElement("div"),a.id=la,a.className="dashboard-max-overlay",a.innerHTML=`
            <div class="dashboard-max-window" role="dialog" aria-modal="true" aria-labelledby="${ca}">
                <div class="dashboard-max-header">
                    <h2 id="${ca}"></h2>
                    <button type="button" class="dashboard-max-close" onclick="window.app_closeDashboardCardMaximize?.()" aria-label="Close maximized card">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="${xa}" class="dashboard-max-body"></div>
            </div>
        `,a.addEventListener("click",e=>{e.target===a&&window.app_closeDashboardCardMaximize?.()}),document.body.appendChild(a)),a},vn=a=>{document?.body&&document.body.classList.toggle("dashboard-max-open",!!a)},tt=()=>{const a=window._dashboardMaxCardId?String(window._dashboardMaxCardId):"",e=document.getElementById(la);e&&(e.classList.remove("open"),e.remove());const t=document.getElementById(xa);t&&(t.innerHTML=""),vn(!1),document?.body&&(document.body.style.overflow="");const n=window._dashboardMaxTriggerEl;if(window._dashboardMaxTriggerEl=null,window._dashboardMaxCardId=null,a){const s=_a(a);s&&(Sn(s,ue),s.dataset.dashboardCardMode=ue),window._dashboardCardModeState&&(window._dashboardCardModeState[a]=ue)}if(n&&typeof n.focus=="function")try{n.focus()}catch{}},_s=(a,e=null)=>{tt();const t=(window._dashboardCardTemplates||{})[a];if(!t)return;const n=xs(),s=document.getElementById(ca),i=document.getElementById(xa);if(!s||!i)return;s.textContent=t.title||"Dashboard Card",i.innerHTML=`<div class="dashboard-max-card-content">${t.expandedHtml||t.originalHtml||t.tileHtml||""}</div>`,window._dashboardMaxTriggerEl=e,window._dashboardMaxCardId=a,vn(!0),n.classList.add("open");const o=n.querySelector(".dashboard-max-close");if(o)try{o.focus()}catch{}},_a=a=>a?document.querySelector(`.dashboard-staff-view .card[data-dashboard-card-id="${a}"]`):null,Sn=(a,e)=>{a&&(a.classList.remove("dashboard-card-mode-tile","dashboard-card-mode-original"),e===gn?(a.classList.add("dashboard-card-mode-original"),a.dataset.dashboardOriginalFullWidth==="1"&&a.classList.add("full-width")):(a.classList.add("dashboard-card-mode-tile"),a.classList.remove("full-width")))},Xt=(a,e,t=null)=>{if(!bn.has(e))return;const n=document.querySelectorAll(".dashboard-staff-view .card[data-dashboard-card-id]");n.length&&(n.forEach(s=>{const o=s.dataset.dashboardCardId===String(a)?e:ue;Sn(s,o),s.dataset.dashboardCardMode=o}),window._dashboardCardModeState=window._dashboardCardModeState||{},window._dashboardCardModeState[a]=e,window._dashboardActiveCardModeId=a,e===we?_s(a,t||_a(a)):tt())},$s=a=>{const e=a.querySelector(".dashboard-card-title, .dashboard-stats-card-title, .dashboard-worklog-head h4, .dashboard-team-activity-head h4, .dashboard-staff-directory-head h4, .dashboard-tagged-head h4, .dashboard-leave-requests-head h4, .dashboard-leave-history-head h4, h3, h4");return String(e?.textContent||"").trim()||"Dashboard Card"},Ts=(a,e)=>a.classList.contains("dashboard-checkin-card")?"checkin":a.classList.contains("dashboard-worklog-card")?"worklog":a.classList.contains("dashboard-team-activity-card")?"team-activity":a.classList.contains("dashboard-team-schedule-card")?"team-schedule":a.classList.contains("dashboard-staff-directory-card")?"staff-directory":a.classList.contains("dashboard-leave-requests-card")?"leave-requests":a.classList.contains("dashboard-leave-history-card")?"leave-history":a.classList.contains("dashboard-tagged-card")?"missed-checkout":a.classList.contains("dashboard-stats-card")?`stats-${a.getAttribute("data-stats-type")||e}`:`dashboard-card-${e}`,Is=a=>{let e=a.innerHTML||"";if(e=e.replace(/<div[^>]*class="[^"]*dashboard-card-mode-controls[^"]*"[^>]*>[\s\S]*?<\/div>/gi,"").replace(/<button[^>]*class="[^"]*dashboard-card-max-btn[^"]*"[^>]*>[\s\S]*?<\/button>/gi,"").replace(/<button[^>]*class="[^"]*dashboard-expand-inline-btn[^"]*"[^>]*>[\s\S]*?<\/button>/gi,""),a.classList.contains("dashboard-worklog-card")&&(e=e.replace(/id="act-start"/g,'id="act-start-max"').replace(/id="act-end"/g,'id="act-end-max"').replace(/id="activity-list"/g,'id="activity-list-max"').replace(/window\.app_filterActivity\(\)/g,"window.app_filterActivity?.('act-start-max','act-end-max','activity-list-max')")),a.classList.contains("dashboard-team-activity-card")&&(e=e.replace(/id="staff-activity-list"/g,'id="staff-activity-list-max"').replace(/id="staff-activity-range-label"/g,'id="staff-activity-range-label-max"').replace(/window\.app_setStaffActivityMonth\(this\.value\)/g,"window.app_setStaffActivityMonth(this.value, 'staff-activity-list-max', 'staff-activity-range-label-max')").replace(/window\.app_setStaffActivitySort\(this\.value\)/g,"window.app_setStaffActivitySort(this.value, 'staff-activity-list-max', 'staff-activity-range-label-max')")),a.classList.contains("dashboard-stats-card")){const t=String(a.getAttribute("data-stats-type")||"").trim();t&&(e+=Ps(t))}return e},Ms=a=>{let e=a.innerHTML||"";return e=e.replace(/<div[^>]*class="[^"]*dashboard-card-mode-controls[^"]*"[^>]*>[\s\S]*?<\/div>/gi,"").replace(/<button[^>]*class="[^"]*dashboard-card-max-btn[^"]*"[^>]*>[\s\S]*?<\/button>/gi,""),e},Ka=(a,e,t)=>{const n=document.createElement("button");return n.type="button",n.className=`dashboard-card-mode-btn dashboard-card-mode-btn-${t}`,n.setAttribute("data-mode",t),n.setAttribute("aria-label",`Show fullscreen ${e}`),n.innerHTML='<i class="fa-solid fa-expand"></i>',n.addEventListener("click",()=>window.app_toggleDashboardCardMode?.(a,t,n)),n},Cs=(a,e,t)=>{let n=a.querySelector(".dashboard-card-mode-controls");n?(n.innerHTML="",n.appendChild(Ka(e,t,we))):(n=document.createElement("div"),n.className="dashboard-card-mode-controls",n.setAttribute("role","group"),n.setAttribute("aria-label",`${t} view controls`),n.appendChild(Ka(e,t,we)),a.appendChild(n))},Ls=()=>{const a=document.querySelector(".dashboard-staff-view");if(!a)return;const e=a.querySelectorAll(".card"),t={};Array.from(e).forEach((n,s)=>{if(Ds.some(r=>n.classList.contains(r))){n.classList.remove("dashboard-card-compact","dashboard-card-mode-tile","dashboard-card-mode-original","dashboard-card-has-controls"),n.dataset.dashboardCardId="",n.dataset.dashboardCardMode="";const r=n.querySelector(".dashboard-card-mode-controls");r&&r.remove();return}const i=Ts(n,s),o=$s(n);n.classList.add("dashboard-card-compact","dashboard-card-mode-tile"),n.classList.remove("dashboard-card-mode-original"),n.dataset.dashboardOriginalFullWidth=n.classList.contains("full-width")?"1":"0",n.classList.remove("full-width"),n.dataset.dashboardCardId=i,n.dataset.dashboardCardMode=ue,Cs(n,i,o),t[i]={title:o,tileHtml:n.innerHTML,originalHtml:Ms(n),expandedHtml:Is(n)}}),window._dashboardCardTemplates=t,window._dashboardCardModeState={}},ze={controllers:new WeakMap,elements:new Set};function je(){return window.app_staffActivityState||(window.app_staffActivityState={selectedMonth:new Date().toISOString().slice(0,7),sortKey:"date-desc",logs:[],leaveHistoryDate:new Date().toISOString().slice(0,10)}),window.app_staffActivityState.leaveHistoryDate||(window.app_staffActivityState.leaveHistoryDate=new Date().toISOString().slice(0,10)),window.app_staffActivityState}function An(a){const e=a?new Date(`${a}T00:00:00`):new Date;if(Number.isNaN(e.getTime()))return An(new Date().toISOString().slice(0,10));const t=e.getDay(),n=t===0?-6:1-t,s=new Date(e);s.setDate(e.getDate()+n),s.setHours(0,0,0,0);const i=new Date(s);i.setDate(s.getDate()+6),i.setHours(23,59,59,999);const o=r=>{const d=r.getFullYear(),l=String(r.getMonth()+1).padStart(2,"0"),c=String(r.getDate()).padStart(2,"0");return`${d}-${l}-${c}`};return{start:s,end:i,startKey:o(s),endKey:o(i),label:`${s.toLocaleDateString("en-US",{month:"short",day:"numeric"})} - ${i.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`}}let Va=!1;function Es(){Va||typeof document>"u"||(Va=!0,document.addEventListener("click",async a=>{const e=a.target&&a.target.closest?a.target.closest(".dashboard-leave-btn[data-action][data-leave-id]"):null;if(!e)return;a.preventDefault();const t=String(e.dataset.action||""),n=String(e.dataset.leaveId||"");if(n)try{if(t==="export"){window.AppLeaves?.exportLeave&&await window.AppLeaves.exportLeave(n);return}if(t==="comment"){window.AppLeaves?.commentLeave&&await window.AppLeaves.commentLeave(n);return}if(t==="approve"||t==="reject"){const s=t==="approve"?"Approved":"Rejected",i=window.AppAuth?.getUser?.()?.id;if(window.AppLeaves?.updateLeaveStatus&&await window.AppLeaves.updateLeaveStatus(n,s,i),typeof window.app_refreshCurrentPage=="function")await window.app_refreshCurrentPage();else{const o=document.getElementById("page-content");o&&(o.innerHTML=await Ft())}}}catch(s){console.error("Dashboard leave action failed:",s)}}))}function xe(a,e={}){const t=a?.state||(a?.user?"winner":"no_eligible_data");if(!a||t!=="winner"){const f=a?.reason||(t==="fetch_error"?"Hero stats are temporarily unavailable.":"No eligible hero data available."),w=t==="fetch_error"?"Fetch Error":"No Eligible Data";return`
            <div class="card dashboard-hero-stats-card hero-slot">
                <div class="dashboard-hero-stats-head">
                    <div class="hero-label-badge">Hero of the Week</div>
                    ${e.generatedAt?`<span class="hero-sync-time" title="Source: ${e.source||a?.source||"unknown"}">Synced ${da(e.generatedAt)}</span>`:""}
                </div>
                <div class="dashboard-activity-empty">
                    ${D(f)}
                </div>
                <div class="dashboard-hero-stats-foot">
                    <span class="dashboard-kpi-tag">${w}</span>
                </div>
            </div>`}const{user:n,stats:s}=a,i=Number(s?.taskPlanned??0),o=Number(s?.taskCompleted??0),r=Number(s?.taskInProgress??0),d=Number(s?.taskMissed??0),l=Number(s?.days??0),c=Number(s?.hours??0),p=Number(s?.attendanceFactor??1),u=e.source==="generated",m=Number.isFinite(Number(a?.confidence))?Math.round(Number(a.confidence)*100):0,h=a?.period==="latest_active_window"?"Latest Active Window":"Weekly";return`
        <div class="card dashboard-hero-stats-card hero-slot ${u?"is-new-summary":""}">
            <div class="dashboard-hero-stats-head">
                <div class="hero-label-badge">Hero of the Week</div>
                ${e.generatedAt?`<span class="hero-sync-time" title="Source: ${e.source||a?.source||"unknown"}">Synced ${da(e.generatedAt)}</span>`:""}
            </div>
            <div class="dashboard-hero-stats-body">
                <div class="hero-profile">
                    <img src="${ot(n.avatar)}" alt="${D(n.name)}" class="hero-avatar">
                    <div class="hero-info">
                        <div class="hero-name">${D(n.name)}</div>
                        <div class="hero-role">${D(n.role||"Staff")}</div>
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
                        <div class="hero-metric-label">Missed</div>
                    </div>
                </div>
                <div class="hero-attendance-modifier-row">
                    <span class="hero-attendance-pill">Days <strong>${l}</strong></span>
                    <span class="hero-attendance-pill">Hours <strong>${c}h</strong></span>
                    <span class="hero-attendance-pill">Factor <strong>x${p.toFixed(2)}</strong></span>
                </div>
            </div>
            <div class="dashboard-hero-stats-foot">
                <span class="dashboard-kpi-tag">${D(h)}</span>
                <span class="dashboard-kpi-tag">Confidence ${m}%</span>
            </div>
        </div>`}function kn(a,e=[],t=null,n=[]){const s=new Date,i=new Date(s);i.setDate(i.getDate()-180);const o=i.toISOString().split("T")[0],r=s.toISOString().split("T")[0],d=t?t.id:window.AppAuth.getUser().id,l=t&&t.name||window.AppAuth.getUser().name;return`
        <div class="card dashboard-worklog-card">
            <div class="dashboard-worklog-head">
                 <h4>Work Log <span class="dashboard-worklog-staff">(${D(l)})</span></h4>
                 <span>Ongoing & Historical Tasks</span>
            </div>
             <div class="dashboard-worklog-filter-row">
                <input type="date" id="act-start" value="${o}" class="dashboard-worklog-date-input">
                <span class="dashboard-worklog-to">to</span>
                <input type="date" id="act-end" value="${r}" class="dashboard-worklog-date-input">
                <button onclick="window.app_filterActivity()" class="dashboard-worklog-go-btn">Go</button>
            </div>
            <div id="activity-list" class="dashboard-worklog-list">
                ${Ot(a,o,r,d,e,n)}
            </div>
        </div>
    `}function Ot(a,e,t,n,s=[],i=[]){const o=new Date(e),r=new Date(t);r.setHours(23,59,59,999);const d=a.filter(k=>{const b=new Date(k.date),M=k.workDescription||(k.location&&!k.location.startsWith("Lat:")?k.location:"Standard Activity");return k._displayDesc=M,k._isCollab=!1,k._sortTime=k.checkOut||"00:00",b>=o&&b<=r}),l=[];s.forEach(k=>{const b=new Date(k.date);if(b<o||b>r)return;k.plans.filter(A=>A.tags&&A.tags.some(g=>g.id===n&&g.status==="accepted")).forEach(A=>{l.push({date:k.date,workDescription:`🤝 Collaborated with ${k.userName}: ${A.task}${A.subPlans&&A.subPlans.length>0?` (Sub-tasks: ${A.subPlans.join(", ")})`:""}`,checkOut:"Planned / Accepted",_displayDesc:`🤝 Collaborated with ${k.userName}: ${A.task}${A.subPlans&&A.subPlans.length>0?` (Sub-tasks: ${A.subPlans.join(", ")})`:""}`,_isCollab:!0,_sortTime:"23:59"})})});const c=[];i.forEach(k=>{(k.actionItems||[]).forEach(b=>{if(b.assignedTo!==n)return;const M=b.dueDate||k.date,A=new Date(M);A<o||A>r||c.push({date:M,workDescription:`📋 Meeting Task: ${b.task} (from ${k.title})`,status:b.status||"pending",checkOut:"Action Item",_displayDesc:`📋 Meeting Task: ${b.task} (from ${k.title})`,_isCollab:!1,_isMinute:!0,_meetingId:k.id,_sortTime:"09:00"})})});const p=[...d,...l,...c].sort((k,b)=>{const M=new Date(b.date)-new Date(k.date);return M!==0?M:b._sortTime.localeCompare(k._sortTime)});if(p.length===0)return'<div class="dashboard-activity-empty">No activity descriptions found.</div>';let u="",m="";const h=window.AppAuth.getUser(),f=window.app_hasPerm("dashboard","admin",h),w=h&&String(n||"")===String(h.id||""),v=!!(f||w);return p.forEach(k=>{k.date!==m&&(u+=`<div class="dashboard-activity-date">${k.date}</div>`,m=k.date);const M=k._isCollab?"#10b981":k._isMinute?"#6366f1":"#e5e7eb",A=k._isCollab?"dashboard-activity-item-collab":k._isMinute?"dashboard-activity-item-minute":"",g=Dn(k),S=k._isMinute?"minute":!k._isCollab&&k.id&&k.id!=="active_now"?"attendance":"plan",C=v?`<div class="dashboard-activity-edit-wrap"><button onclick="window.app_editDashboardActivity('${Ve(S)}','${Ve(k.id||"")}','${Ve(k.date||"")}','${Ve(n||"")}','${Ve(k._meetingId||"")}')" class="dashboard-activity-edit-btn" title="Edit Activity"><i class="fa-solid fa-pen-to-square"></i></button></div>`:"";let I="";if(k._isCollab||k.status||k._isMinute){const y=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(k.date,k.status):k.status||"to-be-started";I=`
                <div class="dashboard-activity-status-row">
                    ${wn(y)}
                    ${C}
                </div>`}else C&&(I=`
                <div class="dashboard-activity-status-row">
                    <span></span>
                    ${C}
                </div>`);u+=`<div class="dashboard-activity-item ${A}" style="border-left-color:${M};"><div class="dashboard-activity-desc">${D(k._displayDesc)}</div>${g}${I}<div class="dashboard-activity-meta">${D(k.checkOut||(k.status==="completed"?"Completed":"Planned Activity"))}</div></div>`}),u}function pa(a){const e=je();e.logs=Array.isArray(a)?a:[],setTimeout(()=>{const s=document.getElementById("staff-activity-list");s&&In(s)},0);const t=Fs(8),n=Ma(e.selectedMonth);return`
        <div class="card dashboard-team-activity-card">
            <div class="dashboard-team-activity-head">
                <div style="display:flex; align-items:center; gap:0.5rem;"><h4>Team Activity</h4></div>
                <span id="staff-activity-range-label">${D(n)}</span>
            </div>
            <div class="dashboard-team-activity-filters dashboard-team-activity-filters-compact">
                <select class="dashboard-team-select" onchange="window.app_setStaffActivityMonth(this.value)">
                    ${t.map(s=>`<option value="${s.key}" ${s.key===e.selectedMonth?"selected":""}>${D(s.label)}</option>`).join("")}
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
                ${$a(e.logs,e.sortKey)}
            </div>
        </div>`}function $a(a,e){const t=Us(a);if(t.length===0)return'<div class="dashboard-activity-empty">No team activities found for the selected month.</div>';const n=Hs(t,e),s=n.filter(o=>o._taskStatus==="completed"),i=n.filter(o=>o._taskStatus!=="completed");return`
        <div class="dashboard-team-activity-split-grid">
            ${ua("Completed",s,"No completed tasks in this month.")}
            ${ua("In Progress / Incomplete",i,"No in-progress or incomplete tasks in this month.")}
        </div>
    `}function ua(a,e,t){const n=window.AppAuth.getUser(),s=window.app_hasPerm("dashboard","admin",n),i=e.length===0?`<div class="dashboard-activity-empty">${t}</div>`:e.map(o=>{const r=n&&o.userId===n.id,d=s||r,l=Dn(o),c=`
                <div class="dashboard-activity-status-row">
                    ${wn(o._taskStatus)}
                    ${d?`<div class="dashboard-activity-edit-wrap"><button onclick="window.app_openDayPlan('${o.date}', '${o.userId||""}')" class="dashboard-activity-edit-btn" title="Edit/Reassign"><i class="fa-solid fa-pen-to-square"></i></button></div>`:""}
                </div>`;return`
                <div class="dashboard-staff-activity-item dashboard-staff-activity-item-compact">
                    <div class="dashboard-staff-name">${D(o.staffName||"Unknown Staff")}<span class="dashboard-team-activity-item-date">${o.date||""}</span></div>
                    <div class="dashboard-activity-desc dashboard-staff-activity-desc">${D(o._displayDesc||"Work Plan Task")}</div>
                    ${l}
                    ${c}
                    <div class="dashboard-activity-meta">${o._taskStatus==="completed"?"Completed":"Work Plan"}</div>
                </div>`}).join("");return`
        <div class="dashboard-team-activity-col">
            <div class="dashboard-team-activity-col-head">
                <span>${D(a)}</span>
                <span class="dashboard-team-activity-count">${e.length}</span>
            </div>
            <div class="dashboard-team-activity-col-list">${i}</div>
        </div>
    `}function Dn(a){if(!a)return"";const e=Number.isFinite(Number(a.progressPercent)),t=a.progressStatus?String(a.progressStatus).replace(/_/g," "):"",n=String(a.progressNote||"").trim();if(!e&&!t&&!n&&Array.isArray(a.taskUpdates)&&a.taskUpdates.length>0){const r=a.taskUpdates[0]||{},d=Number.isFinite(Number(r.progressPercent))?`${Number(r.progressPercent)}%`:"",l=r.progressStatus?String(r.progressStatus).replace(/_/g," "):"",c=String(r.progressNote||"").trim();if(!d&&!l&&!c)return"";const p=c?` title="${D(c)}"`:"",u=`${d}${d&&l?" • ":""}${D(l)}`;return`<div class="dashboard-progress-chip"${p}>${u}</div>`}if(!e&&!t&&!n)return"";const s=e?`${Number(a.progressPercent)}%`:"",i=n?` title="${D(n)}"`:"",o=`${s}${s&&t?" • ":""}${D(t)}`;return`<div class="dashboard-progress-chip"${i}>${o}</div>`}function He(a,e,t,n=""){const i=Number(t.penalty??t.penaltyLeaves??0)>0?'<span class="dashboard-penalty-badge">Penalty Applies</span>':"";return`
        <div class="card dashboard-stats-card" ${n?` data-stats-type="${D(n)}"`:""} role="button" tabindex="0" aria-label="Open ${D(a)} details">
            <div class="dashboard-stats-card-head">
                <div>
                    <h4 class="dashboard-stats-card-title">${D(a)}</h4>
                    <span class="dashboard-stats-card-subtitle">${D(e)}</span>
                </div>
                ${i}
            </div>

            <div class="dashboard-stats-metric-grid">
                 <div class="dashboard-stats-metric dashboard-stats-metric-late">
                    <div class="dashboard-stats-metric-value">${D(t.totalLateDuration)}</div>
                    <div class="dashboard-stats-metric-label">Late</div>
                 </div>
                 <div class="dashboard-stats-metric dashboard-stats-metric-extra">
                    <div class="dashboard-stats-metric-value">${D(t.totalExtraDuration)}</div>
                    <div class="dashboard-stats-metric-label">Extra</div>
                 </div>
            </div>

            <div class="dashboard-breakdown-grid">
                ${xn(t.breakdown)}
            </div>
        </div>
    `}function Ps(a){const e=String(a||"").trim()==="yearly"?"yearly":"monthly",t=window.app_dashboardStatsStore||{},n=e==="yearly"?t.yearly||{}:t.monthly||{},s=e==="yearly"?t.yearlyTitle||"Yearly Summary":t.monthlyTitle||"Monthly Summary",i=e==="yearly"?t.yearlySubtitle||"":t.monthlySubtitle||"",o=n.breakdown||{},r=t.ranges?e==="yearly"?t.ranges.yearly:t.ranges.monthly:null,d=Bs(t.logs||[],r),l={late:d.late||[],early:d.early||[],extra:d.extra||[]},c=(p,u)=>`
        <div class="dashboard-inline-stats-section">
            <div class="dashboard-inline-stats-label">${D(p)}</div>
            <div class="dashboard-inline-stats-dates">
                ${u.length?u.map(m=>`<span class="dashboard-inline-stats-date">${D(m)}</span>`).join(""):'<span class="dashboard-inline-stats-empty">No dates</span>'}
            </div>
        </div>
    `;return`
        <div class="dashboard-inline-stats-detail">
            <div class="dashboard-inline-stats-head">
                <h5>${D(s)}</h5>
                <span>${D(i||"Detailed summary")}</span>
            </div>
            <div class="dashboard-inline-stats-grid">
                <div class="dashboard-inline-stats-tile"><strong>${D(n.late??0)}</strong><span>Late Count</span></div>
                <div class="dashboard-inline-stats-tile"><strong>${D(n.totalLateDuration||"0h 0m")}</strong><span>Late Duration</span></div>
                <div class="dashboard-inline-stats-tile"><strong>${D(n.earlyDepartures??0)}</strong><span>Early Exits</span></div>
                <div class="dashboard-inline-stats-tile"><strong>${D(n.extraWorkedHours??0)}h</strong><span>Extra Hours</span></div>
            </div>
            ${c("Late Dates",l.late)}
            ${c("Early Departure Dates",l.early)}
            ${c("Extra Hours Dates",l.extra)}
            <div class="dashboard-inline-stats-breakdown">
                ${Object.entries(o).map(([p,u])=>`<div class="dashboard-inline-stats-breakdown-row"><span>${D(p)}</span><strong>${D(u)}</strong></div>`).join("")}
            </div>
        </div>
    `}function xn(a){const e=Object.entries(a),t={Present:{color:"#166534",bg:"#f0fdf4",label:"Office"},"Work - Home":{color:"#0369a1",bg:"#e0f2fe",label:"WFH"},Training:{color:"#4338ca",bg:"#eef2ff",label:"Training"},Late:{color:"#c2410c",bg:"#fff7ed",label:"Late"},"Sick Leave":{color:"#991b1b",bg:"#fef2f2",label:"Sick"},"Casual Leave":{color:"#9d174d",bg:"#fce7f3",label:"Casual"},"Earned Leave":{color:"#be185d",bg:"#fdf2f8",label:"Earned"},"Paid Leave":{color:"#be123c",bg:"#ffe4e6",label:"Paid"},"Maternity Leave":{color:"#a21caf",bg:"#fae8ff",label:"Maternity"},Absent:{color:"#7f1d1d",bg:"#fee2e2",label:"Absent"},"Early Departure":{color:"#991b1b",bg:"#fff1f2",label:"Early Exit"},Holiday:{color:"#1e293b",bg:"#f1f5f9",label:"Holiday"},"National Holiday":{color:"#334155",bg:"#f8fafc",label:"Nat. Hol"},"Regional Holidays":{color:"#475569",bg:"#f8fafc",label:"Reg. Hol"}};return e.map(([n,s])=>{const i=t[n]||{color:"#374151",bg:"#f3f4f6",label:n};return s===0&&!["Present","Late","Absent","Early Departure"].includes(n)?"":`
            <div class="dashboard-breakdown-item" style="background:${i.bg};">
                <span class="dashboard-breakdown-count" style="color:${i.color}">${s}</span>
                <span class="dashboard-breakdown-label" style="color:${i.color};">${i.label}</span>
            </div>
         `}).join("")}function Ns(){document.querySelectorAll(".dashboard-stats-card[data-stats-type]").forEach(a=>{if(a.dataset.bound==="1")return;a.dataset.bound="1";const e=a.getAttribute("data-stats-type")||"";a.addEventListener("click",t=>{t.target&&t.target.closest&&t.target.closest(".dashboard-card-mode-controls")||window.app_toggleDashboardCardMode?.(`stats-${e}`,we,a)}),a.addEventListener("keydown",t=>{(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),window.app_toggleDashboardCardMode?.(`stats-${e}`,we,a))})})}function Ga(a){const e=String(a||"").trim();if(!e||e.toLowerCase().includes("active"))return null;const t=e.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);if(!t)return null;let n=Number(t[1]);const s=Number(t[2]),i=t[3]?t[3].toUpperCase():"";return i==="PM"&&n<12&&(n+=12),i==="AM"&&n===12&&(n=0),n*60+s}function Bs(a,e){const t={late:new Set,early:new Set,extra:new Set,breakdown:{Present:new Set,"Work - Home":new Set,Training:new Set,"Sick Leave":new Set,"Casual Leave":new Set,"Earned Leave":new Set,"Paid Leave":new Set,"Maternity Leave":new Set,Absent:new Set,Holiday:new Set,"National Holiday":new Set,"Regional Holidays":new Set,Late:new Set,"Early Departure":new Set}},n=e?.start?new Date(e.start):new Date("1970-01-01"),s=e?.end?new Date(e.end):new Date;n.setHours(0,0,0,0),s.setHours(23,59,59,999);let i=Array.isArray(a)?a:[];if(window.AppAnalytics&&window.AppAnalytics.pickBestAttendanceLogPerDay)try{i=window.AppAnalytics.pickBestAttendanceLogPerDay(i,n,s)}catch(l){console.warn("pickBestAttendanceLogPerDay failed",l)}else{const l=new Map;i.forEach(c=>{const p=c.date||"";p&&(l.has(p)||l.set(p,c))}),i=Array.from(l.values())}const o=(typeof N<"u"&&N?N.LATE_CUTOFF_MINUTES:555)||555,r=(typeof N<"u"&&N?N.EARLY_DEPARTURE_MINUTES:1020)||1020;i.forEach(l=>{const c=l.date?new Date(l.date):null;if(!c||Number.isNaN(c.getTime())||c<n||c>s)return;const p=l.date,u=String(l.type||""),m=Ga(l.checkIn),h=Ga(l.checkOut),f=l.isManualOverride===!0;(l.lateCountable===!0||!Object.prototype.hasOwnProperty.call(l,"lateCountable")&&m!==null&&m>o)&&(t.late.add(p),t.breakdown.Late.add(p)),f?u==="Early Departure"&&(t.early.add(p),t.breakdown["Early Departure"].add(p)):h!==null&&h<r&&!String(u).includes("Leave")&&u!=="Absent"&&(t.early.add(p),t.breakdown["Early Departure"].add(p));const v=typeof l.extraWorkedMs=="number"?Math.max(0,Math.round(l.extraWorkedMs/(1e3*60))):0,k=!(l.autoCheckout&&!l.autoCheckoutExtraApproved);(v>0||k&&(m!==null&&m<o||h!==null&&h>r))&&t.extra.add(p),u==="Work - Home"?t.breakdown["Work - Home"].add(p):u==="Training"?t.breakdown.Training.add(p):u==="Sick Leave"?t.breakdown["Sick Leave"].add(p):u==="Casual Leave"?t.breakdown["Casual Leave"].add(p):u==="Earned Leave"?t.breakdown["Earned Leave"].add(p):u==="Paid Leave"?t.breakdown["Paid Leave"].add(p):u==="Maternity Leave"?t.breakdown["Maternity Leave"].add(p):u==="Absent"?t.breakdown.Absent.add(p):u==="National Holiday"?t.breakdown["National Holiday"].add(p):u==="Regional Holidays"?t.breakdown["Regional Holidays"].add(p):String(u).includes("Holiday")?t.breakdown.Holiday.add(p):l.checkIn&&t.breakdown.Present.add(p)});const d=l=>Array.from(l||[]).sort((c,p)=>new Date(c)-new Date(p));return{late:d(t.late),early:d(t.early),extra:d(t.extra),breakdown:Object.fromEntries(Object.entries(t.breakdown).map(([l,c])=>[l,d(c)]))}}function Ta(a){return!a||a.length===0?`
            <div class="card dashboard-leave-requests-card">
                <div class="dashboard-leave-requests-head"><h4>Pending Leaves</h4><span>Review requirements</span></div>
                <div class="dashboard-leave-requests-list">
                    <div class="dashboard-activity-empty">No pending leave requests.</div>
                </div>
            </div>`:`
        <div class="card dashboard-leave-requests-card">
            <div class="dashboard-leave-requests-head"><h4>Pending Leaves</h4><span>Review requirements</span></div>
            <div class="dashboard-leave-requests-list">
                ${a.slice(0,5).map(e=>`
                    <div class="dashboard-leave-row">
                        <div class="dashboard-leave-info">
                            <div class="dashboard-leave-name">${D(e.userName||"Staff")}</div>
                            <div class="dashboard-leave-type">${D(e.type)} • ${e.daysCount} days</div>
                            <div class="dashboard-leave-date">${e.startDate} to ${e.endDate}</div>
                        </div>
                        <div class="dashboard-leave-actions">
                            <button class="dashboard-leave-btn export" data-action="export" data-leave-id="${e.id}" title="Export PDF"><i class="fa-solid fa-file-pdf"></i></button>
                            <button class="dashboard-leave-btn comment" data-action="comment" data-leave-id="${e.id}" title="Add Comment"><i class="fa-solid fa-comment-dots"></i></button>
                            <button class="dashboard-leave-btn approve" data-action="approve" data-leave-id="${e.id}" title="Approve"><i class="fa-solid fa-check"></i></button>
                            <button class="dashboard-leave-btn reject" data-action="reject" data-leave-id="${e.id}" title="Reject"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                `).join("")}
            </div>
            ${a.length>5?`<div class="dashboard-leave-footer"><button onclick="window.location.hash = 'leaves'">View all ${a.length} requests</button></div>`:""}
        </div>`}function Rs(a){return!a||a.length===0?`
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
                            <div class="dashboard-tagged-title">${D(e.staffName||"Staff")}</div>
                            <div class="dashboard-tagged-desc">${D(e.reason||"Reason not available.")}</div>
                            <div class="dashboard-tagged-meta">${D(e.date||"--")} | ${D(e.staffRole||"Employee")}${e.submittedAt?` | Submitted ${D(new Date(e.submittedAt).toLocaleString())}`:""}</div>
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
        </div>`}function Ia(a,e={}){const t=e.title||"Leave History",n=e.subtitle||"Past records",s=e.selectedDate||new Date().toISOString().slice(0,10);if(!a||a.length===0)return`
            <div class="card dashboard-leave-history-card">
                <div class="dashboard-leave-history-head">
                    <div>
                        <h4>${D(t)}</h4>
                        <span>${D(n)}</span>
                    </div>
                    <input type="date" class="dashboard-team-select" value="${D(s)}" onchange="window.app_setDashboardLeaveHistoryDate(this.value)">
                </div>
                <div class="dashboard-activity-empty">No leave history found.</div>
            </div>`;const i=o=>o==="Approved"?"#166534":o==="Rejected"?"#b91c1c":"#854d0e";return`
        <div class="card dashboard-leave-history-card">
            <div class="dashboard-leave-history-head">
                <div>
                    <h4>${D(t)}</h4>
                    <span>${D(n)}</span>
                </div>
                <input type="date" class="dashboard-team-select" value="${D(s)}" onchange="window.app_setDashboardLeaveHistoryDate(this.value)">
            </div>
            <div class="dashboard-leave-history-list">
                ${a.map(o=>`
                    <div class="dashboard-leave-history-row">
                        <div class="dashboard-leave-history-main">
                            <div class="dashboard-leave-history-user">${D(o.userName||"Staff")}</div>
                            <div class="dashboard-leave-history-type">${D(o.type)} • ${o.daysCount} days</div>
                            <div class="dashboard-leave-history-date">${o.startDate} to ${o.endDate}</div>
                        </div>
                        <div class="dashboard-leave-history-status">
                            <span class="status-pill" style="background: ${i(o.status)}15; color: ${i(o.status)}">${D(o.status)}</span>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>`}function _n(a,e){return""}function $n(a){return""}function Os(a,e,t){if(!a||a.length===0)return`
            <div class="card dashboard-staff-directory-card">
                <div class="dashboard-staff-directory-head"><h4>Staff Directory</h4><span>Quick actions</span></div>
                <div class="dashboard-staff-directory-list">
                    <div class="dashboard-activity-empty">No staff loaded.</div>
                </div>
            </div>`;const n=Date.now(),s=o=>{const r=(o.notifications||[]).map(d=>new Date(d.taggedAt||d.date||d.respondedAt||0).getTime()).filter(Boolean);return r.length?Math.max(...r):0};return`
        <div class="card dashboard-staff-directory-card">
            <div class="dashboard-staff-directory-head"><h4>Staff Directory</h4><span>Message or assign</span></div>
            <div class="dashboard-staff-directory-list">
                ${a.filter(o=>o.id!==t.id).sort((o,r)=>s(r)-s(o)||o.name.localeCompare(r.name)).map(o=>{const r=s(o);return`
                <div class="dashboard-staff-row ${r&&n-r<12e4?"dashboard-staff-row-new":""}">
                    <div class="dashboard-staff-meta">
                        <div class="dashboard-staff-avatar">
                            <img src="${ot(o.avatar)}" alt="${D(o.name)}">
                        </div>
                        <div class="dashboard-staff-text">
                            <div class="dashboard-staff-name">${D(o.name)}</div>
                            <div class="dashboard-staff-role">${D(o.role||"Staff")}</div>
                        </div>
                    </div>
                    <div class="dashboard-staff-actions">
                        <button class="dashboard-staff-btn" onclick="window.location.hash = 'staff-directory'; window.app_openStaffThread('${o.id}')" title="Message"><i class="fa-solid fa-message"></i></button>
                    </div>
                </div>
            `}).join("")}
            </div>
        </div>`}async function Ft(){window.app_closeDashboardCardMaximize?.();const a=window.AppAuth.getUser(),e=window.app_hasPerm("dashboard","view",a),t=window.app_hasPerm("dashboard","admin",a),n=je(),s=n.selectedMonth,i=n.leaveHistoryDate||new Date().toISOString().slice(0,10),o=window.AppDB?.getISTDateKeys?window.AppDB.getISTDateKeys():{todayKey:new Date().toISOString().split("T")[0],yesterdayKey:new Date(Date.now()-1440*60*1e3).toISOString().split("T")[0]},r=o.todayKey,d=o.yesterdayKey,l=!!N?.READ_OPT_FLAGS?.FF_SHARED_DAILY_SUMMARY,c=`hero_stats_${r}`,p=1440*60*1e3,u=e&&window.app_selectedSummaryStaffId?window.app_selectedSummaryStaffId:a.id;console.time("DashboardFetch");const m=async()=>{try{return await window.AppDB.getOrGenerateSummary(c,async()=>{const z=await window.AppAnalytics.getHeroOfTheWeek({source:"direct_cache"});if(!z||z.state==="fetch_error")throw new Error("direct hero unavailable");return z},p)}catch(z){return console.warn("Direct hero cache read failed:",z),null}},h=l?Promise.resolve(null):m(),f=l?Promise.resolve([]):window.AppDB.getOrGenerateSummary(`team_activity_${s}_${r}_all_v2`,()=>window.AppAnalytics.getAllStaffActivities({mode:"month",month:s,scope:"all",sideEffects:!1})),w=l&&window.AppDB.getOrCreateDailySummary?window.AppDB.getOrCreateDailySummary({dateKey:r,yesterdayKey:d,staleAfterMs:N?.SUMMARY_POLICY?.STALENESS_MS,lockTtlMs:N?.SUMMARY_POLICY?.LOCK_TTL_MS,generatorFn:()=>window.AppAnalytics.buildDailyDashboardSummary({dateKey:r,selectedMonth:s})}).catch(z=>(console.warn("Daily summary fetch/generation failed:",z),null)):null,v=w?Promise.race([w,new Promise(z=>setTimeout(()=>z(null),1500))]):Promise.resolve(null);if(!window._dashboardRefreshScheduled){window._dashboardRefreshScheduled=!0;try{const z=window.AppDB.getIstNow(),se=new Date(z);se.setDate(se.getDate()+1),se.setHours(0,0,5,0);const De=se.getTime()-z.getTime();setTimeout(()=>{Ft().then(re=>{const de=document.getElementById("page-content");de&&(de.innerHTML=re)}),window._dashboardRefreshScheduled=!1},Math.max(0,De))}catch(z){console.warn("failed to schedule dashboard refresh",z)}}const k=e?(Array.isArray(a.notifications)?a.notifications:[]).filter(z=>z&&z.type==="missed-checkout-reason"&&String(z.status||"pending").toLowerCase()==="pending"&&z.logId):[],b=Array.from(new Set(k.map(z=>String(z.logId||"")).filter(Boolean))),[M,A,g,S,C,I,y,_,x,$,L,T,E,P]=await Promise.all([window.AppAttendance.getStatus(),window.AppAttendance.getLogs(u),window.AppAnalytics.getUserMonthlyStats(u),window.AppAnalytics.getUserYearlyStats(u),h,window.AppCalendar?window.AppCalendar.getPlans():{leaves:[],events:[]},f,window.app_hasPerm("leaves","view")?window.AppLeaves.getPendingLeaves():Promise.resolve([]),window.AppDB.getCached?window.AppDB.getCached(window.AppDB.getCacheKey("dashboardUsers","users",{}),N?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):window.AppDB.getAll("users"),window.AppCalendar?window.AppCalendar.getCollaborations(u):Promise.resolve([]),window.app_hasPerm("leaves","view")?window.AppDB.getAll("leaves"):Promise.resolve([]),v,window.AppMinutes?window.AppMinutes.getMinutes():Promise.resolve([]),e&&b.length?window.AppDB.getManyByIds?window.AppDB.getManyByIds("attendance",b):Promise.all(b.map(z=>window.AppDB.get("attendance",z))).then(z=>z.filter(Boolean)):Promise.resolve([])]);console.timeEnd("DashboardFetch");const B=l?{lowRead:!1,generatedAt:T?.generatedAt||T?.meta?.generatedAt||0,source:T?._source||""}:{};let R=l?T?.hero||null:C,F=l?Array.isArray(T?.teamActivityPreview)?T.teamActivityPreview:[]:y;l&&(!T||!Array.isArray(T.teamActivityPreview))&&setTimeout(()=>Dt(!0),0);const H=xe(R,B);if(l&&R==null&&w){const z="app_hero_fallback_attempted_date",se=()=>{try{return localStorage.getItem(z)===r}catch{return!1}},De=()=>{try{localStorage.setItem(z,r)}catch{}},re=de=>{const le=document.querySelector(".hero-slot");le&&(le.outerHTML=de)};w.then(async de=>{const le=de&&de.hero?de.hero:null;if(le){const Te={...B,generatedAt:de.generatedAt||B.generatedAt,source:de._source||B.source};re(xe(le,Te));return}const ve=await m();if(ve){re(xe(ve,{...B,generatedAt:Date.now(),source:"direct_cache"}));return}if(re(xe({state:"no_eligible_data",reason:"No eligible hero data available.",source:"shared_summary"},{...B,generatedAt:de?.generatedAt||B.generatedAt,source:de?._source||"shared_missing"})),!se()){De();try{const Te=await window.AppAnalytics.getHeroOfTheWeek({source:"direct_fallback"});if(!Te||Te.state==="fetch_error"){re(xe({state:"fetch_error",reason:"Hero stats are temporarily unavailable.",source:"direct_fallback"},{...B,lowRead:!1,generatedAt:Date.now(),source:"direct_fallback"}));return}await window.AppDB.getOrGenerateSummary(c,async()=>Te,p);const ws={...B,lowRead:!1,generatedAt:Date.now(),source:"direct_fallback"};re(xe(Te,ws))}catch(Te){console.warn("Hero fallback direct fetch failed:",Te),re(xe({state:"fetch_error",reason:"Hero stats are temporarily unavailable.",source:"direct_fallback"},{...B,generatedAt:Date.now(),source:"direct_fallback"}))}}}).catch(()=>{re(xe({state:"fetch_error",reason:"Hero stats are temporarily unavailable.",source:"shared_error"},{...B,source:"shared_error"}))})}window.AppRating&&a.rating===void 0&&window.AppRating.updateUserRating(a.id).then(z=>{Object.assign(a,z)}).catch(()=>{});const W=(x||[]).find(z=>z.id===u),K=u===a.id,O=!K&&W?W:a,U=e&&!K&&!t,X=new Date,j=new Date(X.getFullYear(),X.getMonth(),1),Z=new Date(X.getFullYear(),X.getMonth()+1,0),ee=window.AppAnalytics&&window.AppAnalytics.getFinancialYearDates?window.AppAnalytics.getFinancialYearDates():{start:new Date(X.getFullYear(),0,1),end:new Date(X.getFullYear(),11,31)};window.app_dashboardStatsStore={monthly:g||{},yearly:S||{},monthlyTitle:K?g.label:`${g.label} - ${W?.name||"Staff"}`,monthlySubtitle:K?"Monthly Stats":"Viewing Staff Monthly Stats",yearlyTitle:"Yearly Summary",yearlySubtitle:K?S.label:`${S.label} for ${W?.name||"Staff"}`,logs:Array.isArray(A)?A:[],ranges:{monthly:{start:j.toISOString().split("T")[0],end:Z.toISOString().split("T")[0]},yearly:{start:ee.start.toISOString().split("T")[0],end:ee.end.toISOString().split("T")[0]}}};const ae=U?{status:O.status||"out",lastCheckIn:O.lastCheckIn||null,isPaused:O.isPaused===!0,pauseStartedAt:O.pauseStartedAt||null,totalPausedMs:Number(O.totalPausedMs)||0}:M,me=ae.status==="in",ke=a.notifications||[];a.tagHistory;const Wt=new Map((x||[]).map(z=>[String(z.id),z])),Kt=e?(P||[]).filter(z=>z&&z.missedCheckoutReasonRequired&&z.missedCheckoutReasonSubmittedAt&&String(z.missedCheckoutReasonStatus||"").toLowerCase()==="pending").map(z=>{const se=Wt.get(String(z.user_id));return{notificationId:ke.find(re=>re&&re.type==="missed-checkout-reason"&&String(re.logId||"")===String(z.id||"")&&String(re.status||"pending").toLowerCase()==="pending")?.id||"",staffName:se?.name||"Staff",staffRole:se?.role||"Employee",reason:z.missedCheckoutReason||"",date:z.date||"",submittedAt:z.missedCheckoutReasonSubmittedAt||""}}).sort((z,se)=>new Date(se.submittedAt||se.date||0)-new Date(z.submittedAt||z.date||0)):[];let Ke="00 : 00 : 00",gt="Check-in",bt="action-btn";me&&(gt="Check-out",bt="action-btn checkout");const Vt=me&&!U?`<button class="action-btn secondary dashboard-checkin-btn dashboard-checkin-pause-btn" id="attendance-pause-btn" onclick="window.${ae.isPaused?"app_resumeSession":"app_pauseSession"}()">
            ${ae.isPaused?"Resume":"Pause"} <i class="fa-solid ${ae.isPaused?"fa-play":"fa-pause"}"></i>
        </button>`:"",vt=z=>{const se=Math.max(0,z||0);let De=Math.floor(se/(1e3*60*60)),re=Math.floor(se/(1e3*60)%60),de=Math.floor(se/1e3%60);return`${String(De).padStart(2,"0")} : ${String(re).padStart(2,"0")} : ${String(de).padStart(2,"0")}`};if(me&&ae.lastCheckIn){const z=new Date(ae.lastCheckIn).getTime();Ke=vt(Date.now()-z)}const fs=_n(),hs=$n();let Ya="";e&&!K&&W&&(Ya=`
            <div class="card full-width dashboard-staff-view-banner">
                <div class="dashboard-staff-view-banner-inner">
                    <div class="dashboard-staff-view-banner-profile">
                        <div class="dashboard-staff-view-avatar-wrap">
                            <img src="${ot(W.avatar)}" alt="${D(W.name)}" class="dashboard-staff-view-avatar">
                            <div class="dashboard-staff-view-avatar-badge">
                                <i class="fa-solid fa-eye"></i>
                            </div>
                        </div>
                        <div class="dashboard-staff-view-copy">
                            <div class="dashboard-staff-view-eyebrow">Currently Viewing</div>
                            <h3 class="dashboard-staff-view-title">${D(W.name)}'s Dashboard</h3>
                            <div class="dashboard-staff-view-meta">${D(W.role)} • ${D(W.dept||"General")}</div>
                        </div>
                    </div>
                    <button onclick="window.app_changeSummaryStaff('${a.id}')" class="dashboard-staff-view-back-btn">
                        <i class="fa-solid fa-arrow-left"></i> Back to My Dashboard
                    </button>
                </div>
            </div>`);let Gt="";const Wa=Da(I);if(e){const z=!!window.app_selectedSummaryStaffId&&window.app_selectedSummaryStaffId!==a.id,se=An(i),De=(L||[]).filter(le=>{const ve=String(le.appliedOn||le.actionDate||le.startDate||"").slice(0,10);return ve&&ve>=se.startKey&&ve<=se.endKey}).sort((le,ve)=>new Date(ve.appliedOn||ve.actionDate||ve.startDate||0)-new Date(le.appliedOn||le.actionDate||le.startDate||0)),re=z?De.filter(le=>(le.userId||le.user_id)===u).slice(0,8):De.slice(0,8),de=Ia(re,{title:z?`${W?.name||"Staff"} Leave History`:"Leave Request History",subtitle:z?`Current week (${se.label}) for selected staff`:`Current week (${se.label}) across all staff`,selectedDate:i});Gt=`
            <div class="dashboard-summary-row">
                <div style="flex: 2; min-width: 350px; display: flex; flex-direction: column;">${Ta(_)}${Rs(Kt)}${de}</div>
                <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 1rem;">${Wa}${H}</div>
            </div>
            <div class="dashboard-stats-row">
                ${He(K?g.label:`${g.label} - ${W?.name||"Staff"}`,K?"Monthly Stats":"Viewing Staff Monthly Stats",g,"monthly")}
                ${He("Yearly Summary",K?S.label:`${S.label} for ${W?.name||"Staff"}`,S,"yearly")}
            </div>`}else Gt=`
            <div class="dashboard-summary-row">
                <div class="dashboard-summary-col dashboard-summary-col-wide">${pa(F)}</div>
                <div class="dashboard-summary-col dashboard-summary-col-narrow">${H}</div>
            </div>
            <div class="dashboard-stats-row">
                ${He(g.label,"Monthly Stats",g,"monthly")}
                ${He("Yearly Summary",S.label,S,"yearly")}
            </div>`;const ys=e?pa(F):Wa,Jt=window.app_getReleaseUpdateState&&window.app_getReleaseUpdateState()||{active:!1};return setTimeout(()=>Es(),0),window.app_dashboardWorklogContext={logs:Array.isArray(A)?A:[],collaborations:Array.isArray($)?$:[],minutesData:Array.isArray(E)?E:[],targetStaffId:u},setTimeout(()=>Ls(),0),`
        <div class="dashboard-grid dashboard-modern dashboard-staff-view">
            ${fs}
            ${hs}
            ${Ya}
            <div class="card full-width dashboard-hero-card">
                <div class="dashboard-hero-orb dashboard-hero-orb-top"></div>
                <div class="dashboard-hero-orb dashboard-hero-orb-bottom"></div>
                <div class="dashboard-hero-content">
                    <div class="dashboard-hero-row">
                        <div class="dashboard-hero-copy">
                            <h2 class="dashboard-hero-title">Welcome back, ${a.name.split(" ")[0]}! 👋</h2>
                            <p class="dashboard-hero-date">${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
                            ${a.rating!==void 0?`<div class="dashboard-hero-chip-row"><div class="dashboard-hero-chip"><span class="dashboard-hero-chip-label">Your Rating:</span>${ks(a.rating,!0)}</div>${a.completionStats?`<div class="dashboard-hero-chip"><i class="fa-solid fa-check-circle dashboard-hero-chip-icon"></i><span>${(a.completionStats.completionRate*100).toFixed(0)}% Complete</span></div>`:""}</div>`:""}
                        </div>
                        <div class="dashboard-hero-aside">
                            ${e?`<div class="dashboard-viewing-box"><div class="dashboard-viewing-inner"><i class="fa-solid fa-users-viewfinder dashboard-viewing-icon"></i><div class="dashboard-viewing-meta"><div class="dashboard-viewing-head"><div class="dashboard-viewing-label">Viewing Summary For</div>${u!==a.id?'<span class="dashboard-viewing-state">STAFF VIEW ACTIVE</span>':""}</div><select onchange="window.app_changeSummaryStaff(this.value)" class="dashboard-viewing-select"><option value="${a.id}">My Own Summary</option><optgroup label="Staff Members">${(x||[]).filter(z=>z.id!==a.id).sort((z,se)=>z.name.localeCompare(se.name)).map(z=>`<option value="${z.id}" ${z.id===u?"selected":""}>${z.name}</option>`).join("")}</optgroup></select></div></div></div>`:""}
                            <div class="dashboard-hero-brand" aria-hidden="true">
                                <img src="crwi-logo.png" alt="CRWI logo" class="dashboard-hero-brand-logo">
                            </div>
                        </div>
                    </div>
                </div>
                <button class="${Jt.active?"dashboard-refresh-link is-update-pending":"dashboard-refresh-link"}" onclick="window.app_checkForSystemUpdate()" title="${Jt.active?"Update available. Click to refresh into the new version.":"Check for System Update"}">
                    ${Jt.active?"System update available":"Check for System Update"}
                </button>
            </div>
            <div class="dashboard-primary-row">
                <div class="card check-in-widget dashboard-primary-card dashboard-checkin-card">
                    <div class="dashboard-checkin-head">
                        <div class="dashboard-checkin-avatar-wrap">
                            <img src="${ot(O.avatar)}" alt="Profile" class="dashboard-checkin-avatar">
                            <div class="dashboard-checkin-status-dot" style="background: ${me?"#10b981":"#94a3b8"};"></div>
                        </div>
                        <div class="dashboard-checkin-identity">
                            <h4 class="dashboard-checkin-name">${D(O.name)}</h4>
                            <p class="text-muted dashboard-checkin-role">${D(O.role)}</p>
                        </div>
                    </div>
                    <div class="dashboard-checkin-timer-wrap">
                        <div class="timer-display dashboard-checkin-timer" id="timer-display">${Ke}</div>
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
                        <button class="${bt} dashboard-checkin-btn" id="attendance-btn" ${U?"disabled":""} title="${U?"View only":""}">${gt} <i class="fa-solid fa-fingerprint"></i></button>
                        ${Vt}
                    </div>
                    <div class="location-text dashboard-checkin-location" id="location-text"><i class="fa-solid fa-location-dot"></i><span>${me&&O.currentLocation?`Lat: ${Number(O.currentLocation.lat).toFixed(4)}, Lng: ${Number(O.currentLocation.lng).toFixed(4)}`:"Waiting for location..."}</span></div>
                </div>
                <div class="dashboard-primary-col ${K?"":"dashboard-primary-col-highlight"}">${kn(A,$,W,E)}</div>
                <div class="dashboard-primary-col">${ys}</div>
            </div>
            ${Gt}
        </div>`}function Ma(a){const[e,t]=String(a||"").split("-"),n=Number(e),s=Number(t)-1;return!Number.isInteger(n)||!Number.isInteger(s)||s<0||s>11?a||"Current Month":new Date(n,s,1).toLocaleDateString("en-US",{month:"long",year:"numeric"})}function Fs(a=8){const e=[],t=new Date;t.setDate(1);for(let n=0;n<a;n++){const s=new Date(t);s.setMonth(t.getMonth()-n);const i=s.toISOString().slice(0,7);e.push({key:i,label:Ma(i)})}return e}function Us(a){const e={completed:0,"in-process":1,"to-be-started":2,overdue:3,"not-completed":4},t=s=>window.AppCalendar?window.AppCalendar.getSmartTaskStatus(s.date,s.status||""):s.status||"to-be-started",n=new Map;return(a||[]).forEach(s=>{const i=(s._displayDesc||"").trim(),o=`${s.staffName||""}|${s.date||""}|${i}`,r=t(s),d={...s,_taskStatus:r,_taskGroup:r==="completed"?"completed":"incomplete"},l=n.get(o);if(!l){n.set(o,d);return}const c=e[l._taskStatus]??99;(e[d._taskStatus]??99)<c&&n.set(o,d)}),Array.from(n.values())}function Hs(a,e){const t=[...a],n={completed:0,"in-process":1,overdue:2,"not-completed":3,"to-be-started":4};return t.sort((s,i)=>{const o=new Date(i.date)-new Date(s.date),r=String(s.staffName||"").toLowerCase().localeCompare(String(i.staffName||"").toLowerCase());return e==="date-asc"?new Date(s.date)-new Date(i.date)||r:e==="staff-asc"?r||o:e==="staff-desc"?-r||o:e==="completed-first"?s._taskGroup.localeCompare(i._taskGroup)||o:e==="incomplete-first"?i._taskGroup.localeCompare(s._taskGroup)||o:e==="status-priority"?(n[s._taskStatus]??99)-(n[i._taskStatus]??99)||o||r:o||r}),t}function qs(a){if(!a)return;const e=ze.controllers.get(a);e&&(e.intervalId&&clearInterval(e.intervalId),e.pauseTimeoutId&&clearTimeout(e.pauseTimeoutId),e.resumeTimeoutId&&clearTimeout(e.resumeTimeoutId),a.removeEventListener("mouseenter",e.onMouseEnter),a.removeEventListener("mouseleave",e.onMouseLeave),a.removeEventListener("touchstart",e.onTouchStart),a.removeEventListener("touchend",e.onTouchEnd),a.removeEventListener("touchcancel",e.onTouchCancel),ze.controllers.delete(a),ze.elements.delete(a))}function Tn(){Array.from(ze.elements).forEach(a=>qs(a))}function In(a){if(!a)return;Tn();const e=1.2,t=35,n=1400,s=900;a.querySelectorAll(".dashboard-team-activity-col-list").forEach(o=>{const r={intervalId:null,pauseTimeoutId:null,resumeTimeoutId:null,direction:1,isPausedByUser:!1,isWaitingAtEdge:!1},d=(c,p)=>{r.isWaitingAtEdge=!0,r.pauseTimeoutId&&clearTimeout(r.pauseTimeoutId),r.pauseTimeoutId=setTimeout(()=>{r.direction=c,r.isWaitingAtEdge=!1},p)},l=()=>{if(r.isPausedByUser||r.isWaitingAtEdge||!o.isConnected)return;const c=Math.max(0,o.scrollHeight-o.clientHeight);c<=0||(o.scrollTop+=e*r.direction,r.direction===1&&o.scrollTop>=c?(o.scrollTop=c,d(-1,n)):r.direction===-1&&o.scrollTop<=0&&(o.scrollTop=0,d(1,s)))};r.onMouseEnter=()=>{r.isPausedByUser=!0},r.onMouseLeave=()=>{r.isPausedByUser=!1},r.onTouchStart=()=>{r.isPausedByUser=!0,r.resumeTimeoutId&&clearTimeout(r.resumeTimeoutId)},r.onTouchEnd=()=>{r.resumeTimeoutId&&clearTimeout(r.resumeTimeoutId),r.resumeTimeoutId=setTimeout(()=>{r.isPausedByUser=!1},400)},o.addEventListener("mouseenter",r.onMouseEnter),o.addEventListener("mouseleave",r.onMouseLeave),o.addEventListener("touchstart",r.onTouchStart,{passive:!0}),o.addEventListener("touchend",r.onTouchEnd,{passive:!0}),r.intervalId=setInterval(l,t),ze.controllers.set(o,r),ze.elements.add(o)})}const Dt=async(a=!0,e={})=>{const t=je(),n=e.listId||"staff-activity-list",s=e.labelId||"staff-activity-range-label",i=document.getElementById(n),o=document.getElementById("staff-activity-list-modal");if(!i&&!o)return;Tn(),a&&window.AppAnalytics&&(t.logs=await window.AppAnalytics.getAllStaffActivities({mode:"month",month:t.selectedMonth,scope:"all",sideEffects:!1}));const r=$a(t.logs,t.sortKey);i&&(i.innerHTML=r,In(i)),o&&(o.innerHTML=r);const d=document.getElementById(s)||document.getElementById("staff-activity-range-label");d&&(d.textContent=Ma(t.selectedMonth))};typeof window<"u"&&(window.__dashboardMaxEscHandlerBound||(document.addEventListener("keydown",a=>{a.key==="Escape"&&document.body.classList.contains("dashboard-max-open")&&window.app_closeDashboardCardMaximize?.()}),window.__dashboardMaxEscHandlerBound=!0),window.app_closeDashboardCardFullscreen=tt,window.app_closeDashboardCardMaximize=tt,window.app_toggleDashboardCardMode=(a,e=ue,t=null)=>{if(!a)return;const n=bn.has(e)?e:ue;if(n===we&&typeof window.app_openDashboardSection=="function"){window.app_openDashboardSection(String(a||"").trim());return}const s=_a(a);if(String(s?.dataset?.dashboardCardMode||ue)===n&&n!==ue){Xt(a,ue,t||null);return}if(n===we&&window._dashboardMaxCardId===a){tt(),Xt(a,ue);return}Xt(a,n,t||null)},window.app_toggleDashboardCardMaximize=(a,e=null)=>{window.app_toggleDashboardCardMode?.(a,we,e||null)},window.app_editDashboardActivity=async function(a,e,t,n,s){const i=String(a||"").trim();if(i==="minute"){window.app_openMinuteDetails?window.app_openMinuteDetails(String(s||"")):window.location.hash="minutes";return}if(i==="attendance"){const o=String(e||"").trim();if(!o||o==="active_now")return;let r="";try{const l=await window.AppDB.get("attendance",o);r=String(l?.workDescription||"")}catch{r=""}let d=null;if(window.appPrompt?d=await window.appPrompt("Update Work Summary:",r,{title:"Update Work Summary",confirmText:"Save"}):d=window.prompt("Update Work Summary:",r),d===null)return;await window.AppAttendance.updateLog(o,{workDescription:String(d)}),window.app_refreshDashboard&&await window.app_refreshDashboard();return}window.app_openDayPlan&&window.app_openDayPlan(String(t||""),String(n||""))},window.app_filterActivity=async function(a="act-start",e="act-end",t="activity-list"){const n=document.getElementById(a)?.value,s=document.getElementById(e)?.value,i=document.getElementById(t),o=window.app_dashboardWorklogContext||{};!n||!s||!i||(i.innerHTML=Ot(Array.isArray(o.logs)?o.logs:[],n,s,o.targetStaffId||window.AppAuth?.getUser?.()?.id||"",Array.isArray(o.collaborations)?o.collaborations:[],Array.isArray(o.minutesData)?o.minutesData:[]))},window.app_setStaffActivityMonth=async function(a,e="staff-activity-list",t="staff-activity-range-label"){const n=je(),s=String(a||"").trim();/^\d{4}-\d{2}$/.test(s)&&(n.selectedMonth=s,await Dt(!0,{listId:e,labelId:t}))},window.app_setStaffActivitySort=async function(a,e="staff-activity-list",t="staff-activity-range-label"){const n=je(),s=String(a||"").trim()||"date-newest";n.sortKey=s,await Dt(!1,{listId:e,labelId:t})},window.app_setDashboardLeaveHistoryDate=async function(a){const e=je();e.leaveHistoryDate=a||new Date().toISOString().slice(0,10);const t=document.getElementById("page-content");window.app_closeDashboardCardFullscreen?.(),t&&(t.innerHTML=await Ft())},window.app_expandTeamActivity=function(){const a=document.querySelector(".dashboard-staff-view .dashboard-team-activity-card");window.app_toggleDashboardCardMode?.("team-activity",we,a||null)},window.app_openStatsDetailModal=function(a){const e=String(a||"").trim()==="yearly"?"yearly":"monthly",t=document.querySelector(`.dashboard-staff-view .dashboard-stats-card[data-stats-type="${e}"]`);window.app_toggleDashboardCardMode?.(`stats-${e}`,we,t||null)},window.app_closeStatsDetailModal=function(){window.app_closeDashboardCardFullscreen?.()},window.app_updateStatsDetailView=function(){},window.app_attachStatsCardHandlers=function(){Ns()},window.app_expandTeamActivityRefresh=async function(){await Dt(!1,{listId:"staff-activity-list-max",labelId:"staff-activity-range-label-max"})},window.app_closeTeamActivityExpanded=function(){const a=document.getElementById("team-activity-modal-overlay");a&&(a.remove(),document.body.style.overflow="",window.removeEventListener("keydown",window._teamActivityEscHandler))});async function Mn(){const a=window.AppAuth.getUser(),e=window.AppDB.getCached?await window.AppDB.getCached(window.AppDB.getCacheKey("staffUsers","users",{}),N?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):await window.AppDB.getAll("users"),t=window.app_getMyMessages?await window.app_getMyMessages():await window.AppDB.getAll("staff_messages"),n=e.filter(m=>m.id!==a.id).sort((m,h)=>m.name.localeCompare(h.name));!window.app_staffThreadId&&n.length>0&&(window.app_staffThreadId=n[0].id);const s=e.find(m=>m.id===window.app_staffThreadId),i=m=>D(m).replace(/(https?:\/\/[^\s]+)/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'),o=t.filter(m=>m.fromId===a.id&&m.toId===window.app_staffThreadId||m.fromId===window.app_staffThreadId&&m.toId===a.id).sort((m,h)=>new Date(m.createdAt||0)-new Date(h.createdAt||0)),r=o.filter(m=>m.type==="text"),d=o.filter(m=>m.type==="task"),l={};t.forEach(m=>{m.toId===a.id&&!m.read&&(l[m.fromId]=(l[m.fromId]||0)+1)});const c=n.map(m=>{const h=l[m.id]||0;return`
            <button class="staff-directory-item ${m.id===window.app_staffThreadId?"active":""}" onclick="window.app_openStaffThread('${m.id}')">
                <div class="staff-directory-avatar">
                    <img src="${m.avatar}" alt="${D(m.name)}">
                </div>
                <div class="staff-directory-info">
                    <div class="staff-directory-name">${D(m.name)}</div>
                    <div class="staff-directory-role">${D(m.role||"Staff")}</div>
                </div>
                ${h?`<span class="staff-directory-badge">${h}</span>`:""}
            </button>
        `}).join(""),p=s?r.length?r.map(m=>`
        <div class="staff-message ${m.fromId===a.id?"outgoing":"incoming"}">
            <div class="staff-message-meta">${D(m.fromName)} • ${new Date(m.createdAt).toLocaleString()}</div>
            <div class="staff-message-body">${i(m.message||"")}</div>
            ${m.link?`<div class="staff-message-link"><a href="${m.link}" target="_blank" rel="noopener noreferrer">${m.link}</a></div>`:""}
        </div>
    `).join(""):'<div class="staff-message-empty">No messages yet.</div>':'<div class="staff-message-empty">Select a staff member to view messages.</div>',u=s?d.length?d.map(m=>`
        <div class="staff-task-card">
            <div class="staff-task-head">
                <div>
                    <div class="staff-task-title">${D(m.title||"Task")}</div>
                    <div class="staff-task-meta">From ${D(m.fromName)} • Due ${m.dueDate||"No date"}</div>
                </div>
                <span class="staff-task-status ${m.status||"pending"}">${(m.status||"pending").toUpperCase()}</span>
            </div>
            <div class="staff-task-desc">${D(m.description||"")}</div>
            ${m.status==="pending"&&m.toId===a.id?`
                <div class="staff-task-actions">
                    <button onclick="window.app_respondStaffTask('${m.id}', 'approved')" class="staff-task-btn approve">Approve</button>
                    <button onclick="window.app_respondStaffTask('${m.id}', 'rejected')" class="staff-task-btn reject">Reject</button>
                </div>
            `:""}
            ${m.rejectReason?`<div class="staff-task-reason">Reason: ${D(m.rejectReason)}</div>`:""}
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
                        <h3>${s?D(s.name):"Select a staff member"}</h3>
                        <span>${s?D(s.role||"Staff"):""}</span>
                    </div>
                    <div class="staff-thread-actions">
                        <button class="staff-thread-action-btn" ${s?"":"disabled"} onclick="window.app_openStaffMessageModal('${s?s.id:""}', '${s?D(s.name):""}')">
                            <i class="fa-solid fa-message"></i> Send Message
                        </button>
                        <button class="staff-thread-action-btn secondary" ${s?"":"disabled"} onclick="window.app_openStaffTaskModal('${s?s.id:""}', '${s?D(s.name):""}')">
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
    `}let Ja=!1;function zs(){Ja||typeof document>"u"||(Ja=!0,document.addEventListener("click",a=>{const e=a.target.closest("[data-annual-open-day]");if(e){window.app_openAnnualDayPlan?.(e.dataset.annualOpenDay);return}const t=a.target.closest("[data-annual-view]");if(t){window.app_toggleAnnualView?.(t.dataset.annualView);return}if(a.target.closest("[data-annual-jump-today]")){window.app_jumpToAnnualToday?.();return}const s=a.target.closest("[data-annual-year-delta]");if(s){window.app_changeAnnualYear?.(Number(s.dataset.annualYearDelta||0));return}const i=a.target.closest("[data-annual-legend]");if(i){window.app_toggleAnnualLegendFilter?.(i.dataset.annualLegend);return}a.target.closest("[data-annual-export]")&&window.AppReports?.exportAnnualListViewCSV?.(window._annualListItems||[])}),document.addEventListener("input",a=>{const e=a.target.closest("[data-annual-staff-filter]");e&&window.app_setAnnualStaffFilter?.(e.value)}),document.addEventListener("change",a=>{const e=a.target.closest("[data-annual-list-sort]");e&&window.app_setAnnualListSort?.(e.value)}),document.addEventListener("keydown",a=>{const e=a.target.closest("[data-annual-list-search]");e&&a.key==="Enter"&&window.app_setAnnualListSearch?.(e.value)}),document.addEventListener("mouseover",a=>{const e=a.target.closest("[data-annual-preview-date]");!e||e.contains(a.relatedTarget)||window.app_showAnnualHoverPreview?.(a,e.dataset.annualPreviewDate)}),document.addEventListener("mouseout",a=>{const e=a.target.closest("[data-annual-preview-date]");!e||e.contains(a.relatedTarget)||window.app_hideAnnualHoverPreview?.()}))}async function Xe(){typeof window.app_setAnnualStaffFilter!="function"&&(window.app_setAnnualStaffFilter=async T=>{window.app_annualStaffFilter=String(T||"").trim();const E=document.getElementById("page-content");E&&(E.innerHTML=await Xe())}),typeof window.app_toggleAnnualView!="function"&&(window.app_toggleAnnualView=async T=>{window.app_annualViewMode=T;const E=document.getElementById("page-content");E&&(E.innerHTML=await Xe())}),typeof window.app_setAnnualListSearch!="function"&&(window.app_setAnnualListSearch=async T=>{window.app_annualListSearch=String(T||"").trim();const E=document.getElementById("page-content");E&&(E.innerHTML=await Xe())}),typeof window.app_setAnnualListSort!="function"&&(window.app_setAnnualListSort=async T=>{window.app_annualListSort=String(T||"date-asc").trim();const E=document.getElementById("page-content");E&&(E.innerHTML=await Xe())});const a=new Date,e=`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`,t=window.app_annualYear||a.getFullYear(),n=await window.AppCalendar.getPlans(),s=await window.AppDB.getAll("users").catch(()=>[]),i=`${t}-01-01`,o=`${t}-12-31`,r=await(window.AppDB.queryMany?window.AppDB.queryMany("attendance",[{field:"date",operator:">=",value:i},{field:"date",operator:"<=",value:o}]).catch(()=>window.AppDB.getAll("attendance")):window.AppDB.getAll("attendance")).catch(()=>[]);window._currentPlans=n;const d=["January","February","March","April","May","June","July","August","September","October","November","December"],l={};(s||[]).forEach(T=>{l[T.id]=T.name}),window._annualUserMap=l;const c=(T,E)=>l[T]||E||"Staff",p=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0,overdue:!0,completed:!0};window.app_annualLegendFilters=p;let u=window.app_selectedAnnualDate||(t===a.getFullYear()?e:null);u=u?String(u):null,u&&!u.startsWith(`${t}-`)&&(u=null),window.app_selectedAnnualDate=u;const m=String(window.app_annualStaffFilter||"").trim(),h=m.toLowerCase(),f=String(window.app_annualListSearch||"").trim(),w=f.toLowerCase(),v=String(window.app_annualListSort||"date-asc"),k=(s||[]).map(T=>`<option value="${D(T.name)}"></option>`).join(""),b=T=>h?String(T||"").toLowerCase().includes(h):!0,M={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11},A=(T="")=>{const E=String(T||"").trim();if(!E)return null;const P=E.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);if(!P)return null;const B=Number(P[1]),R=Number(P[2]),F=String(P[3]||"").toLowerCase(),H=Number(P[4]),W=M[F];if(!Number.isInteger(B)||!Number.isInteger(R)||!Number.isInteger(W)||!Number.isInteger(H))return null;const K=new Date(H,W,B),O=new Date(H,W,R);if(Number.isNaN(K.getTime())||Number.isNaN(O.getTime()))return null;const U=`${K.getFullYear()}-${String(K.getMonth()+1).padStart(2,"0")}-${String(K.getDate()).padStart(2,"0")}`,X=`${O.getFullYear()}-${String(O.getMonth()+1).padStart(2,"0")}-${String(O.getDate()).padStart(2,"0")}`;return X<U?null:{startDate:U,endDate:X}},g=(T,E)=>{const P=!T?.startDate&&!T?.endDate?A(T?.task||""):null,B=T?.startDate||P?.startDate||E,R=T?.endDate||P?.endDate||T?.startDate||E;return{startDate:B,endDate:R}},S=(T,E,P)=>{const{startDate:B,endDate:R}=g(T,E);return!B||!R?E===P:!(P<B||P>R||T?.completedDate&&T.completedDate<P)},C=(n.workPlans||[]).filter(T=>{if((T.planScope||"personal")==="annual"){if(!h)return!0;const B=c(T.userId,T.userName);return b(B)?!0:(T.plans||[]).some(R=>{const F=c(R.assignedTo||T.userId,B),H=(R.tags||[]).map(W=>W.name||W).join(" ");return b(F)||b(H)})}if(!h)return!0;const P=c(T.userId,T.userName);return b(P)?!0:(T.plans||[]).some(B=>{const R=c(B.assignedTo||T.userId,P),F=(B.tags||[]).map(H=>H.name||H).join(" ");return b(R)||b(F)})}),I=(n.leaves||[]).filter(T=>b(c(T.userId,T.userName))),y=(r||[]).filter(T=>{if(!String(T.date||"").startsWith(String(t)))return!1;const P=T.user_id||T.userId,B=c(P,"");return h?b(B):!0}),_=(T,E,P)=>{const B=`${P}-${String(E+1).padStart(2,"0")}-${String(T).padStart(2,"0")}`,R=I.some(U=>B>=U.startDate&&B<=U.endDate),F=!h&&(n.events||[]).some(U=>U.date===B),H=y.some(U=>U.date===B),W=C.some(U=>!Array.isArray(U.plans)||!U.plans.length?U.date===B:U.plans.some(X=>S(X,U.date,B)))||H;let K="",O=!1;if(W){const U=C.filter(j=>!Array.isArray(j.plans)||!j.plans.length?j.date===B:j.plans.some(Z=>S(Z,j.date,B)));let X="to-be-started";U.forEach(j=>{(j.plans||[]).forEach(Z=>{if(!S(Z,j.date,B))return;const{startDate:ee,endDate:ae}=g(Z,j.date);ee&&ae&&ee!==ae&&ae===B&&(O=!0);const me=Z.completedDate||ae||j.date||B,ke=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(me,Z.status):Z.status||"pending";ke==="overdue"?X="overdue":ke==="in-process"&&X!=="overdue"?X="in-process":ke==="completed"&&X!=="overdue"&&X!=="in-process"&&(X="completed")})}),H&&X==="to-be-started"&&(X="completed"),K=X}return{hasLeave:R,hasEvent:F,hasWork:W,workStatus:K,hasRangeEnd:O}};let x="";for(let T=0;T<12;T++){const E=new Date(t,T,1).getDay(),P=new Date(t,T+1,0).getDate();let B="";for(let R=0;R<E;R++)B+='<div class="annual-day empty"></div>';for(let R=1;R<=P;R++){const F=_(R,T,t),H=R===a.getDate()&&T===a.getMonth()&&t===a.getFullYear(),W=`${t}-${String(T+1).padStart(2,"0")}-${String(R).padStart(2,"0")}`,K=F.hasLeave&&p.leave,O=F.hasEvent&&p.event,U=F.hasWork&&p.work&&(F.workStatus==="overdue"?p.overdue:F.workStatus==="completed"?p.completed:!0),X=K||O||U,j=U?`has-work work-${F.workStatus}`:"";B+=`
                <div class="annual-day ${H?"today":""} ${j} ${u===W?"selected":""} ${X?"":"annual-day-muted"}" data-annual-open-day="${W}" data-annual-preview-date="${W}">
                    ${R}
                    <div class="dot-container">
                        ${K?'<span class="status-dot dot-leave"></span>':""}
                        ${O?'<span class="status-dot dot-event"></span>':""}
                        ${U?'<span class="status-dot dot-work"></span>':""}
                        ${F.hasRangeEnd?'<span class="status-dot" title="Task ends today" style="background:#f97316;"></span>':""}
                    </div>
                </div>`}x+=`
            <div class="annual-month-card">
                <div class="annual-month-head">
                    <span class="annual-month-title">${d[T]}</span>
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
                    ${B}
                </div>
            </div>`}const $=window.app_annualViewMode||"grid",L=(()=>{const T=[],E=new Set,P=O=>{if(!O)return"";const U=String(O).replace(/_/g,"-").toLowerCase();return{"in-process":"In Process","to-be-started":"To Be Started","not-completed":"Not Completed",completed:"Completed",overdue:"Overdue",pending:"Pending",approved:"Approved",holiday:"Holiday",event:"Event"}[U]||U.replace(/\b\w/g,j=>j.toUpperCase())},B=(O,U)=>U||(window.AppCalendar&&O?window.AppCalendar.getSmartTaskStatus(O,U):"pending");if(!h&&window.AppAnalytics){const O=new Date(t,0,1),U=new Date(t,11,31);for(let X=new Date(O);X<=U;X.setDate(X.getDate()+1)){const j=X.toISOString().split("T")[0],Z=window.AppAnalytics.getDayType(X);Z==="Holiday"?T.push({date:j,type:"holiday",title:"Company Holiday (Weekend)",staffName:"All Staff",assignedBy:"System",assignedTo:"All Staff",selfAssigned:!1,dueDate:j,status:"holiday",comments:"",scope:"Shared"}):Z==="Half Day"&&T.push({date:j,type:"event",title:"Half Working Day (Sat)",staffName:"All Staff",assignedBy:"System",assignedTo:"All Staff",selfAssigned:!1,dueDate:j,status:"event",comments:"",scope:"Shared"})}}I.forEach(O=>{const U=new Date(O.startDate),X=new Date(O.endDate||O.startDate),j=c(O.userId,O.userName);for(let Z=new Date(U);Z<=X;Z.setDate(Z.getDate()+1)){const ee=Z.toISOString().split("T")[0];ee.startsWith(String(t))&&T.push({date:ee,type:"leave",title:`${j} (${O.type||"Leave"})`,staffName:j,assignedBy:j,assignedTo:j,selfAssigned:!0,dueDate:O.endDate||O.startDate||ee,status:(O.status||"approved").toLowerCase(),comments:O.reason||"",scope:"Personal"})}}),(n.events||[]).forEach(O=>{if(!h&&String(O.date||"").startsWith(String(t))){const U=[String(O.date||"").trim(),String(O.title||"").trim().toLowerCase(),String(O.type||"event").trim().toLowerCase(),String(O.createdById||O.createdByName||"").trim().toLowerCase()].join("|");if(E.has(U))return;E.add(U),T.push({date:O.date,type:O.type||"event",title:O.title||"Company Event",staffName:"All Staff",assignedBy:O.createdByName||"Admin",assignedTo:"All Staff",selfAssigned:!1,dueDate:O.date,status:"event",comments:O.description||"",scope:"Shared"})}}),C.forEach(O=>{if(String(O.date||"").startsWith(String(t))){const U=(O.planScope||"personal")==="annual",X=c(O.userId,O.userName)||(U?"All Staff":"Staff"),j=U?"Annual":"Personal",Z=O.date;O.plans&&O.plans.length>0&&O.plans.forEach(ee=>{const ae=U?O.createdByName||ee.taggedByName||"Admin":ee.taggedByName||X,me=ee.assignedTo||O.userId,ke=U?ae:c(me,X),Wt=(ee.tags||[]).map(vt=>vt.name||vt).filter(Boolean),{startDate:Kt,endDate:Ke}=g(ee,Z),gt=ee.completedDate||Ke||Z,bt=B(gt,ee.status),Vt=ee.subPlans&&ee.subPlans.length?ee.subPlans.join("; "):ee.comment||ee.notes||"";T.push({date:Kt||Z,type:"work",title:ee.task||"Work Plan Task",staffName:U?ae:ke,assignedBy:ae,assignedTo:U?ae:ke,selfAssigned:ae===ke,dueDate:ee.dueDate||Ke||Z,status:bt,comments:Vt,tags:Wt,scope:j})})}}),y.forEach(O=>{const U=O.user_id||O.userId,X=c(U,"Staff"),j=(O.workDescription||O.location||"").trim()||"Manual log entry";T.push({date:O.date,type:"work",title:j,staffName:X,assignedBy:X,assignedTo:X,selfAssigned:!0,dueDate:O.date,status:"completed",comments:j,tags:["Manual Log"],scope:"Personal"})});const R=[],F=new Set;T.forEach(O=>{const U=`${O.date||""}|${O.type||""}|${O.title||""}|${O.staffName||""}|${O.status||""}`.toLowerCase();F.has(U)||(F.add(U),R.push(O))}),R.sort((O,U)=>O.date.localeCompare(U.date)||O.type.localeCompare(U.type)),R.forEach(O=>{O.statusLabel=P(O.status),O.statusClass=String(O.status||"pending").replace(/[^a-z0-9]+/gi,"-").toLowerCase()});let H=w?R.filter(O=>[O.date,O.staffName,O.title,O.statusLabel,O.comments].join(" ").toLowerCase().includes(w)):R;const W={"date-asc":(O,U)=>String(O.date||"").localeCompare(String(U.date||"")),"date-desc":(O,U)=>String(U.date||"").localeCompare(String(O.date||"")),"staff-asc":(O,U)=>String(O.staffName||"").localeCompare(String(U.staffName||"")),"staff-desc":(O,U)=>String(U.staffName||"").localeCompare(String(O.staffName||"")),"status-asc":(O,U)=>String(O.statusLabel||"").localeCompare(String(U.statusLabel||"")),"status-desc":(O,U)=>String(U.statusLabel||"").localeCompare(String(O.statusLabel||""))},K=W[v]||W["date-asc"];return H.slice().sort(K)})();return window._annualListItems=L,setTimeout(()=>zs(),0),`
        <div class="annual-plan-shell annual-v2-shell">
            <div class="card annual-plan-header annual-v2-header">
                <div class="annual-plan-title-wrap annual-v2-title-wrap">
                    <h2 class="annual-plan-title annual-v2-title">NGO Annual Planning</h2>
                    <p class="annual-plan-subtitle annual-v2-subtitle">Overview of activities for ${t}.</p>
                </div>
                <div class="annual-plan-controls annual-v2-controls">
                    <div class="annual-staff-filter annual-v2-staff-filter">
                        <i class="fa-solid fa-user"></i>
                        <input type="text" list="annual-staff-names" value="${D(m)}" placeholder="Filter by staff name" data-annual-staff-filter="1">
                        <datalist id="annual-staff-names">${k}</datalist>
                    </div>
                    <div class="annual-view-toggle annual-v2-view-toggle">
                        <button data-annual-view="grid" class="annual-toggle-btn annual-v2-toggle-btn ${$==="grid"?"active":""}">
                            <i class="fa-solid fa-calendar-days"></i> Grid
                        </button>
                        <button data-annual-view="list" class="annual-toggle-btn annual-v2-toggle-btn ${$==="list"?"active":""}">
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

            <div id="annual-grid-view" style="display:${$==="grid"?"block":"none"};">
                <div class="card annual-legend-bar annual-v2-legend-bar">
                    <button class="annual-legend-chip ${p.leave?"active":""}" data-annual-legend="leave"><span class="annual-dot leave"></span> Staff Leave</button>
                    <button class="annual-legend-chip ${p.event?"active":""}" data-annual-legend="event"><span class="annual-dot event"></span> Company Event</button>
                    <button class="annual-legend-chip ${p.work?"active":""}" data-annual-legend="work"><span class="annual-dot work"></span> Work Plan</button>
                    <button class="annual-legend-chip ${p.overdue?"active":""}" data-annual-legend="overdue">Overdue Border</button>
                    <button class="annual-legend-chip ${p.completed?"active":""}" data-annual-legend="completed">Completed Border</button>
                </div>
                <div class="annual-grid-layout annual-v2-grid-layout">
                    <div class="annual-plan-grid annual-v2-plan-grid">
                        ${x}
                    </div>
                </div>
            </div>

            <div id="annual-list-view" style="display:${$==="list"?"block":"none"};">
                <div class="card annual-list-card annual-v2-list-card">
                    <div class="annual-list-head annual-v2-list-head">
                        <h4>Annual Timeline</h4>
                        <div class="annual-list-actions annual-v2-list-actions">
                            <div class="annual-list-search-wrap annual-v2-search-wrap">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="text" value="${D(f)}" placeholder="Search list..." data-annual-list-search="1">
                            </div>
                            <select class="annual-v2-sort-select" data-annual-list-sort="1">
                                <option value="date-asc" ${v==="date-asc"?"selected":""}>Date: Oldest First</option>
                                <option value="date-desc" ${v==="date-desc"?"selected":""}>Date: Newest First</option>
                                <option value="staff-asc" ${v==="staff-asc"?"selected":""}>Staff: A-Z</option>
                                <option value="staff-desc" ${v==="staff-desc"?"selected":""}>Staff: Z-A</option>
                            </select>
                            <button class="annual-v2-export-btn" data-annual-export="1">
                                <i class="fa-solid fa-file-export"></i> Export Excel
                            </button>
                        </div>
                    </div>
                    ${L.length===0?'<div class="annual-list-empty">No items found.</div>':`
                        <div class="annual-list-table-wrap">
                            <div class="annual-list-table">
                                <div class="annual-list-header">
                                    <div>Date</div><div>Staff Name</div><div>Task</div><div>Assigned By</div><div>Status</div><div>Comments</div><div>Scope</div>
                                </div>
                                ${L.map(T=>`
                                    <div class="annual-list-row">
                                        <div class="annual-list-cell">${T.date}</div>
                                        <div class="annual-list-cell">${D(T.staffName)}</div>
                                        <div class="annual-list-cell annual-list-task">${D(T.title)}</div>
                                        <div class="annual-list-cell">${D(T.assignedBy)}</div>
                                        <div class="annual-list-cell"><span class="annual-list-status status-${T.statusClass}">${T.statusLabel}</span></div>
                                        <div class="annual-list-cell annual-list-comments">${D(T.comments||"--")}</div>
                                        <div class="annual-list-cell">${T.scope}</div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                    `}
                </div>
            </div>
        </div>`}let Xa=!1;function js(){Xa||typeof document>"u"||(Xa=!0,document.addEventListener("click",a=>{const e=a.target.closest("[data-timesheet-open-day]");if(e){window.app_openTimesheetDayDetail?.(e.dataset.timesheetOpenDay);return}if(a.target.closest("[data-timesheet-request-leave]")){const c=document.getElementById("leave-modal");c&&(c.style.display="flex");return}if(a.target.closest("[data-timesheet-manual-log]")){document.dispatchEvent(new CustomEvent("open-log-modal"));return}const s=a.target.closest("[data-timesheet-month-delta]");if(s){window.app_changeTimesheetMonth?.(Number(s.dataset.timesheetMonthDelta||0));return}if(a.target.closest("[data-timesheet-today]")){window.app_jumpTimesheetToday?.();return}const o=a.target.closest("[data-timesheet-export]");if(o){window.AppReports?.exportUserLogs?.(o.dataset.timesheetExportUser||"");return}const r=a.target.closest("[data-timesheet-edit-log]");if(r){window.app_editWorkSummary?.(r.dataset.timesheetEditLog);return}const d=a.target.closest("[data-timesheet-detail-log]");if(d){const c=d.dataset.timesheetDetailLog;alert("Detailed analysis for log "+c+" coming soon!");return}const l=a.target.closest("[data-timesheet-close-modal]");l&&l.closest(".modal-overlay")?.remove()}),document.addEventListener("change",a=>{const e=a.target.closest("[data-timesheet-view-select]");e&&window.app_toggleTimesheetViewSelect?.(e.value)}))}async function Qe(){setTimeout(()=>js(),0),typeof window.app_setTimesheetView!="function"&&(window.app_setTimesheetView=async A=>{window.app_timesheetViewMode=A==="calendar"?"calendar":"list";const g=document.getElementById("page-content");g&&(g.innerHTML=await Qe())}),typeof window.app_changeTimesheetMonth!="function"&&(window.app_changeTimesheetMonth=async A=>{const g=new Date,S=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:g.getMonth(),C=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:g.getFullYear(),I=new Date(C,S,1);I.setMonth(I.getMonth()+A),window.app_timesheetMonth=I.getMonth(),window.app_timesheetYear=I.getFullYear();const y=document.getElementById("page-content");y&&(y.innerHTML=await Qe())}),typeof window.app_jumpTimesheetToday!="function"&&(window.app_jumpTimesheetToday=async()=>{const A=new Date;window.app_timesheetMonth=A.getMonth(),window.app_timesheetYear=A.getFullYear();const g=document.getElementById("page-content");g&&(g.innerHTML=await Qe())});const a=window.AppAuth.getUser(),e=await window.AppAttendance.getLogs(),t=await window.AppCalendar.getPlans().catch(()=>({workPlans:[]})),n=new Date,s=window.app_timesheetViewMode||"list",i=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:n.getMonth(),o=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:n.getFullYear(),r=new Date(o,i,1).toLocaleString("en-US",{month:"long",year:"numeric"}),d=`${o}-${String(i+1).padStart(2,"0")}-01`,l=`${o}-${String(i+1).padStart(2,"0")}-31`,c=e.filter(A=>A.date&&A.date>=d&&A.date<=l),p=(t.workPlans||[]).filter(A=>A.userId===a.id&&A.date&&A.date>=d&&A.date<=l),u={};c.forEach(A=>{u[A.date]||(u[A.date]=[]),u[A.date].push(A)});const m={};p.forEach(A=>{m[A.date]||(m[A.date]=[]),(Array.isArray(A.plans)?A.plans:[]).forEach(S=>{m[A.date].push(S.task||"Planned task")})}),window._timesheetLogsByDate=u,window._timesheetPlansByDate=m;let h=0,f=0;const w=new Set;c.forEach(A=>{A.durationMs&&(h+=A.durationMs/(1e3*60)),(A.lateCountable||window.AppAttendance&&window.AppAttendance.normalizeType(A.type)==="Late")&&f++,A.date&&w.add(A.date)});const v=`${Math.floor(h/60)}h ${Math.round(h%60)}m`,k=Math.floor(f/(N?.LATE_GRACE_COUNT||3))*(N?.LATE_DEDUCTION_PER_BLOCK||.5),b=A=>window.AppAttendance&&window.AppAttendance.normalizeType?window.AppAttendance.normalizeType(A):A;window.app_editWorkSummary=async A=>{const S=(await window.AppAttendance.getLogs()).find(y=>y.id===A),C=S?S.workDescription:"",I=await window.appPrompt("Update Work Summary:",C||"",{title:"Update Work Summary",confirmText:"Save"});if(I!==null){await window.AppAttendance.updateLog(A,{workDescription:I});const y=document.getElementById("page-content");y&&(y.innerHTML=await Qe())}},window.app_switchTimesheetPanel=(A,g)=>{const S=A==="calendar"?"calendar":"list";window.app_timesheetViewMode=S;const C=document.getElementById("timesheet-list-panel"),I=document.getElementById("timesheet-calendar-panel"),y=document.getElementById("timesheet-view-select");C&&(C.style.display=S==="list"?"block":"none"),I&&(I.style.display=S==="calendar"?"block":"none"),y&&(y.value=S);const _=g&&g.closest?g.closest(".timesheet-view-toggle"):null;(_?_.querySelectorAll(".annual-toggle-btn"):[]).forEach($=>$.classList.remove("active")),g&&g.classList&&g.classList.add("active")},window.app_openTimesheetDayDetail=A=>{const g=window._timesheetLogsByDate&&window._timesheetLogsByDate[A]||[],S=window._timesheetPlansByDate&&window._timesheetPlansByDate[A]||[],C=g.length?g.map(x=>`
                <div class="timesheet-day-detail-item">
                    <div class="timesheet-day-detail-head">
                        <span>${D(x.checkIn||"--")} - ${D(x.checkOut||"--")}</span>
                        <span class="timesheet-day-status-chip">${D(b(x.type))}</span>
                    </div>
                    <div class="timesheet-day-detail-text">${D(x.workDescription||x.location||"No summary")}</div>
                    ${x.id&&x.id!=="active_now"?`<button type="button" class="action-btn secondary" data-timesheet-edit-log="${x.id}">Edit</button>`:""}
                </div>
            `).join(""):'<div class="timesheet-day-detail-empty">No attendance logs for this date.</div>',I=S.length?S.map(x=>`<div class="timesheet-day-plan-item">${D(x)}</div>`).join(""):'<div class="timesheet-day-detail-empty">No planned tasks for this date.</div>',y=`timesheet-day-detail-${Date.now()}`,_=`
            <div class="modal-overlay" id="${y}" style="display:flex;">
                <div class="modal-content" style="max-width:560px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <h3 style="margin:0;">${D(A)} Details</h3>
                        <button type="button" class="app-system-dialog-close" data-timesheet-close-modal="1">&times;</button>
                    </div>
                    <div style="display:grid; gap:0.9rem;">
                        <div>
                            <h4 style="margin:0 0 0.45rem 0; color:#334155;">Logged Work</h4>
                            ${C}
                        </div>
                        <div>
                            <h4 style="margin:0 0 0.45rem 0; color:#334155;">Planned Tasks</h4>
                            ${I}
                        </div>
                    </div>
                </div>
            </div>`;typeof window.app_showModal=="function"?window.app_showModal(_,y):(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",_)};const M=()=>{const A=new Date(o,i,1).getDay(),g=new Date(o,i+1,0).getDate();let S="";for(let C=0;C<A;C++)S+='<div class="timesheet-cal-day empty"></div>';for(let C=1;C<=g;C++){const I=`${o}-${String(i+1).padStart(2,"0")}-${String(C).padStart(2,"0")}`,y=u[I]||[],_=y.length?y.slice().sort((R,F)=>{const H=W=>{const K=b(W.type);return K==="Absent"?4:K==="Half Day"?3:K==="Late"?2:K==="Present (Late Waived)"?1:0};return H(F)-H(R)})[0]:null,x=m[I]||[],$=I===new Date().toISOString().split("T")[0],L=_?b(_.type):"",T=_?L==="Absent"?"absent":L==="Half Day"||L==="Late"?"late":"present":"none",E=_?L:"No log",P=y.map(R=>(R.workDescription||R.location||"").trim()).filter(Boolean),B=P.length?P.slice(0,2).map(R=>`<div class="timesheet-cal-plan">${D(R)}</div>`).join("")+(P.length>2?`<div class="timesheet-cal-more">+${P.length-2} more logs</div>`:""):x.length?x.slice(0,2).map(R=>`<div class="timesheet-cal-plan">${D(R)}</div>`).join("")+(x.length>2?`<div class="timesheet-cal-more">+${x.length-2} more</div>`:""):'<div class="timesheet-cal-empty">No plans</div>';S+=`
                <div class="timesheet-cal-day ${$?"today":""}" data-timesheet-open-day="${I}" style="cursor:pointer;">
                    <div class="timesheet-cal-day-head">
                        <span class="timesheet-cal-date">${C}</span>
                        <span class="timesheet-cal-attendance ${T}">${E}</span>
                    </div>
                    <div class="timesheet-cal-plans">${B}</div>
                </div>`}return`
            <div class="timesheet-calendar-wrap">
                <div class="timesheet-calendar-weekdays">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div class="timesheet-calendar-grid">${S}</div>
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
                    <div class="value">${v}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Days Present</div>
                    <div class="value">${w.size} <span class="timesheet-stat-sub">Days</span></div>
                </div>
                <div class="stat-card">
                    <div class="label">Late Count</div>
                    <div class="value" style="color:${f>2?"var(--accent)":"var(--text-main)"}">${f}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Late Deduction</div>
                    <div class="value">${k.toFixed(1)} <span class="timesheet-stat-sub">Days</span></div>
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
                        ${c.length?c.map(A=>`
                            <tr>
                                <td data-label="Date">
                                    <div class="timesheet-log-date">${A.date||"Active Session"}</div>
                                    <div class="timesheet-log-id">Log ID: ${A.id==="active_now"?"N/A":A.id.slice(-4)}</div>
                                </td>
                                <td data-label="Timings">
                                    <div class="time-badge">
                                        <span class="in"><i class="fa-solid fa-caret-right"></i> ${A.checkIn}</span>
                                        <span class="out"><i class="fa-solid fa-caret-left"></i> ${A.checkOut||"--:--"}</span>
                                    </div>
                                </td>
                                <td data-label="Status">
                                    <div class="timesheet-status-col">
                                        <span class="badge" style="background:${b(A.type)==="Absent"?"#fef2f2":b(A.type)==="Half Day"||b(A.type)==="Late"?"#fff7ed":"#f0fdf4"}; color:${b(A.type)==="Absent"?"#991b1b":b(A.type)==="Half Day"||b(A.type)==="Late"?"#c2410c":"#15803d"}; border:1px solid ${b(A.type)==="Absent"?"#fecaca":b(A.type)==="Half Day"||b(A.type)==="Late"?"#fed7aa":"#dcfce7"};">${b(A.type)}</span>
                                        <div class="timesheet-duration">${A.duration||"--"}</div>
                                    </div>
                                </td>
                                <td data-label="Work Summary" class="timesheet-summary-cell">
                                    <div class="timesheet-summary-wrap">
                                        <div class="dashboard-viewing-meta">
                                            <div class="timesheet-summary-text">${D(A.workDescription)||'<span class="timesheet-empty-summary">No summary provided</span>'}</div>
                                            ${A.location?`<div class="timesheet-location"><i class="fa-solid fa-location-dot"></i> ${D(A.location)}</div>`:""}
                                        </div>
                                        ${A.id!=="active_now"?`<button data-timesheet-edit-log="${A.id}" class="timesheet-edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>`:""}
                                    </div>
                                </td>
                                <td data-label="Detail" class="text-right">
                                    ${A.id!=="active_now"?`<button class="icon-btn timesheet-detail-btn" title="View Detailed Log" data-timesheet-detail-log="${A.id}"><i class="fa-solid fa-circle-info"></i></button>`:'<span class="timesheet-live">SESSION LIVE</span>'}
                                </td>
                            </tr>
                        `).join(""):'<tr><td colspan="5" class="timesheet-empty-row">No attendance records found for this period.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div id="timesheet-calendar-panel" style="display:${s==="calendar"?"block":"none"};">
                ${M()}
            </div>
        </div>
    `}async function Cn(){try{const a=window.AppAuth.getUser();if(!a)return'<div class="card">User state lost. Please <a href="#" onclick="window.AppAuth.logout()">Login Again</a></div>';const e=a.role==="Administrator"||a.isAdmin,t=e?await window.AppDB.getAll("users"):[],n=e&&window.app_profileTargetUserId?window.app_profileTargetUserId:a.id,s=e&&t.find(g=>g.id===n)||a,i=(g,S)=>{const C=String(g||"").trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(C))return"NA";const I=C.replace(/-/g,""),y=String(S||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase().slice(-3)||"USR";return`EMP-${I}-${y}`},o=typeof s.joinDate=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s.joinDate)?s.joinDate:"",r=o?s.employeeId||i(o,s.id):"NA",d=Number(s.birthDay||0),l=Number(s.birthMonth||0),c=Number(s.birthYear||0),p=[d?String(d).padStart(2,"0"):"--",l>=1&&l<=12?new Date(2026,l-1,1).toLocaleString("en-US",{month:"long"}):"--",c?String(c):""].filter(Boolean).join(" ").trim(),[u,m,h]=await Promise.all([window.AppAnalytics?window.AppAnalytics.getUserMonthlyStats(s.id):null,window.AppAnalytics?window.AppAnalytics.getUserYearlyStats(s.id):null,window.AppLeaves?window.AppLeaves.getUserLeaves(s.id):[]]);window.app_changeProfileStaff=async g=>{window.app_profileTargetUserId=g||a.id;const S=document.getElementById("page-content");S&&(S.innerHTML=await Cn())},window.app_confirmSignOut=()=>{confirm("Are you sure you want to sign out?")&&window.AppAuth.logout()};const f=s.id===a.id,w=u?.attendanceRate??"—",v=u?.punctualityRate??"—",k=u?.totalHours??"—",b=m?.totalDays??"—",M=g=>g==="Approved"?"#16a34a":g==="Rejected"?"#dc2626":"#d97706",A=(s.name||"U").split(" ").map(g=>g[0]).join("").slice(0,2).toUpperCase();return`
            <div class="pro-profile-root">

                <!-- ── Hero Banner ── -->
                <div class="pro-profile-hero">
                    <div class="pro-profile-hero-bg"></div>
                    <div class="pro-profile-hero-inner">
                        <!-- Avatar -->
                        <div class="pro-profile-avatar-ring">
                            ${s.avatar?`<img src="${D(s.avatar)}" alt="${D(s.name)}" class="pro-profile-avatar-img">`:`<div class="pro-profile-avatar-initials">${A}</div>`}
                            <span class="pro-profile-status-dot ${s.status==="in"?"online":"offline"}"
                                  title="${s.status==="in"?"Currently checked in":"Not checked in"}"></span>
                        </div>

                        <!-- Identity -->
                        <div class="pro-profile-identity">
                            <div class="pro-profile-name-row">
                                <h1 class="pro-profile-name">${D(s.name)}</h1>
                                <span class="pro-profile-role-badge">${D(s.role||"Staff")}</span>
                            </div>
                            <div class="pro-profile-email">
                                <i class="fa-solid fa-envelope"></i>
                                ${D(s.email||"—")}
                            </div>
                            <div class="pro-profile-meta-row">
                                <span class="pro-profile-chip">
                                    <i class="fa-solid fa-id-card"></i>${D(r)}
                                </span>
                                ${o?`<span class="pro-profile-chip">
                                    <i class="fa-solid fa-calendar-check"></i>Joined ${o}
                                </span>`:""}
                                ${s.department?`<span class="pro-profile-chip">
                                    <i class="fa-solid fa-building"></i>${D(s.department)}
                                </span>`:""}
                            </div>
                        </div>

                        <!-- Header Actions -->
                        <div class="pro-profile-header-actions">
                            ${e?`
                            <select class="pro-profile-staff-picker" onchange="window.app_changeProfileStaff(this.value)">
                                <option value="">My Profile</option>
                                ${t.map(g=>`<option value="${g.id}" ${g.id===n?"selected":""}>${D(g.name)}</option>`).join("")}
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
                        <div class="pro-stat-value">${w}${typeof w=="number"?"%":""}</div>
                        <div class="pro-stat-label">Attendance</div>
                    </div>
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-clock pro-stat-icon" style="color:#f59e0b;"></i>
                        <div class="pro-stat-value">${v}${typeof v=="number"?"%":""}</div>
                        <div class="pro-stat-label">Punctuality</div>
                    </div>
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-hourglass-half pro-stat-icon" style="color:#10b981;"></i>
                        <div class="pro-stat-value">${k}${typeof k=="number"?"h":""}</div>
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
                                    ${h.slice(0,8).map(g=>`
                                    <tr>
                                        <td>${D(g.startDate||"—")}</td>
                                        <td>${D(g.endDate||"—")}</td>
                                        <td>${D(g.type||"—")}</td>
                                        <td>${g.daysCount??"—"}</td>
                                        <td>
                                            <span class="pro-status-pill" style="background:${M(g.status)}18;color:${M(g.status)};">
                                                ${D(g.status||"Pending")}
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
                                ${Object.entries(m.breakdown||{}).filter(([,g])=>g>0).map(([g,S])=>`
                                <div class="pro-breakdown-chip">
                                    <span class="pro-breakdown-count">${S}</span>
                                    <span class="pro-breakdown-key">${D(g)}</span>
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
                                ${[["Department",s.department||"Operations"],["Role",s.role||"Staff"],["Level",s.level||"—"],["Reports To",s.reportsTo||"Admin"],["Employee ID",r],["Join Date",o||"N/A"],["Birthday",p||"N/A"],["Payroll Cycle","Monthly (25th)"]].map(([g,S])=>`
                                <div class="pro-detail-row">
                                    <div class="pro-detail-label">${g}</div>
                                    <div class="pro-detail-value">${D(String(S))}</div>
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
        `}catch(a){return console.error("Profile Render Error:",a),`<div class="card error-card">Failed to load profile: ${D(a.message)}</div>`}}async function Ln(a=null,e=null){const t=window.AppAuth.getUser(),n=window.app_hasPerm("attendance","admin",t),s=await window.AppDB.getAll("users"),i=new Date,o=a!==null?parseInt(a):i.getMonth(),r=e!==null?parseInt(e):i.getFullYear(),d=`${r}-${String(o+1).padStart(2,"0")}-01`,l=`${r}-${String(o+1).padStart(2,"0")}-31`;let c=[];try{c=(await window.AppDB.query("attendance","date",">=",d)).filter(S=>S.date<=l)}catch(g){console.warn("MasterSheet: query failed, fetching all attendance logs",g),c=(await window.AppDB.getAll("attendance")).filter(C=>C.date>=d&&C.date<=l)}const p=new Date(r,o+1,0).getDate(),u=Array.from({length:p},(g,S)=>S+1),m=["January","February","March","April","May","June","July","August","September","October","November","December"],h=g=>{const S=new Date(`${g}T00:00:00`),C=S.getDay();if(C===0)return"holiday";if(C===6){const I=Math.floor((S.getDate()-1)/7)+1;if(I===2||I===4)return"holiday";if(I===1||I===3||I===5)return"halfday"}return"working"},f=g=>String(g?.type||"").includes("Leave")||g?.location==="On Leave",w=g=>!g||!g.checkOut||g.checkOut==="Active Now"?!1:typeof g.activityScore<"u"||typeof g.locationMismatched<"u"||!!g.checkOutLocation||typeof g.outLat<"u"||typeof g.outLng<"u",v=g=>!g||!g.autoCheckout?"":String(g.missedCheckoutReasonStatus||"").toLowerCase()==="approved"||g.missedCheckoutApprovedAsFullDay?"Auto-closed due to missed checkout. Admin approved and converted this entry to full day.":String(g.missedCheckoutReasonStatus||"").toLowerCase()==="rejected"?"Auto-closed due to missed checkout. Admin rejected the submitted reason.":String(g.missedCheckoutReasonStatus||"").toLowerCase()==="approved"?"Auto-closed due to missed checkout. Admin approved the submitted reason.":"Auto-closed due to missed checkout.",k=g=>g?.isManualOverride?4:f(g)?3:w(g)?2:1,b=g=>{if(Object.prototype.hasOwnProperty.call(g||{},"attendanceEligible"))return g.attendanceEligible===!0;const S=String(g?.entrySource||"");return S==="staff_manual_work"?!1:S==="admin_override"||S==="checkin_checkout"||g?.isManualOverride||g?.location==="Office (Manual)"||g?.location==="Office (Override)"||typeof g?.activityScore<"u"||typeof g?.locationMismatched<"u"||typeof g?.autoCheckout<"u"||!!g?.checkOutLocation||typeof g?.outLat<"u"||typeof g?.outLng<"u"?!0:String(g?.type||"").includes("Leave")||g?.location==="On Leave"},M=new Date().toISOString().split("T")[0],A=g=>{const S=new Date(g);return`${S.getFullYear()}-${String(S.getMonth()+1).padStart(2,"0")}-${String(S.getDate()).padStart(2,"0")}`};return window.app_refreshMasterSheet=async()=>{const g=document.getElementById("sheet-month")?.value,S=document.getElementById("sheet-year")?.value,C=document.getElementById("page-content");C&&(C.innerHTML=await Ln(g,S))},`
        <div class="dashboard-grid dashboard-modern dashboard-admin-view">
            <div class="card full-width">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                    <div>
                        <h2 style="font-size:1.1rem; margin-bottom:0.1rem;">Attendance Sheet</h2>
                        <p style="color:var(--text-muted); font-size:0.75rem;">Master grid view for all staff logs.</p>
                    </div>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <select onchange="window.app_refreshMasterSheet()" id="sheet-month" style="padding:0.4rem; border-radius:6px; border:1px solid #ddd; font-size:0.8rem;">
                            ${m.map((g,S)=>`<option value="${S}" ${S===o?"selected":""}>${g}</option>`).join("")}
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
                                ${u.map(g=>`<th style="text-align:center; min-width: 28px; padding:4px; border-right: 1px solid #eee; font-size:0.75rem;">${g}</th>`).join("")}
                            </tr>
                        </thead>
                        <tbody>
                            ${s.sort((g,S)=>g.name.localeCompare(S.name)).map((g,S)=>`
                                <tr>
                                    <td style="text-align:center; border-right: 1px solid #eee; position: sticky; left: 0; background: #fff; z-index: 5; padding:4px; font-size:0.75rem;">${S+1}</td>
                                    <td style="border-right: 2px solid #ddd; position: sticky; left: 35px; background: #fff; z-index: 5; font-weight: 500; padding:4px;">
                                        <div style="display:flex; flex-direction:column;">
                                            <span style="font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px;">${D(g.name)}</span>
                                            <span style="font-size:0.65rem; color:#666; font-weight:400;">${D(g.dept||"General")}</span>
                                        </div>
                                    </td>
                                    ${u.map(C=>{const I=`${r}-${String(o+1).padStart(2,"0")}-${String(C).padStart(2,"0")}`,_=c.filter(P=>(P.userId===g.id||P.user_id===g.id)&&P.date===I).filter(b),x=h(I);let $="-",L="",T="No log";if(_.length>0){const P=_.slice().sort((H,W)=>k(W)-k(H))[0],B=P.autoCheckout&&String(P.missedCheckoutReasonStatus||"").toLowerCase()==="approved"?"Present":P.type,R=window.AppAttendance&&window.AppAttendance.normalizeType?window.AppAttendance.normalizeType(B):B,F=v(P);$=R.charAt(0).toUpperCase(),T=`${P.checkIn} - ${P.checkOut||"Active"}
${R}`,F&&(T+=`
${F}`),R==="Present"?L="color: #10b981; font-weight: bold; font-size: 0.9rem;":R==="Late"?(L="color: #f59e0b; font-weight: bold;",$="L"):R==="Half Day"?(L="color: #c2410c; font-weight: bold;",$="HD"):R==="Absent"?(L="color: #ef4444; font-weight: bold;",$="A"):R.includes("Leave")&&R.includes("Half Day")?(L="color: #7c3aed; font-weight: bold;",$="HD"):R.includes("Leave")?(L="color: #8b5cf6; font-weight: bold;",$="C"):R==="Work - Home"?(L="color: #0ea5e9; font-weight: bold;",$="W"):R==="On Duty"&&(L="color: #0369a1; font-weight: bold;",$="D"),P.isManualOverride&&(L="color: #be185d; font-weight: bold; background: #fdf2f8;"),F&&($=`<span style="display:inline-flex; align-items:flex-start; gap:2px;"><span>${$}</span><span style="color:#4338ca; font-size:0.7rem; line-height:1;">•</span></span>`)}else{const P=I===M&&g.status==="in"&&g.lastCheckIn&&A(g.lastCheckIn)===I,B=typeof g.joinDate=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(g.joinDate)?I<g.joinDate:!1,R=I>M;P?($="P",L="color: #10b981; font-weight: bold; font-size: 0.9rem;",T="Checked in (pending checkout)"):R||B?($="-",L="color: #94a3b8; font-weight: 600;",T=R?"Future date":`Before joining date (${g.joinDate})`):x==="holiday"?($="H",L="color: #64748b; font-weight: 700;",T="Holiday"):($="A",L="color: #ef4444; font-weight: bold;",T="Absent")}return n||t&&(g.id===t.id||g.user_id===t.id||g.username&&t.username&&g.username===t.username||g.email&&t.email&&g.email===t.email)||(T=""),`<td style="text-align:center; ${n?"cursor:pointer;":""} border-right: 1px solid #eee; padding:2px; font-size:0.75rem; ${L}" ${T?`title="${T}"`:""} ${n?`onclick="window.app_openCellOverride('${g.id}', '${I}')"`:""}>${$}</td>`}).join("")}
                                </tr>`).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`}const ma="admin-card-max-overlay",fa="admin-card-max-title",Ca="admin-card-max-body",he="tile",En="original",Mt="fullscreen",Pn=new Set([he,En,Mt]),Ys=()=>{let a=document.getElementById(ma);return a||(a=document.createElement("div"),a.id=ma,a.className="admin-max-overlay",a.innerHTML=`
            <div class="admin-max-window" role="dialog" aria-modal="true" aria-labelledby="${fa}">
                <div class="admin-max-header">
                    <h2 id="${fa}"></h2>
                    <button type="button" class="admin-max-close" onclick="window.app_closeAdminCardMaximize?.()" aria-label="Close maximized card">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="${Ca}" class="admin-max-body"></div>
            </div>
        `,a.addEventListener("click",e=>{e.target===a&&window.app_closeAdminCardMaximize?.()}),document.body.appendChild(a)),window.__adminMaxKeyHandlerBound||(document.addEventListener("keydown",e=>{e.key==="Escape"&&document.body.classList.contains("admin-max-open")&&window.app_closeAdminCardMaximize?.()}),window.__adminMaxKeyHandlerBound=!0),a},Nn=a=>{document?.body&&document.body.classList.toggle("admin-max-open",!!a)},at=()=>{const a=window._adminMaxCardId?String(window._adminMaxCardId):"",e=document.getElementById(ma);e&&(e.classList.remove("open"),e.remove());const t=document.getElementById(Ca);t&&(t.innerHTML=""),Nn(!1);const n=window._adminMaxTriggerEl;if(window._adminMaxTriggerEl=null,window._adminMaxCardId=null,a){const s=La(a);s&&(Bn(s,he),s.dataset.adminCardMode=he),window._adminCardModeState&&(window._adminCardModeState[a]=he)}if(n&&typeof n.focus=="function")try{n.focus()}catch{}},Ws=(a,e=null)=>{at();const n=(window._adminCardTemplates||{})[a];if(!n)return;const s=Ys(),i=document.getElementById(fa),o=document.getElementById(Ca);if(!i||!o)return;i.textContent=n.title||"Admin Card",o.innerHTML=`<div class="admin-max-card-content" data-admin-card-max="${D(a)}">${n.expandedHtml||n.originalHtml||n.tileHtml||""}</div>`,window._adminMaxTriggerEl=e,window._adminMaxCardId=a,Nn(!0),s.classList.add("open");const r=s.querySelector(".admin-max-close");if(r)try{r.focus()}catch{}},La=a=>a?document.querySelector(`.dashboard-admin-view .admin-card-compact[data-admin-card="${a}"]`):null,Bn=(a,e)=>{a&&(a.classList.remove("admin-card-mode-tile","admin-card-mode-original"),e===En?(a.classList.add("admin-card-mode-original"),a.dataset.adminOriginalFullWidth==="1"&&a.classList.add("full-width")):(a.classList.add("admin-card-mode-tile"),a.classList.remove("full-width")))},Qt=(a,e,t=null)=>{if(!Pn.has(e))return;const n=document.querySelectorAll(".dashboard-admin-view .admin-card-compact[data-admin-card]");n.length&&(n.forEach(s=>{const o=s.getAttribute("data-admin-card")===String(a)?e:he;Bn(s,o),s.dataset.adminCardMode=o}),window._adminCardModeState=window._adminCardModeState||{},window._adminCardModeState[a]=e,window._adminActiveCardModeId=a,e===Mt?Ws(a,t||La(a)):at())},Ks=a=>String(a||"").replace(/<div[^>]*class="[^"]*admin-card-mode-controls[^"]*"[^>]*>[\s\S]*?<\/div>/gi,"");typeof window<"u"&&(window.app_closeAdminCardFullscreen=at,window.app_closeAdminCardMaximize=at,window.app_toggleAdminCardMode=(a,e=he,t=null)=>{if(!a)return;const n=Pn.has(e)?e:he,s=La(a);if(String(s?.dataset?.adminCardMode||he)===n&&n!==he){Qt(a,he,t||null);return}if(n===Mt&&window._adminMaxCardId===a){at(),Qt(a,he);return}Qt(a,n,t||null)},window.app_toggleAdminCardMaximize=(a,e=null)=>{window.app_toggleAdminCardMode?.(a,Mt,e||null)});async function ha(a=null,e=null){let t=[],n=[],s=[],i={avgScore:0,trendData:[0,0,0,0,0,0,0],labels:[]},o=[],r=[];try{const $=new Date().toISOString().split("T")[0];a=a||$,e=e||$;const L=await Promise.allSettled([window.AppDB.getCached?window.AppDB.getCached(window.AppDB.getCacheKey("adminUsers","users",{}),N?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):window.AppDB.getAll("users"),window.AppAnalytics.getSystemPerformance(),window.AppDB.queryMany?window.AppDB.queryMany("location_audits",[],{orderBy:[{field:"timestamp",direction:"desc"}],limit:300}).catch(()=>window.AppDB.getAll("location_audits")):window.AppDB.getAll("location_audits"),window.AppLeaves.getPendingLeaves(),window.AppDB.queryMany?window.AppDB.queryMany("system_audit_logs",[],{orderBy:[{field:"createdAt",direction:"desc"}],limit:80}).catch(()=>window.AppDB.getAll("system_audit_logs")):window.AppDB.getAll("system_audit_logs")]),T=(F,H,W)=>{const K=L[F];return K&&K.status==="fulfilled"?K.value:(K&&K.status==="rejected"&&console.warn(`Admin data fetch failed for ${W}:`,K.reason),H)};t=T(0,[],"users"),i=T(1,{avgScore:0,trendData:[0,0,0,0,0,0,0],labels:[]},"performance"),o=T(2,[],"location_audits"),n=T(3,[],"pending_leaves"),r=T(4,[],"system_audit_logs"),o=o.filter(F=>{const H=new Date(F.timestamp).toISOString().split("T")[0];return H>=a&&H<=e}).sort((F,H)=>H.timestamp-F.timestamp),r=(r||[]).filter(F=>F&&F.module==="simulation"&&String(F.type||"").startsWith("legacy_dummy_cleanup_")).sort((F,H)=>Number(H.createdAt||0)-Number(F.createdAt||0)).slice(0,25);const E=window.AppAuth?.getUser?.(),P=E?t.find(F=>String(F.id)===String(E.id))||E:null,B=(Array.isArray(P?.notifications)?P.notifications:[]).filter(F=>F&&F.type==="missed-checkout-reason"&&String(F.status||"pending").toLowerCase()==="pending"&&F.logId),R=Array.from(new Set(B.map(F=>String(F.logId||"")).filter(Boolean)));s=R.length?window.AppDB.getManyByIds?await window.AppDB.getManyByIds("attendance",R):(await Promise.all(R.map(F=>window.AppDB.get("attendance",F)))).filter(Boolean):[]}catch($){console.error("Failed to fetch admin data",$)}const d=t.filter($=>$.status==="in").length,l=t.filter($=>$.role==="Administrator"||$.isAdmin===!0).length,c=t.filter($=>Number($.birthMonth||0)>=1&&Number($.birthDay||0)>=1).length,p=[...t].filter($=>Number($.birthMonth||0)>=1).sort(($,L)=>{const T=`${String(Number($.birthMonth||99)).padStart(2,"0")}-${String(Number($.birthDay||99)).padStart(2,"0")}-${String($.name||"").toLowerCase()}`,E=`${String(Number(L.birthMonth||99)).padStart(2,"0")}-${String(Number(L.birthDay||99)).padStart(2,"0")}-${String(L.name||"").toLowerCase()}`;return T.localeCompare(E)}).slice(0,5),u=window.AppAuth?.getUser?.(),m=u?t.find($=>String($.id)===String(u.id))||u:null,h=Array.isArray(m?.notifications)?m.notifications:[],f=new Map(t.map($=>[String($.id),$])),w=(s||[]).filter($=>$&&$.missedCheckoutReasonRequired&&$.missedCheckoutReasonSubmittedAt&&String($.missedCheckoutReasonStatus||"").toLowerCase()==="pending").map($=>{const L=f.get(String($.user_id)),T=h.find(E=>E&&E.type==="missed-checkout-reason"&&String(E.logId||"")===String($.id||"")&&String(E.status||"pending").toLowerCase()==="pending");return{...$,staffName:L?.name||"Staff",staffRole:L?.role||"Employee",notificationId:T?.id||""}}).sort(($,L)=>new Date(L.missedCheckoutReasonSubmittedAt||L.systemClosedAt||L.date||0)-new Date($.missedCheckoutReasonSubmittedAt||$.systemClosedAt||$.date||0)),v=$=>{const L=$&&$.payload?$.payload:{},T=L.deleted||{},E=L.configuredTargets||{};if($.type==="legacy_dummy_cleanup_completed")return[`users=${Number(T.users||0)}`,`attendance=${Number(T.attendance||0)}`,`leaves=${Number(T.leaves||0)}`,`workPlans=${Number(T.workPlans||0)}`].join(", ");if($.type==="legacy_dummy_cleanup_skipped"){const P=L.reason||"unknown",B=Array.isArray(E.ids)?E.ids.length:0,R=Array.isArray(E.usernames)?E.usernames.length:0;return`reason=${P}, targetIds=${B}, targetUsernames=${R}`}return $.type==="legacy_dummy_cleanup_failed"?String(L.message||"Unknown error"):"-"},k=($=!1)=>{const L=$?"staff-reset-start-date-max":"staff-reset-start-date",T=$?"staff-reset-end-date-max":"staff-reset-end-date",E=`document.getElementById('${L}')?.value || ''`,P=`document.getElementById('${T}')?.value || ''`;return`
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
                    <input type="date" id="${L}">
                </label>
                <label>
                    <span>To Date</span>
                    <input type="date" id="${T}">
                </label>
                <button class="action-btn danger" onclick="(typeof window.app_resetStaffData === 'function') ? window.app_resetStaffData({ startDate: ${E}, endDate: ${P} }) : alert('Reset tools are not loaded yet. Please refresh this page.')">
                    <i class="fa-solid fa-triangle-exclamation"></i> Reset Staff Data
                </button>
            </div>
            <div class="admin-card-note">
                Choose a date range to delete only that period. Keep both dates empty to reset all staff activity data. User accounts are always kept.
            </div>
        `},b=($=!1)=>{const L=$?"audit-start-max":"audit-start",T=$?"audit-end-max":"audit-end",E=`document.getElementById('${L}')?.value || ''`,P=`document.getElementById('${T}')?.value || ''`;return`
            <div class="admin-audit-filter-row">
                <input type="date" id="${L}" value="${a}" style="font-size:0.75rem;">
                <input type="date" id="${T}" value="${e}" style="font-size:0.75rem;">
                <button onclick="window.app_applyAuditFilter(${E}, ${P})" class="action-btn">Filter</button>
            </div>
            <div class="table-container ${$?"admin-table-expanded":""}">
                <table>
                    <thead><tr><th>Staff</th><th>Slot</th><th>Time</th><th>Status</th></tr></thead>
                    <tbody>
                        ${o.length?o.map(B=>`
                            <tr>
                                <td>${D(B.userName)}</td>
                                <td>${D(B.slot)}</td>
                                <td>${new Date(B.timestamp).toLocaleTimeString()}</td>
                                <td style="color:${B.status==="Success"?"green":"red"}">${B.status}</td>
                            </tr>
                        `).join(""):'<tr><td colspan="4" class="text-center">No audits found</td></tr>'}
                    </tbody>
                </table>
            </div>
        `},M=($=!1)=>`
        <span class="text-muted" style="font-size:0.75rem;">Last ${r.length} entries</span>
        <div class="table-container ${$?"admin-table-expanded":""}">
            <table>
                <thead><tr><th>Time</th><th>Event</th><th>Summary</th></tr></thead>
                <tbody>
                    ${r.length?r.map(L=>`
                        <tr>
                            <td>${new Date(Number(L.createdAt||0)).toLocaleString()}</td>
                            <td>${D(L.type||"-")}</td>
                            <td>${D(v(L))}</td>
                        </tr>
                    `).join(""):'<tr><td colspan="3" class="text-center">No simulation cleanup audit entries found</td></tr>'}
                </tbody>
            </table>
        </div>
    `,A=($=!1)=>`
        <div class="admin-staff-head">
            <div class="admin-staff-head-actions">
                ${window.app_isAdminUser?.()||window.app_canManageBirthdays?.()?`<button class="action-btn secondary" onclick="window.location.hash='birthday-calendar'"><i class="fa-solid fa-cake-candles"></i> Birthday Calendar</button>`:""}
                ${window.app_hasPerm("users","admin")?`<button class="action-btn" onclick="document.getElementById('add-user-modal').style.display='flex'"><i class="fa-solid fa-user-plus"></i> Add Staff</button>`:""}
            </div>
        </div>
        <div class="table-container ${$?"admin-table-expanded":""} mobile-table-card">
            <table>
                <thead>
                    <tr><th>Staff Member</th><th>Status</th><th>In / Out</th><th>Role / Dept</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${t.map(L=>{const T=L.lastSeen&&Date.now()-L.lastSeen<12e4;return`
                        <tr>
                            <td>
                                <div class="admin-user-cell">
                                    <img src="${L.avatar}" class="admin-user-avatar">
                                    <div>
                                        <div class="admin-user-name-row">${D(L.name)} ${T?'<span class="admin-user-live-tag">LIVE</span>':""}</div>
                                        <div class="admin-user-id">${D(L.username)}</div>
                                    </div>
                                </div>
                            </td>
                            <td><span class="status-badge ${L.status==="in"?"in":"out"}">${L.status?.toUpperCase()}</span></td>
                            <td>${L.lastCheckIn?new Date(L.lastCheckIn).toLocaleTimeString():"--"} / ${L.lastCheckOut?new Date(L.lastCheckOut).toLocaleTimeString():"--"}</td>
                            <td>${D(L.role)} / ${D(L.dept||"--")}</td>
                            <td>
                                <div class="admin-row-actions">
                                    <button onclick="window.app_viewLogs('${L.id}')" class="admin-icon-btn"><i class="fa-solid fa-list-check"></i></button>
                                    ${window.app_hasPerm("users","admin")?`<button onclick="window.app_editUser('${L.id}')" class="admin-icon-btn"><i class="fa-solid fa-pen"></i></button>`:""}
                                </div>
                            </td>
                        </tr>`}).join("")}
                </tbody>
            </table>
        </div>
    `,g=($=!1)=>n.length===0?'<p class="text-muted">No pending requests.</p>':`
            <div class="table-container ${$?"admin-table-expanded":""}">
                <table class="compact-table">
                    <thead>
                        <tr><th>Date</th><th>Staff</th><th>Type</th><th>Days</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        ${n.map(L=>`
                            <tr>
                                <td>${new Date(L.startDate).toLocaleDateString()}</td>
                                <td>${D(L.userName)}</td>
                                <td><span class="admin-leave-type-badge">${D(L.type)}</span></td>
                                <td>${L.daysCount}</td>
                                <td>
                                    <div class="admin-leave-actions">
                                    ${window.app_hasPerm("leaves","admin")?`
                                        <button onclick="window.AppLeaves.updateLeaveStatus('${L.id}', 'Approved', window.AppAuth?.getUser?.()?.id).then(() => window.app_refreshAdminPage())" class="admin-btn admin-btn-success">Approve</button>
                                        <button onclick="window.AppLeaves.updateLeaveStatus('${L.id}', 'Rejected', window.AppAuth?.getUser?.()?.id).then(() => window.app_refreshAdminPage())" class="admin-btn admin-btn-danger">Reject</button>
                                    `:'<span class="text-muted" style="font-size:0.7rem;">View Only</span>'}
                                </div>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,S=($=!1)=>w.length===0?'<p class="text-muted">No missed checkout reasons waiting for review.</p>':`
            <div class="dashboard-tagged-list ${$?"admin-list-expanded":""}">
                ${w.map(L=>`
                    <div class="dashboard-tagged-item">
                        <div>
                            <div class="dashboard-tagged-title">${D(L.staffName)}</div>
                            <div class="dashboard-tagged-desc">${D(L.missedCheckoutReason||"Reason not submitted yet.")}</div>
                            <div class="dashboard-tagged-meta">
                                ${D(L.date||"--")} | ${D(L.staffRole||"Employee")}
                                ${L.missedCheckoutReasonSubmittedAt?` | Submitted ${D(new Date(L.missedCheckoutReasonSubmittedAt).toLocaleString())}`:""}
                            </div>
                        </div>
                        <div class="dashboard-tagged-status">
                            <span class="dashboard-tagged-pill pending">Pending</span>
                            ${L.notificationId?`
                                <div class="dashboard-tagged-actions">
                                    <button class="dashboard-tagged-btn accept" onclick='window.app_reviewMissedCheckoutReasonFromNotification(-1, ${JSON.stringify(String(L.notificationId))}, "approved")'>Approve</button>
                                    <button class="dashboard-tagged-btn reject" onclick='window.app_reviewMissedCheckoutReasonFromNotification(-1, ${JSON.stringify(String(L.notificationId))}, "rejected")'>Reject</button>
                                </div>
                            `:'<span class="text-muted" style="font-size:0.7rem;">Notification sync pending</span>'}
                        </div>
                    </div>
                `).join("")}
            </div>
        `,C=()=>`
        <p class="text-muted">${c} staff with reminder-ready birthdays</p>
        <div style="display:flex; flex-direction:column; gap:0.55rem; margin-bottom:0.65rem;">
            ${p.length?p.map($=>`
                    <div style="display:flex; justify-content:space-between; gap:0.75rem; border:1px solid #fdba74; border-radius:12px; padding:0.7rem 0.8rem; background:rgba(255,255,255,0.72);">
                        <div>
                            <div style="font-weight:700; color:#7c2d12;">${D($.name||"Staff")}</div>
                            <div style="font-size:0.8rem; color:#9a3412;">${D($.role||"Employee")} / ${D($.dept||"General")}</div>
                        </div>
                        <div style="text-align:right; color:#9a3412; font-weight:700;">${D(String($.birthDay||"--"))}/${D(String($.birthMonth||"--"))}${$.birthYear?`/${D(String($.birthYear))}`:""}</div>
                    </div>
                `).join(""):'<div style="color:#9a3412; font-size:0.85rem;">No birthdays saved yet.</div>'}
        </div>
        <button class="action-btn" onclick="window.location.hash='birthday-calendar'"><i class="fa-solid fa-cake-candles"></i> Open</button>
    `,I=[],y={},_=($,L)=>`
        <div class="admin-card-mode-controls" role="group" aria-label="${D(L)} view controls">
            <button type="button" class="admin-card-mode-btn admin-card-mode-btn-original" onclick="window.app_toggleAdminCardMode('${$}', 'original', this)" aria-label="Show original size ${D(L)}">
                <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
            </button>
            <button type="button" class="admin-card-mode-btn admin-card-mode-btn-fullscreen" onclick="window.app_toggleAdminCardMode('${$}', 'fullscreen', this)" aria-label="Show fullscreen ${D(L)}">
                <i class="fa-solid fa-expand"></i>
            </button>
        </div>
    `,x=({id:$,title:L,compactHtml:T,expandedHtml:E="",className:P="",accentClass:B=""})=>{if(!$||!L)return;const R=_($,L);y[$]={title:L,tileHtml:`${R}${T}`,originalHtml:`${R}${Ks(T)}`,expandedHtml:E||T},I.push(`
            <section class="card admin-card-compact admin-card-mode-tile ${P} ${B}" data-admin-card="${$}" data-admin-card-mode="tile" data-admin-original-full-width="0">
                <div class="admin-card-header-row">
                    <h3 class="admin-card-title">${D(L)}</h3>
                    ${_($,L)}
                </div>
                <div class="admin-card-content">
                    ${T}
                </div>
            </section>
        `)};return x({id:"staff-kpi",title:"Staff Snapshot",className:"admin-kpi-card",compactHtml:`
            <span class="admin-kpi-label">Total Registered Staff</span>
            <h2 class="admin-kpi-value">${t.length}</h2>
            <div class="admin-kpi-grid">
                <div class="admin-kpi-pill">
                    <div class="admin-kpi-pill-value">${d}</div>
                    <div class="admin-kpi-pill-label">Active</div>
                </div>
                <div class="admin-kpi-pill">
                    <div class="admin-kpi-pill-value">${l}</div>
                    <div class="admin-kpi-pill-label">Admins</div>
                </div>
            </div>
        `}),window.app_hasPerm("users","admin")&&x({id:"data-management",title:"Data Management",className:"admin-performance-card",accentClass:"admin-card-accent-blue",compactHtml:k(!1),expandedHtml:k(!0)}),window.app_hasPerm("leaves","view")&&x({id:"pending-leaves",title:`Pending Leave Requests (${n.length})`,className:"admin-section-card",compactHtml:g(!1),expandedHtml:g(!0)}),window.app_hasPerm("dashboard","admin")&&x({id:"missed-checkout",title:`Missed Checkout Requests (${w.length})`,className:"dashboard-tagged-card",compactHtml:S(!1),expandedHtml:S(!0)}),(window.app_isAdminUser?.()||window.app_canManageBirthdays?.())&&x({id:"birthday-calendar",title:"Birthday Calendar",className:"admin-performance-card",accentClass:"admin-card-accent-amber",compactHtml:C(),expandedHtml:C()}),window.app_hasPerm("users","view")&&x({id:"staff-management",title:"Staff Management",compactHtml:A(!1),expandedHtml:A(!0)}),x({id:"security-audits",title:"Security Audits",compactHtml:b(!1),expandedHtml:b(!0)}),x({id:"simulation-audit",title:"Simulation Cleanup Audit (Debug)",compactHtml:M(!1),expandedHtml:M(!0)}),window._adminCardTemplates=y,window._adminCardModeState={},window.app_applyAuditFilter=async($="",L="")=>{const T=String($||"").trim()||document.getElementById("audit-start")?.value||document.getElementById("audit-start-max")?.value,E=String(L||"").trim()||document.getElementById("audit-end")?.value||document.getElementById("audit-end-max")?.value,P=document.getElementById("page-content");window.app_closeAdminCardMaximize?.(),P&&(P.innerHTML=await ha(T,E))},window.app_refreshAdminPage=async()=>{const $=document.getElementById("audit-start")?.value||document.getElementById("audit-start-max")?.value||a,L=document.getElementById("audit-end")?.value||document.getElementById("audit-end-max")?.value||e,T=document.getElementById("page-content");window.app_closeAdminCardMaximize?.(),T&&(T.innerHTML=await ha($,L))},`
        <div class="dashboard-grid dashboard-modern dashboard-admin-view admin-grid-compact">
            ${I.join("")}
        </div>`}const _e=["January","February","March","April","May","June","July","August","September","October","November","December"],Vs=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],Gs=a=>String(a).padStart(2,"0"),Rn=()=>window.AppDB?.getIstNow?new Date(window.AppDB.getIstNow()):new Date,Js=()=>{const a=Rn(),e=window.app_birthdayCalendarState||{},t=Number(e.selectedMonth||a.getMonth()+1),n=Number(e.selectedYear||a.getFullYear()),s=e.view==="year"?"year":"month";return window.app_birthdayCalendarState={view:s,selectedMonth:t,selectedYear:n},window.app_birthdayCalendarState},On=a=>{const e=Number(a?.birthDay||0),t=Number(a?.birthMonth||0),n=Number(a?.birthYear||0),s=e?Gs(e):"--",i=t?_e[t-1]:"--";return`${s} ${i}${n?` ${n}`:""}`.trim()},qe=a=>{const e=Number(a?.birthMonth||99),t=Number(a?.birthDay||99),n=String(a?.name||"").toLowerCase();return`${String(e).padStart(2,"0")}-${String(t).padStart(2,"0")}-${n}`},Xs=a=>{const e=a?.role||"Employee",t=a?.dept||a?.department||"General";return`${a?.name||"Staff"} - ${e} / ${t}`},Fn=a=>a?.source==="external"?'<span class="birthday-source-pill external">External</span>':'<span class="birthday-source-pill staff">Staff</span>',Un=a=>a?.source==="external"?`${a?.position||"Position not set"} • ${a?.location||"Location not set"}`:`${a?.role||"Employee"} • ${a?.dept||"General"}`,Qs=a=>Number(a?.birthDay||0)>0?'<span class="birthday-status ok">Reminder eligible</span>':'<span class="birthday-status warn">Add day to enable reminder</span>',Hn=(a,e)=>e?`<button type="button" class="action-btn secondary" style="margin-top:0.55rem; padding:0.42rem 0.72rem;" onclick="window.app_openBirthdayEditor('${D(a?.source||"user")}', '${D(a?.id||"")}')">Edit</button>`:"",Zs=a=>{const e=new Map;for(let t=1;t<=12;t+=1)e.set(t,[]);a.forEach(t=>{const n=Number(t?.birthMonth||0);n>=1&&n<=12&&e.get(n).push(t)});for(let t=1;t<=12;t+=1)e.get(t).sort((n,s)=>qe(n).localeCompare(qe(s)));return e},ei=(a,e)=>{const n=new Date(e,a-1,1).getDay(),s=new Date(e,a,0).getDate(),i=[];for(let o=0;o<n;o+=1)i.push({type:"empty",key:`e-${a}-${o}`});for(let o=1;o<=s;o+=1)i.push({type:"day",day:o,key:`d-${a}-${o}`});for(;i.length%7!==0;)i.push({type:"empty",key:`tail-${a}-${i.length}`});return i},ti=(a,e)=>`
    <article class="birthday-agenda-card">
        <div class="birthday-agenda-head">
            <div>
                <div class="birthday-agenda-name">${D(a.name||"Staff")}</div>
                <div class="birthday-agenda-meta">${D(Un(a))}</div>
            </div>
            ${Fn(a)}
        </div>
        <div class="birthday-agenda-date">${D(On(a))}</div>
        <div class="birthday-agenda-foot">
            ${Qs(a)}
            ${Hn(a,e)}
        </div>
    </article>
`,ai=(a,e,t)=>{const n=e.slice(0,3).map(s=>`
        <div class="birthday-mini-chip">
            <span>${D(String(s.birthDay||"--"))}</span>
            <span>${D(s.name||"Staff")}</span>
        </div>
    `).join("");return`
        <button type="button" class="birthday-mini-month ${t===a?"is-selected":""}" onclick="window.app_goToBirthdayCalendarMonth(${a})">
            <div class="birthday-mini-month-head">
                <span>${D(_e[a-1])}</span>
                <strong>${e.length}</strong>
            </div>
            <div class="birthday-mini-month-body">
                ${n||'<div class="birthday-mini-empty">No birthdays saved</div>'}
            </div>
        </button>
    `};async function ni(){const a=window.AppAuth?.getUser?.(),e=window.app_canManageBirthdays?.(a),t=window.app_canAdminBirthdays?.(a),n=window.app_canSeeAdminPanel?.(a);if(!a||!e)return`
            <div class="card" style="max-width:720px; margin:1rem auto;">
                <h3 style="margin-top:0;">Birthday Calendar</h3>
                <p style="color:#64748b; margin-bottom:0;">You do not have permission to view the birthday calendar.</p>
            </div>
        `;const[s,i]=await Promise.all([window.AppDB.getAll("users").catch(()=>[]),window.AppDB.getAll("birthday_people",{silentPermissionDenied:!0}).catch(()=>[])]),o=[...s].sort((y,_)=>qe(y).localeCompare(qe(_))),r=[...o.map(y=>({...y,source:"user"})),...i.map(y=>({...y,source:"external"}))].sort((y,_)=>qe(y).localeCompare(qe(_))),d=r.filter(y=>Number(y?.birthMonth||0)>=1&&Number(y?.birthMonth||0)<=12),l=r.filter(y=>!(Number(y?.birthMonth||0)>=1&&Number(y?.birthMonth||0)<=12)),c=Zs(d),p=Js(),u=p.selectedMonth,m=p.selectedYear,h=Rn(),f=u===h.getMonth()+1&&m===h.getFullYear(),w=c.get(u)||[],v=o.map(y=>`
        <option value="${D(y.id)}">${D(Xs(y))}</option>
    `).join(""),k=ei(u,m),b=new Map;w.forEach(y=>{const _=Number(y?.birthDay||0);if(!_)return;const x=b.get(_)||[];x.push(y),b.set(_,x)});const M=k.map(y=>{if(y.type==="empty")return'<div class="birthday-day-cell empty"></div>';const _=b.get(y.day)||[],x=f&&y.day===h.getDate(),$=_.slice(0,2).map(L=>`
            <div class="birthday-day-chip ${L.source==="external"?"external":"staff"}">
                <span>${D(L.name||"Staff")}</span>
            </div>
        `).join("");return`
            <div class="birthday-day-cell ${_.length?"has-birthday":""} ${x?"is-today":""}">
                <div class="birthday-day-number">${y.day}</div>
                <div class="birthday-day-stack">
                    ${$||'<div class="birthday-day-placeholder">No birthdays</div>'}
                    ${_.length>2?`<div class="birthday-day-more">+${_.length-2} more</div>`:""}
                </div>
            </div>
        `}).join(""),A=_e.map((y,_)=>`
        <button type="button" class="birthday-month-tab ${u===_+1?"is-active":""}" onclick="window.app_goToBirthdayCalendarMonth(${_+1})">${D(y.slice(0,3))}</button>
    `).join(""),g=w.length?w.map(y=>ti(y,t)).join(""):'<div class="birthday-empty-panel">No birthdays have been assigned to this month yet.</div>',S=_e.map((y,_)=>ai(_+1,c.get(_+1)||[],u)).join(""),C=l.length?l.map(y=>`
            <article class="birthday-incomplete-row">
                <div>
                    <div class="birthday-incomplete-name-wrap">
                        <strong>${D(y.name||"Staff")}</strong>
                        ${Fn(y)}
                    </div>
                    <div class="birthday-incomplete-meta">${D(Un(y))}</div>
                </div>
                <div style="text-align:right;">
                    <div class="birthday-incomplete-date">${D(On(y))}</div>
                    <div class="birthday-status warn">Month missing or incomplete</div>
                    ${Hn(y,t)}
                </div>
            </article>
        `).join(""):'<div class="birthday-empty-panel">All saved birthday records already have a month assigned.</div>',I=t?`
        <section class="birthday-side-card birthday-actions-card">
            <div class="birthday-section-kicker">Manage This Month</div>
            <h3>${D(_e[u-1])} Actions</h3>
            <form id="birthday-month-form-${u}" onsubmit="window.app_submitBirthdayMonthForm(event, ${u})" class="birthday-add-form">
                <label>
                    <span>Add staff to ${D(_e[u-1])}</span>
                    <select name="userId" required>
                        <option value="">Select staff</option>
                        ${v}
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
                                <span class="birthday-period-title">${D(_e[u-1])} ${m}</span>
                                <span class="birthday-period-sub">${w.length} birthdays this month</span>
                            </div>
                            <button type="button" class="birthday-nav-btn" onclick="window.app_changeBirthdayCalendarMonth(1)">&rarr;</button>
                        </div>
                        <div class="birthday-view-switch">
                            <button type="button" class="${p.view==="month"?"is-active":""}" onclick="window.app_setBirthdayCalendarView('month')">Monthly View</button>
                            <button type="button" class="${p.view==="year"?"is-active":""}" onclick="window.app_setBirthdayCalendarView('year')">Yearly View</button>
                        </div>
                    </div>
                    <div class="birthday-month-tabs">${A}</div>
                </div>
                <div class="birthday-body">
                    ${p.view==="month"?`
                        <div class="birthday-month-layout">
                            <section class="birthday-panel">
                                <div class="birthday-panel-head">
                                    <div>
                                        <h3>${D(_e[u-1])} Calendar</h3>
                                        <div class="birthday-panel-sub">Default focus is the current month. Switch month whenever you need another view.</div>
                                    </div>
                                    <div class="birthday-status ok">${w.length} saved</div>
                                </div>
                                <div class="birthday-weekdays">${Vs.map(y=>`<span>${y}</span>`).join("")}</div>
                                <div class="birthday-calendar-grid">${M}</div>
                            </section>
                            <div class="birthday-side">
                                <section class="birthday-side-card">
                                    <div class="birthday-section-kicker">This Month</div>
                                    <h3>${D(_e[u-1])} Birthdays</h3>
                                    <div class="birthday-agenda">${g}</div>
                                </section>
                                ${I}
                            </div>
                        </div>
                    `:`
                        <section class="birthday-year-panel">
                            <div class="birthday-panel-head">
                                <div>
                                    <h3>Yearly Birthday View</h3>
                                    <div class="birthday-panel-sub">See all 12 months together, then open any month for detail.</div>
                                </div>
                                <div class="birthday-status ok">${d.length} annual records</div>
                            </div>
                            <div class="birthday-year-grid">${S}</div>
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
                    <div class="birthday-status warn">${l.length} incomplete</div>
                </div>
                ${C}
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
    `}async function si(){const a=await window.AppAnalytics.getSystemMonthlySummary(),e=new Date,t=window.AppAuth.getUser(),n=window.app_hasPerm("reports","admin",t);return`
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
                        ${a.map(i=>{const{user:o,stats:r}=i,d=Number(o.baseSalary||0),l=Number(r.unpaidLeaves||0),c=Number(r.late||0),p=Number(r.extraWorkedHours||0),u=window.AppConfig?.LATE_GRACE_COUNT||3,m=window.AppConfig?.LATE_DEDUCTION_PER_BLOCK||.5,h=window.AppConfig?.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4,f=Math.floor(c/u)*m,w=Math.floor(p/h)*m,v=Math.min(f,w),k=Math.max(0,f-v),b=l+k,M=Math.round(d/22*b),A=Math.round(Math.max(0,d-M)),g=o.employeeId||"",S=o.designation||o.role||"",C=o.dept||o.department||"",I=o.joinDate||"",y=o.bankName||"",_=o.bankAccount||o.accountNumber||"",x=o.pan||o.PAN||"",$=o.uan||o.UAN||"",L=Number(o.otherAllowances||0),T=Number(o.providentFund||0),E=Number(o.professionalTax||0),P=Number(o.loanAdvance||0);return`
                                <tr data-user-id="${o.id}">
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                                            <img src="${o.avatar}" style="width: 28px; height: 28px; border-radius: 50%;">
                                            <div style="font-weight: 600;">${D(o.name)}</div>
                                        </div>
                                    </td>
                                    <td><input type="number" class="base-salary-input" value="${d}" style="width: 80px;" onchange="window.app_recalculateRow(this.closest('tr'))"></td>
                                    <td><span class="present-count">${r.present}</span></td>
                                    <td><span class="late-count">${c}</span></td>
                                    <td><span class="unpaid-leaves-count">${l}</span></td>
                                    <td><span class="extra-work-hours">${p.toFixed(2)}</span></td>
                                    <td><span class="late-deduction-raw">${f.toFixed(1)}</span></td>
                                    <td><span class="penalty-offset-days">${v.toFixed(1)}</span></td>
                                    <td><span class="late-deduction-days">${k.toFixed(1)}</span></td>
                                    <td><span class="deduction-days">${b.toFixed(1)}</span></td>
                                    <td class="attendance-deduction-amount" style="color:#ef4444;">-Rs ${M.toLocaleString()}</td>
                                    <td class="deduction-amount" style="display:none;">-Rs ${M.toLocaleString()}</td>
                                    <td><input type="number" class="salary-input" value="${A}" style="width: 90px;"></td>
                                    <td><input type="number" class="tds-input" value="" placeholder="Global" style="width: 60px;" onchange="window.app_recalculateRow(this.closest('tr'))"></td>
                                    <td class="final-net-salary" data-value="${A}" style="font-weight:700; color:#1e40af;">Rs ${A.toLocaleString()}</td>
                                    <td class="tds-amount" data-value="0" style="display:none;">Rs 0</td>

                                    <td style="display:none;"><input class="employee-id-input" type="text" value="${D(g)}"></td>
                                    <td style="display:none;"><input class="designation-input" type="text" value="${D(S)}"></td>
                                    <td style="display:none;"><input class="department-input" type="text" value="${D(C)}"></td>
                                    <td style="display:none;"><input class="join-date-input" type="date" value="${D(I)}"></td>
                                    <td style="display:none;"><input class="bank-name-input" type="text" value="${D(y)}"></td>
                                    <td style="display:none;"><input class="bank-account-input" type="text" value="${D(_)}"></td>
                                    <td style="display:none;"><input class="pan-input" type="text" value="${D(x)}"></td>
                                    <td style="display:none;"><input class="uan-input" type="text" value="${D($)}"></td>
                                    <td style="display:none;"><input class="other-allowances-input" type="number" value="${L}"></td>
                                    <td style="display:none;"><input class="pf-input" type="number" value="${T}"></td>
                                    <td style="display:none;"><input class="professional-tax-input" type="number" value="${E}"></td>
                                    <td style="display:none;"><input class="loan-advance-input" type="number" value="${P}"></td>
                                    <td style="display:none;"><input class="comment-input" type="text" value=""></td>

                                    <td><button class="action-btn secondary" onclick="window.app_generateSalarySlip('${o.id}')">Slip</button></td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `}async function ii(){const a=new Date().toISOString().split("T")[0];return window.app_runPolicyTest=()=>{const e=document.getElementById("policy-test-checkin")?.value,t=document.getElementById("policy-test-checkout")?.value,n=document.getElementById("policy-test-output");if(!e||!t||!n)return;const s=document.getElementById("policy-test-date")?.value,i=new Date(`${s}T${e}`),r=(new Date(`${s}T${t}`)-i)/(1e3*60*60);let d="Absent";r>=8?d="Present":r>=4&&(d="Half Day"),n.innerHTML=`
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <div class="stat-card"><div class="label">Status</div><div class="value">${d}</div></div>
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
    `}async function qn(){const a=await window.AppMinutes.getMinutes(),e=window.AppDB?.getAll?await window.AppDB.getAll("users"):[],t=window.AppAuth.getUser(),n=window.AppCalendar?await window.AppCalendar.getPlans():{leaves:[],events:[],work:[]},s=new Date,i=`${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}`;window._minutesUiState?(window._minutesUiState.viewMode=window._minutesUiState.viewMode||"list",window._minutesUiState.searchQuery=window._minutesUiState.searchQuery||"",window._minutesUiState.monthKey=window._minutesUiState.monthKey||i):window._minutesUiState={viewMode:"list",searchQuery:"",monthKey:i};const o=window._minutesUiState,r=(y,_=t)=>!y||!_?!1:!!(window.app_hasPerm("minutes","view",_)||y.createdBy===_.id||(y.attendeeIds||[]).includes(_.id)||(y.allowedViewers||[]).includes(_.id)||(y.actionItems||[]).some(x=>x.assignedTo===_.id)),d=(y,_=t.id)=>{const x=(y.accessRequests||[]).find($=>$.userId===_);return x?x.status:""},l=(y="")=>{const $=new DOMParser().parseFromString(`<div>${y||""}</div>`,"text/html").body.firstElementChild;if(!$)return"";const L=new Set(["P","BR","B","STRONG","I","EM","U","H2","H3","UL","OL","LI","A"]),T={A:new Set(["href","target","rel"])},E=P=>{!P||!P.childNodes||Array.from(P.childNodes).forEach(B=>{if(B.nodeType===Node.ELEMENT_NODE){const R=B;if(!L.has(R.tagName)){for(;R.firstChild;)P.insertBefore(R.firstChild,R);P.removeChild(R);return}if(Array.from(R.attributes).forEach(F=>{const H=T[R.tagName];(!H||!H.has(F.name.toLowerCase()))&&R.removeAttribute(F.name)}),R.tagName==="A"){const F=(R.getAttribute("href")||"").trim();/^(https?:|mailto:|#)/i.test(F)?(R.setAttribute("target","_blank"),R.setAttribute("rel","noopener noreferrer")):R.removeAttribute("href")}}E(B)})};return E($),$.innerHTML.trim()},c=(y="")=>{const _=document.createElement("div");return _.innerHTML=y||"",(_.innerText||_.textContent||"").replace(/\r/g,"").trim()},p=(y="")=>D(y||"").replace(/\n/g,"<br>"),u=y=>{if(!y)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(y))return new Date(`${y}T00:00:00`);const _=new Date(y);return Number.isNaN(_.getTime())?null:_},m=(y,_={day:"numeric",month:"short",year:"numeric"})=>{const x=u(y);return x?x.toLocaleDateString(void 0,_):"Date not set"},h=y=>{const[_,x]=String(y||i).split("-").map(Number);return!_||!x?new Date(s.getFullYear(),s.getMonth(),1):new Date(_,x-1,1)},f=y=>{const _=(y.attendeeIds||[]).map(x=>e.find($=>$.id===x)?.name||e.find($=>$.id===x)?.username||"").join(" ");return[y.title,y.date,y.content,_].join(" ").toLowerCase()},w=(y,_="")=>{const x=document.getElementById(y),$=x?x.innerHTML:"",L=l($);let T=c(L);return!T&&_&&(T=(document.getElementById(_)?.value||"").trim()),{html:L,text:T}},v=(y="",_="")=>{const x=l(y||"");return x||D(_||"").replace(/\n/g,"<br>")};let k=new Set;window.app_toggleNewMinuteForm=()=>{const y=document.getElementById("new-minute-form");if(y&&(y.style.display=y.style.display==="none"?"block":"none",y.style.display==="block")){k=new Set,window.app_refreshAttendeeChips(),document.querySelectorAll('.attendee-grid input[type="checkbox"]').forEach($=>$.checked=!1);const _=document.getElementById("action-items-container");_&&(_.innerHTML="",window.app_addActionItemRow());const x=document.getElementById("new-minute-content-editor");x&&(x.innerHTML="")}},window.app_refreshMinutesView=async()=>{const y=document.getElementById("page-content");y&&(y.innerHTML=await qn(),window.setTimeout(()=>window.app_filterMinutes(o.searchQuery||""),0))},window.app_minutesExec=(y,_,x=null)=>{const $=document.getElementById(y);$&&($.focus(),document.execCommand(_,!1,x))},window.app_minutesFormatBlock=(y,_)=>{window.app_minutesExec(y,"formatBlock",_)},window.app_filterAttendees=y=>{const _=y.toLowerCase();document.querySelectorAll(".attendee-item-modern").forEach(x=>{const $=(x.dataset.name||"").toLowerCase();x.style.display=$.includes(_)?"flex":"none"})},window.app_filterMinutes=y=>{o.searchQuery=y||"";const _=o.searchQuery.toLowerCase().trim();let x=0;document.querySelectorAll(".minute-card-modern").forEach(T=>{const E=(T.dataset.searchText||"").toLowerCase(),P=!_||E.includes(_);T.style.display=P?"flex":"none",P&&(x+=1)}),document.querySelectorAll(".minutes-calendar-entry").forEach(T=>{const E=(T.dataset.searchText||"").toLowerCase(),P=!_||E.includes(_);T.style.display=P?"flex":"none"}),document.querySelectorAll(".minutes-calendar-day").forEach(T=>{const E=Array.from(T.querySelectorAll(".minutes-calendar-entry")),P=E.some(R=>R.style.display!=="none"),B=T.querySelector(".minutes-calendar-count");T.classList.toggle("has-visible-meeting",P),B&&(B.textContent=P?`${E.filter(R=>R.style.display!=="none").length} meeting${E.filter(R=>R.style.display!=="none").length===1?"":"s"}`:""),P&&(x+=1)});const $=document.getElementById("minutes-list-empty-state");$&&($.style.display=x===0?"block":"none");const L=document.getElementById("minutes-calendar-empty-state");L&&(L.style.display=x===0?"block":"none")},window.app_setMinutesView=y=>{o.viewMode=y==="calendar"?"calendar":"list",window.app_refreshMinutesView()},window.app_shiftMinutesMonth=y=>{const _=h(o.monthKey);_.setMonth(_.getMonth()+Number(y||0)),o.monthKey=`${_.getFullYear()}-${String(_.getMonth()+1).padStart(2,"0")}`,window.app_refreshMinutesView()},window.app_toggleAttendeePick=y=>{y.checked?k.add(y.value):k.delete(y.value),window.app_refreshAttendeeChips()},window.app_refreshAttendeeChips=()=>{const y=document.getElementById("minutes-attendee-chips");y&&(y.innerHTML=Array.from(k).map(_=>{const x=e.find($=>$.id===_);return`
                <div class="chip-modern">
                    <span>${D(x?.name||x?.username||"Unknown")}</span>
                    <i class="fa-solid fa-circle-xmark" onclick="window.app_removeAttendee('${_}')"></i>
                </div>
            `}).join(""))},window.app_removeAttendee=y=>{k.delete(y);const _=document.querySelector(`.attendee-item-modern input[value="${y}"]`);_&&(_.checked=!1),window.app_refreshAttendeeChips()},window.app_addActionItemRow=()=>{const y=document.getElementById("action-items-container");if(!y)return;const _=document.createElement("div");_.className="action-item-row-card",_.innerHTML=`
            <div class="field-group">
                <input type="text" placeholder="What needs to be done?" class="input-premium action-task">
            </div>
            <div class="field-group">
                <select class="input-premium action-assignee">
                    <option value="">Assignee...</option>
                    ${e.map(x=>`<option value="${x.id}">${D(x.name||x.username)}</option>`).join("")}
                </select>
            </div>
            <div class="field-group">
                <input type="date" class="input-premium action-due" value="${new Date().toISOString().split("T")[0]}">
            </div>
            <button type="button" onclick="this.parentElement.remove()" class="icon-btn-danger" style="background:#fee2e2; color:#ef4444; border:none; width:40px; height:40px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `,y.appendChild(_)},window.app_submitNewMinutes=async()=>{const y=document.getElementById("new-minute-title").value.trim(),_=document.getElementById("new-minute-date").value,x=w("new-minute-content-editor","new-minute-content"),$=x.text,L=Array.from(k),T=Array.from(document.querySelectorAll(".action-item-row-card")).map(E=>({task:E.querySelector(".action-task").value.trim(),assignedTo:E.querySelector(".action-assignee").value,dueDate:E.querySelector(".action-due").value,status:"pending"})).filter(E=>E.task);if(!y||!$)return alert("Title and content are required.");try{await window.AppMinutes.addMinute({title:y,date:_,content:$,contentHtml:x.html,attendeeIds:L,actionItems:T}),alert("Meeting minutes recorded!"),window.app_refreshMinutesView()}catch(E){alert("Error saving: "+E.message)}},window.app_requestMinuteAccess=async y=>{try{await window.AppMinutes.requestAccess(y),alert("Access requested!"),window.app_refreshMinutesView()}catch(_){alert("Error: "+_.message)}},window.app_handleMinuteApproval=async y=>{if(confirm("Are you sure you want to approve these minutes? This will lock the record if you are the last attendee to sign."))try{await window.AppMinutes.approveMinute(y),alert("Minutes approved!"),window.app_openMinuteDetails(y),window.app_refreshMinutesView()}catch(_){alert("Error: "+_.message)}},window.app_handleActionItemStatus=async(y,_,x)=>{try{await window.AppMinutes.updateActionItemStatus(y,_,x),alert(`Task marked as ${x}!`),window.app_openMinuteDetails(y)}catch($){alert("Error: "+$.message)}},window.app_handleAccessDecision=async(y,_,x)=>{try{await window.AppMinutes.handleAccessRequest(y,_,x),alert(`Request ${x}!`),window.app_openMinuteDetails(y)}catch($){alert("Error: "+$.message)}},window.app_saveMinuteEdits=async y=>{try{const x=(await window.AppMinutes.getMinutes()).find(W=>W.id===y);if(!x)return alert("Minute not found.");const $=window.AppAuth.getUser(),L=x.createdBy===$.id,T=window.app_hasPerm("minutes","admin",$);if(!L&&!T)return alert("Only owner or admin can edit these minutes.");if(x.locked)return alert("This record is locked after final approvals.");const E=document.getElementById("minute-edit-title"),P=document.getElementById("minute-edit-date"),B=w("minute-edit-content-editor","minute-edit-content"),R=(E?.value||"").trim(),F=(P?.value||"").trim(),H=B.text;if(!R||!H)return alert("Title and content are required.");await window.AppMinutes.updateMinute(y,{title:R,date:F||x.date,content:H,contentHtml:B.html},"Edited meeting details"),alert("Minutes updated successfully."),window.app_openMinuteDetails(y),window.app_refreshMinutesView()}catch(_){alert("Error updating minutes: "+_.message)}},window.app_openMinuteDetails=async y=>{const x=(await window.AppMinutes.getMinutes()).find(j=>j.id===y);if(!x)return;if(!r(x))return alert("Access Restricted. Please request access from the list view.");const $=(x.attendeeIds||[]).includes(t.id),L=x.approvals&&x.approvals[t.id],T=x.createdBy===t.id,E=window.app_hasPerm("minutes","admin",t),P=(T||E)&&!x.locked,B=x.createdByName||e.find(j=>j.id===x.createdBy)?.name||"Unknown",R=x.lastEditedByName||B,F=x.lastEditedAt||x.createdAt,H=l(x.contentHtml||p(x.content||"")),W=(x.attendeeIds||[]).map(j=>{const Z=e.find(ae=>ae.id===j),ee=x.approvals&&x.approvals[j];return`
                <div class="approval-chip ${ee?"approved":"pending"}">
                    <i class="fa-solid fa-${ee?"check-circle":"clock"}"></i>
                    ${D(Z?.name||"Unknown")}
                </div>
            `}).join(""),K=(x.actionItems||[]).map((j,Z)=>{const ee=e.find(me=>me.id===j.assignedTo),ae=j.assignedTo===t.id;return`
                <div class="detail-action-item">
                    <div class="action-status-dot ${j.status||"pending"}"></div>
                    <div class="action-main">
                        <strong>${D(j.task)}</strong>
                        <span class="action-meta">Assigned: ${D(ee?.name||"Unassigned")} | Due: ${j.dueDate||"N/A"}</span>
                    </div>
                    ${ae&&j.status!=="completed"?`
                        <div class="action-btns">
                            ${j.status==="pending"?`<button class="mini-btn" onclick="window.app_handleActionItemStatus('${x.id}', ${Z}, 'accepted')">Accept</button>`:""}
                            <button class="mini-btn success" onclick="window.app_handleActionItemStatus('${x.id}', ${Z}, 'completed')">Complete</button>
                        </div>
                    `:""}
                </div>
            `}).join(""),O=(x.accessRequests||[]).filter(j=>j.status==="pending").map(j=>`
            <div class="access-request-row">
                <span>${D(j.userName)}</span>
                <div class="req-btns">
                    <button class="mini-btn success" onclick="window.app_handleAccessDecision('${x.id}', '${j.userId}', 'approved')">Approve</button>
                    <button class="mini-btn danger" onclick="window.app_handleAccessDecision('${x.id}', '${j.userId}', 'rejected')">Deny</button>
                </div>
            </div>
        `).join(""),U=(x.auditLog||[]).slice().reverse().map(j=>`
            <div class="access-request-row" style="justify-content:space-between; align-items:flex-start;">
                <div style="display:flex; flex-direction:column; gap:0.2rem;">
                    <strong style="font-size:0.82rem;">${D(j.userName||"Unknown")}</strong>
                    <span style="font-size:0.75rem; color:#64748b;">${D(j.action||"Updated")}</span>
                </div>
                <span style="font-size:0.74rem; color:#64748b; white-space:nowrap;">${j.timestamp?new Date(j.timestamp).toLocaleString():"-"}</span>
            </div>
        `).join(""),X=`
            <div class="modal-overlay" id="minute-detail-modal" style="display:flex;">
                <div class="modal-content minutes-detail-wide">
                    <div class="modal-header">
                        <div>
                            <span class="detail-date">${new Date(x.date).toLocaleDateString()}</span>
                            <h2 style="margin:0; color:#1e1b4b;">${D(x.title)}</h2>
                            <div style="font-size:0.78rem; color:#64748b; margin-top:0.35rem;">
                                Created by ${D(B)} on ${x.createdAt?new Date(x.createdAt).toLocaleString():"-"}
                            </div>
                            <div style="font-size:0.78rem; color:#64748b;">
                                Last edited by ${D(R)} on ${F?new Date(F).toLocaleString():"-"}
                            </div>
                        </div>
                        <button onclick="document.getElementById('minute-detail-modal').remove()" class="close-modal-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-grid">
                            <div class="main-column">
                                <section>
                                    <label><i class="fa-solid fa-file-lines"></i> Discussion & Decisions</label>
                                    ${P?`
                                        <div style="display:grid; gap:0.6rem; margin-top:0.55rem;">
                                            <input id="minute-edit-title" class="input-premium" value="${Re(x.title||"")}" />
                                            <input id="minute-edit-date" class="input-premium" type="date" value="${Re(x.date||"")}" />
                                            <textarea id="minute-edit-content" class="textarea-premium" style="display:none;">${D(x.content||"")}</textarea>
                                            <div class="rich-editor-shell">
                                                <div class="rich-editor-toolbar">
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','bold')"><i class="fa-solid fa-bold"></i></button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','italic')"><i class="fa-solid fa-italic"></i></button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesFormatBlock('minute-edit-content-editor','H2')">H2</button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesFormatBlock('minute-edit-content-editor','H3')">H3</button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','insertUnorderedList')"><i class="fa-solid fa-list-ul"></i></button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','insertOrderedList')"><i class="fa-solid fa-list-ol"></i></button>
                                                </div>
                                                <div id="minute-edit-content-editor" class="rich-editor-area" contenteditable="true">${H}</div>
                                            </div>
                                        </div>
                                    `:`<div class="content-text rich-minutes-content">${v(x.contentHtml,x.content)}</div>`}
                                </section>
                                ${K?`
                                <section>
                                    <label><i class="fa-solid fa-list-check"></i> Action Items</label>
                                    <div class="action-items-list">${K}</div>
                                </section>
                                `:""}
                                <section>
                                    <label><i class="fa-solid fa-clock-rotate-left"></i> Edit History</label>
                                    <div class="access-requests-list" style="max-height:230px;">${U||'<p class="empty">No edit history yet.</p>'}</div>
                                </section>
                            </div>
                            <div class="side-column">
                                <section>
                                    <label><i class="fa-solid fa-users-check"></i> Approvals</label>
                                    <div class="approvals-stack">${W||'<p class="empty">No attendees defined</p>'}</div>
                                    ${$&&!L&&!x.locked?`<button class="action-btn wide" onclick="window.app_handleMinuteApproval('${x.id}')" style="margin-top:1rem;">Approve Minutes</button>`:""}
                                </section>
                                ${(T||E)&&O?`
                                <section class="owner-only">
                                    <label><i class="fa-solid fa-key"></i> Access Requests</label>
                                    <div class="access-requests-list">${O}</div>
                                </section>
                                `:""}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${x.locked?'<span class="status-locked-msg"><i class="fa-solid fa-lock"></i> Record Locked (All approved)</span>':""}
                        <div style="flex:1"></div>
                        <button class="action-btn secondary" onclick="document.getElementById('minute-detail-modal').remove()">Close</button>
                        ${P?`<button class="action-btn" onclick="window.app_saveMinuteEdits('${x.id}')">Save Changes</button>`:""}
                        ${T||E?`<button class="action-btn danger" onclick="window.app_deleteMinute('${x.id}')">Delete</button>`:""}
                    </div>
                </div>
            </div>
        `;if(!document.getElementById("modal-container")){const j=document.createElement("div");j.id="modal-container",document.body.appendChild(j)}document.getElementById("modal-container").innerHTML=X},window.app_deleteMinute=async y=>{if(confirm("Are you sure?"))try{await window.AppMinutes.deleteMinute(y),document.getElementById("minute-detail-modal")?.remove(),window.app_refreshMinutesView()}catch(_){alert("Error: "+_.message)}};const b=[...a].sort((y,_)=>{const x=u(y.date)?.getTime()||0;return(u(_.date)?.getTime()||0)-x}),M=h(o.monthKey),A=M.toLocaleDateString(void 0,{month:"long",year:"numeric"}),g=new Date(M.getFullYear(),M.getMonth(),1),S=new Date(g);S.setDate(g.getDate()-g.getDay());const C=Array.from({length:42},(y,_)=>{const x=new Date(S);return x.setDate(S.getDate()+_),x}),I=b.reduce((y,_)=>{const x=u(_.date);if(!x)return y;const $=`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;return y[$]||(y[$]=[]),y[$].push(_),y},{});return window.setTimeout(()=>window.app_filterMinutes(o.searchQuery||""),0),`
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
                            ${e.map(y=>`
                                <label class="attendee-item-modern" data-name="${Re(y.name||y.username)}">
                                    <input type="checkbox" value="${y.id}" onchange="window.app_toggleAttendeePick(this)">
                                    <span>${D(y.name||y.username)}</span>
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
                        ${Da(n)}
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
                    <input type="text" placeholder="Search meetings..." value="${Re(o.searchQuery||"")}" oninput="window.app_filterMinutes(this.value)" class="input-premium" style="padding-left: 2.75rem; width: 100%; padding-top: 0.6rem; padding-bottom: 0.6rem; font-size: 0.9rem;">
                </div>
            </div>

            ${o.viewMode==="calendar"?`
                <div class="minutes-calendar-shell">
                    <div class="minutes-calendar-toolbar">
                        <div>
                            <div class="minutes-calendar-month">${A}</div>
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
                        ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(y=>`<div class="minutes-calendar-weekday">${y}</div>`).join("")}
                        ${C.map(y=>{const _=`${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,"0")}-${String(y.getDate()).padStart(2,"0")}`,x=I[_]||[],$=y.getMonth()===M.getMonth(),L=y.toDateString()===s.toDateString();return`
                                <div class="minutes-calendar-day ${$?"":"is-outside-month"} ${L?"is-today":""} ${x.length?"has-visible-meeting":""}">
                                    <div class="minutes-calendar-dayhead">
                                        <span class="minutes-calendar-date">${y.getDate()}</span>
                                        <span class="minutes-calendar-count">${x.length?`${x.length} meeting${x.length===1?"":"s"}`:""}</span>
                                    </div>
                                    <div class="minutes-calendar-items">
                                        ${x.map(T=>{const E=r(T),P=d(T);return`
                                                <div class="minutes-calendar-entry ${E?"clickable":""}" data-search-text="${Re(f(T))}" ${E?`onclick="window.app_openMinuteDetails('${T.id}')"`:""}>
                                                    <div class="minutes-calendar-entry-title">${D(T.title)}</div>
                                                    <div class="minutes-calendar-entry-meta">
                                                        <span>${T.attendeeIds?.length||0} attendees</span>
                                                        <span>${T.locked?"Locked":"Open"}</span>
                                                    </div>
                                                    ${E?"":`
                                                        <button class="minutes-calendar-restricted" onclick="event.stopPropagation(); window.app_requestMinuteAccess('${T.id}')">
                                                            ${P==="pending"?"Access Pending":P==="rejected"?"Access Denied":"Request Access"}
                                                        </button>
                                                    `}
                                                </div>
                                            `}).join("")}
                                    </div>
                                </div>
                            `}).join("")}
                    </div>
                    <div id="minutes-calendar-empty-state" class="minutes-no-results">No meetings match this search in ${A}.</div>
                </div>
            `:`
            <div class="minutes-list-container">
                ${b.length?b.map(y=>{const _=r(y),x=d(y);return`
                        <div class="minute-card-modern ${_?"clickable":""}" data-search-text="${Re(f(y))}" ${_?`onclick="window.app_openMinuteDetails('${y.id}')"`:""}>
                            <div class="card-date-badge">${m(y.date)}</div>
                            
                            <div class="minute-card-status">
                                ${y.locked?'<span style="background:#dcfce7; color:#166534; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:700;"><i class="fa-solid fa-lock" style="margin-right:0.35rem;"></i>Locked</span>':'<span style="background:#fff7ed; color:#9a3412; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:700;">Open</span>'}
                            </div>

                            <h4 class="card-title-modern">${D(y.title)}</h4>
                            
                            <div class="card-metrics">
                                <div class="metric-item">
                                    <i class="fa-solid fa-users"></i>
                                    ${y.attendeeIds?.length||0} Attendees
                                </div>
                                <div class="metric-item">
                                    <i class="fa-solid fa-check-circle"></i>
                                    ${y.actionItems?.length||0} Tasks
                                </div>
                            </div>

                            ${_?"":`
                                <div class="restricted-tag">
                                    <i class="fa-solid fa-shield-halved" style="margin-right: 0.5rem;"></i>
                                    Access Restricted
                                    ${x==="pending"?'<div style="margin-top:0.5rem; font-size:0.7rem; color:#f59e0b;">Request Pending Review</div>':x==="rejected"?'<div style="margin-top:0.5rem; font-size:0.7rem; color:#ef4444;">Access Denied</div>':`<button class="mini-btn" style="margin-top:0.75rem; width:100%; border-color:#991b1b; color:#991b1b;" onclick="window.app_requestMinuteAccess('${y.id}')">Request View Access</button>`}
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
    `}function oi(a=[]){let e="";a&&a.length>0&&(e=`
            <div style="margin-bottom:1.5rem; padding-bottom:1.5rem; border-bottom:1px dashed #cbd5e1;">
                 <label style="display:block; font-size:0.85rem; font-weight:700; color:#334155; margin-bottom:0.75rem;">📋 Your Planned Tasks</label>
                 <div style="max-height:150px; overflow-y:auto; padding-right:4px;">
                    ${a.map(i=>`<div style="padding:8px 12px; background:#f0f9ff; border-left:3px solid #0284c7; border-radius:6px; font-size:0.9rem; color:#0c4a6e; margin-bottom:8px;">
                <span style="font-weight:600;">•</span> ${D(i.task)}
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
    </div>`}function ri(){if(typeof window>"u")return;const a=new MutationObserver(t=>{t.forEach(()=>{const n=document.getElementById("checkout-modal"),s=document.getElementById("checkout-intro-panel");n&&s&&n.style.display!=="none"&&(localStorage.getItem("checkoutIntroSeen")||(s.style.display="block"))})}),e=()=>{const t=document.body;t&&a.observe(t,{attributes:!0,subtree:!0,attributeFilter:["style"]})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e):e()}typeof window<"u"&&ri();function di(){return`
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
     `}function li(){return window.AppAuth?.getUser()?`
        <!-- Check-Out Modal -->
        <div id="checkout-modal" class="modal-overlay" style="display: none;">
            <div class="modal-content" style="width: 100%; max-width: 450px;">
                <h3 style="margin-bottom: 1rem;">Check Out</h3>
                <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem;">Please summarize your work for today before checking out.</p>
                <form onsubmit="window.app_submitCheckOut(event)">
                    <textarea name="description" required placeholder="- Completed monthly report&#10;- Fixed login bug..." style="width: 100%; height: 120px; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; resize: none; font-family: inherit; margin-bottom: 1.5rem;"></textarea>
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
                        </select>
                    </label>
                    <label>Reason
                        <textarea name="reason" rows="3" required style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.5rem;"></textarea>
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
    `:""}const Ct=50,ci=250;function zn(){const a=new Date,e=new Date(a),n=(e.getDay()+6)%7;return e.setDate(e.getDate()-n),e.setHours(0,0,0,0),{startIso:e.toISOString().split("T")[0],endIso:a.toISOString().split("T")[0]}}function ye(){if(!window.app_teamActivitiesState){const a=zn();window.app_teamActivitiesState={startIso:a.startIso,endIso:a.endIso,weeksLoaded:1,staffIds:[],status:"all",type:"all",search:"",sortKey:"date-desc",page:1,pageSize:Ct,columnFilters:{date:"",staff:"",description:"",time:"",type:"",status:""},selectedKeys:[],columnVisibility:{type:!0,status:!0,sourceTime:!0},users:[],data:[],filtered:[],lastRefreshed:null}}return window.app_teamActivitiesState}function pi(a){const e=(t={})=>{const n=String(t.checkOut||t._sortTime||"").trim();if(!n||n.toLowerCase()==="active now"||n==="00:00"||n==="09:00")return"";const i=n.match(/^(\d{1,2}):(\d{2})/);return i?`${String(Number(i[1])).padStart(2,"0")}:${i[2]}`:n};return(a||[]).map(t=>{const n=t.type||(t.workDescription?"attendance":"work"),s=t._displayDesc||t.workDescription||t.task||"Activity",i=e(t),o=t.status||(n==="attendance"?"completed":""),r=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(t.date,o):o||"to-be-started";return{date:t.date||"",staffName:t.staffName||t.userName||"Unknown Staff",type:n,description:s,status:r,sourceTime:i,userId:t.userId||t.user_id||"",planId:t.planId||t.id||"",taskIndex:Number.isInteger(t.taskIndex)?t.taskIndex:null,planScope:t.planScope||"personal",progressPercent:Number.isFinite(Number(t.progressPercent))?Number(t.progressPercent):null,progressStatus:t.progressStatus||"",progressNote:t.progressNote||""}})}function Qa(a){const e=String(a||"").toLowerCase();return["overdue","not-completed","to-be-started","in-process"].includes(e)}function ui(a){const e=new Date(a);return Number.isNaN(e.getTime())?new Date().toISOString().split("T")[0]:(e.setDate(e.getDate()+1),e.toISOString().split("T")[0])}function mi(a){const e=String(a||"").trim();if(!e||!/^\d{4}-\d{2}-\d{2}$/.test(e))return!1;const t=new Date(e);return!Number.isNaN(t.getTime())&&t.toISOString().startsWith(e)}function fi(a,e){return new Promise(t=>{if(!a){t(null);return}const n=document.getElementById("team-activities-postpone-popover");n&&n.remove();const s=document.createElement("div");s.id="team-activities-postpone-popover",s.className="team-activities-postpone-popover",s.innerHTML=`
            <div class="team-activities-postpone-head">Postpone to</div>
            <input type="date" class="team-activities-postpone-input" value="${e}">
            <div class="team-activities-postpone-actions">
                <button type="button" class="team-activities-row-btn warn" data-postpone-cancel>Cancel</button>
                <button type="button" class="team-activities-row-btn success" data-postpone-confirm>Confirm</button>
            </div>
        `,document.body.appendChild(s);const i=a.getBoundingClientRect(),o=i.bottom+window.scrollY+8,r=Math.min(i.left+window.scrollX,window.innerWidth-260);s.style.top=`${o}px`,s.style.left=`${r}px`;const d=s.querySelector(".team-activities-postpone-input");d&&d.focus();const l=p=>{document.removeEventListener("click",c,!0),s.remove(),t(p)},c=p=>{!s.contains(p.target)&&p.target!==a&&l(null)};document.addEventListener("click",c,!0),s.addEventListener("click",p=>{const u=p.target;if(u.closest("[data-postpone-cancel]")&&l(null),u.closest("[data-postpone-confirm]")){const m=d?d.value:"";l(m||null)}})})}function hi(a){const e=a.search.trim().toLowerCase(),t=new Set(a.staffIds||[]),n=a.status,s=a.type,i=a.columnFilters||{},o=String(i.date||"").trim(),r=String(i.staff||"").trim().toLowerCase(),d=String(i.description||"").trim().toLowerCase(),l=String(i.time||"").trim().toLowerCase(),c=String(i.type||"").trim().toLowerCase(),p=String(i.status||"").trim().toLowerCase();let u=a.data.filter(m=>!(t.size&&!t.has(m.userId)||s!=="all"&&m.type!==s||n!=="all"&&String(m.status||"").toLowerCase()!==n||e&&!`${m.date} ${m.staffName} ${m.description} ${m.status} ${m.type}`.toLowerCase().includes(e)||o&&String(m.date||"")!==o||r&&!String(m.staffName||"").toLowerCase().includes(r)||d&&!String(m.description||"").toLowerCase().includes(d)||l&&!String(m.sourceTime||"").toLowerCase().includes(l)||c&&!String(m.type||"").toLowerCase().includes(c)||p&&!String(m.status||"").toLowerCase().includes(p)));return u=yi(u,a.sortKey),a.filtered=u,u}function yi(a,e){const t=[...a];return t.sort((n,s)=>{const i=new Date(s.date)-new Date(n.date),o=String(s.sourceTime||"").localeCompare(String(n.sourceTime||"")),r=String(n.staffName||"").localeCompare(String(s.staffName||"")),d=l=>l.type==="work"&&l.planId&&Number.isInteger(l.taskIndex);return e==="date-desc"?i||o:e==="date-asc"?new Date(n.date)-new Date(s.date)||o:e==="staff-asc"?r||i:e==="staff-desc"?-r||i:e==="status"?String(n.status||"").localeCompare(String(s.status||""))||i:e==="status-desc"?String(s.status||"").localeCompare(String(n.status||""))||i:e==="type"?String(n.type||"").localeCompare(String(s.type||""))||i:e==="type-desc"?String(s.type||"").localeCompare(String(n.type||""))||i:e==="description"?String(n.description||"").localeCompare(String(s.description||""))||i:e==="description-desc"?String(s.description||"").localeCompare(String(n.description||""))||i:e==="time"?String(n.sourceTime||"").localeCompare(String(s.sourceTime||""))||i:e==="time-desc"?String(s.sourceTime||"").localeCompare(String(n.sourceTime||""))||i:e==="actions"?Number(d(s))-Number(d(n))||i:e==="actions-desc"?Number(d(n))-Number(d(s))||i:i||o}),t}function wi(a,e,t){const s=(Math.max(1,e)-1)*t;return a.slice(s,s+t)}function jn(a){const e=a.filtered.length,t=new Set(a.filtered.map(i=>i.userId).filter(Boolean)),n=a.filtered.filter(i=>String(i.status).toLowerCase()==="completed").length,s=e-n;return`
        <div class="team-activities-chip">Total: <strong>${e}</strong></div>
        <div class="team-activities-chip">Staff: <strong>${t.size}</strong></div>
        <div class="team-activities-chip">Completed: <strong>${n}</strong></div>
        <div class="team-activities-chip">Incomplete: <strong>${s}</strong></div>
    `}function gi(a){const e=a.users||[],t=new Set(a.staffIds||[]),n=t.size?`${t.size} selected`:"All staff",s=e.map(i=>`
        <label class="team-activities-checkbox">
            <input type="checkbox" data-staff-id="${i.id}" ${t.has(i.id)?"checked":""}>
            <span>${D(i.name||"Staff")}</span>
        </label>
    `).join("");return`
        <div class="team-activities-dropdown">
            <button class="team-activities-dropdown-btn" type="button" data-team-activities-staff-toggle>
                <i class="fa-solid fa-users"></i>
                <span>Staff: ${D(n)}</span>
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
    `}function bi(a){const e=a.columnVisibility;return`
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
    `}function Be(a,e,t,n){const s=n.sortKey===e?"▼":n.sortKey===t?"▲":"⇅";return`${D(a)} <span class="team-activities-sort">${s}</span>`}function vi(a){const e=a.columnVisibility,t=wi(a.filtered,a.page,a.pageSize);if(!t.length)return'<div class="team-activities-empty">No activities found for the selected filters.</div>';const n=new Set(a.selectedKeys||[]),s=window.AppAuth?.getUser?window.AppAuth.getUser()?.id:null,i=window.AppAuth?.getUser?window.AppAuth.getUser():null,o=!!(i&&(i.role==="Administrator"||i.isAdmin)),r=`
        <th data-sort="date-desc" data-sort-alt="date-asc">${Be("Date","date-desc","date-asc",a)}</th>
        <th data-sort="staff-asc" data-sort-alt="staff-desc">${Be("Staff","staff-asc","staff-desc",a)}</th>
        ${e.type?`<th data-sort="type" data-sort-alt="type-desc">${Be("Type","type","type-desc",a)}</th>`:""}
        ${e.status?`<th data-sort="status" data-sort-alt="status-desc">${Be("Status","status","status-desc",a)}</th>`:""}
        <th data-sort="description" data-sort-alt="description-desc">${Be("Description","description","description-desc",a)}</th>
        ${e.sourceTime?`<th data-sort="time" data-sort-alt="time-desc">${Be("Time","time","time-desc",a)}</th>`:""}
        <th data-sort="actions" data-sort-alt="actions-desc">${Be("Actions","actions","actions-desc",a)}</th>
    `,d=[],l=t.map(m=>{const h=String(m.status||"").toLowerCase().replace(/\s+/g,"-"),f=s&&m.userId&&s===m.userId,w=m.type==="work"&&m.planId&&Number.isInteger(m.taskIndex)&&(f||o),v=m.type==="work"&&Qa(m.status)&&m.planId&&Number.isInteger(m.taskIndex)&&(f||o),k=`${m.planId||""}__${Number.isInteger(m.taskIndex)?m.taskIndex:""}`;w&&d.push(k);const b=m.type==="work"&&(m.progressPercent!==null||m.progressStatus||m.progressNote),M=m.progressStatus?String(m.progressStatus).replace(/_/g," "):"",A=m.progressPercent!==null?`${m.progressPercent}%`:"",g=String(m.progressNote||"").trim(),S=g?` title="${D(g)}"`:"",C=b?`<div class="team-activities-progress"${S}>${D(A)}${A&&M?" &bull; ":""}${D(M)}</div>`:"";return`
        <tr>
            ${o?`
            <td class="team-activities-select-col">
                ${w?`<input type="checkbox" class="team-activities-row-select" data-row-key="${D(k)}" ${n.has(k)?"checked":""}>`:""}
            </td>
        `:'<td class="team-activities-select-col"></td>'}
            <td>${D(m.date)}</td>
            <td>${D(m.staffName)}</td>
            ${e.type?`<td class="team-activities-type">${D(m.type)}</td>`:""}
            ${e.status?`<td><span class="team-activities-status status-${D(h)}">${D(m.status)}</span></td>`:""}
            <td class="team-activities-desc">${D(m.description)}${C}</td>
            ${e.sourceTime?`<td>${D(m.sourceTime||"--")}</td>`:""}
            <td>
                <div class="team-activities-row-actions">
                    <button class="team-activities-row-btn" data-view-date="${D(m.date)}" data-view-user="${D(m.userId)}">
                        <i class="fa-solid fa-eye"></i> View
                    </button>
                    ${m.type==="work"&&f&&Qa(m.status)&&m.planId&&Number.isInteger(m.taskIndex)?`
                        <button class="team-activities-row-btn warn" data-action="postpone" data-plan-id="${D(m.planId)}" data-task-index="${m.taskIndex}" data-plan-scope="${D(m.planScope)}" data-user-id="${D(m.userId)}" data-date="${D(m.date)}">
                            <i class="fa-solid fa-clock"></i> Postpone
                        </button>
                    `:""}
                    ${v?`
                        <button class="team-activities-row-btn success" data-action="complete" data-plan-id="${D(m.planId)}" data-task-index="${m.taskIndex}" data-user-id="${D(m.userId)}" onclick="window.app_teamActivitiesCompleteTask(this)">
                            <i class="fa-solid fa-check"></i> Complete
                        </button>
                    `:""}
                    ${w?`
                        <button class="team-activities-row-btn danger" data-action="remove" data-plan-id="${D(m.planId)}" data-task-index="${m.taskIndex}" data-user-id="${D(m.userId)}">
                            <i class="fa-solid fa-trash"></i> Remove
                        </button>
                    `:""}
                </div>
            </td>
        </tr>
    `}).join(""),c=d.length>0&&d.every(m=>n.has(m)),p=o?`
        <div class="team-activities-bulk-bar">
            <div><strong>${n.size}</strong> selected</div>
            <div class="team-activities-bulk-actions">
                <button type="button" class="team-activities-row-btn secondary" data-bulk-clear ${n.size?"":"disabled"}>Clear</button>
                <button type="button" class="team-activities-row-btn danger" data-bulk-remove ${n.size?"":"disabled"}>Bulk Remove</button>
            </div>
        </div>
    `:"",u=o?`<th class="team-activities-select-col"><input type="checkbox" data-select-visible ${d.length?"":"disabled"} ${c?"checked":""}></th>`:'<th class="team-activities-select-col"></th>';return`
        ${p}
        <table class="team-activities-table">
            <thead><tr>${u}${r}</tr></thead>
            <tbody>${l}</tbody>
        </table>
    `}function Si(a,e){if(!a)return;const t=a.closest("tr"),n=t?t.querySelector(".team-activities-row-actions"):null;if(!n)return;let s=n.querySelector(".team-activities-inline-toast");s||(s=document.createElement("span"),s.className="team-activities-inline-toast",n.appendChild(s)),s.textContent=e,s.classList.add("show"),clearTimeout(s._hideTimer),s._hideTimer=setTimeout(()=>{s.classList.remove("show")},2e3)}function Ai(a){const e=a.filtered.length,t=Math.max(1,Math.ceil(e/a.pageSize)),n=Math.min(a.page,t);return`
        <div class="team-activities-pagination">
            <button class="team-activities-page-btn" data-page="prev" ${n<=1?"disabled":""}>Prev</button>
            <span>Page ${n} of ${t}</span>
            <button class="team-activities-page-btn" data-page="next" ${n>=t?"disabled":""}>Next</button>
        </div>
    `}function ie(){const a=ye();a.columnVisibility.sourceTime=!0,hi(a);const e=Math.max(1,Math.ceil(a.filtered.length/a.pageSize));a.page>e&&(a.page=e);const t=document.getElementById("team-activities-summary"),n=document.getElementById("team-activities-table-wrap"),s=document.getElementById("team-activities-pagination-wrap"),i=document.getElementById("team-activities-last-updated"),o=document.getElementById("team-activities-columns-wrap"),r=document.getElementById("team-activities-staff-wrap");t&&(t.innerHTML=jn(a)),n&&(n.innerHTML=vi(a)),s&&(s.innerHTML=Ai(a)),o&&(o.innerHTML=bi(a)),r&&(r.innerHTML=gi(a)),i&&a.lastRefreshed&&(i.textContent=new Date(a.lastRefreshed).toLocaleString());const d=n?.querySelector("[data-select-visible]");if(d){const l=Array.from(n.querySelectorAll("input[data-row-key]")),c=l.filter(p=>p.checked).length;d.indeterminate=c>0&&c<l.length}}function ki(a,e=1){if(!a)return;const t=new Date(`${a.startIso}T00:00:00`);Number.isNaN(t.getTime())||(t.setDate(t.getDate()-7*Math.max(1,Number(e)||1)),a.startIso=t.toISOString().split("T")[0])}async function $e(){const a=ye(),e=document.getElementById("team-activities-loading");e&&(e.style.display="block");try{const t=await window.AppAnalytics.getAllStaffActivities({mode:"range",startIso:a.startIso,endIso:a.endIso,scope:"work",sideEffects:!1});a.data=pi(t),a.lastRefreshed=Date.now(),a.page=1,a.selectedKeys=[]}catch(t){console.error("Team Activities fetch failed",t)}finally{e&&(e.style.display="none")}ie()}function xt(){const a=ye(),e=document.getElementById("team-activities-start"),t=document.getElementById("team-activities-end"),n=document.getElementById("team-activities-type"),s=document.getElementById("team-activities-status"),i=document.getElementById("team-activities-search"),o=document.getElementById("team-activities-page-size");e&&(a.startIso=e.value||a.startIso),t&&(a.endIso=t.value||a.endIso),n&&(a.type=n.value||"all"),s&&(a.status=s.value||"all"),i&&(a.search=i.value||""),o&&(a.pageSize=Number(o.value)||Ct),a.page=1,ie()}function Di(){const a=ye();if(a.bound)return;a.bound=!0;let e=null;document.addEventListener("click",async t=>{const n=t.target,s=n.closest("[data-team-activities-staff-toggle]"),i=document.getElementById("team-activities-staff-panel"),o=n.closest("[data-team-activities-columns-toggle]"),r=document.getElementById("team-activities-columns-popover");s&&i?i.classList.toggle("open"):i&&!i.contains(n)&&i.classList.remove("open"),o&&r?r.classList.toggle("open"):r&&!r.contains(n)&&r.classList.remove("open");const d=n.closest(".team-activities-page-btn");if(d){const v=d.dataset.page,k=Math.max(1,Math.ceil(a.filtered.length/a.pageSize));v==="prev"&&(a.page=Math.max(1,a.page-1)),v==="next"&&(a.page=Math.min(k,a.page+1)),ie()}const l=n.closest("[data-view-date]");if(l){const v=l.getAttribute("data-view-date"),k=l.getAttribute("data-view-user");window.app_openDayPlan&&window.app_openDayPlan(v,k||"")}const c=n.closest("[data-action]");if(c){const v=c.getAttribute("data-action");v==="complete"&&window.app_teamActivitiesCompleteTask&&await window.app_teamActivitiesCompleteTask(c),v==="postpone"&&window.app_teamActivitiesPostponeTask&&await window.app_teamActivitiesPostponeTask(c),v==="remove"&&window.app_teamActivitiesRemoveTask&&await window.app_teamActivitiesRemoveTask(c)}const p=n.closest("th[data-sort]");if(p){const v=p.dataset.sort,k=p.dataset.sortAlt;let b=v;a.sortKey===v&&k?b=k:a.sortKey===k&&v&&(b=v),b&&(a.sortKey=b,ie())}n.closest("[data-staff-select-all]")&&(a.staffIds=(a.users||[]).map(v=>v.id),ie()),n.closest("[data-staff-clear]")&&(a.staffIds=[],ie()),n.closest("[data-bulk-clear]")&&(a.selectedKeys=[],ie()),n.closest("[data-bulk-remove]")&&window.app_teamActivitiesBulkRemove&&await window.app_teamActivitiesBulkRemove(),n.closest("[data-load-more-week]")&&(ki(a,1),a.weeksLoaded=Math.max(1,Number(a.weeksLoaded||1)+1),ie(),await $e())}),document.addEventListener("change",t=>{const n=t.target;if(n.matches("#team-activities-start, #team-activities-end")?(a.weeksLoaded=1,xt(),$e()):n.matches("#team-activities-type, #team-activities-status, #team-activities-page-size")&&xt(),n.matches('#team-activities-columns-popover input[type="checkbox"]')){const s=n.getAttribute("data-column");s&&(a.columnVisibility[s]=n.checked),ie()}if(n.matches('#team-activities-staff-panel input[type="checkbox"]')){const s=n.getAttribute("data-staff-id");if(!s)return;n.checked?a.staffIds.includes(s)||a.staffIds.push(s):a.staffIds=a.staffIds.filter(i=>i!==s),ie()}if(n.matches("#team-activities-filter-date")&&(a.columnFilters.date=n.value||"",ie()),n.matches("#team-activities-filter-staff")&&(a.columnFilters.staff=n.value||"",ie()),n.matches("#team-activities-filter-desc")&&(a.columnFilters.description=n.value||"",ie()),n.matches("#team-activities-filter-time")&&(a.columnFilters.time=n.value||"",ie()),n.matches("#team-activities-filter-type")&&(a.columnFilters.type=n.value||"",ie()),n.matches("#team-activities-filter-status")&&(a.columnFilters.status=n.value||"",ie()),n.matches("input[data-row-key]")){const s=n.getAttribute("data-row-key");if(!s)return;const i=new Set(a.selectedKeys||[]);n.checked?i.add(s):i.delete(s),a.selectedKeys=Array.from(i),ie()}if(n.matches("[data-select-visible]")){const s=document.getElementById("team-activities-table-wrap"),i=Array.from(s?.querySelectorAll("input[data-row-key]")||[]),o=new Set(a.selectedKeys||[]);i.forEach(r=>{const d=r.getAttribute("data-row-key");d&&(r.checked=n.checked,n.checked?o.add(d):o.delete(d))}),a.selectedKeys=Array.from(o),ie()}}),document.addEventListener("input",t=>{t.target.matches("#team-activities-search")&&(e&&clearTimeout(e),e=setTimeout(()=>xt(),ci))})}function xi(a){const e=["Date","Staff","Type","Status","Description","Time"],t=a.map(n=>[n.date,n.staffName,n.type,n.status,n.description,n.sourceTime].map(s=>`"${String(s||"").replace(/"/g,'""')}"`).join(","));return[e.join(","),...t].join(`
`)}typeof window<"u"&&(window.app_initTeamActivities=async function(){const a=ye(),e=await window.AppAnalytics.getUsersCached();a.users=e||[];try{const t="purge_carried_2026-03-25";if(localStorage.getItem(t)!=="1"&&window.AppCalendar?.purgeCarriedForwardTasksByDate){const n=await window.AppCalendar.purgeCarriedForwardTasksByDate("2026-03-25",{scopes:["personal","annual"]});(n?.removedTasks||0)>0&&console.log(`Purged ${n.removedTasks} carried-forward task(s) on 2026-03-25.`),localStorage.setItem(t,"1")}}catch(t){console.warn("Purge 2026-03-25 failed:",t)}Di(),ie(),await $e()},window.app_teamActivitiesRefresh=async function(){xt(),await $e()},window.app_teamActivitiesResetFilters=function(){const a=ye(),e=zn();a.startIso=e.startIso,a.endIso=e.endIso,a.weeksLoaded=1,a.staffIds=[],a.status="all",a.type="all",a.search="",a.columnFilters={date:"",staff:"",description:"",time:"",type:"",status:""},a.sortKey="date-desc",a.page=1,a.pageSize=Ct,a.selectedKeys=[];const t=document.getElementById("team-activities-start"),n=document.getElementById("team-activities-end"),s=document.getElementById("team-activities-type"),i=document.getElementById("team-activities-status"),o=document.getElementById("team-activities-search"),r=document.getElementById("team-activities-page-size");t&&(t.value=a.startIso),n&&(n.value=a.endIso),s&&(s.value="all"),i&&(i.value="all"),o&&(o.value=""),r&&(r.value=String(Ct)),ie(),$e()},window.app_teamActivitiesCopyCSV=async function(){const a=ye(),e=xi(a.filtered);try{await navigator.clipboard.writeText(e),alert("Table copied to clipboard.")}catch(t){console.warn("Clipboard copy failed",t),alert("Copy failed. Please use Export Excel instead.")}},window.app_teamActivitiesExportXLSX=function(){const a=ye();window.AppReports?.exportTeamActivitiesXLSX?window.AppReports.exportTeamActivitiesXLSX(a.filtered,{start:a.startIso,end:a.endIso}):alert("Export module not available.")},window.app_teamActivitiesCompleteTask=async function(a){try{const e=window.AppAuth?.getUser?window.AppAuth.getUser():null,t=e?.id||null,n=!!(e&&(e.role==="Administrator"||e.isAdmin)),s=a.getAttribute("data-plan-id"),i=Number(a.getAttribute("data-task-index")),o=a.getAttribute("data-user-id")||"";if(!n&&(!t||t!==o)){alert("Only the assigned staff member or an admin can complete this task.");return}if(!s||!Number.isInteger(i)||!window.AppCalendar?.updateTaskStatus)return;a.disabled=!0,await window.AppCalendar.updateTaskStatus(s,i,"completed");const r=ye();Array.isArray(r.data)&&(r.data=r.data.map(d=>d.planId===s&&d.taskIndex===i?{...d,status:"completed"}:d),ie()),Si(a,"Marked completed"),setTimeout(()=>$e(),400),window.app_showSyncToast&&window.app_showSyncToast("Task marked as completed.")}catch(e){console.error("Complete task failed",e),alert("Failed to complete task.")}},window.app_teamActivitiesPostponeTask=async function(a){try{const e=window.AppAuth?.getUser?window.AppAuth.getUser()?.id:null,t=a.getAttribute("data-plan-id"),n=Number(a.getAttribute("data-task-index")),s=a.getAttribute("data-plan-scope")||"personal",i=a.getAttribute("data-user-id")||"",o=a.getAttribute("data-date")||"";if(!e||e!==i){alert("Only the assigned staff member can postpone this task.");return}if(!t||!Number.isInteger(n)||!window.AppDB||!window.AppCalendar)return;a.disabled=!0;const r=await window.AppDB.get("work_plans",t);if(!r||!Array.isArray(r.plans)||!r.plans[n])throw new Error("Plan or task not found");const d=ui(o),l=await fi(a,d);if(!l){a.disabled=!1;return}const c=String(l).trim();if(!mi(c)){alert("Invalid date. Please use YYYY-MM-DD."),a.disabled=!1;return}const[p]=r.plans.splice(n,1);r.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",r);const u=c,m=s||r.planScope||"personal",h=m==="annual"?"annual_shared":r.userId||i,f=window.AppCalendar.getWorkPlanId(u,h,m),w={...p,status:"",startDate:u,endDate:u};delete w.completedDate;const v=await window.AppDB.get("work_plans",f);if(v)v.plans=Array.isArray(v.plans)?v.plans:[],v.plans.push(w),v.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",v);else{const k=m==="annual"?null:h;await window.AppCalendar.setWorkPlan(u,[w],k,{planScope:m})}await $e(),window.app_showSyncToast&&window.app_showSyncToast(`Task postponed to ${u}.`)}catch(e){console.error("Postpone task failed",e),alert("Failed to postpone task.")}},window.app_teamActivitiesBulkRemove=async function(){try{const a=ye(),e=window.AppAuth?.getUser?window.AppAuth.getUser():null;if(!!!(e&&(e.role==="Administrator"||e.isAdmin))){alert("Only admins can bulk remove tasks.");return}if(!window.AppCalendar?.removeTask){alert("Remove action is not available.");return}const n=new Set(a.selectedKeys||[]);if(!n.size){alert("Select at least one removable task.");return}const s=a.filtered.filter(i=>{const o=`${i.planId||""}__${Number.isInteger(i.taskIndex)?i.taskIndex:""}`;return n.has(o)&&i.type==="work"&&i.planId&&Number.isInteger(i.taskIndex)});if(!s.length){alert("No removable tasks in selection.");return}if(!window.appConfirm||!await window.appConfirm(`Remove ${s.length} selected task(s) so they stop carrying forward?`))return;for(const i of s)await window.AppCalendar.removeTask(i.planId,i.taskIndex);a.selectedKeys=[],await $e(),window.app_showSyncToast&&window.app_showSyncToast(`${s.length} task(s) removed.`)}catch(a){console.error("Bulk remove failed",a),alert("Failed to bulk remove tasks.")}},window.app_teamActivitiesRemoveTask=async function(a){try{const e=window.AppAuth?.getUser?window.AppAuth.getUser():null,t=e?.id||null,n=!!(e&&(e.role==="Administrator"||e.isAdmin)),s=a.getAttribute("data-plan-id"),i=Number(a.getAttribute("data-task-index")),o=a.getAttribute("data-user-id")||"";if(!s||!Number.isInteger(i)||!window.AppCalendar?.removeTask)return;if(!n&&(!t||t!==o)){alert("Only the assigned staff member or an admin can remove this task.");return}if(!window.appConfirm||!await window.appConfirm("Remove this task so it stops carrying forward?"))return;a.disabled=!0,await window.AppCalendar.removeTask(s,i),await $e(),window.app_showSyncToast&&window.app_showSyncToast("Task removed.")}catch(e){console.error("Remove task failed",e),alert("Failed to remove task.")}});async function _i(){const a=ye(),e=window.AppAuth?.getUser?window.AppAuth.getUser():null;return`
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
                        <button class="action-btn danger" onclick="window.app_openForwardCleanupModal && window.app_openForwardCleanupModal()"><i class="fa-solid fa-broom"></i> Forward Cleanup</button>
                    `:""}
                </div>
            </div>
            <div class="team-activities-summary" id="team-activities-summary">${jn(a)}</div>
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
    `}const $i=45e3,Lt="dashboard-section/",Et=new Set(["checkin","worklog","team-activity","team-schedule","staff-directory","leave-requests","leave-history","missed-checkout","stats-monthly","stats-yearly"]),Ti=(a=new Date)=>{const e=a instanceof Date?a:new Date(a);return new Date(e.toLocaleString("en-US",{timeZone:"Asia/Kolkata"}))},ya=a=>{const e=a instanceof Date?a:new Date(a);if(Number.isNaN(e.getTime()))return"";const t=e.getFullYear(),n=String(e.getMonth()+1).padStart(2,"0"),s=String(e.getDate()).padStart(2,"0");return`${t}-${n}-${s}`},Ye=a=>{const e=String(a||"").trim();if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?"":ya(t)},Ut=(a,e=[])=>{for(const t of e){const n=Ye(a?.[t]);if(n)return n}return""},Pt=()=>{const a=Ti(),t=(a.getDay()+6)%7,n=new Date(a);n.setDate(a.getDate()-t),n.setHours(0,0,0,0);const s=new Date(n);return s.setDate(n.getDate()+6),s.setHours(23,59,59,999),{from:ya(n),to:ya(s)}},mt=()=>(window.app_dashboardSectionState||(window.app_dashboardSectionState={rangeBySection:{},errorsBySection:{},cache:{}}),window.app_dashboardSectionState),Ii=a=>{const e=mt();return e.rangeBySection[a]||(e.rangeBySection[a]=Pt()),e.rangeBySection[a]},Mi=(a,e,t)=>{const n=mt();n.rangeBySection[a]={from:e,to:t}},Za=(a,e="")=>{const t=mt();t.errorsBySection[a]=String(e||"")},Ci=a=>{const e=mt();return String(e.errorsBySection?.[a]||"")},Ht=(a,e,t)=>{const n=Ye(a);return!!n&&n>=e&&n<=t},qt=async(a,e,t=$i)=>{const n=mt(),s=Date.now(),i=n.cache[a];if(i&&i.expiresAt>s)return i.value;const o=await e();return n.cache[a]={value:o,expiresAt:s+t},o},Ea=async(a,e,t)=>{if(!window.AppDB?.query)return[];try{return await window.AppDB.query(a,e,">=",t)}catch(n){return console.warn(`Date-bounded query failed for ${a}.${e}:`,n),[]}},Pa=()=>{const a=window.AppAuth?.getUser?.();return a?!!window.app_hasPerm?.("dashboard","view",a)&&window.app_selectedSummaryStaffId?window.app_selectedSummaryStaffId:a.id:""},Na=async(a,e,t)=>{const n=`att-target:${a}:${e}:${t}`;return qt(n,async()=>(await window.AppDB.query("attendance","user_id","==",a)||[]).map(i=>({...i,_dateKey:Ut(i,["date"])})).filter(i=>Ht(i._dateKey,e,t)).sort((i,o)=>new Date(o._dateKey)-new Date(i._dateKey)).slice(0,400))},Li=async(a,e)=>{const t=`att-all:${a}:${e}`;return qt(t,async()=>(await Ea("attendance","date",a)||[]).map(s=>({...s,_dateKey:Ut(s,["date"])})).filter(s=>Ht(s._dateKey,a,e)).slice(0,800))},Ba=async(a,e)=>{const t=`leaves:${a}:${e}`;return qt(t,async()=>(await Ea("leaves","startDate",a)||[]).map(s=>({...s,_dateKey:Ut(s,["appliedOn","actionDate","startDate"])})).filter(s=>Ht(s._dateKey,a,e)).slice(0,500))},Ei=async(a,e)=>{const t=`work-plans:${a}:${e}`;return qt(t,async()=>(await Ea("work_plans","date",a)||[]).map(s=>({...s,_dateKey:Ut(s,["date"])})).filter(s=>Ht(s._dateKey,a,e)).slice(0,600))},Pi=(a,e)=>{const t={Present:0,Late:0,"Early Departure":0,"Work - Home":0,Training:0,"Sick Leave":0,"Casual Leave":0,"Earned Leave":0,"Paid Leave":0,"Maternity Leave":0,Absent:0,Holiday:0,"National Holiday":0,"Regional Holidays":0};(a||[]).forEach(r=>{const d=String(r?.type||"").trim();d in t?t[d]+=1:d.includes("Holiday")?t.Holiday+=1:r?.checkIn&&(t.Present+=1),(r?.lateCountable===!0||d==="Late")&&(t.Late+=1)});const n=t.Present+t["Work - Home"]+t.Training,s=t["Sick Leave"]+t["Casual Leave"]+t["Earned Leave"]+t["Paid Leave"]+t["Maternity Leave"]+t.Absent,i=t.Late,o=Math.floor((i||0)/3)*.5;return{present:n,late:i,leaves:s,unpaidLeaves:t["Sick Leave"]+t.Absent,penalty:o,penaltyOffset:0,effectivePenalty:o,extraWorkedHours:0,earlyDepartures:t["Early Departure"],label:e,breakdown:t,totalLateDuration:"0h 0m",totalExtraDuration:"0h 0m"}},Ni=({sectionKey:a,title:e,from:t,to:n,bodyHtml:s})=>{const i=Ci(a);return`
        <div class="dashboard-section-page" data-dashboard-section="${D(a)}">
            <div class="dashboard-section-head">
                <div>
                    <h2>${D(e)}</h2>
                    <p>Weekly-first data loading. Expand only when needed.</p>
                </div>
                <button class="action-btn secondary" type="button" onclick="window.app_backToDashboard()">
                    <i class="fa-solid fa-arrow-left"></i> Back to Dashboard
                </button>
            </div>
            <div class="dashboard-section-filter-bar">
                <label>From <input id="dashboard-section-from-${D(a)}" type="date" value="${D(t)}"></label>
                <label>To <input id="dashboard-section-to-${D(a)}" type="date" value="${D(n)}"></label>
                <button class="action-btn" type="button" onclick="window.app_applyDashboardSectionDateRange('${D(a)}')">Apply</button>
                <button class="action-btn secondary" type="button" onclick="window.app_setDashboardSectionDateRange('${D(a)}','','')">Reset to Current Week</button>
            </div>
            ${i?`<div class="dashboard-section-error">${D(i)}</div>`:""}
            <div class="dashboard-section-body">${s}</div>
        </div>
    `},Bi=async(a,e)=>{const t=window.AppAuth?.getUser?.(),n=Pa(),[s,i]=await Promise.all([window.AppAttendance?.getStatus?.(),Na(n,a,e)]),o=new Set((i||[]).map(l=>l._dateKey)).size,r=n===t?.id?"My Check-in & Status":"Staff Check-in & Status",d=(i||[]).slice(0,50).map(l=>`
        <tr>
            <td>${D(l._dateKey||"--")}</td>
            <td>${D(l.checkIn||"--")}</td>
            <td>${D(l.checkOut||"--")}</td>
            <td>${D(l.type||"Attendance")}</td>
        </tr>
    `).join("");return{title:r,html:`
            <div class="card">
                <div class="dashboard-section-kpis">
                    <div class="dashboard-section-kpi"><span>Status</span><strong>${D(s?.status||"out")}</strong></div>
                    <div class="dashboard-section-kpi"><span>Days Present</span><strong>${o}</strong></div>
                    <div class="dashboard-section-kpi"><span>Range</span><strong>${D(a)} to ${D(e)}</strong></div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Type</th></tr></thead>
                        <tbody>${d||'<tr><td colspan="4">No check-in logs in this range.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>`}},Ri=async(a,e)=>{const t=Pa(),n=await Na(t,a,e);return{title:"Work Log",html:`
            <div class="card dashboard-worklog-card dashboard-section-card-no-shadow">
                <div class="dashboard-worklog-head">
                    <h4>Work Log</h4>
                    <span>Date-bounded results (${D(a)} to ${D(e)})</span>
                </div>
                <div id="dashboard-section-worklog-list" class="dashboard-worklog-list">
                    ${Ot(n,a,e,t,[],[])}
                </div>
            </div>`}},Oi=async(a,e)=>({title:"Team Activity",html:`
            <div class="card">
                <div class="dashboard-section-inline-actions">
                    <button class="action-btn secondary" onclick="window.location.hash='team-activities'">Open Advanced Team Activities Page</button>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead><tr><th>Date</th><th>Staff</th><th>Type</th><th>Status</th><th>Description</th></tr></thead>
                        <tbody>${(await window.AppAnalytics.getAllStaffActivities({mode:"range",startIso:a,endIso:e,scope:"all",sideEffects:!1})||[]).slice(0,150).map(s=>`
        <tr>
            <td>${D(s.date||"--")}</td>
            <td>${D(s.staffName||s.userName||"--")}</td>
            <td>${D(s.type||"work")}</td>
            <td>${D(s.status||"--")}</td>
            <td>${D(s._displayDesc||s.workDescription||s.task||"--")}</td>
        </tr>
    `).join("")||'<tr><td colspan="5">No team activities in this range.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>`}),Fi=async(a,e)=>{const[t,n]=await Promise.all([Ei(a,e),Ba(a,e)]),s=(t||[]).slice(0,120).map(o=>`
        <tr>
            <td>${D(o._dateKey||"--")}</td>
            <td>${D(o.userName||o.userId||"--")}</td>
            <td>${Array.isArray(o.plans)?o.plans.length:0}</td>
            <td><button class="action-btn secondary" onclick="window.app_openDayPlan('${D(o._dateKey||"")}','${D(o.userId||"")}')">Open Day Plan</button></td>
        </tr>
    `).join(""),i=(n||[]).slice(0,80).map(o=>`
        <tr>
            <td>${D(o.userName||o.userId||"--")}</td>
            <td>${D(o.type||"--")}</td>
            <td>${D(o.startDate||"--")}</td>
            <td>${D(o.endDate||"--")}</td>
            <td>${D(o.status||"Pending")}</td>
        </tr>
    `).join("");return{title:"Team Schedule",html:`
            <div class="card">
                <h4>Planned Work</h4>
                <div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Staff</th><th>Tasks</th><th>Action</th></tr></thead><tbody>${s||'<tr><td colspan="4">No planned work in range.</td></tr>'}</tbody></table></div>
            </div>
            <div class="card">
                <h4>Leaves in Range</h4>
                <div class="table-container"><table class="data-table"><thead><tr><th>Staff</th><th>Type</th><th>Start</th><th>End</th><th>Status</th></tr></thead><tbody>${i||'<tr><td colspan="5">No leaves in range.</td></tr>'}</tbody></table></div>
            </div>`}},Ui=async()=>({title:"Staff Directory",html:await Mn()}),Hi=async(a,e)=>{const n=(await Ba(a,e)||[]).filter(s=>{const i=String(s.status||"").toLowerCase();return!i||i==="pending"});return{title:"Leave Requests",html:Ta(n)}},qi=async(a,e)=>{const n=(await Ba(a,e)||[]).slice().sort((s,i)=>new Date(i._dateKey||0)-new Date(s._dateKey||0)).slice(0,150);return{title:"Leave History",html:Ia(n,{title:"Leave History",subtitle:`${a} to ${e}`,selectedDate:e})}},zi=async(a,e)=>{const[t,n]=await Promise.all([Li(a,e),window.AppDB.getCached?window.AppDB.getCached(window.AppDB.getCacheKey("sectionUsers","users",{}),6e4,()=>window.AppDB.getAll("users")):window.AppDB.getAll("users")]),s=new Map((n||[]).map(r=>[String(r.id),r]));return{title:"Missed Checkout Requests",html:`
            <div class="card">
                <div class="table-container">
                    <table class="data-table">
                        <thead><tr><th>Date</th><th>Staff</th><th>Reason</th><th>Status</th></tr></thead>
                        <tbody>${(t||[]).filter(r=>r?.missedCheckoutReasonRequired&&r?.missedCheckoutReasonSubmittedAt&&String(r?.missedCheckoutReasonStatus||"").toLowerCase()==="pending").slice(0,200).map(r=>{const d=s.get(String(r.user_id||r.userId||""));return`
            <tr>
                <td>${D(r._dateKey||"--")}</td>
                <td>${D(d?.name||"Staff")}</td>
                <td>${D(r.missedCheckoutReason||"Reason not provided")}</td>
                <td>${D(r.missedCheckoutReasonStatus||"pending")}</td>
            </tr>
        `}).join("")||'<tr><td colspan="4">No missed checkout requests in this range.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>`}},en=async(a,e,t)=>{const n=Pa(),s=await Na(n,a,e),i=t==="yearly"?"Yearly Stats View":"Monthly Stats View",o=Pi(s,`${a} to ${e}`);return{title:i,html:He(i,"Date-range attendance metrics",o,"")}},tn={checkin:(a,e)=>Bi(a,e),worklog:(a,e)=>Ri(a,e),"team-activity":(a,e)=>Oi(a,e),"team-schedule":(a,e)=>Fi(a,e),"staff-directory":()=>Ui(),"leave-requests":(a,e)=>Hi(a,e),"leave-history":(a,e)=>qi(a,e),"missed-checkout":(a,e)=>zi(a,e),"stats-monthly":(a,e)=>en(a,e,"monthly"),"stats-yearly":(a,e)=>en(a,e,"yearly")},ji=(a="")=>{const e=String(a||"").replace(/^#/,"").trim();if(!e.startsWith(Lt))return"";const t=e.slice(Lt.length).trim();return Et.has(t)?t:""},Yi=async a=>{const e=Et.has(a)?a:"worklog",t=Ii(e),n=Ye(t.from)||Pt().from,s=Ye(t.to)||Pt().to,o=await(tn[e]||tn.worklog)(n,s);return Ni({sectionKey:e,title:o.title||"Dashboard Section",from:n,to:s,bodyHtml:o.html||'<div class="card">No data available.</div>'})};async function Yn(a){return Yi(a)}const Zt=async a=>{const e=ji(window.location.hash);if(!e||e!==a)return;const t=document.getElementById("page-content");t&&(t.innerHTML='<div class="loading-spinner"></div>',t.innerHTML=await Yn(a),Wn())};function Wn(){window.__dashboardSectionGlobalsBound||(window.__dashboardSectionGlobalsBound=!0,window.app_openDashboardSection=function(a){const e=Et.has(String(a||"").trim())?String(a).trim():"worklog";if(window.location.hash===`#${Lt}${e}`){Zt(e);return}window.location.hash=`${Lt}${e}`},window.app_backToDashboard=function(){window.location.hash="dashboard"},window.app_setDashboardSectionDateRange=async function(a,e,t){const n=Et.has(String(a||"").trim())?String(a).trim():"worklog",s=Pt(),i=Ye(e)||s.from,o=Ye(t)||s.to;return i>o?(Za(n,'Invalid date range: "From" must be before or equal to "To".'),await Zt(n),!1):(Za(n,""),Mi(n,i,o),await Zt(n),!0)},window.app_applyDashboardSectionDateRange=async function(a){const e=document.getElementById(`dashboard-section-from-${a}`),t=document.getElementById(`dashboard-section-to-${a}`),n=e?e.value:"",s=t?t.value:"";await window.app_setDashboardSectionDateRange(a,n,s)})}const q={renderDashboard:Ft,renderHeroCard:xe,renderWorkLog:kn,renderActivityList:Ot,renderActivityLog:pa,renderStaffActivityListSplit:$a,renderStaffActivityColumn:ua,renderStatsCard:He,renderBreakdown:xn,renderLeaveRequests:Ta,renderLeaveHistory:Ia,renderNotificationPanel:_n,renderTaggedItems:$n,renderStaffDirectory:Os,renderStaffDirectoryPage:Mn,renderAnnualPlan:Xe,renderTimesheet:Qe,renderProfile:Cn,renderMasterSheet:Ln,renderAdmin:ha,renderBirthdayCalendar:ni,renderSalaryProcessing:si,renderPolicyTest:ii,renderMinutes:qn,renderCheckInModal:oi,renderLogin:di,renderModals:li,renderYearlyPlan:Da,renderTeamActivitiesPage:_i,renderDashboardSectionPage:Yn,initDashboardSectionPage:Wn};typeof window<"u"&&(window.AppUI=q);class Wi{constructor(){this.db=V}normalizePlanTasks(e){return Array.isArray(e?.plans)?e.plans.filter(t=>t&&t.isRemoved!==!0):[]}getSmartTaskStatus(e,t=null){if(t==="completed"||t==="not-completed")return t;const n=new Date().toISOString().split("T")[0],s=typeof e=="string"?e:e.toISOString().split("T")[0];return s>n?"to-be-started":s===n?"in-process":s<n?"overdue":"in-process"}calculateTaskPoints(e,t){const n=this.getSmartTaskStatus(t,e.status);let s=0;switch(n){case"completed":if(s=10,e.completedDate){const i=this.getDaysDifference(t,e.completedDate);i===0?s+=3:i===1?s-=1:i>=2&&(s-=2)}break;case"in-process":s=5;break;case"to-be-started":s=0;break;case"overdue":s=-8;break;case"not-completed":s=-3;break}return s}getDaysDifference(e,t){const n=new Date(e),i=new Date(t)-n;return Math.floor(i/(1e3*60*60*24))}getCompletionStats(e){let t=0,n=0,s=0,i=0,o=0,r=0;e.forEach(l=>{this.normalizePlanTasks(l).forEach(p=>{switch(r++,this.getSmartTaskStatus(l.date,p.status)){case"completed":t++;break;case"in-process":n++;break;case"not-completed":s++;break;case"overdue":i++;break;case"to-be-started":o++;break}})});const d=r>0?t/r:0;return{completed:t,inProcess:n,notCompleted:s,overdue:i,toBeStarted:o,totalTasks:r,completionRate:parseFloat(d.toFixed(2)),lastCalculated:new Date().toISOString()}}async calculateUserRating(e,t=30){try{const n=await this.db.getAll("work_plans"),s=new Date;s.setDate(s.getDate()-t);const i=s.toISOString().split("T")[0],o=n.filter(c=>c.userId===e&&c.date>=i);if(o.length===0)return{rating:3,rawScore:0,stats:{completed:0,inProcess:0,notCompleted:0,overdue:0,toBeStarted:0,totalTasks:0,completionRate:0,lastCalculated:new Date().toISOString()}};let r=0;o.forEach(c=>{this.normalizePlanTasks(c).forEach(u=>{r+=this.calculateTaskPoints(u,c.date)})});const d=this.getCompletionStats(o),l=this.normalizeScore(r,-50,150);return{rating:parseFloat(l.toFixed(1)),rawScore:r,stats:d}}catch(n){return console.error("Rating calculation failed:",n),{rating:3,rawScore:0,stats:{completed:0,inProcess:0,notCompleted:0,overdue:0,toBeStarted:0,totalTasks:0,completionRate:0,lastCalculated:new Date().toISOString()}}}}normalizeScore(e,t,n){const i=1+(Math.max(t,Math.min(n,e))-t)/(n-t)*4;return Math.max(1,Math.min(5,i))}async updateUserRating(e){try{const t=await this.calculateUserRating(e),n=await this.db.get("users",e);if(!n)throw new Error("User not found");n.ratingHistory||(n.ratingHistory=[]);const s=new Date().toISOString().split("T")[0];return n.ratingHistory.push({date:s,rating:t.rating,reason:"auto-calculated"}),n.ratingHistory.length>90&&(n.ratingHistory=n.ratingHistory.slice(-90)),n.rating=t.rating,n.completionStats=t.stats,await this.db.put("users",n),n}catch(t){throw console.error("Failed to update user rating:",t),t}}async updateAllRatings(){try{const e=await this.db.getAll("users"),t=[];for(const n of e)try{const s=await this.updateUserRating(n.id);t.push(s)}catch(s){console.error(`Failed to update rating for ${n.name}:`,s)}return t}catch(e){throw console.error("Failed to update all ratings:",e),e}}async getTopPerformers(e=5){try{return(await this.db.getAll("users")).filter(s=>s.rating!==void 0).sort((s,i)=>(i.rating||0)-(s.rating||0)).slice(0,e).map(s=>({id:s.id,name:s.name,avatar:s.avatar,rating:s.rating||0,completionStats:s.completionStats||{}}))}catch(t){return console.error("Failed to get top performers:",t),[]}}async getRatingHistory(e,t=90){try{const n=await this.db.get("users",e);if(!n||!n.ratingHistory)return[];const s=new Date;s.setDate(s.getDate()-t);const i=s.toISOString().split("T")[0];return n.ratingHistory.filter(o=>o.date>=i)}catch(n){return console.error("Failed to get rating history:",n),[]}}}const Ze=new Wi;typeof window<"u"&&(window.AppRating=Ze);class Ki{constructor(){this.db=V}getTodayKey(){const e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}normalizePlanScope(e){return String(e||"").toLowerCase()==="annual"?"annual":"personal"}normalizeTaskStatus(e){const t=String(e||"").trim().toLowerCase();return t==="in-progress"?"in-process":t}getTaskRootId(e={},t="",n=0){return e.carryForwardRootId?String(e.carryForwardRootId):e.sourcePlanId&&Number.isInteger(e.sourceTaskIndex)?`${e.sourcePlanId}::${e.sourceTaskIndex}`:`${t}::${n}`}sanitizePlanTasks(e=[]){return(Array.isArray(e)?e:[]).filter(t=>t&&t.isRemoved!==!0)}isTaskClosed(e={},t=""){if(!e||e.isRemoved===!0)return!0;const n=this.normalizeTaskStatus(e.status);if(n==="completed"||n==="not-completed"||n==="cancelled")return!0;const s=this.getSmartTaskStatus(t||e.startDate||"",n||null);return s==="completed"||s==="not-completed"}cloneTaskForDate(e={},t,n,s={}){const i={...e,startDate:t,endDate:t,carryForwardRootId:n,carriedForwardFromDate:s.date||e.startDate||"",carriedForwardFromPlanId:s.id||e.carriedForwardFromPlanId||null,autoForwardedAt:new Date().toISOString(),isAutoForwarded:!0,carryForwardPolicy:"next_day_only",carryForwardReason:s.carryForwardReason||e.carryForwardReason||""};return this.normalizeTaskStatus(i.status)!=="in-process"&&(i.status=""),delete i.completedDate,delete i.removedAt,delete i.removedBy,i.isRemoved=!1,i}async getAllWorkPlansUntil(e){return this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:"<=",value:e}]).catch(()=>this.db.getAll("work_plans")):this.db.getAll("work_plans")}buildDateRange(e,t){const n=new Date(`${e}T00:00:00`),s=new Date(`${t}T00:00:00`);if(Number.isNaN(n.getTime())||Number.isNaN(s.getTime())||n>s)return[];const i=[],o=new Date(n);for(;o<=s;)i.push(`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`),o.setDate(o.getDate()+1);return i}getPreviousDateKey(e){const t=new Date(`${String(e||"").trim()}T00:00:00`);return Number.isNaN(t.getTime())?"":(t.setDate(t.getDate()-1),`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`)}isImmediateNextDay(e,t){const n=String(e||"").trim(),s=String(t||"").trim();return!n||!s?!1:this.getPreviousDateKey(s)===n}async getCarryForwardExceptionReason(e,t){const n=String(e||"").trim(),s=String(t||"").trim();if(!n||!s)return"";this._carryForwardExceptionCache||(this._carryForwardExceptionCache=new Map);const i=`${n}::${s}`;if(this._carryForwardExceptionCache.has(i))return this._carryForwardExceptionCache.get(i);let o="";return((this.db.queryMany?await this.db.queryMany("attendance",[{field:"date",operator:"==",value:s}]).catch(()=>this.db.getAll("attendance")):await this.db.getAll("attendance"))||[]).filter(l=>{const c=String(l?.user_id||l?.userId||"").trim();return l&&c===n&&String(l.date||"")===s}).some(l=>String(l.autoCheckoutReason||"").trim()==="missed_checkout_next_login")&&(o="missed_checkout"),o||((this.db.queryMany?await this.db.queryMany("leaves",[{field:"status",operator:"==",value:"Approved"}]).catch(()=>this.db.getAll("leaves")):await this.db.getAll("leaves"))||[]).some(p=>{if(!p||String(p.userId||p.user_id||"").trim()!==n||String(p.status||"")!=="Approved")return!1;const m=String(p.startDate||"").trim(),h=String(p.endDate||"").trim();return!m||!h?!1:m<=s&&s<=h})&&(o="leave_day"),this._carryForwardExceptionCache.set(i,o),o}async isCarryForwardExceptionDay(e,t){return!!await this.getCarryForwardExceptionReason(e,t)}async isEligibleNextDayCarryTask(e={},t,n,s){return!e||e.isRemoved===!0||!this.isImmediateNextDay(t,n)||this.isTaskClosed(e,t)?!1:this.isCarryForwardExceptionDay(s,t)}async ensureCarryForwardForRange(e,t,n={}){const s=String(t||"").trim();if(!s)return{created:0,updatedPlans:[]};const i=this.getTodayKey(),o=s>i?i:s,r=String(e||o).trim()||o;if(r>o)return{created:0,updatedPlans:[]};const d=Array.isArray(n.userIds)?n.userIds.map(m=>String(m||"").trim()).filter(Boolean):null;this._carryForwardExceptionCache=new Map;const l=(await this.getAllWorkPlansUntil(o)).filter(m=>!!m&&!!m.date&&m.date<=o),c=new Map,p=(m,h,f)=>{const w=`${h}::${f}`;c.has(w)||c.set(w,new Map),c.get(w).set(m.date,{...m,planScope:h,plans:Array.isArray(m.plans)?[...m.plans]:[]})};l.forEach(m=>{if(this.normalizePlanScope(m.planScope)!=="personal")return;const f=String(m.userId||"").trim();!f||f==="annual_shared"||d&&!d.includes(f)||p(m,"personal",f)});const u=[];for(const[m,h]of c.entries()){const[f,w]=m.split("::"),v=this.buildDateRange(r,o);for(const k of v){let b=h.get(k)||null;const M=b&&Array.isArray(b.plans)?[...b.plans]:[],A=new Set;M.forEach((_,x)=>{A.add(this.getTaskRootId(_,b?.id||this.getWorkPlanId(k,w,f),x))});const g=[],S=this.getPreviousDateKey(k),C=S?h.get(S):null,I=S?await this.getCarryForwardExceptionReason(w,S):"",y=C&&Array.isArray(C.plans)?C.plans:[];if(I&&C&&y.length>0)for(let _=0;_<y.length;_+=1){const x=y[_];if(!await this.isEligibleNextDayCarryTask(x,S,k,w))continue;const $=this.getTaskRootId(x,C.id,_);A.has($)||(g.push(this.cloneTaskForDate(x,k,$,{id:C.id,date:C.date,sourceTaskIndex:_,carryForwardReason:I})),A.add($))}if(g.length>0){const x=g[0]?.assignedToName||C?.userName||"";b||(b={id:this.getWorkPlanId(k,w,f),userId:w,userName:x,date:k,plans:[],planScope:f}),b.plans=[...M,...g],b.updatedAt=new Date().toISOString(),await this.db.put("work_plans",b),h.set(k,b),u.push(b.id)}}}return{created:u.length,updatedPlans:u}}async ensureCarryForwardForDate(e,t={}){const n=String(e||"").trim();return n?this.ensureCarryForwardForRange(n,n,t):{created:0,updatedPlans:[]}}getWorkPlanId(e,t=null,n="personal"){return this.normalizePlanScope(n)==="annual"?`plan_annual_${e}`:`plan_${t}_${e}`}async getPlans(){try{const e=new Date,t=new Date(e.getFullYear(),e.getMonth()-2,1).toISOString().split("T")[0],n=new Date(e.getFullYear(),e.getMonth()+3,0).toISOString().split("T")[0],[s,i,o,r]=await Promise.all([this.db.getAll("leaves"),this.db.getAll("events").catch(()=>[]),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:t},{field:"date",operator:"<=",value:n}]).catch(()=>this.db.getAll("work_plans")):this.db.getAll("work_plans"),this.db.getCached?this.db.getCached(this.db.getCacheKey("calendarUsers","users",{}),N?.READ_CACHE_TTLS?.users||6e4,()=>this.db.getAll("users")).catch(()=>[]):this.db.getAll("users").catch(()=>[])]),d={};r.forEach(u=>{d[u.id]=u.name});const l=(s||[]).filter(u=>u.status==="Approved").map(u=>({...u,userName:u.userName||d[u.userId]||"Staff"})),c=(()=>{const u=new Map;return(i||[]).forEach(m=>{const h=[String(m.date||"").trim(),String(m.title||"").trim().toLowerCase(),String(m.type||"event").trim().toLowerCase(),String(m.createdById||m.createdByName||"").trim().toLowerCase()].join("|");u.has(h)||u.set(h,m)}),Array.from(u.values())})(),p=(o||[]).map(u=>({...u,plans:this.sanitizePlanTasks(u.plans)})).filter(u=>u.plans.length>0);return{leaves:l,events:c,workPlans:p}}catch(e){return console.error("Failed to fetch calendar plans:",e),{leaves:[],events:[],workPlans:[]}}}async setWorkPlan(e,t=[],n=null,s={}){const i=te.getUser();if(!i)throw new Error("Not authenticated");const o=this.normalizePlanScope(s.planScope),r=n||i.id,d=await this.db.getAll("users"),l=d.find(p=>p.id===r);if(!l)throw console.error("setWorkPlan Error: Target user not found",{targetId:r,currentUser:i,allUsersCount:d.length}),new Error("Target user not found");const c={id:this.getWorkPlanId(e,r,o),userId:o==="annual"?"annual_shared":r,userName:o==="annual"?"All Staff":l.name,date:e,plans:Array.isArray(t)?t:[],planScope:o,createdById:i.id,createdByName:i.name||"Admin",updatedAt:new Date().toISOString()};return await this.db.put("work_plans",c)}async addWorkPlanTask(e,t,n,s=[],i={}){let o=await this.getWorkPlan(t,e);if(!o){const d=(await this.db.getAll("users")).find(l=>l.id===t);if(!d)throw new Error("Target user not found");o={id:`plan_${t}_${e}`,userId:t,userName:d.name,date:e,plans:[],updatedAt:new Date().toISOString()}}if(o.plans||(o.plans=[]),o.plans=this.sanitizePlanTasks(o.plans),i.sourcePlanId!==void 0&&i.sourceTaskIndex!==void 0&&i.sourcePlanId!==null){const r=o.plans.find(d=>d.sourcePlanId===i.sourcePlanId&&d.sourceTaskIndex===i.sourceTaskIndex&&d.addedFrom===(i.addedFrom||"minutes"));if(r)return r.task=n,r.subPlans=i.subPlans||r.subPlans||[],r.tags=s,r.status=i.status||r.status||"pending",r.startDate=i.startDate||r.startDate||e,r.endDate=i.endDate||r.endDate||r.startDate||e,r.updatedAt=new Date().toISOString(),o.updatedAt=new Date().toISOString(),await this.db.put("work_plans",o)}return o.plans.push({task:n,subPlans:i.subPlans||[],tags:s,status:i.status||"pending",startDate:i.startDate||e,endDate:i.endDate||i.startDate||e,addedFrom:i.addedFrom||"minutes",sourcePlanId:i.sourcePlanId||null,sourceTaskIndex:i.sourceTaskIndex??null,taggedById:i.taggedById||null,taggedByName:i.taggedByName||null}),o.updatedAt=new Date().toISOString(),await this.db.put("work_plans",o)}extractDateFromPlanToken(e=""){const n=String(e||"").trim().match(/(\d{4}-\d{2}-\d{2})/);return n?n[1]:""}extractOwnerFromPlanToken(e=""){const t=String(e||"").trim();if(!t)return"";if(t.startsWith("plan_annual_"))return"annual_shared";const n=t.match(/^plan_([^_]+)_\d{4}-\d{2}-\d{2}/);return n?n[1]:""}resolveTaskOriginDate(e={}){const t=String(e.carriedForwardFromDate||"").trim();if(/^\d{4}-\d{2}-\d{2}$/.test(t))return t;const n=this.extractDateFromPlanToken(e.carryForwardRootId);if(n)return n;const s=this.extractDateFromPlanToken(e.carriedForwardFromPlanId);if(s)return s;const i=this.extractDateFromPlanToken(e.sourcePlanId);if(i)return i;const o=String(e.startDate||"").trim();if(/^\d{4}-\d{2}-\d{2}$/.test(o))return o;const r=String(e.endDate||"").trim();return/^\d{4}-\d{2}-\d{2}$/.test(r)?r:""}isTaggedCopyOriginTask(e={}){const t=String(e.addedFrom||"").toLowerCase().trim(),n=t==="tag"||t==="delegated"||t==="staff",s=!!e.sourcePlanId||Number.isInteger(e.sourceTaskIndex)||Number.isFinite(Number(e.sourceTaskIndex));return n||s}hasLegacyTaggedTextPattern(e={}){const t=String(e.task||"");return t?(t.match(/\(Responsible:/gi)||[]).length>1:!1}hasResponsibleMarker(e={}){const t=String(e.task||"");return/\((Responsible|Assigned to):/i.test(t)}normalizeTaskForStaleCompare(e=""){return String(e||"").replace(/\s*\((Responsible|Assigned to):[^)]*\)\s*/gi," ").replace(/\s+/g," ").trim().toLowerCase()}hasCarryForwardLineage(e={}){return!!(e.carryForwardRootId||e.isAutoForwarded===!0||e.carriedForwardFromDate||e.carriedForwardFromPlanId)}async findCarryForwardIssues(e={}){const t=e.includeAssignedMismatch===!0,n=await this.db.getAll("work_plans"),s=[];return(n||[]).forEach(i=>{if(!i||this.normalizePlanScope(i.planScope)!=="personal")return;const o=String(i.userId||"").trim();!o||!Array.isArray(i.plans)||i.plans.length===0||i.plans.forEach((r,d)=>{if(!r||r.isRemoved===!0||!this.hasCarryForwardLineage(r))return;const l=String(r.carryForwardRootId||r.carriedForwardFromPlanId||r.sourcePlanId||"").trim(),c=this.extractOwnerFromPlanToken(l),p=String(r.assignedTo||"").trim(),u=!!(c&&o&&c!==o),m=!!(p&&o&&p!==o);!u&&!(t&&m)||s.push({planId:i.id||"",planDate:i.date||"",planUserId:o,planUserName:i.userName||"",taskIndex:d,taskText:r.task||"",originDate:this.resolveTaskOriginDate(r),rootToken:l,rootOwner:c,assignedTo:p,isAutoForwarded:r.isAutoForwarded===!0,carryForwardReason:String(r.carryForwardReason||"").trim(),ownerMismatch:u,assignedMismatch:m})})}),s.sort((i,o)=>{const r=String(o.planDate||"").localeCompare(String(i.planDate||""));return r||String(i.planUserName||"").localeCompare(String(o.planUserName||""))}),s}async cleanupInvalidTodayCarryForward(e,t,n={}){const s=String(e||"").trim(),i=String(t||"").trim();if(!s||!i)return{ok:!1,removed:0,reason:"invalid_input"};const o=n.onlyToday!==!1,r=this.getTodayKey();if(o&&i!==r)return{ok:!0,removed:0,reason:"not_today"};const d=this.getPreviousDateKey(i),l=await this.getWorkPlan(s,i,{planScope:"personal"});if(!l||!Array.isArray(l.plans)||l.plans.length===0)return{ok:!0,removed:0,reason:"no_plan"};const c=[];let p=0;for(const u of l.plans){if(!u||u.isRemoved===!0){c.push(u);continue}if(this.isTaskClosed(u,i)){c.push(u);continue}const m=this.hasCarryForwardLineage(u),h=this.resolveTaskOriginDate(u);let f=!1;if(h&&h<d)f=!0;else if(m)if(!h||h!==d)f=!0;else{const w=await this.isEligibleNextDayCarryTask(u,h,i,s),v=await this.getCarryForwardExceptionReason(s,h),k=String(u.carryForwardReason||"").trim(),b=String(u.carryForwardPolicy||"").trim();w||(f=!0),!f&&b&&b!=="next_day_only"&&(f=!0),!f&&v&&k&&k!==v&&(f=!0)}if(f){p+=1;continue}c.push(u)}return p===0?{ok:!0,removed:0,reason:"no_matches"}:(l.plans=c,l.updatedAt=new Date().toISOString(),await this.db.put("work_plans",l),{ok:!0,removed:p,planId:l.id,date:i})}async cleanupInvalidTodayCarryForwardForDate(e,t={}){const n=String(e||"").trim();if(!n)return{ok:!1,removed:0,scannedPlans:0,reason:"invalid_date"};const s=t.onlyToday!==!1,i=this.getTodayKey();if(s&&n!==i)return{ok:!0,removed:0,scannedPlans:0,reason:"not_today"};const r=((this.db.queryMany?await this.db.queryMany("work_plans",[{field:"date",operator:"==",value:n}]).catch(()=>this.db.getAll("work_plans")):await this.db.getAll("work_plans"))||[]).filter(l=>l&&String(l.date||"")===n&&this.normalizePlanScope(l.planScope)==="personal"&&Array.isArray(l.plans)&&l.plans.length>0);let d=0;for(const l of r){const c=String(l.userId||"").trim();if(!c)continue;const p=await this.cleanupInvalidTodayCarryForward(c,n,{onlyToday:s});d+=Number(p?.removed||0)}return{ok:!0,removed:d,scannedPlans:r.length,date:n}}async cleanupOldCarryForwardTaggedTasks(e,t,n={}){return this.cleanupInvalidTodayCarryForward(e,t,n)}async cleanupOldCarryForwardTaggedTasksForDate(e,t={}){return this.cleanupInvalidTodayCarryForwardForDate(e,t)}async deleteWorkPlan(e,t=null,n={}){const s=te.getUser();if(!s)throw new Error("Not authenticated");const i=this.normalizePlanScope(n.planScope),o=t||s.id;return await this.db.delete("work_plans",this.getWorkPlanId(e,o,i))}async purgeWorkPlansByDate(e,t={}){const n=String(e||"").trim();if(!n)return{ok:!1,removedPlans:0,reason:"invalid_date"};const s=Array.isArray(t.scopes)&&t.scopes.length?t.scopes.map(r=>this.normalizePlanScope(r)):["personal","annual"],o=((this.db.queryMany?await this.db.queryMany("work_plans",[{field:"date",operator:"==",value:n}]).catch(()=>this.db.getAll("work_plans")):await this.db.getAll("work_plans"))||[]).filter(r=>r&&String(r.date||"")===n&&s.includes(this.normalizePlanScope(r.planScope))&&Array.isArray(r.plans)&&r.plans.length>0);for(const r of o)r.plans=[],r.updatedAt=new Date().toISOString(),await this.db.put("work_plans",r);return{ok:!0,removedPlans:o.length,date:n}}async purgeCarriedForwardTasksByDate(e,t={}){const n=String(e||"").trim();if(!n)return{ok:!1,removedTasks:0,touchedPlans:0,reason:"invalid_date"};const s=Array.isArray(t.scopes)&&t.scopes.length?t.scopes.map(l=>this.normalizePlanScope(l)):["personal","annual"],o=((this.db.queryMany?await this.db.queryMany("work_plans",[{field:"date",operator:"==",value:n}]).catch(()=>this.db.getAll("work_plans")):await this.db.getAll("work_plans"))||[]).filter(l=>l&&String(l.date||"")===n&&s.includes(this.normalizePlanScope(l.planScope))&&Array.isArray(l.plans)&&l.plans.length>0);let r=0,d=0;for(const l of o){const c=l.plans.length;l.plans=l.plans.filter(u=>!this.hasCarryForwardLineage(u));const p=l.plans.length;p!==c&&(r+=c-p,d+=1,l.updatedAt=new Date().toISOString(),await this.db.put("work_plans",l))}return{ok:!0,removedTasks:r,touchedPlans:d,date:n}}async purgeAllCarriedForwardTasksAllTime(e={}){const t=Array.isArray(e.scopes)&&e.scopes.length?e.scopes.map(r=>this.normalizePlanScope(r)):["personal","annual"],s=(await this.db.getAll("work_plans")||[]).filter(r=>r&&t.includes(this.normalizePlanScope(r.planScope))&&Array.isArray(r.plans)&&r.plans.length>0);let i=0,o=0;for(const r of s){const d=r.plans.length;r.plans=r.plans.filter(c=>!this.hasCarryForwardLineage(c));const l=r.plans.length;l!==d&&(i+=d-l,o+=1,r.updatedAt=new Date().toISOString(),await this.db.put("work_plans",r))}return{ok:!0,removedTasks:i,touchedPlans:o}}async purgeCarriedForwardTasksForUserAllTime(e,t={}){const n=String(e||"").trim();if(!n)return{ok:!1,removedTasks:0,touchedPlans:0,reason:"invalid_user"};const s=Array.isArray(t.scopes)&&t.scopes.length?t.scopes.map(l=>this.normalizePlanScope(l)):["personal"],o=((this.db.queryMany?await this.db.queryMany("work_plans",[{field:"userId",operator:"==",value:n}]).catch(()=>this.db.getAll("work_plans")):await this.db.getAll("work_plans"))||[]).filter(l=>l&&String(l.userId||"").trim()===n&&s.includes(this.normalizePlanScope(l.planScope))&&Array.isArray(l.plans)&&l.plans.length>0);let r=0,d=0;for(const l of o){const c=l.plans.length;l.plans=l.plans.filter(u=>!this.hasCarryForwardLineage(u));const p=l.plans.length;p!==c&&(r+=c-p,d+=1,l.updatedAt=new Date().toISOString(),await this.db.put("work_plans",l))}return{ok:!0,removedTasks:r,touchedPlans:d}}async getForwardCleanupItemsAllTime(e={}){const t=e.includePersonal!==!1,n=e.includeAnnual===!0,s=[];t&&s.push("personal"),n&&s.push("annual");const i=await this.db.getAll("work_plans"),o=[];return(i||[]).forEach(r=>{if(!r||!Array.isArray(r.plans)||r.plans.length===0)return;const d=this.normalizePlanScope(r.planScope);s.includes(d)&&r.plans.forEach((l,c)=>{if(!l||l.isRemoved===!0)return;const u=String(l.addedFrom||"").toLowerCase().trim()==="postponed"||!!l.postponedFromDate||/postponed from/i.test(String(l.task||"")),m=this.hasCarryForwardLineage(l)||l.isAutoForwarded===!0;if(!u&&!m)return;const h=m?"system":"manual";o.push({type:h,planId:r.id||"",planDate:r.date||"",planUserId:r.userId||"",planUserName:r.userName||"",taskIndex:c,taskText:l.task||""})})}),o.sort((r,d)=>String(d.planDate||"").localeCompare(String(r.planDate||""))),o}async getWorkPlan(e,t,n={}){const s=!!n.includeAnnual,i=!!n.mergeAnnual,o=n.planScope?this.normalizePlanScope(n.planScope):null,r=!!n.preferAnnual;if(o){const u=await this.db.get("work_plans",this.getWorkPlanId(t,e,o));return u?{...u,plans:this.sanitizePlanTasks(u.plans)}:null}const d=await this.db.get("work_plans",this.getWorkPlanId(t,e,"personal")),l=d?{...d,plans:this.sanitizePlanTasks(d.plans)}:null;if(!s)return l;const c=await this.db.get("work_plans",this.getWorkPlanId(t,e,"annual")),p=c?{...c,plans:this.sanitizePlanTasks(c.plans)}:null;if(i&&p&&l){const u=[];return(p.plans||[]).forEach((m,h)=>{u.push({...m,_planId:p.id,_taskIndex:h,_planDate:p.date,_planScope:"annual"})}),(l.plans||[]).forEach((m,h)=>{u.push({...m,_planId:l.id,_taskIndex:h,_planDate:l.date,_planScope:"personal"})}),{id:`plan_merged_${e}_${t}`,userId:e,userName:l.userName||"Staff",date:t,planScope:"mixed",plans:u,personalPlanId:l.id,annualPlanId:p.id}}return r?p||l:l||p}getSmartTaskStatus(e,t=null){if(Ze)return Ze.getSmartTaskStatus(e,t);if(t==="completed"||t==="not-completed")return t;const n=new Date().toISOString().split("T")[0],s=typeof e=="string"?e:e.toISOString().split("T")[0];return s>n?"to-be-started":s===n?"in-process":s<n?"overdue":"in-process"}async updateTaskStatus(e,t,n,s=null){try{const i=await this.db.get("work_plans",e);if(!i||!i.plans||!i.plans[t])throw new Error("Plan or task not found");return i.plans[t].status=n,n==="completed"&&!i.plans[t].completedDate&&(i.plans[t].completedDate=s||new Date().toISOString().split("T")[0]),i.updatedAt=new Date().toISOString(),await this.db.put("work_plans",i),Ze&&await Ze.updateUserRating(i.userId),i}catch(i){throw console.error("Failed to update task status:",i),i}}async removeTask(e,t){try{const n=te.getUser(),s=await this.db.get("work_plans",e);if(!s||!Array.isArray(s.plans)||!s.plans[t])throw new Error("Plan or task not found");return s.plans[t]={...s.plans[t],status:"not-completed",isRemoved:!0,removedAt:new Date().toISOString(),removedBy:n?.id||""},s.updatedAt=new Date().toISOString(),await this.db.put("work_plans",s),s}catch(n){throw console.error("Failed to remove task:",n),n}}async reassignTask(e,t,n){try{const s=await this.db.get("work_plans",e);if(!s||!s.plans||!s.plans[t])throw new Error("Plan or task not found");if(!(await this.db.getAll("users")).find(r=>r.id===n))throw new Error("New user not found");return s.plans[t].assignedTo=n,s.updatedAt=new Date().toISOString(),await this.db.put("work_plans",s),s}catch(s){throw console.error("Failed to reassign task:",s),s}}async getTasksByStatus(e,t,n=null,s=null){try{const o=(await this.db.getAll("work_plans")).filter(d=>d.userId===e),r=[];return o.forEach(d=>{n&&d.date<n||s&&d.date>s||d.plans&&Array.isArray(d.plans)&&d.plans.forEach((l,c)=>{if(l.isRemoved===!0)return;const p=this.getSmartTaskStatus(d.date,l.status);p===t&&r.push({...l,planId:d.id,taskIndex:c,planDate:d.date,calculatedStatus:p})})}),r}catch(i){return console.error("Failed to get tasks by status:",i),[]}}async getCollaborations(e,t=null){try{return(await this.db.getAll("work_plans")).filter(s=>(!t||s.date===t)&&s.plans&&s.plans.some(i=>i.tags&&i.tags.some(o=>o.id===e&&o.status==="accepted")))}catch(n){return console.error("Failed to fetch collaborations:",n),[]}}async addEvent(e){const t={id:"ev_"+Date.now(),...e,createdOn:new Date().toISOString()};return await this.db.add("events",t)}_toLocalISO(e){const t=new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`}async getMonthEvents(e,t){const n=await this.getPlans(),s=[];n.leaves.forEach(r=>{const d=new Date(r.startDate),l=new Date(r.endDate);let c=new Date(d);for(;c<=l;)s.push({date:this._toLocalISO(c),title:`${r.userName||"Staff"} (Leave)`,type:"leave",userId:r.userId}),c.setDate(c.getDate()+1)});const i=n.workPlans.map(r=>{const d=[];return r.plans.forEach(l=>{let c=l.task;l.subPlans&&l.subPlans.length>0&&(c+=" ("+l.subPlans.join(", ")+")"),l.tags&&l.tags.length>0&&(c+=" with "+l.tags.map(p=>p.name).join(", ")),d.push(c)}),{date:r.date,title:`${r.userName}: ${d.join("; ")}`,type:"work",userId:r.userId,plans:r.plans}});return[...s,...n.events,...i].filter(r=>{const d=new Date(r.date);return d.getFullYear()===e&&d.getMonth()===t})}}const ce=new Ki;typeof window<"u"&&(window.AppCalendar=ce);class Vi{constructor(){this.isActive=!1,this.activeMinutes=0,this.totalMinutes=0,this.monitorInterval=null,this.lastActivityTime=Date.now(),this.isCurrentlyActive=!1,this.performedAudits={},this.commandListener=null,this.processedCommandIds=new Set,this.startTime=Date.now(),this.handleActivity=this.handleActivity.bind(this),this.tick=this.tick.bind(this),V&&this.initCommandListener()}initCommandListener(){this.commandListener||V&&V.listen&&(console.log("Activity Monitor: Initializing System Command Listener..."),this.commandListener=V.listen("system_commands",e=>{const t=te.getUser();if(!t){console.log("[Audit] Command detected but user not authenticated yet. Waiting...");return}const n=e.filter(s=>s.type==="audit"&&s.timestamp>this.startTime-6e5&&!this.processedCommandIds.has(s.id)).sort((s,i)=>i.timestamp-s.timestamp);if(n.length>0){const s=n[0];console.log("[Audit] Manual Command Received!",s.id),this.processedCommandIds.add(s.id);const i=s.slotName||`Manual Audit @ ${new Date().toLocaleTimeString()}`;console.log(`[Audit] Executing for user: ${t.name} in slot: ${i}`),this.performSilentAudit(i)}}))}async performSilentAudit(e){const t=te.getUser();if(!t)return;const n=new Date().toISOString().split("T")[0];if(this.performedAudits[n]||(this.performedAudits[n]={}),this.performedAudits[n][e])return;console.log(`Executing Silent Location Audit for slot: ${e}`),this.performedAudits[n][e]=!0;let s={userId:t.id,userName:t.name,timestamp:Date.now(),slot:e,status:"Success",lat:0,lng:0};try{if(window.getLocation){const i=await window.getLocation().catch(o=>(console.warn("Silent Audit Location Failed:",o),null));i?(s.lat=i.lat,s.lng=i.lng):s.status="Location service disabled"}else s.status="Location service disabled (missing helper)"}catch{s.status="Location service disabled"}try{await V.add("location_audits",s),console.log("Silent Audit Log Saved.")}catch(i){console.error("Failed to save audit log:",i)}}start(){this.isActive||(this.isActive=!0,this.activeMinutes=0,this.totalMinutes=0,this.isCurrentlyActive=!1,this.lastActivityTime=Date.now(),document.addEventListener("mousemove",this.handleActivity),document.addEventListener("click",this.handleActivity),document.addEventListener("keydown",this.handleActivity),document.addEventListener("scroll",this.handleActivity),this.monitorInterval=setInterval(this.tick,6e4),console.log("Activity Monitoring Started"))}stop(){if(this.isActive)return this.isActive=!1,document.removeEventListener("mousemove",this.handleActivity),document.removeEventListener("click",this.handleActivity),document.removeEventListener("keydown",this.handleActivity),document.removeEventListener("scroll",this.handleActivity),this.monitorInterval&&clearInterval(this.monitorInterval),console.log("Activity Monitoring Stopped. Score:",this.getScore()),this.getStats()}handleActivity(){this.isCurrentlyActive||(this.isCurrentlyActive=!0,this.lastActivityTime=Date.now())}tick(){this.totalMinutes++,this.isCurrentlyActive&&this.activeMinutes++;const e=te.getUser();e&&e.status==="in"&&(e.activityScore=this.getScore(),e.lastActive=this.lastActivityTime,V.put("users",e)),this.isCurrentlyActive=!1}getScore(){return this.totalMinutes===0?100:Math.round(this.activeMinutes/this.totalMinutes*100)}getStats(){return{score:this.getScore(),activeMinutes:this.activeMinutes,totalMinutes:this.totalMinutes}}}const Gi=new Vi;typeof window<"u"&&(window.AppActivity=Gi);class Ji{constructor(){this.active=!1,this.currentStep=0,this.steps=[],this.overlay=null,this.tooltip=null,this.highlight=null,this.tourKey="crwi_tour_completed"}init(e){if(e){if(localStorage.getItem(this.tourKey+"_"+e.id)){console.log("Tour already completed for user:",e.id);return}this.defineSteps(e),setTimeout(()=>{this.startTour(e)},2e3)}}defineSteps(e){e.isAdmin||e.role==="Administrator"?this.steps=[{element:".sidebar-header",title:"Welcome, Admin!",content:"This is your CRWI Attendance management console. Let us walk you through the key features.",position:"right"},{element:'.nav-item[data-page="admin"]',title:"User Management",content:"In the Admin Panel, you can add new staff, edit details, and manage roles.",position:"right"},{element:'.nav-item[data-page="master-sheet"]',title:"Attendance Sheet",content:"View and export the master attendance sheet for all employees here.",position:"right"},{element:'.nav-item[data-page="salary"]',title:"Salary Processing",content:"Calculate and process salaries based on attendance logs and penalties.",position:"right"},{element:".main-content",title:"Dashboard Overview",content:"The dashboard gives you real-time insights into who is in, pending leaves, and team activity.",position:"bottom"}]:this.steps=[{element:".sidebar-header",title:"Welcome to CRWI!",content:"This portal helps you track your attendance and work logs. Here is a quick guide.",position:"right"},{element:".action-btn",title:"Check-In / Out",content:"Use this button daily to mark your attendance. Don't forget to add a summary when checking out!",position:"bottom"},{element:'.nav-item[data-page="timesheet"]',title:"Your Timesheet",content:"Review your past logs and request leaves from here.",position:"right"},{element:'.nav-item[data-page="profile"]',title:"Your Profile",content:"View your stats, rewards, and manage your account details.",position:"right"}]}startTour(e){this.steps.length!==0&&(this.active=!0,this.currentStep=0,this.createUIElements(),this.showStep(),localStorage.setItem(this.tourKey+"_"+e.id,"true"))}createUIElements(){this.overlay=document.createElement("div"),this.overlay.className="tour-overlay",this.highlight=document.createElement("div"),this.highlight.className="tour-highlight",this.tooltip=document.createElement("div"),this.tooltip.className="tour-tooltip",document.body.appendChild(this.overlay),document.body.appendChild(this.highlight),document.body.appendChild(this.tooltip)}showStep(){const e=this.steps[this.currentStep],t=document.querySelector(e.element);if(!t||t.offsetParent===null){console.warn("Tour target not found:",e.element),this.nextStep();return}const n=t.getBoundingClientRect(),s=5;this.highlight.style.top=n.top-s+"px",this.highlight.style.left=n.left-s+"px",this.highlight.style.width=n.width+s*2+"px",this.highlight.style.height=n.height+s*2+"px",t.scrollIntoView({behavior:"smooth",block:"center"}),this.tooltip.innerHTML=`
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
            `,this.positionTooltip(n,e.position),this.tooltip.classList.add("active")}positionTooltip(e,t){const n=this.tooltip.getBoundingClientRect(),s=15;let i,o;switch(t){case"right":i=e.top+e.height/2-n.height/2,o=e.right+s;break;case"bottom":i=e.bottom+s,o=e.left+e.width/2-n.width/2;break;case"left":i=e.top+e.height/2-n.height/2,o=e.left-n.width-s;break;case"top":i=e.top-n.height-s,o=e.left+e.width/2-n.width/2;break;default:i=e.bottom+s,o=e.left}const r=window.innerWidth,d=window.innerHeight;o<10&&(o=10),o+n.width>r-10&&(o=r-n.width-10),i<10&&(i=10),i+n.height>d-10&&(i=d-n.height-10),this.tooltip.style.top=i+"px",this.tooltip.style.left=o+"px"}nextStep(){this.currentStep++,this.currentStep<this.steps.length?this.showStep():this.endTour()}endTour(){this.active=!1,this.overlay&&this.overlay.remove(),this.highlight&&this.highlight.remove(),this.tooltip&&this.tooltip.remove()}resetTour(e){localStorage.removeItem(this.tourKey+"_"+e),window.location.reload()}}const Xi=new Ji;typeof window<"u"&&(window.AppTour=Xi);class Qi{constructor(){this.db=V,this.chartInstance=null,this.memo=new Map,typeof window<"u"&&window.addEventListener&&window.addEventListener("app:db-write",e=>{const t=e?.detail?.collection;["attendance","users","work_plans","leaves","minutes"].includes(t)&&this.clearMemo()})}getFlags(){return N&&N.READ_OPT_FLAGS||{}}getTtls(){return N&&N.READ_CACHE_TTLS||{}}async memoize(e,t,n){if(!this.getFlags().FF_READ_OPT_ANALYTICS_CACHE)return n();const i=Date.now(),o=this.memo.get(e);if(o&&o.expiresAt>i)return o.value;const r=await n();return this.memo.set(e,{value:r,expiresAt:i+Math.max(0,Number(t)||0)}),r}clearMemo(e=""){if(!e){this.memo.clear();return}for(const t of this.memo.keys())t.startsWith(e)&&this.memo.delete(t)}async getUsersCached(){const e=this.getTtls().users||6e4;return this.memoize("analytics:users",e,async()=>{if(V&&V.getCached){const t=V.getCacheKey("analyticsUsers","users",{ttl:e});return V.getCached(t,e,()=>this.db.getAll("users"))}return this.db.getAll("users")})}async getAttendanceInRange(e,t,n=""){const s=this.getTtls().attendanceSummary||3e4,i=typeof e=="string"?e:e.toISOString().split("T")[0],o=typeof t=="string"?t:t.toISOString().split("T")[0],r=`analytics:attendance:${i}:${o}:${n}`;return this.memoize(r,s,async()=>this.db.queryMany?this.db.queryMany("attendance",[{field:"date",operator:">=",value:i},{field:"date",operator:"<=",value:o}]):(await this.db.getAll("attendance")).filter(l=>l.date>=i&&l.date<=o))}async initAdminCharts(){const e=document.getElementById("admin-stats-chart");if(!e)return;this.chartInstance&&(this.chartInstance.destroy(),this.chartInstance=null);const t=new Date,n=new Date;n.setDate(n.getDate()-14);const[s,i]=await Promise.all([this.getAttendanceInRange(n,t,"adminChart"),this.getUsersCached()]),o=this.processLast7Days(s,i),r=e.getContext("2d");try{this.chartInstance=new Chart(r,{type:"line",data:{labels:o.labels,datasets:[{label:"Staff Present",data:o.present,borderColor:"#10b981",backgroundColor:"rgba(16, 185, 129, 0.1)",fill:!0,tension:.4,borderWidth:3,pointBackgroundColor:"#10b981",pointRadius:4},{label:"On Leave",data:o.onLeave,borderColor:"#ef4444",backgroundColor:"transparent",borderDash:[5,5],tension:.1,pointRadius:0}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{intersect:!1,mode:"index"},plugins:{legend:{position:"top",labels:{usePointStyle:!0,boxWidth:6}},tooltip:{backgroundColor:"rgba(30, 27, 75, 0.9)",padding:12,titleFont:{size:14,weight:"bold"},bodyFont:{size:13},cornerRadius:8}},scales:{y:{beginAtZero:!0,ticks:{stepSize:1,color:"#6b7280"},grid:{color:"rgba(0,0,0,0.05)"}},x:{grid:{display:!1},ticks:{color:"#6b7280"}}}}})}catch(d){console.error("Chart.js Error:",d),e.parentNode.innerHTML=`<div style="color:red; text-align:center; padding:1rem;">Failed to load chart: ${d.message}</div>`}}processLast7Days(e,t=[]){const n=[],s=[],i=[],o=d=>{if(Object.prototype.hasOwnProperty.call(d||{},"attendanceEligible"))return d.attendanceEligible===!0;const l=String(d?.entrySource||"");return l==="staff_manual_work"?!1:l==="admin_override"||l==="checkin_checkout"||d?.isManualOverride||d?.location==="Office (Manual)"||d?.location==="Office (Override)"||typeof d?.activityScore<"u"||typeof d?.locationMismatched<"u"||typeof d?.autoCheckout<"u"||!!d?.checkOutLocation||typeof d?.outLat<"u"||typeof d?.outLng<"u"?!0:String(d?.type||"").includes("Leave")||d?.location==="On Leave"},r=(d,l)=>d.getFullYear()===l.getFullYear()&&d.getMonth()===l.getMonth()&&d.getDate()===l.getDate();for(let d=6;d>=0;d--){const l=new Date;l.setDate(l.getDate()-d);const c=l.toLocaleDateString("en-US",{weekday:"short",day:"numeric"});n.push(c);const p=e.filter(h=>{const f=new Date(h.date);return isNaN(f.getTime())?!1:r(f,l)}),u=new Set,m=new Set;p.forEach(h=>{if(!o(h))return;const f=h.user_id||h.userId;if(!f)return;String(h.type||"").toLowerCase().includes("leave")||h.location==="On Leave"||h.type==="Absent"?m.add(f):u.add(f)}),d===0&&t.forEach(h=>{h.status==="in"&&u.add(h.id)}),s.push(u.size),i.push(m.size)}return console.log("Weekly Stats Generated (Unique):",{labels:n,present:s}),{labels:n,present:s,onLeave:i}}parseTimeToMinutes(e){if(!e)return null;const[t,n]=e.split(" ");let[s,i]=t.split(":");return s==="12"&&(s="00"),n==="PM"&&(s=parseInt(s,10)+12),parseInt(s,10)*60+parseInt(i,10)}isAttendanceEligibleLog(e){if(Object.prototype.hasOwnProperty.call(e||{},"attendanceEligible"))return e.attendanceEligible===!0;const t=String(e?.entrySource||"");return t==="staff_manual_work"?!1:t==="admin_override"||t==="checkin_checkout"||e?.isManualOverride||e?.location==="Office (Manual)"||e?.location==="Office (Override)"||typeof e?.activityScore<"u"||typeof e?.locationMismatched<"u"||typeof e?.autoCheckout<"u"||!!e?.checkOutLocation||typeof e?.outLat<"u"||typeof e?.outLng<"u"?!0:String(e?.type||"").includes("Leave")||e?.location==="On Leave"}getAttendanceLogPriority(e){const n=String(e?.type||"").includes("Leave")||e?.location==="On Leave",s=!!e?.checkOut&&e.checkOut!=="Active Now"&&(typeof e?.activityScore<"u"||typeof e?.locationMismatched<"u"||!!e?.checkOutLocation||typeof e?.outLat<"u"||typeof e?.outLng<"u");let i=1;return s&&(i=2),n&&(i=3),e?.isManualOverride&&(i=4),i}pickBestAttendanceLogPerDay(e,t,n){const s=new Map,i=o=>`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`;return e.forEach(o=>{const r=new Date(o?.date);if(Number.isNaN(r.getTime())||r<t||r>n)return;const d=/^\d{4}-\d{2}-\d{2}$/.test(String(o?.date||""))?String(o.date):i(r),l=s.get(d);(!l||this.getAttendanceLogPriority(o)>this.getAttendanceLogPriority(l))&&s.set(d,o)}),Array.from(s.values())}formatDuration(e){const t=Math.floor(e/60),n=e%60;return`${t}h ${n}m`}getWeekNumber(e){const t=new Date(e);t.setHours(0,0,0,0),t.setDate(t.getDate()+4-(t.getUTCDay()||7));const n=new Date(t.getFullYear(),0,1);return Math.ceil(((t-n)/864e5+1)/7)}async getUserMonthlyStats(e){const t=new Date,n=new Date(t.getFullYear(),t.getMonth(),1),s=new Date(t.getFullYear(),t.getMonth()+1,0),o=(await this.getAttendanceInRange(n,s,`monthly:${e}`)).filter(r=>r.userId===e||r.user_id===e);return this.calculateStatsForLogs(o)}async getSystemMonthlySummary(){const e=new Date,t=new Date(e.getFullYear(),e.getMonth(),1),n=new Date(e.getFullYear(),e.getMonth()+1,0),[s,i]=await Promise.all([this.getUsersCached(),this.getAttendanceInRange(t,n,"sysMonthly")]);return await Promise.all(s.map(async r=>{const d=i.filter(c=>(c.userId===r.id||c.user_id===r.id)&&new Date(c.date)>=t&&new Date(c.date)<=n),l=this.calculateStatsForLogs(d);return{user:r,stats:l}}))}calculateStatsForLogs(e){const t=new Date,n=t.getFullYear(),s=t.getMonth(),i=new Date(n,s,1),o=new Date(n,s+1,0),r={Present:0,Late:0,"Early Departure":0,"Work - Home":0,Training:0,"Sick Leave":0,"Casual Leave":0,"Earned Leave":0,"Paid Leave":0,"Maternity Leave":0,Absent:0,Holiday:0,"National Holiday":0,"Regional Holidays":0},d={present:0,late:0,leaves:0,unpaidLeaves:0,penalty:0,penaltyOffset:0,effectivePenalty:0,extraWorkedHours:0,earlyDepartures:0,label:i.toLocaleDateString("default",{month:"long",year:"numeric"}),breakdown:r,totalLateDuration:"0h 0m",totalExtraDuration:"0h 0m"};let l=0,c=0;this.pickBestAttendanceLogPerDay(e,i,o).forEach(h=>{if(!this.isAttendanceEligibleLog(h))return;let f=h.type||"";const w=this.parseTimeToMinutes(h.checkIn),v=this.parseTimeToMinutes(h.checkOut);if(h.isManualOverride===!0)if(f==="Late"){d.late++,r.Late++;const g=(typeof N<"u"&&N?N.LATE_CUTOFF_MINUTES:555)||555;w!==null&&w>g&&(l+=w-g)}else f==="Early Departure"&&(d.earlyDepartures++,r["Early Departure"]++);else{const g=(typeof N<"u"&&N?N.LATE_CUTOFF_MINUTES:555)||555;(h.lateCountable===!0||!Object.prototype.hasOwnProperty.call(h,"lateCountable")&&w!==null&&w>g)&&(r.Late++,d.late++,w!==null&&(l+=Math.max(0,w-g)));const C=(typeof N<"u"&&N?N.EARLY_DEPARTURE_MINUTES:1020)||1020;v!==null&&v<C&&!String(f).includes("Leave")&&f!=="Absent"&&(d.earlyDepartures++,r["Early Departure"]++)}const b=(typeof N<"u"&&N?N.LATE_CUTOFF_MINUTES:555)||555,M=(typeof N<"u"&&N?N.EARLY_DEPARTURE_MINUTES:1020)||1020,A=typeof h.extraWorkedMs=="number"?Math.max(0,Math.round(h.extraWorkedMs/(1e3*60))):0;A>0?c+=A:!(h.autoCheckout&&!h.autoCheckoutExtraApproved)&&(w!==null&&w<b&&(c+=b-w),v!==null&&v>M&&(c+=v-M)),f==="Work - Home"?r["Work - Home"]++:f==="Training"?r.Training++:f==="Sick Leave"?(r["Sick Leave"]++,d.unpaidLeaves++):f==="Casual Leave"?r["Casual Leave"]++:f==="Earned Leave"?r["Earned Leave"]++:f==="Paid Leave"?r["Paid Leave"]++:f==="Maternity Leave"?r["Maternity Leave"]++:f==="Absent"?(r.Absent++,d.unpaidLeaves++):f==="National Holiday"?r["National Holiday"]++:f==="Regional Holidays"?r["Regional Holidays"]++:String(f).includes("Holiday")?r.Holiday++:h.checkIn&&r.Present++}),d.present=r.Present+r["Work - Home"]+r.Training,d.leaves=r["Sick Leave"]+r["Casual Leave"]+r["Earned Leave"]+r["Paid Leave"]+r["Maternity Leave"]+r.Absent,d.extraWorkedHours=Number((c/60).toFixed(2)),d.penalty=Math.floor((d.late||0)/((typeof N<"u"&&N?N.LATE_GRACE_COUNT:3)||3))*((typeof N<"u"&&N?N.LATE_DEDUCTION_PER_BLOCK:.5)||.5);const u=(typeof N<"u"&&N?N.EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4)||4,m=(typeof N<"u"&&N?N.LATE_DEDUCTION_PER_BLOCK:.5)||.5;return d.penaltyOffset=Math.floor((d.extraWorkedHours||0)/u)*m,d.effectivePenalty=Math.max(0,d.penalty-d.penaltyOffset),d.totalLateDuration=this.formatDuration(l),d.totalExtraDuration=this.formatDuration(c),d}async getUserYearlyStats(e){const{start:t,end:n,label:s}=this.getFinancialYearDates(),o=(await this.getAttendanceInRange(t,n,`yearly:${e}`)).filter(h=>h.userId===e||h.user_id===e),r={Present:0,Late:0,"Early Departure":0,"Work - Home":0,Training:0,"Sick Leave":0,"Casual Leave":0,"Earned Leave":0,"Paid Leave":0,"Maternity Leave":0,Absent:0,Holiday:0,"National Holiday":0,"Regional Holidays":0},d={present:0,late:0,leaves:0,earlyDepartures:0,penaltyLeaves:0,penaltyOffset:0,effectivePenalty:0,extraWorkedHours:0,label:s,breakdown:r,totalLateDuration:"0h 0m",totalExtraDuration:"0h 0m"};let l=0,c=0;this.pickBestAttendanceLogPerDay(o,t,n).forEach(h=>{if(!this.isAttendanceEligibleLog(h))return;let f=h.type||"";const w=this.parseTimeToMinutes(h.checkIn),v=this.parseTimeToMinutes(h.checkOut),k=(typeof N<"u"&&N?N.LATE_CUTOFF_MINUTES:555)||555,b=(typeof N<"u"&&N?N.EARLY_DEPARTURE_MINUTES:1020)||1020;h.isManualOverride===!0?f==="Late"?(r.Late++,w!==null&&w>k&&(l+=w-k)):f==="Early Departure"&&(d.earlyDepartures++,r["Early Departure"]++):((h.lateCountable===!0||!Object.prototype.hasOwnProperty.call(h,"lateCountable")&&w!==null&&w>k)&&(r.Late++,w!==null&&(l+=Math.max(0,w-k))),v!==null&&v<b&&!String(f).includes("Leave")&&f!=="Absent"&&(d.earlyDepartures++,r["Early Departure"]++));const A=typeof h.extraWorkedMs=="number"?Math.max(0,Math.round(h.extraWorkedMs/(1e3*60))):0;A>0?c+=A:!(h.autoCheckout&&!h.autoCheckoutExtraApproved)&&(w!==null&&w<k&&(c+=k-w),v!==null&&v>b&&(c+=v-b)),f==="Work - Home"?r["Work - Home"]++:f==="Training"?r.Training++:f==="Sick Leave"?r["Sick Leave"]++:f==="Casual Leave"?r["Casual Leave"]++:f==="Earned Leave"?r["Earned Leave"]++:f==="Paid Leave"?r["Paid Leave"]++:f==="Maternity Leave"?r["Maternity Leave"]++:f==="Absent"?r.Absent++:f==="National Holiday"?r["National Holiday"]++:f==="Regional Holidays"?r["Regional Holidays"]++:String(f).includes("Holiday")?r.Holiday++:h.checkIn&&r.Present++}),d.present=r.Present+r["Work - Home"]+r.Training,d.leaves=r["Sick Leave"]+r["Casual Leave"]+r["Earned Leave"]+r["Paid Leave"]+r["Maternity Leave"]+r.Absent,d.late=r.Late,d.extraWorkedHours=Number((c/60).toFixed(2)),d.totalLateDuration=this.formatDuration(l),d.totalExtraDuration=this.formatDuration(c),d.penaltyLeaves=Math.floor((r.Late||0)/((typeof N<"u"&&N?N.LATE_GRACE_COUNT:3)||3))*((typeof N<"u"&&N?N.LATE_DEDUCTION_PER_BLOCK:.5)||.5);const u=(typeof N<"u"&&N?N.EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4)||4,m=(typeof N<"u"&&N?N.LATE_DEDUCTION_PER_BLOCK:.5)||.5;return d.penaltyOffset=Math.floor((d.extraWorkedHours||0)/u)*m,d.effectivePenalty=Math.max(0,d.penaltyLeaves-d.penaltyOffset),d}getFinancialYearDates(){const e=new Date,t=e.getFullYear(),n=e.getMonth(),s=(typeof N<"u"&&N?N.FY_START_MONTH:3)||3;let i=t;n<s&&(i=t-1);const o=new Date(i,s,1),r=new Date(i+1,s,0);return{start:o,end:r,label:`FY ${i}-${i+1}`}}getDayType(e){const t=typeof e=="string"?new Date(e):e,n=t.getDay();return n===0||n===6&&typeof N<"u"&&N&&N.IS_SATURDAY_OFF&&N.IS_SATURDAY_OFF(t)?"Holiday":"Work Day"}getHeroPolicy(){return N?.HERO_POLICY||{}}parseHeroLogDate(e){if(!e)return null;if(e instanceof Date&&!Number.isNaN(e.getTime()))return e;if(typeof e!="string")return null;const t=e.trim();if(!t)return null;const n=new Date(t);if(!Number.isNaN(n.getTime()))return n;const s=t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);if(!s)return null;const i=Number(s[1]),o=Number(s[2]);let r=Number(s[3]);if(r<100&&(r+=2e3),!Number.isFinite(i)||!Number.isFinite(o)||!Number.isFinite(r))return null;const d=i>12?o:i,l=i>12?i:o,c=new Date(r,d-1,l);return Number.isNaN(c.getTime())?null:c}resolveHeroUserId(e){const t=e?.user_id??e?.userId??e?.uid??e?.user??"";return String(t||"").trim()||null}resolveHeroDurationMs(e){let t=Number(e?.durationMs);if(Number.isFinite(t)||(t=0),t>0)return t;if(e?.checkIn&&e?.checkOut&&e.checkOut!=="Active Now"){const n=this.parseTimeToMinutes(e.checkIn),s=this.parseTimeToMinutes(e.checkOut);n!==null&&s!==null&&(t=(s-n)*60*1e3)}return Math.max(0,Number(t)||0)}normalizeHeroLogs(e=[]){return(e||[]).map(t=>{const n=this.parseHeroLogDate(t?.date),s=this.resolveHeroUserId(t);if(!n||!s)return null;const i=this.resolveHeroDurationMs(t),o=Number(t?.activityScore);return{userId:s,logDate:n,dateKey:n.toISOString().split("T")[0],durationMs:i,activityLogDepth:String(t?.workDescription||"").length,activityScore:Number.isFinite(o)?o:null}}).filter(Boolean)}buildHeroCandidateStats(e=[]){const t=new Map;return e.forEach(n=>{t.has(n.userId)||t.set(n.userId,{userId:n.userId,totalDurationMs:0,daysSet:new Set,activityLogDepth:0,activityScoreTotal:0,activityScoreCount:0});const s=t.get(n.userId);s.totalDurationMs+=Math.max(0,Number(n.durationMs)||0),s.daysSet.add(n.dateKey),s.activityLogDepth+=Math.max(0,Number(n.activityLogDepth)||0),Number.isFinite(n.activityScore)&&(s.activityScoreTotal+=n.activityScore,s.activityScoreCount+=1)}),Array.from(t.values())}classifyHeroTaskStatus(e,t=null){const n=String(e||"").toLowerCase().trim(),s=window.AppCalendar?.getSmartTaskStatus?String(window.AppCalendar.getSmartTaskStatus(t,n)||n):n;return s==="completed"?"completed":s==="in-process"||s==="in progress"||s==="to-be-started"||s==="pending"||s===""?"in_progress":s==="not-completed"||s==="overdue"||s==="postponed"||s==="missed"?"missed":"in_progress"}normalizeHeroTasks(e=[]){const t=[];return(e||[]).forEach(n=>{const s=String(n?.userId||n?.user_id||"").trim();!s||!Array.isArray(n?.plans)||n.plans.forEach(i=>{if(!i||!String(i.task||"").trim())return;const o=this.classifyHeroTaskStatus(i.status,n.date);t.push({userId:s,status:o,date:n.date})})}),t}buildHeroTaskStats(e=[]){const t=new Map;return e.forEach(n=>{t.has(n.userId)||t.set(n.userId,{planned:0,completed:0,inProgress:0,missed:0});const s=t.get(n.userId);s.planned+=1,n.status==="completed"?s.completed+=1:n.status==="missed"?s.missed+=1:s.inProgress+=1}),t}rankHeroCandidates(e=[],t=new Map,n={}){const s=n.WEIGHTS||{},i=n.CAPS||{},o=Math.max(1,Number(n.WINDOW_DAYS||7)),r=Math.max(1,Number(i.hours||40)),d=n.ATTENDANCE_MODIFIER||{},l=Number(s.taskExecution??.45),c=Number(s.taskCompletionRate??.2),p=Number(s.taskInProgressSupport??.1),u=Number(s.taskMissPenalty??.1),m=Number(d.base??.9),h=Number(d.maxBonus??.15),f=Number(d.consistencyImpact??.65),w=Number(d.effortImpact??.35),v=new Map(e.map(b=>[String(b.userId),b])),k=new Set([...v.keys(),...t.keys()]);return Array.from(k).map(b=>{const M=v.get(String(b))||{totalDurationMs:0,daysSet:new Set,activityLogDepth:0},A=t.get(String(b))||{planned:0,completed:0,inProgress:0,missed:0},g=M.daysSet.size,S=M.totalDurationMs/(1e3*60*60),C=Math.max(0,Number(A.planned)||0),I=Math.max(0,Number(A.completed)||0),y=Math.max(0,Number(A.inProgress)||0),_=Math.max(0,Number(A.missed)||0),x=C>0?I/C*100:0,$=C>0?Math.max(0,Math.min(100,(I+y*.5-_)/C*100)):0,L=C>0?Math.max(0,Math.min(100,y/C*100)):0,T=C>0?Math.max(0,Math.min(100,_/C*100)):0,E=g/o*100,P=Math.min(S/r*100,100),B=$*l+x*c+L*p-T*u,R=E/100*f+P/100*w,F=Math.max(0,Math.min(h,R*h)),H=Math.max(.5,m+F),W=B*H;return{userId:b,days:g,hours:Number(S.toFixed(1)),totalDurationMs:Math.max(0,Number(M.totalDurationMs)||0),activityLogDepth:M.activityLogDepth,taskPlanned:C,taskCompleted:I,taskInProgress:y,taskMissed:_,completionRate:Number(x.toFixed(1)),taskScore:Number(Math.max(0,B).toFixed(2)),attendanceFactor:Number(H.toFixed(3)),finalScore:Number(Math.max(0,W).toFixed(2))}}).sort((b,M)=>M.finalScore!==b.finalScore?M.finalScore-b.finalScore:M.taskCompleted!==b.taskCompleted?M.taskCompleted-b.taskCompleted:b.taskMissed!==M.taskMissed?b.taskMissed-M.taskMissed:M.days!==b.days?M.days-b.days:M.totalDurationMs!==b.totalDurationMs?M.totalDurationMs-b.totalDurationMs:String(b.userId).localeCompare(String(M.userId)))}createNoHeroPayload({reason:e="No eligible attendance data found.",period:t="weekly",source:n="direct_cache"}={}){return{state:"no_eligible_data",user:null,stats:null,reason:e,period:t,source:n,confidence:0,schemaVersion:Number(this.getHeroPolicy()?.SCHEMA_VERSION||1)}}scoreHeroFromLogs(e=[],t=[],n={}){const s=String(n.period||"weekly"),i=String(n.source||"direct_cache"),o=this.getHeroPolicy(),r=o.MIN_EVIDENCE||{},d=Math.max(1,Number(r.minDays||1)),l=Math.max(0,Number(r.minDurationMs||1)),c=Math.max(0,Number(r.minPlannedTasks||1)),p=this.normalizeHeroLogs(e),u=Array.isArray(n.workPlans)?n.workPlans:[],m=this.normalizeHeroTasks(u);if(p.length===0&&m.length===0)return this.createNoHeroPayload({period:s,source:i});const f=this.rankHeroCandidates(this.buildHeroCandidateStats(p),this.buildHeroTaskStats(m),o).filter(g=>g.taskPlanned>=c&&(g.days>=d||g.totalDurationMs>=l));if(f.length===0)return this.createNoHeroPayload({reason:"No staff met the minimum hero criteria this period.",period:s,source:i});const w=f[0],v=(t||[]).find(g=>String(g.id)===String(w.userId));if(!v)return this.createNoHeroPayload({reason:"No valid user mapping found for hero candidates.",period:s,source:i});const k=w.taskPlanned>0?Math.min(1,w.taskCompleted/w.taskPlanned):0,b=Math.min(1,w.days/Math.max(1,Number(o.WINDOW_DAYS||7))),M=Math.min(1,w.totalDurationMs/(1e3*60*60*Math.max(1,Number(o?.CAPS?.hours||40)))),A=Number(((k+b+M)/3).toFixed(2));return{state:"winner",user:v,stats:w,reason:this.determineHeroReason(w),period:s,source:i,confidence:A,schemaVersion:Number(o.SCHEMA_VERSION||1)}}async getHeroOfTheWeek(e={}){try{const t=this.getHeroPolicy(),n=Math.max(1,Number(t.WINDOW_DAYS||7)),s=Math.max(n,Number(t.FALLBACK_LOOKBACK_DAYS||90)),i=new Date,o=new Date(i);o.setDate(o.getDate()-n),o.setHours(0,0,0,0);const[r,d,l]=await Promise.all([this.getAttendanceInRange(o,i,"hero"),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:o.toISOString().split("T")[0]},{field:"date",operator:"<=",value:i.toISOString().split("T")[0]}]):this.db.getAll("work_plans"),this.getUsersCached()]),c=this.scoreHeroFromLogs(r,l,{period:"weekly",source:String(e.source||"direct_cache"),workPlans:d});if(c.state==="winner")return c;const p=new Date(i);p.setDate(p.getDate()-s),p.setHours(0,0,0,0);const[u,m]=await Promise.all([this.getAttendanceInRange(p,i,"hero_fallback_lookback"),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:p.toISOString().split("T")[0]},{field:"date",operator:"<=",value:i.toISOString().split("T")[0]}]):this.db.getAll("work_plans")]),h=this.normalizeHeroLogs(u),f=this.normalizeHeroTasks(m);if(h.length===0&&f.length===0)return this.createNoHeroPayload({reason:c.reason,period:"latest_active_window",source:String(e.source||"direct_cache")});const w=h.length>0?h.reduce((g,S)=>S.logDate>g?S.logDate:g,h[0].logDate):null,v=f.length>0?f.reduce((g,S)=>{const C=this.parseHeroLogDate(S?.date);return C&&(!g||C>g)?C:g},null):null,k=w||v||i,b=new Date(k);b.setDate(b.getDate()-(n-1)),b.setHours(0,0,0,0);const M=(u||[]).filter(g=>{const S=this.parseHeroLogDate(g?.date);return!!S&&S>=b&&S<=k}),A=(m||[]).filter(g=>{const S=this.parseHeroLogDate(g?.date);return!!S&&S>=b&&S<=k});return this.scoreHeroFromLogs(M,l,{period:"latest_active_window",source:String(e.source||"direct_cache"),workPlans:A})}catch(t){return console.error("Hero Calculation Error:",t),{state:"fetch_error",user:null,stats:null,reason:"Unable to calculate hero right now.",period:"weekly",source:String(e.source||"direct_cache"),confidence:0,schemaVersion:Number(this.getHeroPolicy()?.SCHEMA_VERSION||1)}}}determineHeroReason(e){const t=Number(e?.taskPlanned||0),n=Number(e?.taskCompleted||0),s=Number(e?.taskInProgress||0),i=Number(e?.taskMissed||0),o=t>0?n/t*100:0,r=Number(e?.attendanceFactor||1);return t>=6&&o>=80?"Execution Champion":n>=4&&s>=2?"Delivery Momentum":o>=70&&r>=1?"Reliable Executor":t>0&&i===0&&o>=60?"Reliable Finisher":"Top Performer"}async getSystemPerformance(){try{const e=new Date;e.setDate(e.getDate()-7);const t=await this.getAttendanceInRange(e,new Date,"performance"),n=[],s=[];let i=0,o=0;const r=(l,c)=>l.getFullYear()===c.getFullYear()&&l.getMonth()===c.getMonth()&&l.getDate()===c.getDate();for(let l=6;l>=0;l--){const c=new Date;c.setDate(c.getDate()-l);const p=c.toLocaleDateString("en-US",{weekday:"narrow"});s.push(p);const u=t.filter(m=>{const h=new Date(m.date);return!isNaN(h.getTime())&&r(h,c)});if(u.length===0)n.push(0);else{const m=u.map(f=>f.activityScore||0).filter(f=>f>0),h=m.length>0?m.reduce((f,w)=>f+w,0)/m.length:0;n.push(Math.round(h)),h>0&&(i+=h,o++)}}return{avgScore:o>0?Math.round(i/o):0,trendData:n,labels:s}}catch(e){return console.error("System Performance Calculation Error:",e),{avgScore:0,trendData:[0,0,0,0,0,0,0]}}}async buildDailyDashboardSummary(e={}){const t=new Date,n=String(e.dateKey||t.toISOString().split("T")[0]),s=String(e.selectedMonth||t.toISOString().slice(0,7)),[i,o]=s.split("-"),r=Number(i),d=Number(o)-1,l=Number.isInteger(r)&&Number.isInteger(d)&&d>=0&&d<=11?new Date(r,d,1):new Date(t.getFullYear(),t.getMonth(),1),c=Number.isInteger(r)&&Number.isInteger(d)&&d>=0&&d<=11?new Date(r,d+1,0):new Date(t.getFullYear(),t.getMonth()+1,0),p=Math.max(1,Number(N?.SUMMARY_POLICY?.TEAM_ACTIVITY_LIMIT)||15),[u,m]=await Promise.all([this.getHeroOfTheWeek({source:"shared_summary"}),this.getAllStaffActivities({mode:"month",month:s,scope:"all",sideEffects:!1})]);return{dateKey:n,monthKey:s,version:Number(N?.SUMMARY_POLICY?.SCHEMA_VERSION||1),generatedAt:Date.now(),hero:u&&u.state!=="fetch_error"?u:null,teamActivityPreview:(m||[]).slice(0,p),range:{startIso:l.toISOString().split("T")[0],endIso:c.toISOString().split("T")[0]},meta:{generatedAt:Date.now(),source:"client_first_writer"}}}async getAllStaffActivities(e={}){try{const t=e||{},n=t.mode||"month",s=t.scope||"all",i=t.sideEffects!==!1,o=S=>{const C=String(S||"").trim();if(!C)return"";const I=C.replace(/\s+/g,"");if(/^\d{4}-\d{2}-\d{2}$/.test(I))return I;if(/^\d{2}-\d{2}-\d{4}$/.test(I)){const[_,x,$]=I.split("-");return`${$}-${x}-${_}`}if(/^\d{4}\/\d{2}\/\d{2}$/.test(I))return I.replace(/\//g,"-");if(/^\d{2}\/\d{2}\/\d{4}$/.test(I)){const[_,x,$]=I.split("/");return`${$}-${x}-${_}`}const y=new Date(C);return Number.isNaN(y.getTime())?"":y.toISOString().split("T")[0]},r=new Date,d=new Date;if(n==="range"){const S=String(t.startIso||""),C=String(t.endIso||"");let I=o(S),y=o(C);if(!I||!y){console.warn("Invalid range dates, falling back to last 30 days:",S,C);const $=new Date,L=new Date;L.setDate($.getDate()-30),I=L.toISOString().split("T")[0],y=$.toISOString().split("T")[0]}if(I>y){const $=I;I=y,y=$}const _=new Date(I),x=new Date(y);d.setTime(_.getTime()),r.setTime(x.getTime()),d.setHours(0,0,0,0),r.setHours(23,59,59,999)}else if(n==="days"){const S=Number.isFinite(Number(t.daysBack))?Number(t.daysBack):7;r.setHours(23,59,59,999),d.setDate(d.getDate()-S),d.setHours(0,0,0,0)}else{const S=String(t.month||new Date().toISOString().slice(0,7)),[C,I]=S.split("-"),y=Number(C),_=Number(I)-1;if(!Number.isInteger(y)||!Number.isInteger(_)||_<0||_>11)throw new Error(`Invalid month key: ${S}`);const x=new Date(y,_,1),$=new Date(y,_+1,0);d.setTime(x.getTime()),r.setTime($.getTime()),d.setHours(0,0,0,0),r.setHours(23,59,59,999)}const l=d.toISOString().split("T")[0],c=r.toISOString().split("T")[0];if(i&&window.AppCalendar?.ensureCarryForwardForRange&&await window.AppCalendar.ensureCarryForwardForRange(l,c),i&&window.AppCalendar?.cleanupInvalidTodayCarryForwardForDate){const S=window.AppCalendar.getTodayKey?window.AppCalendar.getTodayKey():"";if(S&&S>=l&&S<=c)try{const C=await window.AppCalendar.cleanupInvalidTodayCarryForwardForDate(S,{onlyToday:!0});(C?.removed||0)>0&&console.log(`Team activity global cleanup removed ${C.removed} invalid carry task(s) for ${S}.`)}catch(C){console.warn("Global invalid carry cleanup failed:",C)}}const p=s!=="work",[u,m,h]=await Promise.all([p?this.getAttendanceInRange(d,r,`staffAct:${l}:${c}:${s}`):Promise.resolve([]),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:l},{field:"date",operator:"<=",value:c}]):V.getAll("work_plans"),this.getUsersCached()]),f={};h.forEach(S=>{f[S.id]=S.name});const w=[],v={},k=(S={})=>{if(window.AppCalendar?.isTaggedCopyOriginTask)return window.AppCalendar.isTaggedCopyOriginTask(S);const C=String(S.addedFrom||"").toLowerCase().trim(),I=C==="tag"||C==="delegated"||C==="staff",y=!!S.sourcePlanId||Number.isInteger(S.sourceTaskIndex)||Number.isFinite(Number(S.sourceTaskIndex));return I||y},b=(S={})=>window.AppCalendar?.hasCarryForwardLineage?window.AppCalendar.hasCarryForwardLineage(S):!!(S.carryForwardRootId||S.isAutoForwarded===!0||S.carriedForwardFromDate||S.carriedForwardFromPlanId),M=(S={})=>{if(window.AppCalendar?.resolveTaskOriginDate)return String(window.AppCalendar.resolveTaskOriginDate(S)||"");const C=String(S.carriedForwardFromDate||"").trim();if(/^\d{4}-\d{2}-\d{2}$/.test(C))return C;const I=String(S.sourcePlanId||"").match(/(\d{4}-\d{2}-\d{2})/);if(I)return I[1];const y=String(S.carryForwardRootId||"").match(/(\d{4}-\d{2}-\d{2})/);return y?y[1]:""},A=(S={})=>{if(window.AppCalendar?.hasLegacyTaggedTextPattern)return!!window.AppCalendar.hasLegacyTaggedTextPattern(S);const C=String(S.task||"");return C?(C.match(/\(Responsible:/gi)||[]).length>1:!1},g=(S={})=>{const C=String(S.status||"").trim().toLowerCase();return["completed","complete","done","finished","closed"].includes(C)?"completed":["not-completed","not completed","cancelled","canceled","removed"].includes(C)?"not-completed":["in-process","in process","working","started"].includes(C)?"in-process":["to-be-started","to be started","pending","planned"].includes(C)?"to-be-started":S.completedDate||S.completedAt||S.completed_on?"completed":""};return p&&u.forEach(S=>{const C=o(S.date);if(C&&C>=l&&C<=c&&S.workDescription){const I=S.user_id||S.userId,y=`${I}:${C}`;v[y]||(v[y]=[]),v[y].push(S.workDescription.toLowerCase().trim()),w.push({...S,type:"attendance",staffName:f[I]||S.userName||"Unknown Staff",_displayDesc:S.workDescription,_sortTime:S.checkOut||"00:00",status:"completed",date:C})}}),m.forEach(S=>{const C=o(S.date);if(C&&C>=l&&C<=c&&S.plans){const I=`${S.userId}:${C}`,y=v[I]||[];S.plans.forEach((_,x)=>{if(_?.isRemoved===!0||(()=>{const B=String(_?.status||"").trim().toLowerCase();if(B==="completed"||B==="not-completed"||B==="cancelled")return!1;const F=b(_),H=M(_),W=window.AppCalendar?.getPreviousDateKey?window.AppCalendar.getPreviousDateKey(C):(()=>{const K=new Date(`${C}T00:00:00`);return Number.isNaN(K.getTime())?"":(K.setDate(K.getDate()-1),`${K.getFullYear()}-${String(K.getMonth()+1).padStart(2,"0")}-${String(K.getDate()).padStart(2,"0")}`)})();return!!(F&&(H&&W&&H<W||H&&W&&H>W||!H||W&&H&&H!==W||String(_.carryForwardPolicy||"")&&String(_.carryForwardPolicy)!=="next_day_only")||k(_)&&A(_))})())return;const L=(_.task||"").trim().toLowerCase();if(L&&y.length>0&&y.some(R=>R.includes(L)))return;const T=S.userId||S.user_id;let E=f[T]||S.userName;E||(E=T==="annual_shared"?"All Staff":"Unknown Staff");const P=g(_);w.push({..._,date:C,id:S.id,planId:S.id,taskIndex:x,planScope:_.planScope||S.planScope||"personal",userId:T,type:"work",staffName:E,status:P,_displayDesc:_.task,_sortTime:""})})}}),w.sort((S,C)=>{const I=new Date(C.date)-new Date(S.date);return I!==0?I:C._sortTime.localeCompare(S._sortTime)}),w}catch(t){return console.error("Error fetching all staff activities:",t),[]}}}const Zi=new Qi;typeof window<"u"&&(window.AppAnalytics=Zi);class eo{constructor(){this.db=V}convertToCSV(e,t,n){const s=t.join(","),i=e.map(o=>n.map(r=>{let d=o[r]||"";return d=String(d).replace(/"/g,'""'),d.search(/("|,|\n)/g)>=0&&(d=`"${d}"`),d}).join(","));return[s,...i].join(`
`)}downloadFile(e,t,n){const s=new Blob([e],{type:n}),i=URL.createObjectURL(s),o=document.createElement("a");o.href=i,o.download=t,document.body.appendChild(o),o.click(),setTimeout(()=>{document.body.removeChild(o),window.URL.revokeObjectURL(i)},0)}summarizeTaskUpdates(e){return!Array.isArray(e)||e.length===0?"":e.map(t=>{const n=t.action||"action",s=Number.isFinite(Number(t.progressPercent))?`${Number(t.progressPercent)}%`:"",i=t.progressStatus?String(t.progressStatus).replace(/_/g," "):"",o=t.progressNote?` - ${t.progressNote}`:"",r=`${s}${s&&i?" ":""}${i}`.trim(),d=r?` (${r})`:"";return`${n}${d}${o}`.trim()}).join(" | ")}async exportAttendanceCSV(){try{const e=await this.db.getAll("users"),t=await this.db.getAll("attendance"),n={};e.forEach(l=>n[l.id]=l);const s=t.map(l=>{const c=l.user_id||l.userId,p=n[c]||{name:"Unknown",role:"N/A",rating:0,completionStats:{}};let u=l.location||"N/A";return l.lat&&l.lng&&(u=`Lat: ${Number(l.lat).toFixed(5)}, Lng: ${Number(l.lng).toFixed(5)}`),{date:l.date,name:p.name,role:p.role,rating:p.rating?p.rating.toFixed(1):"N/A",completionRate:p.completionStats?.completionRate?`${(p.completionStats.completionRate*100).toFixed(0)}%`:"N/A",checkIn:l.checkIn,checkOut:l.checkOut||"--",duration:l.duration||"--",workSummary:l.workDescription||"--",taskUpdates:this.summarizeTaskUpdates(l.taskUpdates||[]),inLocation:u,outLocation:l.checkOutLocation||"--",type:l.type||"Standard"}});e.forEach(l=>{if(l.status==="in"&&l.lastCheckIn){const c=new Date(l.lastCheckIn);s.push({date:c.toLocaleDateString(),name:l.name,role:l.role,checkIn:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:"Active Now",duration:"Working...",workSummary:"Current Session (Active)",inLocation:l.currentLocation?.address||"Current Session",outLocation:"--",type:"Office (Active)"})}}),s.sort((l,c)=>new Date(c.date)-new Date(l.date));const i=["Date","Staff Name","Role","Star Rating","Completion Rate","Check In","Check Out","Duration","Work Summary","Task Updates","Check-in Location","Check-out Location","Type"],o=["date","name","role","rating","completionRate","checkIn","checkOut","duration","workSummary","taskUpdates","inLocation","outLocation","type"],r=this.convertToCSV(s,i,o),d=`Attendance_Report_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(r,d,"text/csv"),!0}catch(e){throw console.error("Export Failed:",e),new Error("Failed to generate report")}}async exportUserLogsCSV(e,t){try{const n=t.map(d=>{let l=d.location||"N/A";return d.lat&&d.lng&&(l=`Lat: ${Number(d.lat).toFixed(5)}, Lng: ${Number(d.lng).toFixed(5)}`),{date:d.date,name:e.name,role:e.role,checkIn:d.checkIn,checkOut:d.checkOut||"--",duration:d.duration||"--",workSummary:d.workDescription||"--",taskUpdates:this.summarizeTaskUpdates(d.taskUpdates||[]),inLocation:l,outLocation:d.checkOutLocation||"--",type:d.type||"Standard"}});n.sort((d,l)=>new Date(l.date)-new Date(d.date));const s=["Date","Staff Name","Role","Check In","Check Out","Duration","Work Summary","Task Updates","Check-in Location","Check-out Location","Type"],i=["date","name","role","checkIn","checkOut","duration","workSummary","taskUpdates","inLocation","outLocation","type"],o=this.convertToCSV(n,s,i),r=`Attendance_Report_${e.name.replace(/ /g,"_")}_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(o,r,"text/csv"),!0}catch(n){console.error("Export Failed:",n),alert("Failed to export logs: "+n.message)}}async exportMasterSheetCSV(e,t,n,s){try{const i=new Date(t,e+1,0).getDate(),o=["S.No","Staff Name","Department"];for(let p=1;p<=i;p++)o.push(String(p));const r=n.sort((p,u)=>p.name.localeCompare(u.name)).map((p,u)=>{const m=[u+1,p.name,p.dept||"General"];for(let h=1;h<=i;h++){const f=`${t}-${String(e+1).padStart(2,"0")}-${String(h).padStart(2,"0")}`,w=s.filter(v=>(v.userId===p.id||v.user_id===p.id)&&v.date===f);if(w.length>0){const v=w[0];let k=v.type||"P";k==="Short Leave"&&v.durationHours&&(k=`SL(${v.durationHours}h)`),m.push(`${k} (${v.checkIn}-${v.checkOut||"Active"})`)}else m.push("-")}return m}),d=[o.join(","),...r.map(p=>p.join(","))].join(`
`),c=`Attendance_Sheet_${new Date(t,e).toLocaleString("default",{month:"long"})}_${t}.csv`;return this.downloadFile(d,c,"text/csv"),!0}catch(i){console.error("Export Failed:",i),alert("Export Failed: "+i.message)}}async exportLeavesCSV(e){try{const t=["Applied On","Staff Name","FY","Type","From","To","Days/Hrs","Reason","Status","Admin Comment"],n=["appliedOn","userName","financialYear","type","startDate","endDate","daysCount","reason","status","adminComment"],s=e.map(r=>({...r,daysCount:r.type==="Short Leave"?`${r.durationHours||0}h`:r.daysCount})),i=this.convertToCSV(s,t,n),o=`Leave_Requests_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(i,o,"text/csv"),!0}catch(t){console.error("Leave Export Failed:",t),alert("Export Failed: "+t.message)}}async exportCalendarPlansCSV(e,t,n){try{const s=[],i=new Date(n,t+1,0).getDate(),o=new Date(n,t).toLocaleString("default",{month:"long"});for(let p=1;p<=i;p++){const u=`${n}-${String(t+1).padStart(2,"0")}-${String(p).padStart(2,"0")}`;e.leaves.forEach(m=>{u>=m.startDate&&u<=m.endDate&&s.push({date:u,category:"Leave",subject:`${m.userName||"Staff"} - ${m.type}`,details:m.reason||"No reason provided",staff:m.userName||"Staff"})}),e.events.forEach(m=>{m.date===u&&s.push({date:u,category:"Event",subject:m.title,details:m.type||"General Event",staff:"Organization"})}),e.workPlans.forEach(m=>{if(m.date===u){const h=Array.isArray(m.plans)?m.plans:[],f=h.length>0?h.map((w,v)=>{let k=`${v+1}. ${w.task}`;return w.subPlans&&w.subPlans.length>0&&(k+=` (Steps: ${w.subPlans.join(", ")})`),w.tags&&w.tags.length>0&&(k+=` [With: ${w.tags.map(b=>`@${b.name} (${b.status||"pending"})`).join(", ")}]`),k}).join(" | "):"Work Plan";s.push({date:u,category:"Work Plan",subject:"Daily Goals",details:f,staff:m.userName||"Staff"})}})}if(s.length===0)return alert("No plans found for the selected month."),!1;const r=["Date","Category","Subject","Details","Staff Member"],d=["date","category","subject","details","staff"],l=this.convertToCSV(s,r,d),c=`Team_Schedule_${o}_${n}.csv`;return this.downloadFile(l,c,"text/csv"),!0}catch(s){console.error("Calendar Export Failed:",s),alert("Failed to export calendar: "+s.message)}}async exportAnnualListViewCSV(e){try{const t=(e||[]).map(r=>({date:r.date||"",staffName:r.staffName||r.staff||"",assignedBy:r.assignedBy||"",assignedTo:r.assignedTo||"",selfAssigned:r.selfAssigned?"Yes":"No",dueDate:r.dueDate||"",status:r.statusLabel||r.status||"",comments:r.comments||"",tags:Array.isArray(r.tags)?r.tags.join(", "):r.tags||""})),n=["Date","Staff Name","Assigned By","Assigned To","Self Assigned","Due Date","Completion Status","Comments","Tags"],s=["date","staffName","assignedBy","assignedTo","selfAssigned","dueDate","status","comments","tags"],i=this.convertToCSV(t,n,s),o=`Annual_Plan_List_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(i,o,"text/csv"),!0}catch(t){throw console.error("List Export Failed:",t),new Error("Failed to export list: "+t.message)}}exportTeamActivitiesXLSX(e,t={}){try{if(typeof window>"u"||!window.XLSX)return alert("Excel export library not loaded."),!1;const n=(e||[]).map(p=>[p.date||"",p.staffName||"",p.type||"",p.status||"",p.description||"",p.sourceTime||""]),s=["Date","Staff","Type","Status","Description","Time"],i=window.XLSX.utils.aoa_to_sheet([s,...n]),o=window.XLSX.utils.book_new();window.XLSX.utils.book_append_sheet(o,i,"Team Activities");const r=(t.start||"").replace(/[^a-zA-Z0-9_-]/g,"_"),d=(t.end||"").replace(/[^a-zA-Z0-9_-]/g,"_"),c=`Team_Activities_${r&&d?`${r}_to_${d}`:r||d||"export"}.xlsx`;return window.XLSX.writeFile(o,c),!0}catch(n){return console.error("Team Activities Export Failed:",n),alert("Export Failed: "+n.message),!1}}}const to=new eo;typeof window<"u"&&(window.AppReports=to);class ao{constructor(){this.db=V,this.cache={},this.defaultPolicy={"Annual Leave":{total:10,minDays:3,accrual:"annual"},"Casual Leave":{total:6,maxDays:2,accrual:"monthly"},"Medical Leave":{total:6,certificateThreshold:2,accrual:"annual"},"Maternity Leave":{total:180,paid:!0,gender:"female"},"Paternity Leave":{total:10,paid:!0,gender:"male",minServiceYears:0},"Study Leave":{total:5,paid:!1,requireApproval:!0},"Compassionate Leave":{total:3,paid:!0}}}async getPolicy(){if(this.cache.policy)return this.cache.policy;try{if(window.AppFirestore){const e=await window.AppFirestore.collection("settings").doc("policies").get();e.exists?this.cache.policy={...this.defaultPolicy,...e.data()}:this.cache.policy=this.defaultPolicy}else this.cache.policy=this.defaultPolicy}catch(e){console.warn("Failed to fetch dynamic policy, using default.",e),this.cache.policy=this.defaultPolicy}return this.cache.policy}async updatePolicy(e){try{if(window.AppFirestore)return await window.AppFirestore.collection("settings").doc("policies").set(e,{merge:!0}),this.cache.policy=null,!0;throw new Error("Database not connected")}catch(t){throw console.error("Failed to update policy:",t),t}}async getFinancialYear(e=new Date){const t=e.getMonth(),n=e.getFullYear();return t<3?{label:`${n-1}-${n}`,start:new Date(n-1,3,1),end:new Date(n,2,31)}:{label:`${n}-${n+1}`,start:new Date(n,3,1),end:new Date(n+1,2,31)}}async getUserLeaves(e,t=null){t||(t=(await this.getFinancialYear()).label);try{if(this.db.queryMany&&N?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES)return(await this.db.queryMany("leaves",[{field:"userId",operator:"==",value:e},{field:"financialYear",operator:"==",value:t}])).sort((i,o)=>new Date(o.startDate)-new Date(i.startDate))}catch(s){console.warn("Scoped getUserLeaves query failed, using fallback",s)}return(await this.db.getAll("leaves")).filter(s=>s.userId===e&&s.financialYear===t).sort((s,i)=>new Date(i.startDate)-new Date(s.startDate))}async getLeaveUsage(e,t,n){return(await this.getUserLeaves(e,n.label)).filter(o=>o.type===t&&(o.status==="Approved"||o.status==="Pending")).reduce((o,r)=>o+(parseFloat(r.daysCount)||0),0)}async getMonthlyShortLeaveUsage(e,t){const n=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}`;let s=[];try{this.db.queryMany&&N?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES&&(s=(await this.db.queryMany("leaves",[{field:"userId",operator:"==",value:e},{field:"type",operator:"==",value:"Short Leave"},{field:"startDate",operator:">=",value:`${n}-01`},{field:"startDate",operator:"<=",value:`${n}-31`}])).filter(o=>o.status==="Approved"||o.status==="Pending"))}catch(i){console.warn("Scoped short leave query failed, using fallback",i)}return s.length||(s=(await this.db.getAll("leaves")).filter(o=>o.userId===e&&o.type==="Short Leave"&&String(o.startDate||"").startsWith(n)&&(o.status==="Approved"||o.status==="Pending"))),s.reduce((i,o)=>i+(parseFloat(o.daysCount||o.durationHours)||0),0)}async getPendingLeaves(){try{let e=[];if(this.db.queryMany&&N?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES?e=(await this.db.queryMany("leaves",[{field:"status",operator:"==",value:"Pending"}],{orderBy:[{field:"appliedOn",direction:"desc"}]})).sort((n,s)=>new Date(s.appliedOn)-new Date(n.appliedOn)):e=(await this.db.getAll("leaves")).filter(n=>n.status==="Pending").sort((n,s)=>new Date(s.appliedOn)-new Date(n.appliedOn)),e.length>0){const t=await this.db.getAll("users"),n={};t.forEach(s=>{n[s.id]=s.name}),e.forEach(s=>{!s.userName&&n[s.userId]&&(s.userName=n[s.userId])})}return e}catch(e){return console.warn("getPendingLeaves failed, using fallback",e),(await this.db.getAll("leaves").catch(()=>[])).filter(n=>n.status==="Pending").sort((n,s)=>new Date(s.appliedOn)-new Date(n.appliedOn))}}async requestLeave(e){const{userId:t,startDate:n,endDate:s,type:i,durationHours:o}=e,r=new Date(n),d=new Date(s);let l=Math.ceil((d-r)/(1e3*60*60*24))+1;if(l<=0&&i!=="Short Leave")throw new Error("Invalid date range");const c=await this.getFinancialYear(r),p=await this.getLeaveUsage(t,i,c),m=(await this.getPolicy())[i],h=[];if(i==="Half Day")l=.5,e.daysCount=.5;else if(i==="Short Leave"){const w=await this.getMonthlyShortLeaveUsage(t,r);let v=parseFloat(o||0);v>2&&h.push("Short Leave exceeds 2 hours (standard)."),w+v>4&&h.push(`Monthly Short Leave limit exceeded (${w+v}/4 hours).`),e.daysCount=v}else if(i==="Annual Leave")l<(m.minDays||1)&&h.push(`Annual Leave requested is less than required minimum (${m.minDays||1} days).`),p+l>m.total&&h.push(`Annual Leave balance exceeded (${p+l}/${m.total}).`);else if(i==="Casual Leave")l>m.maxDays&&h.push(`Casual Leave exceeds maximum allowed per request (${m.maxDays} days).`),p+l>m.total&&h.push(`Casual Leave balance exceeded (${p+l}/${m.total}).`);else if(i==="Medical Leave")p+l>m.total&&h.push(`Medical Leave balance exceeded (${p+l}/${m.total}).`),l>m.certificateThreshold&&(e.requireCertificate=!0);else if(i==="Paternity Leave"){const w=await this.db.get("users",t),v=new Date(w.joinDate),k=(r-v)/(1e3*60*60*24*365.25);m.minServiceYears&&k<m.minServiceYears&&h.push(`User has not completed ${m.minServiceYears} year(s) of service (required for Paternity Leave).`),l>m.total&&h.push(`Paternity Leave exceeds limit of ${m.total} days.`)}else["Study Leave","Compassionate Leave"].includes(i)&&m&&l>m.total&&h.push(`${i} exceeds limit of ${m.total} days.`);const f={id:"l"+Date.now(),...e,status:"Pending",appliedOn:new Date().toISOString(),financialYear:c.label,daysCount:l,policyWarnings:h};return await this.db.add("leaves",f),f}async updateLeaveStatus(e,t,n,s=""){const i=await this.db.get("leaves",e);if(!i)throw new Error("Leave not found");const o=n||window.AppAuth?.getUser?.()?.id||null;if(i.status=t,i.actionDate=new Date().toISOString(),i.adminComment=s,o?i.actionBy=o:delete i.actionBy,await this.db.put("leaves",i),t==="Approved"){const r=new Date(i.startDate),d=new Date(i.endDate);let l=new Date(r);for(;l<=d;){const c=l.toISOString().split("T")[0],p={id:"att_"+i.userId+"_"+c,user_id:i.userId,date:c,checkIn:"09:00",checkOut:"17:00",duration:"8h 0m",location:"On Leave",type:i.type,status:"in",synced:!1};await this.db.put("attendance",p),l.setDate(l.getDate()+1)}}return i}}const Le=new ao;typeof window<"u"&&(window.AppLeaves=Le);class no{constructor(){this.db=V,this.cleanupFlag=N?.SIMULATION_POLICY?.LEGACY_DUMMY_CLEANUP?.FLAG_KEY||"legacy_dummy_cleanup_v1",this.simulationFlag="simulation_run_v2"}getCleanupPolicy(){const e=N?.SIMULATION_POLICY?.LEGACY_DUMMY_CLEANUP||{},t=new Set((e.TARGET_USER_IDS||[]).map(s=>String(s||"").trim()).filter(Boolean)),n=new Set((e.TARGET_USERNAMES||[]).map(s=>String(s||"").trim().toLowerCase()).filter(Boolean));return{enabled:e.ENABLED!==!1,targetIds:t,targetUsernames:n,auditCollection:String(e.AUDIT_COLLECTION||"system_audit_logs")}}async writeCleanupAudit(e,t={}){const n=this.getCleanupPolicy();try{await this.db.add(n.auditCollection,{type:e,module:"simulation",payload:t,createdAt:Date.now()})}catch(s){console.warn("Simulation audit log write failed:",s)}}async run(){const e=N&&N.READ_OPT_FLAGS||{},t=typeof window<"u"&&window.location&&window.location.hostname?window.location.hostname:"",n=t==="localhost"||t==="127.0.0.1";if(!(!e.ENABLE_SIMULATION_MODULE&&!n)){if(localStorage.getItem(this.cleanupFlag)||(await this.cleanupLegacyDummyData(),localStorage.setItem(this.cleanupFlag,"true")),localStorage.getItem(this.simulationFlag)){console.log("Simulation already ran. Use window.AppSimulation.forceRun() to force.");return}await this.forceRun(),localStorage.setItem(this.simulationFlag,"true")}}async cleanupLegacyDummyData(){const e=this.getCleanupPolicy();if(e.enabled){if(e.targetIds.size===0&&e.targetUsernames.size===0){await this.writeCleanupAudit("legacy_dummy_cleanup_skipped",{reason:"no_targets"});return}try{const n=(await this.db.getAll("users")).filter(u=>e.targetIds.has(u.id)||e.targetUsernames.has((u.username||"").trim().toLowerCase())),s=new Set(n.map(u=>u.id));if(s.size===0){await this.writeCleanupAudit("legacy_dummy_cleanup_skipped",{reason:"no_matches",configuredTargets:{ids:Array.from(e.targetIds),usernames:Array.from(e.targetUsernames)}});return}let i=0,o=0,r=0,d=0;const l=await this.db.getAll("attendance");for(const u of l){const m=u.user_id||u.userId;s.has(m)&&(await this.db.delete("attendance",u.id),i+=1)}const c=await this.db.getAll("leaves");for(const u of c){const m=u.userId||u.user_id;s.has(m)&&(await this.db.delete("leaves",u.id),o+=1)}const p=await this.db.getAll("work_plans");for(const u of p){const m=u.userId||u.user_id;s.has(m)&&(await this.db.delete("work_plans",u.id),r+=1)}for(const u of n)await this.db.delete("users",u.id),d+=1;await this.writeCleanupAudit("legacy_dummy_cleanup_completed",{matchedUserIds:Array.from(s),deleted:{attendance:i,leaves:o,workPlans:r,users:d}}),console.log("Legacy dummy users and linked records removed.",{users:d,attendance:i,leaves:o,workPlans:r})}catch(t){await this.writeCleanupAudit("legacy_dummy_cleanup_failed",{message:t?.message||String(t)}),console.warn("Legacy dummy cleanup failed:",t)}}}async forceRun(){console.log("Starting Office Scenario Simulation (V2)...");const e=new Date;if(window.AppCalendar){const t=new Date(e);t.setDate(t.getDate()+1),await window.AppCalendar.addEvent({title:"Office Picnic/Holiday",date:t.toISOString().split("T")[0],type:"holiday"})}console.log("Simulation Complete.")}}const an=new no;typeof window<"u"&&(window.AppSimulation=an,setTimeout(()=>an.run(),2e3));const oe="minutes";function Fe(){const a=window.AppAuth.getUser();if(!a||!a.id)throw new Error("User not authenticated");return a}function ft(a){return!!(window.app_hasPerm&&window.app_hasPerm("minutes","admin",a))}function so(a,e,t,n={}){const s=a&&a.createdBy===e.id,i=ft(e),o=n&&n.allowNonOwner===!0;if(!s&&!i&&!o)throw new Error("You do not have permission to edit these minutes.");if(a&&a.locked&&!(n&&n.allowOnLocked===!0))throw new Error("This record is locked.");return!t||!String(t).trim()?"Updated minutes":String(t).trim()}async function io(a={}){try{const e=a.limit||150;return window.AppDB?.queryMany?await window.AppDB.queryMany(oe,[],{orderBy:[{field:"date",direction:"desc"}],limit:e}):window.AppDB?.getAll?(await window.AppDB.getAll(oe)).sort((s,i)=>String(i.date||"").localeCompare(String(s.date||""))).slice(0,e):(await window.AppFirestore.collection(oe).orderBy("date","desc").limit(e).get()).docs.map(n=>({id:n.id,...n.data()}))}catch(e){throw console.error("Error fetching minutes:",e),e}}async function oo(a){try{const e=Fe(),t=new Date().toISOString(),n=e.name||e.username||"Unknown",s={...a,createdBy:e.id,createdByName:n,createdAt:t,lastEditedBy:e.id,lastEditedByName:n,lastEditedAt:t,auditLog:[{userId:e.id,userName:n,timestamp:t,action:"Created meeting minutes"}],approvals:{},locked:!1,restrictedFrom:[],allowedViewers:[],accessRequests:[]};return window.AppDB?await window.AppDB.add(oe,s):(await window.AppFirestore.collection(oe).add(s)).id}catch(e){throw console.error("Error adding minute:",e),e}}async function ht(a,e,t,n={}){try{const s=Fe(),i=await(window.AppDB?window.AppDB.get(oe,a):window.AppFirestore.collection(oe).doc(a).get().then(p=>p.data()));if(!i)throw new Error("Minute not found");const o=so(i,s,t,n),r=new Date().toISOString(),d=s.name||s.username||"Unknown",l={userId:s.id,userName:d,timestamp:r,action:o},c={...i,...e,id:a,lastEditedBy:s.id,lastEditedByName:d,lastEditedAt:r,auditLog:[...i.auditLog||[],l]};return window.AppDB?await window.AppDB.put(oe,c):await window.AppFirestore.collection(oe).doc(a).update(c),!0}catch(s){throw console.error("Error updating minute:",s),s}}async function ro(a){try{const e=Fe(),t=await(window.AppDB?window.AppDB.get(oe,a):window.AppFirestore.collection(oe).doc(a).get().then(s=>s.data()));if(!t)throw new Error("Minute not found");const n=t.accessRequests||[];return n.some(s=>s.userId===e.id)?!0:(n.push({userId:e.id,userName:e.name||e.username||"Unknown",status:"pending",requestedAt:new Date().toISOString()}),await ht(a,{accessRequests:n},`Requested access for ${e.name||e.username}`,{allowNonOwner:!0,allowOnLocked:!0}))}catch(e){throw console.error("Error requesting access:",e),e}}async function lo(a,e,t){try{const n=Fe(),s=await(window.AppDB?window.AppDB.get(oe,a):window.AppFirestore.collection(oe).doc(a).get().then(c=>c.data()));if(!s)throw new Error("Minute not found");const i=s.createdBy===n.id,o=ft(n);if(!i&&!o)throw new Error("Only owner or admin can review access requests.");const r=s.accessRequests||[],d=r.find(c=>c.userId===e);if(!d)return!0;d.status=t;const l=s.allowedViewers||[];return t==="approved"&&!l.includes(e)&&l.push(e),await ht(a,{accessRequests:r,allowedViewers:l},`${String(t||"").toUpperCase()} access request for userId: ${e}`,{allowOnLocked:!0})}catch(n){throw console.error("Error handling access request:",n),n}}async function co(a,e,t){try{const n=Fe(),s=await(window.AppDB?window.AppDB.get(oe,a):window.AppFirestore.collection(oe).doc(a).get().then(l=>l.data()));if(!s||!s.actionItems)throw new Error("Minute or tasks not found");const i=s.actionItems[e];if(!i)throw new Error("Task not found");const o=s.createdBy===n.id,r=ft(n),d=i.assignedTo===n.id;if(!o&&!r&&!d)throw new Error("Only owner, admin, or assignee can update this task.");return i.status=t,t==="completed"&&(i.completedAt=new Date().toISOString()),await ht(a,{actionItems:s.actionItems},`Updated Task: ${i.task} to ${t}`,{allowNonOwner:!0,allowOnLocked:!0})}catch(n){throw console.error("Error updating action item:",n),n}}async function po(a){try{const e=Fe(),t=await(window.AppDB?window.AppDB.get(oe,a):window.AppFirestore.collection(oe).doc(a).get().then(c=>c.data()));if(!t)throw new Error("Minute not found");const n=t.attendeeIds||[],s=n.includes(e.id),i=t.createdBy===e.id,o=ft(e);if(!s&&!i&&!o)throw new Error("Only attendees, owner, or admin can approve minutes.");const r=t.approvals||{};r[e.id]=new Date().toISOString();const d=n.length>0&&n.every(c=>r[c]),l={approvals:r};return d&&(l.locked=!0),await ht(a,l,`${d?"FINAL APPROVAL & LOCK":"Signed"} by ${e.name||e.username}`,{allowNonOwner:!0,allowOnLocked:!0})}catch(e){throw console.error("Error approving minute:",e),e}}async function uo(a){try{const e=Fe(),t=await(window.AppDB?window.AppDB.get(oe,a):window.AppFirestore.collection(oe).doc(a).get().then(i=>i.data()));if(!t)throw new Error("Minute not found");const n=t.createdBy===e.id,s=ft(e);if(!n&&!s)throw new Error("Only owner or admin can delete minutes.");return window.AppDB?await window.AppDB.delete(oe,a):(await window.AppFirestore.collection(oe).doc(a).delete(),!0)}catch(e){throw console.error("Error deleting minute:",e),e}}const mo={getMinutes:io,addMinute:oo,updateMinute:ht,approveMinute:po,deleteMinute:uo,requestAccess:ro,handleAccessRequest:lo,updateActionItemStatus:co};typeof window<"u"&&(window.AppMinutes=mo);const Ra={async renderPolicyEditor(){const a=await Le.getPolicy();return`
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
        `},setupGlobalHandlers(){window.app_savePolicyChanges=async a=>{a.preventDefault();const e=new FormData(a.target),t=await Le.getPolicy(),n={};Object.keys(t).forEach(s=>{n[s]={...t[s]};const i=l=>{const c=e.get(l);return c!==""&&c!==null?parseInt(c):void 0},o=i(`${s}_total`);o!==void 0&&(n[s].total=o);const r=i(`${s}_min`);r!==void 0?n[s].minDays=r:delete n[s].minDays;const d=i(`${s}_max`);d!==void 0?n[s].maxDays=d:delete n[s].maxDays});try{await Le.updatePolicy(n);const s=a.target.querySelector("button"),i=s.innerHTML;s.innerHTML='<i class="fa-solid fa-check"></i> Saved!',s.style.background="#166534",setTimeout(()=>{s.innerHTML=i,s.style.background="",window.location.reload()},1e3)}catch(s){alert("Failed to update policy: "+s.message)}},window.app_approveLeaveWithWarning=async a=>{const e=await window.appPrompt("Reason for override:","",{title:"Leave Override",confirmText:"Approve With Reason",placeholder:"Enter reason"});if(e)try{await Le.updateLeaveStatus(a,"Approved",te.getUser().id,`[Overridden] ${e}`),window.location.reload()}catch(t){alert(t.message)}}}};Ra.setupGlobalHandlers();typeof window<"u"&&(window.AppAdminPolicies=Ra);const fo={currentYear:new Date().getFullYear(),holidayCache:null,baseline2025:[{name:"Republic Day",date:"2025-01-26",type:"National"},{name:"Maha Shivaratri",date:"2025-02-26",type:"Regional"},{name:"Holi",date:"2025-03-14",type:"Regional"},{name:"Id-ul-Fitr",date:"2025-03-31",type:"Regional"},{name:"Good Friday",date:"2025-04-18",type:"Regional"},{name:"Independence Day",date:"2025-08-15",type:"National"},{name:"Dussehra",date:"2025-10-02",type:"Regional"},{name:"Gandhi Jayanti",date:"2025-10-02",type:"National"},{name:"Diwali",date:"2025-10-20",type:"Regional"},{name:"Christmas",date:"2025-12-25",type:"Regional"}],async render(){const a=await Le.getPolicy(),e=te.getUser(),t=await Le.getFinancialYear(),n=window.app_hasPerm("policies","admin",e);let s=0;try{const d=new Date,l=d.getDay(),c=d.getDate()-l+(l===0?-6:1),p=new Date(d.setDate(c));p.setHours(0,0,0,0);const u=p.toISOString().split("T")[0];s=(await V.getAll("attendance")).filter(f=>f.user_id===e.id&&f.date>=u).filter(f=>f.checkIn?f.lateCountable===!0?!0:yn.normalizeType(f.type)==="Late":!1).length}catch(d){console.warn("Error calc lates",d)}const i=Object.keys(a).map(async d=>{const l=await Le.getLeaveUsage(e.id,d,t);return{type:d,usage:l,total:a[d].total,icon:this.getIconForType(d),color:this.getColorForType(d)}}),o=await Promise.all(i),r=await this.renderHolidayTable(this.currentYear,n);return`
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
                                <div class="policies-late-value">${s} <span>(${Math.floor(s/3)} block(s) reached)</span></div>
                            </div>
                        </div>

                        <div class="policies-leave-grid">
                            ${o.map(d=>this.renderLeaveCard(d.type,d,d.icon,d.color)).join("")}
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
                        ${n?`
                            <div style="display:flex; justify-content:flex-end; margin-bottom:0.5rem;">
                                <button class="action-btn" onclick="window.AppPolicies.openHolidayEditor()">
                                    <i class="fa-solid fa-plus"></i> Add Holiday
                                </button>
                            </div>
                        `:""}
                        <div id="holidays-container" class="table-container policies-holidays-table">
                            ${r}
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

                ${n?await Ra.renderPolicyEditor():""}
            </div>
            `},async loadHolidaySettings(){if(this.holidayCache)return this.holidayCache;const a=await V.get("settings","holidays").catch(()=>null),e=a&&a.byYear?a:{id:"holidays",byYear:{}};return this.holidayCache=e,e},async saveHolidaySettings(a){const e={id:"holidays",byYear:a.byYear||{}};await V.put("settings",e),this.holidayCache=e},buildYearFromBaseline(a){return this.baseline2025.map(e=>{const t=String(e.date).slice(5);return{name:e.name,date:`${a}-${t}`,type:e.type||"Regional"}}).sort((e,t)=>new Date(e.date)-new Date(t.date))},async getHolidaysForYear(a,e=!0){const t=await this.loadHolidaySettings(),n=String(a);return(!Array.isArray(t.byYear[n])||t.byYear[n].length===0)&&(t.byYear[n]=this.buildYearFromBaseline(a),e&&await this.saveHolidaySettings(t)),[...t.byYear[n]].sort((s,i)=>new Date(s.date)-new Date(i.date))},async renderHolidayTable(a,e){const t=await this.getHolidaysForYear(a);return`
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
            `}).join(""):`<tr><td colspan="${t?3:2}" class="policies-empty-holiday">No holiday data available for ${a}</td></tr>`},async changeYear(a){this.currentYear+=a;const e=document.getElementById("policy-year-label"),t=document.getElementById("holidays-container"),n=te.getUser(),s=window.app_hasPerm("policies","admin",n);e&&t&&(e.textContent=this.currentYear,t.innerHTML=await this.renderHolidayTable(this.currentYear,s))},async openHolidayEditor(a=null){const e=te.getUser();if(!e||!window.app_hasPerm("policies","admin",e))return;const t=this.currentYear,n=await this.getHolidaysForYear(t),s=Number.isInteger(a)?n[a]:null,i=`holiday-editor-${Date.now()}`,o=`
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
            `;typeof window.app_showModal=="function"?window.app_showModal(o,i):(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",o)},async saveHoliday(a,e=null){a.preventDefault();const t=this.currentYear,n=(document.getElementById("holiday-name-input")?.value||"").trim(),s=String(document.getElementById("holiday-date-input")?.value||"").trim(),i=(document.getElementById("holiday-type-input")?.value||"Regional").trim();if(!n||!s){alert("Please provide holiday name and date.");return}if(!s.startsWith(`${t}-`)){alert(`Date must be within ${t}.`);return}const o=await this.loadHolidaySettings(),r=String(t),d=Array.isArray(o.byYear[r])?[...o.byYear[r]]:this.buildYearFromBaseline(t),l={name:n,date:s,type:i==="National"?"National":"Regional"};Number.isInteger(e)&&d[e]?d[e]=l:d.push(l),o.byYear[r]=d.sort((c,p)=>new Date(c.date)-new Date(p.date)),await this.saveHolidaySettings(o),document.querySelector('.modal-overlay[id^="holiday-editor-"]')?.remove(),await this.changeYear(0)},async deleteHoliday(a){const e=te.getUser();if(!e||!window.app_hasPerm("policies","admin",e)||!await window.appConfirm("Delete this holiday from current year?"))return;const n=this.currentYear,s=await this.loadHolidaySettings(),i=String(n),o=Array.isArray(s.byYear[i])?[...s.byYear[i]]:[];o[a]&&(o.splice(a,1),s.byYear[i]=o,await this.saveHolidaySettings(s),await this.changeYear(0))},getIconForType(a){return{"Annual Leave":"calendar-check","Casual Leave":"mug-hot","Medical Leave":"staff-snake","Maternity Leave":"baby-carriage","Paternity Leave":"baby","Study Leave":"graduation-cap","Compassionate Leave":"hand-holding-heart","Short Leave":"clock"}[a]||"file-circle-check"},getColorForType(a){return{"Annual Leave":"#0f766e","Casual Leave":"#ea580c","Medical Leave":"#dc2626","Maternity Leave":"#be185d","Paternity Leave":"#1d4ed8","Study Leave":"#6d28d9","Compassionate Leave":"#9333ea","Short Leave":"#475569"}[a]||"#64748b"},renderLeaveCard(a,e,t,n){const s=Math.min(100,e.usage/e.total*100);return`
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
            `}};typeof window<"u"&&(window.AppPolicies=fo);function J(a,e={}){const t=document.createElement(a);if(e.id&&(t.id=e.id),e.className&&(t.className=e.className),e.textContent&&(t.textContent=e.textContent),e.innerHTML&&(t.innerHTML=e.innerHTML),e.attributes)for(const[n,s]of Object.entries(e.attributes))t.setAttribute(n,s);if(e.children)for(const n of e.children)t.appendChild(n);return t}function ge(a={}){const e=J("button",{className:a.className,textContent:a.textContent,innerHTML:a.innerHTML,attributes:{type:"button",...a.attributes}});return a.onClick&&e.addEventListener("click",a.onClick),e}const Ie=a=>String(a??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");function ho(a,e,t,n,s){const i=J("h3",{textContent:"Plan Your Day"}),o=J("p",{className:"day-plan-subline",textContent:`${a}${e?` - Editing for ${t}`:""}`}),r=n?ge({className:"day-plan-delete-btn",attributes:{title:"Delete plan"},innerHTML:'<i class="fa-solid fa-trash"></i>',onClick:()=>window.app_deleteDayPlan(a,s)}):null,d=ge({className:"day-plan-close-btn",attributes:{title:"Close"},innerHTML:'<i class="fa-solid fa-xmark"></i>',onClick:c=>c.currentTarget.closest(".day-plan-modal-overlay").remove()}),l=J("div",{className:"day-plan-header-actions",children:[r,d].filter(Boolean)});return J("div",{className:"day-plan-header",children:[J("div",{className:"day-plan-headline",children:[i,o]}),l]})}function yo(a,e,t,n,s,i,o,r,d,l){const c=J("div",{className:"day-plan-scroll-area personal-plans-container",attributes:{"data-scope":"personal"}}),p=J("div",{className:"day-plan-scroll-area others-plans-container",attributes:{"data-scope":"annual"}});s.forEach((v,k)=>{const b=dt({plan:v,idx:k,allUsers:i,targetId:e,defaultScope:o,selectableCollaborators:r,isAdmin:d,currentUserId:l.id,isReference:v.isReference});(v.planScope||v._planScope||o)==="annual"||v.isReference?p.appendChild(b):c.appendChild(b)});const u=J("div",{className:"day-plan-columns",children:[J("div",{className:"day-plan-column",children:[J("div",{className:"day-plan-column-head",children:[J("h4",{className:"day-plan-column-title",textContent:"Self Plan"}),ge({className:"btn-premium-add",innerHTML:'<i class="fa-solid fa-plus-circle"></i> <span>Add Personal Plan (@)</span>',onClick:()=>rt({date:a,targetId:e,scope:"personal",allUsers:i,selectableCollaborators:r,isAdmin:d,container:c})})]}),c]}),J("div",{className:"day-plan-column",children:[J("div",{className:"day-plan-column-head",children:[J("h4",{className:"day-plan-column-title",textContent:"Others' & Annual Plans"}),ge({className:"btn-premium-add",innerHTML:'<i class="fa-solid fa-plus-circle"></i> <span>Add Annual Plan (@)</span>',onClick:()=>rt({date:a,targetId:e,scope:"annual",allUsers:i,selectableCollaborators:r,isAdmin:d,container:p})})]}),p]})]}),m=ge({className:"day-plan-discard-btn",textContent:"Discard",onClick:v=>v.currentTarget.closest(".day-plan-modal-overlay").remove()}),h=ge({className:"day-plan-save-btn",innerHTML:'<i class="fa-solid fa-check-circle"></i> <span>Save Plan</span>',attributes:{type:"submit"}}),f=J("div",{className:"day-plan-footer",children:[J("div",{className:"day-plan-actions",children:[m,h]})]}),w=J("form",{className:"day-plan-form",attributes:{"data-had-personal":t?"1":"0","data-had-annual":n?"1":"0","data-removed-tasks":"[]"},children:[u,f]});return w.addEventListener("submit",v=>window.app_saveDayPlan(v,a,e)),w}function rt(a){const{date:e,targetId:t,scope:n,allUsers:s,selectableCollaborators:i,isAdmin:o,container:r,existingBlock:d=null}=a,l=te.getUser(),c=d?window.app_extractBlockData(d):{task:"",subPlans:[],tags:[],status:null,assignedTo:t,startDate:e,endDate:e,planScope:n,carryForwardRootId:"",isRemoved:!1},p=J("div",{className:"plan-editor-overlay"}),u=J("div",{className:"plan-editor-modal"}),m=J("div",{className:"plan-editor-head",innerHTML:`<h4>${d?"Edit":"Add"} ${n==="annual"?"Annual":"Personal"} Plan</h4>`}),h=J("div",{className:"plan-editor-body"}),f=J("textarea",{className:"plan-editor-textarea",textContent:c.task,attributes:{placeholder:"What is the objective or task for today?",required:!0}}),w=J("div",{className:"plan-editor-grid"}),v=J("div",{className:"plan-editor-field"});v.innerHTML="<label>Status</label>";const k=J("select",{className:"plan-editor-select"});k.innerHTML=`
        <option value="" ${c.status?"":"selected"}>Auto-Track</option>
        <option value="completed" ${c.status==="completed"?"selected":""}>Completed</option>
        <option value="in-process" ${c.status==="in-process"?"selected":""}>In Progress</option>
        <option value="not-completed" ${c.status==="not-completed"?"selected":""}>Not Completing</option>
    `,v.appendChild(k);let b=null;if(o){const S=J("div",{className:"plan-editor-field"});S.innerHTML="<label>Assign To</label>",b=J("select",{className:"plan-editor-select"}),s.forEach(C=>{const I=J("option",{textContent:C.name,attributes:{value:C.id,selected:C.id===c.assignedTo}});b.appendChild(I)}),S.appendChild(b),w.appendChild(S)}h.appendChild(f),h.appendChild(w);const M=J("div",{className:"plan-editor-footer"}),A=ge({className:"day-plan-discard-btn",textContent:"Cancel",onClick:()=>p.remove()}),g=ge({className:"day-plan-save-btn",textContent:d?"Update":"Add to List",onClick:()=>{const S=f.value.trim();if(!S)return alert("Please enter a task description");const I={plan:{...c,task:S,status:k.value,assignedTo:b?b.value:c.assignedTo||t,tags:Array.isArray(c.tags)?c.tags:[]},allUsers:s,targetId:t,selectableCollaborators:i,isAdmin:o,currentUserId:l.id};if(d){const y=dt({...I,idx:Number.parseInt(d.getAttribute("data-index"))});d.replaceWith(y)}else{const y=dt({...I,idx:r.querySelectorAll(".plan-block").length});r.appendChild(y)}p.remove()}});M.appendChild(A),M.appendChild(g),u.appendChild(m),u.appendChild(h),u.appendChild(M),p.appendChild(u),document.getElementById("modal-container").appendChild(p),f.focus()}function dt(a){const{plan:e={},idx:t=0,allUsers:n=[],targetId:s,defaultScope:i="personal",selectableCollaborators:o=[],isAdmin:r=!1,currentUserId:d="",isReference:l=!1}=a||{},c=String(e.task||""),p=e.assignedTo||s||d,u=e.startDate||"",m=e.endDate||"",h=String(e.planScope||e._planScope||i)==="annual"?"annual":"personal",f=l?e.userName?`${e.userName}'s Plan`:"Others Plan":h==="annual"?"Annual Plan":"Personal Plan",w=c.trim()?c.trim().length>120?`${c.trim().slice(0,120)}...`:c.trim():"New task",v=J("div",{className:(l?"plan-block-ref":"plan-block")+(l?" is-reference-only":""),attributes:{"data-index":t}}),k=J("div",{className:"dp-hidden-data",attributes:{style:"display:none;"}});k.innerHTML=`
        <textarea class="plan-task">${Ie(c)}</textarea>
        <select class="plan-status"><option value="${Ie(e.status||"")}" selected></option></select>
        <select class="plan-scope"><option value="${Ie(h)}" selected></option></select>
        <select class="plan-assignee"><option value="${Ie(p)}" selected></option></select>
        <input class="plan-start-date" value="${Ie(u)}">
        <input class="plan-end-date" value="${Ie(m)}">
        <input class="plan-root-id" value="${Ie(e.carryForwardRootId||"")}">
        <input class="plan-removed-flag" value="${e.isRemoved===!0?"1":"0"}">
    `,e.subPlans&&e.subPlans.forEach(g=>{const S=J("input",{className:"sub-plan-input",attributes:{value:Ie(g)}});k.appendChild(S)}),e.tags&&e.tags.forEach(g=>{const S=J("div",{className:"tag-chip",attributes:{"data-id":g.id,"data-name":g.name,"data-status":g.status||"pending"}});k.appendChild(S)}),v.appendChild(k);const b=J("div",{className:"plan-block-header"}),M=J("div",{className:"plan-block-title-group"});M.appendChild(J("span",{className:"day-plan-index-badge",textContent:t+1})),M.appendChild(J("span",{className:"plan-block-summary",textContent:w}));const A=J("div",{className:"plan-block-actions"});if(A.appendChild(J("span",{className:"day-plan-scope-pill",textContent:f})),l||(A.appendChild(ge({className:"day-plan-edit-btn",attributes:{title:"Edit plan"},innerHTML:'<i class="fa-solid fa-pen-to-square"></i>',onClick:()=>rt({date:u,targetId:s,scope:h,allUsers:n,selectableCollaborators:o,isAdmin:r,container:v.parentElement,existingBlock:v})})),t>0?A.appendChild(ge({className:"day-plan-remove-btn",attributes:{title:"Remove task"},innerHTML:'<i class="fa-solid fa-trash-can"></i>',onClick:()=>window.app_markTaskRemoved(v)})):A.appendChild(ge({className:"day-plan-remove-btn",attributes:{title:"Remove task"},innerHTML:'<i class="fa-solid fa-trash-can"></i>',onClick:()=>window.app_markTaskRemoved(v)}))),b.appendChild(M),b.appendChild(A),v.appendChild(b),e.tags&&e.tags.length>0){const g=J("div",{className:"plan-block-body"});e.tags.forEach(S=>{const C=J("span",{className:"day-plan-tag-pill",textContent:`@${S.name}`});g.appendChild(C)}),v.appendChild(g)}return v}function Oa(a){if(!a)return null;const e=a.querySelector(".plan-task")?.value||"",t=a.querySelector(".plan-status")?.value||"",n=a.querySelector(".plan-scope")?.value||"personal",s=a.querySelector(".plan-assignee")?.value||"",i=a.querySelector(".plan-start-date")?.value||"",o=a.querySelector(".plan-end-date")?.value||"",r=a.querySelector(".plan-root-id")?.value||"",d=a.querySelector(".plan-removed-flag")?.value==="1",l=Array.from(a.querySelectorAll(".sub-plan-input")).map(p=>p.value),c=Array.from(a.querySelectorAll(".tag-chip")).map(p=>({id:p.dataset.id,name:p.dataset.name,status:p.dataset.status}));return{task:e,status:t,planScope:n,assignedTo:s,startDate:i,endDate:o,subPlans:l,tags:c,carryForwardRootId:r,isRemoved:d}}const wo=a=>!a||typeof a!="object"?!1:a.isAutoForwarded===!0||!!a.carryForwardRootId||!!a.carriedForwardFromDate||!!a.carriedForwardFromPlanId||!!a.autoForwardedAt;async function Kn(a,e=null,t=null,n={}){const s=te.getUser(),i=String(e??"").trim(),o=!i||i==="undefined"||i==="null"?s.id:i,r=await V.getAll("users"),d=s.role==="Administrator"||s.isAdmin,l=o!==s.id,c=t==="annual"?"annual":"personal",p=n?.hideAutoForwardedTasks===!0,u=n?.skipCarryForwardSync===!0,m=n?.skipCarryForwardCleanup===!0;window.app_currentDayPlanTargetId=o,!u&&ce?.ensureCarryForwardForDate&&a<=ce.getTodayKey()&&await ce.ensureCarryForwardForDate(a,{userIds:[o]});const h=ce?.getTodayKey?ce.getTodayKey():"";if(!m&&ce?.cleanupInvalidTodayCarryForward&&a===h)try{const T=await ce.cleanupInvalidTodayCarryForward(o,a,{onlyToday:!0});(T?.removed||0)>0&&console.log(`Day plan cleanup removed ${T.removed} invalid carry-forward task(s) for ${o} on ${a}.`)}catch(T){console.warn("Failed to cleanup invalid today carry-forward tasks:",T)}const[f,w,v]=await Promise.all([ce.getWorkPlan(o,a,{planScope:"personal"}),ce.getWorkPlan(o,a,{planScope:"annual"}),V.queryMany("work_plans",[{field:"date",operator:"==",value:a}])]),k=!!(f||w),b=r.find(T=>T.id===o),M=b?b.name:"Staff",A=r.filter(T=>T.id!==o),g=(T,E,P=null)=>T?Array.isArray(T.plans)&&T.plans.length>0?T.plans.map(B=>({...B,planScope:E,userName:P||T.userName,isReference:!!P})).filter(B=>B.isRemoved!==!0&&(!p||!wo(B))):[]:[],S=(v||[]).filter(T=>T.id!==ce.getWorkPlanId(a,o,"personal")&&T.id!==ce.getWorkPlanId(a,o,"annual")),C=[];S.forEach(T=>{C.push(...g(T,T.planScope,T.userName))});const I=[...g(f,"personal"),...g(w,"annual"),...C];I.length===0&&I.push({task:"",subPlans:[],tags:[],status:null,assignedTo:o,startDate:a,endDate:a,planScope:c});const y=J("div",{id:"day-plan-modal",className:"day-plan-modal-overlay"}),_=J("div",{className:"day-plan-content"});_.appendChild(ho(a,l,M,k,o)),_.appendChild(yo(a,o,f,w,I,r,c,A,d,s)),y.appendChild(_);const x=document.getElementById("modal-container");if(!x)return;const $=document.getElementById("day-plan-modal");$&&$.remove(),x.appendChild(y);const L=document.getElementById("day-plan-modal");if(L){const E=Array.from(document.querySelectorAll(".modal-overlay, .modal")).filter(P=>P!==L).reduce((P,B)=>{const R=Number.parseInt(window.getComputedStyle(B).zIndex,10);return Number.isFinite(R)?Math.max(P,R):P},1e3);L.style.zIndex=String(E+2)}}async function Vn(a=null){const e=document.getElementById("day-plan-modal");if(!e)return;const t=a||"personal",n=t==="annual"?e.querySelector(".others-plans-container"):e.querySelector(".personal-plans-container"),s=e.querySelector(".day-plan-headline p")?.textContent?.match(/\d{4}-\d{2}-\d{2}/),i=s?s[0]:new Date().toISOString().split("T")[0],o=await V.getAll("users"),r=te.getUser(),d=window.app_currentDayPlanTargetId||r.id,l=r.role==="Administrator"||r.isAdmin,c=o.filter(p=>p.id!==d);rt({date:i,targetId:d,scope:t,allUsers:o,selectableCollaborators:c,isAdmin:l,container:n})}const go={openDayPlan:Kn,dayPlanRenderBlockV3:dt,addPlanBlockUI:Vn,openPlanEditor:rt,app_extractBlockData:Oa};window.AppDayPlan=go;window.app_openDayPlan=Kn;window.app_dayPlanRenderBlockV3=dt;window.app_addPlanBlockUI=Vn;window.app_extractBlockData=Oa;window.app_markTaskRemoved=function(a){if(!a)return;const e=a.closest(".day-plan-form"),t=Oa(a),n=t?.carryForwardRootId||"";if(e&&n){let s=[];try{s=JSON.parse(e.dataset.removedTasks||"[]")}catch{s=[]}const i=t?.planScope==="annual"?"annual":"personal";s.find(o=>o&&o.rootId===n&&o.scope===i)||(s.push({rootId:n,scope:i}),e.dataset.removedTasks=JSON.stringify(s))}a.remove()};const nn={isWidgetMode:!1,syncInterval:null,init(){console.log("Widget Module Initialized"),new URLSearchParams(window.location.search).get("mode")==="widget"&&(this.isWidgetMode=!0),this.isWidgetMode&&this.enableWidgetMode()},toggle(){if(this.isWidgetMode)this.isWidgetMode=!1,window.opener||window.name==="CRWIWidget"?window.close():this.disableWidgetMode();else{const t=window.screen.width-320-20;window.open(window.location.origin+window.location.pathname+"?mode=widget#dashboard","CRWIWidget",`width=320,height=420,left=${t},top=40,menubar=no,toolbar=no,location=no,status=no,resizable=yes`)}},enableWidgetMode(){document.body.classList.add("widget-mode"),this.renderWidgetView(),this.startSync(),window.resizeTo&&window.resizeTo(320,420)},disableWidgetMode(){document.body.classList.remove("widget-mode");const a=document.getElementById("widget-view");a&&a.remove(),this.stopSync()},startSync(){this.syncInterval&&clearInterval(this.syncInterval),this.syncInterval=setInterval(()=>this.sync(),500)},stopSync(){this.syncInterval&&clearInterval(this.syncInterval)},sync(){if(!this.isWidgetMode)return;const a=document.getElementById("timer-display"),e=document.getElementById("timer-label"),t=document.querySelector(".check-in-widget .status-dot")||document.querySelector('.check-in-widget [style*="background: #10b981"]')||document.querySelector('.check-in-widget [style*="background: #94a3b8"]'),n=document.getElementById("attendance-btn"),s=document.getElementById("attendance-pause-btn"),i=document.getElementById("location-text"),o=document.getElementById("countdown-container"),r=document.getElementById("countdown-label"),d=document.getElementById("countdown-value"),l=document.getElementById("countdown-progress"),c=document.getElementById("overtime-container"),p=document.getElementById("overtime-value"),u=document.getElementById("widget-view");if(!u)return;const m=u.querySelector("#timer-display"),h=u.querySelector("#timer-label"),f=u.querySelector(".status-dot-indicator"),w=u.querySelector("#attendance-btn"),v=u.querySelector("#widget-pause-btn"),k=u.querySelector("#location-text"),b=u.querySelector("#countdown-container"),M=u.querySelector("#countdown-label"),A=u.querySelector("#countdown-value"),g=u.querySelector("#countdown-progress"),S=u.querySelector("#overtime-container"),C=u.querySelector("#overtime-value");if(a&&m&&(m.innerHTML=a.innerHTML,m.style.color=a.style.color),e&&h&&(h.innerHTML=e.innerHTML),t&&f&&(f.style.background=t.style.background||(t.classList.contains("online")?"#10b981":"#94a3b8")),o&&b&&(b.style.display=o.style.display,r&&M&&(M.innerHTML=r.innerHTML),d&&A&&(A.innerHTML=d.innerHTML),l&&g&&(g.style.width=l.style.width)),c&&S&&(S.style.display=c.style.display,p&&C&&(C.innerHTML=p.innerHTML)),n&&w&&(w.innerHTML=n.innerHTML,w.className=n.className,w.disabled=n.disabled),v)if(s){v.style.display="",v.innerHTML=s.innerHTML,v.className=s.className,v.disabled=s.disabled;const I=String(s.getAttribute("onclick")||"");v.dataset.action=I.includes("app_resumeSession")?"resume":"pause"}else v.style.display="none",v.dataset.action="",v.disabled=!0;i&&k&&(k.innerHTML=i.innerHTML)},handleWidgetAction(){if(window.opener&&!window.opener.closed)try{if(window.opener.focus(),window.opener.location.hash!=="#dashboard"&&(window.opener.location.hash="#dashboard"),window.opener.app_handleAttendance){window.opener.app_handleAttendance();return}}catch(t){console.warn("Could not communicate with main window:",t)}console.log("Opener lost or closed. Reopening main app...");const a=window.location.origin+window.location.pathname+"#dashboard",e=window.open(a,"CRWIMainApp");if(e){e.focus();const t=document.getElementById("attendance-btn");if(t){const n=t.innerHTML;t.innerHTML='<i class="fa-solid fa-arrow-up-right-from-square"></i> Opening App...',setTimeout(()=>{t.innerHTML=n},3e3)}}else alert("Please allow popups or open the main application window manually.")},handleWidgetPauseAction(){const a=document.getElementById("widget-pause-btn"),e=(a?.dataset?.action||"").toLowerCase(),t=i=>i?e==="resume"&&typeof i.app_resumeSession=="function"?(i.app_resumeSession(),!0):e==="pause"&&typeof i.app_pauseSession=="function"?(i.app_pauseSession(),!0):!1:!1;if(window.opener&&!window.opener.closed)try{if(window.opener.focus(),window.opener.location.hash!=="#dashboard"&&(window.opener.location.hash="#dashboard"),t(window.opener))return}catch(i){console.warn("Could not communicate with main window for pause action:",i)}const n=window.location.origin+window.location.pathname+"#dashboard",s=window.open(n,"CRWIMainApp");if(s){if(s.focus(),a){const i=a.innerHTML;a.innerHTML='<i class="fa-solid fa-arrow-up-right-from-square"></i> Opening App...',setTimeout(()=>{a.innerHTML=i},3e3)}}else alert("Please allow popups or open the main application window manually.")},renderWidgetView(){let a=document.getElementById("widget-view");a||(a=document.createElement("div"),a.id="widget-view",document.body.appendChild(a));const e=window.AppAuth&&window.AppAuth.getUser()||{name:"User",role:"Staff",avatar:"https://via.placeholder.com/48"};a.innerHTML=`
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
        `}};typeof window<"u"&&(window.Widget=nn,nn.init());var ea={buildId:"ce7a739-1775036868734",commitSha:"ce7a7395ac547d029cce4db5ea90c253d0a5edbf",builtAt:"2026-04-01T09:47:48.733Z"};let ta=null,Se=[],Ce=null,Me=null,Ue=0,be=!1,et=null,aa=!1,Gn=0,wa=null,_t=null,$t=null,ga=!1,nt=null,Ge=null;const Tt=Object.freeze(typeof ea=="object"&&ea?ea:{buildId:"local",commitSha:"",builtAt:""}),bo="/version.json",vo=6e4,ba="release_signal",sn="app_meta",Jn="app_last_seen_release_id",Q={active:!1,releaseId:"",buildId:"",commitSha:"",deployedAt:"",notes:"",source:"",popupDismissed:!1},Xn=18e4,So=6e5;window.app_annualYear=new Date().getFullYear();const Ao=()=>{try{return localStorage.getItem(Jn)||""}catch{return""}},Qn=a=>{try{localStorage.setItem(Jn,String(a||""))}catch{}},Zn=(a={},e="version")=>{const t=String(a.buildId||a.releaseId||a.commitSha||"").trim();return t?{releaseId:t,buildId:t,commitSha:String(a.commitSha||"").trim(),deployedAt:String(a.deployedAt||a.builtAt||"").trim(),notes:String(a.notes||"").trim(),source:String(e||a.source||"version").trim()}:null},yt=()=>({active:!!Q.active,releaseId:Q.releaseId||"",buildId:Q.buildId||"",commitSha:Q.commitSha||"",deployedAt:Q.deployedAt||"",notes:Q.notes||"",source:Q.source||"",popupDismissed:!!Q.popupDismissed,currentBuildId:Tt.buildId||"",currentCommitSha:Tt.commitSha||"",currentBuiltAt:Tt.builtAt||""});window.app_getReleaseUpdateState=()=>yt();const lt=()=>{const a=yt(),e=document.querySelector(".dashboard-refresh-link");e&&(a.active?(e.classList.add("is-update-pending"),e.setAttribute("title","Update available. Click to refresh into the new version."),e.textContent="System update available"):(e.classList.remove("is-update-pending"),e.setAttribute("title","Check for System Update (Ctrl+Shift+R)"),e.textContent="Check for System Update"))};window.app_applyUpdateCtaState=lt;const Fa=()=>{lt(),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:update-state",{detail:yt()}))},Ua=(a=!1)=>{const e=Q.releaseId;Q.active=!1,Q.releaseId="",Q.buildId="",Q.commitSha="",Q.deployedAt="",Q.notes="",Q.source="",Q.popupDismissed=!1,Q.lastPopupReleaseId="",a&&e&&Qn(e),Fa()};window.app_dismissReleaseUpdatePrompt=()=>{Q.active&&(Q.releaseId&&Qn(Q.releaseId),Q.popupDismissed=!0,document.getElementById("system-update-modal")?.remove(),Fa())};const es=(a,e={})=>{const t=Zn(a,a?.source||"version");if(!t)return!1;if(t.buildId===Tt.buildId)return Ua(!1),!1;const n=e.forcePopup===!0,s=Ao(),i=Q.active&&Q.releaseId===t.releaseId;return Q.active=!0,Q.releaseId=t.releaseId,Q.buildId=t.buildId,Q.commitSha=t.commitSha,Q.deployedAt=t.deployedAt,Q.notes=t.notes,Q.source=t.source,Q.popupDismissed=t.releaseId===s,i||window.app_showSyncToast("New version available."),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:update-available",{detail:yt()})),Fa(),!(Q.lastPopupReleaseId===t.releaseId)&&(n||!Q.popupDismissed)&&(Q.popupDismissed=!1,window.app_showSystemUpdatePopup()),!0},ko=async({manual:a=!1}={})=>{try{const e=await fetch(`${bo}?t=${Date.now()}`,{cache:"no-store",headers:{"cache-control":"no-cache"}});if(!e.ok)throw new Error(`Version check failed with ${e.status}`);const t=await e.json();return Zn(t,"version")}catch(e){return console.warn("Unable to fetch deployed version manifest:",e),a&&window.app_showSyncToast("Could not check for updates right now."),null}},ct=async(a={})=>{if(Ge)return Ge;Ge=(async()=>{const e=await ko({manual:a.manual===!0});return e?es(e,{forcePopup:a.forcePopup===!0}):!1})();try{return await Ge}finally{Ge=null}},ts=()=>{nt||(nt=setInterval(()=>{document.visibilityState==="visible"&&window.AppAuth?.getUser()&&ct()},vo),ct())},Do=()=>{nt&&(clearInterval(nt),nt=null)},xo=()=>{document.visibilityState==="visible"&&window.AppAuth?.getUser()&&ct()},on=()=>{window.AppAuth?.getUser()&&ct()},rn=a=>{!a||a.id!==ba||a.active!==!1&&es({...a,source:"release-signal"},{forcePopup:!0})},as=()=>{if(!ga){if(ga=!0,window.AppDB&&typeof window.AppDB.listenDoc=="function"){_t=window.AppDB.listenDoc(sn,ba,a=>{a&&rn(a)});return}$t=setInterval(async()=>{try{const a=await window.AppDB.get(sn,ba);a&&rn(a)}catch{}},3e4)}},_o=()=>{typeof _t=="function"&&(_t(),_t=null),$t&&(clearInterval($t),$t=null),ga=!1};window.app_checkForSystemUpdate=async()=>{if(Q.active)return window.app_showSystemUpdatePopup(),!0;const a=await ct({manual:!0,forcePopup:!0});return a||window.app_showSyncToast("You are already using the latest version."),a};window.app_isAdminUser=(a=window.AppAuth?.getUser())=>a?a.isAdmin===!0:!1;window.app_canSeeAdminPanel=(a=window.AppAuth?.getUser())=>a?window.app_isAdminUser(a)?!0:a.permissions?Object.entries(a.permissions).some(([e,t])=>e!=="birthday"&&t==="admin"):!1:!1;window.app_hasPerm=(a,e="view",t=window.AppAuth?.getUser())=>{if(!t)return!1;if(t.isAdmin===!0)return!0;if(!t.permissions||!t.permissions[a])return!1;const n=t.permissions[a];return e==="view"?n==="view"||n==="admin":e==="admin"?n==="admin":!1};window.app_canManageAttendanceSheet=(a=window.AppAuth?.getUser())=>a?window.app_hasPerm("attendance","admin",a)||!!a.canManageAttendanceSheet:!1;window.app_canManageBirthdays=(a=window.AppAuth?.getUser())=>a?window.app_isAdminUser(a)||a.role==="Administrator"||!!a.canManageBirthdays||window.app_hasPerm("birthday","view",a):!1;window.app_canAdminBirthdays=(a=window.AppAuth?.getUser())=>a?window.app_isAdminUser(a)||a.role==="Administrator"||!!a.canManageBirthdays||window.app_hasPerm("birthday","admin",a):!1;window.app_getReadTelemetry=()=>!window.AppDB||!window.AppDB.getReadTelemetry?{}:window.AppDB.getReadTelemetry();window.app_resetReadTelemetry=()=>{!window.AppDB||!window.AppDB.clearReadTelemetry||window.AppDB.clearReadTelemetry()};window.app_getMyMessages=async()=>{const a=window.AppAuth.getUser();if(!a)return[];try{const[e,t]=await Promise.all([window.AppDB.query("staff_messages","toId","==",a.id),window.AppDB.query("staff_messages","fromId","==",a.id)]),n=new Map;return(e||[]).forEach(s=>n.set(s.id,s)),(t||[]).forEach(s=>n.set(s.id,s)),Array.from(n.values())}catch(e){return console.warn("Message fetch failed, falling back to getAll",e),window.AppDB.getAll("staff_messages")}};const ne=document.getElementById("page-content"),St=document.querySelector(".sidebar"),At=document.querySelector(".mobile-header"),kt=document.querySelector(".mobile-nav");window.app_initTheme=()=>{const a=localStorage.getItem("theme")||"light";document.documentElement.setAttribute("data-theme",a),ns(a)};window.app_toggleTheme=()=>{const e=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",e),localStorage.setItem("theme",e),ns(e)};function ns(a){document.querySelectorAll(".theme-toggle i").forEach(e=>{a==="dark"?(e.classList.remove("fa-moon"),e.classList.add("fa-sun")):(e.classList.remove("fa-sun"),e.classList.add("fa-moon"))})}window.addEventListener("load",()=>{window.app_showLastNotifError&&window.app_showLastNotifError()},{once:!0});function $o(){if(!("serviceWorker"in navigator))return;const a=async()=>{try{wa=await navigator.serviceWorker.register("/sw.js"),console.log("ServiceWorker registered")}catch(e){console.log("ServiceWorker registration failed: ",e)}};if(document.readyState==="complete"){a();return}window.addEventListener("load",()=>{a()},{once:!0})}const dn=(a=new Date)=>`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`;window.app_showAttendanceNotice=a=>{if(!a)return;const e=document.getElementById("page-content");if(!e)return;const t=document.getElementById("attendance-policy-notice");t&&t.remove();const n=document.createElement("div");n.id="attendance-policy-notice",n.style.background="#fff7ed",n.style.border="1px solid #fdba74",n.style.color="#9a3412",n.style.padding="0.85rem 1rem",n.style.borderRadius="10px",n.style.marginBottom="0.9rem",n.style.fontSize="0.9rem",n.style.fontWeight="600",n.innerHTML=`<i class="fa-solid fa-circle-info" style="margin-right:0.45rem;"></i>${a}`,e.prepend(n),setTimeout(()=>{const s=document.getElementById("attendance-policy-notice");s&&s.remove()},1e4)};window.app_promptMissedCheckoutReason=(a={})=>{const{logId:e,date:t}=a||{};if(!e||document.getElementById("missed-checkout-reason-modal"))return;const n=t?new Date(`${t}T00:00:00`).toLocaleDateString():"previous day",s=`
        <div class="modal-overlay" id="missed-checkout-reason-modal" style="display:flex;">
            <div class="modal-content" style="max-width:560px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:0.75rem;">
                    <div>
                        <h3 style="margin:0;">Missed Checkout</h3>
                        <p style="margin:0.35rem 0 0 0; font-size:0.85rem; color:#6b7280;">
                            Your session on ${Y(n)} was auto-checked out and counted as a half day.
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
    `;(document.body||document.getElementById("modal-container")).insertAdjacentHTML("beforeend",s);const i=document.getElementById("missed-checkout-reason-modal");i?.addEventListener("click",o=>{o.target===i&&i.remove()})};window.app_submitMissedCheckoutReason=async(a,e)=>{a.preventDefault();const t=a.target,n=String(new FormData(t).get("reason")||"").trim();if(!n){alert("Please enter a reason.");return}try{const s=window.AppAuth.getUser();if(!s)throw new Error("User not authenticated");const i=await window.AppDB.get("attendance",e);if(!i)throw new Error("Attendance record not found.");const o=new Date().toISOString(),r={...i,missedCheckoutReason:n,missedCheckoutReasonSubmittedAt:o,missedCheckoutReasonStatus:"pending"};await window.AppDB.put("attendance",r);const d=await window.AppDB.get("users",s.id);d&&(d.notifications||(d.notifications=[]),d.notifications.unshift({id:`mcr_sub_${Date.now()}`,type:"missed-checkout-reason-submitted",title:"Missed checkout reason submitted",message:`Reason sent for ${i.date}. Awaiting admin verification.`,status:"submitted",date:o,read:!0}),await window.AppDB.put("users",d),window.AppAuth?.getUser&&Object.assign(window.AppAuth.getUser(),{notifications:d.notifications}));const l=(await window.AppDB.getAll("users")).filter(c=>c.isAdmin||c.role==="Administrator");await Promise.all(l.map(async c=>{c.notifications||(c.notifications=[]),c.notifications.unshift({id:`mcr_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"missed-checkout-reason",title:"Missed checkout reason submitted",message:`${s.name} submitted a reason for missed checkout on ${i.date}.`,description:n,staffId:s.id,staffName:s.name,missedCheckoutDate:i.date,logId:String(i.id||""),taggedById:s.id,taggedByName:s.name,taggedAt:o,status:"pending",date:o,read:!1}),await window.AppDB.put("users",c)})),document.getElementById("missed-checkout-reason-modal")?.remove(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell(),window.app_showSyncToast("Reason submitted for admin verification.")}catch(s){console.error("Missed checkout reason submit failed:",s),alert("Failed to submit reason: "+s.message)}};window.app_showSyncToast=(a="Status updated from another device.")=>{const e="app-sync-toast",t=document.getElementById(e);t&&t.remove();const n=document.createElement("div");n.id=e,n.style.position="fixed",n.style.top="14px",n.style.right="14px",n.style.zIndex="10020",n.style.background="#0f172a",n.style.color="#f8fafc",n.style.padding="0.7rem 0.9rem",n.style.borderRadius="10px",n.style.fontSize="0.82rem",n.style.fontWeight="600",n.style.boxShadow="0 8px 25px rgba(15, 23, 42, 0.3)",n.textContent=a,document.body.appendChild(n),setTimeout(()=>{const s=document.getElementById(e);s&&s.remove()},2800)};const To=Object.freeze({"team-activities":{title:"How To Use This Page",why:"This page helps you review what the team has been working on, track progress, and spot overdue or blocked work in one place.",how:"Use the filters to narrow by date, type, status, or staff member. Open the records to review details, compare activity across people, and move through pages when the list is long."},"staff-directory":{title:"How To Use This Page",why:"This page is for staff communication and quick follow-up. It keeps person-to-person messages and task discussions organized by staff member.",how:"Choose a staff member from the list, read the conversation history, then send a message or review assigned tasks. Return here whenever you need to continue a discussion with someone on the team."},policies:{title:"How To Use This Page",why:"This page explains attendance rules, holidays, working hours, and policy settings so everyone follows the same process.",how:"Read the sections before taking action on attendance, leave, or office timing questions. Admin users can update policy values here, while staff should use it as the main reference page."},"annual-plan":{title:"How To Use This Page",why:"This page gives a year-wide view of planned work so you can understand schedules, deadlines, and major activities across the calendar.",how:"Switch between views, filter by staff, search the list, and jump to important dates. Open a day when you want to inspect or plan work for that specific date."},"birthday-calendar":{title:"How To Use This Page",why:"This page keeps birthday records organized so the team can manage celebrations and maintain correct staff details.",how:"Review upcoming birthdays, add missing entries, or update existing records when details change. Use it as the central place for birthday-related staff information."},timesheet:{title:"How To Use This Page",why:"This page is for checking attendance history, work duration, and day-by-day time records.",how:"Use the available filters or date controls to inspect your logs, verify hours, and open details when something looks incorrect. It is the best page to review your past attendance entries."},profile:{title:"How To Use This Page",why:"This page shows your personal staff profile, attendance summary, and leave-related information in one place.",how:"Use it to review your details, check your current status, and look at summary numbers for attendance and leave. Admin users can also switch between staff profiles when needed."},minutes:{title:"How To Use This Page",why:"This page is for recording meeting discussions, decisions, action items, and approvals so nothing important is lost after a meeting.",how:"Create a meeting record, write the discussion summary, add action items with owners, and review approval or edit history. Use search to quickly find older meetings."},admin:{title:"How To Use This Page",why:"This page gives administrators control over reports, staff management, attendance monitoring, and approval workflows.",how:"Use the filters and admin tools to inspect records, approve requests, review trends, and take corrective actions. Changes here can affect multiple users, so review entries carefully before saving."},"master-sheet":{title:"How To Use This Page",why:"This page provides a sheet-style attendance view so you can inspect staff presence, absences, holidays, and exceptions across many dates at once.",how:"Scan rows and columns to compare attendance patterns quickly. Admin users can open cells for detailed review or corrections where needed."},salary:{title:"How To Use This Page",why:"This page supports salary preparation by combining attendance-based calculations and payroll-related values in one working area.",how:"Review staff rows carefully, check attendance-driven inputs, and update values before final processing. Use it when payroll needs to be prepared from attendance data."},"policy-test":{title:"How To Use This Page",why:"This page helps verify whether policy logic and rules are behaving as expected before relying on them in day-to-day use.",how:"Run the available checks, compare outcomes, and confirm that policy behavior matches the intended rules. It is mainly for validation and troubleshooting."}}),Io=a=>{const e=To[a];if(!e)return"";const t=Y(e.title||"How To Use This Page"),n=Y(e.why||""),s=Y(e.how||"");return`
        <section class="page-usage-note" id="page-usage-note" data-page-key="${Y(a)}" aria-label="Page help note">
            <div class="page-usage-note-header">
                <i class="fa-solid fa-circle-info"></i>
                <h3>${t}</h3>
            </div>
            <p><strong>Why this page exists:</strong> ${n}</p>
            <p><strong>How to use it:</strong> ${s}</p>
        </section>
    `},na=()=>{const a=document.getElementById("page-content");if(!a)return;const e=String(window.location.hash||"").replace(/^#/,"")||"dashboard",t=a.querySelector("#page-usage-note");if(e==="dashboard"){t?.remove();return}const n=Io(e);if(!n){t?.remove();return}t?.dataset.pageKey!==e&&(t?.remove(),a.insertAdjacentHTML("beforeend",n))},Mo=()=>{if(window.__appPageUsageNotesInitialized)return;window.__appPageUsageNotesInitialized=!0;const a=()=>{const e=document.getElementById("page-content");if(!e||e.__pageUsageObserverBound)return;new MutationObserver(()=>{if(e.dataset.applyingUsageNote!=="1"){e.dataset.applyingUsageNote="1";try{na()}finally{delete e.dataset.applyingUsageNote}}}).observe(e,{childList:!0}),e.__pageUsageObserverBound=!0,na()};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",a,{once:!0}):a(),window.addEventListener("hashchange",()=>{requestAnimationFrame(()=>{na()})})},ln=()=>!be&&Date.now()>Gn,pt=()=>{Gn=Date.now()+3500},Co=a=>{const e=a.detail;if(!e)return;window.app_refreshNotificationBell&&window.app_refreshNotificationBell().catch(()=>{});const t=e.status||"out",n=et!==null&&t!==et,s=et===null&&t==="in";if(et=t,!(n||s)||aa)return;const i=!window.location.hash||window.location.hash==="#dashboard",o=document.getElementById("checkout-modal"),r=!!(o&&o.style.display==="flex");if(t==="out"&&r&&(o.style.display="none"),!i){ln()&&window.app_showSyncToast("Status updated from another device.");return}aa=!0,(async()=>{try{const d=document.getElementById("page-content");d&&(d.innerHTML=await q.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),ln()&&window.app_showSyncToast("Status updated from another device.")}catch(d){console.warn("Realtime dashboard sync failed:",d)}finally{aa=!1}})()};function va(a){const e=document.querySelector(".sidebar"),t=document.getElementById("sidebar-overlay");e&&t&&(a?(e.classList.add("open"),t.classList.add("active")):(e.classList.remove("open"),t.classList.remove("active")))}function Lo(){if(window.location.search){const a=window.location.protocol+"//"+window.location.host+window.location.pathname+window.location.hash;window.history.replaceState({path:a},"",a),console.log("Address bar cleaned of query parameters.")}}window.app_toggleSidebar=(a=null)=>{const e=document.querySelector(".sidebar"),t=document.querySelector("#desktop-sidebar-toggle i");if(!e)return;(a!==null?a:!e.classList.contains("collapsed"))?(e.classList.add("collapsed"),t&&(t.classList.remove("fa-angles-left"),t.classList.add("fa-angles-right"))):(e.classList.remove("collapsed"),t&&(t.classList.remove("fa-angles-right"),t.classList.add("fa-angles-left")))};window.app_showModal=(a,e)=>{const t=document.getElementById("modal-container");if(!t)return;const n=document.getElementById(e);n&&n.remove(),t.insertAdjacentHTML("beforeend",a);const s=document.getElementById(e);if(s&&(s.classList.contains("modal-overlay")||s.classList.contains("modal"))){const o=Array.from(document.querySelectorAll(".modal-overlay, .modal")).filter(r=>r!==s).reduce((r,d)=>{const l=Number.parseInt(window.getComputedStyle(d).zIndex,10);return Number.isFinite(l)?Math.max(r,l):r},1e3);s.style.zIndex=String(o+2)}};window.app_renderCarryForwardIssues=function(a="date-desc"){const e=Array.isArray(window.app_carryForwardIssues)?window.app_carryForwardIssues:[],t=200,n=String(a||"date-desc"),i=[...e].sort((l,c)=>n==="date-asc"?String(l.planDate||"").localeCompare(String(c.planDate||"")):n==="owner-asc"?String(l.planUserName||"").localeCompare(String(c.planUserName||""))||String(c.planDate||"").localeCompare(String(l.planDate||"")):n==="owner-desc"?String(c.planUserName||"").localeCompare(String(l.planUserName||""))||String(c.planDate||"").localeCompare(String(l.planDate||"")):n==="origin-asc"?String(l.originDate||"").localeCompare(String(c.originDate||"")):n==="origin-desc"?String(c.originDate||"").localeCompare(String(l.originDate||"")):String(c.planDate||"").localeCompare(String(l.planDate||""))).slice(0,t).map(l=>{const c=[l.ownerMismatch?"Owner mismatch":"",l.assignedMismatch?"Assigned mismatch":"",l.isAutoForwarded?"Auto-forwarded":""].filter(Boolean).join(", ")||"—";return`
            <tr>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${G(l.planDate||"")}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${G(l.planUserName||l.planUserId||"")}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${G(l.taskText||"")}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${G(l.originDate||"")}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${G(l.rootToken||"")}</td>
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
    `;window.app_showModal(r,"carryforward-issues-modal");const d=document.getElementById("carryforward-issues-sort");d&&d.addEventListener("change",l=>{const c=l.target?.value||"date-desc";window.app_renderCarryForwardIssues(c)},{once:!0})};window.app_removeCarryForwardIssues=async function(){try{const a=Array.isArray(window.app_carryForwardIssues)?window.app_carryForwardIssues:[];if(!a.length){alert("No items to remove.");return}const e=`Remove ${a.length} task(s) so they stop carrying forward?`;if(!(window.appConfirm?await window.appConfirm(e):window.confirm(e)))return;if(!window.AppCalendar?.removeTask){alert("Remove action is not available.");return}let n=0,s=0,i=0;const o=window.AppAuth?.getUser?window.AppAuth.getUser():null;for(const l of a){if(!l.planId){s+=1;continue}try{const c=await window.AppDB.get("work_plans",l.planId);if(!c||!Array.isArray(c.plans)||c.plans.length===0){s+=1;continue}let p=-1;const u=String(l.rootToken||"").trim();if(u&&(p=c.plans.findIndex(m=>m&&(String(m.carryForwardRootId||"")===u||String(m.carriedForwardFromPlanId||"")===u||String(m.sourcePlanId||"")===u))),p<0&&Number.isInteger(l.taskIndex)&&(p=l.taskIndex),p<0||!c.plans[p]){s+=1;continue}c.plans[p]={...c.plans[p],status:"not-completed",isRemoved:!0,removedAt:new Date().toISOString(),removedBy:o?.id||""},c.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",c),n+=1}catch(c){i+=1,console.warn("Carry-forward remove failed",{issue:l,err:c})}}const r=`Removed: ${n}. Skipped: ${s}. Failed: ${i}.`;window.app_showSyncToast?window.app_showSyncToast(r):alert(r);const d=window.AppCalendar?.findCarryForwardIssues?await window.AppCalendar.findCarryForwardIssues({includeAssignedMismatch:!0}):[];if(window.app_carryForwardIssues=d,!d.length){window.app_renderCarryForwardIssues("date-desc");return}window.app_renderCarryForwardIssues("date-desc")}catch(a){console.error("Bulk remove carry-forward issues failed:",a),alert("Failed to remove carry-forward issues.")}};window.app_findCarryForwardIssues=async function(){try{if(!window.AppCalendar?.findCarryForwardIssues){alert("Carry-forward scan is not available in this build.");return}const a=await window.AppCalendar.findCarryForwardIssues({includeAssignedMismatch:!0});if(!a.length){alert("No auto-forwarded tasks assigned to other staff were found.");return}window.app_carryForwardIssues=a,window.app_renderCarryForwardIssues("date-desc")}catch(a){console.error("Carry-forward scan failed:",a),alert("Failed to scan carry-forward tasks. Please try again.")}};window.app_purgeAllAutoForwardedTasks=async function(){try{if(!window.AppCalendar?.purgeAllCarriedForwardTasksAllTime){alert("Auto-forward purge is not available in this build.");return}const a=window.AppAuth?.getUser?window.AppAuth.getUser():null,e=!!(a&&(a.role==="Administrator"||a.isAdmin)),t=e?"Delete ALL auto-forwarded tasks for ALL staff and ALL dates? This cannot be undone.":"Delete ALL of YOUR auto-forwarded tasks for ALL dates? This cannot be undone.";if(!(window.appConfirm?await window.appConfirm(t):window.confirm(t)))return;const s=e?await window.AppCalendar.purgeAllCarriedForwardTasksAllTime({scopes:["personal","annual"]}):await window.AppCalendar.purgeCarriedForwardTasksForUserAllTime(a?.id,{scopes:["personal"]}),i=`Removed ${s.removedTasks} auto-forwarded task(s) from ${s.touchedPlans} plan(s).`;window.app_showSyncToast?window.app_showSyncToast(i):alert(i)}catch(a){console.error("Auto-forward purge failed:",a),alert("Failed to delete auto-forwarded tasks.")}};window.app_openForwardCleanupModal=async function(){try{if(!window.AppCalendar?.getForwardCleanupItemsAllTime){alert("Forward cleanup is not available in this build.");return}const a=await window.AppCalendar.getForwardCleanupItemsAllTime({includePersonal:!0,includeAnnual:!0});if(!a.length){alert("No forwarded tasks found.");return}const e=a.filter(c=>c.type==="manual"),t=a.filter(c=>c.type==="system");window.app_forwardCleanupItems=a;const n=c=>c.map(p=>`
            <tr>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">
                    <input type="checkbox" class="forward-cleanup-row" data-key="${G(`${p.planId}__${p.taskIndex}`)}">
                </td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${G(p.planDate||"")}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${G(p.planUserName||p.planUserId||"")}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${G(p.taskText||"")}</td>
            </tr>
        `).join(""),s=(c,p,u)=>`
            <div style="margin-top:0.75rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                    <div style="font-weight:700; color:#0f172a;">${c} (${p.length})</div>
                    <div style="display:flex; gap:0.4rem;">
                        <button type="button" class="action-btn secondary" data-forward-select-all="${u}">Select All</button>
                        <button type="button" class="action-btn danger" data-forward-delete="${u}">Delete Selected</button>
                    </div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:10px; overflow:auto; max-height:40vh;">
                    <table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
                        <thead style="background:#f8fafc; position:sticky; top:0;">
                            <tr>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0; width:36px;"></th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0;">Date</th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0;">Staff</th>
                                <th style="text-align:left; padding:8px; border-bottom:1px solid #e2e8f0;">Task</th>
                            </tr>
                        </thead>
                        <tbody>${n(p)}</tbody>
                    </table>
                </div>
            </div>
        `,i=`
            <div class="modal-overlay" id="forward-cleanup-modal" style="display:flex;">
                <div class="modal-content" style="max-width:980px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                        <h3 style="margin:0;">Forward Cleanup</h3>
                        <button type="button" onclick="window.app_closeModal(this)" class="day-plan-close-btn" title="Close">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div style="font-size:0.85rem; color:#64748b;">
                        Manual postponed tasks are created by user actions. System postponed tasks are auto-forwarded by the system.
                    </div>
                    ${s("Manual Postponed",e,"manual")}
                    ${s("System Postponed",t,"system")}
                </div>
            </div>
        `;window.app_showModal(i,"forward-cleanup-modal");const o=document.getElementById("forward-cleanup-modal");if(!o)return;const r=c=>{const p=c==="manual"?e:t;return new Set(p.map(m=>`${m.planId}__${m.taskIndex}`))},d=c=>{const p=r(c);Array.from(o.querySelectorAll(".forward-cleanup-row")).forEach(m=>{const h=m.getAttribute("data-key");p.has(h)&&(m.checked=!0)})},l=async c=>{const p=r(c),u=Array.from(o.querySelectorAll(".forward-cleanup-row")).filter(v=>v.checked&&p.has(v.getAttribute("data-key")));if(!u.length){alert("Select at least one task.");return}const m=`Delete ${u.length} selected task(s)? This cannot be undone.`;if(!(window.appConfirm?await window.appConfirm(m):window.confirm(m)))return;const f=window.AppAuth?.getUser?window.AppAuth.getUser():null;let w=0;for(const v of u){const k=v.getAttribute("data-key")||"",[b,M]=k.split("__"),A=Number(M);if(!b||!Number.isInteger(A))continue;const g=await window.AppDB.get("work_plans",b);!g||!Array.isArray(g.plans)||!g.plans[A]||(g.plans[A]={...g.plans[A],status:"not-completed",isRemoved:!0,removedAt:new Date().toISOString(),removedBy:f?.id||""},g.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",g),w+=1)}window.app_showSyncToast?window.app_showSyncToast(`Removed ${w} task(s).`):alert(`Removed ${w} task(s).`),window.app_closeModal(o.querySelector(".day-plan-close-btn")),window.app_openForwardCleanupModal()};o.addEventListener("click",c=>{const p=c.target,u=p.closest("[data-forward-select-all]"),m=p.closest("[data-forward-delete]");u&&d(u.getAttribute("data-forward-select-all")),m&&l(m.getAttribute("data-forward-delete"))})}catch(a){console.error("Forward cleanup failed:",a),alert("Failed to load forward cleanup.")}};const Y=a=>String(a??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),Eo=a=>Y(a).replace(/\n/g,"<br>"),Sa=a=>String(a?.status||"pending").toLowerCase(),st=a=>a?.type==="birthday-reminder"?a?.read!==!0:Sa(a)==="pending",Aa=a=>{if(!a)return!1;if(a.autoPostponed===!0||a.isAutoForwarded===!0)return!0;const e=String(a.type||"").toLowerCase();if(e.includes("auto-forward")||e.includes("carry-forward")||e.includes("system-postponed"))return!0;const t=`${a.title||""} ${a.message||""} ${a.description||""}`.toLowerCase();return/postponed from|auto[- ]?forward|carried forward|carry forward|system postponed/.test(t)},sa=a=>a?.type==="birthday-reminder"?"Birthday":a?.type==="minute-access-request"?"Minutes":String(a?.type||"").includes("missed-checkout")?"Attendance":a?.type==="task"?"Task":a?.type==="tag"||a?.type==="mention"?"Tag":a?.type==="reminder"?"Reminder":"Notification",Po=a=>a?a.type==="minute-access-request"||String(a.type||"").includes("missed-checkout")?!0:a.type==="tag"||a.type==="mention":!1,cn=a=>String(a?.description||a?.message||a?.title||"").trim(),No=a=>{const e=a?.respondedAt||a?.taggedAt||a?.date,t=new Date(e).getTime();if(!t)return"Unknown time";const n=Math.max(0,Math.floor((Date.now()-t)/6e4)),s=n<1?"just now":n<60?`${n} mins ago`:n<1440?`${Math.floor(n/60)} hrs ago`:`${Math.floor(n/1440)} days ago`;return`${new Date(t).toLocaleString()} (${s})`};window.app_refreshNotificationBell=async()=>{const a=document.querySelectorAll(".top-notification-btn");if(!a.length)return;const e=window.AppAuth.getUser(),t=Array.isArray(e?.notifications)?e.notifications:[],n=t.filter(i=>!Aa(i)),s=n.filter(st).length;if(e&&n.length!==t.length)try{const i=await window.AppDB.get("users",e.id).catch(()=>null);i&&Array.isArray(i.notifications)&&(i.notifications=i.notifications.filter(o=>!Aa(o)),await window.AppDB.put("users",i),Object.assign(e,{notifications:i.notifications}))}catch(i){console.warn("Failed to clean postponed notifications during bell refresh:",i)}a.forEach(i=>{const o=i.querySelector(".top-notification-badge");if(!e){i.classList.remove("has-pending"),o&&(o.style.display="none");return}i.classList.toggle("has-pending",s>0),i.setAttribute("title",s>0?`${s} pending notification${s>1?"s":""}`:"Notification history"),o&&(s>0?(o.textContent=s>99?"99+":String(s),o.style.display=""):o.style.display="none")})};window.app_closeNotificationHistory=()=>{const a=document.getElementById("notification-history-modal"),e=document.getElementById("notif-drawer-backdrop");a&&a.classList.remove("notif-drawer-open"),e&&e.classList.remove("notif-drawer-backdrop-visible"),setTimeout(()=>document.getElementById("notif-drawer-root")?.remove(),320)};window.app_recordNotifError=(a,e={})=>{try{const t={message:String(a?.message||a||"Unknown error"),time:new Date().toISOString(),context:e};localStorage.setItem("notif_last_error",JSON.stringify(t))}catch{}};window.app_showLastNotifError=()=>{try{const a=localStorage.getItem("notif_last_error");if(!a)return;localStorage.removeItem("notif_last_error");const e=JSON.parse(a),t=`
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
                        ${Y(e?.message||"Unknown error")}
                    </div>
                    <div style="margin-top:0.6rem; font-size:0.78rem; color:#64748b;">
                        Time: ${Y(e?.time||"")}
                    </div>
                </div>
            </div>
        `;window.app_showModal(t,"notif-error-modal")}catch{}};window.app_markNotificationResponded=async(a,e,t)=>{const n=window.AppAuth.getUser();if(!n)return!1;const s=await window.AppDB.get("users",n.id).catch(()=>null);if(!s||!Array.isArray(s.notifications))return!1;let i=null;if(Number.isInteger(e)&&e>=0&&s.notifications[e]?i=s.notifications[e]:a&&(i=s.notifications.find(r=>String(r.id||"")===String(a))),!i)return!1;const o=new Date().toISOString();return i.status=t,i.respondedAt=o,i.read=!0,i.dismissedAt=o,await window.AppDB.put("users",s),await window.app_refreshNotificationBell?.(),!0};window.app_respondNotificationFromHistory=async(a,e,t)=>{const n=window.AppAuth.getUser();if(!n)return;const s=t==="approve"?"approve":"reject",i=await window.AppDB.get("users",n.id);if(!i||!Array.isArray(i.notifications)){alert("Notification not found.");return}let o=null,r=-1;if(Number.isInteger(a)&&a>=0&&i.notifications[a]&&(o=i.notifications[a],r=a),!o&&e&&(r=i.notifications.findIndex(d=>String(d.id)===String(e)),r>=0&&(o=i.notifications[r])),!o){alert("This notification is no longer available.");return}if(!st(o)){alert("This notification has already been responded."),await window.app_refreshNotificationBell();return}window.app_closeNotificationHistory();try{if(o.type==="minute-access-request"&&window.app_hasPerm("minutes","admin",n)){await window.app_reviewMinuteAccessFromNotification(r,o.id,s==="approve"?"approved":"rejected");return}if(o.type==="missed-checkout-reason"&&(n.isAdmin||n.role==="Administrator")){await window.app_reviewMissedCheckoutReasonFromNotification(r,o.id,s==="approve"?"approved":"rejected");return}const d=Number(o.taskIndex);if(o.planId&&Number.isInteger(d)&&d>=0){await window.app_handleTagResponse(o.planId,d,s==="approve"?"accepted":"rejected",r);return}if(o.id){await window.app_handleTagDecision(o.id,s==="approve"?"accepted":"rejected");return}await window.app_markNotificationResponded(o.id,r,s==="approve"?"accepted":"rejected")||alert("This notification cannot be approved or rejected from history.")}catch(d){if(console.error("Notification response error:",d),window.app_recordNotifError(d,{notifId:o?.id||"",action:s}),await window.app_markNotificationResponded(o?.id,r,s==="approve"?"accepted":"rejected")){alert("Action recorded in notifications, but the full workflow failed. Please refresh.");return}alert("Failed to process notification: "+d.message)}};window.app_openNotificationHistory=async()=>{const a=window.AppAuth.getUser();if(!a)return;const e=await window.AppDB.get("users",a.id).catch(()=>a),t=Array.isArray(e?.notifications)?e.notifications:[],n=t.filter(I=>!Aa(I));if(n.length!==t.length&&e)try{e.notifications=n,await window.AppDB.put("users",e),window.AppAuth?.getUser&&Object.assign(window.AppAuth.getUser(),{notifications:n}),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}catch(I){console.warn("Failed to clean postponed notifications:",I)}const s=n,i=Array.isArray(e?.tagHistory)?e.tagHistory:[],o=a.isAdmin||a.role==="Administrator",r=[...s.map((I,y)=>({...I,_source:"live",_index:y})),...i.map(I=>({...I,_source:"history",_index:-1}))],d=I=>new Date(I.respondedAt||I.taggedAt||I.date||0).getTime()||0,l=I=>String(I||"").trim().toLowerCase(),p=['<option value="all">All Sources</option>',...Array.from(new Set(r.map(I=>sa(I)))).filter(Boolean).sort((I,y)=>I.localeCompare(y)).map(I=>`<option value="${Y(I.toLowerCase())}">${Y(I)}</option>`)].join(""),u={search:"",status:"all",source:"all",sort:"newest"},m=I=>{const y=Sa(I),_=y==="pending"&&I._source==="live",x=sa(I),$=I.taggedByName||"System",L=I.title||`${x} from ${$}`,T=cn(I),E=pe(String(I.id||"")),P={pending:{bg:"#fff7ed",border:"#fdba74",badge:"#f97316"},accepted:{bg:"#f0fdf4",border:"#86efac",badge:"#16a34a"},rejected:{bg:"#fef2f2",border:"#fca5a5",badge:"#dc2626"},default:{bg:"#f8fafc",border:"#e2e8f0",badge:"#6b7280"}},B=P[y]||P.default,R=_&&Po(I)||o&&I.type==="minute-access-request"?`
            <div class="notif-drawer-actions">
                <button type="button" class="notif-drawer-btn approve" onclick="window.app_respondNotificationFromHistory(${Number(I._index)}, '${E}', 'approve')">
                    <i class="fa-solid fa-check"></i> Approve
                </button>
                <button type="button" class="notif-drawer-btn reject" onclick="window.app_respondNotificationFromHistory(${Number(I._index)}, '${E}', 'reject')">
                    <i class="fa-solid fa-xmark"></i> Reject
                </button>
            </div>`:"";return`
            <div class="notif-drawer-item ${_?"is-pending":""}" style="border-color:${B.border}; background:${B.bg};" data-notif-id="${Y(String(I.id||""))}">
                <div class="notif-drawer-item-head">
                    <div class="notif-drawer-item-left">
                        <div class="notif-drawer-source-icon">
                            <i class="fa-solid ${I.type==="tag"||I.type==="mention"?"fa-at":I.type==="birthday-reminder"?"fa-cake-candles":I.type==="task"?"fa-list-check":I.type==="minute-access-request"?"fa-file-lines":String(I.type||"").includes("missed-checkout")?"fa-user-clock":"fa-bell"}"></i>
                        </div>
                        <div>
                            <div class="notif-drawer-title">${Y(L)}</div>
                            <div class="notif-drawer-meta">${Y(x)} • ${Y($)} • ${Y(No(I))}</div>
                        </div>
                    </div>
                    <div class="notif-drawer-item-right">
                        <span class="notif-drawer-badge" style="background:${B.badge}">${Y(y)}</span>
                    </div>
                </div>
                ${T?`<div class="notif-drawer-text">${Y(T)}</div>`:""}
                ${R}
            </div>`},h=()=>{const I=r.filter(y=>{const _=Sa(y),x=sa(y),$=y.taggedByName||"System",L=y.title||`${x} from ${$}`,T=cn(y),E=`${L} ${T} ${x} ${$} ${_}`;return!(u.status!=="all"&&_!==u.status||u.source!=="all"&&l(x)!==u.source||u.search&&!l(E).includes(u.search))});return u.sort==="oldest"?I.sort((y,_)=>d(y)-d(_)):u.sort==="pending"?I.sort((y,_)=>{const x=st(y)?1:0,$=st(_)?1:0;return x!==$?$-x:d(_)-d(y)}):I.sort((y,_)=>d(_)-d(y)),I},f=s.filter(st).length,w=`
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
        </div>`,v=document.createElement("div");v.id="notif-drawer-root",v.innerHTML=w,document.body.appendChild(v),requestAnimationFrame(()=>{const I=document.getElementById("notification-history-modal");I&&I.classList.add("notif-drawer-open");const y=document.getElementById("notif-drawer-backdrop");y&&y.classList.add("notif-drawer-backdrop-visible")});const k=document.getElementById("notif-drawer-list"),b=document.getElementById("notif-drawer-results"),M=document.getElementById("notif-drawer-search"),A=document.getElementById("notif-drawer-source"),g=document.getElementById("notif-drawer-sort"),S=document.getElementById("notif-drawer-status-tabs"),C=()=>{if(!k)return;const I=h();k.innerHTML=I.length?I.map(m).join(""):'<div class="notif-drawer-empty"><i class="fa-regular fa-bell-slash"></i><p>No notifications match your search/filter.</p></div>',b&&(b.textContent=`Showing ${I.length} of ${r.length}`)};M?.addEventListener("input",I=>{u.search=l(I.target.value),C()}),A?.addEventListener("change",I=>{u.source=l(I.target.value)||"all",C()}),g?.addEventListener("change",I=>{u.sort=l(I.target.value)||"newest",C()}),S?.addEventListener("click",I=>{const y=I.target.closest("[data-notif-status]");y&&(u.status=l(y.getAttribute("data-notif-status"))||"all",S.querySelectorAll(".notif-drawer-status-tab").forEach(_=>_.classList.remove("is-active")),y.classList.add("is-active"),C())}),C(),await window.app_refreshNotificationBell()};window.app_openBirthdayEditor=async a=>{const e=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(e)){alert("You do not have permission to manage birthdays.");return}const t=await window.AppDB.get("users",a);if(!t){alert("Staff member not found.");return}const n=`
        <div class="modal-overlay" id="birthday-details-modal" style="display:flex;">
            <div class="modal-content" style="max-width:560px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1rem;">
                    <div>
                        <div style="font-size:0.78rem; font-weight:800; color:#9a3412; text-transform:uppercase; letter-spacing:0.08em;">Birthday Details</div>
                        <h3 style="margin:0.35rem 0 0.2rem 0;">${Y(t.name||"Staff")}</h3>
                        <div style="font-size:0.84rem; color:#64748b;">${Y(t.role||"Employee")} • ${Y(t.dept||"General")}</div>
                    </div>
                    <button type="button" onclick="document.getElementById('birthday-details-modal')?.remove()" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">&times;</button>
                </div>
                <form id="birthday-details-form">
                    <input type="hidden" name="userId" value="${Y(t.id)}">
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem;">
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Day</span>
                            <input type="number" name="birthDay" min="1" max="31" placeholder="DD" value="${Y(t.birthDay||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Month</span>
                            <input type="number" name="birthMonth" min="1" max="12" placeholder="MM" value="${Y(t.birthMonth||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Year</span>
                            <input type="number" name="birthYear" min="1900" max="2100" placeholder="YYYY" value="${Y(t.birthYear||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                    </div>
                    <div style="margin-top:0.65rem; font-size:0.8rem; color:#64748b;">Save one field, two fields, or all three. Reminders need day and month.</div>
                    <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.2rem;">
                        <button type="button" class="action-btn secondary" onclick="document.getElementById('birthday-details-modal')?.remove()">Cancel</button>
                        <button type="submit" class="action-btn">Save Birthday</button>
                    </div>
                </form>
            </div>
        </div>`;window.app_showModal(n,"birthday-details-modal")};window.app_submitBirthdayDetails=async a=>{a.preventDefault();const e=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(e)){alert("You do not have permission to manage birthdays.");return}const t=new FormData(a.target),n=String(t.get("userId")||"").trim();if(!n){alert("Missing staff record.");return}try{const s=We(t),i=await window.AppDB.get("users",n);if(!i)throw new Error("Staff member not found.");if(!await window.AppAuth.updateUser({id:n,birthDay:s.birthDay,birthMonth:s.birthMonth,birthYear:s.birthYear}))throw new Error("Unable to save birthday details.");if(document.getElementById("birthday-details-modal")?.remove(),window.app_showSyncToast(`Birthday details saved for ${i.name||"staff member"}.`),(window.location.hash.slice(1)||"dashboard")==="birthday-calendar"){const r=document.getElementById("page-content");r&&(r.innerHTML=await q.renderBirthdayCalendar())}else window.app_refreshAdminPage&&await window.app_refreshAdminPage()}catch(s){alert(`Failed to save birthday details: ${s.message}`)}};window.app_submitBirthdayMonthForm=async(a,e)=>{a.preventDefault();const t=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(t)){alert("You do not have permission to manage birthdays.");return}const n=Number(e||0);if(!n||n<1||n>12){alert("Invalid birthday month.");return}const s=new FormData(a.target),i=String(s.get("userId")||"").trim();if(!i){alert("Please select a staff member.");return}try{const o=We(s),r=await window.AppDB.get("users",i);if(!r)throw new Error("Staff member not found.");const d={id:i,birthMonth:n,birthDay:o.birthDay,birthYear:o.birthYear};if(!await window.AppAuth.updateUser(d))throw new Error("Unable to save birthday details.");a.target.reset();const c=document.getElementById("page-content");c&&(c.innerHTML=await q.renderBirthdayCalendar()),window.app_showSyncToast(`Birthday updated for ${r.name||"staff member"}.`)}catch(o){alert(`Failed to save birthday details: ${o.message}`)}};window.app_syncBirthdayReminders=async()=>{const a=window.AppAuth?.getUser?.();if(!window.app_canManageBirthdays(a))return;const e=wt();e.setHours(0,0,0,0);const t=Ae(e),n=`birthday_sync_${String(a?.id||"unknown")}`;if(window._birthdaySyncDoneForKey===n&&window._birthdaySyncDayKey===t)return;try{if(localStorage.getItem(n)===t){window._birthdaySyncDoneForKey=n,window._birthdaySyncDayKey=t;return}}catch{}const s=await window.AppDB.getAll("users").catch(()=>[]);if(!Array.isArray(s)||!s.length)return;const i=s.filter(r=>window.app_canManageBirthdays(r));if(!i.length)return;let o=Array.isArray(a?.notifications)?[...a.notifications]:[];for(const r of s){const d=rs(r,e);if(!d)continue;const l=ds(d),c=Ae(l);if(c!==t)continue;const p=Ae(d),u=ls(d,l),m=`Upcoming Staff Birthday: ${r.name||"Staff"}`,h=`${r.name||"Staff"} has a birthday on ${Nt(r.birthDay,r.birthMonth)}.`;for(const f of i){const w=Array.isArray(f.notifications)?[...f.notifications]:[];w.some(k=>k?.type==="birthday-reminder"&&String(k.birthdayStaffId||"")===String(r.id||"")&&String(k.birthdayDate||"")===p&&String(k.reminderDate||"")===c)||(w.unshift({id:`birthday_${p}_${r.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"birthday-reminder",title:m,message:h,description:`${u}. ${r.role||"Employee"} • ${r.dept||"General"}`,status:"pending",date:new Date().toISOString(),read:!1,taggedByName:"Birthday Calendar",birthdayStaffId:r.id,birthdayStaffName:r.name||"Staff",birthdayDate:p,reminderDate:c,birthdayDisplay:Nt(r.birthDay,r.birthMonth,r.birthYear),birthdayReason:u,role:r.role||"",dept:r.dept||""}),await window.AppDB.put("users",{...f,notifications:w}),a&&String(a.id)===String(f.id)&&(o=w))}}a&&Array.isArray(o)&&(a.notifications=o),window._birthdaySyncDoneForKey=n,window._birthdaySyncDayKey=t;try{localStorage.setItem(n,t)}catch{}};window.app_dismissBirthdayPopup=async({openCalendar:a=!1}={})=>{const e=window.AppAuth?.getUser?.();if(!e)return;const t=await window.AppDB.get("users",e.id).catch(()=>e);if(!t||!Array.isArray(t.notifications))return;let n=!1;t.notifications=t.notifications.map(s=>s?.type==="birthday-reminder"&&s?.read!==!0?(n=!0,{...s,read:!0,status:"seen",dismissedAt:new Date().toISOString()}):s),n&&await window.AppAuth.updateUser(t),document.getElementById("birthday-reminder-modal")?.remove(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell(),a&&(window.location.hash="birthday-calendar")};window.app_maybeOpenBirthdayPopup=async()=>{const a=window.AppAuth?.getUser?.();if(!window.app_canManageBirthdays(a)||document.getElementById("birthday-reminder-modal"))return;const e=await window.AppDB.get("users",a.id).catch(()=>a),t=Array.isArray(e?.notifications)?e.notifications.filter(i=>i?.type==="birthday-reminder"&&i?.read!==!0):[];if(!t.length)return;const s=`
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
                    <h4 style="margin:0.35rem 0 0.2rem 0; color:#7c2d12;">${Y(i.birthdayStaffName||"Staff")}</h4>
                    <div style="font-size:0.84rem; color:#9a3412;">${Y(i.birthdayDisplay||i.birthdayDate||"")}</div>
                    <div style="font-size:0.8rem; color:#7c2d12; margin-top:0.35rem;">${Y(i.birthdayReason||"Upcoming birthday")}</div>
                    <div style="font-size:0.8rem; color:#92400e; margin-top:0.25rem;">${Y(i.role||"Employee")} • ${Y(i.dept||"General")}</div>
                </div>
                <button type="button" class="action-btn secondary" style="padding:0.45rem 0.7rem;" onclick="window.app_openBirthdayEditor('${Y(i.birthdayStaffId||"")}')">Edit Birthday Details</button>
            </div>
        </div>
    `).join("")}
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.75rem; padding:1rem 1.4rem 1.3rem; border-top:1px solid #e5e7eb; background:#fff;">
                    <button type="button" class="action-btn secondary" onclick="window.app_dismissBirthdayPopup()">Dismiss</button>
                    <button type="button" class="action-btn" onclick="window.app_dismissBirthdayPopup({ openCalendar: true })">View Birthday Calendar</button>
                </div>
            </div>
        </div>`;window.app_showModal(s,"birthday-reminder-modal")};window.app_openBirthdayEditor=async(a,e)=>{const t=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(t)){alert("You do not have permission to manage birthdays.");return}const n=e?a:"user",s=e||a,i=Yt(n),o=await window.AppDB.get(i.collection,s);if(!o){alert(i.emptyMessage);return}const r=zo(o,i.source),d=i.source==="external"?`
                    <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.75rem; margin-bottom:0.75rem;">
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Name</span>
                            <input type="text" name="name" value="${Y(o.name||"")}" placeholder="Full name" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Position</span>
                            <input type="text" name="position" value="${Y(o.position||"")}" placeholder="President / Trustee / etc." style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                    </div>
                    <label style="display:block; margin-bottom:0.75rem;">
                        <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Location</span>
                        <input type="text" name="location" value="${Y(o.location||"")}" placeholder="City / Office / Campus" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                    </label>
    `:"",l=`
        <div class="modal-overlay" id="birthday-details-modal" style="display:flex;">
            <div class="modal-content" style="max-width:560px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1rem;">
                    <div>
                        <div style="font-size:0.78rem; font-weight:800; color:#9a3412; text-transform:uppercase; letter-spacing:0.08em;">Birthday Details</div>
                        <h3 style="margin:0.35rem 0 0.2rem 0;">${Y(r.title)}</h3>
                        <div style="font-size:0.84rem; color:#64748b;">${Y(r.subtitle)}</div>
                    </div>
                    <button type="button" onclick="document.getElementById('birthday-details-modal')?.remove()" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">&times;</button>
                </div>
                <form id="birthday-details-form">
                    <input type="hidden" name="birthdaySource" value="${Y(i.source)}">
                    <input type="hidden" name="recordId" value="${Y(o.id)}">
                    ${d}
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem;">
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Day</span>
                            <input type="number" name="birthDay" min="1" max="31" placeholder="DD" value="${Y(o.birthDay||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Month</span>
                            <input type="number" name="birthMonth" min="1" max="12" placeholder="MM" value="${Y(o.birthMonth||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Year</span>
                            <input type="number" name="birthYear" min="1900" max="2100" placeholder="YYYY" value="${Y(o.birthYear||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                    </div>
                    <div style="margin-top:0.65rem; font-size:0.8rem; color:#64748b;">Save one field, two fields, or all three. Reminders need day and month.</div>
                    <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.2rem;">
                        <button type="button" class="action-btn secondary" onclick="document.getElementById('birthday-details-modal')?.remove()">Cancel</button>
                        <button type="submit" class="action-btn">Save Birthday</button>
                    </div>
                </form>
            </div>
        </div>`;window.app_showModal(l,"birthday-details-modal")};window.app_submitBirthdayDetails=async a=>{a.preventDefault();const e=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(e)){alert("You do not have permission to manage birthdays.");return}const t=new FormData(a.target),n=String(t.get("birthdaySource")||"user").trim().toLowerCase(),s=String(t.get("recordId")||"").trim(),i=Yt(n);if(!s){alert(`Missing ${i.label.toLowerCase()} record.`);return}try{const o=We(t),r=await window.AppDB.get(i.collection,s);if(!r)throw new Error(i.emptyMessage);if(i.source==="external"){const d=String(t.get("name")||"").trim();if(!d)throw new Error("Name is required.");await window.AppDB.put(i.collection,{...r,name:d,position:String(t.get("position")||"").trim(),location:String(t.get("location")||"").trim(),birthDay:o.birthDay,birthMonth:o.birthMonth,birthYear:o.birthYear,updatedAt:new Date().toISOString(),updatedById:e?.id||""})}else if(!await window.AppAuth.updateUser({id:s,birthDay:o.birthDay,birthMonth:o.birthMonth,birthYear:o.birthYear}))throw new Error("Unable to save birthday details.");if(document.getElementById("birthday-details-modal")?.remove(),window.app_showSyncToast(`Birthday details saved for ${r.name||i.label.toLowerCase()}.`),(window.location.hash.slice(1)||"dashboard")==="birthday-calendar"){const d=document.getElementById("page-content");d&&(d.innerHTML=await q.renderBirthdayCalendar())}else window.app_refreshAdminPage&&await window.app_refreshAdminPage()}catch(o){alert(`Failed to save birthday details: ${o.message}`)}};window.app_openExternalBirthdayPersonModal=async(a="")=>{const e=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(e)){alert("You do not have permission to manage birthdays.");return}const t=`
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
                            <input type="number" name="birthMonth" min="1" max="12" placeholder="MM" value="${Y(a||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
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
        </div>`;window.app_showModal(t,"birthday-external-modal")};window.app_submitExternalBirthdayPerson=async a=>{a.preventDefault();const e=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(e)){alert("You do not have permission to manage birthdays.");return}const t=new FormData(a.target),n=String(t.get("name")||"").trim();if(!n){alert("Please enter a name.");return}try{const s=We(t),i={id:`birthday_person_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,name:n,position:String(t.get("position")||"").trim(),location:String(t.get("location")||"").trim(),birthDay:s.birthDay,birthMonth:s.birthMonth,birthYear:s.birthYear,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),createdById:e?.id||"",updatedById:e?.id||""};await window.AppDB.put("birthday_people",i),document.getElementById("birthday-external-modal")?.remove();const o=document.getElementById("page-content");o&&(window.location.hash.slice(1)||"dashboard")==="birthday-calendar"&&(o.innerHTML=await q.renderBirthdayCalendar()),window.app_showSyncToast(`Birthday person saved for ${n}.`)}catch(s){alert(`Failed to save birthday person: ${s.message}`)}};window.app_refreshBirthdayCalendar=async()=>{if((window.location.hash.slice(1)||"dashboard")!=="birthday-calendar")return;const a=document.getElementById("page-content");a&&(a.innerHTML=await q.renderBirthdayCalendar())};window.app_setBirthdayCalendarView=async a=>{const e=window.app_birthdayCalendarState||{};window.app_birthdayCalendarState={...e,view:String(a||"month").toLowerCase()==="year"?"year":"month"},await window.app_refreshBirthdayCalendar()};window.app_goToBirthdayCalendarMonth=async(a,e=null)=>{const t=Number(a||0);if(!t||t<1||t>12)return;const n=wt(),s=window.app_birthdayCalendarState||{};window.app_birthdayCalendarState={...s,selectedMonth:t,selectedYear:Number(e||s.selectedYear||n.getFullYear()),view:"month"},await window.app_refreshBirthdayCalendar()};window.app_changeBirthdayCalendarMonth=async a=>{const e=Number(a||0);if(!e)return;const t=wt(),n=window.app_birthdayCalendarState||{},s=Number(n.selectedMonth||t.getMonth()+1),i=Number(n.selectedYear||t.getFullYear()),o=new Date(i,s-1+e,1);window.app_birthdayCalendarState={...n,selectedMonth:o.getMonth()+1,selectedYear:o.getFullYear(),view:"month"},await window.app_refreshBirthdayCalendar()};window.app_syncBirthdayReminders=async()=>{const a=window.AppAuth?.getUser?.();if(!window.app_canManageBirthdays(a))return;const[e,t]=await Promise.all([window.AppDB.getAll("users").catch(()=>[]),window.AppDB.getAll("birthday_people",{silentPermissionDenied:!0}).catch(()=>[])]),n=[...Array.isArray(e)?e.map(d=>({...d,birthdaySource:"user"})):[],...Array.isArray(t)?t.map(d=>({...d,birthdaySource:"external"})):[]];if(!n.length)return;const s=wt();s.setHours(0,0,0,0);const i=Ae(s),o=e.filter(d=>window.app_canManageBirthdays(d));if(!o.length)return;let r=Array.isArray(a?.notifications)?[...a.notifications]:[];for(const d of n){const l=rs(d,s);if(!l)continue;const c=ds(l),p=Ae(c);if(p!==i)continue;const u=Ae(l);for(const m of o){const h=Array.isArray(m.notifications)?[...m.notifications]:[];h.some(w=>w?.type==="birthday-reminder"&&String(w.birthdayStaffId||"")===String(d.id||"")&&String(w.birthdaySource||"user")===String(d.birthdaySource||"user")&&String(w.birthdayDate||"")===u&&String(w.reminderDate||"")===p)||(h.unshift(jo(d,d.birthdaySource||"user",l,c)),await window.AppDB.put("users",{...m,notifications:h}),a&&String(a.id)===String(m.id)&&(r=h))}}a&&Array.isArray(r)&&(a.notifications=r)};window.app_maybeOpenBirthdayPopup=async()=>{const a=window.AppAuth?.getUser?.();if(!window.app_canManageBirthdays(a)||document.getElementById("birthday-reminder-modal"))return;const e=await window.AppDB.get("users",a.id).catch(()=>a),t=Array.isArray(e?.notifications)?e.notifications.filter(i=>i?.type==="birthday-reminder"&&i?.read!==!0):[];if(!t.length)return;const s=`
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
                    <h4 style="margin:0.35rem 0 0.2rem 0; color:#7c2d12;">${Y(i.birthdayStaffName||"Staff")}</h4>
                    <div style="font-size:0.84rem; color:#9a3412;">${Y(i.birthdayDisplay||i.birthdayDate||"")}</div>
                    <div style="font-size:0.8rem; color:#7c2d12; margin-top:0.35rem;">${Y(i.birthdayReason||"Upcoming birthday")}</div>
                    <div style="font-size:0.8rem; color:#92400e; margin-top:0.25rem;">${Y(i.role||"Employee")} • ${Y(i.dept||"General")}</div>
                </div>
                <button type="button" class="action-btn secondary" style="padding:0.45rem 0.7rem;" onclick="window.app_openBirthdayEditor('${Y(i.birthdaySource||"user")}', '${Y(i.birthdayStaffId||"")}')">Edit Birthday Details</button>
            </div>
        </div>
    `).join("")}
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.75rem; padding:1rem 1.4rem 1.3rem; border-top:1px solid #e5e7eb; background:#fff;">
                    <button type="button" class="action-btn secondary" onclick="window.app_dismissBirthdayPopup()">Dismiss</button>
                    <button type="button" class="action-btn" onclick="window.app_dismissBirthdayPopup({ openCalendar: true })">View Birthday Calendar</button>
                </div>
            </div>
        </div>`;window.app_showModal(s,"birthday-reminder-modal")};window.app_systemDialog=function({title:a="Notice",message:e="",mode:t="alert",defaultValue:n="",confirmText:s="OK",cancelText:i="Cancel",placeholder:o=""}={}){return new Promise(r=>{const d=`system-dialog-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,l=`${d}-input`,c=t==="prompt",p=t==="confirm"||t==="prompt",u=`
                <div class="modal-overlay app-system-dialog-overlay" id="${d}" style="display:flex;">
                    <div class="modal-content app-system-dialog">
                        <div class="app-system-dialog-head">
                            <h3>${Y(a)}</h3>
                            <button type="button" class="app-system-dialog-close" aria-label="Close dialog">&times;</button>
                        </div>
                        <div class="app-system-dialog-body">
                            <p>${Eo(e)}</p>
                            ${c?`<input id="${l}" class="app-system-dialog-input" type="text" value="${Y(n)}" placeholder="${Y(o)}" autocomplete="off">`:""}
                        </div>
                        <div class="app-system-dialog-actions">
                            ${p?`<button type="button" class="action-btn secondary app-system-dialog-cancel">${Y(i)}</button>`:""}
                            <button type="button" class="action-btn app-system-dialog-confirm">${Y(s)}</button>
                        </div>
                    </div>
                </div>
            `;(document.body||document.getElementById("modal-container")).insertAdjacentHTML("beforeend",u);const m=document.getElementById(d);if(!m){r(c?null:!1);return}m.style.zIndex="20000";const h=m.querySelector(".app-system-dialog-confirm"),f=m.querySelector(".app-system-dialog-cancel"),w=m.querySelector(".app-system-dialog-close"),v=c?m.querySelector(`#${l}`):null,k=b=>{m.remove(),r(b)};h?.addEventListener("click",()=>{k(c?v?v.value:"":!0)}),f?.addEventListener("click",()=>k(c?null:!1)),w?.addEventListener("click",()=>k(c?null:!1)),m.addEventListener("click",b=>{b.target===m&&k(c?null:!1)}),m.addEventListener("keydown",b=>{b.key==="Escape"&&k(c?null:!1),b.key==="Enter"&&(b.preventDefault(),k(c?v?v.value:"":!0))}),v?(v.focus(),v.select()):h?.focus()})};window.appAlert=(a,e="Notice")=>window.app_systemDialog({title:e,message:a,mode:"alert",confirmText:"OK"});window.appConfirm=(a,e="Please Confirm")=>window.app_systemDialog({title:e,message:a,mode:"confirm",confirmText:"Confirm",cancelText:"Cancel"});window.appPrompt=(a,e="",t={})=>window.app_systemDialog({title:t.title||"Enter Details",message:a,mode:"prompt",defaultValue:e,confirmText:t.confirmText||"Save",cancelText:t.cancelText||"Cancel",placeholder:t.placeholder||""});window.alert=a=>{window.appAlert(a)};window.app_openEventModal=()=>{window.app_showModal(`
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
        `,"event-modal")};window.app_submitEvent=async a=>{a.preventDefault();const e=document.getElementById("event-title").value,t=document.getElementById("event-date").value,n=document.getElementById("event-type").value;try{await window.AppCalendar.addEvent({title:e,date:t,type:n}),alert("Event added successfully!"),document.getElementById("event-modal")?.remove();const s=document.getElementById("page-content");s.innerHTML=await q.renderDashboard(),Ne()}catch(s){alert("Error: "+s.message)}};const pn="work_plan_schema_v2_migrated",Bo=async()=>{try{if(!window.AppDB||typeof window.AppDB.getAll!="function"||typeof window.AppDB.put!="function"||localStorage.getItem(pn)==="true")return;const a=await window.AppDB.getAll("work_plans");let e=0;for(const t of a){if(!t||Array.isArray(t.plans))continue;const n=typeof t.plan=="string"?t.plan.trim():"";if(!n)continue;const s={...t,plans:[{task:n,subPlans:Array.isArray(t.subPlans)?t.subPlans:[],tags:Array.isArray(t.tags)?t.tags:[],status:t.status||null,completedDate:t.completedDate||null,startDate:t.startDate||t.date,endDate:t.endDate||t.startDate||t.date}]};delete s.plan,delete s.subPlans,delete s.tags,delete s.status,delete s.completedDate,delete s.startDate,delete s.endDate,await window.AppDB.put("work_plans",s),e+=1}localStorage.setItem(pn,"true"),e>0&&console.log(`Work plan schema migration complete. Updated: ${e}`)}catch(a){console.warn("Work plan schema migration failed:",a)}};async function Ro(){window.app_initTheme(),Mo(),Lo(),window.addEventListener("app:user-sync",Co),window.addEventListener("app:update-available",lt),window.addEventListener("app:update-state",lt),document.addEventListener("visibilitychange",xo),window.addEventListener("focus",on),window.addEventListener("online",on);try{await window.AppAuth.init();const e=window.AppAuth.getUser();e&&(et=e.status||"out",as(),ts()),$o(),await Bo(),window.AppActivity&&window.AppActivity.initCommandListener()}catch(e){console.error("Initialization Failed:",e),ne&&(ne.innerHTML=`<div style="text-align:center; padding:2rem; color:red;">Failed to load application.<br><small>${e.message}</small></div>`)}document.addEventListener("click",e=>{e.target.id==="sidebar-toggle"||e.target.closest("#sidebar-toggle")?va(!0):e.target.id==="sidebar-overlay"&&va(!1)}),window.addEventListener("hashchange",ka),window.AppUI?.initDashboardSectionPage&&window.AppUI.initDashboardSectionPage(),ka();const a=window.AppAuth.getUser();a&&window.AppTour&&window.AppTour.init(a)}async function ka(){const a=window.AppAuth.getUser(),e=window.location.hash.slice(1)||"dashboard",t=e.startsWith("dashboard-section/"),n=t?e.split("/")[1]:"",s=t?"dashboard-section":e;if(s!=="admin"&&Se&&Se.length>0&&(console.log("Cleaning up Admin Realtime Listener."),Se.forEach(u=>typeof u=="function"&&u()),Se=[]),s!=="minutes"&&typeof Ce=="function"&&(console.log("Cleaning up Minutes Realtime Listener."),Ce(),Ce=null),!a){_o(),Do(),Ua(!1),St&&(St.style.display="none"),At&&(At.style.display="none"),kt&&(kt.style.display="none"),document.body.style.background="#f3f4f6",ne&&(ne.innerHTML=q.renderLogin()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell();return}as(),ts(),va(!1),St&&(St.style.display=""),At&&(At.style.display=""),kt&&(kt.style.display="");const i=document.querySelector(".sidebar-footer .user-mini-profile");i&&(i.innerHTML=`
                <img src="${a.avatar||"https://ui-avatars.com/api/?name=User"}" alt="User">
                <div>
                    <p class="user-name">${a.name||"Staff Member"}</p>
                </div>
                <i class="fa-solid fa-gear user-settings-icon"></i>
            `);const o=window.app_hasPerm("attendance","view",a),r=window.app_hasPerm("reports","view",a),d=window.app_hasPerm("policies","view",a),l=window.app_canSeeAdminPanel(a),c=window.app_canManageBirthdays(a);document.querySelectorAll('a[data-page="admin"]').forEach(u=>{u.style.display=l?"flex":"none",l||u.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="master-sheet"]').forEach(u=>{u.style.display=o?"flex":"none",o||u.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="salary"]').forEach(u=>{u.style.display=r?"flex":"none",r||u.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="policy-test"]').forEach(u=>{u.style.display=d?"flex":"none",d||u.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="birthday-calendar"]').forEach(u=>{u.style.display=c?"flex":"none",c||u.style.setProperty("display","none","important")}),document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(u=>{const m=t&&u.dataset.page==="dashboard";u.dataset.page===s||m?u.classList.add("active"):u.classList.remove("active")});try{const u=document.getElementById("modal-container");if(u&&!document.getElementById("checkout-modal")&&u.insertAdjacentHTML("beforeend",q.renderModals()),ne&&(ne.innerHTML='<div class="loading-spinner"></div>'),s==="dashboard")ne.innerHTML=await q.renderDashboard(),Ne();else if(s==="dashboard-section")ne.innerHTML=await q.renderDashboardSectionPage(n||"worklog"),window.AppUI?.initDashboardSectionPage&&window.AppUI.initDashboardSectionPage(n||"worklog");else if(s==="team-activities")ne.innerHTML=await q.renderTeamActivitiesPage(),window.app_initTeamActivities&&await window.app_initTeamActivities();else if(s==="staff-directory")ne.innerHTML=await q.renderStaffDirectoryPage();else if(s==="policies")window.AppPolicies&&typeof window.AppPolicies.render=="function"?ne.innerHTML=await window.AppPolicies.render():ne.innerHTML='<div style="padding:1rem; color:#b91c1c;">Policies module failed to load.</div>';else if(s==="annual-plan")ne.innerHTML=await q.renderAnnualPlan();else if(s==="birthday-calendar"){if(!window.app_canManageBirthdays(a)){window.location.hash="dashboard";return}ne.innerHTML=await q.renderBirthdayCalendar()}else if(s==="timesheet")ne.innerHTML=await q.renderTimesheet();else if(s==="profile")ne.innerHTML=await q.renderProfile();else if(s==="salary"){if(!window.app_hasPerm("reports","view",a)){window.location.hash="dashboard";return}ne.innerHTML=await q.renderSalaryProcessing?await q.renderSalaryProcessing():await q.renderSalary()}else if(s==="policy-test"){if(!window.app_hasPerm("policies","view",a)){window.location.hash="dashboard";return}ne.innerHTML=await q.renderPolicyTest()}else if(s==="master-sheet"){if(!(window.app_hasPerm("attendance","view",a)||window.app_canManageAttendanceSheet(a))){window.location.hash="dashboard";return}ne.innerHTML=await q.renderMasterSheet()}else if(s==="minutes")ne.innerHTML=await q.renderMinutes(),Fo();else if(s==="admin"){if(!window.app_canSeeAdminPanel(a)){window.location.hash="dashboard";return}ne.innerHTML=await q.renderAdmin(),window.AppAnalytics.initAdminCharts(),Oo()}await window.app_syncBirthdayReminders?.(),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell(),await window.app_maybeOpenBirthdayPopup?.()}catch(u){console.error("Render Error:",u),ne.innerHTML=`<div style="text-align:center; color:red; padding:2rem;">Error loading page: ${u.message}</div>`}}function Oo(){Se.forEach(s=>typeof s=="function"&&s()),Se=[],console.log("Starting Admin Realtime Listeners (Users & Audits)...");let a=null;const e=()=>{a&&clearTimeout(a),a=setTimeout(async()=>{a=null,await t()},600)},t=async()=>{if(window.location.hash.slice(1)!=="admin")return;if(document.querySelector('.modal-overlay[style*="display: flex"], .modal[style*="display: flex"]'))console.log("Admin Update received but skipped because a modal is open.");else{console.log("Admin Data Update Received (Realtime) - Refreshing UI");const o=document.getElementById("page-content");if(o){const r=document.getElementById("audit-start")?.value,d=document.getElementById("audit-end")?.value;o.innerHTML=await q.renderAdmin(r,d),window.AppAnalytics&&window.AppAnalytics.initAdminCharts()}}};if((N&&N.READ_OPT_FLAGS||{}).FF_READ_OPT_TARGETED_REALTIME&&window.AppDB.listenQuery){Se.push(window.AppDB.listenQuery("users",[{field:"status",operator:"in",value:["in","out"]}],{limit:300},e));const s=new Date;s.setDate(s.getDate()-2),Se.push(window.AppDB.listenQuery("location_audits",[{field:"timestamp",operator:">=",value:s.getTime()}],{orderBy:[{field:"timestamp",direction:"desc"}],limit:300},e))}else Se.push(window.AppDB.listen("users",e)),Se.push(window.AppDB.listen("location_audits",e))}function Fo(){if(!window.AppDB||!window.AppDB.listen)return;typeof Ce=="function"&&(Ce(),Ce=null);const a=async()=>{if((window.location.hash.slice(1)||"dashboard")!=="minutes"||document.getElementById("minute-detail-modal"))return;const n=document.getElementById("page-content");n&&(n.innerHTML=await q.renderMinutes())};(N&&N.READ_OPT_FLAGS||{}).FF_READ_OPT_TARGETED_REALTIME&&window.AppDB.listenQuery?Ce=window.AppDB.listenQuery("minutes",[],{orderBy:[{field:"date",direction:"desc"}],limit:150},a):Ce=window.AppDB.listen("minutes",a)}function Uo(a=null,e=!1){ta&&clearInterval(ta),(async()=>{let n="out",s=null,i=!1,o=null,r=0;if(a)n=a.status||"out",s=a.lastCheckIn||null,i=a.isPaused===!0,o=a.pauseStartedAt||null,r=Number(a.totalPausedMs)||0;else{const f=await window.AppAttendance.getStatus();n=f.status,s=f.lastCheckIn,i=f.isPaused===!0,o=f.pauseStartedAt||null,r=Number(f.totalPausedMs)||0}const d=document.getElementById("timer-display"),l=document.getElementById("countdown-container"),c=document.getElementById("overtime-container"),p=document.getElementById("countdown-value"),u=document.getElementById("countdown-progress"),m=document.getElementById("overtime-value"),h=document.getElementById("timer-label");if(n==="in"&&s){const f=new Date(s),w=new Date,v=`${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,"0")}-${String(f.getDate()).padStart(2,"0")}`,k=`${w.getFullYear()}-${String(w.getMonth()+1).padStart(2,"0")}-${String(w.getDate()).padStart(2,"0")}`,b=v!==k,M=new Date(f);M.setHours(17,0,0,0);const A=f.getDay();A===6&&M.setHours(13,0,0,0),A===0&&M.setHours(17,0,0,0),ta=setInterval(()=>{const g=Date.now(),S=Number(o)||0,C=i&&S>0?Math.max(0,g-S):0,I=Math.max(0,g-s-r-C);if(d){let x=Math.floor(I/36e5),$=Math.floor(I/(1e3*60)%60),L=Math.floor(I/1e3%60);x=x<10?"0"+x:x,$=$<10?"0"+$:$,L=L<10?"0"+L:L,d.textContent=`${x} : ${$} : ${L}`}if(b){l&&(l.style.display="none"),c&&(c.style.display="none"),d&&(d.style.color="#b45309"),h&&(h.textContent="Session Carryover (Please Check Out)",h.style.color="#b45309");return}const y=Math.max(0,M.getTime()-s),_=y-I;if(_>0){l&&(l.style.display="block"),c&&(c.style.display="none"),h&&(h.textContent=i?"Paused":"Elapsed Time",h.style.color=i?"#b45309":"#6b7280"),d&&(d.style.color=i?"#b45309":"#1f2937");let x=Math.floor(_/(1e3*60*60)%24),$=Math.floor(_/(1e3*60)%60),L=Math.floor(_/1e3%60);x=x<10?"0"+x:x,$=$<10?"0"+$:$,L=L<10?"0"+L:L;const T=y>0?Math.min(100,I/y*100):100;p&&(p.textContent=`${x}:${$}:${L}`),u&&(u.style.width=`${T}%`),u&&(u.style.background=i?"#f59e0b":"var(--primary)")}else{l&&(l.style.display="none"),c&&(c.style.display="block");const x=Math.abs(_);let $=Math.floor(x/(1e3*60*60)),L=Math.floor(x/(1e3*60)%60),T=Math.floor(x/1e3%60);$=$<10?"0"+$:$,L=L<10?"0"+L:L,T=T<10?"0"+T:T,m&&(m.textContent=`+ ${$}:${L}:${T}`),d&&(d.style.color=i?"#b45309":"#c2410c"),h&&(h.textContent=i?"Paused (Overtime)":"Total Elapsed (Overtime)",h.style.color=i?"#b45309":"#c2410c")}},1e3),!e&&window.AppActivity&&(i&&window.AppActivity.stop?window.AppActivity.stop():!i&&window.AppActivity.start&&window.AppActivity.start())}else d&&(d.textContent="00 : 00 : 00",d.style.color=""),h&&(h.textContent="Elapsed Time",h.style.color=""),l&&(l.style.display="none"),c&&(c.style.display="none"),!e&&window.AppActivity&&window.AppActivity.stop&&window.AppActivity.stop()})()}window.getLocation=function(){return new Promise((e,t)=>{(async()=>{const n=window.location&&window.location.hostname?window.location.hostname:"",s=n==="localhost"||n==="127.0.0.1"||n==="::1";if(!window.isSecureContext&&!s){t("Location requires HTTPS on mobile. Open this app using an HTTPS URL and allow location access.");return}const i=Date.now();if(Me&&i-Ue<Xn){console.log("Using cached location (freshness: "+(i-Ue)+"ms)"),e(Me);return}if(!navigator.geolocation){t("Geolocation is not supported by your browser.");return}try{if(navigator.permissions&&navigator.permissions.query){const r=await navigator.permissions.query({name:"geolocation"});if(r&&r.state==="denied"){t("Location permission is blocked. Enable location for this site in browser settings and try again.");return}}}catch{}const o=r=>new Promise((d,l)=>{navigator.geolocation.getCurrentPosition(d,l,r)});try{console.log("Requesting Location: Quick/Low Accuracy...");const r=await o({enableHighAccuracy:!1,timeout:5e3,maximumAge:12e4}),d={lat:r.coords.latitude,lng:r.coords.longitude};Me=d,Ue=Date.now(),e(d);return}catch(r){console.warn("Quick location attempt failed:",r.message)}try{console.log("Requesting Location: High Accuracy (GPS fallback)...");const r=await o({enableHighAccuracy:!0,timeout:8e3,maximumAge:1e4}),d={lat:r.coords.latitude,lng:r.coords.longitude};Me=d,Ue=Date.now(),e(d);return}catch(r){console.warn("High accuracy fallback failed:",r.message)}if(Me&&Date.now()-Ue<So){console.warn("Using stale cached location fallback."),e(Me);return}t("Location request timed out. Move to open sky or better network and try again.")})().catch(n=>{t(n&&n.message?n.message:"Unable to retrieve location.")})})};const fe=a=>/^\d{4}-\d{2}-\d{2}$/.test(String(a||"")),Ho={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11},qo=(a="")=>{const e=String(a||"").trim();if(!e)return null;const t=e.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);if(!t)return null;const n=Number(t[1]),s=Number(t[2]),i=String(t[3]||"").toLowerCase(),o=Number(t[4]),r=Ho[i];if(!Number.isInteger(n)||!Number.isInteger(s)||!Number.isInteger(r)||!Number.isInteger(o))return null;const d=new Date(o,r,n),l=new Date(o,r,s);if(Number.isNaN(d.getTime())||Number.isNaN(l.getTime()))return null;const c=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,p=`${l.getFullYear()}-${String(l.getMonth()+1).padStart(2,"0")}-${String(l.getDate()).padStart(2,"0")}`;return p<c?null:{startDate:c,endDate:p}},ss=(a,e,t=null)=>{const n=fe(e)?String(e):null,s=a?.startDate,i=a?.endDate,o=!fe(s)&&!fe(i)?qo(a?.task||""):null;let r=fe(s)?String(s):o?.startDate||n,d=fe(i)?String(i):o?.endDate||r||n;if((!fe(s)||!fe(i))&&a?.sourcePlanId&&t?.workPlans){const l=(t.workPlans||[]).find(u=>u.id===a.sourcePlanId),c=Number.isInteger(a.sourceTaskIndex)?a.sourceTaskIndex:Number(a.sourceTaskIndex),p=l&&Array.isArray(l.plans)&&Number.isInteger(c)?l.plans[c]:null;if(p){const u=fe(p.startDate)?p.startDate:l.date||r,m=fe(p.endDate)?p.endDate:p.startDate||l.date||d;fe(s)||(r=u),fe(i)||(d=m)}}return r&&d&&d<r?{startDate:r,endDate:r}:{startDate:r,endDate:d}},is=(a,e,t,n=null)=>{const{startDate:s,endDate:i}=ss(a,e,n);return!s||!i?e===t:!(t<s||t>i||a?.completedDate&&a.completedDate<t)};window.app_getDayEvents=(a,e,t={})=>{const n=t.includeAuto!==!1,s=t.dedupe!==!1,i=t.userId||null;if(!e)return[];if(Array.isArray(e))return e.filter(l=>l.date===a);const o=new Date(a),r=[];if(n&&window.AppAnalytics){const l=window.AppAnalytics.getDayType(o);l==="Holiday"?r.push({title:"Company Holiday (Weekend)",type:"holiday",date:a}):l==="Half Day"&&r.push({title:"Half Working Day (Sat)",type:"event",date:a})}if((e.leaves||[]).forEach(l=>{a>=l.startDate&&a<=l.endDate&&r.push({title:`${l.userName||"Staff"} (Leave)`,type:"leave",userId:l.userId,date:a})}),(e.events||[]).forEach(l=>{l.date===a&&r.push({title:l.title,type:l.type||"event",date:a})}),(e.workPlans||[]).forEach(l=>{if(l.date>a)return;const p=(Array.isArray(l.plans)?l.plans:[]).filter(f=>is(f,l.date,a,e));if(!p.length)return;const h=`${(l.planScope||"personal")==="annual"?"All Staff (Annual)":l.userName||"Staff"}: ${p.map(f=>f.task).join("; ")}`;r.push({title:h,type:"work",userId:l.userId,plans:p,date:a,planScope:l.planScope||"personal"})}),i){const l=[];r.forEach(c=>{if(c.type!=="work"){l.push(c);return}if((c.planScope||"").toLowerCase()==="annual"){l.push(c);return}if(c.userId===i){l.push(c);return}if(Array.isArray(c.plans)&&c.plans.some(u=>Array.isArray(u.tags)&&u.tags.some(m=>m.id===i&&m.status==="accepted"))){l.push(c);return}}),r.length=0,r.push(...l)}if(!s)return r;const d=new Set;return r.filter(l=>{const c=l.type||"event";if(c!=="holiday"&&c!=="event")return!0;const p=`${c}|${l.title||""}|${l.userId||""}|${l.date||a}`;return d.has(p)?!1:(d.add(p),!0)})};const Ha=(a,e)=>{const t=String(a??"").trim();return!t||t==="undefined"||t==="null"?e:t},G=a=>String(a??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),pe=a=>String(a??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'"),zt=a=>{const e=String(a||"").trim();if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?"":`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`},jt=(a,e)=>{const t=zt(a);if(!t)return"NA";const n=t.replace(/-/g,""),s=String(e||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase().slice(-3)||"USR";return`EMP-${n}-${s}`},ia=(a,e,t)=>{const n=String(a??"").trim();if(!n)return null;if(!/^\d+$/.test(n))throw new Error("Birthday fields must be numeric.");const s=Number(n);if(!Number.isInteger(s)||s<e||s>t)throw new Error(`Birthday value must be between ${e} and ${t}.`);return s},os=(a,e)=>new Date(a,e,0).getDate(),We=a=>{const e=new Date().getFullYear()+1,t=ia(a.get("birthDay"),1,31),n=ia(a.get("birthMonth"),1,12),s=ia(a.get("birthYear"),1900,e);if(t&&n){const o=os(s||2024,n);if(t>o)throw new Error(`Birthday day is not valid for month ${n}.`)}return{birthDay:t,birthMonth:n,birthYear:s}},Nt=(a,e,t=null)=>{const n=Number(a||0),s=Number(e||0),i=Number(t||0),o=s>=1&&s<=12?new Date(2026,s-1,1).toLocaleString("en-US",{month:"long"}):"--",r=n?String(n).padStart(2,"0"):"--",d=i?` ${i}`:"";return`${r} ${o}${d}`.trim()},Yt=(a="user")=>(String(a||"user").trim().toLowerCase()==="external"?"external":"user")==="external"?{source:"external",collection:"birthday_people",label:"Birthday Person",emptyMessage:"Birthday person not found.",roleLabel:"Position",deptLabel:"Location"}:{source:"user",collection:"users",label:"Staff",emptyMessage:"Staff member not found.",roleLabel:"Role",deptLabel:"Department"},zo=(a,e="user")=>Yt(e).source==="external"?{title:a?.name||"Birthday Person",subtitle:`${a?.position||"Position not set"} • ${a?.location||"Location not set"}`}:{title:a?.name||"Staff",subtitle:`${a?.role||"Employee"} • ${a?.dept||"General"}`},jo=(a,e,t,n)=>{const s=Yt(e),i=Ae(t),o=Ae(n),r=ls(t,n),d=s.source==="external",l=d?a?.position||"":a?.role||"",c=d?a?.location||"":a?.dept||"",p=d?"Birthday Person":"Staff";return{id:`birthday_${s.source}_${i}_${a.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"birthday-reminder",title:`Upcoming Birthday: ${a.name||p}`,message:`${a.name||p} has a birthday on ${Nt(a.birthDay,a.birthMonth)}.`,description:`${r}. ${l||(d?"Position not set":"Employee")} • ${c||(d?"Location not set":"General")}`,status:"pending",date:new Date().toISOString(),read:!1,taggedByName:"Birthday Calendar",birthdayStaffId:a.id,birthdayStaffName:a.name||p,birthdaySource:s.source,birthdayDate:i,reminderDate:o,birthdayDisplay:Nt(a.birthDay,a.birthMonth,a.birthYear),birthdayReason:r,role:l,dept:c}},wt=()=>window.AppDB&&typeof window.AppDB.getIstNow=="function"?window.AppDB.getIstNow():new Date,Ae=a=>{const e=a instanceof Date?new Date(a):new Date(a);return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`},rs=(a,e=wt())=>{const t=Number(a?.birthDay||0),n=Number(a?.birthMonth||0);if(!t||!n)return null;const s=new Date(e),i=d=>{const l=os(d,n),c=Math.min(t,l);return new Date(d,n-1,c)};let o=i(s.getFullYear());o.setHours(0,0,0,0);const r=Ae(s);return Ae(o)<r&&(o=i(s.getFullYear()+1),o.setHours(0,0,0,0)),o},Yo=a=>window.AppAnalytics?.getDayType?.(a)!=="Holiday",ds=a=>{const e=new Date(a);for(e.setHours(0,0,0,0),e.setDate(e.getDate()-1);!Yo(e);)e.setDate(e.getDate()-1);return e},ls=(a,e)=>Math.round((a.getTime()-e.getTime())/864e5)<=1?"Birthday is tomorrow":"Birthday is on the next working day",Je=(a,e="NA")=>{if(a==null||a==="")return e;const t=a instanceof Date?a:new Date(a);return Number.isNaN(t.getTime())?e:t.toLocaleDateString("en-GB")},Wo=(a,e="NA")=>{if(a==null||a==="")return e;const t=a instanceof Date?a:new Date(a);return Number.isNaN(t.getTime())?e:t.toLocaleString("en-GB")},Ko=a=>`Rs ${Number(a||0).toLocaleString("en-IN")}`,Vo=(a="")=>{const e=String(a||"").replace(/\s+/g," ").trim();return e?e.length>72?`${e.slice(0,72)}...`:e:"New task"},qa=()=>`
        <div class="no-tags-placeholder day-plan-no-tags-placeholder">
            <p class="day-plan-no-tags-text">No collaborators yet</p>
        </div>
    `,cs=(a,e,t="pending")=>`
        <div class="tag-chip day-plan-tag-chip" data-id="${G(a)}" data-name="${G(e)}" data-status="${G(t)}">
            <span class="day-plan-tag-main">@${G(e)} <span class="day-plan-tag-pending">(${G(t)})</span></span>
            <i class="fa-solid fa-times day-plan-remove-collab-btn" onclick="window.app_removeTagHint(this)"></i>
        </div>
    `;window.app_refreshPlanBlockSummary=a=>{if(!a)return;const e=a.querySelector(".plan-task"),t=a.querySelector(".day-plan-task-summary"),n=a.querySelector(".plan-scope"),s=a.querySelector(".day-plan-scope-pill"),i=Vo(e?e.value:"");t&&(t.textContent=i),s&&n&&(s.textContent=n.value==="annual"?"Annual Plan":"Personal Plan")};window.app_togglePlanBlockCollapse=a=>{const e=a.closest(".plan-block");if(!e)return;e.classList.toggle("is-collapsed");const t=e.classList.contains("is-collapsed"),n=a.querySelector("i");n&&(n.classList.toggle("fa-chevron-down",!t),n.classList.toggle("fa-chevron-up",t));const s=a.querySelector(".day-plan-collapse-label");s&&(s.textContent=t?"Expand":"Minimize"),window.app_refreshPlanBlockSummary(e)};window.app_toggleTaskCollaborator=(a,e,t)=>{const n=a.closest(".plan-block");if(!n)return;const s=n.querySelector(".tags-container");if(!s)return;const i=typeof CSS<"u"&&CSS.escape?CSS.escape(e):e.replace(/"/g,'\\"'),o=s.querySelector(`[data-id="${i}"]`);if(o)o.remove(),a.classList.remove("selected");else{const r=s.querySelector(".no-tags-placeholder");r&&r.remove(),s.insertAdjacentHTML("beforeend",cs(e,t,"pending")),a.classList.add("selected")}s.querySelectorAll(".tag-chip").length===0&&(s.innerHTML=qa())};window.app_getAnnualDayStaffPlans=a=>{const e=window._currentPlans||{},t=window._annualUserMap||{},s=(e.workPlans||[]).filter(r=>r.date<=a).map(r=>{const d=t[r.userId]||r.userName||"Staff",l=new Map,c=h=>String(h||"").toLowerCase().replace(/\d{1,2}\s*-\s*\d{1,2}\s+[a-z]+\s+\d{4}/g," ").replace(/\([^)]*\)/g," ").replace(/[^a-z\s]/g," ").split(/\s+/).filter(Boolean).slice(0,8).join(" "),p=(h,f="")=>{const w=String(h).trim();if(!w)return;const v=c(w)||w.toLowerCase().replace(/\s+/g," "),k=`${w}${f||""}`;if(!l.has(v)){l.set(v,k);return}(l.get(v)||"")===w&&k!==w&&l.set(v,k)},u=(Array.isArray(r.plans)?r.plans:[]).filter(h=>is(h,r.date,a,e)).map(h=>{const{startDate:f,endDate:w}=ss(h,r.date,e),v=!!(f&&w&&f!==w),k=w===a,b=f===a,A=h.completedDate&&h.completedDate<w&&h.completedDate===a?" (Completed Early)":v&&k?" (Ends Today)":v&&b?" (Starts Today)":"";return p(h.task||"Planned task",A),""}).filter(Boolean),m=Array.from(l.values());return!m.length&&u.length?{name:d,tasks:u}:m.length?{name:d,tasks:m}:null}).filter(Boolean),i=r=>String(r||"").toLowerCase().replace(/\d{1,2}\s*-\s*\d{1,2}\s+[a-z]+\s+\d{4}/g," ").replace(/\([^)]*\)/g," ").replace(/[^a-z\s]/g," ").split(/\s+/).filter(Boolean).slice(0,8).join(" "),o=new Map;return s.forEach(r=>{const d=r.name||"Staff";o.has(d)||o.set(d,new Map);const l=o.get(d);(r.tasks||[]).forEach(c=>{const p=i(c)||String(c||"").toLowerCase();if(!l.has(p))l.set(p,c);else{const u=l.get(p)||"",m=String(c||"");u.length<m.length&&l.set(p,m)}})}),Array.from(o.entries()).map(([r,d])=>({name:r,tasks:Array.from(d.values())}))};window.app_showAnnualHoverPreview=(a,e)=>{const t="annual-hover-preview";document.getElementById(t)?.remove();const n=window.app_getAnnualDayStaffPlans(e),s=n.length?n.map(o=>`
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
            </div>`;window.app_showModal(s,e)};window.app_addPlanBlockUI=async()=>{const a=document.getElementById("plans-container");if(!a)return;const e=await window.AppDB.getAll("users"),t=window.AppAuth.getUser(),n=t.role==="Administrator"||t.isAdmin,s=Ha(window.app_currentDayPlanTargetId,t.id),i=a.dataset.defaultScope==="annual"?"annual":"personal",r=e.filter(h=>h.id!==s).map(h=>`
            <button
                type="button"
                class="day-plan-collab-option"
                data-id="${G(h.id)}"
                onclick="window.app_toggleTaskCollaborator(this, '${pe(h.id)}', '${pe(h.name)}')"
                title="Add or remove ${G(h.name)}"
            >${G(h.name)}</button>
        `).join(""),d=document.createElement("div");d.className="plan-block day-plan-block-shell",d.innerHTML=`
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
                            ${qa()}
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
        `,a.appendChild(d);const l=d.querySelector(".plan-start-date"),c=d.querySelector(".plan-end-date"),p=document.querySelector("#day-plan-modal .day-plan-head p")?.textContent?.match(/\d{4}-\d{2}-\d{2}/),u=p?p[0]:"";l&&(l.value=u),c&&(c.value=u);const m=d.querySelector(".plan-task");window.app_refreshPlanBlockSummary(d),m&&m.focus()};window.app_addSubPlanRow=a=>{const e=a.closest(".plan-block")?.querySelector(".sub-plans-list");if(!e)return;const t=document.createElement("div");t.className="sub-plan-row day-plan-sub-row",t.innerHTML=`
            <div class="day-plan-step-dot"></div>
            <input type="text" class="sub-plan-input day-plan-sub-input" placeholder="Add a step...">
            <button type="button" onclick="this.parentElement.remove()" title="Remove step" class="day-plan-remove-step-btn"><i class="fa-solid fa-circle-xmark"></i></button>
        `,e.appendChild(t);const n=t.querySelector("input");n&&n.focus()};window.app_checkMentions=(a,e)=>{const t=a.value,n=a.selectionStart,s=t.lastIndexOf("@",n-1),i=document.getElementById("mention-dropdown");if(i)if(s!==-1&&!t.substring(s,n).includes(" ")){const o=t.substring(s+1,n).toLowerCase(),r=e.filter(d=>d.name.toLowerCase().includes(o));if(a.id||(a.id="ta-"+Date.now()),r.length>0){const d=a.getBoundingClientRect();i.innerHTML=r.map(l=>`
                    <div onclick="window.app_applyMention('${a.id}', '${l.id}', '${l.name.replace(/'/g,"\\'")}', ${s})" class="mention-item day-plan-mention-item">
                        <img src="${l.avatar}" class="day-plan-mention-avatar" />
                        <span>${l.name}</span>
                    </div>
                `).join(""),i.style.top=`${d.bottom+6}px`,i.style.left=`${d.left}px`,i.style.display="block"}else i.style.display="none"}else i.style.display="none"};window.app_applyMention=(a,e,t,n)=>{const s=document.getElementById(a);if(!s)return;const i=s.selectionStart,o=s.value.substring(0,n),r=s.value.substring(i);s.value=`${o}${t} ${r}`,s.focus();const d=s.closest(".plan-block"),l=d?.querySelector(".tags-container");if(!l)return;const c=document.getElementById("mention-dropdown");if(c&&(c.style.display="none"),l.querySelector(`[data-id="${e}"]`))return;const u=l.querySelector(".no-tags-placeholder");u&&u.remove(),l.insertAdjacentHTML("beforeend",cs(e,t,"pending"));const m=typeof CSS<"u"&&CSS.escape?CSS.escape(e):e.replace(/"/g,'\\"'),h=d?.querySelector(`.day-plan-collab-option[data-id="${m}"]`);h&&h.classList.add("selected")};window.app_removeTagHint=a=>{const e=a.closest(".tags-container"),t=a.closest(".tag-chip"),n=t?t.dataset.id:"",s=a.closest(".plan-block");if(a.parentElement.remove(),s&&n){const i=typeof CSS<"u"&&CSS.escape?CSS.escape(n):n.replace(/"/g,'\\"'),o=s.querySelector(`.day-plan-collab-option[data-id="${i}"]`);o&&o.classList.remove("selected")}e&&e.querySelectorAll(".tag-chip").length===0&&(e.innerHTML=qa())};window.app_showStatusTooltip=()=>{};window.app_hideCheckoutIntro=()=>{const a=document.getElementById("checkout-intro-panel");a&&(a.style.display="none",localStorage.setItem("checkoutIntroSeen","true"))};window.app_updateCharCounter=a=>{const e=document.getElementById("char-counter");if(e){const t=a.value.length;e.textContent=`${t} / 500 recommended`,t>500?e.style.color="#f59e0b":t>300?e.style.color="#10b981":e.style.color="#94a3b8"}};window.app_selectLocationReason=a=>{const e=document.getElementById("location-explanation");e&&(document.querySelectorAll(".location-reason-btn").forEach(t=>{t.style.background="#e0f2fe",t.style.borderColor="#7dd3fc"}),event.target.style.background="#0ea5e9",event.target.style.borderColor="#0ea5e9",event.target.style.color="white",e.value=a,e.focus())};window.app_selectOvertimeReason=(a,e,t="overtime_work")=>{const n=document.getElementById("checkout-overtime-explanation"),s=document.getElementById("checkout-overtime-mode");document.querySelectorAll(".overtime-reason-btn").forEach(i=>{i.style.background="#fef3c7",i.style.borderColor="#fcd34d",i.style.color="#92400e"}),a&&(a.style.background="#f59e0b",a.style.borderColor="#f59e0b",a.style.color="white"),s&&(s.value=t),n&&(n.value=e,n.focus())};window.app_useWorkPlan=()=>{const a=document.getElementById("checkout-plan-text"),e=document.getElementById("checkout-work-summary"),t=a?.dataset?.rawText;t&&e&&(e.value=t,window.app_updateCharCounter&&window.app_updateCharCounter(e),e.focus(),e.style.borderColor="#8b5cf6",e.style.background="#f5f3ff",setTimeout(()=>{e.style.borderColor="#e2e8f0",e.style.background="#ffffff"},1e3))};const It={started:"Started",half_done:"Half Done",blocked:"Blocked",waiting:"Waiting",done:"Done"},Ee=a=>typeof CSS<"u"&&CSS.escape?CSS.escape(a):String(a||"").replace(/"/g,'\\"');window.app_getCheckoutTaskKey=(a,e)=>`${a}:${e}`;window.app_parseCheckoutTaskKey=a=>{const e=String(a||""),t=e.lastIndexOf(":");if(t<=0)return{planId:e,taskIndex:-1};const n=e.slice(0,t),s=Number(e.slice(t+1));return{planId:n,taskIndex:s}};window.app_initCheckoutTaskDetails=(a,e,t)=>{window.app_checkoutTaskDetails=window.app_checkoutTaskDetails||{};const n=window.app_getCheckoutTaskKey(a,e);if(!window.app_checkoutTaskDetails[n]){const s=Number(t?.progressPercent),i=Number.isFinite(s)?Math.min(100,Math.max(0,s)):t?.status==="completed"?100:0,o=t?.progressStatus||(i>=100?"done":i>0?"started":"waiting");window.app_checkoutTaskDetails[n]={action:"",progressPercent:i,progressStatus:o,progressNote:t?.progressNote||"",actionMeta:{},lastUpdatedAt:null}}return window.app_checkoutTaskDetails[n]};window.app_markCheckoutTaskSaved=a=>{const t=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Ee(a)}"]`)?.querySelector("[data-saved-indicator]");t&&(t.classList.add("is-visible"),clearTimeout(t._hideTimeout),t._hideTimeout=setTimeout(()=>{t.classList.remove("is-visible")},1400))};window.app_setCheckoutTaskStatus=(a,e)=>{const t=window.app_checkoutTaskDetails?.[a];t&&(t.progressStatus=e,t.lastUpdatedAt=new Date().toISOString(),window.app_syncCheckoutTaskPanel(a),window.app_markCheckoutTaskSaved(a),window.app_renderCheckoutActionPreview())};window.app_updateCheckoutTaskProgress=(a,e)=>{const t=window.app_checkoutTaskDetails?.[a];if(!t)return;const n=Math.min(100,Math.max(0,Number(e||0)));t.progressPercent=n,n>=100&&(t.progressStatus="done"),t.lastUpdatedAt=new Date().toISOString(),window.app_syncCheckoutTaskPanel(a),window.app_markCheckoutTaskSaved(a),window.app_renderCheckoutActionPreview()};window.app_updateCheckoutTaskNote=(a,e)=>{const t=window.app_checkoutTaskDetails?.[a];t&&(t.progressNote=String(e||""),t.lastUpdatedAt=new Date().toISOString(),window.app_markCheckoutTaskSaved(a),window.app_renderCheckoutActionPreview())};window.app_updateCheckoutTaskActionMeta=(a,e,t)=>{const n=window.app_checkoutTaskDetails?.[a];n&&(n.actionMeta=n.actionMeta||{},n.actionMeta[e]=t,n.lastUpdatedAt=new Date().toISOString(),window.app_markCheckoutTaskSaved(a),window.app_renderCheckoutActionPreview())};window.app_clearCheckoutTaskError=a=>{const e=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Ee(a)}"]`);if(!e)return;e.classList.remove("has-error");const t=e.querySelector("[data-inline-error]");t&&(t.textContent="")};window.app_setCheckoutTaskError=(a,e)=>{const t=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Ee(a)}"]`);if(!t)return;t.classList.add("has-error");const n=t.querySelector("[data-inline-error]");n&&(n.textContent=e)};window.app_syncCheckoutTaskPanel=a=>{const e=window.app_checkoutTaskDetails?.[a],t=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Ee(a)}"]`);if(!t||!e)return;const n=t.querySelector("[data-progress-value]"),s=t.querySelector("[data-progress-input]");s&&(s.value=e.progressPercent),n&&(n.textContent=`${e.progressPercent}%`);const i=t.querySelector("[data-progress-note]");i&&i.value!==e.progressNote&&(i.value=e.progressNote||""),t.querySelectorAll("[data-status-chip]").forEach(o=>{const r=o.getAttribute("data-status-chip");o.classList.toggle("is-selected",r===e.progressStatus)}),t.querySelectorAll("[data-action-panel-section]").forEach(o=>{const r=o.getAttribute("data-action-panel-section");o.style.display=e.action===r?"block":"none"}),t.querySelectorAll("[data-action-field]").forEach(o=>{const r=o.getAttribute("data-action-field"),d=e.actionMeta?.[r]??"";o.value!==String(d)&&(o.value=String(d))})};window.app_collectCheckoutTaskUpdates=()=>{const a=[],e=[],t=window.app_checkoutTaskDetails||{};return Object.keys(t).forEach(n=>{const s=t[n];if(!s||!s.action)return;const{planId:i,taskIndex:o}=window.app_parseCheckoutTaskKey(n);let r="";if(s.action==="postpone"){const d=s.actionMeta?.postponeDate,l=String(s.actionMeta?.postponeReason||"").trim();d?l||(r="Add a reason for postponing."):r="Select a new date to postpone."}if(s.action==="delegate"&&(String(s.actionMeta?.delegateUserId||"").trim()||(r="Select a staff member to delegate.")),r){e.push({key:n,message:r});return}a.push({key:n,planId:i,taskIndex:o,action:s.action,progressPercent:s.progressPercent,progressStatus:s.progressStatus,progressNote:s.progressNote,actionMeta:s.actionMeta||{},timestamp:new Date().toISOString()})}),{updates:a,errors:e}};window.app_closeCheckoutActionModal=()=>{document.getElementById("checkout-action-detail-modal")?.remove()};window.app_openCheckoutActionModal=a=>{const e=window.app_checkoutTaskDetails?.[a];if(!e||!e.action)return;const t=window.app_checkoutTaskMeta?.[a]||{},n=window.app_checkoutUserMap||{},s=window.AppAuth.getUser()?.id,i=document.getElementById("checkout-action-detail-modal");i&&i.remove();const o=e.action==="complete"?"Complete":e.action==="postpone"?"Postpone":e.action==="delegate"?"Delegate":"Action",r=Object.keys(It).map(w=>`<button type="button" class="checkout-task-chip ${e.progressStatus===w?"is-selected":""}" data-status-chip="${w}" onclick="window.app_setCheckoutTaskStatus('${pe(a)}','${w}')">${It[w]}</button>`).join(""),d=G(e.actionMeta?.postponeDate||new Date(Date.now()+864e5).toISOString().split("T")[0]),l=G(e.actionMeta?.postponeReason||""),c=G(e.actionMeta?.completionNote||""),p=G(e.actionMeta?.delegateNote||""),u=G(e.actionMeta?.delegateUserId||""),m=G(e.progressNote||""),h=Object.keys(n).filter(w=>String(w)!==String(s)).map(w=>{const v=u&&u===String(w)?"selected":"";return`<option value="${G(w)}" ${v}>${G(n[w])}</option>`}).join(""),f=document.createElement("div");f.id="checkout-action-detail-modal",f.className="modal-overlay checkout-action-detail-modal",f.setAttribute("data-checkout-key",a),f.innerHTML=`
        <div class="modal-content checkout-action-detail-content">
            <div class="checkout-action-detail-header">
                <div>
                    <div class="checkout-action-detail-title">${G(t.text||"Task")}</div>
                    <div class="checkout-action-detail-sub">${G(o)} • ${e.progressPercent}% • ${G(It[e.progressStatus]||"")}</div>
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
                    <input type="range" min="0" max="100" value="${e.progressPercent}" data-progress-input oninput="window.app_updateCheckoutTaskProgress('${pe(a)}', this.value)">
                </div>
                <div class="checkout-task-field">
                    <label>Status</label>
                    <div class="checkout-task-status-chips">
                        ${r}
                    </div>
                </div>
                <div class="checkout-task-field">
                    <label>Note</label>
                    <textarea rows="2" data-progress-note placeholder="What changed? (optional)" oninput="window.app_updateCheckoutTaskNote('${pe(a)}', this.value)">${m}</textarea>
                </div>
                <div class="checkout-task-action-extra" data-action-panel-section="complete" style="display:${e.action==="complete"?"block":"none"};">
                    <label>Completion Note</label>
                    <textarea rows="2" data-action-field="completionNote" placeholder="Optional details for completion." oninput="window.app_updateCheckoutTaskActionMeta('${pe(a)}','completionNote', this.value)">${c}</textarea>
                </div>
                <div class="checkout-task-action-extra" data-action-panel-section="postpone" style="display:${e.action==="postpone"?"block":"none"};">
                    <label>New Date</label>
                    <input type="date" data-action-field="postponeDate" value="${d}" onchange="window.app_updateCheckoutTaskActionMeta('${pe(a)}','postponeDate', this.value)">
                    <label>Reason</label>
                    <textarea rows="2" data-action-field="postponeReason" placeholder="Why postponed?" oninput="window.app_updateCheckoutTaskActionMeta('${pe(a)}','postponeReason', this.value)">${l}</textarea>
                </div>
                <div class="checkout-task-action-extra" data-action-panel-section="delegate" style="display:${e.action==="delegate"?"block":"none"};">
                    <label>Assign To</label>
                    <select data-action-field="delegateUserId" onchange="window.app_updateCheckoutTaskActionMeta('${pe(a)}','delegateUserId', this.value)">
                        <option value="">Select staff</option>
                        ${h}
                    </select>
                    <label>Handoff Note</label>
                    <textarea rows="2" data-action-field="delegateNote" placeholder="Handoff context (optional)." oninput="window.app_updateCheckoutTaskActionMeta('${pe(a)}','delegateNote', this.value)">${p}</textarea>
                </div>
                <div class="checkout-task-inline-error" data-inline-error></div>
            </div>
            <div class="checkout-action-detail-footer">
                <button type="button" class="action-btn secondary" onclick="window.app_closeCheckoutActionModal()">Done</button>
            </div>
        </div>
    `,document.body.appendChild(f),window.app_syncCheckoutTaskPanel(a)};window.app_renderCheckoutActionPreview=()=>{const a=document.getElementById("checkout-action-preview"),e=document.getElementById("checkout-action-preview-list");if(!a||!e)return;const t=window.app_checkoutTaskDetails||{},n=window.app_checkoutTaskMeta||{},s=window.app_checkoutUserMap||{},i=Object.keys(t).map(o=>{const r=t[o];if(!r||!r.action)return null;const l=(n[o]||{}).text||"Task",c=r.action==="complete"?"Complete":r.action==="postpone"?"Postpone":r.action==="delegate"?"Delegate":r.action,p=It[r.progressStatus]||"Waiting",u=String(r.progressNote||"").trim();let m="";if(r.action==="postpone"){const h=zt(r.actionMeta?.postponeDate)||"—",f=String(r.actionMeta?.postponeReason||"").trim();m=`New date: ${G(h)}${f?` • Reason: ${G(f)}`:""}`}if(r.action==="delegate"){const h=String(r.actionMeta?.delegateUserId||""),f=s[h]||"—",w=String(r.actionMeta?.delegateNote||"").trim();m=`Assigned to: ${G(f)}${w?` • Note: ${G(w)}`:""}`}if(r.action==="complete"){const h=String(r.actionMeta?.completionNote||"").trim();m=h?`Completion note: ${G(h)}`:""}return`
            <div class="checkout-action-preview-item">
                <div class="checkout-action-preview-title">${G(l)}</div>
                <div class="checkout-action-preview-meta">
                    <span class="checkout-action-preview-chip">${G(c)}</span>
                    <span>${r.progressPercent}% • ${G(p)}</span>
                </div>
                ${u?`<div class="checkout-action-preview-note">${G(u)}</div>`:""}
                ${m?`<div class="checkout-action-preview-extra">${m}</div>`:""}
            </div>
        `}).filter(Boolean);if(i.length===0){a.style.display="none",e.innerHTML="";return}a.style.display="block",e.innerHTML=i.join("")};window.app_applyCheckoutTaskUpdates=async(a=[])=>{if(!Array.isArray(a)||a.length===0)return;const e=window.AppAuth.getUser(),t=e?.id||e?.name||"staff",n=new Date().toISOString().split("T")[0];for(const s of a){const i=await window.AppDB.get("work_plans",s.planId).catch(()=>null);if(!i||!Array.isArray(i.plans))continue;const o=i.plans[s.taskIndex];if(o){if(o.progressPercent=s.progressPercent,o.progressStatus=s.progressStatus,o.progressNote=s.progressNote,o.lastProgressUpdateAt=s.timestamp,o.lastProgressUpdateBy=t,o.lastCheckoutAction=s.action,s.action==="complete"&&(o.status="completed",o.completedDate||(o.completedDate=n)),s.action==="postpone"&&(o.status="postponed"),i.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",i),s.action==="postpone"){const r=zt(s.actionMeta?.postponeDate);if(r){const d=o.subPlans&&o.subPlans.length?` - ${o.subPlans.join(", ")}`:"",l=`${o.task}${d}`,c=i.date||n,u=`${l.replace(/\s*\(Postponed from [^)]+\)\s*$/i,"")} (Postponed from ${c})`;await window.AppCalendar.addWorkPlanTask(r,e.id,u,[],{addedFrom:"postponed",sourcePlanId:s.planId,sourceTaskIndex:s.taskIndex,postponedFromDate:c})}}if(s.action==="delegate"){const r=String(s.actionMeta?.delegateUserId||"").trim();r&&await window.app_delegateTo(s.planId,s.taskIndex,r)}}}window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans()};window.app_deleteDayPlan=async(a,e=null,t=null)=>{if(!await window.appConfirm("Are you sure you want to delete this work plan?"))return;const n=window.AppAuth.getUser(),s=Ha(e,n.id);try{t==="personal"||t==="annual"?await window.AppCalendar.deleteWorkPlan(a,s,{planScope:t}):await Promise.all([window.AppCalendar.deleteWorkPlan(a,s,{planScope:"personal"}),window.AppCalendar.deleteWorkPlan(a,s,{planScope:"annual"})]),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert("Plan deleted!"),document.getElementById("day-plan-modal")?.remove();const o=await q.renderDashboard(),r=document.getElementById("page-content");r&&(r.innerHTML=o,window.setupDashboardEvents&&window.setupDashboardEvents())}catch(i){alert(i.message)}};window.app_saveDayPlan=async(a,e,t=null)=>{a.preventDefault();const n=window.AppAuth.getUser(),s=Ha(t,n.id),i=a.target,o=i?.dataset?.hadPersonal==="1",r=i?.dataset?.hadAnnual==="1";let d=[];try{d=JSON.parse(i?.dataset?.removedTasks||"[]")}catch{d=[]}const l=document.querySelectorAll(".plan-block"),c=[],p=[],u=[],m={};let h="";if(l.forEach(f=>{const w=f.querySelector(".plan-task").value.trim(),v=f.querySelectorAll(".sub-plan-input"),k=Array.from(v).map(E=>E.value.trim()).filter(E=>E!==""),b=f.querySelectorAll(".tag-chip"),M=Array.from(b).map(E=>({id:E.dataset.id,name:E.dataset.name,status:E.dataset.status||"pending"})),A=f.querySelector(".plan-status").value,g=f.querySelector(".plan-assignee"),S=g?g.value:s,C=f.querySelector(".plan-start-date"),I=f.querySelector(".plan-end-date"),y=C?String(C.value||"").trim():"",_=I?String(I.value||"").trim():"",x=f.querySelector(".plan-root-id"),$=x?String(x.value||"").trim():"",L=f.querySelector(".plan-scope"),T=L&&L.value==="annual"?"annual":"personal";if(w){if(y&&!_||!y&&_){h="Please select both From Date and To Date for ranged tasks.";return}if(y&&_&&_<y){h="To Date cannot be earlier than From Date.";return}const B={task:w,subPlans:k,tags:M,status:A||null,assignedTo:S||null,startDate:y||e,endDate:_||e,planScope:T,carryForwardRootId:$||null,completedDate:A==="completed"?new Date().toISOString().split("T")[0]:null};c.push(B),T==="annual"?u.push(B):p.push(B)}}),d.forEach(f=>{const w=String(f?.rootId||"").trim(),v=f?.scope==="annual"?"annual":"personal";if(!w)return;const k={task:"[Removed Task]",subPlans:[],tags:[],status:"not-completed",assignedTo:s||null,startDate:e,endDate:e,planScope:v,carryForwardRootId:w,isRemoved:!0,removedAt:new Date().toISOString()};c.push(k),v==="annual"?u.push(k):p.push(k)}),h){alert(h);return}try{if(c.length===0&&(o&&await window.AppCalendar.deleteWorkPlan(e,s,{planScope:"personal"}),r&&await window.AppCalendar.deleteWorkPlan(e,s,{planScope:"annual"}),!o&&!r)){alert("Please add at least one task.");return}p.length>0?(await window.AppCalendar.setWorkPlan(e,p,s,{planScope:"personal"}),m.personal=window.AppCalendar.getWorkPlanId(e,s,"personal")):o&&await window.AppCalendar.deleteWorkPlan(e,s,{planScope:"personal"}),u.length>0?(await window.AppCalendar.setWorkPlan(e,u,s,{planScope:"annual"}),m.annual=window.AppCalendar.getWorkPlanId(e,s,"annual")):r&&await window.AppCalendar.deleteWorkPlan(e,s,{planScope:"annual"}),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans();const f=await window.AppDB.getAll("users");if(s!==n.id&&(n.role==="Administrator"||n.isAdmin)){const b=f.find(M=>M.id===s);if(b){b.notifications||(b.notifications=[]);const M=b.notifications[b.notifications.length-1];(!M||M.message!==`Admin ${n.name} has edited your Work Plan for ${e}`)&&(b.notifications.push({type:"admin_edit",message:`Admin ${n.name} has edited your Work Plan for ${e}`,date:new Date().toLocaleString(),read:!1}),await window.AppDB.put("users",b))}}const w=new Set;if(c.forEach(b=>{b.tags&&b.tags.forEach(M=>w.add(M.id))}),w.size>0){for(const b of w){const M=f.find(A=>A.id===b);M&&b!==n.id&&(M.notifications||(M.notifications=[]),c.forEach((A,g)=>{if(A.tags&&A.tags.some(S=>S.id===b)){const S=A.planScope==="annual"?"annual":"personal",C=m[S]||window.AppCalendar.getWorkPlanId(e,s,S);M.notifications.some(y=>{const _=String(y?.type||"").toLowerCase();return(_==="tag"||_==="mention")&&String(y.planId||"")===String(C||"")&&Number(y.taskIndex)===Number(g)&&String(y.taggedById||"")===String(n.id||"")})||M.notifications.push({id:`tag_${Date.now()}_${b}_${g}`,type:"tag",title:A.task||"Tagged task",description:A.subPlans&&A.subPlans.length>0?A.subPlans.join(", "):"",taggedById:n.id,taggedByName:n.name,taggedAt:new Date().toISOString(),status:"pending",source:"plan",planId:C,taskIndex:g,message:`${n.name} tagged you in: "${A.task}" for ${e}`,date:new Date().toLocaleString(),read:!1})}}),await window.AppDB.put("users",M))}for(let b=0;b<c.length;b++){const M=c[b];if(M.tags)for(const A of M.tags){if(A.id===s)continue;const g=f.find(_=>_.id===A.id);if(!g||!window.AppCalendar)continue;const S=M.planScope==="annual"?"annual":"personal",C=m[S]||window.AppCalendar.getWorkPlanId(e,s,S),I=M.subPlans&&M.subPlans.length>0?` - ${M.subPlans.join(", ")}`:"",y=`${M.task}${I} (Responsible: ${g.name})`;await window.AppCalendar.addWorkPlanTask(e,g.id,y,[{id:n.id,name:n.name,status:"pending"}],{addedFrom:"tag",sourcePlanId:C,sourceTaskIndex:b,taggedById:n.id,taggedByName:n.name,status:"pending",subPlans:M.subPlans||[],startDate:M.startDate||e,endDate:M.endDate||M.startDate||e})}}}alert("Plans saved successfully!"),document.getElementById("day-plan-modal")?.remove();const v=await q.renderDashboard(),k=document.getElementById("page-content");k&&(k.innerHTML=v,window.setupDashboardEvents&&window.setupDashboardEvents())}catch(f){alert(f.message)}};window.app_handleTagResponse=async(a,e,t,n)=>{const s=window.AppAuth.getUser();try{const i=a?await window.AppDB.get("work_plans",a).catch(()=>null):null;if(!i||!i.plans||!i.plans[e]){console.warn(`app_handleTagResponse: plan/task not found for planId=${a}, taskIdx=${e}. Falling back to notification-only update.`);const c=await window.AppDB.get("users",s.id).catch(()=>null),p=c?.notifications?.[n]?.id||null;if(p||n>=0)await window.app_handleTagDecision(p||String(n),t);else{if(c?.notifications?.[n]){const m=new Date().toISOString();c.notifications[n].status=t,c.notifications[n].respondedAt=m,c.notifications[n].read=!0,c.notifications[n].dismissedAt=m,await window.AppDB.put("users",c)}const u=document.getElementById("page-content");u&&(u.innerHTML=await q.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),alert(`You have ${t} the request.`)}return}const o=i.plans[e];if(o.tags){const c=o.tags.find(p=>p.id===s.id);c&&(c.status=t)}await window.AppDB.put("work_plans",i);const r=await window.AppDB.get("users",s.id);let d="";if(t==="rejected"&&(d=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Task",confirmText:"Submit Reason"})||""),r&&r.notifications){const c=r.notifications[n];if(c){const p=new Date().toISOString();c.status=t,c.respondedAt=p,c.read=!0,c.dismissedAt=p,d&&(c.rejectReason=d)}r.tagHistory||(r.tagHistory=[]),r.tagHistory.unshift({id:`taghist_${Date.now()}`,type:"tag_response",title:c?.title||i.plans[e].task||"Tagged task",taggedByName:c?.taggedByName||i.userName||"Staff",status:t,reason:d,date:new Date().toISOString()}),await window.AppDB.put("users",r)}if(i.userId){const c=await window.AppDB.get("users",i.userId);c&&(c.notifications||(c.notifications=[]),c.notifications.unshift({id:`tagresp_${Date.now()}`,type:"tag_response",message:`${s.name} ${t} your tag request.`,title:i.plans[e].task,taggedByName:s.name,status:t,reason:d,date:new Date().toISOString(),read:!1}),await window.AppDB.put("users",c))}window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans();const l=document.getElementById("page-content");l&&(l.innerHTML=await q.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),alert(`You have ${t} the collaboration request.`)}catch(i){console.error("app_handleTagResponse error:",i),alert("Error processing your response. Please try again.")}};window.app_changeCalMonth=a=>{let e=window.app_calMonth+a;e<0&&(window.app_calYear--,e=11),e>11&&(window.app_calYear++,e=0),window.app_calMonth=e,q.renderDashboard().then(async t=>{const n=document.getElementById("page-content");n.innerHTML=t,Ne()})};window.app_exportCalendar=async()=>{const a=window._currentPlans,e=window.app_calMonth,t=window.app_calYear;if(!a){alert("Calendar data not loaded yet.");return}try{await window.AppReports.exportCalendarPlansCSV(a,e,t)}catch(n){alert("Export failed: "+n.message)}};window.app_newMeeting=async()=>{const a=window.AppAuth.getUser(),e={id:"meeting_"+Date.now(),title:"",date:new Date().toISOString().split("T")[0],minutes:"",author:a.name,timestamp:new Date().toISOString()};await window.AppDB.put("meetings",e),window._selectedMeetingId=e.id;const t=document.getElementById("page-content");t.innerHTML=await q.renderMinutes()};window.app_selectMeeting=async a=>{window._selectedMeetingId=a;const e=document.getElementById("page-content");e.innerHTML=await q.renderMinutes()};window.app_saveMeeting=async()=>{const a=document.getElementById("meeting-title")?.value,e=document.getElementById("meeting-date")?.value,t=document.getElementById("meeting-minutes")?.value;if(!window._selectedMeetingId){alert("No meeting selected");return}const n=await window.AppDB.get("meetings",window._selectedMeetingId);if(!n){alert("Meeting not found");return}n.title=a,n.date=e,n.minutes=t,n.timestamp=new Date().toISOString(),await window.AppDB.put("meetings",n);const s=document.getElementById("page-content");s.innerHTML=await q.renderMinutes(),alert("Meeting minutes saved successfully!")};window.app_deleteMeeting=async a=>{if(!await window.appConfirm("Are you sure you want to delete this meeting?"))return;await window.AppDB.delete("meetings",a),window._selectedMeetingId=null;const e=document.getElementById("page-content");e.innerHTML=await q.renderMinutes()};window.app_postponeTask=async(a,e,t)=>{if(t)try{const n=window.AppAuth.getUser();await window.AppCalendar.updateTaskStatus(a,e,"postponed");const s=await window.AppDB.get("work_plans",a),i=s?.plans?.[e],o=i&&i.subPlans&&i.subPlans.length?` - ${i.subPlans.join(", ")}`:"",r=i?`${i.task}${o}`:"",d=s?.date||new Date().toISOString().split("T")[0],c=`${r.replace(/\s*\(Postponed from [^)]+\)\s*$/i,"")} (Postponed from ${d})`;await window.AppCalendar.addWorkPlanTask(t,n.id,c,[],{addedFrom:"postponed",sourcePlanId:a,sourceTaskIndex:e,postponedFromDate:d}),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert(`Task postponed to ${t}`),typeof Oe=="function"&&await Oe()}catch(n){alert("Failed to postpone task: "+n.message)}};window.app_openPostponeModal=function(a,e){const t="postpone-task-modal";document.getElementById(t)?.remove();const n=new Date(Date.now()+864e5).toISOString().split("T")[0],s=`
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
            </div>`;window.app_showModal(s,t)};window.app_confirmPostponeTask=async function(a,e){const t=document.getElementById("postpone-date-input")?.value;if(!t)return alert("Please select a date.");document.getElementById("postpone-task-modal")?.remove(),await window.app_postponeTask(a,e,t)};window.app_openDelegateModal=async function(a,e){const t="delegate-task-modal";document.getElementById(t)?.remove();const n=await window.AppDB.getAll("users").catch(()=>[]),s=window.AppAuth.getUser(),i=(n||[]).filter(d=>d.id!==s.id);window.app_delegateModalContext={planId:a,taskIndex:e,selectedUserId:""};const o=i.map(d=>`
            <button type="button" class="delegate-picker-item" data-user-id="${d.id}" data-name="${(d.name||"").toLowerCase()}" onclick="window.app_selectDelegateUser('${d.id}')">
                <img src="${d.avatar||""}" alt="${d.name}" class="delegate-user-avatar">
                <span>${d.name}</span>
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
            </div>`;window.app_showModal(r,t)};window.app_filterDelegateUsers=function(a){const e=String(a||"").toLowerCase().trim();Array.from(document.querySelectorAll("#delegate-picker-list .delegate-picker-item")).forEach(t=>{const n=t.getAttribute("data-name")||"";t.style.display=!e||n.includes(e)?"flex":"none"})};window.app_selectDelegateUser=function(a){if(!window.app_delegateModalContext)return;window.app_delegateModalContext.selectedUserId=a,Array.from(document.querySelectorAll("#delegate-picker-list .delegate-picker-item")).forEach(t=>{t.classList.toggle("selected",t.getAttribute("data-user-id")===a)});const e=document.getElementById("delegate-confirm-btn");e&&(e.disabled=!a)};window.app_confirmDelegateTask=async function(){const a=window.app_delegateModalContext;if(!a||!a.selectedUserId)return alert("Please select a staff member.");document.getElementById("delegate-task-modal")?.remove(),await window.app_delegateTo(a.planId,a.taskIndex,a.selectedUserId)};window.app_formatTaskWithPostponeChip=function(a){const e=String(a||""),t=e.match(/^(.*)\s+\(Postponed from ([^)]+)\)\s*$/i);if(!t)return e;const n=t[1].trim(),s=t[2].trim();return`${n} <span class="postponed-source-chip">Postponed from ${s}</span>`};window.app_appendCompletedTaskToSummary=async function(a,e){const n=(await window.AppDB.get("work_plans",a))?.plans?.[e];if(!n)return;const s=n.subPlans&&n.subPlans.length?` (${n.subPlans.join(", ")})`:"",i=`- ${n.task}${s}`,o=document.getElementById("checkout-work-summary"),r=(o?.value||window.app_checkoutSummaryDraft||"").trim(),l=r.split(`
`).some(c=>c.trim()===i.trim())?r:r?`${r}
${i}`:i;window.app_checkoutSummaryDraft=l,o&&(o.value=l,window.app_updateCharCounter&&window.app_updateCharCounter(o))};window.app_handleChecklistAction=async function(a,e,t){const n=document.getElementById("checkout-task-checklist"),s=document.getElementById("delegate-panel");window.app_checkoutTaskActions=window.app_checkoutTaskActions||{};const i=`${a}:${e}`;if(!t){delete window.app_checkoutTaskActions[i],window.app_checkoutTaskDetails&&delete window.app_checkoutTaskDetails[i],s&&(s.style.display="none"),n&&n.classList.remove("delegate-open");const d=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Ee(i)}"]`);d&&d.remove();const l=document.querySelector(`.checkout-task-detail-btn[data-checkout-detail-key="${Ee(i)}"]`);l&&(l.disabled=!0),window.app_renderCheckoutActionPreview();return}window.app_checkoutTaskActions[i]=t,window.app_checkoutTaskDetails=window.app_checkoutTaskDetails||{};const o=window.app_checkoutTaskDetails[i]||{action:"",progressPercent:0,progressStatus:"waiting",progressNote:"",actionMeta:{}};o.action=t,t==="complete"&&(o.progressPercent=100,o.progressStatus="done",await window.app_appendCompletedTaskToSummary(a,e)),t==="postpone"&&(o.actionMeta?.postponeDate||(o.actionMeta=o.actionMeta||{},o.actionMeta.postponeDate=new Date(Date.now()+864e5).toISOString().split("T")[0])),window.app_checkoutTaskDetails[i]=o,s&&(s.style.display="none"),n&&n.classList.remove("delegate-open");const r=document.querySelector(`.checkout-task-detail-btn[data-checkout-detail-key="${Ee(i)}"]`);r&&(r.disabled=!1),window.app_openCheckoutActionModal(i),window.app_clearCheckoutTaskError(i),window.app_renderCheckoutActionPreview()};window.app_markTaskCompleted=async function(a,e){try{const t=new Date().toISOString().split("T")[0];await window.AppCalendar.updateTaskStatus(a,e,"completed",t),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert("Task marked as completed."),typeof Oe=="function"&&await Oe()}catch(t){alert("Failed to mark completed: "+t.message)}};window.app_delegateTask=async function(a,e){try{const t=await window.AppDB.getAll("users"),n=t.map(o=>o.name).join(", "),s=await window.appPrompt(`Delegate to which staff? Enter name.
Available: ${n}`,"",{title:"Delegate Task",placeholder:"Type staff name"});if(!s)return;const i=t.find(o=>o.name.toLowerCase()===s.toLowerCase());if(!i){alert("Staff not found.");return}await window.app_delegateTo(a,e,i.id)}catch(t){alert("Failed to delegate task: "+t.message)}};window.app_delegateTo=async function(a,e,t){try{const n=await window.AppDB.get("work_plans",a);if(!n||!n.plans||!n.plans[e]){alert("Task not found.");return}const s=window.AppAuth.getUser(),i=n.plans[e],o=i.subPlans&&i.subPlans.length?` — ${i.subPlans.join(", ")}`:"",r=`${i.task}${o}`;i.tags||(i.tags=[]);const l=(await window.AppDB.getAll("users")).find(p=>p.id===t);if(!l){alert("Staff not found.");return}i.tags.some(p=>p.id===l.id)||i.tags.push({id:l.id,name:l.name,status:"pending"}),i.status=i.status||"pending",n.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",n),await window.AppCalendar.addWorkPlanTask(n.date,l.id,r,[{id:s.id,name:s.name,status:"pending"}],{addedFrom:"delegated",sourcePlanId:a,sourceTaskIndex:e,taggedById:s.id,taggedByName:s.name,status:"pending",subPlans:i.subPlans||[]});const c=await window.AppDB.get("users",l.id);c&&(c.notifications||(c.notifications=[]),c.notifications.unshift({id:`task_${Date.now()}`,type:"task",title:i.task||"Delegated task",description:i.subPlans&&i.subPlans.length>0?i.subPlans.join(", "):"",taggedById:s.id,taggedByName:s.name,taggedAt:new Date().toISOString(),status:"pending",source:"delegation",date:new Date().toLocaleString(),read:!1}),await window.AppDB.put("users",c)),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert(`Task delegated to ${l.name}.`),typeof Oe=="function"&&await Oe()}catch(n){alert("Failed to delegate task: "+n.message)}};function ps(a,e,t,n){if(!a||!e||!t||!n)return 0;const s=6371e3,i=a*Math.PI/180,o=t*Math.PI/180,r=(t-a)*Math.PI/180,d=(n-e)*Math.PI/180,l=Math.sin(r/2)*Math.sin(r/2)+Math.cos(i)*Math.cos(o)*Math.sin(d/2)*Math.sin(d/2),c=2*Math.atan2(Math.sqrt(l),Math.sqrt(1-l));return s*c}const us=480*60*1e3,Go=540*60*1e3,un=(a,e)=>{if(!a||!e)return null;const t=String(a).trim(),n=String(e).trim();if(!t||!n||n.toLowerCase().includes("active now"))return null;const s=new Date(`${t}T${n}`);if(!Number.isNaN(s.getTime()))return s;const i=new Date(`${t} ${n}`);return Number.isNaN(i.getTime())?null:i},Jo=async(a,e,t)=>{if(!a||!window.AppDB||t<=e)return!1;const n=await window.AppDB.getAll("attendance"),s=String(a);return(n||[]).some(i=>{if(!i||String(i.user_id||"")!==s||!i.isManualOverride)return!1;const o=un(i.date,i.checkIn),r=un(i.date,i.checkOut);if(!o||!r)return!1;let d=o.getTime(),l=r.getTime();l<=d&&(l+=1440*60*1e3);const c=Math.max(e,d);return Math.min(t,l)>c})},Xo=async a=>{const e={showPrompt:!1,hasManualLog:!1,overtimeStartMs:null,overtimeEndMs:null};if(!a||!a.lastCheckIn)return e;const t=Number(a.lastCheckIn);if(!Number.isFinite(t))return e;const n=Date.now();if(n-t<=Go)return e;const i=t+us;return await Jo(a.id,i,n)?{showPrompt:!1,hasManualLog:!0,overtimeStartMs:i,overtimeEndMs:n}:{showPrompt:!0,hasManualLog:!1,overtimeStartMs:i,overtimeEndMs:n}};window.app_prepareCheckoutOvertimeSection=async a=>{const e=document.getElementById("checkout-overtime-section"),t=document.getElementById("checkout-overtime-explanation"),n=document.getElementById("checkout-overtime-mode"),s=document.getElementById("checkout-overtime-hint");if(window.app_checkoutOvertimeState={showPrompt:!1,hasManualLog:!1},!(!e||!t||!n)){e.style.display="none",t.required=!1,t.value="",n.value="overtime_work",document.querySelectorAll(".overtime-reason-btn").forEach(i=>{i.style.background="#fef3c7",i.style.borderColor="#fcd34d",i.style.color="#92400e"});try{const i=await Xo(a);if(window.app_checkoutOvertimeState=i,!i.showPrompt)return;s&&(s.textContent="You worked over 1 hour extra. Please capture what was done during overtime."),e.style.display="block",t.required=!0}catch(i){console.warn("Overtime prompt check failed:",i)}}};async function Oe(){const a=document.getElementById("attendance-btn"),e=document.getElementById("location-text"),{status:t}=await window.AppAttendance.getStatus();a&&(a.disabled=!0),be=!0;try{if(t==="out"){a&&(a.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Locating...');const n=await window.getLocation(),s=`Lat: ${n.lat.toFixed(4)}, Lng: ${n.lng.toFixed(4)}`;e&&(e.innerHTML=`<i class="fa-solid fa-location-dot"></i> ${s}`);const i=await window.AppAttendance.checkIn(n.lat,n.lng,s);if(i&&i.conflict){window.app_showSyncToast(i.message||"Status updated from another device."),window.app_refreshDashboard&&await window.app_refreshDashboard();return}pt(),window.app_refreshDashboard&&await window.app_refreshDashboard(),i&&i.resolvedMissedCheckout&&i.noticeMessage&&window.app_showAttendanceNotice(i.noticeMessage),i&&i.missedCheckoutReasonRequired&&i.missedCheckoutLogId&&window.app_promptMissedCheckoutReason({logId:i.missedCheckoutLogId,date:i.missedCheckoutDate}),window.AppDayPlan&&typeof window.AppDayPlan.openDayPlan=="function"&&await window.AppDayPlan.openDayPlan(dn(),null,null,{hideAutoForwardedTasks:!0,skipCarryForwardSync:!0,skipCarryForwardCleanup:!0})}else{const n=window.AppAuth.getUser(),s=dn(),i=await window.AppCalendar.getWorkPlan(n.id,s,{includeAnnual:!0,mergeAnnual:!0}),o=await window.AppCalendar.getCollaborations(n.id,s);window.app_checkoutSummaryDate!==s&&(window.app_checkoutSummaryDate=s,window.app_checkoutSummaryDraft=""),window.app_checkoutActionDate!==s&&(window.app_checkoutActionDate=s,window.app_checkoutTaskActions={},window.app_checkoutTaskDetails={},window.app_checkoutTaskMeta={},window.app_checkoutUserMap={});const r=document.getElementById("modal-container");r&&!document.getElementById("checkout-modal")&&r.insertAdjacentHTML("beforeend",q.renderModals());const d=document.getElementById("checkout-modal");if(d){const l=document.getElementById("checkout-plan-text"),c=d.querySelector('textarea[name="description"]');if(i&&(i.plans||i.plan)){let m="",h="";if(i.plans&&i.plans.length>0?(m=i.plans.map((M,A)=>`<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; padding-bottom:12px; border-bottom:1px dashed #e9d5ff;">
                                    <div style="flex:1;">
                                        <div style="font-weight:600; color:#4c1d95;">${window.app_formatTaskWithPostponeChip(M.task)}</div>
                                        ${M.subPlans&&M.subPlans.length>0?`<div style="font-size:0.75rem; color:#7c3aed; margin-top:2px;">👣 ${M.subPlans.join(", ")}</div>`:""}
                                    </div>
                                    <div style="display:flex; gap:6px; flex-shrink:0;">
                                        ${M.status==="completed"?'<span style="font-size:0.75rem; color:#059669; font-weight:700;">✅ Done</span>':`<button type="button" onclick="window.app_postponeTask('${M._planId||i.id}', ${typeof M._taskIndex=="number"?M._taskIndex:A})" style="background:#f3e8ff; color:#7c3aed; border:1px solid #ddd6fe; border-radius:8px; padding:6px 12px; font-size:0.8rem; font-weight:600; cursor:pointer;" onmouseover="this.style.background='#ddd6fe'" onmouseout="this.style.background='#f3e8ff'">⌛ Postpone</button>`}
                                    </div>
                                </div>`).join(""),h=i.plans.filter(M=>window.AppCalendar.getSmartTaskStatus(i.date,M.status)==="completed").map(M=>{let A=`• ${M.task}`;return M.subPlans&&M.subPlans.length>0&&(A+=` (${M.subPlans.join(", ")})`),A}).join(`
`)):i.plan&&(m=`<div style="font-weight:600; color:#4c1d95;">${i.plan}</div>`,h=`• ${i.plan}`,i.subPlans&&i.subPlans.length>0&&(m+=`<div style="font-size:0.75rem; color:#7c3aed; margin-top:2px;">👣 ${i.subPlans.join(", ")}</div>`,h+=` (${i.subPlans.join(", ")})`)),o&&o.length>0){const b=o.map(M=>M.plans.filter(A=>A.tags&&A.tags.some(g=>g.id===n.id&&g.status==="accepted")).map(A=>{let g=`🤝 [Collaborated with ${M.userName}] ${A.task}`;return A.subPlans&&A.subPlans.length>0&&(g+=`
👣 Steps: `+A.subPlans.join(", ")),g}).join(`
`)).join(`

`);m?m+=`

`+b:m=b}l&&(l.innerHTML=m),l&&(l.dataset.rawText=h),c&&!c.value.trim()&&window.app_checkoutSummaryDraft&&(c.value=window.app_checkoutSummaryDraft,window.app_updateCharCounter&&window.app_updateCharCounter(c));const f=document.getElementById("checkout-task-list"),w=document.getElementById("delegate-panel"),v=document.getElementById("delegate-list"),k=document.getElementById("delegate-selected-task");if(f)if(i&&Array.isArray(i.plans)&&i.plans.length>0){const b=await window.AppDB.getAll("users").catch(()=>[]);window.app_checkoutUserMap={},(b||[]).forEach(S=>{window.app_checkoutUserMap[String(S.id)]=S.name});const M=window.AppAuth.getUser(),A=(b||[]).filter(S=>S.id!==M.id),g=i.plans.map((S,C)=>{const I=S.subPlans&&S.subPlans.length?` — ${S.subPlans.join(", ")}`:"",y=`${S.task}${I}`,_=S._planId||i.id,x=typeof S._taskIndex=="number"?S._taskIndex:C,$=window.AppCalendar.getSmartTaskStatus(S._planDate||i.date,S.status),L=`${_}:${x}`;window.app_checkoutTaskMeta=window.app_checkoutTaskMeta||{},window.app_checkoutTaskMeta[L]={text:y,planId:_,taskIndex:x};const E=(window.app_checkoutTaskActions&&window.app_checkoutTaskActions[L]?window.app_checkoutTaskActions[L]:"")||(S.status==="completed"||$==="completed"?"complete":S.status==="postponed"?"postpone":""),P=window.app_initCheckoutTaskDetails(_,x,S),B=P.action||E||"";B&&P.action!==B&&(P.action=B,B==="complete"&&(P.progressPercent=100,P.progressStatus="done")),window.app_checkoutTaskActions&&B&&(window.app_checkoutTaskActions[L]=B);const R=$==="completed"?"Completed":$==="in-process"?"In Process":$==="overdue"?"Overdue":$==="to-be-started"?"To Be Started":S.status||"Pending",F=G(P.actionMeta?.postponeDate||new Date(Date.now()+864e5).toISOString().split("T")[0]),H=G(P.actionMeta?.postponeReason||""),W=G(P.actionMeta?.delegateUserId||""),K=G(P.actionMeta?.delegateNote||""),O=G(P.actionMeta?.completionNote||""),U=G(P.progressNote||"");return`
                                        <div class="checkout-task-row">
                                            <div class="checkout-task-copy">
                                                <div class="checkout-task-title">${window.app_formatTaskWithPostponeChip(y)}</div>
                                                <div class="checkout-task-status">Status: ${R}</div>
                                            </div>
                                            <div class="checkout-task-controls">
                                                <select onchange="window.app_handleChecklistAction('${_}', ${x}, this.value)" class="checkout-task-action-select">
                                                    <option value="" ${B?"":"selected"}>Choose Action</option>
                                                    <option value="complete" ${B==="complete"?"selected":""}>Complete</option>
                                                    <option value="postpone" ${B==="postpone"?"selected":""}>Postpone</option>
                                                    <option value="delegate" ${B==="delegate"?"selected":""}>Delegate</option>
                                                </select>
                                                <button type="button" class="checkout-task-detail-btn" data-checkout-detail-key="${G(L)}" onclick="window.app_openCheckoutActionModal('${pe(L)}')" ${B?"":"disabled"}>Action Details</button>
                                            </div>
                                        </div>`}).join("");if(f.innerHTML=g,window.app_renderCheckoutActionPreview(),w&&v&&k){w.style.display="none";const S=document.getElementById("checkout-task-checklist");S&&S.classList.remove("delegate-open"),v.innerHTML=A.map(C=>`
                                        <button type="button" data-user-id="${C.id}" class="delegate-user-btn">
                                            <img src="${C.avatar}" alt="${C.name}" class="delegate-user-avatar">
                                            <span style="flex:1;">${C.name}</span>
                                        </button>
                                    `).join("")}}else f.innerHTML='<div style="font-size:0.8rem; color:#6b7280;">No tasks planned for today.</div>',window.app_renderCheckoutActionPreview()}await window.app_prepareCheckoutOvertimeSection(n),d.style.display="flex",a&&(a.disabled=!1);const p=document.getElementById("checkout-location-mismatch"),u=document.getElementById("checkout-location-loading");u&&(u.style.display="block"),p&&(p.style.display="none"),(async()=>{try{const m=await window.getLocation(),h=n.currentLocation||n.lastLocation;u&&(u.style.display="none"),h&&h.lat&&h.lng&&(ps(m.lat,m.lng,h.lat,h.lng)>500?p&&(p.style.display="block"):p&&(p.style.display="none"))}catch(m){console.warn("Background location check failed:",m),u&&(u.style.display="none")}})()}else{const l=await window.AppAttendance.checkOut();l&&!l.conflict&&pt(),l&&l.conflict&&window.app_showSyncToast(l.message||"Status updated from another device."),await Pe()}}}catch(n){alert(n.message||n),a&&(a.disabled=!1,a.innerHTML=t==="out"?'Check-in <i class="fa-solid fa-fingerprint"></i>':'Check-out <i class="fa-solid fa-fingerprint"></i>')}finally{be=!1}}window.app_pauseSession=async function(){if(be)return;be=!0;const a=document.getElementById("attendance-btn"),e=document.getElementById("attendance-pause-btn");try{a&&(a.disabled=!0),e&&(e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Pausing...');const t=await window.AppAttendance.pauseSession();if(t&&t.conflict){window.app_showSyncToast(t.message||"Status updated from another device."),await Pe();return}t&&t.ok&&(window.AppActivity&&window.AppActivity.stop&&window.AppActivity.stop(),pt(),await Pe())}catch(t){alert(t.message||t)}finally{be=!1}};window.app_resumeSession=async function(){if(be)return;be=!0;const a=document.getElementById("attendance-btn"),e=document.getElementById("attendance-pause-btn");try{a&&(a.disabled=!0),e&&(e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Resuming...');const t=await window.AppAttendance.resumeSession();if(t&&t.conflict){window.app_showSyncToast(t.message||"Status updated from another device."),await Pe();return}t&&t.ok&&(window.AppActivity&&window.AppActivity.start&&window.AppActivity.start(),pt(),await Pe())}catch(t){alert(t.message||t)}finally{be=!1}};window.app_submitCheckOut=async function(a){a.preventDefault();const e=a.target,t=e.description.value,n=e.querySelector('button[type="submit"]');be=!0;try{n.disabled=!0,n.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Locating & Saving...',Object.keys(window.app_checkoutTaskDetails||{}).forEach(b=>window.app_clearCheckoutTaskError(b));const{updates:i,errors:o}=window.app_collectCheckoutTaskUpdates();if(o.length>0){o.forEach(M=>window.app_setCheckoutTaskError(M.key,M.message));const b=o[0]?.key;if(b){const M=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Ee(b)}"]`);M&&M.scrollIntoView({behavior:"smooth",block:"center"})}n.disabled=!1,n.textContent="Complete Check-Out";return}let r=null,d=null;try{r=await Promise.race([window.getLocation(),new Promise((M,A)=>setTimeout(()=>A(new Error("Location request timed out.")),9e3))])}catch(b){d=b}let l=!1;const c=window.AppAuth.getUser()?.currentLocation;r&&(r=Me&&Date.now()-Ue<Xn?Me:r,c&&c.lat&&c.lng&&r.lat&&r.lng&&ps(r.lat,r.lng,c.lat,c.lng)>500&&(l=!0));let p=e.locationExplanation?e.locationExplanation.value.trim():"";const u=window.app_checkoutOvertimeState||{},m=e.overtimeExplanation?e.overtimeExplanation.value.trim():"",h=e.overtimeMode?String(e.overtimeMode.value||"overtime_work"):"overtime_work",f={};if(u.showPrompt){if(!m){alert("Please describe the overtime work before checkout."),n.disabled=!1,n.textContent="Complete Check-Out";return}if(f.overtimePrompted=!0,f.overtimeExplanation=m,f.overtimeReasonTag=h,h==="forgot_checkout"){const b=Number(window.AppAuth.getUser()?.lastCheckIn);Number.isFinite(b)&&(f.checkOutTime=new Date(b+us).toISOString(),f.overtimeCappedToEightHours=!0)}}if(i.length>0&&(f.taskUpdates=i.map(b=>({planId:b.planId,taskIndex:b.taskIndex,action:b.action,progressPercent:b.progressPercent,progressStatus:b.progressStatus,progressNote:b.progressNote,actionMeta:b.actionMeta||{},timestamp:b.timestamp}))),!r){const b=document.getElementById("checkout-location-mismatch");b&&(b.style.display="block"),alert("Location unavailable. Please enable location and try again."),n.disabled=!1,n.textContent="Complete Check-Out";return}const w=r?`Lat: ${Number(r.lat).toFixed(4)}, Lng: ${Number(r.lng).toFixed(4)}`:"Location unavailable (reason provided)",v=e.tomorrowGoal?e.tomorrowGoal.value.trim():"";if(v){const b=new Date(Date.now()+864e5).toISOString().split("T")[0];await window.AppCalendar.addWorkPlanTask(b,window.AppAuth.getUser().id,v),console.log("Tomorrow's goal saved:",v)}const k=await window.AppAttendance.checkOut(t,r?r.lat:null,r?r.lng:null,w,l||!r,p||(d?String(d):""),f);if(k&&k.conflict){const b=document.getElementById("checkout-modal");b&&(b.style.display="none"),window.app_showSyncToast(k.message||"Status updated from another device."),await Pe();return}pt(),i.length>0&&await window.app_applyCheckoutTaskUpdates(i),window.app_checkoutSummaryDraft="",window.app_checkoutTaskActions={},window.app_checkoutTaskDetails={},window.app_checkoutTaskMeta={},window.app_checkoutUserMap={},window.app_renderCheckoutActionPreview(),document.getElementById("checkout-modal").style.display="none",await Pe()}catch(s){alert("Check-out failed: "+s.message),n.disabled=!1,n.textContent="Complete Check-Out"}finally{be=!1}};async function Qo(a){a.preventDefault();const e=new FormData(a.target),t=za(e.get("checkIn"),e.get("checkOut"));if(t==="Invalid"){alert("End time must be after Start time");return}const n=e.get("date"),s=e.get("checkIn"),i=e.get("checkOut"),o=window.AppAttendance.buildDateTime(n,s),r=window.AppAttendance.buildDateTime(n,i),d=o&&r?r-o:0,l=Math.max(0,d)/(1e3*60*60),c=l>=4;let p="Work Log",u=0;l>=8?(p="Present",u=1):l>=4&&(p="Half Day",u=.5);const m={date:e.get("date"),checkIn:s,checkOut:i,duration:t,durationMs:d,location:e.get("location"),workDescription:e.get("location"),type:p,dayCredit:u,lateCountable:!1,extraWorkedMs:0,policyVersion:"v2",entrySource:"staff_manual_work",attendanceEligible:c,isManualOverride:!1};await window.AppAttendance.addManualLog(m),alert("Log added successfully!"),document.getElementById("log-modal").style.display="none",ne.innerHTML=await q.renderTimesheet()}async function Zo(a){a.preventDefault();const e=new FormData(a.target),t=e.get("name").trim(),n=e.get("username").trim(),s=e.get("password").trim(),i=e.get("email").trim(),o=e.get("isAdmin")==="on"||e.get("isAdmin")==="true",r=e.get("canManageAttendanceSheet")==="on"||e.get("canManageAttendanceSheet")==="true";let d;try{d=We(e)}catch(c){alert(c.message);return}const l={id:"u"+Date.now(),name:t,username:n,password:s,role:e.get("role"),dept:e.get("dept"),email:i,phone:e.get("phone"),joinDate:e.get("joinDate"),isAdmin:o,canManageAttendanceSheet:r,canManageBirthdays:!1,birthDay:d.birthDay,birthMonth:d.birthMonth,birthYear:d.birthYear,permissions:window.app_getPermissionsFromUI("add"),avatar:`https://ui-avatars.com/api/?name=${e.get("name")}&background=random&color=fff`,status:"out",lastCheckIn:null};try{l.isAdmin?(l.role="Administrator",l.canManageAttendanceSheet=!0,l.canManageBirthdays=!0,l.permissions={...l.permissions||{},birthday:"admin"}):(l.isAdmin=!1,l.canManageBirthdays=l.permissions?.birthday==="admin"),await window.AppDB.add("users",l),alert("Success! Account created."),document.getElementById("add-user-modal").style.display="none";const c=document.getElementById("page-content");c&&(c.innerHTML=await q.renderAdmin())}catch(c){alert("Error creating user: "+c.message)}}window.app_getPermissionsFromUI=a=>{const e={};return["dashboard","leaves","users","attendance","reports","minutes","policies","birthday"].forEach(n=>{const s=document.getElementById(`${a}-perm-${n}-view`),i=document.getElementById(`${a}-perm-${n}-admin`);i&&i.checked?e[n]="admin":s&&s.checked?e[n]="view":e[n]=null}),e};window.app_submitEditUser=async a=>{a&&a.preventDefault();const e=a&&a.target&&a.target.tagName==="FORM"?a.target:document.getElementById("edit-user-form");if(!e){console.error("Critical Failure: Edit user form not found."),alert("Error: Form missing.");return}const t=new FormData(e),n=(t.get("id")||"").trim();if(!n){console.error("Data Failure: No 'id' name attribute found in form data.",{target:a.target,allData:Object.fromEntries(t.entries())}),alert("Error: User ID missing. Please refresh.");return}const s=e.querySelector('[name="isAdmin"]'),i=!!(s&&s.checked),o=e.querySelector('[name="canManageAttendanceSheet"]'),r=!!(o&&o.checked),d=String(t.get("pan")||"").trim().toUpperCase(),l=String(t.get("bankIfsc")||"").trim().toUpperCase(),c=String(t.get("joinDate")||"").trim(),p=String(t.get("employeeId")||"").trim();let u;try{u=We(t)}catch(v){alert(v.message);return}const m=/^[A-Z]{5}[0-9]{4}[A-Z]$/,h=/^[A-Z]{4}0[A-Z0-9]{6}$/;if(c){const v=new Date,k=`${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,"0")}-${String(v.getDate()).padStart(2,"0")}`;if(c>k){alert("Join Date cannot be in the future.");return}}if(d&&!m.test(d)){alert("Invalid PAN format. Use format like ABCDE1234F");return}if(l&&!h.test(l)){alert("Invalid IFSC format. Use format like SBIN0001234");return}const f=c?p||jt(c,n):"NA",w={id:n,name:(t.get("name")||"").trim(),username:(t.get("username")||"").trim(),password:(t.get("password")||"").trim(),role:t.get("role"),dept:t.get("dept"),email:(t.get("email")||"").trim(),phone:(t.get("phone")||"").trim(),isAdmin:i,canManageAttendanceSheet:r,canManageBirthdays:!1,employeeId:f,joinDate:c||null,birthDay:u.birthDay,birthMonth:u.birthMonth,birthYear:u.birthYear,baseSalary:Number(t.get("baseSalary")||0),otherAllowances:Number(t.get("otherAllowances")||0),providentFund:Number(t.get("providentFund")||0),professionalTax:Number(t.get("professionalTax")||0),loanAdvance:Number(t.get("loanAdvance")||0),tdsPercent:Number(t.get("tdsPercent")||0),bankName:(t.get("bankName")||"").trim(),bankAccount:(t.get("bankAccount")||"").trim(),bankIfsc:l,pan:d,uan:(t.get("uan")||"").trim(),permissions:window.app_getPermissionsFromUI("edit")};console.log("Executing Update for User:",w),w.isAdmin?(w.canManageAttendanceSheet=!0,w.canManageBirthdays=!0,w.role="Administrator",w.permissions={...w.permissions||{},birthday:"admin"}):w.canManageBirthdays=w.permissions?.birthday==="admin";try{if(await window.AppAuth.updateUser(w)){console.log("Success: User updated in DB."),alert(`SUCCESS: Details for '${w.name}' have been saved.`),document.getElementById("edit-user-modal").style.display="none";const k=document.getElementById("page-content");k&&setTimeout(async()=>{k.innerHTML=await q.renderAdmin(),window.AppAnalytics&&await window.AppAnalytics.initAdminCharts()},50)}else alert("Update failed: User not found.")}catch(v){console.error("Update Error:",v),alert("Error: "+v.message)}};function za(a,e){const[t,n]=a.split(":"),[s,i]=e.split(":"),o=parseInt(s)*60+parseInt(i)-(parseInt(t)*60+parseInt(n));if(o<0)return"Invalid";const r=Math.floor(o/60),d=o%60;return`${r}h ${d}m`}function Ne(){const a=document.getElementById("attendance-btn"),e=!!window.app_dashboardReadOnly,t=window.app_dashboardTargetUser||null;a&&!e&&a.addEventListener("click",Oe),Uo(t,e),lt(),window.app_refreshNotificationBell&&window.app_refreshNotificationBell().catch(()=>{}),window.app_attachStatsCardHandlers&&window.app_attachStatsCardHandlers()}window.setupDashboardEvents=Ne;async function Pe(){const a=document.getElementById("page-content");if(a)try{a.innerHTML=await q.renderDashboard(),Ne()}catch(e){console.error("Dashboard refresh after attendance failed:",e),typeof window.app_showSyncToast=="function"&&window.app_showSyncToast("Attendance saved. Refresh the page if the dashboard looks stale.")}}window.app_refreshDashboard=Pe;window.app_refreshCurrentPage=async function(){await ka()};document.addEventListener("submit",a=>{if(a.preventDefault(),a.target?.classList?.contains("day-plan-form"))return;const e=String(a.target.getAttribute("id")||"");if(console.log("Submit Event Intercepted. Form ID:",e),e==="manual-log-form")Qo(a);else if(e==="checkout-form")window.app_submitCheckOut(a);else if(e==="add-user-form")Zo(a);else if(e==="login-form")(async()=>{const t=new FormData(a.target);try{const n=await window.getLocation();if(!await window.AppAuth.login(t.get("username"),t.get("password"))){alert("Invalid Credentials");return}const i=window.AppAuth.getUser();i&&(i.lastLoginLocation={lat:n.lat,lng:n.lng,capturedAt:Date.now()},await window.AppDB.put("users",i)),window.location.reload()}catch(n){const s=String(n);s.includes("permission-denied")||s.includes("FirebaseError")?alert(`Database Error: ${s}

Access to the database was blocked. Please check your Firebase Firestore Security Rules.`):alert(`Login blocked: ${s}

Please enable location and try again.`)}})();else if(e==="edit-user-form")console.log("Routing to app_submitEditUser..."),window.app_submitEditUser(a);else if(e==="birthday-details-form")window.app_submitBirthdayDetails(a);else if(e==="birthday-external-form")window.app_submitExternalBirthdayPerson(a);else if(e.startsWith("birthday-month-form-")){const t=Number(e.replace("birthday-month-form-",""));window.app_submitBirthdayMonthForm(a,t)}else e==="notify-form"?tr(a):e==="leave-request-form"?er(a):console.warn("Unhandled form submission ID:",e,"Target:",a.target)});async function er(a){const e=new FormData(a.target),t=window.AppAuth.getUser(),n=e.get("startDate");let s=e.get("endDate");const i=e.get("type");i==="Half Day"&&(s=n),await window.AppLeaves.requestLeave({userId:t.id,userName:t.name,startDate:n,endDate:s,startTime:e.get("startTime")||"",endTime:e.get("endTime")||"",type:i,reason:e.get("reason"),durationHours:e.get("durationHours")||""}),alert("Leave requested successfully!"),document.getElementById("leave-modal").style.display="none",a.target.reset()}async function tr(a){a.preventDefault();const e=new FormData(a.target),t=e.get("toUserId"),n=e.get("reminderMessage")||"",s=e.get("reminderLink")||"",i=e.get("taskTitle")||"",o=e.get("taskDescription")||"",r=e.get("taskDueDate")||"";try{if(!n.trim()&&!i.trim()){alert("Please enter a reminder or a task.");return}const d=await window.AppDB.get("users",t);if(!d)throw new Error("User not found");const l=window.AppAuth.getUser(),c=new Date().toISOString();d.notifications||(d.notifications=[]),n.trim()&&(d.notifications.unshift({id:`rem_${Date.now()}`,type:"reminder",message:n.trim(),taggedById:l.id,taggedByName:l.name,taggedAt:c,status:"pending",date:c,read:!1}),await window.AppDB.add("staff_messages",{id:`msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"text",message:n.trim(),link:s.trim(),fromId:l.id,fromName:l.name,toId:t,toName:d.name,createdAt:c,read:!1})),i.trim()&&(d.notifications.unshift({id:`task_${Date.now()}`,type:"task",title:i.trim(),description:o.trim(),taggedById:l.id,taggedByName:l.name,taggedAt:c,status:"pending",dueDate:r||"",date:c,read:!1}),await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:i.trim(),description:o.trim(),dueDate:r||"",status:"pending",fromId:l.id,fromName:l.name,toId:t,toName:d.name,createdAt:c,read:!1,history:[{action:"created",byId:l.id,byName:l.name,at:c}]})),await window.AppAuth.updateUser(d),alert("Notification sent!"),document.getElementById("notify-modal").style.display="none",window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()}catch(d){alert("Failed to send: "+d.message)}}window.app_openStaffThread=async a=>{window.app_staffThreadId=a;const e=window.AppAuth.getUser();if(!e)return;const n=(await window.app_getMyMessages()).filter(i=>i.toId===e.id&&i.fromId===a&&!i.read);for(const i of n)i.read=!0,i.readAt=new Date().toISOString(),await window.AppDB.put("staff_messages",i);const s=document.getElementById("page-content");s&&(s.innerHTML=await q.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_sendStaffText=async a=>{a.preventDefault();const e=window.AppAuth.getUser(),t=new FormData(a.target),n=t.get("toUserId"),s=(t.get("message")||"").trim(),i=(t.get("link")||"").trim();if(!s){alert("Please type a message.");return}const o=await window.AppDB.get("users",n);if(!o){alert("Staff member not found.");return}await window.AppDB.add("staff_messages",{id:`msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"text",message:s,link:i,fromId:e.id,fromName:e.name,toId:n,toName:o.name,createdAt:new Date().toISOString(),read:!1}),a.target.reset();const r=document.getElementById("staff-message-modal");r&&r.remove();const d=document.getElementById("page-content");d&&(d.innerHTML=await q.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_sendStaffTask=async a=>{a.preventDefault();const e=window.AppAuth.getUser(),t=new FormData(a.target),n=t.get("toUserId"),s=(t.get("taskTitle")||"").trim(),i=(t.get("taskDescription")||"").trim(),o=(t.get("taskDueDate")||"").trim();if(!s){alert("Please provide a task title.");return}const r=await window.AppDB.get("users",n);if(!r){alert("Staff member not found.");return}await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:s,description:i,dueDate:o,status:"pending",fromId:e.id,fromName:e.name,toId:n,toName:r.name,createdAt:new Date().toISOString(),read:!1,history:[{action:"created",byId:e.id,byName:e.name,at:new Date().toISOString()}]}),a.target.reset();const d=document.getElementById("staff-task-modal");d&&d.remove();const l=document.getElementById("page-content");l&&(l.innerHTML=await q.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_openStaffMessageModal=(a,e)=>{if(!a){alert("Select a staff member first.");return}const n=`
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
        `;window.app_showModal(n,"staff-task-modal")};window.app_respondStaffTask=async(a,e)=>{const t=window.AppAuth.getUser(),n=await window.AppDB.get("staff_messages",a);if(!n){alert("Task not found.");return}if(n.toId!==t.id){alert("Only the recipient can approve or reject this task.");return}let s="";if(e==="rejected"&&(s=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Task",confirmText:"Submit Reason"})||""),n.status=e,n.respondedAt=new Date().toISOString(),s&&(n.rejectReason=s),n.history||(n.history=[]),n.history.unshift({action:e,byId:t.id,byName:t.name,at:n.respondedAt,reason:s}),e==="approved"&&!n.calendarSynced){const r=n.dueDate||new Date().toISOString().split("T")[0],d=n.toName||t.name,l=`${n.title}${n.description?` - ${n.description}`:""}`;window.AppCalendar&&(await window.AppCalendar.addWorkPlanTask(r,n.toId,`${l} (Responsible: ${d})`,[],{addedFrom:"staff",sourcePlanId:n.id,sourceTaskIndex:0,taggedById:n.fromId,taggedByName:n.fromName,status:"pending"}),await window.AppCalendar.addWorkPlanTask(r,n.fromId,`${l} (Assigned to ${d})`,[],{addedFrom:"staff",sourcePlanId:n.id,sourceTaskIndex:1,taggedById:n.fromId,taggedByName:n.fromName,status:"pending"}),n.calendarSynced=!0)}await window.AppDB.put("staff_messages",n);const i=await window.AppDB.get("users",n.fromId);i&&(i.notifications||(i.notifications=[]),i.notifications.unshift({id:`taskresp_${Date.now()}`,type:"task_response",message:`${t.name} ${e} a task.`,title:n.title,taggedByName:t.name,status:e,reason:s,date:n.respondedAt,read:!1}),await window.AppDB.put("users",i));const o=document.getElementById("page-content");o&&(o.innerHTML=await q.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_updateStaffNavIndicator=async()=>{const a=window.AppAuth.getUser();if(!a)return;const e=document.querySelectorAll('[data-page="staff-directory"]');if(!e.length)return;const n=(await window.app_getMyMessages()).some(s=>s.toId===a.id&&!s.read);e.forEach(s=>{n?s.classList.add("has-new-msg"):s.classList.remove("has-new-msg")})};window.app_handleTagDecision=async(a,e)=>{const t=window.AppAuth.getUser();try{const n=await window.AppDB.get("users",t.id);if(!n||!n.notifications)throw new Error("Notification not found");const s=n.notifications.find(d=>d.id===a);if(!s)throw new Error("Notification not found");let i="";e==="rejected"&&(i=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Item",confirmText:"Submit Reason"})||"");const o=new Date().toISOString();if(s.status=e,s.respondedAt=o,s.read=!0,s.dismissedAt=o,i&&(s.rejectReason=i),n.tagHistory||(n.tagHistory=[]),n.tagHistory.unshift({id:`taghist_${Date.now()}`,type:"tag_response",title:s.title||s.message||"Tagged item",taggedByName:s.taggedByName||"Staff",status:e,reason:i,date:new Date().toISOString()}),await window.AppDB.put("users",n),s.taggedById){const d=await window.AppDB.get("users",s.taggedById);d&&(d.notifications||(d.notifications=[]),d.notifications.unshift({id:`tagresp_${Date.now()}`,type:"tag_response",message:`${t.name} ${e} your ${s.type||"tag"}.`,title:s.title||"",taggedByName:t.name,status:e,reason:i,date:new Date().toISOString(),read:!1}),await window.AppDB.put("users",d))}const r=document.getElementById("page-content");r&&(r.innerHTML=await q.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents())}catch(n){alert("Failed to update tag: "+n.message)}};document.addEventListener("auth-logout",()=>window.AppAuth.logout());window.app_reviewMinuteAccessFromNotification=async(a,e,t)=>{try{const n=window.AppAuth.getUser();if(!(n&&(n.isAdmin||n.role==="Administrator"))){alert("Only admin can review access requests.");return}const i=await window.AppDB.get("users",n.id);if(!i||!Array.isArray(i.notifications)){alert("Notification not found.");return}let o=null;if(typeof a=="number"&&i.notifications[a]&&(o=i.notifications[a]),!o&&e&&(o=i.notifications.find(w=>String(w.id)===String(e))),!o||o.type!=="minute-access-request"){alert("This notification is no longer available.");return}const r=o.minuteId,d=o.taggedById||o.requesterId;if(!r||!d){alert("Invalid access request payload.");return}const l=await window.AppDB.get("minutes",r);if(!l){alert("Minute not found.");return}const c=Array.isArray(l.accessRequests)?l.accessRequests.slice():[];c.findIndex(w=>w.userId===d)<0&&c.push({userId:d,userName:o.taggedByName||"Staff",requestedAt:o.taggedAt||o.date||new Date().toISOString(),status:"pending",reviewedAt:"",reviewedBy:""});const u=c.findIndex(w=>w.userId===d);c[u]={...c[u],status:t,reviewedAt:new Date().toISOString(),reviewedBy:n.name};let m=Array.isArray(l.allowedViewers)?l.allowedViewers.slice():[];t==="approved"?m.includes(d)||m.push(d):m=m.filter(w=>w!==d),await window.AppMinutes.updateMinute(r,{accessRequests:c,allowedViewers:m},t==="approved"?"Admin approved minutes access from notification":"Admin rejected minutes access from notification");const h=await window.AppDB.get("users",d);h&&(h.notifications||(h.notifications=[]),h.notifications.unshift({id:Date.now()+Math.random(),type:"minute-access-reviewed",title:"Minutes Access Update",message:`Your request for "${l.title}" was ${t}.`,minuteId:r,taggedById:n.id,taggedByName:n.name,status:t,taggedAt:new Date().toISOString(),date:new Date().toISOString()}),await window.AppDB.put("users",h));const f=i.notifications.find(w=>String(w.id)===String(o.id));f&&(f.status=t,f.respondedAt=new Date().toISOString(),f.read=!0,await window.AppAuth.updateUser(i)),ne.innerHTML=await q.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}catch(n){alert("Failed to review access request: "+n.message)}};window.app_reviewMissedCheckoutReasonFromNotification=async(a,e,t)=>{try{const n=window.AppAuth.getUser();if(!(n&&(n.isAdmin||n.role==="Administrator"))){alert("Only admin can review missed checkout reasons.");return}const i=await window.AppDB.get("users",n.id);if(!i||!Array.isArray(i.notifications)){alert("Notification not found.");return}let o=null;if(typeof a=="number"&&i.notifications[a]&&(o=i.notifications[a]),!o&&e&&(o=i.notifications.find(v=>String(v.id)===String(e))),!o||o.type!=="missed-checkout-reason"){alert("This notification is no longer available.");return}const r=o.staffId||o.taggedById,d=o.logId;if(!r||!d){alert("Invalid missed checkout payload.");return}let l="";t==="rejected"&&(l=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Reason",confirmText:"Submit Reason"})||"");const c=await window.AppDB.get("attendance",d);if(c){const v=t==="approved"&&c.autoCheckout?{type:"Present",dayCredit:window.AppAttendance&&typeof window.AppAttendance.getDayCredit=="function"?window.AppAttendance.getDayCredit("Present"):1,lateCountable:!1,missedCheckoutApprovedAsFullDay:!0,missedCheckoutApprovedAt:new Date().toISOString(),missedCheckoutApprovedBy:n.name}:{};await window.AppDB.put("attendance",{...c,...v,missedCheckoutReasonStatus:t,missedCheckoutReviewedBy:n.name,missedCheckoutReviewedAt:new Date().toISOString(),missedCheckoutReviewNote:l||""})}const p=new Date().toISOString(),u=i.notifications.find(v=>String(v.id)===String(o.id));u&&(u.status=t,u.respondedAt=p,u.read=!0,await window.AppAuth.updateUser(i));const m=await window.AppDB.get("users",r),h=o.missedCheckoutDate||(c?c.date:"the previous day");m&&(m.notifications||(m.notifications=[]),m.notifications.unshift({id:`mcr_rev_${Date.now()}`,type:"missed-checkout-reason-reviewed",title:"Missed checkout reason reviewed",message:`Admin ${t} your missed checkout reason for ${h}.`,status:t,date:p,taggedById:n.id,taggedByName:n.name,reviewNote:l||""}),await window.AppDB.put("users",m)),ne.innerHTML=await q.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell();const f=t==="approved"?"approved":"rejected",w=`${o.staffName||"Staff"}'s missed checkout for ${h} was ${f}.`;window.appAlert?await window.appAlert(w,"Review Complete"):alert(w)}catch(n){alert("Failed to review missed checkout reason: "+n.message)}};document.addEventListener("dismiss-notification",async a=>{const e=a.detail,t=typeof e=="object"&&e!==null?e.notifIndex:e,n=typeof e=="object"&&e!==null?String(e.notifId||""):"",s=window.AppAuth.getUser();if(s&&s.notifications&&Number.isInteger(t)&&t>=0){let i=s.notifications[t];if(!i&&n&&(i=s.notifications.find(r=>String(r.id||"")===n)),!i)return;i.read=!0,i.dismissedAt=new Date().toISOString(),await window.AppAuth.updateUser(s),(window.location.hash.slice(1)||"dashboard")==="dashboard"&&(ne.innerHTML=await q.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}else if(s&&s.notifications&&n){const i=s.notifications.find(r=>String(r.id||"")===n);if(!i)return;i.read=!0,i.dismissedAt=new Date().toISOString(),await window.AppAuth.updateUser(s),(window.location.hash.slice(1)||"dashboard")==="dashboard"&&(ne.innerHTML=await q.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}});document.addEventListener("dismiss-tag-history",async a=>{const e=String(a.detail||""),t=window.AppAuth.getUser();if(!e||!t||!Array.isArray(t.tagHistory))return;const n=t.tagHistory.findIndex(s=>String(s.id)===e);n<0||(t.tagHistory.splice(n,1),await window.AppAuth.updateUser(t),ne.innerHTML=await q.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents())});document.addEventListener("open-log-modal",()=>{const a=document.getElementById("log-modal");if(!a)return;const e=new Date,t=s=>s.toString().padStart(2,"0");document.getElementById("log-date").value=e.toISOString().split("T")[0],document.getElementById("log-start-time").value=`${t(e.getHours())}:${t(e.getMinutes())}`;const n=new Date(e.getTime()+36e5);document.getElementById("log-end-time").value=`${t(n.getHours())}:${t(n.getMinutes())}`,a.style.display="flex"});document.addEventListener("set-duration",a=>{const e=a.detail,t=document.getElementById("log-start-time"),n=document.getElementById("log-end-time");if(t.value){const[s,i]=t.value.split(":").map(Number),o=new Date;o.setHours(s,i);const r=new Date(o.getTime()+e*60*1e3),d=l=>l.toString().padStart(2,"0");n.value=`${d(r.getHours())}:${d(r.getMinutes())}`}});window.app_editUser=async a=>{console.log("Opening Edit Modal for ID:",a);const e=await window.AppDB.get("users",a);if(console.log("User Data Found:",e),!e)return;const t=document.getElementById("edit-user-form");if(!t)return;const n=(l,c)=>{const p=t.querySelector(l);p&&(p.value=c!==void 0?c:"")},s=(l,c)=>{const p=t.querySelector(l);p&&(p.checked=!!c)};n("#edit-user-id",e.id),n("#edit-user-name",e.name),n("#edit-user-username",e.username),n("#edit-user-password",e.password),n("#edit-user-role",e.role),n("#edit-user-dept",e.dept),n("#edit-user-email",e.email),n("#edit-user-phone",e.phone),s("#edit-user-isAdmin",!!(e.isAdmin||e.role==="Administrator")),s("#edit-user-can-manage-attendance-sheet",!!(e.canManageAttendanceSheet||e.isAdmin||e.role==="Administrator")),n("#edit-user-birth-day",e.birthDay||""),n("#edit-user-birth-month",e.birthMonth||""),n("#edit-user-birth-year",e.birthYear||"");const i=zt(e.joinDate);n("#edit-user-join-date",i),n("#edit-user-employee-id",i?e.employeeId||jt(i,e.id):"NA"),n("#edit-user-base-salary",Number(e.baseSalary||0)),n("#edit-user-other-allowances",Number(e.otherAllowances||0)),n("#edit-user-pf",Number(e.providentFund||0)),n("#edit-user-professional-tax",Number(e.professionalTax||0)),n("#edit-user-loan-advance",Number(e.loanAdvance||0)),n("#edit-user-tds-percent",Number(e.tdsPercent||0)),n("#edit-user-bank-name",e.bankName||""),n("#edit-user-bank-account",e.bankAccount||e.accountNumber||""),n("#edit-user-bank-ifsc",e.bankIfsc||e.ifsc||""),n("#edit-user-pan",e.pan||e.PAN||""),n("#edit-user-uan",e.uan||e.UAN||"");const o=["dashboard","leaves","users","attendance","reports","minutes","policies","birthday"],r=e.permissions||{};if(o.forEach(l=>{const c=r[l],p=document.getElementById(`edit-perm-${l}-view`),u=document.getElementById(`edit-perm-${l}-admin`);p&&(p.checked=c==="view"||c==="admin"),u&&(u.checked=c==="admin")}),!r.birthday&&(e.canManageBirthdays||e.isAdmin||e.role==="Administrator")){const l=document.getElementById("edit-perm-birthday-view"),c=document.getElementById("edit-perm-birthday-admin");l&&(l.checked=!0),c&&(c.checked=!0)}const d=document.getElementById("edit-user-modal");if(d){d.style.display="flex";const l=document.getElementById("edit-user-permissions-panel");l&&(l.style.display="block")}};window.app_notifyUser=a=>{console.log("Opening Notify for:",a),document.getElementById("notify-user-id").value=a,document.getElementById("notify-modal").style.display="flex"};window.app_quickAddTask=async a=>{const e=window.AppAuth.getUser();if(!(e&&(e.role==="Administrator"||e.isAdmin))&&a!==e.id){alert("Only administrators can assign tasks to other staff.");return}const n=await window.appPrompt("Task to assign:","",{title:"Assign Task",placeholder:"Enter task title",confirmText:"Next"});if(!n||!n.trim())return;const s=await window.appPrompt("Task date (YYYY-MM-DD). Leave blank for today:","",{title:"Assign Task Date",placeholder:"YYYY-MM-DD",confirmText:"Create Task"}),i=s&&s.trim()?s.trim():new Date().toISOString().split("T")[0];try{if(!window.AppCalendar)throw new Error("Calendar module not available.");await window.AppCalendar.addWorkPlanTask(i,a,n.trim()),await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:n.trim(),description:"",dueDate:i,status:"pending",fromId:e.id,fromName:e.name,toId:a,toName:(await window.AppDB.get("users",a))?.name||"Staff",createdAt:new Date().toISOString(),read:!1,history:[{action:"created",byId:e.id,byName:e.name,at:new Date().toISOString()}]}),alert("Task added successfully.");const o=document.getElementById("page-content");o&&(o.innerHTML=await q.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()}catch(o){alert("Failed to add task: "+o.message)}};window.app_viewLogs=async a=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}console.log("Viewing details for:",a);const e=await window.AppDB.get("users",a);let t=await window.AppAttendance.getLogs(a);window.currentViewedLogs=t,window.currentViewedUser=e;const n=t.length?`
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
        `;window.app_showModal(e,"manual-admin-log-modal")};window.app_submitManualLog=async(a,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}a.preventDefault();const t=new FormData(a.target),n=t.get("checkIn"),s=t.get("checkOut"),i=za(n,s);if(i==="Invalid"){alert("End time must be after Start time");return}const o=t.get("date"),r=window.AppAttendance.buildDateTime(o,n),d=window.AppAttendance.buildDateTime(o,s),l=r&&d?d-r:0,c=window.AppAttendance.evaluateAttendanceStatus(r||new Date,l),p=m=>{const[h,f]=m.split(":"),w=parseInt(h),v=w>=12?"PM":"AM",k=w%12||12;return`${String(k).padStart(2,"0")}:${f} ${v}`},u={date:o,checkIn:p(n),checkOut:p(s),duration:i,type:c.status,workDescription:t.get("description")||"Manual Entry by Admin",location:"Office (Manual)",durationMs:l,dayCredit:c.dayCredit,lateCountable:c.lateCountable,extraWorkedMs:c.extraWorkedMs||0,policyVersion:"v2",isManualOverride:!0,entrySource:"admin_override",attendanceEligible:!0};try{await window.AppAttendance.addAdminLog(e,u),alert("Attendance added manually."),document.getElementById("manual-admin-log-modal")?.remove(),window.app_viewLogs(e)}catch(m){alert("Error: "+m.message)}};window.app_deleteLog=async(a,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Are you sure you want to delete this attendance record?"))try{await window.AppAttendance.deleteLog(a),alert("Record deleted."),window.app_viewLogs(e)}catch(t){alert("Error: "+t.message)}};window.app_approveLeave=async a=>{if(await window.appConfirm("Are you sure you want to APPROVE this leave request?"))try{const e=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(a,"Approved",e.id),alert("Leave Approved! Attendance logs have been automatically generated.");const t=document.getElementById("page-content");t&&(t.innerHTML=await q.renderDashboard(),Ne())}catch(e){alert("Error: "+e.message)}};window.app_rejectLeave=async a=>{const e=await window.appPrompt("Enter rejection reason (optional):","",{title:"Reject Leave",confirmText:"Reject Leave"});if(e!==null)try{const t=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(a,"Rejected",t.id,e),alert("Leave Rejected.");const n=document.getElementById("page-content");n&&(n.innerHTML=await q.renderDashboard(),Ne())}catch(t){alert("Error: "+t.message)}};window.app_addLeaveComment=async a=>{const e=await window.AppDB.get("leaves",a),t=await window.appPrompt("Enter/Edit Admin Comment:",e.adminComment||"",{title:"Admin Comment",confirmText:"Save Comment"});if(t!==null)try{const n=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(a,e.status,n.id,t),alert("Comment saved.");const s=document.getElementById("page-content");s&&(s.innerHTML=await q.renderDashboard(),Ne())}catch(n){alert("Error: "+n.message)}};window.app_exportLeaves=async()=>{try{const a=await window.AppLeaves.getAllLeaves();if(a.length===0){alert("No leave requests found to export.");return}await window.AppReports.exportLeavesCSV(a)}catch(a){alert("Export Failed: "+a.message)}};window.app_refreshMasterSheet=async()=>{const a=document.getElementById("page-content");if(a){const e=document.getElementById("sheet-month")?.value,t=document.getElementById("sheet-year")?.value;a.innerHTML=await q.renderMasterSheet(e,t)}};window.app_exportMasterSheet=async()=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}const a=parseInt(document.getElementById("sheet-month").value),e=parseInt(document.getElementById("sheet-year").value),t=await window.AppDB.getAll("users"),n=`${e}-${String(a+1).padStart(2,"0")}-01`,s=`${e}-${String(a+1).padStart(2,"0")}-31`,o=(await window.AppDB.query("attendance","date",">=",n)).filter(r=>r.date<=s);await window.AppReports.exportMasterSheetCSV(a,e,t,o)};window.app_openCellOverride=async(a,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}const t=(await window.AppDB.getAll("users")).find(p=>p.id===a),n=await window.AppDB.getAll("attendance"),s=p=>{if(Object.prototype.hasOwnProperty.call(p||{},"attendanceEligible"))return p.attendanceEligible===!0;const u=String(p?.entrySource||"");return u==="staff_manual_work"?!1:u==="admin_override"||u==="checkin_checkout"||p?.isManualOverride||p?.location==="Office (Manual)"||p?.location==="Office (Override)"||typeof p?.activityScore<"u"||typeof p?.locationMismatched<"u"||typeof p?.autoCheckout<"u"||!!p?.checkOutLocation||typeof p?.outLat<"u"||typeof p?.outLng<"u"?!0:String(p?.type||"").includes("Leave")||p?.location==="On Leave"},i=n.filter(p=>(p.userId===a||p.user_id===a)&&p.date===e&&s(p)).sort((p,u)=>Number(u.id||0)-Number(p.id||0))[0],o=["Present","Half Day","Late","Present (Late Waived)","Work - Home","On Duty","Absent","Half Day Leave","Short Leave","Casual Leave","Sick Leave","Medical Leave","Annual Leave","Earned Leave","Paid Leave","Maternity Leave","Paternity Leave","Study Leave","Compassionate Leave","Regional Holidays","National Holiday","Holiday"],r={"Work - Home":"WFH"},d=String(i?.type||"").trim();d&&!o.includes(d)&&o.unshift(d);const l=o.map(p=>{const u=r[p]||p;return`<option value="${p}" ${d===p?"selected":""}>${u}</option>`}).join(""),c=`
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
                                    <input type="time" name="checkIn" required value="${i?Bt(i.checkIn):"09:00"}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time Out</label>
                                    <input type="time" name="checkOut" required value="${i?Bt(i.checkOut):"17:00"}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Entry Type</label>
                                <select name="type" required style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                    ${l}
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
        `;window.app_showModal(c,"cell-override-modal")};window.app_submitCellOverride=async(a,e,t,n)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}a.preventDefault();const s=new FormData(a.target),i=s.get("checkIn"),o=s.get("checkOut"),r=za(i,o);if(r==="Invalid"){alert("End time must be after Start time");return}const d=window.AppAttendance.buildDateTime(t,i),l=window.AppAttendance.buildDateTime(t,o),c=d&&l?l-d:0,p=window.AppAttendance.evaluateAttendanceStatus(d||new Date,c),u=s.get("isManualOverride")==="on",m=String(s.get("type")||"").trim(),h=u&&m?m:p.status,f=v=>{if(!v||v==="--")return"--";const[k,b]=v.split(":"),M=parseInt(k),A=M>=12?"PM":"AM",g=M%12||12;return`${String(g).padStart(2,"0")}:${b} ${A}`},w={date:t,checkIn:f(i),checkOut:f(o),duration:r,type:h,workDescription:s.get("description")||"Admin Override",location:"Office (Override)",durationMs:c,dayCredit:p.dayCredit,lateCountable:p.lateCountable,extraWorkedMs:p.extraWorkedMs||0,policyVersion:"v2",isManualOverride:u,entrySource:"admin_override",attendanceEligible:!0,autoCheckoutExtraApproved:s.get("autoCheckoutExtraApproved")==="on"};try{n?await window.AppAttendance.updateLog(n,w):await window.AppAttendance.addAdminLog(e,w),alert("Override successful."),document.getElementById("cell-override-modal")?.remove(),window.app_refreshMasterSheet()}catch(v){alert("Error: "+v.message)}};window.app_deleteCellLog=async(a,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Delete this attendance record?"))try{await window.AppAttendance.deleteLog(a),document.getElementById("cell-override-modal")?.remove(),window.app_refreshMasterSheet()}catch(t){alert("Error: "+t.message)}};function Bt(a){if(!a||a==="--"||a==="Active Now")return"09:00";const[e,t]=a.split(" ");let[n,s]=e.split(":"),i=parseInt(n);return t==="PM"&&i<12&&(i+=12),t==="AM"&&i===12&&(i=0),`${String(i).padStart(2,"0")}:${s}`}const ar=a=>{if(!a)return null;const e=String(a).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);if(!Number.isNaN(t.getTime())){const s=t.getFullYear(),i=String(t.getMonth()+1).padStart(2,"0"),o=String(t.getDate()).padStart(2,"0");return`${s}-${i}-${o}`}const n=e.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);if(n){const s=Number(n[1]),i=Number(n[2]),o=Number(n[3]);let r=s,d=i;return d>12&&s<=12&&(d=s,r=i),d<1||d>12||r<1||r>31?null:`${o}-${String(d).padStart(2,"0")}-${String(r).padStart(2,"0")}`}return null};window.app_runAttendancePolicyMigration=async()=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Recalculate historical attendance logs with the current policy? This updates stored status/credits for existing office logs.","Run Attendance Migration"))try{const e=await window.AppDB.getAll("attendance");let t=0,n=0,s=0;const i=new Set(["Work - Home","Training","On Duty","Holiday","National Holiday","Regional Holidays"]);let o=0,r=0;const d=new Map,l=new Map,c=f=>{const w=ar(f?.date),v=typeof f?.activityScore<"u"||typeof f?.locationMismatched<"u"||typeof f?.autoCheckout<"u"||!!f?.checkOutLocation||typeof f?.outLat<"u"||typeof f?.outLng<"u";let b=String(f?.entrySource||"").trim();b||(f?.isManualOverride||f?.location==="Office (Manual)"||f?.location==="Office (Override)"?b="admin_override":v?b="checkin_checkout":b="staff_manual_work");const M=f?.checkIn&&f?.checkOut&&f?.checkOut!=="Active Now"?Bt(f.checkIn):null,A=f?.checkIn&&f?.checkOut&&f?.checkOut!=="Active Now"?Bt(f.checkOut):null,g=w&&M?window.AppAttendance.buildDateTime(w,M):null,S=w&&A?window.AppAttendance.buildDateTime(w,A):null,C=!!(g&&S&&S>g),I=C?S-g:null,y=typeof f?.durationMs=="number"?f.durationMs:I,_=typeof y=="number"?Math.max(0,y)/(1e3*60*60):0;let x;return Object.prototype.hasOwnProperty.call(f||{},"attendanceEligible")?x=f.attendanceEligible===!0:b==="staff_manual_work"?x=_>=4:x=!0,{dateIso:w,inDt:g,outDt:S,validTimeRange:C,resolvedDurationMs:y,workedHours:_,inferredSource:b,inferredAttendanceEligible:x}},p=(f,w)=>{const v=window.AppAttendance.normalizeType(f?.type);let k=0;w.inferredSource==="staff_manual_work"?w.workedHours>=8?k=100:w.workedHours>=4&&(k=50):k=Number(window.AppAttendance.getDayCredit(v)||0)*100;let b=0;return b+=k,b+=Math.min(20,Math.floor(Math.max(0,w.workedHours||0))),w.inferredAttendanceEligible&&(b+=40),w.validTimeRange&&(b+=10),w.inferredSource==="checkin_checkout"?b+=8:w.inferredSource==="admin_override"?b+=6:b+=4,f?.isManualOverride&&(b+=4),(String(f?.type||"").includes("Leave")||f?.location==="On Leave")&&(b+=6),b+=Number(f?.id||0)/1e13,b};for(const f of e){if(!f||!f.id)continue;const w=c(f);d.set(f.id,w);const v=f.user_id||f.userId;if(!v||!w.dateIso)continue;const k=`${v}|${w.dateIso}`;l.has(k)||l.set(k,[]),l.get(k).push(f)}const u=new Map;for(const[f,w]of l.entries()){if(!w||w.length===0)continue;const v=w.slice().sort((k,b)=>{const M=d.get(k.id)||c(k),A=d.get(b.id)||c(b);return p(b,A)-p(k,M)});u.set(f,v[0]?.id)}for(const f of e){if(t++,!f||!f.id){s++;continue}const w=window.AppAttendance.normalizeType(f.type),v=d.get(f.id)||c(f),k=v.dateIso,b=v.inDt,M=v.outDt,A=v.resolvedDurationMs,g=v.workedHours,S=v.inferredSource;let C=v.inferredAttendanceEligible;const I=f.user_id||f.userId,y=I&&k?`${I}|${k}`:null,_=y?u.get(y):null,x=!!(_&&_!==f.id),L=!!(f.checkIn&&f.checkOut&&f.checkOut!=="Active Now")&&!!(b&&M&&M<=b),T=!!(f.autoCheckout&&String(f.missedCheckoutReasonStatus||"").toLowerCase()==="approved");let E=f.type,P=f.dayCredit,B=f.lateCountable,R=f.extraWorkedMs||0;if(x&&(C=!1,String(f.type||"").includes("Leave")||(E="Work Log"),P=0,B=!1,R=0,o++),L&&(C=!1,String(f.type||"").includes("Leave")||(E="Work Log"),P=0,B=!1,R=0,r++),T&&!x&&!L)E="Present",P=window.AppAttendance&&typeof window.AppAttendance.getDayCredit=="function"?window.AppAttendance.getDayCredit("Present"):1,B=!1,R=0;else if(S==="staff_manual_work"&&!x&&!L)g>=8?(E="Present",P=1):g>=4?(E="Half Day",P=.5):(E="Work Log",P=0),B=!1,R=0;else if(!f.isManualOverride&&C&&!(i.has(w)||String(w).includes("Leave")||w==="Office")&&b&&M&&M>b){const K=window.AppAttendance.evaluateAttendanceStatus(b,M-b);E=K.status,P=K.dayCredit,B=K.lateCountable,R=K.extraWorkedMs||0}const H={...f,entrySource:S,attendanceEligible:C,type:E,dayCredit:typeof P=="number"?P:0,lateCountable:B===!0,extraWorkedMs:R||0,durationMs:typeof A=="number"?A:null,missedCheckoutApprovedAsFullDay:T?!0:f.missedCheckoutApprovedAsFullDay,policyVersion:"v2"};if(!(f.entrySource!==H.entrySource||f.attendanceEligible!==H.attendanceEligible||f.type!==H.type||f.dayCredit!==H.dayCredit||f.lateCountable!==H.lateCountable||(f.extraWorkedMs||0)!==(H.extraWorkedMs||0)||f.durationMs!==H.durationMs||f.policyVersion!=="v2")){s++;continue}await window.AppDB.put("attendance",H),n++}alert(`Migration complete.
Scanned: ${t}
Updated: ${n}
Skipped: ${s}
Duplicates neutralized: ${o}
Invalid-time logs neutralized: ${r}`);const m=window.location.hash.slice(1),h=document.getElementById("page-content");if(!h)return;m==="policy-test"?h.innerHTML=await q.renderPolicyTest():m==="dashboard"?(h.innerHTML=await q.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()):m==="salary"?(h.innerHTML=await q.renderSalaryProcessing(),window.app_recalculateAllSalaries&&window.app_recalculateAllSalaries()):m==="timesheet"&&(h.innerHTML=await q.renderTimesheet())}catch(e){console.error("Attendance migration failed:",e),alert("Migration failed: "+e.message)}};window.app_deleteUser=async a=>{if(await window.appConfirm("Are you sure you want to delete this user? This action cannot be undone."))try{await window.AppDB.delete("users",a),alert("User deleted successfully.");const e=document.getElementById("page-content");e&&(e.innerHTML=await q.renderAdmin())}catch(e){alert("Failed to delete user: "+e.message)}};window.app_recalculateRow=a=>{const e=parseFloat(a.querySelector(".base-salary-input").value)||0,t=e/22,n=parseFloat(a.querySelector(".unpaid-leaves-count").innerText)||0,s=parseFloat(a.querySelector(".late-count")?.innerText||"0")||0,i=Math.floor(s/(N.LATE_GRACE_COUNT||3))*(N.LATE_DEDUCTION_PER_BLOCK||.5),o=parseFloat(a.querySelector(".extra-work-hours")?.innerText||"0")||0,r=Math.floor(o/(N.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4))*(N.LATE_DEDUCTION_PER_BLOCK||.5),d=Math.max(0,i-r),l=n+d,c=parseFloat(document.getElementById("global-tds-percent").value)||0,p=a.querySelector(".tds-input");p&&!p.dataset.manual&&(p.value=c);const u=p?parseFloat(p.value)||0:c,m=Math.round(t*l),h=a.querySelector(".late-deduction-days"),f=a.querySelector(".late-deduction-raw"),w=a.querySelector(".penalty-offset-days"),v=a.querySelector(".deduction-days"),k=a.querySelector(".attendance-deduction-amount");f&&(f.innerText=i.toFixed(1)),w&&(w.innerText=r.toFixed(1)),h&&(h.innerText=d.toFixed(1)),v&&(v.innerText=l.toFixed(1)),k&&(k.innerText="-Rs "+m.toLocaleString()),a.querySelector(".deduction-amount").innerText="-Rs "+m.toLocaleString();const b=a.querySelector(".salary-input");b.dataset.manual||(b.value=Math.max(0,e-m));const M=parseFloat(b.value)||0,A=Math.round(M*(u/100)),g=Math.max(0,M-A);a.querySelector(".tds-amount").innerText="Rs "+A.toLocaleString(),a.querySelector(".tds-amount").dataset.value=A,a.querySelector(".final-net-salary").innerText="Rs "+g.toLocaleString(),a.querySelector(".final-net-salary").dataset.value=g};const ms=a=>{const e=parseFloat(a.querySelector(".unpaid-leaves-count")?.innerText||"0")||0,t=parseFloat(a.querySelector(".late-count")?.innerText||"0")||0,n=parseFloat(a.querySelector(".extra-work-hours")?.innerText||"0")||0,s=Math.floor(t/(N.LATE_GRACE_COUNT||3))*(N.LATE_DEDUCTION_PER_BLOCK||.5),i=Math.floor(n/(N.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4))*(N.LATE_DEDUCTION_PER_BLOCK||.5),o=Math.max(0,s-i),r=e+o;return{unpaidLeaves:e,lateCount:t,extraWorkedHours:n,rawLateDeductionDays:s,penaltyOffsetDays:i,lateDeductionDays:o,deductionDays:r}};window.app_recalculateAllSalaries=()=>{document.querySelectorAll("tr[data-user-id]").forEach(a=>{window.app_recalculateRow(a)})};const oa=(a,e=new Date)=>{if(/^\d{4}-\d{2}$/.test(String(a||"").trim())){const[t,n]=String(a).split("-").map(Number);if(Number.isFinite(t)&&Number.isFinite(n)&&n>=1&&n<=12)return{year:t,monthIndex:n-1}}return{year:e.getFullYear(),monthIndex:e.getMonth()}};window.app_toggleSalaryPeriodMode=function(){const a=document.getElementById("salary-period-mode")?.value||"single",e=document.getElementById("salary-period-single-wrap"),t=document.getElementById("salary-period-range-wrap");e&&(e.style.display=a==="range"?"none":"block"),t&&(t.style.display=a==="range"?"flex":"none")};window.app_getSalaryPayPeriodInfo=function(){const a=new Date;if((document.getElementById("salary-period-mode")?.value||"single")==="range"){const r=document.getElementById("salary-pay-period-from")?.value||"",d=document.getElementById("salary-pay-period-to")?.value||"";let l=oa(r,a),c=oa(d,a);const p=l.year*100+(l.monthIndex+1);if(c.year*100+(c.monthIndex+1)<p){const v=l;l=c,c=v}const m=new Date(l.year,l.monthIndex,1),h=new Date(c.year,c.monthIndex+1,0),f=`${l.year}-${String(l.monthIndex+1).padStart(2,"0")}`,w=`${c.year}-${String(c.monthIndex+1).padStart(2,"0")}`;return{mode:"range",startDate:m,endDate:h,startKey:f,endKey:w,key:`${f}_to_${w}`,label:`${m.toLocaleDateString("en-GB",{month:"long",year:"numeric"})} to ${h.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}`}}const t=document.getElementById("salary-pay-period")?.value||"",n=oa(t,a),s=new Date(n.year,n.monthIndex,1),i=new Date(n.year,n.monthIndex+1,0),o=`${n.year}-${String(n.monthIndex+1).padStart(2,"0")}`;return{mode:"single",startDate:s,endDate:i,startKey:o,endKey:o,key:o,label:s.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}};window.app_saveAllSalaries=async()=>{const a=document.querySelectorAll("tr[data-user-id]"),e=[],t=[],n=window.app_getSalaryPayPeriodInfo(),s=n.key,i=document.getElementById("salary-pay-date")?.value||"",o=i?new Date(i).getTime():Date.now(),r=parseFloat(document.getElementById("global-tds-percent").value)||0;for(const d of a){const l=d.dataset.userId,c=d.querySelector(".base-salary-input").value,p=d.querySelector(".salary-input").value,u=d.querySelector(".comment-input").value,m=d.querySelector(".tds-input"),h=m?parseFloat(m.value)||0:r,f=d.querySelector(".tds-amount").dataset.value||0,w=d.querySelector(".final-net-salary").dataset.value||0,v=ms(d),k=v.unpaidLeaves,b=v.lateCount,M=v.extraWorkedHours,A=v.rawLateDeductionDays,g=v.penaltyOffsetDays,S=v.lateDeductionDays,C=v.deductionDays,I=Number(String(d.querySelector(".attendance-deduction-amount")?.innerText||"0").replace(/[^0-9.-]+/g,"")),y=String(d.querySelector(".employee-id-input")?.value||"").trim(),_=String(d.querySelector(".designation-input")?.value||"").trim(),x=String(d.querySelector(".department-input")?.value||"").trim(),$=String(d.querySelector(".join-date-input")?.value||"").trim(),L=$?y||jt($,l):"NA",T=String(d.querySelector(".bank-name-input")?.value||"").trim(),E=String(d.querySelector(".bank-account-input")?.value||"").trim(),P=String(d.querySelector(".pan-input")?.value||"").trim(),B=String(d.querySelector(".uan-input")?.value||"").trim(),R=Number(d.querySelector(".other-allowances-input")?.value||0),F=Number(d.querySelector(".pf-input")?.value||0),H=Number(d.querySelector(".professional-tax-input")?.value||0),W=Number(d.querySelector(".loan-advance-input")?.value||0);if(d.querySelector(".comment-input").required&&!u){alert(`Please provide a comment for user ID: ${l} as the salary was adjusted.`);return}e.push({id:`salary_${l}_${s}`,userId:l,month:s,periodMode:n.mode,periodStart:n.startKey,periodEnd:n.endKey,periodLabel:n.label,payDate:o,baseAmount:Number(c),otherAllowances:R,providentFund:F,professionalTax:H,loanAdvance:W,employeeId:L,designation:_,department:x,joinDate:$||null,bankName:T,bankAccount:E,pan:P,uan:B,attendanceDeduction:I,deductions:Number(d.querySelector(".deduction-amount").innerText.replace(/[^0-9.-]+/g,"")),unpaidLeaves:k,lateCount:b,extraWorkedHours:M,lateDeductionRawDays:A,penaltyOffsetDays:g,lateDeductionDays:S,deductionDays:C,adjustedAmount:Number(p),tdsPercent:h,tdsAmount:Number(f),finalNet:Number(w),comment:u||"",processedAt:Date.now()}),t.push({id:l,baseSalary:Number(c),tdsPercent:h,employeeId:L,designation:_,dept:x,joinDate:$||null,bankName:T,bankAccount:E,pan:P,uan:B,otherAllowances:R,providentFund:F,professionalTax:H,loanAdvance:W})}try{for(const l of e)await window.AppDB.put("salaries",l);for(const l of t){const c=await window.AppDB.get("users",l.id);c&&(Object.assign(c,l),await window.AppDB.put("users",c))}alert("All records and TDS details saved successfully!");const d=document.getElementById("page-content");d.innerHTML=await q.renderSalaryProcessing()}catch(d){console.error("Salary Save Error:",d),alert("Failed to save records: "+d.message)}};window.app_exportSalaryCSV=()=>{const a=document.querySelectorAll("tr[data-user-id]");let e=`Staff Name,Emp ID,Designation,Department,Join Date,Bank Name,Bank Account,PAN,UAN,Base Salary,Other Allowances,PF,Professional Tax,Loan Advance,Present,Late,Unpaid Leaves,Extra Work Hours,Late Deduction Raw,Penalty Offset Days,Late Deduction Days,Total Deduction Days,Attendance Deduction,Total Deductions,Adjusted Salary,TDS (%),TDS Amount,Final Net,Comment
`;a.forEach(o=>{const r=o.querySelector('div[style*="font-weight: 600"]').innerText,d=o.querySelector(".base-salary-input").value,l=o.querySelector(".employee-id-input")?.value||"",c=o.querySelector(".designation-input")?.value||"",p=o.querySelector(".department-input")?.value||"",u=o.querySelector(".join-date-input")?.value||"",m=o.querySelector(".bank-name-input")?.value||"",h=o.querySelector(".bank-account-input")?.value||"",f=o.querySelector(".pan-input")?.value||"",w=o.querySelector(".uan-input")?.value||"",v=o.querySelector(".other-allowances-input")?.value||"0",k=o.querySelector(".pf-input")?.value||"0",b=o.querySelector(".professional-tax-input")?.value||"0",M=o.querySelector(".loan-advance-input")?.value||"0",A=o.querySelector(".present-count")?.innerText||"0",g=o.querySelector(".late-count")?.innerText||"0",S=o.querySelector(".unpaid-leaves-count")?.innerText||"0",C=o.querySelector(".extra-work-hours")?.innerText||"0",I=o.querySelector(".late-deduction-raw")?.innerText||"0",y=o.querySelector(".penalty-offset-days")?.innerText||"0",_=o.querySelector(".late-deduction-days")?.innerText||"0",x=o.querySelector(".deduction-days")?.innerText||"0",$=(o.querySelector(".attendance-deduction-amount")?.innerText||"").replace(/[^0-9.-]+/g,"")||"0",L=(o.querySelector(".deduction-amount").innerText||"").replace(/[^0-9.-]+/g,""),T=o.querySelector(".salary-input").value,E=parseFloat(document.getElementById("global-tds-percent").value)||0,P=o.querySelector(".tds-input"),B=P&&P.value!==""?P.value:E,R=(o.querySelector(".tds-amount").innerText||"").replace(/[^0-9.-]+/g,""),F=(o.querySelector(".final-net-salary").innerText||"").replace(/[^0-9.-]+/g,""),H=o.querySelector(".comment-input").value;e+=`"${r}","${l}","${c}","${p}","${u}","${m}","${h}","${f}","${w}",${d},${v},${k},${b},${M},${A},${g},${S},${C},${I},${y},${_},${x},${$},${L},${T},${B},${R},${F},"${H}"
`});const t=new Blob([e],{type:"text/csv"}),n=window.URL.createObjectURL(t),s=document.createElement("a"),i=window.app_getSalaryPayPeriodInfo();s.setAttribute("href",n),s.setAttribute("download",`Salaries_${i.key.replace(/[^a-zA-Z0-9_-]/g,"_")}.csv`),s.click()};const ra=(a,e=4)=>{const t=String(a||"").trim();return t?t.length<=e?t:`${"*".repeat(Math.max(0,t.length-e))}${t.slice(-e)}`:"NA"},nr=a=>{const e=Math.floor(Number(a)||0);if(e===0)return"Zero";const t=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"],n=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"],s=u=>{if(u<20)return t[u];const m=Math.floor(u/10),h=u%10;return`${n[m]}${h?` ${t[h]}`:""}`.trim()},i=u=>{const m=Math.floor(u/100),h=u%100;return m?`${t[m]} Hundred${h?` ${s(h)}`:""}`.trim():s(h)};let o=e;const r=Math.floor(o/1e7);o%=1e7;const d=Math.floor(o/1e5);o%=1e5;const l=Math.floor(o/1e3);o%=1e3;const c=o,p=[];return r&&p.push(`${s(r)} Crore`),d&&p.push(`${s(d)} Lakh`),l&&p.push(`${s(l)} Thousand`),c&&p.push(i(c)),p.join(" ").trim()};window.app_printSalarySlip=function(){const a=document.getElementById("salary-slip-modal");if(!a)return;const e=a.querySelector(".salary-slip-print-root");e&&(document.body.classList.add("salary-slip-print-mode"),e.classList.add("print-active"),setTimeout(()=>{window.print(),setTimeout(()=>{e.classList.remove("print-active"),document.body.classList.remove("salary-slip-print-mode")},150)},60))};window.app_generateSalarySlip=async function(a){try{const e=document.querySelector(`tr[data-user-id="${a}"]`);if(!e){alert("Unable to locate salary row for this user.");return}const t=await window.AppDB.get("users",a);if(!t){alert("User details not found.");return}const n=new Date,s=window.app_getSalaryPayPeriodInfo(),i=s.label,o=Je(s.startDate),r=Je(s.endDate),d=document.getElementById("salary-pay-date")?.value||"",l=Je(d||n),c=Wo(n),p=`CRWI-${s.key.replace(/[^a-zA-Z0-9]/g,"")}-${a}-${String(n.getTime()).slice(-5)}`,u=Number(e.querySelector(".base-salary-input")?.value||0),m=Number(e.querySelector(".salary-input")?.value||0),h=Number(e.querySelector(".tds-input")?.value||0),f=Number(e.querySelector(".tds-amount")?.dataset?.value||"0"),w=Number(e.querySelector(".final-net-salary")?.dataset?.value||"0"),v=Number(String(e.querySelector(".attendance-deduction-amount")?.innerText||"0").replace(/[^0-9.-]+/g,""))||0,k=ms(e),b=k.rawLateDeductionDays,M=k.penaltyOffsetDays,A=k.lateDeductionDays,g=k.deductionDays,S=k.unpaidLeaves,C=k.lateCount,I=String(e.querySelector(".comment-input")?.value||"").trim(),y=Number(e.querySelector(".other-allowances-input")?.value||t.otherAllowances||0),_=u+y,x=Number(e.querySelector(".loan-advance-input")?.value||t.loanAdvance||0),$=Number(e.querySelector(".pf-input")?.value||t.providentFund||0),L=Number(e.querySelector(".professional-tax-input")?.value||t.professionalTax||0),T=String(e.querySelector(".join-date-input")?.value||t.joinDate||"").trim(),E=String(e.querySelector(".employee-id-input")?.value||t.employeeId||"").trim(),P=T?E||jt(T,t.id):"NA",B=String(e.querySelector(".designation-input")?.value||t.designation||t.role||"").trim(),R=String(e.querySelector(".department-input")?.value||t.dept||t.department||"").trim(),F=String(e.querySelector(".join-date-input")?.value||t.joinDate||"").trim(),H=String(e.querySelector(".bank-name-input")?.value||t.bankName||"").trim(),W=String(e.querySelector(".bank-account-input")?.value||t.bankAccount||t.accountNumber||"").trim(),K=String(e.querySelector(".pan-input")?.value||t.pan||t.PAN||"").trim(),O=String(e.querySelector(".uan-input")?.value||t.uan||t.UAN||"").trim(),U=v+f+x+$+L,X=`${nr(w)} Rupees Only`,j=[{label:"Attendance Deduction",amount:v,remarks:`Unpaid Leaves: ${S}, Late Count: ${C}, Late Raw: ${b.toFixed(1)}, Offset: ${M.toFixed(1)}, Late Deduction: ${A.toFixed(1)}, Total Deduction Days: ${g.toFixed(1)}`},{label:"TDS",amount:f,remarks:`Applied at ${h.toFixed(2)}%`},{label:"Provident Fund",amount:$,remarks:$?"Configured as per employee profile":"NA"},{label:"Professional Tax",amount:L,remarks:L?"Configured as per employee profile":"NA"},{label:"Loan / Advance",amount:x,remarks:x?"Recovered in this cycle":"Nil"}],Z=ae=>Ko(ae),ee=`
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
                                <div>Pay Date: ${l}</div>
                            </div>

                            <div class="salary-slip-section">
                                <h4>Employee Details</h4>
                                <div class="salary-slip-grid">
                                    <div><b>Employee Name:</b> ${t.name||"Staff"}</div>
                                    <div><b>Employee ID:</b> ${P||"NA"}</div>
                                    <div><b>Designation:</b> ${B||"NA"}</div>
                                    <div><b>Department:</b> ${R||"NA"}</div>
                                    <div><b>Date of Joining:</b> ${Je(F)}</div>
                                    <div><b>Bank Name:</b> ${H||"NA"}</div>
                                    <div><b>UAN:</b> ${ra(O)}</div>
                                    <div><b>PAN:</b> ${ra(K)}</div>
                                    <div><b>Bank A/C:</b> ${ra(W)}</div>
                                </div>
                            </div>

                            <div class="salary-slip-split">
                                <div class="salary-slip-section">
                                    <h4>Earnings</h4>
                                    <table class="salary-slip-table">
                                        <tr><td>Basic Salary</td><td>${Z(u)}</td></tr>
                                        <tr><td>HRA</td><td>NA</td></tr>
                                        <tr><td>Conveyance Allowance</td><td>NA</td></tr>
                                        <tr><td>Special Allowance</td><td>NA</td></tr>
                                        <tr><td>Other Allowances</td><td>${Z(y)}</td></tr>
                                        <tr class="total"><td>Gross Earnings</td><td>${Z(_)}</td></tr>
                                    </table>
                                </div>
                                <div class="salary-slip-section">
                                    <h4>Deductions (Breakdown)</h4>
                                    <table class="salary-slip-table">
                                        ${j.map(ae=>`<tr><td>${ae.label}<div class="remark">${ae.remarks}</div></td><td>${ae.amount?Z(ae.amount):"NA"}</td></tr>`).join("")}
                                        <tr class="total"><td>Total Deductions</td><td>${Z(U)}</td></tr>
                                    </table>
                                </div>
                            </div>

                            <div class="salary-slip-net">
                                <div><b>Adjusted Salary:</b> ${Z(m)}</div>
                                <div><b>Net Salary:</b> ${Z(w)}</div>
                                <div><b>Net Salary in Words:</b> ${X}</div>
                            </div>

                            <div class="salary-slip-footer">
                                <div>This is a system-generated salary slip and does not require a signature.</div>
                                <div>Generated: ${c} | Payroll Ref ID: ${p}</div>
                                ${I?`<div>Payroll Comment: ${I}</div>`:""}
                            </div>
                        </div>
                    </div>
                </div>
            `;window.app_showModal(ee,"salary-slip-modal")}catch(e){console.error("Salary slip generation failed:",e),alert(`Failed to generate salary slip: ${e.message}`)}};window.app_editTaskStatus=async function(a,e,t){try{const n=window.AppAuth.getUser(),s=t==="completed"?new Date().toISOString().split("T")[0]:null;await window.AppCalendar.updateTaskStatus(a,e,t,s);const i=document.getElementById("page-content");i.innerHTML=await q.renderDashboard(),alert(`Task status updated to: ${t}`)}catch(n){console.error("Failed to update task status:",n),alert("Failed to update task status. Please try again.")}};window.app_reassignTask=async function(a,e,t){try{const n=window.AppAuth.getUser();if(n.role!=="Administrator"&&!n.isAdmin){alert("Only administrators can reassign tasks.");return}await window.AppCalendar.reassignTask(a,e,t);const s=document.getElementById("page-content");s.innerHTML=await q.renderDashboard(),alert("Task reassigned successfully!")}catch(n){console.error("Failed to reassign task:",n),alert("Failed to reassign task. Please try again.")}};window.app_viewTaskDetails=async function(a,e){try{const t=await window.AppDB.get("work_plans",a);if(!t||!t.plans||!t.plans[e]){alert("Task not found.");return}const n=t.plans[e],s=window.AppCalendar.getSmartTaskStatus(t.date,n.status),i={"to-be-started":"#3b82f6","in-process":"#eab308",completed:"#22c55e",overdue:"#ef4444","not-completed":"#6b7280"},o={"to-be-started":"🔵 To Be Started","in-process":"🟡 In Process",completed:"🟢 Completed",overdue:"🔴 Overdue","not-completed":"⚫ Not Completed"},r=`
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
                                        ${n.subPlans.map(d=>`<li>${d}</li>`).join("")}
                                    </ul>
                                </div>
                            `:""}
                        </div>
                        
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="document.getElementById('task-details-modal').remove()" class="action-btn" style="flex: 1;">Close</button>
                        </div>
                    </div>
                </div>
            `;document.getElementById("modal-container").innerHTML=r}catch(t){console.error("Failed to view task details:",t),alert("Failed to load task details.")}};window.app_recalculateRatings=async function(){try{const a=window.AppAuth.getUser();if(a.role!=="Administrator"&&!a.isAdmin){alert("Only administrators can recalculate ratings.");return}if(!await window.appConfirm("This will recalculate ratings for all users. Continue?"))return;const e=await window.AppRating.updateAllRatings();alert(`Successfully updated ratings for ${e.length} users!`);const t=document.getElementById("page-content");t.innerHTML=await q.renderDashboard()}catch(a){console.error("Failed to recalculate ratings:",a),alert("Failed to recalculate ratings. Please try again.")}};window.app_triggerManualAudit=async()=>{if(!await window.appConfirm("Trigger a manual location audit for all active staff?"))return;const a=`Manual Audit @ ${new Date().toLocaleTimeString()}`;try{await window.AppDB.add("system_commands",{type:"audit",slotName:a,timestamp:Date.now(),requestedBy:window.AppAuth.getUser()?.name||"Admin",status:"pending"}),alert("Manual audit command sent. All active staff devices will now perform a stealth check.")}catch(e){console.error("Failed to trigger manual audit:",e),alert("Error: "+e.message)}};window.app_applyAuditFilter=async()=>{const a=document.getElementById("audit-start")?.value,e=document.getElementById("audit-end")?.value,t=document.getElementById("page-content");t&&(t.innerHTML=await q.renderAdmin(a,e),window.AppAnalytics&&window.AppAnalytics.initAdminCharts())};window.app_exportAudits=async()=>{const a=document.getElementById("audit-start")?.value,e=document.getElementById("audit-end")?.value;try{let t=await window.AppDB.getAll("location_audits");if(a&&e&&(t=t.filter(l=>{const c=new Date(l.timestamp).toISOString().split("T")[0];return c>=a&&c<=e})),t.sort((l,c)=>c.timestamp-l.timestamp),t.length===0){alert("No audits found for the selected range.");return}const n=["Timestamp","Date","Time","Staff Member","Slot","Status","Latitude","Longitude"],s=t.map(l=>[l.timestamp,new Date(l.timestamp).toLocaleDateString(),new Date(l.timestamp).toLocaleTimeString(),l.userName||"Unknown",l.slot,l.status,l.lat||"",l.lng||""]),i=[n,...s].map(l=>l.join(",")).join(`
`),o=new Blob([i],{type:"text/csv;charset=utf-8;"}),r=document.createElement("a"),d=URL.createObjectURL(o);r.setAttribute("href",d),r.setAttribute("download",`security_audits_${a||"export"}.csv`),r.style.visibility="hidden",document.body.appendChild(r),r.click(),document.body.removeChild(r)}catch(t){console.error("Export failed:",t),alert("Export failed: "+t.message)}};const ut=["attendance","leaves","work_plans","staff_messages","meetings","minutes","salaries","location_audits","system_audit_logs","system_commands","daily_summaries","daily_summaries_meta","summary_locks"],ja=(a=window.AppAuth?.getUser?.())=>a?window.app_hasPerm?.("users","admin",a)?!0:a.isAdmin===!0||a.role==="Administrator":!1,Rt=a=>{try{if(window.AppDB?.isPermissionDenied?.(a))return!0}catch{}const e=String(a?.code||"").toLowerCase(),t=String(a?.message||"").toLowerCase();return e.includes("permission-denied")||t.includes("missing or insufficient permissions")},it=a=>{if(a==null)return"";if(a instanceof Date&&!Number.isNaN(a.getTime()))return a.toISOString().split("T")[0];if(typeof a=="number"&&Number.isFinite(a)){const n=new Date(a);return Number.isNaN(n.getTime())?"":n.toISOString().split("T")[0]}const e=String(a||"").trim();if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;if(/^\d{4}-\d{2}$/.test(e))return`${e}-01`;if(/^\d{4}-\d{2}-\d{2}T/i.test(e))return e.slice(0,10);if(/^\d+$/.test(e)){const n=new Date(Number(e));if(!Number.isNaN(n.getTime()))return n.toISOString().split("T")[0]}const t=new Date(e);return Number.isNaN(t.getTime())?"":t.toISOString().split("T")[0]},sr=a=>{switch(a){case"attendance":return["date","createdAt","updatedAt"];case"work_plans":return["date","createdAt","updatedAt"];case"staff_messages":return["createdAt","date","updatedAt"];case"meetings":return["date","timestamp","createdAt","updatedAt"];case"minutes":return["date","createdAt","updatedAt","timestamp"];case"salaries":return["payDate","processedAt","month","periodStart","periodEnd","createdAt","updatedAt"];case"birthday_people":return["date","birthDate","dob","createdAt","updatedAt"];case"location_audits":return["timestamp","date","createdAt","updatedAt"];case"system_audit_logs":return["createdAt","timestamp","date","updatedAt"];case"system_commands":return["timestamp","createdAt","date","updatedAt"];case"daily_summaries":return["date","summaryDate","createdAt","updatedAt","id"];case"daily_summaries_meta":return["date","createdAt","updatedAt","lastSuccessAt","id"];case"summary_locks":return["date","createdAt","updatedAt","lockedAt","expiresAt","id"];default:return["date","createdAt","updatedAt","timestamp","id"]}},mn=(a,e,t,n)=>{if(!t||!n)return{matches:!0,hasDate:!0};if(!e||typeof e!="object")return{matches:!1,hasDate:!1};if(a==="leaves"){const i=it(e.startDate||e.appliedOn||e.createdAt||e.date),o=it(e.endDate||e.startDate||e.appliedOn||e.createdAt||e.date);if(!i&&!o)return{matches:!1,hasDate:!1};const r=i||o;return{matches:!((o||i)<t||r>n),hasDate:!0}}const s=sr(a);for(const i of s){const o=it(e[i]);if(o)return{matches:o>=t&&o<=n,hasDate:!0}}return{matches:!1,hasDate:!1}},ir=(a,e)=>{const t=new Blob([JSON.stringify(a,null,2)],{type:"application/json;charset=utf-8;"}),n=URL.createObjectURL(t),s=document.createElement("a");s.href=n,s.download=e,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(n)},fn=a=>{if(a==null)return"";let e="";return typeof a=="object"?e=JSON.stringify(a):e=String(a),e=e.replace(/"/g,'""'),/[",\n]/.test(e)?`"${e}"`:e},or=(a=[])=>{const e=Array.isArray(a)?a:[],t=new Set;e.forEach(o=>{!o||typeof o!="object"||Object.keys(o).forEach(r=>t.add(String(r)))});const n=Array.from(t);if(!n.length)return`id
`;const s=n.map(fn).join(","),i=e.map(o=>n.map(r=>fn(o?.[r])).join(","));return[s,...i].join(`
`)},rr=(a,e)=>{const t=new Blob([a],{type:"text/csv;charset=utf-8;"}),n=URL.createObjectURL(t),s=document.createElement("a");s.href=n,s.download=e,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(n)};window.app_backupStaffData=async(a={})=>{const e=window.AppAuth?.getUser?.();if(!ja(e))return alert("Only admin users can run staff data backup."),{success:!1,reason:"not_authorized"};const t={},n={},s=[],i=[];if((await Promise.all(ut.map(async u=>{try{const m=await window.AppDB.getAll(u);return{collection:u,rows:m||[],warning:null}}catch(m){return Rt(m)?{collection:u,rows:[],warning:`Permission denied for ${u}. Backed up as empty.`}:{collection:u,rows:[],error:m}}}))).forEach(u=>{const m=u.collection;if(u.error){i.push(m);return}u.warning&&s.push(u.warning),t[m]=u.rows||[],n[m]=(u.rows||[]).length}),i.length)throw new Error(`Backup failed while reading: ${i.join(", ")}`);const d=new Date().toISOString(),c=`staff_backup_${d.replace(/[:.]/g,"-")}.json`,p={meta:{generatedAt:d,generatedById:e?.id||"",generatedByName:e?.name||"",reason:a.reason||"manual_backup",scope:"staff_activity_reset",usersRetained:!0,collections:[...ut],warnings:s},counts:n,data:t};return ir(p,c),a.showSuccess!==!1&&alert(`Backup downloaded successfully as ${c}.`),{success:!0,fileName:c,counts:n}};window.app_backupStaffDataCSV=async()=>{const a=window.AppAuth?.getUser?.();if(!ja(a))return alert("Only admin users can run staff data backup."),{success:!1,reason:"not_authorized"};const t=new Date().toISOString().replace(/[:.]/g,"-"),n=[],s=[],i={};let o=0;if((await Promise.all(ut.map(async l=>{try{const c=await window.AppDB.getAll(l);return{collection:l,rows:c||[],warning:null}}catch(c){return Rt(c)?{collection:l,rows:[],warning:`Permission denied for ${l}. Backed up as empty.`}:{collection:l,rows:[],error:c}}}))).forEach(l=>{const c=l.collection;if(l.error){s.push(c);return}l.warning&&n.push(l.warning),i[c]=(l.rows||[]).length;const p=or(l.rows||[]);rr(p,`staff_backup_${c}_${t}.csv`),o+=1}),s.length)throw new Error(`CSV backup failed while reading: ${s.join(", ")}`);const d=n.length?`
Warnings:
- ${n.join(`
- `)}`:"";return alert(`CSV backup downloaded (${o} files).${d}`),{success:!0,downloadedFiles:o,counts:i,warnings:n}};window.app_resetStaffData=async(a={})=>{const e=window.AppAuth?.getUser?.();if(!ja(e)){alert("Only admin users can reset staff data.");return}const t=it(a.startDate||""),n=it(a.endDate||""),s=!!(t||n);if(t&&!n||!t&&n){alert("Please select both From Date and To Date for range reset.");return}if(s&&t>n){alert("From Date cannot be after To Date.");return}const i=s?`${t} to ${n}`:"All dates",o=!s;if(!await window.appConfirm(`This will permanently remove staff activity data (attendance, leaves, plans, messages, audits, minutes, and related records) for: ${i}. User accounts will be kept. Continue?`))return;const d="RESET STAFF DATA",l=await window.appPrompt(`Type ${d} to continue.`,"",{title:"Final Confirmation",confirmText:"Run Reset",placeholder:d});if(l===null)return;if(String(l||"").trim().toUpperCase()!==d){alert("Confirmation text did not match. Reset cancelled.");return}let c=null;try{c=await window.app_backupStaffData({reason:s?`pre_reset_backup_${t}_to_${n}`:"pre_reset_backup",showSuccess:!1})}catch(A){console.error("Pre-reset backup failed:",A),alert(`Reset cancelled because backup failed: ${A.message}`);return}if(!c?.success){alert("Reset cancelled because backup did not complete.");return}const p={},u={},m=[],h={},f=[];for(const A of ut)try{if(o){const y=window.AppDB.deleteAllInCollection?await window.AppDB.deleteAllInCollection(A,{source:"server"}):0;p[A]=Number(y||0);continue}const g=await window.AppDB.getAll(A,{source:"server"}),S=[];let C=0;for(const y of g||[]){const _=mn(A,y,t,n);_.hasDate||(C+=1),_.matches&&y?.id&&S.push(String(y.id))}const I=S.length&&window.AppDB.deleteMany?await window.AppDB.deleteMany(A,S):0;p[A]=Number(I||0),C>0&&(u[A]=C)}catch(g){if(Rt(g)){p[A]=Number(p[A]||0),m.push(A);continue}console.error(`Failed resetting ${A}:`,g),p[A]=Number(p[A]||0),f.push(`${A}: ${g.message}`)}for(const A of ut)try{const g=await window.AppDB.getAll(A,{source:"server",silentPermissionDenied:!0});let S=0;o?S=Number((g||[]).length||0):S=Number((g||[]).filter(C=>mn(A,C,t,n).matches).length||0),S>0&&(h[A]=S)}catch(g){Rt(g)||f.push(`verify(${A}): ${g.message}`)}let w=0;if(o)try{const A=await window.AppDB.getAll("users");for(const g of A)!g||!g.id||(await window.AppDB.put("users",{id:g.id,status:"out",lastCheckIn:null,lastCheckOut:null,currentLocation:null,notifications:[],lastSeen:null}),w+=1)}catch(A){console.error("Failed to normalize users after reset:",A),f.push(`users(normalization): ${A.message}`)}const v=Object.values(p).reduce((A,g)=>A+Number(g||0),0),k=Object.values(u).reduce((A,g)=>A+Number(g||0),0),b=Object.values(h).reduce((A,g)=>A+Number(g||0),0),M=[`Backup: ${c.fileName}`,`Range: ${i}`,`Deleted records: ${v}`,`Users normalized: ${w}`,k>0?`Skipped (no date in selected mode): ${k}`:"",m.length?`Skipped (permission denied): ${m.join(", ")}`:"",b>0?`Still present after reset: ${b}`:"Verification: no matching records remain on Firestore"].filter(Boolean).join(`
`);try{window.AppDB?.cache?.clear&&window.AppDB.cache.clear(),window.AppAnalytics?.memo?.clear&&window.AppAnalytics.memo.clear(),window.AppLeaves?.cache&&typeof window.AppLeaves.cache=="object"&&(window.AppLeaves.cache={}),window._currentPlans=null}catch{}if(window.AppAuth?.refreshCurrentUserFromDB)try{await window.AppAuth.refreshCurrentUserFromDB()}catch{}if(window.location.hash.replace("#","")==="admin"&&window.app_refreshAdminPage&&await window.app_refreshAdminPage(),f.length){alert(`Reset completed with issues.
${M}

Errors:
${f.join(`
`)}`);return}alert(`Staff activity data reset completed.
${M}`)};window.app_changeAnnualYear=a=>{window.app_annualYear=(window.app_annualYear||new Date().getFullYear())+a,window.app_renderAnnualPlanPage()};window.app_toggleAnnualLegendFilter=a=>{const e=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0,overdue:!0,completed:!0};Object.prototype.hasOwnProperty.call(e,a)&&(e[a]=!e[a],window.app_annualLegendFilters=e,window.app_renderAnnualPlanPage())};window.app_showAnnualDayDetails=async a=>{if(!a)return;const e=window._currentPlans||await window.AppCalendar.getPlans(),t=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0},n=window.AppAuth.getUser()||{},s=n.role==="Administrator"||n.isAdmin,i=(window.app_getDayEvents(a,e,{includeAuto:!1,userId:s?null:n.id})||[]).filter(d=>d.type==="leave"?!!t.leave:d.type==="work"?!!t.work:(d.type==="holiday",!!t.event)),o=i.length?i.map(d=>{const l=d.type||"event",c=l==="leave"?"background:#fee2e2;color:#991b1b;":l==="work"?"background:#e0e7ff;color:#3730a3;":l==="holiday"?"background:#f1f5f9;color:#334155;":"background:#dcfce7;color:#166534;",p=l==="work"&&Array.isArray(d.plans)&&d.plans.length?`<ul style="margin:0.5rem 0 0 1rem; padding:0; color:#475569; font-size:0.8rem;">
                    ${d.plans.map(u=>`<li>${window.app_formatTaskWithPostponeChip(u.task||"Work plan item")}</li>`).join("")}
                   </ul>`:"";return`
                <div class="annual-v2-detail-item" style="border:1px solid #eef2f7; border-radius:12px; padding:0.75rem;">
                    <div class="annual-v2-detail-item-head" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                        <span class="annual-v2-detail-tag" style="padding:2px 8px; border-radius:999px; font-size:0.7rem; font-weight:700; ${c}">${l.toUpperCase()}</span>
                        <div class="annual-v2-detail-title" style="font-size:0.9rem; color:#1f2937; font-weight:600;">${d.title||"Event"}</div>
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
            </div>`;window.app_showModal(r,"annual-day-detail-modal")};window.app_toggleAnnualView=a=>{window.app_annualViewMode=a,window.app_renderAnnualPlanPage()};window.app_jumpToAnnualToday=()=>{const a=new Date;window.app_annualYear=a.getFullYear(),window.app_selectedAnnualDate=a.toISOString().split("T")[0],window.app_renderAnnualPlanPage().then(()=>{window.app_showAnnualDayDetails(window.app_selectedAnnualDate)})};window.app_renderAnnualPlanPage=async()=>{const a=document.getElementById("page-content");a&&(a.innerHTML=await q.renderAnnualPlan())};window.app_setAnnualStaffFilter=a=>{window.app_annualStaffFilter=String(a||"").trim(),window.app_renderAnnualPlanPage()};window.app_setAnnualListSearch=a=>{window.app_annualListSearch=String(a||"").trim(),window.app_renderAnnualPlanPage()};window.app_setAnnualListSort=a=>{window.app_annualListSort=String(a||"date-asc").trim(),window.app_renderAnnualPlanPage()};window.app_renderTimesheetPage=async()=>{const a=document.getElementById("page-content");a&&(a.innerHTML=await q.renderTimesheet())};window.app_setTimesheetView=a=>{window.app_timesheetViewMode=a==="calendar"?"calendar":"list",window.app_renderTimesheetPage()};window.app_changeTimesheetMonth=a=>{const e=new Date,t=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:e.getMonth(),n=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:e.getFullYear(),s=new Date(n,t,1);s.setMonth(s.getMonth()+a),window.app_timesheetMonth=s.getMonth(),window.app_timesheetYear=s.getFullYear(),window.app_renderTimesheetPage()};window.app_jumpTimesheetToday=()=>{const a=new Date;window.app_timesheetMonth=a.getMonth(),window.app_timesheetYear=a.getFullYear(),window.app_renderTimesheetPage()};window.app_closeModal=a=>{const e=a&&a.closest?a.closest(".modal-overlay"):null;e&&e.remove()};window.app_getSystemUpdateNotes=()=>[{date:"2026-02-21",summary:"Check for System Update now shows this quick update popup before refreshing."},{date:"2026-02-21",summary:"The update action shortcut was changed from Ctrl+F5 to Ctrl+Shift+R."}];window.app_showSystemUpdatePopup=()=>{if(document.getElementById("system-update-modal"))return;const a="system-update-modal",e=yt();Q.lastPopupReleaseId=e.releaseId||"";const t=e.active&&e.buildId&&e.buildId!==e.currentBuildId,n=(window.app_getSystemUpdateNotes()||[]).slice(0,5),s=n.length?n.map(l=>`
                <li style="margin:0 0 0.7rem 0; color:#334155; line-height:1.45;">
                    <span style="display:block; font-size:0.72rem; color:#64748b; font-weight:700;">${Y(l.date||"")}</span>
                    <span>${Y(l.summary||"")}</span>
                </li>
            `).join(""):'<li style="color:#64748b;">No update notes available.</li>',i=t?`
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0.6rem 0.75rem; margin-bottom:0.8rem;">
                    <div style="font-size:0.78rem; font-weight:700; color:#0f172a;">New version available</div>
                    <div style="font-size:0.74rem; color:#475569; margin-top:0.15rem;">
                        Running build: ${Y((e.currentCommitSha||"").slice(0,7)||e.currentBuildId||"local")}
                        ${e.currentBuiltAt?` | Built: ${Y(e.currentBuiltAt)}`:""}
                    </div>
                    <div style="font-size:0.74rem; color:#475569; margin-top:0.25rem;">
                        Available build: ${Y((e.commitSha||"").slice(0,7)||e.buildId)}
                        ${e.deployedAt?` | Deployed: ${Y(e.deployedAt)}`:""}
                    </div>
                    ${e.notes?`<div style="font-size:0.78rem; color:#0f172a; margin-top:0.45rem;">${Y(e.notes)}</div>`:""}
                </div>
            `:`
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0.6rem 0.75rem; margin-bottom:0.8rem;">
                    <div style="font-size:0.78rem; font-weight:700; color:#0f172a;">You are on the latest version</div>
                    <div style="font-size:0.74rem; color:#475569; margin-top:0.15rem;">
                        Current build: ${Y((e.currentCommitSha||"").slice(0,7)||e.currentBuildId||"local")}
                        ${e.currentBuiltAt?` | Built: ${Y(e.currentBuiltAt)}`:""}
                    </div>
                </div>
            `,o=t?"window.app_dismissReleaseUpdatePrompt()":"this.closest('.modal-overlay').remove()",d=`
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
        `;window.app_showModal(d,a)};const dr=async a=>{if(!a?.waiting||!navigator.serviceWorker)return!1;const e=a.waiting;return new Promise(t=>{let n=!1;const s=r=>{n||(n=!0,navigator.serviceWorker.removeEventListener("controllerchange",i),clearTimeout(o),t(r))},i=()=>s(!0),o=setTimeout(()=>s(!1),3e3);navigator.serviceWorker.addEventListener("controllerchange",i,{once:!0}),e.postMessage({type:"SKIP_WAITING"})})};window.app_forceRefresh=async()=>{try{if(navigator.serviceWorker){const a=await navigator.serviceWorker.getRegistrations();wa?.update&&await wa.update();for(const e of a)await dr(e)}if(window.caches){const a=await caches.keys();await Promise.all(a.map(e=>caches.delete(e)))}}catch(a){console.warn("Force refresh cleanup failed:",a)}Ua(!0),window.location.reload()};Ro();console.log("App.js Loaded & Globals Ready");
