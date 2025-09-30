const axios = window.axios;

const api = axios.create({
	baseURL: "https://backend.blitzar.com.br/api",
});

api.interceptors.request.use(async (config) => {
	//const token = store.state.user.token;
	const { token } = { token: null };

	if (token && token.length && store.state.template.accessConfig.accessControl) {
		config.headers.Authorization = `${token}`;
	} else {
	}
	return config;
});

api.interceptors.response.use(
	(response) => {
		if (response.status === 200 || response.status === 201) {
		}
		return response;
	},
	(error) => {
		if (error.response.status) {
			switch (error.response.status) {
				case 400:
					if (error.response.data ? error.response.data.error == "Authorization unidentified" : false) {
						console.log("Intercept Authorization error:");
					}
					return error;

				case 403: //unauthorized
					if (error.response.data ? error.response.data.error == "Authorization unidentified" : false) {
						console.log("unauthorized");
					}
					break;
				case 440: //session expired
					if (error.response.data ? error.response.data.error == "Authorization unidentified" : false) {
						console.log("session expired");
					}
					break;
				case 404:
					alert("page not exist");
					break;
				case 502:
					break;

				default:
					return error;
			}
		}
		return error.response;
	}
);
