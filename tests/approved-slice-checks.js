/* Additional regression coverage for the approved Nov 2026 encounter changes.
   Run from repository root: node tests/approved-slice-checks.js
   Requires existing Playwright dependency (same as tests/checks.js).
*/
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const page = await browser.newPage({viewport: {width: 412,height: 880}, isMobile:true, hasTouch:true});
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('file://' + path.resolve(__dirname,'../index.html'));
  await page.waitForTimeout(750);
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
  const cases = await page.evaluate(() => {
    const out=[]; const ok=(name,pass,detail='')=>out.push({name,pass:!!pass,detail});
    setSeed(123); startGame();
    for (let i = 0; i < 120; i++) step(1 / 60);
    render();
    const pitch = Math.atan2(SC.cam[1] - SC.at[1], SC.cam[2] - SC.at[2]) * 180 / Math.PI, dist = Math.hypot(SC.cam[1] - SC.at[1], SC.cam[2] - SC.at[2]), wy = toScr(G.x, 0, G.z)[1] / innerHeight;
    ok('Camera looks down at 38 degrees from 30m', Math.abs(pitch - 38) < 1 && Math.abs(dist - 30 * G.cam.d) < .5, pitch.toFixed(1) + ' deg, ' + dist.toFixed(1) + ' m');
    ok('Walker sits low in the frame, above the controls', wy > .6 && wy < .7, wy.toFixed(2));
    ok('The harness reports the real camera angle', JSON.parse(render_game_to_text()).cameraElevation === 38);
    { render(); for (let i = 0; i < 3; i++) step(1 / 60); const before = {}; for (const k in MESH) before[k] = MESH[k].n; G.en.length = 0; const d0 = draw, s0 = seg; let cut = null; const sc0 = shadowCut; shadowCut = () => { sc0(); cut = {}; for (const k in MESH) cut[k] = MESH[k].ns; };
      let after = null; const rs = renderScene; renderScene = (S, w, h) => { after = {}; for (const k in MESH) after[k] = [MESH[k].ns, MESH[k].n]; rs(S, w, h); }; render(); shadowCut = sc0; renderScene = rs;
      const walkerParts = after ? Object.values(after).reduce((a, v) => a + (v[0] >= 0 ? v[1] - v[0] : 0), 0) : 0; ok('The walker throws no shadow of its own from its lamp', !!cut && walkerParts > 20, walkerParts + ' walker parts left out of the shadow pass'); }
    ok('The animal\'s drawing scale is set to 75% (a constant, not what is on screen)', Math.abs(SS-0.9375)<1e-6);
    ok('A spawned animal carries the 75% collision size', (()=>{const e=spawnShear(G.x,G.z+6,0);return Math.abs(e.s-1.275)<1e-6;})());
    const enemy=G.en[G.en.length-1];
    G.tgt=enemy; G.dcd=0; G.dash=null; G.demo=false;
    dashAuto();
    ok('Tap ram follows acquired enemy', !!G.dash && G.dash.dz>.95 && Math.abs(G.dash.dx)<.05);
    ok('Starting a ram sets no invulnerability timer (tests/behaviour.js proves damage lands in each phase)', G.inv<=0);
    G.dash=null; G.dcd=0;
    enemy.state='stuck'; enemy.x=G.x; enemy.z=G.z+6.5;
    dashAuto();
    ok('Pinned enemy gets 2m closing lunge', Math.abs(G.dash.B-(DASH.burst+2/DASH.v))<.0001, String(G.dash.B));
    G.dash=null; G.dcd=0;
    enemy.state='stalk';
    dashAuto();
    ok('Unpinned enemy does not get bonus range', Math.abs(G.dash.B-DASH.burst)<.0001);
    G.dash=null; G.dcd=0;
    return out;
  });
  const gesture = await page.evaluate(() => {
    setSeed(111); startGame();
    const b=dashBtn(), r=cv.getBoundingClientRect();
    const pt=(type)=>cv.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:41,isPrimary:true,clientX:r.left+b.x,clientY:r.top+b.y,pointerType:'touch'}));
    pt('pointerdown'); const captured=!!dbtn;
    pt('pointercancel');
    return {captured,cancelCleared:!dbtn,noDash:!G.dash};
  });
  cases.push({name:'Pointer cancel clears button without firing',pass:gesture.captured && gesture.cancelCleared && gesture.noDash,detail:JSON.stringify(gesture)});
  for (const c of cases) console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.detail?' ['+c.detail+']':''));
  console.log(`Results: ${cases.filter(x=>x.pass).length}/${cases.length} pass, ${errors.length} page errors`);
  if (cases.some(x=>!x.pass)||errors.length) process.exitCode=1;
  await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
