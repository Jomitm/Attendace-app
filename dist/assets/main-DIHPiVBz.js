(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&a(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(s){if(s.ep)return;s.ep=!0;const i=t(s);fetch(s.href,i)}})();const x={WORK_START_TIME:"09:00",LATE_CUTOFF_TIME:"09:15",WORK_END_TIME:"17:00",LATE_CUTOFF_MINUTES:555,MINOR_LATE_END_MINUTES:615,LATE_END_MINUTES:720,POST_NOON_END_MINUTES:810,AFTERNOON_START_MINUTES:720,EARLY_DEPARTURE_MINUTES:1020,FY_START_MONTH:3,IS_SATURDAY_OFF:n=>{const t=new Date(n).getDate(),a=Math.ceil(t/7);return a===2||a===4},LATE_GRACE_COUNT:3,LATE_DEDUCTION_PER_BLOCK:.5,EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4,READ_CACHE_TTLS:{users:6e4,settings:3e5,minutes:3e4,attendanceSummary:3e4,staffMessages:2e4,dailySummaryReadMs:6e4},READ_OPT_FLAGS:{FF_READ_OPT_DB_QUERIES:!0,FF_READ_OPT_TARGETED_REALTIME:!0,FF_READ_OPT_ANALYTICS_CACHE:!0,FF_SHARED_DAILY_SUMMARY:!0,FF_SUMMARY_LOCKING:!0,ENABLE_SIMULATION_MODULE:!1,ENABLE_READ_TELEMETRY:!0,ENABLE_PRESENCE_HEARTBEAT:!1},SUMMARY_POLICY:{STALENESS_MS:1440*60*1e3,TEAM_ACTIVITY_LIMIT:15,LOCK_TTL_MS:9e4,SCHEMA_VERSION:2,RECOMPUTE_CUTOFF_HOUR_IST:17,FALLBACK_TO_PREVIOUS_DAY:!0},HERO_POLICY:{SCHEMA_VERSION:2,WINDOW_DAYS:7,FALLBACK_LOOKBACK_DAYS:90,WEIGHTS:{taskExecution:.45,taskCompletionRate:.2,taskInProgressSupport:.1,taskMissPenalty:.1},ATTENDANCE_MODIFIER:{base:.9,maxBonus:.15,consistencyImpact:.65,effortImpact:.35},CAPS:{hours:40,qualityChars:500},DEFAULT_ACTIVITY_SCORE:70,MIN_EVIDENCE:{minDays:1,minDurationMs:1,minPlannedTasks:1}},SIMULATION_POLICY:{LEGACY_DUMMY_CLEANUP:{ENABLED:!0,FLAG_KEY:"legacy_dummy_cleanup_v1",TARGET_USER_IDS:["sim_punctual","sim_admin_new"],TARGET_USERNAMES:["jomit_p","maria"],AUDIT_COLLECTION:"system_audit_logs"}}},Wa={apiKey:"AIzaSyC7a8AxukI0-egXimYTedwCa2RFnMTBu84",authDomain:"crwiattendance.firebaseapp.com",projectId:"crwiattendance",storageBucket:"crwiattendance.firebasestorage.app",messagingSenderId:"462155106938",appId:"1:462155106938:web:18291b04a5a3bec185c9c3",measurementId:"G-X6W45TV4QR"};typeof firebase<"u"&&!firebase.apps.length&&(firebase.initializeApp(Wa),console.log("Firebase Initialized (Compat Mode)"));const sa=typeof firebase<"u"?firebase.firestore():null;typeof window<"u"&&(window.AppFirestore=sa);class Ya{constructor(){this.db=sa,this.cache=new Map,this.telemetry={get:0,getAll:0,query:0,queryMany:0,listen:0,listenQuery:0,writes:0,docsRead:0,byCollection:{}}}async init(){if(!this.db){console.error("Firebase not initialized! Check config.");return}console.log("Firestore adapter ready.")}getFlags(){return x&&x.READ_OPT_FLAGS||{}}track(e,t,a=0){this.getFlags().ENABLE_READ_TELEMETRY&&(typeof this.telemetry[e]=="number"&&(this.telemetry[e]+=1),this.telemetry.docsRead+=Math.max(0,Number(a)||0),this.telemetry.byCollection[t]||(this.telemetry.byCollection[t]={ops:0,docsRead:0}),this.telemetry.byCollection[t].ops+=1,this.telemetry.byCollection[t].docsRead+=Math.max(0,Number(a)||0))}getReadTelemetry(){return JSON.parse(JSON.stringify(this.telemetry))}clearReadTelemetry(){this.telemetry={get:0,getAll:0,query:0,queryMany:0,listen:0,listenQuery:0,writes:0,docsRead:0,byCollection:{}}}getCacheKey(e,t,a={}){return`${e}:${t}:${JSON.stringify(a)}`}invalidateCollectionCache(e){const t=`:${e}:`;for(const a of this.cache.keys())a.includes(t)&&this.cache.delete(a)}async getCached(e,t,a){const s=Date.now(),i=this.cache.get(e);if(i&&i.expiresAt>s)return i.value;const o=await a();return this.cache.set(e,{value:o,expiresAt:s+Math.max(0,Number(t)||0)}),o}async getOrGenerateSummary(e,t,a){if(!e||typeof t!="function")throw new Error("getOrGenerateSummary requires a key and generator function.");const s=this.getCacheKey("summary","computed",{summaryKey:e}),i=typeof a=="number"?a:x?.READ_CACHE_TTLS?.attendanceSummary||3e4;return this.getCached(s,i,t)}async sleep(e){return new Promise(t=>setTimeout(t,Math.max(0,Number(e)||0)))}getSummarySchemaVersion(){return Number(x?.SUMMARY_POLICY?.SCHEMA_VERSION||1)}getIstNow(){const e=new Date;return new Date(e.toLocaleString("en-US",{timeZone:"Asia/Kolkata"}))}toDateKey(e){const t=e instanceof Date?e:new Date(e),a=t.getFullYear(),s=String(t.getMonth()+1).padStart(2,"0"),i=String(t.getDate()).padStart(2,"0");return`${a}-${s}-${i}`}getISTDateKeys(){const e=this.getIstNow(),t=new Date(e);return t.setDate(t.getDate()-1),{todayKey:this.toDateKey(e),yesterdayKey:this.toDateKey(t)}}shouldRecomputeNowIST(e){const t=Number.isFinite(Number(e))?Number(e):Number(x?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST||17);return this.getIstNow().getHours()>=Math.max(0,Math.min(23,t))}isSummaryFresh(e,t){if(!e||typeof e!="object")return!1;const a=Number(e.generatedAt||0),s=Number(e.version||0);return!a||!s||s!==this.getSummarySchemaVersion()?!1:Date.now()-a<=Math.max(0,Number(t)||0)}async getDailySummary(e){const t=String(e||"").trim();if(!t)return null;const a=x?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4,s=this.getCacheKey("dailySummary","daily_summaries",{key:t});return this.getCached(s,a,()=>this.get("daily_summaries",t))}listenDailySummary(e,t){const a=String(e||"").trim();if(!a)return null;const s=this.getCacheKey("dailySummary","daily_summaries",{key:a});return this.listenDoc("daily_summaries",a,(i,o)=>{if(i){const r=x?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4;this.cache.set(s,{value:i,expiresAt:Date.now()+r})}t&&t(i,o)})}async getSummaryByDateKey(e){return this.getDailySummary(e)}async getLatestSuccessfulSummaryMeta(){const e=x?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4,t=this.getCacheKey("dailySummaryMeta","daily_summaries_meta",{key:"latest_success"});return this.getCached(t,e,()=>this.get("daily_summaries_meta","latest_success"))}async setLatestSuccessfulSummaryMeta({dateKey:e,generatedAt:t,version:a}={}){const s=String(e||"").trim();if(!s)return;const i={id:"latest_success",dateKey:s,generatedAt:Number(t||Date.now()),version:Number(a||this.getSummarySchemaVersion())};await this.put("daily_summaries_meta",i)}async getDailySummaryWithFallback({todayKey:e,yesterdayKey:t,staleAfterMs:a}={}){const s=Math.max(1e3,Number(a)||Number(x?.SUMMARY_POLICY?.STALENESS_MS)||864e5),i=x?.SUMMARY_POLICY?.FALLBACK_TO_PREVIOUS_DAY!==!1,o=await this.getSummaryByDateKey(e);if(this.isSummaryFresh(o,s))return{summary:o,source:"today"};if(i){const l=await this.getSummaryByDateKey(t);if(l&&typeof l=="object")return{summary:l,source:"yesterday"}}const r=await this.getLatestSuccessfulSummaryMeta(),d=String(r?.dateKey||"").trim();if(d){const l=await this.getSummaryByDateKey(d);if(l&&typeof l=="object")return{summary:l,source:"latest_success"}}return{summary:o||null,source:"none"}}async putDailySummary(e,t={}){const a=String(e||"").trim();if(!a)throw new Error("putDailySummary requires dateKey.");const s={id:a,dateKey:a,version:this.getSummarySchemaVersion(),...t};return this.put("daily_summaries",s)}async acquireSummaryLock(e,t,a){const s=String(e||"").trim(),i=String(t||"").trim();if(!s||!i||!this.db||!this.db.runTransaction)return!1;if(x?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING===!1)return!0;const o=Math.max(1e3,Number(a)||Number(x?.SUMMARY_POLICY?.LOCK_TTL_MS)||9e4),r=this.db.collection("summary_locks").doc(s),d=Date.now();try{return await this.db.runTransaction(async c=>{const f=await c.get(r);if(f.exists){const u=f.data()||{},p=String(u.ownerId||"");if(Number(u.expiresAt||0)>d&&p&&p!==i)return!1}return c.set(r,{id:s,dateKey:s,ownerId:i,createdAt:d,expiresAt:d+o},{merge:!0}),!0})===!0}catch(l){return console.warn("Failed to acquire summary lock:",l),!1}}async releaseSummaryLock(e,t){const a=String(e||"").trim(),s=String(t||"").trim();if(!a||!s||!this.db||!this.db.runTransaction||x?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING===!1)return;const i=this.db.collection("summary_locks").doc(a);try{await this.db.runTransaction(async o=>{const r=await o.get(i);if(!r.exists)return;const d=r.data()||{};String(d.ownerId||"")===s&&o.delete(i)})}catch(o){console.warn("Failed to release summary lock:",o)}}async getOrCreateDailySummary({dateKey:e,yesterdayKey:t,generatorFn:a,staleAfterMs:s,lockTtlMs:i}={}){const o=this.getISTDateKeys(),r=String(e||o.todayKey||"").trim(),d=String(t||o.yesterdayKey||"").trim();if(!r||typeof a!="function")throw new Error("getOrCreateDailySummary requires dateKey and generatorFn.");const l=Math.max(1e3,Number(s)||Number(x?.SUMMARY_POLICY?.STALENESS_MS)||864e5),c=Math.max(1e3,Number(i)||Number(x?.SUMMARY_POLICY?.LOCK_TTL_MS)||9e4),f=String(window.AppAuth?.getUser?.()?.id||`anon_${Math.random().toString(36).slice(2,10)}`),u=await this.getDailySummaryWithFallback({todayKey:r,yesterdayKey:d,staleAfterMs:l});if(u.summary&&u.source==="today"&&this.isSummaryFresh(u.summary,l))return{...u.summary,_source:"shared_today"};if(!this.shouldRecomputeNowIST(x?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST))return u.summary?{...u.summary,_source:`fallback_${u.source}`}:null;if(await this.acquireSummaryLock(r,f,c))try{const y={...await a()||{},generatedAt:Date.now(),generatedBy:f,version:this.getSummarySchemaVersion()};return await this.putDailySummary(r,y),await this.setLatestSuccessfulSummaryMeta({dateKey:r,generatedAt:y.generatedAt,version:y.version}),{dateKey:r,...y,_source:"generated"}}finally{await this.releaseSummaryLock(r,f)}const m=[350,700,1200,1800];for(const h of m){await this.sleep(h);const y=await this.getDailySummary(r);if(this.isSummaryFresh(y,l))return{...y,_source:"shared"}}return u.summary?{...u.summary,_source:`fallback_${u.source}`}:null}applyFilters(e,t=[]){let a=e;return(t||[]).forEach(s=>{!s||!s.field||!s.operator||(a=a.where(s.field,s.operator,s.value))}),a}applyOptions(e,t={}){let a=e;return t.orderBy&&(Array.isArray(t.orderBy)?t.orderBy:[t.orderBy]).forEach(i=>{i&&(typeof i=="string"?a=a.orderBy(i):i.field&&(a=a.orderBy(i.field,i.direction||"asc")))}),t.limit&&(a=a.limit(t.limit)),t.startAt!==void 0&&(a=a.startAt(t.startAt)),t.endAt!==void 0&&(a=a.endAt(t.endAt)),a}async getAll(e){try{const a=(await this.db.collection(e).get()).docs.map(s=>({...s.data(),id:s.id}));return this.track("getAll",e,a.length),a}catch(t){throw console.error(`Error getting all from ${e}:`,t),t}}async get(e,t){if(!t)return null;try{const a=String(t),i=await this.db.collection(e).doc(a).get();return i.exists?(this.track("get",e,1),{...i.data(),id:i.id}):(this.track("get",e,0),null)}catch(a){throw console.error(`Error getting ${t} from ${e}:`,a),a}}async add(e,t){if(t.id)return this.put(e,t);try{const a=await this.db.collection(e).add(t);return this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"add"}})),a.id}catch(a){throw console.error(`Error adding to ${e}:`,a),a}}async put(e,t){if(!t.id)throw new Error("Item must have an ID for 'put' operation.");try{const a=String(t.id);return await this.db.collection(e).doc(a).set(t,{merge:!0}),this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"put"}})),a}catch(a){throw console.error(`Error putting ${t.id} to ${e}:`,a),a}}async delete(e,t){if(t)try{const a=String(t);await this.db.collection(e).doc(a).delete(),this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"delete"}}))}catch(a){throw console.error(`Error deleting ${t} from ${e}:`,a),a}}async query(e,t,a,s){try{const o=(await this.db.collection(e).where(t,a,s).get()).docs.map(r=>({...r.data(),id:r.id}));return this.track("query",e,o.length),o}catch(i){throw console.error(`Error querying ${e}:`,i),i}}async queryMany(e,t=[],a={}){if(!this.getFlags().FF_READ_OPT_DB_QUERIES)return this.getAll(e);try{let i=this.db.collection(e);i=this.applyFilters(i,t),i=this.applyOptions(i,a);const r=(await i.get()).docs.map(d=>({...d.data(),id:d.id}));return this.track("queryMany",e,r.length),r}catch(i){return console.warn(`queryMany failed for ${e}, falling back to getAll`,i),this.getAll(e)}}async getManyByIds(e,t=[]){const a=Array.from(new Set((t||[]).filter(Boolean).map(o=>String(o))));if(!a.length)return[];const s=[];for(let o=0;o<a.length;o+=10)s.push(a.slice(o,o+10));return(await Promise.all(s.map(async o=>{try{const r=await this.queryMany(e,[{field:"id",operator:"in",value:o}]);return r&&r.length?r:Promise.all(o.map(d=>this.get(e,d)))}catch{return Promise.all(o.map(r=>this.get(e,r)))}}))).flat().filter(Boolean)}listenDoc(e,t,a){if(!this.db||!t)return null;const s=String(t);try{return this.db.collection(e).doc(s).onSnapshot(i=>{const o=i.exists?{...i.data(),id:i.id}:null;this.track("listen",e,1),a(o,i)},i=>{console.error(`Realtime listener error in ${e}/${s}:`,i)})}catch(i){return console.error(`Error setting up listener for ${e}/${s}:`,i),null}}listenQuery(e,t=[],a={},s){if(!this.db)return null;try{let i=this.db.collection(e);return i=this.applyFilters(i,t),i=this.applyOptions(i,a),i.onSnapshot(o=>{const r=o.docs.map(d=>({...d.data(),id:d.id}));this.track("listenQuery",e,r.length),s(r,o)},o=>{console.error(`Realtime query listener error in ${e}:`,o)})}catch(i){return console.warn(`listenQuery failed for ${e}, falling back to listen`,i),this.listen(e,s)}}listen(e,t){return this.db?this.db.collection(e).onSnapshot(a=>{const s=a.docs.map(i=>({...i.data(),id:i.id}));this.track("listen",e,s.length),t(s,a)},a=>{console.error(`Realtime listener error in ${e}:`,a)}):null}}const z=new Ya;typeof window<"u"&&(window.AppDB=z);class Va{constructor(){this.currentUser=null,this.sessionKey="crwi_session_user",this.heartbeatInterval=null,this.userDocUnsubscribe=null}async init(){await z.init();const e=localStorage.getItem(this.sessionKey);e&&(this.currentUser=await z.get("users",e),this.currentUser&&(this.startHeartbeat(),this.startCurrentUserSync()))}async refreshCurrentUserFromDB(){const e=localStorage.getItem(this.sessionKey);if(!e)return this.currentUser=null,null;if(this.userDocUnsubscribe&&this.currentUser&&this.currentUser.id===e)return this.currentUser;const t=await z.get("users",e);return this.currentUser=t||null,this.currentUser}async login(e,t){const a=z.getCached?await z.getCached(z.getCacheKey("authUsers","users",{mode:"login"}),x?.READ_CACHE_TTLS?.users||6e4,()=>z.getAll("users")):await z.getAll("users"),s=e.trim().toLowerCase(),i=t.trim(),o=a.find(r=>{const d=(r.username||"").toLowerCase().trim(),l=(r.email||"").toLowerCase().trim();return(d===s||l===s)&&r.password.trim()===i});return o?(this.currentUser=o,localStorage.setItem(this.sessionKey,o.id),this.startHeartbeat(),this.startCurrentUserSync(),!0):(console.warn("Login failed: invalid credentials."),!1)}logout(){this.stopHeartbeat(),this.stopCurrentUserSync(),this.currentUser=null,localStorage.removeItem(this.sessionKey),window.location.reload()}getUser(){return this.currentUser}async updateUser(e){const t=await z.get("users",e.id);if(!t)return!1;const a={...t,...e};return e.isAdmin===!0||e.isAdmin==="true"?a.isAdmin=!0:a.isAdmin=!1,a.role=e.role||t.role||"Employee",console.log(`Auth: User ${a.id} update - Role: ${a.role}, Admin: ${a.isAdmin}`),e.name&&e.name!==t.name&&!e.avatar&&(a.avatar=`https://ui-avatars.com/api/?name=${e.name}&background=random&color=fff`),await z.put("users",a),this.currentUser&&this.currentUser.id===a.id&&(this.currentUser=a),!0}startHeartbeat(){if(!(x&&x.READ_OPT_FLAGS||{}).ENABLE_PRESENCE_HEARTBEAT){this.stopHeartbeat();return}this.heartbeatInterval&&clearInterval(this.heartbeatInterval);const t=async()=>{if(this.currentUser&&z)try{await z.put("users",{id:this.currentUser.id,lastSeen:Date.now()})}catch(a){console.warn("Heartbeat update failed:",a)}};t(),this.heartbeatInterval=setInterval(t,12e4),console.log("Presence Heartbeat started.")}stopHeartbeat(){this.heartbeatInterval&&(clearInterval(this.heartbeatInterval),this.heartbeatInterval=null,console.log("Presence Heartbeat stopped."))}startCurrentUserSync(){this.stopCurrentUserSync();const e=localStorage.getItem(this.sessionKey);if(!(!e||!window.AppFirestore))try{this.userDocUnsubscribe=window.AppFirestore.collection("users").doc(String(e)).onSnapshot(t=>{if(!t.exists){this.currentUser=null;return}const a={...t.data(),id:t.id};this.currentUser=a,window.dispatchEvent(new CustomEvent("app:user-sync",{detail:a}))},t=>{console.warn("Current user realtime sync failed:",t)})}catch(t){console.warn("Failed to start current user sync:",t)}}stopCurrentUserSync(){typeof this.userDocUnsubscribe=="function"&&this.userDocUnsubscribe(),this.userDocUnsubscribe=null}}const Q=new Va;typeof window<"u"&&(window.AppAuth=Q);class Ka{async getStatus(){const e=await(Q.refreshCurrentUserFromDB?Q.refreshCurrentUserFromDB():Q.getUser());if(!e)return{status:"out",lastCheckIn:null};if(e.status==="in"&&e.lastCheckIn)try{const t=new Date(e.lastCheckIn),a=new Date,s=t.toISOString().split("T")[0],i=a.toISOString().split("T")[0];if(s<i)return{status:"out",lastCheckIn:null,staleSession:!0}}catch(t){console.warn("Date parsing error in getStatus:",t)}return{status:e.status||"out",lastCheckIn:e.lastCheckIn}}async checkIn(e,t,a="Unknown Location"){const s=await(Q.refreshCurrentUserFromDB?Q.refreshCurrentUserFromDB():Q.getUser());if(!s)throw new Error("User not authenticated");let i=!1,o="",r=null,d=null;if(s.status==="in"&&s.lastCheckIn){const c=new Date(s.lastCheckIn),f=new Date,u=`${c.getFullYear()}-${String(c.getMonth()+1).padStart(2,"0")}-${String(c.getDate()).padStart(2,"0")}`,p=`${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,"0")}-${String(f.getDate()).padStart(2,"0")}`;if(u<p){const h=new Date(c.getTime()+144e5),y={status:"Half Day",dayCredit:this.getDayCredit("Half Day"),lateCountable:!1},w=s.currentLocation||s.lastLocation||null,b=new Date().toISOString(),v={id:String(Date.now()),user_id:s.id,date:h.toISOString().split("T")[0],checkIn:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:h.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),duration:this.msToTime(144e5),durationMs:144e5,type:y.status,dayCredit:y.dayCredit,lateCountable:y.lateCountable,extraWorkedMs:0,policyVersion:"v2",location:w?.address||"Missed checkout session",lat:w?.lat??null,lng:w?.lng??null,checkOutLocation:"System closure on next check-in",outLat:null,outLng:null,workDescription:"System closure: missed checkout auto-closed as half day. Reason required on next login.",locationMismatched:!1,locationExplanation:"",activityScore:0,autoCheckout:!0,autoCheckoutReason:"missed_checkout_next_login",autoCheckoutAt:b,autoCheckoutRequiresApproval:!1,autoCheckoutExtraApproved:null,missedCheckoutResolved:!0,missedCheckoutPolicy:"half_day_on_missed_checkout",missedCheckoutReasonRequired:!0,missedCheckoutReasonStatus:"pending",missedCheckoutReason:"",missedCheckoutReasonSubmittedAt:null,missedCheckoutReviewedBy:"",missedCheckoutReviewedAt:"",missedCheckoutReviewNote:"",systemClosedAt:b,synced:!1};await z.add("attendance",v),r=v.id,d=v.date,s.status="out",s.lastCheckOut=h.getTime(),s.lastLocation=w,s.lastCheckOutLocation={lat:null,lng:null,address:"System closure on next check-in"},s.locationMismatched=!1,s.lastCheckIn=null,s.currentLocation=null,i=!0,o="Previous open session was closed as half day because checkout was missed. Please submit a reason for admin verification."}else return{ok:!1,conflict:!0,message:"Status updated from another device."}}s.status="in",s.lastCheckIn=Date.now();const l=a&&a!=="Unknown Location"?a:e&&t?`Lat: ${Number(e).toFixed(4)}, Lng: ${Number(t).toFixed(4)}`:"Unknown Location";return s.currentLocation={lat:e,lng:t,address:l},await z.put("users",s),{ok:!0,resolvedMissedCheckout:i,noticeMessage:o,missedCheckoutReasonRequired:i,missedCheckoutLogId:r,missedCheckoutDate:d}}async checkOut(e="",t=null,a=null,s="Detected Location",i=!1,o="",r={}){const d=await(Q.refreshCurrentUserFromDB?Q.refreshCurrentUserFromDB():Q.getUser());if(!d||d.status!=="in")return{ok:!1,conflict:!0,message:"Status updated from another device."};const l=new Date(d.lastCheckIn),c=r.checkOutTime?new Date(r.checkOutTime):new Date,f=c-l,u=this.evaluateAttendanceStatus(l,f),p=window.AppActivity?window.AppActivity.getStats():{score:0},m={id:String(Date.now()),user_id:d.id,date:c.toISOString().split("T")[0],checkIn:l.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),duration:this.msToTime(f),durationMs:f,type:u.status,dayCredit:u.dayCredit,lateCountable:u.lateCountable,extraWorkedMs:u.extraWorkedMs||0,policyVersion:"v2",location:d.currentLocation?.address||"Checked In Location",lat:d.currentLocation?.lat,lng:d.currentLocation?.lng,checkOutLocation:s||(t&&a?`Lat: ${Number(t).toFixed(4)}, Lng: ${Number(a).toFixed(4)}`:"Detected Location"),outLat:t,outLng:a,workDescription:e||"",locationMismatched:i,locationExplanation:o||"",activityScore:p.score,autoCheckout:!!r.autoCheckout,autoCheckoutReason:r.autoCheckoutReason||"",autoCheckoutAt:r.autoCheckoutAt||null,autoCheckoutRequiresApproval:!!r.autoCheckoutRequiresApproval,autoCheckoutExtraApproved:r.autoCheckoutExtraApproved??null,overtimePrompted:!!r.overtimePrompted,overtimeReasonTag:r.overtimeReasonTag||"",overtimeExplanation:r.overtimeExplanation||"",overtimeCappedToEightHours:!!r.overtimeCappedToEightHours,taskUpdates:Array.isArray(r.taskUpdates)?r.taskUpdates:[],entrySource:"checkin_checkout",attendanceEligible:!0,synced:!1};return await z.add("attendance",m),d.status="out",d.lastCheckOut=Date.now(),d.lastLocation=d.currentLocation,d.lastCheckOutLocation={lat:t,lng:a,address:s},d.locationMismatched=i,d.lastCheckIn=null,d.currentLocation=null,await z.put("users",d),window.AppActivity&&window.AppActivity.stop(),{ok:!0,conflict:!1}}async addAdminLog(e,t){const a={id:String(Date.now()),user_id:e,...t,isManualOverride:t.isManualOverride===!0,entrySource:t.entrySource||"admin_override",attendanceEligible:Object.prototype.hasOwnProperty.call(t,"attendanceEligible")?t.attendanceEligible===!0:!0,synced:!1};return await z.add("attendance",a),a}async deleteLog(e){if(e)return await z.delete("attendance",e),!0}async updateLog(e,t){if(!e)return;const a=await z.get("attendance",e);if(!a)throw new Error("Log not found");const s={...a,...t,isManualOverride:Object.prototype.hasOwnProperty.call(t,"isManualOverride")?t.isManualOverride===!0:!!a.isManualOverride,entrySource:t.entrySource||a.entrySource||"admin_override",attendanceEligible:Object.prototype.hasOwnProperty.call(t,"attendanceEligible")?t.attendanceEligible===!0:Object.prototype.hasOwnProperty.call(a,"attendanceEligible")?a.attendanceEligible===!0:!0,id:e};return await z.put("attendance",s),s}async addManualLog(e){const t=Q.getUser();if(!t)return;const a=this.buildDateTime(e.date,e.checkIn),s=this.buildDateTime(e.date,e.checkOut),i=a&&s?s-a:0,o=this.evaluateAttendanceStatus(a||new Date,i),r=String(e.type||"").trim(),d=!r||r==="Manual"?o.status:r,l=Object.prototype.hasOwnProperty.call(e,"attendanceEligible")?e.attendanceEligible===!0:d!=="Work Log",c=l?d:r||"Work Log",f={id:String(Date.now()),user_id:t.id,...e,type:c,durationMs:typeof e.durationMs=="number"?e.durationMs:i,dayCredit:l?typeof e.dayCredit=="number"?e.dayCredit:o.dayCredit:0,lateCountable:l&&(e.lateCountable===!0||c==="Late"),extraWorkedMs:l?typeof e.extraWorkedMs=="number"?e.extraWorkedMs:o.extraWorkedMs||0:0,entrySource:e.entrySource||"staff_manual_work",attendanceEligible:l,synced:!1};return await z.add("attendance",f),f}async getLogs(e=null){const t=e||Q.getUser()?.id;if(!t)return[];try{const a=window.AppFirestore;if(!a)return[];let s=a.collection("attendance");s=s.where("user_id","==",t);const r=(await s.get()).docs.map(c=>({...c.data(),id:c.id})).sort((c,f)=>f.id-c.id).map(c=>((!c.location||c.location==="Unknown Location")&&c.lat&&c.lng&&(c.location=`Lat: ${Number(c.lat).toFixed(4)}, Lng: ${Number(c.lng).toFixed(4)}`),c)),d=new Set,l=r.filter(c=>{const f=`${c.date}|${c.checkIn}`;return d.has(f)?!1:(d.add(f),!0)});try{const c=await z.get("users",t);if(c&&c.status==="in"&&c.lastCheckIn){const f=new Date(c.lastCheckIn),u={id:"active_now",date:f.toLocaleDateString(),checkIn:f.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:"Active Now",duration:"Working...",type:"Office",location:c.currentLocation?.address&&c.currentLocation.address!=="Unknown Location"?c.currentLocation.address:c.currentLocation?.lat&&c.currentLocation?.lng?`Lat: ${Number(c.currentLocation.lat).toFixed(4)}, Lng: ${Number(c.currentLocation.lng).toFixed(4)}`:"Current Session"};l.unshift(u)}}catch(c){console.warn("Could not fetch active status for logs",c)}return l.slice(0,50)}catch(a){return console.warn("Optimized log fetch failed, falling back to simple filter",a),[]}}async getAllLogs(){return await z.getAll("attendance")}msToTime(e){let t=Math.floor(e/6e4%60);return`${Math.floor(e/(1e3*60*60)%24)}h ${t}m`}buildDateTime(e,t){if(!e||!t)return null;const a=`${e}T${t}:00`,s=new Date(a);return Number.isNaN(s.getTime())?null:s}normalizeType(e){const t=String(e||"").trim();return!t||t==="Manual"?"Present":t==="Manual/WFH"?"Work - Home":t}getDayCredit(e){const t=this.normalizeType(e);return t==="Half Day"?.5:t==="Absent"?0:t==="Present"||t==="Present (Late Waived)"||t==="Late"||t==="Work - Home"||t==="On Duty"?1:0}evaluateAttendanceStatus(e,t=0){if(!e||Number.isNaN(e.getTime()))return{status:"Absent",dayCredit:0,lateCountable:!1,extraWorkedMs:0};if(e.getDay()===0)return{status:"Present",dayCredit:1,lateCountable:!1,extraWorkedMs:0};const s=e.getHours()*60+e.getMinutes(),i=Math.max(0,t)/(1e3*60*60),o=(typeof x<"u"&&x?x.LATE_CUTOFF_MINUTES:555)||555,r=(typeof x<"u"&&x?x.MINOR_LATE_END_MINUTES:615)||615,d=(typeof x<"u"&&x?x.LATE_END_MINUTES:720)||720,l=(typeof x<"u"&&x?x.POST_NOON_END_MINUTES:810)||810,c=(typeof x<"u"&&x?x.AFTERNOON_START_MINUTES:720)||720;let f="Present",u=!1,p=0;return s>=c?(i>=8?f="Present":i>=4?f="Half Day":f="Absent",i>4&&(p=Math.max(0,t-14400*1e3)),{status:f,dayCredit:this.getDayCredit(f),lateCountable:!1,extraWorkedMs:p}):(s>l?f="Absent":s>d||s>r?f=i>=4?"Half Day":"Absent":s>o?i>=8?f="Present (Late Waived)":(f="Late",u=!0):i>=8?f="Present":i>=4?f="Half Day":f="Absent",{status:f,dayCredit:this.getDayCredit(f),lateCountable:u,extraWorkedMs:p})}calculateStatus(e){return this.evaluateAttendanceStatus(e,480*60*1e3).status}}const ia=new Ka;typeof window<"u"&&(window.AppAttendance=ia);function $(n){return n==null?"":String(n).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function st(n){return $(n)}function Ga(n){return String(n??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,"\\n").replace(/\r/g,"\\r")}function Fe(n,e="https://via.placeholder.com/24"){return!n||typeof n!="string"?e:n.startsWith("http")||n.startsWith("data:")||n.startsWith("/")||n.startsWith("./")?n:e}function ct(n){if(!n)return"Never";const e=new Date(n);if(isNaN(e.getTime()))return"Unknown";const t=Math.floor((new Date-e)/1e3);if(t<60)return"just now";let a=t/31536e3;return a>1?Math.floor(a)+" years ago":(a=t/2592e3,a>1?Math.floor(a)+" months ago":(a=t/86400,a>1?Math.floor(a)+" days ago":(a=t/3600,a>1?Math.floor(a)+" hours ago":(a=t/60,a>1?Math.floor(a)+" mins ago":Math.floor(t)+" seconds ago"))))}typeof window<"u"&&(window.safeHtml=$,window.safeAttr=st,window.safeJsStr=Ga,window.safeUrl=Fe,window.timeAgo=ct);function Xa(n,e=!0){const t=Math.max(0,Math.min(5,Number(n)||0)),a=Math.floor(t),s=t-a>=.5,i=5-a-(s?1:0);let o='<div class="star-rating-display">';for(let r=0;r<a;r++)o+='<i class="fa-solid fa-star star-filled"></i>';s&&(o+='<i class="fa-solid fa-star-half-stroke star-filled"></i>');for(let r=0;r<i;r++)o+='<i class="fa-regular fa-star star-empty"></i>';return e&&(o+=`<span class="star-rating-number">${t.toFixed(1)}</span>`),o+="</div>",o}function oa(n,e=!0){const t=String(n||"to-be-started").toLowerCase();let a="To Be Started",s="fa-circle-dot",i="status-badge-to-be-started";return t==="in-process"||t==="in-progress"?(a="In Progress",s="fa-spinner fa-spin",i="status-badge-in-process"):t==="completed"?(a="Completed",s="fa-circle-check",i="status-badge-completed"):t==="overdue"?(a="Overdue",s="fa-circle-exclamation",i="status-badge-overdue"):(t==="not-completed"||t==="cancelled")&&(a="Not Completed",s="fa-circle-xmark",i="status-badge-not-completed"),`
        <div class="status-badge ${i}">
            ${e?`<i class="fa-solid ${s}"></i>`:""}
            <span>${a}</span>
        </div>
    `}const Nt=n=>{const e=new Date,t=window.AppAuth?.getUser();window.app_calMonth===void 0&&(window.app_calMonth=e.getMonth()),window.app_calYear===void 0&&(window.app_calYear=e.getFullYear());const a=window.app_calYear,s=window.app_calMonth,i=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],o=new Date(a,s,1).getDay(),r=new Date(a,s+1,0).getDate();let d="";for(let l=0;l<o;l++)d+='<div class="cal-day empty"></div>';for(let l=1;l<=r;l++){const c=`${a}-${String(s+1).padStart(2,"0")}-${String(l).padStart(2,"0")}`,f=typeof window.app_getDayEvents=="function"?window.app_getDayEvents(c,n):[],u=f.some(w=>w.type==="leave"),p=f.some(w=>w.type==="event"),m=f.some(w=>w.type==="work"),h=l===e.getDate()&&s===e.getMonth()&&a===e.getFullYear(),y=window.AppAnalytics?window.AppAnalytics.getDayType(new Date(a,s,l)):"Work Day";d+=`
            <div class="cal-day ${h?"today":""} ${u?"has-leave":""} ${p?"has-event":""} ${m?"has-work":""} ${y==="Holiday"?"is-holiday":""} ${y==="Half Day"?"is-half-day":""}" 
                    onclick="window.app_openDayPlan('${c}')" style="cursor:pointer;" title="${y}">
                ${l}
            </div>
        `}return window._currentPlans=n,`
        <div class="card" style="padding: 0.75rem; display:flex; flex-direction:column;">
            <div style="margin-bottom:0.75rem; border-bottom:1px solid #f3f4f6; padding-bottom:0.4rem;">
                    <h4 style="margin:0; color:#1f2937; font-size: 1rem;">Team Schedule</h4>
                    <span style="font-size:0.7rem; color:#6b7280;">Planned Leaves & Events</span>
            </div>

            <div style="margin-bottom:0.6rem; padding-bottom:0.4rem; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:0.4rem;">
                    <button onclick="window.app_changeCalMonth(-1)" style="background:none; border:none; color:#6b7280; cursor:pointer; padding:2px;"><i class="fa-solid fa-chevron-left"></i></button>
                    <div style="text-align:center; min-width:70px;">
                        <h4 style="margin:0; color:#1f2937; font-size:0.9rem;">${i[s]} ${a}</h4>
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
    `},Ie={controllers:new WeakMap,elements:new Set};function qe(){return window.app_staffActivityState||(window.app_staffActivityState={selectedMonth:new Date().toISOString().slice(0,7),sortKey:"date-desc",logs:[],leaveHistoryDate:new Date().toISOString().slice(0,10)}),window.app_staffActivityState.leaveHistoryDate||(window.app_staffActivityState.leaveHistoryDate=new Date().toISOString().slice(0,10)),window.app_staffActivityState}function ra(n){const e=n?new Date(`${n}T00:00:00`):new Date;if(Number.isNaN(e.getTime()))return ra(new Date().toISOString().slice(0,10));const t=e.getDay(),a=t===0?-6:1-t,s=new Date(e);s.setDate(e.getDate()+a),s.setHours(0,0,0,0);const i=new Date(s);i.setDate(s.getDate()+6),i.setHours(23,59,59,999);const o=r=>{const d=r.getFullYear(),l=String(r.getMonth()+1).padStart(2,"0"),c=String(r.getDate()).padStart(2,"0");return`${d}-${l}-${c}`};return{start:s,end:i,startKey:o(s),endKey:o(i),label:`${s.toLocaleDateString("en-US",{month:"short",day:"numeric"})} - ${i.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`}}let zt=!1;function Ja(){zt||typeof document>"u"||(zt=!0,document.addEventListener("click",async n=>{const e=n.target&&n.target.closest?n.target.closest(".dashboard-leave-btn[data-action][data-leave-id]"):null;if(!e)return;n.preventDefault();const t=String(e.dataset.action||""),a=String(e.dataset.leaveId||"");if(a)try{if(t==="export"){window.AppLeaves?.exportLeave&&await window.AppLeaves.exportLeave(a);return}if(t==="comment"){window.AppLeaves?.commentLeave&&await window.AppLeaves.commentLeave(a);return}if(t==="approve"||t==="reject"){const s=t==="approve"?"Approved":"Rejected",i=window.AppAuth?.getUser?.()?.id;if(window.AppLeaves?.updateLeaveStatus&&await window.AppLeaves.updateLeaveStatus(a,s,i),typeof window.app_refreshCurrentPage=="function")await window.app_refreshCurrentPage();else{const o=document.getElementById("page-content");o&&(o.innerHTML=await ft())}}}catch(s){console.error("Dashboard leave action failed:",s)}}))}function ye(n,e={}){const t=n?.state||(n?.user?"winner":"no_eligible_data");if(!n||t!=="winner"){const h=n?.reason||(t==="fetch_error"?"Hero stats are temporarily unavailable.":"No eligible hero data available."),y=t==="fetch_error"?"Fetch Error":"No Eligible Data";return`
            <div class="card dashboard-hero-stats-card hero-slot">
                <div class="dashboard-hero-stats-head">
                    <div class="hero-label-badge">Hero of the Week</div>
                    ${e.generatedAt?`<span class="hero-sync-time" title="Source: ${e.source||n?.source||"unknown"}">Synced ${ct(e.generatedAt)}</span>`:""}
                </div>
                <div class="dashboard-activity-empty">
                    ${$(h)}
                </div>
                <div class="dashboard-hero-stats-foot">
                    <span class="dashboard-kpi-tag">${y}</span>
                </div>
            </div>`}const{user:a,stats:s}=n,i=Number(s?.taskPlanned??0),o=Number(s?.taskCompleted??0),r=Number(s?.taskInProgress??0),d=Number(s?.taskMissed??0),l=Number(s?.days??0),c=Number(s?.hours??0),f=Number(s?.attendanceFactor??1),u=e.source==="generated",p=Number.isFinite(Number(n?.confidence))?Math.round(Number(n.confidence)*100):0,m=n?.period==="latest_active_window"?"Latest Active Window":"Weekly";return`
        <div class="card dashboard-hero-stats-card hero-slot ${u?"is-new-summary":""}">
            <div class="dashboard-hero-stats-head">
                <div class="hero-label-badge">Hero of the Week</div>
                ${e.generatedAt?`<span class="hero-sync-time" title="Source: ${e.source||n?.source||"unknown"}">Synced ${ct(e.generatedAt)}</span>`:""}
            </div>
            <div class="dashboard-hero-stats-body">
                <div class="hero-profile">
                    <img src="${Fe(a.avatar)}" alt="${$(a.name)}" class="hero-avatar">
                    <div class="hero-info">
                        <div class="hero-name">${$(a.name)}</div>
                        <div class="hero-role">${$(a.role||"Staff")}</div>
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
                    <span class="hero-attendance-pill">Factor <strong>x${f.toFixed(2)}</strong></span>
                </div>
            </div>
            <div class="dashboard-hero-stats-foot">
                <span class="dashboard-kpi-tag">${$(m)}</span>
                <span class="dashboard-kpi-tag">Confidence ${p}%</span>
            </div>
        </div>`}function da(n,e=[],t=null,a=[]){const s=new Date,i=new Date(s);i.setDate(i.getDate()-180);const o=i.toISOString().split("T")[0],r=s.toISOString().split("T")[0],d=t?t.id:window.AppAuth.getUser().id,l=t&&t.name||window.AppAuth.getUser().name;return`
        <div class="card dashboard-worklog-card">
            <div class="dashboard-worklog-head">
                 <h4>Work Log <span class="dashboard-worklog-staff">(${$(l)})</span></h4>
                 <span>Ongoing & Historical Tasks</span>
            </div>
             <div class="dashboard-worklog-filter-row">
                <input type="date" id="act-start" value="${o}" class="dashboard-worklog-date-input">
                <span class="dashboard-worklog-to">to</span>
                <input type="date" id="act-end" value="${r}" class="dashboard-worklog-date-input">
                <button onclick="window.app_filterActivity()" class="dashboard-worklog-go-btn">Go</button>
            </div>
            <div id="activity-list" class="dashboard-worklog-list">
                ${la(n,o,r,d,e,a)}
            </div>
        </div>
    `}function la(n,e,t,a,s=[],i=[]){const o=new Date(e),r=new Date(t);r.setHours(23,59,59,999);const d=n.filter(y=>{const w=new Date(y.date),b=y.workDescription||(y.location&&!y.location.startsWith("Lat:")?y.location:"Standard Activity");return y._displayDesc=b,y._isCollab=!1,y._sortTime=y.checkOut||"00:00",w>=o&&w<=r}),l=[];s.forEach(y=>{const w=new Date(y.date);if(w<o||w>r)return;y.plans.filter(v=>v.tags&&v.tags.some(k=>k.id===a&&k.status==="accepted")).forEach(v=>{l.push({date:y.date,workDescription:`🤝 Collaborated with ${y.userName}: ${v.task}${v.subPlans&&v.subPlans.length>0?` (Sub-tasks: ${v.subPlans.join(", ")})`:""}`,checkOut:"Planned / Accepted",_displayDesc:`🤝 Collaborated with ${y.userName}: ${v.task}${v.subPlans&&v.subPlans.length>0?` (Sub-tasks: ${v.subPlans.join(", ")})`:""}`,_isCollab:!0,_sortTime:"23:59"})})});const c=[];i.forEach(y=>{(y.actionItems||[]).forEach(w=>{if(w.assignedTo!==a)return;const b=w.dueDate||y.date,v=new Date(b);v<o||v>r||c.push({date:b,workDescription:`📋 Meeting Task: ${w.task} (from ${y.title})`,status:w.status||"pending",checkOut:"Action Item",_displayDesc:`📋 Meeting Task: ${w.task} (from ${y.title})`,_isCollab:!1,_isMinute:!0,_meetingId:y.id,_sortTime:"09:00"})})});const f=[...d,...l,...c].sort((y,w)=>{const b=new Date(w.date)-new Date(y.date);return b!==0?b:w._sortTime.localeCompare(y._sortTime)});if(f.length===0)return'<div class="dashboard-activity-empty">No activity descriptions found.</div>';let u="",p="";const m=window.AppAuth.getUser(),h=window.app_hasPerm("dashboard","admin",m);return f.forEach(y=>{y.date!==p&&(u+=`<div class="dashboard-activity-date">${y.date}</div>`,p=y.date);const b=y._isCollab?"#10b981":y._isMinute?"#6366f1":"#e5e7eb",v=y._isCollab?"dashboard-activity-item-collab":y._isMinute?"dashboard-activity-item-minute":"",k=pa(y);let g="";if(y._isCollab||y.status||y._isMinute){const A=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(y.date,y.status):y.status||"to-be-started";g=`
                <div class="dashboard-activity-status-row">
                    ${oa(A)}
                    ${h||y._isMinute?`<div class="dashboard-activity-edit-wrap"><button onclick="${y._isMinute?`window.app_openMinuteDetails('${y._meetingId}')`:`window.app_openDayPlan('${y.date}', '${a}')`}" class="dashboard-activity-edit-btn" title="View/Edit"><i class="fa-solid fa-${y._isMinute?"eye":"pen-to-square"}"></i></button></div>`:""}
                </div>`}u+=`<div class="dashboard-activity-item ${v}" style="border-left-color:${b};"><div class="dashboard-activity-desc">${$(y._displayDesc)}</div>${k}${g}<div class="dashboard-activity-meta">${$(y.checkOut||(y.status==="completed"?"Completed":"Planned Activity"))}</div></div>`}),u}function ca(n){const e=qe();e.logs=Array.isArray(n)?n:[],setTimeout(()=>{const s=document.getElementById("staff-activity-list");s&&wa(s)},0);const t=tn(8),a=yt(e.selectedMonth);return`
        <div class="card dashboard-team-activity-card">
            <div class="dashboard-team-activity-head">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <h4>Team Activity</h4>
                    <button onclick="window.app_expandTeamActivity()" title="Expand" style="background:none; border:none; cursor:pointer; color:#6b7280;"><i class="fa-solid fa-expand"></i></button>
                </div>
                <span id="staff-activity-range-label">${$(a)}</span>
            </div>
            <div class="dashboard-team-activity-filters dashboard-team-activity-filters-compact">
                <select class="dashboard-team-select" onchange="window.app_setStaffActivityMonth(this.value)">
                    ${t.map(s=>`<option value="${s.key}" ${s.key===e.selectedMonth?"selected":""}>${$(s.label)}</option>`).join("")}
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
                ${mt(e.logs,e.sortKey)}
            </div>
        </div>`}function mt(n,e){const t=an(n);if(t.length===0)return'<div class="dashboard-activity-empty">No team activities found for the selected month.</div>';const a=nn(t,e),s=a.filter(o=>o._taskStatus==="completed"),i=a.filter(o=>o._taskStatus!=="completed");return`
        <div class="dashboard-team-activity-split-grid">
            ${xt("Completed",s,"No completed tasks in this month.")}
            ${xt("In Progress / Incomplete",i,"No in-progress or incomplete tasks in this month.")}
        </div>
    `}function xt(n,e,t){const a=window.AppAuth.getUser(),s=window.app_hasPerm("dashboard","admin",a),i=e.length===0?`<div class="dashboard-activity-empty">${t}</div>`:e.map(o=>{const r=a&&o.userId===a.id,d=s||r,l=pa(o),c=`
                <div class="dashboard-activity-status-row">
                    ${oa(o._taskStatus)}
                    ${d?`<div class="dashboard-activity-edit-wrap"><button onclick="window.app_openDayPlan('${o.date}', '${o.userId||""}')" class="dashboard-activity-edit-btn" title="Edit/Reassign"><i class="fa-solid fa-pen-to-square"></i></button></div>`:""}
                </div>`;return`
                <div class="dashboard-staff-activity-item dashboard-staff-activity-item-compact">
                    <div class="dashboard-staff-name">${$(o.staffName||"Unknown Staff")}<span class="dashboard-team-activity-item-date">${o.date||""}</span></div>
                    <div class="dashboard-activity-desc dashboard-staff-activity-desc">${$(o._displayDesc||"Work Plan Task")}</div>
                    ${l}
                    ${c}
                    <div class="dashboard-activity-meta">${o._taskStatus==="completed"?"Completed":"Work Plan"}</div>
                </div>`}).join("");return`
        <div class="dashboard-team-activity-col">
            <div class="dashboard-team-activity-col-head">
                <span>${$(n)}</span>
                <span class="dashboard-team-activity-count">${e.length}</span>
            </div>
            <div class="dashboard-team-activity-col-list">${i}</div>
        </div>
    `}function pa(n){if(!n)return"";const e=Number.isFinite(Number(n.progressPercent)),t=n.progressStatus?String(n.progressStatus).replace(/_/g," "):"",a=String(n.progressNote||"").trim();if(!e&&!t&&!a&&Array.isArray(n.taskUpdates)&&n.taskUpdates.length>0){const r=n.taskUpdates[0]||{},d=Number.isFinite(Number(r.progressPercent))?`${Number(r.progressPercent)}%`:"",l=r.progressStatus?String(r.progressStatus).replace(/_/g," "):"",c=String(r.progressNote||"").trim();if(!d&&!l&&!c)return"";const f=c?` title="${$(c)}"`:"",u=`${d}${d&&l?" • ":""}${$(l)}`;return`<div class="dashboard-progress-chip"${f}>${u}</div>`}if(!e&&!t&&!a)return"";const s=e?`${Number(n.progressPercent)}%`:"",i=a?` title="${$(a)}"`:"",o=`${s}${s&&t?" • ":""}${$(t)}`;return`<div class="dashboard-progress-chip"${i}>${o}</div>`}function Me(n,e,t,a=""){const i=Number(t.penalty??t.penaltyLeaves??0)>0?'<span class="dashboard-penalty-badge">Penalty Applies</span>':"";return`
        <div class="card dashboard-stats-card" ${a?` data-stats-type="${$(a)}"`:""} role="button" tabindex="0" aria-label="Open ${$(n)} details">
            <div class="dashboard-stats-card-head">
                <div>
                    <h4 class="dashboard-stats-card-title">${$(n)}</h4>
                    <span class="dashboard-stats-card-subtitle">${$(e)}</span>
                </div>
                ${i}
            </div>

            <div class="dashboard-stats-metric-grid">
                 <div class="dashboard-stats-metric dashboard-stats-metric-late">
                    <div class="dashboard-stats-metric-value">${$(t.totalLateDuration)}</div>
                    <div class="dashboard-stats-metric-label">Late</div>
                 </div>
                 <div class="dashboard-stats-metric dashboard-stats-metric-extra">
                    <div class="dashboard-stats-metric-value">${$(t.totalExtraDuration)}</div>
                    <div class="dashboard-stats-metric-label">Extra</div>
                 </div>
            </div>

            <div class="dashboard-breakdown-grid">
                ${ua(t.breakdown)}
            </div>
        </div>
    `}function ua(n){const e=Object.entries(n),t={Present:{color:"#166534",bg:"#f0fdf4",label:"Office"},"Work - Home":{color:"#0369a1",bg:"#e0f2fe",label:"WFH"},Training:{color:"#4338ca",bg:"#eef2ff",label:"Training"},Late:{color:"#c2410c",bg:"#fff7ed",label:"Late"},"Sick Leave":{color:"#991b1b",bg:"#fef2f2",label:"Sick"},"Casual Leave":{color:"#9d174d",bg:"#fce7f3",label:"Casual"},"Earned Leave":{color:"#be185d",bg:"#fdf2f8",label:"Earned"},"Paid Leave":{color:"#be123c",bg:"#ffe4e6",label:"Paid"},"Maternity Leave":{color:"#a21caf",bg:"#fae8ff",label:"Maternity"},Absent:{color:"#7f1d1d",bg:"#fee2e2",label:"Absent"},"Early Departure":{color:"#991b1b",bg:"#fff1f2",label:"Early Exit"},Holiday:{color:"#1e293b",bg:"#f1f5f9",label:"Holiday"},"National Holiday":{color:"#334155",bg:"#f8fafc",label:"Nat. Hol"},"Regional Holidays":{color:"#475569",bg:"#f8fafc",label:"Reg. Hol"}};return e.map(([a,s])=>{const i=t[a]||{color:"#374151",bg:"#f3f4f6",label:a};return s===0&&!["Present","Late","Absent","Early Departure"].includes(a)?"":`
            <div class="dashboard-breakdown-item" style="background:${i.bg};">
                <span class="dashboard-breakdown-count" style="color:${i.color}">${s}</span>
                <span class="dashboard-breakdown-label" style="color:${i.color};">${i.label}</span>
            </div>
         `}).join("")}function Za(){document.querySelectorAll(".dashboard-stats-card[data-stats-type]").forEach(n=>{if(n.dataset.bound==="1")return;n.dataset.bound="1";const e=n.getAttribute("data-stats-type")||"";n.addEventListener("click",()=>{window.app_openStatsDetailModal&&window.app_openStatsDetailModal(e)}),n.addEventListener("keydown",t=>{(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),window.app_openStatsDetailModal&&window.app_openStatsDetailModal(e))})})}function jt(n){const e=String(n||"").trim();if(!e||e.toLowerCase().includes("active"))return null;const t=e.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);if(!t)return null;let a=Number(t[1]);const s=Number(t[2]),i=t[3]?t[3].toUpperCase():"";return i==="PM"&&a<12&&(a+=12),i==="AM"&&a===12&&(a=0),a*60+s}function Qa(n,e){const t={late:new Set,early:new Set,extra:new Set,breakdown:{Present:new Set,"Work - Home":new Set,Training:new Set,"Sick Leave":new Set,"Casual Leave":new Set,"Earned Leave":new Set,"Paid Leave":new Set,"Maternity Leave":new Set,Absent:new Set,Holiday:new Set,"National Holiday":new Set,"Regional Holidays":new Set,Late:new Set,"Early Departure":new Set}},a=e?.start?new Date(e.start):new Date("1970-01-01"),s=e?.end?new Date(e.end):new Date;a.setHours(0,0,0,0),s.setHours(23,59,59,999);let i=Array.isArray(n)?n:[];if(window.AppAnalytics&&window.AppAnalytics.pickBestAttendanceLogPerDay)try{i=window.AppAnalytics.pickBestAttendanceLogPerDay(i,a,s)}catch(l){console.warn("pickBestAttendanceLogPerDay failed",l)}else{const l=new Map;i.forEach(c=>{const f=c.date||"";f&&(l.has(f)||l.set(f,c))}),i=Array.from(l.values())}const o=(typeof x<"u"&&x?x.LATE_CUTOFF_MINUTES:555)||555,r=(typeof x<"u"&&x?x.EARLY_DEPARTURE_MINUTES:1020)||1020;i.forEach(l=>{const c=l.date?new Date(l.date):null;if(!c||Number.isNaN(c.getTime())||c<a||c>s)return;const f=l.date,u=String(l.type||""),p=jt(l.checkIn),m=jt(l.checkOut),h=l.isManualOverride===!0;(l.lateCountable===!0||!Object.prototype.hasOwnProperty.call(l,"lateCountable")&&p!==null&&p>o)&&(t.late.add(f),t.breakdown.Late.add(f)),h?u==="Early Departure"&&(t.early.add(f),t.breakdown["Early Departure"].add(f)):m!==null&&m<r&&!String(u).includes("Leave")&&u!=="Absent"&&(t.early.add(f),t.breakdown["Early Departure"].add(f));const w=typeof l.extraWorkedMs=="number"?Math.max(0,Math.round(l.extraWorkedMs/(1e3*60))):0,b=!(l.autoCheckout&&!l.autoCheckoutExtraApproved);(w>0||b&&(p!==null&&p<o||m!==null&&m>r))&&t.extra.add(f),u==="Work - Home"?t.breakdown["Work - Home"].add(f):u==="Training"?t.breakdown.Training.add(f):u==="Sick Leave"?t.breakdown["Sick Leave"].add(f):u==="Casual Leave"?t.breakdown["Casual Leave"].add(f):u==="Earned Leave"?t.breakdown["Earned Leave"].add(f):u==="Paid Leave"?t.breakdown["Paid Leave"].add(f):u==="Maternity Leave"?t.breakdown["Maternity Leave"].add(f):u==="Absent"?t.breakdown.Absent.add(f):u==="National Holiday"?t.breakdown["National Holiday"].add(f):u==="Regional Holidays"?t.breakdown["Regional Holidays"].add(f):String(u).includes("Holiday")?t.breakdown.Holiday.add(f):l.checkIn&&t.breakdown.Present.add(f)});const d=l=>Array.from(l||[]).sort((c,f)=>new Date(c)-new Date(f));return{late:d(t.late),early:d(t.early),extra:d(t.extra),breakdown:Object.fromEntries(Object.entries(t.breakdown).map(([l,c])=>[l,d(c)]))}}function ma(n){return!n||n.length===0?`
            <div class="card dashboard-leave-requests-card">
                <div class="dashboard-leave-requests-head"><h4>Pending Leaves</h4><span>Review requirements</span></div>
                <div class="dashboard-leave-requests-list">
                    <div class="dashboard-activity-empty">No pending leave requests.</div>
                </div>
            </div>`:`
        <div class="card dashboard-leave-requests-card">
            <div class="dashboard-leave-requests-head"><h4>Pending Leaves</h4><span>Review requirements</span></div>
            <div class="dashboard-leave-requests-list">
                ${n.slice(0,5).map(e=>`
                    <div class="dashboard-leave-row">
                        <div class="dashboard-leave-info">
                            <div class="dashboard-leave-name">${$(e.userName||"Staff")}</div>
                            <div class="dashboard-leave-type">${$(e.type)} • ${e.daysCount} days</div>
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
            ${n.length>5?`<div class="dashboard-leave-footer"><button onclick="window.location.hash = 'leaves'">View all ${n.length} requests</button></div>`:""}
        </div>`}function fa(n,e={}){const t=e.title||"Leave History",a=e.subtitle||"Past records",s=e.selectedDate||new Date().toISOString().slice(0,10);if(!n||n.length===0)return`
            <div class="card dashboard-leave-history-card">
                <div class="dashboard-leave-history-head">
                    <div>
                        <h4>${$(t)}</h4>
                        <span>${$(a)}</span>
                    </div>
                    <input type="date" class="dashboard-team-select" value="${$(s)}" onchange="window.app_setDashboardLeaveHistoryDate(this.value)">
                </div>
                <div class="dashboard-activity-empty">No leave history found.</div>
            </div>`;const i=o=>o==="Approved"?"#166534":o==="Rejected"?"#b91c1c":"#854d0e";return`
        <div class="card dashboard-leave-history-card">
            <div class="dashboard-leave-history-head">
                <div>
                    <h4>${$(t)}</h4>
                    <span>${$(a)}</span>
                </div>
                <input type="date" class="dashboard-team-select" value="${$(s)}" onchange="window.app_setDashboardLeaveHistoryDate(this.value)">
            </div>
            <div class="dashboard-leave-history-list">
                ${n.map(o=>`
                    <div class="dashboard-leave-history-row">
                        <div class="dashboard-leave-history-main">
                            <div class="dashboard-leave-history-user">${$(o.userName||"Staff")}</div>
                            <div class="dashboard-leave-history-type">${$(o.type)} • ${o.daysCount} days</div>
                            <div class="dashboard-leave-history-date">${o.startDate} to ${o.endDate}</div>
                        </div>
                        <div class="dashboard-leave-history-status">
                            <span class="status-pill" style="background: ${i(o.status)}15; color: ${i(o.status)}">${$(o.status)}</span>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>`}function ya(n,e){return""}function ha(n){const e=(n||[]).filter(t=>!(t.type==="tag"||t.type==="task"||t.type==="mention")||t.dismissedAt||t.read?!1:String(t.status||"pending").toLowerCase()==="pending");return e.length===0?"":`
        <div class="card full-width dashboard-tagged-card">
            <div class="dashboard-tagged-head"><h4>Tagged Items</h4><span>Pending approvals</span></div>
            <div class="dashboard-tagged-list">
                ${e.map(t=>`
                    <div class="dashboard-tagged-item">
                        <div class="dashboard-tagged-main">
                            <div class="dashboard-tagged-title">${$(t.title||"Tagged item")}</div>
                            <div class="dashboard-tagged-desc">${$(t.description||t.message||"")}</div>
                            <div class="dashboard-tagged-meta">Tagged by ${$(t.taggedByName||"Staff")} • ${ct(t.taggedAt||t.date)}</div>
                        </div>
                        <div class="dashboard-tagged-status">
                            <span class="dashboard-tagged-pill ${t.status||"pending"}">${(t.status||"pending").toUpperCase()}</span>
                            ${t.status==="pending"?`
                                <div class="dashboard-tagged-actions">
                                    ${t.planId?`
                                        <button class="dashboard-tagged-btn accept" onclick="window.app_handleTagResponse('${t.planId}', ${t.taskIndex}, 'accepted', ${n.indexOf(t)})">Approve</button>
                                        <button class="dashboard-tagged-btn reject" onclick="window.app_handleTagResponse('${t.planId}', ${t.taskIndex}, 'rejected', ${n.indexOf(t)})">Reject</button>
                                    `:`
                                        <button class="dashboard-tagged-btn accept" onclick="window.app_handleTagDecision('${t.id}', 'accepted')">Approve</button>
                                        <button class="dashboard-tagged-btn reject" onclick="window.app_handleTagDecision('${t.id}', 'rejected')">Reject</button>
                                    `}
                                </div>
                            `:""}
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `}function en(n,e,t){if(!n||n.length===0)return`
            <div class="card dashboard-staff-directory-card">
                <div class="dashboard-staff-directory-head"><h4>Staff Directory</h4><span>Quick actions</span></div>
                <div class="dashboard-staff-directory-list">
                    <div class="dashboard-activity-empty">No staff loaded.</div>
                </div>
            </div>`;const a=Date.now(),s=o=>{const r=(o.notifications||[]).map(d=>new Date(d.taggedAt||d.date||d.respondedAt||0).getTime()).filter(Boolean);return r.length?Math.max(...r):0};return`
        <div class="card dashboard-staff-directory-card">
            <div class="dashboard-staff-directory-head"><h4>Staff Directory</h4><span>Message or assign</span></div>
            <div class="dashboard-staff-directory-list">
                ${n.filter(o=>o.id!==t.id).sort((o,r)=>s(r)-s(o)||o.name.localeCompare(r.name)).map(o=>{const r=s(o);return`
                <div class="dashboard-staff-row ${r&&a-r<12e4?"dashboard-staff-row-new":""}">
                    <div class="dashboard-staff-meta">
                        <div class="dashboard-staff-avatar">
                            <img src="${Fe(o.avatar)}" alt="${$(o.name)}">
                        </div>
                        <div class="dashboard-staff-text">
                            <div class="dashboard-staff-name">${$(o.name)}</div>
                            <div class="dashboard-staff-role">${$(o.role||"Staff")}</div>
                        </div>
                    </div>
                    <div class="dashboard-staff-actions">
                        <button class="dashboard-staff-btn" onclick="window.location.hash = 'staff-directory'; window.app_openStaffThread('${o.id}')" title="Message"><i class="fa-solid fa-message"></i></button>
                    </div>
                </div>
            `}).join("")}
            </div>
        </div>`}async function ft(){const n=window.AppAuth.getUser(),e=window.app_hasPerm("dashboard","view",n),t=window.app_hasPerm("dashboard","admin",n),a=qe(),s=a.selectedMonth,i=a.leaveHistoryDate||new Date().toISOString().slice(0,10),o=window.AppDB?.getISTDateKeys?window.AppDB.getISTDateKeys():{todayKey:new Date().toISOString().split("T")[0],yesterdayKey:new Date(Date.now()-1440*60*1e3).toISOString().split("T")[0]},r=o.todayKey,d=o.yesterdayKey,l=!!x?.READ_OPT_FLAGS?.FF_SHARED_DAILY_SUMMARY,c=`hero_stats_${r}`,f=1440*60*1e3,u=e&&window.app_selectedSummaryStaffId?window.app_selectedSummaryStaffId:n.id;console.time("DashboardFetch");const p=async()=>{try{return await window.AppDB.getOrGenerateSummary(c,async()=>{const W=await window.AppAnalytics.getHeroOfTheWeek({source:"direct_cache"});if(!W||W.state==="fetch_error")throw new Error("direct hero unavailable");return W},f)}catch(W){return console.warn("Direct hero cache read failed:",W),null}},m=l?Promise.resolve(null):p(),h=l?Promise.resolve([]):window.AppDB.getOrGenerateSummary(`team_activity_${s}_${r}`,()=>window.AppAnalytics.getAllStaffActivities({mode:"month",month:s,scope:"work"})),y=l&&window.AppDB.getOrCreateDailySummary?window.AppDB.getOrCreateDailySummary({dateKey:r,yesterdayKey:d,staleAfterMs:x?.SUMMARY_POLICY?.STALENESS_MS,lockTtlMs:x?.SUMMARY_POLICY?.LOCK_TTL_MS,generatorFn:()=>window.AppAnalytics.buildDailyDashboardSummary({dateKey:r,selectedMonth:s})}).catch(W=>(console.warn("Daily summary fetch/generation failed:",W),null)):null,w=y?Promise.race([y,new Promise(W=>setTimeout(()=>W(null),1500))]):Promise.resolve(null);if(!window._dashboardRefreshScheduled){window._dashboardRefreshScheduled=!0;try{const W=window.AppDB.getIstNow(),se=new Date(W);se.setDate(se.getDate()+1),se.setHours(0,0,5,0);const ge=se.getTime()-W.getTime();setTimeout(()=>{ft().then(re=>{const ie=document.getElementById("page-content");ie&&(ie.innerHTML=re)}),window._dashboardRefreshScheduled=!1},Math.max(0,ge))}catch(W){console.warn("failed to schedule dashboard refresh",W)}}const[b,v,k,g,A,S,_,L,I,O,E,D,M]=await Promise.all([window.AppAttendance.getStatus(),window.AppAttendance.getLogs(u),window.AppAnalytics.getUserMonthlyStats(u),window.AppAnalytics.getUserYearlyStats(u),m,window.AppCalendar?window.AppCalendar.getPlans():{leaves:[],events:[]},h,window.app_hasPerm("leaves","view")?window.AppLeaves.getPendingLeaves():Promise.resolve([]),window.AppDB.getCached?window.AppDB.getCached(window.AppDB.getCacheKey("dashboardUsers","users",{}),x?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):window.AppDB.getAll("users"),window.AppCalendar?window.AppCalendar.getCollaborations(u):Promise.resolve([]),window.app_hasPerm("leaves","view")?window.AppDB.getAll("leaves"):Promise.resolve([]),w,window.AppMinutes?window.AppMinutes.getMinutes():Promise.resolve([])]);console.timeEnd("DashboardFetch");const B=l?{lowRead:!1,generatedAt:D?.generatedAt||D?.meta?.generatedAt||0,source:D?._source||""}:{};let P=l?D?.hero||null:A,C=l?Array.isArray(D?.teamActivityPreview)?D.teamActivityPreview:[]:_;l&&(!D||!Array.isArray(D.teamActivityPreview))&&setTimeout(()=>on(!0),0);const R=ye(P,B);if(l&&P==null&&y){const W="app_hero_fallback_attempted_date",se=()=>{try{return localStorage.getItem(W)===r}catch{return!1}},ge=()=>{try{localStorage.setItem(W,r)}catch{}},re=ie=>{const oe=document.querySelector(".hero-slot");oe&&(oe.outerHTML=ie)};y.then(async ie=>{const oe=ie&&ie.hero?ie.hero:null;if(oe){const we={...B,generatedAt:ie.generatedAt||B.generatedAt,source:ie._source||B.source};re(ye(oe,we));return}const ce=await p();if(ce){re(ye(ce,{...B,generatedAt:Date.now(),source:"direct_cache"}));return}if(re(ye({state:"no_eligible_data",reason:"No eligible hero data available.",source:"shared_summary"},{...B,generatedAt:ie?.generatedAt||B.generatedAt,source:ie?._source||"shared_missing"})),!se()){ge();try{const we=await window.AppAnalytics.getHeroOfTheWeek({source:"direct_fallback"});if(!we||we.state==="fetch_error"){re(ye({state:"fetch_error",reason:"Hero stats are temporarily unavailable.",source:"direct_fallback"},{...B,lowRead:!1,generatedAt:Date.now(),source:"direct_fallback"}));return}await window.AppDB.getOrGenerateSummary(c,async()=>we,f);const ja={...B,lowRead:!1,generatedAt:Date.now(),source:"direct_fallback"};re(ye(we,ja))}catch(we){console.warn("Hero fallback direct fetch failed:",we),re(ye({state:"fetch_error",reason:"Hero stats are temporarily unavailable.",source:"direct_fallback"},{...B,generatedAt:Date.now(),source:"direct_fallback"}))}}}).catch(()=>{re(ye({state:"fetch_error",reason:"Hero stats are temporarily unavailable.",source:"shared_error"},{...B,source:"shared_error"}))})}window.AppRating&&n.rating===void 0&&window.AppRating.updateUserRating(n.id).then(W=>{Object.assign(n,W)}).catch(()=>{});const H=(I||[]).find(W=>W.id===u),q=u===n.id,Y=!q&&H?H:n,T=e&&!q&&!t,N=new Date,j=new Date(N.getFullYear(),N.getMonth(),1),K=new Date(N.getFullYear(),N.getMonth()+1,0),J=window.AppAnalytics&&window.AppAnalytics.getFinancialYearDates?window.AppAnalytics.getFinancialYearDates():{start:new Date(N.getFullYear(),0,1),end:new Date(N.getFullYear(),11,31)};window.app_dashboardStatsStore={monthly:k||{},yearly:g||{},monthlyTitle:q?k.label:`${k.label} - ${H?.name||"Staff"}`,monthlySubtitle:q?"Monthly Stats":"Viewing Staff Monthly Stats",yearlyTitle:"Yearly Summary",yearlySubtitle:q?g.label:`${g.label} for ${H?.name||"Staff"}`,logs:Array.isArray(v)?v:[],ranges:{monthly:{start:j.toISOString().split("T")[0],end:K.toISOString().split("T")[0]},yearly:{start:J.start.toISOString().split("T")[0],end:J.end.toISOString().split("T")[0]}}};const X=T?{status:Y.status||"out",lastCheckIn:Y.lastCheckIn||null}:b,te=X.status==="in",ke=n.notifications||[];n.tagHistory;let ne="00 : 00 : 00",Je="Check-in",Ze="action-btn";te&&(Je="Check-out",Ze="action-btn checkout");const Qe=W=>{const se=Math.max(0,W||0);let ge=Math.floor(se/(1e3*60*60)),re=Math.floor(se/(1e3*60)%60),ie=Math.floor(se/1e3%60);return`${String(ge).padStart(2,"0")} : ${String(re).padStart(2,"0")} : ${String(ie).padStart(2,"0")}`};if(te&&X.lastCheckIn){const W=new Date(X.lastCheckIn).getTime();ne=Qe(Date.now()-W)}const wt=ya(),vt=ha(ke);let et="";e&&!q&&H&&(et=`
            <div class="card full-width dashboard-staff-view-banner">
                <div class="dashboard-staff-view-banner-inner">
                    <div class="dashboard-staff-view-banner-profile">
                        <div class="dashboard-staff-view-avatar-wrap">
                            <img src="${Fe(H.avatar)}" alt="${$(H.name)}" class="dashboard-staff-view-avatar">
                            <div class="dashboard-staff-view-avatar-badge">
                                <i class="fa-solid fa-eye"></i>
                            </div>
                        </div>
                        <div class="dashboard-staff-view-copy">
                            <div class="dashboard-staff-view-eyebrow">Currently Viewing</div>
                            <h3 class="dashboard-staff-view-title">${$(H.name)}'s Dashboard</h3>
                            <div class="dashboard-staff-view-meta">${$(H.role)} • ${$(H.dept||"General")}</div>
                        </div>
                    </div>
                    <button onclick="window.app_changeSummaryStaff('${n.id}')" class="dashboard-staff-view-back-btn">
                        <i class="fa-solid fa-arrow-left"></i> Back to My Dashboard
                    </button>
                </div>
            </div>`);let _e="";const qt=Nt(S);if(e){const W=!!window.app_selectedSummaryStaffId&&window.app_selectedSummaryStaffId!==n.id,se=ra(i),ge=(E||[]).filter(oe=>{const ce=String(oe.appliedOn||oe.actionDate||oe.startDate||"").slice(0,10);return ce&&ce>=se.startKey&&ce<=se.endKey}).sort((oe,ce)=>new Date(ce.appliedOn||ce.actionDate||ce.startDate||0)-new Date(oe.appliedOn||oe.actionDate||oe.startDate||0)),re=W?ge.filter(oe=>(oe.userId||oe.user_id)===u).slice(0,8):ge.slice(0,8),ie=fa(re,{title:W?`${H?.name||"Staff"} Leave History`:"Leave Request History",subtitle:W?`Current week (${se.label}) for selected staff`:`Current week (${se.label}) across all staff`,selectedDate:i});_e=`
            <div class="dashboard-summary-row">
                <div style="flex: 2; min-width: 350px; display: flex; flex-direction: column;">${ma(L)}${ie}</div>
                <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 1rem;">${qt}${R}</div>
            </div>
            <div class="dashboard-stats-row">
                ${Me(q?k.label:`${k.label} - ${H?.name||"Staff"}`,q?"Monthly Stats":"Viewing Staff Monthly Stats",k,"monthly")}
                ${Me("Yearly Summary",q?g.label:`${g.label} for ${H?.name||"Staff"}`,g,"yearly")}
            </div>`}else _e=`
            <div class="dashboard-summary-row">
                <div class="dashboard-summary-col dashboard-summary-col-wide">${qt}</div>
                <div class="dashboard-summary-col dashboard-summary-col-narrow">${R}</div>
            </div>
            <div class="dashboard-stats-row">
                ${Me(k.label,"Monthly Stats",k,"monthly")}
                ${Me("Yearly Summary",g.label,g,"yearly")}
            </div>`;const bt=window.app_getReleaseUpdateState&&window.app_getReleaseUpdateState()||{active:!1};return setTimeout(()=>Ja(),0),`
        <div class="dashboard-grid dashboard-modern dashboard-staff-view">
            ${wt}
            ${vt}
            ${et}
            <div class="card full-width dashboard-hero-card">
                <div class="dashboard-hero-orb dashboard-hero-orb-top"></div>
                <div class="dashboard-hero-orb dashboard-hero-orb-bottom"></div>
                <div class="dashboard-hero-content">
                    <div class="dashboard-hero-row">
                        <div class="dashboard-hero-copy">
                            <h2 class="dashboard-hero-title">Welcome back, ${n.name.split(" ")[0]}! 👋</h2>
                            <p class="dashboard-hero-date">${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
                            ${n.rating!==void 0?`<div class="dashboard-hero-chip-row"><div class="dashboard-hero-chip"><span class="dashboard-hero-chip-label">Your Rating:</span>${Xa(n.rating,!0)}</div>${n.completionStats?`<div class="dashboard-hero-chip"><i class="fa-solid fa-check-circle dashboard-hero-chip-icon"></i><span>${(n.completionStats.completionRate*100).toFixed(0)}% Complete</span></div>`:""}</div>`:""}
                        </div>
                        <div class="dashboard-hero-aside">
                            ${e?`<div class="dashboard-viewing-box"><div class="dashboard-viewing-inner"><i class="fa-solid fa-users-viewfinder dashboard-viewing-icon"></i><div class="dashboard-viewing-meta"><div class="dashboard-viewing-head"><div class="dashboard-viewing-label">Viewing Summary For</div>${u!==n.id?'<span class="dashboard-viewing-state">STAFF VIEW ACTIVE</span>':""}</div><select onchange="window.app_changeSummaryStaff(this.value)" class="dashboard-viewing-select"><option value="${n.id}">My Own Summary</option><optgroup label="Staff Members">${(I||[]).filter(W=>W.id!==n.id).sort((W,se)=>W.name.localeCompare(se.name)).map(W=>`<option value="${W.id}" ${W.id===u?"selected":""}>${W.name}</option>`).join("")}</optgroup></select></div></div></div>`:""}
                            <div class="dashboard-hero-brand" aria-hidden="true">
                                <img src="crwi-logo.png" alt="CRWI logo" class="dashboard-hero-brand-logo">
                            </div>
                        </div>
                    </div>
                </div>
                <button class="${bt.active?"dashboard-refresh-link is-update-pending":"dashboard-refresh-link"}" onclick="window.app_checkForSystemUpdate()" title="${bt.active?"Update available. Click to refresh into the new version.":"Check for System Update"}">
                    ${bt.active?"System update available":"Check for System Update"}
                </button>
            </div>
            <div class="dashboard-primary-row">
                <div class="card check-in-widget dashboard-primary-card dashboard-checkin-card">
                    <div class="dashboard-checkin-head">
                        <div class="dashboard-checkin-avatar-wrap">
                            <img src="${Fe(Y.avatar)}" alt="Profile" class="dashboard-checkin-avatar">
                            <div class="dashboard-checkin-status-dot" style="background: ${te?"#10b981":"#94a3b8"};"></div>
                        </div>
                        <div class="dashboard-checkin-identity">
                            <h4 class="dashboard-checkin-name">${$(Y.name)}</h4>
                            <p class="text-muted dashboard-checkin-role">${$(Y.role)}</p>
                        </div>
                    </div>
                    <div class="dashboard-checkin-timer-wrap">
                        <div class="timer-display dashboard-checkin-timer" id="timer-display">${ne}</div>
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
                    <button class="${Ze} dashboard-checkin-btn" id="attendance-btn" ${T?"disabled":""} title="${T?"View only":""}">${Je} <i class="fa-solid fa-fingerprint"></i></button>
                    <div class="location-text dashboard-checkin-location" id="location-text"><i class="fa-solid fa-location-dot"></i><span>${te&&Y.currentLocation?`Lat: ${Number(Y.currentLocation.lat).toFixed(4)}, Lng: ${Number(Y.currentLocation.lng).toFixed(4)}`:"Waiting for location..."}</span></div>
                </div>
                <div class="dashboard-primary-col ${q?"":"dashboard-primary-col-highlight"}">${da(v,O,H,M)}</div>
                <div class="dashboard-primary-col">${ca(C)}</div>
            </div>
            ${_e}
        </div>`}function yt(n){const[e,t]=String(n||"").split("-"),a=Number(e),s=Number(t)-1;return!Number.isInteger(a)||!Number.isInteger(s)||s<0||s>11?n||"Current Month":new Date(a,s,1).toLocaleDateString("en-US",{month:"long",year:"numeric"})}function tn(n=8){const e=[],t=new Date;t.setDate(1);for(let a=0;a<n;a++){const s=new Date(t);s.setMonth(t.getMonth()-a);const i=s.toISOString().slice(0,7);e.push({key:i,label:yt(i)})}return e}function an(n){const e=[],t=new Map;return(n||[]).forEach(a=>{const s=(a._displayDesc||"").trim(),i=`${a.staffName||""}|${a.date||""}|${s}`;t.has(i)||(t.set(i,a),e.push(a))}),e.map(a=>{const s=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(a.date,a.status||""):a.status||"to-be-started";return{...a,_taskStatus:s,_taskGroup:s==="completed"?"completed":"incomplete"}})}function nn(n,e){const t=[...n],a={completed:0,"in-process":1,overdue:2,"not-completed":3,"to-be-started":4};return t.sort((s,i)=>{const o=new Date(i.date)-new Date(s.date),r=String(s.staffName||"").toLowerCase().localeCompare(String(i.staffName||"").toLowerCase());return e==="date-asc"?new Date(s.date)-new Date(i.date)||r:e==="staff-asc"?r||o:e==="staff-desc"?-r||o:e==="completed-first"?s._taskGroup.localeCompare(i._taskGroup)||o:e==="incomplete-first"?i._taskGroup.localeCompare(s._taskGroup)||o:e==="status-priority"?(a[s._taskStatus]??99)-(a[i._taskStatus]??99)||o||r:o||r}),t}function sn(n){if(!n)return;const e=Ie.controllers.get(n);e&&(e.intervalId&&clearInterval(e.intervalId),e.pauseTimeoutId&&clearTimeout(e.pauseTimeoutId),e.resumeTimeoutId&&clearTimeout(e.resumeTimeoutId),n.removeEventListener("mouseenter",e.onMouseEnter),n.removeEventListener("mouseleave",e.onMouseLeave),n.removeEventListener("touchstart",e.onTouchStart),n.removeEventListener("touchend",e.onTouchEnd),n.removeEventListener("touchcancel",e.onTouchCancel),Ie.controllers.delete(n),Ie.elements.delete(n))}function ga(){Array.from(Ie.elements).forEach(n=>sn(n))}function wa(n){if(!n)return;ga(),n.querySelectorAll(".dashboard-team-activity-col-list").forEach(t=>{const a={intervalId:null,pauseTimeoutId:null,resumeTimeoutId:null,direction:1,isPausedByUser:!1,isWaitingAtEdge:!1},s=(o,r)=>{a.isWaitingAtEdge=!0,a.pauseTimeoutId&&clearTimeout(a.pauseTimeoutId),a.pauseTimeoutId=setTimeout(()=>{a.direction=o,a.isWaitingAtEdge=!1},r)},i=()=>{if(a.isPausedByUser||a.isWaitingAtEdge||!t.isConnected)return;const o=Math.max(0,t.scrollHeight-t.clientHeight);o<=0||(t.scrollTop+=a.direction,a.direction===1&&t.scrollTop>=o?(t.scrollTop=o,s(-1,1500)):a.direction===-1&&t.scrollTop<=0&&(t.scrollTop=0,s(1,1e3)))};a.onMouseEnter=()=>{a.isPausedByUser=!0},a.onMouseLeave=()=>{a.isPausedByUser=!1},a.onTouchStart=()=>{a.isPausedByUser=!0,a.resumeTimeoutId&&clearTimeout(a.resumeTimeoutId)},a.onTouchEnd=()=>{a.resumeTimeoutId&&clearTimeout(a.resumeTimeoutId),a.resumeTimeoutId=setTimeout(()=>{a.isPausedByUser=!1},400)},t.addEventListener("mouseenter",a.onMouseEnter),t.addEventListener("mouseleave",a.onMouseLeave),t.addEventListener("touchstart",a.onTouchStart,{passive:!0}),t.addEventListener("touchend",a.onTouchEnd,{passive:!0}),a.intervalId=setInterval(i,50),Ie.controllers.set(t,a),Ie.elements.add(t)})}const on=async(n=!0)=>{const e=qe(),t=document.getElementById("staff-activity-list"),a=document.getElementById("staff-activity-list-modal");if(!t&&!a)return;ga(),n&&window.AppAnalytics&&(e.logs=await window.AppAnalytics.getAllStaffActivities({mode:"month",month:e.selectedMonth,scope:"work"}));const s=mt(e.logs,e.sortKey);t&&(t.innerHTML=s,wa(t)),a&&(a.innerHTML=s);const i=document.getElementById("staff-activity-range-label");i&&(i.textContent=yt(e.selectedMonth))};typeof window<"u"&&(window.app_setDashboardLeaveHistoryDate=async function(n){const e=qe();e.leaveHistoryDate=n||new Date().toISOString().slice(0,10);const t=document.getElementById("page-content");t&&(t.innerHTML=await ft())},window.app_expandTeamActivity=function(){window.app_closeTeamActivityExpanded&&window.app_closeTeamActivityExpanded(),window.location&&(window.location.hash="#team-activities")},window.app_openStatsDetailModal=function(n){const e=window.app_dashboardStatsStore||{},t=n==="yearly"?e.yearly:e.monthly;if(!t)return;const a=n==="yearly"?e.yearlyTitle:e.monthlyTitle,s=n==="yearly"?e.yearlySubtitle:e.monthlySubtitle,i=t.breakdown||{},o=e.ranges?n==="yearly"?e.ranges.yearly:e.ranges.monthly:null,r=Qa(e.logs||[],o),d=Object.entries(i).filter(([,u])=>Number(u||0)>0),l=document.getElementById("dashboard-stats-modal");l&&l.remove();const c=document.createElement("div");c.id="dashboard-stats-modal",c.className="modal-overlay dashboard-stats-modal",c.innerHTML=`
            <div class="modal-content dashboard-stats-modal-content">
                <div class="dashboard-stats-modal-head">
                    <div>
                        <div class="dashboard-stats-modal-title">${$(a||"Attendance Summary")}</div>
                        <div class="dashboard-stats-modal-sub">${$(s||"")}</div>
                    </div>
                    <button class="dashboard-stats-modal-close" type="button" onclick="window.app_closeStatsDetailModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="dashboard-stats-modal-grid">
                    <div class="dashboard-stats-modal-tile" data-stat-detail="late" role="button" tabindex="0">
                        <span class="label">Late Count</span>
                        <span class="value">${$(t.late??0)}</span>
                        <span class="hint">Total late entries</span>
                    </div>
                    <div class="dashboard-stats-modal-tile" data-stat-detail="late" role="button" tabindex="0">
                        <span class="label">Late Duration</span>
                        <span class="value">${$(t.totalLateDuration||"0h 0m")}</span>
                        <span class="hint">Summed lateness time</span>
                    </div>
                    <div class="dashboard-stats-modal-tile" data-stat-detail="early" role="button" tabindex="0">
                        <span class="label">Early Departures</span>
                        <span class="value">${$(t.earlyDepartures??0)}</span>
                        <span class="hint">Left before cutoff</span>
                    </div>
                    <div class="dashboard-stats-modal-tile" data-stat-detail="extra" role="button" tabindex="0">
                        <span class="label">Extra Hours</span>
                        <span class="value">${$(t.extraWorkedHours??0)}h</span>
                        <span class="hint">Counted extra time</span>
                    </div>
                    <div class="dashboard-stats-modal-tile" data-stat-detail="late" role="button" tabindex="0">
                        <span class="label">Penalty</span>
                        <span class="value">${$(t.penalty??t.penaltyLeaves??0)}</span>
                        <span class="hint">Leave deductions</span>
                    </div>
                    <div class="dashboard-stats-modal-tile" data-stat-detail="extra" role="button" tabindex="0">
                        <span class="label">Penalty Offset</span>
                        <span class="value">${$(t.penaltyOffset??0)}</span>
                        <span class="hint">Extra hours offset</span>
                    </div>
                    <div class="dashboard-stats-modal-tile highlight" data-stat-detail="late" role="button" tabindex="0">
                        <span class="label">Effective Penalty</span>
                        <span class="value">${$(t.effectivePenalty??0)}</span>
                        <span class="hint">Final deduction</span>
                    </div>
                </div>
                <div class="dashboard-stats-modal-section">
                    <div class="dashboard-stats-modal-section-title">Breakdown</div>
                    <div class="dashboard-stats-modal-breakdown">
                        ${(d.length?d:[["No data",0]]).map(([u,p])=>`
                            <div class="dashboard-stats-modal-row" data-breakdown-key="${$(u)}" role="button" tabindex="0">
                                <span>${$(u)}</span>
                                <strong>${$(p)}</strong>
                            </div>
                        `).join("")}
                    </div>
                </div>
                <div class="dashboard-stats-modal-section">
                    <div class="dashboard-stats-modal-section-title" id="dashboard-stats-detail-title">Details</div>
                    <div class="dashboard-stats-modal-dates" id="dashboard-stats-date-list"></div>
                </div>
            </div>
        `,document.body.appendChild(c),document.body.style.overflow="hidden",window._dashboardStatsDetailData={type:n,buckets:r};const f=r.late.length?"late":r.early.length?"early":r.extra.length?"extra":"Present";window.app_updateStatsDetailView(f),c.addEventListener("click",u=>{const p=u.target.closest("[data-stat-detail]");if(p){window.app_updateStatsDetailView(p.getAttribute("data-stat-detail"));return}const m=u.target.closest("[data-breakdown-key]");m&&window.app_updateStatsDetailView(m.getAttribute("data-breakdown-key"))}),c.addEventListener("keydown",u=>{if(u.key!=="Enter"&&u.key!==" ")return;const p=u.target.closest("[data-stat-detail]"),m=u.target.closest("[data-breakdown-key]");(p||m)&&(u.preventDefault(),window.app_updateStatsDetailView(p?p.getAttribute("data-stat-detail"):m.getAttribute("data-breakdown-key")))}),c.addEventListener("click",u=>{u.target===c&&window.app_closeStatsDetailModal()}),window._dashboardStatsEscHandler=u=>{u.key==="Escape"&&window.app_closeStatsDetailModal()},window.addEventListener("keydown",window._dashboardStatsEscHandler)},window.app_closeStatsDetailModal=function(){const n=document.getElementById("dashboard-stats-modal");n&&n.remove(),document.body.style.overflow="",window._dashboardStatsDetailData=null,window._dashboardStatsEscHandler&&(window.removeEventListener("keydown",window._dashboardStatsEscHandler),window._dashboardStatsEscHandler=null)},window.app_updateStatsDetailView=function(n){const t=(window._dashboardStatsDetailData||{}).buckets||{};let a="",s=[];n==="late"?(a="Late Dates",s=t.late||[]):n==="early"?(a="Early Departure Dates",s=t.early||[]):n==="extra"?(a="Extra Hours Dates",s=t.extra||[]):t.breakdown&&Object.prototype.hasOwnProperty.call(t.breakdown,n)?(a=`${n} Dates`,s=t.breakdown[n]||[]):(a="Details",s=[]);const i=document.getElementById("dashboard-stats-detail-title"),o=document.getElementById("dashboard-stats-date-list");i&&(i.textContent=a),o&&(o.innerHTML=s.length?s.map(r=>`<div class="dashboard-stats-date-item">${$(r)}</div>`).join(""):'<div class="dashboard-stats-date-empty">No dates available.</div>'),document.querySelectorAll(".dashboard-stats-modal-tile, .dashboard-stats-modal-row").forEach(r=>{const d=r.getAttribute("data-stat-detail"),l=r.getAttribute("data-breakdown-key");r.classList.toggle("is-active",d&&d===n||l&&l===n)})},window.app_attachStatsCardHandlers=function(){Za()},window.app_expandTeamActivityRefresh=function(){const n=qe(),e=document.getElementById("staff-activity-list-modal"),t=document.getElementById("staff-activity-range-label-modal");e&&(e.innerHTML=mt(n.logs,n.sortKey)),t&&(t.textContent=yt(n.selectedMonth))},window.app_closeTeamActivityExpanded=function(){const n=document.getElementById("team-activity-modal-overlay");n&&(n.remove(),document.body.style.overflow="",window.removeEventListener("keydown",window._teamActivityEscHandler))});async function rn(){const n=window.AppAuth.getUser(),e=window.AppDB.getCached?await window.AppDB.getCached(window.AppDB.getCacheKey("staffUsers","users",{}),x?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):await window.AppDB.getAll("users"),t=window.app_getMyMessages?await window.app_getMyMessages():await window.AppDB.getAll("staff_messages"),a=e.filter(p=>p.id!==n.id).sort((p,m)=>p.name.localeCompare(m.name));!window.app_staffThreadId&&a.length>0&&(window.app_staffThreadId=a[0].id);const s=e.find(p=>p.id===window.app_staffThreadId),i=p=>$(p).replace(/(https?:\/\/[^\s]+)/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'),o=t.filter(p=>p.fromId===n.id&&p.toId===window.app_staffThreadId||p.fromId===window.app_staffThreadId&&p.toId===n.id).sort((p,m)=>new Date(p.createdAt||0)-new Date(m.createdAt||0)),r=o.filter(p=>p.type==="text"),d=o.filter(p=>p.type==="task"),l={};t.forEach(p=>{p.toId===n.id&&!p.read&&(l[p.fromId]=(l[p.fromId]||0)+1)});const c=a.map(p=>{const m=l[p.id]||0;return`
            <button class="staff-directory-item ${p.id===window.app_staffThreadId?"active":""}" onclick="window.app_openStaffThread('${p.id}')">
                <div class="staff-directory-avatar">
                    <img src="${p.avatar}" alt="${$(p.name)}">
                </div>
                <div class="staff-directory-info">
                    <div class="staff-directory-name">${$(p.name)}</div>
                    <div class="staff-directory-role">${$(p.role||"Staff")}</div>
                </div>
                ${m?`<span class="staff-directory-badge">${m}</span>`:""}
            </button>
        `}).join(""),f=s?r.length?r.map(p=>`
        <div class="staff-message ${p.fromId===n.id?"outgoing":"incoming"}">
            <div class="staff-message-meta">${$(p.fromName)} • ${new Date(p.createdAt).toLocaleString()}</div>
            <div class="staff-message-body">${i(p.message||"")}</div>
            ${p.link?`<div class="staff-message-link"><a href="${p.link}" target="_blank" rel="noopener noreferrer">${p.link}</a></div>`:""}
        </div>
    `).join(""):'<div class="staff-message-empty">No messages yet.</div>':'<div class="staff-message-empty">Select a staff member to view messages.</div>',u=s?d.length?d.map(p=>`
        <div class="staff-task-card">
            <div class="staff-task-head">
                <div>
                    <div class="staff-task-title">${$(p.title||"Task")}</div>
                    <div class="staff-task-meta">From ${$(p.fromName)} • Due ${p.dueDate||"No date"}</div>
                </div>
                <span class="staff-task-status ${p.status||"pending"}">${(p.status||"pending").toUpperCase()}</span>
            </div>
            <div class="staff-task-desc">${$(p.description||"")}</div>
            ${p.status==="pending"&&p.toId===n.id?`
                <div class="staff-task-actions">
                    <button onclick="window.app_respondStaffTask('${p.id}', 'approved')" class="staff-task-btn approve">Approve</button>
                    <button onclick="window.app_respondStaffTask('${p.id}', 'rejected')" class="staff-task-btn reject">Reject</button>
                </div>
            `:""}
            ${p.rejectReason?`<div class="staff-task-reason">Reason: ${$(p.rejectReason)}</div>`:""}
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
                        <h3>${s?$(s.name):"Select a staff member"}</h3>
                        <span>${s?$(s.role||"Staff"):""}</span>
                    </div>
                    <div class="staff-thread-actions">
                        <button class="staff-thread-action-btn" ${s?"":"disabled"} onclick="window.app_openStaffMessageModal('${s?s.id:""}', '${s?$(s.name):""}')">
                            <i class="fa-solid fa-message"></i> Send Message
                        </button>
                        <button class="staff-thread-action-btn secondary" ${s?"":"disabled"} onclick="window.app_openStaffTaskModal('${s?s.id:""}', '${s?$(s.name):""}')">
                            <i class="fa-solid fa-list-check"></i> Send Task
                        </button>
                    </div>
                </div>
                <div class="staff-thread-columns">
                    <div class="staff-thread-column">
                        <div class="staff-thread-column-head">Text Messages</div>
                        <div class="staff-thread-history">
                            ${f}
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
    `}let Wt=!1;function dn(){Wt||typeof document>"u"||(Wt=!0,document.addEventListener("click",n=>{const e=n.target.closest("[data-annual-open-day]");if(e){window.app_openAnnualDayPlan?.(e.dataset.annualOpenDay);return}const t=n.target.closest("[data-annual-view]");if(t){window.app_toggleAnnualView?.(t.dataset.annualView);return}if(n.target.closest("[data-annual-jump-today]")){window.app_jumpToAnnualToday?.();return}const s=n.target.closest("[data-annual-year-delta]");if(s){window.app_changeAnnualYear?.(Number(s.dataset.annualYearDelta||0));return}const i=n.target.closest("[data-annual-legend]");if(i){window.app_toggleAnnualLegendFilter?.(i.dataset.annualLegend);return}n.target.closest("[data-annual-export]")&&window.AppReports?.exportAnnualListViewCSV?.(window._annualListItems||[])}),document.addEventListener("input",n=>{const e=n.target.closest("[data-annual-staff-filter]");e&&window.app_setAnnualStaffFilter?.(e.value)}),document.addEventListener("change",n=>{const e=n.target.closest("[data-annual-list-sort]");e&&window.app_setAnnualListSort?.(e.value)}),document.addEventListener("keydown",n=>{const e=n.target.closest("[data-annual-list-search]");e&&n.key==="Enter"&&window.app_setAnnualListSearch?.(e.value)}),document.addEventListener("mouseover",n=>{const e=n.target.closest("[data-annual-preview-date]");!e||e.contains(n.relatedTarget)||window.app_showAnnualHoverPreview?.(n,e.dataset.annualPreviewDate)}),document.addEventListener("mouseout",n=>{const e=n.target.closest("[data-annual-preview-date]");!e||e.contains(n.relatedTarget)||window.app_hideAnnualHoverPreview?.()}))}async function Ce(){typeof window.app_setAnnualStaffFilter!="function"&&(window.app_setAnnualStaffFilter=async D=>{window.app_annualStaffFilter=String(D||"").trim();const M=document.getElementById("page-content");M&&(M.innerHTML=await Ce())}),typeof window.app_toggleAnnualView!="function"&&(window.app_toggleAnnualView=async D=>{window.app_annualViewMode=D;const M=document.getElementById("page-content");M&&(M.innerHTML=await Ce())}),typeof window.app_setAnnualListSearch!="function"&&(window.app_setAnnualListSearch=async D=>{window.app_annualListSearch=String(D||"").trim();const M=document.getElementById("page-content");M&&(M.innerHTML=await Ce())}),typeof window.app_setAnnualListSort!="function"&&(window.app_setAnnualListSort=async D=>{window.app_annualListSort=String(D||"date-asc").trim();const M=document.getElementById("page-content");M&&(M.innerHTML=await Ce())});const n=new Date,e=`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`,t=window.app_annualYear||n.getFullYear(),a=await window.AppCalendar.getPlans(),s=await window.AppDB.getAll("users").catch(()=>[]),i=await window.AppDB.getAll("attendance").catch(()=>[]);window._currentPlans=a;const o=["January","February","March","April","May","June","July","August","September","October","November","December"],r={};(s||[]).forEach(D=>{r[D.id]=D.name}),window._annualUserMap=r;const d=(D,M)=>r[D]||M||"Staff",l=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0,overdue:!0,completed:!0};window.app_annualLegendFilters=l;let c=window.app_selectedAnnualDate||(t===n.getFullYear()?e:null);c&&!c.startsWith(`${t}-`)&&(c=null),window.app_selectedAnnualDate=c;const f=String(window.app_annualStaffFilter||"").trim(),u=f.toLowerCase(),p=String(window.app_annualListSearch||"").trim(),m=p.toLowerCase(),h=String(window.app_annualListSort||"date-asc"),y=(s||[]).map(D=>`<option value="${$(D.name)}"></option>`).join(""),w=D=>u?String(D||"").toLowerCase().includes(u):!0,b={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11},v=(D="")=>{const M=String(D||"").trim();if(!M)return null;const B=M.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);if(!B)return null;const P=Number(B[1]),C=Number(B[2]),R=String(B[3]||"").toLowerCase(),H=Number(B[4]),q=b[R];if(!Number.isInteger(P)||!Number.isInteger(C)||!Number.isInteger(q)||!Number.isInteger(H))return null;const Y=new Date(H,q,P),T=new Date(H,q,C);if(Number.isNaN(Y.getTime())||Number.isNaN(T.getTime()))return null;const N=`${Y.getFullYear()}-${String(Y.getMonth()+1).padStart(2,"0")}-${String(Y.getDate()).padStart(2,"0")}`,j=`${T.getFullYear()}-${String(T.getMonth()+1).padStart(2,"0")}-${String(T.getDate()).padStart(2,"0")}`;return j<N?null:{startDate:N,endDate:j}},k=(D,M)=>{const B=!D?.startDate&&!D?.endDate?v(D?.task||""):null,P=D?.startDate||B?.startDate||M,C=D?.endDate||B?.endDate||D?.startDate||M;return{startDate:P,endDate:C}},g=(D,M,B)=>{const{startDate:P,endDate:C}=k(D,M);return!P||!C?M===B:!(B<P||B>C||D?.completedDate&&D.completedDate<B)},A=(a.workPlans||[]).filter(D=>{if((D.planScope||"personal")==="annual"){if(!u)return!0;const P=d(D.userId,D.userName);return w(P)?!0:(D.plans||[]).some(C=>{const R=d(C.assignedTo||D.userId,P),H=(C.tags||[]).map(q=>q.name||q).join(" ");return w(R)||w(H)})}if(!u)return!0;const B=d(D.userId,D.userName);return w(B)?!0:(D.plans||[]).some(P=>{const C=d(P.assignedTo||D.userId,B),R=(P.tags||[]).map(H=>H.name||H).join(" ");return w(C)||w(R)})}),S=(a.leaves||[]).filter(D=>w(d(D.userId,D.userName))),_=(i||[]).filter(D=>{if(!String(D.date||"").startsWith(String(t)))return!1;const B=D.user_id||D.userId,P=d(B,"");return u?w(P):!0}),L=(D,M,B)=>{const P=`${B}-${String(M+1).padStart(2,"0")}-${String(D).padStart(2,"0")}`,C=S.some(N=>P>=N.startDate&&P<=N.endDate),R=!u&&(a.events||[]).some(N=>N.date===P),H=_.some(N=>N.date===P),q=A.some(N=>!Array.isArray(N.plans)||!N.plans.length?N.date===P:N.plans.some(j=>g(j,N.date,P)))||H;let Y="",T=!1;if(q){const N=A.filter(K=>!Array.isArray(K.plans)||!K.plans.length?K.date===P:K.plans.some(J=>g(J,K.date,P)));let j="to-be-started";N.forEach(K=>{(K.plans||[]).forEach(J=>{if(!g(J,K.date,P))return;const{startDate:X,endDate:te}=k(J,K.date);X&&te&&X!==te&&te===P&&(T=!0);const ke=J.completedDate||te||K.date||P,ne=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(ke,J.status):J.status||"pending";ne==="overdue"?j="overdue":ne==="in-process"&&j!=="overdue"?j="in-process":ne==="completed"&&j!=="overdue"&&j!=="in-process"&&(j="completed")})}),H&&j==="to-be-started"&&(j="completed"),Y=j}return{hasLeave:C,hasEvent:R,hasWork:q,workStatus:Y,hasRangeEnd:T}};let I="";for(let D=0;D<12;D++){const M=new Date(t,D,1).getDay(),B=new Date(t,D+1,0).getDate();let P="";for(let C=0;C<M;C++)P+='<div class="annual-day empty"></div>';for(let C=1;C<=B;C++){const R=L(C,D,t),H=C===n.getDate()&&D===n.getMonth()&&t===n.getFullYear(),q=`${t}-${String(D+1).padStart(2,"0")}-${String(C).padStart(2,"0")}`,Y=R.hasLeave&&l.leave,T=R.hasEvent&&l.event,N=R.hasWork&&l.work&&(R.workStatus==="overdue"?l.overdue:R.workStatus==="completed"?l.completed:!0),j=Y||T||N,K=N?`has-work work-${R.workStatus}`:"";P+=`
                <div class="annual-day ${H?"today":""} ${K} ${c===q?"selected":""} ${j?"":"annual-day-muted"}" data-annual-open-day="${q}" data-annual-preview-date="${q}">
                    ${C}
                    <div class="dot-container">
                        ${Y?'<span class="status-dot dot-leave"></span>':""}
                        ${T?'<span class="status-dot dot-event"></span>':""}
                        ${N?'<span class="status-dot dot-work"></span>':""}
                        ${R.hasRangeEnd?'<span class="status-dot" title="Task ends today" style="background:#f97316;"></span>':""}
                    </div>
                </div>`}I+=`
            <div class="annual-month-card">
                <div class="annual-month-head">
                    <span class="annual-month-title">${o[D]}</span>
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
                    ${P}
                </div>
            </div>`}const O=window.app_annualViewMode||"grid",E=(()=>{const D=[],M=new Set,B=T=>{if(!T)return"";const N=String(T).replace(/_/g,"-").toLowerCase();return{"in-process":"In Process","to-be-started":"To Be Started","not-completed":"Not Completed",completed:"Completed",overdue:"Overdue",pending:"Pending",approved:"Approved",holiday:"Holiday",event:"Event"}[N]||N.replace(/\b\w/g,K=>K.toUpperCase())},P=(T,N)=>N||(window.AppCalendar&&T?window.AppCalendar.getSmartTaskStatus(T,N):"pending");if(!u&&window.AppAnalytics){const T=new Date(t,0,1),N=new Date(t,11,31);for(let j=new Date(T);j<=N;j.setDate(j.getDate()+1)){const K=j.toISOString().split("T")[0],J=window.AppAnalytics.getDayType(j);J==="Holiday"?D.push({date:K,type:"holiday",title:"Company Holiday (Weekend)",staffName:"All Staff",assignedBy:"System",assignedTo:"All Staff",selfAssigned:!1,dueDate:K,status:"holiday",comments:"",scope:"Shared"}):J==="Half Day"&&D.push({date:K,type:"event",title:"Half Working Day (Sat)",staffName:"All Staff",assignedBy:"System",assignedTo:"All Staff",selfAssigned:!1,dueDate:K,status:"event",comments:"",scope:"Shared"})}}S.forEach(T=>{const N=new Date(T.startDate),j=new Date(T.endDate||T.startDate),K=d(T.userId,T.userName);for(let J=new Date(N);J<=j;J.setDate(J.getDate()+1)){const X=J.toISOString().split("T")[0];X.startsWith(String(t))&&D.push({date:X,type:"leave",title:`${K} (${T.type||"Leave"})`,staffName:K,assignedBy:K,assignedTo:K,selfAssigned:!0,dueDate:T.endDate||T.startDate||X,status:(T.status||"approved").toLowerCase(),comments:T.reason||"",scope:"Personal"})}}),(a.events||[]).forEach(T=>{if(!u&&String(T.date||"").startsWith(String(t))){const N=[String(T.date||"").trim(),String(T.title||"").trim().toLowerCase(),String(T.type||"event").trim().toLowerCase(),String(T.createdById||T.createdByName||"").trim().toLowerCase()].join("|");if(M.has(N))return;M.add(N),D.push({date:T.date,type:T.type||"event",title:T.title||"Company Event",staffName:"All Staff",assignedBy:T.createdByName||"Admin",assignedTo:"All Staff",selfAssigned:!1,dueDate:T.date,status:"event",comments:T.description||"",scope:"Shared"})}}),A.forEach(T=>{if(String(T.date||"").startsWith(String(t))){const N=(T.planScope||"personal")==="annual",j=d(T.userId,T.userName)||(N?"All Staff":"Staff"),K=N?"Annual":"Personal",J=T.date;T.plans&&T.plans.length>0&&T.plans.forEach(X=>{const te=N?T.createdByName||X.taggedByName||"Admin":X.taggedByName||j,ke=X.assignedTo||T.userId,ne=N?te:d(ke,j),Je=(X.tags||[]).map(_e=>_e.name||_e).filter(Boolean),{startDate:Ze,endDate:Qe}=k(X,J),wt=X.completedDate||Qe||J,vt=P(wt,X.status),et=X.subPlans&&X.subPlans.length?X.subPlans.join("; "):X.comment||X.notes||"";D.push({date:Ze||J,type:"work",title:X.task||"Work Plan Task",staffName:N?te:ne,assignedBy:te,assignedTo:N?te:ne,selfAssigned:te===ne,dueDate:X.dueDate||Qe||J,status:vt,comments:et,tags:Je,scope:K})})}}),_.forEach(T=>{const N=T.user_id||T.userId,j=d(N,"Staff"),K=(T.workDescription||T.location||"").trim()||"Manual log entry";D.push({date:T.date,type:"work",title:K,staffName:j,assignedBy:j,assignedTo:j,selfAssigned:!0,dueDate:T.date,status:"completed",comments:K,tags:["Manual Log"],scope:"Personal"})});const C=[],R=new Set;D.forEach(T=>{const N=`${T.date||""}|${T.type||""}|${T.title||""}|${T.staffName||""}|${T.status||""}`.toLowerCase();R.has(N)||(R.add(N),C.push(T))}),C.sort((T,N)=>T.date.localeCompare(N.date)||T.type.localeCompare(N.type)),C.forEach(T=>{T.statusLabel=B(T.status),T.statusClass=String(T.status||"pending").replace(/[^a-z0-9]+/gi,"-").toLowerCase()});let H=m?C.filter(T=>[T.date,T.staffName,T.title,T.statusLabel,T.comments].join(" ").toLowerCase().includes(m)):C;const q={"date-asc":(T,N)=>String(T.date||"").localeCompare(String(N.date||"")),"date-desc":(T,N)=>String(N.date||"").localeCompare(String(T.date||"")),"staff-asc":(T,N)=>String(T.staffName||"").localeCompare(String(N.staffName||"")),"staff-desc":(T,N)=>String(N.staffName||"").localeCompare(String(T.staffName||"")),"status-asc":(T,N)=>String(T.statusLabel||"").localeCompare(String(N.statusLabel||"")),"status-desc":(T,N)=>String(N.statusLabel||"").localeCompare(String(T.statusLabel||""))},Y=q[h]||q["date-asc"];return H.slice().sort(Y)})();return window._annualListItems=E,setTimeout(()=>dn(),0),`
        <div class="annual-plan-shell annual-v2-shell">
            <div class="card annual-plan-header annual-v2-header">
                <div class="annual-plan-title-wrap annual-v2-title-wrap">
                    <h2 class="annual-plan-title annual-v2-title">NGO Annual Planning</h2>
                    <p class="annual-plan-subtitle annual-v2-subtitle">Overview of activities for ${t}.</p>
                </div>
                <div class="annual-plan-controls annual-v2-controls">
                    <div class="annual-staff-filter annual-v2-staff-filter">
                        <i class="fa-solid fa-user"></i>
                        <input type="text" list="annual-staff-names" value="${$(f)}" placeholder="Filter by staff name" data-annual-staff-filter="1">
                        <datalist id="annual-staff-names">${y}</datalist>
                    </div>
                    <div class="annual-view-toggle annual-v2-view-toggle">
                        <button data-annual-view="grid" class="annual-toggle-btn annual-v2-toggle-btn ${O==="grid"?"active":""}">
                            <i class="fa-solid fa-calendar-days"></i> Grid
                        </button>
                        <button data-annual-view="list" class="annual-toggle-btn annual-v2-toggle-btn ${O==="list"?"active":""}">
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

            <div id="annual-grid-view" style="display:${O==="grid"?"block":"none"};">
                <div class="card annual-legend-bar annual-v2-legend-bar">
                    <button class="annual-legend-chip ${l.leave?"active":""}" data-annual-legend="leave"><span class="annual-dot leave"></span> Staff Leave</button>
                    <button class="annual-legend-chip ${l.event?"active":""}" data-annual-legend="event"><span class="annual-dot event"></span> Company Event</button>
                    <button class="annual-legend-chip ${l.work?"active":""}" data-annual-legend="work"><span class="annual-dot work"></span> Work Plan</button>
                    <button class="annual-legend-chip ${l.overdue?"active":""}" data-annual-legend="overdue">Overdue Border</button>
                    <button class="annual-legend-chip ${l.completed?"active":""}" data-annual-legend="completed">Completed Border</button>
                </div>
                <div class="annual-grid-layout annual-v2-grid-layout">
                    <div class="annual-plan-grid annual-v2-plan-grid">
                        ${I}
                    </div>
                </div>
            </div>

            <div id="annual-list-view" style="display:${O==="list"?"block":"none"};">
                <div class="card annual-list-card annual-v2-list-card">
                    <div class="annual-list-head annual-v2-list-head">
                        <h4>Annual Timeline</h4>
                        <div class="annual-list-actions annual-v2-list-actions">
                            <div class="annual-list-search-wrap annual-v2-search-wrap">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="text" value="${$(p)}" placeholder="Search list..." data-annual-list-search="1">
                            </div>
                            <select class="annual-v2-sort-select" data-annual-list-sort="1">
                                <option value="date-asc" ${h==="date-asc"?"selected":""}>Date: Oldest First</option>
                                <option value="date-desc" ${h==="date-desc"?"selected":""}>Date: Newest First</option>
                                <option value="staff-asc" ${h==="staff-asc"?"selected":""}>Staff: A-Z</option>
                                <option value="staff-desc" ${h==="staff-desc"?"selected":""}>Staff: Z-A</option>
                            </select>
                            <button class="annual-v2-export-btn" data-annual-export="1">
                                <i class="fa-solid fa-file-export"></i> Export Excel
                            </button>
                        </div>
                    </div>
                    ${E.length===0?'<div class="annual-list-empty">No items found.</div>':`
                        <div class="annual-list-table-wrap">
                            <div class="annual-list-table">
                                <div class="annual-list-header">
                                    <div>Date</div><div>Staff Name</div><div>Task</div><div>Assigned By</div><div>Status</div><div>Comments</div><div>Scope</div>
                                </div>
                                ${E.map(D=>`
                                    <div class="annual-list-row">
                                        <div class="annual-list-cell">${D.date}</div>
                                        <div class="annual-list-cell">${$(D.staffName)}</div>
                                        <div class="annual-list-cell annual-list-task">${$(D.title)}</div>
                                        <div class="annual-list-cell">${$(D.assignedBy)}</div>
                                        <div class="annual-list-cell"><span class="annual-list-status status-${D.statusClass}">${D.statusLabel}</span></div>
                                        <div class="annual-list-cell annual-list-comments">${$(D.comments||"--")}</div>
                                        <div class="annual-list-cell">${D.scope}</div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                    `}
                </div>
            </div>
        </div>`}let Yt=!1;function ln(){Yt||typeof document>"u"||(Yt=!0,document.addEventListener("click",n=>{const e=n.target.closest("[data-timesheet-open-day]");if(e){window.app_openTimesheetDayDetail?.(e.dataset.timesheetOpenDay);return}if(n.target.closest("[data-timesheet-request-leave]")){const c=document.getElementById("leave-modal");c&&(c.style.display="flex");return}if(n.target.closest("[data-timesheet-manual-log]")){document.dispatchEvent(new CustomEvent("open-log-modal"));return}const s=n.target.closest("[data-timesheet-month-delta]");if(s){window.app_changeTimesheetMonth?.(Number(s.dataset.timesheetMonthDelta||0));return}if(n.target.closest("[data-timesheet-today]")){window.app_jumpTimesheetToday?.();return}const o=n.target.closest("[data-timesheet-export]");if(o){window.AppReports?.exportUserLogs?.(o.dataset.timesheetExportUser||"");return}const r=n.target.closest("[data-timesheet-edit-log]");if(r){window.app_editWorkSummary?.(r.dataset.timesheetEditLog);return}const d=n.target.closest("[data-timesheet-detail-log]");if(d){const c=d.dataset.timesheetDetailLog;alert("Detailed analysis for log "+c+" coming soon!");return}const l=n.target.closest("[data-timesheet-close-modal]");l&&l.closest(".modal-overlay")?.remove()}),document.addEventListener("change",n=>{const e=n.target.closest("[data-timesheet-view-select]");e&&window.app_toggleTimesheetViewSelect?.(e.value)}))}async function Pe(){setTimeout(()=>ln(),0),typeof window.app_setTimesheetView!="function"&&(window.app_setTimesheetView=async g=>{window.app_timesheetViewMode=g==="calendar"?"calendar":"list";const A=document.getElementById("page-content");A&&(A.innerHTML=await Pe())}),typeof window.app_changeTimesheetMonth!="function"&&(window.app_changeTimesheetMonth=async g=>{const A=new Date,S=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:A.getMonth(),_=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:A.getFullYear(),L=new Date(_,S,1);L.setMonth(L.getMonth()+g),window.app_timesheetMonth=L.getMonth(),window.app_timesheetYear=L.getFullYear();const I=document.getElementById("page-content");I&&(I.innerHTML=await Pe())}),typeof window.app_jumpTimesheetToday!="function"&&(window.app_jumpTimesheetToday=async()=>{const g=new Date;window.app_timesheetMonth=g.getMonth(),window.app_timesheetYear=g.getFullYear();const A=document.getElementById("page-content");A&&(A.innerHTML=await Pe())});const n=window.AppAuth.getUser(),e=await window.AppAttendance.getLogs(),t=await window.AppCalendar.getPlans().catch(()=>({workPlans:[]})),a=new Date,s=window.app_timesheetViewMode||"list",i=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:a.getMonth(),o=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:a.getFullYear(),r=new Date(o,i,1).toLocaleString("en-US",{month:"long",year:"numeric"}),d=`${o}-${String(i+1).padStart(2,"0")}-01`,l=`${o}-${String(i+1).padStart(2,"0")}-31`,c=e.filter(g=>g.date&&g.date>=d&&g.date<=l),f=(t.workPlans||[]).filter(g=>g.userId===n.id&&g.date&&g.date>=d&&g.date<=l),u={};c.forEach(g=>{u[g.date]||(u[g.date]=[]),u[g.date].push(g)});const p={};f.forEach(g=>{p[g.date]||(p[g.date]=[]),(Array.isArray(g.plans)?g.plans:[]).forEach(S=>{p[g.date].push(S.task||"Planned task")})}),window._timesheetLogsByDate=u,window._timesheetPlansByDate=p;let m=0,h=0;const y=new Set;c.forEach(g=>{g.durationMs&&(m+=g.durationMs/(1e3*60)),(g.lateCountable||window.AppAttendance&&window.AppAttendance.normalizeType(g.type)==="Late")&&h++,g.date&&y.add(g.date)});const w=`${Math.floor(m/60)}h ${Math.round(m%60)}m`,b=Math.floor(h/(x?.LATE_GRACE_COUNT||3))*(x?.LATE_DEDUCTION_PER_BLOCK||.5),v=g=>window.AppAttendance&&window.AppAttendance.normalizeType?window.AppAttendance.normalizeType(g):g;window.app_editWorkSummary=async g=>{const S=(await window.AppAttendance.getLogs()).find(I=>I.id===g),_=S?S.workDescription:"",L=await window.appPrompt("Update Work Summary:",_||"",{title:"Update Work Summary",confirmText:"Save"});if(L!==null){await window.AppAttendance.updateLog(g,{workDescription:L});const I=document.getElementById("page-content");I&&(I.innerHTML=await Pe())}},window.app_switchTimesheetPanel=(g,A)=>{const S=g==="calendar"?"calendar":"list";window.app_timesheetViewMode=S;const _=document.getElementById("timesheet-list-panel"),L=document.getElementById("timesheet-calendar-panel"),I=document.getElementById("timesheet-view-select");_&&(_.style.display=S==="list"?"block":"none"),L&&(L.style.display=S==="calendar"?"block":"none"),I&&(I.value=S);const O=A&&A.closest?A.closest(".timesheet-view-toggle"):null;(O?O.querySelectorAll(".annual-toggle-btn"):[]).forEach(D=>D.classList.remove("active")),A&&A.classList&&A.classList.add("active")},window.app_openTimesheetDayDetail=g=>{const A=window._timesheetLogsByDate&&window._timesheetLogsByDate[g]||[],S=window._timesheetPlansByDate&&window._timesheetPlansByDate[g]||[],_=A.length?A.map(E=>`
                <div class="timesheet-day-detail-item">
                    <div class="timesheet-day-detail-head">
                        <span>${$(E.checkIn||"--")} - ${$(E.checkOut||"--")}</span>
                        <span class="timesheet-day-status-chip">${$(v(E.type))}</span>
                    </div>
                    <div class="timesheet-day-detail-text">${$(E.workDescription||E.location||"No summary")}</div>
                    ${E.id&&E.id!=="active_now"?`<button type="button" class="action-btn secondary" data-timesheet-edit-log="${E.id}">Edit</button>`:""}
                </div>
            `).join(""):'<div class="timesheet-day-detail-empty">No attendance logs for this date.</div>',L=S.length?S.map(E=>`<div class="timesheet-day-plan-item">${$(E)}</div>`).join(""):'<div class="timesheet-day-detail-empty">No planned tasks for this date.</div>',I=`timesheet-day-detail-${Date.now()}`,O=`
            <div class="modal-overlay" id="${I}" style="display:flex;">
                <div class="modal-content" style="max-width:560px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <h3 style="margin:0;">${$(g)} Details</h3>
                        <button type="button" class="app-system-dialog-close" data-timesheet-close-modal="1">&times;</button>
                    </div>
                    <div style="display:grid; gap:0.9rem;">
                        <div>
                            <h4 style="margin:0 0 0.45rem 0; color:#334155;">Logged Work</h4>
                            ${_}
                        </div>
                        <div>
                            <h4 style="margin:0 0 0.45rem 0; color:#334155;">Planned Tasks</h4>
                            ${L}
                        </div>
                    </div>
                </div>
            </div>`;typeof window.app_showModal=="function"?window.app_showModal(O,I):(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",O)};const k=()=>{const g=new Date(o,i,1).getDay(),A=new Date(o,i+1,0).getDate();let S="";for(let _=0;_<g;_++)S+='<div class="timesheet-cal-day empty"></div>';for(let _=1;_<=A;_++){const L=`${o}-${String(i+1).padStart(2,"0")}-${String(_).padStart(2,"0")}`,I=u[L]||[],O=I.length?I.slice().sort((H,q)=>{const Y=T=>{const N=v(T.type);return N==="Absent"?4:N==="Half Day"?3:N==="Late"?2:N==="Present (Late Waived)"?1:0};return Y(q)-Y(H)})[0]:null,E=p[L]||[],D=L===new Date().toISOString().split("T")[0],M=O?v(O.type):"",B=O?M==="Absent"?"absent":M==="Half Day"||M==="Late"?"late":"present":"none",P=O?M:"No log",C=I.map(H=>(H.workDescription||H.location||"").trim()).filter(Boolean),R=C.length?C.slice(0,2).map(H=>`<div class="timesheet-cal-plan">${$(H)}</div>`).join("")+(C.length>2?`<div class="timesheet-cal-more">+${C.length-2} more logs</div>`:""):E.length?E.slice(0,2).map(H=>`<div class="timesheet-cal-plan">${$(H)}</div>`).join("")+(E.length>2?`<div class="timesheet-cal-more">+${E.length-2} more</div>`:""):'<div class="timesheet-cal-empty">No plans</div>';S+=`
                <div class="timesheet-cal-day ${D?"today":""}" data-timesheet-open-day="${L}" style="cursor:pointer;">
                    <div class="timesheet-cal-day-head">
                        <span class="timesheet-cal-date">${_}</span>
                        <span class="timesheet-cal-attendance ${B}">${P}</span>
                    </div>
                    <div class="timesheet-cal-plans">${R}</div>
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
                    <div class="value">${w}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Days Present</div>
                    <div class="value">${y.size} <span class="timesheet-stat-sub">Days</span></div>
                </div>
                <div class="stat-card">
                    <div class="label">Late Count</div>
                    <div class="value" style="color:${h>2?"var(--accent)":"var(--text-main)"}">${h}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Late Deduction</div>
                    <div class="value">${b.toFixed(1)} <span class="timesheet-stat-sub">Days</span></div>
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
                <button class="timesheet-export-btn" data-timesheet-export-user="${n.id}" data-timesheet-export="1">
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
                        ${c.length?c.map(g=>`
                            <tr>
                                <td data-label="Date">
                                    <div class="timesheet-log-date">${g.date||"Active Session"}</div>
                                    <div class="timesheet-log-id">Log ID: ${g.id==="active_now"?"N/A":g.id.slice(-4)}</div>
                                </td>
                                <td data-label="Timings">
                                    <div class="time-badge">
                                        <span class="in"><i class="fa-solid fa-caret-right"></i> ${g.checkIn}</span>
                                        <span class="out"><i class="fa-solid fa-caret-left"></i> ${g.checkOut||"--:--"}</span>
                                    </div>
                                </td>
                                <td data-label="Status">
                                    <div class="timesheet-status-col">
                                        <span class="badge" style="background:${v(g.type)==="Absent"?"#fef2f2":v(g.type)==="Half Day"||v(g.type)==="Late"?"#fff7ed":"#f0fdf4"}; color:${v(g.type)==="Absent"?"#991b1b":v(g.type)==="Half Day"||v(g.type)==="Late"?"#c2410c":"#15803d"}; border:1px solid ${v(g.type)==="Absent"?"#fecaca":v(g.type)==="Half Day"||v(g.type)==="Late"?"#fed7aa":"#dcfce7"};">${v(g.type)}</span>
                                        <div class="timesheet-duration">${g.duration||"--"}</div>
                                    </div>
                                </td>
                                <td data-label="Work Summary" class="timesheet-summary-cell">
                                    <div class="timesheet-summary-wrap">
                                        <div class="dashboard-viewing-meta">
                                            <div class="timesheet-summary-text">${$(g.workDescription)||'<span class="timesheet-empty-summary">No summary provided</span>'}</div>
                                            ${g.location?`<div class="timesheet-location"><i class="fa-solid fa-location-dot"></i> ${$(g.location)}</div>`:""}
                                        </div>
                                        ${g.id!=="active_now"?`<button data-timesheet-edit-log="${g.id}" class="timesheet-edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>`:""}
                                    </div>
                                </td>
                                <td data-label="Detail" class="text-right">
                                    ${g.id!=="active_now"?`<button class="icon-btn timesheet-detail-btn" title="View Detailed Log" data-timesheet-detail-log="${g.id}"><i class="fa-solid fa-circle-info"></i></button>`:'<span class="timesheet-live">SESSION LIVE</span>'}
                                </td>
                            </tr>
                        `).join(""):'<tr><td colspan="5" class="timesheet-empty-row">No attendance records found for this period.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div id="timesheet-calendar-panel" style="display:${s==="calendar"?"block":"none"};">
                ${k()}
            </div>
        </div>
    `}async function va(){try{const n=window.AppAuth.getUser();if(!n)return'<div class="card">User state lost. Please <a href="#" onclick="window.AppAuth.logout()">Login Again</a></div>';const e=n.role==="Administrator"||n.isAdmin,t=e?await window.AppDB.getAll("users"):[],a=e&&window.app_profileTargetUserId?window.app_profileTargetUserId:n.id,s=e&&t.find(b=>b.id===a)||n,i=(b,v)=>{const k=String(b||"").trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(k))return"NA";const g=k.replace(/-/g,""),A=String(v||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase().slice(-3)||"USR";return`EMP-${g}-${A}`},o=typeof s.joinDate=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s.joinDate)?s.joinDate:"",r=o?s.employeeId||i(o,s.id):"NA",[d,l,c]=await Promise.all([window.AppAnalytics?window.AppAnalytics.getUserMonthlyStats(s.id):null,window.AppAnalytics?window.AppAnalytics.getUserYearlyStats(s.id):null,window.AppLeaves?window.AppLeaves.getUserLeaves(s.id):[]]);window.app_changeProfileStaff=async b=>{window.app_profileTargetUserId=b||n.id;const v=document.getElementById("page-content");v&&(v.innerHTML=await va())},window.app_confirmSignOut=()=>{confirm("Are you sure you want to sign out?")&&window.AppAuth.logout()};const f=s.id===n.id,u=d?.attendanceRate??"—",p=d?.punctualityRate??"—",m=d?.totalHours??"—",h=l?.totalDays??"—",y=b=>b==="Approved"?"#16a34a":b==="Rejected"?"#dc2626":"#d97706",w=(s.name||"U").split(" ").map(b=>b[0]).join("").slice(0,2).toUpperCase();return`
            <div class="pro-profile-root">

                <!-- ── Hero Banner ── -->
                <div class="pro-profile-hero">
                    <div class="pro-profile-hero-bg"></div>
                    <div class="pro-profile-hero-inner">
                        <!-- Avatar -->
                        <div class="pro-profile-avatar-ring">
                            ${s.avatar?`<img src="${$(s.avatar)}" alt="${$(s.name)}" class="pro-profile-avatar-img">`:`<div class="pro-profile-avatar-initials">${w}</div>`}
                            <span class="pro-profile-status-dot ${s.status==="in"?"online":"offline"}"
                                  title="${s.status==="in"?"Currently checked in":"Not checked in"}"></span>
                        </div>

                        <!-- Identity -->
                        <div class="pro-profile-identity">
                            <div class="pro-profile-name-row">
                                <h1 class="pro-profile-name">${$(s.name)}</h1>
                                <span class="pro-profile-role-badge">${$(s.role||"Staff")}</span>
                            </div>
                            <div class="pro-profile-email">
                                <i class="fa-solid fa-envelope"></i>
                                ${$(s.email||"—")}
                            </div>
                            <div class="pro-profile-meta-row">
                                <span class="pro-profile-chip">
                                    <i class="fa-solid fa-id-card"></i>${$(r)}
                                </span>
                                ${o?`<span class="pro-profile-chip">
                                    <i class="fa-solid fa-calendar-check"></i>Joined ${o}
                                </span>`:""}
                                ${s.department?`<span class="pro-profile-chip">
                                    <i class="fa-solid fa-building"></i>${$(s.department)}
                                </span>`:""}
                            </div>
                        </div>

                        <!-- Header Actions -->
                        <div class="pro-profile-header-actions">
                            ${e?`
                            <select class="pro-profile-staff-picker" onchange="window.app_changeProfileStaff(this.value)">
                                <option value="">My Profile</option>
                                ${t.map(b=>`<option value="${b.id}" ${b.id===a?"selected":""}>${$(b.name)}</option>`).join("")}
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
                        <div class="pro-stat-value">${u}${typeof u=="number"?"%":""}</div>
                        <div class="pro-stat-label">Attendance</div>
                    </div>
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-clock pro-stat-icon" style="color:#f59e0b;"></i>
                        <div class="pro-stat-value">${p}${typeof p=="number"?"%":""}</div>
                        <div class="pro-stat-label">Punctuality</div>
                    </div>
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-hourglass-half pro-stat-icon" style="color:#10b981;"></i>
                        <div class="pro-stat-value">${m}${typeof m=="number"?"h":""}</div>
                        <div class="pro-stat-label">Hours (MTD)</div>
                    </div>
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-calendar-days pro-stat-icon" style="color:#8b5cf6;"></i>
                        <div class="pro-stat-value">${h}</div>
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
                                <span class="pro-card-sub">${c.length} record${c.length!==1?"s":""}</span>
                            </div>
                            ${c.length?`
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
                                    ${c.slice(0,8).map(b=>`
                                    <tr>
                                        <td>${$(b.startDate||"—")}</td>
                                        <td>${$(b.endDate||"—")}</td>
                                        <td>${$(b.type||"—")}</td>
                                        <td>${b.daysCount??"—"}</td>
                                        <td>
                                            <span class="pro-status-pill" style="background:${y(b.status)}18;color:${y(b.status)};">
                                                ${$(b.status||"Pending")}
                                            </span>
                                        </td>
                                    </tr>`).join("")}
                                </tbody>
                            </table>
                            ${c.length>8?`<div class="pro-table-footer">Showing 8 of ${c.length} records</div>`:""}
                            `:'<div class="pro-empty-state"><i class="fa-regular fa-folder-open"></i><p>No leave records found.</p></div>'}
                        </div>

                        <!-- Yearly Breakdown -->
                        ${l?.breakdown?`
                        <div class="pro-card" style="margin-top:1rem;">
                            <div class="pro-card-head">
                                <span class="pro-card-title"><i class="fa-solid fa-chart-bar"></i> Yearly Breakdown</span>
                                <span class="pro-card-sub">${l.label||""}</span>
                            </div>
                            <div class="pro-breakdown-grid">
                                ${Object.entries(l.breakdown||{}).filter(([,b])=>b>0).map(([b,v])=>`
                                <div class="pro-breakdown-chip">
                                    <span class="pro-breakdown-count">${v}</span>
                                    <span class="pro-breakdown-key">${$(b)}</span>
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
                                ${[["Department",s.department||"Operations"],["Role",s.role||"Staff"],["Level",s.level||"—"],["Reports To",s.reportsTo||"Admin"],["Employee ID",r],["Join Date",o||"N/A"],["Payroll Cycle","Monthly (25th)"]].map(([b,v])=>`
                                <div class="pro-detail-row">
                                    <div class="pro-detail-label">${b}</div>
                                    <div class="pro-detail-value">${$(String(v))}</div>
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
        `}catch(n){return console.error("Profile Render Error:",n),`<div class="card error-card">Failed to load profile: ${$(n.message)}</div>`}}async function ba(n=null,e=null){const t=window.AppAuth.getUser(),a=window.app_hasPerm("attendance","admin",t),s=await window.AppDB.getAll("users"),i=new Date,o=n!==null?parseInt(n):i.getMonth(),r=e!==null?parseInt(e):i.getFullYear(),d=`${r}-${String(o+1).padStart(2,"0")}-01`,l=`${r}-${String(o+1).padStart(2,"0")}-31`;let c=[];try{c=(await window.AppDB.query("attendance","date",">=",d)).filter(A=>A.date<=l)}catch(g){console.warn("MasterSheet: query failed, fetching all attendance logs",g),c=(await window.AppDB.getAll("attendance")).filter(S=>S.date>=d&&S.date<=l)}const f=new Date(r,o+1,0).getDate(),u=Array.from({length:f},(g,A)=>A+1),p=["January","February","March","April","May","June","July","August","September","October","November","December"],m=g=>{const A=new Date(`${g}T00:00:00`),S=A.getDay();if(S===0)return"holiday";if(S===6){const _=Math.floor((A.getDate()-1)/7)+1;if(_===2||_===4)return"holiday";if(_===1||_===3||_===5)return"halfday"}return"working"},h=g=>String(g?.type||"").includes("Leave")||g?.location==="On Leave",y=g=>!g||!g.checkOut||g.checkOut==="Active Now"?!1:typeof g.activityScore<"u"||typeof g.locationMismatched<"u"||!!g.checkOutLocation||typeof g.outLat<"u"||typeof g.outLng<"u",w=g=>g?.isManualOverride?4:h(g)?3:y(g)?2:1,b=g=>{if(Object.prototype.hasOwnProperty.call(g||{},"attendanceEligible"))return g.attendanceEligible===!0;const A=String(g?.entrySource||"");return A==="staff_manual_work"?!1:A==="admin_override"||A==="checkin_checkout"||g?.isManualOverride||g?.location==="Office (Manual)"||g?.location==="Office (Override)"||typeof g?.activityScore<"u"||typeof g?.locationMismatched<"u"||typeof g?.autoCheckout<"u"||!!g?.checkOutLocation||typeof g?.outLat<"u"||typeof g?.outLng<"u"?!0:String(g?.type||"").includes("Leave")||g?.location==="On Leave"},v=new Date().toISOString().split("T")[0],k=g=>{const A=new Date(g);return`${A.getFullYear()}-${String(A.getMonth()+1).padStart(2,"0")}-${String(A.getDate()).padStart(2,"0")}`};return window.app_refreshMasterSheet=async()=>{const g=document.getElementById("sheet-month")?.value,A=document.getElementById("sheet-year")?.value,S=document.getElementById("page-content");S&&(S.innerHTML=await ba(g,A))},`
        <div class="dashboard-grid dashboard-modern dashboard-admin-view">
            <div class="card full-width">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                    <div>
                        <h2 style="font-size:1.1rem; margin-bottom:0.1rem;">Attendance Sheet</h2>
                        <p style="color:var(--text-muted); font-size:0.75rem;">Master grid view for all staff logs.</p>
                    </div>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <select onchange="window.app_refreshMasterSheet()" id="sheet-month" style="padding:0.4rem; border-radius:6px; border:1px solid #ddd; font-size:0.8rem;">
                            ${p.map((g,A)=>`<option value="${A}" ${A===o?"selected":""}>${g}</option>`).join("")}
                        </select>
                        <select onchange="window.app_refreshMasterSheet()" id="sheet-year" style="padding:0.4rem; border-radius:6px; border:1px solid #ddd; font-size:0.8rem;">
                            <option value="${r}" selected>${r}</option>
                            <option value="${r-1}">${r-1}</option>
                        </select>
                        ${a?`
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
                            ${s.sort((g,A)=>g.name.localeCompare(A.name)).map((g,A)=>`
                                <tr>
                                    <td style="text-align:center; border-right: 1px solid #eee; position: sticky; left: 0; background: #fff; z-index: 5; padding:4px; font-size:0.75rem;">${A+1}</td>
                                    <td style="border-right: 2px solid #ddd; position: sticky; left: 35px; background: #fff; z-index: 5; font-weight: 500; padding:4px;">
                                        <div style="display:flex; flex-direction:column;">
                                            <span style="font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px;">${$(g.name)}</span>
                                            <span style="font-size:0.65rem; color:#666; font-weight:400;">${$(g.dept||"General")}</span>
                                        </div>
                                    </td>
                                    ${u.map(S=>{const _=`${r}-${String(o+1).padStart(2,"0")}-${String(S).padStart(2,"0")}`,I=c.filter(P=>(P.userId===g.id||P.user_id===g.id)&&P.date===_).filter(b),O=m(_);let E="-",D="",M="No log";if(I.length>0){const P=I.slice().sort((R,H)=>w(H)-w(R))[0],C=window.AppAttendance&&window.AppAttendance.normalizeType?window.AppAttendance.normalizeType(P.type):P.type;E=C.charAt(0).toUpperCase(),M=`${P.checkIn} - ${P.checkOut||"Active"}
${C}`,C==="Present"?D="color: #10b981; font-weight: bold; font-size: 0.9rem;":C==="Late"?(D="color: #f59e0b; font-weight: bold;",E="L"):C==="Half Day"?(D="color: #c2410c; font-weight: bold;",E="HD"):C==="Absent"?(D="color: #ef4444; font-weight: bold;",E="A"):C.includes("Leave")?(D="color: #8b5cf6; font-weight: bold;",E="C"):C==="Work - Home"?(D="color: #0ea5e9; font-weight: bold;",E="W"):C==="On Duty"&&(D="color: #0369a1; font-weight: bold;",E="D"),P.isManualOverride&&(D="color: #be185d; font-weight: bold; background: #fdf2f8;")}else{const P=_===v&&g.status==="in"&&g.lastCheckIn&&k(g.lastCheckIn)===_,C=typeof g.joinDate=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(g.joinDate)?_<g.joinDate:!1,R=_>v;P?(E="P",D="color: #10b981; font-weight: bold; font-size: 0.9rem;",M="Checked in (pending checkout)"):R||C?(E="-",D="color: #94a3b8; font-weight: 600;",M=R?"Future date":`Before joining date (${g.joinDate})`):O==="holiday"?(E="H",D="color: #64748b; font-weight: 700;",M="Holiday"):(E="A",D="color: #ef4444; font-weight: bold;",M="Absent")}return a||t&&(g.id===t.id||g.user_id===t.id||g.username&&t.username&&g.username===t.username||g.email&&t.email&&g.email===t.email)||(M=""),`<td style="text-align:center; ${a?"cursor:pointer;":""} border-right: 1px solid #eee; padding:2px; font-size:0.75rem; ${D}" ${M?`title="${M}"`:""} ${a?`onclick="window.app_openCellOverride('${g.id}', '${_}')"`:""}>${E}</td>`}).join("")}
                                </tr>`).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`}async function Tt(n=null,e=null){let t=[],a=[],s={avgScore:0,trendData:[0,0,0,0,0,0,0],labels:[]},i=[],o=[];try{const p=new Date().toISOString().split("T")[0];n=n||p,e=e||p;const m=await Promise.allSettled([window.AppDB.getCached?window.AppDB.getCached(window.AppDB.getCacheKey("adminUsers","users",{}),x?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):window.AppDB.getAll("users"),window.AppAnalytics.getSystemPerformance(),window.AppDB.queryMany?window.AppDB.queryMany("location_audits",[],{orderBy:[{field:"timestamp",direction:"desc"}],limit:300}).catch(()=>window.AppDB.getAll("location_audits")):window.AppDB.getAll("location_audits"),window.AppLeaves.getPendingLeaves(),window.AppDB.queryMany?window.AppDB.queryMany("system_audit_logs",[],{orderBy:[{field:"createdAt",direction:"desc"}],limit:80}).catch(()=>window.AppDB.getAll("system_audit_logs")):window.AppDB.getAll("system_audit_logs")]),h=(y,w,b)=>{const v=m[y];return v&&v.status==="fulfilled"?v.value:(v&&v.status==="rejected"&&console.warn(`Admin data fetch failed for ${b}:`,v.reason),w)};t=h(0,[],"users"),s=h(1,{avgScore:0,trendData:[0,0,0,0,0,0,0],labels:[]},"performance"),i=h(2,[],"location_audits"),a=h(3,[],"pending_leaves"),o=h(4,[],"system_audit_logs"),i=i.filter(y=>{const w=new Date(y.timestamp).toISOString().split("T")[0];return w>=n&&w<=e}).sort((y,w)=>w.timestamp-y.timestamp),o=(o||[]).filter(y=>y&&y.module==="simulation"&&String(y.type||"").startsWith("legacy_dummy_cleanup_")).sort((y,w)=>Number(w.createdAt||0)-Number(y.createdAt||0)).slice(0,25)}catch(p){console.error("Failed to fetch admin data",p)}const r=t.filter(p=>p.status==="in").length,d=t.filter(p=>p.role==="Administrator"||p.isAdmin===!0).length,l=s.avgScore>70?"Optimal":s.avgScore>40?"Good":"Low",c=s.avgScore>70?"#166534":s.avgScore>40?"#854d0e":"#991b1b",f=s.avgScore>70?"#f0fdf4":s.avgScore>40?"#fefce8":"#fef2f2",u=p=>{const m=p&&p.payload?p.payload:{},h=m.deleted||{},y=m.configuredTargets||{};if(p.type==="legacy_dummy_cleanup_completed")return[`users=${Number(h.users||0)}`,`attendance=${Number(h.attendance||0)}`,`leaves=${Number(h.leaves||0)}`,`workPlans=${Number(h.workPlans||0)}`].join(", ");if(p.type==="legacy_dummy_cleanup_skipped"){const w=m.reason||"unknown",b=Array.isArray(y.ids)?y.ids.length:0,v=Array.isArray(y.usernames)?y.usernames.length:0;return`reason=${w}, targetIds=${b}, targetUsernames=${v}`}return p.type==="legacy_dummy_cleanup_failed"?String(m.message||"Unknown error"):"-"};return window.app_applyAuditFilter=async()=>{const p=document.getElementById("audit-start")?.value,m=document.getElementById("audit-end")?.value,h=document.getElementById("page-content");h&&(h.innerHTML=await Tt(p,m))},window.app_refreshAdminPage=async()=>{const p=document.getElementById("audit-start")?.value||n,m=document.getElementById("audit-end")?.value||e,h=document.getElementById("page-content");h&&(h.innerHTML=await Tt(p,m))},`
        <div class="dashboard-grid dashboard-modern dashboard-admin-view">
            <div class="card admin-kpi-card">
                <span class="admin-kpi-label">Total Registered Staff</span>
                <h2 class="admin-kpi-value">${t.length}</h2>
                <div class="admin-kpi-grid">
                    <div class="admin-kpi-pill">
                        <div class="admin-kpi-pill-value">${r}</div>
                        <div class="admin-kpi-pill-label">Active</div>
                    </div>
                    <div class="admin-kpi-pill">
                        <div class="admin-kpi-pill-value">${d}</div>
                        <div class="admin-kpi-pill-label">Admins</div>
                    </div>
                </div>
            </div>

            ${window.app_hasPerm("leaves","view")?`
            <div class="card full-width admin-section-card">
                 <h3 class="admin-section-title">Pending Leave Requests (${a.length})</h3>
                 ${a.length===0?'<p class="text-muted">No pending requests.</p>':`
                    <div class="table-container">
                        <table class="compact-table">
                            <thead>
                                <tr><th>Date</th><th>Staff</th><th>Type</th><th>Days</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                ${a.map(p=>`
                                    <tr>
                                        <td>${new Date(p.startDate).toLocaleDateString()}</td>
                                        <td>${$(p.userName)}</td>
                                        <td><span class="admin-leave-type-badge">${$(p.type)}</span></td>
                                        <td>${p.daysCount}</td>
                                        <td>
                                                <div class="admin-leave-actions">
                                                ${window.app_hasPerm("leaves","admin")?`
                                                    <button onclick="window.AppLeaves.updateLeaveStatus('${p.id}', 'Approved', window.AppAuth?.getUser?.()?.id).then(() => window.app_refreshAdminPage())" class="admin-btn admin-btn-success">Approve</button>
                                                    <button onclick="window.AppLeaves.updateLeaveStatus('${p.id}', 'Rejected', window.AppAuth?.getUser?.()?.id).then(() => window.app_refreshAdminPage())" class="admin-btn admin-btn-danger">Reject</button>
                                                `:'<span class="text-muted" style="font-size:0.7rem;">View Only</span>'}
                                            </div>
                                        </td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                 `}
            </div>
            `:""}

            <div class="card admin-performance-card">
                <div class="admin-performance-head">
                    <div>
                        <h4 class="admin-performance-title">System Performance</h4>
                        <p class="text-muted">Avg. Activity: ${s.avgScore}%</p>
                    </div>
                    <div class="admin-performance-status" style="background:${f}; color:${c};">${l}</div>
                </div>
                <div class="admin-performance-bars">
                    ${s.trendData.map(p=>`<div class="admin-performance-bar-item"><div class="admin-performance-bar-fill" style="height:${Math.max(p,5)}%;"></div></div>`).join("")}
                </div>
            </div>

            ${window.app_hasPerm("users","view")?`
            <div class="card full-width">
                <div class="admin-staff-head">
                    <h3 class="admin-staff-title">Staff Management</h3>
                    <div class="admin-staff-head-actions">
                        ${window.app_hasPerm("users","admin")?`<button class="action-btn" onclick="document.getElementById('add-user-modal').style.display='flex'"><i class="fa-solid fa-user-plus"></i> Add Staff</button>`:""}
                    </div>
                </div>
                 <div class="table-container mobile-table-card">
                    <table>
                        <thead>
                            <tr><th>Staff Member</th><th>Status</th><th>In / Out</th><th>Role / Dept</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            ${t.map(p=>{const m=p.lastSeen&&Date.now()-p.lastSeen<12e4;return`
                                <tr>
                                    <td>
                                        <div class="admin-user-cell">
                                            <img src="${p.avatar}" class="admin-user-avatar">
                                            <div>
                                                <div class="admin-user-name-row">${$(p.name)} ${m?'<span class="admin-user-live-tag">LIVE</span>':""}</div>
                                                <div class="admin-user-id">${$(p.username)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span class="status-badge ${p.status==="in"?"in":"out"}">${p.status?.toUpperCase()}</span></td>
                                    <td>${p.lastCheckIn?new Date(p.lastCheckIn).toLocaleTimeString():"--"} / ${p.lastCheckOut?new Date(p.lastCheckOut).toLocaleTimeString():"--"}</td>
                                    <td>${$(p.role)} / ${$(p.dept||"--")}</td>
                                    <td>
                                        <div class="admin-row-actions">
                                            <button onclick="window.app_viewLogs('${p.id}')" class="admin-icon-btn"><i class="fa-solid fa-list-check"></i></button>
                                            ${window.app_hasPerm("users","admin")?`<button onclick="window.app_editUser('${p.id}')" class="admin-icon-btn"><i class="fa-solid fa-pen"></i></button>`:""}
                                        </div>
                                    </td>
                                </tr>`}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
            `:""}

            <div class="card full-width">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h3>Security Audits</h3>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <input type="date" id="audit-start" value="${n}" style="font-size:0.75rem;">
                        <input type="date" id="audit-end" value="${e}" style="font-size:0.75rem;">
                        <button onclick="window.app_applyAuditFilter()" class="action-btn">Filter</button>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Staff</th><th>Slot</th><th>Time</th><th>Status</th></tr></thead>
                        <tbody>
                            ${i.length?i.map(p=>`
                                <tr>
                                    <td>${$(p.userName)}</td>
                                    <td>${$(p.slot)}</td>
                                    <td>${new Date(p.timestamp).toLocaleTimeString()}</td>
                                    <td style="color:${p.status==="Success"?"green":"red"}">${p.status}</td>
                                </tr>
                            `).join(""):'<tr><td colspan="4" class="text-center">No audits found</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card full-width">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h3>Simulation Cleanup Audit (Debug)</h3>
                    <span class="text-muted" style="font-size:0.75rem;">Last ${o.length} entries</span>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Time</th><th>Event</th><th>Summary</th></tr></thead>
                        <tbody>
                            ${o.length?o.map(p=>`
                                <tr>
                                    <td>${new Date(Number(p.createdAt||0)).toLocaleString()}</td>
                                    <td>${$(p.type||"-")}</td>
                                    <td>${$(u(p))}</td>
                                </tr>
                            `).join(""):'<tr><td colspan="3" class="text-center">No simulation cleanup audit entries found</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`}async function cn(){const n=await window.AppAnalytics.getSystemMonthlySummary(),e=new Date,t=window.AppAuth.getUser(),a=window.app_hasPerm("reports","admin",t);return`
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
                    ${a?'<button class="action-btn" onclick="window.app_saveAllSalaries()" style="padding: 0.6rem 1.2rem;">Save All & Lock</button>':""}
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
                        ${n.map(i=>{const{user:o,stats:r}=i,d=Number(o.baseSalary||0),l=Number(r.unpaidLeaves||0),c=Number(r.late||0),f=Number(r.extraWorkedHours||0),u=window.AppConfig?.LATE_GRACE_COUNT||3,p=window.AppConfig?.LATE_DEDUCTION_PER_BLOCK||.5,m=window.AppConfig?.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4,h=Math.floor(c/u)*p,y=Math.floor(f/m)*p,w=Math.min(h,y),b=Math.max(0,h-w),v=l+b,k=Math.round(d/22*v),g=Math.round(Math.max(0,d-k)),A=o.employeeId||"",S=o.designation||o.role||"",_=o.dept||o.department||"",L=o.joinDate||"",I=o.bankName||"",O=o.bankAccount||o.accountNumber||"",E=o.pan||o.PAN||"",D=o.uan||o.UAN||"",M=Number(o.otherAllowances||0),B=Number(o.providentFund||0),P=Number(o.professionalTax||0),C=Number(o.loanAdvance||0);return`
                                <tr data-user-id="${o.id}">
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                                            <img src="${o.avatar}" style="width: 28px; height: 28px; border-radius: 50%;">
                                            <div style="font-weight: 600;">${$(o.name)}</div>
                                        </div>
                                    </td>
                                    <td><input type="number" class="base-salary-input" value="${d}" style="width: 80px;" onchange="window.app_recalculateRow(this.closest('tr'))"></td>
                                    <td><span class="present-count">${r.present}</span></td>
                                    <td><span class="late-count">${c}</span></td>
                                    <td><span class="unpaid-leaves-count">${l}</span></td>
                                    <td><span class="extra-work-hours">${f.toFixed(2)}</span></td>
                                    <td><span class="late-deduction-raw">${h.toFixed(1)}</span></td>
                                    <td><span class="penalty-offset-days">${w.toFixed(1)}</span></td>
                                    <td><span class="late-deduction-days">${b.toFixed(1)}</span></td>
                                    <td><span class="deduction-days">${v.toFixed(1)}</span></td>
                                    <td class="attendance-deduction-amount" style="color:#ef4444;">-Rs ${k.toLocaleString()}</td>
                                    <td class="deduction-amount" style="display:none;">-Rs ${k.toLocaleString()}</td>
                                    <td><input type="number" class="salary-input" value="${g}" style="width: 90px;"></td>
                                    <td><input type="number" class="tds-input" value="" placeholder="Global" style="width: 60px;" onchange="window.app_recalculateRow(this.closest('tr'))"></td>
                                    <td class="final-net-salary" data-value="${g}" style="font-weight:700; color:#1e40af;">Rs ${g.toLocaleString()}</td>
                                    <td class="tds-amount" data-value="0" style="display:none;">Rs 0</td>

                                    <td style="display:none;"><input class="employee-id-input" type="text" value="${$(A)}"></td>
                                    <td style="display:none;"><input class="designation-input" type="text" value="${$(S)}"></td>
                                    <td style="display:none;"><input class="department-input" type="text" value="${$(_)}"></td>
                                    <td style="display:none;"><input class="join-date-input" type="date" value="${$(L)}"></td>
                                    <td style="display:none;"><input class="bank-name-input" type="text" value="${$(I)}"></td>
                                    <td style="display:none;"><input class="bank-account-input" type="text" value="${$(O)}"></td>
                                    <td style="display:none;"><input class="pan-input" type="text" value="${$(E)}"></td>
                                    <td style="display:none;"><input class="uan-input" type="text" value="${$(D)}"></td>
                                    <td style="display:none;"><input class="other-allowances-input" type="number" value="${M}"></td>
                                    <td style="display:none;"><input class="pf-input" type="number" value="${B}"></td>
                                    <td style="display:none;"><input class="professional-tax-input" type="number" value="${P}"></td>
                                    <td style="display:none;"><input class="loan-advance-input" type="number" value="${C}"></td>
                                    <td style="display:none;"><input class="comment-input" type="text" value=""></td>

                                    <td><button class="action-btn secondary" onclick="window.app_generateSalarySlip('${o.id}')">Slip</button></td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `}async function pn(){const n=new Date().toISOString().split("T")[0];return window.app_runPolicyTest=()=>{const e=document.getElementById("policy-test-checkin")?.value,t=document.getElementById("policy-test-checkout")?.value,a=document.getElementById("policy-test-output");if(!e||!t||!a)return;const s=document.getElementById("policy-test-date")?.value,i=new Date(`${s}T${e}`),r=(new Date(`${s}T${t}`)-i)/(1e3*60*60);let d="Absent";r>=8?d="Present":r>=4&&(d="Half Day"),a.innerHTML=`
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <div class="stat-card"><div class="label">Status</div><div class="value">${d}</div></div>
                <div class="stat-card"><div class="label">Duration</div><div class="value">${r.toFixed(2)} hrs</div></div>
            </div>
        `},`
        <div class="card full-width">
            <h3 style="margin-bottom:1rem;">Policy Simulator</h3>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1rem; margin-bottom:1rem;">
                <input type="date" id="policy-test-date" value="${n}">
                <input type="time" id="policy-test-checkin" value="09:00">
                <input type="time" id="policy-test-checkout" value="18:00">
            </div>
            <button class="action-btn" onclick="window.app_runPolicyTest()">Test Outcome</button>
            <div id="policy-test-output" style="margin-top:1.5rem;"></div>
        </div>
    `}async function Sa(){const n=await window.AppMinutes.getMinutes(),e=window.AppDB?.getAll?await window.AppDB.getAll("users"):[],t=window.AppAuth.getUser(),a=window.AppCalendar?await window.AppCalendar.getPlans():{leaves:[],events:[],work:[]},s=(u,p=t)=>!u||!p?!1:!!(window.app_hasPerm("minutes","view",p)||u.createdBy===p.id||(u.attendeeIds||[]).includes(p.id)||(u.allowedViewers||[]).includes(p.id)||(u.actionItems||[]).some(m=>m.assignedTo===p.id)),i=(u,p=t.id)=>{const m=(u.accessRequests||[]).find(h=>h.userId===p);return m?m.status:""},o=(u="")=>{const h=new DOMParser().parseFromString(`<div>${u||""}</div>`,"text/html").body.firstElementChild;if(!h)return"";const y=new Set(["P","BR","B","STRONG","I","EM","U","H2","H3","UL","OL","LI","A"]),w={A:new Set(["href","target","rel"])},b=v=>{!v||!v.childNodes||Array.from(v.childNodes).forEach(k=>{if(k.nodeType===Node.ELEMENT_NODE){const g=k;if(!y.has(g.tagName)){for(;g.firstChild;)v.insertBefore(g.firstChild,g);v.removeChild(g);return}if(Array.from(g.attributes).forEach(A=>{const S=w[g.tagName];(!S||!S.has(A.name.toLowerCase()))&&g.removeAttribute(A.name)}),g.tagName==="A"){const A=(g.getAttribute("href")||"").trim();/^(https?:|mailto:|#)/i.test(A)?(g.setAttribute("target","_blank"),g.setAttribute("rel","noopener noreferrer")):g.removeAttribute("href")}}b(k)})};return b(h),h.innerHTML.trim()},r=(u="")=>{const p=document.createElement("div");return p.innerHTML=u||"",(p.innerText||p.textContent||"").replace(/\r/g,"").trim()},d=(u="")=>$(u||"").replace(/\n/g,"<br>"),l=(u,p="")=>{const m=document.getElementById(u),h=m?m.innerHTML:"",y=o(h);let w=r(y);return!w&&p&&(w=(document.getElementById(p)?.value||"").trim()),{html:y,text:w}},c=(u="",p="")=>{const m=o(u||"");return m||$(p||"").replace(/\n/g,"<br>")};let f=new Set;return window.app_toggleNewMinuteForm=()=>{const u=document.getElementById("new-minute-form");if(u&&(u.style.display=u.style.display==="none"?"block":"none",u.style.display==="block")){f=new Set,window.app_refreshAttendeeChips(),document.querySelectorAll('.attendee-grid input[type="checkbox"]').forEach(h=>h.checked=!1);const p=document.getElementById("action-items-container");p&&(p.innerHTML="",window.app_addActionItemRow());const m=document.getElementById("new-minute-content-editor");m&&(m.innerHTML="")}},window.app_refreshMinutesView=async()=>{const u=document.getElementById("page-content");u&&(u.innerHTML=await Sa())},window.app_minutesExec=(u,p,m=null)=>{const h=document.getElementById(u);h&&(h.focus(),document.execCommand(p,!1,m))},window.app_minutesFormatBlock=(u,p)=>{window.app_minutesExec(u,"formatBlock",p)},window.app_filterAttendees=u=>{const p=u.toLowerCase();document.querySelectorAll(".attendee-item-modern").forEach(m=>{const h=(m.dataset.name||"").toLowerCase();m.style.display=h.includes(p)?"flex":"none"})},window.app_filterMinutes=u=>{const p=u.toLowerCase();document.querySelectorAll(".minute-card-modern").forEach(m=>{const h=m.querySelector(".card-title-modern")?.textContent.toLowerCase()||"",y=m.querySelector(".card-date-badge")?.textContent.toLowerCase()||"";m.style.display=h.includes(p)||y.includes(p)?"flex":"none"})},window.app_toggleAttendeePick=u=>{u.checked?f.add(u.value):f.delete(u.value),window.app_refreshAttendeeChips()},window.app_refreshAttendeeChips=()=>{const u=document.getElementById("minutes-attendee-chips");u&&(u.innerHTML=Array.from(f).map(p=>{const m=e.find(h=>h.id===p);return`
                <div class="chip-modern">
                    <span>${$(m?.name||m?.username||"Unknown")}</span>
                    <i class="fa-solid fa-circle-xmark" onclick="window.app_removeAttendee('${p}')"></i>
                </div>
            `}).join(""))},window.app_removeAttendee=u=>{f.delete(u);const p=document.querySelector(`.attendee-item-modern input[value="${u}"]`);p&&(p.checked=!1),window.app_refreshAttendeeChips()},window.app_addActionItemRow=()=>{const u=document.getElementById("action-items-container");if(!u)return;const p=document.createElement("div");p.className="action-item-row-card",p.innerHTML=`
            <div class="field-group">
                <input type="text" placeholder="What needs to be done?" class="input-premium action-task">
            </div>
            <div class="field-group">
                <select class="input-premium action-assignee">
                    <option value="">Assignee...</option>
                    ${e.map(m=>`<option value="${m.id}">${$(m.name||m.username)}</option>`).join("")}
                </select>
            </div>
            <div class="field-group">
                <input type="date" class="input-premium action-due" value="${new Date().toISOString().split("T")[0]}">
            </div>
            <button type="button" onclick="this.parentElement.remove()" class="icon-btn-danger" style="background:#fee2e2; color:#ef4444; border:none; width:40px; height:40px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `,u.appendChild(p)},window.app_submitNewMinutes=async()=>{const u=document.getElementById("new-minute-title").value.trim(),p=document.getElementById("new-minute-date").value,m=l("new-minute-content-editor","new-minute-content"),h=m.text,y=Array.from(f),w=Array.from(document.querySelectorAll(".action-item-row-card")).map(b=>({task:b.querySelector(".action-task").value.trim(),assignedTo:b.querySelector(".action-assignee").value,dueDate:b.querySelector(".action-due").value,status:"pending"})).filter(b=>b.task);if(!u||!h)return alert("Title and content are required.");try{await window.AppMinutes.addMinute({title:u,date:p,content:h,contentHtml:m.html,attendeeIds:y,actionItems:w}),alert("Meeting minutes recorded!"),window.app_refreshMinutesView()}catch(b){alert("Error saving: "+b.message)}},window.app_requestMinuteAccess=async u=>{try{await window.AppMinutes.requestAccess(u),alert("Access requested!"),window.app_refreshMinutesView()}catch(p){alert("Error: "+p.message)}},window.app_handleMinuteApproval=async u=>{if(confirm("Are you sure you want to approve these minutes? This will lock the record if you are the last attendee to sign."))try{await window.AppMinutes.approveMinute(u),alert("Minutes approved!"),window.app_openMinuteDetails(u),window.app_refreshMinutesView()}catch(p){alert("Error: "+p.message)}},window.app_handleActionItemStatus=async(u,p,m)=>{try{await window.AppMinutes.updateActionItemStatus(u,p,m),alert(`Task marked as ${m}!`),window.app_openMinuteDetails(u)}catch(h){alert("Error: "+h.message)}},window.app_handleAccessDecision=async(u,p,m)=>{try{await window.AppMinutes.handleAccessRequest(u,p,m),alert(`Request ${m}!`),window.app_openMinuteDetails(u)}catch(h){alert("Error: "+h.message)}},window.app_saveMinuteEdits=async u=>{try{const m=(await window.AppMinutes.getMinutes()).find(_=>_.id===u);if(!m)return alert("Minute not found.");const h=window.AppAuth.getUser(),y=m.createdBy===h.id,w=window.app_hasPerm("minutes","admin",h);if(!y&&!w)return alert("Only owner or admin can edit these minutes.");if(m.locked)return alert("This record is locked after final approvals.");const b=document.getElementById("minute-edit-title"),v=document.getElementById("minute-edit-date"),k=l("minute-edit-content-editor","minute-edit-content"),g=(b?.value||"").trim(),A=(v?.value||"").trim(),S=k.text;if(!g||!S)return alert("Title and content are required.");await window.AppMinutes.updateMinute(u,{title:g,date:A||m.date,content:S,contentHtml:k.html},"Edited meeting details"),alert("Minutes updated successfully."),window.app_openMinuteDetails(u),window.app_refreshMinutesView()}catch(p){alert("Error updating minutes: "+p.message)}},window.app_openMinuteDetails=async u=>{const m=(await window.AppMinutes.getMinutes()).find(D=>D.id===u);if(!m)return;if(!s(m))return alert("Access Restricted. Please request access from the list view.");const h=(m.attendeeIds||[]).includes(t.id),y=m.approvals&&m.approvals[t.id],w=m.createdBy===t.id,b=window.app_hasPerm("minutes","admin",t),v=(w||b)&&!m.locked,k=m.createdByName||e.find(D=>D.id===m.createdBy)?.name||"Unknown",g=m.lastEditedByName||k,A=m.lastEditedAt||m.createdAt,S=o(m.contentHtml||d(m.content||"")),_=(m.attendeeIds||[]).map(D=>{const M=e.find(P=>P.id===D),B=m.approvals&&m.approvals[D];return`
                <div class="approval-chip ${B?"approved":"pending"}">
                    <i class="fa-solid fa-${B?"check-circle":"clock"}"></i>
                    ${$(M?.name||"Unknown")}
                </div>
            `}).join(""),L=(m.actionItems||[]).map((D,M)=>{const B=e.find(C=>C.id===D.assignedTo),P=D.assignedTo===t.id;return`
                <div class="detail-action-item">
                    <div class="action-status-dot ${D.status||"pending"}"></div>
                    <div class="action-main">
                        <strong>${$(D.task)}</strong>
                        <span class="action-meta">Assigned: ${$(B?.name||"Unassigned")} | Due: ${D.dueDate||"N/A"}</span>
                    </div>
                    ${P&&D.status!=="completed"?`
                        <div class="action-btns">
                            ${D.status==="pending"?`<button class="mini-btn" onclick="window.app_handleActionItemStatus('${m.id}', ${M}, 'accepted')">Accept</button>`:""}
                            <button class="mini-btn success" onclick="window.app_handleActionItemStatus('${m.id}', ${M}, 'completed')">Complete</button>
                        </div>
                    `:""}
                </div>
            `}).join(""),I=(m.accessRequests||[]).filter(D=>D.status==="pending").map(D=>`
            <div class="access-request-row">
                <span>${$(D.userName)}</span>
                <div class="req-btns">
                    <button class="mini-btn success" onclick="window.app_handleAccessDecision('${m.id}', '${D.userId}', 'approved')">Approve</button>
                    <button class="mini-btn danger" onclick="window.app_handleAccessDecision('${m.id}', '${D.userId}', 'rejected')">Deny</button>
                </div>
            </div>
        `).join(""),O=(m.auditLog||[]).slice().reverse().map(D=>`
            <div class="access-request-row" style="justify-content:space-between; align-items:flex-start;">
                <div style="display:flex; flex-direction:column; gap:0.2rem;">
                    <strong style="font-size:0.82rem;">${$(D.userName||"Unknown")}</strong>
                    <span style="font-size:0.75rem; color:#64748b;">${$(D.action||"Updated")}</span>
                </div>
                <span style="font-size:0.74rem; color:#64748b; white-space:nowrap;">${D.timestamp?new Date(D.timestamp).toLocaleString():"-"}</span>
            </div>
        `).join(""),E=`
            <div class="modal-overlay" id="minute-detail-modal" style="display:flex;">
                <div class="modal-content minutes-detail-wide">
                    <div class="modal-header">
                        <div>
                            <span class="detail-date">${new Date(m.date).toLocaleDateString()}</span>
                            <h2 style="margin:0; color:#1e1b4b;">${$(m.title)}</h2>
                            <div style="font-size:0.78rem; color:#64748b; margin-top:0.35rem;">
                                Created by ${$(k)} on ${m.createdAt?new Date(m.createdAt).toLocaleString():"-"}
                            </div>
                            <div style="font-size:0.78rem; color:#64748b;">
                                Last edited by ${$(g)} on ${A?new Date(A).toLocaleString():"-"}
                            </div>
                        </div>
                        <button onclick="document.getElementById('minute-detail-modal').remove()" class="close-modal-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-grid">
                            <div class="main-column">
                                <section>
                                    <label><i class="fa-solid fa-file-lines"></i> Discussion & Decisions</label>
                                    ${v?`
                                        <div style="display:grid; gap:0.6rem; margin-top:0.55rem;">
                                            <input id="minute-edit-title" class="input-premium" value="${st(m.title||"")}" />
                                            <input id="minute-edit-date" class="input-premium" type="date" value="${st(m.date||"")}" />
                                            <textarea id="minute-edit-content" class="textarea-premium" style="display:none;">${$(m.content||"")}</textarea>
                                            <div class="rich-editor-shell">
                                                <div class="rich-editor-toolbar">
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','bold')"><i class="fa-solid fa-bold"></i></button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','italic')"><i class="fa-solid fa-italic"></i></button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesFormatBlock('minute-edit-content-editor','H2')">H2</button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesFormatBlock('minute-edit-content-editor','H3')">H3</button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','insertUnorderedList')"><i class="fa-solid fa-list-ul"></i></button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','insertOrderedList')"><i class="fa-solid fa-list-ol"></i></button>
                                                </div>
                                                <div id="minute-edit-content-editor" class="rich-editor-area" contenteditable="true">${S}</div>
                                            </div>
                                        </div>
                                    `:`<div class="content-text rich-minutes-content">${c(m.contentHtml,m.content)}</div>`}
                                </section>
                                ${L?`
                                <section>
                                    <label><i class="fa-solid fa-list-check"></i> Action Items</label>
                                    <div class="action-items-list">${L}</div>
                                </section>
                                `:""}
                                <section>
                                    <label><i class="fa-solid fa-clock-rotate-left"></i> Edit History</label>
                                    <div class="access-requests-list" style="max-height:230px;">${O||'<p class="empty">No edit history yet.</p>'}</div>
                                </section>
                            </div>
                            <div class="side-column">
                                <section>
                                    <label><i class="fa-solid fa-users-check"></i> Approvals</label>
                                    <div class="approvals-stack">${_||'<p class="empty">No attendees defined</p>'}</div>
                                    ${h&&!y&&!m.locked?`<button class="action-btn wide" onclick="window.app_handleMinuteApproval('${m.id}')" style="margin-top:1rem;">Approve Minutes</button>`:""}
                                </section>
                                ${(w||b)&&I?`
                                <section class="owner-only">
                                    <label><i class="fa-solid fa-key"></i> Access Requests</label>
                                    <div class="access-requests-list">${I}</div>
                                </section>
                                `:""}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${m.locked?'<span class="status-locked-msg"><i class="fa-solid fa-lock"></i> Record Locked (All approved)</span>':""}
                        <div style="flex:1"></div>
                        <button class="action-btn secondary" onclick="document.getElementById('minute-detail-modal').remove()">Close</button>
                        ${v?`<button class="action-btn" onclick="window.app_saveMinuteEdits('${m.id}')">Save Changes</button>`:""}
                        ${w||b?`<button class="action-btn danger" onclick="window.app_deleteMinute('${m.id}')">Delete</button>`:""}
                    </div>
                </div>
            </div>
        `;if(!document.getElementById("modal-container")){const D=document.createElement("div");D.id="modal-container",document.body.appendChild(D)}document.getElementById("modal-container").innerHTML=E},window.app_deleteMinute=async u=>{if(confirm("Are you sure?"))try{await window.AppMinutes.deleteMinute(u),document.getElementById("minute-detail-modal")?.remove(),window.app_refreshMinutesView()}catch(p){alert("Error: "+p.message)}},`
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

                @media (max-width: 768px) {
                    .form-row { grid-template-columns: 1fr; gap: 1rem; }
                    .form-glass-card { padding: 1rem; }
                    .action-item-row-card { grid-template-columns: 1fr; padding: 1rem; }
                    .minutes-header-section { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .btn-record-meeting { width: 100%; justify-content: center; }
                    .rich-editor-toolbar { gap: 0.25rem; padding: 0.45rem; }
                    .rich-editor-btn { min-width: 30px; height: 30px; font-size: 0.78rem; }
                    .rich-editor-area { font-size: 0.88rem; min-height: 140px; }
                    .attendee-picker-container { padding: 0.7rem; }
                    .attendee-grid { grid-template-columns: 1fr; max-height: 170px; }
                }
            </style>

            <div class="minutes-header-section">
                <div class="minutes-header-info">
                    <h2>Meeting Minutes</h2>
                    <p>Document decisions and track team accountability.</p>
                </div>
                <button class="btn-record-meeting" onclick="window.app_toggleNewMinuteForm()">
                    <i class="fa-solid fa-plus-circle"></i>
                    Record Meeting
                </button>
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
                            ${e.map(u=>`
                                <label class="attendee-item-modern" data-name="${st(u.name||u.username)}">
                                    <input type="checkbox" value="${u.id}" onchange="window.app_toggleAttendeePick(this)">
                                    <span>${$(u.name||u.username)}</span>
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
                        ${Nt(a)}
                    </div>
                </div>

                <div class="form-footer-modern">
                    <button class="btn-secondary-modern" onclick="window.app_toggleNewMinuteForm()">Dismiss</button>
                    <button class="btn-record-meeting" onclick="window.app_submitNewMinutes()">Create Meeting Record</button>
                </div>
            </div>

            <div class="minutes-list-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; margin-top: 2rem;">
                <h3 style="margin:0; font-family:'Sora'; font-weight:800; color:#0f172a;">Recent Meetings</h3>
                <div style="position: relative; width: 300px;">
                    <i class="fa-solid fa-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--minutes-muted);"></i>
                    <input type="text" placeholder="Search meetings..." oninput="window.app_filterMinutes(this.value)" class="input-premium" style="padding-left: 2.75rem; width: 100%; padding-top: 0.6rem; padding-bottom: 0.6rem; font-size: 0.9rem;">
                </div>
            </div>

            <div class="minutes-list-container">
                ${n.length?n.sort((u,p)=>new Date(p.date)-new Date(u.date)).map(u=>{const p=s(u),m=i(u);return`
                        <div class="minute-card-modern ${p?"clickable":""}" ${p?`onclick="window.app_openMinuteDetails('${u.id}')"`:""}>
                            <div class="card-date-badge">${new Date(u.date).toLocaleDateString(void 0,{day:"numeric",month:"short",year:"numeric"})}</div>
                            
                            <div class="minute-card-status">
                                ${u.locked?'<span style="background:#dcfce7; color:#166534; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:700;"><i class="fa-solid fa-lock" style="margin-right:0.35rem;"></i>Locked</span>':'<span style="background:#fff7ed; color:#9a3412; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:700;">Open</span>'}
                            </div>

                            <h4 class="card-title-modern">${$(u.title)}</h4>
                            
                            <div class="card-metrics">
                                <div class="metric-item">
                                    <i class="fa-solid fa-users"></i>
                                    ${u.attendeeIds?.length||0} Attendees
                                </div>
                                <div class="metric-item">
                                    <i class="fa-solid fa-check-circle"></i>
                                    ${u.actionItems?.length||0} Tasks
                                </div>
                            </div>

                            ${p?"":`
                                <div class="restricted-tag">
                                    <i class="fa-solid fa-shield-halved" style="margin-right: 0.5rem;"></i>
                                    Access Restricted
                                    ${m==="pending"?'<div style="margin-top:0.5rem; font-size:0.7rem; color:#f59e0b;">Request Pending Review</div>':m==="rejected"?'<div style="margin-top:0.5rem; font-size:0.7rem; color:#ef4444;">Access Denied</div>':`<button class="mini-btn" style="margin-top:0.75rem; width:100%; border-color:#991b1b; color:#991b1b;" onclick="window.app_requestMinuteAccess('${u.id}')">Request View Access</button>`}
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
        </div>
    `}function un(n=[]){let e="";n&&n.length>0&&(e=`
            <div style="margin-bottom:1.5rem; padding-bottom:1.5rem; border-bottom:1px dashed #cbd5e1;">
                 <label style="display:block; font-size:0.85rem; font-weight:700; color:#334155; margin-bottom:0.75rem;">📋 Your Planned Tasks</label>
                 <div style="max-height:150px; overflow-y:auto; padding-right:4px;">
                    ${n.map(i=>`<div style="padding:8px 12px; background:#f0f9ff; border-left:3px solid #0284c7; border-radius:6px; font-size:0.9rem; color:#0c4a6e; margin-bottom:8px;">
                <span style="font-weight:600;">•</span> ${$(i.task)}
                ${i.subPlans&&i.subPlans.length>0?`<div style="font-size:0.8rem; color:#0369a1; margin-left:12px; margin-top:2px;">+ ${i.subPlans.length} sub-tasks</div>`:""}
             </div>`).join("")}
                 </div>
            </div>
        `);const t=n&&n.length>0?"✨ Add another task? (Optional)":"📝 What's your main focus today?",a=n&&n.length>0?"":"required";return`
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
                        <textarea id="checkin-task" ${a} placeholder="e.g. Complete the monthly financial report..." style="width:100%; height:80px; padding:0.75rem; border:2px solid #e2e8f0; border-radius:10px; font-family:inherit; resize:none; font-size:0.95rem; line-height:1.5; transition: border-color 0.2s;"></textarea>
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
    </div>`}function mn(){if(typeof window>"u")return;const n=new MutationObserver(t=>{t.forEach(()=>{const a=document.getElementById("checkout-modal"),s=document.getElementById("checkout-intro-panel");a&&s&&a.style.display!=="none"&&(localStorage.getItem("checkoutIntroSeen")||(s.style.display="block"))})}),e=()=>{const t=document.body;t&&n.observe(t,{attributes:!0,subtree:!0,attributeFilter:["style"]})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e):e()}typeof window<"u"&&mn();function fn(){return`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 2rem;">
            <div class="card" style="width: 100%; max-width: 400px; text-align: center;">
                <button onclick="window.AppAuth.resetData()" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 0.8rem;">
                     <i class="fa-solid fa-rotate-right"></i> Reset App
                </button>
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
     `}function yn(){return window.AppAuth?.getUser()?`
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
    `:""}const pt=50,hn=250;function ka(){const n=new Date,e=new Date;return e.setDate(n.getDate()-30),{startIso:e.toISOString().split("T")[0],endIso:n.toISOString().split("T")[0]}}function he(){if(!window.app_teamActivitiesState){const n=ka();window.app_teamActivitiesState={startIso:n.startIso,endIso:n.endIso,staffIds:[],status:"all",type:"all",search:"",sortKey:"date-desc",page:1,pageSize:pt,columnVisibility:{type:!0,status:!0,sourceTime:!0},users:[],data:[],filtered:[],lastRefreshed:null}}return window.app_teamActivitiesState}function gn(n){return(n||[]).map(e=>{const t=e.type||(e.workDescription?"attendance":"work"),a=e._displayDesc||e.workDescription||e.task||"Activity",s=e.checkOut||e._sortTime||"00:00",i=e.status||(t==="attendance"?"completed":""),o=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(e.date,i):i||"to-be-started";return{date:e.date||"",staffName:e.staffName||e.userName||"Unknown Staff",type:t,description:a,status:o,sourceTime:s,userId:e.userId||e.user_id||"",planId:e.planId||e.id||"",taskIndex:Number.isInteger(e.taskIndex)?e.taskIndex:null,planScope:e.planScope||"personal",progressPercent:Number.isFinite(Number(e.progressPercent))?Number(e.progressPercent):null,progressStatus:e.progressStatus||"",progressNote:e.progressNote||""}})}function wn(n){const e=String(n||"").toLowerCase();return["overdue","not-completed","to-be-started","in-process"].includes(e)}function vn(n){const e=new Date(n);return Number.isNaN(e.getTime())?new Date().toISOString().split("T")[0]:(e.setDate(e.getDate()+1),e.toISOString().split("T")[0])}function bn(n){if(!n||!/^\d{4}-\d{2}-\d{2}$/.test(n))return!1;const e=new Date(n);return!Number.isNaN(e.getTime())&&e.toISOString().startsWith(n)}function Sn(n,e){return new Promise(t=>{if(!n){t(null);return}const a=document.getElementById("team-activities-postpone-popover");a&&a.remove();const s=document.createElement("div");s.id="team-activities-postpone-popover",s.className="team-activities-postpone-popover",s.innerHTML=`
            <div class="team-activities-postpone-head">Postpone to</div>
            <input type="date" class="team-activities-postpone-input" value="${e}">
            <div class="team-activities-postpone-actions">
                <button type="button" class="team-activities-row-btn warn" data-postpone-cancel>Cancel</button>
                <button type="button" class="team-activities-row-btn success" data-postpone-confirm>Confirm</button>
            </div>
        `,document.body.appendChild(s);const i=n.getBoundingClientRect(),o=i.bottom+window.scrollY+8,r=Math.min(i.left+window.scrollX,window.innerWidth-260);s.style.top=`${o}px`,s.style.left=`${r}px`;const d=s.querySelector(".team-activities-postpone-input");d&&d.focus();const l=f=>{document.removeEventListener("click",c,!0),s.remove(),t(f)},c=f=>{!s.contains(f.target)&&f.target!==n&&l(null)};document.addEventListener("click",c,!0),s.addEventListener("click",f=>{const u=f.target;if(u.closest("[data-postpone-cancel]")&&l(null),u.closest("[data-postpone-confirm]")){const p=d?d.value:"";l(p||null)}})})}function kn(n){const e=n.search.trim().toLowerCase(),t=new Set(n.staffIds||[]),a=n.status,s=n.type;let i=n.data.filter(o=>!(t.size&&!t.has(o.userId)||s!=="all"&&o.type!==s||a!=="all"&&String(o.status||"").toLowerCase()!==a||e&&!`${o.date} ${o.staffName} ${o.description} ${o.status} ${o.type}`.toLowerCase().includes(e)));return i=An(i,n.sortKey),n.filtered=i,i}function An(n,e){const t=[...n];return t.sort((a,s)=>{const i=new Date(s.date)-new Date(a.date),o=String(s.sourceTime||"").localeCompare(String(a.sourceTime||"")),r=String(a.staffName||"").localeCompare(String(s.staffName||""));return e==="date-asc"?new Date(a.date)-new Date(s.date)||o:e==="staff-asc"?r||i:e==="staff-desc"?-r||i:e==="status"?String(a.status||"").localeCompare(String(s.status||""))||i:e==="type"?String(a.type||"").localeCompare(String(s.type||""))||i:e==="time"?String(a.sourceTime||"").localeCompare(String(s.sourceTime||""))||i:i||o}),t}function Dn(n,e,t){const s=(Math.max(1,e)-1)*t;return n.slice(s,s+t)}function Aa(n){const e=n.filtered.length,t=new Set(n.filtered.map(i=>i.userId).filter(Boolean)),a=n.filtered.filter(i=>String(i.status).toLowerCase()==="completed").length,s=e-a;return`
        <div class="team-activities-chip">Total: <strong>${e}</strong></div>
        <div class="team-activities-chip">Staff: <strong>${t.size}</strong></div>
        <div class="team-activities-chip">Completed: <strong>${a}</strong></div>
        <div class="team-activities-chip">Incomplete: <strong>${s}</strong></div>
    `}function Da(n){const e=n.users||[],t=new Set(n.staffIds||[]),a=t.size?`${t.size} selected`:"All staff",s=e.map(i=>`
        <label class="team-activities-checkbox">
            <input type="checkbox" data-staff-id="${i.id}" ${t.has(i.id)?"checked":""}>
            <span>${$(i.name||"Staff")}</span>
        </label>
    `).join("");return`
        <div class="team-activities-dropdown">
            <button class="team-activities-dropdown-btn" type="button" data-team-activities-staff-toggle>
                <i class="fa-solid fa-users"></i>
                <span>Staff: ${$(a)}</span>
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
    `}function $a(n){const e=n.columnVisibility;return`
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
    `}function $n(n){const e=n.columnVisibility,t=Dn(n.filtered,n.page,n.pageSize);if(!t.length)return'<div class="team-activities-empty">No activities found for the selected filters.</div>';const a=`
        <th data-sort="date-desc">Date</th>
        <th data-sort="staff-asc">Staff</th>
        ${e.type?'<th data-sort="type">Type</th>':""}
        ${e.status?'<th data-sort="status">Status</th>':""}
        <th>Description</th>
        ${e.sourceTime?'<th data-sort="time">Time</th>':""}
        <th>Actions</th>
    `,s=window.AppAuth?.getUser?window.AppAuth.getUser()?.id:null,i=t.map(o=>{const r=String(o.status||"").toLowerCase().replace(/\s+/g,"-"),d=s&&o.userId&&s===o.userId,l=o.type==="work"&&(o.progressPercent!==null||o.progressStatus||o.progressNote),c=o.progressStatus?String(o.progressStatus).replace(/_/g," "):"",f=o.progressPercent!==null?`${o.progressPercent}%`:"",u=String(o.progressNote||"").trim(),p=u?` title="${$(u)}"`:"",m=l?`<div class="team-activities-progress"${p}>${$(f)}${f&&c?" • ":""}${$(c)}</div>`:"";return`
        <tr>
            <td>${$(o.date)}</td>
            <td>${$(o.staffName)}</td>
            ${e.type?`<td class="team-activities-type">${$(o.type)}</td>`:""}
            ${e.status?`<td><span class="team-activities-status status-${$(r)}">${$(o.status)}</span></td>`:""}
            <td class="team-activities-desc">${$(o.description)}${m}</td>
            ${e.sourceTime?`<td>${$(o.sourceTime||"--")}</td>`:""}
            <td>
                <div class="team-activities-row-actions">
                    <button class="team-activities-row-btn" data-view-date="${$(o.date)}" data-view-user="${$(o.userId)}">
                        <i class="fa-solid fa-eye"></i> View
                    </button>
                    ${o.type==="work"&&d&&wn(o.status)&&o.planId&&Number.isInteger(o.taskIndex)?`
                        <button class="team-activities-row-btn warn" data-action="postpone" data-plan-id="${$(o.planId)}" data-task-index="${o.taskIndex}" data-plan-scope="${$(o.planScope)}" data-user-id="${$(o.userId)}" data-date="${$(o.date)}">
                            <i class="fa-solid fa-clock"></i> Postpone
                        </button>
                        <button class="team-activities-row-btn success" data-action="complete" data-plan-id="${$(o.planId)}" data-task-index="${o.taskIndex}" data-user-id="${$(o.userId)}">
                            <i class="fa-solid fa-check"></i> Complete
                        </button>
                    `:""}
                </div>
            </td>
        </tr>
    `}).join("");return`
        <table class="team-activities-table">
            <thead><tr>${a}</tr></thead>
            <tbody>${i}</tbody>
        </table>
    `}function _n(n){const e=n.filtered.length,t=Math.max(1,Math.ceil(e/n.pageSize)),a=Math.min(n.page,t);return`
        <div class="team-activities-pagination">
            <button class="team-activities-page-btn" data-page="prev" ${a<=1?"disabled":""}>Prev</button>
            <span>Page ${a} of ${t}</span>
            <button class="team-activities-page-btn" data-page="next" ${a>=t?"disabled":""}>Next</button>
        </div>
    `}function pe(){const n=he();kn(n);const e=Math.max(1,Math.ceil(n.filtered.length/n.pageSize));n.page>e&&(n.page=e);const t=document.getElementById("team-activities-summary"),a=document.getElementById("team-activities-table-wrap"),s=document.getElementById("team-activities-pagination-wrap"),i=document.getElementById("team-activities-last-updated"),o=document.getElementById("team-activities-columns-wrap"),r=document.getElementById("team-activities-staff-wrap");t&&(t.innerHTML=Aa(n)),a&&(a.innerHTML=$n(n)),s&&(s.innerHTML=_n(n)),o&&(o.innerHTML=$a(n)),r&&(r.innerHTML=Da(n)),i&&n.lastRefreshed&&(i.textContent=new Date(n.lastRefreshed).toLocaleString())}async function xe(){const n=he(),e=document.getElementById("team-activities-loading");e&&(e.style.display="block");try{const t=await window.AppAnalytics.getAllStaffActivities({mode:"range",startIso:n.startIso,endIso:n.endIso,scope:"all"});n.data=gn(t),n.lastRefreshed=Date.now(),n.page=1}catch(t){console.error("Team Activities fetch failed",t)}finally{e&&(e.style.display="none")}pe()}function it(){const n=he(),e=document.getElementById("team-activities-start"),t=document.getElementById("team-activities-end"),a=document.getElementById("team-activities-type"),s=document.getElementById("team-activities-status"),i=document.getElementById("team-activities-search"),o=document.getElementById("team-activities-page-size");e&&(n.startIso=e.value||n.startIso),t&&(n.endIso=t.value||n.endIso),a&&(n.type=a.value||"all"),s&&(n.status=s.value||"all"),i&&(n.search=i.value||""),o&&(n.pageSize=Number(o.value)||pt),n.page=1,pe()}function xn(){const n=he();if(n.bound)return;n.bound=!0;let e=null;document.addEventListener("click",async t=>{const a=t.target,s=a.closest("[data-team-activities-staff-toggle]"),i=document.getElementById("team-activities-staff-panel"),o=a.closest("[data-team-activities-columns-toggle]"),r=document.getElementById("team-activities-columns-popover");s&&i?i.classList.toggle("open"):i&&!i.contains(a)&&i.classList.remove("open"),o&&r?r.classList.toggle("open"):r&&!r.contains(a)&&r.classList.remove("open");const d=a.closest(".team-activities-page-btn");if(d){const m=d.dataset.page,h=Math.max(1,Math.ceil(n.filtered.length/n.pageSize));m==="prev"&&(n.page=Math.max(1,n.page-1)),m==="next"&&(n.page=Math.min(h,n.page+1)),pe()}const l=a.closest("[data-view-date]");if(l){const m=l.getAttribute("data-view-date"),h=l.getAttribute("data-view-user");window.app_openDayPlan&&window.app_openDayPlan(m,h||"")}const c=a.closest("[data-action]");if(c){const m=c.getAttribute("data-action");m==="complete"&&window.app_teamActivitiesCompleteTask&&await window.app_teamActivitiesCompleteTask(c),m==="postpone"&&window.app_teamActivitiesPostponeTask&&await window.app_teamActivitiesPostponeTask(c)}const f=a.closest("th[data-sort]");if(f){const m=f.dataset.sort;m&&(n.sortKey=m,pe())}a.closest("[data-staff-select-all]")&&(n.staffIds=(n.users||[]).map(m=>m.id),pe()),a.closest("[data-staff-clear]")&&(n.staffIds=[],pe())}),document.addEventListener("change",t=>{const a=t.target;if(a.matches("#team-activities-start, #team-activities-end")?(it(),xe()):a.matches("#team-activities-type, #team-activities-status, #team-activities-page-size")&&it(),a.matches('#team-activities-columns-popover input[type="checkbox"]')){const s=a.getAttribute("data-column");s&&(n.columnVisibility[s]=a.checked),pe()}if(a.matches('#team-activities-staff-panel input[type="checkbox"]')){const s=a.getAttribute("data-staff-id");if(!s)return;a.checked?n.staffIds.includes(s)||n.staffIds.push(s):n.staffIds=n.staffIds.filter(i=>i!==s),pe()}}),document.addEventListener("input",t=>{t.target.matches("#team-activities-search")&&(e&&clearTimeout(e),e=setTimeout(()=>it(),hn))})}function Tn(n){const e=["Date","Staff","Type","Status","Description","Time"],t=n.map(a=>[a.date,a.staffName,a.type,a.status,a.description,a.sourceTime].map(s=>`"${String(s||"").replace(/\"/g,'""')}"`).join(","));return[e.join(","),...t].join(`
`)}typeof window<"u"&&(window.app_initTeamActivities=async function(){const n=he(),e=await window.AppAnalytics.getUsersCached();n.users=e||[],xn(),pe(),await xe()},window.app_teamActivitiesRefresh=async function(){it(),await xe()},window.app_teamActivitiesResetFilters=function(){const n=he(),e=ka();n.startIso=e.startIso,n.endIso=e.endIso,n.staffIds=[],n.status="all",n.type="all",n.search="",n.sortKey="date-desc",n.page=1,n.pageSize=pt;const t=document.getElementById("team-activities-start"),a=document.getElementById("team-activities-end"),s=document.getElementById("team-activities-type"),i=document.getElementById("team-activities-status"),o=document.getElementById("team-activities-search"),r=document.getElementById("team-activities-page-size");t&&(t.value=n.startIso),a&&(a.value=n.endIso),s&&(s.value="all"),i&&(i.value="all"),o&&(o.value=""),r&&(r.value=String(pt)),pe(),xe()},window.app_teamActivitiesCopyCSV=async function(){const n=he(),e=Tn(n.filtered);try{await navigator.clipboard.writeText(e),alert("Table copied to clipboard.")}catch(t){console.warn("Clipboard copy failed",t),alert("Copy failed. Please use Export Excel instead.")}},window.app_teamActivitiesExportXLSX=function(){const n=he();window.AppReports?.exportTeamActivitiesXLSX?window.AppReports.exportTeamActivitiesXLSX(n.filtered,{start:n.startIso,end:n.endIso}):alert("Export module not available.")},window.app_teamActivitiesCompleteTask=async function(n){try{const e=window.AppAuth?.getUser?window.AppAuth.getUser()?.id:null,t=n.getAttribute("data-plan-id"),a=Number(n.getAttribute("data-task-index")),s=n.getAttribute("data-user-id")||"";if(!e||e!==s){alert("Only the assigned staff member can complete this task.");return}if(!t||!Number.isInteger(a)||!window.AppCalendar?.updateTaskStatus)return;n.disabled=!0,await window.AppCalendar.updateTaskStatus(t,a,"completed"),await xe(),window.app_showSyncToast&&window.app_showSyncToast("Task marked as completed.")}catch(e){console.error("Complete task failed",e),alert("Failed to complete task.")}},window.app_teamActivitiesPostponeTask=async function(n){try{const e=window.AppAuth?.getUser?window.AppAuth.getUser()?.id:null,t=n.getAttribute("data-plan-id"),a=Number(n.getAttribute("data-task-index")),s=n.getAttribute("data-plan-scope")||"personal",i=n.getAttribute("data-user-id")||"",o=n.getAttribute("data-date")||"";if(!e||e!==i){alert("Only the assigned staff member can postpone this task.");return}if(!t||!Number.isInteger(a)||!window.AppDB||!window.AppCalendar)return;n.disabled=!0;const r=await window.AppDB.get("work_plans",t);if(!r||!Array.isArray(r.plans)||!r.plans[a])throw new Error("Plan or task not found");const d=vn(o),l=await Sn(n,d);if(!l){n.disabled=!1;return}const c=String(l).trim();if(!bn(c)){alert("Invalid date. Please use YYYY-MM-DD."),n.disabled=!1;return}const[f]=r.plans.splice(a,1);r.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",r);const u=c,p=s||r.planScope||"personal",m=p==="annual"?"annual_shared":r.userId||i,h=window.AppCalendar.getWorkPlanId(u,m,p),y={...f,status:"",startDate:u,endDate:u};delete y.completedDate;const w=await window.AppDB.get("work_plans",h);if(w)w.plans=Array.isArray(w.plans)?w.plans:[],w.plans.push(y),w.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",w);else{const b=p==="annual"?null:m;await window.AppCalendar.setWorkPlan(u,[y],b,{planScope:p})}await xe(),window.app_showSyncToast&&window.app_showSyncToast(`Task postponed to ${u}.`)}catch(e){console.error("Postpone task failed",e),alert("Failed to postpone task.")}});async function In(){const n=he();return`
        <div class="team-activities-page">
            <div class="team-activities-header">
                <div>
                    <h2>Team Activities</h2>
                    <div class="team-activities-meta">Last updated: <span id="team-activities-last-updated">--</span></div>
                </div>
                <div class="team-activities-actions">
                    <button class="action-btn" onclick="window.app_teamActivitiesRefresh()"><i class="fa-solid fa-rotate"></i> Refresh</button>
                    <button class="action-btn secondary" onclick="window.app_teamActivitiesResetFilters()"><i class="fa-solid fa-filter-circle-xmark"></i> Reset</button>
                    <button class="action-btn secondary" onclick="window.app_teamActivitiesCopyCSV()"><i class="fa-solid fa-copy"></i> Copy</button>
                    <button class="action-btn secondary" onclick="window.app_teamActivitiesExportXLSX()"><i class="fa-solid fa-file-excel"></i> Export Excel</button>
                    <div class="team-activities-columns">
                        <button class="action-btn secondary" data-team-activities-columns-toggle><i class="fa-solid fa-table-columns"></i> Columns</button>
                        <div id="team-activities-columns-wrap">${$a(n)}</div>
                    </div>
                </div>
            </div>
            <div class="team-activities-summary" id="team-activities-summary">${Aa(n)}</div>
            <div class="team-activities-filters">
                <div class="team-activities-filter-group">
                    <label>Date range</label>
                    <div class="team-activities-date-range">
                        <input type="date" id="team-activities-start" value="${n.startIso}">
                        <span>to</span>
                        <input type="date" id="team-activities-end" value="${n.endIso}">
                    </div>
                </div>
                <div class="team-activities-filter-group" id="team-activities-staff-wrap">
                    ${Da(n)}
                </div>
                <div class="team-activities-filter-group">
                    <label>Type</label>
                    <select id="team-activities-type">
                        <option value="all" ${n.type==="all"?"selected":""}>All</option>
                        <option value="attendance" ${n.type==="attendance"?"selected":""}>Attendance</option>
                        <option value="work" ${n.type==="work"?"selected":""}>Work Plan</option>
                    </select>
                </div>
                <div class="team-activities-filter-group">
                    <label>Status</label>
                    <select id="team-activities-status">
                        <option value="all" ${n.status==="all"?"selected":""}>All</option>
                        <option value="completed" ${n.status==="completed"?"selected":""}>Completed</option>
                        <option value="in-process" ${n.status==="in-process"?"selected":""}>In Process</option>
                        <option value="overdue" ${n.status==="overdue"?"selected":""}>Overdue</option>
                        <option value="not-completed" ${n.status==="not-completed"?"selected":""}>Not Completed</option>
                        <option value="to-be-started" ${n.status==="to-be-started"?"selected":""}>To Be Started</option>
                    </select>
                </div>
                <div class="team-activities-filter-group">
                    <label>Search</label>
                    <input type="text" id="team-activities-search" placeholder="Search by staff, description, date...">
                </div>
                <div class="team-activities-filter-group">
                    <label>Page size</label>
                    <select id="team-activities-page-size">
                        <option value="25" ${n.pageSize===25?"selected":""}>25</option>
                        <option value="50" ${n.pageSize===50?"selected":""}>50</option>
                        <option value="100" ${n.pageSize===100?"selected":""}>100</option>
                    </select>
                </div>
            </div>
            <div id="team-activities-loading" class="team-activities-loading">Loading data...</div>
            <div class="team-activities-table-wrap" id="team-activities-table-wrap"></div>
            <div id="team-activities-pagination-wrap"></div>
        </div>
    `}const U={renderDashboard:ft,renderHeroCard:ye,renderWorkLog:da,renderActivityList:la,renderActivityLog:ca,renderStaffActivityListSplit:mt,renderStaffActivityColumn:xt,renderStatsCard:Me,renderBreakdown:ua,renderLeaveRequests:ma,renderLeaveHistory:fa,renderNotificationPanel:ya,renderTaggedItems:ha,renderStaffDirectory:en,renderStaffDirectoryPage:rn,renderAnnualPlan:Ce,renderTimesheet:Pe,renderProfile:va,renderMasterSheet:ba,renderAdmin:Tt,renderSalaryProcessing:cn,renderPolicyTest:pn,renderMinutes:Sa,renderCheckInModal:un,renderLogin:fn,renderModals:yn,renderYearlyPlan:Nt,renderTeamActivitiesPage:In};typeof window<"u"&&(window.AppUI=U);class Ln{constructor(){this.db=z}normalizePlanTasks(e){return Array.isArray(e?.plans)?e.plans:[]}getSmartTaskStatus(e,t=null){if(t==="completed"||t==="not-completed")return t;const a=new Date().toISOString().split("T")[0],s=typeof e=="string"?e:e.toISOString().split("T")[0];return s>a?"to-be-started":s===a?"in-process":s<a?"overdue":"in-process"}calculateTaskPoints(e,t){const a=this.getSmartTaskStatus(t,e.status);let s=0;switch(a){case"completed":if(s=10,e.completedDate){const i=this.getDaysDifference(t,e.completedDate);i===0?s+=3:i===1?s-=1:i>=2&&(s-=2)}break;case"in-process":s=5;break;case"to-be-started":s=0;break;case"overdue":s=-8;break;case"not-completed":s=-3;break}return s}getDaysDifference(e,t){const a=new Date(e),i=new Date(t)-a;return Math.floor(i/(1e3*60*60*24))}getCompletionStats(e){let t=0,a=0,s=0,i=0,o=0,r=0;e.forEach(l=>{this.normalizePlanTasks(l).forEach(f=>{switch(r++,this.getSmartTaskStatus(l.date,f.status)){case"completed":t++;break;case"in-process":a++;break;case"not-completed":s++;break;case"overdue":i++;break;case"to-be-started":o++;break}})});const d=r>0?t/r:0;return{completed:t,inProcess:a,notCompleted:s,overdue:i,toBeStarted:o,totalTasks:r,completionRate:parseFloat(d.toFixed(2)),lastCalculated:new Date().toISOString()}}async calculateUserRating(e,t=30){try{const a=await this.db.getAll("work_plans"),s=new Date;s.setDate(s.getDate()-t);const i=s.toISOString().split("T")[0],o=a.filter(c=>c.userId===e&&c.date>=i);if(o.length===0)return{rating:3,rawScore:0,stats:{completed:0,inProcess:0,notCompleted:0,overdue:0,toBeStarted:0,totalTasks:0,completionRate:0,lastCalculated:new Date().toISOString()}};let r=0;o.forEach(c=>{this.normalizePlanTasks(c).forEach(u=>{r+=this.calculateTaskPoints(u,c.date)})});const d=this.getCompletionStats(o),l=this.normalizeScore(r,-50,150);return{rating:parseFloat(l.toFixed(1)),rawScore:r,stats:d}}catch(a){return console.error("Rating calculation failed:",a),{rating:3,rawScore:0,stats:{completed:0,inProcess:0,notCompleted:0,overdue:0,toBeStarted:0,totalTasks:0,completionRate:0,lastCalculated:new Date().toISOString()}}}}normalizeScore(e,t,a){const i=1+(Math.max(t,Math.min(a,e))-t)/(a-t)*4;return Math.max(1,Math.min(5,i))}async updateUserRating(e){try{const t=await this.calculateUserRating(e),a=await this.db.get("users",e);if(!a)throw new Error("User not found");a.ratingHistory||(a.ratingHistory=[]);const s=new Date().toISOString().split("T")[0];return a.ratingHistory.push({date:s,rating:t.rating,reason:"auto-calculated"}),a.ratingHistory.length>90&&(a.ratingHistory=a.ratingHistory.slice(-90)),a.rating=t.rating,a.completionStats=t.stats,await this.db.put("users",a),a}catch(t){throw console.error("Failed to update user rating:",t),t}}async updateAllRatings(){try{const e=await this.db.getAll("users"),t=[];for(const a of e)try{const s=await this.updateUserRating(a.id);t.push(s)}catch(s){console.error(`Failed to update rating for ${a.name}:`,s)}return t}catch(e){throw console.error("Failed to update all ratings:",e),e}}async getTopPerformers(e=5){try{return(await this.db.getAll("users")).filter(s=>s.rating!==void 0).sort((s,i)=>(i.rating||0)-(s.rating||0)).slice(0,e).map(s=>({id:s.id,name:s.name,avatar:s.avatar,rating:s.rating||0,completionStats:s.completionStats||{}}))}catch(t){return console.error("Failed to get top performers:",t),[]}}async getRatingHistory(e,t=90){try{const a=await this.db.get("users",e);if(!a||!a.ratingHistory)return[];const s=new Date;s.setDate(s.getDate()-t);const i=s.toISOString().split("T")[0];return a.ratingHistory.filter(o=>o.date>=i)}catch(a){return console.error("Failed to get rating history:",a),[]}}}const Ne=new Ln;typeof window<"u"&&(window.AppRating=Ne);class En{constructor(){this.db=z}normalizePlanScope(e){return String(e||"").toLowerCase()==="annual"?"annual":"personal"}getWorkPlanId(e,t=null,a="personal"){return this.normalizePlanScope(a)==="annual"?`plan_annual_${e}`:`plan_${t}_${e}`}async getPlans(){try{const e=new Date,t=new Date(e.getFullYear(),e.getMonth()-2,1).toISOString().split("T")[0],a=new Date(e.getFullYear(),e.getMonth()+3,0).toISOString().split("T")[0],[s,i,o,r]=await Promise.all([this.db.getAll("leaves"),this.db.getAll("events").catch(()=>[]),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:t},{field:"date",operator:"<=",value:a}]).catch(()=>this.db.getAll("work_plans")):this.db.getAll("work_plans"),this.db.getCached?this.db.getCached(this.db.getCacheKey("calendarUsers","users",{}),x?.READ_CACHE_TTLS?.users||6e4,()=>this.db.getAll("users")).catch(()=>[]):this.db.getAll("users").catch(()=>[])]),d={};r.forEach(u=>{d[u.id]=u.name});const l=(s||[]).filter(u=>u.status==="Approved").map(u=>({...u,userName:u.userName||d[u.userId]||"Staff"})),c=(()=>{const u=new Map;return(i||[]).forEach(p=>{const m=[String(p.date||"").trim(),String(p.title||"").trim().toLowerCase(),String(p.type||"event").trim().toLowerCase(),String(p.createdById||p.createdByName||"").trim().toLowerCase()].join("|");u.has(m)||u.set(m,p)}),Array.from(u.values())})(),f=(o||[]).map(u=>({...u,plans:Array.isArray(u.plans)?u.plans:[]}));return{leaves:l,events:c,workPlans:f}}catch(e){return console.error("Failed to fetch calendar plans:",e),{leaves:[],events:[],workPlans:[]}}}async setWorkPlan(e,t=[],a=null,s={}){const i=Q.getUser();if(!i)throw new Error("Not authenticated");const o=this.normalizePlanScope(s.planScope),r=a||i.id,d=await this.db.getAll("users"),l=d.find(f=>f.id===r);if(!l)throw console.error("setWorkPlan Error: Target user not found",{targetId:r,currentUser:i,allUsersCount:d.length}),new Error("Target user not found");const c={id:this.getWorkPlanId(e,r,o),userId:o==="annual"?"annual_shared":r,userName:o==="annual"?"All Staff":l.name,date:e,plans:t,planScope:o,createdById:i.id,createdByName:i.name||"Admin",updatedAt:new Date().toISOString()};return await this.db.put("work_plans",c)}async addWorkPlanTask(e,t,a,s=[],i={}){let o=await this.getWorkPlan(t,e);if(!o){const d=(await this.db.getAll("users")).find(l=>l.id===t);if(!d)throw new Error("Target user not found");o={id:`plan_${t}_${e}`,userId:t,userName:d.name,date:e,plans:[],updatedAt:new Date().toISOString()}}if(o.plans||(o.plans=[]),i.sourcePlanId!==void 0&&i.sourceTaskIndex!==void 0&&i.sourcePlanId!==null){const r=o.plans.find(d=>d.sourcePlanId===i.sourcePlanId&&d.sourceTaskIndex===i.sourceTaskIndex&&d.addedFrom===(i.addedFrom||"minutes"));if(r)return r.task=a,r.subPlans=i.subPlans||r.subPlans||[],r.tags=s,r.status=i.status||r.status||"pending",r.startDate=i.startDate||r.startDate||e,r.endDate=i.endDate||r.endDate||r.startDate||e,r.updatedAt=new Date().toISOString(),o.updatedAt=new Date().toISOString(),await this.db.put("work_plans",o)}return o.plans.push({task:a,subPlans:i.subPlans||[],tags:s,status:i.status||"pending",startDate:i.startDate||e,endDate:i.endDate||i.startDate||e,addedFrom:i.addedFrom||"minutes",sourcePlanId:i.sourcePlanId||null,sourceTaskIndex:i.sourceTaskIndex??null,taggedById:i.taggedById||null,taggedByName:i.taggedByName||null}),o.updatedAt=new Date().toISOString(),await this.db.put("work_plans",o)}async deleteWorkPlan(e,t=null,a={}){const s=Q.getUser();if(!s)throw new Error("Not authenticated");const i=this.normalizePlanScope(a.planScope),o=t||s.id;return await this.db.delete("work_plans",this.getWorkPlanId(e,o,i))}async getWorkPlan(e,t,a={}){const s=!!a.includeAnnual,i=!!a.mergeAnnual,o=a.planScope?this.normalizePlanScope(a.planScope):null,r=!!a.preferAnnual;if(o)return await this.db.get("work_plans",this.getWorkPlanId(t,e,o));const d=await this.db.get("work_plans",this.getWorkPlanId(t,e,"personal"));if(!s)return d;const l=await this.db.get("work_plans",this.getWorkPlanId(t,e,"annual"));if(i&&l&&d){const c=[];return(l.plans||[]).forEach((f,u)=>{c.push({...f,_planId:l.id,_taskIndex:u,_planDate:l.date,_planScope:"annual"})}),(d.plans||[]).forEach((f,u)=>{c.push({...f,_planId:d.id,_taskIndex:u,_planDate:d.date,_planScope:"personal"})}),{id:`plan_merged_${e}_${t}`,userId:e,userName:d.userName||"Staff",date:t,planScope:"mixed",plans:c,personalPlanId:d.id,annualPlanId:l.id}}return r?l||d:d||l}getSmartTaskStatus(e,t=null){if(Ne)return Ne.getSmartTaskStatus(e,t);if(t==="completed"||t==="not-completed")return t;const a=new Date().toISOString().split("T")[0],s=typeof e=="string"?e:e.toISOString().split("T")[0];return s>a?"to-be-started":s===a?"in-process":s<a?"overdue":"in-process"}async updateTaskStatus(e,t,a,s=null){try{const i=await this.db.get("work_plans",e);if(!i||!i.plans||!i.plans[t])throw new Error("Plan or task not found");return i.plans[t].status=a,a==="completed"&&!i.plans[t].completedDate&&(i.plans[t].completedDate=s||new Date().toISOString().split("T")[0]),i.updatedAt=new Date().toISOString(),await this.db.put("work_plans",i),Ne&&await Ne.updateUserRating(i.userId),i}catch(i){throw console.error("Failed to update task status:",i),i}}async reassignTask(e,t,a){try{const s=await this.db.get("work_plans",e);if(!s||!s.plans||!s.plans[t])throw new Error("Plan or task not found");if(!(await this.db.getAll("users")).find(r=>r.id===a))throw new Error("New user not found");return s.plans[t].assignedTo=a,s.updatedAt=new Date().toISOString(),await this.db.put("work_plans",s),s}catch(s){throw console.error("Failed to reassign task:",s),s}}async getTasksByStatus(e,t,a=null,s=null){try{const o=(await this.db.getAll("work_plans")).filter(d=>d.userId===e),r=[];return o.forEach(d=>{a&&d.date<a||s&&d.date>s||d.plans&&Array.isArray(d.plans)&&d.plans.forEach((l,c)=>{const f=this.getSmartTaskStatus(d.date,l.status);f===t&&r.push({...l,planId:d.id,taskIndex:c,planDate:d.date,calculatedStatus:f})})}),r}catch(i){return console.error("Failed to get tasks by status:",i),[]}}async getCollaborations(e,t=null){try{return(await this.db.getAll("work_plans")).filter(s=>(!t||s.date===t)&&s.plans&&s.plans.some(i=>i.tags&&i.tags.some(o=>o.id===e&&o.status==="accepted")))}catch(a){return console.error("Failed to fetch collaborations:",a),[]}}async addEvent(e){const t={id:"ev_"+Date.now(),...e,createdOn:new Date().toISOString()};return await this.db.add("events",t)}_toLocalISO(e){const t=new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`}async getMonthEvents(e,t){const a=await this.getPlans(),s=[];a.leaves.forEach(r=>{const d=new Date(r.startDate),l=new Date(r.endDate);let c=new Date(d);for(;c<=l;)s.push({date:this._toLocalISO(c),title:`${r.userName||"Staff"} (Leave)`,type:"leave",userId:r.userId}),c.setDate(c.getDate()+1)});const i=a.workPlans.map(r=>{const d=[];return r.plans.forEach(l=>{let c=l.task;l.subPlans&&l.subPlans.length>0&&(c+=" ("+l.subPlans.join(", ")+")"),l.tags&&l.tags.length>0&&(c+=" with "+l.tags.map(f=>f.name).join(", ")),d.push(c)}),{date:r.date,title:`${r.userName}: ${d.join("; ")}`,type:"work",userId:r.userId,plans:r.plans}});return[...s,...a.events,...i].filter(r=>{const d=new Date(r.date);return d.getFullYear()===e&&d.getMonth()===t})}}const Be=new En;typeof window<"u"&&(window.AppCalendar=Be);class Mn{constructor(){this.isActive=!1,this.activeMinutes=0,this.totalMinutes=0,this.monitorInterval=null,this.lastActivityTime=Date.now(),this.isCurrentlyActive=!1,this.performedAudits={},this.commandListener=null,this.processedCommandIds=new Set,this.startTime=Date.now(),this.handleActivity=this.handleActivity.bind(this),this.tick=this.tick.bind(this),z&&this.initCommandListener()}initCommandListener(){this.commandListener||z&&z.listen&&(console.log("Activity Monitor: Initializing System Command Listener..."),this.commandListener=z.listen("system_commands",e=>{const t=Q.getUser();if(!t){console.log("[Audit] Command detected but user not authenticated yet. Waiting...");return}const a=e.filter(s=>s.type==="audit"&&s.timestamp>this.startTime-6e5&&!this.processedCommandIds.has(s.id)).sort((s,i)=>i.timestamp-s.timestamp);if(a.length>0){const s=a[0];console.log("[Audit] Manual Command Received!",s.id),this.processedCommandIds.add(s.id);const i=s.slotName||`Manual Audit @ ${new Date().toLocaleTimeString()}`;console.log(`[Audit] Executing for user: ${t.name} in slot: ${i}`),this.performSilentAudit(i)}}))}async performSilentAudit(e){const t=Q.getUser();if(!t)return;const a=new Date().toISOString().split("T")[0];if(this.performedAudits[a]||(this.performedAudits[a]={}),this.performedAudits[a][e])return;console.log(`Executing Silent Location Audit for slot: ${e}`),this.performedAudits[a][e]=!0;let s={userId:t.id,userName:t.name,timestamp:Date.now(),slot:e,status:"Success",lat:0,lng:0};try{if(window.getLocation){const i=await window.getLocation().catch(o=>(console.warn("Silent Audit Location Failed:",o),null));i?(s.lat=i.lat,s.lng=i.lng):s.status="Location service disabled"}else s.status="Location service disabled (missing helper)"}catch{s.status="Location service disabled"}try{await z.add("location_audits",s),console.log("Silent Audit Log Saved.")}catch(i){console.error("Failed to save audit log:",i)}}start(){this.isActive||(this.isActive=!0,this.activeMinutes=0,this.totalMinutes=0,this.isCurrentlyActive=!1,this.lastActivityTime=Date.now(),document.addEventListener("mousemove",this.handleActivity),document.addEventListener("click",this.handleActivity),document.addEventListener("keydown",this.handleActivity),document.addEventListener("scroll",this.handleActivity),this.monitorInterval=setInterval(this.tick,6e4),console.log("Activity Monitoring Started"))}stop(){if(this.isActive)return this.isActive=!1,document.removeEventListener("mousemove",this.handleActivity),document.removeEventListener("click",this.handleActivity),document.removeEventListener("keydown",this.handleActivity),document.removeEventListener("scroll",this.handleActivity),this.monitorInterval&&clearInterval(this.monitorInterval),console.log("Activity Monitoring Stopped. Score:",this.getScore()),this.getStats()}handleActivity(){this.isCurrentlyActive||(this.isCurrentlyActive=!0,this.lastActivityTime=Date.now())}tick(){this.totalMinutes++,this.isCurrentlyActive&&this.activeMinutes++;const e=Q.getUser();e&&e.status==="in"&&(e.activityScore=this.getScore(),e.lastActive=this.lastActivityTime,z.put("users",e)),this.isCurrentlyActive=!1}getScore(){return this.totalMinutes===0?100:Math.round(this.activeMinutes/this.totalMinutes*100)}getStats(){return{score:this.getScore(),activeMinutes:this.activeMinutes,totalMinutes:this.totalMinutes}}}const Cn=new Mn;typeof window<"u"&&(window.AppActivity=Cn);class Pn{constructor(){this.active=!1,this.currentStep=0,this.steps=[],this.overlay=null,this.tooltip=null,this.highlight=null,this.tourKey="crwi_tour_completed"}init(e){if(e){if(localStorage.getItem(this.tourKey+"_"+e.id)){console.log("Tour already completed for user:",e.id);return}this.defineSteps(e),setTimeout(()=>{this.startTour(e)},2e3)}}defineSteps(e){e.isAdmin||e.role==="Administrator"?this.steps=[{element:".sidebar-header",title:"Welcome, Admin!",content:"This is your CRWI Attendance management console. Let us walk you through the key features.",position:"right"},{element:'.nav-item[data-page="admin"]',title:"User Management",content:"In the Admin Panel, you can add new staff, edit details, and manage roles.",position:"right"},{element:'.nav-item[data-page="master-sheet"]',title:"Attendance Sheet",content:"View and export the master attendance sheet for all employees here.",position:"right"},{element:'.nav-item[data-page="salary"]',title:"Salary Processing",content:"Calculate and process salaries based on attendance logs and penalties.",position:"right"},{element:".main-content",title:"Dashboard Overview",content:"The dashboard gives you real-time insights into who is in, pending leaves, and team activity.",position:"bottom"}]:this.steps=[{element:".sidebar-header",title:"Welcome to CRWI!",content:"This portal helps you track your attendance and work logs. Here is a quick guide.",position:"right"},{element:".action-btn",title:"Check-In / Out",content:"Use this button daily to mark your attendance. Don't forget to add a summary when checking out!",position:"bottom"},{element:'.nav-item[data-page="timesheet"]',title:"Your Timesheet",content:"Review your past logs and request leaves from here.",position:"right"},{element:'.nav-item[data-page="profile"]',title:"Your Profile",content:"View your stats, rewards, and manage your account details.",position:"right"}]}startTour(e){this.steps.length!==0&&(this.active=!0,this.currentStep=0,this.createUIElements(),this.showStep(),localStorage.setItem(this.tourKey+"_"+e.id,"true"))}createUIElements(){this.overlay=document.createElement("div"),this.overlay.className="tour-overlay",this.highlight=document.createElement("div"),this.highlight.className="tour-highlight",this.tooltip=document.createElement("div"),this.tooltip.className="tour-tooltip",document.body.appendChild(this.overlay),document.body.appendChild(this.highlight),document.body.appendChild(this.tooltip)}showStep(){const e=this.steps[this.currentStep],t=document.querySelector(e.element);if(!t||t.offsetParent===null){console.warn("Tour target not found:",e.element),this.nextStep();return}const a=t.getBoundingClientRect(),s=5;this.highlight.style.top=a.top-s+"px",this.highlight.style.left=a.left-s+"px",this.highlight.style.width=a.width+s*2+"px",this.highlight.style.height=a.height+s*2+"px",t.scrollIntoView({behavior:"smooth",block:"center"}),this.tooltip.innerHTML=`
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
            `,this.positionTooltip(a,e.position),this.tooltip.classList.add("active")}positionTooltip(e,t){const a=this.tooltip.getBoundingClientRect(),s=15;let i,o;switch(t){case"right":i=e.top+e.height/2-a.height/2,o=e.right+s;break;case"bottom":i=e.bottom+s,o=e.left+e.width/2-a.width/2;break;case"left":i=e.top+e.height/2-a.height/2,o=e.left-a.width-s;break;case"top":i=e.top-a.height-s,o=e.left+e.width/2-a.width/2;break;default:i=e.bottom+s,o=e.left}const r=window.innerWidth,d=window.innerHeight;o<10&&(o=10),o+a.width>r-10&&(o=r-a.width-10),i<10&&(i=10),i+a.height>d-10&&(i=d-a.height-10),this.tooltip.style.top=i+"px",this.tooltip.style.left=o+"px"}nextStep(){this.currentStep++,this.currentStep<this.steps.length?this.showStep():this.endTour()}endTour(){this.active=!1,this.overlay&&this.overlay.remove(),this.highlight&&this.highlight.remove(),this.tooltip&&this.tooltip.remove()}resetTour(e){localStorage.removeItem(this.tourKey+"_"+e),window.location.reload()}}const Nn=new Pn;typeof window<"u"&&(window.AppTour=Nn);class Bn{constructor(){this.db=z,this.chartInstance=null,this.memo=new Map,typeof window<"u"&&window.addEventListener&&window.addEventListener("app:db-write",e=>{const t=e?.detail?.collection;["attendance","users","work_plans","leaves","minutes"].includes(t)&&this.clearMemo()})}getFlags(){return x&&x.READ_OPT_FLAGS||{}}getTtls(){return x&&x.READ_CACHE_TTLS||{}}async memoize(e,t,a){if(!this.getFlags().FF_READ_OPT_ANALYTICS_CACHE)return a();const i=Date.now(),o=this.memo.get(e);if(o&&o.expiresAt>i)return o.value;const r=await a();return this.memo.set(e,{value:r,expiresAt:i+Math.max(0,Number(t)||0)}),r}clearMemo(e=""){if(!e){this.memo.clear();return}for(const t of this.memo.keys())t.startsWith(e)&&this.memo.delete(t)}async getUsersCached(){const e=this.getTtls().users||6e4;return this.memoize("analytics:users",e,async()=>{if(z&&z.getCached){const t=z.getCacheKey("analyticsUsers","users",{ttl:e});return z.getCached(t,e,()=>this.db.getAll("users"))}return this.db.getAll("users")})}async getAttendanceInRange(e,t,a=""){const s=this.getTtls().attendanceSummary||3e4,i=typeof e=="string"?e:e.toISOString().split("T")[0],o=typeof t=="string"?t:t.toISOString().split("T")[0],r=`analytics:attendance:${i}:${o}:${a}`;return this.memoize(r,s,async()=>this.db.queryMany?this.db.queryMany("attendance",[{field:"date",operator:">=",value:i},{field:"date",operator:"<=",value:o}]):(await this.db.getAll("attendance")).filter(l=>l.date>=i&&l.date<=o))}async initAdminCharts(){const e=document.getElementById("admin-stats-chart");if(!e)return;this.chartInstance&&(this.chartInstance.destroy(),this.chartInstance=null);const t=new Date,a=new Date;a.setDate(a.getDate()-14);const[s,i]=await Promise.all([this.getAttendanceInRange(a,t,"adminChart"),this.getUsersCached()]),o=this.processLast7Days(s,i),r=e.getContext("2d");try{this.chartInstance=new Chart(r,{type:"line",data:{labels:o.labels,datasets:[{label:"Staff Present",data:o.present,borderColor:"#10b981",backgroundColor:"rgba(16, 185, 129, 0.1)",fill:!0,tension:.4,borderWidth:3,pointBackgroundColor:"#10b981",pointRadius:4},{label:"On Leave",data:o.onLeave,borderColor:"#ef4444",backgroundColor:"transparent",borderDash:[5,5],tension:.1,pointRadius:0}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{intersect:!1,mode:"index"},plugins:{legend:{position:"top",labels:{usePointStyle:!0,boxWidth:6}},tooltip:{backgroundColor:"rgba(30, 27, 75, 0.9)",padding:12,titleFont:{size:14,weight:"bold"},bodyFont:{size:13},cornerRadius:8}},scales:{y:{beginAtZero:!0,ticks:{stepSize:1,color:"#6b7280"},grid:{color:"rgba(0,0,0,0.05)"}},x:{grid:{display:!1},ticks:{color:"#6b7280"}}}}})}catch(d){console.error("Chart.js Error:",d),e.parentNode.innerHTML=`<div style="color:red; text-align:center; padding:1rem;">Failed to load chart: ${d.message}</div>`}}processLast7Days(e,t=[]){const a=[],s=[],i=[],o=d=>{if(Object.prototype.hasOwnProperty.call(d||{},"attendanceEligible"))return d.attendanceEligible===!0;const l=String(d?.entrySource||"");return l==="staff_manual_work"?!1:l==="admin_override"||l==="checkin_checkout"||d?.isManualOverride||d?.location==="Office (Manual)"||d?.location==="Office (Override)"||typeof d?.activityScore<"u"||typeof d?.locationMismatched<"u"||typeof d?.autoCheckout<"u"||!!d?.checkOutLocation||typeof d?.outLat<"u"||typeof d?.outLng<"u"?!0:String(d?.type||"").includes("Leave")||d?.location==="On Leave"},r=(d,l)=>d.getFullYear()===l.getFullYear()&&d.getMonth()===l.getMonth()&&d.getDate()===l.getDate();for(let d=6;d>=0;d--){const l=new Date;l.setDate(l.getDate()-d);const c=l.toLocaleDateString("en-US",{weekday:"short",day:"numeric"});a.push(c);const f=e.filter(m=>{const h=new Date(m.date);return isNaN(h.getTime())?!1:r(h,l)}),u=new Set,p=new Set;f.forEach(m=>{if(!o(m))return;const h=m.user_id||m.userId;if(!h)return;String(m.type||"").toLowerCase().includes("leave")||m.location==="On Leave"||m.type==="Absent"?p.add(h):u.add(h)}),d===0&&t.forEach(m=>{m.status==="in"&&u.add(m.id)}),s.push(u.size),i.push(p.size)}return console.log("Weekly Stats Generated (Unique):",{labels:a,present:s}),{labels:a,present:s,onLeave:i}}parseTimeToMinutes(e){if(!e)return null;const[t,a]=e.split(" ");let[s,i]=t.split(":");return s==="12"&&(s="00"),a==="PM"&&(s=parseInt(s,10)+12),parseInt(s,10)*60+parseInt(i,10)}isAttendanceEligibleLog(e){if(Object.prototype.hasOwnProperty.call(e||{},"attendanceEligible"))return e.attendanceEligible===!0;const t=String(e?.entrySource||"");return t==="staff_manual_work"?!1:t==="admin_override"||t==="checkin_checkout"||e?.isManualOverride||e?.location==="Office (Manual)"||e?.location==="Office (Override)"||typeof e?.activityScore<"u"||typeof e?.locationMismatched<"u"||typeof e?.autoCheckout<"u"||!!e?.checkOutLocation||typeof e?.outLat<"u"||typeof e?.outLng<"u"?!0:String(e?.type||"").includes("Leave")||e?.location==="On Leave"}getAttendanceLogPriority(e){const a=String(e?.type||"").includes("Leave")||e?.location==="On Leave",s=!!e?.checkOut&&e.checkOut!=="Active Now"&&(typeof e?.activityScore<"u"||typeof e?.locationMismatched<"u"||!!e?.checkOutLocation||typeof e?.outLat<"u"||typeof e?.outLng<"u");let i=1;return s&&(i=2),a&&(i=3),e?.isManualOverride&&(i=4),i}pickBestAttendanceLogPerDay(e,t,a){const s=new Map,i=o=>`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`;return e.forEach(o=>{const r=new Date(o?.date);if(Number.isNaN(r.getTime())||r<t||r>a)return;const d=/^\d{4}-\d{2}-\d{2}$/.test(String(o?.date||""))?String(o.date):i(r),l=s.get(d);(!l||this.getAttendanceLogPriority(o)>this.getAttendanceLogPriority(l))&&s.set(d,o)}),Array.from(s.values())}formatDuration(e){const t=Math.floor(e/60),a=e%60;return`${t}h ${a}m`}getWeekNumber(e){const t=new Date(e);t.setHours(0,0,0,0),t.setDate(t.getDate()+4-(t.getUTCDay()||7));const a=new Date(t.getFullYear(),0,1);return Math.ceil(((t-a)/864e5+1)/7)}async getUserMonthlyStats(e){const t=new Date,a=new Date(t.getFullYear(),t.getMonth(),1),s=new Date(t.getFullYear(),t.getMonth()+1,0),o=(await this.getAttendanceInRange(a,s,`monthly:${e}`)).filter(r=>r.userId===e||r.user_id===e);return this.calculateStatsForLogs(o)}async getSystemMonthlySummary(){const e=new Date,t=new Date(e.getFullYear(),e.getMonth(),1),a=new Date(e.getFullYear(),e.getMonth()+1,0),[s,i]=await Promise.all([this.getUsersCached(),this.getAttendanceInRange(t,a,"sysMonthly")]);return await Promise.all(s.map(async r=>{const d=i.filter(c=>(c.userId===r.id||c.user_id===r.id)&&new Date(c.date)>=t&&new Date(c.date)<=a),l=this.calculateStatsForLogs(d);return{user:r,stats:l}}))}calculateStatsForLogs(e){const t=new Date,a=t.getFullYear(),s=t.getMonth(),i=new Date(a,s,1),o=new Date(a,s+1,0),r={Present:0,Late:0,"Early Departure":0,"Work - Home":0,Training:0,"Sick Leave":0,"Casual Leave":0,"Earned Leave":0,"Paid Leave":0,"Maternity Leave":0,Absent:0,Holiday:0,"National Holiday":0,"Regional Holidays":0},d={present:0,late:0,leaves:0,unpaidLeaves:0,penalty:0,penaltyOffset:0,effectivePenalty:0,extraWorkedHours:0,earlyDepartures:0,label:i.toLocaleDateString("default",{month:"long",year:"numeric"}),breakdown:r,totalLateDuration:"0h 0m",totalExtraDuration:"0h 0m"};let l=0,c=0;this.pickBestAttendanceLogPerDay(e,i,o).forEach(m=>{if(!this.isAttendanceEligibleLog(m))return;let h=m.type||"";const y=this.parseTimeToMinutes(m.checkIn),w=this.parseTimeToMinutes(m.checkOut);if(m.isManualOverride===!0)if(h==="Late"){d.late++,r.Late++;const A=(typeof x<"u"&&x?x.LATE_CUTOFF_MINUTES:555)||555;y!==null&&y>A&&(l+=y-A)}else h==="Early Departure"&&(d.earlyDepartures++,r["Early Departure"]++);else{const A=(typeof x<"u"&&x?x.LATE_CUTOFF_MINUTES:555)||555;(m.lateCountable===!0||!Object.prototype.hasOwnProperty.call(m,"lateCountable")&&y!==null&&y>A)&&(r.Late++,d.late++,y!==null&&(l+=Math.max(0,y-A)));const _=(typeof x<"u"&&x?x.EARLY_DEPARTURE_MINUTES:1020)||1020;w!==null&&w<_&&!String(h).includes("Leave")&&h!=="Absent"&&(d.earlyDepartures++,r["Early Departure"]++)}const v=(typeof x<"u"&&x?x.LATE_CUTOFF_MINUTES:555)||555,k=(typeof x<"u"&&x?x.EARLY_DEPARTURE_MINUTES:1020)||1020,g=typeof m.extraWorkedMs=="number"?Math.max(0,Math.round(m.extraWorkedMs/(1e3*60))):0;g>0?c+=g:!(m.autoCheckout&&!m.autoCheckoutExtraApproved)&&(y!==null&&y<v&&(c+=v-y),w!==null&&w>k&&(c+=w-k)),h==="Work - Home"?r["Work - Home"]++:h==="Training"?r.Training++:h==="Sick Leave"?(r["Sick Leave"]++,d.unpaidLeaves++):h==="Casual Leave"?r["Casual Leave"]++:h==="Earned Leave"?r["Earned Leave"]++:h==="Paid Leave"?r["Paid Leave"]++:h==="Maternity Leave"?r["Maternity Leave"]++:h==="Absent"?(r.Absent++,d.unpaidLeaves++):h==="National Holiday"?r["National Holiday"]++:h==="Regional Holidays"?r["Regional Holidays"]++:String(h).includes("Holiday")?r.Holiday++:m.checkIn&&r.Present++}),d.present=r.Present+r["Work - Home"]+r.Training,d.leaves=r["Sick Leave"]+r["Casual Leave"]+r["Earned Leave"]+r["Paid Leave"]+r["Maternity Leave"]+r.Absent,d.extraWorkedHours=Number((c/60).toFixed(2)),d.penalty=Math.floor((d.late||0)/((typeof x<"u"&&x?x.LATE_GRACE_COUNT:3)||3))*((typeof x<"u"&&x?x.LATE_DEDUCTION_PER_BLOCK:.5)||.5);const u=(typeof x<"u"&&x?x.EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4)||4,p=(typeof x<"u"&&x?x.LATE_DEDUCTION_PER_BLOCK:.5)||.5;return d.penaltyOffset=Math.floor((d.extraWorkedHours||0)/u)*p,d.effectivePenalty=Math.max(0,d.penalty-d.penaltyOffset),d.totalLateDuration=this.formatDuration(l),d.totalExtraDuration=this.formatDuration(c),d}async getUserYearlyStats(e){const{start:t,end:a,label:s}=this.getFinancialYearDates(),o=(await this.getAttendanceInRange(t,a,`yearly:${e}`)).filter(m=>m.userId===e||m.user_id===e),r={Present:0,Late:0,"Early Departure":0,"Work - Home":0,Training:0,"Sick Leave":0,"Casual Leave":0,"Earned Leave":0,"Paid Leave":0,"Maternity Leave":0,Absent:0,Holiday:0,"National Holiday":0,"Regional Holidays":0},d={present:0,late:0,leaves:0,earlyDepartures:0,penaltyLeaves:0,penaltyOffset:0,effectivePenalty:0,extraWorkedHours:0,label:s,breakdown:r,totalLateDuration:"0h 0m",totalExtraDuration:"0h 0m"};let l=0,c=0;this.pickBestAttendanceLogPerDay(o,t,a).forEach(m=>{if(!this.isAttendanceEligibleLog(m))return;let h=m.type||"";const y=this.parseTimeToMinutes(m.checkIn),w=this.parseTimeToMinutes(m.checkOut),b=(typeof x<"u"&&x?x.LATE_CUTOFF_MINUTES:555)||555,v=(typeof x<"u"&&x?x.EARLY_DEPARTURE_MINUTES:1020)||1020;m.isManualOverride===!0?h==="Late"?(r.Late++,y!==null&&y>b&&(l+=y-b)):h==="Early Departure"&&(d.earlyDepartures++,r["Early Departure"]++):((m.lateCountable===!0||!Object.prototype.hasOwnProperty.call(m,"lateCountable")&&y!==null&&y>b)&&(r.Late++,y!==null&&(l+=Math.max(0,y-b))),w!==null&&w<v&&!String(h).includes("Leave")&&h!=="Absent"&&(d.earlyDepartures++,r["Early Departure"]++));const g=typeof m.extraWorkedMs=="number"?Math.max(0,Math.round(m.extraWorkedMs/(1e3*60))):0;g>0?c+=g:!(m.autoCheckout&&!m.autoCheckoutExtraApproved)&&(y!==null&&y<b&&(c+=b-y),w!==null&&w>v&&(c+=w-v)),h==="Work - Home"?r["Work - Home"]++:h==="Training"?r.Training++:h==="Sick Leave"?r["Sick Leave"]++:h==="Casual Leave"?r["Casual Leave"]++:h==="Earned Leave"?r["Earned Leave"]++:h==="Paid Leave"?r["Paid Leave"]++:h==="Maternity Leave"?r["Maternity Leave"]++:h==="Absent"?r.Absent++:h==="National Holiday"?r["National Holiday"]++:h==="Regional Holidays"?r["Regional Holidays"]++:String(h).includes("Holiday")?r.Holiday++:m.checkIn&&r.Present++}),d.present=r.Present+r["Work - Home"]+r.Training,d.leaves=r["Sick Leave"]+r["Casual Leave"]+r["Earned Leave"]+r["Paid Leave"]+r["Maternity Leave"]+r.Absent,d.late=r.Late,d.extraWorkedHours=Number((c/60).toFixed(2)),d.totalLateDuration=this.formatDuration(l),d.totalExtraDuration=this.formatDuration(c),d.penaltyLeaves=Math.floor((r.Late||0)/((typeof x<"u"&&x?x.LATE_GRACE_COUNT:3)||3))*((typeof x<"u"&&x?x.LATE_DEDUCTION_PER_BLOCK:.5)||.5);const u=(typeof x<"u"&&x?x.EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4)||4,p=(typeof x<"u"&&x?x.LATE_DEDUCTION_PER_BLOCK:.5)||.5;return d.penaltyOffset=Math.floor((d.extraWorkedHours||0)/u)*p,d.effectivePenalty=Math.max(0,d.penaltyLeaves-d.penaltyOffset),d}getFinancialYearDates(){const e=new Date,t=e.getFullYear(),a=e.getMonth(),s=(typeof x<"u"&&x?x.FY_START_MONTH:3)||3;let i=t;a<s&&(i=t-1);const o=new Date(i,s,1),r=new Date(i+1,s,0);return{start:o,end:r,label:`FY ${i}-${i+1}`}}getDayType(e){const t=typeof e=="string"?new Date(e):e,a=t.getDay();return a===0||a===6&&typeof x<"u"&&x&&x.IS_SATURDAY_OFF&&x.IS_SATURDAY_OFF(t)?"Holiday":"Work Day"}getHeroPolicy(){return x?.HERO_POLICY||{}}parseHeroLogDate(e){if(!e)return null;if(e instanceof Date&&!Number.isNaN(e.getTime()))return e;if(typeof e!="string")return null;const t=e.trim();if(!t)return null;const a=new Date(t);if(!Number.isNaN(a.getTime()))return a;const s=t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);if(!s)return null;const i=Number(s[1]),o=Number(s[2]);let r=Number(s[3]);if(r<100&&(r+=2e3),!Number.isFinite(i)||!Number.isFinite(o)||!Number.isFinite(r))return null;const d=i>12?o:i,l=i>12?i:o,c=new Date(r,d-1,l);return Number.isNaN(c.getTime())?null:c}resolveHeroUserId(e){const t=e?.user_id??e?.userId??e?.uid??e?.user??"";return String(t||"").trim()||null}resolveHeroDurationMs(e){let t=Number(e?.durationMs);if(Number.isFinite(t)||(t=0),t>0)return t;if(e?.checkIn&&e?.checkOut&&e.checkOut!=="Active Now"){const a=this.parseTimeToMinutes(e.checkIn),s=this.parseTimeToMinutes(e.checkOut);a!==null&&s!==null&&(t=(s-a)*60*1e3)}return Math.max(0,Number(t)||0)}normalizeHeroLogs(e=[]){return(e||[]).map(t=>{const a=this.parseHeroLogDate(t?.date),s=this.resolveHeroUserId(t);if(!a||!s)return null;const i=this.resolveHeroDurationMs(t),o=Number(t?.activityScore);return{userId:s,logDate:a,dateKey:a.toISOString().split("T")[0],durationMs:i,activityLogDepth:String(t?.workDescription||"").length,activityScore:Number.isFinite(o)?o:null}}).filter(Boolean)}buildHeroCandidateStats(e=[]){const t=new Map;return e.forEach(a=>{t.has(a.userId)||t.set(a.userId,{userId:a.userId,totalDurationMs:0,daysSet:new Set,activityLogDepth:0,activityScoreTotal:0,activityScoreCount:0});const s=t.get(a.userId);s.totalDurationMs+=Math.max(0,Number(a.durationMs)||0),s.daysSet.add(a.dateKey),s.activityLogDepth+=Math.max(0,Number(a.activityLogDepth)||0),Number.isFinite(a.activityScore)&&(s.activityScoreTotal+=a.activityScore,s.activityScoreCount+=1)}),Array.from(t.values())}classifyHeroTaskStatus(e,t=null){const a=String(e||"").toLowerCase().trim(),s=window.AppCalendar?.getSmartTaskStatus?String(window.AppCalendar.getSmartTaskStatus(t,a)||a):a;return s==="completed"?"completed":s==="in-process"||s==="in progress"||s==="to-be-started"||s==="pending"||s===""?"in_progress":s==="not-completed"||s==="overdue"||s==="postponed"||s==="missed"?"missed":"in_progress"}normalizeHeroTasks(e=[]){const t=[];return(e||[]).forEach(a=>{const s=String(a?.userId||a?.user_id||"").trim();!s||!Array.isArray(a?.plans)||a.plans.forEach(i=>{if(!i||!String(i.task||"").trim())return;const o=this.classifyHeroTaskStatus(i.status,a.date);t.push({userId:s,status:o,date:a.date})})}),t}buildHeroTaskStats(e=[]){const t=new Map;return e.forEach(a=>{t.has(a.userId)||t.set(a.userId,{planned:0,completed:0,inProgress:0,missed:0});const s=t.get(a.userId);s.planned+=1,a.status==="completed"?s.completed+=1:a.status==="missed"?s.missed+=1:s.inProgress+=1}),t}rankHeroCandidates(e=[],t=new Map,a={}){const s=a.WEIGHTS||{},i=a.CAPS||{},o=Math.max(1,Number(a.WINDOW_DAYS||7)),r=Math.max(1,Number(i.hours||40)),d=a.ATTENDANCE_MODIFIER||{},l=Number(s.taskExecution??.45),c=Number(s.taskCompletionRate??.2),f=Number(s.taskInProgressSupport??.1),u=Number(s.taskMissPenalty??.1),p=Number(d.base??.9),m=Number(d.maxBonus??.15),h=Number(d.consistencyImpact??.65),y=Number(d.effortImpact??.35),w=new Map(e.map(v=>[String(v.userId),v])),b=new Set([...w.keys(),...t.keys()]);return Array.from(b).map(v=>{const k=w.get(String(v))||{totalDurationMs:0,daysSet:new Set,activityLogDepth:0},g=t.get(String(v))||{planned:0,completed:0,inProgress:0,missed:0},A=k.daysSet.size,S=k.totalDurationMs/(1e3*60*60),_=Math.max(0,Number(g.planned)||0),L=Math.max(0,Number(g.completed)||0),I=Math.max(0,Number(g.inProgress)||0),O=Math.max(0,Number(g.missed)||0),E=_>0?L/_*100:0,D=_>0?Math.max(0,Math.min(100,(L+I*.5-O)/_*100)):0,M=_>0?Math.max(0,Math.min(100,I/_*100)):0,B=_>0?Math.max(0,Math.min(100,O/_*100)):0,P=A/o*100,C=Math.min(S/r*100,100),R=D*l+E*c+M*f-B*u,H=P/100*h+C/100*y,q=Math.max(0,Math.min(m,H*m)),Y=Math.max(.5,p+q),T=R*Y;return{userId:v,days:A,hours:Number(S.toFixed(1)),totalDurationMs:Math.max(0,Number(k.totalDurationMs)||0),activityLogDepth:k.activityLogDepth,taskPlanned:_,taskCompleted:L,taskInProgress:I,taskMissed:O,completionRate:Number(E.toFixed(1)),taskScore:Number(Math.max(0,R).toFixed(2)),attendanceFactor:Number(Y.toFixed(3)),finalScore:Number(Math.max(0,T).toFixed(2))}}).sort((v,k)=>k.finalScore!==v.finalScore?k.finalScore-v.finalScore:k.taskCompleted!==v.taskCompleted?k.taskCompleted-v.taskCompleted:v.taskMissed!==k.taskMissed?v.taskMissed-k.taskMissed:k.days!==v.days?k.days-v.days:k.totalDurationMs!==v.totalDurationMs?k.totalDurationMs-v.totalDurationMs:String(v.userId).localeCompare(String(k.userId)))}createNoHeroPayload({reason:e="No eligible attendance data found.",period:t="weekly",source:a="direct_cache"}={}){return{state:"no_eligible_data",user:null,stats:null,reason:e,period:t,source:a,confidence:0,schemaVersion:Number(this.getHeroPolicy()?.SCHEMA_VERSION||1)}}scoreHeroFromLogs(e=[],t=[],a={}){const s=String(a.period||"weekly"),i=String(a.source||"direct_cache"),o=this.getHeroPolicy(),r=o.MIN_EVIDENCE||{},d=Math.max(1,Number(r.minDays||1)),l=Math.max(0,Number(r.minDurationMs||1)),c=Math.max(0,Number(r.minPlannedTasks||1)),f=this.normalizeHeroLogs(e),u=Array.isArray(a.workPlans)?a.workPlans:[],p=this.normalizeHeroTasks(u);if(f.length===0&&p.length===0)return this.createNoHeroPayload({period:s,source:i});const h=this.rankHeroCandidates(this.buildHeroCandidateStats(f),this.buildHeroTaskStats(p),o).filter(A=>A.taskPlanned>=c&&(A.days>=d||A.totalDurationMs>=l));if(h.length===0)return this.createNoHeroPayload({reason:"No staff met the minimum hero criteria this period.",period:s,source:i});const y=h[0],w=(t||[]).find(A=>String(A.id)===String(y.userId));if(!w)return this.createNoHeroPayload({reason:"No valid user mapping found for hero candidates.",period:s,source:i});const b=y.taskPlanned>0?Math.min(1,y.taskCompleted/y.taskPlanned):0,v=Math.min(1,y.days/Math.max(1,Number(o.WINDOW_DAYS||7))),k=Math.min(1,y.totalDurationMs/(1e3*60*60*Math.max(1,Number(o?.CAPS?.hours||40)))),g=Number(((b+v+k)/3).toFixed(2));return{state:"winner",user:w,stats:y,reason:this.determineHeroReason(y),period:s,source:i,confidence:g,schemaVersion:Number(o.SCHEMA_VERSION||1)}}async getHeroOfTheWeek(e={}){try{const t=this.getHeroPolicy(),a=Math.max(1,Number(t.WINDOW_DAYS||7)),s=Math.max(a,Number(t.FALLBACK_LOOKBACK_DAYS||90)),i=new Date,o=new Date(i);o.setDate(o.getDate()-a),o.setHours(0,0,0,0);const[r,d,l]=await Promise.all([this.getAttendanceInRange(o,i,"hero"),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:o.toISOString().split("T")[0]},{field:"date",operator:"<=",value:i.toISOString().split("T")[0]}]):this.db.getAll("work_plans"),this.getUsersCached()]),c=this.scoreHeroFromLogs(r,l,{period:"weekly",source:String(e.source||"direct_cache"),workPlans:d});if(c.state==="winner")return c;const f=new Date(i);f.setDate(f.getDate()-s),f.setHours(0,0,0,0);const[u,p]=await Promise.all([this.getAttendanceInRange(f,i,"hero_fallback_lookback"),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:f.toISOString().split("T")[0]},{field:"date",operator:"<=",value:i.toISOString().split("T")[0]}]):this.db.getAll("work_plans")]),m=this.normalizeHeroLogs(u),h=this.normalizeHeroTasks(p);if(m.length===0&&h.length===0)return this.createNoHeroPayload({reason:c.reason,period:"latest_active_window",source:String(e.source||"direct_cache")});const y=m.length>0?m.reduce((A,S)=>S.logDate>A?S.logDate:A,m[0].logDate):null,w=h.length>0?h.reduce((A,S)=>{const _=this.parseHeroLogDate(S?.date);return _&&(!A||_>A)?_:A},null):null,b=y||w||i,v=new Date(b);v.setDate(v.getDate()-(a-1)),v.setHours(0,0,0,0);const k=(u||[]).filter(A=>{const S=this.parseHeroLogDate(A?.date);return!!S&&S>=v&&S<=b}),g=(p||[]).filter(A=>{const S=this.parseHeroLogDate(A?.date);return!!S&&S>=v&&S<=b});return this.scoreHeroFromLogs(k,l,{period:"latest_active_window",source:String(e.source||"direct_cache"),workPlans:g})}catch(t){return console.error("Hero Calculation Error:",t),{state:"fetch_error",user:null,stats:null,reason:"Unable to calculate hero right now.",period:"weekly",source:String(e.source||"direct_cache"),confidence:0,schemaVersion:Number(this.getHeroPolicy()?.SCHEMA_VERSION||1)}}}determineHeroReason(e){const t=Number(e?.taskPlanned||0),a=Number(e?.taskCompleted||0),s=Number(e?.taskInProgress||0),i=Number(e?.taskMissed||0),o=t>0?a/t*100:0,r=Number(e?.attendanceFactor||1);return t>=6&&o>=80?"Execution Champion":a>=4&&s>=2?"Delivery Momentum":o>=70&&r>=1?"Reliable Executor":t>0&&i===0&&o>=60?"Reliable Finisher":"Top Performer"}async getSystemPerformance(){try{const e=new Date;e.setDate(e.getDate()-7);const t=await this.getAttendanceInRange(e,new Date,"performance"),a=[],s=[];let i=0,o=0;const r=(l,c)=>l.getFullYear()===c.getFullYear()&&l.getMonth()===c.getMonth()&&l.getDate()===c.getDate();for(let l=6;l>=0;l--){const c=new Date;c.setDate(c.getDate()-l);const f=c.toLocaleDateString("en-US",{weekday:"narrow"});s.push(f);const u=t.filter(p=>{const m=new Date(p.date);return!isNaN(m.getTime())&&r(m,c)});if(u.length===0)a.push(0);else{const p=u.map(h=>h.activityScore||0).filter(h=>h>0),m=p.length>0?p.reduce((h,y)=>h+y,0)/p.length:0;a.push(Math.round(m)),m>0&&(i+=m,o++)}}return{avgScore:o>0?Math.round(i/o):0,trendData:a,labels:s}}catch(e){return console.error("System Performance Calculation Error:",e),{avgScore:0,trendData:[0,0,0,0,0,0,0]}}}async buildDailyDashboardSummary(e={}){const t=new Date,a=String(e.dateKey||t.toISOString().split("T")[0]),s=String(e.selectedMonth||t.toISOString().slice(0,7)),[i,o]=s.split("-"),r=Number(i),d=Number(o)-1,l=Number.isInteger(r)&&Number.isInteger(d)&&d>=0&&d<=11?new Date(r,d,1):new Date(t.getFullYear(),t.getMonth(),1),c=Number.isInteger(r)&&Number.isInteger(d)&&d>=0&&d<=11?new Date(r,d+1,0):new Date(t.getFullYear(),t.getMonth()+1,0),f=Math.max(1,Number(x?.SUMMARY_POLICY?.TEAM_ACTIVITY_LIMIT)||15),[u,p]=await Promise.all([this.getHeroOfTheWeek({source:"shared_summary"}),this.getAllStaffActivities({mode:"month",month:s,scope:"work"})]);return{dateKey:a,monthKey:s,version:Number(x?.SUMMARY_POLICY?.SCHEMA_VERSION||1),generatedAt:Date.now(),hero:u&&u.state!=="fetch_error"?u:null,teamActivityPreview:(p||[]).slice(0,f),range:{startIso:l.toISOString().split("T")[0],endIso:c.toISOString().split("T")[0]},meta:{generatedAt:Date.now(),source:"client_first_writer"}}}async getAllStaffActivities(e={}){try{const t=e||{},a=t.mode||"month",s=t.scope||"all",i=new Date,o=new Date;if(a==="range"){const y=String(t.startIso||""),w=String(t.endIso||"");if(!y||!w)throw new Error("Range mode requires startIso and endIso.");const b=new Date(y),v=new Date(w);if(Number.isNaN(b.getTime())||Number.isNaN(v.getTime()))throw new Error(`Invalid range dates: ${y} to ${w}`);o.setTime(b.getTime()),i.setTime(v.getTime()),o.setHours(0,0,0,0),i.setHours(23,59,59,999)}else if(a==="days"){const y=Number.isFinite(Number(t.daysBack))?Number(t.daysBack):7;i.setHours(23,59,59,999),o.setDate(o.getDate()-y),o.setHours(0,0,0,0)}else{const y=String(t.month||new Date().toISOString().slice(0,7)),[w,b]=y.split("-"),v=Number(w),k=Number(b)-1;if(!Number.isInteger(v)||!Number.isInteger(k)||k<0||k>11)throw new Error(`Invalid month key: ${y}`);const g=new Date(v,k,1),A=new Date(v,k+1,0);o.setTime(g.getTime()),i.setTime(A.getTime()),o.setHours(0,0,0,0),i.setHours(23,59,59,999)}const r=o.toISOString().split("T")[0],d=i.toISOString().split("T")[0],l=s!=="work",[c,f,u]=await Promise.all([l?this.getAttendanceInRange(o,i,`staffAct:${r}:${d}:${s}`):Promise.resolve([]),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:r},{field:"date",operator:"<=",value:d}]):z.getAll("work_plans"),this.getUsersCached()]),p={};u.forEach(y=>{p[y.id]=y.name});const m=[],h={};return l&&c.forEach(y=>{const w=new Date(y.date);if(w>=o&&w<=i&&y.workDescription){const b=y.user_id||y.userId,v=`${b}:${y.date}`;h[v]||(h[v]=[]),h[v].push(y.workDescription.toLowerCase().trim()),m.push({...y,type:"attendance",staffName:p[b]||y.userName||"Unknown Staff",_displayDesc:y.workDescription,_sortTime:y.checkOut||"00:00"})}}),f.forEach(y=>{const w=new Date(y.date);if(w>=o&&w<=i&&y.plans){const b=`${y.userId}:${y.date}`,v=h[b]||[];y.plans.forEach((k,g)=>{const A=(k.task||"").trim().toLowerCase();if(A&&v.length>0&&v.some(I=>I.includes(A)))return;const S=y.userId||y.user_id;let _=p[S]||y.userName;_||(_=S==="annual_shared"?"All Staff":"Unknown Staff"),m.push({...k,date:y.date,id:y.id,planId:y.id,taskIndex:g,planScope:k.planScope||y.planScope||"personal",userId:S,type:"work",staffName:_,_displayDesc:k.task,_sortTime:"09:00"})})}}),m.sort((y,w)=>{const b=new Date(w.date)-new Date(y.date);return b!==0?b:w._sortTime.localeCompare(y._sortTime)}),m}catch(t){return console.error("Error fetching all staff activities:",t),[]}}}const On=new Bn;typeof window<"u"&&(window.AppAnalytics=On);class Un{constructor(){this.db=z}convertToCSV(e,t,a){const s=t.join(","),i=e.map(o=>a.map(r=>{let d=o[r]||"";return d=String(d).replace(/"/g,'""'),d.search(/("|,|\n)/g)>=0&&(d=`"${d}"`),d}).join(","));return[s,...i].join(`
`)}downloadFile(e,t,a){const s=new Blob([e],{type:a}),i=URL.createObjectURL(s),o=document.createElement("a");o.href=i,o.download=t,document.body.appendChild(o),o.click(),setTimeout(()=>{document.body.removeChild(o),window.URL.revokeObjectURL(i)},0)}summarizeTaskUpdates(e){return!Array.isArray(e)||e.length===0?"":e.map(t=>{const a=t.action||"action",s=Number.isFinite(Number(t.progressPercent))?`${Number(t.progressPercent)}%`:"",i=t.progressStatus?String(t.progressStatus).replace(/_/g," "):"",o=t.progressNote?` - ${t.progressNote}`:"",r=`${s}${s&&i?" ":""}${i}`.trim(),d=r?` (${r})`:"";return`${a}${d}${o}`.trim()}).join(" | ")}async exportAttendanceCSV(){try{const e=await this.db.getAll("users"),t=await this.db.getAll("attendance"),a={};e.forEach(l=>a[l.id]=l);const s=t.map(l=>{const c=l.user_id||l.userId,f=a[c]||{name:"Unknown",role:"N/A",rating:0,completionStats:{}};let u=l.location||"N/A";return l.lat&&l.lng&&(u=`Lat: ${Number(l.lat).toFixed(5)}, Lng: ${Number(l.lng).toFixed(5)}`),{date:l.date,name:f.name,role:f.role,rating:f.rating?f.rating.toFixed(1):"N/A",completionRate:f.completionStats?.completionRate?`${(f.completionStats.completionRate*100).toFixed(0)}%`:"N/A",checkIn:l.checkIn,checkOut:l.checkOut||"--",duration:l.duration||"--",workSummary:l.workDescription||"--",taskUpdates:this.summarizeTaskUpdates(l.taskUpdates||[]),inLocation:u,outLocation:l.checkOutLocation||"--",type:l.type||"Standard"}});e.forEach(l=>{if(l.status==="in"&&l.lastCheckIn){const c=new Date(l.lastCheckIn);s.push({date:c.toLocaleDateString(),name:l.name,role:l.role,checkIn:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:"Active Now",duration:"Working...",workSummary:"Current Session (Active)",inLocation:l.currentLocation?.address||"Current Session",outLocation:"--",type:"Office (Active)"})}}),s.sort((l,c)=>new Date(c.date)-new Date(l.date));const i=["Date","Staff Name","Role","Star Rating","Completion Rate","Check In","Check Out","Duration","Work Summary","Task Updates","Check-in Location","Check-out Location","Type"],o=["date","name","role","rating","completionRate","checkIn","checkOut","duration","workSummary","taskUpdates","inLocation","outLocation","type"],r=this.convertToCSV(s,i,o),d=`Attendance_Report_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(r,d,"text/csv"),!0}catch(e){throw console.error("Export Failed:",e),new Error("Failed to generate report")}}async exportUserLogsCSV(e,t){try{const a=t.map(d=>{let l=d.location||"N/A";return d.lat&&d.lng&&(l=`Lat: ${Number(d.lat).toFixed(5)}, Lng: ${Number(d.lng).toFixed(5)}`),{date:d.date,name:e.name,role:e.role,checkIn:d.checkIn,checkOut:d.checkOut||"--",duration:d.duration||"--",workSummary:d.workDescription||"--",taskUpdates:this.summarizeTaskUpdates(d.taskUpdates||[]),inLocation:l,outLocation:d.checkOutLocation||"--",type:d.type||"Standard"}});a.sort((d,l)=>new Date(l.date)-new Date(d.date));const s=["Date","Staff Name","Role","Check In","Check Out","Duration","Work Summary","Task Updates","Check-in Location","Check-out Location","Type"],i=["date","name","role","checkIn","checkOut","duration","workSummary","taskUpdates","inLocation","outLocation","type"],o=this.convertToCSV(a,s,i),r=`Attendance_Report_${e.name.replace(/ /g,"_")}_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(o,r,"text/csv"),!0}catch(a){console.error("Export Failed:",a),alert("Failed to export logs: "+a.message)}}async exportMasterSheetCSV(e,t,a,s){try{const i=new Date(t,e+1,0).getDate(),o=["S.No","Staff Name","Department"];for(let f=1;f<=i;f++)o.push(String(f));const r=a.sort((f,u)=>f.name.localeCompare(u.name)).map((f,u)=>{const p=[u+1,f.name,f.dept||"General"];for(let m=1;m<=i;m++){const h=`${t}-${String(e+1).padStart(2,"0")}-${String(m).padStart(2,"0")}`,y=s.filter(w=>(w.userId===f.id||w.user_id===f.id)&&w.date===h);if(y.length>0){const w=y[0];let b=w.type||"P";b==="Short Leave"&&w.durationHours&&(b=`SL(${w.durationHours}h)`),p.push(`${b} (${w.checkIn}-${w.checkOut||"Active"})`)}else p.push("-")}return p}),d=[o.join(","),...r.map(f=>f.join(","))].join(`
`),c=`Attendance_Sheet_${new Date(t,e).toLocaleString("default",{month:"long"})}_${t}.csv`;return this.downloadFile(d,c,"text/csv"),!0}catch(i){console.error("Export Failed:",i),alert("Export Failed: "+i.message)}}async exportLeavesCSV(e){try{const t=["Applied On","Staff Name","FY","Type","From","To","Days/Hrs","Reason","Status","Admin Comment"],a=["appliedOn","userName","financialYear","type","startDate","endDate","daysCount","reason","status","adminComment"],s=e.map(r=>({...r,daysCount:r.type==="Short Leave"?`${r.durationHours||0}h`:r.daysCount})),i=this.convertToCSV(s,t,a),o=`Leave_Requests_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(i,o,"text/csv"),!0}catch(t){console.error("Leave Export Failed:",t),alert("Export Failed: "+t.message)}}async exportCalendarPlansCSV(e,t,a){try{const s=[],i=new Date(a,t+1,0).getDate(),o=new Date(a,t).toLocaleString("default",{month:"long"});for(let f=1;f<=i;f++){const u=`${a}-${String(t+1).padStart(2,"0")}-${String(f).padStart(2,"0")}`;e.leaves.forEach(p=>{u>=p.startDate&&u<=p.endDate&&s.push({date:u,category:"Leave",subject:`${p.userName||"Staff"} - ${p.type}`,details:p.reason||"No reason provided",staff:p.userName||"Staff"})}),e.events.forEach(p=>{p.date===u&&s.push({date:u,category:"Event",subject:p.title,details:p.type||"General Event",staff:"Organization"})}),e.workPlans.forEach(p=>{if(p.date===u){const m=Array.isArray(p.plans)?p.plans:[],h=m.length>0?m.map((y,w)=>{let b=`${w+1}. ${y.task}`;return y.subPlans&&y.subPlans.length>0&&(b+=` (Steps: ${y.subPlans.join(", ")})`),y.tags&&y.tags.length>0&&(b+=` [With: ${y.tags.map(v=>`@${v.name} (${v.status||"pending"})`).join(", ")}]`),b}).join(" | "):"Work Plan";s.push({date:u,category:"Work Plan",subject:"Daily Goals",details:h,staff:p.userName||"Staff"})}})}if(s.length===0)return alert("No plans found for the selected month."),!1;const r=["Date","Category","Subject","Details","Staff Member"],d=["date","category","subject","details","staff"],l=this.convertToCSV(s,r,d),c=`Team_Schedule_${o}_${a}.csv`;return this.downloadFile(l,c,"text/csv"),!0}catch(s){console.error("Calendar Export Failed:",s),alert("Failed to export calendar: "+s.message)}}async exportAnnualListViewCSV(e){try{const t=(e||[]).map(r=>({date:r.date||"",staffName:r.staffName||r.staff||"",assignedBy:r.assignedBy||"",assignedTo:r.assignedTo||"",selfAssigned:r.selfAssigned?"Yes":"No",dueDate:r.dueDate||"",status:r.statusLabel||r.status||"",comments:r.comments||"",tags:Array.isArray(r.tags)?r.tags.join(", "):r.tags||""})),a=["Date","Staff Name","Assigned By","Assigned To","Self Assigned","Due Date","Completion Status","Comments","Tags"],s=["date","staffName","assignedBy","assignedTo","selfAssigned","dueDate","status","comments","tags"],i=this.convertToCSV(t,a,s),o=`Annual_Plan_List_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(i,o,"text/csv"),!0}catch(t){throw console.error("List Export Failed:",t),new Error("Failed to export list: "+t.message)}}exportTeamActivitiesXLSX(e,t={}){try{if(typeof window>"u"||!window.XLSX)return alert("Excel export library not loaded."),!1;const a=(e||[]).map(f=>[f.date||"",f.staffName||"",f.type||"",f.status||"",f.description||"",f.sourceTime||""]),s=["Date","Staff","Type","Status","Description","Time"],i=window.XLSX.utils.aoa_to_sheet([s,...a]),o=window.XLSX.utils.book_new();window.XLSX.utils.book_append_sheet(o,i,"Team Activities");const r=(t.start||"").replace(/[^a-zA-Z0-9_-]/g,"_"),d=(t.end||"").replace(/[^a-zA-Z0-9_-]/g,"_"),c=`Team_Activities_${r&&d?`${r}_to_${d}`:r||d||"export"}.xlsx`;return window.XLSX.writeFile(o,c),!0}catch(a){return console.error("Team Activities Export Failed:",a),alert("Export Failed: "+a.message),!1}}}const Rn=new Un;typeof window<"u"&&(window.AppReports=Rn);class Hn{constructor(){this.db=z,this.cache={},this.defaultPolicy={"Annual Leave":{total:10,minDays:3,accrual:"annual"},"Casual Leave":{total:6,maxDays:2,accrual:"monthly"},"Medical Leave":{total:6,certificateThreshold:2,accrual:"annual"},"Maternity Leave":{total:180,paid:!0,gender:"female"},"Paternity Leave":{total:10,paid:!0,gender:"male",minServiceYears:0},"Study Leave":{total:5,paid:!1,requireApproval:!0},"Compassionate Leave":{total:3,paid:!0}}}async getPolicy(){if(this.cache.policy)return this.cache.policy;try{if(window.AppFirestore){const e=await window.AppFirestore.collection("settings").doc("policies").get();e.exists?this.cache.policy={...this.defaultPolicy,...e.data()}:this.cache.policy=this.defaultPolicy}else this.cache.policy=this.defaultPolicy}catch(e){console.warn("Failed to fetch dynamic policy, using default.",e),this.cache.policy=this.defaultPolicy}return this.cache.policy}async updatePolicy(e){try{if(window.AppFirestore)return await window.AppFirestore.collection("settings").doc("policies").set(e,{merge:!0}),this.cache.policy=null,!0;throw new Error("Database not connected")}catch(t){throw console.error("Failed to update policy:",t),t}}async getFinancialYear(e=new Date){const t=e.getMonth(),a=e.getFullYear();return t<3?{label:`${a-1}-${a}`,start:new Date(a-1,3,1),end:new Date(a,2,31)}:{label:`${a}-${a+1}`,start:new Date(a,3,1),end:new Date(a+1,2,31)}}async getUserLeaves(e,t=null){t||(t=(await this.getFinancialYear()).label);try{if(this.db.queryMany&&x?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES)return(await this.db.queryMany("leaves",[{field:"userId",operator:"==",value:e},{field:"financialYear",operator:"==",value:t}])).sort((i,o)=>new Date(o.startDate)-new Date(i.startDate))}catch(s){console.warn("Scoped getUserLeaves query failed, using fallback",s)}return(await this.db.getAll("leaves")).filter(s=>s.userId===e&&s.financialYear===t).sort((s,i)=>new Date(i.startDate)-new Date(s.startDate))}async getLeaveUsage(e,t,a){return(await this.getUserLeaves(e,a.label)).filter(o=>o.type===t&&(o.status==="Approved"||o.status==="Pending")).reduce((o,r)=>o+(parseFloat(r.daysCount)||0),0)}async getMonthlyShortLeaveUsage(e,t){const a=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}`;let s=[];try{this.db.queryMany&&x?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES&&(s=(await this.db.queryMany("leaves",[{field:"userId",operator:"==",value:e},{field:"type",operator:"==",value:"Short Leave"},{field:"startDate",operator:">=",value:`${a}-01`},{field:"startDate",operator:"<=",value:`${a}-31`}])).filter(o=>o.status==="Approved"||o.status==="Pending"))}catch(i){console.warn("Scoped short leave query failed, using fallback",i)}return s.length||(s=(await this.db.getAll("leaves")).filter(o=>o.userId===e&&o.type==="Short Leave"&&o.startDate.startsWith(a)&&(o.status==="Approved"||o.status==="Pending"))),s.reduce((i,o)=>i+(parseFloat(o.daysCount||o.durationHours)||0),0)}async getPendingLeaves(){try{let e=[];if(this.db.queryMany&&x?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES?e=(await this.db.queryMany("leaves",[{field:"status",operator:"==",value:"Pending"}],{orderBy:[{field:"appliedOn",direction:"desc"}]})).sort((a,s)=>new Date(s.appliedOn)-new Date(a.appliedOn)):e=(await this.db.getAll("leaves")).filter(a=>a.status==="Pending").sort((a,s)=>new Date(s.appliedOn)-new Date(a.appliedOn)),e.length>0){const t=await this.db.getAll("users"),a={};t.forEach(s=>{a[s.id]=s.name}),e.forEach(s=>{!s.userName&&a[s.userId]&&(s.userName=a[s.userId])})}return e}catch(e){return console.warn("getPendingLeaves failed, using fallback",e),(await this.db.getAll("leaves").catch(()=>[])).filter(a=>a.status==="Pending").sort((a,s)=>new Date(s.appliedOn)-new Date(a.appliedOn))}}async requestLeave(e){const{userId:t,startDate:a,endDate:s,type:i,durationHours:o}=e,r=new Date(a),d=new Date(s);let l=Math.ceil((d-r)/(1e3*60*60*24))+1;if(l<=0&&i!=="Short Leave")throw new Error("Invalid date range");const c=await this.getFinancialYear(r),f=await this.getLeaveUsage(t,i,c),p=(await this.getPolicy())[i],m=[];if(i==="Half Day")l=.5,e.daysCount=.5;else if(i==="Short Leave"){const y=await this.getMonthlyShortLeaveUsage(t,r);let w=parseFloat(o||0);w>2&&m.push("Short Leave exceeds 2 hours (standard)."),y+w>4&&m.push(`Monthly Short Leave limit exceeded (${y+w}/4 hours).`),e.daysCount=w}else if(i==="Annual Leave")l<(p.minDays||1)&&m.push(`Annual Leave requested is less than required minimum (${p.minDays||1} days).`),f+l>p.total&&m.push(`Annual Leave balance exceeded (${f+l}/${p.total}).`);else if(i==="Casual Leave")l>p.maxDays&&m.push(`Casual Leave exceeds maximum allowed per request (${p.maxDays} days).`),f+l>p.total&&m.push(`Casual Leave balance exceeded (${f+l}/${p.total}).`);else if(i==="Medical Leave")f+l>p.total&&m.push(`Medical Leave balance exceeded (${f+l}/${p.total}).`),l>p.certificateThreshold&&(e.requireCertificate=!0);else if(i==="Paternity Leave"){const y=await this.db.get("users",t),w=new Date(y.joinDate),b=(r-w)/(1e3*60*60*24*365.25);p.minServiceYears&&b<p.minServiceYears&&m.push(`User has not completed ${p.minServiceYears} year(s) of service (required for Paternity Leave).`),l>p.total&&m.push(`Paternity Leave exceeds limit of ${p.total} days.`)}else["Study Leave","Compassionate Leave"].includes(i)&&p&&l>p.total&&m.push(`${i} exceeds limit of ${p.total} days.`);const h={id:"l"+Date.now(),...e,status:"Pending",appliedOn:new Date().toISOString(),financialYear:c.label,daysCount:l,policyWarnings:m};return await this.db.add("leaves",h),h}async updateLeaveStatus(e,t,a,s=""){const i=await this.db.get("leaves",e);if(!i)throw new Error("Leave not found");const o=a||window.AppAuth?.getUser?.()?.id||null;if(i.status=t,i.actionDate=new Date().toISOString(),i.adminComment=s,o?i.actionBy=o:delete i.actionBy,await this.db.put("leaves",i),t==="Approved"){const r=new Date(i.startDate),d=new Date(i.endDate);let l=new Date(r);for(;l<=d;){const c=l.toISOString().split("T")[0],f={id:"att_"+i.userId+"_"+c,user_id:i.userId,date:c,checkIn:"09:00",checkOut:"17:00",duration:"8h 0m",location:"On Leave",type:i.type,status:"in",synced:!1};await this.db.put("attendance",f),l.setDate(l.getDate()+1)}}return i}}const be=new Hn;typeof window<"u"&&(window.AppLeaves=be);class Fn{constructor(){this.db=z,this.cleanupFlag=x?.SIMULATION_POLICY?.LEGACY_DUMMY_CLEANUP?.FLAG_KEY||"legacy_dummy_cleanup_v1",this.simulationFlag="simulation_run_v2"}getCleanupPolicy(){const e=x?.SIMULATION_POLICY?.LEGACY_DUMMY_CLEANUP||{},t=new Set((e.TARGET_USER_IDS||[]).map(s=>String(s||"").trim()).filter(Boolean)),a=new Set((e.TARGET_USERNAMES||[]).map(s=>String(s||"").trim().toLowerCase()).filter(Boolean));return{enabled:e.ENABLED!==!1,targetIds:t,targetUsernames:a,auditCollection:String(e.AUDIT_COLLECTION||"system_audit_logs")}}async writeCleanupAudit(e,t={}){const a=this.getCleanupPolicy();try{await this.db.add(a.auditCollection,{type:e,module:"simulation",payload:t,createdAt:Date.now()})}catch(s){console.warn("Simulation audit log write failed:",s)}}async run(){const e=x&&x.READ_OPT_FLAGS||{},t=typeof window<"u"&&window.location&&window.location.hostname?window.location.hostname:"",a=t==="localhost"||t==="127.0.0.1";if(!(!e.ENABLE_SIMULATION_MODULE&&!a)){if(localStorage.getItem(this.cleanupFlag)||(await this.cleanupLegacyDummyData(),localStorage.setItem(this.cleanupFlag,"true")),localStorage.getItem(this.simulationFlag)){console.log("Simulation already ran. Use window.AppSimulation.forceRun() to force.");return}await this.forceRun(),localStorage.setItem(this.simulationFlag,"true")}}async cleanupLegacyDummyData(){const e=this.getCleanupPolicy();if(e.enabled){if(e.targetIds.size===0&&e.targetUsernames.size===0){await this.writeCleanupAudit("legacy_dummy_cleanup_skipped",{reason:"no_targets"});return}try{const a=(await this.db.getAll("users")).filter(u=>e.targetIds.has(u.id)||e.targetUsernames.has((u.username||"").trim().toLowerCase())),s=new Set(a.map(u=>u.id));if(s.size===0){await this.writeCleanupAudit("legacy_dummy_cleanup_skipped",{reason:"no_matches",configuredTargets:{ids:Array.from(e.targetIds),usernames:Array.from(e.targetUsernames)}});return}let i=0,o=0,r=0,d=0;const l=await this.db.getAll("attendance");for(const u of l){const p=u.user_id||u.userId;s.has(p)&&(await this.db.delete("attendance",u.id),i+=1)}const c=await this.db.getAll("leaves");for(const u of c){const p=u.userId||u.user_id;s.has(p)&&(await this.db.delete("leaves",u.id),o+=1)}const f=await this.db.getAll("work_plans");for(const u of f){const p=u.userId||u.user_id;s.has(p)&&(await this.db.delete("work_plans",u.id),r+=1)}for(const u of a)await this.db.delete("users",u.id),d+=1;await this.writeCleanupAudit("legacy_dummy_cleanup_completed",{matchedUserIds:Array.from(s),deleted:{attendance:i,leaves:o,workPlans:r,users:d}}),console.log("Legacy dummy users and linked records removed.",{users:d,attendance:i,leaves:o,workPlans:r})}catch(t){await this.writeCleanupAudit("legacy_dummy_cleanup_failed",{message:t?.message||String(t)}),console.warn("Legacy dummy cleanup failed:",t)}}}async forceRun(){console.log("Starting Office Scenario Simulation (V2)...");const e=new Date;if(window.AppCalendar){const t=new Date(e);t.setDate(t.getDate()+1),await window.AppCalendar.addEvent({title:"Office Picnic/Holiday",date:t.toISOString().split("T")[0],type:"holiday"})}console.log("Simulation Complete.")}}const Vt=new Fn;typeof window<"u"&&(window.AppSimulation=Vt,setTimeout(()=>Vt.run(),2e3));const ae="minutes";function $e(){const n=window.AppAuth.getUser();if(!n||!n.id)throw new Error("User not authenticated");return n}function Ke(n){return!!(window.app_hasPerm&&window.app_hasPerm("minutes","admin",n))}function qn(n,e,t,a={}){const s=n&&n.createdBy===e.id,i=Ke(e),o=a&&a.allowNonOwner===!0;if(!s&&!i&&!o)throw new Error("You do not have permission to edit these minutes.");if(n&&n.locked&&!(a&&a.allowOnLocked===!0))throw new Error("This record is locked.");return!t||!String(t).trim()?"Updated minutes":String(t).trim()}async function zn(n={}){try{const e=n.limit||150;return window.AppDB?await window.AppDB.getAll(ae):(await window.AppFirestore.collection(ae).orderBy("date","desc").limit(e).get()).docs.map(a=>({id:a.id,...a.data()}))}catch(e){throw console.error("Error fetching minutes:",e),e}}async function jn(n){try{const e=$e(),t=new Date().toISOString(),a=e.name||e.username||"Unknown",s={...n,createdBy:e.id,createdByName:a,createdAt:t,lastEditedBy:e.id,lastEditedByName:a,lastEditedAt:t,auditLog:[{userId:e.id,userName:a,timestamp:t,action:"Created meeting minutes"}],approvals:{},locked:!1,restrictedFrom:[],allowedViewers:[],accessRequests:[]};return window.AppDB?await window.AppDB.add(ae,s):(await window.AppFirestore.collection(ae).add(s)).id}catch(e){throw console.error("Error adding minute:",e),e}}async function Ge(n,e,t,a={}){try{const s=$e(),i=await(window.AppDB?window.AppDB.get(ae,n):window.AppFirestore.collection(ae).doc(n).get().then(f=>f.data()));if(!i)throw new Error("Minute not found");const o=qn(i,s,t,a),r=new Date().toISOString(),d=s.name||s.username||"Unknown",l={userId:s.id,userName:d,timestamp:r,action:o},c={...i,...e,id:n,lastEditedBy:s.id,lastEditedByName:d,lastEditedAt:r,auditLog:[...i.auditLog||[],l]};return window.AppDB?await window.AppDB.put(ae,c):await window.AppFirestore.collection(ae).doc(n).update(c),!0}catch(s){throw console.error("Error updating minute:",s),s}}async function Wn(n){try{const e=$e(),t=await(window.AppDB?window.AppDB.get(ae,n):window.AppFirestore.collection(ae).doc(n).get().then(s=>s.data()));if(!t)throw new Error("Minute not found");const a=t.accessRequests||[];return a.some(s=>s.userId===e.id)?!0:(a.push({userId:e.id,userName:e.name||e.username||"Unknown",status:"pending",requestedAt:new Date().toISOString()}),await Ge(n,{accessRequests:a},`Requested access for ${e.name||e.username}`,{allowNonOwner:!0,allowOnLocked:!0}))}catch(e){throw console.error("Error requesting access:",e),e}}async function Yn(n,e,t){try{const a=$e(),s=await(window.AppDB?window.AppDB.get(ae,n):window.AppFirestore.collection(ae).doc(n).get().then(c=>c.data()));if(!s)throw new Error("Minute not found");const i=s.createdBy===a.id,o=Ke(a);if(!i&&!o)throw new Error("Only owner or admin can review access requests.");const r=s.accessRequests||[],d=r.find(c=>c.userId===e);if(!d)return!0;d.status=t;const l=s.allowedViewers||[];return t==="approved"&&!l.includes(e)&&l.push(e),await Ge(n,{accessRequests:r,allowedViewers:l},`${String(t||"").toUpperCase()} access request for userId: ${e}`,{allowOnLocked:!0})}catch(a){throw console.error("Error handling access request:",a),a}}async function Vn(n,e,t){try{const a=$e(),s=await(window.AppDB?window.AppDB.get(ae,n):window.AppFirestore.collection(ae).doc(n).get().then(l=>l.data()));if(!s||!s.actionItems)throw new Error("Minute or tasks not found");const i=s.actionItems[e];if(!i)throw new Error("Task not found");const o=s.createdBy===a.id,r=Ke(a),d=i.assignedTo===a.id;if(!o&&!r&&!d)throw new Error("Only owner, admin, or assignee can update this task.");return i.status=t,t==="completed"&&(i.completedAt=new Date().toISOString()),await Ge(n,{actionItems:s.actionItems},`Updated Task: ${i.task} to ${t}`,{allowNonOwner:!0,allowOnLocked:!0})}catch(a){throw console.error("Error updating action item:",a),a}}async function Kn(n){try{const e=$e(),t=await(window.AppDB?window.AppDB.get(ae,n):window.AppFirestore.collection(ae).doc(n).get().then(c=>c.data()));if(!t)throw new Error("Minute not found");const a=t.attendeeIds||[],s=a.includes(e.id),i=t.createdBy===e.id,o=Ke(e);if(!s&&!i&&!o)throw new Error("Only attendees, owner, or admin can approve minutes.");const r=t.approvals||{};r[e.id]=new Date().toISOString();const d=a.length>0&&a.every(c=>r[c]),l={approvals:r};return d&&(l.locked=!0),await Ge(n,l,`${d?"FINAL APPROVAL & LOCK":"Signed"} by ${e.name||e.username}`,{allowNonOwner:!0,allowOnLocked:!0})}catch(e){throw console.error("Error approving minute:",e),e}}async function Gn(n){try{const e=$e(),t=await(window.AppDB?window.AppDB.get(ae,n):window.AppFirestore.collection(ae).doc(n).get().then(i=>i.data()));if(!t)throw new Error("Minute not found");const a=t.createdBy===e.id,s=Ke(e);if(!a&&!s)throw new Error("Only owner or admin can delete minutes.");return window.AppDB?await window.AppDB.delete(ae,n):(await window.AppFirestore.collection(ae).doc(n).delete(),!0)}catch(e){throw console.error("Error deleting minute:",e),e}}const Xn={getMinutes:zn,addMinute:jn,updateMinute:Ge,approveMinute:Kn,deleteMinute:Gn,requestAccess:Wn,handleAccessRequest:Yn,updateActionItemStatus:Vn};typeof window<"u"&&(window.AppMinutes=Xn);const Bt={async renderPolicyEditor(){const n=await be.getPolicy();return`
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
                            ${Object.keys(n).map(e=>{const t=n[e];return`
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
        `},setupGlobalHandlers(){window.app_savePolicyChanges=async n=>{n.preventDefault();const e=new FormData(n.target),t=await be.getPolicy(),a={};Object.keys(t).forEach(s=>{a[s]={...t[s]};const i=l=>{const c=e.get(l);return c!==""&&c!==null?parseInt(c):void 0},o=i(`${s}_total`);o!==void 0&&(a[s].total=o);const r=i(`${s}_min`);r!==void 0?a[s].minDays=r:delete a[s].minDays;const d=i(`${s}_max`);d!==void 0?a[s].maxDays=d:delete a[s].maxDays});try{await be.updatePolicy(a);const s=n.target.querySelector("button"),i=s.innerHTML;s.innerHTML='<i class="fa-solid fa-check"></i> Saved!',s.style.background="#166534",setTimeout(()=>{s.innerHTML=i,s.style.background="",window.location.reload()},1e3)}catch(s){alert("Failed to update policy: "+s.message)}},window.app_approveLeaveWithWarning=async n=>{const e=await window.appPrompt("Reason for override:","",{title:"Leave Override",confirmText:"Approve With Reason",placeholder:"Enter reason"});if(e)try{await be.updateLeaveStatus(n,"Approved",Q.getUser().id,`[Overridden] ${e}`),window.location.reload()}catch(t){alert(t.message)}}}};Bt.setupGlobalHandlers();typeof window<"u"&&(window.AppAdminPolicies=Bt);const Jn={currentYear:new Date().getFullYear(),holidayCache:null,baseline2025:[{name:"Republic Day",date:"2025-01-26",type:"National"},{name:"Maha Shivaratri",date:"2025-02-26",type:"Regional"},{name:"Holi",date:"2025-03-14",type:"Regional"},{name:"Id-ul-Fitr",date:"2025-03-31",type:"Regional"},{name:"Good Friday",date:"2025-04-18",type:"Regional"},{name:"Independence Day",date:"2025-08-15",type:"National"},{name:"Dussehra",date:"2025-10-02",type:"Regional"},{name:"Gandhi Jayanti",date:"2025-10-02",type:"National"},{name:"Diwali",date:"2025-10-20",type:"Regional"},{name:"Christmas",date:"2025-12-25",type:"Regional"}],async render(){const n=await be.getPolicy(),e=Q.getUser(),t=await be.getFinancialYear(),a=window.app_hasPerm("policies","admin",e);let s=0;try{const d=new Date,l=d.getDay(),c=d.getDate()-l+(l===0?-6:1),f=new Date(d.setDate(c));f.setHours(0,0,0,0);const u=f.toISOString().split("T")[0];s=(await z.getAll("attendance")).filter(h=>h.user_id===e.id&&h.date>=u).filter(h=>h.checkIn?h.lateCountable===!0?!0:ia.normalizeType(h.type)==="Late":!1).length}catch(d){console.warn("Error calc lates",d)}const i=Object.keys(n).map(async d=>{const l=await be.getLeaveUsage(e.id,d,t);return{type:d,usage:l,total:n[d].total,icon:this.getIconForType(d),color:this.getColorForType(d)}}),o=await Promise.all(i),r=await this.renderHolidayTable(this.currentYear,a);return`
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
                        ${a?`
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

                ${a?await Bt.renderPolicyEditor():""}
            </div>
            `},async loadHolidaySettings(){if(this.holidayCache)return this.holidayCache;const n=await z.get("settings","holidays").catch(()=>null),e=n&&n.byYear?n:{id:"holidays",byYear:{}};return this.holidayCache=e,e},async saveHolidaySettings(n){const e={id:"holidays",byYear:n.byYear||{}};await z.put("settings",e),this.holidayCache=e},buildYearFromBaseline(n){return this.baseline2025.map(e=>{const t=String(e.date).slice(5);return{name:e.name,date:`${n}-${t}`,type:e.type||"Regional"}}).sort((e,t)=>new Date(e.date)-new Date(t.date))},async getHolidaysForYear(n,e=!0){const t=await this.loadHolidaySettings(),a=String(n);return(!Array.isArray(t.byYear[a])||t.byYear[a].length===0)&&(t.byYear[a]=this.buildYearFromBaseline(n),e&&await this.saveHolidaySettings(t)),[...t.byYear[a]].sort((s,i)=>new Date(s.date)-new Date(i.date))},async renderHolidayTable(n,e){const t=await this.getHolidaysForYear(n);return`
                <table class="compact-table">
                    <thead>
                        <tr>
                            <th>Occasion</th>
                            <th>Date</th>
                            ${e?'<th class="text-right">Actions</th>':""}
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderHolidayRows(n,t,e)}
                    </tbody>
                </table>
            `},renderHolidayRows(n,e,t){return e.length?e.map((a,s)=>{const o=new Date(a.date).toLocaleDateString("en-US",{month:"short",day:"numeric"});return`
                <tr>
                    <td>
                        <div class="policies-holiday-name">${a.name}</div>
                        ${a.type==="National"?'<span class="policies-holiday-chip">Compulsory</span>':""}
                    </td>
                    <td class="policies-holiday-date">${o}</td>
                    ${t?`
                        <td class="text-right">
                            <button class="icon-btn" title="Edit" onclick="window.AppPolicies.openHolidayEditor(${s})"><i class="fa-solid fa-pen"></i></button>
                            <button class="icon-btn" title="Delete" onclick="window.AppPolicies.deleteHoliday(${s})"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    `:""}
                </tr>
            `}).join(""):`<tr><td colspan="${t?3:2}" class="policies-empty-holiday">No holiday data available for ${n}</td></tr>`},async changeYear(n){this.currentYear+=n;const e=document.getElementById("policy-year-label"),t=document.getElementById("holidays-container"),a=Q.getUser(),s=window.app_hasPerm("policies","admin",a);e&&t&&(e.textContent=this.currentYear,t.innerHTML=await this.renderHolidayTable(this.currentYear,s))},async openHolidayEditor(n=null){const e=Q.getUser();if(!e||!window.app_hasPerm("policies","admin",e))return;const t=this.currentYear,a=await this.getHolidaysForYear(t),s=Number.isInteger(n)?a[n]:null,i=`holiday-editor-${Date.now()}`,o=`
                <div class="modal-overlay" id="${i}" style="display:flex;">
                    <div class="modal-content" style="max-width:460px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.65rem;">
                            <h3 style="margin:0;">${s?"Edit Holiday":"Add Holiday"} (${t})</h3>
                            <button type="button" class="app-system-dialog-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                        </div>
                        <form onsubmit="window.AppPolicies.saveHoliday(event, ${Number.isInteger(n)?n:"null"})">
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
            `;typeof window.app_showModal=="function"?window.app_showModal(o,i):(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",o)},async saveHoliday(n,e=null){n.preventDefault();const t=this.currentYear,a=(document.getElementById("holiday-name-input")?.value||"").trim(),s=(document.getElementById("holiday-date-input")?.value||"").trim(),i=(document.getElementById("holiday-type-input")?.value||"Regional").trim();if(!a||!s){alert("Please provide holiday name and date.");return}if(!s.startsWith(`${t}-`)){alert(`Date must be within ${t}.`);return}const o=await this.loadHolidaySettings(),r=String(t),d=Array.isArray(o.byYear[r])?[...o.byYear[r]]:this.buildYearFromBaseline(t),l={name:a,date:s,type:i==="National"?"National":"Regional"};Number.isInteger(e)&&d[e]?d[e]=l:d.push(l),o.byYear[r]=d.sort((c,f)=>new Date(c.date)-new Date(f.date)),await this.saveHolidaySettings(o),document.querySelector('.modal-overlay[id^="holiday-editor-"]')?.remove(),await this.changeYear(0)},async deleteHoliday(n){const e=Q.getUser();if(!e||!window.app_hasPerm("policies","admin",e)||!await window.appConfirm("Delete this holiday from current year?"))return;const a=this.currentYear,s=await this.loadHolidaySettings(),i=String(a),o=Array.isArray(s.byYear[i])?[...s.byYear[i]]:[];o[n]&&(o.splice(n,1),s.byYear[i]=o,await this.saveHolidaySettings(s),await this.changeYear(0))},getIconForType(n){return{"Annual Leave":"calendar-check","Casual Leave":"mug-hot","Medical Leave":"staff-snake","Maternity Leave":"baby-carriage","Paternity Leave":"baby","Study Leave":"graduation-cap","Compassionate Leave":"hand-holding-heart","Short Leave":"clock"}[n]||"file-circle-check"},getColorForType(n){return{"Annual Leave":"#0f766e","Casual Leave":"#ea580c","Medical Leave":"#dc2626","Maternity Leave":"#be185d","Paternity Leave":"#1d4ed8","Study Leave":"#6d28d9","Compassionate Leave":"#9333ea","Short Leave":"#475569"}[n]||"#64748b"},renderLeaveCard(n,e,t,a){const s=Math.min(100,e.usage/e.total*100);return`
            <div class="policies-leave-item">
                <div class="policies-leave-bg-icon" style="color:${a};"><i class="fa-solid fa-${t}"></i></div>
                <h4>${n}</h4>
                <div class="policies-leave-count">
                    <span>${e.total-e.usage}</span>
                    <small>/ ${e.total}</small>
                </div>
                <div class="policies-leave-bar"><div style="width:${s}%; background:${a};"></div></div>
                <div class="policies-leave-used">${e.usage} used</div>
            </div>
            `}};typeof window<"u"&&(window.AppPolicies=Jn);function F(n,e={}){const t=document.createElement(n);if(e.id&&(t.id=e.id),e.className&&(t.className=e.className),e.textContent&&(t.textContent=e.textContent),e.innerHTML&&(t.innerHTML=e.innerHTML),e.attributes)for(const[a,s]of Object.entries(e.attributes))t.setAttribute(a,s);if(e.children)for(const a of e.children)t.appendChild(a);return t}function me(n={}){const e=F("button",{className:n.className,textContent:n.textContent,innerHTML:n.innerHTML,attributes:{type:"button",...n.attributes}});return n.onClick&&e.addEventListener("click",n.onClick),e}const Ae=n=>String(n??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");function Zn(n,e){const t=document.createElement("div"),a=window.getComputedStyle(n);for(const l of a)t.style[l]=a[l];t.style.position="absolute",t.style.visibility="hidden",t.style.whiteSpace="pre-wrap",t.style.width=a.width,t.style.height="auto";const s=n.value.substring(0,e);t.textContent=s;const i=document.createElement("span");i.textContent=n.value.substring(e)||".",t.appendChild(i),document.body.appendChild(t);const{offsetLeft:o,offsetTop:r}=i,d=n.getBoundingClientRect();return document.body.removeChild(t),{top:d.top+r-n.scrollTop,left:d.left+o-n.scrollLeft}}function Qn(n,e,t){let a=document.getElementById("mention-dropdown");a?a.parentElement!==document.body&&document.body.appendChild(a):(a=F("div",{id:"mention-dropdown",className:"mention-dropdown"}),document.body.appendChild(a));let s=0,i=[],o=-1;const r=()=>{a.style.display="none",o=-1},d=()=>{if(i.length===0)return r();a.innerHTML="",i.forEach((f,u)=>{const p=F("div",{className:`mention-item ${u===s?"active":""}`,innerHTML:`
                    <img src="${f.avatar||"https://via.placeholder.com/32"}" class="mention-item-avatar">
                    <span class="mention-item-name">${f.name}</span>
                    <span class="mention-item-role">${f.role||"Staff"}</span>
                `});p.addEventListener("click",()=>l(f)),a.appendChild(p)});const c=Zn(n,o);a.style.top=`${c.top+24}px`,a.style.left=`${c.left}px`,a.style.display="block"},l=c=>{const f=n.value,u=f.substring(0,o),p=f.substring(n.selectionStart);n.value=`${u}@${c.name} ${p}`,n.focus(),r(),t&&t()};n.addEventListener("input",()=>{const c=n.value,f=n.selectionStart,u=c.lastIndexOf("@",f-1);if(u!==-1&&(u===0||/\s/.test(c[u-1]))){const p=c.substring(u+1,f).toLowerCase();if(!/\s/.test(p)){o=u,i=e.filter(m=>m.name.toLowerCase().includes(p)).slice(0,8),s=0,d();return}}r(),t&&t()}),n.addEventListener("keydown",c=>{a.style.display==="block"&&(c.key==="ArrowDown"?(c.preventDefault(),s=(s+1)%i.length,d()):c.key==="ArrowUp"?(c.preventDefault(),s=(s-1+i.length)%i.length,d()):c.key==="Enter"||c.key==="Tab"?(c.preventDefault(),l(i[s])):c.key==="Escape"&&r())}),document.addEventListener("click",c=>{!a.contains(c.target)&&c.target!==n&&r()})}function es(n,e,t,a,s){const i=F("h3",{textContent:"Plan Your Day"}),o=F("p",{className:"day-plan-subline",textContent:`${n}${e?` - Editing for ${t}`:""}`}),r=a?me({className:"day-plan-delete-btn",attributes:{title:"Delete plan"},innerHTML:'<i class="fa-solid fa-trash"></i>',onClick:()=>window.app_deleteDayPlan(n,s)}):null,d=me({className:"day-plan-close-btn",attributes:{title:"Close"},innerHTML:'<i class="fa-solid fa-xmark"></i>',onClick:c=>c.currentTarget.closest(".day-plan-modal-overlay").remove()}),l=F("div",{className:"day-plan-header-actions",children:[r,d].filter(Boolean)});return F("div",{className:"day-plan-header",children:[F("div",{className:"day-plan-headline",children:[i,o]}),l]})}function ts(n,e,t,a,s,i,o,r,d,l){const c=F("div",{className:"day-plan-scroll-area personal-plans-container",attributes:{"data-scope":"personal"}}),f=F("div",{className:"day-plan-scroll-area others-plans-container",attributes:{"data-scope":"annual"}});s.forEach((w,b)=>{const v=je({plan:w,idx:b,allUsers:i,targetId:e,defaultScope:o,selectableCollaborators:r,isAdmin:d,currentUserId:l.id,isReference:w.isReference});(w.planScope||w._planScope||o)==="annual"||w.isReference?f.appendChild(v):c.appendChild(v)});const u=F("div",{className:"day-plan-columns",children:[F("div",{className:"day-plan-column",children:[F("div",{className:"day-plan-column-head",children:[F("h4",{className:"day-plan-column-title",textContent:"Self Plan"}),me({className:"btn-premium-add",innerHTML:'<i class="fa-solid fa-plus-circle"></i> <span>Add Personal Plan (@)</span>',onClick:()=>ze({date:n,targetId:e,scope:"personal",allUsers:i,selectableCollaborators:r,isAdmin:d,container:c})})]}),c]}),F("div",{className:"day-plan-column",children:[F("div",{className:"day-plan-column-head",children:[F("h4",{className:"day-plan-column-title",textContent:"Others' & Annual Plans"}),me({className:"btn-premium-add",innerHTML:'<i class="fa-solid fa-plus-circle"></i> <span>Add Annual Plan (@)</span>',onClick:()=>ze({date:n,targetId:e,scope:"annual",allUsers:i,selectableCollaborators:r,isAdmin:d,container:f})})]}),f]})]}),p=me({className:"day-plan-discard-btn",textContent:"Discard",onClick:w=>w.currentTarget.closest(".day-plan-modal-overlay").remove()}),m=me({className:"day-plan-save-btn",innerHTML:'<i class="fa-solid fa-check-circle"></i> <span>Save Plan</span>',attributes:{type:"submit"}}),h=F("div",{className:"day-plan-footer",children:[F("div",{className:"day-plan-actions",children:[p,m]})]}),y=F("form",{className:"day-plan-form",attributes:{"data-had-personal":t?"1":"0","data-had-annual":a?"1":"0"},children:[u,h]});return y.addEventListener("submit",w=>window.app_saveDayPlan(w,n,e)),y}function ze(n){const{date:e,targetId:t,scope:a,allUsers:s,selectableCollaborators:i,isAdmin:o,container:r,existingBlock:d=null}=n,l=Q.getUser(),c=d?window.app_extractBlockData(d):{task:"",subPlans:[],tags:[],status:null,assignedTo:t,startDate:e,endDate:e,planScope:a},f=F("div",{className:"plan-editor-overlay"}),u=F("div",{className:"plan-editor-modal"}),p=F("div",{className:"plan-editor-head",innerHTML:`<h4>${d?"Edit":"Add"} ${a==="annual"?"Annual":"Personal"} Plan <small style="font-weight:400; opacity:0.7; font-size:0.8em; margin-left:5px;">(Use @ to tag)</small></h4>`}),m=F("div",{className:"plan-editor-body"}),h=F("textarea",{className:"plan-editor-textarea",textContent:c.task,attributes:{placeholder:"What is the objective or task for today? Use @ to tag colleagues.",required:!0}}),y=F("div",{className:"plan-editor-tags-container",attributes:{style:"display: none;"}}),w=()=>{const L=h.value,I=[];if(s.forEach(O=>{const E=`@${O.name}`;L.includes(E)&&!I.find(D=>D.id===O.id)&&I.push(O)}),I.length>0){y.style.display="block",y.innerHTML='<label class="plan-editor-tags-label">Tagged Collaborators:</label>';const O=F("div",{className:"plan-editor-tags-wrapper"});I.forEach(E=>{const D=F("span",{className:"day-plan-tag-pill",textContent:`@${E.name}`});O.appendChild(D)}),y.appendChild(O)}else y.style.display="none",y.innerHTML=""},b=F("div",{className:"plan-editor-grid"}),v=F("div",{className:"plan-editor-field"});v.innerHTML="<label>Status</label>";const k=F("select",{className:"plan-editor-select"});k.innerHTML=`
        <option value="" ${c.status?"":"selected"}>Auto-Track</option>
        <option value="completed" ${c.status==="completed"?"selected":""}>Completed</option>
        <option value="in-process" ${c.status==="in-process"?"selected":""}>In Progress</option>
        <option value="not-completed" ${c.status==="not-completed"?"selected":""}>Not Completing</option>
    `,v.appendChild(k);let g=null;if(o){const L=F("div",{className:"plan-editor-field"});L.innerHTML="<label>Assign To</label>",g=F("select",{className:"plan-editor-select"}),s.forEach(I=>{const O=F("option",{textContent:I.name,attributes:{value:I.id,selected:I.id===c.assignedTo}});g.appendChild(O)}),L.appendChild(g),b.appendChild(L)}m.appendChild(h),m.appendChild(y),m.appendChild(b);const A=F("div",{className:"plan-editor-footer"}),S=me({className:"day-plan-discard-btn",textContent:"Cancel",onClick:()=>f.remove()}),_=me({className:"day-plan-save-btn",textContent:d?"Update":"Add to List",onClick:()=>{const L=h.value.trim();if(!L)return alert("Please enter a task description");const I=[];s.forEach(D=>{L.includes(`@${D.name}`)&&!I.find(M=>M.id===D.id)&&I.push({id:D.id,name:D.name,status:"pending"})});const E={plan:{...c,task:L,status:k.value,assignedTo:g?g.value:c.assignedTo||t,tags:I.length>0?I:c.tags||[]},allUsers:s,targetId:t,selectableCollaborators:i,isAdmin:o,currentUserId:l.id};if(d){const D=je({...E,idx:Number.parseInt(d.getAttribute("data-index"))});d.replaceWith(D)}else{const D=je({...E,idx:r.querySelectorAll(".plan-block").length});r.appendChild(D)}f.remove()}});A.appendChild(S),A.appendChild(_),u.appendChild(p),u.appendChild(m),u.appendChild(A),f.appendChild(u),document.getElementById("modal-container").appendChild(f),h.focus(),Qn(h,s,w),w()}function je(n){const{plan:e={},idx:t=0,allUsers:a=[],targetId:s,defaultScope:i="personal",selectableCollaborators:o=[],isAdmin:r=!1,currentUserId:d="",isReference:l=!1}=n||{},c=String(e.task||""),f=e.assignedTo||s||d,u=e.startDate||"",p=e.endDate||"",m=String(e.planScope||e._planScope||i)==="annual"?"annual":"personal",h=l?e.userName?`${e.userName}'s Plan`:"Others Plan":m==="annual"?"Annual Plan":"Personal Plan",y=c.trim()?c.trim().length>120?`${c.trim().slice(0,120)}...`:c.trim():"New task",w=F("div",{className:(l?"plan-block-ref":"plan-block")+(l?" is-reference-only":""),attributes:{"data-index":t}}),b=F("div",{className:"dp-hidden-data",attributes:{style:"display:none;"}});b.innerHTML=`
        <textarea class="plan-task">${Ae(c)}</textarea>
        <select class="plan-status"><option value="${Ae(e.status||"")}" selected></option></select>
        <select class="plan-scope"><option value="${Ae(m)}" selected></option></select>
        <select class="plan-assignee"><option value="${Ae(f)}" selected></option></select>
        <input class="plan-start-date" value="${Ae(u)}">
        <input class="plan-end-date" value="${Ae(p)}">
    `,e.subPlans&&e.subPlans.forEach(A=>{const S=F("input",{className:"sub-plan-input",attributes:{value:Ae(A)}});b.appendChild(S)}),e.tags&&e.tags.forEach(A=>{const S=F("div",{className:"tag-chip",attributes:{"data-id":A.id,"data-name":A.name,"data-status":A.status||"pending"}});b.appendChild(S)}),w.appendChild(b);const v=F("div",{className:"plan-block-header"}),k=F("div",{className:"plan-block-title-group"});k.appendChild(F("span",{className:"day-plan-index-badge",textContent:t+1})),k.appendChild(F("span",{className:"plan-block-summary",textContent:y}));const g=F("div",{className:"plan-block-actions"});if(g.appendChild(F("span",{className:"day-plan-scope-pill",textContent:h})),l||(g.appendChild(me({className:"day-plan-edit-btn",attributes:{title:"Edit plan"},innerHTML:'<i class="fa-solid fa-pen-to-square"></i>',onClick:()=>ze({date:u,targetId:s,scope:m,allUsers:a,selectableCollaborators:o,isAdmin:r,container:w.parentElement,existingBlock:w})})),t>0&&g.appendChild(me({className:"day-plan-remove-btn",attributes:{title:"Remove task"},innerHTML:'<i class="fa-solid fa-trash-can"></i>',onClick:()=>w.remove()}))),v.appendChild(k),v.appendChild(g),w.appendChild(v),e.tags&&e.tags.length>0){const A=F("div",{className:"plan-block-body"});e.tags.forEach(S=>{const _=F("span",{className:"day-plan-tag-pill",textContent:`@${S.name}`});A.appendChild(_)}),w.appendChild(A)}return w}function _a(n){if(!n)return null;const e=n.querySelector(".plan-task")?.value||"",t=n.querySelector(".plan-status")?.value||"",a=n.querySelector(".plan-scope")?.value||"personal",s=n.querySelector(".plan-assignee")?.value||"",i=n.querySelector(".plan-start-date")?.value||"",o=n.querySelector(".plan-end-date")?.value||"",r=Array.from(n.querySelectorAll(".sub-plan-input")).map(l=>l.value),d=Array.from(n.querySelectorAll(".tag-chip")).map(l=>({id:l.dataset.id,name:l.dataset.name,status:l.dataset.status}));return{task:e,status:t,planScope:a,assignedTo:s,startDate:i,endDate:o,subPlans:r,tags:d}}async function xa(n,e=null,t=null){const a=Q.getUser(),s=String(e??"").trim(),i=!s||s==="undefined"||s==="null"?a.id:s,o=await z.getAll("users"),r=a.role==="Administrator"||a.isAdmin,d=i!==a.id,l=t==="annual"?"annual":"personal";window.app_currentDayPlanTargetId=i;const[c,f,u]=await Promise.all([Be.getWorkPlan(i,n,{planScope:"personal"}),Be.getWorkPlan(i,n,{planScope:"annual"}),z.queryMany("work_plans",[{field:"date",operator:"==",value:n}])]),p=!!(c||f),m=o.find(I=>I.id===i),h=m?m.name:"Staff",y=o.filter(I=>I.id!==i),w=(I,O,E=null)=>I?Array.isArray(I.plans)&&I.plans.length>0?I.plans.map(D=>({...D,planScope:O,userName:E||I.userName,isReference:!!E})):[]:[],b=(u||[]).filter(I=>I.id!==Be.getWorkPlanId(n,i,"personal")&&I.id!==Be.getWorkPlanId(n,i,"annual")),v=[];b.forEach(I=>{v.push(...w(I,I.planScope,I.userName))});const k=[...w(c,"personal"),...w(f,"annual"),...v];k.length===0&&k.push({task:"",subPlans:[],tags:[],status:null,assignedTo:i,startDate:n,endDate:n,planScope:l});const g=F("div",{id:"day-plan-modal",className:"day-plan-modal-overlay"}),A=F("div",{className:"day-plan-content"});A.appendChild(es(n,d,h,p,i)),A.appendChild(ts(n,i,c,f,k,o,l,y,r,a)),g.appendChild(A);const S=document.getElementById("modal-container");if(!S)return;const _=document.getElementById("day-plan-modal");_&&_.remove(),S.appendChild(g);const L=document.getElementById("day-plan-modal");if(L){const O=Array.from(document.querySelectorAll(".modal-overlay, .modal")).filter(E=>E!==L).reduce((E,D)=>{const M=Number.parseInt(window.getComputedStyle(D).zIndex,10);return Number.isFinite(M)?Math.max(E,M):E},1e3);L.style.zIndex=String(O+2)}}async function Ta(n=null){const e=document.getElementById("day-plan-modal");if(!e)return;const t=n||"personal",a=t==="annual"?e.querySelector(".others-plans-container"):e.querySelector(".personal-plans-container"),s=e.querySelector(".day-plan-headline p")?.textContent?.match(/\d{4}-\d{2}-\d{2}/),i=s?s[0]:new Date().toISOString().split("T")[0],o=await z.getAll("users"),r=Q.getUser(),d=window.app_currentDayPlanTargetId||r.id,l=r.role==="Administrator"||r.isAdmin,c=o.filter(f=>f.id!==d);ze({date:i,targetId:d,scope:t,allUsers:o,selectableCollaborators:c,isAdmin:l,container:a})}const as={openDayPlan:xa,dayPlanRenderBlockV3:je,addPlanBlockUI:Ta,openPlanEditor:ze,app_extractBlockData:_a};window.AppDayPlan=as;window.app_openDayPlan=xa;window.app_dayPlanRenderBlockV3=je;window.app_addPlanBlockUI=Ta;window.app_extractBlockData=_a;const Kt={isWidgetMode:!1,syncInterval:null,init(){console.log("Widget Module Initialized"),new URLSearchParams(window.location.search).get("mode")==="widget"&&(this.isWidgetMode=!0),this.isWidgetMode&&this.enableWidgetMode()},toggle(){if(this.isWidgetMode)this.isWidgetMode=!1,window.opener||window.name==="CRWIWidget"?window.close():this.disableWidgetMode();else{const t=window.screen.width-320-20;window.open(window.location.origin+window.location.pathname+"?mode=widget#dashboard","CRWIWidget",`width=320,height=420,left=${t},top=40,menubar=no,toolbar=no,location=no,status=no,resizable=yes`)}},enableWidgetMode(){document.body.classList.add("widget-mode"),this.renderWidgetView(),this.startSync(),window.resizeTo&&window.resizeTo(320,420)},disableWidgetMode(){document.body.classList.remove("widget-mode");const n=document.getElementById("widget-view");n&&n.remove(),this.stopSync()},startSync(){this.syncInterval&&clearInterval(this.syncInterval),this.syncInterval=setInterval(()=>this.sync(),500)},stopSync(){this.syncInterval&&clearInterval(this.syncInterval)},sync(){if(!this.isWidgetMode)return;const n=document.getElementById("timer-display"),e=document.getElementById("timer-label"),t=document.querySelector(".check-in-widget .status-dot")||document.querySelector('.check-in-widget [style*="background: #10b981"]')||document.querySelector('.check-in-widget [style*="background: #94a3b8"]'),a=document.getElementById("attendance-btn"),s=document.getElementById("location-text"),i=document.getElementById("countdown-container"),o=document.getElementById("countdown-label"),r=document.getElementById("countdown-value"),d=document.getElementById("countdown-progress"),l=document.getElementById("overtime-container"),c=document.getElementById("overtime-value"),f=document.getElementById("widget-view");if(!f)return;const u=f.querySelector("#timer-display"),p=f.querySelector("#timer-label"),m=f.querySelector(".status-dot-indicator"),h=f.querySelector("#attendance-btn"),y=f.querySelector("#location-text"),w=f.querySelector("#countdown-container"),b=f.querySelector("#countdown-label"),v=f.querySelector("#countdown-value"),k=f.querySelector("#countdown-progress"),g=f.querySelector("#overtime-container"),A=f.querySelector("#overtime-value");n&&u&&(u.innerHTML=n.innerHTML,u.style.color=n.style.color),e&&p&&(p.innerHTML=e.innerHTML),t&&m&&(m.style.background=t.style.background||(t.classList.contains("online")?"#10b981":"#94a3b8")),i&&w&&(w.style.display=i.style.display,o&&b&&(b.innerHTML=o.innerHTML),r&&v&&(v.innerHTML=r.innerHTML),d&&k&&(k.style.width=d.style.width)),l&&g&&(g.style.display=l.style.display,c&&A&&(A.innerHTML=c.innerHTML)),a&&h&&(h.innerHTML=a.innerHTML,h.className=a.className,h.disabled=a.disabled),s&&y&&(y.innerHTML=s.innerHTML)},handleWidgetAction(){if(window.opener&&!window.opener.closed)try{if(window.opener.focus(),window.opener.location.hash!=="#dashboard"&&(window.opener.location.hash="#dashboard"),window.opener.app_handleAttendance){window.opener.app_handleAttendance();return}}catch(t){console.warn("Could not communicate with main window:",t)}console.log("Opener lost or closed. Reopening main app...");const n=window.location.origin+window.location.pathname+"#dashboard",e=window.open(n,"CRWIMainApp");if(e){e.focus();const t=document.getElementById("attendance-btn");if(t){const a=t.innerHTML;t.innerHTML='<i class="fa-solid fa-arrow-up-right-from-square"></i> Opening App...',setTimeout(()=>{t.innerHTML=a},3e3)}}else alert("Please allow popups or open the main application window manually.")},renderWidgetView(){let n=document.getElementById("widget-view");n||(n=document.createElement("div"),n.id="widget-view",document.body.appendChild(n));const e=window.AppAuth&&window.AppAuth.getUser()||{name:"User",role:"Staff",avatar:"https://via.placeholder.com/48"};n.innerHTML=`
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

                <button class="btn btn-primary" id="attendance-btn" onclick="window.Widget.handleWidgetAction()" style="width: 100%; padding: 0.75rem; font-size: 0.9rem; border-radius: 10px; margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s ease;">
                    Action <i class="fa-solid fa-fingerprint"></i>
                </button>

                <div class="location-text" id="location-text" style="font-size: 0.65rem; color: #94a3b8; text-align: center; margin-top: 0.5rem;">
                    <i class="fa-solid fa-location-dot"></i><span>Waiting for location...</span>
                </div>
            </div>
        `}};typeof window<"u"&&(window.Widget=Kt,Kt.init());var St={buildId:"0d6bf8b-1774248555790",commitSha:"0d6bf8bccc1e1b66d4c167bf4dc55d7a0412623b",builtAt:"2026-03-23T06:49:15.789Z"};let kt=null,ue=[],ve=null,Te=null,Oe=0,We=!1,Ue=null,At=!1,Ia=0,It=null,ot=null,rt=null,Lt=!1,Re=null,Le=null;const dt=Object.freeze(typeof St=="object"&&St?St:{buildId:"local",commitSha:"",builtAt:""}),ns="/version.json",ss=6e4,Et="release_signal",Gt="app_meta",La="app_last_seen_release_id",G={active:!1,releaseId:"",buildId:"",commitSha:"",deployedAt:"",notes:"",source:"",popupDismissed:!1},Ea=3e4;window.app_annualYear=new Date().getFullYear();const is=()=>{try{return localStorage.getItem(La)||""}catch{return""}},Ma=n=>{try{localStorage.setItem(La,String(n||""))}catch{}},Ca=(n={},e="version")=>{const t=String(n.buildId||n.releaseId||n.commitSha||"").trim();return t?{releaseId:t,buildId:t,commitSha:String(n.commitSha||"").trim(),deployedAt:String(n.deployedAt||n.builtAt||"").trim(),notes:String(n.notes||"").trim(),source:String(e||n.source||"version").trim()}:null},Xe=()=>({active:!!G.active,releaseId:G.releaseId||"",buildId:G.buildId||"",commitSha:G.commitSha||"",deployedAt:G.deployedAt||"",notes:G.notes||"",source:G.source||"",popupDismissed:!!G.popupDismissed,currentBuildId:dt.buildId||"",currentCommitSha:dt.commitSha||"",currentBuiltAt:dt.builtAt||""});window.app_getReleaseUpdateState=()=>Xe();const Ye=()=>{const n=Xe(),e=document.querySelector(".dashboard-refresh-link");e&&(n.active?(e.classList.add("is-update-pending"),e.setAttribute("title","Update available. Click to refresh into the new version."),e.textContent="System update available"):(e.classList.remove("is-update-pending"),e.setAttribute("title","Check for System Update (Ctrl+Shift+R)"),e.textContent="Check for System Update"))};window.app_applyUpdateCtaState=Ye;const Ot=()=>{Ye(),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:update-state",{detail:Xe()}))},Ut=(n=!1)=>{const e=G.releaseId;G.active=!1,G.releaseId="",G.buildId="",G.commitSha="",G.deployedAt="",G.notes="",G.source="",G.popupDismissed=!1,n&&e&&Ma(e),Ot()};window.app_dismissReleaseUpdatePrompt=()=>{G.active&&(G.releaseId&&Ma(G.releaseId),G.popupDismissed=!0,document.getElementById("system-update-modal")?.remove(),Ot())};const Pa=(n,e={})=>{const t=Ca(n,n?.source||"version");if(!t)return!1;if(t.buildId===dt.buildId)return Ut(!1),!1;const a=e.forcePopup===!0,s=is(),i=G.active&&G.releaseId===t.releaseId;return G.active=!0,G.releaseId=t.releaseId,G.buildId=t.buildId,G.commitSha=t.commitSha,G.deployedAt=t.deployedAt,G.notes=t.notes,G.source=t.source,G.popupDismissed=t.releaseId===s,i||window.app_showSyncToast("New version available."),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:update-available",{detail:Xe()})),Ot(),(a||!G.popupDismissed)&&(G.popupDismissed=!1,window.app_showSystemUpdatePopup()),!0},os=async({manual:n=!1}={})=>{try{const e=await fetch(`${ns}?t=${Date.now()}`,{cache:"no-store",headers:{"cache-control":"no-cache"}});if(!e.ok)throw new Error(`Version check failed with ${e.status}`);const t=await e.json();return Ca(t,"version")}catch(e){return console.warn("Unable to fetch deployed version manifest:",e),n&&window.app_showSyncToast("Could not check for updates right now."),null}},Ve=async(n={})=>{if(Le)return Le;Le=(async()=>{const e=await os({manual:n.manual===!0});return e?Pa(e,{forcePopup:n.forcePopup===!0}):!1})();try{return await Le}finally{Le=null}},Na=()=>{Re||(Re=setInterval(()=>{document.visibilityState==="visible"&&window.AppAuth?.getUser()&&Ve()},ss),Ve())},rs=()=>{Re&&(clearInterval(Re),Re=null)},ds=()=>{document.visibilityState==="visible"&&window.AppAuth?.getUser()&&Ve()},Xt=()=>{window.AppAuth?.getUser()&&Ve()},Jt=n=>{!n||n.id!==Et||n.active!==!1&&Pa({...n,source:"release-signal"},{forcePopup:!0})},Ba=()=>{if(!Lt){if(Lt=!0,window.AppDB&&typeof window.AppDB.listen=="function"){ot=window.AppDB.listen(Gt,n=>{const e=(n||[]).find(t=>t.id===Et);e&&Jt(e)});return}rt=setInterval(async()=>{try{const n=await window.AppDB.get(Gt,Et);n&&Jt(n)}catch{}},3e4)}},ls=()=>{typeof ot=="function"&&(ot(),ot=null),rt&&(clearInterval(rt),rt=null),Lt=!1};window.app_checkForSystemUpdate=async()=>{if(G.active)return window.app_showSystemUpdatePopup(),!0;const n=await Ve({manual:!0,forcePopup:!0});return n||window.app_showSyncToast("You are already using the latest version."),n};window.app_isAdminUser=(n=window.AppAuth?.getUser())=>n?n.isAdmin===!0:!1;window.app_canSeeAdminPanel=(n=window.AppAuth?.getUser())=>n?window.app_isAdminUser(n)?!0:n.permissions?Object.values(n.permissions).some(e=>e==="admin"):!1:!1;window.app_hasPerm=(n,e="view",t=window.AppAuth?.getUser())=>{if(!t)return!1;if(t.isAdmin===!0)return!0;if(!t.permissions||!t.permissions[n])return!1;const a=t.permissions[n];return e==="view"?a==="view"||a==="admin":e==="admin"?a==="admin":!1};window.app_canManageAttendanceSheet=(n=window.AppAuth?.getUser())=>n?window.app_hasPerm("attendance","admin",n)||!!n.canManageAttendanceSheet:!1;window.app_getReadTelemetry=()=>!window.AppDB||!window.AppDB.getReadTelemetry?{}:window.AppDB.getReadTelemetry();window.app_resetReadTelemetry=()=>{!window.AppDB||!window.AppDB.clearReadTelemetry||window.AppDB.clearReadTelemetry()};window.app_getMyMessages=async()=>{const n=window.AppAuth.getUser();if(!n)return[];try{const[e,t]=await Promise.all([window.AppDB.query("staff_messages","toId","==",n.id),window.AppDB.query("staff_messages","fromId","==",n.id)]),a=new Map;return(e||[]).forEach(s=>a.set(s.id,s)),(t||[]).forEach(s=>a.set(s.id,s)),Array.from(a.values())}catch(e){return console.warn("Message fetch failed, falling back to getAll",e),window.AppDB.getAll("staff_messages")}};const Z=document.getElementById("page-content"),tt=document.querySelector(".sidebar"),at=document.querySelector(".mobile-header"),nt=document.querySelector(".mobile-nav");window.app_initTheme=()=>{const n=localStorage.getItem("theme")||"light";document.documentElement.setAttribute("data-theme",n),Oa(n)};window.app_toggleTheme=()=>{const e=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",e),localStorage.setItem("theme",e),Oa(e)};function Oa(n){document.querySelectorAll(".theme-toggle i").forEach(e=>{n==="dark"?(e.classList.remove("fa-moon"),e.classList.add("fa-sun")):(e.classList.remove("fa-sun"),e.classList.add("fa-moon"))})}function cs(){if(!("serviceWorker"in navigator))return;const n=async()=>{try{It=await navigator.serviceWorker.register("/sw.js"),console.log("ServiceWorker registered")}catch(e){console.log("ServiceWorker registration failed: ",e)}};if(document.readyState==="complete"){n();return}window.addEventListener("load",()=>{n()},{once:!0})}const Zt=(n=new Date)=>`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;window.app_showAttendanceNotice=n=>{if(!n)return;const e=document.getElementById("page-content");if(!e)return;const t=document.getElementById("attendance-policy-notice");t&&t.remove();const a=document.createElement("div");a.id="attendance-policy-notice",a.style.background="#fff7ed",a.style.border="1px solid #fdba74",a.style.color="#9a3412",a.style.padding="0.85rem 1rem",a.style.borderRadius="10px",a.style.marginBottom="0.9rem",a.style.fontSize="0.9rem",a.style.fontWeight="600",a.innerHTML=`<i class="fa-solid fa-circle-info" style="margin-right:0.45rem;"></i>${n}`,e.prepend(a),setTimeout(()=>{const s=document.getElementById("attendance-policy-notice");s&&s.remove()},1e4)};window.app_promptMissedCheckoutReason=(n={})=>{const{logId:e,date:t}=n||{};if(!e||document.getElementById("missed-checkout-reason-modal"))return;const a=t?new Date(`${t}T00:00:00`).toLocaleDateString():"previous day",s=`
        <div class="modal-overlay" id="missed-checkout-reason-modal" style="display:flex;">
            <div class="modal-content" style="max-width:560px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:0.75rem;">
                    <div>
                        <h3 style="margin:0;">Missed Checkout</h3>
                        <p style="margin:0.35rem 0 0 0; font-size:0.85rem; color:#6b7280;">
                            Your session on ${ee(a)} was auto-checked out and counted as a half day.
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
    `;(document.body||document.getElementById("modal-container")).insertAdjacentHTML("beforeend",s);const i=document.getElementById("missed-checkout-reason-modal");i?.addEventListener("click",o=>{o.target===i&&i.remove()})};window.app_submitMissedCheckoutReason=async(n,e)=>{n.preventDefault();const t=n.target,a=String(new FormData(t).get("reason")||"").trim();if(!a){alert("Please enter a reason.");return}try{const s=window.AppAuth.getUser();if(!s)throw new Error("User not authenticated");const i=await window.AppDB.get("attendance",e);if(!i)throw new Error("Attendance record not found.");const o=new Date().toISOString(),r={...i,missedCheckoutReason:a,missedCheckoutReasonSubmittedAt:o,missedCheckoutReasonStatus:"pending"};await window.AppDB.put("attendance",r);const d=await window.AppDB.get("users",s.id);d&&(d.notifications||(d.notifications=[]),d.notifications.unshift({id:`mcr_sub_${Date.now()}`,type:"missed-checkout-reason-submitted",title:"Missed checkout reason submitted",message:`Reason sent for ${i.date}. Awaiting admin verification.`,status:"submitted",date:o,read:!0}),await window.AppDB.put("users",d),window.AppAuth?.getUser&&Object.assign(window.AppAuth.getUser(),{notifications:d.notifications}));const l=(await window.AppDB.getAll("users")).filter(c=>c.isAdmin||c.role==="Administrator");await Promise.all(l.map(async c=>{c.notifications||(c.notifications=[]),c.notifications.unshift({id:`mcr_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"missed-checkout-reason",title:"Missed checkout reason submitted",message:`${s.name} submitted a reason for missed checkout on ${i.date}.`,description:a,staffId:s.id,staffName:s.name,missedCheckoutDate:i.date,logId:String(i.id||""),taggedById:s.id,taggedByName:s.name,taggedAt:o,status:"pending",date:o,read:!1}),await window.AppDB.put("users",c)})),document.getElementById("missed-checkout-reason-modal")?.remove(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell(),window.app_showSyncToast("Reason submitted for admin verification.")}catch(s){console.error("Missed checkout reason submit failed:",s),alert("Failed to submit reason: "+s.message)}};window.app_showSyncToast=(n="Status updated from another device.")=>{const e="app-sync-toast",t=document.getElementById(e);t&&t.remove();const a=document.createElement("div");a.id=e,a.style.position="fixed",a.style.top="14px",a.style.right="14px",a.style.zIndex="10020",a.style.background="#0f172a",a.style.color="#f8fafc",a.style.padding="0.7rem 0.9rem",a.style.borderRadius="10px",a.style.fontSize="0.82rem",a.style.fontWeight="600",a.style.boxShadow="0 8px 25px rgba(15, 23, 42, 0.3)",a.textContent=n,document.body.appendChild(a),setTimeout(()=>{const s=document.getElementById(e);s&&s.remove()},2800)};const Qt=()=>!We&&Date.now()>Ia,Mt=()=>{Ia=Date.now()+3500},ps=n=>{const e=n.detail;if(!e)return;window.app_refreshNotificationBell&&window.app_refreshNotificationBell().catch(()=>{});const t=e.status||"out",a=Ue!==null&&t!==Ue,s=Ue===null&&t==="in";if(Ue=t,!(a||s)||At)return;const i=!window.location.hash||window.location.hash==="#dashboard",o=document.getElementById("checkout-modal"),r=!!(o&&o.style.display==="flex");if(t==="out"&&r&&(o.style.display="none"),!i){Qt()&&window.app_showSyncToast("Status updated from another device.");return}At=!0,(async()=>{try{const d=document.getElementById("page-content");d&&(d.innerHTML=await U.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),Qt()&&window.app_showSyncToast("Status updated from another device.")}catch(d){console.warn("Realtime dashboard sync failed:",d)}finally{At=!1}})()};function Ct(n){const e=document.querySelector(".sidebar"),t=document.getElementById("sidebar-overlay");e&&t&&(n?(e.classList.add("open"),t.classList.add("active")):(e.classList.remove("open"),t.classList.remove("active")))}function us(){if(window.location.search){const n=window.location.protocol+"//"+window.location.host+window.location.pathname+window.location.hash;window.history.replaceState({path:n},"",n),console.log("Address bar cleaned of query parameters.")}}window.app_toggleSidebar=(n=null)=>{const e=document.querySelector(".sidebar"),t=document.querySelector("#desktop-sidebar-toggle i");if(!e)return;(n!==null?n:!e.classList.contains("collapsed"))?(e.classList.add("collapsed"),t&&(t.classList.remove("fa-angles-left"),t.classList.add("fa-angles-right"))):(e.classList.remove("collapsed"),t&&(t.classList.remove("fa-angles-right"),t.classList.add("fa-angles-left")))};window.app_showModal=(n,e)=>{const t=document.getElementById("modal-container");if(!t)return;const a=document.getElementById(e);a&&a.remove(),t.insertAdjacentHTML("beforeend",n);const s=document.getElementById(e);if(s&&(s.classList.contains("modal-overlay")||s.classList.contains("modal"))){const o=Array.from(document.querySelectorAll(".modal-overlay, .modal")).filter(r=>r!==s).reduce((r,d)=>{const l=Number.parseInt(window.getComputedStyle(d).zIndex,10);return Number.isFinite(l)?Math.max(r,l):r},1e3);s.style.zIndex=String(o+2)}};const ee=n=>String(n??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),ms=n=>ee(n).replace(/\n/g,"<br>"),Pt=n=>String(n?.status||"pending").toLowerCase(),He=n=>Pt(n)==="pending",Dt=n=>n?.type==="minute-access-request"?"Minutes":String(n?.type||"").includes("missed-checkout")?"Attendance":n?.type==="task"?"Task":n?.type==="tag"||n?.type==="mention"?"Tag":n?.type==="reminder"?"Reminder":"Notification",ea=n=>String(n?.description||n?.message||n?.title||"").trim(),fs=n=>{const e=n?.respondedAt||n?.taggedAt||n?.date,t=new Date(e).getTime();if(!t)return"Unknown time";const a=Math.max(0,Math.floor((Date.now()-t)/6e4)),s=a<1?"just now":a<60?`${a} mins ago`:a<1440?`${Math.floor(a/60)} hrs ago`:`${Math.floor(a/1440)} days ago`;return`${new Date(t).toLocaleString()} (${s})`};window.app_refreshNotificationBell=async()=>{const n=document.querySelectorAll(".top-notification-btn");if(!n.length)return;const e=window.AppAuth.getUser(),a=(Array.isArray(e?.notifications)?e.notifications:[]).filter(He).length;n.forEach(s=>{const i=s.querySelector(".top-notification-badge");if(!e){s.classList.remove("has-pending"),i&&(i.style.display="none");return}s.classList.toggle("has-pending",a>0),s.setAttribute("title",a>0?`${a} pending notification${a>1?"s":""}`:"Notification history"),i&&(a>0?(i.textContent=a>99?"99+":String(a),i.style.display=""):i.style.display="none")})};window.app_closeNotificationHistory=()=>{const n=document.getElementById("notification-history-modal"),e=document.getElementById("notif-drawer-backdrop");n&&n.classList.remove("notif-drawer-open"),e&&e.classList.remove("notif-drawer-backdrop-visible"),setTimeout(()=>document.getElementById("notif-drawer-root")?.remove(),320)};window.app_respondNotificationFromHistory=async(n,e,t)=>{const a=window.AppAuth.getUser();if(!a)return;const s=t==="approve"?"approve":"reject",i=await window.AppDB.get("users",a.id);if(!i||!Array.isArray(i.notifications)){alert("Notification not found.");return}let o=null,r=-1;if(Number.isInteger(n)&&n>=0&&i.notifications[n]&&(o=i.notifications[n],r=n),!o&&e&&(r=i.notifications.findIndex(d=>String(d.id)===String(e)),r>=0&&(o=i.notifications[r])),!o){alert("This notification is no longer available.");return}if(!He(o)){alert("This notification has already been responded."),await window.app_refreshNotificationBell();return}window.app_closeNotificationHistory();try{if(o.type==="minute-access-request"&&window.app_hasPerm("minutes","admin",a)){await window.app_reviewMinuteAccessFromNotification(r,o.id,s==="approve"?"approved":"rejected");return}if(o.type==="missed-checkout-reason"&&(a.isAdmin||a.role==="Administrator")){await window.app_reviewMissedCheckoutReasonFromNotification(r,o.id,s==="approve"?"approved":"rejected");return}const d=Number(o.taskIndex);if(o.planId&&Number.isInteger(d)&&d>=0){await window.app_handleTagResponse(o.planId,d,s==="approve"?"accepted":"rejected",r);return}if(o.id){await window.app_handleTagDecision(o.id,s==="approve"?"accepted":"rejected");return}alert("This notification cannot be approved or rejected from history.")}catch(d){console.error("Notification response error:",d),alert("Failed to process notification: "+d.message)}};window.app_openNotificationHistory=async()=>{const n=window.AppAuth.getUser();if(!n)return;const e=await window.AppDB.get("users",n.id).catch(()=>n),t=Array.isArray(e?.notifications)?e.notifications:[],a=Array.isArray(e?.tagHistory)?e.tagHistory:[],s=n.isAdmin||n.role==="Administrator",i=[...t.map((S,_)=>({...S,_source:"live",_index:_})),...a.map(S=>({...S,_source:"history",_index:-1}))],o=S=>new Date(S.respondedAt||S.taggedAt||S.date||0).getTime()||0,r=S=>String(S||"").trim().toLowerCase(),l=['<option value="all">All Sources</option>',...Array.from(new Set(i.map(S=>Dt(S)))).filter(Boolean).sort((S,_)=>S.localeCompare(_)).map(S=>`<option value="${ee(S.toLowerCase())}">${ee(S)}</option>`)].join(""),c={search:"",status:"all",source:"all",sort:"newest"},f=S=>{const _=Pt(S),L=_==="pending"&&S._source==="live",I=Dt(S),O=S.taggedByName||"System",E=S.title||`${I} from ${O}`,D=ea(S),M=JSON.stringify(String(S.id||"")),B={pending:{bg:"#fff7ed",border:"#fdba74",badge:"#f97316"},accepted:{bg:"#f0fdf4",border:"#86efac",badge:"#16a34a"},rejected:{bg:"#fef2f2",border:"#fca5a5",badge:"#dc2626"},default:{bg:"#f8fafc",border:"#e2e8f0",badge:"#6b7280"}},P=B[_]||B.default,C=L||s&&S.type==="minute-access-request"?`
            <div class="notif-drawer-actions">
                <button type="button" class="notif-drawer-btn approve" onclick="window.app_respondNotificationFromHistory(${Number(S._index)}, ${M}, 'approve')">
                    <i class="fa-solid fa-check"></i> Approve
                </button>
                <button type="button" class="notif-drawer-btn reject" onclick="window.app_respondNotificationFromHistory(${Number(S._index)}, ${M}, 'reject')">
                    <i class="fa-solid fa-xmark"></i> Reject
                </button>
            </div>`:"";return`
            <div class="notif-drawer-item ${L?"is-pending":""}" style="border-color:${P.border}; background:${P.bg};" data-notif-id="${ee(String(S.id||""))}">
                <div class="notif-drawer-item-head">
                    <div class="notif-drawer-item-left">
                        <div class="notif-drawer-source-icon">
                            <i class="fa-solid ${S.type==="tag"||S.type==="mention"?"fa-at":S.type==="task"?"fa-list-check":S.type==="minute-access-request"?"fa-file-lines":String(S.type||"").includes("missed-checkout")?"fa-user-clock":"fa-bell"}"></i>
                        </div>
                        <div>
                            <div class="notif-drawer-title">${ee(E)}</div>
                            <div class="notif-drawer-meta">${ee(I)} • ${ee(O)} • ${ee(fs(S))}</div>
                        </div>
                    </div>
                    <div class="notif-drawer-item-right">
                        <span class="notif-drawer-badge" style="background:${P.badge}">${ee(_)}</span>
                    </div>
                </div>
                ${D?`<div class="notif-drawer-text">${ee(D)}</div>`:""}
                ${C}
            </div>`},u=()=>{const S=i.filter(_=>{const L=Pt(_),I=Dt(_),O=_.taggedByName||"System",E=_.title||`${I} from ${O}`,D=ea(_),M=`${E} ${D} ${I} ${O} ${L}`;return!(c.status!=="all"&&L!==c.status||c.source!=="all"&&r(I)!==c.source||c.search&&!r(M).includes(c.search))});return c.sort==="oldest"?S.sort((_,L)=>o(_)-o(L)):c.sort==="pending"?S.sort((_,L)=>{const I=He(_)?1:0,O=He(L)?1:0;return I!==O?O-I:o(L)-o(_)}):S.sort((_,L)=>o(L)-o(_)),S},p=t.filter(He).length,m=`
        <div class="notif-drawer-backdrop" id="notif-drawer-backdrop" onclick="window.app_closeNotificationHistory()"></div>
        <div class="notif-drawer" id="notification-history-modal">
            <div class="notif-drawer-header">
                <div class="notif-drawer-header-left">
                    <i class="fa-solid fa-bell notif-drawer-header-icon"></i>
                    <div>
                        <div class="notif-drawer-header-title">Notifications</div>
                        <div class="notif-drawer-header-sub">${p>0?`${p} pending action${p>1?"s":""}`:"All caught up"}</div>
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
                        <select id="notif-drawer-source">${l}</select>
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
        </div>`,h=document.createElement("div");h.id="notif-drawer-root",h.innerHTML=m,document.body.appendChild(h),requestAnimationFrame(()=>{const S=document.getElementById("notification-history-modal");S&&S.classList.add("notif-drawer-open");const _=document.getElementById("notif-drawer-backdrop");_&&_.classList.add("notif-drawer-backdrop-visible")});const y=document.getElementById("notif-drawer-list"),w=document.getElementById("notif-drawer-results"),b=document.getElementById("notif-drawer-search"),v=document.getElementById("notif-drawer-source"),k=document.getElementById("notif-drawer-sort"),g=document.getElementById("notif-drawer-status-tabs"),A=()=>{if(!y)return;const S=u();y.innerHTML=S.length?S.map(f).join(""):'<div class="notif-drawer-empty"><i class="fa-regular fa-bell-slash"></i><p>No notifications match your search/filter.</p></div>',w&&(w.textContent=`Showing ${S.length} of ${i.length}`)};b?.addEventListener("input",S=>{c.search=r(S.target.value),A()}),v?.addEventListener("change",S=>{c.source=r(S.target.value)||"all",A()}),k?.addEventListener("change",S=>{c.sort=r(S.target.value)||"newest",A()}),g?.addEventListener("click",S=>{const _=S.target.closest("[data-notif-status]");_&&(c.status=r(_.getAttribute("data-notif-status"))||"all",g.querySelectorAll(".notif-drawer-status-tab").forEach(L=>L.classList.remove("is-active")),_.classList.add("is-active"),A())}),A(),await window.app_refreshNotificationBell()};window.app_systemDialog=function({title:n="Notice",message:e="",mode:t="alert",defaultValue:a="",confirmText:s="OK",cancelText:i="Cancel",placeholder:o=""}={}){return new Promise(r=>{const d=`system-dialog-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,l=`${d}-input`,c=t==="prompt",f=t==="confirm"||t==="prompt",u=`
                <div class="modal-overlay app-system-dialog-overlay" id="${d}" style="display:flex;">
                    <div class="modal-content app-system-dialog">
                        <div class="app-system-dialog-head">
                            <h3>${ee(n)}</h3>
                            <button type="button" class="app-system-dialog-close" aria-label="Close dialog">&times;</button>
                        </div>
                        <div class="app-system-dialog-body">
                            <p>${ms(e)}</p>
                            ${c?`<input id="${l}" class="app-system-dialog-input" type="text" value="${ee(a)}" placeholder="${ee(o)}" autocomplete="off">`:""}
                        </div>
                        <div class="app-system-dialog-actions">
                            ${f?`<button type="button" class="action-btn secondary app-system-dialog-cancel">${ee(i)}</button>`:""}
                            <button type="button" class="action-btn app-system-dialog-confirm">${ee(s)}</button>
                        </div>
                    </div>
                </div>
            `;(document.body||document.getElementById("modal-container")).insertAdjacentHTML("beforeend",u);const p=document.getElementById(d);if(!p){r(c?null:!1);return}p.style.zIndex="20000";const m=p.querySelector(".app-system-dialog-confirm"),h=p.querySelector(".app-system-dialog-cancel"),y=p.querySelector(".app-system-dialog-close"),w=c?p.querySelector(`#${l}`):null,b=v=>{p.remove(),r(v)};m?.addEventListener("click",()=>{b(c?w?w.value:"":!0)}),h?.addEventListener("click",()=>b(c?null:!1)),y?.addEventListener("click",()=>b(c?null:!1)),p.addEventListener("click",v=>{v.target===p&&b(c?null:!1)}),p.addEventListener("keydown",v=>{v.key==="Escape"&&b(c?null:!1),v.key==="Enter"&&(v.preventDefault(),b(c?w?w.value:"":!0))}),w?(w.focus(),w.select()):m?.focus()})};window.appAlert=(n,e="Notice")=>window.app_systemDialog({title:e,message:n,mode:"alert",confirmText:"OK"});window.appConfirm=(n,e="Please Confirm")=>window.app_systemDialog({title:e,message:n,mode:"confirm",confirmText:"Confirm",cancelText:"Cancel"});window.appPrompt=(n,e="",t={})=>window.app_systemDialog({title:t.title||"Enter Details",message:n,mode:"prompt",defaultValue:e,confirmText:t.confirmText||"Save",cancelText:t.cancelText||"Cancel",placeholder:t.placeholder||""});window.alert=n=>{window.appAlert(n)};window.app_openEventModal=()=>{window.app_showModal(`
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
        `,"event-modal")};window.app_submitEvent=async n=>{n.preventDefault();const e=document.getElementById("event-title").value,t=document.getElementById("event-date").value,a=document.getElementById("event-type").value;try{await window.AppCalendar.addEvent({title:e,date:t,type:a}),alert("Event added successfully!"),document.getElementById("event-modal")?.remove();const s=document.getElementById("page-content");s.innerHTML=await U.renderDashboard(),fe()}catch(s){alert("Error: "+s.message)}};const ta="work_plan_schema_v2_migrated",ys=async()=>{try{if(!window.AppDB||typeof window.AppDB.getAll!="function"||typeof window.AppDB.put!="function"||localStorage.getItem(ta)==="true")return;const n=await window.AppDB.getAll("work_plans");let e=0;for(const t of n){if(!t||Array.isArray(t.plans))continue;const a=typeof t.plan=="string"?t.plan.trim():"";if(!a)continue;const s={...t,plans:[{task:a,subPlans:Array.isArray(t.subPlans)?t.subPlans:[],tags:Array.isArray(t.tags)?t.tags:[],status:t.status||null,completedDate:t.completedDate||null,startDate:t.startDate||t.date,endDate:t.endDate||t.startDate||t.date}]};delete s.plan,delete s.subPlans,delete s.tags,delete s.status,delete s.completedDate,delete s.startDate,delete s.endDate,await window.AppDB.put("work_plans",s),e+=1}localStorage.setItem(ta,"true"),e>0&&console.log(`Work plan schema migration complete. Updated: ${e}`)}catch(n){console.warn("Work plan schema migration failed:",n)}};async function hs(){window.app_initTheme(),us(),window.addEventListener("app:user-sync",ps),window.addEventListener("app:update-available",Ye),window.addEventListener("app:update-state",Ye),document.addEventListener("visibilitychange",ds),window.addEventListener("focus",Xt),window.addEventListener("online",Xt);try{await window.AppAuth.init();const e=window.AppAuth.getUser();e&&(Ue=e.status||"out",Ba(),Na()),cs(),await ys(),window.AppActivity&&window.AppActivity.initCommandListener()}catch(e){console.error("Initialization Failed:",e),Z&&(Z.innerHTML=`<div style="text-align:center; padding:2rem; color:red;">Failed to load application.<br><small>${e.message}</small></div>`)}document.addEventListener("click",e=>{e.target.id==="sidebar-toggle"||e.target.closest("#sidebar-toggle")?Ct(!0):e.target.id==="sidebar-overlay"&&Ct(!1)}),window.addEventListener("hashchange",aa),aa();const n=window.AppAuth.getUser();n&&window.AppTour&&window.AppTour.init(n)}async function aa(){const n=window.AppAuth.getUser(),e=window.location.hash.slice(1)||"dashboard";if(e!=="admin"&&ue&&ue.length>0&&(console.log("Cleaning up Admin Realtime Listener."),ue.forEach(d=>typeof d=="function"&&d()),ue=[]),e!=="minutes"&&typeof ve=="function"&&(console.log("Cleaning up Minutes Realtime Listener."),ve(),ve=null),!n){ls(),rs(),Ut(!1),tt&&(tt.style.display="none"),at&&(at.style.display="none"),nt&&(nt.style.display="none"),document.body.style.background="#f3f4f6",Z&&(Z.innerHTML=U.renderLogin()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell();return}Ba(),Na(),Ct(!1),tt&&(tt.style.display=""),at&&(at.style.display=""),nt&&(nt.style.display="");const t=document.querySelector(".sidebar-footer .user-mini-profile");t&&(t.innerHTML=`
                <img src="${n.avatar||"https://ui-avatars.com/api/?name=User"}" alt="User">
                <div>
                    <p class="user-name">${n.name||"Staff Member"}</p>
                </div>
                <i class="fa-solid fa-gear user-settings-icon"></i>
            `);const a=window.app_hasPerm("attendance","view",n),s=window.app_hasPerm("reports","view",n),i=window.app_hasPerm("policies","view",n),o=window.app_canSeeAdminPanel(n);document.querySelectorAll('a[data-page="admin"]').forEach(d=>{d.style.display=o?"flex":"none",o||d.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="master-sheet"]').forEach(d=>{d.style.display=a?"flex":"none",a||d.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="salary"]').forEach(d=>{d.style.display=s?"flex":"none",s||d.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="policy-test"]').forEach(d=>{d.style.display=i?"flex":"none",i||d.style.setProperty("display","none","important")}),document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(d=>{d.dataset.page===e?d.classList.add("active"):d.classList.remove("active")});try{const d=document.getElementById("modal-container");if(d&&!document.getElementById("checkout-modal")&&d.insertAdjacentHTML("beforeend",U.renderModals()),Z&&(Z.innerHTML='<div class="loading-spinner"></div>'),e==="dashboard")Z.innerHTML=await U.renderDashboard(),fe();else if(e==="team-activities")Z.innerHTML=await U.renderTeamActivitiesPage(),window.app_initTeamActivities&&await window.app_initTeamActivities();else if(e==="staff-directory")Z.innerHTML=await U.renderStaffDirectoryPage();else if(e==="policies")window.AppPolicies&&typeof window.AppPolicies.render=="function"?Z.innerHTML=await window.AppPolicies.render():Z.innerHTML='<div style="padding:1rem; color:#b91c1c;">Policies module failed to load.</div>';else if(e==="annual-plan")Z.innerHTML=await U.renderAnnualPlan();else if(e==="timesheet")Z.innerHTML=await U.renderTimesheet();else if(e==="profile")Z.innerHTML=await U.renderProfile();else if(e==="salary"){if(!window.app_hasPerm("reports","view",n)){window.location.hash="dashboard";return}Z.innerHTML=await U.renderSalaryProcessing?await U.renderSalaryProcessing():await U.renderSalary()}else if(e==="policy-test"){if(!window.app_hasPerm("policies","view",n)){window.location.hash="dashboard";return}Z.innerHTML=await U.renderPolicyTest()}else if(e==="master-sheet"){if(!(window.app_hasPerm("attendance","view",n)||window.app_canManageAttendanceSheet(n))){window.location.hash="dashboard";return}Z.innerHTML=await U.renderMasterSheet()}else if(e==="minutes")Z.innerHTML=await U.renderMinutes(),ws();else if(e==="admin"){if(!window.app_canSeeAdminPanel(n)){window.location.hash="dashboard";return}Z.innerHTML=await U.renderAdmin(),window.AppAnalytics.initAdminCharts(),gs()}window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}catch(d){console.error("Render Error:",d),Z.innerHTML=`<div style="text-align:center; color:red; padding:2rem;">Error loading page: ${d.message}</div>`}}function gs(){ue.forEach(s=>typeof s=="function"&&s()),ue=[],console.log("Starting Admin Realtime Listeners (Users & Audits)...");let n=null;const e=()=>{n&&clearTimeout(n),n=setTimeout(async()=>{n=null,await t()},600)},t=async()=>{if(window.location.hash.slice(1)!=="admin")return;if(document.querySelector('.modal-overlay[style*="display: flex"], .modal[style*="display: flex"]'))console.log("Admin Update received but skipped because a modal is open.");else{console.log("Admin Data Update Received (Realtime) - Refreshing UI");const o=document.getElementById("page-content");if(o){const r=document.getElementById("audit-start")?.value,d=document.getElementById("audit-end")?.value;o.innerHTML=await U.renderAdmin(r,d),window.AppAnalytics&&window.AppAnalytics.initAdminCharts()}}};if((x&&x.READ_OPT_FLAGS||{}).FF_READ_OPT_TARGETED_REALTIME&&window.AppDB.listenQuery){ue.push(window.AppDB.listenQuery("users",[{field:"status",operator:"in",value:["in","out"]}],{limit:300},e));const s=new Date;s.setDate(s.getDate()-2),ue.push(window.AppDB.listenQuery("location_audits",[{field:"timestamp",operator:">=",value:s.getTime()}],{orderBy:[{field:"timestamp",direction:"desc"}],limit:300},e))}else ue.push(window.AppDB.listen("users",e)),ue.push(window.AppDB.listen("location_audits",e))}function ws(){if(!window.AppDB||!window.AppDB.listen)return;typeof ve=="function"&&(ve(),ve=null);const n=async()=>{if((window.location.hash.slice(1)||"dashboard")!=="minutes"||document.getElementById("minute-detail-modal"))return;const a=document.getElementById("page-content");a&&(a.innerHTML=await U.renderMinutes())};(x&&x.READ_OPT_FLAGS||{}).FF_READ_OPT_TARGETED_REALTIME&&window.AppDB.listenQuery?ve=window.AppDB.listenQuery("minutes",[],{orderBy:[{field:"date",direction:"desc"}],limit:150},n):ve=window.AppDB.listen("minutes",n)}function vs(n=null,e=!1){kt&&clearInterval(kt),(async()=>{let a="out",s=null;if(n)a=n.status||"out",s=n.lastCheckIn||null;else{const u=await window.AppAttendance.getStatus();a=u.status,s=u.lastCheckIn}const i=document.getElementById("timer-display"),o=document.getElementById("countdown-container"),r=document.getElementById("overtime-container"),d=document.getElementById("countdown-value"),l=document.getElementById("countdown-progress"),c=document.getElementById("overtime-value"),f=document.getElementById("timer-label");if(a==="in"&&s){const u=new Date(s),p=new Date,m=`${u.getFullYear()}-${String(u.getMonth()+1).padStart(2,"0")}-${String(u.getDate()).padStart(2,"0")}`,h=`${p.getFullYear()}-${String(p.getMonth()+1).padStart(2,"0")}-${String(p.getDate()).padStart(2,"0")}`,y=m!==h,w=new Date(u);w.setHours(17,0,0,0);const b=u.getDay();b===6&&w.setHours(13,0,0,0),b===0&&w.setHours(17,0,0,0),kt=setInterval(()=>{const v=Date.now(),k=v-s;if(i){let A=Math.floor(k/36e5),S=Math.floor(k/(1e3*60)%60),_=Math.floor(k/1e3%60);A=A<10?"0"+A:A,S=S<10?"0"+S:S,_=_<10?"0"+_:_,i.textContent=`${A} : ${S} : ${_}`}if(y){o&&(o.style.display="none"),r&&(r.style.display="none"),i&&(i.style.color="#b45309"),f&&(f.textContent="Session Carryover (Please Check Out)",f.style.color="#b45309");return}const g=w.getTime()-v;if(g>0){o&&(o.style.display="block"),r&&(r.style.display="none"),f&&(f.textContent="Elapsed Time",f.style.color="#6b7280"),i&&(i.style.color="#1f2937");let A=Math.floor(g/(1e3*60*60)%24),S=Math.floor(g/(1e3*60)%60),_=Math.floor(g/1e3%60);A=A<10?"0"+A:A,S=S<10?"0"+S:S,_=_<10?"0"+_:_;const L=w.getTime()-s,I=L>0?Math.min(100,k/L*100):100;d&&(d.textContent=`${A}:${S}:${_}`),l&&(l.style.width=`${I}%`),l&&(l.style.background="var(--primary)")}else{o&&(o.style.display="none"),r&&(r.style.display="block");const A=Math.abs(v-w.getTime());let S=Math.floor(A/(1e3*60*60)),_=Math.floor(A/(1e3*60)%60),L=Math.floor(A/1e3%60);S=S<10?"0"+S:S,_=_<10?"0"+_:_,L=L<10?"0"+L:L,c&&(c.textContent=`+ ${S}:${_}:${L}`),i&&(i.style.color="#c2410c"),f&&(f.textContent="Total Elapsed (Overtime)",f.style.color="#c2410c")}},1e3),!e&&window.AppActivity&&window.AppActivity.start&&window.AppActivity.start()}else i&&(i.textContent="00 : 00 : 00",i.style.color=""),f&&(f.textContent="Elapsed Time",f.style.color=""),o&&(o.style.display="none"),r&&(r.style.display="none")})()}window.getLocation=function(){return new Promise((e,t)=>{(async()=>{const a=window.location&&window.location.hostname?window.location.hostname:"",s=a==="localhost"||a==="127.0.0.1"||a==="::1";if(!window.isSecureContext&&!s){t("Location requires HTTPS on mobile. Open this app using an HTTPS URL and allow location access.");return}const i=Date.now();if(Te&&i-Oe<Ea){console.log("Using cached location (freshness: "+(i-Oe)+"ms)"),e(Te);return}if(!navigator.geolocation){t("Geolocation is not supported by your browser.");return}try{if(navigator.permissions&&navigator.permissions.query){const r=await navigator.permissions.query({name:"geolocation"});if(r&&r.state==="denied"){t("Location permission is blocked. Enable location for this site in browser settings and try again.");return}}}catch{}const o=r=>new Promise((d,l)=>{navigator.geolocation.getCurrentPosition(d,l,r)});try{console.log("Requesting Location: High Accuracy (GPS)...");const r=await o({enableHighAccuracy:!0,timeout:1e4,maximumAge:5e3}),d={lat:r.coords.latitude,lng:r.coords.longitude};Te=d,Oe=Date.now(),e(d)}catch(r){console.warn("High Accuracy Failed:",r.message);try{console.log("Requesting Location: Low Accuracy (Fallback)...");const d=await o({enableHighAccuracy:!1,timeout:15e3,maximumAge:1e4}),l={lat:d.coords.latitude,lng:d.coords.longitude};Te=l,Oe=Date.now(),e(l)}catch(d){console.error("Low Accuracy Failed:",d.message);let l="Unable to retrieve location.";d.code===1?l="Location permission denied.":d.code===2?l="Location unavailable. Ensure GPS/Location Services are turned on.":d.code===3&&(l="Location request timed out. Move to open sky or better network and try again."),t(l)}}})().catch(a=>{t(a&&a.message?a.message:"Unable to retrieve location.")})})};const de=n=>/^\d{4}-\d{2}-\d{2}$/.test(String(n||"")),bs={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11},Ss=(n="")=>{const e=String(n||"").trim();if(!e)return null;const t=e.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);if(!t)return null;const a=Number(t[1]),s=Number(t[2]),i=String(t[3]||"").toLowerCase(),o=Number(t[4]),r=bs[i];if(!Number.isInteger(a)||!Number.isInteger(s)||!Number.isInteger(r)||!Number.isInteger(o))return null;const d=new Date(o,r,a),l=new Date(o,r,s);if(Number.isNaN(d.getTime())||Number.isNaN(l.getTime()))return null;const c=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,f=`${l.getFullYear()}-${String(l.getMonth()+1).padStart(2,"0")}-${String(l.getDate()).padStart(2,"0")}`;return f<c?null:{startDate:c,endDate:f}},Ua=(n,e,t=null)=>{const a=de(e)?String(e):null,s=n?.startDate,i=n?.endDate,o=!de(s)&&!de(i)?Ss(n?.task||""):null;let r=de(s)?String(s):o?.startDate||a,d=de(i)?String(i):o?.endDate||r||a;if((!de(s)||!de(i))&&n?.sourcePlanId&&t?.workPlans){const l=(t.workPlans||[]).find(u=>u.id===n.sourcePlanId),c=Number.isInteger(n.sourceTaskIndex)?n.sourceTaskIndex:Number(n.sourceTaskIndex),f=l&&Array.isArray(l.plans)&&Number.isInteger(c)?l.plans[c]:null;if(f){const u=de(f.startDate)?f.startDate:l.date||r,p=de(f.endDate)?f.endDate:f.startDate||l.date||d;de(s)||(r=u),de(i)||(d=p)}}return r&&d&&d<r?{startDate:r,endDate:r}:{startDate:r,endDate:d}},Ra=(n,e,t,a=null)=>{const{startDate:s,endDate:i}=Ua(n,e,a);return!s||!i?e===t:!(t<s||t>i||n?.completedDate&&n.completedDate<t)};window.app_getDayEvents=(n,e,t={})=>{const a=t.includeAuto!==!1,s=t.dedupe!==!1,i=t.userId||null;if(!e)return[];if(Array.isArray(e))return e.filter(l=>l.date===n);const o=new Date(n),r=[];if(a&&window.AppAnalytics){const l=window.AppAnalytics.getDayType(o);l==="Holiday"?r.push({title:"Company Holiday (Weekend)",type:"holiday",date:n}):l==="Half Day"&&r.push({title:"Half Working Day (Sat)",type:"event",date:n})}if((e.leaves||[]).forEach(l=>{n>=l.startDate&&n<=l.endDate&&r.push({title:`${l.userName||"Staff"} (Leave)`,type:"leave",userId:l.userId,date:n})}),(e.events||[]).forEach(l=>{l.date===n&&r.push({title:l.title,type:l.type||"event",date:n})}),(e.workPlans||[]).forEach(l=>{if(l.date>n)return;const f=(Array.isArray(l.plans)?l.plans:[]).filter(h=>Ra(h,l.date,n,e));if(!f.length)return;const m=`${(l.planScope||"personal")==="annual"?"All Staff (Annual)":l.userName||"Staff"}: ${f.map(h=>h.task).join("; ")}`;r.push({title:m,type:"work",userId:l.userId,plans:f,date:n,planScope:l.planScope||"personal"})}),i){const l=[];r.forEach(c=>{if(c.type!=="work"){l.push(c);return}if((c.planScope||"").toLowerCase()==="annual"){l.push(c);return}if(c.userId===i){l.push(c);return}if(Array.isArray(c.plans)&&c.plans.some(u=>Array.isArray(u.tags)&&u.tags.some(p=>p.id===i&&p.status==="accepted"))){l.push(c);return}}),r.length=0,r.push(...l)}if(!s)return r;const d=new Set;return r.filter(l=>{const c=l.type||"event";if(c!=="holiday"&&c!=="event")return!0;const f=`${c}|${l.title||""}|${l.userId||""}|${l.date||n}`;return d.has(f)?!1:(d.add(f),!0)})};const Rt=(n,e)=>{const t=String(n??"").trim();return!t||t==="undefined"||t==="null"?e:t},V=n=>String(n??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),le=n=>String(n??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'"),ht=n=>{const e=String(n||"").trim();if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?"":`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`},gt=(n,e)=>{const t=ht(n);if(!t)return"NA";const a=t.replace(/-/g,""),s=String(e||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase().slice(-3)||"USR";return`EMP-${a}-${s}`},Ee=(n,e="NA")=>{if(n==null||n==="")return e;const t=n instanceof Date?n:new Date(n);return Number.isNaN(t.getTime())?e:t.toLocaleDateString("en-GB")},ks=(n,e="NA")=>{if(n==null||n==="")return e;const t=n instanceof Date?n:new Date(n);return Number.isNaN(t.getTime())?e:t.toLocaleString("en-GB")},As=n=>`Rs ${Number(n||0).toLocaleString("en-IN")}`,Ds=(n="")=>{const e=String(n||"").replace(/\s+/g," ").trim();return e?e.length>72?`${e.slice(0,72)}...`:e:"New task"},Ht=()=>`
        <div class="no-tags-placeholder day-plan-no-tags-placeholder">
            <p class="day-plan-no-tags-text">No collaborators yet</p>
        </div>
    `,Ha=(n,e,t="pending")=>`
        <div class="tag-chip day-plan-tag-chip" data-id="${V(n)}" data-name="${V(e)}" data-status="${V(t)}">
            <span class="day-plan-tag-main">@${V(e)} <span class="day-plan-tag-pending">(${V(t)})</span></span>
            <i class="fa-solid fa-times day-plan-remove-collab-btn" onclick="window.app_removeTagHint(this)"></i>
        </div>
    `;window.app_refreshPlanBlockSummary=n=>{if(!n)return;const e=n.querySelector(".plan-task"),t=n.querySelector(".day-plan-task-summary"),a=n.querySelector(".plan-scope"),s=n.querySelector(".day-plan-scope-pill"),i=Ds(e?e.value:"");t&&(t.textContent=i),s&&a&&(s.textContent=a.value==="annual"?"Annual Plan":"Personal Plan")};window.app_togglePlanBlockCollapse=n=>{const e=n.closest(".plan-block");if(!e)return;e.classList.toggle("is-collapsed");const t=e.classList.contains("is-collapsed"),a=n.querySelector("i");a&&(a.classList.toggle("fa-chevron-down",!t),a.classList.toggle("fa-chevron-up",t));const s=n.querySelector(".day-plan-collapse-label");s&&(s.textContent=t?"Expand":"Minimize"),window.app_refreshPlanBlockSummary(e)};window.app_toggleTaskCollaborator=(n,e,t)=>{const a=n.closest(".plan-block");if(!a)return;const s=a.querySelector(".tags-container");if(!s)return;const i=typeof CSS<"u"&&CSS.escape?CSS.escape(e):e.replace(/"/g,'\\"'),o=s.querySelector(`[data-id="${i}"]`);if(o)o.remove(),n.classList.remove("selected");else{const r=s.querySelector(".no-tags-placeholder");r&&r.remove(),s.insertAdjacentHTML("beforeend",Ha(e,t,"pending")),n.classList.add("selected")}s.querySelectorAll(".tag-chip").length===0&&(s.innerHTML=Ht())};window.app_getAnnualDayStaffPlans=n=>{const e=window._currentPlans||{},t=window._annualUserMap||{},s=(e.workPlans||[]).filter(r=>r.date<=n).map(r=>{const d=t[r.userId]||r.userName||"Staff",l=new Map,c=m=>String(m||"").toLowerCase().replace(/\d{1,2}\s*-\s*\d{1,2}\s+[a-z]+\s+\d{4}/g," ").replace(/\([^)]*\)/g," ").replace(/[^a-z\s]/g," ").split(/\s+/).filter(Boolean).slice(0,8).join(" "),f=(m,h="")=>{const y=String(m).trim();if(!y)return;const w=c(y)||y.toLowerCase().replace(/\s+/g," "),b=`${y}${h||""}`;if(!l.has(w)){l.set(w,b);return}(l.get(w)||"")===y&&b!==y&&l.set(w,b)},u=(Array.isArray(r.plans)?r.plans:[]).filter(m=>Ra(m,r.date,n,e)).map(m=>{const{startDate:h,endDate:y}=Ua(m,r.date,e),w=!!(h&&y&&h!==y),b=y===n,v=h===n,g=m.completedDate&&m.completedDate<y&&m.completedDate===n?" (Completed Early)":w&&b?" (Ends Today)":w&&v?" (Starts Today)":"";return f(m.task||"Planned task",g),""}).filter(Boolean),p=Array.from(l.values());return!p.length&&u.length?{name:d,tasks:u}:p.length?{name:d,tasks:p}:null}).filter(Boolean),i=r=>String(r||"").toLowerCase().replace(/\d{1,2}\s*-\s*\d{1,2}\s+[a-z]+\s+\d{4}/g," ").replace(/\([^)]*\)/g," ").replace(/[^a-z\s]/g," ").split(/\s+/).filter(Boolean).slice(0,8).join(" "),o=new Map;return s.forEach(r=>{const d=r.name||"Staff";o.has(d)||o.set(d,new Map);const l=o.get(d);(r.tasks||[]).forEach(c=>{const f=i(c)||String(c||"").toLowerCase();if(!l.has(f))l.set(f,c);else{const u=l.get(f)||"",p=String(c||"");u.length<p.length&&l.set(f,p)}})}),Array.from(o.entries()).map(([r,d])=>({name:r,tasks:Array.from(d.values())}))};window.app_showAnnualHoverPreview=(n,e)=>{const t="annual-hover-preview";document.getElementById(t)?.remove();const a=window.app_getAnnualDayStaffPlans(e),s=a.length?a.map(o=>`
                <div style="margin-bottom:0.45rem;">
                    <div style="font-size:0.76rem; font-weight:700; color:#334155;">${o.name}</div>
                    <div style="font-size:0.72rem; color:#64748b;">${o.tasks.slice(0,2).join(" | ")}${o.tasks.length>2?` (+${o.tasks.length-2} more)`:""}</div>
                </div>
            `).join(""):'<div style="font-size:0.74rem; color:#94a3b8;">No staff plans for this date</div>',i=`
            <div id="${t}" style="position:fixed; z-index:12000; left:${Math.min((n.clientX||0)+12,window.innerWidth-290)}px; top:${Math.min((n.clientY||0)+12,window.innerHeight-220)}px; width:280px; background:#fff; border:1px solid #dbeafe; border-radius:12px; box-shadow:0 12px 26px rgba(15,23,42,0.18); padding:0.65rem;">
                <div style="font-size:0.76rem; font-weight:800; color:#1e3a8a; margin-bottom:0.5rem;">${e} Plans</div>
                ${s}
            </div>`;(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",i)};window.app_hideAnnualHoverPreview=()=>{document.getElementById("annual-hover-preview")?.remove()};window.app_openAnnualDayPlan=async n=>{window.app_hideAnnualHoverPreview();const e=`annual-day-click-${Date.now()}`,t=window.app_getAnnualDayStaffPlans(n),a=t.length?t.map(i=>`
                <div style="border:1px solid #e2e8f0; border-radius:10px; padding:0.55rem; margin-bottom:0.45rem;">
                    <div style="font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:0.25rem;">${i.name}</div>
                    <div style="font-size:0.76rem; color:#64748b;">${i.tasks.join(" | ")}</div>
                </div>
            `).join(""):'<div style="font-size:0.8rem; color:#94a3b8;">No plans yet for this date.</div>',s=`
            <div class="modal-overlay annual-v2-modal" id="${e}" style="display:flex;">
                <div class="modal-content annual-day-plan-content annual-v2-modal-content" style="max-width:560px;">
                    <div class="annual-day-plan-head annual-v2-modal-head" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.7rem;">
                        <h3 style="margin:0;">${n}</h3>
                        <button type="button" class="app-system-dialog-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="annual-day-plan-list annual-v2-modal-list" style="max-height:46vh; overflow:auto; margin-bottom:0.75rem;">${a}</div>
                    <button type="button" class="action-btn" style="width:100%;" onclick="this.closest('.modal-overlay').remove(); window.app_openDayPlan('${n}')">
                        <i class="fa-solid fa-pen-to-square"></i> Add / Edit Day Plan
                    </button>
                </div>
            </div>`;window.app_showModal(s,e)};window.app_addPlanBlockUI=async()=>{const n=document.getElementById("plans-container");if(!n)return;const e=await window.AppDB.getAll("users"),t=window.AppAuth.getUser(),a=t.role==="Administrator"||t.isAdmin,s=Rt(window.app_currentDayPlanTargetId,t.id),i=n.dataset.defaultScope==="annual"?"annual":"personal",r=e.filter(m=>m.id!==s).map(m=>`
            <button
                type="button"
                class="day-plan-collab-option"
                data-id="${V(m.id)}"
                onclick="window.app_toggleTaskCollaborator(this, '${le(m.id)}', '${le(m.name)}')"
                title="Add or remove ${V(m.name)}"
            >${V(m.name)}</button>
        `).join(""),d=document.createElement("div");d.className="plan-block day-plan-block-shell",d.innerHTML=`
            <div class="day-plan-block-head" style="display:flex; align-items:center; justify-content:space-between; gap:0.7rem; padding:0.62rem 0.8rem; border-bottom:1px solid #dbeafe; background:linear-gradient(90deg,#f7faff 0%,#ecf4ff 100%);">
                <div class="day-plan-block-head-main" style="display:flex; align-items:center; gap:0.55rem; min-width:0;">
                    <span class="day-plan-index-badge-step" style="background:#1d4ed8; color:#fff;">${n.querySelectorAll(".plan-block").length+1}</span>
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
                            ${Ht()}
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
                ${a?`
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <label class="day-plan-mini-label">Assign To</label>
                        <select class="plan-assignee day-plan-select">
                            ${e.map(m=>`<option value="${m.id}" ${m.id===t.id?"selected":""}>${m.name}</option>`).join("")}
                        </select>
                    </div>
                `:""}
            </div>
        `,n.appendChild(d);const l=d.querySelector(".plan-start-date"),c=d.querySelector(".plan-end-date"),f=document.querySelector("#day-plan-modal .day-plan-head p")?.textContent?.match(/\d{4}-\d{2}-\d{2}/),u=f?f[0]:"";l&&(l.value=u),c&&(c.value=u);const p=d.querySelector(".plan-task");window.app_refreshPlanBlockSummary(d),p&&p.focus()};window.app_addSubPlanRow=n=>{const e=n.closest(".plan-block")?.querySelector(".sub-plans-list");if(!e)return;const t=document.createElement("div");t.className="sub-plan-row day-plan-sub-row",t.innerHTML=`
            <div class="day-plan-step-dot"></div>
            <input type="text" class="sub-plan-input day-plan-sub-input" placeholder="Add a step...">
            <button type="button" onclick="this.parentElement.remove()" title="Remove step" class="day-plan-remove-step-btn"><i class="fa-solid fa-circle-xmark"></i></button>
        `,e.appendChild(t);const a=t.querySelector("input");a&&a.focus()};window.app_checkMentions=(n,e)=>{const t=n.value,a=n.selectionStart,s=t.lastIndexOf("@",a-1),i=document.getElementById("mention-dropdown");if(i)if(s!==-1&&!t.substring(s,a).includes(" ")){const o=t.substring(s+1,a).toLowerCase(),r=e.filter(d=>d.name.toLowerCase().includes(o));if(n.id||(n.id="ta-"+Date.now()),r.length>0){const d=n.getBoundingClientRect();i.innerHTML=r.map(l=>`
                    <div onclick="window.app_applyMention('${n.id}', '${l.id}', '${l.name.replace(/'/g,"\\'")}', ${s})" class="mention-item day-plan-mention-item">
                        <img src="${l.avatar}" class="day-plan-mention-avatar" />
                        <span>${l.name}</span>
                    </div>
                `).join(""),i.style.top=`${d.bottom+6}px`,i.style.left=`${d.left}px`,i.style.display="block"}else i.style.display="none"}else i.style.display="none"};window.app_applyMention=(n,e,t,a)=>{const s=document.getElementById(n);if(!s)return;const i=s.selectionStart,o=s.value.substring(0,a),r=s.value.substring(i);s.value=`${o}${t} ${r}`,s.focus();const d=s.closest(".plan-block"),l=d?.querySelector(".tags-container");if(!l)return;const c=document.getElementById("mention-dropdown");if(c&&(c.style.display="none"),l.querySelector(`[data-id="${e}"]`))return;const u=l.querySelector(".no-tags-placeholder");u&&u.remove(),l.insertAdjacentHTML("beforeend",Ha(e,t,"pending"));const p=typeof CSS<"u"&&CSS.escape?CSS.escape(e):e.replace(/"/g,'\\"'),m=d?.querySelector(`.day-plan-collab-option[data-id="${p}"]`);m&&m.classList.add("selected")};window.app_removeTagHint=n=>{const e=n.closest(".tags-container"),t=n.closest(".tag-chip"),a=t?t.dataset.id:"",s=n.closest(".plan-block");if(n.parentElement.remove(),s&&a){const i=typeof CSS<"u"&&CSS.escape?CSS.escape(a):a.replace(/"/g,'\\"'),o=s.querySelector(`.day-plan-collab-option[data-id="${i}"]`);o&&o.classList.remove("selected")}e&&e.querySelectorAll(".tag-chip").length===0&&(e.innerHTML=Ht())};window.app_showStatusTooltip=()=>{};window.app_hideCheckoutIntro=()=>{const n=document.getElementById("checkout-intro-panel");n&&(n.style.display="none",localStorage.setItem("checkoutIntroSeen","true"))};window.app_updateCharCounter=n=>{const e=document.getElementById("char-counter");if(e){const t=n.value.length;e.textContent=`${t} / 500 recommended`,t>500?e.style.color="#f59e0b":t>300?e.style.color="#10b981":e.style.color="#94a3b8"}};window.app_selectLocationReason=n=>{const e=document.getElementById("location-explanation");e&&(document.querySelectorAll(".location-reason-btn").forEach(t=>{t.style.background="#e0f2fe",t.style.borderColor="#7dd3fc"}),event.target.style.background="#0ea5e9",event.target.style.borderColor="#0ea5e9",event.target.style.color="white",e.value=n,e.focus())};window.app_selectOvertimeReason=(n,e,t="overtime_work")=>{const a=document.getElementById("checkout-overtime-explanation"),s=document.getElementById("checkout-overtime-mode");document.querySelectorAll(".overtime-reason-btn").forEach(i=>{i.style.background="#fef3c7",i.style.borderColor="#fcd34d",i.style.color="#92400e"}),n&&(n.style.background="#f59e0b",n.style.borderColor="#f59e0b",n.style.color="white"),s&&(s.value=t),a&&(a.value=e,a.focus())};window.app_useWorkPlan=()=>{const n=document.getElementById("checkout-plan-text"),e=document.getElementById("checkout-work-summary"),t=n?.dataset?.rawText;t&&e&&(e.value=t,window.app_updateCharCounter&&window.app_updateCharCounter(e),e.focus(),e.style.borderColor="#8b5cf6",e.style.background="#f5f3ff",setTimeout(()=>{e.style.borderColor="#e2e8f0",e.style.background="#ffffff"},1e3))};const lt={started:"Started",half_done:"Half Done",blocked:"Blocked",waiting:"Waiting",done:"Done"},Se=n=>typeof CSS<"u"&&CSS.escape?CSS.escape(n):String(n||"").replace(/"/g,'\\"');window.app_getCheckoutTaskKey=(n,e)=>`${n}:${e}`;window.app_parseCheckoutTaskKey=n=>{const e=String(n||""),t=e.lastIndexOf(":");if(t<=0)return{planId:e,taskIndex:-1};const a=e.slice(0,t),s=Number(e.slice(t+1));return{planId:a,taskIndex:s}};window.app_initCheckoutTaskDetails=(n,e,t)=>{window.app_checkoutTaskDetails=window.app_checkoutTaskDetails||{};const a=window.app_getCheckoutTaskKey(n,e);if(!window.app_checkoutTaskDetails[a]){const s=Number(t?.progressPercent),i=Number.isFinite(s)?Math.min(100,Math.max(0,s)):t?.status==="completed"?100:0,o=t?.progressStatus||(i>=100?"done":i>0?"started":"waiting");window.app_checkoutTaskDetails[a]={action:"",progressPercent:i,progressStatus:o,progressNote:t?.progressNote||"",actionMeta:{},lastUpdatedAt:null}}return window.app_checkoutTaskDetails[a]};window.app_markCheckoutTaskSaved=n=>{const t=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Se(n)}"]`)?.querySelector("[data-saved-indicator]");t&&(t.classList.add("is-visible"),clearTimeout(t._hideTimeout),t._hideTimeout=setTimeout(()=>{t.classList.remove("is-visible")},1400))};window.app_setCheckoutTaskStatus=(n,e)=>{const t=window.app_checkoutTaskDetails?.[n];t&&(t.progressStatus=e,t.lastUpdatedAt=new Date().toISOString(),window.app_syncCheckoutTaskPanel(n),window.app_markCheckoutTaskSaved(n),window.app_renderCheckoutActionPreview())};window.app_updateCheckoutTaskProgress=(n,e)=>{const t=window.app_checkoutTaskDetails?.[n];if(!t)return;const a=Math.min(100,Math.max(0,Number(e||0)));t.progressPercent=a,a>=100&&(t.progressStatus="done"),t.lastUpdatedAt=new Date().toISOString(),window.app_syncCheckoutTaskPanel(n),window.app_markCheckoutTaskSaved(n),window.app_renderCheckoutActionPreview()};window.app_updateCheckoutTaskNote=(n,e)=>{const t=window.app_checkoutTaskDetails?.[n];t&&(t.progressNote=String(e||""),t.lastUpdatedAt=new Date().toISOString(),window.app_markCheckoutTaskSaved(n),window.app_renderCheckoutActionPreview())};window.app_updateCheckoutTaskActionMeta=(n,e,t)=>{const a=window.app_checkoutTaskDetails?.[n];a&&(a.actionMeta=a.actionMeta||{},a.actionMeta[e]=t,a.lastUpdatedAt=new Date().toISOString(),window.app_markCheckoutTaskSaved(n),window.app_renderCheckoutActionPreview())};window.app_clearCheckoutTaskError=n=>{const e=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Se(n)}"]`);if(!e)return;e.classList.remove("has-error");const t=e.querySelector("[data-inline-error]");t&&(t.textContent="")};window.app_setCheckoutTaskError=(n,e)=>{const t=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Se(n)}"]`);if(!t)return;t.classList.add("has-error");const a=t.querySelector("[data-inline-error]");a&&(a.textContent=e)};window.app_syncCheckoutTaskPanel=n=>{const e=window.app_checkoutTaskDetails?.[n],t=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Se(n)}"]`);if(!t||!e)return;const a=t.querySelector("[data-progress-value]"),s=t.querySelector("[data-progress-input]");s&&(s.value=e.progressPercent),a&&(a.textContent=`${e.progressPercent}%`);const i=t.querySelector("[data-progress-note]");i&&i.value!==e.progressNote&&(i.value=e.progressNote||""),t.querySelectorAll("[data-status-chip]").forEach(o=>{const r=o.getAttribute("data-status-chip");o.classList.toggle("is-selected",r===e.progressStatus)}),t.querySelectorAll("[data-action-panel-section]").forEach(o=>{const r=o.getAttribute("data-action-panel-section");o.style.display=e.action===r?"block":"none"}),t.querySelectorAll("[data-action-field]").forEach(o=>{const r=o.getAttribute("data-action-field"),d=e.actionMeta?.[r]??"";o.value!==String(d)&&(o.value=String(d))})};window.app_collectCheckoutTaskUpdates=()=>{const n=[],e=[],t=window.app_checkoutTaskDetails||{};return Object.keys(t).forEach(a=>{const s=t[a];if(!s||!s.action)return;const{planId:i,taskIndex:o}=window.app_parseCheckoutTaskKey(a);let r="";if(s.action==="postpone"){const d=s.actionMeta?.postponeDate,l=String(s.actionMeta?.postponeReason||"").trim();d?l||(r="Add a reason for postponing."):r="Select a new date to postpone."}if(s.action==="delegate"&&(String(s.actionMeta?.delegateUserId||"").trim()||(r="Select a staff member to delegate.")),r){e.push({key:a,message:r});return}n.push({key:a,planId:i,taskIndex:o,action:s.action,progressPercent:s.progressPercent,progressStatus:s.progressStatus,progressNote:s.progressNote,actionMeta:s.actionMeta||{},timestamp:new Date().toISOString()})}),{updates:n,errors:e}};window.app_closeCheckoutActionModal=()=>{document.getElementById("checkout-action-detail-modal")?.remove()};window.app_openCheckoutActionModal=n=>{const e=window.app_checkoutTaskDetails?.[n];if(!e||!e.action)return;const t=window.app_checkoutTaskMeta?.[n]||{},a=window.app_checkoutUserMap||{},s=window.AppAuth.getUser()?.id,i=document.getElementById("checkout-action-detail-modal");i&&i.remove();const o=e.action==="complete"?"Complete":e.action==="postpone"?"Postpone":e.action==="delegate"?"Delegate":"Action",r=Object.keys(lt).map(y=>`<button type="button" class="checkout-task-chip ${e.progressStatus===y?"is-selected":""}" data-status-chip="${y}" onclick="window.app_setCheckoutTaskStatus('${le(n)}','${y}')">${lt[y]}</button>`).join(""),d=V(e.actionMeta?.postponeDate||new Date(Date.now()+864e5).toISOString().split("T")[0]),l=V(e.actionMeta?.postponeReason||""),c=V(e.actionMeta?.completionNote||""),f=V(e.actionMeta?.delegateNote||""),u=V(e.actionMeta?.delegateUserId||""),p=V(e.progressNote||""),m=Object.keys(a).filter(y=>String(y)!==String(s)).map(y=>{const w=u&&u===String(y)?"selected":"";return`<option value="${V(y)}" ${w}>${V(a[y])}</option>`}).join(""),h=document.createElement("div");h.id="checkout-action-detail-modal",h.className="modal-overlay checkout-action-detail-modal",h.setAttribute("data-checkout-key",n),h.innerHTML=`
        <div class="modal-content checkout-action-detail-content">
            <div class="checkout-action-detail-header">
                <div>
                    <div class="checkout-action-detail-title">${V(t.text||"Task")}</div>
                    <div class="checkout-action-detail-sub">${V(o)} • ${e.progressPercent}% • ${V(lt[e.progressStatus]||"")}</div>
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
                    <input type="range" min="0" max="100" value="${e.progressPercent}" data-progress-input oninput="window.app_updateCheckoutTaskProgress('${le(n)}', this.value)">
                </div>
                <div class="checkout-task-field">
                    <label>Status</label>
                    <div class="checkout-task-status-chips">
                        ${r}
                    </div>
                </div>
                <div class="checkout-task-field">
                    <label>Note</label>
                    <textarea rows="2" data-progress-note placeholder="What changed? (optional)" oninput="window.app_updateCheckoutTaskNote('${le(n)}', this.value)">${p}</textarea>
                </div>
                <div class="checkout-task-action-extra" data-action-panel-section="complete" style="display:${e.action==="complete"?"block":"none"};">
                    <label>Completion Note</label>
                    <textarea rows="2" data-action-field="completionNote" placeholder="Optional details for completion." oninput="window.app_updateCheckoutTaskActionMeta('${le(n)}','completionNote', this.value)">${c}</textarea>
                </div>
                <div class="checkout-task-action-extra" data-action-panel-section="postpone" style="display:${e.action==="postpone"?"block":"none"};">
                    <label>New Date</label>
                    <input type="date" data-action-field="postponeDate" value="${d}" onchange="window.app_updateCheckoutTaskActionMeta('${le(n)}','postponeDate', this.value)">
                    <label>Reason</label>
                    <textarea rows="2" data-action-field="postponeReason" placeholder="Why postponed?" oninput="window.app_updateCheckoutTaskActionMeta('${le(n)}','postponeReason', this.value)">${l}</textarea>
                </div>
                <div class="checkout-task-action-extra" data-action-panel-section="delegate" style="display:${e.action==="delegate"?"block":"none"};">
                    <label>Assign To</label>
                    <select data-action-field="delegateUserId" onchange="window.app_updateCheckoutTaskActionMeta('${le(n)}','delegateUserId', this.value)">
                        <option value="">Select staff</option>
                        ${m}
                    </select>
                    <label>Handoff Note</label>
                    <textarea rows="2" data-action-field="delegateNote" placeholder="Handoff context (optional)." oninput="window.app_updateCheckoutTaskActionMeta('${le(n)}','delegateNote', this.value)">${f}</textarea>
                </div>
                <div class="checkout-task-inline-error" data-inline-error></div>
            </div>
            <div class="checkout-action-detail-footer">
                <button type="button" class="action-btn secondary" onclick="window.app_closeCheckoutActionModal()">Done</button>
            </div>
        </div>
    `,document.body.appendChild(h),window.app_syncCheckoutTaskPanel(n)};window.app_renderCheckoutActionPreview=()=>{const n=document.getElementById("checkout-action-preview"),e=document.getElementById("checkout-action-preview-list");if(!n||!e)return;const t=window.app_checkoutTaskDetails||{},a=window.app_checkoutTaskMeta||{},s=window.app_checkoutUserMap||{},i=Object.keys(t).map(o=>{const r=t[o];if(!r||!r.action)return null;const l=(a[o]||{}).text||"Task",c=r.action==="complete"?"Complete":r.action==="postpone"?"Postpone":r.action==="delegate"?"Delegate":r.action,f=lt[r.progressStatus]||"Waiting",u=String(r.progressNote||"").trim();let p="";if(r.action==="postpone"){const m=ht(r.actionMeta?.postponeDate)||"—",h=String(r.actionMeta?.postponeReason||"").trim();p=`New date: ${V(m)}${h?` • Reason: ${V(h)}`:""}`}if(r.action==="delegate"){const m=String(r.actionMeta?.delegateUserId||""),h=s[m]||"—",y=String(r.actionMeta?.delegateNote||"").trim();p=`Assigned to: ${V(h)}${y?` • Note: ${V(y)}`:""}`}if(r.action==="complete"){const m=String(r.actionMeta?.completionNote||"").trim();p=m?`Completion note: ${V(m)}`:""}return`
            <div class="checkout-action-preview-item">
                <div class="checkout-action-preview-title">${V(l)}</div>
                <div class="checkout-action-preview-meta">
                    <span class="checkout-action-preview-chip">${V(c)}</span>
                    <span>${r.progressPercent}% • ${V(f)}</span>
                </div>
                ${u?`<div class="checkout-action-preview-note">${V(u)}</div>`:""}
                ${p?`<div class="checkout-action-preview-extra">${p}</div>`:""}
            </div>
        `}).filter(Boolean);if(i.length===0){n.style.display="none",e.innerHTML="";return}n.style.display="block",e.innerHTML=i.join("")};window.app_applyCheckoutTaskUpdates=async(n=[])=>{if(!Array.isArray(n)||n.length===0)return;const e=window.AppAuth.getUser(),t=e?.id||e?.name||"staff",a=new Date().toISOString().split("T")[0];for(const s of n){const i=await window.AppDB.get("work_plans",s.planId).catch(()=>null);if(!i||!Array.isArray(i.plans))continue;const o=i.plans[s.taskIndex];if(o){if(o.progressPercent=s.progressPercent,o.progressStatus=s.progressStatus,o.progressNote=s.progressNote,o.lastProgressUpdateAt=s.timestamp,o.lastProgressUpdateBy=t,o.lastCheckoutAction=s.action,s.action==="complete"&&(o.status="completed",o.completedDate||(o.completedDate=a)),s.action==="postpone"&&(o.status="postponed"),i.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",i),s.action==="postpone"){const r=ht(s.actionMeta?.postponeDate);if(r){const d=o.subPlans&&o.subPlans.length?` - ${o.subPlans.join(", ")}`:"",l=`${o.task}${d}`,c=i.date||a,u=`${l.replace(/\s*\(Postponed from [^)]+\)\s*$/i,"")} (Postponed from ${c})`;await window.AppCalendar.addWorkPlanTask(r,e.id,u,[],{addedFrom:"postponed",sourcePlanId:s.planId,sourceTaskIndex:s.taskIndex,postponedFromDate:c})}}if(s.action==="delegate"){const r=String(s.actionMeta?.delegateUserId||"").trim();r&&await window.app_delegateTo(s.planId,s.taskIndex,r)}}}window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans()};window.app_deleteDayPlan=async(n,e=null,t=null)=>{if(!await window.appConfirm("Are you sure you want to delete this work plan?"))return;const a=window.AppAuth.getUser(),s=Rt(e,a.id);try{t==="personal"||t==="annual"?await window.AppCalendar.deleteWorkPlan(n,s,{planScope:t}):await Promise.all([window.AppCalendar.deleteWorkPlan(n,s,{planScope:"personal"}),window.AppCalendar.deleteWorkPlan(n,s,{planScope:"annual"})]),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert("Plan deleted!"),document.getElementById("day-plan-modal")?.remove();const o=await U.renderDashboard(),r=document.getElementById("page-content");r&&(r.innerHTML=o,window.setupDashboardEvents&&window.setupDashboardEvents())}catch(i){alert(i.message)}};window.app_saveDayPlan=async(n,e,t=null)=>{n.preventDefault();const a=window.AppAuth.getUser(),s=Rt(t,a.id),i=n.target,o=i?.dataset?.hadPersonal==="1",r=i?.dataset?.hadAnnual==="1",d=document.querySelectorAll(".plan-block"),l=[],c=[],f=[],u={};let p="";if(d.forEach(m=>{const h=m.querySelector(".plan-task").value.trim(),y=m.querySelectorAll(".sub-plan-input"),w=Array.from(y).map(D=>D.value.trim()).filter(D=>D!==""),b=m.querySelectorAll(".tag-chip"),v=Array.from(b).map(D=>({id:D.dataset.id,name:D.dataset.name,status:D.dataset.status||"pending"})),k=m.querySelector(".plan-status").value,g=m.querySelector(".plan-assignee"),A=g?g.value:s,S=m.querySelector(".plan-start-date"),_=m.querySelector(".plan-end-date"),L=S?String(S.value||"").trim():"",I=_?String(_.value||"").trim():"",O=m.querySelector(".plan-scope"),E=O&&O.value==="annual"?"annual":"personal";if(h){if(L&&!I||!L&&I){p="Please select both From Date and To Date for ranged tasks.";return}if(L&&I&&I<L){p="To Date cannot be earlier than From Date.";return}const B={task:h,subPlans:w,tags:v,status:k||null,assignedTo:A||null,startDate:L||e,endDate:I||e,planScope:E,completedDate:k==="completed"?new Date().toISOString().split("T")[0]:null};l.push(B),E==="annual"?f.push(B):c.push(B)}}),l.length===0){alert(p||"Please add at least one task.");return}if(p){alert(p);return}try{c.length>0?(await window.AppCalendar.setWorkPlan(e,c,s,{planScope:"personal"}),u.personal=window.AppCalendar.getWorkPlanId(e,s,"personal")):o&&await window.AppCalendar.deleteWorkPlan(e,s,{planScope:"personal"}),f.length>0?(await window.AppCalendar.setWorkPlan(e,f,s,{planScope:"annual"}),u.annual=window.AppCalendar.getWorkPlanId(e,s,"annual")):r&&await window.AppCalendar.deleteWorkPlan(e,s,{planScope:"annual"}),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans();const m=await window.AppDB.getAll("users");if(s!==a.id&&(a.role==="Administrator"||a.isAdmin)){const b=m.find(v=>v.id===s);if(b){b.notifications||(b.notifications=[]);const v=b.notifications[b.notifications.length-1];(!v||v.message!==`Admin ${a.name} has edited your Work Plan for ${e}`)&&(b.notifications.push({type:"admin_edit",message:`Admin ${a.name} has edited your Work Plan for ${e}`,date:new Date().toLocaleString(),read:!1}),await window.AppDB.put("users",b))}}const h=new Set;if(l.forEach(b=>{b.tags&&b.tags.forEach(v=>h.add(v.id))}),h.size>0){for(const b of h){const v=m.find(k=>k.id===b);v&&b!==a.id&&(v.notifications||(v.notifications=[]),l.forEach((k,g)=>{if(k.tags&&k.tags.some(A=>A.id===b)){const A=k.planScope==="annual"?"annual":"personal",S=u[A]||window.AppCalendar.getWorkPlanId(e,s,A);v.notifications.some(L=>L.type==="mention"&&L.planId===S&&L.taskIndex===g)||v.notifications.push({id:`tag_${Date.now()}_${b}_${g}`,type:"tag",title:k.task||"Tagged task",description:k.subPlans&&k.subPlans.length>0?k.subPlans.join(", "):"",taggedById:a.id,taggedByName:a.name,taggedAt:new Date().toISOString(),status:"pending",source:"plan",planId:S,taskIndex:g,message:`${a.name} tagged you in: "${k.task}" for ${e}`,date:new Date().toLocaleString(),read:!1})}}),await window.AppDB.put("users",v))}for(let b=0;b<l.length;b++){const v=l[b];if(v.tags)for(const k of v.tags){if(k.id===s)continue;const g=m.find(I=>I.id===k.id);if(!g||!window.AppCalendar)continue;const A=v.planScope==="annual"?"annual":"personal",S=u[A]||window.AppCalendar.getWorkPlanId(e,s,A),_=v.subPlans&&v.subPlans.length>0?` - ${v.subPlans.join(", ")}`:"",L=`${v.task}${_} (Responsible: ${g.name})`;await window.AppCalendar.addWorkPlanTask(e,g.id,L,[{id:a.id,name:a.name,status:"pending"}],{addedFrom:"tag",sourcePlanId:S,sourceTaskIndex:b,taggedById:a.id,taggedByName:a.name,status:"pending",subPlans:v.subPlans||[],startDate:v.startDate||e,endDate:v.endDate||v.startDate||e})}}}alert("Plans saved successfully!"),document.getElementById("day-plan-modal")?.remove();const y=await U.renderDashboard(),w=document.getElementById("page-content");w&&(w.innerHTML=y,window.setupDashboardEvents&&window.setupDashboardEvents())}catch(m){alert(m.message)}};window.app_handleTagResponse=async(n,e,t,a)=>{const s=window.AppAuth.getUser();try{const i=n?await window.AppDB.get("work_plans",n).catch(()=>null):null;if(!i||!i.plans||!i.plans[e]){console.warn(`app_handleTagResponse: plan/task not found for planId=${n}, taskIdx=${e}. Falling back to notification-only update.`);const c=await window.AppDB.get("users",s.id).catch(()=>null),f=c?.notifications?.[a]?.id||null;if(f||a>=0)await window.app_handleTagDecision(f||String(a),t);else{if(c?.notifications?.[a]){const p=new Date().toISOString();c.notifications[a].status=t,c.notifications[a].respondedAt=p,c.notifications[a].read=!0,c.notifications[a].dismissedAt=p,await window.AppDB.put("users",c)}const u=document.getElementById("page-content");u&&(u.innerHTML=await U.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),alert(`You have ${t} the request.`)}return}const o=i.plans[e];if(o.tags){const c=o.tags.find(f=>f.id===s.id);c&&(c.status=t)}await window.AppDB.put("work_plans",i);const r=await window.AppDB.get("users",s.id);let d="";if(t==="rejected"&&(d=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Task",confirmText:"Submit Reason"})||""),r&&r.notifications){const c=r.notifications[a];if(c){const f=new Date().toISOString();c.status=t,c.respondedAt=f,c.read=!0,c.dismissedAt=f,d&&(c.rejectReason=d)}r.tagHistory||(r.tagHistory=[]),r.tagHistory.unshift({id:`taghist_${Date.now()}`,type:"tag_response",title:c?.title||i.plans[e].task||"Tagged task",taggedByName:c?.taggedByName||i.userName||"Staff",status:t,reason:d,date:new Date().toISOString()}),await window.AppDB.put("users",r)}if(i.userId){const c=await window.AppDB.get("users",i.userId);c&&(c.notifications||(c.notifications=[]),c.notifications.unshift({id:`tagresp_${Date.now()}`,type:"tag_response",message:`${s.name} ${t} your tag request.`,title:i.plans[e].task,taggedByName:s.name,status:t,reason:d,date:new Date().toISOString(),read:!1}),await window.AppDB.put("users",c))}window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans();const l=document.getElementById("page-content");l&&(l.innerHTML=await U.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),alert(`You have ${t} the collaboration request.`)}catch(i){console.error("app_handleTagResponse error:",i),alert("Error processing your response. Please try again.")}};window.app_changeCalMonth=n=>{let e=window.app_calMonth+n;e<0&&(window.app_calYear--,e=11),e>11&&(window.app_calYear++,e=0),window.app_calMonth=e,U.renderDashboard().then(async t=>{const a=document.getElementById("page-content");a.innerHTML=t,fe()})};window.app_exportCalendar=async()=>{const n=window._currentPlans,e=window.app_calMonth,t=window.app_calYear;if(!n){alert("Calendar data not loaded yet.");return}try{await window.AppReports.exportCalendarPlansCSV(n,e,t)}catch(a){alert("Export failed: "+a.message)}};window.app_newMeeting=async()=>{const n=window.AppAuth.getUser(),e={id:"meeting_"+Date.now(),title:"",date:new Date().toISOString().split("T")[0],minutes:"",author:n.name,timestamp:new Date().toISOString()};await window.AppDB.put("meetings",e),window._selectedMeetingId=e.id;const t=document.getElementById("page-content");t.innerHTML=await U.renderMinutes()};window.app_selectMeeting=async n=>{window._selectedMeetingId=n;const e=document.getElementById("page-content");e.innerHTML=await U.renderMinutes()};window.app_saveMeeting=async()=>{const n=document.getElementById("meeting-title")?.value,e=document.getElementById("meeting-date")?.value,t=document.getElementById("meeting-minutes")?.value;if(!window._selectedMeetingId){alert("No meeting selected");return}const a=await window.AppDB.get("meetings",window._selectedMeetingId);if(!a){alert("Meeting not found");return}a.title=n,a.date=e,a.minutes=t,a.timestamp=new Date().toISOString(),await window.AppDB.put("meetings",a);const s=document.getElementById("page-content");s.innerHTML=await U.renderMinutes(),alert("Meeting minutes saved successfully!")};window.app_deleteMeeting=async n=>{if(!await window.appConfirm("Are you sure you want to delete this meeting?"))return;await window.AppDB.delete("meetings",n),window._selectedMeetingId=null;const e=document.getElementById("page-content");e.innerHTML=await U.renderMinutes()};window.app_postponeTask=async(n,e,t)=>{if(t)try{const a=window.AppAuth.getUser();await window.AppCalendar.updateTaskStatus(n,e,"postponed");const s=await window.AppDB.get("work_plans",n),i=s?.plans?.[e],o=i&&i.subPlans&&i.subPlans.length?` - ${i.subPlans.join(", ")}`:"",r=i?`${i.task}${o}`:"",d=s?.date||new Date().toISOString().split("T")[0],c=`${r.replace(/\s*\(Postponed from [^)]+\)\s*$/i,"")} (Postponed from ${d})`;await window.AppCalendar.addWorkPlanTask(t,a.id,c,[],{addedFrom:"postponed",sourcePlanId:n,sourceTaskIndex:e,postponedFromDate:d}),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert(`Task postponed to ${t}`),typeof De=="function"&&await De()}catch(a){alert("Failed to postpone task: "+a.message)}};window.app_openPostponeModal=function(n,e){const t="postpone-task-modal";document.getElementById(t)?.remove();const a=new Date(Date.now()+864e5).toISOString().split("T")[0],s=`
            <div class="modal-overlay" id="${t}" style="display:flex;">
                <div class="modal-content" style="max-width:420px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                        <h3 style="margin:0; font-size:1.05rem;">Postpone Task</h3>
                        <button type="button" onclick="document.getElementById('${t}')?.remove()" style="background:none; border:none; font-size:1.1rem; cursor:pointer;">&times;</button>
                    </div>
                    <label for="postpone-date-input" style="display:block; margin-bottom:0.35rem; font-size:0.85rem; color:#475569; font-weight:600;">Select date</label>
                    <input id="postpone-date-input" type="date" value="${a}" style="width:100%; padding:0.6rem; border:1px solid #d1d5db; border-radius:8px;">
                    <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
                        <button type="button" class="action-btn secondary" onclick="document.getElementById('${t}')?.remove()" style="padding:0.55rem 0.9rem;">Cancel</button>
                        <button type="button" class="action-btn" onclick="window.app_confirmPostponeTask('${n}', ${e})" style="padding:0.55rem 0.9rem;">Confirm</button>
                    </div>
                </div>
            </div>`;window.app_showModal(s,t)};window.app_confirmPostponeTask=async function(n,e){const t=document.getElementById("postpone-date-input")?.value;if(!t)return alert("Please select a date.");document.getElementById("postpone-task-modal")?.remove(),await window.app_postponeTask(n,e,t)};window.app_openDelegateModal=async function(n,e){const t="delegate-task-modal";document.getElementById(t)?.remove();const a=await window.AppDB.getAll("users").catch(()=>[]),s=window.AppAuth.getUser(),i=(a||[]).filter(d=>d.id!==s.id);window.app_delegateModalContext={planId:n,taskIndex:e,selectedUserId:""};const o=i.map(d=>`
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
            </div>`;window.app_showModal(r,t)};window.app_filterDelegateUsers=function(n){const e=String(n||"").toLowerCase().trim();Array.from(document.querySelectorAll("#delegate-picker-list .delegate-picker-item")).forEach(t=>{const a=t.getAttribute("data-name")||"";t.style.display=!e||a.includes(e)?"flex":"none"})};window.app_selectDelegateUser=function(n){if(!window.app_delegateModalContext)return;window.app_delegateModalContext.selectedUserId=n,Array.from(document.querySelectorAll("#delegate-picker-list .delegate-picker-item")).forEach(t=>{t.classList.toggle("selected",t.getAttribute("data-user-id")===n)});const e=document.getElementById("delegate-confirm-btn");e&&(e.disabled=!n)};window.app_confirmDelegateTask=async function(){const n=window.app_delegateModalContext;if(!n||!n.selectedUserId)return alert("Please select a staff member.");document.getElementById("delegate-task-modal")?.remove(),await window.app_delegateTo(n.planId,n.taskIndex,n.selectedUserId)};window.app_formatTaskWithPostponeChip=function(n){const e=String(n||""),t=e.match(/^(.*)\s+\(Postponed from ([^)]+)\)\s*$/i);if(!t)return e;const a=t[1].trim(),s=t[2].trim();return`${a} <span class="postponed-source-chip">Postponed from ${s}</span>`};window.app_appendCompletedTaskToSummary=async function(n,e){const a=(await window.AppDB.get("work_plans",n))?.plans?.[e];if(!a)return;const s=a.subPlans&&a.subPlans.length?` (${a.subPlans.join(", ")})`:"",i=`- ${a.task}${s}`,o=document.getElementById("checkout-work-summary"),r=(o?.value||window.app_checkoutSummaryDraft||"").trim(),l=r.split(`
`).some(c=>c.trim()===i.trim())?r:r?`${r}
${i}`:i;window.app_checkoutSummaryDraft=l,o&&(o.value=l,window.app_updateCharCounter&&window.app_updateCharCounter(o))};window.app_handleChecklistAction=async function(n,e,t){const a=document.getElementById("checkout-task-checklist"),s=document.getElementById("delegate-panel");window.app_checkoutTaskActions=window.app_checkoutTaskActions||{};const i=`${n}:${e}`;if(!t){delete window.app_checkoutTaskActions[i],window.app_checkoutTaskDetails&&delete window.app_checkoutTaskDetails[i],s&&(s.style.display="none"),a&&a.classList.remove("delegate-open");const d=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Se(i)}"]`);d&&d.remove();const l=document.querySelector(`.checkout-task-detail-btn[data-checkout-detail-key="${Se(i)}"]`);l&&(l.disabled=!0),window.app_renderCheckoutActionPreview();return}window.app_checkoutTaskActions[i]=t,window.app_checkoutTaskDetails=window.app_checkoutTaskDetails||{};const o=window.app_checkoutTaskDetails[i]||{action:"",progressPercent:0,progressStatus:"waiting",progressNote:"",actionMeta:{}};o.action=t,t==="complete"&&(o.progressPercent=100,o.progressStatus="done",await window.app_appendCompletedTaskToSummary(n,e)),t==="postpone"&&(o.actionMeta?.postponeDate||(o.actionMeta=o.actionMeta||{},o.actionMeta.postponeDate=new Date(Date.now()+864e5).toISOString().split("T")[0])),window.app_checkoutTaskDetails[i]=o,s&&(s.style.display="none"),a&&a.classList.remove("delegate-open");const r=document.querySelector(`.checkout-task-detail-btn[data-checkout-detail-key="${Se(i)}"]`);r&&(r.disabled=!1),window.app_openCheckoutActionModal(i),window.app_clearCheckoutTaskError(i),window.app_renderCheckoutActionPreview()};window.app_markTaskCompleted=async function(n,e){try{const t=new Date().toISOString().split("T")[0];await window.AppCalendar.updateTaskStatus(n,e,"completed",t),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert("Task marked as completed."),typeof De=="function"&&await De()}catch(t){alert("Failed to mark completed: "+t.message)}};window.app_delegateTask=async function(n,e){try{const t=await window.AppDB.getAll("users"),a=t.map(o=>o.name).join(", "),s=await window.appPrompt(`Delegate to which staff? Enter name.
Available: ${a}`,"",{title:"Delegate Task",placeholder:"Type staff name"});if(!s)return;const i=t.find(o=>o.name.toLowerCase()===s.toLowerCase());if(!i){alert("Staff not found.");return}await window.app_delegateTo(n,e,i.id)}catch(t){alert("Failed to delegate task: "+t.message)}};window.app_delegateTo=async function(n,e,t){try{const a=await window.AppDB.get("work_plans",n);if(!a||!a.plans||!a.plans[e]){alert("Task not found.");return}const s=window.AppAuth.getUser(),i=a.plans[e],o=i.subPlans&&i.subPlans.length?` — ${i.subPlans.join(", ")}`:"",r=`${i.task}${o}`;i.tags||(i.tags=[]);const l=(await window.AppDB.getAll("users")).find(f=>f.id===t);if(!l){alert("Staff not found.");return}i.tags.some(f=>f.id===l.id)||i.tags.push({id:l.id,name:l.name,status:"pending"}),i.status=i.status||"pending",a.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",a),await window.AppCalendar.addWorkPlanTask(a.date,l.id,r,[{id:s.id,name:s.name,status:"pending"}],{addedFrom:"delegated",sourcePlanId:n,sourceTaskIndex:e,taggedById:s.id,taggedByName:s.name,status:"pending",subPlans:i.subPlans||[]});const c=await window.AppDB.get("users",l.id);c&&(c.notifications||(c.notifications=[]),c.notifications.unshift({id:`task_${Date.now()}`,type:"task",title:i.task||"Delegated task",description:i.subPlans&&i.subPlans.length>0?i.subPlans.join(", "):"",taggedById:s.id,taggedByName:s.name,taggedAt:new Date().toISOString(),status:"pending",source:"delegation",date:new Date().toLocaleString(),read:!1}),await window.AppDB.put("users",c)),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert(`Task delegated to ${l.name}.`),typeof De=="function"&&await De()}catch(a){alert("Failed to delegate task: "+a.message)}};function Fa(n,e,t,a){if(!n||!e||!t||!a)return 0;const s=6371e3,i=n*Math.PI/180,o=t*Math.PI/180,r=(t-n)*Math.PI/180,d=(a-e)*Math.PI/180,l=Math.sin(r/2)*Math.sin(r/2)+Math.cos(i)*Math.cos(o)*Math.sin(d/2)*Math.sin(d/2),c=2*Math.atan2(Math.sqrt(l),Math.sqrt(1-l));return s*c}const qa=480*60*1e3,$s=540*60*1e3,na=(n,e)=>{if(!n||!e)return null;const t=String(n).trim(),a=String(e).trim();if(!t||!a||a.toLowerCase().includes("active now"))return null;const s=new Date(`${t}T${a}`);if(!Number.isNaN(s.getTime()))return s;const i=new Date(`${t} ${a}`);return Number.isNaN(i.getTime())?null:i},_s=async(n,e,t)=>{if(!n||!window.AppDB||t<=e)return!1;const a=await window.AppDB.getAll("attendance"),s=String(n);return(a||[]).some(i=>{if(!i||String(i.user_id||"")!==s||!i.isManualOverride)return!1;const o=na(i.date,i.checkIn),r=na(i.date,i.checkOut);if(!o||!r)return!1;let d=o.getTime(),l=r.getTime();l<=d&&(l+=1440*60*1e3);const c=Math.max(e,d);return Math.min(t,l)>c})},xs=async n=>{const e={showPrompt:!1,hasManualLog:!1,overtimeStartMs:null,overtimeEndMs:null};if(!n||!n.lastCheckIn)return e;const t=Number(n.lastCheckIn);if(!Number.isFinite(t))return e;const a=Date.now();if(a-t<=$s)return e;const i=t+qa;return await _s(n.id,i,a)?{showPrompt:!1,hasManualLog:!0,overtimeStartMs:i,overtimeEndMs:a}:{showPrompt:!0,hasManualLog:!1,overtimeStartMs:i,overtimeEndMs:a}};window.app_prepareCheckoutOvertimeSection=async n=>{const e=document.getElementById("checkout-overtime-section"),t=document.getElementById("checkout-overtime-explanation"),a=document.getElementById("checkout-overtime-mode"),s=document.getElementById("checkout-overtime-hint");if(window.app_checkoutOvertimeState={showPrompt:!1,hasManualLog:!1},!(!e||!t||!a)){e.style.display="none",t.required=!1,t.value="",a.value="overtime_work",document.querySelectorAll(".overtime-reason-btn").forEach(i=>{i.style.background="#fef3c7",i.style.borderColor="#fcd34d",i.style.color="#92400e"});try{const i=await xs(n);if(window.app_checkoutOvertimeState=i,!i.showPrompt)return;s&&(s.textContent="You worked over 1 hour extra. Please capture what was done during overtime."),e.style.display="block",t.required=!0}catch(i){console.warn("Overtime prompt check failed:",i)}}};async function De(){const n=document.getElementById("attendance-btn"),e=document.getElementById("location-text"),{status:t}=await window.AppAttendance.getStatus();n&&(n.disabled=!0),We=!0;try{if(t==="out"){n&&(n.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Locating...');const a=await window.getLocation(),s=`Lat: ${a.lat.toFixed(4)}, Lng: ${a.lng.toFixed(4)}`;e&&(e.innerHTML=`<i class="fa-solid fa-location-dot"></i> ${s}`);const i=await window.AppAttendance.checkIn(a.lat,a.lng,s);if(i&&i.conflict){window.app_showSyncToast(i.message||"Status updated from another device."),window.app_refreshDashboard&&await window.app_refreshDashboard();return}Mt(),window.app_refreshDashboard&&await window.app_refreshDashboard(),i&&i.resolvedMissedCheckout&&i.noticeMessage&&window.app_showAttendanceNotice(i.noticeMessage),i&&i.missedCheckoutReasonRequired&&i.missedCheckoutLogId&&window.app_promptMissedCheckoutReason({logId:i.missedCheckoutLogId,date:i.missedCheckoutDate}),window.AppDayPlan&&typeof window.AppDayPlan.openDayPlan=="function"&&await window.AppDayPlan.openDayPlan(Zt())}else{const a=window.AppAuth.getUser(),s=Zt(),i=await window.AppCalendar.getWorkPlan(a.id,s,{includeAnnual:!0,mergeAnnual:!0}),o=await window.AppCalendar.getCollaborations(a.id,s);window.app_checkoutSummaryDate!==s&&(window.app_checkoutSummaryDate=s,window.app_checkoutSummaryDraft=""),window.app_checkoutActionDate!==s&&(window.app_checkoutActionDate=s,window.app_checkoutTaskActions={},window.app_checkoutTaskDetails={},window.app_checkoutTaskMeta={},window.app_checkoutUserMap={});const r=document.getElementById("modal-container");r&&!document.getElementById("checkout-modal")&&r.insertAdjacentHTML("beforeend",U.renderModals());const d=document.getElementById("checkout-modal");if(d){const l=document.getElementById("checkout-plan-text"),c=d.querySelector('textarea[name="description"]');if(i&&(i.plans||i.plan)){let p="",m="";if(i.plans&&i.plans.length>0?(p=i.plans.map((k,g)=>`<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; padding-bottom:12px; border-bottom:1px dashed #e9d5ff;">
                                    <div style="flex:1;">
                                        <div style="font-weight:600; color:#4c1d95;">${window.app_formatTaskWithPostponeChip(k.task)}</div>
                                        ${k.subPlans&&k.subPlans.length>0?`<div style="font-size:0.75rem; color:#7c3aed; margin-top:2px;">👣 ${k.subPlans.join(", ")}</div>`:""}
                                    </div>
                                    <div style="display:flex; gap:6px; flex-shrink:0;">
                                        ${k.status==="completed"?'<span style="font-size:0.75rem; color:#059669; font-weight:700;">✅ Done</span>':`<button type="button" onclick="window.app_postponeTask('${k._planId||i.id}', ${typeof k._taskIndex=="number"?k._taskIndex:g})" style="background:#f3e8ff; color:#7c3aed; border:1px solid #ddd6fe; border-radius:8px; padding:6px 12px; font-size:0.8rem; font-weight:600; cursor:pointer;" onmouseover="this.style.background='#ddd6fe'" onmouseout="this.style.background='#f3e8ff'">⌛ Postpone</button>`}
                                    </div>
                                </div>`).join(""),m=i.plans.filter(k=>window.AppCalendar.getSmartTaskStatus(i.date,k.status)==="completed").map(k=>{let g=`• ${k.task}`;return k.subPlans&&k.subPlans.length>0&&(g+=` (${k.subPlans.join(", ")})`),g}).join(`
`)):i.plan&&(p=`<div style="font-weight:600; color:#4c1d95;">${i.plan}</div>`,m=`• ${i.plan}`,i.subPlans&&i.subPlans.length>0&&(p+=`<div style="font-size:0.75rem; color:#7c3aed; margin-top:2px;">👣 ${i.subPlans.join(", ")}</div>`,m+=` (${i.subPlans.join(", ")})`)),o&&o.length>0){const v=o.map(k=>k.plans.filter(g=>g.tags&&g.tags.some(A=>A.id===a.id&&A.status==="accepted")).map(g=>{let A=`🤝 [Collaborated with ${k.userName}] ${g.task}`;return g.subPlans&&g.subPlans.length>0&&(A+=`
👣 Steps: `+g.subPlans.join(", ")),A}).join(`
`)).join(`

`);p?p+=`

`+v:p=v}l&&(l.innerHTML=p),l&&(l.dataset.rawText=m),c&&!c.value.trim()&&window.app_checkoutSummaryDraft&&(c.value=window.app_checkoutSummaryDraft,window.app_updateCharCounter&&window.app_updateCharCounter(c));const h=document.getElementById("checkout-task-list"),y=document.getElementById("delegate-panel"),w=document.getElementById("delegate-list"),b=document.getElementById("delegate-selected-task");if(h)if(i&&Array.isArray(i.plans)&&i.plans.length>0){const v=await window.AppDB.getAll("users").catch(()=>[]);window.app_checkoutUserMap={},(v||[]).forEach(S=>{window.app_checkoutUserMap[String(S.id)]=S.name});const k=window.AppAuth.getUser(),g=(v||[]).filter(S=>S.id!==k.id),A=i.plans.map((S,_)=>{const L=S.subPlans&&S.subPlans.length?` — ${S.subPlans.join(", ")}`:"",I=`${S.task}${L}`,O=S._planId||i.id,E=typeof S._taskIndex=="number"?S._taskIndex:_,D=window.AppCalendar.getSmartTaskStatus(S._planDate||i.date,S.status),M=`${O}:${E}`;window.app_checkoutTaskMeta=window.app_checkoutTaskMeta||{},window.app_checkoutTaskMeta[M]={text:I,planId:O,taskIndex:E};const P=(window.app_checkoutTaskActions&&window.app_checkoutTaskActions[M]?window.app_checkoutTaskActions[M]:"")||(S.status==="completed"||D==="completed"?"complete":S.status==="postponed"?"postpone":""),C=window.app_initCheckoutTaskDetails(O,E,S),R=C.action||P||"";R&&C.action!==R&&(C.action=R,R==="complete"&&(C.progressPercent=100,C.progressStatus="done")),window.app_checkoutTaskActions&&R&&(window.app_checkoutTaskActions[M]=R);const H=D==="completed"?"Completed":D==="in-process"?"In Process":D==="overdue"?"Overdue":D==="to-be-started"?"To Be Started":S.status||"Pending",q=V(C.actionMeta?.postponeDate||new Date(Date.now()+864e5).toISOString().split("T")[0]),Y=V(C.actionMeta?.postponeReason||""),T=V(C.actionMeta?.delegateUserId||""),N=V(C.actionMeta?.delegateNote||""),j=V(C.actionMeta?.completionNote||""),K=V(C.progressNote||"");return`
                                        <div class="checkout-task-row">
                                            <div class="checkout-task-copy">
                                                <div class="checkout-task-title">${window.app_formatTaskWithPostponeChip(I)}</div>
                                                <div class="checkout-task-status">Status: ${H}</div>
                                            </div>
                                            <div class="checkout-task-controls">
                                                <select onchange="window.app_handleChecklistAction('${O}', ${E}, this.value)" class="checkout-task-action-select">
                                                    <option value="" ${R?"":"selected"}>Choose Action</option>
                                                    <option value="complete" ${R==="complete"?"selected":""}>Complete</option>
                                                    <option value="postpone" ${R==="postpone"?"selected":""}>Postpone</option>
                                                    <option value="delegate" ${R==="delegate"?"selected":""}>Delegate</option>
                                                </select>
                                                <button type="button" class="checkout-task-detail-btn" data-checkout-detail-key="${V(M)}" onclick="window.app_openCheckoutActionModal('${le(M)}')" ${R?"":"disabled"}>Action Details</button>
                                            </div>
                                        </div>`}).join("");if(h.innerHTML=A,window.app_renderCheckoutActionPreview(),y&&w&&b){y.style.display="none";const S=document.getElementById("checkout-task-checklist");S&&S.classList.remove("delegate-open"),w.innerHTML=g.map(_=>`
                                        <button type="button" data-user-id="${_.id}" class="delegate-user-btn">
                                            <img src="${_.avatar}" alt="${_.name}" class="delegate-user-avatar">
                                            <span style="flex:1;">${_.name}</span>
                                        </button>
                                    `).join("")}}else h.innerHTML='<div style="font-size:0.8rem; color:#6b7280;">No tasks planned for today.</div>',window.app_renderCheckoutActionPreview()}await window.app_prepareCheckoutOvertimeSection(a),d.style.display="flex",n&&(n.disabled=!1);const f=document.getElementById("checkout-location-mismatch"),u=document.getElementById("checkout-location-loading");u&&(u.style.display="block"),f&&(f.style.display="none"),(async()=>{try{const p=await window.getLocation(),m=a.currentLocation||a.lastLocation;u&&(u.style.display="none"),m&&m.lat&&m.lng&&(Fa(p.lat,p.lng,m.lat,m.lng)>500?f&&(f.style.display="block"):f&&(f.style.display="none"))}catch(p){console.warn("Background location check failed:",p),u&&(u.style.display="none")}})()}else{const l=await window.AppAttendance.checkOut();l&&!l.conflict&&Mt(),l&&l.conflict&&window.app_showSyncToast(l.message||"Status updated from another device.");const c=document.getElementById("page-content");c.innerHTML=await U.renderDashboard(),fe()}}}catch(a){alert(a.message||a),n&&(n.disabled=!1,n.innerHTML=t==="out"?'Check-in <i class="fa-solid fa-fingerprint"></i>':'Check-out <i class="fa-solid fa-fingerprint"></i>')}finally{We=!1}}window.app_submitCheckOut=async function(n){n.preventDefault();const e=n.target,t=e.description.value,a=e.querySelector('button[type="submit"]');We=!0;try{a.disabled=!0,a.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Locating & Saving...',Object.keys(window.app_checkoutTaskDetails||{}).forEach(k=>window.app_clearCheckoutTaskError(k));const{updates:i,errors:o}=window.app_collectCheckoutTaskUpdates();if(o.length>0){o.forEach(g=>window.app_setCheckoutTaskError(g.key,g.message));const k=o[0]?.key;if(k){const g=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Se(k)}"]`);g&&g.scrollIntoView({behavior:"smooth",block:"center"})}a.disabled=!1,a.textContent="Complete Check-Out";return}let r=null,d=null;try{r=await window.getLocation()}catch(k){d=k}let l=!1;const c=window.AppAuth.getUser()?.currentLocation;r&&(r=Te&&Date.now()-Oe<Ea?Te:r,c&&c.lat&&c.lng&&r.lat&&r.lng&&Fa(r.lat,r.lng,c.lat,c.lng)>500&&(l=!0));const f=e.locationExplanation?e.locationExplanation.value.trim():"",u=window.app_checkoutOvertimeState||{},p=e.overtimeExplanation?e.overtimeExplanation.value.trim():"",m=e.overtimeMode?String(e.overtimeMode.value||"overtime_work"):"overtime_work",h={};if(u.showPrompt){if(!p){alert("Please describe the overtime work before checkout."),a.disabled=!1,a.textContent="Complete Check-Out";return}if(h.overtimePrompted=!0,h.overtimeExplanation=p,h.overtimeReasonTag=m,m==="forgot_checkout"){const k=Number(window.AppAuth.getUser()?.lastCheckIn);Number.isFinite(k)&&(h.checkOutTime=new Date(k+qa).toISOString(),h.overtimeCappedToEightHours=!0)}}if(i.length>0&&(h.taskUpdates=i.map(k=>({planId:k.planId,taskIndex:k.taskIndex,action:k.action,progressPercent:k.progressPercent,progressStatus:k.progressStatus,progressNote:k.progressNote,actionMeta:k.actionMeta||{},timestamp:k.timestamp}))),!r&&!f){const k=document.getElementById("checkout-location-mismatch");k&&(k.style.display="block"),alert("Location unavailable. Please provide a reason for checking out from a different location."),a.disabled=!1,a.textContent="Complete Check-Out";return}const y=r?`Lat: ${Number(r.lat).toFixed(4)}, Lng: ${Number(r.lng).toFixed(4)}`:"Location unavailable (reason provided)",w=e.tomorrowGoal?e.tomorrowGoal.value.trim():"";if(w){const k=new Date(Date.now()+864e5).toISOString().split("T")[0];await window.AppCalendar.addWorkPlanTask(k,window.AppAuth.getUser().id,w),console.log("Tomorrow's goal saved:",w)}const b=await window.AppAttendance.checkOut(t,r?r.lat:null,r?r.lng:null,y,l||!r,f||(d?String(d):""),h);if(b&&b.conflict){const k=document.getElementById("checkout-modal");k&&(k.style.display="none"),window.app_showSyncToast(b.message||"Status updated from another device.");const g=document.getElementById("page-content");g&&(g.innerHTML=await U.renderDashboard(),fe());return}Mt(),i.length>0&&await window.app_applyCheckoutTaskUpdates(i),window.app_checkoutSummaryDraft="",window.app_checkoutTaskActions={},window.app_checkoutTaskDetails={},window.app_checkoutTaskMeta={},window.app_checkoutUserMap={},window.app_renderCheckoutActionPreview(),document.getElementById("checkout-modal").style.display="none";const v=document.getElementById("page-content");v&&(v.innerHTML=await U.renderDashboard(),fe())}catch(s){alert("Check-out failed: "+s.message),a.disabled=!1,a.textContent="Complete Check-Out"}finally{We=!1}};async function Ts(n){n.preventDefault();const e=new FormData(n.target),t=Ft(e.get("checkIn"),e.get("checkOut"));if(t==="Invalid"){alert("End time must be after Start time");return}const a=e.get("date"),s=e.get("checkIn"),i=e.get("checkOut"),o=window.AppAttendance.buildDateTime(a,s),r=window.AppAttendance.buildDateTime(a,i),d=o&&r?r-o:0,l=Math.max(0,d)/(1e3*60*60),c=l>=4;let f="Work Log",u=0;l>=8?(f="Present",u=1):l>=4&&(f="Half Day",u=.5);const p={date:e.get("date"),checkIn:s,checkOut:i,duration:t,durationMs:d,location:e.get("location"),workDescription:e.get("location"),type:f,dayCredit:u,lateCountable:!1,extraWorkedMs:0,policyVersion:"v2",entrySource:"staff_manual_work",attendanceEligible:c,isManualOverride:!1};await window.AppAttendance.addManualLog(p),alert("Log added successfully!"),document.getElementById("log-modal").style.display="none",Z.innerHTML=await U.renderTimesheet()}async function Is(n){n.preventDefault();const e=new FormData(n.target),t=e.get("name").trim(),a=e.get("username").trim(),s=e.get("password").trim(),i=e.get("email").trim(),o=e.get("isAdmin")==="on"||e.get("isAdmin")==="true",r=e.get("canManageAttendanceSheet")==="on"||e.get("canManageAttendanceSheet")==="true",d={id:"u"+Date.now(),name:t,username:a,password:s,role:e.get("role"),dept:e.get("dept"),email:i,phone:e.get("phone"),joinDate:e.get("joinDate"),isAdmin:o,canManageAttendanceSheet:r,permissions:window.app_getPermissionsFromUI("add"),avatar:`https://ui-avatars.com/api/?name=${e.get("name")}&background=random&color=fff`,status:"out",lastCheckIn:null};try{d.isAdmin?(d.role="Administrator",d.canManageAttendanceSheet=!0):d.isAdmin=!1,await window.AppDB.add("users",d),alert("Success! Account created."),document.getElementById("add-user-modal").style.display="none";const l=document.getElementById("page-content");l&&(l.innerHTML=await U.renderAdmin())}catch(l){alert("Error creating user: "+l.message)}}window.app_getPermissionsFromUI=n=>{const e={};return["dashboard","leaves","users","attendance","reports","minutes","policies"].forEach(a=>{const s=document.getElementById(`${n}-perm-${a}-view`),i=document.getElementById(`${n}-perm-${a}-admin`);i&&i.checked?e[a]="admin":s&&s.checked?e[a]="view":e[a]=null}),e};window.app_submitEditUser=async n=>{n&&n.preventDefault();const e=n&&n.target&&n.target.tagName==="FORM"?n.target:document.getElementById("edit-user-form");if(!e){console.error("Critical Failure: Edit user form not found."),alert("Error: Form missing.");return}const t=new FormData(e),a=(t.get("id")||"").trim();if(!a){console.error("Data Failure: No 'id' name attribute found in form data.",{target:n.target,allData:Object.fromEntries(t.entries())}),alert("Error: User ID missing. Please refresh.");return}const s=e.querySelector('[name="isAdmin"]'),i=!!(s&&s.checked),o=e.querySelector('[name="canManageAttendanceSheet"]'),r=!!(o&&o.checked),d=String(t.get("pan")||"").trim().toUpperCase(),l=String(t.get("bankIfsc")||"").trim().toUpperCase(),c=String(t.get("joinDate")||"").trim(),f=String(t.get("employeeId")||"").trim(),u=/^[A-Z]{5}[0-9]{4}[A-Z]$/,p=/^[A-Z]{4}0[A-Z0-9]{6}$/;if(c){const y=new Date,w=`${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,"0")}-${String(y.getDate()).padStart(2,"0")}`;if(c>w){alert("Join Date cannot be in the future.");return}}if(d&&!u.test(d)){alert("Invalid PAN format. Use format like ABCDE1234F");return}if(l&&!p.test(l)){alert("Invalid IFSC format. Use format like SBIN0001234");return}const m=c?f||gt(c,a):"NA",h={id:a,name:(t.get("name")||"").trim(),username:(t.get("username")||"").trim(),password:(t.get("password")||"").trim(),role:t.get("role"),dept:t.get("dept"),email:(t.get("email")||"").trim(),phone:(t.get("phone")||"").trim(),isAdmin:i,canManageAttendanceSheet:r,employeeId:m,joinDate:c||null,baseSalary:Number(t.get("baseSalary")||0),otherAllowances:Number(t.get("otherAllowances")||0),providentFund:Number(t.get("providentFund")||0),professionalTax:Number(t.get("professionalTax")||0),loanAdvance:Number(t.get("loanAdvance")||0),tdsPercent:Number(t.get("tdsPercent")||0),bankName:(t.get("bankName")||"").trim(),bankAccount:(t.get("bankAccount")||"").trim(),bankIfsc:l,pan:d,uan:(t.get("uan")||"").trim(),permissions:window.app_getPermissionsFromUI("edit")};console.log("Executing Update for User:",h),h.isAdmin&&(h.canManageAttendanceSheet=!0,h.role="Administrator");try{if(await window.AppAuth.updateUser(h)){console.log("Success: User updated in DB."),alert(`SUCCESS: Details for '${h.name}' have been saved.`),document.getElementById("edit-user-modal").style.display="none";const w=document.getElementById("page-content");w&&setTimeout(async()=>{w.innerHTML=await U.renderAdmin(),window.AppAnalytics&&await window.AppAnalytics.initAdminCharts()},50)}else alert("Update failed: User not found.")}catch(y){console.error("Update Error:",y),alert("Error: "+y.message)}};function Ft(n,e){const[t,a]=n.split(":"),[s,i]=e.split(":"),o=parseInt(s)*60+parseInt(i)-(parseInt(t)*60+parseInt(a));if(o<0)return"Invalid";const r=Math.floor(o/60),d=o%60;return`${r}h ${d}m`}function fe(){const n=document.getElementById("attendance-btn"),e=!!window.app_dashboardReadOnly,t=window.app_dashboardTargetUser||null;n&&!e&&n.addEventListener("click",De),vs(t,e),Ye(),window.app_refreshNotificationBell&&window.app_refreshNotificationBell().catch(()=>{}),window.app_attachStatsCardHandlers&&window.app_attachStatsCardHandlers()}window.setupDashboardEvents=fe;document.addEventListener("submit",n=>{n.preventDefault();const e=n.target.getAttribute("id");console.log("Submit Event Intercepted. Form ID:",e),e==="manual-log-form"?Ts(n):e==="checkout-form"?window.app_submitCheckOut(n):e==="add-user-form"?Is(n):e==="login-form"?(async()=>{const t=new FormData(n.target);try{const a=await window.getLocation();if(!await window.AppAuth.login(t.get("username"),t.get("password"))){alert("Invalid Credentials");return}const i=window.AppAuth.getUser();i&&(i.lastLoginLocation={lat:a.lat,lng:a.lng,capturedAt:Date.now()},await window.AppDB.put("users",i)),window.location.reload()}catch(a){const s=String(a);s.includes("permission-denied")||s.includes("FirebaseError")?alert(`Database Error: ${s}

Access to the database was blocked. Please check your Firebase Firestore Security Rules.`):alert(`Login blocked: ${s}

Please enable location and try again.`)}})():e==="edit-user-form"?(console.log("Routing to app_submitEditUser..."),window.app_submitEditUser(n)):e==="notify-form"?Es(n):e==="leave-request-form"?Ls(n):console.warn("Unhandled form submission ID:",e,"Target:",n.target)});async function Ls(n){const e=new FormData(n.target),t=window.AppAuth.getUser(),a=e.get("startDate");let s=e.get("endDate");const i=e.get("type");i==="Half Day"&&(s=a),await window.AppLeaves.requestLeave({userId:t.id,userName:t.name,startDate:a,endDate:s,startTime:e.get("startTime")||"",endTime:e.get("endTime")||"",type:i,reason:e.get("reason"),durationHours:e.get("durationHours")||""}),alert("Leave requested successfully!"),document.getElementById("leave-modal").style.display="none",n.target.reset()}async function Es(n){n.preventDefault();const e=new FormData(n.target),t=e.get("toUserId"),a=e.get("reminderMessage")||"",s=e.get("reminderLink")||"",i=e.get("taskTitle")||"",o=e.get("taskDescription")||"",r=e.get("taskDueDate")||"";try{if(!a.trim()&&!i.trim()){alert("Please enter a reminder or a task.");return}const d=await window.AppDB.get("users",t);if(!d)throw new Error("User not found");const l=window.AppAuth.getUser(),c=new Date().toISOString();d.notifications||(d.notifications=[]),a.trim()&&(d.notifications.unshift({id:`rem_${Date.now()}`,type:"reminder",message:a.trim(),taggedById:l.id,taggedByName:l.name,taggedAt:c,status:"pending",date:c,read:!1}),await window.AppDB.add("staff_messages",{id:`msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"text",message:a.trim(),link:s.trim(),fromId:l.id,fromName:l.name,toId:t,toName:d.name,createdAt:c,read:!1})),i.trim()&&(d.notifications.unshift({id:`task_${Date.now()}`,type:"task",title:i.trim(),description:o.trim(),taggedById:l.id,taggedByName:l.name,taggedAt:c,status:"pending",dueDate:r||"",date:c,read:!1}),await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:i.trim(),description:o.trim(),dueDate:r||"",status:"pending",fromId:l.id,fromName:l.name,toId:t,toName:d.name,createdAt:c,read:!1,history:[{action:"created",byId:l.id,byName:l.name,at:c}]})),await window.AppAuth.updateUser(d),alert("Notification sent!"),document.getElementById("notify-modal").style.display="none",window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()}catch(d){alert("Failed to send: "+d.message)}}window.app_openStaffThread=async n=>{window.app_staffThreadId=n;const e=window.AppAuth.getUser();if(!e)return;const a=(await window.app_getMyMessages()).filter(i=>i.toId===e.id&&i.fromId===n&&!i.read);for(const i of a)i.read=!0,i.readAt=new Date().toISOString(),await window.AppDB.put("staff_messages",i);const s=document.getElementById("page-content");s&&(s.innerHTML=await U.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_sendStaffText=async n=>{n.preventDefault();const e=window.AppAuth.getUser(),t=new FormData(n.target),a=t.get("toUserId"),s=(t.get("message")||"").trim(),i=(t.get("link")||"").trim();if(!s){alert("Please type a message.");return}const o=await window.AppDB.get("users",a);if(!o){alert("Staff member not found.");return}await window.AppDB.add("staff_messages",{id:`msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"text",message:s,link:i,fromId:e.id,fromName:e.name,toId:a,toName:o.name,createdAt:new Date().toISOString(),read:!1}),n.target.reset();const r=document.getElementById("staff-message-modal");r&&r.remove();const d=document.getElementById("page-content");d&&(d.innerHTML=await U.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_sendStaffTask=async n=>{n.preventDefault();const e=window.AppAuth.getUser(),t=new FormData(n.target),a=t.get("toUserId"),s=(t.get("taskTitle")||"").trim(),i=(t.get("taskDescription")||"").trim(),o=(t.get("taskDueDate")||"").trim();if(!s){alert("Please provide a task title.");return}const r=await window.AppDB.get("users",a);if(!r){alert("Staff member not found.");return}await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:s,description:i,dueDate:o,status:"pending",fromId:e.id,fromName:e.name,toId:a,toName:r.name,createdAt:new Date().toISOString(),read:!1,history:[{action:"created",byId:e.id,byName:e.name,at:new Date().toISOString()}]}),n.target.reset();const d=document.getElementById("staff-task-modal");d&&d.remove();const l=document.getElementById("page-content");l&&(l.innerHTML=await U.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_openStaffMessageModal=(n,e)=>{if(!n){alert("Select a staff member first.");return}const a=`
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
                        <input type="hidden" name="toUserId" value="${n}">
                        <textarea name="message" rows="4" placeholder="Type a message... (text + links only)" required></textarea>
                        <input type="url" name="link" placeholder="Optional link (https://...)">
                        <button type="submit" class="action-btn">Send Message</button>
                    </form>
                </div>
            </div>
        `;window.app_showModal(a,"staff-message-modal")};window.app_openStaffTaskModal=(n,e)=>{if(!n){alert("Select a staff member first.");return}const a=`
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
                        <input type="hidden" name="toUserId" value="${n}">
                        <input type="text" name="taskTitle" placeholder="Task title" required>
                        <textarea name="taskDescription" rows="3" placeholder="Task details"></textarea>
                        <input type="date" name="taskDueDate">
                        <button type="submit" class="action-btn">Send Task</button>
                    </form>
                </div>
            </div>
        `;window.app_showModal(a,"staff-task-modal")};window.app_respondStaffTask=async(n,e)=>{const t=window.AppAuth.getUser(),a=await window.AppDB.get("staff_messages",n);if(!a){alert("Task not found.");return}if(a.toId!==t.id){alert("Only the recipient can approve or reject this task.");return}let s="";if(e==="rejected"&&(s=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Task",confirmText:"Submit Reason"})||""),a.status=e,a.respondedAt=new Date().toISOString(),s&&(a.rejectReason=s),a.history||(a.history=[]),a.history.unshift({action:e,byId:t.id,byName:t.name,at:a.respondedAt,reason:s}),e==="approved"&&!a.calendarSynced){const r=a.dueDate||new Date().toISOString().split("T")[0],d=a.toName||t.name,l=`${a.title}${a.description?` - ${a.description}`:""}`;window.AppCalendar&&(await window.AppCalendar.addWorkPlanTask(r,a.toId,`${l} (Responsible: ${d})`,[],{addedFrom:"staff",sourcePlanId:a.id,sourceTaskIndex:0,taggedById:a.fromId,taggedByName:a.fromName,status:"pending"}),await window.AppCalendar.addWorkPlanTask(r,a.fromId,`${l} (Assigned to ${d})`,[],{addedFrom:"staff",sourcePlanId:a.id,sourceTaskIndex:1,taggedById:a.fromId,taggedByName:a.fromName,status:"pending"}),a.calendarSynced=!0)}await window.AppDB.put("staff_messages",a);const i=await window.AppDB.get("users",a.fromId);i&&(i.notifications||(i.notifications=[]),i.notifications.unshift({id:`taskresp_${Date.now()}`,type:"task_response",message:`${t.name} ${e} a task.`,title:a.title,taggedByName:t.name,status:e,reason:s,date:a.respondedAt,read:!1}),await window.AppDB.put("users",i));const o=document.getElementById("page-content");o&&(o.innerHTML=await U.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_updateStaffNavIndicator=async()=>{const n=window.AppAuth.getUser();if(!n)return;const e=document.querySelectorAll('[data-page="staff-directory"]');if(!e.length)return;const a=(await window.app_getMyMessages()).some(s=>s.toId===n.id&&!s.read);e.forEach(s=>{a?s.classList.add("has-new-msg"):s.classList.remove("has-new-msg")})};window.app_handleTagDecision=async(n,e)=>{const t=window.AppAuth.getUser();try{const a=await window.AppDB.get("users",t.id);if(!a||!a.notifications)throw new Error("Notification not found");const s=a.notifications.find(d=>d.id===n);if(!s)throw new Error("Notification not found");let i="";e==="rejected"&&(i=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Item",confirmText:"Submit Reason"})||"");const o=new Date().toISOString();if(s.status=e,s.respondedAt=o,s.read=!0,s.dismissedAt=o,i&&(s.rejectReason=i),a.tagHistory||(a.tagHistory=[]),a.tagHistory.unshift({id:`taghist_${Date.now()}`,type:"tag_response",title:s.title||s.message||"Tagged item",taggedByName:s.taggedByName||"Staff",status:e,reason:i,date:new Date().toISOString()}),await window.AppDB.put("users",a),s.taggedById){const d=await window.AppDB.get("users",s.taggedById);d&&(d.notifications||(d.notifications=[]),d.notifications.unshift({id:`tagresp_${Date.now()}`,type:"tag_response",message:`${t.name} ${e} your ${s.type||"tag"}.`,title:s.title||"",taggedByName:t.name,status:e,reason:i,date:new Date().toISOString(),read:!1}),await window.AppDB.put("users",d))}const r=document.getElementById("page-content");r&&(r.innerHTML=await U.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents())}catch(a){alert("Failed to update tag: "+a.message)}};document.addEventListener("auth-logout",()=>window.AppAuth.logout());window.app_reviewMinuteAccessFromNotification=async(n,e,t)=>{try{const a=window.AppAuth.getUser();if(!(a&&(a.isAdmin||a.role==="Administrator"))){alert("Only admin can review access requests.");return}const i=await window.AppDB.get("users",a.id);if(!i||!Array.isArray(i.notifications)){alert("Notification not found.");return}let o=null;if(typeof n=="number"&&i.notifications[n]&&(o=i.notifications[n]),!o&&e&&(o=i.notifications.find(y=>String(y.id)===String(e))),!o||o.type!=="minute-access-request"){alert("This notification is no longer available.");return}const r=o.minuteId,d=o.taggedById||o.requesterId;if(!r||!d){alert("Invalid access request payload.");return}const l=await window.AppDB.get("minutes",r);if(!l){alert("Minute not found.");return}const c=Array.isArray(l.accessRequests)?l.accessRequests.slice():[];c.findIndex(y=>y.userId===d)<0&&c.push({userId:d,userName:o.taggedByName||"Staff",requestedAt:o.taggedAt||o.date||new Date().toISOString(),status:"pending",reviewedAt:"",reviewedBy:""});const u=c.findIndex(y=>y.userId===d);c[u]={...c[u],status:t,reviewedAt:new Date().toISOString(),reviewedBy:a.name};let p=Array.isArray(l.allowedViewers)?l.allowedViewers.slice():[];t==="approved"?p.includes(d)||p.push(d):p=p.filter(y=>y!==d),await window.AppMinutes.updateMinute(r,{accessRequests:c,allowedViewers:p},t==="approved"?"Admin approved minutes access from notification":"Admin rejected minutes access from notification");const m=await window.AppDB.get("users",d);m&&(m.notifications||(m.notifications=[]),m.notifications.unshift({id:Date.now()+Math.random(),type:"minute-access-reviewed",title:"Minutes Access Update",message:`Your request for "${l.title}" was ${t}.`,minuteId:r,taggedById:a.id,taggedByName:a.name,status:t,taggedAt:new Date().toISOString(),date:new Date().toISOString()}),await window.AppDB.put("users",m));const h=i.notifications.find(y=>String(y.id)===String(o.id));h&&(h.status=t,h.respondedAt=new Date().toISOString(),h.read=!0,await window.AppAuth.updateUser(i)),Z.innerHTML=await U.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}catch(a){alert("Failed to review access request: "+a.message)}};window.app_reviewMissedCheckoutReasonFromNotification=async(n,e,t)=>{try{const a=window.AppAuth.getUser();if(!(a&&(a.isAdmin||a.role==="Administrator"))){alert("Only admin can review missed checkout reasons.");return}const i=await window.AppDB.get("users",a.id);if(!i||!Array.isArray(i.notifications)){alert("Notification not found.");return}let o=null;if(typeof n=="number"&&i.notifications[n]&&(o=i.notifications[n]),!o&&e&&(o=i.notifications.find(m=>String(m.id)===String(e))),!o||o.type!=="missed-checkout-reason"){alert("This notification is no longer available.");return}const r=o.staffId||o.taggedById,d=o.logId;if(!r||!d){alert("Invalid missed checkout payload.");return}let l="";t==="rejected"&&(l=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Reason",confirmText:"Submit Reason"})||"");const c=await window.AppDB.get("attendance",d);c&&await window.AppDB.put("attendance",{...c,missedCheckoutReasonStatus:t,missedCheckoutReviewedBy:a.name,missedCheckoutReviewedAt:new Date().toISOString(),missedCheckoutReviewNote:l||""});const f=new Date().toISOString(),u=i.notifications.find(m=>String(m.id)===String(o.id));u&&(u.status=t,u.respondedAt=f,u.read=!0,await window.AppAuth.updateUser(i));const p=await window.AppDB.get("users",r);if(p){p.notifications||(p.notifications=[]);const m=o.missedCheckoutDate||(c?c.date:"the previous day");p.notifications.unshift({id:`mcr_rev_${Date.now()}`,type:"missed-checkout-reason-reviewed",title:"Missed checkout reason reviewed",message:`Admin ${t} your missed checkout reason for ${m}.`,status:t,date:f,taggedById:a.id,taggedByName:a.name,reviewNote:l||""}),await window.AppDB.put("users",p)}Z.innerHTML=await U.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}catch(a){alert("Failed to review missed checkout reason: "+a.message)}};document.addEventListener("dismiss-notification",async n=>{const e=n.detail,t=typeof e=="object"&&e!==null?e.notifIndex:e,a=typeof e=="object"&&e!==null?String(e.notifId||""):"",s=window.AppAuth.getUser();if(s&&s.notifications&&Number.isInteger(t)&&t>=0){let i=s.notifications[t];if(!i&&a&&(i=s.notifications.find(r=>String(r.id||"")===a)),!i)return;i.read=!0,i.dismissedAt=new Date().toISOString(),await window.AppAuth.updateUser(s),(window.location.hash.slice(1)||"dashboard")==="dashboard"&&(Z.innerHTML=await U.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}else if(s&&s.notifications&&a){const i=s.notifications.find(r=>String(r.id||"")===a);if(!i)return;i.read=!0,i.dismissedAt=new Date().toISOString(),await window.AppAuth.updateUser(s),(window.location.hash.slice(1)||"dashboard")==="dashboard"&&(Z.innerHTML=await U.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}});document.addEventListener("dismiss-tag-history",async n=>{const e=String(n.detail||""),t=window.AppAuth.getUser();if(!e||!t||!Array.isArray(t.tagHistory))return;const a=t.tagHistory.findIndex(s=>String(s.id)===e);a<0||(t.tagHistory.splice(a,1),await window.AppAuth.updateUser(t),Z.innerHTML=await U.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents())});document.addEventListener("open-log-modal",()=>{const n=document.getElementById("log-modal");if(!n)return;const e=new Date,t=s=>s.toString().padStart(2,"0");document.getElementById("log-date").value=e.toISOString().split("T")[0],document.getElementById("log-start-time").value=`${t(e.getHours())}:${t(e.getMinutes())}`;const a=new Date(e.getTime()+36e5);document.getElementById("log-end-time").value=`${t(a.getHours())}:${t(a.getMinutes())}`,n.style.display="flex"});document.addEventListener("set-duration",n=>{const e=n.detail,t=document.getElementById("log-start-time"),a=document.getElementById("log-end-time");if(t.value){const[s,i]=t.value.split(":").map(Number),o=new Date;o.setHours(s,i);const r=new Date(o.getTime()+e*60*1e3),d=l=>l.toString().padStart(2,"0");a.value=`${d(r.getHours())}:${d(r.getMinutes())}`}});window.app_editUser=async n=>{console.log("Opening Edit Modal for ID:",n);const e=await window.AppDB.get("users",n);if(console.log("User Data Found:",e),!e)return;const t=document.getElementById("edit-user-form");if(!t)return;const a=(l,c)=>{const f=t.querySelector(l);f&&(f.value=c!==void 0?c:"")},s=(l,c)=>{const f=t.querySelector(l);f&&(f.checked=!!c)};a("#edit-user-id",e.id),a("#edit-user-name",e.name),a("#edit-user-username",e.username),a("#edit-user-password",e.password),a("#edit-user-role",e.role),a("#edit-user-dept",e.dept),a("#edit-user-email",e.email),a("#edit-user-phone",e.phone),s("#edit-user-isAdmin",!!(e.isAdmin||e.role==="Administrator")),s("#edit-user-can-manage-attendance-sheet",!!(e.canManageAttendanceSheet||e.isAdmin||e.role==="Administrator"));const i=ht(e.joinDate);a("#edit-user-join-date",i),a("#edit-user-employee-id",i?e.employeeId||gt(i,e.id):"NA"),a("#edit-user-base-salary",Number(e.baseSalary||0)),a("#edit-user-other-allowances",Number(e.otherAllowances||0)),a("#edit-user-pf",Number(e.providentFund||0)),a("#edit-user-professional-tax",Number(e.professionalTax||0)),a("#edit-user-loan-advance",Number(e.loanAdvance||0)),a("#edit-user-tds-percent",Number(e.tdsPercent||0)),a("#edit-user-bank-name",e.bankName||""),a("#edit-user-bank-account",e.bankAccount||e.accountNumber||""),a("#edit-user-bank-ifsc",e.bankIfsc||e.ifsc||""),a("#edit-user-pan",e.pan||e.PAN||""),a("#edit-user-uan",e.uan||e.UAN||"");const o=["dashboard","leaves","users","attendance","reports","minutes","policies"],r=e.permissions||{};o.forEach(l=>{const c=r[l],f=document.getElementById(`edit-perm-${l}-view`),u=document.getElementById(`edit-perm-${l}-admin`);f&&(f.checked=c==="view"||c==="admin"),u&&(u.checked=c==="admin")});const d=document.getElementById("edit-user-modal");if(d){d.style.display="flex";const l=document.getElementById("edit-user-permissions-panel");l&&(l.style.display="block")}};window.app_notifyUser=n=>{console.log("Opening Notify for:",n),document.getElementById("notify-user-id").value=n,document.getElementById("notify-modal").style.display="flex"};window.app_quickAddTask=async n=>{const e=window.AppAuth.getUser();if(!(e&&(e.role==="Administrator"||e.isAdmin))&&n!==e.id){alert("Only administrators can assign tasks to other staff.");return}const a=await window.appPrompt("Task to assign:","",{title:"Assign Task",placeholder:"Enter task title",confirmText:"Next"});if(!a||!a.trim())return;const s=await window.appPrompt("Task date (YYYY-MM-DD). Leave blank for today:","",{title:"Assign Task Date",placeholder:"YYYY-MM-DD",confirmText:"Create Task"}),i=s&&s.trim()?s.trim():new Date().toISOString().split("T")[0];try{if(!window.AppCalendar)throw new Error("Calendar module not available.");await window.AppCalendar.addWorkPlanTask(i,n,a.trim()),await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:a.trim(),description:"",dueDate:i,status:"pending",fromId:e.id,fromName:e.name,toId:n,toName:(await window.AppDB.get("users",n))?.name||"Staff",createdAt:new Date().toISOString(),read:!1,history:[{action:"created",byId:e.id,byName:e.name,at:new Date().toISOString()}]}),alert("Task added successfully.");const o=document.getElementById("page-content");o&&(o.innerHTML=await U.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()}catch(o){alert("Failed to add task: "+o.message)}};window.app_viewLogs=async n=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}console.log("Viewing details for:",n);const e=await window.AppDB.get("users",n);let t=await window.AppAttendance.getLogs(n);window.currentViewedLogs=t,window.currentViewedUser=e;const a=t.length?`
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
                                        <button onclick="window.app_deleteLog('${s.id}', '${n}')" style="background:none; border:none; color:#ef4444; cursor:pointer;" title="Delete Log"><i class="fa-solid fa-trash"></i></button>
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
            ${a}
        `,document.getElementById("user-details-modal").style.display="flex"};window.app_openManualLogModal=n=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}const e=`
            <div class="modal-overlay" id="manual-admin-log-modal" style="display:flex;">
                <div class="modal-content">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h3>Add Manual Attendance</h3>
                        <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
                    </div>
                    <form onsubmit="window.app_submitManualLog(event, '${n}')">
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
        `;window.app_showModal(e,"manual-admin-log-modal")};window.app_submitManualLog=async(n,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}n.preventDefault();const t=new FormData(n.target),a=t.get("checkIn"),s=t.get("checkOut"),i=Ft(a,s);if(i==="Invalid"){alert("End time must be after Start time");return}const o=t.get("date"),r=window.AppAttendance.buildDateTime(o,a),d=window.AppAttendance.buildDateTime(o,s),l=r&&d?d-r:0,c=window.AppAttendance.evaluateAttendanceStatus(r||new Date,l),f=p=>{const[m,h]=p.split(":"),y=parseInt(m),w=y>=12?"PM":"AM",b=y%12||12;return`${String(b).padStart(2,"0")}:${h} ${w}`},u={date:o,checkIn:f(a),checkOut:f(s),duration:i,type:c.status,workDescription:t.get("description")||"Manual Entry by Admin",location:"Office (Manual)",durationMs:l,dayCredit:c.dayCredit,lateCountable:c.lateCountable,extraWorkedMs:c.extraWorkedMs||0,policyVersion:"v2",isManualOverride:!0,entrySource:"admin_override",attendanceEligible:!0};try{await window.AppAttendance.addAdminLog(e,u),alert("Attendance added manually."),document.getElementById("manual-admin-log-modal")?.remove(),window.app_viewLogs(e)}catch(p){alert("Error: "+p.message)}};window.app_deleteLog=async(n,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Are you sure you want to delete this attendance record?"))try{await window.AppAttendance.deleteLog(n),alert("Record deleted."),window.app_viewLogs(e)}catch(t){alert("Error: "+t.message)}};window.app_approveLeave=async n=>{if(await window.appConfirm("Are you sure you want to APPROVE this leave request?"))try{const e=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(n,"Approved",e.id),alert("Leave Approved! Attendance logs have been automatically generated.");const t=document.getElementById("page-content");t&&(t.innerHTML=await U.renderDashboard(),fe())}catch(e){alert("Error: "+e.message)}};window.app_rejectLeave=async n=>{const e=await window.appPrompt("Enter rejection reason (optional):","",{title:"Reject Leave",confirmText:"Reject Leave"});if(e!==null)try{const t=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(n,"Rejected",t.id,e),alert("Leave Rejected.");const a=document.getElementById("page-content");a&&(a.innerHTML=await U.renderDashboard(),fe())}catch(t){alert("Error: "+t.message)}};window.app_addLeaveComment=async n=>{const e=await window.AppDB.get("leaves",n),t=await window.appPrompt("Enter/Edit Admin Comment:",e.adminComment||"",{title:"Admin Comment",confirmText:"Save Comment"});if(t!==null)try{const a=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(n,e.status,a.id,t),alert("Comment saved.");const s=document.getElementById("page-content");s&&(s.innerHTML=await U.renderDashboard(),fe())}catch(a){alert("Error: "+a.message)}};window.app_exportLeaves=async()=>{try{const n=await window.AppLeaves.getAllLeaves();if(n.length===0){alert("No leave requests found to export.");return}await window.AppReports.exportLeavesCSV(n)}catch(n){alert("Export Failed: "+n.message)}};window.app_refreshMasterSheet=async()=>{const n=document.getElementById("page-content");if(n){const e=document.getElementById("sheet-month")?.value,t=document.getElementById("sheet-year")?.value;n.innerHTML=await U.renderMasterSheet(e,t)}};window.app_exportMasterSheet=async()=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}const n=parseInt(document.getElementById("sheet-month").value),e=parseInt(document.getElementById("sheet-year").value),t=await window.AppDB.getAll("users"),a=`${e}-${String(n+1).padStart(2,"0")}-01`,s=`${e}-${String(n+1).padStart(2,"0")}-31`,o=(await window.AppDB.query("attendance","date",">=",a)).filter(r=>r.date<=s);await window.AppReports.exportMasterSheetCSV(n,e,t,o)};window.app_openCellOverride=async(n,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}const t=(await window.AppDB.getAll("users")).find(r=>r.id===n),a=await window.AppDB.getAll("attendance"),s=r=>{if(Object.prototype.hasOwnProperty.call(r||{},"attendanceEligible"))return r.attendanceEligible===!0;const d=String(r?.entrySource||"");return d==="staff_manual_work"?!1:d==="admin_override"||d==="checkin_checkout"||r?.isManualOverride||r?.location==="Office (Manual)"||r?.location==="Office (Override)"||typeof r?.activityScore<"u"||typeof r?.locationMismatched<"u"||typeof r?.autoCheckout<"u"||!!r?.checkOutLocation||typeof r?.outLat<"u"||typeof r?.outLng<"u"?!0:String(r?.type||"").includes("Leave")||r?.location==="On Leave"},i=a.filter(r=>(r.userId===n||r.user_id===n)&&r.date===e&&s(r)).sort((r,d)=>Number(d.id||0)-Number(r.id||0))[0],o=`
            <div class="modal-overlay" id="cell-override-modal" style="display:flex;">
                <div class="modal-content">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <div>
                            <h3 style="margin:0;">Edit Attendance</h3>
                            <p style="font-size:0.8rem; color:#666; margin:4px 0 0 0;">${t.name} | ${e}</p>
                        </div>
                        <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
                    </div>
                        <form onsubmit="window.app_submitCellOverride(event, '${n}', '${e}', '${i?.id||""}')">
                            <div style="display:flex; flex-direction:column; gap:1rem;">
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time In</label>
                                    <input type="time" name="checkIn" required value="${i?ut(i.checkIn):"09:00"}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time Out</label>
                                    <input type="time" name="checkOut" required value="${i?ut(i.checkOut):"17:00"}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Entry Type</label>
                                <select name="type" required style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                    <option value="Present" ${i?.type==="Present"?"selected":""}>Present</option>
                                    <option value="Work - Home" ${i?.type==="Work - Home"?"selected":""}>WFH</option>
                                    <option value="Late" ${i?.type==="Late"?"selected":""}>Late</option>
                                    <option value="Absent" ${i?.type==="Absent"?"selected":""}>Absent</option>
                                    <option value="Casual Leave" ${i?.type==="Casual Leave"?"selected":""}>Leave</option>
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
                                ${i?`<button type="button" onclick="window.app_deleteCellLog('${i.id}', '${n}')" class="action-btn checkout" style="flex:1; padding:0;">Delete</button>`:""}
                            </div>
                            <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem;">
                                <input type="checkbox" name="isManualOverride" id="override-check" ${i?.isManualOverride?"checked":""}>
                                <label for="override-check" style="font-size:0.8rem; color:#666; cursor:pointer;">Mark as Manual Override</label>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;window.app_showModal(o,"cell-override-modal")};window.app_submitCellOverride=async(n,e,t,a)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}n.preventDefault();const s=new FormData(n.target),i=s.get("checkIn"),o=s.get("checkOut"),r=Ft(i,o);if(r==="Invalid"){alert("End time must be after Start time");return}const d=window.AppAttendance.buildDateTime(t,i),l=window.AppAttendance.buildDateTime(t,o),c=d&&l?l-d:0,f=window.AppAttendance.evaluateAttendanceStatus(d||new Date,c),u=s.get("isManualOverride")==="on",p=String(s.get("type")||"").trim(),m=u&&p?p:f.status,h=w=>{if(!w||w==="--")return"--";const[b,v]=w.split(":"),k=parseInt(b),g=k>=12?"PM":"AM",A=k%12||12;return`${String(A).padStart(2,"0")}:${v} ${g}`},y={date:t,checkIn:h(i),checkOut:h(o),duration:r,type:m,workDescription:s.get("description")||"Admin Override",location:"Office (Override)",durationMs:c,dayCredit:f.dayCredit,lateCountable:f.lateCountable,extraWorkedMs:f.extraWorkedMs||0,policyVersion:"v2",isManualOverride:u,entrySource:"admin_override",attendanceEligible:!0,autoCheckoutExtraApproved:s.get("autoCheckoutExtraApproved")==="on"};try{a?await window.AppAttendance.updateLog(a,y):await window.AppAttendance.addAdminLog(e,y),alert("Override successful."),document.getElementById("cell-override-modal")?.remove(),window.app_refreshMasterSheet()}catch(w){alert("Error: "+w.message)}};window.app_deleteCellLog=async(n,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Delete this attendance record?"))try{await window.AppAttendance.deleteLog(n),document.getElementById("cell-override-modal")?.remove(),window.app_refreshMasterSheet()}catch(t){alert("Error: "+t.message)}};function ut(n){if(!n||n==="--"||n==="Active Now")return"09:00";const[e,t]=n.split(" ");let[a,s]=e.split(":"),i=parseInt(a);return t==="PM"&&i<12&&(i+=12),t==="AM"&&i===12&&(i=0),`${String(i).padStart(2,"0")}:${s}`}const Ms=n=>{if(!n)return null;const e=String(n).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);if(!Number.isNaN(t.getTime())){const s=t.getFullYear(),i=String(t.getMonth()+1).padStart(2,"0"),o=String(t.getDate()).padStart(2,"0");return`${s}-${i}-${o}`}const a=e.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);if(a){const s=Number(a[1]),i=Number(a[2]),o=Number(a[3]);let r=s,d=i;return d>12&&s<=12&&(d=s,r=i),d<1||d>12||r<1||r>31?null:`${o}-${String(d).padStart(2,"0")}-${String(r).padStart(2,"0")}`}return null};window.app_runAttendancePolicyMigration=async()=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Recalculate historical attendance logs with the current policy? This updates stored status/credits for existing office logs.","Run Attendance Migration"))try{const e=await window.AppDB.getAll("attendance");let t=0,a=0,s=0;const i=new Set(["Work - Home","Training","On Duty","Holiday","National Holiday","Regional Holidays"]);let o=0,r=0;const d=new Map,l=new Map,c=h=>{const y=Ms(h?.date),w=typeof h?.activityScore<"u"||typeof h?.locationMismatched<"u"||typeof h?.autoCheckout<"u"||!!h?.checkOutLocation||typeof h?.outLat<"u"||typeof h?.outLng<"u";let v=String(h?.entrySource||"").trim();v||(h?.isManualOverride||h?.location==="Office (Manual)"||h?.location==="Office (Override)"?v="admin_override":w?v="checkin_checkout":v="staff_manual_work");const k=h?.checkIn&&h?.checkOut&&h?.checkOut!=="Active Now"?ut(h.checkIn):null,g=h?.checkIn&&h?.checkOut&&h?.checkOut!=="Active Now"?ut(h.checkOut):null,A=y&&k?window.AppAttendance.buildDateTime(y,k):null,S=y&&g?window.AppAttendance.buildDateTime(y,g):null,_=!!(A&&S&&S>A),L=_?S-A:null,I=typeof h?.durationMs=="number"?h.durationMs:L,O=typeof I=="number"?Math.max(0,I)/(1e3*60*60):0;let E;return Object.prototype.hasOwnProperty.call(h||{},"attendanceEligible")?E=h.attendanceEligible===!0:v==="staff_manual_work"?E=O>=4:E=!0,{dateIso:y,inDt:A,outDt:S,validTimeRange:_,resolvedDurationMs:I,workedHours:O,inferredSource:v,inferredAttendanceEligible:E}},f=(h,y)=>{const w=window.AppAttendance.normalizeType(h?.type);let b=0;y.inferredSource==="staff_manual_work"?y.workedHours>=8?b=100:y.workedHours>=4&&(b=50):b=Number(window.AppAttendance.getDayCredit(w)||0)*100;let v=0;return v+=b,v+=Math.min(20,Math.floor(Math.max(0,y.workedHours||0))),y.inferredAttendanceEligible&&(v+=40),y.validTimeRange&&(v+=10),y.inferredSource==="checkin_checkout"?v+=8:y.inferredSource==="admin_override"?v+=6:v+=4,h?.isManualOverride&&(v+=4),(String(h?.type||"").includes("Leave")||h?.location==="On Leave")&&(v+=6),v+=Number(h?.id||0)/1e13,v};for(const h of e){if(!h||!h.id)continue;const y=c(h);d.set(h.id,y);const w=h.user_id||h.userId;if(!w||!y.dateIso)continue;const b=`${w}|${y.dateIso}`;l.has(b)||l.set(b,[]),l.get(b).push(h)}const u=new Map;for(const[h,y]of l.entries()){if(!y||y.length===0)continue;const w=y.slice().sort((b,v)=>{const k=d.get(b.id)||c(b),g=d.get(v.id)||c(v);return f(v,g)-f(b,k)});u.set(h,w[0]?.id)}for(const h of e){if(t++,!h||!h.id){s++;continue}const y=window.AppAttendance.normalizeType(h.type),w=d.get(h.id)||c(h),b=w.dateIso,v=w.inDt,k=w.outDt,g=w.resolvedDurationMs,A=w.workedHours,S=w.inferredSource;let _=w.inferredAttendanceEligible;const L=h.user_id||h.userId,I=L&&b?`${L}|${b}`:null,O=I?u.get(I):null,E=!!(O&&O!==h.id),M=!!(h.checkIn&&h.checkOut&&h.checkOut!=="Active Now")&&!!(v&&k&&k<=v);let B=h.type,P=h.dayCredit,C=h.lateCountable,R=h.extraWorkedMs||0;if(E&&(_=!1,String(h.type||"").includes("Leave")||(B="Work Log"),P=0,C=!1,R=0,o++),M&&(_=!1,String(h.type||"").includes("Leave")||(B="Work Log"),P=0,C=!1,R=0,r++),S==="staff_manual_work"&&!E&&!M)A>=8?(B="Present",P=1):A>=4?(B="Half Day",P=.5):(B="Work Log",P=0),C=!1,R=0;else if(!h.isManualOverride&&_&&!(i.has(y)||String(y).includes("Leave")||y==="Office")&&v&&k&&k>v){const T=window.AppAttendance.evaluateAttendanceStatus(v,k-v);B=T.status,P=T.dayCredit,C=T.lateCountable,R=T.extraWorkedMs||0}const q={...h,entrySource:S,attendanceEligible:_,type:B,dayCredit:typeof P=="number"?P:0,lateCountable:C===!0,extraWorkedMs:R||0,durationMs:typeof g=="number"?g:null,policyVersion:"v2"};if(!(h.entrySource!==q.entrySource||h.attendanceEligible!==q.attendanceEligible||h.type!==q.type||h.dayCredit!==q.dayCredit||h.lateCountable!==q.lateCountable||(h.extraWorkedMs||0)!==(q.extraWorkedMs||0)||h.durationMs!==q.durationMs||h.policyVersion!=="v2")){s++;continue}await window.AppDB.put("attendance",q),a++}alert(`Migration complete.
Scanned: ${t}
Updated: ${a}
Skipped: ${s}
Duplicates neutralized: ${o}
Invalid-time logs neutralized: ${r}`);const p=window.location.hash.slice(1),m=document.getElementById("page-content");if(!m)return;p==="policy-test"?m.innerHTML=await U.renderPolicyTest():p==="dashboard"?(m.innerHTML=await U.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()):p==="salary"?(m.innerHTML=await U.renderSalaryProcessing(),window.app_recalculateAllSalaries&&window.app_recalculateAllSalaries()):p==="timesheet"&&(m.innerHTML=await U.renderTimesheet())}catch(e){console.error("Attendance migration failed:",e),alert("Migration failed: "+e.message)}};window.app_deleteUser=async n=>{if(await window.appConfirm("Are you sure you want to delete this user? This action cannot be undone."))try{await window.AppDB.delete("users",n),alert("User deleted successfully.");const e=document.getElementById("page-content");e&&(e.innerHTML=await U.renderAdmin())}catch(e){alert("Failed to delete user: "+e.message)}};window.app_recalculateRow=n=>{const e=parseFloat(n.querySelector(".base-salary-input").value)||0,t=e/22,a=parseFloat(n.querySelector(".unpaid-leaves-count").innerText)||0,s=parseFloat(n.querySelector(".late-count")?.innerText||"0")||0,i=Math.floor(s/(x.LATE_GRACE_COUNT||3))*(x.LATE_DEDUCTION_PER_BLOCK||.5),o=parseFloat(n.querySelector(".extra-work-hours")?.innerText||"0")||0,r=Math.floor(o/(x.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4))*(x.LATE_DEDUCTION_PER_BLOCK||.5),d=Math.max(0,i-r),l=a+d,c=parseFloat(document.getElementById("global-tds-percent").value)||0,f=n.querySelector(".tds-input");f&&!f.dataset.manual&&(f.value=c);const u=f?parseFloat(f.value)||0:c,p=Math.round(t*l),m=n.querySelector(".late-deduction-days"),h=n.querySelector(".late-deduction-raw"),y=n.querySelector(".penalty-offset-days"),w=n.querySelector(".deduction-days"),b=n.querySelector(".attendance-deduction-amount");h&&(h.innerText=i.toFixed(1)),y&&(y.innerText=r.toFixed(1)),m&&(m.innerText=d.toFixed(1)),w&&(w.innerText=l.toFixed(1)),b&&(b.innerText="-Rs "+p.toLocaleString()),n.querySelector(".deduction-amount").innerText="-Rs "+p.toLocaleString();const v=n.querySelector(".salary-input");v.dataset.manual||(v.value=Math.max(0,e-p));const k=parseFloat(v.value)||0,g=Math.round(k*(u/100)),A=Math.max(0,k-g);n.querySelector(".tds-amount").innerText="Rs "+g.toLocaleString(),n.querySelector(".tds-amount").dataset.value=g,n.querySelector(".final-net-salary").innerText="Rs "+A.toLocaleString(),n.querySelector(".final-net-salary").dataset.value=A};const za=n=>{const e=parseFloat(n.querySelector(".unpaid-leaves-count")?.innerText||"0")||0,t=parseFloat(n.querySelector(".late-count")?.innerText||"0")||0,a=parseFloat(n.querySelector(".extra-work-hours")?.innerText||"0")||0,s=Math.floor(t/(x.LATE_GRACE_COUNT||3))*(x.LATE_DEDUCTION_PER_BLOCK||.5),i=Math.floor(a/(x.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4))*(x.LATE_DEDUCTION_PER_BLOCK||.5),o=Math.max(0,s-i),r=e+o;return{unpaidLeaves:e,lateCount:t,extraWorkedHours:a,rawLateDeductionDays:s,penaltyOffsetDays:i,lateDeductionDays:o,deductionDays:r}};window.app_recalculateAllSalaries=()=>{document.querySelectorAll("tr[data-user-id]").forEach(n=>{window.app_recalculateRow(n)})};const $t=(n,e=new Date)=>{if(/^\d{4}-\d{2}$/.test(String(n||"").trim())){const[t,a]=String(n).split("-").map(Number);if(Number.isFinite(t)&&Number.isFinite(a)&&a>=1&&a<=12)return{year:t,monthIndex:a-1}}return{year:e.getFullYear(),monthIndex:e.getMonth()}};window.app_toggleSalaryPeriodMode=function(){const n=document.getElementById("salary-period-mode")?.value||"single",e=document.getElementById("salary-period-single-wrap"),t=document.getElementById("salary-period-range-wrap");e&&(e.style.display=n==="range"?"none":"block"),t&&(t.style.display=n==="range"?"flex":"none")};window.app_getSalaryPayPeriodInfo=function(){const n=new Date;if((document.getElementById("salary-period-mode")?.value||"single")==="range"){const r=document.getElementById("salary-pay-period-from")?.value||"",d=document.getElementById("salary-pay-period-to")?.value||"";let l=$t(r,n),c=$t(d,n);const f=l.year*100+(l.monthIndex+1);if(c.year*100+(c.monthIndex+1)<f){const w=l;l=c,c=w}const p=new Date(l.year,l.monthIndex,1),m=new Date(c.year,c.monthIndex+1,0),h=`${l.year}-${String(l.monthIndex+1).padStart(2,"0")}`,y=`${c.year}-${String(c.monthIndex+1).padStart(2,"0")}`;return{mode:"range",startDate:p,endDate:m,startKey:h,endKey:y,key:`${h}_to_${y}`,label:`${p.toLocaleDateString("en-GB",{month:"long",year:"numeric"})} to ${m.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}`}}const t=document.getElementById("salary-pay-period")?.value||"",a=$t(t,n),s=new Date(a.year,a.monthIndex,1),i=new Date(a.year,a.monthIndex+1,0),o=`${a.year}-${String(a.monthIndex+1).padStart(2,"0")}`;return{mode:"single",startDate:s,endDate:i,startKey:o,endKey:o,key:o,label:s.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}};window.app_saveAllSalaries=async()=>{const n=document.querySelectorAll("tr[data-user-id]"),e=[],t=[],a=window.app_getSalaryPayPeriodInfo(),s=a.key,i=document.getElementById("salary-pay-date")?.value||"",o=i?new Date(i).getTime():Date.now(),r=parseFloat(document.getElementById("global-tds-percent").value)||0;for(const d of n){const l=d.dataset.userId,c=d.querySelector(".base-salary-input").value,f=d.querySelector(".salary-input").value,u=d.querySelector(".comment-input").value,p=d.querySelector(".tds-input"),m=p?parseFloat(p.value)||0:r,h=d.querySelector(".tds-amount").dataset.value||0,y=d.querySelector(".final-net-salary").dataset.value||0,w=za(d),b=w.unpaidLeaves,v=w.lateCount,k=w.extraWorkedHours,g=w.rawLateDeductionDays,A=w.penaltyOffsetDays,S=w.lateDeductionDays,_=w.deductionDays,L=Number(String(d.querySelector(".attendance-deduction-amount")?.innerText||"0").replace(/[^0-9.-]+/g,"")),I=String(d.querySelector(".employee-id-input")?.value||"").trim(),O=String(d.querySelector(".designation-input")?.value||"").trim(),E=String(d.querySelector(".department-input")?.value||"").trim(),D=String(d.querySelector(".join-date-input")?.value||"").trim(),M=D?I||gt(D,l):"NA",B=String(d.querySelector(".bank-name-input")?.value||"").trim(),P=String(d.querySelector(".bank-account-input")?.value||"").trim(),C=String(d.querySelector(".pan-input")?.value||"").trim(),R=String(d.querySelector(".uan-input")?.value||"").trim(),H=Number(d.querySelector(".other-allowances-input")?.value||0),q=Number(d.querySelector(".pf-input")?.value||0),Y=Number(d.querySelector(".professional-tax-input")?.value||0),T=Number(d.querySelector(".loan-advance-input")?.value||0);if(d.querySelector(".comment-input").required&&!u){alert(`Please provide a comment for user ID: ${l} as the salary was adjusted.`);return}e.push({id:`salary_${l}_${s}`,userId:l,month:s,periodMode:a.mode,periodStart:a.startKey,periodEnd:a.endKey,periodLabel:a.label,payDate:o,baseAmount:Number(c),otherAllowances:H,providentFund:q,professionalTax:Y,loanAdvance:T,employeeId:M,designation:O,department:E,joinDate:D||null,bankName:B,bankAccount:P,pan:C,uan:R,attendanceDeduction:L,deductions:Number(d.querySelector(".deduction-amount").innerText.replace(/[^0-9.-]+/g,"")),unpaidLeaves:b,lateCount:v,extraWorkedHours:k,lateDeductionRawDays:g,penaltyOffsetDays:A,lateDeductionDays:S,deductionDays:_,adjustedAmount:Number(f),tdsPercent:m,tdsAmount:Number(h),finalNet:Number(y),comment:u||"",processedAt:Date.now()}),t.push({id:l,baseSalary:Number(c),tdsPercent:m,employeeId:M,designation:O,dept:E,joinDate:D||null,bankName:B,bankAccount:P,pan:C,uan:R,otherAllowances:H,providentFund:q,professionalTax:Y,loanAdvance:T})}try{for(const l of e)await window.AppDB.put("salaries",l);for(const l of t){const c=await window.AppDB.get("users",l.id);c&&(Object.assign(c,l),await window.AppDB.put("users",c))}alert("All records and TDS details saved successfully!");const d=document.getElementById("page-content");d.innerHTML=await U.renderSalaryProcessing()}catch(d){console.error("Salary Save Error:",d),alert("Failed to save records: "+d.message)}};window.app_exportSalaryCSV=()=>{const n=document.querySelectorAll("tr[data-user-id]");let e=`Staff Name,Emp ID,Designation,Department,Join Date,Bank Name,Bank Account,PAN,UAN,Base Salary,Other Allowances,PF,Professional Tax,Loan Advance,Present,Late,Unpaid Leaves,Extra Work Hours,Late Deduction Raw,Penalty Offset Days,Late Deduction Days,Total Deduction Days,Attendance Deduction,Total Deductions,Adjusted Salary,TDS (%),TDS Amount,Final Net,Comment
`;n.forEach(o=>{const r=o.querySelector('div[style*="font-weight: 600"]').innerText,d=o.querySelector(".base-salary-input").value,l=o.querySelector(".employee-id-input")?.value||"",c=o.querySelector(".designation-input")?.value||"",f=o.querySelector(".department-input")?.value||"",u=o.querySelector(".join-date-input")?.value||"",p=o.querySelector(".bank-name-input")?.value||"",m=o.querySelector(".bank-account-input")?.value||"",h=o.querySelector(".pan-input")?.value||"",y=o.querySelector(".uan-input")?.value||"",w=o.querySelector(".other-allowances-input")?.value||"0",b=o.querySelector(".pf-input")?.value||"0",v=o.querySelector(".professional-tax-input")?.value||"0",k=o.querySelector(".loan-advance-input")?.value||"0",g=o.querySelector(".present-count")?.innerText||"0",A=o.querySelector(".late-count")?.innerText||"0",S=o.querySelector(".unpaid-leaves-count")?.innerText||"0",_=o.querySelector(".extra-work-hours")?.innerText||"0",L=o.querySelector(".late-deduction-raw")?.innerText||"0",I=o.querySelector(".penalty-offset-days")?.innerText||"0",O=o.querySelector(".late-deduction-days")?.innerText||"0",E=o.querySelector(".deduction-days")?.innerText||"0",D=(o.querySelector(".attendance-deduction-amount")?.innerText||"").replace(/[^0-9.-]+/g,"")||"0",M=(o.querySelector(".deduction-amount").innerText||"").replace(/[^0-9.-]+/g,""),B=o.querySelector(".salary-input").value,P=parseFloat(document.getElementById("global-tds-percent").value)||0,C=o.querySelector(".tds-input"),R=C&&C.value!==""?C.value:P,H=(o.querySelector(".tds-amount").innerText||"").replace(/[^0-9.-]+/g,""),q=(o.querySelector(".final-net-salary").innerText||"").replace(/[^0-9.-]+/g,""),Y=o.querySelector(".comment-input").value;e+=`"${r}","${l}","${c}","${f}","${u}","${p}","${m}","${h}","${y}",${d},${w},${b},${v},${k},${g},${A},${S},${_},${L},${I},${O},${E},${D},${M},${B},${R},${H},${q},"${Y}"
`});const t=new Blob([e],{type:"text/csv"}),a=window.URL.createObjectURL(t),s=document.createElement("a"),i=window.app_getSalaryPayPeriodInfo();s.setAttribute("href",a),s.setAttribute("download",`Salaries_${i.key.replace(/[^a-zA-Z0-9_-]/g,"_")}.csv`),s.click()};const _t=(n,e=4)=>{const t=String(n||"").trim();return t?t.length<=e?t:`${"*".repeat(Math.max(0,t.length-e))}${t.slice(-e)}`:"NA"},Cs=n=>{const e=Math.floor(Number(n)||0);if(e===0)return"Zero";const t=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"],a=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"],s=u=>{if(u<20)return t[u];const p=Math.floor(u/10),m=u%10;return`${a[p]}${m?` ${t[m]}`:""}`.trim()},i=u=>{const p=Math.floor(u/100),m=u%100;return p?`${t[p]} Hundred${m?` ${s(m)}`:""}`.trim():s(m)};let o=e;const r=Math.floor(o/1e7);o%=1e7;const d=Math.floor(o/1e5);o%=1e5;const l=Math.floor(o/1e3);o%=1e3;const c=o,f=[];return r&&f.push(`${s(r)} Crore`),d&&f.push(`${s(d)} Lakh`),l&&f.push(`${s(l)} Thousand`),c&&f.push(i(c)),f.join(" ").trim()};window.app_printSalarySlip=function(){const n=document.getElementById("salary-slip-modal");if(!n)return;const e=n.querySelector(".salary-slip-print-root");e&&(document.body.classList.add("salary-slip-print-mode"),e.classList.add("print-active"),setTimeout(()=>{window.print(),setTimeout(()=>{e.classList.remove("print-active"),document.body.classList.remove("salary-slip-print-mode")},150)},60))};window.app_generateSalarySlip=async function(n){try{const e=document.querySelector(`tr[data-user-id="${n}"]`);if(!e){alert("Unable to locate salary row for this user.");return}const t=await window.AppDB.get("users",n);if(!t){alert("User details not found.");return}const a=new Date,s=window.app_getSalaryPayPeriodInfo(),i=s.label,o=Ee(s.startDate),r=Ee(s.endDate),d=document.getElementById("salary-pay-date")?.value||"",l=Ee(d||a),c=ks(a),f=`CRWI-${s.key.replace(/[^a-zA-Z0-9]/g,"")}-${n}-${String(a.getTime()).slice(-5)}`,u=Number(e.querySelector(".base-salary-input")?.value||0),p=Number(e.querySelector(".salary-input")?.value||0),m=Number(e.querySelector(".tds-input")?.value||0),h=Number(e.querySelector(".tds-amount")?.dataset?.value||"0"),y=Number(e.querySelector(".final-net-salary")?.dataset?.value||"0"),w=Number(String(e.querySelector(".attendance-deduction-amount")?.innerText||"0").replace(/[^0-9.-]+/g,""))||0,b=za(e),v=b.rawLateDeductionDays,k=b.penaltyOffsetDays,g=b.lateDeductionDays,A=b.deductionDays,S=b.unpaidLeaves,_=b.lateCount,L=String(e.querySelector(".comment-input")?.value||"").trim(),I=Number(e.querySelector(".other-allowances-input")?.value||t.otherAllowances||0),O=u+I,E=Number(e.querySelector(".loan-advance-input")?.value||t.loanAdvance||0),D=Number(e.querySelector(".pf-input")?.value||t.providentFund||0),M=Number(e.querySelector(".professional-tax-input")?.value||t.professionalTax||0),B=String(e.querySelector(".join-date-input")?.value||t.joinDate||"").trim(),P=String(e.querySelector(".employee-id-input")?.value||t.employeeId||"").trim(),C=B?P||gt(B,t.id):"NA",R=String(e.querySelector(".designation-input")?.value||t.designation||t.role||"").trim(),H=String(e.querySelector(".department-input")?.value||t.dept||t.department||"").trim(),q=String(e.querySelector(".join-date-input")?.value||t.joinDate||"").trim(),Y=String(e.querySelector(".bank-name-input")?.value||t.bankName||"").trim(),T=String(e.querySelector(".bank-account-input")?.value||t.bankAccount||t.accountNumber||"").trim(),N=String(e.querySelector(".pan-input")?.value||t.pan||t.PAN||"").trim(),j=String(e.querySelector(".uan-input")?.value||t.uan||t.UAN||"").trim(),K=w+h+E+D+M,J=`${Cs(y)} Rupees Only`,X=[{label:"Attendance Deduction",amount:w,remarks:`Unpaid Leaves: ${S}, Late Count: ${_}, Late Raw: ${v.toFixed(1)}, Offset: ${k.toFixed(1)}, Late Deduction: ${g.toFixed(1)}, Total Deduction Days: ${A.toFixed(1)}`},{label:"TDS",amount:h,remarks:`Applied at ${m.toFixed(2)}%`},{label:"Provident Fund",amount:D,remarks:D?"Configured as per employee profile":"NA"},{label:"Professional Tax",amount:M,remarks:M?"Configured as per employee profile":"NA"},{label:"Loan / Advance",amount:E,remarks:E?"Recovered in this cycle":"Nil"}],te=ne=>As(ne),ke=`
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
                                    <div><b>Employee ID:</b> ${C||"NA"}</div>
                                    <div><b>Designation:</b> ${R||"NA"}</div>
                                    <div><b>Department:</b> ${H||"NA"}</div>
                                    <div><b>Date of Joining:</b> ${Ee(q)}</div>
                                    <div><b>Bank Name:</b> ${Y||"NA"}</div>
                                    <div><b>UAN:</b> ${_t(j)}</div>
                                    <div><b>PAN:</b> ${_t(N)}</div>
                                    <div><b>Bank A/C:</b> ${_t(T)}</div>
                                </div>
                            </div>

                            <div class="salary-slip-split">
                                <div class="salary-slip-section">
                                    <h4>Earnings</h4>
                                    <table class="salary-slip-table">
                                        <tr><td>Basic Salary</td><td>${te(u)}</td></tr>
                                        <tr><td>HRA</td><td>NA</td></tr>
                                        <tr><td>Conveyance Allowance</td><td>NA</td></tr>
                                        <tr><td>Special Allowance</td><td>NA</td></tr>
                                        <tr><td>Other Allowances</td><td>${te(I)}</td></tr>
                                        <tr class="total"><td>Gross Earnings</td><td>${te(O)}</td></tr>
                                    </table>
                                </div>
                                <div class="salary-slip-section">
                                    <h4>Deductions (Breakdown)</h4>
                                    <table class="salary-slip-table">
                                        ${X.map(ne=>`<tr><td>${ne.label}<div class="remark">${ne.remarks}</div></td><td>${ne.amount?te(ne.amount):"NA"}</td></tr>`).join("")}
                                        <tr class="total"><td>Total Deductions</td><td>${te(K)}</td></tr>
                                    </table>
                                </div>
                            </div>

                            <div class="salary-slip-net">
                                <div><b>Adjusted Salary:</b> ${te(p)}</div>
                                <div><b>Net Salary:</b> ${te(y)}</div>
                                <div><b>Net Salary in Words:</b> ${J}</div>
                            </div>

                            <div class="salary-slip-footer">
                                <div>This is a system-generated salary slip and does not require a signature.</div>
                                <div>Generated: ${c} | Payroll Ref ID: ${f}</div>
                                ${L?`<div>Payroll Comment: ${L}</div>`:""}
                            </div>
                        </div>
                    </div>
                </div>
            `;window.app_showModal(ke,"salary-slip-modal")}catch(e){console.error("Salary slip generation failed:",e),alert(`Failed to generate salary slip: ${e.message}`)}};window.app_editTaskStatus=async function(n,e,t){try{const a=window.AppAuth.getUser(),s=t==="completed"?new Date().toISOString().split("T")[0]:null;await window.AppCalendar.updateTaskStatus(n,e,t,s);const i=document.getElementById("page-content");i.innerHTML=await U.renderDashboard(),alert(`Task status updated to: ${t}`)}catch(a){console.error("Failed to update task status:",a),alert("Failed to update task status. Please try again.")}};window.app_reassignTask=async function(n,e,t){try{const a=window.AppAuth.getUser();if(a.role!=="Administrator"&&!a.isAdmin){alert("Only administrators can reassign tasks.");return}await window.AppCalendar.reassignTask(n,e,t);const s=document.getElementById("page-content");s.innerHTML=await U.renderDashboard(),alert("Task reassigned successfully!")}catch(a){console.error("Failed to reassign task:",a),alert("Failed to reassign task. Please try again.")}};window.app_viewTaskDetails=async function(n,e){try{const t=await window.AppDB.get("work_plans",n);if(!t||!t.plans||!t.plans[e]){alert("Task not found.");return}const a=t.plans[e],s=window.AppCalendar.getSmartTaskStatus(t.date,a.status),i={"to-be-started":"#3b82f6","in-process":"#eab308",completed:"#22c55e",overdue:"#ef4444","not-completed":"#6b7280"},o={"to-be-started":"🔵 To Be Started","in-process":"🟡 In Process",completed:"🟢 Completed",overdue:"🔴 Overdue","not-completed":"⚫ Not Completed"},r=`
                <div class="modal-overlay" id="task-details-modal" style="display: flex;">
                    <div class="modal-content" style="max-width: 500px;">
                        <h2 style="margin-bottom: 1rem;">Task Details</h2>
                        
                        <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                            <div style="margin-bottom: 0.75rem;">
                                <label style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Task</label>
                                <p style="margin: 0.25rem 0 0 0; font-weight: 500;">${a.task}</p>
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
                            
                            ${a.completedDate?`
                                <div style="margin-bottom: 0.75rem;">
                                    <label style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Completed Date</label>
                                    <p style="margin: 0.25rem 0 0 0;">${a.completedDate}</p>
                                </div>
                            `:""}
                            
                            ${a.subPlans&&a.subPlans.length>0?`
                                <div>
                                    <label style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Sub-tasks</label>
                                    <ul style="margin: 0.25rem 0 0 0; padding-left: 1.5rem;">
                                        ${a.subPlans.map(d=>`<li>${d}</li>`).join("")}
                                    </ul>
                                </div>
                            `:""}
                        </div>
                        
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="document.getElementById('task-details-modal').remove()" class="action-btn" style="flex: 1;">Close</button>
                        </div>
                    </div>
                </div>
            `;document.getElementById("modal-container").innerHTML=r}catch(t){console.error("Failed to view task details:",t),alert("Failed to load task details.")}};window.app_recalculateRatings=async function(){try{const n=window.AppAuth.getUser();if(n.role!=="Administrator"&&!n.isAdmin){alert("Only administrators can recalculate ratings.");return}if(!await window.appConfirm("This will recalculate ratings for all users. Continue?"))return;const e=await window.AppRating.updateAllRatings();alert(`Successfully updated ratings for ${e.length} users!`);const t=document.getElementById("page-content");t.innerHTML=await U.renderDashboard()}catch(n){console.error("Failed to recalculate ratings:",n),alert("Failed to recalculate ratings. Please try again.")}};window.app_triggerManualAudit=async()=>{if(!await window.appConfirm("Trigger a manual location audit for all active staff?"))return;const n=`Manual Audit @ ${new Date().toLocaleTimeString()}`;try{await window.AppDB.add("system_commands",{type:"audit",slotName:n,timestamp:Date.now(),requestedBy:window.AppAuth.getUser()?.name||"Admin",status:"pending"}),alert("Manual audit command sent. All active staff devices will now perform a stealth check.")}catch(e){console.error("Failed to trigger manual audit:",e),alert("Error: "+e.message)}};window.app_applyAuditFilter=async()=>{const n=document.getElementById("audit-start")?.value,e=document.getElementById("audit-end")?.value,t=document.getElementById("page-content");t&&(t.innerHTML=await U.renderAdmin(n,e),window.AppAnalytics&&window.AppAnalytics.initAdminCharts())};window.app_exportAudits=async()=>{const n=document.getElementById("audit-start")?.value,e=document.getElementById("audit-end")?.value;try{let t=await window.AppDB.getAll("location_audits");if(n&&e&&(t=t.filter(l=>{const c=new Date(l.timestamp).toISOString().split("T")[0];return c>=n&&c<=e})),t.sort((l,c)=>c.timestamp-l.timestamp),t.length===0){alert("No audits found for the selected range.");return}const a=["Timestamp","Date","Time","Staff Member","Slot","Status","Latitude","Longitude"],s=t.map(l=>[l.timestamp,new Date(l.timestamp).toLocaleDateString(),new Date(l.timestamp).toLocaleTimeString(),l.userName||"Unknown",l.slot,l.status,l.lat||"",l.lng||""]),i=[a,...s].map(l=>l.join(",")).join(`
`),o=new Blob([i],{type:"text/csv;charset=utf-8;"}),r=document.createElement("a"),d=URL.createObjectURL(o);r.setAttribute("href",d),r.setAttribute("download",`security_audits_${n||"export"}.csv`),r.style.visibility="hidden",document.body.appendChild(r),r.click(),document.body.removeChild(r)}catch(t){console.error("Export failed:",t),alert("Export failed: "+t.message)}};window.app_changeAnnualYear=n=>{window.app_annualYear=(window.app_annualYear||new Date().getFullYear())+n,window.app_renderAnnualPlanPage()};window.app_toggleAnnualLegendFilter=n=>{const e=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0,overdue:!0,completed:!0};Object.prototype.hasOwnProperty.call(e,n)&&(e[n]=!e[n],window.app_annualLegendFilters=e,window.app_renderAnnualPlanPage())};window.app_showAnnualDayDetails=async n=>{if(!n)return;const e=window._currentPlans||await window.AppCalendar.getPlans(),t=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0},a=window.AppAuth.getUser()||{},s=a.role==="Administrator"||a.isAdmin,i=(window.app_getDayEvents(n,e,{includeAuto:!1,userId:s?null:a.id})||[]).filter(d=>d.type==="leave"?!!t.leave:d.type==="work"?!!t.work:(d.type==="holiday",!!t.event)),o=i.length?i.map(d=>{const l=d.type||"event",c=l==="leave"?"background:#fee2e2;color:#991b1b;":l==="work"?"background:#e0e7ff;color:#3730a3;":l==="holiday"?"background:#f1f5f9;color:#334155;":"background:#dcfce7;color:#166534;",f=l==="work"&&Array.isArray(d.plans)&&d.plans.length?`<ul style="margin:0.5rem 0 0 1rem; padding:0; color:#475569; font-size:0.8rem;">
                    ${d.plans.map(u=>`<li>${window.app_formatTaskWithPostponeChip(u.task||"Work plan item")}</li>`).join("")}
                   </ul>`:"";return`
                <div class="annual-v2-detail-item" style="border:1px solid #eef2f7; border-radius:12px; padding:0.75rem;">
                    <div class="annual-v2-detail-item-head" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                        <span class="annual-v2-detail-tag" style="padding:2px 8px; border-radius:999px; font-size:0.7rem; font-weight:700; ${c}">${l.toUpperCase()}</span>
                        <div class="annual-v2-detail-title" style="font-size:0.9rem; color:#1f2937; font-weight:600;">${d.title||"Event"}</div>
                    </div>
                    ${f}
                </div>`}).join(""):'<div style="text-align:center; color:#94a3b8; padding:1rem;">No visible items for this date with current filters.</div>',r=`
            <div class="modal-overlay annual-v2-modal" id="annual-day-detail-modal" style="display:flex;">
                <div class="annual-detail-modal annual-v2-modal-content">
                    <div class="annual-detail-modal-header annual-v2-detail-head">
                        <div>
                            <div style="font-size:0.8rem; color:#64748b;">Date</div>
                            <div style="font-size:1rem; font-weight:700; color:#1e1b4b;">${n}</div>
                        </div>
                        <button type="button" onclick="window.app_closeModal(this)" class="day-plan-close-btn" title="Close">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="annual-v2-detail-list" style="display:flex; flex-direction:column; gap:0.6rem; max-height:60vh; overflow:auto;">
                        ${o}
                    </div>
                </div>
            </div>`;window.app_showModal(r,"annual-day-detail-modal")};window.app_toggleAnnualView=n=>{window.app_annualViewMode=n,window.app_renderAnnualPlanPage()};window.app_jumpToAnnualToday=()=>{const n=new Date;window.app_annualYear=n.getFullYear(),window.app_selectedAnnualDate=n.toISOString().split("T")[0],window.app_renderAnnualPlanPage().then(()=>{window.app_showAnnualDayDetails(window.app_selectedAnnualDate)})};window.app_renderAnnualPlanPage=async()=>{const n=document.getElementById("page-content");n&&(n.innerHTML=await U.renderAnnualPlan())};window.app_setAnnualStaffFilter=n=>{window.app_annualStaffFilter=String(n||"").trim(),window.app_renderAnnualPlanPage()};window.app_setAnnualListSearch=n=>{window.app_annualListSearch=String(n||"").trim(),window.app_renderAnnualPlanPage()};window.app_setAnnualListSort=n=>{window.app_annualListSort=String(n||"date-asc").trim(),window.app_renderAnnualPlanPage()};window.app_renderTimesheetPage=async()=>{const n=document.getElementById("page-content");n&&(n.innerHTML=await U.renderTimesheet())};window.app_setTimesheetView=n=>{window.app_timesheetViewMode=n==="calendar"?"calendar":"list",window.app_renderTimesheetPage()};window.app_changeTimesheetMonth=n=>{const e=new Date,t=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:e.getMonth(),a=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:e.getFullYear(),s=new Date(a,t,1);s.setMonth(s.getMonth()+n),window.app_timesheetMonth=s.getMonth(),window.app_timesheetYear=s.getFullYear(),window.app_renderTimesheetPage()};window.app_jumpTimesheetToday=()=>{const n=new Date;window.app_timesheetMonth=n.getMonth(),window.app_timesheetYear=n.getFullYear(),window.app_renderTimesheetPage()};window.app_closeModal=n=>{const e=n&&n.closest?n.closest(".modal-overlay"):null;e&&e.remove()};window.app_getSystemUpdateNotes=()=>[{date:"2026-02-21",summary:"Check for System Update now shows this quick update popup before refreshing."},{date:"2026-02-21",summary:"The update action shortcut was changed from Ctrl+F5 to Ctrl+Shift+R."}];window.app_showSystemUpdatePopup=()=>{const n="system-update-modal",e=Xe(),t=e.active&&e.buildId&&e.buildId!==e.currentBuildId,a=(window.app_getSystemUpdateNotes()||[]).slice(0,5),s=a.length?a.map(l=>`
                <li style="margin:0 0 0.7rem 0; color:#334155; line-height:1.45;">
                    <span style="display:block; font-size:0.72rem; color:#64748b; font-weight:700;">${ee(l.date||"")}</span>
                    <span>${ee(l.summary||"")}</span>
                </li>
            `).join(""):'<li style="color:#64748b;">No update notes available.</li>',i=t?`
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0.6rem 0.75rem; margin-bottom:0.8rem;">
                    <div style="font-size:0.78rem; font-weight:700; color:#0f172a;">New version available</div>
                    <div style="font-size:0.74rem; color:#475569; margin-top:0.15rem;">
                        Running build: ${ee((e.currentCommitSha||"").slice(0,7)||e.currentBuildId||"local")}
                        ${e.currentBuiltAt?` | Built: ${ee(e.currentBuiltAt)}`:""}
                    </div>
                    <div style="font-size:0.74rem; color:#475569; margin-top:0.25rem;">
                        Available build: ${ee((e.commitSha||"").slice(0,7)||e.buildId)}
                        ${e.deployedAt?` | Deployed: ${ee(e.deployedAt)}`:""}
                    </div>
                    ${e.notes?`<div style="font-size:0.78rem; color:#0f172a; margin-top:0.45rem;">${ee(e.notes)}</div>`:""}
                </div>
            `:`
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0.6rem 0.75rem; margin-bottom:0.8rem;">
                    <div style="font-size:0.78rem; font-weight:700; color:#0f172a;">You are on the latest version</div>
                    <div style="font-size:0.74rem; color:#475569; margin-top:0.15rem;">
                        Current build: ${ee((e.currentCommitSha||"").slice(0,7)||e.currentBuildId||"local")}
                        ${e.currentBuiltAt?` | Built: ${ee(e.currentBuiltAt)}`:""}
                    </div>
                </div>
            `,o=t?"window.app_dismissReleaseUpdatePrompt()":"this.closest('.modal-overlay').remove()",d=`
            <div class="modal-overlay" id="${n}" style="display:flex;">
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
        `;window.app_showModal(d,n)};const Ps=async n=>{if(!n?.waiting||!navigator.serviceWorker)return!1;const e=n.waiting;return new Promise(t=>{let a=!1;const s=r=>{a||(a=!0,navigator.serviceWorker.removeEventListener("controllerchange",i),clearTimeout(o),t(r))},i=()=>s(!0),o=setTimeout(()=>s(!1),3e3);navigator.serviceWorker.addEventListener("controllerchange",i,{once:!0}),e.postMessage({type:"SKIP_WAITING"})})};window.app_forceRefresh=async()=>{try{if(navigator.serviceWorker){const n=await navigator.serviceWorker.getRegistrations();It?.update&&await It.update();for(const e of n)await Ps(e)}if(window.caches){const n=await caches.keys();await Promise.all(n.map(e=>caches.delete(e)))}}catch(n){console.warn("Force refresh cleanup failed:",n)}Ut(!0),window.location.reload()};hs();console.log("App.js Loaded & Globals Ready");
