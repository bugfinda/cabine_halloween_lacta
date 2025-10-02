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

// m-1 multi-element paths
const m1ElementPaths = {
	top: "./templates/m-1-top.png",
	bottom: "./templates/m-1-bottom.png",
};

// m-3 multi-element paths
const m3ElementPaths = {
	top: "./templates/m-3-top.png",
	topBlink: "./templates/m-3-top-blink.png",
	bottom: "./templates/m-3-bottom.png",
	chips: "./templates/m-3-chips.png",
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

// Preload m-1 elements
let m1Elements = {};
Object.keys(m1ElementPaths).forEach((key) => {
	m1Elements[key] = new Image();
	m1Elements[key].src = m1ElementPaths[key];
});

// Preload m-3 elements
let m3Elements = {};
Object.keys(m3ElementPaths).forEach((key) => {
	m3Elements[key] = new Image();
	m3Elements[key].src = m3ElementPaths[key];
});

let currentTemplate = templateOverlays[templateIndex];

// Animation system for template-specific effects
const animationConfigs = {
	0: {
		// Template m-1: Multi-element slide up
		type: "multiSlideUp",
		duration: 600,
		elements: ["top", "bottom"],
		staggerDelay: 300, // Delay between each element starting
	},
	1: {
		// Template m-2: Multi-element slide from corners
		type: "multiSlideIn",
		duration: 500,
		elements: ["topLeft", "topRight", "bottomLeft", "bottomRight"],
		staggerDelay: 20, // Delay between each element starting
	},
	2: {
		// Template m-3: Multi-element slide up and down
		type: "multiSlideUpAndDown",
		duration: 500,
		elements: ["top", "bottom", "chips"],
		staggerDelay: 250, // Delay between each element starting
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

// Multi-element animation states (for m-1)
let m1ElementStates = {
	top: { translateX: 0, translateY: 0, alpha: 1 },
	bottom: { translateX: 0, translateY: 0, alpha: 1 },
};

// Multi-element animation states (for m-3)
let m3ElementStates = {
	top: { translateX: 0, translateY: 0, alpha: 1 },
	bottom: { translateX: 0, translateY: 0, alpha: 1 },
	chips: { translateX: 0, translateY: 0, alpha: 1 },
};

// Breathing loop state for m-2 elements
let m2Breathing = false;
let m2BreathStart = 0; // timestamp in ms
// Per-element breathing phase offsets (seconds)
let m2BreathOffsets = {
	topLeft: 0,
	topRight: 0,
	bottomLeft: 0,
	bottomRight: 0,
};

// Breathing loop state for m-1 elements
let m1Breathing = false;
let m1BreathStart = 0; // timestamp in ms
// Per-element breathing phase offsets (seconds)
let m1BreathOffsets = {
	top: 0,
	bottom: 0.5, // offset bottom element by half period
};

// Breathing loop state for m-3 elements
let m3Breathing = false;
let m3BreathStart = 0; // timestamp in ms
// Per-element breathing phase offsets (seconds)
let m3BreathOffsets = {
	top: 0,
	bottom: 0.7, // offset bottom element by different amount
	chips: 1.4, // offset chips element by different amount (not used for falling)
};

// M-3 top element blinking state
let m3TopBlinking = false;
let m3LastBlinkTime = 0;

// Chips falling animation state
let m3ChipsFalling = false;
let m3ChipsFallStart = 0; // timestamp in ms

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

		// stop breathing while the entrance animation runs
		m2Breathing = false;
		m2BreathStart = 0;
	}

	// Reset multi-element states for m-1
	if (currentAnimationConfig?.type === "multiSlideUp") {
		Object.keys(m1ElementStates).forEach((key) => {
			m1ElementStates[key] = { translateX: 0, translateY: 0, alpha: 0 };
		});

		// stop breathing while the entrance animation runs
		m1Breathing = false;
		m1BreathStart = 0;
	}

	// Reset multi-element states for m-3
	if (currentAnimationConfig?.type === "multiSlideUpAndDown") {
		Object.keys(m3ElementStates).forEach((key) => {
			m3ElementStates[key] = { translateX: 0, translateY: 0, alpha: 0 };
		});

		// stop breathing while the entrance animation runs
		m3Breathing = false;
		m3BreathStart = 0;
		m3TopBlinking = false;
		m3LastBlinkTime = 0;

		// stop chips falling while the entrance animation runs
		m3ChipsFalling = false;
		m3ChipsFallStart = 0;
	}
}

// Easing functions
const easingFunctions = {
	easeOutBack: (t) => {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
	},
	// A gentler back easing with reduced overshoot for subtler bounce
	easeOutBackGentle: (t) => {
		const c1 = 0.8; // smaller overshoot than easeOutBack
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
	multiSlideUp: (progress, elementKey, staggerDelay, duration) => {
		// Calculate staggered progress for each element
		const elementOrder = { top: 0, bottom: 1 };
		const elementIndex = elementOrder[elementKey] || 0;
		const staggerOffset = (elementIndex * staggerDelay) / duration;
		const adjustedProgress = Math.max(0, Math.min(1, (progress - staggerOffset) / (1 - staggerOffset)));

		if (adjustedProgress <= 0) {
			return { translateX: 0, translateY: 0, alpha: 0 };
		}

		// Use a gentler back easing for the bottom element to reduce overshoot
		const eased =
			elementKey === "bottom"
				? easingFunctions.easeOutBackGentle(adjustedProgress)
				: easingFunctions.easeOutBack(adjustedProgress);

		// Both elements slide from right
		const startX = WIDTH * 0.8; // Start off the right side
		const translateX = startX * (1 - eased);
		const alpha = Math.min(adjustedProgress * 2, 1);

		return { translateX, translateY: 0, alpha };
	},
	multiSlideUpAndDown: (progress, elementKey, staggerDelay, duration) => {
		// Handle chips element with fade-in animation
		if (elementKey === "chips") {
			const elementOrder = { top: 0, bottom: 1, chips: 2 };
			const elementIndex = elementOrder[elementKey];
			const staggerOffset = (elementIndex * staggerDelay) / duration;
			const adjustedProgress = Math.max(0, Math.min(1, (progress - staggerOffset) / (1 - staggerOffset * 2)));

			if (adjustedProgress <= 0) {
				return { translateX: 0, translateY: 0, alpha: 0 };
			}

			// Simple fade-in for chips
			const alpha = Math.min(adjustedProgress * 1.5, 1);
			return { translateX: 0, translateY: 0, alpha };
		}

		// Calculate staggered progress for each element
		const elementOrder = { top: 0, bottom: 1 };
		const elementIndex = elementOrder[elementKey] || 0;
		const staggerOffset = (elementIndex * staggerDelay) / duration;
		const adjustedProgress = Math.max(0, Math.min(1, (progress - staggerOffset) / (1 - staggerOffset)));

		if (adjustedProgress <= 0) {
			return { translateX: 0, translateY: 0, alpha: 0 };
		}

		const eased = easingFunctions.easeOutBack(adjustedProgress);

		// Top element slides from left, bottom element slides from right
		let startX = 0;
		if (elementKey === "top") {
			startX = -WIDTH * 0.1; // Start off the left side
		} else if (elementKey === "bottom") {
			startX = WIDTH * 0.3; // Start off the right side
		}
		const translateX = startX * (1 - eased);
		const alpha = Math.min(adjustedProgress * 2, 1);

		return { translateX, translateY: 0, alpha };
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
	} else if (currentAnimationConfig.type === "multiSlideUp") {
		// Handle multi-element animations (m-1)
		currentAnimationConfig.elements.forEach((elementKey) => {
			const elementState = animationTypes.multiSlideUp(
				progress,
				elementKey,
				currentAnimationConfig.staggerDelay,
				currentAnimationConfig.duration
			);
			m1ElementStates[elementKey] = elementState;
		});
	} else if (currentAnimationConfig.type === "multiSlideUpAndDown") {
		// Handle multi-element animations (m-3)
		currentAnimationConfig.elements.forEach((elementKey) => {
			const elementState = animationTypes.multiSlideUpAndDown(
				progress,
				elementKey,
				currentAnimationConfig.staggerDelay,
				currentAnimationConfig.duration
			);
			m3ElementStates[elementKey] = elementState;
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

			// Start subtle breathing loop for m-2
			m2Breathing = true;
			m2BreathStart = performance.now();

			// Stagger breathing offsets so each element is out-of-sync
			// Use a quarter-period offset for each corner plus a small random jitter
			{
				const period = 3.0; // must match draw breathing period
				const elementOrder = { topLeft: 0, topRight: 1, bottomLeft: 2, bottomRight: 3 };
				Object.keys(m2BreathOffsets).forEach((key) => {
					const baseOffset = (elementOrder[key] / 4) * period;
					const jitter = (Math.random() - 0.5) * 0.2; // +/-100ms jitter
					m2BreathOffsets[key] = baseOffset + jitter;
				});
			}
		} else if (currentAnimationConfig.type === "multiSlideUp") {
			// Reset multi-element states to final positions for m-1
			currentAnimationConfig.elements.forEach((elementKey) => {
				m1ElementStates[elementKey] = { translateX: 0, translateY: 0, alpha: 1 };
			});

			// Start subtle breathing loop for m-1
			m1Breathing = true;
			m1BreathStart = performance.now();

			// Initialize breathing offsets to start from neutral positions
			// Calculate offsets so that each element starts at neutral (sin = 0)
			const period = 5.0; // must match breathing period in draw function
			m1BreathOffsets = {
				top: 0,
				bottom: period / 4, // quarter period offset so they're out of sync but start neutral
			};
		} else if (currentAnimationConfig.type === "multiSlideUpAndDown") {
			// Reset multi-element states to final positions for m-3
			currentAnimationConfig.elements.forEach((elementKey) => {
				m3ElementStates[elementKey] = { translateX: 0, translateY: 0, alpha: 1 };
			});

			// Start subtle breathing loop for m-3 (only bottom element)
			m3Breathing = true;
			m3BreathStart = performance.now();
			m3TopBlinking = false;
			m3LastBlinkTime = 0;

			// Start chips falling animation
			m3ChipsFalling = true;
			m3ChipsFallStart = performance.now();
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

	// Handle m-1 multi-element animation
	if (templateIndex === 0 && (isAnimating || currentAnimationConfig?.type === "multiSlideUp")) {
		// Draw each m-1 element separately at natural size
		Object.keys(m1Elements).forEach((elementKey) => {
			const element = m1Elements[elementKey];
			const state = m1ElementStates[elementKey];

			if (element && element.complete && state.alpha > 0) {
				ctx.save();

				ctx.globalAlpha = state.alpha;

				// Both elements are full canvas size, draw at 0,0
				const finalX = 0 + state.translateX;
				const finalY = 0 + state.translateY;

				// If breathing enabled and not animating, compute a subtle scale factor with gentle erratic rotation
				let breathScale = 1;
				let erraticRotation = 0;
				if (m1Breathing && !isAnimating) {
					// 5s full period (in/out), small amplitude
					const elapsedGlobal = (performance.now() - m1BreathStart) / 1000; // seconds
					const period = 5.0; // seconds for a full inhale+exhale
					const omega = (2 * Math.PI) / period;
					// sine oscillation in [-1,1], map to [1 - a, 1 + a]
					const amplitude = 0.02; // 2% scale
					// Apply per-element offset so each element is out of sync
					const offset = m1BreathOffsets[elementKey] || 0;
					const elapsed = elapsedGlobal + offset;
					breathScale = 1 + Math.sin(elapsed * omega) * amplitude;

					// Add gentle erratic rotation - subtle random rotation
					const rotationPeriod1 = 3.2; // primary rotation period
					const rotationPeriod2 = 4.7; // secondary rotation period for complexity
					const rotationAmplitude = 0.015; // radians (~0.86 degrees max)
					const rotationOmega1 = (2 * Math.PI) / rotationPeriod1;
					const rotationOmega2 = (2 * Math.PI) / rotationPeriod2;
					// Combine two sine waves with different frequencies and phase offsets for erratic feel
					const rotation1 = Math.sin((elapsed + offset) * rotationOmega1) * rotationAmplitude;
					const rotation2 = Math.sin((elapsed + offset * 1.7) * rotationOmega2 * 0.6) * rotationAmplitude * 0.4;
					erraticRotation = rotation1 + rotation2;
				} // Draw element; if breathing and not animating, scale and rotate around center
				ctx.save();
				const centerX = finalX + WIDTH / 2;
				const centerY = finalY + HEIGHT / 2;
				ctx.translate(centerX, centerY);
				if (m1Breathing && !isAnimating) {
					ctx.rotate(erraticRotation);
					ctx.scale(breathScale, breathScale);
				}
				ctx.drawImage(element, -WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);
				ctx.restore();

				ctx.restore();
			}
		});
	} else if (templateIndex === 2 && (isAnimating || currentAnimationConfig?.type === "multiSlideUpAndDown")) {
		// Draw each m-3 element separately at natural size
		// Draw chips first so they stay behind top and bottom elements
		const drawOrder = ["chips", "top", "bottom"];

		drawOrder.forEach((elementKey) => {
			const element = m3Elements[elementKey];
			const state = m3ElementStates[elementKey];

			if (element && element.complete && state.alpha > 0) {
				// Handle chips element with falling animation
				if (elementKey === "chips" && m3ChipsFalling) {
					// Interpolated chip animation with mirrored copy
					const currentTime = performance.now();
					const elapsedTime = (currentTime - m3ChipsFallStart) / 1000; // seconds

					// Loop duration: 10 seconds for complete traversal cycle
					const loopDuration = 10.0;
					const progress = (elapsedTime % loopDuration) / loopDuration; // 0 to 1

					// Calculate positions for both chips
					const startX = -element.naturalWidth;
					const endX = WIDTH + element.naturalWidth;

					// First chip (normal)
					const currentX1 = startX + (endX - startX) * progress;

					// Second chip (mirrored, starts halfway through but offset to stay off-screen initially)
					const progress2 = (elapsedTime % loopDuration) / loopDuration;
					// Offset the second chip by half a loop so it starts when first chip is halfway
					const offsetProgress2 = (progress2 - 0.5 + 1) % 1; // Ensures it starts off-screen
					const currentX2 = startX + 300 + (endX - startX) * offsetProgress2;

					// Fixed Y position (center of screen)
					const currentY = HEIGHT / 2 - element.naturalHeight / 2;

					ctx.save();
					ctx.globalAlpha = state.alpha;

					// Draw the first chip (normal)
					ctx.drawImage(element, currentX1, currentY, element.naturalWidth, element.naturalHeight);

					// Draw the second chip (mirrored vertically)
					ctx.save();
					ctx.translate(currentX2 + element.naturalWidth / 2, currentY + element.naturalHeight / 2);
					ctx.scale(1, -1); // Mirror vertically
					ctx.drawImage(
						element,
						-element.naturalWidth / 2,
						-element.naturalHeight / 2,
						element.naturalWidth,
						element.naturalHeight
					);
					ctx.restore();

					ctx.restore();
				} else if (elementKey === "chips") {
					// Don't draw chips if falling animation hasn't started yet
					// This prevents the blinking at (0,0) position during entrance animation
				} else {
					// Handle top and bottom elements normally
					ctx.save();
					ctx.globalAlpha = state.alpha;

					const finalX = 0 + state.translateX;
					const finalY = 0 + state.translateY;

					// If breathing enabled, compute a subtle scale factor (only for bottom element)
					let breathScale = 1;
					if (m3Breathing && elementKey === "bottom") {
						// 5s full period (in/out), small amplitude
						const elapsedGlobal = (performance.now() - m3BreathStart) / 1000; // seconds
						const period = 5.0; // seconds for a full inhale+exhale
						const omega = (2 * Math.PI) / period;
						// sine oscillation in [-1,1], map to [1 - a, 1 + a]
						const amplitude = 0.02; // 2% scale
						// Apply per-element offset so each element is out of sync
						const offset = m3BreathOffsets[elementKey] || 0;
						const elapsed = elapsedGlobal + offset;
						breathScale = 1 + Math.sin(elapsed * omega) * amplitude;
					}

					// Handle blinking for top element
					let elementToDraw = element;
					if (elementKey === "top" && m3Breathing) {
						const elapsedGlobal = (performance.now() - m3BreathStart) / 1000; // seconds
						const period = 5.0; // 5-second breathing cycle
						const currentCycle = Math.floor(elapsedGlobal / period);

						// Check if we're in a new cycle and haven't blinked yet
						if (currentCycle > Math.floor(m3LastBlinkTime / period)) {
							// Start a new blink
							m3TopBlinking = true;
							m3LastBlinkTime = elapsedGlobal;
						}

						// If we're blinking, check if blink duration has passed
						if (m3TopBlinking) {
							const timeSinceBlinkStart = elapsedGlobal - m3LastBlinkTime;
							const blinkDuration = 0.15; // 150ms blink duration

							if (timeSinceBlinkStart < blinkDuration) {
								// Show blink image
								elementToDraw = m3Elements.topBlink;
							} else {
								// End blink
								m3TopBlinking = false;
							}
						}
					}

					// Draw element; if breathing (only bottom), scale around center so it 'breathes' in place
					ctx.save();
					const centerX = finalX + WIDTH / 2;
					const centerY = finalY + HEIGHT / 2;
					ctx.translate(centerX, centerY);
					if (m3Breathing && elementKey === "bottom") {
						ctx.scale(breathScale, breathScale);
					}
					ctx.drawImage(elementToDraw, -WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);
					ctx.restore();

					ctx.restore();
				}
			}
		});
	} else if (templateIndex === 1 && (isAnimating || currentAnimationConfig?.type === "multiSlideIn")) {
		// Handle m-2 multi-element animation
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

				// If breathing enabled, compute a subtle scale factor (e.g., 0.98 - 1.02)
				let drawWidth = element.naturalWidth;
				let drawHeight = element.naturalHeight;
				let breathScale = 1;
				if (m2Breathing) {
					// 5s full period (in/out), small amplitude
					const elapsedGlobal = (performance.now() - m2BreathStart) / 1000; // seconds
					const period = 5.0; // seconds for a full inhale+exhale
					const omega = (2 * Math.PI) / period;
					// sine oscillation in [-1,1], map to [1 - a, 1 + a]
					const amplitude = 0.02; // 2% scale
					// Apply per-element offset so each element is out of sync
					const offset = m2BreathOffsets[elementKey] || 0;
					const elapsed = elapsedGlobal + offset;
					breathScale = 1 + Math.sin(elapsed * omega) * amplitude;
					// apply to draw size (kept for legacy, but drawing uses center-scale now)
					drawWidth = element.naturalWidth * breathScale;
					drawHeight = element.naturalHeight * breathScale;
				}

				// Draw element; if breathing, scale around element center so it 'breathes' in place
				ctx.save();
				const centerX = finalX + element.naturalWidth / 2;
				const centerY = finalY + element.naturalHeight / 2;
				ctx.translate(centerX, centerY);
				if (m2Breathing) {
					ctx.scale(breathScale, breathScale);
				}
				ctx.drawImage(
					element,
					-element.naturalWidth / 2,
					-element.naturalHeight / 2,
					element.naturalWidth,
					element.naturalHeight
				);
				ctx.restore();

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

let timeoutInterval = null;

// QR Code Timer variables
let qrTimer = null;
let qrTimeRemaining = 24; // seconds
let qrTotalTime = 24;
let isQrTimerActive = false;
