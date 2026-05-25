/**
 * @jest-environment jsdom
 *
 * JavaScript Logic Tests for manage_users.js
 * Each test is worth 1 point.
 */

const fs   = require("fs");
const path = require("path");
const vm   = require("vm");

// ---------------------------------------------------------------------------
// Read the student script once
// ---------------------------------------------------------------------------
const scriptPath = path.resolve(__dirname, "../../src/admin/manage_users.js");
const scriptCode = fs.readFileSync(scriptPath, "utf8");

// ---------------------------------------------------------------------------
// buildDOM — resets the document body to a clean state
// ---------------------------------------------------------------------------
function buildDOM() {
  document.body.innerHTML = `
    <form id="password-form">
      <input type="password" id="current-password"  required />
      <input type="password" id="new-password"       required minlength="8" />
      <input type="password" id="confirm-password"   required />
      <button type="submit"  id="change">Update Password</button>
    </form>

    <details>
      <summary>Add New User</summary>
      <form id="add-user-form">
        <input type="text"     id="user-name"        required />
        <input type="email"    id="user-email"       required />
        <input type="password" id="default-password" required minlength="8" />
        <select id="is-admin">
          <option value="0">Student</option>
          <option value="1">Admin</option>
        </select>
        <button type="submit" id="add">Add User</button>
      </form>
    </details>

    <input id="search-input" type="text" />

    <table id="user-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Admin</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="user-table-body"></tbody>
    </table>
  `;
}

// ---------------------------------------------------------------------------
// buildContext
//
// 1. alert / confirm / fetch must live on the vm context object — not on
//    window — because vm.createContext creates an isolated sandbox.
// 2. A second vm.runInContext call injects __seedUsers so tests can write
//    directly into the script's closed-over `users` variable.
// 3. The fetch mock, alert mock and confirm mock are attached to the
//    returned context so individual tests can assert on them.
// ---------------------------------------------------------------------------
function buildContext(onBeforeRun = null) {
  buildDOM();

  if (onBeforeRun) onBeforeRun();

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
  };

  vm.createContext(context);

  // Run the student script inside the isolated context
  vm.runInContext(scriptCode, context);

  // Inject a helper that writes directly into the script's own closed-over
  // `users` variable (ctx.users = [...] would only set a context property
  // and would not reach the closure variable the functions read).
  vm.runInContext(
    `function __seedUsers(arr) { users = arr; renderTable(arr); }`,
    context
  );

  context.fetchMock   = fetchMock;
  context.alertMock   = alertMock;
  context.confirmMock = confirmMock;

  return context;
}

// ---------------------------------------------------------------------------
// seedUsers — sets the script's internal `users` variable AND renders rows
// ---------------------------------------------------------------------------
function seedUsers(ctx, userArray) {
  ctx.__seedUsers(userArray);
}

// ---------------------------------------------------------------------------
// findCall — find the first fetch call whose options contain a given method
// ---------------------------------------------------------------------------
function findCall(fetchMock, method) {
  return fetchMock.mock.calls.find(
    ([, opts]) =>
      opts && opts.method && opts.method.toUpperCase() === method.toUpperCase()
  );
}

// ---------------------------------------------------------------------------
// makeContext — build a plain vm context without running the full script,
// used by JS-25 and JS-26 so we can reset _listenersAttached and spy first.
// ---------------------------------------------------------------------------
function makeRawContext() {
  buildDOM();

  const fetchMock   = jest.fn(() =>
    Promise.resolve({
      ok:   true,
      json: () => Promise.resolve({ success: true, data: [] }),
    })
  );

  const context = {
    document,
    window,
    console,
    fetch:   fetchMock,
    alert:   jest.fn(),
    confirm: jest.fn(() => true),
  };

  vm.createContext(context);
  vm.runInContext(scriptCode, context);

  return context;
}

// ===========================================================================
// Tests
// ===========================================================================

// ---------------------------------------------------------------------------
// [JS-01] createUserRow returns a <tr> element
// ---------------------------------------------------------------------------
test("[JS-01] createUserRow returns a <tr> element", () => {
  const ctx  = buildContext();
  const user = { id: 1, name: "Ali Hassan", email: "ali@example.com", is_admin: 0 };
  expect(ctx.createUserRow(user).tagName.toLowerCase()).toBe("tr");
});

// ---------------------------------------------------------------------------
// [JS-02] createUserRow includes the user's name in a <td>
// ---------------------------------------------------------------------------
test("[JS-02] createUserRow includes the user's name in a <td>", () => {
  const ctx  = buildContext();
  const user = { id: 1, name: "Ali Hassan", email: "ali@example.com", is_admin: 0 };
  expect(ctx.createUserRow(user).textContent).toContain("Ali Hassan");
});

// ---------------------------------------------------------------------------
// [JS-03] createUserRow includes the user's email in a <td>
// ---------------------------------------------------------------------------
test("[JS-03] createUserRow includes the user's email in a <td>", () => {
  const ctx  = buildContext();
  const user = { id: 1, name: "Ali Hassan", email: "ali@example.com", is_admin: 0 };
  expect(ctx.createUserRow(user).textContent).toContain("ali@example.com");
});

// ---------------------------------------------------------------------------
// [JS-04] createUserRow contains a delete button with correct data-id
// ---------------------------------------------------------------------------
test("[JS-04] createUserRow contains a delete button with class 'delete-btn' and correct data-id", () => {
  const ctx    = buildContext();
  const row    = ctx.createUserRow({ id: 42, name: "Ali", email: "a@b.com", is_admin: 0 });
  const delBtn = row.querySelector(".delete-btn");
  expect(delBtn).not.toBeNull();
  expect(delBtn.dataset.id).toBe("42");
});

// ---------------------------------------------------------------------------
// [JS-05] createUserRow contains an edit button with correct data-id
// ---------------------------------------------------------------------------
test("[JS-05] createUserRow contains an edit button with class 'edit-btn' and correct data-id", () => {
  const ctx     = buildContext();
  const row     = ctx.createUserRow({ id: 7, name: "Ali", email: "a@b.com", is_admin: 0 });
  const editBtn = row.querySelector(".edit-btn");
  expect(editBtn).not.toBeNull();
  expect(editBtn.dataset.id).toBe("7");
});

// ---------------------------------------------------------------------------
// [JS-06] createUserRow shows 'Yes' for is_admin === 1
// ---------------------------------------------------------------------------
test("[JS-06] createUserRow shows 'Yes' for is_admin === 1", () => {
  const ctx = buildContext();
  const row = ctx.createUserRow({ id: 2, name: "Admin", email: "a@b.com", is_admin: 1 });
  expect(row.textContent).toMatch(/yes/i);
});

// ---------------------------------------------------------------------------
// [JS-07] createUserRow shows 'No' for is_admin === 0
// ---------------------------------------------------------------------------
test("[JS-07] createUserRow shows 'No' for is_admin === 0", () => {
  const ctx = buildContext();
  const row = ctx.createUserRow({ id: 3, name: "Student", email: "s@b.com", is_admin: 0 });
  expect(row.textContent).toMatch(/no/i);
});

// ---------------------------------------------------------------------------
// [JS-08] renderTable clears the tbody before rendering
// ---------------------------------------------------------------------------
test("[JS-08] renderTable clears the tbody before rendering", () => {
  const ctx   = buildContext();
  const tbody = document.getElementById("user-table-body");
  tbody.innerHTML = "<tr><td>stale</td></tr>";
  ctx.renderTable([]);
  expect(tbody.innerHTML.trim()).toBe("");
});

// ---------------------------------------------------------------------------
// [JS-09] renderTable renders one <tr> per user
// ---------------------------------------------------------------------------
test("[JS-09] renderTable renders one <tr> per user", () => {
  const ctx = buildContext();
  ctx.renderTable([
    { id: 1, name: "Ali",    email: "ali@example.com",    is_admin: 0 },
    { id: 2, name: "Fatema", email: "fatema@example.com", is_admin: 0 },
    { id: 3, name: "Admin",  email: "admin@example.com",  is_admin: 1 },
  ]);
  expect(document.querySelectorAll("#user-table-body tr").length).toBe(3);
});

// ---------------------------------------------------------------------------
// [JS-10] handleChangePassword calls event.preventDefault()
// ---------------------------------------------------------------------------
test("[JS-10] handleChangePassword calls event.preventDefault()", () => {
  const ctx       = buildContext();
  const mockEvent = { preventDefault: jest.fn() };

  document.getElementById("current-password").value = "oldpassword";
  document.getElementById("new-password").value     = "newpassword1";
  document.getElementById("confirm-password").value = "newpassword1";

  ctx.handleChangePassword(mockEvent);
  expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// [JS-11] handleChangePassword shows alert when new passwords do not match
// ---------------------------------------------------------------------------
test("[JS-11] handleChangePassword shows alert when new passwords do not match", () => {
  const ctx       = buildContext();
  const mockEvent = { preventDefault: jest.fn() };

  document.getElementById("current-password").value = "oldpassword";
  document.getElementById("new-password").value     = "newpassword1";
  document.getElementById("confirm-password").value = "differentpassword";

  ctx.handleChangePassword(mockEvent);

  expect(ctx.alertMock).toHaveBeenCalledWith(
    expect.stringMatching(/do not match/i)
  );
});

// ---------------------------------------------------------------------------
// [JS-12] handleChangePassword shows alert when new password is too short
// ---------------------------------------------------------------------------
test("[JS-12] handleChangePassword shows alert when new password is shorter than 8 characters", () => {
  const ctx       = buildContext();
  const mockEvent = { preventDefault: jest.fn() };

  document.getElementById("current-password").value = "oldpassword";
  document.getElementById("new-password").value     = "abc";
  document.getElementById("confirm-password").value = "abc";

  ctx.handleChangePassword(mockEvent);

  expect(ctx.alertMock).toHaveBeenCalledWith(
    expect.stringMatching(/at least 8 characters/i)
  );
});

// ---------------------------------------------------------------------------
// [JS-13] handleChangePassword clears password fields after successful validation
// ---------------------------------------------------------------------------
test("[JS-13] handleChangePassword clears password fields after successful validation", () => {
  const ctx       = buildContext();
  const mockEvent = { preventDefault: jest.fn() };

  document.getElementById("current-password").value = "oldpassword";
  document.getElementById("new-password").value     = "newpassword1";
  document.getElementById("confirm-password").value = "newpassword1";

  ctx.handleChangePassword(mockEvent);

  expect(document.getElementById("current-password").value).toBe("");
  expect(document.getElementById("new-password").value).toBe("");
  expect(document.getElementById("confirm-password").value).toBe("");
});

// ---------------------------------------------------------------------------
// [JS-14] handleAddUser calls event.preventDefault()
// ---------------------------------------------------------------------------
test("[JS-14] handleAddUser calls event.preventDefault()", () => {
  const ctx       = buildContext();
  const mockEvent = { preventDefault: jest.fn() };

  document.getElementById("user-name").value        = "Ali Hassan";
  document.getElementById("user-email").value       = "ali@example.com";
  document.getElementById("default-password").value = "password123";

  ctx.handleAddUser(mockEvent);
  expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// [JS-15] handleAddUser shows alert when required fields are empty
// ---------------------------------------------------------------------------
test("[JS-15] handleAddUser shows alert when required fields are empty", () => {
  const ctx       = buildContext();
  const mockEvent = { preventDefault: jest.fn() };

  document.getElementById("user-name").value        = "";
  document.getElementById("user-email").value       = "";
  document.getElementById("default-password").value = "";

  ctx.handleAddUser(mockEvent);

  expect(ctx.alertMock).toHaveBeenCalledWith(
    expect.stringMatching(/required fields/i)
  );
});

// ---------------------------------------------------------------------------
// [JS-16] handleAddUser sends a POST fetch request when inputs are valid
// ---------------------------------------------------------------------------
test("[JS-16] handleAddUser sends a POST fetch request when inputs are valid", () => {
  const ctx       = buildContext();
  const mockEvent = { preventDefault: jest.fn() };

  document.getElementById("user-name").value        = "Ali Hassan";
  document.getElementById("user-email").value       = "ali@example.com";
  document.getElementById("default-password").value = "password123";

  ctx.handleAddUser(mockEvent);

  const postCall = findCall(ctx.fetchMock, "POST");
  expect(postCall).toBeDefined();
});

// ---------------------------------------------------------------------------
// [JS-17] handleTableClick sends a DELETE fetch request when delete-btn clicked
// ---------------------------------------------------------------------------
test("[JS-17] handleTableClick sends a DELETE fetch request when delete-btn is clicked", () => {
  const ctx = buildContext();

  seedUsers(ctx, [
    { id: 5, name: "Ali", email: "ali@example.com", is_admin: 0 },
  ]);

  const deleteBtn = document.querySelector(".delete-btn");
  expect(deleteBtn).not.toBeNull();

  ctx.handleTableClick({ target: deleteBtn });

  const deleteCall = findCall(ctx.fetchMock, "DELETE");
  expect(deleteCall).toBeDefined();
});

// ---------------------------------------------------------------------------
// [JS-18] handleSearch filters table rows by name
// ---------------------------------------------------------------------------
test("[JS-18] handleSearch filters table rows by name", () => {
  const ctx = buildContext();

  seedUsers(ctx, [
    { id: 1, name: "Ali Hassan",   email: "ali@example.com",    is_admin: 0 },
    { id: 2, name: "Fatema Ahmed", email: "fatema@example.com", is_admin: 0 },
  ]);

  document.getElementById("search-input").value = "ali";
  ctx.handleSearch({ target: document.getElementById("search-input") });

  const rows = document.querySelectorAll("#user-table-body tr");
  expect(rows.length).toBe(1);
  expect(rows[0].textContent).toContain("Ali Hassan");
});

// ---------------------------------------------------------------------------
// [JS-19] handleSearch shows all rows when the search term is cleared
// ---------------------------------------------------------------------------
test("[JS-19] handleSearch shows all rows when the search term is cleared", () => {
  const ctx = buildContext();

  seedUsers(ctx, [
    { id: 1, name: "Ali Hassan",   email: "ali@example.com",    is_admin: 0 },
    { id: 2, name: "Fatema Ahmed", email: "fatema@example.com", is_admin: 0 },
  ]);

  document.getElementById("search-input").value = "";
  ctx.handleSearch({ target: document.getElementById("search-input") });

  expect(document.querySelectorAll("#user-table-body tr").length).toBe(2);
});

// ---------------------------------------------------------------------------
// [JS-20] handleSearch filters table rows by email
// ---------------------------------------------------------------------------
test("[JS-20] handleSearch filters table rows by email", () => {
  const ctx = buildContext();

  seedUsers(ctx, [
    { id: 1, name: "Ali Hassan",   email: "ali@example.com",    is_admin: 0 },
    { id: 2, name: "Fatema Ahmed", email: "fatema@example.com", is_admin: 0 },
  ]);

  document.getElementById("search-input").value = "fatema";
  ctx.handleSearch({ target: document.getElementById("search-input") });

  const rows = document.querySelectorAll("#user-table-body tr");
  expect(rows.length).toBe(1);
  expect(rows[0].textContent).toContain("Fatema Ahmed");
});

// ---------------------------------------------------------------------------
// [JS-21] handleSort sorts users by name ascending on first click
// ---------------------------------------------------------------------------
test("[JS-21] handleSort sorts users by name ascending on first click", () => {
  const ctx = buildContext();

  seedUsers(ctx, [
    { id: 2, name: "Zainab",  email: "z@example.com", is_admin: 0 },
    { id: 1, name: "Ali",     email: "a@example.com", is_admin: 0 },
    { id: 3, name: "Mohamed", email: "m@example.com", is_admin: 0 },
  ]);

  const nameHeader = document.querySelector("#user-table thead th:first-child");

  // Clear any leftover sort direction so the first click is a clean start
  delete nameHeader.dataset.sortDir;

  ctx.handleSort({ currentTarget: nameHeader });

  const rows = document.querySelectorAll("#user-table-body tr");
  expect(rows.length).toBeGreaterThan(0);
  expect(rows[0].textContent).toContain("Ali");
});

// ---------------------------------------------------------------------------
// [JS-22] handleSort toggles to descending on second click
// ---------------------------------------------------------------------------
test("[JS-22] handleSort toggles to descending on second click", () => {
  const ctx = buildContext();

  seedUsers(ctx, [
    { id: 2, name: "Zainab",  email: "z@example.com", is_admin: 0 },
    { id: 1, name: "Ali",     email: "a@example.com", is_admin: 0 },
    { id: 3, name: "Mohamed", email: "m@example.com", is_admin: 0 },
  ]);

  const nameHeader = document.querySelector("#user-table thead th:first-child");
  delete nameHeader.dataset.sortDir;

  ctx.handleSort({ currentTarget: nameHeader }); // first click  → asc
  ctx.handleSort({ currentTarget: nameHeader }); // second click → desc

  const rows = document.querySelectorAll("#user-table-body tr");
  expect(rows.length).toBeGreaterThan(0);
  expect(rows[0].textContent).toContain("Zainab");
});

// ---------------------------------------------------------------------------
// [JS-23] loadUsersAndInitialize calls fetch to retrieve users from the API
// ---------------------------------------------------------------------------
test("[JS-23] loadUsersAndInitialize calls fetch to retrieve users from the API", async () => {
  const ctx = buildContext();

  ctx.fetchMock.mockClear();
  ctx.fetchMock.mockResolvedValueOnce({
    ok:   true,
    json: () => Promise.resolve({ success: true, data: [] }),
  });

  await ctx.loadUsersAndInitialize();

  expect(ctx.fetchMock).toHaveBeenCalled();
  const [url] = ctx.fetchMock.mock.calls[0];
  expect(url).toMatch(/index\.php|api/i);
});

// ---------------------------------------------------------------------------
// [JS-24] loadUsersAndInitialize populates the users array from API response
// ---------------------------------------------------------------------------
test("[JS-24] loadUsersAndInitialize populates the users array from the API response", async () => {
  const seedData = [
    { id: 1, name: "Ali Hassan",   email: "ali@example.com",    is_admin: 0 },
    { id: 2, name: "Fatema Ahmed", email: "fatema@example.com", is_admin: 0 },
  ];

  const ctx = buildContext();

  ctx.fetchMock.mockResolvedValueOnce({
    ok:   true,
    json: () => Promise.resolve({ success: true, data: seedData }),
  });

  await ctx.loadUsersAndInitialize();

  // Verify via rendered rows — avoids the ctx.users closure binding problem
  expect(document.querySelectorAll("#user-table-body tr").length).toBe(2);
});

// ---------------------------------------------------------------------------
// [JS-25] loadUsersAndInitialize attaches submit listener to password-form
// ---------------------------------------------------------------------------
test("[JS-25] loadUsersAndInitialize attaches submit listener to password-form", async () => {
  // Build a fresh context (auto-boot call runs and sets _listenersAttached)
  const ctx = makeRawContext();

  // Reset the guard so the next manual call re-attaches all listeners
  vm.runInContext(
    `loadUsersAndInitialize._listenersAttached = false;`,
    ctx
  );

  // Install the spy BEFORE calling loadUsersAndInitialize again
  const spy = jest.spyOn(
    document.getElementById("password-form"),
    "addEventListener"
  );

  await ctx.loadUsersAndInitialize();

  const submitCalls = spy.mock.calls.filter(([event]) => event === "submit");
  expect(submitCalls.length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// [JS-26] loadUsersAndInitialize attaches submit listener to add-user-form
// ---------------------------------------------------------------------------
test("[JS-26] loadUsersAndInitialize attaches submit listener to add-user-form", async () => {
  const ctx = makeRawContext();

  vm.runInContext(
    `loadUsersAndInitialize._listenersAttached = false;`,
    ctx
  );

  const spy = jest.spyOn(
    document.getElementById("add-user-form"),
    "addEventListener"
  );

  await ctx.loadUsersAndInitialize();

  const submitCalls = spy.mock.calls.filter(([event]) => event === "submit");
  expect(submitCalls.length).toBeGreaterThan(0);
});
