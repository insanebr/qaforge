export type UserRole = 'admin' | 'qa' | 'viewer';
export type TestPriority = 'low' | 'medium' | 'high' | 'critical';
export type BranchStatus = 'testing' | 'approved' | 'rejected';
export type RunStatus = 'open' | 'closed';
export type ItemStatus = 'to_test' | 'testing' | 'failed' | 'done';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string | null;
  doc_url: string | null;
  created_at: string;
}

export interface TestCase {
  id: string;
  feature_id: string;
  title: string;
  priority: TestPriority;
  created_at: string;
}

export interface QaBranch {
  id: string;
  name: string;
  review_date: string;
  rejection_count: number;
  rejected_cards_count: number;
  bugs_created_count: number;
  status: BranchStatus;
  reason: string | null;
  created_at: string;
}

export interface TestRun {
  id: string;
  title: string;
  status: RunStatus;
  qa_branch_id: string | null;
  created_at: string;
  qa_branch?: QaBranch;
}

export interface TestRunItem {
  id: string;
  test_run_id: string;
  test_case_id: string | null;
  title_snapshot: string;
  priority_snapshot: string;
  status: ItemStatus;
  comment: string | null;
  qa_id: string | null;
  updated_at: string;
  qa_user?: UserProfile;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  created_at: string;
}
