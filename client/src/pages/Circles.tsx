import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Circle, Plus, Users, Calendar, Crown } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Circles() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [invitationCode, setInvitationCode] = useState("");
  const [showPublicCircles, setShowPublicCircles] = useState(false);

  const { data: circles, isLoading, refetch } = trpc.circles.list.useQuery();
  const { data: publicCircles, isLoading: publicLoading } = trpc.circles.listPublic.useQuery();
  const joinMutation = trpc.circles.joinByInvitationCode.useMutation({
    onSuccess: (data) => {
      toast.success("加入圈子成功");
      setInvitationCode("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "加入失败");
    },
  });
  const createMutation = trpc.circles.create.useMutation({
    onSuccess: () => {
      toast.success("圈子创建成功");
      setOpen(false);
      setName("");
      setDescription("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "创建失败");
    },
  });

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("请输入圈子名称");
      return;
    }
    createMutation.mutate({ name, description, isPublic });
  };

  const handleJoinByCode = () => {
    if (!invitationCode.trim()) {
      toast.error("请输入邀请码");
      return;
    }
    joinMutation.mutate({ code: invitationCode });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Circle className="w-6 h-6 text-primary" />
              <span className="text-xl font-semibold">融媒</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/circles">
              <Button variant="ghost">我的圈子</Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost">个人中心</Button>
            </Link>
            <div className="text-sm text-muted-foreground">{user?.name || user?.email}</div>
          </div>
        </div>
      </nav>

      <main className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">我的圈子</h1>
            <p className="text-muted-foreground">管理您创建和加入的所有圈子</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                创建圈子
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建新圈子</DialogTitle>
                <DialogDescription>创建一个新的文件分享圈子</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">圈子名称</Label>
                  <Input
                    id="name"
                    placeholder="输入圈子名称"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">圈子描述（可选）</Label>
                  <Textarea
                    id="description"
                    placeholder="描述这个圈子的用途"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    公开圈子（所有人可以看到）
                  </Label>
                  {!isPublic && (
                    <p className="text-sm text-muted-foreground">邀请码将自动生成，用于邀请成员加入</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "创建中..." : "创建"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-8 p-6 bg-card rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">使用邀请码加入圈子</h2>
          <div className="flex gap-2">
            <Input
              placeholder="输入邀请码"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleJoinByCode();
                }
              }}
            />
            <Button onClick={handleJoinByCode} disabled={joinMutation.isPending}>
              {joinMutation.isPending ? "加入中..." : "加入"}
            </Button>
          </div>
        </div>

        {showPublicCircles && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">发现圈子</h2>
            {publicLoading ? (
              <div className="text-center py-12 text-muted-foreground">加载中...</div>
            ) : publicCircles && publicCircles.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicCircles.map((circle) => (
                  <Card key={circle.id} className="hover:shadow-lg transition-all hover:border-primary/50">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <Circle className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{circle.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {circle.description || "暂无描述"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{circle.memberCount} 成员</span>
                        </div>
                      </div>
                      <Link href={`/circles/${circle.id}`}>
                        <Button className="w-full">查看详情</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-16">
                <CardContent>
                  <p className="text-muted-foreground">暂无公开圈子</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">加载中...</div>
        ) : circles && circles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {circles.map((circle) => (
              <Link key={circle.id} href={`/circles/${circle.id}`}>
                <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Circle className="w-6 h-6 text-primary" />
                      </div>
                      {circle.role === "owner" && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                          <Crown className="w-3 h-3" />
                          创建者
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-xl">{circle.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {circle.description || "暂无描述"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{circle.memberCount} 成员</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(circle.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
                <Circle className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">还没有圈子</h3>
              <p className="text-muted-foreground mb-6">创建您的第一个圈子，开始分享文件</p>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus className="w-5 h-5" />
                创建圈子
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
