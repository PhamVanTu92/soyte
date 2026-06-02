import { LucideIcon } from "lucide-react";

declare global {
  interface Window {
    dashboard: any; // Declare the global dashboard object
  }
}

export interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon?: LucideIcon;
  isDashboard?: boolean;
  linkUrl?: string;
  children?: MenuItem[];
}

export interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  category: string;
  isFeatured?: boolean;
}

export interface DashboardStat {
  label: string;
  value: string | number;
  change?: string;
  isIncrease?: boolean;
  colorClass: string;
  icon?: LucideIcon;
}

export enum FilterTimeRange {
  TODAY = "Hôm nay",
  WEEK = "Tuần này",
  MONTH = "Tháng này",
}

export interface ScheduleAttachment {
  id?: string;
  name: string;
  url: string;
  type?: string;
}

export interface WorkSchedule {
  id: number;
  title: string;
  leader: string;
  content: string;
  start_time: string; // ISO datetime string
  end_time: string; // ISO datetime string
  location: string;
  presider_id: number;
  coordinating_unit: string;
  priority: "IMPORTANT" | "NORMAL" | "LOW";
  attendee_ids: number[];
  status: "pending" | "completed" | "cancelled";
  attachments?: ScheduleAttachment[];
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string | number;
  full_name: string;
  email: string;
  role: "admin" | "user";
  status: 0 | 1;
  is_verified: boolean;
  type?: string;
  facility_id?: string;
  unit?: string;
  permissions?: any; // Supporting nested object or array
  permission_details?: { name: string; description: string }[];
  roles?: Role[];
  us?: string;
  pass?: string;
}
export interface Permission {
  id: number;
  name: string;
  description: string;
  parent_id?: number | null;
  children?: Permission[];
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  permissions?: Permission[];
  created_at?: string;
  updated_at?: string;
}

export type BannerPosition = "top" | "left" | "right" | "footer";

export interface Banner {
  id: number;
  position: BannerPosition;
  image_url: string;
  title?: string;
  link_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SmtpConfig {
  id?: number;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
}
