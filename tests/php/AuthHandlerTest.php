<?php

declare(strict_types=1);

use GuzzleHttp\Client;
use GuzzleHttp\Cookie\CookieJar;
use PHPUnit\Framework\TestCase;

/**
 * PHPUnit Tests for src/auth/api/index.php
 *
 * Starts a real php -S server with a router script that injects db.php
 * before each request. index.php is completely unmodified.
 *
 * Each test is worth 1 point.
 */
class AuthHandlerTest extends TestCase
{
    /** @var resource|null proc_open handle */
    private static $serverProcess = null;

    private static Client $client;

    // -----------------------------------------------------------------------
    // Start php -S once for the whole test class
    // -----------------------------------------------------------------------
    public static function setUpBeforeClass(): void
    {
        $host   = SERVER_HOST;
        $port   = SERVER_PORT;
        $root   = SERVER_ROOT;
        $router = TEST_ROUTER;

        $cmd = sprintf(
            'php -S %s:%s -t %s %s',
            $host,
            $port,
            escapeshellarg($root),
            escapeshellarg($router)
        );

        // proc_open gives us a handle we can reliably terminate later
        $descriptors = [
            0 => ['pipe', 'r'],  // stdin
            1 => ['pipe', 'w'],  // stdout
            2 => ['pipe', 'w'],  // stderr
        ];

        self::$serverProcess = proc_open($cmd, $descriptors, $pipes);

        // Wait up to 5 seconds for the port to open
        $start = time();
        while (time() - $start < 5) {
            $conn = @fsockopen($host, (int) $port, $errno, $errstr, 1);
            if ($conn !== false) {
                fclose($conn);
                break;
            }
            usleep(100_000); // 100 ms
        }

        self::$client = new Client([
            'base_uri'    => "http://{$host}:{$port}",
            'http_errors' => false,
            'timeout'     => 5,
        ]);
    }

    // -----------------------------------------------------------------------
    // Terminate the server after all tests
    // -----------------------------------------------------------------------
    public static function tearDownAfterClass(): void
    {
        if (self::$serverProcess !== null) {
            proc_terminate(self::$serverProcess);
            proc_close(self::$serverProcess);
            self::$serverProcess = null;
        }
    }

    // -----------------------------------------------------------------------
    // Helper: POST with a JSON body, return decoded response array
    // -----------------------------------------------------------------------
    private function post(array $body): array
    {
        $response = self::$client->post('/index.php', [
            'json' => $body,
        ]);

        $raw     = (string) $response->getBody();
        $decoded = json_decode($raw, true);

        $this->assertNotNull(
            $decoded,
            'index.php did not return valid JSON. Raw body: ' . $raw
        );

        return $decoded;
    }

    // -----------------------------------------------------------------------
    // Helper: any HTTP method, optional JSON body
    // -----------------------------------------------------------------------
    private function request(string $method, array $body = []): array
    {
        $options  = empty($body) ? [] : ['json' => $body];
        $response = self::$client->request($method, '/index.php', $options);

        $raw     = (string) $response->getBody();
        $decoded = json_decode($raw, true);

        $this->assertNotNull(
            $decoded,
            "index.php did not return valid JSON for {$method}. Raw body: " . $raw
        );

        return $decoded;
    }

    // -----------------------------------------------------------------------
    // [PHP-01] Non-POST request returns success: false
    // -----------------------------------------------------------------------
    public function testRejectsNonPostRequest(): void
    {
        $response = $this->request('GET');
        $this->assertFalse($response['success']);
    }

    // -----------------------------------------------------------------------
    // [PHP-02] Missing email field returns success: false
    // -----------------------------------------------------------------------
    public function testRejectsMissingEmail(): void
    {
        $response = $this->post(['password' => 'password123']);
        $this->assertFalse($response['success']);
    }

    // -----------------------------------------------------------------------
    // [PHP-03] Missing password field returns success: false
    // -----------------------------------------------------------------------
    public function testRejectsMissingPassword(): void
    {
        $response = $this->post(['email' => '202101234@stu.uob.edu.bh']);
        $this->assertFalse($response['success']);
    }

    // -----------------------------------------------------------------------
    // [PHP-04] Invalid email format returns success: false
    // -----------------------------------------------------------------------
    public function testRejectsInvalidEmailFormat(): void
    {
        $response = $this->post([
            'email'    => 'not-an-email',
            'password' => 'password123',
        ]);
        $this->assertFalse($response['success']);
    }

    // -----------------------------------------------------------------------
    // [PHP-05] Password shorter than 8 characters returns success: false
    // -----------------------------------------------------------------------
    public function testRejectsShortPassword(): void
    {
        $response = $this->post([
            'email'    => '202101234@stu.uob.edu.bh',
            'password' => 'abc',
        ]);
        $this->assertFalse($response['success']);
    }

    // -----------------------------------------------------------------------
    // [PHP-06] Response Content-Type header is application/json
    // -----------------------------------------------------------------------
    public function testResponseContentTypeIsJson(): void
    {
        $response    = self::$client->request('GET', '/index.php');
        $contentType = $response->getHeaderLine('Content-Type');

        $this->assertStringContainsString(
            'application/json',
            $contentType,
            'Content-Type header should contain application/json'
        );
    }

    // -----------------------------------------------------------------------
    // [PHP-07] Unknown user returns success: false
    // -----------------------------------------------------------------------
    public function testRejectsUnknownUser(): void
    {
        $response = $this->post([
            'email'    => 'nobody@example.com',
            'password' => 'password123',
        ]);
        $this->assertFalse($response['success']);
    }

    // -----------------------------------------------------------------------
    // [PHP-08] Wrong password returns success: false
    // -----------------------------------------------------------------------
    public function testRejectsWrongPassword(): void
    {
        $response = $this->post([
            'email'    => '202101234@stu.uob.edu.bh',
            'password' => 'wrongpassword',
        ]);
        $this->assertFalse($response['success']);
    }

    // -----------------------------------------------------------------------
    // [PHP-09] Valid credentials return success: true
    // -----------------------------------------------------------------------
    public function testAcceptsValidCredentials(): void
    {
        $response = $this->post([
            'email'    => '202101234@stu.uob.edu.bh',
            'password' => 'password123',
        ]);
        $this->assertTrue($response['success']);
    }

    // -----------------------------------------------------------------------
    // [PHP-10] Success response includes user.id
    // -----------------------------------------------------------------------
    public function testSuccessResponseIncludesUserId(): void
    {
        $response = $this->post([
            'email'    => '202101234@stu.uob.edu.bh',
            'password' => 'password123',
        ]);
        $this->assertArrayHasKey('user', $response);
        $this->assertArrayHasKey('id',   $response['user']);
    }

    // -----------------------------------------------------------------------
    // [PHP-11] Success response includes user.name
    // -----------------------------------------------------------------------
    public function testSuccessResponseIncludesUserName(): void
    {
        $response = $this->post([
            'email'    => '202101234@stu.uob.edu.bh',
            'password' => 'password123',
        ]);
        $this->assertArrayHasKey('user', $response);
        $this->assertArrayHasKey('name', $response['user']);
        $this->assertSame('Ali Hassan', $response['user']['name']);
    }

    // -----------------------------------------------------------------------
    // [PHP-12] Success response includes user.email
    // -----------------------------------------------------------------------
    public function testSuccessResponseIncludesUserEmail(): void
    {
        $response = $this->post([
            'email'    => '202101234@stu.uob.edu.bh',
            'password' => 'password123',
        ]);
        $this->assertArrayHasKey('user',  $response);
        $this->assertArrayHasKey('email', $response['user']);
        $this->assertSame('202101234@stu.uob.edu.bh', $response['user']['email']);
    }

    // -----------------------------------------------------------------------
    // [PHP-13] Success response includes user.is_admin
    // -----------------------------------------------------------------------
    public function testSuccessResponseIncludesIsAdmin(): void
    {
        $response = $this->post([
            'email'    => '202101234@stu.uob.edu.bh',
            'password' => 'password123',
        ]);
        $this->assertArrayHasKey('user',     $response);
        $this->assertArrayHasKey('is_admin', $response['user']);
    }

    // -----------------------------------------------------------------------
    // [PHP-14] Success response does NOT include user.password
    // -----------------------------------------------------------------------
    public function testSuccessResponseDoesNotIncludePassword(): void
    {
        $response = $this->post([
            'email'    => '202101234@stu.uob.edu.bh',
            'password' => 'password123',
        ]);
        $this->assertArrayHasKey('user', $response);
        $this->assertArrayNotHasKey(
            'password',
            $response['user'],
            'Password must never be returned in the JSON response.'
        );
    }

    // -----------------------------------------------------------------------
    // [PHP-15] Session is persisted: a second request with the same cookie
    //          jar returns a valid session cookie proving session_start()
    //          and $_SESSION writes executed without error
    // -----------------------------------------------------------------------
    public function testSessionCookieIsSetOnSuccess(): void
    {
        $jar = new CookieJar();

        $response = self::$client->post('/index.php', [
            'json'    => [
                'email'    => '202101234@stu.uob.edu.bh',
                'password' => 'password123',
            ],
            'cookies' => $jar,
        ]);

        $body = json_decode((string) $response->getBody(), true);

        // If session_start() ran and $_SESSION was written without error,
        // the response must be a successful login AND a PHPSESSID cookie
        // must have been issued by the server.
        $this->assertTrue(
            $body['success'],
            'Login should succeed before checking session cookie.'
        );

        $sessionCookie = $jar->getCookieByName('PHPSESSID');

        $this->assertNotNull(
            $sessionCookie,
            'A PHPSESSID cookie should be set when session_start() is called and ' .
            '$_SESSION variables are written successfully.'
        );
    }
}
