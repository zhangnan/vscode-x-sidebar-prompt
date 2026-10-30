const fs=require('fs'),vm=require('vm'),assert=require('assert');const s=fs.readFileSync(__dirname+'/../patches/x-reading-preload.js','utf8');const handlers={},timers=new Map();let id=0;
class Node{};class Element extends Node{constructor(ad=false){super();this.ad=ad;this.isConnected=true;this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x)}}closest(sel){return sel==='.moo-ad-covered'?(this.ad?this:null):this}matches(){return true}contains(x){return this===x}}
vm.runInNewContext(s.slice(s.indexOf('  let hoverMedia'),s.indexOf('  const mediaIdentities')),{document:{addEventListener:(n,f)=>handlers[n]=f},window:{addEventListener:(n,f)=>handlers[n]=f},Element,Node,setTimeout:(fn,ms)=>{assert.equal(ms,2000);timers.set(++id,fn);return id},clearTimeout:id=>timers.delete(id)});
const a=new Element();handlers.pointerover({target:a,pointerType:'mouse'});assert(!a.classes.size);handlers.pointerout({relatedTarget:null});assert.equal(timers.size,0);
handlers.pointerover({target:a,pointerType:'mouse'});timers.values().next().value();assert(a.classes.has('moo-media-revealed'));handlers.pointerout({relatedTarget:null});assert(!a.classes.size);
handlers.pointerover({target:new Element(true),pointerType:'mouse'});assert.equal(timers.size,0);
console.log('Passed: 2-second delay, early exit cancellation, reveal/reset, advertisements excluded.');
