import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Circle, Upload, Download, Users, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
        <nav className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Circle className="w-6 h-6 text-primary" />
              <span className="text-xl font-semibold">圈子分享</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/circles">
                <Button variant="ghost">我的圈子</Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost">个人中心</Button>
              </Link>
              <div className="text-sm text-muted-foreground">{user.name || user.email}</div>
            </div>
          </div>
        </nav>

        <main className="container py-16">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              欢迎回来，{user.name || "用户"}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              在圈子中分享您的珍贵文件，与成员无损共享视频、音频和图片
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/circles">
                <Button size="lg" className="gap-2">
                  <Circle className="w-5 h-5" />
                  查看我的圈子
                </Button>
              </Link>
              <Link href="/circles/new">
                <Button size="lg" variant="outline" className="gap-2">
                  <Sparkles className="w-5 h-5" />
                  创建新圈子
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>无损上传</CardTitle>
                <CardDescription>
                  支持视频、音频和图片的原始质量上传，保留每一个细节
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>圈子共享</CardTitle>
                <CardDescription>
                  创建专属圈子，邀请成员加入，共同管理和分享文件资源
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>便捷下载</CardTitle>
                <CardDescription>
                  圈子成员可以随时下载所有文件，享受无损的原始质量
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Circle className="w-6 h-6 text-primary" />
            <span className="text-xl font-semibold">圈子分享</span>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>登录</a>
          </Button>
        </div>
      </nav>

      <main className="container py-20">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            优雅完美的文件分享平台
          </div>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
            圈子分享
          </h1>
          <p className="text-2xl text-muted-foreground mb-12">
            无损上传下载视频、音频和图片<br />
            与您的圈子成员共享珍贵的多媒体资源
          </p>
          <Button size="lg" asChild className="text-lg px-8 py-6">
            <a href={getLoginUrl()}>立即开始</a>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">无损上传</CardTitle>
              <CardDescription className="text-base">
                支持视频、音频和图片的原始质量上传，完整保留文件的每一个细节和元数据
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">圈子管理</CardTitle>
              <CardDescription className="text-base">
                创建专属圈子，邀请成员加入，共同管理和分享文件资源，协作更高效
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Download className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">便捷下载</CardTitle>
              <CardDescription className="text-base">
                圈子成员可以随时下载所有文件，享受无损的原始质量，随时随地访问
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="max-w-3xl mx-auto text-center">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-accent/10">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
              <p className="text-lg text-muted-foreground mb-6">
                立即注册，创建您的第一个圈子，开始分享珍贵的多媒体文件
              </p>
              <Button size="lg" asChild className="text-lg px-8 py-6">
                <a href={getLoginUrl()}>免费注册</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
