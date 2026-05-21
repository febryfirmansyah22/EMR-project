<?php

namespace Database\Seeders;

use App\Models\MedicalAction;
use App\Models\Medicine;
use App\Models\Poli;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // Poli
        $polis = [
            ['name' => 'Poli Umum',       'description' => 'Pelayanan kesehatan umum'],
            ['name' => 'Poli Anak',        'description' => 'Pelayanan kesehatan anak'],
            ['name' => 'Poli Gigi',        'description' => 'Pelayanan kesehatan gigi dan mulut'],
            ['name' => 'Poli Kebidanan',   'description' => 'Pelayanan kebidanan dan kandungan'],
            ['name' => 'Poli Mata',        'description' => 'Pelayanan kesehatan mata'],
        ];
        foreach ($polis as $p) {
            Poli::firstOrCreate(['name' => $p['name']], $p);
        }

        // Tindakan medis
        $actions = [
            ['name' => 'Konsultasi Dokter Umum',   'category' => 'konsultasi',     'price' => 50000],
            ['name' => 'Konsultasi Dokter Spesialis', 'category' => 'konsultasi',   'price' => 150000],
            ['name' => 'Injeksi / Suntik',          'category' => 'tindakan_minor', 'price' => 35000],
            ['name' => 'Pemasangan Infus',          'category' => 'tindakan_minor', 'price' => 75000],
            ['name' => 'Nebulisasi',                'category' => 'tindakan_minor', 'price' => 50000],
            ['name' => 'Pemeriksaan Gula Darah',    'category' => 'laboratorium',   'price' => 25000],
            ['name' => 'Pemeriksaan Asam Urat',     'category' => 'laboratorium',   'price' => 25000],
            ['name' => 'Pemeriksaan Kolesterol',    'category' => 'laboratorium',   'price' => 30000],
            ['name' => 'Hecting / Jahit Luka',      'category' => 'tindakan_minor', 'price' => 100000],
            ['name' => 'Perawatan Luka',            'category' => 'tindakan_minor', 'price' => 50000],
            ['name' => 'EKG / Rekam Jantung',       'category' => 'diagnostik',     'price' => 75000],
            ['name' => 'Surat Keterangan Sehat',    'category' => 'administrasi',   'price' => 25000],
        ];
        foreach ($actions as $a) {
            MedicalAction::firstOrCreate(['name' => $a['name']], $a);
        }

        // Obat dasar
        $medicines = [
            ['name' => 'Paracetamol 500mg',      'generic_name' => 'Paracetamol',    'unit' => 'tablet',  'category' => 'analgesik',    'price' => 500,   'stock' => 500, 'min_stock' => 50],
            ['name' => 'Amoxicillin 500mg',       'generic_name' => 'Amoxicillin',    'unit' => 'kapsul',  'category' => 'antibiotik',   'price' => 2000,  'stock' => 200, 'min_stock' => 30],
            ['name' => 'Ibuprofen 400mg',         'generic_name' => 'Ibuprofen',      'unit' => 'tablet',  'category' => 'analgesik',    'price' => 1500,  'stock' => 300, 'min_stock' => 30],
            ['name' => 'Antasida Doen',           'generic_name' => 'Antasida',       'unit' => 'tablet',  'category' => 'antasida',     'price' => 300,   'stock' => 400, 'min_stock' => 50],
            ['name' => 'CTM (Chlorpheniramine)',  'generic_name' => 'Chlorpheniramine','unit' => 'tablet', 'category' => 'antihistamin', 'price' => 500,   'stock' => 300, 'min_stock' => 30],
            ['name' => 'OBH Combi Batuk',         'generic_name' => 'Obat Batuk',     'unit' => 'botol',   'category' => 'antitusif',    'price' => 25000, 'stock' => 50,  'min_stock' => 10],
            ['name' => 'Vitamin C 500mg',         'generic_name' => 'Asam Askorbat',  'unit' => 'tablet',  'category' => 'vitamin',      'price' => 1000,  'stock' => 500, 'min_stock' => 50],
            ['name' => 'Metformin 500mg',         'generic_name' => 'Metformin HCl',  'unit' => 'tablet',  'category' => 'antidiabetes', 'price' => 1500,  'stock' => 200, 'min_stock' => 30],
            ['name' => 'Amlodipine 5mg',          'generic_name' => 'Amlodipine',     'unit' => 'tablet',  'category' => 'antihipertensi','price' => 2000, 'stock' => 200, 'min_stock' => 30],
            ['name' => 'Ringer Laktat 500ml',     'generic_name' => 'Ringer Laktat',  'unit' => 'botol',   'category' => 'infus',        'price' => 15000, 'stock' => 50,  'min_stock' => 10],
        ];
        foreach ($medicines as $m) {
            Medicine::firstOrCreate(['name' => $m['name']], $m);
        }
    }
}
