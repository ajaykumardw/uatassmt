// Next Imports
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET() {

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const qualificationPacks = await prisma.qualification_packs.findMany({
    where: {
      agency_id: agency_id
    },
    include: {
      ssc: true,
      nos: true
    }
  });

  // console.log(qualificationPacks);

  return NextResponse.json(qualificationPacks);
}

export async function POST(req: Request) {

  const data = await req.json();
  const {sscId, qualificationPackId, qualificationPackName, nQRCode, nSQFLevel, version, totalTheoryMarks, totalVivaMarks, totalPracticalMarks, totalMarks, isTheoryCutoff, isVivaCutoff, isPracticalCutoff, isOverallCutoff, isNOSCutoff, isWeightedAvailable, theoryCutoffMarks, vivaCutoffMarks, practicalCutoffMarks, overallCutoffMarks, nosCutoffMarks, weightedAvailable} = data;

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id)
  const createdBy = Number(session?.user.id);

  const theoryCutoff = isTheoryCutoff === true ? theoryCutoffMarks : '';
  const vivaCutoff = isVivaCutoff === true ? vivaCutoffMarks : '';
  const practicalCutoff = isPracticalCutoff === true ? practicalCutoffMarks : '';
  const overallCutoff = isOverallCutoff === true ? overallCutoffMarks : '';
  const nosCutoff = isNOSCutoff === true ? nosCutoffMarks : '';
  const weighted = isWeightedAvailable === true ? weightedAvailable : '';

  const result = await prisma.qualification_packs.create({
    data: {
      agency_id: agency_id,
      ssc_id: Number(sscId),
      qualification_pack_id: qualificationPackId,
      qualification_pack_name: qualificationPackName,
      nqr_code: nQRCode,
      nsqf_level: Number(nSQFLevel),
      version_id: Number(version),
      total_marks: Number(totalMarks),
      total_theory_marks: Number(totalTheoryMarks),
      total_practical_marks: Number(totalPracticalMarks),
      total_viva_marks: Number(totalVivaMarks),
      theory_cutoff_marks: Number(theoryCutoff),
      viva_cutoff_marks: Number(vivaCutoff),
      practical_cutoff_marks: Number(practicalCutoff),
      overall_cutoff_marks: Number(overallCutoff),
      nos_cutoff_marks: Number(nosCutoff),
      weighted_available: Number(weighted),
      created_by: createdBy
    }
  });

  if(result){
    return NextResponse.json({message: 'Qualification Pack created successfully!'})
  }else{
    return NextResponse.json({message: 'Not created qualification pack!'})
  }

}
