// Runs real source helpers on local sample DOM; no Firebase, staff login or writes.
import {chromium} from 'playwright';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {parse} from 'acorn';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:3047';
assert.match(base,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const source=readFileSync('js/ui/dashboard.js','utf8');
const ast=parse(source,{ecmaVersion:'latest',sourceType:'module'});
const fn=name=>{const n=ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);assert.ok(n,name);return source.slice(n.start,n.end);};
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.goto(base+'/tests/browser/dashboard-performance.fixture.html');
 await page.waitForFunction(()=>window.fixtureReady);
 await page.evaluate(({create,clear})=>{
  window.startSampleScroll=(0,eval)('('+create+')');
  window.stopSampleScroll=(0,eval)('('+clear+')');
  window.clearAutoScrollController=window.stopSampleScroll;
 },{create:fn('createAutoScrollController'),clear:fn('clearAutoScrollController')});
 const result=await page.evaluate(async()=>{
  const main=document.querySelector('main'),list=document.querySelector('#list-0');
  const elementCount=main.querySelectorAll('*').length;
  list.scrollTop=120;list.dispatchEvent(new Event('scroll',{bubbles:false}));
  const descriptor=Object.getOwnPropertyDescriptor(Element.prototype,'scrollTop');let reads=0;
  Object.defineProperty(Element.prototype,'scrollTop',{...descriptor,get(){reads++;return descriptor.get.call(this);}});
  const times=[];
  for(let i=0;i<5;i++){const started=performance.now();window.patchContent(main,window.fixtureHTML.replace('Work list 23','Updated list '+i));times.push(performance.now()-started);}
  Object.defineProperty(Element.prototype,'scrollTop',descriptor);
  const registry={controllers:new WeakMap(),elements:new Set()};
  const config={SCROLL_STEP_PX:1,TICK_MS:38,BOTTOM_PAUSE_MS:1200,TOP_PAUSE_MS:900,EDGE_THRESHOLD_PX:2,STALL_TICKS_BEFORE_FLIP:20,TOUCH_RESUME_MS:350};
  const offscreen=document.querySelector('#list-23');let offscreenWrites=0;
  Object.defineProperty(offscreen,'scrollTop',{configurable:true,get(){return descriptor.get.call(this);},set(value){offscreenWrites++;descriptor.set.call(this,value);}});
  window.startSampleScroll(offscreen,config,registry);
  await new Promise(resolve=>setTimeout(resolve,600));
  window.stopSampleScroll(offscreen,registry);
  const preservedScrollTop=list.scrollTop;
  window.startSampleScroll(list,config,registry);
  await new Promise(resolve=>setTimeout(resolve,300));
  const visibleListMoved=list.scrollTop>preservedScrollTop;
  list.remove();await new Promise(resolve=>setTimeout(resolve,90));
  const detachedControllerDisposed=registry.elements.size===0;
  window.stopSampleScroll(list,registry);
  return{elements:elementCount,scrollTopReads:reads,patchMs:times,offscreenWrites,preservedScrollTop,visibleListMoved,detachedControllerDisposed,remainingControllers:registry.elements.size};
 });
 mkdirSync('test-results/dashboard-performance',{recursive:true});
 writeFileSync('test-results/dashboard-performance/'+(process.env.PERF_LABEL||'current')+'.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
 assert.equal(result.preservedScrollTop,120,'User scroll position survives refresh');
 assert.equal(result.remainingControllers,0,'Controllers dispose cleanly');
 assert.equal(result.visibleListMoved,true,'Visible lists retain their existing behaviour');
 if(process.env.PERF_EXPECT_OPTIMIZED==='1'){
  assert.ok(result.scrollTopReads<100,'Refresh must not read scroll position from every descendant');
  assert.equal(result.offscreenWrites,0,'Offscreen lists must not continuously scroll');
  assert.equal(result.detachedControllerDisposed,true,'Detached lists must stop their timer');
 }
 const scrolling=await page.evaluate(async()=>{
  const main=document.querySelector('main');main.innerHTML='<div id="content">Before</div><input id="draft" value="Initial"><details id="details"><summary>Details</summary>More</details>';
  const draft=document.querySelector('#draft');draft.value='Unsaved draft';draft.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#details').open=true;
  document.dispatchEvent(new WheelEvent('wheel',{deltaY:120}));
  const update=window.refreshPage(()=>Promise.resolve('<div id="content">After</div><input id="draft" value="Server"><details id="details"><summary>Details</summary>More</details>'));
  await new Promise(resolve=>setTimeout(resolve,35));const deferred=document.querySelector('#content').textContent==='Before';
  await update;return{deferred,updated:document.querySelector('#content').textContent==='After',draft:document.querySelector('#draft').value,detailsOpen:document.querySelector('#details').open};
 });
 assert.equal(scrolling.updated,true);assert.equal(scrolling.draft,'Unsaved draft');assert.equal(scrolling.detailsOpen,true);
 if(process.env.PERF_EXPECT_OPTIMIZED==='1')assert.equal(scrolling.deferred,true,'Background refresh must wait for wheel scrolling to pause');
}finally{await browser.close();}
