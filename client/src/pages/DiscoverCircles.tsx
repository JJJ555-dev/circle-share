import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Users } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const CATEGORIES = ["工作", "学习", "娱乐", "技术", "设计", "营销", "财务", "其他"];

export default function DiscoverCircles() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<"name" | "category">("name");

  const searchCircles = trpc.search.circles.useQuery(
    { query: searchQuery },
    { enabled: searchType === "name" && searchQuery.length > 0 }
  );

  const searchByCategory = trpc.search.byCategory.useQuery(
    { category: selectedCategory || "" },
    { enabled: searchType === "category" && selectedCategory !== null }
  );

  const joinMutation = trpc.circles.join.useMutation({
    onSuccess: () => {
      toast.success("加入圈子成功");
    },
    onError: (error) => {
      toast.error(error.message || "加入圈子失败");
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchType("name");
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSearchType("category");
  };

  const results = searchType === "name" ? searchCircles.data : searchByCategory.data;
  const isLoading = searchType === "name" ? searchCircles.isLoading : searchByCategory.isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">发现圈子</h1>
          <p className="text-muted-foreground">搜索或浏览感兴趣的圈子</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索圈子..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={!searchQuery.trim()}>
              搜索
            </Button>
          </div>
        </form>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground">分类浏览</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`px-4 py-2 rounded-full transition ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div>
          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && (!results || results.length === 0) && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchType === "name" && searchQuery
                  ? `未找到包含 "${searchQuery}" 的圈子`
                  : selectedCategory
                  ? `未找到 "${selectedCategory}" 分类的圈子`
                  : "输入搜索词或选择分类来浏览圈子"}
              </p>
            </Card>
          )}

          {!isLoading && results && results.length > 0 && (
            <div className="grid gap-4">
              {results.map((circle: any) => (
                <Card key={circle.id} className="p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{circle.name}</h3>
                      {circle.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {circle.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{circle.memberCount || 0} 名成员</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        joinMutation.mutate({ circleId: circle.id }, {
                          onSuccess: () => navigate(`/circles/${circle.id}`),
                        });
                      }}
                      disabled={joinMutation.isPending}
                    >
                      {joinMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "加入"
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
