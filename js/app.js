/* ============================================
   IT面试题库管理系统 - 主应用 (Vue 3)
   ============================================ */
const { createApp, ref, reactive, computed, watch, onMounted, nextTick } = Vue;
console.log('app.js loaded, Vue available:', !!Vue);

const App = {
  setup() {
    const state = reactive({
      page: 'home', loading: false, searchQuery: '',
      isAdmin: false, theme: 'system', sidebarOpen: false,
      // Stats
      stats: { categories: 0, questions: 0, positions: 0, aiGenerated: 0, rootCategories: 0 },
      // Home
      rootCategories: [], hotTags: ['Java', 'Spring Boot', 'Redis', 'MySQL', 'Vue', 'React', 'Docker', 'Kubernetes', 'AI大模型', '算法'],
      recentQuestions: [], featuredQuestions: [],
      // Category
      categoryTree: [], currentCategory: null, categoryPath: [],
      // Questions
      questions: [], currentQuestion: null, isFav: false,
      filters: { categoryId: null, difficulty: '', type: '', positionId: '', sort: 'newest', search: '' },
      // Positions
      positions: [], currentPosition: null, positionSkills: [],
      // Favorites
      favorites: [], histories: [],
      // Practice
      practiceMode: false, practiceQuestions: [], practiceIndex: 0, practiceResults: [],
      // Admin
      adminPage: 'dashboard', adminStats: {},
      // Edit
      editQuestion: { title: '', content: '', answer: '', categoryId: '', difficulty: 'mid', type: 'short', positionIds: [], years: '', tags: [], status: 'draft', source: 'manual', notes: '' },
      editPreview: false,
      // AI
      aiConfig: { apiKey: '', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat', timeout: 60, temperature: 0.7, maxQuestions: 20, storageType: 'session' },
      aiJobDesc: '', aiPositionName: '', aiYears: '3-5', aiParsing: false, aiGenerating: false, aiProgress: 0, aiResults: [],
      // Import
      importData: null, importPreview: [],
      // Backup
      backupInfo: null,
      // System
      systemInitialized: false
    });

    // ---- Init ----
    onMounted(async () => {
      try {
        Utils.applyTheme(localStorage.getItem('theme') || 'system');
        await AuthService.init();
        state.isAdmin = AuthService.isLoggedIn();
        console.log('1. Auth done');
        await DBService.initDatabase();
        console.log('2. DB init done');
        state.systemInitialized = true;
        await SearchService.buildIndex();
        console.log('3. Search index done');
        await loadStats();
        console.log('4. Stats done');
        await loadHomeData();
        console.log('5. Home data done');
        state.aiConfig.apiKey = localStorage.getItem('ai_api_key') || '';
        state.aiConfig.baseUrl = localStorage.getItem('ai_base_url') || 'https://api.deepseek.com';
        state.aiConfig.model = localStorage.getItem('ai_model') || 'deepseek-chat';
        handleHash();
        window.addEventListener('hashchange', handleHash);
        // Force DOM update by setting loading after a microtask
        await nextTick();
        state.loading = false;
        console.log('6. Loading complete!');
      } catch(e) {
        console.error('Init error:', e);
        document.getElementById('error-display').style.display = 'block';
        document.getElementById('error-display').innerHTML = '<strong>Init Error:</strong> ' + e.message + '<br>' + (e.stack || '');
      }
    });

    function handleHash() {
      const hash = window.location.hash.slice(1) || 'home';
      const parts = hash.split('/');
      state.page = parts[0];
      state.sidebarOpen = false;
      if (parts[0] === 'category' && parts[1]) navigateToCategory(parseInt(parts[1]));
      else if (parts[0] === 'question' && parts[1]) loadQuestion(parseInt(parts[1]));
      else if (parts[0] === 'position' && parts[1]) loadPositionDetail(parseInt(parts[1]));
      else if (parts[0] === 'search') { state.searchQuery = parts[1] || ''; doSearch(); }
      else if (parts[0] === 'favorites') loadFavorites();
      else if (parts[0] === 'histories') loadHistories();
      else if (parts[0] === 'practice') { state.practiceMode = true; }
      else if (parts[0] === 'admin') { state.adminPage = parts[1] || 'dashboard'; if (state.adminPage === 'dashboard') loadAdminStats(); }
      else if (parts[0] === 'admin-edit') { if (parts[1]) loadEditQuestion(parseInt(parts[1])); else resetEditForm(); }
      loadPageData(parts[0]);
    }

    async function loadPageData(page) {
      if (page === 'categories') await loadCategoryTree();
      else if (page === 'questions') await loadQuestions();
      else if (page === 'positions') await loadPositions();
    }

    // ---- Navigation ----
    function goTo(page) { window.location.hash = page; }
    function goBack() { window.history.back(); }

    // ---- Stats ----
    async function loadStats() {
      state.stats = await DBService.getStats();
    }

    // ---- Home ----
    async function loadHomeData() {
      state.rootCategories = await DBService.getRootCategories();
      const allQ = await DBService.getQuestions({ status: 'published', sort: 'newest' });
      state.recentQuestions = allQ.slice(0, 8);
      state.featuredQuestions = allQ.sort((a,b) => (b.aiScore||0)-(a.aiScore||0)).slice(0, 8);
    }

    // ---- Category ----
    async function loadCategoryTree() {
      state.categoryTree = await DBService.getCategoryTree();
    }
    async function navigateToCategory(id) {
      state.currentCategory = await DBService.getCategory(id);
      state.categoryPath = await DBService.getCategoryPath(id);
      state.filters.categoryId = id;
      await loadQuestions();
      goTo(`category/${id}`);
    }

    // ---- Questions ----
    async function loadQuestions() {
      state.questions = await DBService.getQuestions(state.filters);
    }
    async function loadQuestion(id) {
      state.currentQuestion = await DBService.getQuestion(id);
      state.categoryPath = await DBService.getCategoryPath(state.currentQuestion.categoryId);
      state.isFav = await DBService.isFavorited(id);
      await DBService.incrementViews(id);
      await DBService.addHistory(id);
    }
    async function toggleFav(id) {
      state.isFav = await DBService.toggleFavorite(id);
      if (state.isFav) Utils.success('已收藏');
    }

    // ---- Search ----
    async function doSearch() {
      if (!state.searchQuery.trim()) return;
      state.questions = SearchService.search(state.searchQuery);
      goTo(`search/${encodeURIComponent(state.searchQuery)}`);
    }
    const debouncedSearch = Utils.debounce(doSearch, 300);

    // ---- Position ----
    async function loadPositions() {
      state.positions = await DBService.getPositions();
    }
    async function loadPositionDetail(id) {
      state.currentPosition = await DBService.getPosition(id);
      state.positionSkills = await DBService.getPositionSkills(id);
    }

    // ---- Favorites ----
    async function loadFavorites() {
      state.favorites = await DBService.getFavorites();
    }
    async function loadHistories() {
      state.histories = await DBService.getHistories();
    }

    // ---- Admin ----
    async function loadAdminStats() {
      state.adminStats = await DBService.getStats();
    }

    // ---- Edit Question ----
    function resetEditForm() {
      state.editQuestion = { title: '', content: '', answer: '', categoryId: '', difficulty: 'mid', type: 'short', positionIds: [], years: '', tags: [], status: 'draft', source: 'manual', notes: '' };
    }
    async function loadEditQuestion(id) {
      const q = await DBService.getQuestion(id);
      if (q) state.editQuestion = { ...q };
    }
    function addTag(e) {
      if (e.key === 'Enter' && e.target.value.trim()) {
        state.editQuestion.tags.push(e.target.value.trim());
        e.target.value = '';
      }
    }

    // ---- Login ----
    async function handleLogin(password, remember) {
      const result = await AuthService.login(password, remember);
      if (result.success) {
        state.isAdmin = true;
        Utils.success(result.firstTime ? '管理员密码已设置，欢迎使用！' : '登录成功');
        return true;
      }
      Utils.error(result.error);
      return false;
    }
    function handleLogout() {
      AuthService.logout();
      state.isAdmin = false;
      Utils.success('已退出管理员模式');
      goTo('home');
    }

    return {
      state, Utils, DBService, AuthService, SearchService,
goTo, goBack, navigateToCategory, loadQuestion, toggleFav, doSearch, debouncedSearch, handleLogin, handleLogout,
      loadPositions, loadPositionDetail, loadFavorites, loadHistories, loadAdminStats, loadCategoryTree,
      loadQuestions, resetEditForm, loadEditQuestion, addTag, loadStats
    };
  },

  // Safe markdown render
  methods: {
    md(text) {
      try {
        return marked.parse(text || '');
      } catch(e) {
        return (text || '').replace(/\n/g, '<br>');
      }
    },
    // ---- Practice ----
    async startPractice() {
      if (!this.state.practicePosition) { Utils.error('请选择岗位'); return; }
      const count = this.state.practiceCount || 10;
      const allQ = await DBService.getQuestions({ positionId: this.state.practicePosition, status: 'published' });
      const shuffled = allQ.sort(() => Math.random() - 0.5).slice(0, count);
      if (shuffled.length === 0) { Utils.error('该岗位暂无题目'); return; }
      this.state.practiceQuestions = shuffled;
      this.state.practiceIndex = 0;
      this.state.practiceResults = [];
      this.state.practiceShowAnswer = false;
      this.state.practiceTimer = 0;
      this.goTo('practice-session');
      this.startTimer();
    },
    startTimer() {
      this._timer = setInterval(() => { this.state.practiceTimer++; }, 1000);
    },
    markPractice(result) {
      this.state.practiceResults.push(result);
      if (this.state.practiceIndex < this.state.practiceQuestions.length - 1) {
        this.state.practiceIndex++;
        this.state.practiceShowAnswer = false;
      } else {
        clearInterval(this._timer);
        this.goTo('practice-result');
      }
    },

    // ---- Position helpers ----
    getPositionsByStage(stage) {
      return this.state.positions.filter(p => p.stage === stage);
    },
    getStageLabel(stage) {
      const map = { stage1: '第一阶段 计算机基础时代', stage2: '第二阶段 软件开发时代', stage3: '第三阶段 互联网时代',
        stage4: '第四阶段 移动互联网时代', stage5: '第五阶段 大数据与云计算时代', stage6: '第六阶段 AI与大模型时代',
        stage7: '第七阶段 新兴技术方向', stage8: '综合管理岗位' };
      return map[stage] || stage;
    },

    // ---- Login ----
    async doLogin() {
      const ok = await this.handleLogin(this.state.loginPassword, this.state.loginRemember);
      if (ok) this.goTo('admin/dashboard');
    },

    // ---- Admin ----
    async addCategory() {
      const name = await Utils.prompt('请输入分类名称', '', '新增分类');
      if (!name) return;
      await DBService.saveCategory({ name, parentId: 0, sort: 0, status: 'active', icon: '📁' });
      Utils.success('分类已创建');
      this.loadCategoryTree();
    },
    async saveAIConfig() {
      localStorage.setItem('ai_api_key', this.state.aiConfig.apiKey);
      localStorage.setItem('ai_base_url', this.state.aiConfig.baseUrl);
      localStorage.setItem('ai_model', this.state.aiConfig.model);
      Utils.success('配置已保存');
    },
    async saveAIResults() {
      let saved = 0;
      for (const q of this.state.aiResults) {
        if (q._raw || !q.title) continue;
        await DBService.saveQuestion({
          title: q.title, content: q.content, answer: q.answer || '暂无参考答案',
          categoryId: 1, difficulty: q.difficulty || 'mid', type: q.type || 'short',
          tags: q.tags || [], source: 'ai', status: 'published'
        });
        saved++;
      }
      Utils.success(`成功保存 ${saved} 道题目`);
      this.state.aiResults = [];
      this.loadStats();
    },
    async testAIConnection() {
      if (!this.state.aiConfig.apiKey) { Utils.error('请先填写API Key'); return; }
      Utils.info('正在测试连接...');
      try {
        const resp = await fetch(this.state.aiConfig.baseUrl + '/v1/models', {
          headers: { 'Authorization': 'Bearer ' + this.state.aiConfig.apiKey }
        });
        if (resp.ok) Utils.success('连接成功！');
        else Utils.error('连接失败: ' + resp.status);
      } catch(e) {
        Utils.error('连接失败: ' + e.message);
      }
    },
    async startAIGenerate() {
      if (!this.state.aiConfig.apiKey) { Utils.error('请先在设置中配置API Key'); return; }
      this.state.aiGenerating = true;
      this.state.aiProgress = 0;
      this.state.aiResults = [];

      // 1. 先解析JD
      const jobDesc = this.state.aiJobDesc.trim();
      const posName = this.state.aiPositionName.trim() || 'IT工程师';
      const years = this.state.aiYears || '3-5';
      let jdTechStack = '';
      let jdPrompt = '';

      if (jobDesc) {
        jdPrompt = `岗位JD原文：\n${jobDesc}\n\n`;
        try {
          Utils.info('正在解析岗位JD...');
          const jdResp = await fetch(this.state.aiConfig.baseUrl + '/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.state.aiConfig.apiKey },
            body: JSON.stringify({
              model: this.state.aiConfig.model,
              messages: [{
                role: 'user',
                content: `你是一名资深IT技术面试官。请分析以下岗位JD，提取出：岗位名称、工作年限要求、必备技术栈（列出具体技术名称）、加分技术栈、软技能要求。\n\n${jdPrompt}\n请以JSON格式返回，包含：positionName, years, requiredTech数组, optionalTech数组, softSkills数组。只返回JSON，不要其他文字。`
              }],
              temperature: 0.3
            })
          });
          const jdData = await jdResp.json();
          const jdContent = jdData.choices?.[0]?.message?.content || '';
          try {
            const jdJson = jdContent.match(/\{[\s\S]*\}/);
            if (jdJson) {
              const parsed = JSON.parse(jdJson[0]);
              jdTechStack = (parsed.requiredTech || []).concat(parsed.optionalTech || []).join('、');
              Utils.success(`JD解析完成，识别到技术栈：${jdTechStack || '未识别到具体技术'}`);
            }
          } catch(e) {
            Utils.warning('JD解析格式异常，将使用岗位名称直接生成');
          }
        } catch(e) {
          Utils.warning('JD解析请求失败，将使用岗位名称直接生成');
        }
      }

      // 2. 生成题目
      this.state.aiProgress = 10;
      const techInfo = jdTechStack ? `\n技术栈要求：${jdTechStack}` : '';
      const prompt = `你是一名资深IT技术面试官和IT技术体系专家。请根据以下信息生成高质量的IT面试题。

岗位名称：${posName}
工作年限：${years}年经验
${jdPrompt}${techInfo}

要求：
1. 生成10道面试题，覆盖基础理论、实际场景、故障排查、设计思路等多个维度
2. 题目难度应与${years}年经验匹配
3. 每道题必须提供专业、准确、结构化的参考答案
4. 编程题应给出题目要求、考察点、参考解法和示例代码
5. 系统设计题应给出架构思路、关键组件、风险点和扩展追问

请严格按照以下JSON数组格式返回，不要输出JSON以外的任何文字：
[
  {
    "title": "题目标题",
    "content": "题目正文（支持Markdown格式）",
    "answer": "参考答案（Markdown格式，详细完整）",
    "difficulty": "junior或mid或senior或expert",
    "type": "short或coding或design或scenario或troubleshoot",
    "tags": ["技术标签1", "技术标签2"]
  }
]`;

      try {
        Utils.info('正在调用AI生成题目...');
        this.state.aiProgress = 20;
        const resp = await fetch(this.state.aiConfig.baseUrl + '/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.state.aiConfig.apiKey },
          body: JSON.stringify({
            model: this.state.aiConfig.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 8192
          })
        });
        this.state.aiProgress = 50;
        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`API请求失败 (${resp.status}): ${errText.slice(0,200)}`);
        }
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content || '';
        this.state.aiProgress = 70;

        // 3. 解析JSON结果
        let questions = [];
        let parseSuccess = false;

        // 尝试多种方式解析
        const extractJson = (text) => {
          // 尝试1: 直接找数组
          let match = text.match(/\[[\s\S]*?\]/);
          if (match) {
            try { return JSON.parse(match[0]); } catch(e) {}
          }
          // 尝试2: 找Markdown代码块中的JSON
          match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (match) {
            try { return JSON.parse(match[1].trim()); } catch(e) {}
          }
          // 尝试3: 找对象中的questions数组
          match = text.match(/"questions"\s*:\s*(\[[\s\S]*?\])\s*[,\]\}]/);
          if (match) {
            try { return JSON.parse(match[1]); } catch(e) {}
          }
          // 尝试4: 修复常见JSON错误后重试
          try {
            let fixed = text.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
            match = fixed.match(/\[[\s\S]*?\]/);
            if (match) return JSON.parse(match[0]);
          } catch(e) {}
          return null;
        };

        questions = extractJson(content);
        if (questions && Array.isArray(questions) && questions.length > 0) {
          parseSuccess = true;
        }

        if (!parseSuccess) {
          // 显示原始内容让用户手动处理
          this.state.aiResults = [{
            title: '⚠️ AI返回格式异常，请手动处理',
            content: content,
            answer: 'AI返回的原始内容如上所示，您可以复制后手动编辑保存为题目。',
            difficulty: 'mid',
            type: 'short',
            tags: [],
            _raw: true
          }];
          this.state.aiProgress = 100;
          this.state.aiGenerating = false;
          Utils.warning('AI返回格式异常，请在下方查看原始内容并手动处理');
          return;
        }

        // 4. 保存题目
        this.state.aiProgress = 85;
        let saved = 0;
        for (const q of questions) {
          if (!q.title || !q.content) continue;
          await DBService.saveQuestion({
            title: q.title,
            content: q.content,
            answer: q.answer || '暂无参考答案',
            categoryId: 1,
            difficulty: q.difficulty || 'mid',
            type: q.type || 'short',
            tags: q.tags || [],
            source: 'ai',
            status: 'published'
          });
          saved++;
        }

        this.state.aiResults = questions;
        this.state.aiProgress = 100;
        Utils.success(`AI生成完成！成功保存 ${saved}/${questions.length} 道题目`);
        this.loadStats();
      } catch(e) {
        Utils.error('AI生成失败: ' + e.message);
        this.state.aiResults = [{
          title: '❌ AI生成出错',
          content: '错误信息：' + e.message,
          answer: '请检查API Key是否正确、网络连接是否正常，或稍后重试。',
          difficulty: 'mid', type: 'short', tags: [], _raw: true
        }];
      }
      this.state.aiGenerating = false;
    },
    async handleImportFile(e) {
      const file = e.target.files[0];
      if (!file) return;
      Utils.info('正在解析文件...');
      try {
        const text = await file.text();
        this.state.importPreview = [{ title: file.name, difficulty: 'mid', type: 'short' }];
        Utils.success('文件解析完成');
      } catch(e) {
        Utils.error('文件解析失败');
      }
    },
    async doImport() {
      Utils.info('导入功能需要集成SheetJS库，请使用Excel模板导入');
    },
    async doBackup() {
      const data = await DBService.exportBackup();
      const json = JSON.stringify(data, null, 2);
      const now = new Date();
      const filename = 'it-interview-bank-backup-' + now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + '.json';
      Utils.downloadFile(json, filename);
      Utils.success('备份已导出');
    },
    triggerRestore() {
      this.$refs.restoreInput?.click();
    },
    async handleRestore(e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const confirm = await Utils.confirm('恢复将覆盖或合并现有数据，是否继续？');
        if (confirm) {
          await DBService.importBackup(data, 'merge');
          Utils.success('数据恢复完成');
          this.loadStats();
        }
      } catch(e) {
        Utils.error('备份文件解析失败: ' + e.message);
      }
    }
  }
};

// ---- Mount ----
console.log('Attempting to mount Vue app...');
try {
  const app = createApp(App);
  console.log('App created');
  app.mount('#app');
  console.log('App mounted successfully!');
} catch(e) {
  console.error('FATAL: Failed to mount app:', e);
  document.getElementById('error-display').style.display = 'block';
  document.getElementById('error-display').innerHTML = '<strong>FATAL Error:</strong> ' + e.message + '<br><pre>' + (e.stack || '') + '</pre>';
}