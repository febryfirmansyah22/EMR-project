<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Poli;
use App\Models\User;
use App\Services\VisitService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Auth;

class VisitSeeder extends Seeder
{
    public function __construct(private readonly VisitService $service) {}

    public function run(): void
    {
        // Login sebagai super_admin agar audit log terisi user_id
        $admin   = User::where('role', 'super_admin')->first();
        $patients = Patient::where('is_active', true)->get();
        $polis    = Poli::all();
        $doctor   = Doctor::where('is_active', true)->first();

        if ($patients->isEmpty() || $polis->isEmpty()) return;

        Auth::login($admin);

        $scenarios = [
            // Kunjungan hari ini — berbagai status
            ['patient' => 0, 'poli' => 0, 'status' => 'terdaftar',                  'complaint' => 'Demam dan batuk pilek sejak 3 hari'],
            ['patient' => 1, 'poli' => 0, 'status' => 'menunggu_pemeriksaan_awal',   'complaint' => 'Sakit kepala dan pusing'],
            ['patient' => 2, 'poli' => 0, 'status' => 'menunggu_dokter',             'complaint' => 'Kontrol tekanan darah'],
            ['patient' => 3, 'poli' => 0, 'status' => 'sedang_diperiksa',            'complaint' => 'Nyeri perut bagian bawah'],
            ['patient' => 4, 'poli' => 1, 'status' => 'terdaftar',                  'complaint' => 'Kontrol rutin diabetes'],
        ];

        foreach ($scenarios as $s) {
            $patient = $patients->get($s['patient']);
            $poli    = $polis->get($s['poli']);
            if (!$patient || !$poli) continue;

            $visit = $this->service->store([
                'patient_id' => $patient->id,
                'poli_id'    => $poli->id,
                'doctor_id'  => $doctor?->id,
                'complaint'  => $s['complaint'],
            ]);

            // Set ke status yang diinginkan (multi-step transitions)
            $this->advanceToStatus($visit, $s['status']);
        }

        Auth::logout();
    }

    private function advanceToStatus(\App\Models\Visit $visit, string $targetStatus): void
    {
        $flow = [
            'terdaftar',
            'menunggu_pemeriksaan_awal',
            'menunggu_dokter',
            'sedang_diperiksa',
            'menunggu_obat',
            'menunggu_pembayaran',
            'selesai',
        ];

        $currentIdx = array_search($visit->status, $flow);
        $targetIdx  = array_search($targetStatus, $flow);

        if ($currentIdx === false || $targetIdx === false || $targetIdx <= $currentIdx) return;

        for ($i = $currentIdx + 1; $i <= $targetIdx; $i++) {
            $visit = $this->service->updateStatus($visit, $flow[$i]);
        }
    }
}
