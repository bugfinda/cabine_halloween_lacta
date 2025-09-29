const WIDTH = 1920;
const HEIGHT = 1080;

const maxIdleTimer = 90; // seconds

const overlayPaths = {
	0: "./templates/m-1.png",
	1: "./templates/m-2.png",
	2: "./templates/m-3.png",
	3: "./templates/m-1.png",
};
let overlayIndex = 0;

// Preload the overlays
let overlays = Object.values(overlayPaths).map((path) => {
	let img = new Image();
	img.src = path;
	return img;
});

let overlay = overlays[overlayIndex];

function pickTemplate(n) {
	overlayIndex = n;
	overlay = overlays[n];

	setTimeout(() => {
		document.getElementById("overlays").style.display = "flex";
		document.getElementById("callToAction").style.display = "none";
	}, 100);
}

function goBackToCallToAction() {
	document.getElementById("overlays").style.display = "none";
	document.getElementById("callToAction").style.display = "block";
}

let isSnapshoting = false;
let shouldUnmirror = false;

function takeSnapshot() {
	if (isSnapshoting) return;
	isSnapshoting = true;

	document.getElementById("overlays").style.display = "none";

	let count = 3;
	let counter = setInterval(snapshotTimer, 1000);

	const snapshotTimerContainer = document.getElementById("snapshotTimer");
	snapshotTimerContainer.style.display = "flex";
	snapshotTimerContainer.innerHTML = count;

	function snapshotTimer() {
		count = count - 1;

		snapshotTimerContainer.innerHTML = count;

		if (count <= 0) {
			snapshotTimerContainer.style.display = "none";

			shouldUnmirror = true;

			setTimeout(() => {
				clearInterval(counter);

				let img = new Image();
				img.src = document.getElementById("output_canvas").toDataURL("image/jpeg");
				img.id = "resultImg";
				img.classList.add("result-image");
				img.onload = () => {
					document.getElementById("resultContainer").style.display = "flex";
					document.getElementById("resultContainer").appendChild(img);
					outputImage = img;
					isSnapshoting = false;
					shouldUnmirror = false;
				};
				return;
			}, 200);
		}
	}
}

let debounceTimer;
let canUpload = true;
function confirmSnapshot() {
	if (!canUpload) return;
	canUpload = false;

	addToGallery();

	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		canUpload = true;
	}, 3000);
}

function cancelSnapshot() {
	document.getElementById("resultContainer").removeChild(document.getElementById("resultImg"));
	document.getElementById("resultContainer").style.display = "none";
	document.getElementById("overlays").style.display = "flex";
}

function addToGallery() {
	const canvasCopy = document.createElement("canvas");
	const ctx = canvasCopy.getContext("2d");

	canvasCopy.width = outputImage.height;
	canvasCopy.height = outputImage.width;

	ctx.translate(canvasCopy.width / 2, canvasCopy.height / 2);
	ctx.rotate((90 * Math.PI) / 180);
	ctx.drawImage(outputImage, -outputImage.width / 2, -outputImage.height / 2, outputImage.width, outputImage.height);

	const outputURI = canvasCopy.toDataURL("image/jpeg");
	uploadPhoto(outputURI);
}

function uploadPhoto(photo) {
	const urlParams = new URLSearchParams(window.location.search);
	const token = urlParams.get("token") ?? "76ce6400-8de8-11ed-916c-c7a5caa67b1a";
	let user_id = urlParams.get("user_id") ?? "e132ad70-f0f5-11ea-a6b6-df55caaa3a05";
	user_id = window.userName;

	let byteString = atob(photo.split(",")[1]);
	let ab = new ArrayBuffer(byteString.length);
	let ia = new Uint8Array(ab);
	for (let i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}
	let blob = new Blob([ia], {
		type: "image/jpeg",
	});
	let file = new File([blob], `AmstelBBB_${new Date().toDateString()}.jpg`, {
		type: "image/jpeg",
	});

	let formData = new FormData();
	formData.append("file", file);
	formData.append("description", "Photobooth picture");
	formData.append("tag", "Photobooth");
	formData.append(
		"properties",
		JSON.stringify({ machine: localStorage.getItem("machineId") ? localStorage.getItem("machineId") : machine })
	);
	formData.append("public", true);

	if (file.size > 10) {
		try {
			showSpinner();
			api
				.post(
					`event/d549ce10-9d4a-11f0-91ce-c982733c9978/activity/e8777910-9d4a-11f0-91ce-c982733c9978/materialUpload`,
					formData,
					{
						headers: {
							"Content-Type": "multipart/form-data",
							Authorization: token,
						},
					}
				)
				.then((response) => {
					let qrCodeValue = `https://${"halloween-lacta.blitzar.com.br"}/#/hosted/?material=${response.data.url}`;
					new QRCode(document.getElementById("qrcode"), {
						text: qrCodeValue,
						width: 300,
						height: 300,
						colorDark: "#000000",
						colorLight: "#ffffff",
						correctLevel: QRCode.CorrectLevel.L,
					});
					document.getElementById("resultContainer").style.display = "none";
					hideSpinner();
					document.getElementById("output_canvas").style.display = "none";
					document.getElementById("qrcode").style.display = "flex";
					document.getElementById("qrTimerControls").style.display = "flex";
					document.getElementById("endBackPanel").style.display = "flex";

					// Start QR code timer
					startQrTimer();
				})
				.catch((err) => {
					document.getElementById("resultContainer").style.display = "none";
					hideSpinner();
					console.error(err);
					// error panel
					document.getElementById("notificationPanel").style.display = "flex";
					document.getElementById("notification").innerHTML =
						"Falha no serviço. <br>Por favor tente<br> novamente em instantes.";
				});
		} catch (error) {
			document.getElementById("resultContainer").style.display = "none";
			hideSpinner();
			console.error(error);
			// error panel
			document.getElementById("notificationPanel").style.display = "flex";
			document.getElementById("notification").innerHTML =
				"Falha no serviço. <br>Por favor tente<br> novamente em instantes";
		}
	} else {
		// error panel
		document.getElementById("notificationPanel").style.display = "flex";
		document.getElementById("notification").innerHTML =
			"Falha no serviço. <br>Por favor tente<br> novamente em instantes";
		return;
	}
}

function goBackToStart() {
	stopQrTimer();
	let url = "./photobooth.html";
	if (machine) {
		url += "?machineId=" + machine;
	}
	location.href = url;
}

function startQrTimer() {
	if (isQrTimerActive) return;

	isQrTimerActive = true;
	qrTimeRemaining = qrTotalTime;
	updateProgressBar();

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
	qrTimeRemaining += 10; // Add 10 seconds
	qrTotalTime += 10; // Also increase total time for progress calculation
	updateProgressBar();

	// Visual feedback - briefly highlight the button
	const btn = document.getElementById("addTimeBtn");
	if (btn) {
		btn.style.background = "#4CAF50";
		btn.style.color = "white";
		setTimeout(() => {
			btn.style.background = "rgba(255, 255, 255, 0.9)";
			btn.style.color = "#da291c";
		}, 300);
	}
}

let videoXOffset = 440;

let machine = "";
document.addEventListener("DOMContentLoaded", () => {
	// Get machine id from URL
	const urlParams = new URLSearchParams(window.location.search);
	machine = urlParams.get("machineId") || localStorage.getItem("machineId");

	const cameraIdx = parseInt(localStorage.getItem("cameraIdx")) || 0;

	const videoElement = document.getElementById("input_video");
	const canvasElement = document.getElementById("output_canvas");
	const canvasCtx = canvasElement.getContext("2d", { willReadFrequently: true });

	// list all camera devices
	const listCameraDevices = async () => {
		const devices = await navigator.mediaDevices.enumerateDevices();
		const videoDevices = devices.filter((device) => device.kind === "videoinput");
		return videoDevices;
	};

	listCameraDevices().then((videoDevices) => {
		if (videoDevices[cameraIdx]) {
			navigator.mediaDevices
				.getUserMedia({
					video: {
						width: WIDTH,
						height: HEIGHT,
						deviceId: videoDevices[cameraIdx].deviceId,
					},
				})
				.then((stream) => {
					videoElement.srcObject = stream;
					videoElement.onloadedmetadata = () => {
						videoElement.play();
						draw();
					};
				})
				.catch((err) => {
					console.error("An error occurred: " + err);
				});
		} else if (videoDevices[0]) {
			navigator.mediaDevices
				.getUserMedia({
					video: {
						width: WIDTH,
						height: HEIGHT,
						deviceId: videoDevices[0].deviceId,
					},
				})
				.then((stream) => {
					videoElement.srcObject = stream;
					videoElement.onloadedmetadata = () => {
						videoElement.play();
						draw();
					};
				})
				.catch((err) => {
					console.error("An error occurred: " + err);
				});
		} else {
			alert("No camera found");
		}
	});

	function draw() {
		requestAnimationFrame(draw);
		canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

		canvasCtx.save();

		// flip vertically (selfie cam)
		canvasCtx.scale(-1, 1);
		canvasCtx.translate(-canvasElement.width, 0);

		// flip horizontally (selfie cam)
		if (shouldUnmirror) {
			canvasCtx.scale(1, -1);
			canvasCtx.translate(0, -canvasElement.height);
		}

		// (landscape cam)
		// canvasCtx.drawImage(videoElement, 0, videoXOffset, canvasElement.width, canvasElement.height);
		canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

		// Restore the context to its original state
		canvasCtx.restore();

		// Draw the overlay without rotating
		canvasCtx.drawImage(overlay, 0, 0, canvasElement.width, canvasElement.height);

		// Draw the userName label
		canvasCtx.restore();
	}

	// disable context menu
	document.addEventListener("contextmenu", (event) => event.preventDefault());

	// prevent pinch zoom
	document.addEventListener(
		"touchmove",
		function (e) {
			if (e.touches.length > 1) {
				e.preventDefault();
			}
		},
		{ passive: false }
	);

	// Listen for user idle
	document.addEventListener("mousemove", resetTimer);
	document.addEventListener("keypress", resetTimer);
	document.addEventListener("touchstart", resetTimer);

	let idleTime = 0;

	function resetTimer() {
		idleTime = 0;
	}

	// Timer Interval
	timeoutInterval = setInterval(() => {
		idleTime += 1;
		if (idleTime > maxIdleTimer) {
			goBackToStart();
			idleTime = 0;
			clearInterval(timeoutInterval);
		}
	}, 1000);

	document.getElementById("videoXOffset").addEventListener("input", (event) => {
		videoXOffset = -parseInt(event.target.value);
	});
});

let timeoutInterval = null;

// QR Code Timer variables
let qrTimer = null;
let qrTimeRemaining = 30; // seconds
let qrTotalTime = 30;
let isQrTimerActive = false;
