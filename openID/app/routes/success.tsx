import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { getUserSession, logout } from "app/utils/auth/auth.server";
import { redirect } from "react-router";
import { json, useLoaderData } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserSession(request);
  if (!user) {
    return redirect("/");
  }
  return json({user});
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    return await logout(request);
  } catch (e) {
    console.error("action", e);
    return new Response("Logout failed", { status: 500 });
  }
}

export default function Success() {
    const {user} = useLoaderData<typeof loader>()
  return (
    <>
      <h1>ログイン成功</h1>
      <p>{user.name}</p>
      <form method="post">
        <button type="submit">ログアウト</button>
      </form>
    </>
  );
}
