// Template management and animations

// Template state
let templateIndex = 0;
let frameImage = new Image();
frameImage.src = framePath;

// Preload the template overlays
let templateOverlays = Object.values(templatePaths).map((path) => {
	let img = new Image();
	img.src = path;
	return img;
});

// Preload m-1 elements
let m1Elements = {};
Object.keys(m1ElementPaths).forEach((key) => {
	m1Elements[key] = new Image();
	m1Elements[key].src = m1ElementPaths[key];
});

// Preload m-2 elements
let m2Elements = {};
Object.keys(m2ElementPaths).forEach((key) => {
	m2Elements[key] = new Image();
	m2Elements[key].src = m2ElementPaths[key];
});

// Preload m-3 elements
let m3Elements = {};
Object.keys(m3ElementPaths).forEach((key) => {
	m3Elements[key] = new Image();
	m3Elements[key].src = m3ElementPaths[key];
});

let currentTemplate = templateOverlays[templateIndex];

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

// Multi-element animation states (for m-1)
let m1ElementStates = {
	top: { translateX: 0, translateY: 0, alpha: 1 },
	bottom: { translateX: 0, translateY: 0, alpha: 1 },
};

// Multi-element animation states (for m-2)
let multiElementStates = {
	topLeft: { translateX: 0, translateY: 0, alpha: 1 },
	topRight: { translateX: 0, translateY: 0, alpha: 1 },
	bottomLeft: { translateX: 0, translateY: 0, alpha: 1 },
	bottomRight: { translateX: 0, translateY: 0, alpha: 1 },
};

// Multi-element animation states (for m-3)
let m3ElementStates = {
	top: { translateX: 0, translateY: 0, alpha: 1 },
	bottom: { translateX: 0, translateY: 0, alpha: 1 },
	chips: { translateX: 0, translateY: 0, alpha: 1 },
};

// Breathing loop state for m-1 elements
let m1Breathing = false;
let m1BreathStart = 0; // timestamp in ms
let m1BreathOffsets = {
	top: 0,
	bottom: 0.5, // offset bottom element by half period
};

// Breathing loop state for m-2 elements
let m2Breathing = false;
let m2BreathStart = 0; // timestamp in ms
let m2BreathOffsets = {
	topLeft: 0,
	topRight: 0,
	bottomLeft: 0,
	bottomRight: 0,
};

// Breathing loop state for m-3 elements
let m3Breathing = false;
let m3BreathStart = 0; // timestamp in ms
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

// Template navigation functions
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

	const elapsed = performance.now() - animationStartTime;
	const progress = Math.min(elapsed / currentAnimationConfig.duration, 1);

	// Update animation based on type
	if (currentAnimationConfig.type === "multiSlideIn") {
		// Update m-2 multi-element animation
		Object.keys(multiElementStates).forEach((key) => {
			const result = animationTypes.multiSlideIn(
				progress,
				key,
				currentAnimationConfig.staggerDelay,
				currentAnimationConfig.duration
			);
			multiElementStates[key] = result;
		});
	} else if (currentAnimationConfig.type === "multiSlideUp") {
		// Update m-1 multi-element animation
		Object.keys(m1ElementStates).forEach((key) => {
			const result = animationTypes.multiSlideUp(
				progress,
				key,
				currentAnimationConfig.staggerDelay,
				currentAnimationConfig.duration
			);
			m1ElementStates[key] = result;
		});
	} else if (currentAnimationConfig.type === "multiSlideUpAndDown") {
		// Update m-3 multi-element animation
		Object.keys(m3ElementStates).forEach((key) => {
			const result = animationTypes.multiSlideUpAndDown(
				progress,
				key,
				currentAnimationConfig.staggerDelay,
				currentAnimationConfig.duration
			);
			m3ElementStates[key] = result;
		});
	} else {
		// Update single overlay animation
		const animationFunc = animationTypes[currentAnimationConfig.type];
		if (animationFunc) {
			animationState = animationFunc(progress);
		}
	}

	// Check if animation is complete
	if (progress >= 1) {
		isAnimating = false;
		currentTemplate = targetTemplate;

		// Start breathing effect after entrance animation completes for m-2
		if (currentAnimationConfig.type === "multiSlideIn") {
			m2Breathing = true;
			m2BreathStart = performance.now();
		}

		// Start breathing effect after entrance animation completes for m-1
		if (currentAnimationConfig.type === "multiSlideUp") {
			m1Breathing = true;
			m1BreathStart = performance.now();
		}

		// Start breathing effect after entrance animation completes for m-3
		if (currentAnimationConfig.type === "multiSlideUpAndDown") {
			m3Breathing = true;
			m3BreathStart = performance.now();
			m3TopBlinking = true;
			m3LastBlinkTime = performance.now();
			m3ChipsFalling = true;
			m3ChipsFallStart = performance.now();
		}
	}
}

function drawTemplateElements(ctx) {
	// Draw frame (common to all templates)
	if (frameImage.complete) {
		ctx.drawImage(frameImage, 0, 0, WIDTH, HEIGHT);
	}

	// Draw template-specific elements based on current template
	if (templateIndex === 1 && currentAnimationConfig?.type === "multiSlideIn") {
		// m-2: Draw multi-element overlays with animation
		Object.keys(m2Elements).forEach((key) => {
			const img = m2Elements[key];
			if (!img.complete) return;

			const state = multiElementStates[key];
			ctx.save();
			ctx.globalAlpha = state.alpha;
			ctx.translate(WIDTH / 2 + state.translateX, HEIGHT / 2 + state.translateY);

			// Apply breathing effect if active
			if (m2Breathing) {
				const elapsed = (performance.now() - m2BreathStart) / 1000; // seconds
				const breathPeriod = 3.0; // seconds
				const phase = ((elapsed + m2BreathOffsets[key]) % breathPeriod) / breathPeriod;
				const breathScale = 1 + Math.sin(phase * Math.PI * 2) * 0.01; // subtle breathing
				ctx.scale(breathScale, breathScale);
			}

			ctx.translate(-WIDTH / 2, -HEIGHT / 2);
			ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
			ctx.restore();
		});
	} else if (templateIndex === 0 && currentAnimationConfig?.type === "multiSlideUp") {
		// m-1: Draw multi-element overlays with animation
		Object.keys(m1Elements).forEach((key) => {
			const img = m1Elements[key];
			if (!img.complete) return;

			const state = m1ElementStates[key];
			ctx.save();
			ctx.globalAlpha = state.alpha;
			ctx.translate(WIDTH / 2 + state.translateX, HEIGHT / 2 + state.translateY);

			// Apply breathing effect if active
			if (m1Breathing) {
				const elapsed = (performance.now() - m1BreathStart) / 1000; // seconds
				const breathPeriod = 3.0; // seconds
				const phase = ((elapsed + m1BreathOffsets[key]) % breathPeriod) / breathPeriod;
				const breathScale = 1 + Math.sin(phase * Math.PI * 2) * 0.015; // subtle breathing
				ctx.scale(breathScale, breathScale);
			}

			ctx.translate(-WIDTH / 2, -HEIGHT / 2);
			ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
			ctx.restore();
		});
	} else if (templateIndex === 2 && currentAnimationConfig?.type === "multiSlideUpAndDown") {
		// m-3: Draw multi-element overlays with animation
		Object.keys(m3Elements).forEach((key) => {
			// Skip topBlink in the normal loop, we'll handle it separately
			if (key === "topBlink") return;

			// Use m3Elements.top or m3Elements.topBlink depending on blinking state
			let img = m3Elements[key];
			if (key === "top" && m3TopBlinking) {
				const elapsed = performance.now() - m3LastBlinkTime;
				const blinkInterval = 3000 + Math.random() * 2000; // 3-5 seconds between blinks
				if (elapsed > blinkInterval) {
					// Switch to blink image for a short time
					const blinkDuration = 200; // ms
					if (elapsed < blinkInterval + blinkDuration) {
						img = m3Elements.topBlink;
					} else {
						m3LastBlinkTime = performance.now();
					}
				}
			}

			if (!img.complete) return;

			const state = m3ElementStates[key];
			ctx.save();
			ctx.globalAlpha = state.alpha;
			ctx.translate(WIDTH / 2 + state.translateX, HEIGHT / 2 + state.translateY);

			// Apply breathing effect if active
			if (m3Breathing && key !== "chips") {
				const elapsed = (performance.now() - m3BreathStart) / 1000; // seconds
				const breathPeriod = 3.0; // seconds
				const phase = ((elapsed + m3BreathOffsets[key]) % breathPeriod) / breathPeriod;
				const breathScale = 1 + Math.sin(phase * Math.PI * 2) * 0.015; // subtle breathing
				ctx.scale(breathScale, breathScale);
			}

			// Apply chips falling effect if active
			if (m3ChipsFalling && key === "chips") {
				const elapsed = (performance.now() - m3ChipsFallStart) / 1000; // seconds
				const fallPeriod = 4.0; // seconds
				const phase = (elapsed % fallPeriod) / fallPeriod;

				// Create a wave effect: chips fall and rise
				let fallOffset = 0;
				if (phase < 0.5) {
					// Falling phase (0 to 0.5)
					fallOffset = Math.sin(phase * 2 * Math.PI) * 50; // Fall down by 50px
				} else {
					// Rising phase (0.5 to 1.0)
					fallOffset = Math.sin((phase - 0.5) * 2 * Math.PI) * 50; // Rise back up
				}

				ctx.translate(0, fallOffset);
			}

			ctx.translate(-WIDTH / 2, -HEIGHT / 2);
			ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
			ctx.restore();
		});
	} else if (currentTemplate && currentTemplate.complete) {
		// Fallback to single overlay if not using multi-element
		ctx.save();
		ctx.globalAlpha = animationState.alpha;
		ctx.translate(WIDTH / 2, HEIGHT / 2);
		ctx.scale(animationState.scale, animationState.scale);
		ctx.rotate((animationState.rotation * Math.PI) / 180);
		ctx.translate(animationState.translateX - WIDTH / 2, animationState.translateY - HEIGHT / 2);
		ctx.drawImage(currentTemplate, 0, 0, WIDTH, HEIGHT);
		ctx.restore();
	}
}
