(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=t(i);fetch(i.href,s)}})();const C={WORK_START_TIME:"09:00",LATE_CUTOFF_TIME:"09:15",WORK_END_TIME:"17:00",LATE_CUTOFF_MINUTES:555,MINOR_LATE_END_MINUTES:615,LATE_END_MINUTES:720,POST_NOON_END_MINUTES:810,AFTERNOON_START_MINUTES:720,EARLY_DEPARTURE_MINUTES:1020,FY_START_MONTH:3,IS_SATURDAY_OFF:a=>{const t=new Date(a).getDate(),n=Math.ceil(t/7);return n===2||n===4},LATE_GRACE_COUNT:3,LATE_DEDUCTION_PER_BLOCK:.5,EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4,READ_CACHE_TTLS:{users:6e4,settings:3e5,minutes:3e4,attendanceSummary:3e4,staffMessages:2e4,dailySummaryReadMs:6e4},READ_OPT_FLAGS:{FF_READ_OPT_DB_QUERIES:!0,FF_READ_OPT_TARGETED_REALTIME:!0,FF_READ_OPT_ANALYTICS_CACHE:!0,FF_SHARED_DAILY_SUMMARY:!0,FF_SUMMARY_LOCKING:!0,ENABLE_SIMULATION_MODULE:!1,ENABLE_READ_TELEMETRY:!0,ENABLE_PRESENCE_HEARTBEAT:!1},SUMMARY_POLICY:{STALENESS_MS:1440*60*1e3,TEAM_ACTIVITY_LIMIT:15,LOCK_TTL_MS:9e4,SCHEMA_VERSION:2,RECOMPUTE_CUTOFF_HOUR_IST:17,FALLBACK_TO_PREVIOUS_DAY:!0},HERO_POLICY:{SCHEMA_VERSION:2,WINDOW_DAYS:7,FALLBACK_LOOKBACK_DAYS:90,WEIGHTS:{taskExecution:.45,taskCompletionRate:.2,taskInProgressSupport:.1,taskMissPenalty:.1},ATTENDANCE_MODIFIER:{base:.9,maxBonus:.15,consistencyImpact:.65,effortImpact:.35},CAPS:{hours:40,qualityChars:500},DEFAULT_ACTIVITY_SCORE:70,MIN_EVIDENCE:{minDays:1,minDurationMs:1,minPlannedTasks:1}},SIMULATION_POLICY:{LEGACY_DUMMY_CLEANUP:{ENABLED:!0,FLAG_KEY:"legacy_dummy_cleanup_v1",TARGET_USER_IDS:["sim_punctual","sim_admin_new"],TARGET_USERNAMES:["jomit_p","maria"],AUDIT_COLLECTION:"system_audit_logs"}}},gn={apiKey:"AIzaSyC7a8AxukI0-egXimYTedwCa2RFnMTBu84",authDomain:"crwiattendance.firebaseapp.com",projectId:"crwiattendance",storageBucket:"crwiattendance.firebasestorage.app",messagingSenderId:"462155106938",appId:"1:462155106938:web:18291b04a5a3bec185c9c3",measurementId:"G-X6W45TV4QR"};typeof firebase<"u"&&!firebase.apps.length&&(firebase.initializeApp(gn),console.log("Firebase Initialized (Compat Mode)"));const ba=typeof firebase<"u"?firebase.firestore():null;typeof window<"u"&&(window.AppFirestore=ba);class wn{constructor(){this.db=ba,this.cache=new Map,this.telemetry={get:0,getAll:0,query:0,queryMany:0,listen:0,listenQuery:0,writes:0,docsRead:0,byCollection:{}}}async init(){if(!this.db){console.error("Firebase not initialized! Check config.");return}console.log("Firestore adapter ready.")}getFlags(){return C&&C.READ_OPT_FLAGS||{}}track(e,t,n=0){this.getFlags().ENABLE_READ_TELEMETRY&&(typeof this.telemetry[e]=="number"&&(this.telemetry[e]+=1),this.telemetry.docsRead+=Math.max(0,Number(n)||0),this.telemetry.byCollection[t]||(this.telemetry.byCollection[t]={ops:0,docsRead:0}),this.telemetry.byCollection[t].ops+=1,this.telemetry.byCollection[t].docsRead+=Math.max(0,Number(n)||0))}getReadTelemetry(){return JSON.parse(JSON.stringify(this.telemetry))}clearReadTelemetry(){this.telemetry={get:0,getAll:0,query:0,queryMany:0,listen:0,listenQuery:0,writes:0,docsRead:0,byCollection:{}}}getCacheKey(e,t,n={}){return`${e}:${t}:${JSON.stringify(n)}`}invalidateCollectionCache(e){const t=`:${e}:`;for(const n of this.cache.keys())n.includes(t)&&this.cache.delete(n)}async getCached(e,t,n){const i=Date.now(),s=this.cache.get(e);if(s&&s.expiresAt>i)return s.value;const o=await n();return this.cache.set(e,{value:o,expiresAt:i+Math.max(0,Number(t)||0)}),o}async getOrGenerateSummary(e,t,n){if(!e||typeof t!="function")throw new Error("getOrGenerateSummary requires a key and generator function.");const i=this.getCacheKey("summary","computed",{summaryKey:e}),s=typeof n=="number"?n:C?.READ_CACHE_TTLS?.attendanceSummary||3e4;return this.getCached(i,s,t)}async sleep(e){return new Promise(t=>setTimeout(t,Math.max(0,Number(e)||0)))}getSummarySchemaVersion(){return Number(C?.SUMMARY_POLICY?.SCHEMA_VERSION||1)}getIstNow(){const e=new Date;return new Date(e.toLocaleString("en-US",{timeZone:"Asia/Kolkata"}))}toDateKey(e){const t=e instanceof Date?e:new Date(e),n=t.getFullYear(),i=String(t.getMonth()+1).padStart(2,"0"),s=String(t.getDate()).padStart(2,"0");return`${n}-${i}-${s}`}getISTDateKeys(){const e=this.getIstNow(),t=new Date(e);return t.setDate(t.getDate()-1),{todayKey:this.toDateKey(e),yesterdayKey:this.toDateKey(t)}}shouldRecomputeNowIST(e){const t=Number.isFinite(Number(e))?Number(e):Number(C?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST||17);return this.getIstNow().getHours()>=Math.max(0,Math.min(23,t))}isSummaryFresh(e,t){if(!e||typeof e!="object")return!1;const n=Number(e.generatedAt||0),i=Number(e.version||0);return!n||!i||i!==this.getSummarySchemaVersion()?!1:Date.now()-n<=Math.max(0,Number(t)||0)}async getDailySummary(e){const t=String(e||"").trim();if(!t)return null;const n=C?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4,i=this.getCacheKey("dailySummary","daily_summaries",{key:t});return this.getCached(i,n,()=>this.get("daily_summaries",t))}listenDailySummary(e,t){const n=String(e||"").trim();if(!n)return null;const i=this.getCacheKey("dailySummary","daily_summaries",{key:n});return this.listenDoc("daily_summaries",n,(s,o)=>{if(s){const r=C?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4;this.cache.set(i,{value:s,expiresAt:Date.now()+r})}t&&t(s,o)})}async getSummaryByDateKey(e){return this.getDailySummary(e)}async getLatestSuccessfulSummaryMeta(){const e=C?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4,t=this.getCacheKey("dailySummaryMeta","daily_summaries_meta",{key:"latest_success"});return this.getCached(t,e,()=>this.get("daily_summaries_meta","latest_success"))}async setLatestSuccessfulSummaryMeta({dateKey:e,generatedAt:t,version:n}={}){const i=String(e||"").trim();if(!i)return;const s={id:"latest_success",dateKey:i,generatedAt:Number(t||Date.now()),version:Number(n||this.getSummarySchemaVersion())};await this.put("daily_summaries_meta",s)}async getDailySummaryWithFallback({todayKey:e,yesterdayKey:t,staleAfterMs:n}={}){const i=Math.max(1e3,Number(n)||Number(C?.SUMMARY_POLICY?.STALENESS_MS)||864e5),s=C?.SUMMARY_POLICY?.FALLBACK_TO_PREVIOUS_DAY!==!1,o=await this.getSummaryByDateKey(e);if(this.isSummaryFresh(o,i))return{summary:o,source:"today"};if(s){const l=await this.getSummaryByDateKey(t);if(l&&typeof l=="object")return{summary:l,source:"yesterday"}}const r=await this.getLatestSuccessfulSummaryMeta(),d=String(r?.dateKey||"").trim();if(d){const l=await this.getSummaryByDateKey(d);if(l&&typeof l=="object")return{summary:l,source:"latest_success"}}return{summary:o||null,source:"none"}}async putDailySummary(e,t={}){const n=String(e||"").trim();if(!n)throw new Error("putDailySummary requires dateKey.");const i={id:n,dateKey:n,version:this.getSummarySchemaVersion(),...t};return this.put("daily_summaries",i)}async acquireSummaryLock(e,t,n){const i=String(e||"").trim(),s=String(t||"").trim();if(!i||!s||!this.db||!this.db.runTransaction)return!1;if(C?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING===!1)return!0;const o=Math.max(1e3,Number(n)||Number(C?.SUMMARY_POLICY?.LOCK_TTL_MS)||9e4),r=this.db.collection("summary_locks").doc(i),d=Date.now();try{return await this.db.runTransaction(async c=>{const p=await c.get(r);if(p.exists){const m=p.data()||{},u=String(m.ownerId||"");if(Number(m.expiresAt||0)>d&&u&&u!==s)return!1}return c.set(r,{id:i,dateKey:i,ownerId:s,createdAt:d,expiresAt:d+o},{merge:!0}),!0})===!0}catch(l){return console.warn("Failed to acquire summary lock:",l),!1}}async releaseSummaryLock(e,t){const n=String(e||"").trim(),i=String(t||"").trim();if(!n||!i||!this.db||!this.db.runTransaction||C?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING===!1)return;const s=this.db.collection("summary_locks").doc(n);try{await this.db.runTransaction(async o=>{const r=await o.get(s);if(!r.exists)return;const d=r.data()||{};String(d.ownerId||"")===i&&o.delete(s)})}catch(o){console.warn("Failed to release summary lock:",o)}}async getOrCreateDailySummary({dateKey:e,yesterdayKey:t,generatorFn:n,staleAfterMs:i,lockTtlMs:s}={}){const o=this.getISTDateKeys(),r=String(e||o.todayKey||"").trim(),d=String(t||o.yesterdayKey||"").trim();if(!r||typeof n!="function")throw new Error("getOrCreateDailySummary requires dateKey and generatorFn.");const l=Math.max(1e3,Number(i)||Number(C?.SUMMARY_POLICY?.STALENESS_MS)||864e5),c=Math.max(1e3,Number(s)||Number(C?.SUMMARY_POLICY?.LOCK_TTL_MS)||9e4),p=String(window.AppAuth?.getUser?.()?.id||`anon_${Math.random().toString(36).slice(2,10)}`),m=await this.getDailySummaryWithFallback({todayKey:r,yesterdayKey:d,staleAfterMs:l});if(m.summary&&m.source==="today"&&this.isSummaryFresh(m.summary,l))return{...m.summary,_source:"shared_today"};if(!this.shouldRecomputeNowIST(C?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST))return m.summary?{...m.summary,_source:`fallback_${m.source}`}:null;if(await this.acquireSummaryLock(r,p,c))try{const y={...await n()||{},generatedAt:Date.now(),generatedBy:p,version:this.getSummarySchemaVersion()};return await this.putDailySummary(r,y),await this.setLatestSuccessfulSummaryMeta({dateKey:r,generatedAt:y.generatedAt,version:y.version}),{dateKey:r,...y,_source:"generated"}}finally{await this.releaseSummaryLock(r,p)}const f=[350,700,1200,1800];for(const g of f){await this.sleep(g);const y=await this.getDailySummary(r);if(this.isSummaryFresh(y,l))return{...y,_source:"shared"}}return m.summary?{...m.summary,_source:`fallback_${m.source}`}:null}applyFilters(e,t=[]){let n=e;return(t||[]).forEach(i=>{!i||!i.field||!i.operator||(n=n.where(i.field,i.operator,i.value))}),n}applyOptions(e,t={}){let n=e;return t.orderBy&&(Array.isArray(t.orderBy)?t.orderBy:[t.orderBy]).forEach(s=>{s&&(typeof s=="string"?n=n.orderBy(s):s.field&&(n=n.orderBy(s.field,s.direction||"asc")))}),t.limit&&(n=n.limit(t.limit)),t.startAt!==void 0&&(n=n.startAt(t.startAt)),t.endAt!==void 0&&(n=n.endAt(t.endAt)),n}isPermissionDenied(e){const t=String(e?.code||"").toLowerCase(),n=String(e?.message||"").toLowerCase();return t.includes("permission-denied")||n.includes("missing or insufficient permissions")}async getAll(e,t={}){try{const i=(await this.db.collection(e).get()).docs.map(s=>({...s.data(),id:s.id}));return this.track("getAll",e,i.length),i}catch(n){if(t?.silentPermissionDenied&&this.isPermissionDenied(n))return[];throw console.error(`Error getting all from ${e}:`,n),n}}async get(e,t){if(!t)return null;try{const n=String(t),s=await this.db.collection(e).doc(n).get();return s.exists?(this.track("get",e,1),{...s.data(),id:s.id}):(this.track("get",e,0),null)}catch(n){throw console.error(`Error getting ${t} from ${e}:`,n),n}}async add(e,t){if(t.id)return this.put(e,t);try{const n=await this.db.collection(e).add(t);return this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"add"}})),n.id}catch(n){throw console.error(`Error adding to ${e}:`,n),n}}async put(e,t){if(!t.id)throw new Error("Item must have an ID for 'put' operation.");try{const n=String(t.id);return await this.db.collection(e).doc(n).set(t,{merge:!0}),this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"put"}})),n}catch(n){throw console.error(`Error putting ${t.id} to ${e}:`,n),n}}async delete(e,t){if(t)try{const n=String(t);await this.db.collection(e).doc(n).delete(),this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"delete"}}))}catch(n){throw console.error(`Error deleting ${t} from ${e}:`,n),n}}async query(e,t,n,i){try{const o=(await this.db.collection(e).where(t,n,i).get()).docs.map(r=>({...r.data(),id:r.id}));return this.track("query",e,o.length),o}catch(s){throw console.error(`Error querying ${e}:`,s),s}}async queryMany(e,t=[],n={}){if(!this.getFlags().FF_READ_OPT_DB_QUERIES)return this.getAll(e);try{let s=this.db.collection(e);s=this.applyFilters(s,t),s=this.applyOptions(s,n);const r=(await s.get()).docs.map(d=>({...d.data(),id:d.id}));return this.track("queryMany",e,r.length),r}catch(s){return console.warn(`queryMany failed for ${e}, falling back to getAll`,s),this.getAll(e)}}async getManyByIds(e,t=[]){const n=Array.from(new Set((t||[]).filter(Boolean).map(o=>String(o))));if(!n.length)return[];const i=[];for(let o=0;o<n.length;o+=10)i.push(n.slice(o,o+10));return(await Promise.all(i.map(async o=>{try{const r=await this.queryMany(e,[{field:"id",operator:"in",value:o}]);return r&&r.length?r:Promise.all(o.map(d=>this.get(e,d)))}catch{return Promise.all(o.map(r=>this.get(e,r)))}}))).flat().filter(Boolean)}listenDoc(e,t,n){if(!this.db||!t)return null;const i=String(t);try{return this.db.collection(e).doc(i).onSnapshot(s=>{const o=s.exists?{...s.data(),id:s.id}:null;this.track("listen",e,1),n(o,s)},s=>{console.error(`Realtime listener error in ${e}/${i}:`,s)})}catch(s){return console.error(`Error setting up listener for ${e}/${i}:`,s),null}}listenQuery(e,t=[],n={},i){if(!this.db)return null;try{let s=this.db.collection(e);return s=this.applyFilters(s,t),s=this.applyOptions(s,n),s.onSnapshot(o=>{const r=o.docs.map(d=>({...d.data(),id:d.id}));this.track("listenQuery",e,r.length),i(r,o)},o=>{console.error(`Realtime query listener error in ${e}:`,o)})}catch(s){return console.warn(`listenQuery failed for ${e}, falling back to listen`,s),this.listen(e,i)}}listen(e,t){return this.db?this.db.collection(e).onSnapshot(n=>{const i=n.docs.map(s=>({...s.data(),id:s.id}));this.track("listen",e,i.length),t(i,n)},n=>{console.error(`Realtime listener error in ${e}:`,n)}):null}}const K=new wn;typeof window<"u"&&(window.AppDB=K);class vn{constructor(){this.currentUser=null,this.sessionKey="crwi_session_user",this.heartbeatInterval=null,this.userDocUnsubscribe=null}async init(){await K.init();const e=localStorage.getItem(this.sessionKey);e&&(this.currentUser=await K.get("users",e),this.currentUser&&(this.startHeartbeat(),this.startCurrentUserSync()))}async refreshCurrentUserFromDB(){const e=localStorage.getItem(this.sessionKey);if(!e)return this.currentUser=null,null;if(this.userDocUnsubscribe&&this.currentUser&&this.currentUser.id===e)return this.currentUser;const t=await K.get("users",e);return this.currentUser=t||null,this.currentUser}async login(e,t){const n=K.getCached?await K.getCached(K.getCacheKey("authUsers","users",{mode:"login"}),C?.READ_CACHE_TTLS?.users||6e4,()=>K.getAll("users")):await K.getAll("users"),i=e.trim().toLowerCase(),s=t.trim(),o=n.find(r=>{const d=(r.username||"").toLowerCase().trim(),l=(r.email||"").toLowerCase().trim();return(d===i||l===i)&&r.password.trim()===s});return o?(this.currentUser=o,localStorage.setItem(this.sessionKey,o.id),this.startHeartbeat(),this.startCurrentUserSync(),!0):(console.warn("Login failed: invalid credentials."),!1)}async logout(){if(this.currentUser?.status==="in"&&window.AppAttendance?.checkOut)try{const e=await window.AppAttendance.checkOut("System checkout on sign out",null,null,"System checkout on sign out",!1,"",{autoCheckout:!0,autoCheckoutReason:"sign_out"});e&&e.conflict&&console.warn("Logout checkout conflict:",e.message||"state already updated")}catch{if(!(typeof window.confirm=="function"?window.confirm("Unable to save checkout during sign out. Continue sign out anyway?"):!1))return}this.stopHeartbeat(),this.stopCurrentUserSync(),this.currentUser=null,localStorage.removeItem(this.sessionKey),window.location.reload()}getUser(){return this.currentUser}async updateUser(e){const t=await K.get("users",e.id);if(!t)return!1;const n={...t,...e};return e.isAdmin===!0||e.isAdmin==="true"?n.isAdmin=!0:n.isAdmin=!1,n.role=e.role||t.role||"Employee",console.log(`Auth: User ${n.id} update - Role: ${n.role}, Admin: ${n.isAdmin}`),e.name&&e.name!==t.name&&!e.avatar&&(n.avatar=`https://ui-avatars.com/api/?name=${e.name}&background=random&color=fff`),await K.put("users",n),this.currentUser&&this.currentUser.id===n.id&&(this.currentUser=n),!0}startHeartbeat(){if(!(C&&C.READ_OPT_FLAGS||{}).ENABLE_PRESENCE_HEARTBEAT){this.stopHeartbeat();return}this.heartbeatInterval&&clearInterval(this.heartbeatInterval);const t=async()=>{if(this.currentUser&&K)try{await K.put("users",{id:this.currentUser.id,lastSeen:Date.now()})}catch(n){console.warn("Heartbeat update failed:",n)}};t(),this.heartbeatInterval=setInterval(t,12e4),console.log("Presence Heartbeat started.")}stopHeartbeat(){this.heartbeatInterval&&(clearInterval(this.heartbeatInterval),this.heartbeatInterval=null,console.log("Presence Heartbeat stopped."))}startCurrentUserSync(){this.stopCurrentUserSync();const e=localStorage.getItem(this.sessionKey);if(!(!e||!window.AppFirestore))try{this.userDocUnsubscribe=window.AppFirestore.collection("users").doc(String(e)).onSnapshot(t=>{if(!t.exists){this.currentUser=null;return}const n={...t.data(),id:t.id};this.currentUser=n,window.dispatchEvent(new CustomEvent("app:user-sync",{detail:n}))},t=>{console.warn("Current user realtime sync failed:",t)})}catch(t){console.warn("Failed to start current user sync:",t)}}stopCurrentUserSync(){typeof this.userDocUnsubscribe=="function"&&this.userDocUnsubscribe(),this.userDocUnsubscribe=null}}const ae=new vn;typeof window<"u"&&(window.AppAuth=ae);class bn{async getStatus(){const e=await(ae.refreshCurrentUserFromDB?ae.refreshCurrentUserFromDB():ae.getUser());if(!e)return{status:"out",lastCheckIn:null};if(e.status==="in"&&e.lastCheckIn)try{const t=new Date(e.lastCheckIn),n=new Date,i=t.toISOString().split("T")[0],s=n.toISOString().split("T")[0];if(i<s)return{status:"out",lastCheckIn:null,staleSession:!0}}catch(t){console.warn("Date parsing error in getStatus:",t)}return{status:e.status||"out",lastCheckIn:e.lastCheckIn}}async checkIn(e,t,n="Unknown Location"){const i=await(ae.refreshCurrentUserFromDB?ae.refreshCurrentUserFromDB():ae.getUser());if(!i)throw new Error("User not authenticated");let s=!1,o="",r=null,d=null;if(i.status==="in"&&i.lastCheckIn){const c=new Date(i.lastCheckIn),p=new Date,m=`${c.getFullYear()}-${String(c.getMonth()+1).padStart(2,"0")}-${String(c.getDate()).padStart(2,"0")}`,u=`${p.getFullYear()}-${String(p.getMonth()+1).padStart(2,"0")}-${String(p.getDate()).padStart(2,"0")}`;if(m<u)if(await this.hasRecordedCheckoutForSession(i.id,c,p))i.status="out",i.lastCheckIn=null,i.currentLocation=null,i.locationMismatched=!1,o="Recovered previous checkout record and cleared stale session status.";else{const y=new Date(c.getTime()+144e5),k={status:"Half Day",dayCredit:this.getDayCredit("Half Day"),lateCountable:!1},T=i.currentLocation||i.lastLocation||null,S=new Date().toISOString(),A={id:String(Date.now()),user_id:i.id,date:y.toISOString().split("T")[0],checkIn:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:y.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),duration:this.msToTime(144e5),durationMs:144e5,type:k.status,dayCredit:k.dayCredit,lateCountable:k.lateCountable,extraWorkedMs:0,policyVersion:"v2",location:T?.address||"Missed checkout session",lat:T?.lat??null,lng:T?.lng??null,checkOutLocation:"System closure on next check-in",outLat:null,outLng:null,workDescription:"System closure: missed checkout auto-closed as half day. Reason required on next login.",locationMismatched:!1,locationExplanation:"",activityScore:0,autoCheckout:!0,autoCheckoutReason:"missed_checkout_next_login",autoCheckoutAt:S,autoCheckoutRequiresApproval:!1,autoCheckoutExtraApproved:null,missedCheckoutResolved:!0,missedCheckoutPolicy:"half_day_on_missed_checkout",missedCheckoutReasonRequired:!0,missedCheckoutReasonStatus:"pending",missedCheckoutReason:"",missedCheckoutReasonSubmittedAt:null,missedCheckoutReviewedBy:"",missedCheckoutReviewedAt:"",missedCheckoutReviewNote:"",systemClosedAt:S,synced:!1};await K.add("attendance",A),r=A.id,d=A.date,i.status="out",i.lastCheckOut=y.getTime(),i.lastLocation=T,i.lastCheckOutLocation={lat:null,lng:null,address:"System closure on next check-in"},i.locationMismatched=!1,i.lastCheckIn=null,i.currentLocation=null,s=!0,o="Previous open session was closed as half day because checkout was missed. Please submit a reason for admin verification."}else return{ok:!1,conflict:!0,message:"Status updated from another device."}}i.status="in",i.lastCheckIn=Date.now();const l=n&&n!=="Unknown Location"?n:e&&t?`Lat: ${Number(e).toFixed(4)}, Lng: ${Number(t).toFixed(4)}`:"Unknown Location";return i.currentLocation={lat:e,lng:t,address:l},await K.put("users",i),{ok:!0,resolvedMissedCheckout:s,noticeMessage:o,missedCheckoutReasonRequired:s,missedCheckoutLogId:r,missedCheckoutDate:d}}async checkOut(e="",t=null,n=null,i="Detected Location",s=!1,o="",r={}){const d=await(ae.refreshCurrentUserFromDB?ae.refreshCurrentUserFromDB():ae.getUser());if(!d||d.status!=="in")return{ok:!1,conflict:!0,message:"Status updated from another device."};const l=new Date(d.lastCheckIn),c=r.checkOutTime?new Date(r.checkOutTime):new Date,p=c-l,m=this.evaluateAttendanceStatus(l,p),u=window.AppActivity?window.AppActivity.getStats():{score:0},f={id:String(Date.now()),user_id:d.id,date:c.toISOString().split("T")[0],checkIn:l.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),duration:this.msToTime(p),durationMs:p,type:m.status,dayCredit:m.dayCredit,lateCountable:m.lateCountable,extraWorkedMs:m.extraWorkedMs||0,policyVersion:"v2",location:d.currentLocation?.address||"Checked In Location",lat:d.currentLocation?.lat,lng:d.currentLocation?.lng,checkOutLocation:i||(t&&n?`Lat: ${Number(t).toFixed(4)}, Lng: ${Number(n).toFixed(4)}`:"Detected Location"),outLat:t,outLng:n,workDescription:e||"",locationMismatched:s,locationExplanation:o||"",activityScore:u.score,autoCheckout:!!r.autoCheckout,autoCheckoutReason:r.autoCheckoutReason||"",autoCheckoutAt:r.autoCheckoutAt||null,autoCheckoutRequiresApproval:!!r.autoCheckoutRequiresApproval,autoCheckoutExtraApproved:r.autoCheckoutExtraApproved??null,overtimePrompted:!!r.overtimePrompted,overtimeReasonTag:r.overtimeReasonTag||"",overtimeExplanation:r.overtimeExplanation||"",overtimeCappedToEightHours:!!r.overtimeCappedToEightHours,taskUpdates:Array.isArray(r.taskUpdates)?r.taskUpdates:[],entrySource:"checkin_checkout",attendanceEligible:!0,synced:!1};return await K.add("attendance",f),d.status="out",d.lastCheckOut=Date.now(),d.lastLocation=d.currentLocation,d.lastCheckOutLocation={lat:t,lng:n,address:i},d.locationMismatched=s,d.lastCheckIn=null,d.currentLocation=null,await K.put("users",d),window.AppActivity&&window.AppActivity.stop(),{ok:!0,conflict:!1}}async addAdminLog(e,t){const n={id:String(Date.now()),user_id:e,...t,isManualOverride:t.isManualOverride===!0,entrySource:t.entrySource||"admin_override",attendanceEligible:Object.prototype.hasOwnProperty.call(t,"attendanceEligible")?t.attendanceEligible===!0:!0,synced:!1};return await K.add("attendance",n),n}async deleteLog(e){if(e)return await K.delete("attendance",e),!0}async updateLog(e,t){if(!e)return;const n=await K.get("attendance",e);if(!n)throw new Error("Log not found");const i={...n,...t,isManualOverride:Object.prototype.hasOwnProperty.call(t,"isManualOverride")?t.isManualOverride===!0:!!n.isManualOverride,entrySource:t.entrySource||n.entrySource||"admin_override",attendanceEligible:Object.prototype.hasOwnProperty.call(t,"attendanceEligible")?t.attendanceEligible===!0:Object.prototype.hasOwnProperty.call(n,"attendanceEligible")?n.attendanceEligible===!0:!0,id:e};return await K.put("attendance",i),i}async addManualLog(e){const t=ae.getUser();if(!t)return;const n=this.buildDateTime(e.date,e.checkIn),i=this.buildDateTime(e.date,e.checkOut),s=n&&i?i-n:0,o=this.evaluateAttendanceStatus(n||new Date,s),r=String(e.type||"").trim(),d=!r||r==="Manual"?o.status:r,l=Object.prototype.hasOwnProperty.call(e,"attendanceEligible")?e.attendanceEligible===!0:d!=="Work Log",c=l?d:r||"Work Log",p={id:String(Date.now()),user_id:t.id,...e,type:c,durationMs:typeof e.durationMs=="number"?e.durationMs:s,dayCredit:l?typeof e.dayCredit=="number"?e.dayCredit:o.dayCredit:0,lateCountable:l&&(e.lateCountable===!0||c==="Late"),extraWorkedMs:l?typeof e.extraWorkedMs=="number"?e.extraWorkedMs:o.extraWorkedMs||0:0,entrySource:e.entrySource||"staff_manual_work",attendanceEligible:l,synced:!1};return await K.add("attendance",p),p}async getLogs(e=null){const t=e||ae.getUser()?.id;if(!t)return[];try{const n=window.AppFirestore;if(!n)return[];let i=n.collection("attendance");i=i.where("user_id","==",t);const r=(await i.get()).docs.map(c=>({...c.data(),id:c.id})).sort((c,p)=>p.id-c.id).map(c=>((!c.location||c.location==="Unknown Location")&&c.lat&&c.lng&&(c.location=`Lat: ${Number(c.lat).toFixed(4)}, Lng: ${Number(c.lng).toFixed(4)}`),c)),d=new Set,l=r.filter(c=>{const p=`${c.date}|${c.checkIn}`;return d.has(p)?!1:(d.add(p),!0)});try{const c=await K.get("users",t);if(c&&c.status==="in"&&c.lastCheckIn){const p=new Date(c.lastCheckIn),m={id:"active_now",date:p.toLocaleDateString(),checkIn:p.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:"Active Now",duration:"Working...",type:"Office",location:c.currentLocation?.address&&c.currentLocation.address!=="Unknown Location"?c.currentLocation.address:c.currentLocation?.lat&&c.currentLocation?.lng?`Lat: ${Number(c.currentLocation.lat).toFixed(4)}, Lng: ${Number(c.currentLocation.lng).toFixed(4)}`:"Current Session"};l.unshift(m)}}catch(c){console.warn("Could not fetch active status for logs",c)}return l.slice(0,50)}catch(n){return console.warn("Optimized log fetch failed, falling back to simple filter",n),[]}}async getAllLogs(){return await K.getAll("attendance")}msToTime(e){let t=Math.floor(e/6e4%60);return`${Math.floor(e/(1e3*60*60)%24)}h ${t}m`}async hasRecordedCheckoutForSession(e,t,n=new Date){if(!e||!(t instanceof Date)||Number.isNaN(t.getTime()))return!1;try{const i=await K.query("attendance","user_id","==",e);if(!Array.isArray(i)||i.length===0)return!1;const s=300*1e3,o=new Date(t);o.setSeconds(0,0);const r=n instanceof Date&&!Number.isNaN(n.getTime())?n.getTime()+s:Date.now()+s;return i.some(d=>{if(!d||!d.checkOut||d.checkOut==="Active Now"||d.autoCheckout&&d.autoCheckoutReason==="missed_checkout_next_login")return!1;const l=this.buildDateTime(d.date,d.checkIn),c=this.buildDateTime(d.date,d.checkOut);if(!l||!c||c.getTime()<l.getTime())return!1;const p=new Date(l);if(p.setSeconds(0,0),!(Math.abs(p.getTime()-o.getTime())<=s))return!1;const u=c.getTime();return u>=t.getTime()&&u<=r})}catch(i){return console.warn("Failed to verify prior checkout record before auto-closing session:",i),!1}}buildDateTime(e,t){if(!e||!t)return null;const n=String(e).trim(),i=String(t).trim(),s=new Date(`${n}T00:00:00`);if(Number.isNaN(s.getTime()))return null;const o=i.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);if(o){const l=Number(o[1]),c=Number(o[2]),p=Number(o[3]||0);return l<0||l>23||c<0||c>59||p<0||p>59?null:(s.setHours(l,c,p,0),s)}const r=i.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)$/i);if(r){let l=Number(r[1]);const c=Number(r[2]),p=Number(r[3]||0),m=String(r[4]||"").toUpperCase();return l<1||l>12||c<0||c>59||p<0||p>59?null:(l===12&&(l=0),m==="PM"&&(l+=12),s.setHours(l,c,p,0),s)}const d=new Date(`${n}T${i}`);return Number.isNaN(d.getTime())?null:d}normalizeType(e){const t=String(e||"").trim();return!t||t==="Manual"?"Present":t==="Manual/WFH"?"Work - Home":t}getDayCredit(e){const t=this.normalizeType(e);return t==="Half Day"?.5:t==="Absent"?0:t==="Present"||t==="Present (Late Waived)"||t==="Late"||t==="Work - Home"||t==="On Duty"?1:0}evaluateAttendanceStatus(e,t=0){if(!e||Number.isNaN(e.getTime()))return{status:"Absent",dayCredit:0,lateCountable:!1,extraWorkedMs:0};if(e.getDay()===0)return{status:"Present",dayCredit:1,lateCountable:!1,extraWorkedMs:0};const i=e.getHours()*60+e.getMinutes(),s=Math.max(0,t)/(1e3*60*60),o=(typeof C<"u"&&C?C.LATE_CUTOFF_MINUTES:555)||555,r=(typeof C<"u"&&C?C.MINOR_LATE_END_MINUTES:615)||615,d=(typeof C<"u"&&C?C.LATE_END_MINUTES:720)||720,l=(typeof C<"u"&&C?C.POST_NOON_END_MINUTES:810)||810,c=(typeof C<"u"&&C?C.AFTERNOON_START_MINUTES:720)||720;let p="Present",m=!1,u=0;return i>=c?(s>=8?p="Present":s>=4?p="Half Day":p="Absent",s>4&&(u=Math.max(0,t-14400*1e3)),{status:p,dayCredit:this.getDayCredit(p),lateCountable:!1,extraWorkedMs:u}):(i>l?p="Absent":i>d||i>r?p=s>=4?"Half Day":"Absent":i>o?s>=8?p="Present (Late Waived)":(p="Late",m=!0):s>=8?p="Present":s>=4?p="Half Day":p="Absent",{status:p,dayCredit:this.getDayCredit(p),lateCountable:m,extraWorkedMs:u})}calculateStatus(e){return this.evaluateAttendanceStatus(e,480*60*1e3).status}}const Sa=new bn;typeof window<"u"&&(window.AppAttendance=Sa);function $(a){return a==null?"":String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Le(a){return $(a)}function Sn(a){return String(a??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,"\\n").replace(/\r/g,"\\r")}function Ge(a,e="https://via.placeholder.com/24"){return!a||typeof a!="string"?e:a.startsWith("http")||a.startsWith("data:")||a.startsWith("/")||a.startsWith("./")?a:e}function Ft(a){if(!a)return"Never";const e=new Date(a);if(isNaN(e.getTime()))return"Unknown";const t=Math.floor((new Date-e)/1e3);if(t<60)return"just now";let n=t/31536e3;return n>1?Math.floor(n)+" years ago":(n=t/2592e3,n>1?Math.floor(n)+" months ago":(n=t/86400,n>1?Math.floor(n)+" days ago":(n=t/3600,n>1?Math.floor(n)+" hours ago":(n=t/60,n>1?Math.floor(n)+" mins ago":Math.floor(t)+" seconds ago"))))}typeof window<"u"&&(window.safeHtml=$,window.safeAttr=Le,window.safeJsStr=Sn,window.safeUrl=Ge,window.timeAgo=Ft);function kn(a,e=!0){const t=Math.max(0,Math.min(5,Number(a)||0)),n=Math.floor(t),i=t-n>=.5,s=5-n-(i?1:0);let o='<div class="star-rating-display">';for(let r=0;r<n;r++)o+='<i class="fa-solid fa-star star-filled"></i>';i&&(o+='<i class="fa-solid fa-star-half-stroke star-filled"></i>');for(let r=0;r<s;r++)o+='<i class="fa-regular fa-star star-empty"></i>';return e&&(o+=`<span class="star-rating-number">${t.toFixed(1)}</span>`),o+="</div>",o}function ka(a,e=!0){const t=String(a||"to-be-started").toLowerCase();let n="To Be Started",i="fa-circle-dot",s="status-badge-to-be-started";return t==="in-process"||t==="in-progress"?(n="In Progress",i="fa-spinner fa-spin",s="status-badge-in-process"):t==="completed"?(n="Completed",i="fa-circle-check",s="status-badge-completed"):t==="overdue"?(n="Overdue",i="fa-circle-exclamation",s="status-badge-overdue"):(t==="not-completed"||t==="cancelled")&&(n="Not Completed",i="fa-circle-xmark",s="status-badge-not-completed"),`
        <div class="status-badge ${s}">
            ${e?`<i class="fa-solid ${i}"></i>`:""}
            <span>${n}</span>
        </div>
    `}const Gt=a=>{const e=new Date,t=window.AppAuth?.getUser();window.app_calMonth===void 0&&(window.app_calMonth=e.getMonth()),window.app_calYear===void 0&&(window.app_calYear=e.getFullYear());const n=window.app_calYear,i=window.app_calMonth,s=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],o=new Date(n,i,1).getDay(),r=new Date(n,i+1,0).getDate();let d="";for(let l=0;l<o;l++)d+='<div class="cal-day empty"></div>';for(let l=1;l<=r;l++){const c=`${n}-${String(i+1).padStart(2,"0")}-${String(l).padStart(2,"0")}`,p=typeof window.app_getDayEvents=="function"?window.app_getDayEvents(c,a):[],m=p.some(k=>k.type==="leave"),u=p.some(k=>k.type==="event"),f=p.some(k=>k.type==="work"),g=l===e.getDate()&&i===e.getMonth()&&n===e.getFullYear(),y=window.AppAnalytics?window.AppAnalytics.getDayType(new Date(n,i,l)):"Work Day";d+=`
            <div class="cal-day ${g?"today":""} ${m?"has-leave":""} ${u?"has-event":""} ${f?"has-work":""} ${y==="Holiday"?"is-holiday":""} ${y==="Half Day"?"is-half-day":""}" 
                    onclick="window.app_openDayPlan('${c}')" style="cursor:pointer;" title="${y}">
                ${l}
            </div>
        `}return window._currentPlans=a,`
        <div class="card" style="padding: 0.75rem; display:flex; flex-direction:column;">
            <div style="margin-bottom:0.75rem; border-bottom:1px solid #f3f4f6; padding-bottom:0.4rem;">
                    <h4 style="margin:0; color:#1f2937; font-size: 1rem;">Team Schedule</h4>
                    <span style="font-size:0.7rem; color:#6b7280;">Planned Leaves & Events</span>
            </div>

            <div style="margin-bottom:0.6rem; padding-bottom:0.4rem; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:0.4rem;">
                    <button onclick="window.app_changeCalMonth(-1)" style="background:none; border:none; color:#6b7280; cursor:pointer; padding:2px;"><i class="fa-solid fa-chevron-left"></i></button>
                    <div style="text-align:center; min-width:70px;">
                        <h4 style="margin:0; color:#1f2937; font-size:0.9rem;">${s[i]} ${n}</h4>
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
    `},Oe={controllers:new WeakMap,elements:new Set};function Je(){return window.app_staffActivityState||(window.app_staffActivityState={selectedMonth:new Date().toISOString().slice(0,7),sortKey:"date-desc",logs:[],leaveHistoryDate:new Date().toISOString().slice(0,10)}),window.app_staffActivityState.leaveHistoryDate||(window.app_staffActivityState.leaveHistoryDate=new Date().toISOString().slice(0,10)),window.app_staffActivityState}function Aa(a){const e=a?new Date(`${a}T00:00:00`):new Date;if(Number.isNaN(e.getTime()))return Aa(new Date().toISOString().slice(0,10));const t=e.getDay(),n=t===0?-6:1-t,i=new Date(e);i.setDate(e.getDate()+n),i.setHours(0,0,0,0);const s=new Date(i);s.setDate(i.getDate()+6),s.setHours(23,59,59,999);const o=r=>{const d=r.getFullYear(),l=String(r.getMonth()+1).padStart(2,"0"),c=String(r.getDate()).padStart(2,"0");return`${d}-${l}-${c}`};return{start:i,end:s,startKey:o(i),endKey:o(s),label:`${i.toLocaleDateString("en-US",{month:"short",day:"numeric"})} - ${s.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`}}let sa=!1;function An(){sa||typeof document>"u"||(sa=!0,document.addEventListener("click",async a=>{const e=a.target&&a.target.closest?a.target.closest(".dashboard-leave-btn[data-action][data-leave-id]"):null;if(!e)return;a.preventDefault();const t=String(e.dataset.action||""),n=String(e.dataset.leaveId||"");if(n)try{if(t==="export"){window.AppLeaves?.exportLeave&&await window.AppLeaves.exportLeave(n);return}if(t==="comment"){window.AppLeaves?.commentLeave&&await window.AppLeaves.commentLeave(n);return}if(t==="approve"||t==="reject"){const i=t==="approve"?"Approved":"Rejected",s=window.AppAuth?.getUser?.()?.id;if(window.AppLeaves?.updateLeaveStatus&&await window.AppLeaves.updateLeaveStatus(n,i,s),typeof window.app_refreshCurrentPage=="function")await window.app_refreshCurrentPage();else{const o=document.getElementById("page-content");o&&(o.innerHTML=await kt())}}}catch(i){console.error("Dashboard leave action failed:",i)}}))}function Se(a,e={}){const t=a?.state||(a?.user?"winner":"no_eligible_data");if(!a||t!=="winner"){const g=a?.reason||(t==="fetch_error"?"Hero stats are temporarily unavailable.":"No eligible hero data available."),y=t==="fetch_error"?"Fetch Error":"No Eligible Data";return`
            <div class="card dashboard-hero-stats-card hero-slot">
                <div class="dashboard-hero-stats-head">
                    <div class="hero-label-badge">Hero of the Week</div>
                    ${e.generatedAt?`<span class="hero-sync-time" title="Source: ${e.source||a?.source||"unknown"}">Synced ${Ft(e.generatedAt)}</span>`:""}
                </div>
                <div class="dashboard-activity-empty">
                    ${$(g)}
                </div>
                <div class="dashboard-hero-stats-foot">
                    <span class="dashboard-kpi-tag">${y}</span>
                </div>
            </div>`}const{user:n,stats:i}=a,s=Number(i?.taskPlanned??0),o=Number(i?.taskCompleted??0),r=Number(i?.taskInProgress??0),d=Number(i?.taskMissed??0),l=Number(i?.days??0),c=Number(i?.hours??0),p=Number(i?.attendanceFactor??1),m=e.source==="generated",u=Number.isFinite(Number(a?.confidence))?Math.round(Number(a.confidence)*100):0,f=a?.period==="latest_active_window"?"Latest Active Window":"Weekly";return`
        <div class="card dashboard-hero-stats-card hero-slot ${m?"is-new-summary":""}">
            <div class="dashboard-hero-stats-head">
                <div class="hero-label-badge">Hero of the Week</div>
                ${e.generatedAt?`<span class="hero-sync-time" title="Source: ${e.source||a?.source||"unknown"}">Synced ${Ft(e.generatedAt)}</span>`:""}
            </div>
            <div class="dashboard-hero-stats-body">
                <div class="hero-profile">
                    <img src="${Ge(n.avatar)}" alt="${$(n.name)}" class="hero-avatar">
                    <div class="hero-info">
                        <div class="hero-name">${$(n.name)}</div>
                        <div class="hero-role">${$(n.role||"Staff")}</div>
                    </div>
                </div>
                <div class="hero-metrics">
                    <div class="hero-metric">
                        <div class="hero-metric-value">${s}</div>
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
                <span class="dashboard-kpi-tag">${$(f)}</span>
                <span class="dashboard-kpi-tag">Confidence ${u}%</span>
            </div>
        </div>`}function Da(a,e=[],t=null,n=[]){const i=new Date,s=new Date(i);s.setDate(s.getDate()-180);const o=s.toISOString().split("T")[0],r=i.toISOString().split("T")[0],d=t?t.id:window.AppAuth.getUser().id,l=t&&t.name||window.AppAuth.getUser().name;return`
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
                ${xa(a,o,r,d,e,n)}
            </div>
        </div>
    `}function xa(a,e,t,n,i=[],s=[]){const o=new Date(e),r=new Date(t);r.setHours(23,59,59,999);const d=a.filter(y=>{const k=new Date(y.date),T=y.workDescription||(y.location&&!y.location.startsWith("Lat:")?y.location:"Standard Activity");return y._displayDesc=T,y._isCollab=!1,y._sortTime=y.checkOut||"00:00",k>=o&&k<=r}),l=[];i.forEach(y=>{const k=new Date(y.date);if(k<o||k>r)return;y.plans.filter(S=>S.tags&&S.tags.some(A=>A.id===n&&A.status==="accepted")).forEach(S=>{l.push({date:y.date,workDescription:`🤝 Collaborated with ${y.userName}: ${S.task}${S.subPlans&&S.subPlans.length>0?` (Sub-tasks: ${S.subPlans.join(", ")})`:""}`,checkOut:"Planned / Accepted",_displayDesc:`🤝 Collaborated with ${y.userName}: ${S.task}${S.subPlans&&S.subPlans.length>0?` (Sub-tasks: ${S.subPlans.join(", ")})`:""}`,_isCollab:!0,_sortTime:"23:59"})})});const c=[];s.forEach(y=>{(y.actionItems||[]).forEach(k=>{if(k.assignedTo!==n)return;const T=k.dueDate||y.date,S=new Date(T);S<o||S>r||c.push({date:T,workDescription:`📋 Meeting Task: ${k.task} (from ${y.title})`,status:k.status||"pending",checkOut:"Action Item",_displayDesc:`📋 Meeting Task: ${k.task} (from ${y.title})`,_isCollab:!1,_isMinute:!0,_meetingId:y.id,_sortTime:"09:00"})})});const p=[...d,...l,...c].sort((y,k)=>{const T=new Date(k.date)-new Date(y.date);return T!==0?T:k._sortTime.localeCompare(y._sortTime)});if(p.length===0)return'<div class="dashboard-activity-empty">No activity descriptions found.</div>';let m="",u="";const f=window.AppAuth.getUser(),g=window.app_hasPerm("dashboard","admin",f);return p.forEach(y=>{y.date!==u&&(m+=`<div class="dashboard-activity-date">${y.date}</div>`,u=y.date);const T=y._isCollab?"#10b981":y._isMinute?"#6366f1":"#e5e7eb",S=y._isCollab?"dashboard-activity-item-collab":y._isMinute?"dashboard-activity-item-minute":"",A=_a(y);let h="";if(y._isCollab||y.status||y._isMinute){const w=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(y.date,y.status):y.status||"to-be-started";h=`
                <div class="dashboard-activity-status-row">
                    ${ka(w)}
                    ${g||y._isMinute?`<div class="dashboard-activity-edit-wrap"><button onclick="${y._isMinute?`(window.app_openMinuteDetails ? window.app_openMinuteDetails('${y._meetingId}') : (window.location.hash = 'minutes'))`:`window.app_openDayPlan('${y.date}', '${n}')`}" class="dashboard-activity-edit-btn" title="View/Edit"><i class="fa-solid fa-${y._isMinute?"eye":"pen-to-square"}"></i></button></div>`:""}
                </div>`}m+=`<div class="dashboard-activity-item ${S}" style="border-left-color:${T};"><div class="dashboard-activity-desc">${$(y._displayDesc)}</div>${A}${h}<div class="dashboard-activity-meta">${$(y.checkOut||(y.status==="completed"?"Completed":"Planned Activity"))}</div></div>`}),m}function $a(a){const e=Je();e.logs=Array.isArray(a)?a:[],setTimeout(()=>{const i=document.getElementById("staff-activity-list");i&&Pa(i)},0);const t=Tn(8),n=At(e.selectedMonth);return`
        <div class="card dashboard-team-activity-card">
            <div class="dashboard-team-activity-head">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <h4>Team Activity</h4>
                    <button onclick="window.app_expandTeamActivity()" title="Expand" style="background:none; border:none; cursor:pointer; color:#6b7280;"><i class="fa-solid fa-expand"></i></button>
                </div>
                <span id="staff-activity-range-label">${$(n)}</span>
            </div>
            <div class="dashboard-team-activity-filters dashboard-team-activity-filters-compact">
                <select class="dashboard-team-select" onchange="window.app_setStaffActivityMonth(this.value)">
                    ${t.map(i=>`<option value="${i.key}" ${i.key===e.selectedMonth?"selected":""}>${$(i.label)}</option>`).join("")}
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
                ${St(e.logs,e.sortKey)}
            </div>
        </div>`}function St(a,e){const t=In(a);if(t.length===0)return'<div class="dashboard-activity-empty">No team activities found for the selected month.</div>';const n=Mn(t,e),i=n.filter(o=>o._taskStatus==="completed"),s=n.filter(o=>o._taskStatus!=="completed");return`
        <div class="dashboard-team-activity-split-grid">
            ${Ht("Completed",i,"No completed tasks in this month.")}
            ${Ht("In Progress / Incomplete",s,"No in-progress or incomplete tasks in this month.")}
        </div>
    `}function Ht(a,e,t){const n=window.AppAuth.getUser(),i=window.app_hasPerm("dashboard","admin",n),s=e.length===0?`<div class="dashboard-activity-empty">${t}</div>`:e.map(o=>{const r=n&&o.userId===n.id,d=i||r,l=_a(o),c=`
                <div class="dashboard-activity-status-row">
                    ${ka(o._taskStatus)}
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
                <span>${$(a)}</span>
                <span class="dashboard-team-activity-count">${e.length}</span>
            </div>
            <div class="dashboard-team-activity-col-list">${s}</div>
        </div>
    `}function _a(a){if(!a)return"";const e=Number.isFinite(Number(a.progressPercent)),t=a.progressStatus?String(a.progressStatus).replace(/_/g," "):"",n=String(a.progressNote||"").trim();if(!e&&!t&&!n&&Array.isArray(a.taskUpdates)&&a.taskUpdates.length>0){const r=a.taskUpdates[0]||{},d=Number.isFinite(Number(r.progressPercent))?`${Number(r.progressPercent)}%`:"",l=r.progressStatus?String(r.progressStatus).replace(/_/g," "):"",c=String(r.progressNote||"").trim();if(!d&&!l&&!c)return"";const p=c?` title="${$(c)}"`:"",m=`${d}${d&&l?" • ":""}${$(l)}`;return`<div class="dashboard-progress-chip"${p}>${m}</div>`}if(!e&&!t&&!n)return"";const i=e?`${Number(a.progressPercent)}%`:"",s=n?` title="${$(n)}"`:"",o=`${i}${i&&t?" • ":""}${$(t)}`;return`<div class="dashboard-progress-chip"${s}>${o}</div>`}function qe(a,e,t,n=""){const s=Number(t.penalty??t.penaltyLeaves??0)>0?'<span class="dashboard-penalty-badge">Penalty Applies</span>':"";return`
        <div class="card dashboard-stats-card" ${n?` data-stats-type="${$(n)}"`:""} role="button" tabindex="0" aria-label="Open ${$(a)} details">
            <div class="dashboard-stats-card-head">
                <div>
                    <h4 class="dashboard-stats-card-title">${$(a)}</h4>
                    <span class="dashboard-stats-card-subtitle">${$(e)}</span>
                </div>
                ${s}
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
                ${Ta(t.breakdown)}
            </div>
        </div>
    `}function Ta(a){const e=Object.entries(a),t={Present:{color:"#166534",bg:"#f0fdf4",label:"Office"},"Work - Home":{color:"#0369a1",bg:"#e0f2fe",label:"WFH"},Training:{color:"#4338ca",bg:"#eef2ff",label:"Training"},Late:{color:"#c2410c",bg:"#fff7ed",label:"Late"},"Sick Leave":{color:"#991b1b",bg:"#fef2f2",label:"Sick"},"Casual Leave":{color:"#9d174d",bg:"#fce7f3",label:"Casual"},"Earned Leave":{color:"#be185d",bg:"#fdf2f8",label:"Earned"},"Paid Leave":{color:"#be123c",bg:"#ffe4e6",label:"Paid"},"Maternity Leave":{color:"#a21caf",bg:"#fae8ff",label:"Maternity"},Absent:{color:"#7f1d1d",bg:"#fee2e2",label:"Absent"},"Early Departure":{color:"#991b1b",bg:"#fff1f2",label:"Early Exit"},Holiday:{color:"#1e293b",bg:"#f1f5f9",label:"Holiday"},"National Holiday":{color:"#334155",bg:"#f8fafc",label:"Nat. Hol"},"Regional Holidays":{color:"#475569",bg:"#f8fafc",label:"Reg. Hol"}};return e.map(([n,i])=>{const s=t[n]||{color:"#374151",bg:"#f3f4f6",label:n};return i===0&&!["Present","Late","Absent","Early Departure"].includes(n)?"":`
            <div class="dashboard-breakdown-item" style="background:${s.bg};">
                <span class="dashboard-breakdown-count" style="color:${s.color}">${i}</span>
                <span class="dashboard-breakdown-label" style="color:${s.color};">${s.label}</span>
            </div>
         `}).join("")}function Dn(){document.querySelectorAll(".dashboard-stats-card[data-stats-type]").forEach(a=>{if(a.dataset.bound==="1")return;a.dataset.bound="1";const e=a.getAttribute("data-stats-type")||"";a.addEventListener("click",()=>{window.app_openStatsDetailModal&&window.app_openStatsDetailModal(e)}),a.addEventListener("keydown",t=>{(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),window.app_openStatsDetailModal&&window.app_openStatsDetailModal(e))})})}function oa(a){const e=String(a||"").trim();if(!e||e.toLowerCase().includes("active"))return null;const t=e.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);if(!t)return null;let n=Number(t[1]);const i=Number(t[2]),s=t[3]?t[3].toUpperCase():"";return s==="PM"&&n<12&&(n+=12),s==="AM"&&n===12&&(n=0),n*60+i}function xn(a,e){const t={late:new Set,early:new Set,extra:new Set,breakdown:{Present:new Set,"Work - Home":new Set,Training:new Set,"Sick Leave":new Set,"Casual Leave":new Set,"Earned Leave":new Set,"Paid Leave":new Set,"Maternity Leave":new Set,Absent:new Set,Holiday:new Set,"National Holiday":new Set,"Regional Holidays":new Set,Late:new Set,"Early Departure":new Set}},n=e?.start?new Date(e.start):new Date("1970-01-01"),i=e?.end?new Date(e.end):new Date;n.setHours(0,0,0,0),i.setHours(23,59,59,999);let s=Array.isArray(a)?a:[];if(window.AppAnalytics&&window.AppAnalytics.pickBestAttendanceLogPerDay)try{s=window.AppAnalytics.pickBestAttendanceLogPerDay(s,n,i)}catch(l){console.warn("pickBestAttendanceLogPerDay failed",l)}else{const l=new Map;s.forEach(c=>{const p=c.date||"";p&&(l.has(p)||l.set(p,c))}),s=Array.from(l.values())}const o=(typeof C<"u"&&C?C.LATE_CUTOFF_MINUTES:555)||555,r=(typeof C<"u"&&C?C.EARLY_DEPARTURE_MINUTES:1020)||1020;s.forEach(l=>{const c=l.date?new Date(l.date):null;if(!c||Number.isNaN(c.getTime())||c<n||c>i)return;const p=l.date,m=String(l.type||""),u=oa(l.checkIn),f=oa(l.checkOut),g=l.isManualOverride===!0;(l.lateCountable===!0||!Object.prototype.hasOwnProperty.call(l,"lateCountable")&&u!==null&&u>o)&&(t.late.add(p),t.breakdown.Late.add(p)),g?m==="Early Departure"&&(t.early.add(p),t.breakdown["Early Departure"].add(p)):f!==null&&f<r&&!String(m).includes("Leave")&&m!=="Absent"&&(t.early.add(p),t.breakdown["Early Departure"].add(p));const k=typeof l.extraWorkedMs=="number"?Math.max(0,Math.round(l.extraWorkedMs/(1e3*60))):0,T=!(l.autoCheckout&&!l.autoCheckoutExtraApproved);(k>0||T&&(u!==null&&u<o||f!==null&&f>r))&&t.extra.add(p),m==="Work - Home"?t.breakdown["Work - Home"].add(p):m==="Training"?t.breakdown.Training.add(p):m==="Sick Leave"?t.breakdown["Sick Leave"].add(p):m==="Casual Leave"?t.breakdown["Casual Leave"].add(p):m==="Earned Leave"?t.breakdown["Earned Leave"].add(p):m==="Paid Leave"?t.breakdown["Paid Leave"].add(p):m==="Maternity Leave"?t.breakdown["Maternity Leave"].add(p):m==="Absent"?t.breakdown.Absent.add(p):m==="National Holiday"?t.breakdown["National Holiday"].add(p):m==="Regional Holidays"?t.breakdown["Regional Holidays"].add(p):String(m).includes("Holiday")?t.breakdown.Holiday.add(p):l.checkIn&&t.breakdown.Present.add(p)});const d=l=>Array.from(l||[]).sort((c,p)=>new Date(c)-new Date(p));return{late:d(t.late),early:d(t.early),extra:d(t.extra),breakdown:Object.fromEntries(Object.entries(t.breakdown).map(([l,c])=>[l,d(c)]))}}function Ia(a){return!a||a.length===0?`
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
            ${a.length>5?`<div class="dashboard-leave-footer"><button onclick="window.location.hash = 'leaves'">View all ${a.length} requests</button></div>`:""}
        </div>`}function $n(a){return!a||a.length===0?`
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
                            <div class="dashboard-tagged-title">${$(e.staffName||"Staff")}</div>
                            <div class="dashboard-tagged-desc">${$(e.reason||"Reason not available.")}</div>
                            <div class="dashboard-tagged-meta">${$(e.date||"--")} | ${$(e.staffRole||"Employee")}${e.submittedAt?` | Submitted ${$(new Date(e.submittedAt).toLocaleString())}`:""}</div>
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
        </div>`}function Ma(a,e={}){const t=e.title||"Leave History",n=e.subtitle||"Past records",i=e.selectedDate||new Date().toISOString().slice(0,10);if(!a||a.length===0)return`
            <div class="card dashboard-leave-history-card">
                <div class="dashboard-leave-history-head">
                    <div>
                        <h4>${$(t)}</h4>
                        <span>${$(n)}</span>
                    </div>
                    <input type="date" class="dashboard-team-select" value="${$(i)}" onchange="window.app_setDashboardLeaveHistoryDate(this.value)">
                </div>
                <div class="dashboard-activity-empty">No leave history found.</div>
            </div>`;const s=o=>o==="Approved"?"#166534":o==="Rejected"?"#b91c1c":"#854d0e";return`
        <div class="card dashboard-leave-history-card">
            <div class="dashboard-leave-history-head">
                <div>
                    <h4>${$(t)}</h4>
                    <span>${$(n)}</span>
                </div>
                <input type="date" class="dashboard-team-select" value="${$(i)}" onchange="window.app_setDashboardLeaveHistoryDate(this.value)">
            </div>
            <div class="dashboard-leave-history-list">
                ${a.map(o=>`
                    <div class="dashboard-leave-history-row">
                        <div class="dashboard-leave-history-main">
                            <div class="dashboard-leave-history-user">${$(o.userName||"Staff")}</div>
                            <div class="dashboard-leave-history-type">${$(o.type)} • ${o.daysCount} days</div>
                            <div class="dashboard-leave-history-date">${o.startDate} to ${o.endDate}</div>
                        </div>
                        <div class="dashboard-leave-history-status">
                            <span class="status-pill" style="background: ${s(o.status)}15; color: ${s(o.status)}">${$(o.status)}</span>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>`}function Ca(a,e){return""}function La(a){return""}function _n(a,e,t){if(!a||a.length===0)return`
            <div class="card dashboard-staff-directory-card">
                <div class="dashboard-staff-directory-head"><h4>Staff Directory</h4><span>Quick actions</span></div>
                <div class="dashboard-staff-directory-list">
                    <div class="dashboard-activity-empty">No staff loaded.</div>
                </div>
            </div>`;const n=Date.now(),i=o=>{const r=(o.notifications||[]).map(d=>new Date(d.taggedAt||d.date||d.respondedAt||0).getTime()).filter(Boolean);return r.length?Math.max(...r):0};return`
        <div class="card dashboard-staff-directory-card">
            <div class="dashboard-staff-directory-head"><h4>Staff Directory</h4><span>Message or assign</span></div>
            <div class="dashboard-staff-directory-list">
                ${a.filter(o=>o.id!==t.id).sort((o,r)=>i(r)-i(o)||o.name.localeCompare(r.name)).map(o=>{const r=i(o);return`
                <div class="dashboard-staff-row ${r&&n-r<12e4?"dashboard-staff-row-new":""}">
                    <div class="dashboard-staff-meta">
                        <div class="dashboard-staff-avatar">
                            <img src="${Ge(o.avatar)}" alt="${$(o.name)}">
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
        </div>`}async function kt(){const a=window.AppAuth.getUser(),e=window.app_hasPerm("dashboard","view",a),t=window.app_hasPerm("dashboard","admin",a),n=Je(),i=n.selectedMonth,s=n.leaveHistoryDate||new Date().toISOString().slice(0,10),o=window.AppDB?.getISTDateKeys?window.AppDB.getISTDateKeys():{todayKey:new Date().toISOString().split("T")[0],yesterdayKey:new Date(Date.now()-1440*60*1e3).toISOString().split("T")[0]},r=o.todayKey,d=o.yesterdayKey,l=!!C?.READ_OPT_FLAGS?.FF_SHARED_DAILY_SUMMARY,c=`hero_stats_${r}`,p=1440*60*1e3,m=e&&window.app_selectedSummaryStaffId?window.app_selectedSummaryStaffId:a.id;console.time("DashboardFetch");const u=async()=>{try{return await window.AppDB.getOrGenerateSummary(c,async()=>{const H=await window.AppAnalytics.getHeroOfTheWeek({source:"direct_cache"});if(!H||H.state==="fetch_error")throw new Error("direct hero unavailable");return H},p)}catch(H){return console.warn("Direct hero cache read failed:",H),null}},f=l?Promise.resolve(null):u(),g=l?Promise.resolve([]):window.AppDB.getOrGenerateSummary(`team_activity_${i}_${r}`,()=>window.AppAnalytics.getAllStaffActivities({mode:"month",month:i,scope:"work"})),y=l&&window.AppDB.getOrCreateDailySummary?window.AppDB.getOrCreateDailySummary({dateKey:r,yesterdayKey:d,staleAfterMs:C?.SUMMARY_POLICY?.STALENESS_MS,lockTtlMs:C?.SUMMARY_POLICY?.LOCK_TTL_MS,generatorFn:()=>window.AppAnalytics.buildDailyDashboardSummary({dateKey:r,selectedMonth:i})}).catch(H=>(console.warn("Daily summary fetch/generation failed:",H),null)):null,k=y?Promise.race([y,new Promise(H=>setTimeout(()=>H(null),1500))]):Promise.resolve(null);if(!window._dashboardRefreshScheduled){window._dashboardRefreshScheduled=!0;try{const H=window.AppDB.getIstNow(),ie=new Date(H);ie.setDate(ie.getDate()+1),ie.setHours(0,0,5,0);const be=ie.getTime()-H.getTime();setTimeout(()=>{kt().then(re=>{const de=document.getElementById("page-content");de&&(de.innerHTML=re)}),window._dashboardRefreshScheduled=!1},Math.max(0,be))}catch(H){console.warn("failed to schedule dashboard refresh",H)}}const T=e?(Array.isArray(a.notifications)?a.notifications:[]).filter(H=>H&&H.type==="missed-checkout-reason"&&String(H.status||"pending").toLowerCase()==="pending"&&H.logId):[],S=Array.from(new Set(T.map(H=>String(H.logId||"")).filter(Boolean))),[A,h,w,v,_,L,b,x,D,M,R,I,N,P]=await Promise.all([window.AppAttendance.getStatus(),window.AppAttendance.getLogs(m),window.AppAnalytics.getUserMonthlyStats(m),window.AppAnalytics.getUserYearlyStats(m),f,window.AppCalendar?window.AppCalendar.getPlans():{leaves:[],events:[]},g,window.app_hasPerm("leaves","view")?window.AppLeaves.getPendingLeaves():Promise.resolve([]),window.AppDB.getCached?window.AppDB.getCached(window.AppDB.getCacheKey("dashboardUsers","users",{}),C?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):window.AppDB.getAll("users"),window.AppCalendar?window.AppCalendar.getCollaborations(m):Promise.resolve([]),window.app_hasPerm("leaves","view")?window.AppDB.getAll("leaves"):Promise.resolve([]),k,window.AppMinutes?window.AppMinutes.getMinutes():Promise.resolve([]),e&&S.length?window.AppDB.getManyByIds?window.AppDB.getManyByIds("attendance",S):Promise.all(S.map(H=>window.AppDB.get("attendance",H))).then(H=>H.filter(Boolean)):Promise.resolve([])]);console.timeEnd("DashboardFetch");const B=l?{lowRead:!1,generatedAt:I?.generatedAt||I?.meta?.generatedAt||0,source:I?._source||""}:{};let O=l?I?.hero||null:_,V=l?Array.isArray(I?.teamActivityPreview)?I.teamActivityPreview:[]:b;l&&(!I||!Array.isArray(I.teamActivityPreview))&&setTimeout(()=>Ln(!0),0);const j=Se(O,B);if(l&&O==null&&y){const H="app_hero_fallback_attempted_date",ie=()=>{try{return localStorage.getItem(H)===r}catch{return!1}},be=()=>{try{localStorage.setItem(H,r)}catch{}},re=de=>{const le=document.querySelector(".hero-slot");le&&(le.outerHTML=de)};y.then(async de=>{const le=de&&de.hero?de.hero:null;if(le){const Ae={...B,generatedAt:de.generatedAt||B.generatedAt,source:de._source||B.source};re(Se(le,Ae));return}const he=await u();if(he){re(Se(he,{...B,generatedAt:Date.now(),source:"direct_cache"}));return}if(re(Se({state:"no_eligible_data",reason:"No eligible hero data available.",source:"shared_summary"},{...B,generatedAt:de?.generatedAt||B.generatedAt,source:de?._source||"shared_missing"})),!ie()){be();try{const Ae=await window.AppAnalytics.getHeroOfTheWeek({source:"direct_fallback"});if(!Ae||Ae.state==="fetch_error"){re(Se({state:"fetch_error",reason:"Hero stats are temporarily unavailable.",source:"direct_fallback"},{...B,lowRead:!1,generatedAt:Date.now(),source:"direct_fallback"}));return}await window.AppDB.getOrGenerateSummary(c,async()=>Ae,p);const yn={...B,lowRead:!1,generatedAt:Date.now(),source:"direct_fallback"};re(Se(Ae,yn))}catch(Ae){console.warn("Hero fallback direct fetch failed:",Ae),re(Se({state:"fetch_error",reason:"Hero stats are temporarily unavailable.",source:"direct_fallback"},{...B,generatedAt:Date.now(),source:"direct_fallback"}))}}}).catch(()=>{re(Se({state:"fetch_error",reason:"Hero stats are temporarily unavailable.",source:"shared_error"},{...B,source:"shared_error"}))})}window.AppRating&&a.rating===void 0&&window.AppRating.updateUserRating(a.id).then(H=>{Object.assign(a,H)}).catch(()=>{});const W=(D||[]).find(H=>H.id===m),J=m===a.id,E=!J&&W?W:a,U=e&&!J&&!t,G=new Date,q=new Date(G.getFullYear(),G.getMonth(),1),Q=new Date(G.getFullYear(),G.getMonth()+1,0),ee=window.AppAnalytics&&window.AppAnalytics.getFinancialYearDates?window.AppAnalytics.getFinancialYearDates():{start:new Date(G.getFullYear(),0,1),end:new Date(G.getFullYear(),11,31)};window.app_dashboardStatsStore={monthly:w||{},yearly:v||{},monthlyTitle:J?w.label:`${w.label} - ${W?.name||"Staff"}`,monthlySubtitle:J?"Monthly Stats":"Viewing Staff Monthly Stats",yearlyTitle:"Yearly Summary",yearlySubtitle:J?v.label:`${v.label} for ${W?.name||"Staff"}`,logs:Array.isArray(h)?h:[],ranges:{monthly:{start:q.toISOString().split("T")[0],end:Q.toISOString().split("T")[0]},yearly:{start:ee.start.toISOString().split("T")[0],end:ee.end.toISOString().split("T")[0]}}};const ne=U?{status:E.status||"out",lastCheckIn:E.lastCheckIn||null}:A,fe=ne.status==="in",ve=a.notifications||[];a.tagHistory;const _t=new Map((D||[]).map(H=>[String(H.id),H])),Tt=e?(P||[]).filter(H=>H&&H.missedCheckoutReasonRequired&&H.missedCheckoutReasonSubmittedAt&&String(H.missedCheckoutReasonStatus||"").toLowerCase()==="pending").map(H=>{const ie=_t.get(String(H.user_id));return{notificationId:ve.find(re=>re&&re.type==="missed-checkout-reason"&&String(re.logId||"")===String(H.id||"")&&String(re.status||"pending").toLowerCase()==="pending")?.id||"",staffName:ie?.name||"Staff",staffRole:ie?.role||"Employee",reason:H.missedCheckoutReason||"",date:H.date||"",submittedAt:H.missedCheckoutReasonSubmittedAt||""}}).sort((H,ie)=>new Date(ie.submittedAt||ie.date||0)-new Date(H.submittedAt||H.date||0)):[];let Ue="00 : 00 : 00",ot="Check-in",rt="action-btn";fe&&(ot="Check-out",rt="action-btn checkout");const It=H=>{const ie=Math.max(0,H||0);let be=Math.floor(ie/(1e3*60*60)),re=Math.floor(ie/(1e3*60)%60),de=Math.floor(ie/1e3%60);return`${String(be).padStart(2,"0")} : ${String(re).padStart(2,"0")} : ${String(de).padStart(2,"0")}`};if(fe&&ne.lastCheckIn){const H=new Date(ne.lastCheckIn).getTime();Ue=It(Date.now()-H)}const dt=Ca(),hn=La();let na="";e&&!J&&W&&(na=`
            <div class="card full-width dashboard-staff-view-banner">
                <div class="dashboard-staff-view-banner-inner">
                    <div class="dashboard-staff-view-banner-profile">
                        <div class="dashboard-staff-view-avatar-wrap">
                            <img src="${Ge(W.avatar)}" alt="${$(W.name)}" class="dashboard-staff-view-avatar">
                            <div class="dashboard-staff-view-avatar-badge">
                                <i class="fa-solid fa-eye"></i>
                            </div>
                        </div>
                        <div class="dashboard-staff-view-copy">
                            <div class="dashboard-staff-view-eyebrow">Currently Viewing</div>
                            <h3 class="dashboard-staff-view-title">${$(W.name)}'s Dashboard</h3>
                            <div class="dashboard-staff-view-meta">${$(W.role)} • ${$(W.dept||"General")}</div>
                        </div>
                    </div>
                    <button onclick="window.app_changeSummaryStaff('${a.id}')" class="dashboard-staff-view-back-btn">
                        <i class="fa-solid fa-arrow-left"></i> Back to My Dashboard
                    </button>
                </div>
            </div>`);let Mt="";const ia=Gt(L);if(e){const H=!!window.app_selectedSummaryStaffId&&window.app_selectedSummaryStaffId!==a.id,ie=Aa(s),be=(R||[]).filter(le=>{const he=String(le.appliedOn||le.actionDate||le.startDate||"").slice(0,10);return he&&he>=ie.startKey&&he<=ie.endKey}).sort((le,he)=>new Date(he.appliedOn||he.actionDate||he.startDate||0)-new Date(le.appliedOn||le.actionDate||le.startDate||0)),re=H?be.filter(le=>(le.userId||le.user_id)===m).slice(0,8):be.slice(0,8),de=Ma(re,{title:H?`${W?.name||"Staff"} Leave History`:"Leave Request History",subtitle:H?`Current week (${ie.label}) for selected staff`:`Current week (${ie.label}) across all staff`,selectedDate:s});Mt=`
            <div class="dashboard-summary-row">
                <div style="flex: 2; min-width: 350px; display: flex; flex-direction: column;">${Ia(x)}${$n(Tt)}${de}</div>
                <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 1rem;">${ia}${j}</div>
            </div>
            <div class="dashboard-stats-row">
                ${qe(J?w.label:`${w.label} - ${W?.name||"Staff"}`,J?"Monthly Stats":"Viewing Staff Monthly Stats",w,"monthly")}
                ${qe("Yearly Summary",J?v.label:`${v.label} for ${W?.name||"Staff"}`,v,"yearly")}
            </div>`}else Mt=`
            <div class="dashboard-summary-row">
                <div class="dashboard-summary-col dashboard-summary-col-wide">${ia}</div>
                <div class="dashboard-summary-col dashboard-summary-col-narrow">${j}</div>
            </div>
            <div class="dashboard-stats-row">
                ${qe(w.label,"Monthly Stats",w,"monthly")}
                ${qe("Yearly Summary",v.label,v,"yearly")}
            </div>`;const Ct=window.app_getReleaseUpdateState&&window.app_getReleaseUpdateState()||{active:!1};return setTimeout(()=>An(),0),`
        <div class="dashboard-grid dashboard-modern dashboard-staff-view">
            ${dt}
            ${hn}
            ${na}
            <div class="card full-width dashboard-hero-card">
                <div class="dashboard-hero-orb dashboard-hero-orb-top"></div>
                <div class="dashboard-hero-orb dashboard-hero-orb-bottom"></div>
                <div class="dashboard-hero-content">
                    <div class="dashboard-hero-row">
                        <div class="dashboard-hero-copy">
                            <h2 class="dashboard-hero-title">Welcome back, ${a.name.split(" ")[0]}! 👋</h2>
                            <p class="dashboard-hero-date">${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
                            ${a.rating!==void 0?`<div class="dashboard-hero-chip-row"><div class="dashboard-hero-chip"><span class="dashboard-hero-chip-label">Your Rating:</span>${kn(a.rating,!0)}</div>${a.completionStats?`<div class="dashboard-hero-chip"><i class="fa-solid fa-check-circle dashboard-hero-chip-icon"></i><span>${(a.completionStats.completionRate*100).toFixed(0)}% Complete</span></div>`:""}</div>`:""}
                        </div>
                        <div class="dashboard-hero-aside">
                            ${e?`<div class="dashboard-viewing-box"><div class="dashboard-viewing-inner"><i class="fa-solid fa-users-viewfinder dashboard-viewing-icon"></i><div class="dashboard-viewing-meta"><div class="dashboard-viewing-head"><div class="dashboard-viewing-label">Viewing Summary For</div>${m!==a.id?'<span class="dashboard-viewing-state">STAFF VIEW ACTIVE</span>':""}</div><select onchange="window.app_changeSummaryStaff(this.value)" class="dashboard-viewing-select"><option value="${a.id}">My Own Summary</option><optgroup label="Staff Members">${(D||[]).filter(H=>H.id!==a.id).sort((H,ie)=>H.name.localeCompare(ie.name)).map(H=>`<option value="${H.id}" ${H.id===m?"selected":""}>${H.name}</option>`).join("")}</optgroup></select></div></div></div>`:""}
                            <div class="dashboard-hero-brand" aria-hidden="true">
                                <img src="crwi-logo.png" alt="CRWI logo" class="dashboard-hero-brand-logo">
                            </div>
                        </div>
                    </div>
                </div>
                <button class="${Ct.active?"dashboard-refresh-link is-update-pending":"dashboard-refresh-link"}" onclick="window.app_checkForSystemUpdate()" title="${Ct.active?"Update available. Click to refresh into the new version.":"Check for System Update"}">
                    ${Ct.active?"System update available":"Check for System Update"}
                </button>
            </div>
            <div class="dashboard-primary-row">
                <div class="card check-in-widget dashboard-primary-card dashboard-checkin-card">
                    <div class="dashboard-checkin-head">
                        <div class="dashboard-checkin-avatar-wrap">
                            <img src="${Ge(E.avatar)}" alt="Profile" class="dashboard-checkin-avatar">
                            <div class="dashboard-checkin-status-dot" style="background: ${fe?"#10b981":"#94a3b8"};"></div>
                        </div>
                        <div class="dashboard-checkin-identity">
                            <h4 class="dashboard-checkin-name">${$(E.name)}</h4>
                            <p class="text-muted dashboard-checkin-role">${$(E.role)}</p>
                        </div>
                    </div>
                    <div class="dashboard-checkin-timer-wrap">
                        <div class="timer-display dashboard-checkin-timer" id="timer-display">${Ue}</div>
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
                    <button class="${rt} dashboard-checkin-btn" id="attendance-btn" ${U?"disabled":""} title="${U?"View only":""}">${ot} <i class="fa-solid fa-fingerprint"></i></button>
                    <div class="location-text dashboard-checkin-location" id="location-text"><i class="fa-solid fa-location-dot"></i><span>${fe&&E.currentLocation?`Lat: ${Number(E.currentLocation.lat).toFixed(4)}, Lng: ${Number(E.currentLocation.lng).toFixed(4)}`:"Waiting for location..."}</span></div>
                </div>
                <div class="dashboard-primary-col ${J?"":"dashboard-primary-col-highlight"}">${Da(h,M,W,N)}</div>
                <div class="dashboard-primary-col">${$a(V)}</div>
            </div>
            ${Mt}
        </div>`}function At(a){const[e,t]=String(a||"").split("-"),n=Number(e),i=Number(t)-1;return!Number.isInteger(n)||!Number.isInteger(i)||i<0||i>11?a||"Current Month":new Date(n,i,1).toLocaleDateString("en-US",{month:"long",year:"numeric"})}function Tn(a=8){const e=[],t=new Date;t.setDate(1);for(let n=0;n<a;n++){const i=new Date(t);i.setMonth(t.getMonth()-n);const s=i.toISOString().slice(0,7);e.push({key:s,label:At(s)})}return e}function In(a){const e={completed:0,"in-process":1,"to-be-started":2,overdue:3,"not-completed":4},t=i=>window.AppCalendar?window.AppCalendar.getSmartTaskStatus(i.date,i.status||""):i.status||"to-be-started",n=new Map;return(a||[]).forEach(i=>{const s=(i._displayDesc||"").trim(),o=`${i.staffName||""}|${i.date||""}|${s}`,r=t(i),d={...i,_taskStatus:r,_taskGroup:r==="completed"?"completed":"incomplete"},l=n.get(o);if(!l){n.set(o,d);return}const c=e[l._taskStatus]??99;(e[d._taskStatus]??99)<c&&n.set(o,d)}),Array.from(n.values())}function Mn(a,e){const t=[...a],n={completed:0,"in-process":1,overdue:2,"not-completed":3,"to-be-started":4};return t.sort((i,s)=>{const o=new Date(s.date)-new Date(i.date),r=String(i.staffName||"").toLowerCase().localeCompare(String(s.staffName||"").toLowerCase());return e==="date-asc"?new Date(i.date)-new Date(s.date)||r:e==="staff-asc"?r||o:e==="staff-desc"?-r||o:e==="completed-first"?i._taskGroup.localeCompare(s._taskGroup)||o:e==="incomplete-first"?s._taskGroup.localeCompare(i._taskGroup)||o:e==="status-priority"?(n[i._taskStatus]??99)-(n[s._taskStatus]??99)||o||r:o||r}),t}function Cn(a){if(!a)return;const e=Oe.controllers.get(a);e&&(e.intervalId&&clearInterval(e.intervalId),e.pauseTimeoutId&&clearTimeout(e.pauseTimeoutId),e.resumeTimeoutId&&clearTimeout(e.resumeTimeoutId),a.removeEventListener("mouseenter",e.onMouseEnter),a.removeEventListener("mouseleave",e.onMouseLeave),a.removeEventListener("touchstart",e.onTouchStart),a.removeEventListener("touchend",e.onTouchEnd),a.removeEventListener("touchcancel",e.onTouchCancel),Oe.controllers.delete(a),Oe.elements.delete(a))}function Ea(){Array.from(Oe.elements).forEach(a=>Cn(a))}function Pa(a){if(!a)return;Ea(),a.querySelectorAll(".dashboard-team-activity-col-list").forEach(t=>{const n={intervalId:null,pauseTimeoutId:null,resumeTimeoutId:null,direction:1,isPausedByUser:!1,isWaitingAtEdge:!1},i=(o,r)=>{n.isWaitingAtEdge=!0,n.pauseTimeoutId&&clearTimeout(n.pauseTimeoutId),n.pauseTimeoutId=setTimeout(()=>{n.direction=o,n.isWaitingAtEdge=!1},r)},s=()=>{if(n.isPausedByUser||n.isWaitingAtEdge||!t.isConnected)return;const o=Math.max(0,t.scrollHeight-t.clientHeight);o<=0||(t.scrollTop+=n.direction,n.direction===1&&t.scrollTop>=o?(t.scrollTop=o,i(-1,1500)):n.direction===-1&&t.scrollTop<=0&&(t.scrollTop=0,i(1,1e3)))};n.onMouseEnter=()=>{n.isPausedByUser=!0},n.onMouseLeave=()=>{n.isPausedByUser=!1},n.onTouchStart=()=>{n.isPausedByUser=!0,n.resumeTimeoutId&&clearTimeout(n.resumeTimeoutId)},n.onTouchEnd=()=>{n.resumeTimeoutId&&clearTimeout(n.resumeTimeoutId),n.resumeTimeoutId=setTimeout(()=>{n.isPausedByUser=!1},400)},t.addEventListener("mouseenter",n.onMouseEnter),t.addEventListener("mouseleave",n.onMouseLeave),t.addEventListener("touchstart",n.onTouchStart,{passive:!0}),t.addEventListener("touchend",n.onTouchEnd,{passive:!0}),n.intervalId=setInterval(s,50),Oe.controllers.set(t,n),Oe.elements.add(t)})}const Ln=async(a=!0)=>{const e=Je(),t=document.getElementById("staff-activity-list"),n=document.getElementById("staff-activity-list-modal");if(!t&&!n)return;Ea(),a&&window.AppAnalytics&&(e.logs=await window.AppAnalytics.getAllStaffActivities({mode:"month",month:e.selectedMonth,scope:"work"}));const i=St(e.logs,e.sortKey);t&&(t.innerHTML=i,Pa(t)),n&&(n.innerHTML=i);const s=document.getElementById("staff-activity-range-label");s&&(s.textContent=At(e.selectedMonth))};typeof window<"u"&&(window.app_setDashboardLeaveHistoryDate=async function(a){const e=Je();e.leaveHistoryDate=a||new Date().toISOString().slice(0,10);const t=document.getElementById("page-content");t&&(t.innerHTML=await kt())},window.app_expandTeamActivity=function(){window.app_closeTeamActivityExpanded&&window.app_closeTeamActivityExpanded(),window.location&&(window.location.hash="#team-activities")},window.app_openStatsDetailModal=function(a){const e=window.app_dashboardStatsStore||{},t=a==="yearly"?e.yearly:e.monthly;if(!t)return;const n=a==="yearly"?e.yearlyTitle:e.monthlyTitle,i=a==="yearly"?e.yearlySubtitle:e.monthlySubtitle,s=t.breakdown||{},o=e.ranges?a==="yearly"?e.ranges.yearly:e.ranges.monthly:null,r=xn(e.logs||[],o),d=Object.entries(s).filter(([,m])=>Number(m||0)>0),l=document.getElementById("dashboard-stats-modal");l&&l.remove();const c=document.createElement("div");c.id="dashboard-stats-modal",c.className="modal-overlay dashboard-stats-modal",c.innerHTML=`
            <div class="modal-content dashboard-stats-modal-content">
                <div class="dashboard-stats-modal-head">
                    <div>
                        <div class="dashboard-stats-modal-title">${$(n||"Attendance Summary")}</div>
                        <div class="dashboard-stats-modal-sub">${$(i||"")}</div>
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
                        ${(d.length?d:[["No data",0]]).map(([m,u])=>`
                            <div class="dashboard-stats-modal-row" data-breakdown-key="${$(m)}" role="button" tabindex="0">
                                <span>${$(m)}</span>
                                <strong>${$(u)}</strong>
                            </div>
                        `).join("")}
                    </div>
                </div>
                <div class="dashboard-stats-modal-section">
                    <div class="dashboard-stats-modal-section-title" id="dashboard-stats-detail-title">Details</div>
                    <div class="dashboard-stats-modal-dates" id="dashboard-stats-date-list"></div>
                </div>
            </div>
        `,document.body.appendChild(c),document.body.style.overflow="hidden",window._dashboardStatsDetailData={type:a,buckets:r};const p=r.late.length?"late":r.early.length?"early":r.extra.length?"extra":"Present";window.app_updateStatsDetailView(p),c.addEventListener("click",m=>{const u=m.target.closest("[data-stat-detail]");if(u){window.app_updateStatsDetailView(u.getAttribute("data-stat-detail"));return}const f=m.target.closest("[data-breakdown-key]");f&&window.app_updateStatsDetailView(f.getAttribute("data-breakdown-key"))}),c.addEventListener("keydown",m=>{if(m.key!=="Enter"&&m.key!==" ")return;const u=m.target.closest("[data-stat-detail]"),f=m.target.closest("[data-breakdown-key]");(u||f)&&(m.preventDefault(),window.app_updateStatsDetailView(u?u.getAttribute("data-stat-detail"):f.getAttribute("data-breakdown-key")))}),c.addEventListener("click",m=>{m.target===c&&window.app_closeStatsDetailModal()}),window._dashboardStatsEscHandler=m=>{m.key==="Escape"&&window.app_closeStatsDetailModal()},window.addEventListener("keydown",window._dashboardStatsEscHandler)},window.app_closeStatsDetailModal=function(){const a=document.getElementById("dashboard-stats-modal");a&&a.remove(),document.body.style.overflow="",window._dashboardStatsDetailData=null,window._dashboardStatsEscHandler&&(window.removeEventListener("keydown",window._dashboardStatsEscHandler),window._dashboardStatsEscHandler=null)},window.app_updateStatsDetailView=function(a){const t=(window._dashboardStatsDetailData||{}).buckets||{};let n="",i=[];a==="late"?(n="Late Dates",i=t.late||[]):a==="early"?(n="Early Departure Dates",i=t.early||[]):a==="extra"?(n="Extra Hours Dates",i=t.extra||[]):t.breakdown&&Object.prototype.hasOwnProperty.call(t.breakdown,a)?(n=`${a} Dates`,i=t.breakdown[a]||[]):(n="Details",i=[]);const s=document.getElementById("dashboard-stats-detail-title"),o=document.getElementById("dashboard-stats-date-list");s&&(s.textContent=n),o&&(o.innerHTML=i.length?i.map(r=>`<div class="dashboard-stats-date-item">${$(r)}</div>`).join(""):'<div class="dashboard-stats-date-empty">No dates available.</div>'),document.querySelectorAll(".dashboard-stats-modal-tile, .dashboard-stats-modal-row").forEach(r=>{const d=r.getAttribute("data-stat-detail"),l=r.getAttribute("data-breakdown-key");r.classList.toggle("is-active",d&&d===a||l&&l===a)})},window.app_attachStatsCardHandlers=function(){Dn()},window.app_expandTeamActivityRefresh=function(){const a=Je(),e=document.getElementById("staff-activity-list-modal"),t=document.getElementById("staff-activity-range-label-modal");e&&(e.innerHTML=St(a.logs,a.sortKey)),t&&(t.textContent=At(a.selectedMonth))},window.app_closeTeamActivityExpanded=function(){const a=document.getElementById("team-activity-modal-overlay");a&&(a.remove(),document.body.style.overflow="",window.removeEventListener("keydown",window._teamActivityEscHandler))});async function En(){const a=window.AppAuth.getUser(),e=window.AppDB.getCached?await window.AppDB.getCached(window.AppDB.getCacheKey("staffUsers","users",{}),C?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):await window.AppDB.getAll("users"),t=window.app_getMyMessages?await window.app_getMyMessages():await window.AppDB.getAll("staff_messages"),n=e.filter(u=>u.id!==a.id).sort((u,f)=>u.name.localeCompare(f.name));!window.app_staffThreadId&&n.length>0&&(window.app_staffThreadId=n[0].id);const i=e.find(u=>u.id===window.app_staffThreadId),s=u=>$(u).replace(/(https?:\/\/[^\s]+)/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'),o=t.filter(u=>u.fromId===a.id&&u.toId===window.app_staffThreadId||u.fromId===window.app_staffThreadId&&u.toId===a.id).sort((u,f)=>new Date(u.createdAt||0)-new Date(f.createdAt||0)),r=o.filter(u=>u.type==="text"),d=o.filter(u=>u.type==="task"),l={};t.forEach(u=>{u.toId===a.id&&!u.read&&(l[u.fromId]=(l[u.fromId]||0)+1)});const c=n.map(u=>{const f=l[u.id]||0;return`
            <button class="staff-directory-item ${u.id===window.app_staffThreadId?"active":""}" onclick="window.app_openStaffThread('${u.id}')">
                <div class="staff-directory-avatar">
                    <img src="${u.avatar}" alt="${$(u.name)}">
                </div>
                <div class="staff-directory-info">
                    <div class="staff-directory-name">${$(u.name)}</div>
                    <div class="staff-directory-role">${$(u.role||"Staff")}</div>
                </div>
                ${f?`<span class="staff-directory-badge">${f}</span>`:""}
            </button>
        `}).join(""),p=i?r.length?r.map(u=>`
        <div class="staff-message ${u.fromId===a.id?"outgoing":"incoming"}">
            <div class="staff-message-meta">${$(u.fromName)} • ${new Date(u.createdAt).toLocaleString()}</div>
            <div class="staff-message-body">${s(u.message||"")}</div>
            ${u.link?`<div class="staff-message-link"><a href="${u.link}" target="_blank" rel="noopener noreferrer">${u.link}</a></div>`:""}
        </div>
    `).join(""):'<div class="staff-message-empty">No messages yet.</div>':'<div class="staff-message-empty">Select a staff member to view messages.</div>',m=i?d.length?d.map(u=>`
        <div class="staff-task-card">
            <div class="staff-task-head">
                <div>
                    <div class="staff-task-title">${$(u.title||"Task")}</div>
                    <div class="staff-task-meta">From ${$(u.fromName)} • Due ${u.dueDate||"No date"}</div>
                </div>
                <span class="staff-task-status ${u.status||"pending"}">${(u.status||"pending").toUpperCase()}</span>
            </div>
            <div class="staff-task-desc">${$(u.description||"")}</div>
            ${u.status==="pending"&&u.toId===a.id?`
                <div class="staff-task-actions">
                    <button onclick="window.app_respondStaffTask('${u.id}', 'approved')" class="staff-task-btn approve">Approve</button>
                    <button onclick="window.app_respondStaffTask('${u.id}', 'rejected')" class="staff-task-btn reject">Reject</button>
                </div>
            `:""}
            ${u.rejectReason?`<div class="staff-task-reason">Reason: ${$(u.rejectReason)}</div>`:""}
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
                        <h3>${i?$(i.name):"Select a staff member"}</h3>
                        <span>${i?$(i.role||"Staff"):""}</span>
                    </div>
                    <div class="staff-thread-actions">
                        <button class="staff-thread-action-btn" ${i?"":"disabled"} onclick="window.app_openStaffMessageModal('${i?i.id:""}', '${i?$(i.name):""}')">
                            <i class="fa-solid fa-message"></i> Send Message
                        </button>
                        <button class="staff-thread-action-btn secondary" ${i?"":"disabled"} onclick="window.app_openStaffTaskModal('${i?i.id:""}', '${i?$(i.name):""}')">
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
                            ${m}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `}let ra=!1;function Pn(){ra||typeof document>"u"||(ra=!0,document.addEventListener("click",a=>{const e=a.target.closest("[data-annual-open-day]");if(e){window.app_openAnnualDayPlan?.(e.dataset.annualOpenDay);return}const t=a.target.closest("[data-annual-view]");if(t){window.app_toggleAnnualView?.(t.dataset.annualView);return}if(a.target.closest("[data-annual-jump-today]")){window.app_jumpToAnnualToday?.();return}const i=a.target.closest("[data-annual-year-delta]");if(i){window.app_changeAnnualYear?.(Number(i.dataset.annualYearDelta||0));return}const s=a.target.closest("[data-annual-legend]");if(s){window.app_toggleAnnualLegendFilter?.(s.dataset.annualLegend);return}a.target.closest("[data-annual-export]")&&window.AppReports?.exportAnnualListViewCSV?.(window._annualListItems||[])}),document.addEventListener("input",a=>{const e=a.target.closest("[data-annual-staff-filter]");e&&window.app_setAnnualStaffFilter?.(e.value)}),document.addEventListener("change",a=>{const e=a.target.closest("[data-annual-list-sort]");e&&window.app_setAnnualListSort?.(e.value)}),document.addEventListener("keydown",a=>{const e=a.target.closest("[data-annual-list-search]");e&&a.key==="Enter"&&window.app_setAnnualListSearch?.(e.value)}),document.addEventListener("mouseover",a=>{const e=a.target.closest("[data-annual-preview-date]");!e||e.contains(a.relatedTarget)||window.app_showAnnualHoverPreview?.(a,e.dataset.annualPreviewDate)}),document.addEventListener("mouseout",a=>{const e=a.target.closest("[data-annual-preview-date]");!e||e.contains(a.relatedTarget)||window.app_hideAnnualHoverPreview?.()}))}async function ze(){typeof window.app_setAnnualStaffFilter!="function"&&(window.app_setAnnualStaffFilter=async I=>{window.app_annualStaffFilter=String(I||"").trim();const N=document.getElementById("page-content");N&&(N.innerHTML=await ze())}),typeof window.app_toggleAnnualView!="function"&&(window.app_toggleAnnualView=async I=>{window.app_annualViewMode=I;const N=document.getElementById("page-content");N&&(N.innerHTML=await ze())}),typeof window.app_setAnnualListSearch!="function"&&(window.app_setAnnualListSearch=async I=>{window.app_annualListSearch=String(I||"").trim();const N=document.getElementById("page-content");N&&(N.innerHTML=await ze())}),typeof window.app_setAnnualListSort!="function"&&(window.app_setAnnualListSort=async I=>{window.app_annualListSort=String(I||"date-asc").trim();const N=document.getElementById("page-content");N&&(N.innerHTML=await ze())});const a=new Date,e=`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`,t=window.app_annualYear||a.getFullYear(),n=await window.AppCalendar.getPlans(),i=await window.AppDB.getAll("users").catch(()=>[]),s=`${t}-01-01`,o=`${t}-12-31`,r=await(window.AppDB.queryMany?window.AppDB.queryMany("attendance",[{field:"date",operator:">=",value:s},{field:"date",operator:"<=",value:o}]).catch(()=>window.AppDB.getAll("attendance")):window.AppDB.getAll("attendance")).catch(()=>[]);window._currentPlans=n;const d=["January","February","March","April","May","June","July","August","September","October","November","December"],l={};(i||[]).forEach(I=>{l[I.id]=I.name}),window._annualUserMap=l;const c=(I,N)=>l[I]||N||"Staff",p=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0,overdue:!0,completed:!0};window.app_annualLegendFilters=p;let m=window.app_selectedAnnualDate||(t===a.getFullYear()?e:null);m=m?String(m):null,m&&!m.startsWith(`${t}-`)&&(m=null),window.app_selectedAnnualDate=m;const u=String(window.app_annualStaffFilter||"").trim(),f=u.toLowerCase(),g=String(window.app_annualListSearch||"").trim(),y=g.toLowerCase(),k=String(window.app_annualListSort||"date-asc"),T=(i||[]).map(I=>`<option value="${$(I.name)}"></option>`).join(""),S=I=>f?String(I||"").toLowerCase().includes(f):!0,A={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11},h=(I="")=>{const N=String(I||"").trim();if(!N)return null;const P=N.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);if(!P)return null;const B=Number(P[1]),O=Number(P[2]),V=String(P[3]||"").toLowerCase(),j=Number(P[4]),W=A[V];if(!Number.isInteger(B)||!Number.isInteger(O)||!Number.isInteger(W)||!Number.isInteger(j))return null;const J=new Date(j,W,B),E=new Date(j,W,O);if(Number.isNaN(J.getTime())||Number.isNaN(E.getTime()))return null;const U=`${J.getFullYear()}-${String(J.getMonth()+1).padStart(2,"0")}-${String(J.getDate()).padStart(2,"0")}`,G=`${E.getFullYear()}-${String(E.getMonth()+1).padStart(2,"0")}-${String(E.getDate()).padStart(2,"0")}`;return G<U?null:{startDate:U,endDate:G}},w=(I,N)=>{const P=!I?.startDate&&!I?.endDate?h(I?.task||""):null,B=I?.startDate||P?.startDate||N,O=I?.endDate||P?.endDate||I?.startDate||N;return{startDate:B,endDate:O}},v=(I,N,P)=>{const{startDate:B,endDate:O}=w(I,N);return!B||!O?N===P:!(P<B||P>O||I?.completedDate&&I.completedDate<P)},_=(n.workPlans||[]).filter(I=>{if((I.planScope||"personal")==="annual"){if(!f)return!0;const B=c(I.userId,I.userName);return S(B)?!0:(I.plans||[]).some(O=>{const V=c(O.assignedTo||I.userId,B),j=(O.tags||[]).map(W=>W.name||W).join(" ");return S(V)||S(j)})}if(!f)return!0;const P=c(I.userId,I.userName);return S(P)?!0:(I.plans||[]).some(B=>{const O=c(B.assignedTo||I.userId,P),V=(B.tags||[]).map(j=>j.name||j).join(" ");return S(O)||S(V)})}),L=(n.leaves||[]).filter(I=>S(c(I.userId,I.userName))),b=(r||[]).filter(I=>{if(!String(I.date||"").startsWith(String(t)))return!1;const P=I.user_id||I.userId,B=c(P,"");return f?S(B):!0}),x=(I,N,P)=>{const B=`${P}-${String(N+1).padStart(2,"0")}-${String(I).padStart(2,"0")}`,O=L.some(U=>B>=U.startDate&&B<=U.endDate),V=!f&&(n.events||[]).some(U=>U.date===B),j=b.some(U=>U.date===B),W=_.some(U=>!Array.isArray(U.plans)||!U.plans.length?U.date===B:U.plans.some(G=>v(G,U.date,B)))||j;let J="",E=!1;if(W){const U=_.filter(q=>!Array.isArray(q.plans)||!q.plans.length?q.date===B:q.plans.some(Q=>v(Q,q.date,B)));let G="to-be-started";U.forEach(q=>{(q.plans||[]).forEach(Q=>{if(!v(Q,q.date,B))return;const{startDate:ee,endDate:ne}=w(Q,q.date);ee&&ne&&ee!==ne&&ne===B&&(E=!0);const fe=Q.completedDate||ne||q.date||B,ve=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(fe,Q.status):Q.status||"pending";ve==="overdue"?G="overdue":ve==="in-process"&&G!=="overdue"?G="in-process":ve==="completed"&&G!=="overdue"&&G!=="in-process"&&(G="completed")})}),j&&G==="to-be-started"&&(G="completed"),J=G}return{hasLeave:O,hasEvent:V,hasWork:W,workStatus:J,hasRangeEnd:E}};let D="";for(let I=0;I<12;I++){const N=new Date(t,I,1).getDay(),P=new Date(t,I+1,0).getDate();let B="";for(let O=0;O<N;O++)B+='<div class="annual-day empty"></div>';for(let O=1;O<=P;O++){const V=x(O,I,t),j=O===a.getDate()&&I===a.getMonth()&&t===a.getFullYear(),W=`${t}-${String(I+1).padStart(2,"0")}-${String(O).padStart(2,"0")}`,J=V.hasLeave&&p.leave,E=V.hasEvent&&p.event,U=V.hasWork&&p.work&&(V.workStatus==="overdue"?p.overdue:V.workStatus==="completed"?p.completed:!0),G=J||E||U,q=U?`has-work work-${V.workStatus}`:"";B+=`
                <div class="annual-day ${j?"today":""} ${q} ${m===W?"selected":""} ${G?"":"annual-day-muted"}" data-annual-open-day="${W}" data-annual-preview-date="${W}">
                    ${O}
                    <div class="dot-container">
                        ${J?'<span class="status-dot dot-leave"></span>':""}
                        ${E?'<span class="status-dot dot-event"></span>':""}
                        ${U?'<span class="status-dot dot-work"></span>':""}
                        ${V.hasRangeEnd?'<span class="status-dot" title="Task ends today" style="background:#f97316;"></span>':""}
                    </div>
                </div>`}D+=`
            <div class="annual-month-card">
                <div class="annual-month-head">
                    <span class="annual-month-title">${d[I]}</span>
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
            </div>`}const M=window.app_annualViewMode||"grid",R=(()=>{const I=[],N=new Set,P=E=>{if(!E)return"";const U=String(E).replace(/_/g,"-").toLowerCase();return{"in-process":"In Process","to-be-started":"To Be Started","not-completed":"Not Completed",completed:"Completed",overdue:"Overdue",pending:"Pending",approved:"Approved",holiday:"Holiday",event:"Event"}[U]||U.replace(/\b\w/g,q=>q.toUpperCase())},B=(E,U)=>U||(window.AppCalendar&&E?window.AppCalendar.getSmartTaskStatus(E,U):"pending");if(!f&&window.AppAnalytics){const E=new Date(t,0,1),U=new Date(t,11,31);for(let G=new Date(E);G<=U;G.setDate(G.getDate()+1)){const q=G.toISOString().split("T")[0],Q=window.AppAnalytics.getDayType(G);Q==="Holiday"?I.push({date:q,type:"holiday",title:"Company Holiday (Weekend)",staffName:"All Staff",assignedBy:"System",assignedTo:"All Staff",selfAssigned:!1,dueDate:q,status:"holiday",comments:"",scope:"Shared"}):Q==="Half Day"&&I.push({date:q,type:"event",title:"Half Working Day (Sat)",staffName:"All Staff",assignedBy:"System",assignedTo:"All Staff",selfAssigned:!1,dueDate:q,status:"event",comments:"",scope:"Shared"})}}L.forEach(E=>{const U=new Date(E.startDate),G=new Date(E.endDate||E.startDate),q=c(E.userId,E.userName);for(let Q=new Date(U);Q<=G;Q.setDate(Q.getDate()+1)){const ee=Q.toISOString().split("T")[0];ee.startsWith(String(t))&&I.push({date:ee,type:"leave",title:`${q} (${E.type||"Leave"})`,staffName:q,assignedBy:q,assignedTo:q,selfAssigned:!0,dueDate:E.endDate||E.startDate||ee,status:(E.status||"approved").toLowerCase(),comments:E.reason||"",scope:"Personal"})}}),(n.events||[]).forEach(E=>{if(!f&&String(E.date||"").startsWith(String(t))){const U=[String(E.date||"").trim(),String(E.title||"").trim().toLowerCase(),String(E.type||"event").trim().toLowerCase(),String(E.createdById||E.createdByName||"").trim().toLowerCase()].join("|");if(N.has(U))return;N.add(U),I.push({date:E.date,type:E.type||"event",title:E.title||"Company Event",staffName:"All Staff",assignedBy:E.createdByName||"Admin",assignedTo:"All Staff",selfAssigned:!1,dueDate:E.date,status:"event",comments:E.description||"",scope:"Shared"})}}),_.forEach(E=>{if(String(E.date||"").startsWith(String(t))){const U=(E.planScope||"personal")==="annual",G=c(E.userId,E.userName)||(U?"All Staff":"Staff"),q=U?"Annual":"Personal",Q=E.date;E.plans&&E.plans.length>0&&E.plans.forEach(ee=>{const ne=U?E.createdByName||ee.taggedByName||"Admin":ee.taggedByName||G,fe=ee.assignedTo||E.userId,ve=U?ne:c(fe,G),_t=(ee.tags||[]).map(dt=>dt.name||dt).filter(Boolean),{startDate:Tt,endDate:Ue}=w(ee,Q),ot=ee.completedDate||Ue||Q,rt=B(ot,ee.status),It=ee.subPlans&&ee.subPlans.length?ee.subPlans.join("; "):ee.comment||ee.notes||"";I.push({date:Tt||Q,type:"work",title:ee.task||"Work Plan Task",staffName:U?ne:ve,assignedBy:ne,assignedTo:U?ne:ve,selfAssigned:ne===ve,dueDate:ee.dueDate||Ue||Q,status:rt,comments:It,tags:_t,scope:q})})}}),b.forEach(E=>{const U=E.user_id||E.userId,G=c(U,"Staff"),q=(E.workDescription||E.location||"").trim()||"Manual log entry";I.push({date:E.date,type:"work",title:q,staffName:G,assignedBy:G,assignedTo:G,selfAssigned:!0,dueDate:E.date,status:"completed",comments:q,tags:["Manual Log"],scope:"Personal"})});const O=[],V=new Set;I.forEach(E=>{const U=`${E.date||""}|${E.type||""}|${E.title||""}|${E.staffName||""}|${E.status||""}`.toLowerCase();V.has(U)||(V.add(U),O.push(E))}),O.sort((E,U)=>E.date.localeCompare(U.date)||E.type.localeCompare(U.type)),O.forEach(E=>{E.statusLabel=P(E.status),E.statusClass=String(E.status||"pending").replace(/[^a-z0-9]+/gi,"-").toLowerCase()});let j=y?O.filter(E=>[E.date,E.staffName,E.title,E.statusLabel,E.comments].join(" ").toLowerCase().includes(y)):O;const W={"date-asc":(E,U)=>String(E.date||"").localeCompare(String(U.date||"")),"date-desc":(E,U)=>String(U.date||"").localeCompare(String(E.date||"")),"staff-asc":(E,U)=>String(E.staffName||"").localeCompare(String(U.staffName||"")),"staff-desc":(E,U)=>String(U.staffName||"").localeCompare(String(E.staffName||"")),"status-asc":(E,U)=>String(E.statusLabel||"").localeCompare(String(U.statusLabel||"")),"status-desc":(E,U)=>String(U.statusLabel||"").localeCompare(String(E.statusLabel||""))},J=W[k]||W["date-asc"];return j.slice().sort(J)})();return window._annualListItems=R,setTimeout(()=>Pn(),0),`
        <div class="annual-plan-shell annual-v2-shell">
            <div class="card annual-plan-header annual-v2-header">
                <div class="annual-plan-title-wrap annual-v2-title-wrap">
                    <h2 class="annual-plan-title annual-v2-title">NGO Annual Planning</h2>
                    <p class="annual-plan-subtitle annual-v2-subtitle">Overview of activities for ${t}.</p>
                </div>
                <div class="annual-plan-controls annual-v2-controls">
                    <div class="annual-staff-filter annual-v2-staff-filter">
                        <i class="fa-solid fa-user"></i>
                        <input type="text" list="annual-staff-names" value="${$(u)}" placeholder="Filter by staff name" data-annual-staff-filter="1">
                        <datalist id="annual-staff-names">${T}</datalist>
                    </div>
                    <div class="annual-view-toggle annual-v2-view-toggle">
                        <button data-annual-view="grid" class="annual-toggle-btn annual-v2-toggle-btn ${M==="grid"?"active":""}">
                            <i class="fa-solid fa-calendar-days"></i> Grid
                        </button>
                        <button data-annual-view="list" class="annual-toggle-btn annual-v2-toggle-btn ${M==="list"?"active":""}">
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

            <div id="annual-grid-view" style="display:${M==="grid"?"block":"none"};">
                <div class="card annual-legend-bar annual-v2-legend-bar">
                    <button class="annual-legend-chip ${p.leave?"active":""}" data-annual-legend="leave"><span class="annual-dot leave"></span> Staff Leave</button>
                    <button class="annual-legend-chip ${p.event?"active":""}" data-annual-legend="event"><span class="annual-dot event"></span> Company Event</button>
                    <button class="annual-legend-chip ${p.work?"active":""}" data-annual-legend="work"><span class="annual-dot work"></span> Work Plan</button>
                    <button class="annual-legend-chip ${p.overdue?"active":""}" data-annual-legend="overdue">Overdue Border</button>
                    <button class="annual-legend-chip ${p.completed?"active":""}" data-annual-legend="completed">Completed Border</button>
                </div>
                <div class="annual-grid-layout annual-v2-grid-layout">
                    <div class="annual-plan-grid annual-v2-plan-grid">
                        ${D}
                    </div>
                </div>
            </div>

            <div id="annual-list-view" style="display:${M==="list"?"block":"none"};">
                <div class="card annual-list-card annual-v2-list-card">
                    <div class="annual-list-head annual-v2-list-head">
                        <h4>Annual Timeline</h4>
                        <div class="annual-list-actions annual-v2-list-actions">
                            <div class="annual-list-search-wrap annual-v2-search-wrap">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="text" value="${$(g)}" placeholder="Search list..." data-annual-list-search="1">
                            </div>
                            <select class="annual-v2-sort-select" data-annual-list-sort="1">
                                <option value="date-asc" ${k==="date-asc"?"selected":""}>Date: Oldest First</option>
                                <option value="date-desc" ${k==="date-desc"?"selected":""}>Date: Newest First</option>
                                <option value="staff-asc" ${k==="staff-asc"?"selected":""}>Staff: A-Z</option>
                                <option value="staff-desc" ${k==="staff-desc"?"selected":""}>Staff: Z-A</option>
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
                                ${R.map(I=>`
                                    <div class="annual-list-row">
                                        <div class="annual-list-cell">${I.date}</div>
                                        <div class="annual-list-cell">${$(I.staffName)}</div>
                                        <div class="annual-list-cell annual-list-task">${$(I.title)}</div>
                                        <div class="annual-list-cell">${$(I.assignedBy)}</div>
                                        <div class="annual-list-cell"><span class="annual-list-status status-${I.statusClass}">${I.statusLabel}</span></div>
                                        <div class="annual-list-cell annual-list-comments">${$(I.comments||"--")}</div>
                                        <div class="annual-list-cell">${I.scope}</div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                    `}
                </div>
            </div>
        </div>`}let da=!1;function Nn(){da||typeof document>"u"||(da=!0,document.addEventListener("click",a=>{const e=a.target.closest("[data-timesheet-open-day]");if(e){window.app_openTimesheetDayDetail?.(e.dataset.timesheetOpenDay);return}if(a.target.closest("[data-timesheet-request-leave]")){const c=document.getElementById("leave-modal");c&&(c.style.display="flex");return}if(a.target.closest("[data-timesheet-manual-log]")){document.dispatchEvent(new CustomEvent("open-log-modal"));return}const i=a.target.closest("[data-timesheet-month-delta]");if(i){window.app_changeTimesheetMonth?.(Number(i.dataset.timesheetMonthDelta||0));return}if(a.target.closest("[data-timesheet-today]")){window.app_jumpTimesheetToday?.();return}const o=a.target.closest("[data-timesheet-export]");if(o){window.AppReports?.exportUserLogs?.(o.dataset.timesheetExportUser||"");return}const r=a.target.closest("[data-timesheet-edit-log]");if(r){window.app_editWorkSummary?.(r.dataset.timesheetEditLog);return}const d=a.target.closest("[data-timesheet-detail-log]");if(d){const c=d.dataset.timesheetDetailLog;alert("Detailed analysis for log "+c+" coming soon!");return}const l=a.target.closest("[data-timesheet-close-modal]");l&&l.closest(".modal-overlay")?.remove()}),document.addEventListener("change",a=>{const e=a.target.closest("[data-timesheet-view-select]");e&&window.app_toggleTimesheetViewSelect?.(e.value)}))}async function je(){setTimeout(()=>Nn(),0),typeof window.app_setTimesheetView!="function"&&(window.app_setTimesheetView=async h=>{window.app_timesheetViewMode=h==="calendar"?"calendar":"list";const w=document.getElementById("page-content");w&&(w.innerHTML=await je())}),typeof window.app_changeTimesheetMonth!="function"&&(window.app_changeTimesheetMonth=async h=>{const w=new Date,v=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:w.getMonth(),_=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:w.getFullYear(),L=new Date(_,v,1);L.setMonth(L.getMonth()+h),window.app_timesheetMonth=L.getMonth(),window.app_timesheetYear=L.getFullYear();const b=document.getElementById("page-content");b&&(b.innerHTML=await je())}),typeof window.app_jumpTimesheetToday!="function"&&(window.app_jumpTimesheetToday=async()=>{const h=new Date;window.app_timesheetMonth=h.getMonth(),window.app_timesheetYear=h.getFullYear();const w=document.getElementById("page-content");w&&(w.innerHTML=await je())});const a=window.AppAuth.getUser(),e=await window.AppAttendance.getLogs(),t=await window.AppCalendar.getPlans().catch(()=>({workPlans:[]})),n=new Date,i=window.app_timesheetViewMode||"list",s=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:n.getMonth(),o=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:n.getFullYear(),r=new Date(o,s,1).toLocaleString("en-US",{month:"long",year:"numeric"}),d=`${o}-${String(s+1).padStart(2,"0")}-01`,l=`${o}-${String(s+1).padStart(2,"0")}-31`,c=e.filter(h=>h.date&&h.date>=d&&h.date<=l),p=(t.workPlans||[]).filter(h=>h.userId===a.id&&h.date&&h.date>=d&&h.date<=l),m={};c.forEach(h=>{m[h.date]||(m[h.date]=[]),m[h.date].push(h)});const u={};p.forEach(h=>{u[h.date]||(u[h.date]=[]),(Array.isArray(h.plans)?h.plans:[]).forEach(v=>{u[h.date].push(v.task||"Planned task")})}),window._timesheetLogsByDate=m,window._timesheetPlansByDate=u;let f=0,g=0;const y=new Set;c.forEach(h=>{h.durationMs&&(f+=h.durationMs/(1e3*60)),(h.lateCountable||window.AppAttendance&&window.AppAttendance.normalizeType(h.type)==="Late")&&g++,h.date&&y.add(h.date)});const k=`${Math.floor(f/60)}h ${Math.round(f%60)}m`,T=Math.floor(g/(C?.LATE_GRACE_COUNT||3))*(C?.LATE_DEDUCTION_PER_BLOCK||.5),S=h=>window.AppAttendance&&window.AppAttendance.normalizeType?window.AppAttendance.normalizeType(h):h;window.app_editWorkSummary=async h=>{const v=(await window.AppAttendance.getLogs()).find(b=>b.id===h),_=v?v.workDescription:"",L=await window.appPrompt("Update Work Summary:",_||"",{title:"Update Work Summary",confirmText:"Save"});if(L!==null){await window.AppAttendance.updateLog(h,{workDescription:L});const b=document.getElementById("page-content");b&&(b.innerHTML=await je())}},window.app_switchTimesheetPanel=(h,w)=>{const v=h==="calendar"?"calendar":"list";window.app_timesheetViewMode=v;const _=document.getElementById("timesheet-list-panel"),L=document.getElementById("timesheet-calendar-panel"),b=document.getElementById("timesheet-view-select");_&&(_.style.display=v==="list"?"block":"none"),L&&(L.style.display=v==="calendar"?"block":"none"),b&&(b.value=v);const x=w&&w.closest?w.closest(".timesheet-view-toggle"):null;(x?x.querySelectorAll(".annual-toggle-btn"):[]).forEach(M=>M.classList.remove("active")),w&&w.classList&&w.classList.add("active")},window.app_openTimesheetDayDetail=h=>{const w=window._timesheetLogsByDate&&window._timesheetLogsByDate[h]||[],v=window._timesheetPlansByDate&&window._timesheetPlansByDate[h]||[],_=w.length?w.map(D=>`
                <div class="timesheet-day-detail-item">
                    <div class="timesheet-day-detail-head">
                        <span>${$(D.checkIn||"--")} - ${$(D.checkOut||"--")}</span>
                        <span class="timesheet-day-status-chip">${$(S(D.type))}</span>
                    </div>
                    <div class="timesheet-day-detail-text">${$(D.workDescription||D.location||"No summary")}</div>
                    ${D.id&&D.id!=="active_now"?`<button type="button" class="action-btn secondary" data-timesheet-edit-log="${D.id}">Edit</button>`:""}
                </div>
            `).join(""):'<div class="timesheet-day-detail-empty">No attendance logs for this date.</div>',L=v.length?v.map(D=>`<div class="timesheet-day-plan-item">${$(D)}</div>`).join(""):'<div class="timesheet-day-detail-empty">No planned tasks for this date.</div>',b=`timesheet-day-detail-${Date.now()}`,x=`
            <div class="modal-overlay" id="${b}" style="display:flex;">
                <div class="modal-content" style="max-width:560px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <h3 style="margin:0;">${$(h)} Details</h3>
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
            </div>`;typeof window.app_showModal=="function"?window.app_showModal(x,b):(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",x)};const A=()=>{const h=new Date(o,s,1).getDay(),w=new Date(o,s+1,0).getDate();let v="";for(let _=0;_<h;_++)v+='<div class="timesheet-cal-day empty"></div>';for(let _=1;_<=w;_++){const L=`${o}-${String(s+1).padStart(2,"0")}-${String(_).padStart(2,"0")}`,b=m[L]||[],x=b.length?b.slice().sort((O,V)=>{const j=W=>{const J=S(W.type);return J==="Absent"?4:J==="Half Day"?3:J==="Late"?2:J==="Present (Late Waived)"?1:0};return j(V)-j(O)})[0]:null,D=u[L]||[],M=L===new Date().toISOString().split("T")[0],R=x?S(x.type):"",I=x?R==="Absent"?"absent":R==="Half Day"||R==="Late"?"late":"present":"none",N=x?R:"No log",P=b.map(O=>(O.workDescription||O.location||"").trim()).filter(Boolean),B=P.length?P.slice(0,2).map(O=>`<div class="timesheet-cal-plan">${$(O)}</div>`).join("")+(P.length>2?`<div class="timesheet-cal-more">+${P.length-2} more logs</div>`:""):D.length?D.slice(0,2).map(O=>`<div class="timesheet-cal-plan">${$(O)}</div>`).join("")+(D.length>2?`<div class="timesheet-cal-more">+${D.length-2} more</div>`:""):'<div class="timesheet-cal-empty">No plans</div>';v+=`
                <div class="timesheet-cal-day ${M?"today":""}" data-timesheet-open-day="${L}" style="cursor:pointer;">
                    <div class="timesheet-cal-day-head">
                        <span class="timesheet-cal-date">${_}</span>
                        <span class="timesheet-cal-attendance ${I}">${N}</span>
                    </div>
                    <div class="timesheet-cal-plans">${B}</div>
                </div>`}return`
            <div class="timesheet-calendar-wrap">
                <div class="timesheet-calendar-weekdays">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div class="timesheet-calendar-grid">${v}</div>
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
                    <div class="value">${k}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Days Present</div>
                    <div class="value">${y.size} <span class="timesheet-stat-sub">Days</span></div>
                </div>
                <div class="stat-card">
                    <div class="label">Late Count</div>
                    <div class="value" style="color:${g>2?"var(--accent)":"var(--text-main)"}">${g}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Late Deduction</div>
                    <div class="value">${T.toFixed(1)} <span class="timesheet-stat-sub">Days</span></div>
                </div>
            </div>

            <div class="timesheet-modern-toolbar">
                <div class="timesheet-view-mode-wrap">
                    <label for="timesheet-view-select" class="timesheet-view-label">View</label>
                    <select id="timesheet-view-select" class="timesheet-view-select" data-timesheet-view-select="1">
                        <option value="list" ${i==="list"?"selected":""}>List View</option>
                        <option value="calendar" ${i==="calendar"?"selected":""}>Calendar View</option>
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

            <div id="timesheet-list-panel" class="table-container mobile-table-card timesheet-modern-table-wrap" style="display:${i==="list"?"block":"none"};">
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
                        ${c.length?c.map(h=>`
                            <tr>
                                <td data-label="Date">
                                    <div class="timesheet-log-date">${h.date||"Active Session"}</div>
                                    <div class="timesheet-log-id">Log ID: ${h.id==="active_now"?"N/A":h.id.slice(-4)}</div>
                                </td>
                                <td data-label="Timings">
                                    <div class="time-badge">
                                        <span class="in"><i class="fa-solid fa-caret-right"></i> ${h.checkIn}</span>
                                        <span class="out"><i class="fa-solid fa-caret-left"></i> ${h.checkOut||"--:--"}</span>
                                    </div>
                                </td>
                                <td data-label="Status">
                                    <div class="timesheet-status-col">
                                        <span class="badge" style="background:${S(h.type)==="Absent"?"#fef2f2":S(h.type)==="Half Day"||S(h.type)==="Late"?"#fff7ed":"#f0fdf4"}; color:${S(h.type)==="Absent"?"#991b1b":S(h.type)==="Half Day"||S(h.type)==="Late"?"#c2410c":"#15803d"}; border:1px solid ${S(h.type)==="Absent"?"#fecaca":S(h.type)==="Half Day"||S(h.type)==="Late"?"#fed7aa":"#dcfce7"};">${S(h.type)}</span>
                                        <div class="timesheet-duration">${h.duration||"--"}</div>
                                    </div>
                                </td>
                                <td data-label="Work Summary" class="timesheet-summary-cell">
                                    <div class="timesheet-summary-wrap">
                                        <div class="dashboard-viewing-meta">
                                            <div class="timesheet-summary-text">${$(h.workDescription)||'<span class="timesheet-empty-summary">No summary provided</span>'}</div>
                                            ${h.location?`<div class="timesheet-location"><i class="fa-solid fa-location-dot"></i> ${$(h.location)}</div>`:""}
                                        </div>
                                        ${h.id!=="active_now"?`<button data-timesheet-edit-log="${h.id}" class="timesheet-edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>`:""}
                                    </div>
                                </td>
                                <td data-label="Detail" class="text-right">
                                    ${h.id!=="active_now"?`<button class="icon-btn timesheet-detail-btn" title="View Detailed Log" data-timesheet-detail-log="${h.id}"><i class="fa-solid fa-circle-info"></i></button>`:'<span class="timesheet-live">SESSION LIVE</span>'}
                                </td>
                            </tr>
                        `).join(""):'<tr><td colspan="5" class="timesheet-empty-row">No attendance records found for this period.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div id="timesheet-calendar-panel" style="display:${i==="calendar"?"block":"none"};">
                ${A()}
            </div>
        </div>
    `}async function Na(){try{const a=window.AppAuth.getUser();if(!a)return'<div class="card">User state lost. Please <a href="#" onclick="window.AppAuth.logout()">Login Again</a></div>';const e=a.role==="Administrator"||a.isAdmin,t=e?await window.AppDB.getAll("users"):[],n=e&&window.app_profileTargetUserId?window.app_profileTargetUserId:a.id,i=e&&t.find(w=>w.id===n)||a,s=(w,v)=>{const _=String(w||"").trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(_))return"NA";const L=_.replace(/-/g,""),b=String(v||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase().slice(-3)||"USR";return`EMP-${L}-${b}`},o=typeof i.joinDate=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(i.joinDate)?i.joinDate:"",r=o?i.employeeId||s(o,i.id):"NA",d=Number(i.birthDay||0),l=Number(i.birthMonth||0),c=Number(i.birthYear||0),p=[d?String(d).padStart(2,"0"):"--",l>=1&&l<=12?new Date(2026,l-1,1).toLocaleString("en-US",{month:"long"}):"--",c?String(c):""].filter(Boolean).join(" ").trim(),[m,u,f]=await Promise.all([window.AppAnalytics?window.AppAnalytics.getUserMonthlyStats(i.id):null,window.AppAnalytics?window.AppAnalytics.getUserYearlyStats(i.id):null,window.AppLeaves?window.AppLeaves.getUserLeaves(i.id):[]]);window.app_changeProfileStaff=async w=>{window.app_profileTargetUserId=w||a.id;const v=document.getElementById("page-content");v&&(v.innerHTML=await Na())},window.app_confirmSignOut=()=>{confirm("Are you sure you want to sign out?")&&window.AppAuth.logout()};const g=i.id===a.id,y=m?.attendanceRate??"—",k=m?.punctualityRate??"—",T=m?.totalHours??"—",S=u?.totalDays??"—",A=w=>w==="Approved"?"#16a34a":w==="Rejected"?"#dc2626":"#d97706",h=(i.name||"U").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();return`
            <div class="pro-profile-root">

                <!-- ── Hero Banner ── -->
                <div class="pro-profile-hero">
                    <div class="pro-profile-hero-bg"></div>
                    <div class="pro-profile-hero-inner">
                        <!-- Avatar -->
                        <div class="pro-profile-avatar-ring">
                            ${i.avatar?`<img src="${$(i.avatar)}" alt="${$(i.name)}" class="pro-profile-avatar-img">`:`<div class="pro-profile-avatar-initials">${h}</div>`}
                            <span class="pro-profile-status-dot ${i.status==="in"?"online":"offline"}"
                                  title="${i.status==="in"?"Currently checked in":"Not checked in"}"></span>
                        </div>

                        <!-- Identity -->
                        <div class="pro-profile-identity">
                            <div class="pro-profile-name-row">
                                <h1 class="pro-profile-name">${$(i.name)}</h1>
                                <span class="pro-profile-role-badge">${$(i.role||"Staff")}</span>
                            </div>
                            <div class="pro-profile-email">
                                <i class="fa-solid fa-envelope"></i>
                                ${$(i.email||"—")}
                            </div>
                            <div class="pro-profile-meta-row">
                                <span class="pro-profile-chip">
                                    <i class="fa-solid fa-id-card"></i>${$(r)}
                                </span>
                                ${o?`<span class="pro-profile-chip">
                                    <i class="fa-solid fa-calendar-check"></i>Joined ${o}
                                </span>`:""}
                                ${i.department?`<span class="pro-profile-chip">
                                    <i class="fa-solid fa-building"></i>${$(i.department)}
                                </span>`:""}
                            </div>
                        </div>

                        <!-- Header Actions -->
                        <div class="pro-profile-header-actions">
                            ${e?`
                            <select class="pro-profile-staff-picker" onchange="window.app_changeProfileStaff(this.value)">
                                <option value="">My Profile</option>
                                ${t.map(w=>`<option value="${w.id}" ${w.id===n?"selected":""}>${$(w.name)}</option>`).join("")}
                            </select>`:""}
                            ${g?`
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
                        <div class="pro-stat-value">${y}${typeof y=="number"?"%":""}</div>
                        <div class="pro-stat-label">Attendance</div>
                    </div>
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-clock pro-stat-icon" style="color:#f59e0b;"></i>
                        <div class="pro-stat-value">${k}${typeof k=="number"?"%":""}</div>
                        <div class="pro-stat-label">Punctuality</div>
                    </div>
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-hourglass-half pro-stat-icon" style="color:#10b981;"></i>
                        <div class="pro-stat-value">${T}${typeof T=="number"?"h":""}</div>
                        <div class="pro-stat-label">Hours (MTD)</div>
                    </div>
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-calendar-days pro-stat-icon" style="color:#8b5cf6;"></i>
                        <div class="pro-stat-value">${S}</div>
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
                                <span class="pro-card-sub">${f.length} record${f.length!==1?"s":""}</span>
                            </div>
                            ${f.length?`
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
                                    ${f.slice(0,8).map(w=>`
                                    <tr>
                                        <td>${$(w.startDate||"—")}</td>
                                        <td>${$(w.endDate||"—")}</td>
                                        <td>${$(w.type||"—")}</td>
                                        <td>${w.daysCount??"—"}</td>
                                        <td>
                                            <span class="pro-status-pill" style="background:${A(w.status)}18;color:${A(w.status)};">
                                                ${$(w.status||"Pending")}
                                            </span>
                                        </td>
                                    </tr>`).join("")}
                                </tbody>
                            </table>
                            ${f.length>8?`<div class="pro-table-footer">Showing 8 of ${f.length} records</div>`:""}
                            `:'<div class="pro-empty-state"><i class="fa-regular fa-folder-open"></i><p>No leave records found.</p></div>'}
                        </div>

                        <!-- Yearly Breakdown -->
                        ${u?.breakdown?`
                        <div class="pro-card" style="margin-top:1rem;">
                            <div class="pro-card-head">
                                <span class="pro-card-title"><i class="fa-solid fa-chart-bar"></i> Yearly Breakdown</span>
                                <span class="pro-card-sub">${u.label||""}</span>
                            </div>
                            <div class="pro-breakdown-grid">
                                ${Object.entries(u.breakdown||{}).filter(([,w])=>w>0).map(([w,v])=>`
                                <div class="pro-breakdown-chip">
                                    <span class="pro-breakdown-count">${v}</span>
                                    <span class="pro-breakdown-key">${$(w)}</span>
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
                                ${[["Department",i.department||"Operations"],["Role",i.role||"Staff"],["Level",i.level||"—"],["Reports To",i.reportsTo||"Admin"],["Employee ID",r],["Join Date",o||"N/A"],["Birthday",p||"N/A"],["Payroll Cycle","Monthly (25th)"]].map(([w,v])=>`
                                <div class="pro-detail-row">
                                    <div class="pro-detail-label">${w}</div>
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
                                ${g?`
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
        `}catch(a){return console.error("Profile Render Error:",a),`<div class="card error-card">Failed to load profile: ${$(a.message)}</div>`}}async function Ba(a=null,e=null){const t=window.AppAuth.getUser(),n=window.app_hasPerm("attendance","admin",t),i=await window.AppDB.getAll("users"),s=new Date,o=a!==null?parseInt(a):s.getMonth(),r=e!==null?parseInt(e):s.getFullYear(),d=`${r}-${String(o+1).padStart(2,"0")}-01`,l=`${r}-${String(o+1).padStart(2,"0")}-31`;let c=[];try{c=(await window.AppDB.query("attendance","date",">=",d)).filter(v=>v.date<=l)}catch(w){console.warn("MasterSheet: query failed, fetching all attendance logs",w),c=(await window.AppDB.getAll("attendance")).filter(_=>_.date>=d&&_.date<=l)}const p=new Date(r,o+1,0).getDate(),m=Array.from({length:p},(w,v)=>v+1),u=["January","February","March","April","May","June","July","August","September","October","November","December"],f=w=>{const v=new Date(`${w}T00:00:00`),_=v.getDay();if(_===0)return"holiday";if(_===6){const L=Math.floor((v.getDate()-1)/7)+1;if(L===2||L===4)return"holiday";if(L===1||L===3||L===5)return"halfday"}return"working"},g=w=>String(w?.type||"").includes("Leave")||w?.location==="On Leave",y=w=>!w||!w.checkOut||w.checkOut==="Active Now"?!1:typeof w.activityScore<"u"||typeof w.locationMismatched<"u"||!!w.checkOutLocation||typeof w.outLat<"u"||typeof w.outLng<"u",k=w=>!w||!w.autoCheckout?"":String(w.missedCheckoutReasonStatus||"").toLowerCase()==="approved"||w.missedCheckoutApprovedAsFullDay?"Auto-closed due to missed checkout. Admin approved and converted this entry to full day.":String(w.missedCheckoutReasonStatus||"").toLowerCase()==="rejected"?"Auto-closed due to missed checkout. Admin rejected the submitted reason.":String(w.missedCheckoutReasonStatus||"").toLowerCase()==="approved"?"Auto-closed due to missed checkout. Admin approved the submitted reason.":"Auto-closed due to missed checkout.",T=w=>w?.isManualOverride?4:g(w)?3:y(w)?2:1,S=w=>{if(Object.prototype.hasOwnProperty.call(w||{},"attendanceEligible"))return w.attendanceEligible===!0;const v=String(w?.entrySource||"");return v==="staff_manual_work"?!1:v==="admin_override"||v==="checkin_checkout"||w?.isManualOverride||w?.location==="Office (Manual)"||w?.location==="Office (Override)"||typeof w?.activityScore<"u"||typeof w?.locationMismatched<"u"||typeof w?.autoCheckout<"u"||!!w?.checkOutLocation||typeof w?.outLat<"u"||typeof w?.outLng<"u"?!0:String(w?.type||"").includes("Leave")||w?.location==="On Leave"},A=new Date().toISOString().split("T")[0],h=w=>{const v=new Date(w);return`${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,"0")}-${String(v.getDate()).padStart(2,"0")}`};return window.app_refreshMasterSheet=async()=>{const w=document.getElementById("sheet-month")?.value,v=document.getElementById("sheet-year")?.value,_=document.getElementById("page-content");_&&(_.innerHTML=await Ba(w,v))},`
        <div class="dashboard-grid dashboard-modern dashboard-admin-view">
            <div class="card full-width">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                    <div>
                        <h2 style="font-size:1.1rem; margin-bottom:0.1rem;">Attendance Sheet</h2>
                        <p style="color:var(--text-muted); font-size:0.75rem;">Master grid view for all staff logs.</p>
                    </div>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <select onchange="window.app_refreshMasterSheet()" id="sheet-month" style="padding:0.4rem; border-radius:6px; border:1px solid #ddd; font-size:0.8rem;">
                            ${u.map((w,v)=>`<option value="${v}" ${v===o?"selected":""}>${w}</option>`).join("")}
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
                                ${m.map(w=>`<th style="text-align:center; min-width: 28px; padding:4px; border-right: 1px solid #eee; font-size:0.75rem;">${w}</th>`).join("")}
                            </tr>
                        </thead>
                        <tbody>
                            ${i.sort((w,v)=>w.name.localeCompare(v.name)).map((w,v)=>`
                                <tr>
                                    <td style="text-align:center; border-right: 1px solid #eee; position: sticky; left: 0; background: #fff; z-index: 5; padding:4px; font-size:0.75rem;">${v+1}</td>
                                    <td style="border-right: 2px solid #ddd; position: sticky; left: 35px; background: #fff; z-index: 5; font-weight: 500; padding:4px;">
                                        <div style="display:flex; flex-direction:column;">
                                            <span style="font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px;">${$(w.name)}</span>
                                            <span style="font-size:0.65rem; color:#666; font-weight:400;">${$(w.dept||"General")}</span>
                                        </div>
                                    </td>
                                    ${m.map(_=>{const L=`${r}-${String(o+1).padStart(2,"0")}-${String(_).padStart(2,"0")}`,x=c.filter(P=>(P.userId===w.id||P.user_id===w.id)&&P.date===L).filter(S),D=f(L);let M="-",R="",I="No log";if(x.length>0){const P=x.slice().sort((j,W)=>T(W)-T(j))[0],B=P.autoCheckout&&String(P.missedCheckoutReasonStatus||"").toLowerCase()==="approved"?"Present":P.type,O=window.AppAttendance&&window.AppAttendance.normalizeType?window.AppAttendance.normalizeType(B):B,V=k(P);M=O.charAt(0).toUpperCase(),I=`${P.checkIn} - ${P.checkOut||"Active"}
${O}`,V&&(I+=`
${V}`),O==="Present"?R="color: #10b981; font-weight: bold; font-size: 0.9rem;":O==="Late"?(R="color: #f59e0b; font-weight: bold;",M="L"):O==="Half Day"?(R="color: #c2410c; font-weight: bold;",M="HD"):O==="Absent"?(R="color: #ef4444; font-weight: bold;",M="A"):O.includes("Leave")?(R="color: #8b5cf6; font-weight: bold;",M="C"):O==="Work - Home"?(R="color: #0ea5e9; font-weight: bold;",M="W"):O==="On Duty"&&(R="color: #0369a1; font-weight: bold;",M="D"),P.isManualOverride&&(R="color: #be185d; font-weight: bold; background: #fdf2f8;"),V&&(M=`<span style="display:inline-flex; align-items:flex-start; gap:2px;"><span>${M}</span><span style="color:#4338ca; font-size:0.7rem; line-height:1;">•</span></span>`)}else{const P=L===A&&w.status==="in"&&w.lastCheckIn&&h(w.lastCheckIn)===L,B=typeof w.joinDate=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(w.joinDate)?L<w.joinDate:!1,O=L>A;P?(M="P",R="color: #10b981; font-weight: bold; font-size: 0.9rem;",I="Checked in (pending checkout)"):O||B?(M="-",R="color: #94a3b8; font-weight: 600;",I=O?"Future date":`Before joining date (${w.joinDate})`):D==="holiday"?(M="H",R="color: #64748b; font-weight: 700;",I="Holiday"):(M="A",R="color: #ef4444; font-weight: bold;",I="Absent")}return n||t&&(w.id===t.id||w.user_id===t.id||w.username&&t.username&&w.username===t.username||w.email&&t.email&&w.email===t.email)||(I=""),`<td style="text-align:center; ${n?"cursor:pointer;":""} border-right: 1px solid #eee; padding:2px; font-size:0.75rem; ${R}" ${I?`title="${I}"`:""} ${n?`onclick="window.app_openCellOverride('${w.id}', '${L}')"`:""}>${M}</td>`}).join("")}
                                </tr>`).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`}async function qt(a=null,e=null){let t=[],n=[],i=[],s={avgScore:0,trendData:[0,0,0,0,0,0,0],labels:[]},o=[],r=[];try{const h=new Date().toISOString().split("T")[0];a=a||h,e=e||h;const w=await Promise.allSettled([window.AppDB.getCached?window.AppDB.getCached(window.AppDB.getCacheKey("adminUsers","users",{}),C?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):window.AppDB.getAll("users"),window.AppAnalytics.getSystemPerformance(),window.AppDB.queryMany?window.AppDB.queryMany("location_audits",[],{orderBy:[{field:"timestamp",direction:"desc"}],limit:300}).catch(()=>window.AppDB.getAll("location_audits")):window.AppDB.getAll("location_audits"),window.AppLeaves.getPendingLeaves(),window.AppDB.queryMany?window.AppDB.queryMany("system_audit_logs",[],{orderBy:[{field:"createdAt",direction:"desc"}],limit:80}).catch(()=>window.AppDB.getAll("system_audit_logs")):window.AppDB.getAll("system_audit_logs")]),v=(D,M,R)=>{const I=w[D];return I&&I.status==="fulfilled"?I.value:(I&&I.status==="rejected"&&console.warn(`Admin data fetch failed for ${R}:`,I.reason),M)};t=v(0,[],"users"),s=v(1,{avgScore:0,trendData:[0,0,0,0,0,0,0],labels:[]},"performance"),o=v(2,[],"location_audits"),n=v(3,[],"pending_leaves"),r=v(4,[],"system_audit_logs"),o=o.filter(D=>{const M=new Date(D.timestamp).toISOString().split("T")[0];return M>=a&&M<=e}).sort((D,M)=>M.timestamp-D.timestamp),r=(r||[]).filter(D=>D&&D.module==="simulation"&&String(D.type||"").startsWith("legacy_dummy_cleanup_")).sort((D,M)=>Number(M.createdAt||0)-Number(D.createdAt||0)).slice(0,25);const _=window.AppAuth?.getUser?.(),L=_?t.find(D=>String(D.id)===String(_.id))||_:null,b=(Array.isArray(L?.notifications)?L.notifications:[]).filter(D=>D&&D.type==="missed-checkout-reason"&&String(D.status||"pending").toLowerCase()==="pending"&&D.logId),x=Array.from(new Set(b.map(D=>String(D.logId||"")).filter(Boolean)));i=x.length?window.AppDB.getManyByIds?await window.AppDB.getManyByIds("attendance",x):(await Promise.all(x.map(D=>window.AppDB.get("attendance",D)))).filter(Boolean):[]}catch(h){console.error("Failed to fetch admin data",h)}const d=t.filter(h=>h.status==="in").length,l=t.filter(h=>h.role==="Administrator"||h.isAdmin===!0).length,c=t.filter(h=>Number(h.birthMonth||0)>=1&&Number(h.birthDay||0)>=1).length,p=[...t].filter(h=>Number(h.birthMonth||0)>=1).sort((h,w)=>{const v=`${String(Number(h.birthMonth||99)).padStart(2,"0")}-${String(Number(h.birthDay||99)).padStart(2,"0")}-${String(h.name||"").toLowerCase()}`,_=`${String(Number(w.birthMonth||99)).padStart(2,"0")}-${String(Number(w.birthDay||99)).padStart(2,"0")}-${String(w.name||"").toLowerCase()}`;return v.localeCompare(_)}).slice(0,5),m=s.avgScore>70?"Optimal":s.avgScore>40?"Good":"Low",u=s.avgScore>70?"#166534":s.avgScore>40?"#854d0e":"#991b1b",f=s.avgScore>70?"#f0fdf4":s.avgScore>40?"#fefce8":"#fef2f2",g=window.AppAuth?.getUser?.(),y=g?t.find(h=>String(h.id)===String(g.id))||g:null,k=Array.isArray(y?.notifications)?y.notifications:[],T=new Map(t.map(h=>[String(h.id),h])),S=(i||[]).filter(h=>h&&h.missedCheckoutReasonRequired&&h.missedCheckoutReasonSubmittedAt&&String(h.missedCheckoutReasonStatus||"").toLowerCase()==="pending").map(h=>{const w=T.get(String(h.user_id)),v=k.find(_=>_&&_.type==="missed-checkout-reason"&&String(_.logId||"")===String(h.id||"")&&String(_.status||"pending").toLowerCase()==="pending");return{...h,staffName:w?.name||"Staff",staffRole:w?.role||"Employee",notificationId:v?.id||""}}).sort((h,w)=>new Date(w.missedCheckoutReasonSubmittedAt||w.systemClosedAt||w.date||0)-new Date(h.missedCheckoutReasonSubmittedAt||h.systemClosedAt||h.date||0)),A=h=>{const w=h&&h.payload?h.payload:{},v=w.deleted||{},_=w.configuredTargets||{};if(h.type==="legacy_dummy_cleanup_completed")return[`users=${Number(v.users||0)}`,`attendance=${Number(v.attendance||0)}`,`leaves=${Number(v.leaves||0)}`,`workPlans=${Number(v.workPlans||0)}`].join(", ");if(h.type==="legacy_dummy_cleanup_skipped"){const L=w.reason||"unknown",b=Array.isArray(_.ids)?_.ids.length:0,x=Array.isArray(_.usernames)?_.usernames.length:0;return`reason=${L}, targetIds=${b}, targetUsernames=${x}`}return h.type==="legacy_dummy_cleanup_failed"?String(w.message||"Unknown error"):"-"};return window.app_applyAuditFilter=async()=>{const h=document.getElementById("audit-start")?.value,w=document.getElementById("audit-end")?.value,v=document.getElementById("page-content");v&&(v.innerHTML=await qt(h,w))},window.app_refreshAdminPage=async()=>{const h=document.getElementById("audit-start")?.value||a,w=document.getElementById("audit-end")?.value||e,v=document.getElementById("page-content");v&&(v.innerHTML=await qt(h,w))},`
        <div class="dashboard-grid dashboard-modern dashboard-admin-view">
            <div class="card admin-kpi-card">
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
            </div>

            ${window.app_hasPerm("leaves","view")?`
            <div class="card full-width admin-section-card">
                 <h3 class="admin-section-title">Pending Leave Requests (${n.length})</h3>
                 ${n.length===0?'<p class="text-muted">No pending requests.</p>':`
                    <div class="table-container">
                        <table class="compact-table">
                            <thead>
                                <tr><th>Date</th><th>Staff</th><th>Type</th><th>Days</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                ${n.map(h=>`
                                    <tr>
                                        <td>${new Date(h.startDate).toLocaleDateString()}</td>
                                        <td>${$(h.userName)}</td>
                                        <td><span class="admin-leave-type-badge">${$(h.type)}</span></td>
                                        <td>${h.daysCount}</td>
                                        <td>
                                                <div class="admin-leave-actions">
                                                ${window.app_hasPerm("leaves","admin")?`
                                                    <button onclick="window.AppLeaves.updateLeaveStatus('${h.id}', 'Approved', window.AppAuth?.getUser?.()?.id).then(() => window.app_refreshAdminPage())" class="admin-btn admin-btn-success">Approve</button>
                                                    <button onclick="window.AppLeaves.updateLeaveStatus('${h.id}', 'Rejected', window.AppAuth?.getUser?.()?.id).then(() => window.app_refreshAdminPage())" class="admin-btn admin-btn-danger">Reject</button>
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

            ${window.app_hasPerm("dashboard","admin")?`
            <div class="card full-width dashboard-tagged-card">
                <div class="dashboard-tagged-head">
                    <h4>Missed Checkout Requests (${S.length})</h4>
                    <span>Pending admin review</span>
                </div>
                ${S.length===0?'<p class="text-muted">No missed checkout reasons waiting for review.</p>':`
                    <div class="dashboard-tagged-list">
                        ${S.map(h=>`
                            <div class="dashboard-tagged-item">
                                <div>
                                    <div class="dashboard-tagged-title">${$(h.staffName)}</div>
                                    <div class="dashboard-tagged-desc">${$(h.missedCheckoutReason||"Reason not submitted yet.")}</div>
                                    <div class="dashboard-tagged-meta">
                                        ${$(h.date||"--")} | ${$(h.staffRole||"Employee")}
                                        ${h.missedCheckoutReasonSubmittedAt?` | Submitted ${$(new Date(h.missedCheckoutReasonSubmittedAt).toLocaleString())}`:""}
                                    </div>
                                </div>
                                <div class="dashboard-tagged-status">
                                    <span class="dashboard-tagged-pill pending">Pending</span>
                                    ${h.notificationId?`
                                        <div class="dashboard-tagged-actions">
                                            <button class="dashboard-tagged-btn accept" onclick='window.app_reviewMissedCheckoutReasonFromNotification(-1, ${JSON.stringify(String(h.notificationId))}, "approved")'>Approve</button>
                                            <button class="dashboard-tagged-btn reject" onclick='window.app_reviewMissedCheckoutReasonFromNotification(-1, ${JSON.stringify(String(h.notificationId))}, "rejected")'>Reject</button>
                                        </div>
                                    `:'<span class="text-muted" style="font-size:0.7rem;">Notification sync pending</span>'}
                                </div>
                            </div>
                        `).join("")}
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
                    <div class="admin-performance-status" style="background:${f}; color:${u};">${m}</div>
                </div>
                <div class="admin-performance-bars">
                    ${s.trendData.map(h=>`<div class="admin-performance-bar-item"><div class="admin-performance-bar-fill" style="height:${Math.max(h,5)}%;"></div></div>`).join("")}
                </div>
            </div>

            ${window.app_isAdminUser?.()||window.app_canManageBirthdays?.()?`
            <div class="card admin-performance-card" style="background:linear-gradient(135deg, #fff7ed, #fffbeb); border:1px solid #fed7aa;">
                <div class="admin-performance-head">
                    <div>
                        <h4 class="admin-performance-title">Birthday Calendar</h4>
                        <p class="text-muted">${c} staff with reminder-ready birthdays</p>
                    </div>
                    <button class="action-btn" onclick="window.location.hash='birthday-calendar'"><i class="fa-solid fa-cake-candles"></i> Open</button>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.55rem;">
                    ${p.length?p.map(h=>`
                            <div style="display:flex; justify-content:space-between; gap:0.75rem; border:1px solid #fdba74; border-radius:12px; padding:0.7rem 0.8rem; background:rgba(255,255,255,0.72);">
                                <div>
                                    <div style="font-weight:700; color:#7c2d12;">${$(h.name||"Staff")}</div>
                                    <div style="font-size:0.8rem; color:#9a3412;">${$(h.role||"Employee")} / ${$(h.dept||"General")}</div>
                                </div>
                                <div style="text-align:right; color:#9a3412; font-weight:700;">${$(String(h.birthDay||"--"))}/${$(String(h.birthMonth||"--"))}${h.birthYear?`/${$(String(h.birthYear))}`:""}</div>
                            </div>
                        `).join(""):'<div style="color:#9a3412; font-size:0.85rem;">No birthdays saved yet.</div>'}
                </div>
            </div>
            `:""}

            ${window.app_hasPerm("users","view")?`
            <div class="card full-width">
                <div class="admin-staff-head">
                    <h3 class="admin-staff-title">Staff Management</h3>
                    <div class="admin-staff-head-actions">
                        ${window.app_isAdminUser?.()||window.app_canManageBirthdays?.()?`<button class="action-btn secondary" onclick="window.location.hash='birthday-calendar'"><i class="fa-solid fa-cake-candles"></i> Birthday Calendar</button>`:""}
                        ${window.app_hasPerm("users","admin")?`<button class="action-btn" onclick="document.getElementById('add-user-modal').style.display='flex'"><i class="fa-solid fa-user-plus"></i> Add Staff</button>`:""}
                    </div>
                </div>
                 <div class="table-container mobile-table-card">
                    <table>
                        <thead>
                            <tr><th>Staff Member</th><th>Status</th><th>In / Out</th><th>Role / Dept</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            ${t.map(h=>{const w=h.lastSeen&&Date.now()-h.lastSeen<12e4;return`
                                <tr>
                                    <td>
                                        <div class="admin-user-cell">
                                            <img src="${h.avatar}" class="admin-user-avatar">
                                            <div>
                                                <div class="admin-user-name-row">${$(h.name)} ${w?'<span class="admin-user-live-tag">LIVE</span>':""}</div>
                                                <div class="admin-user-id">${$(h.username)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span class="status-badge ${h.status==="in"?"in":"out"}">${h.status?.toUpperCase()}</span></td>
                                    <td>${h.lastCheckIn?new Date(h.lastCheckIn).toLocaleTimeString():"--"} / ${h.lastCheckOut?new Date(h.lastCheckOut).toLocaleTimeString():"--"}</td>
                                    <td>${$(h.role)} / ${$(h.dept||"--")}</td>
                                    <td>
                                        <div class="admin-row-actions">
                                            <button onclick="window.app_viewLogs('${h.id}')" class="admin-icon-btn"><i class="fa-solid fa-list-check"></i></button>
                                            ${window.app_hasPerm("users","admin")?`<button onclick="window.app_editUser('${h.id}')" class="admin-icon-btn"><i class="fa-solid fa-pen"></i></button>`:""}
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
                        <input type="date" id="audit-start" value="${a}" style="font-size:0.75rem;">
                        <input type="date" id="audit-end" value="${e}" style="font-size:0.75rem;">
                        <button onclick="window.app_applyAuditFilter()" class="action-btn">Filter</button>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Staff</th><th>Slot</th><th>Time</th><th>Status</th></tr></thead>
                        <tbody>
                            ${o.length?o.map(h=>`
                                <tr>
                                    <td>${$(h.userName)}</td>
                                    <td>${$(h.slot)}</td>
                                    <td>${new Date(h.timestamp).toLocaleTimeString()}</td>
                                    <td style="color:${h.status==="Success"?"green":"red"}">${h.status}</td>
                                </tr>
                            `).join(""):'<tr><td colspan="4" class="text-center">No audits found</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card full-width">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h3>Simulation Cleanup Audit (Debug)</h3>
                    <span class="text-muted" style="font-size:0.75rem;">Last ${r.length} entries</span>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Time</th><th>Event</th><th>Summary</th></tr></thead>
                        <tbody>
                            ${r.length?r.map(h=>`
                                <tr>
                                    <td>${new Date(Number(h.createdAt||0)).toLocaleString()}</td>
                                    <td>${$(h.type||"-")}</td>
                                    <td>${$(A(h))}</td>
                                </tr>
                            `).join(""):'<tr><td colspan="3" class="text-center">No simulation cleanup audit entries found</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`}const ke=["January","February","March","April","May","June","July","August","September","October","November","December"],Bn=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],On=a=>String(a).padStart(2,"0"),Oa=()=>window.AppDB?.getIstNow?new Date(window.AppDB.getIstNow()):new Date,Rn=()=>{const a=Oa(),e=window.app_birthdayCalendarState||{},t=Number(e.selectedMonth||a.getMonth()+1),n=Number(e.selectedYear||a.getFullYear()),i=e.view==="year"?"year":"month";return window.app_birthdayCalendarState={view:i,selectedMonth:t,selectedYear:n},window.app_birthdayCalendarState},Ra=a=>{const e=Number(a?.birthDay||0),t=Number(a?.birthMonth||0),n=Number(a?.birthYear||0),i=e?On(e):"--",s=t?ke[t-1]:"--";return`${i} ${s}${n?` ${n}`:""}`.trim()},Be=a=>{const e=Number(a?.birthMonth||99),t=Number(a?.birthDay||99),n=String(a?.name||"").toLowerCase();return`${String(e).padStart(2,"0")}-${String(t).padStart(2,"0")}-${n}`},Un=a=>{const e=a?.role||"Employee",t=a?.dept||a?.department||"General";return`${a?.name||"Staff"} - ${e} / ${t}`},Ua=a=>a?.source==="external"?'<span class="birthday-source-pill external">External</span>':'<span class="birthday-source-pill staff">Staff</span>',Fa=a=>a?.source==="external"?`${a?.position||"Position not set"} • ${a?.location||"Location not set"}`:`${a?.role||"Employee"} • ${a?.dept||"General"}`,Fn=a=>Number(a?.birthDay||0)>0?'<span class="birthday-status ok">Reminder eligible</span>':'<span class="birthday-status warn">Add day to enable reminder</span>',Ha=(a,e)=>e?`<button type="button" class="action-btn secondary" style="margin-top:0.55rem; padding:0.42rem 0.72rem;" onclick="window.app_openBirthdayEditor('${$(a?.source||"user")}', '${$(a?.id||"")}')">Edit</button>`:"",Hn=a=>{const e=new Map;for(let t=1;t<=12;t+=1)e.set(t,[]);a.forEach(t=>{const n=Number(t?.birthMonth||0);n>=1&&n<=12&&e.get(n).push(t)});for(let t=1;t<=12;t+=1)e.get(t).sort((n,i)=>Be(n).localeCompare(Be(i)));return e},qn=(a,e)=>{const n=new Date(e,a-1,1).getDay(),i=new Date(e,a,0).getDate(),s=[];for(let o=0;o<n;o+=1)s.push({type:"empty",key:`e-${a}-${o}`});for(let o=1;o<=i;o+=1)s.push({type:"day",day:o,key:`d-${a}-${o}`});for(;s.length%7!==0;)s.push({type:"empty",key:`tail-${a}-${s.length}`});return s},zn=(a,e)=>`
    <article class="birthday-agenda-card">
        <div class="birthday-agenda-head">
            <div>
                <div class="birthday-agenda-name">${$(a.name||"Staff")}</div>
                <div class="birthday-agenda-meta">${$(Fa(a))}</div>
            </div>
            ${Ua(a)}
        </div>
        <div class="birthday-agenda-date">${$(Ra(a))}</div>
        <div class="birthday-agenda-foot">
            ${Fn(a)}
            ${Ha(a,e)}
        </div>
    </article>
`,jn=(a,e,t)=>{const n=e.slice(0,3).map(i=>`
        <div class="birthday-mini-chip">
            <span>${$(String(i.birthDay||"--"))}</span>
            <span>${$(i.name||"Staff")}</span>
        </div>
    `).join("");return`
        <button type="button" class="birthday-mini-month ${t===a?"is-selected":""}" onclick="window.app_goToBirthdayCalendarMonth(${a})">
            <div class="birthday-mini-month-head">
                <span>${$(ke[a-1])}</span>
                <strong>${e.length}</strong>
            </div>
            <div class="birthday-mini-month-body">
                ${n||'<div class="birthday-mini-empty">No birthdays saved</div>'}
            </div>
        </button>
    `};async function Yn(){const a=window.AppAuth?.getUser?.(),e=window.app_canManageBirthdays?.(a),t=window.app_canAdminBirthdays?.(a),n=window.app_canSeeAdminPanel?.(a);if(!a||!e)return`
            <div class="card" style="max-width:720px; margin:1rem auto;">
                <h3 style="margin-top:0;">Birthday Calendar</h3>
                <p style="color:#64748b; margin-bottom:0;">You do not have permission to view the birthday calendar.</p>
            </div>
        `;const[i,s]=await Promise.all([window.AppDB.getAll("users").catch(()=>[]),window.AppDB.getAll("birthday_people",{silentPermissionDenied:!0}).catch(()=>[])]),o=[...i].sort((b,x)=>Be(b).localeCompare(Be(x))),r=[...o.map(b=>({...b,source:"user"})),...s.map(b=>({...b,source:"external"}))].sort((b,x)=>Be(b).localeCompare(Be(x))),d=r.filter(b=>Number(b?.birthMonth||0)>=1&&Number(b?.birthMonth||0)<=12),l=r.filter(b=>!(Number(b?.birthMonth||0)>=1&&Number(b?.birthMonth||0)<=12)),c=Hn(d),p=Rn(),m=p.selectedMonth,u=p.selectedYear,f=Oa(),g=m===f.getMonth()+1&&u===f.getFullYear(),y=c.get(m)||[],k=o.map(b=>`
        <option value="${$(b.id)}">${$(Un(b))}</option>
    `).join(""),T=qn(m,u),S=new Map;y.forEach(b=>{const x=Number(b?.birthDay||0);if(!x)return;const D=S.get(x)||[];D.push(b),S.set(x,D)});const A=T.map(b=>{if(b.type==="empty")return'<div class="birthday-day-cell empty"></div>';const x=S.get(b.day)||[],D=g&&b.day===f.getDate(),M=x.slice(0,2).map(R=>`
            <div class="birthday-day-chip ${R.source==="external"?"external":"staff"}">
                <span>${$(R.name||"Staff")}</span>
            </div>
        `).join("");return`
            <div class="birthday-day-cell ${x.length?"has-birthday":""} ${D?"is-today":""}">
                <div class="birthday-day-number">${b.day}</div>
                <div class="birthday-day-stack">
                    ${M||'<div class="birthday-day-placeholder">No birthdays</div>'}
                    ${x.length>2?`<div class="birthday-day-more">+${x.length-2} more</div>`:""}
                </div>
            </div>
        `}).join(""),h=ke.map((b,x)=>`
        <button type="button" class="birthday-month-tab ${m===x+1?"is-active":""}" onclick="window.app_goToBirthdayCalendarMonth(${x+1})">${$(b.slice(0,3))}</button>
    `).join(""),w=y.length?y.map(b=>zn(b,t)).join(""):'<div class="birthday-empty-panel">No birthdays have been assigned to this month yet.</div>',v=ke.map((b,x)=>jn(x+1,c.get(x+1)||[],m)).join(""),_=l.length?l.map(b=>`
            <article class="birthday-incomplete-row">
                <div>
                    <div class="birthday-incomplete-name-wrap">
                        <strong>${$(b.name||"Staff")}</strong>
                        ${Ua(b)}
                    </div>
                    <div class="birthday-incomplete-meta">${$(Fa(b))}</div>
                </div>
                <div style="text-align:right;">
                    <div class="birthday-incomplete-date">${$(Ra(b))}</div>
                    <div class="birthday-status warn">Month missing or incomplete</div>
                    ${Ha(b,t)}
                </div>
            </article>
        `).join(""):'<div class="birthday-empty-panel">All saved birthday records already have a month assigned.</div>',L=t?`
        <section class="birthday-side-card birthday-actions-card">
            <div class="birthday-section-kicker">Manage This Month</div>
            <h3>${$(ke[m-1])} Actions</h3>
            <form id="birthday-month-form-${m}" onsubmit="window.app_submitBirthdayMonthForm(event, ${m})" class="birthday-add-form">
                <label>
                    <span>Add staff to ${$(ke[m-1])}</span>
                    <select name="userId" required>
                        <option value="">Select staff</option>
                        ${k}
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
            <button type="button" class="action-btn secondary" onclick="window.app_openExternalBirthdayPersonModal(${m})">Add Person Not In System</button>
        </section>
    `:"";return`
        <style>
            .birthday-modern { --birthday-bg: linear-gradient(180deg, #f5f8ff 0%, #fcfdff 100%); --birthday-border: rgba(107, 133, 194, 0.24); --birthday-surface: rgba(255,255,255,0.92); display:grid; gap:1rem; }
            .birthday-shell { background:var(--birthday-bg); border:1px solid var(--birthday-border); border-radius:28px; box-shadow:0 18px 48px rgba(40, 63, 124, 0.14); overflow:hidden; position:relative; }
            .birthday-shell::before { content:""; position:absolute; inset:0; background:radial-gradient(circle at top right, rgba(147, 197, 253, 0.3), transparent 28%), radial-gradient(circle at bottom left, rgba(191, 219, 254, 0.28), transparent 34%); pointer-events:none; }
            .birthday-shell>* { position:relative; z-index:1; }
            .birthday-hero { padding:1.2rem 1.2rem 1rem; display:grid; gap:0.85rem; background:linear-gradient(135deg, #19376d, #284b9b 56%, #4f7cff); color:#f8fbff; }
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
            .birthday-body { padding:1rem; display:grid; gap:0.9rem; }
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
            @media (max-width:780px) { .birthday-hero, .birthday-body, .birthday-incomplete-wrap { padding:0.85rem; } .birthday-month-tabs { grid-template-columns:repeat(4, minmax(0,1fr)); } .birthday-weekdays, .birthday-calendar-grid { gap:0.35rem; } .birthday-day-cell { min-height:88px; padding:0.45rem; } .birthday-year-grid { grid-template-columns:1fr; } }
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
                            ${t?`<button type="button" class="action-btn" onclick="window.app_openExternalBirthdayPersonModal(${m})">Add Person Not In System</button>`:""}
                            <button type="button" class="action-btn secondary" onclick="window.location.hash='${n?"admin":"dashboard"}'">${n?"Back to Admin":"Back to Dashboard"}</button>
                        </div>
                    </div>
                    <div class="birthday-toolbar">
                        <div class="birthday-period-nav">
                            <button type="button" class="birthday-nav-btn" onclick="window.app_changeBirthdayCalendarMonth(-1)">&larr;</button>
                            <div class="birthday-period-label">
                                <span class="birthday-period-title">${$(ke[m-1])} ${u}</span>
                                <span class="birthday-period-sub">${y.length} birthdays this month</span>
                            </div>
                            <button type="button" class="birthday-nav-btn" onclick="window.app_changeBirthdayCalendarMonth(1)">&rarr;</button>
                        </div>
                        <div class="birthday-view-switch">
                            <button type="button" class="${p.view==="month"?"is-active":""}" onclick="window.app_setBirthdayCalendarView('month')">Monthly View</button>
                            <button type="button" class="${p.view==="year"?"is-active":""}" onclick="window.app_setBirthdayCalendarView('year')">Yearly View</button>
                        </div>
                    </div>
                    <div class="birthday-month-tabs">${h}</div>
                </div>
                <div class="birthday-body">
                    ${p.view==="month"?`
                        <div class="birthday-month-layout">
                            <section class="birthday-panel">
                                <div class="birthday-panel-head">
                                    <div>
                                        <h3>${$(ke[m-1])} Calendar</h3>
                                        <div class="birthday-panel-sub">Default focus is the current month. Switch month whenever you need another view.</div>
                                    </div>
                                    <div class="birthday-status ok">${y.length} saved</div>
                                </div>
                                <div class="birthday-weekdays">${Bn.map(b=>`<span>${b}</span>`).join("")}</div>
                                <div class="birthday-calendar-grid">${A}</div>
                            </section>
                            <div class="birthday-side">
                                <section class="birthday-side-card">
                                    <div class="birthday-section-kicker">This Month</div>
                                    <h3>${$(ke[m-1])} Birthdays</h3>
                                    <div class="birthday-agenda">${w}</div>
                                </section>
                                ${L}
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
                            <div class="birthday-year-grid">${v}</div>
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
                ${_}
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
    `}async function Wn(){const a=await window.AppAnalytics.getSystemMonthlySummary(),e=new Date,t=window.AppAuth.getUser(),n=window.app_hasPerm("reports","admin",t);return`
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
                        ${a.map(s=>{const{user:o,stats:r}=s,d=Number(o.baseSalary||0),l=Number(r.unpaidLeaves||0),c=Number(r.late||0),p=Number(r.extraWorkedHours||0),m=window.AppConfig?.LATE_GRACE_COUNT||3,u=window.AppConfig?.LATE_DEDUCTION_PER_BLOCK||.5,f=window.AppConfig?.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4,g=Math.floor(c/m)*u,y=Math.floor(p/f)*u,k=Math.min(g,y),T=Math.max(0,g-k),S=l+T,A=Math.round(d/22*S),h=Math.round(Math.max(0,d-A)),w=o.employeeId||"",v=o.designation||o.role||"",_=o.dept||o.department||"",L=o.joinDate||"",b=o.bankName||"",x=o.bankAccount||o.accountNumber||"",D=o.pan||o.PAN||"",M=o.uan||o.UAN||"",R=Number(o.otherAllowances||0),I=Number(o.providentFund||0),N=Number(o.professionalTax||0),P=Number(o.loanAdvance||0);return`
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
                                    <td><span class="extra-work-hours">${p.toFixed(2)}</span></td>
                                    <td><span class="late-deduction-raw">${g.toFixed(1)}</span></td>
                                    <td><span class="penalty-offset-days">${k.toFixed(1)}</span></td>
                                    <td><span class="late-deduction-days">${T.toFixed(1)}</span></td>
                                    <td><span class="deduction-days">${S.toFixed(1)}</span></td>
                                    <td class="attendance-deduction-amount" style="color:#ef4444;">-Rs ${A.toLocaleString()}</td>
                                    <td class="deduction-amount" style="display:none;">-Rs ${A.toLocaleString()}</td>
                                    <td><input type="number" class="salary-input" value="${h}" style="width: 90px;"></td>
                                    <td><input type="number" class="tds-input" value="" placeholder="Global" style="width: 60px;" onchange="window.app_recalculateRow(this.closest('tr'))"></td>
                                    <td class="final-net-salary" data-value="${h}" style="font-weight:700; color:#1e40af;">Rs ${h.toLocaleString()}</td>
                                    <td class="tds-amount" data-value="0" style="display:none;">Rs 0</td>

                                    <td style="display:none;"><input class="employee-id-input" type="text" value="${$(w)}"></td>
                                    <td style="display:none;"><input class="designation-input" type="text" value="${$(v)}"></td>
                                    <td style="display:none;"><input class="department-input" type="text" value="${$(_)}"></td>
                                    <td style="display:none;"><input class="join-date-input" type="date" value="${$(L)}"></td>
                                    <td style="display:none;"><input class="bank-name-input" type="text" value="${$(b)}"></td>
                                    <td style="display:none;"><input class="bank-account-input" type="text" value="${$(x)}"></td>
                                    <td style="display:none;"><input class="pan-input" type="text" value="${$(D)}"></td>
                                    <td style="display:none;"><input class="uan-input" type="text" value="${$(M)}"></td>
                                    <td style="display:none;"><input class="other-allowances-input" type="number" value="${R}"></td>
                                    <td style="display:none;"><input class="pf-input" type="number" value="${I}"></td>
                                    <td style="display:none;"><input class="professional-tax-input" type="number" value="${N}"></td>
                                    <td style="display:none;"><input class="loan-advance-input" type="number" value="${P}"></td>
                                    <td style="display:none;"><input class="comment-input" type="text" value=""></td>

                                    <td><button class="action-btn secondary" onclick="window.app_generateSalarySlip('${o.id}')">Slip</button></td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `}async function Kn(){const a=new Date().toISOString().split("T")[0];return window.app_runPolicyTest=()=>{const e=document.getElementById("policy-test-checkin")?.value,t=document.getElementById("policy-test-checkout")?.value,n=document.getElementById("policy-test-output");if(!e||!t||!n)return;const i=document.getElementById("policy-test-date")?.value,s=new Date(`${i}T${e}`),r=(new Date(`${i}T${t}`)-s)/(1e3*60*60);let d="Absent";r>=8?d="Present":r>=4&&(d="Half Day"),n.innerHTML=`
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
    `}async function qa(){const a=await window.AppMinutes.getMinutes(),e=window.AppDB?.getAll?await window.AppDB.getAll("users"):[],t=window.AppAuth.getUser(),n=window.AppCalendar?await window.AppCalendar.getPlans():{leaves:[],events:[],work:[]},i=new Date,s=`${i.getFullYear()}-${String(i.getMonth()+1).padStart(2,"0")}`;window._minutesUiState?(window._minutesUiState.viewMode=window._minutesUiState.viewMode||"list",window._minutesUiState.searchQuery=window._minutesUiState.searchQuery||"",window._minutesUiState.monthKey=window._minutesUiState.monthKey||s):window._minutesUiState={viewMode:"list",searchQuery:"",monthKey:s};const o=window._minutesUiState,r=(b,x=t)=>!b||!x?!1:!!(window.app_hasPerm("minutes","view",x)||b.createdBy===x.id||(b.attendeeIds||[]).includes(x.id)||(b.allowedViewers||[]).includes(x.id)||(b.actionItems||[]).some(D=>D.assignedTo===x.id)),d=(b,x=t.id)=>{const D=(b.accessRequests||[]).find(M=>M.userId===x);return D?D.status:""},l=(b="")=>{const M=new DOMParser().parseFromString(`<div>${b||""}</div>`,"text/html").body.firstElementChild;if(!M)return"";const R=new Set(["P","BR","B","STRONG","I","EM","U","H2","H3","UL","OL","LI","A"]),I={A:new Set(["href","target","rel"])},N=P=>{!P||!P.childNodes||Array.from(P.childNodes).forEach(B=>{if(B.nodeType===Node.ELEMENT_NODE){const O=B;if(!R.has(O.tagName)){for(;O.firstChild;)P.insertBefore(O.firstChild,O);P.removeChild(O);return}if(Array.from(O.attributes).forEach(V=>{const j=I[O.tagName];(!j||!j.has(V.name.toLowerCase()))&&O.removeAttribute(V.name)}),O.tagName==="A"){const V=(O.getAttribute("href")||"").trim();/^(https?:|mailto:|#)/i.test(V)?(O.setAttribute("target","_blank"),O.setAttribute("rel","noopener noreferrer")):O.removeAttribute("href")}}N(B)})};return N(M),M.innerHTML.trim()},c=(b="")=>{const x=document.createElement("div");return x.innerHTML=b||"",(x.innerText||x.textContent||"").replace(/\r/g,"").trim()},p=(b="")=>$(b||"").replace(/\n/g,"<br>"),m=b=>{if(!b)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(b))return new Date(`${b}T00:00:00`);const x=new Date(b);return Number.isNaN(x.getTime())?null:x},u=(b,x={day:"numeric",month:"short",year:"numeric"})=>{const D=m(b);return D?D.toLocaleDateString(void 0,x):"Date not set"},f=b=>{const[x,D]=String(b||s).split("-").map(Number);return!x||!D?new Date(i.getFullYear(),i.getMonth(),1):new Date(x,D-1,1)},g=b=>{const x=(b.attendeeIds||[]).map(D=>e.find(M=>M.id===D)?.name||e.find(M=>M.id===D)?.username||"").join(" ");return[b.title,b.date,b.content,x].join(" ").toLowerCase()},y=(b,x="")=>{const D=document.getElementById(b),M=D?D.innerHTML:"",R=l(M);let I=c(R);return!I&&x&&(I=(document.getElementById(x)?.value||"").trim()),{html:R,text:I}},k=(b="",x="")=>{const D=l(b||"");return D||$(x||"").replace(/\n/g,"<br>")};let T=new Set;window.app_toggleNewMinuteForm=()=>{const b=document.getElementById("new-minute-form");if(b&&(b.style.display=b.style.display==="none"?"block":"none",b.style.display==="block")){T=new Set,window.app_refreshAttendeeChips(),document.querySelectorAll('.attendee-grid input[type="checkbox"]').forEach(M=>M.checked=!1);const x=document.getElementById("action-items-container");x&&(x.innerHTML="",window.app_addActionItemRow());const D=document.getElementById("new-minute-content-editor");D&&(D.innerHTML="")}},window.app_refreshMinutesView=async()=>{const b=document.getElementById("page-content");b&&(b.innerHTML=await qa(),window.setTimeout(()=>window.app_filterMinutes(o.searchQuery||""),0))},window.app_minutesExec=(b,x,D=null)=>{const M=document.getElementById(b);M&&(M.focus(),document.execCommand(x,!1,D))},window.app_minutesFormatBlock=(b,x)=>{window.app_minutesExec(b,"formatBlock",x)},window.app_filterAttendees=b=>{const x=b.toLowerCase();document.querySelectorAll(".attendee-item-modern").forEach(D=>{const M=(D.dataset.name||"").toLowerCase();D.style.display=M.includes(x)?"flex":"none"})},window.app_filterMinutes=b=>{o.searchQuery=b||"";const x=o.searchQuery.toLowerCase().trim();let D=0;document.querySelectorAll(".minute-card-modern").forEach(I=>{const N=(I.dataset.searchText||"").toLowerCase(),P=!x||N.includes(x);I.style.display=P?"flex":"none",P&&(D+=1)}),document.querySelectorAll(".minutes-calendar-entry").forEach(I=>{const N=(I.dataset.searchText||"").toLowerCase(),P=!x||N.includes(x);I.style.display=P?"flex":"none"}),document.querySelectorAll(".minutes-calendar-day").forEach(I=>{const N=Array.from(I.querySelectorAll(".minutes-calendar-entry")),P=N.some(O=>O.style.display!=="none"),B=I.querySelector(".minutes-calendar-count");I.classList.toggle("has-visible-meeting",P),B&&(B.textContent=P?`${N.filter(O=>O.style.display!=="none").length} meeting${N.filter(O=>O.style.display!=="none").length===1?"":"s"}`:""),P&&(D+=1)});const M=document.getElementById("minutes-list-empty-state");M&&(M.style.display=D===0?"block":"none");const R=document.getElementById("minutes-calendar-empty-state");R&&(R.style.display=D===0?"block":"none")},window.app_setMinutesView=b=>{o.viewMode=b==="calendar"?"calendar":"list",window.app_refreshMinutesView()},window.app_shiftMinutesMonth=b=>{const x=f(o.monthKey);x.setMonth(x.getMonth()+Number(b||0)),o.monthKey=`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}`,window.app_refreshMinutesView()},window.app_toggleAttendeePick=b=>{b.checked?T.add(b.value):T.delete(b.value),window.app_refreshAttendeeChips()},window.app_refreshAttendeeChips=()=>{const b=document.getElementById("minutes-attendee-chips");b&&(b.innerHTML=Array.from(T).map(x=>{const D=e.find(M=>M.id===x);return`
                <div class="chip-modern">
                    <span>${$(D?.name||D?.username||"Unknown")}</span>
                    <i class="fa-solid fa-circle-xmark" onclick="window.app_removeAttendee('${x}')"></i>
                </div>
            `}).join(""))},window.app_removeAttendee=b=>{T.delete(b);const x=document.querySelector(`.attendee-item-modern input[value="${b}"]`);x&&(x.checked=!1),window.app_refreshAttendeeChips()},window.app_addActionItemRow=()=>{const b=document.getElementById("action-items-container");if(!b)return;const x=document.createElement("div");x.className="action-item-row-card",x.innerHTML=`
            <div class="field-group">
                <input type="text" placeholder="What needs to be done?" class="input-premium action-task">
            </div>
            <div class="field-group">
                <select class="input-premium action-assignee">
                    <option value="">Assignee...</option>
                    ${e.map(D=>`<option value="${D.id}">${$(D.name||D.username)}</option>`).join("")}
                </select>
            </div>
            <div class="field-group">
                <input type="date" class="input-premium action-due" value="${new Date().toISOString().split("T")[0]}">
            </div>
            <button type="button" onclick="this.parentElement.remove()" class="icon-btn-danger" style="background:#fee2e2; color:#ef4444; border:none; width:40px; height:40px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `,b.appendChild(x)},window.app_submitNewMinutes=async()=>{const b=document.getElementById("new-minute-title").value.trim(),x=document.getElementById("new-minute-date").value,D=y("new-minute-content-editor","new-minute-content"),M=D.text,R=Array.from(T),I=Array.from(document.querySelectorAll(".action-item-row-card")).map(N=>({task:N.querySelector(".action-task").value.trim(),assignedTo:N.querySelector(".action-assignee").value,dueDate:N.querySelector(".action-due").value,status:"pending"})).filter(N=>N.task);if(!b||!M)return alert("Title and content are required.");try{await window.AppMinutes.addMinute({title:b,date:x,content:M,contentHtml:D.html,attendeeIds:R,actionItems:I}),alert("Meeting minutes recorded!"),window.app_refreshMinutesView()}catch(N){alert("Error saving: "+N.message)}},window.app_requestMinuteAccess=async b=>{try{await window.AppMinutes.requestAccess(b),alert("Access requested!"),window.app_refreshMinutesView()}catch(x){alert("Error: "+x.message)}},window.app_handleMinuteApproval=async b=>{if(confirm("Are you sure you want to approve these minutes? This will lock the record if you are the last attendee to sign."))try{await window.AppMinutes.approveMinute(b),alert("Minutes approved!"),window.app_openMinuteDetails(b),window.app_refreshMinutesView()}catch(x){alert("Error: "+x.message)}},window.app_handleActionItemStatus=async(b,x,D)=>{try{await window.AppMinutes.updateActionItemStatus(b,x,D),alert(`Task marked as ${D}!`),window.app_openMinuteDetails(b)}catch(M){alert("Error: "+M.message)}},window.app_handleAccessDecision=async(b,x,D)=>{try{await window.AppMinutes.handleAccessRequest(b,x,D),alert(`Request ${D}!`),window.app_openMinuteDetails(b)}catch(M){alert("Error: "+M.message)}},window.app_saveMinuteEdits=async b=>{try{const D=(await window.AppMinutes.getMinutes()).find(W=>W.id===b);if(!D)return alert("Minute not found.");const M=window.AppAuth.getUser(),R=D.createdBy===M.id,I=window.app_hasPerm("minutes","admin",M);if(!R&&!I)return alert("Only owner or admin can edit these minutes.");if(D.locked)return alert("This record is locked after final approvals.");const N=document.getElementById("minute-edit-title"),P=document.getElementById("minute-edit-date"),B=y("minute-edit-content-editor","minute-edit-content"),O=(N?.value||"").trim(),V=(P?.value||"").trim(),j=B.text;if(!O||!j)return alert("Title and content are required.");await window.AppMinutes.updateMinute(b,{title:O,date:V||D.date,content:j,contentHtml:B.html},"Edited meeting details"),alert("Minutes updated successfully."),window.app_openMinuteDetails(b),window.app_refreshMinutesView()}catch(x){alert("Error updating minutes: "+x.message)}},window.app_openMinuteDetails=async b=>{const D=(await window.AppMinutes.getMinutes()).find(q=>q.id===b);if(!D)return;if(!r(D))return alert("Access Restricted. Please request access from the list view.");const M=(D.attendeeIds||[]).includes(t.id),R=D.approvals&&D.approvals[t.id],I=D.createdBy===t.id,N=window.app_hasPerm("minutes","admin",t),P=(I||N)&&!D.locked,B=D.createdByName||e.find(q=>q.id===D.createdBy)?.name||"Unknown",O=D.lastEditedByName||B,V=D.lastEditedAt||D.createdAt,j=l(D.contentHtml||p(D.content||"")),W=(D.attendeeIds||[]).map(q=>{const Q=e.find(ne=>ne.id===q),ee=D.approvals&&D.approvals[q];return`
                <div class="approval-chip ${ee?"approved":"pending"}">
                    <i class="fa-solid fa-${ee?"check-circle":"clock"}"></i>
                    ${$(Q?.name||"Unknown")}
                </div>
            `}).join(""),J=(D.actionItems||[]).map((q,Q)=>{const ee=e.find(fe=>fe.id===q.assignedTo),ne=q.assignedTo===t.id;return`
                <div class="detail-action-item">
                    <div class="action-status-dot ${q.status||"pending"}"></div>
                    <div class="action-main">
                        <strong>${$(q.task)}</strong>
                        <span class="action-meta">Assigned: ${$(ee?.name||"Unassigned")} | Due: ${q.dueDate||"N/A"}</span>
                    </div>
                    ${ne&&q.status!=="completed"?`
                        <div class="action-btns">
                            ${q.status==="pending"?`<button class="mini-btn" onclick="window.app_handleActionItemStatus('${D.id}', ${Q}, 'accepted')">Accept</button>`:""}
                            <button class="mini-btn success" onclick="window.app_handleActionItemStatus('${D.id}', ${Q}, 'completed')">Complete</button>
                        </div>
                    `:""}
                </div>
            `}).join(""),E=(D.accessRequests||[]).filter(q=>q.status==="pending").map(q=>`
            <div class="access-request-row">
                <span>${$(q.userName)}</span>
                <div class="req-btns">
                    <button class="mini-btn success" onclick="window.app_handleAccessDecision('${D.id}', '${q.userId}', 'approved')">Approve</button>
                    <button class="mini-btn danger" onclick="window.app_handleAccessDecision('${D.id}', '${q.userId}', 'rejected')">Deny</button>
                </div>
            </div>
        `).join(""),U=(D.auditLog||[]).slice().reverse().map(q=>`
            <div class="access-request-row" style="justify-content:space-between; align-items:flex-start;">
                <div style="display:flex; flex-direction:column; gap:0.2rem;">
                    <strong style="font-size:0.82rem;">${$(q.userName||"Unknown")}</strong>
                    <span style="font-size:0.75rem; color:#64748b;">${$(q.action||"Updated")}</span>
                </div>
                <span style="font-size:0.74rem; color:#64748b; white-space:nowrap;">${q.timestamp?new Date(q.timestamp).toLocaleString():"-"}</span>
            </div>
        `).join(""),G=`
            <div class="modal-overlay" id="minute-detail-modal" style="display:flex;">
                <div class="modal-content minutes-detail-wide">
                    <div class="modal-header">
                        <div>
                            <span class="detail-date">${new Date(D.date).toLocaleDateString()}</span>
                            <h2 style="margin:0; color:#1e1b4b;">${$(D.title)}</h2>
                            <div style="font-size:0.78rem; color:#64748b; margin-top:0.35rem;">
                                Created by ${$(B)} on ${D.createdAt?new Date(D.createdAt).toLocaleString():"-"}
                            </div>
                            <div style="font-size:0.78rem; color:#64748b;">
                                Last edited by ${$(O)} on ${V?new Date(V).toLocaleString():"-"}
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
                                            <input id="minute-edit-title" class="input-premium" value="${Le(D.title||"")}" />
                                            <input id="minute-edit-date" class="input-premium" type="date" value="${Le(D.date||"")}" />
                                            <textarea id="minute-edit-content" class="textarea-premium" style="display:none;">${$(D.content||"")}</textarea>
                                            <div class="rich-editor-shell">
                                                <div class="rich-editor-toolbar">
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','bold')"><i class="fa-solid fa-bold"></i></button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','italic')"><i class="fa-solid fa-italic"></i></button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesFormatBlock('minute-edit-content-editor','H2')">H2</button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesFormatBlock('minute-edit-content-editor','H3')">H3</button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','insertUnorderedList')"><i class="fa-solid fa-list-ul"></i></button>
                                                    <button type="button" class="rich-editor-btn" onclick="window.app_minutesExec('minute-edit-content-editor','insertOrderedList')"><i class="fa-solid fa-list-ol"></i></button>
                                                </div>
                                                <div id="minute-edit-content-editor" class="rich-editor-area" contenteditable="true">${j}</div>
                                            </div>
                                        </div>
                                    `:`<div class="content-text rich-minutes-content">${k(D.contentHtml,D.content)}</div>`}
                                </section>
                                ${J?`
                                <section>
                                    <label><i class="fa-solid fa-list-check"></i> Action Items</label>
                                    <div class="action-items-list">${J}</div>
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
                                    ${M&&!R&&!D.locked?`<button class="action-btn wide" onclick="window.app_handleMinuteApproval('${D.id}')" style="margin-top:1rem;">Approve Minutes</button>`:""}
                                </section>
                                ${(I||N)&&E?`
                                <section class="owner-only">
                                    <label><i class="fa-solid fa-key"></i> Access Requests</label>
                                    <div class="access-requests-list">${E}</div>
                                </section>
                                `:""}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${D.locked?'<span class="status-locked-msg"><i class="fa-solid fa-lock"></i> Record Locked (All approved)</span>':""}
                        <div style="flex:1"></div>
                        <button class="action-btn secondary" onclick="document.getElementById('minute-detail-modal').remove()">Close</button>
                        ${P?`<button class="action-btn" onclick="window.app_saveMinuteEdits('${D.id}')">Save Changes</button>`:""}
                        ${I||N?`<button class="action-btn danger" onclick="window.app_deleteMinute('${D.id}')">Delete</button>`:""}
                    </div>
                </div>
            </div>
        `;if(!document.getElementById("modal-container")){const q=document.createElement("div");q.id="modal-container",document.body.appendChild(q)}document.getElementById("modal-container").innerHTML=G},window.app_deleteMinute=async b=>{if(confirm("Are you sure?"))try{await window.AppMinutes.deleteMinute(b),document.getElementById("minute-detail-modal")?.remove(),window.app_refreshMinutesView()}catch(x){alert("Error: "+x.message)}};const S=[...a].sort((b,x)=>{const D=m(b.date)?.getTime()||0;return(m(x.date)?.getTime()||0)-D}),A=f(o.monthKey),h=A.toLocaleDateString(void 0,{month:"long",year:"numeric"}),w=new Date(A.getFullYear(),A.getMonth(),1),v=new Date(w);v.setDate(w.getDate()-w.getDay());const _=Array.from({length:42},(b,x)=>{const D=new Date(v);return D.setDate(v.getDate()+x),D}),L=S.reduce((b,x)=>{const D=m(x.date);if(!D)return b;const M=`${D.getFullYear()}-${String(D.getMonth()+1).padStart(2,"0")}-${String(D.getDate()).padStart(2,"0")}`;return b[M]||(b[M]=[]),b[M].push(x),b},{});return window.setTimeout(()=>window.app_filterMinutes(o.searchQuery||""),0),`
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
                            ${e.map(b=>`
                                <label class="attendee-item-modern" data-name="${Le(b.name||b.username)}">
                                    <input type="checkbox" value="${b.id}" onchange="window.app_toggleAttendeePick(this)">
                                    <span>${$(b.name||b.username)}</span>
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
                        ${Gt(n)}
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
                    <input type="text" placeholder="Search meetings..." value="${Le(o.searchQuery||"")}" oninput="window.app_filterMinutes(this.value)" class="input-premium" style="padding-left: 2.75rem; width: 100%; padding-top: 0.6rem; padding-bottom: 0.6rem; font-size: 0.9rem;">
                </div>
            </div>

            ${o.viewMode==="calendar"?`
                <div class="minutes-calendar-shell">
                    <div class="minutes-calendar-toolbar">
                        <div>
                            <div class="minutes-calendar-month">${h}</div>
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
                        ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(b=>`<div class="minutes-calendar-weekday">${b}</div>`).join("")}
                        ${_.map(b=>{const x=`${b.getFullYear()}-${String(b.getMonth()+1).padStart(2,"0")}-${String(b.getDate()).padStart(2,"0")}`,D=L[x]||[],M=b.getMonth()===A.getMonth(),R=b.toDateString()===i.toDateString();return`
                                <div class="minutes-calendar-day ${M?"":"is-outside-month"} ${R?"is-today":""} ${D.length?"has-visible-meeting":""}">
                                    <div class="minutes-calendar-dayhead">
                                        <span class="minutes-calendar-date">${b.getDate()}</span>
                                        <span class="minutes-calendar-count">${D.length?`${D.length} meeting${D.length===1?"":"s"}`:""}</span>
                                    </div>
                                    <div class="minutes-calendar-items">
                                        ${D.map(I=>{const N=r(I),P=d(I);return`
                                                <div class="minutes-calendar-entry ${N?"clickable":""}" data-search-text="${Le(g(I))}" ${N?`onclick="window.app_openMinuteDetails('${I.id}')"`:""}>
                                                    <div class="minutes-calendar-entry-title">${$(I.title)}</div>
                                                    <div class="minutes-calendar-entry-meta">
                                                        <span>${I.attendeeIds?.length||0} attendees</span>
                                                        <span>${I.locked?"Locked":"Open"}</span>
                                                    </div>
                                                    ${N?"":`
                                                        <button class="minutes-calendar-restricted" onclick="event.stopPropagation(); window.app_requestMinuteAccess('${I.id}')">
                                                            ${P==="pending"?"Access Pending":P==="rejected"?"Access Denied":"Request Access"}
                                                        </button>
                                                    `}
                                                </div>
                                            `}).join("")}
                                    </div>
                                </div>
                            `}).join("")}
                    </div>
                    <div id="minutes-calendar-empty-state" class="minutes-no-results">No meetings match this search in ${h}.</div>
                </div>
            `:`
            <div class="minutes-list-container">
                ${S.length?S.map(b=>{const x=r(b),D=d(b);return`
                        <div class="minute-card-modern ${x?"clickable":""}" data-search-text="${Le(g(b))}" ${x?`onclick="window.app_openMinuteDetails('${b.id}')"`:""}>
                            <div class="card-date-badge">${u(b.date)}</div>
                            
                            <div class="minute-card-status">
                                ${b.locked?'<span style="background:#dcfce7; color:#166534; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:700;"><i class="fa-solid fa-lock" style="margin-right:0.35rem;"></i>Locked</span>':'<span style="background:#fff7ed; color:#9a3412; padding:0.25rem 0.75rem; border-radius:999px; font-size:0.75rem; font-weight:700;">Open</span>'}
                            </div>

                            <h4 class="card-title-modern">${$(b.title)}</h4>
                            
                            <div class="card-metrics">
                                <div class="metric-item">
                                    <i class="fa-solid fa-users"></i>
                                    ${b.attendeeIds?.length||0} Attendees
                                </div>
                                <div class="metric-item">
                                    <i class="fa-solid fa-check-circle"></i>
                                    ${b.actionItems?.length||0} Tasks
                                </div>
                            </div>

                            ${x?"":`
                                <div class="restricted-tag">
                                    <i class="fa-solid fa-shield-halved" style="margin-right: 0.5rem;"></i>
                                    Access Restricted
                                    ${D==="pending"?'<div style="margin-top:0.5rem; font-size:0.7rem; color:#f59e0b;">Request Pending Review</div>':D==="rejected"?'<div style="margin-top:0.5rem; font-size:0.7rem; color:#ef4444;">Access Denied</div>':`<button class="mini-btn" style="margin-top:0.75rem; width:100%; border-color:#991b1b; color:#991b1b;" onclick="window.app_requestMinuteAccess('${b.id}')">Request View Access</button>`}
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
    `}function Vn(a=[]){let e="";a&&a.length>0&&(e=`
            <div style="margin-bottom:1.5rem; padding-bottom:1.5rem; border-bottom:1px dashed #cbd5e1;">
                 <label style="display:block; font-size:0.85rem; font-weight:700; color:#334155; margin-bottom:0.75rem;">📋 Your Planned Tasks</label>
                 <div style="max-height:150px; overflow-y:auto; padding-right:4px;">
                    ${a.map(s=>`<div style="padding:8px 12px; background:#f0f9ff; border-left:3px solid #0284c7; border-radius:6px; font-size:0.9rem; color:#0c4a6e; margin-bottom:8px;">
                <span style="font-weight:600;">•</span> ${$(s.task)}
                ${s.subPlans&&s.subPlans.length>0?`<div style="font-size:0.8rem; color:#0369a1; margin-left:12px; margin-top:2px;">+ ${s.subPlans.length} sub-tasks</div>`:""}
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
    </div>`}function Gn(){if(typeof window>"u")return;const a=new MutationObserver(t=>{t.forEach(()=>{const n=document.getElementById("checkout-modal"),i=document.getElementById("checkout-intro-panel");n&&i&&n.style.display!=="none"&&(localStorage.getItem("checkoutIntroSeen")||(i.style.display="block"))})}),e=()=>{const t=document.body;t&&a.observe(t,{attributes:!0,subtree:!0,attributeFilter:["style"]})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e):e()}typeof window<"u"&&Gn();function Jn(){return`
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
     `}function Qn(){return window.AppAuth?.getUser()?`
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
    `:""}const gt=50,Xn=250;function za(){const a=new Date,e=new Date;return e.setDate(a.getDate()-30),{startIso:e.toISOString().split("T")[0],endIso:a.toISOString().split("T")[0]}}function ge(){if(!window.app_teamActivitiesState){const a=za();window.app_teamActivitiesState={startIso:a.startIso,endIso:a.endIso,staffIds:[],status:"all",type:"all",search:"",sortKey:"date-desc",page:1,pageSize:gt,columnFilters:{date:"",staff:"",description:"",time:"",type:"",status:""},selectedKeys:[],columnVisibility:{type:!0,status:!0,sourceTime:!0},users:[],data:[],filtered:[],lastRefreshed:null}}return window.app_teamActivitiesState}function Zn(a){return(a||[]).map(e=>{const t=e.type||(e.workDescription?"attendance":"work"),n=e._displayDesc||e.workDescription||e.task||"Activity",i=e.checkOut||e._sortTime||"00:00",s=e.status||(t==="attendance"?"completed":""),o=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(e.date,s):s||"to-be-started";return{date:e.date||"",staffName:e.staffName||e.userName||"Unknown Staff",type:t,description:n,status:o,sourceTime:i,userId:e.userId||e.user_id||"",planId:e.planId||e.id||"",taskIndex:Number.isInteger(e.taskIndex)?e.taskIndex:null,planScope:e.planScope||"personal",progressPercent:Number.isFinite(Number(e.progressPercent))?Number(e.progressPercent):null,progressStatus:e.progressStatus||"",progressNote:e.progressNote||""}})}function ei(a){const e=String(a||"").toLowerCase();return["overdue","not-completed","to-be-started","in-process"].includes(e)}function ti(a){const e=new Date(a);return Number.isNaN(e.getTime())?new Date().toISOString().split("T")[0]:(e.setDate(e.getDate()+1),e.toISOString().split("T")[0])}function ai(a){const e=String(a||"").trim();if(!e||!/^\d{4}-\d{2}-\d{2}$/.test(e))return!1;const t=new Date(e);return!Number.isNaN(t.getTime())&&t.toISOString().startsWith(e)}function ni(a,e){return new Promise(t=>{if(!a){t(null);return}const n=document.getElementById("team-activities-postpone-popover");n&&n.remove();const i=document.createElement("div");i.id="team-activities-postpone-popover",i.className="team-activities-postpone-popover",i.innerHTML=`
            <div class="team-activities-postpone-head">Postpone to</div>
            <input type="date" class="team-activities-postpone-input" value="${e}">
            <div class="team-activities-postpone-actions">
                <button type="button" class="team-activities-row-btn warn" data-postpone-cancel>Cancel</button>
                <button type="button" class="team-activities-row-btn success" data-postpone-confirm>Confirm</button>
            </div>
        `,document.body.appendChild(i);const s=a.getBoundingClientRect(),o=s.bottom+window.scrollY+8,r=Math.min(s.left+window.scrollX,window.innerWidth-260);i.style.top=`${o}px`,i.style.left=`${r}px`;const d=i.querySelector(".team-activities-postpone-input");d&&d.focus();const l=p=>{document.removeEventListener("click",c,!0),i.remove(),t(p)},c=p=>{!i.contains(p.target)&&p.target!==a&&l(null)};document.addEventListener("click",c,!0),i.addEventListener("click",p=>{const m=p.target;if(m.closest("[data-postpone-cancel]")&&l(null),m.closest("[data-postpone-confirm]")){const u=d?d.value:"";l(u||null)}})})}function ii(a){const e=a.search.trim().toLowerCase(),t=new Set(a.staffIds||[]),n=a.status,i=a.type,s=a.columnFilters||{},o=String(s.date||"").trim(),r=String(s.staff||"").trim().toLowerCase(),d=String(s.description||"").trim().toLowerCase(),l=String(s.time||"").trim().toLowerCase(),c=String(s.type||"").trim().toLowerCase(),p=String(s.status||"").trim().toLowerCase();let m=a.data.filter(u=>!(t.size&&!t.has(u.userId)||i!=="all"&&u.type!==i||n!=="all"&&String(u.status||"").toLowerCase()!==n||e&&!`${u.date} ${u.staffName} ${u.description} ${u.status} ${u.type}`.toLowerCase().includes(e)||o&&String(u.date||"")!==o||r&&!String(u.staffName||"").toLowerCase().includes(r)||d&&!String(u.description||"").toLowerCase().includes(d)||l&&!String(u.sourceTime||"").toLowerCase().includes(l)||c&&!String(u.type||"").toLowerCase().includes(c)||p&&!String(u.status||"").toLowerCase().includes(p)));return m=si(m,a.sortKey),a.filtered=m,m}function si(a,e){const t=[...a];return t.sort((n,i)=>{const s=new Date(i.date)-new Date(n.date),o=String(i.sourceTime||"").localeCompare(String(n.sourceTime||"")),r=String(n.staffName||"").localeCompare(String(i.staffName||"")),d=l=>l.type==="work"&&l.planId&&Number.isInteger(l.taskIndex);return e==="date-desc"?s||o:e==="date-asc"?new Date(n.date)-new Date(i.date)||o:e==="staff-asc"?r||s:e==="staff-desc"?-r||s:e==="status"?String(n.status||"").localeCompare(String(i.status||""))||s:e==="status-desc"?String(i.status||"").localeCompare(String(n.status||""))||s:e==="type"?String(n.type||"").localeCompare(String(i.type||""))||s:e==="type-desc"?String(i.type||"").localeCompare(String(n.type||""))||s:e==="description"?String(n.description||"").localeCompare(String(i.description||""))||s:e==="description-desc"?String(i.description||"").localeCompare(String(n.description||""))||s:e==="time"?String(n.sourceTime||"").localeCompare(String(i.sourceTime||""))||s:e==="time-desc"?String(i.sourceTime||"").localeCompare(String(n.sourceTime||""))||s:e==="actions"?Number(d(i))-Number(d(n))||s:e==="actions-desc"?Number(d(n))-Number(d(i))||s:s||o}),t}function oi(a,e,t){const i=(Math.max(1,e)-1)*t;return a.slice(i,i+t)}function ja(a){const e=a.filtered.length,t=new Set(a.filtered.map(s=>s.userId).filter(Boolean)),n=a.filtered.filter(s=>String(s.status).toLowerCase()==="completed").length,i=e-n;return`
        <div class="team-activities-chip">Total: <strong>${e}</strong></div>
        <div class="team-activities-chip">Staff: <strong>${t.size}</strong></div>
        <div class="team-activities-chip">Completed: <strong>${n}</strong></div>
        <div class="team-activities-chip">Incomplete: <strong>${i}</strong></div>
    `}function Ya(a){const e=a.users||[],t=new Set(a.staffIds||[]),n=t.size?`${t.size} selected`:"All staff",i=e.map(s=>`
        <label class="team-activities-checkbox">
            <input type="checkbox" data-staff-id="${s.id}" ${t.has(s.id)?"checked":""}>
            <span>${$(s.name||"Staff")}</span>
        </label>
    `).join("");return`
        <div class="team-activities-dropdown">
            <button class="team-activities-dropdown-btn" type="button" data-team-activities-staff-toggle>
                <i class="fa-solid fa-users"></i>
                <span>Staff: ${$(n)}</span>
                <i class="fa-solid fa-chevron-down"></i>
            </button>
            <div class="team-activities-dropdown-panel" id="team-activities-staff-panel">
                <div class="team-activities-dropdown-actions">
                    <button type="button" class="team-activities-link" data-staff-select-all>Select all</button>
                    <button type="button" class="team-activities-link" data-staff-clear>Clear</button>
                </div>
                <div class="team-activities-dropdown-list">
                    ${i||'<div class="team-activities-empty">No staff found.</div>'}
                </div>
            </div>
        </div>
    `}function Wa(a){const e=a.columnVisibility;return`
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
    `}function Ce(a,e,t,n){const i=n.sortKey===e?"▼":n.sortKey===t?"▲":"⇅";return`${$(a)} <span class="team-activities-sort">${i}</span>`}function ri(a){const e=a.columnVisibility,t=oi(a.filtered,a.page,a.pageSize);if(!t.length)return'<div class="team-activities-empty">No activities found for the selected filters.</div>';const n=new Set(a.selectedKeys||[]),i=window.AppAuth?.getUser?window.AppAuth.getUser()?.id:null,s=window.AppAuth?.getUser?window.AppAuth.getUser():null,o=!!(s&&(s.role==="Administrator"||s.isAdmin)),r=`
        <th data-sort="date-desc" data-sort-alt="date-asc">${Ce("Date","date-desc","date-asc",a)}</th>
        <th data-sort="staff-asc" data-sort-alt="staff-desc">${Ce("Staff","staff-asc","staff-desc",a)}</th>
        ${e.type?`<th data-sort="type" data-sort-alt="type-desc">${Ce("Type","type","type-desc",a)}</th>`:""}
        ${e.status?`<th data-sort="status" data-sort-alt="status-desc">${Ce("Status","status","status-desc",a)}</th>`:""}
        <th data-sort="description" data-sort-alt="description-desc">${Ce("Description","description","description-desc",a)}</th>
        ${e.sourceTime?`<th data-sort="time" data-sort-alt="time-desc">${Ce("Time","time","time-desc",a)}</th>`:""}
        <th data-sort="actions" data-sort-alt="actions-desc">${Ce("Actions","actions","actions-desc",a)}</th>
    `,d=[],l=t.map(f=>{const g=String(f.status||"").toLowerCase().replace(/\s+/g,"-"),y=i&&f.userId&&i===f.userId,k=f.type==="work"&&f.planId&&Number.isInteger(f.taskIndex)&&(y||o),T=`${f.planId||""}__${Number.isInteger(f.taskIndex)?f.taskIndex:""}`;k&&d.push(T);const S=f.type==="work"&&(f.progressPercent!==null||f.progressStatus||f.progressNote),A=f.progressStatus?String(f.progressStatus).replace(/_/g," "):"",h=f.progressPercent!==null?`${f.progressPercent}%`:"",w=String(f.progressNote||"").trim(),v=w?` title="${$(w)}"`:"",_=S?`<div class="team-activities-progress"${v}>${$(h)}${h&&A?" &bull; ":""}${$(A)}</div>`:"";return`
        <tr>
            ${o?`
            <td class="team-activities-select-col">
                ${k?`<input type="checkbox" class="team-activities-row-select" data-row-key="${$(T)}" ${n.has(T)?"checked":""}>`:""}
            </td>
        `:'<td class="team-activities-select-col"></td>'}
            <td>${$(f.date)}</td>
            <td>${$(f.staffName)}</td>
            ${e.type?`<td class="team-activities-type">${$(f.type)}</td>`:""}
            ${e.status?`<td><span class="team-activities-status status-${$(g)}">${$(f.status)}</span></td>`:""}
            <td class="team-activities-desc">${$(f.description)}${_}</td>
            ${e.sourceTime?`<td>${$(f.sourceTime||"--")}</td>`:""}
            <td>
                <div class="team-activities-row-actions">
                    <button class="team-activities-row-btn" data-view-date="${$(f.date)}" data-view-user="${$(f.userId)}">
                        <i class="fa-solid fa-eye"></i> View
                    </button>
                    ${f.type==="work"&&y&&ei(f.status)&&f.planId&&Number.isInteger(f.taskIndex)?`
                        <button class="team-activities-row-btn warn" data-action="postpone" data-plan-id="${$(f.planId)}" data-task-index="${f.taskIndex}" data-plan-scope="${$(f.planScope)}" data-user-id="${$(f.userId)}" data-date="${$(f.date)}">
                            <i class="fa-solid fa-clock"></i> Postpone
                        </button>
                        <button class="team-activities-row-btn success" data-action="complete" data-plan-id="${$(f.planId)}" data-task-index="${f.taskIndex}" data-user-id="${$(f.userId)}">
                            <i class="fa-solid fa-check"></i> Complete
                        </button>
                    `:""}
                    ${k?`
                        <button class="team-activities-row-btn danger" data-action="remove" data-plan-id="${$(f.planId)}" data-task-index="${f.taskIndex}" data-user-id="${$(f.userId)}">
                            <i class="fa-solid fa-trash"></i> Remove
                        </button>
                    `:""}
                </div>
            </td>
        </tr>
    `}).join(""),c=d.length>0&&d.every(f=>n.has(f)),p=o?`
        <div class="team-activities-bulk-bar">
            <div><strong>${n.size}</strong> selected</div>
            <div class="team-activities-bulk-actions">
                <button type="button" class="team-activities-row-btn secondary" data-bulk-clear ${n.size?"":"disabled"}>Clear</button>
                <button type="button" class="team-activities-row-btn danger" data-bulk-remove ${n.size?"":"disabled"}>Bulk Remove</button>
            </div>
        </div>
    `:"",m=o?`<th class="team-activities-select-col"><input type="checkbox" data-select-visible ${d.length?"":"disabled"} ${c?"checked":""}></th>`:'<th class="team-activities-select-col"></th>',u=`
        <tr class="team-activities-filter-row">
            <td></td>
            <td><input type="date" id="team-activities-filter-date" value="${$(a.columnFilters.date||"")}"></td>
            <td><input type="text" id="team-activities-filter-staff" placeholder="Filter staff" value="${$(a.columnFilters.staff||"")}"></td>
            ${e.type?`<td><input type="text" id="team-activities-filter-type" placeholder="Filter type" value="${$(a.columnFilters.type||"")}"></td>`:""}
            ${e.status?`<td><input type="text" id="team-activities-filter-status" placeholder="Filter status" value="${$(a.columnFilters.status||"")}"></td>`:""}
            <td><input type="text" id="team-activities-filter-desc" placeholder="Filter description" value="${$(a.columnFilters.description||"")}"></td>
            ${e.sourceTime?`<td><input type="text" id="team-activities-filter-time" placeholder="HH:MM" value="${$(a.columnFilters.time||"")}"></td>`:""}
            <td></td>
        </tr>
    `;return`
        ${p}
        <table class="team-activities-table">
            <thead><tr>${m}${r}</tr></thead>
            <tbody>${u}${l}</tbody>
        </table>
    `}function di(a){const e=a.filtered.length,t=Math.max(1,Math.ceil(e/a.pageSize)),n=Math.min(a.page,t);return`
        <div class="team-activities-pagination">
            <button class="team-activities-page-btn" data-page="prev" ${n<=1?"disabled":""}>Prev</button>
            <span>Page ${n} of ${t}</span>
            <button class="team-activities-page-btn" data-page="next" ${n>=t?"disabled":""}>Next</button>
        </div>
    `}function oe(){const a=ge();a.columnVisibility.sourceTime=!0,ii(a);const e=Math.max(1,Math.ceil(a.filtered.length/a.pageSize));a.page>e&&(a.page=e);const t=document.getElementById("team-activities-summary"),n=document.getElementById("team-activities-table-wrap"),i=document.getElementById("team-activities-pagination-wrap"),s=document.getElementById("team-activities-last-updated"),o=document.getElementById("team-activities-columns-wrap"),r=document.getElementById("team-activities-staff-wrap");t&&(t.innerHTML=ja(a)),n&&(n.innerHTML=ri(a)),i&&(i.innerHTML=di(a)),o&&(o.innerHTML=Wa(a)),r&&(r.innerHTML=Ya(a)),s&&a.lastRefreshed&&(s.textContent=new Date(a.lastRefreshed).toLocaleString());const d=n?.querySelector("[data-select-visible]");if(d){const l=Array.from(n.querySelectorAll("input[data-row-key]")),c=l.filter(p=>p.checked).length;d.indeterminate=c>0&&c<l.length}}async function xe(){const a=ge(),e=document.getElementById("team-activities-loading");e&&(e.style.display="block");try{const t=await window.AppAnalytics.getAllStaffActivities({mode:"range",startIso:a.startIso,endIso:a.endIso,scope:"all"});a.data=Zn(t),a.lastRefreshed=Date.now(),a.page=1,a.selectedKeys=[]}catch(t){console.error("Team Activities fetch failed",t)}finally{e&&(e.style.display="none")}oe()}function ut(){const a=ge(),e=document.getElementById("team-activities-start"),t=document.getElementById("team-activities-end"),n=document.getElementById("team-activities-type"),i=document.getElementById("team-activities-status"),s=document.getElementById("team-activities-search"),o=document.getElementById("team-activities-page-size");e&&(a.startIso=e.value||a.startIso),t&&(a.endIso=t.value||a.endIso),n&&(a.type=n.value||"all"),i&&(a.status=i.value||"all"),s&&(a.search=s.value||""),o&&(a.pageSize=Number(o.value)||gt),a.page=1,oe()}function li(){const a=ge();if(a.bound)return;a.bound=!0;let e=null;document.addEventListener("click",async t=>{const n=t.target,i=n.closest("[data-team-activities-staff-toggle]"),s=document.getElementById("team-activities-staff-panel"),o=n.closest("[data-team-activities-columns-toggle]"),r=document.getElementById("team-activities-columns-popover");i&&s?s.classList.toggle("open"):s&&!s.contains(n)&&s.classList.remove("open"),o&&r?r.classList.toggle("open"):r&&!r.contains(n)&&r.classList.remove("open");const d=n.closest(".team-activities-page-btn");if(d){const y=d.dataset.page,k=Math.max(1,Math.ceil(a.filtered.length/a.pageSize));y==="prev"&&(a.page=Math.max(1,a.page-1)),y==="next"&&(a.page=Math.min(k,a.page+1)),oe()}const l=n.closest("[data-view-date]");if(l){const y=l.getAttribute("data-view-date"),k=l.getAttribute("data-view-user");window.app_openDayPlan&&window.app_openDayPlan(y,k||"")}const c=n.closest("[data-action]");if(c){const y=c.getAttribute("data-action");y==="complete"&&window.app_teamActivitiesCompleteTask&&await window.app_teamActivitiesCompleteTask(c),y==="postpone"&&window.app_teamActivitiesPostponeTask&&await window.app_teamActivitiesPostponeTask(c),y==="remove"&&window.app_teamActivitiesRemoveTask&&await window.app_teamActivitiesRemoveTask(c)}const p=n.closest("th[data-sort]");if(p){const y=p.dataset.sort,k=p.dataset.sortAlt;let T=y;a.sortKey===y&&k?T=k:a.sortKey===k&&y&&(T=y),T&&(a.sortKey=T,oe())}n.closest("[data-staff-select-all]")&&(a.staffIds=(a.users||[]).map(y=>y.id),oe()),n.closest("[data-staff-clear]")&&(a.staffIds=[],oe()),n.closest("[data-bulk-clear]")&&(a.selectedKeys=[],oe()),n.closest("[data-bulk-remove]")&&window.app_teamActivitiesBulkRemove&&await window.app_teamActivitiesBulkRemove()}),document.addEventListener("change",t=>{const n=t.target;if(n.matches("#team-activities-start, #team-activities-end")?(ut(),xe()):n.matches("#team-activities-type, #team-activities-status, #team-activities-page-size")&&ut(),n.matches('#team-activities-columns-popover input[type="checkbox"]')){const i=n.getAttribute("data-column");i&&(a.columnVisibility[i]=n.checked),oe()}if(n.matches('#team-activities-staff-panel input[type="checkbox"]')){const i=n.getAttribute("data-staff-id");if(!i)return;n.checked?a.staffIds.includes(i)||a.staffIds.push(i):a.staffIds=a.staffIds.filter(s=>s!==i),oe()}if(n.matches("#team-activities-filter-date")&&(a.columnFilters.date=n.value||"",oe()),n.matches("#team-activities-filter-staff")&&(a.columnFilters.staff=n.value||"",oe()),n.matches("#team-activities-filter-desc")&&(a.columnFilters.description=n.value||"",oe()),n.matches("#team-activities-filter-time")&&(a.columnFilters.time=n.value||"",oe()),n.matches("#team-activities-filter-type")&&(a.columnFilters.type=n.value||"",oe()),n.matches("#team-activities-filter-status")&&(a.columnFilters.status=n.value||"",oe()),n.matches("input[data-row-key]")){const i=n.getAttribute("data-row-key");if(!i)return;const s=new Set(a.selectedKeys||[]);n.checked?s.add(i):s.delete(i),a.selectedKeys=Array.from(s),oe()}if(n.matches("[data-select-visible]")){const i=document.getElementById("team-activities-table-wrap"),s=Array.from(i?.querySelectorAll("input[data-row-key]")||[]),o=new Set(a.selectedKeys||[]);s.forEach(r=>{const d=r.getAttribute("data-row-key");d&&(r.checked=n.checked,n.checked?o.add(d):o.delete(d))}),a.selectedKeys=Array.from(o),oe()}}),document.addEventListener("input",t=>{t.target.matches("#team-activities-search")&&(e&&clearTimeout(e),e=setTimeout(()=>ut(),Xn))})}function ci(a){const e=["Date","Staff","Type","Status","Description","Time"],t=a.map(n=>[n.date,n.staffName,n.type,n.status,n.description,n.sourceTime].map(i=>`"${String(i||"").replace(/"/g,'""')}"`).join(","));return[e.join(","),...t].join(`
`)}typeof window<"u"&&(window.app_initTeamActivities=async function(){const a=ge(),e=await window.AppAnalytics.getUsersCached();a.users=e||[],li(),oe(),await xe()},window.app_teamActivitiesRefresh=async function(){ut(),await xe()},window.app_teamActivitiesResetFilters=function(){const a=ge(),e=za();a.startIso=e.startIso,a.endIso=e.endIso,a.staffIds=[],a.status="all",a.type="all",a.search="",a.columnFilters={date:"",staff:"",description:"",time:"",type:"",status:""},a.sortKey="date-desc",a.page=1,a.pageSize=gt,a.selectedKeys=[];const t=document.getElementById("team-activities-start"),n=document.getElementById("team-activities-end"),i=document.getElementById("team-activities-type"),s=document.getElementById("team-activities-status"),o=document.getElementById("team-activities-search"),r=document.getElementById("team-activities-page-size");t&&(t.value=a.startIso),n&&(n.value=a.endIso),i&&(i.value="all"),s&&(s.value="all"),o&&(o.value=""),r&&(r.value=String(gt)),oe(),xe()},window.app_teamActivitiesCopyCSV=async function(){const a=ge(),e=ci(a.filtered);try{await navigator.clipboard.writeText(e),alert("Table copied to clipboard.")}catch(t){console.warn("Clipboard copy failed",t),alert("Copy failed. Please use Export Excel instead.")}},window.app_teamActivitiesExportXLSX=function(){const a=ge();window.AppReports?.exportTeamActivitiesXLSX?window.AppReports.exportTeamActivitiesXLSX(a.filtered,{start:a.startIso,end:a.endIso}):alert("Export module not available.")},window.app_teamActivitiesCompleteTask=async function(a){try{const e=window.AppAuth?.getUser?window.AppAuth.getUser()?.id:null,t=a.getAttribute("data-plan-id"),n=Number(a.getAttribute("data-task-index")),i=a.getAttribute("data-user-id")||"";if(!e||e!==i){alert("Only the assigned staff member can complete this task.");return}if(!t||!Number.isInteger(n)||!window.AppCalendar?.updateTaskStatus)return;a.disabled=!0,await window.AppCalendar.updateTaskStatus(t,n,"completed"),await xe(),window.app_showSyncToast&&window.app_showSyncToast("Task marked as completed.")}catch(e){console.error("Complete task failed",e),alert("Failed to complete task.")}},window.app_teamActivitiesPostponeTask=async function(a){try{const e=window.AppAuth?.getUser?window.AppAuth.getUser()?.id:null,t=a.getAttribute("data-plan-id"),n=Number(a.getAttribute("data-task-index")),i=a.getAttribute("data-plan-scope")||"personal",s=a.getAttribute("data-user-id")||"",o=a.getAttribute("data-date")||"";if(!e||e!==s){alert("Only the assigned staff member can postpone this task.");return}if(!t||!Number.isInteger(n)||!window.AppDB||!window.AppCalendar)return;a.disabled=!0;const r=await window.AppDB.get("work_plans",t);if(!r||!Array.isArray(r.plans)||!r.plans[n])throw new Error("Plan or task not found");const d=ti(o),l=await ni(a,d);if(!l){a.disabled=!1;return}const c=String(l).trim();if(!ai(c)){alert("Invalid date. Please use YYYY-MM-DD."),a.disabled=!1;return}const[p]=r.plans.splice(n,1);r.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",r);const m=c,u=i||r.planScope||"personal",f=u==="annual"?"annual_shared":r.userId||s,g=window.AppCalendar.getWorkPlanId(m,f,u),y={...p,status:"",startDate:m,endDate:m};delete y.completedDate;const k=await window.AppDB.get("work_plans",g);if(k)k.plans=Array.isArray(k.plans)?k.plans:[],k.plans.push(y),k.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",k);else{const T=u==="annual"?null:f;await window.AppCalendar.setWorkPlan(m,[y],T,{planScope:u})}await xe(),window.app_showSyncToast&&window.app_showSyncToast(`Task postponed to ${m}.`)}catch(e){console.error("Postpone task failed",e),alert("Failed to postpone task.")}},window.app_teamActivitiesBulkRemove=async function(){try{const a=ge(),e=window.AppAuth?.getUser?window.AppAuth.getUser():null;if(!!!(e&&(e.role==="Administrator"||e.isAdmin))){alert("Only admins can bulk remove tasks.");return}if(!window.AppCalendar?.removeTask){alert("Remove action is not available.");return}const n=new Set(a.selectedKeys||[]);if(!n.size){alert("Select at least one removable task.");return}const i=a.filtered.filter(s=>{const o=`${s.planId||""}__${Number.isInteger(s.taskIndex)?s.taskIndex:""}`;return n.has(o)&&s.type==="work"&&s.planId&&Number.isInteger(s.taskIndex)});if(!i.length){alert("No removable tasks in selection.");return}if(!window.appConfirm||!await window.appConfirm(`Remove ${i.length} selected task(s) so they stop carrying forward?`))return;for(const s of i)await window.AppCalendar.removeTask(s.planId,s.taskIndex);a.selectedKeys=[],await xe(),window.app_showSyncToast&&window.app_showSyncToast(`${i.length} task(s) removed.`)}catch(a){console.error("Bulk remove failed",a),alert("Failed to bulk remove tasks.")}},window.app_teamActivitiesRemoveTask=async function(a){try{const e=window.AppAuth?.getUser?window.AppAuth.getUser():null,t=e?.id||null,n=!!(e&&(e.role==="Administrator"||e.isAdmin)),i=a.getAttribute("data-plan-id"),s=Number(a.getAttribute("data-task-index")),o=a.getAttribute("data-user-id")||"";if(!i||!Number.isInteger(s)||!window.AppCalendar?.removeTask)return;if(!n&&(!t||t!==o)){alert("Only the assigned staff member or an admin can remove this task.");return}if(!window.appConfirm||!await window.appConfirm("Remove this task so it stops carrying forward?"))return;a.disabled=!0,await window.AppCalendar.removeTask(i,s),await xe(),window.app_showSyncToast&&window.app_showSyncToast("Task removed.")}catch(e){console.error("Remove task failed",e),alert("Failed to remove task.")}});async function pi(){const a=ge();return`
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
                        <div id="team-activities-columns-wrap">${Wa(a)}</div>
                    </div>
                </div>
            </div>
            <div class="team-activities-summary" id="team-activities-summary">${ja(a)}</div>
            <div class="team-activities-filters">
                <div class="team-activities-filter-group">
                    <label>Date range</label>
                    <div class="team-activities-date-range">
                        <input type="date" id="team-activities-start" value="${a.startIso}">
                        <span>to</span>
                        <input type="date" id="team-activities-end" value="${a.endIso}">
                    </div>
                </div>
                <div class="team-activities-filter-group" id="team-activities-staff-wrap">
                    ${Ya(a)}
                </div>
                <div class="team-activities-filter-group">
                    <label>Type</label>
                    <select id="team-activities-type">
                        <option value="all" ${a.type==="all"?"selected":""}>All</option>
                        <option value="attendance" ${a.type==="attendance"?"selected":""}>Attendance</option>
                        <option value="work" ${a.type==="work"?"selected":""}>Work Plan</option>
                    </select>
                </div>
                <div class="team-activities-filter-group">
                    <label>Status</label>
                    <select id="team-activities-status">
                        <option value="all" ${a.status==="all"?"selected":""}>All</option>
                        <option value="completed" ${a.status==="completed"?"selected":""}>Completed</option>
                        <option value="in-process" ${a.status==="in-process"?"selected":""}>In Process</option>
                        <option value="overdue" ${a.status==="overdue"?"selected":""}>Overdue</option>
                        <option value="not-completed" ${a.status==="not-completed"?"selected":""}>Not Completed</option>
                        <option value="to-be-started" ${a.status==="to-be-started"?"selected":""}>To Be Started</option>
                    </select>
                </div>
                <div class="team-activities-filter-group">
                    <label>Search</label>
                    <input type="text" id="team-activities-search" placeholder="Search by staff, description, date...">
                </div>
                <div class="team-activities-filter-group">
                    <label>Page size</label>
                    <select id="team-activities-page-size">
                        <option value="25" ${a.pageSize===25?"selected":""}>25</option>
                        <option value="50" ${a.pageSize===50?"selected":""}>50</option>
                        <option value="100" ${a.pageSize===100?"selected":""}>100</option>
                    </select>
                </div>
            </div>
            <div id="team-activities-loading" class="team-activities-loading">Loading data...</div>
            <div class="team-activities-table-wrap" id="team-activities-table-wrap"></div>
            <div id="team-activities-pagination-wrap"></div>
        </div>
    `}const F={renderDashboard:kt,renderHeroCard:Se,renderWorkLog:Da,renderActivityList:xa,renderActivityLog:$a,renderStaffActivityListSplit:St,renderStaffActivityColumn:Ht,renderStatsCard:qe,renderBreakdown:Ta,renderLeaveRequests:Ia,renderLeaveHistory:Ma,renderNotificationPanel:Ca,renderTaggedItems:La,renderStaffDirectory:_n,renderStaffDirectoryPage:En,renderAnnualPlan:ze,renderTimesheet:je,renderProfile:Na,renderMasterSheet:Ba,renderAdmin:qt,renderBirthdayCalendar:Yn,renderSalaryProcessing:Wn,renderPolicyTest:Kn,renderMinutes:qa,renderCheckInModal:Vn,renderLogin:Jn,renderModals:Qn,renderYearlyPlan:Gt,renderTeamActivitiesPage:pi};typeof window<"u"&&(window.AppUI=F);class ui{constructor(){this.db=K}normalizePlanTasks(e){return Array.isArray(e?.plans)?e.plans.filter(t=>t&&t.isRemoved!==!0):[]}getSmartTaskStatus(e,t=null){if(t==="completed"||t==="not-completed")return t;const n=new Date().toISOString().split("T")[0],i=typeof e=="string"?e:e.toISOString().split("T")[0];return i>n?"to-be-started":i===n?"in-process":i<n?"overdue":"in-process"}calculateTaskPoints(e,t){const n=this.getSmartTaskStatus(t,e.status);let i=0;switch(n){case"completed":if(i=10,e.completedDate){const s=this.getDaysDifference(t,e.completedDate);s===0?i+=3:s===1?i-=1:s>=2&&(i-=2)}break;case"in-process":i=5;break;case"to-be-started":i=0;break;case"overdue":i=-8;break;case"not-completed":i=-3;break}return i}getDaysDifference(e,t){const n=new Date(e),s=new Date(t)-n;return Math.floor(s/(1e3*60*60*24))}getCompletionStats(e){let t=0,n=0,i=0,s=0,o=0,r=0;e.forEach(l=>{this.normalizePlanTasks(l).forEach(p=>{switch(r++,this.getSmartTaskStatus(l.date,p.status)){case"completed":t++;break;case"in-process":n++;break;case"not-completed":i++;break;case"overdue":s++;break;case"to-be-started":o++;break}})});const d=r>0?t/r:0;return{completed:t,inProcess:n,notCompleted:i,overdue:s,toBeStarted:o,totalTasks:r,completionRate:parseFloat(d.toFixed(2)),lastCalculated:new Date().toISOString()}}async calculateUserRating(e,t=30){try{const n=await this.db.getAll("work_plans"),i=new Date;i.setDate(i.getDate()-t);const s=i.toISOString().split("T")[0],o=n.filter(c=>c.userId===e&&c.date>=s);if(o.length===0)return{rating:3,rawScore:0,stats:{completed:0,inProcess:0,notCompleted:0,overdue:0,toBeStarted:0,totalTasks:0,completionRate:0,lastCalculated:new Date().toISOString()}};let r=0;o.forEach(c=>{this.normalizePlanTasks(c).forEach(m=>{r+=this.calculateTaskPoints(m,c.date)})});const d=this.getCompletionStats(o),l=this.normalizeScore(r,-50,150);return{rating:parseFloat(l.toFixed(1)),rawScore:r,stats:d}}catch(n){return console.error("Rating calculation failed:",n),{rating:3,rawScore:0,stats:{completed:0,inProcess:0,notCompleted:0,overdue:0,toBeStarted:0,totalTasks:0,completionRate:0,lastCalculated:new Date().toISOString()}}}}normalizeScore(e,t,n){const s=1+(Math.max(t,Math.min(n,e))-t)/(n-t)*4;return Math.max(1,Math.min(5,s))}async updateUserRating(e){try{const t=await this.calculateUserRating(e),n=await this.db.get("users",e);if(!n)throw new Error("User not found");n.ratingHistory||(n.ratingHistory=[]);const i=new Date().toISOString().split("T")[0];return n.ratingHistory.push({date:i,rating:t.rating,reason:"auto-calculated"}),n.ratingHistory.length>90&&(n.ratingHistory=n.ratingHistory.slice(-90)),n.rating=t.rating,n.completionStats=t.stats,await this.db.put("users",n),n}catch(t){throw console.error("Failed to update user rating:",t),t}}async updateAllRatings(){try{const e=await this.db.getAll("users"),t=[];for(const n of e)try{const i=await this.updateUserRating(n.id);t.push(i)}catch(i){console.error(`Failed to update rating for ${n.name}:`,i)}return t}catch(e){throw console.error("Failed to update all ratings:",e),e}}async getTopPerformers(e=5){try{return(await this.db.getAll("users")).filter(i=>i.rating!==void 0).sort((i,s)=>(s.rating||0)-(i.rating||0)).slice(0,e).map(i=>({id:i.id,name:i.name,avatar:i.avatar,rating:i.rating||0,completionStats:i.completionStats||{}}))}catch(t){return console.error("Failed to get top performers:",t),[]}}async getRatingHistory(e,t=90){try{const n=await this.db.get("users",e);if(!n||!n.ratingHistory)return[];const i=new Date;i.setDate(i.getDate()-t);const s=i.toISOString().split("T")[0];return n.ratingHistory.filter(o=>o.date>=s)}catch(n){return console.error("Failed to get rating history:",n),[]}}}const Ye=new ui;typeof window<"u"&&(window.AppRating=Ye);class mi{constructor(){this.db=K}getTodayKey(){const e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}normalizePlanScope(e){return String(e||"").toLowerCase()==="annual"?"annual":"personal"}normalizeTaskStatus(e){const t=String(e||"").trim().toLowerCase();return t==="in-progress"?"in-process":t}getTaskRootId(e={},t="",n=0){return e.carryForwardRootId?String(e.carryForwardRootId):e.sourcePlanId&&Number.isInteger(e.sourceTaskIndex)?`${e.sourcePlanId}::${e.sourceTaskIndex}`:`${t}::${n}`}sanitizePlanTasks(e=[]){return(Array.isArray(e)?e:[]).filter(t=>t&&t.isRemoved!==!0)}isTaskClosed(e={},t=""){if(!e||e.isRemoved===!0)return!0;const n=this.normalizeTaskStatus(e.status);if(n==="completed"||n==="not-completed"||n==="cancelled")return!0;const i=this.getSmartTaskStatus(t||e.startDate||"",n||null);return i==="completed"||i==="not-completed"}cloneTaskForDate(e={},t,n,i={}){const s={...e,startDate:t,endDate:t,carryForwardRootId:n,carriedForwardFromDate:i.date||e.startDate||"",carriedForwardFromPlanId:i.id||e.carriedForwardFromPlanId||null,autoForwardedAt:new Date().toISOString(),isAutoForwarded:!0};return this.normalizeTaskStatus(s.status)!=="in-process"&&(s.status=""),delete s.completedDate,delete s.removedAt,delete s.removedBy,s.isRemoved=!1,s}async getAllWorkPlansUntil(e){return this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:"<=",value:e}]).catch(()=>this.db.getAll("work_plans")):this.db.getAll("work_plans")}buildDateRange(e,t){const n=new Date(`${e}T00:00:00`),i=new Date(`${t}T00:00:00`);if(Number.isNaN(n.getTime())||Number.isNaN(i.getTime())||n>i)return[];const s=[],o=new Date(n);for(;o<=i;)s.push(`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`),o.setDate(o.getDate()+1);return s}async ensureCarryForwardForRange(e,t,n={}){const i=String(t||"").trim();if(!i)return{created:0,updatedPlans:[]};const s=this.getTodayKey(),o=i>s?s:i,r=String(e||o).trim()||o;if(r>o)return{created:0,updatedPlans:[]};const d=Array.isArray(n.userIds)?n.userIds.map(u=>String(u||"").trim()).filter(Boolean):null,l=(await this.getAllWorkPlansUntil(o)).filter(u=>!!u&&!!u.date&&u.date<=o),c=new Map,p=(u,f,g)=>{const y=`${f}::${g}`;c.has(y)||c.set(y,new Map),c.get(y).set(u.date,{...u,planScope:f,plans:Array.isArray(u.plans)?[...u.plans]:[]})};l.forEach(u=>{if(this.normalizePlanScope(u.planScope)==="personal"){const g=String(u.userId||"").trim();if(!g||g==="annual_shared"||d&&!d.includes(g))return;p(u,"personal",g);return}p(u,"annual","annual_shared")});const m=[];for(const[u,f]of c.entries()){const[g,y]=u.split("::"),k=this.buildDateRange(r,o),T=Array.from(f.keys()).filter(A=>A<r).sort(),S=new Map;T.forEach(A=>{const h=f.get(A);h&&(Array.isArray(h.plans)?h.plans:[]).forEach((w,v)=>{const _=this.getTaskRootId(w,h.id,v);if(this.isTaskClosed(w,h.date)){S.delete(_);return}S.set(_,{task:w,plan:h,index:v})})});for(const A of k){let h=f.get(A)||null;const w=h&&Array.isArray(h.plans)?[...h.plans]:[],v=new Set;w.forEach((x,D)=>{v.add(this.getTaskRootId(x,h?.id||this.getWorkPlanId(A,y,g),D))});const _=[];if(S.forEach(({task:x,plan:D,index:M},R)=>{v.has(R)||_.push(this.cloneTaskForDate(x,A,R,{id:D.id,date:D.date,sourceTaskIndex:M}))}),_.length>0){const x=_[0],D=g==="annual"?"All Staff":x?.assignedToName||Array.from(S.values())[0]?.plan?.userName||"";h||(h={id:this.getWorkPlanId(A,y,g),userId:g==="annual"?"annual_shared":y,userName:D,date:A,plans:[],planScope:g}),h.plans=[...w,..._],h.updatedAt=new Date().toISOString(),await this.db.put("work_plans",h),f.set(A,h),m.push(h.id)}const L=f.get(A);(L&&Array.isArray(L.plans)?L.plans:[]).forEach((x,D)=>{const M=this.getTaskRootId(x,L.id,D);if(this.isTaskClosed(x,L.date)){S.delete(M);return}S.set(M,{task:x,plan:L,index:D})})}}return{created:m.length,updatedPlans:m}}async ensureCarryForwardForDate(e,t={}){const n=String(e||"").trim();return n?this.ensureCarryForwardForRange(n,n,t):{created:0,updatedPlans:[]}}getWorkPlanId(e,t=null,n="personal"){return this.normalizePlanScope(n)==="annual"?`plan_annual_${e}`:`plan_${t}_${e}`}async getPlans(){try{const e=new Date,t=new Date(e.getFullYear(),e.getMonth()-2,1).toISOString().split("T")[0],n=new Date(e.getFullYear(),e.getMonth()+3,0).toISOString().split("T")[0],[i,s,o,r]=await Promise.all([this.db.getAll("leaves"),this.db.getAll("events").catch(()=>[]),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:t},{field:"date",operator:"<=",value:n}]).catch(()=>this.db.getAll("work_plans")):this.db.getAll("work_plans"),this.db.getCached?this.db.getCached(this.db.getCacheKey("calendarUsers","users",{}),C?.READ_CACHE_TTLS?.users||6e4,()=>this.db.getAll("users")).catch(()=>[]):this.db.getAll("users").catch(()=>[])]),d={};r.forEach(m=>{d[m.id]=m.name});const l=(i||[]).filter(m=>m.status==="Approved").map(m=>({...m,userName:m.userName||d[m.userId]||"Staff"})),c=(()=>{const m=new Map;return(s||[]).forEach(u=>{const f=[String(u.date||"").trim(),String(u.title||"").trim().toLowerCase(),String(u.type||"event").trim().toLowerCase(),String(u.createdById||u.createdByName||"").trim().toLowerCase()].join("|");m.has(f)||m.set(f,u)}),Array.from(m.values())})(),p=(o||[]).map(m=>({...m,plans:this.sanitizePlanTasks(m.plans)})).filter(m=>m.plans.length>0);return{leaves:l,events:c,workPlans:p}}catch(e){return console.error("Failed to fetch calendar plans:",e),{leaves:[],events:[],workPlans:[]}}}async setWorkPlan(e,t=[],n=null,i={}){const s=ae.getUser();if(!s)throw new Error("Not authenticated");const o=this.normalizePlanScope(i.planScope),r=n||s.id,d=await this.db.getAll("users"),l=d.find(p=>p.id===r);if(!l)throw console.error("setWorkPlan Error: Target user not found",{targetId:r,currentUser:s,allUsersCount:d.length}),new Error("Target user not found");const c={id:this.getWorkPlanId(e,r,o),userId:o==="annual"?"annual_shared":r,userName:o==="annual"?"All Staff":l.name,date:e,plans:Array.isArray(t)?t:[],planScope:o,createdById:s.id,createdByName:s.name||"Admin",updatedAt:new Date().toISOString()};return await this.db.put("work_plans",c)}async addWorkPlanTask(e,t,n,i=[],s={}){let o=await this.getWorkPlan(t,e);if(!o){const d=(await this.db.getAll("users")).find(l=>l.id===t);if(!d)throw new Error("Target user not found");o={id:`plan_${t}_${e}`,userId:t,userName:d.name,date:e,plans:[],updatedAt:new Date().toISOString()}}if(o.plans||(o.plans=[]),o.plans=this.sanitizePlanTasks(o.plans),s.sourcePlanId!==void 0&&s.sourceTaskIndex!==void 0&&s.sourcePlanId!==null){const r=o.plans.find(d=>d.sourcePlanId===s.sourcePlanId&&d.sourceTaskIndex===s.sourceTaskIndex&&d.addedFrom===(s.addedFrom||"minutes"));if(r)return r.task=n,r.subPlans=s.subPlans||r.subPlans||[],r.tags=i,r.status=s.status||r.status||"pending",r.startDate=s.startDate||r.startDate||e,r.endDate=s.endDate||r.endDate||r.startDate||e,r.updatedAt=new Date().toISOString(),o.updatedAt=new Date().toISOString(),await this.db.put("work_plans",o)}return o.plans.push({task:n,subPlans:s.subPlans||[],tags:i,status:s.status||"pending",startDate:s.startDate||e,endDate:s.endDate||s.startDate||e,addedFrom:s.addedFrom||"minutes",sourcePlanId:s.sourcePlanId||null,sourceTaskIndex:s.sourceTaskIndex??null,taggedById:s.taggedById||null,taggedByName:s.taggedByName||null}),o.updatedAt=new Date().toISOString(),await this.db.put("work_plans",o)}extractDateFromPlanToken(e=""){const n=String(e||"").trim().match(/(\d{4}-\d{2}-\d{2})/);return n?n[1]:""}resolveTaskOriginDate(e={}){const t=String(e.carriedForwardFromDate||"").trim();if(/^\d{4}-\d{2}-\d{2}$/.test(t))return t;const n=this.extractDateFromPlanToken(e.carryForwardRootId);if(n)return n;const i=this.extractDateFromPlanToken(e.carriedForwardFromPlanId);if(i)return i;const s=this.extractDateFromPlanToken(e.sourcePlanId);if(s)return s;const o=String(e.startDate||"").trim();if(/^\d{4}-\d{2}-\d{2}$/.test(o))return o;const r=String(e.endDate||"").trim();return/^\d{4}-\d{2}-\d{2}$/.test(r)?r:""}isTaggedCopyOriginTask(e={}){const t=String(e.addedFrom||"").toLowerCase().trim(),n=t==="tag"||t==="delegated"||t==="staff",i=!!e.sourcePlanId||Number.isInteger(e.sourceTaskIndex)||Number.isFinite(Number(e.sourceTaskIndex));return n||i}hasLegacyTaggedTextPattern(e={}){const t=String(e.task||"");return t?(t.match(/\(Responsible:/gi)||[]).length>1:!1}hasResponsibleMarker(e={}){const t=String(e.task||"");return/\((Responsible|Assigned to):/i.test(t)}normalizeTaskForStaleCompare(e=""){return String(e||"").replace(/\s*\((Responsible|Assigned to):[^)]*\)\s*/gi," ").replace(/\s+/g," ").trim().toLowerCase()}hasCarryForwardLineage(e={}){return!!(e.carryForwardRootId||e.isAutoForwarded===!0||e.carriedForwardFromDate||e.carriedForwardFromPlanId)}async cleanupOldCarryForwardTaggedTasks(e,t,n={}){const i=String(e||"").trim(),s=String(t||"").trim();if(!i||!s)return{ok:!1,removed:0,reason:"invalid_input"};const o=n.onlyToday!==!1,r=this.getTodayKey();if(o&&s!==r)return{ok:!0,removed:0,reason:"not_today"};const d=await this.getWorkPlan(i,s,{planScope:"personal"});if(!d||!Array.isArray(d.plans)||d.plans.length===0)return{ok:!0,removed:0,reason:"no_plan"};const c=((this.db.queryMany?await this.db.queryMany("work_plans",[{field:"userId",operator:"==",value:i},{field:"date",operator:"<",value:s}]).catch(()=>this.db.getAll("work_plans")):await this.db.getAll("work_plans"))||[]).filter(f=>f&&String(f.userId||"")===i&&String(f.date||"")<s&&this.normalizePlanScope(f.planScope)==="personal"&&Array.isArray(f.plans)),p=new Set;c.forEach(f=>{(f.plans||[]).forEach(g=>{if(!g||g.isRemoved===!0)return;const y=this.normalizeTaskForStaleCompare(g.task||"");y&&p.add(y)})});const m=[],u=[];for(const f of d.plans){if(!f||f.isRemoved===!0){m.push(f);continue}if(!this.isTaggedCopyOriginTask(f)){m.push(f);continue}const y=this.resolveTaskOriginDate(f),k=!!y&&y<s,T=this.hasLegacyTaggedTextPattern(f),S=this.normalizeTaskForStaleCompare(f.task||""),A=this.hasResponsibleMarker(f)&&!!S&&p.has(S);if(!k&&!T&&!A){m.push(f);continue}u.push(f)}return u.length===0?{ok:!0,removed:0,reason:"no_matches"}:(d.plans=m,d.updatedAt=new Date().toISOString(),await this.db.put("work_plans",d),{ok:!0,removed:u.length,planId:d.id,date:s})}async cleanupOldCarryForwardTaggedTasksForDate(e,t={}){const n=String(e||"").trim();if(!n)return{ok:!1,removed:0,scannedPlans:0,reason:"invalid_date"};const i=t.onlyToday!==!1,s=this.getTodayKey();if(i&&n!==s)return{ok:!0,removed:0,scannedPlans:0,reason:"not_today"};const r=((this.db.queryMany?await this.db.queryMany("work_plans",[{field:"date",operator:"==",value:n}]).catch(()=>this.db.getAll("work_plans")):await this.db.getAll("work_plans"))||[]).filter(l=>l&&String(l.date||"")===n&&this.normalizePlanScope(l.planScope)==="personal"&&Array.isArray(l.plans)&&l.plans.length>0);let d=0;for(const l of r){const c=String(l.userId||"").trim();if(!c)continue;const p=await this.cleanupOldCarryForwardTaggedTasks(c,n,{onlyToday:i});d+=Number(p?.removed||0)}return{ok:!0,removed:d,scannedPlans:r.length,date:n}}async deleteWorkPlan(e,t=null,n={}){const i=ae.getUser();if(!i)throw new Error("Not authenticated");const s=this.normalizePlanScope(n.planScope),o=t||i.id;return await this.db.delete("work_plans",this.getWorkPlanId(e,o,s))}async getWorkPlan(e,t,n={}){const i=!!n.includeAnnual,s=!!n.mergeAnnual,o=n.planScope?this.normalizePlanScope(n.planScope):null,r=!!n.preferAnnual;if(o){const m=await this.db.get("work_plans",this.getWorkPlanId(t,e,o));return m?{...m,plans:this.sanitizePlanTasks(m.plans)}:null}const d=await this.db.get("work_plans",this.getWorkPlanId(t,e,"personal")),l=d?{...d,plans:this.sanitizePlanTasks(d.plans)}:null;if(!i)return l;const c=await this.db.get("work_plans",this.getWorkPlanId(t,e,"annual")),p=c?{...c,plans:this.sanitizePlanTasks(c.plans)}:null;if(s&&p&&l){const m=[];return(p.plans||[]).forEach((u,f)=>{m.push({...u,_planId:p.id,_taskIndex:f,_planDate:p.date,_planScope:"annual"})}),(l.plans||[]).forEach((u,f)=>{m.push({...u,_planId:l.id,_taskIndex:f,_planDate:l.date,_planScope:"personal"})}),{id:`plan_merged_${e}_${t}`,userId:e,userName:l.userName||"Staff",date:t,planScope:"mixed",plans:m,personalPlanId:l.id,annualPlanId:p.id}}return r?p||l:l||p}getSmartTaskStatus(e,t=null){if(Ye)return Ye.getSmartTaskStatus(e,t);if(t==="completed"||t==="not-completed")return t;const n=new Date().toISOString().split("T")[0],i=typeof e=="string"?e:e.toISOString().split("T")[0];return i>n?"to-be-started":i===n?"in-process":i<n?"overdue":"in-process"}async updateTaskStatus(e,t,n,i=null){try{const s=await this.db.get("work_plans",e);if(!s||!s.plans||!s.plans[t])throw new Error("Plan or task not found");return s.plans[t].status=n,n==="completed"&&!s.plans[t].completedDate&&(s.plans[t].completedDate=i||new Date().toISOString().split("T")[0]),s.updatedAt=new Date().toISOString(),await this.db.put("work_plans",s),Ye&&await Ye.updateUserRating(s.userId),s}catch(s){throw console.error("Failed to update task status:",s),s}}async removeTask(e,t){try{const n=ae.getUser(),i=await this.db.get("work_plans",e);if(!i||!Array.isArray(i.plans)||!i.plans[t])throw new Error("Plan or task not found");return i.plans[t]={...i.plans[t],status:"not-completed",isRemoved:!0,removedAt:new Date().toISOString(),removedBy:n?.id||""},i.updatedAt=new Date().toISOString(),await this.db.put("work_plans",i),i}catch(n){throw console.error("Failed to remove task:",n),n}}async reassignTask(e,t,n){try{const i=await this.db.get("work_plans",e);if(!i||!i.plans||!i.plans[t])throw new Error("Plan or task not found");if(!(await this.db.getAll("users")).find(r=>r.id===n))throw new Error("New user not found");return i.plans[t].assignedTo=n,i.updatedAt=new Date().toISOString(),await this.db.put("work_plans",i),i}catch(i){throw console.error("Failed to reassign task:",i),i}}async getTasksByStatus(e,t,n=null,i=null){try{const o=(await this.db.getAll("work_plans")).filter(d=>d.userId===e),r=[];return o.forEach(d=>{n&&d.date<n||i&&d.date>i||d.plans&&Array.isArray(d.plans)&&d.plans.forEach((l,c)=>{if(l.isRemoved===!0)return;const p=this.getSmartTaskStatus(d.date,l.status);p===t&&r.push({...l,planId:d.id,taskIndex:c,planDate:d.date,calculatedStatus:p})})}),r}catch(s){return console.error("Failed to get tasks by status:",s),[]}}async getCollaborations(e,t=null){try{return(await this.db.getAll("work_plans")).filter(i=>(!t||i.date===t)&&i.plans&&i.plans.some(s=>s.tags&&s.tags.some(o=>o.id===e&&o.status==="accepted")))}catch(n){return console.error("Failed to fetch collaborations:",n),[]}}async addEvent(e){const t={id:"ev_"+Date.now(),...e,createdOn:new Date().toISOString()};return await this.db.add("events",t)}_toLocalISO(e){const t=new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`}async getMonthEvents(e,t){const n=await this.getPlans(),i=[];n.leaves.forEach(r=>{const d=new Date(r.startDate),l=new Date(r.endDate);let c=new Date(d);for(;c<=l;)i.push({date:this._toLocalISO(c),title:`${r.userName||"Staff"} (Leave)`,type:"leave",userId:r.userId}),c.setDate(c.getDate()+1)});const s=n.workPlans.map(r=>{const d=[];return r.plans.forEach(l=>{let c=l.task;l.subPlans&&l.subPlans.length>0&&(c+=" ("+l.subPlans.join(", ")+")"),l.tags&&l.tags.length>0&&(c+=" with "+l.tags.map(p=>p.name).join(", ")),d.push(c)}),{date:r.date,title:`${r.userName}: ${d.join("; ")}`,type:"work",userId:r.userId,plans:r.plans}});return[...i,...n.events,...s].filter(r=>{const d=new Date(r.date);return d.getFullYear()===e&&d.getMonth()===t})}}const ce=new mi;typeof window<"u"&&(window.AppCalendar=ce);class fi{constructor(){this.isActive=!1,this.activeMinutes=0,this.totalMinutes=0,this.monitorInterval=null,this.lastActivityTime=Date.now(),this.isCurrentlyActive=!1,this.performedAudits={},this.commandListener=null,this.processedCommandIds=new Set,this.startTime=Date.now(),this.handleActivity=this.handleActivity.bind(this),this.tick=this.tick.bind(this),K&&this.initCommandListener()}initCommandListener(){this.commandListener||K&&K.listen&&(console.log("Activity Monitor: Initializing System Command Listener..."),this.commandListener=K.listen("system_commands",e=>{const t=ae.getUser();if(!t){console.log("[Audit] Command detected but user not authenticated yet. Waiting...");return}const n=e.filter(i=>i.type==="audit"&&i.timestamp>this.startTime-6e5&&!this.processedCommandIds.has(i.id)).sort((i,s)=>s.timestamp-i.timestamp);if(n.length>0){const i=n[0];console.log("[Audit] Manual Command Received!",i.id),this.processedCommandIds.add(i.id);const s=i.slotName||`Manual Audit @ ${new Date().toLocaleTimeString()}`;console.log(`[Audit] Executing for user: ${t.name} in slot: ${s}`),this.performSilentAudit(s)}}))}async performSilentAudit(e){const t=ae.getUser();if(!t)return;const n=new Date().toISOString().split("T")[0];if(this.performedAudits[n]||(this.performedAudits[n]={}),this.performedAudits[n][e])return;console.log(`Executing Silent Location Audit for slot: ${e}`),this.performedAudits[n][e]=!0;let i={userId:t.id,userName:t.name,timestamp:Date.now(),slot:e,status:"Success",lat:0,lng:0};try{if(window.getLocation){const s=await window.getLocation().catch(o=>(console.warn("Silent Audit Location Failed:",o),null));s?(i.lat=s.lat,i.lng=s.lng):i.status="Location service disabled"}else i.status="Location service disabled (missing helper)"}catch{i.status="Location service disabled"}try{await K.add("location_audits",i),console.log("Silent Audit Log Saved.")}catch(s){console.error("Failed to save audit log:",s)}}start(){this.isActive||(this.isActive=!0,this.activeMinutes=0,this.totalMinutes=0,this.isCurrentlyActive=!1,this.lastActivityTime=Date.now(),document.addEventListener("mousemove",this.handleActivity),document.addEventListener("click",this.handleActivity),document.addEventListener("keydown",this.handleActivity),document.addEventListener("scroll",this.handleActivity),this.monitorInterval=setInterval(this.tick,6e4),console.log("Activity Monitoring Started"))}stop(){if(this.isActive)return this.isActive=!1,document.removeEventListener("mousemove",this.handleActivity),document.removeEventListener("click",this.handleActivity),document.removeEventListener("keydown",this.handleActivity),document.removeEventListener("scroll",this.handleActivity),this.monitorInterval&&clearInterval(this.monitorInterval),console.log("Activity Monitoring Stopped. Score:",this.getScore()),this.getStats()}handleActivity(){this.isCurrentlyActive||(this.isCurrentlyActive=!0,this.lastActivityTime=Date.now())}tick(){this.totalMinutes++,this.isCurrentlyActive&&this.activeMinutes++;const e=ae.getUser();e&&e.status==="in"&&(e.activityScore=this.getScore(),e.lastActive=this.lastActivityTime,K.put("users",e)),this.isCurrentlyActive=!1}getScore(){return this.totalMinutes===0?100:Math.round(this.activeMinutes/this.totalMinutes*100)}getStats(){return{score:this.getScore(),activeMinutes:this.activeMinutes,totalMinutes:this.totalMinutes}}}const hi=new fi;typeof window<"u"&&(window.AppActivity=hi);class yi{constructor(){this.active=!1,this.currentStep=0,this.steps=[],this.overlay=null,this.tooltip=null,this.highlight=null,this.tourKey="crwi_tour_completed"}init(e){if(e){if(localStorage.getItem(this.tourKey+"_"+e.id)){console.log("Tour already completed for user:",e.id);return}this.defineSteps(e),setTimeout(()=>{this.startTour(e)},2e3)}}defineSteps(e){e.isAdmin||e.role==="Administrator"?this.steps=[{element:".sidebar-header",title:"Welcome, Admin!",content:"This is your CRWI Attendance management console. Let us walk you through the key features.",position:"right"},{element:'.nav-item[data-page="admin"]',title:"User Management",content:"In the Admin Panel, you can add new staff, edit details, and manage roles.",position:"right"},{element:'.nav-item[data-page="master-sheet"]',title:"Attendance Sheet",content:"View and export the master attendance sheet for all employees here.",position:"right"},{element:'.nav-item[data-page="salary"]',title:"Salary Processing",content:"Calculate and process salaries based on attendance logs and penalties.",position:"right"},{element:".main-content",title:"Dashboard Overview",content:"The dashboard gives you real-time insights into who is in, pending leaves, and team activity.",position:"bottom"}]:this.steps=[{element:".sidebar-header",title:"Welcome to CRWI!",content:"This portal helps you track your attendance and work logs. Here is a quick guide.",position:"right"},{element:".action-btn",title:"Check-In / Out",content:"Use this button daily to mark your attendance. Don't forget to add a summary when checking out!",position:"bottom"},{element:'.nav-item[data-page="timesheet"]',title:"Your Timesheet",content:"Review your past logs and request leaves from here.",position:"right"},{element:'.nav-item[data-page="profile"]',title:"Your Profile",content:"View your stats, rewards, and manage your account details.",position:"right"}]}startTour(e){this.steps.length!==0&&(this.active=!0,this.currentStep=0,this.createUIElements(),this.showStep(),localStorage.setItem(this.tourKey+"_"+e.id,"true"))}createUIElements(){this.overlay=document.createElement("div"),this.overlay.className="tour-overlay",this.highlight=document.createElement("div"),this.highlight.className="tour-highlight",this.tooltip=document.createElement("div"),this.tooltip.className="tour-tooltip",document.body.appendChild(this.overlay),document.body.appendChild(this.highlight),document.body.appendChild(this.tooltip)}showStep(){const e=this.steps[this.currentStep],t=document.querySelector(e.element);if(!t||t.offsetParent===null){console.warn("Tour target not found:",e.element),this.nextStep();return}const n=t.getBoundingClientRect(),i=5;this.highlight.style.top=n.top-i+"px",this.highlight.style.left=n.left-i+"px",this.highlight.style.width=n.width+i*2+"px",this.highlight.style.height=n.height+i*2+"px",t.scrollIntoView({behavior:"smooth",block:"center"}),this.tooltip.innerHTML=`
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
            `,this.positionTooltip(n,e.position),this.tooltip.classList.add("active")}positionTooltip(e,t){const n=this.tooltip.getBoundingClientRect(),i=15;let s,o;switch(t){case"right":s=e.top+e.height/2-n.height/2,o=e.right+i;break;case"bottom":s=e.bottom+i,o=e.left+e.width/2-n.width/2;break;case"left":s=e.top+e.height/2-n.height/2,o=e.left-n.width-i;break;case"top":s=e.top-n.height-i,o=e.left+e.width/2-n.width/2;break;default:s=e.bottom+i,o=e.left}const r=window.innerWidth,d=window.innerHeight;o<10&&(o=10),o+n.width>r-10&&(o=r-n.width-10),s<10&&(s=10),s+n.height>d-10&&(s=d-n.height-10),this.tooltip.style.top=s+"px",this.tooltip.style.left=o+"px"}nextStep(){this.currentStep++,this.currentStep<this.steps.length?this.showStep():this.endTour()}endTour(){this.active=!1,this.overlay&&this.overlay.remove(),this.highlight&&this.highlight.remove(),this.tooltip&&this.tooltip.remove()}resetTour(e){localStorage.removeItem(this.tourKey+"_"+e),window.location.reload()}}const gi=new yi;typeof window<"u"&&(window.AppTour=gi);class wi{constructor(){this.db=K,this.chartInstance=null,this.memo=new Map,typeof window<"u"&&window.addEventListener&&window.addEventListener("app:db-write",e=>{const t=e?.detail?.collection;["attendance","users","work_plans","leaves","minutes"].includes(t)&&this.clearMemo()})}getFlags(){return C&&C.READ_OPT_FLAGS||{}}getTtls(){return C&&C.READ_CACHE_TTLS||{}}async memoize(e,t,n){if(!this.getFlags().FF_READ_OPT_ANALYTICS_CACHE)return n();const s=Date.now(),o=this.memo.get(e);if(o&&o.expiresAt>s)return o.value;const r=await n();return this.memo.set(e,{value:r,expiresAt:s+Math.max(0,Number(t)||0)}),r}clearMemo(e=""){if(!e){this.memo.clear();return}for(const t of this.memo.keys())t.startsWith(e)&&this.memo.delete(t)}async getUsersCached(){const e=this.getTtls().users||6e4;return this.memoize("analytics:users",e,async()=>{if(K&&K.getCached){const t=K.getCacheKey("analyticsUsers","users",{ttl:e});return K.getCached(t,e,()=>this.db.getAll("users"))}return this.db.getAll("users")})}async getAttendanceInRange(e,t,n=""){const i=this.getTtls().attendanceSummary||3e4,s=typeof e=="string"?e:e.toISOString().split("T")[0],o=typeof t=="string"?t:t.toISOString().split("T")[0],r=`analytics:attendance:${s}:${o}:${n}`;return this.memoize(r,i,async()=>this.db.queryMany?this.db.queryMany("attendance",[{field:"date",operator:">=",value:s},{field:"date",operator:"<=",value:o}]):(await this.db.getAll("attendance")).filter(l=>l.date>=s&&l.date<=o))}async initAdminCharts(){const e=document.getElementById("admin-stats-chart");if(!e)return;this.chartInstance&&(this.chartInstance.destroy(),this.chartInstance=null);const t=new Date,n=new Date;n.setDate(n.getDate()-14);const[i,s]=await Promise.all([this.getAttendanceInRange(n,t,"adminChart"),this.getUsersCached()]),o=this.processLast7Days(i,s),r=e.getContext("2d");try{this.chartInstance=new Chart(r,{type:"line",data:{labels:o.labels,datasets:[{label:"Staff Present",data:o.present,borderColor:"#10b981",backgroundColor:"rgba(16, 185, 129, 0.1)",fill:!0,tension:.4,borderWidth:3,pointBackgroundColor:"#10b981",pointRadius:4},{label:"On Leave",data:o.onLeave,borderColor:"#ef4444",backgroundColor:"transparent",borderDash:[5,5],tension:.1,pointRadius:0}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{intersect:!1,mode:"index"},plugins:{legend:{position:"top",labels:{usePointStyle:!0,boxWidth:6}},tooltip:{backgroundColor:"rgba(30, 27, 75, 0.9)",padding:12,titleFont:{size:14,weight:"bold"},bodyFont:{size:13},cornerRadius:8}},scales:{y:{beginAtZero:!0,ticks:{stepSize:1,color:"#6b7280"},grid:{color:"rgba(0,0,0,0.05)"}},x:{grid:{display:!1},ticks:{color:"#6b7280"}}}}})}catch(d){console.error("Chart.js Error:",d),e.parentNode.innerHTML=`<div style="color:red; text-align:center; padding:1rem;">Failed to load chart: ${d.message}</div>`}}processLast7Days(e,t=[]){const n=[],i=[],s=[],o=d=>{if(Object.prototype.hasOwnProperty.call(d||{},"attendanceEligible"))return d.attendanceEligible===!0;const l=String(d?.entrySource||"");return l==="staff_manual_work"?!1:l==="admin_override"||l==="checkin_checkout"||d?.isManualOverride||d?.location==="Office (Manual)"||d?.location==="Office (Override)"||typeof d?.activityScore<"u"||typeof d?.locationMismatched<"u"||typeof d?.autoCheckout<"u"||!!d?.checkOutLocation||typeof d?.outLat<"u"||typeof d?.outLng<"u"?!0:String(d?.type||"").includes("Leave")||d?.location==="On Leave"},r=(d,l)=>d.getFullYear()===l.getFullYear()&&d.getMonth()===l.getMonth()&&d.getDate()===l.getDate();for(let d=6;d>=0;d--){const l=new Date;l.setDate(l.getDate()-d);const c=l.toLocaleDateString("en-US",{weekday:"short",day:"numeric"});n.push(c);const p=e.filter(f=>{const g=new Date(f.date);return isNaN(g.getTime())?!1:r(g,l)}),m=new Set,u=new Set;p.forEach(f=>{if(!o(f))return;const g=f.user_id||f.userId;if(!g)return;String(f.type||"").toLowerCase().includes("leave")||f.location==="On Leave"||f.type==="Absent"?u.add(g):m.add(g)}),d===0&&t.forEach(f=>{f.status==="in"&&m.add(f.id)}),i.push(m.size),s.push(u.size)}return console.log("Weekly Stats Generated (Unique):",{labels:n,present:i}),{labels:n,present:i,onLeave:s}}parseTimeToMinutes(e){if(!e)return null;const[t,n]=e.split(" ");let[i,s]=t.split(":");return i==="12"&&(i="00"),n==="PM"&&(i=parseInt(i,10)+12),parseInt(i,10)*60+parseInt(s,10)}isAttendanceEligibleLog(e){if(Object.prototype.hasOwnProperty.call(e||{},"attendanceEligible"))return e.attendanceEligible===!0;const t=String(e?.entrySource||"");return t==="staff_manual_work"?!1:t==="admin_override"||t==="checkin_checkout"||e?.isManualOverride||e?.location==="Office (Manual)"||e?.location==="Office (Override)"||typeof e?.activityScore<"u"||typeof e?.locationMismatched<"u"||typeof e?.autoCheckout<"u"||!!e?.checkOutLocation||typeof e?.outLat<"u"||typeof e?.outLng<"u"?!0:String(e?.type||"").includes("Leave")||e?.location==="On Leave"}getAttendanceLogPriority(e){const n=String(e?.type||"").includes("Leave")||e?.location==="On Leave",i=!!e?.checkOut&&e.checkOut!=="Active Now"&&(typeof e?.activityScore<"u"||typeof e?.locationMismatched<"u"||!!e?.checkOutLocation||typeof e?.outLat<"u"||typeof e?.outLng<"u");let s=1;return i&&(s=2),n&&(s=3),e?.isManualOverride&&(s=4),s}pickBestAttendanceLogPerDay(e,t,n){const i=new Map,s=o=>`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`;return e.forEach(o=>{const r=new Date(o?.date);if(Number.isNaN(r.getTime())||r<t||r>n)return;const d=/^\d{4}-\d{2}-\d{2}$/.test(String(o?.date||""))?String(o.date):s(r),l=i.get(d);(!l||this.getAttendanceLogPriority(o)>this.getAttendanceLogPriority(l))&&i.set(d,o)}),Array.from(i.values())}formatDuration(e){const t=Math.floor(e/60),n=e%60;return`${t}h ${n}m`}getWeekNumber(e){const t=new Date(e);t.setHours(0,0,0,0),t.setDate(t.getDate()+4-(t.getUTCDay()||7));const n=new Date(t.getFullYear(),0,1);return Math.ceil(((t-n)/864e5+1)/7)}async getUserMonthlyStats(e){const t=new Date,n=new Date(t.getFullYear(),t.getMonth(),1),i=new Date(t.getFullYear(),t.getMonth()+1,0),o=(await this.getAttendanceInRange(n,i,`monthly:${e}`)).filter(r=>r.userId===e||r.user_id===e);return this.calculateStatsForLogs(o)}async getSystemMonthlySummary(){const e=new Date,t=new Date(e.getFullYear(),e.getMonth(),1),n=new Date(e.getFullYear(),e.getMonth()+1,0),[i,s]=await Promise.all([this.getUsersCached(),this.getAttendanceInRange(t,n,"sysMonthly")]);return await Promise.all(i.map(async r=>{const d=s.filter(c=>(c.userId===r.id||c.user_id===r.id)&&new Date(c.date)>=t&&new Date(c.date)<=n),l=this.calculateStatsForLogs(d);return{user:r,stats:l}}))}calculateStatsForLogs(e){const t=new Date,n=t.getFullYear(),i=t.getMonth(),s=new Date(n,i,1),o=new Date(n,i+1,0),r={Present:0,Late:0,"Early Departure":0,"Work - Home":0,Training:0,"Sick Leave":0,"Casual Leave":0,"Earned Leave":0,"Paid Leave":0,"Maternity Leave":0,Absent:0,Holiday:0,"National Holiday":0,"Regional Holidays":0},d={present:0,late:0,leaves:0,unpaidLeaves:0,penalty:0,penaltyOffset:0,effectivePenalty:0,extraWorkedHours:0,earlyDepartures:0,label:s.toLocaleDateString("default",{month:"long",year:"numeric"}),breakdown:r,totalLateDuration:"0h 0m",totalExtraDuration:"0h 0m"};let l=0,c=0;this.pickBestAttendanceLogPerDay(e,s,o).forEach(f=>{if(!this.isAttendanceEligibleLog(f))return;let g=f.type||"";const y=this.parseTimeToMinutes(f.checkIn),k=this.parseTimeToMinutes(f.checkOut);if(f.isManualOverride===!0)if(g==="Late"){d.late++,r.Late++;const w=(typeof C<"u"&&C?C.LATE_CUTOFF_MINUTES:555)||555;y!==null&&y>w&&(l+=y-w)}else g==="Early Departure"&&(d.earlyDepartures++,r["Early Departure"]++);else{const w=(typeof C<"u"&&C?C.LATE_CUTOFF_MINUTES:555)||555;(f.lateCountable===!0||!Object.prototype.hasOwnProperty.call(f,"lateCountable")&&y!==null&&y>w)&&(r.Late++,d.late++,y!==null&&(l+=Math.max(0,y-w)));const _=(typeof C<"u"&&C?C.EARLY_DEPARTURE_MINUTES:1020)||1020;k!==null&&k<_&&!String(g).includes("Leave")&&g!=="Absent"&&(d.earlyDepartures++,r["Early Departure"]++)}const S=(typeof C<"u"&&C?C.LATE_CUTOFF_MINUTES:555)||555,A=(typeof C<"u"&&C?C.EARLY_DEPARTURE_MINUTES:1020)||1020,h=typeof f.extraWorkedMs=="number"?Math.max(0,Math.round(f.extraWorkedMs/(1e3*60))):0;h>0?c+=h:!(f.autoCheckout&&!f.autoCheckoutExtraApproved)&&(y!==null&&y<S&&(c+=S-y),k!==null&&k>A&&(c+=k-A)),g==="Work - Home"?r["Work - Home"]++:g==="Training"?r.Training++:g==="Sick Leave"?(r["Sick Leave"]++,d.unpaidLeaves++):g==="Casual Leave"?r["Casual Leave"]++:g==="Earned Leave"?r["Earned Leave"]++:g==="Paid Leave"?r["Paid Leave"]++:g==="Maternity Leave"?r["Maternity Leave"]++:g==="Absent"?(r.Absent++,d.unpaidLeaves++):g==="National Holiday"?r["National Holiday"]++:g==="Regional Holidays"?r["Regional Holidays"]++:String(g).includes("Holiday")?r.Holiday++:f.checkIn&&r.Present++}),d.present=r.Present+r["Work - Home"]+r.Training,d.leaves=r["Sick Leave"]+r["Casual Leave"]+r["Earned Leave"]+r["Paid Leave"]+r["Maternity Leave"]+r.Absent,d.extraWorkedHours=Number((c/60).toFixed(2)),d.penalty=Math.floor((d.late||0)/((typeof C<"u"&&C?C.LATE_GRACE_COUNT:3)||3))*((typeof C<"u"&&C?C.LATE_DEDUCTION_PER_BLOCK:.5)||.5);const m=(typeof C<"u"&&C?C.EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4)||4,u=(typeof C<"u"&&C?C.LATE_DEDUCTION_PER_BLOCK:.5)||.5;return d.penaltyOffset=Math.floor((d.extraWorkedHours||0)/m)*u,d.effectivePenalty=Math.max(0,d.penalty-d.penaltyOffset),d.totalLateDuration=this.formatDuration(l),d.totalExtraDuration=this.formatDuration(c),d}async getUserYearlyStats(e){const{start:t,end:n,label:i}=this.getFinancialYearDates(),o=(await this.getAttendanceInRange(t,n,`yearly:${e}`)).filter(f=>f.userId===e||f.user_id===e),r={Present:0,Late:0,"Early Departure":0,"Work - Home":0,Training:0,"Sick Leave":0,"Casual Leave":0,"Earned Leave":0,"Paid Leave":0,"Maternity Leave":0,Absent:0,Holiday:0,"National Holiday":0,"Regional Holidays":0},d={present:0,late:0,leaves:0,earlyDepartures:0,penaltyLeaves:0,penaltyOffset:0,effectivePenalty:0,extraWorkedHours:0,label:i,breakdown:r,totalLateDuration:"0h 0m",totalExtraDuration:"0h 0m"};let l=0,c=0;this.pickBestAttendanceLogPerDay(o,t,n).forEach(f=>{if(!this.isAttendanceEligibleLog(f))return;let g=f.type||"";const y=this.parseTimeToMinutes(f.checkIn),k=this.parseTimeToMinutes(f.checkOut),T=(typeof C<"u"&&C?C.LATE_CUTOFF_MINUTES:555)||555,S=(typeof C<"u"&&C?C.EARLY_DEPARTURE_MINUTES:1020)||1020;f.isManualOverride===!0?g==="Late"?(r.Late++,y!==null&&y>T&&(l+=y-T)):g==="Early Departure"&&(d.earlyDepartures++,r["Early Departure"]++):((f.lateCountable===!0||!Object.prototype.hasOwnProperty.call(f,"lateCountable")&&y!==null&&y>T)&&(r.Late++,y!==null&&(l+=Math.max(0,y-T))),k!==null&&k<S&&!String(g).includes("Leave")&&g!=="Absent"&&(d.earlyDepartures++,r["Early Departure"]++));const h=typeof f.extraWorkedMs=="number"?Math.max(0,Math.round(f.extraWorkedMs/(1e3*60))):0;h>0?c+=h:!(f.autoCheckout&&!f.autoCheckoutExtraApproved)&&(y!==null&&y<T&&(c+=T-y),k!==null&&k>S&&(c+=k-S)),g==="Work - Home"?r["Work - Home"]++:g==="Training"?r.Training++:g==="Sick Leave"?r["Sick Leave"]++:g==="Casual Leave"?r["Casual Leave"]++:g==="Earned Leave"?r["Earned Leave"]++:g==="Paid Leave"?r["Paid Leave"]++:g==="Maternity Leave"?r["Maternity Leave"]++:g==="Absent"?r.Absent++:g==="National Holiday"?r["National Holiday"]++:g==="Regional Holidays"?r["Regional Holidays"]++:String(g).includes("Holiday")?r.Holiday++:f.checkIn&&r.Present++}),d.present=r.Present+r["Work - Home"]+r.Training,d.leaves=r["Sick Leave"]+r["Casual Leave"]+r["Earned Leave"]+r["Paid Leave"]+r["Maternity Leave"]+r.Absent,d.late=r.Late,d.extraWorkedHours=Number((c/60).toFixed(2)),d.totalLateDuration=this.formatDuration(l),d.totalExtraDuration=this.formatDuration(c),d.penaltyLeaves=Math.floor((r.Late||0)/((typeof C<"u"&&C?C.LATE_GRACE_COUNT:3)||3))*((typeof C<"u"&&C?C.LATE_DEDUCTION_PER_BLOCK:.5)||.5);const m=(typeof C<"u"&&C?C.EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4)||4,u=(typeof C<"u"&&C?C.LATE_DEDUCTION_PER_BLOCK:.5)||.5;return d.penaltyOffset=Math.floor((d.extraWorkedHours||0)/m)*u,d.effectivePenalty=Math.max(0,d.penaltyLeaves-d.penaltyOffset),d}getFinancialYearDates(){const e=new Date,t=e.getFullYear(),n=e.getMonth(),i=(typeof C<"u"&&C?C.FY_START_MONTH:3)||3;let s=t;n<i&&(s=t-1);const o=new Date(s,i,1),r=new Date(s+1,i,0);return{start:o,end:r,label:`FY ${s}-${s+1}`}}getDayType(e){const t=typeof e=="string"?new Date(e):e,n=t.getDay();return n===0||n===6&&typeof C<"u"&&C&&C.IS_SATURDAY_OFF&&C.IS_SATURDAY_OFF(t)?"Holiday":"Work Day"}getHeroPolicy(){return C?.HERO_POLICY||{}}parseHeroLogDate(e){if(!e)return null;if(e instanceof Date&&!Number.isNaN(e.getTime()))return e;if(typeof e!="string")return null;const t=e.trim();if(!t)return null;const n=new Date(t);if(!Number.isNaN(n.getTime()))return n;const i=t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);if(!i)return null;const s=Number(i[1]),o=Number(i[2]);let r=Number(i[3]);if(r<100&&(r+=2e3),!Number.isFinite(s)||!Number.isFinite(o)||!Number.isFinite(r))return null;const d=s>12?o:s,l=s>12?s:o,c=new Date(r,d-1,l);return Number.isNaN(c.getTime())?null:c}resolveHeroUserId(e){const t=e?.user_id??e?.userId??e?.uid??e?.user??"";return String(t||"").trim()||null}resolveHeroDurationMs(e){let t=Number(e?.durationMs);if(Number.isFinite(t)||(t=0),t>0)return t;if(e?.checkIn&&e?.checkOut&&e.checkOut!=="Active Now"){const n=this.parseTimeToMinutes(e.checkIn),i=this.parseTimeToMinutes(e.checkOut);n!==null&&i!==null&&(t=(i-n)*60*1e3)}return Math.max(0,Number(t)||0)}normalizeHeroLogs(e=[]){return(e||[]).map(t=>{const n=this.parseHeroLogDate(t?.date),i=this.resolveHeroUserId(t);if(!n||!i)return null;const s=this.resolveHeroDurationMs(t),o=Number(t?.activityScore);return{userId:i,logDate:n,dateKey:n.toISOString().split("T")[0],durationMs:s,activityLogDepth:String(t?.workDescription||"").length,activityScore:Number.isFinite(o)?o:null}}).filter(Boolean)}buildHeroCandidateStats(e=[]){const t=new Map;return e.forEach(n=>{t.has(n.userId)||t.set(n.userId,{userId:n.userId,totalDurationMs:0,daysSet:new Set,activityLogDepth:0,activityScoreTotal:0,activityScoreCount:0});const i=t.get(n.userId);i.totalDurationMs+=Math.max(0,Number(n.durationMs)||0),i.daysSet.add(n.dateKey),i.activityLogDepth+=Math.max(0,Number(n.activityLogDepth)||0),Number.isFinite(n.activityScore)&&(i.activityScoreTotal+=n.activityScore,i.activityScoreCount+=1)}),Array.from(t.values())}classifyHeroTaskStatus(e,t=null){const n=String(e||"").toLowerCase().trim(),i=window.AppCalendar?.getSmartTaskStatus?String(window.AppCalendar.getSmartTaskStatus(t,n)||n):n;return i==="completed"?"completed":i==="in-process"||i==="in progress"||i==="to-be-started"||i==="pending"||i===""?"in_progress":i==="not-completed"||i==="overdue"||i==="postponed"||i==="missed"?"missed":"in_progress"}normalizeHeroTasks(e=[]){const t=[];return(e||[]).forEach(n=>{const i=String(n?.userId||n?.user_id||"").trim();!i||!Array.isArray(n?.plans)||n.plans.forEach(s=>{if(!s||!String(s.task||"").trim())return;const o=this.classifyHeroTaskStatus(s.status,n.date);t.push({userId:i,status:o,date:n.date})})}),t}buildHeroTaskStats(e=[]){const t=new Map;return e.forEach(n=>{t.has(n.userId)||t.set(n.userId,{planned:0,completed:0,inProgress:0,missed:0});const i=t.get(n.userId);i.planned+=1,n.status==="completed"?i.completed+=1:n.status==="missed"?i.missed+=1:i.inProgress+=1}),t}rankHeroCandidates(e=[],t=new Map,n={}){const i=n.WEIGHTS||{},s=n.CAPS||{},o=Math.max(1,Number(n.WINDOW_DAYS||7)),r=Math.max(1,Number(s.hours||40)),d=n.ATTENDANCE_MODIFIER||{},l=Number(i.taskExecution??.45),c=Number(i.taskCompletionRate??.2),p=Number(i.taskInProgressSupport??.1),m=Number(i.taskMissPenalty??.1),u=Number(d.base??.9),f=Number(d.maxBonus??.15),g=Number(d.consistencyImpact??.65),y=Number(d.effortImpact??.35),k=new Map(e.map(S=>[String(S.userId),S])),T=new Set([...k.keys(),...t.keys()]);return Array.from(T).map(S=>{const A=k.get(String(S))||{totalDurationMs:0,daysSet:new Set,activityLogDepth:0},h=t.get(String(S))||{planned:0,completed:0,inProgress:0,missed:0},w=A.daysSet.size,v=A.totalDurationMs/(1e3*60*60),_=Math.max(0,Number(h.planned)||0),L=Math.max(0,Number(h.completed)||0),b=Math.max(0,Number(h.inProgress)||0),x=Math.max(0,Number(h.missed)||0),D=_>0?L/_*100:0,M=_>0?Math.max(0,Math.min(100,(L+b*.5-x)/_*100)):0,R=_>0?Math.max(0,Math.min(100,b/_*100)):0,I=_>0?Math.max(0,Math.min(100,x/_*100)):0,N=w/o*100,P=Math.min(v/r*100,100),B=M*l+D*c+R*p-I*m,O=N/100*g+P/100*y,V=Math.max(0,Math.min(f,O*f)),j=Math.max(.5,u+V),W=B*j;return{userId:S,days:w,hours:Number(v.toFixed(1)),totalDurationMs:Math.max(0,Number(A.totalDurationMs)||0),activityLogDepth:A.activityLogDepth,taskPlanned:_,taskCompleted:L,taskInProgress:b,taskMissed:x,completionRate:Number(D.toFixed(1)),taskScore:Number(Math.max(0,B).toFixed(2)),attendanceFactor:Number(j.toFixed(3)),finalScore:Number(Math.max(0,W).toFixed(2))}}).sort((S,A)=>A.finalScore!==S.finalScore?A.finalScore-S.finalScore:A.taskCompleted!==S.taskCompleted?A.taskCompleted-S.taskCompleted:S.taskMissed!==A.taskMissed?S.taskMissed-A.taskMissed:A.days!==S.days?A.days-S.days:A.totalDurationMs!==S.totalDurationMs?A.totalDurationMs-S.totalDurationMs:String(S.userId).localeCompare(String(A.userId)))}createNoHeroPayload({reason:e="No eligible attendance data found.",period:t="weekly",source:n="direct_cache"}={}){return{state:"no_eligible_data",user:null,stats:null,reason:e,period:t,source:n,confidence:0,schemaVersion:Number(this.getHeroPolicy()?.SCHEMA_VERSION||1)}}scoreHeroFromLogs(e=[],t=[],n={}){const i=String(n.period||"weekly"),s=String(n.source||"direct_cache"),o=this.getHeroPolicy(),r=o.MIN_EVIDENCE||{},d=Math.max(1,Number(r.minDays||1)),l=Math.max(0,Number(r.minDurationMs||1)),c=Math.max(0,Number(r.minPlannedTasks||1)),p=this.normalizeHeroLogs(e),m=Array.isArray(n.workPlans)?n.workPlans:[],u=this.normalizeHeroTasks(m);if(p.length===0&&u.length===0)return this.createNoHeroPayload({period:i,source:s});const g=this.rankHeroCandidates(this.buildHeroCandidateStats(p),this.buildHeroTaskStats(u),o).filter(w=>w.taskPlanned>=c&&(w.days>=d||w.totalDurationMs>=l));if(g.length===0)return this.createNoHeroPayload({reason:"No staff met the minimum hero criteria this period.",period:i,source:s});const y=g[0],k=(t||[]).find(w=>String(w.id)===String(y.userId));if(!k)return this.createNoHeroPayload({reason:"No valid user mapping found for hero candidates.",period:i,source:s});const T=y.taskPlanned>0?Math.min(1,y.taskCompleted/y.taskPlanned):0,S=Math.min(1,y.days/Math.max(1,Number(o.WINDOW_DAYS||7))),A=Math.min(1,y.totalDurationMs/(1e3*60*60*Math.max(1,Number(o?.CAPS?.hours||40)))),h=Number(((T+S+A)/3).toFixed(2));return{state:"winner",user:k,stats:y,reason:this.determineHeroReason(y),period:i,source:s,confidence:h,schemaVersion:Number(o.SCHEMA_VERSION||1)}}async getHeroOfTheWeek(e={}){try{const t=this.getHeroPolicy(),n=Math.max(1,Number(t.WINDOW_DAYS||7)),i=Math.max(n,Number(t.FALLBACK_LOOKBACK_DAYS||90)),s=new Date,o=new Date(s);o.setDate(o.getDate()-n),o.setHours(0,0,0,0);const[r,d,l]=await Promise.all([this.getAttendanceInRange(o,s,"hero"),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:o.toISOString().split("T")[0]},{field:"date",operator:"<=",value:s.toISOString().split("T")[0]}]):this.db.getAll("work_plans"),this.getUsersCached()]),c=this.scoreHeroFromLogs(r,l,{period:"weekly",source:String(e.source||"direct_cache"),workPlans:d});if(c.state==="winner")return c;const p=new Date(s);p.setDate(p.getDate()-i),p.setHours(0,0,0,0);const[m,u]=await Promise.all([this.getAttendanceInRange(p,s,"hero_fallback_lookback"),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:p.toISOString().split("T")[0]},{field:"date",operator:"<=",value:s.toISOString().split("T")[0]}]):this.db.getAll("work_plans")]),f=this.normalizeHeroLogs(m),g=this.normalizeHeroTasks(u);if(f.length===0&&g.length===0)return this.createNoHeroPayload({reason:c.reason,period:"latest_active_window",source:String(e.source||"direct_cache")});const y=f.length>0?f.reduce((w,v)=>v.logDate>w?v.logDate:w,f[0].logDate):null,k=g.length>0?g.reduce((w,v)=>{const _=this.parseHeroLogDate(v?.date);return _&&(!w||_>w)?_:w},null):null,T=y||k||s,S=new Date(T);S.setDate(S.getDate()-(n-1)),S.setHours(0,0,0,0);const A=(m||[]).filter(w=>{const v=this.parseHeroLogDate(w?.date);return!!v&&v>=S&&v<=T}),h=(u||[]).filter(w=>{const v=this.parseHeroLogDate(w?.date);return!!v&&v>=S&&v<=T});return this.scoreHeroFromLogs(A,l,{period:"latest_active_window",source:String(e.source||"direct_cache"),workPlans:h})}catch(t){return console.error("Hero Calculation Error:",t),{state:"fetch_error",user:null,stats:null,reason:"Unable to calculate hero right now.",period:"weekly",source:String(e.source||"direct_cache"),confidence:0,schemaVersion:Number(this.getHeroPolicy()?.SCHEMA_VERSION||1)}}}determineHeroReason(e){const t=Number(e?.taskPlanned||0),n=Number(e?.taskCompleted||0),i=Number(e?.taskInProgress||0),s=Number(e?.taskMissed||0),o=t>0?n/t*100:0,r=Number(e?.attendanceFactor||1);return t>=6&&o>=80?"Execution Champion":n>=4&&i>=2?"Delivery Momentum":o>=70&&r>=1?"Reliable Executor":t>0&&s===0&&o>=60?"Reliable Finisher":"Top Performer"}async getSystemPerformance(){try{const e=new Date;e.setDate(e.getDate()-7);const t=await this.getAttendanceInRange(e,new Date,"performance"),n=[],i=[];let s=0,o=0;const r=(l,c)=>l.getFullYear()===c.getFullYear()&&l.getMonth()===c.getMonth()&&l.getDate()===c.getDate();for(let l=6;l>=0;l--){const c=new Date;c.setDate(c.getDate()-l);const p=c.toLocaleDateString("en-US",{weekday:"narrow"});i.push(p);const m=t.filter(u=>{const f=new Date(u.date);return!isNaN(f.getTime())&&r(f,c)});if(m.length===0)n.push(0);else{const u=m.map(g=>g.activityScore||0).filter(g=>g>0),f=u.length>0?u.reduce((g,y)=>g+y,0)/u.length:0;n.push(Math.round(f)),f>0&&(s+=f,o++)}}return{avgScore:o>0?Math.round(s/o):0,trendData:n,labels:i}}catch(e){return console.error("System Performance Calculation Error:",e),{avgScore:0,trendData:[0,0,0,0,0,0,0]}}}async buildDailyDashboardSummary(e={}){const t=new Date,n=String(e.dateKey||t.toISOString().split("T")[0]),i=String(e.selectedMonth||t.toISOString().slice(0,7)),[s,o]=i.split("-"),r=Number(s),d=Number(o)-1,l=Number.isInteger(r)&&Number.isInteger(d)&&d>=0&&d<=11?new Date(r,d,1):new Date(t.getFullYear(),t.getMonth(),1),c=Number.isInteger(r)&&Number.isInteger(d)&&d>=0&&d<=11?new Date(r,d+1,0):new Date(t.getFullYear(),t.getMonth()+1,0),p=Math.max(1,Number(C?.SUMMARY_POLICY?.TEAM_ACTIVITY_LIMIT)||15),[m,u]=await Promise.all([this.getHeroOfTheWeek({source:"shared_summary"}),this.getAllStaffActivities({mode:"month",month:i,scope:"work"})]);return{dateKey:n,monthKey:i,version:Number(C?.SUMMARY_POLICY?.SCHEMA_VERSION||1),generatedAt:Date.now(),hero:m&&m.state!=="fetch_error"?m:null,teamActivityPreview:(u||[]).slice(0,p),range:{startIso:l.toISOString().split("T")[0],endIso:c.toISOString().split("T")[0]},meta:{generatedAt:Date.now(),source:"client_first_writer"}}}async getAllStaffActivities(e={}){try{const t=e||{},n=t.mode||"month",i=t.scope||"all",s=new Date,o=new Date;if(n==="range"){const A=String(t.startIso||""),h=String(t.endIso||"");if(!A||!h)throw new Error("Range mode requires startIso and endIso.");const w=new Date(A),v=new Date(h);if(Number.isNaN(w.getTime())||Number.isNaN(v.getTime()))throw new Error(`Invalid range dates: ${A} to ${h}`);o.setTime(w.getTime()),s.setTime(v.getTime()),o.setHours(0,0,0,0),s.setHours(23,59,59,999)}else if(n==="days"){const A=Number.isFinite(Number(t.daysBack))?Number(t.daysBack):7;s.setHours(23,59,59,999),o.setDate(o.getDate()-A),o.setHours(0,0,0,0)}else{const A=String(t.month||new Date().toISOString().slice(0,7)),[h,w]=A.split("-"),v=Number(h),_=Number(w)-1;if(!Number.isInteger(v)||!Number.isInteger(_)||_<0||_>11)throw new Error(`Invalid month key: ${A}`);const L=new Date(v,_,1),b=new Date(v,_+1,0);o.setTime(L.getTime()),s.setTime(b.getTime()),o.setHours(0,0,0,0),s.setHours(23,59,59,999)}const r=o.toISOString().split("T")[0],d=s.toISOString().split("T")[0];if(window.AppCalendar?.ensureCarryForwardForRange&&await window.AppCalendar.ensureCarryForwardForRange(r,d),window.AppCalendar?.cleanupOldCarryForwardTaggedTasksForDate){const A=window.AppCalendar.getTodayKey?window.AppCalendar.getTodayKey():"";if(A&&A>=r&&A<=d){const h=`cleanup_old_tagged_global_v5_${A}`;let w=!0;try{w=localStorage.getItem(h)!=="1"}catch{w=!0}if(w)try{const v=await window.AppCalendar.cleanupOldCarryForwardTaggedTasksForDate(A,{onlyToday:!0});(v?.removed||0)>0&&console.log(`Team activity global cleanup removed ${v.removed} stale tagged task(s) for ${A}.`);try{localStorage.setItem(h,"1")}catch{}}catch(v){console.warn("Global stale tagged cleanup failed:",v)}}}const l=i!=="work",[c,p,m]=await Promise.all([l?this.getAttendanceInRange(o,s,`staffAct:${r}:${d}:${i}`):Promise.resolve([]),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:r},{field:"date",operator:"<=",value:d}]):K.getAll("work_plans"),this.getUsersCached()]),u={};m.forEach(A=>{u[A.id]=A.name});const f=[],g={},y=(A={})=>{if(window.AppCalendar?.isTaggedCopyOriginTask)return window.AppCalendar.isTaggedCopyOriginTask(A);const h=String(A.addedFrom||"").toLowerCase().trim(),w=h==="tag"||h==="delegated"||h==="staff",v=!!A.sourcePlanId||Number.isInteger(A.sourceTaskIndex)||Number.isFinite(Number(A.sourceTaskIndex));return w||v},k=(A={})=>window.AppCalendar?.hasCarryForwardLineage?window.AppCalendar.hasCarryForwardLineage(A):!!(A.carryForwardRootId||A.isAutoForwarded===!0||A.carriedForwardFromDate||A.carriedForwardFromPlanId),T=(A={})=>{if(window.AppCalendar?.resolveTaskOriginDate)return String(window.AppCalendar.resolveTaskOriginDate(A)||"");const h=String(A.carriedForwardFromDate||"").trim();if(/^\d{4}-\d{2}-\d{2}$/.test(h))return h;const w=String(A.sourcePlanId||"").match(/(\d{4}-\d{2}-\d{2})/);if(w)return w[1];const v=String(A.carryForwardRootId||"").match(/(\d{4}-\d{2}-\d{2})/);return v?v[1]:""},S=(A={})=>{if(window.AppCalendar?.hasLegacyTaggedTextPattern)return!!window.AppCalendar.hasLegacyTaggedTextPattern(A);const h=String(A.task||"");return h?(h.match(/\(Responsible:/gi)||[]).length>1:!1};return l&&c.forEach(A=>{const h=new Date(A.date);if(h>=o&&h<=s&&A.workDescription){const w=A.user_id||A.userId,v=`${w}:${A.date}`;g[v]||(g[v]=[]),g[v].push(A.workDescription.toLowerCase().trim()),f.push({...A,type:"attendance",staffName:u[w]||A.userName||"Unknown Staff",_displayDesc:A.workDescription,_sortTime:A.checkOut||"00:00"})}}),p.forEach(A=>{const h=new Date(A.date);if(h>=o&&h<=s&&A.plans){const w=`${A.userId}:${A.date}`,v=g[w]||[];A.plans.forEach((_,L)=>{if(_?.isRemoved===!0||(()=>{const R=T(_);return!!(R&&R<String(A.date||"")||k(_)&&!R||y(_)&&S(_))})())return;const x=(_.task||"").trim().toLowerCase();if(x&&v.length>0&&v.some(I=>I.includes(x)))return;const D=A.userId||A.user_id;let M=u[D]||A.userName;M||(M=D==="annual_shared"?"All Staff":"Unknown Staff"),f.push({..._,date:A.date,id:A.id,planId:A.id,taskIndex:L,planScope:_.planScope||A.planScope||"personal",userId:D,type:"work",staffName:M,_displayDesc:_.task,_sortTime:"09:00"})})}}),f.sort((A,h)=>{const w=new Date(h.date)-new Date(A.date);return w!==0?w:h._sortTime.localeCompare(A._sortTime)}),f}catch(t){return console.error("Error fetching all staff activities:",t),[]}}}const vi=new wi;typeof window<"u"&&(window.AppAnalytics=vi);class bi{constructor(){this.db=K}convertToCSV(e,t,n){const i=t.join(","),s=e.map(o=>n.map(r=>{let d=o[r]||"";return d=String(d).replace(/"/g,'""'),d.search(/("|,|\n)/g)>=0&&(d=`"${d}"`),d}).join(","));return[i,...s].join(`
`)}downloadFile(e,t,n){const i=new Blob([e],{type:n}),s=URL.createObjectURL(i),o=document.createElement("a");o.href=s,o.download=t,document.body.appendChild(o),o.click(),setTimeout(()=>{document.body.removeChild(o),window.URL.revokeObjectURL(s)},0)}summarizeTaskUpdates(e){return!Array.isArray(e)||e.length===0?"":e.map(t=>{const n=t.action||"action",i=Number.isFinite(Number(t.progressPercent))?`${Number(t.progressPercent)}%`:"",s=t.progressStatus?String(t.progressStatus).replace(/_/g," "):"",o=t.progressNote?` - ${t.progressNote}`:"",r=`${i}${i&&s?" ":""}${s}`.trim(),d=r?` (${r})`:"";return`${n}${d}${o}`.trim()}).join(" | ")}async exportAttendanceCSV(){try{const e=await this.db.getAll("users"),t=await this.db.getAll("attendance"),n={};e.forEach(l=>n[l.id]=l);const i=t.map(l=>{const c=l.user_id||l.userId,p=n[c]||{name:"Unknown",role:"N/A",rating:0,completionStats:{}};let m=l.location||"N/A";return l.lat&&l.lng&&(m=`Lat: ${Number(l.lat).toFixed(5)}, Lng: ${Number(l.lng).toFixed(5)}`),{date:l.date,name:p.name,role:p.role,rating:p.rating?p.rating.toFixed(1):"N/A",completionRate:p.completionStats?.completionRate?`${(p.completionStats.completionRate*100).toFixed(0)}%`:"N/A",checkIn:l.checkIn,checkOut:l.checkOut||"--",duration:l.duration||"--",workSummary:l.workDescription||"--",taskUpdates:this.summarizeTaskUpdates(l.taskUpdates||[]),inLocation:m,outLocation:l.checkOutLocation||"--",type:l.type||"Standard"}});e.forEach(l=>{if(l.status==="in"&&l.lastCheckIn){const c=new Date(l.lastCheckIn);i.push({date:c.toLocaleDateString(),name:l.name,role:l.role,checkIn:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:"Active Now",duration:"Working...",workSummary:"Current Session (Active)",inLocation:l.currentLocation?.address||"Current Session",outLocation:"--",type:"Office (Active)"})}}),i.sort((l,c)=>new Date(c.date)-new Date(l.date));const s=["Date","Staff Name","Role","Star Rating","Completion Rate","Check In","Check Out","Duration","Work Summary","Task Updates","Check-in Location","Check-out Location","Type"],o=["date","name","role","rating","completionRate","checkIn","checkOut","duration","workSummary","taskUpdates","inLocation","outLocation","type"],r=this.convertToCSV(i,s,o),d=`Attendance_Report_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(r,d,"text/csv"),!0}catch(e){throw console.error("Export Failed:",e),new Error("Failed to generate report")}}async exportUserLogsCSV(e,t){try{const n=t.map(d=>{let l=d.location||"N/A";return d.lat&&d.lng&&(l=`Lat: ${Number(d.lat).toFixed(5)}, Lng: ${Number(d.lng).toFixed(5)}`),{date:d.date,name:e.name,role:e.role,checkIn:d.checkIn,checkOut:d.checkOut||"--",duration:d.duration||"--",workSummary:d.workDescription||"--",taskUpdates:this.summarizeTaskUpdates(d.taskUpdates||[]),inLocation:l,outLocation:d.checkOutLocation||"--",type:d.type||"Standard"}});n.sort((d,l)=>new Date(l.date)-new Date(d.date));const i=["Date","Staff Name","Role","Check In","Check Out","Duration","Work Summary","Task Updates","Check-in Location","Check-out Location","Type"],s=["date","name","role","checkIn","checkOut","duration","workSummary","taskUpdates","inLocation","outLocation","type"],o=this.convertToCSV(n,i,s),r=`Attendance_Report_${e.name.replace(/ /g,"_")}_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(o,r,"text/csv"),!0}catch(n){console.error("Export Failed:",n),alert("Failed to export logs: "+n.message)}}async exportMasterSheetCSV(e,t,n,i){try{const s=new Date(t,e+1,0).getDate(),o=["S.No","Staff Name","Department"];for(let p=1;p<=s;p++)o.push(String(p));const r=n.sort((p,m)=>p.name.localeCompare(m.name)).map((p,m)=>{const u=[m+1,p.name,p.dept||"General"];for(let f=1;f<=s;f++){const g=`${t}-${String(e+1).padStart(2,"0")}-${String(f).padStart(2,"0")}`,y=i.filter(k=>(k.userId===p.id||k.user_id===p.id)&&k.date===g);if(y.length>0){const k=y[0];let T=k.type||"P";T==="Short Leave"&&k.durationHours&&(T=`SL(${k.durationHours}h)`),u.push(`${T} (${k.checkIn}-${k.checkOut||"Active"})`)}else u.push("-")}return u}),d=[o.join(","),...r.map(p=>p.join(","))].join(`
`),c=`Attendance_Sheet_${new Date(t,e).toLocaleString("default",{month:"long"})}_${t}.csv`;return this.downloadFile(d,c,"text/csv"),!0}catch(s){console.error("Export Failed:",s),alert("Export Failed: "+s.message)}}async exportLeavesCSV(e){try{const t=["Applied On","Staff Name","FY","Type","From","To","Days/Hrs","Reason","Status","Admin Comment"],n=["appliedOn","userName","financialYear","type","startDate","endDate","daysCount","reason","status","adminComment"],i=e.map(r=>({...r,daysCount:r.type==="Short Leave"?`${r.durationHours||0}h`:r.daysCount})),s=this.convertToCSV(i,t,n),o=`Leave_Requests_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(s,o,"text/csv"),!0}catch(t){console.error("Leave Export Failed:",t),alert("Export Failed: "+t.message)}}async exportCalendarPlansCSV(e,t,n){try{const i=[],s=new Date(n,t+1,0).getDate(),o=new Date(n,t).toLocaleString("default",{month:"long"});for(let p=1;p<=s;p++){const m=`${n}-${String(t+1).padStart(2,"0")}-${String(p).padStart(2,"0")}`;e.leaves.forEach(u=>{m>=u.startDate&&m<=u.endDate&&i.push({date:m,category:"Leave",subject:`${u.userName||"Staff"} - ${u.type}`,details:u.reason||"No reason provided",staff:u.userName||"Staff"})}),e.events.forEach(u=>{u.date===m&&i.push({date:m,category:"Event",subject:u.title,details:u.type||"General Event",staff:"Organization"})}),e.workPlans.forEach(u=>{if(u.date===m){const f=Array.isArray(u.plans)?u.plans:[],g=f.length>0?f.map((y,k)=>{let T=`${k+1}. ${y.task}`;return y.subPlans&&y.subPlans.length>0&&(T+=` (Steps: ${y.subPlans.join(", ")})`),y.tags&&y.tags.length>0&&(T+=` [With: ${y.tags.map(S=>`@${S.name} (${S.status||"pending"})`).join(", ")}]`),T}).join(" | "):"Work Plan";i.push({date:m,category:"Work Plan",subject:"Daily Goals",details:g,staff:u.userName||"Staff"})}})}if(i.length===0)return alert("No plans found for the selected month."),!1;const r=["Date","Category","Subject","Details","Staff Member"],d=["date","category","subject","details","staff"],l=this.convertToCSV(i,r,d),c=`Team_Schedule_${o}_${n}.csv`;return this.downloadFile(l,c,"text/csv"),!0}catch(i){console.error("Calendar Export Failed:",i),alert("Failed to export calendar: "+i.message)}}async exportAnnualListViewCSV(e){try{const t=(e||[]).map(r=>({date:r.date||"",staffName:r.staffName||r.staff||"",assignedBy:r.assignedBy||"",assignedTo:r.assignedTo||"",selfAssigned:r.selfAssigned?"Yes":"No",dueDate:r.dueDate||"",status:r.statusLabel||r.status||"",comments:r.comments||"",tags:Array.isArray(r.tags)?r.tags.join(", "):r.tags||""})),n=["Date","Staff Name","Assigned By","Assigned To","Self Assigned","Due Date","Completion Status","Comments","Tags"],i=["date","staffName","assignedBy","assignedTo","selfAssigned","dueDate","status","comments","tags"],s=this.convertToCSV(t,n,i),o=`Annual_Plan_List_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(s,o,"text/csv"),!0}catch(t){throw console.error("List Export Failed:",t),new Error("Failed to export list: "+t.message)}}exportTeamActivitiesXLSX(e,t={}){try{if(typeof window>"u"||!window.XLSX)return alert("Excel export library not loaded."),!1;const n=(e||[]).map(p=>[p.date||"",p.staffName||"",p.type||"",p.status||"",p.description||"",p.sourceTime||""]),i=["Date","Staff","Type","Status","Description","Time"],s=window.XLSX.utils.aoa_to_sheet([i,...n]),o=window.XLSX.utils.book_new();window.XLSX.utils.book_append_sheet(o,s,"Team Activities");const r=(t.start||"").replace(/[^a-zA-Z0-9_-]/g,"_"),d=(t.end||"").replace(/[^a-zA-Z0-9_-]/g,"_"),c=`Team_Activities_${r&&d?`${r}_to_${d}`:r||d||"export"}.xlsx`;return window.XLSX.writeFile(o,c),!0}catch(n){return console.error("Team Activities Export Failed:",n),alert("Export Failed: "+n.message),!1}}}const Si=new bi;typeof window<"u"&&(window.AppReports=Si);class ki{constructor(){this.db=K,this.cache={},this.defaultPolicy={"Annual Leave":{total:10,minDays:3,accrual:"annual"},"Casual Leave":{total:6,maxDays:2,accrual:"monthly"},"Medical Leave":{total:6,certificateThreshold:2,accrual:"annual"},"Maternity Leave":{total:180,paid:!0,gender:"female"},"Paternity Leave":{total:10,paid:!0,gender:"male",minServiceYears:0},"Study Leave":{total:5,paid:!1,requireApproval:!0},"Compassionate Leave":{total:3,paid:!0}}}async getPolicy(){if(this.cache.policy)return this.cache.policy;try{if(window.AppFirestore){const e=await window.AppFirestore.collection("settings").doc("policies").get();e.exists?this.cache.policy={...this.defaultPolicy,...e.data()}:this.cache.policy=this.defaultPolicy}else this.cache.policy=this.defaultPolicy}catch(e){console.warn("Failed to fetch dynamic policy, using default.",e),this.cache.policy=this.defaultPolicy}return this.cache.policy}async updatePolicy(e){try{if(window.AppFirestore)return await window.AppFirestore.collection("settings").doc("policies").set(e,{merge:!0}),this.cache.policy=null,!0;throw new Error("Database not connected")}catch(t){throw console.error("Failed to update policy:",t),t}}async getFinancialYear(e=new Date){const t=e.getMonth(),n=e.getFullYear();return t<3?{label:`${n-1}-${n}`,start:new Date(n-1,3,1),end:new Date(n,2,31)}:{label:`${n}-${n+1}`,start:new Date(n,3,1),end:new Date(n+1,2,31)}}async getUserLeaves(e,t=null){t||(t=(await this.getFinancialYear()).label);try{if(this.db.queryMany&&C?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES)return(await this.db.queryMany("leaves",[{field:"userId",operator:"==",value:e},{field:"financialYear",operator:"==",value:t}])).sort((s,o)=>new Date(o.startDate)-new Date(s.startDate))}catch(i){console.warn("Scoped getUserLeaves query failed, using fallback",i)}return(await this.db.getAll("leaves")).filter(i=>i.userId===e&&i.financialYear===t).sort((i,s)=>new Date(s.startDate)-new Date(i.startDate))}async getLeaveUsage(e,t,n){return(await this.getUserLeaves(e,n.label)).filter(o=>o.type===t&&(o.status==="Approved"||o.status==="Pending")).reduce((o,r)=>o+(parseFloat(r.daysCount)||0),0)}async getMonthlyShortLeaveUsage(e,t){const n=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}`;let i=[];try{this.db.queryMany&&C?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES&&(i=(await this.db.queryMany("leaves",[{field:"userId",operator:"==",value:e},{field:"type",operator:"==",value:"Short Leave"},{field:"startDate",operator:">=",value:`${n}-01`},{field:"startDate",operator:"<=",value:`${n}-31`}])).filter(o=>o.status==="Approved"||o.status==="Pending"))}catch(s){console.warn("Scoped short leave query failed, using fallback",s)}return i.length||(i=(await this.db.getAll("leaves")).filter(o=>o.userId===e&&o.type==="Short Leave"&&String(o.startDate||"").startsWith(n)&&(o.status==="Approved"||o.status==="Pending"))),i.reduce((s,o)=>s+(parseFloat(o.daysCount||o.durationHours)||0),0)}async getPendingLeaves(){try{let e=[];if(this.db.queryMany&&C?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES?e=(await this.db.queryMany("leaves",[{field:"status",operator:"==",value:"Pending"}],{orderBy:[{field:"appliedOn",direction:"desc"}]})).sort((n,i)=>new Date(i.appliedOn)-new Date(n.appliedOn)):e=(await this.db.getAll("leaves")).filter(n=>n.status==="Pending").sort((n,i)=>new Date(i.appliedOn)-new Date(n.appliedOn)),e.length>0){const t=await this.db.getAll("users"),n={};t.forEach(i=>{n[i.id]=i.name}),e.forEach(i=>{!i.userName&&n[i.userId]&&(i.userName=n[i.userId])})}return e}catch(e){return console.warn("getPendingLeaves failed, using fallback",e),(await this.db.getAll("leaves").catch(()=>[])).filter(n=>n.status==="Pending").sort((n,i)=>new Date(i.appliedOn)-new Date(n.appliedOn))}}async requestLeave(e){const{userId:t,startDate:n,endDate:i,type:s,durationHours:o}=e,r=new Date(n),d=new Date(i);let l=Math.ceil((d-r)/(1e3*60*60*24))+1;if(l<=0&&s!=="Short Leave")throw new Error("Invalid date range");const c=await this.getFinancialYear(r),p=await this.getLeaveUsage(t,s,c),u=(await this.getPolicy())[s],f=[];if(s==="Half Day")l=.5,e.daysCount=.5;else if(s==="Short Leave"){const y=await this.getMonthlyShortLeaveUsage(t,r);let k=parseFloat(o||0);k>2&&f.push("Short Leave exceeds 2 hours (standard)."),y+k>4&&f.push(`Monthly Short Leave limit exceeded (${y+k}/4 hours).`),e.daysCount=k}else if(s==="Annual Leave")l<(u.minDays||1)&&f.push(`Annual Leave requested is less than required minimum (${u.minDays||1} days).`),p+l>u.total&&f.push(`Annual Leave balance exceeded (${p+l}/${u.total}).`);else if(s==="Casual Leave")l>u.maxDays&&f.push(`Casual Leave exceeds maximum allowed per request (${u.maxDays} days).`),p+l>u.total&&f.push(`Casual Leave balance exceeded (${p+l}/${u.total}).`);else if(s==="Medical Leave")p+l>u.total&&f.push(`Medical Leave balance exceeded (${p+l}/${u.total}).`),l>u.certificateThreshold&&(e.requireCertificate=!0);else if(s==="Paternity Leave"){const y=await this.db.get("users",t),k=new Date(y.joinDate),T=(r-k)/(1e3*60*60*24*365.25);u.minServiceYears&&T<u.minServiceYears&&f.push(`User has not completed ${u.minServiceYears} year(s) of service (required for Paternity Leave).`),l>u.total&&f.push(`Paternity Leave exceeds limit of ${u.total} days.`)}else["Study Leave","Compassionate Leave"].includes(s)&&u&&l>u.total&&f.push(`${s} exceeds limit of ${u.total} days.`);const g={id:"l"+Date.now(),...e,status:"Pending",appliedOn:new Date().toISOString(),financialYear:c.label,daysCount:l,policyWarnings:f};return await this.db.add("leaves",g),g}async updateLeaveStatus(e,t,n,i=""){const s=await this.db.get("leaves",e);if(!s)throw new Error("Leave not found");const o=n||window.AppAuth?.getUser?.()?.id||null;if(s.status=t,s.actionDate=new Date().toISOString(),s.adminComment=i,o?s.actionBy=o:delete s.actionBy,await this.db.put("leaves",s),t==="Approved"){const r=new Date(s.startDate),d=new Date(s.endDate);let l=new Date(r);for(;l<=d;){const c=l.toISOString().split("T")[0],p={id:"att_"+s.userId+"_"+c,user_id:s.userId,date:c,checkIn:"09:00",checkOut:"17:00",duration:"8h 0m",location:"On Leave",type:s.type,status:"in",synced:!1};await this.db.put("attendance",p),l.setDate(l.getDate()+1)}}return s}}const Te=new ki;typeof window<"u"&&(window.AppLeaves=Te);class Ai{constructor(){this.db=K,this.cleanupFlag=C?.SIMULATION_POLICY?.LEGACY_DUMMY_CLEANUP?.FLAG_KEY||"legacy_dummy_cleanup_v1",this.simulationFlag="simulation_run_v2"}getCleanupPolicy(){const e=C?.SIMULATION_POLICY?.LEGACY_DUMMY_CLEANUP||{},t=new Set((e.TARGET_USER_IDS||[]).map(i=>String(i||"").trim()).filter(Boolean)),n=new Set((e.TARGET_USERNAMES||[]).map(i=>String(i||"").trim().toLowerCase()).filter(Boolean));return{enabled:e.ENABLED!==!1,targetIds:t,targetUsernames:n,auditCollection:String(e.AUDIT_COLLECTION||"system_audit_logs")}}async writeCleanupAudit(e,t={}){const n=this.getCleanupPolicy();try{await this.db.add(n.auditCollection,{type:e,module:"simulation",payload:t,createdAt:Date.now()})}catch(i){console.warn("Simulation audit log write failed:",i)}}async run(){const e=C&&C.READ_OPT_FLAGS||{},t=typeof window<"u"&&window.location&&window.location.hostname?window.location.hostname:"",n=t==="localhost"||t==="127.0.0.1";if(!(!e.ENABLE_SIMULATION_MODULE&&!n)){if(localStorage.getItem(this.cleanupFlag)||(await this.cleanupLegacyDummyData(),localStorage.setItem(this.cleanupFlag,"true")),localStorage.getItem(this.simulationFlag)){console.log("Simulation already ran. Use window.AppSimulation.forceRun() to force.");return}await this.forceRun(),localStorage.setItem(this.simulationFlag,"true")}}async cleanupLegacyDummyData(){const e=this.getCleanupPolicy();if(e.enabled){if(e.targetIds.size===0&&e.targetUsernames.size===0){await this.writeCleanupAudit("legacy_dummy_cleanup_skipped",{reason:"no_targets"});return}try{const n=(await this.db.getAll("users")).filter(m=>e.targetIds.has(m.id)||e.targetUsernames.has((m.username||"").trim().toLowerCase())),i=new Set(n.map(m=>m.id));if(i.size===0){await this.writeCleanupAudit("legacy_dummy_cleanup_skipped",{reason:"no_matches",configuredTargets:{ids:Array.from(e.targetIds),usernames:Array.from(e.targetUsernames)}});return}let s=0,o=0,r=0,d=0;const l=await this.db.getAll("attendance");for(const m of l){const u=m.user_id||m.userId;i.has(u)&&(await this.db.delete("attendance",m.id),s+=1)}const c=await this.db.getAll("leaves");for(const m of c){const u=m.userId||m.user_id;i.has(u)&&(await this.db.delete("leaves",m.id),o+=1)}const p=await this.db.getAll("work_plans");for(const m of p){const u=m.userId||m.user_id;i.has(u)&&(await this.db.delete("work_plans",m.id),r+=1)}for(const m of n)await this.db.delete("users",m.id),d+=1;await this.writeCleanupAudit("legacy_dummy_cleanup_completed",{matchedUserIds:Array.from(i),deleted:{attendance:s,leaves:o,workPlans:r,users:d}}),console.log("Legacy dummy users and linked records removed.",{users:d,attendance:s,leaves:o,workPlans:r})}catch(t){await this.writeCleanupAudit("legacy_dummy_cleanup_failed",{message:t?.message||String(t)}),console.warn("Legacy dummy cleanup failed:",t)}}}async forceRun(){console.log("Starting Office Scenario Simulation (V2)...");const e=new Date;if(window.AppCalendar){const t=new Date(e);t.setDate(t.getDate()+1),await window.AppCalendar.addEvent({title:"Office Picnic/Holiday",date:t.toISOString().split("T")[0],type:"holiday"})}console.log("Simulation Complete.")}}const la=new Ai;typeof window<"u"&&(window.AppSimulation=la,setTimeout(()=>la.run(),2e3));const se="minutes";function Pe(){const a=window.AppAuth.getUser();if(!a||!a.id)throw new Error("User not authenticated");return a}function at(a){return!!(window.app_hasPerm&&window.app_hasPerm("minutes","admin",a))}function Di(a,e,t,n={}){const i=a&&a.createdBy===e.id,s=at(e),o=n&&n.allowNonOwner===!0;if(!i&&!s&&!o)throw new Error("You do not have permission to edit these minutes.");if(a&&a.locked&&!(n&&n.allowOnLocked===!0))throw new Error("This record is locked.");return!t||!String(t).trim()?"Updated minutes":String(t).trim()}async function xi(a={}){try{const e=a.limit||150;return window.AppDB?.queryMany?await window.AppDB.queryMany(se,[],{orderBy:[{field:"date",direction:"desc"}],limit:e}):window.AppDB?.getAll?(await window.AppDB.getAll(se)).sort((i,s)=>String(s.date||"").localeCompare(String(i.date||""))).slice(0,e):(await window.AppFirestore.collection(se).orderBy("date","desc").limit(e).get()).docs.map(n=>({id:n.id,...n.data()}))}catch(e){throw console.error("Error fetching minutes:",e),e}}async function $i(a){try{const e=Pe(),t=new Date().toISOString(),n=e.name||e.username||"Unknown",i={...a,createdBy:e.id,createdByName:n,createdAt:t,lastEditedBy:e.id,lastEditedByName:n,lastEditedAt:t,auditLog:[{userId:e.id,userName:n,timestamp:t,action:"Created meeting minutes"}],approvals:{},locked:!1,restrictedFrom:[],allowedViewers:[],accessRequests:[]};return window.AppDB?await window.AppDB.add(se,i):(await window.AppFirestore.collection(se).add(i)).id}catch(e){throw console.error("Error adding minute:",e),e}}async function nt(a,e,t,n={}){try{const i=Pe(),s=await(window.AppDB?window.AppDB.get(se,a):window.AppFirestore.collection(se).doc(a).get().then(p=>p.data()));if(!s)throw new Error("Minute not found");const o=Di(s,i,t,n),r=new Date().toISOString(),d=i.name||i.username||"Unknown",l={userId:i.id,userName:d,timestamp:r,action:o},c={...s,...e,id:a,lastEditedBy:i.id,lastEditedByName:d,lastEditedAt:r,auditLog:[...s.auditLog||[],l]};return window.AppDB?await window.AppDB.put(se,c):await window.AppFirestore.collection(se).doc(a).update(c),!0}catch(i){throw console.error("Error updating minute:",i),i}}async function _i(a){try{const e=Pe(),t=await(window.AppDB?window.AppDB.get(se,a):window.AppFirestore.collection(se).doc(a).get().then(i=>i.data()));if(!t)throw new Error("Minute not found");const n=t.accessRequests||[];return n.some(i=>i.userId===e.id)?!0:(n.push({userId:e.id,userName:e.name||e.username||"Unknown",status:"pending",requestedAt:new Date().toISOString()}),await nt(a,{accessRequests:n},`Requested access for ${e.name||e.username}`,{allowNonOwner:!0,allowOnLocked:!0}))}catch(e){throw console.error("Error requesting access:",e),e}}async function Ti(a,e,t){try{const n=Pe(),i=await(window.AppDB?window.AppDB.get(se,a):window.AppFirestore.collection(se).doc(a).get().then(c=>c.data()));if(!i)throw new Error("Minute not found");const s=i.createdBy===n.id,o=at(n);if(!s&&!o)throw new Error("Only owner or admin can review access requests.");const r=i.accessRequests||[],d=r.find(c=>c.userId===e);if(!d)return!0;d.status=t;const l=i.allowedViewers||[];return t==="approved"&&!l.includes(e)&&l.push(e),await nt(a,{accessRequests:r,allowedViewers:l},`${String(t||"").toUpperCase()} access request for userId: ${e}`,{allowOnLocked:!0})}catch(n){throw console.error("Error handling access request:",n),n}}async function Ii(a,e,t){try{const n=Pe(),i=await(window.AppDB?window.AppDB.get(se,a):window.AppFirestore.collection(se).doc(a).get().then(l=>l.data()));if(!i||!i.actionItems)throw new Error("Minute or tasks not found");const s=i.actionItems[e];if(!s)throw new Error("Task not found");const o=i.createdBy===n.id,r=at(n),d=s.assignedTo===n.id;if(!o&&!r&&!d)throw new Error("Only owner, admin, or assignee can update this task.");return s.status=t,t==="completed"&&(s.completedAt=new Date().toISOString()),await nt(a,{actionItems:i.actionItems},`Updated Task: ${s.task} to ${t}`,{allowNonOwner:!0,allowOnLocked:!0})}catch(n){throw console.error("Error updating action item:",n),n}}async function Mi(a){try{const e=Pe(),t=await(window.AppDB?window.AppDB.get(se,a):window.AppFirestore.collection(se).doc(a).get().then(c=>c.data()));if(!t)throw new Error("Minute not found");const n=t.attendeeIds||[],i=n.includes(e.id),s=t.createdBy===e.id,o=at(e);if(!i&&!s&&!o)throw new Error("Only attendees, owner, or admin can approve minutes.");const r=t.approvals||{};r[e.id]=new Date().toISOString();const d=n.length>0&&n.every(c=>r[c]),l={approvals:r};return d&&(l.locked=!0),await nt(a,l,`${d?"FINAL APPROVAL & LOCK":"Signed"} by ${e.name||e.username}`,{allowNonOwner:!0,allowOnLocked:!0})}catch(e){throw console.error("Error approving minute:",e),e}}async function Ci(a){try{const e=Pe(),t=await(window.AppDB?window.AppDB.get(se,a):window.AppFirestore.collection(se).doc(a).get().then(s=>s.data()));if(!t)throw new Error("Minute not found");const n=t.createdBy===e.id,i=at(e);if(!n&&!i)throw new Error("Only owner or admin can delete minutes.");return window.AppDB?await window.AppDB.delete(se,a):(await window.AppFirestore.collection(se).doc(a).delete(),!0)}catch(e){throw console.error("Error deleting minute:",e),e}}const Li={getMinutes:xi,addMinute:$i,updateMinute:nt,approveMinute:Mi,deleteMinute:Ci,requestAccess:_i,handleAccessRequest:Ti,updateActionItemStatus:Ii};typeof window<"u"&&(window.AppMinutes=Li);const Jt={async renderPolicyEditor(){const a=await Te.getPolicy();return`
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
        `},setupGlobalHandlers(){window.app_savePolicyChanges=async a=>{a.preventDefault();const e=new FormData(a.target),t=await Te.getPolicy(),n={};Object.keys(t).forEach(i=>{n[i]={...t[i]};const s=l=>{const c=e.get(l);return c!==""&&c!==null?parseInt(c):void 0},o=s(`${i}_total`);o!==void 0&&(n[i].total=o);const r=s(`${i}_min`);r!==void 0?n[i].minDays=r:delete n[i].minDays;const d=s(`${i}_max`);d!==void 0?n[i].maxDays=d:delete n[i].maxDays});try{await Te.updatePolicy(n);const i=a.target.querySelector("button"),s=i.innerHTML;i.innerHTML='<i class="fa-solid fa-check"></i> Saved!',i.style.background="#166534",setTimeout(()=>{i.innerHTML=s,i.style.background="",window.location.reload()},1e3)}catch(i){alert("Failed to update policy: "+i.message)}},window.app_approveLeaveWithWarning=async a=>{const e=await window.appPrompt("Reason for override:","",{title:"Leave Override",confirmText:"Approve With Reason",placeholder:"Enter reason"});if(e)try{await Te.updateLeaveStatus(a,"Approved",ae.getUser().id,`[Overridden] ${e}`),window.location.reload()}catch(t){alert(t.message)}}}};Jt.setupGlobalHandlers();typeof window<"u"&&(window.AppAdminPolicies=Jt);const Ei={currentYear:new Date().getFullYear(),holidayCache:null,baseline2025:[{name:"Republic Day",date:"2025-01-26",type:"National"},{name:"Maha Shivaratri",date:"2025-02-26",type:"Regional"},{name:"Holi",date:"2025-03-14",type:"Regional"},{name:"Id-ul-Fitr",date:"2025-03-31",type:"Regional"},{name:"Good Friday",date:"2025-04-18",type:"Regional"},{name:"Independence Day",date:"2025-08-15",type:"National"},{name:"Dussehra",date:"2025-10-02",type:"Regional"},{name:"Gandhi Jayanti",date:"2025-10-02",type:"National"},{name:"Diwali",date:"2025-10-20",type:"Regional"},{name:"Christmas",date:"2025-12-25",type:"Regional"}],async render(){const a=await Te.getPolicy(),e=ae.getUser(),t=await Te.getFinancialYear(),n=window.app_hasPerm("policies","admin",e);let i=0;try{const d=new Date,l=d.getDay(),c=d.getDate()-l+(l===0?-6:1),p=new Date(d.setDate(c));p.setHours(0,0,0,0);const m=p.toISOString().split("T")[0];i=(await K.getAll("attendance")).filter(g=>g.user_id===e.id&&g.date>=m).filter(g=>g.checkIn?g.lateCountable===!0?!0:Sa.normalizeType(g.type)==="Late":!1).length}catch(d){console.warn("Error calc lates",d)}const s=Object.keys(a).map(async d=>{const l=await Te.getLeaveUsage(e.id,d,t);return{type:d,usage:l,total:a[d].total,icon:this.getIconForType(d),color:this.getColorForType(d)}}),o=await Promise.all(s),r=await this.renderHolidayTable(this.currentYear,n);return`
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

                ${n?await Jt.renderPolicyEditor():""}
            </div>
            `},async loadHolidaySettings(){if(this.holidayCache)return this.holidayCache;const a=await K.get("settings","holidays").catch(()=>null),e=a&&a.byYear?a:{id:"holidays",byYear:{}};return this.holidayCache=e,e},async saveHolidaySettings(a){const e={id:"holidays",byYear:a.byYear||{}};await K.put("settings",e),this.holidayCache=e},buildYearFromBaseline(a){return this.baseline2025.map(e=>{const t=String(e.date).slice(5);return{name:e.name,date:`${a}-${t}`,type:e.type||"Regional"}}).sort((e,t)=>new Date(e.date)-new Date(t.date))},async getHolidaysForYear(a,e=!0){const t=await this.loadHolidaySettings(),n=String(a);return(!Array.isArray(t.byYear[n])||t.byYear[n].length===0)&&(t.byYear[n]=this.buildYearFromBaseline(a),e&&await this.saveHolidaySettings(t)),[...t.byYear[n]].sort((i,s)=>new Date(i.date)-new Date(s.date))},async renderHolidayTable(a,e){const t=await this.getHolidaysForYear(a);return`
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
            `},renderHolidayRows(a,e,t){return e.length?e.map((n,i)=>{const o=new Date(n.date).toLocaleDateString("en-US",{month:"short",day:"numeric"});return`
                <tr>
                    <td>
                        <div class="policies-holiday-name">${n.name}</div>
                        ${n.type==="National"?'<span class="policies-holiday-chip">Compulsory</span>':""}
                    </td>
                    <td class="policies-holiday-date">${o}</td>
                    ${t?`
                        <td class="text-right">
                            <button class="icon-btn" title="Edit" onclick="window.AppPolicies.openHolidayEditor(${i})"><i class="fa-solid fa-pen"></i></button>
                            <button class="icon-btn" title="Delete" onclick="window.AppPolicies.deleteHoliday(${i})"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    `:""}
                </tr>
            `}).join(""):`<tr><td colspan="${t?3:2}" class="policies-empty-holiday">No holiday data available for ${a}</td></tr>`},async changeYear(a){this.currentYear+=a;const e=document.getElementById("policy-year-label"),t=document.getElementById("holidays-container"),n=ae.getUser(),i=window.app_hasPerm("policies","admin",n);e&&t&&(e.textContent=this.currentYear,t.innerHTML=await this.renderHolidayTable(this.currentYear,i))},async openHolidayEditor(a=null){const e=ae.getUser();if(!e||!window.app_hasPerm("policies","admin",e))return;const t=this.currentYear,n=await this.getHolidaysForYear(t),i=Number.isInteger(a)?n[a]:null,s=`holiday-editor-${Date.now()}`,o=`
                <div class="modal-overlay" id="${s}" style="display:flex;">
                    <div class="modal-content" style="max-width:460px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.65rem;">
                            <h3 style="margin:0;">${i?"Edit Holiday":"Add Holiday"} (${t})</h3>
                            <button type="button" class="app-system-dialog-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                        </div>
                        <form onsubmit="window.AppPolicies.saveHoliday(event, ${Number.isInteger(a)?a:"null"})">
                            <div style="display:grid; gap:0.55rem;">
                                <div>
                                    <label>Holiday Name</label>
                                    <input id="holiday-name-input" type="text" required value="${i?String(i.name||"").replace(/"/g,"&quot;"):""}">
                                </div>
                                <div>
                                    <label>Date</label>
                                    <input id="holiday-date-input" type="date" required value="${i?i.date:`${t}-01-01`}">
                                </div>
                                <div>
                                    <label>Type</label>
                                    <select id="holiday-type-input">
                                        <option value="National" ${i&&i.type==="National"?"selected":""}>National</option>
                                        <option value="Regional" ${!i||i.type!=="National"?"selected":""}>Regional</option>
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
            `;typeof window.app_showModal=="function"?window.app_showModal(o,s):(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",o)},async saveHoliday(a,e=null){a.preventDefault();const t=this.currentYear,n=(document.getElementById("holiday-name-input")?.value||"").trim(),i=String(document.getElementById("holiday-date-input")?.value||"").trim(),s=(document.getElementById("holiday-type-input")?.value||"Regional").trim();if(!n||!i){alert("Please provide holiday name and date.");return}if(!i.startsWith(`${t}-`)){alert(`Date must be within ${t}.`);return}const o=await this.loadHolidaySettings(),r=String(t),d=Array.isArray(o.byYear[r])?[...o.byYear[r]]:this.buildYearFromBaseline(t),l={name:n,date:i,type:s==="National"?"National":"Regional"};Number.isInteger(e)&&d[e]?d[e]=l:d.push(l),o.byYear[r]=d.sort((c,p)=>new Date(c.date)-new Date(p.date)),await this.saveHolidaySettings(o),document.querySelector('.modal-overlay[id^="holiday-editor-"]')?.remove(),await this.changeYear(0)},async deleteHoliday(a){const e=ae.getUser();if(!e||!window.app_hasPerm("policies","admin",e)||!await window.appConfirm("Delete this holiday from current year?"))return;const n=this.currentYear,i=await this.loadHolidaySettings(),s=String(n),o=Array.isArray(i.byYear[s])?[...i.byYear[s]]:[];o[a]&&(o.splice(a,1),i.byYear[s]=o,await this.saveHolidaySettings(i),await this.changeYear(0))},getIconForType(a){return{"Annual Leave":"calendar-check","Casual Leave":"mug-hot","Medical Leave":"staff-snake","Maternity Leave":"baby-carriage","Paternity Leave":"baby","Study Leave":"graduation-cap","Compassionate Leave":"hand-holding-heart","Short Leave":"clock"}[a]||"file-circle-check"},getColorForType(a){return{"Annual Leave":"#0f766e","Casual Leave":"#ea580c","Medical Leave":"#dc2626","Maternity Leave":"#be185d","Paternity Leave":"#1d4ed8","Study Leave":"#6d28d9","Compassionate Leave":"#9333ea","Short Leave":"#475569"}[a]||"#64748b"},renderLeaveCard(a,e,t,n){const i=Math.min(100,e.usage/e.total*100);return`
            <div class="policies-leave-item">
                <div class="policies-leave-bg-icon" style="color:${n};"><i class="fa-solid fa-${t}"></i></div>
                <h4>${a}</h4>
                <div class="policies-leave-count">
                    <span>${e.total-e.usage}</span>
                    <small>/ ${e.total}</small>
                </div>
                <div class="policies-leave-bar"><div style="width:${i}%; background:${n};"></div></div>
                <div class="policies-leave-used">${e.usage} used</div>
            </div>
            `}};typeof window<"u"&&(window.AppPolicies=Ei);function Y(a,e={}){const t=document.createElement(a);if(e.id&&(t.id=e.id),e.className&&(t.className=e.className),e.textContent&&(t.textContent=e.textContent),e.innerHTML&&(t.innerHTML=e.innerHTML),e.attributes)for(const[n,i]of Object.entries(e.attributes))t.setAttribute(n,i);if(e.children)for(const n of e.children)t.appendChild(n);return t}function me(a={}){const e=Y("button",{className:a.className,textContent:a.textContent,innerHTML:a.innerHTML,attributes:{type:"button",...a.attributes}});return a.onClick&&e.addEventListener("click",a.onClick),e}const De=a=>String(a??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");function Pi(a,e){const t=document.createElement("div"),n=window.getComputedStyle(a);for(const l of n)t.style[l]=n[l];t.style.position="absolute",t.style.visibility="hidden",t.style.whiteSpace="pre-wrap",t.style.width=n.width,t.style.height="auto";const i=a.value.substring(0,e);t.textContent=i;const s=document.createElement("span");s.textContent=a.value.substring(e)||".",t.appendChild(s),document.body.appendChild(t);const{offsetLeft:o,offsetTop:r}=s,d=a.getBoundingClientRect();return document.body.removeChild(t),{top:d.top+r-a.scrollTop,left:d.left+o-a.scrollLeft}}function Ni(a,e,t){let n=document.getElementById("mention-dropdown");n?n.parentElement!==document.body&&document.body.appendChild(n):(n=Y("div",{id:"mention-dropdown",className:"mention-dropdown"}),document.body.appendChild(n));let i=0,s=[],o=-1;const r=()=>{n.style.display="none",o=-1},d=()=>{if(s.length===0)return r();n.innerHTML="",s.forEach((p,m)=>{const u=Y("div",{className:`mention-item ${m===i?"active":""}`,innerHTML:`
                    <img src="${p.avatar||"https://via.placeholder.com/32"}" class="mention-item-avatar">
                    <span class="mention-item-name">${p.name}</span>
                    <span class="mention-item-role">${p.role||"Staff"}</span>
                `});u.addEventListener("click",()=>l(p)),n.appendChild(u)});const c=Pi(a,o);n.style.top=`${c.top+24}px`,n.style.left=`${c.left}px`,n.style.display="block"},l=c=>{const p=a.value,m=p.substring(0,o),u=p.substring(a.selectionStart);a.value=`${m}@${c.name} ${u}`,a.focus(),r(),t&&t()};a.addEventListener("input",()=>{const c=a.value,p=a.selectionStart,m=c.lastIndexOf("@",p-1);if(m!==-1&&(m===0||/\s/.test(c[m-1]))){const u=c.substring(m+1,p).toLowerCase();if(!/\s/.test(u)){o=m,s=e.filter(f=>f.name.toLowerCase().includes(u)).slice(0,8),i=0,d();return}}r(),t&&t()}),a.addEventListener("keydown",c=>{n.style.display==="block"&&(c.key==="ArrowDown"?(c.preventDefault(),i=(i+1)%s.length,d()):c.key==="ArrowUp"?(c.preventDefault(),i=(i-1+s.length)%s.length,d()):c.key==="Enter"||c.key==="Tab"?(c.preventDefault(),l(s[i])):c.key==="Escape"&&r())}),document.addEventListener("click",c=>{!n.contains(c.target)&&c.target!==a&&r()})}function Bi(a,e,t,n,i){const s=Y("h3",{textContent:"Plan Your Day"}),o=Y("p",{className:"day-plan-subline",textContent:`${a}${e?` - Editing for ${t}`:""}`}),r=n?me({className:"day-plan-delete-btn",attributes:{title:"Delete plan"},innerHTML:'<i class="fa-solid fa-trash"></i>',onClick:()=>window.app_deleteDayPlan(a,i)}):null,d=me({className:"day-plan-close-btn",attributes:{title:"Close"},innerHTML:'<i class="fa-solid fa-xmark"></i>',onClick:c=>c.currentTarget.closest(".day-plan-modal-overlay").remove()}),l=Y("div",{className:"day-plan-header-actions",children:[r,d].filter(Boolean)});return Y("div",{className:"day-plan-header",children:[Y("div",{className:"day-plan-headline",children:[s,o]}),l]})}function Oi(a,e,t,n,i,s,o,r,d,l){const c=Y("div",{className:"day-plan-scroll-area personal-plans-container",attributes:{"data-scope":"personal"}}),p=Y("div",{className:"day-plan-scroll-area others-plans-container",attributes:{"data-scope":"annual"}});i.forEach((k,T)=>{const S=Xe({plan:k,idx:T,allUsers:s,targetId:e,defaultScope:o,selectableCollaborators:r,isAdmin:d,currentUserId:l.id,isReference:k.isReference});(k.planScope||k._planScope||o)==="annual"||k.isReference?p.appendChild(S):c.appendChild(S)});const m=Y("div",{className:"day-plan-columns",children:[Y("div",{className:"day-plan-column",children:[Y("div",{className:"day-plan-column-head",children:[Y("h4",{className:"day-plan-column-title",textContent:"Self Plan"}),me({className:"btn-premium-add",innerHTML:'<i class="fa-solid fa-plus-circle"></i> <span>Add Personal Plan (@)</span>',onClick:()=>Qe({date:a,targetId:e,scope:"personal",allUsers:s,selectableCollaborators:r,isAdmin:d,container:c})})]}),c]}),Y("div",{className:"day-plan-column",children:[Y("div",{className:"day-plan-column-head",children:[Y("h4",{className:"day-plan-column-title",textContent:"Others' & Annual Plans"}),me({className:"btn-premium-add",innerHTML:'<i class="fa-solid fa-plus-circle"></i> <span>Add Annual Plan (@)</span>',onClick:()=>Qe({date:a,targetId:e,scope:"annual",allUsers:s,selectableCollaborators:r,isAdmin:d,container:p})})]}),p]})]}),u=me({className:"day-plan-discard-btn",textContent:"Discard",onClick:k=>k.currentTarget.closest(".day-plan-modal-overlay").remove()}),f=me({className:"day-plan-save-btn",innerHTML:'<i class="fa-solid fa-check-circle"></i> <span>Save Plan</span>',attributes:{type:"submit"}}),g=Y("div",{className:"day-plan-footer",children:[Y("div",{className:"day-plan-actions",children:[u,f]})]}),y=Y("form",{className:"day-plan-form",attributes:{"data-had-personal":t?"1":"0","data-had-annual":n?"1":"0","data-removed-tasks":"[]"},children:[m,g]});return y.addEventListener("submit",k=>window.app_saveDayPlan(k,a,e)),y}function Qe(a){const{date:e,targetId:t,scope:n,allUsers:i,selectableCollaborators:s,isAdmin:o,container:r,existingBlock:d=null}=a,l=ae.getUser(),c=d?window.app_extractBlockData(d):{task:"",subPlans:[],tags:[],status:null,assignedTo:t,startDate:e,endDate:e,planScope:n,carryForwardRootId:"",isRemoved:!1},p=Y("div",{className:"plan-editor-overlay"}),m=Y("div",{className:"plan-editor-modal"}),u=Y("div",{className:"plan-editor-head",innerHTML:`<h4>${d?"Edit":"Add"} ${n==="annual"?"Annual":"Personal"} Plan <small style="font-weight:400; opacity:0.7; font-size:0.8em; margin-left:5px;">(Use @ to tag)</small></h4>`}),f=Y("div",{className:"plan-editor-body"}),g=Y("textarea",{className:"plan-editor-textarea",textContent:c.task,attributes:{placeholder:"What is the objective or task for today? Use @ to tag colleagues.",required:!0}}),y=Y("div",{className:"plan-editor-tags-container",attributes:{style:"display: none;"}}),k=()=>{const L=g.value,b=[];if(i.forEach(x=>{const D=`@${x.name}`;L.includes(D)&&!b.find(M=>M.id===x.id)&&b.push(x)}),b.length>0){y.style.display="block",y.innerHTML='<label class="plan-editor-tags-label">Tagged Collaborators:</label>';const x=Y("div",{className:"plan-editor-tags-wrapper"});b.forEach(D=>{const M=Y("span",{className:"day-plan-tag-pill",textContent:`@${D.name}`});x.appendChild(M)}),y.appendChild(x)}else y.style.display="none",y.innerHTML=""},T=Y("div",{className:"plan-editor-grid"}),S=Y("div",{className:"plan-editor-field"});S.innerHTML="<label>Status</label>";const A=Y("select",{className:"plan-editor-select"});A.innerHTML=`
        <option value="" ${c.status?"":"selected"}>Auto-Track</option>
        <option value="completed" ${c.status==="completed"?"selected":""}>Completed</option>
        <option value="in-process" ${c.status==="in-process"?"selected":""}>In Progress</option>
        <option value="not-completed" ${c.status==="not-completed"?"selected":""}>Not Completing</option>
    `,S.appendChild(A);let h=null;if(o){const L=Y("div",{className:"plan-editor-field"});L.innerHTML="<label>Assign To</label>",h=Y("select",{className:"plan-editor-select"}),i.forEach(b=>{const x=Y("option",{textContent:b.name,attributes:{value:b.id,selected:b.id===c.assignedTo}});h.appendChild(x)}),L.appendChild(h),T.appendChild(L)}f.appendChild(g),f.appendChild(y),f.appendChild(T);const w=Y("div",{className:"plan-editor-footer"}),v=me({className:"day-plan-discard-btn",textContent:"Cancel",onClick:()=>p.remove()}),_=me({className:"day-plan-save-btn",textContent:d?"Update":"Add to List",onClick:()=>{const L=g.value.trim();if(!L)return alert("Please enter a task description");const b=[];i.forEach(M=>{L.includes(`@${M.name}`)&&!b.find(R=>R.id===M.id)&&b.push({id:M.id,name:M.name,status:"pending"})});const D={plan:{...c,task:L,status:A.value,assignedTo:h?h.value:c.assignedTo||t,tags:b.length>0?b:c.tags||[]},allUsers:i,targetId:t,selectableCollaborators:s,isAdmin:o,currentUserId:l.id};if(d){const M=Xe({...D,idx:Number.parseInt(d.getAttribute("data-index"))});d.replaceWith(M)}else{const M=Xe({...D,idx:r.querySelectorAll(".plan-block").length});r.appendChild(M)}p.remove()}});w.appendChild(v),w.appendChild(_),m.appendChild(u),m.appendChild(f),m.appendChild(w),p.appendChild(m),document.getElementById("modal-container").appendChild(p),g.focus(),Ni(g,i,k),k()}function Xe(a){const{plan:e={},idx:t=0,allUsers:n=[],targetId:i,defaultScope:s="personal",selectableCollaborators:o=[],isAdmin:r=!1,currentUserId:d="",isReference:l=!1}=a||{},c=String(e.task||""),p=e.assignedTo||i||d,m=e.startDate||"",u=e.endDate||"",f=String(e.planScope||e._planScope||s)==="annual"?"annual":"personal",g=l?e.userName?`${e.userName}'s Plan`:"Others Plan":f==="annual"?"Annual Plan":"Personal Plan",y=c.trim()?c.trim().length>120?`${c.trim().slice(0,120)}...`:c.trim():"New task",k=Y("div",{className:(l?"plan-block-ref":"plan-block")+(l?" is-reference-only":""),attributes:{"data-index":t}}),T=Y("div",{className:"dp-hidden-data",attributes:{style:"display:none;"}});T.innerHTML=`
        <textarea class="plan-task">${De(c)}</textarea>
        <select class="plan-status"><option value="${De(e.status||"")}" selected></option></select>
        <select class="plan-scope"><option value="${De(f)}" selected></option></select>
        <select class="plan-assignee"><option value="${De(p)}" selected></option></select>
        <input class="plan-start-date" value="${De(m)}">
        <input class="plan-end-date" value="${De(u)}">
        <input class="plan-root-id" value="${De(e.carryForwardRootId||"")}">
        <input class="plan-removed-flag" value="${e.isRemoved===!0?"1":"0"}">
    `,e.subPlans&&e.subPlans.forEach(w=>{const v=Y("input",{className:"sub-plan-input",attributes:{value:De(w)}});T.appendChild(v)}),e.tags&&e.tags.forEach(w=>{const v=Y("div",{className:"tag-chip",attributes:{"data-id":w.id,"data-name":w.name,"data-status":w.status||"pending"}});T.appendChild(v)}),k.appendChild(T);const S=Y("div",{className:"plan-block-header"}),A=Y("div",{className:"plan-block-title-group"});A.appendChild(Y("span",{className:"day-plan-index-badge",textContent:t+1})),A.appendChild(Y("span",{className:"plan-block-summary",textContent:y}));const h=Y("div",{className:"plan-block-actions"});if(h.appendChild(Y("span",{className:"day-plan-scope-pill",textContent:g})),l||(h.appendChild(me({className:"day-plan-edit-btn",attributes:{title:"Edit plan"},innerHTML:'<i class="fa-solid fa-pen-to-square"></i>',onClick:()=>Qe({date:m,targetId:i,scope:f,allUsers:n,selectableCollaborators:o,isAdmin:r,container:k.parentElement,existingBlock:k})})),t>0?h.appendChild(me({className:"day-plan-remove-btn",attributes:{title:"Remove task"},innerHTML:'<i class="fa-solid fa-trash-can"></i>',onClick:()=>window.app_markTaskRemoved(k)})):h.appendChild(me({className:"day-plan-remove-btn",attributes:{title:"Remove task"},innerHTML:'<i class="fa-solid fa-trash-can"></i>',onClick:()=>window.app_markTaskRemoved(k)}))),S.appendChild(A),S.appendChild(h),k.appendChild(S),e.tags&&e.tags.length>0){const w=Y("div",{className:"plan-block-body"});e.tags.forEach(v=>{const _=Y("span",{className:"day-plan-tag-pill",textContent:`@${v.name}`});w.appendChild(_)}),k.appendChild(w)}return k}function Qt(a){if(!a)return null;const e=a.querySelector(".plan-task")?.value||"",t=a.querySelector(".plan-status")?.value||"",n=a.querySelector(".plan-scope")?.value||"personal",i=a.querySelector(".plan-assignee")?.value||"",s=a.querySelector(".plan-start-date")?.value||"",o=a.querySelector(".plan-end-date")?.value||"",r=a.querySelector(".plan-root-id")?.value||"",d=a.querySelector(".plan-removed-flag")?.value==="1",l=Array.from(a.querySelectorAll(".sub-plan-input")).map(p=>p.value),c=Array.from(a.querySelectorAll(".tag-chip")).map(p=>({id:p.dataset.id,name:p.dataset.name,status:p.dataset.status}));return{task:e,status:t,planScope:n,assignedTo:i,startDate:s,endDate:o,subPlans:l,tags:c,carryForwardRootId:r,isRemoved:d}}async function Ka(a,e=null,t=null){const n=ae.getUser(),i=String(e??"").trim(),s=!i||i==="undefined"||i==="null"?n.id:i,o=await K.getAll("users"),r=n.role==="Administrator"||n.isAdmin,d=s!==n.id,l=t==="annual"?"annual":"personal";window.app_currentDayPlanTargetId=s,ce?.ensureCarryForwardForDate&&a<=ce.getTodayKey()&&await ce.ensureCarryForwardForDate(a,{userIds:[s]});const c=ce?.getTodayKey?ce.getTodayKey():"";if(ce?.cleanupOldCarryForwardTaggedTasks&&a===c){const x=`cleanup_old_tagged_v5_${s}_${a}`;let D=!0;try{D=localStorage.getItem(x)!=="1"}catch{D=!0}if(D)try{const M=await ce.cleanupOldCarryForwardTaggedTasks(s,a,{onlyToday:!0});(M?.removed||0)>0&&console.log(`Day plan cleanup removed ${M.removed} old tagged carry-forward task(s) for ${s} on ${a}.`);try{localStorage.setItem(x,"1")}catch{}}catch(M){console.warn("Failed to cleanup old tagged carry-forward tasks:",M)}}const[p,m,u]=await Promise.all([ce.getWorkPlan(s,a,{planScope:"personal"}),ce.getWorkPlan(s,a,{planScope:"annual"}),K.queryMany("work_plans",[{field:"date",operator:"==",value:a}])]),f=!!(p||m),g=o.find(x=>x.id===s),y=g?g.name:"Staff",k=o.filter(x=>x.id!==s),T=(x,D,M=null)=>x?Array.isArray(x.plans)&&x.plans.length>0?x.plans.map(R=>({...R,planScope:D,userName:M||x.userName,isReference:!!M})).filter(R=>R.isRemoved!==!0):[]:[],S=(u||[]).filter(x=>x.id!==ce.getWorkPlanId(a,s,"personal")&&x.id!==ce.getWorkPlanId(a,s,"annual")),A=[];S.forEach(x=>{A.push(...T(x,x.planScope,x.userName))});const h=[...T(p,"personal"),...T(m,"annual"),...A];h.length===0&&h.push({task:"",subPlans:[],tags:[],status:null,assignedTo:s,startDate:a,endDate:a,planScope:l});const w=Y("div",{id:"day-plan-modal",className:"day-plan-modal-overlay"}),v=Y("div",{className:"day-plan-content"});v.appendChild(Bi(a,d,y,f,s)),v.appendChild(Oi(a,s,p,m,h,o,l,k,r,n)),w.appendChild(v);const _=document.getElementById("modal-container");if(!_)return;const L=document.getElementById("day-plan-modal");L&&L.remove(),_.appendChild(w);const b=document.getElementById("day-plan-modal");if(b){const D=Array.from(document.querySelectorAll(".modal-overlay, .modal")).filter(M=>M!==b).reduce((M,R)=>{const I=Number.parseInt(window.getComputedStyle(R).zIndex,10);return Number.isFinite(I)?Math.max(M,I):M},1e3);b.style.zIndex=String(D+2)}}async function Va(a=null){const e=document.getElementById("day-plan-modal");if(!e)return;const t=a||"personal",n=t==="annual"?e.querySelector(".others-plans-container"):e.querySelector(".personal-plans-container"),i=e.querySelector(".day-plan-headline p")?.textContent?.match(/\d{4}-\d{2}-\d{2}/),s=i?i[0]:new Date().toISOString().split("T")[0],o=await K.getAll("users"),r=ae.getUser(),d=window.app_currentDayPlanTargetId||r.id,l=r.role==="Administrator"||r.isAdmin,c=o.filter(p=>p.id!==d);Qe({date:s,targetId:d,scope:t,allUsers:o,selectableCollaborators:c,isAdmin:l,container:n})}const Ri={openDayPlan:Ka,dayPlanRenderBlockV3:Xe,addPlanBlockUI:Va,openPlanEditor:Qe,app_extractBlockData:Qt};window.AppDayPlan=Ri;window.app_openDayPlan=Ka;window.app_dayPlanRenderBlockV3=Xe;window.app_addPlanBlockUI=Va;window.app_extractBlockData=Qt;window.app_markTaskRemoved=function(a){if(!a)return;const e=a.closest(".day-plan-form"),t=Qt(a),n=t?.carryForwardRootId||"";if(e&&n){let i=[];try{i=JSON.parse(e.dataset.removedTasks||"[]")}catch{i=[]}const s=t?.planScope==="annual"?"annual":"personal";i.find(o=>o&&o.rootId===n&&o.scope===s)||(i.push({rootId:n,scope:s}),e.dataset.removedTasks=JSON.stringify(i))}a.remove()};const ca={isWidgetMode:!1,syncInterval:null,init(){console.log("Widget Module Initialized"),new URLSearchParams(window.location.search).get("mode")==="widget"&&(this.isWidgetMode=!0),this.isWidgetMode&&this.enableWidgetMode()},toggle(){if(this.isWidgetMode)this.isWidgetMode=!1,window.opener||window.name==="CRWIWidget"?window.close():this.disableWidgetMode();else{const t=window.screen.width-320-20;window.open(window.location.origin+window.location.pathname+"?mode=widget#dashboard","CRWIWidget",`width=320,height=420,left=${t},top=40,menubar=no,toolbar=no,location=no,status=no,resizable=yes`)}},enableWidgetMode(){document.body.classList.add("widget-mode"),this.renderWidgetView(),this.startSync(),window.resizeTo&&window.resizeTo(320,420)},disableWidgetMode(){document.body.classList.remove("widget-mode");const a=document.getElementById("widget-view");a&&a.remove(),this.stopSync()},startSync(){this.syncInterval&&clearInterval(this.syncInterval),this.syncInterval=setInterval(()=>this.sync(),500)},stopSync(){this.syncInterval&&clearInterval(this.syncInterval)},sync(){if(!this.isWidgetMode)return;const a=document.getElementById("timer-display"),e=document.getElementById("timer-label"),t=document.querySelector(".check-in-widget .status-dot")||document.querySelector('.check-in-widget [style*="background: #10b981"]')||document.querySelector('.check-in-widget [style*="background: #94a3b8"]'),n=document.getElementById("attendance-btn"),i=document.getElementById("location-text"),s=document.getElementById("countdown-container"),o=document.getElementById("countdown-label"),r=document.getElementById("countdown-value"),d=document.getElementById("countdown-progress"),l=document.getElementById("overtime-container"),c=document.getElementById("overtime-value"),p=document.getElementById("widget-view");if(!p)return;const m=p.querySelector("#timer-display"),u=p.querySelector("#timer-label"),f=p.querySelector(".status-dot-indicator"),g=p.querySelector("#attendance-btn"),y=p.querySelector("#location-text"),k=p.querySelector("#countdown-container"),T=p.querySelector("#countdown-label"),S=p.querySelector("#countdown-value"),A=p.querySelector("#countdown-progress"),h=p.querySelector("#overtime-container"),w=p.querySelector("#overtime-value");a&&m&&(m.innerHTML=a.innerHTML,m.style.color=a.style.color),e&&u&&(u.innerHTML=e.innerHTML),t&&f&&(f.style.background=t.style.background||(t.classList.contains("online")?"#10b981":"#94a3b8")),s&&k&&(k.style.display=s.style.display,o&&T&&(T.innerHTML=o.innerHTML),r&&S&&(S.innerHTML=r.innerHTML),d&&A&&(A.style.width=d.style.width)),l&&h&&(h.style.display=l.style.display,c&&w&&(w.innerHTML=c.innerHTML)),n&&g&&(g.innerHTML=n.innerHTML,g.className=n.className,g.disabled=n.disabled),i&&y&&(y.innerHTML=i.innerHTML)},handleWidgetAction(){if(window.opener&&!window.opener.closed)try{if(window.opener.focus(),window.opener.location.hash!=="#dashboard"&&(window.opener.location.hash="#dashboard"),window.opener.app_handleAttendance){window.opener.app_handleAttendance();return}}catch(t){console.warn("Could not communicate with main window:",t)}console.log("Opener lost or closed. Reopening main app...");const a=window.location.origin+window.location.pathname+"#dashboard",e=window.open(a,"CRWIMainApp");if(e){e.focus();const t=document.getElementById("attendance-btn");if(t){const n=t.innerHTML;t.innerHTML='<i class="fa-solid fa-arrow-up-right-from-square"></i> Opening App...',setTimeout(()=>{t.innerHTML=n},3e3)}}else alert("Please allow popups or open the main application window manually.")},renderWidgetView(){let a=document.getElementById("widget-view");a||(a=document.createElement("div"),a.id="widget-view",document.body.appendChild(a));const e=window.AppAuth&&window.AppAuth.getUser()||{name:"User",role:"Staff",avatar:"https://via.placeholder.com/48"};a.innerHTML=`
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
        `}};typeof window<"u"&&(window.Widget=ca,ca.init());var Lt={buildId:"21d7b3a-1774439390999",commitSha:"21d7b3a15f98ab72a3254a81fd5df7513a579be3",builtAt:"2026-03-25T11:49:50.997Z"};let Et=null,ye=[],_e=null,$e=null,Ne=0,Ze=!1,We=null,Pt=!1,Ga=0,zt=null,mt=null,ft=null,jt=!1,Ke=null,Fe=null;const ht=Object.freeze(typeof Lt=="object"&&Lt?Lt:{buildId:"local",commitSha:"",builtAt:""}),Ui="/version.json",Fi=6e4,Yt="release_signal",pa="app_meta",Ja="app_last_seen_release_id",Z={active:!1,releaseId:"",buildId:"",commitSha:"",deployedAt:"",notes:"",source:"",popupDismissed:!1},Qa=18e4,Hi=6e5;window.app_annualYear=new Date().getFullYear();const qi=()=>{try{return localStorage.getItem(Ja)||""}catch{return""}},Xa=a=>{try{localStorage.setItem(Ja,String(a||""))}catch{}},Za=(a={},e="version")=>{const t=String(a.buildId||a.releaseId||a.commitSha||"").trim();return t?{releaseId:t,buildId:t,commitSha:String(a.commitSha||"").trim(),deployedAt:String(a.deployedAt||a.builtAt||"").trim(),notes:String(a.notes||"").trim(),source:String(e||a.source||"version").trim()}:null},it=()=>({active:!!Z.active,releaseId:Z.releaseId||"",buildId:Z.buildId||"",commitSha:Z.commitSha||"",deployedAt:Z.deployedAt||"",notes:Z.notes||"",source:Z.source||"",popupDismissed:!!Z.popupDismissed,currentBuildId:ht.buildId||"",currentCommitSha:ht.commitSha||"",currentBuiltAt:ht.builtAt||""});window.app_getReleaseUpdateState=()=>it();const et=()=>{const a=it(),e=document.querySelector(".dashboard-refresh-link");e&&(a.active?(e.classList.add("is-update-pending"),e.setAttribute("title","Update available. Click to refresh into the new version."),e.textContent="System update available"):(e.classList.remove("is-update-pending"),e.setAttribute("title","Check for System Update (Ctrl+Shift+R)"),e.textContent="Check for System Update"))};window.app_applyUpdateCtaState=et;const Xt=()=>{et(),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:update-state",{detail:it()}))},Zt=(a=!1)=>{const e=Z.releaseId;Z.active=!1,Z.releaseId="",Z.buildId="",Z.commitSha="",Z.deployedAt="",Z.notes="",Z.source="",Z.popupDismissed=!1,a&&e&&Xa(e),Xt()};window.app_dismissReleaseUpdatePrompt=()=>{Z.active&&(Z.releaseId&&Xa(Z.releaseId),Z.popupDismissed=!0,document.getElementById("system-update-modal")?.remove(),Xt())};const en=(a,e={})=>{const t=Za(a,a?.source||"version");if(!t)return!1;if(t.buildId===ht.buildId)return Zt(!1),!1;const n=e.forcePopup===!0,i=qi(),s=Z.active&&Z.releaseId===t.releaseId;return Z.active=!0,Z.releaseId=t.releaseId,Z.buildId=t.buildId,Z.commitSha=t.commitSha,Z.deployedAt=t.deployedAt,Z.notes=t.notes,Z.source=t.source,Z.popupDismissed=t.releaseId===i,s||window.app_showSyncToast("New version available."),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:update-available",{detail:it()})),Xt(),(n||!Z.popupDismissed)&&(Z.popupDismissed=!1,window.app_showSystemUpdatePopup()),!0},zi=async({manual:a=!1}={})=>{try{const e=await fetch(`${Ui}?t=${Date.now()}`,{cache:"no-store",headers:{"cache-control":"no-cache"}});if(!e.ok)throw new Error(`Version check failed with ${e.status}`);const t=await e.json();return Za(t,"version")}catch(e){return console.warn("Unable to fetch deployed version manifest:",e),a&&window.app_showSyncToast("Could not check for updates right now."),null}},tt=async(a={})=>{if(Fe)return Fe;Fe=(async()=>{const e=await zi({manual:a.manual===!0});return e?en(e,{forcePopup:a.forcePopup===!0}):!1})();try{return await Fe}finally{Fe=null}},tn=()=>{Ke||(Ke=setInterval(()=>{document.visibilityState==="visible"&&window.AppAuth?.getUser()&&tt()},Fi),tt())},ji=()=>{Ke&&(clearInterval(Ke),Ke=null)},Yi=()=>{document.visibilityState==="visible"&&window.AppAuth?.getUser()&&tt()},ua=()=>{window.AppAuth?.getUser()&&tt()},ma=a=>{!a||a.id!==Yt||a.active!==!1&&en({...a,source:"release-signal"},{forcePopup:!0})},an=()=>{if(!jt){if(jt=!0,window.AppDB&&typeof window.AppDB.listenDoc=="function"){mt=window.AppDB.listenDoc(pa,Yt,a=>{a&&ma(a)});return}ft=setInterval(async()=>{try{const a=await window.AppDB.get(pa,Yt);a&&ma(a)}catch{}},3e4)}},Wi=()=>{typeof mt=="function"&&(mt(),mt=null),ft&&(clearInterval(ft),ft=null),jt=!1};window.app_checkForSystemUpdate=async()=>{if(Z.active)return window.app_showSystemUpdatePopup(),!0;const a=await tt({manual:!0,forcePopup:!0});return a||window.app_showSyncToast("You are already using the latest version."),a};window.app_isAdminUser=(a=window.AppAuth?.getUser())=>a?a.isAdmin===!0:!1;window.app_canSeeAdminPanel=(a=window.AppAuth?.getUser())=>a?window.app_isAdminUser(a)?!0:a.permissions?Object.entries(a.permissions).some(([e,t])=>e!=="birthday"&&t==="admin"):!1:!1;window.app_hasPerm=(a,e="view",t=window.AppAuth?.getUser())=>{if(!t)return!1;if(t.isAdmin===!0)return!0;if(!t.permissions||!t.permissions[a])return!1;const n=t.permissions[a];return e==="view"?n==="view"||n==="admin":e==="admin"?n==="admin":!1};window.app_canManageAttendanceSheet=(a=window.AppAuth?.getUser())=>a?window.app_hasPerm("attendance","admin",a)||!!a.canManageAttendanceSheet:!1;window.app_canManageBirthdays=(a=window.AppAuth?.getUser())=>a?window.app_isAdminUser(a)||a.role==="Administrator"||!!a.canManageBirthdays||window.app_hasPerm("birthday","view",a):!1;window.app_canAdminBirthdays=(a=window.AppAuth?.getUser())=>a?window.app_isAdminUser(a)||a.role==="Administrator"||!!a.canManageBirthdays||window.app_hasPerm("birthday","admin",a):!1;window.app_getReadTelemetry=()=>!window.AppDB||!window.AppDB.getReadTelemetry?{}:window.AppDB.getReadTelemetry();window.app_resetReadTelemetry=()=>{!window.AppDB||!window.AppDB.clearReadTelemetry||window.AppDB.clearReadTelemetry()};window.app_getMyMessages=async()=>{const a=window.AppAuth.getUser();if(!a)return[];try{const[e,t]=await Promise.all([window.AppDB.query("staff_messages","toId","==",a.id),window.AppDB.query("staff_messages","fromId","==",a.id)]),n=new Map;return(e||[]).forEach(i=>n.set(i.id,i)),(t||[]).forEach(i=>n.set(i.id,i)),Array.from(n.values())}catch(e){return console.warn("Message fetch failed, falling back to getAll",e),window.AppDB.getAll("staff_messages")}};const te=document.getElementById("page-content"),lt=document.querySelector(".sidebar"),ct=document.querySelector(".mobile-header"),pt=document.querySelector(".mobile-nav");window.app_initTheme=()=>{const a=localStorage.getItem("theme")||"light";document.documentElement.setAttribute("data-theme",a),nn(a)};window.app_toggleTheme=()=>{const e=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",e),localStorage.setItem("theme",e),nn(e)};function nn(a){document.querySelectorAll(".theme-toggle i").forEach(e=>{a==="dark"?(e.classList.remove("fa-moon"),e.classList.add("fa-sun")):(e.classList.remove("fa-sun"),e.classList.add("fa-moon"))})}function Ki(){if(!("serviceWorker"in navigator))return;const a=async()=>{try{zt=await navigator.serviceWorker.register("/sw.js"),console.log("ServiceWorker registered")}catch(e){console.log("ServiceWorker registration failed: ",e)}};if(document.readyState==="complete"){a();return}window.addEventListener("load",()=>{a()},{once:!0})}const fa=(a=new Date)=>`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`;window.app_showAttendanceNotice=a=>{if(!a)return;const e=document.getElementById("page-content");if(!e)return;const t=document.getElementById("attendance-policy-notice");t&&t.remove();const n=document.createElement("div");n.id="attendance-policy-notice",n.style.background="#fff7ed",n.style.border="1px solid #fdba74",n.style.color="#9a3412",n.style.padding="0.85rem 1rem",n.style.borderRadius="10px",n.style.marginBottom="0.9rem",n.style.fontSize="0.9rem",n.style.fontWeight="600",n.innerHTML=`<i class="fa-solid fa-circle-info" style="margin-right:0.45rem;"></i>${a}`,e.prepend(n),setTimeout(()=>{const i=document.getElementById("attendance-policy-notice");i&&i.remove()},1e4)};window.app_promptMissedCheckoutReason=(a={})=>{const{logId:e,date:t}=a||{};if(!e||document.getElementById("missed-checkout-reason-modal"))return;const n=t?new Date(`${t}T00:00:00`).toLocaleDateString():"previous day",i=`
        <div class="modal-overlay" id="missed-checkout-reason-modal" style="display:flex;">
            <div class="modal-content" style="max-width:560px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:0.75rem;">
                    <div>
                        <h3 style="margin:0;">Missed Checkout</h3>
                        <p style="margin:0.35rem 0 0 0; font-size:0.85rem; color:#6b7280;">
                            Your session on ${z(n)} was auto-checked out and counted as a half day.
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
    `;(document.body||document.getElementById("modal-container")).insertAdjacentHTML("beforeend",i);const s=document.getElementById("missed-checkout-reason-modal");s?.addEventListener("click",o=>{o.target===s&&s.remove()})};window.app_submitMissedCheckoutReason=async(a,e)=>{a.preventDefault();const t=a.target,n=String(new FormData(t).get("reason")||"").trim();if(!n){alert("Please enter a reason.");return}try{const i=window.AppAuth.getUser();if(!i)throw new Error("User not authenticated");const s=await window.AppDB.get("attendance",e);if(!s)throw new Error("Attendance record not found.");const o=new Date().toISOString(),r={...s,missedCheckoutReason:n,missedCheckoutReasonSubmittedAt:o,missedCheckoutReasonStatus:"pending"};await window.AppDB.put("attendance",r);const d=await window.AppDB.get("users",i.id);d&&(d.notifications||(d.notifications=[]),d.notifications.unshift({id:`mcr_sub_${Date.now()}`,type:"missed-checkout-reason-submitted",title:"Missed checkout reason submitted",message:`Reason sent for ${s.date}. Awaiting admin verification.`,status:"submitted",date:o,read:!0}),await window.AppDB.put("users",d),window.AppAuth?.getUser&&Object.assign(window.AppAuth.getUser(),{notifications:d.notifications}));const l=(await window.AppDB.getAll("users")).filter(c=>c.isAdmin||c.role==="Administrator");await Promise.all(l.map(async c=>{c.notifications||(c.notifications=[]),c.notifications.unshift({id:`mcr_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"missed-checkout-reason",title:"Missed checkout reason submitted",message:`${i.name} submitted a reason for missed checkout on ${s.date}.`,description:n,staffId:i.id,staffName:i.name,missedCheckoutDate:s.date,logId:String(s.id||""),taggedById:i.id,taggedByName:i.name,taggedAt:o,status:"pending",date:o,read:!1}),await window.AppDB.put("users",c)})),document.getElementById("missed-checkout-reason-modal")?.remove(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell(),window.app_showSyncToast("Reason submitted for admin verification.")}catch(i){console.error("Missed checkout reason submit failed:",i),alert("Failed to submit reason: "+i.message)}};window.app_showSyncToast=(a="Status updated from another device.")=>{const e="app-sync-toast",t=document.getElementById(e);t&&t.remove();const n=document.createElement("div");n.id=e,n.style.position="fixed",n.style.top="14px",n.style.right="14px",n.style.zIndex="10020",n.style.background="#0f172a",n.style.color="#f8fafc",n.style.padding="0.7rem 0.9rem",n.style.borderRadius="10px",n.style.fontSize="0.82rem",n.style.fontWeight="600",n.style.boxShadow="0 8px 25px rgba(15, 23, 42, 0.3)",n.textContent=a,document.body.appendChild(n),setTimeout(()=>{const i=document.getElementById(e);i&&i.remove()},2800)};const Vi=Object.freeze({"team-activities":{title:"How To Use This Page",why:"This page helps you review what the team has been working on, track progress, and spot overdue or blocked work in one place.",how:"Use the filters to narrow by date, type, status, or staff member. Open the records to review details, compare activity across people, and move through pages when the list is long."},"staff-directory":{title:"How To Use This Page",why:"This page is for staff communication and quick follow-up. It keeps person-to-person messages and task discussions organized by staff member.",how:"Choose a staff member from the list, read the conversation history, then send a message or review assigned tasks. Return here whenever you need to continue a discussion with someone on the team."},policies:{title:"How To Use This Page",why:"This page explains attendance rules, holidays, working hours, and policy settings so everyone follows the same process.",how:"Read the sections before taking action on attendance, leave, or office timing questions. Admin users can update policy values here, while staff should use it as the main reference page."},"annual-plan":{title:"How To Use This Page",why:"This page gives a year-wide view of planned work so you can understand schedules, deadlines, and major activities across the calendar.",how:"Switch between views, filter by staff, search the list, and jump to important dates. Open a day when you want to inspect or plan work for that specific date."},"birthday-calendar":{title:"How To Use This Page",why:"This page keeps birthday records organized so the team can manage celebrations and maintain correct staff details.",how:"Review upcoming birthdays, add missing entries, or update existing records when details change. Use it as the central place for birthday-related staff information."},timesheet:{title:"How To Use This Page",why:"This page is for checking attendance history, work duration, and day-by-day time records.",how:"Use the available filters or date controls to inspect your logs, verify hours, and open details when something looks incorrect. It is the best page to review your past attendance entries."},profile:{title:"How To Use This Page",why:"This page shows your personal staff profile, attendance summary, and leave-related information in one place.",how:"Use it to review your details, check your current status, and look at summary numbers for attendance and leave. Admin users can also switch between staff profiles when needed."},minutes:{title:"How To Use This Page",why:"This page is for recording meeting discussions, decisions, action items, and approvals so nothing important is lost after a meeting.",how:"Create a meeting record, write the discussion summary, add action items with owners, and review approval or edit history. Use search to quickly find older meetings."},admin:{title:"How To Use This Page",why:"This page gives administrators control over reports, staff management, attendance monitoring, and approval workflows.",how:"Use the filters and admin tools to inspect records, approve requests, review trends, and take corrective actions. Changes here can affect multiple users, so review entries carefully before saving."},"master-sheet":{title:"How To Use This Page",why:"This page provides a sheet-style attendance view so you can inspect staff presence, absences, holidays, and exceptions across many dates at once.",how:"Scan rows and columns to compare attendance patterns quickly. Admin users can open cells for detailed review or corrections where needed."},salary:{title:"How To Use This Page",why:"This page supports salary preparation by combining attendance-based calculations and payroll-related values in one working area.",how:"Review staff rows carefully, check attendance-driven inputs, and update values before final processing. Use it when payroll needs to be prepared from attendance data."},"policy-test":{title:"How To Use This Page",why:"This page helps verify whether policy logic and rules are behaving as expected before relying on them in day-to-day use.",how:"Run the available checks, compare outcomes, and confirm that policy behavior matches the intended rules. It is mainly for validation and troubleshooting."}}),Gi=a=>{const e=Vi[a];if(!e)return"";const t=z(e.title||"How To Use This Page"),n=z(e.why||""),i=z(e.how||"");return`
        <section class="page-usage-note" id="page-usage-note" data-page-key="${z(a)}" aria-label="Page help note">
            <div class="page-usage-note-header">
                <i class="fa-solid fa-circle-info"></i>
                <h3>${t}</h3>
            </div>
            <p><strong>Why this page exists:</strong> ${n}</p>
            <p><strong>How to use it:</strong> ${i}</p>
        </section>
    `},Nt=()=>{const a=document.getElementById("page-content");if(!a)return;const e=String(window.location.hash||"").replace(/^#/,"")||"dashboard",t=a.querySelector("#page-usage-note");if(e==="dashboard"){t?.remove();return}const n=Gi(e);if(!n){t?.remove();return}t?.dataset.pageKey!==e&&(t?.remove(),a.insertAdjacentHTML("beforeend",n))},Ji=()=>{if(window.__appPageUsageNotesInitialized)return;window.__appPageUsageNotesInitialized=!0;const a=()=>{const e=document.getElementById("page-content");if(!e||e.__pageUsageObserverBound)return;new MutationObserver(()=>{if(e.dataset.applyingUsageNote!=="1"){e.dataset.applyingUsageNote="1";try{Nt()}finally{delete e.dataset.applyingUsageNote}}}).observe(e,{childList:!0}),e.__pageUsageObserverBound=!0,Nt()};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",a,{once:!0}):a(),window.addEventListener("hashchange",()=>{requestAnimationFrame(()=>{Nt()})})},ha=()=>!Ze&&Date.now()>Ga,Wt=()=>{Ga=Date.now()+3500},Qi=a=>{const e=a.detail;if(!e)return;window.app_refreshNotificationBell&&window.app_refreshNotificationBell().catch(()=>{});const t=e.status||"out",n=We!==null&&t!==We,i=We===null&&t==="in";if(We=t,!(n||i)||Pt)return;const s=!window.location.hash||window.location.hash==="#dashboard",o=document.getElementById("checkout-modal"),r=!!(o&&o.style.display==="flex");if(t==="out"&&r&&(o.style.display="none"),!s){ha()&&window.app_showSyncToast("Status updated from another device.");return}Pt=!0,(async()=>{try{const d=document.getElementById("page-content");d&&(d.innerHTML=await F.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),ha()&&window.app_showSyncToast("Status updated from another device.")}catch(d){console.warn("Realtime dashboard sync failed:",d)}finally{Pt=!1}})()};function Kt(a){const e=document.querySelector(".sidebar"),t=document.getElementById("sidebar-overlay");e&&t&&(a?(e.classList.add("open"),t.classList.add("active")):(e.classList.remove("open"),t.classList.remove("active")))}function Xi(){if(window.location.search){const a=window.location.protocol+"//"+window.location.host+window.location.pathname+window.location.hash;window.history.replaceState({path:a},"",a),console.log("Address bar cleaned of query parameters.")}}window.app_toggleSidebar=(a=null)=>{const e=document.querySelector(".sidebar"),t=document.querySelector("#desktop-sidebar-toggle i");if(!e)return;(a!==null?a:!e.classList.contains("collapsed"))?(e.classList.add("collapsed"),t&&(t.classList.remove("fa-angles-left"),t.classList.add("fa-angles-right"))):(e.classList.remove("collapsed"),t&&(t.classList.remove("fa-angles-right"),t.classList.add("fa-angles-left")))};window.app_showModal=(a,e)=>{const t=document.getElementById("modal-container");if(!t)return;const n=document.getElementById(e);n&&n.remove(),t.insertAdjacentHTML("beforeend",a);const i=document.getElementById(e);if(i&&(i.classList.contains("modal-overlay")||i.classList.contains("modal"))){const o=Array.from(document.querySelectorAll(".modal-overlay, .modal")).filter(r=>r!==i).reduce((r,d)=>{const l=Number.parseInt(window.getComputedStyle(d).zIndex,10);return Number.isFinite(l)?Math.max(r,l):r},1e3);i.style.zIndex=String(o+2)}};const z=a=>String(a??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),Zi=a=>z(a).replace(/\n/g,"<br>"),Vt=a=>String(a?.status||"pending").toLowerCase(),Ve=a=>a?.type==="birthday-reminder"?a?.read!==!0:Vt(a)==="pending",Bt=a=>a?.type==="birthday-reminder"?"Birthday":a?.type==="minute-access-request"?"Minutes":String(a?.type||"").includes("missed-checkout")?"Attendance":a?.type==="task"?"Task":a?.type==="tag"||a?.type==="mention"?"Tag":a?.type==="reminder"?"Reminder":"Notification",es=a=>a?a.type==="minute-access-request"||String(a.type||"").includes("missed-checkout")?!0:a.type==="tag"||a.type==="mention":!1,ya=a=>String(a?.description||a?.message||a?.title||"").trim(),ts=a=>{const e=a?.respondedAt||a?.taggedAt||a?.date,t=new Date(e).getTime();if(!t)return"Unknown time";const n=Math.max(0,Math.floor((Date.now()-t)/6e4)),i=n<1?"just now":n<60?`${n} mins ago`:n<1440?`${Math.floor(n/60)} hrs ago`:`${Math.floor(n/1440)} days ago`;return`${new Date(t).toLocaleString()} (${i})`};window.app_refreshNotificationBell=async()=>{const a=document.querySelectorAll(".top-notification-btn");if(!a.length)return;const e=window.AppAuth.getUser(),n=(Array.isArray(e?.notifications)?e.notifications:[]).filter(Ve).length;a.forEach(i=>{const s=i.querySelector(".top-notification-badge");if(!e){i.classList.remove("has-pending"),s&&(s.style.display="none");return}i.classList.toggle("has-pending",n>0),i.setAttribute("title",n>0?`${n} pending notification${n>1?"s":""}`:"Notification history"),s&&(n>0?(s.textContent=n>99?"99+":String(n),s.style.display=""):s.style.display="none")})};window.app_closeNotificationHistory=()=>{const a=document.getElementById("notification-history-modal"),e=document.getElementById("notif-drawer-backdrop");a&&a.classList.remove("notif-drawer-open"),e&&e.classList.remove("notif-drawer-backdrop-visible"),setTimeout(()=>document.getElementById("notif-drawer-root")?.remove(),320)};window.app_respondNotificationFromHistory=async(a,e,t)=>{const n=window.AppAuth.getUser();if(!n)return;const i=t==="approve"?"approve":"reject",s=await window.AppDB.get("users",n.id);if(!s||!Array.isArray(s.notifications)){alert("Notification not found.");return}let o=null,r=-1;if(Number.isInteger(a)&&a>=0&&s.notifications[a]&&(o=s.notifications[a],r=a),!o&&e&&(r=s.notifications.findIndex(d=>String(d.id)===String(e)),r>=0&&(o=s.notifications[r])),!o){alert("This notification is no longer available.");return}if(!Ve(o)){alert("This notification has already been responded."),await window.app_refreshNotificationBell();return}window.app_closeNotificationHistory();try{if(o.type==="minute-access-request"&&window.app_hasPerm("minutes","admin",n)){await window.app_reviewMinuteAccessFromNotification(r,o.id,i==="approve"?"approved":"rejected");return}if(o.type==="missed-checkout-reason"&&(n.isAdmin||n.role==="Administrator")){await window.app_reviewMissedCheckoutReasonFromNotification(r,o.id,i==="approve"?"approved":"rejected");return}const d=Number(o.taskIndex);if(o.planId&&Number.isInteger(d)&&d>=0){await window.app_handleTagResponse(o.planId,d,i==="approve"?"accepted":"rejected",r);return}if(o.id){await window.app_handleTagDecision(o.id,i==="approve"?"accepted":"rejected");return}alert("This notification cannot be approved or rejected from history.")}catch(d){console.error("Notification response error:",d),alert("Failed to process notification: "+d.message)}};window.app_openNotificationHistory=async()=>{const a=window.AppAuth.getUser();if(!a)return;const e=await window.AppDB.get("users",a.id).catch(()=>a),t=Array.isArray(e?.notifications)?e.notifications:[],n=Array.isArray(e?.tagHistory)?e.tagHistory:[],i=a.isAdmin||a.role==="Administrator",s=[...t.map((v,_)=>({...v,_source:"live",_index:_})),...n.map(v=>({...v,_source:"history",_index:-1}))],o=v=>new Date(v.respondedAt||v.taggedAt||v.date||0).getTime()||0,r=v=>String(v||"").trim().toLowerCase(),l=['<option value="all">All Sources</option>',...Array.from(new Set(s.map(v=>Bt(v)))).filter(Boolean).sort((v,_)=>v.localeCompare(_)).map(v=>`<option value="${z(v.toLowerCase())}">${z(v)}</option>`)].join(""),c={search:"",status:"all",source:"all",sort:"newest"},p=v=>{const _=Vt(v),L=_==="pending"&&v._source==="live",b=Bt(v),x=v.taggedByName||"System",D=v.title||`${b} from ${x}`,M=ya(v),R=JSON.stringify(String(v.id||"")),I={pending:{bg:"#fff7ed",border:"#fdba74",badge:"#f97316"},accepted:{bg:"#f0fdf4",border:"#86efac",badge:"#16a34a"},rejected:{bg:"#fef2f2",border:"#fca5a5",badge:"#dc2626"},default:{bg:"#f8fafc",border:"#e2e8f0",badge:"#6b7280"}},N=I[_]||I.default,P=L&&es(v)||i&&v.type==="minute-access-request"?`
            <div class="notif-drawer-actions">
                <button type="button" class="notif-drawer-btn approve" onclick="window.app_respondNotificationFromHistory(${Number(v._index)}, ${R}, 'approve')">
                    <i class="fa-solid fa-check"></i> Approve
                </button>
                <button type="button" class="notif-drawer-btn reject" onclick="window.app_respondNotificationFromHistory(${Number(v._index)}, ${R}, 'reject')">
                    <i class="fa-solid fa-xmark"></i> Reject
                </button>
            </div>`:"";return`
            <div class="notif-drawer-item ${L?"is-pending":""}" style="border-color:${N.border}; background:${N.bg};" data-notif-id="${z(String(v.id||""))}">
                <div class="notif-drawer-item-head">
                    <div class="notif-drawer-item-left">
                        <div class="notif-drawer-source-icon">
                            <i class="fa-solid ${v.type==="tag"||v.type==="mention"?"fa-at":v.type==="birthday-reminder"?"fa-cake-candles":v.type==="task"?"fa-list-check":v.type==="minute-access-request"?"fa-file-lines":String(v.type||"").includes("missed-checkout")?"fa-user-clock":"fa-bell"}"></i>
                        </div>
                        <div>
                            <div class="notif-drawer-title">${z(D)}</div>
                            <div class="notif-drawer-meta">${z(b)} • ${z(x)} • ${z(ts(v))}</div>
                        </div>
                    </div>
                    <div class="notif-drawer-item-right">
                        <span class="notif-drawer-badge" style="background:${N.badge}">${z(_)}</span>
                    </div>
                </div>
                ${M?`<div class="notif-drawer-text">${z(M)}</div>`:""}
                ${P}
            </div>`},m=()=>{const v=s.filter(_=>{const L=Vt(_),b=Bt(_),x=_.taggedByName||"System",D=_.title||`${b} from ${x}`,M=ya(_),R=`${D} ${M} ${b} ${x} ${L}`;return!(c.status!=="all"&&L!==c.status||c.source!=="all"&&r(b)!==c.source||c.search&&!r(R).includes(c.search))});return c.sort==="oldest"?v.sort((_,L)=>o(_)-o(L)):c.sort==="pending"?v.sort((_,L)=>{const b=Ve(_)?1:0,x=Ve(L)?1:0;return b!==x?x-b:o(L)-o(_)}):v.sort((_,L)=>o(L)-o(_)),v},u=t.filter(Ve).length,f=`
        <div class="notif-drawer-backdrop" id="notif-drawer-backdrop" onclick="window.app_closeNotificationHistory()"></div>
        <div class="notif-drawer" id="notification-history-modal">
            <div class="notif-drawer-header">
                <div class="notif-drawer-header-left">
                    <i class="fa-solid fa-bell notif-drawer-header-icon"></i>
                    <div>
                        <div class="notif-drawer-header-title">Notifications</div>
                        <div class="notif-drawer-header-sub">${u>0?`${u} pending action${u>1?"s":""}`:"All caught up"}</div>
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
        </div>`,g=document.createElement("div");g.id="notif-drawer-root",g.innerHTML=f,document.body.appendChild(g),requestAnimationFrame(()=>{const v=document.getElementById("notification-history-modal");v&&v.classList.add("notif-drawer-open");const _=document.getElementById("notif-drawer-backdrop");_&&_.classList.add("notif-drawer-backdrop-visible")});const y=document.getElementById("notif-drawer-list"),k=document.getElementById("notif-drawer-results"),T=document.getElementById("notif-drawer-search"),S=document.getElementById("notif-drawer-source"),A=document.getElementById("notif-drawer-sort"),h=document.getElementById("notif-drawer-status-tabs"),w=()=>{if(!y)return;const v=m();y.innerHTML=v.length?v.map(p).join(""):'<div class="notif-drawer-empty"><i class="fa-regular fa-bell-slash"></i><p>No notifications match your search/filter.</p></div>',k&&(k.textContent=`Showing ${v.length} of ${s.length}`)};T?.addEventListener("input",v=>{c.search=r(v.target.value),w()}),S?.addEventListener("change",v=>{c.source=r(v.target.value)||"all",w()}),A?.addEventListener("change",v=>{c.sort=r(v.target.value)||"newest",w()}),h?.addEventListener("click",v=>{const _=v.target.closest("[data-notif-status]");_&&(c.status=r(_.getAttribute("data-notif-status"))||"all",h.querySelectorAll(".notif-drawer-status-tab").forEach(L=>L.classList.remove("is-active")),_.classList.add("is-active"),w())}),w(),await window.app_refreshNotificationBell()};window.app_openBirthdayEditor=async a=>{const e=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(e)){alert("You do not have permission to manage birthdays.");return}const t=await window.AppDB.get("users",a);if(!t){alert("Staff member not found.");return}const n=`
        <div class="modal-overlay" id="birthday-details-modal" style="display:flex;">
            <div class="modal-content" style="max-width:560px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1rem;">
                    <div>
                        <div style="font-size:0.78rem; font-weight:800; color:#9a3412; text-transform:uppercase; letter-spacing:0.08em;">Birthday Details</div>
                        <h3 style="margin:0.35rem 0 0.2rem 0;">${z(t.name||"Staff")}</h3>
                        <div style="font-size:0.84rem; color:#64748b;">${z(t.role||"Employee")} • ${z(t.dept||"General")}</div>
                    </div>
                    <button type="button" onclick="document.getElementById('birthday-details-modal')?.remove()" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">&times;</button>
                </div>
                <form id="birthday-details-form">
                    <input type="hidden" name="userId" value="${z(t.id)}">
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem;">
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Day</span>
                            <input type="number" name="birthDay" min="1" max="31" placeholder="DD" value="${z(t.birthDay||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Month</span>
                            <input type="number" name="birthMonth" min="1" max="12" placeholder="MM" value="${z(t.birthMonth||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Year</span>
                            <input type="number" name="birthYear" min="1900" max="2100" placeholder="YYYY" value="${z(t.birthYear||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                    </div>
                    <div style="margin-top:0.65rem; font-size:0.8rem; color:#64748b;">Save one field, two fields, or all three. Reminders need day and month.</div>
                    <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.2rem;">
                        <button type="button" class="action-btn secondary" onclick="document.getElementById('birthday-details-modal')?.remove()">Cancel</button>
                        <button type="submit" class="action-btn">Save Birthday</button>
                    </div>
                </form>
            </div>
        </div>`;window.app_showModal(n,"birthday-details-modal")};window.app_submitBirthdayDetails=async a=>{a.preventDefault();const e=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(e)){alert("You do not have permission to manage birthdays.");return}const t=new FormData(a.target),n=String(t.get("userId")||"").trim();if(!n){alert("Missing staff record.");return}try{const i=Re(t),s=await window.AppDB.get("users",n);if(!s)throw new Error("Staff member not found.");if(!await window.AppAuth.updateUser({id:n,birthDay:i.birthDay,birthMonth:i.birthMonth,birthYear:i.birthYear}))throw new Error("Unable to save birthday details.");if(document.getElementById("birthday-details-modal")?.remove(),window.app_showSyncToast(`Birthday details saved for ${s.name||"staff member"}.`),(window.location.hash.slice(1)||"dashboard")==="birthday-calendar"){const r=document.getElementById("page-content");r&&(r.innerHTML=await F.renderBirthdayCalendar())}else window.app_refreshAdminPage&&await window.app_refreshAdminPage()}catch(i){alert(`Failed to save birthday details: ${i.message}`)}};window.app_submitBirthdayMonthForm=async(a,e)=>{a.preventDefault();const t=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(t)){alert("You do not have permission to manage birthdays.");return}const n=Number(e||0);if(!n||n<1||n>12){alert("Invalid birthday month.");return}const i=new FormData(a.target),s=String(i.get("userId")||"").trim();if(!s){alert("Please select a staff member.");return}try{const o=Re(i),r=await window.AppDB.get("users",s);if(!r)throw new Error("Staff member not found.");const d={id:s,birthMonth:n,birthDay:o.birthDay,birthYear:o.birthYear};if(!await window.AppAuth.updateUser(d))throw new Error("Unable to save birthday details.");a.target.reset();const c=document.getElementById("page-content");c&&(c.innerHTML=await F.renderBirthdayCalendar()),window.app_showSyncToast(`Birthday updated for ${r.name||"staff member"}.`)}catch(o){alert(`Failed to save birthday details: ${o.message}`)}};window.app_syncBirthdayReminders=async()=>{const a=window.AppAuth?.getUser?.();if(!window.app_canManageBirthdays(a))return;const e=st();e.setHours(0,0,0,0);const t=we(e),n=`birthday_sync_${String(a?.id||"unknown")}`;if(window._birthdaySyncDoneForKey===n&&window._birthdaySyncDayKey===t)return;try{if(localStorage.getItem(n)===t){window._birthdaySyncDoneForKey=n,window._birthdaySyncDayKey=t;return}}catch{}const i=await window.AppDB.getAll("users").catch(()=>[]);if(!Array.isArray(i)||!i.length)return;const s=i.filter(r=>window.app_canManageBirthdays(r));if(!s.length)return;let o=Array.isArray(a?.notifications)?[...a.notifications]:[];for(const r of i){const d=dn(r,e);if(!d)continue;const l=ln(d),c=we(l);if(c!==t)continue;const p=we(d),m=cn(d,l),u=`Upcoming Staff Birthday: ${r.name||"Staff"}`,f=`${r.name||"Staff"} has a birthday on ${wt(r.birthDay,r.birthMonth)}.`;for(const g of s){const y=Array.isArray(g.notifications)?[...g.notifications]:[];y.some(T=>T?.type==="birthday-reminder"&&String(T.birthdayStaffId||"")===String(r.id||"")&&String(T.birthdayDate||"")===p&&String(T.reminderDate||"")===c)||(y.unshift({id:`birthday_${p}_${r.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"birthday-reminder",title:u,message:f,description:`${m}. ${r.role||"Employee"} • ${r.dept||"General"}`,status:"pending",date:new Date().toISOString(),read:!1,taggedByName:"Birthday Calendar",birthdayStaffId:r.id,birthdayStaffName:r.name||"Staff",birthdayDate:p,reminderDate:c,birthdayDisplay:wt(r.birthDay,r.birthMonth,r.birthYear),birthdayReason:m,role:r.role||"",dept:r.dept||""}),await window.AppDB.put("users",{...g,notifications:y}),a&&String(a.id)===String(g.id)&&(o=y))}}a&&Array.isArray(o)&&(a.notifications=o),window._birthdaySyncDoneForKey=n,window._birthdaySyncDayKey=t;try{localStorage.setItem(n,t)}catch{}};window.app_dismissBirthdayPopup=async({openCalendar:a=!1}={})=>{const e=window.AppAuth?.getUser?.();if(!e)return;const t=await window.AppDB.get("users",e.id).catch(()=>e);if(!t||!Array.isArray(t.notifications))return;let n=!1;t.notifications=t.notifications.map(i=>i?.type==="birthday-reminder"&&i?.read!==!0?(n=!0,{...i,read:!0,status:"seen",dismissedAt:new Date().toISOString()}):i),n&&await window.AppAuth.updateUser(t),document.getElementById("birthday-reminder-modal")?.remove(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell(),a&&(window.location.hash="birthday-calendar")};window.app_maybeOpenBirthdayPopup=async()=>{const a=window.AppAuth?.getUser?.();if(!window.app_canManageBirthdays(a)||document.getElementById("birthday-reminder-modal"))return;const e=await window.AppDB.get("users",a.id).catch(()=>a),t=Array.isArray(e?.notifications)?e.notifications.filter(s=>s?.type==="birthday-reminder"&&s?.read!==!0):[];if(!t.length)return;const i=`
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
                    ${t.map(s=>`
        <div style="border:1px solid #fed7aa; background:linear-gradient(135deg, #fff7ed, #fffbeb); border-radius:16px; padding:1rem;">
            <div style="display:flex; justify-content:space-between; gap:0.75rem; align-items:flex-start;">
                <div>
                    <div style="font-size:0.78rem; font-weight:800; color:#9a3412; text-transform:uppercase; letter-spacing:0.08em;">Upcoming Staff Birthday</div>
                    <h4 style="margin:0.35rem 0 0.2rem 0; color:#7c2d12;">${z(s.birthdayStaffName||"Staff")}</h4>
                    <div style="font-size:0.84rem; color:#9a3412;">${z(s.birthdayDisplay||s.birthdayDate||"")}</div>
                    <div style="font-size:0.8rem; color:#7c2d12; margin-top:0.35rem;">${z(s.birthdayReason||"Upcoming birthday")}</div>
                    <div style="font-size:0.8rem; color:#92400e; margin-top:0.25rem;">${z(s.role||"Employee")} • ${z(s.dept||"General")}</div>
                </div>
                <button type="button" class="action-btn secondary" style="padding:0.45rem 0.7rem;" onclick="window.app_openBirthdayEditor('${z(s.birthdayStaffId||"")}')">Edit Birthday Details</button>
            </div>
        </div>
    `).join("")}
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.75rem; padding:1rem 1.4rem 1.3rem; border-top:1px solid #e5e7eb; background:#fff;">
                    <button type="button" class="action-btn secondary" onclick="window.app_dismissBirthdayPopup()">Dismiss</button>
                    <button type="button" class="action-btn" onclick="window.app_dismissBirthdayPopup({ openCalendar: true })">View Birthday Calendar</button>
                </div>
            </div>
        </div>`;window.app_showModal(i,"birthday-reminder-modal")};window.app_openBirthdayEditor=async(a,e)=>{const t=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(t)){alert("You do not have permission to manage birthdays.");return}const n=e?a:"user",i=e||a,s=$t(n),o=await window.AppDB.get(s.collection,i);if(!o){alert(s.emptyMessage);return}const r=ls(o,s.source),d=s.source==="external"?`
                    <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.75rem; margin-bottom:0.75rem;">
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Name</span>
                            <input type="text" name="name" value="${z(o.name||"")}" placeholder="Full name" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Position</span>
                            <input type="text" name="position" value="${z(o.position||"")}" placeholder="President / Trustee / etc." style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                    </div>
                    <label style="display:block; margin-bottom:0.75rem;">
                        <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Location</span>
                        <input type="text" name="location" value="${z(o.location||"")}" placeholder="City / Office / Campus" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                    </label>
    `:"",l=`
        <div class="modal-overlay" id="birthday-details-modal" style="display:flex;">
            <div class="modal-content" style="max-width:560px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1rem;">
                    <div>
                        <div style="font-size:0.78rem; font-weight:800; color:#9a3412; text-transform:uppercase; letter-spacing:0.08em;">Birthday Details</div>
                        <h3 style="margin:0.35rem 0 0.2rem 0;">${z(r.title)}</h3>
                        <div style="font-size:0.84rem; color:#64748b;">${z(r.subtitle)}</div>
                    </div>
                    <button type="button" onclick="document.getElementById('birthday-details-modal')?.remove()" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">&times;</button>
                </div>
                <form id="birthday-details-form">
                    <input type="hidden" name="birthdaySource" value="${z(s.source)}">
                    <input type="hidden" name="recordId" value="${z(o.id)}">
                    ${d}
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem;">
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Day</span>
                            <input type="number" name="birthDay" min="1" max="31" placeholder="DD" value="${z(o.birthDay||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Month</span>
                            <input type="number" name="birthMonth" min="1" max="12" placeholder="MM" value="${z(o.birthMonth||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                        <label>
                            <span style="display:block; font-size:0.78rem; color:#64748b; margin-bottom:0.25rem;">Year</span>
                            <input type="number" name="birthYear" min="1900" max="2100" placeholder="YYYY" value="${z(o.birthYear||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
                        </label>
                    </div>
                    <div style="margin-top:0.65rem; font-size:0.8rem; color:#64748b;">Save one field, two fields, or all three. Reminders need day and month.</div>
                    <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.2rem;">
                        <button type="button" class="action-btn secondary" onclick="document.getElementById('birthday-details-modal')?.remove()">Cancel</button>
                        <button type="submit" class="action-btn">Save Birthday</button>
                    </div>
                </form>
            </div>
        </div>`;window.app_showModal(l,"birthday-details-modal")};window.app_submitBirthdayDetails=async a=>{a.preventDefault();const e=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(e)){alert("You do not have permission to manage birthdays.");return}const t=new FormData(a.target),n=String(t.get("birthdaySource")||"user").trim().toLowerCase(),i=String(t.get("recordId")||"").trim(),s=$t(n);if(!i){alert(`Missing ${s.label.toLowerCase()} record.`);return}try{const o=Re(t),r=await window.AppDB.get(s.collection,i);if(!r)throw new Error(s.emptyMessage);if(s.source==="external"){const d=String(t.get("name")||"").trim();if(!d)throw new Error("Name is required.");await window.AppDB.put(s.collection,{...r,name:d,position:String(t.get("position")||"").trim(),location:String(t.get("location")||"").trim(),birthDay:o.birthDay,birthMonth:o.birthMonth,birthYear:o.birthYear,updatedAt:new Date().toISOString(),updatedById:e?.id||""})}else if(!await window.AppAuth.updateUser({id:i,birthDay:o.birthDay,birthMonth:o.birthMonth,birthYear:o.birthYear}))throw new Error("Unable to save birthday details.");if(document.getElementById("birthday-details-modal")?.remove(),window.app_showSyncToast(`Birthday details saved for ${r.name||s.label.toLowerCase()}.`),(window.location.hash.slice(1)||"dashboard")==="birthday-calendar"){const d=document.getElementById("page-content");d&&(d.innerHTML=await F.renderBirthdayCalendar())}else window.app_refreshAdminPage&&await window.app_refreshAdminPage()}catch(o){alert(`Failed to save birthday details: ${o.message}`)}};window.app_openExternalBirthdayPersonModal=async(a="")=>{const e=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(e)){alert("You do not have permission to manage birthdays.");return}const t=`
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
                            <input type="number" name="birthMonth" min="1" max="12" placeholder="MM" value="${z(a||"")}" style="width:100%; padding:0.65rem; border:1px solid #ddd; border-radius:8px;">
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
        </div>`;window.app_showModal(t,"birthday-external-modal")};window.app_submitExternalBirthdayPerson=async a=>{a.preventDefault();const e=window.AppAuth?.getUser?.();if(!window.app_canAdminBirthdays(e)){alert("You do not have permission to manage birthdays.");return}const t=new FormData(a.target),n=String(t.get("name")||"").trim();if(!n){alert("Please enter a name.");return}try{const i=Re(t),s={id:`birthday_person_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,name:n,position:String(t.get("position")||"").trim(),location:String(t.get("location")||"").trim(),birthDay:i.birthDay,birthMonth:i.birthMonth,birthYear:i.birthYear,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),createdById:e?.id||"",updatedById:e?.id||""};await window.AppDB.put("birthday_people",s),document.getElementById("birthday-external-modal")?.remove();const o=document.getElementById("page-content");o&&(window.location.hash.slice(1)||"dashboard")==="birthday-calendar"&&(o.innerHTML=await F.renderBirthdayCalendar()),window.app_showSyncToast(`Birthday person saved for ${n}.`)}catch(i){alert(`Failed to save birthday person: ${i.message}`)}};window.app_refreshBirthdayCalendar=async()=>{if((window.location.hash.slice(1)||"dashboard")!=="birthday-calendar")return;const a=document.getElementById("page-content");a&&(a.innerHTML=await F.renderBirthdayCalendar())};window.app_setBirthdayCalendarView=async a=>{const e=window.app_birthdayCalendarState||{};window.app_birthdayCalendarState={...e,view:String(a||"month").toLowerCase()==="year"?"year":"month"},await window.app_refreshBirthdayCalendar()};window.app_goToBirthdayCalendarMonth=async(a,e=null)=>{const t=Number(a||0);if(!t||t<1||t>12)return;const n=st(),i=window.app_birthdayCalendarState||{};window.app_birthdayCalendarState={...i,selectedMonth:t,selectedYear:Number(e||i.selectedYear||n.getFullYear()),view:"month"},await window.app_refreshBirthdayCalendar()};window.app_changeBirthdayCalendarMonth=async a=>{const e=Number(a||0);if(!e)return;const t=st(),n=window.app_birthdayCalendarState||{},i=Number(n.selectedMonth||t.getMonth()+1),s=Number(n.selectedYear||t.getFullYear()),o=new Date(s,i-1+e,1);window.app_birthdayCalendarState={...n,selectedMonth:o.getMonth()+1,selectedYear:o.getFullYear(),view:"month"},await window.app_refreshBirthdayCalendar()};window.app_syncBirthdayReminders=async()=>{const a=window.AppAuth?.getUser?.();if(!window.app_canManageBirthdays(a))return;const[e,t]=await Promise.all([window.AppDB.getAll("users").catch(()=>[]),window.AppDB.getAll("birthday_people",{silentPermissionDenied:!0}).catch(()=>[])]),n=[...Array.isArray(e)?e.map(d=>({...d,birthdaySource:"user"})):[],...Array.isArray(t)?t.map(d=>({...d,birthdaySource:"external"})):[]];if(!n.length)return;const i=st();i.setHours(0,0,0,0);const s=we(i),o=e.filter(d=>window.app_canManageBirthdays(d));if(!o.length)return;let r=Array.isArray(a?.notifications)?[...a.notifications]:[];for(const d of n){const l=dn(d,i);if(!l)continue;const c=ln(l),p=we(c);if(p!==s)continue;const m=we(l);for(const u of o){const f=Array.isArray(u.notifications)?[...u.notifications]:[];f.some(y=>y?.type==="birthday-reminder"&&String(y.birthdayStaffId||"")===String(d.id||"")&&String(y.birthdaySource||"user")===String(d.birthdaySource||"user")&&String(y.birthdayDate||"")===m&&String(y.reminderDate||"")===p)||(f.unshift(cs(d,d.birthdaySource||"user",l,c)),await window.AppDB.put("users",{...u,notifications:f}),a&&String(a.id)===String(u.id)&&(r=f))}}a&&Array.isArray(r)&&(a.notifications=r)};window.app_maybeOpenBirthdayPopup=async()=>{const a=window.AppAuth?.getUser?.();if(!window.app_canManageBirthdays(a)||document.getElementById("birthday-reminder-modal"))return;const e=await window.AppDB.get("users",a.id).catch(()=>a),t=Array.isArray(e?.notifications)?e.notifications.filter(s=>s?.type==="birthday-reminder"&&s?.read!==!0):[];if(!t.length)return;const i=`
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
                    ${t.map(s=>`
        <div style="border:1px solid #fed7aa; background:linear-gradient(135deg, #fff7ed, #fffbeb); border-radius:16px; padding:1rem;">
            <div style="display:flex; justify-content:space-between; gap:0.75rem; align-items:flex-start;">
                <div>
                    <div style="font-size:0.78rem; font-weight:800; color:#9a3412; text-transform:uppercase; letter-spacing:0.08em;">Upcoming Birthday</div>
                    <h4 style="margin:0.35rem 0 0.2rem 0; color:#7c2d12;">${z(s.birthdayStaffName||"Staff")}</h4>
                    <div style="font-size:0.84rem; color:#9a3412;">${z(s.birthdayDisplay||s.birthdayDate||"")}</div>
                    <div style="font-size:0.8rem; color:#7c2d12; margin-top:0.35rem;">${z(s.birthdayReason||"Upcoming birthday")}</div>
                    <div style="font-size:0.8rem; color:#92400e; margin-top:0.25rem;">${z(s.role||"Employee")} • ${z(s.dept||"General")}</div>
                </div>
                <button type="button" class="action-btn secondary" style="padding:0.45rem 0.7rem;" onclick="window.app_openBirthdayEditor('${z(s.birthdaySource||"user")}', '${z(s.birthdayStaffId||"")}')">Edit Birthday Details</button>
            </div>
        </div>
    `).join("")}
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.75rem; padding:1rem 1.4rem 1.3rem; border-top:1px solid #e5e7eb; background:#fff;">
                    <button type="button" class="action-btn secondary" onclick="window.app_dismissBirthdayPopup()">Dismiss</button>
                    <button type="button" class="action-btn" onclick="window.app_dismissBirthdayPopup({ openCalendar: true })">View Birthday Calendar</button>
                </div>
            </div>
        </div>`;window.app_showModal(i,"birthday-reminder-modal")};window.app_systemDialog=function({title:a="Notice",message:e="",mode:t="alert",defaultValue:n="",confirmText:i="OK",cancelText:s="Cancel",placeholder:o=""}={}){return new Promise(r=>{const d=`system-dialog-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,l=`${d}-input`,c=t==="prompt",p=t==="confirm"||t==="prompt",m=`
                <div class="modal-overlay app-system-dialog-overlay" id="${d}" style="display:flex;">
                    <div class="modal-content app-system-dialog">
                        <div class="app-system-dialog-head">
                            <h3>${z(a)}</h3>
                            <button type="button" class="app-system-dialog-close" aria-label="Close dialog">&times;</button>
                        </div>
                        <div class="app-system-dialog-body">
                            <p>${Zi(e)}</p>
                            ${c?`<input id="${l}" class="app-system-dialog-input" type="text" value="${z(n)}" placeholder="${z(o)}" autocomplete="off">`:""}
                        </div>
                        <div class="app-system-dialog-actions">
                            ${p?`<button type="button" class="action-btn secondary app-system-dialog-cancel">${z(s)}</button>`:""}
                            <button type="button" class="action-btn app-system-dialog-confirm">${z(i)}</button>
                        </div>
                    </div>
                </div>
            `;(document.body||document.getElementById("modal-container")).insertAdjacentHTML("beforeend",m);const u=document.getElementById(d);if(!u){r(c?null:!1);return}u.style.zIndex="20000";const f=u.querySelector(".app-system-dialog-confirm"),g=u.querySelector(".app-system-dialog-cancel"),y=u.querySelector(".app-system-dialog-close"),k=c?u.querySelector(`#${l}`):null,T=S=>{u.remove(),r(S)};f?.addEventListener("click",()=>{T(c?k?k.value:"":!0)}),g?.addEventListener("click",()=>T(c?null:!1)),y?.addEventListener("click",()=>T(c?null:!1)),u.addEventListener("click",S=>{S.target===u&&T(c?null:!1)}),u.addEventListener("keydown",S=>{S.key==="Escape"&&T(c?null:!1),S.key==="Enter"&&(S.preventDefault(),T(c?k?k.value:"":!0))}),k?(k.focus(),k.select()):f?.focus()})};window.appAlert=(a,e="Notice")=>window.app_systemDialog({title:e,message:a,mode:"alert",confirmText:"OK"});window.appConfirm=(a,e="Please Confirm")=>window.app_systemDialog({title:e,message:a,mode:"confirm",confirmText:"Confirm",cancelText:"Cancel"});window.appPrompt=(a,e="",t={})=>window.app_systemDialog({title:t.title||"Enter Details",message:a,mode:"prompt",defaultValue:e,confirmText:t.confirmText||"Save",cancelText:t.cancelText||"Cancel",placeholder:t.placeholder||""});window.alert=a=>{window.appAlert(a)};window.app_openEventModal=()=>{window.app_showModal(`
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
        `,"event-modal")};window.app_submitEvent=async a=>{a.preventDefault();const e=document.getElementById("event-title").value,t=document.getElementById("event-date").value,n=document.getElementById("event-type").value;try{await window.AppCalendar.addEvent({title:e,date:t,type:n}),alert("Event added successfully!"),document.getElementById("event-modal")?.remove();const i=document.getElementById("page-content");i.innerHTML=await F.renderDashboard(),Me()}catch(i){alert("Error: "+i.message)}};const ga="work_plan_schema_v2_migrated",as=async()=>{try{if(!window.AppDB||typeof window.AppDB.getAll!="function"||typeof window.AppDB.put!="function"||localStorage.getItem(ga)==="true")return;const a=await window.AppDB.getAll("work_plans");let e=0;for(const t of a){if(!t||Array.isArray(t.plans))continue;const n=typeof t.plan=="string"?t.plan.trim():"";if(!n)continue;const i={...t,plans:[{task:n,subPlans:Array.isArray(t.subPlans)?t.subPlans:[],tags:Array.isArray(t.tags)?t.tags:[],status:t.status||null,completedDate:t.completedDate||null,startDate:t.startDate||t.date,endDate:t.endDate||t.startDate||t.date}]};delete i.plan,delete i.subPlans,delete i.tags,delete i.status,delete i.completedDate,delete i.startDate,delete i.endDate,await window.AppDB.put("work_plans",i),e+=1}localStorage.setItem(ga,"true"),e>0&&console.log(`Work plan schema migration complete. Updated: ${e}`)}catch(a){console.warn("Work plan schema migration failed:",a)}};async function ns(){window.app_initTheme(),Ji(),Xi(),window.addEventListener("app:user-sync",Qi),window.addEventListener("app:update-available",et),window.addEventListener("app:update-state",et),document.addEventListener("visibilitychange",Yi),window.addEventListener("focus",ua),window.addEventListener("online",ua);try{await window.AppAuth.init();const e=window.AppAuth.getUser();e&&(We=e.status||"out",an(),tn()),Ki(),await as(),window.AppActivity&&window.AppActivity.initCommandListener()}catch(e){console.error("Initialization Failed:",e),te&&(te.innerHTML=`<div style="text-align:center; padding:2rem; color:red;">Failed to load application.<br><small>${e.message}</small></div>`)}document.addEventListener("click",e=>{e.target.id==="sidebar-toggle"||e.target.closest("#sidebar-toggle")?Kt(!0):e.target.id==="sidebar-overlay"&&Kt(!1)}),window.addEventListener("hashchange",wa),wa();const a=window.AppAuth.getUser();a&&window.AppTour&&window.AppTour.init(a)}async function wa(){const a=window.AppAuth.getUser(),e=window.location.hash.slice(1)||"dashboard";if(e!=="admin"&&ye&&ye.length>0&&(console.log("Cleaning up Admin Realtime Listener."),ye.forEach(l=>typeof l=="function"&&l()),ye=[]),e!=="minutes"&&typeof _e=="function"&&(console.log("Cleaning up Minutes Realtime Listener."),_e(),_e=null),!a){Wi(),ji(),Zt(!1),lt&&(lt.style.display="none"),ct&&(ct.style.display="none"),pt&&(pt.style.display="none"),document.body.style.background="#f3f4f6",te&&(te.innerHTML=F.renderLogin()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell();return}an(),tn(),Kt(!1),lt&&(lt.style.display=""),ct&&(ct.style.display=""),pt&&(pt.style.display="");const t=document.querySelector(".sidebar-footer .user-mini-profile");t&&(t.innerHTML=`
                <img src="${a.avatar||"https://ui-avatars.com/api/?name=User"}" alt="User">
                <div>
                    <p class="user-name">${a.name||"Staff Member"}</p>
                </div>
                <i class="fa-solid fa-gear user-settings-icon"></i>
            `);const n=window.app_hasPerm("attendance","view",a),i=window.app_hasPerm("reports","view",a),s=window.app_hasPerm("policies","view",a),o=window.app_canSeeAdminPanel(a),r=window.app_canManageBirthdays(a);document.querySelectorAll('a[data-page="admin"]').forEach(l=>{l.style.display=o?"flex":"none",o||l.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="master-sheet"]').forEach(l=>{l.style.display=n?"flex":"none",n||l.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="salary"]').forEach(l=>{l.style.display=i?"flex":"none",i||l.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="policy-test"]').forEach(l=>{l.style.display=s?"flex":"none",s||l.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="birthday-calendar"]').forEach(l=>{l.style.display=r?"flex":"none",r||l.style.setProperty("display","none","important")}),document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(l=>{l.dataset.page===e?l.classList.add("active"):l.classList.remove("active")});try{const l=document.getElementById("modal-container");if(l&&!document.getElementById("checkout-modal")&&l.insertAdjacentHTML("beforeend",F.renderModals()),te&&(te.innerHTML='<div class="loading-spinner"></div>'),e==="dashboard")te.innerHTML=await F.renderDashboard(),Me();else if(e==="team-activities")te.innerHTML=await F.renderTeamActivitiesPage(),window.app_initTeamActivities&&await window.app_initTeamActivities();else if(e==="staff-directory")te.innerHTML=await F.renderStaffDirectoryPage();else if(e==="policies")window.AppPolicies&&typeof window.AppPolicies.render=="function"?te.innerHTML=await window.AppPolicies.render():te.innerHTML='<div style="padding:1rem; color:#b91c1c;">Policies module failed to load.</div>';else if(e==="annual-plan")te.innerHTML=await F.renderAnnualPlan();else if(e==="birthday-calendar"){if(!window.app_canManageBirthdays(a)){window.location.hash="dashboard";return}te.innerHTML=await F.renderBirthdayCalendar()}else if(e==="timesheet")te.innerHTML=await F.renderTimesheet();else if(e==="profile")te.innerHTML=await F.renderProfile();else if(e==="salary"){if(!window.app_hasPerm("reports","view",a)){window.location.hash="dashboard";return}te.innerHTML=await F.renderSalaryProcessing?await F.renderSalaryProcessing():await F.renderSalary()}else if(e==="policy-test"){if(!window.app_hasPerm("policies","view",a)){window.location.hash="dashboard";return}te.innerHTML=await F.renderPolicyTest()}else if(e==="master-sheet"){if(!(window.app_hasPerm("attendance","view",a)||window.app_canManageAttendanceSheet(a))){window.location.hash="dashboard";return}te.innerHTML=await F.renderMasterSheet()}else if(e==="minutes")te.innerHTML=await F.renderMinutes(),ss();else if(e==="admin"){if(!window.app_canSeeAdminPanel(a)){window.location.hash="dashboard";return}te.innerHTML=await F.renderAdmin(),window.AppAnalytics.initAdminCharts(),is()}await window.app_syncBirthdayReminders?.(),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell(),await window.app_maybeOpenBirthdayPopup?.()}catch(l){console.error("Render Error:",l),te.innerHTML=`<div style="text-align:center; color:red; padding:2rem;">Error loading page: ${l.message}</div>`}}function is(){ye.forEach(i=>typeof i=="function"&&i()),ye=[],console.log("Starting Admin Realtime Listeners (Users & Audits)...");let a=null;const e=()=>{a&&clearTimeout(a),a=setTimeout(async()=>{a=null,await t()},600)},t=async()=>{if(window.location.hash.slice(1)!=="admin")return;if(document.querySelector('.modal-overlay[style*="display: flex"], .modal[style*="display: flex"]'))console.log("Admin Update received but skipped because a modal is open.");else{console.log("Admin Data Update Received (Realtime) - Refreshing UI");const o=document.getElementById("page-content");if(o){const r=document.getElementById("audit-start")?.value,d=document.getElementById("audit-end")?.value;o.innerHTML=await F.renderAdmin(r,d),window.AppAnalytics&&window.AppAnalytics.initAdminCharts()}}};if((C&&C.READ_OPT_FLAGS||{}).FF_READ_OPT_TARGETED_REALTIME&&window.AppDB.listenQuery){ye.push(window.AppDB.listenQuery("users",[{field:"status",operator:"in",value:["in","out"]}],{limit:300},e));const i=new Date;i.setDate(i.getDate()-2),ye.push(window.AppDB.listenQuery("location_audits",[{field:"timestamp",operator:">=",value:i.getTime()}],{orderBy:[{field:"timestamp",direction:"desc"}],limit:300},e))}else ye.push(window.AppDB.listen("users",e)),ye.push(window.AppDB.listen("location_audits",e))}function ss(){if(!window.AppDB||!window.AppDB.listen)return;typeof _e=="function"&&(_e(),_e=null);const a=async()=>{if((window.location.hash.slice(1)||"dashboard")!=="minutes"||document.getElementById("minute-detail-modal"))return;const n=document.getElementById("page-content");n&&(n.innerHTML=await F.renderMinutes())};(C&&C.READ_OPT_FLAGS||{}).FF_READ_OPT_TARGETED_REALTIME&&window.AppDB.listenQuery?_e=window.AppDB.listenQuery("minutes",[],{orderBy:[{field:"date",direction:"desc"}],limit:150},a):_e=window.AppDB.listen("minutes",a)}function os(a=null,e=!1){Et&&clearInterval(Et),(async()=>{let n="out",i=null;if(a)n=a.status||"out",i=a.lastCheckIn||null;else{const m=await window.AppAttendance.getStatus();n=m.status,i=m.lastCheckIn}const s=document.getElementById("timer-display"),o=document.getElementById("countdown-container"),r=document.getElementById("overtime-container"),d=document.getElementById("countdown-value"),l=document.getElementById("countdown-progress"),c=document.getElementById("overtime-value"),p=document.getElementById("timer-label");if(n==="in"&&i){const m=new Date(i),u=new Date,f=`${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,"0")}-${String(m.getDate()).padStart(2,"0")}`,g=`${u.getFullYear()}-${String(u.getMonth()+1).padStart(2,"0")}-${String(u.getDate()).padStart(2,"0")}`,y=f!==g,k=new Date(m);k.setHours(17,0,0,0);const T=m.getDay();T===6&&k.setHours(13,0,0,0),T===0&&k.setHours(17,0,0,0),Et=setInterval(()=>{const S=Date.now(),A=S-i;if(s){let w=Math.floor(A/36e5),v=Math.floor(A/(1e3*60)%60),_=Math.floor(A/1e3%60);w=w<10?"0"+w:w,v=v<10?"0"+v:v,_=_<10?"0"+_:_,s.textContent=`${w} : ${v} : ${_}`}if(y){o&&(o.style.display="none"),r&&(r.style.display="none"),s&&(s.style.color="#b45309"),p&&(p.textContent="Session Carryover (Please Check Out)",p.style.color="#b45309");return}const h=k.getTime()-S;if(h>0){o&&(o.style.display="block"),r&&(r.style.display="none"),p&&(p.textContent="Elapsed Time",p.style.color="#6b7280"),s&&(s.style.color="#1f2937");let w=Math.floor(h/(1e3*60*60)%24),v=Math.floor(h/(1e3*60)%60),_=Math.floor(h/1e3%60);w=w<10?"0"+w:w,v=v<10?"0"+v:v,_=_<10?"0"+_:_;const L=k.getTime()-i,b=L>0?Math.min(100,A/L*100):100;d&&(d.textContent=`${w}:${v}:${_}`),l&&(l.style.width=`${b}%`),l&&(l.style.background="var(--primary)")}else{o&&(o.style.display="none"),r&&(r.style.display="block");const w=Math.abs(S-k.getTime());let v=Math.floor(w/(1e3*60*60)),_=Math.floor(w/(1e3*60)%60),L=Math.floor(w/1e3%60);v=v<10?"0"+v:v,_=_<10?"0"+_:_,L=L<10?"0"+L:L,c&&(c.textContent=`+ ${v}:${_}:${L}`),s&&(s.style.color="#c2410c"),p&&(p.textContent="Total Elapsed (Overtime)",p.style.color="#c2410c")}},1e3),!e&&window.AppActivity&&window.AppActivity.start&&window.AppActivity.start()}else s&&(s.textContent="00 : 00 : 00",s.style.color=""),p&&(p.textContent="Elapsed Time",p.style.color=""),o&&(o.style.display="none"),r&&(r.style.display="none")})()}window.getLocation=function(){return new Promise((e,t)=>{(async()=>{const n=window.location&&window.location.hostname?window.location.hostname:"",i=n==="localhost"||n==="127.0.0.1"||n==="::1";if(!window.isSecureContext&&!i){t("Location requires HTTPS on mobile. Open this app using an HTTPS URL and allow location access.");return}const s=Date.now();if($e&&s-Ne<Qa){console.log("Using cached location (freshness: "+(s-Ne)+"ms)"),e($e);return}if(!navigator.geolocation){t("Geolocation is not supported by your browser.");return}try{if(navigator.permissions&&navigator.permissions.query){const r=await navigator.permissions.query({name:"geolocation"});if(r&&r.state==="denied"){t("Location permission is blocked. Enable location for this site in browser settings and try again.");return}}}catch{}const o=r=>new Promise((d,l)=>{navigator.geolocation.getCurrentPosition(d,l,r)});try{console.log("Requesting Location: Quick/Low Accuracy...");const r=await o({enableHighAccuracy:!1,timeout:5e3,maximumAge:12e4}),d={lat:r.coords.latitude,lng:r.coords.longitude};$e=d,Ne=Date.now(),e(d);return}catch(r){console.warn("Quick location attempt failed:",r.message)}try{console.log("Requesting Location: High Accuracy (GPS fallback)...");const r=await o({enableHighAccuracy:!0,timeout:8e3,maximumAge:1e4}),d={lat:r.coords.latitude,lng:r.coords.longitude};$e=d,Ne=Date.now(),e(d);return}catch(r){console.warn("High accuracy fallback failed:",r.message)}if($e&&Date.now()-Ne<Hi){console.warn("Using stale cached location fallback."),e($e);return}t("Location request timed out. Move to open sky or better network and try again.")})().catch(n=>{t(n&&n.message?n.message:"Unable to retrieve location.")})})};const pe=a=>/^\d{4}-\d{2}-\d{2}$/.test(String(a||"")),rs={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11},ds=(a="")=>{const e=String(a||"").trim();if(!e)return null;const t=e.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);if(!t)return null;const n=Number(t[1]),i=Number(t[2]),s=String(t[3]||"").toLowerCase(),o=Number(t[4]),r=rs[s];if(!Number.isInteger(n)||!Number.isInteger(i)||!Number.isInteger(r)||!Number.isInteger(o))return null;const d=new Date(o,r,n),l=new Date(o,r,i);if(Number.isNaN(d.getTime())||Number.isNaN(l.getTime()))return null;const c=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,p=`${l.getFullYear()}-${String(l.getMonth()+1).padStart(2,"0")}-${String(l.getDate()).padStart(2,"0")}`;return p<c?null:{startDate:c,endDate:p}},sn=(a,e,t=null)=>{const n=pe(e)?String(e):null,i=a?.startDate,s=a?.endDate,o=!pe(i)&&!pe(s)?ds(a?.task||""):null;let r=pe(i)?String(i):o?.startDate||n,d=pe(s)?String(s):o?.endDate||r||n;if((!pe(i)||!pe(s))&&a?.sourcePlanId&&t?.workPlans){const l=(t.workPlans||[]).find(m=>m.id===a.sourcePlanId),c=Number.isInteger(a.sourceTaskIndex)?a.sourceTaskIndex:Number(a.sourceTaskIndex),p=l&&Array.isArray(l.plans)&&Number.isInteger(c)?l.plans[c]:null;if(p){const m=pe(p.startDate)?p.startDate:l.date||r,u=pe(p.endDate)?p.endDate:p.startDate||l.date||d;pe(i)||(r=m),pe(s)||(d=u)}}return r&&d&&d<r?{startDate:r,endDate:r}:{startDate:r,endDate:d}},on=(a,e,t,n=null)=>{const{startDate:i,endDate:s}=sn(a,e,n);return!i||!s?e===t:!(t<i||t>s||a?.completedDate&&a.completedDate<t)};window.app_getDayEvents=(a,e,t={})=>{const n=t.includeAuto!==!1,i=t.dedupe!==!1,s=t.userId||null;if(!e)return[];if(Array.isArray(e))return e.filter(l=>l.date===a);const o=new Date(a),r=[];if(n&&window.AppAnalytics){const l=window.AppAnalytics.getDayType(o);l==="Holiday"?r.push({title:"Company Holiday (Weekend)",type:"holiday",date:a}):l==="Half Day"&&r.push({title:"Half Working Day (Sat)",type:"event",date:a})}if((e.leaves||[]).forEach(l=>{a>=l.startDate&&a<=l.endDate&&r.push({title:`${l.userName||"Staff"} (Leave)`,type:"leave",userId:l.userId,date:a})}),(e.events||[]).forEach(l=>{l.date===a&&r.push({title:l.title,type:l.type||"event",date:a})}),(e.workPlans||[]).forEach(l=>{if(l.date>a)return;const p=(Array.isArray(l.plans)?l.plans:[]).filter(g=>on(g,l.date,a,e));if(!p.length)return;const f=`${(l.planScope||"personal")==="annual"?"All Staff (Annual)":l.userName||"Staff"}: ${p.map(g=>g.task).join("; ")}`;r.push({title:f,type:"work",userId:l.userId,plans:p,date:a,planScope:l.planScope||"personal"})}),s){const l=[];r.forEach(c=>{if(c.type!=="work"){l.push(c);return}if((c.planScope||"").toLowerCase()==="annual"){l.push(c);return}if(c.userId===s){l.push(c);return}if(Array.isArray(c.plans)&&c.plans.some(m=>Array.isArray(m.tags)&&m.tags.some(u=>u.id===s&&u.status==="accepted"))){l.push(c);return}}),r.length=0,r.push(...l)}if(!i)return r;const d=new Set;return r.filter(l=>{const c=l.type||"event";if(c!=="holiday"&&c!=="event")return!0;const p=`${c}|${l.title||""}|${l.userId||""}|${l.date||a}`;return d.has(p)?!1:(d.add(p),!0)})};const ea=(a,e)=>{const t=String(a??"").trim();return!t||t==="undefined"||t==="null"?e:t},X=a=>String(a??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),ue=a=>String(a??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'"),Dt=a=>{const e=String(a||"").trim();if(!e)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);return Number.isNaN(t.getTime())?"":`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`},xt=(a,e)=>{const t=Dt(a);if(!t)return"NA";const n=t.replace(/-/g,""),i=String(e||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase().slice(-3)||"USR";return`EMP-${n}-${i}`},Ot=(a,e,t)=>{const n=String(a??"").trim();if(!n)return null;if(!/^\d+$/.test(n))throw new Error("Birthday fields must be numeric.");const i=Number(n);if(!Number.isInteger(i)||i<e||i>t)throw new Error(`Birthday value must be between ${e} and ${t}.`);return i},rn=(a,e)=>new Date(a,e,0).getDate(),Re=a=>{const e=new Date().getFullYear()+1,t=Ot(a.get("birthDay"),1,31),n=Ot(a.get("birthMonth"),1,12),i=Ot(a.get("birthYear"),1900,e);if(t&&n){const o=rn(i||2024,n);if(t>o)throw new Error(`Birthday day is not valid for month ${n}.`)}return{birthDay:t,birthMonth:n,birthYear:i}},wt=(a,e,t=null)=>{const n=Number(a||0),i=Number(e||0),s=Number(t||0),o=i>=1&&i<=12?new Date(2026,i-1,1).toLocaleString("en-US",{month:"long"}):"--",r=n?String(n).padStart(2,"0"):"--",d=s?` ${s}`:"";return`${r} ${o}${d}`.trim()},$t=(a="user")=>(String(a||"user").trim().toLowerCase()==="external"?"external":"user")==="external"?{source:"external",collection:"birthday_people",label:"Birthday Person",emptyMessage:"Birthday person not found.",roleLabel:"Position",deptLabel:"Location"}:{source:"user",collection:"users",label:"Staff",emptyMessage:"Staff member not found.",roleLabel:"Role",deptLabel:"Department"},ls=(a,e="user")=>$t(e).source==="external"?{title:a?.name||"Birthday Person",subtitle:`${a?.position||"Position not set"} • ${a?.location||"Location not set"}`}:{title:a?.name||"Staff",subtitle:`${a?.role||"Employee"} • ${a?.dept||"General"}`},cs=(a,e,t,n)=>{const i=$t(e),s=we(t),o=we(n),r=cn(t,n),d=i.source==="external",l=d?a?.position||"":a?.role||"",c=d?a?.location||"":a?.dept||"",p=d?"Birthday Person":"Staff";return{id:`birthday_${i.source}_${s}_${a.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"birthday-reminder",title:`Upcoming Birthday: ${a.name||p}`,message:`${a.name||p} has a birthday on ${wt(a.birthDay,a.birthMonth)}.`,description:`${r}. ${l||(d?"Position not set":"Employee")} • ${c||(d?"Location not set":"General")}`,status:"pending",date:new Date().toISOString(),read:!1,taggedByName:"Birthday Calendar",birthdayStaffId:a.id,birthdayStaffName:a.name||p,birthdaySource:i.source,birthdayDate:s,reminderDate:o,birthdayDisplay:wt(a.birthDay,a.birthMonth,a.birthYear),birthdayReason:r,role:l,dept:c}},st=()=>window.AppDB&&typeof window.AppDB.getIstNow=="function"?window.AppDB.getIstNow():new Date,we=a=>{const e=a instanceof Date?new Date(a):new Date(a);return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`},dn=(a,e=st())=>{const t=Number(a?.birthDay||0),n=Number(a?.birthMonth||0);if(!t||!n)return null;const i=new Date(e),s=d=>{const l=rn(d,n),c=Math.min(t,l);return new Date(d,n-1,c)};let o=s(i.getFullYear());o.setHours(0,0,0,0);const r=we(i);return we(o)<r&&(o=s(i.getFullYear()+1),o.setHours(0,0,0,0)),o},ps=a=>window.AppAnalytics?.getDayType?.(a)!=="Holiday",ln=a=>{const e=new Date(a);for(e.setHours(0,0,0,0),e.setDate(e.getDate()-1);!ps(e);)e.setDate(e.getDate()-1);return e},cn=(a,e)=>Math.round((a.getTime()-e.getTime())/864e5)<=1?"Birthday is tomorrow":"Birthday is on the next working day",He=(a,e="NA")=>{if(a==null||a==="")return e;const t=a instanceof Date?a:new Date(a);return Number.isNaN(t.getTime())?e:t.toLocaleDateString("en-GB")},us=(a,e="NA")=>{if(a==null||a==="")return e;const t=a instanceof Date?a:new Date(a);return Number.isNaN(t.getTime())?e:t.toLocaleString("en-GB")},ms=a=>`Rs ${Number(a||0).toLocaleString("en-IN")}`,fs=(a="")=>{const e=String(a||"").replace(/\s+/g," ").trim();return e?e.length>72?`${e.slice(0,72)}...`:e:"New task"},ta=()=>`
        <div class="no-tags-placeholder day-plan-no-tags-placeholder">
            <p class="day-plan-no-tags-text">No collaborators yet</p>
        </div>
    `,pn=(a,e,t="pending")=>`
        <div class="tag-chip day-plan-tag-chip" data-id="${X(a)}" data-name="${X(e)}" data-status="${X(t)}">
            <span class="day-plan-tag-main">@${X(e)} <span class="day-plan-tag-pending">(${X(t)})</span></span>
            <i class="fa-solid fa-times day-plan-remove-collab-btn" onclick="window.app_removeTagHint(this)"></i>
        </div>
    `;window.app_refreshPlanBlockSummary=a=>{if(!a)return;const e=a.querySelector(".plan-task"),t=a.querySelector(".day-plan-task-summary"),n=a.querySelector(".plan-scope"),i=a.querySelector(".day-plan-scope-pill"),s=fs(e?e.value:"");t&&(t.textContent=s),i&&n&&(i.textContent=n.value==="annual"?"Annual Plan":"Personal Plan")};window.app_togglePlanBlockCollapse=a=>{const e=a.closest(".plan-block");if(!e)return;e.classList.toggle("is-collapsed");const t=e.classList.contains("is-collapsed"),n=a.querySelector("i");n&&(n.classList.toggle("fa-chevron-down",!t),n.classList.toggle("fa-chevron-up",t));const i=a.querySelector(".day-plan-collapse-label");i&&(i.textContent=t?"Expand":"Minimize"),window.app_refreshPlanBlockSummary(e)};window.app_toggleTaskCollaborator=(a,e,t)=>{const n=a.closest(".plan-block");if(!n)return;const i=n.querySelector(".tags-container");if(!i)return;const s=typeof CSS<"u"&&CSS.escape?CSS.escape(e):e.replace(/"/g,'\\"'),o=i.querySelector(`[data-id="${s}"]`);if(o)o.remove(),a.classList.remove("selected");else{const r=i.querySelector(".no-tags-placeholder");r&&r.remove(),i.insertAdjacentHTML("beforeend",pn(e,t,"pending")),a.classList.add("selected")}i.querySelectorAll(".tag-chip").length===0&&(i.innerHTML=ta())};window.app_getAnnualDayStaffPlans=a=>{const e=window._currentPlans||{},t=window._annualUserMap||{},i=(e.workPlans||[]).filter(r=>r.date<=a).map(r=>{const d=t[r.userId]||r.userName||"Staff",l=new Map,c=f=>String(f||"").toLowerCase().replace(/\d{1,2}\s*-\s*\d{1,2}\s+[a-z]+\s+\d{4}/g," ").replace(/\([^)]*\)/g," ").replace(/[^a-z\s]/g," ").split(/\s+/).filter(Boolean).slice(0,8).join(" "),p=(f,g="")=>{const y=String(f).trim();if(!y)return;const k=c(y)||y.toLowerCase().replace(/\s+/g," "),T=`${y}${g||""}`;if(!l.has(k)){l.set(k,T);return}(l.get(k)||"")===y&&T!==y&&l.set(k,T)},m=(Array.isArray(r.plans)?r.plans:[]).filter(f=>on(f,r.date,a,e)).map(f=>{const{startDate:g,endDate:y}=sn(f,r.date,e),k=!!(g&&y&&g!==y),T=y===a,S=g===a,h=f.completedDate&&f.completedDate<y&&f.completedDate===a?" (Completed Early)":k&&T?" (Ends Today)":k&&S?" (Starts Today)":"";return p(f.task||"Planned task",h),""}).filter(Boolean),u=Array.from(l.values());return!u.length&&m.length?{name:d,tasks:m}:u.length?{name:d,tasks:u}:null}).filter(Boolean),s=r=>String(r||"").toLowerCase().replace(/\d{1,2}\s*-\s*\d{1,2}\s+[a-z]+\s+\d{4}/g," ").replace(/\([^)]*\)/g," ").replace(/[^a-z\s]/g," ").split(/\s+/).filter(Boolean).slice(0,8).join(" "),o=new Map;return i.forEach(r=>{const d=r.name||"Staff";o.has(d)||o.set(d,new Map);const l=o.get(d);(r.tasks||[]).forEach(c=>{const p=s(c)||String(c||"").toLowerCase();if(!l.has(p))l.set(p,c);else{const m=l.get(p)||"",u=String(c||"");m.length<u.length&&l.set(p,u)}})}),Array.from(o.entries()).map(([r,d])=>({name:r,tasks:Array.from(d.values())}))};window.app_showAnnualHoverPreview=(a,e)=>{const t="annual-hover-preview";document.getElementById(t)?.remove();const n=window.app_getAnnualDayStaffPlans(e),i=n.length?n.map(o=>`
                <div style="margin-bottom:0.45rem;">
                    <div style="font-size:0.76rem; font-weight:700; color:#334155;">${o.name}</div>
                    <div style="font-size:0.72rem; color:#64748b;">${o.tasks.slice(0,2).join(" | ")}${o.tasks.length>2?` (+${o.tasks.length-2} more)`:""}</div>
                </div>
            `).join(""):'<div style="font-size:0.74rem; color:#94a3b8;">No staff plans for this date</div>',s=`
            <div id="${t}" style="position:fixed; z-index:12000; left:${Math.min((a.clientX||0)+12,window.innerWidth-290)}px; top:${Math.min((a.clientY||0)+12,window.innerHeight-220)}px; width:280px; background:#fff; border:1px solid #dbeafe; border-radius:12px; box-shadow:0 12px 26px rgba(15,23,42,0.18); padding:0.65rem;">
                <div style="font-size:0.76rem; font-weight:800; color:#1e3a8a; margin-bottom:0.5rem;">${e} Plans</div>
                ${i}
            </div>`;(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",s)};window.app_hideAnnualHoverPreview=()=>{document.getElementById("annual-hover-preview")?.remove()};window.app_openAnnualDayPlan=async a=>{window.app_hideAnnualHoverPreview();const e=`annual-day-click-${Date.now()}`,t=window.app_getAnnualDayStaffPlans(a),n=t.length?t.map(s=>`
                <div style="border:1px solid #e2e8f0; border-radius:10px; padding:0.55rem; margin-bottom:0.45rem;">
                    <div style="font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:0.25rem;">${s.name}</div>
                    <div style="font-size:0.76rem; color:#64748b;">${s.tasks.join(" | ")}</div>
                </div>
            `).join(""):'<div style="font-size:0.8rem; color:#94a3b8;">No plans yet for this date.</div>',i=`
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
            </div>`;window.app_showModal(i,e)};window.app_addPlanBlockUI=async()=>{const a=document.getElementById("plans-container");if(!a)return;const e=await window.AppDB.getAll("users"),t=window.AppAuth.getUser(),n=t.role==="Administrator"||t.isAdmin,i=ea(window.app_currentDayPlanTargetId,t.id),s=a.dataset.defaultScope==="annual"?"annual":"personal",r=e.filter(f=>f.id!==i).map(f=>`
            <button
                type="button"
                class="day-plan-collab-option"
                data-id="${X(f.id)}"
                onclick="window.app_toggleTaskCollaborator(this, '${ue(f.id)}', '${ue(f.name)}')"
                title="Add or remove ${X(f.name)}"
            >${X(f.name)}</button>
        `).join(""),d=document.createElement("div");d.className="plan-block day-plan-block-shell",d.innerHTML=`
            <div class="day-plan-block-head" style="display:flex; align-items:center; justify-content:space-between; gap:0.7rem; padding:0.62rem 0.8rem; border-bottom:1px solid #dbeafe; background:linear-gradient(90deg,#f7faff 0%,#ecf4ff 100%);">
                <div class="day-plan-block-head-main" style="display:flex; align-items:center; gap:0.55rem; min-width:0;">
                    <span class="day-plan-index-badge-step" style="background:#1d4ed8; color:#fff;">${a.querySelectorAll(".plan-block").length+1}</span>
                    <span class="day-plan-task-summary">New task</span>
                    <span class="day-plan-scope-pill" style="background:#dbeafe; color:#1e3a8a; border-color:#bfdbfe;">${s==="annual"?"Annual Plan":"Personal Plan"}</span>
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
                                <option value="personal" ${s==="personal"?"selected":""}>Personal Plan</option>
                                <option value="annual" ${s==="annual"?"selected":""}>Annual Plan</option>
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
                            ${ta()}
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
                            ${e.map(f=>`<option value="${f.id}" ${f.id===t.id?"selected":""}>${f.name}</option>`).join("")}
                        </select>
                    </div>
                `:""}
            </div>
        `,a.appendChild(d);const l=d.querySelector(".plan-start-date"),c=d.querySelector(".plan-end-date"),p=document.querySelector("#day-plan-modal .day-plan-head p")?.textContent?.match(/\d{4}-\d{2}-\d{2}/),m=p?p[0]:"";l&&(l.value=m),c&&(c.value=m);const u=d.querySelector(".plan-task");window.app_refreshPlanBlockSummary(d),u&&u.focus()};window.app_addSubPlanRow=a=>{const e=a.closest(".plan-block")?.querySelector(".sub-plans-list");if(!e)return;const t=document.createElement("div");t.className="sub-plan-row day-plan-sub-row",t.innerHTML=`
            <div class="day-plan-step-dot"></div>
            <input type="text" class="sub-plan-input day-plan-sub-input" placeholder="Add a step...">
            <button type="button" onclick="this.parentElement.remove()" title="Remove step" class="day-plan-remove-step-btn"><i class="fa-solid fa-circle-xmark"></i></button>
        `,e.appendChild(t);const n=t.querySelector("input");n&&n.focus()};window.app_checkMentions=(a,e)=>{const t=a.value,n=a.selectionStart,i=t.lastIndexOf("@",n-1),s=document.getElementById("mention-dropdown");if(s)if(i!==-1&&!t.substring(i,n).includes(" ")){const o=t.substring(i+1,n).toLowerCase(),r=e.filter(d=>d.name.toLowerCase().includes(o));if(a.id||(a.id="ta-"+Date.now()),r.length>0){const d=a.getBoundingClientRect();s.innerHTML=r.map(l=>`
                    <div onclick="window.app_applyMention('${a.id}', '${l.id}', '${l.name.replace(/'/g,"\\'")}', ${i})" class="mention-item day-plan-mention-item">
                        <img src="${l.avatar}" class="day-plan-mention-avatar" />
                        <span>${l.name}</span>
                    </div>
                `).join(""),s.style.top=`${d.bottom+6}px`,s.style.left=`${d.left}px`,s.style.display="block"}else s.style.display="none"}else s.style.display="none"};window.app_applyMention=(a,e,t,n)=>{const i=document.getElementById(a);if(!i)return;const s=i.selectionStart,o=i.value.substring(0,n),r=i.value.substring(s);i.value=`${o}${t} ${r}`,i.focus();const d=i.closest(".plan-block"),l=d?.querySelector(".tags-container");if(!l)return;const c=document.getElementById("mention-dropdown");if(c&&(c.style.display="none"),l.querySelector(`[data-id="${e}"]`))return;const m=l.querySelector(".no-tags-placeholder");m&&m.remove(),l.insertAdjacentHTML("beforeend",pn(e,t,"pending"));const u=typeof CSS<"u"&&CSS.escape?CSS.escape(e):e.replace(/"/g,'\\"'),f=d?.querySelector(`.day-plan-collab-option[data-id="${u}"]`);f&&f.classList.add("selected")};window.app_removeTagHint=a=>{const e=a.closest(".tags-container"),t=a.closest(".tag-chip"),n=t?t.dataset.id:"",i=a.closest(".plan-block");if(a.parentElement.remove(),i&&n){const s=typeof CSS<"u"&&CSS.escape?CSS.escape(n):n.replace(/"/g,'\\"'),o=i.querySelector(`.day-plan-collab-option[data-id="${s}"]`);o&&o.classList.remove("selected")}e&&e.querySelectorAll(".tag-chip").length===0&&(e.innerHTML=ta())};window.app_showStatusTooltip=()=>{};window.app_hideCheckoutIntro=()=>{const a=document.getElementById("checkout-intro-panel");a&&(a.style.display="none",localStorage.setItem("checkoutIntroSeen","true"))};window.app_updateCharCounter=a=>{const e=document.getElementById("char-counter");if(e){const t=a.value.length;e.textContent=`${t} / 500 recommended`,t>500?e.style.color="#f59e0b":t>300?e.style.color="#10b981":e.style.color="#94a3b8"}};window.app_selectLocationReason=a=>{const e=document.getElementById("location-explanation");e&&(document.querySelectorAll(".location-reason-btn").forEach(t=>{t.style.background="#e0f2fe",t.style.borderColor="#7dd3fc"}),event.target.style.background="#0ea5e9",event.target.style.borderColor="#0ea5e9",event.target.style.color="white",e.value=a,e.focus())};window.app_selectOvertimeReason=(a,e,t="overtime_work")=>{const n=document.getElementById("checkout-overtime-explanation"),i=document.getElementById("checkout-overtime-mode");document.querySelectorAll(".overtime-reason-btn").forEach(s=>{s.style.background="#fef3c7",s.style.borderColor="#fcd34d",s.style.color="#92400e"}),a&&(a.style.background="#f59e0b",a.style.borderColor="#f59e0b",a.style.color="white"),i&&(i.value=t),n&&(n.value=e,n.focus())};window.app_useWorkPlan=()=>{const a=document.getElementById("checkout-plan-text"),e=document.getElementById("checkout-work-summary"),t=a?.dataset?.rawText;t&&e&&(e.value=t,window.app_updateCharCounter&&window.app_updateCharCounter(e),e.focus(),e.style.borderColor="#8b5cf6",e.style.background="#f5f3ff",setTimeout(()=>{e.style.borderColor="#e2e8f0",e.style.background="#ffffff"},1e3))};const yt={started:"Started",half_done:"Half Done",blocked:"Blocked",waiting:"Waiting",done:"Done"},Ie=a=>typeof CSS<"u"&&CSS.escape?CSS.escape(a):String(a||"").replace(/"/g,'\\"');window.app_getCheckoutTaskKey=(a,e)=>`${a}:${e}`;window.app_parseCheckoutTaskKey=a=>{const e=String(a||""),t=e.lastIndexOf(":");if(t<=0)return{planId:e,taskIndex:-1};const n=e.slice(0,t),i=Number(e.slice(t+1));return{planId:n,taskIndex:i}};window.app_initCheckoutTaskDetails=(a,e,t)=>{window.app_checkoutTaskDetails=window.app_checkoutTaskDetails||{};const n=window.app_getCheckoutTaskKey(a,e);if(!window.app_checkoutTaskDetails[n]){const i=Number(t?.progressPercent),s=Number.isFinite(i)?Math.min(100,Math.max(0,i)):t?.status==="completed"?100:0,o=t?.progressStatus||(s>=100?"done":s>0?"started":"waiting");window.app_checkoutTaskDetails[n]={action:"",progressPercent:s,progressStatus:o,progressNote:t?.progressNote||"",actionMeta:{},lastUpdatedAt:null}}return window.app_checkoutTaskDetails[n]};window.app_markCheckoutTaskSaved=a=>{const t=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Ie(a)}"]`)?.querySelector("[data-saved-indicator]");t&&(t.classList.add("is-visible"),clearTimeout(t._hideTimeout),t._hideTimeout=setTimeout(()=>{t.classList.remove("is-visible")},1400))};window.app_setCheckoutTaskStatus=(a,e)=>{const t=window.app_checkoutTaskDetails?.[a];t&&(t.progressStatus=e,t.lastUpdatedAt=new Date().toISOString(),window.app_syncCheckoutTaskPanel(a),window.app_markCheckoutTaskSaved(a),window.app_renderCheckoutActionPreview())};window.app_updateCheckoutTaskProgress=(a,e)=>{const t=window.app_checkoutTaskDetails?.[a];if(!t)return;const n=Math.min(100,Math.max(0,Number(e||0)));t.progressPercent=n,n>=100&&(t.progressStatus="done"),t.lastUpdatedAt=new Date().toISOString(),window.app_syncCheckoutTaskPanel(a),window.app_markCheckoutTaskSaved(a),window.app_renderCheckoutActionPreview()};window.app_updateCheckoutTaskNote=(a,e)=>{const t=window.app_checkoutTaskDetails?.[a];t&&(t.progressNote=String(e||""),t.lastUpdatedAt=new Date().toISOString(),window.app_markCheckoutTaskSaved(a),window.app_renderCheckoutActionPreview())};window.app_updateCheckoutTaskActionMeta=(a,e,t)=>{const n=window.app_checkoutTaskDetails?.[a];n&&(n.actionMeta=n.actionMeta||{},n.actionMeta[e]=t,n.lastUpdatedAt=new Date().toISOString(),window.app_markCheckoutTaskSaved(a),window.app_renderCheckoutActionPreview())};window.app_clearCheckoutTaskError=a=>{const e=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Ie(a)}"]`);if(!e)return;e.classList.remove("has-error");const t=e.querySelector("[data-inline-error]");t&&(t.textContent="")};window.app_setCheckoutTaskError=(a,e)=>{const t=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Ie(a)}"]`);if(!t)return;t.classList.add("has-error");const n=t.querySelector("[data-inline-error]");n&&(n.textContent=e)};window.app_syncCheckoutTaskPanel=a=>{const e=window.app_checkoutTaskDetails?.[a],t=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Ie(a)}"]`);if(!t||!e)return;const n=t.querySelector("[data-progress-value]"),i=t.querySelector("[data-progress-input]");i&&(i.value=e.progressPercent),n&&(n.textContent=`${e.progressPercent}%`);const s=t.querySelector("[data-progress-note]");s&&s.value!==e.progressNote&&(s.value=e.progressNote||""),t.querySelectorAll("[data-status-chip]").forEach(o=>{const r=o.getAttribute("data-status-chip");o.classList.toggle("is-selected",r===e.progressStatus)}),t.querySelectorAll("[data-action-panel-section]").forEach(o=>{const r=o.getAttribute("data-action-panel-section");o.style.display=e.action===r?"block":"none"}),t.querySelectorAll("[data-action-field]").forEach(o=>{const r=o.getAttribute("data-action-field"),d=e.actionMeta?.[r]??"";o.value!==String(d)&&(o.value=String(d))})};window.app_collectCheckoutTaskUpdates=()=>{const a=[],e=[],t=window.app_checkoutTaskDetails||{};return Object.keys(t).forEach(n=>{const i=t[n];if(!i||!i.action)return;const{planId:s,taskIndex:o}=window.app_parseCheckoutTaskKey(n);let r="";if(i.action==="postpone"){const d=i.actionMeta?.postponeDate,l=String(i.actionMeta?.postponeReason||"").trim();d?l||(r="Add a reason for postponing."):r="Select a new date to postpone."}if(i.action==="delegate"&&(String(i.actionMeta?.delegateUserId||"").trim()||(r="Select a staff member to delegate.")),r){e.push({key:n,message:r});return}a.push({key:n,planId:s,taskIndex:o,action:i.action,progressPercent:i.progressPercent,progressStatus:i.progressStatus,progressNote:i.progressNote,actionMeta:i.actionMeta||{},timestamp:new Date().toISOString()})}),{updates:a,errors:e}};window.app_closeCheckoutActionModal=()=>{document.getElementById("checkout-action-detail-modal")?.remove()};window.app_openCheckoutActionModal=a=>{const e=window.app_checkoutTaskDetails?.[a];if(!e||!e.action)return;const t=window.app_checkoutTaskMeta?.[a]||{},n=window.app_checkoutUserMap||{},i=window.AppAuth.getUser()?.id,s=document.getElementById("checkout-action-detail-modal");s&&s.remove();const o=e.action==="complete"?"Complete":e.action==="postpone"?"Postpone":e.action==="delegate"?"Delegate":"Action",r=Object.keys(yt).map(y=>`<button type="button" class="checkout-task-chip ${e.progressStatus===y?"is-selected":""}" data-status-chip="${y}" onclick="window.app_setCheckoutTaskStatus('${ue(a)}','${y}')">${yt[y]}</button>`).join(""),d=X(e.actionMeta?.postponeDate||new Date(Date.now()+864e5).toISOString().split("T")[0]),l=X(e.actionMeta?.postponeReason||""),c=X(e.actionMeta?.completionNote||""),p=X(e.actionMeta?.delegateNote||""),m=X(e.actionMeta?.delegateUserId||""),u=X(e.progressNote||""),f=Object.keys(n).filter(y=>String(y)!==String(i)).map(y=>{const k=m&&m===String(y)?"selected":"";return`<option value="${X(y)}" ${k}>${X(n[y])}</option>`}).join(""),g=document.createElement("div");g.id="checkout-action-detail-modal",g.className="modal-overlay checkout-action-detail-modal",g.setAttribute("data-checkout-key",a),g.innerHTML=`
        <div class="modal-content checkout-action-detail-content">
            <div class="checkout-action-detail-header">
                <div>
                    <div class="checkout-action-detail-title">${X(t.text||"Task")}</div>
                    <div class="checkout-action-detail-sub">${X(o)} • ${e.progressPercent}% • ${X(yt[e.progressStatus]||"")}</div>
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
                    <input type="range" min="0" max="100" value="${e.progressPercent}" data-progress-input oninput="window.app_updateCheckoutTaskProgress('${ue(a)}', this.value)">
                </div>
                <div class="checkout-task-field">
                    <label>Status</label>
                    <div class="checkout-task-status-chips">
                        ${r}
                    </div>
                </div>
                <div class="checkout-task-field">
                    <label>Note</label>
                    <textarea rows="2" data-progress-note placeholder="What changed? (optional)" oninput="window.app_updateCheckoutTaskNote('${ue(a)}', this.value)">${u}</textarea>
                </div>
                <div class="checkout-task-action-extra" data-action-panel-section="complete" style="display:${e.action==="complete"?"block":"none"};">
                    <label>Completion Note</label>
                    <textarea rows="2" data-action-field="completionNote" placeholder="Optional details for completion." oninput="window.app_updateCheckoutTaskActionMeta('${ue(a)}','completionNote', this.value)">${c}</textarea>
                </div>
                <div class="checkout-task-action-extra" data-action-panel-section="postpone" style="display:${e.action==="postpone"?"block":"none"};">
                    <label>New Date</label>
                    <input type="date" data-action-field="postponeDate" value="${d}" onchange="window.app_updateCheckoutTaskActionMeta('${ue(a)}','postponeDate', this.value)">
                    <label>Reason</label>
                    <textarea rows="2" data-action-field="postponeReason" placeholder="Why postponed?" oninput="window.app_updateCheckoutTaskActionMeta('${ue(a)}','postponeReason', this.value)">${l}</textarea>
                </div>
                <div class="checkout-task-action-extra" data-action-panel-section="delegate" style="display:${e.action==="delegate"?"block":"none"};">
                    <label>Assign To</label>
                    <select data-action-field="delegateUserId" onchange="window.app_updateCheckoutTaskActionMeta('${ue(a)}','delegateUserId', this.value)">
                        <option value="">Select staff</option>
                        ${f}
                    </select>
                    <label>Handoff Note</label>
                    <textarea rows="2" data-action-field="delegateNote" placeholder="Handoff context (optional)." oninput="window.app_updateCheckoutTaskActionMeta('${ue(a)}','delegateNote', this.value)">${p}</textarea>
                </div>
                <div class="checkout-task-inline-error" data-inline-error></div>
            </div>
            <div class="checkout-action-detail-footer">
                <button type="button" class="action-btn secondary" onclick="window.app_closeCheckoutActionModal()">Done</button>
            </div>
        </div>
    `,document.body.appendChild(g),window.app_syncCheckoutTaskPanel(a)};window.app_renderCheckoutActionPreview=()=>{const a=document.getElementById("checkout-action-preview"),e=document.getElementById("checkout-action-preview-list");if(!a||!e)return;const t=window.app_checkoutTaskDetails||{},n=window.app_checkoutTaskMeta||{},i=window.app_checkoutUserMap||{},s=Object.keys(t).map(o=>{const r=t[o];if(!r||!r.action)return null;const l=(n[o]||{}).text||"Task",c=r.action==="complete"?"Complete":r.action==="postpone"?"Postpone":r.action==="delegate"?"Delegate":r.action,p=yt[r.progressStatus]||"Waiting",m=String(r.progressNote||"").trim();let u="";if(r.action==="postpone"){const f=Dt(r.actionMeta?.postponeDate)||"—",g=String(r.actionMeta?.postponeReason||"").trim();u=`New date: ${X(f)}${g?` • Reason: ${X(g)}`:""}`}if(r.action==="delegate"){const f=String(r.actionMeta?.delegateUserId||""),g=i[f]||"—",y=String(r.actionMeta?.delegateNote||"").trim();u=`Assigned to: ${X(g)}${y?` • Note: ${X(y)}`:""}`}if(r.action==="complete"){const f=String(r.actionMeta?.completionNote||"").trim();u=f?`Completion note: ${X(f)}`:""}return`
            <div class="checkout-action-preview-item">
                <div class="checkout-action-preview-title">${X(l)}</div>
                <div class="checkout-action-preview-meta">
                    <span class="checkout-action-preview-chip">${X(c)}</span>
                    <span>${r.progressPercent}% • ${X(p)}</span>
                </div>
                ${m?`<div class="checkout-action-preview-note">${X(m)}</div>`:""}
                ${u?`<div class="checkout-action-preview-extra">${u}</div>`:""}
            </div>
        `}).filter(Boolean);if(s.length===0){a.style.display="none",e.innerHTML="";return}a.style.display="block",e.innerHTML=s.join("")};window.app_applyCheckoutTaskUpdates=async(a=[])=>{if(!Array.isArray(a)||a.length===0)return;const e=window.AppAuth.getUser(),t=e?.id||e?.name||"staff",n=new Date().toISOString().split("T")[0];for(const i of a){const s=await window.AppDB.get("work_plans",i.planId).catch(()=>null);if(!s||!Array.isArray(s.plans))continue;const o=s.plans[i.taskIndex];if(o){if(o.progressPercent=i.progressPercent,o.progressStatus=i.progressStatus,o.progressNote=i.progressNote,o.lastProgressUpdateAt=i.timestamp,o.lastProgressUpdateBy=t,o.lastCheckoutAction=i.action,i.action==="complete"&&(o.status="completed",o.completedDate||(o.completedDate=n)),i.action==="postpone"&&(o.status="postponed"),s.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",s),i.action==="postpone"){const r=Dt(i.actionMeta?.postponeDate);if(r){const d=o.subPlans&&o.subPlans.length?` - ${o.subPlans.join(", ")}`:"",l=`${o.task}${d}`,c=s.date||n,m=`${l.replace(/\s*\(Postponed from [^)]+\)\s*$/i,"")} (Postponed from ${c})`;await window.AppCalendar.addWorkPlanTask(r,e.id,m,[],{addedFrom:"postponed",sourcePlanId:i.planId,sourceTaskIndex:i.taskIndex,postponedFromDate:c})}}if(i.action==="delegate"){const r=String(i.actionMeta?.delegateUserId||"").trim();r&&await window.app_delegateTo(i.planId,i.taskIndex,r)}}}window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans()};window.app_deleteDayPlan=async(a,e=null,t=null)=>{if(!await window.appConfirm("Are you sure you want to delete this work plan?"))return;const n=window.AppAuth.getUser(),i=ea(e,n.id);try{t==="personal"||t==="annual"?await window.AppCalendar.deleteWorkPlan(a,i,{planScope:t}):await Promise.all([window.AppCalendar.deleteWorkPlan(a,i,{planScope:"personal"}),window.AppCalendar.deleteWorkPlan(a,i,{planScope:"annual"})]),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert("Plan deleted!"),document.getElementById("day-plan-modal")?.remove();const o=await F.renderDashboard(),r=document.getElementById("page-content");r&&(r.innerHTML=o,window.setupDashboardEvents&&window.setupDashboardEvents())}catch(s){alert(s.message)}};window.app_saveDayPlan=async(a,e,t=null)=>{a.preventDefault();const n=window.AppAuth.getUser(),i=ea(t,n.id),s=a.target,o=s?.dataset?.hadPersonal==="1",r=s?.dataset?.hadAnnual==="1";let d=[];try{d=JSON.parse(s?.dataset?.removedTasks||"[]")}catch{d=[]}const l=document.querySelectorAll(".plan-block"),c=[],p=[],m=[],u={};let f="";if(l.forEach(g=>{const y=g.querySelector(".plan-task").value.trim(),k=g.querySelectorAll(".sub-plan-input"),T=Array.from(k).map(N=>N.value.trim()).filter(N=>N!==""),S=g.querySelectorAll(".tag-chip"),A=Array.from(S).map(N=>({id:N.dataset.id,name:N.dataset.name,status:N.dataset.status||"pending"})),h=g.querySelector(".plan-status").value,w=g.querySelector(".plan-assignee"),v=w?w.value:i,_=g.querySelector(".plan-start-date"),L=g.querySelector(".plan-end-date"),b=_?String(_.value||"").trim():"",x=L?String(L.value||"").trim():"",D=g.querySelector(".plan-root-id"),M=D?String(D.value||"").trim():"",R=g.querySelector(".plan-scope"),I=R&&R.value==="annual"?"annual":"personal";if(y){if(b&&!x||!b&&x){f="Please select both From Date and To Date for ranged tasks.";return}if(b&&x&&x<b){f="To Date cannot be earlier than From Date.";return}const B={task:y,subPlans:T,tags:A,status:h||null,assignedTo:v||null,startDate:b||e,endDate:x||e,planScope:I,carryForwardRootId:M||null,completedDate:h==="completed"?new Date().toISOString().split("T")[0]:null};c.push(B),I==="annual"?m.push(B):p.push(B)}}),d.forEach(g=>{const y=String(g?.rootId||"").trim(),k=g?.scope==="annual"?"annual":"personal";if(!y)return;const T={task:"[Removed Task]",subPlans:[],tags:[],status:"not-completed",assignedTo:i||null,startDate:e,endDate:e,planScope:k,carryForwardRootId:y,isRemoved:!0,removedAt:new Date().toISOString()};c.push(T),k==="annual"?m.push(T):p.push(T)}),f){alert(f);return}try{if(c.length===0&&(o&&await window.AppCalendar.deleteWorkPlan(e,i,{planScope:"personal"}),r&&await window.AppCalendar.deleteWorkPlan(e,i,{planScope:"annual"}),!o&&!r)){alert("Please add at least one task.");return}p.length>0?(await window.AppCalendar.setWorkPlan(e,p,i,{planScope:"personal"}),u.personal=window.AppCalendar.getWorkPlanId(e,i,"personal")):o&&await window.AppCalendar.deleteWorkPlan(e,i,{planScope:"personal"}),m.length>0?(await window.AppCalendar.setWorkPlan(e,m,i,{planScope:"annual"}),u.annual=window.AppCalendar.getWorkPlanId(e,i,"annual")):r&&await window.AppCalendar.deleteWorkPlan(e,i,{planScope:"annual"}),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans();const g=await window.AppDB.getAll("users");if(i!==n.id&&(n.role==="Administrator"||n.isAdmin)){const S=g.find(A=>A.id===i);if(S){S.notifications||(S.notifications=[]);const A=S.notifications[S.notifications.length-1];(!A||A.message!==`Admin ${n.name} has edited your Work Plan for ${e}`)&&(S.notifications.push({type:"admin_edit",message:`Admin ${n.name} has edited your Work Plan for ${e}`,date:new Date().toLocaleString(),read:!1}),await window.AppDB.put("users",S))}}const y=new Set;if(c.forEach(S=>{S.tags&&S.tags.forEach(A=>y.add(A.id))}),y.size>0){for(const S of y){const A=g.find(h=>h.id===S);A&&S!==n.id&&(A.notifications||(A.notifications=[]),c.forEach((h,w)=>{if(h.tags&&h.tags.some(v=>v.id===S)){const v=h.planScope==="annual"?"annual":"personal",_=u[v]||window.AppCalendar.getWorkPlanId(e,i,v);A.notifications.some(b=>{const x=String(b?.type||"").toLowerCase();return(x==="tag"||x==="mention")&&String(b.planId||"")===String(_||"")&&Number(b.taskIndex)===Number(w)&&String(b.taggedById||"")===String(n.id||"")})||A.notifications.push({id:`tag_${Date.now()}_${S}_${w}`,type:"tag",title:h.task||"Tagged task",description:h.subPlans&&h.subPlans.length>0?h.subPlans.join(", "):"",taggedById:n.id,taggedByName:n.name,taggedAt:new Date().toISOString(),status:"pending",source:"plan",planId:_,taskIndex:w,message:`${n.name} tagged you in: "${h.task}" for ${e}`,date:new Date().toLocaleString(),read:!1})}}),await window.AppDB.put("users",A))}for(let S=0;S<c.length;S++){const A=c[S];if(A.tags)for(const h of A.tags){if(h.id===i)continue;const w=g.find(x=>x.id===h.id);if(!w||!window.AppCalendar)continue;const v=A.planScope==="annual"?"annual":"personal",_=u[v]||window.AppCalendar.getWorkPlanId(e,i,v),L=A.subPlans&&A.subPlans.length>0?` - ${A.subPlans.join(", ")}`:"",b=`${A.task}${L} (Responsible: ${w.name})`;await window.AppCalendar.addWorkPlanTask(e,w.id,b,[{id:n.id,name:n.name,status:"pending"}],{addedFrom:"tag",sourcePlanId:_,sourceTaskIndex:S,taggedById:n.id,taggedByName:n.name,status:"pending",subPlans:A.subPlans||[],startDate:A.startDate||e,endDate:A.endDate||A.startDate||e})}}}alert("Plans saved successfully!"),document.getElementById("day-plan-modal")?.remove();const k=await F.renderDashboard(),T=document.getElementById("page-content");T&&(T.innerHTML=k,window.setupDashboardEvents&&window.setupDashboardEvents())}catch(g){alert(g.message)}};window.app_handleTagResponse=async(a,e,t,n)=>{const i=window.AppAuth.getUser();try{const s=a?await window.AppDB.get("work_plans",a).catch(()=>null):null;if(!s||!s.plans||!s.plans[e]){console.warn(`app_handleTagResponse: plan/task not found for planId=${a}, taskIdx=${e}. Falling back to notification-only update.`);const c=await window.AppDB.get("users",i.id).catch(()=>null),p=c?.notifications?.[n]?.id||null;if(p||n>=0)await window.app_handleTagDecision(p||String(n),t);else{if(c?.notifications?.[n]){const u=new Date().toISOString();c.notifications[n].status=t,c.notifications[n].respondedAt=u,c.notifications[n].read=!0,c.notifications[n].dismissedAt=u,await window.AppDB.put("users",c)}const m=document.getElementById("page-content");m&&(m.innerHTML=await F.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),alert(`You have ${t} the request.`)}return}const o=s.plans[e];if(o.tags){const c=o.tags.find(p=>p.id===i.id);c&&(c.status=t)}await window.AppDB.put("work_plans",s);const r=await window.AppDB.get("users",i.id);let d="";if(t==="rejected"&&(d=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Task",confirmText:"Submit Reason"})||""),r&&r.notifications){const c=r.notifications[n];if(c){const p=new Date().toISOString();c.status=t,c.respondedAt=p,c.read=!0,c.dismissedAt=p,d&&(c.rejectReason=d)}r.tagHistory||(r.tagHistory=[]),r.tagHistory.unshift({id:`taghist_${Date.now()}`,type:"tag_response",title:c?.title||s.plans[e].task||"Tagged task",taggedByName:c?.taggedByName||s.userName||"Staff",status:t,reason:d,date:new Date().toISOString()}),await window.AppDB.put("users",r)}if(s.userId){const c=await window.AppDB.get("users",s.userId);c&&(c.notifications||(c.notifications=[]),c.notifications.unshift({id:`tagresp_${Date.now()}`,type:"tag_response",message:`${i.name} ${t} your tag request.`,title:s.plans[e].task,taggedByName:i.name,status:t,reason:d,date:new Date().toISOString(),read:!1}),await window.AppDB.put("users",c))}window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans();const l=document.getElementById("page-content");l&&(l.innerHTML=await F.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),alert(`You have ${t} the collaboration request.`)}catch(s){console.error("app_handleTagResponse error:",s),alert("Error processing your response. Please try again.")}};window.app_changeCalMonth=a=>{let e=window.app_calMonth+a;e<0&&(window.app_calYear--,e=11),e>11&&(window.app_calYear++,e=0),window.app_calMonth=e,F.renderDashboard().then(async t=>{const n=document.getElementById("page-content");n.innerHTML=t,Me()})};window.app_exportCalendar=async()=>{const a=window._currentPlans,e=window.app_calMonth,t=window.app_calYear;if(!a){alert("Calendar data not loaded yet.");return}try{await window.AppReports.exportCalendarPlansCSV(a,e,t)}catch(n){alert("Export failed: "+n.message)}};window.app_newMeeting=async()=>{const a=window.AppAuth.getUser(),e={id:"meeting_"+Date.now(),title:"",date:new Date().toISOString().split("T")[0],minutes:"",author:a.name,timestamp:new Date().toISOString()};await window.AppDB.put("meetings",e),window._selectedMeetingId=e.id;const t=document.getElementById("page-content");t.innerHTML=await F.renderMinutes()};window.app_selectMeeting=async a=>{window._selectedMeetingId=a;const e=document.getElementById("page-content");e.innerHTML=await F.renderMinutes()};window.app_saveMeeting=async()=>{const a=document.getElementById("meeting-title")?.value,e=document.getElementById("meeting-date")?.value,t=document.getElementById("meeting-minutes")?.value;if(!window._selectedMeetingId){alert("No meeting selected");return}const n=await window.AppDB.get("meetings",window._selectedMeetingId);if(!n){alert("Meeting not found");return}n.title=a,n.date=e,n.minutes=t,n.timestamp=new Date().toISOString(),await window.AppDB.put("meetings",n);const i=document.getElementById("page-content");i.innerHTML=await F.renderMinutes(),alert("Meeting minutes saved successfully!")};window.app_deleteMeeting=async a=>{if(!await window.appConfirm("Are you sure you want to delete this meeting?"))return;await window.AppDB.delete("meetings",a),window._selectedMeetingId=null;const e=document.getElementById("page-content");e.innerHTML=await F.renderMinutes()};window.app_postponeTask=async(a,e,t)=>{if(t)try{const n=window.AppAuth.getUser();await window.AppCalendar.updateTaskStatus(a,e,"postponed");const i=await window.AppDB.get("work_plans",a),s=i?.plans?.[e],o=s&&s.subPlans&&s.subPlans.length?` - ${s.subPlans.join(", ")}`:"",r=s?`${s.task}${o}`:"",d=i?.date||new Date().toISOString().split("T")[0],c=`${r.replace(/\s*\(Postponed from [^)]+\)\s*$/i,"")} (Postponed from ${d})`;await window.AppCalendar.addWorkPlanTask(t,n.id,c,[],{addedFrom:"postponed",sourcePlanId:a,sourceTaskIndex:e,postponedFromDate:d}),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert(`Task postponed to ${t}`),typeof Ee=="function"&&await Ee()}catch(n){alert("Failed to postpone task: "+n.message)}};window.app_openPostponeModal=function(a,e){const t="postpone-task-modal";document.getElementById(t)?.remove();const n=new Date(Date.now()+864e5).toISOString().split("T")[0],i=`
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
            </div>`;window.app_showModal(i,t)};window.app_confirmPostponeTask=async function(a,e){const t=document.getElementById("postpone-date-input")?.value;if(!t)return alert("Please select a date.");document.getElementById("postpone-task-modal")?.remove(),await window.app_postponeTask(a,e,t)};window.app_openDelegateModal=async function(a,e){const t="delegate-task-modal";document.getElementById(t)?.remove();const n=await window.AppDB.getAll("users").catch(()=>[]),i=window.AppAuth.getUser(),s=(n||[]).filter(d=>d.id!==i.id);window.app_delegateModalContext={planId:a,taskIndex:e,selectedUserId:""};const o=s.map(d=>`
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
            </div>`;window.app_showModal(r,t)};window.app_filterDelegateUsers=function(a){const e=String(a||"").toLowerCase().trim();Array.from(document.querySelectorAll("#delegate-picker-list .delegate-picker-item")).forEach(t=>{const n=t.getAttribute("data-name")||"";t.style.display=!e||n.includes(e)?"flex":"none"})};window.app_selectDelegateUser=function(a){if(!window.app_delegateModalContext)return;window.app_delegateModalContext.selectedUserId=a,Array.from(document.querySelectorAll("#delegate-picker-list .delegate-picker-item")).forEach(t=>{t.classList.toggle("selected",t.getAttribute("data-user-id")===a)});const e=document.getElementById("delegate-confirm-btn");e&&(e.disabled=!a)};window.app_confirmDelegateTask=async function(){const a=window.app_delegateModalContext;if(!a||!a.selectedUserId)return alert("Please select a staff member.");document.getElementById("delegate-task-modal")?.remove(),await window.app_delegateTo(a.planId,a.taskIndex,a.selectedUserId)};window.app_formatTaskWithPostponeChip=function(a){const e=String(a||""),t=e.match(/^(.*)\s+\(Postponed from ([^)]+)\)\s*$/i);if(!t)return e;const n=t[1].trim(),i=t[2].trim();return`${n} <span class="postponed-source-chip">Postponed from ${i}</span>`};window.app_appendCompletedTaskToSummary=async function(a,e){const n=(await window.AppDB.get("work_plans",a))?.plans?.[e];if(!n)return;const i=n.subPlans&&n.subPlans.length?` (${n.subPlans.join(", ")})`:"",s=`- ${n.task}${i}`,o=document.getElementById("checkout-work-summary"),r=(o?.value||window.app_checkoutSummaryDraft||"").trim(),l=r.split(`
`).some(c=>c.trim()===s.trim())?r:r?`${r}
${s}`:s;window.app_checkoutSummaryDraft=l,o&&(o.value=l,window.app_updateCharCounter&&window.app_updateCharCounter(o))};window.app_handleChecklistAction=async function(a,e,t){const n=document.getElementById("checkout-task-checklist"),i=document.getElementById("delegate-panel");window.app_checkoutTaskActions=window.app_checkoutTaskActions||{};const s=`${a}:${e}`;if(!t){delete window.app_checkoutTaskActions[s],window.app_checkoutTaskDetails&&delete window.app_checkoutTaskDetails[s],i&&(i.style.display="none"),n&&n.classList.remove("delegate-open");const d=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Ie(s)}"]`);d&&d.remove();const l=document.querySelector(`.checkout-task-detail-btn[data-checkout-detail-key="${Ie(s)}"]`);l&&(l.disabled=!0),window.app_renderCheckoutActionPreview();return}window.app_checkoutTaskActions[s]=t,window.app_checkoutTaskDetails=window.app_checkoutTaskDetails||{};const o=window.app_checkoutTaskDetails[s]||{action:"",progressPercent:0,progressStatus:"waiting",progressNote:"",actionMeta:{}};o.action=t,t==="complete"&&(o.progressPercent=100,o.progressStatus="done",await window.app_appendCompletedTaskToSummary(a,e)),t==="postpone"&&(o.actionMeta?.postponeDate||(o.actionMeta=o.actionMeta||{},o.actionMeta.postponeDate=new Date(Date.now()+864e5).toISOString().split("T")[0])),window.app_checkoutTaskDetails[s]=o,i&&(i.style.display="none"),n&&n.classList.remove("delegate-open");const r=document.querySelector(`.checkout-task-detail-btn[data-checkout-detail-key="${Ie(s)}"]`);r&&(r.disabled=!1),window.app_openCheckoutActionModal(s),window.app_clearCheckoutTaskError(s),window.app_renderCheckoutActionPreview()};window.app_markTaskCompleted=async function(a,e){try{const t=new Date().toISOString().split("T")[0];await window.AppCalendar.updateTaskStatus(a,e,"completed",t),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert("Task marked as completed."),typeof Ee=="function"&&await Ee()}catch(t){alert("Failed to mark completed: "+t.message)}};window.app_delegateTask=async function(a,e){try{const t=await window.AppDB.getAll("users"),n=t.map(o=>o.name).join(", "),i=await window.appPrompt(`Delegate to which staff? Enter name.
Available: ${n}`,"",{title:"Delegate Task",placeholder:"Type staff name"});if(!i)return;const s=t.find(o=>o.name.toLowerCase()===i.toLowerCase());if(!s){alert("Staff not found.");return}await window.app_delegateTo(a,e,s.id)}catch(t){alert("Failed to delegate task: "+t.message)}};window.app_delegateTo=async function(a,e,t){try{const n=await window.AppDB.get("work_plans",a);if(!n||!n.plans||!n.plans[e]){alert("Task not found.");return}const i=window.AppAuth.getUser(),s=n.plans[e],o=s.subPlans&&s.subPlans.length?` — ${s.subPlans.join(", ")}`:"",r=`${s.task}${o}`;s.tags||(s.tags=[]);const l=(await window.AppDB.getAll("users")).find(p=>p.id===t);if(!l){alert("Staff not found.");return}s.tags.some(p=>p.id===l.id)||s.tags.push({id:l.id,name:l.name,status:"pending"}),s.status=s.status||"pending",n.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",n),await window.AppCalendar.addWorkPlanTask(n.date,l.id,r,[{id:i.id,name:i.name,status:"pending"}],{addedFrom:"delegated",sourcePlanId:a,sourceTaskIndex:e,taggedById:i.id,taggedByName:i.name,status:"pending",subPlans:s.subPlans||[]});const c=await window.AppDB.get("users",l.id);c&&(c.notifications||(c.notifications=[]),c.notifications.unshift({id:`task_${Date.now()}`,type:"task",title:s.task||"Delegated task",description:s.subPlans&&s.subPlans.length>0?s.subPlans.join(", "):"",taggedById:i.id,taggedByName:i.name,taggedAt:new Date().toISOString(),status:"pending",source:"delegation",date:new Date().toLocaleString(),read:!1}),await window.AppDB.put("users",c)),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert(`Task delegated to ${l.name}.`),typeof Ee=="function"&&await Ee()}catch(n){alert("Failed to delegate task: "+n.message)}};function un(a,e,t,n){if(!a||!e||!t||!n)return 0;const i=6371e3,s=a*Math.PI/180,o=t*Math.PI/180,r=(t-a)*Math.PI/180,d=(n-e)*Math.PI/180,l=Math.sin(r/2)*Math.sin(r/2)+Math.cos(s)*Math.cos(o)*Math.sin(d/2)*Math.sin(d/2),c=2*Math.atan2(Math.sqrt(l),Math.sqrt(1-l));return i*c}const mn=480*60*1e3,hs=540*60*1e3,va=(a,e)=>{if(!a||!e)return null;const t=String(a).trim(),n=String(e).trim();if(!t||!n||n.toLowerCase().includes("active now"))return null;const i=new Date(`${t}T${n}`);if(!Number.isNaN(i.getTime()))return i;const s=new Date(`${t} ${n}`);return Number.isNaN(s.getTime())?null:s},ys=async(a,e,t)=>{if(!a||!window.AppDB||t<=e)return!1;const n=await window.AppDB.getAll("attendance"),i=String(a);return(n||[]).some(s=>{if(!s||String(s.user_id||"")!==i||!s.isManualOverride)return!1;const o=va(s.date,s.checkIn),r=va(s.date,s.checkOut);if(!o||!r)return!1;let d=o.getTime(),l=r.getTime();l<=d&&(l+=1440*60*1e3);const c=Math.max(e,d);return Math.min(t,l)>c})},gs=async a=>{const e={showPrompt:!1,hasManualLog:!1,overtimeStartMs:null,overtimeEndMs:null};if(!a||!a.lastCheckIn)return e;const t=Number(a.lastCheckIn);if(!Number.isFinite(t))return e;const n=Date.now();if(n-t<=hs)return e;const s=t+mn;return await ys(a.id,s,n)?{showPrompt:!1,hasManualLog:!0,overtimeStartMs:s,overtimeEndMs:n}:{showPrompt:!0,hasManualLog:!1,overtimeStartMs:s,overtimeEndMs:n}};window.app_prepareCheckoutOvertimeSection=async a=>{const e=document.getElementById("checkout-overtime-section"),t=document.getElementById("checkout-overtime-explanation"),n=document.getElementById("checkout-overtime-mode"),i=document.getElementById("checkout-overtime-hint");if(window.app_checkoutOvertimeState={showPrompt:!1,hasManualLog:!1},!(!e||!t||!n)){e.style.display="none",t.required=!1,t.value="",n.value="overtime_work",document.querySelectorAll(".overtime-reason-btn").forEach(s=>{s.style.background="#fef3c7",s.style.borderColor="#fcd34d",s.style.color="#92400e"});try{const s=await gs(a);if(window.app_checkoutOvertimeState=s,!s.showPrompt)return;i&&(i.textContent="You worked over 1 hour extra. Please capture what was done during overtime."),e.style.display="block",t.required=!0}catch(s){console.warn("Overtime prompt check failed:",s)}}};async function Ee(){const a=document.getElementById("attendance-btn"),e=document.getElementById("location-text"),{status:t}=await window.AppAttendance.getStatus();a&&(a.disabled=!0),Ze=!0;try{if(t==="out"){a&&(a.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Locating...');const n=await window.getLocation(),i=`Lat: ${n.lat.toFixed(4)}, Lng: ${n.lng.toFixed(4)}`;e&&(e.innerHTML=`<i class="fa-solid fa-location-dot"></i> ${i}`);const s=await window.AppAttendance.checkIn(n.lat,n.lng,i);if(s&&s.conflict){window.app_showSyncToast(s.message||"Status updated from another device."),window.app_refreshDashboard&&await window.app_refreshDashboard();return}Wt(),window.app_refreshDashboard&&await window.app_refreshDashboard(),s&&s.resolvedMissedCheckout&&s.noticeMessage&&window.app_showAttendanceNotice(s.noticeMessage),s&&s.missedCheckoutReasonRequired&&s.missedCheckoutLogId&&window.app_promptMissedCheckoutReason({logId:s.missedCheckoutLogId,date:s.missedCheckoutDate}),window.AppDayPlan&&typeof window.AppDayPlan.openDayPlan=="function"&&await window.AppDayPlan.openDayPlan(fa())}else{const n=window.AppAuth.getUser(),i=fa(),s=await window.AppCalendar.getWorkPlan(n.id,i,{includeAnnual:!0,mergeAnnual:!0}),o=await window.AppCalendar.getCollaborations(n.id,i);window.app_checkoutSummaryDate!==i&&(window.app_checkoutSummaryDate=i,window.app_checkoutSummaryDraft=""),window.app_checkoutActionDate!==i&&(window.app_checkoutActionDate=i,window.app_checkoutTaskActions={},window.app_checkoutTaskDetails={},window.app_checkoutTaskMeta={},window.app_checkoutUserMap={});const r=document.getElementById("modal-container");r&&!document.getElementById("checkout-modal")&&r.insertAdjacentHTML("beforeend",F.renderModals());const d=document.getElementById("checkout-modal");if(d){const l=document.getElementById("checkout-plan-text"),c=d.querySelector('textarea[name="description"]');if(s&&(s.plans||s.plan)){let u="",f="";if(s.plans&&s.plans.length>0?(u=s.plans.map((A,h)=>`<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; padding-bottom:12px; border-bottom:1px dashed #e9d5ff;">
                                    <div style="flex:1;">
                                        <div style="font-weight:600; color:#4c1d95;">${window.app_formatTaskWithPostponeChip(A.task)}</div>
                                        ${A.subPlans&&A.subPlans.length>0?`<div style="font-size:0.75rem; color:#7c3aed; margin-top:2px;">👣 ${A.subPlans.join(", ")}</div>`:""}
                                    </div>
                                    <div style="display:flex; gap:6px; flex-shrink:0;">
                                        ${A.status==="completed"?'<span style="font-size:0.75rem; color:#059669; font-weight:700;">✅ Done</span>':`<button type="button" onclick="window.app_postponeTask('${A._planId||s.id}', ${typeof A._taskIndex=="number"?A._taskIndex:h})" style="background:#f3e8ff; color:#7c3aed; border:1px solid #ddd6fe; border-radius:8px; padding:6px 12px; font-size:0.8rem; font-weight:600; cursor:pointer;" onmouseover="this.style.background='#ddd6fe'" onmouseout="this.style.background='#f3e8ff'">⌛ Postpone</button>`}
                                    </div>
                                </div>`).join(""),f=s.plans.filter(A=>window.AppCalendar.getSmartTaskStatus(s.date,A.status)==="completed").map(A=>{let h=`• ${A.task}`;return A.subPlans&&A.subPlans.length>0&&(h+=` (${A.subPlans.join(", ")})`),h}).join(`
`)):s.plan&&(u=`<div style="font-weight:600; color:#4c1d95;">${s.plan}</div>`,f=`• ${s.plan}`,s.subPlans&&s.subPlans.length>0&&(u+=`<div style="font-size:0.75rem; color:#7c3aed; margin-top:2px;">👣 ${s.subPlans.join(", ")}</div>`,f+=` (${s.subPlans.join(", ")})`)),o&&o.length>0){const S=o.map(A=>A.plans.filter(h=>h.tags&&h.tags.some(w=>w.id===n.id&&w.status==="accepted")).map(h=>{let w=`🤝 [Collaborated with ${A.userName}] ${h.task}`;return h.subPlans&&h.subPlans.length>0&&(w+=`
👣 Steps: `+h.subPlans.join(", ")),w}).join(`
`)).join(`

`);u?u+=`

`+S:u=S}l&&(l.innerHTML=u),l&&(l.dataset.rawText=f),c&&!c.value.trim()&&window.app_checkoutSummaryDraft&&(c.value=window.app_checkoutSummaryDraft,window.app_updateCharCounter&&window.app_updateCharCounter(c));const g=document.getElementById("checkout-task-list"),y=document.getElementById("delegate-panel"),k=document.getElementById("delegate-list"),T=document.getElementById("delegate-selected-task");if(g)if(s&&Array.isArray(s.plans)&&s.plans.length>0){const S=await window.AppDB.getAll("users").catch(()=>[]);window.app_checkoutUserMap={},(S||[]).forEach(v=>{window.app_checkoutUserMap[String(v.id)]=v.name});const A=window.AppAuth.getUser(),h=(S||[]).filter(v=>v.id!==A.id),w=s.plans.map((v,_)=>{const L=v.subPlans&&v.subPlans.length?` — ${v.subPlans.join(", ")}`:"",b=`${v.task}${L}`,x=v._planId||s.id,D=typeof v._taskIndex=="number"?v._taskIndex:_,M=window.AppCalendar.getSmartTaskStatus(v._planDate||s.date,v.status),R=`${x}:${D}`;window.app_checkoutTaskMeta=window.app_checkoutTaskMeta||{},window.app_checkoutTaskMeta[R]={text:b,planId:x,taskIndex:D};const N=(window.app_checkoutTaskActions&&window.app_checkoutTaskActions[R]?window.app_checkoutTaskActions[R]:"")||(v.status==="completed"||M==="completed"?"complete":v.status==="postponed"?"postpone":""),P=window.app_initCheckoutTaskDetails(x,D,v),B=P.action||N||"";B&&P.action!==B&&(P.action=B,B==="complete"&&(P.progressPercent=100,P.progressStatus="done")),window.app_checkoutTaskActions&&B&&(window.app_checkoutTaskActions[R]=B);const O=M==="completed"?"Completed":M==="in-process"?"In Process":M==="overdue"?"Overdue":M==="to-be-started"?"To Be Started":v.status||"Pending",V=X(P.actionMeta?.postponeDate||new Date(Date.now()+864e5).toISOString().split("T")[0]),j=X(P.actionMeta?.postponeReason||""),W=X(P.actionMeta?.delegateUserId||""),J=X(P.actionMeta?.delegateNote||""),E=X(P.actionMeta?.completionNote||""),U=X(P.progressNote||"");return`
                                        <div class="checkout-task-row">
                                            <div class="checkout-task-copy">
                                                <div class="checkout-task-title">${window.app_formatTaskWithPostponeChip(b)}</div>
                                                <div class="checkout-task-status">Status: ${O}</div>
                                            </div>
                                            <div class="checkout-task-controls">
                                                <select onchange="window.app_handleChecklistAction('${x}', ${D}, this.value)" class="checkout-task-action-select">
                                                    <option value="" ${B?"":"selected"}>Choose Action</option>
                                                    <option value="complete" ${B==="complete"?"selected":""}>Complete</option>
                                                    <option value="postpone" ${B==="postpone"?"selected":""}>Postpone</option>
                                                    <option value="delegate" ${B==="delegate"?"selected":""}>Delegate</option>
                                                </select>
                                                <button type="button" class="checkout-task-detail-btn" data-checkout-detail-key="${X(R)}" onclick="window.app_openCheckoutActionModal('${ue(R)}')" ${B?"":"disabled"}>Action Details</button>
                                            </div>
                                        </div>`}).join("");if(g.innerHTML=w,window.app_renderCheckoutActionPreview(),y&&k&&T){y.style.display="none";const v=document.getElementById("checkout-task-checklist");v&&v.classList.remove("delegate-open"),k.innerHTML=h.map(_=>`
                                        <button type="button" data-user-id="${_.id}" class="delegate-user-btn">
                                            <img src="${_.avatar}" alt="${_.name}" class="delegate-user-avatar">
                                            <span style="flex:1;">${_.name}</span>
                                        </button>
                                    `).join("")}}else g.innerHTML='<div style="font-size:0.8rem; color:#6b7280;">No tasks planned for today.</div>',window.app_renderCheckoutActionPreview()}await window.app_prepareCheckoutOvertimeSection(n),d.style.display="flex",a&&(a.disabled=!1);const p=document.getElementById("checkout-location-mismatch"),m=document.getElementById("checkout-location-loading");m&&(m.style.display="block"),p&&(p.style.display="none"),(async()=>{try{const u=await window.getLocation(),f=n.currentLocation||n.lastLocation;m&&(m.style.display="none"),f&&f.lat&&f.lng&&(un(u.lat,u.lng,f.lat,f.lng)>500?p&&(p.style.display="block"):p&&(p.style.display="none"))}catch(u){console.warn("Background location check failed:",u),m&&(m.style.display="none")}})()}else{const l=await window.AppAttendance.checkOut();l&&!l.conflict&&Wt(),l&&l.conflict&&window.app_showSyncToast(l.message||"Status updated from another device."),await vt()}}}catch(n){alert(n.message||n),a&&(a.disabled=!1,a.innerHTML=t==="out"?'Check-in <i class="fa-solid fa-fingerprint"></i>':'Check-out <i class="fa-solid fa-fingerprint"></i>')}finally{Ze=!1}}window.app_submitCheckOut=async function(a){a.preventDefault();const e=a.target,t=e.description.value,n=e.querySelector('button[type="submit"]');Ze=!0;try{n.disabled=!0,n.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Locating & Saving...',Object.keys(window.app_checkoutTaskDetails||{}).forEach(S=>window.app_clearCheckoutTaskError(S));const{updates:s,errors:o}=window.app_collectCheckoutTaskUpdates();if(o.length>0){o.forEach(A=>window.app_setCheckoutTaskError(A.key,A.message));const S=o[0]?.key;if(S){const A=document.querySelector(`.checkout-action-detail-modal[data-checkout-key="${Ie(S)}"]`);A&&A.scrollIntoView({behavior:"smooth",block:"center"})}n.disabled=!1,n.textContent="Complete Check-Out";return}let r=null,d=null;try{r=await window.getLocation()}catch(S){d=S}let l=!1;const c=window.AppAuth.getUser()?.currentLocation;r&&(r=$e&&Date.now()-Ne<Qa?$e:r,c&&c.lat&&c.lng&&r.lat&&r.lng&&un(r.lat,r.lng,c.lat,c.lng)>500&&(l=!0));const p=e.locationExplanation?e.locationExplanation.value.trim():"",m=window.app_checkoutOvertimeState||{},u=e.overtimeExplanation?e.overtimeExplanation.value.trim():"",f=e.overtimeMode?String(e.overtimeMode.value||"overtime_work"):"overtime_work",g={};if(m.showPrompt){if(!u){alert("Please describe the overtime work before checkout."),n.disabled=!1,n.textContent="Complete Check-Out";return}if(g.overtimePrompted=!0,g.overtimeExplanation=u,g.overtimeReasonTag=f,f==="forgot_checkout"){const S=Number(window.AppAuth.getUser()?.lastCheckIn);Number.isFinite(S)&&(g.checkOutTime=new Date(S+mn).toISOString(),g.overtimeCappedToEightHours=!0)}}if(s.length>0&&(g.taskUpdates=s.map(S=>({planId:S.planId,taskIndex:S.taskIndex,action:S.action,progressPercent:S.progressPercent,progressStatus:S.progressStatus,progressNote:S.progressNote,actionMeta:S.actionMeta||{},timestamp:S.timestamp}))),!r&&!p){const S=document.getElementById("checkout-location-mismatch");S&&(S.style.display="block"),alert("Location unavailable. Please provide a reason for checking out from a different location."),n.disabled=!1,n.textContent="Complete Check-Out";return}const y=r?`Lat: ${Number(r.lat).toFixed(4)}, Lng: ${Number(r.lng).toFixed(4)}`:"Location unavailable (reason provided)",k=e.tomorrowGoal?e.tomorrowGoal.value.trim():"";if(k){const S=new Date(Date.now()+864e5).toISOString().split("T")[0];await window.AppCalendar.addWorkPlanTask(S,window.AppAuth.getUser().id,k),console.log("Tomorrow's goal saved:",k)}const T=await window.AppAttendance.checkOut(t,r?r.lat:null,r?r.lng:null,y,l||!r,p||(d?String(d):""),g);if(T&&T.conflict){const S=document.getElementById("checkout-modal");S&&(S.style.display="none"),window.app_showSyncToast(T.message||"Status updated from another device."),await vt();return}Wt(),s.length>0&&await window.app_applyCheckoutTaskUpdates(s),window.app_checkoutSummaryDraft="",window.app_checkoutTaskActions={},window.app_checkoutTaskDetails={},window.app_checkoutTaskMeta={},window.app_checkoutUserMap={},window.app_renderCheckoutActionPreview(),document.getElementById("checkout-modal").style.display="none",await vt()}catch(i){alert("Check-out failed: "+i.message),n.disabled=!1,n.textContent="Complete Check-Out"}finally{Ze=!1}};async function ws(a){a.preventDefault();const e=new FormData(a.target),t=aa(e.get("checkIn"),e.get("checkOut"));if(t==="Invalid"){alert("End time must be after Start time");return}const n=e.get("date"),i=e.get("checkIn"),s=e.get("checkOut"),o=window.AppAttendance.buildDateTime(n,i),r=window.AppAttendance.buildDateTime(n,s),d=o&&r?r-o:0,l=Math.max(0,d)/(1e3*60*60),c=l>=4;let p="Work Log",m=0;l>=8?(p="Present",m=1):l>=4&&(p="Half Day",m=.5);const u={date:e.get("date"),checkIn:i,checkOut:s,duration:t,durationMs:d,location:e.get("location"),workDescription:e.get("location"),type:p,dayCredit:m,lateCountable:!1,extraWorkedMs:0,policyVersion:"v2",entrySource:"staff_manual_work",attendanceEligible:c,isManualOverride:!1};await window.AppAttendance.addManualLog(u),alert("Log added successfully!"),document.getElementById("log-modal").style.display="none",te.innerHTML=await F.renderTimesheet()}async function vs(a){a.preventDefault();const e=new FormData(a.target),t=e.get("name").trim(),n=e.get("username").trim(),i=e.get("password").trim(),s=e.get("email").trim(),o=e.get("isAdmin")==="on"||e.get("isAdmin")==="true",r=e.get("canManageAttendanceSheet")==="on"||e.get("canManageAttendanceSheet")==="true";let d;try{d=Re(e)}catch(c){alert(c.message);return}const l={id:"u"+Date.now(),name:t,username:n,password:i,role:e.get("role"),dept:e.get("dept"),email:s,phone:e.get("phone"),joinDate:e.get("joinDate"),isAdmin:o,canManageAttendanceSheet:r,canManageBirthdays:!1,birthDay:d.birthDay,birthMonth:d.birthMonth,birthYear:d.birthYear,permissions:window.app_getPermissionsFromUI("add"),avatar:`https://ui-avatars.com/api/?name=${e.get("name")}&background=random&color=fff`,status:"out",lastCheckIn:null};try{l.isAdmin?(l.role="Administrator",l.canManageAttendanceSheet=!0,l.canManageBirthdays=!0,l.permissions={...l.permissions||{},birthday:"admin"}):(l.isAdmin=!1,l.canManageBirthdays=l.permissions?.birthday==="admin"),await window.AppDB.add("users",l),alert("Success! Account created."),document.getElementById("add-user-modal").style.display="none";const c=document.getElementById("page-content");c&&(c.innerHTML=await F.renderAdmin())}catch(c){alert("Error creating user: "+c.message)}}window.app_getPermissionsFromUI=a=>{const e={};return["dashboard","leaves","users","attendance","reports","minutes","policies","birthday"].forEach(n=>{const i=document.getElementById(`${a}-perm-${n}-view`),s=document.getElementById(`${a}-perm-${n}-admin`);s&&s.checked?e[n]="admin":i&&i.checked?e[n]="view":e[n]=null}),e};window.app_submitEditUser=async a=>{a&&a.preventDefault();const e=a&&a.target&&a.target.tagName==="FORM"?a.target:document.getElementById("edit-user-form");if(!e){console.error("Critical Failure: Edit user form not found."),alert("Error: Form missing.");return}const t=new FormData(e),n=(t.get("id")||"").trim();if(!n){console.error("Data Failure: No 'id' name attribute found in form data.",{target:a.target,allData:Object.fromEntries(t.entries())}),alert("Error: User ID missing. Please refresh.");return}const i=e.querySelector('[name="isAdmin"]'),s=!!(i&&i.checked),o=e.querySelector('[name="canManageAttendanceSheet"]'),r=!!(o&&o.checked),d=String(t.get("pan")||"").trim().toUpperCase(),l=String(t.get("bankIfsc")||"").trim().toUpperCase(),c=String(t.get("joinDate")||"").trim(),p=String(t.get("employeeId")||"").trim();let m;try{m=Re(t)}catch(k){alert(k.message);return}const u=/^[A-Z]{5}[0-9]{4}[A-Z]$/,f=/^[A-Z]{4}0[A-Z0-9]{6}$/;if(c){const k=new Date,T=`${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;if(c>T){alert("Join Date cannot be in the future.");return}}if(d&&!u.test(d)){alert("Invalid PAN format. Use format like ABCDE1234F");return}if(l&&!f.test(l)){alert("Invalid IFSC format. Use format like SBIN0001234");return}const g=c?p||xt(c,n):"NA",y={id:n,name:(t.get("name")||"").trim(),username:(t.get("username")||"").trim(),password:(t.get("password")||"").trim(),role:t.get("role"),dept:t.get("dept"),email:(t.get("email")||"").trim(),phone:(t.get("phone")||"").trim(),isAdmin:s,canManageAttendanceSheet:r,canManageBirthdays:!1,employeeId:g,joinDate:c||null,birthDay:m.birthDay,birthMonth:m.birthMonth,birthYear:m.birthYear,baseSalary:Number(t.get("baseSalary")||0),otherAllowances:Number(t.get("otherAllowances")||0),providentFund:Number(t.get("providentFund")||0),professionalTax:Number(t.get("professionalTax")||0),loanAdvance:Number(t.get("loanAdvance")||0),tdsPercent:Number(t.get("tdsPercent")||0),bankName:(t.get("bankName")||"").trim(),bankAccount:(t.get("bankAccount")||"").trim(),bankIfsc:l,pan:d,uan:(t.get("uan")||"").trim(),permissions:window.app_getPermissionsFromUI("edit")};console.log("Executing Update for User:",y),y.isAdmin?(y.canManageAttendanceSheet=!0,y.canManageBirthdays=!0,y.role="Administrator",y.permissions={...y.permissions||{},birthday:"admin"}):y.canManageBirthdays=y.permissions?.birthday==="admin";try{if(await window.AppAuth.updateUser(y)){console.log("Success: User updated in DB."),alert(`SUCCESS: Details for '${y.name}' have been saved.`),document.getElementById("edit-user-modal").style.display="none";const T=document.getElementById("page-content");T&&setTimeout(async()=>{T.innerHTML=await F.renderAdmin(),window.AppAnalytics&&await window.AppAnalytics.initAdminCharts()},50)}else alert("Update failed: User not found.")}catch(k){console.error("Update Error:",k),alert("Error: "+k.message)}};function aa(a,e){const[t,n]=a.split(":"),[i,s]=e.split(":"),o=parseInt(i)*60+parseInt(s)-(parseInt(t)*60+parseInt(n));if(o<0)return"Invalid";const r=Math.floor(o/60),d=o%60;return`${r}h ${d}m`}function Me(){const a=document.getElementById("attendance-btn"),e=!!window.app_dashboardReadOnly,t=window.app_dashboardTargetUser||null;a&&!e&&a.addEventListener("click",Ee),os(t,e),et(),window.app_refreshNotificationBell&&window.app_refreshNotificationBell().catch(()=>{}),window.app_attachStatsCardHandlers&&window.app_attachStatsCardHandlers()}window.setupDashboardEvents=Me;async function vt(){const a=document.getElementById("page-content");if(a)try{a.innerHTML=await F.renderDashboard(),Me()}catch(e){console.error("Dashboard refresh after attendance failed:",e),typeof window.app_showSyncToast=="function"&&window.app_showSyncToast("Attendance saved. Refresh the page if the dashboard looks stale.")}}window.app_refreshDashboard=vt;document.addEventListener("submit",a=>{if(a.preventDefault(),a.target?.classList?.contains("day-plan-form"))return;const e=String(a.target.getAttribute("id")||"");if(console.log("Submit Event Intercepted. Form ID:",e),e==="manual-log-form")ws(a);else if(e==="checkout-form")window.app_submitCheckOut(a);else if(e==="add-user-form")vs(a);else if(e==="login-form")(async()=>{const t=new FormData(a.target);try{const n=await window.getLocation();if(!await window.AppAuth.login(t.get("username"),t.get("password"))){alert("Invalid Credentials");return}const s=window.AppAuth.getUser();s&&(s.lastLoginLocation={lat:n.lat,lng:n.lng,capturedAt:Date.now()},await window.AppDB.put("users",s)),window.location.reload()}catch(n){const i=String(n);i.includes("permission-denied")||i.includes("FirebaseError")?alert(`Database Error: ${i}

Access to the database was blocked. Please check your Firebase Firestore Security Rules.`):alert(`Login blocked: ${i}

Please enable location and try again.`)}})();else if(e==="edit-user-form")console.log("Routing to app_submitEditUser..."),window.app_submitEditUser(a);else if(e==="birthday-details-form")window.app_submitBirthdayDetails(a);else if(e==="birthday-external-form")window.app_submitExternalBirthdayPerson(a);else if(e.startsWith("birthday-month-form-")){const t=Number(e.replace("birthday-month-form-",""));window.app_submitBirthdayMonthForm(a,t)}else e==="notify-form"?Ss(a):e==="leave-request-form"?bs(a):console.warn("Unhandled form submission ID:",e,"Target:",a.target)});async function bs(a){const e=new FormData(a.target),t=window.AppAuth.getUser(),n=e.get("startDate");let i=e.get("endDate");const s=e.get("type");s==="Half Day"&&(i=n),await window.AppLeaves.requestLeave({userId:t.id,userName:t.name,startDate:n,endDate:i,startTime:e.get("startTime")||"",endTime:e.get("endTime")||"",type:s,reason:e.get("reason"),durationHours:e.get("durationHours")||""}),alert("Leave requested successfully!"),document.getElementById("leave-modal").style.display="none",a.target.reset()}async function Ss(a){a.preventDefault();const e=new FormData(a.target),t=e.get("toUserId"),n=e.get("reminderMessage")||"",i=e.get("reminderLink")||"",s=e.get("taskTitle")||"",o=e.get("taskDescription")||"",r=e.get("taskDueDate")||"";try{if(!n.trim()&&!s.trim()){alert("Please enter a reminder or a task.");return}const d=await window.AppDB.get("users",t);if(!d)throw new Error("User not found");const l=window.AppAuth.getUser(),c=new Date().toISOString();d.notifications||(d.notifications=[]),n.trim()&&(d.notifications.unshift({id:`rem_${Date.now()}`,type:"reminder",message:n.trim(),taggedById:l.id,taggedByName:l.name,taggedAt:c,status:"pending",date:c,read:!1}),await window.AppDB.add("staff_messages",{id:`msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"text",message:n.trim(),link:i.trim(),fromId:l.id,fromName:l.name,toId:t,toName:d.name,createdAt:c,read:!1})),s.trim()&&(d.notifications.unshift({id:`task_${Date.now()}`,type:"task",title:s.trim(),description:o.trim(),taggedById:l.id,taggedByName:l.name,taggedAt:c,status:"pending",dueDate:r||"",date:c,read:!1}),await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:s.trim(),description:o.trim(),dueDate:r||"",status:"pending",fromId:l.id,fromName:l.name,toId:t,toName:d.name,createdAt:c,read:!1,history:[{action:"created",byId:l.id,byName:l.name,at:c}]})),await window.AppAuth.updateUser(d),alert("Notification sent!"),document.getElementById("notify-modal").style.display="none",window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()}catch(d){alert("Failed to send: "+d.message)}}window.app_openStaffThread=async a=>{window.app_staffThreadId=a;const e=window.AppAuth.getUser();if(!e)return;const n=(await window.app_getMyMessages()).filter(s=>s.toId===e.id&&s.fromId===a&&!s.read);for(const s of n)s.read=!0,s.readAt=new Date().toISOString(),await window.AppDB.put("staff_messages",s);const i=document.getElementById("page-content");i&&(i.innerHTML=await F.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_sendStaffText=async a=>{a.preventDefault();const e=window.AppAuth.getUser(),t=new FormData(a.target),n=t.get("toUserId"),i=(t.get("message")||"").trim(),s=(t.get("link")||"").trim();if(!i){alert("Please type a message.");return}const o=await window.AppDB.get("users",n);if(!o){alert("Staff member not found.");return}await window.AppDB.add("staff_messages",{id:`msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"text",message:i,link:s,fromId:e.id,fromName:e.name,toId:n,toName:o.name,createdAt:new Date().toISOString(),read:!1}),a.target.reset();const r=document.getElementById("staff-message-modal");r&&r.remove();const d=document.getElementById("page-content");d&&(d.innerHTML=await F.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_sendStaffTask=async a=>{a.preventDefault();const e=window.AppAuth.getUser(),t=new FormData(a.target),n=t.get("toUserId"),i=(t.get("taskTitle")||"").trim(),s=(t.get("taskDescription")||"").trim(),o=(t.get("taskDueDate")||"").trim();if(!i){alert("Please provide a task title.");return}const r=await window.AppDB.get("users",n);if(!r){alert("Staff member not found.");return}await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:i,description:s,dueDate:o,status:"pending",fromId:e.id,fromName:e.name,toId:n,toName:r.name,createdAt:new Date().toISOString(),read:!1,history:[{action:"created",byId:e.id,byName:e.name,at:new Date().toISOString()}]}),a.target.reset();const d=document.getElementById("staff-task-modal");d&&d.remove();const l=document.getElementById("page-content");l&&(l.innerHTML=await F.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_openStaffMessageModal=(a,e)=>{if(!a){alert("Select a staff member first.");return}const n=`
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
        `;window.app_showModal(n,"staff-task-modal")};window.app_respondStaffTask=async(a,e)=>{const t=window.AppAuth.getUser(),n=await window.AppDB.get("staff_messages",a);if(!n){alert("Task not found.");return}if(n.toId!==t.id){alert("Only the recipient can approve or reject this task.");return}let i="";if(e==="rejected"&&(i=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Task",confirmText:"Submit Reason"})||""),n.status=e,n.respondedAt=new Date().toISOString(),i&&(n.rejectReason=i),n.history||(n.history=[]),n.history.unshift({action:e,byId:t.id,byName:t.name,at:n.respondedAt,reason:i}),e==="approved"&&!n.calendarSynced){const r=n.dueDate||new Date().toISOString().split("T")[0],d=n.toName||t.name,l=`${n.title}${n.description?` - ${n.description}`:""}`;window.AppCalendar&&(await window.AppCalendar.addWorkPlanTask(r,n.toId,`${l} (Responsible: ${d})`,[],{addedFrom:"staff",sourcePlanId:n.id,sourceTaskIndex:0,taggedById:n.fromId,taggedByName:n.fromName,status:"pending"}),await window.AppCalendar.addWorkPlanTask(r,n.fromId,`${l} (Assigned to ${d})`,[],{addedFrom:"staff",sourcePlanId:n.id,sourceTaskIndex:1,taggedById:n.fromId,taggedByName:n.fromName,status:"pending"}),n.calendarSynced=!0)}await window.AppDB.put("staff_messages",n);const s=await window.AppDB.get("users",n.fromId);s&&(s.notifications||(s.notifications=[]),s.notifications.unshift({id:`taskresp_${Date.now()}`,type:"task_response",message:`${t.name} ${e} a task.`,title:n.title,taggedByName:t.name,status:e,reason:i,date:n.respondedAt,read:!1}),await window.AppDB.put("users",s));const o=document.getElementById("page-content");o&&(o.innerHTML=await F.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_updateStaffNavIndicator=async()=>{const a=window.AppAuth.getUser();if(!a)return;const e=document.querySelectorAll('[data-page="staff-directory"]');if(!e.length)return;const n=(await window.app_getMyMessages()).some(i=>i.toId===a.id&&!i.read);e.forEach(i=>{n?i.classList.add("has-new-msg"):i.classList.remove("has-new-msg")})};window.app_handleTagDecision=async(a,e)=>{const t=window.AppAuth.getUser();try{const n=await window.AppDB.get("users",t.id);if(!n||!n.notifications)throw new Error("Notification not found");const i=n.notifications.find(d=>d.id===a);if(!i)throw new Error("Notification not found");let s="";e==="rejected"&&(s=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Item",confirmText:"Submit Reason"})||"");const o=new Date().toISOString();if(i.status=e,i.respondedAt=o,i.read=!0,i.dismissedAt=o,s&&(i.rejectReason=s),n.tagHistory||(n.tagHistory=[]),n.tagHistory.unshift({id:`taghist_${Date.now()}`,type:"tag_response",title:i.title||i.message||"Tagged item",taggedByName:i.taggedByName||"Staff",status:e,reason:s,date:new Date().toISOString()}),await window.AppDB.put("users",n),i.taggedById){const d=await window.AppDB.get("users",i.taggedById);d&&(d.notifications||(d.notifications=[]),d.notifications.unshift({id:`tagresp_${Date.now()}`,type:"tag_response",message:`${t.name} ${e} your ${i.type||"tag"}.`,title:i.title||"",taggedByName:t.name,status:e,reason:s,date:new Date().toISOString(),read:!1}),await window.AppDB.put("users",d))}const r=document.getElementById("page-content");r&&(r.innerHTML=await F.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents())}catch(n){alert("Failed to update tag: "+n.message)}};document.addEventListener("auth-logout",()=>window.AppAuth.logout());window.app_reviewMinuteAccessFromNotification=async(a,e,t)=>{try{const n=window.AppAuth.getUser();if(!(n&&(n.isAdmin||n.role==="Administrator"))){alert("Only admin can review access requests.");return}const s=await window.AppDB.get("users",n.id);if(!s||!Array.isArray(s.notifications)){alert("Notification not found.");return}let o=null;if(typeof a=="number"&&s.notifications[a]&&(o=s.notifications[a]),!o&&e&&(o=s.notifications.find(y=>String(y.id)===String(e))),!o||o.type!=="minute-access-request"){alert("This notification is no longer available.");return}const r=o.minuteId,d=o.taggedById||o.requesterId;if(!r||!d){alert("Invalid access request payload.");return}const l=await window.AppDB.get("minutes",r);if(!l){alert("Minute not found.");return}const c=Array.isArray(l.accessRequests)?l.accessRequests.slice():[];c.findIndex(y=>y.userId===d)<0&&c.push({userId:d,userName:o.taggedByName||"Staff",requestedAt:o.taggedAt||o.date||new Date().toISOString(),status:"pending",reviewedAt:"",reviewedBy:""});const m=c.findIndex(y=>y.userId===d);c[m]={...c[m],status:t,reviewedAt:new Date().toISOString(),reviewedBy:n.name};let u=Array.isArray(l.allowedViewers)?l.allowedViewers.slice():[];t==="approved"?u.includes(d)||u.push(d):u=u.filter(y=>y!==d),await window.AppMinutes.updateMinute(r,{accessRequests:c,allowedViewers:u},t==="approved"?"Admin approved minutes access from notification":"Admin rejected minutes access from notification");const f=await window.AppDB.get("users",d);f&&(f.notifications||(f.notifications=[]),f.notifications.unshift({id:Date.now()+Math.random(),type:"minute-access-reviewed",title:"Minutes Access Update",message:`Your request for "${l.title}" was ${t}.`,minuteId:r,taggedById:n.id,taggedByName:n.name,status:t,taggedAt:new Date().toISOString(),date:new Date().toISOString()}),await window.AppDB.put("users",f));const g=s.notifications.find(y=>String(y.id)===String(o.id));g&&(g.status=t,g.respondedAt=new Date().toISOString(),g.read=!0,await window.AppAuth.updateUser(s)),te.innerHTML=await F.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}catch(n){alert("Failed to review access request: "+n.message)}};window.app_reviewMissedCheckoutReasonFromNotification=async(a,e,t)=>{try{const n=window.AppAuth.getUser();if(!(n&&(n.isAdmin||n.role==="Administrator"))){alert("Only admin can review missed checkout reasons.");return}const s=await window.AppDB.get("users",n.id);if(!s||!Array.isArray(s.notifications)){alert("Notification not found.");return}let o=null;if(typeof a=="number"&&s.notifications[a]&&(o=s.notifications[a]),!o&&e&&(o=s.notifications.find(k=>String(k.id)===String(e))),!o||o.type!=="missed-checkout-reason"){alert("This notification is no longer available.");return}const r=o.staffId||o.taggedById,d=o.logId;if(!r||!d){alert("Invalid missed checkout payload.");return}let l="";t==="rejected"&&(l=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Reason",confirmText:"Submit Reason"})||"");const c=await window.AppDB.get("attendance",d);if(c){const k=t==="approved"&&c.autoCheckout?{type:"Present",dayCredit:window.AppAttendance&&typeof window.AppAttendance.getDayCredit=="function"?window.AppAttendance.getDayCredit("Present"):1,lateCountable:!1,missedCheckoutApprovedAsFullDay:!0,missedCheckoutApprovedAt:new Date().toISOString(),missedCheckoutApprovedBy:n.name}:{};await window.AppDB.put("attendance",{...c,...k,missedCheckoutReasonStatus:t,missedCheckoutReviewedBy:n.name,missedCheckoutReviewedAt:new Date().toISOString(),missedCheckoutReviewNote:l||""})}const p=new Date().toISOString(),m=s.notifications.find(k=>String(k.id)===String(o.id));m&&(m.status=t,m.respondedAt=p,m.read=!0,await window.AppAuth.updateUser(s));const u=await window.AppDB.get("users",r),f=o.missedCheckoutDate||(c?c.date:"the previous day");u&&(u.notifications||(u.notifications=[]),u.notifications.unshift({id:`mcr_rev_${Date.now()}`,type:"missed-checkout-reason-reviewed",title:"Missed checkout reason reviewed",message:`Admin ${t} your missed checkout reason for ${f}.`,status:t,date:p,taggedById:n.id,taggedByName:n.name,reviewNote:l||""}),await window.AppDB.put("users",u)),te.innerHTML=await F.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell();const g=t==="approved"?"approved":"rejected",y=`${o.staffName||"Staff"}'s missed checkout for ${f} was ${g}.`;window.appAlert?await window.appAlert(y,"Review Complete"):alert(y)}catch(n){alert("Failed to review missed checkout reason: "+n.message)}};document.addEventListener("dismiss-notification",async a=>{const e=a.detail,t=typeof e=="object"&&e!==null?e.notifIndex:e,n=typeof e=="object"&&e!==null?String(e.notifId||""):"",i=window.AppAuth.getUser();if(i&&i.notifications&&Number.isInteger(t)&&t>=0){let s=i.notifications[t];if(!s&&n&&(s=i.notifications.find(r=>String(r.id||"")===n)),!s)return;s.read=!0,s.dismissedAt=new Date().toISOString(),await window.AppAuth.updateUser(i),(window.location.hash.slice(1)||"dashboard")==="dashboard"&&(te.innerHTML=await F.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}else if(i&&i.notifications&&n){const s=i.notifications.find(r=>String(r.id||"")===n);if(!s)return;s.read=!0,s.dismissedAt=new Date().toISOString(),await window.AppAuth.updateUser(i),(window.location.hash.slice(1)||"dashboard")==="dashboard"&&(te.innerHTML=await F.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}});document.addEventListener("dismiss-tag-history",async a=>{const e=String(a.detail||""),t=window.AppAuth.getUser();if(!e||!t||!Array.isArray(t.tagHistory))return;const n=t.tagHistory.findIndex(i=>String(i.id)===e);n<0||(t.tagHistory.splice(n,1),await window.AppAuth.updateUser(t),te.innerHTML=await F.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents())});document.addEventListener("open-log-modal",()=>{const a=document.getElementById("log-modal");if(!a)return;const e=new Date,t=i=>i.toString().padStart(2,"0");document.getElementById("log-date").value=e.toISOString().split("T")[0],document.getElementById("log-start-time").value=`${t(e.getHours())}:${t(e.getMinutes())}`;const n=new Date(e.getTime()+36e5);document.getElementById("log-end-time").value=`${t(n.getHours())}:${t(n.getMinutes())}`,a.style.display="flex"});document.addEventListener("set-duration",a=>{const e=a.detail,t=document.getElementById("log-start-time"),n=document.getElementById("log-end-time");if(t.value){const[i,s]=t.value.split(":").map(Number),o=new Date;o.setHours(i,s);const r=new Date(o.getTime()+e*60*1e3),d=l=>l.toString().padStart(2,"0");n.value=`${d(r.getHours())}:${d(r.getMinutes())}`}});window.app_editUser=async a=>{console.log("Opening Edit Modal for ID:",a);const e=await window.AppDB.get("users",a);if(console.log("User Data Found:",e),!e)return;const t=document.getElementById("edit-user-form");if(!t)return;const n=(l,c)=>{const p=t.querySelector(l);p&&(p.value=c!==void 0?c:"")},i=(l,c)=>{const p=t.querySelector(l);p&&(p.checked=!!c)};n("#edit-user-id",e.id),n("#edit-user-name",e.name),n("#edit-user-username",e.username),n("#edit-user-password",e.password),n("#edit-user-role",e.role),n("#edit-user-dept",e.dept),n("#edit-user-email",e.email),n("#edit-user-phone",e.phone),i("#edit-user-isAdmin",!!(e.isAdmin||e.role==="Administrator")),i("#edit-user-can-manage-attendance-sheet",!!(e.canManageAttendanceSheet||e.isAdmin||e.role==="Administrator")),n("#edit-user-birth-day",e.birthDay||""),n("#edit-user-birth-month",e.birthMonth||""),n("#edit-user-birth-year",e.birthYear||"");const s=Dt(e.joinDate);n("#edit-user-join-date",s),n("#edit-user-employee-id",s?e.employeeId||xt(s,e.id):"NA"),n("#edit-user-base-salary",Number(e.baseSalary||0)),n("#edit-user-other-allowances",Number(e.otherAllowances||0)),n("#edit-user-pf",Number(e.providentFund||0)),n("#edit-user-professional-tax",Number(e.professionalTax||0)),n("#edit-user-loan-advance",Number(e.loanAdvance||0)),n("#edit-user-tds-percent",Number(e.tdsPercent||0)),n("#edit-user-bank-name",e.bankName||""),n("#edit-user-bank-account",e.bankAccount||e.accountNumber||""),n("#edit-user-bank-ifsc",e.bankIfsc||e.ifsc||""),n("#edit-user-pan",e.pan||e.PAN||""),n("#edit-user-uan",e.uan||e.UAN||"");const o=["dashboard","leaves","users","attendance","reports","minutes","policies","birthday"],r=e.permissions||{};if(o.forEach(l=>{const c=r[l],p=document.getElementById(`edit-perm-${l}-view`),m=document.getElementById(`edit-perm-${l}-admin`);p&&(p.checked=c==="view"||c==="admin"),m&&(m.checked=c==="admin")}),!r.birthday&&(e.canManageBirthdays||e.isAdmin||e.role==="Administrator")){const l=document.getElementById("edit-perm-birthday-view"),c=document.getElementById("edit-perm-birthday-admin");l&&(l.checked=!0),c&&(c.checked=!0)}const d=document.getElementById("edit-user-modal");if(d){d.style.display="flex";const l=document.getElementById("edit-user-permissions-panel");l&&(l.style.display="block")}};window.app_notifyUser=a=>{console.log("Opening Notify for:",a),document.getElementById("notify-user-id").value=a,document.getElementById("notify-modal").style.display="flex"};window.app_quickAddTask=async a=>{const e=window.AppAuth.getUser();if(!(e&&(e.role==="Administrator"||e.isAdmin))&&a!==e.id){alert("Only administrators can assign tasks to other staff.");return}const n=await window.appPrompt("Task to assign:","",{title:"Assign Task",placeholder:"Enter task title",confirmText:"Next"});if(!n||!n.trim())return;const i=await window.appPrompt("Task date (YYYY-MM-DD). Leave blank for today:","",{title:"Assign Task Date",placeholder:"YYYY-MM-DD",confirmText:"Create Task"}),s=i&&i.trim()?i.trim():new Date().toISOString().split("T")[0];try{if(!window.AppCalendar)throw new Error("Calendar module not available.");await window.AppCalendar.addWorkPlanTask(s,a,n.trim()),await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:n.trim(),description:"",dueDate:s,status:"pending",fromId:e.id,fromName:e.name,toId:a,toName:(await window.AppDB.get("users",a))?.name||"Staff",createdAt:new Date().toISOString(),read:!1,history:[{action:"created",byId:e.id,byName:e.name,at:new Date().toISOString()}]}),alert("Task added successfully.");const o=document.getElementById("page-content");o&&(o.innerHTML=await F.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()}catch(o){alert("Failed to add task: "+o.message)}};window.app_viewLogs=async a=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}console.log("Viewing details for:",a);const e=await window.AppDB.get("users",a);let t=await window.AppAttendance.getLogs(a);window.currentViewedLogs=t,window.currentViewedUser=e;const n=t.length?`
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
                        ${t.map(i=>{let s=i.location||"N/A";return i.lat&&i.lng&&(s=`<a href="https://www.google.com/maps?q=${i.lat},${i.lng}" target="_blank" style="color:var(--primary);text-decoration:none;">
                                    <i class="fa-solid fa-map-pin"></i> ${Number(i.lat).toFixed(4)}, ${Number(i.lng).toFixed(4)}
                                </a>`),`
                            <tr>
                                <td>${i.date}</td>
                                <td>${i.checkIn}</td>
                                <td>${i.checkOut||"--"}</td>
                                <td>${i.duration||"--"}</td>
                                <td><span class="badge ${i.isManualOverride?"manual":""}" style="font-size:0.7rem; padding: 2px 6px;">${i.type||"Office"}</span></td>
                                <td style="font-size:0.85rem; color:#6b7280;">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        ${s}
                                        <button onclick="window.app_deleteLog('${i.id}', '${a}')" style="background:none; border:none; color:#ef4444; cursor:pointer;" title="Delete Log"><i class="fa-solid fa-trash"></i></button>
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
        `;window.app_showModal(e,"manual-admin-log-modal")};window.app_submitManualLog=async(a,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}a.preventDefault();const t=new FormData(a.target),n=t.get("checkIn"),i=t.get("checkOut"),s=aa(n,i);if(s==="Invalid"){alert("End time must be after Start time");return}const o=t.get("date"),r=window.AppAttendance.buildDateTime(o,n),d=window.AppAttendance.buildDateTime(o,i),l=r&&d?d-r:0,c=window.AppAttendance.evaluateAttendanceStatus(r||new Date,l),p=u=>{const[f,g]=u.split(":"),y=parseInt(f),k=y>=12?"PM":"AM",T=y%12||12;return`${String(T).padStart(2,"0")}:${g} ${k}`},m={date:o,checkIn:p(n),checkOut:p(i),duration:s,type:c.status,workDescription:t.get("description")||"Manual Entry by Admin",location:"Office (Manual)",durationMs:l,dayCredit:c.dayCredit,lateCountable:c.lateCountable,extraWorkedMs:c.extraWorkedMs||0,policyVersion:"v2",isManualOverride:!0,entrySource:"admin_override",attendanceEligible:!0};try{await window.AppAttendance.addAdminLog(e,m),alert("Attendance added manually."),document.getElementById("manual-admin-log-modal")?.remove(),window.app_viewLogs(e)}catch(u){alert("Error: "+u.message)}};window.app_deleteLog=async(a,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Are you sure you want to delete this attendance record?"))try{await window.AppAttendance.deleteLog(a),alert("Record deleted."),window.app_viewLogs(e)}catch(t){alert("Error: "+t.message)}};window.app_approveLeave=async a=>{if(await window.appConfirm("Are you sure you want to APPROVE this leave request?"))try{const e=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(a,"Approved",e.id),alert("Leave Approved! Attendance logs have been automatically generated.");const t=document.getElementById("page-content");t&&(t.innerHTML=await F.renderDashboard(),Me())}catch(e){alert("Error: "+e.message)}};window.app_rejectLeave=async a=>{const e=await window.appPrompt("Enter rejection reason (optional):","",{title:"Reject Leave",confirmText:"Reject Leave"});if(e!==null)try{const t=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(a,"Rejected",t.id,e),alert("Leave Rejected.");const n=document.getElementById("page-content");n&&(n.innerHTML=await F.renderDashboard(),Me())}catch(t){alert("Error: "+t.message)}};window.app_addLeaveComment=async a=>{const e=await window.AppDB.get("leaves",a),t=await window.appPrompt("Enter/Edit Admin Comment:",e.adminComment||"",{title:"Admin Comment",confirmText:"Save Comment"});if(t!==null)try{const n=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(a,e.status,n.id,t),alert("Comment saved.");const i=document.getElementById("page-content");i&&(i.innerHTML=await F.renderDashboard(),Me())}catch(n){alert("Error: "+n.message)}};window.app_exportLeaves=async()=>{try{const a=await window.AppLeaves.getAllLeaves();if(a.length===0){alert("No leave requests found to export.");return}await window.AppReports.exportLeavesCSV(a)}catch(a){alert("Export Failed: "+a.message)}};window.app_refreshMasterSheet=async()=>{const a=document.getElementById("page-content");if(a){const e=document.getElementById("sheet-month")?.value,t=document.getElementById("sheet-year")?.value;a.innerHTML=await F.renderMasterSheet(e,t)}};window.app_exportMasterSheet=async()=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}const a=parseInt(document.getElementById("sheet-month").value),e=parseInt(document.getElementById("sheet-year").value),t=await window.AppDB.getAll("users"),n=`${e}-${String(a+1).padStart(2,"0")}-01`,i=`${e}-${String(a+1).padStart(2,"0")}-31`,o=(await window.AppDB.query("attendance","date",">=",n)).filter(r=>r.date<=i);await window.AppReports.exportMasterSheetCSV(a,e,t,o)};window.app_openCellOverride=async(a,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}const t=(await window.AppDB.getAll("users")).find(r=>r.id===a),n=await window.AppDB.getAll("attendance"),i=r=>{if(Object.prototype.hasOwnProperty.call(r||{},"attendanceEligible"))return r.attendanceEligible===!0;const d=String(r?.entrySource||"");return d==="staff_manual_work"?!1:d==="admin_override"||d==="checkin_checkout"||r?.isManualOverride||r?.location==="Office (Manual)"||r?.location==="Office (Override)"||typeof r?.activityScore<"u"||typeof r?.locationMismatched<"u"||typeof r?.autoCheckout<"u"||!!r?.checkOutLocation||typeof r?.outLat<"u"||typeof r?.outLng<"u"?!0:String(r?.type||"").includes("Leave")||r?.location==="On Leave"},s=n.filter(r=>(r.userId===a||r.user_id===a)&&r.date===e&&i(r)).sort((r,d)=>Number(d.id||0)-Number(r.id||0))[0],o=`
            <div class="modal-overlay" id="cell-override-modal" style="display:flex;">
                <div class="modal-content">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <div>
                            <h3 style="margin:0;">Edit Attendance</h3>
                            <p style="font-size:0.8rem; color:#666; margin:4px 0 0 0;">${t.name} | ${e}</p>
                        </div>
                        <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
                    </div>
                        <form onsubmit="window.app_submitCellOverride(event, '${a}', '${e}', '${s?.id||""}')">
                            <div style="display:flex; flex-direction:column; gap:1rem;">
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time In</label>
                                    <input type="time" name="checkIn" required value="${s?bt(s.checkIn):"09:00"}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time Out</label>
                                    <input type="time" name="checkOut" required value="${s?bt(s.checkOut):"17:00"}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Entry Type</label>
                                <select name="type" required style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                    <option value="Present" ${s?.type==="Present"?"selected":""}>Present</option>
                                    <option value="Work - Home" ${s?.type==="Work - Home"?"selected":""}>WFH</option>
                                    <option value="Late" ${s?.type==="Late"?"selected":""}>Late</option>
                                    <option value="Absent" ${s?.type==="Absent"?"selected":""}>Absent</option>
                                    <option value="Casual Leave" ${s?.type==="Casual Leave"?"selected":""}>Leave</option>
                                </select>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Admin Reason</label>
                                <textarea name="description" placeholder="Override reason..." style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px; height:60px;">${s?.workDescription||""}</textarea>
                            </div>
                            ${s?.autoCheckoutRequiresApproval?`
                                <div style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem 0.75rem; border:1px solid #fde68a; border-radius:8px; background:#fffbeb;">
                                    <input type="checkbox" name="autoCheckoutExtraApproved" id="auto-extra-approve" ${s?.autoCheckoutExtraApproved?"checked":""}>
                                    <label for="auto-extra-approve" style="font-size:0.8rem; color:#92400e; cursor:pointer;">Approve extra hours for auto check-out</label>
                                </div>
                            `:""}
                            <div style="display:flex; gap:0.75rem;">
                                <button type="submit" class="action-btn" style="flex:2;">${s?"Update Log":"Create Log"}</button>
                                ${s?`<button type="button" onclick="window.app_deleteCellLog('${s.id}', '${a}')" class="action-btn checkout" style="flex:1; padding:0;">Delete</button>`:""}
                            </div>
                            <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem;">
                                <input type="checkbox" name="isManualOverride" id="override-check" ${s?.isManualOverride?"checked":""}>
                                <label for="override-check" style="font-size:0.8rem; color:#666; cursor:pointer;">Mark as Manual Override</label>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;window.app_showModal(o,"cell-override-modal")};window.app_submitCellOverride=async(a,e,t,n)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}a.preventDefault();const i=new FormData(a.target),s=i.get("checkIn"),o=i.get("checkOut"),r=aa(s,o);if(r==="Invalid"){alert("End time must be after Start time");return}const d=window.AppAttendance.buildDateTime(t,s),l=window.AppAttendance.buildDateTime(t,o),c=d&&l?l-d:0,p=window.AppAttendance.evaluateAttendanceStatus(d||new Date,c),m=i.get("isManualOverride")==="on",u=String(i.get("type")||"").trim(),f=m&&u?u:p.status,g=k=>{if(!k||k==="--")return"--";const[T,S]=k.split(":"),A=parseInt(T),h=A>=12?"PM":"AM",w=A%12||12;return`${String(w).padStart(2,"0")}:${S} ${h}`},y={date:t,checkIn:g(s),checkOut:g(o),duration:r,type:f,workDescription:i.get("description")||"Admin Override",location:"Office (Override)",durationMs:c,dayCredit:p.dayCredit,lateCountable:p.lateCountable,extraWorkedMs:p.extraWorkedMs||0,policyVersion:"v2",isManualOverride:m,entrySource:"admin_override",attendanceEligible:!0,autoCheckoutExtraApproved:i.get("autoCheckoutExtraApproved")==="on"};try{n?await window.AppAttendance.updateLog(n,y):await window.AppAttendance.addAdminLog(e,y),alert("Override successful."),document.getElementById("cell-override-modal")?.remove(),window.app_refreshMasterSheet()}catch(k){alert("Error: "+k.message)}};window.app_deleteCellLog=async(a,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Delete this attendance record?"))try{await window.AppAttendance.deleteLog(a),document.getElementById("cell-override-modal")?.remove(),window.app_refreshMasterSheet()}catch(t){alert("Error: "+t.message)}};function bt(a){if(!a||a==="--"||a==="Active Now")return"09:00";const[e,t]=a.split(" ");let[n,i]=e.split(":"),s=parseInt(n);return t==="PM"&&s<12&&(s+=12),t==="AM"&&s===12&&(s=0),`${String(s).padStart(2,"0")}:${i}`}const ks=a=>{if(!a)return null;const e=String(a).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);if(!Number.isNaN(t.getTime())){const i=t.getFullYear(),s=String(t.getMonth()+1).padStart(2,"0"),o=String(t.getDate()).padStart(2,"0");return`${i}-${s}-${o}`}const n=e.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);if(n){const i=Number(n[1]),s=Number(n[2]),o=Number(n[3]);let r=i,d=s;return d>12&&i<=12&&(d=i,r=s),d<1||d>12||r<1||r>31?null:`${o}-${String(d).padStart(2,"0")}-${String(r).padStart(2,"0")}`}return null};window.app_runAttendancePolicyMigration=async()=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Recalculate historical attendance logs with the current policy? This updates stored status/credits for existing office logs.","Run Attendance Migration"))try{const e=await window.AppDB.getAll("attendance");let t=0,n=0,i=0;const s=new Set(["Work - Home","Training","On Duty","Holiday","National Holiday","Regional Holidays"]);let o=0,r=0;const d=new Map,l=new Map,c=g=>{const y=ks(g?.date),k=typeof g?.activityScore<"u"||typeof g?.locationMismatched<"u"||typeof g?.autoCheckout<"u"||!!g?.checkOutLocation||typeof g?.outLat<"u"||typeof g?.outLng<"u";let S=String(g?.entrySource||"").trim();S||(g?.isManualOverride||g?.location==="Office (Manual)"||g?.location==="Office (Override)"?S="admin_override":k?S="checkin_checkout":S="staff_manual_work");const A=g?.checkIn&&g?.checkOut&&g?.checkOut!=="Active Now"?bt(g.checkIn):null,h=g?.checkIn&&g?.checkOut&&g?.checkOut!=="Active Now"?bt(g.checkOut):null,w=y&&A?window.AppAttendance.buildDateTime(y,A):null,v=y&&h?window.AppAttendance.buildDateTime(y,h):null,_=!!(w&&v&&v>w),L=_?v-w:null,b=typeof g?.durationMs=="number"?g.durationMs:L,x=typeof b=="number"?Math.max(0,b)/(1e3*60*60):0;let D;return Object.prototype.hasOwnProperty.call(g||{},"attendanceEligible")?D=g.attendanceEligible===!0:S==="staff_manual_work"?D=x>=4:D=!0,{dateIso:y,inDt:w,outDt:v,validTimeRange:_,resolvedDurationMs:b,workedHours:x,inferredSource:S,inferredAttendanceEligible:D}},p=(g,y)=>{const k=window.AppAttendance.normalizeType(g?.type);let T=0;y.inferredSource==="staff_manual_work"?y.workedHours>=8?T=100:y.workedHours>=4&&(T=50):T=Number(window.AppAttendance.getDayCredit(k)||0)*100;let S=0;return S+=T,S+=Math.min(20,Math.floor(Math.max(0,y.workedHours||0))),y.inferredAttendanceEligible&&(S+=40),y.validTimeRange&&(S+=10),y.inferredSource==="checkin_checkout"?S+=8:y.inferredSource==="admin_override"?S+=6:S+=4,g?.isManualOverride&&(S+=4),(String(g?.type||"").includes("Leave")||g?.location==="On Leave")&&(S+=6),S+=Number(g?.id||0)/1e13,S};for(const g of e){if(!g||!g.id)continue;const y=c(g);d.set(g.id,y);const k=g.user_id||g.userId;if(!k||!y.dateIso)continue;const T=`${k}|${y.dateIso}`;l.has(T)||l.set(T,[]),l.get(T).push(g)}const m=new Map;for(const[g,y]of l.entries()){if(!y||y.length===0)continue;const k=y.slice().sort((T,S)=>{const A=d.get(T.id)||c(T),h=d.get(S.id)||c(S);return p(S,h)-p(T,A)});m.set(g,k[0]?.id)}for(const g of e){if(t++,!g||!g.id){i++;continue}const y=window.AppAttendance.normalizeType(g.type),k=d.get(g.id)||c(g),T=k.dateIso,S=k.inDt,A=k.outDt,h=k.resolvedDurationMs,w=k.workedHours,v=k.inferredSource;let _=k.inferredAttendanceEligible;const L=g.user_id||g.userId,b=L&&T?`${L}|${T}`:null,x=b?m.get(b):null,D=!!(x&&x!==g.id),R=!!(g.checkIn&&g.checkOut&&g.checkOut!=="Active Now")&&!!(S&&A&&A<=S),I=!!(g.autoCheckout&&String(g.missedCheckoutReasonStatus||"").toLowerCase()==="approved");let N=g.type,P=g.dayCredit,B=g.lateCountable,O=g.extraWorkedMs||0;if(D&&(_=!1,String(g.type||"").includes("Leave")||(N="Work Log"),P=0,B=!1,O=0,o++),R&&(_=!1,String(g.type||"").includes("Leave")||(N="Work Log"),P=0,B=!1,O=0,r++),I&&!D&&!R)N="Present",P=window.AppAttendance&&typeof window.AppAttendance.getDayCredit=="function"?window.AppAttendance.getDayCredit("Present"):1,B=!1,O=0;else if(v==="staff_manual_work"&&!D&&!R)w>=8?(N="Present",P=1):w>=4?(N="Half Day",P=.5):(N="Work Log",P=0),B=!1,O=0;else if(!g.isManualOverride&&_&&!(s.has(y)||String(y).includes("Leave")||y==="Office")&&S&&A&&A>S){const J=window.AppAttendance.evaluateAttendanceStatus(S,A-S);N=J.status,P=J.dayCredit,B=J.lateCountable,O=J.extraWorkedMs||0}const j={...g,entrySource:v,attendanceEligible:_,type:N,dayCredit:typeof P=="number"?P:0,lateCountable:B===!0,extraWorkedMs:O||0,durationMs:typeof h=="number"?h:null,missedCheckoutApprovedAsFullDay:I?!0:g.missedCheckoutApprovedAsFullDay,policyVersion:"v2"};if(!(g.entrySource!==j.entrySource||g.attendanceEligible!==j.attendanceEligible||g.type!==j.type||g.dayCredit!==j.dayCredit||g.lateCountable!==j.lateCountable||(g.extraWorkedMs||0)!==(j.extraWorkedMs||0)||g.durationMs!==j.durationMs||g.policyVersion!=="v2")){i++;continue}await window.AppDB.put("attendance",j),n++}alert(`Migration complete.
Scanned: ${t}
Updated: ${n}
Skipped: ${i}
Duplicates neutralized: ${o}
Invalid-time logs neutralized: ${r}`);const u=window.location.hash.slice(1),f=document.getElementById("page-content");if(!f)return;u==="policy-test"?f.innerHTML=await F.renderPolicyTest():u==="dashboard"?(f.innerHTML=await F.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()):u==="salary"?(f.innerHTML=await F.renderSalaryProcessing(),window.app_recalculateAllSalaries&&window.app_recalculateAllSalaries()):u==="timesheet"&&(f.innerHTML=await F.renderTimesheet())}catch(e){console.error("Attendance migration failed:",e),alert("Migration failed: "+e.message)}};window.app_deleteUser=async a=>{if(await window.appConfirm("Are you sure you want to delete this user? This action cannot be undone."))try{await window.AppDB.delete("users",a),alert("User deleted successfully.");const e=document.getElementById("page-content");e&&(e.innerHTML=await F.renderAdmin())}catch(e){alert("Failed to delete user: "+e.message)}};window.app_recalculateRow=a=>{const e=parseFloat(a.querySelector(".base-salary-input").value)||0,t=e/22,n=parseFloat(a.querySelector(".unpaid-leaves-count").innerText)||0,i=parseFloat(a.querySelector(".late-count")?.innerText||"0")||0,s=Math.floor(i/(C.LATE_GRACE_COUNT||3))*(C.LATE_DEDUCTION_PER_BLOCK||.5),o=parseFloat(a.querySelector(".extra-work-hours")?.innerText||"0")||0,r=Math.floor(o/(C.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4))*(C.LATE_DEDUCTION_PER_BLOCK||.5),d=Math.max(0,s-r),l=n+d,c=parseFloat(document.getElementById("global-tds-percent").value)||0,p=a.querySelector(".tds-input");p&&!p.dataset.manual&&(p.value=c);const m=p?parseFloat(p.value)||0:c,u=Math.round(t*l),f=a.querySelector(".late-deduction-days"),g=a.querySelector(".late-deduction-raw"),y=a.querySelector(".penalty-offset-days"),k=a.querySelector(".deduction-days"),T=a.querySelector(".attendance-deduction-amount");g&&(g.innerText=s.toFixed(1)),y&&(y.innerText=r.toFixed(1)),f&&(f.innerText=d.toFixed(1)),k&&(k.innerText=l.toFixed(1)),T&&(T.innerText="-Rs "+u.toLocaleString()),a.querySelector(".deduction-amount").innerText="-Rs "+u.toLocaleString();const S=a.querySelector(".salary-input");S.dataset.manual||(S.value=Math.max(0,e-u));const A=parseFloat(S.value)||0,h=Math.round(A*(m/100)),w=Math.max(0,A-h);a.querySelector(".tds-amount").innerText="Rs "+h.toLocaleString(),a.querySelector(".tds-amount").dataset.value=h,a.querySelector(".final-net-salary").innerText="Rs "+w.toLocaleString(),a.querySelector(".final-net-salary").dataset.value=w};const fn=a=>{const e=parseFloat(a.querySelector(".unpaid-leaves-count")?.innerText||"0")||0,t=parseFloat(a.querySelector(".late-count")?.innerText||"0")||0,n=parseFloat(a.querySelector(".extra-work-hours")?.innerText||"0")||0,i=Math.floor(t/(C.LATE_GRACE_COUNT||3))*(C.LATE_DEDUCTION_PER_BLOCK||.5),s=Math.floor(n/(C.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4))*(C.LATE_DEDUCTION_PER_BLOCK||.5),o=Math.max(0,i-s),r=e+o;return{unpaidLeaves:e,lateCount:t,extraWorkedHours:n,rawLateDeductionDays:i,penaltyOffsetDays:s,lateDeductionDays:o,deductionDays:r}};window.app_recalculateAllSalaries=()=>{document.querySelectorAll("tr[data-user-id]").forEach(a=>{window.app_recalculateRow(a)})};const Rt=(a,e=new Date)=>{if(/^\d{4}-\d{2}$/.test(String(a||"").trim())){const[t,n]=String(a).split("-").map(Number);if(Number.isFinite(t)&&Number.isFinite(n)&&n>=1&&n<=12)return{year:t,monthIndex:n-1}}return{year:e.getFullYear(),monthIndex:e.getMonth()}};window.app_toggleSalaryPeriodMode=function(){const a=document.getElementById("salary-period-mode")?.value||"single",e=document.getElementById("salary-period-single-wrap"),t=document.getElementById("salary-period-range-wrap");e&&(e.style.display=a==="range"?"none":"block"),t&&(t.style.display=a==="range"?"flex":"none")};window.app_getSalaryPayPeriodInfo=function(){const a=new Date;if((document.getElementById("salary-period-mode")?.value||"single")==="range"){const r=document.getElementById("salary-pay-period-from")?.value||"",d=document.getElementById("salary-pay-period-to")?.value||"";let l=Rt(r,a),c=Rt(d,a);const p=l.year*100+(l.monthIndex+1);if(c.year*100+(c.monthIndex+1)<p){const k=l;l=c,c=k}const u=new Date(l.year,l.monthIndex,1),f=new Date(c.year,c.monthIndex+1,0),g=`${l.year}-${String(l.monthIndex+1).padStart(2,"0")}`,y=`${c.year}-${String(c.monthIndex+1).padStart(2,"0")}`;return{mode:"range",startDate:u,endDate:f,startKey:g,endKey:y,key:`${g}_to_${y}`,label:`${u.toLocaleDateString("en-GB",{month:"long",year:"numeric"})} to ${f.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}`}}const t=document.getElementById("salary-pay-period")?.value||"",n=Rt(t,a),i=new Date(n.year,n.monthIndex,1),s=new Date(n.year,n.monthIndex+1,0),o=`${n.year}-${String(n.monthIndex+1).padStart(2,"0")}`;return{mode:"single",startDate:i,endDate:s,startKey:o,endKey:o,key:o,label:i.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}};window.app_saveAllSalaries=async()=>{const a=document.querySelectorAll("tr[data-user-id]"),e=[],t=[],n=window.app_getSalaryPayPeriodInfo(),i=n.key,s=document.getElementById("salary-pay-date")?.value||"",o=s?new Date(s).getTime():Date.now(),r=parseFloat(document.getElementById("global-tds-percent").value)||0;for(const d of a){const l=d.dataset.userId,c=d.querySelector(".base-salary-input").value,p=d.querySelector(".salary-input").value,m=d.querySelector(".comment-input").value,u=d.querySelector(".tds-input"),f=u?parseFloat(u.value)||0:r,g=d.querySelector(".tds-amount").dataset.value||0,y=d.querySelector(".final-net-salary").dataset.value||0,k=fn(d),T=k.unpaidLeaves,S=k.lateCount,A=k.extraWorkedHours,h=k.rawLateDeductionDays,w=k.penaltyOffsetDays,v=k.lateDeductionDays,_=k.deductionDays,L=Number(String(d.querySelector(".attendance-deduction-amount")?.innerText||"0").replace(/[^0-9.-]+/g,"")),b=String(d.querySelector(".employee-id-input")?.value||"").trim(),x=String(d.querySelector(".designation-input")?.value||"").trim(),D=String(d.querySelector(".department-input")?.value||"").trim(),M=String(d.querySelector(".join-date-input")?.value||"").trim(),R=M?b||xt(M,l):"NA",I=String(d.querySelector(".bank-name-input")?.value||"").trim(),N=String(d.querySelector(".bank-account-input")?.value||"").trim(),P=String(d.querySelector(".pan-input")?.value||"").trim(),B=String(d.querySelector(".uan-input")?.value||"").trim(),O=Number(d.querySelector(".other-allowances-input")?.value||0),V=Number(d.querySelector(".pf-input")?.value||0),j=Number(d.querySelector(".professional-tax-input")?.value||0),W=Number(d.querySelector(".loan-advance-input")?.value||0);if(d.querySelector(".comment-input").required&&!m){alert(`Please provide a comment for user ID: ${l} as the salary was adjusted.`);return}e.push({id:`salary_${l}_${i}`,userId:l,month:i,periodMode:n.mode,periodStart:n.startKey,periodEnd:n.endKey,periodLabel:n.label,payDate:o,baseAmount:Number(c),otherAllowances:O,providentFund:V,professionalTax:j,loanAdvance:W,employeeId:R,designation:x,department:D,joinDate:M||null,bankName:I,bankAccount:N,pan:P,uan:B,attendanceDeduction:L,deductions:Number(d.querySelector(".deduction-amount").innerText.replace(/[^0-9.-]+/g,"")),unpaidLeaves:T,lateCount:S,extraWorkedHours:A,lateDeductionRawDays:h,penaltyOffsetDays:w,lateDeductionDays:v,deductionDays:_,adjustedAmount:Number(p),tdsPercent:f,tdsAmount:Number(g),finalNet:Number(y),comment:m||"",processedAt:Date.now()}),t.push({id:l,baseSalary:Number(c),tdsPercent:f,employeeId:R,designation:x,dept:D,joinDate:M||null,bankName:I,bankAccount:N,pan:P,uan:B,otherAllowances:O,providentFund:V,professionalTax:j,loanAdvance:W})}try{for(const l of e)await window.AppDB.put("salaries",l);for(const l of t){const c=await window.AppDB.get("users",l.id);c&&(Object.assign(c,l),await window.AppDB.put("users",c))}alert("All records and TDS details saved successfully!");const d=document.getElementById("page-content");d.innerHTML=await F.renderSalaryProcessing()}catch(d){console.error("Salary Save Error:",d),alert("Failed to save records: "+d.message)}};window.app_exportSalaryCSV=()=>{const a=document.querySelectorAll("tr[data-user-id]");let e=`Staff Name,Emp ID,Designation,Department,Join Date,Bank Name,Bank Account,PAN,UAN,Base Salary,Other Allowances,PF,Professional Tax,Loan Advance,Present,Late,Unpaid Leaves,Extra Work Hours,Late Deduction Raw,Penalty Offset Days,Late Deduction Days,Total Deduction Days,Attendance Deduction,Total Deductions,Adjusted Salary,TDS (%),TDS Amount,Final Net,Comment
`;a.forEach(o=>{const r=o.querySelector('div[style*="font-weight: 600"]').innerText,d=o.querySelector(".base-salary-input").value,l=o.querySelector(".employee-id-input")?.value||"",c=o.querySelector(".designation-input")?.value||"",p=o.querySelector(".department-input")?.value||"",m=o.querySelector(".join-date-input")?.value||"",u=o.querySelector(".bank-name-input")?.value||"",f=o.querySelector(".bank-account-input")?.value||"",g=o.querySelector(".pan-input")?.value||"",y=o.querySelector(".uan-input")?.value||"",k=o.querySelector(".other-allowances-input")?.value||"0",T=o.querySelector(".pf-input")?.value||"0",S=o.querySelector(".professional-tax-input")?.value||"0",A=o.querySelector(".loan-advance-input")?.value||"0",h=o.querySelector(".present-count")?.innerText||"0",w=o.querySelector(".late-count")?.innerText||"0",v=o.querySelector(".unpaid-leaves-count")?.innerText||"0",_=o.querySelector(".extra-work-hours")?.innerText||"0",L=o.querySelector(".late-deduction-raw")?.innerText||"0",b=o.querySelector(".penalty-offset-days")?.innerText||"0",x=o.querySelector(".late-deduction-days")?.innerText||"0",D=o.querySelector(".deduction-days")?.innerText||"0",M=(o.querySelector(".attendance-deduction-amount")?.innerText||"").replace(/[^0-9.-]+/g,"")||"0",R=(o.querySelector(".deduction-amount").innerText||"").replace(/[^0-9.-]+/g,""),I=o.querySelector(".salary-input").value,N=parseFloat(document.getElementById("global-tds-percent").value)||0,P=o.querySelector(".tds-input"),B=P&&P.value!==""?P.value:N,O=(o.querySelector(".tds-amount").innerText||"").replace(/[^0-9.-]+/g,""),V=(o.querySelector(".final-net-salary").innerText||"").replace(/[^0-9.-]+/g,""),j=o.querySelector(".comment-input").value;e+=`"${r}","${l}","${c}","${p}","${m}","${u}","${f}","${g}","${y}",${d},${k},${T},${S},${A},${h},${w},${v},${_},${L},${b},${x},${D},${M},${R},${I},${B},${O},${V},"${j}"
`});const t=new Blob([e],{type:"text/csv"}),n=window.URL.createObjectURL(t),i=document.createElement("a"),s=window.app_getSalaryPayPeriodInfo();i.setAttribute("href",n),i.setAttribute("download",`Salaries_${s.key.replace(/[^a-zA-Z0-9_-]/g,"_")}.csv`),i.click()};const Ut=(a,e=4)=>{const t=String(a||"").trim();return t?t.length<=e?t:`${"*".repeat(Math.max(0,t.length-e))}${t.slice(-e)}`:"NA"},As=a=>{const e=Math.floor(Number(a)||0);if(e===0)return"Zero";const t=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"],n=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"],i=m=>{if(m<20)return t[m];const u=Math.floor(m/10),f=m%10;return`${n[u]}${f?` ${t[f]}`:""}`.trim()},s=m=>{const u=Math.floor(m/100),f=m%100;return u?`${t[u]} Hundred${f?` ${i(f)}`:""}`.trim():i(f)};let o=e;const r=Math.floor(o/1e7);o%=1e7;const d=Math.floor(o/1e5);o%=1e5;const l=Math.floor(o/1e3);o%=1e3;const c=o,p=[];return r&&p.push(`${i(r)} Crore`),d&&p.push(`${i(d)} Lakh`),l&&p.push(`${i(l)} Thousand`),c&&p.push(s(c)),p.join(" ").trim()};window.app_printSalarySlip=function(){const a=document.getElementById("salary-slip-modal");if(!a)return;const e=a.querySelector(".salary-slip-print-root");e&&(document.body.classList.add("salary-slip-print-mode"),e.classList.add("print-active"),setTimeout(()=>{window.print(),setTimeout(()=>{e.classList.remove("print-active"),document.body.classList.remove("salary-slip-print-mode")},150)},60))};window.app_generateSalarySlip=async function(a){try{const e=document.querySelector(`tr[data-user-id="${a}"]`);if(!e){alert("Unable to locate salary row for this user.");return}const t=await window.AppDB.get("users",a);if(!t){alert("User details not found.");return}const n=new Date,i=window.app_getSalaryPayPeriodInfo(),s=i.label,o=He(i.startDate),r=He(i.endDate),d=document.getElementById("salary-pay-date")?.value||"",l=He(d||n),c=us(n),p=`CRWI-${i.key.replace(/[^a-zA-Z0-9]/g,"")}-${a}-${String(n.getTime()).slice(-5)}`,m=Number(e.querySelector(".base-salary-input")?.value||0),u=Number(e.querySelector(".salary-input")?.value||0),f=Number(e.querySelector(".tds-input")?.value||0),g=Number(e.querySelector(".tds-amount")?.dataset?.value||"0"),y=Number(e.querySelector(".final-net-salary")?.dataset?.value||"0"),k=Number(String(e.querySelector(".attendance-deduction-amount")?.innerText||"0").replace(/[^0-9.-]+/g,""))||0,T=fn(e),S=T.rawLateDeductionDays,A=T.penaltyOffsetDays,h=T.lateDeductionDays,w=T.deductionDays,v=T.unpaidLeaves,_=T.lateCount,L=String(e.querySelector(".comment-input")?.value||"").trim(),b=Number(e.querySelector(".other-allowances-input")?.value||t.otherAllowances||0),x=m+b,D=Number(e.querySelector(".loan-advance-input")?.value||t.loanAdvance||0),M=Number(e.querySelector(".pf-input")?.value||t.providentFund||0),R=Number(e.querySelector(".professional-tax-input")?.value||t.professionalTax||0),I=String(e.querySelector(".join-date-input")?.value||t.joinDate||"").trim(),N=String(e.querySelector(".employee-id-input")?.value||t.employeeId||"").trim(),P=I?N||xt(I,t.id):"NA",B=String(e.querySelector(".designation-input")?.value||t.designation||t.role||"").trim(),O=String(e.querySelector(".department-input")?.value||t.dept||t.department||"").trim(),V=String(e.querySelector(".join-date-input")?.value||t.joinDate||"").trim(),j=String(e.querySelector(".bank-name-input")?.value||t.bankName||"").trim(),W=String(e.querySelector(".bank-account-input")?.value||t.bankAccount||t.accountNumber||"").trim(),J=String(e.querySelector(".pan-input")?.value||t.pan||t.PAN||"").trim(),E=String(e.querySelector(".uan-input")?.value||t.uan||t.UAN||"").trim(),U=k+g+D+M+R,G=`${As(y)} Rupees Only`,q=[{label:"Attendance Deduction",amount:k,remarks:`Unpaid Leaves: ${v}, Late Count: ${_}, Late Raw: ${S.toFixed(1)}, Offset: ${A.toFixed(1)}, Late Deduction: ${h.toFixed(1)}, Total Deduction Days: ${w.toFixed(1)}`},{label:"TDS",amount:g,remarks:`Applied at ${f.toFixed(2)}%`},{label:"Provident Fund",amount:M,remarks:M?"Configured as per employee profile":"NA"},{label:"Professional Tax",amount:R,remarks:R?"Configured as per employee profile":"NA"},{label:"Loan / Advance",amount:D,remarks:D?"Recovered in this cycle":"Nil"}],Q=ne=>ms(ne),ee=`
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
                                <div>Pay Period: ${s} (${o} to ${r})</div>
                                <div>Pay Date: ${l}</div>
                            </div>

                            <div class="salary-slip-section">
                                <h4>Employee Details</h4>
                                <div class="salary-slip-grid">
                                    <div><b>Employee Name:</b> ${t.name||"Staff"}</div>
                                    <div><b>Employee ID:</b> ${P||"NA"}</div>
                                    <div><b>Designation:</b> ${B||"NA"}</div>
                                    <div><b>Department:</b> ${O||"NA"}</div>
                                    <div><b>Date of Joining:</b> ${He(V)}</div>
                                    <div><b>Bank Name:</b> ${j||"NA"}</div>
                                    <div><b>UAN:</b> ${Ut(E)}</div>
                                    <div><b>PAN:</b> ${Ut(J)}</div>
                                    <div><b>Bank A/C:</b> ${Ut(W)}</div>
                                </div>
                            </div>

                            <div class="salary-slip-split">
                                <div class="salary-slip-section">
                                    <h4>Earnings</h4>
                                    <table class="salary-slip-table">
                                        <tr><td>Basic Salary</td><td>${Q(m)}</td></tr>
                                        <tr><td>HRA</td><td>NA</td></tr>
                                        <tr><td>Conveyance Allowance</td><td>NA</td></tr>
                                        <tr><td>Special Allowance</td><td>NA</td></tr>
                                        <tr><td>Other Allowances</td><td>${Q(b)}</td></tr>
                                        <tr class="total"><td>Gross Earnings</td><td>${Q(x)}</td></tr>
                                    </table>
                                </div>
                                <div class="salary-slip-section">
                                    <h4>Deductions (Breakdown)</h4>
                                    <table class="salary-slip-table">
                                        ${q.map(ne=>`<tr><td>${ne.label}<div class="remark">${ne.remarks}</div></td><td>${ne.amount?Q(ne.amount):"NA"}</td></tr>`).join("")}
                                        <tr class="total"><td>Total Deductions</td><td>${Q(U)}</td></tr>
                                    </table>
                                </div>
                            </div>

                            <div class="salary-slip-net">
                                <div><b>Adjusted Salary:</b> ${Q(u)}</div>
                                <div><b>Net Salary:</b> ${Q(y)}</div>
                                <div><b>Net Salary in Words:</b> ${G}</div>
                            </div>

                            <div class="salary-slip-footer">
                                <div>This is a system-generated salary slip and does not require a signature.</div>
                                <div>Generated: ${c} | Payroll Ref ID: ${p}</div>
                                ${L?`<div>Payroll Comment: ${L}</div>`:""}
                            </div>
                        </div>
                    </div>
                </div>
            `;window.app_showModal(ee,"salary-slip-modal")}catch(e){console.error("Salary slip generation failed:",e),alert(`Failed to generate salary slip: ${e.message}`)}};window.app_editTaskStatus=async function(a,e,t){try{const n=window.AppAuth.getUser(),i=t==="completed"?new Date().toISOString().split("T")[0]:null;await window.AppCalendar.updateTaskStatus(a,e,t,i);const s=document.getElementById("page-content");s.innerHTML=await F.renderDashboard(),alert(`Task status updated to: ${t}`)}catch(n){console.error("Failed to update task status:",n),alert("Failed to update task status. Please try again.")}};window.app_reassignTask=async function(a,e,t){try{const n=window.AppAuth.getUser();if(n.role!=="Administrator"&&!n.isAdmin){alert("Only administrators can reassign tasks.");return}await window.AppCalendar.reassignTask(a,e,t);const i=document.getElementById("page-content");i.innerHTML=await F.renderDashboard(),alert("Task reassigned successfully!")}catch(n){console.error("Failed to reassign task:",n),alert("Failed to reassign task. Please try again.")}};window.app_viewTaskDetails=async function(a,e){try{const t=await window.AppDB.get("work_plans",a);if(!t||!t.plans||!t.plans[e]){alert("Task not found.");return}const n=t.plans[e],i=window.AppCalendar.getSmartTaskStatus(t.date,n.status),s={"to-be-started":"#3b82f6","in-process":"#eab308",completed:"#22c55e",overdue:"#ef4444","not-completed":"#6b7280"},o={"to-be-started":"🔵 To Be Started","in-process":"🟡 In Process",completed:"🟢 Completed",overdue:"🔴 Overdue","not-completed":"⚫ Not Completed"},r=`
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
                                    <span style="background: ${s[i]}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.875rem; font-weight: 600;">
                                        ${o[i]}
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
            `;document.getElementById("modal-container").innerHTML=r}catch(t){console.error("Failed to view task details:",t),alert("Failed to load task details.")}};window.app_recalculateRatings=async function(){try{const a=window.AppAuth.getUser();if(a.role!=="Administrator"&&!a.isAdmin){alert("Only administrators can recalculate ratings.");return}if(!await window.appConfirm("This will recalculate ratings for all users. Continue?"))return;const e=await window.AppRating.updateAllRatings();alert(`Successfully updated ratings for ${e.length} users!`);const t=document.getElementById("page-content");t.innerHTML=await F.renderDashboard()}catch(a){console.error("Failed to recalculate ratings:",a),alert("Failed to recalculate ratings. Please try again.")}};window.app_triggerManualAudit=async()=>{if(!await window.appConfirm("Trigger a manual location audit for all active staff?"))return;const a=`Manual Audit @ ${new Date().toLocaleTimeString()}`;try{await window.AppDB.add("system_commands",{type:"audit",slotName:a,timestamp:Date.now(),requestedBy:window.AppAuth.getUser()?.name||"Admin",status:"pending"}),alert("Manual audit command sent. All active staff devices will now perform a stealth check.")}catch(e){console.error("Failed to trigger manual audit:",e),alert("Error: "+e.message)}};window.app_applyAuditFilter=async()=>{const a=document.getElementById("audit-start")?.value,e=document.getElementById("audit-end")?.value,t=document.getElementById("page-content");t&&(t.innerHTML=await F.renderAdmin(a,e),window.AppAnalytics&&window.AppAnalytics.initAdminCharts())};window.app_exportAudits=async()=>{const a=document.getElementById("audit-start")?.value,e=document.getElementById("audit-end")?.value;try{let t=await window.AppDB.getAll("location_audits");if(a&&e&&(t=t.filter(l=>{const c=new Date(l.timestamp).toISOString().split("T")[0];return c>=a&&c<=e})),t.sort((l,c)=>c.timestamp-l.timestamp),t.length===0){alert("No audits found for the selected range.");return}const n=["Timestamp","Date","Time","Staff Member","Slot","Status","Latitude","Longitude"],i=t.map(l=>[l.timestamp,new Date(l.timestamp).toLocaleDateString(),new Date(l.timestamp).toLocaleTimeString(),l.userName||"Unknown",l.slot,l.status,l.lat||"",l.lng||""]),s=[n,...i].map(l=>l.join(",")).join(`
`),o=new Blob([s],{type:"text/csv;charset=utf-8;"}),r=document.createElement("a"),d=URL.createObjectURL(o);r.setAttribute("href",d),r.setAttribute("download",`security_audits_${a||"export"}.csv`),r.style.visibility="hidden",document.body.appendChild(r),r.click(),document.body.removeChild(r)}catch(t){console.error("Export failed:",t),alert("Export failed: "+t.message)}};window.app_changeAnnualYear=a=>{window.app_annualYear=(window.app_annualYear||new Date().getFullYear())+a,window.app_renderAnnualPlanPage()};window.app_toggleAnnualLegendFilter=a=>{const e=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0,overdue:!0,completed:!0};Object.prototype.hasOwnProperty.call(e,a)&&(e[a]=!e[a],window.app_annualLegendFilters=e,window.app_renderAnnualPlanPage())};window.app_showAnnualDayDetails=async a=>{if(!a)return;const e=window._currentPlans||await window.AppCalendar.getPlans(),t=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0},n=window.AppAuth.getUser()||{},i=n.role==="Administrator"||n.isAdmin,s=(window.app_getDayEvents(a,e,{includeAuto:!1,userId:i?null:n.id})||[]).filter(d=>d.type==="leave"?!!t.leave:d.type==="work"?!!t.work:(d.type==="holiday",!!t.event)),o=s.length?s.map(d=>{const l=d.type||"event",c=l==="leave"?"background:#fee2e2;color:#991b1b;":l==="work"?"background:#e0e7ff;color:#3730a3;":l==="holiday"?"background:#f1f5f9;color:#334155;":"background:#dcfce7;color:#166534;",p=l==="work"&&Array.isArray(d.plans)&&d.plans.length?`<ul style="margin:0.5rem 0 0 1rem; padding:0; color:#475569; font-size:0.8rem;">
                    ${d.plans.map(m=>`<li>${window.app_formatTaskWithPostponeChip(m.task||"Work plan item")}</li>`).join("")}
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
            </div>`;window.app_showModal(r,"annual-day-detail-modal")};window.app_toggleAnnualView=a=>{window.app_annualViewMode=a,window.app_renderAnnualPlanPage()};window.app_jumpToAnnualToday=()=>{const a=new Date;window.app_annualYear=a.getFullYear(),window.app_selectedAnnualDate=a.toISOString().split("T")[0],window.app_renderAnnualPlanPage().then(()=>{window.app_showAnnualDayDetails(window.app_selectedAnnualDate)})};window.app_renderAnnualPlanPage=async()=>{const a=document.getElementById("page-content");a&&(a.innerHTML=await F.renderAnnualPlan())};window.app_setAnnualStaffFilter=a=>{window.app_annualStaffFilter=String(a||"").trim(),window.app_renderAnnualPlanPage()};window.app_setAnnualListSearch=a=>{window.app_annualListSearch=String(a||"").trim(),window.app_renderAnnualPlanPage()};window.app_setAnnualListSort=a=>{window.app_annualListSort=String(a||"date-asc").trim(),window.app_renderAnnualPlanPage()};window.app_renderTimesheetPage=async()=>{const a=document.getElementById("page-content");a&&(a.innerHTML=await F.renderTimesheet())};window.app_setTimesheetView=a=>{window.app_timesheetViewMode=a==="calendar"?"calendar":"list",window.app_renderTimesheetPage()};window.app_changeTimesheetMonth=a=>{const e=new Date,t=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:e.getMonth(),n=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:e.getFullYear(),i=new Date(n,t,1);i.setMonth(i.getMonth()+a),window.app_timesheetMonth=i.getMonth(),window.app_timesheetYear=i.getFullYear(),window.app_renderTimesheetPage()};window.app_jumpTimesheetToday=()=>{const a=new Date;window.app_timesheetMonth=a.getMonth(),window.app_timesheetYear=a.getFullYear(),window.app_renderTimesheetPage()};window.app_closeModal=a=>{const e=a&&a.closest?a.closest(".modal-overlay"):null;e&&e.remove()};window.app_getSystemUpdateNotes=()=>[{date:"2026-02-21",summary:"Check for System Update now shows this quick update popup before refreshing."},{date:"2026-02-21",summary:"The update action shortcut was changed from Ctrl+F5 to Ctrl+Shift+R."}];window.app_showSystemUpdatePopup=()=>{const a="system-update-modal",e=it(),t=e.active&&e.buildId&&e.buildId!==e.currentBuildId,n=(window.app_getSystemUpdateNotes()||[]).slice(0,5),i=n.length?n.map(l=>`
                <li style="margin:0 0 0.7rem 0; color:#334155; line-height:1.45;">
                    <span style="display:block; font-size:0.72rem; color:#64748b; font-weight:700;">${z(l.date||"")}</span>
                    <span>${z(l.summary||"")}</span>
                </li>
            `).join(""):'<li style="color:#64748b;">No update notes available.</li>',s=t?`
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0.6rem 0.75rem; margin-bottom:0.8rem;">
                    <div style="font-size:0.78rem; font-weight:700; color:#0f172a;">New version available</div>
                    <div style="font-size:0.74rem; color:#475569; margin-top:0.15rem;">
                        Running build: ${z((e.currentCommitSha||"").slice(0,7)||e.currentBuildId||"local")}
                        ${e.currentBuiltAt?` | Built: ${z(e.currentBuiltAt)}`:""}
                    </div>
                    <div style="font-size:0.74rem; color:#475569; margin-top:0.25rem;">
                        Available build: ${z((e.commitSha||"").slice(0,7)||e.buildId)}
                        ${e.deployedAt?` | Deployed: ${z(e.deployedAt)}`:""}
                    </div>
                    ${e.notes?`<div style="font-size:0.78rem; color:#0f172a; margin-top:0.45rem;">${z(e.notes)}</div>`:""}
                </div>
            `:`
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0.6rem 0.75rem; margin-bottom:0.8rem;">
                    <div style="font-size:0.78rem; font-weight:700; color:#0f172a;">You are on the latest version</div>
                    <div style="font-size:0.74rem; color:#475569; margin-top:0.15rem;">
                        Current build: ${z((e.currentCommitSha||"").slice(0,7)||e.currentBuildId||"local")}
                        ${e.currentBuiltAt?` | Built: ${z(e.currentBuiltAt)}`:""}
                    </div>
                </div>
            `,o=t?"window.app_dismissReleaseUpdatePrompt()":"this.closest('.modal-overlay').remove()",d=`
            <div class="modal-overlay" id="${a}" style="display:flex;">
                <div class="modal-content" style="max-width:560px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.8rem;">
                        <h3 style="margin:0; font-size:1.1rem;">${t?"System Update Available":"System Updates"}</h3>
                        <button type="button" onclick="${o}" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">&times;</button>
                    </div>
                    ${s}
                    <p style="margin:0 0 0.8rem 0; color:#64748b; font-size:0.86rem;">Recent functionality changes</p>
                    <ul style="margin:0; padding-left:1rem; max-height:260px; overflow:auto;">
                        ${i}
                    </ul>
                    <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem;">
                        <button type="button" class="action-btn secondary" onclick="${o}">${t?"Later":"Close"}</button>
                        ${t?`<button type="button" class="action-btn" onclick="this.closest('.modal-overlay').remove(); window.app_forceRefresh();">Update now</button>`:""}
                    </div>
                </div>
            </div>
        `;window.app_showModal(d,a)};const Ds=async a=>{if(!a?.waiting||!navigator.serviceWorker)return!1;const e=a.waiting;return new Promise(t=>{let n=!1;const i=r=>{n||(n=!0,navigator.serviceWorker.removeEventListener("controllerchange",s),clearTimeout(o),t(r))},s=()=>i(!0),o=setTimeout(()=>i(!1),3e3);navigator.serviceWorker.addEventListener("controllerchange",s,{once:!0}),e.postMessage({type:"SKIP_WAITING"})})};window.app_forceRefresh=async()=>{try{if(navigator.serviceWorker){const a=await navigator.serviceWorker.getRegistrations();zt?.update&&await zt.update();for(const e of a)await Ds(e)}if(window.caches){const a=await caches.keys();await Promise.all(a.map(e=>caches.delete(e)))}}catch(a){console.warn("Force refresh cleanup failed:",a)}Zt(!0),window.location.reload()};ns();console.log("App.js Loaded & Globals Ready");
