// Regression screenshots of the slice at two phone sizes, from a fixed seed. Time is stepped by hand, so the same frames come out each run.
// usage: node tests/shots.js [outdir]      (default tests/out, which is not committed)
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
const out = path.resolve(process.argv[2] || path.join(__dirname, 'out')); fs.mkdirSync(out, { recursive: true });
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const errs = [];
  for (const [w, h] of [[412, 880], [360, 780]]) { const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message.slice(0, 300)));
    await p.goto('file://' + path.resolve(__dirname, '../index.html')); await p.waitForTimeout(700); await p.evaluate(() => { window.requestAnimationFrame = () => 0; }); await p.waitForTimeout(100);
    const shot = async n => { await p.evaluate(() => render()); await p.screenshot({ path: path.join(out, `${w}_${n}.png`) }); }, ev = js => p.evaluate(js);
    // helpers that live in the page: walk to a point, hold a bug still, put the walker somewhere
    await ev(`window.goTo=(x,z,max)=>{for(let i=0;i<(max||900)&&state==='play';i++){const dx=x-G.x,dz=z-G.z,l=Math.hypot(dx,dz);if(l<.5)break;stick={id:1,ox:0,oy:0,dx:dx/l,dy:dz/l,ux:dx/l,uy:dz/l,d:60};step(1/60);}stick=null;};
      window.put=(x,z,a)=>{const ox=x-G.x,oz=z-G.z;G.x=x;G.z=z;G.feet.forEach(f=>{f.x+=ox;f.z+=oz;});G.cam.x=clamp(x,YARD.x0+2.5,YARD.x1-2.5);G.cam.z=clamp(z,YARD.z0+7,YARD.z1-4.5);if(a!==undefined)G.head=G.aim=G.gunA=G.lamp=a;};
      window.calm=()=>{G.en.length=0;G.spawnT=1e9;G.eliteT=1e9;G.globs.length=0;G.pools.length=0;};`);
    await shot('01_title');
    await ev(`setSeed(3);startGame();advanceTime(2600)`); await shot('02_start_garage');
    await ev(`advanceTime(9000)`); await shot('03_first_stalker');
    await ev(`calm();G.drops.push({k:'salv',x:G.x+2.5,z:G.z+2,t:1});advanceTime(300)`); await shot('04_salvage_crate');
    await ev(`goTo(G.drops[0].x,G.drops[0].z)`); await p.waitForTimeout(600); await p.screenshot({ path: path.join(out, `${w}_05_choice_hardware.png`) });
    await ev(`offerAt=0;choose(0);advanceTime(900)`); await shot('06_fitted');
    await ev(`G.drops.push({k:'organ',x:G.x+1,z:G.z+1.5,t:1});goTo(G.x+1,G.z+1.5)`); await p.waitForTimeout(600); await p.screenshot({ path: path.join(out, `${w}_07_choice_organ.png`) });
    await ev(`offerAt=0;choose(0);advanceTime(1500)`); await shot('08_organ_grown');
    await ev(`put(3,4.5,Math.PI)`); await ev(`advanceTime(400)`); await shot('09_relay');
    await ev(`calm();put(-11,-9,-1.2);openSite(G,G.burrows[0]);advanceTime(700)`); await shot('10_burrow_open');
    await ev(`G.burrows[0].shut=18;advanceTime(300)`); await shot('11_burrow_shut');
    await ev(`put(2,7,0);calm();spawnBug(2,12,'big');G.en[0].emer=0;advanceTime(1200)`); await shot('12_guard');
    await ev(`G.en[0].stag=1.5;G.en[0].state='rec';G.en[0].st=1.5;advanceTime(250)`); await shot('13_guard_staggered');
    await ev(`calm();put(-2,6,0);G.bossUp=true;spawnBug(-2,13,'boss');G.bossE=G.en[0];G.en[0].emer=0;G.en[0].cd=9;advanceTime(1500)`); await shot('14_mother_phase1');
    await ev(`G.bossE.hp=G.bossE.mhp*.45;advanceTime(1800)`); await shot('15_mother_phase2');
    await ev(`togglePause()`); await p.waitForTimeout(200); await p.screenshot({ path: path.join(out, `${w}_16_pause.png`) }); await ev(`togglePause()`);
    await ev(`G.kills=212;G.closed=3;G.t=190;endGame(true)`); await p.waitForTimeout(200); await p.screenshot({ path: path.join(out, `${w}_17_end_held.png`) });
    await p.close(); }
  console.log('errors:', errs.length, errs.slice(0, 3)); await b.close(); })();
