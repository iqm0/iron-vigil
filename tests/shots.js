// Staged frames of the encounter at two phone sizes from a fixed seed; time is stepped by hand, so the same frames come out each run.
// usage: node tests/shots.js [outdir]      (default tests/out, not committed)
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
const out = path.resolve(process.argv[2] || path.join(__dirname, 'out')); fs.mkdirSync(out, { recursive: true });
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const errs = [];
  for (const [w, h] of [[412, 880], [360, 780]]) { const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message.slice(0, 300)));
    await p.goto('file://' + path.resolve(__dirname, '../index.html')); await p.waitForTimeout(700); await p.evaluate(() => { window.requestAnimationFrame = () => 0; }); await p.waitForTimeout(100);
    const ev = js => p.evaluate(js), shot = async n => { await ev(`render()`); await p.screenshot({ path: path.join(out, `${w}_${n}.png`) }); };
    await ev(`window.S=n=>{for(let i=0;i<n;i++){if(!window.gun)G.fireT=9;if(window.safe)G.inv=9;step(1/60);if(window.camAt){G.cam.x=camAt[0];G.cam.z=camAt[1];}}};
      window.put=(x,z,a)=>{const ox=x-G.x,oz=z-G.z;G.x=x;G.z=z;G.feet.forEach(f=>{f.x+=ox;f.z+=oz;});if(a!==undefined)G.head=G.aim=G.gunA=G.lamp=a;};
      window.quiet=()=>{G.enc.wave=9;G.enc.due=1e9;G.enc.queue.length=0;G.en.length=0;G.lurks.length=0;G.corpses.length=0;};`);
    await shot('01_title');
    await ev(`setSeed(3);startGame();gun=false;safe=true;camAt=null;S(170)`); await shot('02_start_at_the_shed');
    await ev(`S(120)`); await shot('03_eyes_in_the_crop');
    await ev(`quiet();put(-1,2,-1.3);camAt=[-2.5,2];window.E=spawnShear(-8,.5,1.4);E.state='stalk';E.cd=.4;E.sprint=-9;E.pause=99;S(12)`); await shot('04_circling_blades_folded');
    await ev(`while(E.state!=='tell')S(1);S(16)`); await shot('05_wind_up_blades_wide');
    await ev(`while(!E.locked)S(1);S(5)`); await shot('06_lane_locked');
    await ev(`while(E.state!=='stuck')S(1);S(5)`); await shot('07_blades_stuck');
    await ev(`gun=true;G.fireT=0;S(34)`); await shot('08_shelled');
    await ev(`{let n=0;while(popc(E.arms)===2&&n++<300)S(1);}S(6)`); await shot('09_blade_shot_off');
    await ev(`{let n=0;while(!E.dead&&n++<500)S(1);}S(40)`); await shot('10_dead');
    await ev(`quiet();gun=false;put(-1,2,-1.57);E=spawnShear(-7.5,2,1.57);E.state='stuck';E.st=3;E.strike=1;S(8);G.dcd=0;startDash(-1,0);S(15)`); await shot('11_rammed_and_crushed');
    await ev(`quiet();put(0,1,3.1);camAt=[0,0];S(10);openChoice('hw')`); await p.waitForTimeout(600); await p.screenshot({ path: path.join(out, `${w}_12_choice.png`) });
    await ev(`offerAt=0;choose(0);safe=true;put(0,1,2.4);camAt=[0,0];S(70)`); await shot('13_ram_charger_fitted');
    await ev(`quiet();G.enc.wave=4;G.enc.cap=2;put(-2,3,3.1);camAt=[-2,2.4];gun=true;for(const q of [[-9,1],[4.5,-3],[-1,10]]){const e=spawnShear(q[0],q[1],0);e.state='stalk';e.cd=rand(.3,1.2);}S(70)`); await shot('14_three_at_once');
    await ev(`S(45)`); await shot('15_three_at_once_later');
    await ev(`quiet();put(-6,-9,3.1);camAt=[-6,-9.5];S(30)`); await shot('16_the_farmhouse');
    await ev(`togglePause()`); await p.waitForTimeout(200); await p.screenshot({ path: path.join(out, `${w}_17_pause.png`) }); await ev(`togglePause()`);
    await ev(`G.kills=9;G.crushed=5;G.hp=62;G.t=64;endGame(true)`); await p.waitForTimeout(200); await p.screenshot({ path: path.join(out, `${w}_18_end.png`) });
    await p.close(); }
  console.log('errors:', errs.length, errs.slice(0, 3)); await b.close(); })();
