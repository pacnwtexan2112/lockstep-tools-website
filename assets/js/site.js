function openDrawer() {
    var drawer = document.getElementById("drawer");
    if (!drawer) return;
    drawer.classList.add("open");
    var btn = document.querySelector(".menu-btn");
    if (btn) btn.setAttribute("aria-expanded", "true");
}

function closeDrawer() {
    var drawer = document.getElementById("drawer");
    if (!drawer) return;
    drawer.classList.remove("open");
    var btn = document.querySelector(".menu-btn");
    if (btn) btn.setAttribute("aria-expanded", "false");
}

var lastFocus = null;

function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    var closeBtn = modal.querySelector(".close");
    if (closeBtn) closeBtn.focus();
}

function closeModal(id) {
    var modal = id ? document.getElementById(id) : document.querySelector(".modal.open");
    if (!modal) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
}

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeDrawer();
        closeModal();
    }
});

document.addEventListener("click", function (event) {
    if (event.target.classList && event.target.classList.contains("modal")) {
        closeModal(event.target.id);
    }
});

var DOWNLOADS = {
    "LockStepOCR": {
        file: "LockStepOCR-Setup-2.5.0.exe",
        url: "https://github.com/pacnwtexan2112/ReadySetOCR/releases/download/LockStepOCR/LockStepOCR-Setup-2.5.0.exe"
    },
    "LockStep Label": {
        file: "LockStepLabel-Setup-1.0.0.exe",
        url: "https://github.com/pacnwtexan2112/LockStepLabel/releases/download/v1.0.0/LockStepLabel-Setup-1.0.0.exe"
    }
};

var DOWNLOAD_KEY = "87298c41-e530-4f0e-a077-be5638bad3de";
var EMAIL_KEY = "lockstep-download-email";
var downloadApp = "";
var downloadSending = false;

function savedEmail() {
    try { return localStorage.getItem(EMAIL_KEY) || ""; }
    catch (err) { return ""; }
}

function rememberEmail(value) {
    try { localStorage.setItem(EMAIL_KEY, value); }
    catch (err) { /* the download still proceeds */ }
}

function ensureDownloadGate() {
    if (document.getElementById("download-gate")) return;
    var modal = document.createElement("div");
    modal.className = "modal download-gate";
    modal.id = "download-gate";
    modal.innerHTML =
        '<div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="download-gate-title">' +
            '<div class="modal-header">' +
                '<h3 id="download-gate-title">Download</h3>' +
                '<button type="button" class="close" aria-label="Close" onclick="closeModal(\'download-gate\')">&times;</button>' +
            '</div>' +
            '<form id="download-form">' +
                '<p class="gate-note" id="download-gate-note"></p>' +
                '<label for="download-email">Email</label>' +
                '<input id="download-email" name="email" type="email" autocomplete="email" required placeholder="you@shop.com">' +
                '<p class="gate-status" id="download-status" role="status"></p>' +
                '<button type="submit" class="btn btn-lime" id="download-submit">Send and download</button>' +
            '</form>' +
        '</div>';
    document.body.appendChild(modal);
    document.getElementById("download-form").addEventListener("submit", submitDownload);
}

function openDownload(app) {
    if (!DOWNLOADS[app]) return;
    downloadApp = app;
    downloadSending = false;
    ensureDownloadGate();
    closeDrawer();
    document.getElementById("download-gate-title").textContent = "Download " + app;
    document.getElementById("download-gate-note").textContent =
        "Enter an email and the " + app + " installer starts. The note we receive names " + app + ".";
    var status = document.getElementById("download-status");
    status.textContent = "";
    status.className = "gate-status";
    var input = document.getElementById("download-email");
    input.value = savedEmail();
    var submit = document.getElementById("download-submit");
    submit.disabled = false;
    submit.textContent = "Send and download";
    openModal("download-gate");
    input.focus();
    if (input.value) input.select();
}

function startDownload(url) {
    window.location.assign(url);
}

function submitDownload(event) {
    event.preventDefault();
    if (downloadSending) return;
    var app = downloadApp;
    var item = DOWNLOADS[app];
    var input = document.getElementById("download-email");
    var status = document.getElementById("download-status");
    var submit = document.getElementById("download-submit");
    var email = input.value.trim();
    if (!item || !input.checkValidity() || email.indexOf("@") < 1) {
        status.textContent = "Enter a full email address.";
        status.className = "gate-status is-error";
        input.focus();
        return;
    }
    downloadSending = true;
    submit.disabled = true;
    submit.textContent = "Sending…";
    status.textContent = "";
    status.className = "gate-status";
    fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
            access_key: DOWNLOAD_KEY,
            subject: app + " download",
            from_name: "LockStep Tools",
            email: email,
            replyto: email,
            app: app,
            file: item.file,
            page: location.pathname,
            message: app + " download. File: " + item.file + ". Page: " + location.pathname
        })
    }).then(function (response) {
        return response.json();
    }).then(function (result) {
        if (!result || !result.success) {
            throw new Error((result && result.message) || "Email did not send");
        }
        rememberEmail(email);
        status.textContent = "Download started.";
        status.className = "gate-status is-ok";
        startDownload(item.url);
        setTimeout(function () { closeModal("download-gate"); }, 700);
    }).catch(function () {
        status.textContent = "That email did not go through. Try again, or write support@locksteptools.com.";
        status.className = "gate-status is-error";
        submit.disabled = false;
        submit.textContent = "Send and download";
    }).then(function () {
        downloadSending = false;
    });
}

document.addEventListener("click", function (event) {
    var button = event.target.closest ? event.target.closest(".js-download") : null;
    if (!button) return;
    event.preventDefault();
    openDownload(button.getAttribute("data-app"));
});
