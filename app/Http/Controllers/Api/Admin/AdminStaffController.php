<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\Rider;
use App\Models\Driver;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AdminStaffController extends Controller
{
    public function index(): JsonResponse
    {
        $staff = User::whereHas('roles', fn($q) => $q->whereIn('name', [
            'super-admin', 'admin', 'operations', 'support',
            'finance', 'driver-reviewer', 'marketing',
        ]))->with('roles')->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => UserResource::collection($staff->items()),
                'meta' => [
                    'currentPage' => $staff->currentPage(),
                    'lastPage' => $staff->lastPage(),
                    'perPage' => $staff->perPage(),
                    'total' => $staff->total(),
                    'from' => $staff->firstItem() ?? 0,
                    'to' => $staff->lastItem() ?? 0,
                ],
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:admin,operations,support,finance,driver-reviewer,marketing',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'is_active' => true,
        ]);

        $role = Role::findOrCreate($validated['role'], 'web');
        $user->assignRole($role);
        $user->syncRolesColumn();

        return response()->json([
            'success' => true,
            'message' => 'Staff user created',
            'data' => new UserResource($user->load('roles')),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $user = User::with('roles')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new UserResource($user),
        ]);
    }

    public function update(int $id, Request $request): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'phone' => 'sometimes|string|max:20',
            'role' => 'sometimes|string|in:super-admin,admin,operations,support,finance,driver-reviewer,marketing',
        ]);

        if (isset($validated['name'])) $user->name = $validated['name'];
        if (isset($validated['email'])) $user->email = $validated['email'];
        if (isset($validated['phone'])) $user->phone = $validated['phone'];
        $user->save();

        if (isset($validated['role'])) {
            if ($user->hasRole('super-admin') && $validated['role'] !== 'super-admin') {
                $superAdminCount = User::role('super-admin')->count();
                if ($superAdminCount <= 1) {
                    return response()->json(['success' => false, 'message' => 'Cannot remove the last super-admin role'], 422);
                }
            }
            $user->syncRoles([$validated['role']]);
            $user->syncRolesColumn();
        }

        return response()->json([
            'success' => true,
            'message' => 'Staff user updated',
            'data' => new UserResource($user->fresh()->load('roles')),
        ]);
    }

    public function toggleActive(int $id, Request $request): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->hasRole('super-admin')) {
            return response()->json(['success' => false, 'message' => 'Cannot deactivate a super-admin'], 422);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => $user->is_active ? 'Staff user activated' : 'Staff user deactivated',
        ]);
    }

    public function roles(): JsonResponse
    {
        $roles = Role::with('permissions')->where('guard_name', 'web')->get()->map(fn($r) => [
            'id' => $r->id,
            'name' => $r->name,
            'guard_name' => $r->guard_name,
            'permissions' => $r->permissions->pluck('name'),
        ]);

        return response()->json([
            'success' => true,
            'data' => $roles,
        ]);
    }

    public function updateRolePermissions(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string',
        ]);

        $role = Role::findOrFail($id);

        if ($role->name === 'super-admin') {
            return response()->json(['success' => false, 'message' => 'super-admin permissions cannot be modified'], 422);
        }

        $role->syncPermissions($request->input('permissions'));

        return response()->json([
            'success' => true,
            'message' => 'Role permissions updated',
        ]);
    }

    public function permissions(): JsonResponse
    {
        $permissions = \Spatie\Permission\Models\Permission::where('guard_name', 'web')
            ->pluck('name');

        return response()->json([
            'success' => true,
            'data' => $permissions,
        ]);
    }
}
