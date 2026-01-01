import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");

  // Check if user is admin
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <CardTitle>访问被拒绝</CardTitle>
            <CardDescription>您没有权限访问管理系统</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold">融媒 - 管理系统</span>
          </div>
          <div className="text-sm text-muted-foreground">
            管理员: {user.name || user.email}
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <Tabs defaultValue="announcements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="announcements">公告管理</TabsTrigger>
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="logs">操作日志</TabsTrigger>
          </TabsList>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>发布新公告</CardTitle>
                <CardDescription>创建并发布网站公告</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">标题</label>
                  <Input
                    placeholder="输入公告标题"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">内容</label>
                  <Textarea
                    placeholder="输入公告内容"
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    rows={6}
                  />
                </div>
                <AnnouncementForm
                  title={announcementTitle}
                  content={announcementContent}
                  onSuccess={() => {
                    setAnnouncementTitle("");
                    setAnnouncementContent("");
                  }}
                />
              </CardContent>
            </Card>

            <AnnouncementsList />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <UsersList />
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <AdminLogsList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function AnnouncementForm({
  title,
  content,
  onSuccess,
}: {
  title: string;
  content: string;
  onSuccess: () => void;
}) {
  const createMutation = trpc.admin.createAnnouncement.useMutation({
    onSuccess: () => {
      toast.success("公告创建成功");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "创建失败");
    },
  });

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("请填写标题和内容");
      return;
    }

    await createMutation.mutateAsync({ title, content });
  };

  return (
    <Button
      onClick={handleSubmit}
      disabled={createMutation.isPending || !title.trim() || !content.trim()}
      className="gap-2"
    >
      {createMutation.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Send className="w-4 h-4" />
      )}
      发布公告
    </Button>
  );
}

function AnnouncementsList() {
  const { data: announcements, isLoading, refetch } = trpc.admin.getAnnouncements.useQuery({
    limit: 20,
  });

  const publishMutation = trpc.admin.publishAnnouncement.useMutation({
    onSuccess: () => {
      toast.success("公告已发布");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "发布失败");
    },
  });

  const deleteMutation = trpc.admin.deleteAnnouncement.useMutation({
    onSuccess: () => {
      toast.success("公告已删除");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "删除失败");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>公告列表</CardTitle>
        <CardDescription>管理已发布和草稿公告</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!announcements || announcements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无公告</p>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{announcement.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {announcement.content}
                    </p>
                  </div>
                  <Badge variant={announcement.isPublished ? "default" : "secondary"}>
                    {announcement.isPublished ? "已发布" : "草稿"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {formatDistanceToNow(new Date(announcement.createdAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </span>
                  <div className="flex gap-2">
                    {!announcement.isPublished && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          publishMutation.mutate({ id: announcement.id })
                        }
                        disabled={publishMutation.isPending}
                      >
                        {publishMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        deleteMutation.mutate({ id: announcement.id })
                      }
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function UsersList() {
  const { data: users, isLoading, refetch } = trpc.admin.getAllUsers.useQuery({
    limit: 50,
  });

  const disableMutation = trpc.admin.disableUser.useMutation({
    onSuccess: () => {
      toast.success("用户已禁用");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "操作失败");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>用户管理</CardTitle>
        <CardDescription>查看和管理网站用户</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">用户名</th>
                <th className="text-left py-2 px-4">邮箱</th>
                <th className="text-left py-2 px-4">角色</th>
                <th className="text-left py-2 px-4">加入时间</th>
                <th className="text-left py-2 px-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {!users || users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    暂无用户
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-accent/50">
                    <td className="py-2 px-4">{user.name || "未设置"}</td>
                    <td className="py-2 px-4">{user.email || "未设置"}</td>
                    <td className="py-2 px-4">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-2 px-4">
                      {formatDistanceToNow(new Date(user.createdAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </td>
                    <td className="py-2 px-4">
                      {user.role !== "admin" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => disableMutation.mutate({ userId: user.id })}
                          disabled={disableMutation.isPending}
                        >
                          {disableMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "禁用"
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminLogsList() {
  const { data: logs, isLoading } = trpc.admin.getAdminLogs.useQuery({
    limit: 50,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const actionLabels: Record<string, string> = {
    user_disabled: "禁用用户",
    user_enabled: "启用用户",
    user_deleted: "删除用户",
    announcement_created: "创建公告",
    announcement_published: "发布公告",
    announcement_deleted: "删除公告",
    system_setting_changed: "修改系统设置",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>操作日志</CardTitle>
        <CardDescription>管理员操作记录</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {!logs || logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无日志</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <Badge className="mb-2">
                    {actionLabels[log.action] || log.action}
                  </Badge>
                  {log.details && (
                    <p className="text-sm text-muted-foreground">{log.details}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {formatDistanceToNow(new Date(log.createdAt), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
