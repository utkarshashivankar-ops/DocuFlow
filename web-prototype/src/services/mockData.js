export const CATEGORIES_LIST = ['Identity', 'Insurance', 'Education', 'Financial', 'Agreements']

export const mockDocuments = [
  { id: 'doc_001', title: 'Passport', category: 'Identity', docNumber: 'P1234567', issueDate: '2019-05-10', expiryDate: '2029-05-09', issuingAuthority: 'Ministry of External Affairs', name: 'Aarav Sharma', dob: '1995-03-12', thumbnail: null },
  { id: 'doc_002', title: 'Health Insurance Policy', category: 'Insurance', docNumber: 'HI-88213', issueDate: '2024-01-15', expiryDate: '2026-10-10', issuingAuthority: 'Star Health', name: 'Aarav Sharma', dob: '1995-03-12', thumbnail: null },
  { id: 'doc_003', title: 'B.Tech Degree Certificate', category: 'Education', docNumber: 'ED-99021', issueDate: '2017-06-20', expiryDate: null, issuingAuthority: 'Savitribai Phule Pune University', name: 'Aarav Sharma', dob: '1995-03-12', thumbnail: null },
  { id: 'doc_004', title: 'Car Insurance', category: 'Insurance', docNumber: 'CI-44521', issueDate: '2025-09-01', expiryDate: '2026-10-05', issuingAuthority: 'HDFC Ergo', name: 'Aarav Sharma', dob: '1995-03-12', thumbnail: null },
  { id: 'doc_005', title: 'Rental Agreement', category: 'Agreements', docNumber: 'RA-3321', issueDate: '2025-11-01', expiryDate: '2026-11-01', issuingAuthority: 'Notary Pune', name: 'Aarav Sharma', dob: '1995-03-12', thumbnail: null },
  { id: 'doc_006', title: 'PAN Card', category: 'Identity', docNumber: 'ABCDE1234F', issueDate: '2012-08-01', expiryDate: null, issuingAuthority: 'Income Tax Department', name: 'Aarav Sharma', dob: '1995-03-12', thumbnail: null },
  { id: 'doc_007', title: 'Term Life Insurance', category: 'Insurance', docNumber: 'LI-77123', issueDate: '2023-02-14', expiryDate: '2043-02-14', issuingAuthority: 'LIC', name: 'Aarav Sharma', dob: '1995-03-12', thumbnail: null },
  { id: 'doc_008', title: 'Bank Loan Agreement', category: 'Financial', docNumber: 'BL-55210', issueDate: '2022-04-11', expiryDate: '2027-04-11', issuingAuthority: 'SBI', name: 'Aarav Sharma', dob: '1995-03-12', thumbnail: null },
  { id: 'doc_009', title: 'Driving License', category: 'Identity', docNumber: 'MH12 20190004521', issueDate: '2019-07-19', expiryDate: '2026-10-01', issuingAuthority: 'RTO Pune', name: 'Aarav Sharma', dob: '1995-03-12', thumbnail: null },
  { id: 'doc_010', title: 'M.Sc Marksheet', category: 'Education', docNumber: 'MS-10029', issueDate: '2020-07-01', expiryDate: null, issuingAuthority: 'University of Mumbai', name: 'Aarav Sharma', dob: '1995-03-12', thumbnail: null },
  { id: 'doc_011', title: 'Home Loan Statement', category: 'Financial', docNumber: 'HL-99871', issueDate: '2021-01-01', expiryDate: '2026-10-15', issuingAuthority: 'ICICI Bank', name: 'Aarav Sharma', dob: '1995-03-12', thumbnail: null },
  { id: 'doc_012', title: 'Employment Contract', category: 'Agreements', docNumber: 'EC-30012', issueDate: '2024-06-01', expiryDate: '2025-06-01', issuingAuthority: 'Infosys Ltd', name: 'Aarav Sharma', dob: '1995-03-12', thumbnail: null },
]

export const mockNotifications = [
  { id: 'n1', type: 'expiry', title: 'Driving License expiring soon', message: 'Your Driving License expires in 10 days.', time: '2h ago', read: false },
  { id: 'n2', type: 'expiry', title: 'Car Insurance expiring soon', message: 'Renew your Car Insurance before Oct 5.', time: '5h ago', read: false },
  { id: 'n3', type: 'system', title: 'Document processed', message: 'PAN Card was successfully scanned and saved.', time: '1d ago', read: true },
  { id: 'n4', type: 'expiry', title: 'Employment Contract expired', message: 'Your Employment Contract expired on Jun 1.', time: '3d ago', read: true },
  { id: 'n5', type: 'system', title: 'Welcome to DocuFlow', message: 'Your account was created successfully.', time: '6d ago', read: true },
]

export const dashboardStats = {
  totalDocuments: mockDocuments.length,
  expiringSoon: 4,
  storageUsedMb: 128,
  storageLimitMb: 1024,
  pendingRenewals: 3,
}

export const expiryChartData = [
  { month: 'Jan', count: 1 },
  { month: 'Feb', count: 0 },
  { month: 'Mar', count: 2 },
  { month: 'Apr', count: 1 },
  { month: 'May', count: 0 },
  { month: 'Jun', count: 3 },
  { month: 'Jul', count: 1 },
  { month: 'Aug', count: 0 },
  { month: 'Sep', count: 2 },
  { month: 'Oct', count: 4 },
  { month: 'Nov', count: 1 },
  { month: 'Dec', count: 0 },
]
