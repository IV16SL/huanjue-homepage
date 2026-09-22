export async function onRequest({ request }) {
  const keyUrl = new URL('/public-key.asc', request.url)

  try {
    const response = await fetch(keyUrl)

    if (!response.ok) {
      return new Response('PGP public key not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    }

    const keyText = await response.text()

    return new Response(keyText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'inline; filename="public-key.asc"',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new Response('PGP public key not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  }
}
