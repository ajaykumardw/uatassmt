import { getBatchCenterInspectionFilePath, getBatchGroupMediaFilePath, getBatchIndividualCandidateMediaFilePath, getBatchIndividualCandidateTheoryCapturedFilePath } from "@/configs/customDataConfig";

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

  // if (selectedFolders.includes("theory_exam") || selectedFolders.includes("practical_exam") || selectedFolders.includes("viva") || selectedFolders.includes("group")) {

  //   // tasks.push(

  //   //   collectCandidatePhotos(batchId, files)

  //   // );

  // }

  if (selectedFolders.includes("theory_exam")) {

    tasks.push(

      // collectTheoryFiles(batchId, files)
      collectTheoryFiles(batchId, files)

    );

    tasks.push(
      collectCandidateCapturedDuringTheoryExam(batchId, files)
    );

  }

  if (selectedFolders.includes("practical_exam")) {

    tasks.push(

      collectPracticalFiles(batchId, files)

    );

  }

  if (selectedFolders.includes("viva")) {

    tasks.push(

      collectVivaFiles(batchId, files)

    );

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

    // collectInspectionFiles(batchId, files)
    collectInspectionFiles(batchId, files, selectedFolders)

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

  files: EvidenceFile[],

  selectedFolders: string[]

) {

  const inspection =
    await prisma.inspection_media.findMany({

      where: {
        batch_id: batchId,
        category: {
          category_name: {
            in: selectedFolders
          }
        }
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

async function collectTheoryFiles(
  batchId: number,
  files: EvidenceFile[],
) {
  const allMedia = await prisma.media_files.findMany({
    where: {

      // type: "theory",

      OR: [
        { candidate: { batch_id: batchId } },
        { group: { batch_id: batchId, group_type: "theory" } }
      ]
    },
    select: {
      id: true,
      batch_id: true,
      candidate_id: true,
      group_id: true,
      type: true,
      filename: true,
      candidate: {
        select: {
          candidate_id: true
        }
      },
      group: {
        select: {
          group_id: true,
          group_type: true
        }
      },
    }
  });

  const mappedFiles = allMedia.map(media => {
    if (media.candidate_id) {
      return {
        fullPath: getBatchIndividualCandidateMediaFilePath(
          batchId,
          media.candidate_id,
          media.type,
          media.filename
        ),
        zipPath: `theory/candidates/${media.candidate?.candidate_id}/${media.type}s/${media.filename}`
      };
    } else if (media.group_id && media.group?.group_type === "theory") {
      return {
        fullPath: getBatchGroupMediaFilePath(
          batchId,
          media.group?.group_type,
          media.group_id,
          media.type,
          media.filename
        ),
        zipPath: `theory/groups/${media.group?.group_id}/${media.type}s/${media.filename}`
      };
    } else {
      return null;
    }
  }).filter(Boolean) as EvidenceFile[];

  files.push(...mappedFiles);
}

// batch123/theory/candidates/candidate123/photos/photo1.jpg  // candidate self online
// batch123/theory/candidates/candidate123/videos/video1.mp4  // candidate self online
// batch123/theory/groups/group_a/photos/photo1.jpg
// batch123/theory/groups/group_a/videos/video1.mp4

// batch123/practical/candidates/candidate123/photos/photo1.jpg  // assessor // not confirmed
// batch123/practical/candidates/candidate123/videos/video1.mp4  // assessor // not confirmed
// batch123/practical/groups/group_a/photos/photo1.jpg
// batch123/practical/groups/group_a/videos/video1.mp4

// batch123/viva/candidates/candidate123/photos/photo1.jpg  // assessor
// batch123/viva/candidates/candidate123/videos/video1.mp4  // assessor
// batch123/viva/groups/group_a/photos/photo1.jpg
// batch123/viva/groups/group_a/videos/video1.mp4


async function collectCandidateCapturedDuringTheoryExam(

  batchId: number,
  files: EvidenceFile[],

) {

  const students = await prisma.students.findMany({
    where: {
      batch_id: batchId
    },
    select: {
      id: true,
      candidate_id: true,
      captured_files: {
        select: {
          captured_image: true,
          file_type: true,
        }
      }
    }
  })

  for (const student of students) {

    const capturedFiles = student.captured_files;

    for (const img of capturedFiles) {

      files.push({

        fullPath:
          getBatchIndividualCandidateTheoryCapturedFilePath(
            batchId,
            student.id,
            img.captured_image
          ),

        zipPath:
          `theory/candidates/${student.candidate_id}/${img.file_type}s/${img.captured_image}`

      });
    }

  }
}

async function collectPracticalFiles(
  batchId: number,
  files: EvidenceFile[],
) {
  const allMedia = await prisma.media_files.findMany({
    where: {

      // type: "practical",

      OR: [
        { candidate: { batch_id: batchId } },
        { group: { batch_id: batchId, group_type: "practical" } }
      ]
    },
    select: {
      id: true,
      batch_id: true,
      candidate_id: true,
      group_id: true,
      type: true,
      filename: true,
      candidate: {
        select: {
          candidate_id: true
        }
      },
      group: {
        select: {
          group_id: true,
          group_type: true
        }
      },
    }
  });

  const mappedFiles = allMedia.map(media => {
    if (media.candidate_id) {
      return {
        fullPath: getBatchIndividualCandidateMediaFilePath(
          batchId,
          media.candidate_id,
          media.type,
          media.filename
        ),
        zipPath: `practical/candidates/${media.candidate?.candidate_id}/${media.type}s/${media.filename}`
      };
    } else if (media.group_id && media.group?.group_type === "practical") {
      return {
        fullPath: getBatchGroupMediaFilePath(
          batchId,
          media.group?.group_type,
          media.group_id,
          media.type,
          media.filename
        ),
        zipPath: `practical/groups/${media.group?.group_id}/${media.type}s/${media.filename}`
      };
    } else {
      return null;
    }
  }).filter(Boolean) as EvidenceFile[];

  files.push(...mappedFiles);
}

async function collectVivaFiles(
  batchId: number,
  files: EvidenceFile[],
) {
  const allMedia = await prisma.media_files.findMany({
    where: {

      // type: "viva",

      OR: [
        { candidate: { batch_id: batchId } },
        { group: { batch_id: batchId, group_type: "viva" } }
      ]
    },
    select: {
      id: true,
      batch_id: true,
      candidate_id: true,
      group_id: true,
      type: true,
      filename: true,
      candidate: {
        select: {
          candidate_id: true
        }
      },
      group: {
        select: {
          group_id: true,
          group_type: true
        }
      },
    }
  });

  const mappedFiles = allMedia.map(media => {
    if (media.candidate_id) {
      return {
        fullPath: getBatchIndividualCandidateMediaFilePath(
          batchId,
          media.candidate_id,
          media.type,
          media.filename
        ),
        zipPath: `viva/candidates/${media.candidate?.candidate_id}/${media.type}s/${media.filename}`
      };
    } else if (media.group_id && media.group?.group_type === "viva") {
      return {
        fullPath: getBatchGroupMediaFilePath(
          batchId,
          media.group?.group_type,
          media.group_id,
          media.type,
          media.filename
        ),
        zipPath: `viva/groups/${media.group?.group_id}/${media.type}s/${media.filename}`
      };
    } else {
      return null;
    }
  }).filter(Boolean) as EvidenceFile[];

  files.push(...mappedFiles);
}
