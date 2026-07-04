// 运营后台 SPA
(function () {
  const $menu = document.getElementById('menu');
  const $crumb = document.getElementById('crumb');
  const $content = document.getElementById('content');
  const $toast = document.getElementById('toast');
  const $modalMask = document.getElementById('modalMask');
  const $modal = document.getElementById('modal');
  const $modalT = document.getElementById('modalT');
  const $modalB = document.getElementById('modalB');
  const $modalF = document.getElementById('modalF');
  const $modalX = document.getElementById('modalX');

  // Toast
  let toastTimer = null;
  function toast(msg, isError = false) {
    $toast.textContent = msg;
    $toast.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove('show'), 2000);
  }

  // Modal
  function openModal(title, bodyHtml, footerHtml) {
    $modalT.textContent = title;
    $modalB.innerHTML = bodyHtml;
    $modalF.innerHTML = footerHtml || '';
    $modal.className = bodyHtml.includes('class="modal') && bodyHtml.includes('lg') ? 'modal lg' : 'modal';
    $modalMask.classList.add('show');
    // 初始化模态框中的 Lucide 图标
    if (window.lucide) {
      setTimeout(() => lucide.createIcons(), 0);
    }
  }
  function closeModal() { $modalMask.classList.remove('show'); }
  $modalX.onclick = closeModal;
  $modalMask.addEventListener('click', (e) => { if (e.target === $modalMask) closeModal(); });

  // 路由
  const routes = {};
  let current = 'dashboard';
  function register(name, fn) { routes[name] = fn; }
  function go(name) {
    if (!routes[name]) return;
    current = name;
    renderMenu();
    $content.scrollTop = 0;
    $content.innerHTML = '';
    routes[name]();
    // 重新初始化 Lucide 图标
    if (window.lucide) {
      setTimeout(() => lucide.createIcons(), 0);
    }
  }

  // 菜单
  const menuDef = [
    { grp: '概览', items: [{ id: 'dashboard', ico: 'bar-chart-3', label: '数据看板', badge: 0 }] },
    { grp: '报告与服务', items: [
      { id: 'reports', ico: 'file-text', label: '报告库管理', badge: 0 },
      { id: 'reportRecords', ico: 'file-check', label: '报告生成中心', badge: 0 },
      { id: 'vasServices', ico: 'wrench', label: '增值服务管理', badge: 0 },
      { id: 'vasOrders', ico: 'package', label: '服务订单', badge: 0 },
    ]},
    { grp: 'VIP 余额（AIC）', items: [
      { id: 'vipPlans', ico: 'wallet', label: 'AIC 充值套餐', badge: 0 },
      { id: 'vipOrders', ico: 'credit-card', label: 'AIC 充值订单', badge: 0 },
      { id: 'aicConsumptions', ico: 'activity', label: 'AIC 消耗统计', badge: 0 },
      { id: 'refundRequests', ico: 'undo-2', label: '退款申请', badge: 0 },
      { id: 'aicConfig', ico: 'settings-2', label: '计费配置', badge: 0 },
    ]},
    { grp: '订单与财务', items: [
      { id: 'orders', ico: 'shopping-cart', label: '订单管理', badge: 0 },
      { id: 'payFlows', ico: 'credit-card', label: '支付流水', badge: 0 },
      { id: 'invoices', ico: 'receipt', label: '发票管理', badge: 0 },
    ]},
    { grp: '合同管理', items: [
      { id: 'contracts', ico: 'file-signature', label: '合同管理', badge: 0 },
    ]},
    { grp: '用户与权限', items: [
      { id: 'users', ico: 'users', label: '用户管理', badge: 0 },
      { id: 'authReview', ico: 'check-circle', label: '认证审核', badge: 0 },
    ]},
    { grp: '运营配置', items: [
      { id: 'announcements', ico: 'megaphone', label: '公告管理', badge: 0 },
      { id: 'businessIntents', ico: 'trending-up', label: '业务意向管理', badge: 0 },
      { id: 'opLogs', ico: 'list', label: '操作日志', badge: 0 },
    ]},
  ];

  function renderMenu() {
    const s = Store.get();
    // 计算 badge
    const pendingAuth = s.users.filter(u => u.authStatus === 'pending').length;
    const pendingInv = s.invoiceRequests.filter(r => r.status === 'pending').length;
    const pendingRefunds = (s.refundRequests || []).filter(r => r.status === 'pending').length;
    menuDef.find(g => g.grp === '用户与权限').items.find(i => i.id === 'authReview').badge = pendingAuth;
    menuDef.find(g => g.grp === '订单与财务').items.find(i => i.id === 'invoices').badge = pendingInv;
    menuDef.find(g => g.grp === 'VIP 余额（AIC）').items.find(i => i.id === 'refundRequests').badge = pendingRefunds;

    $menu.innerHTML = menuDef.map(g => `
      <div class="menu-grp">${g.grp}</div>
      ${g.items.map(it => `
        <div class="menu-item ${current === it.id ? 'active' : ''}" data-go="${it.id}">
          <i data-lucide="${it.ico}"></i><span>${it.label}</span>
          ${it.badge ? `<span class="badge">${it.badge}</span>` : ''}
        </div>
      `).join('')}
    `).join('');

    // 初始化 Lucide 图标
    if (window.lucide) {
      lucide.createIcons();
    }
    $menu.querySelectorAll('[data-go]').forEach(el =>
      el.addEventListener('click', () => go(el.dataset.go))
    );
  }

  // 订阅数据变化
  Store.on(() => { if (routes[current]) routes[current](); renderMenu(); });

  // 重置
  document.getElementById('resetBtn').onclick = () => {
    if (!confirm('确定重置所有演示数据？')) return;
    Store.reset(); toast('已重置'); setTimeout(() => go('dashboard'), 300);
  };

  // ---------- 页面：数据看板 ----------
  register('dashboard', () => {
    $crumb.innerHTML = '<b>数据看板</b>';
    const s = Store.get();
    const totalOrders = s.orders.length;
    const vipOrders = s.vipOrders || [];
    const aicRecharge = vipOrders.filter(o => o.payStatus === 'paid').reduce((sum, o) => sum + (o.amount || 0), 0);
    const aicGranted = vipOrders.filter(o => o.payStatus === 'paid').reduce((sum, o) => sum + (o.aic || o.amount || 0), 0);
    const totalUsers = s.users.length;
    const verifiedUsers = s.users.filter(u => u.authStatus === 'verified').length;
    const vipUsers = s.users.filter(u => (u.aicBalance || 0) > 0 || (u.aicTotalRecharged || 0) > 0).length;
    const totalBalance = s.users.reduce((sum, u) => sum + (u.aicBalance || 0), 0);
    const totalConsumed = s.users.reduce((sum, u) => sum + (u.aicTotalConsumed || 0), 0);
    const totalReports = (s.generatedReports || []).length;
    const pendingAuth = s.users.filter(u => u.authStatus === 'pending').length;
    const pendingInv = s.invoiceRequests.filter(r => r.status === 'pending').length;
    const pendingRefunds = (s.refundRequests || []).filter(r => r.status === 'pending').length;
    const consumes = s.aicConsumptions || [];
    // 今日消耗
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayConsumed = consumes.filter(c => c.createdAt >= todayStart.getTime()).reduce((s, c) => s + (c.aicCost || 0), 0);
    $content.innerHTML = `
      <div class="page-head"><h1>数据看板</h1></div>
      <div class="stat-row">
        <div class="stat-card"><div class="l">AIC 充值总额</div><div class="v green">${U.fmtMoney(aicRecharge)}</div></div>
        <div class="stat-card"><div class="l">累计发放 AIC</div><div class="v">${aicGranted.toFixed(1)}</div></div>
        <div class="stat-card"><div class="l">用户在册 AIC 余额</div><div class="v blue">${totalBalance.toFixed(1)}</div></div>
        <div class="stat-card"><div class="l">累计已消耗 AIC</div><div class="v orange">${totalConsumed.toFixed(1)}</div></div>
      </div>
      <div class="stat-row">
        <div class="stat-card"><div class="l">今日消耗 AIC</div><div class="v orange">${todayConsumed.toFixed(1)}</div></div>
        <div class="stat-card"><div class="l">VIP 余额用户</div><div class="v">${vipUsers}</div></div>
        <div class="stat-card"><div class="l">充值订单数</div><div class="v">${vipOrders.length}</div></div>
        <div class="stat-card"><div class="l">退款申请</div><div class="v ${pendingRefunds ? 'orange' : ''}">${pendingRefunds}</div></div>
      </div>
      <div class="stat-row">
        <div class="stat-card"><div class="l">报告订单</div><div class="v">${totalOrders}</div></div>
        <div class="stat-card"><div class="l">服务订单</div><div class="v blue">${s.vasOrders.length}</div></div>
        <div class="stat-card"><div class="l">报告生成量</div><div class="v">${totalReports}</div></div>
        <div class="stat-card"><div class="l">注册用户</div><div class="v blue">${totalUsers}</div></div>
      </div>
      <div class="stat-row">
        <div class="stat-card"><div class="l">已认证用户</div><div class="v">${verifiedUsers}</div></div>
        <div class="stat-card"><div class="l">待审核认证</div><div class="v orange">${pendingAuth}</div></div>
        <div class="stat-card"><div class="l">待处理发票</div><div class="v orange">${pendingInv}</div></div>
        <div class="stat-card"><div class="l">AIC 充值套餐</div><div class="v">${(s.vipPlans || []).filter(p => p.status === 'on').length}</div></div>
      </div>
      <div class="row">
        <div class="card-block">
          <h3>最近 AIC 充值</h3>
          <table class="tbl">
            <thead><tr><th>订单号</th><th>用户</th><th>面额</th><th>到账 AIC</th><th>时间</th></tr></thead>
            <tbody>
              ${vipOrders.slice(0, 5).map(o => `
                <tr>
                  <td>${o.id}</td>
                  <td>${U.escapeHtml(o.user)}</td>
                  <td>${U.fmtMoney(o.amount)}</td>
                  <td><span class="tag green">+${(o.aic || o.amount).toFixed(1)} AIC</span></td>
                  <td>${U.fmtDate(o.createdAt)}</td>
                </tr>
              `).join('') || '<tr class="empty-row"><td colspan="5">暂无充值订单</td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="card-block">
          <h3>最近 AIC 消耗</h3>
          <table class="tbl">
            <thead><tr><th>用户</th><th>项目</th><th>token</th><th>AIC</th><th>时间</th></tr></thead>
            <tbody>
              ${consumes.slice(0, 5).map(c => `
                <tr>
                  <td>${U.escapeHtml(c.user || '')}</td>
                  <td>${U.escapeHtml(c.refName || '')}</td>
                  <td>${(c.tokens || 0).toLocaleString()}</td>
                  <td><span class="tag orange">-${(c.aicCost || 0).toFixed(1)}</span></td>
                  <td>${U.fmtDate(c.createdAt)}</td>
                </tr>
              `).join('') || '<tr class="empty-row"><td colspan="5">暂无消耗记录</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  // ---------- 页面：报告库管理 ----------
  register('reports', () => {
    $crumb.innerHTML = '<b>报告库管理</b>';
    const s = Store.get();
    $content.innerHTML = `
      <div class="page-head"><h1>报告库管理</h1><button class="btn" id="addR"><i data-lucide="plus"></i>新增报告</button></div>
      <div class="card-block" style="margin-bottom:12px;background:#fff8e1;border:1px solid #ffe0b2">
        <div style="display:flex;gap:8px;align-items:center;color:#bf360c;font-size:13px"><i data-lucide="layers"></i> 报告库提供 ${s.reports.length} 类专业报告 × 3 档（简易版 / 标准版 / 专家版），按后台大模型实际 token 消耗结算。</div>
      </div>
      <table class="tbl">
        <thead><tr><th>报告名称</th><th>分类</th><th>必要信息</th><th>档位</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          ${s.reports.map(r => `
            <tr>
              <td><b>${U.escapeHtml(r.name)}</b><br><span style="font-size:12px;color:#888">${U.escapeHtml(r.desc)}</span></td>
              <td>${U.escapeHtml(r.cate)}</td>
              <td>${(r.fields || []).map(f => `<span class="tag" style="background:#eef;color:#1976d2;margin:2px">${U.escapeHtml(f.label)}${f.required ? ' *' : ''}</span>`).join('') || '<span style="color:#bbb">-</span>'}</td>
              <td>${(r.tiers || []).map(t => `
                <div style="font-size:12px;color:#555;line-height:1.6">
                  <span class="tag ${t.id === 't1' ? 'green' : t.id === 't2' ? 'orange' : 'red'}" style="margin-right:4px">${U.escapeHtml(t.name)}</span>
                </div>`).join('')}</td>
              <td>${r.status === 'on' ? '<span class="tag green">上架</span>' : '<span class="tag gray">下架</span>'}</td>
              <td class="actions">
                <button class="btn sm muted" data-edit="${r.id}"><i data-lucide="pencil"></i>编辑</button>
                <button class="btn sm muted" data-tiers="${r.id}"><i data-lucide="layers"></i>档位</button>
                <button class="btn sm ${r.status === 'on' ? 'muted' : 'success'}" data-toggle="${r.id}"><i data-lucide="${r.status === 'on' ? 'eye-off' : 'eye'}"></i>${r.status === 'on' ? '下架' : '上架'}</button>
                <button class="btn sm danger" data-del="${r.id}"><i data-lucide="trash-2"></i>删除</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    document.getElementById('addR').onclick = () => editReport();
    $content.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editReport(b.dataset.edit));
    $content.querySelectorAll('[data-tiers]').forEach(b => b.onclick = () => editReportTiers(b.dataset.tiers));
    $content.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
      const ss = Store.get();
      const r = ss.reports.find(x => x.id === b.dataset.toggle);
      if (r) { r.status = r.status === 'on' ? 'off' : 'on'; Store.log('切换报告状态', `${r.name} ${r.status}`, 'admin'); Store.set(ss); toast('已更新'); }
    });
    $content.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const id = b.dataset.del;
      const ss = Store.get();
      const r = ss.reports.find(x => x.id === id);
      if (!r) return;
      openModal('确认删除', `<p>确定要删除报告「${U.escapeHtml(r.name)}」吗？此操作不可恢复。</p>`,
        `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn danger" id="confirmDel">确认删除</button>`);
      document.getElementById('confirmDel').onclick = () => {
        ss.reports = ss.reports.filter(x => x.id !== id);
        Store.log('删除报告', r.name, 'admin');
        Store.set(ss); closeModal(); toast('已删除');
      };
    });
  });

  function editReport(id) {
    const s = Store.get();
    const r = id ? s.reports.find(x => x.id === id) : { id: '', name: '', cate: '企业报告', desc: '', icon: 'file-text', status: 'on', fields: [], tiers: [] };
    openModal(id ? '编辑报告' : '新增报告', `
      <div class="row">
        <div class="field"><label>报告名称</label><input class="input" id="rn" value="${U.escapeHtml(r.name)}"/></div>
        <div class="field"><label>分类</label><input class="input" id="rc" value="${U.escapeHtml(r.cate)}"/></div>
        <div class="field"><label>图标 (lucide 名)</label><input class="input" id="ri" value="${U.escapeHtml(r.icon || 'file-text')}"/></div>
      </div>
      <div class="field"><label>描述</label><textarea class="textarea" id="rd">${U.escapeHtml(r.desc)}</textarea></div>
      <div style="font-size:12px;color:#888;line-height:1.6">档位与必填信息：${id ? '请使用列表里的"档位"按钮单独编辑' : '保存后请前往"档位"按钮配置档位与必填字段'}</div>
    `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn" id="saveR">保存</button>`);
    document.getElementById('saveR').onclick = () => {
      const name = document.getElementById('rn').value.trim();
      const desc = document.getElementById('rd').value.trim();
      if (!name || !desc) { toast('名称和描述必填', true); return; }
      const ss = Store.get();
      if (id) {
        const t = ss.reports.find(x => x.id === id);
        Object.assign(t, { name, cate: document.getElementById('rc').value.trim(), icon: document.getElementById('ri').value.trim() || 'file-text', desc });
        Store.log('编辑报告', name, 'admin');
      } else {
        ss.reports.push({
          id: Store.uid('R'), name,
          cate: document.getElementById('rc').value.trim(),
          icon: document.getElementById('ri').value.trim() || 'file-text',
          desc, status: 'on',
          fields: [{ key: 'target', label: '目标对象', placeholder: '请输入', required: true }],
          tiers: [
            { id: 't1', name: '简易版', label: '快览', aic: 50, eta: '5 分钟', desc: '快速概览' },
            { id: 't2', name: '标准版', label: '详细', aic: 150, eta: '30 分钟', desc: '详细分析' },
            { id: 't3', name: '专家版', label: '深度+策略', aic: 400, eta: '2 小时', desc: '深度+策略' },
          ],
        });
        Store.log('新增报告', name, 'admin');
      }
      Store.set(ss); closeModal(); toast('已保存');
    };
  }

  function editReportTiers(id) {
    const ss = Store.get();
    const r = ss.reports.find(x => x.id === id);
    if (!r) return;
    const tiers = r.tiers || [];
    openModal(`${r.name} - 档位与必填信息`, `
      <h4 style="margin:0 0 8px;color:#333">档位</h4>
      ${tiers.map(t => `
        <div class="card-block" style="margin-bottom:8px">
          <div class="row">
            <div class="field"><label>档位 (${t.id})</label><input class="input" data-t="${t.id}" data-k="name" value="${U.escapeHtml(t.name)}"/></div>
            <div class="field"><label>标签</label><input class="input" data-t="${t.id}" data-k="label" value="${U.escapeHtml(t.label)}"/></div>
          </div>
          <div class="field"><label>说明</label><textarea class="textarea" data-t="${t.id}" data-k="desc">${U.escapeHtml(t.desc || '')}</textarea></div>
        </div>
      `).join('') || '<div style="color:#888">暂未配置档位</div>'}

      <h4 style="margin:14px 0 8px;color:#333">必填 / 选填字段</h4>
      <table class="tbl">
        <thead><tr><th>字段 key</th><th>标签</th><th>placeholder</th><th>必填</th></tr></thead>
        <tbody>
          ${(r.fields || []).map((f, idx) => `
            <tr>
              <td>${U.escapeHtml(f.key)}</td>
              <td><input class="input" data-f="${idx}" data-k="label" value="${U.escapeHtml(f.label)}"/></td>
              <td><input class="input" data-f="${idx}" data-k="placeholder" value="${U.escapeHtml(f.placeholder || '')}"/></td>
              <td><input type="checkbox" data-f="${idx}" data-k="required" ${f.required ? 'checked' : ''}/></td>
            </tr>
          `).join('') || '<tr class="empty-row"><td colspan="4">暂无字段</td></tr>'}
        </tbody>
      </table>
    `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn" id="saveTiers">保存</button>`);
    document.getElementById('saveTiers').onclick = () => {
      const ss2 = Store.get();
      const r2 = ss2.reports.find(x => x.id === id);
      // 应用档位
      $modalB.querySelectorAll('[data-t]').forEach(inp => {
        const tid = inp.dataset.t;
        const key = inp.dataset.k;
        const tier = r2.tiers.find(x => x.id === tid);
        if (!tier) return;
        tier[key] = inp.value.trim();
      });
      // 应用字段
      $modalB.querySelectorAll('[data-f]').forEach(inp => {
        const fi = parseInt(inp.dataset.f, 10);
        const key = inp.dataset.k;
        const f = r2.fields[fi];
        if (!f) return;
        if (key === 'required') f.required = inp.checked;
        else f[key] = inp.value.trim();
      });
      Store.log('编辑报告档位', r2.name, 'admin');
      Store.set(ss2); closeModal(); toast('已保存');
    };
  }

  function editVasService(id) {
    const s = Store.get();
    const v = id ? s.vasServices.find(x => x.id === id) : { id: '', name: '', desc: '', vendor: '', contact: '', status: 'on' };
    openModal(id ? '编辑服务' : '新增服务', `
      <div class="field"><label>服务名称</label><input class="input" id="vn" value="${U.escapeHtml(v.name)}"/></div>
      <div class="field"><label>描述</label><textarea class="textarea" id="vd">${U.escapeHtml(v.desc)}</textarea></div>
      <div class="row">
        <div class="field"><label>服务商</label><input class="input" id="vv" value="${U.escapeHtml(v.vendor)}"/></div>
        <div class="field"><label>联系方式</label><input class="input" id="vc" value="${U.escapeHtml(v.contact)}"/></div>
      </div>
      <div class="field"><label>权益方式</label><div style="padding:8px 0;color:#5d4037;font-size:13px"><i data-lucide="crown" style="width:14px;height:14px;vertical-align:middle"></i> SVIP 会员免费</div></div>
    `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn" id="saveV">保存</button>`);
    document.getElementById('saveV').onclick = () => {
      const name = document.getElementById('vn').value.trim();
      const desc = document.getElementById('vd').value.trim();
      if (!name || !desc) { toast('名称和描述必填', true); return; }
      const ss = Store.get();
      if (id) {
        const t = ss.vasServices.find(x => x.id === id);
        Object.assign(t, { name, desc, vendor: document.getElementById('vv').value.trim(), contact: document.getElementById('vc').value.trim() });
        Store.log('编辑服务', name, 'admin');
      } else {
        ss.vasServices.push({ id: Store.uid('V'), name, desc, vendor: document.getElementById('vv').value.trim(), contact: document.getElementById('vc').value.trim(), status: 'on' });
        Store.log('新增服务', name, 'admin');
      }
      Store.set(ss); closeModal(); toast('已保存');
    };
  }

  function editUser(id) {
    const s = Store.get();
    const u = s.users.find(x => x.id === id);
    if (!u) return;
    const expireDate = u.vipExpireAt ? new Date(u.vipExpireAt).toISOString().slice(0, 10) : '';
    openModal('编辑用户', `
      <div class="field"><label>企业名称</label><input class="input" id="uc" value="${U.escapeHtml(u.company)}"/></div>
      <div class="field"><label>手机号</label><input class="input" id="up" value="${U.escapeHtml(u.phone)}"/></div>
      <div class="field"><label>认证状态</label><select class="select" id="ua">
        <option value="unverified" ${u.authStatus === 'unverified' ? 'selected' : ''}>未认证</option>
        <option value="pending" ${u.authStatus === 'pending' ? 'selected' : ''}>审核中</option>
        <option value="verified" ${u.authStatus === 'verified' ? 'selected' : ''}>已认证</option>
        <option value="rejected" ${u.authStatus === 'rejected' ? 'selected' : ''}>已驳回</option>
      </select></div>
      <div class="row">
        <div class="field"><label>会员等级</label><select class="select" id="uvl">
          <option value="none" ${(!u.vipLevel || u.vipLevel === 'none') ? 'selected' : ''}>普通用户</option>
          <option value="vip" ${u.vipLevel === 'vip' ? 'selected' : ''}>VIP</option>
          <option value="svip" ${u.vipLevel === 'svip' ? 'selected' : ''}>SVIP</option>
        </select></div>
        <div class="field"><label>VIP 到期日</label><input class="input" type="date" id="uve" value="${expireDate}"/></div>
      </div>
    `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn" id="saveU">保存</button>`);
    document.getElementById('saveU').onclick = () => {
      const ss = Store.get();
      const t = ss.users.find(x => x.id === id);
      if (t) {
        t.company = document.getElementById('uc').value.trim() || t.company;
        t.phone = document.getElementById('up').value.trim() || t.phone;
        t.authStatus = document.getElementById('ua').value;
        const lv = document.getElementById('uvl').value;
        const ed = document.getElementById('uve').value;
        t.vipLevel = lv;
        t.vipExpireAt = lv === 'none' ? 0 : (ed ? new Date(ed + 'T23:59:59').getTime() : 0);
        if (t.id === ss.currentUser.id) {
          ss.currentUser.company = t.company;
          ss.currentUser.phone = t.phone;
          ss.currentUser.authStatus = t.authStatus;
          ss.currentUser.vipLevel = t.vipLevel;
          ss.currentUser.vipExpireAt = t.vipExpireAt;
        }
        Store.log('编辑用户', `${t.company} 等级=${t.vipLevel}`, 'admin');
      }
      Store.set(ss); closeModal(); toast('已保存');
    };
  }

  // ---------- 页面：报告生成中心 ----------
  register('reportRecords', () => {
    $crumb.innerHTML = '<b>报告生成中心</b>';
    const s = Store.get();
    const paidOrders = s.orders.filter(o => o.type === 'report' && o.payStatus === 'paid');
    $content.innerHTML = `
      <div class="page-head"><h1>报告生成中心</h1></div>
      <table class="tbl">
        <thead><tr><th>订单号</th><th>报告名称</th><th>用户</th><th>分析对象</th><th>支付时间</th><th>报告状态</th><th>操作</th></tr></thead>
        <tbody>
          ${paidOrders.map(o => {
            const gr = (s.generatedReports || []).find(g => g.orderId === o.id);
            const isReady = o.reportStatus === 'ready' || gr != null;
            return `
            <tr>
              <td>${o.id}</td>
              <td>${U.escapeHtml(o.refName)}</td>
              <td>${U.escapeHtml(o.user)}</td>
              <td>${U.escapeHtml(o.target || '-')}</td>
              <td>${U.fmtDate(o.paidAt)}</td>
              <td>${isReady ? '<span class="tag green">已生成</span>' : '<span class="tag orange">待生成</span>'}</td>
              <td class="actions">
                ${isReady
                  ? `<button class="btn sm muted" data-preview="${o.id}"><i data-lucide="eye"></i>查看</button>`
                  : `<button class="btn sm success" data-gen="${o.id}"><i data-lucide="file-plus"></i>生成报告</button>`
                }
              </td>
            </tr>
          `;}).join('') || '<tr class="empty-row"><td colspan="7">暂无待生成报告</td></tr>'}
        </tbody>
      </table>
      <div class="card-block" style="margin-top:16px">
        <h3>已生成报告记录</h3>
        <table class="tbl">
          <thead><tr><th>报告ID</th><th>订单号</th><th>标题</th><th>对象</th><th>生成时间</th><th>操作</th></tr></thead>
          <tbody>
            ${(s.generatedReports || []).map(g => `
              <tr>
                <td>${g.id}</td>
                <td>${g.orderId}</td>
                <td>${U.escapeHtml(g.title)}</td>
                <td>${U.escapeHtml(g.target || '-')}</td>
                <td>${U.fmtDate(g.generatedAt)}</td>
                <td class="actions"><button class="btn sm muted" data-edit="${g.id}"><i data-lucide="pencil"></i>编辑</button></td>
              </tr>
            `).join('') || '<tr class="empty-row"><td colspan="6">暂无生成记录</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    // 生成报告
    $content.querySelectorAll('[data-gen]').forEach(b => b.onclick = () => {
      const oid = b.dataset.gen;
      const o = s.orders.find(x => x.id === oid);
      if (!o) return;
      openModal('生成报告', `
        <div class="field"><label>订单号</label><input class="input" value="${o.id}" disabled /></div>
        <div class="field"><label>报告名称</label><input class="input" id="grTitle" value="${U.escapeHtml(o.refName)}" /></div>
        <div class="field"><label>分析对象</label><input class="input" id="grTarget" value="${U.escapeHtml(o.target || '')}" /></div>
        <div class="field"><label>报告内容摘要</label><textarea class="textarea" id="grSummary" placeholder="输入报告摘要或分析结论……"></textarea></div>
      `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn success" id="saveGR">确认生成并上传</button>`);
      document.getElementById('saveGR').onclick = () => {
        const title = document.getElementById('grTitle').value.trim();
        const target = document.getElementById('grTarget').value.trim();
        const summary = document.getElementById('grSummary').value.trim();
        if (!title || !summary) { toast('报告名称和摘要必填', true); return; }
        const ss = Store.get();
        if (!ss.generatedReports) ss.generatedReports = [];
        const gr = { id: Store.uid('GR'), orderId: o.id, userId: o.userId, title, target, summary, generatedAt: Date.now(), generatedBy: 'admin' };
        ss.generatedReports.unshift(gr);
        // 更新订单状态
        const order = ss.orders.find(x => x.id === o.id);
        if (order) { order.reportStatus = 'ready'; order.reportFile = title + '.pdf'; }
        // 更新 purchasedReports
        const pr = ss.purchasedReports.find(p => p.orderId === o.id);
        if (pr) pr.reportStatus = 'ready';
        Store.log('生成报告', `${title} - ${o.user}`, 'admin');
        Store.set(ss); closeModal(); toast('报告已生成并推送至用户');
      };
    });

    // 预览报告
    $content.querySelectorAll('[data-preview]').forEach(b => b.onclick = () => {
      const gr = (s.generatedReports || []).find(g => g.orderId === b.dataset.preview);
      if (!gr) return;
      openModal('报告预览', `
        <div style="font-size:13px;line-height:1.8;color:#333">
          <h3 style="margin:0 0 8px">${U.escapeHtml(gr.title)}</h3>
          <div class="kv"><div class="k">分析对象</div><div class="v">${U.escapeHtml(gr.target || '-')}</div></div>
          <div class="kv"><div class="k">生成时间</div><div class="v">${U.fmtDate(gr.generatedAt)}</div></div>
          <div style="margin-top:12px;padding:12px;background:#f9fafb;border-radius:6px">${U.escapeHtml(gr.summary)}</div>
        </div>
      `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">关闭</button>`);
    });
  });

  // ---------- 页面：订单管理 ----------
  register('orders', () => {
    $crumb.innerHTML = '<b>订单管理</b>';
    const s = Store.get();
    $content.innerHTML = `
      <div class="page-head"><h1>报告订单管理</h1></div>
      <div class="toolbar">
        <select class="select" id="filterStatus"><option value="">全部状态</option><option value="completed">已完成</option><option value="generating">报告生成中</option><option value="cancelled">已取消</option></select>
        <input class="input" id="searchOrder" placeholder="搜索订单号/用户" />
        <div class="grow"></div>
        <button class="btn ghost" id="exportOrders"><i data-lucide="download"></i>导出 Excel</button>
      </div>
      <table class="tbl">
        <thead><tr><th>订单号</th><th>用户</th><th>报告</th><th>分析对象</th><th>权益方式</th><th>报告状态</th><th>下单时间</th><th>操作</th></tr></thead>
        <tbody id="orderList"></tbody>
      </table>
    `;
    const draw = () => {
      const status = document.getElementById('filterStatus').value;
      const q = document.getElementById('searchOrder').value.trim().toLowerCase();
      const list = s.orders.filter(o =>
        (!status
          || (status === 'completed' && o.status === 'completed' && o.reportStatus === 'ready')
          || (status === 'generating' && o.reportStatus === 'generating')
          || (status === 'cancelled' && o.status === 'cancelled'))
        && (!q || o.id.toLowerCase().includes(q) || o.user.toLowerCase().includes(q))
      );
      document.getElementById('orderList').innerHTML = list.length ? list.map(o => `
        <tr>
          <td>${o.id}</td>
          <td>${U.escapeHtml(o.user)}</td>
          <td>${U.escapeHtml(o.refName)}</td>
          <td>${U.escapeHtml(o.target || '-')}</td>
          <td><span class="tag" style="background:#fff3e0;color:#e65100">VIP 免费</span></td>
          <td>${o.reportStatus === 'ready' ? '<span class="tag green">已生成</span>' : o.reportStatus === 'generating' ? '<span class="tag orange">生成中</span>' : '<span class="tag gray">' + (o.status || '-') + '</span>'}</td>
          <td>${U.fmtDate(o.createdAt)}</td>
          <td class="actions"><button class="btn sm muted" data-view="${o.id}">详情</button></td>
        </tr>
      `).join('') : '<tr class="empty-row"><td colspan="8">暂无订单</td></tr>';
      document.getElementById('orderList').querySelectorAll('[data-view]').forEach(b => b.onclick = () => viewOrder(b.dataset.view));
    };
    draw();
    document.getElementById('filterStatus').onchange = draw;
    document.getElementById('searchOrder').oninput = U.debounce(draw, 200);
    document.getElementById('exportOrders').onclick = () => toast('导出功能（演示）');
  });

  function viewOrder(id) {
    const s = Store.get();
    const o = s.orders.find(x => x.id === id);
    if (!o) return;
    const ct = s.contracts.find(c => c.orderId === id);
    openModal('订单详情', `
      <div class="kv"><div class="k">订单号</div><div class="v">${o.id}</div></div>
      <div class="kv"><div class="k">用户</div><div class="v">${U.escapeHtml(o.user)} (${o.userId})</div></div>
      <div class="kv"><div class="k">报告</div><div class="v">${U.escapeHtml(o.refName)}</div></div>
      <div class="kv"><div class="k">分析对象</div><div class="v">${U.escapeHtml(o.target || '-')}</div></div>
      <div class="kv"><div class="k">权益方式</div><div class="v">VIP 会员免费</div></div>
      <div class="kv"><div class="k">报告状态</div><div class="v">${o.reportStatus === 'ready' ? '<span class="tag green">已生成</span>' : '<span class="tag orange">生成中</span>'}</div></div>
      <div class="kv"><div class="k">下单时间</div><div class="v">${U.fmtDate(o.createdAt)}</div></div>
      ${o.paidAt ? `<div class="kv"><div class="k">生效时间</div><div class="v">${U.fmtDate(o.paidAt)}</div></div>` : ''}
      ${o.tradeNo ? `<div class="kv"><div class="k">凭证号</div><div class="v">${o.tradeNo}</div></div>` : ''}
      ${ct ? `<div class="kv"><div class="k">合同号</div><div class="v">${ct.id} ${ct.sealed ? '<span class="tag green">已盖章</span>' : ''}</div></div>` : ''}
      ${o.note ? `<div class="kv"><div class="k">备注</div><div class="v">${U.escapeHtml(o.note)}</div></div>` : ''}
    `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">关闭</button>`);
  }

  // ---------- 页面：增值服务管理 ----------
  register('vasServices', () => {
    $crumb.innerHTML = '<b>增值服务管理</b>';
    const s = Store.get();
    $content.innerHTML = `
      <div class="page-head"><h1>增值服务管理</h1><button class="btn" id="addVas"><i data-lucide="plus"></i>新增服务</button></div>
      <div class="card-block" style="margin-bottom:12px;background:#fbf6ec;border:1px solid #d7ccc8">
        <div style="display:flex;gap:8px;align-items:center;color:#5d4037;font-size:13px"><i data-lucide="crown"></i> 第三方增值服务已全面接入 SVIP 会员权益，用户升级 SVIP 后可无限免费订购。</div>
      </div>
      <table class="tbl">
        <thead><tr><th>服务名称</th><th>服务商</th><th>权益方式</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          ${s.vasServices.map(v => `
            <tr>
              <td><b>${U.escapeHtml(v.name)}</b><br><span style="font-size:12px;color:#888">${U.escapeHtml(v.desc)}</span></td>
              <td>${U.escapeHtml(v.vendor)}</td>
              <td><span class="tag" style="background:#fbf6ec;color:#5d4037">SVIP 免费</span></td>
              <td>${v.status === 'on' ? '<span class="tag green">上架</span>' : '<span class="tag gray">下架</span>'}</td>
              <td class="actions">
                <button class="btn sm muted" data-edit="${v.id}"><i data-lucide="pencil"></i>编辑</button>
                <button class="btn sm ${v.status === 'on' ? 'muted' : 'success'}" data-toggle="${v.id}"><i data-lucide="${v.status === 'on' ? 'eye-off' : 'eye'}"></i>${v.status === 'on' ? '下架' : '上架'}</button>
                <button class="btn sm danger" data-del="${v.id}"><i data-lucide="trash-2"></i>删除</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    document.getElementById('addVas').onclick = () => editVasService();
    $content.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editVasService(b.dataset.edit));
    $content.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
      const ss = Store.get();
      const v = ss.vasServices.find(x => x.id === b.dataset.toggle);
      if (v) { v.status = v.status === 'on' ? 'off' : 'on'; Store.log('切换服务状态', v.name, 'admin'); Store.set(ss); toast('已更新'); }
    });
    $content.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const id = b.dataset.del;
      const ss = Store.get();
      const v = ss.vasServices.find(x => x.id === id);
      if (!v) return;
      openModal('确认删除', `<p>确定要删除服务「${U.escapeHtml(v.name)}」吗？</p>`,
        `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn danger" id="confirmDel">确认删除</button>`);
      document.getElementById('confirmDel').onclick = () => {
        ss.vasServices = ss.vasServices.filter(x => x.id !== id);
        Store.log('删除服务', v.name, 'admin');
        Store.set(ss); closeModal(); toast('已删除');
      };
    });
  });

  // ---------- 页面：服务订单 ----------
  register('vasOrders', () => {
    $crumb.innerHTML = '<b>服务订单管理</b>';
    const s = Store.get();
    $content.innerHTML = `
      <div class="page-head"><h1>服务订单</h1></div>
      <table class="tbl">
        <thead><tr><th>订单号</th><th>服务名称</th><th>用户</th><th>权益方式</th><th>进度</th><th>创建时间</th><th>备注</th><th>操作</th></tr></thead>
        <tbody>
          ${s.vasOrders.map(o => `
            <tr>
              <td>${o.id}</td>
              <td>${U.escapeHtml(o.serviceName)}</td>
              <td>${U.escapeHtml(o.user)}</td>
              <td><span class="tag" style="background:#fbf6ec;color:#5d4037">SVIP 免费</span></td>
              <td>${({ pending: '<span class="tag orange">待处理</span>', in_progress: '<span class="tag blue">进行中</span>', completed: '<span class="tag green">已完成</span>', closed: '<span class="tag gray">已关闭</span>' })[o.progress]}</td>
              <td>${U.fmtDate(o.createdAt)}</td>
              <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.escapeHtml(o.note || '-')}</td>
              <td class="actions"><button class="btn sm" data-prog="${o.id}">更新进度</button></td>
            </tr>
          `).join('') || '<tr class="empty-row"><td colspan="8">暂无服务订单</td></tr>'}
        </tbody>
      </table>
    `;
    $content.querySelectorAll('[data-prog]').forEach(b => b.onclick = () => {
      const o = s.vasOrders.find(x => x.id === b.dataset.prog);
      openModal('更新服务进度', `
        <div class="field"><label>当前进度</label><select class="select" id="vp">
          <option value="pending" ${o.progress === 'pending' ? 'selected' : ''}>待处理</option>
          <option value="in_progress" ${o.progress === 'in_progress' ? 'selected' : ''}>进行中</option>
          <option value="completed" ${o.progress === 'completed' ? 'selected' : ''}>已完成</option>
          <option value="closed" ${o.progress === 'closed' ? 'selected' : ''}>已关闭</option>
        </select></div>
      `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn" id="saveVP">保存</button>`);
      document.getElementById('saveVP').onclick = () => {
        const ss = Store.get();
        const t = ss.vasOrders.find(x => x.id === b.dataset.prog);
        if (t) { t.progress = document.getElementById('vp').value; Store.log('更新服务进度', `${t.id} → ${t.progress}`, 'admin'); Store.set(ss); closeModal(); toast('已更新'); }
      };
    });
  });

  // ---------- 页面：发票管理 ----------
  register('invoices', () => {
    $crumb.innerHTML = '<b>发票管理</b>';
    const s = Store.get();
    let tab = 'requests';
    const draw = () => {
      if (tab === 'requests') {
        document.getElementById('invContent').innerHTML = `
          <table class="tbl">
            <thead><tr><th>申请ID</th><th>订单号</th><th>用户</th><th>抬头</th><th>金额</th><th>状态</th><th>申请时间</th><th>操作</th></tr></thead>
            <tbody>
              ${s.invoiceRequests.map(r => `
                <tr>
                  <td>${r.id}</td>
                  <td>${r.orderId}</td>
                  <td>${U.escapeHtml(r.user)}</td>
                  <td>${U.escapeHtml(r.title)}</td>
                  <td>${U.fmtMoney(r.amount)}</td>
                  <td>${({ pending: '<span class="tag orange">待审核</span>', approved: '<span class="tag green">已开票</span>', rejected: '<span class="tag red">已驳回</span>' })[r.status]}</td>
                  <td>${U.fmtDate(r.createdAt)}</td>
                  <td class="actions">${r.status === 'pending' ? `<button class="btn sm success" data-approve="${r.id}">开票</button><button class="btn sm danger" data-reject="${r.id}">驳回</button>` : '-'}</td>
                </tr>
              `).join('') || '<tr class="empty-row"><td colspan="8">暂无申请</td></tr>'}
            </tbody>
          </table>
        `;
        document.getElementById('invContent').querySelectorAll('[data-approve]').forEach(b => b.onclick = () => approveInvoice(b.dataset.approve));
        document.getElementById('invContent').querySelectorAll('[data-reject]').forEach(b => b.onclick = () => {
          const rid = b.dataset.reject;
          openModal('驳回开票申请', `<div class="field"><label>驳回原因</label><textarea class="textarea" id="rejectInvNote" placeholder="请填写驳回原因"></textarea></div>`,
            `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn danger" id="confirmRejectInv">确认驳回</button>`);
          document.getElementById('confirmRejectInv').onclick = () => {
            const note = document.getElementById('rejectInvNote').value.trim() || '信息不符，请联系客服';
            const ss = Store.get();
            const r = ss.invoiceRequests.find(x => x.id === rid);
            if (r) { r.status = 'rejected'; r.note = note; Store.log('驳回开票', `${r.id} - ${note}`, 'admin'); Store.set(ss); closeModal(); toast('已驳回'); }
          };
        });
      } else {
        document.getElementById('invContent').innerHTML = `
          <table class="tbl">
            <thead><tr><th>发票号</th><th>订单号</th><th>用户</th><th>抬头</th><th>金额</th><th>开票时间</th><th>操作</th></tr></thead>
            <tbody>
              ${s.invoices.map(i => `
                <tr>
                  <td>${i.no}</td>
                  <td>${i.orderId}</td>
                  <td>${U.escapeHtml(i.user)}</td>
                  <td>${U.escapeHtml(i.title)}</td>
                  <td>${U.fmtMoney(i.amount)}</td>
                  <td>${U.fmtDate(i.issuedAt)}</td>
                  <td class="actions"><button class="btn sm muted">重发</button></td>
                </tr>
              `).join('') || '<tr class="empty-row"><td colspan="7">暂无开票记录</td></tr>'}
            </tbody>
          </table>
        `;
      }
    };
    $content.innerHTML = `
      <div class="page-head"><h1>发票管理</h1></div>
      <div class="tabs">
        <div class="t active" data-t="requests">开票申请</div>
        <div class="t" data-t="issued">已开票记录</div>
      </div>
      <div id="invContent"></div>
    `;
    $content.querySelector('.tabs').addEventListener('click', (e) => {
      const t = e.target.closest('.t'); if (!t) return;
      tab = t.dataset.t;
      [...e.currentTarget.children].forEach(x => x.classList.toggle('active', x.dataset.t === tab));
      draw();
    });
    draw();
  });

  function approveInvoice(id) {
    const s = Store.get();
    const req = s.invoiceRequests.find(x => x.id === id);
    if (!req || req.status !== 'pending') return;
    req.status = 'approved';
    const invoiceNo = 'INV' + Date.now();
    const now = Date.now();
    s.invoices.push({
      id: Store.uid('IV'), no: invoiceNo, orderId: req.orderId,
      userId: req.userId, user: req.user, title: req.title, taxNo: req.taxNo,
      amount: req.amount, issuedAt: now, source: req.source || 'order',
    });
    if (req.source === 'vip') {
      const vo = (s.vipOrders || []).find(x => x.id === req.orderId);
      if (vo) vo.invoiceId = invoiceNo;
    } else {
      const o = s.orders.find(x => x.id === req.orderId);
      if (o) o.invoiceId = invoiceNo;
    }
    Store.log('开具发票', `${invoiceNo} - ${req.user}`, 'admin');
    Store.set(s);
    toast('发票已开具');
  }

  // ---------- 页面：用户管理 ----------
  register('users', () => {
    $crumb.innerHTML = '<b>用户管理</b>';
    const s = Store.get();
    const now = Date.now();
    const vipBadge = (u) => {
      const lv = u.vipLevel || 'none';
      const exp = u.vipExpireAt || 0;
      if (lv === 'none' || exp <= now) return '<span class="tag gray">普通</span>';
      const txt = lv === 'svip' ? 'SVIP' : 'VIP';
      const cls = lv === 'svip' ? 'orange' : 'green';
      return `<span class="tag ${cls}">${txt}</span><br><span style="font-size:11px;color:#999">至 ${U.fmtDate(exp, false)}</span>`;
    };
    $content.innerHTML = `
      <div class="page-head"><h1>用户管理</h1></div>
      <table class="tbl">
        <thead><tr><th>用户ID</th><th>企业名称</th><th>手机号</th><th>认证状态</th><th>会员等级</th><th>订单数</th><th>注册时间</th><th>操作</th></tr></thead>
        <tbody>
          ${s.users.map(u => `
            <tr>
              <td>${u.id}</td>
              <td>${U.escapeHtml(u.company)}</td>
              <td>${U.escapeHtml(u.phone)}</td>
              <td>${({ verified: '<span class="tag green">已认证</span>', pending: '<span class="tag orange">审核中</span>', rejected: '<span class="tag red">已驳回</span>', unverified: '<span class="tag gray">未认证</span>' })[u.authStatus]}</td>
              <td>${vipBadge(u)}</td>
              <td>${u.orderCount || 0}</td>
              <td>${U.fmtDate(u.registerAt)}</td>
              <td class="actions">
                <button class="btn sm muted" data-view="${u.id}"><i data-lucide="eye"></i>查看</button>
                <button class="btn sm muted" data-edit="${u.id}"><i data-lucide="pencil"></i>编辑</button>
                <button class="btn sm" data-vip="${u.id}"><i data-lucide="crown"></i>会员调整</button>
                <button class="btn sm danger" data-del="${u.id}"><i data-lucide="trash-2"></i>删除</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    $content.querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
      const u = s.users.find(x => x.id === b.dataset.view);
      const lv = u.vipLevel || 'none';
      const expired = !u.vipExpireAt || u.vipExpireAt <= now;
      openModal('用户详情', `
        <div class="kv"><div class="k">用户ID</div><div class="v">${u.id}</div></div>
        <div class="kv"><div class="k">企业名称</div><div class="v">${U.escapeHtml(u.company)}</div></div>
        <div class="kv"><div class="k">手机号</div><div class="v">${U.escapeHtml(u.phone)}</div></div>
        <div class="kv"><div class="k">认证状态</div><div class="v">${u.authStatus}</div></div>
        <div class="kv"><div class="k">会员等级</div><div class="v">${(lv === 'none' || expired) ? '普通用户' : (lv === 'svip' ? 'SVIP' : 'VIP')}</div></div>
        <div class="kv"><div class="k">会员到期</div><div class="v">${u.vipExpireAt ? U.fmtDate(u.vipExpireAt, false) : '-'}</div></div>
        <div class="kv"><div class="k">订单数</div><div class="v">${u.orderCount || 0}</div></div>
        <div class="kv"><div class="k">注册时间</div><div class="v">${U.fmtDate(u.registerAt)}</div></div>
      `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">关闭</button>`);
    });
    $content.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editUser(b.dataset.edit));
    $content.querySelectorAll('[data-vip]').forEach(b => b.onclick = () => adjustUserVip(b.dataset.vip));
    $content.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const id = b.dataset.del;
      const ss = Store.get();
      const u = ss.users.find(x => x.id === id);
      if (!u) return;
      openModal('确认删除', `<p>确定要删除用户「${U.escapeHtml(u.company)}」吗？此操作不可恢复。</p>`,
        `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn danger" id="confirmDel">确认删除</button>`);
      document.getElementById('confirmDel').onclick = () => {
        ss.users = ss.users.filter(x => x.id !== id);
        Store.log('删除用户', u.company, 'admin');
        Store.set(ss); closeModal(); toast('已删除');
      };
    });
  });

  // 手动调整用户会员（无需走充值流程，运营特批）
  function adjustUserVip(id) {
    const s = Store.get();
    const u = s.users.find(x => x.id === id);
    if (!u) return;
    const expireDate = u.vipExpireAt ? new Date(u.vipExpireAt).toISOString().slice(0, 10) : '';
    openModal('会员调整 - ' + (u.company || ''), `
      <div class="field"><label>当前等级</label><div style="padding:6px 0;color:#666">${u.vipLevel === 'svip' ? 'SVIP' : u.vipLevel === 'vip' ? 'VIP' : '普通用户'} ${u.vipExpireAt ? '（至 ' + U.fmtDate(u.vipExpireAt, false) + '）' : ''}</div></div>
      <div class="field"><label>调整为</label><select class="select" id="adjLv">
        <option value="none" ${(!u.vipLevel || u.vipLevel === 'none') ? 'selected' : ''}>普通用户</option>
        <option value="vip" ${u.vipLevel === 'vip' ? 'selected' : ''}>VIP</option>
        <option value="svip" ${u.vipLevel === 'svip' ? 'selected' : ''}>SVIP</option>
      </select></div>
      <div class="field"><label>有效期至</label><input class="input" type="date" id="adjExp" value="${expireDate}"/></div>
      <div class="field"><label>备注（可选）</label><input class="input" id="adjNote" placeholder="赠送/补发/特批等"/></div>
    `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn" id="saveAdj">保存</button>`);
    document.getElementById('saveAdj').onclick = () => {
      const lv = document.getElementById('adjLv').value;
      const ed = document.getElementById('adjExp').value;
      const note = document.getElementById('adjNote').value.trim();
      const ss = Store.get();
      const t = ss.users.find(x => x.id === id);
      if (t) {
        t.vipLevel = lv;
        t.vipExpireAt = lv === 'none' ? 0 : (ed ? new Date(ed + 'T23:59:59').getTime() : 0);
        if (t.id === ss.currentUser.id) {
          ss.currentUser.vipLevel = t.vipLevel;
          ss.currentUser.vipExpireAt = t.vipExpireAt;
        }
        Store.log('会员调整', `${t.company} → ${lv}${note ? '（' + note + '）' : ''}`, 'admin');
      }
      Store.set(ss); closeModal(); toast('已保存');
    };
  }

  // ---------- 页面：认证审核 ----------
  register('authReview', () => {
    $crumb.innerHTML = '<b>认证审核</b>';
    const s = Store.get();
    const pending = s.users.filter(u => u.authStatus === 'pending');
    $content.innerHTML = `
      <div class="page-head"><h1>认证审核</h1></div>
      <table class="tbl">
        <thead><tr><th>用户ID</th><th>企业名称</th><th>手机号</th><th>申请时间</th><th>操作</th></tr></thead>
        <tbody>
          ${pending.map(u => `
            <tr>
              <td>${u.id}</td>
              <td>${U.escapeHtml(u.company)}</td>
              <td>${U.escapeHtml(u.phone)}</td>
              <td>${U.fmtDate(u.registerAt)}</td>
              <td class="actions">
                <button class="btn sm success" data-approve="${u.id}">通过</button>
                <button class="btn sm danger" data-reject="${u.id}">驳回</button>
              </td>
            </tr>
          `).join('') || '<tr class="empty-row"><td colspan="5">暂无待审核</td></tr>'}
        </tbody>
      </table>
    `;
    $content.querySelectorAll('[data-approve]').forEach(b => b.onclick = () => {
      const ss = Store.get();
      const u = ss.users.find(x => x.id === b.dataset.approve);
      if (u) { u.authStatus = 'verified'; if (u.id === ss.currentUser.id) ss.currentUser.authStatus = 'verified'; Store.log('通过认证', u.company, 'admin'); Store.set(ss); toast('已通过'); }
    });
    $content.querySelectorAll('[data-reject]').forEach(b => b.onclick = () => {
      openModal('驳回认证', `<div class="field"><label>驳回原因</label><textarea class="textarea" id="rejectNote" placeholder="请填写驳回原因"></textarea></div>`,
        `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn danger" id="confirmReject">确认驳回</button>`);
      document.getElementById('confirmReject').onclick = () => {
        const note = document.getElementById('rejectNote').value.trim() || '资料不全';
        const ss = Store.get();
        const u = ss.users.find(x => x.id === b.dataset.reject);
        if (u) { u.authStatus = 'rejected'; u.authNote = note; if (u.id === ss.currentUser.id) { ss.currentUser.authStatus = 'rejected'; ss.currentUser.authNote = note; } Store.log('驳回认证', `${u.company} - ${note}`, 'admin'); Store.set(ss); closeModal(); toast('已驳回'); }
      };
    });
  });

  // ---------- 页面：合同管理 ----------
  register('contracts', () => {
    $crumb.innerHTML = '<b>合同管理</b>';
    const s = Store.get();
    let tab = 'templates';
    const draw = () => {
      if (tab === 'templates') {
        document.getElementById('ctContent').innerHTML = `
          <table class="tbl">
            <thead><tr><th>模板名称</th><th>适用类型</th><th>版本</th><th>更新时间</th><th>操作</th></tr></thead>
            <tbody>
              ${s.contractTemplates.map(t => `
                <tr>
                  <td>${U.escapeHtml(t.name)}</td>
                  <td>${t.forType === 'report' ? '报告订单' : '增值服务'}</td>
                  <td>v${t.version}</td>
                  <td>${U.fmtDate(t.updatedAt)}</td>
                  <td class="actions"><button class="btn sm muted" data-view="${t.id}">查看</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        document.getElementById('ctContent').querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
          const t = s.contractTemplates.find(x => x.id === b.dataset.view);
          openModal('合同模板', `<div class="code">${U.escapeHtml(t.content)}</div>`, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">关闭</button>`);
        });
      } else {
        document.getElementById('ctContent').innerHTML = `
          <table class="tbl">
            <thead><tr><th>合同号</th><th>订单号</th><th>用户</th><th>签署时间</th><th>盖章</th><th>操作</th></tr></thead>
            <tbody>
              ${s.contracts.map(c => `
                <tr>
                  <td>${c.id}</td>
                  <td>${c.orderId}</td>
                  <td>${U.escapeHtml(c.user)}</td>
                  <td>${U.fmtDate(c.signedAt)}</td>
                  <td>${c.sealed ? '<span class="tag green">已盖章</span>' : '<span class="tag orange">未盖章</span>'}</td>
                  <td class="actions"><button class="btn sm muted">查看</button></td>
                </tr>
              `).join('') || '<tr class="empty-row"><td colspan="6">暂无签署记录</td></tr>'}
            </tbody>
          </table>
        `;
      }
    };
    $content.innerHTML = `
      <div class="page-head"><h1>合同管理</h1></div>
      <div class="tabs">
        <div class="t active" data-t="templates">合同模板</div>
        <div class="t" data-t="signed">签署记录</div>
      </div>
      <div id="ctContent"></div>
    `;
    $content.querySelector('.tabs').addEventListener('click', (e) => {
      const t = e.target.closest('.t'); if (!t) return;
      tab = t.dataset.t;
      [...e.currentTarget.children].forEach(x => x.classList.toggle('active', x.dataset.t === tab));
      draw();
    });
    draw();
  });

  // ---------- 页面：支付流水 ----------
  register('payFlows', () => {
    $crumb.innerHTML = '<b>支付流水</b>';
    const s = Store.get();
    $content.innerHTML = `
      <div class="page-head"><h1>支付流水</h1><button class="btn" id="addManual"><i data-lucide="plus"></i>手动补录</button></div>
      <table class="tbl">
        <thead><tr><th>流水ID</th><th>交易号</th><th>订单号</th><th>金额</th><th>支付方式</th><th>支付时间</th><th>来源</th></tr></thead>
        <tbody>
          ${s.payFlows.map(f => `
            <tr>
              <td>${f.id}</td>
              <td>${f.tradeNo}</td>
              <td>${f.orderId}</td>
              <td>${U.fmtMoney(f.amount)}</td>
              <td>${U.escapeHtml(f.method)}</td>
              <td>${U.fmtDate(f.paidAt)}</td>
              <td>${f.source === 'callback' ? '<span class="tag green">回调</span>' : '<span class="tag orange">手动</span>'}</td>
            </tr>
          `).join('') || '<tr class="empty-row"><td colspan="7">暂无流水</td></tr>'}
        </tbody>
      </table>
    `;
    document.getElementById('addManual').onclick = () => {
      openModal('手动补录支付流水', `
        <div class="field"><label>订单号</label><input class="input" id="mfOrder" placeholder="关联的订单号"/></div>
        <div class="field"><label>交易号</label><input class="input" id="mfTrade" placeholder="银行流水号/转账凭证号"/></div>
        <div class="row">
          <div class="field"><label>金额</label><input class="input" type="number" id="mfAmount" placeholder="0.00"/></div>
          <div class="field"><label>支付方式</label><select class="select" id="mfMethod"><option>银行转账</option><option>线下汇款</option><option>支票</option></select></div>
        </div>
      `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn" id="saveMF">确认补录</button>`);
      document.getElementById('saveMF').onclick = () => {
        const orderId = document.getElementById('mfOrder').value.trim();
        const tradeNo = document.getElementById('mfTrade').value.trim();
        const amount = +document.getElementById('mfAmount').value;
        if (!orderId || !tradeNo || !amount) { toast('请填写完整信息', true); return; }
        const ss = Store.get();
        ss.payFlows.unshift({
          id: Store.uid('F'), tradeNo, orderId, amount,
          method: document.getElementById('mfMethod').value, paidAt: Date.now(), source: 'manual'
        });
        const o = ss.orders.find(x => x.id === orderId);
        if (o && o.payStatus === 'unpaid') { o.payStatus = 'paid'; o.paidAt = Date.now(); o.status = 'completed'; o.tradeNo = tradeNo; }
        Store.log('手动补录流水', `${orderId} ¥${amount}`, 'admin');
        Store.set(ss); closeModal(); toast('补录成功');
      };
    };
  });

  // ---------- 页面：公告管理 ----------
  register('announcements', () => {
    $crumb.innerHTML = '<b>公告管理</b>';
    const s = Store.get();
    $content.innerHTML = `
      <div class="page-head"><h1>公告管理</h1><button class="btn" id="addAnn"><i data-lucide="megaphone"></i>发布公告</button></div>
      <table class="tbl">
        <thead><tr><th>标题</th><th>内容</th><th>发布时间</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          ${s.announcements.map(a => `
            <tr>
              <td><b>${U.escapeHtml(a.title)}</b></td>
              <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis">${U.escapeHtml(a.content)}</td>
              <td>${U.fmtDate(a.publishAt)}</td>
              <td>${a.status === 'on' ? '<span class="tag green">展示中</span>' : '<span class="tag gray">已下线</span>'}</td>
              <td class="actions">
                <button class="btn sm muted" data-edit="${a.id}"><i data-lucide="pencil"></i>编辑</button>
                <button class="btn sm ${a.status === 'on' ? 'danger' : 'success'}" data-toggle="${a.id}"><i data-lucide="${a.status === 'on' ? 'eye-off' : 'eye'}"></i>${a.status === 'on' ? '下线' : '发布'}</button>
                <button class="btn sm danger" data-del="${a.id}"><i data-lucide="trash-2"></i>删除</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    document.getElementById('addAnn').onclick = () => editAnnouncement();
    $content.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editAnnouncement(b.dataset.edit));
    $content.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
      const ss = Store.get();
      const a = ss.announcements.find(x => x.id === b.dataset.toggle);
      if (a) { a.status = a.status === 'on' ? 'off' : 'on'; Store.log('切换公告状态', a.title, 'admin'); Store.set(ss); toast('已更新'); }
    });
    $content.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const id = b.dataset.del;
      const ss = Store.get();
      const a = ss.announcements.find(x => x.id === id);
      if (!a) return;
      openModal('确认删除', `<p>确定要删除公告「${U.escapeHtml(a.title)}」吗？</p>`,
        `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn danger" id="confirmDel">确认删除</button>`);
      document.getElementById('confirmDel').onclick = () => {
        ss.announcements = ss.announcements.filter(x => x.id !== id);
        Store.log('删除公告', a.title, 'admin');
        Store.set(ss); closeModal(); toast('已删除');
      };
    });
  });

  function editAnnouncement(id) {
    const s = Store.get();
    const a = id ? s.announcements.find(x => x.id === id) : { id: '', title: '', content: '', publishAt: Date.now(), status: 'on' };
    openModal(id ? '编辑公告' : '发布公告', `
      <div class="field"><label>标题</label><input class="input" id="at" value="${U.escapeHtml(a.title)}"/></div>
      <div class="field"><label>内容</label><textarea class="textarea" id="ac">${U.escapeHtml(a.content)}</textarea></div>
    `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn" id="saveAnn">保存</button>`);
    document.getElementById('saveAnn').onclick = () => {
      const title = document.getElementById('at').value.trim();
      const content = document.getElementById('ac').value.trim();
      if (!title || !content) { toast('标题和内容必填', true); return; }
      const ss = Store.get();
      if (id) {
        const t = ss.announcements.find(x => x.id === id);
        Object.assign(t, { title, content });
        Store.log('编辑公告', title, 'admin');
      } else {
        ss.announcements.unshift({ id: Store.uid('A'), title, content, publishAt: Date.now(), status: 'on' });
        Store.log('发布公告', title, 'admin');
      }
      Store.set(ss); closeModal(); toast('已保存');
    };
  }

  // ---------- 页面：AIC 充值套餐 ----------
  register('vipPlans', () => {
    $crumb.innerHTML = '<b>AIC 充值套餐</b>';
    const s = Store.get();
    const plans = s.vipPlans || [];
    $content.innerHTML = `
      <div class="page-head"><h1>AIC 充值套餐</h1><button class="btn" id="addPlan"><i data-lucide="plus"></i>新增面额</button></div>
      <div class="card-block" style="margin-bottom:12px">
        <div style="font-size:13px;color:#555;line-height:1.7">
          · 充值面额（1 元 = 10 AIC），用户在小程序"个人中心 → VIP 余额中心 → 充值"选购；<br>
          · AIC 一次性消耗，按底层 token 实际用量结算；<br>
          · 剩余 AIC 可发起退款，由运营审核后原路退回。
        </div>
      </div>
      <table class="tbl">
        <thead><tr><th>面额名称</th><th>价格</th><th>到账 AIC</th><th>说明</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          ${plans.map(p => `
            <tr>
              <td><b>${U.escapeHtml(p.name)}</b></td>
              <td>${U.fmtMoney(p.amount)}</td>
              <td><span class="tag green">+${p.aic} AIC</span></td>
              <td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#888">${U.escapeHtml(p.desc || '')}</td>
              <td>${p.status === 'on' ? '<span class="tag green">上架</span>' : '<span class="tag gray">下架</span>'}</td>
              <td class="actions">
                <button class="btn sm muted" data-edit="${p.id}"><i data-lucide="pencil"></i>编辑</button>
                <button class="btn sm ${p.status === 'on' ? 'muted' : 'success'}" data-toggle="${p.id}"><i data-lucide="${p.status === 'on' ? 'eye-off' : 'eye'}"></i>${p.status === 'on' ? '下架' : '上架'}</button>
                <button class="btn sm danger" data-del="${p.id}"><i data-lucide="trash-2"></i>删除</button>
              </td>
            </tr>
          `).join('') || '<tr class="empty-row"><td colspan="6">暂无面额</td></tr>'}
        </tbody>
      </table>
    `;
    document.getElementById('addPlan').onclick = () => editVipPlan();
    $content.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editVipPlan(b.dataset.edit));
    $content.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
      const ss = Store.get();
      const p = (ss.vipPlans || []).find(x => x.id === b.dataset.toggle);
      if (p) { p.status = p.status === 'on' ? 'off' : 'on'; Store.log('切换面额状态', `${p.name} ${p.status}`, 'admin'); Store.set(ss); toast('已更新'); }
    });
    $content.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const id = b.dataset.del;
      const ss = Store.get();
      const p = (ss.vipPlans || []).find(x => x.id === id);
      if (!p) return;
      openModal('确认删除', `<p>确定要删除面额「${U.escapeHtml(p.name)}」吗？</p>`,
        `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn danger" id="confirmDelP">确认删除</button>`);
      document.getElementById('confirmDelP').onclick = () => {
        ss.vipPlans = (ss.vipPlans || []).filter(x => x.id !== id);
        Store.log('删除面额', p.name, 'admin');
        Store.set(ss); closeModal(); toast('已删除');
      };
    });
  });

  function editVipPlan(id) {
    const s = Store.get();
    const p = id ? (s.vipPlans || []).find(x => x.id === id) : { id: '', name: '', amount: 100, aic: 100, status: 'on', desc: '' };
    openModal(id ? '编辑面额' : '新增面额', `
      <div class="field"><label>面额名称</label><input class="input" id="pn" value="${U.escapeHtml(p.name)}" placeholder="如：100元AIC"/></div>
      <div class="row">
        <div class="field"><label>支付金额（元）</label><input class="input" type="number" id="pp" value="${p.amount}"/></div>
        <div class="field"><label>到账 AIC</label><input class="input" type="number" id="paic" value="${p.aic}"/></div>
      </div>
      <div class="field"><label>说明</label><textarea class="textarea" id="pds">${U.escapeHtml(p.desc || '')}</textarea></div>
    `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn" id="savePlan">保存</button>`);
    document.getElementById('savePlan').onclick = () => {
      const name = document.getElementById('pn').value.trim();
      const amount = +document.getElementById('pp').value;
      const aic = +document.getElementById('paic').value;
      if (!name || !amount || !aic) { toast('请填写完整信息', true); return; }
      const ss = Store.get();
      if (!ss.vipPlans) ss.vipPlans = [];
      if (id) {
        const t = ss.vipPlans.find(x => x.id === id);
        Object.assign(t, { name, amount, aic, desc: document.getElementById('pds').value.trim() });
        Store.log('编辑面额', name, 'admin');
      } else {
        ss.vipPlans.push({ id: Store.uid('VP'), name, amount, aic, status: 'on', desc: document.getElementById('pds').value.trim() });
        Store.log('新增面额', name, 'admin');
      }
      Store.set(ss); closeModal(); toast('已保存');
    };
  }

  // ---------- 页面：AIC 充值订单 ----------
  register('vipOrders', () => {
    $crumb.innerHTML = '<b>AIC 充值订单</b>';
    const s = Store.get();
    const list = (s.vipOrders || []);
    const aicList = list.filter(o => o.kind !== 'svip');
    const svipList = list.filter(o => o.kind === 'svip');
    const total = aicList.filter(o => o.payStatus === 'paid').reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalAic = aicList.filter(o => o.payStatus === 'paid').reduce((sum, o) => sum + (o.aic || o.amount || 0), 0);
    $content.innerHTML = `
      <div class="page-head"><h1>充值订单</h1></div>
      <div class="stat-row">
        <div class="stat-card"><div class="l">AIC 充值订单</div><div class="v">${aicList.length}</div></div>
        <div class="stat-card"><div class="l">AIC 充值金额</div><div class="v green">${U.fmtMoney(total)}</div></div>
        <div class="stat-card"><div class="l">已发放 AIC</div><div class="v blue">${totalAic.toFixed(1)}</div></div>
        <div class="stat-card"><div class="l">SVIP 订阅订单</div><div class="v orange">${svipList.length}</div></div>
      </div>
      <div class="toolbar">
        <select class="select" id="filterKind">
          <option value="">全部类型</option>
          <option value="aic">AIC 充值</option>
          <option value="svip">SVIP 订阅</option>
        </select>
        <input class="input" id="searchV" placeholder="搜索订单号/用户" />
        <div class="grow"></div>
        <button class="btn ghost" id="exportV"><i data-lucide="download"></i>导出 Excel</button>
      </div>
      <table class="tbl">
        <thead><tr><th>订单号</th><th>用户</th><th>项目</th><th>类型</th><th>金额</th><th>到账</th><th>下单时间</th><th>状态</th><th>操作</th></tr></thead>
        <tbody id="vList"></tbody>
      </table>
    `;
    const draw = () => {
      const kind = document.getElementById('filterKind').value;
      const q = document.getElementById('searchV').value.trim().toLowerCase();
      const filtered = list.filter(o => {
        const isSvip = o.kind === 'svip';
        if (kind === 'aic' && isSvip) return false;
        if (kind === 'svip' && !isSvip) return false;
        return !q || (o.id || '').toLowerCase().includes(q) || (o.user || '').toLowerCase().includes(q);
      });
      document.getElementById('vList').innerHTML = filtered.length ? filtered.map(o => {
        const isSvip = o.kind === 'svip';
        return `
        <tr>
          <td>${o.id}</td>
          <td>${U.escapeHtml(o.user)}</td>
          <td>${U.escapeHtml(o.planName || '-')}</td>
          <td>${isSvip ? '<span class="tag orange">SVIP 订阅</span>' : '<span class="tag green">AIC 充值</span>'}</td>
          <td>${U.fmtMoney(o.amount)}</td>
          <td>${isSvip ? (o.duration + ' 天') : ('+' + (o.aic || o.amount).toFixed(1) + ' AIC')}</td>
          <td>${U.fmtDate(o.createdAt)}</td>
          <td>${o.payStatus === 'paid' ? '<span class="tag green">已支付</span>' : '<span class="tag orange">待支付</span>'}</td>
          <td class="actions"><button class="btn sm muted" data-view="${o.id}">详情</button>${o.invoiceId ? '' : `<button class="btn sm" data-iv="${o.id}">补开发票</button>`}</td>
        </tr>
      `;}).join('') : '<tr class="empty-row"><td colspan="9">暂无订单</td></tr>';
      document.getElementById('vList').querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
        const o = list.find(x => x.id === b.dataset.view);
        if (!o) return;
        const isSvip = o.kind === 'svip';
        openModal('订单详情', `
          <div class="kv"><div class="k">订单号</div><div class="v">${o.id}</div></div>
          <div class="kv"><div class="k">用户</div><div class="v">${U.escapeHtml(o.user)} (${o.userId})</div></div>
          <div class="kv"><div class="k">项目</div><div class="v">${U.escapeHtml(o.planName || '-')}</div></div>
          <div class="kv"><div class="k">类型</div><div class="v">${isSvip ? 'SVIP 订阅' : 'AIC 充值'}</div></div>
          <div class="kv"><div class="k">金额</div><div class="v">${U.fmtMoney(o.amount)}</div></div>
          ${isSvip ? `<div class="kv"><div class="k">时长</div><div class="v">${o.duration} 天</div></div>` : `<div class="kv"><div class="k">到账 AIC</div><div class="v">${(o.aic || o.amount).toFixed(1)}</div></div>`}
          <div class="kv"><div class="k">交易号</div><div class="v">${o.tradeNo || '-'}</div></div>
          <div class="kv"><div class="k">支付方式</div><div class="v">${U.escapeHtml(o.payMethod || '-')}</div></div>
          <div class="kv"><div class="k">下单时间</div><div class="v">${U.fmtDate(o.createdAt)}</div></div>
          <div class="kv"><div class="k">支付时间</div><div class="v">${o.paidAt ? U.fmtDate(o.paidAt) : '-'}</div></div>
          ${isSvip && o.effectiveTo ? `<div class="kv"><div class="k">权益期至</div><div class="v">${U.fmtDate(o.effectiveTo, false)}</div></div>` : ''}
          <div class="kv"><div class="k">发票</div><div class="v">${o.invoiceId ? '<span class="tag green">已开具 ' + o.invoiceId + '</span>' : '<span class="tag gray">未开具</span>'}</div></div>
        `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">关闭</button>`);
      });
      document.getElementById('vList').querySelectorAll('[data-iv]').forEach(b => b.onclick = () => issueVipInvoice(b.dataset.iv));
    };
    draw();
    document.getElementById('filterKind').onchange = draw;
    document.getElementById('searchV').oninput = U.debounce(draw, 200);
    document.getElementById('exportV').onclick = () => toast('导出功能（演示）');
  });

  function issueVipInvoice(id) {
    const ss = Store.get();
    const o = (ss.vipOrders || []).find(x => x.id === id);
    if (!o) return;
    const profile = ss.invoiceProfiles.find(p => p.userId === o.userId && p.isDefault) || ss.invoiceProfiles.find(p => p.userId === o.userId);
    if (!profile) { toast('该用户尚未添加发票抬头', true); return; }
    const invoiceNo = 'INV' + Date.now();
    const now = Date.now();
    ss.invoices.push({
      id: Store.uid('IV'), no: invoiceNo, orderId: o.id,
      userId: o.userId, user: o.user, title: profile.title, taxNo: profile.taxNo,
      amount: o.amount, issuedAt: now, source: o.kind === 'svip' ? 'svip' : 'aic',
    });
    o.invoiceId = invoiceNo;
    Store.log('补开发票', `${invoiceNo} - ${o.user}`, 'admin');
    Store.set(ss);
    toast('发票已补开');
  }

  // ---------- 页面：AIC 消耗统计 ----------
  register('aicConsumptions', () => {
    $crumb.innerHTML = '<b>AIC 消耗统计</b>';
    const s = Store.get();
    const list = s.aicConsumptions || [];
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayList = list.filter(c => c.createdAt >= todayStart.getTime());
    const todayAic = todayList.reduce((sum, c) => sum + (c.aicCost || 0), 0);
    const todayTokens = todayList.reduce((sum, c) => sum + (c.tokens || 0), 0);

    // 按用户聚合（用于"每个用户的 AIC 日消耗量 + VIP 余额"）
    const userAgg = {};
    list.forEach(c => {
      if (!userAgg[c.userId]) userAgg[c.userId] = { userId: c.userId, user: c.user, totalAic: 0, totalTokens: 0, todayAic: 0, todayTokens: 0, count: 0 };
      const a = userAgg[c.userId];
      a.totalAic += c.aicCost || 0;
      a.totalTokens += c.tokens || 0;
      a.count += 1;
      if (c.createdAt >= todayStart.getTime()) {
        a.todayAic += c.aicCost || 0;
        a.todayTokens += c.tokens || 0;
      }
    });
    const userRows = Object.values(userAgg).sort((a, b) => b.todayAic - a.todayAic);

    // 按日聚合
    const dayAgg = {};
    list.forEach(c => {
      const d = new Date(c.createdAt); d.setHours(0,0,0,0);
      const k = d.getTime();
      if (!dayAgg[k]) dayAgg[k] = { day: k, aic: 0, tokens: 0, count: 0 };
      dayAgg[k].aic += c.aicCost || 0;
      dayAgg[k].tokens += c.tokens || 0;
      dayAgg[k].count += 1;
    });
    const dayRows = Object.values(dayAgg).sort((a, b) => b.day - a.day).slice(0, 14);

    $content.innerHTML = `
      <div class="page-head"><h1>AIC 消耗统计</h1></div>
      <div class="stat-row">
        <div class="stat-card"><div class="l">今日消耗 AIC</div><div class="v orange">${todayAic.toFixed(1)}</div></div>
        <div class="stat-card"><div class="l">今日消耗 token</div><div class="v">${todayTokens.toLocaleString()}</div></div>
        <div class="stat-card"><div class="l">今日调用次数</div><div class="v blue">${todayList.length}</div></div>
        <div class="stat-card"><div class="l">累计调用次数</div><div class="v">${list.length}</div></div>
      </div>

      <div class="row">
        <div class="card-block">
          <h3>每用户 AIC 日消耗 + VIP 余额</h3>
          <table class="tbl">
            <thead><tr><th>用户</th><th>VIP 余额</th><th>累计充值</th><th>今日消耗</th><th>累计消耗</th><th>调用</th><th>操作</th></tr></thead>
            <tbody>
              ${userRows.map(r => {
                const u = s.users.find(x => x.id === r.userId) || {};
                return `
                  <tr>
                    <td>${U.escapeHtml(r.user || '')}<br><span style="font-size:11px;color:#999">${r.userId}</span></td>
                    <td><span class="tag ${(u.aicBalance || 0) > 0 ? 'green' : 'gray'}">${(u.aicBalance || 0).toFixed(1)} AIC</span></td>
                    <td>${(u.aicTotalRecharged || 0).toFixed(1)}</td>
                    <td><span class="tag orange">${r.todayAic.toFixed(1)} AIC</span><br><span style="font-size:11px;color:#999">${r.todayTokens.toLocaleString()} token</span></td>
                    <td>${r.totalAic.toFixed(1)} AIC</td>
                    <td>${r.count}</td>
                    <td><button class="btn sm muted" data-detail="${r.userId}">明细</button></td>
                  </tr>
                `;
              }).join('') || '<tr class="empty-row"><td colspan="7">暂无消耗记录</td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="card-block">
          <h3>近 14 日总消耗</h3>
          <table class="tbl">
            <thead><tr><th>日期</th><th>AIC</th><th>token</th><th>次数</th></tr></thead>
            <tbody>
              ${dayRows.map(d => `
                <tr>
                  <td>${U.fmtDate(d.day, false)}</td>
                  <td><span class="tag orange">${d.aic.toFixed(1)}</span></td>
                  <td>${d.tokens.toLocaleString()}</td>
                  <td>${d.count}</td>
                </tr>
              `).join('') || '<tr class="empty-row"><td colspan="4">暂无</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card-block" style="margin-top:12px">
        <h3>最近 AIC 消耗明细</h3>
        <table class="tbl">
          <thead><tr><th>用户</th><th>项目</th><th>类型</th><th>token</th><th>AIC</th><th>时间</th></tr></thead>
          <tbody>
            ${list.slice(0, 50).map(c => `
              <tr>
                <td>${U.escapeHtml(c.user || '')}</td>
                <td>${U.escapeHtml(c.refName || '')}</td>
                <td>${c.refType === 'report' ? '<span class="tag green">报告</span>' : '<span class="tag orange">服务</span>'}</td>
                <td>${(c.tokens || 0).toLocaleString()}</td>
                <td><span class="tag orange">-${(c.aicCost || 0).toFixed(1)}</span></td>
                <td>${U.fmtDate(c.createdAt)}</td>
              </tr>
            `).join('') || '<tr class="empty-row"><td colspan="6">暂无记录</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
    $content.querySelectorAll('[data-detail]').forEach(b => b.onclick = () => {
      const uid = b.dataset.detail;
      const items = list.filter(c => c.userId === uid).slice(0, 80);
      openModal(`用户消耗明细 - ${userAgg[uid]?.user || uid}`, `
        <table class="tbl">
          <thead><tr><th>项目</th><th>类型</th><th>token</th><th>AIC</th><th>时间</th></tr></thead>
          <tbody>
            ${items.map(c => `
              <tr>
                <td>${U.escapeHtml(c.refName || '')}</td>
                <td>${c.refType === 'report' ? '报告' : '服务'}</td>
                <td>${(c.tokens || 0).toLocaleString()}</td>
                <td>-${(c.aicCost || 0).toFixed(1)} AIC</td>
                <td>${U.fmtDate(c.createdAt)}</td>
              </tr>
            `).join('') || '<tr class="empty-row"><td colspan="5">暂无</td></tr>'}
          </tbody>
        </table>
      `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">关闭</button>`);
    });
  });

  // ---------- 页面：退款申请 ----------
  register('refundRequests', () => {
    $crumb.innerHTML = '<b>退款申请</b>';
    const s = Store.get();
    const list = s.refundRequests || [];
    const pending = list.filter(r => r.status === 'pending');
    const approved = list.filter(r => r.status === 'approved');
    const rejected = list.filter(r => r.status === 'rejected');
    const totalRefunded = approved.reduce((sum, r) => sum + (r.refundedAic || r.requestedAic || 0), 0);

    $content.innerHTML = `
      <div class="page-head"><h1>退款申请</h1></div>
      <div class="stat-row">
        <div class="stat-card"><div class="l">待审核</div><div class="v orange">${pending.length}</div></div>
        <div class="stat-card"><div class="l">已通过</div><div class="v green">${approved.length}</div></div>
        <div class="stat-card"><div class="l">已驳回</div><div class="v">${rejected.length}</div></div>
        <div class="stat-card"><div class="l">已退金额</div><div class="v green">${U.fmtMoney(totalRefunded)}</div></div>
      </div>
      <div class="card-block" style="margin-bottom:12px">
        <div style="font-size:13px;color:#555;line-height:1.7">
          · 用户基于剩余 AIC 余额发起退款（1 AIC = ¥1）；<br>
          · 通过后系统自动扣减用户 AIC 余额并记录退款流水；<br>
          · 已消耗 AIC 不可退款。
        </div>
      </div>
      <table class="tbl">
        <thead><tr><th>申请号</th><th>用户</th><th>申请 AIC</th><th>折算金额</th><th>申请原因</th><th>申请时间</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          ${list.map(r => `
            <tr>
              <td>${r.id}</td>
              <td>${U.escapeHtml(r.user || '')}<br><span style="font-size:11px;color:#999">${r.userId}</span></td>
              <td>${(r.requestedAic || 0).toFixed(1)}</td>
              <td>${U.fmtMoney(r.requestedAic || 0)}</td>
              <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#666">${U.escapeHtml(r.note || '-')}</td>
              <td>${U.fmtDate(r.createdAt)}</td>
              <td>${r.status === 'pending' ? '<span class="tag orange">待审核</span>' : r.status === 'approved' ? '<span class="tag green">已退款</span>' : '<span class="tag red">已驳回</span>'}</td>
              <td class="actions">
                ${r.status === 'pending' ? `
                  <button class="btn sm success" data-approve="${r.id}"><i data-lucide="check"></i>通过</button>
                  <button class="btn sm danger" data-reject="${r.id}"><i data-lucide="x"></i>驳回</button>
                ` : `<button class="btn sm muted" data-view="${r.id}">详情</button>`}
              </td>
            </tr>
          `).join('') || '<tr class="empty-row"><td colspan="8">暂无退款申请</td></tr>'}
        </tbody>
      </table>
    `;
    $content.querySelectorAll('[data-approve]').forEach(b => b.onclick = () => processRefund(b.dataset.approve, 'approved'));
    $content.querySelectorAll('[data-reject]').forEach(b => b.onclick = () => processRefund(b.dataset.reject, 'rejected'));
    $content.querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
      const r = list.find(x => x.id === b.dataset.view);
      if (!r) return;
      openModal('退款详情', `
        <div class="kv"><div class="k">申请号</div><div class="v">${r.id}</div></div>
        <div class="kv"><div class="k">用户</div><div class="v">${U.escapeHtml(r.user)} (${r.userId})</div></div>
        <div class="kv"><div class="k">申请 AIC</div><div class="v">${(r.requestedAic || 0).toFixed(1)}</div></div>
        <div class="kv"><div class="k">折算金额</div><div class="v">${U.fmtMoney(r.requestedAic || 0)}</div></div>
        <div class="kv"><div class="k">申请时余额</div><div class="v">${(r.balanceBefore || 0).toFixed(1)} AIC</div></div>
        <div class="kv"><div class="k">用户备注</div><div class="v">${U.escapeHtml(r.note || '-')}</div></div>
        <div class="kv"><div class="k">状态</div><div class="v">${r.status === 'approved' ? '<span class="tag green">已退款</span>' : '<span class="tag red">已驳回</span>'}</div></div>
        <div class="kv"><div class="k">处理人</div><div class="v">${U.escapeHtml(r.processedBy || '-')}</div></div>
        <div class="kv"><div class="k">处理时间</div><div class="v">${r.processedAt ? U.fmtDate(r.processedAt) : '-'}</div></div>
        <div class="kv"><div class="k">运营备注</div><div class="v">${U.escapeHtml(r.processNote || '-')}</div></div>
      `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">关闭</button>`);
    });
  });

  function processRefund(id, action) {
    const ss = Store.get();
    const r = (ss.refundRequests || []).find(x => x.id === id);
    if (!r || r.status !== 'pending') return;
    const isApprove = action === 'approved';
    openModal(isApprove ? '通过退款申请' : '驳回退款申请', `
      <div class="kv"><div class="k">用户</div><div class="v">${U.escapeHtml(r.user)}</div></div>
      <div class="kv"><div class="k">申请退款</div><div class="v">${(r.requestedAic || 0).toFixed(1)} AIC（${U.fmtMoney(r.requestedAic || 0)}）</div></div>
      <div class="kv"><div class="k">申请时余额</div><div class="v">${(r.balanceBefore || 0).toFixed(1)} AIC</div></div>
      ${isApprove ? `
        <div class="field"><label>实际退款 AIC（可调整）</label>
          <input class="input" id="rAmt" type="number" min="0.1" step="0.1" max="${r.balanceBefore || 0}" value="${(r.requestedAic || 0).toFixed(1)}" />
        </div>
      ` : ''}
      <div class="field"><label>${isApprove ? '处理备注' : '驳回原因'}</label>
        <textarea class="textarea" id="rNote" placeholder="${isApprove ? '如：已原路退回' : '如：余额不足、记录有误等'}"></textarea>
      </div>
    `, `
      <button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button>
      <button class="btn ${isApprove ? 'success' : 'danger'}" id="confirmR">确认${isApprove ? '退款' : '驳回'}</button>
    `);
    document.getElementById('confirmR').onclick = () => {
      const ss2 = Store.get();
      const r2 = (ss2.refundRequests || []).find(x => x.id === id);
      if (!r2) { closeModal(); return; }
      const u = ss2.users.find(x => x.id === r2.userId);
      const note = (document.getElementById('rNote').value || '').trim();
      r2.status = action;
      r2.processedAt = Date.now();
      r2.processedBy = 'admin';
      r2.processNote = note;
      if (isApprove) {
        const amt = parseFloat(document.getElementById('rAmt').value) || 0;
        if (amt <= 0) { toast('退款金额无效', true); return; }
        if (u && (u.aicBalance || 0) < amt) { toast('用户余额不足，无法退款', true); return; }
        r2.refundedAic = amt;
        if (u) {
          u.aicBalance = Math.round(((u.aicBalance || 0) - amt) * 10) / 10;
          u.aicTotalRefunded = Math.round(((u.aicTotalRefunded || 0) + amt) * 10) / 10;
        }
        // 同步 currentUser
        if (ss2.currentUser.id === r2.userId) {
          ss2.currentUser.aicBalance = u.aicBalance;
          ss2.currentUser.aicTotalRefunded = u.aicTotalRefunded;
        }
        // 退款流水
        ss2.payFlows.unshift({
          id: Store.uid('F'), tradeNo: 'RF' + Date.now(),
          orderId: r2.id, amount: -amt, method: '原路退回',
          paidAt: Date.now(), source: 'refund',
        });
        Store.log('退款审批通过', `${r2.user} 退款 ${amt.toFixed(1)} AIC`, 'admin');
        toast('已退款');
      } else {
        Store.log('退款驳回', `${r2.user} - ${note}`, 'admin');
        toast('已驳回');
      }
      Store.set(ss2);
      closeModal();
    };
  }

  // ---------- 页面：计费配置 ----------
  register('aicConfig', () => {
    $crumb.innerHTML = '<b>AIC 计费配置</b>';
    const s = Store.get();
    const cfg = s.aicConfig || { tokenRate: 1 };
    const reports = s.reports || [];
    const vas = s.vasServices || [];
    const svipPlans = s.svipPlans || [];

    $content.innerHTML = `
      <div class="page-head"><h1>AIC 计费配置</h1></div>
      <div class="card-block" style="margin-bottom:12px">
        <h3>换算率</h3>
        <div class="row">
          <div class="field"><label>每 1000 token = ? AIC</label><input class="input" type="number" step="0.1" id="cfgRate" value="${cfg.tokenRate}"/></div>
          <div class="field"><label>充值面额映射</label><div style="padding:8px 0;color:#666">1 元 = 1 AIC（固定）</div></div>
          <div class="field"><label>&nbsp;</label><button class="btn" id="saveCfg"><i data-lucide="save"></i>保存配置</button></div>
        </div>
      </div>

      <div class="card-block" style="margin-bottom:12px">
        <h3>报告 token 估算区间</h3>
        <table class="tbl">
          <thead><tr><th>报告</th><th>分类</th><th>token 最小</th><th>token 最大</th><th>预计 AIC</th><th>操作</th></tr></thead>
          <tbody>
            ${reports.map(r => `
              <tr>
                <td><b>${U.escapeHtml(r.name)}</b></td>
                <td>${U.escapeHtml(r.cate)}</td>
                <td>${(r.estTokenMin || 0).toLocaleString()}</td>
                <td>${(r.estTokenMax || 0).toLocaleString()}</td>
                <td><span class="tag orange">${((r.estTokenMin || 0) / 1000 * cfg.tokenRate).toFixed(1)} ~ ${((r.estTokenMax || 0) / 1000 * cfg.tokenRate).toFixed(1)} AIC</span></td>
                <td class="actions"><button class="btn sm muted" data-tok="report:${r.id}"><i data-lucide="pencil"></i>编辑</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="card-block" style="margin-bottom:12px">
        <h3>增值服务 token 估算区间（仅展示，实际权益按 SVIP 订阅）</h3>
        <table class="tbl">
          <thead><tr><th>服务</th><th>服务商</th><th>token 最小</th><th>token 最大</th><th>操作</th></tr></thead>
          <tbody>
            ${vas.map(v => `
              <tr>
                <td><b>${U.escapeHtml(v.name)}</b></td>
                <td>${U.escapeHtml(v.vendor)}</td>
                <td>${(v.estTokenMin || 0).toLocaleString()}</td>
                <td>${(v.estTokenMax || 0).toLocaleString()}</td>
                <td class="actions"><button class="btn sm muted" data-tok="vas:${v.id}"><i data-lucide="pencil"></i>编辑</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="card-block">
        <h3>SVIP 套餐（第三方增值服务订阅）</h3>
        <table class="tbl">
          <thead><tr><th>名称</th><th>价格</th><th>时长（天）</th><th>说明</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            ${svipPlans.map(p => `
              <tr>
                <td><b>${U.escapeHtml(p.name)}</b></td>
                <td>${U.fmtMoney(p.price)}</td>
                <td>${p.duration}</td>
                <td style="color:#888">${U.escapeHtml(p.desc || '')}</td>
                <td>${p.status === 'on' ? '<span class="tag green">上架</span>' : '<span class="tag gray">下架</span>'}</td>
                <td class="actions">
                  <button class="btn sm muted" data-svip="${p.id}"><i data-lucide="pencil"></i>编辑</button>
                  <button class="btn sm ${p.status === 'on' ? 'muted' : 'success'}" data-svtoggle="${p.id}">${p.status === 'on' ? '下架' : '上架'}</button>
                </td>
              </tr>
            `).join('') || '<tr class="empty-row"><td colspan="6">暂无套餐</td></tr>'}
          </tbody>
        </table>
        <div style="margin-top:8px"><button class="btn" id="addSvip"><i data-lucide="plus"></i>新增 SVIP 套餐</button></div>
      </div>
    `;
    document.getElementById('saveCfg').onclick = () => {
      const ss = Store.get();
      ss.aicConfig = ss.aicConfig || {};
      ss.aicConfig.tokenRate = parseFloat(document.getElementById('cfgRate').value) || 1;
      Store.log('修改计费配置', `tokenRate=${ss.aicConfig.tokenRate}`, 'admin');
      Store.set(ss);
      toast('已保存');
    };
    $content.querySelectorAll('[data-tok]').forEach(b => b.onclick = () => editTokenRange(b.dataset.tok));
    $content.querySelectorAll('[data-svip]').forEach(b => b.onclick = () => editSvipPlan(b.dataset.svip));
    $content.querySelectorAll('[data-svtoggle]').forEach(b => b.onclick = () => {
      const ss = Store.get();
      const p = (ss.svipPlans || []).find(x => x.id === b.dataset.svtoggle);
      if (p) { p.status = p.status === 'on' ? 'off' : 'on'; Store.set(ss); toast('已更新'); }
    });
    document.getElementById('addSvip').onclick = () => editSvipPlan();
  });

  function editTokenRange(key) {
    const [kind, id] = key.split(':');
    const ss = Store.get();
    const list = kind === 'report' ? ss.reports : ss.vasServices;
    const item = list.find(x => x.id === id);
    if (!item) return;
    openModal(`编辑 token 区间 - ${item.name}`, `
      <div class="row">
        <div class="field"><label>token 最小值</label><input class="input" type="number" id="tMin" value="${item.estTokenMin || 0}"/></div>
        <div class="field"><label>token 最大值</label><input class="input" type="number" id="tMax" value="${item.estTokenMax || 0}"/></div>
      </div>
    `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn" id="saveT">保存</button>`);
    document.getElementById('saveT').onclick = () => {
      const min = +document.getElementById('tMin').value;
      const max = +document.getElementById('tMax').value;
      if (min < 0 || max < min) { toast('请检查 token 区间', true); return; }
      const ss2 = Store.get();
      const list2 = kind === 'report' ? ss2.reports : ss2.vasServices;
      const it = list2.find(x => x.id === id);
      it.estTokenMin = min; it.estTokenMax = max;
      Store.log('编辑 token 区间', `${kind} ${it.name} ${min}-${max}`, 'admin');
      Store.set(ss2);
      closeModal();
      toast('已保存');
    };
  }

  function editSvipPlan(id) {
    const ss = Store.get();
    ss.svipPlans = ss.svipPlans || [];
    const p = id ? ss.svipPlans.find(x => x.id === id) : { id: '', name: '', price: 299, duration: 30, status: 'on', desc: '' };
    openModal(id ? '编辑 SVIP 套餐' : '新增 SVIP 套餐', `
      <div class="field"><label>名称</label><input class="input" id="sn" value="${U.escapeHtml(p.name)}" placeholder="如：SVIP 月卡"/></div>
      <div class="row">
        <div class="field"><label>价格（元）</label><input class="input" type="number" id="sp" value="${p.price}"/></div>
        <div class="field"><label>时长（天）</label><input class="input" type="number" id="sd" value="${p.duration}"/></div>
      </div>
      <div class="field"><label>说明</label><textarea class="textarea" id="sds">${U.escapeHtml(p.desc || '')}</textarea></div>
    `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn" id="saveSvip">保存</button>`);
    document.getElementById('saveSvip').onclick = () => {
      const name = document.getElementById('sn').value.trim();
      const price = +document.getElementById('sp').value;
      const duration = +document.getElementById('sd').value;
      if (!name || !price || !duration) { toast('请填写完整', true); return; }
      const ss2 = Store.get();
      ss2.svipPlans = ss2.svipPlans || [];
      if (id) {
        const t = ss2.svipPlans.find(x => x.id === id);
        Object.assign(t, { name, price, duration, desc: document.getElementById('sds').value.trim() });
        Store.log('编辑 SVIP 套餐', name, 'admin');
      } else {
        ss2.svipPlans.push({ id: Store.uid('SVP'), name, price, duration, status: 'on', desc: document.getElementById('sds').value.trim() });
        Store.log('新增 SVIP 套餐', name, 'admin');
      }
      Store.set(ss2); closeModal(); toast('已保存');
    };
  }

  register('opLogs', () => {
    $crumb.innerHTML = '<b>操作日志</b>';
    const s = Store.get();
    $content.innerHTML = `
      <div class="page-head"><h1>操作日志</h1></div>
      <table class="tbl">
        <thead><tr><th>日志ID</th><th>操作</th><th>详情</th><th>操作人</th><th>时间</th></tr></thead>
        <tbody>
          ${s.opLogs.map(l => `
            <tr>
              <td>${l.id}</td>
              <td>${U.escapeHtml(l.action)}</td>
              <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.escapeHtml(l.detail)}</td>
              <td>${U.escapeHtml(l.operator)}</td>
              <td>${U.fmtDate(l.at)}</td>
            </tr>
          `).join('') || '<tr class="empty-row"><td colspan="5">暂无日志</td></tr>'}
        </tbody>
      </table>
    `;
  });

  register('businessIntents', () => {
    $crumb.innerHTML = '<b>业务意向管理</b>';
    const s = Store.get();
    const intents = s.businessIntents || [];
    const grouped = intents.reduce((acc, item) => {
      const key = item.expireDate ? new Date(item.expireDate).toLocaleDateString('zh-CN') : '未指定日期';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (a === '未指定日期') return 1;
      if (b === '未指定日期') return -1;
      return new Date(a) - new Date(b);
    });
    $content.innerHTML = `
      <div class="page-head">
        <h1>业务意向管理</h1>
        <div style="font-size:13px;color:#666">共 ${intents.length} 条意向信息</div>
      </div>
      ${sortedKeys.map(dateKey => {
        const items = grouped[dateKey];
        const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
        return `
          <div class="card" style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #f0f0f0;margin-bottom:8px;">
              <div style="font-size:14px;font-weight:600;color:#333;">到期日期：${dateKey}</div>
              <div style="font-size:14px;font-weight:700;color:#1976d2;">资金总额：${(totalAmount / 10000).toFixed(2)} 万元</div>
            </div>
            <table class="tbl" style="margin:0;">
              <thead><tr><th>企业名称</th><th>合作机构</th><th>资金规模</th><th>提交时间</th></tr></thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>${U.escapeHtml(item.company || '-')}</td>
                    <td>${U.escapeHtml(item.orgName || '-')}</td>
                    <td>${item.amount > 0 ? (item.amount / 10000).toFixed(2) + ' 万元' : '-'}</td>
                    <td>${U.fmtDate(item.createdAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }).join('') || '<div class="card" style="text-align:center;padding:40px;"><div style="color:#999;">暂无业务意向信息</div></div>'}
    `;
  });

  // 启动
  renderMenu();
  go('dashboard');

  // 初始化 Lucide 图标
  if (window.lucide) {
    lucide.createIcons();
  }
})();

