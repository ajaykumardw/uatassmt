"use server";

import { compare } from "bcrypt";

import { getServerSession } from "next-auth";

import { STUDENT_RESULT } from "@/configs/customDataConfig";

import { authOptions } from "@/libs/auth";

import prisma from "@/libs/prisma";

import {
  evaluateResult,
  getEnabledOverallPercentage,
  getPercentage,
} from "@/libs/resultCriteria";

import {
  calculateNosPercentages,
  type ResultQuestion,
} from "@/libs/resultCriteriaNos";

export type BatchCandidate = {
  id: number;
  candidate_id: string;
  candidate_name: string;
  result: number;
  percentage: number;
  calculatedResult: number;
};

export type BatchCandidateResponse =
  | {
      ok: false;
      error: string;
    }
  | {
      ok: true;
      batch: {
        id: number;
        batch_name: string;
      };
      candidates: BatchCandidate[];
    };

export type BatchActionResult =
  | {
      ok: false;
      error: string;
    }
  | {
      ok: true;
      updated: number;
      passed: number;
      failed: number;
      pending: number;
    };

type BatchContext = {
  batch: {
    id: number;
    theory_exam_set_id: number | null;
    practical_exam_set_id: number | null;
    viva_exam_set_id: number | null;
    training_partner: {
      company_name: string | null;
      state: {
        state_code: string | null;
      } | null;
    } | null;
    qualification_pack: {
      total_theory_marks: unknown;
      total_practical_marks: unknown;
      total_viva_marks: unknown;
      theory_cutoff_marks: unknown;
      practical_cutoff_marks: unknown;
      viva_cutoff_marks: unknown;
      overall_cutoff_marks: unknown;
      nos_cutoff_marks: unknown;
    } | null;
  };
  students: Array<{
    id: number;
    candidate_id: string;
    candidate_name: string;
    result: number | null;
    certificate_no: string | null;
  }>;
  resultQuestions: ResultQuestion[];
  theoryCorrectMap: Map<number, Set<number>>;
  attemptsByStudent: Map<
    number,
    Array<{ questionId: number; obtainedMarks: number }>
  >;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

type SessionContextResult =
  | {
      error: string;
    }
  | {
      userId: number;
      agencyId: number;
    };

const getSessionContext = async (): Promise<SessionContextResult> => {
  const session = await getServerSession(authOptions);

  const authUser = session?.user;

  if (!authUser || authUser.user_type !== "AG" || !authUser.id) {
    return { error: "Unauthorized" };
  }

  return {
    userId: Number(authUser.id),
    agencyId: Number(authUser.agency_id),
  };
};

const verifyPassword = async (userId: number, password?: string) => {
  if (!password) {
    return "Please enter your password";
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user) {
    return "User not found";
  }

  const isValidPassword = user.password
    ? await compare(password, user.password)
    : false;

  if (!isValidPassword) {
    return "Invalid password";
  }

  return null;
};

type AuthorizedBatchResult =
  | {
      error: string;
    }
  | {
      batch: {
        id: number;
        batch_name: string | null;
        agency_id: number;
      };
    };

const getAuthorizedBatch = async (
  batchId: number,
  agencyId: number
): Promise<AuthorizedBatchResult> => {
  const batch = await prisma.batches.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      batch_name: true,
      agency_id: true,
    },
  });

  if (!batch) {
    return { error: "Batch not found" };
  }

  if (batch.agency_id !== agencyId) {
    return { error: "This batch does not belong to your agency" };
  }

  return { batch };
};

const buildBatchContext = async (
  batchId: number,
  studentIds?: number[]
): Promise<BatchContext | null> => {
  const batch = await prisma.batches.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      theory_exam_set_id: true,
      practical_exam_set_id: true,
      viva_exam_set_id: true,
      qualification_pack: {
        select: {
          total_theory_marks: true,
          total_practical_marks: true,
          total_viva_marks: true,
          theory_cutoff_marks: true,
          practical_cutoff_marks: true,
          viva_cutoff_marks: true,
          overall_cutoff_marks: true,
          nos_cutoff_marks: true,
        },
      },
      training_partner: {
        select: {
          company_name: true,
          state: {
            select: {
              state_code: true,
            },
          },
        },
      },
    },
  });

  if (!batch) return null;

  const students = await prisma.students.findMany({
    where: {
      batch_id: batchId,
      ...(studentIds ? { id: { in: studentIds } } : {}),
    },
    select: {
      id: true,
      candidate_id: true,
      candidate_name: true,
      result: true,
      certificate_no: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const examSetIds = [
    batch.theory_exam_set_id,
    batch.practical_exam_set_id,
    batch.viva_exam_set_id,
  ].filter((id): id is number => Boolean(id));

  const examSetQuestions = examSetIds.length
    ? await prisma.exam_sets_questions.findMany({
        where: { exam_set_id: { in: examSetIds } },
        select: {
          exam_set_id: true,
          question_id: true,
          marks: true,
          questions: {
            select: {
              question_type: true,
              pc_questions: {
                select: {
                  pc: {
                    select: {
                      id: true,
                      theory_marks: true,
                      practical_marks: true,
                      viva_marks: true,
                      nos: {
                        select: {
                          nos_id: true,
                          nos_name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
    : [];

  const examSetType = new Map<number, "theory" | "practical" | "viva">();

  if (batch.theory_exam_set_id) {
    examSetType.set(batch.theory_exam_set_id, "theory");
  }

  if (batch.practical_exam_set_id) {
    examSetType.set(batch.practical_exam_set_id, "practical");
  }

  if (batch.viva_exam_set_id) {
    examSetType.set(batch.viva_exam_set_id, "viva");
  }

  const resultQuestions: ResultQuestion[] = examSetQuestions.map((item) => ({
    id: item.question_id,
    type: examSetType.get(item.exam_set_id) || item.questions.question_type,
    marks: toNumber(item.marks),
    pcs: item.questions.pc_questions.map((pcQuestion) => ({
      pcId: pcQuestion.pc.id,
      nosCode: pcQuestion.pc.nos.nos_id,
      nosName: pcQuestion.pc.nos.nos_name,
      theoryMarks: toNumber(pcQuestion.pc.theory_marks),
      practicalMarks: toNumber(pcQuestion.pc.practical_marks),
      vivaMarks: toNumber(pcQuestion.pc.viva_marks),
    })),
  }));

  const validAttemptQuestionIds = resultQuestions
    .filter(
      (question) => question.type === "practical" || question.type === "viva"
    )
    .map((question) => question.id);

  const theoryCorrectMap = new Map<number, Set<number>>();

  if (batch.theory_exam_set_id && students.length) {
    const theoryResults = await prisma.exam_set_results.findMany({
      where: {
        exam_set_id: batch.theory_exam_set_id,
        student_id: { in: students.map((student) => student.id) },
      },
      select: {
        student_id: true,
        question_id: true,
        student_answer: true,
        correct_answer: true,
      },
    });

    for (const result of theoryResults) {
      if (result.student_answer !== result.correct_answer) continue;

      if (!theoryCorrectMap.has(result.student_id)) {
        theoryCorrectMap.set(result.student_id, new Set<number>());
      }

      theoryCorrectMap.get(result.student_id)?.add(result.question_id);
    }
  }

  const attemptsByStudent = new Map<
    number,
    Array<{ questionId: number; obtainedMarks: number }>
  >();

  if (validAttemptQuestionIds.length && students.length) {
    const attempts = await prisma.student_question_attempts.findMany({
      where: {
        student_id: { in: students.map((student) => student.id) },
        question_id: { in: validAttemptQuestionIds },
      },
      select: {
        student_id: true,
        question_id: true,
        obtained_marks: true,
      },
    });

    for (const attempt of attempts) {
      const studentAttempts = attemptsByStudent.get(attempt.student_id) || [];

      studentAttempts.push({
        questionId: attempt.question_id,
        obtainedMarks: toNumber(attempt.obtained_marks),
      });

      attemptsByStudent.set(attempt.student_id, studentAttempts);
    }
  }

  return {
    batch,
    students,
    resultQuestions,
    theoryCorrectMap,
    attemptsByStudent,
  };
};

const evaluateStudents = (context: BatchContext) => {
  const qp = context.batch.qualification_pack;

  if (!qp) {
    return new Map<
      number,
      { result: number; percentage: number; obtainedMarks: number }
    >();
  }

  const hasTheory = Boolean(context.batch.theory_exam_set_id);
  const hasPractical = Boolean(context.batch.practical_exam_set_id);
  const hasViva = Boolean(context.batch.viva_exam_set_id);

  const theoryMarksByStudent = new Map<number, number>();
  const practicalMarksByStudent = new Map<number, number>();
  const vivaMarksByStudent = new Map<number, number>();

  const theoryQuestionMarks = new Map<number, number>();

  for (const question of context.resultQuestions) {
    if (question.type === "theory") {
      theoryQuestionMarks.set(question.id, question.marks);
    }
  }

  const typeByQuestionId = new Map(
    context.resultQuestions.map((question) => [
      question.id,
      question.type,
    ])
  );

  for (const student of context.students) {
    const correctQuestionIds = context.theoryCorrectMap.get(student.id);

    if (correctQuestionIds) {
      for (const questionId of correctQuestionIds) {
        theoryMarksByStudent.set(
          student.id,
          (theoryMarksByStudent.get(student.id) || 0) +
            (theoryQuestionMarks.get(questionId) || 0)
        );
      }
    }

    const attempts = context.attemptsByStudent.get(student.id) || [];

    for (const attempt of attempts) {
      const type = typeByQuestionId.get(attempt.questionId);

      if (type === "practical") {
        practicalMarksByStudent.set(
          student.id,
          (practicalMarksByStudent.get(student.id) || 0) +
            attempt.obtainedMarks
        );
      } else if (type === "viva") {
        vivaMarksByStudent.set(
          student.id,
          (vivaMarksByStudent.get(student.id) || 0) + attempt.obtainedMarks
        );
      }
    }
  }

  const nosCutoff = toNumber(qp.nos_cutoff_marks);

  const evaluations = new Map<
    number,
    { result: number; percentage: number; obtainedMarks: number }
  >();

  for (const student of context.students) {
    const theory = theoryMarksByStudent.get(student.id) || 0;
    const practical = practicalMarksByStudent.get(student.id) || 0;
    const viva = vivaMarksByStudent.get(student.id) || 0;

    const theoryPercentage = getPercentage(
      theory,
      toNumber(qp.total_theory_marks)
    );

    const practicalPercentage = getPercentage(
      practical,
      toNumber(qp.total_practical_marks)
    );

    const vivaPercentage = getPercentage(
      viva,
      toNumber(qp.total_viva_marks)
    );

    const overallPercentage = getEnabledOverallPercentage(
      {
        theory,
        practical,
        viva,
      },
      {
        theory: toNumber(qp.total_theory_marks),
        practical: toNumber(qp.total_practical_marks),
        viva: toNumber(qp.total_viva_marks),
      },
      {
        theory: hasTheory,
        practical: hasPractical,
        viva: hasViva,
      }
    );

    const nosResults = calculateNosPercentages(context.resultQuestions, {
      theoryCorrectQuestionIds: context.theoryCorrectMap.get(student.id),
      attempts: context.attemptsByStudent.get(student.id) || [],
    }).map((nos) => ({
      ...nos,
      cutoff: nosCutoff,
    }));

    const evaluation = evaluateResult({
      theory: {
        applicable: hasTheory,
        percentage: theoryPercentage,
        cutoff: toNumber(qp.theory_cutoff_marks),
      },
      practical: {
        applicable: hasPractical,
        percentage: practicalPercentage,
        cutoff: toNumber(qp.practical_cutoff_marks),
      },
      viva: {
        applicable: hasViva,
        percentage: vivaPercentage,
        cutoff: toNumber(qp.viva_cutoff_marks),
      },
      overall: {
        applicable: true,
        percentage: overallPercentage,
        cutoff: toNumber(qp.overall_cutoff_marks),
      },
      nos: nosResults,
    });

    evaluations.set(student.id, {
      result: evaluation.pass
        ? STUDENT_RESULT.PASS
        : STUDENT_RESULT.FAIL,
      percentage: overallPercentage,
      obtainedMarks: theory + practical + viva,
    });
  }

  return evaluations;
};

const getTpShortName = (companyName: string | null) => {
  if (!companyName) return "";

  const match = companyName.match(/\(([^)]+)\)/);

  if (match) {
    return match[1];
  }

  return companyName
    .split(" ")
    .map((word) => word[0])
    .filter((char) => /[A-Za-z]/.test(char))
    .join("");
};

const createCertificateGenerator = (
  existingCertificates: Array<string | null>
) => {
  const usedRandoms = new Set<number>();

  for (const certificate of existingCertificates) {
    const lastPart = certificate?.split("|").pop();

    if (lastPart && /^\d{3}$/.test(lastPart)) {
      usedRandoms.add(Number(lastPart));
    }
  }

  return () => {
    let randomNumber = 0;

    do {
      randomNumber = Math.floor(100 + Math.random() * 900);
    } while (usedRandoms.has(randomNumber));

    usedRandoms.add(randomNumber);

    return String(randomNumber);
  };
};

const getCertificateNo = (
  currentCertificate: string | null,
  result: number,
  context: BatchContext,
  getRandom: () => string
) => {
  if (result !== STUDENT_RESULT.PASS) {
    return null;
  }

  if (currentCertificate) {
    return currentCertificate;
  }

  const tpShortName = getTpShortName(
    context.batch.training_partner?.company_name || null
  );

  const stateCode =
    context.batch.training_partner?.state?.state_code || "";

  return ["VISTA", tpShortName, stateCode, getRandom()]
    .filter(Boolean)
    .join("|");
};

export async function getBatchCandidates(
  batchName: string
): Promise<BatchCandidateResponse> {
  const sessionContext = await getSessionContext();

  if ("error" in sessionContext) {
    return { ok: false, error: sessionContext.error };
  }

  const cleanedBatchName = batchName.trim();

  if (!cleanedBatchName) {
    return { ok: false, error: "Please enter batch name" };
  }

  const batch = await prisma.batches.findUnique({
    where: { batch_name: cleanedBatchName },
    select: {
      id: true,
      batch_name: true,
      agency_id: true,
    },
  });

  if (!batch) {
    return { ok: false, error: `Batch not found: ${cleanedBatchName}` };
  }

  if (batch.agency_id !== sessionContext.agencyId) {
    return {
      ok: false,
      error: "This batch does not belong to your agency",
    };
  }

  const context = await buildBatchContext(batch.id);

  if (!context) {
    return { ok: false, error: "Batch not found" };
  }

  const evaluations = evaluateStudents(context);

  const candidates: BatchCandidate[] = context.students.map((student) => {
    const evaluation = evaluations.get(student.id);

    return {
      id: student.id,
      candidate_id: student.candidate_id,
      candidate_name: student.candidate_name,
      result: student.result ?? STUDENT_RESULT.PENDING,
      percentage: evaluation?.percentage ?? 0,
      calculatedResult:
        evaluation?.result ?? STUDENT_RESULT.PENDING,
    };
  });

  return {
    ok: true,
    batch: {
      id: batch.id,
      batch_name: batch.batch_name || cleanedBatchName,
    },
    candidates,
  };
}

export async function recalculateBatchCandidates(payload: {
  batchId: number;
  studentIds: number[];
  password: string;
}): Promise<BatchActionResult> {
  const sessionContext = await getSessionContext();

  if ("error" in sessionContext) {
    return { ok: false, error: sessionContext.error };
  }

  const passwordError = await verifyPassword(
    sessionContext.userId,
    payload.password
  );

  if (passwordError) {
    return { ok: false, error: passwordError };
  }

  const authorizedBatch = await getAuthorizedBatch(
    payload.batchId,
    sessionContext.agencyId
  );

  if ("error" in authorizedBatch) {
    return { ok: false, error: authorizedBatch.error };
  }

  if (!payload.studentIds.length) {
    return {
      ok: false,
      error: "Please select at least one candidate",
    };
  }

  const context = await buildBatchContext(
    payload.batchId,
    payload.studentIds
  );

  if (!context) {
    return { ok: false, error: "Batch not found" };
  }

  if (context.students.length !== payload.studentIds.length) {
    return {
      ok: false,
      error:
        "Some selected candidates do not belong to this batch. Please refresh and try again",
    };
  }

  const evaluations = evaluateStudents(context);

  const allCertificates = await prisma.students.findMany({
    where: { batch_id: payload.batchId },
    select: {
      certificate_no: true,
    },
  });

  const getRandom = createCertificateGenerator(
    allCertificates.map((student) => student.certificate_no)
  );

  let passed = 0;
  let failed = 0;

  const updates = context.students.map((student) => {
    const result =
      evaluations.get(student.id)?.result ?? STUDENT_RESULT.FAIL;

    if (result === STUDENT_RESULT.PASS) {
      passed += 1;
    } else {
      failed += 1;
    }

    return prisma.students.update({
      where: { id: student.id },
      data: {
        result,
        certificate_no: getCertificateNo(
          student.certificate_no,
          result,
          context,
          getRandom
        ),
      },
    });
  });

  await prisma.$transaction(updates);

  return {
    ok: true,
    updated: updates.length,
    passed,
    failed,
    pending: 0,
  };
}

export async function updateBatchCandidateResults(payload: {
  batchId: number;
  changes: Array<{
    studentId: number;
    result: number;
  }>;
  password: string;
}): Promise<BatchActionResult> {
  const sessionContext = await getSessionContext();

  if ("error" in sessionContext) {
    return { ok: false, error: sessionContext.error };
  }

  const passwordError = await verifyPassword(
    sessionContext.userId,
    payload.password
  );

  if (passwordError) {
    return { ok: false, error: passwordError };
  }

  const authorizedBatch = await getAuthorizedBatch(
    payload.batchId,
    sessionContext.agencyId
  );

  if ("error" in authorizedBatch) {
    return { ok: false, error: authorizedBatch.error };
  }

  if (!payload.changes.length) {
    return { ok: false, error: "No result changes found" };
  }

  const allowedResults = new Set<number>([
    STUDENT_RESULT.PENDING,
    STUDENT_RESULT.PASS,
    STUDENT_RESULT.FAIL,
  ]);

  if (
    payload.changes.some(
      (change) => !allowedResults.has(Number(change.result))
    )
  ) {
    return { ok: false, error: "Invalid result value" };
  }

  const studentIds = payload.changes.map((change) => change.studentId);

  const context = await buildBatchContext(payload.batchId, studentIds);

  if (!context) {
    return { ok: false, error: "Batch not found" };
  }

  if (context.students.length !== studentIds.length) {
    return {
      ok: false,
      error:
        "Some selected candidates do not belong to this batch. Please refresh and try again",
    };
  }

  const resultByStudentId = new Map(
    payload.changes.map((change) => [
      change.studentId,
      Number(change.result),
    ])
  );

  const allCertificates = await prisma.students.findMany({
    where: { batch_id: payload.batchId },
    select: {
      certificate_no: true,
    },
  });

  const getRandom = createCertificateGenerator(
    allCertificates.map((student) => student.certificate_no)
  );

  let passed = 0;
  let failed = 0;
  let pending = 0;

  const updates = context.students.map((student) => {
    const result =
      resultByStudentId.get(student.id) ?? STUDENT_RESULT.PENDING;

    if (result === STUDENT_RESULT.PASS) {
      passed += 1;
    } else if (result === STUDENT_RESULT.FAIL) {
      failed += 1;
    } else {
      pending += 1;
    }

    return prisma.students.update({
      where: { id: student.id },
      data: {
        result,
        certificate_no: getCertificateNo(
          student.certificate_no,
          result,
          context,
          getRandom
        ),
      },
    });
  });

  await prisma.$transaction(updates);

  return {
    ok: true,
    updated: updates.length,
    passed,
    failed,
    pending,
  };
}
