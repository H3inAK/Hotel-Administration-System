"use client";

import { ArrowRight, BedDouble, CalendarDays, Search, Shield, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { PublicBookingDialog } from "@/components/home/public-booking-dialog";
import { RoomCard } from "@/components/home/room-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Room, RoomListResponse, RoomStatus, UserRole } from "@/types";

type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
};

export function HomePageClient() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState<RoomStatus | "ALL">("ALL");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    fetch("/api/rooms", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load rooms");
        }
        return (await response.json()) as RoomListResponse;
      })
      .then((payload) => setRooms(payload.rooms))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let mounted = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as MeResponse;
      })
      .then((payload) => {
        if (mounted) {
          setUser(payload?.user ?? null);
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => Array.from(new Set(rooms.map((room) => room.category.name))), [rooms]);
  const categoryOptions = useMemo(() => [{ value: "ALL", label: "All Types" }, ...categories.map((item) => ({ value: item, label: item }))], [categories]);
  const statusOptions = useMemo(
    () => [
      { value: "ALL", label: "All Status" },
      { value: "AVAILABLE", label: "Available" },
      { value: "OCCUPIED", label: "Occupied" },
      { value: "MAINTENANCE", label: "Maintenance" }
    ],
    []
  );

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const query = search.toLowerCase();
      const matchesSearch =
        room.roomNumber.toLowerCase().includes(query) ||
        room.category.name.toLowerCase().includes(query) ||
        (room.description?.toLowerCase().includes(query) ?? false);
      const matchesCategory = category === "ALL" || room.category.name === category;
      const matchesStatus = status === "ALL" || room.status === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [rooms, search, category, status]);

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((room) => room.status === "AVAILABLE").length;

  useEffect(() => {
    setAnimationKey((current) => current + 1);
  }, [search, category, status, loading]);

  return (
    <div className="page-shell">
      <AppHeader />
      <section className="relative isolate overflow-hidden bg-navy-950 text-white">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/hotel-hero.jpg')"
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950/90 via-navy-950/66 to-navy-900/35" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-navy-950 to-transparent" />
        <div className="mx-auto grid min-h-[640px] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-2 text-gold-400">
              {Array.from({ length: 5 }).map((_, index) => (
                <Sparkles key={index} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <h1 className="hotel-heading text-5xl font-bold leading-tight sm:text-7xl">
              Hotel Admin System
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">
              Refined stays in Mandalay with live room availability, simple booking, and a hotel team ready to manage every arrival.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#rooms" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-gold-500 px-6 text-sm font-bold text-navy-950 shadow-lg transition hover:bg-gold-400">
                Explore Rooms
                <ArrowRight className="h-4 w-4" />
              </a>
              {user ? (
                <>
                  <Link href="/staff" className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-white/20">
                    <CalendarDays className="h-4 w-4" />
                    Staff Dashboard
                  </Link>
                  {user.role === "ADMIN" ? (
                    <Link href="/admin" className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-white/20">
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  ) : null}
                </>
              ) : (
                <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-white/20">
                  Staff Login
                </Link>
              )}
            </div>
          </div>

          <div className="hidden justify-self-end rounded-lg border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-200">Tonight availability</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/50 bg-white/70 p-4 text-navy-950 shadow-sm backdrop-blur-sm">
                <p className="hotel-heading text-4xl font-bold"><CountUp value={availableRooms} /></p>
                <p className="mt-1 text-sm text-slate-600">Rooms available</p>
              </div>
              <div className="rounded-lg border border-white/50 bg-white/70 p-4 text-navy-950 shadow-sm backdrop-blur-sm">
                <p className="hotel-heading text-4xl font-bold"><CountUp value={categories.length} /></p>
                <p className="mt-1 text-sm text-slate-600">Room types</p>
              </div>
              <div className="rounded-lg border border-white/50 bg-white/70 p-4 text-navy-950 shadow-sm backdrop-blur-sm">
                <p className="hotel-heading text-4xl font-bold"><CountUp value={totalRooms} /></p>
                <p className="mt-1 text-sm text-slate-600">Total rooms</p>
              </div>
              <div className="rounded-lg border border-white/50 bg-white/70 p-4 text-navy-950 shadow-sm backdrop-blur-sm">
                <p className="hotel-heading text-4xl font-bold"><CountUp value={25} suffix="+" /></p>
                <p className="mt-1 text-sm text-slate-600">Years serving guests</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative border-t border-white/10 bg-navy-900/90 lg:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 text-center sm:grid-cols-4 sm:px-6 lg:px-8">
            <div>
              <p className="hotel-heading text-3xl font-bold text-gold-400"><CountUp value={totalRooms} /></p>
              <p className="text-sm text-white/70">Total Rooms</p>
            </div>
            <div>
              <p className="hotel-heading text-3xl font-bold text-gold-400"><CountUp value={availableRooms} /></p>
              <p className="text-sm text-white/70">Available Now</p>
            </div>
            <div>
              <p className="hotel-heading text-3xl font-bold text-gold-400"><CountUp value={categories.length} /></p>
              <p className="text-sm text-white/70">Room Types</p>
            </div>
            <div>
              <p className="hotel-heading text-3xl font-bold text-gold-400"><CountUp value={25} suffix="+" /></p>
              <p className="text-sm text-white/70">Years of Excellence</p>
            </div>
          </div>
        </div>
      </section>

      <main id="rooms" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our accommodations"
          title="Find Your Perfect Room"
          description="From comfortable standard rooms to lavish presidential suites, every space is prepared for a smooth stay."
        />
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <Input className="rounded-md pl-10" placeholder="Search rooms..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <FilterSelect ariaLabel="Filter by room type" value={category} options={categoryOptions} onChange={setCategory} />
            <FilterSelect ariaLabel="Filter by room status" value={status} options={statusOptions} onChange={(value) => setStatus(value as RoomStatus | "ALL")} />
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-96" />
            ))}
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room, index) => (
              <div
                key={`${animationKey}-${room.id}`}
                className="room-card-animate h-full"
                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
              >
                <RoomCard room={room} onBook={setSelectedRoom} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState title="No rooms match your filters" description="Try changing the room type, room status, or search keyword." icon={BedDouble} />
          </div>
        )}
      </main>
      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 p-6">
            <BedDouble className="h-8 w-8 text-gold-600" />
            <h3 className="mt-4 font-semibold text-slate-950">Real-time room status</h3>
            <p className="mt-2 text-sm text-slate-500">Availability is checked against active bookings before confirmation.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6">
            <Users className="h-8 w-8 text-gold-600" />
            <h3 className="mt-4 font-semibold text-slate-950">Simple guest booking</h3>
            <p className="mt-2 text-sm text-slate-500">Guests can book with contact details without creating an account.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6">
            <Sparkles className="h-8 w-8 text-gold-600" />
            <h3 className="mt-4 font-semibold text-slate-950">Managed by hotel staff</h3>
            <p className="mt-2 text-sm text-slate-500">Receptionists can check in, check out, and record payments inside the operations workspace.</p>
          </div>
        </div>
      </section>
      <AppFooter />
      <PublicBookingDialog room={selectedRoom} open={Boolean(selectedRoom)} onOpenChange={(open) => !open && setSelectedRoom(null)} />
    </div>
  );
}

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const duration = 750;
    const startedAt = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return (
    <>
      {displayValue}
      {suffix}
    </>
  );
}
