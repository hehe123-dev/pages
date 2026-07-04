// 小程序端 SPA：路由 + 各页面渲染 + 跨端交互
(function () {
  const $page = document.getElementById('page');
  const $navTitle = document.getElementById('navTitle');
  const $navBack = document.getElementById('navBack');
  const $navRight = document.getElementById('navRight');
  const $tabBar = document.getElementById('tabBar');
  const $toast = document.getElementById('toast');
  const $modalMask = document.getElementById('modalMask');
  const $modal = document.getElementById('modal');

  // 状态栏时间
  function tickClock() {
    const d = new Date();
    document.getElementById('sb-time').textContent =
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  tickClock(); setInterval(tickClock, 30000);

  // 路由
  const routes = {};
  const stack = [];
  function register(name, fn) { routes[name] = fn; }
  function go(name, params) {
    if (!routes[name]) { toast('页面不存在'); return; }
    stack.push({ name, params: params || {} });
    render();
  }
  function back() {
    if (stack.length <= 1) { reset('home'); return; }
    stack.pop();
    render();
  }
  function reset(name, params) {
    stack.length = 0;
    stack.push({ name, params: params || {} });
    render();
  }
  function render() {
    const top = stack[stack.length - 1];
    if (!top) return;

    // 登录检查：除了登录和认证相关页面，其他页面需要先登录
    const publicPages = ['login', 'ehbAuth'];
    const s = Store.get();
    if (!publicPages.includes(top.name) && !s.isLoggedIn) {
      stack.length = 0;
      stack.push({ name: 'login', params: {} });
      const newTop = stack[stack.length - 1];
      routes[newTop.name](newTop.params);
      return;
    }

    $navRight.textContent = '';
    $navRight.onclick = null;
    const isTab = ['home', 'reports', 'vas', 'aiChat', 'profile'].includes(top.name);
    $tabBar.style.display = isTab ? 'flex' : 'none';
    $navBack.style.display = isTab ? 'none' : 'flex';
    $page.scrollTop = 0;
    $page.innerHTML = '';

    // AI 聊天页面特殊处理
    if (top.name === 'aiChat') {
      $page.style.overflow = 'hidden';
      $page.style.paddingBottom = '0';
    } else {
      $page.style.overflow = 'auto';
      $page.style.paddingBottom = '20px';
    }

    routes[top.name](top.params);
    [...$tabBar.children].forEach(t => {
      t.classList.toggle('active', t.dataset.tab === top.name);
    });
    if (window.lucide) { setTimeout(() => lucide.createIcons(), 0); }
  }
  $navBack.onclick = back;
  $tabBar.addEventListener('click', (e) => {
    const t = e.target.closest('.tab');
    if (!t) return;
    reset(t.dataset.tab);
  });

  function setNav(title, right) {
    $navTitle.textContent = title;
    if (right) {
      $navRight.textContent = right.text;
      $navRight.onclick = right.onClick;
    } else {
      $navRight.textContent = '';
      $navRight.onclick = null;
    }
  }

  // Toast
  let toastTimer = null;
  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove('show'), 1600);
  }
  // Modal
  function openModal(html, title) {
    $modal.innerHTML = (title ? '<h3>' + U.escapeHtml(title) + '</h3>' : '') + html;
    $modalMask.classList.add('show');
  }
  function closeModal() { $modalMask.classList.remove('show'); }
  $modalMask.addEventListener('click', (e) => {
    if (e.target === $modalMask) closeModal();
  });

  // 数据订阅：跳过交互中的页面避免丢失状态
  Store.on((evt) => {
    const top = stack[stack.length - 1];
    const skipPages = ['aiChat', 'editInvoiceProfile', 'invoiceApply', 'security', 'about', 'profile', 'reports', 'vas', 'policy', 'home', 'orders'];
    if (top && !skipPages.includes(top.name)) { render(); }
  });

  // 辅助
  function fmtAic(n) { return Number(n).toFixed(1).replace(/\.0$/, ''); }
  function hasSvip() {
    const u = Store.get().currentUser;
    return u.svipExpireAt > Date.now();
  }

  // ==================== 登录页面 ====================
  register('login', () => {
    setNav('企业登录');
    $tabBar.style.display = 'none';
    $navBack.style.display = 'none';
    $page.style.overflow = 'hidden';

    $page.innerHTML = `
      <div style="height:100vh;min-height:100vh;display:flex;flex-direction:column;background:linear-gradient(135deg,#0d47a1 0%,#1565c0 50%,#1976d2 100%);overflow:hidden">
        <div style="flex:1;display:flex;flex-direction:column;padding:16px;overflow-y:auto;-webkit-overflow-scrolling:touch">
          <div style="text-align:center;margin-top:20px;margin-bottom:24px">
            <div style="width:64px;height:64px;margin:0 auto 12px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px)">
              <i data-lucide="building-2" style="width:32px;height:32px;color:#fff"></i>
            </div>
            <div style="font-size:24px;font-weight:700;color:#fff;margin-bottom:6px">企融通平台</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8)">科技金融智享服务</div>
          </div>

          <div class="card" style="background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);padding:16px;box-shadow:0 8px 32px rgba(0,0,0,0.1)">
            <div style="font-size:16px;font-weight:600;margin-bottom:16px;color:#333">企业信息登录</div>

            <div class="field">
              <label style="font-size:13px;color:#666;margin-bottom:4px;display:block">企业全称 <span style="color:#f56c6c">*</span></label>
              <input class="input" id="loginCompany" placeholder="请输入企业全称" style="font-size:14px;height:40px" />
            </div>

            <div class="field">
              <label style="font-size:13px;color:#666;margin-bottom:4px;display:block">统一社会信用代码 <span style="color:#f56c6c">*</span></label>
              <input class="input" id="loginCreditCode" placeholder="请输入18位统一社会信用代码" maxlength="18" style="font-size:14px;height:40px" />
            </div>

            <div class="field">
              <label style="font-size:13px;color:#666;margin-bottom:4px;display:block">联系人 <span style="color:#f56c6c">*</span></label>
              <input class="input" id="loginContact" placeholder="请输入联系人姓名" style="font-size:14px;height:40px" />
            </div>

            <div class="field">
              <label style="font-size:13px;color:#666;margin-bottom:4px;display:block">手机号 <span style="color:#f56c6c">*</span></label>
              <input class="input" id="loginPhone" type="tel" placeholder="请输入手机号" maxlength="11" style="font-size:14px;height:40px" />
            </div>

            <div style="margin-top:16px">
              <button class="btn block" id="loginBtn" style="background:linear-gradient(135deg,#1976d2 0%,#42a5f5 100%);border:none;font-size:16px;font-weight:600;height:44px">
                <i data-lucide="log-in"></i> 提交并进行鄂汇办认证
              </button>
            </div>

            <div style="margin-top:12px;text-align:center;font-size:12px;color:#999;line-height:1.5">
              <i data-lucide="shield-check" style="width:12px;height:12px;vertical-align:middle"></i>
              为保障企业信息安全，需通过鄂汇办实名认证
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('loginBtn').onclick = () => {
      const company = document.getElementById('loginCompany').value.trim();
      const creditCode = document.getElementById('loginCreditCode').value.trim();
      const contact = document.getElementById('loginContact').value.trim();
      const phone = document.getElementById('loginPhone').value.trim();

      if (!company) { toast('请输入企业全称'); return; }
      if (!creditCode) { toast('请输入统一社会信用代码'); return; }
      if (creditCode.length !== 18) { toast('统一社会信用代码应为18位'); return; }
      if (!contact) { toast('请输入联系人姓名'); return; }
      if (!phone) { toast('请输入手机号'); return; }
      if (!/^1[3-9]\d{9}$/.test(phone)) { toast('请输入有效的手机号'); return; }

      // 保存临时企业信息
      const s = Store.get();
      s.tempLoginInfo = { company, creditCode, contact, phone };
      Store.set(s);

      // 跳转到鄂汇办认证
      go('ehbAuth');
    };
  });

  // ==================== 鄂汇办认证页面 ====================
  register('ehbAuth', () => {
    setNav('鄂汇办实名认证');
    $tabBar.style.display = 'none';

    const s = Store.get();
    const info = s.tempLoginInfo || {};

    $page.innerHTML = `
      <div style="min-height:100vh;background:#f5f5f5;padding:20px">
        <div class="card" style="text-align:center;padding:24px;margin-bottom:16px">
          <div style="width:64px;height:64px;margin:0 auto 16px;background:linear-gradient(135deg,#42a5f5 0%,#478ed1 100%);border-radius:50%;display:flex;align-items:center;justify-content:center">
            <i data-lucide="shield-check" style="width:32px;height:32px;color:#fff"></i>
          </div>
          <div style="font-size:20px;font-weight:600;margin-bottom:8px;color:#333">鄂汇办实名认证</div>
          <div style="font-size:13px;color:#666;line-height:1.6">为保障平台安全，请完成实名认证</div>
        </div>

        <div class="card" style="margin-bottom:16px">
          <div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#333">企业信息</div>
          <div class="kv" style="margin-bottom:8px">
            <div class="k">企业名称</div>
            <div class="v">${U.escapeHtml(info.company || '')}</div>
          </div>
          <div class="kv" style="margin-bottom:8px">
            <div class="k">信用代码</div>
            <div class="v">${U.escapeHtml(info.creditCode || '')}</div>
          </div>
          <div class="kv" style="margin-bottom:8px">
            <div class="k">联系人</div>
            <div class="v">${U.escapeHtml(info.contact || '')}</div>
          </div>
          <div class="kv">
            <div class="k">手机号</div>
            <div class="v">${U.escapeHtml(info.phone || '')}</div>
          </div>
        </div>

        <div class="card" style="margin-bottom:16px;background:#e3f2fd;border:1px solid #90caf9">
          <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#1976d2">
            <i data-lucide="info" style="width:16px;height:16px;vertical-align:middle"></i> 认证说明
          </div>
          <div style="font-size:12px;color:#666;line-height:1.8">
            1. 本平台接入湖北省政务服务平台"鄂汇办"认证体系<br>
            2. 认证过程安全加密，信息仅用于身份核验<br>
            3. 认证成功后即可使用平台全部功能<br>
            4. 如认证失败，请检查企业信息是否准确
          </div>
        </div>

        <div id="authSteps" style="display:none">
          <div class="card" style="margin-bottom:16px">
            <div style="font-size:14px;font-weight:600;margin-bottom:12px;color:#333">认证进度</div>
            <div id="authProgress"></div>
          </div>
        </div>

        <div style="padding:0 4px">
          <button class="btn block" id="startAuthBtn" style="background:linear-gradient(135deg,#42a5f5 0%,#478ed1 100%);border:none;font-size:16px;font-weight:600;height:48px">
            <i data-lucide="shield-check"></i> 开始鄂汇办认证
          </button>
        </div>
      </div>
    `;

    document.getElementById('startAuthBtn').onclick = () => {
      simulateEhbAuth(info);
    };
  });

  // 模拟鄂汇办认证流程
  function simulateEhbAuth(info) {
    const $btn = document.getElementById('startAuthBtn');
    const $steps = document.getElementById('authSteps');
    const $progress = document.getElementById('authProgress');

    $btn.disabled = true;
    $btn.innerHTML = '<i data-lucide="loader" style="animation:spin 1s linear infinite"></i> 认证中...';
    $steps.style.display = 'block';

    const steps = [
      { text: '正在连接鄂汇办认证服务器...', delay: 800 },
      { text: '正在核验企业工商信息...', delay: 1200 },
      { text: '正在验证统一社会信用代码...', delay: 1000 },
      { text: '正在核验联系人身份信息...', delay: 1200 },
      { text: '正在完成最终认证...', delay: 800 }
    ];

    let currentStep = 0;

    function showStep() {
      if (currentStep >= steps.length) {
        // 认证成功
        completeAuth(info);
        return;
      }

      const step = steps[currentStep];
      const stepHtml = `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f9f9f9;border-radius:8px;margin-bottom:8px">
          <div style="width:24px;height:24px;border-radius:50%;background:#42a5f5;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            ${currentStep < steps.length - 1
              ? '<i data-lucide="loader" style="width:14px;height:14px;color:#fff;animation:spin 1s linear infinite"></i>'
              : '<i data-lucide="check" style="width:14px;height:14px;color:#fff"></i>'
            }
          </div>
          <div style="font-size:13px;color:#333;flex:1">${step.text}</div>
        </div>
      `;

      $progress.innerHTML += stepHtml;
      if (window.lucide) lucide.createIcons();

      currentStep++;
      setTimeout(showStep, step.delay);
    }

    showStep();
  }

  function completeAuth(info) {
    const s = Store.get();
    const now = Date.now();
    const userId = Store.uid('U');

    // 创建用户
    s.currentUser = {
      id: userId,
      phone: info.phone,
      company: info.company,
      creditCode: info.creditCode,
      contact: info.contact,
      authStatus: 'verified',
      authMaterials: [],
      authNote: '通过鄂汇办认证',
      registerAt: now,
      vipLevel: 'none',
      vipExpireAt: 0,
      svipExpireAt: 0,
      aicBalance: 0,
      aicTotalRecharged: 0,
      aicTotalConsumed: 0,
      aicTotalRefunded: 0,
    };

    // 添加到用户列表
    s.users.push({
      id: userId,
      phone: info.phone,
      company: info.company,
      registerAt: now,
      authStatus: 'verified',
      orderCount: 0,
      role: 'normal',
      vipLevel: 'none',
      vipExpireAt: 0,
      svipExpireAt: 0,
      aicBalance: 0,
      aicTotalRecharged: 0,
      aicTotalConsumed: 0,
      aicTotalRefunded: 0,
    });

    // 设置登录状态
    s.isLoggedIn = true;
    s.ehbAuthToken = 'EHB_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    s.ehbAuthTime = now;

    // 清除临时信息
    delete s.tempLoginInfo;

    Store.log('用户注册并认证', `${info.company} 通过鄂汇办认证`, 'system');
    Store.set(s);

    // 显示成功提示
    const $progress = document.getElementById('authProgress');
    $progress.innerHTML += `
      <div style="margin-top:16px;padding:16px;background:#e8f5e9;border:1px solid #81c784;border-radius:8px;text-align:center">
        <i data-lucide="check-circle" style="width:48px;height:48px;color:#4caf50;margin-bottom:8px"></i>
        <div style="font-size:16px;font-weight:600;color:#2e7d32;margin-bottom:4px">认证成功！</div>
        <div style="font-size:12px;color:#666">欢迎使用企融通平台</div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    const $btn = document.getElementById('startAuthBtn');
    $btn.innerHTML = '<i data-lucide="arrow-right"></i> 进入平台';
    $btn.disabled = false;
    $btn.style.background = 'linear-gradient(135deg,#4caf50 0%,#66bb6a 100%)';
    $btn.onclick = () => {
      toast('认证成功，欢迎使用！');
      reset('home');
    };
  }

  // ==================== 首页 ====================
  register('home', () => {
    setNav('企融通平台');
    $page.style.overflow = '';
    const s = Store.get();
    const ann = s.announcements.filter(a => a.status === 'on').sort((a, b) => b.publishAt - a.publishAt)[0];
    const colors = ['#1976d2','#388e3c','#f57c00','#7b1fa2','#c62828','#00796b','#f9a825','#5d4037','#455a64','#ad1457'];

    $page.innerHTML = `
      <div id="heroBanner" style="margin:12px 12px 0;border-radius:16px;background:#1976d2;height:170px;display:flex;flex-direction:column;justify-content:center;padding:0 20px;color:white;">
        <div style="font-size:28px;font-weight:700;">科技金融</div>
        <div style="font-size:28px;font-weight:700;color:#64b5f6;">智享服务</div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <span style="padding:4px 10px;background:rgba(255,255,255,0.2);border-radius:12px;font-size:12px;">AI赋能</span>
          <span style="padding:4px 10px;background:rgba(255,255,255,0.2);border-radius:12px;font-size:12px;">安全可靠</span>
          <span style="padding:4px 10px;background:rgba(255,255,255,0.2);border-radius:12px;font-size:12px;">急速服务</span>
        </div>
      </div>

      <div class="search-bar" style="margin-top:12px">
        <i data-lucide="search" style="width:16px;height:16px;color:#888"></i>
        <input id="homeSearch" placeholder="搜索企业名称 / 统一社会信用代码" />
      </div>

      <div class="quick-tools">
        <div class="tool-item" data-go="reports">
          <div class="tool-icon blue"><i data-lucide="file-text"></i></div>
          <div class="tool-label">企业报告</div>
        </div>
        <div class="tool-item" data-go="vas">
          <div class="tool-icon green"><i data-lucide="wrench"></i></div>
          <div class="tool-label">增值服务</div>
        </div>
        <div class="tool-item" data-go="policy">
          <div class="tool-icon orange"><i data-lucide="landmark"></i></div>
          <div class="tool-label">政策专区</div>
        </div>
        <div class="tool-item" data-go="aiChat">
          <div class="tool-icon purple"><i data-lucide="bot"></i></div>
          <div class="tool-label">AI助手</div>
        </div>
      </div>

      ${ann ? '<div class="banner"><div class="t"><i data-lucide="megaphone" style="width:14px;height:14px;vertical-align:middle"></i> 平台公告</div><div>' + U.escapeHtml(ann.title) + '</div></div>' : ''}

      <div class="section-head">热门报告 <span class="more" data-go="reports">全部 &rsaquo;</span></div>
      <div style="padding:0 12px">
        ${s.reports.filter(r => r.status === 'on').slice(0, 3).map(r => {
          const minAic = Math.min(...(r.tiers || []).map(t => t.aic));
          return '<div class="rpt-card" data-rid="' + r.id + '"><div class="rpt-top"><span class="rpt-avatar" style="background:' + colors[s.reports.indexOf(r) % colors.length] + '"><i data-lucide="' + (r.icon || 'file-text') + '" style="width:20px;height:20px;color:#fff"></i></span><div class="rpt-name-box"><p class="rpt-name p-ellipsis">' + U.escapeHtml(r.name) + '</p><p class="rpt-tags p-ellipsis"><span>' + U.escapeHtml(r.cate) + '</span></p></div><div class="rpt-buy-btn" data-rid="' + r.id + '">' + minAic + ' AIC 起</div></div><div class="rpt-body"><p class="rpt-desc p-ellipsis-2">' + U.escapeHtml(r.desc) + '</p></div><div class="rpt-bottom"><span class="rpt-bottom-item"><i data-lucide="layers"></i>' + (r.tiers || []).length + ' 档</span><span class="rpt-bottom-item"><i data-lucide="zap"></i>异步推送</span></div></div>';
        }).join('')}
      </div>

      <div class="card" style="padding:0;margin-bottom:0">
        <div class="section-head" style="margin:0;padding:14px 12px 0;border-bottom:none"><span>最新政策</span><span class="more" data-go="policy">全部 &rsaquo;</span></div>
        <div style="padding:12px 12px 0">
          <div class="plc-search-bar" style="margin:0"><i data-lucide="search" style="width:14px;height:14px;color:#999"></i><input class="plc-search-input" id="homePolicySearch" placeholder="搜索政策标题" /></div>
        </div>
        <div id="homePolicyRgs"></div>
        <div style="height:4px"></div>
        <div id="homePolicyCts"></div>
        <div style="padding:0 12px;margin-top:4px" id="homePolicyList"></div>
      </div>
      <div style="height:30px"></div>
    `;

    // 事件绑定
    $page.querySelectorAll('[data-go]').forEach(el =>
      el.addEventListener('click', () => reset(el.dataset.go))
    );
    $page.querySelectorAll('[data-rid]').forEach(el =>
      el.addEventListener('click', (e) => {
        if (e.target.closest('.rpt-buy-btn')) return;
        go('reportDetail', { id: el.dataset.rid });
      })
    );
    $page.querySelectorAll('.rpt-buy-btn').forEach(el =>
      el.addEventListener('click', (e) => { e.stopPropagation(); go('reportDetail', { id: el.dataset.rid }); })
    );
    $page.querySelectorAll('[data-pid]').forEach(el =>
      el.addEventListener('click', () => go('policyDetail', { id: el.dataset.pid }))
    );
    $page.querySelectorAll('.tool-item').forEach(el => {
      const target = el.dataset.go;
      el.onclick = () => {
        if (['reports', 'vas', 'aiChat', 'profile'].includes(target)) reset(target);
        else go(target);
      };
    });
    const $hs = document.getElementById('homeSearch');
    if ($hs) $hs.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && $hs.value.trim()) go('enterpriseQuery', { q: $hs.value.trim() });
    });

    // 政策模块逻辑
    let hpRegion = '全部'; let hpCate = '全部';
    let hpRegionOpen = false; let hpCateOpen = false;
    const hpRegions = ['全部', '全国', '湖北'];
    const hpCates = ['全部', ...Array.from(new Set(s.policies.map(p => p.cate)))];

    const hpDraw = () => {
      const list = s.policies.filter(p => p.status === 'on' && (hpRegion === '全部' || p.region === hpRegion) && (hpCate === '全部' || p.cate === hpCate));
      const $l = document.getElementById('homePolicyList');
      $l.innerHTML = list.length ? list.map((p, idx) => '<div class="plc-item" data-pid="' + p.id + '"><div class="plc-dot-line"><div class="plc-dot' + (idx === 0 ? ' active' : '') + '"></div>' + (idx < list.length - 1 ? '<div class="plc-line"></div>' : '') + '</div><div class="plc-card" data-pid="' + p.id + '"><div class="plc-card-title double-line-ellipsis">' + U.escapeHtml(p.title) + '</div><div class="plc-card-meta"><span class="tag">' + p.region + '</span><span class="tag gray">' + p.cate + '</span><span class="plc-card-date">' + U.fmtDate(p.publishAt, false) + '</span></div></div></div>').join('') : '<div class="empty">暂无符合条件的政策</div>';
      $l.querySelectorAll('[data-pid]').forEach(el => el.addEventListener('click', () => go('policyDetail', { id: el.dataset.pid })));
    };

    const hpRenderFilters = () => {
      const $rgs = document.getElementById('homePolicyRgs');
      const $cts = document.getElementById('homePolicyCts');

      $rgs.innerHTML = '<div style="display:flex;align-items:center;gap:6px;padding:0 12px 6px;cursor:pointer" id="hpRgsToggle"><span style="font-size:12px;color:#333;font-weight:500">地区：</span><span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;background:#e3f2fd;color:#1976d2" id="hpRgsLabel">' + hpRegion + '</span><i data-lucide="' + (hpRegionOpen ? 'chevron-up' : 'chevron-down') + '" style="width:14px;height:14px;color:#999;margin-left:2px"></i></div><div style="display:' + (hpRegionOpen ? 'flex' : 'none') + ';gap:6px;padding:0 12px 4px;flex-wrap:wrap;overflow:hidden" id="hpRgsList">' + hpRegions.map(r => '<span style="display:inline-block;padding:4px 12px;border-radius:16px;font-size:12px;cursor:pointer;white-space:nowrap' + (r === hpRegion ? ';background:#1976d2;color:#fff;font-weight:600' : ';color:#666;border:1px solid #e0e0e0') + '" data-r="' + r + '">' + r + '</span>').join('') + '</div>';

      $cts.innerHTML = '<div style="display:flex;align-items:center;gap:6px;padding:0 12px 6px;cursor:pointer" id="hpCtsToggle"><span style="font-size:12px;color:#333;font-weight:500">分类：</span><span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;background:#e3f2fd;color:#1976d2" id="hpCtsLabel">' + hpCate + '</span><i data-lucide="' + (hpCateOpen ? 'chevron-up' : 'chevron-down') + '" style="width:14px;height:14px;color:#999;margin-left:2px"></i></div><div style="display:' + (hpCateOpen ? 'flex' : 'none') + ';gap:6px;padding:0 12px 4px;flex-wrap:wrap;overflow:hidden" id="hpCtsList">' + hpCates.map(c => '<span style="display:inline-block;padding:4px 12px;border-radius:16px;font-size:12px;cursor:pointer;white-space:nowrap' + (c === hpCate ? ';background:#1976d2;color:#fff;font-weight:600' : ';color:#666;border:1px solid #e0e0e0') + '" data-c="' + c + '">' + c + '</span>').join('') + '</div>';

      document.getElementById('hpRgsToggle').onclick = () => { hpRegionOpen = !hpRegionOpen; hpRenderFilters(); };
      document.getElementById('hpCtsToggle').onclick = () => { hpCateOpen = !hpCateOpen; hpRenderFilters(); };
      document.getElementById('hpRgsList').addEventListener('click', (e) => {
        const el = e.target.closest('[data-r]'); if (!el) return;
        hpRegion = el.dataset.r; hpRegionOpen = false; hpRenderFilters(); hpDraw();
      });
      document.getElementById('hpCtsList').addEventListener('click', (e) => {
        const el = e.target.closest('[data-c]'); if (!el) return;
        hpCate = el.dataset.c; hpCateOpen = false; hpRenderFilters(); hpDraw();
      });

      if (window.lucide) setTimeout(() => lucide.createIcons(), 0);
    };

    hpRenderFilters();
    hpDraw();
    const $hps = document.getElementById('homePolicySearch');
    if ($hps) $hps.addEventListener('input', (e) => {
      const kw = e.target.value.trim().toLowerCase();
      const $l = document.getElementById('homePolicyList');
      const list = s.policies.filter(p => p.status === 'on' && (hpRegion === '全部' || p.region === hpRegion) && (hpCate === '全部' || p.cate === hpCate) && (kw === '' || p.title.toLowerCase().includes(kw)));
      $l.innerHTML = list.length ? list.map((p, idx) => '<div class="plc-item" data-pid="' + p.id + '"><div class="plc-dot-line"><div class="plc-dot' + (idx === 0 ? ' active' : '') + '"></div>' + (idx < list.length - 1 ? '<div class="plc-line"></div>' : '') + '</div><div class="plc-card" data-pid="' + p.id + '"><div class="plc-card-title double-line-ellipsis">' + U.escapeHtml(p.title) + '</div><div class="plc-card-meta"><span class="tag">' + p.region + '</span><span class="tag gray">' + p.cate + '</span><span class="plc-card-date">' + U.fmtDate(p.publishAt, false) + '</span></div></div></div>').join('') : '<div class="empty">暂无符合条件的政策</div>';
      $l.querySelectorAll('[data-pid]').forEach(el => el.addEventListener('click', () => go('policyDetail', { id: el.dataset.pid })));
    });
  });

  // ==================== 报告库 ====================
  register('reports', () => {
    setNav('企业报告库');
    $page.style.overflow = '';
    $page.style.paddingBottom = '';
    const allReports = Store.get().reports.filter(r => r.status === 'on');
    const colors = ['#1976d2','#388e3c','#f57c00','#7b1fa2','#c62828','#00796b','#f9a825','#5d4037','#455a64','#ad1457'];

    const draw = (filtered) => {
      const reports = filtered || allReports;
      const $l = document.getElementById('rList');
      if (!$l) return;
      $l.innerHTML = reports.length ? reports.map(r => {
        const minAic = Math.min(...(r.tiers || []).map(t => t.aic));
        return '<div class="rpt-card" data-rid="' + r.id + '"><div class="rpt-top"><span class="rpt-avatar" style="background:' + colors[allReports.indexOf(r) % colors.length] + '"><i data-lucide="' + (r.icon || 'file-text') + '" style="width:20px;height:20px;color:#fff"></i></span><div class="rpt-name-box"><p class="rpt-name p-ellipsis">' + U.escapeHtml(r.name) + '</p><p class="rpt-tags p-ellipsis"><span>' + U.escapeHtml(r.cate) + '</span></p></div><div class="rpt-buy-btn" data-rid="' + r.id + '">' + minAic + ' AIC 起</div></div><div class="rpt-body"><p class="rpt-desc p-ellipsis-2">' + U.escapeHtml(r.desc) + '</p></div><div class="rpt-bottom"><span class="rpt-bottom-item"><i data-lucide="layers"></i>' + (r.tiers || []).length + ' 档可选</span><span class="rpt-bottom-item"><i data-lucide="zap"></i>异步推送</span></div></div>';
      }).join('') : '<div class="empty">暂无匹配报告</div>';
      $l.querySelectorAll('[data-rid]').forEach(el =>
        el.addEventListener('click', () => go('reportDetail', { id: el.dataset.rid }))
      );
    };

    $page.innerHTML = '<div class="search-bar"><i data-lucide="search" style="width:16px;height:16px;color:#888"></i><input id="rSearch" placeholder="搜索报告名称" /></div><div style="padding:0 12px" id="rList"></div>';
    draw();
    const $s = document.getElementById('rSearch');
    $s.addEventListener('input', U.debounce(() => {
      const q = $s.value.trim().toLowerCase();
      if (!q) { draw(); return; }
      const filtered = allReports.filter(r => r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q));
      draw(filtered);
    }, 200));
  });

  // ==================== 报告详情 + 下单 ====================
  register('reportDetail', ({ id }) => {
    setNav('报告详情');
    const r = Store.get().reports.find(x => x.id === id);
    if (!r) { $page.innerHTML = '<div class="empty">报告不存在</div>'; return; }
    const colors = ['#1976d2','#388e3c','#f57c00','#7b1fa2','#c62828','#00796b','#f9a825','#5d4037','#455a64','#ad1457'];
    const colorIdx = Store.get().reports.indexOf(r);
    const tiers = r.tiers || [];
    let pickedTier = tiers[0]?.id || '';

    const render2 = () => {
      const tier = tiers.find(t => t.id === pickedTier);
      $page.innerHTML = `
        <div class="rpt-detail-hero">
          <span class="rpt-detail-avatar" style="background:${colors[colorIdx % colors.length]}"><i data-lucide="${r.icon || 'file-text'}" style="width:28px;height:28px;color:#fff"></i></span>
          <p class="rpt-detail-name">${U.escapeHtml(r.name)}</p>
          <p class="rpt-detail-tags"><span>${U.escapeHtml(r.cate)}</span><span style="background:#fff3e0;color:#e65100"><i data-lucide="layers" style="width:11px;height:11px;vertical-align:middle"></i> ${tiers.length} 档可选</span></p>
        </div>
        <div class="rpt-detail-body">
          <p class="rpt-detail-desc">${U.escapeHtml(r.desc)}</p>
          <div class="rpt-detail-specs">
            ${tiers.map((t, i) => `
              <div class="rpt-spec ${pickedTier === t.id ? 'active' : ''}" data-tier="${t.id}">
                ${i === tiers.length - 1 ? '<div class="rpt-spec-rec">深度+策略</div>' : (i === 1 ? '<div class="rpt-spec-rec">推荐</div>' : '')}
                <div class="rpt-spec-lab">${U.escapeHtml(t.name)}</div>
                <div style="font-size:10px;color:#999;margin-top:2px">${U.escapeHtml(t.eta)}</div>
                <div style="font-size:10px;color:#777;margin-top:4px">${U.escapeHtml(t.desc)}</div>
              </div>
            `).join('')}
          </div>
          ${(r.fields || []).map(f => `
            <div class="rpt-detail-field">
              <label>${U.escapeHtml(f.label)}${f.required ? ' <span style="color:#f56c6c">*</span>' : ''}</label>
              <input class="input" id="f_${f.key}" placeholder="${U.escapeHtml(f.placeholder || '')}" />
            </div>
          `).join('')}
        </div>
        <div class="bottom-bar">
          <div style="flex:1">已选：<b>${U.escapeHtml(tier?.name || '')}</b> · ${U.escapeHtml(tier?.eta || '')}</div>
          <button class="btn" id="orderBtn"><i data-lucide="shopping-cart"></i>立即下单</button>
        </div>
      `;
      $page.querySelectorAll('[data-tier]').forEach(el =>
        el.addEventListener('click', () => { pickedTier = el.dataset.tier; render2(); })
      );
      document.getElementById('orderBtn').onclick = () => {
        const inputs = {};
        let missing = false;
        (r.fields || []).forEach(f => {
          const v = document.getElementById('f_' + f.key).value.trim();
          inputs[f.key] = v;
          if (f.required && !v) { missing = true; toast('请填写' + f.label); }
        });
        if (missing) return;
        placeReportOrder(r, pickedTier, inputs);
      };
    };
    render2();
  });

  function placeReportOrder(r, tierId, inputs) {
    var s = Store.get();
    var u = s.currentUser;
    var tier = r.tiers.find(function(t) { return t.id === tierId; });
    var aicCost = (tier && tier.aic) || 0;
    var orderId = Store.uid("O");
    var contractId = Store.uid("CT");
    var now = Date.now();
    if (aicCost > 0 && u.aicBalance < aicCost) {
      toast('AIC余额不足，请先充值');
      return;
    }
    var order = {
      id: orderId, type: "report", refId: r.id, refName: r.name,
      tierId: tierId, tierName: (tier && tier.name) || "", aicCost: aicCost, amount: aicCost,
      payStatus: "pending", status: "processing", userId: u.id, user: u.company,
      createdAt: now, paidAt: null,
      tradeNo: "AIC" + Date.now(), payMethod: "AIC 余额",
      contractId: contractId, invoiceId: null, note: (tier && tier.name) || "",
      reportStatus: "generating", reportFile: null,
      target: inputs.target || inputs.industry || "",
      inputs: inputs,
    };
    s.orders.unshift(order);
    var tpl = s.contractTemplates.find(function(t) { return t.forType === "report"; });
    if (tpl) s.contracts.unshift({ id: contractId, orderId: orderId, templateId: tpl.id, userId: u.id, user: u.company, signedAt: now, sealed: true });
    s.purchasedReports.unshift({
      id: Store.uid("PR"), orderId: orderId, reportId: r.id, reportName: r.name,
      tierId: tierId, tierName: (tier && tier.name) || "", target: order.target, inputs: inputs, aicCost: 0,
      purchasedAt: now, userId: u.id, reportStatus: "generating",
    });
    Store.log("用户下单", "订单 " + orderId + " - " + r.name + "(" + ((tier && tier.name) || "") + ")", u.company);
    Store.set(s);
    toast("下单成功！报告生成中...");
    setTimeout(function() { reset("home"); }, 800);
    setTimeout(function() { completeReportGeneration(orderId, aicCost); }, 5000);
  }

  function completeReportGeneration(orderId, aicCost) {
    var s = Store.get();
    var order = s.orders.find(function(o) { return o.id === orderId; });
    if (!order || order.reportStatus === 'ready') return;
    var u = s.currentUser;
    var now = Date.now();
    if (aicCost > 0) {
      u.aicBalance -= aicCost;
      u.aicTotalConsumed += aicCost;
      if ((u.aicTotalRecharged > 0 && !u.vipLevel) || u.vipLevel === "none") u.vipLevel = "vip";
      var u2 = s.users.find(function(x) { return x.id === u.id; });
      if (u2) { u2.aicBalance = u.aicBalance; u2.aicTotalConsumed = u.aicTotalConsumed; u2.vipLevel = u.vipLevel; }
      s.aicConsumptions.unshift({
        id: Store.uid("AC"), userId: u.id, user: u.company, refType: "report", refId: order.refId, refName: order.refName,
        tokens: aicCost * 1000, aicCost: aicCost, createdAt: now,
      });
    }
    order.reportStatus = "ready";
    order.reportFile = order.refName + '_' + order.target + '.pdf';
    order.payStatus = "paid";
    order.status = "completed";
    order.paidAt = now;
    var pr = s.purchasedReports.find(function(p) { return p.orderId === orderId; });
    if (pr) {
      pr.reportStatus = "ready";
      pr.aicCost = aicCost;
      pr.readyAt = now;
    }
    s.generatedReports.unshift({
      id: Store.uid("GR"), orderId: orderId, reportId: order.refId,
      title: order.refName + ' - ' + order.target,
      summary: '本报告基于公开工商数据、司法数据、招投标数据、舆情数据，由 AI 大模型综合分析输出。',
      generatedAt: now,
    });
    Store.log("报告生成完成", "订单 " + orderId + " 报告已生成", u.company);
    Store.set(s);
  }

  // ==================== 增值服务 ====================
  register('vas', () => {
    setNav('第三方增值服务');
    $page.style.overflow = '';
    $page.style.paddingBottom = '';
    const s = Store.get();
    const svip = hasSvip();
    const rateLabel = s.aicConfig?.unitLabel || '1 AIC / 1000 token';

    if (!svip) {
      // 非 SVIP 用户显示开通引导 - 统一深紫黑配金色风格
      $page.innerHTML = `
        <div class="card" style="margin:12px;background:linear-gradient(135deg,#1A0F2E 0%,#2D1B3D 50%,#1A0F2E 100%);color:#FFF;padding:24px 18px;box-shadow:0 8px 24px rgba(212,175,55,0.3);border:2px solid rgba(212,175,55,0.3);text-align:center">
          <i data-lucide="crown" style="width:48px;height:48px;color:#D4AF37;filter:drop-shadow(0 0 12px rgba(212,175,55,0.8));margin-bottom:16px;display:inline-block"></i>
          <div style="font-size:16px;font-weight:700;margin-bottom:10px;color:#D4AF37;letter-spacing:0.5px">第三方增值服务为 SVIP 专属</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.8);line-height:1.6;margin-bottom:18px">开通 SVIP 尊享版后，即可免费使用全部第三方增值服务</div>
          <button class="btn block" id="goSvipPlans" style="background:linear-gradient(135deg,#D4AF37 0%,#F4E4C1 50%,#D4AF37 100%);color:#1A0F2E;border:none;box-shadow:0 4px 16px rgba(212,175,55,0.5);font-weight:700;cursor:pointer"><i data-lucide="crown"></i>立即开通 SVIP</button>
        </div>

        <div class="section-head">SVIP 专属服务列表</div>
        <div style="padding:0 12px">
          ${s.vasServices.filter(v => v.status === 'on').map(v => {
            return '<div class="card" style="margin-bottom:10px;opacity:0.5;position:relative"><div style="position:absolute;top:8px;right:8px"><span class="tag" style="background:#2A1F3D;color:#D4AF37;border:1px solid rgba(212,175,55,0.3)"><i data-lucide="crown" style="width:10px;height:10px;vertical-align:middle"></i> SVIP</span></div><div class="title" style="padding-right:70px">' + U.escapeHtml(v.name) + '</div><div class="desc" style="margin-top:6px">' + U.escapeHtml(v.desc) + '</div><div style="margin-top:8px;font-size:11px;color:#888"><i data-lucide="building-2" style="width:12px;height:12px;vertical-align:middle"></i> ' + U.escapeHtml(v.vendor) + '</div></div>';
          }).join('')}
        </div>
      `;
      document.getElementById('goSvipPlans').onclick = () => go('svipPlans');
    } else {
      // SVIP 用户正常显示 - 统一金色标签风格
      $page.innerHTML = `
        <div class="card" style="margin:12px;background:linear-gradient(135deg,#1A0F2E 0%,#2D1B3D 50%,#1A0F2E 100%);color:#FFF;padding:14px 16px;box-shadow:0 4px 16px rgba(212,175,55,0.25);border:1px solid rgba(212,175,55,0.2)">
          <div style="display:flex;align-items:center;gap:8px">
            <i data-lucide="crown" style="width:18px;height:18px;color:#D4AF37;filter:drop-shadow(0 0 6px rgba(212,175,55,0.6));flex-shrink:0"></i>
            <span style="font-size:14px;font-weight:700;color:#D4AF37">SVIP 尊享：以下全部增值服务免费订购</span>
          </div>
        </div>
        <div style="padding:0 12px">
          ${s.vasServices.filter(v => v.status === 'on').map(v => {
            const tokenMin = (v.estTokenMin || 150000) / 10000;
            const tokenMax = (v.estTokenMax || 300000) / 10000;
            return '<div class="card" data-vid="' + v.id + '" style="margin-bottom:10px;cursor:pointer;transition:all 200ms"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div class="title" style="flex:1;min-width:0">' + U.escapeHtml(v.name) + '</div><span class="tag" style="background:#2A1F3D;color:#D4AF37;border:1px solid rgba(212,175,55,0.3);flex-shrink:0;margin-left:8px"><i data-lucide="crown" style="width:10px;height:10px;vertical-align:middle"></i> SVIP</span></div><div class="desc" style="margin-top:6px">' + U.escapeHtml(v.desc) + '</div><div style="margin-top:8px;font-size:11px;color:#888"><i data-lucide="building-2" style="width:12px;height:12px;vertical-align:middle"></i> ' + U.escapeHtml(v.vendor) + '</div><div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center"><div style="font-size:12px;color:#999">预计 token ' + tokenMin.toFixed(1) + '~' + tokenMax.toFixed(1) + ' 万</div><button class="btn sm" data-vid="' + v.id + '" style="cursor:pointer">SVIP 免费订购</button></div></div>';
          }).join('')}
        </div>
      `;
      $page.querySelectorAll('[data-vid]').forEach(el =>
        el.addEventListener('click', () => go('vasDetail', { id: el.dataset.vid }))
      );
    }
  });

  register('vasDetail', ({ id }) => {
    setNav('服务详情');
    const v = Store.get().vasServices.find(x => x.id === id);
    if (!v) { $page.innerHTML = '<div class="empty">服务不存在</div>'; return; }
    const s = Store.get();
    const svip = hasSvip();
    const tokenMin = (v.estTokenMin || 150000) / 10000;
    const tokenMax = (v.estTokenMax || 300000) / 10000;
    const estAicMin = Math.round((v.estTokenMin || 150000) * (s.aicConfig?.tokenRate || 1) / 1000);
    const estAicMax = Math.round((v.estTokenMax || 300000) * (s.aicConfig?.tokenRate || 1) / 1000);
    const rateLabel = s.aicConfig?.unitLabel || '1 AIC / 1000 token';

    $page.innerHTML = `
      <div class="card">
        ${svip ? '<span class="tag" style="background:#fbf6ec;color:#5d4037"><i data-lucide="crown" style="width:11px;height:11px;vertical-align:middle"></i> SVIP 专享</span>' : ''}
        <div class="title" style="display:flex;align-items:center;gap:6px;margin-top:4px"><i data-lucide="${svip ? 'crown' : 'wrench'}"></i>${U.escapeHtml(v.name)}</div>
        <div class="desc" style="margin-top:8px">${U.escapeHtml(v.desc)}</div>
        <div class="kv"><div class="k">服务商</div><div class="v">${U.escapeHtml(v.vendor)}</div></div>
        <div class="kv"><div class="k">联系方式</div><div class="v">${U.escapeHtml(v.contact)}</div></div>
        <div class="kv"><div class="k">权益方式</div><div class="v" style="color:#5d4037;font-weight:600">${svip ? 'SVIP 免费' : '按实际 token 消耗结算 AIC'}</div></div>
        ${!svip ? '<div class="kv"><div class="k">预估 Token</div><div class="v">' + tokenMin.toFixed(1) + ' 万 ~ ' + tokenMax.toFixed(1) + ' 万 token</div></div><div class="kv"><div class="k">换算比例</div><div class="v">' + U.escapeHtml(rateLabel) + '</div></div><div class="kv"><div class="k">预估 AIC</div><div class="v price-big">' + estAicMin + ' ~ ' + estAicMax + ' AIC <span style="font-size:11px;color:#999;font-weight:400">（实际以最终消耗为准）</span></div></div>' : ''}
      </div>
      ${!svip ? '<div class="card" style="background:#fff8e1;border:1px solid #ffe0b2"><div class="title" style="font-size:13px;color:#bf360c"><i data-lucide="info"></i> 计费说明</div><div class="desc" style="margin-top:6px;color:#666">该服务按底层大模型实际 token 消耗量结算 AIC。以上为预估范围，实际消耗可能因任务复杂度不同有所差异。下单时不扣费，服务完成后按实际用量扣减 AIC 余额。</div></div>' : ''}
      <div class="card">
        <div class="title">需求说明</div>
        <div class="field" style="padding:0;margin-top:8px"><textarea class="textarea" id="reqDesc" placeholder="描述你的需求..."></textarea></div>
      </div>
      <div class="bottom-bar">
        ${svip ? '<button class="btn block" id="orderBtn"><i data-lucide="crown"></i> SVIP 免费订购</button>' : '<button class="btn block" id="orderBtn"><i data-lucide="shopping-bag"></i> 确认订购（按实际用量后结算）</button>'}
      </div>
    `;
    document.getElementById('orderBtn').onclick = () => {
      const desc = document.getElementById('reqDesc').value.trim();
      const orderId = Store.uid('VO');
      const now = Date.now();
      const ss = Store.get();
      const order = {
        id: orderId, serviceId: v.id, serviceName: v.name,
        userId: ss.currentUser.id, user: ss.currentUser.company,
        progress: 'in_progress', createdAt: now, note: desc,
        svip: svip,
        estTokenMin: v.estTokenMin, estTokenMax: v.estTokenMax,
      };
      ss.vasOrders.unshift(order);
      Store.log('用户订购', '服务订单 ' + orderId + ' - ' + v.name + (svip ? '(SVIP免费)' : '') + ' 预估token ' + tokenMin.toFixed(1) + '~' + tokenMax.toFixed(1) + '万', ss.currentUser.company);
      Store.set(ss);
      toast('订购成功！服务完成后按实际用量结算');
      setTimeout(() => reset('orders'), 600);
    };
  });

  // ==================== 政策专区 ====================
  register('policy', () => {
    setNav('政策专区', { text: '智能匹配', onClick: () => go('policyMatch') });
    const s = Store.get();
    let region = '全部'; let cate = '全部';
    let regionOpen = false; let cateOpen = false;
    const regions = ['全部', '全国', '湖北'];
    const cates = ['全部', ...Array.from(new Set(s.policies.map(p => p.cate)))];

    const draw = () => {
      const list = s.policies.filter(p => p.status === 'on' && (region === '全部' || p.region === region) && (cate === '全部' || p.cate === cate));
      const $l = document.getElementById('pList');
      $l.innerHTML = list.length ? list.map((p, idx) => `
        <div class="plc-item" data-pid="${p.id}">
          <div class="plc-dot-line"><div class="plc-dot ${idx === 0 ? 'active' : ''}"></div>${idx < list.length - 1 ? '<div class="plc-line"></div>' : ''}</div>
          <div class="plc-card" data-pid="${p.id}">
            <div class="plc-card-title double-line-ellipsis">${U.escapeHtml(p.title)}</div>
            <div class="plc-card-meta"><span class="tag">${p.region}</span><span class="tag gray">${p.cate}</span><span class="plc-card-date">${U.fmtDate(p.publishAt, false)}</span></div>
          </div>
        </div>
      `).join('') : '<div class="empty">暂无符合条件的政策</div>';
      $l.querySelectorAll('[data-pid]').forEach(el => el.addEventListener('click', () => go('policyDetail', { id: el.dataset.pid })));
    };

    const renderFilters = () => {
      const $rgs = document.getElementById('rgs');
      const $cts = document.getElementById('cts');

      // 地区筛选
      $rgs.innerHTML = '<div style="display:flex;align-items:center;gap:6px;padding:0 12px 6px;cursor:pointer" id="rgsToggle">' +
        '<span style="font-size:12px;color:#333;font-weight:500">地区：</span>' +
        '<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;background:#e3f2fd;color:#1976d2" id="rgsLabel">' + region + '</span>' +
        '<i data-lucide="' + (regionOpen ? 'chevron-up' : 'chevron-down') + '" style="width:14px;height:14px;color:#999;margin-left:2px"></i>' +
      '</div>' +
      '<div style="display:' + (regionOpen ? 'flex' : 'none') + ';gap:6px;padding:0 12px 4px;flex-wrap:wrap;overflow:hidden" id="rgsList">' +
        regions.map(r => '<span style="display:inline-block;padding:4px 12px;border-radius:16px;font-size:12px;cursor:pointer;white-space:nowrap' + (r === region ? ';background:#1976d2;color:#fff;font-weight:600' : ';color:#666;border:1px solid #e0e0e0') + '" data-r="' + r + '">' + r + '</span>').join('') +
      '</div>';

      // 分类筛选
      $cts.innerHTML = '<div style="display:flex;align-items:center;gap:6px;padding:0 12px 6px;cursor:pointer" id="ctsToggle">' +
        '<span style="font-size:12px;color:#333;font-weight:500">分类：</span>' +
        '<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;background:#e3f2fd;color:#1976d2" id="ctsLabel">' + cate + '</span>' +
        '<i data-lucide="' + (cateOpen ? 'chevron-up' : 'chevron-down') + '" style="width:14px;height:14px;color:#999;margin-left:2px"></i>' +
      '</div>' +
      '<div style="display:' + (cateOpen ? 'flex' : 'none') + ';gap:6px;padding:0 12px 4px;flex-wrap:wrap;overflow:hidden" id="ctsList">' +
        cates.map(c => '<span style="display:inline-block;padding:4px 12px;border-radius:16px;font-size:12px;cursor:pointer;white-space:nowrap' + (c === cate ? ';background:#1976d2;color:#fff;font-weight:600' : ';color:#666;border:1px solid #e0e0e0') + '" data-c="' + c + '">' + c + '</span>').join('') +
      '</div>';

      // 事件绑定
      document.getElementById('rgsToggle').onclick = () => { regionOpen = !regionOpen; renderFilters(); };
      document.getElementById('ctsToggle').onclick = () => { cateOpen = !cateOpen; renderFilters(); };
      document.getElementById('rgsList').addEventListener('click', (e) => {
        const el = e.target.closest('[data-r]'); if (!el) return;
        region = el.dataset.r; regionOpen = false; renderFilters(); draw();
      });
      document.getElementById('ctsList').addEventListener('click', (e) => {
        const el = e.target.closest('[data-c]'); if (!el) return;
        cate = el.dataset.c; cateOpen = false; renderFilters(); draw();
      });

      if (window.lucide) setTimeout(() => lucide.createIcons(), 0);
    };

    $page.innerHTML = '<div class="plc-search-bar"><i data-lucide="search" style="width:14px;height:14px;color:#999"></i><input class="plc-search-input" id="pSearch" placeholder="搜索政策标题" /></div><div id="rgs"></div><div style="height:4px"></div><div id="cts"></div><div style="padding:0 12px;margin-top:4px" id="pList"></div>';
    renderFilters();
    draw();
    const $ps = document.getElementById('pSearch');
    $ps.addEventListener('input', U.debounce(() => { draw(); const q = $ps.value.trim().toLowerCase(); if (q) { const list = Store.get().policies.filter(p => p.status === 'on' && (region === '全部' || p.region === region) && (cate === '全部' || p.cate === cate) && (p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q))); const $l = document.getElementById('pList'); $l.innerHTML = list.length ? list.map((p, idx) => '<div class="plc-item" data-pid="' + p.id + '"><div class="plc-dot-line"><div class="plc-dot' + (idx === 0 ? ' active' : '') + '"></div>' + (idx < list.length - 1 ? '<div class="plc-line"></div>' : '') + '</div><div class="plc-card" data-pid="' + p.id + '"><div class="plc-card-title double-line-ellipsis">' + U.escapeHtml(p.title) + '</div><div class="plc-card-meta"><span class="tag">' + p.region + '</span><span class="tag gray">' + p.cate + '</span><span class="plc-card-date">' + U.fmtDate(p.publishAt, false) + '</span></div></div></div>').join('') : '<div class="empty">未找到匹配政策</div>'; $l.querySelectorAll('[data-pid]').forEach(el => el.addEventListener('click', () => go('policyDetail', { id: el.dataset.pid }))); } }, 200));
  });

  register('policyDetail', ({ id }) => {
    setNav('政策详情');
    const p = Store.get().policies.find(x => x.id === id);
    if (!p) { $page.innerHTML = '<div class="empty">政策不存在</div>'; return; }
    const s = Store.get();
    const fav = s.policyFavs.includes(p.id);
    $page.innerHTML = `
      <div class="plc-detail-hero">
        <p class="plc-detail-title">${U.escapeHtml(p.title)}</p>
        <div class="plc-detail-tags"><span class="tag">${p.region}</span><span class="tag gray">${p.cate}</span><span class="plc-detail-date">${U.fmtDate(p.publishAt, false)}</span></div>
      </div>
      <div class="plc-detail-body">
        <div class="plc-detail-section"><div class="plc-detail-label">政策摘要</div><p>${U.escapeHtml(p.summary)}</p></div>
        <div class="plc-detail-section"><div class="plc-detail-label">申报条件</div><ul class="plc-detail-list"><li>在湖北省/全国境内注册的独立法人企业</li><li>近两年无重大违法违规记录</li><li>相关行业资质齐全</li></ul></div>
        <div class="plc-detail-section"><div class="plc-detail-label">申报材料</div><ul class="plc-detail-list"><li>营业执照</li><li>近三年审计报告</li><li>专项申报书</li></ul></div>
      </div>
      <div class="bottom-bar">
        <button class="btn ${fav ? 'muted' : 'ghost'}" id="favBtn" style="flex:1"><i data-lucide="star"></i>${fav ? '已收藏' : '收藏'}</button>
        <button class="btn" id="applyBtn" style="flex:1"><i data-lucide="message-square"></i>在线咨询</button>
      </div>
    `;
    document.getElementById('favBtn').onclick = () => {
      const ss = Store.get();
      const i = ss.policyFavs.indexOf(p.id);
      if (i >= 0) { ss.policyFavs.splice(i, 1); toast('已取消收藏'); }
      else { ss.policyFavs.push(p.id); toast('已收藏'); }
      Store.set(ss);
    };
    document.getElementById('applyBtn').onclick = () => toast('客服将在1个工作日内联系您');
  });

  register('policyMatch', () => {
    setNav('AI政策匹配');
    const s = Store.get();
    $page.innerHTML = `
      <div class="card"><div class="title">企业画像</div><div class="kv"><div class="k">企业名称</div><div class="v">${U.escapeHtml(s.currentUser.company)}</div></div><div class="kv"><div class="k">认证状态</div><div class="v">${s.currentUser.authStatus === 'verified' ? '<span class="tag green">已认证</span>' : '<span class="tag orange">未认证</span>'}</div></div></div>
      <div style="padding:16px"><button class="btn block" id="matchBtn"><i data-lucide="sparkles"></i>开始 AI 匹配</button></div>
      <div id="matchResult" style="padding:0 12px"></div>
    `;
    document.getElementById('matchBtn').onclick = () => {
      const ss = Store.get();
      const matches = ss.policies.map(p => ({ ...p, score: Math.round(60 + Math.random() * 35) })).sort((a, b) => b.score - a.score);
      const $r = document.getElementById('matchResult');
      $r.innerHTML = '<div class="section-head" style="margin-left:0">匹配到 ' + matches.length + ' 项政策</div>' + matches.map(m => '<div class="plc-item" data-pid="' + m.id + '"><div class="plc-dot-line"><div class="plc-dot active"></div></div><div class="plc-card" data-pid="' + m.id + '"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div style="flex:1"><div class="plc-card-title double-line-ellipsis">' + U.escapeHtml(m.title) + '</div></div><div style="text-align:center"><div style="font-size:20px;color:#1ba258;font-weight:700">' + m.score + '</div><div style="font-size:10px;color:#999">匹配度</div></div></div><div class="plc-card-meta"><span class="tag">' + m.region + '</span><span class="tag gray">' + m.cate + '</span></div></div></div>').join('');
      $r.querySelectorAll('[data-pid]').forEach(el => el.addEventListener('click', () => go('policyDetail', { id: el.dataset.pid })));
      ss.policyMatchLogs.unshift({ id: Store.uid('PML'), userId: ss.currentUser.id, user: ss.currentUser.company, matchedCount: matches.length, at: Date.now() });
      Store.log('政策匹配', ss.currentUser.company + ' 触发AI匹配', ss.currentUser.company);
      Store.set(ss);
      toast('AI 匹配完成');
    };
  });

  // ==================== AI 智能助手 ====================
  register('aiChat', () => {
    setNav('AI 智能助手');
    $page.style.overflow = 'hidden';
    $page.style.paddingBottom = '0';
    const chatHistory = [];
    const renderChat = () => {
      const $cb = document.getElementById('chatBox');
      $cb.innerHTML = chatHistory.map(msg => '<div class="chat-msg ' + msg.role + '"><div class="msg-avatar"><i data-lucide="' + (msg.role === 'user' ? 'user' : 'bot') + '" style="width:16px;height:16px"></i></div><div class="msg-content"><div class="msg-text">' + U.escapeHtml(msg.text) + '</div><div class="msg-time">' + U.fmtDate(msg.time) + '</div></div></div>').join('');
      $cb.scrollTop = $cb.scrollHeight;
      if (window.lucide) setTimeout(() => lucide.createIcons(), 0);
    };
    const sendMessage = () => {
      const $input = document.getElementById('chatInput');
      const text = $input.value.trim();
      if (!text) return;
      chatHistory.push({ role: 'user', text, time: Date.now() }); $input.value = ''; renderChat();
      setTimeout(() => {
        let reply = '';
        if (text.includes('政策') || text.includes('补贴')) reply = '根据您的企业情况，推荐以下政策：\n\n1. 湖北省科技型中小企业研发费用加计扣除\n2. 武汉市高新技术企业认定补贴\n3. 科技金融专项贷款\n\n您可以前往"政策专区"查看详情。';
        else if (text.includes('融资') || text.includes('贷款')) reply = '企融通提供以下融资服务：\n\n· 科技贷：最高500万\n· 知识产权质押贷款\n· 政府担保基金\n\n建议先完成企业认证。';
        else if (text.includes('报告') || text.includes('尽调')) reply = '我们提供10类AI大模型报告：\n\n· 经营分析报告\n· 行业研究报告\n· 知识产权分析\n· 政策解读与申报建议\n· 法律合规风险\n· 企业估值\n· 尽职调查\n· 招商方案\n· 全面风险评估\n· 对标分析\n\n点击"报告"栏目查看详情。';
        else if (text.includes('AIC') || text.includes('充值') || text.includes('余额')) reply = 'AIC 余额说明：\n\n· 1元 = 10 AIC\n· 报告消耗：30~680 AIC/份\n· 增值服务：按实际token消耗结算\n· 剩余AIC可申请退款\n\n前往"我的-充值"查看套餐。';
        else if (text.includes('SVIP') || text.includes('会员')) reply = 'SVIP 尊享版：\n\n· 月卡299元 / 季卡799元 / 年卡2599元\n· 有效期内全部第三方增值服务免费\n· 报告继续按AIC消耗\n\n前往"我的"查看会员信息。';
        else reply = '您好！我是企融通AI助手。\n\n我可以帮您：\n✓ 推荐适合的政策和补贴\n✓ 提供融资方案咨询\n✓ 解答报告和服务问题\n✓ AIC余额与VIP/SVIP说明\n✓ 协助完成企业认证\n\n请问有什么可以帮您？';
        chatHistory.push({ role: 'ai', text: reply, time: Date.now() }); renderChat();
      }, 800);
    };
    $page.innerHTML = '<div class="ai-chat-container"><div class="chat-header"><div class="chat-header-info"><div class="chat-avatar"><i data-lucide="bot" style="width:22px;height:22px;color:#1976d2"></i></div><div><div class="chat-name">AI 智能助手</div><div class="chat-status">在线</div></div></div></div><div class="chat-box" id="chatBox"><div class="chat-welcome"><div class="welcome-icon"><i data-lucide="message-circle" style="width:48px;height:48px;color:#1976d2"></i></div><div class="welcome-title">您好！我是企融通 AI 助手</div><div class="welcome-desc">我可以帮您解答以下问题：</div><div class="welcome-tags"><span class="tag" data-q="有哪些适合科技企业的政策？">政策咨询</span><span class="tag" data-q="如何申请科技贷款？">融资方案</span><span class="tag" data-q="企业尽调报告包含什么内容？">报告推荐</span><span class="tag" data-q="企业认证需要什么材料？">认证指引</span></div></div></div><div class="chat-input-bar"><input class="chat-input" id="chatInput" placeholder="输入您的问题..." /><button class="btn" id="sendBtn"><i data-lucide="send"></i>发送</button></div></div>';
    document.getElementById('sendBtn').onclick = sendMessage;
    document.getElementById('chatInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    $page.querySelectorAll('.welcome-tags .tag').forEach(tag => { tag.onclick = () => { document.getElementById('chatInput').value = tag.dataset.q; sendMessage(); }; });
    if (window.lucide) setTimeout(() => lucide.createIcons(), 0);
  });

  // ==================== 企业查询 ====================
  register('enterpriseQuery', ({ q }) => {
    setNav('企业信息查询');
    $page.innerHTML = '<div class="search-bar"><i data-lucide="search" style="width:16px;height:16px;color:#888"></i><input id="eq" placeholder="输入企业名称 / 统一社会信用代码" value="' + U.escapeHtml(q || '') + '"/></div><div style="padding:16px"><button class="btn block" id="qBtn"><i data-lucide="search"></i>立即查询</button></div><div id="qResult" style="padding:0 12px"></div>';
    const doQuery = () => {
      const query = document.getElementById('eq').value.trim();
      if (!query) { toast('请输入企业名称'); return; }
      document.getElementById('qResult').innerHTML = '<div class="card"><div class="title">' + U.escapeHtml(query) + '</div><div class="kv"><div class="k">统一社会信用代码</div><div class="v">9142**********' + Math.floor(Math.random() * 1000) + '</div></div><div class="kv"><div class="k">法定代表人</div><div class="v">张某某</div></div><div class="kv"><div class="k">注册资本</div><div class="v">' + (Math.random() * 5000).toFixed(0) + ' 万元</div></div><div class="kv"><div class="k">成立日期</div><div class="v">2018-03-12</div></div><div class="kv"><div class="k">登记状态</div><div class="v"><span class="tag green">在营</span></div></div></div><div style="padding:12px;text-align:center;font-size:11px;color:#999">数据来源：国家企业信用信息公示系统（演示）</div>';
    };
    document.getElementById('qBtn').onclick = doQuery;
    document.getElementById('eq').addEventListener('keypress', (e) => { if (e.key === 'Enter') doQuery(); });
    if (q) setTimeout(doQuery, 100);
  });

  // ==================== 我的 ====================
  register('profile', () => {
    setNav('我的');
    $page.style.overflow = '';
    $page.style.paddingBottom = '';
    const s = Store.get();
    const u = s.currentUser;
    const orders = s.orders.filter(o => o.userId === u.id);
    const purchased = s.purchasedReports.length;
    const favs = s.policyFavs.length;
    $page.innerHTML = `
      <div class="profile-head"><div class="name">${U.escapeHtml(u.company)}</div><div class="sub">手机号 ${U.escapeHtml(u.phone)}</div><div class="badge">${u.authStatus === 'verified' ? '✓ 已认证' : u.authStatus === 'pending' ? '审核中' : u.authStatus === 'rejected' ? '已驳回' : '未认证'}</div></div>
      <div class="profile-stats"><div class="it" data-go="orders"><div class="n">${orders.length}</div><div class="l">订单</div></div><div class="it" data-go="purchasedReports"><div class="n">${purchased}</div><div class="l">报告</div></div><div class="it" data-go="policyFavs"><div class="n">${favs}</div><div class="l">收藏政策</div></div></div>

      <!-- 会员与余额卡片 -->
      <div class="section-head" style="margin-top:8px">账户余额与会员</div>
      <div style="padding:0 12px">
        <!-- AIC 余额卡片 - 橙金色渐变现代风格 -->
        <div class="card" style="background:linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%);border:1px solid #FDBA74;margin-bottom:12px;padding:16px;box-shadow:0 4px 16px rgba(251,146,60,0.15)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
                <i data-lucide="wallet" style="width:18px;height:18px;color:#EA580C"></i>
                <span style="font-size:14px;font-weight:700;color:#9A3412">AIC 余额</span>
              </div>
              <div style="font-size:28px;font-weight:700;color:#EA580C;line-height:1;margin-bottom:8px">${fmtAic(u.aicBalance)} <span style="font-size:15px;font-weight:500;color:#C2410C">AIC</span></div>
              <div style="font-size:11px;color:#92400E;line-height:1.4">累计充值 ${u.aicTotalRecharged} · 已消耗 ${fmtAic(u.aicTotalConsumed)}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
              <button class="btn sm" id="btnVipRecharge" style="background:linear-gradient(135deg,#F97316 0%,#EA580C 100%);color:#FFF;border:none;box-shadow:0 2px 8px rgba(249,115,22,0.3);font-weight:600;cursor:pointer"><i data-lucide="plus-circle"></i>充值</button>
              ${u.aicBalance > 0 ? '<button class="btn sm ghost" id="btnRefund" style="background:rgba(255,255,255,0.8);color:#C2410C;border:1px solid #FDBA74;font-weight:600;cursor:pointer"><i data-lucide="undo-2"></i>退款</button>' : ''}
            </div>
          </div>
        </div>

        ${u.svipExpireAt > Date.now() ? `
        <!-- SVIP 已开通 - 深紫黑配金色奢华风格 -->
        <div class="card" style="background:linear-gradient(135deg,#1A0F2E 0%,#2D1B3D 50%,#1A0F2E 100%);color:#FFF;margin-bottom:12px;padding:16px;box-shadow:0 8px 24px rgba(212,175,55,0.25);border:1px solid rgba(212,175,55,0.2)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:7px;margin-bottom:10px">
                <i data-lucide="crown" style="width:20px;height:20px;color:#D4AF37;filter:drop-shadow(0 0 6px rgba(212,175,55,0.5))"></i>
                <span style="font-size:15px;font-weight:700;color:#D4AF37;letter-spacing:0.5px">SVIP 尊享版</span>
              </div>
              <div style="font-size:17px;font-weight:700;color:#FFF;line-height:1.3;margin-bottom:6px">到期 ${U.fmtDate(u.svipExpireAt, false)}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.75);line-height:1.4">全部第三方增值服务免费使用</div>
            </div>
            <div style="flex-shrink:0">
              <button class="btn sm" id="btnSvipRenew" style="background:linear-gradient(135deg,#D4AF37 0%,#F4E4C1 50%,#D4AF37 100%);color:#1A0F2E;border:none;box-shadow:0 4px 16px rgba(212,175,55,0.4);font-weight:700;cursor:pointer"><i data-lucide="refresh-cw"></i>续费</button>
            </div>
          </div>
        </div>
        ` : `
        <!-- SVIP 未开通 - 淡紫黑配金色引导风格 -->
        <div class="card" style="background:linear-gradient(135deg,#2A1F3D 0%,#3D2B4D 50%,#2A1F3D 100%);color:#FFF;margin-bottom:12px;padding:16px;box-shadow:0 4px 20px rgba(212,175,55,0.2);border:2px solid rgba(212,175,55,0.3)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:7px;margin-bottom:10px">
                <i data-lucide="crown" style="width:20px;height:20px;color:#D4AF37;filter:drop-shadow(0 0 6px rgba(212,175,55,0.5))"></i>
                <span style="font-size:15px;font-weight:700;color:#D4AF37;letter-spacing:0.5px">SVIP 尊享版</span>
              </div>
              <div style="font-size:12px;color:rgba(255,255,255,0.85);line-height:1.5;margin-bottom:6px">开通后全部增值服务免费使用</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.65);line-height:1.4">月卡299元 · 季卡799元 · 年卡2599元</div>
            </div>
            <div style="flex-shrink:0">
              <button class="btn sm" id="btnSvipOpen" style="background:linear-gradient(135deg,#D4AF37 0%,#F4E4C1 50%,#D4AF37 100%);color:#1A0F2E;border:none;box-shadow:0 4px 16px rgba(212,175,55,0.5);font-weight:700;transition:all 200ms;cursor:pointer"><i data-lucide="crown"></i>开通</button>
            </div>
          </div>
        </div>
        `}
      </div>

      <div class="section-head">企业服务</div>
      <div class="card" style="padding:0">
        <div class="list-item" data-go="enterpriseInfo"><div class="body"><div class="t">企业信息</div><div class="d">基本信息、认证状态、资质文件</div></div><div class="arrow">&rsaquo;</div></div>
        <div class="list-item" data-go="enterpriseQuery"><div class="body"><div class="t">企业信息查询</div><div class="d">查询企业工商基础信息</div></div><div class="arrow">&rsaquo;</div></div>
        <div class="list-item" data-go="orders"><div class="body"><div class="t">订单中心</div><div class="d">报告订单、增值服务订单</div></div><div class="arrow">&rsaquo;</div></div>
        <div class="list-item" data-go="purchasedReports"><div class="body"><div class="t">我的报告库</div><div class="d">已购报告预览/下载</div></div><div class="arrow">&rsaquo;</div></div>
        <div class="list-item" data-go="invoiceProfiles"><div class="body"><div class="t">发票管理</div><div class="d">抬头管理、开票申请</div></div><div class="arrow">&rsaquo;</div></div>
        <div class="list-item" data-go="policyFavs"><div class="body"><div class="t">政策收藏夹</div><div class="d">${favs} 条已收藏</div></div><div class="arrow">&rsaquo;</div></div>
        <div class="list-item" data-go="businessIntent"><div class="body"><div class="t">业务意向填报</div><div class="d">提前登记业务合作意向</div></div><div class="arrow">&rsaquo;</div></div>
      </div>
      <div class="section-head">账户</div>
      <div class="card" style="padding:0">
        <div class="list-item" data-go="aicConsumption"><div class="body"><div class="t">AIC 消耗记录</div><div class="d">查看每日AIC消耗明细</div></div><div class="arrow">&rsaquo;</div></div>
        <div class="list-item" data-go="security"><div class="body"><div class="t">账号安全</div><div class="d">手机号、密码、微信授权</div></div><div class="arrow">&rsaquo;</div></div>
        <div class="list-item" data-go="about"><div class="body"><div class="t">关于 / 帮助</div><div class="d">版本、协议、客服联系</div></div><div class="arrow">&rsaquo;</div></div>
        <div class="list-item" id="logoutBtn" style="cursor:pointer"><div class="body" style="color:#f56c6c"><i data-lucide="log-out" style="color:#f56c6c"></i><div class="t">退出登录</div></div><div class="arrow">&rsaquo;</div></div>
      </div>
      <div style="height:30px"></div>
    `;

    // 使用 setTimeout 确保 DOM 完全渲染后再绑定事件
    setTimeout(() => {
      $page.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', () => go(el.dataset.go)));

      // VIP/SVIP 按钮事件绑定
      const btnVipRecharge = document.getElementById('btnVipRecharge');
      const btnRefund = document.getElementById('btnRefund');
      const btnSvipRenew = document.getElementById('btnSvipRenew');
      const btnSvipOpen = document.getElementById('btnSvipOpen');

      if (btnVipRecharge) btnVipRecharge.onclick = () => go('vipRecharge');
      if (btnRefund) btnRefund.onclick = () => go('refundApply');
      if (btnSvipRenew) btnSvipRenew.onclick = () => go('svipPlans');
      if (btnSvipOpen) btnSvipOpen.onclick = () => go('svipPlans');

    }, 0);

    // 退出登录按钮
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        openModal(`
          <div style="text-align:center;padding:20px">
            <i data-lucide="log-out" style="width:48px;height:48px;color:#f56c6c;margin-bottom:16px"></i>
            <div style="font-size:16px;font-weight:600;margin-bottom:8px;color:#333">确认退出登录？</div>
            <div style="font-size:13px;color:#666;margin-bottom:20px">退出后需要重新进行鄂汇办认证</div>
            <div style="display:flex;gap:12px">
              <button class="btn block muted" id="cancelLogout" style="flex:1">取消</button>
              <button class="btn block" id="confirmLogout" style="flex:1;background:#f56c6c;border:none">确认退出</button>
            </div>
          </div>
        `);
        if (window.lucide) lucide.createIcons();

        document.getElementById('cancelLogout').onclick = closeModal;
        document.getElementById('confirmLogout').onclick = () => {
          const ss = Store.get();
          ss.isLoggedIn = false;
          ss.ehbAuthToken = null;
          ss.ehbAuthTime = null;
          ss.currentUser = {
            id: null,
            phone: '',
            company: '',
            creditCode: '',
            contact: '',
            authStatus: 'unverified',
            authMaterials: [],
            authNote: '',
            registerAt: null,
            vipLevel: 'none',
            vipExpireAt: 0,
            svipExpireAt: 0,
            aicBalance: 0,
            aicTotalRecharged: 0,
            aicTotalConsumed: 0,
            aicTotalRefunded: 0,
          };
          Store.log('用户退出', '用户退出登录', 'system');
          Store.set(ss);
          closeModal();
          toast('已退出登录');
          setTimeout(() => reset('login'), 500);
        };
      };
    }
  });

  // ==================== AIC 充值 ====================
  register('vipRecharge', () => {
    setNav('AIC 余额充值');
    const s = Store.get();
    const plans = s.vipPlans.filter(p => p.status === 'on');
    let pickedId = plans[0]?.id || '';
    let customMode = false;
    let customAmount = '';
    const draw = () => {
      const plan = plans.find(p => p.id === pickedId);
      const displayAmount = customMode ? customAmount : (plan ? plan.amount : '');
      const displayAic = customMode ? (customAmount ? parseFloat(customAmount) * 10 : 0) : (plan ? plan.aic : 0);

      $page.innerHTML = `
        <div class="card" style="margin:12px;background:linear-gradient(135deg,#fff3e0 0%,#fff 100%);border:1px solid #ffe0b2">
          <div class="title" style="display:flex;align-items:center;gap:6px;color:#bf360c"><i data-lucide="wallet"></i>AIC 余额</div>
          <div class="kv"><div class="k">当前余额</div><div class="v price-big" style="color:#e65100">${fmtAic(s.currentUser.aicBalance)} AIC</div></div>
          <div class="kv"><div class="k">已消耗</div><div class="v" style="color:#999">${fmtAic(s.currentUser.aicTotalConsumed)} AIC（不可退）</div></div>
          <div class="kv"><div class="k">已退款</div><div class="v" style="color:#999">${fmtAic(s.currentUser.aicTotalRefunded)} AIC</div></div>
        </div>
        <div class="section-head">选择充值套餐 <span style="font-size:11px;color:#999;font-weight:400">1元 = 10 AIC</span></div>
        <div style="padding:0 12px">
          ${plans.map(p => `
            <div class="vip-plan ${!customMode && pickedId === p.id ? 'active' : ''}" data-pid="${p.id}">
              ${p === plans[plans.length - 1] ? '<div class="vp-tag">推荐</div>' : ''}
              <div class="vp-name">${U.escapeHtml(p.name)}</div>
              <div class="vp-desc">${U.escapeHtml(p.desc)}</div>
              <div class="vp-price">¥${p.amount}<span style="font-size:12px;color:#999;font-weight:400"> = ${p.aic} AIC</span></div>
            </div>
          `).join('')}

          <!-- 自定义充值金额 -->
          <div class="vip-plan ${customMode ? 'active' : ''}" id="customPlan" style="position:relative">
            <div class="vp-tag" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)">灵活</div>
            <div class="vp-name">自定义金额</div>
            <div class="vp-desc">输入任意充值金额</div>
            ${customMode ? `
              <div style="margin-top:12px">
                <input
                  type="number"
                  id="customAmountInput"
                  placeholder="请输入充值金额（元）"
                  value="${customAmount}"
                  min="1"
                  step="1"
                  style="width:100%;padding:10px 12px;border:2px solid #667eea;border-radius:8px;font-size:14px;font-weight:600;color:#333;background:#fff"
                />
                <div style="margin-top:8px;font-size:12px;color:#666;text-align:center">
                  ${customAmount && parseFloat(customAmount) > 0 ? '到账 <span style="color:#e65100;font-weight:600">' + (parseFloat(customAmount) * 10).toFixed(0) + ' AIC</span>' : '最低充值 1 元起'}
                </div>
              </div>
            ` : '<div class="vp-price" style="color:#667eea">¥ 自定义</div>'}
          </div>
        </div>
        <div style="padding:16px">
          <button class="btn block" id="payBtn" ${customMode && (!customAmount || parseFloat(customAmount) < 1) ? 'disabled' : ''}>
            <i data-lucide="credit-card"></i>确认充值 ¥${displayAmount || ''}${customMode && customAmount && parseFloat(customAmount) > 0 ? ' = ' + displayAic + ' AIC' : ''}
          </button>
        </div>
        <div style="text-align:center;font-size:11px;color:#999;margin-bottom:16px">
          支付成功后 ${displayAic || ''} AIC 立即到账
        </div>
      `;

      // 套餐点击事件
      $page.querySelectorAll('[data-pid]').forEach(el => el.onclick = () => {
        customMode = false;
        pickedId = el.dataset.pid;
        draw();
      });

      // 自定义充值点击事件
      const customPlan = document.getElementById('customPlan');
      if (customPlan && !customMode) {
        customPlan.onclick = () => {
          customMode = true;
          draw();
          setTimeout(() => {
            const input = document.getElementById('customAmountInput');
            if (input) input.focus();
          }, 100);
        };
      }

      // 自定义金额输入事件
      const customInput = document.getElementById('customAmountInput');
      if (customInput) {
        customInput.oninput = (e) => {
          customAmount = e.target.value;
          draw();
        };
      }

      // 支付按钮点击事件
      document.getElementById('payBtn').onclick = () => {
        if (customMode) {
          const amount = parseFloat(customAmount);
          if (!amount || amount < 1) {
            toast('请输入有效的充值金额（最低1元）');
            return;
          }
          if (amount > 1000000) {
            toast('单次充值金额不能超过100万元');
            return;
          }
          // 使用自定义金额
          go('payVip', {
            planId: 'custom',
            customAmount: amount,
            customAic: amount * 10
          });
        } else {
          const pp = plans.find(p => p.id === pickedId);
          if (!pp) return;
          go('payVip', { planId: pp.id });
        }
      };
    };
    draw();
  });

  register('payVip', ({ planId, customAmount, customAic }) => {
    setNav('确认支付');
    const s = Store.get();

    // 判断是自定义充值还是套餐充值
    let isCustom = planId === 'custom';
    let planName, amount, aic;

    if (isCustom) {
      planName = '自定义充值 ¥' + customAmount;
      amount = customAmount;
      aic = customAic;
    } else {
      const plan = s.vipPlans.find(p => p.id === planId);
      if (!plan) { toast('套餐不存在'); back(); return; }
      planName = plan.name;
      amount = plan.amount;
      aic = plan.aic;
    }

    const contractId = Store.uid('CT');
    const tpl = s.contractTemplates.find(t => t.forType === 'vip');
    const content = (tpl?.content || '')
      .replace('{{company}}', s.currentUser.company)
      .replace('{{product}}', planName)
      .replace('{{amount}}', '¥' + amount)
      .replace('{{aic}}', aic + ' AIC')
      .replace('{{contractId}}', contractId)
      .replace('{{date}}', new Date().toLocaleDateString('zh-CN'));

    $page.innerHTML = `
      <div class="card" style="text-align:center;padding:20px">
        <i data-lucide="file-text" style="width:36px;height:36px;color:#1976d2"></i>
        <p style="font-size:14px;font-weight:600;color:#333;margin-top:8px">电子合同签署</p>
        <p style="font-size:12px;color:#666">${isCustom ? '自定义充值' : '首次充值'}需签署电子合同</p>
      </div>
      <div class="card" style="background:#fafafa">
        <div class="title">${U.escapeHtml(planName)}</div>
        <pre style="white-space:pre-wrap;font-size:12px;color:#333;line-height:1.7;margin:0;font-family:inherit">${U.escapeHtml(content)}</pre>
      </div>
      <div style="padding:12px;display:flex;align-items:center;gap:8px;font-size:11px;color:#666">
        <input type="checkbox" id="ctAgree" style="width:16px;height:16px;accent-color:#1976d2">
        <label for="ctAgree">我已阅读并同意以上合同条款</label>
      </div>
      <div style="padding:16px">
        <button class="btn block" id="confirmPay" disabled>
          <i data-lucide="credit-card"></i>确认支付 ¥${amount}
        </button>
      </div>
      <div style="text-align:center;font-size:11px;color:#999">
        支付成功后 ${aic} AIC 将立即到账
      </div>
    `;

    document.getElementById('ctAgree').onchange = function() {
      document.getElementById('confirmPay').disabled = !this.checked;
    };

    document.getElementById('confirmPay').onclick = () => {
      const ss = Store.get();
      const u = ss.currentUser;
      const now = Date.now();

      // 到账 AIC
      u.aicBalance += aic;
      u.aicTotalRecharged += amount;
      u.vipLevel = 'vip';

      const u2 = ss.users.find(x => x.id === u.id);
      if (u2) {
        u2.aicBalance = u.aicBalance;
        u2.aicTotalRecharged = u.aicTotalRecharged;
        u2.vipLevel = 'vip';
      }

      // 充值订单
      ss.vipOrders.unshift({
        id: Store.uid('VP'),
        planId: isCustom ? 'custom' : planId,
        planName: planName,
        userId: u.id,
        user: u.company,
        amount: amount,
        aic: aic,
        paidAt: now,
        tradeNo: 'WX' + Date.now(),
        payMethod: '微信支付',
        contractId,
        svip: false,
        isCustom: isCustom
      });

      // 合同
      ss.contracts.unshift({
        id: contractId,
        orderId: 'VIP' + now,
        templateId: tpl?.id || '',
        userId: u.id,
        user: u.company,
        signedAt: now,
        sealed: true
      });

      // 支付流水
      ss.payFlows.unshift({
        id: Store.uid('F'),
        tradeNo: 'WX' + now,
        orderId: 'VIP' + now,
        amount: amount,
        method: '微信支付',
        paidAt: now,
        source: 'callback'
      });

      Store.log('AIC充值', '充值 ' + planName + ' ¥' + amount + ' 到账 ' + aic + ' AIC', u.company);
      Store.set(ss);
      toast('充值成功！' + aic + ' AIC 已到账');
      setTimeout(() => reset('profile'), 800);
    };
  });

  // ==================== SVIP 套餐 ====================
  register('svipPlans', () => {
    setNav('SVIP 尊享版');
    const s = Store.get();
    const plans = s.svipPlans.filter(p => p.status === 'on');
    let pickedId = plans[0]?.id || '';
    const draw = () => {
      const plan = plans.find(p => p.id === pickedId);
      $page.innerHTML = `
        <!-- SVIP 卡面展示 -->
        <div class="card" style="margin:12px;background:linear-gradient(135deg,#1A0F2E 0%,#2D1B3D 50%,#1A0F2E 100%);color:#FFF;padding:18px;box-shadow:0 8px 24px rgba(212,175,55,0.25);border:1px solid rgba(212,175,55,0.2)">
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:10px">
            <i data-lucide="crown" style="width:20px;height:20px;color:#D4AF37;filter:drop-shadow(0 0 6px rgba(212,175,55,0.5))"></i>
            <span style="font-size:15px;font-weight:700;color:#D4AF37;letter-spacing:0.5px">SVIP 尊享版</span>
          </div>
          <div style="font-size:12px;color:rgba(255,255,255,0.85);line-height:1.5">全部第三方增值服务 · 免费使用</div>
        </div>

        <div class="section-head">选择套餐</div>
        <div style="padding:0 12px">
          ${plans.map(p => `
            <div class="vip-plan svip ${pickedId === p.id ? 'active' : ''}" data-pid="${p.id}">
              ${p === plans[plans.length - 1] ? '<div class="vp-tag">最划算</div>' : ''}
              <div class="vp-name">${U.escapeHtml(p.name)}</div>
              <div class="vp-desc">${U.escapeHtml(p.desc)}</div>
              <div class="vp-price">¥${p.price}<span style="font-size:12px;color:#999;font-weight:400">/${p.duration}天</span></div>
            </div>
          `).join('')}
        </div>

        <div class="card" style="margin:12px;background:#fafafa">
          <div class="title">SVIP 专属权益</div>
          <div class="vip-bene-list" style="margin-top:10px">
            ${s.vasServices.filter(v => v.status === 'on').map(v => '<div class="vip-bene-item svip"><i data-lucide="check-circle" style="width:14px;height:14px"></i>' + U.escapeHtml(v.name) + '</div>').join('')}
          </div>
        </div>

        <div style="padding:16px"><button class="btn block" id="payBtn" style="background:linear-gradient(135deg,#D4AF37,#F4E4C1,#D4AF37);color:#1A0F2E;border:none;font-weight:700;box-shadow:0 4px 16px rgba(212,175,55,0.4)"><i data-lucide="crown"></i>立即开通 ¥${plan ? plan.price : ''}</button></div>
      `;
      $page.querySelectorAll('[data-pid]').forEach(el => el.onclick = () => { pickedId = el.dataset.pid; draw(); });
      document.getElementById('payBtn').onclick = () => {
        const pp = plans.find(p => p.id === pickedId);
        if (!pp) return;
        go('paySvip', { planId: pp.id });
      };
    };
    draw();
  });

  register('paySvip', ({ planId }) => {
    setNav('SVIP 支付');
    const s = Store.get();
    const plan = s.svipPlans.find(p => p.id === planId);
    if (!plan) { toast('套餐不存在'); back(); return; }
    const contractId = Store.uid('CT');
    const tpl = s.contractTemplates.find(t => t.forType === 'svip');
    const content = (tpl?.content || '').replace('{{company}}', s.currentUser.company).replace('{{product}}', plan.name).replace('{{amount}}', '¥' + plan.price).replace('{{duration}}', '' + plan.duration).replace('{{contractId}}', contractId).replace('{{date}}', new Date().toLocaleDateString('zh-CN'));
    $page.innerHTML = `
      <div class="card" style="text-align:center;padding:20px"><i data-lucide="crown" style="width:36px;height:36px;color:#D4AF37"></i><p style="font-size:14px;font-weight:600;color:#333;margin-top:8px">SVIP 电子合同签署</p></div>
      <div class="card" style="background:#fafafa"><div class="title">${U.escapeHtml(plan.name)}</div><pre style="white-space:pre-wrap;font-size:12px;color:#333;line-height:1.7;margin:0;font-family:inherit">${U.escapeHtml(content)}</pre></div>
      <div style="padding:12px;display:flex;align-items:center;gap:8px;font-size:11px;color:#666"><input type="checkbox" id="ctAgree" style="width:16px;height:16px;accent-color:#1A0F2E"><label for="ctAgree">我已阅读并同意以上合同条款</label></div>
      <div style="padding:16px"><button class="btn block" id="confirmPay" disabled style="background:linear-gradient(135deg,#D4AF37,#F4E4C1,#D4AF37);color:#1A0F2E;border:none;font-weight:700;box-shadow:0 4px 16px rgba(212,175,55,0.4)"><i data-lucide="credit-card"></i>确认支付 ¥${plan.price}</button></div>
    `;
    document.getElementById('ctAgree').onchange = function() { document.getElementById('confirmPay').disabled = !this.checked; };
    document.getElementById('confirmPay').onclick = () => {
      const ss = Store.get();
      const u = ss.currentUser;
      const now = Date.now();
      // 开通/续费 SVIP
      const existingExpire = u.svipExpireAt > now ? u.svipExpireAt : now;
      u.svipExpireAt = existingExpire + plan.duration * 86400000;
      const u2 = ss.users.find(x => x.id === u.id);
      if (u2) u2.svipExpireAt = u.svipExpireAt;
      // 充值订单
      ss.vipOrders.unshift({
        id: Store.uid('VP'), planId: plan.id, planName: plan.name,
        userId: u.id, user: u.company, amount: plan.price, aic: 0,
        paidAt: now, tradeNo: 'WX' + Date.now(), payMethod: '微信支付',
        contractId, svip: true, duration: plan.duration,
        effectiveTo: u.svipExpireAt,
      });
      // 合同
      ss.contracts.unshift({ id: contractId, orderId: 'SVP' + now, templateId: tpl?.id || '', userId: u.id, user: u.company, signedAt: now, sealed: true });
      // 支付流水
      ss.payFlows.unshift({ id: Store.uid('F'), tradeNo: 'WX' + now, orderId: 'SVP' + now, amount: plan.price, method: '微信支付', paidAt: now, source: 'callback' });
      Store.log('SVIP开通', '购买 ' + plan.name + ' ¥' + plan.price, u.company);
      Store.set(ss);
      toast('SVIP 已开通！');
      setTimeout(() => reset('profile'), 800);
    };
  });

  // ==================== 退款申请 ====================
  register('refundApply', () => {
    setNav('申请退款');
    const s = Store.get();
    const u = s.currentUser;
    // 检查是否有进行中的退款
    const pending = s.refundRequests.find(r => r.userId === u.id && r.status === 'pending');
    if (pending) {
      $page.innerHTML = '<div class="card" style="margin:12px;background:#fff8e1;border:1px solid #ffe0b2"><div style="display:flex;align-items:center;gap:6px;color:#bf360c"><i data-lucide="hourglass"></i> 已有进行中的退款申请，等待运营审核</div><div class="kv" style="margin-top:8px"><div class="k">申请金额</div><div class="v price-big">' + fmtAic(pending.requestedAic) + ' AIC</div></div><div class="kv"><div class="k">申请时间</div><div class="v">' + U.fmtDate(pending.createdAt) + '</div></div></div>';
      return;
    }
    let amount = u.aicBalance;
    const draw = () => {
      $page.innerHTML = `
        <div class="card" style="margin:12px;background:linear-gradient(135deg,#fff3e0 0%,#fff 100%);border:1px solid #ffe0b2">
          <div class="title" style="display:flex;align-items:center;gap:6px;color:#bf360c"><i data-lucide="wallet"></i>AIC 余额</div>
          <div class="kv"><div class="k">当前余额</div><div class="v price-big" style="color:#e65100">${fmtAic(u.aicBalance)} AIC</div></div>
          <div class="kv"><div class="k">已消耗</div><div class="v" style="color:#999">${fmtAic(u.aicTotalConsumed)} AIC（不可退）</div></div>
          <div class="kv"><div class="k">已退款</div><div class="v" style="color:#999">${fmtAic(u.aicTotalRefunded)} AIC</div></div>
        </div>
        <div class="card"><div class="title">退款金额</div><div style="font-size:13px;color:#666;margin-top:8px">本次可退：<b style="color:#e65100">${fmtAic(u.aicBalance)} AIC</b>（¥${fmtAic(u.aicBalance)}）</div><div style="font-size:11px;color:#999;margin-top:4px">仅可退还剩余未消耗的AIC余额，已消耗部分不可退</div></div>
        <div class="card"><div class="title">确认退款</div><div class="field" style="padding:0;margin-top:8px"><textarea class="textarea" id="refundNote" placeholder="退款原因（选填）"></textarea></div></div>
        <div style="padding:16px"><button class="btn block" id="submitRefund"><i data-lucide="send"></i>提交退款申请（${fmtAic(amount)} AIC）</button></div>
        <div style="text-align:center;font-size:11px;color:#999">提交后等待运营审核，审核通过将原路退回</div>
      `;
      document.getElementById('submitRefund').onclick = () => {
        openModal(`
          <i data-lucide="alert-circle" style="width:40px;height:40px;color:#f57c00;margin-bottom:8px"></i>
          <p style="font-size:14px;font-weight:600;color:#333">确认提交退款申请？</p>
          <p style="font-size:13px;color:#666;margin-top:8px">本次申请 <b style="color:#e65100">${fmtAic(amount)} AIC</b>（¥${fmtAic(amount)}）</p>
          <p style="font-size:11px;color:#999;margin-top:8px">提交后等待运营审核，审核通过将原路退回</p>
          <button class="btn block" style="margin-top:12px" id="confirmRefund"><i data-lucide="check"></i>确认提交</button>
          <button class="btn muted block" style="margin-top:6px" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button>
        `, '确认退款');
        document.getElementById('confirmRefund').onclick = () => {
          const ss = Store.get();
          const note = document.getElementById('refundNote').value.trim();
          ss.refundRequests.unshift({
            id: Store.uid('RF'), userId: ss.currentUser.id, user: ss.currentUser.company,
            requestedAic: amount, status: 'pending', createdAt: Date.now(), note,
          });
          Store.log('退款申请', ss.currentUser.company + ' 申请退款 ' + amount + ' AIC', ss.currentUser.company);
          Store.set(ss);
          closeModal();
          toast('退款申请已提交');
          setTimeout(() => reset('profile'), 600);
        };
      };
    };
    draw();
  });

  // ==================== AIC 消耗记录 ====================
  register('aicConsumption', () => {
    setNav('AIC 消耗记录');
    const s = Store.get();
    const records = s.aicConsumptions.filter(c => c.userId === s.currentUser.id).sort((a, b) => b.createdAt - a.createdAt);
    $page.innerHTML = records.length ? '<div style="padding:12px">' + records.map(c => `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div><div class="title">${U.escapeHtml(c.refName)}</div><div style="font-size:11px;color:#999">${c.refType === 'report' ? '报告' : '增值服务'}</div></div>
          <div style="font-size:13px;color:#e65100;font-weight:600">-${fmtAic(c.aicCost)} AIC</div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:#999"><span>Token: ${(c.tokens || 0).toLocaleString()}</span><span>${U.fmtDate(c.createdAt)}</span></div>
      </div>
    `).join('') + '</div>' : '<div class="empty">暂无消耗记录<br><span style="font-size:12px;color:#999">下单报告或使用增值服务后产生记录</span></div>';
  });

  // ==================== 订单中心 ====================
  register('orders', () => {
    setNav('订单中心');
    const s = Store.get();
    const orders = s.orders.filter(o => o.userId === s.currentUser.id).sort((a, b) => b.createdAt - a.createdAt);
    const vasOrders = s.vasOrders.filter(o => o.userId === s.currentUser.id).sort((a, b) => b.createdAt - a.createdAt);
    let tab = 'report';
    const draw = () => {
      const $l = document.getElementById('oList');
      if (tab === 'report') {
        $l.innerHTML = orders.length ? orders.map(o => `
          <div class="card" data-oid="${o.id}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div class="title" style="flex:1">${U.escapeHtml(o.refName)}${o.tierName ? '<span style="font-size:11px;color:#999;font-weight:400">（' + U.escapeHtml(o.tierName) + '）</span>' : ''}</div>
              ${o.reportStatus === 'ready' ? '<span class="tag green">已完成</span>' : '<span class="tag orange">生成中</span>'}
            </div>
            <div class="kv"><div class="k">订单号</div><div class="v">${o.id}</div></div>
            <div class="kv"><div class="k">消耗</div><div class="v">${o.reportStatus === 'ready' ? '<span class="tag" style="background:#fff3e0;color:#e65100"><i data-lucide="wallet" style="width:11px;height:11px;vertical-align:middle"></i> ' + (o.aicCost || 0) + ' AIC</span>' : '<span style="font-size:11px;color:#999">报告生成后结算</span>'}</div></div>
            <div class="kv"><div class="k">下单时间</div><div class="v">${U.fmtDate(o.createdAt)}</div></div>
            <div style="margin-top:8px;display:flex;gap:8px;justify-content:flex-end">
              ${o.reportStatus === 'ready' && !o.invoiceId ? '<button class="btn sm ghost" data-invoice="' + o.id + '"><i data-lucide="receipt"></i>开发票</button>' : ''}
              <button class="btn sm" data-oid="' + o.id + '"><i data-lucide="eye"></i>详情</button>
            </div>
          </div>
        `).join('') : '<div class="empty">暂无报告订单<br><span style="font-size:12px;color:#999">充值 AIC 后即可生成企业报告</span></div>';
      } else {
        $l.innerHTML = vasOrders.length ? vasOrders.map(o => {
          const tokenMin = (o.estTokenMin || 0) / 10000;
          const tokenMax = (o.estTokenMax || 0) / 10000;
          const svipTag = o.svip ? '<span class="tag" style="background:#fbf6ec;color:#5d4037"><i data-lucide="crown" style="width:11px;height:11px;vertical-align:middle"></i> SVIP免费</span>' : '';
          const aicInfo = !o.svip && o.aicCost ? ' <span class="tag" style="background:#fff3e0;color:#e65100"><i data-lucide="wallet" style="width:11px;height:11px;vertical-align:middle"></i> ' + fmtAic(o.aicCost) + ' AIC</span>' : '';
          const estInfo = !o.svip && !o.aicCost && tokenMin > 0 ? '<div class="kv"><div class="k">预估 Token</div><div class="v">' + tokenMin.toFixed(1) + ' 万 ~ ' + tokenMax.toFixed(1) + ' 万</div></div><div class="kv"><div class="k">计费方式</div><div class="v" style="font-size:11px;color:#999">服务完成后按实际 token 消耗结算</div></div>' : '';
          return '<div class="card" data-vid="' + o.id + '"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div class="title" style="flex:1">' + U.escapeHtml(o.serviceName) + '</div>' + svipTag + aicInfo + '</div><div class="kv"><div class="k">订单号</div><div class="v">' + o.id + '</div></div><div class="kv"><div class="k">服务进度</div><div class="v">' + ({ pending: '待处理', in_progress: '进行中', completed: '已完成', closed: '已关闭' })[o.progress] || o.progress + '</div></div>' + estInfo + '<div class="kv"><div class="k">需求说明</div><div class="v">' + U.escapeHtml(o.note || '-') + '</div></div><div class="kv"><div class="k">下单时间</div><div class="v">' + U.fmtDate(o.createdAt) + '</div></div></div>';
        }).join('') : '<div class="empty">暂无服务订单<br><span style="font-size:12px;color:#999">订购第三方增值服务后显示</span></div>';
      }
      $l.querySelectorAll('[data-oid]').forEach(el => el.addEventListener('click', () => go('orderDetail', { id: el.dataset.oid })));
      $l.querySelectorAll('[data-invoice]').forEach(b => b.onclick = (e) => { e.stopPropagation(); go('invoiceApply', { orderId: b.dataset.invoice }); });
    };
    $page.innerHTML = '<div class="scroll-x" id="oTabs"><div class="chip active" data-t="report">报告订单 (' + orders.length + ')</div><div class="chip" data-t="vas">服务订单 (' + vasOrders.length + ')</div></div><div style="padding:0 12px;margin-top:8px" id="oList"></div>';
    document.getElementById('oTabs').addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (!c) return; tab = c.dataset.t; [...e.currentTarget.children].forEach(x => x.classList.toggle('active', x.dataset.t === tab)); draw(); });
    draw();
  });

  register('orderDetail', ({ id }) => {
    setNav('订单详情');
    const s = Store.get();
    const o = s.orders.find(x => x.id === id);
    if (!o) { $page.innerHTML = '<div class="empty">订单不存在</div>'; return; }
    const ct = s.contracts.find(c => c.orderId === id);
    const inv = s.invoices.find(i => i.orderId === id);
    const gr = s.generatedReports.find(g => g.orderId === id);
    const tplCt = s.contractTemplates.find(t => t.id === ct?.templateId);
    $page.innerHTML = `
      <div class="card"><div class="title">${U.escapeHtml(o.refName)}${o.tierName ? ' <span style="font-size:13px;color:#999">(' + U.escapeHtml(o.tierName) + ')</span>' : ''}</div><div class="kv"><div class="k">订单号</div><div class="v">${o.id}</div></div><div class="kv"><div class="k">分析对象</div><div class="v">${U.escapeHtml(o.target || '-')}</div></div><div class="kv"><div class="k">消耗 AIC</div><div class="v">${o.reportStatus === 'ready' ? '<span style="color:#e65100;font-weight:600">' + (o.aicCost || 0) + ' AIC</span>' : '<span style="font-size:11px;color:#999">报告生成后结算</span>'}</div></div><div class="kv"><div class="k">支付方式</div><div class="v">${U.escapeHtml(o.payMethod || '-')}</div></div><div class="kv"><div class="k">下单时间</div><div class="v">${U.fmtDate(o.createdAt)}</div></div>${o.paidAt ? '<div class="kv"><div class="k">支付时间</div><div class="v">' + U.fmtDate(o.paidAt) + '</div></div>' : ''}</div>
      ${ct ? '<div class="card"><div class="title">电子合同</div><div class="kv"><div class="k">合同号</div><div class="v">' + ct.id + '</div></div><div class="kv"><div class="k">签署时间</div><div class="v">' + U.fmtDate(ct.signedAt) + '</div></div>' + (ct.sealed ? '<div class="kv"><div class="k">签章</div><div class="v"><span class="tag green">已盖章</span></div></div>' : '') + '<button class="btn ghost sm" id="viewCt2" style="margin-top:8px"><i data-lucide="file-text"></i>查看合同</button></div>' : ''}
      ${gr ? '<div class="card"><div class="title">生成报告</div><div class="kv"><div class="k">报告标题</div><div class="v">' + U.escapeHtml(gr.title) + '</div></div><div class="kv"><div class="k">摘要</div><div class="v">' + U.escapeHtml(gr.summary || '-') + '</div></div><div class="kv"><div class="k">生成时间</div><div class="v">' + U.fmtDate(gr.generatedAt) + '</div></div><button class="btn sm" id="previewRpt" style="margin-top:6px"><i data-lucide="eye"></i>预览报告</button></div>' : (o.reportStatus === 'generating' ? '<div class="card"><div style="text-align:center;padding:16px"><i data-lucide="loader" style="width:28px;height:28px;animation:spin 2s linear infinite"></i><p style="font-size:13px;color:#666;margin-top:8px">报告生成中...</p></div></div>' : '')}
      ${inv ? '<div class="card"><div class="title">发票信息</div><div class="kv"><div class="k">发票抬头</div><div class="v">' + U.escapeHtml(inv.title) + '</div></div><div class="kv"><div class="k">发票号</div><div class="v">' + inv.no + '</div></div><div class="kv"><div class="k">开票时间</div><div class="v">' + U.fmtDate(inv.issuedAt) + '</div></div></div>' : (!inv && o.payStatus === 'paid' ? '<div style="padding:16px"><button class="btn block" id="askInv"><i data-lucide="receipt"></i>申请开发票</button></div>' : '')}
    `;
    const v2 = document.getElementById('viewCt2');
    if (v2) v2.onclick = () => {
      const content = (tplCt?.content || '').replace('{{company}}', o.user).replace('{{product}}', o.refName);
      openModal('<pre style="white-space:pre-wrap;font-size:12px;color:#333;line-height:1.7">' + U.escapeHtml(content) + '\n----- 已电子签章 -----\n甲方：' + o.user + '\n乙方：企融通 [电子章]\n时间：' + U.fmtDate(ct.signedAt) + '</pre><button class="btn block" onclick="document.getElementById(\'modalMask\').classList.remove(\'show\')"><i data-lucide="x"></i>关闭</button>', '电子合同');
    };
    const pv = document.getElementById('previewRpt');
    if (pv) pv.onclick = () => go('reportPreview', { orderId: o.id });
    const ai = document.getElementById('askInv'); if (ai) ai.onclick = () => go('invoiceApply', { orderId: o.id });
  });

  // ==================== 已购报告 ====================
  register('purchasedReports', () => {
    setNav('我的报告库');
    const s = Store.get();
    const list = s.purchasedReports.filter(p => p.userId === s.currentUser.id).sort((a, b) => b.purchasedAt - a.purchasedAt);
    $page.innerHTML = list.length ? '<div style="padding:12px">' + list.map(p => `
      <div class="card">
        <div class="title">${U.escapeHtml(p.reportName)}${p.tierName ? ' <span style="font-size:12px;color:#999">(' + U.escapeHtml(p.tierName) + ')</span>' : ''}</div>
        <div class="kv"><div class="k">分析对象</div><div class="v">${U.escapeHtml(p.target || '-')}</div></div>
        <div class="kv"><div class="k">消耗</div><div class="v">${p.reportStatus === 'ready' ? '<span style="color:#e65100;font-weight:600">' + (p.aicCost || 0) + ' AIC</span>' : '<span style="font-size:11px;color:#999">报告生成后结算</span>'}</div></div>
        <div class="kv"><div class="k">购买时间</div><div class="v">${U.fmtDate(p.purchasedAt)}</div></div>
        <div class="kv"><div class="k">报告状态</div><div class="v">${p.reportStatus === 'ready' ? '<span class="tag green"><i data-lucide="check-circle" style="width:11px;height:11px;vertical-align:middle"></i> 已生成</span>' : '<span class="tag orange">生成中</span>'}</div></div>
        ${p.reportStatus === 'ready' ? '<div style="margin-top:8px;display:flex;gap:8px"><button class="btn ghost sm" data-pre="' + p.id + '"><i data-lucide="eye"></i>预览</button><button class="btn sm" data-dl="' + p.id + '"><i data-lucide="download"></i>下载 PDF</button></div>' : '<div style="margin-top:6px;font-size:11px;color:#999"><i data-lucide="clock" style="width:12px;height:12px;vertical-align:middle"></i> 系统正在生成，完成后自动推送</div>'}
      </div>
    `).join('') + '</div>' : '<div class="empty">暂无已购报告</div>';
    $page.querySelectorAll('[data-pre]').forEach(b => b.onclick = () => {
      const r = list.find(x => x.id === b.dataset.pre);
      if (!r) return;
      const gr = s.generatedReports.find(g => g.orderId === r.orderId);
      openModal('<div style="font-size:13px;line-height:1.8;color:#333"><h3 style="margin:0 0 10px">' + U.escapeHtml(r.reportName) + '</h3><div><strong>分析对象</strong>：' + U.escapeHtml(r.target) + '</div>' + (gr ? '<p>' + U.escapeHtml(gr.summary || '') + '</p>' : '') + '<p>本报告基于公开工商数据、司法数据、招投标数据、舆情数据，由 AI 大模型综合分析输出。</p><p>一、企业概览：注册资本充足，经营状态正常。</p><p>二、经营状况：营业收入近三年保持稳定增长。</p><p>三、风险评估：暂未发现重大涉诉/经营异常风险。</p><p>...（完整内容见 PDF 下载）</p></div>', '报告预览');
    });
    $page.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => toast('PDF 已开始下载（演示）'));
  });

  // ==================== 报告预览 ====================
  register('reportPreview', ({ orderId }) => {
    setNav('报告预览');
    const s = Store.get();
    const o = s.orders.find(x => x.id === orderId);
    const gr = s.generatedReports.find(g => g.orderId === orderId);
    const r = s.reports.find(x => x.id === o?.refId);
    if (!gr || !o) { $page.innerHTML = '<div class="empty">报告尚未生成</div>'; return; }
    $page.innerHTML = `
      <div style="padding:16px;font-size:13px;line-height:1.8;color:#333">
        <h3 style="margin:0 0 4px;color:#333">${U.escapeHtml(gr.title)}</h3>
        <div style="font-size:11px;color:#999;margin-bottom:10px">分析对象：${U.escapeHtml(gr.target || o.target)} · 生成时间：${U.fmtDate(gr.generatedAt)} · ${U.escapeHtml(gr.user || o.user)}</div>
        <p>${U.escapeHtml(gr.summary || '')}</p>
        <div style="margin-bottom:12px"><div style="font-weight:600;color:#1976d2;margin-bottom:4px">1. 企业概览</div><p>注册资本充足，经营状态正常，无重大经营异常记录。</p></div>
        <div style="margin-bottom:12px"><div style="font-weight:600;color:#1976d2;margin-bottom:4px">2. 经营分析</div><p>营业收入近三年保持稳定增长，利润率高于行业平均值。</p></div>
        <div style="margin-bottom:12px"><div style="font-weight:600;color:#1976d2;margin-bottom:4px">3. 风险评估</div><p>暂未发现重大涉诉风险，信用状况良好。</p></div>
        <div style="margin-top:14px;padding-top:10px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center">—— 本报告由企融通 AI 智能生成 · 仅供参考 ——</div>
      </div>
      <div style="text-align:center;padding:16px"><button class="btn" onclick="go('purchasedReports',{})"><i data-lucide="arrow-left"></i>返回报告库</button></div>
    `;
  });

  // ==================== 企业信息 ====================
  register('enterpriseInfo', () => {
    setNav('企业信息', { text: '编辑', onClick: () => editEnterprise() });
    const s = Store.get(); const u = s.currentUser;
    $page.innerHTML = `
      <div class="card"><div class="kv"><div class="k">企业名称</div><div class="v">${U.escapeHtml(u.company)}</div></div><div class="kv"><div class="k">统一社会信用代码</div><div class="v">${U.escapeHtml(u.creditCode)}</div></div><div class="kv"><div class="k">联系人</div><div class="v">${U.escapeHtml(u.contact)}</div></div><div class="kv"><div class="k">手机号</div><div class="v">${U.escapeHtml(u.phone)}</div></div></div>
      <div class="card"><div class="title">认证状态</div><div style="margin-top:10px">${u.authStatus === 'verified' ? '<span class="tag green">已认证</span>' : u.authStatus === 'pending' ? '<span class="tag orange">审核中</span>' : u.authStatus === 'rejected' ? '<span class="tag red">已驳回</span>' : '<span class="tag gray">未认证</span>'}</div>${u.authStatus === 'rejected' && u.authNote ? '<div class="desc" style="margin-top:8px">驳回原因：' + U.escapeHtml(u.authNote) + '</div>' : ''}<div class="title" style="margin-top:14px">资质文件</div><div style="margin-top:8px;font-size:13px;color:#555">${u.authMaterials.length ? u.authMaterials.map(f => '📎 ' + U.escapeHtml(f)).join('<br>') : '<span style="color:#aaa">尚未上传</span>'}</div>${u.authStatus !== 'verified' ? '<button class="btn block" id="submitAuth" style="margin-top:14px"><i data-lucide="' + (u.authStatus === 'pending' ? 'x-circle' : 'check-circle') + '"></i>' + (u.authStatus === 'pending' ? '撤销审核' : '提交认证') + '</button>' : ''}</div>
    `;
    const sb = document.getElementById('submitAuth');
    if (sb) sb.onclick = () => {
      const ss = Store.get();
      if (ss.currentUser.authStatus === 'pending') { ss.currentUser.authStatus = 'unverified'; ss.users.find(x => x.id === ss.currentUser.id).authStatus = 'unverified'; Store.log('撤销认证', ss.currentUser.company + ' 撤销认证申请', ss.currentUser.company); Store.set(ss); toast('已撤销'); return; }
      ss.currentUser.authStatus = 'pending'; ss.currentUser.authMaterials = ['营业执照.pdf', '法人身份证.pdf'];
      const u2 = ss.users.find(x => x.id === ss.currentUser.id); if (u2) u2.authStatus = 'pending';
      Store.log('提交认证', ss.currentUser.company + ' 提交企业认证', ss.currentUser.company);
      Store.set(ss); toast('已提交认证，等待审核');
    };
  });

  function editEnterprise() {
    const u = Store.get().currentUser;
    openModal('<div class="field" style="padding:0"><label>企业名称</label><input class="input" id="ec" value="' + U.escapeHtml(u.company) + '"/></div><div class="field" style="padding:0"><label>联系人</label><input class="input" id="ek" value="' + U.escapeHtml(u.contact) + '"/></div><div class="field" style="padding:0"><label>手机号</label><input class="input" id="ep" value="' + U.escapeHtml(u.phone) + '"/></div><button class="btn block" id="saveE"><i data-lucide="save"></i>保存</button>', '编辑企业信息');
    document.getElementById('saveE').onclick = () => {
      const ss = Store.get();
      ss.currentUser.company = document.getElementById('ec').value.trim() || ss.currentUser.company;
      ss.currentUser.contact = document.getElementById('ek').value.trim() || ss.currentUser.contact;
      ss.currentUser.phone = document.getElementById('ep').value.trim() || ss.currentUser.phone;
      const u2 = ss.users.find(x => x.id === ss.currentUser.id); if (u2) { u2.company = ss.currentUser.company; u2.phone = ss.currentUser.phone; }
      Store.set(ss); closeModal(); toast('已保存');
    };
  }

  // ==================== 政策收藏 ====================
  register('policyFavs', () => {
    setNav('政策收藏夹');
    const s = Store.get();
    const list = s.policies.filter(p => s.policyFavs.includes(p.id));
    $page.innerHTML = list.length ? '<div style="padding:12px">' + list.map(p => '<div class="policy-row" data-pid="' + p.id + '"><div class="pt">' + U.escapeHtml(p.title) + '</div><div class="ps">' + U.escapeHtml(p.summary) + '</div><div class="pm"><span class="tag">' + p.region + '</span><span class="tag gray">' + p.cate + '</span></div></div>').join('') + '</div>' : '<div class="empty">暂无收藏的政策</div>';
    $page.querySelectorAll('[data-pid]').forEach(el => el.onclick = () => go('policyDetail', { id: el.dataset.pid }));
  });

  // ==================== 发票管理 ====================
  register('invoiceProfiles', () => {
    setNav('发票管理', { text: '+ 抬头', onClick: () => editInvoiceProfile() });
    const s = Store.get();
    const list = s.invoiceProfiles.filter(p => p.userId === s.currentUser.id);
    $page.innerHTML = `
      <div class="section-head" style="margin-top:8px">发票抬头</div>
      <div style="padding:0 12px">${list.length ? list.map(p => '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div class="title">' + U.escapeHtml(p.title) + (p.isDefault ? ' <span class="tag green">默认</span>' : '') + '</div><button class="btn sm muted" data-edit="' + p.id + '">编辑</button></div><div class="kv"><div class="k">税号</div><div class="v">' + U.escapeHtml(p.taxNo) + '</div></div><div class="kv"><div class="k">地址电话</div><div class="v">' + U.escapeHtml(p.address) + ' ' + U.escapeHtml(p.phone) + '</div></div><div class="kv"><div class="k">开户行</div><div class="v">' + U.escapeHtml(p.bank) + ' ' + U.escapeHtml(p.bankNo) + '</div></div>' + (!p.isDefault ? '<div style="margin-top:8px;text-align:right"><button class="btn sm ghost" data-default="' + p.id + '"><i data-lucide="check"></i>设为默认</button></div>' : '') + '</div>').join('') : '<div class="empty">尚未添加抬头</div>'}</div>
      <div class="section-head">开票申请记录</div><div style="padding:0 12px" id="invList"></div>
      <div class="section-head">已开票记录</div><div style="padding:0 12px" id="invDoneList"></div>
    `;
    const reqs = s.invoiceRequests.filter(r => r.userId === s.currentUser.id);
    const invs = s.invoices.filter(i => i.userId === s.currentUser.id);
    document.getElementById('invList').innerHTML = reqs.length ? reqs.map(r => '<div class="card"><div class="kv"><div class="k">订单</div><div class="v">' + r.orderId + '</div></div><div class="kv"><div class="k">抬头</div><div class="v">' + U.escapeHtml(r.title) + '</div></div><div class="kv"><div class="k">金额</div><div class="v">' + U.fmtMoney(r.amount) + '</div></div><div class="kv"><div class="k">状态</div><div class="v">' + ({ pending: '<span class="tag orange">待审核</span>', approved: '<span class="tag green">已开票</span>', rejected: '<span class="tag red">已驳回</span>' })[r.status] + '</div></div>' + (r.note ? '<div class="kv"><div class="k">备注</div><div class="v">' + U.escapeHtml(r.note) + '</div></div>' : '') + '</div>').join('') : '<div class="empty">暂无申请</div>';
    document.getElementById('invDoneList').innerHTML = invs.length ? invs.map(i => '<div class="card"><div class="kv"><div class="k">发票号</div><div class="v">' + i.no + '</div></div><div class="kv"><div class="k">抬头</div><div class="v">' + U.escapeHtml(i.title) + '</div></div><div class="kv"><div class="k">金额</div><div class="v">' + U.fmtMoney(i.amount) + '</div></div><div class="kv"><div class="k">开票时间</div><div class="v">' + U.fmtDate(i.issuedAt) + '</div></div><div style="display:flex;gap:8px;margin-top:8px"><button class="btn sm ghost" data-mail="' + i.id + '"><i data-lucide="mail"></i>重发</button><button class="btn sm" data-pdf="' + i.id + '"><i data-lucide="download"></i>下载 PDF</button></div></div>').join('') : '<div class="empty">暂无发票</div>';
    $page.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editInvoiceProfile(b.dataset.edit));
    $page.querySelectorAll('[data-default]').forEach(b => b.onclick = () => { const ss = Store.get(); ss.invoiceProfiles.forEach(p => { if (p.userId === ss.currentUser.id) p.isDefault = (p.id === b.dataset.default); }); Store.set(ss); toast('已设为默认'); });
    $page.querySelectorAll('[data-mail]').forEach(b => b.onclick = () => toast('已发送至邮箱'));
    $page.querySelectorAll('[data-pdf]').forEach(b => b.onclick = () => toast('PDF 已开始下载'));
  });

  function editInvoiceProfile(id) {
    const s = Store.get();
    const p = id ? s.invoiceProfiles.find(x => x.id === id) : { id: '', userId: s.currentUser.id, isDefault: false, title: '', taxNo: '', address: '', phone: '', bank: '', bankNo: '' };
    openModal('<div class="field" style="padding:0"><label>发票抬头</label><input class="input" id="ipt" value="' + U.escapeHtml(p.title) + '"/></div><div class="field" style="padding:0"><label>纳税人识别号</label><input class="input" id="ipx" value="' + U.escapeHtml(p.taxNo) + '"/></div><div class="field" style="padding:0"><label>地址</label><input class="input" id="ipa" value="' + U.escapeHtml(p.address) + '"/></div><div class="field" style="padding:0"><label>电话</label><input class="input" id="ipp" value="' + U.escapeHtml(p.phone) + '"/></div><div class="field" style="padding:0"><label>开户行</label><input class="input" id="ipb" value="' + U.escapeHtml(p.bank) + '"/></div><div class="field" style="padding:0"><label>账号</label><input class="input" id="ipn" value="' + U.escapeHtml(p.bankNo) + '"/></div><button class="btn block" id="saveIp"><i data-lucide="save"></i>保存</button>', id ? '编辑抬头' : '新增抬头');
    document.getElementById('saveIp').onclick = () => {
      const title = document.getElementById('ipt').value.trim();
      const taxNo = document.getElementById('ipx').value.trim();
      if (!title || !taxNo) { toast('抬头和税号必填'); return; }
      const ss = Store.get();
      if (id) { const t = ss.invoiceProfiles.find(x => x.id === id); Object.assign(t, { title, taxNo, address: document.getElementById('ipa').value.trim(), phone: document.getElementById('ipp').value.trim(), bank: document.getElementById('ipb').value.trim(), bankNo: document.getElementById('ipn').value.trim() }); }
      else { ss.invoiceProfiles.push({ id: Store.uid('IP'), userId: ss.currentUser.id, isDefault: ss.invoiceProfiles.filter(x => x.userId === ss.currentUser.id).length === 0, title, taxNo, address: document.getElementById('ipa').value.trim(), phone: document.getElementById('ipp').value.trim(), bank: document.getElementById('ipb').value.trim(), bankNo: document.getElementById('ipn').value.trim() }); }
      Store.set(ss); closeModal(); toast('已保存');
    };
  }

  register('invoiceApply', ({ orderId }) => {
    setNav('申请开发票');
    const s = Store.get();
    const o = s.orders.find(x => x.id === orderId);
    if (!o) { $page.innerHTML = '<div class="empty">订单不存在</div>'; return; }
    const profiles = s.invoiceProfiles.filter(p => p.userId === s.currentUser.id);
    let pickedId = (profiles.find(p => p.isDefault) || profiles[0])?.id;
    const draw = () => {
      $page.innerHTML = '<div class="card"><div class="kv"><div class="k">订单号</div><div class="v">' + o.id + '</div></div><div class="kv"><div class="k">商品</div><div class="v">' + U.escapeHtml(o.refName) + '</div></div><div class="kv"><div class="k">开票金额</div><div class="v price-big">' + U.fmtMoney(o.amount) + '</div></div></div><div class="section-head">选择发票抬头</div><div style="padding:0 12px">' + profiles.map(p => '<div class="card" style="border:1px solid ' + (pickedId === p.id ? '#4a6cf7' : 'transparent') + '" data-pid="' + p.id + '"><div class="title">' + U.escapeHtml(p.title) + (p.isDefault ? ' <span class="tag green">默认</span>' : '') + '</div><div class="kv"><div class="k">税号</div><div class="v">' + U.escapeHtml(p.taxNo) + '</div></div></div>').join('') + (!profiles.length ? '<div class="empty">请先在「我的-发票管理」添加抬头</div>' : '') + '</div><div class="field"><label>接收邮箱</label><input class="input" id="iemail" placeholder="邮箱（接收电子发票）" /></div><div class="bottom-bar"><button class="btn block" id="submitInv"><i data-lucide="send"></i>提交申请</button></div>';
      $page.querySelectorAll('[data-pid]').forEach(c => c.onclick = () => { pickedId = c.dataset.pid; draw(); });
      document.getElementById('submitInv').onclick = () => {
        if (!pickedId) { toast('请选择抬头'); return; }
        const email = document.getElementById('iemail').value.trim();
        if (!email) { toast('请填写邮箱'); return; }
        const ss = Store.get();
        const p = ss.invoiceProfiles.find(x => x.id === pickedId);
        ss.invoiceRequests.unshift({ id: Store.uid('IR'), orderId: o.id, userId: ss.currentUser.id, user: ss.currentUser.company, title: p.title, taxNo: p.taxNo, amount: o.amount, email, status: 'pending', createdAt: Date.now(), note: '' });
        Store.log('开票申请', '订单 ' + o.id + ' 申请开票', ss.currentUser.company);
        Store.set(ss); toast('已提交，等待审核'); setTimeout(back, 600);
      };
    };
    draw();
  });

  // ==================== 安全 + 关于 ====================
  register('security', () => {
    setNav('账号安全');
    const u = Store.get().currentUser;
    $page.innerHTML = '<div class="card" style="padding:0"><div class="list-item"><div class="body"><div class="t">手机号</div><div class="d">' + U.escapeHtml(u.phone) + '</div></div><div class="arrow">&rsaquo;</div></div><div class="list-item"><div class="body"><div class="t">登录密码</div><div class="d">建议每 90 天更换一次</div></div><div class="arrow">&rsaquo;</div></div><div class="list-item"><div class="body"><div class="t">微信授权</div><div class="d">已绑定微信</div></div><div class="arrow">&rsaquo;</div></div></div>';
    $page.querySelectorAll('.list-item').forEach(el => el.onclick = () => toast('演示项'));
  });

  register('businessIntent', () => {
    setNav('业务意向填报');
    const s = Store.get();
    $page.innerHTML = `
      <div class="card" style="padding:20px;">
        <div class="title" style="margin-bottom:16px;font-size:16px;font-weight:700;color:#1976d2;">业务意向调研</div>
        <div style="font-size:12px;color:#999;margin-bottom:20px;line-height:1.6;">
          为保障后续业务顺畅衔接，我们希望提前了解您的业务意向。<br/>
          所有字段均为选填，仅用于前期意向摸排。
        </div>
        <div class="kv" style="margin-bottom:12px;">
          <div class="k">合作机构名称</div>
          <input type="text" id="biOrgName" placeholder="请输入合作机构名称" style="width:100%;padding:10px 12px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;background:#fff;">
        </div>
        <div class="kv" style="margin-bottom:12px;">
          <div class="k">业务到期日期</div>
          <input type="date" id="biExpireDate" style="width:100%;padding:10px 12px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;background:#fff;">
        </div>
        <div class="kv" style="margin-bottom:20px;">
          <div class="k">到期对应资金规模（元）</div>
          <input type="number" id="biAmount" placeholder="请输入资金规模" style="width:100%;padding:10px 12px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;background:#fff;">
        </div>
        <button class="btn block" id="submitBi" style="background:#1976d2;color:#fff;font-weight:600;">提交意向</button>
      </div>
    `;
    document.getElementById('submitBi').onclick = () => {
      const orgName = document.getElementById('biOrgName').value.trim();
      const expireDate = document.getElementById('biExpireDate').value;
      const amount = parseFloat(document.getElementById('biAmount').value) || 0;
      if (!orgName && !expireDate && amount === 0) {
        toast('请至少填写一项信息');
        return;
      }
      const s2 = Store.get();
      const intent = {
        id: Store.uid('BI'),
        userId: s2.currentUser.id,
        company: s2.currentUser.company,
        orgName: orgName,
        expireDate: expireDate ? new Date(expireDate).getTime() : null,
        amount: amount,
        createdAt: Date.now(),
      };
      s2.businessIntents = s2.businessIntents || [];
      s2.businessIntents.unshift(intent);
      Store.set(s2);
      Store.log('业务意向提交', s2.currentUser.company + ' 提交业务意向', s2.currentUser.company);
      toast('提交成功！感谢您的反馈');
      setTimeout(() => reset('profile'), 800);
    };
  });

  register('about', () => {
    setNav('关于 / 帮助');
    const s = Store.get();
    $page.innerHTML = '<div class="card"><div class="title">企融通小程序</div><div class="kv"><div class="k">版本</div><div class="v">v' + s.version + '</div></div><div class="kv"><div class="k">客服电话</div><div class="v">400-888-0000</div></div><div class="kv"><div class="k">客服邮箱</div><div class="v">support@qrt-service.cn</div></div></div><div class="card" style="padding:0"><div class="list-item"><div class="body"><div class="t">用户协议</div></div><div class="arrow">&rsaquo;</div></div><div class="list-item"><div class="body"><div class="t">隐私政策</div></div><div class="arrow">&rsaquo;</div></div><div class="list-item"><div class="body"><div class="t">常见问题</div></div><div class="arrow">&rsaquo;</div></div><div class="list-item" id="resetBtn" style="color:#f56c6c"><div class="body"><div class="t" style="color:#f56c6c">重置演示数据</div><div class="d">清空所有演示数据</div></div><div class="arrow">&rsaquo;</div></div></div>';
    document.getElementById('resetBtn').onclick = () => { if (!confirm('确定重置所有演示数据？')) return; Store.reset(); toast('已重置'); setTimeout(() => reset('home'), 400); };
    $page.querySelectorAll('.list-item:not(#resetBtn)').forEach(el => el.onclick = () => toast('演示项'));
  });

  // 启动：检查登录状态
  const s = Store.get();
  if (s.isLoggedIn) {
    reset('home');
  } else {
    reset('login');
  }
  if (window.lucide) { lucide.createIcons(); }

  window.__app_register = register;
  window.__app_go = go;
  window.__app_reset = reset;
  window.__app_setNav = setNav;
  window.__app_page = $page;
})();
