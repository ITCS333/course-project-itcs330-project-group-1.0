/**
 * @jest-environment jsdom
 *
 * JavaScript Logic Tests for login.js
 * Each test is worth 1 point.
 */

const fs   = require("fs");
const path = require("path");
const vm   = require("vm");

// ---------------------------------------------------------------------------
// Read the student script once
// ---------------------------------------------------------------------------
const scriptPath = path.resolve(__dirname, "../../src/auth/login.js");
const scriptCode = fs.readFileSync(scriptPath, "utf8");

// ---------------------------------------------------------------------------
// Helper: build a fresh DOM + vm context, then run the student script.
// onBeforeRun(form) is called after the DOM is ready but before the
// script executes — this is the only safe place to attach spies.
// ---------------------------------------------------------------------------
function buildContext(onBeforeRun = null) {
  document.body.innerHTML = `
    <form id="login-form">
      <fieldset>
        <input type="email"    id="email"    required />
        <input type="password" id="password" required minlength="8" />
        <button type="submit"  id="login">Log In</button>
      </fieldset>
      <div id="message-container"></div>
    </form>
  `;

  // Give the caller a chance to spy on elements before the script runs
  if (onBeforeRun) {
    onBeforeRun(document.getElementById("login-form"));
  }

  const context = { document, window, console };
  vm.createContext(context);
  vm.runInContext(scriptCode, context);

  return context;
}

// ---------------------------------------------------------------------------
// Each test gets a fresh DOM and a fresh script execution
// ---------------------------------------------------------------------------
beforeEach(() => {
  buildContext();
});

// ---------------------------------------------------------------------------
// displayMessage
// ---------------------------------------------------------------------------

test("[JS-01] displayMessage sets textContent of message-container", () => {
  const ctx = buildContext();
  ctx.displayMessage("Hello World", "success");

  const container = document.getElementById("message-container");
  expect(container.textContent).toBe("Hello World");
});

test("[JS-02] displayMessage sets className of message-container to the type", () => {
  const ctx = buildContext();
  ctx.displayMessage("Something went wrong", "error");

  const container = document.getElementById("message-container");
  expect(container.className).toBe("error");
});

// ---------------------------------------------------------------------------
// isValidEmail
// ---------------------------------------------------------------------------

test("[JS-03] isValidEmail returns true for a valid email", () => {
  const { isValidEmail } = buildContext();
  expect(isValidEmail("student@example.com")).toBe(true);
});

test("[JS-04] isValidEmail returns false when '@' is missing", () => {
  const { isValidEmail } = buildContext();
  expect(isValidEmail("studentexample.com")).toBe(false);
});

test("[JS-05] isValidEmail returns false when TLD is missing", () => {
  const { isValidEmail } = buildContext();
  expect(isValidEmail("student@example")).toBe(false);
});

test("[JS-06] isValidEmail returns false for an empty string", () => {
  const { isValidEmail } = buildContext();
  expect(isValidEmail("")).toBe(false);
});

// ---------------------------------------------------------------------------
// isValidPassword
// ---------------------------------------------------------------------------

test("[JS-07] isValidPassword returns true for a password with 8 characters", () => {
  const { isValidPassword } = buildContext();
  expect(isValidPassword("password")).toBe(true);
});

test("[JS-08] isValidPassword returns true for a password longer than 8 characters", () => {
  const { isValidPassword } = buildContext();
  expect(isValidPassword("supersecurepassword")).toBe(true);
});

test("[JS-09] isValidPassword returns false for a password shorter than 8 characters", () => {
  const { isValidPassword } = buildContext();
  expect(isValidPassword("abc123")).toBe(false);
});

test("[JS-10] isValidPassword returns false for an empty string", () => {
  const { isValidPassword } = buildContext();
  expect(isValidPassword("")).toBe(false);
});

// ---------------------------------------------------------------------------
// handleLogin
// ---------------------------------------------------------------------------

test("[JS-11] handleLogin calls event.preventDefault()", () => {
  const { handleLogin } = buildContext();
  const mockEvent = { preventDefault: jest.fn() };

  document.getElementById("email").value    = "test@example.com";
  document.getElementById("password").value = "password123";

  handleLogin(mockEvent);

  expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
});

test("[JS-12] handleLogin calls displayMessage with 'error' for invalid email", () => {
  const { handleLogin } = buildContext();
  const mockEvent = { preventDefault: jest.fn() };

  document.getElementById("email").value    = "not-an-email";
  document.getElementById("password").value = "password123";

  handleLogin(mockEvent);

  const container = document.getElementById("message-container");
  expect(container.className).toBe("error");
  expect(container.textContent.length).toBeGreaterThan(0);
});

test("[JS-13] handleLogin calls displayMessage with 'error' for short password", () => {
  const { handleLogin } = buildContext();
  const mockEvent = { preventDefault: jest.fn() };

  document.getElementById("email").value    = "test@example.com";
  document.getElementById("password").value = "abc";

  handleLogin(mockEvent);

  const container = document.getElementById("message-container");
  expect(container.className).toBe("error");
  expect(container.textContent.length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// setupLoginForm
// ---------------------------------------------------------------------------

test("[JS-14] setupLoginForm attaches a submit listener to the form", () => {
  let spy;

  // onBeforeRun fires after the DOM is built but before the script runs.
  // The form element we spy on here is the SAME object that
  // setupLoginForm() will receive from document.getElementById("login-form"),
  // so the spy will capture the addEventListener call correctly.
  buildContext((form) => {
    spy = jest.spyOn(form, "addEventListener");
  });

  const submitCalls = spy.mock.calls.filter(([event]) => event === "submit");
  expect(submitCalls.length).toBeGreaterThan(0);
});
