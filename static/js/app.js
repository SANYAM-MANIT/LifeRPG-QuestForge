// Life RPG Main Application Controller
let currentUser = null;
let currentQuests = [];
let shopItems = [];
let inventoryItems = [];
let currentBoss = null;
let activeTab = 'quests';
let questFilter = { status: 'all', category: 'all', difficulty: 'all' };

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  initLucide();
  setupEventListeners();
  setupKeyboardShortcuts();

  // Check auth state
  if (api.token) {
    try {
      await loadUserData();
      switchTab('quests');
    } catch (e) {
      console.warn('Session expired or invalid:', e);
      showAuthModal('login');
    }
  } else {
    showAuthModal('signup');
  }
});

function initLucide() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Sound Toggle Button
  const soundBtn = document.getElementById('sound-toggle-btn');
  if (soundBtn) {
    updateSoundBtnIcon();
    soundBtn.addEventListener('click', () => {
      const isMuted = soundManager.toggleMute();
      updateSoundBtnIcon();
      showToast(isMuted ? 'Audio muted' : 'Audio enabled', 'info');
      if (!isMuted) soundManager.playCoinSound();
    });
  }

  // Logout Button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      api.setToken(null);
      currentUser = null;
      showToast('Logged out successfully', 'info');
      showAuthModal('login');
    });
  }

  // Auth Modal events
  window.addEventListener('auth:required', () => {
    showAuthModal('login');
  });

  // Category & Difficulty Filter Listeners
  document.getElementById('filter-status')?.addEventListener('change', (e) => {
    questFilter.status = e.target.value;
    renderQuests();
  });
  document.getElementById('filter-category')?.addEventListener('change', (e) => {
    questFilter.category = e.target.value;
    renderQuests();
  });
  document.getElementById('filter-difficulty')?.addEventListener('change', (e) => {
    questFilter.difficulty = e.target.value;
    renderQuests();
  });
}

function updateSoundBtnIcon() {
  const icon = document.getElementById('sound-icon');
  if (icon) {
    icon.setAttribute('data-lucide', soundManager.isMuted() ? 'volume-x' : 'volume-2');
    initLucide();
  }
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Ignore when typing inside inputs or textareas
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      if (e.key === 'Escape') {
        document.activeElement.blur();
        closeAllModals();
      }
      return;
    }

    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      openQuestModal();
    } else if (e.key === '1') {
      switchTab('quests');
    } else if (e.key === '2') {
      switchTab('attributes');
    } else if (e.key === '3') {
      switchTab('shop');
    } else if (e.key === '4') {
      switchTab('boss');
    } else if (e.key === '5') {
      switchTab('activity');
    } else if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

// Tab Switching
function switchTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.remove('bg-indigo-600/30', 'text-indigo-400', 'border-indigo-500');
    btn.classList.add('text-gray-400');
  });

  const activeContent = document.getElementById(`tab-${tabName}`);
  const activeBtn = document.querySelector(`.nav-tab-btn[data-tab="${tabName}"]`);

  if (activeContent) activeContent.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.add('bg-indigo-600/30', 'text-indigo-400', 'border-indigo-500');
    activeBtn.classList.remove('text-gray-400');
  }

  // Load specific tab data
  if (tabName === 'quests') loadQuests();
  else if (tabName === 'attributes') renderAttributes();
  else if (tabName === 'shop') loadShopAndInventory();
  else if (tabName === 'boss') loadBoss();
  else if (tabName === 'activity') loadActivityLogs();
}

// Load Full User Data
async function loadUserData() {
  currentUser = await api.getMe();
  renderUserHeader();
  document.getElementById('auth-modal')?.classList.add('hidden');
  document.getElementById('app-main-content')?.classList.remove('hidden');
}

// Render User Status in Top Bar & Hero Header
function renderUserHeader() {
  if (!currentUser) return;

  // Theme application
  if (currentUser.theme === 'cyberpunk') {
    document.body.classList.add('theme-cyberpunk');
  } else {
    document.body.classList.remove('theme-cyberpunk');
  }

  // Name & Title
  document.getElementById('user-name').innerText = currentUser.username;
  document.getElementById('user-title').innerText = currentUser.title;
  document.getElementById('user-level-badge').innerText = `LVL ${currentUser.level}`;

  // Currency
  document.getElementById('user-gold').innerText = currentUser.gold.toLocaleString();
  document.getElementById('user-gems').innerText = currentUser.gems.toLocaleString();
  document.getElementById('user-streak').innerText = `${currentUser.streak_count}d`;

  // Health Bar
  const hpPct = Math.min(100, Math.max(0, (currentUser.hp / currentUser.max_hp) * 100));
  const hpBar = document.getElementById('user-hp-bar');
  if (hpBar) hpBar.style.width = `${hpPct}%`;
  document.getElementById('user-hp-text').innerText = `${currentUser.hp} / ${currentUser.max_hp} HP`;

  // XP Bar
  const xpPct = Math.min(100, Math.max(0, (currentUser.current_xp / currentUser.xp_to_next_level) * 100));
  const xpBar = document.getElementById('user-xp-bar');
  if (xpBar) xpBar.style.width = `${xpPct}%`;
  document.getElementById('user-xp-text').innerText = `${currentUser.current_xp} / ${currentUser.xp_to_next_level} XP`;

  // Avatar Icon
  const avatarImg = document.getElementById('user-avatar-icon');
  if (avatarImg) {
    avatarImg.src = getAvatarUrl(currentUser.avatar);
  }

  // Mobile stats sync
  const streakMob = document.getElementById('user-streak-mob');
  if (streakMob) streakMob.innerText = `${currentUser.streak_count}d`;
  const goldMob = document.getElementById('user-gold-mob');
  if (goldMob) goldMob.innerText = currentUser.gold.toLocaleString();

  initLucide();
}

function getAvatarUrl(avatarKey) {
  const map = {
    knight: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80',
    mage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80',
    rogue: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80',
    cyber: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    paladin: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80'
  };
  return map[avatarKey] || map['knight'];
}

// ---------------- QUESTS SYSTEM ----------------

async function loadQuests() {
  const container = document.getElementById('quests-list-container');
  if (container) {
    container.innerHTML = '<div class="text-center py-12 text-gray-400 flex items-center justify-center gap-2"><i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Fetching active quests...</div>';
    initLucide();
  }

  try {
    currentQuests = await api.getQuests(questFilter.status, questFilter.category, questFilter.difficulty);
    renderQuests();
  } catch (error) {
    showToast('Failed to load quests: ' + error.message, 'error');
  }
}

function renderQuests() {
  const container = document.getElementById('quests-list-container');
  if (!container) return;

  // Filter client-side if needed
  let filtered = currentQuests;
  if (questFilter.status === 'active') filtered = filtered.filter(q => !q.is_completed);
  if (questFilter.status === 'completed') filtered = filtered.filter(q => q.is_completed);
  if (questFilter.category !== 'all') filtered = filtered.filter(q => q.category === questFilter.category);
  if (questFilter.difficulty !== 'all') filtered = filtered.filter(q => q.difficulty === questFilter.difficulty);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-panel p-10 rounded-2xl text-center border border-dashed border-gray-700/80">
        <i data-lucide="sparkles" class="w-12 h-12 text-indigo-400 mx-auto mb-3 opacity-60"></i>
        <h3 class="text-lg font-bold text-gray-200">No Quests Found</h3>
        <p class="text-sm text-gray-400 mt-1 mb-4">No quests match your current filter. Create a new quest to start earning XP!</p>
        <button onclick="openQuestModal()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/25 transition">
          + Forge New Quest (N)
        </button>
      </div>
    `;
    initLucide();
    return;
  }

  const difficultyBadges = {
    Trivial: 'bg-gray-700/60 text-gray-300 border-gray-600',
    Easy: 'bg-emerald-950/60 text-emerald-400 border-emerald-800',
    Medium: 'bg-blue-950/60 text-blue-400 border-blue-800',
    Hard: 'bg-amber-950/60 text-amber-400 border-amber-800',
    Epic: 'bg-purple-950/60 text-purple-400 border-purple-800'
  };

  const categoryIcons = {
    Study: 'book-open',
    Fitness: 'dumbbell',
    Health: 'heart',
    Productivity: 'zap',
    Social: 'users',
    General: 'check-circle'
  };

  container.innerHTML = filtered.map(quest => `
    <div class="quest-card glass-panel p-4 rounded-xl flex items-start justify-between gap-4 ${quest.is_completed ? 'opacity-60 bg-gray-900/40 border-gray-800' : 'border-indigo-900/40'}" data-quest-id="${quest.id}">
      <div class="flex items-start gap-3.5 flex-1">
        <button onclick="toggleQuestComplete(${quest.id}, event)" class="mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition ${quest.is_completed ? 'bg-emerald-500 border-emerald-500 text-gray-950' : 'border-gray-500 hover:border-indigo-400 bg-gray-900/50'}">
          ${quest.is_completed ? '<i data-lucide="check" class="w-4 h-4 stroke-[3]"></i>' : ''}
        </button>

        <div class="flex-1">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <span class="text-xs px-2 py-0.5 rounded border font-medium ${difficultyBadges[quest.difficulty] || difficultyBadges.Medium}">
              ${quest.difficulty}
            </span>
            <span class="text-xs px-2 py-0.5 rounded bg-gray-800/80 text-gray-300 border border-gray-700 flex items-center gap-1">
              <i data-lucide="${categoryIcons[quest.category] || 'tag'}" class="w-3 h-3"></i>
              ${quest.category}
            </span>
            <span class="text-xs text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/50">
              ⚡ ${quest.attribute_target}
            </span>
            ${quest.recurrence !== 'once' ? `<span class="text-xs text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50 capitalize">🔄 ${quest.recurrence}</span>` : ''}
          </div>

          <h4 class="font-semibold text-base ${quest.is_completed ? 'line-through text-gray-400' : 'text-gray-100'}">
            ${escapeHtml(quest.title)}
          </h4>
          ${quest.description ? `<p class="text-xs text-gray-400 mt-1">${escapeHtml(quest.description)}</p>` : ''}

          <div class="flex items-center gap-3 mt-2 text-xs font-semibold">
            <span class="text-purple-400 flex items-center gap-1">
              <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> +${quest.xp_reward} XP
            </span>
            <span class="text-amber-400 flex items-center gap-1">
              <i data-lucide="coins" class="w-3.5 h-3.5"></i> +${quest.gold_reward} Gold
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-1 opacity-80">
        <button onclick="openQuestModal(${quest.id})" title="Edit Quest" class="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/80 transition">
          <i data-lucide="pencil" class="w-4 h-4"></i>
        </button>
        <button onclick="deleteQuest(${quest.id})" title="Delete Quest" class="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800/80 transition">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `).join('');

  initLucide();
}

// Toggle Quest Complete / Uncomplete with micro-animations & combat numbers
async function toggleQuestComplete(questId, event) {
  const quest = currentQuests.find(q => q.id === questId);
  if (!quest) return;

  const rect = event ? event.target.getBoundingClientRect() : { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
  const clickX = rect.clientX || rect.x;
  const clickY = rect.clientY || rect.y;

  if (!quest.is_completed) {
    try {
      // Optimistic visual feedback
      soundManager.playQuestComplete();
      soundManager.playCoinSound();

      const res = await api.completeQuest(questId);
      
      // Spawn floating numbers
      spawnCombatNumber(`+${res.xp_gained} XP`, clickX, clickY - 20, '#a855f7');
      spawnCombatNumber(`+${res.gold_gained} Gold`, clickX + 40, clickY + 10, '#f59e0b');
      if (res.boss_damage_dealt > 0) {
        spawnCombatNumber(`💥 -${res.boss_damage_dealt} HP Boss`, clickX - 20, clickY - 40, '#ec4899');
      }

      // Check level up celebration
      if (res.leveled_up) {
        soundManager.playLevelUp();
        triggerConfettiFireworks();
        showLevelUpModal(res.new_level);
      }

      if (res.boss_defeated) {
        triggerConfettiFireworks();
        showToast('🏆 You defeated the Boss Monster! Bonus loot collected!', 'success');
      }

      await loadUserData();
      await loadQuests();
    } catch (error) {
      soundManager.playError();
      showToast(error.message, 'error');
    }
  } else {
    try {
      await api.uncompleteQuest(questId);
      showToast('Quest marked active', 'info');
      await loadUserData();
      await loadQuests();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
}

// Delete Quest
async function deleteQuest(questId) {
  if (!confirm('Are you sure you want to delete this quest?')) return;
  try {
    await api.deleteQuest(questId);
    showToast('Quest deleted', 'info');
    await loadQuests();
  } catch (error) {
    showToast('Failed to delete: ' + error.message, 'error');
  }
}

// Open Quest Creation / Edit Modal
function openQuestModal(questId = null) {
  const modal = document.getElementById('quest-modal');
  const title = document.getElementById('quest-modal-title');
  const form = document.getElementById('quest-form');
  form.reset();

  if (questId) {
    const q = currentQuests.find(item => item.id === questId);
    if (q) {
      title.innerText = 'Edit Quest';
      document.getElementById('quest-id-input').value = q.id;
      document.getElementById('quest-title-input').value = q.title;
      document.getElementById('quest-desc-input').value = q.description || '';
      document.getElementById('quest-category-input').value = q.category;
      document.getElementById('quest-difficulty-input').value = q.difficulty;
      document.getElementById('quest-attr-input').value = q.attribute_target;
      document.getElementById('quest-recurrence-input').value = q.recurrence;
    }
  } else {
    title.innerText = 'Forge New Quest';
    document.getElementById('quest-id-input').value = '';
  }

  modal.classList.remove('hidden');
  setTimeout(() => document.getElementById('quest-title-input')?.focus(), 50);
}

// Save Quest Form Submit Handler
async function handleQuestFormSubmit(e) {
  e.preventDefault();
  const questId = document.getElementById('quest-id-input').value;
  const title = document.getElementById('quest-title-input').value.trim();
  const description = document.getElementById('quest-desc-input').value.trim();
  const category = document.getElementById('quest-category-input').value;
  const difficulty = document.getElementById('quest-difficulty-input').value;
  const attribute_target = document.getElementById('quest-attr-input').value;
  const recurrence = document.getElementById('quest-recurrence-input').value;

  if (!title) {
    showToast('Please enter a quest title', 'error');
    return;
  }

  try {
    if (questId) {
      await api.updateQuest(questId, { title, description, category, difficulty, attribute_target, recurrence });
      showToast('Quest updated!', 'success');
    } else {
      await api.createQuest({ title, description, category, difficulty, attribute_target, recurrence });
      soundManager.playCoinSound();
      showToast('Quest forged!', 'success');
    }
    closeAllModals();
    await loadQuests();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ---------------- ATTRIBUTES SYSTEM ----------------

function renderAttributes() {
  const container = document.getElementById('attributes-list-container');
  if (!container || !currentUser) return;

  const attrIcons = {
    Strength: { icon: 'dumbbell', color: 'from-red-500 to-amber-600', text: 'text-red-400', desc: 'Physical fitness, workouts & energy' },
    Intellect: { icon: 'brain', color: 'from-blue-500 to-indigo-600', text: 'text-blue-400', desc: 'Coding, studying, research & logic' },
    Vitality: { icon: 'heart', color: 'from-emerald-500 to-teal-600', text: 'text-emerald-400', desc: 'Sleep, hydration, health & wellness' },
    Agility: { icon: 'wind', color: 'from-cyan-500 to-blue-600', text: 'text-cyan-400', desc: 'Quick tasks, speed & daily routine' },
    Charisma: { icon: 'sparkles', color: 'from-yellow-400 to-amber-500', text: 'text-yellow-400', desc: 'Networking, social & presentations' },
    Focus: { icon: 'target', color: 'from-purple-500 to-pink-600', text: 'text-purple-400', desc: 'Deep work, meditation & concentration' }
  };

  container.innerHTML = currentUser.attributes.map(attr => {
    const meta = attrIcons[attr.name] || attrIcons.Intellect;
    const pct = Math.min(100, Math.max(0, (attr.current_xp / attr.xp_to_next_level) * 100));

    return `
      <div class="glass-panel p-5 rounded-2xl border border-gray-800/80 relative overflow-hidden">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-white shadow-md">
              <i data-lucide="${meta.icon}" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="font-bold text-gray-100 text-base">${attr.name}</h4>
              <p class="text-xs text-gray-400">${meta.desc}</p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 ${meta.text}">
              Rank ${attr.level}
            </span>
          </div>
        </div>

        <div class="mt-4">
          <div class="flex justify-between text-xs text-gray-400 mb-1.5 font-medium">
            <span>Progress to Rank ${attr.level + 1}</span>
            <span>${attr.current_xp} / ${attr.xp_to_next_level} XP</span>
          </div>
          <div class="w-full h-2.5 bg-gray-800/90 rounded-full overflow-hidden p-0.5 border border-gray-700">
            <div class="h-full rounded-full bg-gradient-to-r ${meta.color} progress-bar-fill" style="width: ${pct}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  initLucide();
}

// ---------------- SHOP & INVENTORY SYSTEM ----------------

async function loadShopAndInventory() {
  try {
    const [items, inv] = await Promise.all([api.getShopItems(), api.getInventory()]);
    shopItems = items;
    inventoryItems = inv;
    renderShop();
    renderInventory();
  } catch (error) {
    showToast('Failed to load shop: ' + error.message, 'error');
  }
}

function renderShop() {
  const container = document.getElementById('shop-items-container');
  if (!container) return;

  const rarityColors = {
    common: 'border-gray-700 bg-gray-900/40 text-gray-300',
    rare: 'border-blue-700/60 bg-blue-950/30 text-blue-300',
    epic: 'border-purple-700/60 bg-purple-950/30 text-purple-300',
    legendary: 'border-amber-600/70 bg-amber-950/30 text-amber-300'
  };

  container.innerHTML = shopItems.map(item => `
    <div class="item-card glass-panel p-5 rounded-2xl border ${rarityColors[item.rarity] || rarityColors.common} flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border border-current">
            ${item.rarity}
          </span>
          <span class="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-semibold">
            ${item.stat_bonus}
          </span>
        </div>

        <h4 class="font-bold text-gray-100 text-base mb-1">${escapeHtml(item.name)}</h4>
        <p class="text-xs text-gray-400 mb-4 leading-relaxed">${escapeHtml(item.description)}</p>
      </div>

      <div class="pt-3 border-t border-gray-800/80 flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm font-bold">
          ${item.cost_gold > 0 ? `<span class="text-amber-400 flex items-center gap-1"><i data-lucide="coins" class="w-4 h-4"></i> ${item.cost_gold}</span>` : ''}
          ${item.cost_gems > 0 ? `<span class="text-cyan-400 flex items-center gap-1"><i data-lucide="gem" class="w-4 h-4"></i> ${item.cost_gems}</span>` : ''}
        </div>

        <button onclick="buyShopItem(${item.id})" class="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20">
          Acquire
        </button>
      </div>
    </div>
  `).join('');

  initLucide();
}

function renderInventory() {
  const container = document.getElementById('inventory-items-container');
  if (!container) return;

  if (inventoryItems.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-8 text-gray-400">
        <i data-lucide="backpack" class="w-10 h-10 mx-auto mb-2 opacity-40"></i>
        <p class="text-sm">Your inventory is empty. Visit the Shop to acquire gear and potions!</p>
      </div>
    `;
    initLucide();
    return;
  }

  container.innerHTML = inventoryItems.map(inv => `
    <div class="glass-panel p-4 rounded-xl border ${inv.is_equipped ? 'border-amber-500/60 bg-amber-950/20 shadow-lg shadow-amber-500/10' : 'border-gray-800'} flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h5 class="font-bold text-gray-200 text-sm">${escapeHtml(inv.item.name)}</h5>
          ${inv.quantity > 1 ? `<span class="text-xs bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">x${inv.quantity}</span>` : ''}
          ${inv.is_equipped ? '<span class="text-[10px] bg-amber-500 text-gray-950 font-extrabold px-1.5 py-0.5 rounded uppercase">Equipped</span>' : ''}
        </div>
        <p class="text-xs text-purple-400 font-medium">${inv.item.stat_bonus}</p>
      </div>

      <div>
        ${inv.item.item_type === 'gear' || inv.item.item_type === 'theme' || inv.item.item_type === 'badge' ? `
          <button onclick="toggleEquipItem(${inv.id})" class="px-3 py-1 rounded-lg text-xs font-bold ${inv.is_equipped ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-amber-600 hover:bg-amber-500 text-white'} transition">
            ${inv.is_equipped ? 'Unequip' : 'Equip'}
          </button>
        ` : `
          <button onclick="useItem(${inv.id})" class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow">
            Consume
          </button>
        `}
      </div>
    </div>
  `).join('');

  initLucide();
}

async function buyShopItem(itemId) {
  try {
    await api.buyItem(itemId);
    soundManager.playCoinSound();
    soundManager.playEquip();
    showToast('Item acquired and added to inventory!', 'success');
    await loadUserData();
    await loadShopAndInventory();
  } catch (error) {
    soundManager.playError();
    showToast(error.message, 'error');
  }
}

async function toggleEquipItem(invId) {
  try {
    const res = await api.equipItem(invId);
    soundManager.playEquip();
    showToast(res.message, 'info');
    await loadUserData();
    await loadShopAndInventory();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function useItem(invId) {
  try {
    const res = await api.useConsumable(invId);
    soundManager.playPotion();
    showToast(res.message, 'success');
    await loadUserData();
    await loadShopAndInventory();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ---------------- BOSS DUNGEONS ----------------

async function loadBoss() {
  const container = document.getElementById('boss-container');
  if (!container) return;

  try {
    currentBoss = await api.getBoss();
    renderBoss();
  } catch (error) {
    showToast('Failed to load boss raid: ' + error.message, 'error');
  }
}

function renderBoss() {
  const container = document.getElementById('boss-container');
  if (!container || !currentBoss) return;

  const pct = Math.min(100, Math.max(0, (currentBoss.current_hp / currentBoss.max_hp) * 100));

  container.innerHTML = `
    <div class="glass-panel p-8 rounded-3xl border border-pink-900/40 relative overflow-hidden text-center max-w-2xl mx-auto shadow-2xl">
      <div class="absolute -top-10 -right-10 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10">
        <div class="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-600 via-pink-600 to-purple-800 flex items-center justify-center text-5xl shadow-xl shadow-pink-600/30">
          🐲
        </div>

        <span class="text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-pink-950 text-pink-400 border border-pink-800 mb-2 inline-block">
          Dungeon Raid Boss
        </span>

        <h3 class="text-2xl font-black text-gray-100 rpg-title-font mt-1">${escapeHtml(currentBoss.boss_name)}</h3>
        <p class="text-sm text-gray-400 mb-6 italic">${escapeHtml(currentBoss.boss_title)}</p>

        <!-- Boss Health Bar -->
        <div class="mb-6">
          <div class="flex justify-between text-sm font-bold text-gray-300 mb-2">
            <span class="text-pink-400">Boss HP</span>
            <span>${currentBoss.current_hp} / ${currentBoss.max_hp}</span>
          </div>
          <div class="w-full h-4 bg-gray-900 rounded-full overflow-hidden p-0.5 border border-pink-900/60">
            <div class="h-full rounded-full bg-gradient-to-r from-red-600 via-pink-600 to-rose-500 boss-hp-bar" style="width: ${pct}%"></div>
          </div>
        </div>

        <!-- How damage works -->
        <div class="p-4 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-400 mb-6 text-left leading-relaxed">
          ⚔️ <strong>Raid Rule:</strong> Completing your real-life Quests automatically unleashes tactical strikes against this Boss!
          Medium quests deal <strong>50 DMG</strong>, Hard quests deal <strong>90 DMG</strong>, and Epic quests deal <strong>180 DMG</strong>.
        </div>

        <!-- Loot Drop Preview -->
        <div class="flex items-center justify-center gap-6 text-sm font-bold py-3 border-t border-gray-800">
          <span class="text-gray-400 text-xs uppercase tracking-wider">Defeat Loot:</span>
          <span class="text-purple-400 flex items-center gap-1"><i data-lucide="sparkles" class="w-4 h-4"></i> +${currentBoss.reward_xp} XP</span>
          <span class="text-amber-400 flex items-center gap-1"><i data-lucide="coins" class="w-4 h-4"></i> +${currentBoss.reward_gold} Gold</span>
          <span class="text-cyan-400 flex items-center gap-1"><i data-lucide="gem" class="w-4 h-4"></i> +${currentBoss.reward_gems} Gems</span>
        </div>

        ${currentBoss.is_defeated ? `
          <div class="mt-6">
            <button onclick="respawnBoss()" class="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-pink-600/30 transition">
              ⚔️ Summon Next Tier Raid Boss
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  initLucide();
}

async function respawnBoss() {
  try {
    await api.respawnBoss();
    soundManager.playLevelUp();
    showToast('A new Dungeon Boss has awakened!', 'success');
    await loadBoss();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ---------------- ACTIVITY LOGS ----------------

async function loadActivityLogs() {
  const container = document.getElementById('activity-logs-container');
  if (!container) return;

  try {
    const logs = await api.getActivityLogs();
    if (logs.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-center py-8">No recorded activity yet. Complete quests to write your chronicle!</p>';
      return;
    }

    container.innerHTML = logs.map(log => `
      <div class="glass-panel p-4 rounded-xl border border-gray-800 flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-gray-200">${escapeHtml(log.description)}</p>
          <span class="text-[11px] text-gray-500">${new Date(log.created_at).toLocaleString()}</span>
        </div>
        <div class="flex items-center gap-3 text-xs font-bold">
          ${log.xp_gained > 0 ? `<span class="text-purple-400">+${log.xp_gained} XP</span>` : ''}
          ${log.gold_gained !== 0 ? `<span class="${log.gold_gained > 0 ? 'text-amber-400' : 'text-gray-400'}">${log.gold_gained > 0 ? '+' : ''}${log.gold_gained} Gold</span>` : ''}
        </div>
      </div>
    `).join('');
  } catch (error) {
    showToast('Failed to load activity log: ' + error.message, 'error');
  }
}

// ---------------- CELEBRATIONS & MODALS ----------------

function spawnCombatNumber(text, x, y, color = '#a855f7') {
  const span = document.createElement('span');
  span.className = 'floating-combat-text';
  span.style.left = `${x}px`;
  span.style.top = `${y}px`;
  span.style.color = color;
  span.innerText = text;
  document.body.appendChild(span);

  setTimeout(() => {
    span.remove();
  }, 1200);
}

function triggerConfettiFireworks() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function showLevelUpModal(newLevel) {
  const modal = document.getElementById('levelup-modal');
  document.getElementById('levelup-number').innerText = newLevel;
  modal.classList.remove('hidden');
}

function showAuthModal(mode = 'login') {
  const modal = document.getElementById('auth-modal');
  const title = document.getElementById('auth-modal-title');
  const subtitle = document.getElementById('auth-modal-subtitle');
  const submitBtn = document.getElementById('auth-submit-btn');
  const toggleBtn = document.getElementById('auth-toggle-btn');
  const emailField = document.getElementById('auth-email-container');

  document.getElementById('auth-mode-input').value = mode;

  if (mode === 'login') {
    title.innerText = 'Welcome Back, Hero';
    subtitle.innerText = 'Enter your credentials to continue your adventure';
    submitBtn.innerText = 'Log In & Resume';
    toggleBtn.innerText = "Don't have an adventurer account? Sign up";
    emailField.classList.add('hidden');
  } else {
    title.innerText = 'Begin Your RPG Journey';
    subtitle.innerText = 'Create your hero character and start leveling up';
    submitBtn.innerText = 'Create Account & Begin';
    toggleBtn.innerText = 'Already have an account? Log in';
    emailField.classList.remove('hidden');
  }

  modal.classList.remove('hidden');
}

function toggleAuthMode() {
  const currentMode = document.getElementById('auth-mode-input').value;
  showAuthModal(currentMode === 'login' ? 'signup' : 'login');
}

async function handleAuthFormSubmit(e) {
  e.preventDefault();
  const mode = document.getElementById('auth-mode-input').value;
  const username = document.getElementById('auth-username-input').value.trim();
  const email = document.getElementById('auth-email-input').value.trim();
  const password = document.getElementById('auth-password-input').value;

  try {
    if (mode === 'signup') {
      if (!email) {
        showToast('Please enter a valid email', 'error');
        return;
      }
      await api.signup(username, email, password);
      soundManager.playLevelUp();
      triggerConfettiFireworks();
      showToast('Adventurer registered! Welcome to Life RPG.', 'success');
    } else {
      await api.login(username, password);
      soundManager.playCoinSound();
      showToast('Welcome back, Hero!', 'success');
    }

    await loadUserData();
    switchTab('quests');
  } catch (error) {
    soundManager.playError();
    showToast(error.message, 'error');
  }
}

function openProfileModal() {
  if (!currentUser) return;
  document.getElementById('profile-title-input').value = currentUser.title;
  document.getElementById('profile-avatar-select').value = currentUser.avatar;
  document.getElementById('profile-modal').classList.remove('hidden');
}

async function handleProfileSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('profile-title-input').value.trim();
  const avatar = document.getElementById('profile-avatar-select').value;

  try {
    await api.updateProfile({ title, avatar });
    showToast('Hero profile updated!', 'success');
    closeAllModals();
    await loadUserData();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    if (modal.id !== 'auth-modal' || currentUser) {
      modal.classList.add('hidden');
    }
  });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-indigo-600';

  toast.className = `flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-xs shadow-2xl transition-all duration-300 transform translate-y-2 opacity-0 ${bg}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}
