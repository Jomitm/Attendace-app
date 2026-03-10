(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const d of i.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&a(d)}).observe(document,{childList:!0,subtree:!0});function t(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(s){if(s.ep)return;s.ep=!0;const i=t(s);fetch(s.href,i)}})();const D={WORK_START_TIME:"09:00",LATE_CUTOFF_TIME:"09:15",WORK_END_TIME:"17:00",LATE_CUTOFF_MINUTES:555,MINOR_LATE_END_MINUTES:615,LATE_END_MINUTES:720,POST_NOON_END_MINUTES:810,AFTERNOON_START_MINUTES:720,EARLY_DEPARTURE_MINUTES:1020,FY_START_MONTH:3,IS_SATURDAY_OFF:n=>{const t=new Date(n).getDate(),a=Math.ceil(t/7);return a===2||a===4},LATE_GRACE_COUNT:3,LATE_DEDUCTION_PER_BLOCK:.5,EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4,READ_CACHE_TTLS:{users:6e4,settings:3e5,minutes:3e4,attendanceSummary:3e4,staffMessages:2e4,dailySummaryReadMs:6e4},READ_OPT_FLAGS:{FF_READ_OPT_DB_QUERIES:!0,FF_READ_OPT_TARGETED_REALTIME:!0,FF_READ_OPT_ANALYTICS_CACHE:!0,FF_SHARED_DAILY_SUMMARY:!0,FF_SUMMARY_LOCKING:!0,ENABLE_SIMULATION_MODULE:!1,ENABLE_READ_TELEMETRY:!0,ENABLE_PRESENCE_HEARTBEAT:!1},SUMMARY_POLICY:{STALENESS_MS:1440*60*1e3,TEAM_ACTIVITY_LIMIT:15,LOCK_TTL_MS:9e4,SCHEMA_VERSION:1,RECOMPUTE_CUTOFF_HOUR_IST:17,FALLBACK_TO_PREVIOUS_DAY:!0},SIMULATION_POLICY:{LEGACY_DUMMY_CLEANUP:{ENABLED:!0,FLAG_KEY:"legacy_dummy_cleanup_v1",TARGET_USER_IDS:["sim_punctual","sim_admin_new"],TARGET_USERNAMES:["jomit_p","maria"],AUDIT_COLLECTION:"system_audit_logs"}}},ua={apiKey:"AIzaSyC7a8AxukI0-egXimYTedwCa2RFnMTBu84",authDomain:"crwiattendance.firebaseapp.com",projectId:"crwiattendance",storageBucket:"crwiattendance.firebasestorage.app",messagingSenderId:"462155106938",appId:"1:462155106938:web:18291b04a5a3bec185c9c3",measurementId:"G-X6W45TV4QR"};typeof firebase<"u"&&!firebase.apps.length&&(firebase.initializeApp(ua),console.log("Firebase Initialized (Compat Mode)"));const _t=typeof firebase<"u"?firebase.firestore():null;typeof window<"u"&&(window.AppFirestore=_t);class ma{constructor(){this.db=_t,this.cache=new Map,this.telemetry={get:0,getAll:0,query:0,queryMany:0,listen:0,listenQuery:0,writes:0,docsRead:0,byCollection:{}}}async init(){if(!this.db){console.error("Firebase not initialized! Check config.");return}console.log("Firestore adapter ready.")}getFlags(){return D&&D.READ_OPT_FLAGS||{}}track(e,t,a=0){this.getFlags().ENABLE_READ_TELEMETRY&&(typeof this.telemetry[e]=="number"&&(this.telemetry[e]+=1),this.telemetry.docsRead+=Math.max(0,Number(a)||0),this.telemetry.byCollection[t]||(this.telemetry.byCollection[t]={ops:0,docsRead:0}),this.telemetry.byCollection[t].ops+=1,this.telemetry.byCollection[t].docsRead+=Math.max(0,Number(a)||0))}getReadTelemetry(){return JSON.parse(JSON.stringify(this.telemetry))}clearReadTelemetry(){this.telemetry={get:0,getAll:0,query:0,queryMany:0,listen:0,listenQuery:0,writes:0,docsRead:0,byCollection:{}}}getCacheKey(e,t,a={}){return`${e}:${t}:${JSON.stringify(a)}`}invalidateCollectionCache(e){const t=`:${e}:`;for(const a of this.cache.keys())a.includes(t)&&this.cache.delete(a)}async getCached(e,t,a){const s=Date.now(),i=this.cache.get(e);if(i&&i.expiresAt>s)return i.value;const d=await a();return this.cache.set(e,{value:d,expiresAt:s+Math.max(0,Number(t)||0)}),d}async getOrGenerateSummary(e,t,a){if(!e||typeof t!="function")throw new Error("getOrGenerateSummary requires a key and generator function.");const s=this.getCacheKey("summary","computed",{summaryKey:e}),i=typeof a=="number"?a:D?.READ_CACHE_TTLS?.attendanceSummary||3e4;return this.getCached(s,i,t)}async sleep(e){return new Promise(t=>setTimeout(t,Math.max(0,Number(e)||0)))}getSummarySchemaVersion(){return Number(D?.SUMMARY_POLICY?.SCHEMA_VERSION||1)}getIstNow(){const e=new Date;return new Date(e.toLocaleString("en-US",{timeZone:"Asia/Kolkata"}))}toDateKey(e){const t=e instanceof Date?e:new Date(e),a=t.getFullYear(),s=String(t.getMonth()+1).padStart(2,"0"),i=String(t.getDate()).padStart(2,"0");return`${a}-${s}-${i}`}getISTDateKeys(){const e=this.getIstNow(),t=new Date(e);return t.setDate(t.getDate()-1),{todayKey:this.toDateKey(e),yesterdayKey:this.toDateKey(t)}}shouldRecomputeNowIST(e){const t=Number.isFinite(Number(e))?Number(e):Number(D?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST||17);return this.getIstNow().getHours()>=Math.max(0,Math.min(23,t))}isSummaryFresh(e,t){if(!e||typeof e!="object")return!1;const a=Number(e.generatedAt||0),s=Number(e.version||0);return!a||!s||s!==this.getSummarySchemaVersion()?!1:Date.now()-a<=Math.max(0,Number(t)||0)}async getDailySummary(e){const t=String(e||"").trim();if(!t)return null;const a=D?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4,s=this.getCacheKey("dailySummary","daily_summaries",{key:t});return this.getCached(s,a,()=>this.get("daily_summaries",t))}listenDailySummary(e,t){const a=String(e||"").trim();if(!a)return null;const s=this.getCacheKey("dailySummary","daily_summaries",{key:a});return this.listenDoc("daily_summaries",a,(i,d)=>{if(i){const r=D?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4;this.cache.set(s,{value:i,expiresAt:Date.now()+r})}t&&t(i,d)})}async getSummaryByDateKey(e){return this.getDailySummary(e)}async getLatestSuccessfulSummaryMeta(){const e=D?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4,t=this.getCacheKey("dailySummaryMeta","daily_summaries_meta",{key:"latest_success"});return this.getCached(t,e,()=>this.get("daily_summaries_meta","latest_success"))}async setLatestSuccessfulSummaryMeta({dateKey:e,generatedAt:t,version:a}={}){const s=String(e||"").trim();if(!s)return;const i={id:"latest_success",dateKey:s,generatedAt:Number(t||Date.now()),version:Number(a||this.getSummarySchemaVersion())};await this.put("daily_summaries_meta",i)}async getDailySummaryWithFallback({todayKey:e,yesterdayKey:t,staleAfterMs:a}={}){const s=Math.max(1e3,Number(a)||Number(D?.SUMMARY_POLICY?.STALENESS_MS)||864e5),i=D?.SUMMARY_POLICY?.FALLBACK_TO_PREVIOUS_DAY!==!1,d=await this.getSummaryByDateKey(e);if(this.isSummaryFresh(d,s))return{summary:d,source:"today"};if(i){const l=await this.getSummaryByDateKey(t);if(l&&typeof l=="object")return{summary:l,source:"yesterday"}}const r=await this.getLatestSuccessfulSummaryMeta(),o=String(r?.dateKey||"").trim();if(o){const l=await this.getSummaryByDateKey(o);if(l&&typeof l=="object")return{summary:l,source:"latest_success"}}return{summary:d||null,source:"none"}}async putDailySummary(e,t={}){const a=String(e||"").trim();if(!a)throw new Error("putDailySummary requires dateKey.");const s={id:a,dateKey:a,version:this.getSummarySchemaVersion(),...t};return this.put("daily_summaries",s)}async acquireSummaryLock(e,t,a){const s=String(e||"").trim(),i=String(t||"").trim();if(!s||!i||!this.db||!this.db.runTransaction)return!1;if(D?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING===!1)return!0;const d=Math.max(1e3,Number(a)||Number(D?.SUMMARY_POLICY?.LOCK_TTL_MS)||9e4),r=this.db.collection("summary_locks").doc(s),o=Date.now();try{return await this.db.runTransaction(async c=>{const u=await c.get(r);if(u.exists){const m=u.data()||{},p=String(m.ownerId||"");if(Number(m.expiresAt||0)>o&&p&&p!==i)return!1}return c.set(r,{id:s,dateKey:s,ownerId:i,createdAt:o,expiresAt:o+d},{merge:!0}),!0})===!0}catch(l){return console.warn("Failed to acquire summary lock:",l),!1}}async releaseSummaryLock(e,t){const a=String(e||"").trim(),s=String(t||"").trim();if(!a||!s||!this.db||!this.db.runTransaction||D?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING===!1)return;const i=this.db.collection("summary_locks").doc(a);try{await this.db.runTransaction(async d=>{const r=await d.get(i);if(!r.exists)return;const o=r.data()||{};String(o.ownerId||"")===s&&d.delete(i)})}catch(d){console.warn("Failed to release summary lock:",d)}}async getOrCreateDailySummary({dateKey:e,yesterdayKey:t,generatorFn:a,staleAfterMs:s,lockTtlMs:i}={}){const d=this.getISTDateKeys(),r=String(e||d.todayKey||"").trim(),o=String(t||d.yesterdayKey||"").trim();if(!r||typeof a!="function")throw new Error("getOrCreateDailySummary requires dateKey and generatorFn.");const l=Math.max(1e3,Number(s)||Number(D?.SUMMARY_POLICY?.STALENESS_MS)||864e5),c=Math.max(1e3,Number(i)||Number(D?.SUMMARY_POLICY?.LOCK_TTL_MS)||9e4),u=String(window.AppAuth?.getUser?.()?.id||`anon_${Math.random().toString(36).slice(2,10)}`),m=await this.getDailySummaryWithFallback({todayKey:r,yesterdayKey:o,staleAfterMs:l});if(m.summary&&m.source==="today"&&this.isSummaryFresh(m.summary,l))return{...m.summary,_source:"shared_today"};if(!this.shouldRecomputeNowIST(D?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST))return m.summary?{...m.summary,_source:`fallback_${m.source}`}:null;if(await this.acquireSummaryLock(r,u,c))try{const f={...await a()||{},generatedAt:Date.now(),generatedBy:u,version:this.getSummarySchemaVersion()};return await this.putDailySummary(r,f),await this.setLatestSuccessfulSummaryMeta({dateKey:r,generatedAt:f.generatedAt,version:f.version}),{dateKey:r,...f,_source:"generated"}}finally{await this.releaseSummaryLock(r,u)}const g=[350,700,1200,1800];for(const h of g){await this.sleep(h);const f=await this.getDailySummary(r);if(this.isSummaryFresh(f,l))return{...f,_source:"shared"}}return m.summary?{...m.summary,_source:`fallback_${m.source}`}:null}applyFilters(e,t=[]){let a=e;return(t||[]).forEach(s=>{!s||!s.field||!s.operator||(a=a.where(s.field,s.operator,s.value))}),a}applyOptions(e,t={}){let a=e;return t.orderBy&&(Array.isArray(t.orderBy)?t.orderBy:[t.orderBy]).forEach(i=>{i&&(typeof i=="string"?a=a.orderBy(i):i.field&&(a=a.orderBy(i.field,i.direction||"asc")))}),t.limit&&(a=a.limit(t.limit)),t.startAt!==void 0&&(a=a.startAt(t.startAt)),t.endAt!==void 0&&(a=a.endAt(t.endAt)),a}async getAll(e){try{const a=(await this.db.collection(e).get()).docs.map(s=>({...s.data(),id:s.id}));return this.track("getAll",e,a.length),a}catch(t){throw console.error(`Error getting all from ${e}:`,t),t}}async get(e,t){if(!t)return null;try{const a=String(t),i=await this.db.collection(e).doc(a).get();return i.exists?(this.track("get",e,1),{...i.data(),id:i.id}):(this.track("get",e,0),null)}catch(a){throw console.error(`Error getting ${t} from ${e}:`,a),a}}async add(e,t){if(t.id)return this.put(e,t);try{const a=await this.db.collection(e).add(t);return this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"add"}})),a.id}catch(a){throw console.error(`Error adding to ${e}:`,a),a}}async put(e,t){if(!t.id)throw new Error("Item must have an ID for 'put' operation.");try{const a=String(t.id);return await this.db.collection(e).doc(a).set(t,{merge:!0}),this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"put"}})),a}catch(a){throw console.error(`Error putting ${t.id} to ${e}:`,a),a}}async delete(e,t){if(t)try{const a=String(t);await this.db.collection(e).doc(a).delete(),this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"delete"}}))}catch(a){throw console.error(`Error deleting ${t} from ${e}:`,a),a}}async query(e,t,a,s){try{const d=(await this.db.collection(e).where(t,a,s).get()).docs.map(r=>({...r.data(),id:r.id}));return this.track("query",e,d.length),d}catch(i){throw console.error(`Error querying ${e}:`,i),i}}async queryMany(e,t=[],a={}){if(!this.getFlags().FF_READ_OPT_DB_QUERIES)return this.getAll(e);try{let i=this.db.collection(e);i=this.applyFilters(i,t),i=this.applyOptions(i,a);const r=(await i.get()).docs.map(o=>({...o.data(),id:o.id}));return this.track("queryMany",e,r.length),r}catch(i){return console.warn(`queryMany failed for ${e}, falling back to getAll`,i),this.getAll(e)}}async getManyByIds(e,t=[]){const a=Array.from(new Set((t||[]).filter(Boolean).map(d=>String(d))));if(!a.length)return[];const s=[];for(let d=0;d<a.length;d+=10)s.push(a.slice(d,d+10));return(await Promise.all(s.map(async d=>{try{const r=await this.queryMany(e,[{field:"id",operator:"in",value:d}]);return r&&r.length?r:Promise.all(d.map(o=>this.get(e,o)))}catch{return Promise.all(d.map(r=>this.get(e,r)))}}))).flat().filter(Boolean)}listenDoc(e,t,a){if(!this.db||!t)return null;const s=String(t);try{return this.db.collection(e).doc(s).onSnapshot(i=>{const d=i.exists?{...i.data(),id:i.id}:null;this.track("listen",e,1),a(d,i)},i=>{console.error(`Realtime listener error in ${e}/${s}:`,i)})}catch(i){return console.error(`Error setting up listener for ${e}/${s}:`,i),null}}listenQuery(e,t=[],a={},s){if(!this.db)return null;try{let i=this.db.collection(e);return i=this.applyFilters(i,t),i=this.applyOptions(i,a),i.onSnapshot(d=>{const r=d.docs.map(o=>({...o.data(),id:o.id}));this.track("listenQuery",e,r.length),s(r,d)},d=>{console.error(`Realtime query listener error in ${e}:`,d)})}catch(i){return console.warn(`listenQuery failed for ${e}, falling back to listen`,i),this.listen(e,s)}}listen(e,t){return this.db?this.db.collection(e).onSnapshot(a=>{const s=a.docs.map(i=>({...i.data(),id:i.id}));this.track("listen",e,s.length),t(s,a)},a=>{console.error(`Realtime listener error in ${e}:`,a)}):null}}const H=new ma;typeof window<"u"&&(window.AppDB=H);class fa{constructor(){this.currentUser=null,this.sessionKey="crwi_session_user",this.heartbeatInterval=null,this.userDocUnsubscribe=null}async init(){await H.init();const e=localStorage.getItem(this.sessionKey);e&&(this.currentUser=await H.get("users",e),this.currentUser&&(this.startHeartbeat(),this.startCurrentUserSync()))}async refreshCurrentUserFromDB(){const e=localStorage.getItem(this.sessionKey);if(!e)return this.currentUser=null,null;if(this.userDocUnsubscribe&&this.currentUser&&this.currentUser.id===e)return this.currentUser;const t=await H.get("users",e);return this.currentUser=t||null,this.currentUser}async login(e,t){const a=H.getCached?await H.getCached(H.getCacheKey("authUsers","users",{mode:"login"}),D?.READ_CACHE_TTLS?.users||6e4,()=>H.getAll("users")):await H.getAll("users"),s=e.trim().toLowerCase(),i=t.trim(),d=a.find(r=>{const o=(r.username||"").toLowerCase().trim(),l=(r.email||"").toLowerCase().trim();return(o===s||l===s)&&r.password.trim()===i});return d?(this.currentUser=d,localStorage.setItem(this.sessionKey,d.id),this.startHeartbeat(),this.startCurrentUserSync(),!0):(console.warn("Login failed: invalid credentials."),!1)}logout(){this.stopHeartbeat(),this.stopCurrentUserSync(),this.currentUser=null,localStorage.removeItem(this.sessionKey),window.location.reload()}getUser(){return this.currentUser}async updateUser(e){const t=await H.get("users",e.id);if(!t)return!1;const a={...t,...e};return e.isAdmin===!0||e.isAdmin==="true"?a.isAdmin=!0:a.isAdmin=!1,a.role=e.role||t.role||"Employee",console.log(`Auth: User ${a.id} update - Role: ${a.role}, Admin: ${a.isAdmin}`),e.name&&e.name!==t.name&&!e.avatar&&(a.avatar=`https://ui-avatars.com/api/?name=${e.name}&background=random&color=fff`),await H.put("users",a),this.currentUser&&this.currentUser.id===a.id&&(this.currentUser=a),!0}startHeartbeat(){if(!(D&&D.READ_OPT_FLAGS||{}).ENABLE_PRESENCE_HEARTBEAT){this.stopHeartbeat();return}this.heartbeatInterval&&clearInterval(this.heartbeatInterval);const t=async()=>{if(this.currentUser&&H)try{await H.put("users",{id:this.currentUser.id,lastSeen:Date.now()})}catch(a){console.warn("Heartbeat update failed:",a)}};t(),this.heartbeatInterval=setInterval(t,12e4),console.log("Presence Heartbeat started.")}stopHeartbeat(){this.heartbeatInterval&&(clearInterval(this.heartbeatInterval),this.heartbeatInterval=null,console.log("Presence Heartbeat stopped."))}startCurrentUserSync(){this.stopCurrentUserSync();const e=localStorage.getItem(this.sessionKey);if(!(!e||!window.AppFirestore))try{this.userDocUnsubscribe=window.AppFirestore.collection("users").doc(String(e)).onSnapshot(t=>{if(!t.exists){this.currentUser=null;return}const a={...t.data(),id:t.id};this.currentUser=a,window.dispatchEvent(new CustomEvent("app:user-sync",{detail:a}))},t=>{console.warn("Current user realtime sync failed:",t)})}catch(t){console.warn("Failed to start current user sync:",t)}}stopCurrentUserSync(){typeof this.userDocUnsubscribe=="function"&&this.userDocUnsubscribe(),this.userDocUnsubscribe=null}}const Z=new fa;typeof window<"u"&&(window.AppAuth=Z);class ya{async getStatus(){const e=await(Z.refreshCurrentUserFromDB?Z.refreshCurrentUserFromDB():Z.getUser());if(!e)return{status:"out",lastCheckIn:null};if(e.status==="in"&&e.lastCheckIn)try{const t=new Date(e.lastCheckIn),a=new Date,s=t.toISOString().split("T")[0],i=a.toISOString().split("T")[0];if(s<i)return{status:"out",lastCheckIn:null,staleSession:!0}}catch(t){console.warn("Date parsing error in getStatus:",t)}return{status:e.status||"out",lastCheckIn:e.lastCheckIn}}async checkIn(e,t,a="Unknown Location"){const s=await(Z.refreshCurrentUserFromDB?Z.refreshCurrentUserFromDB():Z.getUser());if(!s)throw new Error("User not authenticated");let i=!1,d="";if(s.status==="in"&&s.lastCheckIn){const o=new Date(s.lastCheckIn),l=new Date,c=`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`,u=`${l.getFullYear()}-${String(l.getMonth()+1).padStart(2,"0")}-${String(l.getDate()).padStart(2,"0")}`;if(c<u){const p=new Date(o.getTime()+288e5),g=this.evaluateAttendanceStatus(o,288e5),h=s.currentLocation||s.lastLocation||null,f=new Date().toISOString(),w={id:String(Date.now()),user_id:s.id,date:p.toISOString().split("T")[0],checkIn:o.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:p.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),duration:this.msToTime(288e5),durationMs:288e5,type:g.status,dayCredit:g.dayCredit,lateCountable:g.lateCountable,extraWorkedMs:g.extraWorkedMs||0,policyVersion:"v2",location:h?.address||"Missed checkout session",lat:h?.lat??null,lng:h?.lng??null,checkOutLocation:"System closure on next check-in",outLat:null,outLng:null,workDescription:"System closure: previous open session was closed at fixed 8 credited hours.",locationMismatched:!1,locationExplanation:"",activityScore:0,autoCheckout:!1,autoCheckoutReason:"",autoCheckoutAt:null,autoCheckoutRequiresApproval:!1,autoCheckoutExtraApproved:null,missedCheckoutResolved:!0,missedCheckoutPolicy:"fixed_8h_on_next_checkin",systemClosedAt:f,synced:!1};await H.add("attendance",w),s.status="out",s.lastCheckOut=p.getTime(),s.lastLocation=h,s.lastCheckOutLocation={lat:null,lng:null,address:"System closure on next check-in"},s.locationMismatched=!1,s.lastCheckIn=null,s.currentLocation=null,i=!0,d="Previous open session was closed by policy at 8 credited hours because checkout was missed."}else return{ok:!1,conflict:!0,message:"Status updated from another device."}}s.status="in",s.lastCheckIn=Date.now();const r=a&&a!=="Unknown Location"?a:e&&t?`Lat: ${Number(e).toFixed(4)}, Lng: ${Number(t).toFixed(4)}`:"Unknown Location";return s.currentLocation={lat:e,lng:t,address:r},await H.put("users",s),{ok:!0,resolvedMissedCheckout:i,noticeMessage:d}}async checkOut(e="",t=null,a=null,s="Detected Location",i=!1,d="",r={}){const o=await(Z.refreshCurrentUserFromDB?Z.refreshCurrentUserFromDB():Z.getUser());if(!o||o.status!=="in")return{ok:!1,conflict:!0,message:"Status updated from another device."};const l=new Date(o.lastCheckIn),c=r.checkOutTime?new Date(r.checkOutTime):new Date,u=c-l,m=this.evaluateAttendanceStatus(l,u),p=window.AppActivity?window.AppActivity.getStats():{score:0},g={id:String(Date.now()),user_id:o.id,date:c.toISOString().split("T")[0],checkIn:l.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),duration:this.msToTime(u),durationMs:u,type:m.status,dayCredit:m.dayCredit,lateCountable:m.lateCountable,extraWorkedMs:m.extraWorkedMs||0,policyVersion:"v2",location:o.currentLocation?.address||"Checked In Location",lat:o.currentLocation?.lat,lng:o.currentLocation?.lng,checkOutLocation:s||(t&&a?`Lat: ${Number(t).toFixed(4)}, Lng: ${Number(a).toFixed(4)}`:"Detected Location"),outLat:t,outLng:a,workDescription:e||"",locationMismatched:i,locationExplanation:d||"",activityScore:p.score,autoCheckout:!!r.autoCheckout,autoCheckoutReason:r.autoCheckoutReason||"",autoCheckoutAt:r.autoCheckoutAt||null,autoCheckoutRequiresApproval:!!r.autoCheckoutRequiresApproval,autoCheckoutExtraApproved:r.autoCheckoutExtraApproved??null,overtimePrompted:!!r.overtimePrompted,overtimeReasonTag:r.overtimeReasonTag||"",overtimeExplanation:r.overtimeExplanation||"",overtimeCappedToEightHours:!!r.overtimeCappedToEightHours,entrySource:"checkin_checkout",attendanceEligible:!0,synced:!1};return await H.add("attendance",g),o.status="out",o.lastCheckOut=Date.now(),o.lastLocation=o.currentLocation,o.lastCheckOutLocation={lat:t,lng:a,address:s},o.locationMismatched=i,o.lastCheckIn=null,o.currentLocation=null,await H.put("users",o),window.AppActivity&&window.AppActivity.stop(),{ok:!0,conflict:!1}}async addAdminLog(e,t){const a={id:String(Date.now()),user_id:e,...t,isManualOverride:t.isManualOverride===!0,entrySource:t.entrySource||"admin_override",attendanceEligible:Object.prototype.hasOwnProperty.call(t,"attendanceEligible")?t.attendanceEligible===!0:!0,synced:!1};return await H.add("attendance",a),a}async deleteLog(e){if(e)return await H.delete("attendance",e),!0}async updateLog(e,t){if(!e)return;const a=await H.get("attendance",e);if(!a)throw new Error("Log not found");const s={...a,...t,isManualOverride:Object.prototype.hasOwnProperty.call(t,"isManualOverride")?t.isManualOverride===!0:!!a.isManualOverride,entrySource:t.entrySource||a.entrySource||"admin_override",attendanceEligible:Object.prototype.hasOwnProperty.call(t,"attendanceEligible")?t.attendanceEligible===!0:Object.prototype.hasOwnProperty.call(a,"attendanceEligible")?a.attendanceEligible===!0:!0,id:e};return await H.put("attendance",s),s}async addManualLog(e){const t=Z.getUser();if(!t)return;const a=this.buildDateTime(e.date,e.checkIn),s=this.buildDateTime(e.date,e.checkOut),i=a&&s?s-a:0,d=this.evaluateAttendanceStatus(a||new Date,i),r=String(e.type||"").trim(),o=!r||r==="Manual"?d.status:r,l=Object.prototype.hasOwnProperty.call(e,"attendanceEligible")?e.attendanceEligible===!0:o!=="Work Log",c=l?o:r||"Work Log",u={id:String(Date.now()),user_id:t.id,...e,type:c,durationMs:typeof e.durationMs=="number"?e.durationMs:i,dayCredit:l?typeof e.dayCredit=="number"?e.dayCredit:d.dayCredit:0,lateCountable:l&&(e.lateCountable===!0||c==="Late"),extraWorkedMs:l?typeof e.extraWorkedMs=="number"?e.extraWorkedMs:d.extraWorkedMs||0:0,entrySource:e.entrySource||"staff_manual_work",attendanceEligible:l,synced:!1};return await H.add("attendance",u),u}async getLogs(e=null){const t=e||Z.getUser()?.id;if(!t)return[];try{const a=window.AppFirestore;if(!a)return[];let s=a.collection("attendance");s=s.where("user_id","==",t);const r=(await s.get()).docs.map(c=>({...c.data(),id:c.id})).sort((c,u)=>u.id-c.id).map(c=>((!c.location||c.location==="Unknown Location")&&c.lat&&c.lng&&(c.location=`Lat: ${Number(c.lat).toFixed(4)}, Lng: ${Number(c.lng).toFixed(4)}`),c)),o=new Set,l=r.filter(c=>{const u=`${c.date}|${c.checkIn}`;return o.has(u)?!1:(o.add(u),!0)});try{const c=await H.get("users",t);if(c&&c.status==="in"&&c.lastCheckIn){const u=new Date(c.lastCheckIn),m={id:"active_now",date:u.toLocaleDateString(),checkIn:u.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:"Active Now",duration:"Working...",type:"Office",location:c.currentLocation?.address&&c.currentLocation.address!=="Unknown Location"?c.currentLocation.address:c.currentLocation?.lat&&c.currentLocation?.lng?`Lat: ${Number(c.currentLocation.lat).toFixed(4)}, Lng: ${Number(c.currentLocation.lng).toFixed(4)}`:"Current Session"};l.unshift(m)}}catch(c){console.warn("Could not fetch active status for logs",c)}return l.slice(0,50)}catch(a){return console.warn("Optimized log fetch failed, falling back to simple filter",a),[]}}async getAllLogs(){return await H.getAll("attendance")}msToTime(e){let t=Math.floor(e/6e4%60);return`${Math.floor(e/(1e3*60*60)%24)}h ${t}m`}buildDateTime(e,t){if(!e||!t)return null;const a=`${e}T${t}:00`,s=new Date(a);return Number.isNaN(s.getTime())?null:s}normalizeType(e){const t=String(e||"").trim();return!t||t==="Manual"?"Present":t==="Manual/WFH"?"Work - Home":t}getDayCredit(e){const t=this.normalizeType(e);return t==="Half Day"?.5:t==="Absent"?0:t==="Present"||t==="Present (Late Waived)"||t==="Late"||t==="Work - Home"||t==="On Duty"?1:0}evaluateAttendanceStatus(e,t=0){if(!e||Number.isNaN(e.getTime()))return{status:"Absent",dayCredit:0,lateCountable:!1,extraWorkedMs:0};if(e.getDay()===0)return{status:"Present",dayCredit:1,lateCountable:!1,extraWorkedMs:0};const s=e.getHours()*60+e.getMinutes(),i=Math.max(0,t)/(1e3*60*60),d=(typeof D<"u"&&D?D.LATE_CUTOFF_MINUTES:555)||555,r=(typeof D<"u"&&D?D.MINOR_LATE_END_MINUTES:615)||615,o=(typeof D<"u"&&D?D.LATE_END_MINUTES:720)||720,l=(typeof D<"u"&&D?D.POST_NOON_END_MINUTES:810)||810,c=(typeof D<"u"&&D?D.AFTERNOON_START_MINUTES:720)||720;let u="Present",m=!1,p=0;return s>=c?(i>=8?u="Present":i>=4?u="Half Day":u="Absent",i>4&&(p=Math.max(0,t-14400*1e3)),{status:u,dayCredit:this.getDayCredit(u),lateCountable:!1,extraWorkedMs:p}):(s>l?u="Absent":s>o||s>r?u=i>=4?"Half Day":"Absent":s>d?i>=8?u="Present (Late Waived)":(u="Late",m=!0):i>=8?u="Present":i>=4?u="Half Day":u="Absent",{status:u,dayCredit:this.getDayCredit(u),lateCountable:m,extraWorkedMs:p})}calculateStatus(e){return this.evaluateAttendanceStatus(e,480*60*1e3).status}}const Tt=new ya;typeof window<"u"&&(window.AppAttendance=Tt);function x(n){return n==null?"":String(n).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Lt(n){return x(n)}function ga(n){return String(n??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,"\\n").replace(/\r/g,"\\r")}function Le(n,e="https://via.placeholder.com/24"){return!n||typeof n!="string"?e:n.startsWith("http")||n.startsWith("data:")||n.startsWith("/")||n.startsWith("./")?n:e}function rt(n){if(!n)return"Never";const e=new Date(n);if(isNaN(e.getTime()))return"Unknown";const t=Math.floor((new Date-e)/1e3);if(t<60)return"just now";let a=t/31536e3;return a>1?Math.floor(a)+" years ago":(a=t/2592e3,a>1?Math.floor(a)+" months ago":(a=t/86400,a>1?Math.floor(a)+" days ago":(a=t/3600,a>1?Math.floor(a)+" hours ago":(a=t/60,a>1?Math.floor(a)+" mins ago":Math.floor(t)+" seconds ago"))))}typeof window<"u"&&(window.safeHtml=x,window.safeAttr=Lt,window.safeJsStr=ga,window.safeUrl=Le,window.timeAgo=rt);function ha(n,e=!0){const t=Math.max(0,Math.min(5,Number(n)||0)),a=Math.floor(t),s=t-a>=.5,i=5-a-(s?1:0);let d='<div class="star-rating-display">';for(let r=0;r<a;r++)d+='<i class="fa-solid fa-star star-filled"></i>';s&&(d+='<i class="fa-solid fa-star-half-stroke star-filled"></i>');for(let r=0;r<i;r++)d+='<i class="fa-regular fa-star star-empty"></i>';return e&&(d+=`<span class="star-rating-number">${t.toFixed(1)}</span>`),d+="</div>",d}function It(n,e=!0){const t=String(n||"to-be-started").toLowerCase();let a="To Be Started",s="fa-circle-dot",i="status-badge-to-be-started";return t==="in-process"||t==="in-progress"?(a="In Progress",s="fa-spinner fa-spin",i="status-badge-in-process"):t==="completed"?(a="Completed",s="fa-circle-check",i="status-badge-completed"):t==="overdue"?(a="Overdue",s="fa-circle-exclamation",i="status-badge-overdue"):(t==="not-completed"||t==="cancelled")&&(a="Not Completed",s="fa-circle-xmark",i="status-badge-not-completed"),`
        <div class="status-badge ${i}">
            ${e?`<i class="fa-solid ${s}"></i>`:""}
            <span>${a}</span>
        </div>
    `}const dt=n=>{const e=new Date,t=window.AppAuth?.getUser();window.app_calMonth===void 0&&(window.app_calMonth=e.getMonth()),window.app_calYear===void 0&&(window.app_calYear=e.getFullYear());const a=window.app_calYear,s=window.app_calMonth,i=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],d=new Date(a,s,1).getDay(),r=new Date(a,s+1,0).getDate();let o="";for(let l=0;l<d;l++)o+='<div class="cal-day empty"></div>';for(let l=1;l<=r;l++){const c=`${a}-${String(s+1).padStart(2,"0")}-${String(l).padStart(2,"0")}`,u=typeof window.app_getDayEvents=="function"?window.app_getDayEvents(c,n):[],m=u.some(w=>w.type==="leave"),p=u.some(w=>w.type==="event"),g=u.some(w=>w.type==="work"),h=l===e.getDate()&&s===e.getMonth()&&a===e.getFullYear(),f=window.AppAnalytics?window.AppAnalytics.getDayType(new Date(a,s,l)):"Work Day";o+=`
            <div class="cal-day ${h?"today":""} ${m?"has-leave":""} ${p?"has-event":""} ${g?"has-work":""} ${f==="Holiday"?"is-holiday":""} ${f==="Half Day"?"is-half-day":""}" 
                    onclick="window.app_openDayPlan('${c}')" style="cursor:pointer;" title="${f}">
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
                ${o}
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
    `},ve={controllers:new WeakMap,elements:new Set};function Ie(){return window.app_staffActivityState||(window.app_staffActivityState={selectedMonth:new Date().toISOString().slice(0,7),sortKey:"date-desc",logs:[]}),window.app_staffActivityState}let ft=!1;function wa(){ft||typeof document>"u"||(ft=!0,document.addEventListener("click",async n=>{const e=n.target&&n.target.closest?n.target.closest(".dashboard-leave-btn[data-action][data-leave-id]"):null;if(!e)return;n.preventDefault();const t=String(e.dataset.action||""),a=String(e.dataset.leaveId||"");if(a)try{if(t==="export"){window.AppLeaves?.exportLeave&&await window.AppLeaves.exportLeave(a);return}if(t==="comment"){window.AppLeaves?.commentLeave&&await window.AppLeaves.commentLeave(a);return}if(t==="approve"||t==="reject"){const s=t==="approve"?"Approved":"Rejected";window.AppLeaves?.updateLeaveStatus&&await window.AppLeaves.updateLeaveStatus(a,s),window.app_refreshCurrentPage&&await window.app_refreshCurrentPage()}}catch(s){console.error("Dashboard leave action failed:",s)}}))}function Xe(n,e={}){if(!n)return`
            <div class="card dashboard-hero-stats-card hero-slot">
                <div class="dashboard-hero-stats-head">
                    <div class="hero-label-badge">Hero of the Week</div>
                </div>
                <div class="dashboard-activity-empty">
                    ${e.lowRead?"Loading stats...":"No hero data available."}
                </div>
            </div>`;const{user:t,stats:a}=n,s=Number(a?.daysPresent??a?.days??0),i=Number(a?.totalHours??a?.hours??0),d=Number(a?.lateCount??a?.late??0);return`
        <div class="card dashboard-hero-stats-card hero-slot ${e.source==="generated"?"is-new-summary":""}">
            <div class="dashboard-hero-stats-head">
                <div class="hero-label-badge">Hero of the Week</div>
                ${e.generatedAt?`<span class="hero-sync-time" title="Source: ${e.source}">Synced ${rt(e.generatedAt)}</span>`:""}
            </div>
            <div class="dashboard-hero-stats-body">
                <div class="hero-profile">
                    <img src="${Le(t.avatar)}" alt="${x(t.name)}" class="hero-avatar">
                    <div class="hero-info">
                        <div class="hero-name">${x(t.name)}</div>
                        <div class="hero-role">${x(t.role||"Staff")}</div>
                    </div>
                </div>
                <div class="hero-metrics">
                    <div class="hero-metric">
                        <div class="hero-metric-value">${s}</div>
                        <div class="hero-metric-label">Days</div>
                    </div>
                    <div class="hero-metric">
                        <div class="hero-metric-value">${i}h</div>
                        <div class="hero-metric-label">Hours</div>
                    </div>
                    <div class="hero-metric">
                        <div class="hero-metric-value">${d}</div>
                        <div class="hero-metric-label">Lates</div>
                    </div>
                </div>
            </div>
        </div>`}function Mt(n,e=[],t=null,a=[]){const s=new Date,i=new Date(s);i.setDate(i.getDate()-180);const d=i.toISOString().split("T")[0],r=s.toISOString().split("T")[0],o=t?t.id:window.AppAuth.getUser().id,l=t&&t.name||window.AppAuth.getUser().name;return`
        <div class="card dashboard-worklog-card">
            <div class="dashboard-worklog-head">
                 <h4>Work Log <span class="dashboard-worklog-staff">(${x(l)})</span></h4>
                 <span>Ongoing & Historical Tasks</span>
            </div>
             <div class="dashboard-worklog-filter-row">
                <input type="date" id="act-start" value="${d}" class="dashboard-worklog-date-input">
                <span class="dashboard-worklog-to">to</span>
                <input type="date" id="act-end" value="${r}" class="dashboard-worklog-date-input">
                <button onclick="window.app_filterActivity()" class="dashboard-worklog-go-btn">Go</button>
            </div>
            <div id="activity-list" class="dashboard-worklog-list">
                ${Et(n,d,r,o,e,a)}
            </div>
        </div>
    `}function Et(n,e,t,a,s=[],i=[]){const d=new Date(e),r=new Date(t);r.setHours(23,59,59,999);const o=n.filter(f=>{const w=new Date(f.date),v=f.workDescription||(f.location&&!f.location.startsWith("Lat:")?f.location:"Standard Activity");return f._displayDesc=v,f._isCollab=!1,f._sortTime=f.checkOut||"00:00",w>=d&&w<=r}),l=[];s.forEach(f=>{const w=new Date(f.date);if(w<d||w>r)return;f.plans.filter(b=>b.tags&&b.tags.some(k=>k.id===a&&k.status==="accepted")).forEach(b=>{l.push({date:f.date,workDescription:`🤝 Collaborated with ${f.userName}: ${b.task}${b.subPlans&&b.subPlans.length>0?` (Sub-tasks: ${b.subPlans.join(", ")})`:""}`,checkOut:"Planned / Accepted",_displayDesc:`🤝 Collaborated with ${f.userName}: ${b.task}${b.subPlans&&b.subPlans.length>0?` (Sub-tasks: ${b.subPlans.join(", ")})`:""}`,_isCollab:!0,_sortTime:"23:59"})})});const c=[];i.forEach(f=>{(f.actionItems||[]).forEach(w=>{if(w.assignedTo!==a)return;const v=w.dueDate||f.date,b=new Date(v);b<d||b>r||c.push({date:v,workDescription:`📋 Meeting Task: ${w.task} (from ${f.title})`,status:w.status||"pending",checkOut:"Action Item",_displayDesc:`📋 Meeting Task: ${w.task} (from ${f.title})`,_isCollab:!1,_isMinute:!0,_meetingId:f.id,_sortTime:"09:00"})})});const u=[...o,...l,...c].sort((f,w)=>{const v=new Date(w.date)-new Date(f.date);return v!==0?v:w._sortTime.localeCompare(f._sortTime)});if(u.length===0)return'<div class="dashboard-activity-empty">No activity descriptions found.</div>';let m="",p="";const g=window.AppAuth.getUser(),h=window.app_hasPerm("dashboard","admin",g);return u.forEach(f=>{f.date!==p&&(m+=`<div class="dashboard-activity-date">${f.date}</div>`,p=f.date);const v=f._isCollab?"#10b981":f._isMinute?"#6366f1":"#e5e7eb",b=f._isCollab?"dashboard-activity-item-collab":f._isMinute?"dashboard-activity-item-minute":"";let k="";if(f._isCollab||f.status||f._isMinute){const y=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(f.date,f.status):f.status||"to-be-started";k=`
                <div class="dashboard-activity-status-row">
                    ${It(y)}
                    ${h||f._isMinute?`<div class="dashboard-activity-edit-wrap"><button onclick="${f._isMinute?`window.app_openMinuteDetails('${f._meetingId}')`:`window.app_openDayPlan('${f.date}', '${a}')`}" class="dashboard-activity-edit-btn" title="View/Edit"><i class="fa-solid fa-${f._isMinute?"eye":"pen-to-square"}"></i></button></div>`:""}
                </div>`}m+=`<div class="dashboard-activity-item ${b}" style="border-left-color:${v};"><div class="dashboard-activity-desc">${x(f._displayDesc)}</div>${k}<div class="dashboard-activity-meta">${x(f.checkOut||(f.status==="completed"?"Completed":"Planned Activity"))}</div></div>`}),m}function Ct(n){const e=Ie();e.logs=Array.isArray(n)?n:[],setTimeout(()=>{const s=document.getElementById("staff-activity-list");s&&qt(s)},0);const t=Ht(8),a=Ee(e.selectedMonth);return`
        <div class="card dashboard-team-activity-card">
            <div class="dashboard-team-activity-head">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <h4>Team Activity</h4>
                    <button onclick="window.app_expandTeamActivity()" title="Expand" style="background:none; border:none; cursor:pointer; color:#6b7280;"><i class="fa-solid fa-expand"></i></button>
                </div>
                <span id="staff-activity-range-label">${x(a)}</span>
            </div>
            <div class="dashboard-team-activity-filters dashboard-team-activity-filters-compact">
                <select class="dashboard-team-select" onchange="window.app_setStaffActivityMonth(this.value)">
                    ${t.map(s=>`<option value="${s.key}" ${s.key===e.selectedMonth?"selected":""}>${x(s.label)}</option>`).join("")}
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
                ${Me(e.logs,e.sortKey)}
            </div>
        </div>`}function Me(n,e){const t=va(n);if(t.length===0)return'<div class="dashboard-activity-empty">No team activities found for the selected month.</div>';const a=ba(t,e),s=a.filter(d=>d._taskStatus==="completed"),i=a.filter(d=>d._taskStatus!=="completed");return`
        <div class="dashboard-team-activity-split-grid">
            ${et("Completed",s,"No completed tasks in this month.")}
            ${et("In Progress / Incomplete",i,"No in-progress or incomplete tasks in this month.")}
        </div>
    `}function et(n,e,t){const a=window.AppAuth.getUser(),s=window.app_hasPerm("dashboard","admin",a),i=e.length===0?`<div class="dashboard-activity-empty">${t}</div>`:e.map(d=>{const r=a&&d.userId===a.id,o=s||r,l=`
                <div class="dashboard-activity-status-row">
                    ${It(d._taskStatus)}
                    ${o?`<div class="dashboard-activity-edit-wrap"><button onclick="window.app_openDayPlan('${d.date}', '${d.userId||""}')" class="dashboard-activity-edit-btn" title="Edit/Reassign"><i class="fa-solid fa-pen-to-square"></i></button></div>`:""}
                </div>`;return`
                <div class="dashboard-staff-activity-item dashboard-staff-activity-item-compact">
                    <div class="dashboard-staff-name">${x(d.staffName||"Unknown Staff")}<span class="dashboard-team-activity-item-date">${d.date||""}</span></div>
                    <div class="dashboard-activity-desc dashboard-staff-activity-desc">${x(d._displayDesc||"Work Plan Task")}</div>
                    ${l}
                    <div class="dashboard-activity-meta">${d._taskStatus==="completed"?"Completed":"Work Plan"}</div>
                </div>`}).join("");return`
        <div class="dashboard-team-activity-col">
            <div class="dashboard-team-activity-col-head">
                <span>${x(n)}</span>
                <span class="dashboard-team-activity-count">${e.length}</span>
            </div>
            <div class="dashboard-team-activity-col-list">${i}</div>
        </div>
    `}function Ae(n,e,t){const a=t.penalty>0?'<span class="dashboard-penalty-badge">Penalty Applies</span>':"";return`
        <div class="card dashboard-stats-card">
            <div class="dashboard-stats-card-head">
                <div>
                    <h4 class="dashboard-stats-card-title">${x(n)}</h4>
                    <span class="dashboard-stats-card-subtitle">${x(e)}</span>
                </div>
                ${a}
            </div>

            <div class="dashboard-stats-metric-grid">
                 <div class="dashboard-stats-metric dashboard-stats-metric-late">
                    <div class="dashboard-stats-metric-value">${x(t.totalLateDuration)}</div>
                    <div class="dashboard-stats-metric-label">Late</div>
                 </div>
                 <div class="dashboard-stats-metric dashboard-stats-metric-extra">
                    <div class="dashboard-stats-metric-value">${x(t.totalExtraDuration)}</div>
                    <div class="dashboard-stats-metric-label">Extra</div>
                 </div>
            </div>

            <div class="dashboard-breakdown-grid">
                ${Pt(t.breakdown)}
            </div>
        </div>
    `}function Pt(n){const e=Object.entries(n),t={Present:{color:"#166534",bg:"#f0fdf4",label:"Office"},"Work - Home":{color:"#0369a1",bg:"#e0f2fe",label:"WFH"},Training:{color:"#4338ca",bg:"#eef2ff",label:"Training"},Late:{color:"#c2410c",bg:"#fff7ed",label:"Late"},"Sick Leave":{color:"#991b1b",bg:"#fef2f2",label:"Sick"},"Casual Leave":{color:"#9d174d",bg:"#fce7f3",label:"Casual"},"Earned Leave":{color:"#be185d",bg:"#fdf2f8",label:"Earned"},"Paid Leave":{color:"#be123c",bg:"#ffe4e6",label:"Paid"},"Maternity Leave":{color:"#a21caf",bg:"#fae8ff",label:"Maternity"},Absent:{color:"#7f1d1d",bg:"#fee2e2",label:"Absent"},"Early Departure":{color:"#991b1b",bg:"#fff1f2",label:"Early Exit"},Holiday:{color:"#1e293b",bg:"#f1f5f9",label:"Holiday"},"National Holiday":{color:"#334155",bg:"#f8fafc",label:"Nat. Hol"},"Regional Holidays":{color:"#475569",bg:"#f8fafc",label:"Reg. Hol"}};return e.map(([a,s])=>{const i=t[a]||{color:"#374151",bg:"#f3f4f6",label:a};return s===0&&!["Present","Late","Absent","Early Departure"].includes(a)?"":`
            <div class="dashboard-breakdown-item" style="background:${i.bg};">
                <span class="dashboard-breakdown-count" style="color:${i.color}">${s}</span>
                <span class="dashboard-breakdown-label" style="color:${i.color};">${i.label}</span>
            </div>
         `}).join("")}function Nt(n){return!n||n.length===0?`
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
                            <div class="dashboard-leave-name">${x(e.userName||"Staff")}</div>
                            <div class="dashboard-leave-type">${x(e.type)} • ${e.daysCount} days</div>
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
        </div>`}function Bt(n,e={}){const t=e.title||"Leave History",a=e.subtitle||"Past records";if(!n||n.length===0)return`
            <div class="card dashboard-leave-history-card">
                <div class="dashboard-leave-history-head"><h4>${x(t)}</h4><span>${x(a)}</span></div>
                <div class="dashboard-activity-empty">No leave history found.</div>
            </div>`;const s=i=>i==="Approved"?"#166534":i==="Rejected"?"#b91c1c":"#854d0e";return`
        <div class="card dashboard-leave-history-card">
            <div class="dashboard-leave-history-head">
                <h4>${x(t)}</h4>
                <span>${x(a)}</span>
            </div>
            <div class="dashboard-leave-history-list">
                ${n.map(i=>`
                    <div class="dashboard-leave-history-row">
                        <div class="dashboard-leave-history-main">
                            <div class="dashboard-leave-history-user">${x(i.userName||"Staff")}</div>
                            <div class="dashboard-leave-history-type">${x(i.type)} • ${i.daysCount} days</div>
                            <div class="dashboard-leave-history-date">${i.startDate} to ${i.endDate}</div>
                        </div>
                        <div class="dashboard-leave-history-status">
                            <span class="status-pill" style="background: ${s(i.status)}15; color: ${s(i.status)}">${x(i.status)}</span>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>`}function Ot(n,e){return""}function Ut(n){const e=(n||[]).filter(t=>!(t.type==="tag"||t.type==="task"||t.type==="mention")||t.dismissedAt||t.read?!1:String(t.status||"pending").toLowerCase()==="pending");return e.length===0?"":`
        <div class="card full-width dashboard-tagged-card">
            <div class="dashboard-tagged-head"><h4>Tagged Items</h4><span>Pending approvals</span></div>
            <div class="dashboard-tagged-list">
                ${e.map(t=>`
                    <div class="dashboard-tagged-item">
                        <div class="dashboard-tagged-main">
                            <div class="dashboard-tagged-title">${x(t.title||"Tagged item")}</div>
                            <div class="dashboard-tagged-desc">${x(t.description||t.message||"")}</div>
                            <div class="dashboard-tagged-meta">Tagged by ${x(t.taggedByName||"Staff")} • ${rt(t.taggedAt||t.date)}</div>
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
    `}function tt(n,e,t){if(!n||n.length===0)return`
            <div class="card dashboard-staff-directory-card">
                <div class="dashboard-staff-directory-head"><h4>Staff Directory</h4><span>Quick actions</span></div>
                <div class="dashboard-staff-directory-list">
                    <div class="dashboard-activity-empty">No staff loaded.</div>
                </div>
            </div>`;const a=Date.now(),s=d=>{const r=(d.notifications||[]).map(o=>new Date(o.taggedAt||o.date||o.respondedAt||0).getTime()).filter(Boolean);return r.length?Math.max(...r):0};return`
        <div class="card dashboard-staff-directory-card">
            <div class="dashboard-staff-directory-head"><h4>Staff Directory</h4><span>Message or assign</span></div>
            <div class="dashboard-staff-directory-list">
                ${n.filter(d=>d.id!==t.id).sort((d,r)=>s(r)-s(d)||d.name.localeCompare(r.name)).map(d=>{const r=s(d);return`
                <div class="dashboard-staff-row ${r&&a-r<12e4?"dashboard-staff-row-new":""}">
                    <div class="dashboard-staff-meta">
                        <div class="dashboard-staff-avatar">
                            <img src="${Le(d.avatar)}" alt="${x(d.name)}">
                        </div>
                        <div class="dashboard-staff-text">
                            <div class="dashboard-staff-name">${x(d.name)}</div>
                            <div class="dashboard-staff-role">${x(d.role||"Staff")}</div>
                        </div>
                    </div>
                    <div class="dashboard-staff-actions">
                        <button class="dashboard-staff-btn" onclick="window.location.hash = 'staff-directory'; window.app_openStaffThread('${d.id}')" title="Message"><i class="fa-solid fa-message"></i></button>
                    </div>
                </div>
            `}).join("")}
            </div>
        </div>`}async function Rt(){const n=window.AppAuth.getUser(),e=window.app_hasPerm("dashboard","view",n),t=window.app_hasPerm("dashboard","admin",n),s=Ie().selectedMonth,i=window.AppDB?.getISTDateKeys?window.AppDB.getISTDateKeys():{todayKey:new Date().toISOString().split("T")[0],yesterdayKey:new Date(Date.now()-1440*60*1e3).toISOString().split("T")[0]},d=i.todayKey,r=i.yesterdayKey,o=!!D?.READ_OPT_FLAGS?.FF_SHARED_DAILY_SUMMARY,l=e&&window.app_selectedSummaryStaffId?window.app_selectedSummaryStaffId:n.id;console.time("DashboardFetch");const c=o?Promise.resolve(null):window.AppDB.getOrGenerateSummary(`hero_stats_${d}`,()=>window.AppAnalytics.getHeroOfTheWeek(),1440*60*1e3),u=o?Promise.resolve([]):window.AppDB.getOrGenerateSummary(`team_activity_${s}_${d}`,()=>window.AppAnalytics.getAllStaffActivities({mode:"month",month:s,scope:"work"})),m=o&&window.AppDB.getOrCreateDailySummary?window.AppDB.getOrCreateDailySummary({dateKey:d,yesterdayKey:r,staleAfterMs:D?.SUMMARY_POLICY?.STALENESS_MS,lockTtlMs:D?.SUMMARY_POLICY?.LOCK_TTL_MS,generatorFn:()=>window.AppAnalytics.buildDailyDashboardSummary({dateKey:d,selectedMonth:s})}).catch(Y=>(console.warn("Daily summary fetch/generation failed:",Y),null)):null,p=m?Promise.race([m,new Promise(Y=>setTimeout(()=>Y(null),1500))]):Promise.resolve(null);if(!window._dashboardRefreshScheduled){window._dashboardRefreshScheduled=!0;try{const Y=window.AppDB.getIstNow(),te=new Date(Y);te.setDate(te.getDate()+1),te.setHours(0,0,5,0);const ce=te.getTime()-Y.getTime();setTimeout(()=>{Rt().then(pe=>{const se=document.getElementById("page-content");se&&(se.innerHTML=pe)}),window._dashboardRefreshScheduled=!1},Math.max(0,ce))}catch(Y){console.warn("failed to schedule dashboard refresh",Y)}}const[g,h,f,w,v,b,k,y,S,_,T,L,I]=await Promise.all([window.AppAttendance.getStatus(),window.AppAttendance.getLogs(l),window.AppAnalytics.getUserMonthlyStats(l),window.AppAnalytics.getUserYearlyStats(l),c,window.AppCalendar?window.AppCalendar.getPlans():{leaves:[],events:[]},u,window.app_hasPerm("leaves","view")?window.AppLeaves.getPendingLeaves():Promise.resolve([]),window.AppDB.getCached?window.AppDB.getCached(window.AppDB.getCacheKey("dashboardUsers","users",{}),D?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):window.AppDB.getAll("users"),window.AppCalendar?window.AppCalendar.getCollaborations(l):Promise.resolve([]),window.app_hasPerm("leaves","view")?window.AppDB.queryMany?window.AppDB.queryMany("leaves",[{field:"status",operator:"==",value:"Pending"}]).catch(()=>window.AppDB.getAll("leaves")):window.AppDB.getAll("leaves"):Promise.resolve([]),p,window.AppMinutes?window.AppMinutes.getMinutes():Promise.resolve([])]);console.timeEnd("DashboardFetch");const U=o?{lowRead:!0,generatedAt:L?.generatedAt||L?.meta?.generatedAt||0,source:L?._source||""}:{};let M=o?L?.hero||null:v,A=o?Array.isArray(L?.teamActivityPreview)?L.teamActivityPreview:[]:k;o&&(!L||!Array.isArray(L.teamActivityPreview))&&setTimeout(()=>Aa(!0),0);const N=Xe(M,U);o&&M==null&&m&&m.then(Y=>{const te=Y&&Y.hero?Y.hero:null;if(te){const ce={...U,generatedAt:Y.generatedAt||U.generatedAt,source:Y._source||U.source},pe=Xe(te,ce),se=document.querySelector(".hero-slot");se&&(se.innerHTML=pe)}}).catch(()=>{}),window.AppRating&&n.rating===void 0&&window.AppRating.updateUserRating(n.id).then(Y=>{Object.assign(n,Y)}).catch(()=>{});const E=(S||[]).find(Y=>Y.id===l),P=l===n.id,B=!P&&E?E:n,F=e&&!P&&!t,W=F?{status:B.status||"out",lastCheckIn:B.lastCheckIn||null}:g,z=W.status==="in",V=n.notifications||[];n.tagHistory;let $="00 : 00 : 00",C="Check-in",j="action-btn";z&&(C="Check-out",j="action-btn checkout");const K=Y=>{const te=Math.max(0,Y||0);let ce=Math.floor(te/(1e3*60*60)),pe=Math.floor(te/(1e3*60)%60),se=Math.floor(te/1e3%60);return`${String(ce).padStart(2,"0")} : ${String(pe).padStart(2,"0")} : ${String(se).padStart(2,"0")}`};if(z&&W.lastCheckIn){const Y=new Date(W.lastCheckIn).getTime();$=K(Date.now()-Y)}const J=Ot(),G=Ut(V);let ee="";e&&!P&&E&&(ee=`
            <div class="card full-width" style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 1rem 1.5rem; border-left: 5px solid #ea580c; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="position: relative;">
                            <img src="${Le(E.avatar)}" alt="${x(E.name)}" style="width: 48px; height: 48px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3);">
                            <div style="position: absolute; bottom: -2px; right: -2px; background: #ea580c; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; border: 2px solid white;">
                                <i class="fa-solid fa-eye"></i>
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.7rem; font-weight: 600; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Currently Viewing</div>
                            <h3 style="margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px;">${x(E.name)}'s Dashboard</h3>
                            <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 2px;">${x(E.role)} • ${x(E.dept||"General")}</div>
                        </div>
                    </div>
                    <button onclick="window.app_changeSummaryStaff('${n.id}')" style="background: rgba(255,255,255,0.2); color: white; border: 2px solid rgba(255,255,255,0.3); padding: 0.6rem 1.2rem; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.85rem; backdrop-filter: blur(10px); transition: all 0.2s;">
                        <i class="fa-solid fa-arrow-left"></i> Back to My Dashboard
                    </button>
                </div>
            </div>`);let le="";const ne=dt(b);if(e){const Y=!!window.app_selectedSummaryStaffId&&window.app_selectedSummaryStaffId!==n.id,te=(T||[]).slice().sort((se,Re)=>new Date(Re.appliedOn||0)-new Date(se.appliedOn||0)),ce=Y?te.filter(se=>(se.userId||se.user_id)===l).slice(0,8):te.slice(0,8),pe=Bt(ce,{title:Y?`${E?.name||"Staff"} Leave History`:"Leave Request History",subtitle:Y?"Based on selected staff summary":"Latest requests (all staff)"});le=`
            <div class="dashboard-summary-row">
                <div style="flex: 2; min-width: 350px; display: flex; flex-direction: column;">${Nt(y)}${pe}</div>
                <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 1rem;">${ne}${N}</div>
            </div>
            <div class="dashboard-stats-row">
                ${Ae(P?f.label:`${f.label} - ${E?.name||"Staff"}`,P?"Monthly Stats":"Viewing Staff Monthly Stats",f)}
                ${Ae("Yearly Summary",P?w.label:`${w.label} for ${E?.name||"Staff"}`,w)}
            </div>`}else le=`
            <div class="dashboard-summary-row">
                <div style="flex: 1.2; min-width: 300px; display: flex; flex-direction: column;">${tt(S,V,n)}</div>
                <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 1rem;">${ne}${N}</div>
            </div>
            <div class="dashboard-stats-row">
                ${Ae(f.label,"Monthly Stats",f)}
                ${Ae("Yearly Summary",w.label,w)}
            </div>`;const ye=window.app_getReleaseUpdateState&&window.app_getReleaseUpdateState()||{active:!1,countdownLabel:"00:00"};return setTimeout(()=>wa(),0),`
        <div class="dashboard-grid dashboard-modern dashboard-staff-view">
            ${J}
            ${G}
            ${ee}
            <div class="card full-width dashboard-hero-card">
                <div class="dashboard-hero-orb dashboard-hero-orb-top"></div>
                <div class="dashboard-hero-orb dashboard-hero-orb-bottom"></div>
                <div class="dashboard-hero-content">
                    <div class="dashboard-hero-row">
                        <div class="dashboard-hero-copy">
                            <h2 class="dashboard-hero-title">Welcome back, ${n.name.split(" ")[0]}! 👋</h2>
                            <p class="dashboard-hero-date">${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
                            ${n.rating!==void 0?`<div class="dashboard-hero-chip-row"><div class="dashboard-hero-chip"><span class="dashboard-hero-chip-label">Your Rating:</span>${ha(n.rating,!0)}</div>${n.completionStats?`<div class="dashboard-hero-chip"><i class="fa-solid fa-check-circle dashboard-hero-chip-icon"></i><span>${(n.completionStats.completionRate*100).toFixed(0)}% Complete</span></div>`:""}</div>`:""}
                        </div>
                        ${e?`<div class="dashboard-viewing-box"><div class="dashboard-viewing-inner"><i class="fa-solid fa-users-viewfinder dashboard-viewing-icon"></i><div class="dashboard-viewing-meta"><div class="dashboard-viewing-head"><div class="dashboard-viewing-label">Viewing Summary For</div>${l!==n.id?'<span class="dashboard-viewing-state">STAFF VIEW ACTIVE</span>':""}</div><select onchange="window.app_changeSummaryStaff(this.value)" class="dashboard-viewing-select"><option value="${n.id}">My Own Summary</option><optgroup label="Staff Members">${(S||[]).filter(Y=>Y.id!==n.id).sort((Y,te)=>Y.name.localeCompare(te.name)).map(Y=>`<option value="${Y.id}" ${Y.id===l?"selected":""}>${Y.name}</option>`).join("")}</optgroup></select></div></div></div>`:""}
                        <div class="welcome-icon dashboard-hero-weather"><i class="fa-solid fa-cloud-sun dashboard-hero-weather-icon"></i></div>
                    </div>
                </div>
                <button class="${ye.active?"dashboard-refresh-link is-update-pending":"dashboard-refresh-link"}" onclick="window.app_showSystemUpdatePopup()" title="${ye.active?`Update available. Auto-refresh in ${ye.countdownLabel}`:"Check for System Update"}">
                    ${ye.active?`System update available <span class="dashboard-refresh-countdown">(${ye.countdownLabel})</span>`:"Check for System Update"}
                </button>
            </div>
            <div class="dashboard-primary-row">
                <div class="card check-in-widget" style="flex: 1; min-width: 210px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 0; background: white; border: 1px solid #eef2ff;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 0.75rem;"><div style="position: relative;"><img src="${Le(B.avatar)}" alt="Profile" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #e0e7ff;"><div style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border-radius: 50%; background: ${z?"#10b981":"#94a3b8"}; border: 2px solid white;"></div></div><div style="text-align: left;"><h4 style="font-size: 0.95rem; margin: 0; color: #1e1b4b;">${x(B.name)}</h4><p class="text-muted" style="font-size: 0.75rem; margin: 0;">${x(B.role)}</p></div></div>
                    <div style="text-align:center; padding: 0.5rem 0;"><div class="timer-display" id="timer-display" style="font-size: 2.25rem; font-weight: 800; color: #1e1b4b; line-height: 1; letter-spacing: -1px;">${$}</div><div id="timer-label" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 6px; font-weight: 600;">Elapsed Time Today</div></div>
                    <div id="countdown-container" style="display: none; margin-bottom: 0.75rem; width: 100%;"><div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #4b5563; margin-bottom: 4px;"><span id="countdown-label">Time to checkout</span><span id="countdown-value" style="font-weight: 600;">--:--:--</span></div><div style="width: 100%; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;"><div id="countdown-progress" style="width: 0%; height: 100%; background: var(--primary); transition: width 1s linear;"></div></div></div>
                    <div id="overtime-container" style="display: none; background: #fff7ed; border: 1px solid #ffedd5; padding: 0.5rem; border-radius: 8px; margin-bottom: 0.75rem; text-align: center;"><div style="color: #c2410c; font-weight: 700; font-size: 0.8rem; margin-bottom: 2px;">OVERTIME</div><div id="overtime-value" style="color: #ea580c; font-size: 1.1rem; font-weight: 800; font-family: monospace;">00:00:00</div></div>
                    <button class="${j}" id="attendance-btn" ${F?"disabled":""} title="${F?"View only":""}" style="width: 100%; padding: 0.75rem; font-size: 0.9rem; border-radius: 10px; margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s ease; ${F?"opacity:0.6; cursor:not-allowed;":""}">${C} <i class="fa-solid fa-fingerprint"></i></button>
                    <div class="location-text" id="location-text" style="font-size: 0.65rem; color: #94a3b8; text-align: center; margin-top: 0.5rem;"><i class="fa-solid fa-location-dot"></i><span>${z&&B.currentLocation?`Lat: ${Number(B.currentLocation.lat).toFixed(4)}, Lng: ${Number(B.currentLocation.lng).toFixed(4)}`:"Waiting for location..."}</span></div>
                </div>
                <div style="flex: 1.1; min-width: 230px; display: flex; flex-direction: column; ${P?"":"border: 2px solid #fb923c; border-radius: 12px;"}">${Mt(h,_,E,I)}</div>
                <div style="flex: 1.8; min-width: 280px; display: flex; flex-direction: column;">${Ct(A)}</div>
                ${e?`<div style="flex: 1.2; min-width: 210px; display: flex; flex-direction: column;">${tt(S,V,n)}</div>`:""}
            </div>
            ${le}
        </div>`}function Ee(n){const[e,t]=String(n||"").split("-"),a=Number(e),s=Number(t)-1;return!Number.isInteger(a)||!Number.isInteger(s)||s<0||s>11?n||"Current Month":new Date(a,s,1).toLocaleDateString("en-US",{month:"long",year:"numeric"})}function Ht(n=8){const e=[],t=new Date;t.setDate(1);for(let a=0;a<n;a++){const s=new Date(t);s.setMonth(t.getMonth()-a);const i=s.toISOString().slice(0,7);e.push({key:i,label:Ee(i)})}return e}function va(n){const e=[],t=new Map;return(n||[]).forEach(a=>{const s=(a._displayDesc||"").trim(),i=`${a.staffName||""}|${a.date||""}|${s}`;t.has(i)||(t.set(i,a),e.push(a))}),e.map(a=>{const s=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(a.date,a.status||""):a.status||"to-be-started";return{...a,_taskStatus:s,_taskGroup:s==="completed"?"completed":"incomplete"}})}function ba(n,e){const t=[...n],a={completed:0,"in-process":1,overdue:2,"not-completed":3,"to-be-started":4};return t.sort((s,i)=>{const d=new Date(i.date)-new Date(s.date),r=String(s.staffName||"").toLowerCase().localeCompare(String(i.staffName||"").toLowerCase());return e==="date-asc"?new Date(s.date)-new Date(i.date)||r:e==="staff-asc"?r||d:e==="staff-desc"?-r||d:e==="completed-first"?s._taskGroup.localeCompare(i._taskGroup)||d:e==="incomplete-first"?i._taskGroup.localeCompare(s._taskGroup)||d:e==="status-priority"?(a[s._taskStatus]??99)-(a[i._taskStatus]??99)||d||r:d||r}),t}function Sa(n){if(!n)return;const e=ve.controllers.get(n);e&&(e.intervalId&&clearInterval(e.intervalId),e.pauseTimeoutId&&clearTimeout(e.pauseTimeoutId),e.resumeTimeoutId&&clearTimeout(e.resumeTimeoutId),n.removeEventListener("mouseenter",e.onMouseEnter),n.removeEventListener("mouseleave",e.onMouseLeave),n.removeEventListener("touchstart",e.onTouchStart),n.removeEventListener("touchend",e.onTouchEnd),n.removeEventListener("touchcancel",e.onTouchCancel),ve.controllers.delete(n),ve.elements.delete(n))}function Ft(){Array.from(ve.elements).forEach(n=>Sa(n))}function qt(n){if(!n)return;Ft(),n.querySelectorAll(".dashboard-team-activity-col-list").forEach(t=>{const a={intervalId:null,pauseTimeoutId:null,resumeTimeoutId:null,direction:1,isPausedByUser:!1,isWaitingAtEdge:!1},s=(d,r)=>{a.isWaitingAtEdge=!0,a.pauseTimeoutId&&clearTimeout(a.pauseTimeoutId),a.pauseTimeoutId=setTimeout(()=>{a.direction=d,a.isWaitingAtEdge=!1},r)},i=()=>{if(a.isPausedByUser||a.isWaitingAtEdge||!t.isConnected)return;const d=Math.max(0,t.scrollHeight-t.clientHeight);d<=0||(t.scrollTop+=a.direction,a.direction===1&&t.scrollTop>=d?(t.scrollTop=d,s(-1,1500)):a.direction===-1&&t.scrollTop<=0&&(t.scrollTop=0,s(1,1e3)))};a.onMouseEnter=()=>{a.isPausedByUser=!0},a.onMouseLeave=()=>{a.isPausedByUser=!1},a.onTouchStart=()=>{a.isPausedByUser=!0,a.resumeTimeoutId&&clearTimeout(a.resumeTimeoutId)},a.onTouchEnd=()=>{a.resumeTimeoutId&&clearTimeout(a.resumeTimeoutId),a.resumeTimeoutId=setTimeout(()=>{a.isPausedByUser=!1},400)},t.addEventListener("mouseenter",a.onMouseEnter),t.addEventListener("mouseleave",a.onMouseLeave),t.addEventListener("touchstart",a.onTouchStart,{passive:!0}),t.addEventListener("touchend",a.onTouchEnd,{passive:!0}),a.intervalId=setInterval(i,50),ve.controllers.set(t,a),ve.elements.add(t)})}const Aa=async(n=!0)=>{const e=Ie(),t=document.getElementById("staff-activity-list"),a=document.getElementById("staff-activity-list-modal");if(!t&&!a)return;Ft(),n&&window.AppAnalytics&&(e.logs=await window.AppAnalytics.getAllStaffActivities({mode:"month",month:e.selectedMonth,scope:"work"}));const s=Me(e.logs,e.sortKey);t&&(t.innerHTML=s,qt(t)),a&&(a.innerHTML=s);const i=document.getElementById("staff-activity-range-label");i&&(i.textContent=Ee(e.selectedMonth))};typeof window<"u"&&(window.app_expandTeamActivity=function(){const n=Ie(),e=Ht(8),t=Ee(n.selectedMonth),a=document.createElement("div");a.id="team-activity-modal-overlay",a.className="team-activity-modal-overlay",a.innerHTML=`
            <div class="team-activity-modal-content">
                <div class="team-activity-modal-header">
                    <div class="team-activity-modal-title-wrap">
                        <h2>Team Activity - Full View</h2>
                        <span id="staff-activity-range-label-modal">${x(t)}</span>
                    </div>
                    <div class="team-activity-modal-actions">
                        <div class="dashboard-team-activity-filters">
                            <select class="dashboard-team-select" onchange="window.app_setStaffActivityMonth(this.value); window.app_expandTeamActivityRefresh();">
                                ${e.map(s=>`<option value="${s.key}" ${s.key===n.selectedMonth?"selected":""}>${x(s.label)}</option>`).join("")}
                            </select>
                            <select class="dashboard-team-select" onchange="window.app_setStaffActivitySort(this.value); window.app_expandTeamActivityRefresh();">
                                <option value="date-desc" ${n.sortKey==="date-desc"?"selected":""}>Date (Newest)</option>
                                <option value="date-asc" ${n.sortKey==="date-asc"?"selected":""}>Date (Oldest)</option>
                                <option value="completed-first" ${n.sortKey==="completed-first"?"selected":""}>Completed First</option>
                                <option value="incomplete-first" ${n.sortKey==="incomplete-first"?"selected":""}>Incomplete First</option>
                                <option value="status-priority" ${n.sortKey==="status-priority"?"selected":""}>Status Priority</option>
                                <option value="staff-asc" ${n.sortKey==="staff-asc"?"selected":""}>Staff (A-Z)</option>
                                <option value="staff-desc" ${n.sortKey==="staff-desc"?"selected":""}>Staff (Z-A)</option>
                            </select>
                        </div>
                        <button class="team-activity-modal-close" onclick="window.app_closeTeamActivityExpanded()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                <div id="staff-activity-list-modal" class="team-activity-modal-body">
                    ${Me(n.logs,n.sortKey)}
                </div>
            </div>
        `,document.body.appendChild(a),document.body.style.overflow="hidden",window._teamActivityEscHandler=s=>{s.key==="Escape"&&window.app_closeTeamActivityExpanded()},window.addEventListener("keydown",window._teamActivityEscHandler)},window.app_expandTeamActivityRefresh=function(){const n=Ie(),e=document.getElementById("staff-activity-list-modal"),t=document.getElementById("staff-activity-range-label-modal");e&&(e.innerHTML=Me(n.logs,n.sortKey)),t&&(t.textContent=Ee(n.selectedMonth))},window.app_closeTeamActivityExpanded=function(){const n=document.getElementById("team-activity-modal-overlay");n&&(n.remove(),document.body.style.overflow="",window.removeEventListener("keydown",window._teamActivityEscHandler))});async function ka(){const n=window.AppAuth.getUser(),e=window.AppDB.getCached?await window.AppDB.getCached(window.AppDB.getCacheKey("staffUsers","users",{}),D?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):await window.AppDB.getAll("users"),t=window.app_getMyMessages?await window.app_getMyMessages():await window.AppDB.getAll("staff_messages"),a=e.filter(p=>p.id!==n.id).sort((p,g)=>p.name.localeCompare(g.name));!window.app_staffThreadId&&a.length>0&&(window.app_staffThreadId=a[0].id);const s=e.find(p=>p.id===window.app_staffThreadId),i=p=>x(p).replace(/(https?:\/\/[^\s]+)/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'),d=t.filter(p=>p.fromId===n.id&&p.toId===window.app_staffThreadId||p.fromId===window.app_staffThreadId&&p.toId===n.id).sort((p,g)=>new Date(p.createdAt||0)-new Date(g.createdAt||0)),r=d.filter(p=>p.type==="text"),o=d.filter(p=>p.type==="task"),l={};t.forEach(p=>{p.toId===n.id&&!p.read&&(l[p.fromId]=(l[p.fromId]||0)+1)});const c=a.map(p=>{const g=l[p.id]||0;return`
            <button class="staff-directory-item ${p.id===window.app_staffThreadId?"active":""}" onclick="window.app_openStaffThread('${p.id}')">
                <div class="staff-directory-avatar">
                    <img src="${p.avatar}" alt="${x(p.name)}">
                </div>
                <div class="staff-directory-info">
                    <div class="staff-directory-name">${x(p.name)}</div>
                    <div class="staff-directory-role">${x(p.role||"Staff")}</div>
                </div>
                ${g?`<span class="staff-directory-badge">${g}</span>`:""}
            </button>
        `}).join(""),u=s?r.length?r.map(p=>`
        <div class="staff-message ${p.fromId===n.id?"outgoing":"incoming"}">
            <div class="staff-message-meta">${x(p.fromName)} • ${new Date(p.createdAt).toLocaleString()}</div>
            <div class="staff-message-body">${i(p.message||"")}</div>
            ${p.link?`<div class="staff-message-link"><a href="${p.link}" target="_blank" rel="noopener noreferrer">${p.link}</a></div>`:""}
        </div>
    `).join(""):'<div class="staff-message-empty">No messages yet.</div>':'<div class="staff-message-empty">Select a staff member to view messages.</div>',m=s?o.length?o.map(p=>`
        <div class="staff-task-card">
            <div class="staff-task-head">
                <div>
                    <div class="staff-task-title">${x(p.title||"Task")}</div>
                    <div class="staff-task-meta">From ${x(p.fromName)} • Due ${p.dueDate||"No date"}</div>
                </div>
                <span class="staff-task-status ${p.status||"pending"}">${(p.status||"pending").toUpperCase()}</span>
            </div>
            <div class="staff-task-desc">${x(p.description||"")}</div>
            ${p.status==="pending"&&p.toId===n.id?`
                <div class="staff-task-actions">
                    <button onclick="window.app_respondStaffTask('${p.id}', 'approved')" class="staff-task-btn approve">Approve</button>
                    <button onclick="window.app_respondStaffTask('${p.id}', 'rejected')" class="staff-task-btn reject">Reject</button>
                </div>
            `:""}
            ${p.rejectReason?`<div class="staff-task-reason">Reason: ${x(p.rejectReason)}</div>`:""}
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
                        <h3>${s?x(s.name):"Select a staff member"}</h3>
                        <span>${s?x(s.role||"Staff"):""}</span>
                    </div>
                    <div class="staff-thread-actions">
                        <button class="staff-thread-action-btn" ${s?"":"disabled"} onclick="window.app_openStaffMessageModal('${s?s.id:""}', '${s?x(s.name):""}')">
                            <i class="fa-solid fa-message"></i> Send Message
                        </button>
                        <button class="staff-thread-action-btn secondary" ${s?"":"disabled"} onclick="window.app_openStaffTaskModal('${s?s.id:""}', '${s?x(s.name):""}')">
                            <i class="fa-solid fa-list-check"></i> Send Task
                        </button>
                    </div>
                </div>
                <div class="staff-thread-columns">
                    <div class="staff-thread-column">
                        <div class="staff-thread-column-head">Text Messages</div>
                        <div class="staff-thread-history">
                            ${u}
                        </div>
                    </div>
                    <div class="staff-thread-column">
                        <div class="staff-thread-column-head">Tasks</div>
                        <div class="staff-thread-history">
                            ${m}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `}let yt=!1;function Da(){yt||typeof document>"u"||(yt=!0,document.addEventListener("click",n=>{const e=n.target.closest("[data-annual-open-day]");if(e){window.app_openAnnualDayPlan?.(e.dataset.annualOpenDay);return}const t=n.target.closest("[data-annual-view]");if(t){window.app_toggleAnnualView?.(t.dataset.annualView);return}if(n.target.closest("[data-annual-jump-today]")){window.app_jumpToAnnualToday?.();return}const s=n.target.closest("[data-annual-year-delta]");if(s){window.app_changeAnnualYear?.(Number(s.dataset.annualYearDelta||0));return}const i=n.target.closest("[data-annual-legend]");if(i){window.app_toggleAnnualLegendFilter?.(i.dataset.annualLegend);return}n.target.closest("[data-annual-export]")&&window.AppReports?.exportAnnualListViewCSV?.(window._annualListItems||[])}),document.addEventListener("input",n=>{const e=n.target.closest("[data-annual-staff-filter]");e&&window.app_setAnnualStaffFilter?.(e.value)}),document.addEventListener("change",n=>{const e=n.target.closest("[data-annual-list-sort]");e&&window.app_setAnnualListSort?.(e.value)}),document.addEventListener("keydown",n=>{const e=n.target.closest("[data-annual-list-search]");e&&n.key==="Enter"&&window.app_setAnnualListSearch?.(e.value)}),document.addEventListener("mouseover",n=>{const e=n.target.closest("[data-annual-preview-date]");!e||e.contains(n.relatedTarget)||window.app_showAnnualHoverPreview?.(n,e.dataset.annualPreviewDate)}),document.addEventListener("mouseout",n=>{const e=n.target.closest("[data-annual-preview-date]");!e||e.contains(n.relatedTarget)||window.app_hideAnnualHoverPreview?.()}))}async function ke(){typeof window.app_setAnnualStaffFilter!="function"&&(window.app_setAnnualStaffFilter=async A=>{window.app_annualStaffFilter=String(A||"").trim();const N=document.getElementById("page-content");N&&(N.innerHTML=await ke())}),typeof window.app_toggleAnnualView!="function"&&(window.app_toggleAnnualView=async A=>{window.app_annualViewMode=A;const N=document.getElementById("page-content");N&&(N.innerHTML=await ke())}),typeof window.app_setAnnualListSearch!="function"&&(window.app_setAnnualListSearch=async A=>{window.app_annualListSearch=String(A||"").trim();const N=document.getElementById("page-content");N&&(N.innerHTML=await ke())}),typeof window.app_setAnnualListSort!="function"&&(window.app_setAnnualListSort=async A=>{window.app_annualListSort=String(A||"date-asc").trim();const N=document.getElementById("page-content");N&&(N.innerHTML=await ke())});const n=new Date,e=`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`,t=window.app_annualYear||n.getFullYear(),a=await window.AppCalendar.getPlans(),s=await window.AppDB.getAll("users").catch(()=>[]),i=await window.AppDB.getAll("attendance").catch(()=>[]);window._currentPlans=a;const d=["January","February","March","April","May","June","July","August","September","October","November","December"],r={};(s||[]).forEach(A=>{r[A.id]=A.name}),window._annualUserMap=r;const o=(A,N)=>r[A]||N||"Staff",l=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0,overdue:!0,completed:!0};window.app_annualLegendFilters=l;let c=window.app_selectedAnnualDate||(t===n.getFullYear()?e:null);c&&!c.startsWith(`${t}-`)&&(c=null),window.app_selectedAnnualDate=c;const u=String(window.app_annualStaffFilter||"").trim(),m=u.toLowerCase(),p=String(window.app_annualListSearch||"").trim(),g=p.toLowerCase(),h=String(window.app_annualListSort||"date-asc"),f=(s||[]).map(A=>`<option value="${x(A.name)}"></option>`).join(""),w=A=>m?String(A||"").toLowerCase().includes(m):!0,v={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11},b=(A="")=>{const N=String(A||"").trim();if(!N)return null;const E=N.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);if(!E)return null;const P=Number(E[1]),B=Number(E[2]),F=String(E[3]||"").toLowerCase(),W=Number(E[4]),z=v[F];if(!Number.isInteger(P)||!Number.isInteger(B)||!Number.isInteger(z)||!Number.isInteger(W))return null;const V=new Date(W,z,P),$=new Date(W,z,B);if(Number.isNaN(V.getTime())||Number.isNaN($.getTime()))return null;const C=`${V.getFullYear()}-${String(V.getMonth()+1).padStart(2,"0")}-${String(V.getDate()).padStart(2,"0")}`,j=`${$.getFullYear()}-${String($.getMonth()+1).padStart(2,"0")}-${String($.getDate()).padStart(2,"0")}`;return j<C?null:{startDate:C,endDate:j}},k=(A,N)=>{const E=!A?.startDate&&!A?.endDate?b(A?.task||""):null,P=A?.startDate||E?.startDate||N,B=A?.endDate||E?.endDate||A?.startDate||N;return{startDate:P,endDate:B}},y=(A,N,E)=>{const{startDate:P,endDate:B}=k(A,N);return!P||!B?N===E:!(E<P||E>B||A?.completedDate&&A.completedDate<E)},S=(a.workPlans||[]).filter(A=>{if((A.planScope||"personal")==="annual"){if(!m)return!0;const P=o(A.userId,A.userName);return w(P)?!0:(A.plans||[]).some(B=>{const F=o(B.assignedTo||A.userId,P),W=(B.tags||[]).map(z=>z.name||z).join(" ");return w(F)||w(W)})}if(!m)return!0;const E=o(A.userId,A.userName);return w(E)?!0:(A.plans||[]).some(P=>{const B=o(P.assignedTo||A.userId,E),F=(P.tags||[]).map(W=>W.name||W).join(" ");return w(B)||w(F)})}),_=(a.leaves||[]).filter(A=>w(o(A.userId,A.userName))),T=(i||[]).filter(A=>{if(!String(A.date||"").startsWith(String(t)))return!1;const E=A.user_id||A.userId,P=o(E,"");return m?w(P):!0}),L=(A,N,E)=>{const P=`${E}-${String(N+1).padStart(2,"0")}-${String(A).padStart(2,"0")}`,B=_.some(C=>P>=C.startDate&&P<=C.endDate),F=!m&&(a.events||[]).some(C=>C.date===P),W=T.some(C=>C.date===P),z=S.some(C=>!Array.isArray(C.plans)||!C.plans.length?C.date===P:C.plans.some(j=>y(j,C.date,P)))||W;let V="",$=!1;if(z){const C=S.filter(K=>!Array.isArray(K.plans)||!K.plans.length?K.date===P:K.plans.some(J=>y(J,K.date,P)));let j="to-be-started";C.forEach(K=>{(K.plans||[]).forEach(J=>{if(!y(J,K.date,P))return;const{startDate:G,endDate:ee}=k(J,K.date);G&&ee&&G!==ee&&ee===P&&($=!0);const le=J.completedDate||ee||K.date||P,ne=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(le,J.status):J.status||"pending";ne==="overdue"?j="overdue":ne==="in-process"&&j!=="overdue"?j="in-process":ne==="completed"&&j!=="overdue"&&j!=="in-process"&&(j="completed")})}),W&&j==="to-be-started"&&(j="completed"),V=j}return{hasLeave:B,hasEvent:F,hasWork:z,workStatus:V,hasRangeEnd:$}};let I="";for(let A=0;A<12;A++){const N=new Date(t,A,1).getDay(),E=new Date(t,A+1,0).getDate();let P="";for(let B=0;B<N;B++)P+='<div class="annual-day empty"></div>';for(let B=1;B<=E;B++){const F=L(B,A,t),W=B===n.getDate()&&A===n.getMonth()&&t===n.getFullYear(),z=`${t}-${String(A+1).padStart(2,"0")}-${String(B).padStart(2,"0")}`,V=F.hasLeave&&l.leave,$=F.hasEvent&&l.event,C=F.hasWork&&l.work&&(F.workStatus==="overdue"?l.overdue:F.workStatus==="completed"?l.completed:!0),j=V||$||C,K=C?`has-work work-${F.workStatus}`:"";P+=`
                <div class="annual-day ${W?"today":""} ${K} ${c===z?"selected":""} ${j?"":"annual-day-muted"}" data-annual-open-day="${z}" data-annual-preview-date="${z}">
                    ${B}
                    <div class="dot-container">
                        ${V?'<span class="status-dot dot-leave"></span>':""}
                        ${$?'<span class="status-dot dot-event"></span>':""}
                        ${C?'<span class="status-dot dot-work"></span>':""}
                        ${F.hasRangeEnd?'<span class="status-dot" title="Task ends today" style="background:#f97316;"></span>':""}
                    </div>
                </div>`}I+=`
            <div class="annual-month-card">
                <div class="annual-month-head">
                    <span class="annual-month-title">${d[A]}</span>
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
            </div>`}const U=window.app_annualViewMode||"grid",M=(()=>{const A=[],N=new Set,E=$=>{if(!$)return"";const C=String($).replace(/_/g,"-").toLowerCase();return{"in-process":"In Process","to-be-started":"To Be Started","not-completed":"Not Completed",completed:"Completed",overdue:"Overdue",pending:"Pending",approved:"Approved",holiday:"Holiday",event:"Event"}[C]||C.replace(/\b\w/g,K=>K.toUpperCase())},P=($,C)=>C||(window.AppCalendar&&$?window.AppCalendar.getSmartTaskStatus($,C):"pending");if(!m&&window.AppAnalytics){const $=new Date(t,0,1),C=new Date(t,11,31);for(let j=new Date($);j<=C;j.setDate(j.getDate()+1)){const K=j.toISOString().split("T")[0],J=window.AppAnalytics.getDayType(j);J==="Holiday"?A.push({date:K,type:"holiday",title:"Company Holiday (Weekend)",staffName:"All Staff",assignedBy:"System",assignedTo:"All Staff",selfAssigned:!1,dueDate:K,status:"holiday",comments:"",scope:"Shared"}):J==="Half Day"&&A.push({date:K,type:"event",title:"Half Working Day (Sat)",staffName:"All Staff",assignedBy:"System",assignedTo:"All Staff",selfAssigned:!1,dueDate:K,status:"event",comments:"",scope:"Shared"})}}_.forEach($=>{const C=new Date($.startDate),j=new Date($.endDate||$.startDate),K=o($.userId,$.userName);for(let J=new Date(C);J<=j;J.setDate(J.getDate()+1)){const G=J.toISOString().split("T")[0];G.startsWith(String(t))&&A.push({date:G,type:"leave",title:`${K} (${$.type||"Leave"})`,staffName:K,assignedBy:K,assignedTo:K,selfAssigned:!0,dueDate:$.endDate||$.startDate||G,status:($.status||"approved").toLowerCase(),comments:$.reason||"",scope:"Personal"})}}),(a.events||[]).forEach($=>{if(!m&&String($.date||"").startsWith(String(t))){const C=[String($.date||"").trim(),String($.title||"").trim().toLowerCase(),String($.type||"event").trim().toLowerCase(),String($.createdById||$.createdByName||"").trim().toLowerCase()].join("|");if(N.has(C))return;N.add(C),A.push({date:$.date,type:$.type||"event",title:$.title||"Company Event",staffName:"All Staff",assignedBy:$.createdByName||"Admin",assignedTo:"All Staff",selfAssigned:!1,dueDate:$.date,status:"event",comments:$.description||"",scope:"Shared"})}}),S.forEach($=>{if(String($.date||"").startsWith(String(t))){const C=($.planScope||"personal")==="annual",j=o($.userId,$.userName)||(C?"All Staff":"Staff"),K=C?"Annual":"Personal",J=$.date;$.plans&&$.plans.length>0&&$.plans.forEach(G=>{const ee=C?$.createdByName||G.taggedByName||"Admin":G.taggedByName||j,le=G.assignedTo||$.userId,ne=C?ee:o(le,j),ye=(G.tags||[]).map(Re=>Re.name||Re).filter(Boolean),{startDate:Y,endDate:te}=k(G,J),ce=G.completedDate||te||J,pe=P(ce,G.status),se=G.subPlans&&G.subPlans.length?G.subPlans.join("; "):G.comment||G.notes||"";A.push({date:Y||J,type:"work",title:G.task||"Work Plan Task",staffName:C?ee:ne,assignedBy:ee,assignedTo:C?ee:ne,selfAssigned:ee===ne,dueDate:G.dueDate||te||J,status:pe,comments:se,tags:ye,scope:K})})}}),T.forEach($=>{const C=$.user_id||$.userId,j=o(C,"Staff"),K=($.workDescription||$.location||"").trim()||"Manual log entry";A.push({date:$.date,type:"work",title:K,staffName:j,assignedBy:j,assignedTo:j,selfAssigned:!0,dueDate:$.date,status:"completed",comments:K,tags:["Manual Log"],scope:"Personal"})});const B=[],F=new Set;A.forEach($=>{const C=`${$.date||""}|${$.type||""}|${$.title||""}|${$.staffName||""}|${$.status||""}`.toLowerCase();F.has(C)||(F.add(C),B.push($))}),B.sort(($,C)=>$.date.localeCompare(C.date)||$.type.localeCompare(C.type)),B.forEach($=>{$.statusLabel=E($.status),$.statusClass=String($.status||"pending").replace(/[^a-z0-9]+/gi,"-").toLowerCase()});let W=g?B.filter($=>[$.date,$.staffName,$.title,$.statusLabel,$.comments].join(" ").toLowerCase().includes(g)):B;const z={"date-asc":($,C)=>String($.date||"").localeCompare(String(C.date||"")),"date-desc":($,C)=>String(C.date||"").localeCompare(String($.date||"")),"staff-asc":($,C)=>String($.staffName||"").localeCompare(String(C.staffName||"")),"staff-desc":($,C)=>String(C.staffName||"").localeCompare(String($.staffName||"")),"status-asc":($,C)=>String($.statusLabel||"").localeCompare(String(C.statusLabel||"")),"status-desc":($,C)=>String(C.statusLabel||"").localeCompare(String($.statusLabel||""))},V=z[h]||z["date-asc"];return W.slice().sort(V)})();return window._annualListItems=M,setTimeout(()=>Da(),0),`
        <div class="annual-plan-shell annual-v2-shell">
            <div class="card annual-plan-header annual-v2-header">
                <div class="annual-plan-title-wrap annual-v2-title-wrap">
                    <h2 class="annual-plan-title annual-v2-title">NGO Annual Planning</h2>
                    <p class="annual-plan-subtitle annual-v2-subtitle">Overview of activities for ${t}.</p>
                </div>
                <div class="annual-plan-controls annual-v2-controls">
                    <div class="annual-staff-filter annual-v2-staff-filter">
                        <i class="fa-solid fa-user"></i>
                        <input type="text" list="annual-staff-names" value="${x(u)}" placeholder="Filter by staff name" data-annual-staff-filter="1">
                        <datalist id="annual-staff-names">${f}</datalist>
                    </div>
                    <div class="annual-view-toggle annual-v2-view-toggle">
                        <button data-annual-view="grid" class="annual-toggle-btn annual-v2-toggle-btn ${U==="grid"?"active":""}">
                            <i class="fa-solid fa-calendar-days"></i> Grid
                        </button>
                        <button data-annual-view="list" class="annual-toggle-btn annual-v2-toggle-btn ${U==="list"?"active":""}">
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

            <div id="annual-grid-view" style="display:${U==="grid"?"block":"none"};">
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

            <div id="annual-list-view" style="display:${U==="list"?"block":"none"};">
                <div class="card annual-list-card annual-v2-list-card">
                    <div class="annual-list-head annual-v2-list-head">
                        <h4>Annual Timeline</h4>
                        <div class="annual-list-actions annual-v2-list-actions">
                            <div class="annual-list-search-wrap annual-v2-search-wrap">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="text" value="${x(p)}" placeholder="Search list..." data-annual-list-search="1">
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
                    ${M.length===0?'<div class="annual-list-empty">No items found.</div>':`
                        <div class="annual-list-table-wrap">
                            <div class="annual-list-table">
                                <div class="annual-list-header">
                                    <div>Date</div><div>Staff Name</div><div>Task</div><div>Assigned By</div><div>Status</div><div>Comments</div><div>Scope</div>
                                </div>
                                ${M.map(A=>`
                                    <div class="annual-list-row">
                                        <div class="annual-list-cell">${A.date}</div>
                                        <div class="annual-list-cell">${x(A.staffName)}</div>
                                        <div class="annual-list-cell annual-list-task">${x(A.title)}</div>
                                        <div class="annual-list-cell">${x(A.assignedBy)}</div>
                                        <div class="annual-list-cell"><span class="annual-list-status status-${A.statusClass}">${A.statusLabel}</span></div>
                                        <div class="annual-list-cell annual-list-comments">${x(A.comments||"--")}</div>
                                        <div class="annual-list-cell">${A.scope}</div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                    `}
                </div>
            </div>
        </div>`}let gt=!1;function xa(){gt||typeof document>"u"||(gt=!0,document.addEventListener("click",n=>{const e=n.target.closest("[data-timesheet-open-day]");if(e){window.app_openTimesheetDayDetail?.(e.dataset.timesheetOpenDay);return}if(n.target.closest("[data-timesheet-request-leave]")){const c=document.getElementById("leave-modal");c&&(c.style.display="flex");return}if(n.target.closest("[data-timesheet-manual-log]")){document.dispatchEvent(new CustomEvent("open-log-modal"));return}const s=n.target.closest("[data-timesheet-month-delta]");if(s){window.app_changeTimesheetMonth?.(Number(s.dataset.timesheetMonthDelta||0));return}if(n.target.closest("[data-timesheet-today]")){window.app_jumpTimesheetToday?.();return}const d=n.target.closest("[data-timesheet-export]");if(d){window.AppReports?.exportUserLogs?.(d.dataset.timesheetExportUser||"");return}const r=n.target.closest("[data-timesheet-edit-log]");if(r){window.app_editWorkSummary?.(r.dataset.timesheetEditLog);return}const o=n.target.closest("[data-timesheet-detail-log]");if(o){const c=o.dataset.timesheetDetailLog;alert("Detailed analysis for log "+c+" coming soon!");return}const l=n.target.closest("[data-timesheet-close-modal]");l&&l.closest(".modal-overlay")?.remove()}),document.addEventListener("change",n=>{const e=n.target.closest("[data-timesheet-view-select]");e&&window.app_toggleTimesheetViewSelect?.(e.value)}))}async function De(){setTimeout(()=>xa(),0),typeof window.app_setTimesheetView!="function"&&(window.app_setTimesheetView=async y=>{window.app_timesheetViewMode=y==="calendar"?"calendar":"list";const S=document.getElementById("page-content");S&&(S.innerHTML=await De())}),typeof window.app_changeTimesheetMonth!="function"&&(window.app_changeTimesheetMonth=async y=>{const S=new Date,_=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:S.getMonth(),T=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:S.getFullYear(),L=new Date(T,_,1);L.setMonth(L.getMonth()+y),window.app_timesheetMonth=L.getMonth(),window.app_timesheetYear=L.getFullYear();const I=document.getElementById("page-content");I&&(I.innerHTML=await De())}),typeof window.app_jumpTimesheetToday!="function"&&(window.app_jumpTimesheetToday=async()=>{const y=new Date;window.app_timesheetMonth=y.getMonth(),window.app_timesheetYear=y.getFullYear();const S=document.getElementById("page-content");S&&(S.innerHTML=await De())});const n=window.AppAuth.getUser(),e=await window.AppAttendance.getLogs(),t=await window.AppCalendar.getPlans().catch(()=>({workPlans:[]})),a=new Date,s=window.app_timesheetViewMode||"list",i=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:a.getMonth(),d=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:a.getFullYear(),r=new Date(d,i,1).toLocaleString("en-US",{month:"long",year:"numeric"}),o=`${d}-${String(i+1).padStart(2,"0")}-01`,l=`${d}-${String(i+1).padStart(2,"0")}-31`,c=e.filter(y=>y.date&&y.date>=o&&y.date<=l),u=(t.workPlans||[]).filter(y=>y.userId===n.id&&y.date&&y.date>=o&&y.date<=l),m={};c.forEach(y=>{m[y.date]||(m[y.date]=[]),m[y.date].push(y)});const p={};u.forEach(y=>{p[y.date]||(p[y.date]=[]),(Array.isArray(y.plans)?y.plans:[]).forEach(_=>{p[y.date].push(_.task||"Planned task")})}),window._timesheetLogsByDate=m,window._timesheetPlansByDate=p;let g=0,h=0;const f=new Set;c.forEach(y=>{y.durationMs&&(g+=y.durationMs/(1e3*60)),(y.lateCountable||window.AppAttendance&&window.AppAttendance.normalizeType(y.type)==="Late")&&h++,y.date&&f.add(y.date)});const w=`${Math.floor(g/60)}h ${Math.round(g%60)}m`,v=Math.floor(h/(D?.LATE_GRACE_COUNT||3))*(D?.LATE_DEDUCTION_PER_BLOCK||.5),b=y=>window.AppAttendance&&window.AppAttendance.normalizeType?window.AppAttendance.normalizeType(y):y;window.app_editWorkSummary=async y=>{const _=(await window.AppAttendance.getLogs()).find(I=>I.id===y),T=_?_.workDescription:"",L=await window.appPrompt("Update Work Summary:",T||"",{title:"Update Work Summary",confirmText:"Save"});if(L!==null){await window.AppAttendance.updateLog(y,{workDescription:L});const I=document.getElementById("page-content");I&&(I.innerHTML=await De())}},window.app_switchTimesheetPanel=(y,S)=>{const _=y==="calendar"?"calendar":"list";window.app_timesheetViewMode=_;const T=document.getElementById("timesheet-list-panel"),L=document.getElementById("timesheet-calendar-panel"),I=document.getElementById("timesheet-view-select");T&&(T.style.display=_==="list"?"block":"none"),L&&(L.style.display=_==="calendar"?"block":"none"),I&&(I.value=_);const U=S&&S.closest?S.closest(".timesheet-view-toggle"):null;(U?U.querySelectorAll(".annual-toggle-btn"):[]).forEach(A=>A.classList.remove("active")),S&&S.classList&&S.classList.add("active")},window.app_openTimesheetDayDetail=y=>{const S=window._timesheetLogsByDate&&window._timesheetLogsByDate[y]||[],_=window._timesheetPlansByDate&&window._timesheetPlansByDate[y]||[],T=S.length?S.map(M=>`
                <div class="timesheet-day-detail-item">
                    <div class="timesheet-day-detail-head">
                        <span>${x(M.checkIn||"--")} - ${x(M.checkOut||"--")}</span>
                        <span class="timesheet-day-status-chip">${x(b(M.type))}</span>
                    </div>
                    <div class="timesheet-day-detail-text">${x(M.workDescription||M.location||"No summary")}</div>
                    ${M.id&&M.id!=="active_now"?`<button type="button" class="action-btn secondary" data-timesheet-edit-log="${M.id}">Edit</button>`:""}
                </div>
            `).join(""):'<div class="timesheet-day-detail-empty">No attendance logs for this date.</div>',L=_.length?_.map(M=>`<div class="timesheet-day-plan-item">${x(M)}</div>`).join(""):'<div class="timesheet-day-detail-empty">No planned tasks for this date.</div>',I=`timesheet-day-detail-${Date.now()}`,U=`
            <div class="modal-overlay" id="${I}" style="display:flex;">
                <div class="modal-content" style="max-width:560px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <h3 style="margin:0;">${x(y)} Details</h3>
                        <button type="button" class="app-system-dialog-close" data-timesheet-close-modal="1">&times;</button>
                    </div>
                    <div style="display:grid; gap:0.9rem;">
                        <div>
                            <h4 style="margin:0 0 0.45rem 0; color:#334155;">Logged Work</h4>
                            ${T}
                        </div>
                        <div>
                            <h4 style="margin:0 0 0.45rem 0; color:#334155;">Planned Tasks</h4>
                            ${L}
                        </div>
                    </div>
                </div>
            </div>`;typeof window.app_showModal=="function"?window.app_showModal(U,I):(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",U)};const k=()=>{const y=new Date(d,i,1).getDay(),S=new Date(d,i+1,0).getDate();let _="";for(let T=0;T<y;T++)_+='<div class="timesheet-cal-day empty"></div>';for(let T=1;T<=S;T++){const L=`${d}-${String(i+1).padStart(2,"0")}-${String(T).padStart(2,"0")}`,I=m[L]||[],U=I.length?I.slice().sort((W,z)=>{const V=$=>{const C=b($.type);return C==="Absent"?4:C==="Half Day"?3:C==="Late"?2:C==="Present (Late Waived)"?1:0};return V(z)-V(W)})[0]:null,M=p[L]||[],A=L===new Date().toISOString().split("T")[0],N=U?b(U.type):"",E=U?N==="Absent"?"absent":N==="Half Day"||N==="Late"?"late":"present":"none",P=U?N:"No log",B=I.map(W=>(W.workDescription||W.location||"").trim()).filter(Boolean),F=B.length?B.slice(0,2).map(W=>`<div class="timesheet-cal-plan">${x(W)}</div>`).join("")+(B.length>2?`<div class="timesheet-cal-more">+${B.length-2} more logs</div>`:""):M.length?M.slice(0,2).map(W=>`<div class="timesheet-cal-plan">${x(W)}</div>`).join("")+(M.length>2?`<div class="timesheet-cal-more">+${M.length-2} more</div>`:""):'<div class="timesheet-cal-empty">No plans</div>';_+=`
                <div class="timesheet-cal-day ${A?"today":""}" data-timesheet-open-day="${L}" style="cursor:pointer;">
                    <div class="timesheet-cal-day-head">
                        <span class="timesheet-cal-date">${T}</span>
                        <span class="timesheet-cal-attendance ${E}">${P}</span>
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
                    <div class="value">${w}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Days Present</div>
                    <div class="value">${f.size} <span class="timesheet-stat-sub">Days</span></div>
                </div>
                <div class="stat-card">
                    <div class="label">Late Count</div>
                    <div class="value" style="color:${h>2?"var(--accent)":"var(--text-main)"}">${h}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Late Deduction</div>
                    <div class="value">${v.toFixed(1)} <span class="timesheet-stat-sub">Days</span></div>
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
                        ${c.length?c.map(y=>`
                            <tr>
                                <td data-label="Date">
                                    <div class="timesheet-log-date">${y.date||"Active Session"}</div>
                                    <div class="timesheet-log-id">Log ID: ${y.id==="active_now"?"N/A":y.id.slice(-4)}</div>
                                </td>
                                <td data-label="Timings">
                                    <div class="time-badge">
                                        <span class="in"><i class="fa-solid fa-caret-right"></i> ${y.checkIn}</span>
                                        <span class="out"><i class="fa-solid fa-caret-left"></i> ${y.checkOut||"--:--"}</span>
                                    </div>
                                </td>
                                <td data-label="Status">
                                    <div class="timesheet-status-col">
                                        <span class="badge" style="background:${b(y.type)==="Absent"?"#fef2f2":b(y.type)==="Half Day"||b(y.type)==="Late"?"#fff7ed":"#f0fdf4"}; color:${b(y.type)==="Absent"?"#991b1b":b(y.type)==="Half Day"||b(y.type)==="Late"?"#c2410c":"#15803d"}; border:1px solid ${b(y.type)==="Absent"?"#fecaca":b(y.type)==="Half Day"||b(y.type)==="Late"?"#fed7aa":"#dcfce7"};">${b(y.type)}</span>
                                        <div class="timesheet-duration">${y.duration||"--"}</div>
                                    </div>
                                </td>
                                <td data-label="Work Summary" class="timesheet-summary-cell">
                                    <div class="timesheet-summary-wrap">
                                        <div class="dashboard-viewing-meta">
                                            <div class="timesheet-summary-text">${x(y.workDescription)||'<span class="timesheet-empty-summary">No summary provided</span>'}</div>
                                            ${y.location?`<div class="timesheet-location"><i class="fa-solid fa-location-dot"></i> ${x(y.location)}</div>`:""}
                                        </div>
                                        ${y.id!=="active_now"?`<button data-timesheet-edit-log="${y.id}" class="timesheet-edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>`:""}
                                    </div>
                                </td>
                                <td data-label="Detail" class="text-right">
                                    ${y.id!=="active_now"?`<button class="icon-btn timesheet-detail-btn" title="View Detailed Log" data-timesheet-detail-log="${y.id}"><i class="fa-solid fa-circle-info"></i></button>`:'<span class="timesheet-live">SESSION LIVE</span>'}
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
    `}async function zt(){try{const n=window.AppAuth.getUser();if(!n)return'<div class="card">User state lost. Please <a href="#" onclick="window.AppAuth.logout()">Login Again</a></div>';const e=n.role==="Administrator"||n.isAdmin,t=e?await window.AppDB.getAll("users"):[],a=e&&window.app_profileTargetUserId?window.app_profileTargetUserId:n.id,s=e&&t.find(v=>v.id===a)||n,i=(v,b)=>{const k=String(v||"").trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(k))return"NA";const y=k.replace(/-/g,""),S=String(b||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase().slice(-3)||"USR";return`EMP-${y}-${S}`},d=typeof s.joinDate=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s.joinDate)?s.joinDate:"",r=d?s.employeeId||i(d,s.id):"NA",[o,l,c]=await Promise.all([window.AppAnalytics?window.AppAnalytics.getUserMonthlyStats(s.id):null,window.AppAnalytics?window.AppAnalytics.getUserYearlyStats(s.id):null,window.AppLeaves?window.AppLeaves.getUserLeaves(s.id):[]]);window.app_changeProfileStaff=async v=>{window.app_profileTargetUserId=v||n.id;const b=document.getElementById("page-content");b&&(b.innerHTML=await zt())},window.app_confirmSignOut=()=>{confirm("Are you sure you want to sign out?")&&window.AppAuth.logout()};const u=s.id===n.id,m=o?.attendanceRate??"—",p=o?.punctualityRate??"—",g=o?.totalHours??"—",h=l?.totalDays??"—",f=v=>v==="Approved"?"#16a34a":v==="Rejected"?"#dc2626":"#d97706",w=(s.name||"U").split(" ").map(v=>v[0]).join("").slice(0,2).toUpperCase();return`
            <div class="pro-profile-root">

                <!-- ── Hero Banner ── -->
                <div class="pro-profile-hero">
                    <div class="pro-profile-hero-bg"></div>
                    <div class="pro-profile-hero-inner">
                        <!-- Avatar -->
                        <div class="pro-profile-avatar-ring">
                            ${s.avatar?`<img src="${x(s.avatar)}" alt="${x(s.name)}" class="pro-profile-avatar-img">`:`<div class="pro-profile-avatar-initials">${w}</div>`}
                            <span class="pro-profile-status-dot ${s.status==="in"?"online":"offline"}"
                                  title="${s.status==="in"?"Currently checked in":"Not checked in"}"></span>
                        </div>

                        <!-- Identity -->
                        <div class="pro-profile-identity">
                            <div class="pro-profile-name-row">
                                <h1 class="pro-profile-name">${x(s.name)}</h1>
                                <span class="pro-profile-role-badge">${x(s.role||"Staff")}</span>
                            </div>
                            <div class="pro-profile-email">
                                <i class="fa-solid fa-envelope"></i>
                                ${x(s.email||"—")}
                            </div>
                            <div class="pro-profile-meta-row">
                                <span class="pro-profile-chip">
                                    <i class="fa-solid fa-id-card"></i>${x(r)}
                                </span>
                                ${d?`<span class="pro-profile-chip">
                                    <i class="fa-solid fa-calendar-check"></i>Joined ${d}
                                </span>`:""}
                                ${s.department?`<span class="pro-profile-chip">
                                    <i class="fa-solid fa-building"></i>${x(s.department)}
                                </span>`:""}
                            </div>
                        </div>

                        <!-- Header Actions -->
                        <div class="pro-profile-header-actions">
                            ${e?`
                            <select class="pro-profile-staff-picker" onchange="window.app_changeProfileStaff(this.value)">
                                <option value="">My Profile</option>
                                ${t.map(v=>`<option value="${v.id}" ${v.id===a?"selected":""}>${x(v.name)}</option>`).join("")}
                            </select>`:""}
                            ${u?`
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
                        <div class="pro-stat-value">${m}${typeof m=="number"?"%":""}</div>
                        <div class="pro-stat-label">Attendance</div>
                    </div>
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-clock pro-stat-icon" style="color:#f59e0b;"></i>
                        <div class="pro-stat-value">${p}${typeof p=="number"?"%":""}</div>
                        <div class="pro-stat-label">Punctuality</div>
                    </div>
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-hourglass-half pro-stat-icon" style="color:#10b981;"></i>
                        <div class="pro-stat-value">${g}${typeof g=="number"?"h":""}</div>
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
                                    ${c.slice(0,8).map(v=>`
                                    <tr>
                                        <td>${x(v.startDate||"—")}</td>
                                        <td>${x(v.endDate||"—")}</td>
                                        <td>${x(v.type||"—")}</td>
                                        <td>${v.daysCount??"—"}</td>
                                        <td>
                                            <span class="pro-status-pill" style="background:${f(v.status)}18;color:${f(v.status)};">
                                                ${x(v.status||"Pending")}
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
                                ${Object.entries(l.breakdown||{}).filter(([,v])=>v>0).map(([v,b])=>`
                                <div class="pro-breakdown-chip">
                                    <span class="pro-breakdown-count">${b}</span>
                                    <span class="pro-breakdown-key">${x(v)}</span>
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
                                ${[["Department",s.department||"Operations"],["Role",s.role||"Staff"],["Level",s.level||"—"],["Reports To",s.reportsTo||"Admin"],["Employee ID",r],["Join Date",d||"N/A"],["Payroll Cycle","Monthly (25th)"]].map(([v,b])=>`
                                <div class="pro-detail-row">
                                    <div class="pro-detail-label">${v}</div>
                                    <div class="pro-detail-value">${x(String(b))}</div>
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
                                ${u?`
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
        `}catch(n){return console.error("Profile Render Error:",n),`<div class="card error-card">Failed to load profile: ${x(n.message)}</div>`}}async function jt(n=null,e=null){const t=window.AppAuth.getUser(),a=window.app_hasPerm("attendance","admin",t),s=await window.AppDB.getAll("users"),i=new Date,d=n!==null?parseInt(n):i.getMonth(),r=e!==null?parseInt(e):i.getFullYear(),o=`${r}-${String(d+1).padStart(2,"0")}-01`,l=`${r}-${String(d+1).padStart(2,"0")}-31`;let c=[];try{c=(await window.AppDB.query("attendance","date",">=",o)).filter(S=>S.date<=l)}catch(y){console.warn("MasterSheet: query failed, fetching all attendance logs",y),c=(await window.AppDB.getAll("attendance")).filter(_=>_.date>=o&&_.date<=l)}const u=new Date(r,d+1,0).getDate(),m=Array.from({length:u},(y,S)=>S+1),p=["January","February","March","April","May","June","July","August","September","October","November","December"],g=y=>{const S=new Date(`${y}T00:00:00`),_=S.getDay();if(_===0)return"holiday";if(_===6){const T=Math.floor((S.getDate()-1)/7)+1;if(T===2||T===4)return"holiday";if(T===1||T===3||T===5)return"halfday"}return"working"},h=y=>String(y?.type||"").includes("Leave")||y?.location==="On Leave",f=y=>!y||!y.checkOut||y.checkOut==="Active Now"?!1:typeof y.activityScore<"u"||typeof y.locationMismatched<"u"||!!y.checkOutLocation||typeof y.outLat<"u"||typeof y.outLng<"u",w=y=>y?.isManualOverride?4:h(y)?3:f(y)?2:1,v=y=>{if(Object.prototype.hasOwnProperty.call(y||{},"attendanceEligible"))return y.attendanceEligible===!0;const S=String(y?.entrySource||"");return S==="staff_manual_work"?!1:S==="admin_override"||S==="checkin_checkout"||y?.isManualOverride||y?.location==="Office (Manual)"||y?.location==="Office (Override)"||typeof y?.activityScore<"u"||typeof y?.locationMismatched<"u"||typeof y?.autoCheckout<"u"||!!y?.checkOutLocation||typeof y?.outLat<"u"||typeof y?.outLng<"u"?!0:String(y?.type||"").includes("Leave")||y?.location==="On Leave"},b=new Date().toISOString().split("T")[0],k=y=>{const S=new Date(y);return`${S.getFullYear()}-${String(S.getMonth()+1).padStart(2,"0")}-${String(S.getDate()).padStart(2,"0")}`};return window.app_refreshMasterSheet=async()=>{const y=document.getElementById("sheet-month")?.value,S=document.getElementById("sheet-year")?.value,_=document.getElementById("page-content");_&&(_.innerHTML=await jt(y,S))},`
        <div class="dashboard-grid dashboard-modern dashboard-admin-view">
            <div class="card full-width">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                    <div>
                        <h2 style="font-size:1.1rem; margin-bottom:0.1rem;">Attendance Sheet</h2>
                        <p style="color:var(--text-muted); font-size:0.75rem;">Master grid view for all staff logs.</p>
                    </div>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <select onchange="window.app_refreshMasterSheet()" id="sheet-month" style="padding:0.4rem; border-radius:6px; border:1px solid #ddd; font-size:0.8rem;">
                            ${p.map((y,S)=>`<option value="${S}" ${S===d?"selected":""}>${y}</option>`).join("")}
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

                <div class="table-container" style="max-height: 70vh; overflow: auto; border: 1px solid #eee; border-radius: 8px;">
                    <table style="font-size:0.85rem; border-collapse: separate; border-spacing: 0;">
                        <thead>
                            <tr style="position: sticky; top: 0; z-index: 10; background: #f8fafc;">
                                <th style="border-right: 1px solid #eee; padding:6px; position: sticky; left: 0; background: #f8fafc; z-index: 20; font-size:0.75rem;">S.No</th>
                                <th style="border-right: 2px solid #ddd; padding:6px; position: sticky; left: 35px; background: #f8fafc; z-index: 20; min-width: 120px; font-size:0.75rem;">Staff Name</th>
                                ${m.map(y=>`<th style="text-align:center; min-width: 28px; padding:4px; border-right: 1px solid #eee; font-size:0.75rem;">${y}</th>`).join("")}
                            </tr>
                        </thead>
                        <tbody>
                            ${s.sort((y,S)=>y.name.localeCompare(S.name)).map((y,S)=>`
                                <tr>
                                    <td style="text-align:center; border-right: 1px solid #eee; position: sticky; left: 0; background: #fff; z-index: 5; padding:4px; font-size:0.75rem;">${S+1}</td>
                                    <td style="border-right: 2px solid #ddd; position: sticky; left: 35px; background: #fff; z-index: 5; font-weight: 500; padding:4px;">
                                        <div style="display:flex; flex-direction:column;">
                                            <span style="font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px;">${x(y.name)}</span>
                                            <span style="font-size:0.65rem; color:#666; font-weight:400;">${x(y.dept||"General")}</span>
                                        </div>
                                    </td>
                                    ${m.map(_=>{const T=`${r}-${String(d+1).padStart(2,"0")}-${String(_).padStart(2,"0")}`,I=c.filter(E=>(E.userId===y.id||E.user_id===y.id)&&E.date===T).filter(v),U=g(T);let M="-",A="",N="No log";if(I.length>0){const E=I.slice().sort((B,F)=>w(F)-w(B))[0],P=window.AppAttendance&&window.AppAttendance.normalizeType?window.AppAttendance.normalizeType(E.type):E.type;M=P.charAt(0).toUpperCase(),N=`${E.checkIn} - ${E.checkOut||"Active"}
${P}`,P==="Present"?A="color: #10b981; font-weight: bold; font-size: 0.9rem;":P==="Late"?(A="color: #f59e0b; font-weight: bold;",M="L"):P==="Half Day"?(A="color: #c2410c; font-weight: bold;",M="HD"):P==="Absent"?(A="color: #ef4444; font-weight: bold;",M="A"):P.includes("Leave")?(A="color: #8b5cf6; font-weight: bold;",M="C"):P==="Work - Home"?(A="color: #0ea5e9; font-weight: bold;",M="W"):P==="On Duty"&&(A="color: #0369a1; font-weight: bold;",M="D"),E.isManualOverride&&(A="color: #be185d; font-weight: bold; background: #fdf2f8;")}else{const E=T===b&&y.status==="in"&&y.lastCheckIn&&k(y.lastCheckIn)===T,P=typeof y.joinDate=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(y.joinDate)?T<y.joinDate:!1,B=T>b;E?(M="P",A="color: #10b981; font-weight: bold; font-size: 0.9rem;",N="Checked in (pending checkout)"):B||P?(M="-",A="color: #94a3b8; font-weight: 600;",N=B?"Future date":`Before joining date (${y.joinDate})`):U==="holiday"?(M="H",A="color: #64748b; font-weight: 700;",N="Holiday"):(M="A",A="color: #ef4444; font-weight: bold;",N="Absent")}return`<td style="text-align:center; ${a?"cursor:pointer;":""} border-right: 1px solid #eee; padding:2px; font-size:0.75rem; ${A}" title="${N}" ${a?`onclick="window.app_openCellOverride('${y.id}', '${T}')"`:""}>${M}</td>`}).join("")}
                                </tr>`).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`}async function Wt(n=null,e=null){let t=[],a=[],s={avgScore:0,trendData:[0,0,0,0,0,0,0],labels:[]},i=[],d=[];try{const p=new Date().toISOString().split("T")[0];n=n||p,e=e||p,[t,s,i,a,d]=await Promise.all([window.AppDB.getCached?window.AppDB.getCached(window.AppDB.getCacheKey("adminUsers","users",{}),D?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):window.AppDB.getAll("users"),window.AppAnalytics.getSystemPerformance(),window.AppDB.queryMany?window.AppDB.queryMany("location_audits",[],{orderBy:[{field:"timestamp",direction:"desc"}],limit:300}).catch(()=>window.AppDB.getAll("location_audits")):window.AppDB.getAll("location_audits"),window.AppLeaves.getPendingLeaves(),window.AppDB.queryMany?window.AppDB.queryMany("system_audit_logs",[],{orderBy:[{field:"createdAt",direction:"desc"}],limit:80}).catch(()=>window.AppDB.getAll("system_audit_logs")):window.AppDB.getAll("system_audit_logs")]),i=i.filter(g=>{const h=new Date(g.timestamp).toISOString().split("T")[0];return h>=n&&h<=e}).sort((g,h)=>h.timestamp-g.timestamp),d=(d||[]).filter(g=>g&&g.module==="simulation"&&String(g.type||"").startsWith("legacy_dummy_cleanup_")).sort((g,h)=>Number(h.createdAt||0)-Number(g.createdAt||0)).slice(0,25)}catch(p){console.error("Failed to fetch admin data",p)}const r=t.filter(p=>p.status==="in").length,o=t.filter(p=>p.role==="Administrator"||p.isAdmin===!0).length,l=s.avgScore>70?"Optimal":s.avgScore>40?"Good":"Low",c=s.avgScore>70?"#166534":s.avgScore>40?"#854d0e":"#991b1b",u=s.avgScore>70?"#f0fdf4":s.avgScore>40?"#fefce8":"#fef2f2",m=p=>{const g=p&&p.payload?p.payload:{},h=g.deleted||{},f=g.configuredTargets||{};if(p.type==="legacy_dummy_cleanup_completed")return[`users=${Number(h.users||0)}`,`attendance=${Number(h.attendance||0)}`,`leaves=${Number(h.leaves||0)}`,`workPlans=${Number(h.workPlans||0)}`].join(", ");if(p.type==="legacy_dummy_cleanup_skipped"){const w=g.reason||"unknown",v=Array.isArray(f.ids)?f.ids.length:0,b=Array.isArray(f.usernames)?f.usernames.length:0;return`reason=${w}, targetIds=${v}, targetUsernames=${b}`}return p.type==="legacy_dummy_cleanup_failed"?String(g.message||"Unknown error"):"-"};return window.app_applyAuditFilter=async()=>{const p=document.getElementById("audit-start")?.value,g=document.getElementById("audit-end")?.value,h=document.getElementById("page-content");h&&(h.innerHTML=await Wt(p,g))},`
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
                        <div class="admin-kpi-pill-value">${o}</div>
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
                                        <td>${x(p.userName)}</td>
                                        <td><span class="admin-leave-type-badge">${x(p.type)}</span></td>
                                        <td>${p.daysCount}</td>
                                        <td>
                                            <div class="admin-leave-actions">
                                                ${window.app_hasPerm("leaves","admin")?`
                                                    <button onclick="window.AppLeaves.updateLeaveStatus('${p.id}', 'Approved').then(() => window.app_refreshCurrentPage())" class="admin-btn admin-btn-success">Approve</button>
                                                    <button onclick="window.AppLeaves.updateLeaveStatus('${p.id}', 'Rejected').then(() => window.app_refreshCurrentPage())" class="admin-btn admin-btn-danger">Reject</button>
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
                    <div class="admin-performance-status" style="background:${u}; color:${c};">${l}</div>
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
                            ${t.map(p=>{const g=p.lastSeen&&Date.now()-p.lastSeen<12e4;return`
                                <tr>
                                    <td>
                                        <div class="admin-user-cell">
                                            <img src="${p.avatar}" class="admin-user-avatar">
                                            <div>
                                                <div class="admin-user-name-row">${x(p.name)} ${g?'<span class="admin-user-live-tag">LIVE</span>':""}</div>
                                                <div class="admin-user-id">${x(p.username)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span class="status-badge ${p.status==="in"?"in":"out"}">${p.status?.toUpperCase()}</span></td>
                                    <td>${p.lastCheckIn?new Date(p.lastCheckIn).toLocaleTimeString():"--"} / ${p.lastCheckOut?new Date(p.lastCheckOut).toLocaleTimeString():"--"}</td>
                                    <td>${x(p.role)} / ${x(p.dept||"--")}</td>
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
                                    <td>${x(p.userName)}</td>
                                    <td>${x(p.slot)}</td>
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
                    <span class="text-muted" style="font-size:0.75rem;">Last ${d.length} entries</span>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Time</th><th>Event</th><th>Summary</th></tr></thead>
                        <tbody>
                            ${d.length?d.map(p=>`
                                <tr>
                                    <td>${new Date(Number(p.createdAt||0)).toLocaleString()}</td>
                                    <td>${x(p.type||"-")}</td>
                                    <td>${x(m(p))}</td>
                                </tr>
                            `).join(""):'<tr><td colspan="3" class="text-center">No simulation cleanup audit entries found</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`}async function $a(){const n=await window.AppAnalytics.getSystemMonthlySummary(),e=new Date,t=window.AppAuth.getUser(),a=window.app_hasPerm("reports","admin",t),s=e.toLocaleDateString("default",{month:"long",year:"numeric"});return window.app_recalculateRow=i=>{const d=parseFloat(i.querySelector(".base-salary-input").value)||0,r=i.querySelector(".tds-input"),o=parseFloat(document.getElementById("global-tds-percent")?.value)||0,l=r.value!==""?parseFloat(r.value):o,c=parseFloat(i.querySelector(".unpaid-leaves-count").textContent)||0,u=Math.max(0,d-d/22*c),m=Math.round(u*(l/100)),p=Math.max(0,u-m);i.querySelector(".tds-amount").textContent=`Rs ${m.toLocaleString()}`,i.querySelector(".final-net-salary").textContent=`Rs ${p.toLocaleString()}`,i.querySelector(".salary-input").value=Math.round(u)},window.app_recalculateAllSalaries=()=>{document.querySelectorAll(".salary-processing-table tbody tr").forEach(d=>window.app_recalculateRow(d))},`
        <div class="card full-width">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h3 style="font-size: 1.25rem;">Salary Processing</h3>
                    <p class="text-muted">Period: ${s}</p>
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
                            <th>Unpaid</th>
                            <th>Deductions</th>
                            <th>Calculated</th>
                            <th>TDS %</th>
                            <th>Final Net</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${n.map(i=>{const{user:d,stats:r}=i,o=d.baseSalary||0,l=r.unpaidLeaves||0,c=Math.round(Math.max(0,o-o/22*l));return`
                                <tr data-user-id="${d.id}">
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                                            <img src="${d.avatar}" style="width: 28px; height: 28px; border-radius: 50%;">
                                            <div style="font-weight: 600;">${x(d.name)}</div>
                                        </div>
                                    </td>
                                    <td><input type="number" class="base-salary-input" value="${o}" style="width: 80px;" onchange="window.app_recalculateRow(this.closest('tr'))"></td>
                                    <td><span class="present-count">${r.present}</span></td>
                                    <td><span class="unpaid-leaves-count">${l}</span></td>
                                    <td class="deduction-amount" style="color:#ef4444;">-Rs ${Math.round(o/22*l).toLocaleString()}</td>
                                    <td><input type="number" class="salary-input" value="${c}" style="width: 90px;"></td>
                                    <td><input type="number" class="tds-input" value="" placeholder="Global" style="width: 60px;" onchange="window.app_recalculateRow(this.closest('tr'))"></td>
                                    <td class="final-net-salary" style="font-weight:700; color:#1e40af;">Rs ${c.toLocaleString()}</td>
                                    <td class="tds-amount" style="display:none;">0</td>
                                    <td><button class="action-btn secondary" onclick="window.app_generateSalarySlip('${d.id}')">Slip</button></td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `}async function _a(){const n=new Date().toISOString().split("T")[0];return window.app_runPolicyTest=()=>{const e=document.getElementById("policy-test-checkin")?.value,t=document.getElementById("policy-test-checkout")?.value,a=document.getElementById("policy-test-output");if(!e||!t||!a)return;const s=document.getElementById("policy-test-date")?.value,i=new Date(`${s}T${e}`),r=(new Date(`${s}T${t}`)-i)/(1e3*60*60);let o="Absent";r>=8?o="Present":r>=4&&(o="Half Day"),a.innerHTML=`
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <div class="stat-card"><div class="label">Status</div><div class="value">${o}</div></div>
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
    `}async function Yt(){const n=await window.AppMinutes.getMinutes(),e=window.AppDB?.getAll?await window.AppDB.getAll("users"):[],t=window.AppAuth.getUser(),a=window.AppCalendar?await window.AppCalendar.getPlans():{leaves:[],events:[],work:[]},s=(r,o=t)=>!r||!o?!1:!!(window.app_hasPerm("minutes","view",o)||r.createdBy===o.id||(r.attendeeIds||[]).includes(o.id)||(r.allowedViewers||[]).includes(o.id)||(r.actionItems||[]).some(l=>l.assignedTo===o.id)),i=(r,o=t.id)=>{const l=(r.accessRequests||[]).find(c=>c.userId===o);return l?l.status:""};let d=new Set;return window.app_toggleNewMinuteForm=()=>{const r=document.getElementById("new-minute-form");if(r&&(r.style.display=r.style.display==="none"?"block":"none",r.style.display==="block")){d=new Set,window.app_refreshAttendeeChips(),document.querySelectorAll('.attendee-grid input[type="checkbox"]').forEach(l=>l.checked=!1);const o=document.getElementById("action-items-container");o&&(o.innerHTML="",window.app_addActionItemRow())}},window.app_refreshMinutesView=async()=>{const r=document.getElementById("page-content");r&&(r.innerHTML=await Yt())},window.app_filterAttendees=r=>{const o=r.toLowerCase();document.querySelectorAll(".attendee-item-modern").forEach(l=>{const c=(l.dataset.name||"").toLowerCase();l.style.display=c.includes(o)?"flex":"none"})},window.app_filterMinutes=r=>{const o=r.toLowerCase();document.querySelectorAll(".minute-card-modern").forEach(l=>{const c=l.querySelector(".card-title-modern")?.textContent.toLowerCase()||"",u=l.querySelector(".card-date-badge")?.textContent.toLowerCase()||"";l.style.display=c.includes(o)||u.includes(o)?"flex":"none"})},window.app_toggleAttendeePick=r=>{r.checked?d.add(r.value):d.delete(r.value),window.app_refreshAttendeeChips()},window.app_refreshAttendeeChips=()=>{const r=document.getElementById("minutes-attendee-chips");r&&(r.innerHTML=Array.from(d).map(o=>{const l=e.find(c=>c.id===o);return`
                <div class="chip-modern">
                    <span>${x(l?.name||l?.username||"Unknown")}</span>
                    <i class="fa-solid fa-circle-xmark" onclick="window.app_removeAttendee('${o}')"></i>
                </div>
            `}).join(""))},window.app_removeAttendee=r=>{d.delete(r);const o=document.querySelector(`.attendee-item-modern input[value="${r}"]`);o&&(o.checked=!1),window.app_refreshAttendeeChips()},window.app_addActionItemRow=()=>{const r=document.getElementById("action-items-container");if(!r)return;const o=document.createElement("div");o.className="action-item-row-card",o.innerHTML=`
            <div class="field-group">
                <input type="text" placeholder="What needs to be done?" class="input-premium action-task">
            </div>
            <div class="field-group">
                <select class="input-premium action-assignee">
                    <option value="">Assignee...</option>
                    ${e.map(l=>`<option value="${l.id}">${x(l.name||l.username)}</option>`).join("")}
                </select>
            </div>
            <div class="field-group">
                <input type="date" class="input-premium action-due" value="${new Date().toISOString().split("T")[0]}">
            </div>
            <button type="button" onclick="this.parentElement.remove()" class="icon-btn-danger" style="background:#fee2e2; color:#ef4444; border:none; width:40px; height:40px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `,r.appendChild(o)},window.app_submitNewMinutes=async()=>{const r=document.getElementById("new-minute-title").value.trim(),o=document.getElementById("new-minute-date").value,l=document.getElementById("new-minute-content").value.trim(),c=Array.from(d),u=Array.from(document.querySelectorAll(".action-item-row-card")).map(m=>({task:m.querySelector(".action-task").value.trim(),assignedTo:m.querySelector(".action-assignee").value,dueDate:m.querySelector(".action-due").value,status:"pending"})).filter(m=>m.task);if(!r||!l)return alert("Title and content are required.");try{await window.AppMinutes.addMinute({title:r,date:o,content:l,attendeeIds:c,actionItems:u}),alert("Meeting minutes recorded!"),window.app_refreshMinutesView()}catch(m){alert("Error saving: "+m.message)}},window.app_requestMinuteAccess=async r=>{try{await window.AppMinutes.requestAccess(r),alert("Access requested!"),window.app_refreshMinutesView()}catch(o){alert("Error: "+o.message)}},window.app_handleMinuteApproval=async r=>{if(confirm("Are you sure you want to approve these minutes? This will lock the record if you are the last attendee to sign."))try{await window.AppMinutes.approveMinute(r),alert("Minutes approved!"),window.app_openMinuteDetails(r),window.app_refreshMinutesView()}catch(o){alert("Error: "+o.message)}},window.app_handleActionItemStatus=async(r,o,l)=>{try{await window.AppMinutes.updateActionItemStatus(r,o,l),alert(`Task marked as ${l}!`),window.app_openMinuteDetails(r)}catch(c){alert("Error: "+c.message)}},window.app_handleAccessDecision=async(r,o,l)=>{try{await window.AppMinutes.handleAccessRequest(r,o,l),alert(`Request ${l}!`),window.app_openMinuteDetails(r)}catch(c){alert("Error: "+c.message)}},window.app_openMinuteDetails=async r=>{const l=(await window.AppMinutes.getMinutes()).find(v=>v.id===r);if(!l)return;if(!s(l))return alert("Access Restricted. Please request access from the list view.");const c=(l.attendeeIds||[]).includes(t.id),u=l.approvals&&l.approvals[t.id],m=l.createdBy===t.id,p=window.app_hasPerm("minutes","admin",t),g=(l.attendeeIds||[]).map(v=>{const b=e.find(y=>y.id===v),k=l.approvals&&l.approvals[v];return`
                <div class="approval-chip ${k?"approved":"pending"}">
                    <i class="fa-solid fa-${k?"check-circle":"clock"}"></i>
                    ${x(b?.name||"Unknown")}
                </div>
            `}).join(""),h=(l.actionItems||[]).map((v,b)=>{const k=e.find(S=>S.id===v.assignedTo),y=v.assignedTo===t.id;return`
                <div class="detail-action-item">
                    <div class="action-status-dot ${v.status||"pending"}"></div>
                    <div class="action-main">
                        <strong>${x(v.task)}</strong>
                        <span class="action-meta">Assigned: ${x(k?.name||"Unassigned")} | Due: ${v.dueDate||"N/A"}</span>
                    </div>
                    ${y&&v.status!=="completed"?`
                        <div class="action-btns">
                            ${v.status==="pending"?`<button class="mini-btn" onclick="window.app_handleActionItemStatus('${l.id}', ${b}, 'accepted')">Accept</button>`:""}
                            <button class="mini-btn success" onclick="window.app_handleActionItemStatus('${l.id}', ${b}, 'completed')">Complete</button>
                        </div>
                    `:""}
                </div>
            `}).join(""),f=(l.accessRequests||[]).filter(v=>v.status==="pending").map(v=>`
            <div class="access-request-row">
                <span>${x(v.userName)}</span>
                <div class="req-btns">
                    <button class="mini-btn success" onclick="window.app_handleAccessDecision('${l.id}', '${v.userId}', 'approved')">Approve</button>
                    <button class="mini-btn danger" onclick="window.app_handleAccessDecision('${l.id}', '${v.userId}', 'rejected')">Deny</button>
                </div>
            </div>
        `).join(""),w=`
            <div class="modal-overlay" id="minute-detail-modal" style="display:flex;">
                <div class="modal-content minutes-detail-wide">
                    <div class="modal-header">
                        <div>
                            <span class="detail-date">${new Date(l.date).toLocaleDateString()}</span>
                            <h2 style="margin:0; color:#1e1b4b;">${x(l.title)}</h2>
                        </div>
                        <button onclick="document.getElementById('minute-detail-modal').remove()" class="close-modal-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-grid">
                            <div class="main-column">
                                <section>
                                    <label><i class="fa-solid fa-file-lines"></i> Discussion & Decisions</label>
                                    <div class="content-text">${x(l.content).replace(/\n/g,"<br>")}</div>
                                </section>
                                ${h?`
                                <section>
                                    <label><i class="fa-solid fa-list-check"></i> Action Items</label>
                                    <div class="action-items-list">${h}</div>
                                </section>
                                `:""}
                            </div>
                            <div class="side-column">
                                <section>
                                    <label><i class="fa-solid fa-users-check"></i> Approvals</label>
                                    <div class="approvals-stack">${g||'<p class="empty">No attendees defined</p>'}</div>
                                    ${c&&!u&&!l.locked?`<button class="action-btn wide" onclick="window.app_handleMinuteApproval('${l.id}')" style="margin-top:1rem;">Approve Minutes</button>`:""}
                                </section>
                                ${(m||p)&&f?`
                                <section class="owner-only">
                                    <label><i class="fa-solid fa-key"></i> Access Requests</label>
                                    <div class="access-requests-list">${f}</div>
                                </section>
                                `:""}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${l.locked?'<span class="status-locked-msg"><i class="fa-solid fa-lock"></i> Record Locked (All approved)</span>':""}
                        <div style="flex:1"></div>
                        <button class="action-btn secondary" onclick="document.getElementById('minute-detail-modal').remove()">Close</button>
                        ${m||p?`<button class="action-btn danger" onclick="window.app_deleteMinute('${l.id}')">Delete</button>`:""}
                    </div>
                </div>
            </div>
        `;if(!document.getElementById("modal-container")){const v=document.createElement("div");v.id="modal-container",document.body.appendChild(v)}document.getElementById("modal-container").innerHTML=w},window.app_deleteMinute=async r=>{if(confirm("Are you sure?"))try{await window.AppMinutes.deleteMinute(r),document.getElementById("minute-detail-modal")?.remove(),window.app_refreshMinutesView()}catch(o){alert("Error: "+o.message)}},`
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
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                }

                .attendee-chips-wrapper {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    min-height: 40px;
                }

                .chip-modern {
                    background: var(--minutes-primary);
                    color: white;
                    padding: 0.4rem 0.9rem;
                    border-radius: 999px;
                    font-size: 0.875rem;
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
                    padding: 0.6rem 1rem;
                    margin-bottom: 1rem;
                    font-size: 0.9rem;
                }

                .attendee-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 0.75rem;
                    max-height: 200px;
                    overflow-y: auto;
                    padding-right: 0.5rem;
                }

                .attendee-item-modern {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: white;
                    padding: 0.75rem 1rem;
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
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }

                .attendee-item-modern span {
                    font-size: 0.9rem;
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
                    .action-item-row-card { grid-template-columns: 1fr; padding: 1.5rem; }
                    .minutes-header-section { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .btn-record-meeting { width: 100%; justify-content: center; }
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
                            <i class="fa-solid fa-search" style="position: absolute; left: 1rem; top: 0.75rem; color: var(--minutes-muted);"></i>
                            <input type="text" placeholder="Search staff members..." oninput="window.app_filterAttendees(this.value)" class="search-staff-input" style="padding-left: 2.75rem;">
                        </div>
                        <div class="attendee-grid">
                            ${e.map(r=>`
                                <label class="attendee-item-modern" data-name="${Lt(r.name||r.username)}">
                                    <input type="checkbox" value="${r.id}" onchange="window.app_toggleAttendeePick(this)">
                                    <span>${x(r.name||r.username)}</span>
                                </label>
                            `).join("")}
                        </div>
                    </div>
                </div>

                <div class="discussion-area">
                    <label class="field-label" style="margin-bottom: 0.75rem; display: block;">Discussion & Key Decisions</label>
                    <textarea id="new-minute-content" class="textarea-premium" placeholder="Summarize what was discussed and the final decisions made..."></textarea>
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
                        ${dt(a)}
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
                ${n.length?n.sort((r,o)=>new Date(o.date)-new Date(r.date)).map(r=>{const o=s(r),l=i(r);return`
                        <div class="minute-card-modern ${o?"clickable":""}" ${o?`onclick="window.app_openMinuteDetails('${r.id}')"`:""}>
                            <div class="card-date-badge">${new Date(r.date).toLocaleDateString(void 0,{day:"numeric",month:"short",year:"numeric"})}</div>
                            
                            <div class="minute-card-status">
                                ${r.locked?'<span style="background:#dcfce7; color:#166534; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:700;"><i class="fa-solid fa-lock" style="margin-right:0.35rem;"></i>Locked</span>':'<span style="background:#fff7ed; color:#9a3412; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:700;">Open</span>'}
                            </div>

                            <h4 class="card-title-modern">${x(r.title)}</h4>
                            
                            <div class="card-metrics">
                                <div class="metric-item">
                                    <i class="fa-solid fa-users"></i>
                                    ${r.attendeeIds?.length||0} Attendees
                                </div>
                                <div class="metric-item">
                                    <i class="fa-solid fa-check-circle"></i>
                                    ${r.actionItems?.length||0} Tasks
                                </div>
                            </div>

                            ${o?"":`
                                <div class="restricted-tag">
                                    <i class="fa-solid fa-shield-halved" style="margin-right: 0.5rem;"></i>
                                    Access Restricted
                                    ${l==="pending"?'<div style="margin-top:0.5rem; font-size:0.7rem; color:#f59e0b;">Request Pending Review</div>':l==="rejected"?'<div style="margin-top:0.5rem; font-size:0.7rem; color:#ef4444;">Access Denied</div>':`<button class="mini-btn" style="margin-top:0.75rem; width:100%; border-color:#991b1b; color:#991b1b;" onclick="window.app_requestMinuteAccess('${r.id}')">Request View Access</button>`}
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
    `}function Ta(n=[]){let e="";n&&n.length>0&&(e=`
            <div style="margin-bottom:1.5rem; padding-bottom:1.5rem; border-bottom:1px dashed #cbd5e1;">
                 <label style="display:block; font-size:0.85rem; font-weight:700; color:#334155; margin-bottom:0.75rem;">📋 Your Planned Tasks</label>
                 <div style="max-height:150px; overflow-y:auto; padding-right:4px;">
                    ${n.map(i=>`<div style="padding:8px 12px; background:#f0f9ff; border-left:3px solid #0284c7; border-radius:6px; font-size:0.9rem; color:#0c4a6e; margin-bottom:8px;">
                <span style="font-weight:600;">•</span> ${x(i.task)}
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
    </div>`}function La(){if(typeof window>"u")return;const n=new MutationObserver(t=>{t.forEach(()=>{const a=document.getElementById("checkout-modal"),s=document.getElementById("checkout-intro-panel");a&&s&&a.style.display!=="none"&&(localStorage.getItem("checkoutIntroSeen")||(s.style.display="block"))})}),e=()=>{const t=document.body;t&&n.observe(t,{attributes:!0,subtree:!0,attributeFilter:["style"]})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e):e()}typeof window<"u"&&La();function Ia(){return`
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
     `}function Ma(){return window.AppAuth?.getUser()?`
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
    `:""}const O={renderDashboard:Rt,renderHeroCard:Xe,renderWorkLog:Mt,renderActivityList:Et,renderActivityLog:Ct,renderStaffActivityListSplit:Me,renderStaffActivityColumn:et,renderStatsCard:Ae,renderBreakdown:Pt,renderLeaveRequests:Nt,renderLeaveHistory:Bt,renderNotificationPanel:Ot,renderTaggedItems:Ut,renderStaffDirectory:tt,renderStaffDirectoryPage:ka,renderAnnualPlan:ke,renderTimesheet:De,renderProfile:zt,renderMasterSheet:jt,renderAdmin:Wt,renderSalaryProcessing:$a,renderPolicyTest:_a,renderMinutes:Yt,renderCheckInModal:Ta,renderLogin:Ia,renderModals:Ma,renderYearlyPlan:dt};typeof window<"u"&&(window.AppUI=O);class Ea{constructor(){this.db=H}normalizePlanTasks(e){return Array.isArray(e?.plans)?e.plans:[]}getSmartTaskStatus(e,t=null){if(t==="completed"||t==="not-completed")return t;const a=new Date().toISOString().split("T")[0],s=typeof e=="string"?e:e.toISOString().split("T")[0];return s>a?"to-be-started":s===a?"in-process":s<a?"overdue":"in-process"}calculateTaskPoints(e,t){const a=this.getSmartTaskStatus(t,e.status);let s=0;switch(a){case"completed":if(s=10,e.completedDate){const i=this.getDaysDifference(t,e.completedDate);i===0?s+=3:i===1?s-=1:i>=2&&(s-=2)}break;case"in-process":s=5;break;case"to-be-started":s=0;break;case"overdue":s=-8;break;case"not-completed":s=-3;break}return s}getDaysDifference(e,t){const a=new Date(e),i=new Date(t)-a;return Math.floor(i/(1e3*60*60*24))}getCompletionStats(e){let t=0,a=0,s=0,i=0,d=0,r=0;e.forEach(l=>{this.normalizePlanTasks(l).forEach(u=>{switch(r++,this.getSmartTaskStatus(l.date,u.status)){case"completed":t++;break;case"in-process":a++;break;case"not-completed":s++;break;case"overdue":i++;break;case"to-be-started":d++;break}})});const o=r>0?t/r:0;return{completed:t,inProcess:a,notCompleted:s,overdue:i,toBeStarted:d,totalTasks:r,completionRate:parseFloat(o.toFixed(2)),lastCalculated:new Date().toISOString()}}async calculateUserRating(e,t=30){try{const a=await this.db.getAll("work_plans"),s=new Date;s.setDate(s.getDate()-t);const i=s.toISOString().split("T")[0],d=a.filter(c=>c.userId===e&&c.date>=i);if(d.length===0)return{rating:3,rawScore:0,stats:{completed:0,inProcess:0,notCompleted:0,overdue:0,toBeStarted:0,totalTasks:0,completionRate:0,lastCalculated:new Date().toISOString()}};let r=0;d.forEach(c=>{this.normalizePlanTasks(c).forEach(m=>{r+=this.calculateTaskPoints(m,c.date)})});const o=this.getCompletionStats(d),l=this.normalizeScore(r,-50,150);return{rating:parseFloat(l.toFixed(1)),rawScore:r,stats:o}}catch(a){return console.error("Rating calculation failed:",a),{rating:3,rawScore:0,stats:{completed:0,inProcess:0,notCompleted:0,overdue:0,toBeStarted:0,totalTasks:0,completionRate:0,lastCalculated:new Date().toISOString()}}}}normalizeScore(e,t,a){const i=1+(Math.max(t,Math.min(a,e))-t)/(a-t)*4;return Math.max(1,Math.min(5,i))}async updateUserRating(e){try{const t=await this.calculateUserRating(e),a=await this.db.get("users",e);if(!a)throw new Error("User not found");a.ratingHistory||(a.ratingHistory=[]);const s=new Date().toISOString().split("T")[0];return a.ratingHistory.push({date:s,rating:t.rating,reason:"auto-calculated"}),a.ratingHistory.length>90&&(a.ratingHistory=a.ratingHistory.slice(-90)),a.rating=t.rating,a.completionStats=t.stats,await this.db.put("users",a),a}catch(t){throw console.error("Failed to update user rating:",t),t}}async updateAllRatings(){try{const e=await this.db.getAll("users"),t=[];for(const a of e)try{const s=await this.updateUserRating(a.id);t.push(s)}catch(s){console.error(`Failed to update rating for ${a.name}:`,s)}return t}catch(e){throw console.error("Failed to update all ratings:",e),e}}async getTopPerformers(e=5){try{return(await this.db.getAll("users")).filter(s=>s.rating!==void 0).sort((s,i)=>(i.rating||0)-(s.rating||0)).slice(0,e).map(s=>({id:s.id,name:s.name,avatar:s.avatar,rating:s.rating||0,completionStats:s.completionStats||{}}))}catch(t){return console.error("Failed to get top performers:",t),[]}}async getRatingHistory(e,t=90){try{const a=await this.db.get("users",e);if(!a||!a.ratingHistory)return[];const s=new Date;s.setDate(s.getDate()-t);const i=s.toISOString().split("T")[0];return a.ratingHistory.filter(d=>d.date>=i)}catch(a){return console.error("Failed to get rating history:",a),[]}}}const xe=new Ea;typeof window<"u"&&(window.AppRating=xe);class Ca{constructor(){this.db=H}normalizePlanScope(e){return String(e||"").toLowerCase()==="annual"?"annual":"personal"}getWorkPlanId(e,t=null,a="personal"){return this.normalizePlanScope(a)==="annual"?`plan_annual_${e}`:`plan_${t}_${e}`}async getPlans(){try{const e=new Date,t=new Date(e.getFullYear(),e.getMonth()-2,1).toISOString().split("T")[0],a=new Date(e.getFullYear(),e.getMonth()+3,0).toISOString().split("T")[0],[s,i,d,r]=await Promise.all([this.db.getAll("leaves"),this.db.getAll("events").catch(()=>[]),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:t},{field:"date",operator:"<=",value:a}]).catch(()=>this.db.getAll("work_plans")):this.db.getAll("work_plans"),this.db.getCached?this.db.getCached(this.db.getCacheKey("calendarUsers","users",{}),D?.READ_CACHE_TTLS?.users||6e4,()=>this.db.getAll("users")).catch(()=>[]):this.db.getAll("users").catch(()=>[])]),o={};r.forEach(m=>{o[m.id]=m.name});const l=(s||[]).filter(m=>m.status==="Approved").map(m=>({...m,userName:m.userName||o[m.userId]||"Staff"})),c=(()=>{const m=new Map;return(i||[]).forEach(p=>{const g=[String(p.date||"").trim(),String(p.title||"").trim().toLowerCase(),String(p.type||"event").trim().toLowerCase(),String(p.createdById||p.createdByName||"").trim().toLowerCase()].join("|");m.has(g)||m.set(g,p)}),Array.from(m.values())})(),u=(d||[]).map(m=>({...m,plans:Array.isArray(m.plans)?m.plans:[]}));return{leaves:l,events:c,workPlans:u}}catch(e){return console.error("Failed to fetch calendar plans:",e),{leaves:[],events:[],workPlans:[]}}}async setWorkPlan(e,t=[],a=null,s={}){const i=Z.getUser();if(!i)throw new Error("Not authenticated");const d=this.normalizePlanScope(s.planScope),r=a||i.id,o=await this.db.getAll("users"),l=o.find(u=>u.id===r);if(!l)throw console.error("setWorkPlan Error: Target user not found",{targetId:r,currentUser:i,allUsersCount:o.length}),new Error("Target user not found");const c={id:this.getWorkPlanId(e,r,d),userId:d==="annual"?"annual_shared":r,userName:d==="annual"?"All Staff":l.name,date:e,plans:t,planScope:d,createdById:i.id,createdByName:i.name||"Admin",updatedAt:new Date().toISOString()};return await this.db.put("work_plans",c)}async addWorkPlanTask(e,t,a,s=[],i={}){let d=await this.getWorkPlan(t,e);if(!d){const o=(await this.db.getAll("users")).find(l=>l.id===t);if(!o)throw new Error("Target user not found");d={id:`plan_${t}_${e}`,userId:t,userName:o.name,date:e,plans:[],updatedAt:new Date().toISOString()}}if(d.plans||(d.plans=[]),i.sourcePlanId!==void 0&&i.sourceTaskIndex!==void 0&&i.sourcePlanId!==null){const r=d.plans.find(o=>o.sourcePlanId===i.sourcePlanId&&o.sourceTaskIndex===i.sourceTaskIndex&&o.addedFrom===(i.addedFrom||"minutes"));if(r)return r.task=a,r.subPlans=i.subPlans||r.subPlans||[],r.tags=s,r.status=i.status||r.status||"pending",r.startDate=i.startDate||r.startDate||e,r.endDate=i.endDate||r.endDate||r.startDate||e,r.updatedAt=new Date().toISOString(),d.updatedAt=new Date().toISOString(),await this.db.put("work_plans",d)}return d.plans.push({task:a,subPlans:i.subPlans||[],tags:s,status:i.status||"pending",startDate:i.startDate||e,endDate:i.endDate||i.startDate||e,addedFrom:i.addedFrom||"minutes",sourcePlanId:i.sourcePlanId||null,sourceTaskIndex:i.sourceTaskIndex??null,taggedById:i.taggedById||null,taggedByName:i.taggedByName||null}),d.updatedAt=new Date().toISOString(),await this.db.put("work_plans",d)}async deleteWorkPlan(e,t=null,a={}){const s=Z.getUser();if(!s)throw new Error("Not authenticated");const i=this.normalizePlanScope(a.planScope),d=t||s.id;return await this.db.delete("work_plans",this.getWorkPlanId(e,d,i))}async getWorkPlan(e,t,a={}){const s=!!a.includeAnnual,i=!!a.mergeAnnual,d=a.planScope?this.normalizePlanScope(a.planScope):null,r=!!a.preferAnnual;if(d)return await this.db.get("work_plans",this.getWorkPlanId(t,e,d));const o=await this.db.get("work_plans",this.getWorkPlanId(t,e,"personal"));if(!s)return o;const l=await this.db.get("work_plans",this.getWorkPlanId(t,e,"annual"));if(i&&l&&o){const c=[];return(l.plans||[]).forEach((u,m)=>{c.push({...u,_planId:l.id,_taskIndex:m,_planDate:l.date,_planScope:"annual"})}),(o.plans||[]).forEach((u,m)=>{c.push({...u,_planId:o.id,_taskIndex:m,_planDate:o.date,_planScope:"personal"})}),{id:`plan_merged_${e}_${t}`,userId:e,userName:o.userName||"Staff",date:t,planScope:"mixed",plans:c,personalPlanId:o.id,annualPlanId:l.id}}return r?l||o:o||l}getSmartTaskStatus(e,t=null){if(xe)return xe.getSmartTaskStatus(e,t);if(t==="completed"||t==="not-completed")return t;const a=new Date().toISOString().split("T")[0],s=typeof e=="string"?e:e.toISOString().split("T")[0];return s>a?"to-be-started":s===a?"in-process":s<a?"overdue":"in-process"}async updateTaskStatus(e,t,a,s=null){try{const i=await this.db.get("work_plans",e);if(!i||!i.plans||!i.plans[t])throw new Error("Plan or task not found");return i.plans[t].status=a,a==="completed"&&!i.plans[t].completedDate&&(i.plans[t].completedDate=s||new Date().toISOString().split("T")[0]),i.updatedAt=new Date().toISOString(),await this.db.put("work_plans",i),xe&&await xe.updateUserRating(i.userId),i}catch(i){throw console.error("Failed to update task status:",i),i}}async reassignTask(e,t,a){try{const s=await this.db.get("work_plans",e);if(!s||!s.plans||!s.plans[t])throw new Error("Plan or task not found");if(!(await this.db.getAll("users")).find(r=>r.id===a))throw new Error("New user not found");return s.plans[t].assignedTo=a,s.updatedAt=new Date().toISOString(),await this.db.put("work_plans",s),s}catch(s){throw console.error("Failed to reassign task:",s),s}}async getTasksByStatus(e,t,a=null,s=null){try{const d=(await this.db.getAll("work_plans")).filter(o=>o.userId===e),r=[];return d.forEach(o=>{a&&o.date<a||s&&o.date>s||o.plans&&Array.isArray(o.plans)&&o.plans.forEach((l,c)=>{const u=this.getSmartTaskStatus(o.date,l.status);u===t&&r.push({...l,planId:o.id,taskIndex:c,planDate:o.date,calculatedStatus:u})})}),r}catch(i){return console.error("Failed to get tasks by status:",i),[]}}async getCollaborations(e,t=null){try{return(await this.db.getAll("work_plans")).filter(s=>(!t||s.date===t)&&s.plans&&s.plans.some(i=>i.tags&&i.tags.some(d=>d.id===e&&d.status==="accepted")))}catch(a){return console.error("Failed to fetch collaborations:",a),[]}}async addEvent(e){const t={id:"ev_"+Date.now(),...e,createdOn:new Date().toISOString()};return await this.db.add("events",t)}_toLocalISO(e){const t=new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`}async getMonthEvents(e,t){const a=await this.getPlans(),s=[];a.leaves.forEach(r=>{const o=new Date(r.startDate),l=new Date(r.endDate);let c=new Date(o);for(;c<=l;)s.push({date:this._toLocalISO(c),title:`${r.userName||"Staff"} (Leave)`,type:"leave",userId:r.userId}),c.setDate(c.getDate()+1)});const i=a.workPlans.map(r=>{const o=[];return r.plans.forEach(l=>{let c=l.task;l.subPlans&&l.subPlans.length>0&&(c+=" ("+l.subPlans.join(", ")+")"),l.tags&&l.tags.length>0&&(c+=" with "+l.tags.map(u=>u.name).join(", ")),o.push(c)}),{date:r.date,title:`${r.userName}: ${o.join("; ")}`,type:"work",userId:r.userId,plans:r.plans}});return[...s,...a.events,...i].filter(r=>{const o=new Date(r.date);return o.getFullYear()===e&&o.getMonth()===t})}}const $e=new Ca;typeof window<"u"&&(window.AppCalendar=$e);class Pa{constructor(){this.isActive=!1,this.activeMinutes=0,this.totalMinutes=0,this.monitorInterval=null,this.lastActivityTime=Date.now(),this.isCurrentlyActive=!1,this.performedAudits={},this.commandListener=null,this.processedCommandIds=new Set,this.startTime=Date.now(),this.handleActivity=this.handleActivity.bind(this),this.tick=this.tick.bind(this),H&&this.initCommandListener()}initCommandListener(){this.commandListener||H&&H.listen&&(console.log("Activity Monitor: Initializing System Command Listener..."),this.commandListener=H.listen("system_commands",e=>{const t=Z.getUser();if(!t){console.log("[Audit] Command detected but user not authenticated yet. Waiting...");return}const a=e.filter(s=>s.type==="audit"&&s.timestamp>this.startTime-6e5&&!this.processedCommandIds.has(s.id)).sort((s,i)=>i.timestamp-s.timestamp);if(a.length>0){const s=a[0];console.log("[Audit] Manual Command Received!",s.id),this.processedCommandIds.add(s.id);const i=s.slotName||`Manual Audit @ ${new Date().toLocaleTimeString()}`;console.log(`[Audit] Executing for user: ${t.name} in slot: ${i}`),this.performSilentAudit(i)}}))}async performSilentAudit(e){const t=Z.getUser();if(!t)return;const a=new Date().toISOString().split("T")[0];if(this.performedAudits[a]||(this.performedAudits[a]={}),this.performedAudits[a][e])return;console.log(`Executing Silent Location Audit for slot: ${e}`),this.performedAudits[a][e]=!0;let s={userId:t.id,userName:t.name,timestamp:Date.now(),slot:e,status:"Success",lat:0,lng:0};try{if(window.getLocation){const i=await window.getLocation().catch(d=>(console.warn("Silent Audit Location Failed:",d),null));i?(s.lat=i.lat,s.lng=i.lng):s.status="Location service disabled"}else s.status="Location service disabled (missing helper)"}catch{s.status="Location service disabled"}try{await H.add("location_audits",s),console.log("Silent Audit Log Saved.")}catch(i){console.error("Failed to save audit log:",i)}}start(){this.isActive||(this.isActive=!0,this.activeMinutes=0,this.totalMinutes=0,this.isCurrentlyActive=!1,this.lastActivityTime=Date.now(),document.addEventListener("mousemove",this.handleActivity),document.addEventListener("click",this.handleActivity),document.addEventListener("keydown",this.handleActivity),document.addEventListener("scroll",this.handleActivity),this.monitorInterval=setInterval(this.tick,6e4),console.log("Activity Monitoring Started"))}stop(){if(this.isActive)return this.isActive=!1,document.removeEventListener("mousemove",this.handleActivity),document.removeEventListener("click",this.handleActivity),document.removeEventListener("keydown",this.handleActivity),document.removeEventListener("scroll",this.handleActivity),this.monitorInterval&&clearInterval(this.monitorInterval),console.log("Activity Monitoring Stopped. Score:",this.getScore()),this.getStats()}handleActivity(){this.isCurrentlyActive||(this.isCurrentlyActive=!0,this.lastActivityTime=Date.now())}tick(){this.totalMinutes++,this.isCurrentlyActive&&this.activeMinutes++;const e=Z.getUser();e&&e.status==="in"&&(e.activityScore=this.getScore(),e.lastActive=this.lastActivityTime,H.put("users",e)),this.isCurrentlyActive=!1}getScore(){return this.totalMinutes===0?100:Math.round(this.activeMinutes/this.totalMinutes*100)}getStats(){return{score:this.getScore(),activeMinutes:this.activeMinutes,totalMinutes:this.totalMinutes}}}const Na=new Pa;typeof window<"u"&&(window.AppActivity=Na);class Ba{constructor(){this.active=!1,this.currentStep=0,this.steps=[],this.overlay=null,this.tooltip=null,this.highlight=null,this.tourKey="crwi_tour_completed"}init(e){if(e){if(localStorage.getItem(this.tourKey+"_"+e.id)){console.log("Tour already completed for user:",e.id);return}this.defineSteps(e),setTimeout(()=>{this.startTour(e)},2e3)}}defineSteps(e){e.isAdmin||e.role==="Administrator"?this.steps=[{element:".sidebar-header",title:"Welcome, Admin!",content:"This is your CRWI Attendance management console. Let us walk you through the key features.",position:"right"},{element:'.nav-item[data-page="admin"]',title:"User Management",content:"In the Admin Panel, you can add new staff, edit details, and manage roles.",position:"right"},{element:'.nav-item[data-page="master-sheet"]',title:"Attendance Sheet",content:"View and export the master attendance sheet for all employees here.",position:"right"},{element:'.nav-item[data-page="salary"]',title:"Salary Processing",content:"Calculate and process salaries based on attendance logs and penalties.",position:"right"},{element:".main-content",title:"Dashboard Overview",content:"The dashboard gives you real-time insights into who is in, pending leaves, and team activity.",position:"bottom"}]:this.steps=[{element:".sidebar-header",title:"Welcome to CRWI!",content:"This portal helps you track your attendance and work logs. Here is a quick guide.",position:"right"},{element:".action-btn",title:"Check-In / Out",content:"Use this button daily to mark your attendance. Don't forget to add a summary when checking out!",position:"bottom"},{element:'.nav-item[data-page="timesheet"]',title:"Your Timesheet",content:"Review your past logs and request leaves from here.",position:"right"},{element:'.nav-item[data-page="profile"]',title:"Your Profile",content:"View your stats, rewards, and manage your account details.",position:"right"}]}startTour(e){this.steps.length!==0&&(this.active=!0,this.currentStep=0,this.createUIElements(),this.showStep(),localStorage.setItem(this.tourKey+"_"+e.id,"true"))}createUIElements(){this.overlay=document.createElement("div"),this.overlay.className="tour-overlay",this.highlight=document.createElement("div"),this.highlight.className="tour-highlight",this.tooltip=document.createElement("div"),this.tooltip.className="tour-tooltip",document.body.appendChild(this.overlay),document.body.appendChild(this.highlight),document.body.appendChild(this.tooltip)}showStep(){const e=this.steps[this.currentStep],t=document.querySelector(e.element);if(!t||t.offsetParent===null){console.warn("Tour target not found:",e.element),this.nextStep();return}const a=t.getBoundingClientRect(),s=5;this.highlight.style.top=a.top-s+"px",this.highlight.style.left=a.left-s+"px",this.highlight.style.width=a.width+s*2+"px",this.highlight.style.height=a.height+s*2+"px",t.scrollIntoView({behavior:"smooth",block:"center"}),this.tooltip.innerHTML=`
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
            `,this.positionTooltip(a,e.position),this.tooltip.classList.add("active")}positionTooltip(e,t){const a=this.tooltip.getBoundingClientRect(),s=15;let i,d;switch(t){case"right":i=e.top+e.height/2-a.height/2,d=e.right+s;break;case"bottom":i=e.bottom+s,d=e.left+e.width/2-a.width/2;break;case"left":i=e.top+e.height/2-a.height/2,d=e.left-a.width-s;break;case"top":i=e.top-a.height-s,d=e.left+e.width/2-a.width/2;break;default:i=e.bottom+s,d=e.left}const r=window.innerWidth,o=window.innerHeight;d<10&&(d=10),d+a.width>r-10&&(d=r-a.width-10),i<10&&(i=10),i+a.height>o-10&&(i=o-a.height-10),this.tooltip.style.top=i+"px",this.tooltip.style.left=d+"px"}nextStep(){this.currentStep++,this.currentStep<this.steps.length?this.showStep():this.endTour()}endTour(){this.active=!1,this.overlay&&this.overlay.remove(),this.highlight&&this.highlight.remove(),this.tooltip&&this.tooltip.remove()}resetTour(e){localStorage.removeItem(this.tourKey+"_"+e),window.location.reload()}}const Oa=new Ba;typeof window<"u"&&(window.AppTour=Oa);class Ua{constructor(){this.db=H,this.chartInstance=null,this.memo=new Map,typeof window<"u"&&window.addEventListener&&window.addEventListener("app:db-write",e=>{const t=e?.detail?.collection;["attendance","users","work_plans","leaves","minutes"].includes(t)&&this.clearMemo()})}getFlags(){return D&&D.READ_OPT_FLAGS||{}}getTtls(){return D&&D.READ_CACHE_TTLS||{}}async memoize(e,t,a){if(!this.getFlags().FF_READ_OPT_ANALYTICS_CACHE)return a();const i=Date.now(),d=this.memo.get(e);if(d&&d.expiresAt>i)return d.value;const r=await a();return this.memo.set(e,{value:r,expiresAt:i+Math.max(0,Number(t)||0)}),r}clearMemo(e=""){if(!e){this.memo.clear();return}for(const t of this.memo.keys())t.startsWith(e)&&this.memo.delete(t)}async getUsersCached(){const e=this.getTtls().users||6e4;return this.memoize("analytics:users",e,async()=>{if(H&&H.getCached){const t=H.getCacheKey("analyticsUsers","users",{ttl:e});return H.getCached(t,e,()=>this.db.getAll("users"))}return this.db.getAll("users")})}async getAttendanceInRange(e,t,a=""){const s=this.getTtls().attendanceSummary||3e4,i=typeof e=="string"?e:e.toISOString().split("T")[0],d=typeof t=="string"?t:t.toISOString().split("T")[0],r=`analytics:attendance:${i}:${d}:${a}`;return this.memoize(r,s,async()=>this.db.queryMany?this.db.queryMany("attendance",[{field:"date",operator:">=",value:i},{field:"date",operator:"<=",value:d}]):(await this.db.getAll("attendance")).filter(l=>l.date>=i&&l.date<=d))}async initAdminCharts(){const e=document.getElementById("admin-stats-chart");if(!e)return;this.chartInstance&&(this.chartInstance.destroy(),this.chartInstance=null);const t=new Date,a=new Date;a.setDate(a.getDate()-14);const[s,i]=await Promise.all([this.getAttendanceInRange(a,t,"adminChart"),this.getUsersCached()]),d=this.processLast7Days(s,i),r=e.getContext("2d");try{this.chartInstance=new Chart(r,{type:"line",data:{labels:d.labels,datasets:[{label:"Staff Present",data:d.present,borderColor:"#10b981",backgroundColor:"rgba(16, 185, 129, 0.1)",fill:!0,tension:.4,borderWidth:3,pointBackgroundColor:"#10b981",pointRadius:4},{label:"On Leave",data:d.onLeave,borderColor:"#ef4444",backgroundColor:"transparent",borderDash:[5,5],tension:.1,pointRadius:0}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{intersect:!1,mode:"index"},plugins:{legend:{position:"top",labels:{usePointStyle:!0,boxWidth:6}},tooltip:{backgroundColor:"rgba(30, 27, 75, 0.9)",padding:12,titleFont:{size:14,weight:"bold"},bodyFont:{size:13},cornerRadius:8}},scales:{y:{beginAtZero:!0,ticks:{stepSize:1,color:"#6b7280"},grid:{color:"rgba(0,0,0,0.05)"}},x:{grid:{display:!1},ticks:{color:"#6b7280"}}}}})}catch(o){console.error("Chart.js Error:",o),e.parentNode.innerHTML=`<div style="color:red; text-align:center; padding:1rem;">Failed to load chart: ${o.message}</div>`}}processLast7Days(e,t=[]){const a=[],s=[],i=[],d=o=>{if(Object.prototype.hasOwnProperty.call(o||{},"attendanceEligible"))return o.attendanceEligible===!0;const l=String(o?.entrySource||"");return l==="staff_manual_work"?!1:l==="admin_override"||l==="checkin_checkout"||o?.isManualOverride||o?.location==="Office (Manual)"||o?.location==="Office (Override)"||typeof o?.activityScore<"u"||typeof o?.locationMismatched<"u"||typeof o?.autoCheckout<"u"||!!o?.checkOutLocation||typeof o?.outLat<"u"||typeof o?.outLng<"u"?!0:String(o?.type||"").includes("Leave")||o?.location==="On Leave"},r=(o,l)=>o.getFullYear()===l.getFullYear()&&o.getMonth()===l.getMonth()&&o.getDate()===l.getDate();for(let o=6;o>=0;o--){const l=new Date;l.setDate(l.getDate()-o);const c=l.toLocaleDateString("en-US",{weekday:"short",day:"numeric"});a.push(c);const u=e.filter(g=>{const h=new Date(g.date);return isNaN(h.getTime())?!1:r(h,l)}),m=new Set,p=new Set;u.forEach(g=>{if(!d(g))return;const h=g.user_id||g.userId;if(!h)return;String(g.type||"").toLowerCase().includes("leave")||g.location==="On Leave"||g.type==="Absent"?p.add(h):m.add(h)}),o===0&&t.forEach(g=>{g.status==="in"&&m.add(g.id)}),s.push(m.size),i.push(p.size)}return console.log("Weekly Stats Generated (Unique):",{labels:a,present:s}),{labels:a,present:s,onLeave:i}}parseTimeToMinutes(e){if(!e)return null;const[t,a]=e.split(" ");let[s,i]=t.split(":");return s==="12"&&(s="00"),a==="PM"&&(s=parseInt(s,10)+12),parseInt(s,10)*60+parseInt(i,10)}formatDuration(e){const t=Math.floor(e/60),a=e%60;return`${t}h ${a}m`}getWeekNumber(e){const t=new Date(e);t.setHours(0,0,0,0),t.setDate(t.getDate()+4-(t.getUTCDay()||7));const a=new Date(t.getFullYear(),0,1);return Math.ceil(((t-a)/864e5+1)/7)}async getUserMonthlyStats(e){const t=new Date,a=new Date(t.getFullYear(),t.getMonth(),1),s=new Date(t.getFullYear(),t.getMonth()+1,0),d=(await this.getAttendanceInRange(a,s,`monthly:${e}`)).filter(r=>r.userId===e||r.user_id===e);return this.calculateStatsForLogs(d)}async getSystemMonthlySummary(){const e=new Date,t=new Date(e.getFullYear(),e.getMonth(),1),a=new Date(e.getFullYear(),e.getMonth()+1,0),[s,i]=await Promise.all([this.getUsersCached(),this.getAttendanceInRange(t,a,"sysMonthly")]);return await Promise.all(s.map(async r=>{const o=i.filter(c=>(c.userId===r.id||c.user_id===r.id)&&new Date(c.date)>=t&&new Date(c.date)<=a),l=this.calculateStatsForLogs(o);return{user:r,stats:l}}))}calculateStatsForLogs(e){const t=new Date,a=t.getFullYear(),s=t.getMonth(),i=new Date(a,s,1),d=new Date(a,s+1,0),r={Present:0,Late:0,"Early Departure":0,"Work - Home":0,Training:0,"Sick Leave":0,"Casual Leave":0,"Earned Leave":0,"Paid Leave":0,"Maternity Leave":0,Absent:0,Holiday:0,"National Holiday":0,"Regional Holidays":0},o={present:0,late:0,leaves:0,unpaidLeaves:0,penalty:0,penaltyOffset:0,effectivePenalty:0,extraWorkedHours:0,earlyDepartures:0,label:i.toLocaleDateString("default",{month:"long",year:"numeric"}),breakdown:r,totalLateDuration:"0h 0m",totalExtraDuration:"0h 0m"};let l=0,c=0;e.forEach(p=>{const g=new Date(p.date);if(!isNaN(g)&&g>=i&&g<=d){if(!(Object.prototype.hasOwnProperty.call(p,"attendanceEligible")?p.attendanceEligible===!0:(()=>{const _=String(p.entrySource||"");return _==="staff_manual_work"?!1:_==="admin_override"||_==="checkin_checkout"||p.isManualOverride||p.location==="Office (Manual)"||p.location==="Office (Override)"||typeof p.activityScore<"u"||typeof p.locationMismatched<"u"||typeof p.autoCheckout<"u"||!!p.checkOutLocation||typeof p.outLat<"u"||typeof p.outLng<"u"?!0:String(p.type||"").includes("Leave")||p.location==="On Leave"})()))return;let f=p.type||"";const w=this.parseTimeToMinutes(p.checkIn),v=this.parseTimeToMinutes(p.checkOut);if(p.isManualOverride===!0)f==="Late"?(o.late++,r.Late++,w!==null&&w>540&&(l+=w-540)):f==="Early Departure"&&(o.earlyDepartures++,r["Early Departure"]++);else{const _=(typeof D<"u"&&D?D.LATE_CUTOFF_MINUTES:555)||555;(p.lateCountable===!0||!Object.prototype.hasOwnProperty.call(p,"lateCountable")&&w!==null&&w>_)&&(r.Late++,o.late++,w!==null&&(l+=Math.max(0,w-_)));const L=(typeof D<"u"&&D?D.EARLY_DEPARTURE_MINUTES:1020)||1020;v!==null&&v<L&&!String(f).includes("Leave")&&f!=="Absent"&&(o.earlyDepartures++,r["Early Departure"]++)}const k=(typeof D<"u"&&D?D.LATE_CUTOFF_MINUTES:555)||555,y=(typeof D<"u"&&D?D.EARLY_DEPARTURE_MINUTES:1020)||1020,S=typeof p.extraWorkedMs=="number"?Math.max(0,Math.round(p.extraWorkedMs/(1e3*60))):0;S>0?c+=S:!(p.autoCheckout&&!p.autoCheckoutExtraApproved)&&(w!==null&&w<k&&(c+=k-w),v!==null&&v>y&&(c+=v-y)),f==="Work - Home"?r["Work - Home"]++:f==="Training"?r.Training++:f==="Sick Leave"?(r["Sick Leave"]++,o.unpaidLeaves++):f==="Casual Leave"?r["Casual Leave"]++:f==="Earned Leave"?r["Earned Leave"]++:f==="Paid Leave"?r["Paid Leave"]++:f==="Maternity Leave"?r["Maternity Leave"]++:f==="Absent"?(r.Absent++,o.unpaidLeaves++):f==="National Holiday"?r["National Holiday"]++:f==="Regional Holidays"?r["Regional Holidays"]++:String(f).includes("Holiday")?r.Holiday++:p.checkIn&&r.Present++}}),o.present=r.Present+r["Work - Home"]+r.Training,o.leaves=r["Sick Leave"]+r["Casual Leave"]+r["Earned Leave"]+r["Paid Leave"]+r["Maternity Leave"]+r.Absent,o.extraWorkedHours=Number((c/60).toFixed(2)),o.penalty=Math.floor((o.late||0)/((typeof D<"u"&&D?D.LATE_GRACE_COUNT:3)||3))*((typeof D<"u"&&D?D.LATE_DEDUCTION_PER_BLOCK:.5)||.5);const u=(typeof D<"u"&&D?D.EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4)||4,m=(typeof D<"u"&&D?D.LATE_DEDUCTION_PER_BLOCK:.5)||.5;return o.penaltyOffset=Math.floor((o.extraWorkedHours||0)/u)*m,o.effectivePenalty=Math.max(0,o.penalty-o.penaltyOffset),o.totalLateDuration=this.formatDuration(l),o.totalExtraDuration=this.formatDuration(c),o}async getUserYearlyStats(e){const{start:t,end:a,label:s}=this.getFinancialYearDates(),d=(await this.getAttendanceInRange(t,a,`yearly:${e}`)).filter(p=>p.userId===e||p.user_id===e),r={Present:0,Late:0,"Early Departure":0,"Work - Home":0,Training:0,"Sick Leave":0,"Casual Leave":0,"Earned Leave":0,"Paid Leave":0,"Maternity Leave":0,Absent:0,Holiday:0,"National Holiday":0,"Regional Holidays":0},o={present:0,late:0,leaves:0,earlyDepartures:0,penaltyLeaves:0,penaltyOffset:0,effectivePenalty:0,extraWorkedHours:0,label:s,breakdown:r,totalLateDuration:"0h 0m",totalExtraDuration:"0h 0m"};let l=0,c=0;d.forEach(p=>{const g=new Date(p.date);if(!isNaN(g)&&g>=t&&g<=a){if(!(Object.prototype.hasOwnProperty.call(p,"attendanceEligible")?p.attendanceEligible===!0:(()=>{const _=String(p.entrySource||"");return _==="staff_manual_work"?!1:_==="admin_override"||_==="checkin_checkout"||p.isManualOverride||p.location==="Office (Manual)"||p.location==="Office (Override)"||typeof p.activityScore<"u"||typeof p.locationMismatched<"u"||typeof p.autoCheckout<"u"||!!p.checkOutLocation||typeof p.outLat<"u"||typeof p.outLng<"u"?!0:String(p.type||"").includes("Leave")||p.location==="On Leave"})()))return;let f=p.type||"";const w=this.parseTimeToMinutes(p.checkIn),v=this.parseTimeToMinutes(p.checkOut),b=(typeof D<"u"&&D?D.LATE_CUTOFF_MINUTES:555)||555;(p.lateCountable===!0||!Object.prototype.hasOwnProperty.call(p,"lateCountable")&&w!==null&&w>b)&&(r.Late++,w!==null&&(l+=Math.max(0,w-b)));const y=(typeof D<"u"&&D?D.EARLY_DEPARTURE_MINUTES:1020)||1020;v!==null&&v<y&&!String(f).includes("Leave")&&f!=="Absent"&&(o.earlyDepartures++,r["Early Departure"]++);const S=typeof p.extraWorkedMs=="number"?Math.max(0,Math.round(p.extraWorkedMs/(1e3*60))):0;S>0?c+=S:!(p.autoCheckout&&!p.autoCheckoutExtraApproved)&&(w!==null&&w<b&&(c+=b-w),v!==null&&v>y&&(c+=v-y)),f==="Work - Home"?r["Work - Home"]++:f==="Training"?r.Training++:f==="Sick Leave"?r["Sick Leave"]++:f==="Casual Leave"?r["Casual Leave"]++:f==="Earned Leave"?r["Earned Leave"]++:f==="Paid Leave"?r["Paid Leave"]++:f==="Maternity Leave"?r["Maternity Leave"]++:f==="Absent"?r.Absent++:f==="National Holiday"?r["National Holiday"]++:f==="Regional Holidays"?r["Regional Holidays"]++:String(f).includes("Holiday")?r.Holiday++:p.checkIn&&r.Present++}}),o.present=r.Present+r["Work - Home"]+r.Training,o.leaves=r["Sick Leave"]+r["Casual Leave"]+r["Earned Leave"]+r["Paid Leave"]+r["Maternity Leave"]+r.Absent,o.late=r.Late,o.extraWorkedHours=Number((c/60).toFixed(2)),o.totalLateDuration=this.formatDuration(l),o.totalExtraDuration=this.formatDuration(c),o.penaltyLeaves=Math.floor((r.Late||0)/((typeof D<"u"&&D?D.LATE_GRACE_COUNT:3)||3))*((typeof D<"u"&&D?D.LATE_DEDUCTION_PER_BLOCK:.5)||.5);const u=(typeof D<"u"&&D?D.EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4)||4,m=(typeof D<"u"&&D?D.LATE_DEDUCTION_PER_BLOCK:.5)||.5;return o.penaltyOffset=Math.floor((o.extraWorkedHours||0)/u)*m,o.effectivePenalty=Math.max(0,o.penaltyLeaves-o.penaltyOffset),o}getFinancialYearDates(){const e=new Date,t=e.getFullYear(),a=e.getMonth(),s=(typeof D<"u"&&D?D.FY_START_MONTH:3)||3;let i=t;a<s&&(i=t-1);const d=new Date(i,s,1),r=new Date(i+1,s,0);return{start:d,end:r,label:`FY ${i}-${i+1}`}}getDayType(e){const t=typeof e=="string"?new Date(e):e,a=t.getDay();return a===0||a===6&&typeof D<"u"&&D&&D.IS_SATURDAY_OFF&&D.IS_SATURDAY_OFF(t)?"Holiday":"Work Day"}async getHeroOfTheWeek(){try{const e=new Date;e.setDate(e.getDate()-7),e.setHours(0,0,0,0);const[t,a]=await Promise.all([this.getAttendanceInRange(e,new Date,"hero"),this.getUsersCached()]),s=t.filter(l=>{const c=new Date(l.date);return!isNaN(c.getTime())&&c>=e});if(s.length===0)return null;const i={};s.forEach(l=>{const c=l.user_id||l.userId;if(!c)return;i[c]||(i[c]={userId:c,totalDurationMs:0,daysCount:new Set,activityLogDepth:0,avgActivityScore:0,scoreCount:0});const u=i[c];let m=l.durationMs;if(m===void 0&&l.checkIn&&l.checkOut&&l.checkOut!=="Active Now"){const p=this.parseTimeToMinutes(l.checkIn),g=this.parseTimeToMinutes(l.checkOut);p!==null&&g!==null&&(m=(g-p)*60*1e3),m<0&&(m=0)}u.totalDurationMs+=m||0,u.daysCount.add(l.date),u.activityLogDepth+=(l.workDescription||"").length,l.activityScore!==void 0&&(u.avgActivityScore+=l.activityScore,u.scoreCount++)});const d=Object.values(i).map(l=>{const c=l.daysCount.size,u=l.totalDurationMs/(1e3*60*60),m=l.scoreCount>0?l.avgActivityScore/l.scoreCount:70,p=c/7*100,g=Math.min(u/40*100,100),h=Math.min(l.activityLogDepth/500*100,100),f=p*.4+g*.3+h*.2+m*.1;return{...l,days:c,hours:u.toFixed(1),finalScore:f}});d.sort((l,c)=>c.finalScore-l.finalScore);const r=d[0],o=a.find(l=>l.id===r.userId);return o?{user:o,stats:r,reason:this.determineHeroReason(r)}:null}catch(e){return console.error("Hero Calculation Error:",e),null}}determineHeroReason(e){return e.days>=5?"Unmatched Consistency":e.hours>=40?"Hardworking Machine":e.activityLogDepth>300?"Detailed Communicator":"Top Performer"}async getSystemPerformance(){try{const e=new Date;e.setDate(e.getDate()-7);const t=await this.getAttendanceInRange(e,new Date,"performance"),a=[],s=[];let i=0,d=0;const r=(l,c)=>l.getFullYear()===c.getFullYear()&&l.getMonth()===c.getMonth()&&l.getDate()===c.getDate();for(let l=6;l>=0;l--){const c=new Date;c.setDate(c.getDate()-l);const u=c.toLocaleDateString("en-US",{weekday:"narrow"});s.push(u);const m=t.filter(p=>{const g=new Date(p.date);return!isNaN(g.getTime())&&r(g,c)});if(m.length===0)a.push(0);else{const p=m.map(h=>h.activityScore||0).filter(h=>h>0),g=p.length>0?p.reduce((h,f)=>h+f,0)/p.length:0;a.push(Math.round(g)),g>0&&(i+=g,d++)}}return{avgScore:d>0?Math.round(i/d):0,trendData:a,labels:s}}catch(e){return console.error("System Performance Calculation Error:",e),{avgScore:0,trendData:[0,0,0,0,0,0,0]}}}async buildDailyDashboardSummary(e={}){const t=new Date,a=String(e.dateKey||t.toISOString().split("T")[0]),s=String(e.selectedMonth||t.toISOString().slice(0,7)),[i,d]=s.split("-"),r=Number(i),o=Number(d)-1,l=Number.isInteger(r)&&Number.isInteger(o)&&o>=0&&o<=11?new Date(r,o,1):new Date(t.getFullYear(),t.getMonth(),1),c=Number.isInteger(r)&&Number.isInteger(o)&&o>=0&&o<=11?new Date(r,o+1,0):new Date(t.getFullYear(),t.getMonth()+1,0),u=Math.max(1,Number(D?.SUMMARY_POLICY?.TEAM_ACTIVITY_LIMIT)||15),[m,p]=await Promise.all([this.getHeroOfTheWeek(),this.getAllStaffActivities({mode:"month",month:s,scope:"work"})]);return{dateKey:a,monthKey:s,version:Number(D?.SUMMARY_POLICY?.SCHEMA_VERSION||1),generatedAt:Date.now(),hero:m||null,teamActivityPreview:(p||[]).slice(0,u),range:{startIso:l.toISOString().split("T")[0],endIso:c.toISOString().split("T")[0]},meta:{generatedAt:Date.now(),source:"client_first_writer"}}}async getAllStaffActivities(e={}){try{const t=e||{},a=t.mode||"month",s=t.scope||"all",i=new Date,d=new Date;if(a==="days"){const f=Number.isFinite(Number(t.daysBack))?Number(t.daysBack):7;i.setHours(23,59,59,999),d.setDate(d.getDate()-f),d.setHours(0,0,0,0)}else{const f=String(t.month||new Date().toISOString().slice(0,7)),[w,v]=f.split("-"),b=Number(w),k=Number(v)-1;if(!Number.isInteger(b)||!Number.isInteger(k)||k<0||k>11)throw new Error(`Invalid month key: ${f}`);const y=new Date(b,k,1),S=new Date(b,k+1,0);d.setTime(y.getTime()),i.setTime(S.getTime()),d.setHours(0,0,0,0),i.setHours(23,59,59,999)}const r=d.toISOString().split("T")[0],o=i.toISOString().split("T")[0],l=s!=="work",[c,u,m]=await Promise.all([l?this.getAttendanceInRange(d,i,`staffAct:${r}:${o}:${s}`):Promise.resolve([]),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:r},{field:"date",operator:"<=",value:o}]):H.getAll("work_plans"),this.getUsersCached()]),p={};m.forEach(f=>{p[f.id]=f.name});const g=[],h={};return l&&c.forEach(f=>{const w=new Date(f.date);if(w>=d&&w<=i&&f.workDescription){const v=f.user_id||f.userId,b=`${v}:${f.date}`;h[b]||(h[b]=[]),h[b].push(f.workDescription.toLowerCase().trim()),g.push({...f,type:"attendance",staffName:p[v]||f.userName||"Unknown Staff",_displayDesc:f.workDescription,_sortTime:f.checkOut||"00:00"})}}),u.forEach(f=>{const w=new Date(f.date);if(w>=d&&w<=i&&f.plans){const v=`${f.userId}:${f.date}`,b=h[v]||[];f.plans.forEach(k=>{const y=(k.task||"").trim().toLowerCase();if(y&&b.length>0&&b.some(L=>L.includes(y)))return;const S=f.userId||f.user_id;let _=p[S]||f.userName;_||(_=S==="annual_shared"?"All Staff":"Unknown Staff"),g.push({...k,date:f.date,id:f.id,userId:S,type:"work",staffName:_,_displayDesc:k.task,_sortTime:"09:00"})})}}),g.sort((f,w)=>{const v=new Date(w.date)-new Date(f.date);return v!==0?v:w._sortTime.localeCompare(f._sortTime)}),g}catch(t){return console.error("Error fetching all staff activities:",t),[]}}}const Ra=new Ua;typeof window<"u"&&(window.AppAnalytics=Ra);class Ha{constructor(){this.db=H}convertToCSV(e,t,a){const s=t.join(","),i=e.map(d=>a.map(r=>{let o=d[r]||"";return o=String(o).replace(/"/g,'""'),o.search(/("|,|\n)/g)>=0&&(o=`"${o}"`),o}).join(","));return[s,...i].join(`
`)}downloadFile(e,t,a){const s=new Blob([e],{type:a}),i=URL.createObjectURL(s),d=document.createElement("a");d.href=i,d.download=t,document.body.appendChild(d),d.click(),setTimeout(()=>{document.body.removeChild(d),window.URL.revokeObjectURL(i)},0)}async exportAttendanceCSV(){try{const e=await this.db.getAll("users"),t=await this.db.getAll("attendance"),a={};e.forEach(l=>a[l.id]=l);const s=t.map(l=>{const c=l.user_id||l.userId,u=a[c]||{name:"Unknown",role:"N/A",rating:0,completionStats:{}};let m=l.location||"N/A";return l.lat&&l.lng&&(m=`Lat: ${Number(l.lat).toFixed(5)}, Lng: ${Number(l.lng).toFixed(5)}`),{date:l.date,name:u.name,role:u.role,rating:u.rating?u.rating.toFixed(1):"N/A",completionRate:u.completionStats?.completionRate?`${(u.completionStats.completionRate*100).toFixed(0)}%`:"N/A",checkIn:l.checkIn,checkOut:l.checkOut||"--",duration:l.duration||"--",workSummary:l.workDescription||"--",inLocation:m,outLocation:l.checkOutLocation||"--",type:l.type||"Standard"}});e.forEach(l=>{if(l.status==="in"&&l.lastCheckIn){const c=new Date(l.lastCheckIn);s.push({date:c.toLocaleDateString(),name:l.name,role:l.role,checkIn:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:"Active Now",duration:"Working...",workSummary:"Current Session (Active)",inLocation:l.currentLocation?.address||"Current Session",outLocation:"--",type:"Office (Active)"})}}),s.sort((l,c)=>new Date(c.date)-new Date(l.date));const i=["Date","Staff Name","Role","Star Rating","Completion Rate","Check In","Check Out","Duration","Work Summary","Check-in Location","Check-out Location","Type"],d=["date","name","role","rating","completionRate","checkIn","checkOut","duration","workSummary","inLocation","outLocation","type"],r=this.convertToCSV(s,i,d),o=`Attendance_Report_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(r,o,"text/csv"),!0}catch(e){throw console.error("Export Failed:",e),new Error("Failed to generate report")}}async exportUserLogsCSV(e,t){try{const a=t.map(o=>{let l=o.location||"N/A";return o.lat&&o.lng&&(l=`Lat: ${Number(o.lat).toFixed(5)}, Lng: ${Number(o.lng).toFixed(5)}`),{date:o.date,name:e.name,role:e.role,checkIn:o.checkIn,checkOut:o.checkOut||"--",duration:o.duration||"--",workSummary:o.workDescription||"--",inLocation:l,outLocation:o.checkOutLocation||"--",type:o.type||"Standard"}});a.sort((o,l)=>new Date(l.date)-new Date(o.date));const s=["Date","Staff Name","Role","Check In","Check Out","Duration","Work Summary","Check-in Location","Check-out Location","Type"],i=["date","name","role","checkIn","checkOut","duration","workSummary","inLocation","outLocation","type"],d=this.convertToCSV(a,s,i),r=`Attendance_Report_${e.name.replace(/ /g,"_")}_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(d,r,"text/csv"),!0}catch(a){console.error("Export Failed:",a),alert("Failed to export logs: "+a.message)}}async exportMasterSheetCSV(e,t,a,s){try{const i=new Date(t,e+1,0).getDate(),d=["S.No","Staff Name","Department"];for(let u=1;u<=i;u++)d.push(String(u));const r=a.sort((u,m)=>u.name.localeCompare(m.name)).map((u,m)=>{const p=[m+1,u.name,u.dept||"General"];for(let g=1;g<=i;g++){const h=`${t}-${String(e+1).padStart(2,"0")}-${String(g).padStart(2,"0")}`,f=s.filter(w=>(w.userId===u.id||w.user_id===u.id)&&w.date===h);if(f.length>0){const w=f[0];let v=w.type||"P";v==="Short Leave"&&w.durationHours&&(v=`SL(${w.durationHours}h)`),p.push(`${v} (${w.checkIn}-${w.checkOut||"Active"})`)}else p.push("-")}return p}),o=[d.join(","),...r.map(u=>u.join(","))].join(`
`),c=`Attendance_Sheet_${new Date(t,e).toLocaleString("default",{month:"long"})}_${t}.csv`;return this.downloadFile(o,c,"text/csv"),!0}catch(i){console.error("Export Failed:",i),alert("Export Failed: "+i.message)}}async exportLeavesCSV(e){try{const t=["Applied On","Staff Name","FY","Type","From","To","Days/Hrs","Reason","Status","Admin Comment"],a=["appliedOn","userName","financialYear","type","startDate","endDate","daysCount","reason","status","adminComment"],s=e.map(r=>({...r,daysCount:r.type==="Short Leave"?`${r.durationHours||0}h`:r.daysCount})),i=this.convertToCSV(s,t,a),d=`Leave_Requests_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(i,d,"text/csv"),!0}catch(t){console.error("Leave Export Failed:",t),alert("Export Failed: "+t.message)}}async exportCalendarPlansCSV(e,t,a){try{const s=[],i=new Date(a,t+1,0).getDate(),d=new Date(a,t).toLocaleString("default",{month:"long"});for(let u=1;u<=i;u++){const m=`${a}-${String(t+1).padStart(2,"0")}-${String(u).padStart(2,"0")}`;e.leaves.forEach(p=>{m>=p.startDate&&m<=p.endDate&&s.push({date:m,category:"Leave",subject:`${p.userName||"Staff"} - ${p.type}`,details:p.reason||"No reason provided",staff:p.userName||"Staff"})}),e.events.forEach(p=>{p.date===m&&s.push({date:m,category:"Event",subject:p.title,details:p.type||"General Event",staff:"Organization"})}),e.workPlans.forEach(p=>{if(p.date===m){const g=Array.isArray(p.plans)?p.plans:[],h=g.length>0?g.map((f,w)=>{let v=`${w+1}. ${f.task}`;return f.subPlans&&f.subPlans.length>0&&(v+=` (Steps: ${f.subPlans.join(", ")})`),f.tags&&f.tags.length>0&&(v+=` [With: ${f.tags.map(b=>`@${b.name} (${b.status||"pending"})`).join(", ")}]`),v}).join(" | "):"Work Plan";s.push({date:m,category:"Work Plan",subject:"Daily Goals",details:h,staff:p.userName||"Staff"})}})}if(s.length===0)return alert("No plans found for the selected month."),!1;const r=["Date","Category","Subject","Details","Staff Member"],o=["date","category","subject","details","staff"],l=this.convertToCSV(s,r,o),c=`Team_Schedule_${d}_${a}.csv`;return this.downloadFile(l,c,"text/csv"),!0}catch(s){console.error("Calendar Export Failed:",s),alert("Failed to export calendar: "+s.message)}}async exportAnnualListViewCSV(e){try{const t=(e||[]).map(r=>({date:r.date||"",staffName:r.staffName||r.staff||"",assignedBy:r.assignedBy||"",assignedTo:r.assignedTo||"",selfAssigned:r.selfAssigned?"Yes":"No",dueDate:r.dueDate||"",status:r.statusLabel||r.status||"",comments:r.comments||"",tags:Array.isArray(r.tags)?r.tags.join(", "):r.tags||""})),a=["Date","Staff Name","Assigned By","Assigned To","Self Assigned","Due Date","Completion Status","Comments","Tags"],s=["date","staffName","assignedBy","assignedTo","selfAssigned","dueDate","status","comments","tags"],i=this.convertToCSV(t,a,s),d=`Annual_Plan_List_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(i,d,"text/csv"),!0}catch(t){throw console.error("List Export Failed:",t),new Error("Failed to export list: "+t.message)}}}const Fa=new Ha;typeof window<"u"&&(window.AppReports=Fa);class qa{constructor(){this.db=H,this.cache={},this.defaultPolicy={"Annual Leave":{total:10,minDays:3,accrual:"annual"},"Casual Leave":{total:6,maxDays:2,accrual:"monthly"},"Medical Leave":{total:6,certificateThreshold:2,accrual:"annual"},"Maternity Leave":{total:180,paid:!0,gender:"female"},"Paternity Leave":{total:10,paid:!0,gender:"male",minServiceYears:0},"Study Leave":{total:5,paid:!1,requireApproval:!0},"Compassionate Leave":{total:3,paid:!0}}}async getPolicy(){if(this.cache.policy)return this.cache.policy;try{if(window.AppFirestore){const e=await window.AppFirestore.collection("settings").doc("policies").get();e.exists?this.cache.policy={...this.defaultPolicy,...e.data()}:this.cache.policy=this.defaultPolicy}else this.cache.policy=this.defaultPolicy}catch(e){console.warn("Failed to fetch dynamic policy, using default.",e),this.cache.policy=this.defaultPolicy}return this.cache.policy}async updatePolicy(e){try{if(window.AppFirestore)return await window.AppFirestore.collection("settings").doc("policies").set(e,{merge:!0}),this.cache.policy=null,!0;throw new Error("Database not connected")}catch(t){throw console.error("Failed to update policy:",t),t}}async getFinancialYear(e=new Date){const t=e.getMonth(),a=e.getFullYear();return t<3?{label:`${a-1}-${a}`,start:new Date(a-1,3,1),end:new Date(a,2,31)}:{label:`${a}-${a+1}`,start:new Date(a,3,1),end:new Date(a+1,2,31)}}async getUserLeaves(e,t=null){t||(t=(await this.getFinancialYear()).label);try{if(this.db.queryMany&&D?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES)return(await this.db.queryMany("leaves",[{field:"userId",operator:"==",value:e},{field:"financialYear",operator:"==",value:t}])).sort((i,d)=>new Date(d.startDate)-new Date(i.startDate))}catch(s){console.warn("Scoped getUserLeaves query failed, using fallback",s)}return(await this.db.getAll("leaves")).filter(s=>s.userId===e&&s.financialYear===t).sort((s,i)=>new Date(i.startDate)-new Date(s.startDate))}async getLeaveUsage(e,t,a){return(await this.getUserLeaves(e,a.label)).filter(d=>d.type===t&&(d.status==="Approved"||d.status==="Pending")).reduce((d,r)=>d+(parseFloat(r.daysCount)||0),0)}async getMonthlyShortLeaveUsage(e,t){const a=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}`;let s=[];try{this.db.queryMany&&D?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES&&(s=(await this.db.queryMany("leaves",[{field:"userId",operator:"==",value:e},{field:"type",operator:"==",value:"Short Leave"},{field:"startDate",operator:">=",value:`${a}-01`},{field:"startDate",operator:"<=",value:`${a}-31`}])).filter(d=>d.status==="Approved"||d.status==="Pending"))}catch(i){console.warn("Scoped short leave query failed, using fallback",i)}return s.length||(s=(await this.db.getAll("leaves")).filter(d=>d.userId===e&&d.type==="Short Leave"&&d.startDate.startsWith(a)&&(d.status==="Approved"||d.status==="Pending"))),s.reduce((i,d)=>i+(parseFloat(d.daysCount||d.durationHours)||0),0)}async getPendingLeaves(){try{let e=[];if(this.db.queryMany&&D?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES?e=(await this.db.queryMany("leaves",[{field:"status",operator:"==",value:"Pending"}],{orderBy:[{field:"appliedOn",direction:"desc"}]})).sort((a,s)=>new Date(s.appliedOn)-new Date(a.appliedOn)):e=(await this.db.getAll("leaves")).filter(a=>a.status==="Pending").sort((a,s)=>new Date(s.appliedOn)-new Date(a.appliedOn)),e.length>0){const t=await this.db.getAll("users"),a={};t.forEach(s=>{a[s.id]=s.name}),e.forEach(s=>{!s.userName&&a[s.userId]&&(s.userName=a[s.userId])})}return e}catch(e){return console.warn("getPendingLeaves failed, using fallback",e),(await this.db.getAll("leaves").catch(()=>[])).filter(a=>a.status==="Pending").sort((a,s)=>new Date(s.appliedOn)-new Date(a.appliedOn))}}async requestLeave(e){const{userId:t,startDate:a,endDate:s,type:i,durationHours:d}=e,r=new Date(a),o=new Date(s);let l=Math.ceil((o-r)/(1e3*60*60*24))+1;if(l<=0&&i!=="Short Leave")throw new Error("Invalid date range");const c=await this.getFinancialYear(r),u=await this.getLeaveUsage(t,i,c),p=(await this.getPolicy())[i],g=[];if(i==="Short Leave"){const f=await this.getMonthlyShortLeaveUsage(t,r);let w=parseFloat(d||0);w>2&&g.push("Short Leave exceeds 2 hours (standard)."),f+w>4&&g.push(`Monthly Short Leave limit exceeded (${f+w}/4 hours).`),e.daysCount=w}else if(i==="Annual Leave")l<(p.minDays||1)&&g.push(`Annual Leave requested is less than required minimum (${p.minDays||1} days).`),u+l>p.total&&g.push(`Annual Leave balance exceeded (${u+l}/${p.total}).`);else if(i==="Casual Leave")l>p.maxDays&&g.push(`Casual Leave exceeds maximum allowed per request (${p.maxDays} days).`),u+l>p.total&&g.push(`Casual Leave balance exceeded (${u+l}/${p.total}).`);else if(i==="Medical Leave")u+l>p.total&&g.push(`Medical Leave balance exceeded (${u+l}/${p.total}).`),l>p.certificateThreshold&&(e.requireCertificate=!0);else if(i==="Paternity Leave"){const f=await this.db.get("users",t),w=new Date(f.joinDate),v=(r-w)/(1e3*60*60*24*365.25);p.minServiceYears&&v<p.minServiceYears&&g.push(`User has not completed ${p.minServiceYears} year(s) of service (required for Paternity Leave).`),l>p.total&&g.push(`Paternity Leave exceeds limit of ${p.total} days.`)}else["Study Leave","Compassionate Leave"].includes(i)&&p&&l>p.total&&g.push(`${i} exceeds limit of ${p.total} days.`);const h={id:"l"+Date.now(),...e,status:"Pending",appliedOn:new Date().toISOString(),financialYear:c.label,daysCount:l,policyWarnings:g};return await this.db.add("leaves",h),h}async updateLeaveStatus(e,t,a,s=""){const i=await this.db.get("leaves",e);if(!i)throw new Error("Leave not found");if(i.status=t,i.actionBy=a,i.actionDate=new Date().toISOString(),i.adminComment=s,await this.db.put("leaves",i),t==="Approved"){const d=new Date(i.startDate),r=new Date(i.endDate);let o=new Date(d);for(;o<=r;){const l=o.toISOString().split("T")[0],c={id:"att_"+i.userId+"_"+l,user_id:i.userId,date:l,checkIn:"09:00",checkOut:"17:00",duration:"8h 0m",location:"On Leave",type:i.type,status:"in",synced:!1};await this.db.put("attendance",c),o.setDate(o.getDate()+1)}}return i}}const fe=new qa;typeof window<"u"&&(window.AppLeaves=fe);class za{constructor(){this.db=H,this.cleanupFlag=D?.SIMULATION_POLICY?.LEGACY_DUMMY_CLEANUP?.FLAG_KEY||"legacy_dummy_cleanup_v1",this.simulationFlag="simulation_run_v2"}getCleanupPolicy(){const e=D?.SIMULATION_POLICY?.LEGACY_DUMMY_CLEANUP||{},t=new Set((e.TARGET_USER_IDS||[]).map(s=>String(s||"").trim()).filter(Boolean)),a=new Set((e.TARGET_USERNAMES||[]).map(s=>String(s||"").trim().toLowerCase()).filter(Boolean));return{enabled:e.ENABLED!==!1,targetIds:t,targetUsernames:a,auditCollection:String(e.AUDIT_COLLECTION||"system_audit_logs")}}async writeCleanupAudit(e,t={}){const a=this.getCleanupPolicy();try{await this.db.add(a.auditCollection,{type:e,module:"simulation",payload:t,createdAt:Date.now()})}catch(s){console.warn("Simulation audit log write failed:",s)}}async run(){const e=D&&D.READ_OPT_FLAGS||{},t=typeof window<"u"&&window.location&&window.location.hostname?window.location.hostname:"",a=t==="localhost"||t==="127.0.0.1";if(!(!e.ENABLE_SIMULATION_MODULE&&!a)){if(localStorage.getItem(this.cleanupFlag)||(await this.cleanupLegacyDummyData(),localStorage.setItem(this.cleanupFlag,"true")),localStorage.getItem(this.simulationFlag)){console.log("Simulation already ran. Use window.AppSimulation.forceRun() to force.");return}await this.forceRun(),localStorage.setItem(this.simulationFlag,"true")}}async cleanupLegacyDummyData(){const e=this.getCleanupPolicy();if(e.enabled){if(e.targetIds.size===0&&e.targetUsernames.size===0){await this.writeCleanupAudit("legacy_dummy_cleanup_skipped",{reason:"no_targets"});return}try{const a=(await this.db.getAll("users")).filter(m=>e.targetIds.has(m.id)||e.targetUsernames.has((m.username||"").trim().toLowerCase())),s=new Set(a.map(m=>m.id));if(s.size===0){await this.writeCleanupAudit("legacy_dummy_cleanup_skipped",{reason:"no_matches",configuredTargets:{ids:Array.from(e.targetIds),usernames:Array.from(e.targetUsernames)}});return}let i=0,d=0,r=0,o=0;const l=await this.db.getAll("attendance");for(const m of l){const p=m.user_id||m.userId;s.has(p)&&(await this.db.delete("attendance",m.id),i+=1)}const c=await this.db.getAll("leaves");for(const m of c){const p=m.userId||m.user_id;s.has(p)&&(await this.db.delete("leaves",m.id),d+=1)}const u=await this.db.getAll("work_plans");for(const m of u){const p=m.userId||m.user_id;s.has(p)&&(await this.db.delete("work_plans",m.id),r+=1)}for(const m of a)await this.db.delete("users",m.id),o+=1;await this.writeCleanupAudit("legacy_dummy_cleanup_completed",{matchedUserIds:Array.from(s),deleted:{attendance:i,leaves:d,workPlans:r,users:o}}),console.log("Legacy dummy users and linked records removed.",{users:o,attendance:i,leaves:d,workPlans:r})}catch(t){await this.writeCleanupAudit("legacy_dummy_cleanup_failed",{message:t?.message||String(t)}),console.warn("Legacy dummy cleanup failed:",t)}}}async forceRun(){console.log("Starting Office Scenario Simulation (V2)...");const e=new Date;if(window.AppCalendar){const t=new Date(e);t.setDate(t.getDate()+1),await window.AppCalendar.addEvent({title:"Office Picnic/Holiday",date:t.toISOString().split("T")[0],type:"holiday"})}console.log("Simulation Complete.")}}const ht=new za;typeof window<"u"&&(window.AppSimulation=ht,setTimeout(()=>ht.run(),2e3));const ae="minutes";async function ja(n={}){try{const e=n.limit||150;return window.AppDB?await window.AppDB.getAll(ae):(await window.AppFirestore.collection(ae).orderBy("date","desc").limit(e).get()).docs.map(a=>({id:a.id,...a.data()}))}catch(e){throw console.error("Error fetching minutes:",e),e}}async function Wa(n){try{const e=window.AppAuth.getUser(),t={...n,createdBy:e.id,createdByName:e.name||e.username,createdAt:new Date().toISOString(),auditLog:[{userId:e.id,userName:e.name||e.username,timestamp:new Date().toISOString(),action:"Created meeting minutes"}],approvals:{},locked:!1,restrictedFrom:[],allowedViewers:[],accessRequests:[]};return window.AppDB?await window.AppDB.add(ae,t):(await window.AppFirestore.collection(ae).add(t)).id}catch(e){throw console.error("Error adding minute:",e),e}}async function Oe(n,e,t){try{const a=window.AppAuth.getUser(),s=await(window.AppDB?window.AppDB.get(ae,n):window.AppFirestore.collection(ae).doc(n).get().then(r=>r.data()));if(!s)throw new Error("Minute not found");if(s.locked&&!t?.includes("Action Items"))throw new Error("This record is locked.");const i={userId:a.id,userName:a.name||a.username,timestamp:new Date().toISOString(),action:t||"Updated minutes"},d={...s,...e,id:n,auditLog:[...s.auditLog||[],i]};return window.AppDB?await window.AppDB.put(ae,d):await window.AppFirestore.collection(ae).doc(n).update(d),!0}catch(a){throw console.error("Error updating minute:",a),a}}async function Ya(n){try{const e=window.AppAuth.getUser(),t=await(window.AppDB?window.AppDB.get(ae,n):window.AppFirestore.collection(ae).doc(n).get().then(s=>s.data()));if(!t)throw new Error("Minute not found");const a=t.accessRequests||[];return a.some(s=>s.userId===e.id)?!0:(a.push({userId:e.id,userName:e.name||e.username,status:"pending",requestedAt:new Date().toISOString()}),await Oe(n,{accessRequests:a},`Requested access for ${e.name}`))}catch(e){throw console.error("Error requesting access:",e),e}}async function Ka(n,e,t){try{const a=await(window.AppDB?window.AppDB.get(ae,n):window.AppFirestore.collection(ae).doc(n).get().then(r=>r.data()));if(!a)throw new Error("Minute not found");const s=a.accessRequests||[],i=s.find(r=>r.userId===e);if(!i)return;i.status=t;const d=a.allowedViewers||[];return t==="approved"&&!d.includes(e)&&d.push(e),await Oe(n,{accessRequests:s,allowedViewers:d},`${t.toUpperCase()} access request for userId: ${e}`)}catch(a){throw console.error("Error handling access request:",a),a}}async function Va(n,e,t){try{const a=await(window.AppDB?window.AppDB.get(ae,n):window.AppFirestore.collection(ae).doc(n).get().then(i=>i.data()));if(!a||!a.actionItems)throw new Error("Minute or tasks not found");const s=a.actionItems[e];if(!s)throw new Error("Task not found");return s.status=t,t==="completed"&&(s.completedAt=new Date().toISOString()),await Oe(n,{actionItems:a.actionItems},`Updated Task: ${s.task} to ${t}`)}catch(a){throw console.error("Error updating action item:",a),a}}async function Ga(n){try{const e=window.AppAuth.getUser(),t=await(window.AppDB?window.AppDB.get(ae,n):window.AppFirestore.collection(ae).doc(n).get().then(r=>r.data()));if(!t)throw new Error("Minute not found");const a=t.approvals||{};a[e.id]=new Date().toISOString();const s=t.attendeeIds||[],i=s.length>0&&s.every(r=>a[r]),d={approvals:a};return i&&(d.locked=!0),await Oe(n,d,`${i?"FINAL APPROVAL & LOCK":"Signed"} by ${e.name}`)}catch(e){throw console.error("Error approving minute:",e),e}}async function Ja(n){try{return window.AppDB?await window.AppDB.delete(ae,n):(await window.AppFirestore.collection(ae).doc(n).delete(),!0)}catch(e){throw console.error("Error deleting minute:",e),e}}const Za={getMinutes:ja,addMinute:Wa,updateMinute:Oe,approveMinute:Ga,deleteMinute:Ja,requestAccess:Ya,handleAccessRequest:Ka,updateActionItemStatus:Va};typeof window<"u"&&(window.AppMinutes=Za);const lt={async renderPolicyEditor(){const n=await fe.getPolicy();return`
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
        `},setupGlobalHandlers(){window.app_savePolicyChanges=async n=>{n.preventDefault();const e=new FormData(n.target),t=await fe.getPolicy(),a={};Object.keys(t).forEach(s=>{a[s]={...t[s]};const i=l=>{const c=e.get(l);return c!==""&&c!==null?parseInt(c):void 0},d=i(`${s}_total`);d!==void 0&&(a[s].total=d);const r=i(`${s}_min`);r!==void 0?a[s].minDays=r:delete a[s].minDays;const o=i(`${s}_max`);o!==void 0?a[s].maxDays=o:delete a[s].maxDays});try{await fe.updatePolicy(a);const s=n.target.querySelector("button"),i=s.innerHTML;s.innerHTML='<i class="fa-solid fa-check"></i> Saved!',s.style.background="#166534",setTimeout(()=>{s.innerHTML=i,s.style.background="",window.location.reload()},1e3)}catch(s){alert("Failed to update policy: "+s.message)}},window.app_approveLeaveWithWarning=async n=>{const e=await window.appPrompt("Reason for override:","",{title:"Leave Override",confirmText:"Approve With Reason",placeholder:"Enter reason"});if(e)try{await fe.updateLeaveStatus(n,"Approved",Z.getUser().id,`[Overridden] ${e}`),window.location.reload()}catch(t){alert(t.message)}}}};lt.setupGlobalHandlers();typeof window<"u"&&(window.AppAdminPolicies=lt);const Qa={currentYear:new Date().getFullYear(),holidayCache:null,baseline2025:[{name:"Republic Day",date:"2025-01-26",type:"National"},{name:"Maha Shivaratri",date:"2025-02-26",type:"Regional"},{name:"Holi",date:"2025-03-14",type:"Regional"},{name:"Id-ul-Fitr",date:"2025-03-31",type:"Regional"},{name:"Good Friday",date:"2025-04-18",type:"Regional"},{name:"Independence Day",date:"2025-08-15",type:"National"},{name:"Dussehra",date:"2025-10-02",type:"Regional"},{name:"Gandhi Jayanti",date:"2025-10-02",type:"National"},{name:"Diwali",date:"2025-10-20",type:"Regional"},{name:"Christmas",date:"2025-12-25",type:"Regional"}],async render(){const n=await fe.getPolicy(),e=Z.getUser(),t=await fe.getFinancialYear(),a=window.app_hasPerm("policies","admin",e);let s=0;try{const o=new Date,l=o.getDay(),c=o.getDate()-l+(l===0?-6:1),u=new Date(o.setDate(c));u.setHours(0,0,0,0);const m=u.toISOString().split("T")[0];s=(await H.getAll("attendance")).filter(h=>h.user_id===e.id&&h.date>=m).filter(h=>h.checkIn?h.lateCountable===!0?!0:Tt.normalizeType(h.type)==="Late":!1).length}catch(o){console.warn("Error calc lates",o)}const i=Object.keys(n).map(async o=>{const l=await fe.getLeaveUsage(e.id,o,t);return{type:o,usage:l,total:n[o].total,icon:this.getIconForType(o),color:this.getColorForType(o)}}),d=await Promise.all(i),r=await this.renderHolidayTable(this.currentYear,a);return`
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
                            ${d.map(o=>this.renderLeaveCard(o.type,o,o.icon,o.color)).join("")}
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

                ${a?await lt.renderPolicyEditor():""}
            </div>
            `},async loadHolidaySettings(){if(this.holidayCache)return this.holidayCache;const n=await H.get("settings","holidays").catch(()=>null),e=n&&n.byYear?n:{id:"holidays",byYear:{}};return this.holidayCache=e,e},async saveHolidaySettings(n){const e={id:"holidays",byYear:n.byYear||{}};await H.put("settings",e),this.holidayCache=e},buildYearFromBaseline(n){return this.baseline2025.map(e=>{const t=String(e.date).slice(5);return{name:e.name,date:`${n}-${t}`,type:e.type||"Regional"}}).sort((e,t)=>new Date(e.date)-new Date(t.date))},async getHolidaysForYear(n,e=!0){const t=await this.loadHolidaySettings(),a=String(n);return(!Array.isArray(t.byYear[a])||t.byYear[a].length===0)&&(t.byYear[a]=this.buildYearFromBaseline(n),e&&await this.saveHolidaySettings(t)),[...t.byYear[a]].sort((s,i)=>new Date(s.date)-new Date(i.date))},async renderHolidayTable(n,e){const t=await this.getHolidaysForYear(n);return`
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
            `},renderHolidayRows(n,e,t){return e.length?e.map((a,s)=>{const d=new Date(a.date).toLocaleDateString("en-US",{month:"short",day:"numeric"});return`
                <tr>
                    <td>
                        <div class="policies-holiday-name">${a.name}</div>
                        ${a.type==="National"?'<span class="policies-holiday-chip">Compulsory</span>':""}
                    </td>
                    <td class="policies-holiday-date">${d}</td>
                    ${t?`
                        <td class="text-right">
                            <button class="icon-btn" title="Edit" onclick="window.AppPolicies.openHolidayEditor(${s})"><i class="fa-solid fa-pen"></i></button>
                            <button class="icon-btn" title="Delete" onclick="window.AppPolicies.deleteHoliday(${s})"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    `:""}
                </tr>
            `}).join(""):`<tr><td colspan="${t?3:2}" class="policies-empty-holiday">No holiday data available for ${n}</td></tr>`},async changeYear(n){this.currentYear+=n;const e=document.getElementById("policy-year-label"),t=document.getElementById("holidays-container"),a=Z.getUser(),s=window.app_hasPerm("policies","admin",a);e&&t&&(e.textContent=this.currentYear,t.innerHTML=await this.renderHolidayTable(this.currentYear,s))},async openHolidayEditor(n=null){const e=Z.getUser();if(!e||!window.app_hasPerm("policies","admin",e))return;const t=this.currentYear,a=await this.getHolidaysForYear(t),s=Number.isInteger(n)?a[n]:null,i=`holiday-editor-${Date.now()}`,d=`
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
            `;typeof window.app_showModal=="function"?window.app_showModal(d,i):(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",d)},async saveHoliday(n,e=null){n.preventDefault();const t=this.currentYear,a=(document.getElementById("holiday-name-input")?.value||"").trim(),s=(document.getElementById("holiday-date-input")?.value||"").trim(),i=(document.getElementById("holiday-type-input")?.value||"Regional").trim();if(!a||!s){alert("Please provide holiday name and date.");return}if(!s.startsWith(`${t}-`)){alert(`Date must be within ${t}.`);return}const d=await this.loadHolidaySettings(),r=String(t),o=Array.isArray(d.byYear[r])?[...d.byYear[r]]:this.buildYearFromBaseline(t),l={name:a,date:s,type:i==="National"?"National":"Regional"};Number.isInteger(e)&&o[e]?o[e]=l:o.push(l),d.byYear[r]=o.sort((c,u)=>new Date(c.date)-new Date(u.date)),await this.saveHolidaySettings(d),document.querySelector('.modal-overlay[id^="holiday-editor-"]')?.remove(),await this.changeYear(0)},async deleteHoliday(n){const e=Z.getUser();if(!e||!window.app_hasPerm("policies","admin",e)||!await window.appConfirm("Delete this holiday from current year?"))return;const a=this.currentYear,s=await this.loadHolidaySettings(),i=String(a),d=Array.isArray(s.byYear[i])?[...s.byYear[i]]:[];d[n]&&(d.splice(n,1),s.byYear[i]=d,await this.saveHolidaySettings(s),await this.changeYear(0))},getIconForType(n){return{"Annual Leave":"calendar-check","Casual Leave":"mug-hot","Medical Leave":"staff-snake","Maternity Leave":"baby-carriage","Paternity Leave":"baby","Study Leave":"graduation-cap","Compassionate Leave":"hand-holding-heart","Short Leave":"clock"}[n]||"file-circle-check"},getColorForType(n){return{"Annual Leave":"#0f766e","Casual Leave":"#ea580c","Medical Leave":"#dc2626","Maternity Leave":"#be185d","Paternity Leave":"#1d4ed8","Study Leave":"#6d28d9","Compassionate Leave":"#9333ea","Short Leave":"#475569"}[n]||"#64748b"},renderLeaveCard(n,e,t,a){const s=Math.min(100,e.usage/e.total*100);return`
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
            `}};typeof window<"u"&&(window.AppPolicies=Qa);function R(n,e={}){const t=document.createElement(n);if(e.id&&(t.id=e.id),e.className&&(t.className=e.className),e.textContent&&(t.textContent=e.textContent),e.innerHTML&&(t.innerHTML=e.innerHTML),e.attributes)for(const[a,s]of Object.entries(e.attributes))t.setAttribute(a,s);if(e.children)for(const a of e.children)t.appendChild(a);return t}function re(n={}){const e=R("button",{className:n.className,textContent:n.textContent,innerHTML:n.innerHTML,attributes:{type:"button",...n.attributes}});return n.onClick&&e.addEventListener("click",n.onClick),e}const ge=n=>String(n??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");function Xa(n,e){const t=document.createElement("div"),a=window.getComputedStyle(n);for(const l of a)t.style[l]=a[l];t.style.position="absolute",t.style.visibility="hidden",t.style.whiteSpace="pre-wrap",t.style.width=a.width,t.style.height="auto";const s=n.value.substring(0,e);t.textContent=s;const i=document.createElement("span");i.textContent=n.value.substring(e)||".",t.appendChild(i),document.body.appendChild(t);const{offsetLeft:d,offsetTop:r}=i,o=n.getBoundingClientRect();return document.body.removeChild(t),{top:o.top+r-n.scrollTop,left:o.left+d-n.scrollLeft}}function en(n,e,t){let a=document.getElementById("mention-dropdown");a?a.parentElement!==document.body&&document.body.appendChild(a):(a=R("div",{id:"mention-dropdown",className:"mention-dropdown"}),document.body.appendChild(a));let s=0,i=[],d=-1;const r=()=>{a.style.display="none",d=-1},o=()=>{if(i.length===0)return r();a.innerHTML="",i.forEach((u,m)=>{const p=R("div",{className:`mention-item ${m===s?"active":""}`,innerHTML:`
                    <img src="${u.avatar||"https://via.placeholder.com/32"}" class="mention-item-avatar">
                    <span class="mention-item-name">${u.name}</span>
                    <span class="mention-item-role">${u.role||"Staff"}</span>
                `});p.addEventListener("click",()=>l(u)),a.appendChild(p)});const c=Xa(n,d);a.style.top=`${c.top+24}px`,a.style.left=`${c.left}px`,a.style.display="block"},l=c=>{const u=n.value,m=u.substring(0,d),p=u.substring(n.selectionStart);n.value=`${m}@${c.name} ${p}`,n.focus(),r(),t&&t()};n.addEventListener("input",()=>{const c=n.value,u=n.selectionStart,m=c.lastIndexOf("@",u-1);if(m!==-1&&(m===0||/\s/.test(c[m-1]))){const p=c.substring(m+1,u).toLowerCase();if(!/\s/.test(p)){d=m,i=e.filter(g=>g.name.toLowerCase().includes(p)).slice(0,8),s=0,o();return}}r(),t&&t()}),n.addEventListener("keydown",c=>{a.style.display==="block"&&(c.key==="ArrowDown"?(c.preventDefault(),s=(s+1)%i.length,o()):c.key==="ArrowUp"?(c.preventDefault(),s=(s-1+i.length)%i.length,o()):c.key==="Enter"||c.key==="Tab"?(c.preventDefault(),l(i[s])):c.key==="Escape"&&r())}),document.addEventListener("click",c=>{!a.contains(c.target)&&c.target!==n&&r()})}function tn(n,e,t,a,s){const i=R("h3",{textContent:"Plan Your Day"}),d=R("p",{className:"day-plan-subline",textContent:`${n}${e?` - Editing for ${t}`:""}`}),r=a?re({className:"day-plan-delete-btn",attributes:{title:"Delete plan"},innerHTML:'<i class="fa-solid fa-trash"></i>',onClick:()=>window.app_deleteDayPlan(n,s)}):null,o=re({className:"day-plan-close-btn",attributes:{title:"Close"},innerHTML:'<i class="fa-solid fa-xmark"></i>',onClick:c=>c.currentTarget.closest(".day-plan-modal-overlay").remove()}),l=R("div",{className:"day-plan-header-actions",children:[r,o].filter(Boolean)});return R("div",{className:"day-plan-header",children:[R("div",{className:"day-plan-headline",children:[i,d]}),l]})}function an(n,e,t,a,s,i,d,r,o,l){const c=R("div",{className:"day-plan-scroll-area personal-plans-container",attributes:{"data-scope":"personal"}}),u=R("div",{className:"day-plan-scroll-area others-plans-container",attributes:{"data-scope":"annual"}});s.forEach((w,v)=>{const b=Pe({plan:w,idx:v,allUsers:i,targetId:e,defaultScope:d,selectableCollaborators:r,isAdmin:o,currentUserId:l.id,isReference:w.isReference});(w.planScope||w._planScope||d)==="annual"||w.isReference?u.appendChild(b):c.appendChild(b)});const m=R("div",{className:"day-plan-columns",children:[R("div",{className:"day-plan-column",children:[R("div",{className:"day-plan-column-head",children:[R("h4",{className:"day-plan-column-title",textContent:"Self Plan"}),re({className:"btn-premium-add",innerHTML:'<i class="fa-solid fa-plus-circle"></i> <span>Add Personal Plan (@)</span>',onClick:()=>Ce({date:n,targetId:e,scope:"personal",allUsers:i,selectableCollaborators:r,isAdmin:o,container:c})})]}),c]}),R("div",{className:"day-plan-column",children:[R("div",{className:"day-plan-column-head",children:[R("h4",{className:"day-plan-column-title",textContent:"Others' & Annual Plans"}),re({className:"btn-premium-add",innerHTML:'<i class="fa-solid fa-plus-circle"></i> <span>Add Annual Plan (@)</span>',onClick:()=>Ce({date:n,targetId:e,scope:"annual",allUsers:i,selectableCollaborators:r,isAdmin:o,container:u})})]}),u]})]}),p=re({className:"day-plan-discard-btn",textContent:"Discard",onClick:w=>w.currentTarget.closest(".day-plan-modal-overlay").remove()}),g=re({className:"day-plan-save-btn",innerHTML:'<i class="fa-solid fa-check-circle"></i> <span>Save Plan</span>',attributes:{type:"submit"}}),h=R("div",{className:"day-plan-footer",children:[R("div",{className:"day-plan-actions",children:[p,g]})]}),f=R("form",{className:"day-plan-form",attributes:{"data-had-personal":t?"1":"0","data-had-annual":a?"1":"0"},children:[m,h]});return f.addEventListener("submit",w=>window.app_saveDayPlan(w,n,e)),f}function Ce(n){const{date:e,targetId:t,scope:a,allUsers:s,selectableCollaborators:i,isAdmin:d,container:r,existingBlock:o=null}=n,l=Z.getUser(),c=o?window.app_extractBlockData(o):{task:"",subPlans:[],tags:[],status:null,assignedTo:t,startDate:e,endDate:e,planScope:a},u=R("div",{className:"plan-editor-overlay"}),m=R("div",{className:"plan-editor-modal"}),p=R("div",{className:"plan-editor-head",innerHTML:`<h4>${o?"Edit":"Add"} ${a==="annual"?"Annual":"Personal"} Plan <small style="font-weight:400; opacity:0.7; font-size:0.8em; margin-left:5px;">(Use @ to tag)</small></h4>`}),g=R("div",{className:"plan-editor-body"}),h=R("textarea",{className:"plan-editor-textarea",textContent:c.task,attributes:{placeholder:"What is the objective or task for today? Use @ to tag colleagues.",required:!0}}),f=R("div",{className:"plan-editor-tags-container",attributes:{style:"display: none;"}}),w=()=>{const L=h.value,I=[];if(s.forEach(U=>{const M=`@${U.name}`;L.includes(M)&&!I.find(A=>A.id===U.id)&&I.push(U)}),I.length>0){f.style.display="block",f.innerHTML='<label class="plan-editor-tags-label">Tagged Collaborators:</label>';const U=R("div",{className:"plan-editor-tags-wrapper"});I.forEach(M=>{const A=R("span",{className:"day-plan-tag-pill",textContent:`@${M.name}`});U.appendChild(A)}),f.appendChild(U)}else f.style.display="none",f.innerHTML=""},v=R("div",{className:"plan-editor-grid"}),b=R("div",{className:"plan-editor-field"});b.innerHTML="<label>Status</label>";const k=R("select",{className:"plan-editor-select"});k.innerHTML=`
        <option value="" ${c.status?"":"selected"}>Auto-Track</option>
        <option value="completed" ${c.status==="completed"?"selected":""}>Completed</option>
        <option value="in-process" ${c.status==="in-process"?"selected":""}>In Progress</option>
        <option value="not-completed" ${c.status==="not-completed"?"selected":""}>Not Completing</option>
    `,b.appendChild(k);let y=null;if(d){const L=R("div",{className:"plan-editor-field"});L.innerHTML="<label>Assign To</label>",y=R("select",{className:"plan-editor-select"}),s.forEach(I=>{const U=R("option",{textContent:I.name,attributes:{value:I.id,selected:I.id===c.assignedTo}});y.appendChild(U)}),L.appendChild(y),v.appendChild(L)}g.appendChild(h),g.appendChild(f),g.appendChild(v);const S=R("div",{className:"plan-editor-footer"}),_=re({className:"day-plan-discard-btn",textContent:"Cancel",onClick:()=>u.remove()}),T=re({className:"day-plan-save-btn",textContent:o?"Update":"Add to List",onClick:()=>{const L=h.value.trim();if(!L)return alert("Please enter a task description");const I=[];s.forEach(A=>{L.includes(`@${A.name}`)&&!I.find(N=>N.id===A.id)&&I.push({id:A.id,name:A.name,status:"pending"})});const M={plan:{...c,task:L,status:k.value,assignedTo:y?y.value:c.assignedTo||t,tags:I.length>0?I:c.tags||[]},allUsers:s,targetId:t,selectableCollaborators:i,isAdmin:d,currentUserId:l.id};if(o){const A=Pe({...M,idx:Number.parseInt(o.getAttribute("data-index"))});o.replaceWith(A)}else{const A=Pe({...M,idx:r.querySelectorAll(".plan-block").length});r.appendChild(A)}u.remove()}});S.appendChild(_),S.appendChild(T),m.appendChild(p),m.appendChild(g),m.appendChild(S),u.appendChild(m),document.getElementById("modal-container").appendChild(u),h.focus(),en(h,s,w),w()}function Pe(n){const{plan:e={},idx:t=0,allUsers:a=[],targetId:s,defaultScope:i="personal",selectableCollaborators:d=[],isAdmin:r=!1,currentUserId:o="",isReference:l=!1}=n||{},c=String(e.task||""),u=e.assignedTo||s||o,m=e.startDate||"",p=e.endDate||"",g=String(e.planScope||e._planScope||i)==="annual"?"annual":"personal",h=l?e.userName?`${e.userName}'s Plan`:"Others Plan":g==="annual"?"Annual Plan":"Personal Plan",f=c.trim()?c.trim().length>120?`${c.trim().slice(0,120)}...`:c.trim():"New task",w=R("div",{className:(l?"plan-block-ref":"plan-block")+(l?" is-reference-only":""),attributes:{"data-index":t}}),v=R("div",{className:"dp-hidden-data",attributes:{style:"display:none;"}});v.innerHTML=`
        <textarea class="plan-task">${ge(c)}</textarea>
        <select class="plan-status"><option value="${ge(e.status||"")}" selected></option></select>
        <select class="plan-scope"><option value="${ge(g)}" selected></option></select>
        <select class="plan-assignee"><option value="${ge(u)}" selected></option></select>
        <input class="plan-start-date" value="${ge(m)}">
        <input class="plan-end-date" value="${ge(p)}">
    `,e.subPlans&&e.subPlans.forEach(S=>{const _=R("input",{className:"sub-plan-input",attributes:{value:ge(S)}});v.appendChild(_)}),e.tags&&e.tags.forEach(S=>{const _=R("div",{className:"tag-chip",attributes:{"data-id":S.id,"data-name":S.name,"data-status":S.status||"pending"}});v.appendChild(_)}),w.appendChild(v);const b=R("div",{className:"plan-block-header"}),k=R("div",{className:"plan-block-title-group"});k.appendChild(R("span",{className:"day-plan-index-badge",textContent:t+1})),k.appendChild(R("span",{className:"plan-block-summary",textContent:f}));const y=R("div",{className:"plan-block-actions"});if(y.appendChild(R("span",{className:"day-plan-scope-pill",textContent:h})),l||(y.appendChild(re({className:"day-plan-edit-btn",attributes:{title:"Edit plan"},innerHTML:'<i class="fa-solid fa-pen-to-square"></i>',onClick:()=>Ce({date:m,targetId:s,scope:g,allUsers:a,selectableCollaborators:d,isAdmin:r,container:w.parentElement,existingBlock:w})})),t>0&&y.appendChild(re({className:"day-plan-remove-btn",attributes:{title:"Remove task"},innerHTML:'<i class="fa-solid fa-trash-can"></i>',onClick:()=>w.remove()}))),b.appendChild(k),b.appendChild(y),w.appendChild(b),e.tags&&e.tags.length>0){const S=R("div",{className:"plan-block-body"});e.tags.forEach(_=>{const T=R("span",{className:"day-plan-tag-pill",textContent:`@${_.name}`});S.appendChild(T)}),w.appendChild(S)}return w}function Kt(n){if(!n)return null;const e=n.querySelector(".plan-task")?.value||"",t=n.querySelector(".plan-status")?.value||"",a=n.querySelector(".plan-scope")?.value||"personal",s=n.querySelector(".plan-assignee")?.value||"",i=n.querySelector(".plan-start-date")?.value||"",d=n.querySelector(".plan-end-date")?.value||"",r=Array.from(n.querySelectorAll(".sub-plan-input")).map(l=>l.value),o=Array.from(n.querySelectorAll(".tag-chip")).map(l=>({id:l.dataset.id,name:l.dataset.name,status:l.dataset.status}));return{task:e,status:t,planScope:a,assignedTo:s,startDate:i,endDate:d,subPlans:r,tags:o}}async function Vt(n,e=null,t=null){const a=Z.getUser(),s=String(e??"").trim(),i=!s||s==="undefined"||s==="null"?a.id:s,d=await H.getAll("users"),r=a.role==="Administrator"||a.isAdmin,o=i!==a.id,l=t==="annual"?"annual":"personal";window.app_currentDayPlanTargetId=i;const[c,u,m]=await Promise.all([$e.getWorkPlan(i,n,{planScope:"personal"}),$e.getWorkPlan(i,n,{planScope:"annual"}),H.queryMany("work_plans",[{field:"date",operator:"==",value:n}])]),p=!!(c||u),g=d.find(I=>I.id===i),h=g?g.name:"Staff",f=d.filter(I=>I.id!==i),w=(I,U,M=null)=>I?Array.isArray(I.plans)&&I.plans.length>0?I.plans.map(A=>({...A,planScope:U,userName:M||I.userName,isReference:!!M})):[]:[],v=(m||[]).filter(I=>I.id!==$e.getWorkPlanId(n,i,"personal")&&I.id!==$e.getWorkPlanId(n,i,"annual")),b=[];v.forEach(I=>{b.push(...w(I,I.planScope,I.userName))});const k=[...w(c,"personal"),...w(u,"annual"),...b];k.length===0&&k.push({task:"",subPlans:[],tags:[],status:null,assignedTo:i,startDate:n,endDate:n,planScope:l});const y=R("div",{id:"day-plan-modal",className:"day-plan-modal-overlay"}),S=R("div",{className:"day-plan-content"});S.appendChild(tn(n,o,h,p,i)),S.appendChild(an(n,i,c,u,k,d,l,f,r,a)),y.appendChild(S);const _=document.getElementById("modal-container");if(!_)return;const T=document.getElementById("day-plan-modal");T&&T.remove(),_.appendChild(y);const L=document.getElementById("day-plan-modal");if(L){const U=Array.from(document.querySelectorAll(".modal-overlay, .modal")).filter(M=>M!==L).reduce((M,A)=>{const N=Number.parseInt(window.getComputedStyle(A).zIndex,10);return Number.isFinite(N)?Math.max(M,N):M},1e3);L.style.zIndex=String(U+2)}}async function Gt(n=null){const e=document.getElementById("day-plan-modal");if(!e)return;const t=n||"personal",a=t==="annual"?e.querySelector(".others-plans-container"):e.querySelector(".personal-plans-container"),s=e.querySelector(".day-plan-headline p")?.textContent?.match(/\d{4}-\d{2}-\d{2}/),i=s?s[0]:new Date().toISOString().split("T")[0],d=await H.getAll("users"),r=Z.getUser(),o=window.app_currentDayPlanTargetId||r.id,l=r.role==="Administrator"||r.isAdmin,c=d.filter(u=>u.id!==o);Ce({date:i,targetId:o,scope:t,allUsers:d,selectableCollaborators:c,isAdmin:l,container:a})}const nn={openDayPlan:Vt,dayPlanRenderBlockV3:Pe,addPlanBlockUI:Gt,openPlanEditor:Ce,app_extractBlockData:Kt};window.AppDayPlan=nn;window.app_openDayPlan=Vt;window.app_dayPlanRenderBlockV3=Pe;window.app_addPlanBlockUI=Gt;window.app_extractBlockData=Kt;const wt={isWidgetMode:!1,syncInterval:null,init(){console.log("Widget Module Initialized"),new URLSearchParams(window.location.search).get("mode")==="widget"&&(this.isWidgetMode=!0),this.isWidgetMode&&this.enableWidgetMode()},toggle(){if(this.isWidgetMode)this.isWidgetMode=!1,window.opener||window.name==="CRWIWidget"?window.close():this.disableWidgetMode();else{const t=window.screen.width-320-20;window.open(window.location.origin+window.location.pathname+"?mode=widget#dashboard","CRWIWidget",`width=320,height=420,left=${t},top=40,menubar=no,toolbar=no,location=no,status=no,resizable=yes`)}},enableWidgetMode(){document.body.classList.add("widget-mode"),this.renderWidgetView(),this.startSync(),window.resizeTo&&window.resizeTo(320,420)},disableWidgetMode(){document.body.classList.remove("widget-mode");const n=document.getElementById("widget-view");n&&n.remove(),this.stopSync()},startSync(){this.syncInterval&&clearInterval(this.syncInterval),this.syncInterval=setInterval(()=>this.sync(),500)},stopSync(){this.syncInterval&&clearInterval(this.syncInterval)},sync(){if(!this.isWidgetMode)return;const n=document.getElementById("timer-display"),e=document.getElementById("timer-label"),t=document.querySelector(".check-in-widget .status-dot")||document.querySelector('.check-in-widget [style*="background: #10b981"]')||document.querySelector('.check-in-widget [style*="background: #94a3b8"]'),a=document.getElementById("attendance-btn"),s=document.getElementById("location-text"),i=document.getElementById("countdown-container"),d=document.getElementById("countdown-label"),r=document.getElementById("countdown-value"),o=document.getElementById("countdown-progress"),l=document.getElementById("overtime-container"),c=document.getElementById("overtime-value"),u=document.getElementById("widget-view");if(!u)return;const m=u.querySelector("#timer-display"),p=u.querySelector("#timer-label"),g=u.querySelector(".status-dot-indicator"),h=u.querySelector("#attendance-btn"),f=u.querySelector("#location-text"),w=u.querySelector("#countdown-container"),v=u.querySelector("#countdown-label"),b=u.querySelector("#countdown-value"),k=u.querySelector("#countdown-progress"),y=u.querySelector("#overtime-container"),S=u.querySelector("#overtime-value");n&&m&&(m.innerHTML=n.innerHTML,m.style.color=n.style.color),e&&p&&(p.innerHTML=e.innerHTML),t&&g&&(g.style.background=t.style.background||(t.classList.contains("online")?"#10b981":"#94a3b8")),i&&w&&(w.style.display=i.style.display,d&&v&&(v.innerHTML=d.innerHTML),r&&b&&(b.innerHTML=r.innerHTML),o&&k&&(k.style.width=o.style.width)),l&&y&&(y.style.display=l.style.display,c&&S&&(S.innerHTML=c.innerHTML)),a&&h&&(h.innerHTML=a.innerHTML,h.className=a.className,h.disabled=a.disabled),s&&f&&(f.innerHTML=s.innerHTML)},handleWidgetAction(){if(window.opener&&!window.opener.closed)try{if(window.opener.focus(),window.opener.location.hash!=="#dashboard"&&(window.opener.location.hash="#dashboard"),window.opener.app_handleAttendance){window.opener.app_handleAttendance();return}}catch(t){console.warn("Could not communicate with main window:",t)}console.log("Opener lost or closed. Reopening main app...");const n=window.location.origin+window.location.pathname+"#dashboard",e=window.open(n,"CRWIMainApp");if(e){e.focus();const t=document.getElementById("attendance-btn");if(t){const a=t.innerHTML;t.innerHTML='<i class="fa-solid fa-arrow-up-right-from-square"></i> Opening App...',setTimeout(()=>{t.innerHTML=a},3e3)}}else alert("Please allow popups or open the main application window manually.")},renderWidgetView(){let n=document.getElementById("widget-view");n||(n=document.createElement("div"),n.id="widget-view",document.body.appendChild(n));const e=window.AppAuth&&window.AppAuth.getUser()||{name:"User",role:"Staff",avatar:"https://via.placeholder.com/48"};n.innerHTML=`
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
        `}};typeof window<"u"&&(window.Widget=wt,wt.init());let Ge=null,oe=[],ue=null,we=null,_e=0,Ne=!1,Te=null,Je=!1,Jt=0,ze=null,je=null,at=!1,We=null;const nt="release_signal",vt="app_meta",Zt="app_last_seen_release_id",q={active:!1,releaseId:"",commitSha:"",deployedAt:"",notes:"",forceAfterMs:9e4,snoozeMs:3e5,maxSnoozeCount:1,deadlineTs:0,snoozeCount:0},Qt=3e4;window.app_annualYear=new Date().getFullYear();const sn=n=>{const e=Math.max(0,Number(n)||0),t=Math.floor(e/1e3),a=Math.floor(t/60),s=t%60;return`${String(a).padStart(2,"0")}:${String(s).padStart(2,"0")}`},on=()=>{try{return localStorage.getItem(Zt)||""}catch{return""}},rn=n=>{try{localStorage.setItem(Zt,String(n||""))}catch{}},Ye=()=>{We&&(clearInterval(We),We=null)},be=()=>{const n=q.active?Math.max(0,q.deadlineTs-Date.now()):0;return{active:!!q.active,releaseId:q.releaseId||"",commitSha:q.commitSha||"",deployedAt:q.deployedAt||"",notes:q.notes||"",forceAfterMs:Number(q.forceAfterMs)||9e4,snoozeMs:Number(q.snoozeMs)||3e5,maxSnoozeCount:Number(q.maxSnoozeCount)||1,snoozeCount:Number(q.snoozeCount)||0,canSnooze:(Number(q.snoozeCount)||0)<(Number(q.maxSnoozeCount)||1),deadlineTs:Number(q.deadlineTs)||0,remainingMs:n,countdownLabel:sn(n)}};window.app_getReleaseUpdateState=()=>be();const Be=()=>{const n=be(),e=document.querySelector(".dashboard-refresh-link");e&&(n.active?(e.classList.add("is-update-pending"),e.setAttribute("title",`Update available. Auto-refresh in ${n.countdownLabel}`),e.innerHTML=`System update available <span class="dashboard-refresh-countdown">(${n.countdownLabel})</span>`):(e.classList.remove("is-update-pending"),e.setAttribute("title","Check for System Update (Ctrl+Shift+R)"),e.textContent="Check for System Update"))};window.app_applyUpdateCtaState=Be;const st=()=>{Be(),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:update-countdown",{detail:be()}))},Xt=(n=!0)=>{const e=q.releaseId;Ye(),q.active=!1,q.deadlineTs=0,q.snoozeCount=0,n&&e&&rn(e),st()},ea=()=>{Ye(),We=setInterval(()=>{if(!q.active){Ye();return}if(q.deadlineTs-Date.now()<=0){Ye(),window.app_forceRefresh();return}st()},1e3),st()};window.app_snoozeReleaseUpdate=()=>{q.active&&(q.snoozeCount>=q.maxSnoozeCount||(q.snoozeCount+=1,q.deadlineTs=Date.now()+q.snoozeMs,window.app_showSyncToast(`Update snoozed for ${Math.round(q.snoozeMs/6e4)} minutes.`),ea()))};const dn=n=>{const e=String(n.releaseId||n.commitSha||"");if(!e)return;const t=on();e===q.releaseId&&q.active||e!==t&&(q.active=!0,q.releaseId=e,q.commitSha=String(n.commitSha||""),q.deployedAt=String(n.deployedAt||""),q.notes=String(n.notes||""),q.forceAfterMs=Number(n.forceAfterMs)||9e4,q.snoozeMs=Number(n.snoozeMs)||3e5,q.maxSnoozeCount=Number(n.maxSnoozeCount)||1,q.snoozeCount=0,q.deadlineTs=Date.now()+q.forceAfterMs,window.app_showSyncToast("New system update available."),ea(),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:update-available",{detail:be()})))},bt=n=>{!n||n.id!==nt||n.active!==!1&&dn(n)},ta=()=>{if(!at){if(at=!0,window.AppDB&&typeof window.AppDB.listen=="function"){ze=window.AppDB.listen(vt,n=>{const e=(n||[]).find(t=>t.id===nt);e&&bt(e)});return}je=setInterval(async()=>{try{const n=await window.AppDB.get(vt,nt);n&&bt(n)}catch{}},3e4)}},ln=()=>{typeof ze=="function"&&(ze(),ze=null),je&&(clearInterval(je),je=null),at=!1,Xt(!1)};window.app_isAdminUser=(n=window.AppAuth?.getUser())=>n?n.isAdmin===!0:!1;window.app_canSeeAdminPanel=(n=window.AppAuth?.getUser())=>n?window.app_isAdminUser(n)?!0:n.permissions?Object.values(n.permissions).some(e=>e==="admin"):!1:!1;window.app_hasPerm=(n,e="view",t=window.AppAuth?.getUser())=>{if(!t)return!1;if(t.isAdmin===!0)return!0;if(!t.permissions||!t.permissions[n])return!1;const a=t.permissions[n];return e==="view"?a==="view"||a==="admin":e==="admin"?a==="admin":!1};window.app_canManageAttendanceSheet=(n=window.AppAuth?.getUser())=>n?window.app_hasPerm("attendance","admin",n)||!!n.canManageAttendanceSheet:!1;window.app_getReadTelemetry=()=>!window.AppDB||!window.AppDB.getReadTelemetry?{}:window.AppDB.getReadTelemetry();window.app_resetReadTelemetry=()=>{!window.AppDB||!window.AppDB.clearReadTelemetry||window.AppDB.clearReadTelemetry()};window.app_getMyMessages=async()=>{const n=window.AppAuth.getUser();if(!n)return[];try{const[e,t]=await Promise.all([window.AppDB.query("staff_messages","toId","==",n.id),window.AppDB.query("staff_messages","fromId","==",n.id)]),a=new Map;return(e||[]).forEach(s=>a.set(s.id,s)),(t||[]).forEach(s=>a.set(s.id,s)),Array.from(a.values())}catch(e){return console.warn("Message fetch failed, falling back to getAll",e),window.AppDB.getAll("staff_messages")}};const Q=document.getElementById("page-content"),He=document.querySelector(".sidebar"),Fe=document.querySelector(".mobile-header"),qe=document.querySelector(".mobile-nav");window.app_initTheme=()=>{const n=localStorage.getItem("theme")||"light";document.documentElement.setAttribute("data-theme",n),aa(n)};window.app_toggleTheme=()=>{const e=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",e),localStorage.setItem("theme",e),aa(e)};function aa(n){document.querySelectorAll(".theme-toggle i").forEach(e=>{n==="dark"?(e.classList.remove("fa-moon"),e.classList.add("fa-sun")):(e.classList.remove("fa-sun"),e.classList.add("fa-moon"))})}function cn(){"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").then(()=>console.log("ServiceWorker registered")).catch(n=>console.log("ServiceWorker registration failed: ",n))})}const St=(n=new Date)=>`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;window.app_showAttendanceNotice=n=>{if(!n)return;const e=document.getElementById("page-content");if(!e)return;const t=document.getElementById("attendance-policy-notice");t&&t.remove();const a=document.createElement("div");a.id="attendance-policy-notice",a.style.background="#fff7ed",a.style.border="1px solid #fdba74",a.style.color="#9a3412",a.style.padding="0.85rem 1rem",a.style.borderRadius="10px",a.style.marginBottom="0.9rem",a.style.fontSize="0.9rem",a.style.fontWeight="600",a.innerHTML=`<i class="fa-solid fa-circle-info" style="margin-right:0.45rem;"></i>${n}`,e.prepend(a),setTimeout(()=>{const s=document.getElementById("attendance-policy-notice");s&&s.remove()},1e4)};window.app_showSyncToast=(n="Status updated from another device.")=>{const e="app-sync-toast",t=document.getElementById(e);t&&t.remove();const a=document.createElement("div");a.id=e,a.style.position="fixed",a.style.top="14px",a.style.right="14px",a.style.zIndex="10020",a.style.background="#0f172a",a.style.color="#f8fafc",a.style.padding="0.7rem 0.9rem",a.style.borderRadius="10px",a.style.fontSize="0.82rem",a.style.fontWeight="600",a.style.boxShadow="0 8px 25px rgba(15, 23, 42, 0.3)",a.textContent=n,document.body.appendChild(a),setTimeout(()=>{const s=document.getElementById(e);s&&s.remove()},2800)};const At=()=>!Ne&&Date.now()>Jt,it=()=>{Jt=Date.now()+3500},pn=n=>{const e=n.detail;if(!e)return;window.app_refreshNotificationBell&&window.app_refreshNotificationBell().catch(()=>{});const t=e.status||"out",a=Te!==null&&t!==Te,s=Te===null&&t==="in";if(Te=t,!(a||s)||Je)return;const i=!window.location.hash||window.location.hash==="#dashboard",d=document.getElementById("checkout-modal"),r=!!(d&&d.style.display==="flex");if(t==="out"&&r&&(d.style.display="none"),!i){At()&&window.app_showSyncToast("Status updated from another device.");return}Je=!0,(async()=>{try{const o=document.getElementById("page-content");o&&(o.innerHTML=await O.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),At()&&window.app_showSyncToast("Status updated from another device.")}catch(o){console.warn("Realtime dashboard sync failed:",o)}finally{Je=!1}})()};function ot(n){const e=document.querySelector(".sidebar"),t=document.getElementById("sidebar-overlay");e&&t&&(n?(e.classList.add("open"),t.classList.add("active")):(e.classList.remove("open"),t.classList.remove("active")))}function un(){if(window.location.search){const n=window.location.protocol+"//"+window.location.host+window.location.pathname+window.location.hash;window.history.replaceState({path:n},"",n),console.log("Address bar cleaned of query parameters.")}}window.app_toggleSidebar=(n=null)=>{const e=document.querySelector(".sidebar"),t=document.querySelector("#desktop-sidebar-toggle i");if(!e)return;(n!==null?n:!e.classList.contains("collapsed"))?(e.classList.add("collapsed"),t&&(t.classList.remove("fa-angles-left"),t.classList.add("fa-angles-right"))):(e.classList.remove("collapsed"),t&&(t.classList.remove("fa-angles-right"),t.classList.add("fa-angles-left")))};window.app_showModal=(n,e)=>{const t=document.getElementById("modal-container");if(!t)return;const a=document.getElementById(e);a&&a.remove(),t.insertAdjacentHTML("beforeend",n);const s=document.getElementById(e);if(s&&(s.classList.contains("modal-overlay")||s.classList.contains("modal"))){const d=Array.from(document.querySelectorAll(".modal-overlay, .modal")).filter(r=>r!==s).reduce((r,o)=>{const l=Number.parseInt(window.getComputedStyle(o).zIndex,10);return Number.isFinite(l)?Math.max(r,l):r},1e3);s.style.zIndex=String(d+2)}};const X=n=>String(n??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),mn=n=>X(n).replace(/\n/g,"<br>"),ct=n=>String(n?.status||"pending").toLowerCase(),Ue=n=>ct(n)==="pending",na=n=>n?.type==="minute-access-request"?"Minutes":n?.type==="task"?"Task":n?.type==="tag"||n?.type==="mention"?"Tag":n?.type==="reminder"?"Reminder":"Notification",fn=n=>String(n?.description||n?.message||n?.title||"").trim(),sa=n=>{const e=n?.respondedAt||n?.taggedAt||n?.date,t=new Date(e).getTime();if(!t)return"Unknown time";const a=Math.max(0,Math.floor((Date.now()-t)/6e4)),s=a<1?"just now":a<60?`${a} mins ago`:a<1440?`${Math.floor(a/60)} hrs ago`:`${Math.floor(a/1440)} days ago`;return`${new Date(t).toLocaleString()} (${s})`};window.app_refreshNotificationBell=async()=>{const n=document.querySelectorAll(".top-notification-btn");if(!n.length)return;const e=window.AppAuth.getUser(),a=(Array.isArray(e?.notifications)?e.notifications:[]).filter(Ue).length;n.forEach(s=>{const i=s.querySelector(".top-notification-badge");if(!e){s.classList.remove("has-pending"),i&&(i.style.display="none");return}s.classList.toggle("has-pending",a>0),s.setAttribute("title",a>0?`${a} pending notification${a>1?"s":""}`:"Notification history"),i&&(a>0?(i.textContent=a>99?"99+":String(a),i.style.display=""):i.style.display="none")})};window.app_closeNotificationHistory=()=>{const n=document.getElementById("notification-history-modal"),e=document.getElementById("notif-drawer-backdrop");n&&n.classList.remove("notif-drawer-open"),e&&e.classList.remove("notif-drawer-backdrop-visible"),setTimeout(()=>document.getElementById("notif-drawer-root")?.remove(),320)};window.app_respondNotificationFromHistory=async(n,e,t)=>{const a=window.AppAuth.getUser();if(!a)return;const s=t==="approve"?"approve":"reject",i=await window.AppDB.get("users",a.id);if(!i||!Array.isArray(i.notifications)){alert("Notification not found.");return}let d=null,r=-1;if(Number.isInteger(n)&&n>=0&&i.notifications[n]&&(d=i.notifications[n],r=n),!d&&e&&(r=i.notifications.findIndex(o=>String(o.id)===String(e)),r>=0&&(d=i.notifications[r])),!d){alert("This notification is no longer available.");return}if(!Ue(d)){alert("This notification has already been responded."),await window.app_refreshNotificationBell();return}window.app_closeNotificationHistory();try{if(d.type==="minute-access-request"&&window.app_hasPerm("minutes","admin",a)){await window.app_reviewMinuteAccessFromNotification(r,d.id,s==="approve"?"approved":"rejected");return}const o=Number(d.taskIndex);if(d.planId&&Number.isInteger(o)&&o>=0){await window.app_handleTagResponse(d.planId,o,s==="approve"?"accepted":"rejected",r);return}if(d.id){await window.app_handleTagDecision(d.id,s==="approve"?"accepted":"rejected");return}alert("This notification cannot be approved or rejected from history.")}catch(o){console.error("Notification response error:",o),alert("Failed to process notification: "+o.message)}};window.app_openNotificationHistory=async()=>{const n=window.AppAuth.getUser();if(!n)return;const e=await window.AppDB.get("users",n.id).catch(()=>n),t=Array.isArray(e?.notifications)?e.notifications:[],a=Array.isArray(e?.tagHistory)?e.tagHistory:[],s=n.isAdmin||n.role==="Administrator",i=[...t.map((u,m)=>({...u,_source:"live",_index:m})),...a.map(u=>({...u,_source:"history",_index:-1}))].sort((u,m)=>{const p=new Date(u.respondedAt||u.taggedAt||u.date||0).getTime();return new Date(m.respondedAt||m.taggedAt||m.date||0).getTime()-p}),d=u=>{const m=ct(u),p=m==="pending"&&u._source==="live",g=na(u),h=u.taggedByName||"System",f=u.title||`${g} from ${h}`,w=fn(u),v=JSON.stringify(String(u.id||"")),b={pending:{bg:"#fff7ed",border:"#fdba74",badge:"#f97316"},accepted:{bg:"#f0fdf4",border:"#86efac",badge:"#16a34a"},rejected:{bg:"#fef2f2",border:"#fca5a5",badge:"#dc2626"},default:{bg:"#f8fafc",border:"#e2e8f0",badge:"#6b7280"}},k=b[m]||b.default,y=u._source==="history"?`<button class="notif-drawer-dismiss" title="Remove" onclick="window.app_dismissNotifDrawerItem(null, ${v}, 'history')"><i class="fa-solid fa-xmark"></i></button>`:`<button class="notif-drawer-dismiss" title="Remove" onclick="window.app_dismissNotifDrawerItem(${Number(u._index)}, ${v}, 'live')"><i class="fa-solid fa-xmark"></i></button>`,S=p||s&&u.type==="minute-access-request"?`
            <div class="notif-drawer-actions">
                <button type="button" class="notif-drawer-btn approve" onclick="window.app_respondNotificationFromHistory(${Number(u._index)}, ${v}, 'approve')">
                    <i class="fa-solid fa-check"></i> Approve
                </button>
                <button type="button" class="notif-drawer-btn reject" onclick="window.app_respondNotificationFromHistory(${Number(u._index)}, ${v}, 'reject')">
                    <i class="fa-solid fa-xmark"></i> Reject
                </button>
            </div>`:"";return`
            <div class="notif-drawer-item ${p?"is-pending":""}" style="border-color:${k.border}; background:${k.bg};" data-notif-id="${X(String(u.id||""))}">
                <div class="notif-drawer-item-head">
                    <div class="notif-drawer-item-left">
                        <div class="notif-drawer-source-icon">
                            <i class="fa-solid ${u.type==="tag"||u.type==="mention"?"fa-at":u.type==="task"?"fa-list-check":u.type==="minute-access-request"?"fa-file-lines":"fa-bell"}"></i>
                        </div>
                        <div>
                            <div class="notif-drawer-title">${X(f)}</div>
                            <div class="notif-drawer-meta">${X(g)} • ${X(h)} • ${X(sa(u))}</div>
                        </div>
                    </div>
                    <div class="notif-drawer-item-right">
                        <span class="notif-drawer-badge" style="background:${k.badge}">${X(m)}</span>
                        ${y}
                    </div>
                </div>
                ${w?`<div class="notif-drawer-text">${X(w)}</div>`:""}
                ${S}
            </div>`},r=i.length?i.map(d).join(""):`<div class="notif-drawer-empty"><i class="fa-regular fa-bell-slash"></i><p>You're all caught up!</p></div>`,o=t.filter(Ue).length,l=`
        <div class="notif-drawer-backdrop" id="notif-drawer-backdrop" onclick="window.app_closeNotificationHistory()"></div>
        <div class="notif-drawer" id="notification-history-modal">
            <div class="notif-drawer-header">
                <div class="notif-drawer-header-left">
                    <i class="fa-solid fa-bell notif-drawer-header-icon"></i>
                    <div>
                        <div class="notif-drawer-header-title">Notifications</div>
                        <div class="notif-drawer-header-sub">${o>0?`${o} pending action${o>1?"s":""}`:"All caught up"}</div>
                    </div>
                </div>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    ${i.length>0?'<button type="button" class="notif-drawer-clear-btn" onclick="window.app_dismissAllReadNotifications()">Clear Read</button>':""}
                    <button type="button" class="notif-drawer-close-btn" onclick="window.app_closeNotificationHistory()"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <div class="notif-drawer-list" id="notif-drawer-list">${r}</div>
        </div>`,c=document.createElement("div");c.id="notif-drawer-root",c.innerHTML=l,document.body.appendChild(c),requestAnimationFrame(()=>{const u=document.getElementById("notification-history-modal");u&&u.classList.add("notif-drawer-open");const m=document.getElementById("notif-drawer-backdrop");m&&m.classList.add("notif-drawer-backdrop-visible")}),await window.app_refreshNotificationBell()};window.app_dismissNotifDrawerItem=async(n,e,t)=>{const a=window.AppAuth.getUser();if(a)try{const s=await window.AppDB.get("users",a.id);if(!s)return;if(t==="live"){const r=Array.isArray(s.notifications)?[...s.notifications]:[],o=r.findIndex(c=>String(c.id)===String(e)),l=o>=0?o:Number.isInteger(n)&&n>=0?n:-1;l>=0&&(r.splice(l,1),await window.AppDB.update("users",a.id,{notifications:r}),window.AppAuth?.getUser&&Object.assign(window.AppAuth.getUser(),{notifications:r}))}else{const r=Array.isArray(s.tagHistory)?[...s.tagHistory]:[],o=r.findIndex(l=>String(l.id)===String(e));o>=0&&(r.splice(o,1),await window.AppDB.update("users",a.id,{tagHistory:r}))}const i=document.querySelector(`[data-notif-id="${CSS.escape(String(e))}"]`);i&&(i.style.transition="opacity 0.2s, transform 0.2s",i.style.opacity="0",i.style.transform="translateX(30px)",setTimeout(()=>i.remove(),220)),await window.app_refreshNotificationBell();const d=document.querySelector(".notif-drawer-header-sub");if(d){const o=(window.AppAuth.getUser()?.notifications||[]).filter(Ue).length;d.textContent=o>0?`${o} pending action${o>1?"s":""}`:"All caught up"}}catch(s){console.warn("Failed to dismiss notification",s)}};window.app_dismissAllReadNotifications=async()=>{const n=window.AppAuth.getUser();if(n)try{const e=await window.AppDB.get("users",n.id);if(!e)return;const t=(e.notifications||[]).filter(Ue),a=[];await window.AppDB.update("users",n.id,{notifications:t,tagHistory:a}),window.AppAuth?.getUser&&Object.assign(window.AppAuth.getUser(),{notifications:t,tagHistory:a}),await window.app_refreshNotificationBell();const s=document.getElementById("notif-drawer-list");if(s){const i=t.map((d,r)=>({...d,_source:"live",_index:r}));s.innerHTML=i.length?i.map(d=>{const r=ct(d),o=na(d),l=d.taggedByName||"System",c=d.title||`${o} from ${l}`,u=JSON.stringify(String(d.id||""));return`
                        <div class="notif-drawer-item is-pending" data-notif-id="${X(String(d.id||""))}">
                            <div class="notif-drawer-item-head">
                                <div class="notif-drawer-item-left">
                                    <div class="notif-drawer-source-icon"><i class="fa-solid fa-at"></i></div>
                                    <div>
                                        <div class="notif-drawer-title">${X(c)}</div>
                                        <div class="notif-drawer-meta">${X(o)} • ${X(l)} • ${X(sa(d))}</div>
                                    </div>
                                </div>
                                <div class="notif-drawer-item-right">
                                    <span class="notif-drawer-badge" style="background:#f97316">${X(r)}</span>
                                    <button class="notif-drawer-dismiss" onclick="window.app_dismissNotifDrawerItem(${d._index}, ${u}, 'live')"><i class="fa-solid fa-xmark"></i></button>
                                </div>
                            </div>
                            <div class="notif-drawer-actions">
                                <button class="notif-drawer-btn approve" onclick="window.app_respondNotificationFromHistory(${d._index}, ${u}, 'approve')"><i class="fa-solid fa-check"></i> Approve</button>
                                <button class="notif-drawer-btn reject" onclick="window.app_respondNotificationFromHistory(${d._index}, ${u}, 'reject')"><i class="fa-solid fa-xmark"></i> Reject</button>
                            </div>
                        </div>`}).join(""):`<div class="notif-drawer-empty"><i class="fa-regular fa-bell-slash"></i><p>You're all caught up!</p></div>`}}catch(e){console.warn("Failed to clear notifications",e)}};window.app_systemDialog=function({title:n="Notice",message:e="",mode:t="alert",defaultValue:a="",confirmText:s="OK",cancelText:i="Cancel",placeholder:d=""}={}){return new Promise(r=>{const o=`system-dialog-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,l=`${o}-input`,c=t==="prompt",u=t==="confirm"||t==="prompt",m=`
                <div class="modal-overlay app-system-dialog-overlay" id="${o}" style="display:flex;">
                    <div class="modal-content app-system-dialog">
                        <div class="app-system-dialog-head">
                            <h3>${X(n)}</h3>
                            <button type="button" class="app-system-dialog-close" aria-label="Close dialog">&times;</button>
                        </div>
                        <div class="app-system-dialog-body">
                            <p>${mn(e)}</p>
                            ${c?`<input id="${l}" class="app-system-dialog-input" type="text" value="${X(a)}" placeholder="${X(d)}" autocomplete="off">`:""}
                        </div>
                        <div class="app-system-dialog-actions">
                            ${u?`<button type="button" class="action-btn secondary app-system-dialog-cancel">${X(i)}</button>`:""}
                            <button type="button" class="action-btn app-system-dialog-confirm">${X(s)}</button>
                        </div>
                    </div>
                </div>
            `;(document.body||document.getElementById("modal-container")).insertAdjacentHTML("beforeend",m);const p=document.getElementById(o);if(!p){r(c?null:!1);return}p.style.zIndex="20000";const g=p.querySelector(".app-system-dialog-confirm"),h=p.querySelector(".app-system-dialog-cancel"),f=p.querySelector(".app-system-dialog-close"),w=c?p.querySelector(`#${l}`):null,v=b=>{p.remove(),r(b)};g?.addEventListener("click",()=>{v(c?w?w.value:"":!0)}),h?.addEventListener("click",()=>v(c?null:!1)),f?.addEventListener("click",()=>v(c?null:!1)),p.addEventListener("click",b=>{b.target===p&&v(c?null:!1)}),p.addEventListener("keydown",b=>{b.key==="Escape"&&v(c?null:!1),b.key==="Enter"&&(b.preventDefault(),v(c?w?w.value:"":!0))}),w?(w.focus(),w.select()):g?.focus()})};window.appAlert=(n,e="Notice")=>window.app_systemDialog({title:e,message:n,mode:"alert",confirmText:"OK"});window.appConfirm=(n,e="Please Confirm")=>window.app_systemDialog({title:e,message:n,mode:"confirm",confirmText:"Confirm",cancelText:"Cancel"});window.appPrompt=(n,e="",t={})=>window.app_systemDialog({title:t.title||"Enter Details",message:n,mode:"prompt",defaultValue:e,confirmText:t.confirmText||"Save",cancelText:t.cancelText||"Cancel",placeholder:t.placeholder||""});window.alert=n=>{window.appAlert(n)};window.app_openEventModal=()=>{window.app_showModal(`
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
        `,"event-modal")};window.app_submitEvent=async n=>{n.preventDefault();const e=document.getElementById("event-title").value,t=document.getElementById("event-date").value,a=document.getElementById("event-type").value;try{await window.AppCalendar.addEvent({title:e,date:t,type:a}),alert("Event added successfully!"),document.getElementById("event-modal")?.remove();const s=document.getElementById("page-content");s.innerHTML=await O.renderDashboard(),de()}catch(s){alert("Error: "+s.message)}};const kt="work_plan_schema_v2_migrated",yn=async()=>{try{if(!window.AppDB||typeof window.AppDB.getAll!="function"||typeof window.AppDB.put!="function"||localStorage.getItem(kt)==="true")return;const n=await window.AppDB.getAll("work_plans");let e=0;for(const t of n){if(!t||Array.isArray(t.plans))continue;const a=typeof t.plan=="string"?t.plan.trim():"";if(!a)continue;const s={...t,plans:[{task:a,subPlans:Array.isArray(t.subPlans)?t.subPlans:[],tags:Array.isArray(t.tags)?t.tags:[],status:t.status||null,completedDate:t.completedDate||null,startDate:t.startDate||t.date,endDate:t.endDate||t.startDate||t.date}]};delete s.plan,delete s.subPlans,delete s.tags,delete s.status,delete s.completedDate,delete s.startDate,delete s.endDate,await window.AppDB.put("work_plans",s),e+=1}localStorage.setItem(kt,"true"),e>0&&console.log(`Work plan schema migration complete. Updated: ${e}`)}catch(n){console.warn("Work plan schema migration failed:",n)}};async function gn(){window.app_initTheme(),un(),window.addEventListener("app:user-sync",pn),window.addEventListener("app:update-available",Be),window.addEventListener("app:update-countdown",Be);try{await window.AppAuth.init();const e=window.AppAuth.getUser();e&&(Te=e.status||"out",ta()),cn(),await yn(),window.AppActivity&&window.AppActivity.initCommandListener()}catch(e){console.error("Initialization Failed:",e),Q&&(Q.innerHTML=`<div style="text-align:center; padding:2rem; color:red;">Failed to load application.<br><small>${e.message}</small></div>`)}document.addEventListener("click",e=>{e.target.id==="sidebar-toggle"||e.target.closest("#sidebar-toggle")?ot(!0):e.target.id==="sidebar-overlay"&&ot(!1)}),window.addEventListener("hashchange",Dt),Dt();const n=window.AppAuth.getUser();n&&window.AppTour&&window.AppTour.init(n)}async function Dt(){const n=window.AppAuth.getUser(),e=window.location.hash.slice(1)||"dashboard";if(e!=="admin"&&oe&&oe.length>0&&(console.log("Cleaning up Admin Realtime Listener."),oe.forEach(o=>typeof o=="function"&&o()),oe=[]),e!=="minutes"&&typeof ue=="function"&&(console.log("Cleaning up Minutes Realtime Listener."),ue(),ue=null),!n){ln(),He&&(He.style.display="none"),Fe&&(Fe.style.display="none"),qe&&(qe.style.display="none"),document.body.style.background="#f3f4f6",Q&&(Q.innerHTML=O.renderLogin()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell();return}ta(),ot(!1),He&&(He.style.display=""),Fe&&(Fe.style.display=""),qe&&(qe.style.display="");const t=document.querySelector(".sidebar-footer .user-mini-profile");t&&(t.innerHTML=`
                <img src="${n.avatar||"https://ui-avatars.com/api/?name=User"}" alt="User">
                <div>
                    <p class="user-name">${n.name||"Staff Member"}</p>
                </div>
                <i class="fa-solid fa-gear user-settings-icon"></i>
            `);const a=window.app_hasPerm("attendance","view",n),s=window.app_hasPerm("reports","view",n),i=window.app_hasPerm("policies","view",n),d=window.app_canSeeAdminPanel(n);document.querySelectorAll('a[data-page="admin"]').forEach(o=>{o.style.display=d?"flex":"none",d||o.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="master-sheet"]').forEach(o=>{o.style.display=a?"flex":"none",a||o.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="salary"]').forEach(o=>{o.style.display=s?"flex":"none",s||o.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="policy-test"]').forEach(o=>{o.style.display=i?"flex":"none",i||o.style.setProperty("display","none","important")}),document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(o=>{o.dataset.page===e?o.classList.add("active"):o.classList.remove("active")});try{const o=document.getElementById("modal-container");if(o&&!document.getElementById("checkout-modal")&&o.insertAdjacentHTML("beforeend",O.renderModals()),Q&&(Q.innerHTML='<div class="loading-spinner"></div>'),e==="dashboard")Q.innerHTML=await O.renderDashboard(),de();else if(e==="staff-directory")Q.innerHTML=await O.renderStaffDirectoryPage();else if(e==="policies")window.AppPolicies&&typeof window.AppPolicies.render=="function"?Q.innerHTML=await window.AppPolicies.render():Q.innerHTML='<div style="padding:1rem; color:#b91c1c;">Policies module failed to load.</div>';else if(e==="annual-plan")Q.innerHTML=await O.renderAnnualPlan();else if(e==="timesheet")Q.innerHTML=await O.renderTimesheet();else if(e==="profile")Q.innerHTML=await O.renderProfile();else if(e==="salary"){if(!window.app_hasPerm("reports","view",n)){window.location.hash="dashboard";return}Q.innerHTML=await O.renderSalaryProcessing?await O.renderSalaryProcessing():await O.renderSalary()}else if(e==="policy-test"){if(!window.app_hasPerm("policies","view",n)){window.location.hash="dashboard";return}Q.innerHTML=await O.renderPolicyTest()}else if(e==="master-sheet"){if(!window.app_canManageAttendanceSheet(n)){window.location.hash="dashboard";return}Q.innerHTML=await O.renderMasterSheet()}else if(e==="minutes")Q.innerHTML=await O.renderMinutes(),wn();else if(e==="admin"){if(!window.app_canSeeAdminPanel(n)){window.location.hash="dashboard";return}Q.innerHTML=await O.renderAdmin(),window.AppAnalytics.initAdminCharts(),hn()}window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}catch(o){console.error("Render Error:",o),Q.innerHTML=`<div style="text-align:center; color:red; padding:2rem;">Error loading page: ${o.message}</div>`}}function hn(){oe.forEach(s=>typeof s=="function"&&s()),oe=[],console.log("Starting Admin Realtime Listeners (Users & Audits)...");let n=null;const e=()=>{n&&clearTimeout(n),n=setTimeout(async()=>{n=null,await t()},600)},t=async()=>{if(window.location.hash.slice(1)!=="admin")return;if(document.querySelector('.modal-overlay[style*="display: flex"], .modal[style*="display: flex"]'))console.log("Admin Update received but skipped because a modal is open.");else{console.log("Admin Data Update Received (Realtime) - Refreshing UI");const d=document.getElementById("page-content");if(d){const r=document.getElementById("audit-start")?.value,o=document.getElementById("audit-end")?.value;d.innerHTML=await O.renderAdmin(r,o),window.AppAnalytics&&window.AppAnalytics.initAdminCharts()}}};if((D&&D.READ_OPT_FLAGS||{}).FF_READ_OPT_TARGETED_REALTIME&&window.AppDB.listenQuery){oe.push(window.AppDB.listenQuery("users",[{field:"status",operator:"in",value:["in","out"]}],{limit:300},e));const s=new Date;s.setDate(s.getDate()-2),oe.push(window.AppDB.listenQuery("location_audits",[{field:"timestamp",operator:">=",value:s.getTime()}],{orderBy:[{field:"timestamp",direction:"desc"}],limit:300},e))}else oe.push(window.AppDB.listen("users",e)),oe.push(window.AppDB.listen("location_audits",e))}function wn(){if(!window.AppDB||!window.AppDB.listen)return;typeof ue=="function"&&(ue(),ue=null);const n=async()=>{if((window.location.hash.slice(1)||"dashboard")!=="minutes"||document.getElementById("minute-detail-modal"))return;const a=document.getElementById("page-content");a&&(a.innerHTML=await O.renderMinutes())};(D&&D.READ_OPT_FLAGS||{}).FF_READ_OPT_TARGETED_REALTIME&&window.AppDB.listenQuery?ue=window.AppDB.listenQuery("minutes",[],{orderBy:[{field:"date",direction:"desc"}],limit:150},n):ue=window.AppDB.listen("minutes",n)}function vn(n=null,e=!1){Ge&&clearInterval(Ge),(async()=>{let a="out",s=null;if(n)a=n.status||"out",s=n.lastCheckIn||null;else{const m=await window.AppAttendance.getStatus();a=m.status,s=m.lastCheckIn}const i=document.getElementById("timer-display"),d=document.getElementById("countdown-container"),r=document.getElementById("overtime-container"),o=document.getElementById("countdown-value"),l=document.getElementById("countdown-progress"),c=document.getElementById("overtime-value"),u=document.getElementById("timer-label");if(a==="in"&&s){const m=new Date(s),p=new Date,g=`${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,"0")}-${String(m.getDate()).padStart(2,"0")}`,h=`${p.getFullYear()}-${String(p.getMonth()+1).padStart(2,"0")}-${String(p.getDate()).padStart(2,"0")}`,f=g!==h,w=new Date(m);w.setHours(17,0,0,0);const v=m.getDay();v===6&&w.setHours(13,0,0,0),v===0&&w.setHours(17,0,0,0),Ge=setInterval(()=>{const b=Date.now(),k=b-s;if(i){let S=Math.floor(k/36e5),_=Math.floor(k/(1e3*60)%60),T=Math.floor(k/1e3%60);S=S<10?"0"+S:S,_=_<10?"0"+_:_,T=T<10?"0"+T:T,i.textContent=`${S} : ${_} : ${T}`}if(f){d&&(d.style.display="none"),r&&(r.style.display="none"),i&&(i.style.color="#b45309"),u&&(u.textContent="Session Carryover (Please Check Out)",u.style.color="#b45309");return}const y=w.getTime()-b;if(y>0){d&&(d.style.display="block"),r&&(r.style.display="none"),u&&(u.textContent="Elapsed Time",u.style.color="#6b7280"),i&&(i.style.color="#1f2937");let S=Math.floor(y/(1e3*60*60)%24),_=Math.floor(y/(1e3*60)%60),T=Math.floor(y/1e3%60);S=S<10?"0"+S:S,_=_<10?"0"+_:_,T=T<10?"0"+T:T;const L=w.getTime()-s,I=L>0?Math.min(100,k/L*100):100;o&&(o.textContent=`${S}:${_}:${T}`),l&&(l.style.width=`${I}%`),l&&(l.style.background="var(--primary)")}else{d&&(d.style.display="none"),r&&(r.style.display="block");const S=Math.abs(b-w.getTime());let _=Math.floor(S/(1e3*60*60)),T=Math.floor(S/(1e3*60)%60),L=Math.floor(S/1e3%60);_=_<10?"0"+_:_,T=T<10?"0"+T:T,L=L<10?"0"+L:L,c&&(c.textContent=`+ ${_}:${T}:${L}`),i&&(i.style.color="#c2410c"),u&&(u.textContent="Total Elapsed (Overtime)",u.style.color="#c2410c")}},1e3),!e&&window.AppActivity&&window.AppActivity.start&&window.AppActivity.start()}else i&&(i.textContent="00 : 00 : 00",i.style.color=""),u&&(u.textContent="Elapsed Time",u.style.color=""),d&&(d.style.display="none"),r&&(r.style.display="none")})()}window.getLocation=function(){return new Promise((e,t)=>{(async()=>{const a=window.location&&window.location.hostname?window.location.hostname:"",s=a==="localhost"||a==="127.0.0.1"||a==="::1";if(!window.isSecureContext&&!s){t("Location requires HTTPS on mobile. Open this app using an HTTPS URL and allow location access.");return}const i=Date.now();if(we&&i-_e<Qt){console.log("Using cached location (freshness: "+(i-_e)+"ms)"),e(we);return}if(!navigator.geolocation){t("Geolocation is not supported by your browser.");return}try{if(navigator.permissions&&navigator.permissions.query){const r=await navigator.permissions.query({name:"geolocation"});if(r&&r.state==="denied"){t("Location permission is blocked. Enable location for this site in browser settings and try again.");return}}}catch{}const d=r=>new Promise((o,l)=>{navigator.geolocation.getCurrentPosition(o,l,r)});try{console.log("Requesting Location: High Accuracy (GPS)...");const r=await d({enableHighAccuracy:!0,timeout:1e4,maximumAge:5e3}),o={lat:r.coords.latitude,lng:r.coords.longitude};we=o,_e=Date.now(),e(o)}catch(r){console.warn("High Accuracy Failed:",r.message);try{console.log("Requesting Location: Low Accuracy (Fallback)...");const o=await d({enableHighAccuracy:!1,timeout:15e3,maximumAge:1e4}),l={lat:o.coords.latitude,lng:o.coords.longitude};we=l,_e=Date.now(),e(l)}catch(o){console.error("Low Accuracy Failed:",o.message);let l="Unable to retrieve location.";o.code===1?l="Location permission denied.":o.code===2?l="Location unavailable. Ensure GPS/Location Services are turned on.":o.code===3&&(l="Location request timed out. Move to open sky or better network and try again."),t(l)}}})().catch(a=>{t(a&&a.message?a.message:"Unable to retrieve location.")})})};const ie=n=>/^\d{4}-\d{2}-\d{2}$/.test(String(n||"")),bn={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11},Sn=(n="")=>{const e=String(n||"").trim();if(!e)return null;const t=e.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);if(!t)return null;const a=Number(t[1]),s=Number(t[2]),i=String(t[3]||"").toLowerCase(),d=Number(t[4]),r=bn[i];if(!Number.isInteger(a)||!Number.isInteger(s)||!Number.isInteger(r)||!Number.isInteger(d))return null;const o=new Date(d,r,a),l=new Date(d,r,s);if(Number.isNaN(o.getTime())||Number.isNaN(l.getTime()))return null;const c=`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`,u=`${l.getFullYear()}-${String(l.getMonth()+1).padStart(2,"0")}-${String(l.getDate()).padStart(2,"0")}`;return u<c?null:{startDate:c,endDate:u}},ia=(n,e,t=null)=>{const a=ie(e)?String(e):null,s=n?.startDate,i=n?.endDate,d=!ie(s)&&!ie(i)?Sn(n?.task||""):null;let r=ie(s)?String(s):d?.startDate||a,o=ie(i)?String(i):d?.endDate||r||a;if((!ie(s)||!ie(i))&&n?.sourcePlanId&&t?.workPlans){const l=(t.workPlans||[]).find(m=>m.id===n.sourcePlanId),c=Number.isInteger(n.sourceTaskIndex)?n.sourceTaskIndex:Number(n.sourceTaskIndex),u=l&&Array.isArray(l.plans)&&Number.isInteger(c)?l.plans[c]:null;if(u){const m=ie(u.startDate)?u.startDate:l.date||r,p=ie(u.endDate)?u.endDate:u.startDate||l.date||o;ie(s)||(r=m),ie(i)||(o=p)}}return r&&o&&o<r?{startDate:r,endDate:r}:{startDate:r,endDate:o}},oa=(n,e,t,a=null)=>{const{startDate:s,endDate:i}=ia(n,e,a);return!s||!i?e===t:!(t<s||t>i||n?.completedDate&&n.completedDate<t)};window.app_getDayEvents=(n,e,t={})=>{const a=t.includeAuto!==!1,s=t.dedupe!==!1,i=t.userId||null;if(!e)return[];if(Array.isArray(e))return e.filter(l=>l.date===n);const d=new Date(n),r=[];if(a&&window.AppAnalytics){const l=window.AppAnalytics.getDayType(d);l==="Holiday"?r.push({title:"Company Holiday (Weekend)",type:"holiday",date:n}):l==="Half Day"&&r.push({title:"Half Working Day (Sat)",type:"event",date:n})}if((e.leaves||[]).forEach(l=>{n>=l.startDate&&n<=l.endDate&&r.push({title:`${l.userName||"Staff"} (Leave)`,type:"leave",userId:l.userId,date:n})}),(e.events||[]).forEach(l=>{l.date===n&&r.push({title:l.title,type:l.type||"event",date:n})}),(e.workPlans||[]).forEach(l=>{if(l.date>n)return;const u=(Array.isArray(l.plans)?l.plans:[]).filter(h=>oa(h,l.date,n,e));if(!u.length)return;const g=`${(l.planScope||"personal")==="annual"?"All Staff (Annual)":l.userName||"Staff"}: ${u.map(h=>h.task).join("; ")}`;r.push({title:g,type:"work",userId:l.userId,plans:u,date:n,planScope:l.planScope||"personal"})}),i){const l=[];r.forEach(c=>{if(c.type!=="work"){l.push(c);return}if((c.planScope||"").toLowerCase()==="annual"){l.push(c);return}if(c.userId===i){l.push(c);return}if(Array.isArray(c.plans)&&c.plans.some(m=>Array.isArray(m.tags)&&m.tags.some(p=>p.id===i&&p.status==="accepted"))){l.push(c);return}}),r.length=0,r.push(...l)}if(!s)return r;const o=new Set;return r.filter(l=>{const c=l.type||"event";if(c!=="holiday"&&c!=="event")return!0;const u=`${c}|${l.title||""}|${l.userId||""}|${l.date||n}`;return o.has(u)?!1:(o.add(u),!0)})};const pt=(n,e)=>{const t=String(n??"").trim();return!t||t==="undefined"||t==="null"?e:t},me=n=>String(n??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),xt=n=>String(n??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'"),ra=n=>{const e=String(n||"").trim();if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?"":`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`},Ve=(n,e)=>{const t=ra(n);if(!t)return"NA";const a=t.replace(/-/g,""),s=String(e||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase().slice(-3)||"USR";return`EMP-${a}-${s}`},Se=(n,e="NA")=>{if(n==null||n==="")return e;const t=n instanceof Date?n:new Date(n);return Number.isNaN(t.getTime())?e:t.toLocaleDateString("en-GB")},An=(n,e="NA")=>{if(n==null||n==="")return e;const t=n instanceof Date?n:new Date(n);return Number.isNaN(t.getTime())?e:t.toLocaleString("en-GB")},kn=n=>`Rs ${Number(n||0).toLocaleString("en-IN")}`,Dn=(n="")=>{const e=String(n||"").replace(/\s+/g," ").trim();return e?e.length>72?`${e.slice(0,72)}...`:e:"New task"},ut=()=>`
        <div class="no-tags-placeholder day-plan-no-tags-placeholder">
            <p class="day-plan-no-tags-text">No collaborators yet</p>
        </div>
    `,da=(n,e,t="pending")=>`
        <div class="tag-chip day-plan-tag-chip" data-id="${me(n)}" data-name="${me(e)}" data-status="${me(t)}">
            <span class="day-plan-tag-main">@${me(e)} <span class="day-plan-tag-pending">(${me(t)})</span></span>
            <i class="fa-solid fa-times day-plan-remove-collab-btn" onclick="window.app_removeTagHint(this)"></i>
        </div>
    `;window.app_refreshPlanBlockSummary=n=>{if(!n)return;const e=n.querySelector(".plan-task"),t=n.querySelector(".day-plan-task-summary"),a=n.querySelector(".plan-scope"),s=n.querySelector(".day-plan-scope-pill"),i=Dn(e?e.value:"");t&&(t.textContent=i),s&&a&&(s.textContent=a.value==="annual"?"Annual Plan":"Personal Plan")};window.app_togglePlanBlockCollapse=n=>{const e=n.closest(".plan-block");if(!e)return;e.classList.toggle("is-collapsed");const t=e.classList.contains("is-collapsed"),a=n.querySelector("i");a&&(a.classList.toggle("fa-chevron-down",!t),a.classList.toggle("fa-chevron-up",t));const s=n.querySelector(".day-plan-collapse-label");s&&(s.textContent=t?"Expand":"Minimize"),window.app_refreshPlanBlockSummary(e)};window.app_toggleTaskCollaborator=(n,e,t)=>{const a=n.closest(".plan-block");if(!a)return;const s=a.querySelector(".tags-container");if(!s)return;const i=typeof CSS<"u"&&CSS.escape?CSS.escape(e):e.replace(/"/g,'\\"'),d=s.querySelector(`[data-id="${i}"]`);if(d)d.remove(),n.classList.remove("selected");else{const r=s.querySelector(".no-tags-placeholder");r&&r.remove(),s.insertAdjacentHTML("beforeend",da(e,t,"pending")),n.classList.add("selected")}s.querySelectorAll(".tag-chip").length===0&&(s.innerHTML=ut())};window.app_getAnnualDayStaffPlans=n=>{const e=window._currentPlans||{},t=window._annualUserMap||{},s=(e.workPlans||[]).filter(r=>r.date<=n).map(r=>{const o=t[r.userId]||r.userName||"Staff",l=new Map,c=g=>String(g||"").toLowerCase().replace(/\d{1,2}\s*-\s*\d{1,2}\s+[a-z]+\s+\d{4}/g," ").replace(/\([^)]*\)/g," ").replace(/[^a-z\s]/g," ").split(/\s+/).filter(Boolean).slice(0,8).join(" "),u=(g,h="")=>{const f=String(g).trim();if(!f)return;const w=c(f)||f.toLowerCase().replace(/\s+/g," "),v=`${f}${h||""}`;if(!l.has(w)){l.set(w,v);return}(l.get(w)||"")===f&&v!==f&&l.set(w,v)},m=(Array.isArray(r.plans)?r.plans:[]).filter(g=>oa(g,r.date,n,e)).map(g=>{const{startDate:h,endDate:f}=ia(g,r.date,e),w=!!(h&&f&&h!==f),v=f===n,b=h===n,y=g.completedDate&&g.completedDate<f&&g.completedDate===n?" (Completed Early)":w&&v?" (Ends Today)":w&&b?" (Starts Today)":"";return u(g.task||"Planned task",y),""}).filter(Boolean),p=Array.from(l.values());return!p.length&&m.length?{name:o,tasks:m}:p.length?{name:o,tasks:p}:null}).filter(Boolean),i=r=>String(r||"").toLowerCase().replace(/\d{1,2}\s*-\s*\d{1,2}\s+[a-z]+\s+\d{4}/g," ").replace(/\([^)]*\)/g," ").replace(/[^a-z\s]/g," ").split(/\s+/).filter(Boolean).slice(0,8).join(" "),d=new Map;return s.forEach(r=>{const o=r.name||"Staff";d.has(o)||d.set(o,new Map);const l=d.get(o);(r.tasks||[]).forEach(c=>{const u=i(c)||String(c||"").toLowerCase();if(!l.has(u))l.set(u,c);else{const m=l.get(u)||"",p=String(c||"");m.length<p.length&&l.set(u,p)}})}),Array.from(d.entries()).map(([r,o])=>({name:r,tasks:Array.from(o.values())}))};window.app_showAnnualHoverPreview=(n,e)=>{const t="annual-hover-preview";document.getElementById(t)?.remove();const a=window.app_getAnnualDayStaffPlans(e),s=a.length?a.map(d=>`
                <div style="margin-bottom:0.45rem;">
                    <div style="font-size:0.76rem; font-weight:700; color:#334155;">${d.name}</div>
                    <div style="font-size:0.72rem; color:#64748b;">${d.tasks.slice(0,2).join(" | ")}${d.tasks.length>2?` (+${d.tasks.length-2} more)`:""}</div>
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
            </div>`;window.app_showModal(s,e)};window.app_addPlanBlockUI=async()=>{const n=document.getElementById("plans-container");if(!n)return;const e=await window.AppDB.getAll("users"),t=window.AppAuth.getUser(),a=t.role==="Administrator"||t.isAdmin,s=pt(window.app_currentDayPlanTargetId,t.id),i=n.dataset.defaultScope==="annual"?"annual":"personal",r=e.filter(g=>g.id!==s).map(g=>`
            <button
                type="button"
                class="day-plan-collab-option"
                data-id="${me(g.id)}"
                onclick="window.app_toggleTaskCollaborator(this, '${xt(g.id)}', '${xt(g.name)}')"
                title="Add or remove ${me(g.name)}"
            >${me(g.name)}</button>
        `).join(""),o=document.createElement("div");o.className="plan-block day-plan-block-shell",o.innerHTML=`
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
                            ${ut()}
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
                            ${e.map(g=>`<option value="${g.id}" ${g.id===t.id?"selected":""}>${g.name}</option>`).join("")}
                        </select>
                    </div>
                `:""}
            </div>
        `,n.appendChild(o);const l=o.querySelector(".plan-start-date"),c=o.querySelector(".plan-end-date"),u=document.querySelector("#day-plan-modal .day-plan-head p")?.textContent?.match(/\d{4}-\d{2}-\d{2}/),m=u?u[0]:"";l&&(l.value=m),c&&(c.value=m);const p=o.querySelector(".plan-task");window.app_refreshPlanBlockSummary(o),p&&p.focus()};window.app_addSubPlanRow=n=>{const e=n.closest(".plan-block")?.querySelector(".sub-plans-list");if(!e)return;const t=document.createElement("div");t.className="sub-plan-row day-plan-sub-row",t.innerHTML=`
            <div class="day-plan-step-dot"></div>
            <input type="text" class="sub-plan-input day-plan-sub-input" placeholder="Add a step...">
            <button type="button" onclick="this.parentElement.remove()" title="Remove step" class="day-plan-remove-step-btn"><i class="fa-solid fa-circle-xmark"></i></button>
        `,e.appendChild(t);const a=t.querySelector("input");a&&a.focus()};window.app_checkMentions=(n,e)=>{const t=n.value,a=n.selectionStart,s=t.lastIndexOf("@",a-1),i=document.getElementById("mention-dropdown");if(i)if(s!==-1&&!t.substring(s,a).includes(" ")){const d=t.substring(s+1,a).toLowerCase(),r=e.filter(o=>o.name.toLowerCase().includes(d));if(n.id||(n.id="ta-"+Date.now()),r.length>0){const o=n.getBoundingClientRect();i.innerHTML=r.map(l=>`
                    <div onclick="window.app_applyMention('${n.id}', '${l.id}', '${l.name.replace(/'/g,"\\'")}', ${s})" class="mention-item day-plan-mention-item">
                        <img src="${l.avatar}" class="day-plan-mention-avatar" />
                        <span>${l.name}</span>
                    </div>
                `).join(""),i.style.top=`${o.bottom+6}px`,i.style.left=`${o.left}px`,i.style.display="block"}else i.style.display="none"}else i.style.display="none"};window.app_applyMention=(n,e,t,a)=>{const s=document.getElementById(n);if(!s)return;const i=s.selectionStart,d=s.value.substring(0,a),r=s.value.substring(i);s.value=`${d}${t} ${r}`,s.focus();const o=s.closest(".plan-block"),l=o?.querySelector(".tags-container");if(!l)return;const c=document.getElementById("mention-dropdown");if(c&&(c.style.display="none"),l.querySelector(`[data-id="${e}"]`))return;const m=l.querySelector(".no-tags-placeholder");m&&m.remove(),l.insertAdjacentHTML("beforeend",da(e,t,"pending"));const p=typeof CSS<"u"&&CSS.escape?CSS.escape(e):e.replace(/"/g,'\\"'),g=o?.querySelector(`.day-plan-collab-option[data-id="${p}"]`);g&&g.classList.add("selected")};window.app_removeTagHint=n=>{const e=n.closest(".tags-container"),t=n.closest(".tag-chip"),a=t?t.dataset.id:"",s=n.closest(".plan-block");if(n.parentElement.remove(),s&&a){const i=typeof CSS<"u"&&CSS.escape?CSS.escape(a):a.replace(/"/g,'\\"'),d=s.querySelector(`.day-plan-collab-option[data-id="${i}"]`);d&&d.classList.remove("selected")}e&&e.querySelectorAll(".tag-chip").length===0&&(e.innerHTML=ut())};window.app_showStatusTooltip=()=>{};window.app_hideCheckoutIntro=()=>{const n=document.getElementById("checkout-intro-panel");n&&(n.style.display="none",localStorage.setItem("checkoutIntroSeen","true"))};window.app_updateCharCounter=n=>{const e=document.getElementById("char-counter");if(e){const t=n.value.length;e.textContent=`${t} / 500 recommended`,t>500?e.style.color="#f59e0b":t>300?e.style.color="#10b981":e.style.color="#94a3b8"}};window.app_selectLocationReason=n=>{const e=document.getElementById("location-explanation");e&&(document.querySelectorAll(".location-reason-btn").forEach(t=>{t.style.background="#e0f2fe",t.style.borderColor="#7dd3fc"}),event.target.style.background="#0ea5e9",event.target.style.borderColor="#0ea5e9",event.target.style.color="white",e.value=n,e.focus())};window.app_selectOvertimeReason=(n,e,t="overtime_work")=>{const a=document.getElementById("checkout-overtime-explanation"),s=document.getElementById("checkout-overtime-mode");document.querySelectorAll(".overtime-reason-btn").forEach(i=>{i.style.background="#fef3c7",i.style.borderColor="#fcd34d",i.style.color="#92400e"}),n&&(n.style.background="#f59e0b",n.style.borderColor="#f59e0b",n.style.color="white"),s&&(s.value=t),a&&(a.value=e,a.focus())};window.app_useWorkPlan=()=>{const n=document.getElementById("checkout-plan-text"),e=document.getElementById("checkout-work-summary"),t=n?.dataset?.rawText;t&&e&&(e.value=t,window.app_updateCharCounter&&window.app_updateCharCounter(e),e.focus(),e.style.borderColor="#8b5cf6",e.style.background="#f5f3ff",setTimeout(()=>{e.style.borderColor="#e2e8f0",e.style.background="#ffffff"},1e3))};window.app_deleteDayPlan=async(n,e=null,t=null)=>{if(!await window.appConfirm("Are you sure you want to delete this work plan?"))return;const a=window.AppAuth.getUser(),s=pt(e,a.id);try{t==="personal"||t==="annual"?await window.AppCalendar.deleteWorkPlan(n,s,{planScope:t}):await Promise.all([window.AppCalendar.deleteWorkPlan(n,s,{planScope:"personal"}),window.AppCalendar.deleteWorkPlan(n,s,{planScope:"annual"})]),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert("Plan deleted!"),document.getElementById("day-plan-modal")?.remove();const d=await O.renderDashboard(),r=document.getElementById("page-content");r&&(r.innerHTML=d,window.setupDashboardEvents&&window.setupDashboardEvents())}catch(i){alert(i.message)}};window.app_saveDayPlan=async(n,e,t=null)=>{n.preventDefault();const a=window.AppAuth.getUser(),s=pt(t,a.id),i=n.target,d=i?.dataset?.hadPersonal==="1",r=i?.dataset?.hadAnnual==="1",o=document.querySelectorAll(".plan-block"),l=[],c=[],u=[],m={};let p="";if(o.forEach(g=>{const h=g.querySelector(".plan-task").value.trim(),f=g.querySelectorAll(".sub-plan-input"),w=Array.from(f).map(A=>A.value.trim()).filter(A=>A!==""),v=g.querySelectorAll(".tag-chip"),b=Array.from(v).map(A=>({id:A.dataset.id,name:A.dataset.name,status:A.dataset.status||"pending"})),k=g.querySelector(".plan-status").value,y=g.querySelector(".plan-assignee"),S=y?y.value:s,_=g.querySelector(".plan-start-date"),T=g.querySelector(".plan-end-date"),L=_?String(_.value||"").trim():"",I=T?String(T.value||"").trim():"",U=g.querySelector(".plan-scope"),M=U&&U.value==="annual"?"annual":"personal";if(h){if(L&&!I||!L&&I){p="Please select both From Date and To Date for ranged tasks.";return}if(L&&I&&I<L){p="To Date cannot be earlier than From Date.";return}const E={task:h,subPlans:w,tags:b,status:k||null,assignedTo:S||null,startDate:L||e,endDate:I||e,planScope:M,completedDate:k==="completed"?new Date().toISOString().split("T")[0]:null};l.push(E),M==="annual"?u.push(E):c.push(E)}}),l.length===0){alert(p||"Please add at least one task.");return}if(p){alert(p);return}try{c.length>0?(await window.AppCalendar.setWorkPlan(e,c,s,{planScope:"personal"}),m.personal=window.AppCalendar.getWorkPlanId(e,s,"personal")):d&&await window.AppCalendar.deleteWorkPlan(e,s,{planScope:"personal"}),u.length>0?(await window.AppCalendar.setWorkPlan(e,u,s,{planScope:"annual"}),m.annual=window.AppCalendar.getWorkPlanId(e,s,"annual")):r&&await window.AppCalendar.deleteWorkPlan(e,s,{planScope:"annual"}),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans();const g=await window.AppDB.getAll("users");if(s!==a.id&&(a.role==="Administrator"||a.isAdmin)){const v=g.find(b=>b.id===s);if(v){v.notifications||(v.notifications=[]);const b=v.notifications[v.notifications.length-1];(!b||b.message!==`Admin ${a.name} has edited your Work Plan for ${e}`)&&(v.notifications.push({type:"admin_edit",message:`Admin ${a.name} has edited your Work Plan for ${e}`,date:new Date().toLocaleString(),read:!1}),await window.AppDB.put("users",v))}}const h=new Set;if(l.forEach(v=>{v.tags&&v.tags.forEach(b=>h.add(b.id))}),h.size>0){for(const v of h){const b=g.find(k=>k.id===v);b&&v!==a.id&&(b.notifications||(b.notifications=[]),l.forEach((k,y)=>{if(k.tags&&k.tags.some(S=>S.id===v)){const S=k.planScope==="annual"?"annual":"personal",_=m[S]||window.AppCalendar.getWorkPlanId(e,s,S);b.notifications.some(L=>L.type==="mention"&&L.planId===_&&L.taskIndex===y)||b.notifications.push({id:`tag_${Date.now()}_${v}_${y}`,type:"tag",title:k.task||"Tagged task",description:k.subPlans&&k.subPlans.length>0?k.subPlans.join(", "):"",taggedById:a.id,taggedByName:a.name,taggedAt:new Date().toISOString(),status:"pending",source:"plan",planId:_,taskIndex:y,message:`${a.name} tagged you in: "${k.task}" for ${e}`,date:new Date().toLocaleString(),read:!1})}}),await window.AppDB.put("users",b))}for(let v=0;v<l.length;v++){const b=l[v];if(b.tags)for(const k of b.tags){if(k.id===s)continue;const y=g.find(I=>I.id===k.id);if(!y||!window.AppCalendar)continue;const S=b.planScope==="annual"?"annual":"personal",_=m[S]||window.AppCalendar.getWorkPlanId(e,s,S),T=b.subPlans&&b.subPlans.length>0?` - ${b.subPlans.join(", ")}`:"",L=`${b.task}${T} (Responsible: ${y.name})`;await window.AppCalendar.addWorkPlanTask(e,y.id,L,[{id:a.id,name:a.name,status:"pending"}],{addedFrom:"tag",sourcePlanId:_,sourceTaskIndex:v,taggedById:a.id,taggedByName:a.name,status:"pending",subPlans:b.subPlans||[],startDate:b.startDate||e,endDate:b.endDate||b.startDate||e})}}}alert("Plans saved successfully!"),document.getElementById("day-plan-modal")?.remove();const f=await O.renderDashboard(),w=document.getElementById("page-content");w&&(w.innerHTML=f,window.setupDashboardEvents&&window.setupDashboardEvents())}catch(g){alert(g.message)}};window.app_handleTagResponse=async(n,e,t,a)=>{const s=window.AppAuth.getUser();try{const i=n?await window.AppDB.get("work_plans",n).catch(()=>null):null;if(!i||!i.plans||!i.plans[e]){console.warn(`app_handleTagResponse: plan/task not found for planId=${n}, taskIdx=${e}. Falling back to notification-only update.`);const c=await window.AppDB.get("users",s.id).catch(()=>null),u=c?.notifications?.[a]?.id||null;if(u||a>=0)await window.app_handleTagDecision(u||String(a),t);else{if(c?.notifications?.[a]){const p=new Date().toISOString();c.notifications[a].status=t,c.notifications[a].respondedAt=p,c.notifications[a].read=!0,c.notifications[a].dismissedAt=p,await window.AppDB.put("users",c)}const m=document.getElementById("page-content");m&&(m.innerHTML=await O.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),alert(`You have ${t} the request.`)}return}const d=i.plans[e];if(d.tags){const c=d.tags.find(u=>u.id===s.id);c&&(c.status=t)}await window.AppDB.put("work_plans",i);const r=await window.AppDB.get("users",s.id);let o="";if(t==="rejected"&&(o=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Task",confirmText:"Submit Reason"})||""),r&&r.notifications){const c=r.notifications[a];if(c){const u=new Date().toISOString();c.status=t,c.respondedAt=u,c.read=!0,c.dismissedAt=u,o&&(c.rejectReason=o)}r.tagHistory||(r.tagHistory=[]),r.tagHistory.unshift({id:`taghist_${Date.now()}`,type:"tag_response",title:c?.title||i.plans[e].task||"Tagged task",taggedByName:c?.taggedByName||i.userName||"Staff",status:t,reason:o,date:new Date().toISOString()}),await window.AppDB.put("users",r)}if(i.userId){const c=await window.AppDB.get("users",i.userId);c&&(c.notifications||(c.notifications=[]),c.notifications.unshift({id:`tagresp_${Date.now()}`,type:"tag_response",message:`${s.name} ${t} your tag request.`,title:i.plans[e].task,taggedByName:s.name,status:t,reason:o,date:new Date().toISOString(),read:!1}),await window.AppDB.put("users",c))}window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans();const l=document.getElementById("page-content");l&&(l.innerHTML=await O.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),alert(`You have ${t} the collaboration request.`)}catch(i){console.error("app_handleTagResponse error:",i),alert("Error processing your response. Please try again.")}};window.app_changeCalMonth=n=>{let e=window.app_calMonth+n;e<0&&(window.app_calYear--,e=11),e>11&&(window.app_calYear++,e=0),window.app_calMonth=e,O.renderDashboard().then(async t=>{const a=document.getElementById("page-content");a.innerHTML=t,de()})};window.app_exportCalendar=async()=>{const n=window._currentPlans,e=window.app_calMonth,t=window.app_calYear;if(!n){alert("Calendar data not loaded yet.");return}try{await window.AppReports.exportCalendarPlansCSV(n,e,t)}catch(a){alert("Export failed: "+a.message)}};window.app_newMeeting=async()=>{const n=window.AppAuth.getUser(),e={id:"meeting_"+Date.now(),title:"",date:new Date().toISOString().split("T")[0],minutes:"",author:n.name,timestamp:new Date().toISOString()};await window.AppDB.put("meetings",e),window._selectedMeetingId=e.id;const t=document.getElementById("page-content");t.innerHTML=await O.renderMinutes()};window.app_selectMeeting=async n=>{window._selectedMeetingId=n;const e=document.getElementById("page-content");e.innerHTML=await O.renderMinutes()};window.app_saveMeeting=async()=>{const n=document.getElementById("meeting-title")?.value,e=document.getElementById("meeting-date")?.value,t=document.getElementById("meeting-minutes")?.value;if(!window._selectedMeetingId){alert("No meeting selected");return}const a=await window.AppDB.get("meetings",window._selectedMeetingId);if(!a){alert("Meeting not found");return}a.title=n,a.date=e,a.minutes=t,a.timestamp=new Date().toISOString(),await window.AppDB.put("meetings",a);const s=document.getElementById("page-content");s.innerHTML=await O.renderMinutes(),alert("Meeting minutes saved successfully!")};window.app_deleteMeeting=async n=>{if(!await window.appConfirm("Are you sure you want to delete this meeting?"))return;await window.AppDB.delete("meetings",n),window._selectedMeetingId=null;const e=document.getElementById("page-content");e.innerHTML=await O.renderMinutes()};window.app_postponeTask=async(n,e,t)=>{if(t)try{const a=window.AppAuth.getUser();await window.AppCalendar.updateTaskStatus(n,e,"postponed");const s=await window.AppDB.get("work_plans",n),i=s?.plans?.[e],d=i&&i.subPlans&&i.subPlans.length?` - ${i.subPlans.join(", ")}`:"",r=i?`${i.task}${d}`:"",o=s?.date||new Date().toISOString().split("T")[0],c=`${r.replace(/\s*\(Postponed from [^)]+\)\s*$/i,"")} (Postponed from ${o})`;await window.AppCalendar.addWorkPlanTask(t,a.id,c,[],{addedFrom:"postponed",sourcePlanId:n,sourceTaskIndex:e,postponedFromDate:o}),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert(`Task postponed to ${t}`),typeof he=="function"&&await he()}catch(a){alert("Failed to postpone task: "+a.message)}};window.app_openPostponeModal=function(n,e){const t="postpone-task-modal";document.getElementById(t)?.remove();const a=new Date(Date.now()+864e5).toISOString().split("T")[0],s=`
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
            </div>`;window.app_showModal(s,t)};window.app_confirmPostponeTask=async function(n,e){const t=document.getElementById("postpone-date-input")?.value;if(!t)return alert("Please select a date.");document.getElementById("postpone-task-modal")?.remove(),await window.app_postponeTask(n,e,t)};window.app_openDelegateModal=async function(n,e){const t="delegate-task-modal";document.getElementById(t)?.remove();const a=await window.AppDB.getAll("users").catch(()=>[]),s=window.AppAuth.getUser(),i=(a||[]).filter(o=>o.id!==s.id);window.app_delegateModalContext={planId:n,taskIndex:e,selectedUserId:""};const d=i.map(o=>`
            <button type="button" class="delegate-picker-item" data-user-id="${o.id}" data-name="${(o.name||"").toLowerCase()}" onclick="window.app_selectDelegateUser('${o.id}')">
                <img src="${o.avatar||""}" alt="${o.name}" class="delegate-user-avatar">
                <span>${o.name}</span>
            </button>
        `).join(""),r=`
            <div class="modal-overlay" id="${t}" style="display:flex;">
                <div class="modal-content" style="max-width:480px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                        <h3 style="margin:0; font-size:1.05rem;">Delegate Task</h3>
                        <button type="button" onclick="document.getElementById('${t}')?.remove()" style="background:none; border:none; font-size:1.1rem; cursor:pointer;">&times;</button>
                    </div>
                    <input id="delegate-search-input" type="text" placeholder="Search staff..." oninput="window.app_filterDelegateUsers(this.value)" style="width:100%; padding:0.6rem; border:1px solid #d1d5db; border-radius:8px; margin-bottom:0.7rem;">
                    <div id="delegate-picker-list" class="delegate-picker-list">${d||'<div style="font-size:0.85rem; color:#64748b;">No staff available.</div>'}</div>
                    <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
                        <button type="button" class="action-btn secondary" onclick="document.getElementById('${t}')?.remove()" style="padding:0.55rem 0.9rem;">Cancel</button>
                        <button type="button" id="delegate-confirm-btn" class="action-btn" onclick="window.app_confirmDelegateTask()" style="padding:0.55rem 0.9rem;" disabled>Delegate</button>
                    </div>
                </div>
            </div>`;window.app_showModal(r,t)};window.app_filterDelegateUsers=function(n){const e=String(n||"").toLowerCase().trim();Array.from(document.querySelectorAll("#delegate-picker-list .delegate-picker-item")).forEach(t=>{const a=t.getAttribute("data-name")||"";t.style.display=!e||a.includes(e)?"flex":"none"})};window.app_selectDelegateUser=function(n){if(!window.app_delegateModalContext)return;window.app_delegateModalContext.selectedUserId=n,Array.from(document.querySelectorAll("#delegate-picker-list .delegate-picker-item")).forEach(t=>{t.classList.toggle("selected",t.getAttribute("data-user-id")===n)});const e=document.getElementById("delegate-confirm-btn");e&&(e.disabled=!n)};window.app_confirmDelegateTask=async function(){const n=window.app_delegateModalContext;if(!n||!n.selectedUserId)return alert("Please select a staff member.");document.getElementById("delegate-task-modal")?.remove(),await window.app_delegateTo(n.planId,n.taskIndex,n.selectedUserId)};window.app_formatTaskWithPostponeChip=function(n){const e=String(n||""),t=e.match(/^(.*)\s+\(Postponed from ([^)]+)\)\s*$/i);if(!t)return e;const a=t[1].trim(),s=t[2].trim();return`${a} <span class="postponed-source-chip">Postponed from ${s}</span>`};window.app_appendCompletedTaskToSummary=async function(n,e){const a=(await window.AppDB.get("work_plans",n))?.plans?.[e];if(!a)return;const s=a.subPlans&&a.subPlans.length?` (${a.subPlans.join(", ")})`:"",i=`- ${a.task}${s}`,d=document.getElementById("checkout-work-summary"),r=(d?.value||window.app_checkoutSummaryDraft||"").trim(),l=r.split(`
`).some(c=>c.trim()===i.trim())?r:r?`${r}
${i}`:i;window.app_checkoutSummaryDraft=l,d&&(d.value=l,window.app_updateCharCounter&&window.app_updateCharCounter(d))};window.app_handleChecklistAction=async function(n,e,t){const a=document.getElementById("checkout-task-checklist"),s=document.getElementById("delegate-panel");window.app_checkoutTaskActions=window.app_checkoutTaskActions||{};const i=`${n}:${e}`;if(!t){delete window.app_checkoutTaskActions[i],s&&(s.style.display="none"),a&&a.classList.remove("delegate-open");return}if(window.app_checkoutTaskActions[i]=t,t==="complete"){s&&(s.style.display="none"),a&&a.classList.remove("delegate-open"),await window.app_appendCompletedTaskToSummary(n,e),await window.app_markTaskCompleted(n,e);return}if(t==="postpone"){s&&(s.style.display="none"),a&&a.classList.remove("delegate-open"),await window.app_openPostponeModal(n,e);return}t==="delegate"&&(s&&(s.style.display="none"),a&&a.classList.remove("delegate-open"),await window.app_openDelegateModal(n,e))};window.app_markTaskCompleted=async function(n,e){try{const t=new Date().toISOString().split("T")[0];await window.AppCalendar.updateTaskStatus(n,e,"completed",t),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert("Task marked as completed."),typeof he=="function"&&await he()}catch(t){alert("Failed to mark completed: "+t.message)}};window.app_delegateTask=async function(n,e){try{const t=await window.AppDB.getAll("users"),a=t.map(d=>d.name).join(", "),s=await window.appPrompt(`Delegate to which staff? Enter name.
Available: ${a}`,"",{title:"Delegate Task",placeholder:"Type staff name"});if(!s)return;const i=t.find(d=>d.name.toLowerCase()===s.toLowerCase());if(!i){alert("Staff not found.");return}await window.app_delegateTo(n,e,i.id)}catch(t){alert("Failed to delegate task: "+t.message)}};window.app_delegateTo=async function(n,e,t){try{const a=await window.AppDB.get("work_plans",n);if(!a||!a.plans||!a.plans[e]){alert("Task not found.");return}const s=window.AppAuth.getUser(),i=a.plans[e],d=i.subPlans&&i.subPlans.length?` — ${i.subPlans.join(", ")}`:"",r=`${i.task}${d}`;i.tags||(i.tags=[]);const l=(await window.AppDB.getAll("users")).find(u=>u.id===t);if(!l){alert("Staff not found.");return}i.tags.some(u=>u.id===l.id)||i.tags.push({id:l.id,name:l.name,status:"pending"}),i.status=i.status||"pending",a.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",a),await window.AppCalendar.addWorkPlanTask(a.date,l.id,r,[{id:s.id,name:s.name,status:"pending"}],{addedFrom:"delegated",sourcePlanId:n,sourceTaskIndex:e,taggedById:s.id,taggedByName:s.name,status:"pending",subPlans:i.subPlans||[]});const c=await window.AppDB.get("users",l.id);c&&(c.notifications||(c.notifications=[]),c.notifications.unshift({id:`task_${Date.now()}`,type:"task",title:i.task||"Delegated task",description:i.subPlans&&i.subPlans.length>0?i.subPlans.join(", "):"",taggedById:s.id,taggedByName:s.name,taggedAt:new Date().toISOString(),status:"pending",source:"delegation",date:new Date().toLocaleString(),read:!1}),await window.AppDB.put("users",c)),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert(`Task delegated to ${l.name}.`),typeof he=="function"&&await he()}catch(a){alert("Failed to delegate task: "+a.message)}};function la(n,e,t,a){if(!n||!e||!t||!a)return 0;const s=6371e3,i=n*Math.PI/180,d=t*Math.PI/180,r=(t-n)*Math.PI/180,o=(a-e)*Math.PI/180,l=Math.sin(r/2)*Math.sin(r/2)+Math.cos(i)*Math.cos(d)*Math.sin(o/2)*Math.sin(o/2),c=2*Math.atan2(Math.sqrt(l),Math.sqrt(1-l));return s*c}const ca=480*60*1e3,xn=540*60*1e3,$t=(n,e)=>{if(!n||!e)return null;const t=String(n).trim(),a=String(e).trim();if(!t||!a||a.toLowerCase().includes("active now"))return null;const s=new Date(`${t}T${a}`);if(!Number.isNaN(s.getTime()))return s;const i=new Date(`${t} ${a}`);return Number.isNaN(i.getTime())?null:i},$n=async(n,e,t)=>{if(!n||!window.AppDB||t<=e)return!1;const a=await window.AppDB.getAll("attendance"),s=String(n);return(a||[]).some(i=>{if(!i||String(i.user_id||"")!==s||!i.isManualOverride)return!1;const d=$t(i.date,i.checkIn),r=$t(i.date,i.checkOut);if(!d||!r)return!1;let o=d.getTime(),l=r.getTime();l<=o&&(l+=1440*60*1e3);const c=Math.max(e,o);return Math.min(t,l)>c})},_n=async n=>{const e={showPrompt:!1,hasManualLog:!1,overtimeStartMs:null,overtimeEndMs:null};if(!n||!n.lastCheckIn)return e;const t=Number(n.lastCheckIn);if(!Number.isFinite(t))return e;const a=Date.now();if(a-t<=xn)return e;const i=t+ca;return await $n(n.id,i,a)?{showPrompt:!1,hasManualLog:!0,overtimeStartMs:i,overtimeEndMs:a}:{showPrompt:!0,hasManualLog:!1,overtimeStartMs:i,overtimeEndMs:a}};window.app_prepareCheckoutOvertimeSection=async n=>{const e=document.getElementById("checkout-overtime-section"),t=document.getElementById("checkout-overtime-explanation"),a=document.getElementById("checkout-overtime-mode"),s=document.getElementById("checkout-overtime-hint");if(window.app_checkoutOvertimeState={showPrompt:!1,hasManualLog:!1},!(!e||!t||!a)){e.style.display="none",t.required=!1,t.value="",a.value="overtime_work",document.querySelectorAll(".overtime-reason-btn").forEach(i=>{i.style.background="#fef3c7",i.style.borderColor="#fcd34d",i.style.color="#92400e"});try{const i=await _n(n);if(window.app_checkoutOvertimeState=i,!i.showPrompt)return;s&&(s.textContent="You worked over 1 hour extra. Please capture what was done during overtime."),e.style.display="block",t.required=!0}catch(i){console.warn("Overtime prompt check failed:",i)}}};async function he(){const n=document.getElementById("attendance-btn"),e=document.getElementById("location-text"),{status:t}=await window.AppAttendance.getStatus();n&&(n.disabled=!0),Ne=!0;try{if(t==="out"){n&&(n.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Locating...');const a=await window.getLocation(),s=`Lat: ${a.lat.toFixed(4)}, Lng: ${a.lng.toFixed(4)}`;e&&(e.innerHTML=`<i class="fa-solid fa-location-dot"></i> ${s}`);const i=await window.AppAttendance.checkIn(a.lat,a.lng,s);if(i&&i.conflict){window.app_showSyncToast(i.message||"Status updated from another device."),window.app_refreshDashboard&&await window.app_refreshDashboard();return}it(),window.app_refreshDashboard&&await window.app_refreshDashboard(),i&&i.resolvedMissedCheckout&&i.noticeMessage&&window.app_showAttendanceNotice(i.noticeMessage),window.AppDayPlan&&typeof window.AppDayPlan.openDayPlan=="function"&&await window.AppDayPlan.openDayPlan(St())}else{const a=window.AppAuth.getUser(),s=St(),i=await window.AppCalendar.getWorkPlan(a.id,s,{includeAnnual:!0,mergeAnnual:!0}),d=await window.AppCalendar.getCollaborations(a.id,s);window.app_checkoutSummaryDate!==s&&(window.app_checkoutSummaryDate=s,window.app_checkoutSummaryDraft=""),window.app_checkoutActionDate!==s&&(window.app_checkoutActionDate=s,window.app_checkoutTaskActions={});const r=document.getElementById("modal-container");r&&!document.getElementById("checkout-modal")&&r.insertAdjacentHTML("beforeend",O.renderModals());const o=document.getElementById("checkout-modal");if(o){const l=document.getElementById("checkout-plan-text"),c=o.querySelector('textarea[name="description"]');if(i&&(i.plans||i.plan)){let p="",g="";if(i.plans&&i.plans.length>0?(p=i.plans.map((k,y)=>`<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; padding-bottom:12px; border-bottom:1px dashed #e9d5ff;">
                                    <div style="flex:1;">
                                        <div style="font-weight:600; color:#4c1d95;">${window.app_formatTaskWithPostponeChip(k.task)}</div>
                                        ${k.subPlans&&k.subPlans.length>0?`<div style="font-size:0.75rem; color:#7c3aed; margin-top:2px;">👣 ${k.subPlans.join(", ")}</div>`:""}
                                    </div>
                                    <div style="display:flex; gap:6px; flex-shrink:0;">
                                        ${k.status==="completed"?'<span style="font-size:0.75rem; color:#059669; font-weight:700;">✅ Done</span>':`<button type="button" onclick="window.app_postponeTask('${k._planId||i.id}', ${typeof k._taskIndex=="number"?k._taskIndex:y})" style="background:#f3e8ff; color:#7c3aed; border:1px solid #ddd6fe; border-radius:8px; padding:6px 12px; font-size:0.8rem; font-weight:600; cursor:pointer;" onmouseover="this.style.background='#ddd6fe'" onmouseout="this.style.background='#f3e8ff'">⌛ Postpone</button>`}
                                    </div>
                                </div>`).join(""),g=i.plans.filter(k=>window.AppCalendar.getSmartTaskStatus(i.date,k.status)==="completed").map(k=>{let y=`• ${k.task}`;return k.subPlans&&k.subPlans.length>0&&(y+=` (${k.subPlans.join(", ")})`),y}).join(`
`)):i.plan&&(p=`<div style="font-weight:600; color:#4c1d95;">${i.plan}</div>`,g=`• ${i.plan}`,i.subPlans&&i.subPlans.length>0&&(p+=`<div style="font-size:0.75rem; color:#7c3aed; margin-top:2px;">👣 ${i.subPlans.join(", ")}</div>`,g+=` (${i.subPlans.join(", ")})`)),d&&d.length>0){const b=d.map(k=>k.plans.filter(y=>y.tags&&y.tags.some(S=>S.id===a.id&&S.status==="accepted")).map(y=>{let S=`🤝 [Collaborated with ${k.userName}] ${y.task}`;return y.subPlans&&y.subPlans.length>0&&(S+=`
👣 Steps: `+y.subPlans.join(", ")),S}).join(`
`)).join(`

`);p?p+=`

`+b:p=b}l&&(l.innerHTML=p),l&&(l.dataset.rawText=g),c&&!c.value.trim()&&window.app_checkoutSummaryDraft&&(c.value=window.app_checkoutSummaryDraft,window.app_updateCharCounter&&window.app_updateCharCounter(c));const h=document.getElementById("checkout-task-list"),f=document.getElementById("delegate-panel"),w=document.getElementById("delegate-list"),v=document.getElementById("delegate-selected-task");if(h)if(i&&Array.isArray(i.plans)&&i.plans.length>0){const b=await window.AppDB.getAll("users").catch(()=>[]),k=i.plans.map((y,S)=>{const _=y.subPlans&&y.subPlans.length?` — ${y.subPlans.join(", ")}`:"",T=`${y.task}${_}`,L=y._planId||i.id,I=typeof y._taskIndex=="number"?y._taskIndex:S,U=window.AppCalendar.getSmartTaskStatus(y._planDate||i.date,y.status),M=`${L}:${I}`,N=(window.app_checkoutTaskActions&&window.app_checkoutTaskActions[M]?window.app_checkoutTaskActions[M]:"")||(y.status==="completed"||U==="completed"?"complete":y.status==="postponed"?"postpone":""),E=U==="completed"?"Completed":U==="in-process"?"In Process":U==="overdue"?"Overdue":U==="to-be-started"?"To Be Started":y.status||"Pending";return`
                                        <div class="checkout-task-row">
                                            <div class="checkout-task-copy">
                                                <div class="checkout-task-title">${window.app_formatTaskWithPostponeChip(T)}</div>
                                                <div class="checkout-task-status">Status: ${E}</div>
                                            </div>
                                            <select onchange="window.app_handleChecklistAction('${L}', ${I}, this.value)" class="checkout-task-action-select">
                                                <option value="" ${N?"":"selected"}>Choose Action</option>
                                                <option value="complete" ${N==="complete"?"selected":""}>Complete</option>
                                                <option value="postpone" ${N==="postpone"?"selected":""}>Postpone</option>
                                                <option value="delegate" ${N==="delegate"?"selected":""}>Delegate</option>
                                            </select>
                                        </div>`}).join("");if(h.innerHTML=k,f&&w&&v){f.style.display="none";const y=document.getElementById("checkout-task-checklist");y&&y.classList.remove("delegate-open");const S=window.AppAuth.getUser(),_=(b||[]).filter(T=>T.id!==S.id);w.innerHTML=_.map(T=>`
                                        <button type="button" data-user-id="${T.id}" class="delegate-user-btn">
                                            <img src="${T.avatar}" alt="${T.name}" class="delegate-user-avatar">
                                            <span style="flex:1;">${T.name}</span>
                                        </button>
                                    `).join("")}}else h.innerHTML='<div style="font-size:0.8rem; color:#6b7280;">No tasks planned for today.</div>'}await window.app_prepareCheckoutOvertimeSection(a),o.style.display="flex",n&&(n.disabled=!1);const u=document.getElementById("checkout-location-mismatch"),m=document.getElementById("checkout-location-loading");m&&(m.style.display="block"),u&&(u.style.display="none"),(async()=>{try{const p=await window.getLocation(),g=a.currentLocation||a.lastLocation;m&&(m.style.display="none"),g&&g.lat&&g.lng&&(la(p.lat,p.lng,g.lat,g.lng)>500?u&&(u.style.display="block"):u&&(u.style.display="none"))}catch(p){console.warn("Background location check failed:",p),m&&(m.style.display="none")}})()}else{const l=await window.AppAttendance.checkOut();l&&!l.conflict&&it(),l&&l.conflict&&window.app_showSyncToast(l.message||"Status updated from another device.");const c=document.getElementById("page-content");c.innerHTML=await O.renderDashboard(),de()}}}catch(a){alert(a.message||a),n&&(n.disabled=!1,n.innerHTML=t==="out"?'Check-in <i class="fa-solid fa-fingerprint"></i>':'Check-out <i class="fa-solid fa-fingerprint"></i>')}finally{Ne=!1}}window.app_submitCheckOut=async function(n){n.preventDefault();const e=n.target,t=e.description.value,a=e.querySelector('button[type="submit"]');Ne=!0;try{a.disabled=!0,a.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Locating & Saving...';let s=null,i=null;try{s=await window.getLocation()}catch(w){i=w}let d=!1;const r=window.AppAuth.getUser()?.currentLocation;s&&(s=we&&Date.now()-_e<Qt?we:s,r&&r.lat&&r.lng&&s.lat&&s.lng&&la(s.lat,s.lng,r.lat,r.lng)>500&&(d=!0));const o=e.locationExplanation?e.locationExplanation.value.trim():"",l=window.app_checkoutOvertimeState||{},c=e.overtimeExplanation?e.overtimeExplanation.value.trim():"",u=e.overtimeMode?String(e.overtimeMode.value||"overtime_work"):"overtime_work",m={};if(l.showPrompt){if(!c){alert("Please describe the overtime work before checkout."),a.disabled=!1,a.textContent="Complete Check-Out";return}if(m.overtimePrompted=!0,m.overtimeExplanation=c,m.overtimeReasonTag=u,u==="forgot_checkout"){const w=Number(window.AppAuth.getUser()?.lastCheckIn);Number.isFinite(w)&&(m.checkOutTime=new Date(w+ca).toISOString(),m.overtimeCappedToEightHours=!0)}}if(!s&&!o){const w=document.getElementById("checkout-location-mismatch");w&&(w.style.display="block"),alert("Location unavailable. Please provide a reason for checking out from a different location."),a.disabled=!1,a.textContent="Complete Check-Out";return}const p=s?`Lat: ${Number(s.lat).toFixed(4)}, Lng: ${Number(s.lng).toFixed(4)}`:"Location unavailable (reason provided)",g=e.tomorrowGoal?e.tomorrowGoal.value.trim():"";if(g){const w=new Date(Date.now()+864e5).toISOString().split("T")[0];await window.AppCalendar.addWorkPlanTask(w,window.AppAuth.getUser().id,g),console.log("Tomorrow's goal saved:",g)}const h=await window.AppAttendance.checkOut(t,s?s.lat:null,s?s.lng:null,p,d||!s,o||(i?String(i):""),m);if(h&&h.conflict){const w=document.getElementById("checkout-modal");w&&(w.style.display="none"),window.app_showSyncToast(h.message||"Status updated from another device.");const v=document.getElementById("page-content");v&&(v.innerHTML=await O.renderDashboard(),de());return}it(),window.app_checkoutSummaryDraft="",document.getElementById("checkout-modal").style.display="none";const f=document.getElementById("page-content");f&&(f.innerHTML=await O.renderDashboard(),de())}catch(s){alert("Check-out failed: "+s.message),a.disabled=!1,a.textContent="Complete Check-Out"}finally{Ne=!1}};async function Tn(n){n.preventDefault();const e=new FormData(n.target),t=mt(e.get("checkIn"),e.get("checkOut"));if(t==="Invalid"){alert("End time must be after Start time");return}const a=e.get("date"),s=e.get("checkIn"),i=e.get("checkOut"),d=window.AppAttendance.buildDateTime(a,s),r=window.AppAttendance.buildDateTime(a,i),o=d&&r?r-d:0,l=Math.max(0,o)/(1e3*60*60),c=l>=4;let u="Work Log",m=0;l>=8?(u="Present",m=1):l>=4&&(u="Half Day",m=.5);const p={date:e.get("date"),checkIn:s,checkOut:i,duration:t,durationMs:o,location:e.get("location"),workDescription:e.get("location"),type:u,dayCredit:m,lateCountable:!1,extraWorkedMs:0,policyVersion:"v2",entrySource:"staff_manual_work",attendanceEligible:c,isManualOverride:!1};await window.AppAttendance.addManualLog(p),alert("Log added successfully!"),document.getElementById("log-modal").style.display="none",Q.innerHTML=await O.renderTimesheet()}async function Ln(n){n.preventDefault();const e=new FormData(n.target),t=e.get("name").trim(),a=e.get("username").trim(),s=e.get("password").trim(),i=e.get("email").trim(),d=e.get("isAdmin")==="on"||e.get("isAdmin")==="true",r=e.get("canManageAttendanceSheet")==="on"||e.get("canManageAttendanceSheet")==="true",o={id:"u"+Date.now(),name:t,username:a,password:s,role:e.get("role"),dept:e.get("dept"),email:i,phone:e.get("phone"),joinDate:e.get("joinDate"),isAdmin:d,canManageAttendanceSheet:r,permissions:window.app_getPermissionsFromUI("add"),avatar:`https://ui-avatars.com/api/?name=${e.get("name")}&background=random&color=fff`,status:"out",lastCheckIn:null};try{o.isAdmin?(o.role="Administrator",o.canManageAttendanceSheet=!0):o.isAdmin=!1,await window.AppDB.add("users",o),alert("Success! Account created."),document.getElementById("add-user-modal").style.display="none";const l=document.getElementById("page-content");l&&(l.innerHTML=await O.renderAdmin())}catch(l){alert("Error creating user: "+l.message)}}window.app_getPermissionsFromUI=n=>{const e={};return["dashboard","leaves","users","attendance","reports","minutes","policies"].forEach(a=>{const s=document.getElementById(`${n}-perm-${a}-view`),i=document.getElementById(`${n}-perm-${a}-admin`);i&&i.checked?e[a]="admin":s&&s.checked?e[a]="view":e[a]=null}),e};window.app_submitEditUser=async n=>{n&&n.preventDefault();const e=n&&n.target&&n.target.tagName==="FORM"?n.target:document.getElementById("edit-user-form");if(!e){console.error("Critical Failure: Edit user form not found."),alert("Error: Form missing.");return}const t=new FormData(e),a=(t.get("id")||"").trim();if(!a){console.error("Data Failure: No 'id' name attribute found in form data.",{target:n.target,allData:Object.fromEntries(t.entries())}),alert("Error: User ID missing. Please refresh.");return}const s=e.querySelector('[name="isAdmin"]'),i=!!(s&&s.checked),d=e.querySelector('[name="canManageAttendanceSheet"]'),r=!!(d&&d.checked),o=String(t.get("pan")||"").trim().toUpperCase(),l=String(t.get("bankIfsc")||"").trim().toUpperCase(),c=String(t.get("joinDate")||"").trim(),u=String(t.get("employeeId")||"").trim(),m=/^[A-Z]{5}[0-9]{4}[A-Z]$/,p=/^[A-Z]{4}0[A-Z0-9]{6}$/;if(c){const f=new Date,w=`${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,"0")}-${String(f.getDate()).padStart(2,"0")}`;if(c>w){alert("Join Date cannot be in the future.");return}}if(o&&!m.test(o)){alert("Invalid PAN format. Use format like ABCDE1234F");return}if(l&&!p.test(l)){alert("Invalid IFSC format. Use format like SBIN0001234");return}const g=c?u||Ve(c,a):"NA",h={id:a,name:(t.get("name")||"").trim(),username:(t.get("username")||"").trim(),password:(t.get("password")||"").trim(),role:t.get("role"),dept:t.get("dept"),email:(t.get("email")||"").trim(),phone:(t.get("phone")||"").trim(),isAdmin:i,canManageAttendanceSheet:r,employeeId:g,joinDate:c||null,baseSalary:Number(t.get("baseSalary")||0),otherAllowances:Number(t.get("otherAllowances")||0),providentFund:Number(t.get("providentFund")||0),professionalTax:Number(t.get("professionalTax")||0),loanAdvance:Number(t.get("loanAdvance")||0),tdsPercent:Number(t.get("tdsPercent")||0),bankName:(t.get("bankName")||"").trim(),bankAccount:(t.get("bankAccount")||"").trim(),bankIfsc:l,pan:o,uan:(t.get("uan")||"").trim(),permissions:window.app_getPermissionsFromUI("edit")};console.log("Executing Update for User:",h),h.isAdmin&&(h.canManageAttendanceSheet=!0,h.role="Administrator");try{if(await window.AppAuth.updateUser(h)){console.log("Success: User updated in DB."),alert(`SUCCESS: Details for '${h.name}' have been saved.`),document.getElementById("edit-user-modal").style.display="none";const w=document.getElementById("page-content");w&&setTimeout(async()=>{w.innerHTML=await O.renderAdmin(),window.AppAnalytics&&await window.AppAnalytics.initAdminCharts()},50)}else alert("Update failed: User not found.")}catch(f){console.error("Update Error:",f),alert("Error: "+f.message)}};function mt(n,e){const[t,a]=n.split(":"),[s,i]=e.split(":"),d=parseInt(s)*60+parseInt(i)-(parseInt(t)*60+parseInt(a));if(d<0)return"Invalid";const r=Math.floor(d/60),o=d%60;return`${r}h ${o}m`}function de(){const n=document.getElementById("attendance-btn"),e=!!window.app_dashboardReadOnly,t=window.app_dashboardTargetUser||null;n&&!e&&n.addEventListener("click",he),vn(t,e),Be(),window.app_refreshNotificationBell&&window.app_refreshNotificationBell().catch(()=>{})}window.setupDashboardEvents=de;document.addEventListener("submit",n=>{n.preventDefault();const e=n.target.getAttribute("id");console.log("Submit Event Intercepted. Form ID:",e),e==="manual-log-form"?Tn(n):e==="checkout-form"?window.app_submitCheckOut(n):e==="add-user-form"?Ln(n):e==="login-form"?(async()=>{const t=new FormData(n.target);try{const a=await window.getLocation();if(!await window.AppAuth.login(t.get("username"),t.get("password"))){alert("Invalid Credentials");return}const i=window.AppAuth.getUser();i&&(i.lastLoginLocation={lat:a.lat,lng:a.lng,capturedAt:Date.now()},await window.AppDB.put("users",i)),window.location.reload()}catch(a){const s=String(a);s.includes("permission-denied")||s.includes("FirebaseError")?alert(`Database Error: ${s}

Access to the database was blocked. Please check your Firebase Firestore Security Rules.`):alert(`Login blocked: ${s}

Please enable location and try again.`)}})():e==="edit-user-form"?(console.log("Routing to app_submitEditUser..."),window.app_submitEditUser(n)):e==="notify-form"?Mn(n):e==="leave-request-form"?In(n):console.warn("Unhandled form submission ID:",e,"Target:",n.target)});async function In(n){const e=new FormData(n.target),t=window.AppAuth.getUser();await window.AppLeaves.requestLeave({userId:t.id,userName:t.name,startDate:e.get("startDate"),endDate:e.get("endDate"),startTime:e.get("startTime")||"",endTime:e.get("endTime")||"",type:e.get("type"),reason:e.get("reason"),durationHours:e.get("durationHours")||""}),alert("Leave requested successfully!"),document.getElementById("leave-modal").style.display="none",n.target.reset()}async function Mn(n){n.preventDefault();const e=new FormData(n.target),t=e.get("toUserId"),a=e.get("reminderMessage")||"",s=e.get("reminderLink")||"",i=e.get("taskTitle")||"",d=e.get("taskDescription")||"",r=e.get("taskDueDate")||"";try{if(!a.trim()&&!i.trim()){alert("Please enter a reminder or a task.");return}const o=await window.AppDB.get("users",t);if(!o)throw new Error("User not found");const l=window.AppAuth.getUser(),c=new Date().toISOString();o.notifications||(o.notifications=[]),a.trim()&&(o.notifications.unshift({id:`rem_${Date.now()}`,type:"reminder",message:a.trim(),taggedById:l.id,taggedByName:l.name,taggedAt:c,status:"pending",date:c,read:!1}),await window.AppDB.add("staff_messages",{id:`msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"text",message:a.trim(),link:s.trim(),fromId:l.id,fromName:l.name,toId:t,toName:o.name,createdAt:c,read:!1})),i.trim()&&(o.notifications.unshift({id:`task_${Date.now()}`,type:"task",title:i.trim(),description:d.trim(),taggedById:l.id,taggedByName:l.name,taggedAt:c,status:"pending",dueDate:r||"",date:c,read:!1}),await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:i.trim(),description:d.trim(),dueDate:r||"",status:"pending",fromId:l.id,fromName:l.name,toId:t,toName:o.name,createdAt:c,read:!1,history:[{action:"created",byId:l.id,byName:l.name,at:c}]})),await window.AppAuth.updateUser(o),alert("Notification sent!"),document.getElementById("notify-modal").style.display="none",window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()}catch(o){alert("Failed to send: "+o.message)}}window.app_openStaffThread=async n=>{window.app_staffThreadId=n;const e=window.AppAuth.getUser();if(!e)return;const a=(await window.app_getMyMessages()).filter(i=>i.toId===e.id&&i.fromId===n&&!i.read);for(const i of a)i.read=!0,i.readAt=new Date().toISOString(),await window.AppDB.put("staff_messages",i);const s=document.getElementById("page-content");s&&(s.innerHTML=await O.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_sendStaffText=async n=>{n.preventDefault();const e=window.AppAuth.getUser(),t=new FormData(n.target),a=t.get("toUserId"),s=(t.get("message")||"").trim(),i=(t.get("link")||"").trim();if(!s){alert("Please type a message.");return}const d=await window.AppDB.get("users",a);if(!d){alert("Staff member not found.");return}await window.AppDB.add("staff_messages",{id:`msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"text",message:s,link:i,fromId:e.id,fromName:e.name,toId:a,toName:d.name,createdAt:new Date().toISOString(),read:!1}),n.target.reset();const r=document.getElementById("staff-message-modal");r&&r.remove();const o=document.getElementById("page-content");o&&(o.innerHTML=await O.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_sendStaffTask=async n=>{n.preventDefault();const e=window.AppAuth.getUser(),t=new FormData(n.target),a=t.get("toUserId"),s=(t.get("taskTitle")||"").trim(),i=(t.get("taskDescription")||"").trim(),d=(t.get("taskDueDate")||"").trim();if(!s){alert("Please provide a task title.");return}const r=await window.AppDB.get("users",a);if(!r){alert("Staff member not found.");return}await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:s,description:i,dueDate:d,status:"pending",fromId:e.id,fromName:e.name,toId:a,toName:r.name,createdAt:new Date().toISOString(),read:!1,history:[{action:"created",byId:e.id,byName:e.name,at:new Date().toISOString()}]}),n.target.reset();const o=document.getElementById("staff-task-modal");o&&o.remove();const l=document.getElementById("page-content");l&&(l.innerHTML=await O.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_openStaffMessageModal=(n,e)=>{if(!n){alert("Select a staff member first.");return}const a=`
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
        `;window.app_showModal(a,"staff-task-modal")};window.app_respondStaffTask=async(n,e)=>{const t=window.AppAuth.getUser(),a=await window.AppDB.get("staff_messages",n);if(!a){alert("Task not found.");return}if(a.toId!==t.id){alert("Only the recipient can approve or reject this task.");return}let s="";if(e==="rejected"&&(s=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Task",confirmText:"Submit Reason"})||""),a.status=e,a.respondedAt=new Date().toISOString(),s&&(a.rejectReason=s),a.history||(a.history=[]),a.history.unshift({action:e,byId:t.id,byName:t.name,at:a.respondedAt,reason:s}),e==="approved"&&!a.calendarSynced){const r=a.dueDate||new Date().toISOString().split("T")[0],o=a.toName||t.name,l=`${a.title}${a.description?` - ${a.description}`:""}`;window.AppCalendar&&(await window.AppCalendar.addWorkPlanTask(r,a.toId,`${l} (Responsible: ${o})`,[],{addedFrom:"staff",sourcePlanId:a.id,sourceTaskIndex:0,taggedById:a.fromId,taggedByName:a.fromName,status:"pending"}),await window.AppCalendar.addWorkPlanTask(r,a.fromId,`${l} (Assigned to ${o})`,[],{addedFrom:"staff",sourcePlanId:a.id,sourceTaskIndex:1,taggedById:a.fromId,taggedByName:a.fromName,status:"pending"}),a.calendarSynced=!0)}await window.AppDB.put("staff_messages",a);const i=await window.AppDB.get("users",a.fromId);i&&(i.notifications||(i.notifications=[]),i.notifications.unshift({id:`taskresp_${Date.now()}`,type:"task_response",message:`${t.name} ${e} a task.`,title:a.title,taggedByName:t.name,status:e,reason:s,date:a.respondedAt,read:!1}),await window.AppDB.put("users",i));const d=document.getElementById("page-content");d&&(d.innerHTML=await O.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_updateStaffNavIndicator=async()=>{const n=window.AppAuth.getUser();if(!n)return;const e=document.querySelectorAll('[data-page="staff-directory"]');if(!e.length)return;const a=(await window.app_getMyMessages()).some(s=>s.toId===n.id&&!s.read);e.forEach(s=>{a?s.classList.add("has-new-msg"):s.classList.remove("has-new-msg")})};window.app_handleTagDecision=async(n,e)=>{const t=window.AppAuth.getUser();try{const a=await window.AppDB.get("users",t.id);if(!a||!a.notifications)throw new Error("Notification not found");const s=a.notifications.find(o=>o.id===n);if(!s)throw new Error("Notification not found");let i="";e==="rejected"&&(i=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Item",confirmText:"Submit Reason"})||"");const d=new Date().toISOString();if(s.status=e,s.respondedAt=d,s.read=!0,s.dismissedAt=d,i&&(s.rejectReason=i),a.tagHistory||(a.tagHistory=[]),a.tagHistory.unshift({id:`taghist_${Date.now()}`,type:"tag_response",title:s.title||s.message||"Tagged item",taggedByName:s.taggedByName||"Staff",status:e,reason:i,date:new Date().toISOString()}),await window.AppDB.put("users",a),s.taggedById){const o=await window.AppDB.get("users",s.taggedById);o&&(o.notifications||(o.notifications=[]),o.notifications.unshift({id:`tagresp_${Date.now()}`,type:"tag_response",message:`${t.name} ${e} your ${s.type||"tag"}.`,title:s.title||"",taggedByName:t.name,status:e,reason:i,date:new Date().toISOString(),read:!1}),await window.AppDB.put("users",o))}const r=document.getElementById("page-content");r&&(r.innerHTML=await O.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents())}catch(a){alert("Failed to update tag: "+a.message)}};document.addEventListener("auth-logout",()=>window.AppAuth.logout());window.app_reviewMinuteAccessFromNotification=async(n,e,t)=>{try{const a=window.AppAuth.getUser();if(!(a&&(a.isAdmin||a.role==="Administrator"))){alert("Only admin can review access requests.");return}const i=await window.AppDB.get("users",a.id);if(!i||!Array.isArray(i.notifications)){alert("Notification not found.");return}let d=null;if(typeof n=="number"&&i.notifications[n]&&(d=i.notifications[n]),!d&&e&&(d=i.notifications.find(f=>String(f.id)===String(e))),!d||d.type!=="minute-access-request"){alert("This notification is no longer available.");return}const r=d.minuteId,o=d.taggedById||d.requesterId;if(!r||!o){alert("Invalid access request payload.");return}const l=await window.AppDB.get("minutes",r);if(!l){alert("Minute not found.");return}const c=Array.isArray(l.accessRequests)?l.accessRequests.slice():[];c.findIndex(f=>f.userId===o)<0&&c.push({userId:o,userName:d.taggedByName||"Staff",requestedAt:d.taggedAt||d.date||new Date().toISOString(),status:"pending",reviewedAt:"",reviewedBy:""});const m=c.findIndex(f=>f.userId===o);c[m]={...c[m],status:t,reviewedAt:new Date().toISOString(),reviewedBy:a.name};let p=Array.isArray(l.allowedViewers)?l.allowedViewers.slice():[];t==="approved"?p.includes(o)||p.push(o):p=p.filter(f=>f!==o),await window.AppMinutes.updateMinute(r,{accessRequests:c,allowedViewers:p},t==="approved"?"Admin approved minutes access from notification":"Admin rejected minutes access from notification");const g=await window.AppDB.get("users",o);g&&(g.notifications||(g.notifications=[]),g.notifications.unshift({id:Date.now()+Math.random(),type:"minute-access-reviewed",title:"Minutes Access Update",message:`Your request for "${l.title}" was ${t}.`,minuteId:r,taggedById:a.id,taggedByName:a.name,status:t,taggedAt:new Date().toISOString(),date:new Date().toISOString()}),await window.AppDB.put("users",g));const h=i.notifications.find(f=>String(f.id)===String(d.id));h&&(h.status=t,h.respondedAt=new Date().toISOString(),h.read=!0,await window.AppAuth.updateUser(i)),Q.innerHTML=await O.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}catch(a){alert("Failed to review access request: "+a.message)}};document.addEventListener("dismiss-notification",async n=>{const e=n.detail,t=typeof e=="object"&&e!==null?e.notifIndex:e,a=typeof e=="object"&&e!==null?String(e.notifId||""):"",s=window.AppAuth.getUser();if(s&&s.notifications&&Number.isInteger(t)&&t>=0){let i=s.notifications[t];if(!i&&a&&(i=s.notifications.find(r=>String(r.id||"")===a)),!i)return;i.read=!0,i.dismissedAt=new Date().toISOString(),await window.AppAuth.updateUser(s),(window.location.hash.slice(1)||"dashboard")==="dashboard"&&(Q.innerHTML=await O.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}else if(s&&s.notifications&&a){const i=s.notifications.find(r=>String(r.id||"")===a);if(!i)return;i.read=!0,i.dismissedAt=new Date().toISOString(),await window.AppAuth.updateUser(s),(window.location.hash.slice(1)||"dashboard")==="dashboard"&&(Q.innerHTML=await O.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}});document.addEventListener("dismiss-tag-history",async n=>{const e=String(n.detail||""),t=window.AppAuth.getUser();if(!e||!t||!Array.isArray(t.tagHistory))return;const a=t.tagHistory.findIndex(s=>String(s.id)===e);a<0||(t.tagHistory.splice(a,1),await window.AppAuth.updateUser(t),Q.innerHTML=await O.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents())});document.addEventListener("open-log-modal",()=>{const n=document.getElementById("log-modal");if(!n)return;const e=new Date,t=s=>s.toString().padStart(2,"0");document.getElementById("log-date").value=e.toISOString().split("T")[0],document.getElementById("log-start-time").value=`${t(e.getHours())}:${t(e.getMinutes())}`;const a=new Date(e.getTime()+36e5);document.getElementById("log-end-time").value=`${t(a.getHours())}:${t(a.getMinutes())}`,n.style.display="flex"});document.addEventListener("set-duration",n=>{const e=n.detail,t=document.getElementById("log-start-time"),a=document.getElementById("log-end-time");if(t.value){const[s,i]=t.value.split(":").map(Number),d=new Date;d.setHours(s,i);const r=new Date(d.getTime()+e*60*1e3),o=l=>l.toString().padStart(2,"0");a.value=`${o(r.getHours())}:${o(r.getMinutes())}`}});window.app_editUser=async n=>{console.log("Opening Edit Modal for ID:",n);const e=await window.AppDB.get("users",n);if(console.log("User Data Found:",e),!e)return;const t=document.getElementById("edit-user-form");if(!t)return;const a=(l,c)=>{const u=t.querySelector(l);u&&(u.value=c!==void 0?c:"")},s=(l,c)=>{const u=t.querySelector(l);u&&(u.checked=!!c)};a("#edit-user-id",e.id),a("#edit-user-name",e.name),a("#edit-user-username",e.username),a("#edit-user-password",e.password),a("#edit-user-role",e.role),a("#edit-user-dept",e.dept),a("#edit-user-email",e.email),a("#edit-user-phone",e.phone),s("#edit-user-isAdmin",!!(e.isAdmin||e.role==="Administrator")),s("#edit-user-can-manage-attendance-sheet",!!(e.canManageAttendanceSheet||e.isAdmin||e.role==="Administrator"));const i=ra(e.joinDate);a("#edit-user-join-date",i),a("#edit-user-employee-id",i?e.employeeId||Ve(i,e.id):"NA"),a("#edit-user-base-salary",Number(e.baseSalary||0)),a("#edit-user-other-allowances",Number(e.otherAllowances||0)),a("#edit-user-pf",Number(e.providentFund||0)),a("#edit-user-professional-tax",Number(e.professionalTax||0)),a("#edit-user-loan-advance",Number(e.loanAdvance||0)),a("#edit-user-tds-percent",Number(e.tdsPercent||0)),a("#edit-user-bank-name",e.bankName||""),a("#edit-user-bank-account",e.bankAccount||e.accountNumber||""),a("#edit-user-bank-ifsc",e.bankIfsc||e.ifsc||""),a("#edit-user-pan",e.pan||e.PAN||""),a("#edit-user-uan",e.uan||e.UAN||"");const d=["dashboard","leaves","users","attendance","reports","minutes","policies"],r=e.permissions||{};d.forEach(l=>{const c=r[l],u=document.getElementById(`edit-perm-${l}-view`),m=document.getElementById(`edit-perm-${l}-admin`);u&&(u.checked=c==="view"||c==="admin"),m&&(m.checked=c==="admin")});const o=document.getElementById("edit-user-modal");if(o){o.style.display="flex";const l=document.getElementById("edit-user-permissions-panel");l&&(l.style.display="block")}};window.app_notifyUser=n=>{console.log("Opening Notify for:",n),document.getElementById("notify-user-id").value=n,document.getElementById("notify-modal").style.display="flex"};window.app_quickAddTask=async n=>{const e=window.AppAuth.getUser();if(!(e&&(e.role==="Administrator"||e.isAdmin))&&n!==e.id){alert("Only administrators can assign tasks to other staff.");return}const a=await window.appPrompt("Task to assign:","",{title:"Assign Task",placeholder:"Enter task title",confirmText:"Next"});if(!a||!a.trim())return;const s=await window.appPrompt("Task date (YYYY-MM-DD). Leave blank for today:","",{title:"Assign Task Date",placeholder:"YYYY-MM-DD",confirmText:"Create Task"}),i=s&&s.trim()?s.trim():new Date().toISOString().split("T")[0];try{if(!window.AppCalendar)throw new Error("Calendar module not available.");await window.AppCalendar.addWorkPlanTask(i,n,a.trim()),await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:a.trim(),description:"",dueDate:i,status:"pending",fromId:e.id,fromName:e.name,toId:n,toName:(await window.AppDB.get("users",n))?.name||"Staff",createdAt:new Date().toISOString(),read:!1,history:[{action:"created",byId:e.id,byName:e.name,at:new Date().toISOString()}]}),alert("Task added successfully.");const d=document.getElementById("page-content");d&&(d.innerHTML=await O.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()}catch(d){alert("Failed to add task: "+d.message)}};window.app_viewLogs=async n=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}console.log("Viewing details for:",n);const e=await window.AppDB.get("users",n);let t=await window.AppAttendance.getLogs(n);window.currentViewedLogs=t,window.currentViewedUser=e;const a=t.length?`
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
        `;window.app_showModal(e,"manual-admin-log-modal")};window.app_submitManualLog=async(n,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}n.preventDefault();const t=new FormData(n.target),a=t.get("checkIn"),s=t.get("checkOut"),i=mt(a,s);if(i==="Invalid"){alert("End time must be after Start time");return}const d=t.get("date"),r=window.AppAttendance.buildDateTime(d,a),o=window.AppAttendance.buildDateTime(d,s),l=r&&o?o-r:0,c=window.AppAttendance.evaluateAttendanceStatus(r||new Date,l),u=p=>{const[g,h]=p.split(":"),f=parseInt(g),w=f>=12?"PM":"AM",v=f%12||12;return`${String(v).padStart(2,"0")}:${h} ${w}`},m={date:d,checkIn:u(a),checkOut:u(s),duration:i,type:c.status,workDescription:t.get("description")||"Manual Entry by Admin",location:"Office (Manual)",durationMs:l,dayCredit:c.dayCredit,lateCountable:c.lateCountable,extraWorkedMs:c.extraWorkedMs||0,policyVersion:"v2",isManualOverride:!0,entrySource:"admin_override",attendanceEligible:!0};try{await window.AppAttendance.addAdminLog(e,m),alert("Attendance added manually."),document.getElementById("manual-admin-log-modal")?.remove(),window.app_viewLogs(e)}catch(p){alert("Error: "+p.message)}};window.app_deleteLog=async(n,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Are you sure you want to delete this attendance record?"))try{await window.AppAttendance.deleteLog(n),alert("Record deleted."),window.app_viewLogs(e)}catch(t){alert("Error: "+t.message)}};window.app_approveLeave=async n=>{if(await window.appConfirm("Are you sure you want to APPROVE this leave request?"))try{const e=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(n,"Approved",e.id),alert("Leave Approved! Attendance logs have been automatically generated.");const t=document.getElementById("page-content");t&&(t.innerHTML=await O.renderDashboard(),de())}catch(e){alert("Error: "+e.message)}};window.app_rejectLeave=async n=>{const e=await window.appPrompt("Enter rejection reason (optional):","",{title:"Reject Leave",confirmText:"Reject Leave"});if(e!==null)try{const t=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(n,"Rejected",t.id,e),alert("Leave Rejected.");const a=document.getElementById("page-content");a&&(a.innerHTML=await O.renderDashboard(),de())}catch(t){alert("Error: "+t.message)}};window.app_addLeaveComment=async n=>{const e=await window.AppDB.get("leaves",n),t=await window.appPrompt("Enter/Edit Admin Comment:",e.adminComment||"",{title:"Admin Comment",confirmText:"Save Comment"});if(t!==null)try{const a=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(n,e.status,a.id,t),alert("Comment saved.");const s=document.getElementById("page-content");s&&(s.innerHTML=await O.renderDashboard(),de())}catch(a){alert("Error: "+a.message)}};window.app_exportLeaves=async()=>{try{const n=await window.AppLeaves.getAllLeaves();if(n.length===0){alert("No leave requests found to export.");return}await window.AppReports.exportLeavesCSV(n)}catch(n){alert("Export Failed: "+n.message)}};window.app_refreshMasterSheet=async()=>{const n=document.getElementById("page-content");if(n){const e=document.getElementById("sheet-month")?.value,t=document.getElementById("sheet-year")?.value;n.innerHTML=await O.renderMasterSheet(e,t)}};window.app_exportMasterSheet=async()=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}const n=parseInt(document.getElementById("sheet-month").value),e=parseInt(document.getElementById("sheet-year").value),t=await window.AppDB.getAll("users"),a=`${e}-${String(n+1).padStart(2,"0")}-01`,s=`${e}-${String(n+1).padStart(2,"0")}-31`,d=(await window.AppDB.query("attendance","date",">=",a)).filter(r=>r.date<=s);await window.AppReports.exportMasterSheetCSV(n,e,t,d)};window.app_openCellOverride=async(n,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}const t=(await window.AppDB.getAll("users")).find(r=>r.id===n),a=await window.AppDB.getAll("attendance"),s=r=>{if(Object.prototype.hasOwnProperty.call(r||{},"attendanceEligible"))return r.attendanceEligible===!0;const o=String(r?.entrySource||"");return o==="staff_manual_work"?!1:o==="admin_override"||o==="checkin_checkout"||r?.isManualOverride||r?.location==="Office (Manual)"||r?.location==="Office (Override)"||typeof r?.activityScore<"u"||typeof r?.locationMismatched<"u"||typeof r?.autoCheckout<"u"||!!r?.checkOutLocation||typeof r?.outLat<"u"||typeof r?.outLng<"u"?!0:String(r?.type||"").includes("Leave")||r?.location==="On Leave"},i=a.filter(r=>(r.userId===n||r.user_id===n)&&r.date===e&&s(r)).sort((r,o)=>Number(o.id||0)-Number(r.id||0))[0],d=`
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
                                    <input type="time" name="checkIn" required value="${i?Ke(i.checkIn):"09:00"}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time Out</label>
                                    <input type="time" name="checkOut" required value="${i?Ke(i.checkOut):"17:00"}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
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
        `;window.app_showModal(d,"cell-override-modal")};window.app_submitCellOverride=async(n,e,t,a)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}n.preventDefault();const s=new FormData(n.target),i=s.get("checkIn"),d=s.get("checkOut"),r=mt(i,d);if(r==="Invalid"){alert("End time must be after Start time");return}const o=window.AppAttendance.buildDateTime(t,i),l=window.AppAttendance.buildDateTime(t,d),c=o&&l?l-o:0,u=window.AppAttendance.evaluateAttendanceStatus(o||new Date,c),m=s.get("isManualOverride")==="on",p=String(s.get("type")||"").trim(),g=m&&p?p:u.status,h=w=>{if(!w||w==="--")return"--";const[v,b]=w.split(":"),k=parseInt(v),y=k>=12?"PM":"AM",S=k%12||12;return`${String(S).padStart(2,"0")}:${b} ${y}`},f={date:t,checkIn:h(i),checkOut:h(d),duration:r,type:g,workDescription:s.get("description")||"Admin Override",location:"Office (Override)",durationMs:c,dayCredit:u.dayCredit,lateCountable:u.lateCountable,extraWorkedMs:u.extraWorkedMs||0,policyVersion:"v2",isManualOverride:m,entrySource:"admin_override",attendanceEligible:!0,autoCheckoutExtraApproved:s.get("autoCheckoutExtraApproved")==="on"};try{a?await window.AppAttendance.updateLog(a,f):await window.AppAttendance.addAdminLog(e,f),alert("Override successful."),document.getElementById("cell-override-modal")?.remove(),window.app_refreshMasterSheet()}catch(w){alert("Error: "+w.message)}};window.app_deleteCellLog=async(n,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Delete this attendance record?"))try{await window.AppAttendance.deleteLog(n),document.getElementById("cell-override-modal")?.remove(),window.app_refreshMasterSheet()}catch(t){alert("Error: "+t.message)}};function Ke(n){if(!n||n==="--"||n==="Active Now")return"09:00";const[e,t]=n.split(" ");let[a,s]=e.split(":"),i=parseInt(a);return t==="PM"&&i<12&&(i+=12),t==="AM"&&i===12&&(i=0),`${String(i).padStart(2,"0")}:${s}`}const En=n=>{if(!n)return null;const e=String(n).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);if(!Number.isNaN(t.getTime())){const s=t.getFullYear(),i=String(t.getMonth()+1).padStart(2,"0"),d=String(t.getDate()).padStart(2,"0");return`${s}-${i}-${d}`}const a=e.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);if(a){const s=Number(a[1]),i=Number(a[2]),d=Number(a[3]);let r=s,o=i;return o>12&&s<=12&&(o=s,r=i),o<1||o>12||r<1||r>31?null:`${d}-${String(o).padStart(2,"0")}-${String(r).padStart(2,"0")}`}return null};window.app_runAttendancePolicyMigration=async()=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Recalculate historical attendance logs with the current policy? This updates stored status/credits for existing office logs.","Run Attendance Migration"))try{const e=await window.AppDB.getAll("attendance");let t=0,a=0,s=0;const i=new Set(["Work - Home","Training","On Duty","Holiday","National Holiday","Regional Holidays"]);let d=0,r=0;const o=new Map,l=new Map,c=h=>{const f=En(h?.date),w=typeof h?.activityScore<"u"||typeof h?.locationMismatched<"u"||typeof h?.autoCheckout<"u"||!!h?.checkOutLocation||typeof h?.outLat<"u"||typeof h?.outLng<"u";let b=String(h?.entrySource||"").trim();b||(h?.isManualOverride||h?.location==="Office (Manual)"||h?.location==="Office (Override)"?b="admin_override":w?b="checkin_checkout":b="staff_manual_work");const k=h?.checkIn&&h?.checkOut&&h?.checkOut!=="Active Now"?Ke(h.checkIn):null,y=h?.checkIn&&h?.checkOut&&h?.checkOut!=="Active Now"?Ke(h.checkOut):null,S=f&&k?window.AppAttendance.buildDateTime(f,k):null,_=f&&y?window.AppAttendance.buildDateTime(f,y):null,T=!!(S&&_&&_>S),L=T?_-S:null,I=typeof h?.durationMs=="number"?h.durationMs:L,U=typeof I=="number"?Math.max(0,I)/(1e3*60*60):0;let M;return Object.prototype.hasOwnProperty.call(h||{},"attendanceEligible")?M=h.attendanceEligible===!0:b==="staff_manual_work"?M=U>=4:M=!0,{dateIso:f,inDt:S,outDt:_,validTimeRange:T,resolvedDurationMs:I,workedHours:U,inferredSource:b,inferredAttendanceEligible:M}},u=(h,f)=>{const w=window.AppAttendance.normalizeType(h?.type);let v=0;f.inferredSource==="staff_manual_work"?f.workedHours>=8?v=100:f.workedHours>=4&&(v=50):v=Number(window.AppAttendance.getDayCredit(w)||0)*100;let b=0;return b+=v,b+=Math.min(20,Math.floor(Math.max(0,f.workedHours||0))),f.inferredAttendanceEligible&&(b+=40),f.validTimeRange&&(b+=10),f.inferredSource==="checkin_checkout"?b+=8:f.inferredSource==="admin_override"?b+=6:b+=4,h?.isManualOverride&&(b+=4),(String(h?.type||"").includes("Leave")||h?.location==="On Leave")&&(b+=6),b+=Number(h?.id||0)/1e13,b};for(const h of e){if(!h||!h.id)continue;const f=c(h);o.set(h.id,f);const w=h.user_id||h.userId;if(!w||!f.dateIso)continue;const v=`${w}|${f.dateIso}`;l.has(v)||l.set(v,[]),l.get(v).push(h)}const m=new Map;for(const[h,f]of l.entries()){if(!f||f.length===0)continue;const w=f.slice().sort((v,b)=>{const k=o.get(v.id)||c(v),y=o.get(b.id)||c(b);return u(b,y)-u(v,k)});m.set(h,w[0]?.id)}for(const h of e){if(t++,!h||!h.id){s++;continue}const f=window.AppAttendance.normalizeType(h.type),w=o.get(h.id)||c(h),v=w.dateIso,b=w.inDt,k=w.outDt,y=w.resolvedDurationMs,S=w.workedHours,_=w.inferredSource;let T=w.inferredAttendanceEligible;const L=h.user_id||h.userId,I=L&&v?`${L}|${v}`:null,U=I?m.get(I):null,M=!!(U&&U!==h.id),N=!!(h.checkIn&&h.checkOut&&h.checkOut!=="Active Now")&&!!(b&&k&&k<=b);let E=h.type,P=h.dayCredit,B=h.lateCountable,F=h.extraWorkedMs||0;if(M&&(T=!1,String(h.type||"").includes("Leave")||(E="Work Log"),P=0,B=!1,F=0,d++),N&&(T=!1,String(h.type||"").includes("Leave")||(E="Work Log"),P=0,B=!1,F=0,r++),_==="staff_manual_work"&&!M&&!N)S>=8?(E="Present",P=1):S>=4?(E="Half Day",P=.5):(E="Work Log",P=0),B=!1,F=0;else if(!h.isManualOverride&&T&&!(i.has(f)||String(f).includes("Leave")||f==="Office")&&b&&k&&k>b){const $=window.AppAttendance.evaluateAttendanceStatus(b,k-b);E=$.status,P=$.dayCredit,B=$.lateCountable,F=$.extraWorkedMs||0}const z={...h,entrySource:_,attendanceEligible:T,type:E,dayCredit:typeof P=="number"?P:0,lateCountable:B===!0,extraWorkedMs:F||0,durationMs:typeof y=="number"?y:null,policyVersion:"v2"};if(!(h.entrySource!==z.entrySource||h.attendanceEligible!==z.attendanceEligible||h.type!==z.type||h.dayCredit!==z.dayCredit||h.lateCountable!==z.lateCountable||(h.extraWorkedMs||0)!==(z.extraWorkedMs||0)||h.durationMs!==z.durationMs||h.policyVersion!=="v2")){s++;continue}await window.AppDB.put("attendance",z),a++}alert(`Migration complete.
Scanned: ${t}
Updated: ${a}
Skipped: ${s}
Duplicates neutralized: ${d}
Invalid-time logs neutralized: ${r}`);const p=window.location.hash.slice(1),g=document.getElementById("page-content");if(!g)return;p==="policy-test"?g.innerHTML=await O.renderPolicyTest():p==="dashboard"?(g.innerHTML=await O.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()):p==="salary"?(g.innerHTML=await O.renderSalaryProcessing(),window.app_recalculateAllSalaries&&window.app_recalculateAllSalaries()):p==="timesheet"&&(g.innerHTML=await O.renderTimesheet())}catch(e){console.error("Attendance migration failed:",e),alert("Migration failed: "+e.message)}};window.app_deleteUser=async n=>{if(await window.appConfirm("Are you sure you want to delete this user? This action cannot be undone."))try{await window.AppDB.delete("users",n),alert("User deleted successfully.");const e=document.getElementById("page-content");e&&(e.innerHTML=await O.renderAdmin())}catch(e){alert("Failed to delete user: "+e.message)}};window.app_recalculateRow=n=>{const e=parseFloat(n.querySelector(".base-salary-input").value)||0,t=e/22,a=parseFloat(n.querySelector(".unpaid-leaves-count").innerText)||0,s=parseFloat(n.querySelector(".late-count")?.innerText||"0")||0,i=Math.floor(s/(D.LATE_GRACE_COUNT||3))*(D.LATE_DEDUCTION_PER_BLOCK||.5),d=parseFloat(n.querySelector(".extra-work-hours")?.innerText||"0")||0,r=Math.floor(d/(D.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4))*(D.LATE_DEDUCTION_PER_BLOCK||.5),o=Math.max(0,i-r),l=a+o,c=parseFloat(document.getElementById("global-tds-percent").value)||0,u=n.querySelector(".tds-input");u&&!u.dataset.manual&&(u.value=c);const m=u?parseFloat(u.value)||0:c,p=Math.round(t*l),g=n.querySelector(".late-deduction-days"),h=n.querySelector(".late-deduction-raw"),f=n.querySelector(".penalty-offset-days"),w=n.querySelector(".deduction-days"),v=n.querySelector(".attendance-deduction-amount");h&&(h.innerText=i.toFixed(1)),f&&(f.innerText=r.toFixed(1)),g&&(g.innerText=o.toFixed(1)),w&&(w.innerText=l.toFixed(1)),v&&(v.innerText="-Rs "+p.toLocaleString()),n.querySelector(".deduction-amount").innerText="-Rs "+p.toLocaleString();const b=n.querySelector(".salary-input");b.dataset.manual||(b.value=Math.max(0,e-p));const k=parseFloat(b.value)||0,y=Math.round(k*(m/100)),S=Math.max(0,k-y);n.querySelector(".tds-amount").innerText="Rs "+y.toLocaleString(),n.querySelector(".tds-amount").dataset.value=y,n.querySelector(".final-net-salary").innerText="Rs "+S.toLocaleString(),n.querySelector(".final-net-salary").dataset.value=S};const pa=n=>{const e=parseFloat(n.querySelector(".unpaid-leaves-count")?.innerText||"0")||0,t=parseFloat(n.querySelector(".late-count")?.innerText||"0")||0,a=parseFloat(n.querySelector(".extra-work-hours")?.innerText||"0")||0,s=Math.floor(t/(D.LATE_GRACE_COUNT||3))*(D.LATE_DEDUCTION_PER_BLOCK||.5),i=Math.floor(a/(D.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4))*(D.LATE_DEDUCTION_PER_BLOCK||.5),d=Math.max(0,s-i),r=e+d;return{unpaidLeaves:e,lateCount:t,extraWorkedHours:a,rawLateDeductionDays:s,penaltyOffsetDays:i,lateDeductionDays:d,deductionDays:r}};window.app_recalculateAllSalaries=()=>{document.querySelectorAll("tr[data-user-id]").forEach(n=>{window.app_recalculateRow(n)})};const Ze=(n,e=new Date)=>{if(/^\d{4}-\d{2}$/.test(String(n||"").trim())){const[t,a]=String(n).split("-").map(Number);if(Number.isFinite(t)&&Number.isFinite(a)&&a>=1&&a<=12)return{year:t,monthIndex:a-1}}return{year:e.getFullYear(),monthIndex:e.getMonth()}};window.app_toggleSalaryPeriodMode=function(){const n=document.getElementById("salary-period-mode")?.value||"single",e=document.getElementById("salary-period-single-wrap"),t=document.getElementById("salary-period-range-wrap");e&&(e.style.display=n==="range"?"none":"block"),t&&(t.style.display=n==="range"?"flex":"none")};window.app_getSalaryPayPeriodInfo=function(){const n=new Date;if((document.getElementById("salary-period-mode")?.value||"single")==="range"){const r=document.getElementById("salary-pay-period-from")?.value||"",o=document.getElementById("salary-pay-period-to")?.value||"";let l=Ze(r,n),c=Ze(o,n);const u=l.year*100+(l.monthIndex+1);if(c.year*100+(c.monthIndex+1)<u){const w=l;l=c,c=w}const p=new Date(l.year,l.monthIndex,1),g=new Date(c.year,c.monthIndex+1,0),h=`${l.year}-${String(l.monthIndex+1).padStart(2,"0")}`,f=`${c.year}-${String(c.monthIndex+1).padStart(2,"0")}`;return{mode:"range",startDate:p,endDate:g,startKey:h,endKey:f,key:`${h}_to_${f}`,label:`${p.toLocaleDateString("en-GB",{month:"long",year:"numeric"})} to ${g.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}`}}const t=document.getElementById("salary-pay-period")?.value||"",a=Ze(t,n),s=new Date(a.year,a.monthIndex,1),i=new Date(a.year,a.monthIndex+1,0),d=`${a.year}-${String(a.monthIndex+1).padStart(2,"0")}`;return{mode:"single",startDate:s,endDate:i,startKey:d,endKey:d,key:d,label:s.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}};window.app_saveAllSalaries=async()=>{const n=document.querySelectorAll("tr[data-user-id]"),e=[],t=[],a=window.app_getSalaryPayPeriodInfo(),s=a.key,i=document.getElementById("salary-pay-date")?.value||"",d=i?new Date(i).getTime():Date.now(),r=parseFloat(document.getElementById("global-tds-percent").value)||0;for(const o of n){const l=o.dataset.userId,c=o.querySelector(".base-salary-input").value,u=o.querySelector(".salary-input").value,m=o.querySelector(".comment-input").value,p=o.querySelector(".tds-input"),g=p?parseFloat(p.value)||0:r,h=o.querySelector(".tds-amount").dataset.value||0,f=o.querySelector(".final-net-salary").dataset.value||0,w=pa(o),v=w.unpaidLeaves,b=w.lateCount,k=w.extraWorkedHours,y=w.rawLateDeductionDays,S=w.penaltyOffsetDays,_=w.lateDeductionDays,T=w.deductionDays,L=Number(String(o.querySelector(".attendance-deduction-amount")?.innerText||"0").replace(/[^0-9.-]+/g,"")),I=String(o.querySelector(".employee-id-input")?.value||"").trim(),U=String(o.querySelector(".designation-input")?.value||"").trim(),M=String(o.querySelector(".department-input")?.value||"").trim(),A=String(o.querySelector(".join-date-input")?.value||"").trim(),N=A?I||Ve(A,l):"NA",E=String(o.querySelector(".bank-name-input")?.value||"").trim(),P=String(o.querySelector(".bank-account-input")?.value||"").trim(),B=String(o.querySelector(".pan-input")?.value||"").trim(),F=String(o.querySelector(".uan-input")?.value||"").trim(),W=Number(o.querySelector(".other-allowances-input")?.value||0),z=Number(o.querySelector(".pf-input")?.value||0),V=Number(o.querySelector(".professional-tax-input")?.value||0),$=Number(o.querySelector(".loan-advance-input")?.value||0);if(o.querySelector(".comment-input").required&&!m){alert(`Please provide a comment for user ID: ${l} as the salary was adjusted.`);return}e.push({id:`salary_${l}_${s}`,userId:l,month:s,periodMode:a.mode,periodStart:a.startKey,periodEnd:a.endKey,periodLabel:a.label,payDate:d,baseAmount:Number(c),otherAllowances:W,providentFund:z,professionalTax:V,loanAdvance:$,employeeId:N,designation:U,department:M,joinDate:A||null,bankName:E,bankAccount:P,pan:B,uan:F,attendanceDeduction:L,deductions:Number(o.querySelector(".deduction-amount").innerText.replace(/[^0-9.-]+/g,"")),unpaidLeaves:v,lateCount:b,extraWorkedHours:k,lateDeductionRawDays:y,penaltyOffsetDays:S,lateDeductionDays:_,deductionDays:T,adjustedAmount:Number(u),tdsPercent:g,tdsAmount:Number(h),finalNet:Number(f),comment:m||"",processedAt:Date.now()}),t.push({id:l,baseSalary:Number(c),tdsPercent:g,employeeId:N,designation:U,dept:M,joinDate:A||null,bankName:E,bankAccount:P,pan:B,uan:F,otherAllowances:W,providentFund:z,professionalTax:V,loanAdvance:$})}try{for(const l of e)await window.AppDB.put("salaries",l);for(const l of t){const c=await window.AppDB.get("users",l.id);c&&(Object.assign(c,l),await window.AppDB.put("users",c))}alert("All records and TDS details saved successfully!");const o=document.getElementById("page-content");o.innerHTML=await O.renderSalaryProcessing()}catch(o){console.error("Salary Save Error:",o),alert("Failed to save records: "+o.message)}};window.app_exportSalaryCSV=()=>{const n=document.querySelectorAll("tr[data-user-id]");let e=`Staff Name,Emp ID,Designation,Department,Join Date,Bank Name,Bank Account,PAN,UAN,Base Salary,Other Allowances,PF,Professional Tax,Loan Advance,Present,Late,Unpaid Leaves,Extra Work Hours,Late Deduction Raw,Penalty Offset Days,Late Deduction Days,Total Deduction Days,Attendance Deduction,Total Deductions,Adjusted Salary,TDS (%),TDS Amount,Final Net,Comment
`;n.forEach(d=>{const r=d.querySelector('div[style*="font-weight: 600"]').innerText,o=d.querySelector(".base-salary-input").value,l=d.querySelector(".employee-id-input")?.value||"",c=d.querySelector(".designation-input")?.value||"",u=d.querySelector(".department-input")?.value||"",m=d.querySelector(".join-date-input")?.value||"",p=d.querySelector(".bank-name-input")?.value||"",g=d.querySelector(".bank-account-input")?.value||"",h=d.querySelector(".pan-input")?.value||"",f=d.querySelector(".uan-input")?.value||"",w=d.querySelector(".other-allowances-input")?.value||"0",v=d.querySelector(".pf-input")?.value||"0",b=d.querySelector(".professional-tax-input")?.value||"0",k=d.querySelector(".loan-advance-input")?.value||"0",y=d.querySelector(".present-count")?.innerText||"0",S=d.querySelector(".late-count")?.innerText||"0",_=d.querySelector(".unpaid-leaves-count")?.innerText||"0",T=d.querySelector(".extra-work-hours")?.innerText||"0",L=d.querySelector(".late-deduction-raw")?.innerText||"0",I=d.querySelector(".penalty-offset-days")?.innerText||"0",U=d.querySelector(".late-deduction-days")?.innerText||"0",M=d.querySelector(".deduction-days")?.innerText||"0",A=(d.querySelector(".attendance-deduction-amount")?.innerText||"").replace(/[^0-9.-]+/g,"")||"0",N=(d.querySelector(".deduction-amount").innerText||"").replace(/[^0-9.-]+/g,""),E=d.querySelector(".salary-input").value,P=parseFloat(document.getElementById("global-tds-percent").value)||0,B=d.querySelector(".tds-input"),F=B&&B.value!==""?B.value:P,W=(d.querySelector(".tds-amount").innerText||"").replace(/[^0-9.-]+/g,""),z=(d.querySelector(".final-net-salary").innerText||"").replace(/[^0-9.-]+/g,""),V=d.querySelector(".comment-input").value;e+=`"${r}","${l}","${c}","${u}","${m}","${p}","${g}","${h}","${f}",${o},${w},${v},${b},${k},${y},${S},${_},${T},${L},${I},${U},${M},${A},${N},${E},${F},${W},${z},"${V}"
`});const t=new Blob([e],{type:"text/csv"}),a=window.URL.createObjectURL(t),s=document.createElement("a"),i=window.app_getSalaryPayPeriodInfo();s.setAttribute("href",a),s.setAttribute("download",`Salaries_${i.key.replace(/[^a-zA-Z0-9_-]/g,"_")}.csv`),s.click()};const Qe=(n,e=4)=>{const t=String(n||"").trim();return t?t.length<=e?t:`${"*".repeat(Math.max(0,t.length-e))}${t.slice(-e)}`:"NA"},Cn=n=>{const e=Math.floor(Number(n)||0);if(e===0)return"Zero";const t=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"],a=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"],s=m=>{if(m<20)return t[m];const p=Math.floor(m/10),g=m%10;return`${a[p]}${g?` ${t[g]}`:""}`.trim()},i=m=>{const p=Math.floor(m/100),g=m%100;return p?`${t[p]} Hundred${g?` ${s(g)}`:""}`.trim():s(g)};let d=e;const r=Math.floor(d/1e7);d%=1e7;const o=Math.floor(d/1e5);d%=1e5;const l=Math.floor(d/1e3);d%=1e3;const c=d,u=[];return r&&u.push(`${s(r)} Crore`),o&&u.push(`${s(o)} Lakh`),l&&u.push(`${s(l)} Thousand`),c&&u.push(i(c)),u.join(" ").trim()};window.app_printSalarySlip=function(){const n=document.getElementById("salary-slip-modal");if(!n)return;const e=n.querySelector(".salary-slip-print-root");e&&(document.body.classList.add("salary-slip-print-mode"),e.classList.add("print-active"),setTimeout(()=>{window.print(),setTimeout(()=>{e.classList.remove("print-active"),document.body.classList.remove("salary-slip-print-mode")},150)},60))};window.app_generateSalarySlip=async function(n){try{const e=document.querySelector(`tr[data-user-id="${n}"]`);if(!e){alert("Unable to locate salary row for this user.");return}const t=await window.AppDB.get("users",n);if(!t){alert("User details not found.");return}const a=new Date,s=window.app_getSalaryPayPeriodInfo(),i=s.label,d=Se(s.startDate),r=Se(s.endDate),o=document.getElementById("salary-pay-date")?.value||"",l=Se(o||a),c=An(a),u=`CRWI-${s.key.replace(/[^a-zA-Z0-9]/g,"")}-${n}-${String(a.getTime()).slice(-5)}`,m=Number(e.querySelector(".base-salary-input")?.value||0),p=Number(e.querySelector(".salary-input")?.value||0),g=Number(e.querySelector(".tds-input")?.value||0),h=Number(e.querySelector(".tds-amount")?.dataset?.value||"0"),f=Number(e.querySelector(".final-net-salary")?.dataset?.value||"0"),w=Number(String(e.querySelector(".attendance-deduction-amount")?.innerText||"0").replace(/[^0-9.-]+/g,""))||0,v=pa(e),b=v.rawLateDeductionDays,k=v.penaltyOffsetDays,y=v.lateDeductionDays,S=v.deductionDays,_=v.unpaidLeaves,T=v.lateCount,L=String(e.querySelector(".comment-input")?.value||"").trim(),I=Number(e.querySelector(".other-allowances-input")?.value||t.otherAllowances||0),U=m+I,M=Number(e.querySelector(".loan-advance-input")?.value||t.loanAdvance||0),A=Number(e.querySelector(".pf-input")?.value||t.providentFund||0),N=Number(e.querySelector(".professional-tax-input")?.value||t.professionalTax||0),E=String(e.querySelector(".join-date-input")?.value||t.joinDate||"").trim(),P=String(e.querySelector(".employee-id-input")?.value||t.employeeId||"").trim(),B=E?P||Ve(E,t.id):"NA",F=String(e.querySelector(".designation-input")?.value||t.designation||t.role||"").trim(),W=String(e.querySelector(".department-input")?.value||t.dept||t.department||"").trim(),z=String(e.querySelector(".join-date-input")?.value||t.joinDate||"").trim(),V=String(e.querySelector(".bank-name-input")?.value||t.bankName||"").trim(),$=String(e.querySelector(".bank-account-input")?.value||t.bankAccount||t.accountNumber||"").trim(),C=String(e.querySelector(".pan-input")?.value||t.pan||t.PAN||"").trim(),j=String(e.querySelector(".uan-input")?.value||t.uan||t.UAN||"").trim(),K=w+h+M+A+N,J=`${Cn(f)} Rupees Only`,G=[{label:"Attendance Deduction",amount:w,remarks:`Unpaid Leaves: ${_}, Late Count: ${T}, Late Raw: ${b.toFixed(1)}, Offset: ${k.toFixed(1)}, Late Deduction: ${y.toFixed(1)}, Total Deduction Days: ${S.toFixed(1)}`},{label:"TDS",amount:h,remarks:`Applied at ${g.toFixed(2)}%`},{label:"Provident Fund",amount:A,remarks:A?"Configured as per employee profile":"NA"},{label:"Professional Tax",amount:N,remarks:N?"Configured as per employee profile":"NA"},{label:"Loan / Advance",amount:M,remarks:M?"Recovered in this cycle":"Nil"}],ee=ne=>kn(ne),le=`
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
                                <div>Pay Period: ${i} (${d} to ${r})</div>
                                <div>Pay Date: ${l}</div>
                            </div>

                            <div class="salary-slip-section">
                                <h4>Employee Details</h4>
                                <div class="salary-slip-grid">
                                    <div><b>Employee Name:</b> ${t.name||"Staff"}</div>
                                    <div><b>Employee ID:</b> ${B||"NA"}</div>
                                    <div><b>Designation:</b> ${F||"NA"}</div>
                                    <div><b>Department:</b> ${W||"NA"}</div>
                                    <div><b>Date of Joining:</b> ${Se(z)}</div>
                                    <div><b>Bank Name:</b> ${V||"NA"}</div>
                                    <div><b>UAN:</b> ${Qe(j)}</div>
                                    <div><b>PAN:</b> ${Qe(C)}</div>
                                    <div><b>Bank A/C:</b> ${Qe($)}</div>
                                </div>
                            </div>

                            <div class="salary-slip-split">
                                <div class="salary-slip-section">
                                    <h4>Earnings</h4>
                                    <table class="salary-slip-table">
                                        <tr><td>Basic Salary</td><td>${ee(m)}</td></tr>
                                        <tr><td>HRA</td><td>NA</td></tr>
                                        <tr><td>Conveyance Allowance</td><td>NA</td></tr>
                                        <tr><td>Special Allowance</td><td>NA</td></tr>
                                        <tr><td>Other Allowances</td><td>${ee(I)}</td></tr>
                                        <tr class="total"><td>Gross Earnings</td><td>${ee(U)}</td></tr>
                                    </table>
                                </div>
                                <div class="salary-slip-section">
                                    <h4>Deductions (Breakdown)</h4>
                                    <table class="salary-slip-table">
                                        ${G.map(ne=>`<tr><td>${ne.label}<div class="remark">${ne.remarks}</div></td><td>${ne.amount?ee(ne.amount):"NA"}</td></tr>`).join("")}
                                        <tr class="total"><td>Total Deductions</td><td>${ee(K)}</td></tr>
                                    </table>
                                </div>
                            </div>

                            <div class="salary-slip-net">
                                <div><b>Adjusted Salary:</b> ${ee(p)}</div>
                                <div><b>Net Salary:</b> ${ee(f)}</div>
                                <div><b>Net Salary in Words:</b> ${J}</div>
                            </div>

                            <div class="salary-slip-footer">
                                <div>This is a system-generated salary slip and does not require a signature.</div>
                                <div>Generated: ${c} | Payroll Ref ID: ${u}</div>
                                ${L?`<div>Payroll Comment: ${L}</div>`:""}
                            </div>
                        </div>
                    </div>
                </div>
            `;window.app_showModal(le,"salary-slip-modal")}catch(e){console.error("Salary slip generation failed:",e),alert(`Failed to generate salary slip: ${e.message}`)}};window.app_editTaskStatus=async function(n,e,t){try{const a=window.AppAuth.getUser(),s=t==="completed"?new Date().toISOString().split("T")[0]:null;await window.AppCalendar.updateTaskStatus(n,e,t,s);const i=document.getElementById("page-content");i.innerHTML=await O.renderDashboard(),alert(`Task status updated to: ${t}`)}catch(a){console.error("Failed to update task status:",a),alert("Failed to update task status. Please try again.")}};window.app_reassignTask=async function(n,e,t){try{const a=window.AppAuth.getUser();if(a.role!=="Administrator"&&!a.isAdmin){alert("Only administrators can reassign tasks.");return}await window.AppCalendar.reassignTask(n,e,t);const s=document.getElementById("page-content");s.innerHTML=await O.renderDashboard(),alert("Task reassigned successfully!")}catch(a){console.error("Failed to reassign task:",a),alert("Failed to reassign task. Please try again.")}};window.app_viewTaskDetails=async function(n,e){try{const t=await window.AppDB.get("work_plans",n);if(!t||!t.plans||!t.plans[e]){alert("Task not found.");return}const a=t.plans[e],s=window.AppCalendar.getSmartTaskStatus(t.date,a.status),i={"to-be-started":"#3b82f6","in-process":"#eab308",completed:"#22c55e",overdue:"#ef4444","not-completed":"#6b7280"},d={"to-be-started":"🔵 To Be Started","in-process":"🟡 In Process",completed:"🟢 Completed",overdue:"🔴 Overdue","not-completed":"⚫ Not Completed"},r=`
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
                                        ${d[s]}
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
                                        ${a.subPlans.map(o=>`<li>${o}</li>`).join("")}
                                    </ul>
                                </div>
                            `:""}
                        </div>
                        
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="document.getElementById('task-details-modal').remove()" class="action-btn" style="flex: 1;">Close</button>
                        </div>
                    </div>
                </div>
            `;document.getElementById("modal-container").innerHTML=r}catch(t){console.error("Failed to view task details:",t),alert("Failed to load task details.")}};window.app_recalculateRatings=async function(){try{const n=window.AppAuth.getUser();if(n.role!=="Administrator"&&!n.isAdmin){alert("Only administrators can recalculate ratings.");return}if(!await window.appConfirm("This will recalculate ratings for all users. Continue?"))return;const e=await window.AppRating.updateAllRatings();alert(`Successfully updated ratings for ${e.length} users!`);const t=document.getElementById("page-content");t.innerHTML=await O.renderDashboard()}catch(n){console.error("Failed to recalculate ratings:",n),alert("Failed to recalculate ratings. Please try again.")}};window.app_triggerManualAudit=async()=>{if(!await window.appConfirm("Trigger a manual location audit for all active staff?"))return;const n=`Manual Audit @ ${new Date().toLocaleTimeString()}`;try{await window.AppDB.add("system_commands",{type:"audit",slotName:n,timestamp:Date.now(),requestedBy:window.AppAuth.getUser()?.name||"Admin",status:"pending"}),alert("Manual audit command sent. All active staff devices will now perform a stealth check.")}catch(e){console.error("Failed to trigger manual audit:",e),alert("Error: "+e.message)}};window.app_applyAuditFilter=async()=>{const n=document.getElementById("audit-start")?.value,e=document.getElementById("audit-end")?.value,t=document.getElementById("page-content");t&&(t.innerHTML=await O.renderAdmin(n,e),window.AppAnalytics&&window.AppAnalytics.initAdminCharts())};window.app_exportAudits=async()=>{const n=document.getElementById("audit-start")?.value,e=document.getElementById("audit-end")?.value;try{let t=await window.AppDB.getAll("location_audits");if(n&&e&&(t=t.filter(l=>{const c=new Date(l.timestamp).toISOString().split("T")[0];return c>=n&&c<=e})),t.sort((l,c)=>c.timestamp-l.timestamp),t.length===0){alert("No audits found for the selected range.");return}const a=["Timestamp","Date","Time","Staff Member","Slot","Status","Latitude","Longitude"],s=t.map(l=>[l.timestamp,new Date(l.timestamp).toLocaleDateString(),new Date(l.timestamp).toLocaleTimeString(),l.userName||"Unknown",l.slot,l.status,l.lat||"",l.lng||""]),i=[a,...s].map(l=>l.join(",")).join(`
`),d=new Blob([i],{type:"text/csv;charset=utf-8;"}),r=document.createElement("a"),o=URL.createObjectURL(d);r.setAttribute("href",o),r.setAttribute("download",`security_audits_${n||"export"}.csv`),r.style.visibility="hidden",document.body.appendChild(r),r.click(),document.body.removeChild(r)}catch(t){console.error("Export failed:",t),alert("Export failed: "+t.message)}};window.app_changeAnnualYear=n=>{window.app_annualYear=(window.app_annualYear||new Date().getFullYear())+n,window.app_renderAnnualPlanPage()};window.app_toggleAnnualLegendFilter=n=>{const e=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0,overdue:!0,completed:!0};Object.prototype.hasOwnProperty.call(e,n)&&(e[n]=!e[n],window.app_annualLegendFilters=e,window.app_renderAnnualPlanPage())};window.app_showAnnualDayDetails=async n=>{if(!n)return;const e=window._currentPlans||await window.AppCalendar.getPlans(),t=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0},a=window.AppAuth.getUser()||{},s=a.role==="Administrator"||a.isAdmin,i=(window.app_getDayEvents(n,e,{includeAuto:!1,userId:s?null:a.id})||[]).filter(o=>o.type==="leave"?!!t.leave:o.type==="work"?!!t.work:(o.type==="holiday",!!t.event)),d=i.length?i.map(o=>{const l=o.type||"event",c=l==="leave"?"background:#fee2e2;color:#991b1b;":l==="work"?"background:#e0e7ff;color:#3730a3;":l==="holiday"?"background:#f1f5f9;color:#334155;":"background:#dcfce7;color:#166534;",u=l==="work"&&Array.isArray(o.plans)&&o.plans.length?`<ul style="margin:0.5rem 0 0 1rem; padding:0; color:#475569; font-size:0.8rem;">
                    ${o.plans.map(m=>`<li>${window.app_formatTaskWithPostponeChip(m.task||"Work plan item")}</li>`).join("")}
                   </ul>`:"";return`
                <div class="annual-v2-detail-item" style="border:1px solid #eef2f7; border-radius:12px; padding:0.75rem;">
                    <div class="annual-v2-detail-item-head" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                        <span class="annual-v2-detail-tag" style="padding:2px 8px; border-radius:999px; font-size:0.7rem; font-weight:700; ${c}">${l.toUpperCase()}</span>
                        <div class="annual-v2-detail-title" style="font-size:0.9rem; color:#1f2937; font-weight:600;">${o.title||"Event"}</div>
                    </div>
                    ${u}
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
                        ${d}
                    </div>
                </div>
            </div>`;window.app_showModal(r,"annual-day-detail-modal")};window.app_toggleAnnualView=n=>{window.app_annualViewMode=n,window.app_renderAnnualPlanPage()};window.app_jumpToAnnualToday=()=>{const n=new Date;window.app_annualYear=n.getFullYear(),window.app_selectedAnnualDate=n.toISOString().split("T")[0],window.app_renderAnnualPlanPage().then(()=>{window.app_showAnnualDayDetails(window.app_selectedAnnualDate)})};window.app_renderAnnualPlanPage=async()=>{const n=document.getElementById("page-content");n&&(n.innerHTML=await O.renderAnnualPlan())};window.app_setAnnualStaffFilter=n=>{window.app_annualStaffFilter=String(n||"").trim(),window.app_renderAnnualPlanPage()};window.app_setAnnualListSearch=n=>{window.app_annualListSearch=String(n||"").trim(),window.app_renderAnnualPlanPage()};window.app_setAnnualListSort=n=>{window.app_annualListSort=String(n||"date-asc").trim(),window.app_renderAnnualPlanPage()};window.app_renderTimesheetPage=async()=>{const n=document.getElementById("page-content");n&&(n.innerHTML=await O.renderTimesheet())};window.app_setTimesheetView=n=>{window.app_timesheetViewMode=n==="calendar"?"calendar":"list",window.app_renderTimesheetPage()};window.app_changeTimesheetMonth=n=>{const e=new Date,t=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:e.getMonth(),a=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:e.getFullYear(),s=new Date(a,t,1);s.setMonth(s.getMonth()+n),window.app_timesheetMonth=s.getMonth(),window.app_timesheetYear=s.getFullYear(),window.app_renderTimesheetPage()};window.app_jumpTimesheetToday=()=>{const n=new Date;window.app_timesheetMonth=n.getMonth(),window.app_timesheetYear=n.getFullYear(),window.app_renderTimesheetPage()};window.app_closeModal=n=>{const e=n&&n.closest?n.closest(".modal-overlay"):null;e&&e.remove()};window.app_getSystemUpdateNotes=()=>[{date:"2026-02-21",summary:"Check for System Update now shows this quick update popup before refreshing."},{date:"2026-02-21",summary:"The update action shortcut was changed from Ctrl+F5 to Ctrl+Shift+R."}];window.app_showSystemUpdatePopup=()=>{const n="system-update-modal",e=be(),t=(window.app_getSystemUpdateNotes()||[]).slice(0,5),a=t.length?t.map(o=>`
                <li style="margin:0 0 0.7rem 0; color:#334155; line-height:1.45;">
                    <span style="display:block; font-size:0.72rem; color:#64748b; font-weight:700;">${X(o.date||"")}</span>
                    <span>${X(o.summary||"")}</span>
                </li>
            `).join(""):'<li style="color:#64748b;">No update notes available.</li>',s=e.active?`
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0.6rem 0.75rem; margin-bottom:0.8rem;">
                    <div style="font-size:0.78rem; font-weight:700; color:#0f172a;">Update detected</div>
                    <div style="font-size:0.74rem; color:#475569; margin-top:0.15rem;">
                        Commit: ${X((e.commitSha||"").slice(0,7)||e.releaseId)}
                        ${e.deployedAt?` • Deployed: ${X(e.deployedAt)}`:""}
                    </div>
                    <div style="font-size:0.78rem; color:#b45309; font-weight:700; margin-top:0.35rem;">
                        Auto-refresh in <span id="system-update-countdown">${e.countdownLabel}</span>
                    </div>
                </div>
            `:"",i=`
            <div class="modal-overlay" id="${n}" style="display:flex;">
                <div class="modal-content" style="max-width:560px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.8rem;">
                        <h3 style="margin:0; font-size:1.1rem;">System Updates</h3>
                        <button type="button" onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">&times;</button>
                    </div>
                    ${s}
                    <p style="margin:0 0 0.8rem 0; color:#64748b; font-size:0.86rem;">Recent functionality changes</p>
                    <ul style="margin:0; padding-left:1rem; max-height:260px; overflow:auto;">
                        ${a}
                    </ul>
                    <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem;">
                        ${e.active&&e.canSnooze?'<button type="button" class="action-btn secondary" onclick="window.app_snoozeReleaseUpdate()">Snooze 5 min</button>':""}
                        <button type="button" class="action-btn secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                        <button type="button" class="action-btn" onclick="this.closest('.modal-overlay').remove(); window.app_forceRefresh();">Update now (Ctrl+Shift+R)</button>
                    </div>
                </div>
            </div>
        `;window.app_showModal(i,n);const d=()=>{const o=document.getElementById("system-update-countdown");if(!o)return;const l=be();o.textContent=l.countdownLabel};d();const r=setInterval(()=>{if(!document.getElementById(n)){clearInterval(r);return}d()},1e3)};window.app_forceRefresh=async()=>{Xt(!0);try{if(navigator.serviceWorker){const n=await navigator.serviceWorker.getRegistrations();await Promise.all(n.map(e=>e.unregister()))}if(window.caches){const n=await caches.keys();await Promise.all(n.map(e=>caches.delete(e)))}}catch(n){console.warn("Force refresh cleanup failed:",n)}window.location.reload(!0)};gn();console.log("App.js Loaded & Globals Ready");
