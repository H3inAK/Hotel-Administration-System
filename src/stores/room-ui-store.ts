import { create } from "zustand";
import type { RoomStatus } from "@/types";

type RoomUiState = {
  isRoomDialogOpen: boolean;
  selectedRoomId: string | null;
  search: string;
  statusFilter: RoomStatus | "ALL";
  categoryFilter: string;
  openCreateDialog: () => void;
  openEditDialog: (roomId: string) => void;
  closeRoomDialog: () => void;
  setSearch: (search: string) => void;
  setStatusFilter: (status: RoomStatus | "ALL") => void;
  setCategoryFilter: (categoryId: string) => void;
};

export const useRoomUiStore = create<RoomUiState>((set) => ({
  isRoomDialogOpen: false,
  selectedRoomId: null,
  search: "",
  statusFilter: "ALL",
  categoryFilter: "ALL",
  openCreateDialog: () => set({ isRoomDialogOpen: true, selectedRoomId: null }),
  openEditDialog: (roomId) => set({ isRoomDialogOpen: true, selectedRoomId: roomId }),
  closeRoomDialog: () => set({ isRoomDialogOpen: false, selectedRoomId: null }),
  setSearch: (search) => set({ search }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter })
}));
