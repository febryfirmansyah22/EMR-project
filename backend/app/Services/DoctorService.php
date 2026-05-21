<?php

namespace App\Services;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class DoctorService
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    public function index(array $filters = []): LengthAwarePaginator
    {
        return Doctor::with(['user', 'poli'])
            ->when(isset($filters['search']), fn ($q) => $q
                ->whereHas('user', fn ($u) => $u->where('name', 'ilike', "%{$filters['search']}%"))
            )
            ->when(isset($filters['poli_id']), fn ($q) => $q->where('poli_id', $filters['poli_id']))
            ->when(isset($filters['is_active']), fn ($q) => $q->where('is_active', $filters['is_active']))
            ->paginate($filters['per_page'] ?? 15);
    }

    public function store(array $data): Doctor
    {
        // Buat akun user untuk dokter
        $user = User::create([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'password'  => Hash::make($data['password'], ['rounds' => 12]),
            'role'      => 'dokter',
            'is_active' => $data['is_active'] ?? true,
        ]);

        $doctor = Doctor::create([
            'user_id'        => $user->id,
            'poli_id'        => $data['poli_id'] ?? null,
            'specialization' => $data['specialization'],
            'str_number'     => $data['str_number'] ?? null,
            'is_active'      => $data['is_active'] ?? true,
        ]);

        $this->auditLog->log('create', 'doctors', $doctor->id, null, $doctor->load('user', 'poli')->toArray());
        return $doctor->load('user', 'poli');
    }

    public function update(Doctor $doctor, array $data): Doctor
    {
        $old = $doctor->toArray();

        $doctor->update(array_filter([
            'poli_id'        => $data['poli_id'] ?? null,
            'specialization' => $data['specialization'] ?? null,
            'str_number'     => $data['str_number'] ?? null,
            'is_active'      => $data['is_active'] ?? null,
        ], fn ($v) => $v !== null));

        if (isset($data['name']) || isset($data['email'])) {
            $doctor->user->update(array_filter([
                'name'  => $data['name'] ?? null,
                'email' => $data['email'] ?? null,
            ], fn ($v) => $v !== null));
        }

        $this->auditLog->log('update', 'doctors', $doctor->id, $old, $doctor->fresh()->toArray());
        return $doctor->fresh()->load('user', 'poli');
    }

    public function destroy(Doctor $doctor): void
    {
        $this->auditLog->log('delete', 'doctors', $doctor->id, $doctor->toArray(), null);
        $doctor->update(['is_active' => false]); // soft-deactivate, bukan hapus
    }
}
