<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    public function log(string $activity, string $module, mixed $oldData = null, mixed $newData = null): void
    {
        $user = Auth::user();

        if (!$user) {
            return;
        }

        ActivityLog::create([
            'user_id' => $user->id,
            'activity' => $activity,
            'module' => $module,
            'old_data' => $oldData,
            'new_data' => $newData,
            'created_at' => now(),
        ]);
    }

    public function logCreate(string $module, mixed $newData): void
    {
        $this->log('create', $module, null, $newData);
    }

    public function logUpdate(string $module, mixed $oldData, mixed $newData): void
    {
        $this->log('update', $module, $oldData, $newData);
    }

    public function logDelete(string $module, mixed $oldData): void
    {
        $this->log('delete', $module, $oldData, null);
    }

    public function logRead(string $module): void
    {
        $this->log('read', $module, null, null);
    }
}
