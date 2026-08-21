/* ============================================
   IT面试题库管理系统 - 搜索引擎模块 (Fuse.js)
   ============================================ */
const SearchService = {
  _fuse: null,
  _allQuestions: [],

  async buildIndex() {
    const questions = await DB.questions.filter(q => q.status === 'published').toArray();
    this._allQuestions = questions;
    this._fuse = new Fuse(questions, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'content', weight: 0.3 },
        { name: 'answer', weight: 0.15 },
        { name: 'tags', weight: 0.1 },
        { name: 'categoryPath', weight: 0.05 }
      ],
      threshold: 0.4,
      distance: 100,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 1
    });
  },

  search(query, limit = 50) {
    if (!this._fuse || !query.trim()) return [];
    const results = this._fuse.search(query.trim(), { limit });
    return results.map(r => ({
      ...r.item,
      score: r.score,
      matches: r.matches
    }));
  },

  highlightText(text, matches) {
    if (!matches || !matches.length) return text;
    const parts = [];
    let lastIndex = 0;
    for (const m of matches) {
      if (m.key === 'title' || m.key === 'content') {
        for (const [start, end] of m.indices) {
          if (start > lastIndex) parts.push(text.slice(lastIndex, start));
          parts.push(`<mark>${text.slice(start, end + 1)}</mark>`);
          lastIndex = end + 1;
        }
      }
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts.join('') || text;
  }
};