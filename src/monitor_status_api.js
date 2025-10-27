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

	// Get tracking timestamps and IDs from localStorage
	const lastCycleStart = localStorage.getItem("lastCycleStart") || null;
	const lastSuccessfulMonitorPing = localStorage.getItem("lastSuccessfulMonitorPing") || null;
	const lastSuccessfulMonitorStatusId = localStorage.getItem("lastSuccessfulMonitorStatusId") || null;

	// Calculate uptime metrics
	const now = Date.now();
	let lastCycleUptimeHrs = null;
	let netUptimeHrs = null;

	// Calculate app uptime: get accurate uptime from Tauri
	try {
		if (window.__TAURI__) {
			const { invoke } = window.__TAURI__.core;
			const uptimeSeconds = await invoke("get_app_uptime_seconds");
			lastCycleUptimeHrs = (uptimeSeconds / 3600).toFixed(2);
		} else if (lastCycleStart) {
			// Fallback to localStorage calculation for non-Tauri environments
			const startTime = new Date(lastCycleStart).getTime();
			if (!isNaN(startTime) && startTime <= now) {
				lastCycleUptimeHrs = ((now - startTime) / (1000 * 60 * 60)).toFixed(2);
			}
		}
	} catch (error) {
		// console.log("Could not get app uptime:", error.message);
		// Fallback to localStorage calculation
		if (lastCycleStart) {
			try {
				const startTime = new Date(lastCycleStart).getTime();
				if (!isNaN(startTime) && startTime <= now) {
					lastCycleUptimeHrs = ((now - startTime) / (1000 * 60 * 60)).toFixed(2);
				}
			} catch (error) {
				// Invalid timestamp, leave as null
			}
		}
	}

	// Calculate network uptime: hours since last successful communication
	if (lastSuccessfulMonitorPing) {
		try {
			const lastPingTime = new Date(lastSuccessfulMonitorPing).getTime();
			if (!isNaN(lastPingTime) && lastPingTime <= now) {
				netUptimeHrs = ((now - lastPingTime) / (1000 * 60 * 60)).toFixed(2);
			}
		} catch (error) {
			// Invalid timestamp, leave as null
		}
	}

	const payload = {
		properties: JSON.stringify({
			monitor_status: "Ping Cabine Halloween Lacta",
			description: "ping status",
			lat: lat,
			lon: lon,
			app_version: appVersion,
			hardware: hardware,
			timestamp: new Date().toISOString(),
			app_start_time: lastCycleStart,
			last_successful_monitor_ping: lastSuccessfulMonitorPing,
			last_successful_monitor_status_id: lastSuccessfulMonitorStatusId,
			app_uptime_hrs: lastCycleUptimeHrs,
			net_uptime_hrs: netUptimeHrs,
		}),
	};

	try {
		const response = await api.post(`/event/${EVENT_ID}/monitor/${MONITOR_ID}/monitorStatus`, payload, {
			headers: {
				Authorization: AUTH_TOKEN,
			},
		});

		// Store timestamp and monitor_status_id from successful response
		// This creates an audit trail of successful communications
		const successfulPingTime = new Date().toISOString();
		localStorage.setItem("lastSuccessfulMonitorPing", successfulPingTime);

		// Extract and store the monitor_status_id from the API response
		if (response.data && response.data.monitor_status_id) {
			localStorage.setItem("lastSuccessfulMonitorStatusId", response.data.monitor_status_id);
			console.log("Monitor ping successful at:", successfulPingTime, "| ID:", response.data.monitor_status_id);
		} else {
			console.log("Monitor ping successful at:", successfulPingTime, "| No ID in response");
		}

		return true;
	} catch (error) {
		// console.error("Error sending monitor status ping:", error.response?.data || error.message);
		return false;
	}
}
