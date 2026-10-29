import { colors } from './theme';

export const RENEWAL_STATUS = {
  'Not Started': { color: colors.textSecondary, bg: '#F3F4F6', icon: 'ellipse-outline' },
  'In Progress': { color: '#B45309', bg: '#FEF3C7', icon: 'time-outline' },
  Completed: { color: colors.success, bg: '#D1FAE5', icon: 'checkmark-circle' },
};
export const RENEWAL_STATUSES = Object.keys(RENEWAL_STATUS);
