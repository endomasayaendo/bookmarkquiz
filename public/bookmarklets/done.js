(async () => {
  const ogpImage =
    document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? null;
  const res = await fetch("__APP_URL__/api/articles/read", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer __TOKEN__",
    },
    body: JSON.stringify({ url: location.href, title: document.title, ogpImage }),
  });
  if (res.status === 401) {
    alert("トークンが無効です。ブックマークレットを再設定してください");
    return;
  }
  const data = await res.json();
  if (!res.ok) {
    alert(data.error ?? "エラーが発生しました");
    return;
  }
  alert("読んだ記事に追加しました！");
})();
