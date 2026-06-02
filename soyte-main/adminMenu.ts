import {
  LayoutDashboard,
  User,
  CalendarDays,
  NotebookText,
  MessageSquare,
  Building2,
  Hospital,
  Stethoscope,
  ShieldCheck,
  Lock,
  Settings,
  Users,
  Images,
  Database,
} from "lucide-react";

export type MenuChild = {
  key: string;
  label: string;
  to: string;
  permission?: string;
};

export type MenuItem = {
  key: string;
  label: string;
  icon: any;
  permission: string;
  to?: string;
  children?: MenuChild[];
};

export const adminMenu: MenuItem[] = [
  {
    key: "posts",
    label: "Quản lý bài viết",
    icon: LayoutDashboard,
    permission: "posts",
    to: "/admin/dashboard",
  },
  {
    key: "banners",
    label: "Quản lý banner",
    icon: Images,
    permission: "banners",
    to: "/admin/banners",
  },
  {
    key: "users",
    label: "Quản lý người dùng",
    icon: User,
    permission: "users",
    to: "/admin/users",
  },
  {
    key: "smtp",
    label: "Cấu hình SMTP",
    icon: Settings,
    permission: "smtp",
    to: "/admin/smtp",
  },
  {
    key: "schedules",
    label: "Quản lý lịch công tác",
    icon: CalendarDays,
    permission: "work_schedule",
    to: "/admin/schedules",
  },
  {
    key: "facilities",
    label: "Quản lý CSYT",
    icon: Building2,
    permission: "social_facilities",
    to: "/admin/social-facilities",
  },
  {
    key: "affiliated-facilities",
    label: "Y tế trực thuộc",
    icon: Hospital,
    permission: "affiliated_facility",
    to: "/admin/affiliated-facilities",
  },
  {
    key: "trading-facilities",
    label: "Dữ liệu công khai",
    icon: Database,
    permission: "trading_facility",
    to: "/admin/trading-facilities",
  },
  {
    key: "Medicalreflection",
    label: "Phản ánh y tế",
    icon: Stethoscope,
    permission: "reflect",
    children: [
      {
        key: "feedback-list",
        label: "Biểu mẫu",
        to: "/admin/templates/reflect",
        permission: "reflect.form",
      },
      {
        key: "feedback-statistics",
        label: "Danh sách phản hồi",
        to: "/admin/feedbacks/reflect",
        permission: "reflect.list_feedback",
      },
      {
        key: "feedback-report",
        label: "Cuộc khảo sát",
        to: "/admin/surveys/reflect",
        permission: "reflect.survey",
      },
    ],
  },
  {
    key: "Qualitysupervision",
    label: "Giám sát chất lượng",
    icon: ShieldCheck,
    permission: "evaluate",
    children: [
      {
        key: "feedback-list",
        label: "Biểu mẫu",
        to: "/admin/templates/evaluate",
        permission: "evaluate.form",
      },
      {
        key: "feedback-statistics",
        label: "Danh sách phản hồi",
        to: "/admin/feedbacks/evaluate",
        permission: "evaluate.list_feedback",
      },
      {
        key: "feedback-report",
        label: "Cuộc khảo sát",
        to: "/admin/surveys/evaluate",
        permission: "evaluate.survey",
      },
    ],
  },
  {
    key: "roles",
    label: "Quản lý vai trò",
    icon: Users,
    permission: "roles",
    to: "/admin/roles",
  },
  {
    key: "permissions",
    label: "Quản lý quyền",
    icon: Lock,
    permission: "permissions",
    to: "/admin/permissions",
  },
  {
    key: "Report",
    label: "Báo cáo",
    icon: NotebookText,
    permission: "report",
    children: [
      {
        key: "report-DCBC",
        label: "Phản ánh y tế",
        to: "/admin/report/DCBC",
        permission: "report.report_1",
      },
      {
        key: "report-KSHL",
        label: "Giám sát chất lượng",
        to: "/admin/report/KSHL",
        permission: "report.report_2",
      },
      {
        key: "report-TCT01",
        label: "Phản ánh y tế - Kết quả thực hiện",
        to: "/admin/report/TCT01",
        permission: "report.report_3",
      },
    ],
  },
];
