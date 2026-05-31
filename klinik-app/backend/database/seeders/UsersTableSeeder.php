<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersTableSeeder extends Seeder
{
    public function run(): void
    {
        // Super Admin
        User::updateOrCreate(
            ['email' => 'admin@klinik.com'],
            [
                'name' => 'Super Admin',
                'email' => 'admin@klinik.com',
                'username' => 'superadmin',
                'password' => Hash::make('admin123'),
                'role' => 'super_admin',
                'status' => 'active',
            ]
        );

        // Sample pemilik
        User::updateOrCreate(
            ['email' => 'pemilik@klinik.com'],
            [
                'name' => 'Pemilik Klinik',
                'email' => 'pemilik@klinik.com',
                'username' => 'pemilik',
                'password' => Hash::make('pemilik123'),
                'role' => 'pemilik',
                'status' => 'active',
            ]
        );

        // Sample admin
        User::updateOrCreate(
            ['email' => 'admin2@klinik.com'],
            [
                'name' => 'Admin Klinik',
                'email' => 'admin2@klinik.com',
                'username' => 'admin',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'status' => 'active',
            ]
        );
    }
}
