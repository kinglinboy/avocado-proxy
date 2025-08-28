export default {
	
	
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		const avocado_admin_host = 'avocado-bo-dev.weyatech.cn';
		const avocado_intake_host = 'avocado-customer-dev.weyatech.cn';
		const avocado_customer_host = 'avocado-customer-dev.weyatech.cn';

		const admin_host = `${env.admin_host}`;
		const intake_host = `${env.intake_host}`;
		const customer_host = `${env.customer_host}`;

		const url_host = url.hostname
		if(customer_host === url_host){
			url.hostname = avocado_customer_host;
		}else if(intake_host === url_host){
			url.hostname = avocado_intake_host;
		} else {
			url.avocado_admin_host = avocado_intake_host;
		}
		
		console.log(`path:${url.pathname}: search:${url.searchParams}`);
		const newRequest = new Request(url, request);
		return fetch(newRequest);
	},
};
