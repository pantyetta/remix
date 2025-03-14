import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { getUserSession, logout } from "app/utils/auth/auth.server";
import { redirect } from "react-router";
import { json, useLoaderData } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserSession(request);
  if (!user) {
    return redirect("/auth/login");
  }
  return json({user});
}


export default function Success() {
    const {user} = useLoaderData<typeof loader>()
  return (
    <>
      <h1>ユーザー認証完了</h1>
      <p>{user.name}</p>
    </>
  );
}
