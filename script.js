// Simple session check using localStorage
function isLoggedIn() {
  return !!localStorage.getItem("mmcoeUser");
}

function requireLoginForCatalog() {
  const onCatalog = location.pathname.endsWith("catalog.html");
  if (onCatalog && !isLoggedIn()) {
    // Redirect to login if user is not authenticated
    location.href = "login.html";
  }
}

// Run on page load
document.addEventListener("DOMContentLoaded", () => {
  requireLoginForCatalog();

  // Login page logic
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const prn = document.getElementById("prn").value.trim().toLowerCase();
      const password = document.getElementById("password").value.trim();
      const msgEl = document.getElementById("loginMessage");

      // Validate PRN: must start with "mmcoe" and have digits after
      const prnMatch = prn.match(/^mmcoe(\d{3,})$/);
      if (!prnMatch) {
        msgEl.textContent = "Invalid PRN format. Use mmcoe1234.";
        msgEl.style.color = "#ef4444";
        return;
      }
      const digits = prnMatch[1];
      const last3 = digits.slice(-3); // last 3 digits of PRN
      const expectedPassword = last3;

      if (password === expectedPassword) {
        localStorage.setItem("mmcoeUser", JSON.stringify({ prn }));
        msgEl.textContent = "Login successful! Redirecting...";
        msgEl.style.color = "#22c55e";
        setTimeout(() => (location.href = "catalog.html"), 600);
      } else {
        msgEl.textContent = "Incorrect password. Use last 3 digits of your PRN.";
        msgEl.style.color = "#ef4444";
      }
    });
  }

  // Catalog page logic
  const booksGrid = document.getElementById("booksGrid");
  const searchInput = document.getElementById("searchInput");
  const departmentSelect = document.getElementById("departmentSelect");
  const resultCount = document.getElementById("resultCount");
  const clearFilters = document.getElementById("clearFilters");
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("mmcoeUser");
      location.href = "login.html";
    });
  }

  let allBooks = [];

  async function loadBooks() {
    try {
      const res = await fetch("books.json");
      allBooks = await res.json();
      renderBooks(allBooks);
    } catch (e) {
      if (resultCount) resultCount.textContent = "Failed to load books.";
      console.error(e);
    }
  }

  function matchesQuery(book, query) {
    if (!query) return true;
    const q = query.toLowerCase();
    const fields = [
      book.title,
      book.author,
      book.department,
      ...(book.keywords || [])
    ].join(" ").toLowerCase();
    return fields.includes(q);
  }

  function renderBooks(books) {
    if (!booksGrid) return;
    booksGrid.innerHTML = "";

    if (resultCount) {
      resultCount.textContent = `${books.length} result${books.length !== 1 ? "s" : ""}`;
    }

    if (books.length === 0) {
      booksGrid.innerHTML = `<div class="card" style="grid-column: 1 / -1;">
        <p class="subtle">No books match your filters. Try changing department or search terms.</p>
      </div>`;
      return;
    }

    const fragment = document.createDocumentFragment();
    books.forEach((b) => {
      const card = document.createElement("div");
      card.className = "book-card hover-up";
      card.innerHTML = `
        <span class="badge">${b.department}</span>
        <div class="book-title">${b.title}</div>
        <div class="book-meta">By ${b.author} • ${b.year}</div>
        <p class="subtle">${b.description}</p>
        ${b.link ? `<a class="btn btn-tertiary" href="${b.link}" target="_blank" rel="noopener">Open Resource</a>` : ""}
      `;
      fragment.appendChild(card);
    });

    booksGrid.appendChild(fragment);
  }

  function applyFilters() {
    const dept = departmentSelect ? departmentSelect.value : "all";
    const query = searchInput ? searchInput.value : "";
    const filtered = allBooks.filter((b) => {
      const deptOk = dept === "all" ? true : b.department === dept;
      const queryOk = matchesQuery(b, query);
      return deptOk && queryOk;
    });
    renderBooks(filtered);
  }

  if (booksGrid) {
    loadBooks();
    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (departmentSelect) departmentSelect.addEventListener("change", applyFilters);
    if (clearFilters) {
      clearFilters.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (departmentSelect) departmentSelect.value = "all";
        applyFilters();
      });
    }
  }
});
