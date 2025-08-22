// cloudflare-worker-proxy-advanced.js
// 增强版代理脚本，支持更多功能

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetHost = 'avocado-bo-dev.weyatech.cn';
    
    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
      return this.handleOptions(request);
    }
    
    // 创建代理请求的 URL
    const proxyUrl = new URL(url.pathname + url.search, `https://${targetHost}`);
    
    // 复制并修改 headers
    const headers = this.processHeaders(request.headers, targetHost, url);
    
    try {
      // 创建代理请求
      const proxyRequest = new Request(proxyUrl.toString(), {
        method: request.method,
        headers: headers,
        body: request.body,
        redirect: 'manual'
      });
      
      // 发送请求并获取响应
      const response = await fetch(proxyRequest);
      
      // 处理响应
      return this.processResponse(response, url);
      
    } catch (error) {
      return this.handleError(error);
    }
  },
  
  // 处理请求 headers
  processHeaders(originalHeaders, targetHost, originalUrl) {
    const headers = new Headers(originalHeaders);
    
    // 设置代理相关 headers
    headers.set('Host', targetHost);
    headers.set('X-Forwarded-For', originalHeaders.get('CF-Connecting-IP') || '');
    headers.set('X-Forwarded-Proto', originalUrl.protocol.replace(':', ''));
    headers.set('X-Forwarded-Host', originalUrl.host);
    headers.set('X-Real-IP', originalHeaders.get('CF-Connecting-IP') || '');
    
    // 移除 Cloudflare 特定的 headers
    const cfHeaders = ['CF-Connecting-IP', 'CF-Ray', 'CF-Visitor', 'CF-Requested-With'];
    cfHeaders.forEach(header => headers.delete(header));
    
    return headers;
  },
  
  // 处理响应
  processResponse(response, originalUrl) {
    const responseHeaders = new Headers(response.headers);
    
    // 设置 CORS headers
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
    
    // 处理重定向
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location');
      if (location) {
        const redirectUrl = this.processRedirectUrl(location, originalUrl);
        return new Response(null, {
          status: response.status,
          headers: {
            'Location': redirectUrl,
            ...Object.fromEntries(responseHeaders)
          }
        });
      }
    }
    
    // 处理 HTML 内容中的链接替换（如果需要）
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('text/html')) {
      return this.processHtmlResponse(response, responseHeaders, originalUrl);
    }
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  },
  
  // 处理重定向 URL
  processRedirectUrl(location, originalUrl) {
    if (location.startsWith('http')) {
      // 如果是绝对 URL，检查是否是目标域名
      const locationUrl = new URL(location);
      if (locationUrl.hostname === 'avocado-bo-dev.weyatech.cn') {
        // 将目标域名的重定向转换为当前域名
        return `${originalUrl.origin}${locationUrl.pathname}${locationUrl.search}`;
      }
      return location;
    } else {
      // 相对路径，直接使用
      return `${originalUrl.origin}${location}`;
    }
  },
  
  // 处理 HTML 响应（替换内部链接）
  async processHtmlResponse(response, headers, originalUrl) {
    const html = await response.text();
    
    // 替换 HTML 中的绝对链接
    const processedHtml = html.replace(
      /https:\/\/avocado-bo-dev\.weyatech\.cn/g,
      originalUrl.origin
    );
    
    return new Response(processedHtml, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
  },
  
  // 处理 OPTIONS 请求
  handleOptions(request) {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      }
    });
  },
  
  // 处理错误
  handleError(error) {
    console.error('Proxy error:', error);
    
    return new Response(JSON.stringify({
      error: 'Proxy request failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
