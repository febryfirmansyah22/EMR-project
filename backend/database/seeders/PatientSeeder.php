<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Services\PatientService;
use Illuminate\Database\Seeder;

class PatientSeeder extends Seeder
{
    public function __construct(private readonly PatientService $service) {}

    public function run(): void
    {
        $patients = [
            [
                'name'           => 'Budi Santoso',
                'nik'            => '3271010101800001',
                'birth_date'     => '1980-01-01',
                'birth_place'    => 'Bandung',
                'gender'         => 'laki-laki',
                'blood_type'     => 'O',
                'address'        => 'Jl. Merdeka No. 1, Bandung',
                'phone'          => '081234567890',
                'email'          => 'budi.santoso@email.com',
                'religion'       => 'Islam',
                'marital_status' => 'menikah',
                'occupation'     => 'Pegawai Swasta',
                'insurance_type' => 'bpjs',
                'insurance_number' => '0001234567890',
                'emergency_contact' => [
                    'name'         => 'Siti Santoso',
                    'relationship' => 'Istri',
                    'phone'        => '081234567891',
                ],
            ],
            [
                'name'           => 'Siti Rahayu',
                'nik'            => '3271015505850002',
                'birth_date'     => '1985-05-15',
                'birth_place'    => 'Jakarta',
                'gender'         => 'perempuan',
                'blood_type'     => 'A',
                'address'        => 'Jl. Sudirman No. 45, Jakarta',
                'phone'          => '082345678901',
                'email'          => 'siti.rahayu@email.com',
                'religion'       => 'Islam',
                'marital_status' => 'menikah',
                'occupation'     => 'Ibu Rumah Tangga',
                'insurance_type' => 'bpjs',
                'insurance_number' => '0009876543210',
                'emergency_contact' => [
                    'name'         => 'Ahmad Rahayu',
                    'relationship' => 'Suami',
                    'phone'        => '082345678902',
                ],
            ],
            [
                'name'           => 'Ahmad Fauzi',
                'nik'            => '3271012012900003',
                'birth_date'     => '1990-12-20',
                'birth_place'    => 'Surabaya',
                'gender'         => 'laki-laki',
                'blood_type'     => 'B',
                'address'        => 'Jl. Diponegoro No. 12, Surabaya',
                'phone'          => '083456789012',
                'religion'       => 'Islam',
                'marital_status' => 'belum_menikah',
                'occupation'     => 'Mahasiswa',
                'insurance_type' => 'umum',
                'emergency_contact' => [
                    'name'         => 'Fatimah Fauzi',
                    'relationship' => 'Ibu',
                    'phone'        => '083456789013',
                ],
            ],
            [
                'name'           => 'Maria Dewi',
                'nik'            => '3271011103750004',
                'birth_date'     => '1975-03-11',
                'birth_place'    => 'Yogyakarta',
                'gender'         => 'perempuan',
                'blood_type'     => 'AB',
                'address'        => 'Jl. Malioboro No. 88, Yogyakarta',
                'phone'          => '084567890123',
                'email'          => 'maria.dewi@email.com',
                'religion'       => 'Kristen',
                'marital_status' => 'menikah',
                'occupation'     => 'Guru',
                'insurance_type' => 'asuransi_swasta',
                'insurance_number' => 'AS-2024-00123',
                'emergency_contact' => [
                    'name'         => 'Yohanes Dewi',
                    'relationship' => 'Suami',
                    'phone'        => '084567890124',
                ],
            ],
            [
                'name'           => 'Hendra Wijaya',
                'nik'            => '3271011507950005',
                'birth_date'     => '1995-07-15',
                'birth_place'    => 'Medan',
                'gender'         => 'laki-laki',
                'blood_type'     => 'O',
                'address'        => 'Jl. Asia No. 5, Medan',
                'phone'          => '085678901234',
                'religion'       => 'Buddha',
                'marital_status' => 'belum_menikah',
                'occupation'     => 'Wirausaha',
                'insurance_type' => 'umum',
            ],
        ];

        foreach ($patients as $data) {
            // Cek apakah sudah ada berdasarkan NIK (skip duplikat)
            $existing = Patient::whereRaw('1=1')->get()
                ->first(fn ($p) => $p->nik === $data['nik']);

            if (!$existing) {
                $this->service->store($data);
            }
        }
    }
}
