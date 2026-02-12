import type { ReactElement } from "react";

import type { NavCategoryId } from "@/config/navigation";
import { ModulePlaceholderPage } from "@/pages/ModulePlaceholderPage";
import { OverviewPage } from "@/pages/home/OverviewPage";

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
    element: <ModulePlaceholderPage titleKey="nav.page.org" />,
  },
  {
    path: "/settings/company",
    titleKey: "nav.page.company",
    category: "settings",
    groupKey: "nav.group.orgCompany",
    element: <ModulePlaceholderPage titleKey="nav.page.company" />,
  },
  {
    path: "/settings/social",
    titleKey: "nav.page.social",
    category: "settings",
    groupKey: "nav.group.socialFund",
    element: <ModulePlaceholderPage titleKey="nav.page.social" />,
  },
  {
    path: "/settings/fund",
    titleKey: "nav.page.fund",
    category: "settings",
    groupKey: "nav.group.socialFund",
    element: <ModulePlaceholderPage titleKey="nav.page.fund" />,
  },
  {
    path: "/settings/base",
    titleKey: "nav.page.base",
    category: "settings",
    groupKey: "nav.group.socialFund",
    element: <ModulePlaceholderPage titleKey="nav.page.base" />,
  },
  {
    path: "/employee/list",
    titleKey: "nav.page.employeeList",
    category: "employee",
    groupKey: "nav.group.employeeInfo",
    element: <ModulePlaceholderPage titleKey="nav.page.employeeList" />,
  },
  {
    path: "/employee/import",
    titleKey: "nav.page.employeeImport",
    category: "employee",
    groupKey: "nav.group.employeeInfo",
    element: <ModulePlaceholderPage titleKey="nav.page.employeeImport" />,
  },
  {
    path: "/employee/export",
    titleKey: "nav.page.employeeExport",
    category: "employee",
    groupKey: "nav.group.employeeInfo",
    element: <ModulePlaceholderPage titleKey="nav.page.employeeExport" />,
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
    element: <ModulePlaceholderPage titleKey="nav.page.backup" />,
  },
  {
    path: "/data/storage",
    titleKey: "nav.page.storage",
    category: "data",
    groupKey: "nav.group.dataMgmt",
    element: <ModulePlaceholderPage titleKey="nav.page.storage" />,
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
