import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface CircleActivityLogProps {
  circleId: number;
  limit?: number;
}

const actionLabels: Record<string, string> = {
  member_joined: "成员加入",
  member_left: "成员退出",
  member_removed: "成员被移除",
  file_uploaded: "上传文件",
  file_deleted: "删除文件",
  folder_created: "创建文件夹",
  folder_deleted: "删除文件夹",
  circle_updated: "圈子更新",
};

const actionColors: Record<string, string> = {
  member_joined: "bg-green-100 text-green-800",
  member_left: "bg-yellow-100 text-yellow-800",
  member_removed: "bg-red-100 text-red-800",
  file_uploaded: "bg-blue-100 text-blue-800",
  file_deleted: "bg-red-100 text-red-800",
  folder_created: "bg-purple-100 text-purple-800",
  folder_deleted: "bg-red-100 text-red-800",
  circle_updated: "bg-gray-100 text-gray-800",
};

export default function CircleActivityLog({ circleId, limit = 50 }: CircleActivityLogProps) {
  const { data: activities, isLoading } = trpc.activity.getCircleActivity.useQuery({
    circleId,
    limit,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        暂无活动记录
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <Card key={activity.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={actionColors[activity.action] || "bg-gray-100 text-gray-800"}>
                  {actionLabels[activity.action] || activity.action}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {activity.userName || "系统"}
                </span>
              </div>
              {activity.description && (
                <p className="text-sm text-foreground">{activity.description}</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(activity.createdAt), {
                addSuffix: true,
                locale: zhCN,
              })}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
