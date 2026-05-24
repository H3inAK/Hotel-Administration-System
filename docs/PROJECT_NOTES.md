# Project Notes

## Scope

Grand Mandalay Hotel Administration System implements the key workflow needed by a hotel team:

- Public room browsing and booking
- Guest registration
- Room availability checking
- Booking management
- Check-in and check-out
- Payment recording
- Admin and receptionist dashboards
- Database-backed reports

## Architecture

The project uses Next.js App Router for both pages and route handlers. Prisma is the database access layer. PostgreSQL stores users, rooms, guests, bookings, services, booking services, and payments.

## Authentication

Authentication is custom credentials authentication. Passwords are hashed with bcryptjs. After login, a JWT is signed with jose and stored in a secure HTTP-only cookie. Middleware protects `/admin` and `/staff`.

## Authorization

- ADMIN can access `/admin` and `/staff`.
- RECEPTIONIST can access `/staff` only.
- API routes enforce role checks for protected operations.

## Booking rules

The room availability rule rejects overlapping bookings when:

```text
existing.checkInDate < requestedCheckOutDate
AND existing.checkOutDate > requestedCheckInDate
AND status is not CANCELLED and not CHECKED_OUT
```

Maintenance rooms cannot be booked. Check-in sets the room to occupied. Check-out sets the room back to available.

## UI style

The UI uses Grand Mandalay branding, a dark navy header, gold accents, white cards, subtle borders, status badges, responsive grids, and dashboard tables.
