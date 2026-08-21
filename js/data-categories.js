/* ============================================
   IT面试题库管理系统 - 初始数据 (第一部分：分类与岗位)
   ============================================ */
const INITIAL_DATA = {
  _catId: 1, _posId: 1, _skillId: 1, _qId: 1,
  categories: [], positions: [], positionSkills: [], questions: [],

  addCategory(name, parentId = 0, desc = '', icon = '', sort = 0, era = '') {
    const id = this._catId++;
    this.categories.push({ id, parentId, name, desc, icon, sort, era, level: parentId === 0 ? 1 : (parentId > 100 ? 3 : 2), status: 'active' });
    return id;
  },
  addPosition(name, stage, stageLabel, category = '', desc = '', sort = 0) {
    const id = this._posId++;
    this.positions.push({ id, name, stage, stageLabel, category, desc, hot: 'medium', sort, status: 'active' });
    return id;
  },
  addSkill(positionId, categoryId, techName, importance = 3, depth = '了解', required = false) {
    const id = this._skillId++;
    this.positionSkills.push({ id, positionId, categoryId, techName, importance, depth, required: required ? 1 : 0 });
    return id;
  },
  addQuestion(title, content, answer, categoryId, difficulty, type, positionIds = [], tags = [], source = 'manual', years = '') {
    const id = this._qId++;
    const now = Date.now() - Math.floor(Math.random() * 86400000 * 30);
    this.questions.push({ id, categoryId, title, content, answer, difficulty, type, positionIds: positionIds || [],
      positionNames: [], years, tags, source, aiScore: source === 'ai' ? Math.floor(Math.random() * 20 + 70) : 0,
      status: 'published', views: Math.floor(Math.random() * 500), favCount: Math.floor(Math.random() * 50),
      created: now, updated: now });
    return id;
  },
  _getCatId(name) {
    const c = this.categories.find(c => c.name === name); return c ? c.id : 1;
  },
  _getPosIds(names) {
    return names.map(n => { const p = this.positions.find(p => p.name === n); return p ? p.id : null; }).filter(Boolean);
  },

  async initialize() {
    this.buildCategories();
    this.buildPositions();
    this.buildQuestions();
    for (const c of this.categories) await DB.categories.add(c);
    for (const p of this.positions) await DB.positions.add(p);
    for (const s of this.positionSkills) await DB.positionSkills.add(s);
    for (const q of this.questions) await DB.questions.add(q);
  },

  buildPositions() {
    const p1 = this.addPosition('Java开发工程师', 'stage2', '软件开发时代', '后端', '使用Java进行后端系统开发', 1);
    this.addSkill(p1, 0, 'Java基础', 5, '精通', true);
    this.addSkill(p1, 0, 'Spring Boot', 5, '精通', true);
    this.addSkill(p1, 0, 'MySQL', 5, '精通', true);
    this.addSkill(p1, 0, 'Redis', 5, '精通', true);
    this.addSkill(p1, 0, '多线程与并发', 5, '精通', true);
    this.addSkill(p1, 0, 'JVM调优', 4, '熟悉', true);
    this.addSkill(p1, 0, 'MyBatis', 4, '熟悉', true);
    this.addSkill(p1, 0, '数据结构与算法', 4, '熟悉', false);
    this.addSkill(p1, 0, '计算机网络', 4, '熟悉', false);
    this.addSkill(p1, 0, 'Spring Cloud', 4, '熟悉', false);
    this.addSkill(p1, 0, 'Kafka', 4, '熟悉', false);
    this.addSkill(p1, 0, 'Docker', 3, '了解', false);

    const p2 = this.addPosition('前端开发工程师', 'stage3', '互联网时代', '前端', '负责Web前端界面开发', 2);
    this.addSkill(p2, 0, 'HTML与CSS', 5, '精通', true);
    this.addSkill(p2, 0, 'JavaScript', 5, '精通', true);
    this.addSkill(p2, 0, 'TypeScript', 4, '熟悉', true);
    this.addSkill(p2, 0, 'Vue.js', 5, '精通', true);
    this.addSkill(p2, 0, 'React', 5, '精通', true);
    this.addSkill(p2, 0, '浏览器原理', 4, '熟悉', true);
    this.addSkill(p2, 0, '前端工程化', 4, '熟悉', true);
    this.addSkill(p2, 0, '前端性能优化', 4, '熟悉', false);

    const p3 = this.addPosition('Python开发工程师', 'stage2', '软件开发时代', '后端', '使用Python进行后端开发', 3);
    this.addSkill(p3, 0, 'Python基础', 5, '精通', true);
    this.addSkill(p3, 0, 'Django/FastAPI', 5, '精通', true);
    this.addSkill(p3, 0, 'MySQL', 4, '熟悉', true);
    this.addSkill(p3, 0, 'Redis', 4, '熟悉', true);
    this.addSkill(p3, 0, '异步编程asyncio', 4, '熟悉', false);

    const p4 = this.addPosition('Go后端工程师', 'stage2', '软件开发时代', '后端', '使用Go进行高性能后端开发', 4);
    this.addSkill(p4, 0, 'Go基础语法', 5, '精通', true);
    this.addSkill(p4, 0, 'Go并发编程', 5, '精通', true);
    this.addSkill(p4, 0, 'Gin框架', 4, '熟悉', true);
    this.addSkill(p4, 0, 'Gorm', 4, '熟悉', true);
    this.addSkill(p4, 0, 'MySQL', 4, '熟悉', true);
    this.addSkill(p4, 0, 'Redis', 4, '熟悉', true);
    this.addSkill(p4, 0, 'gRPC', 4, '熟悉', true);
    this.addSkill(p4, 0, '微服务架构', 4, '熟悉', false);

    const p5 = this.addPosition('DevOps工程师', 'stage5', '大数据与云计算时代', '云原生', '负责CI/CD、容器化、自动化运维', 5);
    this.addSkill(p5, 0, 'Linux系统管理', 5, '精通', true);
    this.addSkill(p5, 0, 'Shell脚本', 5, '精通', true);
    this.addSkill(p5, 0, 'Docker', 5, '精通', true);
    this.addSkill(p5, 0, 'Kubernetes', 5, '精通', true);
    this.addSkill(p5, 0, 'CI/CD流水线', 5, '精通', true);
    this.addSkill(p5, 0, 'Git', 4, '熟悉', true);
    this.addSkill(p5, 0, 'Prometheus/Grafana', 4, '熟悉', true);
    this.addSkill(p5, 0, 'Terraform', 4, '熟悉', false);

    const p6 = this.addPosition('算法工程师', 'stage6', 'AI与大模型时代', 'AI', '负责机器学习、深度学习算法', 6);
    this.addSkill(p6, 0, 'Python', 5, '精通', true);
    this.addSkill(p6, 0, '机器学习基础', 5, '精通', true);
    this.addSkill(p6, 0, '深度学习', 5, '精通', true);
    this.addSkill(p6, 0, 'PyTorch', 5, '精通', true);
    this.addSkill(p6, 0, '数学基础', 5, '精通', true);
    this.addSkill(p6, 0, '特征工程', 4, '熟悉', false);
    this.addSkill(p6, 0, '模型评估', 4, '熟悉', false);

    const p7 = this.addPosition('AI应用开发工程师', 'stage6', 'AI与大模型时代', 'AI', '基于LLM开发AI应用', 7);
    this.addSkill(p7, 0, 'Python', 5, '精通', true);
    this.addSkill(p7, 0, 'LLM原理', 5, '精通', true);
    this.addSkill(p7, 0, 'Prompt Engineering', 5, '精通', true);
    this.addSkill(p7, 0, 'LangChain', 5, '精通', true);
    this.addSkill(p7, 0, 'RAG技术', 5, '精通', true);
    this.addSkill(p7, 0, '向量数据库', 4, '熟悉', true);
    this.addSkill(p7, 0, 'AI Agent框架', 4, '熟悉', false);

    const p8 = this.addPosition('大数据工程师', 'stage5', '大数据与云计算时代', '大数据', '大数据平台开发、数仓建设', 8);
    this.addSkill(p8, 0, 'Hadoop生态', 4, '熟悉', true);
    this.addSkill(p8, 0, 'Spark', 5, '精通', true);
    this.addSkill(p8, 0, 'Flink', 5, '精通', true);
    this.addSkill(p8, 0, 'Hive', 4, '熟悉', true);
    this.addSkill(p8, 0, 'Kafka', 4, '熟悉', true);
    this.addSkill(p8, 0, '数仓建模', 5, '精通', true);

    const p9 = this.addPosition('信息安全工程师', 'stage5', '大数据与云计算时代', '安全', '负责网络安全、渗透测试', 9);
    this.addSkill(p9, 0, '网络安全基础', 5, '精通', true);
    this.addSkill(p9, 0, 'Web安全OWASP', 5, '精通', true);
    this.addSkill(p9, 0, 'SQL注入', 5, '精通', true);
    this.addSkill(p9, 0, 'XSS/CSRF', 5, '精通', true);
    this.addSkill(p9, 0, '渗透测试', 4, '熟悉', true);
    this.addSkill(p9, 0, '密码学基础', 4, '熟悉', false);

    const p10 = this.addPosition('iOS开发工程师', 'stage4', '移动互联网时代', '移动端', 'iOS应用开发', 10);
    this.addSkill(p10, 0, 'Swift', 5, '精通', true);
    this.addSkill(p10, 0, 'UIKit', 5, '精通', true);
    this.addSkill(p10, 0, 'SwiftUI', 4, '熟悉', true);
    this.addSkill(p10, 0, '内存管理ARC', 5, '精通', true);
    this.addSkill(p10, 0, '多线程GCD', 4, '熟悉', true);

    const p11 = this.addPosition('Android开发工程师', 'stage4', '移动互联网时代', '移动端', 'Android应用开发', 11);
    this.addSkill(p11, 0, 'Kotlin', 5, '精通', true);
    this.addSkill(p11, 0, 'Android SDK', 5, '精通', true);
    this.addSkill(p11, 0, 'Jetpack', 5, '精通', true);
    this.addSkill(p11, 0, 'Jetpack Compose', 4, '熟悉', true);
    this.addSkill(p11, 0, '协程', 5, '精通', true);

    // Additional positions
    this.addPosition('数据库管理员DBA', 'stage2', '软件开发时代', '数据库', '数据库管理、优化、高可用', 12);
    this.addPosition('测试工程师', 'stage2', '软件开发时代', '测试', '功能测试、自动化测试', 13);
    this.addPosition('系统运维工程师', 'stage2', '软件开发时代', '运维', 'Linux/Windows系统运维', 14);
    this.addPosition('后端开发工程师', 'stage3', '互联网时代', '后端', '服务端业务逻辑开发', 15);
    this.addPosition('全栈开发工程师', 'stage3', '互联网时代', '全栈', '前后端通吃', 16);
    this.addPosition('产品经理', 'stage3', '互联网时代', '产品', '产品规划、需求分析', 17);
    this.addPosition('数据分析师', 'stage5', '大数据与云计算时代', '大数据', '业务数据分析', 18);
    this.addPosition('云计算工程师', 'stage5', '大数据与云计算时代', '云计算', '云平台开发、云架构', 19);
    this.addPosition('数据科学家', 'stage6', 'AI与大模型时代', 'AI', '数据挖掘、统计建模', 20);
    this.addPosition('MLOps工程师', 'stage6', 'AI与大模型时代', 'AI', '模型部署、ML流水线', 21);
    this.addPosition('技术经理', 'stage8', '综合管理', '管理', '技术团队管理', 22);
    this.addPosition('架构师', 'stage8', '综合管理', '管理', '系统架构设计', 23);
    this.addPosition('游戏开发工程师', 'stage4', '移动互联网时代', '游戏', 'Unity/Unreal开发', 24);
    this.addPosition('区块链工程师', 'stage7', '新兴技术方向', '区块链', '智能合约、DApp', 25);
    this.addPosition('嵌入式与物联网工程师', 'stage7', '新兴技术方向', 'IoT', '嵌入式开发', 26);
    this.addPosition('音视频与流媒体工程师', 'stage7', '新兴技术方向', '音视频', '音视频SDK', 27);
    this.addPosition('网络工程师', 'stage1', '计算机基础时代', '网络', '网络规划、运维', 28);
    this.addPosition('硬件工程师', 'stage1', '计算机基础时代', '硬件', '数字电路、嵌入式硬件', 29);
  },

  buildCategories() {
    const c1 = this.addCategory('计算机科学基础', 0, '数据结构、算法、操作系统等核心基础', '💻', 1, '1950s-1970s');
    this.addCategory('数据结构', c1, '数组、链表、栈、队列、树、图', '📊', 1);
    this.addCategory('算法', c1, '排序、搜索、动态规划、贪心', '⚡', 2);
    this.addCategory('操作系统原理', c1, '进程管理、内存管理、文件系统', '🖥️', 3);
    this.addCategory('计算机组成原理', c1, 'CPU、内存、IO系统', '🔧', 4);
    this.addCategory('计算机网络基础', c1, '网络分层、协议基础', '🌐', 5);
    this.addCategory('编译原理', c1, '词法分析、语法分析', '🔨', 6);
    this.addCategory('离散数学', c1, '集合论、图论、逻辑', '📐', 7);

    const c2 = this.addCategory('编程语言与编程基础', 0, '主流编程语言及编程范式', '📝', 2, '1970s-1990s');
    this.addCategory('Java', c2, 'Java基础、集合、IO、多线程', '☕', 1);
    this.addCategory('Python', c2, 'Python基础、高级特性', '🐍', 2);
    this.addCategory('JavaScript', c2, 'JS基础、ES6+、异步编程', '📜', 3);
    this.addCategory('TypeScript', c2, '类型系统、泛型', '📘', 4);
    this.addCategory('Go', c2, 'Go语法、并发、标准库', '🔵', 5);
    this.addCategory('C++', c2, 'C++11/14/17、STL', '⚙️', 6);
    this.addCategory('Rust', c2, '所有权、生命周期', '🦀', 7);
    this.addCategory('C语言', c2, '指针、内存、预处理', '🔌', 8);

    const c3 = this.addCategory('数据库与数据存储', 0, '关系型和非关系型数据库技术', '🗄️', 3, '1970s-2000s');
    this.addCategory('MySQL', c3, 'SQL、索引、事务、锁、优化', '🐬', 1);
    this.addCategory('Redis', c3, '数据结构、持久化、集群', '🔴', 2);
    this.addCategory('PostgreSQL', c3, '高级特性、扩展', '🐘', 3);
    this.addCategory('MongoDB', c3, '文档模型、聚合', '🍃', 4);
    this.addCategory('Elasticsearch', c3, '全文搜索、聚合', '🔍', 5);
    this.addCategory('SQL基础', c3, 'SQL语法、查询优化', '📋', 6);
    this.addCategory('数据库设计与调优', c3, '范式、ER图', '📐', 7);
    this.addCategory('ClickHouse', c3, '列式存储、OLAP', '🟢', 8);

    const c4 = this.addCategory('操作系统与系统运维', 0, 'Linux、Shell、系统管理', '🖥️', 4, '1980s-2000s');
    this.addCategory('Linux操作系统', c4, '命令、权限、进程', '🐧', 1);
    this.addCategory('Shell脚本', c4, 'Bash、AWK、Sed', '📜', 2);
    this.addCategory('系统调优', c4, '性能分析、内核参数', '⚡', 3);

    const c5 = this.addCategory('计算机网络与协议', 0, 'TCP/IP、HTTP、DNS等协议', '🌐', 5, '1970s-1990s');
    this.addCategory('TCP/IP协议', c5, 'TCP三次握手、拥塞控制', '🔗', 1);
    this.addCategory('HTTP与HTTPS', c5, 'HTTP1.1/2/3、HTTPS', '📨', 2);
    this.addCategory('DNS原理', c5, '域名解析、DNS缓存', '📖', 3);
    this.addCategory('网络安全基础', c5, '加密、防火墙', '🔒', 4);

    const c6 = this.addCategory('Web前端开发', 0, 'HTML/CSS/JS及前端框架', '🎨', 6, '1990s-至今');
    this.addCategory('HTML与CSS', c6, '语义化、布局、动画', '📄', 1);
    this.addCategory('Vue.js', c6, 'Vue2/3、响应式、组合式API', '💚', 2);
    this.addCategory('React', c6, 'Hooks、状态管理', '⚛️', 3);
    this.addCategory('前端工程化', c6, 'Webpack、Vite', '🔨', 4);
    this.addCategory('浏览器原理', c6, '渲染引擎、V8', '🌍', 5);
    this.addCategory('前端性能优化', c6, '加载优化、渲染优化', '⚡', 6);

    const c7 = this.addCategory('后端开发与服务端框架', 0, 'Spring Boot、Django、Node.js等', '⚙️', 7, '1990s-至今');
    this.addCategory('Spring Boot', c7, '自动配置、IoC、AOP', '🍃', 1);
    this.addCategory('Spring Cloud', c7, '微服务、注册中心', '☁️', 2);
    this.addCategory('JVM调优', c7, '内存模型、GC调优', '🔧', 3);
    this.addCategory('Django', c7, 'ORM、中间件', '🎸', 4);
    this.addCategory('FastAPI', c7, '异步、Pydantic', '⚡', 5);
    this.addCategory('Node.js', c7, '事件循环、Express', '🟢', 6);
    this.addCategory('API设计', c7, 'RESTful、GraphQL', '🔌', 7);

    const c8 = this.addCategory('软件工程与设计模式', 0, '设计模式、架构、版本控制', '📐', 8, '1980s-2000s');
    this.addCategory('设计模式', c8, '23种设计模式及应用', '🧩', 1);
    this.addCategory('Git版本控制', c8, '分支管理、工作流', '🔀', 2);
    this.addCategory('软件架构', c8, '分层架构、DDD', '🏗️', 3);
    this.addCategory('敏捷开发', c8, 'Scrum、Kanban', '🏃', 4);
    this.addCategory('代码规范与重构', c8, 'Clean Code', '✨', 5);

    const c9 = this.addCategory('软件测试', 0, '功能测试、自动化测试、性能测试', '🧪', 9, '1980s-至今');
    this.addCategory('测试理论基础', c9, '测试策略、用例设计', '📋', 1);
    this.addCategory('自动化测试', c9, 'Selenium、Playwright', '🤖', 2);
    this.addCategory('性能测试', c9, 'JMeter、压测', '📊', 3);
    this.addCategory('接口测试', c9, 'Postman', '🔌', 4);

    const c10 = this.addCategory('分布式系统与微服务', 0, '分布式理论、消息队列、服务治理', '🌐', 10, '2000s-至今');
    this.addCategory('分布式理论', c10, 'CAP、BASE、一致性算法', '📚', 1);
    this.addCategory('消息队列Kafka', c10, '生产者、消费者、分区', '📨', 2);
    this.addCategory('消息队列RabbitMQ', c10, '交换机、队列、路由', '🐰', 3);
    this.addCategory('微服务架构', c10, '服务拆分、通信、治理', '🧩', 4);
    this.addCategory('分布式缓存', c10, '缓存策略、穿透', '⚡', 5);
    this.addCategory('分布式锁', c10, 'Redis锁、ZooKeeper锁', '🔒', 6);
    this.addCategory('服务注册与发现', c10, 'Nacos、Eureka', '📍', 7);

    const c11 = this.addCategory('云原生与DevOps', 0, 'Docker、Kubernetes、CI/CD', '☁️', 11, '2013-至今');
    this.addCategory('Docker', c11, '镜像、容器、Compose', '🐳', 1);
    this.addCategory('Kubernetes', c11, 'Pod、Service、Deployment', '☸️', 2);
    this.addCategory('CI/CD', c11, 'Jenkins、GitHub Actions', '🔄', 3);
    this.addCategory('监控与日志', c11, 'Prometheus、Grafana、ELK', '📊', 4);
    this.addCategory('基础设施即代码', c11, 'Terraform、Ansible', '🏗️', 5);

    const c12 = this.addCategory('大数据与数据工程', 0, 'Hadoop、Spark、Flink、数仓', '📊', 12, '2010s-至今');
    this.addCategory('Hadoop生态', c12, 'HDFS、MapReduce、YARN', '🐘', 1);
    this.addCategory('Spark', c12, 'RDD、DataFrame、Streaming', '⚡', 2);
    this.addCategory('Flink', c12, '流处理、窗口、状态管理', '🌊', 3);
    this.addCategory('Hive', c12, 'HQL、分区、优化', '🐝', 4);
    this.addCategory('数据仓库建模', c12, '维度建模、星型模型', '🏗️', 5);
    this.addCategory('数据治理', c12, '元数据、血缘、质量', '📋', 6);

    const c13 = this.addCategory('人工智能与机器学习', 0, '机器学习、深度学习、大模型', '🤖', 13, '2012-至今');
    this.addCategory('机器学习基础', c13, '监督学习、无监督学习', '📈', 1);
    this.addCategory('深度学习', c13, 'CNN、RNN、Transformer', '🧠', 2);
    this.addCategory('自然语言处理', c13, 'NLP、BERT、GPT', '💬', 3);
    this.addCategory('计算机视觉', c13, '图像分类、目标检测', '👁️', 4);
    this.addCategory('大语言模型', c13, 'LLM、Prompt、RAG、Agent', '🤖', 5);
    this.addCategory('LangChain', c13, '链、代理、工具调用', '🔗', 6);
    this.addCategory('模型部署与MLOps', c13, '模型服务、监控', '🚀', 7);

    const c14 = this.addCategory('信息安全与网络安全', 0, 'Web安全、渗透测试、密码学', '🔒', 14, '贯穿IT始终');
    this.addCategory('Web安全', c14, 'OWASP Top 10', '🌐', 1);
    this.addCategory('渗透测试', c14, '信息收集、漏洞利用', '🎯', 2);
    this.addCategory('密码学基础', c14, '对称加密、非对称加密', '🔑', 3);
    this.addCategory('安全开发规范', c14, '安全编码、SDL', '📝', 4);
    this.addCategory('等保与合规', c14, '等级保护、GDPR', '📋', 5);

    const c15 = this.addCategory('移动端与跨平台开发', 0, 'iOS、Android、Flutter、RN', '📱', 15, '2007-至今');
    this.addCategory('iOS开发', c15, 'Swift、UIKit、SwiftUI', '🍎', 1);
    this.addCategory('Android开发', c15, 'Kotlin、Jetpack', '🤖', 2);
    this.addCategory('Flutter', c15, 'Dart、Widget', '🦋', 3);
    this.addCategory('React Native', c15, '组件、原生模块', '⚛️', 4);

    const c16 = this.addCategory('游戏开发与图形图像', 0, 'Unity、Unreal、图形学', '🎮', 16, '1980s-至今');
    this.addCategory('Unity开发', c16, 'C#、场景、物理', '🎮', 1);
    this.addCategory('图形学基础', c16, '渲染管线、着色器', '🎨', 2);

    const c17 = this.addCategory('嵌入式与物联网', 0, '嵌入式C、RTOS、IoT', '🔌', 17, '1970s-至今');
    this.addCategory('嵌入式开发', c17, 'C、Linux、RTOS', '⚙️', 1);
    this.addCategory('物联网协议', c17, 'MQTT、CoAP', '📡', 2);

    const c18 = this.addCategory('音视频与流媒体', 0, '编解码、FFmpeg、WebRTC', '🎬', 18, '2000s-至今');
    this.addCategory('音视频基础', c18, '编解码、容器', '🎥', 1);
    this.addCategory('WebRTC', c18, 'P2P、SDP', '📞', 2);

    const c19 = this.addCategory('区块链与Web3', 0, '区块链、智能合约、DeFi', '⛓️', 19, '2009-至今');
    this.addCategory('区块链基础', c19, '共识机制、加密', '⛓️', 1);
    this.addCategory('智能合约', c19, 'Solidity、EVM', '📜', 2);

    const c20 = this.addCategory('产品与项目管理', 0, '产品经理、项目管理', '📋', 20, '不限');
    this.addCategory('产品经理', c20, '需求分析、用户研究', '📱', 1);
    this.addCategory('项目管理', c20, 'PMP、Scrum、OKR', '📊', 2);

    const c21 = this.addCategory('通用面试能力与软技能', 0, '自我介绍、职业规划、沟通', '💪', 21, '不限');
    this.addCategory('面试技巧', c21, '自我介绍、薪资谈判', '🎯', 1);
    this.addCategory('职业规划', c21, '技术成长、管理路线', '🧭', 2);
    this.addCategory('团队协作', c21, '沟通、冲突处理', '🤝', 3);
  },
};