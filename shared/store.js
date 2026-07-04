// 共享数据层：localStorage 持久化 + BroadcastChannel 跨窗口实时同步
// 小程序端与运营后台都引用此文件，通过同源浏览器存储互通数据
(function (global) {
  const KEY = 'miniapp_demo_state_v3_reports10';
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
      // 登录状态（新增）
      isLoggedIn: false,
      ehbAuthToken: null, // 鄂汇办认证token
      ehbAuthTime: null,  // 鄂汇办认证时间
      currentUser: {
        id: null,
        phone: '',
        company: '',
        creditCode: '',
        contact: '',
        authStatus: 'unverified', // unverified / pending / verified / rejected
        authMaterials: [],
        authNote: '',
        registerAt: null,
        // 会员体系（AIC 余额制）：vipLevel 仅用于身份标签
        // none：未充值；vip：曾充值或有余额
        vipLevel: 'none',
        vipExpireAt: 0,
        // SVIP 订阅（第三方增值服务专属权益，按时长订阅）
        svipExpireAt: 0,
        // AIC 余额体系（1 元 = 10 AIC，一次性消耗）
        aicBalance: 5000,         // 当前可用 AIC（=可退余额）
        aicTotalRecharged: 5000,  // 累计充值 AIC
        aicTotalConsumed: 0,   // 累计已消耗 AIC（不可退）
        aicTotalRefunded: 0,   // 累计已退款 AIC
      },
      // 报告库（10 类专业报告 × 3 档：简易版/标准版/专家版）
      reports: [
        {
          id: 'R1', name: '经营分析报告', cate: '企业经营', status: 'on', icon: 'bar-chart-3',
          desc: '盈利能力、偿债能力、运营效率、成长性多维度分析企业经营状况',
          fields: [
            { key: 'target', label: '目标企业', placeholder: '请输入企业全称', required: true },
            { key: 'period', label: '分析周期', placeholder: '如：近3年 / 2022-2024', required: false },
          ],
          tiers: [
            { id: 't1', name: '简易版', label: '快览', aic: 50, eta: '5 分钟', desc: '核心经营指标速览（盈利/偿债/运营效率三大维度）' },
            { id: 't2', name: '标准版', label: '详细', aic: 150, eta: '30 分钟', desc: '全维度经营分析 + 同业对比 + 趋势研判' },
            { id: 't3', name: '专家版', label: '深度+策略', aic: 400, eta: '2 小时', desc: '专家级深度剖析 + 改进建议与提升策略 + 行业最佳实践' },
          ],
        },
        {
          id: 'R2', name: '行业研究报告', cate: '产业洞察', status: 'on', icon: 'line-chart',
          desc: '行业现状、竞争格局、产业链上下游、政策环境与未来趋势研究',
          fields: [
            { key: 'industry', label: '目标行业', placeholder: '如：新能源汽车 / 工业互联网', required: true },
            { key: 'region', label: '研究区域', placeholder: '如：全国 / 湖北 / 武汉', required: false },
          ],
          tiers: [
            { id: 't1', name: '简易版', label: '快览', aic: 60, eta: '5 分钟', desc: '行业概览 + 市场规模 + 核心玩家速览' },
            { id: 't2', name: '标准版', label: '详细', aic: 180, eta: '40 分钟', desc: '完整产业链拆解 + 竞争格局 + 政策环境分析' },
            { id: 't3', name: '专家版', label: '深度+策略', aic: 450, eta: '2 小时', desc: '深度趋势研判 + 投资机会识别 + 进入策略建议' },
          ],
        },
        {
          id: 'R3', name: '知识产权分析报告', cate: '知识产权', status: 'on', icon: 'lightbulb',
          desc: '专利布局、商标资产、软著情况、知识产权价值评估与风险识别',
          fields: [
            { key: 'target', label: '目标企业', placeholder: '请输入企业全称', required: true },
            { key: 'iptype', label: '关注 IP 类型', placeholder: '如：发明专利 / 商标 / 软著', required: false },
          ],
          tiers: [
            { id: 't1', name: '简易版', label: '快览', aic: 40, eta: '5 分钟', desc: '专利/商标/软著数量与分布速览' },
            { id: 't2', name: '标准版', label: '详细', aic: 130, eta: '30 分钟', desc: '专利布局分析 + 技术领域分布 + 法律状态' },
            { id: 't3', name: '专家版', label: '深度+策略', aic: 380, eta: '2 小时', desc: '专利价值评估 + IP 战略建议 + 侵权风险预警' },
          ],
        },
        {
          id: 'R4', name: '政策解读与申报建议报告', cate: '政策匹配', status: 'on', icon: 'landmark',
          desc: '精准匹配适用政策，深度解读条款细则，给出可落地的申报路径与材料清单',
          fields: [
            { key: 'target', label: '目标企业', placeholder: '请输入企业全称', required: true },
            { key: 'topic', label: '关注政策方向', placeholder: '如：高新技术企业认定 / 专精特新', required: true },
          ],
          tiers: [
            { id: 't1', name: '简易版', label: '快览', aic: 30, eta: '3 分钟', desc: '匹配适用政策清单 + 资格初判' },
            { id: 't2', name: '标准版', label: '详细', aic: 120, eta: '20 分钟', desc: '条款细则解读 + 申报流程 + 材料清单' },
            { id: 't3', name: '专家版', label: '深度+策略', aic: 350, eta: '90 分钟', desc: '深度合规分析 + 申报策略 + 材料模板与撰写要点' },
          ],
        },
        {
          id: 'R5', name: '法律合规风险报告', cate: '法律风控', status: 'on', icon: 'shield-alert',
          desc: '司法涉诉、行政处罚、经营异常、失信记录全面排查与合规建议',
          fields: [
            { key: 'target', label: '目标企业', placeholder: '请输入企业全称', required: true },
            { key: 'scope', label: '排查范围', placeholder: '如：近3年司法 / 全量历史', required: false },
          ],
          tiers: [
            { id: 't1', name: '简易版', label: '快览', aic: 50, eta: '5 分钟', desc: '司法涉诉、行政处罚、经营异常关键风险速览' },
            { id: 't2', name: '标准版', label: '详细', aic: 160, eta: '30 分钟', desc: '风险事件明细 + 关联人风险 + 风险等级评定' },
            { id: 't3', name: '专家版', label: '深度+策略', aic: 420, eta: '2 小时', desc: '深度合规审查 + 整改建议 + 法律意见书' },
          ],
        },
        {
          id: 'R6', name: '企业估值报告', cate: '价值评估', status: 'on', icon: 'trending-up',
          desc: '市场法、收益法、成本法多模型估值，输出合理价值区间',
          fields: [
            { key: 'target', label: '目标企业', placeholder: '请输入企业全称', required: true },
            { key: 'purpose', label: '估值用途', placeholder: '如：股权融资 / 并购 / 上市', required: false },
          ],
          tiers: [
            { id: 't1', name: '简易版', label: '快览', aic: 80, eta: '8 分钟', desc: '单一模型快速估值 + 同业可比估值参考' },
            { id: 't2', name: '标准版', label: '详细', aic: 250, eta: '45 分钟', desc: '多模型综合估值 + 敏感性分析 + 估值区间' },
            { id: 't3', name: '专家版', label: '深度+策略', aic: 580, eta: '3 小时', desc: '深度估值建模 + 价值驱动因素 + 提升策略' },
          ],
        },
        {
          id: 'R7', name: '尽职调查报告', cate: '尽调审查', status: 'on', icon: 'search',
          desc: '工商、财务、法律、税务、人事、知识产权六大维度全面尽调',
          fields: [
            { key: 'target', label: '目标企业', placeholder: '请输入企业全称', required: true },
            { key: 'purpose', label: '尽调用途', placeholder: '如：投资 / 并购 / 合作', required: false },
          ],
          tiers: [
            { id: 't1', name: '简易版', label: '快览', aic: 100, eta: '10 分钟', desc: '基础工商 + 财务 + 法律风险概览' },
            { id: 't2', name: '标准版', label: '详细', aic: 300, eta: '1 小时', desc: '六维度系统尽调 + 风险点识别 + 整体评估' },
            { id: 't3', name: '专家版', label: '深度+策略', aic: 680, eta: '4 小时', desc: '深度交叉验证 + 关联交易穿透 + 投后管理建议' },
          ],
        },
        {
          id: 'R8', name: '招商方案报告', cate: '招商引资', status: 'on', icon: 'briefcase',
          desc: '区域产业匹配、政策定制、落地条件分析，为招商提供决策依据',
          fields: [
            { key: 'region', label: '目标区域', placeholder: '如：武汉东湖高新区', required: true },
            { key: 'industry', label: '招商方向', placeholder: '如：人工智能 / 生物医药', required: true },
          ],
          tiers: [
            { id: 't1', name: '简易版', label: '快览', aic: 60, eta: '8 分钟', desc: '区域产业基础 + 政策优势速览' },
            { id: 't2', name: '标准版', label: '详细', aic: 200, eta: '40 分钟', desc: '招商定位 + 目标企业画像 + 政策包设计' },
            { id: 't3', name: '专家版', label: '深度+策略', aic: 520, eta: '3 小时', desc: '系统招商方案 + 项目可行性 + 落地实施路径' },
          ],
        },
        {
          id: 'R9', name: '全面风险评估报告', cate: '综合风控', status: 'on', icon: 'alert-triangle',
          desc: '战略、市场、财务、运营、合规、信用六大风险全面评估',
          fields: [
            { key: 'target', label: '目标企业', placeholder: '请输入企业全称', required: true },
            { key: 'period', label: '评估周期', placeholder: '如：近12个月', required: false },
          ],
          tiers: [
            { id: 't1', name: '简易版', label: '快览', aic: 70, eta: '8 分钟', desc: '六大风险维度雷达图 + 关键风险点' },
            { id: 't2', name: '标准版', label: '详细', aic: 220, eta: '45 分钟', desc: '风险量化评分 + 风险事件清单 + 等级评定' },
            { id: 't3', name: '专家版', label: '深度+策略', aic: 500, eta: '3 小时', desc: '深度风险图谱 + 预警体系 + 风险化解策略' },
          ],
        },
        {
          id: 'R10', name: '对标企业深度分析报告', cate: '对标分析', status: 'on', icon: 'users',
          desc: '选定标杆企业，从战略、产品、技术、财务、运营多维度深度对标',
          fields: [
            { key: 'target', label: '本方企业', placeholder: '请输入本方企业全称', required: true },
            { key: 'benchmark', label: '对标企业（最多3家）', placeholder: '多个企业用、分隔', required: true },
          ],
          tiers: [
            { id: 't1', name: '简易版', label: '快览', aic: 80, eta: '10 分钟', desc: '基础指标对标 + 差异点速览' },
            { id: 't2', name: '标准版', label: '详细', aic: 260, eta: '50 分钟', desc: '多维度对标矩阵 + 优劣势分析 + 差距量化' },
            { id: 't3', name: '专家版', label: '深度+策略', aic: 600, eta: '3 小时', desc: '深度对标 + 学习路径 + 超越策略与行动计划' },
          ],
        },
      ],
      // 第三方增值服务（运营后台可配置预计 token 区间，按实际消耗结算）
      vasServices: [
        { id: 'V1', name: '知识产权服务', desc: '专利、商标、软著查询/代理/进度跟踪', vendor: '中知数科', contact: '027-8888 0001', status: 'on', estTokenMin: 150000, estTokenMax: 300000 },
        { id: 'V2', name: '数据资产服务', desc: '数据确权、存证、价值评估与合规交易撮合', vendor: '链谷数据', contact: '027-8888 0002', status: 'on', estTokenMin: 200000, estTokenMax: 400000 },
        { id: 'V3', name: 'AI数据加工服务', desc: '文本清洗、标注、脱敏、结构化处理', vendor: '智源标注', contact: '027-8888 0003', status: 'on', estTokenMin: 200000, estTokenMax: 350000 },
        { id: 'V4', name: 'AI智能体开发服务', desc: '垂直领域 AI 智能体定制开发与部署', vendor: '九鼎智能', contact: '027-8888 0004', status: 'on', estTokenMin: 400000, estTokenMax: 800000 },
        { id: 'V5', name: '科创数据治理服务', desc: '专利/论文/项目/人才多维数据采集与治理', vendor: '科创云图', contact: '027-8888 0005', status: 'on', estTokenMin: 250000, estTokenMax: 500000 },
        { id: 'V6', name: '大模型部署与运维服务', desc: '私有化部署、微调、监控与运维', vendor: '元启算力', contact: '027-8888 0006', status: 'on', estTokenMin: 500000, estTokenMax: 1000000 },
      ],
      // AIC 计费配置（运营后台可调）：每 1000 token 折算多少 AIC
      aicConfig: {
        tokenRate: 1,         // 1000 token = 1 AIC（即 1 AIC = 1000 token）
        unitLabel: '1 AIC / 1000 token',
        minBalanceReserve: 0, // 调用前的最低预留余额
      },
      // 服务商
      vendors: [
        { id: 'VD1', name: '中知数科', scope: '知识产权服务', contact: '李工 13900000001', status: 'approved' },
        { id: 'VD2', name: '链谷数据', scope: '数据资产服务', contact: '陈工 13900000002', status: 'approved' },
        { id: 'VD3', name: '智源标注', scope: 'AI数据加工', contact: '赵工 13900000003', status: 'approved' },
        { id: 'VD4', name: '九鼎智能', scope: 'AI智能体', contact: '钱工 13900000004', status: 'approved' },
        { id: 'VD5', name: '科创云图', scope: '科创数据治理', contact: '孙工 13900000005', status: 'approved' },
        { id: 'VD6', name: '元启算力', scope: '大模型部署运维', contact: '周工 13900000006', status: 'approved' },
      ],
      // 订单（小程序使用记录，含报告档位与AIC消耗）
      orders: [
        {
          id: 'O' + (now - 1000000), type: 'report', refId: 'R1', refName: '经营分析报告', spec: 'aic',
          tierId: 't2', tierName: '标准版', aicCost: 150, amount: 150,
          payStatus: 'paid', status: 'completed', userId: 'U10001', user: '湖北智科创新',
          createdAt: now - 86400000 * 5, paidAt: now - 86400000 * 5 + 60000,
          tradeNo: 'AIC' + (now - 1000000), payMethod: 'AIC 余额',
          contractId: 'CT' + (now - 1000000), invoiceId: null, note: '按实际用量结算：150 AIC',
          reportStatus: 'ready', reportFile: '经营分析报告_某科技股份有限公司.pdf',
          target: '某科技股份有限公司',
          inputs: { target: '某科技股份有限公司', period: '近3年' },
        },
      ],
      // 服务订单（SVIP权益使用记录）
      vasOrders: [
        { id: 'VO' + (now - 2000000), serviceId: 'V1', serviceName: '知识产权服务', userId: 'U10001', user: '湖北智科创新', progress: 'in_progress', createdAt: now - 86400000 * 3, note: '专利申请代理（SVIP权益）' },
      ],
      // 服务咨询请求（小程序 → 后台）
      vasRequests: [],
      // 后台生成报告记录（运营后台生成后上传）
      generatedReports: [
        { id: 'GR' + (now - 1000000), orderId: 'O' + (now - 1000000), userId: 'U10001', reportId: 'R1', tierId: 't2', title: '经营分析报告（标准版）', target: '某科技股份有限公司', summary: '该企业经营状况良好，盈利能力稳定，运营效率高于行业平均水平。', generatedAt: now - 86400000 * 5 + 600000, generatedBy: 'system' },
      ],
      // 报告生成记录（旧，保留兼容）
      reportRecords: [],
      // 已购报告（可在小程序"我的-报告库"查看）
      purchasedReports: [
        { id: 'PR' + (now - 1000000), orderId: 'O' + (now - 1000000), reportId: 'R1', reportName: '经营分析报告', tierId: 't2', tierName: '标准版', target: '某科技股份有限公司', inputs: { target: '某科技股份有限公司', period: '近3年' }, aicCost: 150, purchasedAt: now - 86400000 * 5, readyAt: now - 86400000 * 5 + 600000, userId: 'U10001', reportStatus: 'ready' },
      ],
      // 电子合同模板
      contractTemplates: [
        { id: 'CTPL1', name: '报告购买合同模板 v1.0', forType: 'report', version: '1.0', content: '甲方（购买方）：{{company}}\n乙方（服务方）：企融通\n本合同为甲方购买"{{product}}"服务订立……', updatedAt: now - 86400000 * 60 },
        { id: 'CTPL2', name: '增值服务合同模板 v1.0', forType: 'vas', version: '1.0', content: '甲方：{{company}}\n乙方：企融通\n服务内容：{{product}}\n服务期限：自合同签署之日起 12 个月……', updatedAt: now - 86400000 * 60 },
        { id: 'CTPL3', name: 'AIC充值服务合同模板 v1.0', forType: 'vip', version: '1.0', content: '甲方（购买方）：{{company}}\n乙方（服务方）：企融通\n\n鉴于甲方拟向乙方购买AIC余额充值服务，双方依据《中华人民共和国民法典》及相关法律法规，经友好协商，达成如下协议：\n\n一、服务内容\n1.1 甲方购买套餐：{{product}}，充值金额 {{amount}}，到账 {{aic}}。\n1.2 AIC余额可用于兑换平台各类企业报告及增值服务。\n1.3 充值金额与AIC比例为1:10（1元=10 AIC），实时到账。\n\n二、双方权利与义务\n2.1 甲方保证充值资金来源合法，使用用途合规。\n2.2 乙方保证AIC余额到账及时、数据准确、系统稳定。\n2.3 甲方剩余未消耗的AIC余额可申请退款，已消耗部分不可退。\n\n三、合同生效与终止\n3.1 本合同经甲乙双方电子签章后即时生效。\n3.2 本合同采用电子合同形式，具备完全法律效力，与纸质合同同等有效。\n3.3 甲方AIC余额全部消耗或退款完毕后，本合同自动终止。\n\n四、争议解决\n4.1 因本合同产生的争议，双方应友好协商解决。\n4.2 协商不成的，提交乙方所在地有管辖权的人民法院裁决。\n\n甲方（签章）：{{company}}\n乙方（签章）：企融通 [电子章]\n签署日期：{{date}}\n\n---\n合同编号：{{contractId}}\nCA认证：已通过合规电子认证', updatedAt: now - 86400000 * 30 },
        { id: 'CTPL4', name: 'SVIP增值服务合同模板 v1.0', forType: 'svip', version: '1.0', content: '甲方（购买方）：{{company}}\n乙方（服务方）：企融通\n\n鉴于甲方拟向乙方购买SVIP尊享版会员服务，双方依据《中华人民共和国民法典》及相关法律法规，经友好协商，达成如下协议：\n\n一、服务内容\n1.1 甲方购买套餐：{{product}}，服务费用 {{amount}}，有效期 {{duration}}天。\n1.2 SVIP会员期间，甲方可免费使用乙方平台全部第三方增值服务（知识产权、数据资产、AI数据加工、AI智能体开发、科创数据治理、大模型部署运维共六大类）。\n\n二、服务期限\n2.1 本服务有效期以甲方购买套餐约定为准（{{duration}}天）。\n2.2 同等级套餐续费可叠加有效期。\n2.3 SVIP到期后相关权益自动终止，甲方可选择续费。\n\n三、双方权利与义务\n3.1 甲方在SVIP有效期内享有对应增值服务权益。\n3.2 乙方保证第三方增值服务的稳定可用和服务质量。\n3.3 SVIP与AIC余额相互独立，报告功能继续按AIC消耗。\n\n四、合同生效\n4.1 本合同经甲乙双方电子签章后即时生效。\n4.2 本合同采用电子合同形式，具备完全法律效力，与纸质合同同等有效。\n\n五、争议解决\n5.1 因本合同产生的争议，双方应友好协商解决。\n5.2 协商不成的，提交乙方所在地有管辖权的人民法院裁决。\n\n甲方（签章）：{{company}}\n乙方（签章）：企融通 [电子章]\n签署日期：{{date}}\n\n---\n合同编号：{{contractId}}\nCA认证：已通过合规电子认证', updatedAt: now - 86400000 * 30 },
      ],
      // 已签合同
      contracts: [
        { id: 'CT' + (now - 1000000), orderId: 'O' + (now - 1000000), templateId: 'CTPL1', userId: 'U10001', user: '湖北智科创新', signedAt: now - 86400000 * 5 + 30000, sealed: true },
      ],
      // AIC 充值套餐（固定面额，1 元 = 10 AIC；运营后台可配置）
      vipPlans: [
        { id: 'VP1', name: '100元AIC', amount: 100, aic: 1000, status: 'on', desc: '入门体验：约可获取 1 份基础报告' },
        { id: 'VP2', name: '200元AIC', amount: 200, aic: 2000, status: 'on', desc: '常用套餐：可使用多项报告与查询' },
        { id: 'VP3', name: '500元AIC', amount: 500, aic: 5000, status: 'on', desc: '组合套餐：报告+部分增值服务' },
        { id: 'VP4', name: '1000元AIC', amount: 1000, aic: 10000, status: 'on', desc: '常规企业用户优选' },
        { id: 'VP5', name: '2000元AIC', amount: 2000, aic: 20000, status: 'on', desc: '团队/项目周期使用推荐' },
        { id: 'VP6', name: '5000元AIC', amount: 5000, aic: 50000, status: 'on', desc: '大额备用：覆盖全部服务种类' },
      ],
      // SVIP 套餐配置（第三方增值服务专属权益，按时长订阅）
      svipPlans: [
        { id: 'SVP1', name: 'SVIP 月卡', price: 299, duration: 30, status: 'on', desc: '免费使用全部第三方增值服务 30 天' },
        { id: 'SVP2', name: 'SVIP 季卡', price: 799, duration: 90, status: 'on', desc: '季度畅享全部第三方增值服务' },
        { id: 'SVP3', name: 'SVIP 年卡', price: 2599, duration: 365, status: 'on', desc: '全年畅享所有增值服务 + 专属客服' },
      ],
      // VIP 充值订单（AIC 充值流水）
      vipOrders: [],
      // AIC 消耗记录（按 token 实际消耗结算；运营后台用于按日/按人统计）
      aicConsumptions: [
        { id: 'AC' + (now - 86400000 * 1), userId: 'U10002', user: '武汉云算科技有限公司', refType: 'report', refId: 'R1', refName: '企业尽调报告', tokens: 102500, aicCost: 102.5, createdAt: now - 86400000 * 1 },
        { id: 'AC' + (now - 86400000 * 1 - 100), userId: 'U10002', user: '武汉云算科技有限公司', refType: 'report', refId: 'R3', refName: '经营报告', tokens: 48200, aicCost: 48.2, createdAt: now - 86400000 * 1 - 60000 },
        { id: 'AC' + (now - 86400000 * 2), userId: 'U10003', user: '荆楚智造工业互联网公司', refType: 'vas', refId: 'V1', refName: '知识产权服务', tokens: 213400, aicCost: 213.4, createdAt: now - 86400000 * 2 },
        { id: 'AC' + (now - 86400000 * 3), userId: 'U10003', user: '荆楚智造工业互联网公司', refType: 'report', refId: 'R6', refName: '综合评估报告', tokens: 134900, aicCost: 134.9, createdAt: now - 86400000 * 3 },
        { id: 'AC' + (now - 86400000 * 4), userId: 'U10003', user: '荆楚智造工业互联网公司', refType: 'report', refId: 'R2', refName: '产业分析报告', tokens: 68500, aicCost: 68.5, createdAt: now - 86400000 * 4 },
      ],
      // 退款申请：用户基于剩余 AIC 余额发起
      refundRequests: [],
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
      // 第三方支付流水（VIP/SVIP 充值产生）
      payFlows: [],
      // 对账单
      reconciles: [],
      // 结算单
      settlements: [],
      // 用户列表
      users: [
        { id: 'U10001', phone: '138****8888', company: '湖北智科创新科技有限公司', registerAt: now - 86400000 * 30, authStatus: 'verified', orderCount: 1, role: 'normal', vipLevel: 'vip', vipExpireAt: now + 86400000 * 60, svipExpireAt: 0, aicBalance: 5000, aicTotalRecharged: 5000, aicTotalConsumed: 0, aicTotalRefunded: 0 },
        { id: 'U10002', phone: '139****6666', company: '武汉云算科技有限公司', registerAt: now - 86400000 * 12, authStatus: 'pending', orderCount: 0, role: 'normal', vipLevel: 'vip', vipExpireAt: now + 86400000 * 60, svipExpireAt: 0, aicBalance: 3493, aicTotalRecharged: 5000, aicTotalConsumed: 1507, aicTotalRefunded: 0 },
        { id: 'U10003', phone: '137****1234', company: '荆楚智造工业互联网公司', registerAt: now - 86400000 * 6, authStatus: 'unverified', orderCount: 0, role: 'normal', vipLevel: 'vip', vipExpireAt: now + 86400000 * 180, svipExpireAt: now + 86400000 * 180, aicBalance: 15832, aicTotalRecharged: 20000, aicTotalConsumed: 4168, aicTotalRefunded: 0 },
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
      // 业务意向信息
      businessIntents: [
        { id: 'BI001', userId: 'U10001', company: '湖北智科创新科技有限公司', orgName: '武汉科技银行', expireDate: now + 86400000 * 30, amount: 5000000, createdAt: now - 86400000 * 5 },
        { id: 'BI002', userId: 'U10002', company: '武汉云算科技有限公司', orgName: '招商银行武汉分行', expireDate: now + 86400000 * 60, amount: 8000000, createdAt: now - 86400000 * 3 },
        { id: 'BI003', userId: 'U10001', company: '湖北智科创新科技有限公司', orgName: '浦发银行', expireDate: now + 86400000 * 90, amount: 3000000, createdAt: now - 86400000 * 2 },
        { id: 'BI004', userId: 'U10003', company: '荆楚智造工业互联网公司', orgName: '建设银行湖北省分行', expireDate: now + 86400000 * 30, amount: 12000000, createdAt: now - 86400000 },
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