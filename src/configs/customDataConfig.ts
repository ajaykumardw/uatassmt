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
