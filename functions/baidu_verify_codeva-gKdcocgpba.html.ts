// Cloudflare Pages Function to serve the 百度站长 verification file at
// the EXACT URL Baidu expects. Needed because CF Pages otherwise
// 308-redirects `/<name>.html` → `/<name>` (auto-strip extension), and
// Baidu's verifier doesn't always follow redirects.
//
// Token is the contents Baidu issued for tommickey.cn — public anyway
// (visible to anyone who fetches the URL).
export const onRequest: PagesFunction = () =>
  new Response('d295b36356ced4988562ea0689602bf5', {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=600',
    },
  });
