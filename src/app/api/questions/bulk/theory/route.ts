// Next Imports
import fs from 'node:fs/promises';

import path from 'node:path';

import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

const buildQuestionKey = (item: any) => JSON.stringify([
  String(item.question ?? item.Question ?? '').trim(),
  String(item.option1 ?? item.Option1 ?? '').trim(),
  String(item.option2 ?? item.Option2 ?? '').trim(),
  String(item.option3 ?? item.Option3 ?? '').trim(),
  String(item.option4 ?? item.Option4 ?? '').trim(),
  String(item.option5 ?? item.Option5 ?? '').trim(),
  Number(item.answer ?? item.Correct_Answer),
  Number(item.marks ?? item.Marks)
]);

const saveTempUpload = async ({ fileName, fileBase64, metadata }: any) => {

  if (!fileBase64) return null;

  const safeFileName = path.basename(String(fileName || 'bulk-questions.xlsx'));
  const uploadDir = path.join(process.cwd(), 'storage', 'temp_uploads');
  const storedFileName = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}-${safeFileName}`;

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, storedFileName), Buffer.from(fileBase64, 'base64'));
  await fs.appendFile(
    path.join(uploadDir, 'upload-log.jsonl'),
    `${JSON.stringify({ storedFileName, ...metadata, uploadedAt: new Date().toISOString() })}\n`
  );

  return storedFileName;
};

export async function POST(req: Request) {

  const {uploadData, sscID, qpID, fileName, fileBase64} = await req.json();

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agencyId = Number(session?.user?.agency_id);
  const createdByEmail = String(session?.user?.email || '');

  const validationErrors: string[] = [];

  const existingQuestions = await prisma.questions.findMany({
    where: {
      agency_id: agencyId,
      qp_id: Number(qpID),
      question_type: 'theory',
      question: {
        in: uploadData.map((item: any) => String(item.Question ?? '').trim())
      }
    },
    select: {
      question: true,
      option1: true,
      option2: true,
      option3: true,
      option4: true,
      option5: true,
      answer: true,
      marks: true
    }
  });

  const existingKeys = new Set(existingQuestions.map(buildQuestionKey));
  let skipped = 0;

  const newUploadData = uploadData.filter((item: any) => {

    if (existingKeys.has(buildQuestionKey(item))) {
      skipped += 1;

      return false;
    }

    return true;
  });

  const uploadItems = await Promise.all(newUploadData.map(async (item: any) => {

    const pcIds = item.PC_ID.toString().split(',').map((id: string) => id.trim());

    const pcs = await prisma.pc.findMany({
      where: {
        nos: {
          nos_id: item.NOS_ID
        },
        pc_id: {
          in: pcIds.map((pcId: string) => pcId.toString()), // Convert to numbers if needed
        },
      },
      select: {
        id: true,
        theory_marks: true
      }
    });

    const totalPcTheoryMarks = pcs.reduce((sum: number, pc: any) => sum + Number(pc.theory_marks || 0), 0);
    const providedMarks = Number(item.Marks);

    if (totalPcTheoryMarks < providedMarks) {
      validationErrors.push(
        `Question "${item.Question}" has Marks (${providedMarks}) greater than the total theory marks (${totalPcTheoryMarks}) of its linked PC(s) [${pcIds.join(', ')}]. Please provide correct marks.`
      );
    }

    return { item, pcs };
  }));

  if (validationErrors.length > 0) {
    return NextResponse.json({
      message: 'Validation failed!',
      errors: validationErrors
    }, { status: 400 });
  }

  const result = await Promise.all(uploadItems.map(async ({ item, pcs }) => {

    return await prisma.questions.create({
      data: {
        ssc_id: Number(sscID),
        qp_id: Number(qpID),
        language_id: 1,
        question_type: 'theory',
        question_level: item.Question_Level,
        question_explanation: item.Question_Explanation,
        question: item.Question,
        option1: item.Option1,
        option2: item.Option2,
        option3: item.Option3,
        option4: item.Option4,
        option5: item.Option5,
        answer: Number(item.Correct_Answer),
        marks: Number(item.Marks),
        agency_id: agencyId,
        created_by: createdBy,
        pc_questions:{
          create:pcs.map((pc: { id: number }) => ({

            agency_id:agencyId,

            created_by:createdBy,

            pc:{
              connect:{
                id:pc.id
              }
            }

          }))
        }

        // pc_questions: {
        //   connect: pcs.map(selectPc => ({ id: Number(selectPc.id) })),

        //   //connect: pcs.map(selectPc => ({ id: Number(selectPc.id) })),
        // }
      }
    });

  }));

  // const result = await prisma.questions.createMany({
  //   data: mappedData
  // })

  if(result){

    let storedFileName = null;

    try {

      storedFileName = await saveTempUpload({
        fileName,
        fileBase64,
        metadata: {
          originalFileName: fileName || '',
          agencyId,
          createdBy,
          createdByEmail,
          sscID,
          qpID,
          questionCount: uploadData.length,
          createdQuestionIds: result.map((question: any) => question.id),
          skipped
        }
      });
    } catch (error) {
      console.error('Failed to save temporary bulk upload file', error);
    }

    return NextResponse.json({message: 'Questions uploaded successfully!', skipped, storedFileName})
  }else{
    return NextResponse.json({message: 'Questions not uploaded!'}, {status: 500})
  }


}

// export async function POSTs(req: Request) {

//   const reqData = await req.json();

//   const {sscId, qpId, pcId, questionLevel, questionName, questionExplanation, option1, option2, option, correctAnswer, questionMarks} = reqData;
//   const session = await getServerSession(authOptions);
//   const createdBy = Number(session?.user.id);
//   const agency_id = Number(session?.user?.agency_id);

//   const filterOption = option.filter((opt: string) => {
//     return opt !== ''
//   });

//   // const pcExist = await prisma.questions.findUnique({
//   //   where: {
//   //     agency_id: agency_id,
//   //     id: pcId
//   //   }
//   // })


//   // if(pcExist){

//   //   return NextResponse.json({message: 'PC already exist.'}, {status: 409});
//   // }else{

//     const result = await prisma.questions.create({
//       data: {
//         agency_id: agency_id,
//         ssc_id: sscId,
//         qp_id: qpId,
//         language_id: 1,
//         question_type: 'theory',
//         question_level: questionLevel,
//         question_explanation: questionExplanation,
//         question: questionName,
//         option1: option1,
//         option2: option2,
//         option3: filterOption[0],
//         option4: filterOption[1],
//         option5: filterOption[2],
//         answer: Number(correctAnswer),
//         marks: Number(questionMarks),
//         created_by: createdBy,
//         pc: {
//           connect: {
//             id: Number(pcId)
//           }
//         }
//       }
//     });

//     if(result){
//       return NextResponse.json({message: 'Question created successfully!'})
//     }else{
//       return NextResponse.json({message: 'Not created Question!'}, {status: 500})
//     }

//   // }

// }
