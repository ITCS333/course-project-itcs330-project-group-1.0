<?php
/**
 * Weekly Course Breakdown API
 *
 * RESTful API for CRUD operations on weekly course content and discussion
 * comments. Uses PDO to interact with the MySQL database defined in
 * schema.sql.
 *
 * Database Tables (ground truth: schema.sql):
 *
 * Table: weeks
 *   id          INT UNSIGNED  PRIMARY KEY AUTO_INCREMENT
 *   title       VARCHAR(200)  NOT NULL
 *   start_date  DATE          NOT NULL
 *   description TEXT
 *   links       TEXT          — JSON-encoded array of URL strings
 *   created_at  TIMESTAMP
 *   updated_at  TIMESTAMP
 *
 * Table: comments_week
 *   id          INT UNSIGNED  PRIMARY KEY AUTO_INCREMENT
 *   week_id     INT UNSIGNED  NOT NULL   — FK → weeks.id (ON DELETE CASCADE)
 *   author      VARCHAR(100)  NOT NULL
 *   text        TEXT          NOT NULL
 *   created_at  TIMESTAMP
 *
 * HTTP Methods Supported:
 *   GET    — Retrieve week(s) or comments
 *   POST   — Create a new week or comment
 *   PUT    — Update an existing week
 *   DELETE — Delete a week (cascade removes its comments) or a single comment
 *
 * URL scheme (all requests go to index.php):
 *
 *   Weeks:
 *     GET    ./api/index.php                  — list all weeks
 *     GET    ./api/index.php?id={id}           — get one week by integer id
 *     POST   ./api/index.php                  — create a new week
 *     PUT    ./api/index.php                  — update a week (id in JSON body)
 *     DELETE ./api/index.php?id={id}           — delete a week
 *
 *   Comments (action parameter selects the comments sub-resource):
 *     GET    ./api/index.php?action=comments&week_id={id}
 *                                             — list comments for a week
 *     POST   ./api/index.php?action=comment   — create a comment
 *     DELETE ./api/index.php?action=delete_comment&comment_id={id}
 *                                             — delete a single comment
 *
 * Query parameters for GET all weeks:
 *   search — filter rows where title LIKE or description LIKE the term
 *   sort   — column to sort by; allowed: title, start_date (default: start_date)
 *   order  — sort direction; allowed: asc, desc (default: asc)
 *
 * Response format: JSON
 *   Success: { "success": true,  "data": ... }
 *   Error:   { "success": false, "message": "..." }
 */

// ============================================================================
// HEADERS AND INITIALIZATION
// ============================================================================

// TODO: Set headers for JSON response and CORS.
// Set Content-Type to application/json.
// Allow cross-origin requests (CORS) if needed.
// Allow HTTP methods: GET, POST, PUT, DELETE, OPTIONS.
// Allow headers: Content-Type, Authorization.


// TODO: Handle preflight OPTIONS request.
// If the request method is OPTIONS, return HTTP 200 and exit.


// TODO: Include the shared database connection file.
// require_once __DIR__ . '/../../common/db.php';


// TODO: Get the PDO database connection.
// $db = getDBConnection();


// TODO: Read the HTTP request method.
// $method = $_SERVER['REQUEST_METHOD'];


// TODO: Read and decode the request body for POST and PUT requests.
// $rawData = file_get_contents('php://input');
// $data    = json_decode($rawData, true) ?? [];


// TODO: Read query parameters.
// $action    = $_GET['action']     ?? null;  // 'comments', 'comment', 'delete_comment'
// $id        = $_GET['id']         ?? null;  // integer week id
// $weekId    = $_GET['week_id']    ?? null;  // integer week id for comments queries
// $commentId = $_GET['comment_id'] ?? null;  // integer comment id


// ============================================================================
// WEEKS FUNCTIONS
// ============================================================================

/**
 * Get all weeks (with optional search and sort).
 * Method: GET (no ?id or ?action parameter).
 *
 * Query parameters handled inside:
 *   search — filter by title LIKE or description LIKE
 *   sort   — allowed: title, start_date   (default: start_date)
 *   order  — allowed: asc, desc           (default: asc)
 *
 * Each week row in the response has links decoded from its JSON string
 * to a PHP array before encoding the final JSON output.
 */
function getAllWeeks(PDO $db): void
{
    // TODO: Build the base SELECT query.
    // SELECT id, title, start_date, description, links, created_at FROM weeks

    // TODO: If $_GET['search'] is provided and non-empty, append:
    // WHERE title LIKE :search OR description LIKE :search
    // Bind '%' . $search . '%' to :search.

    // TODO: Validate $_GET['sort'] against the whitelist [title, start_date].
    // Default to 'start_date' if missing or invalid.

    // TODO: Validate $_GET['order'] against [asc, desc].
    // Default to 'asc' if missing or invalid.

    // TODO: Append ORDER BY {sort} {order} to the query.

    // TODO: Prepare, bind (if searching), and execute the statement.

    // TODO: Fetch all rows as an associative array.

    // TODO: For each row, decode the links column:
    // $row['links'] = json_decode($row['links'], true) ?? [];

    // TODO: Call sendResponse(['success' => true, 'data' => $weeks]);
}


/**
 * Get a single week by its integer primary key.
 * Method: GET with ?id={id}.
 *
 * Response (found):
 *   { "success": true, "data": { id, title, start_date, description,
 *                                 links, created_at } }
 * Response (not found): HTTP 404.
 */
function getWeekById(PDO $db, $id): void
{
    // TODO: Validate that $id is provided and numeric.
    // If not, call sendResponse with HTTP 400.

    // TODO: SELECT id, title, start_date, description, links, created_at
    //       FROM weeks WHERE id = ?

    // TODO: Fetch one row. Decode the links JSON:
    // $week['links'] = json_decode($week['links'], true) ?? [];

    // TODO: If found, sendResponse success with the week.
    // If not found, sendResponse error with HTTP 404.
}


/**
 * Create a new week.
 * Method: POST (no ?action parameter).
 *
 * Required JSON body fields:
 *   title       — string (required)
 *   start_date  — string "YYYY-MM-DD" (required)
 *   description — string (optional, defaults to "")
 *   links       — array of URL strings (optional, defaults to [])
 *
 * Response (success): HTTP 201 — { success, message, id }
 * Response (invalid start_date): HTTP 400.
 */
function createWeek(PDO $db, array $data): void
{
    // TODO: Validate that title and start_date are present and non-empty.
    // If missing, sendResponse HTTP 400.

    // TODO: Trim title, start_date, and description.

    // TODO: Validate start_date format using DateTime::createFromFormat('Y-m-d', $start_date).
    // If invalid, sendResponse HTTP 400.

    // TODO: Default description to "" if not provided.

    // TODO: Handle links: if provided and is an array, json_encode it.
    // Otherwise use json_encode([]).

    // TODO: INSERT INTO weeks (title, start_date, description, links)
    //       VALUES (?, ?, ?, ?)
    // Note: id, created_at, and updated_at are handled by MySQL automatically.

    // TODO: If rowCount() > 0, sendResponse HTTP 201 with the new id.
    // Otherwise sendResponse HTTP 500.
}


/**
 * Update an existing week.
 * Method: PUT.
 *
 * Required JSON body:
 *   id — integer primary key of the week to update (required).
 * Optional JSON body fields (at least one must be present):
 *   title, start_date, description, links.
 *
 * Response (success): HTTP 200.
 * Response (not found): HTTP 404.
 * Response (invalid start_date): HTTP 400.
 */
function updateWeek(PDO $db, array $data): void
{
    // TODO: Validate that $data['id'] is present.
    // If not, sendResponse HTTP 400.

    // TODO: Check that a week with this id exists.
    // If not, sendResponse HTTP 404.

    // TODO: Dynamically build the SET clause for whichever of
    // title, start_date, description, links are present in $data.
    // - If start_date is included, validate its format.
    // - If links is included, json_encode it.

    // TODO: If no updatable fields are present, sendResponse HTTP 400.

    // TODO: updated_at is updated automatically by MySQL
    //       (ON UPDATE CURRENT_TIMESTAMP), so no need to set it manually.

    // TODO: Build: UPDATE weeks SET {clauses} WHERE id = ?
    // Prepare, bind all SET values, then bind id, and execute.

    // TODO: sendResponse HTTP 200 on success, HTTP 500 on failure.
}


/**
 * Delete a week by integer id.
 * Method: DELETE with ?id={id}.
 *
 * The ON DELETE CASCADE constraint on comments_week.week_id
 * automatically removes all comments for this week — no manual
 * deletion of comments is needed.
 *
 * Response (success): HTTP 200.
 * Response (not found): HTTP 404.
 */
function deleteWeek(PDO $db, $id): void
{
    // TODO: Validate that $id is provided and numeric.
    // If not, sendResponse HTTP 400.

    // TODO: Check that a week with this id exists.
    // If not, sendResponse HTTP 404.

    // TODO: DELETE FROM weeks WHERE id = ?
    // (comments_week rows are removed automatically by ON DELETE CASCADE.)

    // TODO: If rowCount() > 0, sendResponse HTTP 200.
    // Otherwise sendResponse HTTP 500.
}


// ============================================================================
// COMMENTS FUNCTIONS
// ============================================================================

/**
 * Get all comments for a specific week.
 * Method: GET with ?action=comments&week_id={id}.
 *
 * Reads from the comments_week table.
 * Returns an empty data array if no comments exist — not an error.
 *
 * Each comment object: { id, week_id, author, text, created_at }
 */
function getCommentsByWeek(PDO $db, $weekId): void
{
    // TODO: Validate that $weekId is provided and numeric.
    // If not, sendResponse HTTP 400.

    // TODO: SELECT id, week_id, author, text, created_at
    //       FROM comments_week
    //       WHERE week_id = ?
    //       ORDER BY created_at ASC

    // TODO: Fetch all rows. Return sendResponse with the array
    //       (empty array is valid).
}


/**
 * Create a new comment.
 * Method: POST with ?action=comment.
 *
 * Required JSON body:
 *   week_id — integer FK into weeks.id (required)
 *   author  — string (required)
 *   text    — string (required, must be non-empty after trim)
 *
 * Response (success): HTTP 201 — { success, message, id, data: comment }
 * Response (week not found): HTTP 404.
 * Response (missing fields): HTTP 400.
 */
function createComment(PDO $db, array $data): void
{
    // TODO: Validate that week_id, author, and text are all present and
    // non-empty after trimming. If any are missing, sendResponse HTTP 400.

    // TODO: Validate that week_id is numeric.

    // TODO: Check that a week with this id exists in the weeks table.
    // If not, sendResponse HTTP 404.

    // TODO: INSERT INTO comments_week (week_id, author, text)
    //       VALUES (?, ?, ?)

    // TODO: If rowCount() > 0, sendResponse HTTP 201 with the new id
    //       and the full new comment object.
    // Otherwise sendResponse HTTP 500.
}


/**
 * Delete a single comment.
 * Method: DELETE with ?action=delete_comment&comment_id={id}.
 *
 * Response (success): HTTP 200.
 * Response (not found): HTTP 404.
 */
function deleteComment(PDO $db, $commentId): void
{
    // TODO: Validate that $commentId is provided and numeric.
    // If not, sendResponse HTTP 400.

    // TODO: Check that the comment exists in comments_week.
    // If not, sendResponse HTTP 404.

    // TODO: DELETE FROM comments_week WHERE id = ?

    // TODO: If rowCount() > 0, sendResponse HTTP 200.
    // Otherwise sendResponse HTTP 500.
}


// ============================================================================
// MAIN REQUEST ROUTER
// ============================================================================

try {

    if ($method === 'GET') {

        // ?action=comments&week_id={id} → list comments for a week
        // TODO: if $action === 'comments', call getCommentsByWeek($db, $weekId)

        // ?id={id} → single week
        // TODO: elseif $id is set, call getWeekById($db, $id)

        // no parameters → all weeks (supports ?search, ?sort, ?order)
        // TODO: else call getAllWeeks($db)

    } elseif ($method === 'POST') {

        // ?action=comment → create a comment in comments_week
        // TODO: if $action === 'comment', call createComment($db, $data)

        // no action → create a new week
        // TODO: else call createWeek($db, $data)

    } elseif ($method === 'PUT') {

        // Update a week; id comes from the JSON body
        // TODO: call updateWeek($db, $data)

    } elseif ($method === 'DELETE') {

        // ?action=delete_comment&comment_id={id} → delete one comment
        // TODO: if $action === 'delete_comment', call deleteComment($db, $commentId)

        // ?id={id} → delete a week (and its comments via CASCADE)
        // TODO: else call deleteWeek($db, $id)

    } else {
        // TODO: sendResponse HTTP 405 Method Not Allowed.
    }

} catch (PDOException $e) {
    // TODO: Log the error with error_log().
    // Return a generic HTTP 500 — do NOT expose $e->getMessage() to clients.

} catch (Exception $e) {
    // TODO: Log the error with error_log().
    // Return HTTP 500 using sendResponse().
}


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Send a JSON response and stop execution.
 *
 * @param array $data        Must include a 'success' key.
 * @param int   $statusCode  HTTP status code (default 200).
 */
function sendResponse(array $data, int $statusCode = 200): void
{
    // TODO: http_response_code($statusCode);
    // TODO: echo json_encode($data, JSON_PRETTY_PRINT);
    // TODO: exit;
}


/**
 * Validate a date string against the "YYYY-MM-DD" format.
 *
 * @param  string $date
 * @return bool  True if valid, false otherwise.
 */
function validateDate(string $date): bool
{
    // TODO: $d = DateTime::createFromFormat('Y-m-d', $date);
    // TODO: return $d && $d->format('Y-m-d') === $date;
}


/**
 * Sanitize a string input.
 *
 * @param  string $data
 * @return string  Trimmed, tag-stripped, HTML-encoded string.
 */
function sanitizeInput(string $data): string
{
    // TODO: return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}
