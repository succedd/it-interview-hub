/* ============================================
   IT面试题库管理系统 - 简化测试版
   ============================================ */
const { createApp, ref, reactive, computed, watch, onMounted, nextTick } = Vue;

const App = {
  setup() {
    const state = reactive({
      page: 'home', loading: false, message: '正在加载...',
      showContent: false
    });

    onMounted(async () => {
      try {
        console.log('1. Starting...');
        await nextTick();
        console.log('2. Next tick done');
        state.showContent = true;
        state.message = 'IT面试题库管理系统 - 简化版测试';
        console.log('3. Content ready!');
      } catch(e) {
        console.error('Error:', e);
      }
    });

    return { state };
  },

  template: `
    <div style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
      <h1 style="color: #2563EB; font-size: 28px;">IT面试题库管理系统</h1>
      <p v-if="!state.showContent" style="color: #64748B;">{{ state.message }}</p>
      <div v-else>
        <p style="color: #10B981; font-size: 18px;">✅ 简化版加载成功！</p>
        <p style="color: #475569;">如果看到这个页面，说明 Vue 模板渲染正常。</p>
        <hr style="margin: 20px 0; border-color: #E2E8F0;">
        <p>下一步将逐步恢复完整功能...</p>
      </div>
      <div style="margin-top: 30px; padding: 16px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
        <p style="font-size: 13px; color: #94A3B8;">状态: page={{state.page}}, loading={{state.loading}}, showContent={{state.showContent}}</p>
      </div>
    </div>
  `
};

const app = createApp(App);
app.mount('#app');
console.log('Minimal test app mounted!');