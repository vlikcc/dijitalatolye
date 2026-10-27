import type { DemoGame } from "./types";
import { renderScene, escapeHtml } from "./scenes";
import fontCss from "./font-css.json";
const runtime = String.raw`
const game = JSON.parse(document.getElementById('game-data').textContent);
const intro=document.getElementById('intro'), play=document.getElementById('play'), finish=document.getElementById('finish');
const controls=document.getElementById('controls'), feedback=document.getElementById('feedback'), next=document.getElementById('next');
let roundIndex=0, attempts=0, correct=0, completed=false;
const button=(label,fn,cls='answer')=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.className=cls;b.addEventListener('click',fn);return b;};
function message(ok,body){feedback.className=ok?'feedback good':'feedback retry';feedback.textContent=(ok?'Doğru! ':'Bir daha deneyelim. ')+body;}
function done(){completed=true;message(true,game.rounds[roundIndex].explanation);next.hidden=false;next.textContent=roundIndex===game.rounds.length-1?'Sonucu gör':'Sonraki etkinlik';controls.querySelectorAll('button').forEach(b=>b.disabled=true);next.focus({preventScroll:true});}
function judge(ok,help){attempts++;if(ok){correct++;}else message(false,help);return ok;}
function render(){
 completed=false;controls.replaceChildren();feedback.textContent='';feedback.className='feedback';next.hidden=true;
 const r=game.rounds[roundIndex];document.getElementById('prompt').textContent=r.prompt;
 document.getElementById('progress-label').textContent='Etkinlik '+(roundIndex+1)+' / '+game.rounds.length;
 document.getElementById('progress').value=roundIndex;document.getElementById('progress').max=game.rounds.length;
 controls.className='controls '+r.type;document.getElementById('hint').textContent=r.type==='choice'?'Doğru olduğunu düşündüğün cevabı seç.':r.type==='match'?'Önce soldan, sonra sağdan bir sözcük seç.':r.type==='order'?'Parçalara doğru sırayla dokun. Değiştirmek için sıradaki parçaya tekrar dokun.':'Önce bir örnek, sonra ait olduğu grubu seç.';
 if(r.type==='choice'){
  r.options.forEach(label=>{const b=button(label,()=>{if(completed)return;if(judge(label===r.answer,'Sorudaki ipucunu yeniden düşün.')){b.classList.add('selected');done();}else{b.classList.add('incorrect');b.setAttribute('aria-label',label+' — tekrar düşün');}});controls.append(b);});
 }else if(r.type==='match'){
  let selected=-1, solved=new Set();const left=document.createElement('div'),right=document.createElement('div');left.className=right.className='match-column';controls.append(left,right);
  const leftButtons=r.pairs.map((pair,i)=>{const b=button(pair[0],()=>{selected=i;left.querySelectorAll('button').forEach(el=>{el.classList.remove('selected');el.setAttribute('aria-pressed','false');});b.classList.add('selected');b.setAttribute('aria-pressed','true');});b.setAttribute('aria-pressed','false');left.append(b);return b;});
  [...r.pairs].reverse().forEach(pair=>{const b=button(pair[1],()=>{if(selected<0){message(false,'Önce sol sütundan bir sözcük seç.');return;}if(judge(r.pairs[selected][1]===pair[1],'Bu iki sözcük eşleşmiyor. Başka bir eş dene.')){solved.add(selected);leftButtons[selected].disabled=true;leftButtons[selected].classList.add('solved');b.disabled=true;b.classList.add('solved');selected=-1;message(true,'Bir eş daha buldun.');if(solved.size===r.pairs.length)done();}});right.append(b);});
 }else if(r.type==='order'){
  let picked=[];const output=document.createElement('div');output.className='ordered';output.setAttribute('aria-label','Seçtiğin sıra');const pool=document.createElement('div');pool.className='order-pool';const check=button('Sıralamayı kontrol et',()=>{if(picked.length!==r.items.length){message(false,'Önce tüm parçaları sıraya yerleştir.');return;}if(judge(picked.every((item,i)=>item===r.items[i]),'Sıra henüz doğru değil. Parçaları geri alıp yeniden sırala.'))done();},'check');controls.append(output,pool,check);
  function draw(){output.replaceChildren();pool.replaceChildren();[...r.items].reverse().forEach(item=>{const b=button(item,()=>{picked.push(item);draw();});b.disabled=picked.includes(item);pool.append(b);});picked.forEach((item,i)=>output.append(button((i+1)+'. '+item,()=>{picked=picked.filter(x=>x!==item);draw();},'sequence-item')));check.disabled=picked.length!==r.items.length;}draw();
 }else{
  let selected=null, solved=new Set();const pool=document.createElement('div');pool.className='sort-pool';const groups=document.createElement('div');groups.className='sort-groups';controls.append(pool,groups);
  const itemButtons=new Map();r.items.forEach(item=>{const b=button(item.label,()=>{selected=item;pool.querySelectorAll('button').forEach(el=>{el.classList.remove('selected');el.setAttribute('aria-pressed','false');});b.classList.add('selected');b.setAttribute('aria-pressed','true');});b.setAttribute('aria-pressed','false');itemButtons.set(item.label,b);pool.append(b);});
  r.groups.forEach(group=>groups.append(button(group,()=>{if(!selected){message(false,'Önce bir örnek seç.');return;}if(judge(selected.group===group,'Örneğin özelliğini düşün ve başka bir grup dene.')){solved.add(selected.label);const b=itemButtons.get(selected.label);b.disabled=true;b.classList.add('solved');selected=null;message(true,'Doğru grubu buldun.');if(solved.size===r.items.length)done();}},'group')));
 }
 document.getElementById('prompt').focus({preventScroll:true});
}
function start(){roundIndex=0;attempts=0;correct=0;intro.hidden=true;finish.hidden=true;play.hidden=false;render();}
document.getElementById('start').addEventListener('click',start);
document.getElementById('restart').addEventListener('click',start);
next.addEventListener('click',()=>{if(!completed)return;roundIndex++;if(roundIndex<game.rounds.length)render();else{play.hidden=true;finish.hidden=false;document.getElementById('result').textContent=game.rounds.length+' etkinliği tamamladın. '+attempts+' denemede '+correct+' doğru adım attın.';document.getElementById('finish-title').focus({preventScroll:true});}});
// Reflow at the real viewport width first, then contain the entire active screen.
// Measuring inside the sandbox keeps the parent from needing access to game DOM.
const viewport=document.getElementById('game-viewport'), content=document.getElementById('game-content');
let fitRequest=0;
function fit(){
 fitRequest=0;
 const width=viewport.clientWidth,height=viewport.clientHeight;
 if(!width||!height)return;
 const layoutWidth=Math.max(320,Math.min(width,1440));
 content.style.width=layoutWidth+'px';
 const naturalHeight=content.offsetHeight;
 const scale=Math.min(1,width/layoutWidth,height/Math.max(1,naturalHeight));
 content.style.transform='translate('+Math.max(0,(width-layoutWidth*scale)/2)+'px, '+Math.max(0,(height-naturalHeight*scale)/2)+'px) scale('+scale+')';
}
function scheduleFit(){if(!fitRequest)fitRequest=requestAnimationFrame(fit);}
const fitObserver=new ResizeObserver(scheduleFit);
fitObserver.observe(viewport);fitObserver.observe(content);
document.fonts.ready.then(scheduleFit);
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&window.parent!==window)window.parent.postMessage({type:'atlas:exit-theater'},'*');});
if(new URLSearchParams(location.search).get('autostart')==='1')start();
scheduleFit();
`;
export function demoDocument(game: DemoGame, cover = false) {
  const data = JSON.stringify(game).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(game.title)} · Demo</title><style>
${fontCss}
*{box-sizing:border-box}body{margin:0;font-family:"Source Sans 3",sans-serif;color:#18213d;background:#fff}button{font:inherit;cursor:pointer;touch-action:manipulation}button:focus-visible{outline:3px solid #7046d3;outline-offset:4px}button:disabled{cursor:default;opacity:.55}[hidden]{display:none!important}h1,h2,p{margin:0}h1,h2{font-family:"Manrope Variable",sans-serif;font-weight:700}strong{font-weight:600}h1{font-size:28px;line-height:1.25}h2{font-size:23px;line-height:1.4}.scene{background:${game.background};height:190px;overflow:hidden}.scene svg{display:block;width:100%;height:100%}.intro{text-align:center}.intro .scene{height:300px}.intro-content{padding:25px 24px}.intro p{font-size:16px;color:#59627b;margin:10px auto 22px;max-width:48ch;line-height:1.6}.primary,.check{background:#7046d3;border:0;border-radius:10px;color:white;padding:13px 24px;font-weight:600;min-height:46px}.play-top{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:14px 24px;font-size:13px;color:#59627b}.play-top strong{color:#18213d}.play-top progress{width:100px;height:6px;accent-color:#7046d3}.question{padding:21px 26px 26px;max-width:800px;margin:auto}#hint{font-size:14px;color:#59627b;line-height:1.5;margin:7px 0 16px}.controls{display:flex;gap:12px;flex-wrap:wrap}.answer,.group,.sequence-item{min-height:47px;padding:12px 18px;border:1px solid #a5a4b6;background:#fff;border-radius:10px;color:#18213d;line-height:1.35}.answer:hover:enabled,.group:hover:enabled{background:#f2edfc;border-color:#7046d3}.choice .answer{flex:1;min-width:120px}.selected{background:#ede5fc!important;border-color:#7046d3!important;box-shadow:inset 0 0 0 1px #7046d3}.incorrect{border-color:#b25549}.solved{background:#e3f2ea!important;color:#1c6149;opacity:.8!important}.match{display:grid;grid-template-columns:1fr 1fr}.match-column{display:grid;gap:10px}.order{display:block}.order-pool,.ordered,.sort-pool,.sort-groups{display:flex;gap:9px;flex-wrap:wrap}.ordered{min-height:60px;padding:8px;border-radius:10px;background:#f5f2fb;margin-bottom:12px}.sequence-item{background:#ede5fc;border-color:#c3afe7}.check{margin-top:15px}.sort{display:block}.sort-groups{margin-top:18px}.group{border-style:dashed;border-color:#7046d3;background:#f8f5ff;flex:1}.feedback{min-height:24px;margin-top:18px;line-height:1.55;font-size:15px}.good{color:#176247}.retry{color:#9a3b2f}#next{margin-top:16px}.finish{min-height:480px;display:grid;place-content:center;text-align:center;padding:36px;gap:18px;background:#f4efff}.finish h2{font-size:34px}.finish p{max-width:44ch;line-height:1.65;margin:auto;color:#59627b}.finish .complete-mark{margin:auto;display:grid;place-items:center;width:72px;height:72px;border-radius:50%;background:#e1f2e9;color:#176247;font-size:40px}.finish button{justify-self:center}#prompt:focus,#finish-title:focus{outline:none}@media(max-width:480px){.scene{height:145px}.intro .scene{height:240px}.question{padding:18px 16px}.question h2{font-size:19px}.play-top{padding:12px 16px}.answer,.group,.sequence-item{font-size:14px;padding:12px}.choice .answer{min-width:100%;flex:1}.match{gap:8px}.intro-content{padding:20px 16px}.intro h1{font-size:25px}.order-pool{gap:7px}.sort-groups{gap:7px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
html,body{height:100%;overflow:hidden}
#game-viewport{position:relative;width:100%;height:100dvh;overflow:hidden}
#game-content{position:absolute;top:0;left:0;transform-origin:top left}
#play{min-height:100dvh}
#play .scene{height:clamp(110px,28dvh,200px)}
.play-top{border-bottom:1px solid #e0dfea;gap:12px}
.play-top strong{min-width:0}
.play-top span{white-space:nowrap}
.question{padding:24px;max-width:880px;width:100%}
.feedback:empty{display:none}
.finish{min-height:100dvh}
@media(min-width:700px){
 #play{display:grid;grid-template-columns:minmax(0,0.9fr) minmax(0,1.1fr);grid-template-rows:auto 1fr}
 .play-top{grid-column:1/-1;align-self:start}
 #play .scene{height:auto;min-height:280px;position:relative}
 #play .scene svg{position:absolute;inset:0}
 .question{align-self:center;padding:28px 32px}
 .question h2{font-size:clamp(19px,2.2vw,27px)}
 .choice{flex-direction:column}
 .choice .answer{width:100%;text-align:left}
}
@media(max-width:480px){
 .question{padding:16px}
 .play-top{padding:12px 16px;flex-wrap:wrap;gap:6px 12px}
 .play-top strong{flex:1}
 .play-top progress{width:100%;height:4px}
 .intro .scene{height:clamp(130px,30dvh,240px)}
 .finish{padding:24px;gap:16px}
 .finish h2{font-size:27px}
}
@media(max-height:440px) and (min-width:600px){
 #play{display:grid;grid-template-columns:minmax(0,0.7fr) minmax(0,1.3fr);grid-template-rows:auto 1fr}
 .play-top{grid-column:1/-1;padding:8px 16px}
 #play .scene{height:auto;min-height:180px;position:relative}
 #play .scene svg{position:absolute;inset:0}
 .question{padding:16px 24px;align-self:center}
 .question h2{font-size:19px}
 #hint{margin:6px 0 12px}
 .choice{flex-direction:row}
 .choice .answer{width:auto;min-width:80px;text-align:center}
 .feedback{margin-top:12px}
 #next{margin-top:12px}
}
${cover ? "html,body{width:720px;height:440px;overflow:hidden}.scene{width:720px;height:440px}" : ""}
</style></head><body>${
    cover
      ? `<div class="scene">${renderScene(game)}</div>`
      : `
<main id="game-viewport"><div id="game-content"><section id="intro" class="intro"><div class="scene">${renderScene(game)}</div><div class="intro-content"><h1>${escapeHtml(game.title)}</h1><p>${escapeHtml(game.description)}</p><button id="start" class="primary">Başla</button></div></section>
<section id="play" hidden><div class="play-top"><strong>${escapeHtml(game.title)}</strong><span id="progress-label"></span><progress id="progress" aria-label="Etkinlik ilerlemesi" max="${game.rounds.length}" value="0"></progress></div><div class="scene">${renderScene(game)}</div><div class="question"><h2 id="prompt" tabindex="-1"></h2><p id="hint"></p><div id="controls"></div><p id="feedback" class="feedback" role="status" aria-live="polite"></p><button id="next" class="primary" hidden>Sonraki etkinlik</button></div></section>
<section id="finish" class="finish" hidden><div class="complete-mark" aria-hidden="true"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div><h2 id="finish-title" tabindex="-1">Keşfi tamamladın!</h2><p id="result"></p><p>${escapeHtml(game.objective)}</p><button id="restart" class="primary">Yeniden oyna</button></section>
</div></main><script type="application/json" id="game-data">${data}</script><script>${runtime}</script>`
  }</body></html>`;
}
