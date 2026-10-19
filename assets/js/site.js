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

function showAboutModal() {
    var modal = document.getElementById("aboutModal");
    if (modal) modal.classList.add("open");
}

function closeModal() {
    var modal = document.getElementById("aboutModal");
    if (modal) modal.classList.remove("open");
}

function backdropClose(event) {
    if (event.target.id === "aboutModal") closeModal();
}

function openTab(id, btn) {
    document.querySelectorAll(".tab-panel").forEach(function (panel) {
        panel.classList.remove("active");
    });
    document.querySelectorAll(".tab-btn").forEach(function (tab) {
        tab.classList.remove("active");
    });
    var panel = document.getElementById(id);
    if (panel) panel.classList.add("active");
    if (btn) btn.classList.add("active");
}

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeModal();
        closeDrawer();
    }
});
