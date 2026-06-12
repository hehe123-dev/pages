// 共享数据层：localStorage 持久化 + BroadcastChannel 跨窗口实时同步
// 小程序端与运营后台都引用此文件，通过同源浏览器存储互通数据
(function (global) {
  const KEY = 'miniapp_demo_state_v1';
  const CH = 'miniapp_demo_bus';

  const channel = ('BroadcastChannel' in global) ? new BroadcastChannel(CH) : null;
  const listeners = new Set();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  // 初始数据
  function seed() {
    const now = Date.now();
    const state = {
      currentUser: {
        id: 'U10001',
        phone: '138****8888',
        company: '湖北智科创新科技有限公司',
        creditCode: '91420100MA4K****XX',
        contact: '王经理',
        authStatus: 'verified', // unverified / pending / verified / rejected
        authMaterials: ['营业执照.pdf'],
        authNote: '',
        registerAt: now - 86400000 * 30,
      },
      // 报告库（运营后台可配置）
      reports: [
        { id: 'R1', name: '企业尽调报告', cate: '企业报告', desc: '工商信息、股权结构、经营状况、司法风险、财务指标全方位尽调', priceBasic: 199, priceStd: 599, priceExpert: 1599, status: 'on' },
        { id: 'R2', name: '产业分析报告', cate: '企业报告', desc: '产业现状、竞争格局、产业链、政策环境与未来趋势', priceBasic: 299, priceStd: 799, priceExpert: 1999, status: 'on' },
        { id: 'R3', name: '经营报告', cate: '企业报告', desc: '盈利、偿债、成长性、运营效率多维度评估', priceBasic: 199, priceStd: 599, priceExpert: 1499, status: 'on' },
        { id: 'R4', name: '科创需求报告', cate: '企业报告', desc: '识别企业研发、成果转化、知识产权等创新需求', priceBasic: 249, priceStd: 699, priceExpert: 1799, status: 'on' },
        { id: 'R5', name: '产业匹配报告', cate: '企业报告', desc: '匹配度评分，推荐落地园区或产业集群', priceBasic: 249, priceStd: 699, priceExpert: 1799, status: 'on' },
        { id: 'R6', name: '综合评估报告', cate: '企业报告', desc: '市场、技术、团队、财务、风险多维度综合评分', priceBasic: 299, priceStd: 899, priceExpert: 2299, status: 'on' },
        { id: 'R7', name: '落地可行报告', cate: '企业报告', desc: '区域落地的政策适配、成本经济与审批合规分析', priceBasic: 299, priceStd: 899, priceExpert: 2299, status: 'on' },
      ],
      // 第三方增值服务（运营后台可配置）
      vasServices: [
        { id: 'V1', name: '知识产权服务', desc: '专利、商标、软著查询/代理/进度跟踪', vendor: '中知数科', contact: '027-8888 0001', priceFrom: 800, status: 'on' },
        { id: 'V2', name: '数据资产服务', desc: '数据确权、存证、价值评估与合规交易撮合', vendor: '链谷数据', contact: '027-8888 0002', priceFrom: 5000, status: 'on' },
        { id: 'V3', name: 'AI数据加工服务', desc: '文本清洗、标注、脱敏、结构化处理', vendor: '智源标注', contact: '027-8888 0003', priceFrom: 3000, status: 'on' },
        { id: 'V4', name: 'AI智能体开发服务', desc: '垂直领域 AI 智能体定制开发与部署', vendor: '九鼎智能', contact: '027-8888 0004', priceFrom: 12000, status: 'on' },
        { id: 'V5', name: '科创数据治理服务', desc: '专利/论文/项目/人才多维数据采集与治理', vendor: '科创云图', contact: '027-8888 0005', priceFrom: 8000, status: 'on' },
        { id: 'V6', name: '大模型部署与运维服务', desc: '私有化部署、微调、监控与运维', vendor: '元启算力', contact: '027-8888 0006', priceFrom: 30000, status: 'on' },
      ],
      // 服务商
      vendors: [
        { id: 'VD1', name: '中知数科', scope: '知识产权服务', contact: '李工 13900000001', status: 'approved' },
        { id: 'VD2', name: '链谷数据', scope: '数据资产服务', contact: '陈工 13900000002', status: 'approved' },
        { id: 'VD3', name: '智源标注', scope: 'AI数据加工', contact: '赵工 13900000003', status: 'approved' },
        { id: 'VD4', name: '九鼎智能', scope: 'AI智能体', contact: '钱工 13900000004', status: 'approved' },
        { id: 'VD5', name: '科创云图', scope: '科创数据治理', contact: '孙工 13900000005', status: 'approved' },
        { id: 'VD6', name: '元启算力', scope: '大模型部署运维', contact: '周工 13900000006', status: 'approved' },
      ],
      // 订单（小程序下单 → 后台可见）
      orders: [
        {
          id: 'O' + (now - 1000000), type: 'report', refId: 'R1', refName: '企业尽调报告(标准版)', spec: 'std',
          amount: 599, payStatus: 'paid', status: 'completed', userId: 'U10001', user: '湖北智科创新',
          createdAt: now - 86400000 * 5, paidAt: now - 86400000 * 5 + 60000,
          tradeNo: 'WX' + (now - 1000000), payMethod: '微信支付',
          contractId: 'CT' + (now - 1000000), invoiceId: null, note: '',
          reportStatus: 'ready', reportFile: '企业尽调报告_某科技股份有限公司.pdf',
        },
      ],
      // 服务订单
      vasOrders: [
        { id: 'VO' + (now - 2000000), serviceId: 'V1', serviceName: '知识产权服务', userId: 'U10001', user: '湖北智科创新', amount: 800, progress: 'in_progress', createdAt: now - 86400000 * 3, note: '专利申请代理' },
      ],
      // 服务咨询请求（小程序 → 后台）
      vasRequests: [],
      // 后台生成报告记录（运营后台生成后上传）
      generatedReports: [
        { id: 'GR' + (now - 1000000), orderId: 'O' + (now - 1000000), userId: 'U10001', title: '企业尽调报告(标准版)', target: '某科技股份有限公司', summary: '经全面尽调分析，该企业整体经营状况良好……', generatedAt: now - 86400000 * 5 + 600000, generatedBy: 'admin' },
      ],
      // 报告生成记录（旧，保留兼容）
      reportRecords: [],
      // 已购报告（可在小程序"我的-报告库"查看）
      purchasedReports: [
        { id: 'PR' + (now - 1000000), orderId: 'O' + (now - 1000000), reportId: 'R1', reportName: '企业尽调报告(标准版)', target: '某科技股份有限公司', purchasedAt: now - 86400000 * 5, userId: 'U10001' },
      ],
      // 电子合同模板
      contractTemplates: [
        { id: 'CTPL1', name: '报告购买合同模板 v1.0', forType: 'report', version: '1.0', content: '甲方（购买方）：{{company}}\n乙方（服务方）：企融通\n本合同为甲方购买"{{product}}"服务订立……', updatedAt: now - 86400000 * 60 },
        { id: 'CTPL2', name: '增值服务合同模板 v1.0', forType: 'vas', version: '1.0', content: '甲方：{{company}}\n乙方：企融通\n服务内容：{{product}}\n服务期限：自合同签署之日起 12 个月……', updatedAt: now - 86400000 * 60 },
      ],
      // 已签合同
      contracts: [
        { id: 'CT' + (now - 1000000), orderId: 'O' + (now - 1000000), templateId: 'CTPL1', userId: 'U10001', user: '湖北智科创新', signedAt: now - 86400000 * 5 + 30000, sealed: true },
      ],
      // 印章
      seals: [
        { id: 'SL1', name: '企融通电子章', uploader: '系统', authorized: true, useCount: 1, lastUsedAt: now - 86400000 * 5 },
      ],
      // 发票抬头
      invoiceProfiles: [
        { id: 'IP1', userId: 'U10001', isDefault: true, title: '湖北智科创新科技有限公司', taxNo: '91420100MA4K****XX', address: '武汉市东湖高新区', phone: '027-87654321', bank: '工商银行武汉东湖支行', bankNo: '4000 1234 5678 9012' },
      ],
      // 开票申请
      invoiceRequests: [],
      // 已开发票
      invoices: [],
      // 发票配置
      invoiceConfig: { defaultTitle: '电子发票', vendor: '诺诺网', vendorApiOk: true },
      // 政策库
      policies: [
        { id: 'P1', region: '湖北', cate: '资质认定与奖励', title: '湖北省高新技术企业认定奖励办法', summary: '对新认定的高新技术企业一次性奖励 30 万元', publishAt: now - 86400000 * 10, status: 'on' },
        { id: 'P2', region: '湖北', cate: '中小微企业', title: '湖北省"专精特新"中小企业培育实施方案', summary: '入选企业可享技术改造专项支持', publishAt: now - 86400000 * 7, status: 'on' },
        { id: 'P3', region: '全国', cate: '税收优惠', title: '小微企业所得税减免政策延续', summary: '年应纳税所得额≤300万部分按25%计入应纳税所得额', publishAt: now - 86400000 * 5, status: 'on' },
        { id: 'P4', region: '湖北', cate: '科技成果奖励', title: '湖北省科技成果转化"赛马"项目申报', summary: '最高 500 万元转化资金支持', publishAt: now - 86400000 * 3, status: 'on' },
        { id: 'P5', region: '全国', cate: '知识产权类', title: '专利转化运用专项行动方案', summary: '推动高校院所存量专利向中小企业转化', publishAt: now - 86400000 * 2, status: 'on' },
        { id: 'P6', region: '湖北', cate: '贷款贴息贴保', title: '科技型中小企业贷款贴息申报', summary: '按实际贷款利息的 50% 给予贴息', publishAt: now - 86400000 * 1, status: 'on' },
      ],
      // 政策匹配日志
      policyMatchLogs: [],
      // 政策推送任务
      policyPushTasks: [],
      // 政策收藏夹
      policyFavs: [],
      // 公告
      announcements: [
        { id: 'A1', title: '平台上线"产业匹配报告"，限时 8 折', content: '即日起至本月底，购买产业匹配报告享 8 折优惠。', publishAt: now - 86400000 * 1, status: 'on' },
      ],
      // 第三方支付流水
      payFlows: [
        { id: 'F' + (now - 1000000), tradeNo: 'WX' + (now - 1000000), orderId: 'O' + (now - 1000000), amount: 599, method: '微信支付', paidAt: now - 86400000 * 5 + 60000, source: 'callback' },
      ],
      // 对账单
      reconciles: [],
      // 结算单
      settlements: [],
      // 用户列表
      users: [
        { id: 'U10001', phone: '138****8888', company: '湖北智科创新科技有限公司', registerAt: now - 86400000 * 30, authStatus: 'verified', orderCount: 1, role: 'normal' },
        { id: 'U10002', phone: '139****6666', company: '武汉云算科技有限公司', registerAt: now - 86400000 * 12, authStatus: 'pending', orderCount: 0, role: 'normal' },
        { id: 'U10003', phone: '137****1234', company: '荆楚智造工业互联网公司', registerAt: now - 86400000 * 6, authStatus: 'unverified', orderCount: 0, role: 'normal' },
      ],
      // 操作日志
      opLogs: [],
      // 价格配置（演示：限时优惠）
      pricePromos: [],
      // 支付渠道
      payChannels: [
        { id: 'PC1', name: '微信支付', enabled: true, merchant: 'wx_xxx_8801' },
        { id: 'PC2', name: '支付宝', enabled: true, merchant: 'alipay_xxx_8802' },
        { id: 'PC3', name: '银联', enabled: false, merchant: '' },
      ],
      // 后台权限角色
      roles: [
        { id: 'role_admin', name: '超级管理员', perms: ['*'] },
        { id: 'role_op', name: '运营人员', perms: ['order.*', 'invoice.*', 'policy.*'] },
        { id: 'role_finance', name: '财务人员', perms: ['pay.*', 'reconcile.*'] },
      ],
      // 通用版本
      version: '1.0.0',
    };
    save(state);
    return state;
  }

  let state = load() || seed();

  function get() { return state; }
  function set(updater) {
    const next = (typeof updater === 'function') ? updater(state) : updater;
    state = next;
    save(state);
    notify('change', null);
  }
  // 局部更新某一字段路径数组并广播
  function patch(name, payload) {
    save(state);
    notify(name, payload);
  }
  function notify(name, payload) {
    listeners.forEach(fn => { try { fn(name, payload, state); } catch (e) {} });
    if (channel) channel.postMessage({ name, payload });
  }
  function on(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  if (channel) {
    channel.onmessage = (e) => {
      // 别的窗口写了 localStorage，重新载入再广播本地监听
      state = load() || state;
      const { name, payload } = e.data || {};
      listeners.forEach(fn => { try { fn(name, payload, state); } catch (err) {} });
    };
  }
  // 监听同源其他 tab 的 storage 事件作为兜底
  global.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load() || state;
      listeners.forEach(fn => { try { fn('storage', null, state); } catch (err) {} });
    }
  });

  // 工具：生成 id / 写日志
  function uid(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function log(action, detail, operator = '系统') {
    state.opLogs.unshift({ id: uid('LG'), action, detail, operator, at: Date.now() });
    if (state.opLogs.length > 500) state.opLogs.length = 500;
  }

  // 重置（用于演示）
  function reset() {
    localStorage.removeItem(KEY);
    state = seed();
    notify('reset', null);
  }

  global.Store = { get, set, patch, on, uid, log, reset };
})(window);
