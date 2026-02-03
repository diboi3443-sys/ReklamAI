import * as React from "react";
import { useState } from "react";
import {
  Search,
  User,
  Shield,
  Zap,
  MoreHorizontal,
  Plus,
  Minus,
  Eye,
  Download,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer, PageHeader, PageContent, PageSection } from "@/components/ui/page-layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/i18n";

// Mock users data
const mockUsers = [
  { id: "1", email: "john@example.com", name: "John Creator", credits: 247, role: "user", plan: "Pro", joined: "2024-01-01", generations: 156 },
  { id: "2", email: "sarah@example.com", name: "Sarah Designer", credits: 1050, role: "user", plan: "Studio", joined: "2023-12-15", generations: 432 },
  { id: "3", email: "admin@reklamai.com", name: "Admin User", credits: 9999, role: "admin", plan: "Studio", joined: "2023-11-01", generations: 89 },
  { id: "4", email: "mike@example.com", name: "Mike Artist", credits: 15, role: "user", plan: "Free", joined: "2024-01-05", generations: 23 },
  { id: "5", email: "anna@example.com", name: "Anna Photo", credits: 500, role: "user", plan: "Pro", joined: "2023-12-20", generations: 287 },
  { id: "6", email: "david@example.com", name: "David Video", credits: 2340, role: "user", plan: "Studio", joined: "2023-11-15", generations: 567 },
  { id: "7", email: "lisa@example.com", name: "Lisa Creative", credits: 78, role: "user", plan: "Pro", joined: "2024-01-02", generations: 45 },
];

export default function AdminUsers() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(mockUsers);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "subtract">("add");

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdjustModal = (user: typeof mockUsers[0]) => {
    setSelectedUser(user);
    setAdjustAmount("");
    setAdjustType("add");
    setAdjustModalOpen(true);
  };

  const applyAdjustment = () => {
    if (!selectedUser || !adjustAmount) return;
    const amount = parseInt(adjustAmount);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              credits: adjustType === "add" ? u.credits + amount : Math.max(0, u.credits - amount),
            }
          : u
      )
    );
    setAdjustModalOpen(false);
  };

  const getRoleBadge = (role: string) => {
    return role === "admin" ? (
      <Badge variant="glow" size="sm" className="gap-1">
        <Shield className="w-3 h-3" />
        Admin
      </Badge>
    ) : (
      <Badge variant="outline" size="sm" className="gap-1">
        <User className="w-3 h-3" />
        User
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      Free: "outline",
      Pro: "secondary",
      Studio: "default",
    };
    return <Badge variant={variants[plan] || "outline"} size="sm">{plan}</Badge>;
  };

  return (
    <PageContainer>
      <PageHeader 
        title={t.admin.users} 
        description="Manage user accounts and credit balances"
      >
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </PageHeader>

      <PageContent>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">{t.admin.totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{users.filter((u) => u.role === "admin").length}</p>
              <p className="text-sm text-muted-foreground">Admins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{users.reduce((acc, u) => acc + u.credits, 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total {t.common.credits}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{users.reduce((acc, u) => acc + u.generations, 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{t.admin.totalGenerations}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`${t.common.search} users...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">{t.common.credits}</TableHead>
                  <TableHead className="text-right">{t.account.generations}</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getPlanBadge(user.plan)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Zap className="w-3 h-3 text-primary" />
                        <span className="font-medium">{user.credits.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{user.generations.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{user.joined}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openAdjustModal(user)}>
                            <Zap className="w-4 h-4 mr-2" />
                            Adjust Credits
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Usage
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Suspend User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageContent>

      {/* Adjust Credits Modal */}
      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
            <DialogDescription>
              Modify credit balance for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Balance</span>
                  <div className="flex items-center gap-1 font-medium">
                    <Zap className="w-4 h-4 text-primary" />
                    {selectedUser.credits.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={adjustType} onValueChange={(v) => setAdjustType(v as "add" | "subtract")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-success" />
                        Add Credits
                      </div>
                    </SelectItem>
                    <SelectItem value="subtract">
                      <div className="flex items-center gap-2">
                        <Minus className="w-4 h-4 text-destructive" />
                        Remove Credits
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Enter amount"
                  min={0}
                />
              </div>

              {adjustAmount && (
                <div className="p-3 rounded-lg bg-primary/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Balance</span>
                    <div className="flex items-center gap-1 font-bold">
                      <Zap className="w-4 h-4 text-primary" />
                      {(adjustType === "add"
                        ? selectedUser.credits + parseInt(adjustAmount || "0")
                        : Math.max(0, selectedUser.credits - parseInt(adjustAmount || "0"))
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={applyAdjustment} disabled={!adjustAmount}>
              {t.common.apply}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}