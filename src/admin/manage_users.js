/*
  Requirement: Add interactivity and data management to the Admin Portal.

  Instructions:
  1. This file is loaded by the <script src="manage_users.js" defer> tag in manage_users.html.
     The 'defer' attribute guarantees the DOM is fully parsed before this script runs.
  2. Implement the JavaScript functionality as described in the TODO comments.
  3. All data is fetched from and written to the PHP API at '../api/index.php'.
     The local 'users' array is used only as a client-side cache for search and sort.
*/

// --- Global Data Store ---
// This array will be populated with data fetched from the PHP API.
// It acts as a client-side cache so search and sort work without extra network calls.
let users = [];

// --- Element Selections ---
// We can safely select elements here because 'defer' guarantees
// the HTML document is parsed before this script runs.

// TODO: Select the user table body element with id="user-table-body".
const userTableBody = document.getElementById('user-table-body');

// TODO: Select the "Add User" form with id="add-user-form".
const addUserForm = document.getElementById('add-user-form');

// TODO: Select the "Change Password" form with id="password-form".
const changePasswordForm = document.getElementById('password-form');

// TODO: Select the search input field with id="search-input".
const searchInput = document.getElementById('search-input');

// TODO: Select all table header (th) elements inside the thead of id="user-table".
const tableHeaders = document.querySelectorAll('#user-table thead th');

// --- Functions ---

/**
 * TODO: Implement the createUserRow function.
 * This function takes a user object { id, name, email, is_admin } and returns a <tr> element.
 * The <tr> should contain:
 * 1. A <td> for the user's name.
 * 2. A <td> for the user's email.
 * 3. A <td> showing admin status, e.g. "Yes" if is_admin === 1, otherwise "No".
 * 4. A <td> containing two buttons:
 *    - An "Edit" button with class "edit-btn" and a data-id attribute set to the user's id.
 *    - A "Delete" button with class "delete-btn" and a data-id attribute set to the user's id.
 */
function createUserRow(user) {
  const tr = document.createElement('tr');

  const nameTd = document.createElement('td');
  nameTd.textContent = user.name;

  const emailTd = document.createElement('td');
  emailTd.textContent = user.email;

  const adminTd = document.createElement('td');
  adminTd.textContent = user.is_admin == 1 ? 'Yes' : 'No';

  const actionsTd = document.createElement('td');

  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.dataset.id = user.id;
  editBtn.textContent = 'Edit';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.dataset.id = user.id;
  deleteBtn.textContent = 'Delete';

  actionsTd.appendChild(editBtn);
  actionsTd.appendChild(deleteBtn);

  tr.appendChild(nameTd);
  tr.appendChild(emailTd);
  tr.appendChild(adminTd);
  tr.appendChild(actionsTd);

  return tr;
}

/**
 * TODO: Implement the renderTable function.
 * This function takes an array of user objects.
 * It should:
 * 1. Clear the current content of the userTableBody.
 * 2. Loop through the provided array of users.
 * 3. For each user, call createUserRow and append the returned <tr> to userTableBody.
 */
function renderTable(userArray) {
  userTableBody.innerHTML = '';
  userArray.forEach(user => {
    userTableBody.appendChild(createUserRow(user));
  });
}

/**
 * TODO: Implement the handleChangePassword function.
 * This function is called when the "Update Password" form is submitted.
 * It should:
 * 1. Prevent the form's default submission behaviour.
 * 2. Get the values from "current-password", "new-password", and "confirm-password" inputs.
 * 3. Perform client-side validation:
 *    - If "new-password" and "confirm-password" do not match, show an alert: "Passwords do not match."
 *    - If "new-password" is less than 8 characters, show an alert: "Password must be at least 8 characters."
 * 4. If validation passes, send a POST request to '../api/index.php?action=change_password'
 *    with a JSON body: { id, current_password, new_password }
 *    where 'id' is the currently logged-in admin's user id.
 * 5. On success, show an alert: "Password updated successfully!" and clear all three inputs.
 * 6. On failure, show the error message returned by the API.
 */
async function handleChangePassword(event) {
  event.preventDefault();

  const currentPassword = document.getElementById('current-password').value;
  const newPassword     = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (newPassword !== confirmPassword) {
    alert('Passwords do not match.');
    return;
  }

  if (newPassword.length < 8) {
    alert('Password must be at least 8 characters.');
    return;
  }

  const response = await fetch('../api/index.php?action=change_password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 1, current_password: currentPassword, new_password: newPassword }),
  });
  const result = await response.json();

  if (result.success) {
    alert('Password updated successfully!');
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value     = '';
    document.getElementById('confirm-password').value = '';
  } else {
    alert(result.message);
  }
}

/**
 * TODO: Implement the handleAddUser function.
 * This function is called when the "Add User" form is submitted.
 * It should:
 * 1. Prevent the form's default submission behaviour.
 * 2. Get the values from "user-name", "user-email", "default-password", and "is-admin".
 * 3. Perform client-side validation:
 *    - If name, email, or password are empty, show an alert: "Please fill out all required fields."
 *    - If password is less than 8 characters, show an alert: "Password must be at least 8 characters."
 * 4. If validation passes, send a POST request to '../api/index.php'
 *    with a JSON body: { name, email, password, is_admin }
 * 5. On success (HTTP 201), re-fetch the full user list by calling loadUsersAndInitialize()
 *    so the table reflects the new record from the database.
 * 6. Clear the form inputs on success.
 * 7. On failure, show the error message returned by the API.
 */
async function handleAddUser(event) {
  event.preventDefault();

  const name     = document.getElementById('user-name').value.trim();
  const email    = document.getElementById('user-email').value.trim();
  const password = document.getElementById('default-password').value;
  const isAdmin  = document.getElementById('is-admin').value;

  if (!name || !email || !password) {
    alert('Please fill out all required fields.');
    return;
  }

  if (password.length < 8) {
    alert('Password must be at least 8 characters.');
    return;
  }

  const response = await fetch('../api/index.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, is_admin: parseInt(isAdmin) }),
  });
  const result = await response.json();

  if (result.success) {
    await loadUsersAndInitialize();
    addUserForm.reset();
  } else {
    alert(result.message);
  }
}

/**
 * TODO: Implement the handleTableClick function.
 * This function is an event listener on userTableBody (event delegation).
 * It should:
 * 1. Check if the clicked element has the class "delete-btn".
 * 2. If it is a "delete-btn":
 *    - Get the data-id attribute from the button (this is the user's database id).
 *    - Send a DELETE request to '../api/index.php?id=' + id.
 *    - On success, remove the user from the local 'users' array and call renderTable(users).
 *    - On failure, show the error message returned by the API.
 * 3. If it is an "edit-btn":
 *    - Get the data-id attribute from the button.
 *    - (Optional) Populate an edit form or prompt with the user's current data
 *      and send a PUT request to '../api/index.php' with the updated fields.
 */
async function handleTableClick(event) {
  if (event.target.classList.contains('delete-btn')) {
    const id = event.target.dataset.id;

    const response = await fetch('../api/index.php?id=' + id, { method: 'DELETE' });
    const result   = await response.json();

    if (result.success) {
      users = users.filter(u => u.id != id);
      renderTable(users);
    } else {
      alert(result.message);
    }
  }

  if (event.target.classList.contains('edit-btn')) {
    const id   = event.target.dataset.id;
    const user = users.find(u => u.id == id);
    if (!user) return;

    const newName    = prompt('Edit name:', user.name);
    const newEmail   = prompt('Edit email:', user.email);
    const newIsAdmin = prompt('Is admin? (0 = No, 1 = Yes):', user.is_admin);

    if (newName === null || newEmail === null || newIsAdmin === null) return;

    const response = await fetch('../api/index.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: parseInt(id), name: newName, email: newEmail, is_admin: parseInt(newIsAdmin) }),
    });
    const result = await response.json();

    if (result.success) {
      const index = users.findIndex(u => u.id == id);
      if (index !== -1) {
        users[index] = { ...users[index], name: newName, email: newEmail, is_admin: parseInt(newIsAdmin) };
      }
      renderTable(users);
    } else {
      alert(result.message);
    }
  }
}

/**
 * TODO: Implement the handleSearch function.
 * This function is called on the "input" event of the searchInput.
 * It should:
 * 1. Get the search term from searchInput.value and convert it to lowercase.
 * 2. If the search term is empty, call renderTable(users) to show all users.
 * 3. Otherwise, filter the local 'users' array to find users whose name or email
 *    (converted to lowercase) includes the search term.
 * 4. Call renderTable with the filtered array.
 *    (This filters the client-side cache only; no extra API call is needed.)
 */
function handleSearch(event) {
  const term = searchInput.value.toLowerCase();

  if (!term) {
    renderTable(users);
    return;
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
  );

  renderTable(filtered);
}

/**
 * TODO: Implement the handleSort function.
 * This function is called when any <th> in the thead is clicked.
 * It should:
 * 1. Identify which column was clicked using event.currentTarget.cellIndex.
 * 2. Map the cell index to a property name:
 *    - index 0 -> 'name'
 *    - index 1 -> 'email'
 *    - index 2 -> 'is_admin'
 * 3. Toggle sort direction using a data-sort-dir attribute on the <th>
 *    between "asc" and "desc".
 * 4. Sort the local 'users' array in place using array.sort():
 *    - For 'name' and 'email', use localeCompare for string comparison.
 *    - For 'is_admin', compare the values as numbers.
 * 5. Respect the sort direction (ascending or descending).
 * 6. Call renderTable(users) to update the view.
 */
function handleSort(event) {
  const colMap = { 0: 'name', 1: 'email', 2: 'is_admin' };
  const index  = event.currentTarget.cellIndex;
  const prop   = colMap[index];

  if (!prop) return;

  const currentDir = event.currentTarget.dataset.sortDir || 'asc';
  const newDir     = currentDir === 'asc' ? 'desc' : 'asc';
  event.currentTarget.dataset.sortDir = newDir;

  users.sort((a, b) => {
    let valA = a[prop];
    let valB = b[prop];

    if (prop === 'is_admin') {
      valA = Number(valA);
      valB = Number(valB);
      return newDir === 'asc' ? valA - valB : valB - valA;
    }

    return newDir === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  renderTable(users);
}

/**
 * TODO: Implement the loadUsersAndInitialize function.
 * This function must be async.
 * It should:
 * 1. Send a GET request to '../api/index.php' using fetch().
 * 2. Check if the response is ok. If not, log the error and show an alert.
 * 3. Parse the JSON response: await response.json().
 *    The API returns { success: true, data: [ ...users ] }.
 * 4. Assign the data array to the global 'users' variable.
 * 5. Call renderTable(users) to populate the table.
 * 6. Attach all event listeners (only on the first call, or use { once: true } where appropriate):
 *    - "submit" on changePasswordForm  -> handleChangePassword
 *    - "submit" on addUserForm         -> handleAddUser
 *    - "click"  on userTableBody       -> handleTableClick
 *    - "input"  on searchInput         -> handleSearch
 *    - "click"  on each th in tableHeaders -> handleSort
 */
let listenersAttached = false;

async function loadUsersAndInitialize() {
  const response = await fetch('../api/index.php');

  if (!response.ok) {
    console.error('Failed to load users:', response.status);
    alert('Failed to load users.');
    return;
  }

  const result = await response.json();
  users = result.data;
  renderTable(users);

  if (!listenersAttached) {
    changePasswordForm.addEventListener('submit', handleChangePassword);
    addUserForm.addEventListener('submit', handleAddUser);
    userTableBody.addEventListener('click', handleTableClick);
    searchInput.addEventListener('input', handleSearch);
    tableHeaders.forEach(th => th.addEventListener('click', handleSort));
    listenersAttached = true;
  }
}

// --- Initial Page Load ---
loadUsersAndInitialize();