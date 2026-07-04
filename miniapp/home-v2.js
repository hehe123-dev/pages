window.__home_v2_installed = true;

window.__app_register('home', () => {
  window.__app_setNav('企融通平台');
  const s = Store.get();
  const ann = s.announcements.filter(a => a.status === 'on').sort((a, b) => b.publishAt - a.publishAt)[0];
  const colors = ['#1976d2','#388e3c','#f57c00','#7b1fa2','#c62828','#00796b','#f9a825','#5d4037','#455a64','#ad1457'];
  const $page = window.__app_page;
  const go = window.__app_go;
  const reset = window.__app_reset;

  $page.innerHTML = `
    <div class="home-hero">
      <div class="home-hero-decoration">
        <div class="home-hero-circle c1"></div>
        <div class="home-hero-circle c2"></div>
        <div class="home-hero-circle c3"></div>
      </div>
      <div class="home-hero-content">
        <div class="home-hero-title">科技金融</div>
        <div class="home-hero-subtitle">智享服务</div>
        <div class="home-hero-tags">
          <span class="home-hero-tag"><i data-lucide="bot"></i>AI赋能</span>
          <span class="home-hero-tag"><i data-lucide="shield-check"></i>安全可靠</span>
          <span class="home-hero-tag"><i data-lucide="zap"></i>急速服务</span>
          <span class="home-hero-tag"><i data-lucide="users"></i>专业团队</span>
        </div>
      </div>
    </div>

    <div class="home-search-bar">
      <i data-lucide="search"></i>
      <input id="homeSearch" placeholder="搜索企业名称 / 统一社会信用代码" />
    </div>

    <div class="home-stats">
      <div class="home-stat-card">
        <div class="home-stat-icon s1"><i data-lucide="building"></i></div>
        <span class="home-stat-value">10万+</span>
        <span class="home-stat-label">服务企业</span>
      </div>
      <div class="home-stat-card">
        <div class="home-stat-icon s2"><i data-lucide="file-text"></i></div>
        <span class="home-stat-value">50万+</span>
        <span class="home-stat-label">生成报告</span>
      </div>
      <div class="home-stat-card">
        <div class="home-stat-icon s3"><i data-lucide="clock"></i></div>
        <span class="home-stat-value">24h</span>
        <span class="home-stat-label">全天候</span>
      </div>
      <div class="home-stat-card">
        <div class="home-stat-icon s4"><i data-lucide="award"></i></div>
        <span class="home-stat-value">99%</span>
        <span class="home-stat-label">准确率</span>
      </div>
    </div>

    <div class="home-tools">
      <div class="home-tool-item" data-go="reports">
        <div class="home-tool-icon t1"><i data-lucide="file-text"></i></div>
        <div class="home-tool-label">企业报告</div>
      </div>
      <div class="home-tool-item" data-go="vas">
        <div class="home-tool-icon t2"><i data-lucide="wrench"></i></div>
        <div class="home-tool-label">增值服务</div>
      </div>
      <div class="home-tool-item" data-go="policy">
        <div class="home-tool-icon t3"><i data-lucide="landmark"></i></div>
        <div class="home-tool-label">政策专区</div>
      </div>
      <div class="home-tool-item" data-go="aiChat">
        <div class="home-tool-icon t4"><i data-lucide="bot"></i></div>
        <div class="home-tool-label">AI助手</div>
      </div>
      <div class="home-tool-item" data-go="enterpriseQuery">
        <div class="home-tool-icon t5"><i data-lucide="search"></i></div>
        <div class="home-tool-label">企业查询</div>
      </div>
      <div class="home-tool-item" data-go="businessIntent">
        <div class="home-tool-icon t6"><i data-lucide="target"></i></div>
        <div class="home-tool-label">业务意向</div>
      </div>
      <div class="home-tool-item" data-go="invoiceProfiles">
        <div class="home-tool-icon t7"><i data-lucide="receipt"></i></div>
        <div class="home-tool-label">发票管理</div>
      </div>
      <div class="home-tool-item" data-go="about">
        <div class="home-tool-icon t8"><i data-lucide="help-circle"></i></div>
        <div class="home-tool-label">帮助中心</div>
      </div>
      <div class="home-tool-item" data-go="security">
        <div class="home-tool-icon t9"><i data-lucide="shield"></i></div>
        <div class="home-tool-label">账号安全</div>
      </div>
      <div class="home-tool-item" data-go="profile">
        <div class="home-tool-icon t10"><i data-lucide="user"></i></div>
        <div class="home-tool-label">我的</div>
      </div>
    </div>

    <div class="home-recommend">
      <div class="home-recommend-header">
        <div class="home-recommend-title"><i data-lucide="star"></i>热门推荐</div>
        <div class="home-recommend-more" data-go="reports">更多 &rsaquo;</div>
      </div>
      <div class="home-recommend-scroll">
        ${s.reports.filter(r => r.status === 'on').slice(0, 4).map(r => {
          return '<div class="home-recommend-card" data-rid="' + r.id + '"><div class="home-recommend-card-img"><i data-lucide="' + (r.icon || 'file-text') + '"></i></div><div class="home-recommend-card-body"><div class="home-recommend-card-title">' + U.escapeHtml(r.name) + '</div><div class="home-recommend-card-desc">' + U.escapeHtml(r.desc) + '</div><span class="home-recommend-card-tag">' + U.escapeHtml(r.cate) + '</span></div></div>';
        }).join('')}
      </div>
    </div>

    ${ann ? '<div class="home-announcement"><div class="home-announcement-icon"><i data-lucide="megaphone"></i></div><div class="home-announcement-content"><div class="home-announcement-title"><span>公告</span>平台公告</div><div class="home-announcement-text">' + U.escapeHtml(ann.title) + '</div></div></div>' : ''}

    <div class="home-section-head">热门报告 <span class="more" data-go="reports">全部 &rsaquo;</span></div>
    <div style="padding:0 12px">
      ${s.reports.filter(r => r.status === 'on').slice(0, 3).map(r => {
        const minAic = Math.min(...(r.tiers || []).map(t => t.aic));
        const idx = s.reports.indexOf(r);
        return '<div class="home-report-card" data-rid="' + r.id + '"><div class="home-report-card-header"><div class="home-report-card-logo" style="background:' + colors[idx % colors.length] + '"><i data-lucide="' + (r.icon || 'file-text') + '" style="width:20px;height:20px;color:#fff"></i></div><div class="home-report-card-info"><div class="home-report-card-name">' + U.escapeHtml(r.name) + '</div><div class="home-report-card-tags"><span class="home-report-card-tag">' + U.escapeHtml(r.cate) + '</span>' + (idx === 0 ? '<span class="home-report-card-tag hot">热门</span>' : '') + '</div></div></div><div class="home-report-card-body"><div class="home-report-card-desc">' + U.escapeHtml(r.desc) + '</div></div><div class="home-report-card-bottom"><div class="home-report-card-price">' + minAic + ' <span>AIC 起</span></div><button class="home-report-card-btn" data-rid="' + r.id + '">查看详情</button></div></div>';
      }).join('')}
    </div>

    <div class="home-section-head">最新政策 <span class="more" data-go="policy">全部 &rsaquo;</span></div>
    <div class="card" style="padding:0;margin-bottom:0">
      <div style="padding:12px">
        <div class="plc-search-bar" style="margin:0"><i data-lucide="search" style="width:14px;height:14px;color:#999"></i><input class="plc-search-input" id="homePolicySearch" placeholder="搜索政策标题" /></div>
      </div>
      <div id="homePolicyRgs"></div>
      <div style="height:4px"></div>
      <div id="homePolicyCts"></div>
      <div style="padding:0 12px;margin-top:4px" id="homePolicyList"></div>
    </div>

    <div class="home-trust">
      <div class="home-trust-title">值得信赖</div>
      <div class="home-trust-logos">
        <div class="home-trust-logo"><i data-lucide="shield-check"></i></div>
        <div class="home-trust-logo"><i data-lucide="lock"></i></div>
        <div class="home-trust-logo"><i data-lucide="award"></i></div>
        <div class="home-trust-logo"><i data-lucide="check-circle"></i></div>
        <div class="home-trust-logo"><i data-lucide="building"></i></div>
      </div>
    </div>

    <div class="home-bottom"></div>
  `;

  if (window.lucide) lucide.createIcons();

  $page.querySelectorAll('[data-go]').forEach(el =>
    el.addEventListener('click', () => reset(el.dataset.go))
  );

  $page.querySelectorAll('[data-rid]').forEach(el =>
    el.addEventListener('click', (e) => {
      if (e.target.closest('.home-report-card-btn')) return;
      go('reportDetail', { id: el.dataset.rid });
    })
  );

  $page.querySelectorAll('.home-report-card-btn').forEach(el =>
    el.addEventListener('click', (e) => { e.stopPropagation(); go('reportDetail', { id: el.dataset.rid }); })
  );

  $page.querySelectorAll('[data-pid]').forEach(el =>
    el.addEventListener('click', () => go('policyDetail', { id: el.dataset.pid }))
  );

  $page.querySelectorAll('.home-tool-item').forEach(el => {
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