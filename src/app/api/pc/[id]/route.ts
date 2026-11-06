// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';


export async function GET(
  req: Request,
  context: { params: { id: number } }
) {
  const id = Number(context.params.id);

  const pc = await prisma.pc.findFirst({
    where: {
      id: id
    }
  })

  return NextResponse.json(pc);
}

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {
  const id = Number(context.params.id);
  const {nosId, pcId, pcName, theoryMarks, practicalMarks, vivaMarks, projectMarks} = await req.json();
  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const pcExist = await prisma.pc.findUnique({
    where: {
      id: id,
      agency_id: agency_id,
      nos_id: nosId,
      pc_id: pcId
    }
  })

  if (pcExist) {

    const newTheoryMarks = Number(theoryMarks);
    const newPracticalMarks = Number(practicalMarks);
    const newVivaMarks = Number(vivaMarks);
    const newProjectMarks = Number(projectMarks);

    const result = await prisma.$transaction(async (tx) => {

      const updatedPC = await tx.pc.update({
        where:{
          id: id,
          agency_id: agency_id,
          nos_id: nosId,
          pc_id: pcId
        },
        data: {
          pc_name: pcName,
          theory_marks: newTheoryMarks,
          practical_marks: newPracticalMarks,
          viva_marks: newVivaMarks,
          project_marks: newProjectMarks,
          total_marks: (newTheoryMarks+newPracticalMarks+newVivaMarks+newProjectMarks),
        }
      });

      let updatedQuestions = 0;

      if (newTheoryMarks < Number(pcExist.theory_marks)) {
        updatedQuestions += await tx.$executeRaw`
          UPDATE questions q
          JOIN (
            SELECT x.question_id, SUM(p.theory_marks) AS new_sum
            FROM (
              SELECT DISTINCT pq.question_id, pq.pc_id
              FROM pc_questions pq
              WHERE pq.question_id IN (
                SELECT question_id FROM pc_questions WHERE pc_id = ${id}
              )
            ) x
            JOIN pc p ON p.id = x.pc_id
            GROUP BY x.question_id
          ) s ON s.question_id = q.id
          SET q.marks = FLOOR(s.new_sum), q.updated_at = NOW()
          WHERE q.question_type = 'theory' AND q.marks > s.new_sum
        `;
      }

      if (newPracticalMarks < Number(pcExist.practical_marks)) {
        updatedQuestions += await tx.$executeRaw`
          UPDATE questions q
          JOIN (
            SELECT x.question_id, SUM(p.practical_marks) AS new_sum
            FROM (
              SELECT DISTINCT pq.question_id, pq.pc_id
              FROM pc_questions pq
              WHERE pq.question_id IN (
                SELECT question_id FROM pc_questions WHERE pc_id = ${id}
              )
            ) x
            JOIN pc p ON p.id = x.pc_id
            GROUP BY x.question_id
          ) s ON s.question_id = q.id
          SET q.marks = FLOOR(s.new_sum), q.updated_at = NOW()
          WHERE q.question_type = 'practical' AND q.marks > s.new_sum
        `;
      }

      if (newVivaMarks < Number(pcExist.viva_marks)) {
        updatedQuestions += await tx.$executeRaw`
          UPDATE questions q
          JOIN (
            SELECT x.question_id, SUM(p.viva_marks) AS new_sum
            FROM (
              SELECT DISTINCT pq.question_id, pq.pc_id
              FROM pc_questions pq
              WHERE pq.question_id IN (
                SELECT question_id FROM pc_questions WHERE pc_id = ${id}
              )
            ) x
            JOIN pc p ON p.id = x.pc_id
            GROUP BY x.question_id
          ) s ON s.question_id = q.id
          SET q.marks = FLOOR(s.new_sum), q.updated_at = NOW()
          WHERE q.question_type = 'viva' AND q.marks > s.new_sum
        `;
      }

      return { updatedPC, updatedQuestions };
    });

    if(result.updatedPC){

      const message = result.updatedQuestions > 0
        ? `PC updated successfully! ${result.updatedQuestions} linked question(s) marks updated.`
        : 'PC updated successfully!';

      return NextResponse.json({ message, updatedQuestions: result.updatedQuestions });
    }else{

      return NextResponse.json({ message: 'PC not updated!' }, { status: 500 });
    }
  } else {

    return NextResponse.json({ message: 'PC not found' }, { status: 404 });
  }
}
