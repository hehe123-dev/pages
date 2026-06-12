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
    if (stack.length <= 1) {
      reset('home');
      return;
    }
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
    $navRight.textContent = '';
    $navRight.onclick = null;
    const isTab = ['home', 'reports', 'vas', 'policy', 'profile'].includes(top.name);
    $tabBar.style.display = isTab ? 'flex' : 'none';
    $navBack.style.display = isTab ? 'none' : 'flex';
    $page.scrollTop = 0;
    $page.innerHTML = '';
    $page.style.overflow = (top.name === 'aiChat') ? 'hidden' : 'auto';
    routes[top.name](top.params);
    [...$tabBar.children].forEach(t => {
      t.classList.toggle('active', t.dataset.tab === top.name);
    });
    // 重新初始化 Lucide 图标
    if (window.lucide) {
      setTimeout(() => lucide.createIcons(), 0);
    }
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
  // Modal（底部弹层）
  function openModal(html, title) {
    $modal.innerHTML = (title ? `<h3>${U.escapeHtml(title)}</h3>` : '') + html;
    $modalMask.classList.add('show');
  }
  function closeModal() { $modalMask.classList.remove('show'); }
  $modalMask.addEventListener('click', (e) => {
    if (e.target === $modalMask) closeModal();
  });

  // 数据订阅：广播变化时按需刷新（跳过交互中的页面避免丢失状态）
  Store.on((evt) => {
    const top = stack[stack.length - 1];
    const skipPages = ['aiChat', 'editInvoiceProfile', 'invoiceApply', 'security', 'about'];
    if (top && !skipPages.includes(top.name)) {
      render();
    }
  });

  // ---------- 页面：首页 ----------
  register('home', () => {
    setNav('企融通平台');
    const s = Store.get();
    const ann = s.announcements.filter(a => a.status === 'on').sort((a, b) => b.publishAt - a.publishAt)[0];
    const promos = s.pricePromos.filter(p => p.status !== 'off');

    const html = `
      <div class="home-banner-card">
        <div class="home-banner-bg">
          <div class="banner-shapes">
            <div class="shape s1"></div>
            <div class="shape s2"></div>
            <div class="shape s3"></div>
          </div>
          <div class="banner-content">
            <div class="banner-title">企融通</div>
            <div class="banner-subtitle">科技金融 · 智享融资</div>
            <div class="banner-tags">
              <span><i data-lucide="sparkles"></i>AI 赋能</span>
              <span><i data-lucide="shield-check"></i>安全可靠</span>
              <span><i data-lucide="zap"></i>极速服务</span>
            </div>
          </div>
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

      ${ann ? `<div class="banner">
        <div class="t"><i data-lucide="megaphone" style="width:14px;height:14px;vertical-align:middle"></i> 平台公告</div>
        <div>${U.escapeHtml(ann.title)}</div>
      </div>` : ''}

      <div class="section-head">热门报告 <span class="more" data-go="reports">全部 ›</span></div>
      <div style="padding:0 12px">
        ${s.reports.slice(0, 3).map(r => `
          <div class="rpt-card" data-rid="${r.id}">
            <div class="rpt-top">
              <span class="rpt-avatar" style="background:${['#1976d2','#388e3c','#f57c00','#7b1fa2','#c62828','#00796b','#f9a825'][s.reports.indexOf(r) % 7]}">${r.name.slice(0,2)}</span>
              <div class="rpt-name-box">
                <p class="rpt-name p-ellipsis">${U.escapeHtml(r.name)}</p>
                <p class="rpt-tags p-ellipsis"><span>${U.escapeHtml(r.cate)}</span></p>
              </div>
              <div class="rpt-buy-btn" data-rid="${r.id}"><span>¥${r.priceBasic}</span>起</div>
            </div>
            <div class="rpt-body">
              <p class="rpt-desc p-ellipsis-2">${U.escapeHtml(r.desc)}</p>
            </div>
            <div class="rpt-bottom">
              <span class="rpt-bottom-item"><i data-lucide="eye"></i>${Math.floor(Math.random()*500+50)}</span>
              <span class="rpt-bottom-item"><i data-lucide="shopping-cart"></i>${Math.floor(Math.random()*50+5)}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="section-head">最新政策 <span class="more" data-go="policy">全部 ›</span></div>
      <div style="padding:0 12px">
        ${s.policies.slice(0, 3).map((p, idx) => `
          <div class="plc-item" data-pid="${p.id}">
            <div class="plc-dot-line">
              <div class="plc-dot ${idx === 0 ? 'active' : ''}"></div>
              ${idx < 2 ? '<div class="plc-line"></div>' : ''}
            </div>
            <div class="plc-card" data-pid="${p.id}">
              <div class="plc-card-title double-line-ellipsis">${U.escapeHtml(p.title)}</div>
              <div class="plc-card-meta"><span class="tag">${p.region}</span><span class="tag gray">${p.cate}</span></div>
            </div>
          </div>
        `).join('')}
      </div>

      ${promos.length ? `
      <div class="section-head"><i data-lucide="zap" style="width:16px;height:16px;vertical-align:middle;margin-right:4px"></i>限时优惠</div>
      <div style="padding:0 12px">
        ${promos.map(p => `<div class="card"><div class="title">${U.escapeHtml(p.title)}</div><div class="desc">${U.escapeHtml(p.desc || '')}</div></div>`).join('')}
      </div>` : ''}

      <div style="height:30px"></div>
    `;
    $page.innerHTML = html;
    $page.querySelectorAll('[data-go]').forEach(el =>
      el.addEventListener('click', () => reset(el.dataset.go))
    );
    $page.querySelectorAll('[data-rid]').forEach(el =>
      el.addEventListener('click', () => go('reportDetail', { id: el.dataset.rid }))
    );
    $page.querySelectorAll('[data-pid]').forEach(el =>
      el.addEventListener('click', () => go('policyDetail', { id: el.dataset.pid }))
    );

    // 工具项点击 - 切换 tab 或跳转
    $page.querySelectorAll('.tool-item').forEach(el => {
      const target = el.dataset.go;
      el.onclick = () => {
        if (['reports', 'vas', 'policy', 'profile'].includes(target)) {
          reset(target);
        } else {
          go(target);
        }
      };
    });

    // 首页企业搜索
    const $homeSearch = document.getElementById('homeSearch');
    if ($homeSearch) {
      $homeSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const q = $homeSearch.value.trim();
          if (q) go('enterpriseQuery', { q });
        }
      });
    }

    // AI 助手入口
    const $aiCard = document.getElementById('aiCard');
    if ($aiCard) {
      $aiCard.onclick = () => go('aiChat');
    }
  });

  // ---------- 页面：报告库 ----------
  register('reports', () => {
    setNav('报告库');
    const s = Store.get();

    const drawList = (filter) => {
      const list = s.reports.filter(r => r.status === 'on' && (!filter || r.name.includes(filter) || r.desc.includes(filter)));
      const $list = document.getElementById('rList');
      $list.innerHTML = list.length ? list.map(r => `
        <div class="rpt-card" data-rid="${r.id}">
          <div class="rpt-top">
            <span class="rpt-avatar" style="background:${['#1976d2','#388e3c','#f57c00','#7b1fa2','#c62828','#00796b','#f9a825'][s.reports.indexOf(r) % 7]}">${r.name.slice(0,2)}</span>
            <div class="rpt-name-box">
              <p class="rpt-name p-ellipsis">${U.escapeHtml(r.name)}</p>
              <p class="rpt-tags p-ellipsis"><span>${U.escapeHtml(r.cate)}</span></p>
            </div>
            <div class="rpt-buy-btn" data-rid="${r.id}"><span>¥${r.priceBasic}</span>起</div>
          </div>
          <div class="rpt-body">
            <p class="rpt-desc p-ellipsis-2">${U.escapeHtml(r.desc)}</p>
          </div>
          <div class="rpt-bottom">
            <span class="rpt-bottom-item"><i data-lucide="eye"></i>${Math.floor(Math.random()*500+50)}</span>
            <span class="rpt-bottom-item"><i data-lucide="shopping-cart"></i>${Math.floor(Math.random()*50+5)}</span>
            <span class="rpt-bottom-item" style="margin-left:auto;color:#999">${['简易版','标准版','专家版'][Math.floor(Math.random()*3)]}</span>
          </div>
        </div>
      `).join('') : '<div class="empty">未找到匹配报告</div>';
      $list.querySelectorAll('.rpt-card').forEach(el =>
        el.addEventListener('click', (e) => {
          if (e.target.closest('.rpt-buy-btn')) return;
          go('reportDetail', { id: el.dataset.rid });
        })
      );
      $list.querySelectorAll('.rpt-buy-btn').forEach(el =>
        el.addEventListener('click', (e) => { e.stopPropagation(); go('reportDetail', { id: el.dataset.rid }); })
      );
      if (window.lucide) setTimeout(() => lucide.createIcons(), 0);
    };

    $page.innerHTML = `
      <div class="search-bar"><i data-lucide="search" style="width:16px;height:16px;color:#888"></i> <input id="rSearch" placeholder="搜索报告名称" /></div>
      <div id="rList" style="padding:0 12px"></div>
    `;
    drawList();
    document.getElementById('rSearch').addEventListener('input', U.debounce(() => {
      drawList(document.getElementById('rSearch').value.trim());
    }, 200));
  });

  register('reportDetail', ({ id }) => {
    setNav('报告详情');
    const r = Store.get().reports.find(x => x.id === id);
    if (!r) { $page.innerHTML = '<div class="empty">报告不存在</div>'; return; }
    let spec = 'std';

    const drawDetail = () => {
      const price = spec === 'basic' ? r.priceBasic : spec === 'std' ? r.priceStd : r.priceExpert;
      $page.innerHTML = `
        <div class="rpt-detail-hero">
          <span class="rpt-detail-avatar" style="background:${['#1976d2','#388e3c','#f57c00','#7b1fa2','#c62828','#00796b','#f9a825'][Math.floor(Math.random()*7)]}">${r.name.slice(0,2)}</span>
          <h2 class="rpt-detail-name">${U.escapeHtml(r.name)}</h2>
          <p class="rpt-detail-tags"><span>${U.escapeHtml(r.cate)}</span></p>
        </div>
        <div class="rpt-detail-body">
          <p class="rpt-detail-desc">${U.escapeHtml(r.desc)}</p>
          <div class="rpt-detail-specs">
            <div class="rpt-spec ${spec === 'basic' ? 'active' : ''}" data-spec="basic">
              <div class="rpt-spec-lab">简易版</div>
              <div class="rpt-spec-pri">¥${r.priceBasic}</div>
            </div>
            <div class="rpt-spec ${spec === 'std' ? 'active' : ''}" data-spec="std">
              <div class="rpt-spec-lab">标准版</div>
              <div class="rpt-spec-pri">¥${r.priceStd}</div>
              <div class="rpt-spec-rec">推荐</div>
            </div>
            <div class="rpt-spec ${spec === 'expert' ? 'active' : ''}" data-spec="expert">
              <div class="rpt-spec-lab">专家版</div>
              <div class="rpt-spec-pri">¥${r.priceExpert}</div>
            </div>
          </div>
          <div class="rpt-detail-field">
            <label>分析对象</label>
            <input class="input" id="target" placeholder="请输入目标企业全称" />
          </div>
        </div>
        <div class="bottom-bar">
          <div style="flex:1">合计 <span class="price-big">¥${price}</span></div>
          <button class="btn" id="orderBtn"><i data-lucide="shopping-cart"></i>立即下单</button>
        </div>
      `;
      $page.querySelectorAll('.rpt-spec').forEach(el =>
        el.addEventListener('click', () => { spec = el.dataset.spec; drawDetail(); })
      );
      document.getElementById('orderBtn').addEventListener('click', () => {
        const target = document.getElementById('target').value.trim();
        if (!target) { toast('请输入目标企业'); return; }
        placeReportOrder(r, spec, target);
      });
      if (window.lucide) setTimeout(() => lucide.createIcons(), 0);
    };
    drawDetail();
  });

  // 认证检查：未认证时拦截操作，引导认证
  function checkAuth(actionName) {
    const s = Store.get();
    if (s.currentUser.authStatus === 'verified') return true;
    openModal('认证提示', `
      <div style="text-align:center;padding:16px 0">
        <i data-lucide="shield-alert" style="width:48px;height:48px;color:#f57c00;margin-bottom:12px"></i>
        <p style="font-size:14px;color:#333;margin-bottom:8px">企业认证后可使用此功能</p>
        <p style="font-size:12px;color:#999">需要完成企业认证才能${actionName}</p>
      </div>
    `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn" id="goAuth">去认证</button>`);
    document.getElementById('goAuth').onclick = () => { closeModal(); go('enterpriseInfo'); };
    if (window.lucide) setTimeout(() => lucide.createIcons(), 0);
    return false;
  }

  // 下单
  function placeReportOrder(r, spec, target) {
    if (!checkAuth('下单购买报告')) return;
    const s = Store.get();
    const price = spec === 'basic' ? r.priceBasic : spec === 'std' ? r.priceStd : r.priceExpert;
    const specName = { basic: '简易版', std: '标准版', expert: '专家版' }[spec];
    const orderId = Store.uid('O');
    const contractId = Store.uid('CT');
    const tradeNo = 'WX' + Date.now();
    const now = Date.now();
    const order = {
      id: orderId, type: 'report', refId: r.id, refName: `${r.name}(${specName})`, spec,
      amount: price, payStatus: 'unpaid', status: 'pending',
      userId: s.currentUser.id, user: s.currentUser.company,
      target, createdAt: now, paidAt: null,
      tradeNo, payMethod: '微信支付', contractId, invoiceId: null, note: '',
    };
    s.orders.unshift(order);
    Store.log('用户下单', `订单 ${orderId} - ${order.refName}`, s.currentUser.company);
    Store.set(s);
    go('payOrder', { id: orderId });
  }

  // 支付页
  register('payOrder', ({ id }) => {
    setNav('订单支付');
    const o = Store.get().orders.find(x => x.id === id);
    if (!o) { $page.innerHTML = '<div class="empty">订单不存在</div>'; return; }
    $page.innerHTML = `
      <div class="card">
        <div class="title">${U.escapeHtml(o.refName)}</div>
        <div class="kv"><div class="k">订单号</div><div class="v">${o.id}</div></div>
        <div class="kv"><div class="k">分析对象</div><div class="v">${U.escapeHtml(o.target || '-')}</div></div>
        <div class="kv"><div class="k">应付金额</div><div class="v price-big">${U.fmtMoney(o.amount)}</div></div>
        <div class="kv"><div class="k">支付方式</div><div class="v">微信支付</div></div>
      </div>
      <div class="card">
        <div class="title"><i data-lucide="file-text" style="width:18px;height:18px;vertical-align:middle;margin-right:4px"></i>电子合同</div>
        <div class="desc" style="margin-top:8px">本订单将自动绑定《报告购买电子合同》。下单支付即视为同意合同条款。</div>
        <button class="btn ghost sm" id="viewCt" style="margin-top:8px"><i data-lucide="file-text"></i>查看合同</button>
      </div>
      <div style="padding:16px">
        <button class="btn block" id="payBtn"><i data-lucide="credit-card"></i>确认支付 ${U.fmtMoney(o.amount)}</button>
      </div>
    `;
    document.getElementById('viewCt').onclick = () => {
      const tpl = Store.get().contractTemplates.find(t => t.forType === 'report');
      const content = (tpl?.content || '').replace('{{company}}', o.user).replace('{{product}}', o.refName);
      openModal(`<pre style="white-space:pre-wrap;font-size:12px;color:#333;line-height:1.7">${U.escapeHtml(content)}</pre>
        <button class="btn block" onclick="document.getElementById('modalMask').classList.remove('show')"><i data-lucide="book-open"></i>我已阅读</button>`, '电子合同预览');
    };
    document.getElementById('payBtn').onclick = () => {
      // 模拟支付成功 + 自动签章 + 报告生成
      const s = Store.get();
      const idx = s.orders.findIndex(x => x.id === id);
      if (idx < 0) return;
      const now = Date.now();
      s.orders[idx].payStatus = 'paid';
      s.orders[idx].status = 'completed';
      s.orders[idx].paidAt = now;
      // 支付流水
      s.payFlows.unshift({ id: Store.uid('F'), tradeNo: s.orders[idx].tradeNo, orderId: id, amount: s.orders[idx].amount, method: '微信支付', paidAt: now, source: 'callback' });
      // 合同
      const tpl = s.contractTemplates.find(t => t.forType === 'report');
      s.contracts.unshift({ id: s.orders[idx].contractId, orderId: id, templateId: tpl ? tpl.id : null, userId: s.currentUser.id, user: s.currentUser.company, signedAt: now, sealed: true });
      // 印章用一次
      const seal = s.seals[0]; if (seal) { seal.useCount += 1; seal.lastUsedAt = now; }
      // 已购报告（报告由运营后台生成后上传）
      s.orders[idx].reportStatus = 'generating';
      s.purchasedReports.unshift({ id: Store.uid('PR'), orderId: id, reportId: s.orders[idx].refId, reportName: s.orders[idx].refName, target: s.orders[idx].target, purchasedAt: now, userId: s.currentUser.id, reportStatus: 'generating' });
      // 更新用户订单数
      const u2 = s.users.find(u => u.id === s.currentUser.id);
      if (u2) u2.orderCount = (u2.orderCount || 0) + 1;
      Store.log('支付成功', `订单 ${id} 已支付 ${U.fmtMoney(s.orders[idx].amount)}`, s.currentUser.company);
      Store.set(s);
      toast('支付成功！报告生成中，请到「我的-报告库」查看进度');
      setTimeout(() => reset('purchasedReports'), 1200);
    };
  });

  // ---------- 页面：增值服务 ----------
  register('vas', () => {
    setNav('第三方增值服务');
    const s = Store.get();
    $page.innerHTML = `
      <div style="padding:0 12px">
        ${s.vasServices.filter(v => v.status === 'on').map(v => `
          <div class="card" data-vid="${v.id}">
            <div class="title">${U.escapeHtml(v.name)}</div>
            <div class="desc" style="margin-top:6px">${U.escapeHtml(v.desc)}</div>
            <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">
              <div style="font-size:12px;color:#999">起步价 <span class="price-big">¥${v.priceFrom}</span></div>
              <button class="btn sm" data-vid="${v.id}"><i data-lucide="shopping-bag"></i>订购</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    $page.querySelectorAll('[data-vid]').forEach(el =>
      el.addEventListener('click', () => go('vasDetail', { id: el.dataset.vid }))
    );
  });

  register('vasDetail', ({ id }) => {
    setNav('服务详情');
    const v = Store.get().vasServices.find(x => x.id === id);
    if (!v) { $page.innerHTML = '<div class="empty">服务不存在</div>'; return; }
    const s = Store.get();
    const reports = s.reports.filter(r => r.status === 'on');
    let addonReportId = '';

    const drawPage = () => {
      const addon = addonReportId ? reports.find(r => r.id === addonReportId) : null;
      $page.innerHTML = `
        <div class="card">
          <div class="title">${U.escapeHtml(v.name)}</div>
          <div class="desc" style="margin-top:8px">${U.escapeHtml(v.desc)}</div>
          <div class="kv"><div class="k">服务商</div><div class="v">${U.escapeHtml(v.vendor)}</div></div>
          <div class="kv"><div class="k">联系方式</div><div class="v">${U.escapeHtml(v.contact)}</div></div>
          <div class="kv"><div class="k">价格</div><div class="v price-big">¥${v.priceFrom}</div></div>
        </div>

        <div class="card">
          <div class="title"><i data-lucide="gift" style="width:16px;height:16px;vertical-align:middle;margin-right:4px"></i>0元加购报告</div>
          <div class="desc" style="margin-top:6px">购买本服务可免费获得一份报告</div>
          <div style="margin-top:8px">
            <select class="select" id="addonSel">
              <option value="">不选择加购报告</option>
              ${reports.map(r => `<option value="${r.id}" ${addonReportId === r.id ? 'selected' : ''}>${r.name}（¥${r.priceBasic}→¥0）</option>`).join('')}
            </select>
          </div>
          ${addon ? `<div style="margin-top:8px;padding:8px 12px;background:#e8f5e9;border-radius:6px;font-size:12px;color:#2e7d32">
            <i data-lucide="check-circle" style="width:14px;height:14px;vertical-align:middle;margin-right:4px"></i>已选加购：${U.escapeHtml(addon.name)}（价值¥${addon.priceBasic}，现¥0）
          </div>` : ''}
        </div>

        <div class="bottom-bar">
          <div style="flex:1">合计 <span class="price-big">¥${v.priceFrom}</span>${addon ? `<span style="font-size:11px;color:#999">（含0元报告）</span>` : ''}</div>
          <button class="btn" id="buyBtn"><i data-lucide="shopping-bag"></i>立即订购</button>
        </div>
      `;
      document.getElementById('addonSel').onchange = () => {
        addonReportId = document.getElementById('addonSel').value;
        drawPage();
      };
      document.getElementById('buyBtn').onclick = () => {
        if (!checkAuth('订购增值服务')) return;
        const ss = Store.get();
        const voId = Store.uid('VO');
        const now = Date.now();
        const vo = {
          id: voId, serviceId: v.id, serviceName: v.name,
          userId: ss.currentUser.id, user: ss.currentUser.company,
          amount: v.priceFrom, progress: 'pending', createdAt: now,
          note: '',
          addonReportId: addonReportId || '',
        };
        ss.vasOrders.unshift(vo);
        // 加购报告：创建¥0报告订单
        if (addonReportId) {
          const ar = reports.find(r => r.id === addonReportId);
          if (ar) {
            const oid = Store.uid('O');
            const cid = Store.uid('CT');
            const ro = {
              id: oid, type: 'report', refId: ar.id, refName: `${ar.name}(标准版·0元加购)`, spec: 'std',
              amount: 0, payStatus: 'paid', status: 'completed',
              userId: ss.currentUser.id, user: ss.currentUser.company,
              target: '', createdAt: now, paidAt: now,
              tradeNo: 'ADDON' + now, payMethod: '服务加购',
              contractId: cid, invoiceId: null, note: `服务订单 ${voId} 加购赠品`,
              reportStatus: 'generating',
            };
            ss.orders.unshift(ro);
            ss.purchasedReports.unshift({ id: Store.uid('PR'), orderId: oid, reportId: ar.id, reportName: `${ar.name}(标准版·0元加购)`, target: '', purchasedAt: now, userId: ss.currentUser.id, reportStatus: 'generating' });
            const tpl = ss.contractTemplates.find(t => t.forType === 'report');
            ss.contracts.unshift({ id: cid, orderId: oid, templateId: tpl ? tpl.id : null, userId: ss.currentUser.id, user: ss.currentUser.company, signedAt: now, sealed: true });
            const uu = ss.users.find(u => u.id === ss.currentUser.id);
            if (uu) uu.orderCount = (uu.orderCount || 0) + 1;
            Store.log('加购报告', `订单 ${oid} - ${ar.name}（¥0）`, ss.currentUser.company);
          }
        }
        Store.log('用户订购', `服务订单 ${voId} - ${v.name}`, ss.currentUser.company);
        Store.set(ss);
        toast(addonReportId ? '订购成功！已自动生成加购报告订单' : '订购成功，等待对接');
        setTimeout(() => reset('orders'), 800);
      };
      if (window.lucide) setTimeout(() => lucide.createIcons(), 0);
    };
    drawPage();
  });

  // ---------- 页面：政策专区 ----------
  register('policy', () => {
    setNav('政策专区', { text: 'AI 匹配', onClick: () => go('policyMatch') });
    const s = Store.get();
    let tab = 'declare'; // declare | public | notice
    let region = '全部';
    let cate = '全部';
    const regions = ['全部', '全国', '湖北'];
    const cates = ['全部', '资质认定与奖励', '转型转产', '贷款贴息贴保', '中小微企业', '税收优惠', '科技成果奖励', '高新技术企业', '知识产权类'];
    const tabs = [
      { key: 'declare', label: '申报通知' },
      { key: 'public', label: '立项公示' },
      { key: 'notice', label: '政策公告' },
    ];

    const allPolicies = (() => {
      const base = s.policies.filter(p => p.status === 'on');
      // 给每条政策分配一个类型用于演示
      return base.map((p, i) => ({ ...p, pTab: tabs[i % 3].key }));
    })();

    const draw = () => {
      const list = allPolicies.filter(p =>
        p.pTab === tab
        && (region === '全部' || p.region === region)
        && (cate === '全部' || p.cate === cate));
      const $l = document.getElementById('pList');
      $l.innerHTML = list.length ? list.map((p, idx) => `
        <div class="plc-item" data-pid="${p.id}">
          <div class="plc-dot-line">
            <div class="plc-dot ${idx === 0 ? 'active' : ''}"></div>
            ${idx < list.length - 1 ? '<div class="plc-line"></div>' : ''}
          </div>
          <div class="plc-card" data-pid="${p.id}">
            <div class="plc-card-title double-line-ellipsis">${U.escapeHtml(p.title)}</div>
            <div class="plc-card-meta">
              <span class="tag">${p.region}</span>
              <span class="tag gray">${p.cate}</span>
              <span class="plc-card-date">${U.fmtDate(p.publishAt, false)}</span>
            </div>
          </div>
        </div>
      `).join('') : '<div class="empty">暂无符合条件的政策</div>';
      $l.querySelectorAll('.plc-card').forEach(el =>
        el.addEventListener('click', () => go('policyDetail', { id: el.dataset.pid }))
      );
    };

    $page.innerHTML = `
      <div class="plc-search-bar">
        <i data-lucide="search" style="width:16px;height:16px;color:#999"></i>
        <input class="plc-search-input" id="plcSearch" placeholder="搜索政策关键词" />
        <button class="btn sm" id="plcSearchBtn"><i data-lucide="search"></i>搜索</button>
      </div>
      <div class="scroll-x" style="padding:0 12px">
        ${regions.map(r => `<div class="chip ${r === '全部' ? 'active' : ''}" data-r="${r}">${r}</div>`).join('')}
      </div>
      <div class="scroll-x wrap" style="padding:4px 12px">
        ${cates.map(c => `<div class="chip ${c === '全部' ? 'active' : ''}" data-c="${c}">${c}</div>`).join('')}
      </div>
      <div class="plc-tabs">
        ${tabs.map(t => `<div class="plc-tab ${tab === t.key ? 'active' : ''}" data-tab="${t.key}">${t.label}</div>`).join('')}
      </div>
      <div id="pList" style="padding:0 12px"></div>
    `;
    // 地区筛选（第一个 scroll-x）
    const $scrolls = $page.querySelectorAll('.scroll-x');
    $scrolls[0].addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      region = c.dataset.r;
      [...e.currentTarget.children].forEach(x => x.classList.toggle('active', x.dataset.r === region));
      draw();
    });
    // 分类筛选（第二个 scroll-x）
    $scrolls[1].addEventListener('click', (e) => {
      const c2 = e.target.closest('.chip'); if (!c2) return;
      cate = c2.dataset.c;
      [...e.currentTarget.children].forEach(x => x.classList.toggle('active', x.dataset.c === cate));
      draw();
    });
    // Tab 切换
    $page.querySelector('.plc-tabs').addEventListener('click', (e) => {
      const t = e.target.closest('.plc-tab'); if (!t) return;
      tab = t.dataset.tab;
      [...e.currentTarget.children].forEach(x => x.classList.toggle('active', x.dataset.tab === tab));
      draw();
    });
    // 搜索
    document.getElementById('plcSearchBtn').onclick = () => {
      const q = document.getElementById('plcSearch').value.trim();
      if (!q) { toast('请输入搜索关键词'); return; }
      toast('搜索功能（演示）');
    };

    draw();
    if (window.lucide) setTimeout(() => lucide.createIcons(), 0);
  });

  register('policyDetail', ({ id }) => {
    setNav('政策详情');
    const p = Store.get().policies.find(x => x.id === id);
    if (!p) { $page.innerHTML = '<div class="empty">政策不存在</div>'; return; }
    const s = Store.get();
    const uId = s.currentUser.id;
    const fav = s.policyFavs.some(f => f.policyId === p.id && f.userId === uId);
    $page.innerHTML = `
      <div class="plc-detail-hero">
        <h2 class="plc-detail-title">${U.escapeHtml(p.title)}</h2>
        <div class="plc-detail-tags">
          <span class="tag">${p.region}</span><span class="tag gray">${p.cate}</span>
          <span class="plc-detail-date">${U.fmtDate(p.publishAt, false)}</span>
        </div>
      </div>
      <div class="plc-detail-body">
        <div class="plc-detail-section">
          <div class="plc-detail-label">政策摘要</div>
          <p>${U.escapeHtml(p.summary)}</p>
        </div>
        <div class="plc-detail-section">
          <div class="plc-detail-label">申报条件</div>
          <ul class="plc-detail-list">
            <li>在${p.region}境内注册的独立法人企业</li>
            <li>上一年度营业收入不超过 2 亿元</li>
            <li>近两年无重大违法违规记录</li>
            <li>具备健全的财务管理制度</li>
          </ul>
        </div>
        <div class="plc-detail-section">
          <div class="plc-detail-label">申报材料</div>
          <ul class="plc-detail-list">
            <li>营业执照副本复印件</li>
            <li>近三年审计报告</li>
            <li>专项申报书（含项目概述、预算等）</li>
            <li>相关资质证明材料</li>
          </ul>
        </div>
        <div class="plc-detail-section">
          <div class="plc-detail-label">申报时间</div>
          <p>常年受理，每季度集中评审一次</p>
        </div>
      </div>
      <div class="bottom-bar">
        <button class="btn ${fav ? 'muted' : 'ghost'}" id="favBtn" style="flex:1"><i data-lucide="star"></i>${fav ? '已收藏' : '收藏'}</button>
        <button class="btn" id="applyBtn" style="flex:1"><i data-lucide="message-square"></i>在线咨询</button>
      </div>
    `;
    document.getElementById('favBtn').onclick = () => {
      const ss = Store.get();
      const uid = ss.currentUser.id;
      const i = ss.policyFavs.findIndex(f => f.policyId === p.id && f.userId === uid);
      if (i >= 0) { ss.policyFavs.splice(i, 1); toast('已取消收藏'); }
      else { ss.policyFavs.push({ userId: uid, policyId: p.id, favAt: Date.now() }); toast('已收藏'); }
      Store.set(ss);
    };
    document.getElementById('applyBtn').onclick = () => toast('客服将在 1 个工作日内联系您');
    if (window.lucide) setTimeout(() => lucide.createIcons(), 0);
  });

  register('policyMatch', () => {
    setNav('企业政策匹配');
    const s = Store.get();
    $page.innerHTML = `
      <div class="card">
        <div class="title">企业画像</div>
        <div class="kv"><div class="k">企业名称</div><div class="v">${U.escapeHtml(s.currentUser.company)}</div></div>
        <div class="kv"><div class="k">认证状态</div><div class="v">${s.currentUser.authStatus === 'verified' ? '<span class="tag green">已认证</span>' : '<span class="tag orange">未认证</span>'}</div></div>
      </div>
      <div style="padding:16px"><button class="btn block" id="matchBtn"><i data-lucide="sparkles"></i>开始 AI 匹配</button></div>
      <div id="matchResult" style="padding:0 12px"></div>
    `;
    document.getElementById('matchBtn').onclick = () => {
      const ss = Store.get();
      ss.policyMatchLogs.unshift({
        id: Store.uid('PML'), userId: ss.currentUser.id, user: ss.currentUser.company,
        matchedCount: ss.policies.length, at: Date.now(),
      });
      Store.log('政策匹配', `${ss.currentUser.company} 触发 AI 匹配`, ss.currentUser.company);
      Store.set(ss);
      const matches = ss.policies.map(p => ({
        ...p, score: Math.round(60 + Math.random() * 35),
      })).sort((a, b) => b.score - a.score);
      const $r = document.getElementById('matchResult');
      $r.innerHTML = `
        <div class="section-head" style="margin-left:0">匹配到 ${matches.length} 项政策</div>
        ${matches.map(m => `
          <div class="plc-card" data-pid="${m.id}" style="margin-bottom:8px;cursor:pointer">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
              <div style="flex:1">
                <div class="plc-card-title double-line-ellipsis">${U.escapeHtml(m.title)}</div>
                <div class="plc-card-meta"><span class="tag">${m.region}</span><span class="tag gray">${m.cate}</span></div>
              </div>
              <div style="text-align:center;flex-shrink:0">
                <div style="font-size:20px;color:#1ba258;font-weight:700">${m.score}</div>
                <div style="font-size:10px;color:#999">匹配度</div>
              </div>
            </div>
          </div>
        `).join('')}
      `;
      $r.querySelectorAll('[data-pid]').forEach(el =>
        el.addEventListener('click', () => go('policyDetail', { id: el.dataset.pid }))
      );
      toast('AI 匹配完成');
    };
  });

  // ---------- 页面：AI 智能问答 ----------
  register('aiChat', () => {
    setNav('AI 智能助手');
    const chatHistory = [];

    const renderChat = () => {
      const $chatBox = document.getElementById('chatBox');
      $chatBox.innerHTML = chatHistory.map(msg => `
        <div class="chat-msg ${msg.role}">
          <div class="msg-avatar"><i data-lucide="${msg.role === 'user' ? 'user' : 'bot'}"></i></div>
          <div class="msg-content">
            <div class="msg-text">${U.escapeHtml(msg.text)}</div>
            <div class="msg-time">${U.fmtDate(msg.time)}</div>
          </div>
        </div>
      `).join('');
      $chatBox.scrollTop = $chatBox.scrollHeight;
    };

    const sendMessage = () => {
      const $input = document.getElementById('chatInput');
      const text = $input.value.trim();
      if (!text) return;

      // 用户消息
      chatHistory.push({ role: 'user', text, time: Date.now() });
      $input.value = '';
      renderChat();

      // 模拟 AI 回复
      setTimeout(() => {
        let reply = '';
        if (text.includes('政策') || text.includes('补贴')) {
          reply = '根据您的企业情况，推荐以下政策：\n\n1. 湖北省科技型中小企业研发费用加计扣除\n2. 武汉市高新技术企业认定补贴\n3. 科技金融专项贷款\n\n您可以前往"政策专区"查看详情并申请。';
        } else if (text.includes('融资') || text.includes('贷款')) {
          reply = '企融通提供以下融资服务：\n\n· 科技贷：最高500万，利率优惠\n· 知识产权质押贷款\n· 政府担保基金\n\n建议先完成企业认证，我们会根据您的情况推荐最合适的融资方案。';
        } else if (text.includes('报告') || text.includes('尽调')) {
          reply = '我们提供7类企业报告：\n\n· 企业尽调报告 - 全方位企业画像\n· 产业分析报告 - 行业趋势洞察\n· 经营风险报告 - 风险预警\n\n点击"报告"栏目查看详情并下单。';
        } else if (text.includes('认证') || text.includes('审核')) {
          reply = '企业认证流程：\n\n1. 进入"我的" → "企业信息"\n2. 上传营业执照和法人身份证\n3. 提交审核（1-3个工作日）\n\n认证后可享受更多服务和优惠政策。';
        } else {
          reply = '您好！我是企融通AI助手。\n\n我可以帮您：\n• 推荐适合的政策和补贴\n• 提供融资方案咨询\n• 解答报告和服务问题\n• 协助完成企业认证\n\n请问有什么可以帮您？';
        }

        chatHistory.push({ role: 'ai', text: reply, time: Date.now() });
        renderChat();
      }, 800);
    };

    $page.innerHTML = `
      <div class="ai-chat-container">
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-avatar"><i data-lucide="bot"></i></div>
            <div>
              <div class="chat-name">AI 智能助手</div>
              <div class="chat-status">在线</div>
            </div>
          </div>
        </div>

        <div class="chat-box" id="chatBox">
          <div class="chat-welcome">
            <div class="welcome-icon"><i data-lucide="hand" style="width:48px;height:48px"></i></div>
            <div class="welcome-title">您好！我是企融通 AI 助手</div>
            <div class="welcome-desc">我可以帮您解答以下问题：</div>
            <div class="welcome-tags">
              <span class="tag" data-q="有哪些适合科技企业的政策？">政策咨询</span>
              <span class="tag" data-q="如何申请科技贷款？">融资方案</span>
              <span class="tag" data-q="企业尽调报告包含什么内容？">报告推荐</span>
              <span class="tag" data-q="企业认证需要什么材料？">认证指引</span>
            </div>
          </div>
        </div>

        <div class="chat-input-bar">
          <input class="chat-input" id="chatInput" placeholder="输入您的问题..." />
          <button class="btn" id="sendBtn"><i data-lucide="send"></i>发送</button>
        </div>
      </div>
    `;

    document.getElementById('sendBtn').onclick = sendMessage;
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    // 快捷问题
    $page.querySelectorAll('.welcome-tags .tag').forEach(tag => {
      tag.onclick = () => {
        document.getElementById('chatInput').value = tag.dataset.q;
        sendMessage();
      };
    });

    // 初始化图标
    if (window.lucide) {
      setTimeout(() => lucide.createIcons(), 0);
    }
  });

  // ---------- 页面：企业信息查询 ----------
  // ---------- 页面：企业信息查询 ----------
  register('enterpriseQuery', ({ q }) => {
    setNav('企业详情');
    let queryData = null;

    const drawPage = () => {
      if (!queryData) {
        $page.innerHTML = `
          <div class="search-bar"><i data-lucide="search" style="width:16px;height:16px;color:#888"></i><input id="eq" placeholder="输入企业名称 / 统一社会信用代码" value="${U.escapeHtml(q || '')}"/></div>
          <div style="padding:16px"><button class="btn block" id="qBtn"><i data-lucide="search"></i>立即查询</button></div>
        `;
        document.getElementById('qBtn').onclick = doQuery;
        document.getElementById('eq').addEventListener('keypress', (e) => { if (e.key === 'Enter') doQuery(); });
        if (q) setTimeout(doQuery, 100);
        return;
      }

      const d = queryData;
      $page.innerHTML = `
        <div class="ent-header-v2">
          <img class="ent-logo-img" src="https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&size=96&background=1976d2&color=fff&bold=true" alt="logo" />
          <div class="ent-h-title-row">
            <h1 class="ent-h-name">${U.escapeHtml(d.name)}</h1>
            <span class="ent-status-badge">${U.escapeHtml(d.statusText)}</span>
          </div>
          <p class="ent-h-code">${U.escapeHtml(d.creditCode)}</p>
          <div class="ent-h-tags">
            <span>${U.escapeHtml(d.industry)}</span>
            <span>${U.escapeHtml(d.industry2)}</span>
            <span>${U.escapeHtml(d.industry3)}</span>
          </div>
          <div class="ent-h-contact">
            <p><i data-lucide="phone"></i>${U.escapeHtml(d.phone)}</p>
            <p><i data-lucide="map-pin"></i>${U.escapeHtml(d.address)}</p>
            <p><i data-lucide="mail"></i>${U.escapeHtml(d.email)}</p>
          </div>
        </div>
        <div class="ent-basic-row">
          <div class="ent-basic-item"><span>法定代表人</span><strong>${U.escapeHtml(d.legal)}</strong></div>
          <div class="ent-basic-item"><span>注册资本</span><strong>${U.escapeHtml(d.capital)}</strong></div>
          <div class="ent-basic-item"><span>成立时间</span><strong>${U.escapeHtml(d.established)}</strong></div>
        </div>
        <div class="ent-stats-row">
          <div class="ent-stat-card">
            <span class="ent-stat-icon ent-stat-icon--patent"><i data-lucide="file-text"></i></span>
            <div><div class="ent-stat-value"><strong>${d.patents}</strong><span>件</span></div><p>专利量</p></div>
          </div>
          <div class="ent-stat-card">
            <span class="ent-stat-icon ent-stat-icon--people"><i data-lucide="users"></i></span>
            <div><div class="ent-stat-value"><strong>${d.inventors}</strong><span>人</span></div><p>发明人</p></div>
          </div>
          <div class="ent-stat-card">
            <span class="ent-stat-icon ent-stat-icon--chart"><i data-lucide="trending-up"></i></span>
            <div><div class="ent-stat-value"><strong>${d.investments}</strong><span>次</span></div><p>投融资事件</p></div>
          </div>
        </div>
        <div class="ent-side-section">
          <div class="ent-side-label">股东</div>
          <div class="ent-side-content">
            <div class="ent-sh-card">
              <div class="ent-sh-mini-logo" style="background:#9661bc">${d.shareholders[0].name.slice(0,2)}</div>
              <div class="ent-sh-info">
                <strong>${U.escapeHtml(d.shareholders[0].name)}</strong>
                <div class="ent-sh-meta">
                  <p>持股比例 <span>${d.shareholders[0].ratio}</span></p>
                  <p>认缴出资 <span>${(Math.random()*5000+500).toFixed(0)}万元</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="ent-side-section">
          <div class="ent-side-label">人员<br>${d.executives.length}</div>
          <div class="ent-side-content">
            <div class="ent-people-grid">
              ${d.executives.map(e => `
                <div class="ent-person-item">
                  <span class="ent-person-avatar">${e.name.slice(0,1)}</span>
                  <div class="ent-person-info"><strong>${U.escapeHtml(e.name)}</strong><p>${U.escapeHtml(e.role)}</p></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="ent-side-section">
          <div class="ent-side-label">企业<br>图谱</div>
          <div class="ent-side-content">
            <div class="ent-chart-grid">
              <div class="ent-chart-item"><div class="ent-chart-icon c1"><i data-lucide="git-branch"></i></div><p>股权关系</p></div>
              <div class="ent-chart-item"><div class="ent-chart-icon c2"><i data-lucide="trending-up"></i></div><p>经营发展</p></div>
              <div class="ent-chart-item"><div class="ent-chart-icon c3"><i data-lucide="link"></i></div><p>供应链关系</p></div>
              <div class="ent-chart-item"><div class="ent-chart-icon c4"><i data-lucide="layers"></i></div><p>产业链布局</p></div>
              <div class="ent-chart-item"><div class="ent-chart-icon c5"><i data-lucide="crosshair"></i></div><p>产业定位</p></div>
              <div class="ent-chart-item"><div class="ent-chart-icon c6"><i data-lucide="bar-chart-2"></i></div><p>技术分布</p></div>
              <div class="ent-chart-item"><div class="ent-chart-icon c7"><i data-lucide="activity"></i></div><p>研发趋势</p></div>
            </div>
          </div>
        </div>
        <div class="ent-modules-row">
          <div class="ent-module-item" data-tab="basic"><span class="ent-module-icon"><i data-lucide="info"></i></span><p>基本信息</p></div>
          <div class="ent-module-item" data-tab="invest"><span class="ent-module-icon"><i data-lucide="arrow-up-right"></i></span><p>对外投资</p></div>
          <div class="ent-module-item" data-tab="patent"><span class="ent-module-icon"><i data-lucide="lightbulb"></i></span><p>专利信息</p></div>
          <div class="ent-module-item" data-tab="bid"><span class="ent-module-icon"><i data-lucide="file-check"></i></span><p>招投标</p></div>
          <div class="ent-module-item" data-tab="cert"><span class="ent-module-icon"><i data-lucide="award"></i></span><p>资质证书</p></div>
          <div class="ent-module-item" data-tab="change"><span class="ent-module-icon"><i data-lucide="refresh-cw"></i></span><p>变更记录</p></div>
        </div>
        <div style="padding:12px;text-align:center;font-size:11px;color:#999">数据来源：国家企业信用信息公示系统</div>
      `;

      // 模块点击 → 弹窗展示详情
      $page.querySelectorAll('.ent-module-item').forEach(el => {
        el.onclick = () => openEntDetail(el.dataset.tab, d);
      });

      if (window.lucide) setTimeout(() => lucide.createIcons(), 0);
    };

    const openEntDetail = (tab, d) => {
      let title = '', body = '';
      if (tab === 'basic') {
        title = '基本信息';
        body = [
          ['法定代表人', d.legal], ['注册资本', d.capital], ['成立时间', d.established],
          ['登记状态', '<span class="tag green">'+d.statusText+'</span>'], ['信用代码', d.creditCode],
          ['联系电话', d.phone], ['企业地址', d.address], ['联系邮箱', d.email],
          ['行业1级', d.industry], ['行业2级', d.industry2], ['行业3级', d.industry3],
        ].map(([k,v]) => `<div class="kv"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
      } else if (tab === 'invest') {
        title = '对外投资';
        body = [{n:'武汉云算科技有限公司',r:'51%',a:'510万元'},{n:'湖北数智科技有限公司',r:'30%',a:'300万元'}]
          .map(i => `<div class="kv"><div class="k">${i.n}</div><div class="v">持股${i.r} | ${i.a}</div></div>`).join('');
      } else if (tab === 'patent') {
        title = '专利信息';
        body = [
          {no:'CN20241000001.X',n:'一种基于AI的企业评估方法',t:'发明专利',d:'2024-01-15',s:'已授权'},
          {no:'CN20241000002.Y',n:'企业数据智能分析系统',t:'发明专利',d:'2024-03-20',s:'实质审查'},
          {no:'CN20242000003.Z',n:'一种金融数据可视化装置',t:'实用新型',d:'2024-05-10',s:'已授权'},
        ].map(p => `<div style="padding:8px 0;border-bottom:1px solid #f0f0f0"><div style="font-size:13px;color:#111;font-weight:500;margin-bottom:4px">${U.escapeHtml(p.n)}</div><div style="display:flex;gap:6px;flex-wrap:wrap"><span class="tag">${p.t}</span><span class="tag gray">${p.no}</span><span class="tag green">${p.s}</span><span style="font-size:11px;color:#999">${p.d}</span></div></div>`).join('');
      } else if (tab === 'bid') {
        title = '招投标';
        body = [
          {t:'武汉东湖高新智慧园区平台建设项目',d:'2025-11-20',r:'中标方',a:'860万元'},
          {t:'湖北省科创服务平台技术开发',d:'2025-08-15',r:'投标方',a:'450万元'},
        ].map(b => `<div style="padding:8px 0;border-bottom:1px solid #f0f0f0"><div style="font-size:13px;color:#111;font-weight:500;margin-bottom:4px">${U.escapeHtml(b.t)}</div><div style="display:flex;gap:6px;flex-wrap:wrap"><span class="tag orange">${b.r}</span><span class="tag">${b.a}</span><span style="font-size:11px;color:#999">${b.d}</span></div></div>`).join('');
      } else if (tab === 'cert') {
        title = '资质证书';
        body = [
          {n:'高新技术企业证书',no:'GR202442000001',d:'2024-10-20',o:'湖北省科技厅'},
          {n:'软件企业认定证书',no:'鄂RQ-2024-0001',d:'2024-06-15',o:'湖北省经信厅'},
          {n:'ISO 9001质量管理体系',no:'02424Q00001ROS',d:'2024-03-10',o:'权威认证机构'},
        ].map(c => `<div class="kv"><div class="k">${U.escapeHtml(c.n)}</div><div class="v"><span class="tag green">有效</span><br><span style="font-size:11px;color:#999">${c.no} | ${c.o} | ${c.d}</span></div></div>`).join('');
      } else if (tab === 'change') {
        title = '变更记录';
        body = [
          {i:'注册资本',b:'3000万元',a:'5000万元',d:'2025-06-10'},
          {i:'法定代表人',b:'李某某',a:'张某某',d:'2024-12-01'},
          {i:'经营范围',b:'软件开发',a:'软件开发、数据服务、技术咨询',d:'2024-08-20'},
        ].map(c => `<div class="kv"><div class="k">${c.i}</div><div class="v"><span style="color:#999;text-decoration:line-through">${c.b}</span> → ${c.a}<br><span style="font-size:11px;color:#999">${c.d}</span></div></div>`).join('');
      }
      openModal(title, body, `<button class="btn block" onclick="document.getElementById('modalMask').classList.remove('show')">关闭</button>`);
    };

    const doQuery = () => {
      const query = document.getElementById('eq').value.trim();
      if (!query) { toast('请输入企业名称'); return; }
      queryData = {
        name: query,
        creditCode: '91420100MA4K' + Math.random().toString(36).slice(2, 8).toUpperCase(),
        statusText: '存续（在营、开业、在册）',
        industry: '信息传输、软件和信息技术服务业',
        industry2: '软件和信息技术服务业',
        industry3: '应用软件开发',
        phone: '027-8765' + Math.floor(Math.random() * 9000 + 1000),
        address: '武汉市东湖高新区光谷大道' + Math.floor(Math.random() * 100 + 1) + '号',
        email: 'contact@' + query.replace(/[^\w]/g, '').toLowerCase() + '.com',
        legal: ['赵明路', '张某某', '李某某'][Math.floor(Math.random() * 3)],
        capital: (Math.random() * 10000 + 500).toFixed(0) + '万元',
        established: '201' + Math.floor(Math.random() * 9) + '-0' + Math.floor(Math.random() * 9 + 1) + '-' + String(Math.floor(Math.random() * 28 + 1)).padStart(2,'0'),
        patents: Math.floor(Math.random() * 100 + 5),
        inventors: Math.floor(Math.random() * 30 + 3),
        investments: Math.floor(Math.random() * 8 + 1),
        shareholders: [
          { name: query.slice(0, 3) + '控股有限公司', ratio: (Math.random() * 30 + 30).toFixed(0) + '%' },
          { name: ['武汉光谷投资合伙企业', '湖北科创投资基金'][Math.floor(Math.random() * 2)], ratio: (Math.random() * 15 + 10).toFixed(0) + '%' },
        ],
        executives: [
          { name: '陈浩', role: '执行董事兼总经理' },
          { name: '李鹏', role: '监事' },
          { name: '王剑峰', role: '董事' },
          { name: '周跃峰', role: '监事' },
          { name: '徐钦松', role: '财务负责人' },
          { name: '胡厚崑', role: '董事' },
        ],
      };
      drawPage();
    };

    drawPage();
  });

  register('profile', () => {
    setNav('我的');
    const s = Store.get();
    const u = s.currentUser;
    const orders = s.orders.filter(o => o.userId === u.id);
    const purchased = s.purchasedReports.filter(p => p.userId === u.id).length;
    const favs = s.policyFavs.filter(f => f.userId === u.id).length;
    $page.innerHTML = `
      <div class="profile-head">
        <div class="name">${U.escapeHtml(u.company)}</div>
        <div class="sub">手机号 ${U.escapeHtml(u.phone)}</div>
        <div class="badge">${u.authStatus === 'verified' ? '<i data-lucide="check-circle" style="width:14px;height:14px;vertical-align:middle;margin-right:2px"></i>已认证' : u.authStatus === 'pending' ? '审核中' : u.authStatus === 'rejected' ? '已驳回' : '未认证'}</div>
      </div>
      <div class="profile-stats">
        <div class="it" data-go="orders"><div class="n">${orders.length}</div><div class="l">订单</div></div>
        <div class="it" data-go="purchasedReports"><div class="n">${purchased}</div><div class="l">报告</div></div>
        <div class="it" data-go="policyFavs"><div class="n">${favs}</div><div class="l">收藏政策</div></div>
      </div>

      <div class="section-head">企业服务</div>
      <div class="card" style="padding:0">
        <div class="list-item" data-go="enterpriseInfo"><div class="body"><div class="t">企业信息</div><div class="d">基本信息、认证状态、资质文件</div></div><div class="arrow">›</div></div>
        <div class="list-item" data-go="enterpriseQuery"><div class="body"><div class="t">企业信息查询</div><div class="d">查询企业工商基础信息，赋能经营风控</div></div><div class="arrow">›</div></div>
        <div class="list-item" data-go="orders"><div class="body"><div class="t">订单中心</div><div class="d">报告订单、服务订单</div></div><div class="arrow">›</div></div>
        <div class="list-item" data-go="purchasedReports"><div class="body"><div class="t">我的报告库</div><div class="d">已购报告预览/下载</div></div><div class="arrow">›</div></div>
        <div class="list-item" data-go="invoiceProfiles"><div class="body"><div class="t">发票管理</div><div class="d">抬头管理、开票申请、开票记录</div></div><div class="arrow">›</div></div>
        <div class="list-item" data-go="policyFavs"><div class="body"><div class="t">政策收藏夹</div><div class="d">${favs} 条已收藏</div></div><div class="arrow">›</div></div>
      </div>

      <div class="section-head">账户</div>
      <div class="card" style="padding:0">
        <div class="list-item" data-go="security"><div class="body"><div class="t">账号安全</div><div class="d">手机号、密码、微信授权</div></div><div class="arrow">›</div></div>
        <div class="list-item" data-go="about"><div class="body"><div class="t">关于 / 帮助</div><div class="d">版本、协议、客服联系</div></div><div class="arrow">›</div></div>
      </div>

      <div style="height:30px"></div>
    `;
    $page.querySelectorAll('[data-go]').forEach(el =>
      el.addEventListener('click', () => go(el.dataset.go))
    );
  });

  register('enterpriseInfo', () => {
    setNav('企业信息', { text: '编辑', onClick: () => editEnterprise() });
    const s = Store.get();
    const u = s.currentUser;
    $page.innerHTML = `
      <div class="card">
        <div class="kv"><div class="k">企业名称</div><div class="v">${U.escapeHtml(u.company)}</div></div>
        <div class="kv"><div class="k">统一社会信用代码</div><div class="v">${U.escapeHtml(u.creditCode)}</div></div>
        <div class="kv"><div class="k">联系人</div><div class="v">${U.escapeHtml(u.contact)}</div></div>
        <div class="kv"><div class="k">手机号</div><div class="v">${U.escapeHtml(u.phone)}</div></div>
      </div>
      <div class="card">
        <div class="title">认证状态</div>
        <div style="margin-top:10px">${u.authStatus === 'verified' ? '<span class="tag green">已认证</span>' : u.authStatus === 'pending' ? '<span class="tag orange">审核中</span>' : u.authStatus === 'rejected' ? '<span class="tag red">已驳回</span>' : '<span class="tag gray">未认证</span>'}</div>
        ${u.authStatus === 'rejected' && u.authNote ? `<div class="desc" style="margin-top:8px">驳回原因：${U.escapeHtml(u.authNote)}</div>` : ''}
        <div class="title" style="margin-top:14px">资质文件</div>
        <div style="margin-top:8px;font-size:13px;color:#555">${u.authMaterials.length ? u.authMaterials.map(f => '<i data-lucide="paperclip" style="width:12px;height:12px;vertical-align:middle;margin-right:2px"></i>' + U.escapeHtml(f)).join('<br>') : '<span style="color:#aaa">尚未上传</span>'}</div>
        ${u.authStatus !== 'verified' ? `<button class="btn block" id="submitAuth" style="margin-top:14px"><i data-lucide="${u.authStatus === 'pending' ? 'x-circle' : 'check-circle'}"></i>${u.authStatus === 'pending' ? '撤销审核' : '提交认证'}</button>` : ''}
      </div>
    `;
    const sb = document.getElementById('submitAuth');
    if (sb) sb.onclick = () => {
      const ss = Store.get();
      if (ss.currentUser.authStatus === 'pending') {
        ss.currentUser.authStatus = 'unverified';
        ss.users.find(x => x.id === ss.currentUser.id).authStatus = 'unverified';
        Store.log('撤销认证', `${ss.currentUser.company} 撤销认证申请`, ss.currentUser.company);
        Store.set(ss); toast('已撤销'); return;
      }
      ss.currentUser.authStatus = 'pending';
      ss.currentUser.authMaterials = ['营业执照.pdf', '法人身份证.pdf'];
      const u2 = ss.users.find(x => x.id === ss.currentUser.id);
      if (u2) u2.authStatus = 'pending';
      Store.log('提交认证', `${ss.currentUser.company} 提交企业认证`, ss.currentUser.company);
      Store.set(ss);
      toast('已提交认证，等待审核');
    };
  });

  function editEnterprise() {
    const u = Store.get().currentUser;
    openModal(`
      <div class="field" style="padding:0"><label>企业名称</label><input class="input" id="ec" value="${U.escapeHtml(u.company)}"/></div>
      <div class="field" style="padding:0"><label>联系人</label><input class="input" id="ek" value="${U.escapeHtml(u.contact)}"/></div>
      <div class="field" style="padding:0"><label>手机号</label><input class="input" id="ep" value="${U.escapeHtml(u.phone)}"/></div>
      <button class="btn block" id="saveE"><i data-lucide="save"></i>保存</button>
    `, '编辑企业信息');
    document.getElementById('saveE').onclick = () => {
      const ss = Store.get();
      ss.currentUser.company = document.getElementById('ec').value.trim() || ss.currentUser.company;
      ss.currentUser.contact = document.getElementById('ek').value.trim() || ss.currentUser.contact;
      ss.currentUser.phone = document.getElementById('ep').value.trim() || ss.currentUser.phone;
      const u2 = ss.users.find(x => x.id === ss.currentUser.id);
      if (u2) { u2.company = ss.currentUser.company; u2.phone = ss.currentUser.phone; }
      Store.set(ss);
      closeModal();
      toast('已保存');
    };
  }

  // 订单中心
  register('orders', () => {
    setNav('订单中心');
    const s = Store.get();
    const reportOrders = s.orders.filter(o => o.userId === s.currentUser.id);
    const vasOrders = s.vasOrders.filter(o => o.userId === s.currentUser.id);
    let tab = 'report';

    const draw = () => {
      const $el = document.getElementById('oList');
      if (tab === 'report') {
        if (!reportOrders.length) { $el.innerHTML = '<div class="empty">暂无报告订单</div>'; return; }
        $el.innerHTML = reportOrders.map(o => `
          <div class="card" data-oid="${o.id}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div class="title" style="flex:1">${U.escapeHtml(o.refName)}</div>
              ${o.payStatus === 'paid' && o.status === 'completed' ? '<span class="tag green">已完成</span>' :
                o.payStatus === 'unpaid' && o.status !== 'cancelled' ? '<span class="tag orange">待支付</span>' :
                o.status === 'cancelled' ? '<span class="tag gray">已取消</span>' : '<span class="tag">' + o.status + '</span>'}
            </div>
            <div class="kv"><div class="k">订单号</div><div class="v">${o.id}</div></div>
            <div class="kv"><div class="k">金额</div><div class="v price-big">${U.fmtMoney(o.amount)}</div></div>
            <div class="kv"><div class="k">下单时间</div><div class="v">${U.fmtDate(o.createdAt)}</div></div>
            ${o.payStatus === 'unpaid' && o.status !== 'cancelled' ? `<div style="margin-top:8px;display:flex;gap:8px;justify-content:flex-end"><button class="btn sm muted" data-cancel="${o.id}"><i data-lucide="x"></i>取消</button><button class="btn sm" data-pay="${o.id}"><i data-lucide="credit-card"></i>去支付</button></div>` : ''}
            ${o.payStatus === 'paid' && !o.invoiceId ? `<div style="margin-top:8px;text-align:right"><button class="btn sm ghost" data-invoice="${o.id}"><i data-lucide="receipt"></i>申请发票</button></div>` : ''}
          </div>
        `).join('');
      } else {
        if (!vasOrders.length) { $el.innerHTML = '<div class="empty">暂无服务订单</div>'; return; }
        $el.innerHTML = vasOrders.map(o => `
          <div class="card">
            <div class="title">${U.escapeHtml(o.serviceName)}</div>
            <div class="kv"><div class="k">订单号</div><div class="v">${o.id}</div></div>
            <div class="kv"><div class="k">金额</div><div class="v">${U.fmtMoney(o.amount)}</div></div>
            <div class="kv"><div class="k">服务进度</div><div class="v">${({ pending: '待处理', in_progress: '进行中', completed: '已完成', closed: '已关闭' })[o.progress] || o.progress}</div></div>
            ${o.addonReportId ? `<div class="kv"><div class="k">加购报告</div><div class="v"><span class="tag green">已赠送</span></div></div>` : ''}
          </div>
        `).join('');
      }
      // 绑定事件
      $el.querySelectorAll('[data-oid]').forEach(el =>
        el.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') return; go('orderDetail', { id: el.dataset.oid }); })
      );
      $el.querySelectorAll('[data-pay]').forEach(b => b.onclick = (e) => { e.stopPropagation(); go('payOrder', { id: b.dataset.pay }); });
      $el.querySelectorAll('[data-cancel]').forEach(b => b.onclick = (e) => {
        e.stopPropagation();
        const ss = Store.get();
        const o = ss.orders.find(x => x.id === b.dataset.cancel);
        if (o) { o.status = 'cancelled'; Store.log('用户取消订单', o.id, ss.currentUser.company); Store.set(ss); toast('已取消'); }
      });
      $el.querySelectorAll('[data-invoice]').forEach(b => b.onclick = (e) => { e.stopPropagation(); go('invoiceApply', { orderId: b.dataset.invoice }); });
    };

    $page.innerHTML = `
      <div class="scroll-x" id="oTabs">
        <div class="chip active" data-t="report">报告订单 (${reportOrders.length})</div>
        <div class="chip" data-t="vas">服务订单 (${vasOrders.length})</div>
      </div>
      <div style="padding:0 12px;margin-top:8px" id="oList"></div>
    `;
    document.getElementById('oTabs').addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      tab = c.dataset.t;
      [...e.currentTarget.children].forEach(x => x.classList.toggle('active', x.dataset.t === tab));
      draw();
    });
    draw();
  });

  register('orderDetail', ({ id }) => {
    setNav('订单详情');
    const s = Store.get();
    const o = s.orders.find(x => x.id === id);
    if (!o) { $page.innerHTML = '<div class="empty">订单不存在</div>'; return; }
    const ct = s.contracts.find(c => c.orderId === id);
    const inv = s.invoices.find(i => i.orderId === id);
    const tplCt = s.contractTemplates.find(t => t.id === ct?.templateId);
    $page.innerHTML = `
      <div class="card">
        <div class="title">${U.escapeHtml(o.refName)}</div>
        <div class="kv"><div class="k">订单号</div><div class="v">${o.id}</div></div>
        <div class="kv"><div class="k">分析对象</div><div class="v">${U.escapeHtml(o.target || '-')}</div></div>
        <div class="kv"><div class="k">金额</div><div class="v price-big">${U.fmtMoney(o.amount)}</div></div>
        <div class="kv"><div class="k">支付状态</div><div class="v">${o.payStatus === 'paid' ? '<span class="tag green">已支付</span>' : '<span class="tag orange">未支付</span>'}</div></div>
        <div class="kv"><div class="k">订单状态</div><div class="v">${o.status}</div></div>
        ${o.payStatus === 'paid' && o.type === 'report' ? `<div class="kv"><div class="k">报告状态</div><div class="v">${o.reportStatus === 'ready' ? '<span class="tag green">已生成</span>' : '<span class="tag orange">生成中</span>'}</div></div>` : ''}
        <div class="kv"><div class="k">下单时间</div><div class="v">${U.fmtDate(o.createdAt)}</div></div>
        ${o.paidAt ? `<div class="kv"><div class="k">支付时间</div><div class="v">${U.fmtDate(o.paidAt)}</div></div>` : ''}
        ${o.tradeNo ? `<div class="kv"><div class="k">交易号</div><div class="v">${o.tradeNo}</div></div>` : ''}
      </div>
      ${ct ? `
      <div class="card">
        <div class="title"><i data-lucide="file-text" style="width:18px;height:18px;vertical-align:middle;margin-right:4px"></i>电子合同</div>
        <div class="kv"><div class="k">合同号</div><div class="v">${ct.id}</div></div>
        <div class="kv"><div class="k">签署时间</div><div class="v">${U.fmtDate(ct.signedAt)}</div></div>
        <div class="kv"><div class="k">是否盖章</div><div class="v">${ct.sealed ? '<span class="tag green">已盖章</span>' : '<span class="tag orange">未盖章</span>'}</div></div>
        <button class="btn ghost sm" id="viewCt2" style="margin-top:8px"><i data-lucide="file-text"></i>查看合同</button>
      </div>` : ''}
      ${inv ? `
      <div class="card">
        <div class="title"><i data-lucide="receipt" style="width:18px;height:18px;vertical-align:middle;margin-right:4px"></i>发票信息</div>
        <div class="kv"><div class="k">发票抬头</div><div class="v">${U.escapeHtml(inv.title)}</div></div>
        <div class="kv"><div class="k">发票号</div><div class="v">${inv.no}</div></div>
        <div class="kv"><div class="k">开票时间</div><div class="v">${U.fmtDate(inv.issuedAt)}</div></div>
      </div>` : (o.payStatus === 'paid' ? `<div style="padding:16px"><button class="btn block" id="askInv"><i data-lucide="receipt"></i>申请开发票</button></div>` : '')}
    `;
    const v = document.getElementById('viewCt2');
    if (v) v.onclick = () => {
      const content = (tplCt?.content || '').replace('{{company}}', o.user).replace('{{product}}', o.refName);
      openModal(`<pre style="white-space:pre-wrap;font-size:12px;color:#333;line-height:1.7">${U.escapeHtml(content)}

----- 已电子签章 -----
甲方：${o.user}
乙方：企融通 [电子章]
时间：${U.fmtDate(ct.signedAt)}</pre>
      <button class="btn block" onclick="document.getElementById('modalMask').classList.remove('show')"><i data-lucide="x"></i>关闭</button>`, '电子合同');
    };
    const ai = document.getElementById('askInv'); if (ai) ai.onclick = () => go('invoiceApply', { orderId: o.id });
  });

  // 已购报告
  register('purchasedReports', () => {
    setNav('我的报告库');
    const s = Store.get();
    const list = s.purchasedReports.filter(p => p.userId === s.currentUser.id);
    const genReports = s.generatedReports || [];
    $page.innerHTML = list.length ? `<div style="padding:12px">
      ${list.map(p => {
        const gr = genReports.find(g => g.orderId === p.orderId);
        const isReady = p.reportStatus === 'ready' || (gr != null);
        return `
        <div class="card">
          <div class="title">${U.escapeHtml(p.reportName)}</div>
          <div class="kv"><div class="k">分析对象</div><div class="v">${U.escapeHtml(p.target || '-')}</div></div>
          <div class="kv"><div class="k">购买时间</div><div class="v">${U.fmtDate(p.purchasedAt)}</div></div>
          <div class="kv"><div class="k">报告状态</div><div class="v">${isReady ? '<span class="tag green">已生成</span>' : '<span class="tag orange">生成中</span><span style="font-size:11px;color:#999;margin-left:4px">运营人员正在处理</span>'}</div></div>
          ${isReady ? `
          <div style="margin-top:10px;display:flex;gap:8px">
            <button class="btn ghost sm" data-pre="${p.id}"><i data-lucide="eye"></i>在线预览</button>
            <button class="btn sm" data-dl="${p.id}"><i data-lucide="download"></i>下载 PDF</button>
          </div>` : `<div style="margin-top:8px;font-size:11px;color:#999"><i data-lucide="clock" style="width:12px;height:12px;vertical-align:middle"></i> 报告生成中，预计1-3个工作日内完成</div>`}
        </div>
      `;}).join('')}
    </div>` : '<div class="empty">暂无已购报告</div>';
    $page.querySelectorAll('[data-pre]').forEach(b => b.onclick = () => {
      const p = list.find(x => x.id === b.dataset.pre);
      const gr = genReports.find(g => g.orderId === p.orderId);
      openModal(`<div style="font-size:13px;line-height:1.8;color:#333">
        <h3 style="margin:0 0 10px">${U.escapeHtml(p.reportName)}</h3>
        <div><strong>分析对象</strong>：${U.escapeHtml(p.target || '-')}</div>
        <p>${gr ? U.escapeHtml(gr.summary || '本报告基于公开工商数据、司法数据、招投标数据、舆情数据综合分析输出。') : '报告生成中……'}</p>
        <p><strong>生成时间</strong>：${gr ? U.fmtDate(gr.generatedAt) : '-'}</p>
      </div>`, '报告预览');
    });
    $page.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => toast('PDF 已开始下载（演示）'));
  });

  // 政策收藏
  register('policyFavs', () => {
    setNav('政策收藏夹');
    const s = Store.get();
    const myFavIds = s.policyFavs.filter(f => f.userId === s.currentUser.id).map(f => f.policyId);
    const list = s.policies.filter(p => myFavIds.includes(p.id));
    $page.innerHTML = list.length ? `<div style="padding:12px">
      ${list.map(p => `
        <div class="plc-card" data-pid="${p.id}" style="margin-bottom:8px;cursor:pointer">
          <div class="plc-card-title double-line-ellipsis">${U.escapeHtml(p.title)}</div>
          <div class="plc-card-meta"><span class="tag">${p.region}</span><span class="tag gray">${p.cate}</span></div>
        </div>
      `).join('')}
    </div>` : '<div class="empty">暂无收藏的政策</div>';
    $page.querySelectorAll('[data-pid]').forEach(el => el.onclick = () => go('policyDetail', { id: el.dataset.pid }));
  });

  // 发票
  register('invoiceProfiles', () => {
    setNav('发票管理', { text: '+ 抬头', onClick: () => editInvoiceProfile() });
    const s = Store.get();
    const list = s.invoiceProfiles.filter(p => p.userId === s.currentUser.id);
    $page.innerHTML = `
      <div class="section-head" style="margin-top:8px">发票抬头</div>
      <div style="padding:0 12px">
        ${list.length ? list.map(p => `
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div class="title">${U.escapeHtml(p.title)} ${p.isDefault ? '<span class="tag green">默认</span>' : ''}</div>
              <button class="btn sm muted" data-edit="${p.id}">编辑</button>
            </div>
            <div class="kv"><div class="k">税号</div><div class="v">${U.escapeHtml(p.taxNo)}</div></div>
            <div class="kv"><div class="k">地址电话</div><div class="v">${U.escapeHtml(p.address)} ${U.escapeHtml(p.phone)}</div></div>
            <div class="kv"><div class="k">开户行</div><div class="v">${U.escapeHtml(p.bank)} ${U.escapeHtml(p.bankNo)}</div></div>
            ${!p.isDefault ? `<div style="margin-top:8px;text-align:right"><button class="btn sm ghost" data-default="${p.id}"><i data-lucide="check"></i>设为默认</button></div>` : ''}
          </div>
        `).join('') : '<div class="empty">尚未添加抬头</div>'}
      </div>
      <div class="section-head">开票申请记录</div>
      <div style="padding:0 12px" id="invList"></div>
      <div class="section-head">已开票记录</div>
      <div style="padding:0 12px" id="invDoneList"></div>
    `;
    const reqs = s.invoiceRequests.filter(r => r.userId === s.currentUser.id);
    const invs = s.invoices.filter(i => i.userId === s.currentUser.id);
    document.getElementById('invList').innerHTML = reqs.length ? reqs.map(r => `
      <div class="card">
        <div class="kv"><div class="k">订单</div><div class="v">${r.orderId}</div></div>
        <div class="kv"><div class="k">抬头</div><div class="v">${U.escapeHtml(r.title)}</div></div>
        <div class="kv"><div class="k">金额</div><div class="v">${U.fmtMoney(r.amount)}</div></div>
        <div class="kv"><div class="k">状态</div><div class="v">${({ pending: '<span class="tag orange">待审核</span>', approved: '<span class="tag green">已开票</span>', rejected: '<span class="tag red">已驳回</span>' })[r.status]}</div></div>
        ${r.note ? `<div class="kv"><div class="k">备注</div><div class="v">${U.escapeHtml(r.note)}</div></div>` : ''}
      </div>
    `).join('') : '<div class="empty">暂无申请</div>';
    document.getElementById('invDoneList').innerHTML = invs.length ? invs.map(i => `
      <div class="card">
        <div class="kv"><div class="k">发票号</div><div class="v">${i.no}</div></div>
        <div class="kv"><div class="k">抬头</div><div class="v">${U.escapeHtml(i.title)}</div></div>
        <div class="kv"><div class="k">金额</div><div class="v">${U.fmtMoney(i.amount)}</div></div>
        <div class="kv"><div class="k">开票时间</div><div class="v">${U.fmtDate(i.issuedAt)}</div></div>
        <div style="display:flex;gap:8px;margin-top:8px"><button class="btn sm ghost" data-mail="${i.id}"><i data-lucide="mail"></i>重发邮件</button><button class="btn sm" data-pdf="${i.id}"><i data-lucide="download"></i>下载 PDF</button></div>
      </div>
    `).join('') : '<div class="empty">暂无发票</div>';
    $page.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editInvoiceProfile(b.dataset.edit));
    $page.querySelectorAll('[data-default]').forEach(b => b.onclick = () => {
      const ss = Store.get();
      ss.invoiceProfiles.forEach(p => { if (p.userId === ss.currentUser.id) p.isDefault = (p.id === b.dataset.default); });
      Store.set(ss); toast('已设为默认');
    });
    $page.querySelectorAll('[data-mail]').forEach(b => b.onclick = () => toast('已发送至邮箱'));
    $page.querySelectorAll('[data-pdf]').forEach(b => b.onclick = () => toast('PDF 已开始下载'));
  });

  function editInvoiceProfile(id) {
    const s = Store.get();
    const p = id ? s.invoiceProfiles.find(x => x.id === id) : { id: '', userId: s.currentUser.id, isDefault: false, title: '', taxNo: '', address: '', phone: '', bank: '', bankNo: '' };
    openModal(`
      <div class="field" style="padding:0"><label>发票抬头</label><input class="input" id="ipt" value="${U.escapeHtml(p.title)}"/></div>
      <div class="field" style="padding:0"><label>纳税人识别号</label><input class="input" id="ipx" value="${U.escapeHtml(p.taxNo)}"/></div>
      <div class="field" style="padding:0"><label>地址</label><input class="input" id="ipa" value="${U.escapeHtml(p.address)}"/></div>
      <div class="field" style="padding:0"><label>电话</label><input class="input" id="ipp" value="${U.escapeHtml(p.phone)}"/></div>
      <div class="field" style="padding:0"><label>开户行</label><input class="input" id="ipb" value="${U.escapeHtml(p.bank)}"/></div>
      <div class="field" style="padding:0"><label>账号</label><input class="input" id="ipn" value="${U.escapeHtml(p.bankNo)}"/></div>
      <button class="btn block" id="saveIp"><i data-lucide="save"></i>保存</button>
    `, id ? '编辑抬头' : '新增抬头');
    document.getElementById('saveIp').onclick = () => {
      const title = document.getElementById('ipt').value.trim();
      const taxNo = document.getElementById('ipx').value.trim();
      if (!title || !taxNo) { toast('抬头和税号必填'); return; }
      const ss = Store.get();
      if (id) {
        const t = ss.invoiceProfiles.find(x => x.id === id);
        Object.assign(t, { title, taxNo, address: document.getElementById('ipa').value.trim(), phone: document.getElementById('ipp').value.trim(), bank: document.getElementById('ipb').value.trim(), bankNo: document.getElementById('ipn').value.trim() });
      } else {
        const np = { id: Store.uid('IP'), userId: ss.currentUser.id, isDefault: ss.invoiceProfiles.filter(x => x.userId === ss.currentUser.id).length === 0, title, taxNo, address: document.getElementById('ipa').value.trim(), phone: document.getElementById('ipp').value.trim(), bank: document.getElementById('ipb').value.trim(), bankNo: document.getElementById('ipn').value.trim() };
        ss.invoiceProfiles.push(np);
      }
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
      $page.innerHTML = `
        <div class="card">
          <div class="kv"><div class="k">订单号</div><div class="v">${o.id}</div></div>
          <div class="kv"><div class="k">商品</div><div class="v">${U.escapeHtml(o.refName)}</div></div>
          <div class="kv"><div class="k">开票金额</div><div class="v price-big">${U.fmtMoney(o.amount)}</div></div>
        </div>
        <div class="section-head">选择发票抬头</div>
        <div style="padding:0 12px">
          ${profiles.map(p => `
            <div class="card" style="border:1px solid ${pickedId === p.id ? '#4a6cf7' : 'transparent'}" data-pid="${p.id}">
              <div class="title">${U.escapeHtml(p.title)} ${p.isDefault ? '<span class="tag green">默认</span>' : ''}</div>
              <div class="kv"><div class="k">税号</div><div class="v">${U.escapeHtml(p.taxNo)}</div></div>
            </div>
          `).join('')}
          ${!profiles.length ? '<div class="empty">请先在「我的-发票管理」添加抬头</div>' : ''}
        </div>
        <div class="field"><label>接收邮箱</label><input class="input" id="iemail" placeholder="邮箱（接收电子发票）" /></div>
        <div class="bottom-bar"><button class="btn block" id="submitInv"><i data-lucide="send"></i>提交申请</button></div>
      `;
      $page.querySelectorAll('[data-pid]').forEach(c => c.onclick = () => { pickedId = c.dataset.pid; draw(); });
      document.getElementById('submitInv').onclick = () => {
        if (!pickedId) { toast('请选择抬头'); return; }
        const email = document.getElementById('iemail').value.trim();
        if (!email) { toast('请填写邮箱'); return; }
        const ss = Store.get();
        const p = ss.invoiceProfiles.find(x => x.id === pickedId);
        const req = {
          id: Store.uid('IR'), orderId: o.id, userId: ss.currentUser.id, user: ss.currentUser.company,
          title: p.title, taxNo: p.taxNo, amount: o.amount, email, status: 'pending',
          createdAt: Date.now(), note: '',
        };
        ss.invoiceRequests.unshift(req);
        Store.log('开票申请', `订单 ${o.id} 申请开票`, ss.currentUser.company);
        Store.set(ss);
        toast('已提交，等待审核');
        setTimeout(back, 600);
      };
    };
    draw();
  });

  // 安全
  register('security', () => {
    setNav('账号安全');
    const u = Store.get().currentUser;
    $page.innerHTML = `
      <div class="card" style="padding:0">
        <div class="list-item"><div class="body"><div class="t">手机号</div><div class="d">${U.escapeHtml(u.phone)}</div></div><div class="arrow">›</div></div>
        <div class="list-item"><div class="body"><div class="t">登录密码</div><div class="d">建议每 90 天更换一次</div></div><div class="arrow">›</div></div>
        <div class="list-item"><div class="body"><div class="t">微信授权</div><div class="d">已绑定微信</div></div><div class="arrow">›</div></div>
      </div>
    `;
    $page.querySelectorAll('.list-item').forEach(el => el.onclick = () => toast('演示项'));
  });

  register('about', () => {
    setNav('关于 / 帮助');
    const s = Store.get();
    $page.innerHTML = `
      <div class="card">
        <div class="title">企融通小程序</div>
        <div class="kv"><div class="k">版本</div><div class="v">v${s.version}</div></div>
        <div class="kv"><div class="k">客服电话</div><div class="v">400-888-0000</div></div>
        <div class="kv"><div class="k">客服邮箱</div><div class="v">support@qrt-service.cn</div></div>
      </div>
      <div class="card" style="padding:0">
        <div class="list-item"><div class="body"><div class="t">用户协议</div></div><div class="arrow">›</div></div>
        <div class="list-item"><div class="body"><div class="t">隐私政策</div></div><div class="arrow">›</div></div>
        <div class="list-item"><div class="body"><div class="t">常见问题</div></div><div class="arrow">›</div></div>
        <div class="list-item" id="resetBtn" style="color:#f56c6c"><div class="body"><div class="t" style="color:#f56c6c">重置演示数据</div><div class="d">清空所有演示数据</div></div><div class="arrow">›</div></div>
      </div>
    `;
    document.getElementById('resetBtn').onclick = () => {
      if (!confirm('确定重置所有演示数据？')) return;
      Store.reset(); toast('已重置'); setTimeout(() => reset('home'), 400);
    };
    $page.querySelectorAll('.list-item:not(#resetBtn)').forEach(el => el.onclick = () => toast('演示项'));
  });

  // 启动
  reset('home');

  // 初始化 Lucide 图标
  if (window.lucide) {
    lucide.createIcons();
  }
})();
