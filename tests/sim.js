// Scripted full runs of the slice, stepped by hand at 60 steps a second with a fixed seed, so a run can be repeated exactly.
// usage: node tests/sim.js [bots] [seeds] [pick] [extra js]     e.g. node tests/sim.js kite,slow 2 1o
// These bots are weak stand-ins for people: they do not flank, they ram only burrows, and they cannot tell you how anything feels.
// bots: idle, circle, kite (runs from the crowd, dashes across tells), slow (kite with slow reactions). pick: 0 | 1 | r (which card of each pair), organ taken when pick has 'o' (e.g. 0o)
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:412,height:880}});const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,300)));
await p.goto('file://'+require('path').resolve(__dirname,'../index.html'));await p.waitForTimeout(600);
await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await p.waitForTimeout(100);
const pick=process.argv[4]||'0', extra=process.argv[5]||'';
for(const bot of (process.argv[2]||'idle,circle,slow').split(',')) for(let seed=1;seed<=+(process.argv[3]||3);seed++){
 const r=await p.evaluate(({bot,seed,extra,pick})=>{ setSeed(seed*7919); let post=''; if(extra) eval(extra); startGame(); if(post) eval(post); let hits=0,lastHp=100,maxB=0,sumB=0,n=0,minHp=100,dx=0,dz=0,ph2=0,guardT=[],gSeen=new Map(),chooseT=[]; const marks={};
  while((state==='play'||state==='choose')&&G.t<400){ const g=G; n++;
   if(state==='choose'){ offerAt=0; chooseT.push(Math.round(g.t)); if(offer.kind==='organ') choose(pick.includes('o')?(pick[0]==='1'?1:0):-1); else choose(pick[0]==='r'?(Math.random()<.5?0:1):+pick[0]); continue; }
   if(bot==='circle'){dx=Math.cos(g.t*.5);dz=Math.sin(g.t*.5);}
   if(bot==='kite'||(bot==='slow'&&n%15===0)){ let ax=0,az=0; for(const e of g.en){const ex=g.x-e.x,ez=g.z-e.z,d=Math.hypot(ex,ez)||1; if(d<9){ax+=ex/d/d;az+=ez/d/d;} }
     for(const d of g.drops){const ex=d.x-g.x,ez=d.z-g.z,l=Math.hypot(ex,ez)||1; if(l<16){const w=d.k==='fix'?.25:.6; ax+=ex/l*w;az+=ez/l*w;}} for(const w of [[g.x-YARD.x0,1,0],[YARD.x1-g.x,-1,0],[g.z-YARD.z0,0,1],[YARD.z1-g.z,0,-1]]){const d=Math.max(.6,w[0]); if(d<6){ax+=w[1]/d*.9;az+=w[2]/d*.9;}} for(const q of PROPS){const ex=g.x-q.x,ez=g.z-q.z,d=Math.hypot(ex,ez)-q.r; if(d<2.5&&d>0){ax+=ex/(d+q.r)/Math.max(.4,d)*.5;az+=ez/(d+q.r)/Math.max(.4,d)*.5;}} const l=Math.hypot(ax,az); if(l>.02){dx=ax/l;dz=az/l;} else {dx=dz=0;} }
   if(bot==='kite'||bot==='slow') for(const e of g.en){ if(e.state==='tell'&&Math.hypot(g.x-e.x,g.z-e.z)<12&&g.dcd<=0&&!g.dash){ if(bot==='kite'||Math.random()<.035) startDash(-e.ldz,e.ldx); } }
   if(bot==='kite'&&g.dcd<=0&&!g.dash) for(const b of g.burrows){ if(!b.on||b.shut>0) continue; const ex=b.x-g.x,ez=b.z-g.z,d=Math.hypot(ex,ez); if(d<6&&d>1){ startDash(ex/d,ez/d); break; } }
   stick=(dx||dz)?{id:1,ox:0,oy:0,dx,dy:dz,ux:dx,uy:dz,d:60}:null;
   step(1/60); if(g.hp<lastHp-1)hits++; lastHp=g.hp; minHp=Math.min(minHp,g.hp); maxB=Math.max(maxB,g.en.length); sumB+=g.en.length;
   for(const e of g.en) if(e.big&&!e.boss&&!gSeen.has(e)) gSeen.set(e,g.t); for(const [e,t0] of gSeen) if(e.dead){ guardT.push(Math.round(t0)+'+'+(g.t-t0).toFixed(0)); gSeen.delete(e); }
   if(g.bossE&&g.bossE.ph===2&&!ph2) ph2=g.t;
   for(const m of [30,60,90,120,150]) if(!marks[m]&&g.t>=m) marks[m]=g.kills+'k/'+Math.round(g.hp)+'hp/'+g.en.length+'b'; }
  return {bot,seed,t:+G.t.toFixed(0),fight:+(G.t-RUN).toFixed(0),ph2:ph2?+(ph2-RUN).toFixed(0):-1,bossHp:G.bossE?Math.round(100*Math.max(0,G.bossE.hp)/G.bossE.mhp):-1,won:!!G.won,kills:G.kills,hits,minHp:Math.round(minHp),maxB,avgB:+(sumB/n).toFixed(1),items:G.items.join(' '),chooseT:chooseT.join(','),guards:guardT.join(' '),closed:G.closed,marks}; },{bot,seed,extra,pick});
 console.log(JSON.stringify(r)); }
console.log('errors:',errs.length,errs.slice(0,3));await b.close();})();
