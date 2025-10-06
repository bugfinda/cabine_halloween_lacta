// Canvas dimensions
const WIDTH = 1920;
const HEIGHT = 1080;

// Idle timer configuration (seconds)
const maxIdleTimer = 90;

// Frame is common to all templates
const framePath = "./templates/frame.png";

// Template-specific overlays (without frame)
const templatePaths = {
	0: "./templates/m-1.png",
	1: "./templates/m-2.png", // Fallback for m-2
	2: "./templates/m-3.png",
};

// m-1 multi-element paths
const m1ElementPaths = {
	top: "./templates/m-1-top.png",
	bottom: "./templates/m-1-bottom.png",
};

// m-2 multi-element paths
const m2ElementPaths = {
	topLeft: "./templates/m-2-top-left.png",
	topRight: "./templates/m-2-top-right.png",
	bottomLeft: "./templates/m-2-bottom-left.png",
	bottomRight: "./templates/m-2-bottom-right.png",
};

// m-3 multi-element paths
const m3ElementPaths = {
	top: "./templates/m-3-top.png",
	topBlink: "./templates/m-3-top-blink.png",
	bottom: "./templates/m-3-bottom.png",
	chips: "./templates/m-3-chips.png",
};

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
