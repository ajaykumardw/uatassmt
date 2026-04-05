import { getBatchCenterInspectionFilePath } from "@/configs/customDataConfig";

import prisma from "@/libs/prisma";

// import path from "path";

export type EvidenceFile = {

  fullPath: string

  zipPath: string

};

// const BASE_PATH = "storage/uploads/agency/batches";

export async function generateEvidenceZip(

  batchId: number,

  selectedFolders: string[]

): Promise<EvidenceFile[]> {

  const files: EvidenceFile[] = [];

  const tasks: Promise<void>[] = [];

  /* Candidate Photos */

  if (selectedFolders.includes("theory_exam") || selectedFolders.includes("practical_exam") || selectedFolders.includes("viva") || selectedFolders.includes("group")) {

    // tasks.push(

    //   collectCandidatePhotos(batchId, files)

    // );

  }



  /* Theory Evidence */

  // if (selectedFolders.includes("theory")) {

  //   tasks.push(

  //     collectTheoryFiles(batchId, files)

  //   );

  // }

  // /* Practical Evidence */

  // if (selectedFolders.includes("practical")) {

  //   tasks.push(

  //     collectPracticalFiles(batchId, files)

  //   );

  // }

  // /* Viva Evidence */

  // if (selectedFolders.includes("viva")) {

  //   tasks.push(

  //     collectVivaFiles(batchId, files)

  //   );

  // }

  // /* Group Photos */

  // if (selectedFolders.includes("group")) {

  //   tasks.push(

  //     collectGroupFiles(batchId, files)

  //   );

  // }

  /* Inspection */

  tasks.push(

    collectInspectionFiles(batchId, files)

  );

  await Promise.all(tasks);

  return files;

}

/* ========================= */
/* Collectors */
/* ========================= */

// async function collectCandidatePhotos(

//   batchId: number,

//   files: EvidenceFile[]

// ) {

//   const students =
//     await prisma.students.findMany({

//       where: {
//         batch_id: batchId
//       }

//     });

//   for (const student of students) {

//     const candidateFolder =
//       `Candidate Hold With Aadhaar Photo/${student.candidate_id}`;

//     if (student.image) {

//       files.push({

//         fullPath:
//           `${BASE_PATH}/${batchId}/candidates/${student.image}`,

//         zipPath:
//           `${candidateFolder}/${student.image}`

//       });

//     }

//     if (student.id_front_image) {

//       files.push({

//         fullPath:
//           `${BASE_PATH}/${batchId}/aadhar/${student.id_front_image}`,

//         zipPath:
//           `Candidate Aadhar front and Back/${student.candidate_id}/front_${student.id_front_image}`

//       });

//     }

//     if (student.id_back_image) {

//       files.push({

//         fullPath:
//           `${BASE_PATH}/${batchId}/aadhar/${student.id_back_image}`,

//         zipPath:
//           `Candidate Aadhar front and Back/${student.candidate_id}/back_${student.id_back_image}`

//       });

//     }

//   }

// }

/* Theory */

// async function collectTheoryFiles(

//   batchId: number,

//   files: EvidenceFile[]

// ) {

//   const images =
//     await prisma.student_captured_images.findMany({

//       where: {

//         student: {
//           batch_id: batchId
//         }

//       },

//       include: {
//         student: true
//       }

//     });

//   for (const img of images) {

//     files.push({

//       fullPath:
//         `${BASE_PATH}/${batchId}/theory/${img.captured_image}`,

//       zipPath:
//         `Theory Photo And video/${img.student.candidate_id}/${img.captured_image}`

//     });

//   }

// }

/* Practical */

// async function collectPracticalFiles(

//   batchId: number,

//   files: EvidenceFile[]

// ) {

//   const media =
//     await prisma.media_files.findMany({

//       where: {
//         batch_id: batchId,
//         candidate_id: {
//           not: null
//         }
//       },

//       include: {
//         candidate: true
//       }

//     });

//   for (const m of media) {

//     files.push({

//       fullPath:
//         `${BASE_PATH}/${batchId}/media/${m.filename}`,

//       zipPath:
//         `Practical Photo And Video/${m.candidate?.candidate_id}/${m.filename}`

//     });

//   }

// }

/* Viva */

// async function collectVivaFiles(

//   batchId: number,

//   files: EvidenceFile[]

// ) {

//   const media =
//     await prisma.media_files.findMany({

//       where: {
//         batch_id: batchId,
//         group_id: {
//           not: null
//         }
//       }

//     });

//   for (const m of media) {

//     files.push({

//       fullPath:
//         `${BASE_PATH}/${batchId}/media/${m.filename}`,

//       zipPath:
//         `Viva Photo And Video/${m.filename}`

//     });

//   }

// }

/* Group */

// async function collectGroupFiles(

//   batchId: number,

//   files: EvidenceFile[]

// ) {

//   const groups =
//     await prisma.student_groups.findMany({

//       where: {
//         batch_id: batchId
//       }

//     });

//   for (const g of groups) {

//     if (g.photo) {

//       files.push({

//         fullPath:
//           `${BASE_PATH}/${batchId}/groups/${g.photo}`,

//         zipPath:
//           `Group Photo/${g.photo}`

//       });

//     }

//     if (g.video) {

//       files.push({

//         fullPath:
//           `${BASE_PATH}/${batchId}/groups/${g.video}`,

//         zipPath:
//           `Group Photo/${g.video}`

//       });

//     }

//   }

// }

/* Inspection */

async function collectInspectionFiles(

  batchId: number,

  files: EvidenceFile[]

) {

  const inspection =
    await prisma.inspection_media.findMany({

      where: {
        batch_id: batchId
      },

      include: {
        category: true
      }

    });

  for (const file of inspection) {

    files.push({

      fullPath:
        getBatchCenterInspectionFilePath(batchId, file.file_name),

      zipPath:
        `${file.category.category_name}/${file.file_name}`

    });

  }

}
