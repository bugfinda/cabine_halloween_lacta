// Photo upload functionality

function addToGallery() {
	const canvasCopy = document.createElement("canvas");
	const ctx = canvasCopy.getContext("2d");

	canvasCopy.width = window.outputImage.height;
	canvasCopy.height = window.outputImage.width;

	ctx.translate(canvasCopy.width / 2, canvasCopy.height / 2);
	ctx.rotate((90 * Math.PI) / 180);
	ctx.drawImage(window.outputImage, -window.outputImage.width / 2, -window.outputImage.height / 2, window.outputImage.width, window.outputImage.height);

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
		JSON.stringify({ machine: localStorage.getItem("machineId") ? localStorage.getItem("machineId") : window.machine })
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
					handleUploadError(err);
				});
		} catch (error) {
			handleUploadError(error);
		}
	} else {
		handleUploadError(new Error("File too small"));
	}
}

function handleUploadError(error) {
	document.getElementById("resultContainer").style.display = "none";
	hideSpinner();
	console.error(error);
	// Mark internet issue when upload fails
	hasInternetIssue = true;
	// Clean up result image from DOM if it exists
	const resultImg = document.getElementById("resultImg");
	if (resultImg) {
		document.getElementById("resultContainer").removeChild(resultImg);
	}
	// Reset the result image and snapshot state
	window.outputImage = null;
	window.isSnapshoting = false;
	// error panel
	document.getElementById("notificationPanel").style.display = "flex";
	document.getElementById("notification").innerHTML =
		"Ah que pena, a intenet falhou para subir a sua foto.<br>Mas continue brincando aqui 😊";
	// Restore overlays for template switching
	document.getElementById("overlays").style.display = "flex";
	document.getElementById("output_canvas").style.display = "block";
}
