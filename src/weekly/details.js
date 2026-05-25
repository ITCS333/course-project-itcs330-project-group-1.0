/*
  Requirement: Populate the weekly detail page and handle the discussion forum.

  Instructions:
  1. This file is already linked to `details.html` via:
         <script src="details.js" defer></script>

  2. The following ids must exist in details.html (already listed in the
     HTML comments):
       #week-title          — <h1>
       #week-start-date     — <p>
       #week-description    — <p>
       #week-links-list     — <ul>
       #comment-list        — <div>
       #comment-form        — <form>
       #new-comment         — <textarea>

  3. Implement the TODOs below.

  API base URL: ./api/index.php
  Week object shape returned by the API:
    {
      id:          number,   // integer primary key from the weeks table
      title:       string,
      start_date:  string,   // "YYYY-MM-DD"
      description: string,
      links:       string[]  // decoded array of URL strings
    }

  Comment object shape returned by the API
  (from the comments_week table):
    {
      id:          number,
      week_id:     number,
      author:      string,
      text:        string,
      created_at:  string
    }
*/

// --- Global Data Store ---
let currentWeekId  = null;  // integer id from the weeks table
let currentComments = [];

// --- Element Selections ---
// TODO: Select each element by its id:
//   weekTitle, weekStartDate, weekDescription,
//   weekLinksList, commentList, commentForm, newCommentInput.

// --- Functions ---

/**
 * TODO: Implement getWeekIdFromURL.
 *
 * It should:
 * 1. Read window.location.search.
 * 2. Construct a URLSearchParams object from it.
 * 3. Return the value of the 'id' parameter (a string that represents
 *    the integer primary key of the week).
 */
function getWeekIdFromURL() {
  // ... your implementation here ...
}

/**
 * TODO: Implement renderWeekDetails.
 *
 * Parameters:
 *   week — the week object returned by the API (see shape above).
 *
 * It should:
 * 1. Set weekTitle.textContent    = week.title.
 * 2. Set weekStartDate.textContent = "Starts on: " + week.start_date.
 *    (Note: use week.start_date, which matches the SQL column name.)
 * 3. Set weekDescription.textContent = week.description.
 * 4. Clear weekLinksList, then for each URL in week.links:
 *    - Create a <li> containing an <a href="{url}">{url}</a>.
 *    - Append the <li> to weekLinksList.
 *    (week.links is already a decoded string array from the API.)
 */
function renderWeekDetails(week) {
  // ... your implementation here ...
}

/**
 * TODO: Implement createCommentArticle.
 *
 * Parameters:
 *   comment — one comment object from the API:
 *     { id, week_id, author, text, created_at }
 *
 * Returns an <article> element:
 *   <article>
 *     <p>{comment.text}</p>
 *     <footer>Posted by: {comment.author}</footer>
 *   </article>
 */
function createCommentArticle(comment) {
  // ... your implementation here ...
}

/**
 * TODO: Implement renderComments.
 *
 * It should:
 * 1. Clear commentList (set innerHTML to "").
 * 2. Loop through currentComments.
 * 3. For each comment, call createCommentArticle(comment) and
 *    append the result to commentList.
 */
function renderComments() {
  // ... your implementation here ...
}

/**
 * TODO: Implement handleAddComment (async).
 *
 * This is the event handler for commentForm's 'submit' event.
 * It should:
 * 1. Call event.preventDefault().
 * 2. Read and trim the value from newCommentInput (#new-comment).
 * 3. If the value is empty, return early (do nothing).
 * 4. Send a POST to './api/index.php?action=comment' with the body:
 *      {
 *        week_id: currentWeekId,   // integer
 *        author:  "Student",       // hardcoded for this exercise
 *        text:    commentText
 *      }
 *    The API inserts a row into the comments_week table.
 * 5. On success (result.success === true):
 *    - Push the new comment object (from result.data) onto
 *      currentComments.
 *    - Call renderComments() to refresh the list.
 *    - Clear newCommentInput.
 */
async function handleAddComment(event) {
  // ... your implementation here ...
}

/**
 * TODO: Implement initializePage (async).
 *
 * It should:
 * 1. Call getWeekIdFromURL() and store the result in currentWeekId.
 * 2. If currentWeekId is null or empty, set
 *    weekTitle.textContent = "Week not found." and return.
 * 3. Fetch both the week details and its comments in parallel using
 *    Promise.all:
 *      - Week:     GET ./api/index.php?id={currentWeekId}
 *                  Response: { success: true, data: { ...week object } }
 *      - Comments: GET ./api/index.php?action=comments&week_id={currentWeekId}
 *                  Response: { success: true, data: [ ...comment objects ] }
 *    Comments are stored in the comments_week table
 *    (columns: id, week_id, author, text, created_at).
 * 4. Store the comments array in currentComments
 *    (use an empty array if none exist).
 * 5. If the week was found:
 *    - Call renderWeekDetails(week).
 *    - Call renderComments().
 *    - Attach the 'submit' listener to commentForm (calls handleAddComment).
 * 6. If the week was not found:
 *    - Set weekTitle.textContent = "Week not found."
 */
async function initializePage() {
  // ... your implementation here ...
}

// --- Initial Page Load ---
initializePage();
