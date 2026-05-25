/**
 * @jest-environment jsdom
 *
 * JavaScript Logic Tests for list.js, details.js, and admin.js
 * Each test is worth 1 point.
 */

const fs   = require("fs");
const path = require("path");
const vm   = require("vm");

// ---------------------------------------------------------------------------
// Read each student script once
// ---------------------------------------------------------------------------
const listCode    = fs.readFileSync(
  path.resolve(__dirname, "../../src/resources/list.js"), "utf8"
);
const detailsCode = fs.readFileSync(
  path.resolve(__dirname, "../../src/resources/details.js"), "utf8"
);
const adminCode   = fs.readFileSync(
  path.resolve(__dirname, "../../src/resources/admin.js"), "utf8"
);

// ---------------------------------------------------------------------------
// DOM builders
// ---------------------------------------------------------------------------
function buildListDOM() {
  document.body.innerHTML = `
    <section id="resource-list-section"></section>
  `;
}

function buildDetailsDOM() {
  document.body.innerHTML = `
    <h1 id="resource-title"></h1>
    <p  id="resource-description"></p>
    <a  id="resource-link" href="#" target="_blank">Access Resource Material</a>
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
    <form id="resource-form" action="#">
      <fieldset>
        <legend>Resource Details</legend>
        <label for="resource-title">Title</label>
        <input  type="text" id="resource-title"       required />
        <label for="resource-description">Description</label>
        <textarea           id="resource-description"></textarea>
        <label for="resource-link">Link</label>
        <input  type="url"  id="resource-link"        required />
        <button type="submit" id="add-resource">Add Resource</button>
      </fieldset>
    </form>

    <table id="resources-table">
      <thead>
        <tr>
          <th>Title</th><th>Description</th><th>Link</th><th>Actions</th>
        </tr>
      </thead>
      <tbody id="resources-tbody"></tbody>
    </table>
  `;
}

// ---------------------------------------------------------------------------
// Generic context builder
// ---------------------------------------------------------------------------
function buildContext(code, domBuilder, extraGlobals = {}) {
  domBuilder();

  const fetchMock   = jest.fn(() =>
    Promise.resolve({
      ok:   true,
      json: () => Promise.resolve({ success: true, data: [] }),
    })
  );
  const alertMock   = jest.fn();
  const confirmMock = jest.fn(() => true);

  const context = {
    document,
    window,
    console,
    fetch:   fetchMock,
    alert:   alertMock,
    confirm: confirmMock,
    URLSearchParams,
    ...extraGlobals,
  };

  vm.createContext(context);
  vm.runInContext(code, context);

  context.fetchMock   = fetchMock;
  context.alertMock   = alertMock;
  context.confirmMock = confirmMock;

  return context;
}

// ---------------------------------------------------------------------------
// Seed helper for admin — injects into the script's closed-over `resources`
// ---------------------------------------------------------------------------
function buildAdminContext(extraGlobals = {}) {
  const ctx = buildContext(adminCode, buildAdminDOM, extraGlobals);
  vm.runInContext(
    `function __seedResources(arr) { resources = arr; renderTable(arr); }`,
    ctx
  );
  return ctx;
}

function seedResources(ctx, arr) {
  ctx.__seedResources(arr);
}

// ---------------------------------------------------------------------------
// findCall helper
// ---------------------------------------------------------------------------
function findCall(fetchMock, method) {
  return fetchMock.mock.calls.find(
    ([, opts]) =>
      opts && opts.method && opts.method.toUpperCase() === method.toUpperCase()
  );
}

// ---------------------------------------------------------------------------
// flushPromises — drains the entire microtask queue
// ---------------------------------------------------------------------------
function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

// ===========================================================================
// list.js tests
// ===========================================================================

// ---------------------------------------------------------------------------
// [JS-01] createResourceArticle returns an <article> element
// ---------------------------------------------------------------------------
test("[JS-01] createResourceArticle returns an <article> element", () => {
  const ctx      = buildContext(listCode, buildListDOM);
  const resource = { id: 1, title: "MDN Web Docs", description: "Great docs.", link: "https://developer.mozilla.org" };
  const article  = ctx.createResourceArticle(resource);
  expect(article.tagName.toLowerCase()).toBe("article");
});

// ---------------------------------------------------------------------------
// [JS-02] createResourceArticle includes the resource title
// ---------------------------------------------------------------------------
test("[JS-02] createResourceArticle includes the resource title", () => {
  const ctx      = buildContext(listCode, buildListDOM);
  const resource = { id: 1, title: "MDN Web Docs", description: "Great docs.", link: "https://developer.mozilla.org" };
  expect(ctx.createResourceArticle(resource).textContent).toContain("MDN Web Docs");
});

// ---------------------------------------------------------------------------
// [JS-03] createResourceArticle includes the resource description
// ---------------------------------------------------------------------------
test("[JS-03] createResourceArticle includes the resource description", () => {
  const ctx      = buildContext(listCode, buildListDOM);
  const resource = { id: 2, title: "CSS Tricks", description: "All about CSS.", link: "https://css-tricks.com" };
  expect(ctx.createResourceArticle(resource).textContent).toContain("All about CSS.");
});

// ---------------------------------------------------------------------------
// [JS-04] createResourceArticle link href points to details.html?id=
// ---------------------------------------------------------------------------
test("[JS-04] createResourceArticle 'View' link href is 'details.html?id=<id>'", () => {
  const ctx      = buildContext(listCode, buildListDOM);
  const resource = { id: 3, title: "JS Info", description: "JS tutorial.", link: "https://javascript.info" };
  const article  = ctx.createResourceArticle(resource);
  const anchor   = article.querySelector("a");
  expect(anchor).not.toBeNull();
  expect(anchor.getAttribute("href")).toMatch(/details\.html\?id=3/i);
});

// ---------------------------------------------------------------------------
// [JS-05] loadResources fetches from ./api/index.php
// ---------------------------------------------------------------------------
test("[JS-05] loadResources fetches from ./api/index.php", async () => {
  const ctx = buildContext(listCode, buildListDOM);
  ctx.fetchMock.mockClear();
  ctx.fetchMock.mockResolvedValueOnce({
    ok:   true,
    json: () => Promise.resolve({ success: true, data: [] }),
  });

  await ctx.loadResources();

  expect(ctx.fetchMock).toHaveBeenCalled();
  const [url] = ctx.fetchMock.mock.calls[0];
  expect(url).toMatch(/api\/index\.php/i);
});

// ---------------------------------------------------------------------------
// [JS-06] loadResources renders one <article> per resource
// ---------------------------------------------------------------------------
test("[JS-06] loadResources renders one <article> per resource returned by the API", async () => {
  const ctx = buildContext(listCode, buildListDOM);
  ctx.fetchMock.mockResolvedValueOnce({
    ok:   true,
    json: () => Promise.resolve({
      success: true,
      data: [
        { id: 1, title: "Res A", description: "Desc A", link: "https://a.com" },
        { id: 2, title: "Res B", description: "Desc B", link: "https://b.com" },
      ],
    }),
  });

  await ctx.loadResources();

  expect(
    document.querySelectorAll("#resource-list-section article").length
  ).toBe(2);
});

// ---------------------------------------------------------------------------
// [JS-07] loadResources clears existing content before rendering
// ---------------------------------------------------------------------------
test("[JS-07] loadResources clears existing content before rendering", async () => {
  const ctx = buildContext(listCode, buildListDOM);
  document.getElementById("resource-list-section").innerHTML =
    "<article>stale</article>";

  ctx.fetchMock.mockResolvedValueOnce({
    ok:   true,
    json: () => Promise.resolve({ success: true, data: [] }),
  });

  await ctx.loadResources();

  expect(
    document.querySelectorAll("#resource-list-section article").length
  ).toBe(0);
});

// ===========================================================================
// details.js tests
// ===========================================================================

// ---------------------------------------------------------------------------
// [JS-08] getResourceIdFromURL returns the id query parameter
// ---------------------------------------------------------------------------
test("[JS-08] getResourceIdFromURL returns the id from the URL query string", () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM, {
    window: { ...window, location: { search: "?id=42" } },
  });
  expect(ctx.getResourceIdFromURL()).toBe("42");
});

// ---------------------------------------------------------------------------
// [JS-09] renderResourceDetails sets title, description and link
// ---------------------------------------------------------------------------
test("[JS-09] renderResourceDetails populates title, description, and link elements", () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM);
  ctx.renderResourceDetails({
    id:          1,
    title:       "MDN Web Docs",
    description: "Mozilla docs.",
    link:        "https://developer.mozilla.org",
  });

  expect(document.getElementById("resource-title").textContent).toBe("MDN Web Docs");
  expect(document.getElementById("resource-description").textContent).toBe("Mozilla docs.");
  expect(document.getElementById("resource-link").getAttribute("href")).toBe(
    "https://developer.mozilla.org"
  );
});

// ---------------------------------------------------------------------------
// [JS-10] createCommentArticle returns an <article> with <p> and <footer>
// ---------------------------------------------------------------------------
test("[JS-10] createCommentArticle returns an <article> containing a <p> and a <footer>", () => {
  const ctx     = buildContext(detailsCode, buildDetailsDOM);
  const comment = { id: 1, resource_id: 1, author: "Ali Hassan", text: "Very helpful!", created_at: "" };
  const article = ctx.createCommentArticle(comment);

  expect(article.tagName.toLowerCase()).toBe("article");
  expect(article.querySelector("p")).not.toBeNull();
  expect(article.querySelector("footer")).not.toBeNull();
});

// ---------------------------------------------------------------------------
// [JS-11] createCommentArticle includes the comment text and author
// ---------------------------------------------------------------------------
test("[JS-11] createCommentArticle includes the comment text and author", () => {
  const ctx     = buildContext(detailsCode, buildDetailsDOM);
  const comment = { id: 1, resource_id: 1, author: "Fatema Ahmed", text: "Great resource!", created_at: "" };
  const article = ctx.createCommentArticle(comment);

  expect(article.textContent).toContain("Great resource!");
  expect(article.textContent).toContain("Fatema Ahmed");
});

// ---------------------------------------------------------------------------
// [JS-12] renderComments clears and re-renders comment list
// ---------------------------------------------------------------------------
test("[JS-12] renderComments clears the comment list and renders one <article> per comment", () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM);
  document.getElementById("comment-list").innerHTML = "<article>stale</article>";

  vm.runInContext(
    `currentComments = [
      { id: 1, resource_id: 1, author: "Ali",   text: "Nice!",    created_at: "" },
      { id: 2, resource_id: 1, author: "Noora", text: "Helpful!", created_at: "" }
    ];`,
    ctx
  );

  ctx.renderComments();

  expect(document.querySelectorAll("#comment-list article").length).toBe(2);
});

// ---------------------------------------------------------------------------
// [JS-13] handleAddComment calls event.preventDefault
// ---------------------------------------------------------------------------
test("[JS-13] handleAddComment calls event.preventDefault()", () => {
  const ctx       = buildContext(detailsCode, buildDetailsDOM);
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-comment").value = "Test comment";
  ctx.handleAddComment(mockEvent);
  expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// [JS-14] handleAddComment does nothing when textarea is empty
// ---------------------------------------------------------------------------
test("[JS-14] handleAddComment does nothing when the textarea is empty", () => {
  const ctx       = buildContext(detailsCode, buildDetailsDOM);
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-comment").value = "";
  ctx.handleAddComment(mockEvent);
  expect(ctx.fetchMock.mock.calls.length).toBe(0);
});

// ---------------------------------------------------------------------------
// [JS-15] handleAddComment sends a POST to ./api/index.php?action=comment
// ---------------------------------------------------------------------------
test("[JS-15] handleAddComment sends a POST fetch request to the comments API endpoint", () => {
  const ctx       = buildContext(detailsCode, buildDetailsDOM);
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-comment").value = "A real comment.";
  ctx.handleAddComment(mockEvent);

  const postCall = findCall(ctx.fetchMock, "POST");
  expect(postCall).toBeDefined();
  expect(postCall[0]).toMatch(/action=comment/i);
});

// ---------------------------------------------------------------------------
// [JS-16] handleAddComment clears the textarea after posting
// Flush the full microtask + macrotask queue so the async fetch chain
// (fetch → .json() → setState → clear) has completely resolved.
// ---------------------------------------------------------------------------
test("[JS-16] handleAddComment clears the textarea after posting", async () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM);
  ctx.fetchMock.mockResolvedValueOnce({
    ok:   true,
    json: () => Promise.resolve({
      success: true,
      id:      99,
      data:    {
        id:          99,
        resource_id: 1,
        author:      "Student",
        text:        "A real comment.",
        created_at:  "",
      },
    }),
  });

  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-comment").value = "A real comment.";
  ctx.handleAddComment(mockEvent);

  // Drain all pending promises and timers
  await flushPromises();

  expect(document.getElementById("new-comment").value).toBe("");
});

// ---------------------------------------------------------------------------
// [JS-17] initializePage fetches resource from ./api/index.php?id=
// ---------------------------------------------------------------------------
test("[JS-17] initializePage fetches resource details from ./api/index.php?id=<id>", async () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM, {
    window: { ...window, location: { search: "?id=1" } },
  });

  ctx.fetchMock.mockResolvedValue({
    ok:   true,
    json: () => Promise.resolve({ success: true, data: [] }),
  });

  await ctx.initializePage();

  const urls = ctx.fetchMock.mock.calls.map(([url]) => url);
  expect(urls.some(u => /api\/index\.php.*id=1/i.test(u))).toBe(true);
});

// ---------------------------------------------------------------------------
// [JS-18] initializePage fetches comments from ./api/index.php?resource_id=&action=comments
// ---------------------------------------------------------------------------
test("[JS-18] initializePage fetches comments from the comments API endpoint", async () => {
  const ctx = buildContext(detailsCode, buildDetailsDOM, {
    window: { ...window, location: { search: "?id=2" } },
  });

  ctx.fetchMock.mockResolvedValue({
    ok:   true,
    json: () => Promise.resolve({ success: true, data: [] }),
  });

  await ctx.initializePage();

  const urls = ctx.fetchMock.mock.calls.map(([url]) => url);
  expect(urls.some(u => /action=comments/i.test(u))).toBe(true);
});

// ===========================================================================
// admin.js tests
// ===========================================================================

// ---------------------------------------------------------------------------
// [JS-19] createResourceRow returns a <tr> element
// ---------------------------------------------------------------------------
test("[JS-19] createResourceRow returns a <tr> element", () => {
  const ctx      = buildAdminContext();
  const resource = { id: 1, title: "Syllabus", description: "Course outline.", link: "https://uob.edu.bh" };
  expect(ctx.createResourceRow(resource).tagName.toLowerCase()).toBe("tr");
});

// ---------------------------------------------------------------------------
// [JS-20] createResourceRow includes title, description, and link cells
// ---------------------------------------------------------------------------
test("[JS-20] createResourceRow includes title, description, and link in <td>s", () => {
  const ctx      = buildAdminContext();
  const resource = { id: 1, title: "MDN", description: "Mozilla docs", link: "https://mdn.io" };
  const row      = ctx.createResourceRow(resource);
  expect(row.textContent).toContain("MDN");
  expect(row.textContent).toContain("Mozilla docs");
  expect(row.textContent).toContain("https://mdn.io");
});

// ---------------------------------------------------------------------------
// [JS-21] createResourceRow contains edit and delete buttons with data-id
// ---------------------------------------------------------------------------
test("[JS-21] createResourceRow contains edit-btn and delete-btn with correct data-id", () => {
  const ctx      = buildAdminContext();
  const resource = { id: 7, title: "Test", description: "Desc", link: "https://test.com" };
  const row      = ctx.createResourceRow(resource);

  const editBtn   = row.querySelector(".edit-btn");
  const deleteBtn = row.querySelector(".delete-btn");

  expect(editBtn).not.toBeNull();
  expect(editBtn.dataset.id).toBe("7");
  expect(deleteBtn).not.toBeNull();
  expect(deleteBtn.dataset.id).toBe("7");
});

// ---------------------------------------------------------------------------
// [JS-22] renderTable clears the tbody before rendering
// ---------------------------------------------------------------------------
test("[JS-22] renderTable clears the tbody before rendering", () => {
  const ctx = buildAdminContext();
  document.getElementById("resources-tbody").innerHTML = "<tr><td>stale</td></tr>";
  ctx.renderTable([]);
  expect(document.getElementById("resources-tbody").innerHTML.trim()).toBe("");
});

// ---------------------------------------------------------------------------
// [JS-23] renderTable renders one <tr> per resource
// ---------------------------------------------------------------------------
test("[JS-23] renderTable renders one <tr> per resource", () => {
  const ctx = buildAdminContext();
  ctx.renderTable([
    { id: 1, title: "A", description: "D1", link: "https://a.com" },
    { id: 2, title: "B", description: "D2", link: "https://b.com" },
    { id: 3, title: "C", description: "D3", link: "https://c.com" },
  ]);
  expect(document.querySelectorAll("#resources-tbody tr").length).toBe(3);
});

// ---------------------------------------------------------------------------
// [JS-24] handleAddResource calls event.preventDefault
// ---------------------------------------------------------------------------
test("[JS-24] handleAddResource calls event.preventDefault()", () => {
  const ctx       = buildAdminContext();
  const mockEvent = { preventDefault: jest.fn() };

  document.getElementById("resource-title").value       = "New Resource";
  document.getElementById("resource-description").value = "A description.";
  document.getElementById("resource-link").value        = "https://example.com";

  ctx.handleAddResource(mockEvent);
  expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// [JS-25] handleAddResource sends a POST fetch request with correct body
// ---------------------------------------------------------------------------
test("[JS-25] handleAddResource sends a POST fetch request with title, description, and link", () => {
  const ctx       = buildAdminContext();
  const mockEvent = { preventDefault: jest.fn() };

  document.getElementById("resource-title").value       = "New Resource";
  document.getElementById("resource-description").value = "A description.";
  document.getElementById("resource-link").value        = "https://example.com";

  ctx.handleAddResource(mockEvent);

  const postCall = findCall(ctx.fetchMock, "POST");
  expect(postCall).toBeDefined();

  const body = JSON.parse(postCall[1].body);
  expect(body.title).toBe("New Resource");
  expect(body.link).toBe("https://example.com");
});

// ---------------------------------------------------------------------------
// [JS-26] handleTableClick sends DELETE when delete-btn is clicked
// ---------------------------------------------------------------------------
test("[JS-26] handleTableClick sends a DELETE fetch request when delete-btn is clicked", () => {
  const ctx = buildAdminContext();

  seedResources(ctx, [
    { id: 5, title: "To Delete", description: "Bye.", link: "https://bye.com" },
  ]);

  const deleteBtn = document.querySelector(".delete-btn");
  expect(deleteBtn).not.toBeNull();

  ctx.handleTableClick({ target: deleteBtn });

  const deleteCall = findCall(ctx.fetchMock, "DELETE");
  expect(deleteCall).toBeDefined();
});

// ---------------------------------------------------------------------------
// [JS-27] handleTableClick populates form when edit-btn is clicked
// ---------------------------------------------------------------------------
test("[JS-27] handleTableClick populates the form fields when edit-btn is clicked", () => {
  const ctx = buildAdminContext();

  seedResources(ctx, [
    { id: 3, title: "Edit Me", description: "Old desc.", link: "https://old.com" },
  ]);

  const editBtn = document.querySelector(".edit-btn");
  expect(editBtn).not.toBeNull();

  ctx.handleTableClick({ target: editBtn });

  expect(document.getElementById("resource-title").value).toBe("Edit Me");
  expect(document.getElementById("resource-link").value).toBe("https://old.com");
});

// ---------------------------------------------------------------------------
// [JS-28] loadAndInitialize fetches from ./api/index.php
// Reset _listenersAttached so the guard does not short-circuit the call.
// ---------------------------------------------------------------------------
test("[JS-28] loadAndInitialize fetches resources from ./api/index.php", async () => {
  const ctx = buildAdminContext();

  // Reset the guard so loadAndInitialize runs fully
  vm.runInContext(`loadAndInitialize._listenersAttached = false;`, ctx);

  ctx.fetchMock.mockClear();
  ctx.fetchMock.mockResolvedValueOnce({
    ok:   true,
    json: () => Promise.resolve({ success: true, data: [] }),
  });

  await ctx.loadAndInitialize();

  expect(ctx.fetchMock).toHaveBeenCalled();
  const [url] = ctx.fetchMock.mock.calls[0];
  expect(url).toMatch(/api\/index\.php/i);
});

// ---------------------------------------------------------------------------
// [JS-29] loadAndInitialize renders rows for each resource returned by the API
// Reset _listenersAttached for the same reason as JS-28.
// ---------------------------------------------------------------------------
test("[JS-29] loadAndInitialize renders rows for each resource returned by the API", async () => {
  const ctx = buildAdminContext();

  vm.runInContext(`loadAndInitialize._listenersAttached = false;`, ctx);

  ctx.fetchMock.mockResolvedValueOnce({
    ok:   true,
    json: () => Promise.resolve({
      success: true,
      data: [
        { id: 1, title: "A", description: "D1", link: "https://a.com" },
        { id: 2, title: "B", description: "D2", link: "https://b.com" },
      ],
    }),
  });

  await ctx.loadAndInitialize();

  expect(document.querySelectorAll("#resources-tbody tr").length).toBe(2);
});

// ---------------------------------------------------------------------------
// [JS-30] loadAndInitialize attaches submit listener to resource-form
// ---------------------------------------------------------------------------
test("[JS-30] loadAndInitialize attaches a submit listener to resource-form", async () => {
  buildAdminDOM();

  const fetchMock = jest.fn(() =>
    Promise.resolve({
      ok:   true,
      json: () => Promise.resolve({ success: true, data: [] }),
    })
  );

  const context = {
    document, window, console,
    fetch:   fetchMock,
    alert:   jest.fn(),
    confirm: jest.fn(() => true),
    URLSearchParams,
  };

  vm.createContext(context);
  vm.runInContext(adminCode, context);

  vm.runInContext(`loadAndInitialize._listenersAttached = false;`, context);

  const spy = jest.spyOn(
    document.getElementById("resource-form"),
    "addEventListener"
  );

  await context.loadAndInitialize();

  const submitCalls = spy.mock.calls.filter(([e]) => e === "submit");
  expect(submitCalls.length).toBeGreaterThan(0);
});
