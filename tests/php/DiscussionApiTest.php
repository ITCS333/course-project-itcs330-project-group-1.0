<?php

declare(strict_types=1);

use GuzzleHttp\Client;
use PHPUnit\Framework\TestCase;

/**
 * PHPUnit Tests for src/discussion/api/index.php
 * Each test is worth 1 point.
 */
class DiscussionApiTest extends TestCase
{
    /** @var resource|null */
    private static $serverProcess = null;

    private static Client $client;

    public static function setUpBeforeClass(): void
    {
        $host   = DISCUSSION_SERVER_HOST;
        $port   = DISCUSSION_SERVER_PORT;
        $root   = DISCUSSION_SERVER_ROOT;
        $router = DISCUSSION_TEST_ROUTER;

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
    public function testGetAllTopicsReturnsSuccessAndDataArray(): void
    {
        $r = $this->get();
        $this->assertTrue($r['success']);
        $this->assertArrayHasKey('data', $r);
        $this->assertIsArray($r['data']);
    }

    // -----------------------------------------------------------------------
    // [PHP-02] GET returns the seeded topics
    // -----------------------------------------------------------------------
    public function testGetAllTopicsIncludesSeededTopics(): void
    {
        $r        = $this->get();
        $subjects = array_column($r['data'], 'subject');
        $this->assertContains('Welcome to Web Development!', $subjects);
        $this->assertContains('Best CSS Framework?',          $subjects);
    }

    // -----------------------------------------------------------------------
    // [PHP-03] GET returns expected fields
    // -----------------------------------------------------------------------
    public function testGetAllTopicsReturnsExpectedFields(): void
    {
        $r = $this->get();
        $this->assertNotEmpty($r['data']);
        $first = $r['data'][0];
        foreach (['id', 'subject', 'message', 'author', 'created_at'] as $field) {
            $this->assertArrayHasKey($field, $first, "Field '{$field}' missing.");
        }
    }

    // -----------------------------------------------------------------------
    // [PHP-04] GET ?id=<valid> returns the correct single topic
    // -----------------------------------------------------------------------
    public function testGetTopicByIdReturnsCorrectTopic(): void
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
    public function testGetTopicByIdReturns404ForUnknownId(): void
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
    // [PHP-07] GET ?search= filters by subject, message, or author
    // -----------------------------------------------------------------------
    public function testSearchFiltersBySubjectMessageOrAuthor(): void
    {
        $r = $this->get(['search' => 'CSS']);
        $this->assertTrue($r['success']);
        $this->assertNotEmpty($r['data']);
        foreach ($r['data'] as $topic) {
            $hay = strtolower($topic['subject'] . ' ' . $topic['message'] . ' ' . $topic['author']);
            $this->assertStringContainsString('css', $hay);
        }
    }

    // -----------------------------------------------------------------------
    // [PHP-08] POST creates a new topic and returns HTTP 201
    // -----------------------------------------------------------------------
    public function testCreateTopicReturns201(): void
    {
        $status = $this->httpStatusFor('POST', [
            'subject' => 'Test Topic',
            'message' => 'A test message.',
            'author'  => 'Student',
        ]);
        $this->assertSame(201, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-09] POST response includes the new topic id
    // -----------------------------------------------------------------------
    public function testCreateTopicReturnsNewId(): void
    {
        $r = $this->post([
            'subject' => 'Another Topic',
            'message' => 'Another message.',
            'author'  => 'Student',
        ]);
        $this->assertTrue($r['success']);
        $this->assertArrayHasKey('id', $r);
        $this->assertIsNumeric($r['id']);
    }

    // -----------------------------------------------------------------------
    // [PHP-10] POST with missing subject returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateTopicRejects400WhenSubjectMissing(): void
    {
        $this->assertSame(400, $this->httpStatusFor('POST', [
            'message' => 'No subject.',
            'author'  => 'Student',
        ]));
    }

    // -----------------------------------------------------------------------
    // [PHP-11] POST with missing message returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateTopicRejects400WhenMessageMissing(): void
    {
        $this->assertSame(400, $this->httpStatusFor('POST', [
            'subject' => 'No message topic.',
            'author'  => 'Student',
        ]));
    }

    // -----------------------------------------------------------------------
    // [PHP-12] POST with missing author returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateTopicRejects400WhenAuthorMissing(): void
    {
        $this->assertSame(400, $this->httpStatusFor('POST', [
            'subject' => 'No author topic.',
            'message' => 'A message.',
        ]));
    }

    // -----------------------------------------------------------------------
    // [PHP-13] PUT updates an existing topic's subject
    // -----------------------------------------------------------------------
    public function testUpdateTopicSubject(): void
    {
        $all  = $this->get();
        $id   = $all['data'][0]['id'];

        $r = $this->put(['id' => $id, 'subject' => 'Updated Subject']);
        $this->assertTrue($r['success']);

        $updated = $this->get(['id' => $id]);
        $this->assertSame('Updated Subject', $updated['data']['subject']);
    }

    // -----------------------------------------------------------------------
    // [PHP-14] PUT with unknown id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testUpdateTopicReturns404ForUnknownId(): void
    {
        $this->assertSame(404, $this->httpStatusFor('PUT', [
            'id'      => 99999,
            'subject' => 'Ghost Topic',
        ]));
    }

    // -----------------------------------------------------------------------
    // [PHP-15] DELETE removes a topic successfully
    // -----------------------------------------------------------------------
    public function testDeleteTopicSucceeds(): void
    {
        $created = $this->post([
            'subject' => 'To Be Deleted',
            'message' => 'Gone soon.',
            'author'  => 'Student',
        ]);
        $deleteId = $created['id'];

        $r = $this->delete(['id' => $deleteId]);
        $this->assertTrue($r['success']);

        $this->assertSame(404, $this->httpStatusFor('GET', [], ['id' => $deleteId]));
    }

    // -----------------------------------------------------------------------
    // [PHP-16] DELETE with unknown id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testDeleteTopicReturns404ForUnknownId(): void
    {
        $this->assertSame(404, $this->httpStatusFor('DELETE', [], ['id' => 99999]));
    }

    // -----------------------------------------------------------------------
    // [PHP-17] GET ?action=replies&topic_id=<id> returns array
    // -----------------------------------------------------------------------
    public function testGetRepliesByTopicIdReturnsArray(): void
    {
        $all     = $this->get();
        $topicId = $all['data'][0]['id'];

        $r = $this->get(['action' => 'replies', 'topic_id' => $topicId]);
        $this->assertTrue($r['success']);
        $this->assertArrayHasKey('data', $r);
        $this->assertIsArray($r['data']);
    }

    // -----------------------------------------------------------------------
    // [PHP-18] GET ?action=replies returns seeded replies
    // -----------------------------------------------------------------------
    public function testGetRepliesReturnsSeededReplies(): void
    {
        $t = $this->post([
            'subject' => 'Replies Test Topic',
            'message' => 'Self-contained test.',
            'author'  => 'Student',
        ]);
        $this->assertTrue($t['success']);
        $topicId = $t['id'];

        $rep = $this->post(
            ['topic_id' => $topicId, 'author' => 'Ali Hassan', 'text' => 'Great topic!'],
            ['action' => 'reply']
        );
        $this->assertTrue($rep['success']);

        $r = $this->get(['action' => 'replies', 'topic_id' => $topicId]);
        $this->assertTrue($r['success']);
        $this->assertNotEmpty($r['data']);
        $this->assertContains('Ali Hassan', array_column($r['data'], 'author'));
    }

    // -----------------------------------------------------------------------
    // [PHP-19] GET ?action=replies returns expected reply fields
    // -----------------------------------------------------------------------
    public function testGetRepliesReturnsExpectedFields(): void
    {
        $t = $this->post([
            'subject' => 'Fields Test Topic',
            'message' => 'Testing reply fields.',
            'author'  => 'Student',
        ]);
        $topicId = $t['id'];

        $this->post(
            ['topic_id' => $topicId, 'author' => 'Fatema Ahmed', 'text' => 'A reply.'],
            ['action' => 'reply']
        );

        $r = $this->get(['action' => 'replies', 'topic_id' => $topicId]);
        $this->assertNotEmpty($r['data']);
        $first = $r['data'][0];
        foreach (['id', 'topic_id', 'text', 'author', 'created_at'] as $field) {
            $this->assertArrayHasKey($field, $first, "Field '{$field}' missing.");
        }
    }

    // -----------------------------------------------------------------------
    // [PHP-20] POST ?action=reply creates a reply and returns HTTP 201
    // -----------------------------------------------------------------------
    public function testCreateReplyReturns201(): void
    {
        $all     = $this->get();
        $topicId = $all['data'][0]['id'];

        $status = $this->httpStatusFor(
            'POST',
            ['topic_id' => $topicId, 'author' => 'Test Student', 'text' => 'A test reply.'],
            ['action' => 'reply']
        );
        $this->assertSame(201, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-21] POST ?action=reply with missing text returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateReplyRejects400WhenTextMissing(): void
    {
        $all     = $this->get();
        $topicId = $all['data'][0]['id'];

        $this->assertSame(400, $this->httpStatusFor(
            'POST',
            ['topic_id' => $topicId, 'author' => 'Student'],
            ['action' => 'reply']
        ));
    }

    // -----------------------------------------------------------------------
    // [PHP-22] POST ?action=reply with unknown topic_id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testCreateReplyReturns404ForUnknownTopic(): void
    {
        $this->assertSame(404, $this->httpStatusFor(
            'POST',
            ['topic_id' => 99999, 'author' => 'Ghost', 'text' => 'No topic here.'],
            ['action' => 'reply']
        ));
    }

    // -----------------------------------------------------------------------
    // [PHP-23] DELETE ?action=delete_reply&id=<id> removes a reply
    // -----------------------------------------------------------------------
    public function testDeleteReplySucceeds(): void
    {
        $t = $this->post([
            'subject' => 'Reply Delete Target',
            'message' => 'A topic for reply deletion test.',
            'author'  => 'Student',
        ]);
        $topicId = $t['id'];

        $rep = $this->post(
            ['topic_id' => $topicId, 'author' => 'To Delete', 'text' => 'Delete this reply.'],
            ['action' => 'reply']
        );
        $this->assertTrue($rep['success'], 'Failed to create reply.');
        $replyId = $rep['id'];

        $r = $this->delete(['action' => 'delete_reply', 'id' => $replyId]);
        $this->assertTrue($r['success']);
    }

    // -----------------------------------------------------------------------
    // [PHP-24] DELETE ?action=delete_reply with unknown id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testDeleteReplyReturns404ForUnknownId(): void
    {
        $this->assertSame(404, $this->httpStatusFor(
            'DELETE', [],
            ['action' => 'delete_reply', 'id' => 99999]
        ));
    }

    // -----------------------------------------------------------------------
    // [PHP-25] Unsupported HTTP method returns HTTP 405
    // -----------------------------------------------------------------------
    public function testUnsupportedMethodReturns405(): void
    {
        $this->assertSame(405, $this->httpStatusFor('PATCH'));
    }
}
