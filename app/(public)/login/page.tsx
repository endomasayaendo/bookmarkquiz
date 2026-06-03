import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold">bookmarkquiz</h1>
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-white hover:bg-gray-700"
          >
            GitHub でログイン
          </button>
        </form>
        {process.env.NODE_ENV === "development" && (
          <form
            action={async () => {
              "use server";
              await signIn("credentials", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg border border-dashed border-gray-400 px-6 py-3 text-gray-600 hover:bg-gray-100"
            >
              Dev Login（開発用）
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
