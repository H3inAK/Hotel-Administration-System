import { create } from "zustand";

export type AdminTab = "rooms" | "guests" | "bookings" | "reports";
export type StaffTab = "today" | "active" | "pending" | "all";

type DashboardState = {
  selectedAdminTab: AdminTab;
  selectedStaffTab: StaffTab;
  setSelectedAdminTab: (tab: AdminTab) => void;
  setSelectedStaffTab: (tab: StaffTab) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedAdminTab: "rooms",
  selectedStaffTab: "today",
  setSelectedAdminTab: (tab) => set({ selectedAdminTab: tab }),
  setSelectedStaffTab: (tab) => set({ selectedStaffTab: tab })
}));
