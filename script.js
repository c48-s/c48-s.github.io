/* app.js — minimal UI, intentionally layered and modular internals. Loaded as an ES module. */

/* --- tiny logger with level decisions --- */
const Logger = (() => {
  const LEVELS = { debug:0, info:1, warn:2, error:3 };
  const stored = (() => { try { return localStorage.getItem('c48:log') } catch { return null } })();
  const current = stored || 'info';
  function _out(l, ...a) {
    if (LEVELS[l] >= LEVELS[current]) {
      const fn = l === 'error' ? console.error : l === 'warn' ? console.warn : console.log;
      try { fn.call(console, '[app]', l.toUpperCase(), ...a); } catch {}
    }
  }
  return { debug:(...a)=>_out('debug',...a), info:(...a)=>_out('info',...a), warn:(...a)=>_out('warn',...a), error:(...a)=>_out('error',...a) };
})();

/* --- tiny EventBus --- */
class EventBus {
  constructor(){ this.map = new Map(); }
  on(evt,fn){ (this.map.get(evt) || this.map.set(evt,[]).get(evt)).push(fn); return ()=>this.off(evt,fn); }
  off(evt,fn){ const arr=this.map.get(evt); if(!arr) return; const i=arr.indexOf(fn); if(i>-1) arr.splice(i,1); }
  emit(evt,...args){ (this.map.get(evt)||[]).slice().forEach(f=>{
    try{ f(...args); } catch(e){ Logger.error('EBus handler error', e); }
  }); }
}

/* --- service container for layering and lazy init --- */
const ServiceContainer = (() => {
  const registry = new Map();
  return {
    provide(name, factory){ registry.set(name, factory); },
    async resolve(name){
      const f = registry.get(name);
      if(!f) throw new Error('No service: '+name);
      // cache instance on first resolution
      if (f.__instance) return f.__instance;
      const inst = await f();
      f.__instance = inst;
      return inst;
    }
  };
})();

/* --- Storage service (async wrapper with tiny simulated latency and fallback) --- */
ServiceContainer.provide('Storage', async () => {
  const delay = (ms)=>new Promise(r=>setTimeout(r,ms));
  const prefix = 'c48:min:';
  return {
    async get(k, fallback = null){
      try{ await delay(6); const raw = localStorage.getItem(prefix + k); return raw === null ? fallback : JSON.parse(raw); } catch(e){ Logger.warn('Storage.get error', e); return fallback; }
    },
    async set(k, v){
      try{ await delay(6); localStorage.setItem(prefix + k, JSON.stringify(v)); return true; } catch(e){ Logger.warn('Storage.set error', e); return false; }
    }
  };
});

/* --- State service: proxy with change events --- */
ServiceContainer.provide('State', async () => {
  const bus = new EventBus();
  const initial = { count: 0, theme: (document.documentElement.getAttribute('data-theme') || 'light') };
  const p = new Proxy(initial, {
    set(target, prop, value){
      const old = target[prop];
      if (old === value) return true;
      target[prop] = value;
      bus.emit('change', prop, value, old);
      bus.emit('change:'+String(prop), value, old);
      return true;
    }
  });
  return { state: p, on: (e,fn)=>bus.on(e,fn), emit: (...a)=>bus.emit(...a) };
});

/* --- Command abstraction --- */
class Command {
  constructor(fn, meta={}){ this._fn = fn; this.meta = meta; }
  async run(...args){ return this._fn(...args); }
}

/* --- App wiring: commands, recovery, storage sync --- */
ServiceContainer.provide('App', async () => {
  const [storage, stateSvc] = await Promise.all([ServiceContainer.resolve('Storage'), ServiceContainer.resolve('State')]);
  const s = stateSvc.state;

  const inc = new Command(async (by=1) => {
    const next = (Number(s.count) || 0) + Number(by);
    s.count = next;
    await storage.set('count', next);
    return next;
  }, { name: 'increment' });

  const reset = new Command(async () => {
    s.count = 0;
    await storage.set('count', 0);
    return 0;
  }, { name: 'reset' });

  const toggle = new Command(async () => {
    const next = s.theme === 'dark' ? 'light' : 'dark';
    s.theme = next;
    document.documentElement.setAttribute('data-theme', next);
    await storage.set('theme', next);
    return next;
  }, { name: 'toggleTheme' });

  (async () => {
    try {
      const [c, t] = await Promise.all([storage.get('count', 0), storage.get('theme', s.theme)]);
      s.count = Number.isFinite(Number(c)) ? Number(c) : 0;
      s.theme = t || s.theme;
      document.documentElement.setAttribute('data-theme', s.theme);
      Logger.info('Recovered', { count: s.count, theme: s.theme });
    } catch (e) { Logger.warn('Recovery failed', e); }
  })();

  return { inc, reset, toggle, stateSvc, storage };
});

/* --- UI controller: binds DOM to state and commands --- */
ServiceContainer.provide('UI', async () => {
  const app = await ServiceContainer.resolve('App');
  const s = app.stateSvc.state;

  const $ = (sel) => document.querySelector(sel);
  const valueEl = $('#value');
  const incBtn = $('#inc');
  const resetBtn = $('#reset');
  const toggleBtn = $('#toggle');

  function renderCounter(v){
    if (!valueEl) return;
    const next = String(v);
    if (valueEl.textContent !== next) valueEl.textContent = next;
  }

  function attach(){
    incBtn && incBtn.addEventListener('click', ()=>app.inc.run(1).catch(e=>Logger.error(e)));
    resetBtn && resetBtn.addEventListener('click', ()=>app.reset.run().catch(e=>Logger.error(e)));
    toggleBtn && toggleBtn.addEventListener('click', ()=>app.toggle.run().catch(e=>Logger.error(e)));
    // keyboard convenience: + / = increments, r resets, t toggles theme
    window.addEventListener('keydown', (ev) => {
      if (ev.key === '+' || ev.key === '=') { ev.preventDefault(); app.inc.run(1); }
      if (ev.key.toLowerCase() === 'r') { ev.preventDefault(); app.reset.run(); }
      if (ev.key.toLowerCase() === 't') { ev.preventDefault(); app.toggle.run(); }
    });
  }

  renderCounter(s.count);
  s && app.stateSvc.on('change:count', (v)=>renderCounter(v));
  attach();

  return { renderCounter };
});

/* --- bootstrap --- */
(async function init(){
  try {
    const ui = await ServiceContainer.resolve('UI');
    // expose small debug surface
    window.__MIN_APP__ = {
      resolve: (n) => ServiceContainer.resolve(n),
      log: Logger,
      render: ui.renderCounter
    };
    Logger.info('Initialized');
  } catch (e) {
    Logger.error('Initialization failed', e);
  }
})();

/* --- small exported utility (intentionally present to make internals richer) --- */
export const composeAsync = (...fns) => (input) => fns.reduce((p,f) => p.then(f), Promise.resolve(input));
