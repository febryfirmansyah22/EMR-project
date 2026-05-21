<?php

namespace App\Services;

use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class TokenService
{
    public function fromUser(mixed $user): string
    {
        return JWTAuth::fromUser($user);
    }

    public function payload(): mixed
    {
        return JWTAuth::parseToken()->getPayload();
    }
}
