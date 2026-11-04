(function () {
    var GROUPS = ["Start", "The job", "Page tools", "Production tools", "Additional tools", "Settings"];
    var articles = [];
    var byKey = {};
    var sourceHTML = {};
    var query = "";
    var currentKey = "start";
    var currentSection = "";
    var hitAt = -1;
    var backStack = [];
    var forwardStack = [];

    var tree = document.getElementById("help-tree");
    var search = document.getElementById("help-q");
    var countEl = document.getElementById("help-count");
    var emptyEl = document.getElementById("help-empty");
    var backBtn = document.getElementById("help-back");
    var forwardBtn = document.getElementById("help-forward");
    var prevBtn = document.getElementById("help-prev");
    var nextBtn = document.getElementById("help-next");
    var reader = document.getElementById("help-reader");

    function wordsOf(value) {
        return String(value || "").toLowerCase().split(/\s+/).filter(Boolean);
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"]/g, function (ch) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch];
        });
    }

    function plain(el) {
        var clone = el.cloneNode(true);
        clone.querySelectorAll(".help-related, .help-related-none").forEach(function (node) {
            node.remove();
        });
        return clone.textContent.replace(/\s+/g, " ").trim();
    }

    function sectionText(articleEl, heading, next) {
        var parts = [];
        var node = heading;
        var stop = next || articleEl.querySelector(".help-related, .help-related-none");
        while (node && node !== stop) {
            parts.push(node.textContent);
            node = node.nextElementSibling;
        }
        return parts.join(" ").replace(/\s+/g, " ").trim();
    }

    function indexArticles() {
        document.querySelectorAll(".help-article").forEach(function (el, index) {
            var title = el.querySelector("h2").textContent.trim();
            var headings = Array.prototype.slice.call(el.querySelectorAll("h3"));
            var sections = headings.map(function (heading, headingIndex) {
                return {
                    slug: heading.getAttribute("data-slug"),
                    title: heading.textContent.trim(),
                    text: sectionText(el, heading, headings[headingIndex + 1]).toLowerCase()
                };
            });
            var article = {
                el: el,
                key: el.id,
                group: el.getAttribute("data-group"),
                title: title,
                titleLower: title.toLowerCase(),
                index: index,
                sections: sections,
                textLower: plain(el).toLowerCase()
            };
            articles.push(article);
            byKey[article.key] = article;
            sourceHTML[article.key] = el.innerHTML;
        });
    }

    function searchArticles(value) {
        var words = wordsOf(value);
        if (!words.length) return articles.slice();
        var found = articles.filter(function (article) {
            return words.every(function (word) { return article.textLower.indexOf(word) !== -1; });
        });
        found.sort(function (a, b) {
            var hitsA = words.filter(function (word) { return a.titleLower.indexOf(word) !== -1; }).length;
            var hitsB = words.filter(function (word) { return b.titleLower.indexOf(word) !== -1; }).length;
            if (hitsB !== hitsA) return hitsB - hitsA;
            return a.index - b.index;
        });
        return found;
    }

    function matchingSections(article, words) {
        if (!words.length) return article.sections;
        return article.sections.filter(function (section) {
            return words.every(function (word) { return section.text.indexOf(word) !== -1; });
        });
    }

    function buildTree(shown) {
        var words = wordsOf(query);
        var html = "";
        GROUPS.forEach(function (group) {
            var rows = shown.filter(function (article) { return article.group === group; });
            if (!rows.length) return;
            html += '<p class="help-group">' + escapeHTML(group) + "</p>";
            rows.forEach(function (article) {
                var current = article.key === currentKey ? ' aria-current="page"' : "";
                html += '<a class="help-topic" href="#' + article.key + '"' + current + ">" + escapeHTML(article.title) + "</a>";
                matchingSections(article, words).forEach(function (section) {
                    var on = article.key === currentKey && section.slug === currentSection;
                    html += '<a class="help-section" href="#' + article.key + "/" + section.slug + '"' +
                        (on ? ' aria-current="true"' : "") + ">" + escapeHTML(section.title) + "</a>";
                });
            });
        });
        tree.innerHTML = html || '<p class="help-none">No articles match</p>';
        var active = tree.querySelector('.help-section[aria-current="true"]') || tree.querySelector('[aria-current="page"]');
        if (!active) return;
        var treeRect = tree.getBoundingClientRect();
        var rect = active.getBoundingClientRect();
        if (rect.top < treeRect.top) tree.scrollTop -= treeRect.top - rect.top;
        else if (rect.bottom > treeRect.bottom) tree.scrollTop += rect.bottom - treeRect.bottom;
    }

    function highlight(el, words) {
        var pattern = new RegExp(words.slice().sort(function (a, b) {
            return b.length - a.length;
        }).map(function (word) {
            return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }).join("|"), "gi");
        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        var nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(function (node) {
            if (!node.nodeValue || !node.parentElement || node.parentElement.closest(".help-related, .help-related-none, script, style")) return;
            pattern.lastIndex = 0;
            if (!pattern.test(node.nodeValue)) return;
            pattern.lastIndex = 0;
            var text = node.nodeValue;
            var frag = document.createDocumentFragment();
            var last = 0;
            var match;
            while ((match = pattern.exec(text))) {
                if (match.index > last) frag.appendChild(document.createTextNode(text.slice(last, match.index)));
                var mark = document.createElement("mark");
                mark.className = "help-hit";
                mark.textContent = match[0];
                frag.appendChild(mark);
                last = match.index + match[0].length;
                if (!match[0].length) pattern.lastIndex += 1;
            }
            if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
            node.parentNode.replaceChild(frag, node);
        });
    }

    function reveal(node, block) {
        if (!node) return;
        node.scrollIntoView({ block: block });
        requestAnimationFrame(function () { node.scrollIntoView({ block: block }); });
    }

    function hitsInView() {
        var article = byKey[currentKey];
        if (!article) return [];
        return Array.prototype.slice.call(article.el.querySelectorAll("mark.help-hit"));
    }

    function syncChrome(shown) {
        var words = wordsOf(query);
        var base;
        if (!words.length) base = articles.length + " articles";
        else if (shown.length) base = shown.length + " of " + articles.length + " articles";
        else base = "No articles match";
        var hits = hitsInView();
        if (hits.length && hitAt >= 0) countEl.textContent = base + "  ·  match " + (hitAt + 1) + " of " + hits.length;
        else if (hits.length) countEl.textContent = base + "  ·  " + hits.length + (hits.length === 1 ? " match" : " matches");
        else countEl.textContent = base;
        prevBtn.disabled = !hits.length;
        nextBtn.disabled = !hits.length;
        backBtn.disabled = !backStack.length;
        forwardBtn.disabled = !forwardStack.length;
    }

    function paint(scrollMode) {
        var shown = searchArticles(query);
        var words = wordsOf(query);
        var visible = shown.some(function (article) { return article.key === currentKey; });
        articles.forEach(function (article) {
            article.el.classList.toggle("is-current", visible && article.key === currentKey);
        });
        emptyEl.classList.toggle("is-on", !visible);
        hitAt = -1;
        if (visible) {
            var article = byKey[currentKey];
            article.el.innerHTML = sourceHTML[currentKey];
            if (words.length) highlight(article.el, words);
            var hits = hitsInView();
            if (scrollMode === "section" && currentSection) {
                var heading = article.el.querySelector('[data-slug="' + currentSection + '"]');
                reveal(heading || article.el.querySelector("h2"), "start");
            } else if (scrollMode === "hit" && hits.length) {
                hitAt = 0;
                hits[0].classList.add("is-current");
                reveal(hits[0], "center");
            } else if (scrollMode === "top") {
                reveal(article.el.querySelector("h2"), "start");
            } else if (scrollMode === "home") {
                window.scrollTo(0, 0);
                requestAnimationFrame(function () { window.scrollTo(0, 0); });
                setTimeout(function () { window.scrollTo(0, 0); }, 60);
            }
            document.title = article.title + " — LockStepPDF Help";
        } else {
            document.title = "LockStepPDF Help";
        }
        buildTree(shown);
        syncChrome(shown);
    }

    function hashFor(key, section) {
        return section ? "#" + key + "/" + section : "#" + key;
    }

    function openTopic(key, section, record, scrollMode) {
        if (!byKey[key]) return;
        section = section || "";
        if (record && currentKey !== key) {
            backStack.push({ key: currentKey, section: currentSection });
            forwardStack = [];
        }
        currentKey = key;
        currentSection = section;
        var hash = hashFor(key, section);
        if (location.hash !== hash) history.replaceState(null, "", hash);
        paint(scrollMode);
    }

    function parseHref(href) {
        var raw = decodeURIComponent(String(href || "").replace(/^#/, ""));
        var slash = raw.indexOf("/");
        var parsed = slash === -1
            ? { key: raw, section: "" }
            : { key: raw.slice(0, slash), section: raw.slice(slash + 1) };
        if (parsed.key === "folds") parsed.key = "proofs";
        return parsed;
    }

    function stepHit(direction) {
        var hits = hitsInView();
        if (!hits.length) return;
        var start = hitAt >= 0 ? hitAt : (direction > 0 ? -1 : 0);
        hitAt = (start + direction + hits.length) % hits.length;
        hits.forEach(function (hit) { hit.classList.remove("is-current"); });
        hits[hitAt].classList.add("is-current");
        hits[hitAt].scrollIntoView({ block: "center" });
        syncChrome(searchArticles(query));
    }

    function followLink(event) {
        var link = event.target.closest("a[href^='#']");
        if (!link) return;
        var parsed = parseHref(link.getAttribute("href"));
        if (!byKey[parsed.key]) return;
        event.preventDefault();
        openTopic(parsed.key, parsed.section, true, parsed.section ? "section" : "top");
    }

    indexArticles();

    var initial = parseHref(location.hash);
    var hadHash = location.hash.length > 1;
    if (!byKey[initial.key]) initial = { key: "start", section: "" };
    currentKey = initial.key;
    currentSection = initial.section;
    if (location.hash !== hashFor(currentKey, currentSection)) {
        history.replaceState(null, "", hashFor(currentKey, currentSection));
    }
    paint(currentSection ? "section" : (hadHash && currentKey !== "start" ? "top" : "home"));

    var searchForm = document.getElementById("help-search");
    if (searchForm) searchForm.addEventListener("submit", function (event) { event.preventDefault(); });

    search.addEventListener("input", function () {
        var next = search.value.trim();
        if (next === query) return;
        query = next;
        var shown = searchArticles(query);
        if (!shown.some(function (article) { return article.key === currentKey; }) && shown[0]) {
            currentKey = shown[0].key;
            currentSection = "";
            history.replaceState(null, "", hashFor(currentKey, ""));
        }
        paint("none");
    });

    search.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && search.value) {
            event.stopPropagation();
            search.value = "";
            query = "";
            paint("none");
            return;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            stepHit(1);
        }
    });

    document.getElementById("help-clear").addEventListener("click", function () {
        search.value = "";
        query = "";
        paint("none");
        search.focus();
    });

    backBtn.addEventListener("click", function () {
        if (!backStack.length) return;
        forwardStack.push({ key: currentKey, section: currentSection });
        var previous = backStack.pop();
        currentKey = previous.key;
        currentSection = previous.section;
        history.replaceState(null, "", hashFor(currentKey, currentSection));
        paint(currentSection ? "section" : "top");
    });

    forwardBtn.addEventListener("click", function () {
        if (!forwardStack.length) return;
        backStack.push({ key: currentKey, section: currentSection });
        var next = forwardStack.pop();
        currentKey = next.key;
        currentSection = next.section;
        history.replaceState(null, "", hashFor(currentKey, currentSection));
        paint(currentSection ? "section" : "top");
    });

    prevBtn.addEventListener("click", function () { stepHit(-1); });
    nextBtn.addEventListener("click", function () { stepHit(1); });
    tree.addEventListener("click", followLink);
    reader.addEventListener("click", followLink);
    window.addEventListener("hashchange", function () {
        var parsed = parseHref(location.hash);
        if (!byKey[parsed.key]) return;
        if (parsed.key === currentKey && (parsed.section || "") === (currentSection || "")) return;
        currentKey = parsed.key;
        currentSection = parsed.section || "";
        paint(currentSection ? "section" : "top");
    });

    if (window.matchMedia("(min-width: 800px)").matches) {
        try { search.focus({ preventScroll: true }); }
        catch (err) { search.focus(); }
    }
})();
