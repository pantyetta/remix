import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookie = request.headers.get("Cookie");

  if (!cookie) {
    throw redirect("/login");
  }

  const response = await fetch("http://localhost:1323/check", {
    headers: {
      Cookie: cookie!,
    },
  });

  if (!response.ok) {
    throw redirect("/login");
  }

  return response.json();
};

export default function Index() {
  return (
    <div>
      <h1>need Auth!!</h1>
    </div>
  );
}
