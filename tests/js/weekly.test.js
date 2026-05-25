/**
 * @jest-environment jsdom
 *
 * JavaScript Logic Tests for src/weekly/list.js, details.js, and admin.js
 * Each test is worth 1 point.
 */

const fs   = require("fs");
const path = require("path");
const vm   = require("vm");

// ---------------------------------------------------------------------------
// Read student scripts
// ---------------------------------------------------------------------------
const listCode    = fs.readFileSync(path.resolve(__dirname, "../../src/weekly/list.js"),    "utf8");
const detailsCode = fs.readFileSync(path.resolve(__dirname, "../../src/weekly/details.js"), "utf8");
const adminCode   = fs.readFileSync(path.resolve(__dirname, "../../src/weekly/admin.js"),   "utf8");

// ---------------------------------------------------------------------------
// DOM builders
// ---------------------------------------------------------------------------
function buildListDOM() {
  document.body.innerHTML = `
    <section id="week-list-section"></section>
  `;
}

function buildDetailsDOM() {
  document.body.innerHTML = `
    <h1 id="week-title"></h1>
    <p  id="week-start-date"></p>
    <p  id="week-description"></p>
    <ul id="week-links-list"></ul>
    <section id="discussion-forum">
      <h2>Discussion</h2>
      <div id="comment-list"></div>
      <form id="comment-form" action="#">
        <fieldset>
          <legend>Leave a Comment</legend>
          <label for="new-comment">Comment</label>
          <textarea id="new-comment" required></textarea>
          <button type="submit">Post Comment</button>
        </fieldset>
      </form>
    </section>
  `;
}

function buildAdminDOM() {
  document.body.innerHTML = `
    <form id="week-form" action="#">
      <fieldset>
        <legend>Weekly Details</legend>
        <label for="week-title">Title</label>
        <input  type="text" id="week-title"       required />
        <label for="week-start-date">Start Date</label>
        <input  type="date" id="week-start-date"  required />
        <label for="week-description">Description</label>
        <textarea           id="week-description"></textarea>
        <label for="week-links">Links</label>
        <textarea           id="week-links"></textarea>
        <button type="submit" id="add-week">Add Week</button>
      </fieldset>
    </form>

    <table id="weeks-table">
      <thead>
        <tr>
          <th>Week Title</th>
          <th>Start Date</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="weeks-tbody"></tbody>
    </table>
  `;
}

// ---------------------------------------------------------------------------
// Generic context builder
// ---------------------------------------------------------------------------
function buildContext(code, domBuilder, extraGlobals = {}) {
  domBuilder();

  const fetchMock = jest.fn(() =>
    Promise.resolve({
      ok:   true,
      json: () => Promise.resolve({ success: true, data: [] }),
    })
  );

  const context = {
    document,
    window,
    console,
    fetch:          fetchMock,
    alert:          jest.fn(),
    confirm:        jest.fn(() => true),
    URLSearchParams,
    ...extraGlobals,
  };

  vm.createContext(context);
  vm.runInContext(code, context);

  context.fetchMock = fetchMock;
  return context;
}

// ---------------------------------------------------------------------------
// Admin context helper — exposes seed function
// ---------------------------------------------------------------------------
function buildAdminContext(extraGlobals = {}) {
  const ctx = buildContext(adminCode, buildAdminDOM, extraGlobals);
  vm.runInContext(
    `function __seedWeeks(arr) { weeks = arr; renderTable(); }`,
    ctx
  );
  return ctx;
}

function seedWeeks(ctx, arr) {
  ctx.__seedWeeks(arr);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function findCall(fetchMock, method) {
  return fetchMock.mock.calls.find(
    ([, opts]) => opts && opts.method && opts.method.toUpperCase() === method.toUpperCase()
  );
}

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

// ===========================================================================
// list.js
// ===========================================================================

test("[JS-01] createWeekArticle returns an <article> element", () => {
  const ctx  = buildContext(listCode, buildListDOM);
  const week = { id: 1, title: "Week 1: Intro to HTML", start_date: "2025-01-13", description: "Learn HTML.", links: [] };
  expect(ctx.createWeekArticle(week).tagName.toLowerCase()).toBe("article");
});

test("[JS-02] createWeekArticle includes the week title", () => {
  const ctx  = buildContext(listCode, buildListDOM);
  const week = { id: 1, title: "Week 1: Intro to HTML", start_date: "2025-01-13", description: "Learn HTML.", links: [] };
  expect(ctx.createWeekArticle(week).textContent).toContain("Week 1: Intro to HTML");
});

test("[JS-03] createWeekArticle includes the start_date", () => {
  const ctx  = buildContext(listCode, buildListDOM);
  const week = { id: 2, title: "Week 2: CSS", start_date: "2025-01-20", description: "Learn CSS.", links: [] };
  expect(ctx.createWeekArticle(week).textContent).toContain("2025-01-20");
});

test("[JS-04] createWeekArticle includes the description", () => {
  const ctx  = buildContext(listCode, buildListDOM);
  const week = { id: 3, title: "Week 3", start_date: "2025-01-27", description: "Responsive design.", links: [] };
  expect(ctx.createWeekArticle(week).textContent).toContain("Responsive design.");
});

test("[JS-05] createWeekArticle 'View' link href is 'details.html?id=<id>'", () => {
  const ctx  = buildContext(listCode, buildListDOM);
  const week = { id: 4, title: "Week 4", start_date: "2025-02-03", description: "JS basics.", links: [] };
  const a    = ctx.createWeekArticle(week).querySelector("a");
  expect(a).not.toBeNull();
  expect(a.getAttribute("href")).toMatch(/details\.html\?id=4/i);
});

test("[JS-06] loadWeeks fetches from ./api/index.php", async () => {
  const ctx = buildContext(listCode, buildListDOM);
  ctx.fetchMock.mockClear();
  ctx.fetchMock.mockResolvedValueOnce({
    ok: true, json: () => Promise.resolve({ success: true, data: [] }),
  });
  await ctx.loadWeeks();
  expect(ctx.fetchMock).toHaveBeenCalled();
  const [url] = ctx.fetchMock.mock.calls[0];
  expect(url).toMatch(/api\/index\.php/i);
});

test("[JS-07] loadWeeks renders one <article> per week returned by the API", async () => {
  const ctx = buildContext(listCode, buildListDOM);
  ctx.fetchMock.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: [
        { id: 1, title: "W1", start_date: "2025-01-13", description: "D1", links: [] },
        { id: 2, title: "W2", start_date: "2025-01-20", description: "D2", links: [] },
      ],
    }),
  });
  await ctx.loadWeeks();
  expect(document.querySelectorAll("#week-list-section article").length).toBe(2);
});

test("[JS-08] loadWeeks clears existing content before rendering", async () => {
  const ctx = buildContext(listCode, buildListDOM);
  document.getElementById("week-list-section").innerHTML = "<article>stale</article>";
  ctx.fetchMock.mockResolvedValueOnce({
    ok: true, json: () => Promise.resolve({ success: true, data: [] }),
  });
  await ctx.loadWeeks();
  expect(document.querySelectorAll("#week-list-section article").length).toBe(0);
});

// ===========================================================================
// details.js
// ===========================================================================

test("[JS-09] getWeekIdFromURL returns the id from the URL query string", () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM, {
    window: { ...window, location: { search: "?id=5" } },
  });
  expect(ctx.getWeekIdFromURL()).toBe("5");
});

test("[JS-10] renderWeekDetails sets the week title", () => {
  const ctx  = buildContext(detailsCode, buildDetailsDOM);
  const week = { id: 1, title: "Week 1: Intro", start_date: "2025-01-13", description: "HTML basics.", links: [] };
  ctx.renderWeekDetails(week);
  expect(document.getElementById("week-title").textContent).toBe("Week 1: Intro");
});

test("[JS-11] renderWeekDetails sets start_date with 'Starts on:' prefix", () => {
  const ctx  = buildContext(detailsCode, buildDetailsDOM);
  const week = { id: 1, title: "Week 1", start_date: "2025-01-13", description: "HTML basics.", links: [] };
  ctx.renderWeekDetails(week);
  expect(document.getElementById("week-start-date").textContent).toContain("2025-01-13");
  expect(document.getElementById("week-start-date").textContent).toMatch(/starts on/i);
});

test("[JS-12] renderWeekDetails sets the description", () => {
  const ctx  = buildContext(detailsCode, buildDetailsDOM);
  const week = { id: 1, title: "Week 1", start_date: "2025-01-13", description: "Detailed notes.", links: [] };
  ctx.renderWeekDetails(week);
  expect(document.getElementById("week-description").textContent).toBe("Detailed notes.");
});

test("[JS-13] renderWeekDetails populates week-links-list with one <li> per link", () => {
  const ctx  = buildContext(detailsCode, buildDetailsDOM);
  const week = {
    id: 1, title: "Week 1", start_date: "2025-01-13", description: "HTML.",
    links: ["https://mdn.io", "https://w3schools.com"],
  };
  ctx.renderWeekDetails(week);
  expect(document.querySelectorAll("#week-links-list li").length).toBe(2);
});

test("[JS-14] createCommentArticle returns an <article> with a <p> and a <footer>", () => {
  const ctx     = buildContext(detailsCode, buildDetailsDOM);
  const comment = { id: 1, week_id: 1, author: "Ali Hassan", text: "Great week!", created_at: "" };
  const article = ctx.createCommentArticle(comment);
  expect(article.tagName.toLowerCase()).toBe("article");
  expect(article.querySelector("p")).not.toBeNull();
  expect(article.querySelector("footer")).not.toBeNull();
});

test("[JS-15] createCommentArticle includes comment text and author", () => {
  const ctx     = buildContext(detailsCode, buildDetailsDOM);
  const comment = { id: 1, week_id: 1, author: "Fatema Ahmed", text: "Very helpful!", created_at: "" };
  const article = ctx.createCommentArticle(comment);
  expect(article.textContent).toContain("Very helpful!");
  expect(article.textContent).toContain("Fatema Ahmed");
});

test("[JS-16] renderComments clears comment-list and renders one <article> per comment", () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM);
  document.getElementById("comment-list").innerHTML = "<article>stale</article>";
  vm.runInContext(
    `currentComments = [
      { id: 1, week_id: 1, author: "Ali",   text: "Nice!",    created_at: "" },
      { id: 2, week_id: 1, author: "Noora", text: "Helpful!", created_at: "" }
    ];`,
    ctx
  );
  ctx.renderComments();
  expect(document.querySelectorAll("#comment-list article").length).toBe(2);
});

test("[JS-17] handleAddComment calls event.preventDefault()", () => {
  const ctx       = buildContext(detailsCode, buildDetailsDOM);
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-comment").value = "Test comment";
  ctx.handleAddComment(mockEvent);
  expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
});

test("[JS-18] handleAddComment does nothing when the textarea is empty", () => {
  const ctx       = buildContext(detailsCode, buildDetailsDOM);
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-comment").value = "";
  ctx.handleAddComment(mockEvent);
  expect(ctx.fetchMock.mock.calls.length).toBe(0);
});

test("[JS-19] handleAddComment sends a POST to ./api/index.php?action=comment", () => {
  const ctx       = buildContext(detailsCode, buildDetailsDOM);
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-comment").value = "A real comment.";
  ctx.handleAddComment(mockEvent);
  const postCall = findCall(ctx.fetchMock, "POST");
  expect(postCall).toBeDefined();
  expect(postCall[0]).toMatch(/action=comment/i);
});

test("[JS-20] handleAddComment clears the textarea after a successful POST", async () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM);
  ctx.fetchMock.mockResolvedValueOnce({
    ok:   true,
    json: () => Promise.resolve({
      success: true,
      id:      10,
      data:    { id: 10, week_id: 1, author: "Student", text: "A real comment.", created_at: "" },
    }),
  });
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-comment").value = "A real comment.";
  ctx.handleAddComment(mockEvent);
  await flushPromises();
  expect(document.getElementById("new-comment").value).toBe("");
});

test("[JS-21] initializePage fetches week details from ./api/index.php?id=<id>", async () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM, {
    window: { ...window, location: { search: "?id=3" } },
  });
  ctx.fetchMock.mockResolvedValue({
    ok: true, json: () => Promise.resolve({ success: true, data: [] }),
  });
  await ctx.initializePage();
  const urls = ctx.fetchMock.mock.calls.map(([url]) => url);
  expect(urls.some(u => /api\/index\.php.*id=3/i.test(u))).toBe(true);
});

test("[JS-22] initializePage fetches comments with action=comments&week_id=<id>", async () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM, {
    window: { ...window, location: { search: "?id=3" } },
  });
  ctx.fetchMock.mockResolvedValue({
    ok: true, json: () => Promise.resolve({ success: true, data: [] }),
  });
  await ctx.initializePage();
  const urls = ctx.fetchMock.mock.calls.map(([url]) => url);
  expect(urls.some(u => /action=comments/i.test(u))).toBe(true);
});

// ===========================================================================
// admin.js
// ===========================================================================

test("[JS-23] createWeekRow returns a <tr> element", () => {
  const ctx  = buildAdminContext();
  const week = { id: 1, title: "Week 1", start_date: "2025-01-13", description: "HTML.", links: [] };
  expect(ctx.createWeekRow(week).tagName.toLowerCase()).toBe("tr");
});

test("[JS-24] createWeekRow includes title, start_date, and description in <td>s", () => {
  const ctx  = buildAdminContext();
  const week = { id: 1, title: "Week 1: HTML", start_date: "2025-01-13", description: "HTML basics.", links: [] };
  const row  = ctx.createWeekRow(week);
  expect(row.textContent).toContain("Week 1: HTML");
  expect(row.textContent).toContain("2025-01-13");
  expect(row.textContent).toContain("HTML basics.");
});

test("[JS-25] createWeekRow contains edit-btn and delete-btn with correct data-id", () => {
  const ctx  = buildAdminContext();
  const week = { id: 7, title: "Week 7", start_date: "2025-03-10", description: "Desc.", links: [] };
  const row  = ctx.createWeekRow(week);
  const edit = row.querySelector(".edit-btn");
  const del  = row.querySelector(".delete-btn");
  expect(edit).not.toBeNull();
  expect(edit.dataset.id).toBe("7");
  expect(del).not.toBeNull();
  expect(del.dataset.id).toBe("7");
});

test("[JS-26] renderTable clears the tbody before rendering", () => {
  const ctx = buildAdminContext();
  document.getElementById("weeks-tbody").innerHTML = "<tr><td>stale</td></tr>";
  vm.runInContext(`weeks = []; renderTable();`, ctx);
  expect(document.getElementById("weeks-tbody").innerHTML.trim()).toBe("");
});

test("[JS-27] renderTable renders one <tr> per week", () => {
  const ctx = buildAdminContext();
  seedWeeks(ctx, [
    { id: 1, title: "W1", start_date: "2025-01-13", description: "D1", links: [] },
    { id: 2, title: "W2", start_date: "2025-01-20", description: "D2", links: [] },
    { id: 3, title: "W3", start_date: "2025-01-27", description: "D3", links: [] },
  ]);
  expect(document.querySelectorAll("#weeks-tbody tr").length).toBe(3);
});

test("[JS-28] handleAddWeek calls event.preventDefault()", () => {
  const ctx       = buildAdminContext();
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("week-title").value       = "New Week";
  document.getElementById("week-start-date").value  = "2025-04-01";
  document.getElementById("week-description").value = "A description.";
  document.getElementById("week-links").value       = "";
  ctx.handleAddWeek(mockEvent);
  expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
});

test("[JS-29] handleAddWeek sends a POST to ./api/index.php with title, start_date, description, links", () => {
  const ctx       = buildAdminContext();
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("week-title").value       = "New Week";
  document.getElementById("week-start-date").value  = "2025-04-01";
  document.getElementById("week-description").value = "Some notes.";
  document.getElementById("week-links").value       = "https://mdn.io\nhttps://w3.org";
  ctx.handleAddWeek(mockEvent);
  const postCall = findCall(ctx.fetchMock, "POST");
  expect(postCall).toBeDefined();
  const body = JSON.parse(postCall[1].body);
  expect(body.title).toBe("New Week");
  expect(body.start_date).toBe("2025-04-01");
  expect(Array.isArray(body.links)).toBe(true);
  expect(body.links).toContain("https://mdn.io");
});

test("[JS-30] handleTableClick sends a DELETE request when delete-btn is clicked", () => {
  const ctx = buildAdminContext();
  seedWeeks(ctx, [
    { id: 5, title: "To Delete", start_date: "2025-03-01", description: "Bye.", links: [] },
  ]);
  const deleteBtn = document.querySelector(".delete-btn");
  expect(deleteBtn).not.toBeNull();
  ctx.handleTableClick({ target: deleteBtn });
  const deleteCall = findCall(ctx.fetchMock, "DELETE");
  expect(deleteCall).toBeDefined();
});

test("[JS-31] handleTableClick populates the form when edit-btn is clicked", () => {
  const ctx = buildAdminContext();
  seedWeeks(ctx, [
    { id: 3, title: "Edit Me", start_date: "2025-02-10", description: "Old desc.", links: ["https://mdn.io"] },
  ]);
  const editBtn = document.querySelector(".edit-btn");
  expect(editBtn).not.toBeNull();
  ctx.handleTableClick({ target: editBtn });
  expect(document.getElementById("week-title").value).toBe("Edit Me");
  expect(document.getElementById("week-start-date").value).toBe("2025-02-10");
});

test("[JS-32] loadAndInitialize fetches from ./api/index.php", async () => {
  const ctx = buildAdminContext();
  ctx.fetchMock.mockClear();
  ctx.fetchMock.mockResolvedValueOnce({
    ok: true, json: () => Promise.resolve({ success: true, data: [] }),
  });
  await ctx.loadAndInitialize();
  expect(ctx.fetchMock).toHaveBeenCalled();
  const [url] = ctx.fetchMock.mock.calls[0];
  expect(url).toMatch(/api\/index\.php/i);
});

test("[JS-33] loadAndInitialize renders rows for each week returned by the API", async () => {
  const ctx = buildAdminContext();
  ctx.fetchMock.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: [
        { id: 1, title: "W1", start_date: "2025-01-13", description: "D1", links: [] },
        { id: 2, title: "W2", start_date: "2025-01-20", description: "D2", links: [] },
      ],
    }),
  });
  await ctx.loadAndInitialize();
  expect(document.querySelectorAll("#weeks-tbody tr").length).toBe(2);
});

test("[JS-34] loadAndInitialize attaches a submit listener to week-form", async () => {
  buildAdminDOM();
  const fetchMock = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) })
  );
  const context = { document, window, console, fetch: fetchMock, alert: jest.fn(), confirm: jest.fn(() => true), URLSearchParams };
  vm.createContext(context);
  vm.runInContext(adminCode, context);

  const spy = jest.spyOn(document.getElementById("week-form"), "addEventListener");
  await context.loadAndInitialize();
  const submitCalls = spy.mock.calls.filter(([e]) => e === "submit");
  expect(submitCalls.length).toBeGreaterThan(0);
});
