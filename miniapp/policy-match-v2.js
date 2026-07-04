window.__policy_match_v2_installed = true;

window.__app_register('policyMatch', () => {
  window.__app_setNav('AI政策匹配');
  const s = Store.get();
  const $page = window.__app_page;
  const go = window.__app_go;

  const companyName = s.currentUser.company;
  const authStatus = s.currentUser.authStatus === 'verified' ? '已认证' : '未认证';
  const authClass = s.currentUser.authStatus === 'verified' ? '' : 'unverified';
  const logoText = companyName.substring(0, 2);

  $page.innerHTML = `
    <div class="policy-match-container">
      <div class="policy-match-card">
        <div class="policy-match-header">
          <div class="policy-match-company-icon">${logoText}</div>
          <div class="policy-match-company-info">
            <div class="policy-match-company-name">${U.escapeHtml(companyName)}</div>
            <div class="policy-match-company-status ${authClass}">认证状态：${authStatus}</div>
          </div>
        </div>
        
        <div class="policy-match-stats">
          <div class="policy-match-stat-item">
            <span class="policy-match-stat-value">${s.policies.length}</span>
            <span class="policy-match-stat-label">政策库</span>
          </div>
          <div class="policy-match-stat-item">
            <span class="policy-match-stat-value">${s.policyFavs.length}</span>
            <span class="policy-match-stat-label">已收藏</span>
          </div>
          <div class="policy-match-stat-item">
            <span class="policy-match-stat-value">${s.policyMatchLogs.length}</span>
            <span class="policy-match-stat-label">匹配次数</span>
          </div>
        </div>

        <div class="policy-match-action">
          <button class="policy-match-btn" id="matchBtn">
            <i data-lucide="sparkles"></i>开始 AI 匹配
          </button>
        </div>
      </div>

      <div class="policy-match-card" id="matchResultCard" style="display:none">
        <div class="policy-match-result-header">
          <div class="policy-match-result-title">匹配结果</div>
          <div class="policy-match-result-count" id="matchCount">共 0 项</div>
        </div>
        
        <div class="policy-match-result" id="matchResult"></div>
      </div>

      <div class="policy-match-card" id="emptyResultCard">
        <div class="policy-match-empty">
          <div class="policy-match-empty-ring-container">
            <div class="policy-match-empty-ring"></div>
            <div class="policy-match-empty-ring"></div>
            <div class="policy-match-empty-ring"></div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:14px;color:#1976d2;font-weight:600;text-align:center;line-height:1.6">暂未找到<br>合适的<br>补贴政策</div>
          </div>
          <div class="policy-match-empty-sub">点击上方按钮开始 AI 智能匹配</div>
        </div>
      </div>

      <div class="policy-match-info">
        <div class="policy-match-info-title">
          <i data-lucide="info"></i>匹配说明
        </div>
        <div class="policy-match-info-content">
          匹配结果基于以下信息分析得到（仅供参考）：<br><br>
          锚定企业核心产业标签与所属行业特征，通过政策智能匹配模型，将企业发展属性与政策适用范围、申报条件等核心要素进行算法化对标匹配，经模型多维度运算分析与精准筛选，为企业定向输出高度契合其领域定位、发展需求的政策，助力企业高效获取专属政策红利，精准享受政策扶持，避免政策信息遗漏。
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  const createScoreRing = (score) => {
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const colorClass = score >= 80 ? '' : score >= 60 ? 'medium' : 'low';
    return `
      <svg viewBox="0 0 56 56">
        <circle class="ring-bg" cx="28" cy="28" r="${radius}"></circle>
        <circle class="ring-progress ${colorClass}" cx="28" cy="28" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
      </svg>
      <div class="policy-match-result-score-text">${score}</div>
    `;
  };

  document.getElementById('matchBtn').onclick = () => {
    const btn = document.getElementById('matchBtn');
    btn.classList.add('loading');
    btn.innerHTML = '<i data-lucide="loader-2"></i>AI 分析中...';
    if (window.lucide) lucide.createIcons();

    document.getElementById('emptyResultCard').style.display = 'none';
    document.getElementById('matchResultCard').style.display = 'block';
    document.getElementById('matchResult').innerHTML = `
      <div class="policy-match-progress">
        <div class="policy-match-progress-ring">
          <svg viewBox="0 0 100 100">
            <circle class="ring-bg" cx="50" cy="50" r="40"></circle>
            <circle class="ring-progress" cx="50" cy="50" r="40" stroke-dasharray="251.2" stroke-dashoffset="251.2"></circle>
          </svg>
          <div class="policy-match-progress-text">
            <span class="num" id="progressNum">0</span>
            <span class="label">匹配进度</span>
          </div>
        </div>
        <div class="policy-match-progress-desc">正在分析企业特征与政策匹配度...</div>
      </div>
    `;

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) progress = 100;
      
      const $num = document.getElementById('progressNum');
      if ($num) $num.textContent = Math.round(progress);

      const $ring = document.querySelector('.policy-match-progress-ring .ring-progress');
      if ($ring) {
        const circumference = 2 * Math.PI * 40;
        const offset = circumference - (progress / 100) * circumference;
        $ring.style.strokeDashoffset = offset;
      }

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const ss = Store.get();
          const matches = ss.policies.map(p => ({ ...p, score: Math.round(60 + Math.random() * 35) })).sort((a, b) => b.score - a.score);

          const $r = document.getElementById('matchResult');
          document.getElementById('matchCount').textContent = '共 ' + matches.length + ' 项';

          if (matches.length === 0) {
            $r.innerHTML = `
              <div class="policy-match-empty">
                <div class="policy-match-empty-ring-container">
                  <div class="policy-match-empty-ring"></div>
                  <div class="policy-match-empty-ring"></div>
                  <div class="policy-match-empty-ring"></div>
                  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:14px;color:#1976d2;font-weight:600;text-align:center;line-height:1.6">暂未找到<br>合适的<br>补贴政策</div>
                </div>
                <div class="policy-match-empty-sub">请尝试完善企业信息后重新匹配</div>
              </div>
            `;
          } else {
            $r.innerHTML = `
              <div class="policy-match-result-list">
                ${matches.map(m => `
                  <div class="policy-match-result-item" data-pid="${m.id}">
                    <div class="policy-match-result-score">
                      ${createScoreRing(m.score)}
                    </div>
                    <div class="policy-match-result-content">
                      <div class="policy-match-result-title-item">${U.escapeHtml(m.title)}</div>
                      <div class="policy-match-result-tags">
                        <span class="policy-match-result-tag region">${m.region}</span>
                        <span class="policy-match-result-tag">${m.cate}</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `;

            $r.querySelectorAll('[data-pid]').forEach(el => {
              el.addEventListener('click', () => go('policyDetail', { id: el.dataset.pid }));
            });
          }

          btn.classList.remove('loading');
          btn.innerHTML = '<i data-lucide="sparkles"></i>重新匹配';
          if (window.lucide) lucide.createIcons();

          ss.policyMatchLogs.unshift({ 
            id: Store.uid('PML'), 
            userId: ss.currentUser.id, 
            user: ss.currentUser.company, 
            matchedCount: matches.length, 
            at: Date.now() 
          });
          Store.log('政策匹配', ss.currentUser.company + ' 触发AI匹配', ss.currentUser.company);
          Store.set(ss);
          toast('AI 匹配完成');
        }, 500);
      }
    }, 150);
  };
});