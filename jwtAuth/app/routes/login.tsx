import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  json,
  redirect,
  useNavigate,
  useNavigation,
} from "@remix-run/react";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  const response = await fetch("http://localhost:1323/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });

  if (!response.ok) {
    return json({ response }, { status: 401 });
  }
  const cookie_header = response.headers.get("set-cookie");

  // throw redirect("/dashboard");
  throw redirect("/dashboard", {
    headers: {
      "set-Cookie": cookie_header!,
    },
  });
};

export default function Longin() {
  return (
    <div>
      <h1>login</h1>
      <Form method="post">
        <label>
          username
          <input id="username" name="username"></input>
        </label>
        <label>
          password
          <input id="password" name="password"></input>
        </label>
        <button type="submit">submit</button>
      </Form>
    </div>
  );
}
