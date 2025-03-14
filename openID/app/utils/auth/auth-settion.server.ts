import { createCookie, createMemorySessionStorage } from "@remix-run/node";

const sessionUserKey = "user";

const sessionCookie = createCookie("__session", {
    secrets: ["some-secret-for-signing-cookies"],
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
})

export const sessionStorage = createMemorySessionStorage({
    cookie: sessionCookie,
})

export const getSession = async<User> (request: Request): Promise<User> => {
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));
    return session.get(sessionUserKey);
}

export const setSession = async<User> (request: Request, user: User) => {
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));
    await session.set(sessionUserKey, user);

    return new Headers({
        'Set-Cookie': await sessionStorage.commitSession(session),
    });
}

export const clearSession = async (request: Request) => {
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));
    return new Headers({
        'Set-Cookie': await sessionStorage.destroySession(session),
    })
}