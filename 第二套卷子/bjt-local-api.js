// ============================================================
// bjt-local-api.js
// 用 localStorage 模拟原本的 /api/questions、/api/submit、/api/review。
// 必须在 questions-data.js 之后引入。
// ============================================================

(function() {
  if (!window.BJT_DATA) {
    console.error('questions-data.js not loaded');
    return;
  }

  const STORAGE_KEY = 'bjt_exam_records_v2';

  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { results: [], wrongs: {}, nextId: 1 };
      return JSON.parse(raw);
    } catch {
      return { results: [], wrongs: {}, nextId: 1 };
    }
  }

  function saveRecords(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (e) { console.error('localStorage write failed', e); }
  }

  // ─────────────────────────────────────────────────────
  // GET /api/questions
  //   不返回 correct_answer / explanation_cn (与生产环境一致)
  // ─────────────────────────────────────────────────────
  window.bjtApiQuestions = function() {
    const data = window.BJT_DATA;
    const stripped = { part1: [], part2: [], part3: [] };
    ['part1', 'part2', 'part3'].forEach(k => {
      stripped[k] = data.questions[k].map(q => {
        const { correct_answer, explanation_cn, ...safe } = q;
        return safe;
      });
    });
    return {
      total: data.total,
      counts: data.counts,
      questions: stripped,
    };
  };

  // ─────────────────────────────────────────────────────
  // POST /api/submit
  // ─────────────────────────────────────────────────────
  window.bjtApiSubmit = function({ answers = {}, duration_seconds = 0 }) {
    const data = window.BJT_DATA;
    const all = [...data.questions.part1, ...data.questions.part2, ...data.questions.part3];

    // 使用 bjt-common.js 的加权计分
    const calc = window.BJT_COMMON
      ? window.BJT_COMMON.calculateWeightedScore(all, answers)
      : null;

    // 兼容: 若 bjt-common.js 未加载则 fallback 到简单计分
    const partScore = calc ? calc.partScore : { 1: 0, 2: 0, 3: 0 };
    const partTotal = calc ? calc.partTotal : { 1: 0, 2: 0, 3: 0 };
    const wrongs = calc ? calc.wrongList : [];
    const scoreTotal = calc ? calc.scoreTotal : 0;
    const bjt = calc ? calc.bjtScore : 0;
    const level = calc ? calc.level : 'J5';
    const typeBreakdown = calc ? calc.typeBreakdown : {};

    if (!calc) {
      // fallback
      for (const q of all) {
        partTotal[q.part] += 1;
        const userAns = Number(answers[q.id] || 0);
        if (userAns === q.correct_answer) {
          partScore[q.part] += 1;
        } else {
          wrongs.push({ question_id: q.id, user_answer: userAns });
        }
      }
    }

    const records = loadRecords();
    const resultId = records.nextId;
    records.nextId += 1;

    const record = {
      id: resultId,
      taken_at: new Date().toISOString().replace('T',' ').slice(0,19),
      score_total: scoreTotal,
      score_part1: partScore[1],
      score_part2: partScore[2],
      score_part3: partScore[3],
      duration_seconds: Math.max(0, Number(duration_seconds) | 0),
      total_questions: all.length,
    };
    records.results.unshift(record);
    records.wrongs[resultId] = wrongs;

    // 只保留最近20次
    if (records.results.length > 20) {
      const dropped = records.results.slice(20);
      records.results = records.results.slice(0, 20);
      dropped.forEach(r => delete records.wrongs[r.id]);
    }
    saveRecords(records);

    return {
      result_id: resultId,
      score_total: scoreTotal,
      score_part1: partScore[1],
      score_part2: partScore[2],
      score_part3: partScore[3],
      total_part1: partTotal[1],
      total_part2: partTotal[2],
      total_part3: partTotal[3],
      bjt_score_estimate: bjt,
      level,
      wrong_count: wrongs.length,
      duration_seconds: record.duration_seconds,
      type_breakdown: typeBreakdown,
    };
  };

  // ─────────────────────────────────────────────────────
  // GET /api/review
  // ─────────────────────────────────────────────────────
  window.bjtApiReview = function({ result_id, recent } = {}) {
    const data = window.BJT_DATA;
    const records = loadRecords();
    const history = records.results.slice(0, 10);

    let targetId = result_id;
    if (!targetId && recent === '1' && history.length > 0) {
      targetId = history[0].id;
    }

    // Build a map id -> full question (with answer/explanation)
    const qMap = {};
    [...data.questions.part1, ...data.questions.part2, ...data.questions.part3]
      .forEach(q => { qMap[q.id] = q; });

    let wrongRows = [];
    if (targetId) {
      const stored = records.wrongs[targetId] || [];
      wrongRows = stored.map(w => {
        const q = qMap[w.question_id];
        if (!q) return null;
        return {
          wrong_id: 0,
          exam_result_id: targetId,
          user_answer: w.user_answer,
          created_at: '',
          question_id: q.id,
          part: q.part, section: q.section, type: q.type,
          audio_script: q.audio_script,
          image_id: q.image_id,
          passage_text: q.passage_text,
          chart_data: q.chart_data,
          question_text: q.question_text,
          option_1: q.option_1, option_2: q.option_2,
          option_3: q.option_3, option_4: q.option_4,
          correct_answer: q.correct_answer,
          explanation_cn: q.explanation_cn,
        };
      }).filter(Boolean);
    } else {
      // Aggregate: count wrong frequency across all exams
      const counter = {};
      Object.values(records.wrongs).forEach(arr => {
        arr.forEach(w => {
          if (!counter[w.question_id]) counter[w.question_id] = { count: 0, last_user: w.user_answer };
          counter[w.question_id].count += 1;
          counter[w.question_id].last_user = w.user_answer;
        });
      });
      const sorted = Object.entries(counter).sort((a, b) => b[1].count - a[1].count);
      wrongRows = sorted.map(([qid, info]) => {
        const q = qMap[qid];
        if (!q) return null;
        return {
          wrong_id: 0,
          exam_result_id: null,
          user_answer: info.last_user,
          created_at: '',
          question_id: q.id,
          part: q.part, section: q.section, type: q.type,
          audio_script: q.audio_script,
          image_id: q.image_id,
          passage_text: q.passage_text,
          chart_data: q.chart_data,
          question_text: q.question_text,
          option_1: q.option_1, option_2: q.option_2,
          option_3: q.option_3, option_4: q.option_4,
          correct_answer: q.correct_answer,
          explanation_cn: q.explanation_cn,
          wrong_count: info.count,
        };
      }).filter(Boolean);
    }

    return {
      history,
      target_result_id: targetId ? Number(targetId) : null,
      wrong_answers: wrongRows,
    };
  };

  // ─────────────────────────────────────────────────────
  // 清空记录(可在控制台调用 bjtClearRecords())
  // ─────────────────────────────────────────────────────
  window.bjtClearRecords = function() {
    localStorage.removeItem(STORAGE_KEY);
    console.log('All exam records cleared.');
  };

})();
