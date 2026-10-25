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
