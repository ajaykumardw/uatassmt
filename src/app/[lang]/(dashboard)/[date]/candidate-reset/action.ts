'use server'

import prisma from '@/libs/prisma'

export type ResetPreview = {
  student: {
    id: number
    candidate_id: string
    candidate_name: string
    attendance: number
    result: number
    certificate_no: string | null
    batch_name?: string
  }
  counts: {
    feedback_response_answers: number
    feedback_responses: number
    student_captured_images: number
    exam_set_results: number
    student_exam_set_results: number
    student_question_attempts: number
    offline_candidate_papers: number
    media_files: number
    log_sessions: number
  }
}

export async function getCandidateResetPreview(candidateId: string, password?: string) {
  const cleaned = candidateId.trim()

  if (!cleaned) {
    return { error: 'Please enter a candidate ID' }
  }

  if (!password) {
    return { error: 'Please enter your password' }
  }

  const student = await prisma.students.findUnique({
    where: { candidate_id: cleaned },
    include: {
      batch: { select: { batch_name: true } }
    }
  })

  if (!student) {
    return { error: `Candidate not found: ${cleaned}` }
  }

  const id = student.id

  // Count all related records so the user knows what will be deleted
  const [feedbackAnswers, feedbacks, captured, examResults, examSetResults, questionAttempts, offlinePapers, media, sessions] =
    await Promise.all([
      prisma.feedback_response_answers.count({
        where: { feedback_response: { user_id: id, user_type: 1 } }
      }),
      prisma.feedback_responses.count({ where: { user_id: id, user_type: 1 } }),
      prisma.student_captured_images.count({ where: { student_id: id } }),
      prisma.exam_set_results.count({ where: { student_id: id } }),
      prisma.student_exam_set_results.count({ where: { student_id: id } }),
      prisma.student_question_attempts.count({ where: { student_id: id } }),
      prisma.offline_candidate_papers.count({ where: { student_id: id } }),
      prisma.media_files.count({ where: { candidate_id: id } }),
      prisma.log_sessions.count({ where: { user_id: id, user_type: 'S' } })
    ])

  return {
    student: {
      id: student.id,
      candidate_id: student.candidate_id,
      candidate_name: student.candidate_name,
      attendance: student.attendance,
      result: student.result,
      certificate_no: student.certificate_no,
      batch_name: student.batch?.batch_name
    },
    counts: {
      feedback_response_answers: feedbackAnswers,
      feedback_responses: feedbacks,
      student_captured_images: captured,
      exam_set_results: examResults,
      student_exam_set_results: examSetResults,
      student_question_attempts: questionAttempts,
      offline_candidate_papers: offlinePapers,
      media_files: media,
      log_sessions: sessions
    }
  } as ResetPreview
}

export async function resetCandidate(candidateId: string, password?: string) {
  const cleaned = candidateId.trim()

  if (!cleaned) {
    return { error: 'Please enter a candidate ID' }
  }

  if (!password) {
    return { error: 'Please enter your password' }
  }

  const student = await prisma.students.findUnique({
    where: { candidate_id: cleaned }
  })

  if (!student) {
    return { error: `Candidate not found: ${cleaned}` }
  }

  const id = student.id

  const result = await prisma.$transaction(async (tx) => {
    // 1. Feedback answers (child of feedback responses)
    const feedbackAnswers = await tx.feedback_response_answers.deleteMany({
      where: { feedback_response: { user_id: id, user_type: 1 } }
    })

    // 2. Feedback responses (blocks exam re-attempt after feedback)
    const feedbacks = await tx.feedback_responses.deleteMany({
      where: { user_id: id, user_type: 1 }
    })

    // 3. Captured images (webcam evidence)
    const captured = await tx.student_captured_images.deleteMany({
      where: { student_id: id }
    })

    // 4. Per-question theory answers
    const examResults = await tx.exam_set_results.deleteMany({
      where: { student_id: id }
    })

    // 5. "Candidate attempted exam" marker (resets attempts)
    const examSetResults = await tx.student_exam_set_results.deleteMany({
      where: { student_id: id }
    })

    // 6. Practical/viva marks
    const questionAttempts = await tx.student_question_attempts.deleteMany({
      where: { student_id: id }
    })

    // 7. Offline OMR theory papers
    const offlinePapers = await tx.offline_candidate_papers.deleteMany({
      where: { student_id: id }
    })

    // 8. Individual media files (group media has candidate_id = NULL, safe)
    const media = await tx.media_files.deleteMany({
      where: { candidate_id: id }
    })

    // 9. Login sessions (all login history + facial auth)
    const sessions = await tx.log_sessions.deleteMany({
      where: { user_id: id, user_type: 'S' }
    })

    // 10. Reset students row status fields
    await tx.students.update({
      where: { id },
      data: {
        attendance: 0,
        result: 0,
        certificate_no: null,
        is_auto: 0,
        image: null,
        id_front_image: null,
        id_back_image: null
      }
    })

    return {
      deleted: {
        feedback_response_answers: feedbackAnswers.count,
        feedback_responses: feedbacks.count,
        student_captured_images: captured.count,
        exam_set_results: examResults.count,
        student_exam_set_results: examSetResults.count,
        student_question_attempts: questionAttempts.count,
        offline_candidate_papers: offlinePapers.count,
        media_files: media.count,
        log_sessions: sessions.count
      },
      student: {
        id: student.id,
        candidate_id: student.candidate_id,
        candidate_name: student.candidate_name
      }
    }
  })

  return result
}