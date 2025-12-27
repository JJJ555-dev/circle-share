import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CircleCategoryManagerProps {
  circleId: number;
  isOwner?: boolean;
}

const SUGGESTED_CATEGORIES = ["工作", "学习", "娱乐", "技术", "设计", "营销", "财务", "其他"];

export default function CircleCategoryManager({ circleId, isOwner = false }: CircleCategoryManagerProps) {
  const [newCategory, setNewCategory] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: categories = [], refetch } = trpc.categories.getByCircle.useQuery({ circleId });
  const addMutation = trpc.categories.add.useMutation({
    onSuccess: () => {
      setNewCategory("");
      refetch();
      toast.success("分类添加成功");
    },
    onError: (error) => {
      toast.error(error.message || "添加分类失败");
    },
  });
  const removeMutation = trpc.categories.remove.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("分类删除成功");
    },
    onError: (error) => {
      toast.error(error.message || "删除分类失败");
    },
  });

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("请输入分类名称");
      return;
    }

    setIsAdding(true);
    try {
      await addMutation.mutateAsync({
        circleId,
        category: newCategory.trim(),
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveCategory = async (category: string) => {
    await removeMutation.mutateAsync({
      circleId,
      category,
    });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">圈子分类</h3>

      <div className="space-y-4">
        {/* Current categories */}
        <div>
          <label className="text-sm font-medium mb-2 block">已选分类</label>
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 ? (
              <span className="text-sm text-muted-foreground">暂无分类</span>
            ) : (
              categories.map((category) => (
                <Badge key={category} variant="secondary" className="flex items-center gap-1">
                  {category}
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveCategory(category)}
                      disabled={removeMutation.isPending}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))
            )}
          </div>
        </div>

        {/* Add new category */}
        {isOwner && (
          <div>
            <label className="text-sm font-medium mb-2 block">添加新分类</label>
            <div className="flex gap-2">
              <Input
                placeholder="输入分类名称"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                disabled={isAdding}
              />
              <Button
                onClick={handleAddCategory}
                disabled={isAdding || !newCategory.trim()}
                size="sm"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>

            {/* Suggested categories */}
            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">推荐分类</label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setNewCategory(category);
                    }}
                    disabled={categories.includes(category)}
                    className="text-xs px-2 py-1 rounded border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
