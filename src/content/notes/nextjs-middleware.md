---
title: Nextjs Middleware
draft: true
publishedAt: 2025-07-11
tags: []
---

# Nextjs Middleware

request -> middleware -> (modified request or modified response)

## Code

```ts
// Example of default export
export default function middleware(request) {
  // Middleware logic
    if (url.searchParams.has('new')) {
    const val = url.searchParams.get('new')
    url.searchParams.delete('new')

    if (val === 'true') {
      // Redirect to path with --new suffix and no query parameters
      const newUrl = new URL(url.pathname + '--new', url.origin)
      return NextResponse.redirect(newUrl, 308)
    } else {
      return NextResponse.redirect(url, 308)
    }
  }


  // Check request
   if (url.pathname.startsWith('/api/')) {
    const path = req.nextUrl.pathname.replace('/api/', '')

    if (pathsToSkip.includes(path)) {
      return NextResponse.next()
    }
    // Redirect to proxied URL
    return new Response('Permanent Redirect', {
      status: 308,
      headers: {
        location: getProxiedRequestUrl(req, path),
      },
    })
  }
}

// request -> if match -> run middleware
export const config = {
  matcher: '/about/:path*',
};
```

