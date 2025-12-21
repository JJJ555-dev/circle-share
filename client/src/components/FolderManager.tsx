import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, Plus, Trash2, Edit2, ChevronDown, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface FolderManagerProps {
  circleId: number;
  onFolderSelect?: (folderId: number | null) => void;
  selectedFolderId?: number | null;
}

export default function FolderManager({ circleId, onFolderSelect, selectedFolderId }: FolderManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

  const { data: folders, refetch } = trpc.folders.list.useQuery({ circleId });
  const createFolderMutation = trpc.folders.create.useMutation({
    onSuccess: () => {
      toast.success("文件夹创建成功");
      setNewFolderName("");
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "创建失败");
    },
  });

  const deleteFolderMutation = trpc.folders.delete.useMutation({
    onSuccess: () => {
      toast.success("文件夹已删除");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "删除失败");
    },
  });

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("请输入文件夹名称");
      return;
    }

    createFolderMutation.mutate({
      circleId,
      name: newFolderName,
    });
  };

  const handleDeleteFolder = (folderId: number) => {
    if (confirm("确定要删除此文件夹吗？文件夹内的文件将被移到根目录。")) {
      deleteFolderMutation.mutate({ folderId });
    }
  };

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Folder className="w-5 h-5 text-primary" />
          文件夹
        </h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              新建文件夹
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建文件夹</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="文件夹名称"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateFolder();
                  }
                }}
              />
              <Button onClick={handleCreateFolder} className="w-full">
                创建
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {/* 根目录选项 */}
        <Card
          className={`cursor-pointer transition-colors ${
            selectedFolderId === null ? "bg-primary/10 border-primary" : "hover:bg-accent"
          }`}
          onClick={() => onFolderSelect?.(null)}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">根目录</span>
            </div>
          </CardContent>
        </Card>

        {/* 文件夹列表 */}
        {folders && folders.length > 0 ? (
          folders.map((folder) => (
            <Card
              key={folder.id}
              className={`transition-colors ${
                selectedFolderId === folder.id ? "bg-primary/10 border-primary" : "hover:bg-accent"
              }`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    onClick={() => onFolderSelect?.(folder.id)}
                  >
                    <Folder className="w-4 h-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{folder.name}</p>
                      {folder.description && (
                        <p className="text-xs text-muted-foreground">{folder.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        由 {folder.creatorName} 创建
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>暂无文件夹</p>
          </div>
        )}
      </div>
    </div>
  );
}
