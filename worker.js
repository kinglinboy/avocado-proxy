// cloudflare-worker-proxy-advanced.js
// 增强版代理脚本，支持更多功能

async function searchInterface() {
  const text = `Hello`
  return text
}

export default {
  async fetch(request, env, ctx) {
    return new Response(await searchInterface(), {
					headers: {
					  'Content-Type': 'text/html; charset=UTF-8',
					},
				});
  }
};
