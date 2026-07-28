/* ============================================================
   ITS SERVO — interações (portado de ds1.html)
   ============================================================ */
(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Hero: split de caracteres com char-in ---------- */
  function splitChars(el, baseDelay){
    var text = el.getAttribute('data-text') || el.textContent;
    var lead = /^\s/.test(text), trail = /\s$/.test(text);
    var words = text.trim().split(/\s+/);
    el.textContent = '';
    var i = 0;
    if(lead) el.appendChild(document.createTextNode(' '));
    words.forEach(function(word, wi){
      // cada palavra é um bloco inquebrável — a quebra só acontece nos espaços
      var w = document.createElement('span');
      w.className = 'word';
      word.split('').forEach(function(ch){
        var s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch;
        s.style.animationDelay = (baseDelay + i*0.028) + 's';
        w.appendChild(s);
        i++;
      });
      el.appendChild(w);
      if(wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    if(trail) el.appendChild(document.createTextNode(' '));
    return i;
  }
  var delay = 0.1;
  document.querySelectorAll('.hero .chars').forEach(function(el){
    if(reduce){ el.textContent = el.getAttribute('data-text'); return; }
    var count = splitChars(el, delay);
    delay += count*0.028 + 0.04;
  });

  /* ---------- 2. Reveal on scroll ---------- */
  if('IntersectionObserver' in window && !reduce){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold:0.12, rootMargin:'0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- 3. Frases em aramaico bíblico (Daniel/Esdras, escrita hebraica) derivando ---------- */
  var PHRASES = [
    'מְנֵא מְנֵא תְּקֵל וּפַרְסִין',
    'אֱלָהָא דִי־שְׁמַיָּא',
    'לְעָלַם וּלְעָלְמֵי עָלְמַיָּא',
    'דִּי־הוּא אֱלָהָא חַיָּא',
    'בְּרַם אִיתַי אֱלָהּ בִּשְׁמַיָּא גָּלֵא רָזִין',
    'מַלְכוּתֵהּ מַלְכוּת עָלַם',
    'שְׁלָמְכוֹן יִשְׂגֵּא',
    'הוֹדֵית וְשַׁבְּחֵת לְמַלְכָּא'
  ];
  function makePhrases(container, n){
    if(!container || reduce) return;
    var frag = document.createDocumentFragment();
    for(var k=0;k<n;k++){
      var g = document.createElement('i');
      g.textContent = PHRASES[Math.floor(Math.random()*PHRASES.length)];
      // Nas MARGENS laterais (fora do texto), porém MAIORES e mais numerosas
      // para preencher os vazios. Frases longas sangram para fora da tela.
      if(k % 2 === 0){
        g.style.right = (72 + Math.random()*22) + '%';   // margem esquerda (cresce p/ a esquerda)
      } else {
        g.style.left = (68 + Math.random()*26) + '%';    // margem direita (cresce p/ a direita)
      }
      g.style.top = (1 + Math.random()*93) + '%';
      g.style.fontSize = (1.15 + Math.random()*1.15).toFixed(2) + 'rem';
      g.style.animationDuration = (12 + Math.random()*12) + 's';
      g.style.animationDelay = (-Math.random()*22) + 's';
      frag.appendChild(g);
    }
    container.appendChild(frag);
  }
  makePhrases(document.getElementById('glyphs'), 16);
  makePhrases(document.getElementById('glyphs2'), 9);

  /* ---------- 4. Marquee (valores institucionais) ---------- */
  var values = ['Sola Scriptura','Fidelidade doutrinária','Ensino bíblico sólido','Compromisso missionário','Acessível a todos','Presencial e correspondência','36 disciplinas','Coram Deo'];
  var track = document.getElementById('marquee');
  if(track){
    function star(){ return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"/></svg>'; }
    var html = values.map(function(v){ return '<span class="marquee__item">'+star()+v+'</span>'; }).join('');
    track.innerHTML = html + html;
  }

  /* ---------- 5. Acordeão (single-open) ---------- */
  document.querySelectorAll('.acc__trigger').forEach(function(btn){
    btn.addEventListener('click', function(){
      var item = btn.closest('.acc__item');
      var open = item.classList.contains('is-open');
      item.parentElement.querySelectorAll('.acc__item').forEach(function(it){ it.classList.remove('is-open'); });
      if(!open){ item.classList.add('is-open'); }
    });
  });

  /* ---------- 7. Parallax do hero (mouse) ---------- */
  var layers = Array.prototype.slice.call(document.querySelectorAll('.hero__layer'));
  var hero = document.querySelector('.hero');
  if(hero && layers.length && !reduce && window.matchMedia('(hover:hover)').matches){
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    hero.addEventListener('mousemove', function(e){
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      ty = ((e.clientY - r.top)  / r.height - 0.5) * 2;
      if(!raf) raf = requestAnimationFrame(loop);
    });
    hero.addEventListener('mouseleave', function(){ tx = 0; ty = 0; if(!raf) raf = requestAnimationFrame(loop); });
    function loop(){
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      layers.forEach(function(l){
        var d = parseFloat(l.getAttribute('data-depth')) || 10;
        l.style.setProperty('--px', (cx * d).toFixed(2));
        l.style.setProperty('--py', (cy * d).toFixed(2));
      });
      if(Math.abs(tx-cx) > 0.001 || Math.abs(ty-cy) > 0.001){ raf = requestAnimationFrame(loop); }
      else { raf = null; }
    }
  }

  /* ---------- 8. Contagem animada dos números ---------- */
  function animateCount(el){
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var sep = el.getAttribute('data-sep') === '1';
    var dur = 1400, start = null;
    function fmt(n){ return sep ? n.toLocaleString('pt-BR') : String(n); }
    if(reduce){ el.textContent = fmt(target); return; }
    function step(ts){
      if(!start) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(Math.round(target * eased));
      if(t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if('IntersectionObserver' in window){
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ animateCount(e.target); cio.unobserve(e.target); } });
    }, { threshold:0.6 });
    counters.forEach(function(el){ cio.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- 9. Nav: estado ao rolar + barra de progresso ---------- */
  var nav = document.querySelector('.nav');
  var progress = document.getElementById('nav-progress');
  /* scrollHeight força reflow — medir fora do handler de scroll e recalcular
     só quando o layout muda (resize/load). */
  var scrollRange = 0;
  function measureScrollRange(){
    scrollRange = document.documentElement.scrollHeight - window.innerHeight;
  }
  function onScroll(){
    var y = window.scrollY || window.pageYOffset;
    if(nav) nav.classList.toggle('is-scrolled', y > 24);
    if(progress){
      progress.style.width = (scrollRange > 0 ? (y / scrollRange) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', function(){ measureScrollRange(); onScroll(); }, { passive:true });
  window.addEventListener('load', function(){ measureScrollRange(); onScroll(); });
  measureScrollRange();
  onScroll();

  /* ---------- 10. Spotlight que segue o cursor nos cartões ---------- */
  if(window.matchMedia('(hover:hover)').matches){
    document.querySelectorAll('.card').forEach(function(card){
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  /* ---------- 11. Menu mobile ---------- */
  var toggle = document.getElementById('nav-toggle');
  var menu = document.getElementById('mobile-menu');
  if(toggle && menu){
    toggle.addEventListener('click', function(){
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ menu.classList.remove('is-open'); toggle.setAttribute('aria-expanded','false'); });
    });
  }

  /* ---------- 12. Ano dinâmico no rodapé ---------- */
  var yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();
})();
