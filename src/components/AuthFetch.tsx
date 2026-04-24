export async function authFetch(url: string, options: any = {}) {
  const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/session`)
  const session = await sessionRes.json()

  const token = session?.user?.accessToken

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })
}
