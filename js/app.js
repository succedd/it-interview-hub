/* ============================================
   IT面试题库管理系统 - 主应用 (组件化拆分版)
   ============================================ */
const { createApp, reactive, onMounted, nextTick } = Vue;

// ---- App Setup Logic (from full app) ----
function appSetup() {
  const state = reactive({
    page: 'home', loading: false, searchQuery: '',
    isAdmin: false, theme: 'system', sidebarOpen: false,
    stats: { categories: 0, questions: 0, positions: 0, aiGenerated: 0, rootCategories: 0 },
    rootCategories: [], hotTags: ['Java', 'Spring Boot', 'Redis', 'MySQL', 'Vue', 'React', 'Docker', 'Kubernetes', 'AI大模型', '算法'],
    recentQuestions: [], featuredQuestions: [],
    categoryTree: [], currentCategory: null, categoryPath: [],
    questions: [], currentQuestion: null, isFav: false,
    filters: { categoryId: null, difficulty: '', type: '', positionId: '', sort: 'newest', search: '' },
    positions: [], currentPosition: null, positionSkills: [],
    favorites: [], histories: [],
    adminPage: 'dashboard', adminStats: {},
    editQuestion: { title: '', content: '', answer: '', categoryId: '', difficulty: 'mid', type: 'short', positionIds: [], years: '', tags: [], status: 'draft', source: 'manual', notes: '' },
    aiConfig: { apiKey: '', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat', timeout: 60, temperature: 0.7, maxQuestions: 20 },
    aiJobDesc: '', aiPositionName: '', aiYears: '3-5', aiGenerating: false, aiProgress: 0, aiResults: [],
    importData: null, importPreview: [], backupInfo: null,
    systemInitialized: false, scrollY: 0,
    loginPassword: '', loginRemember: false,
    practicePosition: null, practiceYears: '3-5', practiceCount: 10,
    practiceQuestions: [], practiceIndex: 0, practiceResults: [], practiceShowAnswer: false, practiceTimer: 0
  });

  onMounted(async () => {
    try {
      Utils.applyTheme(localStorage.getItem('theme') || 'system');
      await AuthService.init();
      state.isAdmin = AuthService.isLoggedIn();
      await DBService.initDatabase();
      state.systemInitialized = true;
      await SearchService.buildIndex();
      state.stats = await DBService.getStats();
      state.rootCategories = await DBService.getRootCategories();
      const allQ = await DBService.getQuestions({ status: 'published', sort: 'newest' });
      state.recentQuestions = allQ.slice(0, 8);
      state.featuredQuestions = allQ.sort((a,b) => (b.aiScore||0)-(a.aiScore||0)).slice(0, 8);
      state.aiConfig.apiKey = localStorage.getItem('ai_api_key') || '';
      state.aiConfig.baseUrl = localStorage.getItem('ai_base_url') || 'https://api.deepseek.com';
      state.aiConfig.model = localStorage.getItem('ai_model') || 'deepseek-chat';
      handleHash();
      window.addEventListener('hashchange', handleHash);
      window.addEventListener('scroll', () => { state.scrollY = window.scrollY; });
      state.loading = false;
    } catch(e) { console.error('Init error:', e); }
  });

  function handleHash() {
    const hash = window.location.hash.slice(1) || 'home';
    const parts = hash.split('/');
    state.page = parts[0];
    if (parts[0] === 'category' && parts[1]) { loadCategory(parseInt(parts[1])); }
    else if (parts[0] === 'question' && parts[1]) { loadQuestion(parseInt(parts[1])); }
    else if (parts[0] === 'position' && parts[1]) { loadPosition(parseInt(parts[1])); }
    else if (parts[0] === 'search' && parts[1]) { state.searchQuery = parts[1]; doSearch(); }
    else if (parts[0] === 'favorites') { loadFavorites(); }
    else if (parts[0] === 'histories') { loadHistories(); }
    else if (parts[0] === 'admin') { state.adminPage = parts[1] || 'dashboard'; }
    if (parts[0] === 'categories') loadCategoryTree();
    if (parts[0] === 'questions') loadQuestions();
    if (parts[0] === 'positions') loadPositions();
  }

  function goTo(page) { window.location.hash = page; }
  function toggleTheme() {
    const t = localStorage.getItem('theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', t);
    Utils.applyTheme(t);
  }

  async function loadCategoryTree() { state.categoryTree = await DBService.getCategoryTree(); }
  async function loadCategory(id) {
    state.currentCategory = await DBService.getCategory(id);
    state.categoryPath = await DBService.getCategoryPath(id);
    state.filters.categoryId = id;
    await loadQuestions();
  }
  async function loadQuestions() { state.questions = await DBService.getQuestions(state.filters); }
  async function loadQuestion(id) {
    state.currentQuestion = await DBService.getQuestion(id);
    state.categoryPath = await DBService.getCategoryPath(state.currentQuestion.categoryId);
    state.isFav = await DBService.isFavorited(id);
    await DBService.incrementViews(id);
    await DBService.addHistory(id);
  }
  async function toggleFav(id) { state.isFav = await DBService.toggleFavorite(id); }
  async function doSearch() {
    if (!state.searchQuery.trim()) return;
    state.questions = SearchService.search(state.searchQuery);
  }
  async function loadPositions() { state.positions = await DBService.getPositions(); }
  async function loadPosition(id) {
    state.currentPosition = await DBService.getPosition(id);
    state.positionSkills = await DBService.getPositionSkills(id);
  }
  async function loadFavorites() { state.favorites = await DBService.getFavorites(); }
  async function loadHistories() { state.histories = await DBService.getHistories(); }
  async function handleLogin(password, remember) {
    const r = await AuthService.login(password, remember);
    if (r.success) { state.isAdmin = true; Utils.success(r.firstTime ? '管理员密码已设置' : '登录成功'); return true; }
    Utils.error(r.error); return false;
  }
  function handleLogout() { AuthService.logout(); state.isAdmin = false; Utils.success('已退出管理员模式'); goTo('home'); }

  // Theme fix
  state.theme = localStorage.getItem('theme') || 'system';

  return {
    state, Utils, DBService, AuthService, SearchService,
    goTo, toggleTheme, loadCategoryTree, loadCategory, loadQuestions, loadQuestion,
    toggleFav, doSearch, loadPositions, loadPosition, loadFavorites, loadHistories,
    handleLogin, handleLogout
  };
}

// ---- Page Components ----
const HomePage = {
  template: `
    <div>
      <div class="hero">
        <h1>IT面试题库管理系统</h1>
        <p>覆盖21大技术领域，100+技术子分类，所有主流IT岗位的面试题库</p>
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input v-model="s.searchQuery" placeholder="搜索题目..." @keydown.enter="r.doSearch()">
        </div>
        <div class="hot-tags">
          <span class="tag" v-for="tag in s.hotTags" :key="tag" @click="s.searchQuery=tag;r.doSearch()">{{tag}}</span>
        </div>
      </div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-number">{{s.stats.rootCategories||0}}</div><div class="stat-label">技术领域</div></div>
        <div class="stat-card accent"><div class="stat-number">{{s.stats.questions||0}}</div><div class="stat-label">题目总数</div></div>
        <div class="stat-card success"><div class="stat-number">{{s.stats.positions||0}}</div><div class="stat-label">覆盖岗位</div></div>
        <div class="stat-card"><div class="stat-number">{{s.stats.aiGenerated||0}}</div><div class="stat-label">AI生成</div></div>
      </div>
      <div class="section">
        <div class="section-header"><h2 class="section-title">技术体系 <span class="highlight">导航</span></h2><span class="section-more" @click="r.goTo('categories')">查看全部 →</span></div>
        <div class="card-grid">
          <div class="card" v-for="cat in s.rootCategories" :key="cat.id" @click="r.loadCategory(cat.id);r.goTo('category/'+cat.id)">
            <div class="card-icon" style="background:var(--primary-bg);color:var(--primary);font-size:24px">{{cat.icon||'📁'}}</div>
            <div class="card-title">{{cat.name}}</div>
            <div class="card-desc">{{cat.desc||''}}</div>
            <div class="card-meta"><span>📚 {{cat.era||''}}</span></div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-header"><h2 class="section-title">最新题目</h2><span class="section-more" @click="r.goTo('questions')">查看全部 →</span></div>
        <div class="card-grid small">
          <div class="q-card" v-for="q in s.recentQuestions" :key="q.id" @click="r.goTo('question/'+q.id)">
            <div class="q-title">{{q.title}}</div>
            <div class="q-meta"><span :class="'badge '+Utils.difficultyBadge(q.difficulty)">{{Utils.difficultyLabel(q.difficulty)}}</span><span class="badge badge-outline">{{Utils.typeLabel(q.type)}}</span><span>{{Utils.formatDateShort(q.updated)}}</span></div>
          </div>
        </div>
      </div>
    </div>
  `,
  computed: {
    s() { return this.$root.state; },
    r() { return this.$root; }
  }
};

const CategoryList = {
  template: `
    <div>
      <div class="section-header"><h2 class="section-title">技术体系分类</h2></div>
      <div class="card-grid" style="margin-top:16px">
        <div class="card" v-for="cat in s.categoryTree" :key="cat.id" @click="r.loadCategory(cat.id);r.goTo('category/'+cat.id)">
          <div class="card-icon" style="background:var(--primary-bg);color:var(--primary);font-size:24px">{{cat.icon||'📁'}}</div>
          <div class="card-title">{{cat.name}}</div>
          <div class="card-desc">{{cat.desc||''}}</div>
          <div class="card-meta"><span>{{cat.era||''}}</span><span>{{cat.children?.length||0}}个子分类</span></div>
        </div>
      </div>
    </div>
  `,
  computed: {
    s() { return this.$root.state; },
    r() { return this.$root; }
  }
};

const QuestionList = {
  template: `
    <div>
      <div class="section-header"><h2 class="section-title">全部题目</h2></div>
      <div class="card-grid small">
        <div class="q-card" v-for="q in s.questions" :key="q.id" @click="r.goTo('question/'+q.id)">
          <div class="q-title">{{q.title}}</div>
          <div class="q-summary">{{Utils.stripMarkdown(q.content).slice(0,80)}}...</div>
          <div class="q-tags"><span :class="'badge '+Utils.difficultyBadge(q.difficulty)">{{Utils.difficultyLabel(q.difficulty)}}</span><span class="badge badge-outline">{{Utils.typeLabel(q.type)}}</span></div>
          <div class="q-meta"><span>👁 {{q.views||0}}</span><span>⭐ {{q.favCount||0}}</span></div>
        </div>
      </div>
    </div>
  `,
  computed: {
    s() { return this.$root.state; },
    r() { return this.$root; }
  }
};

const PositionList = {
  template: `
    <div>
      <div class="section-header"><h2 class="section-title">岗位体系</h2></div>
      <div v-for="sid in stages" :key="sid">
        <template v-if="getPositions(sid).length>0">
          <h3 style="font-size:16px;font-weight:600;margin:20px 0 12px;color:var(--text-secondary)">{{getLabel(sid)}}</h3>
          <div class="card-grid small">
            <div class="card" v-for="p in getPositions(sid)" :key="p.id" @click="r.goTo('position/'+p.id)">
              <div class="card-title">{{p.name}}</div>
              <div class="card-desc">{{p.desc||''}}</div>
              <div class="card-meta"><span class="badge badge-outline">{{p.category}}</span></div>
            </div>
          </div>
        </template>
      </div>
    </div>
  `,
  computed: {
    s() { return this.$root.state; },
    r() { return this.$root; },
    stages() { return ['stage1','stage2','stage3','stage4','stage5','stage6','stage7','stage8']; }
  },
  methods: {
    getPositions(stage) { return this.s.positions.filter(p => p.stage === stage); },
    getLabel(stage) { const m = { stage1:'第一阶段 计算机基础时代', stage2:'第二阶段 软件开发时代', stage3:'第三阶段 互联网时代', stage4:'第四阶段 移动互联网时代', stage5:'第五阶段 大数据与云计算时代', stage6:'第六阶段 AI与大模型时代', stage7:'第七阶段 新兴技术方向', stage8:'综合管理岗位' }; return m[stage] || stage; }
  }
};

const FavoritesPage = {
  template: `
    <div>
      <div class="section-header"><h2 class="section-title">我的收藏</h2></div>
      <div v-if="s.favorites.length===0" class="empty-state"><div class="empty-icon">⭐</div><h3>还没有收藏题目</h3><p>浏览题目时点击收藏按钮即可收藏</p></div>
      <div class="card-grid small" v-else>
        <div class="q-card" v-for="q in s.favorites" :key="q.id" @click="r.goTo('question/'+q.id)">
          <div class="q-title">{{q.title}}</div>
          <div class="q-meta"><span :class="'badge '+Utils.difficultyBadge(q.difficulty)">{{Utils.difficultyLabel(q.difficulty)}}</span><span>{{Utils.formatDateShort(q.favTime)}}</span></div>
        </div>
      </div>
    </div>
  `,
  computed: { s() { return this.$root.state; }, r() { return this.$root; } }
};

const LoginPage = {
  template: `
    <div style="max-width:400px;margin:60px auto;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:32px">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;text-align:center">{{AuthService.hasPassword()?'管理员登录':'首次设置管理员密码'}}</h2>
      <p style="font-size:13px;color:var(--text-tertiary);text-align:center;margin-bottom:20px">纯静态本地版，密码仅用于当前浏览器权限隔离</p>
      <div class="form-group"><label class="form-label">管理员密码</label><input class="form-input" type="password" v-model="s.loginPassword" placeholder="请输入密码" @keydown.enter="doLogin"></div>
      <button class="btn btn-primary btn-block" @click="doLogin">{{AuthService.hasPassword()?'登录':'设置密码'}}</button>
    </div>
  `,
  computed: { s() { return this.$root.state; }, r() { return this.$root; } },
  methods: {
    async doLogin() {
      const ok = await this.r.handleLogin(this.s.loginPassword, this.s.loginRemember);
      if (ok) this.r.goTo('admin/dashboard');
    }
  }
};

// ---- Main App ----
const App = {
  setup() { return appSetup(); },
  components: { HomePage, CategoryList, QuestionList, PositionList, FavoritesPage, LoginPage },
  template: `
    <div class="app-layout">
      <div id="toast-container" class="toast-container"></div>
      <nav class="navbar">
        <div class="navbar-brand" @click="goTo('home')"><div class="brand-icon">IT</div><span>IT面试题库</span></div>
        <div class="navbar-nav">
          <button class="nav-link" :class="{active:state.page==='categories'}" @click="goTo('categories')">技术体系</button>
          <button class="nav-link" :class="{active:state.page==='positions'}" @click="goTo('positions')">岗位体系</button>
          <button class="nav-link" :class="{active:state.page==='favorites'}" @click="goTo('favorites')">收藏夹</button>
        </div>
        <div class="search-bar" style="margin-left:16px">
          <span class="search-icon">🔍</span>
          <input v-model="state.searchQuery" placeholder="搜索..." @keydown.enter="doSearch">
        </div>
        <div class="navbar-right">
          <button class="icon-btn" @click="toggleTheme">🌙</button>
          <button v-if="!state.isAdmin" class="nav-link" @click="goTo('admin/login')">管理员</button>
          <button v-else class="nav-link active" @click="goTo('admin/dashboard')">仪表盘</button>
        </div>
      </nav>
      <div class="main-content">
        <div class="page-container">
          <HomePage v-if="state.page==='home'"/>
          <CategoryList v-else-if="state.page==='categories'"/>
          <QuestionList v-else-if="state.page==='questions'"/>
          <PositionList v-else-if="state.page==='positions'"/>
          <FavoritesPage v-else-if="state.page==='favorites'"/>
          <LoginPage v-else-if="state.page==='admin/login'"/>
          <div v-else-if="state.page==='admin'">
            <p>Admin: {{state.adminPage}}</p>
          </div>
          <div v-else-if="state.page==='category' && state.currentCategory">
            <div class="breadcrumb">
              <a @click="goTo('categories')">技术体系</a>
              <span class="sep">/</span>
              <template v-for="(c,i) in state.categoryPath" :key="c.id">
                <a @click="loadCategory(c.id);goTo('category/'+c.id)">{{c.name}}</a>
                <span class="sep" v-if="i<state.categoryPath.length-1">/</span>
              </template>
            </div>
            <h2 class="section-title">{{state.currentCategory.name}}</h2>
            <p style="color:var(--text-secondary);margin:8px 0 16px">{{state.currentCategory.desc||''}}</p>
            <div class="card-grid small">
              <div class="q-card" v-for="q in state.questions" :key="q.id" @click="goTo('question/'+q.id)">
                <div class="q-title">{{q.title}}</div>
                <div class="q-meta"><span :class="'badge '+Utils.difficultyBadge(q.difficulty)">{{Utils.difficultyLabel(q.difficulty)}}</span><span>{{Utils.formatDateShort(q.updated)}}</span></div>
              </div>
            </div>
          </div>
          <div v-else-if="state.page==='question' && state.currentQuestion">
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px">
              <h1 style="font-size:22px;font-weight:700;margin-bottom:12px">{{state.currentQuestion.title}}</h1>
              <div class="q-tags" style="margin-bottom:12px">
                <span :class="'badge '+Utils.difficultyBadge(state.currentQuestion.difficulty)">{{Utils.difficultyLabel(state.currentQuestion.difficulty)}}</span>
                <span class="badge badge-outline">{{Utils.typeLabel(state.currentQuestion.type)}}</span>
              </div>
              <div class="markdown-body" v-html="md(state.currentQuestion.content)"></div>
              <hr style="margin:16px 0;border-color:var(--border)">
              <button class="btn btn-primary" @click="state.showAnswer=!state.showAnswer">{{state.showAnswer?'隐藏答案':'查看答案'}}</button>
              <button class="btn btn-outline" @click="toggleFav(state.currentQuestion.id)" style="margin-left:8px">{{state.isFav?'⭐ 已收藏':'☆ 收藏'}}</button>
              <div v-if="state.showAnswer" class="markdown-body" style="background:var(--bg-alt);padding:20px;border-radius:var(--radius-sm);margin-top:16px" v-html="md(state.currentQuestion.answer)"></div>
            </div>
          </div>
          <div v-else-if="state.page==='position' && state.currentPosition">
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px">
              <h1 style="font-size:24px;font-weight:700">{{state.currentPosition.name}}</h1>
              <p style="color:var(--text-secondary);margin:8px 0 20px">{{state.currentPosition.desc||''}}</p>
              <h3 style="font-size:15px;font-weight:600;margin-bottom:12px">必考技术栈</h3>
              <div class="card-grid small" v-if="state.positionSkills.length>0">
                <div class="card" v-for="skill in state.positionSkills" :key="skill.id" style="padding:14px">
                  <div class="card-title" style="font-size:14px">{{skill.techName}}</div>
                  <div class="card-meta"><span style="color:var(--warning)">{{Utils.renderStars(skill.importance)}}</span><span class="badge badge-outline">{{skill.depth}}</span></div>
                </div>
              </div>
            </div>
          </div>
          <div v-else>
            <p style="text-align:center;padding:60px;color:var(--text-secondary)">页面加载中... ({{state.page}})</p>
          </div>
        </div>
      </div>
      <button class="back-top" :class="{visible:state.scrollY>300}" @click="window.scrollTo({top:0,behavior:'smooth'})">↑</button>
    </div>
  `,
  methods: {
    md(text) {
      try { return marked.parse(text || ''); }
      catch(e) { return (text || '').replace(/\n/g, '<br>'); }
    }
  }
};

// ---- Mount ----
const app = createApp(App);
app.mount('#app');
console.log('App mounted!');