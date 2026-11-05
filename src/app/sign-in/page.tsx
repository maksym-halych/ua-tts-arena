import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/redirect";
import { currentUser, googleEnabled } from "@/server/auth";
import { localSignInEnabled } from "@/server/env";
import { getI18n } from "@/server/i18n";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const [{ t }, user, google] = await Promise.all([getI18n(), currentUser(), googleEnabled()]);
  if (user) redirect(next);

  const text = t.signIn;
  const local = localSignInEnabled();

  return (
    <div className="card mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">{text.title}</h1>
      <p className="text-sm text-ink-2">{text.body}</p>
      {params.error && (
        <p role="alert" className="text-sm text-danger">
          {text.error}
        </p>
      )}
      {google && (
        <form action="/auth/google" method="post">
          <input type="hidden" name="next" value={next} />
          <button className="btn btn-primary w-full py-2.5">{text.google}</button>
        </form>
      )}
      {local && (
        <form action="/auth/local" method="post" className="flex flex-col gap-2 border-t border-line pt-4">
          <input type="hidden" name="next" value={next} />
          <p className="text-sm font-medium">{text.localTitle}</p>
          <p className="text-xs text-ink-3">{text.localBody}</p>
          <label className="flex flex-col gap-1 text-sm">
            {text.email}
            <input name="email" type="email" required autoComplete="email" className="input" />
          </label>
          <button className="btn py-2">{text.localSubmit}</button>
        </form>
      )}
      {!google && !local && <p className="text-sm text-ink-2">{text.noMethod}</p>}
    </div>
  );
}
