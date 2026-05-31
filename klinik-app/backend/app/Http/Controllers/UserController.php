<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = User::orderBy('name');

        if ($request->get('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', '%' . $request->search . '%')
                    ->orWhere('email', 'ilike', '%' . $request->search . '%')
                    ->orWhere('username', 'ilike', '%' . $request->search . '%');
            });
        }

        if ($request->get('role')) {
            $query->where('role', $request->role);
        }

        if ($request->get('status')) {
            $query->where('status', $request->status);
        }

        $users = $query->paginate($request->get('per_page', 15));

        return $this->paginated('Users list', $users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        $this->activityLog->logCreate('users', array_merge($user->toArray(), ['password' => '[hidden]']));

        return $this->success('User created', $user, [], 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $oldData = $user->toArray();
        $data = $request->validated();

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        $this->activityLog->logUpdate('users',
            array_merge($oldData, ['password' => '[hidden]']),
            array_merge($user->fresh()->toArray(), ['password' => '[hidden]'])
        );

        return $this->success('User updated', $user->fresh());
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->id === auth()->id()) {
            return $this->error('Cannot delete your own account', 422);
        }

        $oldData = $user->toArray();
        $user->delete();

        $this->activityLog->logDelete('users', array_merge($oldData, ['password' => '[hidden]']));

        return $this->success('User deleted');
    }
}
