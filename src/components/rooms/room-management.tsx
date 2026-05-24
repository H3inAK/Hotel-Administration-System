"use client";

import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RoomFormDialog } from "@/components/rooms/room-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { useRoomUiStore } from "@/stores/room-ui-store";
import type { Room, RoomCategory, RoomListResponse, RoomStatus } from "@/types";

type RoomManagementProps = {
  onChanged?: () => void;
};

export function RoomManagement({ onChanged }: RoomManagementProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);
  const {
    search,
    statusFilter,
    categoryFilter,
    isRoomDialogOpen,
    selectedRoomId,
    setSearch,
    setStatusFilter,
    setCategoryFilter,
    openCreateDialog,
    openEditDialog,
    closeRoomDialog
  } = useRoomUiStore();

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rooms", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load rooms");
      }
      const payload = (await response.json()) as RoomListResponse;
      setRooms(payload.rooms);
      setCategories(payload.categories);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load rooms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null;

  const filteredRooms = useMemo(() => {
    const query = search.toLowerCase();
    return rooms.filter((room) => {
      const matchesSearch = room.roomNumber.toLowerCase().includes(query) || room.category.name.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "ALL" || room.status === statusFilter;
      const matchesCategory = categoryFilter === "ALL" || room.categoryId === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [rooms, search, statusFilter, categoryFilter]);

  const categoryOptions = useMemo(
    () => [{ value: "ALL", label: "All Types" }, ...categories.map((category) => ({ value: category.id, label: category.name }))],
    [categories]
  );
  const statusOptions = useMemo(
    () => [
      { value: "ALL", label: "All Status" },
      { value: "AVAILABLE", label: "Available" },
      { value: "OCCUPIED", label: "Occupied" },
      { value: "MAINTENANCE", label: "Maintenance" }
    ],
    []
  );

  async function handleDelete() {
    if (!deleteRoom) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/rooms/${deleteRoom.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to delete room");
      }
      toast.success(`Room ${deleteRoom.roomNumber} deleted`);
      setDeleteRoom(null);
      await loadRooms();
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete room");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-950">Rooms</h2>
          <p className="text-sm text-slate-500">Create, update, and monitor room inventory.</p>
        </div>
        <Button variant="gold" onClick={openCreateDialog}>
          <Plus className="h-5 w-5" /> Add Room
        </Button>
      </div>
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input className="rounded-md pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search room number or type..." />
        </div>
        <FilterSelect ariaLabel="Filter by room type" value={categoryFilter} options={categoryOptions} onChange={setCategoryFilter} />
        <FilterSelect ariaLabel="Filter by room status" value={statusFilter} options={statusOptions} onChange={(value) => setStatusFilter(value as RoomStatus | "ALL")} />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">Loading rooms...</div>
      ) : filteredRooms.length === 0 ? (
        <EmptyState title="No rooms found" description="Try a different search or create a new room." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell className="font-semibold text-slate-950">{room.roomNumber}</TableCell>
                <TableCell>{room.category.name}</TableCell>
                <TableCell>{formatCurrency(room.pricePerNight)}</TableCell>
                <TableCell>{room.capacity}</TableCell>
                <TableCell>
                  <StatusBadge status={room.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" aria-label="Edit room" onClick={() => openEditDialog(room.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete room" className="text-red-600 hover:text-red-700" onClick={() => setDeleteRoom(room)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <RoomFormDialog
        open={isRoomDialogOpen}
        onOpenChange={(open) => !open && closeRoomDialog()}
        room={selectedRoom}
        categories={categories}
        onSaved={async () => {
          closeRoomDialog();
          await loadRooms();
          onChanged?.();
        }}
      />
      <AlertDialog
        open={Boolean(deleteRoom)}
        onOpenChange={(open) => !open && setDeleteRoom(null)}
        title="Delete room?"
        description="This action cannot be undone. Rooms with existing bookings cannot be deleted until related records are removed."
        confirmLabel="Delete room"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </section>
  );
}
