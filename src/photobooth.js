const WIDTH = 1920;
const HEIGHT = 1080;

const maxIdleTimer = 90; // seconds

// Frame is common to all templates
const framePath = "./templates/frame.png";
let frameImage = new Image();
frameImage.src = framePath;

// Template-specific overlays (without frame)
const templatePaths = {
	0: "./templates/m-1.png",
	1: "./templates/m-2.png", // Fallback for m-2
	2: "./templates/m-3.png",
};

// m-2 multi-element paths
const m2ElementPaths = {
	topLeft: "./templates/m-2-top-left.png",
	topRight: "./templates/m-2-top-right.png",
	bottomLeft: "./templates/m-2-bottom-left.png",
	bottomRight: "./templates/m-2-bottom-right.png",
};

let templateIndex = 0;

// Preload the template overlays
let templateOverlays = Object.values(templatePaths).map((path) => {
	let img = new Image();
	img.src = path;
	return img;
});

// Preload m-2 elements
let m2Elements = {};
Object.keys(m2ElementPaths).forEach((key) => {
	m2Elements[key] = new Image();
	m2Elements[key].src = m2ElementPaths[key];
});

let currentTemplate = templateOverlays[templateIndex];

// Animation system for template-specific effects
const animationConfigs = {
	0: {
		// Template m-1: Slide Up
		type: "slideUp",
		duration: 300,
		elements: ["template"], // Elements to animate
	},
	1: {
		// Template m-2: Multi-element slide from corners
		type: "multiSlideIn",
		duration: 500,
		elements: ["topLeft", "topRight", "bottomLeft", "bottomRight"],
		staggerDelay: 30, // Delay between each element starting
	},
	2: {
		// Template m-3: Bounce scale
		type: "bounceScale",
		duration: 500,
		elements: ["template"],
	},
};

// Animation state
let isAnimating = false;
let animationStartTime = 0;
let currentAnimationConfig = null;
let targetTemplate = null;
let animationState = {
	scale: 1,
	rotation: 0,
	translateX: 0,
	translateY: 0,
	alpha: 1,
};

// Multi-element animation states (for m-2)
let multiElementStates = {
	topLeft: { translateX: 0, translateY: 0, alpha: 1 },
	topRight: { translateX: 0, translateY: 0, alpha: 1 },
	bottomLeft: { translateX: 0, translateY: 0, alpha: 1 },
	bottomRight: { translateX: 0, translateY: 0, alpha: 1 },
};

function previousTemplate() {
	templateIndex = templateIndex - 1;
	if (templateIndex < 0) {
		templateIndex = templateOverlays.length - 1;
	}
	targetTemplate = templateOverlays[templateIndex];
	currentAnimationConfig = animationConfigs[templateIndex];

	startTemplateAnimation();
}

function nextTemplate() {
	templateIndex = templateIndex + 1;
	if (templateIndex >= templateOverlays.length) {
		templateIndex = 0;
	}
	targetTemplate = templateOverlays[templateIndex];
	currentAnimationConfig = animationConfigs[templateIndex];

	startTemplateAnimation();
}

function pickTemplate() {
	templateIndex = Math.floor(Math.random() * templateOverlays.length);
	targetTemplate = templateOverlays[templateIndex];
	currentAnimationConfig = animationConfigs[templateIndex];

	startTemplateAnimation();

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
					isSnapshoting = false;
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

function startTemplateAnimation() {
	isAnimating = true;
	animationStartTime = performance.now();
	// Reset animation state
	animationState = {
		scale: 0,
		rotation: 0,
		translateX: 0,
		translateY: 0,
		alpha: 0,
	};

	// Reset multi-element states for m-2
	if (currentAnimationConfig?.type === "multiSlideIn") {
		Object.keys(multiElementStates).forEach((key) => {
			multiElementStates[key] = { translateX: 0, translateY: 0, alpha: 0 };
		});
	}
}

// Easing functions
const easingFunctions = {
	easeOutBack: (t) => {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
	},
	easeOutBounce: (t) => {
		const n1 = 7.5625;
		const d1 = 2.75;
		if (t < 1 / d1) {
			return n1 * t * t;
		} else if (t < 2 / d1) {
			return n1 * (t -= 1.5 / d1) * t + 0.75;
		} else if (t < 2.5 / d1) {
			return n1 * (t -= 2.25 / d1) * t + 0.9375;
		} else {
			return n1 * (t -= 2.625 / d1) * t + 0.984375;
		}
	},
	easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
	easeOutElastic: (t) => {
		const c4 = (2 * Math.PI) / 3;
		return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
	},
};

// Animation type implementations
const animationTypes = {
	slideUp: (progress) => {
		const eased = easingFunctions.easeOutBack(progress);
		const translateX = (1 - eased) * HEIGHT * 0.5; // Slide up from bottom
		return { scale: 1, rotation: 0, translateX, translateY: 0, alpha: Math.min(progress * 2, 1) };
	},
	multiSlideIn: (progress, elementKey, staggerDelay, duration) => {
		// Calculate staggered progress for each element
		const elementOrder = { topLeft: 0, topRight: 1, bottomLeft: 2, bottomRight: 3 };
		const elementIndex = elementOrder[elementKey] || 0;
		const staggerOffset = (elementIndex * staggerDelay) / duration;
		const adjustedProgress = Math.max(0, Math.min(1, (progress - staggerOffset) / (1 - staggerOffset * 3)));

		if (adjustedProgress <= 0) {
			return { translateX: 0, translateY: 0, alpha: 0 };
		}

		const eased = easingFunctions.easeInOutQuad(adjustedProgress);

		// Calculate slide distances from respective corners
		let startX = 0,
			startY = 0;
		switch (elementKey) {
			case "topLeft":
				startX = -WIDTH * 0.6; // Slide from left
				startY = -HEIGHT * 0.6; // Slide from top
				break;
			case "topRight":
				startX = WIDTH * 0.6; // Slide from right
				startY = -HEIGHT * 0.6; // Slide from top
				break;
			case "bottomLeft":
				startX = -WIDTH * 0.6; // Slide from left
				startY = HEIGHT * 0.6; // Slide from bottom
				break;
			case "bottomRight":
				startX = WIDTH * 0.6; // Slide from right
				startY = HEIGHT * 0.6; // Slide from bottom
				break;
		}

		const translateX = startX * (1 - eased);
		const translateY = startY * (1 - eased);
		const alpha = Math.min(adjustedProgress * 2, 1);

		return { translateX, translateY, alpha };
	},
	bounceScale: (progress) => {
		const scale = easingFunctions.easeOutBounce(progress);
		return { scale, rotation: 0, translateX: 0, translateY: 0, alpha: Math.min(progress * 1.5, 1) };
	},
	fadeFloat: (progress) => {
		const scale = easingFunctions.easeInOutQuad(progress);
		const translateY = (1 - progress) * -50; // Float up effect
		const alpha = easingFunctions.easeOutElastic(progress);
		return { scale, rotation: 0, translateX: 0, translateY, alpha };
	},
};

function updateAnimation() {
	if (!isAnimating || !currentAnimationConfig) return;

	const currentTime = performance.now();
	const elapsed = currentTime - animationStartTime;
	const progress = Math.min(elapsed / currentAnimationConfig.duration, 1);

	// Handle multi-element animations (m-2)
	if (currentAnimationConfig.type === "multiSlideIn") {
		currentAnimationConfig.elements.forEach((elementKey) => {
			const elementState = animationTypes.multiSlideIn(
				progress,
				elementKey,
				currentAnimationConfig.staggerDelay,
				currentAnimationConfig.duration
			);
			multiElementStates[elementKey] = elementState;
		});
	} else {
		// Handle single-element animations
		const animationType = animationTypes[currentAnimationConfig.type];
		if (animationType) {
			animationState = animationType(progress);
		}
	}

	// Complete animation
	if (progress >= 1) {
		isAnimating = false;
		if (currentAnimationConfig.type === "multiSlideIn") {
			// Reset multi-element states to final positions
			currentAnimationConfig.elements.forEach((elementKey) => {
				multiElementStates[elementKey] = { translateX: 0, translateY: 0, alpha: 1 };
			});
		} else {
			animationState = { scale: 1, rotation: 0, translateX: 0, translateY: 0, alpha: 1 };
		}
		currentTemplate = targetTemplate;
		targetTemplate = null;
	}
}

function drawTemplateElements(ctx) {
	// Update animation state
	updateAnimation();

	// Handle m-2 multi-element animation
	if (templateIndex === 1 && (isAnimating || currentAnimationConfig?.type === "multiSlideIn")) {
		// Draw each m-2 element separately at natural size, anchored to corners
		Object.keys(m2Elements).forEach((elementKey) => {
			const element = m2Elements[elementKey];
			const state = multiElementStates[elementKey];

			if (element && element.complete && state.alpha > 0) {
				ctx.save();

				ctx.globalAlpha = state.alpha;

				// Calculate anchor position based on element's corner
				let anchorX = 0,
					anchorY = 0;
				switch (elementKey) {
					case "topLeft":
						anchorX = 250;
						anchorY = 0;
						break;
					case "topRight":
						anchorX = WIDTH - element.naturalWidth;
						anchorY = 0;
						break;
					case "bottomLeft":
						anchorX = 50;
						anchorY = HEIGHT - element.naturalHeight;
						break;
					case "bottomRight":
						anchorX = WIDTH - element.naturalWidth;
						anchorY = HEIGHT - element.naturalHeight;
						break;
				}

				// Apply animation translation on top of anchor position
				const finalX = anchorX + state.translateX;
				const finalY = anchorY + state.translateY;

				// Draw element at natural size
				ctx.drawImage(element, finalX, finalY, element.naturalWidth, element.naturalHeight);

				ctx.restore();
			}
		});
	} else {
		// Handle single-element templates (m-1, m-3) or non-animating m-2
		const templateToDraw = isAnimating ? targetTemplate : currentTemplate;

		if (templateToDraw && templateToDraw.complete && animationState.alpha > 0) {
			ctx.save();

			// Apply transformations
			const centerX = WIDTH / 2;
			const centerY = HEIGHT / 2;

			// Move to center for transformation
			ctx.translate(centerX + animationState.translateX, centerY + animationState.translateY);

			// Apply rotation
			if (animationState.rotation !== 0) {
				ctx.rotate(animationState.rotation);
			}

			// Apply scale
			if (animationState.scale !== 1) {
				ctx.scale(animationState.scale, animationState.scale);
			}

			// Set alpha
			ctx.globalAlpha = animationState.alpha;

			// Draw template centered
			ctx.drawImage(templateToDraw, -WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);

			ctx.restore();
		}
	}

	// Draw the frame on top of everything (no animation on frame)
	if (frameImage && frameImage.complete) {
		ctx.drawImage(frameImage, 0, 0, WIDTH, HEIGHT);
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

		// (landscape cam)
		canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

		// Restore the context to its original state
		canvasCtx.restore();

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
});

let timeoutInterval = null;

// QR Code Timer variables
let qrTimer = null;
let qrTimeRemaining = 30; // seconds
let qrTotalTime = 30;
let isQrTimerActive = false;
