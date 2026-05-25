<?php

declare(strict_types=1);

use GuzzleHttp\Client;
use PHPUnit\Framework\TestCase;

/**
 * PHPUnit Tests for src/assignments/api/index.php
 * Each test is worth 1 point.
 */
class AssignmentsApiTest extends TestCase
{
    /** @var resource|null */
    private static $serverProcess = null;

    private static Client $client;

    public static function setUpBeforeClass(): void
    {
        $host   = ASSIGNMENTS_SERVER_HOST;
        $port   = ASSIGNMENTS_SERVER_PORT;
        $root   = ASSIGNMENTS_SERVER_ROOT;
        $router = ASSIGNMENTS_TEST_ROUTER;

        $cmd = sprintf(
            'php -S %s:%s -t %s %s',
            $host, $port,
            escapeshellarg($root),
            escapeshellarg($router)
        );

        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        self::$serverProcess = proc_open($cmd, $descriptors, $pipes);

        $start = time();
        while (time() - $start < 5) {
            $conn = @fsockopen($host, (int) $port, $errno, $errstr, 1);
            if ($conn !== false) { fclose($conn); break; }
            usleep(100_000);
        }

        self::$client = new Client([
            'base_uri'    => "http://{$host}:{$port}",
            'http_errors' => false,
            'timeout'     => 5,
        ]);
    }

    public static function tearDownAfterClass(): void
    {
        if (self::$serverProcess !== null) {
            proc_terminate(self::$serverProcess);
            proc_close(self::$serverProcess);
            self::$serverProcess = null;
        }
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------
    private function get(array $query = []): array
    {
        $uri     = '/index.php' . (empty($query) ? '' : '?' . http_build_query($query));
        $raw     = (string) self::$client->get($uri)->getBody();
        $decoded = json_decode($raw, true);
        $this->assertNotNull($decoded, 'Expected valid JSON. Got: ' . $raw);
        return $decoded;
    }

    private function post(array $body, array $query = []): array
    {
        $uri     = '/index.php' . (empty($query) ? '' : '?' . http_build_query($query));
        $raw     = (string) self::$client->post($uri, ['json' => $body])->getBody();
        $decoded = json_decode($raw, true);
        $this->assertNotNull($decoded, 'Expected valid JSON. Got: ' . $raw);
        return $decoded;
    }

    private function put(array $body): array
    {
        $raw     = (string) self::$client->put('/index.php', ['json' => $body])->getBody();
        $decoded = json_decode($raw, true);
        $this->assertNotNull($decoded, 'Expected valid JSON. Got: ' . $raw);
        return $decoded;
    }

    private function delete(array $query): array
    {
        $uri     = '/index.php?' . http_build_query($query);
        $raw     = (string) self::$client->delete($uri)->getBody();
        $decoded = json_decode($raw, true);
        $this->assertNotNull($decoded, 'Expected valid JSON. Got: ' . $raw);
        return $decoded;
    }

    private function httpStatusFor(string $method, array $body = [], array $query = []): int
    {
        $uri     = '/index.php' . (empty($query) ? '' : '?' . http_build_query($query));
        $options = empty($body) ? [] : ['json' => $body];
        return self::$client->request($method, $uri, $options)->getStatusCode();
    }

    // -----------------------------------------------------------------------
    // [PHP-01] GET returns success:true with a data array
    // -----------------------------------------------------------------------
    public function testGetAllAssignmentsReturnsSuccessAndDataArray(): void
    {
        $r = $this->get();
        $this->assertTrue($r['success']);
        $this->assertArrayHasKey('data', $r);
        $this->assertIsArray($r['data']);
    }

    // -----------------------------------------------------------------------
    // [PHP-02] GET returns the seeded assignments
    // -----------------------------------------------------------------------
    public function testGetAllAssignmentsIncludesSeededAssignments(): void
    {
        $r      = $this->get();
        $titles = array_column($r['data'], 'title');
        $this->assertContains('HTML & CSS Portfolio',    $titles);
        $this->assertContains('JavaScript Interactivity', $titles);
    }

    // -----------------------------------------------------------------------
    // [PHP-03] GET returns expected fields including files as an array
    // -----------------------------------------------------------------------
    public function testGetAllAssignmentsReturnsExpectedFields(): void
    {
        $r = $this->get();
        $this->assertNotEmpty($r['data']);
        $first = $r['data'][0];
        foreach (['id', 'title', 'description', 'due_date', 'files', 'created_at'] as $field) {
            $this->assertArrayHasKey($field, $first, "Field '{$field}' missing.");
        }
        $this->assertIsArray($first['files'], "'files' must be decoded to an array.");
    }

    // -----------------------------------------------------------------------
    // [PHP-04] GET ?id=<valid> returns the correct single assignment
    // -----------------------------------------------------------------------
    public function testGetAssignmentByIdReturnsCorrectAssignment(): void
    {
        $all     = $this->get();
        $firstId = $all['data'][0]['id'];

        $r = $this->get(['id' => $firstId]);
        $this->assertTrue($r['success']);
        $this->assertArrayHasKey('data', $r);
        $this->assertSame((int) $firstId, (int) $r['data']['id']);
    }

    // -----------------------------------------------------------------------
    // [PHP-05] GET ?id=99999 returns HTTP 404
    // -----------------------------------------------------------------------
    public function testGetAssignmentByIdReturns404ForUnknownId(): void
    {
        $this->assertSame(404, $this->httpStatusFor('GET', [], ['id' => 99999]));
    }

    // -----------------------------------------------------------------------
    // [PHP-06] Content-Type header is application/json
    // -----------------------------------------------------------------------
    public function testResponseContentTypeIsJson(): void
    {
        $contentType = self::$client->get('/index.php')->getHeaderLine('Content-Type');
        $this->assertStringContainsString('application/json', $contentType);
    }

    // -----------------------------------------------------------------------
    // [PHP-07] GET ?search= filters by title or description
    // -----------------------------------------------------------------------
    public function testSearchFiltersByTitleOrDescription(): void
    {
        $r = $this->get(['search' => 'JavaScript']);
        $this->assertTrue($r['success']);
        $this->assertNotEmpty($r['data']);
        foreach ($r['data'] as $a) {
            $hay = strtolower($a['title'] . ' ' . $a['description']);
            $this->assertStringContainsString('javascript', $hay);
        }
    }

    // -----------------------------------------------------------------------
    // [PHP-08] POST creates a new assignment and returns HTTP 201
    // -----------------------------------------------------------------------
    public function testCreateAssignmentReturns201(): void
    {
        $status = $this->httpStatusFor('POST', [
            'title'       => 'Test Assignment',
            'description' => 'A test assignment.',
            'due_date'    => '2025-06-01',
            'files'       => [],
        ]);
        $this->assertSame(201, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-09] POST response includes the new assignment id
    // -----------------------------------------------------------------------
    public function testCreateAssignmentReturnsNewId(): void
    {
        $r = $this->post([
            'title'       => 'Another Assignment',
            'description' => 'Description here.',
            'due_date'    => '2025-06-08',
            'files'       => ['https://example.com/brief.pdf'],
        ]);
        $this->assertTrue($r['success']);
        $this->assertArrayHasKey('id', $r);
        $this->assertIsNumeric($r['id']);
    }

    // -----------------------------------------------------------------------
    // [PHP-10] POST with missing title returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateAssignmentRejects400WhenTitleMissing(): void
    {
        $this->assertSame(400, $this->httpStatusFor('POST', [
            'description' => 'No title.',
            'due_date'    => '2025-06-15',
        ]));
    }

    // -----------------------------------------------------------------------
    // [PHP-11] POST with missing description returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateAssignmentRejects400WhenDescriptionMissing(): void
    {
        $this->assertSame(400, $this->httpStatusFor('POST', [
            'title'    => 'No Description',
            'due_date' => '2025-06-15',
        ]));
    }

    // -----------------------------------------------------------------------
    // [PHP-12] POST with missing due_date returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateAssignmentRejects400WhenDueDateMissing(): void
    {
        $this->assertSame(400, $this->httpStatusFor('POST', [
            'title'       => 'No Date',
            'description' => 'Missing date.',
        ]));
    }

    // -----------------------------------------------------------------------
    // [PHP-13] POST with invalid due_date format returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateAssignmentRejects400ForInvalidDateFormat(): void
    {
        $this->assertSame(400, $this->httpStatusFor('POST', [
            'title'       => 'Bad Date',
            'description' => 'Wrong format.',
            'due_date'    => '01-06-2025',
        ]));
    }

    // -----------------------------------------------------------------------
    // [PHP-14] PUT updates an existing assignment's title
    // -----------------------------------------------------------------------
    public function testUpdateAssignmentTitle(): void
    {
        $all  = $this->get();
        $id   = $all['data'][0]['id'];

        $r = $this->put(['id' => $id, 'title' => 'Updated Title']);
        $this->assertTrue($r['success']);

        $updated = $this->get(['id' => $id]);
        $this->assertSame('Updated Title', $updated['data']['title']);
    }

    // -----------------------------------------------------------------------
    // [PHP-15] PUT with unknown id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testUpdateAssignmentReturns404ForUnknownId(): void
    {
        $this->assertSame(404, $this->httpStatusFor('PUT', [
            'id'    => 99999,
            'title' => 'Ghost',
        ]));
    }

    // -----------------------------------------------------------------------
    // [PHP-16] PUT with invalid due_date returns HTTP 400
    // -----------------------------------------------------------------------
    public function testUpdateAssignmentRejects400ForInvalidDate(): void
    {
        $all = $this->get();
        $id  = $all['data'][0]['id'];
        $this->assertSame(400, $this->httpStatusFor('PUT', [
            'id'       => $id,
            'due_date' => 'not-a-date',
        ]));
    }

    // -----------------------------------------------------------------------
    // [PHP-17] DELETE removes an assignment successfully
    // -----------------------------------------------------------------------
    public function testDeleteAssignmentSucceeds(): void
    {
        $created  = $this->post([
            'title'       => 'To Be Deleted',
            'description' => 'Gone soon.',
            'due_date'    => '2025-12-01',
            'files'       => [],
        ]);
        $deleteId = $created['id'];

        $r = $this->delete(['id' => $deleteId]);
        $this->assertTrue($r['success']);

        $this->assertSame(404, $this->httpStatusFor('GET', [], ['id' => $deleteId]));
    }

    // -----------------------------------------------------------------------
    // [PHP-18] DELETE with unknown id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testDeleteAssignmentReturns404ForUnknownId(): void
    {
        $this->assertSame(404, $this->httpStatusFor('DELETE', [], ['id' => 99999]));
    }

    // -----------------------------------------------------------------------
    // [PHP-19] GET ?action=comments&assignment_id=<id> returns array
    // -----------------------------------------------------------------------
    public function testGetCommentsByAssignmentIdReturnsArray(): void
    {
        $all          = $this->get();
        $assignmentId = $all['data'][0]['id'];

        $r = $this->get(['action' => 'comments', 'assignment_id' => $assignmentId]);
        $this->assertTrue($r['success']);
        $this->assertArrayHasKey('data', $r);
        $this->assertIsArray($r['data']);
    }

    // -----------------------------------------------------------------------
    // [PHP-20] GET ?action=comments returns seeded comments
    // -----------------------------------------------------------------------
    public function testGetCommentsReturnsSeededComments(): void
    {
        $a = $this->post([
            'title'       => 'Comments Test Assignment',
            'description' => 'Self-contained test.',
            'due_date'    => '2025-11-01',
            'files'       => [],
        ]);
        $this->assertTrue($a['success']);
        $assignmentId = $a['id'];

        $c = $this->post(
            ['assignment_id' => $assignmentId, 'author' => 'Mohamed Abdulla',
             'text' => 'Is Flexbox okay?'],
            ['action' => 'comment']
        );
        $this->assertTrue($c['success']);

        $r = $this->get(['action' => 'comments', 'assignment_id' => $assignmentId]);
        $this->assertTrue($r['success']);
        $this->assertNotEmpty($r['data']);
        $this->assertContains('Mohamed Abdulla', array_column($r['data'], 'author'));
    }

    // -----------------------------------------------------------------------
    // [PHP-21] POST ?action=comment creates a comment and returns HTTP 201
    // -----------------------------------------------------------------------
    public function testCreateCommentReturns201(): void
    {
        $all          = $this->get();
        $assignmentId = $all['data'][0]['id'];

        $status = $this->httpStatusFor(
            'POST',
            ['assignment_id' => $assignmentId, 'author' => 'Test Student',
             'text' => 'This is a test comment.'],
            ['action' => 'comment']
        );
        $this->assertSame(201, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-22] POST ?action=comment with missing text returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateCommentRejects400WhenTextMissing(): void
    {
        $all          = $this->get();
        $assignmentId = $all['data'][0]['id'];

        $this->assertSame(400, $this->httpStatusFor(
            'POST',
            ['assignment_id' => $assignmentId, 'author' => 'Student'],
            ['action' => 'comment']
        ));
    }

    // -----------------------------------------------------------------------
    // [PHP-23] POST ?action=comment with unknown assignment_id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testCreateCommentReturns404ForUnknownAssignment(): void
    {
        $this->assertSame(404, $this->httpStatusFor(
            'POST',
            ['assignment_id' => 99999, 'author' => 'Ghost',
             'text' => 'This assignment does not exist.'],
            ['action' => 'comment']
        ));
    }

    // -----------------------------------------------------------------------
    // [PHP-24] DELETE ?action=delete_comment&comment_id=<id> removes comment
    // -----------------------------------------------------------------------
public function testDeleteCommentSucceeds(): void
{
    // Create a throwaway assignment with all required fields non-empty.
    $a = $this->post([
        'title'       => 'Comment Target',
        'description' => 'Used by testDeleteCommentSucceeds.',
        'due_date'    => '2025-11-10',
        'files'       => [],
    ]);
    $this->assertTrue($a['success'], 'Failed to create target assignment.');
    $assignmentId = $a['id'];

    // Create the comment to delete.
    $c = $this->post(
        [
            'assignment_id' => $assignmentId,
            'author'        => 'To Delete',
            'text'          => 'Delete this comment.',
        ],
        ['action' => 'comment']
    );
    $this->assertTrue($c['success'], 'Failed to create target comment.');
    $commentId = $c['id'];

    // Delete the comment and assert success.
    $r = $this->delete([
        'action'     => 'delete_comment',
        'comment_id' => $commentId,
    ]);
    $this->assertTrue($r['success']);
}
    // -----------------------------------------------------------------------
    // [PHP-25] DELETE ?action=delete_comment with unknown id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testDeleteCommentReturns404ForUnknownId(): void
    {
        $this->assertSame(404, $this->httpStatusFor(
            'DELETE', [],
            ['action' => 'delete_comment', 'comment_id' => 99999]
        ));
    }

    // -----------------------------------------------------------------------
    // [PHP-26] Unsupported HTTP method returns HTTP 405
    // -----------------------------------------------------------------------
    public function testUnsupportedMethodReturns405(): void
    {
        $this->assertSame(405, $this->httpStatusFor('PATCH'));
    }
}
