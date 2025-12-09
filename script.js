// Render the alphabetical menu, wire interactions
(function(){
  const alphabetContainer = document.getElementById('alphabetical');
  const searchInput = document.getElementById('cmdSearch');
  const mainTitle = document.getElementById('mainTitle');
  const cmdDetail = document.getElementById('cmdDetail');
  const cmdName = document.getElementById('cmdName');
  const cmdDesc = document.getElementById('cmdDesc');
  const cmdExample = document.getElementById('cmdExample');
  const copyBtn = document.getElementById('copyExample');
  const openRaw = document.getElementById('openRaw');
  const addCmdBtn = document.getElementById('addCmdBtn');
  const addCmdPanel = document.getElementById('addCmdPanel');
  const addCmdForm = document.getElementById('addCmdForm');
  const cancelAdd = document.getElementById('cancelAdd');
  const expandAll = document.getElementById('expandAll');
  const collapseAll = document.getElementById('collapseAll');
  const toggleSidebar = document.getElementById('toggleSidebar');
  const sidebar = document.getElementById('sidebar');

  let currentCmd = null;
  let customCommands = [];

  // Group commands alphabetically
  function groupCommands(list){
    const groups = {};
    list.forEach(cmd=>{
      const letter = (cmd.name[0]||'#').toUpperCase();
      groups[letter] = groups[letter] || [];
      groups[letter].push(cmd);
    });
    // sort keys
    const sortedKeys = Object.keys(groups).sort();
    const grouped = sortedKeys.map(k => ({letter:k, items: groups[k].sort((a,b)=>a.name.localeCompare(b.name))}));
    return grouped;
  }

  function renderMenu(filter){
    const all = COMMANDS.concat(customCommands);
    const filtered = filter ? all.filter(c => c.name.toLowerCase().includes(filter) || (c.desc||'').toLowerCase().includes(filter)) : all;
    const grouped = groupCommands(filtered);
    alphabetContainer.innerHTML = '';
    if(grouped.length === 0){
      alphabetContainer.innerHTML = '<div class="card neon">No commands match your search. Try adding one!</div>';
      return;
    }
    grouped.forEach(group=>{
      const g = document.createElement('div');
      g.className = 'group';
      const label = document.createElement('div');
      label.className='group-label';
      label.textContent = group.letter + ' ('+group.items.length+')';
      label.addEventListener('click', ()=> g.classList.toggle('collapsed'));
      g.appendChild(label);

      const ul = document.createElement('ul');
      group.items.forEach(item=>{
        const li = document.createElement('li');
        const left = document.createElement('div');
        left.textContent = item.name;
        left.style.fontWeight = 700;
        const right = document.createElement('div');
        right.className='command-bubble';
        right.textContent = item.desc || '';
        li.appendChild(left);
        li.appendChild(right);
        li.addEventListener('click', ()=> openCommand(item));
        ul.appendChild(li);
      });
      g.appendChild(ul);
      alphabetContainer.appendChild(g);
    });
  }

  function openCommand(cmd){
    currentCmd = cmd;
    cmdDetail.classList.remove('hidden');
    addCmdPanel.classList.add('hidden');
    cmdName.textContent = cmd.name;
    cmdDesc.textContent = cmd.desc || '(no description)';
    cmdExample.querySelector('code').textContent = cmd.example || '(no example)';
    mainTitle.textContent = `Command: ${cmd.name}`;
  }

  // simple copy
  copyBtn.addEventListener('click', ()=>{
    const txt = cmdExample.textContent;
    navigator.clipboard?.writeText(txt).then(()=> {
      copyBtn.textContent = 'Copied ✓';
      setTimeout(()=> copyBtn.textContent = 'Copy example', 1400);
    }).catch(()=> {
      copyBtn.textContent = 'Copy failed';
      setTimeout(()=> copyBtn.textContent = 'Copy example', 1400);
    });
  });

  openRaw.addEventListener('click', ()=>{
    if(!currentCmd) return;
    const w = window.open();
    w.document.body.style.background='#0b0b0f';
    const pre = w.document.createElement('pre');
    pre.style.color='#fff';
    pre.style.fontFamily='monospace';
    pre.style.padding='16px';
    pre.textContent = `${currentCmd.name}\n\n${currentCmd.desc}\n\nExample:\n${currentCmd.example}`;
    w.document.body.appendChild(pre);
  });

  // search handling
  searchInput.addEventListener('input', (e)=>{
    const q = e.target.value.trim().toLowerCase();
    renderMenu(q);
  });
  searchInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      const q = e.target.value.trim().toLowerCase();
      // if exact match open the first match
      const all = COMMANDS.concat(customCommands);
      const exact = all.find(c=>c.name.toLowerCase()===q);
      if(exact) openCommand(exact);
    }
  });

  // add command form
  addCmdBtn.addEventListener('click', ()=>{
    addCmdPanel.classList.toggle('hidden');
    cmdDetail.classList.add('hidden');
  });
  cancelAdd.addEventListener('click', ()=>{
    addCmdPanel.classList.add('hidden');
  });
  addCmdForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(addCmdForm);
    const name = (fd.get('name')||'').toString().trim();
    const desc = (fd.get('desc')||'').toString().trim();
    const example = (fd.get('example')||'').toString().trim();
    if(!name) return alert('please provide a command name');
    const obj = {name, desc, example};
    customCommands.push(obj);
    addCmdForm.reset();
    addCmdPanel.classList.add('hidden');
    renderMenu(searchInput.value.trim().toLowerCase());
    openCommand(obj);
  });

  // expand / collapse
  expandAll.addEventListener('click', ()=>{
    document.querySelectorAll('.group').forEach(g=>g.classList.remove('collapsed'));
  });
  collapseAll.addEventListener('click', ()=>{
    document.querySelectorAll('.group').forEach(g=>g.classList.add('collapsed'));
  });

  toggleSidebar.addEventListener('click', ()=>{
    sidebar.classList.toggle('closed');
  });

  // initial render
  renderMenu('');

  // cute floating bubble follow effect
  const bubble = document.getElementById('floating-bubble');
  let t = 0;
  setInterval(()=> {
    t += 0.03;
    bubble.style.transform = `translateY(${Math.sin(t)*6}px) rotate(-9deg)`;
  }, 50);

  // keyboard navigation: j/k to move between items
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'j' || e.key === 'k') {
      const items = Array.from(document.querySelectorAll('#alphabetical li'));
      if(items.length===0) return;
      const idx = items.findIndex(li => li.classList.contains('focused'));
      let next = 0;
      if(idx === -1){
        next = 0;
      } else {
        items[idx].classList.remove('focused');
        next = e.key === 'j' ? Math.min(items.length-1, idx+1) : Math.max(0, idx-1);
      }
      items[next].classList.add('focused');
      items[next].scrollIntoView({behavior:'smooth',block:'nearest'});
      items[next].click();
    }
  });

})();
