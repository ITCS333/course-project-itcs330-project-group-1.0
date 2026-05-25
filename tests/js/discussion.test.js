/**
 * @jest-environment jsdom
 *
 * JavaScript Logic Tests for src/discussion/board.js and topic.js
 * Each test is worth 1 point.
 */

const fs   = require("fs");
const path = require("path");
const vm   = require("vm");

const boardCode = fs.readFileSync(
  path.resolve(__dirname, "../../src/discussion/board.js"), "utf8"
);
const topicCode = fs.readFileSync(
  path.resolve(__dirname, "../../src/discussion/topic.js"), "utf8"
);

// ---------------------------------------------------------------------------
// DOM builders
// ---------------------------------------------------------------------------
function buildBoardDOM() {
  document.body.innerHTML = `
    <form id="new-topic-form" action="#">
      <fieldset>
        <legend>New Topic Details</legend>
        <label for="topic-subject">Subject</label>
        <input type="text" id="topic-subject" required />
        <label for="topic-message">Message</label>
        <textarea id="topic-message" required></textarea>
        <button type="submit" id="create-topic">Create Topic</button>
      </fieldset>
    </form>
    <div id="topic-list-container"></div>
  `;
}

function buildTopicDOM() {
  document.body.innerHTML = `
    <h1 id="topic-subject"></h1>
    <article id="original-post">
      <p id="op-message"></p>
      <footer id="op-footer"></footer>
      <div id="op-actions"></div>
    </article>
    <section id="replies-section">
      <h2>Replies</h2>
      <div id="reply-list-container"></div>
      <form id="reply-form" action="#">
        <fieldset>
          <legend>Your Reply</legend>
          <label for="new-reply">Reply</label>
          <textarea id="new-reply" required></textarea>
          <button type="submit">Post Reply</button>
        </fieldset>
      </form>
    </section>
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

function buildBoardContext(extraGlobals = {}) {
  const ctx = buildContext(boardCode, buildBoardDOM, extraGlobals);
  vm.runInContext(
    `function __seedTopics(arr) { topics = arr; renderTopics(); }`,
    ctx
  );
  return ctx;
}

function buildTopicContext(extraGlobals = {}) {
  const ctx = buildContext(topicCode, buildTopicDOM, extraGlobals);
  vm.runInContext(
    `function __seedReplies(arr) { currentReplies = arr; renderReplies(); }`,
    ctx
  );
  return ctx;
}

function findCall(fetchMock, method) {
  return fetchMock.mock.calls.find(
    ([, opts]) => opts && opts.method && opts.method.toUpperCase() === method.toUpperCase()
  );
}

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

// ===========================================================================
// board.js
// ===========================================================================

test("[JS-01] createTopicArticle returns an <article> element", () => {
  const ctx   = buildBoardContext();
  const topic = { id: 1, subject: "Welcome!", message: "Hello world.", author: "Course Admin", created_at: "2025-01-13" };
  expect(ctx.createTopicArticle(topic).tagName.toLowerCase()).toBe("article");
});

test("[JS-02] createTopicArticle includes the topic subject", () => {
  const ctx   = buildBoardContext();
  const topic = { id: 1, subject: "Best CSS Framework?", message: "Tailwind or Bootstrap?", author: "Fatema Ahmed", created_at: "2025-01-13" };
  expect(ctx.createTopicArticle(topic).textContent).toContain("Best CSS Framework?");
});

test("[JS-03] createTopicArticle link href is 'topic.html?id=<id>'", () => {
  const ctx   = buildBoardContext();
  const topic = { id: 2, subject: "Assignment 1", message: "Help!", author: "Ali Hassan", created_at: "2025-01-14" };
  const a     = ctx.createTopicArticle(topic).querySelector("a");
  expect(a).not.toBeNull();
  expect(a.getAttribute("href")).toMatch(/topic\.html\?id=2/i);
});

test("[JS-04] createTopicArticle includes the author", () => {
  const ctx   = buildBoardContext();
  const topic = { id: 3, subject: "Q", message: "M", author: "Noora Salman", created_at: "2025-01-15" };
  expect(ctx.createTopicArticle(topic).textContent).toContain("Noora Salman");
});

test("[JS-05] createTopicArticle includes the created_at date", () => {
  const ctx   = buildBoardContext();
  const topic = { id: 4, subject: "Q", message: "M", author: "Ali Hassan", created_at: "2025-02-10" };
  expect(ctx.createTopicArticle(topic).textContent).toContain("2025-02-10");
});

test("[JS-06] createTopicArticle contains a delete-btn with correct data-id", () => {
  const ctx   = buildBoardContext();
  const topic = { id: 5, subject: "Q", message: "M", author: "Student", created_at: "2025-01-01" };
  const del   = ctx.createTopicArticle(topic).querySelector(".delete-btn");
  expect(del).not.toBeNull();
  expect(del.dataset.id).toBe("5");
});

test("[JS-07] renderTopics clears the container before rendering", () => {
  const ctx = buildBoardContext();
  document.getElementById("topic-list-container").innerHTML = "<article>stale</article>";
  vm.runInContext(`topics = []; renderTopics();`, ctx);
  expect(document.getElementById("topic-list-container").innerHTML.trim()).toBe("");
});

test("[JS-08] renderTopics renders one <article> per topic", () => {
  const ctx = buildBoardContext();
  ctx.__seedTopics([
    { id: 1, subject: "S1", message: "M1", author: "A1", created_at: "2025-01-13" },
    { id: 2, subject: "S2", message: "M2", author: "A2", created_at: "2025-01-14" },
    { id: 3, subject: "S3", message: "M3", author: "A3", created_at: "2025-01-15" },
  ]);
  expect(document.querySelectorAll("#topic-list-container article").length).toBe(3);
});

test("[JS-09] handleCreateTopic calls event.preventDefault()", () => {
  const ctx       = buildBoardContext();
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("topic-subject").value = "My Topic";
  document.getElementById("topic-message").value = "My Message";
  ctx.handleCreateTopic(mockEvent);
  expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
});

test("[JS-10] handleCreateTopic sends a POST to ./api/index.php", () => {
  const ctx       = buildBoardContext();
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("topic-subject").value = "My Topic";
  document.getElementById("topic-message").value = "My Message";
  ctx.handleCreateTopic(mockEvent);
  const postCall = findCall(ctx.fetchMock, "POST");
  expect(postCall).toBeDefined();
  expect(postCall[0]).toMatch(/api\/index\.php/i);
});

test("[JS-11] handleCreateTopic POST body includes subject and message", () => {
  const ctx       = buildBoardContext();
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("topic-subject").value = "CSS Help";
  document.getElementById("topic-message").value = "How do I center a div?";
  ctx.handleCreateTopic(mockEvent);
  const postCall = findCall(ctx.fetchMock, "POST");
  expect(postCall).toBeDefined();
  const body = JSON.parse(postCall[1].body);
  expect(body.subject).toBe("CSS Help");
  expect(body.message).toBe("How do I center a div?");
});

test("[JS-12] handleTopicListClick sends DELETE when delete-btn is clicked", () => {
  const ctx = buildBoardContext();
  ctx.__seedTopics([
    { id: 7, subject: "Delete Me", message: "Bye.", author: "Ali", created_at: "2025-01-01" },
  ]);
  const deleteBtn = document.querySelector(".delete-btn");
  expect(deleteBtn).not.toBeNull();
  ctx.handleTopicListClick({ target: deleteBtn });
  const deleteCall = findCall(ctx.fetchMock, "DELETE");
  expect(deleteCall).toBeDefined();
});

test("[JS-13] loadAndInitialize fetches from ./api/index.php", async () => {
  const ctx = buildBoardContext();
  ctx.fetchMock.mockClear();
  ctx.fetchMock.mockResolvedValueOnce({
    ok: true, json: () => Promise.resolve({ success: true, data: [] }),
  });
  await ctx.loadAndInitialize();
  expect(ctx.fetchMock).toHaveBeenCalled();
  expect(ctx.fetchMock.mock.calls[0][0]).toMatch(/api\/index\.php/i);
});

test("[JS-14] loadAndInitialize renders one article per topic from the API", async () => {
  const ctx = buildBoardContext();
  ctx.fetchMock.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: [
        { id: 1, subject: "S1", message: "M1", author: "A1", created_at: "2025-01-13" },
        { id: 2, subject: "S2", message: "M2", author: "A2", created_at: "2025-01-14" },
      ],
    }),
  });
  await ctx.loadAndInitialize();
  expect(document.querySelectorAll("#topic-list-container article").length).toBe(2);
});

test("[JS-15] loadAndInitialize attaches a submit listener to new-topic-form", async () => {
  buildBoardDOM();
  const fetchMock = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) })
  );
  const context = {
    document, window, console,
    fetch: fetchMock, alert: jest.fn(), confirm: jest.fn(() => true), URLSearchParams,
  };
  vm.createContext(context);
  vm.runInContext(boardCode, context);
  const spy = jest.spyOn(document.getElementById("new-topic-form"), "addEventListener");
  await context.loadAndInitialize();
  expect(spy.mock.calls.filter(([e]) => e === "submit").length).toBeGreaterThan(0);
});

// ===========================================================================
// topic.js
// ===========================================================================

test("[JS-16] getTopicIdFromURL returns the id from the URL query string", () => {
  const ctx = buildTopicContext({
    window: { ...window, location: { search: "?id=3" } },
  });
  expect(ctx.getTopicIdFromURL()).toBe("3");
});

test("[JS-17] renderOriginalPost sets the topic subject", () => {
  const ctx   = buildTopicContext();
  const topic = { id: 1, subject: "Welcome!", message: "Hello world.", author: "Course Admin", created_at: "2025-01-13" };
  ctx.renderOriginalPost(topic);
  expect(document.getElementById("topic-subject").textContent).toBe("Welcome!");
});

test("[JS-18] renderOriginalPost sets the topic message", () => {
  const ctx   = buildTopicContext();
  const topic = { id: 1, subject: "S", message: "The original message.", author: "Ali Hassan", created_at: "2025-01-13" };
  ctx.renderOriginalPost(topic);
  expect(document.getElementById("op-message").textContent).toBe("The original message.");
});

test("[JS-19] renderOriginalPost sets op-footer with author and created_at", () => {
  const ctx   = buildTopicContext();
  const topic = { id: 1, subject: "S", message: "M", author: "Fatema Ahmed", created_at: "2025-01-14" };
  ctx.renderOriginalPost(topic);
  const text = document.getElementById("op-footer").textContent;
  expect(text).toContain("Fatema Ahmed");
  expect(text).toContain("2025-01-14");
});

test("[JS-20] createReplyArticle returns an <article> with a <p> and a <footer>", () => {
  const ctx   = buildTopicContext();
  const reply = { id: 1, topic_id: 1, text: "Great question!", author: "Ali Hassan", created_at: "2025-01-15" };
  const article = ctx.createReplyArticle(reply);
  expect(article.tagName.toLowerCase()).toBe("article");
  expect(article.querySelector("p")).not.toBeNull();
  expect(article.querySelector("footer")).not.toBeNull();
});

test("[JS-21] createReplyArticle includes reply text and author", () => {
  const ctx   = buildTopicContext();
  const reply = { id: 1, topic_id: 1, text: "Use Flexbox!", author: "Mohamed Abdulla", created_at: "2025-01-15" };
  const article = ctx.createReplyArticle(reply);
  expect(article.textContent).toContain("Use Flexbox!");
  expect(article.textContent).toContain("Mohamed Abdulla");
});

test("[JS-22] createReplyArticle contains a delete-reply-btn with correct data-id", () => {
  const ctx   = buildTopicContext();
  const reply = { id: 9, topic_id: 1, text: "Reply text.", author: "Noora", created_at: "2025-01-16" };
  const del   = ctx.createReplyArticle(reply).querySelector(".delete-reply-btn");
  expect(del).not.toBeNull();
  expect(del.dataset.id).toBe("9");
});

test("[JS-23] renderReplies clears the container and renders one article per reply", () => {
  const ctx = buildTopicContext();
  document.getElementById("reply-list-container").innerHTML = "<article>stale</article>";
  ctx.__seedReplies([
    { id: 1, topic_id: 1, text: "R1", author: "Ali",   created_at: "2025-01-14" },
    { id: 2, topic_id: 1, text: "R2", author: "Noora", created_at: "2025-01-15" },
  ]);
  expect(document.querySelectorAll("#reply-list-container article").length).toBe(2);
});

test("[JS-24] handleAddReply calls event.preventDefault()", () => {
  const ctx       = buildTopicContext();
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-reply").value = "A reply.";
  ctx.handleAddReply(mockEvent);
  expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
});

test("[JS-25] handleAddReply does nothing when the textarea is empty", () => {
  const ctx       = buildTopicContext();
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-reply").value = "";
  ctx.handleAddReply(mockEvent);
  expect(ctx.fetchMock.mock.calls.length).toBe(0);
});

test("[JS-26] handleAddReply sends a POST to ./api/index.php?action=reply", () => {
  const ctx       = buildTopicContext();
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-reply").value = "A real reply.";
  ctx.handleAddReply(mockEvent);
  const postCall = findCall(ctx.fetchMock, "POST");
  expect(postCall).toBeDefined();
  expect(postCall[0]).toMatch(/action=reply/i);
});

test("[JS-27] handleAddReply clears the textarea after a successful POST", async () => {
  const ctx = buildTopicContext();
  ctx.fetchMock.mockResolvedValueOnce({
    ok:   true,
    json: () => Promise.resolve({
      success: true,
      id:      10,
      data:    { id: 10, topic_id: 1, text: "A real reply.", author: "Student", created_at: "2025-01-16" },
    }),
  });
  const mockEvent = { preventDefault: jest.fn() };
  document.getElementById("new-reply").value = "A real reply.";
  ctx.handleAddReply(mockEvent);
  await flushPromises();
  expect(document.getElementById("new-reply").value).toBe("");
});

test("[JS-28] handleReplyListClick sends DELETE when delete-reply-btn is clicked", () => {
  const ctx = buildTopicContext();
  ctx.__seedReplies([
    { id: 4, topic_id: 1, text: "Delete me.", author: "Ali", created_at: "2025-01-14" },
  ]);
  const deleteBtn = document.querySelector(".delete-reply-btn");
  expect(deleteBtn).not.toBeNull();
  ctx.handleReplyListClick({ target: deleteBtn });
  const deleteCall = findCall(ctx.fetchMock, "DELETE");
  expect(deleteCall).toBeDefined();
});

test("[JS-29] initializePage fetches topic from ./api/index.php?id=<id>", async () => {
  const ctx = buildTopicContext({
    window: { ...window, location: { search: "?id=1" } },
  });
  ctx.fetchMock.mockResolvedValue({
    ok: true, json: () => Promise.resolve({ success: true, data: [] }),
  });
  await ctx.initializePage();
  const urls = ctx.fetchMock.mock.calls.map(([url]) => url);
  expect(urls.some(u => /api\/index\.php.*id=1/i.test(u))).toBe(true);
});

test("[JS-30] initializePage fetches replies with action=replies&topic_id=<id>", async () => {
  const ctx = buildTopicContext({
    window: { ...window, location: { search: "?id=1" } },
  });
  ctx.fetchMock.mockResolvedValue({
    ok: true, json: () => Promise.resolve({ success: true, data: [] }),
  });
  await ctx.initializePage();
  const urls = ctx.fetchMock.mock.calls.map(([url]) => url);
  expect(urls.some(u => /action=replies/i.test(u))).toBe(true);
});
