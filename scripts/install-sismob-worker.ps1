param(
  [Parameter(Mandatory=$true)][string]$WorkerId,
  [Parameter(Mandatory=$true)][string]$WorkerSecret,
  [Parameter(Mandatory=$true)][string]$SupabaseUrl,
  [Parameter(Mandatory=$true)][string]$AnonKey,
  [Parameter(Mandatory=$true)][string]$SismobUser,
  [Parameter(Mandatory=$true)][securestring]$SismobPassword
)
$ErrorActionPreference='Stop'
$project=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$serviceDir=Join-Path $project 'local-services'
$config=@{worker_id=$WorkerId;worker_secret=$WorkerSecret;function_url="$SupabaseUrl/functions/v1/sismob-worker";anon_key=$AnonKey;role='RESERVE';priority=2}|ConvertTo-Json
[IO.File]::WriteAllText((Join-Path $serviceDir 'worker-config.json'),$config,[Text.UTF8Encoding]::new($false))
$credential=@{username=$SismobUser;password=($SismobPassword|ConvertFrom-SecureString)}|ConvertTo-Json
[IO.File]::WriteAllText((Join-Path $serviceDir 'worker-credentials.dpapi'),$credential,[Text.UTF8Encoding]::new($false))
$action=New-ScheduledTaskAction -Execute (Get-Command node.exe).Source -Argument 'scripts/start-local.mjs' -WorkingDirectory $project
$trigger=New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings=New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask -TaskName 'GestaoEmendas-SISMOB-Reserva' -Action $action -Trigger $trigger -Settings $settings -Description 'Agente reserva da frota SISMOB' -Force | Out-Null
Write-Output 'Agente reserva instalado e protegido pelo Windows.'
