import * as React from "react";
import { useState } from "react";
import {
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  Download,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer, PageHeader, PageContent, PageSection } from "@/components/ui/page-layout";
import { useTranslation } from "@/i18n";

type TaskStatus = "completed" | "failed" | "processing" | "queued";

// Mock task logs
const mockTasks = [
  { id: "task_001", user: "john@example.com", model: "Flux Pro", mode: "image", feature: "t2i", status: "completed" as TaskStatus, created: "2024-01-09T14:30:00", duration: "2.3s", credits: 8, error: null },
  { id: "task_002", user: "sarah@example.com", model: "Runway Gen-3", mode: "video", feature: "i2v", status: "completed" as TaskStatus, created: "2024-01-09T14:28:00", duration: "45.2s", credits: 35, error: null },
  { id: "task_003", user: "mike@example.com", model: "SDXL", mode: "image", feature: "inpaint", status: "failed" as TaskStatus, created: "2024-01-09T14:25:00", duration: "1.8s", credits: 0, error: "Content policy violation" },
  { id: "task_004", user: "anna@example.com", model: "Flux Pro", mode: "image", feature: "t2i", status: "processing" as TaskStatus, created: "2024-01-09T14:35:00", duration: "-", credits: 8, error: null },
  { id: "task_005", user: "david@example.com", model: "Pika", mode: "video", feature: "t2v", status: "queued" as TaskStatus, created: "2024-01-09T14:36:00", duration: "-", credits: 28, error: null },
  { id: "task_006", user: "lisa@example.com", model: "Real-ESRGAN", mode: "image", feature: "upscale", status: "completed" as TaskStatus, created: "2024-01-09T14:20:00", duration: "0.8s", credits: 3, error: null },
  { id: "task_007", user: "john@example.com", model: "Flux Pro", mode: "image", feature: "i2i", status: "failed" as TaskStatus, created: "2024-01-09T14:15:00", duration: "3.1s", credits: 0, error: "Provider timeout" },
  { id: "task_008", user: "sarah@example.com", model: "IC-Light", mode: "image", feature: "relight", status: "completed" as TaskStatus, created: "2024-01-09T14:10:00", duration: "1.5s", credits: 7, error: null },
];

export default function AdminLogs() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredTasks = mockTasks.filter((task) => {
    const matchesSearch =
      task.id.toLowerCase().includes(search.toLowerCase()) ||
      task.user.toLowerCase().includes(search.toLowerCase()) ||
      task.model.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case "completed": return t.common.ready;
      case "failed": return t.common.error;
      case "processing": return t.common.generating;
      case "queued": return "Queued";
      default: return status;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    const configs: Record<TaskStatus, { icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      completed: { icon: <CheckCircle className="w-3 h-3" />, variant: "default" },
      failed: { icon: <XCircle className="w-3 h-3" />, variant: "destructive" },
      processing: { icon: <RefreshCw className="w-3 h-3 animate-spin" />, variant: "secondary" },
      queued: { icon: <Clock className="w-3 h-3" />, variant: "outline" },
    };
    const config = configs[status];
    return (
      <Badge variant={config.variant} size="sm" className="gap-1">
        {config.icon}
        {getStatusLabel(status)}
      </Badge>
    );
  };

  const stats = {
    total: mockTasks.length,
    completed: mockTasks.filter((t) => t.status === "completed").length,
    failed: mockTasks.filter((t) => t.status === "failed").length,
    processing: mockTasks.filter((t) => t.status === "processing").length,
  };

  return (
    <PageContainer>
      <PageHeader 
        title={t.admin.logs} 
        description="Monitor task execution and errors"
      >
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
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
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">{t.common.ready}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
              <p className="text-sm text-muted-foreground">{t.common.error}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.processing}</p>
              <p className="text-sm text-muted-foreground">{t.common.generating}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`${t.common.search} tasks...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-3 h-3 mr-2" />
              <SelectValue placeholder={t.common.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">{t.common.ready}</SelectItem>
              <SelectItem value="failed">{t.common.error}</SelectItem>
              <SelectItem value="processing">{t.common.generating}</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tasks Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>{t.studio.model}</TableHead>
                  <TableHead>{t.studio.feature}</TableHead>
                  <TableHead>{t.common.status}</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">{t.common.credits}</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-mono text-xs">{task.id}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[150px]">
                      {task.user}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" size="sm">{task.model}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{task.feature}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(task.status)}
                        {task.error && (
                          <div className="flex items-center gap-1 text-xs text-destructive">
                            <AlertTriangle className="w-3 h-3" />
                            {task.error}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{task.duration}</TableCell>
                    <TableCell className="text-right">{task.credits}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(task.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageContent>
    </PageContainer>
  );
}