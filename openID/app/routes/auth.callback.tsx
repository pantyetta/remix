import { redirect, type LoaderFunctionArgs } from "react-router";
import { getUserSession } from "app/utils/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const user = await getUserSession(request);
        if (user) {
            throw redirect("/success");
        }
    } catch (e) {
        if (e instanceof Response) {
            throw e;
        }
        console.error(e);
        redirect("/auth/login");
    }
}

export default function Calback() {
    return <></>;
}