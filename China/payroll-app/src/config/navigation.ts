export type NavCategoryId = "settings" | "employee" | "payroll" | "voucher" | "data";

export interface NavItem {
  path: string;
  titleKey: string;
}

export interface NavGroup {
  titleKey: string;
  items: NavItem[];
}

export interface NavCategory {
  id: NavCategoryId;
  titleKey: string;
  groups: NavGroup[];
}

export const navCategories: NavCategory[] = [
  {
    id: "settings",
    titleKey: "nav.category.settings",
    groups: [
      {
        titleKey: "nav.group.orgCompany",
        items: [
          { path: "/settings/org", titleKey: "nav.page.org" },
          { path: "/settings/company", titleKey: "nav.page.company" },
        ],
      },
      {
        titleKey: "nav.group.socialFund",
        items: [
          { path: "/settings/social", titleKey: "nav.page.social" },
          { path: "/settings/fund", titleKey: "nav.page.fund" },
          { path: "/settings/base", titleKey: "nav.page.base" },
        ],
      },
    ],
  },
  {
    id: "employee",
    titleKey: "nav.category.employee",
    groups: [
      {
        titleKey: "nav.group.employeeInfo",
        items: [
          { path: "/employee/list", titleKey: "nav.page.employeeList" },
          { path: "/employee/import", titleKey: "nav.page.employeeImport" },
          { path: "/employee/export", titleKey: "nav.page.employeeExport" },
        ],
      },
    ],
  },
  {
    id: "payroll",
    titleKey: "nav.category.payroll",
    groups: [
      {
        titleKey: "nav.group.monthlyCalc",
        items: [
          { path: "/payroll/employee", titleKey: "nav.page.payrollByEmp" },
          { path: "/payroll/detail", titleKey: "nav.page.payrollDetail" },
        ],
      },
    ],
  },
  {
    id: "voucher",
    titleKey: "nav.category.voucher",
    groups: [
      {
        titleKey: "nav.group.voucher",
        items: [{ path: "/voucher", titleKey: "nav.page.voucherOverview" }],
      },
    ],
  },
  {
    id: "data",
    titleKey: "nav.category.data",
    groups: [
      {
        titleKey: "nav.group.dataMgmt",
        items: [
          { path: "/data/backup", titleKey: "nav.page.backup" },
          { path: "/data/storage", titleKey: "nav.page.storage" },
        ],
      },
    ],
  },
];
