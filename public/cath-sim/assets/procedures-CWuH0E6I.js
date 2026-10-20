import{n as e,t}from"./guide-dialog-Bzpu28Kj.js";import{i as n,r,t as i}from"./procedures-FRizJaA7.js";e(),t(!1);var a=r,o=n.items,s=`/cath-sim/`,c=e=>e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`),l=e=>o.find(t=>t.id===e),u=e=>e.map(e=>`<li>${c(e)}</li>`).join(``),d=e=>String(e).padStart(2,`0`),f=document.getElementById(`app`);f.className=`journey procs`,f.innerHTML=`
  <header class="eq-hero">
    <p class="kicker">Procedures</p>
    <h1>Pick a procedure, <em>see how it is done</em></h1>
    <p class="lede">${c(a.intro)}</p>
    <div class="eq-searchrow"><div class="j-search">
      <label for="pr-q" class="sr-only">Search procedures</label>
      <input type="search" id="pr-q" placeholder="Search procedures, steps or equipment…" autocomplete="off">
    </div></div>
    <div class="pr-groups" id="pr-groups" role="group" aria-label="Filter by area"></div>
  </header>
  <p id="pr-count" class="j-count" role="status" aria-live="polite"></p>
  <div class="pr-layout">
    <ol id="pr-list" class="pr-list"></ol>
    <article id="pr-detail" class="pr-detail" tabindex="-1" aria-live="polite"></article>
  </div>
  <p class="eq-note">${c(a.note)}</p>`;var p=document.getElementById(`pr-q`),m=document.getElementById(`pr-list`),h=document.getElementById(`pr-detail`),g=document.getElementById(`pr-count`),_=document.getElementById(`pr-groups`),v=``,y=a.items.find(e=>e.id===location.hash.slice(1))?.id??a.items[0].id;_.innerHTML=[{id:``,label:`All`},...a.groups].map(e=>`<button type="button" class="chip" data-g="${e.id}" aria-pressed="${e.id===``}">${c(e.label)}</button>`).join(``);function b(){let e=i(a.items,p.value,v);g.textContent=`${e.length} of ${a.items.length} procedures`,m.innerHTML=e.map(e=>`<li><button type="button" class="pr-item" data-id="${e.id}" aria-current="${e.id===y}"><span class="pr-no">${d(a.items.indexOf(e)+1)}</span><span>${c(e.name)}</span></button></li>`).join(``)||`<li class="empty">Nothing matches that search.</li>`}function x(){let e=a.items.find(e=>e.id===y);h.innerHTML=`
    <p class="kicker">${c(a.groups.find(t=>t.id===e.group)?.label??``)}</p>
    <h2>${c(e.name)}</h2>
    <p class="pr-sum">${c(e.summary)}</p>
    <p><strong>Why it is done.</strong> ${c(e.why)}</p>
    <h3>Indications</h3>
    <ul>${u(e.indications)}</ul>
    <h3>Contraindications</h3>
    <table class="pr-table"><tbody>${e.contra.map(e=>`<tr><th scope="row">${c(e.d)}</th><td>${c(e.i)}</td></tr>`).join(``)}</tbody></table>
    <p class="pr-numnote">Relative contraindications should be corrected where possible. In a life-threatening emergency there are usually no absolute ones.</p>
    <h3>Pre-procedure preparation</h3>
    <ul class="pr-check">${u(e.before)}</ul>
    <h3>Step by step, from puncture to closure</h3>
    <ol class="pr-steps">${e.steps.map(e=>`<li><strong>${c(e.t)}.</strong> ${c(e.d)}${e.dev?.length?`<span class="pr-use">${e.dev.map(e=>`<a href="${s}equipment/#${e}">${c(l(e).name)}</a>`).join(``)}</span>`:``}</li>`).join(``)}</ol>
    <h3>Measurements and formulas</h3>
    <dl class="pr-nums">${e.numbers.map(e=>`<div><dt>${c(e.n)}</dt><dd><code>${c(e.f)}</code><small>${c(e.note)}</small></dd></div>`).join(``)}</dl>
    <p class="pr-numnote">${c(a.numbersNote)}</p>
    <h3>Interpretation of results</h3>
    <ul>${u(e.interpretation)}</ul>
    <h3>Technique tips and practical pearls</h3>
    <ul>${u(e.tips)}</ul>
    <h3>Complications</h3>
    <table class="pr-table pr-comp"><thead><tr><th>Complication</th><th>Approximate frequency</th><th>Notes</th></tr></thead><tbody>${e.complications.map(e=>`<tr><th scope="row">${c(e.c)}</th><td>${c(e.f)}</td><td>${c(e.n)}</td></tr>`).join(``)}</tbody></table>
    <p class="pr-numnote">Frequencies are approximate and depend on the population and the operator.</p>
    <h3>Managing problems</h3>
    <ul>${u(e.problems)}</ul>
    <h3>After the procedure</h3>
    <ul>${u(e.after)}</ul>
    <h3>All equipment from the library</h3>
    <ul class="pr-devs">${e.devices.map(e=>{let t=l(e);return`<li><a href="${s}equipment/#${e}"><span>${c(t.name)}</span><small>${c(t.manufacturer)}</small></a></li>`}).join(``)}</ul>
    ${e.other.length?`<h3>Also used (not in the library)</h3><ul>${e.other.map(e=>`<li>${c(e)}</li>`).join(``)}</ul>`:``}
    <h3 class="warn-h">What to watch for</h3>
    <ul class="safety">${e.watch.map(e=>`<li>${c(e)}</li>`).join(``)}</ul>`}function S(e,t=!1){y=e,history.replaceState(null,``,`#${e}`),b(),x(),t&&matchMedia(`(max-width: 899px)`).matches&&h.scrollIntoView({behavior:`smooth`,block:`start`})}m.addEventListener(`click`,e=>{let t=e.target.closest(`.pr-item`);t&&S(t.dataset.id,!0)}),p.addEventListener(`input`,b),_.addEventListener(`click`,e=>{let t=e.target.closest(`.chip`);t&&(v=t.dataset.g,_.querySelectorAll(`.chip`).forEach(e=>e.setAttribute(`aria-pressed`,String(e===t))),b())}),document.addEventListener(`keydown`,e=>{e.key===`/`&&!/^(input|textarea|select)$/i.test(e.target.tagName)&&(e.preventDefault(),p.focus(),p.select())}),b(),x(),window.addEventListener(`hashchange`,()=>{let e=location.hash.slice(1);e!==y&&a.items.some(t=>t.id===e)&&(y=e,b(),x())});