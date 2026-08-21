/* ============================================
   IT面试题库管理系统 - 工具函数
   ============================================ */
const Utils = {
  // ---- Toast notifications ----
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = {
      success: '✓', error: '✕', warning: '⚠', info: 'ℹ'
    };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  success(msg) { this.toast(msg, 'success'); },
  error(msg) { this.toast(msg, 'error'); },
  warning(msg) { this.toast(msg, 'warning'); },
  info(msg) { this.toast(msg, 'info'); },

  // ---- Confirm dialog ----
  async confirm(message, title = '确认操作') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal" style="max-width:420px">
          <div class="modal-header"><h3>${title}</h3></div>
          <div class="modal-body"><p style="font-size:15px;color:var(--text-secondary)">${message}</p></div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="confirm-cancel">取消</button>
            <button class="btn btn-primary" id="confirm-ok">确认</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const close = (result) => { overlay.remove(); resolve(result); };
      overlay.querySelector('#confirm-ok').onclick = () => close(true);
      overlay.querySelector('#confirm-cancel').onclick = () => close(false);
      overlay.onclick = (e) => { if (e.target === overlay) close(false); };
    });
  },

  // ---- Prompt dialog ----
  async prompt(message, defaultValue = '', title = '输入') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal" style="max-width:420px">
          <div class="modal-header"><h3>${title}</h3></div>
          <div class="modal-body">
            <p style="font-size:14px;color:var(--text-secondary);margin-bottom:12px">${message}</p>
            <input class="form-input" id="prompt-input" value="${defaultValue}" autofocus>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="prompt-cancel">取消</button>
            <button class="btn btn-primary" id="prompt-ok">确认</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const input = overlay.querySelector('#prompt-input');
      setTimeout(() => input.focus(), 100);
      const close = (result) => { overlay.remove(); resolve(result); };
      overlay.querySelector('#prompt-ok').onclick = () => close(input.value);
      overlay.querySelector('#prompt-cancel').onclick = () => close(null);
      input.onkeydown = (e) => { if (e.key === 'Enter') close(input.value); };
      overlay.onclick = (e) => { if (e.target === overlay) close(null); };
    });
  },

  // ---- Format date ----
  formatDate(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },

  formatDateShort(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff/60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff/86400000)}天前`;
    return `${d.getMonth()+1}/${d.getDate()}`;
  },

  // ---- Difficulty label ----
  difficultyLabel(d) {
    const map = { 'junior': '初级', 'mid': '中级', 'senior': '高级', 'expert': '专家' };
    return map[d] || d;
  },

  difficultyBadge(d) {
    const map = { 'junior': 'diff-easy', 'mid': 'diff-medium', 'senior': 'diff-hard', 'expert': 'diff-expert' };
    return map[d] || '';
  },

  // ---- Type label ----
  typeLabel(t) {
    const map = { 'single': '单选题', 'multi': '多选题', 'judge': '判断题', 'fill': '填空题',
      'short': '简答题', 'coding': '编程题', 'scenario': '场景题', 'troubleshoot': '故障排查题',
      'design': '系统设计题', 'open': '开放讨论题' };
    return map[t] || t;
  },

  // ---- Source label ----
  sourceLabel(s) {
    const map = { 'manual': '手动录入', 'ai': 'AI生成', 'import': '批量导入' };
    return map[s] || s;
  },

  // ---- Status label ----
  statusLabel(s) {
    const map = { 'draft': '草稿', 'published': '已发布', 'deleted': '已下线' };
    return map[s] || s;
  },

  // ---- Stars ----
  renderStars(count) {
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  },

  // ---- Throttle ----
  throttle(fn, delay = 300) {
    let timer = null;
    return function(...args) {
      if (timer) return;
      timer = setTimeout(() => { fn.apply(this, args); timer = null; }, delay);
    };
  },

  // ---- Debounce ----
  debounce(fn, delay = 300) {
    let timer = null;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // ---- Random ID ----
  randomId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  // ---- Download file ----
  downloadFile(content, filename, type = 'application/json') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  // ---- Copy to clipboard ----
  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove();
    }
  },

  // ---- Truncate ----
  truncate(text, len = 100) {
    if (!text) return '';
    return text.length > len ? text.slice(0, len) + '...' : text;
  },

  // ---- Strip HTML/Markdown ----
  stripMarkdown(text) {
    if (!text) return '';
    return text.replace(/[#*`~\[\]()>|\\]/g, '').replace(/\n+/g, ' ').trim();
  },

  // ---- Get theme ----
  getTheme() {
    return localStorage.getItem('theme') || 'system';
  },

  setTheme(theme) {
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  },

  applyTheme(theme) {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  },

  // ---- Escape HTML ----
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};