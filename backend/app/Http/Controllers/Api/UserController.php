<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /** Hanya super_admin yang boleh mengakses endpoint ini */
    private function checkSuperAdmin(): ?\Illuminate\Http\JsonResponse
    {
        if (auth()->user()?->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya Super Admin yang dapat mengelola akun.',
            ], 403);
        }
        return null;
    }

    /** GET /users — list semua user dengan search & filter */
    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        if ($err = $this->checkSuperAdmin()) return $err;

        $users = User::query()
            ->when($request->search, fn ($q, $s) =>
                $q->where('name', 'ilike', "%{$s}%")
                  ->orWhere('email', 'ilike', "%{$s}%")
            )
            ->when($request->role, fn ($q, $r) => $q->where('role', $r))
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => $users->items(),
            'meta'    => [
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
                'total'        => $users->total(),
            ],
        ]);
    }

    /** POST /users — buat akun baru */
    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        if ($err = $this->checkSuperAdmin()) return $err;

        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => 'required|email|max:255|unique:users,email',
            'password'  => 'required|string|min:8',
            'role'      => ['required', Rule::in([
                'super_admin', 'admin_klinik', 'dokter',
                'perawat', 'farmasi', 'kasir', 'owner',
            ])],
            'is_active' => 'boolean',
        ], [
            'name.required'     => 'Nama wajib diisi.',
            'email.required'    => 'Email wajib diisi.',
            'email.email'       => 'Format email tidak valid.',
            'email.unique'      => 'Email sudah digunakan.',
            'password.required' => 'Password wajib diisi.',
            'password.min'      => 'Password minimal 8 karakter.',
            'role.required'     => 'Role wajib dipilih.',
            'role.in'           => 'Role tidak valid.',
        ]);

        $validated['password']  = Hash::make($validated['password']);
        $validated['is_active'] = $validated['is_active'] ?? true;

        $user = User::create($validated);

        return response()->json([
            'success' => true,
            'message' => "Akun {$user->name} berhasil dibuat.",
            'data'    => $user,
        ], 201);
    }

    /** GET /users/{id} */
    public function show(User $user): \Illuminate\Http\JsonResponse
    {
        if ($err = $this->checkSuperAdmin()) return $err;

        return response()->json(['success' => true, 'data' => $user]);
    }

    /** PUT /users/{id} — update akun */
    public function update(Request $request, User $user): \Illuminate\Http\JsonResponse
    {
        if ($err = $this->checkSuperAdmin()) return $err;

        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => ['required', 'email', 'max:255',
                            Rule::unique('users', 'email')->ignore($user->id)],
            'password'  => 'nullable|string|min:8',
            'role'      => ['required', Rule::in([
                'super_admin', 'admin_klinik', 'dokter',
                'perawat', 'farmasi', 'kasir', 'owner',
            ])],
            'is_active' => 'boolean',
        ], [
            'email.unique'  => 'Email sudah digunakan akun lain.',
            'password.min'  => 'Password minimal 8 karakter.',
            'role.in'       => 'Role tidak valid.',
        ]);

        // Jangan reset password jika tidak diisi
        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => "Akun {$user->name} berhasil diperbarui.",
            'data'    => $user->fresh(),
        ]);
    }

    /** DELETE /users/{id} — nonaktifkan akun (soft-disable, bukan hard delete) */
    public function destroy(User $user): \Illuminate\Http\JsonResponse
    {
        if ($err = $this->checkSuperAdmin()) return $err;

        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menonaktifkan akun Anda sendiri.',
            ], 422);
        }

        $user->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => "Akun {$user->name} berhasil dinonaktifkan.",
        ]);
    }

    /** PATCH /users/{id}/activate — aktifkan kembali akun */
    public function activate(User $user): \Illuminate\Http\JsonResponse
    {
        if ($err = $this->checkSuperAdmin()) return $err;

        $user->update(['is_active' => true]);

        return response()->json([
            'success' => true,
            'message' => "Akun {$user->name} berhasil diaktifkan.",
        ]);
    }
}
