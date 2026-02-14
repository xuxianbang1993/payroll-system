import type { ReactElement } from "react";

import type { NavCategoryId } from "@/config/navigation";
import { ModulePlaceholderPage } from "@/pages/ModulePlaceholderPage";
import { EmployeeListPage } from "@/pages/employee/EmployeeListPage";
import { ImportExportPage } from "@/pages/employee/ImportExportPage";
import { BackupPage } from "@/pages/data/BackupPage";
import { StoragePage } from "@/pages/data/StoragePage";
import { OverviewPage } from "@/pages/home/OverviewPage";
import { CompanyPage } from "@/pages/settings/CompanyPage";
import { OrgSettingsPage } from "@/pages/settings/OrgSettingsPage";
import { SocialConfigPage } from "@/pages/settings/SocialConfigPage";

export interface AppRouteMeta {
  path: string;
  titleKey: string;
  category: NavCategoryId | null;
  groupKey: string | null;
  showMonthPicker?: boolean;
}

export interface AppRouteRecord extends AppRouteMeta {
  element: ReactElement;
}

export const appRoutes: AppRouteRecord[] = [
  {
    path: "/",
    titleKey: "app.overview",
    category: null,
    groupKey: null,
    element: <OverviewPage />,
  },
  {
    path: "/settings/org",
    titleKey: "nav.page.org",
    category: "settings",
    groupKey: "nav.group.orgCompany",
    element: <OrgSettingsPage />,
  },
  {
    path: "/settings/company",
    titleKey: "nav.page.company",
    category: "settings",
    groupKey: "nav.group.orgCompany",
    element: <CompanyPage />,
  },
  {
    path: "/settings/social",
    titleKey: "nav.page.social",
    category: "settings",
    groupKey: "nav.group.socialFund",
    element: <SocialConfigPage />,
  },
  {
    path: "/settings/fund",
    titleKey: "nav.page.fund",
    category: "settings",
    groupKey: "nav.group.socialFund",
    element: <SocialConfigPage />,
  },
  {
    path: "/settings/base",
    titleKey: "nav.page.base",
    category: "settings",
    groupKey: "nav.group.socialFund",
    element: <SocialConfigPage />,
  },
  {
    path: "/employee/list",
    titleKey: "nav.page.employeeList",
    category: "employee",
    groupKey: "nav.group.employeeInfo",
    element: <EmployeeListPage />,
  },
  {
    path: "/employee/import",
    titleKey: "nav.page.employeeImport",
    category: "employee",
    groupKey: "nav.group.employeeInfo",
    element: <ImportExportPage defaultTab="import" />,
  },
  {
    path: "/employee/export",
    titleKey: "nav.page.employeeExport",
    category: "employee",
    groupKey: "nav.group.employeeInfo",
    element: <ImportExportPage defaultTab="export" />,
  },
  {
    path: "/payroll/employee",
    titleKey: "nav.page.payrollByEmp",
    category: "payroll",
    groupKey: "nav.group.monthlyCalc",
    showMonthPicker: true,
    element: <ModulePlaceholderPage titleKey="nav.page.payrollByEmp" />,
  },
  {
    path: "/payroll/detail",
    titleKey: "nav.page.payrollDetail",
    category: "payroll",
    groupKey: "nav.group.monthlyCalc",
    showMonthPicker: true,
    element: <ModulePlaceholderPage titleKey="nav.page.payrollDetail" />,
  },
  {
    path: "/voucher",
    titleKey: "nav.page.voucherOverview",
    category: "voucher",
    groupKey: "nav.group.voucher",
    showMonthPicker: true,
    element: <ModulePlaceholderPage titleKey="nav.page.voucherOverview" />,
  },
  {
    path: "/data/backup",
    titleKey: "nav.page.backup",
    category: "data",
    groupKey: "nav.group.dataMgmt",
    element: <BackupPage />,
  },
  {
    path: "/data/storage",
    titleKey: "nav.page.storage",
    category: "data",
    groupKey: "nav.group.dataMgmt",
    element: <StoragePage />,
  },
];

export function getRouteMeta(pathname: string): AppRouteMeta {
  return (
    appRoutes.find((route) => route.path === pathname) ?? {
      path: pathname,
      titleKey: "app.overview",
      category: null,
      groupKey: null,
    }
  );
}
