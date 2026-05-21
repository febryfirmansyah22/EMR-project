<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Memastikan semua request ke /api/* dianggap sebagai API request
 * sehingga validasi errors dan exceptions selalu dikembalikan sebagai JSON,
 * bukan HTML redirect.
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
