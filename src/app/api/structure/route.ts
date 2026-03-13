import fs from 'fs';
import path from 'path';

// Next Imports
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

// Data Imports
import { getServerSession } from 'next-auth';

import { hash } from 'bcrypt';

import { getTime } from 'date-fns';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET(){

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const agency_id = Number(session?.user?.agency_id)

  const structure = await prisma.sector_skill_councils.findMany({
    where: {
      agency_id: agency_id
    },
    select:{
      id:true,
      ssc_name:true,
      ssc_code:true,

      qualification_packs:{
        select:{
          id:true,
          qualification_pack_name:true,

          nos:{
            select:{
              id:true,
              nos_id:true,
              nos_name:true,

              pc:{
                select:{
                  id:true,
                  pc_id:true,
                  pc_name:true,
                  theory_marks:true,
                  practical_marks:true,
                  viva_marks:true,
                },

                orderBy:{
                  pc_id:'asc'
                }
              }
            },

            orderBy:{
              nos_id:'asc'
            }
          }
        }
      }
    },

    orderBy:{
      ssc_name:'asc'
    }

  });

  structure.forEach(ssc => {
    ssc.qualification_packs.forEach(qp => {
      qp.nos.forEach(nos => {
        nos.pc.sort((a, b) => {
          const numA = parseInt(a.pc_id.replace(/^\D+/g, ''), 10);
          const numB = parseInt(b.pc_id.replace(/^\D+/g, ''), 10);

          return numA - numB;
        });
      })
    })
  });

  return NextResponse.json(structure);

}
