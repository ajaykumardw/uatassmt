import {
  RESULT_CRITERIA,
  type ResultCriteria,
} from "@/configs/resultCriteria";

import {
  getPercentage,
  roundResultValue,
  type ResultComponent,
} from "@/libs/resultCriteria";

type ResultPcLink = {
  pcId: number;
  nosCode: string;
  nosName?: string;
  theoryMarks: number;
  practicalMarks: number;
  vivaMarks: number;
};

export type ResultQuestion = {
  id: number;
  type: string;
  marks: number;
  pcs: ResultPcLink[];
};

export type ResultStudentMarks = {
  theoryCorrectQuestionIds?: Set<number>;
  attempts?: Array<{
    questionId: number;
    obtainedMarks: number;
  }>;
};

export type ResultNosPercentage = {
  nosCode: string;
  nosName?: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
};

type ComponentMarks = Record<ResultComponent, number>;

const COMPONENT_MARK_FIELD: Record<
  ResultComponent,
  "theoryMarks" | "practicalMarks" | "vivaMarks"
> = {
  theory: "theoryMarks",
  practical: "practicalMarks",
  viva: "vivaMarks",
};

const getQuestionComponent = (
  question: ResultQuestion
): ResultComponent | null => {
  if (question.type === "theory") return "theory";

  if (question.type === "practical") return "practical";

  if (question.type === "viva") return "viva";

  return null;
};

const getComponentMarks = (): ComponentMarks => ({
  theory: 0,
  practical: 0,
  viva: 0,
});

const getMarksEntry = (
  store: Map<string, ComponentMarks>,
  nosCode: string
) => {
  if (!store.has(nosCode)) {
    store.set(nosCode, getComponentMarks());
  }

  return store.get(nosCode) as ComponentMarks;
};

const distributeMarks = (
  question: ResultQuestion,
  obtainedMarks: number,
  component: ResultComponent,
  obtainedStore: Map<string, ComponentMarks>,
  pcObtainedStore: Map<number, number>
) => {
  const markField = COMPONENT_MARK_FIELD[component];

  const totalPcMarks = question.pcs.reduce((sum, pc) => {
    return sum + (Number(pc[markField]) || 0);
  }, 0);

  if (totalPcMarks === 0 || obtainedMarks <= 0) return;

  let assignedTotal = 0;

  question.pcs.forEach((pc, index) => {
    const pcMax = Number(pc[markField]) || 0;

    const earnedMark =
      index === question.pcs.length - 1
        ? roundResultValue(obtainedMarks - assignedTotal)
        : roundResultValue((pcMax / totalPcMarks) * obtainedMarks);

    if (index !== question.pcs.length - 1) {
      assignedTotal = roundResultValue(assignedTotal + earnedMark);
    }

    const nosEntry = getMarksEntry(obtainedStore, pc.nosCode);

    nosEntry[component] = roundResultValue(nosEntry[component] + earnedMark);

    if (component === "theory") {
      const currentPcMarks = pcObtainedStore.get(pc.pcId) || 0;

      const nextPcMarks = roundResultValue(currentPcMarks + earnedMark);

      const theoryMax = Number(pc.theoryMarks) || 0;

      if (nextPcMarks > theoryMax) {
        const excess = roundResultValue(nextPcMarks - theoryMax);

        pcObtainedStore.set(pc.pcId, theoryMax);

        nosEntry[component] = Math.max(
          0,
          roundResultValue(nosEntry[component] - excess)
        );
      } else {
        pcObtainedStore.set(pc.pcId, nextPcMarks);
      }
    }
  });
};

export const calculateNosPercentages = (
  questions: ResultQuestion[],
  student: ResultStudentMarks,
  criteria: ResultCriteria = RESULT_CRITERIA
): ResultNosPercentage[] => {
  const questionsByComponent: Record<ResultComponent, ResultQuestion[]> = {
    theory: [],
    practical: [],
    viva: [],
  };

  for (const question of questions) {
    const component = getQuestionComponent(question);

    if (component) {
      questionsByComponent[component].push(question);
    }
  }

  const nosTotals = new Map<string, ComponentMarks>();

  const nosObtained = new Map<string, ComponentMarks>();

  const nosNames = new Map<string, string>();

  for (const question of questions) {
    for (const pc of question.pcs) {
      if (pc.nosName) {
        nosNames.set(pc.nosCode, pc.nosName);
      }
    }
  }

  const seenPcByComponent: Record<ResultComponent, Set<number>> = {
    theory: new Set<number>(),
    practical: new Set<number>(),
    viva: new Set<number>(),
  };

  for (const component of Object.keys(questionsByComponent) as ResultComponent[]) {
    if (!criteria[component]) continue;

    const markField = COMPONENT_MARK_FIELD[component];

    for (const question of questionsByComponent[component]) {
      for (const pc of question.pcs) {
        if (seenPcByComponent[component].has(pc.pcId)) continue;

        seenPcByComponent[component].add(pc.pcId);

        const nosEntry = getMarksEntry(nosTotals, pc.nosCode);

        nosEntry[component] = roundResultValue(
          nosEntry[component] + (Number(pc[markField]) || 0)
        );
      }
    }
  }

  const theoryCorrectQuestionIds =
    student.theoryCorrectQuestionIds || new Set<number>();

  const pcTheoryObtained = new Map<number, number>();

  if (criteria.theory) {
    for (const question of questionsByComponent.theory) {
      if (!theoryCorrectQuestionIds.has(question.id)) continue;

      distributeMarks(
        question,
        Number(question.marks) || 0,
        "theory",
        nosObtained,
        pcTheoryObtained
      );
    }
  }

  for (const attempt of student.attempts || []) {
    const question = questionsByComponent.practical.find(
      (item) => item.id === attempt.questionId
    );

    if (question && criteria.practical) {
      distributeMarks(
        question,
        Number(attempt.obtainedMarks) || 0,
        "practical",
        nosObtained,
        pcTheoryObtained
      );

      continue;
    }

    const vivaQuestion = questionsByComponent.viva.find(
      (item) => item.id === attempt.questionId
    );

    if (vivaQuestion && criteria.viva) {
      distributeMarks(
        vivaQuestion,
        Number(attempt.obtainedMarks) || 0,
        "viva",
        nosObtained,
        pcTheoryObtained
      );
    }
  }

  const nosCodes = new Set<string>([
    ...Array.from(nosTotals.keys()),
    ...Array.from(nosObtained.keys()),
  ]);

  const results: ResultNosPercentage[] = [];

  for (const nosCode of Array.from(nosCodes)) {
    const totals = nosTotals.get(nosCode);

    if (!totals) continue;

    const totalMarks =
      (criteria.theory ? totals.theory : 0) +
      (criteria.practical ? totals.practical : 0) +
      (criteria.viva ? totals.viva : 0);

    if (totalMarks <= 0) continue;

    const obtained = nosObtained.get(nosCode) || getComponentMarks();

    const obtainedMarks =
      (criteria.theory ? obtained.theory : 0) +
      (criteria.practical ? obtained.practical : 0) +
      (criteria.viva ? obtained.viva : 0);

    results.push({
      nosCode,
      nosName: nosNames.get(nosCode),
      totalMarks,
      obtainedMarks: roundResultValue(obtainedMarks),
      percentage: getPercentage(obtainedMarks, totalMarks),
    });
  }

  return results;
};
