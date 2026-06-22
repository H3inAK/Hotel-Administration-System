"use client";

import { Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/format";
import type { Room } from "@/types";

type RoomCardProps = {
  room: Room;
  onBook: (room: Room) => void;
};

const fallbackImages: Record<string, string> = {
  Standard: "/images/rooms/standard.jpg",
  Deluxe: "/images/rooms/deluxe.jpg",
  Suite: "/images/rooms/suite.jpg",
  Presidential: "/images/rooms/presidential.jpg"
};

function getDisplayDescription(room: Room) {
  return room.description ?? room.category.description ?? "Elegant room with thoughtful amenities for a comfortable stay.";
}

export function RoomCard({ room, onBook }: RoomCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const available = room.status === "AVAILABLE";
  const imageUrl = room.imageUrl || fallbackImages[room.category.name] || fallbackImages.Standard;
  const description = getDisplayDescription(room);

  return (
    <>
      <Card className="card-hover flex h-full overflow-hidden">
        <div className="flex w-full flex-col">
          <button type="button" className="group relative h-56 overflow-hidden bg-slate-100 text-left" onClick={() => setPreviewOpen(true)}>
            <img src={imageUrl} alt={`Room ${room.roomNumber}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-slate-950/0 transition group-hover:bg-slate-950/10" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-5">
              <h3 className="hotel-heading text-2xl font-bold text-white">Room {room.roomNumber}</h3>
            </div>
            <div className="absolute right-3 top-3">
              <StatusBadge status={room.status} />
            </div>
          </button>
          <div className="flex flex-1 flex-col p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{room.category.name}</p>
                <p className="room-description-clamp mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </div>
              <div className="w-32 shrink-0 text-right">
                <p className="font-bold text-gold-600">{formatCurrency(room.pricePerNight)}</p>
                <p className="text-xs text-slate-500">/ night</p>
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between gap-4 pt-5">
              <span className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
                <Users className="h-4 w-4 shrink-0" /> Up to {room.capacity} guests
              </span>
              <Button variant={available ? "gold" : "outline"} size="sm" disabled={!available} onClick={() => onBook(room)}>
                {available ? "Book Now" : "Unavailable"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <Dialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={`Room ${room.roomNumber}`}
        description={`${room.category.name} · ${formatCurrency(room.pricePerNight)} per night`}
        className="max-w-4xl"
      >
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          <img src={imageUrl} alt={`Room ${room.roomNumber}`} className="max-h-[68vh] w-full object-cover" />
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-600">{description}</p>
          <Button
            variant={available ? "gold" : "outline"}
            disabled={!available}
            onClick={() => {
              setPreviewOpen(false);
              onBook(room);
            }}
          >
            {available ? "Book Now" : "Unavailable"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
