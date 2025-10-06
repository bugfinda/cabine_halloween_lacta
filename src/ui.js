// UI management functions (notifications, timers, QR code)

// Internet connectivity tracking
let isOnline = navigator.onLine;
let hasInternetIssue = false;

// QR code timer state
let qrTimer = null;
let qrTimeRemaining = 16; // seconds
let qrTotalTime = 16;
let isQrTimerActive = false;
let addTimeClickCount = 0; // Track number of + tempo button clicks
const maxAddTimeClicks = 5; // Maximum allowed clicks

function goBackToCallToAction() {
	document.getElementById("overlays").style.display = "none";
	document.getElementById("callToAction").style.display = "block";
}

function dismissNotification() {
	document.getElementById("notificationPanel").style.display = "none";
	// Clear internet issue flag when notification is dismissed
	hasInternetIssue = false;
	// Restore overlays to allow template switching
	document.getElementById("overlays").style.display = "flex";
	document.getElementById("output_canvas").style.display = "block";
}

function goBackToStart() {
	stopQrTimer();
	let url = "./photobooth.html";
	if (window.machine) {
		url += "?machineId=" + window.machine;
	}
	location.href = url;
}

function startQrTimer() {
	if (isQrTimerActive) return;

	isQrTimerActive = true;
	qrTimeRemaining = qrTotalTime;
	addTimeClickCount = 0; // Reset the click counter for new session
	updateProgressBar();

	// Reset the + tempo button appearance
	const btn = document.getElementById("addTimeBtn");
	if (btn) {
		btn.style.background = "rgba(255, 255, 255, 0.9)";
		btn.style.color = "#da291c";
		btn.style.cursor = "pointer";
		btn.innerHTML = `+ tempo (${maxAddTimeClicks} restantes)`;
	}

	qrTimer = setInterval(() => {
		qrTimeRemaining -= 0.1;

		if (qrTimeRemaining <= 0) {
			stopQrTimer();
			goBackToStart();
		} else {
			updateProgressBar();
		}
	}, 100); // Update every 100ms for smooth animation
}

function stopQrTimer() {
	if (qrTimer) {
		clearInterval(qrTimer);
		qrTimer = null;
	}
	isQrTimerActive = false;
}

function updateProgressBar() {
	const progressPercent = (qrTimeRemaining / qrTotalTime) * 100;
	const progressBar = document.getElementById("qrProgressBar");
	if (progressBar) {
		progressBar.style.width = Math.max(0, progressPercent) + "%";

		// Change color as time runs out
		if (progressPercent > 50) {
			progressBar.style.background = "linear-gradient(90deg, #4CAF50, #8BC34A)";
		} else if (progressPercent > 25) {
			progressBar.style.background = "linear-gradient(90deg, #FF9800, #FFC107)";
		} else {
			progressBar.style.background = "linear-gradient(90deg, #F44336, #FF5722)";
		}
	}
}

function addExtraTime() {
	// Check if maximum clicks reached
	if (addTimeClickCount >= maxAddTimeClicks) {
		// Visual feedback - button is disabled
		const btn = document.getElementById("addTimeBtn");
		if (btn) {
			btn.style.background = "rgba(128, 128, 128, 0.5)";
			btn.style.color = "#666";
			btn.style.cursor = "not-allowed";
			btn.innerHTML = "Limite atingido";

			// Show brief message
			setTimeout(() => {
				btn.innerHTML = "+ tempo";
			}, 2000);
		}
		return;
	}

	addTimeClickCount++; // Increment click counter
	qrTimeRemaining += 10; // Add 10 seconds
	qrTotalTime += 10; // Also increase total time for progress calculation
	updateProgressBar();

	// Visual feedback - briefly highlight the button
	const btn = document.getElementById("addTimeBtn");
	if (btn) {
		btn.style.background = "#4CAF50";
		btn.style.color = "white";

		// Update button text to show remaining clicks
		const remainingClicks = maxAddTimeClicks - addTimeClickCount;
		if (remainingClicks > 0) {
			btn.innerHTML = `+ tempo (${remainingClicks} restantes)`;
		} else {
			btn.innerHTML = "Último + tempo";
		}

		setTimeout(() => {
			if (addTimeClickCount < maxAddTimeClicks) {
				btn.style.background = "rgba(255, 255, 255, 0.9)";
				btn.style.color = "#da291c";
				btn.innerHTML = `+ tempo (${maxAddTimeClicks - addTimeClickCount} restantes)`;
			} else {
				// Button reached limit
				btn.style.background = "rgba(128, 128, 128, 0.5)";
				btn.style.color = "#666";
				btn.style.cursor = "not-allowed";
				btn.innerHTML = "Limite atingido";
			}
		}, 300);
	}
}
