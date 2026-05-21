<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'superadmin@omara.local'],
            [
                'name'      => 'Super Admin',
                'password'  => Hash::make('Admin@12345', ['rounds' => 12]),
                'role'      => 'super_admin',
                'is_active' => true,
            ]
        );
    }
}
