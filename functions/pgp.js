export async function onRequest(context) {
  const url = new URL("/public-key.asc", context.request.url);

  const response = await fetch(url);

  if (!response.ok) {
    return new Response("PGP public key not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }

  const publicKey = await response.text();

  return new Response(publicKey, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}