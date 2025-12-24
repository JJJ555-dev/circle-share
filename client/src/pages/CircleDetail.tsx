import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Upload, Download, Users, Trash2, FileVideo, FileAudio, FileImage, Crown, UserMinus, ArrowLeft, Eye, Circle } from "lucide-react";
import { useState, useRef } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import FilePreviewDialog from "@/components/FilePreviewDialog";
import FolderManager from "@/components/FolderManager";

export default function CircleDetail() {
  const { id } = useParams<{ id: string }>();
  const circleId = parseInt(id || "0");
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: circle, isLoading, refetch } = trpc.circles.get.useQuery({ circleId });
  const { data: files } = trpc.files.list.useQuery({ circleId });
  
  const uploadMutation = trpc.files.upload.useMutation({
    onSuccess: () => {
      toast.success("文件上传成功");
      setUploadOpen(false);
      setUploading(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "上传失败");
      setUploading(false);
    },
  });

  const deleteMutation = trpc.files.delete.useMutation({
    onSuccess: () => {
      toast.success("文件删除成功");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "删除失败");
    },
  });

  const leaveMutation = trpc.circles.leave.useMutation({
    onSuccess: () => {
      toast.success("已退出圈子");
      setLocation("/circles");
    },
    onError: (error) => {
      toast.error(error.message || "退出失败");
    },
  });

  const removeMemberMutation = trpc.circles.removeMember.useMutation({
    onSuccess: () => {
      toast.success("成员已移除");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "移除失败");
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error("文件大小不能超过100MB");
      return;
    }

    if (!file.type.startsWith("video/") && !file.type.startsWith("audio/") && !file.type.startsWith("image/")) {
      toast.error("只支持视频、音频和图片文件");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({
        circleId,
        filename: file.name,
        fileData: base64,
        mimeType: file.type,
        fileSize: file.size,
        folderId: selectedFolderId || undefined,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (fileId: number) => {
    if (confirm("确定要删除这个文件吗？")) {
      deleteMutation.mutate({ fileId });
    }
  };

  const handleLeave = () => {
    if (confirm("确定要退出这个圈子吗？")) {
      leaveMutation.mutate({ circleId });
    }
  };

  const handleRemoveMember = (userId: number, userName: string | null) => {
    if (confirm(`确定要移除成员 ${userName || "该用户"} 吗？`)) {
      removeMemberMutation.mutate({ circleId, userId });
    }
  };

  const handlePreview = (file: any) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

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

  const filteredFiles = files?.filter((file) => {
    if (selectedFolderId === null) {
      return !file.folderId;
    }
    return file.folderId === selectedFolderId;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">圈子不存在</h2>
          <Button asChild>
            <Link href="/circles">返回圈子列表</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = circle.userRole === "owner";

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
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{circle.name}</h1>
                  {isOwner && (
                    <div className="flex items-center gap-1 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                      <Crown className="w-4 h-4" />
                      创建者
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground">{circle.description || "暂无描述"}</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Upload className="w-5 h-5" />
                      上传文件
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>上传文件</DialogTitle>
                      <DialogDescription>选择视频、音频或图片文件上传（最大100MB）</DialogDescription>
                    </DialogHeader>
                    <div className="py-8">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*,audio/*,image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                      >
                        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">
                          {uploading ? "上传中..." : "点击选择文件"}
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                {!isOwner && (
                  <Button variant="outline" onClick={handleLeave}>
                    退出圈子
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Tabs defaultValue="files" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="files">文件列表</TabsTrigger>
              <TabsTrigger value="folders">文件夹</TabsTrigger>
              <TabsTrigger value="members">成员管理</TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="space-y-4">
              {filteredFiles && filteredFiles.length > 0 ? (
                <div className="grid gap-4">
                  {filteredFiles.map((file) => (
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
                              <span>上传者: {file.uploaderName || "未知"}</span>
                              <span>{new Date(file.uploadedAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(file)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            预览
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.location.href = `/api/download/${file.id}`;
                            }}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            下载
                          </Button>
                          {(file.uploaderId === user?.id || isOwner) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(file.id)}
                              className="gap-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                              删除
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-16">
                  <CardContent>
                    <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
                      <Upload className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">还没有文件</h3>
                    <p className="text-muted-foreground mb-6">上传第一个文件开始分享</p>
                    <Button onClick={() => setUploadOpen(true)} className="gap-2">
                      <Upload className="w-5 h-5" />
                      上传文件
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="folders" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <FolderManager
                    circleId={circleId}
                    onFolderSelect={setSelectedFolderId}
                    selectedFolderId={selectedFolderId}
                  />
                </div>
                <div className="lg:col-span-3">
                  {filteredFiles && filteredFiles.length > 0 ? (
                    <div className="grid gap-4">
                      {filteredFiles.map((file) => (
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
                                  <span>上传者: {file.uploaderName || "未知"}</span>
                                  <span>{new Date(file.uploadedAt).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePreview(file)}
                                className="gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                预览
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  window.location.href = `/api/download/${file.id}`;
                                }}
                                className="gap-2"
                              >
                                <Download className="w-4 h-4" />
                                下载
                              </Button>
                              {(file.uploaderId === user?.id || isOwner) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(file.id)}
                                  className="gap-2 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  删除
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="text-center py-16">
                      <CardContent>
                        <p className="text-muted-foreground">此文件夹中暂无文件</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              {circle.members && circle.members.length > 0 ? (
                <div className="grid gap-4">
                  {circle.members.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{member.userName || "未知用户"}</h3>
                              {member.role === "owner" && (
                                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                  <Crown className="w-3 h-3" />
                                  创建者
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {member.userEmail || "无邮箱"} · 加入于 {new Date(member.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {isOwner && member.role !== "owner" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId, member.userName)}
                            className="gap-2 text-destructive hover:text-destructive"
                          >
                            <UserMinus className="w-4 h-4" />
                            移除
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-16">
                  <CardContent>
                    <p className="text-muted-foreground">暂无成员</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <FilePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          file={previewFile}
        />
      </main>
    </div>
  );
}
