import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type BookingRow = {
  id: string;
  customer: string;
  service: string;
  time: string;
  status: string;
};

export function BookingTable({ bookings }: { bookings: BookingRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>{booking.id}</TableCell>
            <TableCell>{booking.customer}</TableCell>
            <TableCell>{booking.service}</TableCell>
            <TableCell>{booking.time}</TableCell>
            <TableCell>{booking.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
