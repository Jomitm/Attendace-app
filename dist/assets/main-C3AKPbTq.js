(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function t(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(n){if(n.ep)return;n.ep=!0;const s=t(n);fetch(n.href,s)}})();const U={WORK_START_TIME:"09:00",LATE_CUTOFF_TIME:"09:15",WORK_END_TIME:"17:00",LATE_CUTOFF_MINUTES:555,MINOR_LATE_END_MINUTES:615,LATE_END_MINUTES:720,POST_NOON_END_MINUTES:810,AFTERNOON_START_MINUTES:720,EARLY_DEPARTURE_MINUTES:1020,FY_START_MONTH:3,IS_SATURDAY_OFF:i=>{const t=new Date(i).getDate(),a=Math.ceil(t/7);return a===2||a===4},LATE_GRACE_COUNT:3,LATE_DEDUCTION_PER_BLOCK:.5,EXTRA_HOURS_FOR_HALF_DAY_OFFSET:4,READ_CACHE_TTLS:{users:6e4,settings:3e5,minutes:3e4,attendanceSummary:3e4,staffMessages:2e4,dailySummaryReadMs:6e4},READ_OPT_FLAGS:{FF_READ_OPT_DB_QUERIES:!0,FF_READ_OPT_TARGETED_REALTIME:!0,FF_READ_OPT_ANALYTICS_CACHE:!0,FF_SHARED_DAILY_SUMMARY:!0,FF_SUMMARY_LOCKING:!0,ENABLE_SIMULATION_MODULE:!1,ENABLE_READ_TELEMETRY:!0,ENABLE_PRESENCE_HEARTBEAT:!1},SUMMARY_POLICY:{STALENESS_MS:1440*60*1e3,TEAM_ACTIVITY_LIMIT:15,LOCK_TTL_MS:9e4,SCHEMA_VERSION:1,RECOMPUTE_CUTOFF_HOUR_IST:17,FALLBACK_TO_PREVIOUS_DAY:!0}};typeof window<"u"&&(window.AppConfig=U,console.log("App Config Loaded (ES Module)"));const da={apiKey:"AIzaSyC7a8AxukI0-egXimYTedwCa2RFnMTBu84",authDomain:"crwiattendance.firebaseapp.com",projectId:"crwiattendance",storageBucket:"crwiattendance.firebasestorage.app",messagingSenderId:"462155106938",appId:"1:462155106938:web:18291b04a5a3bec185c9c3",measurementId:"G-X6W45TV4QR"};typeof firebase<"u"&&!firebase.apps.length&&(firebase.initializeApp(da),console.log("Firebase Initialized (Compat Mode)"));const Ct=typeof firebase<"u"?firebase.firestore():null;typeof window<"u"&&(window.AppFirestore=Ct);class la{constructor(){this.db=Ct,this.cache=new Map,this.telemetry={get:0,getAll:0,query:0,queryMany:0,listen:0,listenQuery:0,writes:0,docsRead:0,byCollection:{}}}async init(){if(!this.db){console.error("Firebase not initialized! Check config.");return}console.log("Firestore adapter ready.")}getFlags(){return U&&U.READ_OPT_FLAGS||{}}track(e,t,a=0){this.getFlags().ENABLE_READ_TELEMETRY&&(typeof this.telemetry[e]=="number"&&(this.telemetry[e]+=1),this.telemetry.docsRead+=Math.max(0,Number(a)||0),this.telemetry.byCollection[t]||(this.telemetry.byCollection[t]={ops:0,docsRead:0}),this.telemetry.byCollection[t].ops+=1,this.telemetry.byCollection[t].docsRead+=Math.max(0,Number(a)||0))}getReadTelemetry(){return JSON.parse(JSON.stringify(this.telemetry))}clearReadTelemetry(){this.telemetry={get:0,getAll:0,query:0,queryMany:0,listen:0,listenQuery:0,writes:0,docsRead:0,byCollection:{}}}getCacheKey(e,t,a={}){return`${e}:${t}:${JSON.stringify(a)}`}invalidateCollectionCache(e){const t=`:${e}:`;for(const a of this.cache.keys())a.includes(t)&&this.cache.delete(a)}async getCached(e,t,a){const n=Date.now(),s=this.cache.get(e);if(s&&s.expiresAt>n)return s.value;const r=await a();return this.cache.set(e,{value:r,expiresAt:n+Math.max(0,Number(t)||0)}),r}async getOrGenerateSummary(e,t,a){if(!e||typeof t!="function")throw new Error("getOrGenerateSummary requires a key and generator function.");const n=this.getCacheKey("summary","computed",{summaryKey:e}),s=typeof a=="number"?a:U?.READ_CACHE_TTLS?.attendanceSummary||3e4;return this.getCached(n,s,t)}async sleep(e){return new Promise(t=>setTimeout(t,Math.max(0,Number(e)||0)))}getSummarySchemaVersion(){return Number(U?.SUMMARY_POLICY?.SCHEMA_VERSION||1)}getIstNow(){const e=new Date;return new Date(e.toLocaleString("en-US",{timeZone:"Asia/Kolkata"}))}toDateKey(e){const t=e instanceof Date?e:new Date(e),a=t.getFullYear(),n=String(t.getMonth()+1).padStart(2,"0"),s=String(t.getDate()).padStart(2,"0");return`${a}-${n}-${s}`}getISTDateKeys(){const e=this.getIstNow(),t=new Date(e);return t.setDate(t.getDate()-1),{todayKey:this.toDateKey(e),yesterdayKey:this.toDateKey(t)}}shouldRecomputeNowIST(e){const t=Number.isFinite(Number(e))?Number(e):Number(U?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST||17);return this.getIstNow().getHours()>=Math.max(0,Math.min(23,t))}isSummaryFresh(e,t){if(!e||typeof e!="object")return!1;const a=Number(e.generatedAt||0),n=Number(e.version||0);return!a||!n||n!==this.getSummarySchemaVersion()?!1:Date.now()-a<=Math.max(0,Number(t)||0)}async getDailySummary(e){const t=String(e||"").trim();if(!t)return null;const a=U?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4,n=this.getCacheKey("dailySummary","daily_summaries",{key:t});return this.getCached(n,a,()=>this.get("daily_summaries",t))}listenDailySummary(e,t){const a=String(e||"").trim();if(!a)return null;const n=this.getCacheKey("dailySummary","daily_summaries",{key:a});return this.listenDoc("daily_summaries",a,(s,r)=>{if(s){const d=U?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4;this.cache.set(n,{value:s,expiresAt:Date.now()+d})}t&&t(s,r)})}async getSummaryByDateKey(e){return this.getDailySummary(e)}async getLatestSuccessfulSummaryMeta(){const e=U?.READ_CACHE_TTLS?.dailySummaryReadMs||6e4,t=this.getCacheKey("dailySummaryMeta","daily_summaries_meta",{key:"latest_success"});return this.getCached(t,e,()=>this.get("daily_summaries_meta","latest_success"))}async setLatestSuccessfulSummaryMeta({dateKey:e,generatedAt:t,version:a}={}){const n=String(e||"").trim();if(!n)return;const s={id:"latest_success",dateKey:n,generatedAt:Number(t||Date.now()),version:Number(a||this.getSummarySchemaVersion())};await this.put("daily_summaries_meta",s)}async getDailySummaryWithFallback({todayKey:e,yesterdayKey:t,staleAfterMs:a}={}){const n=Math.max(1e3,Number(a)||Number(U?.SUMMARY_POLICY?.STALENESS_MS)||864e5),s=U?.SUMMARY_POLICY?.FALLBACK_TO_PREVIOUS_DAY!==!1,r=await this.getSummaryByDateKey(e);if(this.isSummaryFresh(r,n))return{summary:r,source:"today"};if(s){const l=await this.getSummaryByDateKey(t);if(l&&typeof l=="object")return{summary:l,source:"yesterday"}}const d=await this.getLatestSuccessfulSummaryMeta(),o=String(d?.dateKey||"").trim();if(o){const l=await this.getSummaryByDateKey(o);if(l&&typeof l=="object")return{summary:l,source:"latest_success"}}return{summary:r||null,source:"none"}}async putDailySummary(e,t={}){const a=String(e||"").trim();if(!a)throw new Error("putDailySummary requires dateKey.");const n={id:a,dateKey:a,version:this.getSummarySchemaVersion(),...t};return this.put("daily_summaries",n)}async acquireSummaryLock(e,t,a){const n=String(e||"").trim(),s=String(t||"").trim();if(!n||!s||!this.db||!this.db.runTransaction)return!1;if(U?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING===!1)return!0;const r=Math.max(1e3,Number(a)||Number(U?.SUMMARY_POLICY?.LOCK_TTL_MS)||9e4),d=this.db.collection("summary_locks").doc(n),o=Date.now();try{return await this.db.runTransaction(async c=>{const p=await c.get(d);if(p.exists){const m=p.data()||{},u=String(m.ownerId||"");if(Number(m.expiresAt||0)>o&&u&&u!==s)return!1}return c.set(d,{id:n,dateKey:n,ownerId:s,createdAt:o,expiresAt:o+r},{merge:!0}),!0})===!0}catch(l){return console.warn("Failed to acquire summary lock:",l),!1}}async releaseSummaryLock(e,t){const a=String(e||"").trim(),n=String(t||"").trim();if(!a||!n||!this.db||!this.db.runTransaction||U?.READ_OPT_FLAGS?.FF_SUMMARY_LOCKING===!1)return;const s=this.db.collection("summary_locks").doc(a);try{await this.db.runTransaction(async r=>{const d=await r.get(s);if(!d.exists)return;const o=d.data()||{};String(o.ownerId||"")===n&&r.delete(s)})}catch(r){console.warn("Failed to release summary lock:",r)}}async getOrCreateDailySummary({dateKey:e,yesterdayKey:t,generatorFn:a,staleAfterMs:n,lockTtlMs:s}={}){const r=this.getISTDateKeys(),d=String(e||r.todayKey||"").trim(),o=String(t||r.yesterdayKey||"").trim();if(!d||typeof a!="function")throw new Error("getOrCreateDailySummary requires dateKey and generatorFn.");const l=Math.max(1e3,Number(n)||Number(U?.SUMMARY_POLICY?.STALENESS_MS)||864e5),c=Math.max(1e3,Number(s)||Number(U?.SUMMARY_POLICY?.LOCK_TTL_MS)||9e4),p=String(window.AppAuth?.getUser?.()?.id||`anon_${Math.random().toString(36).slice(2,10)}`),m=await this.getDailySummaryWithFallback({todayKey:d,yesterdayKey:o,staleAfterMs:l});if(m.summary&&m.source==="today"&&this.isSummaryFresh(m.summary,l))return{...m.summary,_source:"shared_today"};if(!this.shouldRecomputeNowIST(U?.SUMMARY_POLICY?.RECOMPUTE_CUTOFF_HOUR_IST))return m.summary?{...m.summary,_source:`fallback_${m.source}`}:null;if(await this.acquireSummaryLock(d,p,c))try{const h={...await a()||{},generatedAt:Date.now(),generatedBy:p,version:this.getSummarySchemaVersion()};return await this.putDailySummary(d,h),await this.setLatestSuccessfulSummaryMeta({dateKey:d,generatedAt:h.generatedAt,version:h.version}),{dateKey:d,...h,_source:"generated"}}finally{await this.releaseSummaryLock(d,p)}const y=[350,700,1200,1800];for(const g of y){await this.sleep(g);const h=await this.getDailySummary(d);if(this.isSummaryFresh(h,l))return{...h,_source:"shared"}}return m.summary?{...m.summary,_source:`fallback_${m.source}`}:null}applyFilters(e,t=[]){let a=e;return(t||[]).forEach(n=>{!n||!n.field||!n.operator||(a=a.where(n.field,n.operator,n.value))}),a}applyOptions(e,t={}){let a=e;return t.orderBy&&(Array.isArray(t.orderBy)?t.orderBy:[t.orderBy]).forEach(s=>{s&&(typeof s=="string"?a=a.orderBy(s):s.field&&(a=a.orderBy(s.field,s.direction||"asc")))}),t.limit&&(a=a.limit(t.limit)),t.startAt!==void 0&&(a=a.startAt(t.startAt)),t.endAt!==void 0&&(a=a.endAt(t.endAt)),a}async getAll(e){try{const a=(await this.db.collection(e).get()).docs.map(n=>({...n.data(),id:n.id}));return this.track("getAll",e,a.length),a}catch(t){throw console.error(`Error getting all from ${e}:`,t),t}}async get(e,t){if(!t)return null;try{const a=String(t),s=await this.db.collection(e).doc(a).get();return s.exists?(this.track("get",e,1),{...s.data(),id:s.id}):(this.track("get",e,0),null)}catch(a){throw console.error(`Error getting ${t} from ${e}:`,a),a}}async add(e,t){if(t.id)return this.put(e,t);try{const a=await this.db.collection(e).add(t);return this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"add"}})),a.id}catch(a){throw console.error(`Error adding to ${e}:`,a),a}}async put(e,t){if(!t.id)throw new Error("Item must have an ID for 'put' operation.");try{const a=String(t.id);return await this.db.collection(e).doc(a).set(t,{merge:!0}),this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"put"}})),a}catch(a){throw console.error(`Error putting ${t.id} to ${e}:`,a),a}}async delete(e,t){if(t)try{const a=String(t);await this.db.collection(e).doc(a).delete(),this.telemetry.writes+=1,this.invalidateCollectionCache(e),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:db-write",{detail:{collection:e,op:"delete"}}))}catch(a){throw console.error(`Error deleting ${t} from ${e}:`,a),a}}async query(e,t,a,n){try{const r=(await this.db.collection(e).where(t,a,n).get()).docs.map(d=>({...d.data(),id:d.id}));return this.track("query",e,r.length),r}catch(s){throw console.error(`Error querying ${e}:`,s),s}}async queryMany(e,t=[],a={}){if(!this.getFlags().FF_READ_OPT_DB_QUERIES)return this.getAll(e);try{let s=this.db.collection(e);s=this.applyFilters(s,t),s=this.applyOptions(s,a);const d=(await s.get()).docs.map(o=>({...o.data(),id:o.id}));return this.track("queryMany",e,d.length),d}catch(s){return console.warn(`queryMany failed for ${e}, falling back to getAll`,s),this.getAll(e)}}async getManyByIds(e,t=[]){const a=Array.from(new Set((t||[]).filter(Boolean).map(r=>String(r))));if(!a.length)return[];const n=[];for(let r=0;r<a.length;r+=10)n.push(a.slice(r,r+10));return(await Promise.all(n.map(async r=>{try{const d=await this.queryMany(e,[{field:"id",operator:"in",value:r}]);return d&&d.length?d:Promise.all(r.map(o=>this.get(e,o)))}catch{return Promise.all(r.map(d=>this.get(e,d)))}}))).flat().filter(Boolean)}listenDoc(e,t,a){if(!this.db||!t)return null;const n=String(t);try{return this.db.collection(e).doc(n).onSnapshot(s=>{const r=s.exists?{...s.data(),id:s.id}:null;this.track("listen",e,1),a(r,s)},s=>{console.error(`Realtime listener error in ${e}/${n}:`,s)})}catch(s){return console.error(`Error setting up listener for ${e}/${n}:`,s),null}}listenQuery(e,t=[],a={},n){if(!this.db)return null;try{let s=this.db.collection(e);return s=this.applyFilters(s,t),s=this.applyOptions(s,a),s.onSnapshot(r=>{const d=r.docs.map(o=>({...o.data(),id:o.id}));this.track("listenQuery",e,d.length),n(d,r)},r=>{console.error(`Realtime query listener error in ${e}:`,r)})}catch(s){return console.warn(`listenQuery failed for ${e}, falling back to listen`,s),this.listen(e,n)}}listen(e,t){return this.db?this.db.collection(e).onSnapshot(a=>{const n=a.docs.map(s=>({...s.data(),id:s.id}));this.track("listen",e,n.length),t(n,a)},a=>{console.error(`Realtime listener error in ${e}:`,a)}):null}}const R=new la;typeof window<"u"&&(window.AppDB=R);class ca{constructor(){this.currentUser=null,this.sessionKey="crwi_session_user",this.heartbeatInterval=null,this.userDocUnsubscribe=null}async init(){await R.init();const e=localStorage.getItem(this.sessionKey);e&&(this.currentUser=await R.get("users",e),this.currentUser&&(this.startHeartbeat(),this.startCurrentUserSync()))}async refreshCurrentUserFromDB(){const e=localStorage.getItem(this.sessionKey);if(!e)return this.currentUser=null,null;if(this.userDocUnsubscribe&&this.currentUser&&this.currentUser.id===e)return this.currentUser;const t=await R.get("users",e);return this.currentUser=t||null,this.currentUser}async login(e,t){const a=R.getCached?await R.getCached(R.getCacheKey("authUsers","users",{mode:"login"}),U?.READ_CACHE_TTLS?.users||6e4,()=>R.getAll("users")):await R.getAll("users"),n=e.trim().toLowerCase(),s=t.trim(),r=a.find(d=>{const o=(d.username||"").toLowerCase().trim(),l=(d.email||"").toLowerCase().trim();return(o===n||l===n)&&d.password.trim()===s});return r?(this.currentUser=r,localStorage.setItem(this.sessionKey,r.id),this.startHeartbeat(),this.startCurrentUserSync(),!0):(console.warn("Login failed: invalid credentials."),!1)}logout(){this.stopHeartbeat(),this.stopCurrentUserSync(),this.currentUser=null,localStorage.removeItem(this.sessionKey),window.location.reload()}getUser(){return this.currentUser}async updateUser(e){const t=await R.get("users",e.id);if(!t)return!1;const a={...t,...e};return e.isAdmin===!0||e.isAdmin==="true"?a.isAdmin=!0:a.isAdmin=!1,a.role=e.role||t.role||"Employee",console.log(`Auth: User ${a.id} update - Role: ${a.role}, Admin: ${a.isAdmin}`),e.name&&e.name!==t.name&&!e.avatar&&(a.avatar=`https://ui-avatars.com/api/?name=${e.name}&background=random&color=fff`),await R.put("users",a),this.currentUser&&this.currentUser.id===a.id&&(this.currentUser=a),!0}startHeartbeat(){if(!(U&&U.READ_OPT_FLAGS||{}).ENABLE_PRESENCE_HEARTBEAT){this.stopHeartbeat();return}this.heartbeatInterval&&clearInterval(this.heartbeatInterval);const t=async()=>{if(this.currentUser&&R)try{await R.put("users",{id:this.currentUser.id,lastSeen:Date.now()})}catch(a){console.warn("Heartbeat update failed:",a)}};t(),this.heartbeatInterval=setInterval(t,12e4),console.log("Presence Heartbeat started.")}stopHeartbeat(){this.heartbeatInterval&&(clearInterval(this.heartbeatInterval),this.heartbeatInterval=null,console.log("Presence Heartbeat stopped."))}startCurrentUserSync(){this.stopCurrentUserSync();const e=localStorage.getItem(this.sessionKey);if(!(!e||!window.AppFirestore))try{this.userDocUnsubscribe=window.AppFirestore.collection("users").doc(String(e)).onSnapshot(t=>{if(!t.exists){this.currentUser=null;return}const a={...t.data(),id:t.id};this.currentUser=a,window.dispatchEvent(new CustomEvent("app:user-sync",{detail:a}))},t=>{console.warn("Current user realtime sync failed:",t)})}catch(t){console.warn("Failed to start current user sync:",t)}}stopCurrentUserSync(){typeof this.userDocUnsubscribe=="function"&&this.userDocUnsubscribe(),this.userDocUnsubscribe=null}}const J=new ca;typeof window<"u"&&(window.AppAuth=J);class pa{async getStatus(){const e=await(J.refreshCurrentUserFromDB?J.refreshCurrentUserFromDB():J.getUser());if(!e)return{status:"out",lastCheckIn:null};if(e.status==="in"&&e.lastCheckIn)try{const t=new Date(e.lastCheckIn),a=new Date,n=t.toISOString().split("T")[0],s=a.toISOString().split("T")[0];if(n<s)return{status:"out",lastCheckIn:null,staleSession:!0}}catch(t){console.warn("Date parsing error in getStatus:",t)}return{status:e.status||"out",lastCheckIn:e.lastCheckIn}}async checkIn(e,t,a="Unknown Location"){const n=await(J.refreshCurrentUserFromDB?J.refreshCurrentUserFromDB():J.getUser());if(!n)throw new Error("User not authenticated");let s=!1,r="";if(n.status==="in"&&n.lastCheckIn){const o=new Date(n.lastCheckIn),l=new Date,c=`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`,p=`${l.getFullYear()}-${String(l.getMonth()+1).padStart(2,"0")}-${String(l.getDate()).padStart(2,"0")}`;if(c<p){const u=new Date(o.getTime()+288e5),y=this.evaluateAttendanceStatus(o,288e5),g=n.currentLocation||n.lastLocation||null,h=new Date().toISOString(),f={id:String(Date.now()),user_id:n.id,date:u.toISOString().split("T")[0],checkIn:o.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:u.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),duration:this.msToTime(288e5),durationMs:288e5,type:y.status,dayCredit:y.dayCredit,lateCountable:y.lateCountable,extraWorkedMs:y.extraWorkedMs||0,policyVersion:"v2",location:g?.address||"Missed checkout session",lat:g?.lat??null,lng:g?.lng??null,checkOutLocation:"System closure on next check-in",outLat:null,outLng:null,workDescription:"System closure: previous open session was closed at fixed 8 credited hours.",locationMismatched:!1,locationExplanation:"",activityScore:0,autoCheckout:!1,autoCheckoutReason:"",autoCheckoutAt:null,autoCheckoutRequiresApproval:!1,autoCheckoutExtraApproved:null,missedCheckoutResolved:!0,missedCheckoutPolicy:"fixed_8h_on_next_checkin",systemClosedAt:h,synced:!1};await R.add("attendance",f),n.status="out",n.lastCheckOut=u.getTime(),n.lastLocation=g,n.lastCheckOutLocation={lat:null,lng:null,address:"System closure on next check-in"},n.locationMismatched=!1,n.lastCheckIn=null,n.currentLocation=null,s=!0,r="Previous open session was closed by policy at 8 credited hours because checkout was missed."}else return{ok:!1,conflict:!0,message:"Status updated from another device."}}n.status="in",n.lastCheckIn=Date.now();const d=a&&a!=="Unknown Location"?a:e&&t?`Lat: ${Number(e).toFixed(4)}, Lng: ${Number(t).toFixed(4)}`:"Unknown Location";return n.currentLocation={lat:e,lng:t,address:d},await R.put("users",n),{ok:!0,resolvedMissedCheckout:s,noticeMessage:r}}async checkOut(e="",t=null,a=null,n="Detected Location",s=!1,r="",d={}){const o=await(J.refreshCurrentUserFromDB?J.refreshCurrentUserFromDB():J.getUser());if(!o||o.status!=="in")return{ok:!1,conflict:!0,message:"Status updated from another device."};const l=new Date(o.lastCheckIn),c=d.checkOutTime?new Date(d.checkOutTime):new Date,p=c-l,m=this.evaluateAttendanceStatus(l,p),u=window.AppActivity?window.AppActivity.getStats():{score:0},y={id:String(Date.now()),user_id:o.id,date:c.toISOString().split("T")[0],checkIn:l.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),duration:this.msToTime(p),durationMs:p,type:m.status,dayCredit:m.dayCredit,lateCountable:m.lateCountable,extraWorkedMs:m.extraWorkedMs||0,policyVersion:"v2",location:o.currentLocation?.address||"Checked In Location",lat:o.currentLocation?.lat,lng:o.currentLocation?.lng,checkOutLocation:n||(t&&a?`Lat: ${Number(t).toFixed(4)}, Lng: ${Number(a).toFixed(4)}`:"Detected Location"),outLat:t,outLng:a,workDescription:e||"",locationMismatched:s,locationExplanation:r||"",activityScore:u.score,autoCheckout:!!d.autoCheckout,autoCheckoutReason:d.autoCheckoutReason||"",autoCheckoutAt:d.autoCheckoutAt||null,autoCheckoutRequiresApproval:!!d.autoCheckoutRequiresApproval,autoCheckoutExtraApproved:d.autoCheckoutExtraApproved??null,overtimePrompted:!!d.overtimePrompted,overtimeReasonTag:d.overtimeReasonTag||"",overtimeExplanation:d.overtimeExplanation||"",overtimeCappedToEightHours:!!d.overtimeCappedToEightHours,entrySource:"checkin_checkout",attendanceEligible:!0,synced:!1};return await R.add("attendance",y),o.status="out",o.lastCheckOut=Date.now(),o.lastLocation=o.currentLocation,o.lastCheckOutLocation={lat:t,lng:a,address:n},o.locationMismatched=s,o.lastCheckIn=null,o.currentLocation=null,await R.put("users",o),window.AppActivity&&window.AppActivity.stop(),{ok:!0,conflict:!1}}async addAdminLog(e,t){const a={id:String(Date.now()),user_id:e,...t,isManualOverride:t.isManualOverride===!0,entrySource:t.entrySource||"admin_override",attendanceEligible:Object.prototype.hasOwnProperty.call(t,"attendanceEligible")?t.attendanceEligible===!0:!0,synced:!1};return await R.add("attendance",a),a}async deleteLog(e){if(e)return await R.delete("attendance",e),!0}async updateLog(e,t){if(!e)return;const a=await R.get("attendance",e);if(!a)throw new Error("Log not found");const n={...a,...t,isManualOverride:Object.prototype.hasOwnProperty.call(t,"isManualOverride")?t.isManualOverride===!0:!!a.isManualOverride,entrySource:t.entrySource||a.entrySource||"admin_override",attendanceEligible:Object.prototype.hasOwnProperty.call(t,"attendanceEligible")?t.attendanceEligible===!0:Object.prototype.hasOwnProperty.call(a,"attendanceEligible")?a.attendanceEligible===!0:!0,id:e};return await R.put("attendance",n),n}async addManualLog(e){const t=J.getUser();if(!t)return;const a=this.buildDateTime(e.date,e.checkIn),n=this.buildDateTime(e.date,e.checkOut),s=a&&n?n-a:0,r=this.evaluateAttendanceStatus(a||new Date,s),d=String(e.type||"").trim(),o=!d||d==="Manual"?r.status:d,l=Object.prototype.hasOwnProperty.call(e,"attendanceEligible")?e.attendanceEligible===!0:o!=="Work Log",c=l?o:d||"Work Log",p={id:String(Date.now()),user_id:t.id,...e,type:c,durationMs:typeof e.durationMs=="number"?e.durationMs:s,dayCredit:l?typeof e.dayCredit=="number"?e.dayCredit:r.dayCredit:0,lateCountable:l&&(e.lateCountable===!0||c==="Late"),extraWorkedMs:l?typeof e.extraWorkedMs=="number"?e.extraWorkedMs:r.extraWorkedMs||0:0,entrySource:e.entrySource||"staff_manual_work",attendanceEligible:l,synced:!1};return await R.add("attendance",p),p}async getLogs(e=null){const t=e||J.getUser()?.id;if(!t)return[];try{const a=window.AppFirestore;if(!a)return[];let n=a.collection("attendance");n=n.where("user_id","==",t);const d=(await n.get()).docs.map(c=>({...c.data(),id:c.id})).sort((c,p)=>p.id-c.id).map(c=>((!c.location||c.location==="Unknown Location")&&c.lat&&c.lng&&(c.location=`Lat: ${Number(c.lat).toFixed(4)}, Lng: ${Number(c.lng).toFixed(4)}`),c)),o=new Set,l=d.filter(c=>{const p=`${c.date}|${c.checkIn}`;return o.has(p)?!1:(o.add(p),!0)});try{const c=await R.get("users",t);if(c&&c.status==="in"&&c.lastCheckIn){const p=new Date(c.lastCheckIn),m={id:"active_now",date:p.toLocaleDateString(),checkIn:p.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:"Active Now",duration:"Working...",type:"Office",location:c.currentLocation?.address&&c.currentLocation.address!=="Unknown Location"?c.currentLocation.address:c.currentLocation?.lat&&c.currentLocation?.lng?`Lat: ${Number(c.currentLocation.lat).toFixed(4)}, Lng: ${Number(c.currentLocation.lng).toFixed(4)}`:"Current Session"};l.unshift(m)}}catch(c){console.warn("Could not fetch active status for logs",c)}return l.slice(0,50)}catch(a){return console.warn("Optimized log fetch failed, falling back to simple filter",a),[]}}async getAllLogs(){return await R.getAll("attendance")}msToTime(e){let t=Math.floor(e/6e4%60);return`${Math.floor(e/(1e3*60*60)%24)}h ${t}m`}buildDateTime(e,t){if(!e||!t)return null;const a=`${e}T${t}:00`,n=new Date(a);return Number.isNaN(n.getTime())?null:n}normalizeType(e){const t=String(e||"").trim();return!t||t==="Manual"?"Present":t==="Manual/WFH"?"Work - Home":t}getDayCredit(e){const t=this.normalizeType(e);return t==="Half Day"?.5:t==="Absent"?0:t==="Present"||t==="Present (Late Waived)"||t==="Late"||t==="Work - Home"||t==="On Duty"?1:0}evaluateAttendanceStatus(e,t=0){if(!e||Number.isNaN(e.getTime()))return{status:"Absent",dayCredit:0,lateCountable:!1,extraWorkedMs:0};if(e.getDay()===0)return{status:"Present",dayCredit:1,lateCountable:!1,extraWorkedMs:0};const n=e.getHours()*60+e.getMinutes(),s=Math.max(0,t)/(1e3*60*60),r=U.LATE_CUTOFF_MINUTES||555,d=U.MINOR_LATE_END_MINUTES||615,o=U.LATE_END_MINUTES||720,l=U.POST_NOON_END_MINUTES||810,c=U.AFTERNOON_START_MINUTES||720;let p="Present",m=!1,u=0;return n>=c?(s>=8?p="Present":s>=4?p="Half Day":p="Absent",s>4&&(u=Math.max(0,t-14400*1e3)),{status:p,dayCredit:this.getDayCredit(p),lateCountable:!1,extraWorkedMs:u}):(n>l?p="Absent":n>o||n>d?p=s>=4?"Half Day":"Absent":n>r?s>=8?p="Present (Late Waived)":(p="Late",m=!0):s>=8?p="Present":s>=4?p="Half Day":p="Absent",{status:p,dayCredit:this.getDayCredit(p),lateCountable:m,extraWorkedMs:u})}calculateStatus(e){return this.evaluateAttendanceStatus(e,480*60*1e3).status}}const Pt=new pa;typeof window<"u"&&(window.AppAttendance=Pt);function x(i){return i==null?"":String(i).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Nt(i){return x(i)}function ua(i){return String(i??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,"\\n").replace(/\r/g,"\\r")}function Ie(i,e="https://via.placeholder.com/24"){return!i||typeof i!="string"?e:i.startsWith("http")||i.startsWith("data:")||i.startsWith("/")||i.startsWith("./")?i:e}function nt(i){if(!i)return"Never";const e=new Date(i);if(isNaN(e.getTime()))return"Unknown";const t=Math.floor((new Date-e)/1e3);if(t<60)return"just now";let a=t/31536e3;return a>1?Math.floor(a)+" years ago":(a=t/2592e3,a>1?Math.floor(a)+" months ago":(a=t/86400,a>1?Math.floor(a)+" days ago":(a=t/3600,a>1?Math.floor(a)+" hours ago":(a=t/60,a>1?Math.floor(a)+" mins ago":Math.floor(t)+" seconds ago"))))}typeof window<"u"&&(window.safeHtml=x,window.safeAttr=Nt,window.safeJsStr=ua,window.safeUrl=Ie,window.timeAgo=nt);function Bt(i,e=!0){const t=Math.max(0,Math.min(5,Number(i)||0)),a=Math.floor(t),n=t-a>=.5,s=5-a-(n?1:0);let r='<div class="star-rating-display">';for(let d=0;d<a;d++)r+='<i class="fa-solid fa-star star-filled"></i>';n&&(r+='<i class="fa-solid fa-star-half-stroke star-filled"></i>');for(let d=0;d<s;d++)r+='<i class="fa-regular fa-star star-empty"></i>';return e&&(r+=`<span class="star-rating-number">${t.toFixed(1)}</span>`),r+="</div>",r}function it(i,e=!0){const t=String(i||"to-be-started").toLowerCase();let a="To Be Started",n="fa-circle-dot",s="status-badge-to-be-started";return t==="in-process"||t==="in-progress"?(a="In Progress",n="fa-spinner fa-spin",s="status-badge-in-process"):t==="completed"?(a="Completed",n="fa-circle-check",s="status-badge-completed"):t==="overdue"?(a="Overdue",n="fa-circle-exclamation",s="status-badge-overdue"):(t==="not-completed"||t==="cancelled")&&(a="Not Completed",n="fa-circle-xmark",s="status-badge-not-completed"),`
        <div class="status-badge ${s}">
            ${e?`<i class="fa-solid ${n}"></i>`:""}
            <span>${a}</span>
        </div>
    `}typeof window<"u"&&(window.AppUI||(window.AppUI={}),window.AppUI.renderStarRating=Bt,window.AppUI.renderTaskStatusBadge=it);const be={controllers:new WeakMap,elements:new Set};function Te(){return window.app_staffActivityState||(window.app_staffActivityState={selectedMonth:new Date().toISOString().slice(0,7),sortKey:"date-desc",logs:[]}),window.app_staffActivityState}function je(i,e={}){if(!i)return`
            <div class="card dashboard-hero-stats-card hero-slot">
                <div class="dashboard-hero-stats-head">
                    <div class="hero-label-badge">Hero of the Week</div>
                </div>
                <div class="dashboard-activity-empty">
                    ${e.lowRead?"Loading stats...":"No hero data available."}
                </div>
            </div>`;const{user:t,stats:a}=i;return`
        <div class="card dashboard-hero-stats-card hero-slot ${e.source==="generated"?"is-new-summary":""}">
            <div class="dashboard-hero-stats-head">
                <div class="hero-label-badge">Hero of the Week</div>
                ${e.generatedAt?`<span class="hero-sync-time" title="Source: ${e.source}">Synced ${nt(e.generatedAt)}</span>`:""}
            </div>
            <div class="dashboard-hero-stats-body">
                <div class="hero-profile">
                    <img src="${Ie(t.avatar)}" alt="${x(t.name)}" class="hero-avatar">
                    <div class="hero-info">
                        <div class="hero-name">${x(t.name)}</div>
                        <div class="hero-role">${x(t.role||"Staff")}</div>
                    </div>
                </div>
                <div class="hero-metrics">
                    <div class="hero-metric">
                        <div class="hero-metric-value">${a.daysPresent}</div>
                        <div class="hero-metric-label">Days</div>
                    </div>
                    <div class="hero-metric">
                        <div class="hero-metric-value">${a.totalHours}h</div>
                        <div class="hero-metric-label">Hours</div>
                    </div>
                    <div class="hero-metric">
                        <div class="hero-metric-value">${a.lateCount}</div>
                        <div class="hero-metric-label">Lates</div>
                    </div>
                </div>
            </div>
        </div>`}function st(i,e=[],t=null){const a=new Date,n=new Date(a);n.setDate(n.getDate()-180);const s=n.toISOString().split("T")[0],r=a.toISOString().split("T")[0],d=t?t.id:window.AppAuth.getUser().id,o=t&&t.name||window.AppAuth.getUser().name;return`
        <div class="card dashboard-worklog-card">
            <div class="dashboard-worklog-head">
                 <h4>Work Log <span class="dashboard-worklog-staff">(${x(o)})</span></h4>
                 <span>Ongoing & Historical Tasks</span>
            </div>
             <div class="dashboard-worklog-filter-row">
                <input type="date" id="act-start" value="${s}" class="dashboard-worklog-date-input">
                <span class="dashboard-worklog-to">to</span>
                <input type="date" id="act-end" value="${r}" class="dashboard-worklog-date-input">
                <button onclick="window.app_filterActivity()" class="dashboard-worklog-go-btn">Go</button>
            </div>
            <div id="activity-list" class="dashboard-worklog-list">
                ${ot(i,s,r,d,e)}
            </div>
        </div>
    `}function ot(i,e,t,a,n=[]){const s=new Date(e),r=new Date(t);r.setHours(23,59,59,999);const d=i.filter(y=>{const g=new Date(y.date),h=y.workDescription||(y.location&&!y.location.startsWith("Lat:")?y.location:"Standard Activity");return y._displayDesc=h,y._isCollab=!1,y._sortTime=y.checkOut||"00:00",g>=s&&g<=r}),o=[];n.forEach(y=>{const g=new Date(y.date);if(g<s||g>r)return;y.plans.filter(f=>f.tags&&f.tags.some(v=>v.id===a&&v.status==="accepted")).forEach(f=>{o.push({date:y.date,workDescription:`🤝 Collaborated with ${y.userName}: ${f.task}${f.subPlans&&f.subPlans.length>0?` (Sub-tasks: ${f.subPlans.join(", ")})`:""}`,checkOut:"Planned / Accepted",_displayDesc:`🤝 Collaborated with ${y.userName}: ${f.task}${f.subPlans&&f.subPlans.length>0?` (Sub-tasks: ${f.subPlans.join(", ")})`:""}`,_isCollab:!0,_sortTime:"23:59"})})});const l=[...d,...o].sort((y,g)=>{const h=new Date(g.date)-new Date(y.date);return h!==0?h:g._sortTime.localeCompare(y._sortTime)});if(l.length===0)return'<div class="dashboard-activity-empty">No activity descriptions found.</div>';let c="",p="";const m=window.AppAuth.getUser(),u=window.app_hasPerm("dashboard","admin",m);return l.forEach(y=>{y.date!==p&&(c+=`<div class="dashboard-activity-date">${y.date}</div>`,p=y.date);const h=y._isCollab?"#10b981":"#e5e7eb",f=y._isCollab?"dashboard-activity-item-collab":"";let v="";if(y._isCollab||y.status){const b=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(y.date,y.status):y.status||"to-be-started";v=`
                <div class="dashboard-activity-status-row">
                    ${it(b)}
                    ${u?`<div class="dashboard-activity-edit-wrap"><button onclick="window.app_openDayPlan('${y.date}', '${a}')" class="dashboard-activity-edit-btn" title="Edit/Reassign"><i class="fa-solid fa-pen-to-square"></i></button></div>`:""}
                </div>`}c+=`<div class="dashboard-activity-item ${f}" style="border-left-color:${h};"><div class="dashboard-activity-desc">${x(y._displayDesc)}</div>${v}<div class="dashboard-activity-meta">${x(y.checkOut||(y.status==="completed"?"Completed":"Planned Activity"))}</div></div>`}),c}function rt(i){const e=Te();e.logs=Array.isArray(i)?i:[],setTimeout(()=>{const n=document.getElementById("staff-activity-list");n&&Rt(n)},0);const t=Ut(8),a=Le(e.selectedMonth);return`
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
                    ${t.map(n=>`<option value="${n.key}" ${n.key===e.selectedMonth?"selected":""}>${x(n.label)}</option>`).join("")}
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
                ${Ae(e.logs,e.sortKey)}
            </div>
        </div>`}function Ae(i,e){const t=ma(i);if(t.length===0)return'<div class="dashboard-activity-empty">No team activities found for the selected month.</div>';const a=fa(t,e),n=a.filter(r=>r._taskStatus==="completed"),s=a.filter(r=>r._taskStatus!=="completed");return`
        <div class="dashboard-team-activity-split-grid">
            ${ze("Completed",n,"No completed tasks in this month.")}
            ${ze("In Progress / Incomplete",s,"No in-progress or incomplete tasks in this month.")}
        </div>
    `}function ze(i,e,t){const a=window.AppAuth.getUser(),n=window.app_hasPerm("dashboard","admin",a),s=e.length===0?`<div class="dashboard-activity-empty">${t}</div>`:e.map(r=>{const d=a&&r.userId===a.id,o=n||d,l=`
                <div class="dashboard-activity-status-row">
                    ${it(r._taskStatus)}
                    ${o?`<div class="dashboard-activity-edit-wrap"><button onclick="window.app_openDayPlan('${r.date}', '${r.userId||""}')" class="dashboard-activity-edit-btn" title="Edit/Reassign"><i class="fa-solid fa-pen-to-square"></i></button></div>`:""}
                </div>`;return`
                <div class="dashboard-staff-activity-item dashboard-staff-activity-item-compact">
                    <div class="dashboard-staff-name">${x(r.staffName||"Unknown Staff")}<span class="dashboard-team-activity-item-date">${r.date||""}</span></div>
                    <div class="dashboard-activity-desc dashboard-staff-activity-desc">${x(r._displayDesc||"Work Plan Task")}</div>
                    ${l}
                    <div class="dashboard-activity-meta">${r._taskStatus==="completed"?"Completed":"Work Plan"}</div>
                </div>`}).join("");return`
        <div class="dashboard-team-activity-col">
            <div class="dashboard-team-activity-col-head">
                <span>${x(i)}</span>
                <span class="dashboard-team-activity-count">${e.length}</span>
            </div>
            <div class="dashboard-team-activity-col-list">${s}</div>
        </div>
    `}function we(i,e,t){const a=t.penalty>0?'<span class="dashboard-penalty-badge">Penalty Applies</span>':"";return`
        <div class="card dashboard-stats-card">
            <div class="dashboard-stats-card-head">
                <div>
                    <h4 class="dashboard-stats-card-title">${x(i)}</h4>
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
                ${dt(t.breakdown)}
            </div>
        </div>
    `}function dt(i){const e=Object.entries(i),t={Present:{color:"#166534",bg:"#f0fdf4",label:"Office"},"Work - Home":{color:"#0369a1",bg:"#e0f2fe",label:"WFH"},Training:{color:"#4338ca",bg:"#eef2ff",label:"Training"},Late:{color:"#c2410c",bg:"#fff7ed",label:"Late"},"Sick Leave":{color:"#991b1b",bg:"#fef2f2",label:"Sick"},"Casual Leave":{color:"#9d174d",bg:"#fce7f3",label:"Casual"},"Earned Leave":{color:"#be185d",bg:"#fdf2f8",label:"Earned"},"Paid Leave":{color:"#be123c",bg:"#ffe4e6",label:"Paid"},"Maternity Leave":{color:"#a21caf",bg:"#fae8ff",label:"Maternity"},Absent:{color:"#7f1d1d",bg:"#fee2e2",label:"Absent"},"Early Departure":{color:"#991b1b",bg:"#fff1f2",label:"Early Exit"},Holiday:{color:"#1e293b",bg:"#f1f5f9",label:"Holiday"},"National Holiday":{color:"#334155",bg:"#f8fafc",label:"Nat. Hol"},"Regional Holidays":{color:"#475569",bg:"#f8fafc",label:"Reg. Hol"}};return e.map(([a,n])=>{const s=t[a]||{color:"#374151",bg:"#f3f4f6",label:a};return n===0&&!["Present","Late","Absent","Early Departure"].includes(a)?"":`
            <div class="dashboard-breakdown-item" style="background:${s.bg};">
                <span class="dashboard-breakdown-count" style="color:${s.color}">${n}</span>
                <span class="dashboard-breakdown-label" style="color:${s.color};">${s.label}</span>
            </div>
         `}).join("")}function lt(i){return!i||i.length===0?`
            <div class="card dashboard-leave-requests-card">
                <div class="dashboard-leave-requests-head"><h4>Pending Leaves</h4><span>Review requirements</span></div>
                <div class="dashboard-leave-requests-list">
                    <div class="dashboard-activity-empty">No pending leave requests.</div>
                </div>
            </div>`:`
        <div class="card dashboard-leave-requests-card">
            <div class="dashboard-leave-requests-head"><h4>Pending Leaves</h4><span>Review requirements</span></div>
            <div class="dashboard-leave-requests-list">
                ${i.slice(0,5).map(e=>`
                    <div class="dashboard-leave-row">
                        <div class="dashboard-leave-info">
                            <div class="dashboard-leave-name">${x(e.userName||"Staff")}</div>
                            <div class="dashboard-leave-type">${x(e.type)} • ${e.daysCount} days</div>
                            <div class="dashboard-leave-date">${e.startDate} to ${e.endDate}</div>
                        </div>
                        <div class="dashboard-leave-actions">
                            <button class="dashboard-leave-btn export" onclick="window.AppUI.exportLeave('${e.id}')" title="Export PDF"><i class="fa-solid fa-file-pdf"></i></button>
                            <button class="dashboard-leave-btn comment" onclick="window.AppUI.commentLeave('${e.id}')" title="Add Comment"><i class="fa-solid fa-comment-dots"></i></button>
                            <button class="dashboard-leave-btn approve" onclick="window.AppUI.updateLeaveStatus('${e.id}', 'Approved')" title="Approve"><i class="fa-solid fa-check"></i></button>
                            <button class="dashboard-leave-btn reject" onclick="window.AppUI.updateLeaveStatus('${e.id}', 'Rejected')" title="Reject"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                `).join("")}
            </div>
            ${i.length>5?`<div class="dashboard-leave-footer"><button onclick="window.location.hash = 'leaves'">View all ${i.length} requests</button></div>`:""}
        </div>`}function ct(i,e={}){const t=e.title||"Leave History",a=e.subtitle||"Past records";if(!i||i.length===0)return`
            <div class="card dashboard-leave-history-card">
                <div class="dashboard-leave-history-head"><h4>${x(t)}</h4><span>${x(a)}</span></div>
                <div class="dashboard-activity-empty">No leave history found.</div>
            </div>`;const n=s=>s==="Approved"?"#166534":s==="Rejected"?"#b91c1c":"#854d0e";return`
        <div class="card dashboard-leave-history-card">
            <div class="dashboard-leave-history-head">
                <h4>${x(t)}</h4>
                <span>${x(a)}</span>
            </div>
            <div class="dashboard-leave-history-list">
                ${i.map(s=>`
                    <div class="dashboard-leave-history-row">
                        <div class="dashboard-leave-history-main">
                            <div class="dashboard-leave-history-user">${x(s.userName||"Staff")}</div>
                            <div class="dashboard-leave-history-type">${x(s.type)} • ${s.daysCount} days</div>
                            <div class="dashboard-leave-history-date">${s.startDate} to ${s.endDate}</div>
                        </div>
                        <div class="dashboard-leave-history-status">
                            <span class="status-pill" style="background: ${n(s.status)}15; color: ${n(s.status)}">${x(s.status)}</span>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>`}function pt(i,e){return""}function ut(i){const e=(i||[]).filter(t=>!(t.type==="tag"||t.type==="task"||t.type==="mention")||t.dismissedAt||t.read?!1:String(t.status||"pending").toLowerCase()==="pending");return e.length===0?"":`
        <div class="card full-width dashboard-tagged-card">
            <div class="dashboard-tagged-head"><h4>Tagged Items</h4><span>Pending approvals</span></div>
            <div class="dashboard-tagged-list">
                ${e.map(t=>`
                    <div class="dashboard-tagged-item">
                        <div class="dashboard-tagged-main">
                            <div class="dashboard-tagged-title">${x(t.title||"Tagged item")}</div>
                            <div class="dashboard-tagged-desc">${x(t.description||t.message||"")}</div>
                            <div class="dashboard-tagged-meta">Tagged by ${x(t.taggedByName||"Staff")} • ${nt(t.taggedAt||t.date)}</div>
                        </div>
                        <div class="dashboard-tagged-status">
                            <span class="dashboard-tagged-pill ${t.status||"pending"}">${(t.status||"pending").toUpperCase()}</span>
                            ${t.status==="pending"?`
                                <div class="dashboard-tagged-actions">
                                    ${t.planId?`
                                        <button class="dashboard-tagged-btn accept" onclick="window.app_handleTagResponse('${t.planId}', ${t.taskIndex}, 'accepted', ${i.indexOf(t)})">Approve</button>
                                        <button class="dashboard-tagged-btn reject" onclick="window.app_handleTagResponse('${t.planId}', ${t.taskIndex}, 'rejected', ${i.indexOf(t)})">Reject</button>
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
    `}function We(i,e,t){if(!i||i.length===0)return`
            <div class="card dashboard-staff-directory-card">
                <div class="dashboard-staff-directory-head"><h4>Staff Directory</h4><span>Quick actions</span></div>
                <div class="dashboard-staff-directory-list">
                    <div class="dashboard-activity-empty">No staff loaded.</div>
                </div>
            </div>`;const a=Date.now(),n=r=>{const d=(r.notifications||[]).map(o=>new Date(o.taggedAt||o.date||o.respondedAt||0).getTime()).filter(Boolean);return d.length?Math.max(...d):0};return`
        <div class="card dashboard-staff-directory-card">
            <div class="dashboard-staff-directory-head"><h4>Staff Directory</h4><span>Message or assign</span></div>
            <div class="dashboard-staff-directory-list">
                ${i.filter(r=>r.id!==t.id).sort((r,d)=>n(d)-n(r)||r.name.localeCompare(d.name)).map(r=>{const d=n(r);return`
                <div class="dashboard-staff-row ${d&&a-d<12e4?"dashboard-staff-row-new":""}">
                    <div class="dashboard-staff-meta">
                        <div class="dashboard-staff-avatar">
                            <img src="${Ie(r.avatar)}" alt="${x(r.name)}">
                        </div>
                        <div class="dashboard-staff-text">
                            <div class="dashboard-staff-name">${x(r.name)}</div>
                            <div class="dashboard-staff-role">${x(r.role||"Staff")}</div>
                        </div>
                    </div>
                    <div class="dashboard-staff-actions">
                        <button class="dashboard-staff-btn" onclick="window.location.hash = 'staff-directory'; window.app_openStaffThread('${r.id}')" title="Message"><i class="fa-solid fa-message"></i></button>
                    </div>
                </div>
            `}).join("")}
            </div>
        </div>`}async function mt(){const i=window.AppAuth.getUser(),e=window.app_hasPerm("dashboard","view",i),t=window.app_hasPerm("dashboard","admin",i),n=Te().selectedMonth,s=window.AppDB?.getISTDateKeys?window.AppDB.getISTDateKeys():{todayKey:new Date().toISOString().split("T")[0],yesterdayKey:new Date(Date.now()-1440*60*1e3).toISOString().split("T")[0]},r=s.todayKey,d=s.yesterdayKey,o=!!window.AppConfig?.READ_OPT_FLAGS?.FF_SHARED_DAILY_SUMMARY,l=e&&window.app_selectedSummaryStaffId?window.app_selectedSummaryStaffId:i.id;console.time("DashboardFetch");const c=o?Promise.resolve(null):window.AppDB.getOrGenerateSummary(`hero_stats_${r}`,()=>window.AppAnalytics.getHeroOfTheWeek(),1440*60*1e3),p=o?Promise.resolve([]):window.AppDB.getOrGenerateSummary(`team_activity_${n}_${r}`,()=>window.AppAnalytics.getAllStaffActivities({mode:"month",month:n,scope:"work"})),m=o&&window.AppDB.getOrCreateDailySummary?window.AppDB.getOrCreateDailySummary({dateKey:r,yesterdayKey:d,staleAfterMs:window.AppConfig?.SUMMARY_POLICY?.STALENESS_MS,lockTtlMs:window.AppConfig?.SUMMARY_POLICY?.LOCK_TTL_MS,generatorFn:()=>window.AppAnalytics.buildDailyDashboardSummary({dateKey:r,selectedMonth:n})}).catch(Y=>(console.warn("Daily summary fetch/generation failed:",Y),null)):null,u=m?Promise.race([m,new Promise(Y=>setTimeout(()=>Y(null),1500))]):Promise.resolve(null);if(!window._dashboardRefreshScheduled){window._dashboardRefreshScheduled=!0;try{const Y=window.AppDB.getIstNow(),te=new Date(Y);te.setDate(te.getDate()+1),te.setHours(0,0,5,0);const se=te.getTime()-Y.getTime();setTimeout(()=>{mt().then(le=>{const ne=document.getElementById("page-content");ne&&(ne.innerHTML=le)}),window._dashboardRefreshScheduled=!1},Math.max(0,se))}catch(Y){console.warn("failed to schedule dashboard refresh",Y)}}const[y,g,h,f,v,b,k,w,A,$,I,L]=await Promise.all([window.AppAttendance.getStatus(),window.AppAttendance.getLogs(l),window.AppAnalytics.getUserMonthlyStats(l),window.AppAnalytics.getUserYearlyStats(l),c,window.AppCalendar?window.AppCalendar.getPlans():{leaves:[],events:[]},p,window.app_hasPerm("leaves","view")?window.AppLeaves.getPendingLeaves():Promise.resolve([]),window.AppDB.getCached?window.AppDB.getCached(window.AppDB.getCacheKey("dashboardUsers","users",{}),window.AppConfig?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):window.AppDB.getAll("users"),window.AppCalendar?window.AppCalendar.getCollaborations(l):Promise.resolve([]),window.app_hasPerm("leaves","view")?window.AppDB.queryMany?window.AppDB.queryMany("leaves",[{field:"status",operator:"==",value:"Pending"}]).catch(()=>window.AppDB.getAll("leaves")):window.AppDB.getAll("leaves"):Promise.resolve([]),u]);console.timeEnd("DashboardFetch");const T=o?{lowRead:!0,generatedAt:L?.generatedAt||L?.meta?.generatedAt||0,source:L?._source||""}:{};let B=o?L?.hero||null:v,E=o?Array.isArray(L?.teamActivityPreview)?L.teamActivityPreview:[]:k;o&&(!L||!Array.isArray(L.teamActivityPreview))&&setTimeout(()=>wa(!0),0);const S=je(B,T);o&&B==null&&m&&m.then(Y=>{const te=Y&&Y.hero?Y.hero:null;if(te){const se={...T,generatedAt:Y.generatedAt||T.generatedAt,source:Y._source||T.source},le=je(te,se),ne=document.querySelector(".hero-slot");ne&&(ne.innerHTML=le)}}).catch(()=>{}),window.AppRating&&i.rating===void 0&&window.AppRating.updateUserRating(i.id).then(Y=>{Object.assign(i,Y)}).catch(()=>{});const _=(A||[]).find(Y=>Y.id===l),P=l===i.id,C=!P&&_?_:i,N=e&&!P&&!t,q=N?{status:C.status||"out",lastCheckIn:C.lastCheckIn||null}:y,z=q.status==="in",j=i.notifications||[];i.tagHistory;let G="00 : 00 : 00",D="Check-in",M="action-btn";z&&(D="Check-out",M="action-btn checkout");const H=Y=>{const te=Math.max(0,Y||0);let se=Math.floor(te/(1e3*60*60)),le=Math.floor(te/(1e3*60)%60),ne=Math.floor(te/1e3%60);return`${String(se).padStart(2,"0")} : ${String(le).padStart(2,"0")} : ${String(ne).padStart(2,"0")}`};if(z&&q.lastCheckIn){const Y=new Date(q.lastCheckIn).getTime();G=H(Date.now()-Y)}const W=pt(),K=ut(j);let V="";e&&!P&&_&&(V=`
            <div class="card full-width" style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 1rem 1.5rem; border-left: 5px solid #ea580c; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="position: relative;">
                            <img src="${Ie(_.avatar)}" alt="${x(_.name)}" style="width: 48px; height: 48px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3);">
                            <div style="position: absolute; bottom: -2px; right: -2px; background: #ea580c; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; border: 2px solid white;">
                                <i class="fa-solid fa-eye"></i>
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.7rem; font-weight: 600; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Currently Viewing</div>
                            <h3 style="margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px;">${x(_.name)}'s Dashboard</h3>
                            <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 2px;">${x(_.role)} • ${x(_.dept||"General")}</div>
                        </div>
                    </div>
                    <button onclick="window.app_changeSummaryStaff('${i.id}')" style="background: rgba(255,255,255,0.2); color: white; border: 2px solid rgba(255,255,255,0.3); padding: 0.6rem 1.2rem; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.85rem; backdrop-filter: blur(10px); transition: all 0.2s;">
                        <i class="fa-solid fa-arrow-left"></i> Back to My Dashboard
                    </button>
                </div>
            </div>`);let Z="";const ce=window.AppUI.renderYearlyPlan?window.AppUI.renderYearlyPlan(b):'<div class="card">Yearly Plan (Loading...)</div>';if(e){const Y=!!window.app_selectedSummaryStaffId&&window.app_selectedSummaryStaffId!==i.id,te=(I||[]).slice().sort((ne,Ke)=>new Date(Ke.appliedOn||0)-new Date(ne.appliedOn||0)),se=Y?te.filter(ne=>(ne.userId||ne.user_id)===l).slice(0,8):te.slice(0,8),le=ct(se,{title:Y?`${_?.name||"Staff"} Leave History`:"Leave Request History",subtitle:Y?"Based on selected staff summary":"Latest requests (all staff)"});Z=`
            <div class="dashboard-summary-row">
                <div style="flex: 2; min-width: 350px; display: flex; flex-direction: column;">${lt(w)}${le}</div>
                <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 1rem;">${ce}${S}</div>
            </div>
            <div class="dashboard-stats-row">
                ${we(P?h.label:`${h.label} - ${_?.name||"Staff"}`,P?"Monthly Stats":"Viewing Staff Monthly Stats",h)}
                ${we("Yearly Summary",P?f.label:`${f.label} for ${_?.name||"Staff"}`,f)}
            </div>`}else Z=`
            <div class="dashboard-summary-row">
                <div style="flex: 1.2; min-width: 300px; display: flex; flex-direction: column;">${We(A,j,i)}</div>
                <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 1rem;">${ce}${S}</div>
            </div>
            <div class="dashboard-stats-row">
                ${we(h.label,"Monthly Stats",h)}
                ${we("Yearly Summary",f.label,f)}
            </div>`;const ee=window.app_getReleaseUpdateState&&window.app_getReleaseUpdateState()||{active:!1,countdownLabel:"00:00"};return`
        <div class="dashboard-grid dashboard-modern dashboard-staff-view">
            ${W}
            ${K}
            ${V}
            <div class="card full-width dashboard-hero-card">
                <div class="dashboard-hero-orb dashboard-hero-orb-top"></div>
                <div class="dashboard-hero-orb dashboard-hero-orb-bottom"></div>
                <div class="dashboard-hero-content">
                    <div class="dashboard-hero-row">
                        <div class="dashboard-hero-copy">
                            <h2 class="dashboard-hero-title">Welcome back, ${i.name.split(" ")[0]}! 👋</h2>
                            <p class="dashboard-hero-date">${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
                            ${i.rating!==void 0?`<div class="dashboard-hero-chip-row"><div class="dashboard-hero-chip"><span class="dashboard-hero-chip-label">Your Rating:</span>${Bt(i.rating,!0)}</div>${i.completionStats?`<div class="dashboard-hero-chip"><i class="fa-solid fa-check-circle dashboard-hero-chip-icon"></i><span>${(i.completionStats.completionRate*100).toFixed(0)}% Complete</span></div>`:""}</div>`:""}
                        </div>
                        ${e?`<div class="dashboard-viewing-box"><div class="dashboard-viewing-inner"><i class="fa-solid fa-users-viewfinder dashboard-viewing-icon"></i><div class="dashboard-viewing-meta"><div class="dashboard-viewing-head"><div class="dashboard-viewing-label">Viewing Summary For</div>${l!==i.id?'<span class="dashboard-viewing-state">STAFF VIEW ACTIVE</span>':""}</div><select onchange="window.app_changeSummaryStaff(this.value)" class="dashboard-viewing-select"><option value="${i.id}">My Own Summary</option><optgroup label="Staff Members">${(A||[]).filter(Y=>Y.id!==i.id).sort((Y,te)=>Y.name.localeCompare(te.name)).map(Y=>`<option value="${Y.id}" ${Y.id===l?"selected":""}>${Y.name}</option>`).join("")}</optgroup></select></div></div></div>`:""}
                        <div class="welcome-icon dashboard-hero-weather"><i class="fa-solid fa-cloud-sun dashboard-hero-weather-icon"></i></div>
                    </div>
                </div>
                <button class="${ee.active?"dashboard-refresh-link is-update-pending":"dashboard-refresh-link"}" onclick="window.app_showSystemUpdatePopup()" title="${ee.active?`Update available. Auto-refresh in ${ee.countdownLabel}`:"Check for System Update"}">
                    ${ee.active?`System update available <span class="dashboard-refresh-countdown">(${ee.countdownLabel})</span>`:"Check for System Update"}
                </button>
            </div>
            <div class="dashboard-primary-row">
                <div class="card check-in-widget" style="flex: 1; min-width: 210px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 0; background: white; border: 1px solid #eef2ff;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 0.75rem;"><div style="position: relative;"><img src="${Ie(C.avatar)}" alt="Profile" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #e0e7ff;"><div style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border-radius: 50%; background: ${z?"#10b981":"#94a3b8"}; border: 2px solid white;"></div></div><div style="text-align: left;"><h4 style="font-size: 0.95rem; margin: 0; color: #1e1b4b;">${x(C.name)}</h4><p class="text-muted" style="font-size: 0.75rem; margin: 0;">${x(C.role)}</p></div></div>
                    <div style="text-align:center; padding: 0.5rem 0;"><div class="timer-display" id="timer-display" style="font-size: 2.25rem; font-weight: 800; color: #1e1b4b; line-height: 1; letter-spacing: -1px;">${G}</div><div id="timer-label" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 6px; font-weight: 600;">Elapsed Time Today</div></div>
                    <div id="countdown-container" style="display: none; margin-bottom: 0.75rem; width: 100%;"><div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #4b5563; margin-bottom: 4px;"><span id="countdown-label">Time to checkout</span><span id="countdown-value" style="font-weight: 600;">--:--:--</span></div><div style="width: 100%; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;"><div id="countdown-progress" style="width: 0%; height: 100%; background: var(--primary); transition: width 1s linear;"></div></div></div>
                    <div id="overtime-container" style="display: none; background: #fff7ed; border: 1px solid #ffedd5; padding: 0.5rem; border-radius: 8px; margin-bottom: 0.75rem; text-align: center;"><div style="color: #c2410c; font-weight: 700; font-size: 0.8rem; margin-bottom: 2px;">OVERTIME</div><div id="overtime-value" style="color: #ea580c; font-size: 1.1rem; font-weight: 800; font-family: monospace;">00:00:00</div></div>
                    <button class="${M}" id="attendance-btn" ${N?"disabled":""} title="${N?"View only":""}" style="width: 100%; padding: 0.75rem; font-size: 0.9rem; border-radius: 10px; margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s ease; ${N?"opacity:0.6; cursor:not-allowed;":""}">${D} <i class="fa-solid fa-fingerprint"></i></button>
                    <div class="location-text" id="location-text" style="font-size: 0.65rem; color: #94a3b8; text-align: center; margin-top: 0.5rem;"><i class="fa-solid fa-location-dot"></i><span>${z&&C.currentLocation?`Lat: ${Number(C.currentLocation.lat).toFixed(4)}, Lng: ${Number(C.currentLocation.lng).toFixed(4)}`:"Waiting for location..."}</span></div>
                </div>
                <div style="flex: 1.1; min-width: 230px; display: flex; flex-direction: column; ${P?"":"border: 2px solid #fb923c; border-radius: 12px;"}">${st(g,$,_)}</div>
                <div style="flex: 1.8; min-width: 280px; display: flex; flex-direction: column;">${rt(E)}</div>
                ${e?`<div style="flex: 1.2; min-width: 210px; display: flex; flex-direction: column;">${We(A,j,i)}</div>`:""}
            </div>
            ${Z}
        </div>`}function Le(i){const[e,t]=String(i||"").split("-"),a=Number(e),n=Number(t)-1;return!Number.isInteger(a)||!Number.isInteger(n)||n<0||n>11?i||"Current Month":new Date(a,n,1).toLocaleDateString("en-US",{month:"long",year:"numeric"})}function Ut(i=8){const e=[],t=new Date;t.setDate(1);for(let a=0;a<i;a++){const n=new Date(t);n.setMonth(t.getMonth()-a);const s=n.toISOString().slice(0,7);e.push({key:s,label:Le(s)})}return e}function ma(i){const e=[],t=new Map;return(i||[]).forEach(a=>{const n=(a._displayDesc||"").trim(),s=`${a.staffName||""}|${a.date||""}|${n}`;t.has(s)||(t.set(s,a),e.push(a))}),e.map(a=>{const n=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(a.date,a.status||""):a.status||"to-be-started";return{...a,_taskStatus:n,_taskGroup:n==="completed"?"completed":"incomplete"}})}function fa(i,e){const t=[...i],a={completed:0,"in-process":1,overdue:2,"not-completed":3,"to-be-started":4};return t.sort((n,s)=>{const r=new Date(s.date)-new Date(n.date),d=String(n.staffName||"").toLowerCase().localeCompare(String(s.staffName||"").toLowerCase());return e==="date-asc"?new Date(n.date)-new Date(s.date)||d:e==="staff-asc"?d||r:e==="staff-desc"?-d||r:e==="completed-first"?n._taskGroup.localeCompare(s._taskGroup)||r:e==="incomplete-first"?s._taskGroup.localeCompare(n._taskGroup)||r:e==="status-priority"?(a[n._taskStatus]??99)-(a[s._taskStatus]??99)||r||d:r||d}),t}function ya(i){if(!i)return;const e=be.controllers.get(i);e&&(e.intervalId&&clearInterval(e.intervalId),e.pauseTimeoutId&&clearTimeout(e.pauseTimeoutId),e.resumeTimeoutId&&clearTimeout(e.resumeTimeoutId),i.removeEventListener("mouseenter",e.onMouseEnter),i.removeEventListener("mouseleave",e.onMouseLeave),i.removeEventListener("touchstart",e.onTouchStart),i.removeEventListener("touchend",e.onTouchEnd),i.removeEventListener("touchcancel",e.onTouchCancel),be.controllers.delete(i),be.elements.delete(i))}function Ot(){Array.from(be.elements).forEach(i=>ya(i))}function Rt(i){if(!i)return;Ot(),i.querySelectorAll(".dashboard-team-activity-col-list").forEach(t=>{const a={intervalId:null,pauseTimeoutId:null,resumeTimeoutId:null,direction:1,isPausedByUser:!1,isWaitingAtEdge:!1},n=(r,d)=>{a.isWaitingAtEdge=!0,a.pauseTimeoutId&&clearTimeout(a.pauseTimeoutId),a.pauseTimeoutId=setTimeout(()=>{a.direction=r,a.isWaitingAtEdge=!1},d)},s=()=>{if(a.isPausedByUser||a.isWaitingAtEdge||!t.isConnected)return;const r=Math.max(0,t.scrollHeight-t.clientHeight);r<=0||(t.scrollTop+=a.direction,a.direction===1&&t.scrollTop>=r?(t.scrollTop=r,n(-1,1500)):a.direction===-1&&t.scrollTop<=0&&(t.scrollTop=0,n(1,1e3)))};a.onMouseEnter=()=>{a.isPausedByUser=!0},a.onMouseLeave=()=>{a.isPausedByUser=!1},a.onTouchStart=()=>{a.isPausedByUser=!0,a.resumeTimeoutId&&clearTimeout(a.resumeTimeoutId)},a.onTouchEnd=()=>{a.resumeTimeoutId&&clearTimeout(a.resumeTimeoutId),a.resumeTimeoutId=setTimeout(()=>{a.isPausedByUser=!1},400)},t.addEventListener("mouseenter",a.onMouseEnter),t.addEventListener("mouseleave",a.onMouseLeave),t.addEventListener("touchstart",a.onTouchStart,{passive:!0}),t.addEventListener("touchend",a.onTouchEnd,{passive:!0}),a.intervalId=setInterval(s,50),be.controllers.set(t,a),be.elements.add(t)})}const wa=async(i=!0)=>{const e=Te(),t=document.getElementById("staff-activity-list"),a=document.getElementById("staff-activity-list-modal");if(!t&&!a)return;Ot(),i&&window.AppAnalytics&&(e.logs=await window.AppAnalytics.getAllStaffActivities({mode:"month",month:e.selectedMonth,scope:"work"}));const n=Ae(e.logs,e.sortKey);t&&(t.innerHTML=n,Rt(t)),a&&(a.innerHTML=n);const s=document.getElementById("staff-activity-range-label");s&&(s.textContent=Le(e.selectedMonth))};typeof window<"u"&&(window.AppUI||(window.AppUI={}),window.AppUI.renderDashboard=mt,window.AppUI.renderHeroCard=je,window.AppUI.renderWorkLog=st,window.AppUI.renderActivityList=ot,window.AppUI.renderActivityLog=rt,window.AppUI.renderStaffActivityListSplit=Ae,window.AppUI.renderStaffActivityColumn=ze,window.AppUI.renderStatsCard=we,window.AppUI.renderBreakdown=dt,window.AppUI.renderLeaveRequests=lt,window.AppUI.renderLeaveHistory=ct,window.AppUI.renderNotificationPanel=pt,window.AppUI.renderTaggedItems=ut,window.AppUI.renderStaffDirectory=We,window.app_expandTeamActivity=function(){const i=Te(),e=Ut(8),t=Le(i.selectedMonth),a=document.createElement("div");a.id="team-activity-modal-overlay",a.className="team-activity-modal-overlay",a.innerHTML=`
            <div class="team-activity-modal-content">
                <div class="team-activity-modal-header">
                    <div class="team-activity-modal-title-wrap">
                        <h2>Team Activity - Full View</h2>
                        <span id="staff-activity-range-label-modal">${x(t)}</span>
                    </div>
                    <div class="team-activity-modal-actions">
                        <div class="dashboard-team-activity-filters">
                            <select class="dashboard-team-select" onchange="window.app_setStaffActivityMonth(this.value); window.app_expandTeamActivityRefresh();">
                                ${e.map(n=>`<option value="${n.key}" ${n.key===i.selectedMonth?"selected":""}>${x(n.label)}</option>`).join("")}
                            </select>
                            <select class="dashboard-team-select" onchange="window.app_setStaffActivitySort(this.value); window.app_expandTeamActivityRefresh();">
                                <option value="date-desc" ${i.sortKey==="date-desc"?"selected":""}>Date (Newest)</option>
                                <option value="date-asc" ${i.sortKey==="date-asc"?"selected":""}>Date (Oldest)</option>
                                <option value="completed-first" ${i.sortKey==="completed-first"?"selected":""}>Completed First</option>
                                <option value="incomplete-first" ${i.sortKey==="incomplete-first"?"selected":""}>Incomplete First</option>
                                <option value="status-priority" ${i.sortKey==="status-priority"?"selected":""}>Status Priority</option>
                                <option value="staff-asc" ${i.sortKey==="staff-asc"?"selected":""}>Staff (A-Z)</option>
                                <option value="staff-desc" ${i.sortKey==="staff-desc"?"selected":""}>Staff (Z-A)</option>
                            </select>
                        </div>
                        <button class="team-activity-modal-close" onclick="window.app_closeTeamActivityExpanded()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                <div id="staff-activity-list-modal" class="team-activity-modal-body">
                    ${Ae(i.logs,i.sortKey)}
                </div>
            </div>
        `,document.body.appendChild(a),document.body.style.overflow="hidden",window._teamActivityEscHandler=n=>{n.key==="Escape"&&window.app_closeTeamActivityExpanded()},window.addEventListener("keydown",window._teamActivityEscHandler)},window.app_expandTeamActivityRefresh=function(){const i=Te(),e=document.getElementById("staff-activity-list-modal"),t=document.getElementById("staff-activity-range-label-modal");e&&(e.innerHTML=Ae(i.logs,i.sortKey)),t&&(t.textContent=Le(i.selectedMonth))},window.app_closeTeamActivityExpanded=function(){const i=document.getElementById("team-activity-modal-overlay");i&&(i.remove(),document.body.style.overflow="",window.removeEventListener("keydown",window._teamActivityEscHandler))});async function Ht(){const i=window.AppAuth.getUser(),e=window.AppDB.getCached?await window.AppDB.getCached(window.AppDB.getCacheKey("staffUsers","users",{}),window.AppConfig?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):await window.AppDB.getAll("users"),t=window.app_getMyMessages?await window.app_getMyMessages():await window.AppDB.getAll("staff_messages"),a=e.filter(u=>u.id!==i.id).sort((u,y)=>u.name.localeCompare(y.name));!window.app_staffThreadId&&a.length>0&&(window.app_staffThreadId=a[0].id);const n=e.find(u=>u.id===window.app_staffThreadId),s=u=>x(u).replace(/(https?:\/\/[^\s]+)/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'),r=t.filter(u=>u.fromId===i.id&&u.toId===window.app_staffThreadId||u.fromId===window.app_staffThreadId&&u.toId===i.id).sort((u,y)=>new Date(u.createdAt||0)-new Date(y.createdAt||0)),d=r.filter(u=>u.type==="text"),o=r.filter(u=>u.type==="task"),l={};t.forEach(u=>{u.toId===i.id&&!u.read&&(l[u.fromId]=(l[u.fromId]||0)+1)});const c=a.map(u=>{const y=l[u.id]||0;return`
            <button class="staff-directory-item ${u.id===window.app_staffThreadId?"active":""}" onclick="window.app_openStaffThread('${u.id}')">
                <div class="staff-directory-avatar">
                    <img src="${u.avatar}" alt="${x(u.name)}">
                </div>
                <div class="staff-directory-info">
                    <div class="staff-directory-name">${x(u.name)}</div>
                    <div class="staff-directory-role">${x(u.role||"Staff")}</div>
                </div>
                ${y?`<span class="staff-directory-badge">${y}</span>`:""}
            </button>
        `}).join(""),p=n?d.length?d.map(u=>`
        <div class="staff-message ${u.fromId===i.id?"outgoing":"incoming"}">
            <div class="staff-message-meta">${x(u.fromName)} • ${new Date(u.createdAt).toLocaleString()}</div>
            <div class="staff-message-body">${s(u.message||"")}</div>
            ${u.link?`<div class="staff-message-link"><a href="${u.link}" target="_blank" rel="noopener noreferrer">${u.link}</a></div>`:""}
        </div>
    `).join(""):'<div class="staff-message-empty">No messages yet.</div>':'<div class="staff-message-empty">Select a staff member to view messages.</div>',m=n?o.length?o.map(u=>`
        <div class="staff-task-card">
            <div class="staff-task-head">
                <div>
                    <div class="staff-task-title">${x(u.title||"Task")}</div>
                    <div class="staff-task-meta">From ${x(u.fromName)} • Due ${u.dueDate||"No date"}</div>
                </div>
                <span class="staff-task-status ${u.status||"pending"}">${(u.status||"pending").toUpperCase()}</span>
            </div>
            <div class="staff-task-desc">${x(u.description||"")}</div>
            ${u.status==="pending"&&u.toId===i.id?`
                <div class="staff-task-actions">
                    <button onclick="window.app_respondStaffTask('${u.id}', 'approved')" class="staff-task-btn approve">Approve</button>
                    <button onclick="window.app_respondStaffTask('${u.id}', 'rejected')" class="staff-task-btn reject">Reject</button>
                </div>
            `:""}
            ${u.rejectReason?`<div class="staff-task-reason">Reason: ${x(u.rejectReason)}</div>`:""}
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
                        <h3>${n?x(n.name):"Select a staff member"}</h3>
                        <span>${n?x(n.role||"Staff"):""}</span>
                    </div>
                    <div class="staff-thread-actions">
                        <button class="staff-thread-action-btn" ${n?"":"disabled"} onclick="window.app_openStaffMessageModal('${n?n.id:""}', '${n?x(n.name):""}')">
                            <i class="fa-solid fa-message"></i> Send Message
                        </button>
                        <button class="staff-thread-action-btn secondary" ${n?"":"disabled"} onclick="window.app_openStaffTaskModal('${n?n.id:""}', '${n?x(n.name):""}')">
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
    `}typeof window<"u"&&(window.AppUI||(window.AppUI={}),window.AppUI.renderStaffDirectoryPage=Ht);async function ge(){typeof window.app_setAnnualStaffFilter!="function"&&(window.app_setAnnualStaffFilter=async S=>{window.app_annualStaffFilter=String(S||"").trim();const _=document.getElementById("page-content");_&&(_.innerHTML=await ge())}),typeof window.app_toggleAnnualView!="function"&&(window.app_toggleAnnualView=async S=>{window.app_annualViewMode=S;const _=document.getElementById("page-content");_&&(_.innerHTML=await ge())}),typeof window.app_setAnnualListSearch!="function"&&(window.app_setAnnualListSearch=async S=>{window.app_annualListSearch=String(S||"").trim();const _=document.getElementById("page-content");_&&(_.innerHTML=await ge())}),typeof window.app_setAnnualListSort!="function"&&(window.app_setAnnualListSort=async S=>{window.app_annualListSort=String(S||"date-asc").trim();const _=document.getElementById("page-content");_&&(_.innerHTML=await ge())});const i=new Date,e=`${i.getFullYear()}-${String(i.getMonth()+1).padStart(2,"0")}-${String(i.getDate()).padStart(2,"0")}`,t=window.app_annualYear||i.getFullYear(),a=await window.AppCalendar.getPlans(),n=await window.AppDB.getAll("users").catch(()=>[]),s=await window.AppDB.getAll("attendance").catch(()=>[]);window._currentPlans=a;const r=["January","February","March","April","May","June","July","August","September","October","November","December"],d={};(n||[]).forEach(S=>{d[S.id]=S.name}),window._annualUserMap=d;const o=(S,_)=>d[S]||_||"Staff",l=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0,overdue:!0,completed:!0};window.app_annualLegendFilters=l;let c=window.app_selectedAnnualDate||(t===i.getFullYear()?e:null);c&&!c.startsWith(`${t}-`)&&(c=null),window.app_selectedAnnualDate=c;const p=String(window.app_annualStaffFilter||"").trim(),m=p.toLowerCase(),u=String(window.app_annualListSearch||"").trim(),y=u.toLowerCase(),g=String(window.app_annualListSort||"date-asc"),h=(n||[]).map(S=>`<option value="${x(S.name)}"></option>`).join(""),f=S=>m?String(S||"").toLowerCase().includes(m):!0,v={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11},b=(S="")=>{const _=String(S||"").trim();if(!_)return null;const P=_.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);if(!P)return null;const C=Number(P[1]),N=Number(P[2]),q=String(P[3]||"").toLowerCase(),z=Number(P[4]),j=v[q];if(!Number.isInteger(C)||!Number.isInteger(N)||!Number.isInteger(j)||!Number.isInteger(z))return null;const G=new Date(z,j,C),D=new Date(z,j,N);if(Number.isNaN(G.getTime())||Number.isNaN(D.getTime()))return null;const M=`${G.getFullYear()}-${String(G.getMonth()+1).padStart(2,"0")}-${String(G.getDate()).padStart(2,"0")}`,H=`${D.getFullYear()}-${String(D.getMonth()+1).padStart(2,"0")}-${String(D.getDate()).padStart(2,"0")}`;return H<M?null:{startDate:M,endDate:H}},k=(S,_)=>{const P=!S?.startDate&&!S?.endDate?b(S?.task||""):null,C=S?.startDate||P?.startDate||_,N=S?.endDate||P?.endDate||S?.startDate||_;return{startDate:C,endDate:N}},w=(S,_,P)=>{const{startDate:C,endDate:N}=k(S,_);return!C||!N?_===P:!(P<C||P>N||S?.completedDate&&S.completedDate<P)},A=(a.workPlans||[]).filter(S=>{if((S.planScope||"personal")==="annual"){if(!m)return!0;const C=o(S.userId,S.userName);return f(C)?!0:(S.plans||[]).some(N=>{const q=o(N.assignedTo||S.userId,C),z=(N.tags||[]).map(j=>j.name||j).join(" ");return f(q)||f(z)})}if(!m)return!0;const P=o(S.userId,S.userName);return f(P)?!0:(S.plans||[]).some(C=>{const N=o(C.assignedTo||S.userId,P),q=(C.tags||[]).map(z=>z.name||z).join(" ");return f(N)||f(q)})}),$=(a.leaves||[]).filter(S=>f(o(S.userId,S.userName))),I=(s||[]).filter(S=>{if(!String(S.date||"").startsWith(String(t)))return!1;const P=S.user_id||S.userId,C=o(P,"");return m?f(C):!0}),L=(S,_,P)=>{const C=`${P}-${String(_+1).padStart(2,"0")}-${String(S).padStart(2,"0")}`,N=$.some(M=>C>=M.startDate&&C<=M.endDate),q=!m&&(a.events||[]).some(M=>M.date===C),z=I.some(M=>M.date===C),j=A.some(M=>!Array.isArray(M.plans)||!M.plans.length?M.date===C:M.plans.some(H=>w(H,M.date,C)))||z;let G="",D=!1;if(j){const M=A.filter(W=>!Array.isArray(W.plans)||!W.plans.length?W.date===C:W.plans.some(K=>w(K,W.date,C)));let H="to-be-started";M.forEach(W=>{(W.plans||[]).forEach(K=>{if(!w(K,W.date,C))return;const{startDate:V,endDate:Z}=k(K,W.date);V&&Z&&V!==Z&&Z===C&&(D=!0);const ce=K.completedDate||Z||W.date||C,ee=window.AppCalendar?window.AppCalendar.getSmartTaskStatus(ce,K.status):K.status||"pending";ee==="overdue"?H="overdue":ee==="in-process"&&H!=="overdue"?H="in-process":ee==="completed"&&H!=="overdue"&&H!=="in-process"&&(H="completed")})}),z&&H==="to-be-started"&&(H="completed"),G=H}return{hasLeave:N,hasEvent:q,hasWork:j,workStatus:G,hasRangeEnd:D}};let T="";for(let S=0;S<12;S++){const _=new Date(t,S,1).getDay(),P=new Date(t,S+1,0).getDate();let C="";for(let N=0;N<_;N++)C+='<div class="annual-day empty"></div>';for(let N=1;N<=P;N++){const q=L(N,S,t),z=N===i.getDate()&&S===i.getMonth()&&t===i.getFullYear(),j=`${t}-${String(S+1).padStart(2,"0")}-${String(N).padStart(2,"0")}`,G=q.hasLeave&&l.leave,D=q.hasEvent&&l.event,M=q.hasWork&&l.work&&(q.workStatus==="overdue"?l.overdue:q.workStatus==="completed"?l.completed:!0),H=G||D||M,W=M?`has-work work-${q.workStatus}`:"";C+=`
                <div class="annual-day ${z?"today":""} ${W} ${c===j?"selected":""} ${H?"":"annual-day-muted"}" onclick="window.app_openAnnualDayPlan('${j}')" onmouseenter="window.app_showAnnualHoverPreview(event, '${j}')" onmouseleave="window.app_hideAnnualHoverPreview()">
                    ${N}
                    <div class="dot-container">
                        ${G?'<span class="status-dot dot-leave"></span>':""}
                        ${D?'<span class="status-dot dot-event"></span>':""}
                        ${M?'<span class="status-dot dot-work"></span>':""}
                        ${q.hasRangeEnd?'<span class="status-dot" title="Task ends today" style="background:#f97316;"></span>':""}
                    </div>
                </div>`}T+=`
            <div class="annual-month-card">
                <div class="annual-month-head">
                    <span class="annual-month-title">${r[S]}</span>
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
                    ${C}
                </div>
            </div>`}const B=window.app_annualViewMode||"grid",E=(()=>{const S=[],_=new Set,P=D=>{if(!D)return"";const M=String(D).replace(/_/g,"-").toLowerCase();return{"in-process":"In Process","to-be-started":"To Be Started","not-completed":"Not Completed",completed:"Completed",overdue:"Overdue",pending:"Pending",approved:"Approved",holiday:"Holiday",event:"Event"}[M]||M.replace(/\b\w/g,W=>W.toUpperCase())},C=(D,M)=>M||(window.AppCalendar&&D?window.AppCalendar.getSmartTaskStatus(D,M):"pending");if(!m&&window.AppAnalytics){const D=new Date(t,0,1),M=new Date(t,11,31);for(let H=new Date(D);H<=M;H.setDate(H.getDate()+1)){const W=H.toISOString().split("T")[0],K=window.AppAnalytics.getDayType(H);K==="Holiday"?S.push({date:W,type:"holiday",title:"Company Holiday (Weekend)",staffName:"All Staff",assignedBy:"System",assignedTo:"All Staff",selfAssigned:!1,dueDate:W,status:"holiday",comments:"",scope:"Shared"}):K==="Half Day"&&S.push({date:W,type:"event",title:"Half Working Day (Sat)",staffName:"All Staff",assignedBy:"System",assignedTo:"All Staff",selfAssigned:!1,dueDate:W,status:"event",comments:"",scope:"Shared"})}}$.forEach(D=>{const M=new Date(D.startDate),H=new Date(D.endDate||D.startDate),W=o(D.userId,D.userName);for(let K=new Date(M);K<=H;K.setDate(K.getDate()+1)){const V=K.toISOString().split("T")[0];V.startsWith(String(t))&&S.push({date:V,type:"leave",title:`${W} (${D.type||"Leave"})`,staffName:W,assignedBy:W,assignedTo:W,selfAssigned:!0,dueDate:D.endDate||D.startDate||V,status:(D.status||"approved").toLowerCase(),comments:D.reason||"",scope:"Personal"})}}),(a.events||[]).forEach(D=>{if(!m&&String(D.date||"").startsWith(String(t))){const M=[String(D.date||"").trim(),String(D.title||"").trim().toLowerCase(),String(D.type||"event").trim().toLowerCase(),String(D.createdById||D.createdByName||"").trim().toLowerCase()].join("|");if(_.has(M))return;_.add(M),S.push({date:D.date,type:D.type||"event",title:D.title||"Company Event",staffName:"All Staff",assignedBy:D.createdByName||"Admin",assignedTo:"All Staff",selfAssigned:!1,dueDate:D.date,status:"event",comments:D.description||"",scope:"Shared"})}}),A.forEach(D=>{if(String(D.date||"").startsWith(String(t))){const M=(D.planScope||"personal")==="annual",H=o(D.userId,D.userName)||(M?"All Staff":"Staff"),W=M?"Annual":"Personal",K=D.date;if(D.plans&&D.plans.length>0)D.plans.forEach(V=>{const Z=M?D.createdByName||V.taggedByName||"Admin":V.taggedByName||H,ce=V.assignedTo||D.userId,ee=M?Z:o(ce,H),Y=(V.tags||[]).map(kt=>kt.name||kt).filter(Boolean),{startDate:te,endDate:se}=k(V,K),le=V.completedDate||se||K,ne=C(le,V.status),Ke=V.subPlans&&V.subPlans.length?V.subPlans.join("; "):V.comment||V.notes||"";S.push({date:te||K,type:"work",title:V.task||"Work Plan Task",staffName:M?Z:ee,assignedBy:Z,assignedTo:M?Z:ee,selfAssigned:Z===ee,dueDate:V.dueDate||se||K,status:ne,comments:Ke,tags:Y,scope:W})});else{const V=C(K,null);S.push({date:K,type:"work",title:D.plan||"Work Plan",staffName:H,assignedBy:H,assignedTo:H,selfAssigned:!0,dueDate:K,status:V,comments:"",tags:[],scope:W})}}}),I.forEach(D=>{const M=D.user_id||D.userId,H=o(M,"Staff"),W=(D.workDescription||D.location||"").trim()||"Manual log entry";S.push({date:D.date,type:"work",title:W,staffName:H,assignedBy:H,assignedTo:H,selfAssigned:!0,dueDate:D.date,status:"completed",comments:W,tags:["Manual Log"],scope:"Personal"})});const N=[],q=new Set;S.forEach(D=>{const M=`${D.date||""}|${D.type||""}|${D.title||""}|${D.staffName||""}|${D.status||""}`.toLowerCase();q.has(M)||(q.add(M),N.push(D))}),N.sort((D,M)=>D.date.localeCompare(M.date)||D.type.localeCompare(M.type)),N.forEach(D=>{D.statusLabel=P(D.status),D.statusClass=String(D.status||"pending").replace(/[^a-z0-9]+/gi,"-").toLowerCase()});let z=y?N.filter(D=>[D.date,D.staffName,D.title,D.statusLabel,D.comments].join(" ").toLowerCase().includes(y)):N;const j={"date-asc":(D,M)=>String(D.date||"").localeCompare(String(M.date||"")),"date-desc":(D,M)=>String(M.date||"").localeCompare(String(D.date||"")),"staff-asc":(D,M)=>String(D.staffName||"").localeCompare(String(M.staffName||"")),"staff-desc":(D,M)=>String(M.staffName||"").localeCompare(String(D.staffName||"")),"status-asc":(D,M)=>String(D.statusLabel||"").localeCompare(String(M.statusLabel||"")),"status-desc":(D,M)=>String(M.statusLabel||"").localeCompare(String(D.statusLabel||""))},G=j[g]||j["date-asc"];return z.slice().sort(G)})();return window._annualListItems=E,`
        <div class="annual-plan-shell annual-v2-shell">
            <div class="card annual-plan-header annual-v2-header">
                <div class="annual-plan-title-wrap annual-v2-title-wrap">
                    <h2 class="annual-plan-title annual-v2-title">NGO Annual Planning</h2>
                    <p class="annual-plan-subtitle annual-v2-subtitle">Overview of activities for ${t}.</p>
                </div>
                <div class="annual-plan-controls annual-v2-controls">
                    <div class="annual-staff-filter annual-v2-staff-filter">
                        <i class="fa-solid fa-user"></i>
                        <input type="text" list="annual-staff-names" value="${x(p)}" placeholder="Filter by staff name" oninput="window.app_setAnnualStaffFilter(this.value)">
                        <datalist id="annual-staff-names">${h}</datalist>
                    </div>
                    <div class="annual-view-toggle annual-v2-view-toggle">
                        <button onclick="window.app_toggleAnnualView('grid')" class="annual-toggle-btn annual-v2-toggle-btn ${B==="grid"?"active":""}">
                            <i class="fa-solid fa-calendar-days"></i> Grid
                        </button>
                        <button onclick="window.app_toggleAnnualView('list')" class="annual-toggle-btn annual-v2-toggle-btn ${B==="list"?"active":""}">
                            <i class="fa-solid fa-list"></i> List
                        </button>
                    </div>
                    <button onclick="window.app_jumpToAnnualToday()" class="annual-today-btn annual-v2-today-btn" title="Jump to today">
                        <i class="fa-solid fa-bullseye"></i> Today
                    </button>
                    <div class="annual-year-switch annual-v2-year-switch">
                        <button onclick="window.app_changeAnnualYear(-1)"><i class="fa-solid fa-chevron-left"></i></button>
                        <div class="annual-year-label">${t}</div>
                        <button onclick="window.app_changeAnnualYear(1)"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </div>
            </div>

            <div id="annual-grid-view" style="display:${B==="grid"?"block":"none"};">
                <div class="card annual-legend-bar annual-v2-legend-bar">
                    <button class="annual-legend-chip ${l.leave?"active":""}" onclick="window.app_toggleAnnualLegendFilter('leave')"><span class="annual-dot leave"></span> Staff Leave</button>
                    <button class="annual-legend-chip ${l.event?"active":""}" onclick="window.app_toggleAnnualLegendFilter('event')"><span class="annual-dot event"></span> Company Event</button>
                    <button class="annual-legend-chip ${l.work?"active":""}" onclick="window.app_toggleAnnualLegendFilter('work')"><span class="annual-dot work"></span> Work Plan</button>
                    <button class="annual-legend-chip ${l.overdue?"active":""}" onclick="window.app_toggleAnnualLegendFilter('overdue')">Overdue Border</button>
                    <button class="annual-legend-chip ${l.completed?"active":""}" onclick="window.app_toggleAnnualLegendFilter('completed')">Completed Border</button>
                </div>
                <div class="annual-grid-layout annual-v2-grid-layout">
                    <div class="annual-plan-grid annual-v2-plan-grid">
                        ${T}
                    </div>
                </div>
            </div>

            <div id="annual-list-view" style="display:${B==="list"?"block":"none"};">
                <div class="card annual-list-card annual-v2-list-card">
                    <div class="annual-list-head annual-v2-list-head">
                        <h4>Annual Timeline</h4>
                        <div class="annual-list-actions annual-v2-list-actions">
                            <div class="annual-list-search-wrap annual-v2-search-wrap">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="text" value="${x(u)}" placeholder="Search list..." onkeydown="if(event.key==='Enter'){window.app_setAnnualListSearch(this.value);}">
                            </div>
                            <select class="annual-v2-sort-select" onchange="window.app_setAnnualListSort(this.value)">
                                <option value="date-asc" ${g==="date-asc"?"selected":""}>Date: Oldest First</option>
                                <option value="date-desc" ${g==="date-desc"?"selected":""}>Date: Newest First</option>
                                <option value="staff-asc" ${g==="staff-asc"?"selected":""}>Staff: A-Z</option>
                                <option value="staff-desc" ${g==="staff-desc"?"selected":""}>Staff: Z-A</option>
                            </select>
                            <button class="annual-v2-export-btn" onclick="window.AppReports?.exportAnnualListViewCSV(window._annualListItems || [])">
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
                                ${E.map(S=>`
                                    <div class="annual-list-row">
                                        <div class="annual-list-cell">${S.date}</div>
                                        <div class="annual-list-cell">${x(S.staffName)}</div>
                                        <div class="annual-list-cell annual-list-task">${x(S.title)}</div>
                                        <div class="annual-list-cell">${x(S.assignedBy)}</div>
                                        <div class="annual-list-cell"><span class="annual-list-status status-${S.statusClass}">${S.statusLabel}</span></div>
                                        <div class="annual-list-cell annual-list-comments">${x(S.comments||"--")}</div>
                                        <div class="annual-list-cell">${S.scope}</div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                    `}
                </div>
            </div>
        </div>`}typeof window<"u"&&(window.AppUI||(window.AppUI={}),window.AppUI.renderAnnualPlan=ge);async function he(){typeof window.app_setTimesheetView!="function"&&(window.app_setTimesheetView=async w=>{window.app_timesheetViewMode=w==="calendar"?"calendar":"list";const A=document.getElementById("page-content");A&&(A.innerHTML=await he())}),typeof window.app_changeTimesheetMonth!="function"&&(window.app_changeTimesheetMonth=async w=>{const A=new Date,$=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:A.getMonth(),I=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:A.getFullYear(),L=new Date(I,$,1);L.setMonth(L.getMonth()+w),window.app_timesheetMonth=L.getMonth(),window.app_timesheetYear=L.getFullYear();const T=document.getElementById("page-content");T&&(T.innerHTML=await he())}),typeof window.app_jumpTimesheetToday!="function"&&(window.app_jumpTimesheetToday=async()=>{const w=new Date;window.app_timesheetMonth=w.getMonth(),window.app_timesheetYear=w.getFullYear();const A=document.getElementById("page-content");A&&(A.innerHTML=await he())});const i=window.AppAuth.getUser(),e=await window.AppAttendance.getLogs(),t=await window.AppCalendar.getPlans().catch(()=>({workPlans:[]})),a=new Date,n=window.app_timesheetViewMode||"list",s=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:a.getMonth(),r=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:a.getFullYear(),d=new Date(r,s,1).toLocaleString("en-US",{month:"long",year:"numeric"}),o=`${r}-${String(s+1).padStart(2,"0")}-01`,l=`${r}-${String(s+1).padStart(2,"0")}-31`,c=e.filter(w=>w.date&&w.date>=o&&w.date<=l),p=(t.workPlans||[]).filter(w=>w.userId===i.id&&w.date&&w.date>=o&&w.date<=l),m={};c.forEach(w=>{m[w.date]||(m[w.date]=[]),m[w.date].push(w)});const u={};p.forEach(w=>{u[w.date]||(u[w.date]=[]),Array.isArray(w.plans)&&w.plans.length?w.plans.forEach(A=>{u[w.date].push(A.task||"Planned task")}):w.plan&&u[w.date].push(w.plan)}),window._timesheetLogsByDate=m,window._timesheetPlansByDate=u;let y=0,g=0;const h=new Set;c.forEach(w=>{w.durationMs&&(y+=w.durationMs/(1e3*60)),(w.lateCountable||window.AppAttendance&&window.AppAttendance.normalizeType(w.type)==="Late")&&g++,w.date&&h.add(w.date)});const f=`${Math.floor(y/60)}h ${Math.round(y%60)}m`,v=Math.floor(g/(window.AppConfig?.LATE_GRACE_COUNT||3))*(window.AppConfig?.LATE_DEDUCTION_PER_BLOCK||.5),b=w=>window.AppAttendance&&window.AppAttendance.normalizeType?window.AppAttendance.normalizeType(w):w;window.app_editWorkSummary=async w=>{const $=(await window.AppAttendance.getLogs()).find(T=>T.id===w),I=$?$.workDescription:"",L=await window.appPrompt("Update Work Summary:",I||"",{title:"Update Work Summary",confirmText:"Save"});if(L!==null){await window.AppAttendance.updateLog(w,{workDescription:L});const T=document.getElementById("page-content");T&&(T.innerHTML=await he())}},window.app_switchTimesheetPanel=(w,A)=>{const $=w==="calendar"?"calendar":"list";window.app_timesheetViewMode=$;const I=document.getElementById("timesheet-list-panel"),L=document.getElementById("timesheet-calendar-panel"),T=document.getElementById("timesheet-view-select");I&&(I.style.display=$==="list"?"block":"none"),L&&(L.style.display=$==="calendar"?"block":"none"),T&&(T.value=$);const B=A&&A.closest?A.closest(".timesheet-view-toggle"):null;(B?B.querySelectorAll(".annual-toggle-btn"):[]).forEach(S=>S.classList.remove("active")),A&&A.classList&&A.classList.add("active")},window.app_openTimesheetDayDetail=w=>{const A=window._timesheetLogsByDate&&window._timesheetLogsByDate[w]||[],$=window._timesheetPlansByDate&&window._timesheetPlansByDate[w]||[],I=A.length?A.map(E=>`
                <div class="timesheet-day-detail-item">
                    <div class="timesheet-day-detail-head">
                        <span>${x(E.checkIn||"--")} - ${x(E.checkOut||"--")}</span>
                        <span class="timesheet-day-status-chip">${x(b(E.type))}</span>
                    </div>
                    <div class="timesheet-day-detail-text">${x(E.workDescription||E.location||"No summary")}</div>
                    ${E.id&&E.id!=="active_now"?`<button type="button" class="action-btn secondary" onclick="window.app_editWorkSummary('${E.id}')">Edit</button>`:""}
                </div>
            `).join(""):'<div class="timesheet-day-detail-empty">No attendance logs for this date.</div>',L=$.length?$.map(E=>`<div class="timesheet-day-plan-item">${x(E)}</div>`).join(""):'<div class="timesheet-day-detail-empty">No planned tasks for this date.</div>',T=`timesheet-day-detail-${Date.now()}`,B=`
            <div class="modal-overlay" id="${T}" style="display:flex;">
                <div class="modal-content" style="max-width:560px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <h3 style="margin:0;">${x(w)} Details</h3>
                        <button type="button" class="app-system-dialog-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div style="display:grid; gap:0.9rem;">
                        <div>
                            <h4 style="margin:0 0 0.45rem 0; color:#334155;">Logged Work</h4>
                            ${I}
                        </div>
                        <div>
                            <h4 style="margin:0 0 0.45rem 0; color:#334155;">Planned Tasks</h4>
                            ${L}
                        </div>
                    </div>
                </div>
            </div>`;typeof window.app_showModal=="function"?window.app_showModal(B,T):(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",B)};const k=()=>{const w=new Date(r,s,1).getDay(),A=new Date(r,s+1,0).getDate();let $="";for(let I=0;I<w;I++)$+='<div class="timesheet-cal-day empty"></div>';for(let I=1;I<=A;I++){const L=`${r}-${String(s+1).padStart(2,"0")}-${String(I).padStart(2,"0")}`,T=m[L]||[],B=T.length?T.slice().sort((z,j)=>{const G=D=>{const M=b(D.type);return M==="Absent"?4:M==="Half Day"?3:M==="Late"?2:M==="Present (Late Waived)"?1:0};return G(j)-G(z)})[0]:null,E=u[L]||[],S=L===new Date().toISOString().split("T")[0],_=B?b(B.type):"",P=B?_==="Absent"?"absent":_==="Half Day"||_==="Late"?"late":"present":"none",C=B?_:"No log",N=T.map(z=>(z.workDescription||z.location||"").trim()).filter(Boolean),q=N.length?N.slice(0,2).map(z=>`<div class="timesheet-cal-plan">${x(z)}</div>`).join("")+(N.length>2?`<div class="timesheet-cal-more">+${N.length-2} more logs</div>`:""):E.length?E.slice(0,2).map(z=>`<div class="timesheet-cal-plan">${x(z)}</div>`).join("")+(E.length>2?`<div class="timesheet-cal-more">+${E.length-2} more</div>`:""):'<div class="timesheet-cal-empty">No plans</div>';$+=`
                <div class="timesheet-cal-day ${S?"today":""}" onclick="window.app_openTimesheetDayDetail('${L}')" style="cursor:pointer;">
                    <div class="timesheet-cal-day-head">
                        <span class="timesheet-cal-date">${I}</span>
                        <span class="timesheet-cal-attendance ${P}">${C}</span>
                    </div>
                    <div class="timesheet-cal-plans">${q}</div>
                </div>`}return`
            <div class="timesheet-calendar-wrap">
                <div class="timesheet-calendar-weekdays">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div class="timesheet-calendar-grid">${$}</div>
            </div>`};return`
        <div class="card full-width timesheet-modern">
            <div class="timesheet-modern-head">
                <div>
                    <h3>My Timesheet</h3>
                    <p>View and manage your attendance logs</p>
                </div>
                <div class="timesheet-modern-actions">
                    <button class="action-btn secondary timesheet-modern-btn-secondary" onclick="document.getElementById('leave-modal').style.display = 'flex'">
                        <i class="fa-solid fa-calendar-xmark"></i> Request Leave
                    </button>
                    <button class="action-btn timesheet-modern-btn-primary" onclick="document.dispatchEvent(new CustomEvent('open-log-modal'))">
                        <i class="fa-solid fa-plus"></i> Manual Log
                    </button>
                </div>
            </div>

            <div class="stat-grid timesheet-modern-stats">
                <div class="stat-card">
                    <div class="label">Total Hours</div>
                    <div class="value">${f}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Days Present</div>
                    <div class="value">${h.size} <span class="timesheet-stat-sub">Days</span></div>
                </div>
                <div class="stat-card">
                    <div class="label">Late Count</div>
                    <div class="value" style="color:${g>2?"var(--accent)":"var(--text-main)"}">${g}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Late Deduction</div>
                    <div class="value">${v.toFixed(1)} <span class="timesheet-stat-sub">Days</span></div>
                </div>
            </div>

            <div class="timesheet-modern-toolbar">
                <div class="timesheet-view-mode-wrap">
                    <label for="timesheet-view-select" class="timesheet-view-label">View</label>
                    <select id="timesheet-view-select" class="timesheet-view-select" onchange="window.app_toggleTimesheetViewSelect(this.value)">
                        <option value="list" ${n==="list"?"selected":""}>List View</option>
                        <option value="calendar" ${n==="calendar"?"selected":""}>Calendar View</option>
                    </select>
                </div>
                <div class="timesheet-month-switch">
                    <button type="button" onclick="window.app_changeTimesheetMonth(-1)"><i class="fa-solid fa-chevron-left"></i></button>
                    <div class="timesheet-month-label">${d}</div>
                    <button type="button" onclick="window.app_changeTimesheetMonth(1)"><i class="fa-solid fa-chevron-right"></i></button>
                    <button type="button" class="timesheet-today-btn" onclick="window.app_jumpTimesheetToday()">Today</button>
                </div>
                <button class="timesheet-export-btn" onclick="window.AppReports?.exportUserLogs('${i.id}')">
                    <i class="fa-solid fa-download"></i> Export CSV
                </button>
            </div>

            <div id="timesheet-list-panel" class="table-container mobile-table-card timesheet-modern-table-wrap" style="display:${n==="list"?"block":"none"};">
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
                        ${c.length?c.map(w=>`
                            <tr>
                                <td data-label="Date">
                                    <div class="timesheet-log-date">${w.date||"Active Session"}</div>
                                    <div class="timesheet-log-id">Log ID: ${w.id==="active_now"?"N/A":w.id.slice(-4)}</div>
                                </td>
                                <td data-label="Timings">
                                    <div class="time-badge">
                                        <span class="in"><i class="fa-solid fa-caret-right"></i> ${w.checkIn}</span>
                                        <span class="out"><i class="fa-solid fa-caret-left"></i> ${w.checkOut||"--:--"}</span>
                                    </div>
                                </td>
                                <td data-label="Status">
                                    <div class="timesheet-status-col">
                                        <span class="badge" style="background:${b(w.type)==="Absent"?"#fef2f2":b(w.type)==="Half Day"||b(w.type)==="Late"?"#fff7ed":"#f0fdf4"}; color:${b(w.type)==="Absent"?"#991b1b":b(w.type)==="Half Day"||b(w.type)==="Late"?"#c2410c":"#15803d"}; border:1px solid ${b(w.type)==="Absent"?"#fecaca":b(w.type)==="Half Day"||b(w.type)==="Late"?"#fed7aa":"#dcfce7"};">${b(w.type)}</span>
                                        <div class="timesheet-duration">${w.duration||"--"}</div>
                                    </div>
                                </td>
                                <td data-label="Work Summary" class="timesheet-summary-cell">
                                    <div class="timesheet-summary-wrap">
                                        <div class="dashboard-viewing-meta">
                                            <div class="timesheet-summary-text">${x(w.workDescription)||'<span class="timesheet-empty-summary">No summary provided</span>'}</div>
                                            ${w.location?`<div class="timesheet-location"><i class="fa-solid fa-location-dot"></i> ${x(w.location)}</div>`:""}
                                        </div>
                                        ${w.id!=="active_now"?`<button onclick="window.app_editWorkSummary('${w.id}')" class="timesheet-edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>`:""}
                                    </div>
                                </td>
                                <td data-label="Detail" class="text-right">
                                    ${w.id!=="active_now"?`<button class="icon-btn timesheet-detail-btn" title="View Detailed Log" onclick="alert('Detailed analysis for log ${w.id} coming soon!')"><i class="fa-solid fa-circle-info"></i></button>`:'<span class="timesheet-live">SESSION LIVE</span>'}
                                </td>
                            </tr>
                        `).join(""):'<tr><td colspan="5" class="timesheet-empty-row">No attendance records found for this period.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div id="timesheet-calendar-panel" style="display:${n==="calendar"?"block":"none"};">
                ${k()}
            </div>
        </div>
    `}typeof window<"u"&&(window.AppUI||(window.AppUI={}),window.AppUI.renderTimesheet=he);async function ft(){try{const i=window.AppAuth.getUser();if(!i)return'<div class="card">User state lost. Please <a href="#" onclick="window.AppAuth.logout()">Login Again</a></div>';const e=i.role==="Administrator"||i.isAdmin,t=e?await window.AppDB.getAll("users"):[],a=e&&window.app_profileTargetUserId?window.app_profileTargetUserId:i.id,n=e&&t.find(v=>v.id===a)||i,s=(v,b)=>{const k=String(v||"").trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(k))return"NA";const w=k.replace(/-/g,""),A=String(b||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase().slice(-3)||"USR";return`EMP-${w}-${A}`},r=typeof n.joinDate=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(n.joinDate)?n.joinDate:"",d=r?n.employeeId||s(r,n.id):"NA",[o,l,c]=await Promise.all([window.AppAnalytics?window.AppAnalytics.getUserMonthlyStats(n.id):null,window.AppAnalytics?window.AppAnalytics.getUserYearlyStats(n.id):null,window.AppLeaves?window.AppLeaves.getUserLeaves(n.id):[]]);window.app_changeProfileStaff=async v=>{window.app_profileTargetUserId=v||i.id;const b=document.getElementById("page-content");b&&(b.innerHTML=await ft())},window.app_confirmSignOut=()=>{confirm("Are you sure you want to sign out?")&&window.AppAuth.logout()};const p=n.id===i.id,m=o?.attendanceRate??"—",u=o?.punctualityRate??"—",y=o?.totalHours??"—",g=l?.totalDays??"—",h=v=>v==="Approved"?"#16a34a":v==="Rejected"?"#dc2626":"#d97706",f=(n.name||"U").split(" ").map(v=>v[0]).join("").slice(0,2).toUpperCase();return`
            <div class="pro-profile-root">

                <!-- ── Hero Banner ── -->
                <div class="pro-profile-hero">
                    <div class="pro-profile-hero-bg"></div>
                    <div class="pro-profile-hero-inner">
                        <!-- Avatar -->
                        <div class="pro-profile-avatar-ring">
                            ${n.avatar?`<img src="${x(n.avatar)}" alt="${x(n.name)}" class="pro-profile-avatar-img">`:`<div class="pro-profile-avatar-initials">${f}</div>`}
                            <span class="pro-profile-status-dot ${n.status==="in"?"online":"offline"}"
                                  title="${n.status==="in"?"Currently checked in":"Not checked in"}"></span>
                        </div>

                        <!-- Identity -->
                        <div class="pro-profile-identity">
                            <div class="pro-profile-name-row">
                                <h1 class="pro-profile-name">${x(n.name)}</h1>
                                <span class="pro-profile-role-badge">${x(n.role||"Staff")}</span>
                            </div>
                            <div class="pro-profile-email">
                                <i class="fa-solid fa-envelope"></i>
                                ${x(n.email||"—")}
                            </div>
                            <div class="pro-profile-meta-row">
                                <span class="pro-profile-chip">
                                    <i class="fa-solid fa-id-card"></i>${x(d)}
                                </span>
                                ${r?`<span class="pro-profile-chip">
                                    <i class="fa-solid fa-calendar-check"></i>Joined ${r}
                                </span>`:""}
                                ${n.department?`<span class="pro-profile-chip">
                                    <i class="fa-solid fa-building"></i>${x(n.department)}
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
                            ${p?`
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
                        <div class="pro-stat-value">${u}${typeof u=="number"?"%":""}</div>
                        <div class="pro-stat-label">Punctuality</div>
                    </div>
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-hourglass-half pro-stat-icon" style="color:#10b981;"></i>
                        <div class="pro-stat-value">${y}${typeof y=="number"?"h":""}</div>
                        <div class="pro-stat-label">Hours (MTD)</div>
                    </div>
                    <div class="pro-stat-tile">
                        <i class="fa-solid fa-calendar-days pro-stat-icon" style="color:#8b5cf6;"></i>
                        <div class="pro-stat-value">${g}</div>
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
                                            <span class="pro-status-pill" style="background:${h(v.status)}18;color:${h(v.status)};">
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
                                ${[["Department",n.department||"Operations"],["Role",n.role||"Staff"],["Level",n.level||"—"],["Reports To",n.reportsTo||"Admin"],["Employee ID",d],["Join Date",r||"N/A"],["Payroll Cycle","Monthly (25th)"]].map(([v,b])=>`
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
                                ${p?`
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
        `}catch(i){return console.error("Profile Render Error:",i),`<div class="card error-card">Failed to load profile: ${x(i.message)}</div>`}}typeof window<"u"&&(window.AppUI||(window.AppUI={}),window.AppUI.renderProfile=ft);async function yt(i=null,e=null){const t=window.AppAuth.getUser(),a=window.app_hasPerm("attendance","admin",t),n=await window.AppDB.getAll("users"),s=new Date,r=i!==null?parseInt(i):s.getMonth(),d=e!==null?parseInt(e):s.getFullYear(),o=`${d}-${String(r+1).padStart(2,"0")}-01`,l=`${d}-${String(r+1).padStart(2,"0")}-31`;let c=[];try{c=(await window.AppDB.query("attendance","date",">=",o)).filter(A=>A.date<=l)}catch(w){console.warn("MasterSheet: query failed, fetching all attendance logs",w),c=(await window.AppDB.getAll("attendance")).filter($=>$.date>=o&&$.date<=l)}const p=new Date(d,r+1,0).getDate(),m=Array.from({length:p},(w,A)=>A+1),u=["January","February","March","April","May","June","July","August","September","October","November","December"],y=w=>{const A=new Date(`${w}T00:00:00`),$=A.getDay();if($===0)return"holiday";if($===6){const I=Math.floor((A.getDate()-1)/7)+1;if(I===2||I===4)return"holiday";if(I===1||I===3||I===5)return"halfday"}return"working"},g=w=>String(w?.type||"").includes("Leave")||w?.location==="On Leave",h=w=>!w||!w.checkOut||w.checkOut==="Active Now"?!1:typeof w.activityScore<"u"||typeof w.locationMismatched<"u"||!!w.checkOutLocation||typeof w.outLat<"u"||typeof w.outLng<"u",f=w=>w?.isManualOverride?4:g(w)?3:h(w)?2:1,v=w=>{if(Object.prototype.hasOwnProperty.call(w||{},"attendanceEligible"))return w.attendanceEligible===!0;const A=String(w?.entrySource||"");return A==="staff_manual_work"?!1:A==="admin_override"||A==="checkin_checkout"||w?.isManualOverride||w?.location==="Office (Manual)"||w?.location==="Office (Override)"||typeof w?.activityScore<"u"||typeof w?.locationMismatched<"u"||typeof w?.autoCheckout<"u"||!!w?.checkOutLocation||typeof w?.outLat<"u"||typeof w?.outLng<"u"?!0:String(w?.type||"").includes("Leave")||w?.location==="On Leave"},b=new Date().toISOString().split("T")[0],k=w=>{const A=new Date(w);return`${A.getFullYear()}-${String(A.getMonth()+1).padStart(2,"0")}-${String(A.getDate()).padStart(2,"0")}`};return window.app_refreshMasterSheet=async()=>{const w=document.getElementById("sheet-month")?.value,A=document.getElementById("sheet-year")?.value,$=document.getElementById("page-content");$&&($.innerHTML=await yt(w,A))},`
        <div class="dashboard-grid dashboard-modern dashboard-admin-view">
            <div class="card full-width">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                    <div>
                        <h2 style="font-size:1.1rem; margin-bottom:0.1rem;">Attendance Sheet</h2>
                        <p style="color:var(--text-muted); font-size:0.75rem;">Master grid view for all staff logs.</p>
                    </div>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <select onchange="window.app_refreshMasterSheet()" id="sheet-month" style="padding:0.4rem; border-radius:6px; border:1px solid #ddd; font-size:0.8rem;">
                            ${u.map((w,A)=>`<option value="${A}" ${A===r?"selected":""}>${w}</option>`).join("")}
                        </select>
                        <select onchange="window.app_refreshMasterSheet()" id="sheet-year" style="padding:0.4rem; border-radius:6px; border:1px solid #ddd; font-size:0.8rem;">
                            <option value="${d}" selected>${d}</option>
                            <option value="${d-1}">${d-1}</option>
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
                                ${m.map(w=>`<th style="text-align:center; min-width: 28px; padding:4px; border-right: 1px solid #eee; font-size:0.75rem;">${w}</th>`).join("")}
                            </tr>
                        </thead>
                        <tbody>
                            ${n.sort((w,A)=>w.name.localeCompare(A.name)).map((w,A)=>`
                                <tr>
                                    <td style="text-align:center; border-right: 1px solid #eee; position: sticky; left: 0; background: #fff; z-index: 5; padding:4px; font-size:0.75rem;">${A+1}</td>
                                    <td style="border-right: 2px solid #ddd; position: sticky; left: 35px; background: #fff; z-index: 5; font-weight: 500; padding:4px;">
                                        <div style="display:flex; flex-direction:column;">
                                            <span style="font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px;">${x(w.name)}</span>
                                            <span style="font-size:0.65rem; color:#666; font-weight:400;">${x(w.dept||"General")}</span>
                                        </div>
                                    </td>
                                    ${m.map($=>{const I=`${d}-${String(r+1).padStart(2,"0")}-${String($).padStart(2,"0")}`,T=c.filter(P=>(P.userId===w.id||P.user_id===w.id)&&P.date===I).filter(v),B=y(I);let E="-",S="",_="No log";if(T.length>0){const P=T.slice().sort((N,q)=>f(q)-f(N))[0],C=window.AppAttendance&&window.AppAttendance.normalizeType?window.AppAttendance.normalizeType(P.type):P.type;E=C.charAt(0).toUpperCase(),_=`${P.checkIn} - ${P.checkOut||"Active"}
${C}`,C==="Present"?S="color: #10b981; font-weight: bold; font-size: 0.9rem;":C==="Late"?(S="color: #f59e0b; font-weight: bold;",E="L"):C==="Half Day"?(S="color: #c2410c; font-weight: bold;",E="HD"):C==="Absent"?(S="color: #ef4444; font-weight: bold;",E="A"):C.includes("Leave")?(S="color: #8b5cf6; font-weight: bold;",E="C"):C==="Work - Home"?(S="color: #0ea5e9; font-weight: bold;",E="W"):C==="On Duty"&&(S="color: #0369a1; font-weight: bold;",E="D"),P.isManualOverride&&(S="color: #be185d; font-weight: bold; background: #fdf2f8;")}else{const P=I===b&&w.status==="in"&&w.lastCheckIn&&k(w.lastCheckIn)===I,C=typeof w.joinDate=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(w.joinDate)?I<w.joinDate:!1,N=I>b;P?(E="P",S="color: #10b981; font-weight: bold; font-size: 0.9rem;",_="Checked in (pending checkout)"):N||C?(E="-",S="color: #94a3b8; font-weight: 600;",_=N?"Future date":`Before joining date (${w.joinDate})`):B==="holiday"?(E="H",S="color: #64748b; font-weight: 700;",_="Holiday"):(E="A",S="color: #ef4444; font-weight: bold;",_="Absent")}return`<td style="text-align:center; ${a?"cursor:pointer;":""} border-right: 1px solid #eee; padding:2px; font-size:0.75rem; ${S}" title="${_}" ${a?`onclick="window.app_openCellOverride('${w.id}', '${I}')"`:""}>${E}</td>`}).join("")}
                                </tr>`).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`}typeof window<"u"&&(window.AppUI||(window.AppUI={}),window.AppUI.renderMasterSheet=yt);async function wt(i=null,e=null){let t=[],a=[],n={avgScore:0,trendData:[0,0,0,0,0,0,0],labels:[]},s=[];try{const p=new Date().toISOString().split("T")[0];i=i||p,e=e||p,[t,n,s,a]=await Promise.all([window.AppDB.getCached?window.AppDB.getCached(window.AppDB.getCacheKey("adminUsers","users",{}),window.AppConfig?.READ_CACHE_TTLS?.users||6e4,()=>window.AppDB.getAll("users")):window.AppDB.getAll("users"),window.AppAnalytics.getSystemPerformance(),window.AppDB.queryMany?window.AppDB.queryMany("location_audits",[],{orderBy:[{field:"timestamp",direction:"desc"}],limit:300}).catch(()=>window.AppDB.getAll("location_audits")):window.AppDB.getAll("location_audits"),window.AppLeaves.getPendingLeaves()]),s=s.filter(m=>{const u=new Date(m.timestamp).toISOString().split("T")[0];return u>=i&&u<=e}).sort((m,u)=>u.timestamp-m.timestamp)}catch(p){console.error("Failed to fetch admin data",p)}const r=t.filter(p=>p.status==="in").length,d=t.filter(p=>p.role==="Administrator"||p.isAdmin===!0).length,o=n.avgScore>70?"Optimal":n.avgScore>40?"Good":"Low",l=n.avgScore>70?"#166534":n.avgScore>40?"#854d0e":"#991b1b",c=n.avgScore>70?"#f0fdf4":n.avgScore>40?"#fefce8":"#fef2f2";return window.app_applyAuditFilter=async()=>{const p=document.getElementById("audit-start")?.value,m=document.getElementById("audit-end")?.value,u=document.getElementById("page-content");u&&(u.innerHTML=await wt(p,m))},`
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
                        <p class="text-muted">Avg. Activity: ${n.avgScore}%</p>
                    </div>
                    <div class="admin-performance-status" style="background:${c}; color:${l};">${o}</div>
                </div>
                <div class="admin-performance-bars">
                    ${n.trendData.map(p=>`<div class="admin-performance-bar-item"><div class="admin-performance-bar-fill" style="height:${Math.max(p,5)}%;"></div></div>`).join("")}
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
                                                <div class="admin-user-name-row">${x(p.name)} ${m?'<span class="admin-user-live-tag">LIVE</span>':""}</div>
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
                        <input type="date" id="audit-start" value="${i}" style="font-size:0.75rem;">
                        <input type="date" id="audit-end" value="${e}" style="font-size:0.75rem;">
                        <button onclick="window.app_applyAuditFilter()" class="action-btn">Filter</button>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Staff</th><th>Slot</th><th>Time</th><th>Status</th></tr></thead>
                        <tbody>
                            ${s.length?s.map(p=>`
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
        </div>`}typeof window<"u"&&(window.AppUI||(window.AppUI={}),window.AppUI.renderAdmin=wt);async function Ft(){const i=await window.AppAnalytics.getSystemMonthlySummary(),e=new Date,t=window.AppAuth.getUser(),a=window.app_hasPerm("reports","admin",t),n=e.toLocaleDateString("default",{month:"long",year:"numeric"});return`${e.getFullYear()}${String(e.getMonth()+1).padStart(2,"0")}`,e.toISOString().split("T")[0],window.app_recalculateRow=s=>{const r=parseFloat(s.querySelector(".base-salary-input").value)||0,d=s.querySelector(".tds-input"),o=parseFloat(document.getElementById("global-tds-percent")?.value)||0,l=d.value!==""?parseFloat(d.value):o,c=parseFloat(s.querySelector(".unpaid-leaves-count").textContent)||0,p=Math.max(0,r-r/22*c),m=Math.round(p*(l/100)),u=Math.max(0,p-m);s.querySelector(".tds-amount").textContent=`Rs ${m.toLocaleString()}`,s.querySelector(".final-net-salary").textContent=`Rs ${u.toLocaleString()}`,s.querySelector(".salary-input").value=Math.round(p)},window.app_recalculateAllSalaries=()=>{document.querySelectorAll(".salary-processing-table tbody tr").forEach(r=>window.app_recalculateRow(r))},`
        <div class="card full-width">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h3 style="font-size: 1.25rem;">Salary Processing</h3>
                    <p class="text-muted">Period: ${n}</p>
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
                        ${i.map(s=>{const{user:r,stats:d}=s,o=r.baseSalary||0,l=d.unpaidLeaves||0,c=Math.round(Math.max(0,o-o/22*l));return`
                                <tr data-user-id="${r.id}">
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                                            <img src="${r.avatar}" style="width: 28px; height: 28px; border-radius: 50%;">
                                            <div style="font-weight: 600;">${x(r.name)}</div>
                                        </div>
                                    </td>
                                    <td><input type="number" class="base-salary-input" value="${o}" style="width: 80px;" onchange="window.app_recalculateRow(this.closest('tr'))"></td>
                                    <td><span class="present-count">${d.present}</span></td>
                                    <td><span class="unpaid-leaves-count">${l}</span></td>
                                    <td class="deduction-amount" style="color:#ef4444;">-Rs ${Math.round(o/22*l).toLocaleString()}</td>
                                    <td><input type="number" class="salary-input" value="${c}" style="width: 90px;"></td>
                                    <td><input type="number" class="tds-input" value="" placeholder="Global" style="width: 60px;" onchange="window.app_recalculateRow(this.closest('tr'))"></td>
                                    <td class="final-net-salary" style="font-weight:700; color:#1e40af;">Rs ${c.toLocaleString()}</td>
                                    <td class="tds-amount" style="display:none;">0</td>
                                    <td><button class="action-btn secondary" onclick="window.app_generateSalarySlip('${r.id}')">Slip</button></td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `}async function qt(){const i=new Date().toISOString().split("T")[0];return window.app_runPolicyTest=()=>{const e=document.getElementById("policy-test-checkin")?.value,t=document.getElementById("policy-test-checkout")?.value,a=document.getElementById("policy-test-output");if(!e||!t||!a)return;const n=document.getElementById("policy-test-date")?.value,s=new Date(`${n}T${e}`),d=(new Date(`${n}T${t}`)-s)/(1e3*60*60);let o="Absent";d>=8?o="Present":d>=4&&(o="Half Day"),a.innerHTML=`
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <div class="stat-card"><div class="label">Status</div><div class="value">${o}</div></div>
                <div class="stat-card"><div class="label">Duration</div><div class="value">${d.toFixed(2)} hrs</div></div>
            </div>
        `},`
        <div class="card full-width">
            <h3 style="margin-bottom:1rem;">Policy Simulator</h3>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1rem; margin-bottom:1rem;">
                <input type="date" id="policy-test-date" value="${i}">
                <input type="time" id="policy-test-checkin" value="09:00">
                <input type="time" id="policy-test-checkout" value="18:00">
            </div>
            <button class="action-btn" onclick="window.app_runPolicyTest()">Test Outcome</button>
            <div id="policy-test-output" style="margin-top:1.5rem;"></div>
        </div>
    `}typeof window<"u"&&(window.AppUI||(window.AppUI={}),window.AppUI.renderSalaryProcessing=Ft,window.AppUI.renderPolicyTest=qt);async function gt(){const i=await window.AppMinutes.getMinutes(),e=window.AppDB?.getAll?await window.AppDB.getAll("users"):[],t=window.AppAuth.getUser(),a=(r,d=t)=>!r||!d?!1:!!(window.app_hasPerm("minutes","view",d)||r.createdBy===d.id||(r.attendeeIds||[]).includes(d.id)||(r.allowedViewers||[]).includes(d.id)||(r.actionItems||[]).some(o=>o.assignedTo===d.id)),n=(r,d=t.id)=>{const o=(r.accessRequests||[]).find(l=>l.userId===d);return o?o.status:""};let s=new Set;return window.app_toggleNewMinuteForm=()=>{const r=document.getElementById("new-minute-form");if(r&&(r.style.display=r.style.display==="none"?"block":"none",r.style.display==="block")){s=new Set,window.app_refreshAttendeeChips();const d=document.getElementById("action-items-container");d&&(d.innerHTML="",window.app_addActionItemRow())}},window.app_refreshMinutesView=async()=>{const r=document.getElementById("page-content");r&&(r.innerHTML=await gt())},window.app_filterAttendees=r=>{const d=r.toLowerCase();document.querySelectorAll(".minutes-attendee-item").forEach(o=>{const l=o.dataset.name.toLowerCase();o.style.display=l.includes(d)?"flex":"none"})},window.app_toggleAttendeePick=r=>{r.checked?s.add(r.value):s.delete(r.value),window.app_refreshAttendeeChips()},window.app_refreshAttendeeChips=()=>{const r=document.getElementById("minutes-attendee-chips");r&&(r.innerHTML=Array.from(s).map(d=>{const o=e.find(l=>l.id===d);return`<div class="attendee-chip"><span>${x(o?.name||o?.username||"Unknown")}</span><i class="fa-solid fa-circle-xmark" onclick="window.app_removeAttendee('${d}')"></i></div>`}).join(""))},window.app_removeAttendee=r=>{s.delete(r);const d=document.querySelector(`.minutes-attendee-item input[value="${r}"]`);d&&(d.checked=!1),window.app_refreshAttendeeChips()},window.app_addActionItemRow=()=>{const r=document.getElementById("action-items-container");if(!r)return;const d=document.createElement("div");d.className="action-item-row",d.innerHTML=`
            <input type="text" placeholder="Task description..." class="action-task">
            <select class="action-assignee">
                <option value="">Assign to...</option>
                ${e.map(o=>`<option value="${o.id}">${x(o.name||o.username)}</option>`).join("")}
            </select>
            <input type="date" class="action-due" value="${new Date().toISOString().split("T")[0]}">
            <button type="button" onclick="this.parentElement.remove()" class="remove-action-btn"><i class="fa-solid fa-trash"></i></button>
        `,r.appendChild(d)},window.app_submitNewMinutes=async()=>{const r=document.getElementById("new-minute-title").value.trim(),d=document.getElementById("new-minute-date").value,o=document.getElementById("new-minute-content").value.trim(),l=Array.from(s),c=Array.from(document.querySelectorAll(".action-item-row")).map(p=>({task:p.querySelector(".action-task").value.trim(),assignedTo:p.querySelector(".action-assignee").value,dueDate:p.querySelector(".action-due").value,status:"pending"})).filter(p=>p.task);if(!r||!o)return alert("Title and content are required.");try{await window.AppMinutes.addMinute({title:r,date:d,content:o,attendeeIds:l,actionItems:c}),alert("Meeting minutes recorded!"),window.app_refreshMinutesView()}catch(p){alert("Error saving: "+p.message)}},window.app_requestMinuteAccess=async r=>{try{await window.AppMinutes.requestAccess(r),alert("Access requested!"),window.app_refreshMinutesView()}catch(d){alert("Error: "+d.message)}},window.app_handleMinuteApproval=async r=>{if(confirm("Are you sure you want to approve these minutes? This will lock the record if you are the last attendee to sign."))try{await window.AppMinutes.approveMinute(r),alert("Minutes approved!"),window.app_openMinuteDetails(r),window.app_refreshMinutesView()}catch(d){alert("Error: "+d.message)}},window.app_handleActionItemStatus=async(r,d,o)=>{try{await window.AppMinutes.updateActionItemStatus(r,d,o),alert(`Task marked as ${o}!`),window.app_openMinuteDetails(r)}catch(l){alert("Error: "+l.message)}},window.app_handleAccessDecision=async(r,d,o)=>{try{await window.AppMinutes.handleAccessRequest(r,d,o),alert(`Request ${o}!`),window.app_openMinuteDetails(r)}catch(l){alert("Error: "+l.message)}},window.app_openMinuteDetails=async r=>{const o=(await window.AppMinutes.getMinutes()).find(f=>f.id===r);if(!o)return;if(!a(o))return alert("Access Restricted. Please request access from the list view.");const l=(o.attendeeIds||[]).includes(t.id),c=o.approvals&&o.approvals[t.id],p=o.createdBy===t.id,m=window.app_hasPerm("minutes","admin",t),u=(o.attendeeIds||[]).map(f=>{const v=e.find(k=>k.id===f),b=o.approvals&&o.approvals[f];return`
                <div class="approval-chip ${b?"approved":"pending"}">
                    <i class="fa-solid fa-${b?"check-circle":"clock"}"></i>
                    ${x(v?.name||"Unknown")}
                </div>
            `}).join(""),y=(o.actionItems||[]).map((f,v)=>{const b=e.find(w=>w.id===f.assignedTo),k=f.assignedTo===t.id;return`
                <div class="detail-action-item">
                    <div class="action-status-dot ${f.status||"pending"}"></div>
                    <div class="action-main">
                        <strong>${x(f.task)}</strong>
                        <span class="action-meta">Assigned: ${x(b?.name||"Unassigned")} | Due: ${f.dueDate||"N/A"}</span>
                    </div>
                    ${k&&f.status!=="completed"?`
                        <div class="action-btns">
                            ${f.status==="pending"?`<button class="mini-btn" onclick="window.app_handleActionItemStatus('${o.id}', ${v}, 'accepted')">Accept</button>`:""}
                            <button class="mini-btn success" onclick="window.app_handleActionItemStatus('${o.id}', ${v}, 'completed')">Complete</button>
                        </div>
                    `:""}
                </div>
            `}).join(""),g=(o.accessRequests||[]).filter(f=>f.status==="pending").map(f=>`
            <div class="access-request-row">
                <span>${x(f.userName)}</span>
                <div class="req-btns">
                    <button class="mini-btn success" onclick="window.app_handleAccessDecision('${o.id}', '${f.userId}', 'approved')">Approve</button>
                    <button class="mini-btn danger" onclick="window.app_handleAccessDecision('${o.id}', '${f.userId}', 'rejected')">Deny</button>
                </div>
            </div>
        `).join(""),h=`
            <div class="modal-overlay" id="minute-detail-modal" style="display:flex;">
                <div class="modal-content minutes-detail-wide">
                    <div class="modal-header">
                        <div>
                            <span class="detail-date">${new Date(o.date).toLocaleDateString()}</span>
                            <h2 style="margin:0; color:#1e1b4b;">${x(o.title)}</h2>
                        </div>
                        <button onclick="document.getElementById('minute-detail-modal').remove()" class="close-modal-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-grid">
                            <div class="main-column">
                                <section>
                                    <label><i class="fa-solid fa-file-lines"></i> Discussion & Decisions</label>
                                    <div class="content-text">${x(o.content).replace(/\n/g,"<br>")}</div>
                                </section>
                                ${y?`
                                <section>
                                    <label><i class="fa-solid fa-list-check"></i> Action Items</label>
                                    <div class="action-items-list">${y}</div>
                                </section>
                                `:""}
                            </div>
                            <div class="side-column">
                                <section>
                                    <label><i class="fa-solid fa-users-check"></i> Approvals</label>
                                    <div class="approvals-stack">${u||'<p class="empty">No attendees defined</p>'}</div>
                                    ${l&&!c&&!o.locked?`<button class="action-btn wide" onclick="window.app_handleMinuteApproval('${o.id}')" style="margin-top:1rem;">Approve Minutes</button>`:""}
                                </section>
                                ${(p||m)&&g?`
                                <section class="owner-only">
                                    <label><i class="fa-solid fa-key"></i> Access Requests</label>
                                    <div class="access-requests-list">${g}</div>
                                </section>
                                `:""}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${o.locked?'<span class="status-locked-msg"><i class="fa-solid fa-lock"></i> Record Locked (All approved)</span>':""}
                        <div style="flex:1"></div>
                        <button class="action-btn secondary" onclick="document.getElementById('minute-detail-modal').remove()">Close</button>
                        ${p||m?`<button class="action-btn danger" onclick="window.app_deleteMinute('${o.id}')">Delete</button>`:""}
                    </div>
                </div>
            </div>
        `;if(!document.getElementById("modal-container")){const f=document.createElement("div");f.id="modal-container",document.body.appendChild(f)}document.getElementById("modal-container").innerHTML=h},window.app_deleteMinute=async r=>{if(confirm("Are you sure?"))try{await window.AppMinutes.deleteMinute(r),document.getElementById("minute-detail-modal")?.remove(),window.app_refreshMinutesView()}catch(d){alert("Error: "+d.message)}},`
        <div class="card full-width minutes-modern">
            <style>
                .minutes-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
                .minutes-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
                .minute-item { padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 12px; transition: all 0.2s; position: relative; display: flex; flex-direction: column; }
                .minute-item.clickable { cursor: pointer; }
                .minute-item.clickable:hover { border-color: #6366f1; transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                .minute-item.restricted { opacity: 0.8; background: #f8fafc; cursor: default; }
                .minute-item-date { font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem; }
                .minute-item-title { font-size: 1.1rem; color: #1e293b; margin-bottom: 0.8rem; font-weight: 700; }
                .minute-item-meta { display: flex; flex-wrap: wrap; gap: 0.8rem; font-size: 0.8rem; color: #64748b; margin-bottom: 1rem; }
                .minute-item-meta span { display: flex; align-items: center; gap: 4px; }
                
                .restricted-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.8rem; padding: 1rem; background: #fff; border-radius: 8px; border: 1px dashed #cbd5e1; }
                .status-badge { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; }
                
                .minutes-attendee-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem; }
                .attendee-chip { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; display: flex; align-items: center; gap: 4px; }
                .attendee-chip i { cursor: pointer; opacity: 0.7; }
                
                .action-item-row { display: grid; grid-template-columns: 1fr 120px 120px 32px; gap: 0.5rem; margin-bottom: 0.5rem; }
                .minutes-detail-wide { max-width: 800px !important; }
                .detail-grid { display: grid; grid-template-columns: 1fr 300px; gap: 2rem; }
                .side-column { border-left: 1px solid #f1f5f9; padding-left: 1.5rem; }
                .side-column section { margin-bottom: 2rem; }
                .approvals-stack { display: flex; flex-direction: column; gap: 0.6rem; }
                .approval-chip { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 8px; font-size: 0.85rem; }
                .approval-chip.approved { background: #ecfdf5; color: #065f46; border: 1px solid #bbf7d0; }
                .approval-chip.pending { background: #fefce8; color: #854d0e; border: 1px solid #fef08a; }
                
                .mini-btn { padding: 4px 10px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; font-size: 0.75rem; }
                .mini-btn.success { background: #10b981; color: #fff; border-color: #10b981; }
                .mini-btn.danger { background: #ef4444; color: #fff; border-color: #ef4444; }
                
                .status-locked-msg { color: #059669; font-weight: 700; font-size: 0.9rem; }
                .access-request-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8fafc; border-radius: 8px; margin-bottom: 0.5rem; }
                .req-btns { display: flex; gap: 4px; }
            </style>

            <div class="minutes-header">
                <div>
                    <h3>Meeting Minutes</h3>
                    <p>Track decisions and action items from team meetings.</p>
                </div>
                ${window.app_hasPerm("minutes","admin")?'<button class="action-btn" onclick="window.app_toggleNewMinuteForm()"><i class="fa-solid fa-plus"></i> New Minutes</button>':""}
            </div>

            <div id="new-minute-form" style="display:none; margin-bottom:2rem; padding:1.5rem; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:12px;">
                <!-- Copy of previous form with better attendee picker -->
                <h4 style="margin-bottom:1rem; color:#1e1b4b;">Record New Meeting</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
                    <div><label class="form-label">Title</label><input type="text" id="new-minute-title" class="form-input" placeholder="e.g. Sales Sync"></div>
                    <div><label class="form-label">Date</label><input type="date" id="new-minute-date" class="form-input" value="${new Date().toISOString().split("T")[0]}"></div>
                </div>
                <div style="margin-bottom:1rem;">
                    <label class="form-label">Attendees (Required Approvers)</label>
                    <div class="attendee-picker-wrap">
                        <div id="minutes-attendee-chips" class="minutes-attendee-chips"></div>
                        <input type="text" placeholder="Search staff..." oninput="window.app_filterAttendees(this.value)" class="form-input-minimal">
                        <div class="minutes-attendee-list">
                            ${e.map(r=>`<label class="minutes-attendee-item" data-name="${Nt(r.name||r.username)}"><input type="checkbox" value="${r.id}" onchange="window.app_toggleAttendeePick(this)"><span>${x(r.name||r.username)}</span></label>`).join("")}
                        </div>
                    </div>
                </div>
                <div style="margin-bottom:1rem;">
                    <label class="form-label">Discussion & Decisions</label>
                    <textarea id="new-minute-content" class="form-input" style="min-height:120px;" placeholder="Document what was decided..."></textarea>
                </div>
                <div style="margin-bottom:1.5rem;">
                    <label class="form-label">Action Items</label>
                    <div id="action-items-container"></div>
                    <button type="button" onclick="window.app_addActionItemRow()" class="minutes-add-task-btn"><i class="fa-solid fa-plus-circle"></i> Add Task</button>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem; border-top:1px solid #cbd5e1; padding-top:1rem;">
                    <button class="action-btn secondary" onclick="window.app_toggleNewMinuteForm()">Cancel</button>
                    <button class="action-btn" onclick="window.app_submitNewMinutes()">Create Record</button>
                </div>
            </div>

            <div class="minutes-list-grid">
                ${i.length?i.sort((r,d)=>new Date(d.date)-new Date(r.date)).map(r=>{const d=a(r),o=n(r);return`
                        <div class="minute-item ${d?"clickable":"restricted"}" ${d?`onclick="window.app_openMinuteDetails('${r.id}')"`:""}>
                            <div class="minute-item-date">${new Date(r.date).toLocaleDateString()}</div>
                            <h4 class="minute-item-title">${x(r.title)}</h4>
                            <div class="minute-item-meta">
                                <span><i class="fa-solid fa-users"></i> ${r.attendeeIds?.length||0} attendees</span>
                                ${d?`<span><i class="fa-solid fa-list-check"></i> ${r.actionItems?.length||0} tasks</span>`:""}
                                ${r.locked?'<span style="color:#059669"><i class="fa-solid fa-lock"></i> Locked</span>':""}
                            </div>
                            ${d?"":`
                                <div class="restricted-overlay">
                                    <span style="font-size:0.75rem; color:#64748b; text-align:center;">You were not an attendee.</span>
                                    ${o==="pending"?'<span class="status-badge pending">Request Pending</span>':o==="rejected"?'<span class="status-badge danger">Access Denied</span>':`<button class="mini-btn" onclick="window.app_requestMinuteAccess('${r.id}')">Request Access</button>`}
                                </div>
                            `}
                        </div>
                    `}).join(""):'<div class="empty-state">No meeting minutes recorded yet.</div>'}
            </div>
        </div>
    `}typeof window<"u"&&(window.AppUI||(window.AppUI={}),window.AppUI.renderMinutes=gt);function jt(i=[]){let e="";i&&i.length>0&&(e=`
            <div style="margin-bottom:1.5rem; padding-bottom:1.5rem; border-bottom:1px dashed #cbd5e1;">
                 <label style="display:block; font-size:0.85rem; font-weight:700; color:#334155; margin-bottom:0.75rem;">📋 Your Planned Tasks</label>
                 <div style="max-height:150px; overflow-y:auto; padding-right:4px;">
                    ${i.map(s=>`<div style="padding:8px 12px; background:#f0f9ff; border-left:3px solid #0284c7; border-radius:6px; font-size:0.9rem; color:#0c4a6e; margin-bottom:8px;">
                <span style="font-weight:600;">•</span> ${x(s.task)}
                ${s.subPlans&&s.subPlans.length>0?`<div style="font-size:0.8rem; color:#0369a1; margin-left:12px; margin-top:2px;">+ ${s.subPlans.length} sub-tasks</div>`:""}
             </div>`).join("")}
                 </div>
            </div>
        `);const t=i&&i.length>0?"✨ Add another task? (Optional)":"📝 What's your main focus today?",a=i&&i.length>0?"":"required";return`
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
    </div>`}function ga(){if(typeof window>"u")return;const i=new MutationObserver(t=>{t.forEach(()=>{const a=document.getElementById("checkout-modal"),n=document.getElementById("checkout-intro-panel");a&&n&&a.style.display!=="none"&&(localStorage.getItem("checkoutIntroSeen")||(n.style.display="block"))})}),e=()=>{const t=document.body;t&&i.observe(t,{attributes:!0,subtree:!0,attributeFilter:["style"]})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e):e()}typeof window<"u"&&(window.AppUI||(window.AppUI={}),window.AppUI.renderCheckInModal=jt,ga());function ha(){return`
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
     `}function va(){return window.AppAuth?.getUser()?`
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
    `:""}const ba=i=>{const e=new Date,t=window.AppAuth?.getUser();window.app_calMonth===void 0&&(window.app_calMonth=e.getMonth()),window.app_calYear===void 0&&(window.app_calYear=e.getFullYear());const a=window.app_calYear,n=window.app_calMonth,s=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],r=new Date(a,n,1).getDay(),d=new Date(a,n+1,0).getDate();let o="";for(let l=0;l<r;l++)o+='<div class="cal-day empty"></div>';for(let l=1;l<=d;l++){const c=`${a}-${String(n+1).padStart(2,"0")}-${String(l).padStart(2,"0")}`,p=typeof window.app_getDayEvents=="function"?window.app_getDayEvents(c,i):[],m=p.some(f=>f.type==="leave"),u=p.some(f=>f.type==="event"),y=p.some(f=>f.type==="work"),g=l===e.getDate()&&n===e.getMonth()&&a===e.getFullYear(),h=window.AppAnalytics?window.AppAnalytics.getDayType(new Date(a,n,l)):"Work Day";o+=`
            <div class="cal-day ${g?"today":""} ${m?"has-leave":""} ${u?"has-event":""} ${y?"has-work":""} ${h==="Holiday"?"is-holiday":""} ${h==="Half Day"?"is-half-day":""}" 
                    onclick="window.app_openDayPlan('${c}')" style="cursor:pointer;" title="${h}">
                ${l}
            </div>
        `}return window._currentPlans=i,`
        <div class="card" style="padding: 0.75rem; display:flex; flex-direction:column;">
            <div style="margin-bottom:0.75rem; border-bottom:1px solid #f3f4f6; padding-bottom:0.4rem;">
                    <h4 style="margin:0; color:#1f2937; font-size: 1rem;">Team Schedule</h4>
                    <span style="font-size:0.7rem; color:#6b7280;">Planned Leaves & Events</span>
            </div>

            <div style="margin-bottom:0.6rem; padding-bottom:0.4rem; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:0.4rem;">
                    <button onclick="window.app_changeCalMonth(-1)" style="background:none; border:none; color:#6b7280; cursor:pointer; padding:2px;"><i class="fa-solid fa-chevron-left"></i></button>
                    <div style="text-align:center; min-width:70px;">
                        <h4 style="margin:0; color:#1f2937; font-size:0.9rem;">${s[n]} ${a}</h4>
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
    `},Aa={renderDashboard:mt,renderHeroCard:je,renderWorkLog:st,renderActivityList:ot,renderActivityLog:rt,renderStaffActivityListSplit:Ae,renderStaffActivityColumn:ze,renderStatsCard:we,renderBreakdown:dt,renderLeaveRequests:lt,renderLeaveHistory:ct,renderNotificationPanel:pt,renderTaggedItems:ut,renderStaffDirectory:We,renderStaffDirectoryPage:Ht,renderAnnualPlan:ge,renderTimesheet:he,renderProfile:ft,renderMasterSheet:yt,renderAdmin:wt,renderSalaryProcessing:Ft,renderPolicyTest:qt,renderMinutes:gt,renderCheckInModal:jt,renderLogin:ha,renderModals:va,renderYearlyPlan:ba};typeof window<"u"&&(window.AppUI=Aa);class Sa{constructor(){this.db=R}getSmartTaskStatus(e,t=null){if(t==="completed"||t==="not-completed")return t;const a=new Date().toISOString().split("T")[0],n=typeof e=="string"?e:e.toISOString().split("T")[0];return n>a?"to-be-started":n===a?"in-process":n<a?"overdue":"in-process"}calculateTaskPoints(e,t){const a=this.getSmartTaskStatus(t,e.status);let n=0;switch(a){case"completed":if(n=10,e.completedDate){const s=this.getDaysDifference(t,e.completedDate);s===0?n+=3:s===1?n-=1:s>=2&&(n-=2)}break;case"in-process":n=5;break;case"to-be-started":n=0;break;case"overdue":n=-8;break;case"not-completed":n=-3;break}return n}getDaysDifference(e,t){const a=new Date(e),s=new Date(t)-a;return Math.floor(s/(1e3*60*60*24))}getCompletionStats(e){let t=0,a=0,n=0,s=0,r=0,d=0;e.forEach(l=>{if(l.plans&&Array.isArray(l.plans))l.plans.forEach(c=>{switch(d++,this.getSmartTaskStatus(l.date,c.status)){case"completed":t++;break;case"in-process":a++;break;case"not-completed":n++;break;case"overdue":s++;break;case"to-be-started":r++;break}});else if(l.plan)switch(d++,this.getSmartTaskStatus(l.date,l.status)){case"completed":t++;break;case"in-process":a++;break;case"not-completed":n++;break;case"overdue":s++;break;case"to-be-started":r++;break}});const o=d>0?t/d:0;return{completed:t,inProcess:a,notCompleted:n,overdue:s,toBeStarted:r,totalTasks:d,completionRate:parseFloat(o.toFixed(2)),lastCalculated:new Date().toISOString()}}async calculateUserRating(e,t=30){try{const a=await this.db.getAll("work_plans"),n=new Date;n.setDate(n.getDate()-t);const s=n.toISOString().split("T")[0],r=a.filter(c=>c.userId===e&&c.date>=s);if(r.length===0)return{rating:3,rawScore:0,stats:{completed:0,inProcess:0,notCompleted:0,overdue:0,toBeStarted:0,totalTasks:0,completionRate:0,lastCalculated:new Date().toISOString()}};let d=0;r.forEach(c=>{c.plans&&Array.isArray(c.plans)?c.plans.forEach(p=>{d+=this.calculateTaskPoints(p,c.date)}):c.plan&&(d+=this.calculateTaskPoints(c,c.date))});const o=this.getCompletionStats(r),l=this.normalizeScore(d,-50,150);return{rating:parseFloat(l.toFixed(1)),rawScore:d,stats:o}}catch(a){return console.error("Rating calculation failed:",a),{rating:3,rawScore:0,stats:{completed:0,inProcess:0,notCompleted:0,overdue:0,toBeStarted:0,totalTasks:0,completionRate:0,lastCalculated:new Date().toISOString()}}}}normalizeScore(e,t,a){const s=1+(Math.max(t,Math.min(a,e))-t)/(a-t)*4;return Math.max(1,Math.min(5,s))}async updateUserRating(e){try{const t=await this.calculateUserRating(e),a=await this.db.get("users",e);if(!a)throw new Error("User not found");a.ratingHistory||(a.ratingHistory=[]);const n=new Date().toISOString().split("T")[0];return a.ratingHistory.push({date:n,rating:t.rating,reason:"auto-calculated"}),a.ratingHistory.length>90&&(a.ratingHistory=a.ratingHistory.slice(-90)),a.rating=t.rating,a.completionStats=t.stats,await this.db.put("users",a),a}catch(t){throw console.error("Failed to update user rating:",t),t}}async updateAllRatings(){try{const e=await this.db.getAll("users"),t=[];for(const a of e)try{const n=await this.updateUserRating(a.id);t.push(n)}catch(n){console.error(`Failed to update rating for ${a.name}:`,n)}return t}catch(e){throw console.error("Failed to update all ratings:",e),e}}async getTopPerformers(e=5){try{return(await this.db.getAll("users")).filter(n=>n.rating!==void 0).sort((n,s)=>(s.rating||0)-(n.rating||0)).slice(0,e).map(n=>({id:n.id,name:n.name,avatar:n.avatar,rating:n.rating||0,completionStats:n.completionStats||{}}))}catch(t){return console.error("Failed to get top performers:",t),[]}}async getRatingHistory(e,t=90){try{const a=await this.db.get("users",e);if(!a||!a.ratingHistory)return[];const n=new Date;n.setDate(n.getDate()-t);const s=n.toISOString().split("T")[0];return a.ratingHistory.filter(r=>r.date>=s)}catch(a){return console.error("Failed to get rating history:",a),[]}}}const ke=new Sa;typeof window<"u"&&(window.AppRating=ke);class ka{constructor(){this.db=R}normalizePlanScope(e){return String(e||"").toLowerCase()==="annual"?"annual":"personal"}getWorkPlanId(e,t=null,a="personal"){return this.normalizePlanScope(a)==="annual"?`plan_annual_${e}`:`plan_${t}_${e}`}async getPlans(){try{const e=new Date,t=new Date(e.getFullYear(),e.getMonth()-2,1).toISOString().split("T")[0],a=new Date(e.getFullYear(),e.getMonth()+3,0).toISOString().split("T")[0],[n,s,r,d]=await Promise.all([this.db.getAll("leaves"),this.db.getAll("events").catch(()=>[]),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:t},{field:"date",operator:"<=",value:a}]).catch(()=>this.db.getAll("work_plans")):this.db.getAll("work_plans"),this.db.getCached?this.db.getCached(this.db.getCacheKey("calendarUsers","users",{}),U?.READ_CACHE_TTLS?.users||6e4,()=>this.db.getAll("users")).catch(()=>[]):this.db.getAll("users").catch(()=>[])]),o={};d.forEach(p=>{o[p.id]=p.name});const l=(n||[]).filter(p=>p.status==="Approved").map(p=>({...p,userName:p.userName||o[p.userId]||"Staff"})),c=(()=>{const p=new Map;return(s||[]).forEach(m=>{const u=[String(m.date||"").trim(),String(m.title||"").trim().toLowerCase(),String(m.type||"event").trim().toLowerCase(),String(m.createdById||m.createdByName||"").trim().toLowerCase()].join("|");p.has(u)||p.set(u,m)}),Array.from(p.values())})();return{leaves:l,events:c,workPlans:r||[]}}catch(e){return console.error("Failed to fetch calendar plans:",e),{leaves:[],events:[],workPlans:[]}}}async setWorkPlan(e,t=[],a=null,n={}){const s=J.getUser();if(!s)throw new Error("Not authenticated");const r=this.normalizePlanScope(n.planScope),d=a||s.id,o=await this.db.getAll("users"),l=o.find(p=>p.id===d);if(!l)throw console.error("setWorkPlan Error: Target user not found",{targetId:d,currentUser:s,allUsersCount:o.length}),new Error("Target user not found");const c={id:this.getWorkPlanId(e,d,r),userId:r==="annual"?"annual_shared":d,userName:r==="annual"?"All Staff":l.name,date:e,plans:t,planScope:r,createdById:s.id,createdByName:s.name||"Admin",updatedAt:new Date().toISOString()};return await this.db.put("work_plans",c)}async addWorkPlanTask(e,t,a,n=[],s={}){let r=await this.getWorkPlan(t,e);if(!r){const o=(await this.db.getAll("users")).find(l=>l.id===t);if(!o)throw new Error("Target user not found");r={id:`plan_${t}_${e}`,userId:t,userName:o.name,date:e,plans:[],updatedAt:new Date().toISOString()}}if(r.plans||(r.plans=[]),s.sourcePlanId!==void 0&&s.sourceTaskIndex!==void 0&&s.sourcePlanId!==null){const d=r.plans.find(o=>o.sourcePlanId===s.sourcePlanId&&o.sourceTaskIndex===s.sourceTaskIndex&&o.addedFrom===(s.addedFrom||"minutes"));if(d)return d.task=a,d.subPlans=s.subPlans||d.subPlans||[],d.tags=n,d.status=s.status||d.status||"pending",d.startDate=s.startDate||d.startDate||e,d.endDate=s.endDate||d.endDate||d.startDate||e,d.updatedAt=new Date().toISOString(),r.updatedAt=new Date().toISOString(),await this.db.put("work_plans",r)}return r.plans.push({task:a,subPlans:s.subPlans||[],tags:n,status:s.status||"pending",startDate:s.startDate||e,endDate:s.endDate||s.startDate||e,addedFrom:s.addedFrom||"minutes",sourcePlanId:s.sourcePlanId||null,sourceTaskIndex:s.sourceTaskIndex??null,taggedById:s.taggedById||null,taggedByName:s.taggedByName||null}),r.updatedAt=new Date().toISOString(),await this.db.put("work_plans",r)}async deleteWorkPlan(e,t=null,a={}){const n=J.getUser();if(!n)throw new Error("Not authenticated");const s=this.normalizePlanScope(a.planScope),r=t||n.id;return await this.db.delete("work_plans",this.getWorkPlanId(e,r,s))}async getWorkPlan(e,t,a={}){const n=!!a.includeAnnual,s=!!a.mergeAnnual,r=a.planScope?this.normalizePlanScope(a.planScope):null,d=!!a.preferAnnual;if(r)return await this.db.get("work_plans",this.getWorkPlanId(t,e,r));const o=await this.db.get("work_plans",this.getWorkPlanId(t,e,"personal"));if(!n)return o;const l=await this.db.get("work_plans",this.getWorkPlanId(t,e,"annual"));if(s&&l&&o){const c=[];return(l.plans||[]).forEach((p,m)=>{c.push({...p,_planId:l.id,_taskIndex:m,_planDate:l.date,_planScope:"annual"})}),(o.plans||[]).forEach((p,m)=>{c.push({...p,_planId:o.id,_taskIndex:m,_planDate:o.date,_planScope:"personal"})}),{id:`plan_merged_${e}_${t}`,userId:e,userName:o.userName||"Staff",date:t,planScope:"mixed",plans:c,personalPlanId:o.id,annualPlanId:l.id}}return d?l||o:o||l}getSmartTaskStatus(e,t=null){if(ke)return ke.getSmartTaskStatus(e,t);if(t==="completed"||t==="not-completed")return t;const a=new Date().toISOString().split("T")[0],n=typeof e=="string"?e:e.toISOString().split("T")[0];return n>a?"to-be-started":n===a?"in-process":n<a?"overdue":"in-process"}async updateTaskStatus(e,t,a,n=null){try{const s=await this.db.get("work_plans",e);if(!s||!s.plans||!s.plans[t])throw new Error("Plan or task not found");return s.plans[t].status=a,a==="completed"&&!s.plans[t].completedDate&&(s.plans[t].completedDate=n||new Date().toISOString().split("T")[0]),s.updatedAt=new Date().toISOString(),await this.db.put("work_plans",s),ke&&await ke.updateUserRating(s.userId),s}catch(s){throw console.error("Failed to update task status:",s),s}}async reassignTask(e,t,a){try{const n=await this.db.get("work_plans",e);if(!n||!n.plans||!n.plans[t])throw new Error("Plan or task not found");if(!(await this.db.getAll("users")).find(d=>d.id===a))throw new Error("New user not found");return n.plans[t].assignedTo=a,n.updatedAt=new Date().toISOString(),await this.db.put("work_plans",n),n}catch(n){throw console.error("Failed to reassign task:",n),n}}async getTasksByStatus(e,t,a=null,n=null){try{const r=(await this.db.getAll("work_plans")).filter(o=>o.userId===e),d=[];return r.forEach(o=>{a&&o.date<a||n&&o.date>n||o.plans&&Array.isArray(o.plans)&&o.plans.forEach((l,c)=>{const p=this.getSmartTaskStatus(o.date,l.status);p===t&&d.push({...l,planId:o.id,taskIndex:c,planDate:o.date,calculatedStatus:p})})}),d}catch(s){return console.error("Failed to get tasks by status:",s),[]}}async getCollaborations(e,t=null){try{return(await this.db.getAll("work_plans")).filter(n=>(!t||n.date===t)&&n.plans&&n.plans.some(s=>s.tags&&s.tags.some(r=>r.id===e&&r.status==="accepted")))}catch(a){return console.error("Failed to fetch collaborations:",a),[]}}async addEvent(e){const t={id:"ev_"+Date.now(),...e,createdOn:new Date().toISOString()};return await this.db.add("events",t)}_toLocalISO(e){const t=new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`}async getMonthEvents(e,t){const a=await this.getPlans(),n=[];a.leaves.forEach(d=>{const o=new Date(d.startDate),l=new Date(d.endDate);let c=new Date(o);for(;c<=l;)n.push({date:this._toLocalISO(c),title:`${d.userName||"Staff"} (Leave)`,type:"leave",userId:d.userId}),c.setDate(c.getDate()+1)});const s=a.workPlans.map(d=>{let o=[];if(d.plans&&d.plans.length>0)d.plans.forEach(l=>{let c=l.task;l.subPlans&&l.subPlans.length>0&&(c+=" ("+l.subPlans.join(", ")+")"),l.tags&&l.tags.length>0&&(c+=" with "+l.tags.map(p=>p.name).join(", ")),o.push(c)});else if(d.plan){let l=d.plan;d.subPlans&&d.subPlans.length>0&&(l+=" ("+d.subPlans.join(", ")+")"),o.push(l)}return{date:d.date,title:`${d.userName}: ${o.join("; ")}`,type:"work",userId:d.userId,plans:d.plans||[],plan:d.plan||"",subPlans:d.subPlans||[]}});return[...n,...a.events,...s].filter(d=>{const o=new Date(d.date);return o.getFullYear()===e&&o.getMonth()===t})}}const De=new ka;typeof window<"u"&&(window.AppCalendar=De);class Da{constructor(){this.isActive=!1,this.activeMinutes=0,this.totalMinutes=0,this.monitorInterval=null,this.lastActivityTime=Date.now(),this.isCurrentlyActive=!1,this.performedAudits={},this.commandListener=null,this.processedCommandIds=new Set,this.startTime=Date.now(),this.handleActivity=this.handleActivity.bind(this),this.tick=this.tick.bind(this),R&&this.initCommandListener()}initCommandListener(){this.commandListener||R&&R.listen&&(console.log("Activity Monitor: Initializing System Command Listener..."),this.commandListener=R.listen("system_commands",e=>{const t=J.getUser();if(!t){console.log("[Audit] Command detected but user not authenticated yet. Waiting...");return}const a=e.filter(n=>n.type==="audit"&&n.timestamp>this.startTime-6e5&&!this.processedCommandIds.has(n.id)).sort((n,s)=>s.timestamp-n.timestamp);if(a.length>0){const n=a[0];console.log("[Audit] Manual Command Received!",n.id),this.processedCommandIds.add(n.id);const s=n.slotName||`Manual Audit @ ${new Date().toLocaleTimeString()}`;console.log(`[Audit] Executing for user: ${t.name} in slot: ${s}`),this.performSilentAudit(s)}}))}async performSilentAudit(e){const t=J.getUser();if(!t)return;const a=new Date().toISOString().split("T")[0];if(this.performedAudits[a]||(this.performedAudits[a]={}),this.performedAudits[a][e])return;console.log(`Executing Silent Location Audit for slot: ${e}`),this.performedAudits[a][e]=!0;let n={userId:t.id,userName:t.name,timestamp:Date.now(),slot:e,status:"Success",lat:0,lng:0};try{if(window.getLocation){const s=await window.getLocation().catch(r=>(console.warn("Silent Audit Location Failed:",r),null));s?(n.lat=s.lat,n.lng=s.lng):n.status="Location service disabled"}else n.status="Location service disabled (missing helper)"}catch{n.status="Location service disabled"}try{await R.add("location_audits",n),console.log("Silent Audit Log Saved.")}catch(s){console.error("Failed to save audit log:",s)}}start(){this.isActive||(this.isActive=!0,this.activeMinutes=0,this.totalMinutes=0,this.isCurrentlyActive=!1,this.lastActivityTime=Date.now(),document.addEventListener("mousemove",this.handleActivity),document.addEventListener("click",this.handleActivity),document.addEventListener("keydown",this.handleActivity),document.addEventListener("scroll",this.handleActivity),this.monitorInterval=setInterval(this.tick,6e4),console.log("Activity Monitoring Started"))}stop(){if(this.isActive)return this.isActive=!1,document.removeEventListener("mousemove",this.handleActivity),document.removeEventListener("click",this.handleActivity),document.removeEventListener("keydown",this.handleActivity),document.removeEventListener("scroll",this.handleActivity),this.monitorInterval&&clearInterval(this.monitorInterval),console.log("Activity Monitoring Stopped. Score:",this.getScore()),this.getStats()}handleActivity(){this.isCurrentlyActive||(this.isCurrentlyActive=!0,this.lastActivityTime=Date.now())}tick(){this.totalMinutes++,this.isCurrentlyActive&&this.activeMinutes++;const e=J.getUser();e&&e.status==="in"&&(e.activityScore=this.getScore(),e.lastActive=this.lastActivityTime,R.put("users",e)),this.isCurrentlyActive=!1}getScore(){return this.totalMinutes===0?100:Math.round(this.activeMinutes/this.totalMinutes*100)}getStats(){return{score:this.getScore(),activeMinutes:this.activeMinutes,totalMinutes:this.totalMinutes}}}const $a=new Da;typeof window<"u"&&(window.AppActivity=$a);class xa{constructor(){this.active=!1,this.currentStep=0,this.steps=[],this.overlay=null,this.tooltip=null,this.highlight=null,this.tourKey="crwi_tour_completed"}init(e){if(e){if(localStorage.getItem(this.tourKey+"_"+e.id)){console.log("Tour already completed for user:",e.id);return}this.defineSteps(e),setTimeout(()=>{this.startTour(e)},2e3)}}defineSteps(e){e.isAdmin||e.role==="Administrator"?this.steps=[{element:".sidebar-header",title:"Welcome, Admin!",content:"This is your CRWI Attendance management console. Let us walk you through the key features.",position:"right"},{element:'.nav-item[data-page="admin"]',title:"User Management",content:"In the Admin Panel, you can add new staff, edit details, and manage roles.",position:"right"},{element:'.nav-item[data-page="master-sheet"]',title:"Attendance Sheet",content:"View and export the master attendance sheet for all employees here.",position:"right"},{element:'.nav-item[data-page="salary"]',title:"Salary Processing",content:"Calculate and process salaries based on attendance logs and penalties.",position:"right"},{element:".main-content",title:"Dashboard Overview",content:"The dashboard gives you real-time insights into who is in, pending leaves, and team activity.",position:"bottom"}]:this.steps=[{element:".sidebar-header",title:"Welcome to CRWI!",content:"This portal helps you track your attendance and work logs. Here is a quick guide.",position:"right"},{element:".action-btn",title:"Check-In / Out",content:"Use this button daily to mark your attendance. Don't forget to add a summary when checking out!",position:"bottom"},{element:'.nav-item[data-page="timesheet"]',title:"Your Timesheet",content:"Review your past logs and request leaves from here.",position:"right"},{element:'.nav-item[data-page="profile"]',title:"Your Profile",content:"View your stats, rewards, and manage your account details.",position:"right"}]}startTour(e){this.steps.length!==0&&(this.active=!0,this.currentStep=0,this.createUIElements(),this.showStep(),localStorage.setItem(this.tourKey+"_"+e.id,"true"))}createUIElements(){this.overlay=document.createElement("div"),this.overlay.className="tour-overlay",this.highlight=document.createElement("div"),this.highlight.className="tour-highlight",this.tooltip=document.createElement("div"),this.tooltip.className="tour-tooltip",document.body.appendChild(this.overlay),document.body.appendChild(this.highlight),document.body.appendChild(this.tooltip)}showStep(){const e=this.steps[this.currentStep],t=document.querySelector(e.element);if(!t||t.offsetParent===null){console.warn("Tour target not found:",e.element),this.nextStep();return}const a=t.getBoundingClientRect(),n=5;this.highlight.style.top=a.top-n+"px",this.highlight.style.left=a.left-n+"px",this.highlight.style.width=a.width+n*2+"px",this.highlight.style.height=a.height+n*2+"px",t.scrollIntoView({behavior:"smooth",block:"center"}),this.tooltip.innerHTML=`
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
            `,this.positionTooltip(a,e.position),this.tooltip.classList.add("active")}positionTooltip(e,t){const a=this.tooltip.getBoundingClientRect(),n=15;let s,r;switch(t){case"right":s=e.top+e.height/2-a.height/2,r=e.right+n;break;case"bottom":s=e.bottom+n,r=e.left+e.width/2-a.width/2;break;case"left":s=e.top+e.height/2-a.height/2,r=e.left-a.width-n;break;case"top":s=e.top-a.height-n,r=e.left+e.width/2-a.width/2;break;default:s=e.bottom+n,r=e.left}const d=window.innerWidth,o=window.innerHeight;r<10&&(r=10),r+a.width>d-10&&(r=d-a.width-10),s<10&&(s=10),s+a.height>o-10&&(s=o-a.height-10),this.tooltip.style.top=s+"px",this.tooltip.style.left=r+"px"}nextStep(){this.currentStep++,this.currentStep<this.steps.length?this.showStep():this.endTour()}endTour(){this.active=!1,this.overlay&&this.overlay.remove(),this.highlight&&this.highlight.remove(),this.tooltip&&this.tooltip.remove()}resetTour(e){localStorage.removeItem(this.tourKey+"_"+e),window.location.reload()}}const Ia=new xa;typeof window<"u"&&(window.AppTour=Ia);class Ta{constructor(){this.db=R,this.chartInstance=null,this.memo=new Map,typeof window<"u"&&window.addEventListener&&window.addEventListener("app:db-write",e=>{const t=e?.detail?.collection;["attendance","users","work_plans","leaves","minutes"].includes(t)&&this.clearMemo()})}getFlags(){return U&&U.READ_OPT_FLAGS||{}}getTtls(){return U&&U.READ_CACHE_TTLS||{}}async memoize(e,t,a){if(!this.getFlags().FF_READ_OPT_ANALYTICS_CACHE)return a();const s=Date.now(),r=this.memo.get(e);if(r&&r.expiresAt>s)return r.value;const d=await a();return this.memo.set(e,{value:d,expiresAt:s+Math.max(0,Number(t)||0)}),d}clearMemo(e=""){if(!e){this.memo.clear();return}for(const t of this.memo.keys())t.startsWith(e)&&this.memo.delete(t)}async getUsersCached(){const e=this.getTtls().users||6e4;return this.memoize("analytics:users",e,async()=>{if(R&&R.getCached){const t=R.getCacheKey("analyticsUsers","users",{ttl:e});return R.getCached(t,e,()=>this.db.getAll("users"))}return this.db.getAll("users")})}async getAttendanceInRange(e,t,a=""){const n=this.getTtls().attendanceSummary||3e4,s=typeof e=="string"?e:e.toISOString().split("T")[0],r=typeof t=="string"?t:t.toISOString().split("T")[0],d=`analytics:attendance:${s}:${r}:${a}`;return this.memoize(d,n,async()=>this.db.queryMany?this.db.queryMany("attendance",[{field:"date",operator:">=",value:s},{field:"date",operator:"<=",value:r}]):(await this.db.getAll("attendance")).filter(l=>l.date>=s&&l.date<=r))}async initAdminCharts(){const e=document.getElementById("admin-stats-chart");if(!e)return;this.chartInstance&&(this.chartInstance.destroy(),this.chartInstance=null);const t=new Date,a=new Date;a.setDate(a.getDate()-14);const[n,s]=await Promise.all([this.getAttendanceInRange(a,t,"adminChart"),this.getUsersCached()]),r=this.processLast7Days(n,s),d=e.getContext("2d");try{this.chartInstance=new Chart(d,{type:"line",data:{labels:r.labels,datasets:[{label:"Staff Present",data:r.present,borderColor:"#10b981",backgroundColor:"rgba(16, 185, 129, 0.1)",fill:!0,tension:.4,borderWidth:3,pointBackgroundColor:"#10b981",pointRadius:4},{label:"On Leave",data:r.onLeave,borderColor:"#ef4444",backgroundColor:"transparent",borderDash:[5,5],tension:.1,pointRadius:0}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{intersect:!1,mode:"index"},plugins:{legend:{position:"top",labels:{usePointStyle:!0,boxWidth:6}},tooltip:{backgroundColor:"rgba(30, 27, 75, 0.9)",padding:12,titleFont:{size:14,weight:"bold"},bodyFont:{size:13},cornerRadius:8}},scales:{y:{beginAtZero:!0,ticks:{stepSize:1,color:"#6b7280"},grid:{color:"rgba(0,0,0,0.05)"}},x:{grid:{display:!1},ticks:{color:"#6b7280"}}}}})}catch(o){console.error("Chart.js Error:",o),e.parentNode.innerHTML=`<div style="color:red; text-align:center; padding:1rem;">Failed to load chart: ${o.message}</div>`}}processLast7Days(e,t=[]){const a=[],n=[],s=[],r=o=>{if(Object.prototype.hasOwnProperty.call(o||{},"attendanceEligible"))return o.attendanceEligible===!0;const l=String(o?.entrySource||"");return l==="staff_manual_work"?!1:l==="admin_override"||l==="checkin_checkout"||o?.isManualOverride||o?.location==="Office (Manual)"||o?.location==="Office (Override)"||typeof o?.activityScore<"u"||typeof o?.locationMismatched<"u"||typeof o?.autoCheckout<"u"||!!o?.checkOutLocation||typeof o?.outLat<"u"||typeof o?.outLng<"u"?!0:String(o?.type||"").includes("Leave")||o?.location==="On Leave"},d=(o,l)=>o.getFullYear()===l.getFullYear()&&o.getMonth()===l.getMonth()&&o.getDate()===l.getDate();for(let o=6;o>=0;o--){const l=new Date;l.setDate(l.getDate()-o);const c=l.toLocaleDateString("en-US",{weekday:"short",day:"numeric"});a.push(c);const p=e.filter(y=>{const g=new Date(y.date);return isNaN(g.getTime())?!1:d(g,l)}),m=new Set,u=new Set;p.forEach(y=>{if(!r(y))return;const g=y.user_id||y.userId;if(!g)return;String(y.type||"").toLowerCase().includes("leave")||y.location==="On Leave"||y.type==="Absent"?u.add(g):m.add(g)}),o===0&&t.forEach(y=>{y.status==="in"&&m.add(y.id)}),n.push(m.size),s.push(u.size)}return console.log("Weekly Stats Generated (Unique):",{labels:a,present:n}),{labels:a,present:n,onLeave:s}}parseTimeToMinutes(e){if(!e)return null;const[t,a]=e.split(" ");let[n,s]=t.split(":");return n==="12"&&(n="00"),a==="PM"&&(n=parseInt(n,10)+12),parseInt(n,10)*60+parseInt(s,10)}formatDuration(e){const t=Math.floor(e/60),a=e%60;return`${t}h ${a}m`}getWeekNumber(e){const t=new Date(e);t.setHours(0,0,0,0),t.setDate(t.getDate()+4-(t.getUTCDay()||7));const a=new Date(t.getFullYear(),0,1);return Math.ceil(((t-a)/864e5+1)/7)}async getUserMonthlyStats(e){const t=new Date,a=new Date(t.getFullYear(),t.getMonth(),1),n=new Date(t.getFullYear(),t.getMonth()+1,0),r=(await this.getAttendanceInRange(a,n,`monthly:${e}`)).filter(d=>d.userId===e||d.user_id===e);return this.calculateStatsForLogs(r)}async getSystemMonthlySummary(){const e=new Date,t=new Date(e.getFullYear(),e.getMonth(),1),a=new Date(e.getFullYear(),e.getMonth()+1,0),[n,s]=await Promise.all([this.getUsersCached(),this.getAttendanceInRange(t,a,"sysMonthly")]);return await Promise.all(n.map(async d=>{const o=s.filter(c=>(c.userId===d.id||c.user_id===d.id)&&new Date(c.date)>=t&&new Date(c.date)<=a),l=this.calculateStatsForLogs(o);return{user:d,stats:l}}))}calculateStatsForLogs(e){const t=new Date,a=t.getFullYear(),n=t.getMonth(),s=new Date(a,n,1),r=new Date(a,n+1,0),d={Present:0,Late:0,"Early Departure":0,"Work - Home":0,Training:0,"Sick Leave":0,"Casual Leave":0,"Earned Leave":0,"Paid Leave":0,"Maternity Leave":0,Absent:0,Holiday:0,"National Holiday":0,"Regional Holidays":0},o={present:0,late:0,leaves:0,unpaidLeaves:0,penalty:0,penaltyOffset:0,effectivePenalty:0,extraWorkedHours:0,earlyDepartures:0,label:s.toLocaleDateString("default",{month:"long",year:"numeric"}),breakdown:d,totalLateDuration:"0h 0m",totalExtraDuration:"0h 0m"};let l=0,c=0;e.forEach(u=>{const y=new Date(u.date);if(!isNaN(y)&&y>=s&&y<=r){if(!(Object.prototype.hasOwnProperty.call(u,"attendanceEligible")?u.attendanceEligible===!0:(()=>{const $=String(u.entrySource||"");return $==="staff_manual_work"?!1:$==="admin_override"||$==="checkin_checkout"||u.isManualOverride||u.location==="Office (Manual)"||u.location==="Office (Override)"||typeof u.activityScore<"u"||typeof u.locationMismatched<"u"||typeof u.autoCheckout<"u"||!!u.checkOutLocation||typeof u.outLat<"u"||typeof u.outLng<"u"?!0:String(u.type||"").includes("Leave")||u.location==="On Leave"})()))return;let h=u.type||"";const f=this.parseTimeToMinutes(u.checkIn),v=this.parseTimeToMinutes(u.checkOut);if(u.isManualOverride===!0)h==="Late"?(o.late++,d.Late++,f!==null&&f>540&&(l+=f-540)):h==="Early Departure"&&(o.earlyDepartures++,d["Early Departure"]++);else{const $=U.LATE_CUTOFF_MINUTES||555;(u.lateCountable===!0||!Object.prototype.hasOwnProperty.call(u,"lateCountable")&&f!==null&&f>$)&&(d.Late++,o.late++,f!==null&&(l+=Math.max(0,f-$)));const L=U.EARLY_DEPARTURE_MINUTES||1020;v!==null&&v<L&&!String(h).includes("Leave")&&h!=="Absent"&&(o.earlyDepartures++,d["Early Departure"]++)}const k=U.LATE_CUTOFF_MINUTES||555,w=U.EARLY_DEPARTURE_MINUTES||1020,A=typeof u.extraWorkedMs=="number"?Math.max(0,Math.round(u.extraWorkedMs/(1e3*60))):0;A>0?c+=A:!(u.autoCheckout&&!u.autoCheckoutExtraApproved)&&(f!==null&&f<k&&(c+=k-f),v!==null&&v>w&&(c+=v-w)),h==="Work - Home"?d["Work - Home"]++:h==="Training"?d.Training++:h==="Sick Leave"?(d["Sick Leave"]++,o.unpaidLeaves++):h==="Casual Leave"?d["Casual Leave"]++:h==="Earned Leave"?d["Earned Leave"]++:h==="Paid Leave"?d["Paid Leave"]++:h==="Maternity Leave"?d["Maternity Leave"]++:h==="Absent"?(d.Absent++,o.unpaidLeaves++):h==="National Holiday"?d["National Holiday"]++:h==="Regional Holidays"?d["Regional Holidays"]++:String(h).includes("Holiday")?d.Holiday++:u.checkIn&&d.Present++}}),o.present=d.Present+d["Work - Home"]+d.Training,o.leaves=d["Sick Leave"]+d["Casual Leave"]+d["Earned Leave"]+d["Paid Leave"]+d["Maternity Leave"]+d.Absent,o.extraWorkedHours=Number((c/60).toFixed(2)),o.penalty=Math.floor((o.late||0)/(U.LATE_GRACE_COUNT||3))*(U.LATE_DEDUCTION_PER_BLOCK||.5);const p=U.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4,m=U.LATE_DEDUCTION_PER_BLOCK||.5;return o.penaltyOffset=Math.floor((o.extraWorkedHours||0)/p)*m,o.effectivePenalty=Math.max(0,o.penalty-o.penaltyOffset),o.totalLateDuration=this.formatDuration(l),o.totalExtraDuration=this.formatDuration(c),o}async getUserYearlyStats(e){const{start:t,end:a,label:n}=this.getFinancialYearDates(),r=(await this.getAttendanceInRange(t,a,`yearly:${e}`)).filter(u=>u.userId===e||u.user_id===e),d={Present:0,Late:0,"Early Departure":0,"Work - Home":0,Training:0,"Sick Leave":0,"Casual Leave":0,"Earned Leave":0,"Paid Leave":0,"Maternity Leave":0,Absent:0,Holiday:0,"National Holiday":0,"Regional Holidays":0},o={present:0,late:0,leaves:0,earlyDepartures:0,penaltyLeaves:0,penaltyOffset:0,effectivePenalty:0,extraWorkedHours:0,label:n,breakdown:d,totalLateDuration:"0h 0m",totalExtraDuration:"0h 0m"};let l=0,c=0;r.forEach(u=>{const y=new Date(u.date);if(!isNaN(y)&&y>=t&&y<=a){if(!(Object.prototype.hasOwnProperty.call(u,"attendanceEligible")?u.attendanceEligible===!0:(()=>{const $=String(u.entrySource||"");return $==="staff_manual_work"?!1:$==="admin_override"||$==="checkin_checkout"||u.isManualOverride||u.location==="Office (Manual)"||u.location==="Office (Override)"||typeof u.activityScore<"u"||typeof u.locationMismatched<"u"||typeof u.autoCheckout<"u"||!!u.checkOutLocation||typeof u.outLat<"u"||typeof u.outLng<"u"?!0:String(u.type||"").includes("Leave")||u.location==="On Leave"})()))return;let h=u.type||"";const f=this.parseTimeToMinutes(u.checkIn),v=this.parseTimeToMinutes(u.checkOut),b=U.LATE_CUTOFF_MINUTES||555;(u.lateCountable===!0||!Object.prototype.hasOwnProperty.call(u,"lateCountable")&&f!==null&&f>b)&&(d.Late++,f!==null&&(l+=Math.max(0,f-b)));const w=U.EARLY_DEPARTURE_MINUTES||1020;v!==null&&v<w&&!String(h).includes("Leave")&&h!=="Absent"&&(o.earlyDepartures++,d["Early Departure"]++);const A=typeof u.extraWorkedMs=="number"?Math.max(0,Math.round(u.extraWorkedMs/(1e3*60))):0;A>0?c+=A:!(u.autoCheckout&&!u.autoCheckoutExtraApproved)&&(f!==null&&f<b&&(c+=b-f),v!==null&&v>w&&(c+=v-w)),h==="Work - Home"?d["Work - Home"]++:h==="Training"?d.Training++:h==="Sick Leave"?d["Sick Leave"]++:h==="Casual Leave"?d["Casual Leave"]++:h==="Earned Leave"?d["Earned Leave"]++:h==="Paid Leave"?d["Paid Leave"]++:h==="Maternity Leave"?d["Maternity Leave"]++:h==="Absent"?d.Absent++:h==="National Holiday"?d["National Holiday"]++:h==="Regional Holidays"?d["Regional Holidays"]++:String(h).includes("Holiday")?d.Holiday++:u.checkIn&&d.Present++}}),o.present=d.Present+d["Work - Home"]+d.Training,o.leaves=d["Sick Leave"]+d["Casual Leave"]+d["Earned Leave"]+d["Paid Leave"]+d["Maternity Leave"]+d.Absent,o.late=d.Late,o.extraWorkedHours=Number((c/60).toFixed(2)),o.totalLateDuration=this.formatDuration(l),o.totalExtraDuration=this.formatDuration(c),o.penaltyLeaves=Math.floor((d.Late||0)/(U.LATE_GRACE_COUNT||3))*(U.LATE_DEDUCTION_PER_BLOCK||.5);const p=U.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4,m=U.LATE_DEDUCTION_PER_BLOCK||.5;return o.penaltyOffset=Math.floor((o.extraWorkedHours||0)/p)*m,o.effectivePenalty=Math.max(0,o.penaltyLeaves-o.penaltyOffset),o}getFinancialYearDates(){const e=new Date,t=e.getFullYear(),a=e.getMonth(),n=U.FY_START_MONTH||3;let s=t;a<n&&(s=t-1);const r=new Date(s,n,1),d=new Date(s+1,n,0);return{start:r,end:d,label:`FY ${s}-${s+1}`}}getDayType(e){const t=typeof e=="string"?new Date(e):e,a=t.getDay();return a===0||a===6&&U.IS_SATURDAY_OFF&&U.IS_SATURDAY_OFF(t)?"Holiday":"Work Day"}async getHeroOfTheWeek(){try{const e=new Date;e.setDate(e.getDate()-7),e.setHours(0,0,0,0);const[t,a]=await Promise.all([this.getAttendanceInRange(e,new Date,"hero"),this.getUsersCached()]),n=t.filter(l=>{const c=new Date(l.date);return!isNaN(c.getTime())&&c>=e});if(n.length===0)return null;const s={};n.forEach(l=>{const c=l.user_id||l.userId;if(!c)return;s[c]||(s[c]={userId:c,totalDurationMs:0,daysCount:new Set,activityLogDepth:0,avgActivityScore:0,scoreCount:0});const p=s[c];let m=l.durationMs;if(m===void 0&&l.checkIn&&l.checkOut&&l.checkOut!=="Active Now"){const u=this.parseTimeToMinutes(l.checkIn),y=this.parseTimeToMinutes(l.checkOut);u!==null&&y!==null&&(m=(y-u)*60*1e3),m<0&&(m=0)}p.totalDurationMs+=m||0,p.daysCount.add(l.date),p.activityLogDepth+=(l.workDescription||"").length,l.activityScore!==void 0&&(p.avgActivityScore+=l.activityScore,p.scoreCount++)});const r=Object.values(s).map(l=>{const c=l.daysCount.size,p=l.totalDurationMs/(1e3*60*60),m=l.scoreCount>0?l.avgActivityScore/l.scoreCount:70,u=c/7*100,y=Math.min(p/40*100,100),g=Math.min(l.activityLogDepth/500*100,100),h=u*.4+y*.3+g*.2+m*.1;return{...l,days:c,hours:p.toFixed(1),finalScore:h}});r.sort((l,c)=>c.finalScore-l.finalScore);const d=r[0],o=a.find(l=>l.id===d.userId);return o?{user:o,stats:d,reason:this.determineHeroReason(d)}:null}catch(e){return console.error("Hero Calculation Error:",e),null}}determineHeroReason(e){return e.days>=5?"Unmatched Consistency":e.hours>=40?"Hardworking Machine":e.activityLogDepth>300?"Detailed Communicator":"Top Performer"}async getSystemPerformance(){try{const e=new Date;e.setDate(e.getDate()-7);const t=await this.getAttendanceInRange(e,new Date,"performance"),a=[],n=[];let s=0,r=0;const d=(l,c)=>l.getFullYear()===c.getFullYear()&&l.getMonth()===c.getMonth()&&l.getDate()===c.getDate();for(let l=6;l>=0;l--){const c=new Date;c.setDate(c.getDate()-l);const p=c.toLocaleDateString("en-US",{weekday:"narrow"});n.push(p);const m=t.filter(u=>{const y=new Date(u.date);return!isNaN(y.getTime())&&d(y,c)});if(m.length===0)a.push(0);else{const u=m.map(g=>g.activityScore||0).filter(g=>g>0),y=u.length>0?u.reduce((g,h)=>g+h,0)/u.length:0;a.push(Math.round(y)),y>0&&(s+=y,r++)}}return{avgScore:r>0?Math.round(s/r):0,trendData:a,labels:n}}catch(e){return console.error("System Performance Calculation Error:",e),{avgScore:0,trendData:[0,0,0,0,0,0,0]}}}async buildDailyDashboardSummary(e={}){const t=new Date,a=String(e.dateKey||t.toISOString().split("T")[0]),n=String(e.selectedMonth||t.toISOString().slice(0,7)),[s,r]=n.split("-"),d=Number(s),o=Number(r)-1,l=Number.isInteger(d)&&Number.isInteger(o)&&o>=0&&o<=11?new Date(d,o,1):new Date(t.getFullYear(),t.getMonth(),1),c=Number.isInteger(d)&&Number.isInteger(o)&&o>=0&&o<=11?new Date(d,o+1,0):new Date(t.getFullYear(),t.getMonth()+1,0),p=Math.max(1,Number(U?.SUMMARY_POLICY?.TEAM_ACTIVITY_LIMIT)||15),[m,u]=await Promise.all([this.getHeroOfTheWeek(),this.getAllStaffActivities({mode:"month",month:n,scope:"work"})]);return{dateKey:a,monthKey:n,version:Number(U?.SUMMARY_POLICY?.SCHEMA_VERSION||1),generatedAt:Date.now(),hero:m||null,teamActivityPreview:(u||[]).slice(0,p),range:{startIso:l.toISOString().split("T")[0],endIso:c.toISOString().split("T")[0]},meta:{generatedAt:Date.now(),source:"client_first_writer"}}}async getAllStaffActivities(e={}){try{const a=typeof e=="number"?{mode:"days",daysBack:e,scope:"all"}:e||{},n=a.mode||"month",s=a.scope||"all",r=new Date,d=new Date;if(n==="days"){const f=Number.isFinite(Number(a.daysBack))?Number(a.daysBack):7;r.setHours(23,59,59,999),d.setDate(d.getDate()-f),d.setHours(0,0,0,0)}else{const f=String(a.month||new Date().toISOString().slice(0,7)),[v,b]=f.split("-"),k=Number(v),w=Number(b)-1;if(!Number.isInteger(k)||!Number.isInteger(w)||w<0||w>11)throw new Error(`Invalid month key: ${f}`);const A=new Date(k,w,1),$=new Date(k,w+1,0);d.setTime(A.getTime()),r.setTime($.getTime()),d.setHours(0,0,0,0),r.setHours(23,59,59,999)}const o=d.toISOString().split("T")[0],l=r.toISOString().split("T")[0],c=s!=="work",[p,m,u]=await Promise.all([c?this.getAttendanceInRange(d,r,`staffAct:${o}:${l}:${s}`):Promise.resolve([]),this.db.queryMany?this.db.queryMany("work_plans",[{field:"date",operator:">=",value:o},{field:"date",operator:"<=",value:l}]):R.getAll("work_plans"),this.getUsersCached()]),y={};u.forEach(f=>{y[f.id]=f.name});const g=[],h={};return c&&p.forEach(f=>{const v=new Date(f.date);if(v>=d&&v<=r&&f.workDescription){const b=f.user_id||f.userId,k=`${b}:${f.date}`;h[k]||(h[k]=[]),h[k].push(f.workDescription.toLowerCase().trim()),g.push({...f,type:"attendance",staffName:y[b]||f.userName||"Unknown Staff",_displayDesc:f.workDescription,_sortTime:f.checkOut||"00:00"})}}),m.forEach(f=>{const v=new Date(f.date);if(v>=d&&v<=r&&f.plans){const b=`${f.userId}:${f.date}`,k=h[b]||[];f.plans.forEach(w=>{const A=(w.task||"").trim().toLowerCase();if(A&&k.length>0&&k.some(T=>T.includes(A)))return;const $=f.userId||f.user_id;let I=y[$]||f.userName;I||(I=$==="annual_shared"?"All Staff":"Unknown Staff"),g.push({...w,date:f.date,id:f.id,userId:$,type:"work",staffName:I,_displayDesc:w.task,_sortTime:"09:00"})})}}),g.sort((f,v)=>{const b=new Date(v.date)-new Date(f.date);return b!==0?b:v._sortTime.localeCompare(f._sortTime)}),g}catch(t){return console.error("Error fetching all staff activities:",t),[]}}}const La=new Ta;typeof window<"u"&&(window.AppAnalytics=La);class _a{constructor(){this.db=R}convertToCSV(e,t,a){const n=t.join(","),s=e.map(r=>a.map(d=>{let o=r[d]||"";return o=String(o).replace(/"/g,'""'),o.search(/("|,|\n)/g)>=0&&(o=`"${o}"`),o}).join(","));return[n,...s].join(`
`)}downloadFile(e,t,a){const n=new Blob([e],{type:a}),s=URL.createObjectURL(n),r=document.createElement("a");r.href=s,r.download=t,document.body.appendChild(r),r.click(),setTimeout(()=>{document.body.removeChild(r),window.URL.revokeObjectURL(s)},0)}async exportAttendanceCSV(){try{const e=await this.db.getAll("users"),t=await this.db.getAll("attendance"),a={};e.forEach(l=>a[l.id]=l);const n=t.map(l=>{const c=l.user_id||l.userId,p=a[c]||{name:"Unknown",role:"N/A",rating:0,completionStats:{}};let m=l.location||"N/A";return l.lat&&l.lng&&(m=`Lat: ${Number(l.lat).toFixed(5)}, Lng: ${Number(l.lng).toFixed(5)}`),{date:l.date,name:p.name,role:p.role,rating:p.rating?p.rating.toFixed(1):"N/A",completionRate:p.completionStats?.completionRate?`${(p.completionStats.completionRate*100).toFixed(0)}%`:"N/A",checkIn:l.checkIn,checkOut:l.checkOut||"--",duration:l.duration||"--",workSummary:l.workDescription||"--",inLocation:m,outLocation:l.checkOutLocation||"--",type:l.type||"Standard"}});e.forEach(l=>{if(l.status==="in"&&l.lastCheckIn){const c=new Date(l.lastCheckIn);n.push({date:c.toLocaleDateString(),name:l.name,role:l.role,checkIn:c.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),checkOut:"Active Now",duration:"Working...",workSummary:"Current Session (Active)",inLocation:l.currentLocation?.address||"Current Session",outLocation:"--",type:"Office (Active)"})}}),n.sort((l,c)=>new Date(c.date)-new Date(l.date));const s=["Date","Staff Name","Role","Star Rating","Completion Rate","Check In","Check Out","Duration","Work Summary","Check-in Location","Check-out Location","Type"],r=["date","name","role","rating","completionRate","checkIn","checkOut","duration","workSummary","inLocation","outLocation","type"],d=this.convertToCSV(n,s,r),o=`Attendance_Report_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(d,o,"text/csv"),!0}catch(e){throw console.error("Export Failed:",e),new Error("Failed to generate report")}}async exportUserLogsCSV(e,t){try{const a=t.map(o=>{let l=o.location||"N/A";return o.lat&&o.lng&&(l=`Lat: ${Number(o.lat).toFixed(5)}, Lng: ${Number(o.lng).toFixed(5)}`),{date:o.date,name:e.name,role:e.role,checkIn:o.checkIn,checkOut:o.checkOut||"--",duration:o.duration||"--",workSummary:o.workDescription||"--",inLocation:l,outLocation:o.checkOutLocation||"--",type:o.type||"Standard"}});a.sort((o,l)=>new Date(l.date)-new Date(o.date));const n=["Date","Staff Name","Role","Check In","Check Out","Duration","Work Summary","Check-in Location","Check-out Location","Type"],s=["date","name","role","checkIn","checkOut","duration","workSummary","inLocation","outLocation","type"],r=this.convertToCSV(a,n,s),d=`Attendance_Report_${e.name.replace(/ /g,"_")}_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(r,d,"text/csv"),!0}catch(a){console.error("Export Failed:",a),alert("Failed to export logs: "+a.message)}}async exportMasterSheetCSV(e,t,a,n){try{const s=new Date(t,e+1,0).getDate(),r=["S.No","Staff Name","Department"];for(let p=1;p<=s;p++)r.push(String(p));const d=a.sort((p,m)=>p.name.localeCompare(m.name)).map((p,m)=>{const u=[m+1,p.name,p.dept||"General"];for(let y=1;y<=s;y++){const g=`${t}-${String(e+1).padStart(2,"0")}-${String(y).padStart(2,"0")}`,h=n.filter(f=>(f.userId===p.id||f.user_id===p.id)&&f.date===g);if(h.length>0){const f=h[0];let v=f.type||"P";v==="Short Leave"&&f.durationHours&&(v=`SL(${f.durationHours}h)`),u.push(`${v} (${f.checkIn}-${f.checkOut||"Active"})`)}else u.push("-")}return u}),o=[r.join(","),...d.map(p=>p.join(","))].join(`
`),c=`Attendance_Sheet_${new Date(t,e).toLocaleString("default",{month:"long"})}_${t}.csv`;return this.downloadFile(o,c,"text/csv"),!0}catch(s){console.error("Export Failed:",s),alert("Export Failed: "+s.message)}}async exportLeavesCSV(e){try{const t=["Applied On","Staff Name","FY","Type","From","To","Days/Hrs","Reason","Status","Admin Comment"],a=["appliedOn","userName","financialYear","type","startDate","endDate","daysCount","reason","status","adminComment"],n=e.map(d=>({...d,daysCount:d.type==="Short Leave"?`${d.durationHours||0}h`:d.daysCount})),s=this.convertToCSV(n,t,a),r=`Leave_Requests_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(s,r,"text/csv"),!0}catch(t){console.error("Leave Export Failed:",t),alert("Export Failed: "+t.message)}}async exportCalendarPlansCSV(e,t,a){try{const n=[],s=new Date(a,t+1,0).getDate(),r=new Date(a,t).toLocaleString("default",{month:"long"});for(let p=1;p<=s;p++){const m=`${a}-${String(t+1).padStart(2,"0")}-${String(p).padStart(2,"0")}`;e.leaves.forEach(u=>{m>=u.startDate&&m<=u.endDate&&n.push({date:m,category:"Leave",subject:`${u.userName||"Staff"} - ${u.type}`,details:u.reason||"No reason provided",staff:u.userName||"Staff"})}),e.events.forEach(u=>{u.date===m&&n.push({date:m,category:"Event",subject:u.title,details:u.type||"General Event",staff:"Organization"})}),e.workPlans.forEach(u=>{if(u.date===m){const y=u.plans?u.plans.map((g,h)=>{let f=`${h+1}. ${g.task}`;return g.subPlans&&g.subPlans.length>0&&(f+=` (Steps: ${g.subPlans.join(", ")})`),g.tags&&g.tags.length>0&&(f+=` [With: ${g.tags.map(v=>`@${v.name} (${v.status||"pending"})`).join(", ")}]`),f}).join(" | "):u.plan||"Work Plan";n.push({date:m,category:"Work Plan",subject:"Daily Goals",details:y,staff:u.userName||"Staff"})}})}if(n.length===0)return alert("No plans found for the selected month."),!1;const d=["Date","Category","Subject","Details","Staff Member"],o=["date","category","subject","details","staff"],l=this.convertToCSV(n,d,o),c=`Team_Schedule_${r}_${a}.csv`;return this.downloadFile(l,c,"text/csv"),!0}catch(n){console.error("Calendar Export Failed:",n),alert("Failed to export calendar: "+n.message)}}async exportAnnualListViewCSV(e){try{const t=(e||[]).map(d=>({date:d.date||"",staffName:d.staffName||d.staff||"",assignedBy:d.assignedBy||"",assignedTo:d.assignedTo||"",selfAssigned:d.selfAssigned?"Yes":"No",dueDate:d.dueDate||"",status:d.statusLabel||d.status||"",comments:d.comments||"",tags:Array.isArray(d.tags)?d.tags.join(", "):d.tags||""})),a=["Date","Staff Name","Assigned By","Assigned To","Self Assigned","Due Date","Completion Status","Comments","Tags"],n=["date","staffName","assignedBy","assignedTo","selfAssigned","dueDate","status","comments","tags"],s=this.convertToCSV(t,a,n),r=`Annual_Plan_List_${new Date().toISOString().split("T")[0]}.csv`;return this.downloadFile(s,r,"text/csv"),!0}catch(t){throw console.error("List Export Failed:",t),new Error("Failed to export list: "+t.message)}}}const Ma=new _a;typeof window<"u"&&(window.AppReports=Ma);class Ea{constructor(){this.db=R,this.cache={},this.defaultPolicy={"Annual Leave":{total:10,minDays:3,accrual:"annual"},"Casual Leave":{total:6,maxDays:2,accrual:"monthly"},"Medical Leave":{total:6,certificateThreshold:2,accrual:"annual"},"Maternity Leave":{total:180,paid:!0,gender:"female"},"Paternity Leave":{total:10,paid:!0,gender:"male",minServiceYears:0},"Study Leave":{total:5,paid:!1,requireApproval:!0},"Compassionate Leave":{total:3,paid:!0}}}async getPolicy(){if(this.cache.policy)return this.cache.policy;try{if(window.AppFirestore){const e=await window.AppFirestore.collection("settings").doc("policies").get();e.exists?this.cache.policy={...this.defaultPolicy,...e.data()}:this.cache.policy=this.defaultPolicy}else this.cache.policy=this.defaultPolicy}catch(e){console.warn("Failed to fetch dynamic policy, using default.",e),this.cache.policy=this.defaultPolicy}return this.cache.policy}async updatePolicy(e){try{if(window.AppFirestore)return await window.AppFirestore.collection("settings").doc("policies").set(e,{merge:!0}),this.cache.policy=null,!0;throw new Error("Database not connected")}catch(t){throw console.error("Failed to update policy:",t),t}}async getFinancialYear(e=new Date){const t=e.getMonth(),a=e.getFullYear();return t<3?{label:`${a-1}-${a}`,start:new Date(a-1,3,1),end:new Date(a,2,31)}:{label:`${a}-${a+1}`,start:new Date(a,3,1),end:new Date(a+1,2,31)}}async getUserLeaves(e,t=null){t||(t=(await this.getFinancialYear()).label);try{if(this.db.queryMany&&U?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES)return(await this.db.queryMany("leaves",[{field:"userId",operator:"==",value:e},{field:"financialYear",operator:"==",value:t}])).sort((s,r)=>new Date(r.startDate)-new Date(s.startDate))}catch(n){console.warn("Scoped getUserLeaves query failed, using fallback",n)}return(await this.db.getAll("leaves")).filter(n=>n.userId===e&&n.financialYear===t).sort((n,s)=>new Date(s.startDate)-new Date(n.startDate))}async getLeaveUsage(e,t,a){return(await this.getUserLeaves(e,a.label)).filter(r=>r.type===t&&(r.status==="Approved"||r.status==="Pending")).reduce((r,d)=>r+(parseFloat(d.daysCount)||0),0)}async getMonthlyShortLeaveUsage(e,t){const a=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}`;let n=[];try{this.db.queryMany&&U?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES&&(n=(await this.db.queryMany("leaves",[{field:"userId",operator:"==",value:e},{field:"type",operator:"==",value:"Short Leave"},{field:"startDate",operator:">=",value:`${a}-01`},{field:"startDate",operator:"<=",value:`${a}-31`}])).filter(r=>r.status==="Approved"||r.status==="Pending"))}catch(s){console.warn("Scoped short leave query failed, using fallback",s)}return n.length||(n=(await this.db.getAll("leaves")).filter(r=>r.userId===e&&r.type==="Short Leave"&&r.startDate.startsWith(a)&&(r.status==="Approved"||r.status==="Pending"))),n.reduce((s,r)=>s+(parseFloat(r.daysCount||r.durationHours)||0),0)}async getPendingLeaves(){try{let e=[];if(this.db.queryMany&&U?.READ_OPT_FLAGS?.FF_READ_OPT_DB_QUERIES?e=(await this.db.queryMany("leaves",[{field:"status",operator:"==",value:"Pending"}],{orderBy:[{field:"appliedOn",direction:"desc"}]})).sort((a,n)=>new Date(n.appliedOn)-new Date(a.appliedOn)):e=(await this.db.getAll("leaves")).filter(a=>a.status==="Pending").sort((a,n)=>new Date(n.appliedOn)-new Date(a.appliedOn)),e.length>0){const t=await this.db.getAll("users"),a={};t.forEach(n=>{a[n.id]=n.name}),e.forEach(n=>{!n.userName&&a[n.userId]&&(n.userName=a[n.userId])})}return e}catch(e){return console.warn("getPendingLeaves failed, using fallback",e),(await this.db.getAll("leaves").catch(()=>[])).filter(a=>a.status==="Pending").sort((a,n)=>new Date(n.appliedOn)-new Date(a.appliedOn))}}async requestLeave(e){const{userId:t,startDate:a,endDate:n,type:s,durationHours:r}=e,d=new Date(a),o=new Date(n);let l=Math.ceil((o-d)/(1e3*60*60*24))+1;if(l<=0&&s!=="Short Leave")throw new Error("Invalid date range");const c=await this.getFinancialYear(d),p=await this.getLeaveUsage(t,s,c),u=(await this.getPolicy())[s],y=[];if(s==="Short Leave"){const h=await this.getMonthlyShortLeaveUsage(t,d);let f=parseFloat(r||0);f>2&&y.push("Short Leave exceeds 2 hours (standard)."),h+f>4&&y.push(`Monthly Short Leave limit exceeded (${h+f}/4 hours).`),e.daysCount=f}else if(s==="Annual Leave")l<(u.minDays||1)&&y.push(`Annual Leave requested is less than required minimum (${u.minDays||1} days).`),p+l>u.total&&y.push(`Annual Leave balance exceeded (${p+l}/${u.total}).`);else if(s==="Casual Leave")l>u.maxDays&&y.push(`Casual Leave exceeds maximum allowed per request (${u.maxDays} days).`),p+l>u.total&&y.push(`Casual Leave balance exceeded (${p+l}/${u.total}).`);else if(s==="Medical Leave")p+l>u.total&&y.push(`Medical Leave balance exceeded (${p+l}/${u.total}).`),l>u.certificateThreshold&&(e.requireCertificate=!0);else if(s==="Paternity Leave"){const h=await this.db.get("users",t),f=new Date(h.joinDate),v=(d-f)/(1e3*60*60*24*365.25);u.minServiceYears&&v<u.minServiceYears&&y.push(`User has not completed ${u.minServiceYears} year(s) of service (required for Paternity Leave).`),l>u.total&&y.push(`Paternity Leave exceeds limit of ${u.total} days.`)}else["Study Leave","Compassionate Leave"].includes(s)&&u&&l>u.total&&y.push(`${s} exceeds limit of ${u.total} days.`);const g={id:"l"+Date.now(),...e,status:"Pending",appliedOn:new Date().toISOString(),financialYear:c.label,daysCount:l,policyWarnings:y};return await this.db.add("leaves",g),g}async updateLeaveStatus(e,t,a,n=""){const s=await this.db.get("leaves",e);if(!s)throw new Error("Leave not found");if(s.status=t,s.actionBy=a,s.actionDate=new Date().toISOString(),s.adminComment=n,await this.db.put("leaves",s),t==="Approved"){const r=new Date(s.startDate),d=new Date(s.endDate);let o=new Date(r);for(;o<=d;){const l=o.toISOString().split("T")[0],c={id:"att_"+s.userId+"_"+l,user_id:s.userId,date:l,checkIn:"09:00",checkOut:"17:00",duration:"8h 0m",location:"On Leave",type:s.type,status:"in",synced:!1};await this.db.put("attendance",c),o.setDate(o.getDate()+1)}}return s}}const me=new Ea;typeof window<"u"&&(window.AppLeaves=me);class Ca{constructor(){this.db=R,this.cleanupFlag="legacy_dummy_cleanup_v1",this.simulationFlag="simulation_run_v2"}async run(){const e=U&&U.READ_OPT_FLAGS||{},t=typeof window<"u"&&window.location&&window.location.hostname?window.location.hostname:"",a=t==="localhost"||t==="127.0.0.1";if(!(!e.ENABLE_SIMULATION_MODULE&&!a)){if(localStorage.getItem(this.cleanupFlag)||(await this.cleanupLegacyDummyData(),localStorage.setItem(this.cleanupFlag,"true")),localStorage.getItem(this.simulationFlag)){console.log("Simulation already ran. Use window.AppSimulation.forceRun() to force.");return}await this.forceRun(),localStorage.setItem(this.simulationFlag,"true")}}async cleanupLegacyDummyData(){const e=new Set(["sim_punctual","sim_admin_new"]),t=new Set(["jomit_p","maria"]);try{const n=(await this.db.getAll("users")).filter(l=>e.has(l.id)||t.has((l.username||"").trim().toLowerCase())),s=new Set(n.map(l=>l.id));if(s.size===0)return;const r=await this.db.getAll("attendance");for(const l of r){const c=l.user_id||l.userId;s.has(c)&&await this.db.delete("attendance",l.id)}const d=await this.db.getAll("leaves");for(const l of d){const c=l.userId||l.user_id;s.has(c)&&await this.db.delete("leaves",l.id)}const o=await this.db.getAll("work_plans");for(const l of o){const c=l.userId||l.user_id;s.has(c)&&await this.db.delete("work_plans",l.id)}for(const l of n)await this.db.delete("users",l.id);console.log("Legacy dummy users and linked records removed.")}catch(a){console.warn("Legacy dummy cleanup failed:",a)}}async forceRun(){console.log("Starting Office Scenario Simulation (V2)...");const e=new Date;if(window.AppCalendar){const t=new Date(e);t.setDate(t.getDate()+1),await window.AppCalendar.addEvent({title:"Office Picnic/Holiday",date:t.toISOString().split("T")[0],type:"holiday"})}console.log("Simulation Complete.")}}const Dt=new Ca;typeof window<"u"&&(window.AppSimulation=Dt,setTimeout(()=>Dt.run(),2e3));const ae="minutes";async function Pa(i={}){try{const e=i.limit||150;return window.AppDB?await window.AppDB.getAll(ae):(await window.AppFirestore.collection(ae).orderBy("date","desc").limit(e).get()).docs.map(a=>({id:a.id,...a.data()}))}catch(e){throw console.error("Error fetching minutes:",e),e}}async function Na(i){try{const e=window.AppAuth.getUser(),t={...i,createdBy:e.id,createdByName:e.name||e.username,createdAt:new Date().toISOString(),auditLog:[{userId:e.id,userName:e.name||e.username,timestamp:new Date().toISOString(),action:"Created meeting minutes"}],approvals:{},locked:!1,restrictedFrom:[],allowedViewers:[],accessRequests:[]};return window.AppDB?await window.AppDB.add(ae,t):(await window.AppFirestore.collection(ae).add(t)).id}catch(e){throw console.error("Error adding minute:",e),e}}async function Pe(i,e,t){try{const a=window.AppAuth.getUser(),n=await(window.AppDB?window.AppDB.get(ae,i):window.AppFirestore.collection(ae).doc(i).get().then(d=>d.data()));if(!n)throw new Error("Minute not found");if(n.locked&&!t?.includes("Action Items"))throw new Error("This record is locked.");const s={userId:a.id,userName:a.name||a.username,timestamp:new Date().toISOString(),action:t||"Updated minutes"},r={...n,...e,id:i,auditLog:[...n.auditLog||[],s]};return window.AppDB?await window.AppDB.put(ae,r):await window.AppFirestore.collection(ae).doc(i).update(r),!0}catch(a){throw console.error("Error updating minute:",a),a}}async function Ba(i){try{const e=window.AppAuth.getUser(),t=await(window.AppDB?window.AppDB.get(ae,i):window.AppFirestore.collection(ae).doc(i).get().then(n=>n.data()));if(!t)throw new Error("Minute not found");const a=t.accessRequests||[];return a.some(n=>n.userId===e.id)?!0:(a.push({userId:e.id,userName:e.name||e.username,status:"pending",requestedAt:new Date().toISOString()}),await Pe(i,{accessRequests:a},`Requested access for ${e.name}`))}catch(e){throw console.error("Error requesting access:",e),e}}async function Ua(i,e,t){try{const a=await(window.AppDB?window.AppDB.get(ae,i):window.AppFirestore.collection(ae).doc(i).get().then(d=>d.data()));if(!a)throw new Error("Minute not found");const n=a.accessRequests||[],s=n.find(d=>d.userId===e);if(!s)return;s.status=t;const r=a.allowedViewers||[];return t==="approved"&&!r.includes(e)&&r.push(e),await Pe(i,{accessRequests:n,allowedViewers:r},`${t.toUpperCase()} access request for userId: ${e}`)}catch(a){throw console.error("Error handling access request:",a),a}}async function Oa(i,e,t){try{const a=await(window.AppDB?window.AppDB.get(ae,i):window.AppFirestore.collection(ae).doc(i).get().then(s=>s.data()));if(!a||!a.actionItems)throw new Error("Minute or tasks not found");const n=a.actionItems[e];if(!n)throw new Error("Task not found");return n.status=t,t==="completed"&&(n.completedAt=new Date().toISOString()),await Pe(i,{actionItems:a.actionItems},`Updated Task: ${n.task} to ${t}`)}catch(a){throw console.error("Error updating action item:",a),a}}async function Ra(i){try{const e=window.AppAuth.getUser(),t=await(window.AppDB?window.AppDB.get(ae,i):window.AppFirestore.collection(ae).doc(i).get().then(d=>d.data()));if(!t)throw new Error("Minute not found");const a=t.approvals||{};a[e.id]=new Date().toISOString();const n=t.attendeeIds||[],s=n.length>0&&n.every(d=>a[d]),r={approvals:a};return s&&(r.locked=!0),await Pe(i,r,`${s?"FINAL APPROVAL & LOCK":"Signed"} by ${e.name}`)}catch(e){throw console.error("Error approving minute:",e),e}}async function Ha(i){try{return window.AppDB?await window.AppDB.delete(ae,i):(await window.AppFirestore.collection(ae).doc(i).delete(),!0)}catch(e){throw console.error("Error deleting minute:",e),e}}const Fa={getMinutes:Pa,addMinute:Na,updateMinute:Pe,approveMinute:Ra,deleteMinute:Ha,requestAccess:Ba,handleAccessRequest:Ua,updateActionItemStatus:Oa};typeof window<"u"&&(window.AppMinutes=Fa);const ht={async renderPolicyEditor(){const i=await me.getPolicy();return`
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
                            ${Object.keys(i).map(e=>{const t=i[e];return`
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
        `},setupGlobalHandlers(){window.app_savePolicyChanges=async i=>{i.preventDefault();const e=new FormData(i.target),t=await me.getPolicy(),a={};Object.keys(t).forEach(n=>{a[n]={...t[n]};const s=l=>{const c=e.get(l);return c!==""&&c!==null?parseInt(c):void 0},r=s(`${n}_total`);r!==void 0&&(a[n].total=r);const d=s(`${n}_min`);d!==void 0?a[n].minDays=d:delete a[n].minDays;const o=s(`${n}_max`);o!==void 0?a[n].maxDays=o:delete a[n].maxDays});try{await me.updatePolicy(a);const n=i.target.querySelector("button"),s=n.innerHTML;n.innerHTML='<i class="fa-solid fa-check"></i> Saved!',n.style.background="#166534",setTimeout(()=>{n.innerHTML=s,n.style.background="",window.location.reload()},1e3)}catch(n){alert("Failed to update policy: "+n.message)}},window.app_approveLeaveWithWarning=async i=>{const e=await window.appPrompt("Reason for override:","",{title:"Leave Override",confirmText:"Approve With Reason",placeholder:"Enter reason"});if(e)try{await me.updateLeaveStatus(i,"Approved",J.getUser().id,`[Overridden] ${e}`),window.location.reload()}catch(t){alert(t.message)}}}};ht.setupGlobalHandlers();typeof window<"u"&&(window.AppAdminPolicies=ht);const qa={currentYear:new Date().getFullYear(),holidayCache:null,baseline2025:[{name:"Republic Day",date:"2025-01-26",type:"National"},{name:"Maha Shivaratri",date:"2025-02-26",type:"Regional"},{name:"Holi",date:"2025-03-14",type:"Regional"},{name:"Id-ul-Fitr",date:"2025-03-31",type:"Regional"},{name:"Good Friday",date:"2025-04-18",type:"Regional"},{name:"Independence Day",date:"2025-08-15",type:"National"},{name:"Dussehra",date:"2025-10-02",type:"Regional"},{name:"Gandhi Jayanti",date:"2025-10-02",type:"National"},{name:"Diwali",date:"2025-10-20",type:"Regional"},{name:"Christmas",date:"2025-12-25",type:"Regional"}],async render(){const i=await me.getPolicy(),e=J.getUser(),t=await me.getFinancialYear();window.app_hasPerm("policies","view",e);const a=window.app_hasPerm("policies","admin",e);let n=0;try{const o=new Date,l=o.getDay(),c=o.getDate()-l+(l===0?-6:1),p=new Date(o.setDate(c));p.setHours(0,0,0,0);const m=p.toISOString().split("T")[0];n=(await R.getAll("attendance")).filter(g=>g.user_id===e.id&&g.date>=m).filter(g=>g.checkIn?g.lateCountable===!0?!0:Pt.normalizeType(g.type)==="Late":!1).length}catch(o){console.warn("Error calc lates",o)}const s=Object.keys(i).map(async o=>{const l=await me.getLeaveUsage(e.id,o,t);return{type:o,usage:l,total:i[o].total,icon:this.getIconForType(o),color:this.getColorForType(o)}}),r=await Promise.all(s),d=await this.renderHolidayTable(this.currentYear,a);return`
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
                                <div class="policies-late-value">${n} <span>(${Math.floor(n/3)} block(s) reached)</span></div>
                            </div>
                        </div>

                        <div class="policies-leave-grid">
                            ${r.map(o=>this.renderLeaveCard(o.type,o,o.icon,o.color)).join("")}
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
                            ${d}
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

                ${a?await ht.renderPolicyEditor():""}
            </div>
            `},async loadHolidaySettings(){if(this.holidayCache)return this.holidayCache;const i=await R.get("settings","holidays").catch(()=>null),e=i&&i.byYear?i:{id:"holidays",byYear:{}};return this.holidayCache=e,e},async saveHolidaySettings(i){const e={id:"holidays",byYear:i.byYear||{}};await R.put("settings",e),this.holidayCache=e},buildYearFromBaseline(i){return this.baseline2025.map(e=>{const t=String(e.date).slice(5);return{name:e.name,date:`${i}-${t}`,type:e.type||"Regional"}}).sort((e,t)=>new Date(e.date)-new Date(t.date))},async getHolidaysForYear(i,e=!0){const t=await this.loadHolidaySettings(),a=String(i);return(!Array.isArray(t.byYear[a])||t.byYear[a].length===0)&&(t.byYear[a]=this.buildYearFromBaseline(i),e&&await this.saveHolidaySettings(t)),[...t.byYear[a]].sort((n,s)=>new Date(n.date)-new Date(s.date))},async renderHolidayTable(i,e){const t=await this.getHolidaysForYear(i);return`
                <table class="compact-table">
                    <thead>
                        <tr>
                            <th>Occasion</th>
                            <th>Date</th>
                            ${e?'<th class="text-right">Actions</th>':""}
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderHolidayRows(i,t,e)}
                    </tbody>
                </table>
            `},renderHolidayRows(i,e,t){return e.length?e.map((a,n)=>{const r=new Date(a.date).toLocaleDateString("en-US",{month:"short",day:"numeric"});return`
                <tr>
                    <td>
                        <div class="policies-holiday-name">${a.name}</div>
                        ${a.type==="National"?'<span class="policies-holiday-chip">Compulsory</span>':""}
                    </td>
                    <td class="policies-holiday-date">${r}</td>
                    ${t?`
                        <td class="text-right">
                            <button class="icon-btn" title="Edit" onclick="window.AppPolicies.openHolidayEditor(${n})"><i class="fa-solid fa-pen"></i></button>
                            <button class="icon-btn" title="Delete" onclick="window.AppPolicies.deleteHoliday(${n})"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    `:""}
                </tr>
            `}).join(""):`<tr><td colspan="${t?3:2}" class="policies-empty-holiday">No holiday data available for ${i}</td></tr>`},async changeYear(i){this.currentYear+=i;const e=document.getElementById("policy-year-label"),t=document.getElementById("holidays-container"),a=J.getUser(),n=window.app_hasPerm("policies","admin",a);e&&t&&(e.textContent=this.currentYear,t.innerHTML=await this.renderHolidayTable(this.currentYear,n))},async openHolidayEditor(i=null){const e=J.getUser();if(!e||!window.app_hasPerm("policies","admin",e))return;const t=this.currentYear,a=await this.getHolidaysForYear(t),n=Number.isInteger(i)?a[i]:null,s=`holiday-editor-${Date.now()}`,r=`
                <div class="modal-overlay" id="${s}" style="display:flex;">
                    <div class="modal-content" style="max-width:460px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.65rem;">
                            <h3 style="margin:0;">${n?"Edit Holiday":"Add Holiday"} (${t})</h3>
                            <button type="button" class="app-system-dialog-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                        </div>
                        <form onsubmit="window.AppPolicies.saveHoliday(event, ${Number.isInteger(i)?i:"null"})">
                            <div style="display:grid; gap:0.55rem;">
                                <div>
                                    <label>Holiday Name</label>
                                    <input id="holiday-name-input" type="text" required value="${n?String(n.name||"").replace(/"/g,"&quot;"):""}">
                                </div>
                                <div>
                                    <label>Date</label>
                                    <input id="holiday-date-input" type="date" required value="${n?n.date:`${t}-01-01`}">
                                </div>
                                <div>
                                    <label>Type</label>
                                    <select id="holiday-type-input">
                                        <option value="National" ${n&&n.type==="National"?"selected":""}>National</option>
                                        <option value="Regional" ${!n||n.type!=="National"?"selected":""}>Regional</option>
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
            `;typeof window.app_showModal=="function"?window.app_showModal(r,s):(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",r)},async saveHoliday(i,e=null){i.preventDefault();const t=this.currentYear,a=(document.getElementById("holiday-name-input")?.value||"").trim(),n=(document.getElementById("holiday-date-input")?.value||"").trim(),s=(document.getElementById("holiday-type-input")?.value||"Regional").trim();if(!a||!n){alert("Please provide holiday name and date.");return}if(!n.startsWith(`${t}-`)){alert(`Date must be within ${t}.`);return}const r=await this.loadHolidaySettings(),d=String(t),o=Array.isArray(r.byYear[d])?[...r.byYear[d]]:this.buildYearFromBaseline(t),l={name:a,date:n,type:s==="National"?"National":"Regional"};Number.isInteger(e)&&o[e]?o[e]=l:o.push(l),r.byYear[d]=o.sort((c,p)=>new Date(c.date)-new Date(p.date)),await this.saveHolidaySettings(r),document.querySelector('.modal-overlay[id^="holiday-editor-"]')?.remove(),await this.changeYear(0)},async deleteHoliday(i){const e=J.getUser();if(!e||!window.app_hasPerm("policies","admin",e)||!await window.appConfirm("Delete this holiday from current year?"))return;const a=this.currentYear,n=await this.loadHolidaySettings(),s=String(a),r=Array.isArray(n.byYear[s])?[...n.byYear[s]]:[];r[i]&&(r.splice(i,1),n.byYear[s]=r,await this.saveHolidaySettings(n),await this.changeYear(0))},getIconForType(i){return{"Annual Leave":"calendar-check","Casual Leave":"mug-hot","Medical Leave":"staff-snake","Maternity Leave":"baby-carriage","Paternity Leave":"baby","Study Leave":"graduation-cap","Compassionate Leave":"hand-holding-heart","Short Leave":"clock"}[i]||"file-circle-check"},getColorForType(i){return{"Annual Leave":"#0f766e","Casual Leave":"#ea580c","Medical Leave":"#dc2626","Maternity Leave":"#be185d","Paternity Leave":"#1d4ed8","Study Leave":"#6d28d9","Compassionate Leave":"#9333ea","Short Leave":"#475569"}[i]||"#64748b"},renderLeaveCard(i,e,t,a){const n=Math.min(100,e.usage/e.total*100);return`
            <div class="policies-leave-item">
                <div class="policies-leave-bg-icon" style="color:${a};"><i class="fa-solid fa-${t}"></i></div>
                <h4>${i}</h4>
                <div class="policies-leave-count">
                    <span>${e.total-e.usage}</span>
                    <small>/ ${e.total}</small>
                </div>
                <div class="policies-leave-bar"><div style="width:${n}%; background:${a};"></div></div>
                <div class="policies-leave-used">${e.usage} used</div>
            </div>
            `}};typeof window<"u"&&(window.AppPolicies=qa);function O(i,e={}){const t=document.createElement(i);if(e.id&&(t.id=e.id),e.className&&(t.className=e.className),e.textContent&&(t.textContent=e.textContent),e.innerHTML&&(t.innerHTML=e.innerHTML),e.attributes)for(const[a,n]of Object.entries(e.attributes))t.setAttribute(a,n);if(e.children)for(const a of e.children)t.appendChild(a);return t}function re(i={}){const e=O("button",{className:i.className,textContent:i.textContent,innerHTML:i.innerHTML,attributes:{type:"button",...i.attributes}});return i.onClick&&e.addEventListener("click",i.onClick),e}const fe=i=>String(i??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");function ja(i,e){const{offsetLeft:t,offsetTop:a}=i,n=document.createElement("div"),s=window.getComputedStyle(i);for(const p of s)n.style[p]=s[p];n.style.position="absolute",n.style.visibility="hidden",n.style.whiteSpace="pre-wrap",n.style.width=s.width,n.style.height="auto";const r=i.value.substring(0,e);n.textContent=r;const d=document.createElement("span");d.textContent=i.value.substring(e)||".",n.appendChild(d),document.body.appendChild(n);const{offsetLeft:o,offsetTop:l}=d,c=i.getBoundingClientRect();return document.body.removeChild(n),{top:c.top+l-i.scrollTop,left:c.left+o-i.scrollLeft}}function za(i,e,t){let a=document.getElementById("mention-dropdown");a?a.parentElement!==document.body&&document.body.appendChild(a):(a=O("div",{id:"mention-dropdown",className:"mention-dropdown"}),document.body.appendChild(a));let n=0,s=[],r=-1;const d=()=>{a.style.display="none",r=-1},o=()=>{if(s.length===0)return d();a.innerHTML="",s.forEach((p,m)=>{const u=O("div",{className:`mention-item ${m===n?"active":""}`,innerHTML:`
                    <img src="${p.avatar||"https://via.placeholder.com/32"}" class="mention-item-avatar">
                    <span class="mention-item-name">${p.name}</span>
                    <span class="mention-item-role">${p.role||"Staff"}</span>
                `});u.addEventListener("click",()=>l(p)),a.appendChild(u)});const c=ja(i,r);a.style.top=`${c.top+24}px`,a.style.left=`${c.left}px`,a.style.display="block"},l=c=>{const p=i.value,m=p.substring(0,r),u=p.substring(i.selectionStart);i.value=`${m}@${c.name} ${u}`,i.focus(),d(),t&&t()};i.addEventListener("input",()=>{const c=i.value,p=i.selectionStart,m=c.lastIndexOf("@",p-1);if(m!==-1&&(m===0||/\s/.test(c[m-1]))){const u=c.substring(m+1,p).toLowerCase();if(!/\s/.test(u)){r=m,s=e.filter(y=>y.name.toLowerCase().includes(u)).slice(0,8),n=0,o();return}}d(),t&&t()}),i.addEventListener("keydown",c=>{a.style.display==="block"&&(c.key==="ArrowDown"?(c.preventDefault(),n=(n+1)%s.length,o()):c.key==="ArrowUp"?(c.preventDefault(),n=(n-1+s.length)%s.length,o()):c.key==="Enter"||c.key==="Tab"?(c.preventDefault(),l(s[n])):c.key==="Escape"&&d())}),document.addEventListener("click",c=>{!a.contains(c.target)&&c.target!==i&&d()})}function Wa(i,e,t,a,n){const s=O("h3",{textContent:"Plan Your Day"}),r=O("p",{className:"day-plan-subline",textContent:`${i}${e?` - Editing for ${t}`:""}`}),d=a?re({className:"day-plan-delete-btn",attributes:{title:"Delete plan"},innerHTML:'<i class="fa-solid fa-trash"></i>',onClick:()=>window.app_deleteDayPlan(i,n)}):null,o=re({className:"day-plan-close-btn",attributes:{title:"Close"},innerHTML:'<i class="fa-solid fa-xmark"></i>',onClick:c=>c.currentTarget.closest(".day-plan-modal-overlay").remove()}),l=O("div",{className:"day-plan-header-actions",children:[d,o].filter(Boolean)});return O("div",{className:"day-plan-header",children:[O("div",{className:"day-plan-headline",children:[s,r]}),l]})}function Ya(i,e,t,a,n,s,r,d,o,l){const c=O("div",{className:"day-plan-scroll-area personal-plans-container",attributes:{"data-scope":"personal"}}),p=O("div",{className:"day-plan-scroll-area others-plans-container",attributes:{"data-scope":"annual"}});n.forEach((f,v)=>{const b=Me({plan:f,idx:v,allUsers:s,targetId:e,defaultScope:r,selectableCollaborators:d,isAdmin:o,currentUserId:l.id,isReference:f.isReference});(f.planScope||f._planScope||r)==="annual"||f.isReference?p.appendChild(b):c.appendChild(b)});const m=O("div",{className:"day-plan-columns",children:[O("div",{className:"day-plan-column",children:[O("div",{className:"day-plan-column-head",children:[O("h4",{className:"day-plan-column-title",textContent:"Self Plan"}),re({className:"btn-premium-add",innerHTML:'<i class="fa-solid fa-plus-circle"></i> <span>Add Personal Plan (@)</span>',onClick:()=>_e({date:i,targetId:e,scope:"personal",allUsers:s,selectableCollaborators:d,isAdmin:o,container:c})})]}),c]}),O("div",{className:"day-plan-column",children:[O("div",{className:"day-plan-column-head",children:[O("h4",{className:"day-plan-column-title",textContent:"Others' & Annual Plans"}),re({className:"btn-premium-add",innerHTML:'<i class="fa-solid fa-plus-circle"></i> <span>Add Annual Plan (@)</span>',onClick:()=>_e({date:i,targetId:e,scope:"annual",allUsers:s,selectableCollaborators:d,isAdmin:o,container:p})})]}),p]})]}),u=re({className:"day-plan-discard-btn",textContent:"Discard",onClick:f=>f.currentTarget.closest(".day-plan-modal-overlay").remove()}),y=re({className:"day-plan-save-btn",innerHTML:'<i class="fa-solid fa-check-circle"></i> <span>Save Plan</span>',attributes:{type:"submit"}}),g=O("div",{className:"day-plan-footer",children:[O("div",{className:"day-plan-actions",children:[u,y]})]}),h=O("form",{className:"day-plan-form",attributes:{"data-had-personal":t?"1":"0","data-had-annual":a?"1":"0"},children:[m,g]});return h.addEventListener("submit",f=>window.app_saveDayPlan(f,i,e)),h}function _e(i){const{date:e,targetId:t,scope:a,allUsers:n,selectableCollaborators:s,isAdmin:r,container:d,existingBlock:o=null}=i,l=J.getUser(),c=o?window.app_extractBlockData(o):{task:"",subPlans:[],tags:[],status:null,assignedTo:t,startDate:e,endDate:e,planScope:a},p=O("div",{className:"plan-editor-overlay"}),m=O("div",{className:"plan-editor-modal"}),u=O("div",{className:"plan-editor-head",innerHTML:`<h4>${o?"Edit":"Add"} ${a==="annual"?"Annual":"Personal"} Plan <small style="font-weight:400; opacity:0.7; font-size:0.8em; margin-left:5px;">(Use @ to tag)</small></h4>`}),y=O("div",{className:"plan-editor-body"}),g=O("textarea",{className:"plan-editor-textarea",textContent:c.task,attributes:{placeholder:"What is the objective or task for today? Use @ to tag colleagues.",required:!0}}),h=O("div",{className:"plan-editor-tags-container",attributes:{style:"display: none;"}}),f=()=>{const L=g.value,T=[];if(n.forEach(B=>{const E=`@${B.name}`;L.includes(E)&&!T.find(S=>S.id===B.id)&&T.push(B)}),T.length>0){h.style.display="block",h.innerHTML='<label class="plan-editor-tags-label">Tagged Collaborators:</label>';const B=O("div",{className:"plan-editor-tags-wrapper"});T.forEach(E=>{const S=O("span",{className:"day-plan-tag-pill",textContent:`@${E.name}`});B.appendChild(S)}),h.appendChild(B)}else h.style.display="none",h.innerHTML=""},v=O("div",{className:"plan-editor-grid"}),b=O("div",{className:"plan-editor-field"});b.innerHTML="<label>Status</label>";const k=O("select",{className:"plan-editor-select"});k.innerHTML=`
        <option value="" ${c.status?"":"selected"}>Auto-Track</option>
        <option value="completed" ${c.status==="completed"?"selected":""}>Completed</option>
        <option value="in-process" ${c.status==="in-process"?"selected":""}>In Progress</option>
        <option value="not-completed" ${c.status==="not-completed"?"selected":""}>Not Completing</option>
    `,b.appendChild(k);let w=null;if(r){const L=O("div",{className:"plan-editor-field"});L.innerHTML="<label>Assign To</label>",w=O("select",{className:"plan-editor-select"}),n.forEach(T=>{const B=O("option",{textContent:T.name,attributes:{value:T.id,selected:T.id===c.assignedTo}});w.appendChild(B)}),L.appendChild(w),v.appendChild(L)}y.appendChild(g),y.appendChild(h),y.appendChild(v);const A=O("div",{className:"plan-editor-footer"}),$=re({className:"day-plan-discard-btn",textContent:"Cancel",onClick:()=>p.remove()}),I=re({className:"day-plan-save-btn",textContent:o?"Update":"Add to List",onClick:()=>{const L=g.value.trim();if(!L)return alert("Please enter a task description");const T=[];n.forEach(S=>{L.includes(`@${S.name}`)&&!T.find(_=>_.id===S.id)&&T.push({id:S.id,name:S.name,status:"pending"})});const E={plan:{...c,task:L,status:k.value,assignedTo:w?w.value:c.assignedTo||t,tags:T.length>0?T:c.tags||[]},allUsers:n,targetId:t,selectableCollaborators:s,isAdmin:r,currentUserId:l.id};if(o){const S=Me({...E,idx:Number.parseInt(o.getAttribute("data-index"))});o.replaceWith(S)}else{const S=Me({...E,idx:d.querySelectorAll(".plan-block").length});d.appendChild(S)}p.remove()}});A.appendChild($),A.appendChild(I),m.appendChild(u),m.appendChild(y),m.appendChild(A),p.appendChild(m),document.getElementById("modal-container").appendChild(p),g.focus(),za(g,n,f),f()}function Me(i){const{plan:e={},idx:t=0,allUsers:a=[],targetId:n,defaultScope:s="personal",selectableCollaborators:r=[],isAdmin:d=!1,currentUserId:o="",isReference:l=!1}=i||{},c=String(e.task||""),p=e.assignedTo||n||o,m=e.startDate||"",u=e.endDate||"",y=String(e.planScope||e._planScope||s)==="annual"?"annual":"personal",g=l?e.userName?`${e.userName}'s Plan`:"Others Plan":y==="annual"?"Annual Plan":"Personal Plan",h=c.trim()?c.trim().length>120?`${c.trim().slice(0,120)}...`:c.trim():"New task",f=O("div",{className:(l?"plan-block-ref":"plan-block")+(l?" is-reference-only":""),attributes:{"data-index":t}}),v=O("div",{className:"dp-hidden-data",attributes:{style:"display:none;"}});v.innerHTML=`
        <textarea class="plan-task">${fe(c)}</textarea>
        <select class="plan-status"><option value="${fe(e.status||"")}" selected></option></select>
        <select class="plan-scope"><option value="${fe(y)}" selected></option></select>
        <select class="plan-assignee"><option value="${fe(p)}" selected></option></select>
        <input class="plan-start-date" value="${fe(m)}">
        <input class="plan-end-date" value="${fe(u)}">
    `,e.subPlans&&e.subPlans.forEach(A=>{const $=O("input",{className:"sub-plan-input",attributes:{value:fe(A)}});v.appendChild($)}),e.tags&&e.tags.forEach(A=>{const $=O("div",{className:"tag-chip",attributes:{"data-id":A.id,"data-name":A.name,"data-status":A.status||"pending"}});v.appendChild($)}),f.appendChild(v);const b=O("div",{className:"plan-block-header"}),k=O("div",{className:"plan-block-title-group"});k.appendChild(O("span",{className:"day-plan-index-badge",textContent:t+1})),k.appendChild(O("span",{className:"plan-block-summary",textContent:h}));const w=O("div",{className:"plan-block-actions"});if(w.appendChild(O("span",{className:"day-plan-scope-pill",textContent:g})),l||(w.appendChild(re({className:"day-plan-edit-btn",attributes:{title:"Edit plan"},innerHTML:'<i class="fa-solid fa-pen-to-square"></i>',onClick:()=>_e({date:m,targetId:n,scope:y,allUsers:a,selectableCollaborators:r,isAdmin:d,container:f.parentElement,existingBlock:f})})),t>0&&w.appendChild(re({className:"day-plan-remove-btn",attributes:{title:"Remove task"},innerHTML:'<i class="fa-solid fa-trash-can"></i>',onClick:()=>f.remove()}))),b.appendChild(k),b.appendChild(w),f.appendChild(b),e.tags&&e.tags.length>0){const A=O("div",{className:"plan-block-body"});e.tags.forEach($=>{const I=O("span",{className:"day-plan-tag-pill",textContent:`@${$.name}`});A.appendChild(I)}),f.appendChild(A)}return f}function zt(i){if(!i)return null;const e=i.querySelector(".plan-task")?.value||"",t=i.querySelector(".plan-status")?.value||"",a=i.querySelector(".plan-scope")?.value||"personal",n=i.querySelector(".plan-assignee")?.value||"",s=i.querySelector(".plan-start-date")?.value||"",r=i.querySelector(".plan-end-date")?.value||"",d=Array.from(i.querySelectorAll(".sub-plan-input")).map(l=>l.value),o=Array.from(i.querySelectorAll(".tag-chip")).map(l=>({id:l.dataset.id,name:l.dataset.name,status:l.dataset.status}));return{task:e,status:t,planScope:a,assignedTo:n,startDate:s,endDate:r,subPlans:d,tags:o}}async function Wt(i,e=null,t=null){const a=J.getUser(),n=String(e??"").trim(),s=!n||n==="undefined"||n==="null"?a.id:n,r=await R.getAll("users"),d=a.role==="Administrator"||a.isAdmin,o=s!==a.id,l=t==="annual"?"annual":"personal";window.app_currentDayPlanTargetId=s;const[c,p,m]=await Promise.all([De.getWorkPlan(s,i,{planScope:"personal"}),De.getWorkPlan(s,i,{planScope:"annual"}),R.queryMany("work_plans",[{field:"date",operator:"==",value:i}])]),u=!!(c||p),y=r.find(T=>T.id===s),g=y?y.name:"Staff",h=r.filter(T=>T.id!==s),f=(T,B,E=null)=>T?Array.isArray(T.plans)&&T.plans.length>0?T.plans.map(S=>({...S,planScope:B,userName:E||T.userName,isReference:!!E})):T.plan?[{task:T.plan,subPlans:T.subPlans||[],tags:[],status:null,assignedTo:T.userId==="annual_shared"?null:T.userId,startDate:i,endDate:i,planScope:B,userName:E||T.userName,isReference:!!E}]:[]:[],v=(m||[]).filter(T=>T.id!==De.getWorkPlanId(i,s,"personal")&&T.id!==De.getWorkPlanId(i,s,"annual")),b=[];v.forEach(T=>{b.push(...f(T,T.planScope,T.userName))});const k=[...f(c,"personal"),...f(p,"annual"),...b];k.length===0&&k.push({task:"",subPlans:[],tags:[],status:null,assignedTo:s,startDate:i,endDate:i,planScope:l});const w=O("div",{id:"day-plan-modal",className:"day-plan-modal-overlay"}),A=O("div",{className:"day-plan-content"});A.appendChild(Wa(i,o,g,u,s)),A.appendChild(Ya(i,s,c,p,k,r,l,h,d,a)),w.appendChild(A);const $=document.getElementById("modal-container");if(!$)return;const I=document.getElementById("day-plan-modal");I&&I.remove(),$.appendChild(w);const L=document.getElementById("day-plan-modal");if(L){const B=Array.from(document.querySelectorAll(".modal-overlay, .modal")).filter(E=>E!==L).reduce((E,S)=>{const _=Number.parseInt(window.getComputedStyle(S).zIndex,10);return Number.isFinite(_)?Math.max(E,_):E},1e3);L.style.zIndex=String(B+2)}}async function Yt(i=null){const e=document.getElementById("day-plan-modal");if(!e)return;const t=i||"personal",a=t==="annual"?e.querySelector(".others-plans-container"):e.querySelector(".personal-plans-container"),n=e.querySelector(".day-plan-headline p")?.textContent?.match(/\d{4}-\d{2}-\d{2}/),s=n?n[0]:new Date().toISOString().split("T")[0],r=await R.getAll("users"),d=J.getUser(),o=window.app_currentDayPlanTargetId||d.id,l=d.role==="Administrator"||d.isAdmin,c=r.filter(p=>p.id!==o);_e({date:s,targetId:o,scope:t,allUsers:r,selectableCollaborators:c,isAdmin:l,container:a})}const Ka={openDayPlan:Wt,dayPlanRenderBlockV3:Me,addPlanBlockUI:Yt,openPlanEditor:_e,app_extractBlockData:zt};window.AppDayPlan=Ka;window.app_openDayPlan=Wt;window.app_dayPlanRenderBlockV3=Me;window.app_addPlanBlockUI=Yt;window.app_extractBlockData=zt;const $t={isWidgetMode:!1,syncInterval:null,init(){console.log("Widget Module Initialized"),new URLSearchParams(window.location.search).get("mode")==="widget"&&(this.isWidgetMode=!0),this.isWidgetMode&&this.enableWidgetMode()},toggle(){if(this.isWidgetMode)this.isWidgetMode=!1,window.opener||window.name==="CRWIWidget"?window.close():this.disableWidgetMode();else{const t=window.screen.width-320-20;window.open(window.location.origin+window.location.pathname+"?mode=widget#dashboard","CRWIWidget",`width=320,height=420,left=${t},top=40,menubar=no,toolbar=no,location=no,status=no,resizable=yes`)}},enableWidgetMode(){document.body.classList.add("widget-mode"),this.renderWidgetView(),this.startSync(),window.resizeTo&&window.resizeTo(320,420)},disableWidgetMode(){document.body.classList.remove("widget-mode");const i=document.getElementById("widget-view");i&&i.remove(),this.stopSync()},startSync(){this.syncInterval&&clearInterval(this.syncInterval),this.syncInterval=setInterval(()=>this.sync(),500)},stopSync(){this.syncInterval&&clearInterval(this.syncInterval)},sync(){if(!this.isWidgetMode)return;const i=document.getElementById("timer-display"),e=document.getElementById("timer-label"),t=document.querySelector(".check-in-widget .status-dot")||document.querySelector('.check-in-widget [style*="background: #10b981"]')||document.querySelector('.check-in-widget [style*="background: #94a3b8"]'),a=document.getElementById("attendance-btn"),n=document.getElementById("location-text"),s=document.getElementById("countdown-container"),r=document.getElementById("countdown-label"),d=document.getElementById("countdown-value"),o=document.getElementById("countdown-progress"),l=document.getElementById("overtime-container"),c=document.getElementById("overtime-value"),p=document.getElementById("widget-view");if(!p)return;const m=p.querySelector("#timer-display"),u=p.querySelector("#timer-label"),y=p.querySelector(".status-dot-indicator"),g=p.querySelector("#attendance-btn"),h=p.querySelector("#location-text"),f=p.querySelector("#countdown-container"),v=p.querySelector("#countdown-label"),b=p.querySelector("#countdown-value"),k=p.querySelector("#countdown-progress"),w=p.querySelector("#overtime-container"),A=p.querySelector("#overtime-value");i&&m&&(m.innerHTML=i.innerHTML,m.style.color=i.style.color),e&&u&&(u.innerHTML=e.innerHTML),t&&y&&(y.style.background=t.style.background||(t.classList.contains("online")?"#10b981":"#94a3b8")),s&&f&&(f.style.display=s.style.display,r&&v&&(v.innerHTML=r.innerHTML),d&&b&&(b.innerHTML=d.innerHTML),o&&k&&(k.style.width=o.style.width)),l&&w&&(w.style.display=l.style.display,c&&A&&(A.innerHTML=c.innerHTML)),a&&g&&(g.innerHTML=a.innerHTML,g.className=a.className,g.disabled=a.disabled),n&&h&&(h.innerHTML=n.innerHTML)},handleWidgetAction(){if(window.opener&&!window.opener.closed)try{if(window.opener.focus(),window.opener.location.hash!=="#dashboard"&&(window.opener.location.hash="#dashboard"),window.opener.app_handleAttendance){window.opener.app_handleAttendance();return}}catch(t){console.warn("Could not communicate with main window:",t)}console.log("Opener lost or closed. Reopening main app...");const i=window.location.origin+window.location.pathname+"#dashboard",e=window.open(i,"CRWIMainApp");if(e){e.focus();const t=document.getElementById("attendance-btn");if(t){const a=t.innerHTML;t.innerHTML='<i class="fa-solid fa-arrow-up-right-from-square"></i> Opening App...',setTimeout(()=>{t.innerHTML=a},3e3)}}else alert("Please allow popups or open the main application window manually.")},renderWidgetView(){let i=document.getElementById("widget-view");i||(i=document.createElement("div"),i.id="widget-view",document.body.appendChild(i));const e=window.AppAuth&&window.AppAuth.getUser()||{name:"User",role:"Staff",avatar:"https://via.placeholder.com/48"};i.innerHTML=`
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
        `}};typeof window<"u"&&(window.Widget=$t,$t.init());let Ve=null,oe=[],pe=null,ve=null,$e=0,Ee=!1,xe=null,Ge=!1,Kt=0,Re=null,He=null,Qe=!1,Fe=null;const Xe="release_signal",xt="app_meta",Vt="app_last_seen_release_id",F={active:!1,releaseId:"",commitSha:"",deployedAt:"",notes:"",forceAfterMs:9e4,snoozeMs:3e5,maxSnoozeCount:1,deadlineTs:0,snoozeCount:0},Gt=3e4;window.app_annualYear=new Date().getFullYear();const Va=i=>{const e=Math.max(0,Number(i)||0),t=Math.floor(e/1e3),a=Math.floor(t/60),n=t%60;return`${String(a).padStart(2,"0")}:${String(n).padStart(2,"0")}`},Ga=()=>{try{return localStorage.getItem(Vt)||""}catch{return""}},Ja=i=>{try{localStorage.setItem(Vt,String(i||""))}catch{}},qe=()=>{Fe&&(clearInterval(Fe),Fe=null)},Se=()=>{const i=F.active?Math.max(0,F.deadlineTs-Date.now()):0;return{active:!!F.active,releaseId:F.releaseId||"",commitSha:F.commitSha||"",deployedAt:F.deployedAt||"",notes:F.notes||"",forceAfterMs:Number(F.forceAfterMs)||9e4,snoozeMs:Number(F.snoozeMs)||3e5,maxSnoozeCount:Number(F.maxSnoozeCount)||1,snoozeCount:Number(F.snoozeCount)||0,canSnooze:(Number(F.snoozeCount)||0)<(Number(F.maxSnoozeCount)||1),deadlineTs:Number(F.deadlineTs)||0,remainingMs:i,countdownLabel:Va(i)}};window.app_getReleaseUpdateState=()=>Se();const Ce=()=>{const i=Se(),e=document.querySelector(".dashboard-refresh-link");e&&(i.active?(e.classList.add("is-update-pending"),e.setAttribute("title",`Update available. Auto-refresh in ${i.countdownLabel}`),e.innerHTML=`System update available <span class="dashboard-refresh-countdown">(${i.countdownLabel})</span>`):(e.classList.remove("is-update-pending"),e.setAttribute("title","Check for System Update (Ctrl+Shift+R)"),e.textContent="Check for System Update"))};window.app_applyUpdateCtaState=Ce;const et=()=>{Ce(),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:update-countdown",{detail:Se()}))},Jt=(i=!0)=>{const e=F.releaseId;qe(),F.active=!1,F.deadlineTs=0,F.snoozeCount=0,i&&e&&Ja(e),et()},Zt=()=>{qe(),Fe=setInterval(()=>{if(!F.active){qe();return}if(F.deadlineTs-Date.now()<=0){qe(),window.app_forceRefresh();return}et()},1e3),et()};window.app_snoozeReleaseUpdate=()=>{F.active&&(F.snoozeCount>=F.maxSnoozeCount||(F.snoozeCount+=1,F.deadlineTs=Date.now()+F.snoozeMs,window.app_showSyncToast(`Update snoozed for ${Math.round(F.snoozeMs/6e4)} minutes.`),Zt()))};const Za=i=>{const e=String(i.releaseId||i.commitSha||"");if(!e)return;const t=Ga();e===F.releaseId&&F.active||e!==t&&(F.active=!0,F.releaseId=e,F.commitSha=String(i.commitSha||""),F.deployedAt=String(i.deployedAt||""),F.notes=String(i.notes||""),F.forceAfterMs=Number(i.forceAfterMs)||9e4,F.snoozeMs=Number(i.snoozeMs)||3e5,F.maxSnoozeCount=Number(i.maxSnoozeCount)||1,F.snoozeCount=0,F.deadlineTs=Date.now()+F.forceAfterMs,window.app_showSyncToast("New system update available."),Zt(),window.dispatchEvent&&window.dispatchEvent(new CustomEvent("app:update-available",{detail:Se()})))},It=i=>{!i||i.id!==Xe||i.active!==!1&&Za(i)},Qt=()=>{if(!Qe){if(Qe=!0,window.AppDB&&typeof window.AppDB.listen=="function"){Re=window.AppDB.listen(xt,i=>{const e=(i||[]).find(t=>t.id===Xe);e&&It(e)});return}He=setInterval(async()=>{try{const i=await window.AppDB.get(xt,Xe);i&&It(i)}catch{}},3e4)}},Qa=()=>{typeof Re=="function"&&(Re(),Re=null),He&&(clearInterval(He),He=null),Qe=!1,Jt(!1)};window.app_isAdminUser=(i=window.AppAuth?.getUser())=>i?i.isAdmin===!0:!1;window.app_canSeeAdminPanel=(i=window.AppAuth?.getUser())=>i?window.app_isAdminUser(i)?!0:i.permissions?Object.values(i.permissions).some(e=>e==="admin"):!1:!1;window.app_hasPerm=(i,e="view",t=window.AppAuth?.getUser())=>{if(!t)return!1;if(t.isAdmin===!0)return!0;if(!t.permissions||!t.permissions[i])return!1;const a=t.permissions[i];return e==="view"?a==="view"||a==="admin":e==="admin"?a==="admin":!1};window.app_canManageAttendanceSheet=(i=window.AppAuth?.getUser())=>i?window.app_hasPerm("attendance","admin",i)||!!i.canManageAttendanceSheet:!1;window.app_getReadTelemetry=()=>!window.AppDB||!window.AppDB.getReadTelemetry?{}:window.AppDB.getReadTelemetry();window.app_resetReadTelemetry=()=>{!window.AppDB||!window.AppDB.clearReadTelemetry||window.AppDB.clearReadTelemetry()};window.app_getMyMessages=async()=>{const i=window.AppAuth.getUser();if(!i)return[];try{const[e,t]=await Promise.all([window.AppDB.query("staff_messages","toId","==",i.id),window.AppDB.query("staff_messages","fromId","==",i.id)]),a=new Map;return(e||[]).forEach(n=>a.set(n.id,n)),(t||[]).forEach(n=>a.set(n.id,n)),Array.from(a.values())}catch(e){return console.warn("Message fetch failed, falling back to getAll",e),window.AppDB.getAll("staff_messages")}};const Q=document.getElementById("page-content"),Be=document.querySelector(".sidebar"),Ue=document.querySelector(".mobile-header"),Oe=document.querySelector(".mobile-nav");window.app_initTheme=()=>{const i=localStorage.getItem("theme")||"light";document.documentElement.setAttribute("data-theme",i),Xt(i)};window.app_toggleTheme=()=>{const e=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",e),localStorage.setItem("theme",e),Xt(e)};function Xt(i){document.querySelectorAll(".theme-toggle i").forEach(e=>{i==="dark"?(e.classList.remove("fa-moon"),e.classList.add("fa-sun")):(e.classList.remove("fa-sun"),e.classList.add("fa-moon"))})}function Xa(){"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").then(()=>console.log("ServiceWorker registered")).catch(i=>console.log("ServiceWorker registration failed: ",i))})}const Tt=(i=new Date)=>`${i.getFullYear()}-${String(i.getMonth()+1).padStart(2,"0")}-${String(i.getDate()).padStart(2,"0")}`;window.app_showAttendanceNotice=i=>{if(!i)return;const e=document.getElementById("page-content");if(!e)return;const t=document.getElementById("attendance-policy-notice");t&&t.remove();const a=document.createElement("div");a.id="attendance-policy-notice",a.style.background="#fff7ed",a.style.border="1px solid #fdba74",a.style.color="#9a3412",a.style.padding="0.85rem 1rem",a.style.borderRadius="10px",a.style.marginBottom="0.9rem",a.style.fontSize="0.9rem",a.style.fontWeight="600",a.innerHTML=`<i class="fa-solid fa-circle-info" style="margin-right:0.45rem;"></i>${i}`,e.prepend(a),setTimeout(()=>{const n=document.getElementById("attendance-policy-notice");n&&n.remove()},1e4)};window.app_showSyncToast=(i="Status updated from another device.")=>{const e="app-sync-toast",t=document.getElementById(e);t&&t.remove();const a=document.createElement("div");a.id=e,a.style.position="fixed",a.style.top="14px",a.style.right="14px",a.style.zIndex="10020",a.style.background="#0f172a",a.style.color="#f8fafc",a.style.padding="0.7rem 0.9rem",a.style.borderRadius="10px",a.style.fontSize="0.82rem",a.style.fontWeight="600",a.style.boxShadow="0 8px 25px rgba(15, 23, 42, 0.3)",a.textContent=i,document.body.appendChild(a),setTimeout(()=>{const n=document.getElementById(e);n&&n.remove()},2800)};const Lt=()=>!Ee&&Date.now()>Kt,tt=()=>{Kt=Date.now()+3500},en=i=>{const e=i.detail;if(!e)return;window.app_refreshNotificationBell&&window.app_refreshNotificationBell().catch(()=>{});const t=e.status||"out",a=xe!==null&&t!==xe,n=xe===null&&t==="in";if(xe=t,!(a||n)||Ge)return;const s=!window.location.hash||window.location.hash==="#dashboard",r=document.getElementById("checkout-modal"),d=!!(r&&r.style.display==="flex");if(t==="out"&&d&&(r.style.display="none"),!s){Lt()&&window.app_showSyncToast("Status updated from another device.");return}Ge=!0,(async()=>{try{const o=document.getElementById("page-content");o&&(o.innerHTML=await window.AppUI.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),Lt()&&window.app_showSyncToast("Status updated from another device.")}catch(o){console.warn("Realtime dashboard sync failed:",o)}finally{Ge=!1}})()};function at(i){const e=document.querySelector(".sidebar"),t=document.getElementById("sidebar-overlay");e&&t&&(i?(e.classList.add("open"),t.classList.add("active")):(e.classList.remove("open"),t.classList.remove("active")))}function tn(){if(window.location.search){const i=window.location.protocol+"//"+window.location.host+window.location.pathname+window.location.hash;window.history.replaceState({path:i},"",i),console.log("Address bar cleaned of query parameters.")}}window.app_toggleSidebar=(i=null)=>{const e=document.querySelector(".sidebar"),t=document.querySelector("#desktop-sidebar-toggle i");if(!e)return;(i!==null?i:!e.classList.contains("collapsed"))?(e.classList.add("collapsed"),t&&(t.classList.remove("fa-angles-left"),t.classList.add("fa-angles-right"))):(e.classList.remove("collapsed"),t&&(t.classList.remove("fa-angles-right"),t.classList.add("fa-angles-left")))};window.app_showModal=(i,e)=>{const t=document.getElementById("modal-container");if(!t)return;const a=document.getElementById(e);a&&a.remove(),t.insertAdjacentHTML("beforeend",i);const n=document.getElementById(e);if(n&&(n.classList.contains("modal-overlay")||n.classList.contains("modal"))){const r=Array.from(document.querySelectorAll(".modal-overlay, .modal")).filter(d=>d!==n).reduce((d,o)=>{const l=Number.parseInt(window.getComputedStyle(o).zIndex,10);return Number.isFinite(l)?Math.max(d,l):d},1e3);n.style.zIndex=String(r+2)}};const X=i=>String(i??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),an=i=>X(i).replace(/\n/g,"<br>"),vt=i=>String(i?.status||"pending").toLowerCase(),Ne=i=>vt(i)==="pending",ea=i=>i?.type==="minute-access-request"?"Minutes":i?.type==="task"?"Task":i?.type==="tag"||i?.type==="mention"?"Tag":i?.type==="reminder"?"Reminder":"Notification",nn=i=>String(i?.description||i?.message||i?.title||"").trim(),ta=i=>{const e=i?.respondedAt||i?.taggedAt||i?.date,t=new Date(e).getTime();if(!t)return"Unknown time";const a=Math.max(0,Math.floor((Date.now()-t)/6e4)),n=a<1?"just now":a<60?`${a} mins ago`:a<1440?`${Math.floor(a/60)} hrs ago`:`${Math.floor(a/1440)} days ago`;return`${new Date(t).toLocaleString()} (${n})`};window.app_refreshNotificationBell=async()=>{const i=document.querySelectorAll(".top-notification-btn");if(!i.length)return;const e=window.AppAuth.getUser(),a=(Array.isArray(e?.notifications)?e.notifications:[]).filter(Ne).length;i.forEach(n=>{const s=n.querySelector(".top-notification-badge");if(!e){n.classList.remove("has-pending"),s&&(s.style.display="none");return}n.classList.toggle("has-pending",a>0),n.setAttribute("title",a>0?`${a} pending notification${a>1?"s":""}`:"Notification history"),s&&(a>0?(s.textContent=a>99?"99+":String(a),s.style.display=""):s.style.display="none")})};window.app_closeNotificationHistory=()=>{const i=document.getElementById("notification-history-modal"),e=document.getElementById("notif-drawer-backdrop");i&&i.classList.remove("notif-drawer-open"),e&&e.classList.remove("notif-drawer-backdrop-visible"),setTimeout(()=>document.getElementById("notif-drawer-root")?.remove(),320)};window.app_respondNotificationFromHistory=async(i,e,t)=>{const a=window.AppAuth.getUser();if(!a)return;const n=t==="approve"?"approve":"reject",s=await window.AppDB.get("users",a.id);if(!s||!Array.isArray(s.notifications)){alert("Notification not found.");return}let r=null,d=-1;if(Number.isInteger(i)&&i>=0&&s.notifications[i]&&(r=s.notifications[i],d=i),!r&&e&&(d=s.notifications.findIndex(o=>String(o.id)===String(e)),d>=0&&(r=s.notifications[d])),!r){alert("This notification is no longer available.");return}if(!Ne(r)){alert("This notification has already been responded."),await window.app_refreshNotificationBell();return}window.app_closeNotificationHistory();try{if(r.type==="minute-access-request"&&window.app_hasPerm("minutes","admin",a)){await window.app_reviewMinuteAccessFromNotification(d,r.id,n==="approve"?"approved":"rejected");return}const o=Number(r.taskIndex);if(r.planId&&Number.isInteger(o)&&o>=0){await window.app_handleTagResponse(r.planId,o,n==="approve"?"accepted":"rejected",d);return}if(r.id){await window.app_handleTagDecision(r.id,n==="approve"?"accepted":"rejected");return}alert("This notification cannot be approved or rejected from history.")}catch(o){console.error("Notification response error:",o),alert("Failed to process notification: "+o.message)}};window.app_openNotificationHistory=async()=>{const i=window.AppAuth.getUser();if(!i)return;const e=await window.AppDB.get("users",i.id).catch(()=>i),t=Array.isArray(e?.notifications)?e.notifications:[],a=Array.isArray(e?.tagHistory)?e.tagHistory:[],n=i.isAdmin||i.role==="Administrator",s=[...t.map((p,m)=>({...p,_source:"live",_index:m})),...a.map(p=>({...p,_source:"history",_index:-1}))].sort((p,m)=>{const u=new Date(p.respondedAt||p.taggedAt||p.date||0).getTime();return new Date(m.respondedAt||m.taggedAt||m.date||0).getTime()-u}),r=p=>{const m=vt(p),u=m==="pending"&&p._source==="live",y=ea(p),g=p.taggedByName||"System",h=p.title||`${y} from ${g}`,f=nn(p),v=JSON.stringify(String(p.id||"")),b={pending:{bg:"#fff7ed",border:"#fdba74",badge:"#f97316"},accepted:{bg:"#f0fdf4",border:"#86efac",badge:"#16a34a"},rejected:{bg:"#fef2f2",border:"#fca5a5",badge:"#dc2626"},default:{bg:"#f8fafc",border:"#e2e8f0",badge:"#6b7280"}},k=b[m]||b.default,w=p._source==="history"?`<button class="notif-drawer-dismiss" title="Remove" onclick="window.app_dismissNotifDrawerItem(null, ${v}, 'history')"><i class="fa-solid fa-xmark"></i></button>`:`<button class="notif-drawer-dismiss" title="Remove" onclick="window.app_dismissNotifDrawerItem(${Number(p._index)}, ${v}, 'live')"><i class="fa-solid fa-xmark"></i></button>`,A=u||n&&p.type==="minute-access-request"?`
            <div class="notif-drawer-actions">
                <button type="button" class="notif-drawer-btn approve" onclick="window.app_respondNotificationFromHistory(${Number(p._index)}, ${v}, 'approve')">
                    <i class="fa-solid fa-check"></i> Approve
                </button>
                <button type="button" class="notif-drawer-btn reject" onclick="window.app_respondNotificationFromHistory(${Number(p._index)}, ${v}, 'reject')">
                    <i class="fa-solid fa-xmark"></i> Reject
                </button>
            </div>`:"";return`
            <div class="notif-drawer-item ${u?"is-pending":""}" style="border-color:${k.border}; background:${k.bg};" data-notif-id="${X(String(p.id||""))}">
                <div class="notif-drawer-item-head">
                    <div class="notif-drawer-item-left">
                        <div class="notif-drawer-source-icon">
                            <i class="fa-solid ${p.type==="tag"||p.type==="mention"?"fa-at":p.type==="task"?"fa-list-check":p.type==="minute-access-request"?"fa-file-lines":"fa-bell"}"></i>
                        </div>
                        <div>
                            <div class="notif-drawer-title">${X(h)}</div>
                            <div class="notif-drawer-meta">${X(y)} • ${X(g)} • ${X(ta(p))}</div>
                        </div>
                    </div>
                    <div class="notif-drawer-item-right">
                        <span class="notif-drawer-badge" style="background:${k.badge}">${X(m)}</span>
                        ${w}
                    </div>
                </div>
                ${f?`<div class="notif-drawer-text">${X(f)}</div>`:""}
                ${A}
            </div>`},d=s.length?s.map(r).join(""):`<div class="notif-drawer-empty"><i class="fa-regular fa-bell-slash"></i><p>You're all caught up!</p></div>`,o=t.filter(Ne).length,l=`
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
                    ${s.length>0?'<button type="button" class="notif-drawer-clear-btn" onclick="window.app_dismissAllReadNotifications()">Clear Read</button>':""}
                    <button type="button" class="notif-drawer-close-btn" onclick="window.app_closeNotificationHistory()"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <div class="notif-drawer-list" id="notif-drawer-list">${d}</div>
        </div>`,c=document.createElement("div");c.id="notif-drawer-root",c.innerHTML=l,document.body.appendChild(c),requestAnimationFrame(()=>{const p=document.getElementById("notification-history-modal");p&&p.classList.add("notif-drawer-open");const m=document.getElementById("notif-drawer-backdrop");m&&m.classList.add("notif-drawer-backdrop-visible")}),await window.app_refreshNotificationBell()};window.app_dismissNotifDrawerItem=async(i,e,t)=>{const a=window.AppAuth.getUser();if(a)try{const n=await window.AppDB.get("users",a.id);if(!n)return;if(t==="live"){const d=Array.isArray(n.notifications)?[...n.notifications]:[],o=d.findIndex(c=>String(c.id)===String(e)),l=o>=0?o:Number.isInteger(i)&&i>=0?i:-1;l>=0&&(d.splice(l,1),await window.AppDB.update("users",a.id,{notifications:d}),window.AppAuth?.getUser&&Object.assign(window.AppAuth.getUser(),{notifications:d}))}else{const d=Array.isArray(n.tagHistory)?[...n.tagHistory]:[],o=d.findIndex(l=>String(l.id)===String(e));o>=0&&(d.splice(o,1),await window.AppDB.update("users",a.id,{tagHistory:d}))}const s=document.querySelector(`[data-notif-id="${CSS.escape(String(e))}"]`);s&&(s.style.transition="opacity 0.2s, transform 0.2s",s.style.opacity="0",s.style.transform="translateX(30px)",setTimeout(()=>s.remove(),220)),await window.app_refreshNotificationBell();const r=document.querySelector(".notif-drawer-header-sub");if(r){const o=(window.AppAuth.getUser()?.notifications||[]).filter(Ne).length;r.textContent=o>0?`${o} pending action${o>1?"s":""}`:"All caught up"}}catch(n){console.warn("Failed to dismiss notification",n)}};window.app_dismissAllReadNotifications=async()=>{const i=window.AppAuth.getUser();if(i)try{const e=await window.AppDB.get("users",i.id);if(!e)return;const t=(e.notifications||[]).filter(Ne),a=[];await window.AppDB.update("users",i.id,{notifications:t,tagHistory:a}),window.AppAuth?.getUser&&Object.assign(window.AppAuth.getUser(),{notifications:t,tagHistory:a}),await window.app_refreshNotificationBell();const n=document.getElementById("notif-drawer-list");if(n){const s=t.map((r,d)=>({...r,_source:"live",_index:d}));n.innerHTML=s.length?s.map(r=>{const d=vt(r),o=ea(r),l=r.taggedByName||"System",c=r.title||`${o} from ${l}`,p=JSON.stringify(String(r.id||""));return`
                        <div class="notif-drawer-item is-pending" data-notif-id="${X(String(r.id||""))}">
                            <div class="notif-drawer-item-head">
                                <div class="notif-drawer-item-left">
                                    <div class="notif-drawer-source-icon"><i class="fa-solid fa-at"></i></div>
                                    <div>
                                        <div class="notif-drawer-title">${X(c)}</div>
                                        <div class="notif-drawer-meta">${X(o)} • ${X(l)} • ${X(ta(r))}</div>
                                    </div>
                                </div>
                                <div class="notif-drawer-item-right">
                                    <span class="notif-drawer-badge" style="background:#f97316">${X(d)}</span>
                                    <button class="notif-drawer-dismiss" onclick="window.app_dismissNotifDrawerItem(${r._index}, ${p}, 'live')"><i class="fa-solid fa-xmark"></i></button>
                                </div>
                            </div>
                            <div class="notif-drawer-actions">
                                <button class="notif-drawer-btn approve" onclick="window.app_respondNotificationFromHistory(${r._index}, ${p}, 'approve')"><i class="fa-solid fa-check"></i> Approve</button>
                                <button class="notif-drawer-btn reject" onclick="window.app_respondNotificationFromHistory(${r._index}, ${p}, 'reject')"><i class="fa-solid fa-xmark"></i> Reject</button>
                            </div>
                        </div>`}).join(""):`<div class="notif-drawer-empty"><i class="fa-regular fa-bell-slash"></i><p>You're all caught up!</p></div>`}}catch(e){console.warn("Failed to clear notifications",e)}};window.app_systemDialog=function({title:i="Notice",message:e="",mode:t="alert",defaultValue:a="",confirmText:n="OK",cancelText:s="Cancel",placeholder:r=""}={}){return new Promise(d=>{const o=`system-dialog-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,l=`${o}-input`,c=t==="prompt",p=t==="confirm"||t==="prompt",m=`
                <div class="modal-overlay app-system-dialog-overlay" id="${o}" style="display:flex;">
                    <div class="modal-content app-system-dialog">
                        <div class="app-system-dialog-head">
                            <h3>${X(i)}</h3>
                            <button type="button" class="app-system-dialog-close" aria-label="Close dialog">&times;</button>
                        </div>
                        <div class="app-system-dialog-body">
                            <p>${an(e)}</p>
                            ${c?`<input id="${l}" class="app-system-dialog-input" type="text" value="${X(a)}" placeholder="${X(r)}" autocomplete="off">`:""}
                        </div>
                        <div class="app-system-dialog-actions">
                            ${p?`<button type="button" class="action-btn secondary app-system-dialog-cancel">${X(s)}</button>`:""}
                            <button type="button" class="action-btn app-system-dialog-confirm">${X(n)}</button>
                        </div>
                    </div>
                </div>
            `;(document.body||document.getElementById("modal-container")).insertAdjacentHTML("beforeend",m);const u=document.getElementById(o);if(!u){d(c?null:!1);return}u.style.zIndex="20000";const y=u.querySelector(".app-system-dialog-confirm"),g=u.querySelector(".app-system-dialog-cancel"),h=u.querySelector(".app-system-dialog-close"),f=c?u.querySelector(`#${l}`):null,v=b=>{u.remove(),d(b)};y?.addEventListener("click",()=>{v(c?f?f.value:"":!0)}),g?.addEventListener("click",()=>v(c?null:!1)),h?.addEventListener("click",()=>v(c?null:!1)),u.addEventListener("click",b=>{b.target===u&&v(c?null:!1)}),u.addEventListener("keydown",b=>{b.key==="Escape"&&v(c?null:!1),b.key==="Enter"&&(b.preventDefault(),v(c?f?f.value:"":!0))}),f?(f.focus(),f.select()):y?.focus()})};window.appAlert=(i,e="Notice")=>window.app_systemDialog({title:e,message:i,mode:"alert",confirmText:"OK"});window.appConfirm=(i,e="Please Confirm")=>window.app_systemDialog({title:e,message:i,mode:"confirm",confirmText:"Confirm",cancelText:"Cancel"});window.appPrompt=(i,e="",t={})=>window.app_systemDialog({title:t.title||"Enter Details",message:i,mode:"prompt",defaultValue:e,confirmText:t.confirmText||"Save",cancelText:t.cancelText||"Cancel",placeholder:t.placeholder||""});window.alert=i=>{window.appAlert(i)};window.app_openEventModal=()=>{window.app_showModal(`
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
        `,"event-modal")};window.app_submitEvent=async i=>{i.preventDefault();const e=document.getElementById("event-title").value,t=document.getElementById("event-date").value,a=document.getElementById("event-type").value;try{await window.AppCalendar.addEvent({title:e,date:t,type:a}),alert("Event added successfully!"),document.getElementById("event-modal")?.remove();const n=document.getElementById("page-content");n.innerHTML=await window.AppUI.renderDashboard(),de()}catch(n){alert("Error: "+n.message)}};async function sn(){window.app_initTheme(),tn(),window.addEventListener("app:user-sync",en),window.addEventListener("app:update-available",Ce),window.addEventListener("app:update-countdown",Ce);try{await window.AppAuth.init();const e=window.AppAuth.getUser();e&&(xe=e.status||"out",Qt()),Xa(),window.AppActivity&&window.AppActivity.initCommandListener()}catch(e){console.error("Initialization Failed:",e),Q&&(Q.innerHTML=`<div style="text-align:center; padding:2rem; color:red;">Failed to load application.<br><small>${e.message}</small></div>`)}document.addEventListener("click",e=>{e.target.id==="sidebar-toggle"||e.target.closest("#sidebar-toggle")?at(!0):e.target.id==="sidebar-overlay"&&at(!1)}),window.addEventListener("hashchange",_t),_t();const i=window.AppAuth.getUser();i&&window.AppTour&&window.AppTour.init(i)}async function _t(){const i=window.AppAuth.getUser(),e=window.location.hash.slice(1)||"dashboard";if(e!=="admin"&&oe&&oe.length>0&&(console.log("Cleaning up Admin Realtime Listener."),oe.forEach(o=>typeof o=="function"&&o()),oe=[]),e!=="minutes"&&typeof pe=="function"&&(console.log("Cleaning up Minutes Realtime Listener."),pe(),pe=null),!i){Qa(),Be&&(Be.style.display="none"),Ue&&(Ue.style.display="none"),Oe&&(Oe.style.display="none"),document.body.style.background="#f3f4f6",Q&&(Q.innerHTML=window.AppUI.renderLogin()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell();return}Qt(),at(!1),Be&&(Be.style.display=""),Ue&&(Ue.style.display=""),Oe&&(Oe.style.display="");const t=document.querySelector(".sidebar-footer .user-mini-profile");t&&(t.innerHTML=`
                <img src="${i.avatar||"https://ui-avatars.com/api/?name=User"}" alt="User">
                <div>
                    <p class="user-name">${i.name||"Staff Member"}</p>
                </div>
                <i class="fa-solid fa-gear user-settings-icon"></i>
            `),window.app_hasPerm("users","view",i);const a=window.app_hasPerm("attendance","view",i),n=window.app_hasPerm("reports","view",i),s=window.app_hasPerm("policies","view",i),r=window.app_canSeeAdminPanel(i);document.querySelectorAll('a[data-page="admin"]').forEach(o=>{o.style.display=r?"flex":"none",r||o.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="master-sheet"]').forEach(o=>{o.style.display=a?"flex":"none",a||o.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="salary"]').forEach(o=>{o.style.display=n?"flex":"none",n||o.style.setProperty("display","none","important")}),document.querySelectorAll('a[data-page="policy-test"]').forEach(o=>{o.style.display=s?"flex":"none",s||o.style.setProperty("display","none","important")}),document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(o=>{o.dataset.page===e?o.classList.add("active"):o.classList.remove("active")});try{const o=document.getElementById("modal-container");if(o&&!document.getElementById("checkout-modal")&&o.insertAdjacentHTML("beforeend",window.AppUI.renderModals()),Q&&(Q.innerHTML='<div class="loading-spinner"></div>'),e==="dashboard")Q.innerHTML=await window.AppUI.renderDashboard(),de();else if(e==="staff-directory")Q.innerHTML=await window.AppUI.renderStaffDirectoryPage();else if(e==="policies")window.AppPolicies&&typeof window.AppPolicies.render=="function"?Q.innerHTML=await window.AppPolicies.render():Q.innerHTML='<div style="padding:1rem; color:#b91c1c;">Policies module failed to load.</div>';else if(e==="annual-plan")Q.innerHTML=await window.AppUI.renderAnnualPlan();else if(e==="timesheet")Q.innerHTML=await window.AppUI.renderTimesheet();else if(e==="profile")Q.innerHTML=await window.AppUI.renderProfile();else if(e==="salary"){if(!window.app_hasPerm("reports","view",i)){window.location.hash="dashboard";return}Q.innerHTML=await window.AppUI.renderSalaryProcessing?await window.AppUI.renderSalaryProcessing():await window.AppUI.renderSalary()}else if(e==="policy-test"){if(!window.app_hasPerm("policies","view",i)){window.location.hash="dashboard";return}Q.innerHTML=await window.AppUI.renderPolicyTest()}else if(e==="master-sheet"){if(!window.app_canManageAttendanceSheet(i)){window.location.hash="dashboard";return}Q.innerHTML=await window.AppUI.renderMasterSheet()}else if(e==="minutes")Q.innerHTML=await window.AppUI.renderMinutes(),rn();else if(e==="admin"){if(!window.app_canSeeAdminPanel(i)){window.location.hash="dashboard";return}Q.innerHTML=await window.AppUI.renderAdmin(),window.AppAnalytics.initAdminCharts(),on()}window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}catch(o){console.error("Render Error:",o),Q.innerHTML=`<div style="text-align:center; color:red; padding:2rem;">Error loading page: ${o.message}</div>`}}function on(){oe.forEach(n=>typeof n=="function"&&n()),oe=[],console.log("Starting Admin Realtime Listeners (Users & Audits)...");let i=null;const e=()=>{i&&clearTimeout(i),i=setTimeout(async()=>{i=null,await t()},600)},t=async()=>{if(window.location.hash.slice(1)!=="admin")return;if(document.querySelector('.modal-overlay[style*="display: flex"], .modal[style*="display: flex"]'))console.log("Admin Update received but skipped because a modal is open.");else{console.log("Admin Data Update Received (Realtime) - Refreshing UI");const r=document.getElementById("page-content");if(r){const d=document.getElementById("audit-start")?.value,o=document.getElementById("audit-end")?.value;r.innerHTML=await window.AppUI.renderAdmin(d,o),window.AppAnalytics&&window.AppAnalytics.initAdminCharts()}}};if((window.AppConfig&&window.AppConfig.READ_OPT_FLAGS||{}).FF_READ_OPT_TARGETED_REALTIME&&window.AppDB.listenQuery){oe.push(window.AppDB.listenQuery("users",[{field:"status",operator:"in",value:["in","out"]}],{limit:300},e));const n=new Date;n.setDate(n.getDate()-2),oe.push(window.AppDB.listenQuery("location_audits",[{field:"timestamp",operator:">=",value:n.getTime()}],{orderBy:[{field:"timestamp",direction:"desc"}],limit:300},e))}else oe.push(window.AppDB.listen("users",e)),oe.push(window.AppDB.listen("location_audits",e))}function rn(){if(!window.AppDB||!window.AppDB.listen)return;typeof pe=="function"&&(pe(),pe=null);const i=async()=>{if((window.location.hash.slice(1)||"dashboard")!=="minutes"||document.getElementById("minute-detail-modal"))return;const a=document.getElementById("page-content");a&&(a.innerHTML=await window.AppUI.renderMinutes())};(window.AppConfig&&window.AppConfig.READ_OPT_FLAGS||{}).FF_READ_OPT_TARGETED_REALTIME&&window.AppDB.listenQuery?pe=window.AppDB.listenQuery("minutes",[],{orderBy:[{field:"date",direction:"desc"}],limit:150},i):pe=window.AppDB.listen("minutes",i)}function dn(i=null,e=!1){Ve&&clearInterval(Ve),(async()=>{let a="out",n=null;if(i)a=i.status||"out",n=i.lastCheckIn||null;else{const m=await window.AppAttendance.getStatus();a=m.status,n=m.lastCheckIn}const s=document.getElementById("timer-display"),r=document.getElementById("countdown-container"),d=document.getElementById("overtime-container"),o=document.getElementById("countdown-value"),l=document.getElementById("countdown-progress"),c=document.getElementById("overtime-value"),p=document.getElementById("timer-label");if(a==="in"&&n){const m=new Date(n),u=new Date,y=`${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,"0")}-${String(m.getDate()).padStart(2,"0")}`,g=`${u.getFullYear()}-${String(u.getMonth()+1).padStart(2,"0")}-${String(u.getDate()).padStart(2,"0")}`,h=y!==g,f=new Date(m);f.setHours(17,0,0,0);const v=m.getDay();v===6&&f.setHours(13,0,0,0),v===0&&f.setHours(17,0,0,0),Ve=setInterval(()=>{const b=Date.now(),k=b-n;if(s){let A=Math.floor(k/36e5),$=Math.floor(k/(1e3*60)%60),I=Math.floor(k/1e3%60);A=A<10?"0"+A:A,$=$<10?"0"+$:$,I=I<10?"0"+I:I,s.textContent=`${A} : ${$} : ${I}`}if(h){r&&(r.style.display="none"),d&&(d.style.display="none"),s&&(s.style.color="#b45309"),p&&(p.textContent="Session Carryover (Please Check Out)",p.style.color="#b45309");return}const w=f.getTime()-b;if(w>0){r&&(r.style.display="block"),d&&(d.style.display="none"),p&&(p.textContent="Elapsed Time",p.style.color="#6b7280"),s&&(s.style.color="#1f2937");let A=Math.floor(w/(1e3*60*60)%24),$=Math.floor(w/(1e3*60)%60),I=Math.floor(w/1e3%60);A=A<10?"0"+A:A,$=$<10?"0"+$:$,I=I<10?"0"+I:I;const L=f.getTime()-n,T=L>0?Math.min(100,k/L*100):100;o&&(o.textContent=`${A}:${$}:${I}`),l&&(l.style.width=`${T}%`),l&&(l.style.background="var(--primary)")}else{r&&(r.style.display="none"),d&&(d.style.display="block");const A=Math.abs(b-f.getTime());let $=Math.floor(A/(1e3*60*60)),I=Math.floor(A/(1e3*60)%60),L=Math.floor(A/1e3%60);$=$<10?"0"+$:$,I=I<10?"0"+I:I,L=L<10?"0"+L:L,c&&(c.textContent=`+ ${$}:${I}:${L}`),s&&(s.style.color="#c2410c"),p&&(p.textContent="Total Elapsed (Overtime)",p.style.color="#c2410c")}},1e3),!e&&window.AppActivity&&window.AppActivity.start&&window.AppActivity.start()}else s&&(s.textContent="00 : 00 : 00",s.style.color=""),p&&(p.textContent="Elapsed Time",p.style.color=""),r&&(r.style.display="none"),d&&(d.style.display="none")})()}window.getLocation=function(){return new Promise((e,t)=>{(async()=>{const a=window.location&&window.location.hostname?window.location.hostname:"",n=a==="localhost"||a==="127.0.0.1"||a==="::1";if(!window.isSecureContext&&!n){t("Location requires HTTPS on mobile. Open this app using an HTTPS URL and allow location access.");return}const s=Date.now();if(ve&&s-$e<Gt){console.log("Using cached location (freshness: "+(s-$e)+"ms)"),e(ve);return}if(!navigator.geolocation){t("Geolocation is not supported by your browser.");return}try{if(navigator.permissions&&navigator.permissions.query){const d=await navigator.permissions.query({name:"geolocation"});if(d&&d.state==="denied"){t("Location permission is blocked. Enable location for this site in browser settings and try again.");return}}}catch{}const r=d=>new Promise((o,l)=>{navigator.geolocation.getCurrentPosition(o,l,d)});try{console.log("Requesting Location: High Accuracy (GPS)...");const d=await r({enableHighAccuracy:!0,timeout:1e4,maximumAge:5e3}),o={lat:d.coords.latitude,lng:d.coords.longitude};ve=o,$e=Date.now(),e(o)}catch(d){console.warn("High Accuracy Failed:",d.message);try{console.log("Requesting Location: Low Accuracy (Fallback)...");const o=await r({enableHighAccuracy:!1,timeout:15e3,maximumAge:1e4}),l={lat:o.coords.latitude,lng:o.coords.longitude};ve=l,$e=Date.now(),e(l)}catch(o){console.error("Low Accuracy Failed:",o.message);let l="Unable to retrieve location.";o.code===1?l="Location permission denied.":o.code===2?l="Location unavailable. Ensure GPS/Location Services are turned on.":o.code===3&&(l="Location request timed out. Move to open sky or better network and try again."),t(l)}}})().catch(a=>{t(a&&a.message?a.message:"Unable to retrieve location.")})})};const ie=i=>/^\d{4}-\d{2}-\d{2}$/.test(String(i||"")),ln={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11},cn=(i="")=>{const e=String(i||"").trim();if(!e)return null;const t=e.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);if(!t)return null;const a=Number(t[1]),n=Number(t[2]),s=String(t[3]||"").toLowerCase(),r=Number(t[4]),d=ln[s];if(!Number.isInteger(a)||!Number.isInteger(n)||!Number.isInteger(d)||!Number.isInteger(r))return null;const o=new Date(r,d,a),l=new Date(r,d,n);if(Number.isNaN(o.getTime())||Number.isNaN(l.getTime()))return null;const c=`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`,p=`${l.getFullYear()}-${String(l.getMonth()+1).padStart(2,"0")}-${String(l.getDate()).padStart(2,"0")}`;return p<c?null:{startDate:c,endDate:p}},aa=(i,e,t=null)=>{const a=ie(e)?String(e):null,n=i?.startDate,s=i?.endDate,r=!ie(n)&&!ie(s)?cn(i?.task||""):null;let d=ie(n)?String(n):r?.startDate||a,o=ie(s)?String(s):r?.endDate||d||a;if((!ie(n)||!ie(s))&&i?.sourcePlanId&&t?.workPlans){const l=(t.workPlans||[]).find(m=>m.id===i.sourcePlanId),c=Number.isInteger(i.sourceTaskIndex)?i.sourceTaskIndex:Number(i.sourceTaskIndex),p=l&&Array.isArray(l.plans)&&Number.isInteger(c)?l.plans[c]:null;if(p){const m=ie(p.startDate)?p.startDate:l.date||d,u=ie(p.endDate)?p.endDate:p.startDate||l.date||o;ie(n)||(d=m),ie(s)||(o=u)}}return d&&o&&o<d?{startDate:d,endDate:d}:{startDate:d,endDate:o}},na=(i,e,t,a=null)=>{const{startDate:n,endDate:s}=aa(i,e,a);return!n||!s?e===t:!(t<n||t>s||i?.completedDate&&i.completedDate<t)};window.app_getDayEvents=(i,e,t={})=>{const a=t.includeAuto!==!1,n=t.dedupe!==!1,s=t.userId||null;if(!e)return[];if(Array.isArray(e))return e.filter(l=>l.date===i);const r=new Date(i),d=[];if(a&&window.AppAnalytics){const l=window.AppAnalytics.getDayType(r);l==="Holiday"?d.push({title:"Company Holiday (Weekend)",type:"holiday",date:i}):l==="Half Day"&&d.push({title:"Half Working Day (Sat)",type:"event",date:i})}if((e.leaves||[]).forEach(l=>{i>=l.startDate&&i<=l.endDate&&d.push({title:`${l.userName||"Staff"} (Leave)`,type:"leave",userId:l.userId,date:i})}),(e.events||[]).forEach(l=>{l.date===i&&d.push({title:l.title,type:l.type||"event",date:i})}),(e.workPlans||[]).forEach(l=>{if(l.date<=i){const p=(l.planScope||"personal")==="annual"?"All Staff (Annual)":l.userName||"Staff";let m="";if(l.plans&&l.plans.length>0){const u=l.plans.filter(y=>na(y,l.date,i,e));if(!u.length)return;m=`${p}: ${u.map(y=>y.task).join("; ")}`,d.push({title:m,type:"work",userId:l.userId,plans:u,date:i,planScope:l.planScope||"personal"})}else{if(l.date!==i)return;m=`${p}: ${l.plan||"Work Plan"}`,d.push({title:m,type:"work",userId:l.userId,plans:l.plans,date:i,planScope:l.planScope||"personal"})}}}),s){const l=[];d.forEach(c=>{if(c.type!=="work"){l.push(c);return}if((c.planScope||"").toLowerCase()==="annual"){l.push(c);return}if(c.userId===s){l.push(c);return}if(Array.isArray(c.plans)&&c.plans.some(m=>Array.isArray(m.tags)&&m.tags.some(u=>u.id===s&&u.status==="accepted"))){l.push(c);return}}),d.length=0,d.push(...l)}if(!n)return d;const o=new Set;return d.filter(l=>{const c=l.type||"event";if(c!=="holiday"&&c!=="event")return!0;const p=`${c}|${l.title||""}|${l.userId||""}|${l.date||i}`;return o.has(p)?!1:(o.add(p),!0)})};const bt=(i,e)=>{const t=String(i??"").trim();return!t||t==="undefined"||t==="null"?e:t},ue=i=>String(i??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),Mt=i=>String(i??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'"),pn=(i="")=>{const e=String(i||"").replace(/\s+/g," ").trim();return e?e.length>72?`${e.slice(0,72)}...`:e:"New task"},At=()=>`
        <div class="no-tags-placeholder day-plan-no-tags-placeholder">
            <p class="day-plan-no-tags-text">No collaborators yet</p>
        </div>
    `,ia=(i,e,t="pending")=>`
        <div class="tag-chip day-plan-tag-chip" data-id="${ue(i)}" data-name="${ue(e)}" data-status="${ue(t)}">
            <span class="day-plan-tag-main">@${ue(e)} <span class="day-plan-tag-pending">(${ue(t)})</span></span>
            <i class="fa-solid fa-times day-plan-remove-collab-btn" onclick="window.app_removeTagHint(this)"></i>
        </div>
    `;window.app_refreshPlanBlockSummary=i=>{if(!i)return;const e=i.querySelector(".plan-task"),t=i.querySelector(".day-plan-task-summary"),a=i.querySelector(".plan-scope"),n=i.querySelector(".day-plan-scope-pill"),s=pn(e?e.value:"");t&&(t.textContent=s),n&&a&&(n.textContent=a.value==="annual"?"Annual Plan":"Personal Plan")};window.app_togglePlanBlockCollapse=i=>{const e=i.closest(".plan-block");if(!e)return;e.classList.toggle("is-collapsed");const t=e.classList.contains("is-collapsed"),a=i.querySelector("i");a&&(a.classList.toggle("fa-chevron-down",!t),a.classList.toggle("fa-chevron-up",t));const n=i.querySelector(".day-plan-collapse-label");n&&(n.textContent=t?"Expand":"Minimize"),window.app_refreshPlanBlockSummary(e)};window.app_toggleTaskCollaborator=(i,e,t)=>{const a=i.closest(".plan-block");if(!a)return;const n=a.querySelector(".tags-container");if(!n)return;const s=typeof CSS<"u"&&CSS.escape?CSS.escape(e):e.replace(/"/g,'\\"'),r=n.querySelector(`[data-id="${s}"]`);if(r)r.remove(),i.classList.remove("selected");else{const d=n.querySelector(".no-tags-placeholder");d&&d.remove(),n.insertAdjacentHTML("beforeend",ia(e,t,"pending")),i.classList.add("selected")}n.querySelectorAll(".tag-chip").length===0&&(n.innerHTML=At())};window.app_getAnnualDayStaffPlans=i=>{const e=window._currentPlans||{},t=window._annualUserMap||{},n=(e.workPlans||[]).filter(d=>d.date<=i).map(d=>{const o=t[d.userId]||d.userName||"Staff",l=new Map,c=y=>String(y||"").toLowerCase().replace(/\d{1,2}\s*-\s*\d{1,2}\s+[a-z]+\s+\d{4}/g," ").replace(/\([^)]*\)/g," ").replace(/[^a-z\s]/g," ").split(/\s+/).filter(Boolean).slice(0,8).join(" "),p=(y,g="")=>{const h=String(y||"Planned task").trim();if(!h)return;const f=c(h)||h.toLowerCase().replace(/\s+/g," "),v=`${h}${g||""}`;if(!l.has(f)){l.set(f,v);return}(l.get(f)||"")===h&&v!==h&&l.set(f,v)},m=d.plans&&d.plans.length?d.plans.filter(y=>na(y,d.date,i,e)).map(y=>{const{startDate:g,endDate:h}=aa(y,d.date,e),f=!!(g&&h&&g!==h),v=h===i,b=g===i,w=y.completedDate&&y.completedDate<h&&y.completedDate===i?" (Completed Early)":f&&v?" (Ends Today)":f&&b?" (Starts Today)":"";return p(y.task||"Planned task",w),""}).filter(Boolean):d.date!==i?[]:(p(d.plan||"Planned task",""),[]),u=Array.from(l.values());return!u.length&&m.length?{name:o,tasks:m}:u.length?{name:o,tasks:u}:null}).filter(Boolean),s=d=>String(d||"").toLowerCase().replace(/\d{1,2}\s*-\s*\d{1,2}\s+[a-z]+\s+\d{4}/g," ").replace(/\([^)]*\)/g," ").replace(/[^a-z\s]/g," ").split(/\s+/).filter(Boolean).slice(0,8).join(" "),r=new Map;return n.forEach(d=>{const o=d.name||"Staff";r.has(o)||r.set(o,new Map);const l=r.get(o);(d.tasks||[]).forEach(c=>{const p=s(c)||String(c||"").toLowerCase();if(!l.has(p))l.set(p,c);else{const m=l.get(p)||"",u=String(c||"");m.length<u.length&&l.set(p,u)}})}),Array.from(r.entries()).map(([d,o])=>({name:d,tasks:Array.from(o.values())}))};window.app_showAnnualHoverPreview=(i,e)=>{const t="annual-hover-preview";document.getElementById(t)?.remove();const a=window.app_getAnnualDayStaffPlans(e),n=a.length?a.map(r=>`
                <div style="margin-bottom:0.45rem;">
                    <div style="font-size:0.76rem; font-weight:700; color:#334155;">${r.name}</div>
                    <div style="font-size:0.72rem; color:#64748b;">${r.tasks.slice(0,2).join(" | ")}${r.tasks.length>2?` (+${r.tasks.length-2} more)`:""}</div>
                </div>
            `).join(""):'<div style="font-size:0.74rem; color:#94a3b8;">No staff plans for this date</div>',s=`
            <div id="${t}" style="position:fixed; z-index:12000; left:${Math.min((i.clientX||0)+12,window.innerWidth-290)}px; top:${Math.min((i.clientY||0)+12,window.innerHeight-220)}px; width:280px; background:#fff; border:1px solid #dbeafe; border-radius:12px; box-shadow:0 12px 26px rgba(15,23,42,0.18); padding:0.65rem;">
                <div style="font-size:0.76rem; font-weight:800; color:#1e3a8a; margin-bottom:0.5rem;">${e} Plans</div>
                ${n}
            </div>`;(document.getElementById("modal-container")||document.body).insertAdjacentHTML("beforeend",s)};window.app_hideAnnualHoverPreview=()=>{document.getElementById("annual-hover-preview")?.remove()};window.app_openAnnualDayPlan=async i=>{window.app_hideAnnualHoverPreview();const e=`annual-day-click-${Date.now()}`,t=window.app_getAnnualDayStaffPlans(i),a=t.length?t.map(s=>`
                <div style="border:1px solid #e2e8f0; border-radius:10px; padding:0.55rem; margin-bottom:0.45rem;">
                    <div style="font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:0.25rem;">${s.name}</div>
                    <div style="font-size:0.76rem; color:#64748b;">${s.tasks.join(" | ")}</div>
                </div>
            `).join(""):'<div style="font-size:0.8rem; color:#94a3b8;">No plans yet for this date.</div>',n=`
            <div class="modal-overlay annual-v2-modal" id="${e}" style="display:flex;">
                <div class="modal-content annual-day-plan-content annual-v2-modal-content" style="max-width:560px;">
                    <div class="annual-day-plan-head annual-v2-modal-head" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.7rem;">
                        <h3 style="margin:0;">${i}</h3>
                        <button type="button" class="app-system-dialog-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="annual-day-plan-list annual-v2-modal-list" style="max-height:46vh; overflow:auto; margin-bottom:0.75rem;">${a}</div>
                    <button type="button" class="action-btn" style="width:100%;" onclick="this.closest('.modal-overlay').remove(); window.app_openDayPlan('${i}')">
                        <i class="fa-solid fa-pen-to-square"></i> Add / Edit Day Plan
                    </button>
                </div>
            </div>`;window.app_showModal(n,e)};window.app_addPlanBlockUI=async()=>{const i=document.getElementById("plans-container");if(!i)return;const e=await window.AppDB.getAll("users"),t=window.AppAuth.getUser(),a=t.role==="Administrator"||t.isAdmin,n=bt(window.app_currentDayPlanTargetId,t.id),s=i.dataset.defaultScope==="annual"?"annual":"personal",d=e.filter(y=>y.id!==n).map(y=>`
            <button
                type="button"
                class="day-plan-collab-option"
                data-id="${ue(y.id)}"
                onclick="window.app_toggleTaskCollaborator(this, '${Mt(y.id)}', '${Mt(y.name)}')"
                title="Add or remove ${ue(y.name)}"
            >${ue(y.name)}</button>
        `).join(""),o=document.createElement("div");o.className="plan-block day-plan-block-shell",o.innerHTML=`
            <div class="day-plan-block-head" style="display:flex; align-items:center; justify-content:space-between; gap:0.7rem; padding:0.62rem 0.8rem; border-bottom:1px solid #dbeafe; background:linear-gradient(90deg,#f7faff 0%,#ecf4ff 100%);">
                <div class="day-plan-block-head-main" style="display:flex; align-items:center; gap:0.55rem; min-width:0;">
                    <span class="day-plan-index-badge-step" style="background:#1d4ed8; color:#fff;">${i.querySelectorAll(".plan-block").length+1}</span>
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
                                ${d||'<span class="day-plan-collab-empty">No teammates available.</span>'}
                            </div>
                        </div>
                        <div class="tags-container day-plan-tags-inline">
                            ${At()}
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
                            ${e.map(y=>`<option value="${y.id}" ${y.id===t.id?"selected":""}>${y.name}</option>`).join("")}
                        </select>
                    </div>
                `:""}
            </div>
        `,i.appendChild(o);const l=o.querySelector(".plan-start-date"),c=o.querySelector(".plan-end-date"),p=document.querySelector("#day-plan-modal .day-plan-head p")?.textContent?.match(/\d{4}-\d{2}-\d{2}/),m=p?p[0]:"";l&&(l.value=m),c&&(c.value=m);const u=o.querySelector(".plan-task");window.app_refreshPlanBlockSummary(o),u&&u.focus()};window.app_addSubPlanRow=i=>{const e=i.closest(".plan-block")?.querySelector(".sub-plans-list");if(!e)return;const t=document.createElement("div");t.className="sub-plan-row day-plan-sub-row",t.innerHTML=`
            <div class="day-plan-step-dot"></div>
            <input type="text" class="sub-plan-input day-plan-sub-input" placeholder="Add a step...">
            <button type="button" onclick="this.parentElement.remove()" title="Remove step" class="day-plan-remove-step-btn"><i class="fa-solid fa-circle-xmark"></i></button>
        `,e.appendChild(t);const a=t.querySelector("input");a&&a.focus()};window.app_checkMentions=(i,e)=>{const t=i.value,a=i.selectionStart,n=t.lastIndexOf("@",a-1),s=document.getElementById("mention-dropdown");if(s)if(n!==-1&&!t.substring(n,a).includes(" ")){const r=t.substring(n+1,a).toLowerCase(),d=e.filter(o=>o.name.toLowerCase().includes(r));if(i.id||(i.id="ta-"+Date.now()),d.length>0){const o=i.getBoundingClientRect();s.innerHTML=d.map(l=>`
                    <div onclick="window.app_applyMention('${i.id}', '${l.id}', '${l.name.replace(/'/g,"\\'")}', ${n})" class="mention-item day-plan-mention-item">
                        <img src="${l.avatar}" class="day-plan-mention-avatar" />
                        <span>${l.name}</span>
                    </div>
                `).join(""),s.style.top=`${o.bottom+6}px`,s.style.left=`${o.left}px`,s.style.display="block"}else s.style.display="none"}else s.style.display="none"};window.app_applyMention=(i,e,t,a)=>{const n=document.getElementById(i);if(!n)return;const s=n.selectionStart,r=n.value.substring(0,a),d=n.value.substring(s);n.value=`${r}${t} ${d}`,n.focus();const o=n.closest(".plan-block"),l=o?.querySelector(".tags-container");if(!l)return;const c=document.getElementById("mention-dropdown");if(c&&(c.style.display="none"),l.querySelector(`[data-id="${e}"]`))return;const m=l.querySelector(".no-tags-placeholder");m&&m.remove(),l.insertAdjacentHTML("beforeend",ia(e,t,"pending"));const u=typeof CSS<"u"&&CSS.escape?CSS.escape(e):e.replace(/"/g,'\\"'),y=o?.querySelector(`.day-plan-collab-option[data-id="${u}"]`);y&&y.classList.add("selected")};window.app_removeTagHint=i=>{const e=i.closest(".tags-container"),t=i.closest(".tag-chip"),a=t?t.dataset.id:"",n=i.closest(".plan-block");if(i.parentElement.remove(),n&&a){const s=typeof CSS<"u"&&CSS.escape?CSS.escape(a):a.replace(/"/g,'\\"'),r=n.querySelector(`.day-plan-collab-option[data-id="${s}"]`);r&&r.classList.remove("selected")}e&&e.querySelectorAll(".tag-chip").length===0&&(e.innerHTML=At())};window.app_showStatusTooltip=()=>{};window.app_hideCheckoutIntro=()=>{const i=document.getElementById("checkout-intro-panel");i&&(i.style.display="none",localStorage.setItem("checkoutIntroSeen","true"))};window.app_updateCharCounter=i=>{const e=document.getElementById("char-counter");if(e){const t=i.value.length;e.textContent=`${t} / 500 recommended`,t>500?e.style.color="#f59e0b":t>300?e.style.color="#10b981":e.style.color="#94a3b8"}};window.app_selectLocationReason=i=>{const e=document.getElementById("location-explanation");e&&(document.querySelectorAll(".location-reason-btn").forEach(t=>{t.style.background="#e0f2fe",t.style.borderColor="#7dd3fc"}),event.target.style.background="#0ea5e9",event.target.style.borderColor="#0ea5e9",event.target.style.color="white",e.value=i,e.focus())};window.app_selectOvertimeReason=(i,e,t="overtime_work")=>{const a=document.getElementById("checkout-overtime-explanation"),n=document.getElementById("checkout-overtime-mode");document.querySelectorAll(".overtime-reason-btn").forEach(s=>{s.style.background="#fef3c7",s.style.borderColor="#fcd34d",s.style.color="#92400e"}),i&&(i.style.background="#f59e0b",i.style.borderColor="#f59e0b",i.style.color="white"),n&&(n.value=t),a&&(a.value=e,a.focus())};window.app_useWorkPlan=()=>{const i=document.getElementById("checkout-plan-text"),e=document.getElementById("checkout-work-summary"),t=i?.dataset?.rawText;t&&e&&(e.value=t,window.app_updateCharCounter&&window.app_updateCharCounter(e),e.focus(),e.style.borderColor="#8b5cf6",e.style.background="#f5f3ff",setTimeout(()=>{e.style.borderColor="#e2e8f0",e.style.background="#ffffff"},1e3))};window.app_deleteDayPlan=async(i,e=null,t=null)=>{if(!await window.appConfirm("Are you sure you want to delete this work plan?"))return;const a=window.AppAuth.getUser(),n=bt(e,a.id);try{t==="personal"||t==="annual"?await window.AppCalendar.deleteWorkPlan(i,n,{planScope:t}):await Promise.all([window.AppCalendar.deleteWorkPlan(i,n,{planScope:"personal"}),window.AppCalendar.deleteWorkPlan(i,n,{planScope:"annual"})]),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert("Plan deleted!"),document.getElementById("day-plan-modal")?.remove();const r=await window.AppUI.renderDashboard(),d=document.getElementById("page-content");d&&(d.innerHTML=r,window.setupDashboardEvents&&window.setupDashboardEvents())}catch(s){alert(s.message)}};window.app_saveDayPlan=async(i,e,t=null)=>{i.preventDefault();const a=window.AppAuth.getUser(),n=bt(t,a.id),s=i.target,r=s?.dataset?.hadPersonal==="1",d=s?.dataset?.hadAnnual==="1",o=document.querySelectorAll(".plan-block"),l=[],c=[],p=[],m={};let u="";if(o.forEach(y=>{const g=y.querySelector(".plan-task").value.trim(),h=y.querySelectorAll(".sub-plan-input"),f=Array.from(h).map(S=>S.value.trim()).filter(S=>S!==""),v=y.querySelectorAll(".tag-chip"),b=Array.from(v).map(S=>({id:S.dataset.id,name:S.dataset.name,status:S.dataset.status||"pending"})),k=y.querySelector(".plan-status").value,w=y.querySelector(".plan-assignee"),A=w?w.value:n,$=y.querySelector(".plan-start-date"),I=y.querySelector(".plan-end-date"),L=$?String($.value||"").trim():"",T=I?String(I.value||"").trim():"",B=y.querySelector(".plan-scope"),E=B&&B.value==="annual"?"annual":"personal";if(g){if(L&&!T||!L&&T){u="Please select both From Date and To Date for ranged tasks.";return}if(L&&T&&T<L){u="To Date cannot be earlier than From Date.";return}const P={task:g,subPlans:f,tags:b,status:k||null,assignedTo:A||null,startDate:L||e,endDate:T||e,planScope:E,completedDate:k==="completed"?new Date().toISOString().split("T")[0]:null};l.push(P),E==="annual"?p.push(P):c.push(P)}}),l.length===0){alert(u||"Please add at least one task.");return}if(u){alert(u);return}try{c.length>0?(await window.AppCalendar.setWorkPlan(e,c,n,{planScope:"personal"}),m.personal=window.AppCalendar.getWorkPlanId(e,n,"personal")):r&&await window.AppCalendar.deleteWorkPlan(e,n,{planScope:"personal"}),p.length>0?(await window.AppCalendar.setWorkPlan(e,p,n,{planScope:"annual"}),m.annual=window.AppCalendar.getWorkPlanId(e,n,"annual")):d&&await window.AppCalendar.deleteWorkPlan(e,n,{planScope:"annual"}),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans();const y=await window.AppDB.getAll("users");if(n!==a.id&&(a.role==="Administrator"||a.isAdmin)){const v=y.find(b=>b.id===n);if(v){v.notifications||(v.notifications=[]);const b=v.notifications[v.notifications.length-1];(!b||b.message!==`Admin ${a.name} has edited your Work Plan for ${e}`)&&(v.notifications.push({type:"admin_edit",message:`Admin ${a.name} has edited your Work Plan for ${e}`,date:new Date().toLocaleString(),read:!1}),await window.AppDB.put("users",v))}}const g=new Set;if(l.forEach(v=>{v.tags&&v.tags.forEach(b=>g.add(b.id))}),g.size>0){for(const v of g){const b=y.find(k=>k.id===v);b&&v!==a.id&&(b.notifications||(b.notifications=[]),l.forEach((k,w)=>{if(k.tags&&k.tags.some(A=>A.id===v)){const A=k.planScope==="annual"?"annual":"personal",$=m[A]||window.AppCalendar.getWorkPlanId(e,n,A);b.notifications.some(L=>L.type==="mention"&&L.planId===$&&L.taskIndex===w)||b.notifications.push({id:`tag_${Date.now()}_${v}_${w}`,type:"tag",title:k.task||"Tagged task",description:k.subPlans&&k.subPlans.length>0?k.subPlans.join(", "):"",taggedById:a.id,taggedByName:a.name,taggedAt:new Date().toISOString(),status:"pending",source:"plan",planId:$,taskIndex:w,message:`${a.name} tagged you in: "${k.task}" for ${e}`,date:new Date().toLocaleString(),read:!1})}}),await window.AppDB.put("users",b))}for(let v=0;v<l.length;v++){const b=l[v];if(b.tags)for(const k of b.tags){if(k.id===n)continue;const w=y.find(T=>T.id===k.id);if(!w||!window.AppCalendar)continue;const A=b.planScope==="annual"?"annual":"personal",$=m[A]||window.AppCalendar.getWorkPlanId(e,n,A),I=b.subPlans&&b.subPlans.length>0?` - ${b.subPlans.join(", ")}`:"",L=`${b.task}${I} (Responsible: ${w.name})`;await window.AppCalendar.addWorkPlanTask(e,w.id,L,[{id:a.id,name:a.name,status:"pending"}],{addedFrom:"tag",sourcePlanId:$,sourceTaskIndex:v,taggedById:a.id,taggedByName:a.name,status:"pending",subPlans:b.subPlans||[],startDate:b.startDate||e,endDate:b.endDate||b.startDate||e})}}}alert("Plans saved successfully!"),document.getElementById("day-plan-modal")?.remove();const h=await window.AppUI.renderDashboard(),f=document.getElementById("page-content");f&&(f.innerHTML=h,window.setupDashboardEvents&&window.setupDashboardEvents())}catch(y){alert(y.message)}};window.app_handleTagResponse=async(i,e,t,a)=>{const n=window.AppAuth.getUser();try{const s=i?await window.AppDB.get("work_plans",i).catch(()=>null):null;if(!s||!s.plans||!s.plans[e]){console.warn(`app_handleTagResponse: plan/task not found for planId=${i}, taskIdx=${e}. Falling back to notification-only update.`);const c=await window.AppDB.get("users",n.id).catch(()=>null),p=c?.notifications?.[a]?.id||null;if(p||a>=0)await window.app_handleTagDecision(p||String(a),t);else{if(c?.notifications?.[a]){const u=new Date().toISOString();c.notifications[a].status=t,c.notifications[a].respondedAt=u,c.notifications[a].read=!0,c.notifications[a].dismissedAt=u,await window.AppDB.put("users",c)}const m=document.getElementById("page-content");m&&(m.innerHTML=await window.AppUI.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),alert(`You have ${t} the request.`)}return}const r=s.plans[e];if(r.tags){const c=r.tags.find(p=>p.id===n.id);c&&(c.status=t)}await window.AppDB.put("work_plans",s);const d=await window.AppDB.get("users",n.id);let o="";if(t==="rejected"&&(o=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Task",confirmText:"Submit Reason"})||""),d&&d.notifications){const c=d.notifications[a];if(c){const p=new Date().toISOString();c.status=t,c.respondedAt=p,c.read=!0,c.dismissedAt=p,o&&(c.rejectReason=o)}d.tagHistory||(d.tagHistory=[]),d.tagHistory.unshift({id:`taghist_${Date.now()}`,type:"tag_response",title:c?.title||s.plans[e].task||"Tagged task",taggedByName:c?.taggedByName||s.userName||"Staff",status:t,reason:o,date:new Date().toISOString()}),await window.AppDB.put("users",d)}if(s.userId){const c=await window.AppDB.get("users",s.userId);c&&(c.notifications||(c.notifications=[]),c.notifications.unshift({id:`tagresp_${Date.now()}`,type:"tag_response",message:`${n.name} ${t} your tag request.`,title:s.plans[e].task,taggedByName:n.name,status:t,reason:o,date:new Date().toISOString(),read:!1}),await window.AppDB.put("users",c))}window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans();const l=document.getElementById("page-content");l&&(l.innerHTML=await window.AppUI.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),alert(`You have ${t} the collaboration request.`)}catch(s){console.error("app_handleTagResponse error:",s),alert("Error processing your response. Please try again.")}};window.app_changeCalMonth=i=>{let e=window.app_calMonth+i;e<0&&(window.app_calYear--,e=11),e>11&&(window.app_calYear++,e=0),window.app_calMonth=e,window.AppUI.renderDashboard().then(async t=>{const a=document.getElementById("page-content");a.innerHTML=t,de()})};window.app_exportCalendar=async()=>{const i=window._currentPlans,e=window.app_calMonth,t=window.app_calYear;if(!i){alert("Calendar data not loaded yet.");return}try{await window.AppReports.exportCalendarPlansCSV(i,e,t)}catch(a){alert("Export failed: "+a.message)}};window.app_newMeeting=async()=>{const i=window.AppAuth.getUser(),e={id:"meeting_"+Date.now(),title:"",date:new Date().toISOString().split("T")[0],minutes:"",author:i.name,timestamp:new Date().toISOString()};await window.AppDB.put("meetings",e),window._selectedMeetingId=e.id;const t=document.getElementById("page-content");t.innerHTML=await window.AppUI.renderMinutes()};window.app_selectMeeting=async i=>{window._selectedMeetingId=i;const e=document.getElementById("page-content");e.innerHTML=await window.AppUI.renderMinutes()};window.app_saveMeeting=async()=>{const i=document.getElementById("meeting-title")?.value,e=document.getElementById("meeting-date")?.value,t=document.getElementById("meeting-minutes")?.value;if(!window._selectedMeetingId){alert("No meeting selected");return}const a=await window.AppDB.get("meetings",window._selectedMeetingId);if(!a){alert("Meeting not found");return}a.title=i,a.date=e,a.minutes=t,a.timestamp=new Date().toISOString(),await window.AppDB.put("meetings",a);const n=document.getElementById("page-content");n.innerHTML=await window.AppUI.renderMinutes(),alert("Meeting minutes saved successfully!")};window.app_deleteMeeting=async i=>{if(!await window.appConfirm("Are you sure you want to delete this meeting?"))return;await window.AppDB.delete("meetings",i),window._selectedMeetingId=null;const e=document.getElementById("page-content");e.innerHTML=await window.AppUI.renderMinutes()};window.app_postponeTask=async(i,e,t)=>{if(t)try{const a=window.AppAuth.getUser();await window.AppCalendar.updateTaskStatus(i,e,"postponed");const n=await window.AppDB.get("work_plans",i),s=n?.plans?.[e],r=s&&s.subPlans&&s.subPlans.length?` - ${s.subPlans.join(", ")}`:"",d=s?`${s.task}${r}`:"",o=n?.date||new Date().toISOString().split("T")[0],c=`${d.replace(/\s*\(Postponed from [^)]+\)\s*$/i,"")} (Postponed from ${o})`;await window.AppCalendar.addWorkPlanTask(t,a.id,c,[],{addedFrom:"postponed",sourcePlanId:i,sourceTaskIndex:e,postponedFromDate:o}),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert(`Task postponed to ${t}`),typeof ye=="function"&&await ye()}catch(a){alert("Failed to postpone task: "+a.message)}};window.app_openPostponeModal=function(i,e){const t="postpone-task-modal";document.getElementById(t)?.remove();const a=new Date(Date.now()+864e5).toISOString().split("T")[0],n=`
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
                        <button type="button" class="action-btn" onclick="window.app_confirmPostponeTask('${i}', ${e})" style="padding:0.55rem 0.9rem;">Confirm</button>
                    </div>
                </div>
            </div>`;window.app_showModal(n,t)};window.app_confirmPostponeTask=async function(i,e){const t=document.getElementById("postpone-date-input")?.value;if(!t)return alert("Please select a date.");document.getElementById("postpone-task-modal")?.remove(),await window.app_postponeTask(i,e,t)};window.app_openDelegateModal=async function(i,e){const t="delegate-task-modal";document.getElementById(t)?.remove();const a=await window.AppDB.getAll("users").catch(()=>[]),n=window.AppAuth.getUser(),s=(a||[]).filter(o=>o.id!==n.id);window.app_delegateModalContext={planId:i,taskIndex:e,selectedUserId:""};const r=s.map(o=>`
            <button type="button" class="delegate-picker-item" data-user-id="${o.id}" data-name="${(o.name||"").toLowerCase()}" onclick="window.app_selectDelegateUser('${o.id}')">
                <img src="${o.avatar||""}" alt="${o.name}" class="delegate-user-avatar">
                <span>${o.name}</span>
            </button>
        `).join(""),d=`
            <div class="modal-overlay" id="${t}" style="display:flex;">
                <div class="modal-content" style="max-width:480px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                        <h3 style="margin:0; font-size:1.05rem;">Delegate Task</h3>
                        <button type="button" onclick="document.getElementById('${t}')?.remove()" style="background:none; border:none; font-size:1.1rem; cursor:pointer;">&times;</button>
                    </div>
                    <input id="delegate-search-input" type="text" placeholder="Search staff..." oninput="window.app_filterDelegateUsers(this.value)" style="width:100%; padding:0.6rem; border:1px solid #d1d5db; border-radius:8px; margin-bottom:0.7rem;">
                    <div id="delegate-picker-list" class="delegate-picker-list">${r||'<div style="font-size:0.85rem; color:#64748b;">No staff available.</div>'}</div>
                    <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
                        <button type="button" class="action-btn secondary" onclick="document.getElementById('${t}')?.remove()" style="padding:0.55rem 0.9rem;">Cancel</button>
                        <button type="button" id="delegate-confirm-btn" class="action-btn" onclick="window.app_confirmDelegateTask()" style="padding:0.55rem 0.9rem;" disabled>Delegate</button>
                    </div>
                </div>
            </div>`;window.app_showModal(d,t)};window.app_filterDelegateUsers=function(i){const e=String(i||"").toLowerCase().trim();Array.from(document.querySelectorAll("#delegate-picker-list .delegate-picker-item")).forEach(t=>{const a=t.getAttribute("data-name")||"";t.style.display=!e||a.includes(e)?"flex":"none"})};window.app_selectDelegateUser=function(i){if(!window.app_delegateModalContext)return;window.app_delegateModalContext.selectedUserId=i,Array.from(document.querySelectorAll("#delegate-picker-list .delegate-picker-item")).forEach(t=>{t.classList.toggle("selected",t.getAttribute("data-user-id")===i)});const e=document.getElementById("delegate-confirm-btn");e&&(e.disabled=!i)};window.app_confirmDelegateTask=async function(){const i=window.app_delegateModalContext;if(!i||!i.selectedUserId)return alert("Please select a staff member.");document.getElementById("delegate-task-modal")?.remove(),await window.app_delegateTo(i.planId,i.taskIndex,i.selectedUserId)};window.app_formatTaskWithPostponeChip=function(i){const e=String(i||""),t=e.match(/^(.*)\s+\(Postponed from ([^)]+)\)\s*$/i);if(!t)return e;const a=t[1].trim(),n=t[2].trim();return`${a} <span class="postponed-source-chip">Postponed from ${n}</span>`};window.app_appendCompletedTaskToSummary=async function(i,e){const a=(await window.AppDB.get("work_plans",i))?.plans?.[e];if(!a)return;const n=a.subPlans&&a.subPlans.length?` (${a.subPlans.join(", ")})`:"",s=`- ${a.task}${n}`,r=document.getElementById("checkout-work-summary"),d=(r?.value||window.app_checkoutSummaryDraft||"").trim(),l=d.split(`
`).some(c=>c.trim()===s.trim())?d:d?`${d}
${s}`:s;window.app_checkoutSummaryDraft=l,r&&(r.value=l,window.app_updateCharCounter&&window.app_updateCharCounter(r))};window.app_handleChecklistAction=async function(i,e,t){const a=document.getElementById("checkout-task-checklist"),n=document.getElementById("delegate-panel");window.app_checkoutTaskActions=window.app_checkoutTaskActions||{};const s=`${i}:${e}`;if(!t){delete window.app_checkoutTaskActions[s],n&&(n.style.display="none"),a&&a.classList.remove("delegate-open");return}if(window.app_checkoutTaskActions[s]=t,t==="complete"){n&&(n.style.display="none"),a&&a.classList.remove("delegate-open"),await window.app_appendCompletedTaskToSummary(i,e),await window.app_markTaskCompleted(i,e);return}if(t==="postpone"){n&&(n.style.display="none"),a&&a.classList.remove("delegate-open"),await window.app_openPostponeModal(i,e);return}t==="delegate"&&(n&&(n.style.display="none"),a&&a.classList.remove("delegate-open"),await window.app_openDelegateModal(i,e))};window.app_markTaskCompleted=async function(i,e){try{const t=new Date().toISOString().split("T")[0];await window.AppCalendar.updateTaskStatus(i,e,"completed",t),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert("Task marked as completed."),typeof ye=="function"&&await ye()}catch(t){alert("Failed to mark completed: "+t.message)}};window.app_delegateTask=async function(i,e){try{const t=await window.AppDB.getAll("users"),a=t.map(r=>r.name).join(", "),n=await window.appPrompt(`Delegate to which staff? Enter name.
Available: ${a}`,"",{title:"Delegate Task",placeholder:"Type staff name"});if(!n)return;const s=t.find(r=>r.name.toLowerCase()===n.toLowerCase());if(!s){alert("Staff not found.");return}await window.app_delegateTo(i,e,s.id)}catch(t){alert("Failed to delegate task: "+t.message)}};window.app_delegateTo=async function(i,e,t){try{const a=await window.AppDB.get("work_plans",i);if(!a||!a.plans||!a.plans[e]){alert("Task not found.");return}const n=window.AppAuth.getUser(),s=a.plans[e],r=s.subPlans&&s.subPlans.length?` — ${s.subPlans.join(", ")}`:"",d=`${s.task}${r}`;s.tags||(s.tags=[]);const l=(await window.AppDB.getAll("users")).find(p=>p.id===t);if(!l){alert("Staff not found.");return}s.tags.some(p=>p.id===l.id)||s.tags.push({id:l.id,name:l.name,status:"pending"}),s.status=s.status||"pending",a.updatedAt=new Date().toISOString(),await window.AppDB.put("work_plans",a),await window.AppCalendar.addWorkPlanTask(a.date,l.id,d,[{id:n.id,name:n.name,status:"pending"}],{addedFrom:"delegated",sourcePlanId:i,sourceTaskIndex:e,taggedById:n.id,taggedByName:n.name,status:"pending",subPlans:s.subPlans||[]});const c=await window.AppDB.get("users",l.id);c&&(c.notifications||(c.notifications=[]),c.notifications.unshift({id:`task_${Date.now()}`,type:"task",title:s.task||"Delegated task",description:s.subPlans&&s.subPlans.length>0?s.subPlans.join(", "):"",taggedById:n.id,taggedByName:n.name,taggedAt:new Date().toISOString(),status:"pending",source:"delegation",date:new Date().toLocaleString(),read:!1}),await window.AppDB.put("users",c)),window.AppStore&&window.AppStore.invalidatePlans&&window.AppStore.invalidatePlans(),alert(`Task delegated to ${l.name}.`),typeof ye=="function"&&await ye()}catch(a){alert("Failed to delegate task: "+a.message)}};function sa(i,e,t,a){if(!i||!e||!t||!a)return 0;const n=6371e3,s=i*Math.PI/180,r=t*Math.PI/180,d=(t-i)*Math.PI/180,o=(a-e)*Math.PI/180,l=Math.sin(d/2)*Math.sin(d/2)+Math.cos(s)*Math.cos(r)*Math.sin(o/2)*Math.sin(o/2),c=2*Math.atan2(Math.sqrt(l),Math.sqrt(1-l));return n*c}const oa=480*60*1e3,un=540*60*1e3,Et=(i,e)=>{if(!i||!e)return null;const t=String(i).trim(),a=String(e).trim();if(!t||!a||a.toLowerCase().includes("active now"))return null;const n=new Date(`${t}T${a}`);if(!Number.isNaN(n.getTime()))return n;const s=new Date(`${t} ${a}`);return Number.isNaN(s.getTime())?null:s},mn=async(i,e,t)=>{if(!i||!window.AppDB||t<=e)return!1;const a=await window.AppDB.getAll("attendance"),n=String(i);return(a||[]).some(s=>{if(!s||String(s.user_id||"")!==n||!s.isManualOverride)return!1;const r=Et(s.date,s.checkIn),d=Et(s.date,s.checkOut);if(!r||!d)return!1;let o=r.getTime(),l=d.getTime();l<=o&&(l+=1440*60*1e3);const c=Math.max(e,o);return Math.min(t,l)>c})},fn=async i=>{const e={showPrompt:!1,hasManualLog:!1,overtimeStartMs:null,overtimeEndMs:null};if(!i||!i.lastCheckIn)return e;const t=Number(i.lastCheckIn);if(!Number.isFinite(t))return e;const a=Date.now();if(a-t<=un)return e;const s=t+oa;return await mn(i.id,s,a)?{showPrompt:!1,hasManualLog:!0,overtimeStartMs:s,overtimeEndMs:a}:{showPrompt:!0,hasManualLog:!1,overtimeStartMs:s,overtimeEndMs:a}};window.app_prepareCheckoutOvertimeSection=async i=>{const e=document.getElementById("checkout-overtime-section"),t=document.getElementById("checkout-overtime-explanation"),a=document.getElementById("checkout-overtime-mode"),n=document.getElementById("checkout-overtime-hint");if(window.app_checkoutOvertimeState={showPrompt:!1,hasManualLog:!1},!(!e||!t||!a)){e.style.display="none",t.required=!1,t.value="",a.value="overtime_work",document.querySelectorAll(".overtime-reason-btn").forEach(s=>{s.style.background="#fef3c7",s.style.borderColor="#fcd34d",s.style.color="#92400e"});try{const s=await fn(i);if(window.app_checkoutOvertimeState=s,!s.showPrompt)return;n&&(n.textContent="You worked over 1 hour extra. Please capture what was done during overtime."),e.style.display="block",t.required=!0}catch(s){console.warn("Overtime prompt check failed:",s)}}};async function ye(){const i=document.getElementById("attendance-btn"),e=document.getElementById("location-text"),{status:t}=await window.AppAttendance.getStatus();i&&(i.disabled=!0),Ee=!0;try{if(t==="out"){i&&(i.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Locating...');const a=await window.getLocation(),n=`Lat: ${a.lat.toFixed(4)}, Lng: ${a.lng.toFixed(4)}`;e&&(e.innerHTML=`<i class="fa-solid fa-location-dot"></i> ${n}`);const s=await window.AppAttendance.checkIn(a.lat,a.lng,n);if(s&&s.conflict){window.app_showSyncToast(s.message||"Status updated from another device."),window.app_refreshDashboard&&await window.app_refreshDashboard();return}tt(),window.app_refreshDashboard&&await window.app_refreshDashboard(),s&&s.resolvedMissedCheckout&&s.noticeMessage&&window.app_showAttendanceNotice(s.noticeMessage),window.AppDayPlan&&typeof window.AppDayPlan.openDayPlan=="function"&&await window.AppDayPlan.openDayPlan(Tt())}else{const a=window.AppAuth.getUser(),n=Tt(),s=await window.AppCalendar.getWorkPlan(a.id,n,{includeAnnual:!0,mergeAnnual:!0}),r=await window.AppCalendar.getCollaborations(a.id,n);window.app_checkoutSummaryDate!==n&&(window.app_checkoutSummaryDate=n,window.app_checkoutSummaryDraft=""),window.app_checkoutActionDate!==n&&(window.app_checkoutActionDate=n,window.app_checkoutTaskActions={});const d=document.getElementById("modal-container");d&&!document.getElementById("checkout-modal")&&d.insertAdjacentHTML("beforeend",window.AppUI.renderModals());const o=document.getElementById("checkout-modal");if(o){const l=document.getElementById("checkout-plan-text"),c=o.querySelector('textarea[name="description"]');if(s&&(s.plans||s.plan)){let u="",y="";if(s.plans&&s.plans.length>0?(u=s.plans.map((k,w)=>`<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; padding-bottom:12px; border-bottom:1px dashed #e9d5ff;">
                                    <div style="flex:1;">
                                        <div style="font-weight:600; color:#4c1d95;">${window.app_formatTaskWithPostponeChip(k.task)}</div>
                                        ${k.subPlans&&k.subPlans.length>0?`<div style="font-size:0.75rem; color:#7c3aed; margin-top:2px;">👣 ${k.subPlans.join(", ")}</div>`:""}
                                    </div>
                                    <div style="display:flex; gap:6px; flex-shrink:0;">
                                        ${k.status==="completed"?'<span style="font-size:0.75rem; color:#059669; font-weight:700;">✅ Done</span>':`<button type="button" onclick="window.app_postponeTask('${k._planId||s.id}', ${typeof k._taskIndex=="number"?k._taskIndex:w})" style="background:#f3e8ff; color:#7c3aed; border:1px solid #ddd6fe; border-radius:8px; padding:6px 12px; font-size:0.8rem; font-weight:600; cursor:pointer;" onmouseover="this.style.background='#ddd6fe'" onmouseout="this.style.background='#f3e8ff'">⌛ Postpone</button>`}
                                    </div>
                                </div>`).join(""),y=s.plans.filter(k=>window.AppCalendar.getSmartTaskStatus(s.date,k.status)==="completed").map(k=>{let w=`• ${k.task}`;return k.subPlans&&k.subPlans.length>0&&(w+=` (${k.subPlans.join(", ")})`),w}).join(`
`)):s.plan&&(u=`<div style="font-weight:600; color:#4c1d95;">${s.plan}</div>`,y=`• ${s.plan}`,s.subPlans&&s.subPlans.length>0&&(u+=`<div style="font-size:0.75rem; color:#7c3aed; margin-top:2px;">👣 ${s.subPlans.join(", ")}</div>`,y+=` (${s.subPlans.join(", ")})`)),r&&r.length>0){const b=r.map(k=>k.plans.filter(w=>w.tags&&w.tags.some(A=>A.id===a.id&&A.status==="accepted")).map(w=>{let A=`🤝 [Collaborated with ${k.userName}] ${w.task}`;return w.subPlans&&w.subPlans.length>0&&(A+=`
👣 Steps: `+w.subPlans.join(", ")),A}).join(`
`)).join(`

`);u?u+=`

`+b:u=b}l&&(l.innerHTML=u),l&&(l.dataset.rawText=y),c&&!c.value.trim()&&window.app_checkoutSummaryDraft&&(c.value=window.app_checkoutSummaryDraft,window.app_updateCharCounter&&window.app_updateCharCounter(c));const g=document.getElementById("checkout-task-list"),h=document.getElementById("delegate-panel"),f=document.getElementById("delegate-list"),v=document.getElementById("delegate-selected-task");if(g)if(s&&Array.isArray(s.plans)&&s.plans.length>0){const b=await window.AppDB.getAll("users").catch(()=>[]),k=s.plans.map((w,A)=>{const $=w.subPlans&&w.subPlans.length?` — ${w.subPlans.join(", ")}`:"",I=`${w.task}${$}`,L=w._planId||s.id,T=typeof w._taskIndex=="number"?w._taskIndex:A,B=window.AppCalendar.getSmartTaskStatus(w._planDate||s.date,w.status),E=`${L}:${T}`,_=(window.app_checkoutTaskActions&&window.app_checkoutTaskActions[E]?window.app_checkoutTaskActions[E]:"")||(w.status==="completed"||B==="completed"?"complete":w.status==="postponed"?"postpone":""),P=B==="completed"?"Completed":B==="in-process"?"In Process":B==="overdue"?"Overdue":B==="to-be-started"?"To Be Started":w.status||"Pending";return`
                                        <div class="checkout-task-row">
                                            <div class="checkout-task-copy">
                                                <div class="checkout-task-title">${window.app_formatTaskWithPostponeChip(I)}</div>
                                                <div class="checkout-task-status">Status: ${P}</div>
                                            </div>
                                            <select onchange="window.app_handleChecklistAction('${L}', ${T}, this.value)" class="checkout-task-action-select">
                                                <option value="" ${_?"":"selected"}>Choose Action</option>
                                                <option value="complete" ${_==="complete"?"selected":""}>Complete</option>
                                                <option value="postpone" ${_==="postpone"?"selected":""}>Postpone</option>
                                                <option value="delegate" ${_==="delegate"?"selected":""}>Delegate</option>
                                            </select>
                                        </div>`}).join("");if(g.innerHTML=k,h&&f&&v){h.style.display="none";const w=document.getElementById("checkout-task-checklist");w&&w.classList.remove("delegate-open");const A=window.AppAuth.getUser(),$=(b||[]).filter(I=>I.id!==A.id);f.innerHTML=$.map(I=>`
                                        <button type="button" data-user-id="${I.id}" class="delegate-user-btn">
                                            <img src="${I.avatar}" alt="${I.name}" class="delegate-user-avatar">
                                            <span style="flex:1;">${I.name}</span>
                                        </button>
                                    `).join("")}}else g.innerHTML='<div style="font-size:0.8rem; color:#6b7280;">No tasks planned for today.</div>'}await window.app_prepareCheckoutOvertimeSection(a),o.style.display="flex",i&&(i.disabled=!1);const p=document.getElementById("checkout-location-mismatch"),m=document.getElementById("checkout-location-loading");m&&(m.style.display="block"),p&&(p.style.display="none"),(async()=>{try{const u=await window.getLocation(),y=a.currentLocation||a.lastLocation;m&&(m.style.display="none"),y&&y.lat&&y.lng&&(sa(u.lat,u.lng,y.lat,y.lng)>500?p&&(p.style.display="block"):p&&(p.style.display="none"))}catch(u){console.warn("Background location check failed:",u),m&&(m.style.display="none")}})()}else{const l=await window.AppAttendance.checkOut();l&&!l.conflict&&tt(),l&&l.conflict&&window.app_showSyncToast(l.message||"Status updated from another device.");const c=document.getElementById("page-content");c.innerHTML=await window.AppUI.renderDashboard(),de()}}}catch(a){alert(a.message||a),i&&(i.disabled=!1,i.innerHTML=t==="out"?'Check-in <i class="fa-solid fa-fingerprint"></i>':'Check-out <i class="fa-solid fa-fingerprint"></i>')}finally{Ee=!1}}window.app_submitCheckOut=async function(i){i.preventDefault();const e=i.target,t=e.description.value,a=e.querySelector('button[type="submit"]');Ee=!0;try{a.disabled=!0,a.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Locating & Saving...';let n=null,s=null;try{n=await window.getLocation()}catch(f){s=f}let r=!1;const d=window.AppAuth.getUser()?.currentLocation;n&&(n=ve&&Date.now()-$e<Gt?ve:n,d&&d.lat&&d.lng&&n.lat&&n.lng&&sa(n.lat,n.lng,d.lat,d.lng)>500&&(r=!0));const o=e.locationExplanation?e.locationExplanation.value.trim():"",l=window.app_checkoutOvertimeState||{},c=e.overtimeExplanation?e.overtimeExplanation.value.trim():"",p=e.overtimeMode?String(e.overtimeMode.value||"overtime_work"):"overtime_work",m={};if(l.showPrompt){if(!c){alert("Please describe the overtime work before checkout."),a.disabled=!1,a.textContent="Complete Check-Out";return}if(m.overtimePrompted=!0,m.overtimeExplanation=c,m.overtimeReasonTag=p,p==="forgot_checkout"){const f=Number(window.AppAuth.getUser()?.lastCheckIn);Number.isFinite(f)&&(m.checkOutTime=new Date(f+oa).toISOString(),m.overtimeCappedToEightHours=!0)}}if(!n&&!o){const f=document.getElementById("checkout-location-mismatch");f&&(f.style.display="block"),alert("Location unavailable. Please provide a reason for checking out from a different location."),a.disabled=!1,a.textContent="Complete Check-Out";return}const u=n?`Lat: ${Number(n.lat).toFixed(4)}, Lng: ${Number(n.lng).toFixed(4)}`:"Location unavailable (reason provided)",y=e.tomorrowGoal?e.tomorrowGoal.value.trim():"";if(y){const f=new Date(Date.now()+864e5).toISOString().split("T")[0];await window.AppCalendar.addWorkPlanTask(f,window.AppAuth.getUser().id,y),console.log("Tomorrow's goal saved:",y)}const g=await window.AppAttendance.checkOut(t,n?n.lat:null,n?n.lng:null,u,r||!n,o||(s?String(s):""),m);if(g&&g.conflict){const f=document.getElementById("checkout-modal");f&&(f.style.display="none"),window.app_showSyncToast(g.message||"Status updated from another device.");const v=document.getElementById("page-content");v&&(v.innerHTML=await window.AppUI.renderDashboard(),de());return}tt(),window.app_checkoutSummaryDraft="",document.getElementById("checkout-modal").style.display="none";const h=document.getElementById("page-content");h&&(h.innerHTML=await window.AppUI.renderDashboard(),de())}catch(n){alert("Check-out failed: "+n.message),a.disabled=!1,a.textContent="Complete Check-Out"}finally{Ee=!1}};async function yn(i){i.preventDefault();const e=new FormData(i.target),t=St(e.get("checkIn"),e.get("checkOut"));if(t==="Invalid"){alert("End time must be after Start time");return}const a=e.get("date"),n=e.get("checkIn"),s=e.get("checkOut"),r=window.AppAttendance.buildDateTime(a,n),d=window.AppAttendance.buildDateTime(a,s),o=r&&d?d-r:0,l=Math.max(0,o)/(1e3*60*60),c=l>=4;let p="Work Log",m=0;l>=8?(p="Present",m=1):l>=4&&(p="Half Day",m=.5);const u={date:e.get("date"),checkIn:n,checkOut:s,duration:t,durationMs:o,location:e.get("location"),workDescription:e.get("location"),type:p,dayCredit:m,lateCountable:!1,extraWorkedMs:0,policyVersion:"v2",entrySource:"staff_manual_work",attendanceEligible:c,isManualOverride:!1};await window.AppAttendance.addManualLog(u),alert("Log added successfully!"),document.getElementById("log-modal").style.display="none",Q.innerHTML=await window.AppUI.renderTimesheet()}async function wn(i){i.preventDefault();const e=new FormData(i.target),t=e.get("name").trim(),a=e.get("username").trim(),n=e.get("password").trim(),s=e.get("email").trim(),r=e.get("isAdmin")==="on"||e.get("isAdmin")==="true",d=e.get("canManageAttendanceSheet")==="on"||e.get("canManageAttendanceSheet")==="true",o={id:"u"+Date.now(),name:t,username:a,password:n,role:e.get("role"),dept:e.get("dept"),email:s,phone:e.get("phone"),joinDate:e.get("joinDate"),isAdmin:r,canManageAttendanceSheet:d,permissions:window.app_getPermissionsFromUI("add"),avatar:`https://ui-avatars.com/api/?name=${e.get("name")}&background=random&color=fff`,status:"out",lastCheckIn:null};try{o.isAdmin?(o.role="Administrator",o.canManageAttendanceSheet=!0):o.isAdmin=!1,await window.AppDB.add("users",o),alert("Success! Account created."),document.getElementById("add-user-modal").style.display="none";const l=document.getElementById("page-content");l&&(l.innerHTML=await window.AppUI.renderAdmin())}catch(l){alert("Error creating user: "+l.message)}}window.app_getPermissionsFromUI=i=>{const e={};return["dashboard","leaves","users","attendance","reports","minutes","policies"].forEach(a=>{const n=document.getElementById(`${i}-perm-${a}-view`),s=document.getElementById(`${i}-perm-${a}-admin`);s&&s.checked?e[a]="admin":n&&n.checked?e[a]="view":e[a]=null}),e};window.app_submitEditUser=async i=>{i&&i.preventDefault();const e=i&&i.target&&i.target.tagName==="FORM"?i.target:document.getElementById("edit-user-form");if(!e){console.error("Critical Failure: Edit user form not found."),alert("Error: Form missing.");return}const t=new FormData(e),a=(t.get("id")||"").trim();if(!a){console.error("Data Failure: No 'id' name attribute found in form data.",{target:i.target,allData:Object.fromEntries(t.entries())}),alert("Error: User ID missing. Please refresh.");return}const n=e.querySelector('[name="isAdmin"]'),s=!!(n&&n.checked),r=e.querySelector('[name="canManageAttendanceSheet"]'),d=!!(r&&r.checked),o=(f,v)=>{const b=String(f||"").trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(b))return"NA";const k=b.replace(/-/g,""),w=String(v||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase().slice(-3)||"USR";return`EMP-${k}-${w}`},l=String(t.get("pan")||"").trim().toUpperCase(),c=String(t.get("bankIfsc")||"").trim().toUpperCase(),p=String(t.get("joinDate")||"").trim(),m=String(t.get("employeeId")||"").trim(),u=/^[A-Z]{5}[0-9]{4}[A-Z]$/,y=/^[A-Z]{4}0[A-Z0-9]{6}$/;if(p){const f=new Date,v=`${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,"0")}-${String(f.getDate()).padStart(2,"0")}`;if(p>v){alert("Join Date cannot be in the future.");return}}if(l&&!u.test(l)){alert("Invalid PAN format. Use format like ABCDE1234F");return}if(c&&!y.test(c)){alert("Invalid IFSC format. Use format like SBIN0001234");return}const g=p?m||o(p,a):"NA",h={id:a,name:(t.get("name")||"").trim(),username:(t.get("username")||"").trim(),password:(t.get("password")||"").trim(),role:t.get("role"),dept:t.get("dept"),email:(t.get("email")||"").trim(),phone:(t.get("phone")||"").trim(),isAdmin:s,canManageAttendanceSheet:d,employeeId:g,joinDate:p||null,baseSalary:Number(t.get("baseSalary")||0),otherAllowances:Number(t.get("otherAllowances")||0),providentFund:Number(t.get("providentFund")||0),professionalTax:Number(t.get("professionalTax")||0),loanAdvance:Number(t.get("loanAdvance")||0),tdsPercent:Number(t.get("tdsPercent")||0),bankName:(t.get("bankName")||"").trim(),bankAccount:(t.get("bankAccount")||"").trim(),bankIfsc:c,pan:l,uan:(t.get("uan")||"").trim(),permissions:window.app_getPermissionsFromUI("edit")};console.log("Executing Update for User:",h),h.isAdmin&&(h.canManageAttendanceSheet=!0,h.role="Administrator");try{if(await window.AppAuth.updateUser(h)){console.log("Success: User updated in DB."),alert(`SUCCESS: Details for '${h.name}' have been saved.`),document.getElementById("edit-user-modal").style.display="none";const v=document.getElementById("page-content");v&&setTimeout(async()=>{v.innerHTML=await window.AppUI.renderAdmin(),window.AppAnalytics&&await window.AppAnalytics.initAdminCharts()},50)}else alert("Update failed: User not found.")}catch(f){console.error("Update Error:",f),alert("Error: "+f.message)}};function St(i,e){const[t,a]=i.split(":"),[n,s]=e.split(":"),r=parseInt(n)*60+parseInt(s)-(parseInt(t)*60+parseInt(a));if(r<0)return"Invalid";const d=Math.floor(r/60),o=r%60;return`${d}h ${o}m`}function de(){const i=document.getElementById("attendance-btn"),e=!!window.app_dashboardReadOnly,t=window.app_dashboardTargetUser||null;i&&!e&&i.addEventListener("click",ye),dn(t,e),Ce(),window.app_refreshNotificationBell&&window.app_refreshNotificationBell().catch(()=>{})}window.setupDashboardEvents=de;document.addEventListener("submit",i=>{i.preventDefault();const e=i.target.getAttribute("id");console.log("Submit Event Intercepted. Form ID:",e),e==="manual-log-form"?yn(i):e==="checkout-form"?window.app_submitCheckOut(i):e==="add-user-form"?wn(i):e==="login-form"?(async()=>{const t=new FormData(i.target);try{const a=await window.getLocation();if(!await window.AppAuth.login(t.get("username"),t.get("password"))){alert("Invalid Credentials");return}const s=window.AppAuth.getUser();s&&(s.lastLoginLocation={lat:a.lat,lng:a.lng,capturedAt:Date.now()},await window.AppDB.put("users",s)),window.location.reload()}catch(a){alert(`Login blocked: ${String(a)}

Please enable location and try again.`)}})():e==="edit-user-form"?(console.log("Routing to app_submitEditUser..."),window.app_submitEditUser(i)):e==="notify-form"?hn(i):e==="leave-request-form"?gn(i):console.warn("Unhandled form submission ID:",e,"Target:",i.target)});async function gn(i){const e=new FormData(i.target),t=window.AppAuth.getUser();await window.AppLeaves.requestLeave({userId:t.id,userName:t.name,startDate:e.get("startDate"),endDate:e.get("endDate"),startTime:e.get("startTime")||"",endTime:e.get("endTime")||"",type:e.get("type"),reason:e.get("reason"),durationHours:e.get("durationHours")||""}),alert("Leave requested successfully!"),document.getElementById("leave-modal").style.display="none",i.target.reset()}async function hn(i){i.preventDefault();const e=new FormData(i.target),t=e.get("toUserId"),a=e.get("reminderMessage")||"",n=e.get("reminderLink")||"",s=e.get("taskTitle")||"",r=e.get("taskDescription")||"",d=e.get("taskDueDate")||"";try{if(!a.trim()&&!s.trim()){alert("Please enter a reminder or a task.");return}const o=await window.AppDB.get("users",t);if(!o)throw new Error("User not found");const l=window.AppAuth.getUser(),c=new Date().toISOString();o.notifications||(o.notifications=[]),a.trim()&&(o.notifications.unshift({id:`rem_${Date.now()}`,type:"reminder",message:a.trim(),taggedById:l.id,taggedByName:l.name,taggedAt:c,status:"pending",date:c,read:!1}),await window.AppDB.add("staff_messages",{id:`msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"text",message:a.trim(),link:n.trim(),fromId:l.id,fromName:l.name,toId:t,toName:o.name,createdAt:c,read:!1})),s.trim()&&(o.notifications.unshift({id:`task_${Date.now()}`,type:"task",title:s.trim(),description:r.trim(),taggedById:l.id,taggedByName:l.name,taggedAt:c,status:"pending",dueDate:d||"",date:c,read:!1}),await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:s.trim(),description:r.trim(),dueDate:d||"",status:"pending",fromId:l.id,fromName:l.name,toId:t,toName:o.name,createdAt:c,read:!1,history:[{action:"created",byId:l.id,byName:l.name,at:c}]})),await window.AppAuth.updateUser(o),alert("Notification sent!"),document.getElementById("notify-modal").style.display="none",window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()}catch(o){alert("Failed to send: "+o.message)}}window.app_openStaffThread=async i=>{window.app_staffThreadId=i;const e=window.AppAuth.getUser();if(!e)return;const a=(await window.app_getMyMessages()).filter(s=>s.toId===e.id&&s.fromId===i&&!s.read);for(const s of a)s.read=!0,s.readAt=new Date().toISOString(),await window.AppDB.put("staff_messages",s);const n=document.getElementById("page-content");n&&(n.innerHTML=await window.AppUI.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_sendStaffText=async i=>{i.preventDefault();const e=window.AppAuth.getUser(),t=new FormData(i.target),a=t.get("toUserId"),n=(t.get("message")||"").trim(),s=(t.get("link")||"").trim();if(!n){alert("Please type a message.");return}const r=await window.AppDB.get("users",a);if(!r){alert("Staff member not found.");return}await window.AppDB.add("staff_messages",{id:`msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"text",message:n,link:s,fromId:e.id,fromName:e.name,toId:a,toName:r.name,createdAt:new Date().toISOString(),read:!1}),i.target.reset();const d=document.getElementById("staff-message-modal");d&&d.remove();const o=document.getElementById("page-content");o&&(o.innerHTML=await window.AppUI.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_sendStaffTask=async i=>{i.preventDefault();const e=window.AppAuth.getUser(),t=new FormData(i.target),a=t.get("toUserId"),n=(t.get("taskTitle")||"").trim(),s=(t.get("taskDescription")||"").trim(),r=(t.get("taskDueDate")||"").trim();if(!n){alert("Please provide a task title.");return}const d=await window.AppDB.get("users",a);if(!d){alert("Staff member not found.");return}await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:n,description:s,dueDate:r,status:"pending",fromId:e.id,fromName:e.name,toId:a,toName:d.name,createdAt:new Date().toISOString(),read:!1,history:[{action:"created",byId:e.id,byName:e.name,at:new Date().toISOString()}]}),i.target.reset();const o=document.getElementById("staff-task-modal");o&&o.remove();const l=document.getElementById("page-content");l&&(l.innerHTML=await window.AppUI.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_openStaffMessageModal=(i,e)=>{if(!i){alert("Select a staff member first.");return}const a=`
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
                        <input type="hidden" name="toUserId" value="${i}">
                        <textarea name="message" rows="4" placeholder="Type a message... (text + links only)" required></textarea>
                        <input type="url" name="link" placeholder="Optional link (https://...)">
                        <button type="submit" class="action-btn">Send Message</button>
                    </form>
                </div>
            </div>
        `;window.app_showModal(a,"staff-message-modal")};window.app_openStaffTaskModal=(i,e)=>{if(!i){alert("Select a staff member first.");return}const a=`
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
                        <input type="hidden" name="toUserId" value="${i}">
                        <input type="text" name="taskTitle" placeholder="Task title" required>
                        <textarea name="taskDescription" rows="3" placeholder="Task details"></textarea>
                        <input type="date" name="taskDueDate">
                        <button type="submit" class="action-btn">Send Task</button>
                    </form>
                </div>
            </div>
        `;window.app_showModal(a,"staff-task-modal")};window.app_respondStaffTask=async(i,e)=>{const t=window.AppAuth.getUser(),a=await window.AppDB.get("staff_messages",i);if(!a){alert("Task not found.");return}if(a.toId!==t.id){alert("Only the recipient can approve or reject this task.");return}let n="";if(e==="rejected"&&(n=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Task",confirmText:"Submit Reason"})||""),a.status=e,a.respondedAt=new Date().toISOString(),n&&(a.rejectReason=n),a.history||(a.history=[]),a.history.unshift({action:e,byId:t.id,byName:t.name,at:a.respondedAt,reason:n}),e==="approved"&&!a.calendarSynced){const d=a.dueDate||new Date().toISOString().split("T")[0],o=a.toName||t.name,l=`${a.title}${a.description?` - ${a.description}`:""}`;window.AppCalendar&&(await window.AppCalendar.addWorkPlanTask(d,a.toId,`${l} (Responsible: ${o})`,[],{addedFrom:"staff",sourcePlanId:a.id,sourceTaskIndex:0,taggedById:a.fromId,taggedByName:a.fromName,status:"pending"}),await window.AppCalendar.addWorkPlanTask(d,a.fromId,`${l} (Assigned to ${o})`,[],{addedFrom:"staff",sourcePlanId:a.id,sourceTaskIndex:1,taggedById:a.fromId,taggedByName:a.fromName,status:"pending"}),a.calendarSynced=!0)}await window.AppDB.put("staff_messages",a);const s=await window.AppDB.get("users",a.fromId);s&&(s.notifications||(s.notifications=[]),s.notifications.unshift({id:`taskresp_${Date.now()}`,type:"task_response",message:`${t.name} ${e} a task.`,title:a.title,taggedByName:t.name,status:e,reason:n,date:a.respondedAt,read:!1}),await window.AppDB.put("users",s));const r=document.getElementById("page-content");r&&(r.innerHTML=await window.AppUI.renderStaffDirectoryPage()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()};window.app_updateStaffNavIndicator=async()=>{const i=window.AppAuth.getUser();if(!i)return;const e=document.querySelectorAll('[data-page="staff-directory"]');if(!e.length)return;const a=(await window.app_getMyMessages()).some(n=>n.toId===i.id&&!n.read);e.forEach(n=>{a?n.classList.add("has-new-msg"):n.classList.remove("has-new-msg")})};window.app_handleTagDecision=async(i,e)=>{const t=window.AppAuth.getUser();try{const a=await window.AppDB.get("users",t.id);if(!a||!a.notifications)throw new Error("Notification not found");const n=a.notifications.find(o=>o.id===i);if(!n)throw new Error("Notification not found");let s="";e==="rejected"&&(s=await window.appPrompt("Optional: add a rejection reason","",{title:"Reject Item",confirmText:"Submit Reason"})||"");const r=new Date().toISOString();if(n.status=e,n.respondedAt=r,n.read=!0,n.dismissedAt=r,s&&(n.rejectReason=s),a.tagHistory||(a.tagHistory=[]),a.tagHistory.unshift({id:`taghist_${Date.now()}`,type:"tag_response",title:n.title||n.message||"Tagged item",taggedByName:n.taggedByName||"Staff",status:e,reason:s,date:new Date().toISOString()}),await window.AppDB.put("users",a),n.taggedById){const o=await window.AppDB.get("users",n.taggedById);o&&(o.notifications||(o.notifications=[]),o.notifications.unshift({id:`tagresp_${Date.now()}`,type:"tag_response",message:`${t.name} ${e} your ${n.type||"tag"}.`,title:n.title||"",taggedByName:t.name,status:e,reason:s,date:new Date().toISOString(),read:!1}),await window.AppDB.put("users",o))}const d=document.getElementById("page-content");d&&(d.innerHTML=await window.AppUI.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents())}catch(a){alert("Failed to update tag: "+a.message)}};document.addEventListener("auth-logout",()=>window.AppAuth.logout());window.app_reviewMinuteAccessFromNotification=async(i,e,t)=>{try{const a=window.AppAuth.getUser();if(!(a&&(a.isAdmin||a.role==="Administrator"))){alert("Only admin can review access requests.");return}const s=await window.AppDB.get("users",a.id);if(!s||!Array.isArray(s.notifications)){alert("Notification not found.");return}let r=null;if(typeof i=="number"&&s.notifications[i]&&(r=s.notifications[i]),!r&&e&&(r=s.notifications.find(h=>String(h.id)===String(e))),!r||r.type!=="minute-access-request"){alert("This notification is no longer available.");return}const d=r.minuteId,o=r.taggedById||r.requesterId;if(!d||!o){alert("Invalid access request payload.");return}const l=await window.AppDB.get("minutes",d);if(!l){alert("Minute not found.");return}const c=Array.isArray(l.accessRequests)?l.accessRequests.slice():[];c.findIndex(h=>h.userId===o)<0&&c.push({userId:o,userName:r.taggedByName||"Staff",requestedAt:r.taggedAt||r.date||new Date().toISOString(),status:"pending",reviewedAt:"",reviewedBy:""});const m=c.findIndex(h=>h.userId===o);c[m]={...c[m],status:t,reviewedAt:new Date().toISOString(),reviewedBy:a.name};let u=Array.isArray(l.allowedViewers)?l.allowedViewers.slice():[];t==="approved"?u.includes(o)||u.push(o):u=u.filter(h=>h!==o),await window.AppMinutes.updateMinute(d,{accessRequests:c,allowedViewers:u},t==="approved"?"Admin approved minutes access from notification":"Admin rejected minutes access from notification");const y=await window.AppDB.get("users",o);y&&(y.notifications||(y.notifications=[]),y.notifications.unshift({id:Date.now()+Math.random(),type:"minute-access-reviewed",title:"Minutes Access Update",message:`Your request for "${l.title}" was ${t}.`,minuteId:d,taggedById:a.id,taggedByName:a.name,status:t,taggedAt:new Date().toISOString(),date:new Date().toISOString()}),await window.AppDB.put("users",y));const g=s.notifications.find(h=>String(h.id)===String(r.id));g&&(g.status=t,g.respondedAt=new Date().toISOString(),g.read=!0,await window.AppAuth.updateUser(s)),Q.innerHTML=await window.AppUI.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents(),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}catch(a){alert("Failed to review access request: "+a.message)}};document.addEventListener("dismiss-notification",async i=>{const e=i.detail,t=typeof e=="object"&&e!==null?e.notifIndex:e,a=typeof e=="object"&&e!==null?String(e.notifId||""):"",n=window.AppAuth.getUser();if(n&&n.notifications&&Number.isInteger(t)&&t>=0){let s=n.notifications[t];if(!s&&a&&(s=n.notifications.find(d=>String(d.id||"")===a)),!s)return;s.read=!0,s.dismissedAt=new Date().toISOString(),await window.AppAuth.updateUser(n),(window.location.hash.slice(1)||"dashboard")==="dashboard"&&(Q.innerHTML=await window.AppUI.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}else if(n&&n.notifications&&a){const s=n.notifications.find(d=>String(d.id||"")===a);if(!s)return;s.read=!0,s.dismissedAt=new Date().toISOString(),await window.AppAuth.updateUser(n),(window.location.hash.slice(1)||"dashboard")==="dashboard"&&(Q.innerHTML=await window.AppUI.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_refreshNotificationBell&&await window.app_refreshNotificationBell()}});document.addEventListener("dismiss-tag-history",async i=>{const e=String(i.detail||""),t=window.AppAuth.getUser();if(!e||!t||!Array.isArray(t.tagHistory))return;const a=t.tagHistory.findIndex(n=>String(n.id)===e);a<0||(t.tagHistory.splice(a,1),await window.AppAuth.updateUser(t),Q.innerHTML=await window.AppUI.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents())});document.addEventListener("open-log-modal",()=>{const i=document.getElementById("log-modal");if(!i)return;const e=new Date,t=n=>n.toString().padStart(2,"0");document.getElementById("log-date").value=e.toISOString().split("T")[0],document.getElementById("log-start-time").value=`${t(e.getHours())}:${t(e.getMinutes())}`;const a=new Date(e.getTime()+36e5);document.getElementById("log-end-time").value=`${t(a.getHours())}:${t(a.getMinutes())}`,i.style.display="flex"});document.addEventListener("set-duration",i=>{const e=i.detail,t=document.getElementById("log-start-time"),a=document.getElementById("log-end-time");if(t.value){const[n,s]=t.value.split(":").map(Number),r=new Date;r.setHours(n,s);const d=new Date(r.getTime()+e*60*1e3),o=l=>l.toString().padStart(2,"0");a.value=`${o(d.getHours())}:${o(d.getMinutes())}`}});window.app_editUser=async i=>{console.log("Opening Edit Modal for ID:",i);const e=await window.AppDB.get("users",i);if(console.log("User Data Found:",e),!e)return;const t=p=>{const m=String(p||"").trim();if(!m)return"";if(/^\d{4}-\d{2}-\d{2}$/.test(m))return m;const u=new Date(m);return Number.isNaN(u.getTime())?"":`${u.getFullYear()}-${String(u.getMonth()+1).padStart(2,"0")}-${String(u.getDate()).padStart(2,"0")}`},a=(p,m)=>{const u=t(p);if(!u)return"NA";const y=u.replace(/-/g,""),g=String(m||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase().slice(-3)||"USR";return`EMP-${y}-${g}`},n=document.getElementById("edit-user-form");if(!n)return;const s=(p,m)=>{const u=n.querySelector(p);u&&(u.value=m!==void 0?m:"")},r=(p,m)=>{const u=n.querySelector(p);u&&(u.checked=!!m)};s("#edit-user-id",e.id),s("#edit-user-name",e.name),s("#edit-user-username",e.username),s("#edit-user-password",e.password),s("#edit-user-role",e.role),s("#edit-user-dept",e.dept),s("#edit-user-email",e.email),s("#edit-user-phone",e.phone),r("#edit-user-isAdmin",!!(e.isAdmin||e.role==="Administrator")),r("#edit-user-can-manage-attendance-sheet",!!(e.canManageAttendanceSheet||e.isAdmin||e.role==="Administrator"));const d=t(e.joinDate);s("#edit-user-join-date",d),s("#edit-user-employee-id",d?e.employeeId||a(d,e.id):"NA"),s("#edit-user-base-salary",Number(e.baseSalary||0)),s("#edit-user-other-allowances",Number(e.otherAllowances||0)),s("#edit-user-pf",Number(e.providentFund||0)),s("#edit-user-professional-tax",Number(e.professionalTax||0)),s("#edit-user-loan-advance",Number(e.loanAdvance||0)),s("#edit-user-tds-percent",Number(e.tdsPercent||0)),s("#edit-user-bank-name",e.bankName||""),s("#edit-user-bank-account",e.bankAccount||e.accountNumber||""),s("#edit-user-bank-ifsc",e.bankIfsc||e.ifsc||""),s("#edit-user-pan",e.pan||e.PAN||""),s("#edit-user-uan",e.uan||e.UAN||"");const o=["dashboard","leaves","users","attendance","reports","minutes","policies"],l=e.permissions||{};o.forEach(p=>{const m=l[p],u=document.getElementById(`edit-perm-${p}-view`),y=document.getElementById(`edit-perm-${p}-admin`);u&&(u.checked=m==="view"||m==="admin"),y&&(y.checked=m==="admin")});const c=document.getElementById("edit-user-modal");if(c){c.style.display="flex";const p=document.getElementById("edit-user-permissions-panel");p&&(p.style.display="block")}};window.app_notifyUser=i=>{console.log("Opening Notify for:",i),document.getElementById("notify-user-id").value=i,document.getElementById("notify-modal").style.display="flex"};window.app_quickAddTask=async i=>{const e=window.AppAuth.getUser();if(!(e&&(e.role==="Administrator"||e.isAdmin))&&i!==e.id){alert("Only administrators can assign tasks to other staff.");return}const a=await window.appPrompt("Task to assign:","",{title:"Assign Task",placeholder:"Enter task title",confirmText:"Next"});if(!a||!a.trim())return;const n=await window.appPrompt("Task date (YYYY-MM-DD). Leave blank for today:","",{title:"Assign Task Date",placeholder:"YYYY-MM-DD",confirmText:"Create Task"}),s=n&&n.trim()?n.trim():new Date().toISOString().split("T")[0];try{if(!window.AppCalendar)throw new Error("Calendar module not available.");await window.AppCalendar.addWorkPlanTask(s,i,a.trim()),await window.AppDB.add("staff_messages",{id:`task_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"task",title:a.trim(),description:"",dueDate:s,status:"pending",fromId:e.id,fromName:e.name,toId:i,toName:(await window.AppDB.get("users",i))?.name||"Staff",createdAt:new Date().toISOString(),read:!1,history:[{action:"created",byId:e.id,byName:e.name,at:new Date().toISOString()}]}),alert("Task added successfully.");const r=document.getElementById("page-content");r&&(r.innerHTML=await window.AppUI.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()),window.app_updateStaffNavIndicator&&await window.app_updateStaffNavIndicator()}catch(r){alert("Failed to add task: "+r.message)}};window.app_viewLogs=async i=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}console.log("Viewing details for:",i);const e=await window.AppDB.get("users",i);let t=await window.AppAttendance.getLogs(i);window.currentViewedLogs=t,window.currentViewedUser=e;const a=t.length?`
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
                        ${t.map(n=>{let s=n.location||"N/A";return n.lat&&n.lng&&(s=`<a href="https://www.google.com/maps?q=${n.lat},${n.lng}" target="_blank" style="color:var(--primary);text-decoration:none;">
                                    <i class="fa-solid fa-map-pin"></i> ${Number(n.lat).toFixed(4)}, ${Number(n.lng).toFixed(4)}
                                </a>`),`
                            <tr>
                                <td>${n.date}</td>
                                <td>${n.checkIn}</td>
                                <td>${n.checkOut||"--"}</td>
                                <td>${n.duration||"--"}</td>
                                <td><span class="badge ${n.isManualOverride?"manual":""}" style="font-size:0.7rem; padding: 2px 6px;">${n.type||"Office"}</span></td>
                                <td style="font-size:0.85rem; color:#6b7280;">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        ${s}
                                        <button onclick="window.app_deleteLog('${n.id}', '${i}')" style="background:none; border:none; color:#ef4444; cursor:pointer;" title="Delete Log"><i class="fa-solid fa-trash"></i></button>
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
        `,document.getElementById("user-details-modal").style.display="flex"};window.app_openManualLogModal=i=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}const e=`
            <div class="modal-overlay" id="manual-admin-log-modal" style="display:flex;">
                <div class="modal-content">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h3>Add Manual Attendance</h3>
                        <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
                    </div>
                    <form onsubmit="window.app_submitManualLog(event, '${i}')">
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
        `;window.app_showModal(e,"manual-admin-log-modal")};window.app_submitManualLog=async(i,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}i.preventDefault();const t=new FormData(i.target),a=t.get("checkIn"),n=t.get("checkOut"),s=St(a,n);if(s==="Invalid"){alert("End time must be after Start time");return}const r=t.get("date"),d=window.AppAttendance.buildDateTime(r,a),o=window.AppAttendance.buildDateTime(r,n),l=d&&o?o-d:0,c=window.AppAttendance.evaluateAttendanceStatus(d||new Date,l),p=u=>{const[y,g]=u.split(":"),h=parseInt(y),f=h>=12?"PM":"AM",v=h%12||12;return`${String(v).padStart(2,"0")}:${g} ${f}`},m={date:r,checkIn:p(a),checkOut:p(n),duration:s,type:c.status,workDescription:t.get("description")||"Manual Entry by Admin",location:"Office (Manual)",durationMs:l,dayCredit:c.dayCredit,lateCountable:c.lateCountable,extraWorkedMs:c.extraWorkedMs||0,policyVersion:"v2",isManualOverride:!0,entrySource:"admin_override",attendanceEligible:!0};try{await window.AppAttendance.addAdminLog(e,m),alert("Attendance added manually."),document.getElementById("manual-admin-log-modal")?.remove(),window.app_viewLogs(e)}catch(u){alert("Error: "+u.message)}};window.app_deleteLog=async(i,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Are you sure you want to delete this attendance record?"))try{await window.AppAttendance.deleteLog(i),alert("Record deleted."),window.app_viewLogs(e)}catch(t){alert("Error: "+t.message)}};window.app_approveLeave=async i=>{if(await window.appConfirm("Are you sure you want to APPROVE this leave request?"))try{const e=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(i,"Approved",e.id),alert("Leave Approved! Attendance logs have been automatically generated.");const t=document.getElementById("page-content");t&&(t.innerHTML=await window.AppUI.renderDashboard(),de())}catch(e){alert("Error: "+e.message)}};window.app_rejectLeave=async i=>{const e=await window.appPrompt("Enter rejection reason (optional):","",{title:"Reject Leave",confirmText:"Reject Leave"});if(e!==null)try{const t=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(i,"Rejected",t.id,e),alert("Leave Rejected.");const a=document.getElementById("page-content");a&&(a.innerHTML=await window.AppUI.renderDashboard(),de())}catch(t){alert("Error: "+t.message)}};window.app_addLeaveComment=async i=>{const e=await window.AppDB.get("leaves",i),t=await window.appPrompt("Enter/Edit Admin Comment:",e.adminComment||"",{title:"Admin Comment",confirmText:"Save Comment"});if(t!==null)try{const a=window.AppAuth.getUser();await window.AppLeaves.updateLeaveStatus(i,e.status,a.id,t),alert("Comment saved.");const n=document.getElementById("page-content");n&&(n.innerHTML=await window.AppUI.renderDashboard(),de())}catch(a){alert("Error: "+a.message)}};window.app_exportLeaves=async()=>{try{const i=await window.AppLeaves.getAllLeaves();if(i.length===0){alert("No leave requests found to export.");return}await window.AppReports.exportLeavesCSV(i)}catch(i){alert("Export Failed: "+i.message)}};window.app_refreshMasterSheet=async()=>{const i=document.getElementById("page-content");if(i){const e=document.getElementById("sheet-month")?.value,t=document.getElementById("sheet-year")?.value;i.innerHTML=await window.AppUI.renderMasterSheet(e,t)}};window.app_exportMasterSheet=async()=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}const i=parseInt(document.getElementById("sheet-month").value),e=parseInt(document.getElementById("sheet-year").value),t=await window.AppDB.getAll("users"),a=`${e}-${String(i+1).padStart(2,"0")}-01`,n=`${e}-${String(i+1).padStart(2,"0")}-31`,r=(await window.AppDB.query("attendance","date",">=",a)).filter(d=>d.date<=n);await window.AppReports.exportMasterSheetCSV(i,e,t,r)};window.app_openCellOverride=async(i,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}const t=(await window.AppDB.getAll("users")).find(d=>d.id===i),a=await window.AppDB.getAll("attendance"),n=d=>{if(Object.prototype.hasOwnProperty.call(d||{},"attendanceEligible"))return d.attendanceEligible===!0;const o=String(d?.entrySource||"");return o==="staff_manual_work"?!1:o==="admin_override"||o==="checkin_checkout"||d?.isManualOverride||d?.location==="Office (Manual)"||d?.location==="Office (Override)"||typeof d?.activityScore<"u"||typeof d?.locationMismatched<"u"||typeof d?.autoCheckout<"u"||!!d?.checkOutLocation||typeof d?.outLat<"u"||typeof d?.outLng<"u"?!0:String(d?.type||"").includes("Leave")||d?.location==="On Leave"},s=a.filter(d=>(d.userId===i||d.user_id===i)&&d.date===e&&n(d)).sort((d,o)=>Number(o.id||0)-Number(d.id||0))[0],r=`
            <div class="modal-overlay" id="cell-override-modal" style="display:flex;">
                <div class="modal-content">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <div>
                            <h3 style="margin:0;">Edit Attendance</h3>
                            <p style="font-size:0.8rem; color:#666; margin:4px 0 0 0;">${t.name} | ${e}</p>
                        </div>
                        <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
                    </div>
                        <form onsubmit="window.app_submitCellOverride(event, '${i}', '${e}', '${s?.id||""}')">
                            <div style="display:flex; flex-direction:column; gap:1rem;">
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time In</label>
                                    <input type="time" name="checkIn" required value="${s?Ye(s.checkIn):"09:00"}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
                                </div>
                                <div>
                                    <label style="display:block; font-size:0.85rem; margin-bottom:0.25rem;">Time Out</label>
                                    <input type="time" name="checkOut" required value="${s?Ye(s.checkOut):"17:00"}" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:8px;">
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
                                ${s?`<button type="button" onclick="window.app_deleteCellLog('${s.id}', '${i}')" class="action-btn checkout" style="flex:1; padding:0;">Delete</button>`:""}
                            </div>
                            <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem;">
                                <input type="checkbox" name="isManualOverride" id="override-check" ${s?.isManualOverride?"checked":""}>
                                <label for="override-check" style="font-size:0.8rem; color:#666; cursor:pointer;">Mark as Manual Override</label>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;window.app_showModal(r,"cell-override-modal")};window.app_submitCellOverride=async(i,e,t,a)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}i.preventDefault();const n=new FormData(i.target),s=n.get("checkIn"),r=n.get("checkOut"),d=St(s,r);if(d==="Invalid"){alert("End time must be after Start time");return}const o=window.AppAttendance.buildDateTime(t,s),l=window.AppAttendance.buildDateTime(t,r),c=o&&l?l-o:0,p=window.AppAttendance.evaluateAttendanceStatus(o||new Date,c),m=n.get("isManualOverride")==="on",u=String(n.get("type")||"").trim(),y=m&&u?u:p.status,g=f=>{if(!f||f==="--")return"--";const[v,b]=f.split(":"),k=parseInt(v),w=k>=12?"PM":"AM",A=k%12||12;return`${String(A).padStart(2,"0")}:${b} ${w}`},h={date:t,checkIn:g(s),checkOut:g(r),duration:d,type:y,workDescription:n.get("description")||"Admin Override",location:"Office (Override)",durationMs:c,dayCredit:p.dayCredit,lateCountable:p.lateCountable,extraWorkedMs:p.extraWorkedMs||0,policyVersion:"v2",isManualOverride:m,entrySource:"admin_override",attendanceEligible:!0,autoCheckoutExtraApproved:n.get("autoCheckoutExtraApproved")==="on"};try{a?await window.AppAttendance.updateLog(a,h):await window.AppAttendance.addAdminLog(e,h),alert("Override successful."),document.getElementById("cell-override-modal")?.remove(),window.app_refreshMasterSheet()}catch(f){alert("Error: "+f.message)}};window.app_deleteCellLog=async(i,e)=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Delete this attendance record?"))try{await window.AppAttendance.deleteLog(i),document.getElementById("cell-override-modal")?.remove(),window.app_refreshMasterSheet()}catch(t){alert("Error: "+t.message)}};function Ye(i){if(!i||i==="--"||i==="Active Now")return"09:00";const[e,t]=i.split(" ");let[a,n]=e.split(":"),s=parseInt(a);return t==="PM"&&s<12&&(s+=12),t==="AM"&&s===12&&(s=0),`${String(s).padStart(2,"0")}:${n}`}const vn=i=>{if(!i)return null;const e=String(i).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const t=new Date(e);if(!Number.isNaN(t.getTime())){const n=t.getFullYear(),s=String(t.getMonth()+1).padStart(2,"0"),r=String(t.getDate()).padStart(2,"0");return`${n}-${s}-${r}`}const a=e.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);if(a){const n=Number(a[1]),s=Number(a[2]),r=Number(a[3]);let d=n,o=s;return o>12&&n<=12&&(o=n,d=s),o<1||o>12||d<1||d>31?null:`${r}-${String(o).padStart(2,"0")}-${String(d).padStart(2,"0")}`}return null};window.app_runAttendancePolicyMigration=async()=>{if(!window.app_canManageAttendanceSheet()){alert("You do not have permission for this action.");return}if(await window.appConfirm("Recalculate historical attendance logs with the current policy? This updates stored status/credits for existing office logs.","Run Attendance Migration"))try{const e=await window.AppDB.getAll("attendance");let t=0,a=0,n=0;const s=new Set(["Work - Home","Training","On Duty","Holiday","National Holiday","Regional Holidays"]);let r=0,d=0;const o=new Map,l=new Map,c=g=>{const h=vn(g?.date),f=typeof g?.activityScore<"u"||typeof g?.locationMismatched<"u"||typeof g?.autoCheckout<"u"||!!g?.checkOutLocation||typeof g?.outLat<"u"||typeof g?.outLng<"u";let b=String(g?.entrySource||"").trim();b||(g?.isManualOverride||g?.location==="Office (Manual)"||g?.location==="Office (Override)"?b="admin_override":f?b="checkin_checkout":b="staff_manual_work");const k=g?.checkIn&&g?.checkOut&&g?.checkOut!=="Active Now"?Ye(g.checkIn):null,w=g?.checkIn&&g?.checkOut&&g?.checkOut!=="Active Now"?Ye(g.checkOut):null,A=h&&k?window.AppAttendance.buildDateTime(h,k):null,$=h&&w?window.AppAttendance.buildDateTime(h,w):null,I=!!(A&&$&&$>A),L=I?$-A:null,T=typeof g?.durationMs=="number"?g.durationMs:L,B=typeof T=="number"?Math.max(0,T)/(1e3*60*60):0;let E;return Object.prototype.hasOwnProperty.call(g||{},"attendanceEligible")?E=g.attendanceEligible===!0:b==="staff_manual_work"?E=B>=4:E=!0,{dateIso:h,inDt:A,outDt:$,validTimeRange:I,resolvedDurationMs:T,workedHours:B,inferredSource:b,inferredAttendanceEligible:E}},p=(g,h)=>{const f=window.AppAttendance.normalizeType(g?.type);let v=0;h.inferredSource==="staff_manual_work"?h.workedHours>=8?v=100:h.workedHours>=4&&(v=50):v=Number(window.AppAttendance.getDayCredit(f)||0)*100;let b=0;return b+=v,b+=Math.min(20,Math.floor(Math.max(0,h.workedHours||0))),h.inferredAttendanceEligible&&(b+=40),h.validTimeRange&&(b+=10),h.inferredSource==="checkin_checkout"?b+=8:h.inferredSource==="admin_override"?b+=6:b+=4,g?.isManualOverride&&(b+=4),(String(g?.type||"").includes("Leave")||g?.location==="On Leave")&&(b+=6),b+=Number(g?.id||0)/1e13,b};for(const g of e){if(!g||!g.id)continue;const h=c(g);o.set(g.id,h);const f=g.user_id||g.userId;if(!f||!h.dateIso)continue;const v=`${f}|${h.dateIso}`;l.has(v)||l.set(v,[]),l.get(v).push(g)}const m=new Map;for(const[g,h]of l.entries()){if(!h||h.length===0)continue;const f=h.slice().sort((v,b)=>{const k=o.get(v.id)||c(v),w=o.get(b.id)||c(b);return p(b,w)-p(v,k)});m.set(g,f[0]?.id)}for(const g of e){if(t++,!g||!g.id){n++;continue}const h=window.AppAttendance.normalizeType(g.type),f=o.get(g.id)||c(g),v=f.dateIso,b=f.inDt,k=f.outDt,w=f.resolvedDurationMs,A=f.workedHours,$=f.inferredSource;let I=f.inferredAttendanceEligible;const L=g.user_id||g.userId,T=L&&v?`${L}|${v}`:null,B=T?m.get(T):null,E=!!(B&&B!==g.id),_=!!(g.checkIn&&g.checkOut&&g.checkOut!=="Active Now")&&!!(b&&k&&k<=b);let P=g.type,C=g.dayCredit,N=g.lateCountable,q=g.extraWorkedMs||0;if(E&&(I=!1,String(g.type||"").includes("Leave")||(P="Work Log"),C=0,N=!1,q=0,r++),_&&(I=!1,String(g.type||"").includes("Leave")||(P="Work Log"),C=0,N=!1,q=0,d++),$==="staff_manual_work"&&!E&&!_)A>=8?(P="Present",C=1):A>=4?(P="Half Day",C=.5):(P="Work Log",C=0),N=!1,q=0;else if(!g.isManualOverride&&I&&!(s.has(h)||String(h).includes("Leave")||h==="Office")&&b&&k&&k>b){const D=window.AppAttendance.evaluateAttendanceStatus(b,k-b);P=D.status,C=D.dayCredit,N=D.lateCountable,q=D.extraWorkedMs||0}const j={...g,entrySource:$,attendanceEligible:I,type:P,dayCredit:typeof C=="number"?C:0,lateCountable:N===!0,extraWorkedMs:q||0,durationMs:typeof w=="number"?w:null,policyVersion:"v2"};if(!(g.entrySource!==j.entrySource||g.attendanceEligible!==j.attendanceEligible||g.type!==j.type||g.dayCredit!==j.dayCredit||g.lateCountable!==j.lateCountable||(g.extraWorkedMs||0)!==(j.extraWorkedMs||0)||g.durationMs!==j.durationMs||g.policyVersion!=="v2")){n++;continue}await window.AppDB.put("attendance",j),a++}alert(`Migration complete.
Scanned: ${t}
Updated: ${a}
Skipped: ${n}
Duplicates neutralized: ${r}
Invalid-time logs neutralized: ${d}`);const u=window.location.hash.slice(1),y=document.getElementById("page-content");if(!y)return;u==="policy-test"?y.innerHTML=await window.AppUI.renderPolicyTest():u==="dashboard"?(y.innerHTML=await window.AppUI.renderDashboard(),window.setupDashboardEvents&&window.setupDashboardEvents()):u==="salary"?(y.innerHTML=await window.AppUI.renderSalaryProcessing(),window.app_recalculateAllSalaries&&window.app_recalculateAllSalaries()):u==="timesheet"&&(y.innerHTML=await window.AppUI.renderTimesheet())}catch(e){console.error("Attendance migration failed:",e),alert("Migration failed: "+e.message)}};window.app_deleteUser=async i=>{if(await window.appConfirm("Are you sure you want to delete this user? This action cannot be undone."))try{await window.AppDB.delete("users",i),alert("User deleted successfully.");const e=document.getElementById("page-content");e&&(e.innerHTML=await window.AppUI.renderAdmin())}catch(e){alert("Failed to delete user: "+e.message)}};window.app_recalculateRow=i=>{const e=parseFloat(i.querySelector(".base-salary-input").value)||0,t=e/22,a=parseFloat(i.querySelector(".unpaid-leaves-count").innerText)||0,n=parseFloat(i.querySelector(".late-count")?.innerText||"0")||0,s=Math.floor(n/(window.AppConfig.LATE_GRACE_COUNT||3))*(window.AppConfig.LATE_DEDUCTION_PER_BLOCK||.5),r=parseFloat(i.querySelector(".extra-work-hours")?.innerText||"0")||0,d=Math.floor(r/(window.AppConfig.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4))*(window.AppConfig.LATE_DEDUCTION_PER_BLOCK||.5),o=Math.max(0,s-d),l=a+o,c=parseFloat(document.getElementById("global-tds-percent").value)||0,p=i.querySelector(".tds-input");p&&!p.dataset.manual&&(p.value=c);const m=p?parseFloat(p.value)||0:c,u=Math.round(t*l),y=i.querySelector(".late-deduction-days"),g=i.querySelector(".late-deduction-raw"),h=i.querySelector(".penalty-offset-days"),f=i.querySelector(".deduction-days"),v=i.querySelector(".attendance-deduction-amount");g&&(g.innerText=s.toFixed(1)),h&&(h.innerText=d.toFixed(1)),y&&(y.innerText=o.toFixed(1)),f&&(f.innerText=l.toFixed(1)),v&&(v.innerText="-Rs "+u.toLocaleString()),i.querySelector(".deduction-amount").innerText="-Rs "+u.toLocaleString();const b=i.querySelector(".salary-input");b.dataset.manual||(b.value=Math.max(0,e-u));const k=parseFloat(b.value)||0,w=Math.round(k*(m/100)),A=Math.max(0,k-w);i.querySelector(".tds-amount").innerText="Rs "+w.toLocaleString(),i.querySelector(".tds-amount").dataset.value=w,i.querySelector(".final-net-salary").innerText="Rs "+A.toLocaleString(),i.querySelector(".final-net-salary").dataset.value=A};const ra=i=>{const e=parseFloat(i.querySelector(".unpaid-leaves-count")?.innerText||"0")||0,t=parseFloat(i.querySelector(".late-count")?.innerText||"0")||0,a=parseFloat(i.querySelector(".extra-work-hours")?.innerText||"0")||0,n=Math.floor(t/(window.AppConfig.LATE_GRACE_COUNT||3))*(window.AppConfig.LATE_DEDUCTION_PER_BLOCK||.5),s=Math.floor(a/(window.AppConfig.EXTRA_HOURS_FOR_HALF_DAY_OFFSET||4))*(window.AppConfig.LATE_DEDUCTION_PER_BLOCK||.5),r=Math.max(0,n-s),d=e+r;return{unpaidLeaves:e,lateCount:t,extraWorkedHours:a,rawLateDeductionDays:n,penaltyOffsetDays:s,lateDeductionDays:r,deductionDays:d}};window.app_recalculateAllSalaries=()=>{document.querySelectorAll("tr[data-user-id]").forEach(i=>{window.app_recalculateRow(i)})};const Je=(i,e=new Date)=>{if(/^\d{4}-\d{2}$/.test(String(i||"").trim())){const[t,a]=String(i).split("-").map(Number);if(Number.isFinite(t)&&Number.isFinite(a)&&a>=1&&a<=12)return{year:t,monthIndex:a-1}}return{year:e.getFullYear(),monthIndex:e.getMonth()}};window.app_toggleSalaryPeriodMode=function(){const i=document.getElementById("salary-period-mode")?.value||"single",e=document.getElementById("salary-period-single-wrap"),t=document.getElementById("salary-period-range-wrap");e&&(e.style.display=i==="range"?"none":"block"),t&&(t.style.display=i==="range"?"flex":"none")};window.app_getSalaryPayPeriodInfo=function(){const i=new Date;if((document.getElementById("salary-period-mode")?.value||"single")==="range"){const d=document.getElementById("salary-pay-period-from")?.value||"",o=document.getElementById("salary-pay-period-to")?.value||"";let l=Je(d,i),c=Je(o,i);const p=l.year*100+(l.monthIndex+1);if(c.year*100+(c.monthIndex+1)<p){const f=l;l=c,c=f}const u=new Date(l.year,l.monthIndex,1),y=new Date(c.year,c.monthIndex+1,0),g=`${l.year}-${String(l.monthIndex+1).padStart(2,"0")}`,h=`${c.year}-${String(c.monthIndex+1).padStart(2,"0")}`;return{mode:"range",startDate:u,endDate:y,startKey:g,endKey:h,key:`${g}_to_${h}`,label:`${u.toLocaleDateString("en-GB",{month:"long",year:"numeric"})} to ${y.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}`}}const t=document.getElementById("salary-pay-period")?.value||"",a=Je(t,i),n=new Date(a.year,a.monthIndex,1),s=new Date(a.year,a.monthIndex+1,0),r=`${a.year}-${String(a.monthIndex+1).padStart(2,"0")}`;return{mode:"single",startDate:n,endDate:s,startKey:r,endKey:r,key:r,label:n.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}};window.app_saveAllSalaries=async()=>{const i=document.querySelectorAll("tr[data-user-id]"),e=[],t=[],a=window.app_getSalaryPayPeriodInfo(),n=a.key,s=document.getElementById("salary-pay-date")?.value||"",r=s?new Date(s).getTime():Date.now(),d=parseFloat(document.getElementById("global-tds-percent").value)||0;for(const o of i){const l=o.dataset.userId,c=o.querySelector(".base-salary-input").value,p=o.querySelector(".salary-input").value,m=o.querySelector(".comment-input").value,u=o.querySelector(".tds-input"),y=u?parseFloat(u.value)||0:d,g=o.querySelector(".tds-amount").dataset.value||0,h=o.querySelector(".final-net-salary").dataset.value||0,f=ra(o),v=f.unpaidLeaves,b=f.lateCount,k=f.extraWorkedHours,w=f.rawLateDeductionDays,A=f.penaltyOffsetDays,$=f.lateDeductionDays,I=f.deductionDays,L=Number(String(o.querySelector(".attendance-deduction-amount")?.innerText||"0").replace(/[^0-9.-]+/g,"")),T=(H,W)=>{const K=String(H||"").trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(K))return"NA";const V=K.replace(/-/g,""),Z=String(W||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase().slice(-3)||"USR";return`EMP-${V}-${Z}`},B=String(o.querySelector(".employee-id-input")?.value||"").trim(),E=String(o.querySelector(".designation-input")?.value||"").trim(),S=String(o.querySelector(".department-input")?.value||"").trim(),_=String(o.querySelector(".join-date-input")?.value||"").trim(),P=_?B||T(_,l):"NA",C=String(o.querySelector(".bank-name-input")?.value||"").trim(),N=String(o.querySelector(".bank-account-input")?.value||"").trim(),q=String(o.querySelector(".pan-input")?.value||"").trim(),z=String(o.querySelector(".uan-input")?.value||"").trim(),j=Number(o.querySelector(".other-allowances-input")?.value||0),G=Number(o.querySelector(".pf-input")?.value||0),D=Number(o.querySelector(".professional-tax-input")?.value||0),M=Number(o.querySelector(".loan-advance-input")?.value||0);if(o.querySelector(".comment-input").required&&!m){alert(`Please provide a comment for user ID: ${l} as the salary was adjusted.`);return}e.push({id:`salary_${l}_${n}`,userId:l,month:n,periodMode:a.mode,periodStart:a.startKey,periodEnd:a.endKey,periodLabel:a.label,payDate:r,baseAmount:Number(c),otherAllowances:j,providentFund:G,professionalTax:D,loanAdvance:M,employeeId:P,designation:E,department:S,joinDate:_||null,bankName:C,bankAccount:N,pan:q,uan:z,attendanceDeduction:L,deductions:Number(o.querySelector(".deduction-amount").innerText.replace(/[^0-9.-]+/g,"")),unpaidLeaves:v,lateCount:b,extraWorkedHours:k,lateDeductionRawDays:w,penaltyOffsetDays:A,lateDeductionDays:$,deductionDays:I,adjustedAmount:Number(p),tdsPercent:y,tdsAmount:Number(g),finalNet:Number(h),comment:m||"",processedAt:Date.now()}),t.push({id:l,baseSalary:Number(c),tdsPercent:y,employeeId:P,designation:E,dept:S,joinDate:_||null,bankName:C,bankAccount:N,pan:q,uan:z,otherAllowances:j,providentFund:G,professionalTax:D,loanAdvance:M})}try{for(const l of e)await window.AppDB.put("salaries",l);for(const l of t){const c=await window.AppDB.get("users",l.id);c&&(Object.assign(c,l),await window.AppDB.put("users",c))}alert("All records and TDS details saved successfully!");const o=document.getElementById("page-content");o.innerHTML=await window.AppUI.renderSalaryProcessing()}catch(o){console.error("Salary Save Error:",o),alert("Failed to save records: "+o.message)}};window.app_exportSalaryCSV=()=>{const i=document.querySelectorAll("tr[data-user-id]");let e=`Staff Name,Emp ID,Designation,Department,Join Date,Bank Name,Bank Account,PAN,UAN,Base Salary,Other Allowances,PF,Professional Tax,Loan Advance,Present,Late,Unpaid Leaves,Extra Work Hours,Late Deduction Raw,Penalty Offset Days,Late Deduction Days,Total Deduction Days,Attendance Deduction,Total Deductions,Adjusted Salary,TDS (%),TDS Amount,Final Net,Comment
`;i.forEach(r=>{const d=r.querySelector('div[style*="font-weight: 600"]').innerText,o=r.querySelector(".base-salary-input").value,l=r.querySelector(".employee-id-input")?.value||"",c=r.querySelector(".designation-input")?.value||"",p=r.querySelector(".department-input")?.value||"",m=r.querySelector(".join-date-input")?.value||"",u=r.querySelector(".bank-name-input")?.value||"",y=r.querySelector(".bank-account-input")?.value||"",g=r.querySelector(".pan-input")?.value||"",h=r.querySelector(".uan-input")?.value||"",f=r.querySelector(".other-allowances-input")?.value||"0",v=r.querySelector(".pf-input")?.value||"0",b=r.querySelector(".professional-tax-input")?.value||"0",k=r.querySelector(".loan-advance-input")?.value||"0",w=r.querySelector(".present-count")?.innerText||"0",A=r.querySelector(".late-count")?.innerText||"0",$=r.querySelector(".unpaid-leaves-count")?.innerText||"0",I=r.querySelector(".extra-work-hours")?.innerText||"0",L=r.querySelector(".late-deduction-raw")?.innerText||"0",T=r.querySelector(".penalty-offset-days")?.innerText||"0",B=r.querySelector(".late-deduction-days")?.innerText||"0",E=r.querySelector(".deduction-days")?.innerText||"0",S=(r.querySelector(".attendance-deduction-amount")?.innerText||"").replace(/[^0-9.-]+/g,"")||"0",_=(r.querySelector(".deduction-amount").innerText||"").replace(/[^0-9.-]+/g,""),P=r.querySelector(".salary-input").value,C=parseFloat(document.getElementById("global-tds-percent").value)||0,N=r.querySelector(".tds-input"),q=N&&N.value!==""?N.value:C,z=(r.querySelector(".tds-amount").innerText||"").replace(/[^0-9.-]+/g,""),j=(r.querySelector(".final-net-salary").innerText||"").replace(/[^0-9.-]+/g,""),G=r.querySelector(".comment-input").value;e+=`"${d}","${l}","${c}","${p}","${m}","${u}","${y}","${g}","${h}",${o},${f},${v},${b},${k},${w},${A},${$},${I},${L},${T},${B},${E},${S},${_},${P},${q},${z},${j},"${G}"
`});const t=new Blob([e],{type:"text/csv"}),a=window.URL.createObjectURL(t),n=document.createElement("a"),s=window.app_getSalaryPayPeriodInfo();n.setAttribute("href",a),n.setAttribute("download",`Salaries_${s.key.replace(/[^a-zA-Z0-9_-]/g,"_")}.csv`),n.click()};const Ze=(i,e=4)=>{const t=String(i||"").trim();return t?t.length<=e?t:`${"*".repeat(Math.max(0,t.length-e))}${t.slice(-e)}`:"NA"},bn=i=>{const e=Math.floor(Number(i)||0);if(e===0)return"Zero";const t=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"],a=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"],n=m=>{if(m<20)return t[m];const u=Math.floor(m/10),y=m%10;return`${a[u]}${y?` ${t[y]}`:""}`.trim()},s=m=>{const u=Math.floor(m/100),y=m%100;return u?`${t[u]} Hundred${y?` ${n(y)}`:""}`.trim():n(y)};let r=e;const d=Math.floor(r/1e7);r%=1e7;const o=Math.floor(r/1e5);r%=1e5;const l=Math.floor(r/1e3);r%=1e3;const c=r,p=[];return d&&p.push(`${n(d)} Crore`),o&&p.push(`${n(o)} Lakh`),l&&p.push(`${n(l)} Thousand`),c&&p.push(s(c)),p.join(" ").trim()};window.app_printSalarySlip=function(){const i=document.getElementById("salary-slip-modal");if(!i)return;const e=i.querySelector(".salary-slip-print-root");e&&(document.body.classList.add("salary-slip-print-mode"),e.classList.add("print-active"),setTimeout(()=>{window.print(),setTimeout(()=>{e.classList.remove("print-active"),document.body.classList.remove("salary-slip-print-mode")},150)},60))};window.app_generateSalarySlip=async function(i){try{const e=document.querySelector(`tr[data-user-id="${i}"]`);if(!e){alert("Unable to locate salary row for this user.");return}const t=await window.AppDB.get("users",i);if(!t){alert("User details not found.");return}const a=new Date,n=window.app_getSalaryPayPeriodInfo(),s=n.label,r=n.startDate.toLocaleDateString("en-GB"),d=n.endDate.toLocaleDateString("en-GB"),o=document.getElementById("salary-pay-date")?.value||"",l=o?new Date(o).toLocaleDateString("en-GB"):a.toLocaleDateString("en-GB"),c=a.toLocaleString("en-GB"),p=`CRWI-${n.key.replace(/[^a-zA-Z0-9]/g,"")}-${i}-${String(a.getTime()).slice(-5)}`,m=Number(e.querySelector(".base-salary-input")?.value||0),u=Number(e.querySelector(".salary-input")?.value||0),y=Number(e.querySelector(".tds-input")?.value||0),g=Number(e.querySelector(".tds-amount")?.dataset?.value||"0"),h=Number(e.querySelector(".final-net-salary")?.dataset?.value||"0"),f=Number(String(e.querySelector(".attendance-deduction-amount")?.innerText||"0").replace(/[^0-9.-]+/g,""))||0,v=ra(e),b=v.rawLateDeductionDays,k=v.penaltyOffsetDays,w=v.lateDeductionDays,A=v.deductionDays,$=v.unpaidLeaves,I=v.lateCount,L=String(e.querySelector(".comment-input")?.value||"").trim(),T=Number(e.querySelector(".other-allowances-input")?.value||t.otherAllowances||0),B=m+T,E=Number(e.querySelector(".loan-advance-input")?.value||t.loanAdvance||0),S=Number(e.querySelector(".pf-input")?.value||t.providentFund||0),_=Number(e.querySelector(".professional-tax-input")?.value||t.professionalTax||0),P=String(e.querySelector(".join-date-input")?.value||t.joinDate||"").trim(),C=String(e.querySelector(".employee-id-input")?.value||t.employeeId||"").trim(),N=P?C||deriveEmployeeId(P,t.id):"NA",q=String(e.querySelector(".designation-input")?.value||t.designation||t.role||"").trim(),z=String(e.querySelector(".department-input")?.value||t.dept||t.department||"").trim(),j=String(e.querySelector(".join-date-input")?.value||t.joinDate||"").trim(),G=String(e.querySelector(".bank-name-input")?.value||t.bankName||"").trim(),D=String(e.querySelector(".bank-account-input")?.value||t.bankAccount||t.accountNumber||"").trim(),M=String(e.querySelector(".pan-input")?.value||t.pan||t.PAN||"").trim(),H=String(e.querySelector(".uan-input")?.value||t.uan||t.UAN||"").trim(),W=f+g+E+S+_,K=`${bn(h)} Rupees Only`,V=[{label:"Attendance Deduction",amount:f,remarks:`Unpaid Leaves: ${$}, Late Count: ${I}, Late Raw: ${b.toFixed(1)}, Offset: ${k.toFixed(1)}, Late Deduction: ${w.toFixed(1)}, Total Deduction Days: ${A.toFixed(1)}`},{label:"TDS",amount:g,remarks:`Applied at ${y.toFixed(2)}%`},{label:"Provident Fund",amount:S,remarks:S?"Configured as per employee profile":"NA"},{label:"Professional Tax",amount:_,remarks:_?"Configured as per employee profile":"NA"},{label:"Loan / Advance",amount:E,remarks:E?"Recovered in this cycle":"Nil"}],Z=ee=>`Rs ${Number(ee||0).toLocaleString("en-IN")}`,ce=`
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
                                <div>Pay Period: ${s} (${r} to ${d})</div>
                                <div>Pay Date: ${l}</div>
                            </div>

                            <div class="salary-slip-section">
                                <h4>Employee Details</h4>
                                <div class="salary-slip-grid">
                                    <div><b>Employee Name:</b> ${t.name||"Staff"}</div>
                                    <div><b>Employee ID:</b> ${N||"NA"}</div>
                                    <div><b>Designation:</b> ${q||"NA"}</div>
                                    <div><b>Department:</b> ${z||"NA"}</div>
                                    <div><b>Date of Joining:</b> ${j?new Date(j).toLocaleDateString("en-GB"):"NA"}</div>
                                    <div><b>Bank Name:</b> ${G||"NA"}</div>
                                    <div><b>UAN:</b> ${Ze(H)}</div>
                                    <div><b>PAN:</b> ${Ze(M)}</div>
                                    <div><b>Bank A/C:</b> ${Ze(D)}</div>
                                </div>
                            </div>

                            <div class="salary-slip-split">
                                <div class="salary-slip-section">
                                    <h4>Earnings</h4>
                                    <table class="salary-slip-table">
                                        <tr><td>Basic Salary</td><td>${Z(m)}</td></tr>
                                        <tr><td>HRA</td><td>NA</td></tr>
                                        <tr><td>Conveyance Allowance</td><td>NA</td></tr>
                                        <tr><td>Special Allowance</td><td>NA</td></tr>
                                        <tr><td>Other Allowances</td><td>${Z(T)}</td></tr>
                                        <tr class="total"><td>Gross Earnings</td><td>${Z(B)}</td></tr>
                                    </table>
                                </div>
                                <div class="salary-slip-section">
                                    <h4>Deductions (Breakdown)</h4>
                                    <table class="salary-slip-table">
                                        ${V.map(ee=>`<tr><td>${ee.label}<div class="remark">${ee.remarks}</div></td><td>${ee.amount?Z(ee.amount):"NA"}</td></tr>`).join("")}
                                        <tr class="total"><td>Total Deductions</td><td>${Z(W)}</td></tr>
                                    </table>
                                </div>
                            </div>

                            <div class="salary-slip-net">
                                <div><b>Adjusted Salary:</b> ${Z(u)}</div>
                                <div><b>Net Salary:</b> ${Z(h)}</div>
                                <div><b>Net Salary in Words:</b> ${K}</div>
                            </div>

                            <div class="salary-slip-footer">
                                <div>This is a system-generated salary slip and does not require a signature.</div>
                                <div>Generated: ${c} | Payroll Ref ID: ${p}</div>
                                ${L?`<div>Payroll Comment: ${L}</div>`:""}
                            </div>
                        </div>
                    </div>
                </div>
            `;window.app_showModal(ce,"salary-slip-modal")}catch(e){console.error("Salary slip generation failed:",e),alert(`Failed to generate salary slip: ${e.message}`)}};window.app_editTaskStatus=async function(i,e,t){try{const a=window.AppAuth.getUser(),n=t==="completed"?new Date().toISOString().split("T")[0]:null;await window.AppCalendar.updateTaskStatus(i,e,t,n);const s=document.getElementById("page-content");s.innerHTML=await window.AppUI.renderDashboard(),alert(`Task status updated to: ${t}`)}catch(a){console.error("Failed to update task status:",a),alert("Failed to update task status. Please try again.")}};window.app_reassignTask=async function(i,e,t){try{const a=window.AppAuth.getUser();if(a.role!=="Administrator"&&!a.isAdmin){alert("Only administrators can reassign tasks.");return}await window.AppCalendar.reassignTask(i,e,t);const n=document.getElementById("page-content");n.innerHTML=await window.AppUI.renderDashboard(),alert("Task reassigned successfully!")}catch(a){console.error("Failed to reassign task:",a),alert("Failed to reassign task. Please try again.")}};window.app_viewTaskDetails=async function(i,e){try{const t=await window.AppDB.get("work_plans",i);if(!t||!t.plans||!t.plans[e]){alert("Task not found.");return}const a=t.plans[e],n=window.AppCalendar.getSmartTaskStatus(t.date,a.status),s={"to-be-started":"#3b82f6","in-process":"#eab308",completed:"#22c55e",overdue:"#ef4444","not-completed":"#6b7280"},r={"to-be-started":"🔵 To Be Started","in-process":"🟡 In Process",completed:"🟢 Completed",overdue:"🔴 Overdue","not-completed":"⚫ Not Completed"},d=`
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
                                    <span style="background: ${s[n]}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.875rem; font-weight: 600;">
                                        ${r[n]}
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
            `;document.getElementById("modal-container").innerHTML=d}catch(t){console.error("Failed to view task details:",t),alert("Failed to load task details.")}};window.app_recalculateRatings=async function(){try{const i=window.AppAuth.getUser();if(i.role!=="Administrator"&&!i.isAdmin){alert("Only administrators can recalculate ratings.");return}if(!await window.appConfirm("This will recalculate ratings for all users. Continue?"))return;const e=await window.AppRating.updateAllRatings();alert(`Successfully updated ratings for ${e.length} users!`);const t=document.getElementById("page-content");t.innerHTML=await window.AppUI.renderDashboard()}catch(i){console.error("Failed to recalculate ratings:",i),alert("Failed to recalculate ratings. Please try again.")}};window.app_triggerManualAudit=async()=>{if(!await window.appConfirm("Trigger a manual location audit for all active staff?"))return;const i=`Manual Audit @ ${new Date().toLocaleTimeString()}`;try{await window.AppDB.add("system_commands",{type:"audit",slotName:i,timestamp:Date.now(),requestedBy:window.AppAuth.getUser()?.name||"Admin",status:"pending"}),alert("Manual audit command sent. All active staff devices will now perform a stealth check.")}catch(e){console.error("Failed to trigger manual audit:",e),alert("Error: "+e.message)}};window.app_applyAuditFilter=async()=>{const i=document.getElementById("audit-start")?.value,e=document.getElementById("audit-end")?.value,t=document.getElementById("page-content");t&&(t.innerHTML=await window.AppUI.renderAdmin(i,e),window.AppAnalytics&&window.AppAnalytics.initAdminCharts())};window.app_exportAudits=async()=>{const i=document.getElementById("audit-start")?.value,e=document.getElementById("audit-end")?.value;try{let t=await window.AppDB.getAll("location_audits");if(i&&e&&(t=t.filter(l=>{const c=new Date(l.timestamp).toISOString().split("T")[0];return c>=i&&c<=e})),t.sort((l,c)=>c.timestamp-l.timestamp),t.length===0){alert("No audits found for the selected range.");return}const a=["Timestamp","Date","Time","Staff Member","Slot","Status","Latitude","Longitude"],n=t.map(l=>[l.timestamp,new Date(l.timestamp).toLocaleDateString(),new Date(l.timestamp).toLocaleTimeString(),l.userName||"Unknown",l.slot,l.status,l.lat||"",l.lng||""]),s=[a,...n].map(l=>l.join(",")).join(`
`),r=new Blob([s],{type:"text/csv;charset=utf-8;"}),d=document.createElement("a"),o=URL.createObjectURL(r);d.setAttribute("href",o),d.setAttribute("download",`security_audits_${i||"export"}.csv`),d.style.visibility="hidden",document.body.appendChild(d),d.click(),document.body.removeChild(d)}catch(t){console.error("Export failed:",t),alert("Export failed: "+t.message)}};window.app_changeAnnualYear=i=>{window.app_annualYear=(window.app_annualYear||new Date().getFullYear())+i,window.app_renderAnnualPlanPage()};window.app_toggleAnnualLegendFilter=i=>{const e=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0,overdue:!0,completed:!0};Object.prototype.hasOwnProperty.call(e,i)&&(e[i]=!e[i],window.app_annualLegendFilters=e,window.app_renderAnnualPlanPage())};window.app_showAnnualDayDetails=async i=>{if(!i)return;const e=window._currentPlans||await window.AppCalendar.getPlans(),t=window.app_annualLegendFilters||{leave:!0,event:!0,work:!0},a=window.AppAuth.getUser()||{},n=a.role==="Administrator"||a.isAdmin,s=(window.app_getDayEvents(i,e,{includeAuto:!1,userId:n?null:a.id})||[]).filter(o=>o.type==="leave"?!!t.leave:o.type==="work"?!!t.work:(o.type==="holiday",!!t.event)),r=s.length?s.map(o=>{const l=o.type||"event",c=l==="leave"?"background:#fee2e2;color:#991b1b;":l==="work"?"background:#e0e7ff;color:#3730a3;":l==="holiday"?"background:#f1f5f9;color:#334155;":"background:#dcfce7;color:#166534;",p=l==="work"&&Array.isArray(o.plans)&&o.plans.length?`<ul style="margin:0.5rem 0 0 1rem; padding:0; color:#475569; font-size:0.8rem;">
                    ${o.plans.map(m=>`<li>${window.app_formatTaskWithPostponeChip(m.task||"Work plan item")}</li>`).join("")}
                   </ul>`:"";return`
                <div class="annual-v2-detail-item" style="border:1px solid #eef2f7; border-radius:12px; padding:0.75rem;">
                    <div class="annual-v2-detail-item-head" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                        <span class="annual-v2-detail-tag" style="padding:2px 8px; border-radius:999px; font-size:0.7rem; font-weight:700; ${c}">${l.toUpperCase()}</span>
                        <div class="annual-v2-detail-title" style="font-size:0.9rem; color:#1f2937; font-weight:600;">${o.title||"Event"}</div>
                    </div>
                    ${p}
                </div>`}).join(""):'<div style="text-align:center; color:#94a3b8; padding:1rem;">No visible items for this date with current filters.</div>',d=`
            <div class="modal-overlay annual-v2-modal" id="annual-day-detail-modal" style="display:flex;">
                <div class="annual-detail-modal annual-v2-modal-content">
                    <div class="annual-detail-modal-header annual-v2-detail-head">
                        <div>
                            <div style="font-size:0.8rem; color:#64748b;">Date</div>
                            <div style="font-size:1rem; font-weight:700; color:#1e1b4b;">${i}</div>
                        </div>
                        <button type="button" onclick="window.app_closeModal(this)" class="day-plan-close-btn" title="Close">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="annual-v2-detail-list" style="display:flex; flex-direction:column; gap:0.6rem; max-height:60vh; overflow:auto;">
                        ${r}
                    </div>
                </div>
            </div>`;window.app_showModal(d,"annual-day-detail-modal")};window.app_toggleAnnualView=i=>{window.app_annualViewMode=i,window.app_renderAnnualPlanPage()};window.app_jumpToAnnualToday=()=>{const i=new Date;window.app_annualYear=i.getFullYear(),window.app_selectedAnnualDate=i.toISOString().split("T")[0],window.app_renderAnnualPlanPage().then(()=>{window.app_showAnnualDayDetails(window.app_selectedAnnualDate)})};window.app_renderAnnualPlanPage=async()=>{const i=document.getElementById("page-content");i&&(i.innerHTML=await window.AppUI.renderAnnualPlan())};window.app_setAnnualStaffFilter=i=>{window.app_annualStaffFilter=String(i||"").trim(),window.app_renderAnnualPlanPage()};window.app_setAnnualListSearch=i=>{window.app_annualListSearch=String(i||"").trim(),window.app_renderAnnualPlanPage()};window.app_setAnnualListSort=i=>{window.app_annualListSort=String(i||"date-asc").trim(),window.app_renderAnnualPlanPage()};window.app_renderTimesheetPage=async()=>{const i=document.getElementById("page-content");i&&(i.innerHTML=await window.AppUI.renderTimesheet())};window.app_setTimesheetView=i=>{window.app_timesheetViewMode=i==="calendar"?"calendar":"list",window.app_renderTimesheetPage()};window.app_changeTimesheetMonth=i=>{const e=new Date,t=Number.isInteger(window.app_timesheetMonth)?window.app_timesheetMonth:e.getMonth(),a=Number.isInteger(window.app_timesheetYear)?window.app_timesheetYear:e.getFullYear(),n=new Date(a,t,1);n.setMonth(n.getMonth()+i),window.app_timesheetMonth=n.getMonth(),window.app_timesheetYear=n.getFullYear(),window.app_renderTimesheetPage()};window.app_jumpTimesheetToday=()=>{const i=new Date;window.app_timesheetMonth=i.getMonth(),window.app_timesheetYear=i.getFullYear(),window.app_renderTimesheetPage()};window.app_closeModal=i=>{const e=i&&i.closest?i.closest(".modal-overlay"):null;e&&e.remove()};window.app_getSystemUpdateNotes=()=>[{date:"2026-02-21",summary:"Check for System Update now shows this quick update popup before refreshing."},{date:"2026-02-21",summary:"The update action shortcut was changed from Ctrl+F5 to Ctrl+Shift+R."}];window.app_showSystemUpdatePopup=()=>{const i="system-update-modal",e=Se(),t=(window.app_getSystemUpdateNotes()||[]).slice(0,5),a=t.length?t.map(o=>`
                <li style="margin:0 0 0.7rem 0; color:#334155; line-height:1.45;">
                    <span style="display:block; font-size:0.72rem; color:#64748b; font-weight:700;">${X(o.date||"")}</span>
                    <span>${X(o.summary||"")}</span>
                </li>
            `).join(""):'<li style="color:#64748b;">No update notes available.</li>',n=e.active?`
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
            `:"",s=`
            <div class="modal-overlay" id="${i}" style="display:flex;">
                <div class="modal-content" style="max-width:560px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.8rem;">
                        <h3 style="margin:0; font-size:1.1rem;">System Updates</h3>
                        <button type="button" onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">&times;</button>
                    </div>
                    ${n}
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
        `;window.app_showModal(s,i);const r=()=>{const o=document.getElementById("system-update-countdown");if(!o)return;const l=Se();o.textContent=l.countdownLabel};r();const d=setInterval(()=>{if(!document.getElementById(i)){clearInterval(d);return}r()},1e3)};window.app_forceRefresh=async()=>{Jt(!0);try{if(navigator.serviceWorker){const i=await navigator.serviceWorker.getRegistrations();await Promise.all(i.map(e=>e.unregister()))}if(window.caches){const i=await caches.keys();await Promise.all(i.map(e=>caches.delete(e)))}}catch(i){console.warn("Force refresh cleanup failed:",i)}window.location.reload(!0)};sn();console.log("App.js Loaded & Globals Ready");
