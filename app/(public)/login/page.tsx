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
      </div>
    </div>
  );
}
