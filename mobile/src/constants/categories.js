export const CATEGORIES = [
  { key: 'Identity', icon: 'id-card-outline', color: '#4F46E5', bg: '#EEF2FF' },
  { key: 'Insurance', icon: 'shield-checkmark-outline', color: '#3B82F6', bg: '#DBEAFE' },
  { key: 'Education', icon: 'school-outline', color: '#10B981', bg: '#D1FAE5' },
  { key: 'Financial', icon: 'cash-outline', color: '#D97706', bg: '#FEF3C7' },
  { key: 'Legal', icon: 'document-text-outline', color: '#E11D48', bg: '#FFE4E6' },
  { key: 'Other', icon: 'folder-outline', color: '#6B7280', bg: '#F3F4F6' },
];
export const categoryMeta = (key) => CATEGORIES.find((c) => c.key === key) || CATEGORIES[5];

export const FILTERS = [
  { label: 'All', category: 'All' },
  ...CATEGORIES.map((c) => ({ label: c.key, category: c.key })),
  { label: 'Expiring Soon', status: 'expiring' },
  { label: 'Expired', status: 'expired' },
];
