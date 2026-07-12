import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListUsers, adminSetRole } from "@/lib/admin.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const qc = useQueryClient();
  const list = useServerFn(adminListUsers);
  const setRole = useServerFn(adminSetRole);
  const { data } = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });

  const toggle = async (userId: string, isAdmin: boolean) => {
    try {
      await setRole({ data: { userId, role: "admin", grant: !isAdmin } });
      toast.success(isAdmin ? "Admin removed" : "Admin granted");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <main className="container mx-auto px-4 py-8" style={{ paddingTop: "96px" }}>
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.users ?? []).map((u: any) => {
              const isAdmin = u.roles.includes("admin");
              return (
                <TableRow key={u.id}>
                  <TableCell>{u.display_name ?? "—"}</TableCell>
                  <TableCell>{u.phone ?? "—"}</TableCell>
                  <TableCell className="space-x-1">
                    {u.roles.map((r: string) => <Badge key={r} variant="outline">{r}</Badge>)}
                  </TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant={isAdmin ? "destructive" : "outline"} onClick={() => toggle(u.id, isAdmin)}>
                      {isAdmin ? "Revoke admin" : "Make admin"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
