<?php

namespace Database\Seeders;

use App\Models\Diagnosis;
use Illuminate\Database\Seeder;

class DiagnosisICD10Seeder extends Seeder
{
    public function run(): void
    {
        $diagnoses = [
            // A — Infeksi tertentu dan penyakit parasit
            ['code' => 'A00', 'name' => 'Kolera',                               'category' => 'A00-B99'],
            ['code' => 'A01', 'name' => 'Demam tifoid dan paratifoid',           'category' => 'A00-B99'],
            ['code' => 'A09', 'name' => 'Diare dan gastroenteritis',             'category' => 'A00-B99'],
            ['code' => 'A15', 'name' => 'Tuberkulosis paru',                     'category' => 'A00-B99'],
            ['code' => 'A37', 'name' => 'Pertusis (batuk rejan)',                'category' => 'A00-B99'],
            ['code' => 'A90', 'name' => 'Demam dengue',                          'category' => 'A00-B99'],
            ['code' => 'A91', 'name' => 'Demam berdarah dengue',                 'category' => 'A00-B99'],

            // B — Infeksi virus dan penyakit parasit lainnya
            ['code' => 'B01', 'name' => 'Cacar air (Varisela)',                  'category' => 'A00-B99'],
            ['code' => 'B05', 'name' => 'Campak (Morbili)',                      'category' => 'A00-B99'],
            ['code' => 'B06', 'name' => 'Rubella',                               'category' => 'A00-B99'],
            ['code' => 'B15', 'name' => 'Hepatitis A akut',                      'category' => 'A00-B99'],
            ['code' => 'B16', 'name' => 'Hepatitis B akut',                      'category' => 'A00-B99'],
            ['code' => 'B19', 'name' => 'Hepatitis virus tidak spesifik',        'category' => 'A00-B99'],
            ['code' => 'B34', 'name' => 'Infeksi virus, tidak spesifik',         'category' => 'A00-B99'],

            // E — Penyakit endokrin, nutrisi dan metabolik
            ['code' => 'E10', 'name' => 'Diabetes melitus tipe 1',               'category' => 'E00-E90'],
            ['code' => 'E11', 'name' => 'Diabetes melitus tipe 2',               'category' => 'E00-E90'],
            ['code' => 'E14', 'name' => 'Diabetes melitus, tidak spesifik',      'category' => 'E00-E90'],
            ['code' => 'E66', 'name' => 'Obesitas',                              'category' => 'E00-E90'],
            ['code' => 'E78', 'name' => 'Gangguan metabolisme lipoprotein',      'category' => 'E00-E90'],

            // I — Penyakit sistem sirkulasi
            ['code' => 'I10', 'name' => 'Hipertensi esensial (primer)',          'category' => 'I00-I99'],
            ['code' => 'I11', 'name' => 'Penyakit jantung hipertensif',          'category' => 'I00-I99'],
            ['code' => 'I20', 'name' => 'Angina pektoris',                       'category' => 'I00-I99'],
            ['code' => 'I21', 'name' => 'Infark miokard akut',                   'category' => 'I00-I99'],
            ['code' => 'I50', 'name' => 'Gagal jantung',                         'category' => 'I00-I99'],
            ['code' => 'I63', 'name' => 'Infark serebral (stroke iskemik)',       'category' => 'I00-I99'],

            // J — Penyakit sistem pernapasan
            ['code' => 'J00', 'name' => 'Nasofaringitis akut (common cold)',     'category' => 'J00-J99'],
            ['code' => 'J02', 'name' => 'Faringitis akut',                       'category' => 'J00-J99'],
            ['code' => 'J03', 'name' => 'Tonsilitis akut',                       'category' => 'J00-J99'],
            ['code' => 'J06', 'name' => 'ISPA akut atas, tidak spesifik',        'category' => 'J00-J99'],
            ['code' => 'J18', 'name' => 'Pneumonia, tidak spesifik',             'category' => 'J00-J99'],
            ['code' => 'J20', 'name' => 'Bronkitis akut',                        'category' => 'J00-J99'],
            ['code' => 'J45', 'name' => 'Asma',                                  'category' => 'J00-J99'],

            // K — Penyakit sistem pencernaan
            ['code' => 'K05', 'name' => 'Gingivitis dan penyakit periodontal',   'category' => 'K00-K93'],
            ['code' => 'K21', 'name' => 'Penyakit refluks gastroesofagus (GERD)','category' => 'K00-K93'],
            ['code' => 'K25', 'name' => 'Ulkus lambung',                         'category' => 'K00-K93'],
            ['code' => 'K29', 'name' => 'Gastritis dan duodenitis',              'category' => 'K00-K93'],
            ['code' => 'K37', 'name' => 'Apendisitis, tidak spesifik',           'category' => 'K00-K93'],
            ['code' => 'K59', 'name' => 'Gangguan fungsi usus (konstipasi, dll)','category' => 'K00-K93'],

            // L — Penyakit kulit dan jaringan subkutan
            ['code' => 'L20', 'name' => 'Dermatitis atopik',                    'category' => 'L00-L99'],
            ['code' => 'L30', 'name' => 'Dermatitis lainnya',                   'category' => 'L00-L99'],
            ['code' => 'L50', 'name' => 'Urtikaria',                             'category' => 'L00-L99'],

            // M — Penyakit sistem muskuloskeletal
            ['code' => 'M10', 'name' => 'Gout',                                  'category' => 'M00-M99'],
            ['code' => 'M54', 'name' => 'Nyeri punggung (dorsalgia)',            'category' => 'M00-M99'],
            ['code' => 'M79', 'name' => 'Reumatisme, tidak spesifik',            'category' => 'M00-M99'],

            // N — Penyakit sistem genitourinaria
            ['code' => 'N17', 'name' => 'Gagal ginjal akut',                    'category' => 'N00-N99'],
            ['code' => 'N18', 'name' => 'Gagal ginjal kronik',                  'category' => 'N00-N99'],
            ['code' => 'N39', 'name' => 'Gangguan saluran kemih, tidak spesifik','category' => 'N00-N99'],

            // R — Gejala, tanda, dan temuan klinis abnormal
            ['code' => 'R00', 'name' => 'Kelainan denyut jantung',               'category' => 'R00-R99'],
            ['code' => 'R05', 'name' => 'Batuk',                                 'category' => 'R00-R99'],
            ['code' => 'R06', 'name' => 'Kelainan pernapasan',                   'category' => 'R00-R99'],
            ['code' => 'R07', 'name' => 'Nyeri tenggorokan dan dada',            'category' => 'R00-R99'],
            ['code' => 'R10', 'name' => 'Nyeri perut dan panggul',               'category' => 'R00-R99'],
            ['code' => 'R50', 'name' => 'Demam tidak diketahui penyebabnya',     'category' => 'R00-R99'],
            ['code' => 'R51', 'name' => 'Sakit kepala',                          'category' => 'R00-R99'],
            ['code' => 'R73', 'name' => 'Glukosa darah meningkat',               'category' => 'R00-R99'],

            // Z — Faktor yang mempengaruhi status kesehatan
            ['code' => 'Z00', 'name' => 'Pemeriksaan umum (general check-up)',   'category' => 'Z00-Z99'],
            ['code' => 'Z13', 'name' => 'Skrining gangguan lainnya',             'category' => 'Z00-Z99'],
            ['code' => 'Z76', 'name' => 'Kontak dengan layanan kesehatan (lain)', 'category' => 'Z00-Z99'],
        ];

        foreach ($diagnoses as $d) {
            Diagnosis::firstOrCreate(['code' => $d['code']], $d);
        }
    }
}
