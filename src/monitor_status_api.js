const EVENT_ID = "d549ce10-9d4a-11f0-91ce-c982733c9978";
const AUTH_TOKEN = "76ce6400-8de8-11ed-916c-c7a5caa67b1a";
const MONITOR_ID = "3f23b210-adc2-11f0-871b-d3fee972e84b";

async function pingMonitorStatus() {
	// Get current geolocation
	let lat = "-23.627245"; // default
	let lon = "-46.7194049"; // default

	try {
		const position = await new Promise((resolve, reject) => {
			if (!navigator.geolocation) {
				reject(new Error("Geolocation is not supported by this browser."));
			} else {
				navigator.geolocation.getCurrentPosition(resolve, reject);
			}
		});

		lat = position.coords.latitude.toString();
		lon = position.coords.longitude.toString();
	} catch (error) {
		console.log("Could not get location, using default:", error.message);
	}

	const payload = {
		properties: JSON.stringify({
			monitor_status: "Ping Cabine Halloween Lacta",
			description: "ping status",
			lat: lat,
			lon: lon,
			timestamp: new Date().toISOString(),
		}),
	};

	try {
		await api.post(`/event/${EVENT_ID}/monitor/${MONITOR_ID}/monitorStatus`, payload, {
			headers: {
				Authorization: AUTH_TOKEN,
			},
		});
		return true;
	} catch (error) {
		console.error("Error sending monitor status ping:", error.response?.data || error.message);
		return false;
	}
}
