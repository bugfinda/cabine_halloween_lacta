let spinner;
let container;

// show spinner
function showSpinner() {
	container.style.display = "flex";
}

// hide spinner
function hideSpinner() {
	container.style.display = "none";
}

// style background
function styleContainer() {
	container.style.position = "fixed";
	container.style.top = "0";
	container.style.left = "0";
	container.style.width = "100vw";
	container.style.height = "100vh";
	container.style.backgroundColor = "#00000077";
	container.style.zIndex = "10000";
	// container.style.backgroundImage = "url('imgs/bg.jpg')";
	// container.style.backgroundSize = "cover";
	// container.style.backgroundPosition = "top center";
	// container.style.backgroundRepeat = "no-repeat";

	container.style.justifyContent = "center";
	container.style.alignItems = "center";
	container.style.display = "none";
}

// style spinner
function styleSpinner() {
	spinner.style.width = "100px";
	spinner.style.height = "100px";
	spinner.style.border = "16px solid white";
	spinner.style.borderTop = "16px solid #dfb129";
	spinner.style.borderRadius = "50%";
	spinner.style.animation = "spin 1s infinite linear";
}

// define spin animation
function defineSpinAnimation() {
	const style = document.createElement("style");
	style.textContent = `
      @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
      }
  `;
	document.head.appendChild(style);
}

// setup spinner
function setupSpinner() {
	spinner = document.createElement("div");
	spinner.id = "spinner";

	container = document.createElement("div");
	container.id = "spinnerContainer";
	container.appendChild(spinner);
	document.body.appendChild(container);

	styleContainer();
	styleSpinner();
	defineSpinAnimation();
}

// dom loaded
document.addEventListener("DOMContentLoaded", () => {
	setupSpinner();
});
