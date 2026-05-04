export const runtime = "nodejs";

export {
  handleCreateBooking as POST,
  handleListBookings as GET,
} from "@/features/bookings/handlers/booking.handlers";
