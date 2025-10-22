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
		// console.log("Could not get location, using default:", error.message);
	}

	// Get app version from Tauri
	let appVersion = "unknown";
	try {
		if (window.__TAURI__) {
			const { getVersion } = window.__TAURI__.app;
			appVersion = await getVersion();
		}
	} catch (error) {
		// console.log("Could not get app version:", error.message);
	}

	// Collect hardware profiling information
	const hardware = {
		user_agent: navigator.userAgent,
		screen_width: screen.width,
		screen_height: screen.height,
		screen_color_depth: screen.colorDepth,
		screen_pixel_ratio: window.devicePixelRatio || 1,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		language: navigator.language,
		hardware_concurrency: navigator.hardwareConcurrency || "unknown",
		max_touch_points: navigator.maxTouchPoints || 0,
	};

	// Try to get platform-specific info from Tauri
	try {
		if (window.__TAURI__) {
			const { platform, arch, type: osType, version } = window.__TAURI__.os;
			if (platform) hardware.platform = await platform();
			if (arch) hardware.architecture = await arch();
			if (osType) hardware.os_type = await osType();
			if (version) hardware.os_version = await version();
		}
	} catch (error) {
		// console.log("Could not get OS info:", error.message);
	}

	// Generate or retrieve persistent hardware ID
	let hardwareId = localStorage.getItem("hardwareId");
	if (!hardwareId) {
		// Generate hash from hardware components for unique ID
		const components = [
			hardware.user_agent,
			`${hardware.screen_width}x${hardware.screen_height}x${hardware.screen_color_depth}`,
			hardware.platform || "",
			hardware.architecture || "",
			hardware.os_type || "",
		];
		const dataString = components.join("|");
		const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(dataString));
		hardwareId = Array.from(new Uint8Array(hash))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
			.substring(0, 32);
		localStorage.setItem("hardwareId", hardwareId);
	}
	hardware.id = hardwareId;

	const payload = {
		properties: JSON.stringify({
			monitor_status: "Ping Cabine Halloween Lacta",
			description: "ping status",
			lat: lat,
			lon: lon,
			app_version: appVersion,
			hardware: hardware,
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
		// console.error("Error sending monitor status ping:", error.response?.data || error.message);
		return false;
	}
}
