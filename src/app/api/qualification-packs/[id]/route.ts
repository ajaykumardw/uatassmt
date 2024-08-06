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

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const id = Number(context.params.id);

  const qualificationPack = await prisma.qualification_packs.findFirst({
    where: {
      id: id,
      agency_id: agency_id
    },
    include: {
      nos: true
    }
  })

  return NextResponse.json(qualificationPack);
}

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {
  const id = Number(context.params.id);

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const {sscId, qualificationPackName, nQRCode, nSQFLevel, version, totalTheoryMarks, totalVivaMarks, totalPracticalMarks, totalMarks, isTheoryCutoff, isVivaCutoff, isPracticalCutoff, isOverallCutoff, isNOSCutoff, isWeightedAvailable, theoryCutoffMarks, vivaCutoffMarks, practicalCutoffMarks, overallCutoffMarks, nosCutoffMarks, weightedAvailable} = await req.json();

  const theoryCutoff = isTheoryCutoff === true ? theoryCutoffMarks : '';
  const vivaCutoff = isVivaCutoff === true ? vivaCutoffMarks : '';
  const practicalCutoff = isPracticalCutoff === true ? practicalCutoffMarks : '';
  const overallCutoff = isOverallCutoff === true ? overallCutoffMarks : '';
  const nosCutoff = isNOSCutoff === true ? nosCutoffMarks : '';
  const weighted = isWeightedAvailable === true ? weightedAvailable : '';

  const qualificationPackExist = await prisma.qualification_packs.findUnique({
    where: {
      id: id,
      agency_id: agency_id
    }
  })

  if (qualificationPackExist) {

    const result = await prisma.qualification_packs.update({
      where:{
        id: id,
        agency_id: agency_id
      },
      data: {
        ssc_id: Number(sscId),
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
        weighted_available: Number(weighted)
      }
    });

    if(result){

      return NextResponse.json({ message: 'Qualification pack updated successfully!' });
    }else{

      return NextResponse.json({ message: 'Qualification pack not updated!' }, { status: 500 });
    }
  } else {

    return NextResponse.json({ message: 'Qualification pack not found' }, { status: 404 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: { id: number } }
) {
  const id = Number(context.params.id);

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const { selectedNos } = await req.json();

  // Fetch the existing qualification pack
  const qualificationPackExist = await prisma.qualification_packs.findUnique({
    where: {
      id: id,
      agency_id: agency_id
    },
    include: {
      nos: true // Include related NOS to check existing connections
    }
  });

  if (qualificationPackExist) {
    // Filter selectedNos to exclude ones already connected
    const newNosToConnect = selectedNos.filter((nosId: any) => {
      return !qualificationPackExist.nos.some(existingNos => existingNos.id === nosId);
    });

    // Find nos to disconnect (those present in DB but not in selectedNos)
    const nosToDisconnect = qualificationPackExist.nos.filter(existingNos => {
      return !selectedNos.includes(existingNos.id);
    });

    // Update the qualification pack with new connections and disconnects
    const result = await prisma.qualification_packs.update({
      where: {
        id: id,
        agency_id: agency_id
      },
      data: {
        nos: {
          connect: newNosToConnect.map((nosId: any) => ({ id: nosId })),
          disconnect: nosToDisconnect.map(nos => ({ id: nos.id }))
        }
      }
    });

    if (result) {
      return NextResponse.json({ message: 'NOS updated successfully' });
    } else {
      return NextResponse.json({ message: 'Failed to update NOS' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ message: 'Qualification pack not found' }, { status: 404 });
  }
}

