const fs=require('fs'),vm=require('vm'),assert=require('assert');const source=fs.readFileSync(__dirname+'/../patches/x-reading-preload.js','utf8');
const start=source.indexOf('    // Always recompute ownership');const end=source.indexOf("    document.querySelectorAll('img').forEach",start);const code=source.slice(start,end);
function node(tag,parent){const classes=new Set();return {tagName:tag,parentElement:parent,getAttribute:()=>'',matches:()=>tag==='IMG'||tag==='VIDEO',querySelector:()=>null,closest:()=>null,classList:{contains:x=>classes.has(x),add:x=>classes.add(x),remove:(...xs)=>xs.forEach(x=>classes.delete(x))},classes}}
const outer=node('DIV'),image=node('IMG',outer),fallback=node('IMG'),stale=node('DIV');stale.classes.add('moo-media-dim');let roots=[outer];
const nodes=[outer,image,fallback,stale];const document={querySelectorAll:s=>s.startsWith('[data-testid="tweetPhoto"]')?roots:s.startsWith('article img')?[image,fallback]:s==='.moo-media-dim'?nodes.filter(x=>x.classes.has('moo-media-dim')):[]};
function run(){vm.runInNewContext(code,{document,Set,hoverMedia:undefined,cancelMediaHover(){},mediaIdentities:new WeakMap(),getComputedStyle:()=>({backgroundImage:'url(test)'})})}
run();assert(outer.classes.has('moo-media-dim'));assert(!image.classes.has('moo-media-dim'));assert(fallback.classes.has('moo-media-dim'));assert(!stale.classes.has('moo-media-dim'));
roots=[];image.parentElement=null;run();assert(!outer.classes.has('moo-media-dim'));assert(image.classes.has('moo-media-dim'));
assert(source.includes("attributeFilter:['src', 'poster', 'style', 'data-testid']"));console.log('Passed: one opacity owner, fallback images, stale node cleanup, reparented media, attribute monitoring.');
