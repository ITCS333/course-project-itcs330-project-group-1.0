/*
  Requirement: Make the "Discussion Board" page interactive.

  Instructions:
  1. This file is already linked to `board.html` via:
         <script src="board.js" defer></script>

  2. In `board.html`:
     - The new-topic form has id="new-topic-form".
     - The topic list container has id="topic-list-container".

  3. Implement the TODOs below.

  API base URL: ./api/index.php
  All requests and responses use JSON.
  Successful list response shape: { success: true, data: [ ...topic objects ] }
  Each topic object shape (from the topics table):
    {
      id:         number,   // integer primary key from the topics table
      subject:    string,
      message:    string,
      author:     string,
      created_at: string    // "YYYY-MM-DD HH:MM:SS" — matches the SQL column name
    }
*/

// --- Global Data Store ---
// Holds the topics currently displayed in the list.
let topics = [];

// --- Element Selections ---
// TODO: Select the new-topic form by id 'new-topic-form'.

// TODO: Select the topic list container by id 'topic-list-container'.

// --- Functions ---

/**
 * TODO: Implement createTopicArticle.
 *
 * Parameters:
 *   topic — one topic object with shape:
 *     { id, subject, message, author, created_at }
 *
 * Returns an <article> element matching the structure shown in board.html:
 *   <article>
 *     <h3><a href="topic.html?id={id}">{subject}</a></h3>
 *     <footer>Posted by: {author} on {created_at}</footer>
 *     <div>
 *       <button class="edit-btn"   data-id="{id}">Edit</button>
 *       <button class="delete-btn" data-id="{id}">Delete</button>
 *     </div>
 *   </article>
 *
 * Important:
 * - The link href MUST be "topic.html?id=<id>" so topic.js can read
 *   the id from the URL.
 * - The data-id on both buttons holds the integer primary key from
 *   the topics table.
 * - Use created_at (not a field called "date") — this matches the SQL
 *   column name.
 */
function createTopicArticle(topic) {
  // ... your implementation here ...
}

/**
 * TODO: Implement renderTopics.
 *
 * It should:
 * 1. Clear the topicListContainer (set innerHTML to "").
 * 2. Loop through the global `topics` array.
 * 3. For each topic, call createTopicArticle(topic) and append the
 *    returned <article> to topicListContainer.
 */
function renderTopics() {
  // ... your implementation here ...
}

/**
 * TODO: Implement handleCreateTopic (async).
 *
 * This is the event handler for the form's 'submit' event.
 * It should:
 * 1. Call event.preventDefault().
 * 2. Read values from:
 *      - #topic-subject → subject (string)
 *      - #topic-message → message (string)
 * 3. Send a POST to './api/index.php' with the body:
 *      { subject, message, author: "Student" }
 *    (author is hardcoded "Student" for this exercise)
 *    The API inserts a row into the topics table.
 * 4. On success (result.success === true):
 *    - Push the new topic object (with the id from result.id) onto
 *      the global `topics` array.
 *    - Call renderTopics() to refresh the list.
 *    - Reset the form.
 */
async function handleCreateTopic(event) {
  // ... your implementation here ...
}

/**
 * TODO: Implement handleUpdateTopic (async).
 *
 * Parameters:
 *   id     — the integer primary key of the topic being edited.
 *   fields — object with { subject, message }.
 *
 * It should:
 * 1. Send a PUT to './api/index.php' with the body:
 *      { id, subject, message }
 * 2. On success:
 *    - Update the matching entry in the global `topics` array.
 *    - Call renderTopics() to refresh the list.
 */
async function handleUpdateTopic(id, fields) {
  // ... your implementation here ...
}

/**
 * TODO: Implement handleTopicListClick (async).
 *
 * This is a delegated click listener on topicListContainer.
 * It should:
 * 1. If event.target has class "delete-btn":
 *    a. Read the integer id from event.target.dataset.id.
 *    b. Send a DELETE to './api/index.php?id=<id>'.
 *    c. On success, remove the topic from the global `topics` array
 *       and call renderTopics().
 *
 * 2. If event.target has class "edit-btn":
 *    a. Read the integer id from event.target.dataset.id.
 *    b. Find the matching topic in the global `topics` array.
 *    c. Populate #topic-subject and #topic-message with the topic's data.
 *    d. Change the submit button (#create-topic) text to "Update Topic"
 *       and set its data-edit-id attribute to the topic's id.
 */
async function handleTopicListClick(event) {
  // ... your implementation here ...
}

/**
 * TODO: Implement loadAndInitialize (async).
 *
 * It should:
 * 1. Send a GET to './api/index.php'.
 *    Response shape: { success: true, data: [ ...topic objects ] }
 * 2. Store the data array in the global `topics` variable.
 * 3. Call renderTopics() to populate the list.
 * 4. Attach the 'submit' event listener to the new-topic form
 *    (calls handleCreateTopic).
 * 5. Attach a 'click' event listener to topicListContainer
 *    (calls handleTopicListClick — event delegation for edit and delete).
 */
async function loadAndInitialize() {
  // ... your implementation here ...
}

// --- Initial Page Load ---
loadAndInitialize();
