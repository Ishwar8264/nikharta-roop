import Link from "next/link";
import { MapPin, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PublicBranch } from "@/features/branches/types/branch.types";

type AdminBranchListProps = {
  branches: PublicBranch[];
};

// Admin branch overview backed by the branch management API.
export function AdminBranchList({ branches }: AdminBranchListProps) {
  if (branches.length === 0) {
    return (
      <Card className="bg-white/85">
        <CardContent className="grid min-h-40 place-items-center p-6 text-center">
          <div>
            <MapPin className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No branches are available for your admin scope.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-white/85">
      <CardContent className="p-0">
        <Table className="min-w-[880px]">
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-3">Branch</TableHead>
              <TableHead className="px-4 py-3">City</TableHead>
              <TableHead className="px-4 py-3">Hours</TableHead>
              <TableHead className="px-4 py-3">Status</TableHead>
              <TableHead className="px-4 py-3">Phone</TableHead>
              <TableHead className="px-4 py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((branch) => (
              <TableRow key={branch.id}>
                <TableCell className="max-w-sm px-4 py-4">
                  <p className="font-medium text-stone-950">{branch.nameHi}</p>
                  <p className="max-w-xs truncate text-xs text-muted-foreground">
                    {branch.address}
                  </p>
                </TableCell>
                <TableCell className="px-4 py-4">{branch.city}</TableCell>
                <TableCell className="px-4 py-4">
                  {branch.openTime.slice(0, 5)} - {branch.closeTime.slice(0, 5)}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Badge variant={branch.isActive ? "secondary" : "outline"}>
                    {branch.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <span className="inline-flex items-center gap-2">
                    <Phone className="size-3.5 text-muted-foreground" />
                    {branch.phone}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-4 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/branches/${branch.id}/edit`}>Edit</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
