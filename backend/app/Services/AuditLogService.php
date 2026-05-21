<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    public function log(
        string $action,
        string $resource,
        int|string|null $resourceId = null,
        mixed $oldData = null,
        mixed $newData = null
    ): void {
        $user = auth()->user();

        AuditLog::create([
            'user_id'     => $user?->id,
            'user_name'   => $user?->name,
            'user_role'   => $user?->role,
            'action'      => $action,
            'resource'    => $resource,
            'resource_id' => $resourceId,
            'old_data'    => $oldData ? json_encode($oldData) : null,
            'new_data'    => $newData ? json_encode($newData) : null,
            'ip_address'  => Request::ip(),
            'user_agent'  => Request::userAgent(),
        ]);
    }
}
