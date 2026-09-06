export type UserRole = 'owner' | 'manager' | 'supervisor' | 'employee';

export type EmployeePosition =
  | 'Komi'
  | 'Garson'
  | 'Barista'
  | 'Kasiyer'
  | 'Mutfak'
  | 'Temizlik'
  | 'Şef'
  | 'Kurucu Şef'
  | 'Müdür';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  code: string; // e.g. CET-2841
  role: UserRole;
  position: EmployeePosition;
  avatarUrl: string;
  shiftStatus: 'clocked_in' | 'clocked_out' | 'on_break';
  shiftStartTime?: string;
  breakStartTime?: string;
  metrics: {
    tasksCompletedToday: number;
    tasksTotalToday: number;
    thisWeekCompleted: number;
    thisWeekTotal: number;
    onTimeRate: number; // percentage e.g. 96
    returnedCount: number;
  };
}

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TaskStatus =
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'waiting_approval'
  | 'completed'
  | 'rejected'
  | 'overdue'
  | 'cancelled';

export type ChecklistItemType =
  | 'checkbox'
  | 'yes_no'
  | 'number'
  | 'text'
  | 'temperature'
  | 'photo'
  | 'stock_amount';

export interface ChecklistItem {
  id: string;
  text: string;
  type: ChecklistItemType;
  required: boolean;
  completed: boolean;
  value?: string | number | boolean;
  targetValue?: string; // e.g. "4°C" for temperature
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface PhotoProof {
  url: string;
  timestamp: string;
  locationName: string;
  overlayText: string;
  type: 'live' | 'before' | 'after' | 'standard';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[]; // user IDs or team names like 'Komiler'
  assignedToRole?: EmployeePosition;
  zoneId: string;
  priority: TaskPriority;
  deadline: string; // "17:30" or ISO
  estimatedMinutes: number;
  requirePhoto: boolean;
  requireLivePhoto: boolean;
  requireBeforeAfter?: boolean;
  requireQr: boolean;
  locationVerified?: boolean;
  locationVerifiedAt?: string;
  requireApproval: boolean;
  status: TaskStatus;
  rejectionReason?: string;
  beforePhoto?: string;
  afterPhoto?: string;
  livePhotoProof?: PhotoProof;
  checklist: ChecklistItem[];
  comments: TaskComment[];
  createdAt: string;
  completedAt?: string;
  isRecurring?: boolean;
  recurrenceRule?: string; // e.g. "Her 45 dakika", "Her gün 17:00"
}

export interface Zone {
  id: string;
  name: string;
  code: string;
  iconName: string;
  status: 'ready' | 'needs_check' | 'in_progress' | 'overdue';
  totalTasks: number;
  completedTasks: number;
  color: string;
  qrCode: string;
  description: string;
}

export type ActionType =
  | 'OPEN_PAGE'
  | 'SEND_MESSAGE'
  | 'CREATE_ISSUE'
  | 'COMPLETE_TASK'
  | 'SCAN_QR'
  | 'START_BREAK'
  | 'SEND_ALERT'
  | 'OPEN_CAMERA'
  | 'CREATE_STOCK_ALERT'
  | 'CALL_MANAGER'
  | 'RUN_CHECKLIST';

export interface QuickAction {
  id: string;
  name: string;
  icon: string;
  color: 'lime' | 'amber' | 'coral' | 'blue' | 'purple' | 'emerald';
  actionType: ActionType;
  target?: string;
  messageTemplate?: string;
  requireConfirmation: boolean;
  requirePhoto: boolean;
  order: number;
  enabled: boolean;
  visibleRoles: UserRole[];
  imageUrl?: string;
}

export type IssueCategory =
  | 'Equipment'
  | 'Stock'
  | 'Cleaning'
  | 'Customer Area'
  | 'Safety'
  | 'Maintenance'
  | 'Ekipman & Cihaz'
  | 'Müşteri Alanı'
  | 'Stok'
  | 'Temizlik'
  | 'Güvenlik'
  | 'Other';

export type IssueUrgency = 'low' | 'medium' | 'high' | 'critical';

export type IssueStatus = 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  urgency: IssueUrgency;
  status: IssueStatus;
  reporterId: string;
  reporterName: string;
  assignedToName?: string;
  photoUrl?: string;
  zoneId?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface TaskTemplate {
  id: string;
  title: string;
  category:
    | 'Opening'
    | 'Closing'
    | 'Cleaning'
    | 'Kitchen'
    | 'Bar'
    | 'Restroom'
    | 'Terrace'
    | 'Safety'
    | 'Weekly'
    | 'Maintenance'
    | 'Açılış Rutini'
    | 'Kapanış Rutini'
    | 'Bar & Servis'
    | 'Hijyen';
  description: string;
  targetPosition: EmployeePosition;
  estimatedMinutes: number;
  requirePhoto: boolean;
  requireLivePhoto: boolean;
  requireQr: boolean;
  zoneId: string;
  checklist: Array<Omit<ChecklistItem, 'id' | 'completed' | 'value'>>;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  photoUrl?: string;
  taskId?: string;
  issueId?: string;
  reactions?: Record<string, number>;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  requireAck: boolean;
  authorName: string;
  createdAt: string;
  readUserIds: string[];
}

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  position: EmployeePosition;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'active' | 'break' | 'completed';
  breakMinutesUsed: number;
  shiftType?: 'morning' | 'evening' | 'mid' | 'full' | 'off' | 'custom';
  shiftLabel?: string;
  isOffDay?: boolean;
  note?: string;
  dayOfWeek?: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  timeFormatted?: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  type: 'task' | 'issue' | 'shift' | 'message' | 'approval' | 'system';
}

export interface AreaCheckRecord {
  id: string;
  zoneId: string;
  auditorId: string;
  auditorName: string;
  timestamp: string;
  checklistResults: Array<{
    item: string;
    passed: boolean;
    photoUrl?: string;
    note?: string;
  }>;
  overallPassed: boolean;
}

export type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'task_waiting_approval'
  | 'task_approved'
  | 'task_returned'
  | 'task_overdue'
  | 'issue_reported'
  | 'issue_resolved'
  | 'shift_clock_in'
  | 'shift_break'
  | 'announcement'
  | 'system_sync'
  | 'employee_registered';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  timeFormatted: string;
  read: boolean;
  priority: 'normal' | 'important' | 'urgent';
  targetUserId?: string;
  targetRole?: UserRole;
  relatedTaskId?: string;
  relatedIssueId?: string;
  actionLabel?: string;
}
