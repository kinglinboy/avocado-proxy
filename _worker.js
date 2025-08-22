export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		url.hostname = 'avocado-bo-dev.weyatech.cn';
		console.log(`path:${url.pathname}: search:${url.searchParams}`);
		const newRequest = new Request(url, request);
		return fetch(newRequest);
	},
};
