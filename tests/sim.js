// usage: node tests/sim.js [seeds]
// Whole runs of the encounter, stepped by hand from fixed seeds, by three bots: ace (dodges lanes, rams anything stuck), dodger (dodges, never rams), stand (never moves). one line each.
const {chromium}=require('./browser');(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:412,height:880}});const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,300)));
await p.goto(require('./browser').gameURL());await p.waitForTimeout(700);await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});
for(const bot of ['ace','dodger','stand'])for(let seed=1;seed<=+(process.argv[2]||2);seed++){const r=await p.evaluate(({bot,seed})=>{setSeed(seed*7919);startGame();let hits=0,rams=0,dx=0,dz=0,maxI=0,n=0;
 while((state==='play'||state==='choose')&&G.t<200){const g=G;if(state==='choose'){offerAt=0;choose(seed%2);continue;}n++;
  if(bot!=='stand'){let ax=0,az=0;for(const e of g.en){const ex=g.x-e.x,ez=g.z-e.z,d=Math.hypot(ex,ez)||1;if(d<6){ax+=ex/d/d;az+=ez/d/d;}if(e.state==='tell'&&e.locked){ax+=-e.ldz*2;az+=e.ldx*2;}}for(const d of g.drops){const ex=d.x-g.x,ez=d.z-g.z,l=Math.hypot(ex,ez)||1;ax+=ex/l*.8;az+=ez/l*.8;}
   for(const w of [[g.x-YARD.x0,1,0],[YARD.x1-g.x,-1,0],[g.z-YARD.z0,0,1],[YARD.z1-g.z,0,-1]]){const d=Math.max(.6,w[0]);if(d<5){ax+=w[1]/d*.9;az+=w[2]/d*.9;}}const l=Math.hypot(ax,az);if(l>.05){dx=ax/l;dz=az/l;}else dx=dz=0;
   if(bot==='ace'&&g.dcd<=0&&!g.dash)for(const e of g.en){const ex=e.x-g.x,ez=e.z-g.z,d=Math.hypot(ex,ez);if(d<7&&(e.state==='stuck'||e.state==='down')){startDash(ex/d,ez/d);rams++;break;}}}
  stick=(dx||dz)?{id:1,ox:90,oy:700,dx,dy:dz,ux:dx,uy:dz,d:60}:null;const hp=g.hp;step(1/60);if(g.hp<hp-1)hits++;if(n%30===0){render();maxI=Math.max(maxI,STATS.inst);}}
 return {bot,seed,t:+(G.t/PACE).toFixed(0),won:!!G.won,hull:Math.round(G.hp),kills:G.kills,crushed:G.crushed,hits,rams,wave:G.enc.wave,item:G.items.join(),peakInstances:maxI};},{bot,seed});console.log(JSON.stringify(r));}
console.log('errors:',errs.length,errs.slice(0,3));await b.close();process.exitCode=errs.length?1:0;})();
