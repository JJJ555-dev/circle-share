import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Circle, FileVideo, FileAudio, FileImage, Download, ArrowLeft, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: myUploads, isLoading } = trpc.files.myUploads.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("已退出登录");
      setLocation("/");
      window.location.reload();
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const getFileIcon = (type: string) => {
    if (type === "video") return <FileVideo className="w-8 h-8 text-primary" />;
    if (type === "audio") return <FileAudio className="w-8 h-8 text-primary" />;
    if (type === "image") return <FileImage className="w-8 h-8 text-primary" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-lg font-semibold">返回</span>
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
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Circle className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{user?.name || "用户"}</CardTitle>
                    <CardDescription>{user?.email || "无邮箱"}</CardDescription>
                  </div>
                </div>
                <Button variant="outline" onClick={() => logoutMutation.mutate()} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  退出登录
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">我上传的文件</h2>
            <p className="text-muted-foreground">查看您在所有圈子中上传的文件</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">加载中...</div>
          ) : myUploads && myUploads.length > 0 ? (
            <div className="grid gap-4">
              {myUploads.map((file) => (
                <Card key={file.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {getFileIcon(file.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{file.filename}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{formatFileSize(file.fileSize)}</span>
                          <span>圈子: {file.circleName}</span>
                          <span>{new Date(file.uploadedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <a href={file.fileUrl} download={file.filename} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                          下载
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/circles/${file.circleId}`}>查看圈子</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-16">
              <CardContent>
                <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
                  <FileImage className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">还没有上传文件</h3>
                <p className="text-muted-foreground mb-6">加入圈子并上传您的第一个文件</p>
                <Button asChild>
                  <Link href="/circles">查看圈子</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
