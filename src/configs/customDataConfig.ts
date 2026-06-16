export const NSQFLevelLength: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
];

export const ModeOfAssessment = [
  { id: '1', label: 'Digital Online' },
  { id: '2', label: 'Digital Offline' },
  { id: '3', label: 'Paper Pen' }
]

export const ExpectedStudentExcelHeaders = [
  'Batch ID',
  'Candidate ID',
  'Password',
  'Candidate Name',
  'Gender(M/F/T)',
  'Category(Gen/SC/ST/BC/OBC/OC)',
  'DOB',
  "Father's name",
  "Mother's name",
  'Address',
  'City',
  'State',
  'Mobile No',
  "Aadhaar No"
];

export const ExpectedStudentExcelHeadersWithoutBatchId = [
  'Candidate ID',
  'Password',
  'Candidate Name',
  'Gender(M/F/T)',
  'Category(Gen/SC/ST/BC/OBC/OC)',
  'DOB',
  "Father's name",
  "Mother's name",
  'Address',
  'City',
  'State',
  'Mobile No',
  "Aadhaar No"
];

export const ExpectedTheoryQuestionExcelHeaders = [
  'Question',
  'Option1',
  'Option2',
  'Option3',
  'Option4',
  'Option5',
  'Correct_Answer',
  'Question_Level(E/M/H)',
  'Question_Explanation',
  'Marks',
  'NOS_ID',
  'PC_ID',
];

export const ExpectedNOSExcelHeaders = [
  'QP_ID',
  'NOS_ID',
  'NOS_Name',
  'PC_ID',
  'PC_Name',
  'Theory_Marks',
  'Practical_Marks',
  'Viva_Marks',
];

// export const ExpectedNOSExcelHeaders = [
//   'QP Code',
//   'NOS Code',
//   'NOS Name',
//   'Elements and Performance Criteria',
//   'Assessment Criteria for Outcomes',
//   'Theory Marks',
//   'Practical Marks',
//   'Viva Marks',
// ];

export const GenderMap = {
  m: "Male",
  f: "Female",
  t: "Transgender"
}

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8

export const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP
    }
  }
}

export const TableRowLimit = {
  pageSize: 20,
  rowLimit: [20, 50, 100]
}

export const ExamDurations : { [key: number]: string } = {
  30: "30 Minutes",
  40: "40 Minutes",
  50: "50 Minutes",
  60: "60 Minutes"
}

export const FeedbackFormTypes : { [key: number]: string } = {
  1: "Candidate",
  2: "Assessor",
  3: "Training Partner",
}

export const QuestionTypes : { [key: number]: string } = {
  1: "Yes/No",
  2: "MCQ",
  3: "Text",
  4: "Signature",
}

type UserRoleType = {
  [key: string]: { icon: string; color: string }
}

export const userRoleObj: UserRoleType = {
  1: { icon: 'tabler-school', color: 'info' },
  2: { icon: 'tabler-heart-handshake', color: 'warning' },
  3: { icon: 'tabler-heart-rate-monitor', color: 'success' },
  4: { icon: 'tabler-calculator', color: 'error' },
}

export const routes = {
  SA: [
    '/super-admin',
    '/agency/list',
    `/agency/*`,
    '/agency/create'
  ]
}

export const storageFolders = {
  storage: "storage",
  uploads: "uploads",
  ssc: "ssc",
  agency: "agency",
  users: "users",
  student: "student",
  captured: "captured",
  batches: "batches",
  centerPhoto: "center-photo",
  buildingPhoto: "building-photo",
  trainingResources: "training-resources",
  centerInspection: "center-inspection",
  images: "images",
  tpSpocSignature: "tp-spoc-signature",
  assessorSignature: "assessor-signature",
}


const storagePath = `${process.env.NEXT_PUBLIC_APP_URL}/${storageFolders.storage}/${storageFolders.uploads}`;
const sscPath = `${storagePath}/${storageFolders.ssc}`;
const agencyPath = `${storagePath}/${storageFolders.agency}`;
const trainingResourcesPath = `${agencyPath}/${storageFolders.trainingResources}`;

// const batchesPath = `${agencyPath}/${storageFolders.batches}`;

export const sscImagePath = (userId: number, sscImage: string) => {
  return sscImage ? `${sscPath}/${userId}/${sscImage}` : "";
}

export const getSSCImagePath = (userId: number, sscImage: string) => {
  return sscImage ? `${storageFolders.storage}/${storageFolders.uploads}/${storageFolders.ssc}/${userId}/${sscImage}` : "";
}

export const agencyImagePath = (userId: number, agencyImage: string) => {
  return agencyImage ? `${agencyPath}/${userId}/${agencyImage}` : "";
}

export const getAgencyImagePath = (userId: number, agencyImage: string) => {
  return agencyImage ? `${storageFolders.storage}/${storageFolders.uploads}/${storageFolders.agency}/${userId}/${agencyImage}` : "";
}

export const agencyUsersFilePath = (userId: number, fileName: string) => {
  return fileName ? `${agencyPath}/${storageFolders.users}/${userId}/${fileName}` : "";
}

export const getAgencyUsersFilePath = (userId: number, fileName: string) => {
  return fileName ? `${storageFolders.storage}/${storageFolders.uploads}/${storageFolders.agency}/${storageFolders.users}/${userId}/${fileName}` : "";
}

export const trainingResourceFilePath = (resourceId: number, fileName: string) => {
  return fileName ? `${trainingResourcesPath}/${resourceId}/${fileName}` : "";
}

export const getBatchCenterInspectionFilePath = (batchId: number, fileName: string) => {
  return fileName ? `${storageFolders.storage}/${storageFolders.uploads}/${storageFolders.agency}/${storageFolders.batches}/${batchId}/${storageFolders.centerInspection}/${fileName}` : "";
}

export const getBatchGroupMediaFilePath = (batchId: number, groupType: string, groupId: number, mediaType: string, fileName: string) => {
  return fileName ? `${storageFolders.storage}/${storageFolders.uploads}/${storageFolders.agency}/${storageFolders.batches}/${batchId}/${groupType}/groups/${groupId}/${mediaType}s/${fileName}` : "";
}

export const getBatchIndividualCandidateMediaFilePath = (batchId: number, candidateId: number, mediaType: string, fileName: string) => {
  return fileName ? `${storageFolders.storage}/${storageFolders.uploads}/${storageFolders.agency}/${storageFolders.batches}/${batchId}/individual/${candidateId}/${mediaType}s/${fileName}` : "";
}

export const getBatchIndividualCandidateTheoryCapturedFilePath = (batchId: number, candidateId: number, fileName: string) => {
  return fileName ? `${storageFolders.storage}/${storageFolders.uploads}/${storageFolders.agency}/${storageFolders.batches}/${batchId}/student/${candidateId}/captured/${fileName}` : "";
}

export const folders = [
  {
    id: "annexure_m1_m2",
    name: "Annexure M1 M2",
    status: 1 as 0 | 1
  },
  {
    id: "annexure_n",
    name: "Annexure N",
    status: 1 as 0 | 1
  },
  {
    id: "assessor_feedback",
    name: "Assessor Feedback",
    status: 1 as 0 | 1
  },
  {
    id: "attendance_sheet",
    name: "Attendance Sheet",
    status: 1 as 0 | 1
  },
  {
    id: "biometric_attendance",
    name: "Biometric Attendance",
    status: 1 as 0 | 1
  },
  {
    id: "biometric_device_photo",
    name: "Biometric Device Photo",
    status: 1 as 0 | 1
  },
  {
    id: "building_photo",
    name: "Building Photo",
    status: 1 as 0 | 1
  },
  {
    id: "building_photo_outside",
    name: "Building Photo Outside",
    status: 1 as 0 | 1
  },
  {
    id: "center_facility",
    name: "Center Facility",
    status: 1 as 0 | 1
  },
  {
    id: "center_photo",
    name: "Center Photo",
    status: 1 as 0 | 1
  },
  {
    id: "center_video",
    name: "Center Video",
    status: 1 as 0 | 1
  },
  {
    id: "class_room_photo",
    name: "Classroom Photo",
    status: 1 as 0 | 1
  },
  {
    id: "enrollment_form",
    name: "Enrollment Form",
    status: 1 as 0 | 1
  },
  {
    id: "equipment_photo",
    name: "Equipment Photo",
    status: 1 as 0 | 1
  },
  {
    id: "group_photo_before_batch_start",
    name: "Group Photo Before Batch Start",
    status: 1 as 0 | 1
  },
  {
    id: "group_photo_student",
    name: "Group Photo Student",
    status: 1 as 0 | 1
  },
  {
    id: "group_photo_student_assessor",
    name: "Group Photo Student Assessor",
    status: 1 as 0 | 1
  },
  {
    id: "group_photo_student_assessor_trainer",
    name: "Group Photo Student Assessor Trainer",
    status: 1 as 0 | 1
  },
  {
    id: "group_photo_student_assessor_trainer_spoc",
    name: "Group Photo Student Assessor Trainer Spoc",
    status: 1 as 0 | 1
  },
  {
    id: "induction_kit",
    name: "Induction Kit",
    status: 1 as 0 | 1
  },
  {
    id: "it_lab_photo",
    name: "IT Lab Photo",
    status: 1 as 0 | 1
  },
  {
    id: "joint_undertaking_assessor_spoc",
    name: "Joint Undertaking Assessor Spoc",
    status: 1 as 0 | 1
  },
  {
    id: "manual_attendance_register",
    name: "Manual Attendance Register",
    status: 1 as 0 | 1
  },
  {
    id: "other_documents",
    name: "Other Documents",
    status: 1 as 0 | 1
  },
  {
    id: "practical_exam",
    name: "Practical Exam",
    status: 1 as 0 | 1
  },
  {
    id: "selfie_with_center",
    name: "Selfie With Center",
    status: 1 as 0 | 1
  },
  {
    id: "selfie_with_center_board",
    name: "Selfie With Center Board",
    status: 1 as 0 | 1
  },
  {
    id: "selfie_with_center_board_evening",
    name: "Selfie With Center Board Evening",
    status: 1 as 0 | 1
  },
  {
    id: "student_image_and_aadhaar",
    name: "Student Image and Aadhaar",
    status: 1 as 0 | 1
  },
  {
    id: "tc_declaration_form",
    name: "TC Declaration Form",
    status: 1 as 0 | 1
  },
  {
    id: "theory_exam",
    name: "Theory Exam",
    status: 1 as 0 | 1
  },
  {
    id: "tp_spoc_signature",
    name: "TP Spoc Signature",
    status: 1 as 0 | 1
  },
  {
    id: "trainer_aadhaar_photo",
    name: "Trainer Aadhaar Photo",
    status: 1 as 0 | 1
  },
  {
    id: "trainer_tot_certificate",
    name: "Trainer TOT Certificate",
    status: 1 as 0 | 1
  },
  {
    id: "viva_exam",
    name: "Viva Exam",
    status: 1 as 0 | 1
  }
] as const;

// export const folders = [
//   {
//     id: "selfie_with_center_photo",
//     name: "Selfie With Center Photo",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "selfie_with_center_board",
//     name: "Selfie With Center Board",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "center_video",
//     name: "Center Video",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "equipment_photo",
//     name: "Equipment Photo",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "group_photo_before_batch_start",
//     name: "Group Photo Before Batch Start",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "center_facility",
//     name: "Center Facility",
//     status: 1 as 0 | 1

//   },
//   {
//     id: "class_room_photo",
//     name: "Classroom Photo",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "it_lab_photo",
//     name: "IT Lab Photo",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "induction_kit",
//     name: "Induction Kit",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "biometric_device_photo",
//     name: "Biometric Device Photo",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "trainer_aadhaar_photo",
//     name: "Trainer Aadhaar Photo",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "trainer_tot_certificate",
//     name: "Trainer TOT Certificate",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "center_photo",
//     name: "Center Photo",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "building_photo",
//     name: "Building Photo",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "building_photo_outside",
//     name: "Building Photo Outside",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "selfie_with_center_board_evening",
//     name: "Selfie With Center Board Evening",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "theory_exam",
//     name: "Theory Exam",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "practical_exam",
//     name: "Practical Exam",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "viva_exam",
//     name: "Viva Exam",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "group_photo_student",
//     name: "Group Photo Student",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "group_photo_student_assessor",
//     name: "Group Photo Student Assessor",
//     status: 1 as 0 | 1

//   },
//   {
//     id: "group_photo_student_assessor_trainer",
//     name: "Group Photo Student Assessor Trainer",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "group_photo_student_assessor_trainer_spoc",
//     name: "Group Photo Student Assessor Trainer Spoc",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "tp_spoc_signature",
//     name: "TP Spoc Signature",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "assessor_signature",
//     name: "Assessor Signature",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "manual_attendance_register",
//     name: "Manual Attendance Register",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "tc_declaration_form",
//     name: "TC Declaration Form",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "joint_undertaking_assessor_spoc",
//     name: "Joint Undertaking Assessor Spoc",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "annexure_m1_m2",
//     name: "Annexure M1 M2",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "annexure_n",
//     name: "Annexure N",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "attendance_sheet",
//     name: "Attendance Sheet",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "biometric_attendance",
//     name: "Biometric Attendance",
//     status: 1 as 0 | 1
//   },
//   {
//     id: "other_documents",
//     name: "Other Documents",
//     status: 1 as 0 | 1
//   }
// ] as const;

export type FolderKey = typeof folders[number]["id"];

export const STUDENT_RESULT = {
  PENDING: 0,
  PASS: 1,
  FAIL: 2
} as const;
