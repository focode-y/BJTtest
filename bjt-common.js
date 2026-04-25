// ============================================================
// bjt-common.js
// 公共工具函数、常量、图表渲染、TTS 模块
// 在 bjt-local-api.js 之后引入
// ============================================================

(function () {

  // ── 常量 ──────────────────────────────────────────────
  window.BJT_COMMON = {};

  const PART_NAMES = { 1: '聴解', 2: '聴読解', 3: '読解' };
  const PART_KANJI = { 1: '一', 2: '二', 3: '三' };
  const PART_NAMES_ZH = { 1: '听解', 2: '听读解', 3: '读解' };

  const TYPE_LABELS = {
    bamen: '場面把握', hatsugen: '発言聴解', sogo_t: '総合聴解',
    jokyo: '状況把握', shiryo: '資料聴読解', sogo_cd: '総合聴読解',
    goi: '語彙・文法', hyogen: '表現読解', sogo_d: '総合読解',
  };

  const TYPE_LABELS_ZH = {
    bamen: '场面把握', hatsugen: '发言听解', sogo_t: '综合听解',
    jokyo: '状况把握', shiryo: '资料听读解', sogo_cd: '综合听读解',
    goi: '词汇·语法', hyogen: '表现读解', sogo_d: '综合读解',
  };

  // 题型难度系数 (用于加权计分)
  const TYPE_DIFFICULTY = {
    bamen: 1.0,
    hatsugen: 1.5,
    sogo_t: 2.0,
    jokyo: 1.5,
    shiryo: 2.0,
    sogo_cd: 2.5,
    goi: 1.5,
    hyogen: 2.0,
    sogo_d: 2.5,
  };

  // Part 权重 (真实 BJT 各部分不等权)
  const PART_WEIGHT = { 1: 0.30, 2: 0.35, 3: 0.35 };

  const LEVEL_TABLE = [
    { name: 'J5',  min: 0,   max: 199, desc: 'ビジネス場面での日本語運用能力に至っていない' },
    { name: 'J4',  min: 200, max: 319, desc: '限られたビジネス場面で日本語による最低限のコミュニケーション能力がある' },
    { name: 'J3',  min: 320, max: 419, desc: '限られたビジネス場面である程度のコミュニケーション能力がある' },
    { name: 'J2',  min: 420, max: 529, desc: '限られたビジネス場面で日本語による適切なコミュニケーション能力がある' },
    { name: 'J1',  min: 530, max: 599, desc: '幅広いビジネス場面で日本語による適切なコミュニケーション能力がある' },
    { name: 'J1+', min: 600, max: 800, desc: 'どのようなビジネス場面でも日本語による十分なコミュニケーション能力がある' },
  ];

  window.BJT_COMMON.PART_NAMES = PART_NAMES;
  window.BJT_COMMON.PART_KANJI = PART_KANJI;
  window.BJT_COMMON.PART_NAMES_ZH = PART_NAMES_ZH;
  window.BJT_COMMON.TYPE_LABELS = TYPE_LABELS;
  window.BJT_COMMON.TYPE_LABELS_ZH = TYPE_LABELS_ZH;
  window.BJT_COMMON.TYPE_DIFFICULTY = TYPE_DIFFICULTY;
  window.BJT_COMMON.PART_WEIGHT = PART_WEIGHT;
  window.BJT_COMMON.LEVEL_TABLE = LEVEL_TABLE;

  // ── 工具函数 ──────────────────────────────────────────
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function escapeAttr(s) {
    return String(s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  window.BJT_COMMON.escapeHtml = escapeHtml;
  window.BJT_COMMON.escapeAttr = escapeAttr;

  // ── 翻译辅助 ──────────────────────────────────────────
  function tr(qid, field) {
    var all = window.BJT_TRANSLATIONS || {};
    var t = all[qid];
    return (t && t[field]) || '';
  }

  window.BJT_COMMON.tr = tr;

  // ── 图表渲染 ──────────────────────────────────────────
  // options.compact: true 时用紧凑模式(错题本用)
  function renderChart(data, options) {
    if (!data) return '';
    var compact = options && options.compact;
    var html = '<div class="' + (compact ? 'wrong-chart' : 'q-chart') + '">';
    if (data.title) {
      html += '<div class="' + (compact ? 'wrong-chart-title' : 'q-chart-title') + '">' +
              escapeHtml(data.title) + '</div>';
    }

    if (data.type === 'bar') {
      if (compact) {
        // 紧凑模式：文字列表
        html += '<div style="font-size:12px">';
        data.labels.forEach(function (lab, i) {
          html += '<div style="margin:4px 0"><strong>' + escapeHtml(lab) + ':</strong> ' +
                  data.values[i] + (data.unit || '') + '</div>';
        });
        html += '</div>';
      } else {
        var max = Math.max.apply(null, data.values);
        html += '<div class="bar-chart" style="margin-bottom:30px">';
        data.labels.forEach(function (lab, i) {
          var h = max > 0 ? (data.values[i] / max) * 100 : 0;
          html += '<div class="bar" style="height:' + h + '%">' +
                  '<span class="bar-value">' + data.values[i] + (data.unit || '') + '</span>' +
                  '<span class="bar-label">' + escapeHtml(lab) + '</span>' +
                  '</div>';
        });
        html += '</div>';
      }
    } else if (data.type === 'table') {
      html += '<table class="' + (compact ? 'wrong-chart-table' : 'chart-table') + '"><thead><tr>';
      data.headers.forEach(function (h) { html += '<th>' + escapeHtml(h) + '</th>'; });
      html += '</tr></thead><tbody>';
      data.rows.forEach(function (row) {
        html += '<tr>';
        row.forEach(function (cell) { html += '<td>' + escapeHtml(String(cell)) + '</td>'; });
        html += '</tr>';
      });
      html += '</tbody></table>';
    } else if (data.type === 'list') {
      html += '<ul style="padding-left:20px;line-height:2">';
      data.items.forEach(function (it) { html += '<li>' + escapeHtml(it) + '</li>'; });
      html += '</ul>';
    }
    html += '</div>';
    return html;
  }

  window.BJT_COMMON.renderChart = renderChart;

  // ── TTS 模块 ──────────────────────────────────────────
  var jpVoice = null;
  var ttsReady = false;

  function loadVoices() {
    if (!window.speechSynthesis) return;
    var voices = window.speechSynthesis.getVoices();
    jpVoice = null;
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].lang && voices[i].lang.toLowerCase().indexOf('ja') === 0) {
        jpVoice = voices[i];
        break;
      }
    }
    ttsReady = voices.length > 0;
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Safari 同步返回
  }

  // 语速设置: 从 localStorage 读取, 默认 'normal'
  function getTtsRate() {
    try {
      var saved = localStorage.getItem('bjt_tts_rate');
      if (saved === 'slow') return 0.75;
      if (saved === 'fast') return 1.1;
    } catch (e) {}
    return 0.92; // normal
  }

  function setTtsRate(mode) {
    try { localStorage.setItem('bjt_tts_rate', mode); } catch (e) {}
  }

  function speakJP(text) {
    if (!window.speechSynthesis) {
      alert('お使いのブラウザは音声合成に対応していません。');
      return;
    }
    window.speechSynthesis.cancel();

    if (!ttsReady) loadVoices(); // retry

    var utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ja-JP';
    utter.rate = getTtsRate();
    utter.pitch = 1.0;
    if (jpVoice) utter.voice = jpVoice;
    window.speechSynthesis.speak(utter);
  }

  function stopAudio() {
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
  }

  function hasJapaneseVoice() {
    return !!jpVoice;
  }

  window.BJT_COMMON.speakJP = speakJP;
  window.BJT_COMMON.stopAudio = stopAudio;
  window.BJT_COMMON.getTtsRate = getTtsRate;
  window.BJT_COMMON.setTtsRate = setTtsRate;
  window.BJT_COMMON.hasJapaneseVoice = hasJapaneseVoice;

  // ── 加权计分 ──────────────────────────────────────────
  // 输入: questions(完整题目数组), answers({ qId: 1-4 })
  // 返回: { scoreTotal, partScore, partTotal, bjtScore, level, typeBreakdown, wrongList }
  function calculateWeightedScore(questions, answers) {
    var partScore = { 1: 0, 2: 0, 3: 0 };
    var partTotal = { 1: 0, 2: 0, 3: 0 };
    var partWeightedCorrect = { 1: 0, 2: 0, 3: 0 };
    var partWeightedTotal = { 1: 0, 2: 0, 3: 0 };
    var typeBreakdown = {};
    var wrongList = [];

    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      var diff = TYPE_DIFFICULTY[q.type] || 1.0;
      var userAns = Number(answers[q.id] || 0);
      var isCorrect = (userAns === q.correct_answer);

      partTotal[q.part] += 1;
      partWeightedTotal[q.part] += diff;

      if (!typeBreakdown[q.type]) {
        typeBreakdown[q.type] = { correct: 0, total: 0, label: TYPE_LABELS[q.type] || q.type, label_zh: TYPE_LABELS_ZH[q.type] || q.type };
      }
      typeBreakdown[q.type].total += 1;

      if (isCorrect) {
        partScore[q.part] += 1;
        partWeightedCorrect[q.part] += diff;
        typeBreakdown[q.type].correct += 1;
      } else {
        wrongList.push({ question_id: q.id, user_answer: userAns });
      }
    }

    // 加权 BJT 分数 = 各 Part 加权正答率 × Part 权重 × 800
    var weightedRate = 0;
    for (var p = 1; p <= 3; p++) {
      var rate = partWeightedTotal[p] > 0 ? (partWeightedCorrect[p] / partWeightedTotal[p]) : 0;
      weightedRate += rate * PART_WEIGHT[p];
    }
    var bjtScore = Math.round(weightedRate * 800);

    var level = 'J5';
    for (var li = LEVEL_TABLE.length - 1; li >= 0; li--) {
      if (bjtScore >= LEVEL_TABLE[li].min) {
        level = LEVEL_TABLE[li].name;
        break;
      }
    }

    var scoreTotal = partScore[1] + partScore[2] + partScore[3];

    return {
      scoreTotal: scoreTotal,
      partScore: partScore,
      partTotal: partTotal,
      bjtScore: bjtScore,
      level: level,
      typeBreakdown: typeBreakdown,
      wrongList: wrongList,
    };
  }

  window.BJT_COMMON.calculateWeightedScore = calculateWeightedScore;

  // ── 等级查询 ──────────────────────────────────────────
  function getLevel(bjtScore) {
    for (var i = 0; i < LEVEL_TABLE.length; i++) {
      if (bjtScore >= LEVEL_TABLE[i].min && bjtScore <= LEVEL_TABLE[i].max) {
        return LEVEL_TABLE[i];
      }
    }
    return LEVEL_TABLE[0];
  }

  window.BJT_COMMON.getLevel = getLevel;

})();
