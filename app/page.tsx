import { redirect } from "next/navigation";

// ルート("/")はダッシュボードへ転送するだけの入口。
// 未ログインなら middleware が /login へ振り直す。
export default function Home() {
  redirect("/dashboard");
}
