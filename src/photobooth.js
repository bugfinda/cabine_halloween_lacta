// Main photobooth coordination and camera logic

// Snapshot state
let isSnapshoting = false;
let outputImage = null;

// Snapshot functions
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
					window.outputImage = img;
					isSnapshoting = false;
					window.isSnapshoting = false;
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

// Camera and rendering logic
let videoXOffset = 440;
let machine = "";
let timeoutInterval = null;

document.addEventListener("DOMContentLoaded", () => {
	// Get machine id from URL
	const urlParams = new URLSearchParams(window.location.search);
	machine = urlParams.get("machineId") || localStorage.getItem("machineId");
	window.machine = machine;

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

		// Move to center for rotation
		canvasCtx.translate(canvasElement.width / 2, canvasElement.height / 2);

		// Rotate -90 degrees (π/2 radians)
		canvasCtx.rotate(-Math.PI / 2);

		// flip vertically (selfie cam)
		canvasCtx.scale(-1, 1);

		// Calculate crop dimensions for landscape video to portrait canvas
		// Video is landscape (wider than tall), canvas is portrait (taller than wide)
		const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
		const canvasAspectRatio = canvasElement.height / canvasElement.width; // swapped due to rotation

		let cropWidth, cropHeight, cropX, cropY;
		let drawWidth = canvasElement.height;
		let drawHeight = canvasElement.width;

		if (videoAspectRatio > canvasAspectRatio) {
			// Video is wider relative to canvas - crop horizontally
			cropHeight = videoElement.videoHeight;
			cropWidth = cropHeight * canvasAspectRatio;
			cropX = (videoElement.videoWidth - cropWidth) / 2;
			cropY = 0;
		} else {
			// Video is taller relative to canvas - crop vertically
			cropWidth = videoElement.videoWidth;
			cropHeight = cropWidth / canvasAspectRatio;
			cropX = 0;
			cropY = (videoElement.videoHeight - cropHeight) / 2;
		}

		// (landscape cam) - draw cropped video from center after rotation
		canvasCtx.drawImage(
			videoElement,
			cropX,
			cropY,
			cropWidth,
			cropHeight,
			-drawWidth / 2,
			-drawHeight / 2,
			drawWidth,
			drawHeight
		);

		// Restore the context to its original state
		canvasCtx.restore();

		// Update animations
		updateAnimation();

		// Draw the frame and animated template elements
		drawTemplateElements(canvasCtx);

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

	// Listen for internet connectivity changes
	window.addEventListener("online", () => {
		isOnline = true;
		hasInternetIssue = false;
		console.log("Internet connection restored");
	});

	window.addEventListener("offline", () => {
		isOnline = false;
		hasInternetIssue = true;
		console.log("Internet connection lost");
	});

	let idleTime = 0;

	function resetTimer() {
		idleTime = 0;
	}

	// Idle Timer Interval
	timeoutInterval = setInterval(() => {
		try {
			const callToActionEl = document.getElementById("callToAction");
			if (callToActionEl && getComputedStyle(callToActionEl).display !== "none") {
				idleTime = 0;
				return;
			}

			// Don't increment idle timer if there are internet connectivity issues
			if (!isOnline || hasInternetIssue) {
				idleTime = 0;
				return;
			}
		} catch (e) {
			console.warn("Idle timer visibility check failed:", e);
		}

		idleTime += 1;
		if (idleTime > maxIdleTimer) {
			goBackToStart();
			idleTime = 0;
			clearInterval(timeoutInterval);
		}
	}, 1000);

	// Swipe detection variables
	let touchStartX = 0;
	let touchStartY = 0;
	let touchEndX = 0;
	let touchEndY = 0;
	const minSwipeDistance = 50; // Minimum distance for a swipe
	const maxVerticalDistance = 100; // Maximum vertical distance to still consider it a horizontal swipe

	// Touch event handlers for swipe detection
	document.addEventListener(
		"touchstart",
		(e) => {
			touchStartX = e.changedTouches[0].screenX;
			touchStartY = e.changedTouches[0].screenY;
		},
		{ passive: true }
	);

	document.addEventListener(
		"touchend",
		(e) => {
			touchEndX = e.changedTouches[0].screenX;
			touchEndY = e.changedTouches[0].screenY;
			handleSwipe();
		},
		{ passive: true }
	);

	// Swipe detection function
	function handleSwipe() {
		// Only detect swipes when overlays are visible (template selection mode)
		const overlaysEl = document.getElementById("overlays");
		if (!overlaysEl || getComputedStyle(overlaysEl).display === "none") {
			return;
		}

		const horizontalDistance = touchEndX - touchStartX;
		const verticalDistance = Math.abs(touchEndY - touchStartY);

		// Check if it's a valid horizontal swipe
		if (Math.abs(horizontalDistance) > minSwipeDistance && verticalDistance < maxVerticalDistance) {
			if (horizontalDistance > 0) {
				// Swipe right - go to previous template
				previousTemplate();
			} else {
				// Swipe left - go to next template
				nextTemplate();
			}
		}
	}
});
