# Testing Guide

## Authentication

- Login with `admin@hotel.com / password123` and verify redirect to `/admin`.
- Login with `receptionist@hotel.com / password123` and verify redirect to `/staff`.
- Visit `/admin` as receptionist and verify redirect to `/staff`.
- Logout and verify `/admin` and `/staff` redirect to `/login`.

## Public booking

- Open `/`.
- Search for an available room.
- Click `Book Now`.
- Enter guest details and stay dates.
- Submit and verify a success toast.

## Room management

- Login as admin.
- Open Rooms tab.
- Create a new room with a unique room number.
- Edit price, capacity, status, and description.
- Delete a room with no bookings.
- Attempt to delete a booked room and verify a friendly error message.

## Guest management

- Create a guest.
- Search by name, email, and phone.
- Edit phone/address.
- Delete an unused guest.

## Booking management

- Create a booking for an available room.
- Use `Check Availability` before saving.
- Attempt overlapping booking for the same room and verify rejection.
- Cancel a booking and confirm it is excluded from availability checks.

## Staff workflow

- Login as receptionist.
- Search by guest or room.
- Check in a pending or confirmed booking.
- Verify the room status becomes occupied.
- Record a payment.
- Check out the booking.
- Verify the room status becomes available.

## Reports

- Verify total revenue reflects paid and partial payments.
- Verify occupancy rate is based on occupied rooms.
- Verify room type revenue uses booking/payment records.
- Verify booking status breakdown counts real bookings.
