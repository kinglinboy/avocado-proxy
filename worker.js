// cloudflare-worker-proxy-advanced.js
// 增强版代理脚本，支持更多功能

export default {
  async fetch(request, env, ctx) {
     const url = new URL(request.url);
     const targetHost = 'avocado-bo-dev.weyatech.cn';
     const proxyUrl = new URL(url.pathname + url.search, `https://${targetHost}`);
    
    const headers = new Headers(request.headers);
    headers.set('Host', targetHost);
    headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || '');
    headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
    headers.set('X-Forwarded-Host', url.host);
    
    headers.delete('CF-Connecting-IP');
    headers.delete('CF-Ray');
    headers.delete('CF-Visitor');


    const proxyRequest = new Request(proxyUrl.toString(), {
        method: request.method,
        headers: headers,
        body: request.body,
        redirect: 'manual'
      });
      
    const response = await fetch(proxyRequest);

    const responseHeaders = new Headers(response.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
  }
};
