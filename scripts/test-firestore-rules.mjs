// Starts a loopback-only Firestore emulator with this checkout's actual rules,
// runs the integration suite against a demo project, and always stops the process.
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, mkdirSync, createWriteStream } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const cache=resolve(root,'.cache/rules-emulator');
const jreRoot=resolve(cache,'java');
const jreDirs=existsSync(jreRoot)?readdirSync(jreRoot):[];
const java=process.env.RULES_TEST_JAVA || jreDirs.map(dir=>resolve(jreRoot,dir,'bin',process.platform==='win32'?'java.exe':'java')).find(existsSync) || 'java';
const jar=process.env.FIRESTORE_EMULATOR_JAR || resolve(cache,'firestore-emulator.jar');
if(!existsSync(jar))throw new Error('Firestore emulator not found. See docs/security-rules-verification.md for local setup.');
const port=await new Promise((done,reject)=>{
 const server=createServer();server.once('error',reject);server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(()=>done(port));});
});
const host=`127.0.0.1:${port}`;
const outDir=resolve(root,'test-results/security-rules');mkdirSync(outDir,{recursive:true});
const log=createWriteStream(resolve(outDir,'emulator.log'));
const emulator=spawn(java,['-jar',jar,'--host','127.0.0.1','--port',String(port),'--project_id','demo-crwi-rules','--rules',resolve(root,'firestore.rules')],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
const stopped = new Promise(done => emulator.once('close', done));
let exited=false,startError=null;
emulator.on('error',error=>{startError=error;exited=true;});emulator.on('exit',()=>{exited=true;});
emulator.stdout.pipe(log,{end:false});emulator.stderr.pipe(log,{end:false});
try{
 let ready=false;
 for(let attempt=0;attempt<120;attempt++){
  if(exited)throw startError || new Error('Emulator exited during startup. See test-results/security-rules/emulator.log');
  try{const response=await fetch(`http://${host}/`,{signal:AbortSignal.timeout(1000)});await response.text();ready=true;break;}catch{}
  await new Promise(done=>setTimeout(done,250));
 }
 if(!ready)throw new Error('Local emulator did not become ready.');
 console.log(`Testing current Firestore rules on ${host} (demo project only).`);
 const tests=spawn(process.execPath,['--test','tests/security/firestore-employment.test.mjs'],{cwd:root,windowsHide:true,stdio:'inherit',env:{...process.env,FIRESTORE_RULES_TEST_HOST:host}});
 process.exitCode=await new Promise((done,reject)=>{tests.once('error',reject);tests.once('exit',code=>done(code??1));});
}finally{
 if(!exited)emulator.kill();
 await stopped;
 log.end();
}
