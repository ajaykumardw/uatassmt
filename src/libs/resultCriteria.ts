import {
  RESULT_CRITERIA,
  type ResultCriteria,
} from "@/configs/resultCriteria";

export const RESULT_COMPONENTS = ["theory", "practical", "viva"] as const;

export type ResultComponent = (typeof RESULT_COMPONENTS)[number];

export type ResultFailure = ResultComponent | "nos" | "overall";

export type ResultSection = {
  applicable: boolean;
  percentage: number;
  cutoff: number;
};

export type ResultNos = {
  percentage: number;
  cutoff: number;
};

export type ResultEvaluationInput = {
  theory?: ResultSection;
  practical?: ResultSection;
  viva?: ResultSection;
  overall?: ResultSection;
  nos?: ResultNos[];
};

export type ResultEvaluation = {
  pass: boolean;
  failedSections: ResultFailure[];
};

export const roundResultValue = (value: number) => Number(value.toFixed(2));

export const getPercentage = (obtained: number, total: number) => {
  if (!total) return 0;

  return roundResultValue((obtained / total) * 100);
};

export const getSectionStatus = (
  percentage: number,
  cutoff: number,
  enabled: boolean
) => {
  if (!enabled) return "N/A";

  return percentage >= cutoff ? "PASS" : "FAIL";
};

export const getEnabledTotal = (
  totals: Partial<Record<ResultComponent, number>>,
  hasSection: Partial<Record<ResultComponent, boolean>> = {},
  criteria: ResultCriteria = RESULT_CRITERIA
) => {
  return RESULT_COMPONENTS.reduce((sum, component) => {
    if (!criteria[component]) return sum;

    if (hasSection[component] === false) return sum;

    return sum + (Number(totals[component]) || 0);
  }, 0);
};

export const getEnabledObtained = (
  obtained: Partial<Record<ResultComponent, number>>,
  hasSection: Partial<Record<ResultComponent, boolean>> = {},
  criteria: ResultCriteria = RESULT_CRITERIA
) => {
  return RESULT_COMPONENTS.reduce((sum, component) => {
    if (!criteria[component]) return sum;

    if (hasSection[component] === false) return sum;

    return sum + (Number(obtained[component]) || 0);
  }, 0);
};

export const getEnabledOverallPercentage = (
  obtained: Partial<Record<ResultComponent, number>>,
  totals: Partial<Record<ResultComponent, number>>,
  hasSection: Partial<Record<ResultComponent, boolean>> = {},
  criteria: ResultCriteria = RESULT_CRITERIA
) => {
  const enabledObtained = getEnabledObtained(obtained, hasSection, criteria);

  const enabledTotal = getEnabledTotal(totals, hasSection, criteria);

  return getPercentage(enabledObtained, enabledTotal);
};

export const evaluateResult = (
  input: ResultEvaluationInput,
  criteria: ResultCriteria = RESULT_CRITERIA
): ResultEvaluation => {
  const failedSections: ResultFailure[] = [];

  const isSectionPass = (
    component: ResultComponent,
    section?: ResultSection
  ) => {
    if (!criteria[component]) return true;

    if (!section?.applicable) return true;

    return section.percentage >= section.cutoff;
  };

  if (!isSectionPass("theory", input.theory)) failedSections.push("theory");

  if (!isSectionPass("practical", input.practical)) {
    failedSections.push("practical");
  }

  if (!isSectionPass("viva", input.viva)) failedSections.push("viva");

  if (criteria.nos && input.nos?.some((nos) => nos.percentage < nos.cutoff)) {
    failedSections.push("nos");
  }

  if (
    criteria.overall &&
    input.overall?.applicable &&
    input.overall.percentage < input.overall.cutoff
  ) {
    failedSections.push("overall");
  }

  return {
    pass: failedSections.length === 0,
    failedSections,
  };
};
