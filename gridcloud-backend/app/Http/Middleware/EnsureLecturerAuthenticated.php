<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureLecturerAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = (string) $request->bearerToken();
        $parts = explode('.', $token, 2);
        $appKey = (string) config('app.key');

        if (count($parts) !== 2 || $parts[0] === '' || $parts[1] === '' || $appKey === '') {
            return response()->json(['message' => 'Akses dosen diperlukan.'], 401);
        }

        [$encodedPayload, $providedSignature] = $parts;
        $expectedSignature = hash_hmac('sha256', $encodedPayload, $appKey);

        if (! hash_equals($expectedSignature, $providedSignature)) {
            return response()->json(['message' => 'Token akses tidak valid.'], 401);
        }

        $decodedPayload = base64_decode(strtr($encodedPayload, '-_', '+/'), true);

        if ($decodedPayload === false || ! ctype_digit($decodedPayload) || (int) $decodedPayload < time()) {
            return response()->json(['message' => 'Sesi dosen telah berakhir. Silakan login kembali.'], 401);
        }

        return $next($request);
    }
}
