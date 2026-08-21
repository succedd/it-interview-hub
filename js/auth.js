/* ============================================
   IT面试题库管理系统 - 管理员认证模块
   ============================================ */
const AuthService = {
  _isLoggedIn: false,

  async init() {
    const session = sessionStorage.getItem('admin_logged_in');
    const remember = localStorage.getItem('admin_logged_in');
    this._isLoggedIn = !!(session || remember);
    return this._isLoggedIn;
  },

  isLoggedIn() {
    return this._isLoggedIn;
  },

  async setPassword(password) {
    const hash = await this._hashPassword(password);
    localStorage.setItem('admin_password_hash', hash);
    return true;
  },

  async verifyPassword(password) {
    const storedHash = localStorage.getItem('admin_password_hash');
    if (!storedHash) return false;
    const hash = await this._hashPassword(password);
    return hash === storedHash;
  },

  async login(password, remember = false) {
    const storedHash = localStorage.getItem('admin_password_hash');
    if (!storedHash) {
      // First time setup
      await this.setPassword(password);
      this._isLoggedIn = true;
      if (remember) {
        localStorage.setItem('admin_logged_in', 'true');
      } else {
        sessionStorage.setItem('admin_logged_in', 'true');
      }
      return { success: true, firstTime: true };
    }
    const valid = await this.verifyPassword(password);
    if (!valid) return { success: false, error: '密码错误' };
    this._isLoggedIn = true;
    if (remember) {
      localStorage.setItem('admin_logged_in', 'true');
    } else {
      sessionStorage.setItem('admin_logged_in', 'true');
    }
    return { success: true };
  },

  logout() {
    this._isLoggedIn = false;
    sessionStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_logged_in');
  },

  async changePassword(oldPassword, newPassword) {
    const valid = await this.verifyPassword(oldPassword);
    if (!valid) return { success: false, error: '原密码错误' };
    await this.setPassword(newPassword);
    return { success: true };
  },

  hasPassword() {
    return !!localStorage.getItem('admin_password_hash');
  },

  async _hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'loomy-interview-salt');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  requireAuth() {
    if (!this._isLoggedIn) {
      throw new Error('请先登录管理员账号');
    }
  }
};