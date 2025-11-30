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
  'Mobile No'
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
  'Mobile No'
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
  1: "Student",
  2: "Assessor",
  3: "Training Partner",
}

export const QuestionTypes : { [key: number]: string } = {
  1: "Yes/No",
  2: "MCQ",
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
}


const storagePath = `${process.env.NEXT_PUBLIC_APP_URL}/${storageFolders.storage}/${storageFolders.uploads}`;
const sscPath = `${storagePath}/${storageFolders.ssc}`;
const agencyPath = `${storagePath}/${storageFolders.agency}`;
const trainingResourcesPath = `${agencyPath}/${storageFolders.trainingResources}`;

// const batchesPath = `${agencyPath}/${storageFolders.batches}`;

export const sscImagePath = (userId: number, sscImage: string) => {
  return sscImage ? `${sscPath}/${userId}/${sscImage}` : "";
}

export const agencyUsersFilePath = (userId: number, fileName: string) => {
  return fileName ? `${agencyPath}/${storageFolders.users}/${userId}/${fileName}` : "";
}

export const trainingResourceFilePath = (sscId: number, fileName: string) => {
  return fileName ? `${trainingResourcesPath}/${sscId}/${fileName}` : "";
}
