/* ============================================
   IT面试题库管理系统 - 数据库层 (Dexie.js)
   ============================================ */
const DB = new Dexie('ITInterviewBank');

DB.version(1).stores({
  categories: '++id, parentId, name, sort, level, status',
  positions: '++id, name, stage, category, sort, status',
  positionSkills: '++id, positionId, categoryId, techName, importance, depth, required',
  questions: '++id, categoryId, title, difficulty, type, status, source, aiScore, created, updated',
  questionVersions: '++id, questionId, version, created',
  favorites: '++id, questionId, created',
  histories: '++id, questionId, created',
  aiGenerateLogs: '++id, positionName, jobDesc, techStack, generatedCount, savedCount, created',
  importLogs: '++id, fileName, total, success, fail, created',
  backups: '++id, name, type, fileSize, created',
  settings: '++id, key, value'
});

// ---- DB Service ----
const DBService = {
  // ---- Categories ----
  async getCategories() {
    return DB.categories.where('status').notEqual('deleted').sortBy('sort');
  },
  async getCategory(id) {
    return DB.categories.get(id);
  },
  async getRootCategories() {
    return DB.categories.where({ parentId: 0, status: 'active' }).sortBy('sort');
  },
  async getChildCategories(parentId) {
    return DB.categories.where({ parentId, status: 'active' }).sortBy('sort');
  },
  async saveCategory(cat) {
    if (cat.id) return DB.categories.put(cat);
    return DB.categories.add(cat);
  },
  async deleteCategory(id) {
    const count = await DB.questions.where({ categoryId: id }).count();
    if (count > 0) throw new Error(`该分类下还有 ${count} 道题目，无法直接删除`);
    const children = await DB.categories.where({ parentId: id, status: 'active' }).toArray();
    if (children.length > 0) throw new Error(`该分类下有 ${children.length} 个子分类，请先处理`);
    return DB.categories.update(id, { status: 'deleted' });
  },
  async getCategoryTree() {
    const all = await DB.categories.where('status').notEqual('deleted').sortBy('sort');
    const build = (parentId) => all.filter(c => c.parentId === parentId).map(c => ({
      ...c, children: build(c.id)
    }));
    return build(0);
  },
  async getCategoryPath(id) {
    const path = [];
    let current = await DB.categories.get(id);
    while (current) {
      path.unshift(current);
      current = current.parentId ? await DB.categories.get(current.parentId) : null;
    }
    return path;
  },
  async getCategoryQuestionCount(id) {
    return DB.questions.where({ categoryId: id, status: 'published' }).count();
  },

  // ---- Positions ----
  async getPositions() {
    return DB.positions.where('status').notEqual('deleted').sortBy('sort');
  },
  async getPosition(id) {
    return DB.positions.get(id);
  },
  async getPositionsByStage(stage) {
    return DB.positions.where({ stage, status: 'active' }).sortBy('sort');
  },
  async savePosition(pos) {
    if (pos.id) return DB.positions.put(pos);
    return DB.positions.add(pos);
  },
  async deletePosition(id) {
    return DB.positions.update(id, { status: 'deleted' });
  },
  async getPositionSkills(positionId) {
    return DB.positionSkills.where({ positionId }).toArray();
  },
  async savePositionSkill(skill) {
    if (skill.id) return DB.positionSkills.put(skill);
    return DB.positionSkills.add(skill);
  },
  async deletePositionSkills(positionId) {
    return DB.positionSkills.where({ positionId }).delete();
  },

  // ---- Questions ----
  async getQuestions(filters = {}) {
    let collection = DB.questions.orderBy('created').reverse();
    if (filters.status) {
      collection = DB.questions.where('status').equals(filters.status);
    } else {
      collection = DB.questions.where('status').notEqual('deleted');
    }
    let results = await collection.toArray();
    if (filters.categoryId) results = results.filter(q => q.categoryId === filters.categoryId);
    if (filters.difficulty) results = results.filter(q => q.difficulty === filters.difficulty);
    if (filters.type) results = results.filter(q => q.type === filters.type);
    if (filters.source) results = results.filter(q => q.source === filters.source);
    if (filters.positionId) results = results.filter(q => (q.positionIds || []).includes(filters.positionId));
    if (filters.search) {
      const kw = filters.search.toLowerCase();
      results = results.filter(q => q.title.toLowerCase().includes(kw) || (q.content || '').toLowerCase().includes(kw));
    }
    return results.sort((a, b) => {
      if (filters.sort === 'views') return (b.views || 0) - (a.views || 0);
      if (filters.sort === 'favorites') return (b.favCount || 0) - (a.favCount || 0);
      if (filters.sort === 'aiScore') return (b.aiScore || 0) - (a.aiScore || 0);
      return (b.updated || b.created) - (a.updated || a.created);
    });
  },
  async getQuestion(id) {
    return DB.questions.get(id);
  },
  async saveQuestion(q) {
    if (q.id) {
      q.updated = Date.now();
      return DB.questions.put(q);
    }
    q.created = Date.now();
    q.updated = Date.now();
    q.views = q.views || 0;
    q.favCount = q.favCount || 0;
    return DB.questions.add(q);
  },
  async deleteQuestion(id) {
    return DB.questions.update(id, { status: 'deleted' });
  },
  async getQuestionsByCategory(categoryId) {
    return DB.questions.where({ categoryId }).filter(q => q.status !== 'deleted').toArray();
  },
  async incrementViews(id) {
    const q = await DB.questions.get(id);
    if (q) DB.questions.update(id, { views: (q.views || 0) + 1 });
  },

  // ---- Question Versions ----
  async saveVersion(version) {
    version.created = Date.now();
    return DB.questionVersions.add(version);
  },
  async getVersions(questionId) {
    return DB.questionVersions.where({ questionId }).reverse().sortBy('version');
  },

  // ---- Favorites ----
  async toggleFavorite(questionId) {
    const existing = await DB.favorites.where({ questionId }).first();
    if (existing) {
      await DB.favorites.delete(existing.id);
      const q = await DB.questions.get(questionId);
      if (q) DB.questions.update(questionId, { favCount: Math.max(0, (q.favCount || 0) - 1) });
      return false;
    }
    await DB.favorites.add({ questionId, created: Date.now() });
    const q = await DB.questions.get(questionId);
    if (q) DB.questions.update(questionId, { favCount: (q.favCount || 0) + 1 });
    return true;
  },
  async getFavorites() {
    const favs = await DB.favorites.orderBy('created').reverse().toArray();
    const questions = [];
    for (const f of favs) {
      const q = await DB.questions.get(f.questionId);
      if (q && q.status !== 'deleted') questions.push({ ...q, favTime: f.created });
    }
    return questions;
  },
  async isFavorited(questionId) {
    return !!(await DB.favorites.where({ questionId }).first());
  },

  // ---- Histories ----
  async addHistory(questionId) {
    await DB.histories.add({ questionId, created: Date.now() });
    const all = await DB.histories.orderBy('created').reverse().toArray();
    if (all.length > 100) {
      const toDelete = all.slice(100);
      for (const h of toDelete) DB.histories.delete(h.id);
    }
  },
  async getHistories() {
    const hs = await DB.histories.orderBy('created').reverse().toArray();
    const unique = [];
    const seen = new Set();
    for (const h of hs) {
      if (!seen.has(h.questionId)) {
        seen.add(h.questionId);
        const q = await DB.questions.get(h.questionId);
        if (q && q.status !== 'deleted') unique.push({ ...q, viewTime: h.created });
      }
    }
    return unique.slice(0, 100);
  },

  // ---- Settings ----
  async getSetting(key) {
    const s = await DB.settings.where({ key }).first();
    return s ? s.value : null;
  },
  async setSetting(key, value) {
    const existing = await DB.settings.where({ key }).first();
    if (existing) return DB.settings.update(existing.id, { value, key });
    return DB.settings.add({ key, value });
  },

  // ---- Stats ----
  async getStats() {
    const allQuestions = await DB.questions.filter(q => q.status !== 'deleted').toArray();
    const published = allQuestions.filter(q => q.status === 'published');
    const categories = await DB.categories.where('status').notEqual('deleted').toArray();
    const positions = await DB.positions.where('status').notEqual('deleted').toArray();
    return {
      categories: categories.length,
      questions: published.length,
      totalQuestions: allQuestions.length,
      positions: positions.length,
      draft: allQuestions.filter(q => q.status === 'draft').length,
      aiGenerated: allQuestions.filter(q => q.source === 'ai').length,
      manual: allQuestions.filter(q => q.source === 'manual').length,
      imported: allQuestions.filter(q => q.source === 'import').length,
      rootCategories: categories.filter(c => c.parentId === 0).length
    };
  },

  // ---- Backup & Restore ----
  async exportBackup() {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      categories: await DB.categories.toArray(),
      positions: await DB.positions.toArray(),
      positionSkills: await DB.positionSkills.toArray(),
      questions: await DB.questions.toArray(),
      questionVersions: await DB.questionVersions.toArray(),
      favorites: await DB.favorites.toArray(),
      histories: await DB.histories.toArray(),
      aiGenerateLogs: await DB.aiGenerateLogs.toArray(),
      importLogs: await DB.importLogs.toArray()
    };
    return data;
  },
  async importBackup(data, mode = 'merge') {
    if (mode === 'overwrite') {
      await DB.delete();
      await DB.open();
      await this.initDatabase();
    }
    // Import categories
    for (const c of data.categories || []) {
      if (mode === 'merge') {
        const existing = await DB.categories.where({ name: c.name, parentId: c.parentId }).first();
        if (!existing) await DB.categories.add(c);
      } else {
        await DB.categories.add(c);
      }
    }
    // Import positions
    for (const p of data.positions || []) {
      if (mode === 'merge') {
        const existing = await DB.positions.where({ name: p.name }).first();
        if (!existing) await DB.positions.add(p);
      } else {
        await DB.positions.add(p);
      }
    }
    // Import positionSkills
    for (const s of data.positionSkills || []) {
      if (mode === 'merge') {
        const existing = await DB.positionSkills.where({ positionId: s.positionId, techName: s.techName }).first();
        if (!existing) await DB.positionSkills.add(s);
      } else {
        await DB.positionSkills.add(s);
      }
    }
    // Import questions
    for (const q of data.questions || []) {
      if (mode === 'merge') {
        const existing = await DB.questions.where({ title: q.title }).first();
        if (!existing) {
          const newQ = { ...q, id: undefined };
          await DB.questions.add(newQ);
        }
      } else {
        const newQ = { ...q, id: undefined };
        await DB.questions.add(newQ);
      }
    }
    // Import other data
    if (mode === 'overwrite') {
      for (const f of data.favorites || []) await DB.favorites.add({ ...f, id: undefined });
      for (const h of data.histories || []) await DB.histories.add({ ...h, id: undefined });
    }
  },

  // ---- Init ----
  async initDatabase() {
    const initialized = localStorage.getItem('db_initialized');
    if (initialized) return;
    // Import initial data
    if (typeof INITIAL_DATA !== 'undefined') {
      await INITIAL_DATA.initialize();
    }
    localStorage.setItem('db_initialized', 'true');
  }
};