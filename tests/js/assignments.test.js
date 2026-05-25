/**
 * @jest-environment jsdom
 *
 * JavaScript Logic Tests for src/assignments/list.js, details.js, admin.js
 * Each test is worth 1 point.
 */

const fs   = require("fs");
const path = require("path");
const vm   = require("vm");

const listCode    = fs.readFileSync(path.resolve(__dirname, "../../src/assignments/list.js"),    "utf8");
const detailsCode = fs.readFileSync(path.resolve(__dirname, "../../src/assignments/details.js"), "utf8");
const adminCode   = fs.readFileSync(path.resolve(__dirname, "../../src/assignments/admin.js"),   "utf8");

// ---------------------------------------------------------------------------
// DOM builders
// ---------------------------------------------------------------------------
function buildListDOM() {
  document.body.innerHTML = `<section id="assignment-list-section"></section>`;
}

function buildDetailsDOM() {
  document.body.innerHTML = `
    <h1 id="assignment-title"></h1>
    <p  id="assignment-due-date"></p>
    <p  id="assignment-description"></p>
    <ul id="assignment-files-list"></ul>
    <section id="discussion-forum">
      <h2>Questions &amp; Discussion</h2>
      <div id="comment-list"></div>
      <form id="comment-form" action="#">
        <fieldset>
          <legend>Ask a Question</legend>
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
    <form id="assignment-form" action="#">
      <fieldset>
        <legend>Assignment Details</legend>
        <label for="assignment-title">Title</label>
        <input  type="text" id="assignment-title"       required />
        <label for="assignment-description">Description</label>
        <textarea           id="assignment-description" required></textarea>
        <label for="assignment-due-date">Due Date</label>
        <input  type="date" id="assignment-due-date"    required />
        <label for="assignment-files">Files</label>
        <textarea           id="assignment-files"></textarea>
        <button type="submit" id="add-assignment">Add Assignment</button>
      </fieldset>
    </form>
    <table id="assignments-table">
      <thead>
        <tr>
          <th>Title</th><th>Due Date</th><th>Description</th><th>Actions</th>
        </tr>
      </thead>
      <tbody id="assignments-tbody"></tbody>
    </table>
  `;
}

// ---------------------------------------------------------------------------
// Context builder
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
    document, window, console,
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

function buildAdminContext(extraGlobals = {}) {
  const ctx = buildContext(adminCode, buildAdminDOM, extraGlobals);
  vm.runInContext(
    `function __seedAssignments(arr) { assignments = arr; renderTable(); }`,
    ctx
  );
  return ctx;
}

function seedAssignments(ctx, arr) { ctx.__seedAssignments(arr); }

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

test("[JS-01] createAssignmentArticle returns an <article> element", () => {
  const ctx = buildContext(listCode, buildListDOM);
  const a   = { id: 1, title: "HTML & CSS Portfolio", due_date: "2025-02-15", description: "Build a portfolio.", files: [] };
  expect(ctx.createAssignmentArticle(a).tagName.toLowerCase()).toBe("article");
});

test("[JS-02] createAssignmentArticle includes the assignment title", () => {
  const ctx = buildContext(listCode, buildListDOM);
  const a   = { id: 1, title: "HTML & CSS Portfolio", due_date: "2025-02-15", description: "Build a portfolio.", files: [] };
  expect(ctx.createAssignmentArticle(a).textContent).toContain("HTML & CSS Portfolio");
});

test("[JS-03] createAssignmentArticle includes the due_date", () => {
  const ctx = buildContext(listCode, buildListDOM);
  const a   = { id: 2, title: "JS Interactivity", due_date: "2025-03-01", description: "Add JS.", files: [] };
  expect(ctx.createAssignmentArticle(a).textContent).toContain("2025-03-01");
});

test("[JS-04] createAssignmentArticle includes the description", () => {
  const ctx = buildContext(listCode, buildListDOM);
  const a   = { id: 3, title: "Proposal", due_date: "2025-03-20", description: "Submit a proposal.", files: [] };
  expect(ctx.createAssignmentArticle(a).textContent).toContain("Submit a proposal.");
});

test("[JS-05] createAssignmentArticle 'View' link href is 'details.html?id=<id>'", () => {
  const ctx = buildContext(listCode, buildListDOM);
  const a   = { id: 4, title: "Test", due_date: "2025-04-01", description: "Desc.", files: [] };
  const anchor = ctx.createAssignmentArticle(a).querySelector("a");
  expect(anchor).not.toBeNull();
  expect(anchor.getAttribute("href")).toMatch(/details\.html\?id=4/i);
});

test("[JS-06] loadAssignments fetches from ./api/index.php", async () => {
  const ctx = buildContext(listCode, buildListDOM);
  ctx.fetchMock.mockClear();
  ctx.fetchMock.mockResolvedValueOnce({
    ok: true, json: () => Promise.resolve({ success: true, data: [] }),
  });
  await ctx.loadAssignments();
  expect(ctx.fetchMock).toHaveBeenCalled();
  expect(ctx.fetchMock.mock.calls[0][0]).toMatch(/api\/index\.php/i);
});

test("[JS-07] loadAssignments renders one <article> per assignment returned by the API", async () => {
  const ctx = buildContext(listCode, buildListDOM);
  ctx.fetchMock.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: [
        { id: 1, title: "A1", due_date: "2025-02-15", description: "D1", files: [] },
        { id: 2, title: "A2", due_date: "2025-03-01", description: "D2", files: [] },
      ],
    }),
  });
  await ctx.loadAssignments();
  expect(document.querySelectorAll("#assignment-list-section article").length).toBe(2);
});

test("[JS-08] loadAssignments clears existing content before rendering", async () => {
  const ctx = buildContext(listCode, buildListDOM);
  document.getElementById("assignment-list-section").innerHTML = "<article>stale</article>";
  ctx.fetchMock.mockResolvedValueOnce({
    ok: true, json: () => Promise.resolve({ success: true, data: [] }),
  });
  await ctx.loadAssignments();
  expect(document.querySelectorAll("#assignment-list-section article").length).toBe(0);
});

// ===========================================================================
// details.js
// ===========================================================================

test("[JS-09] getAssignmentIdFromURL returns the id from the URL query string", () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM, {
    window: { ...window, location: { search: "?id=7" } },
  });
  expect(ctx.getAssignmentIdFromURL()).toBe("7");
});

test("[JS-10] renderAssignmentDetails sets the assignment title", () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM);
  ctx.renderAssignmentDetails({
    id: 1, title: "HTML & CSS Portfolio", due_date: "2025-02-15",
    description: "Build a portfolio.", files: [],
  });
  expect(document.getElementById("assignment-title").textContent).toBe("HTML & CSS Portfolio");
});

test("[JS-11] renderAssignmentDetails sets due_date with 'Due:' prefix", () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM);
  ctx.renderAssignmentDetails({
    id: 1, title: "A1", due_date: "2025-02-15", description: "Desc.", files: [],
  });
  const text = document.getElementById("assignment-due-date").textContent;
  expect(text).toContain("2025-02-15");
  expect(text).toMatch(/due/i);
});

test("[JS-12] renderAssignmentDetails sets the description", () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM);
  ctx.renderAssignmentDetails({
    id: 1, title: "A1", due_date: "2025-02-15", description: "Detailed notes.", files: [],
  });
  expect(document.getElementById("assignment-description").textContent).toBe("Detailed notes.");
});

test("[JS-13] renderAssignmentDetails populates files list with one <li> per file URL", () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM);
  ctx.renderAssignmentDetails({
    id: 1, title: "A1", due_date: "2025-02-15", description: "Desc.",
    files: ["https://example.com/brief.pdf", "https://example.com/starter.zip"],
  });
  expect(document.querySelectorAll("#assignment-files-list li").length).toBe(2);
});

test("[JS-14] renderAssignmentDetails uses file URLs as href values", () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM);
  ctx.renderAssignmentDetails({
    id: 1, title: "A1", due_date: "2025-02-15", description: "Desc.",
    files: ["https://example.com/brief.pdf"],
  });
  const anchor = document.querySelector("#assignment-files-list li a");
  expect(anchor).not.toBeNull();
  expect(anchor.getAttribute("href")).toBe("https://example.com/brief.pdf");
});

test("[JS-15] createCommentArticle returns an <article> with a <p> and a <footer>", () => {
  const ctx     = buildContext(detailsCode, buildDetailsDOM);
  const comment = { id: 1, assignment_id: 1, author: "Mohamed Abdulla", text: "Can I use Flexbox?", created_at: "" };
  const article = ctx.createCommentArticle(comment);
  expect(article.tagName.toLowerCase()).toBe("article");
  expect(article.querySelector("p")).not.toBeNull();
  expect(article.querySelector("footer")).not.toBeNull();
});

test("[JS-16] createCommentArticle includes comment text and author", () => {
  const ctx     = buildContext(detailsCode, buildDetailsDOM);
  const comment = { id: 1, assignment_id: 1, author: "Zainab Ebrahim", text: "Can we use animations?", created_at: "" };
  const article = ctx.createCommentArticle(comment);
  expect(article.textContent).toContain("Can we use animations?");
  expect(article.textContent).toContain("Zainab Ebrahim");
});

test("[JS-17] renderComments clears comment-list and renders one <article> per comment", () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM);
  document.getElementById("comment-list").innerHTML = "<article>stale</article>";
  vm.runInContext(
    `currentComments = [
      { id: 1, assignment_id: 1, author: "Ali",   text: "Q1", created_at: "" },
      { id: 2, assignment_id: 1, author: "Noora", text: "Q2", created_at: "" }
    ];`,
    ctx
  );
  ctx.renderComments();
  expect(document.querySelectorAll("#comment-list article").length).toBe(2);
});

test("[JS-18] handleAddComment calls event.preventDefault()", () => {
  const ctx       = buildContext(detailsCode, buildDetailsDOM);
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-comment").value = "A question.";
  ctx.handleAddComment(mockEvent);
  expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
});

test("[JS-19] handleAddComment does nothing when the textarea is empty", () => {
  const ctx       = buildContext(detailsCode, buildDetailsDOM);
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-comment").value = "";
  ctx.handleAddComment(mockEvent);
  expect(ctx.fetchMock.mock.calls.length).toBe(0);
});

test("[JS-20] handleAddComment sends a POST to ./api/index.php?action=comment", () => {
  const ctx       = buildContext(detailsCode, buildDetailsDOM);
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-comment").value = "A real question.";
  ctx.handleAddComment(mockEvent);
  const postCall = findCall(ctx.fetchMock, "POST");
  expect(postCall).toBeDefined();
  expect(postCall[0]).toMatch(/action=comment/i);
});

test("[JS-21] handleAddComment clears the textarea after a successful POST", async () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM);
  ctx.fetchMock.mockResolvedValueOnce({
    ok:   true,
    json: () => Promise.resolve({
      success: true,
      id:      5,
      data:    { id: 5, assignment_id: 1, author: "Student", text: "A real question.", created_at: "" },
    }),
  });
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-comment").value = "A real question.";
  ctx.handleAddComment(mockEvent);
  await flushPromises();
  expect(document.getElementById("new-comment").value).toBe("");
});

test("[JS-22] initializePage fetches assignment from ./api/index.php?id=<id>", async () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM, {
    window: { ...window, location: { search: "?id=2" } },
  });
  ctx.fetchMock.mockResolvedValue({
    ok: true, json: () => Promise.resolve({ success: true, data: [] }),
  });
  await ctx.initializePage();
  const urls = ctx.fetchMock.mock.calls.map(([url]) => url);
  expect(urls.some(u => /api\/index\.php.*id=2/i.test(u))).toBe(true);
});

test("[JS-23] initializePage fetches comments with action=comments&assignment_id=<id>", async () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM, {
    window: { ...window, location: { search: "?id=2" } },
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

test("[JS-24] createAssignmentRow returns a <tr> element", () => {
  const ctx = buildAdminContext();
  const a   = { id: 1, title: "HTML & CSS Portfolio", due_date: "2025-02-15", description: "Build it.", files: [] };
  expect(ctx.createAssignmentRow(a).tagName.toLowerCase()).toBe("tr");
});

test("[JS-25] createAssignmentRow includes title, due_date, and description in <td>s", () => {
  const ctx = buildAdminContext();
  const a   = { id: 1, title: "Portfolio", due_date: "2025-02-15", description: "Build portfolio.", files: [] };
  const row = ctx.createAssignmentRow(a);
  expect(row.textContent).toContain("Portfolio");
  expect(row.textContent).toContain("2025-02-15");
  expect(row.textContent).toContain("Build portfolio.");
});

test("[JS-26] createAssignmentRow contains edit-btn and delete-btn with correct data-id", () => {
  const ctx = buildAdminContext();
  const a   = { id: 9, title: "Test", due_date: "2025-05-01", description: "Desc.", files: [] };
  const row = ctx.createAssignmentRow(a);
  const edit = row.querySelector(".edit-btn");
  const del  = row.querySelector(".delete-btn");
  expect(edit).not.toBeNull();
  expect(edit.dataset.id).toBe("9");
  expect(del).not.toBeNull();
  expect(del.dataset.id).toBe("9");
});

test("[JS-27] renderTable clears the tbody before rendering", () => {
  const ctx = buildAdminContext();
  document.getElementById("assignments-tbody").innerHTML = "<tr><td>stale</td></tr>";
  vm.runInContext(`assignments = []; renderTable();`, ctx);
  expect(document.getElementById("assignments-tbody").innerHTML.trim()).toBe("");
});

test("[JS-28] renderTable renders one <tr> per assignment", () => {
  const ctx = buildAdminContext();
  seedAssignments(ctx, [
    { id: 1, title: "A1", due_date: "2025-02-15", description: "D1", files: [] },
    { id: 2, title: "A2", due_date: "2025-03-01", description: "D2", files: [] },
    { id: 3, title: "A3", due_date: "2025-03-20", description: "D3", files: [] },
  ]);
  expect(document.querySelectorAll("#assignments-tbody tr").length).toBe(3);
});

test("[JS-29] handleAddAssignment calls event.preventDefault()", () => {
  const ctx       = buildAdminContext();
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("assignment-title").value       = "New Assignment";
  document.getElementById("assignment-due-date").value    = "2025-05-01";
  document.getElementById("assignment-description").value = "A description.";
  document.getElementById("assignment-files").value       = "";
  ctx.handleAddAssignment(mockEvent);
  expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
});

test("[JS-30] handleAddAssignment sends a POST with title, due_date, description, files", () => {
  const ctx       = buildAdminContext();
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("assignment-title").value       = "New Assignment";
  document.getElementById("assignment-due-date").value    = "2025-05-01";
  document.getElementById("assignment-description").value = "Some notes.";
  document.getElementById("assignment-files").value       =
    "https://example.com/brief.pdf\nhttps://example.com/starter.zip";
  ctx.handleAddAssignment(mockEvent);
  const postCall = findCall(ctx.fetchMock, "POST");
  expect(postCall).toBeDefined();
  const body = JSON.parse(postCall[1].body);
  expect(body.title).toBe("New Assignment");
  expect(body.due_date).toBe("2025-05-01");
  expect(Array.isArray(body.files)).toBe(true);
  expect(body.files).toContain("https://example.com/brief.pdf");
});

test("[JS-31] handleTableClick sends a DELETE request when delete-btn is clicked", () => {
  const ctx = buildAdminContext();
  seedAssignments(ctx, [
    { id: 5, title: "To Delete", due_date: "2025-03-01", description: "Bye.", files: [] },
  ]);
  const deleteBtn = document.querySelector(".delete-btn");
  expect(deleteBtn).not.toBeNull();
  ctx.handleTableClick({ target: deleteBtn });
  const deleteCall = findCall(ctx.fetchMock, "DELETE");
  expect(deleteCall).toBeDefined();
});

test("[JS-32] handleTableClick populates the form when edit-btn is clicked", () => {
  const ctx = buildAdminContext();
  seedAssignments(ctx, [
    { id: 3, title: "Edit Me", due_date: "2025-02-10", description: "Old desc.",
      files: ["https://example.com/brief.pdf"] },
  ]);
  const editBtn = document.querySelector(".edit-btn");
  expect(editBtn).not.toBeNull();
  ctx.handleTableClick({ target: editBtn });
  expect(document.getElementById("assignment-title").value).toBe("Edit Me");
  expect(document.getElementById("assignment-due-date").value).toBe("2025-02-10");
});

test("[JS-33] loadAndInitialize fetches from ./api/index.php", async () => {
  const ctx = buildAdminContext();
  ctx.fetchMock.mockClear();
  ctx.fetchMock.mockResolvedValueOnce({
    ok: true, json: () => Promise.resolve({ success: true, data: [] }),
  });
  await ctx.loadAndInitialize();
  expect(ctx.fetchMock).toHaveBeenCalled();
  expect(ctx.fetchMock.mock.calls[0][0]).toMatch(/api\/index\.php/i);
});

test("[JS-34] loadAndInitialize renders rows for each assignment returned by the API", async () => {
  const ctx = buildAdminContext();
  ctx.fetchMock.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: [
        { id: 1, title: "A1", due_date: "2025-02-15", description: "D1", files: [] },
        { id: 2, title: "A2", due_date: "2025-03-01", description: "D2", files: [] },
      ],
    }),
  });
  await ctx.loadAndInitialize();
  expect(document.querySelectorAll("#assignments-tbody tr").length).toBe(2);
});

test("[JS-35] loadAndInitialize attaches a submit listener to assignment-form", async () => {
  buildAdminDOM();
  const fetchMock = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) })
  );
  const context = {
    document, window, console,
    fetch: fetchMock, alert: jest.fn(), confirm: jest.fn(() => true), URLSearchParams,
  };
  vm.createContext(context);
  vm.runInContext(adminCode, context);
  const spy = jest.spyOn(document.getElementById("assignment-form"), "addEventListener");
  await context.loadAndInitialize();
  expect(spy.mock.calls.filter(([e]) => e === "submit").length).toBeGreaterThan(0);
});
