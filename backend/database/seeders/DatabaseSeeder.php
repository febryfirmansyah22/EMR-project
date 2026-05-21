<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            MasterDataSeeder::class,
            DiagnosisICD10Seeder::class,
            PatientSeeder::class,
            VisitSeeder::class,
        ]);
    }
}
