(async () => {
  const APP_URL = "REPLACED_AT_RENDER_TIME";

  const url = location.href;
  const title = document.title;
  const ogpImage =
    document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? null;

  const res = await fetch(`${APP_URL}/api/articles/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ url, title, ogpImage }),
  });

  if (res.status === 401) {
    alert("ログインしてください");
    window.open(APP_URL, "_blank");
    return;
  }

  const data = await res.json();
  if (!res.ok) {
    alert(data.error ?? "エラーが発生しました");
    return;
  }

  alert("読んだ記事に追加しました！");
})();
