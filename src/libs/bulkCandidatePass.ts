import { RESULT_CRITERIA } from "@/configs/resultCriteria";

import {
  evaluateResult,
  getEnabledObtained,
  getEnabledOverallPercentage,
  getEnabledTotal,
  getPercentage,
  roundResultValue,
  type ResultFailure,
} from "@/libs/resultCriteria";

import {
  calculateNosPercentages,
  type ResultQuestion,
} from "@/libs/resultCriteriaNos";

export type BulkPassQuestion = ResultQuestion & {
  examSetId: number;
};

export type BulkPassTheoryResult = {
  id: number;
  questionId: number;
  correctAnswer: number;
  isCorrect: boolean;
};

export type BulkPassAttempt = {
  id: number;
  questionId: number;
  maxMarks: number;
  obtainedMarks: number;
};

export type BulkPassConfig = {
  totalTheory: number;
  totalPractical: number;
  totalViva: number;
  theoryCutoff: number;
  practicalCutoff: number;
  vivaCutoff: number;
  overallCutoff: number;
  nosCutoff: number;
  hasTheory: boolean;
  hasPractical: boolean;
  hasViva: boolean;
};

export type BulkPassCandidateInput = {
  studentId: number;
  questions: BulkPassQuestion[];
  config: BulkPassConfig;
  theoryResults: BulkPassTheoryResult[];
  attempts: BulkPassAttempt[];
  targetPercent: number | null;
};

export type BulkPassTheoryCorrection = {
  resultId: number;
  questionId: number;
  correctAnswer: number;
  marks: number;
};

export type BulkPassAdjustment = {
  attemptId: number;
  questionId: number;
  component: "practical" | "viva";
  oldMarks: number;
  newMarks: number;
  reason: string;
};

export type BulkPassEvaluation = {
  theoryMarks: number;
  practicalMarks: number;
  vivaMarks: number;
  theoryPercentage: number;
  practicalPercentage: number;
  vivaPercentage: number;
  overallPercentage: number;
  enabledObtained: number;
  enabledTotal: number;
  nosResults: Array<{
    nosCode: string;
    nosName?: string;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    cutoff: number;
  }>;
  failedSections: ResultFailure[];
  pass: boolean;
};

export type BulkPassPlan = {
  selectedCorrections: BulkPassTheoryCorrection[];
  adjustments: BulkPassAdjustment[];
  evaluation: BulkPassEvaluation;
  targetPercentage: number | null;
  theoryOnlyPercentage: number;
  requiresAdjustment: boolean;
  satisfiesTarget: boolean;
  reason: string;
};

type TheoryState = {
  correctIds: Set<number>;
  incorrect: BulkPassTheoryCorrection[];
  correctCount: number;
  incorrectCount: number;
  marks: number;
};

type AttemptState = BulkPassAttempt & {
  component: "practical" | "viva";
  nosCodes: string[];
};

const TARGET_EPSILON = 0.01;

const toNumber = (value: unknown) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const isTargetSatisfied = (
  percentage: number,
  target: number | null
) => target === null || percentage <= target + TARGET_EPSILON;

const isExactTarget = (percentage: number, target: number | null) =>
  target === null || Math.abs(percentage - target) <= TARGET_EPSILON;

const getTargetTotal = (target: number, enabledTotal: number) => {
  if (enabledTotal <= 0) return 0;

  return Math.floor(((target / 100) * enabledTotal + 1e-7) * 100) / 100;
};

const getTheoryState = (input: BulkPassCandidateInput): TheoryState => {
  const marksByQuestionId = new Map<number, number>();

  for (const question of input.questions) {
    if (question.type === "theory") {
      marksByQuestionId.set(question.id, toNumber(question.marks));
    }
  }

  const uniqueResults = new Map<number, BulkPassTheoryResult>();

  for (const result of input.theoryResults) {
    const existing = uniqueResults.get(result.questionId);

    if (!existing || result.isCorrect) {
      uniqueResults.set(result.questionId, result);
    }
  }

  const correctIds = new Set<number>();
  const incorrect: BulkPassTheoryCorrection[] = [];

  let correctCount = 0;
  let incorrectCount = 0;
  let marks = 0;

  for (const result of uniqueResults.values()) {
    const questionMarks = marksByQuestionId.get(result.questionId) || 0;

    if (result.isCorrect) {
      correctIds.add(result.questionId);
      correctCount += 1;
      marks += questionMarks;
    } else {
      incorrectCount += 1;
      incorrect.push({
        resultId: result.id,
        questionId: result.questionId,
        correctAnswer: result.correctAnswer,
        marks: questionMarks,
      });
    }
  }

  return {
    correctIds,
    incorrect,
    correctCount,
    incorrectCount,
    marks,
  };
};

const getAttemptStates = (
  input: BulkPassCandidateInput
): AttemptState[] => {
  const questionById = new Map(
    input.questions.map((question) => [question.id, question])
  );

  const attempts: AttemptState[] = [];

  for (const attempt of input.attempts) {
    const question = questionById.get(attempt.questionId);

    if (!question) continue;

    if (question.type !== "practical" && question.type !== "viva") {
      continue;
    }

    const component = question.type;

    if (!RESULT_CRITERIA[component]) continue;

    if (component === "practical" && !input.config.hasPractical) continue;

    if (component === "viva" && !input.config.hasViva) continue;

    attempts.push({
      ...attempt,
      component,
      nosCodes: Array.from(
        new Set(question.pcs.map((pc) => pc.nosCode))
      ),
    });
  }

  return attempts;
};

const evaluateCandidate = (
  input: BulkPassCandidateInput,
  correctIds: Set<number>,
  attemptMarks: Map<number, number>
): BulkPassEvaluation => {
  const theoryMarks = input.questions
    .filter(
      (question) =>
        question.type === "theory" && correctIds.has(question.id)
    )
    .reduce((sum, question) => sum + toNumber(question.marks), 0);

  let practicalMarks = 0;
  let vivaMarks = 0;

  for (const attempt of input.attempts) {
    const question = input.questions.find(
      (item) => item.id === attempt.questionId
    );

    if (!question) continue;

    const obtainedMarks =
      attemptMarks.get(attempt.id) ?? attempt.obtainedMarks;

    if (question.type === "practical") {
      practicalMarks += obtainedMarks;
    }

    if (question.type === "viva") {
      vivaMarks += obtainedMarks;
    }
  }

  const totals = {
    theory: input.config.totalTheory,
    practical: input.config.totalPractical,
    viva: input.config.totalViva,
  };

  const obtained = {
    theory: theoryMarks,
    practical: practicalMarks,
    viva: vivaMarks,
  };

  const hasSection = {
    theory: input.config.hasTheory,
    practical: input.config.hasPractical,
    viva: input.config.hasViva,
  };

  const theoryPercentage = getPercentage(
    theoryMarks,
    input.config.totalTheory
  );

  const practicalPercentage = getPercentage(
    practicalMarks,
    input.config.totalPractical
  );

  const vivaPercentage = getPercentage(vivaMarks, input.config.totalViva);

  const overallPercentage = getEnabledOverallPercentage(
    obtained,
    totals,
    hasSection
  );

  const nosResults = calculateNosPercentages(
    input.questions,
    {
      theoryCorrectQuestionIds: correctIds,
      attempts: input.attempts.map((attempt) => ({
        questionId: attempt.questionId,
        obtainedMarks:
          attemptMarks.get(attempt.id) ?? attempt.obtainedMarks,
      })),
    },
    RESULT_CRITERIA
  ).map((nos) => ({
    ...nos,
    cutoff: input.config.nosCutoff,
  }));

  const evaluation = evaluateResult(
    {
      theory: {
        applicable: input.config.hasTheory,
        percentage: theoryPercentage,
        cutoff: input.config.theoryCutoff,
      },
      practical: {
        applicable: input.config.hasPractical,
        percentage: practicalPercentage,
        cutoff: input.config.practicalCutoff,
      },
      viva: {
        applicable: input.config.hasViva,
        percentage: vivaPercentage,
        cutoff: input.config.vivaCutoff,
      },
      overall: {
        applicable: true,
        percentage: overallPercentage,
        cutoff: input.config.overallCutoff,
      },
      nos: nosResults,
    },
    RESULT_CRITERIA
  );

  return {
    theoryMarks,
    practicalMarks,
    vivaMarks,
    theoryPercentage,
    practicalPercentage,
    vivaPercentage,
    overallPercentage,
    enabledObtained: getEnabledObtained(obtained, hasSection),
    enabledTotal: getEnabledTotal(totals, hasSection),
    nosResults,
    failedSections: evaluation.failedSections,
    pass: evaluation.pass,
  };
};

const getPlanScore = (
  input: BulkPassCandidateInput,
  plan: BulkPassPlan,
  theoryOnlyPercentage: number
) => {
  const target = input.targetPercent;

  const withinTarget = isTargetSatisfied(
    plan.evaluation.overallPercentage,
    target
  );

  let score = 0;

  if (plan.evaluation.pass && withinTarget) {
    score += 1_000_000_000;
  }

  if (plan.evaluation.pass) {
    score += 100_000_000;
  }

  score += (10 - plan.evaluation.failedSections.length) * 1_000_000;

  if (target === null) {
    score -= plan.selectedCorrections.length * 1_000;
    score += plan.evaluation.overallPercentage;

    return score;
  }

  if (plan.evaluation.overallPercentage <= target) {
    score += plan.evaluation.overallPercentage * 1_000;
  } else {
    score += (1_000 - (plan.evaluation.overallPercentage - target)) * 100;
  }

  score -= plan.selectedCorrections.length;

  return score + theoryOnlyPercentage / 1_000_000;
};

const buildPlan = (
  input: BulkPassCandidateInput,
  state: TheoryState,
  correctionIndices: number[]
): BulkPassPlan => {
  const selectedCorrections = correctionIndices.map(
    (index) => state.incorrect[index]
  );

  const correctIds = new Set(state.correctIds);

  for (const correction of selectedCorrections) {
    correctIds.add(correction.questionId);
  }

  const attemptMarks = new Map(
    input.attempts.map((attempt) => [attempt.id, attempt.obtainedMarks])
  );

  const evaluation = evaluateCandidate(input, correctIds, attemptMarks);

  const targetSatisfied = isTargetSatisfied(
    evaluation.overallPercentage,
    input.targetPercent
  );

  return {
    selectedCorrections,
    adjustments: [],
    evaluation,
    targetPercentage: input.targetPercent,
    theoryOnlyPercentage: evaluation.overallPercentage,
    requiresAdjustment: false,
    satisfiesTarget: evaluation.pass && targetSatisfied,
    reason: "",
  };
};

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;

    return state / 4294967296;
  };
};

const buildDpSubsets = (
  questions: BulkPassTheoryCorrection[],
  maxSum: number,
  passes: number,
  seed: number
) => {
  const maxMarks = Math.min(
    maxSum,
    questions.reduce((sum, question) => sum + question.marks, 0)
  );

  if (maxMarks < 0) return [];

  const subsets: number[][] = [];
  const seen = new Set<string>();
  const random = createSeededRandom(seed);

  for (let pass = 0; pass < passes; pass += 1) {
    const order = questions.map((_, index) => index);

    for (let index = order.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));

      [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
    }

    const previous = new Int32Array(maxMarks + 1).fill(-2);
    const previousSum = new Int32Array(maxMarks + 1).fill(-1);

    previous[0] = -1;

    for (const index of order) {
      const marks = questions[index].marks;

      if (marks <= 0 || marks > maxMarks) continue;

      for (let sum = maxMarks - marks; sum >= 0; sum -= 1) {
        if (previous[sum] === -2 || previous[sum + marks] !== -2) {
          continue;
        }

        previous[sum + marks] = index;
        previousSum[sum + marks] = sum;
      }
    }

    for (let sum = 0; sum <= maxMarks; sum += 1) {
      if (previous[sum] === -2) continue;

      const indices: number[] = [];

      let currentSum = sum;

      while (currentSum > 0) {
        const index = previous[currentSum];

        if (index < 0) break;

        indices.push(index);
        currentSum = previousSum[currentSum];
      }

      const key = indices
        .slice()
        .sort((a, b) => a - b)
        .join(",");

      if (seen.has(key)) continue;

      seen.add(key);
      subsets.push(indices);
    }
  }

  return subsets;
};

const getGreedySubsets = (
  state: TheoryState,
  maxSum: number
) => {
  const subsets: number[][] = [[]];

  const buildGreedy = (
    sorter: (
      a: { index: number; question: BulkPassTheoryCorrection },
      b: { index: number; question: BulkPassTheoryCorrection }
    ) => number
  ) => {
    const candidates = state.incorrect
      .map((question, index) => ({ index, question }))
      .filter((item) => item.question.marks > 0)
      .sort(sorter);

    const selected: number[] = [];
    let total = 0;

    for (const candidate of candidates) {
      if (total + candidate.question.marks > maxSum) continue;

      selected.push(candidate.index);
      total += candidate.question.marks;
    }

    subsets.push(selected);
  };

  buildGreedy((a, b) => b.question.marks - a.question.marks);
  buildGreedy((a, b) => a.question.marks - b.question.marks);
  buildGreedy(
    (a, b) =>
      b.question.correctAnswer - a.question.correctAnswer ||
      b.question.marks - a.question.marks
  );

  return subsets;
};

const findTheoryOnlyPlan = (
  input: BulkPassCandidateInput,
  state: TheoryState,
  ignoreTargetCap = false
): BulkPassPlan => {
  const currentIds = new Set(state.correctIds);

  const currentAttemptMarks = new Map(
    input.attempts.map((attempt) => [attempt.id, attempt.obtainedMarks])
  );

  const currentEvaluation = evaluateCandidate(
    input,
    currentIds,
    currentAttemptMarks
  );

  const emptyPlan = buildPlan(input, state, []);

  const target = input.targetPercent;

  if (
    emptyPlan.evaluation.pass &&
    (target === null ||
      isExactTarget(emptyPlan.evaluation.overallPercentage, target))
  ) {
    return {
      ...emptyPlan,
      reason:
        target === null
          ? "Candidate already passes without theory corrections."
          : "Target already achieved without theory corrections.",
    };
  }

  if (
    target !== null &&
    currentEvaluation.pass &&
    currentEvaluation.overallPercentage > target + TARGET_EPSILON
  ) {
    return {
      ...emptyPlan,
      reason:
        "Current overall marks exceed the target. Practical/Viva reduction is required.",
    };
  }

  const fixedPracticalVivaMarks =
    (RESULT_CRITERIA.practical && input.config.hasPractical
      ? currentEvaluation.practicalMarks
      : 0) +
    (RESULT_CRITERIA.viva && input.config.hasViva
      ? currentEvaluation.vivaMarks
      : 0);

  const targetTotal =
    target === null
      ? null
      : getTargetTotal(target, currentEvaluation.enabledTotal);

  const theoryCap =
    targetTotal === null
      ? Number.POSITIVE_INFINITY
      : targetTotal - fixedPracticalVivaMarks;

  const capExceeded =
    !ignoreTargetCap &&
    target !== null &&
    state.marks > theoryCap + TARGET_EPSILON;

  const maxTheoryMarks =
    target === null || capExceeded || ignoreTargetCap
      ? currentEvaluation.enabledTotal
      : Math.min(
          currentEvaluation.enabledTotal,
          Math.floor(theoryCap + 1e-7)
        );

  const maxAddedMarks =
    target === null || capExceeded || ignoreTargetCap
      ? state.incorrect.reduce(
          (sum, question) => sum + question.marks,
          0
        )
      : Math.max(0, maxTheoryMarks - state.marks);

  if (state.incorrect.length === 0) {
    return {
      ...emptyPlan,
      reason:
        "No incorrect theory answers are available; closest achievable percentage selected.",
    };
  }

  if (maxAddedMarks <= 0) {
    return {
      ...emptyPlan,
      reason: capExceeded
        ? "Current overall marks already exceed the target. Practical/Viva reduction is required."
        : "No incorrect theory answers can be corrected within the target limit.",
    };
  }

  const candidates = [
    ...getGreedySubsets(state, maxAddedMarks),
    ...buildDpSubsets(
      state.incorrect,
      maxAddedMarks,
      state.incorrect.length > 20 ? 10 : 16,
      input.studentId * 1000 + maxAddedMarks
    ),
  ];

  let bestPlan = emptyPlan;
  let bestScore = getPlanScore(input, emptyPlan, emptyPlan.theoryOnlyPercentage);

  for (const indices of candidates) {
    const plan = buildPlan(input, state, indices);

    const score = getPlanScore(
      input,
      plan,
      emptyPlan.theoryOnlyPercentage
    );

    if (score > bestScore) {
      bestPlan = plan;
      bestScore = score;
    }

    if (plan.satisfiesTarget) {
      const bestSatisfies = bestPlan.satisfiesTarget;

      if (
        !bestSatisfies ||
        plan.evaluation.overallPercentage >
          bestPlan.evaluation.overallPercentage
      ) {
        bestPlan = plan;
        bestScore = score;
      }
    }
  }

  if (!bestPlan.reason) {
    if (target === null) {
      bestPlan.reason = bestPlan.evaluation.pass
        ? bestPlan.selectedCorrections.length > 0
          ? "Candidate passes with the minimum required theory corrections."
          : "Candidate already passes without theory corrections."
        : "Candidate cannot pass with theory corrections only.";
    } else if (bestPlan.satisfiesTarget) {
      bestPlan.reason =
        bestPlan.evaluation.overallPercentage >= target - TARGET_EPSILON
          ? "Target achieved with theory corrections only."
          : "Closest achievable percentage below target selected with theory corrections only.";
    } else if (capExceeded) {
      bestPlan.reason =
        "Current overall marks exceed the target. Practical/Viva reduction is required after theory corrections.";
    } else if (bestPlan.evaluation.pass) {
      bestPlan.reason =
        "Candidate passes with theory corrections but exceeds the target; Practical/Viva adjustment is required.";
    } else {
      bestPlan.reason =
        "Target cannot be achieved with theory corrections only. Practical/Viva adjustment is required.";
    }
  }

  return bestPlan;
};

const getAttemptMarksMap = (attempts: BulkPassAttempt[]) =>
  new Map(attempts.map((attempt) => [attempt.id, attempt.obtainedMarks]));

const planPracticalVivaAdjustment = (
  input: BulkPassCandidateInput,
  theoryPlan: BulkPassPlan,
  state: TheoryState
): BulkPassPlan | null => {
  if (theoryPlan.evaluation.failedSections.includes("theory")) {
    return null;
  }

  const attemptStates = getAttemptStates(input);

  if (attemptStates.length === 0) {
    return null;
  }

  const correctionIds = new Set(state.correctIds);

  for (const correction of theoryPlan.selectedCorrections) {
    correctionIds.add(correction.questionId);
  }

  const marks = getAttemptMarksMap(input.attempts);

  const changes = new Map<number, BulkPassAdjustment>();
  const blockedNosAttempts = new Set<number>();

  const current = () => evaluateCandidate(input, correctionIds, marks);

  const setAttemptMarks = (
    attempt: AttemptState,
    nextMarks: number,
    reason: string
  ) => {
    const oldMarks = marks.get(attempt.id) ?? attempt.obtainedMarks;

    const clamped = roundResultValue(
      Math.min(attempt.maxMarks, Math.max(0, nextMarks))
    );

    if (Math.abs(clamped - oldMarks) < 0.005) return false;

    marks.set(attempt.id, clamped);

    const existing = changes.get(attempt.id);

    if (existing) {
      existing.newMarks = clamped;
      existing.reason = reason;
    } else {
      changes.set(attempt.id, {
        attemptId: attempt.id,
        questionId: attempt.questionId,
        component: attempt.component,
        oldMarks,
        newMarks: clamped,
        reason,
      });
    }

    return true;
  };

  const increaseComponentToCutoff = (
    component: "practical" | "viva",
    cutoff: number,
    total: number
  ) => {
    for (let index = 0; index < 40; index += 1) {
      const evaluation = current();

      const obtained =
        component === "practical"
          ? evaluation.practicalMarks
          : evaluation.vivaMarks;

      const percentage =
        component === "practical"
          ? evaluation.practicalPercentage
          : evaluation.vivaPercentage;

      if (percentage >= cutoff) return true;

      const needed = Math.max(
        0,
        Math.ceil(((cutoff / 100) * total - obtained + 1e-7) * 100) / 100
      );

      if (needed <= 0) return true;

      const candidate = attemptStates
        .filter(
          (attempt) =>
            attempt.component === component &&
            attempt.maxMarks - (marks.get(attempt.id) ?? 0) > 0.005
        )
        .sort(
          (a, b) =>
            b.maxMarks -
            (marks.get(b.id) ?? 0) -
            (a.maxMarks - (marks.get(a.id) ?? 0))
        )[0];

      if (!candidate) return false;

      const headroom = candidate.maxMarks - (marks.get(candidate.id) ?? 0);

      const changed = setAttemptMarks(
        candidate,
        (marks.get(candidate.id) ?? 0) + Math.min(needed, headroom),
        `Increase ${component} marks to meet ${component} cutoff`
      );

      if (!changed) return false;
    }

    return current().pass;
  };

  if (
    RESULT_CRITERIA.practical &&
    input.config.hasPractical &&
    current().practicalPercentage < input.config.practicalCutoff
  ) {
    const ok = increaseComponentToCutoff(
      "practical",
      input.config.practicalCutoff,
      input.config.totalPractical
    );

    if (!ok) return null;
  }

  if (
    RESULT_CRITERIA.viva &&
    input.config.hasViva &&
    current().vivaPercentage < input.config.vivaCutoff
  ) {
    const ok = increaseComponentToCutoff(
      "viva",
      input.config.vivaCutoff,
      input.config.totalViva
    );

    if (!ok) return null;
  }

  for (let index = 0; index < 120; index += 1) {
    const evaluation = current();

    if (!RESULT_CRITERIA.nos) break;

    const deficits = evaluation.nosResults.filter(
      (nos) => nos.percentage < nos.cutoff
    );

    if (deficits.length === 0) break;

    let changed = false;

    for (const deficit of deficits) {
      const needed = Math.max(
        0,
        Math.ceil(
          ((deficit.cutoff / 100) * deficit.totalMarks -
            deficit.obtainedMarks +
            1e-7) *
            100
        ) / 100
      );

      if (needed <= 0) continue;

      const candidate = attemptStates
        .filter(
          (attempt) =>
            !blockedNosAttempts.has(attempt.id) &&
            attempt.nosCodes.includes(deficit.nosCode) &&
            attempt.maxMarks - (marks.get(attempt.id) ?? 0) > 0.005
        )
        .sort(
          (a, b) =>
            b.maxMarks -
            (marks.get(b.id) ?? 0) -
            (a.maxMarks - (marks.get(a.id) ?? 0))
        )[0];

      if (!candidate) continue;

      const oldDeficit = needed;

      const headroom = candidate.maxMarks - (marks.get(candidate.id) ?? 0);

      setAttemptMarks(
        candidate,
        (marks.get(candidate.id) ?? 0) + Math.min(needed, headroom),
        `Increase ${candidate.component} marks to meet NOS ${deficit.nosCode}`
      );

      const nextEvaluation = current();

      const nextDeficit = nextEvaluation.nosResults.find(
        (nos) => nos.nosCode === deficit.nosCode
      );

      const nextNeeded =
        nextDeficit && nextDeficit.percentage < nextDeficit.cutoff
          ? Math.ceil(
              ((nextDeficit.cutoff / 100) * nextDeficit.totalMarks -
                nextDeficit.obtainedMarks +
                1e-7) *
                100
            ) / 100
          : 0;

      if (nextNeeded >= oldDeficit && headroom > 0) {
        blockedNosAttempts.add(candidate.id);
      }

      changed = true;

      if (nextNeeded <= 0) break;
    }

    if (!changed) break;
  }

  const targetTotal =
    input.targetPercent === null
      ? null
      : getTargetTotal(input.targetPercent, current().enabledTotal);

  if (targetTotal === null) {
    for (let index = 0; index < 120; index += 1) {
      const evaluation = current();

      if (evaluation.overallPercentage >= input.config.overallCutoff) {
        break;
      }

      const needed = Math.max(
        0,
        Math.ceil(
          ((input.config.overallCutoff / 100) * evaluation.enabledTotal -
            evaluation.enabledObtained +
            1e-7) *
            100
        ) / 100
      );

      if (needed <= 0) break;

      const candidate = attemptStates
        .filter(
          (attempt) =>
            attempt.maxMarks - (marks.get(attempt.id) ?? 0) > 0.005
        )
        .sort(
          (a, b) =>
            b.maxMarks -
            (marks.get(b.id) ?? 0) -
            (a.maxMarks - (marks.get(a.id) ?? 0))
        )[0];

      if (!candidate) break;

      const headroom = candidate.maxMarks - (marks.get(candidate.id) ?? 0);

      const changed = setAttemptMarks(
        candidate,
        (marks.get(candidate.id) ?? 0) + Math.min(needed, headroom),
        "Increase marks to meet overall cutoff"
      );

      if (!changed) break;
    }
  } else {
    for (let index = 0; index < 160; index += 1) {
      const evaluation = current();

      if (evaluation.enabledObtained > targetTotal + TARGET_EPSILON) {
        const excess = roundResultValue(
          evaluation.enabledObtained - targetTotal
        );

        let bestAttempt: AttemptState | null = null;
        let bestDecrease = 0;

        for (const attempt of attemptStates) {
          const obtained = marks.get(attempt.id) ?? 0;

          if (obtained <= 0.005) continue;

          const maxDecrease = Math.min(obtained, excess);

          let low = 0;
          let high = maxDecrease;

          for (let step = 0; step < 24; step += 1) {
            const mid = (low + high) / 2;

            const testMarks = new Map(marks);

            testMarks.set(
              attempt.id,
              roundResultValue(obtained - mid)
            );

            const testEvaluation = evaluateCandidate(
              input,
              correctionIds,
              testMarks
            );

            if (testEvaluation.pass) {
              low = mid;
            } else {
              high = mid;
            }
          }

          const safeDecrease = Math.floor(low * 100) / 100;

          if (safeDecrease > bestDecrease) {
            bestDecrease = safeDecrease;
            bestAttempt = attempt;
          }
        }

        if (!bestAttempt || bestDecrease <= 0.005) break;

        const changed = setAttemptMarks(
          bestAttempt,
          (marks.get(bestAttempt.id) ?? 0) - bestDecrease,
          "Decrease marks to stay within the target percentage"
        );

        if (!changed) break;

        continue;
      }

      if (evaluation.enabledObtained < targetTotal - TARGET_EPSILON) {
        const gap = roundResultValue(
          targetTotal - evaluation.enabledObtained
        );

        const candidate = attemptStates
          .filter(
            (attempt) =>
              attempt.maxMarks - (marks.get(attempt.id) ?? 0) > 0.005
          )
          .sort(
            (a, b) =>
              b.maxMarks -
              (marks.get(b.id) ?? 0) -
              (a.maxMarks - (marks.get(a.id) ?? 0))
          )[0];

        if (!candidate) break;

        const headroom = candidate.maxMarks - (marks.get(candidate.id) ?? 0);

        const changed = setAttemptMarks(
          candidate,
          (marks.get(candidate.id) ?? 0) + Math.min(gap, headroom),
          "Increase marks to reach the target percentage"
        );

        if (!changed) break;

        continue;
      }

      break;
    }
  }

  const evaluation = current();

  if (!evaluation.pass) {
    return null;
  }

  if (
    input.targetPercent !== null &&
    !isTargetSatisfied(
      evaluation.overallPercentage,
      input.targetPercent
    )
  ) {
    return null;
  }

  const adjustments = Array.from(changes.values()).filter(
    (change) => Math.abs(change.newMarks - change.oldMarks) >= 0.005
  );

  if (adjustments.length === 0) {
    return null;
  }

  return {
    selectedCorrections: theoryPlan.selectedCorrections,
    adjustments,
    evaluation,
    targetPercentage: input.targetPercent,
    theoryOnlyPercentage: theoryPlan.evaluation.overallPercentage,
    requiresAdjustment: true,
    satisfiesTarget: true,
    reason:
      input.targetPercent === null
        ? "Theory-only result cannot satisfy the pass criteria. Practical/Viva marks were adjusted to meet the pass criteria."
        : "Theory-only result cannot satisfy the target. Practical/Viva marks were adjusted to meet the target and pass criteria.",
  };
};

const getAdjustmentPlanScore = (
  plan: BulkPassPlan,
  target: number | null
) => {
  let score = plan.evaluation.pass ? 1_000_000_000_000 : 0;

  if (isTargetSatisfied(plan.evaluation.overallPercentage, target)) {
    score += 100_000_000_000;
  }

  if (
    target !== null &&
    isExactTarget(plan.evaluation.overallPercentage, target)
  ) {
    score += 1_000_000;
  }

  if (target !== null) {
    score += plan.evaluation.overallPercentage * 1_000;
  }

  score -= plan.adjustments.length * 10;
  score -= plan.selectedCorrections.length;

  return score;
};

export const planBulkCandidatePass = (
  input: BulkPassCandidateInput
) => {
  const state = getTheoryState(input);

  const theoryPlan = findTheoryOnlyPlan(input, state);

  if (
    theoryPlan.evaluation.pass &&
    isExactTarget(theoryPlan.evaluation.overallPercentage, input.targetPercent)
  ) {
    return {
      theoryPlan,
      adjustmentPlan: null,
      finalPlan: theoryPlan,
    };
  }

  const unconstrainedTheoryPlan =
    input.targetPercent === null ||
    theoryPlan.evaluation.overallPercentage >
      input.targetPercent + TARGET_EPSILON
      ? theoryPlan
      : findTheoryOnlyPlan(input, state, true);

  const basePlans =
    unconstrainedTheoryPlan === theoryPlan
      ? [theoryPlan]
      : [theoryPlan, unconstrainedTheoryPlan];

  const adjustmentPlans = basePlans
    .map((plan) => planPracticalVivaAdjustment(input, plan, state))
    .filter((plan): plan is BulkPassPlan => plan !== null);

  const bestAdjustmentPlan = adjustmentPlans.reduce<BulkPassPlan | null>(
    (best, plan) =>
      !best ||
      getAdjustmentPlanScore(plan, input.targetPercent) >
        getAdjustmentPlanScore(best, input.targetPercent)
        ? plan
        : best,
    null
  );

  const adjustmentPlan =
    bestAdjustmentPlan &&
    getAdjustmentPlanScore(bestAdjustmentPlan, input.targetPercent) >
      getAdjustmentPlanScore(theoryPlan, input.targetPercent)
      ? bestAdjustmentPlan
      : null;

  return {
    theoryPlan,
    adjustmentPlan,
    finalPlan: adjustmentPlan || theoryPlan,
  };
};
