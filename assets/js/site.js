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

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeDrawer();
});
