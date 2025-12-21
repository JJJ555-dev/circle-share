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

  const { data: circles, isLoading, refetch } = trpc.circles.list.useQuery();
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
    createMutation.mutate({ name, description });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Circle className="w-6 h-6 text-primary" />
              <span className="text-xl font-semibold">圈子分享</span>
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
