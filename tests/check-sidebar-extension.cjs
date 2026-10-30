const fs=require('fs'),vm=require('vm'),assert=require('assert');
(async()=>{
let provider,onVisibility,onDispose;const calls=[],commands={};
const vscode={window:{createOutputChannel:()=>({appendLine(){},dispose(){}}),registerWebviewViewProvider:(id,p,options)=>{assert.equal(id,'mooXBrowser.view');assert.equal(options.webviewOptions.retainContextWhenHidden,true);provider=p;return{dispose(){}}}},commands:{executeCommand:async(...args)=>{calls.push(args)},registerCommand:(name,callback)=>{commands[name]=callback;return{dispose(){}}}}};
const context={subscriptions:[]};const module={exports:{}};
vm.runInNewContext(fs.readFileSync(__dirname+'/../extension/extension.js','utf8'),{require:name=>{assert.equal(name,'vscode');return vscode},module,console});
module.exports.activate(context);assert.equal(calls.length,0,'Activation must not start browsing');
await commands['mooXBrowser.toggle']();assert.equal(calls.at(-1)[0],'workbench.view.extension.mooXBrowser');
const view={visible:false,webview:{postMessage:async()=>{}},onDidChangeVisibility:f=>{onVisibility=f;return{dispose(){}}},onDidDispose:f=>{onDispose=f;return{dispose(){}}}};
provider.resolveWebviewView(view);await Promise.resolve();assert.equal(calls.at(-1)[1],'hide');
view.visible=true;await commands['mooXBrowser.toggle']();assert.equal(calls.at(-1)[0],'workbench.view.scm');onVisibility();await Promise.resolve();assert.equal(calls.at(-1)[1],'show');
view.visible=false;onVisibility();await Promise.resolve();assert.equal(calls.at(-1)[1],'hide');
await commands['mooXBrowser.open']();assert.equal(calls.at(-1)[0],'workbench.view.extension.mooXBrowser');
await commands['mooXBrowser.back']();assert.equal(calls.at(-1)[1],'back');
assert(view.webview.html.includes('Content-Security-Policy'));
onDispose();await Promise.resolve();assert.equal(calls.at(-1)[1],'hide');
for(const d of context.subscriptions)d.dispose();
console.log('Extension lifecycle checks passed: no browse at activation, reveal/hide, title commands, disposal.');
})().catch(e=>{console.error(e);process.exitCode=1});
