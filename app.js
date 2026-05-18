(function () {
  'use strict';

  // ===== State =====
  let tasks = [];
  let currentFilter = 'all';

  const STORAGE_KEY = 'habit_tracker_tasks';
  const THEME_KEY = 'habit_tracker_theme';

  // ===== DOM refs =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const taskForm = $('#taskForm');
  const taskInput = $('#taskInput');
  const prioritySelect = $('#prioritySelect');
  const taskList = $('#taskList');
  const taskCount = $('#taskCount');
  const totalTasksEl = $('#totalTasks');
  const completedTasksEl = $('#completedTasks');
  const pendingTasksEl = $('#pendingTasks');
  const progressRing = $('#progressRing');
  const progressPercentage = $('#progressPercentage');
  const themeToggle = $('#themeToggle');
  const clearCompletedBtn = $('#clearCompletedBtn');
  const listFooter = $('#listFooter');
  const filterBtns = $$('.filter-btn');

  // ===== Storage =====
  function loadTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      tasks = data ? JSON.parse(data) : [];
    } catch {
      tasks = [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  // ===== Theme =====
  function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // ===== Tasks CRUD =====
  function addTask(text, priority) {
    const task = {
      id: Date.now() + Math.random(),
      text: text.trim(),
      priority,
      completed: false,
      createdAt: Date.now(),
    };
    tasks.unshift(task);
    saveTasks();
    render();
    showToast('Tugas berhasil ditambahkan');
  }

  function toggleTaskComplete(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveTasks();
    render();
  }

  function editTask(id, newText) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.text = newText.trim();
    saveTasks();
    render();
    showToast('Tugas diperbarui');
  }

  function deleteTask(id) {
    const task = tasks.find((t) => t.id === id);
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    render();
    if (task) showToast(`"${task.text}" dihapus`);
  }

  function clearCompleted() {
    const completed = tasks.filter((t) => t.completed);
    if (completed.length === 0) {
      showToast('Tidak ada tugas selesai');
      return;
    }
    tasks = tasks.filter((t) => !t.completed);
    saveTasks();
    render();
    showToast(`${completed.length} tugas selesai dihapus`);
  }

  // ===== Filter =====
  function getFilteredTasks() {
    if (currentFilter === 'all') return tasks;
    if (currentFilter === 'completed') return tasks.filter((t) => t.completed);
    if (currentFilter === 'pending') return tasks.filter((t) => !t.completed);
    return tasks.filter((t) => t.priority === currentFilter);
  }

  function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    render();
  }

  // ===== Render =====
  function render() {
    const filtered = getFilteredTasks();
    renderTaskList(filtered);
    renderStats();
    renderFooter(filtered.length);
  }

  function renderTaskList(filtered) {
    if (filtered.length === 0) {
      taskList.innerHTML = `
        <li class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <p>${currentFilter === 'all' ? 'Belum ada tugas. Tambahkan tugas pertama Anda!' : 'Tidak ada tugas untuk filter ini.'}</p>
        </li>`;
      return;
    }

    taskList.innerHTML = filtered
      .map((task) => {
        const priorityLabel = { tinggi: 'Tinggi', sedang: 'Sedang', rendah: 'Rendah' }[task.priority] || '';
        return `
          <li class="task-item${task.completed ? ' completed' : ''}" data-id="${task.id}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Tandai selesai" />
            <span class="task-priority ${task.priority}" title="${priorityLabel}"></span>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <span class="task-actions">
              <button class="task-edit" aria-label="Edit tugas">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="task-delete" aria-label="Hapus tugas">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </span>
          </li>`;
      })
      .join('');
  }

  function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    pendingTasksEl.textContent = pending;
    progressPercentage.textContent = `${percent}%`;

    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (percent / 100) * circumference;
    progressRing.style.strokeDasharray = `${circumference}`;
    progressRing.style.strokeDashoffset = `${offset}`;
  }

  function renderFooter(filteredCount) {
    taskCount.textContent = `${tasks.length} tugas`;
  }

  // ===== Helpers =====
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(message) {
    let toast = $('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // ===== Event Delegation =====
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;
    const priority = prioritySelect.value;
    addTask(text, priority);
    taskInput.value = '';
    taskInput.focus();
  });

  taskList.addEventListener('click', (e) => {
    const li = e.target.closest('.task-item');
    if (!li) return;
    const id = Number(li.dataset.id);

    if (e.target.closest('.task-delete')) {
      deleteTask(id);
      return;
    }

    if (e.target.closest('.task-edit')) {
      const textSpan = li.querySelector('.task-text');
      const currentText = textSpan.textContent;
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'task-edit-input';
      input.value = currentText;
      textSpan.replaceWith(input);
      input.focus();
      input.select();
      li.classList.add('editing');

      const saveEdit = () => {
        const newText = input.value.trim();
        if (newText && newText !== currentText) {
          editTask(id, newText);
        } else {
          render();
        }
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') render();
      });
      input.addEventListener('blur', saveEdit);
      return;
    }
  });

  taskList.addEventListener('change', (e) => {
    if (e.target.classList.contains('task-checkbox')) {
      const li = e.target.closest('.task-item');
      if (!li) return;
      const id = Number(li.dataset.id);
      toggleTaskComplete(id);
    }
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  clearCompletedBtn.addEventListener('click', clearCompleted);

  themeToggle.addEventListener('click', toggleTheme);

  // ===== Init =====
  function init() {
    applyTheme(getPreferredTheme());
    loadTasks();
    setFilter('all');
  }

  init();
})();
