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
      { id: 'opLogs', ico: 'list', label: '操作日志', badge: 0 },
    ]},
  ];

  function renderMenu() {
    const s = Store.get();
    // 计算 badge
    const pendingAuth = s.users.filter(u => u.authStatus === 'pending').length;
    const pendingInv = s.invoiceRequests.filter(r => r.status === 'pending').length;
    menuDef.find(g => g.grp === '用户与权限').items.find(i => i.id === 'authReview').badge = pendingAuth;
    menuDef.find(g => g.grp === '订单与财务').items.find(i => i.id === 'invoices').badge = pendingInv;

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
    const totalPaid = s.orders.filter(o => o.payStatus === 'paid').reduce((sum, o) => sum + o.amount, 0);
    const totalUsers = s.users.length;
    const verifiedUsers = s.users.filter(u => u.authStatus === 'verified').length;
    const totalReports = (s.generatedReports || []).length;
    const pendingAuth = s.users.filter(u => u.authStatus === 'pending').length;
    const pendingInv = s.invoiceRequests.filter(r => r.status === 'pending').length;
    $content.innerHTML = `
      <div class="page-head"><h1>数据看板</h1></div>
      <div class="stat-row">
        <div class="stat-card"><div class="l">订单总数</div><div class="v">${totalOrders}</div></div>
        <div class="stat-card"><div class="l">交易总额</div><div class="v green">${U.fmtMoney(totalPaid)}</div></div>
        <div class="stat-card"><div class="l">注册用户</div><div class="v blue">${totalUsers}</div></div>
        <div class="stat-card"><div class="l">已认证用户</div><div class="v">${verifiedUsers}</div></div>
      </div>
      <div class="stat-row">
        <div class="stat-card"><div class="l">报告生成量</div><div class="v">${totalReports}</div></div>
        <div class="stat-card"><div class="l">待审核认证</div><div class="v orange">${pendingAuth}</div></div>
        <div class="stat-card"><div class="l">待处理发票</div><div class="v orange">${pendingInv}</div></div>
        <div class="stat-card"><div class="l">服务订单</div><div class="v blue">${s.vasOrders.length}</div></div>
      </div>
      <div class="row">
        <div class="card-block">
          <h3>最近订单</h3>
          <table class="tbl">
            <thead><tr><th>订单号</th><th>用户</th><th>金额</th><th>状态</th></tr></thead>
            <tbody>
              ${s.orders.slice(0, 5).map(o => `
                <tr>
                  <td>${o.id}</td>
                  <td>${U.escapeHtml(o.user)}</td>
                  <td>${U.fmtMoney(o.amount)}</td>
                  <td>${o.payStatus === 'paid' ? '<span class="tag green">已支付</span>' : '<span class="tag orange">待支付</span>'}</td>
                </tr>
              `).join('') || '<tr class="empty-row"><td colspan="4">暂无订单</td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="card-block">
          <h3>最近操作日志</h3>
          <table class="tbl">
            <thead><tr><th>操作</th><th>详情</th><th>时间</th></tr></thead>
            <tbody>
              ${s.opLogs.slice(0, 5).map(l => `
                <tr>
                  <td>${U.escapeHtml(l.action)}</td>
                  <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.escapeHtml(l.detail)}</td>
                  <td>${U.fmtDate(l.at)}</td>
                </tr>
              `).join('') || '<tr class="empty-row"><td colspan="3">暂无日志</td></tr>'}
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
      <table class="tbl">
        <thead><tr><th>报告名称</th><th>分类</th><th>价格（基/标/专）</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          ${s.reports.map(r => `
            <tr>
              <td><b>${U.escapeHtml(r.name)}</b><br><span style="font-size:12px;color:#888">${U.escapeHtml(r.desc)}</span></td>
              <td>${U.escapeHtml(r.cate)}</td>
              <td>¥${r.priceBasic} / ¥${r.priceStd} / ¥${r.priceExpert}</td>
              <td>${r.status === 'on' ? '<span class="tag green">上架</span>' : '<span class="tag gray">下架</span>'}</td>
              <td class="actions">
                <button class="btn sm muted" data-edit="${r.id}"><i data-lucide="pencil"></i>编辑</button>
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
    const r = id ? s.reports.find(x => x.id === id) : { id: '', name: '', cate: '企业报告', desc: '', priceBasic: 199, priceStd: 599, priceExpert: 1599, status: 'on' };
    openModal(id ? '编辑报告' : '新增报告', `
      <div class="field"><label>报告名称</label><input class="input" id="rn" value="${U.escapeHtml(r.name)}"/></div>
      <div class="field"><label>分类</label><input class="input" id="rc" value="${U.escapeHtml(r.cate)}"/></div>
      <div class="field"><label>描述</label><textarea class="textarea" id="rd">${U.escapeHtml(r.desc)}</textarea></div>
      <div class="row">
        <div class="field"><label>简易版价格</label><input class="input" type="number" id="rb" value="${r.priceBasic}"/></div>
        <div class="field"><label>标准版价格</label><input class="input" type="number" id="rs" value="${r.priceStd}"/></div>
      </div>
      <div class="field"><label>专家版价格</label><input class="input" type="number" id="re" value="${r.priceExpert}"/></div>
    `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn" id="saveR">保存</button>`);
    document.getElementById('saveR').onclick = () => {
      const name = document.getElementById('rn').value.trim();
      const desc = document.getElementById('rd').value.trim();
      if (!name || !desc) { toast('名称和描述必填', true); return; }
      const ss = Store.get();
      if (id) {
        const t = ss.reports.find(x => x.id === id);
        Object.assign(t, { name, cate: document.getElementById('rc').value.trim(), desc, priceBasic: +document.getElementById('rb').value, priceStd: +document.getElementById('rs').value, priceExpert: +document.getElementById('re').value });
        Store.log('编辑报告', name, 'admin');
      } else {
        ss.reports.push({ id: Store.uid('R'), name, cate: document.getElementById('rc').value.trim(), desc, priceBasic: +document.getElementById('rb').value, priceStd: +document.getElementById('rs').value, priceExpert: +document.getElementById('re').value, status: 'on' });
        Store.log('新增报告', name, 'admin');
      }
      Store.set(ss); closeModal(); toast('已保存');
    };
  }

  function editVasService(id) {
    const s = Store.get();
    const v = id ? s.vasServices.find(x => x.id === id) : { id: '', name: '', desc: '', vendor: '', contact: '', priceFrom: 800, status: 'on' };
    openModal(id ? '编辑服务' : '新增服务', `
      <div class="field"><label>服务名称</label><input class="input" id="vn" value="${U.escapeHtml(v.name)}"/></div>
      <div class="field"><label>描述</label><textarea class="textarea" id="vd">${U.escapeHtml(v.desc)}</textarea></div>
      <div class="row">
        <div class="field"><label>服务商</label><input class="input" id="vv" value="${U.escapeHtml(v.vendor)}"/></div>
        <div class="field"><label>联系方式</label><input class="input" id="vc" value="${U.escapeHtml(v.contact)}"/></div>
      </div>
      <div class="field"><label>起步价</label><input class="input" type="number" id="vp" value="${v.priceFrom}"/></div>
    `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn" id="saveV">保存</button>`);
    document.getElementById('saveV').onclick = () => {
      const name = document.getElementById('vn').value.trim();
      const desc = document.getElementById('vd').value.trim();
      if (!name || !desc) { toast('名称和描述必填', true); return; }
      const ss = Store.get();
      if (id) {
        const t = ss.vasServices.find(x => x.id === id);
        Object.assign(t, { name, desc, vendor: document.getElementById('vv').value.trim(), contact: document.getElementById('vc').value.trim(), priceFrom: +document.getElementById('vp').value });
        Store.log('编辑服务', name, 'admin');
      } else {
        ss.vasServices.push({ id: Store.uid('V'), name, desc, vendor: document.getElementById('vv').value.trim(), contact: document.getElementById('vc').value.trim(), priceFrom: +document.getElementById('vp').value, status: 'on' });
        Store.log('新增服务', name, 'admin');
      }
      Store.set(ss); closeModal(); toast('已保存');
    };
  }

  function editUser(id) {
    const s = Store.get();
    const u = s.users.find(x => x.id === id);
    if (!u) return;
    openModal('编辑用户', `
      <div class="field"><label>企业名称</label><input class="input" id="uc" value="${U.escapeHtml(u.company)}"/></div>
      <div class="field"><label>手机号</label><input class="input" id="up" value="${U.escapeHtml(u.phone)}"/></div>
      <div class="field"><label>认证状态</label><select class="select" id="ua">
        <option value="unverified" ${u.authStatus === 'unverified' ? 'selected' : ''}>未认证</option>
        <option value="pending" ${u.authStatus === 'pending' ? 'selected' : ''}>审核中</option>
        <option value="verified" ${u.authStatus === 'verified' ? 'selected' : ''}>已认证</option>
        <option value="rejected" ${u.authStatus === 'rejected' ? 'selected' : ''}>已驳回</option>
      </select></div>
    `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">取消</button><button class="btn" id="saveU">保存</button>`);
    document.getElementById('saveU').onclick = () => {
      const ss = Store.get();
      const t = ss.users.find(x => x.id === id);
      if (t) {
        t.company = document.getElementById('uc').value.trim() || t.company;
        t.phone = document.getElementById('up').value.trim() || t.phone;
        t.authStatus = document.getElementById('ua').value;
        if (t.id === ss.currentUser.id) { ss.currentUser.company = t.company; ss.currentUser.phone = t.phone; ss.currentUser.authStatus = t.authStatus; }
        Store.log('编辑用户', t.company, 'admin');
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
      <div class="page-head"><h1>订单管理</h1></div>
      <div class="toolbar">
        <select class="select" id="filterStatus"><option value="">全部状态</option><option value="paid">已支付</option><option value="unpaid">待支付</option><option value="cancelled">已取消</option></select>
        <input class="input" id="searchOrder" placeholder="搜索订单号/用户" />
        <div class="grow"></div>
        <button class="btn ghost" id="exportOrders"><i data-lucide="download"></i>导出 Excel</button>
      </div>
      <table class="tbl">
        <thead><tr><th>订单号</th><th>用户</th><th>商品</th><th>金额</th><th>支付状态</th><th>订单状态</th><th>下单时间</th><th>操作</th></tr></thead>
        <tbody id="orderList"></tbody>
      </table>
    `;
    const draw = () => {
      const status = document.getElementById('filterStatus').value;
      const q = document.getElementById('searchOrder').value.trim().toLowerCase();
      const list = s.orders.filter(o =>
        (!status || (status === 'paid' && o.payStatus === 'paid') || (status === 'unpaid' && o.payStatus === 'unpaid') || (status === 'cancelled' && o.status === 'cancelled'))
        && (!q || o.id.toLowerCase().includes(q) || o.user.toLowerCase().includes(q))
      );
      document.getElementById('orderList').innerHTML = list.length ? list.map(o => `
        <tr>
          <td>${o.id}</td>
          <td>${U.escapeHtml(o.user)}</td>
          <td>${U.escapeHtml(o.refName)}</td>
          <td>${U.fmtMoney(o.amount)}</td>
          <td>${o.payStatus === 'paid' ? '<span class="tag green">已支付</span>' : '<span class="tag orange">待支付</span>'}</td>
          <td>${o.status === 'completed' ? '<span class="tag green">已完成</span>' : o.status === 'cancelled' ? '<span class="tag gray">已取消</span>' : '<span class="tag">' + o.status + '</span>'}</td>
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
    const inv = s.invoices.find(i => i.orderId === id);
    openModal('订单详情', `
      <div class="kv"><div class="k">订单号</div><div class="v">${o.id}</div></div>
      <div class="kv"><div class="k">用户</div><div class="v">${U.escapeHtml(o.user)} (${o.userId})</div></div>
      <div class="kv"><div class="k">商品</div><div class="v">${U.escapeHtml(o.refName)}</div></div>
      <div class="kv"><div class="k">分析对象</div><div class="v">${U.escapeHtml(o.target || '-')}</div></div>
      <div class="kv"><div class="k">金额</div><div class="v">${U.fmtMoney(o.amount)}</div></div>
      <div class="kv"><div class="k">支付状态</div><div class="v">${o.payStatus === 'paid' ? '<span class="tag green">已支付</span>' : '<span class="tag orange">待支付</span>'}</div></div>
      <div class="kv"><div class="k">订单状态</div><div class="v">${o.status}</div></div>
      <div class="kv"><div class="k">下单时间</div><div class="v">${U.fmtDate(o.createdAt)}</div></div>
      ${o.paidAt ? `<div class="kv"><div class="k">支付时间</div><div class="v">${U.fmtDate(o.paidAt)}</div></div>` : ''}
      ${o.tradeNo ? `<div class="kv"><div class="k">交易号</div><div class="v">${o.tradeNo}</div></div>` : ''}
      ${ct ? `<div class="kv"><div class="k">合同号</div><div class="v">${ct.id} ${ct.sealed ? '<span class="tag green">已盖章</span>' : ''}</div></div>` : ''}
      ${inv ? `<div class="kv"><div class="k">发票号</div><div class="v">${inv.no}</div></div>` : ''}
      ${o.note ? `<div class="kv"><div class="k">备注</div><div class="v">${U.escapeHtml(o.note)}</div></div>` : ''}
    `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">关闭</button>`);
  }

  // ---------- 页面：增值服务管理 ----------
  register('vasServices', () => {
    $crumb.innerHTML = '<b>增值服务管理</b>';
    const s = Store.get();
    $content.innerHTML = `
      <div class="page-head"><h1>增值服务管理</h1><button class="btn" id="addVas"><i data-lucide="plus"></i>新增服务</button></div>
      <table class="tbl">
        <thead><tr><th>服务名称</th><th>服务商</th><th>起步价</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          ${s.vasServices.map(v => `
            <tr>
              <td><b>${U.escapeHtml(v.name)}</b><br><span style="font-size:12px;color:#888">${U.escapeHtml(v.desc)}</span></td>
              <td>${U.escapeHtml(v.vendor)}</td>
              <td>¥${v.priceFrom}</td>
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
        <thead><tr><th>订单号</th><th>服务名称</th><th>用户</th><th>金额</th><th>进度</th><th>创建时间</th><th>操作</th></tr></thead>
        <tbody>
          ${s.vasOrders.map(o => `
            <tr>
              <td>${o.id}</td>
              <td>${U.escapeHtml(o.serviceName)}</td>
              <td>${U.escapeHtml(o.user)}</td>
              <td>${U.fmtMoney(o.amount)}</td>
              <td>${({ pending: '<span class="tag orange">待处理</span>', in_progress: '<span class="tag blue">进行中</span>', completed: '<span class="tag green">已完成</span>', closed: '<span class="tag gray">已关闭</span>' })[o.progress]}</td>
              <td>${U.fmtDate(o.createdAt)}</td>
              <td class="actions"><button class="btn sm" data-prog="${o.id}">更新进度</button></td>
            </tr>
          `).join('') || '<tr class="empty-row"><td colspan="7">暂无服务订单</td></tr>'}
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
      amount: req.amount, issuedAt: now,
    });
    const o = s.orders.find(x => x.id === req.orderId);
    if (o) o.invoiceId = invoiceNo;
    Store.log('开具发票', `${invoiceNo} - ${req.user}`, 'admin');
    Store.set(s);
    toast('发票已开具');
  }

  // ---------- 页面：用户管理 ----------
  register('users', () => {
    $crumb.innerHTML = '<b>用户管理</b>';
    const s = Store.get();
    $content.innerHTML = `
      <div class="page-head"><h1>用户管理</h1></div>
      <table class="tbl">
        <thead><tr><th>用户ID</th><th>企业名称</th><th>手机号</th><th>认证状态</th><th>订单数</th><th>注册时间</th><th>操作</th></tr></thead>
        <tbody>
          ${s.users.map(u => `
            <tr>
              <td>${u.id}</td>
              <td>${U.escapeHtml(u.company)}</td>
              <td>${U.escapeHtml(u.phone)}</td>
              <td>${({ verified: '<span class="tag green">已认证</span>', pending: '<span class="tag orange">审核中</span>', rejected: '<span class="tag red">已驳回</span>', unverified: '<span class="tag gray">未认证</span>' })[u.authStatus]}</td>
              <td>${u.orderCount || 0}</td>
              <td>${U.fmtDate(u.registerAt)}</td>
              <td class="actions">
                <button class="btn sm muted" data-view="${u.id}"><i data-lucide="eye"></i>查看</button>
                <button class="btn sm muted" data-edit="${u.id}"><i data-lucide="pencil"></i>编辑</button>
                <button class="btn sm danger" data-del="${u.id}"><i data-lucide="trash-2"></i>删除</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    $content.querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
      const u = s.users.find(x => x.id === b.dataset.view);
      openModal('用户详情', `
        <div class="kv"><div class="k">用户ID</div><div class="v">${u.id}</div></div>
        <div class="kv"><div class="k">企业名称</div><div class="v">${U.escapeHtml(u.company)}</div></div>
        <div class="kv"><div class="k">手机号</div><div class="v">${U.escapeHtml(u.phone)}</div></div>
        <div class="kv"><div class="k">认证状态</div><div class="v">${u.authStatus}</div></div>
        <div class="kv"><div class="k">订单数</div><div class="v">${u.orderCount || 0}</div></div>
        <div class="kv"><div class="k">注册时间</div><div class="v">${U.fmtDate(u.registerAt)}</div></div>
      `, `<button class="btn muted" onclick="document.getElementById('modalMask').classList.remove('show')">关闭</button>`);
    });
    $content.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editUser(b.dataset.edit));
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

  // ---------- 页面：操作日志 ----------
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

  // 启动
  renderMenu();
  go('dashboard');

  // 初始化 Lucide 图标
  if (window.lucide) {
    lucide.createIcons();
  }
})();

