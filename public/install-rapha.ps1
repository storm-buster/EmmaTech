<#
.SYNOPSIS
  EmmaTech RAPHA Windows Agent installer (customer-facing bootstrapper).

.DESCRIPTION
  Installs and enrolls the RAPHA Windows Agent entirely through EmmaTech — the
  customer never needs GitHub. This bootstrapper:
    1. Validates the Windows environment (64-bit, Administrator).
    2. Downloads the pinned, version-locked RAPHA Agent package from
       EmmaTech-controlled storage (Vercel Blob) over HTTPS.
    3. Verifies the package SHA-256 BEFORE extraction and fails closed on any
       mismatch.
    4. Extracts the package and uses its BUNDLED Python + WinSW 2.12.0.
    5. Enrolls the machine using ONLY a one-time enrollment token, passed to the
       agent via STDIN (never on a command line, in a URL, in config, or in logs).
    6. Installs and starts the RAPHA Windows service (WinSW) and verifies health.

  The ONLY provisioning secret is the enrollment token. This script never uses a
  RAPHA service token, EmmaTech credentials, or any GitHub credential, and never
  contains a GitHub URL.

  If -EnrollmentToken is not supplied, the script securely prompts for it with a
  no-echo prompt, so the token is never placed on the command line or in shell
  history.

.EXAMPLE
  # Download from EmmaTech, then run (you will be prompted for the token):
  Invoke-WebRequest https://emmatech.in/install-rapha.ps1 -OutFile install-rapha.ps1
  .\install-rapha.ps1 -SensorName "WEB-SERVER-01"
#>
[CmdletBinding()]
param(
    # One-time enrollment token (renr_...). If omitted, prompted securely (no echo).
    [string] $EnrollmentToken,

    # RAPHA control-plane base URL. Defaults to EmmaTech's production RAPHA API.
    [string] $BaseUrl = 'https://rapha.emmatech.in',

    # Friendly server/sensor name shown in the RAPHA Console. Defaults to hostname.
    [string] $SensorName,

    # Offline/testing overrides. Not needed for normal customer installs.
    [string] $PackagePath,
    [string] $ExpectedSha256,

    [string] $InstallDir = (Join-Path $env:ProgramFiles 'RAPHA\Agent'),
    [string] $DataDir    = (Join-Path $env:ProgramData 'RAPHA'),
    [string] $PythonExe,
    [string] $ServiceAccount = 'NT AUTHORITY\LocalService',
    [int]    $IngestIntervalSeconds = 60,
    [int]    $HealthTimeoutSeconds = 120,

    [switch] $EnableNetworkSensor,
    [switch] $SkipService   # enroll + configure only (no service) — testing
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
# Enforce modern TLS for all downloads / API calls.
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13 } catch { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 }

$script:ServiceId       = 'RAPHAAgent'
$script:LogDir          = Join-Path $DataDir 'logs'
$script:ConfigPath      = Join-Path $DataDir 'agent-config.json'
$script:IdempotencyPath = Join-Path $DataDir 'install-idempotency.key'

# --------------------------------------------------------------------------- #
# Pinned RAPHA Windows Agent v1.0.1 — EmmaTech-controlled distribution.
# The package is hosted in EmmaTech's public Vercel Blob (NOT GitHub). The
# SHA-256 below is the authoritative trust anchor and is verified before the
# archive is ever extracted. This must match public/rapha-agent-manifest.json.
$script:PinnedZipUrl    = 'https://qpbd1jhpvo1xlmt2.public.blob.vercel-storage.com/rapha-agent-1.0.1-windows.zip'
$script:PinnedZipSha256 = 'd34f01fb12c0071a0f15f754f988119c2e5a33f4be8956feba87cdf8de40ba81'

if (-not (Test-Path 'variable:script:RaphaDotSource')) { $script:RaphaDotSource = $false }

# --------------------------------------------------------------------------- #
# Logging (never logs the token or credential)
# --------------------------------------------------------------------------- #
function Write-RaphaLog {
    param([string] $Message, [ValidateSet('INFO','WARN','ERROR','STEP')] [string] $Level = 'INFO')
    $ts = (Get-Date).ToString('s')
    $line = "$ts [$Level] $Message"
    Write-Host $line
    try {
        if (-not (Test-Path $script:LogDir)) { New-Item -ItemType Directory -Force -Path $script:LogDir | Out-Null }
        Add-Content -Path (Join-Path $script:LogDir 'install.log') -Value $line -Encoding UTF8
    } catch { }
}

# --------------------------------------------------------------------------- #
# Pure helpers (unit-testable)
# --------------------------------------------------------------------------- #
function Test-EnrollmentTokenFormat {
    param([string] $Token)
    return ($Token -match '^renr_[A-Za-z0-9_\-]{20,}$')
}

function Test-SecureBaseUrl {
    param([string] $Url)
    return ($Url -match '^https://[^/]+')
}

function Test-SensorNameValid {
    param([string] $Name)
    if ([string]::IsNullOrWhiteSpace($Name)) { return $true }  # optional; hostname default
    return ($Name -match '^[A-Za-z0-9_.\-]{1,200}$')
}

function Get-SafeSensorName {
    param([string] $Name)
    if ([string]::IsNullOrWhiteSpace($Name)) { $Name = $env:COMPUTERNAME }
    $clean = ($Name -replace '[^A-Za-z0-9_.\-]', '')
    if ([string]::IsNullOrWhiteSpace($clean)) { $clean = 'rapha-sensor' }
    return $clean.Substring(0, [Math]::Min(200, $clean.Length))
}

function Get-InstallIdempotencyKey {
    param([string] $Path)
    if (Test-Path $Path) { return (Get-Content -Path $Path -Raw).Trim() }
    $guid = $null
    try { $guid = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Cryptography' -Name MachineGuid -ErrorAction Stop).MachineGuid } catch { }
    if (-not $guid) { $guid = [guid]::NewGuid().ToString() }
    $key = "install-$($env:COMPUTERNAME)-$guid"
    $dir = Split-Path -Parent $Path
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    Set-Content -Path $Path -Value $key -Encoding UTF8
    return $key
}

function Test-FileSha256 {
    param([string] $Path, [string] $Expected)
    if ([string]::IsNullOrWhiteSpace($Expected)) { return $false }  # fail closed: never skip
    $actual = (Get-FileHash -Path $Path -Algorithm SHA256).Hash.ToLower()
    return ($actual -eq $Expected.Trim().ToLower())
}

function Test-IsAdministrator {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $p = New-Object Security.Principal.WindowsPrincipal($id)
    return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Resolve-PackageSource {
    # Precedence: (1) -PackagePath (local, testing), else (2) pinned EmmaTech Blob
    # URL. SHA-256 is ALWAYS the pinned value unless an explicit override is given
    # for a local package — it is never empty, so integrity is never skippable.
    param([string] $PackagePath, [string] $ExpectedSha256)
    $override = if (-not [string]::IsNullOrWhiteSpace($ExpectedSha256)) { $ExpectedSha256.Trim().ToLower() } else { $null }
    if ($PackagePath) {
        $eff = if ($override) { $override } else { $script:PinnedZipSha256 }
        return [pscustomobject]@{ Mode = 'local'; Url = $null; LocalPath = $PackagePath; ExpectedSha = $eff }
    }
    return [pscustomobject]@{ Mode = 'blob'; Url = $script:PinnedZipUrl; LocalPath = $null; ExpectedSha = $script:PinnedZipSha256 }
}

function Resolve-PythonExe {
    param([string] $Explicit, [string] $InstallDir)
    if ($Explicit) { return $Explicit }
    $bundled = Join-Path $InstallDir 'python\python.exe'
    if (Test-Path $bundled) { return $bundled }
    throw "Bundled Python runtime not found at <InstallDir>\python\python.exe. The RAPHA v1.0.1 package includes it; re-download and retry."
}

# --------------------------------------------------------------------------- #
# Steps
# --------------------------------------------------------------------------- #
function Read-EnrollmentTokenIfNeeded {
    # Secure, no-echo prompt when the token was not supplied on the command line,
    # so it never appears in shell history or the process command line.
    if (-not [string]::IsNullOrWhiteSpace($EnrollmentToken)) { return $EnrollmentToken }
    $secure = Read-Host -Prompt 'Paste your RAPHA enrollment token (input hidden)' -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

function Invoke-EnvironmentChecks {
    param([string] $Token)
    Write-RaphaLog -Level STEP -Message "Checking Windows environment"
    if ([Environment]::OSVersion.Platform -ne 'Win32NT') { throw "Windows is required." }
    if (-not [Environment]::Is64BitOperatingSystem) { Write-RaphaLog -Level WARN -Message "Non-64-bit OS detected." }
    if (-not (Test-IsAdministrator)) { throw "Administrator privileges are required to install a Windows service. Re-run PowerShell as Administrator." }
    if (-not (Test-EnrollmentTokenFormat -Token $Token)) { throw "Malformed enrollment token. Generate a new one in the EmmaTech dashboard." }
    if (-not (Test-SecureBaseUrl -Url $BaseUrl)) { throw "RAPHA base URL must be HTTPS." }
    if (-not (Test-SensorNameValid -Name $SensorName)) { throw "Invalid server name (allowed: letters, digits, . _ - up to 200 chars)." }
}

function Test-Connectivity {
    Write-RaphaLog -Level STEP -Message "Checking connectivity to RAPHA"
    $healthUrl = ($BaseUrl.TrimEnd('/')) + '/api/v1/health'
    try {
        $resp = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 15
        if ($resp.StatusCode -ne 200) { throw "health $($resp.StatusCode)" }
    } catch {
        throw "Cannot reach RAPHA at $healthUrl : $($_.Exception.Message)"
    }
}

function Get-AgentPackage {
    param([string] $StageDir)
    Write-RaphaLog -Level STEP -Message "Acquiring RAPHA agent package v1.0.1"
    $dest = Join-Path $StageDir 'rapha-agent.zip'
    $src = Resolve-PackageSource -PackagePath $PackagePath -ExpectedSha256 $ExpectedSha256
    if ($src.Mode -eq 'local') {
        if (-not (Test-Path $src.LocalPath)) { throw "Package not found: $($src.LocalPath)" }
        Copy-Item -Path $src.LocalPath -Destination $dest -Force
    } else {
        Write-RaphaLog -Message "Downloading agent package from EmmaTech storage"
        Invoke-WebRequest -Uri $src.Url -OutFile $dest -UseBasicParsing -TimeoutSec 600
    }
    # Verify SHA-256 BEFORE extraction. Fail closed on mismatch.
    if (-not (Test-FileSha256 -Path $dest -Expected $src.ExpectedSha)) {
        throw "Package checksum verification FAILED (expected $($src.ExpectedSha)). Aborting before extraction."
    }
    Write-RaphaLog -Message "Package checksum verified (SHA-256 OK)"
    return $dest
}

function Remove-ExistingService {
    if ($SkipService) { return }
    $svc = Get-Service -Name $script:ServiceId -ErrorAction SilentlyContinue
    if (-not $svc) { return }
    Write-RaphaLog -Level STEP -Message "Existing $($script:ServiceId) found; stopping + removing for a clean reinstall (credential/identity preserved)"
    $winsw = Join-Path $InstallDir 'winsw.exe'
    $xml   = Join-Path $InstallDir 'winsw.xml'
    if ((Test-Path $winsw) -and (Test-Path $xml)) {
        & $winsw stop 2>$null
        & $winsw uninstall 2>$null
    } else {
        try { Stop-Service -Name $script:ServiceId -Force -ErrorAction SilentlyContinue } catch { }
        & sc.exe delete $script:ServiceId | Out-Null
    }
    for ($i = 0; $i -lt 15 -and (Get-Service -Name $script:ServiceId -ErrorAction SilentlyContinue); $i++) { Start-Sleep -Seconds 1 }
}

function Install-AgentFiles {
    param([string] $ZipPath)
    Write-RaphaLog -Level STEP -Message "Installing agent files to $InstallDir"
    if (-not (Test-Path $InstallDir)) { New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null }
    Expand-Archive -Path $ZipPath -DestinationPath $InstallDir -Force
    foreach ($d in @($DataDir, $script:LogDir, (Join-Path $DataDir 'state'), (Join-Path $DataDir 'secrets'))) {
        if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null }
    }
}

function Invoke-Provisioning {
    param([string] $Token)
    Write-RaphaLog -Level STEP -Message "Enrolling machine (token via stdin; never on command line)"
    $py = Resolve-PythonExe -Explicit $PythonExe -InstallDir $InstallDir
    $idem = Get-InstallIdempotencyKey -Path $script:IdempotencyPath
    $sensor = Get-SafeSensorName -Name $SensorName
    $args = @('-m','rapha_agent.provision','--base-url',$BaseUrl,'--config-path',$script:ConfigPath,
              '--secret-dir',(Join-Path $DataDir 'secrets'),'--sensor-name',$sensor,
              '--idempotency-key',$idem,'--interval',"$IngestIntervalSeconds")
    if ($EnableNetworkSensor) { $args += '--enable-network-sensor' }

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $py
    foreach ($a in $args) { $psi.ArgumentList.Add($a) }
    $psi.WorkingDirectory = $InstallDir
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.EnvironmentVariables['PYTHONPATH'] = $InstallDir
    $proc = [System.Diagnostics.Process]::Start($psi)
    $proc.StandardInput.WriteLine($Token)   # token ONLY via stdin
    $proc.StandardInput.Close()
    $out = $proc.StandardOutput.ReadToEnd()
    $err = $proc.StandardError.ReadToEnd()
    $proc.WaitForExit()
    if ($proc.ExitCode -ne 0) {
        Write-RaphaLog -Level ERROR -Message "Enrollment failed (exit $($proc.ExitCode)): $err"
        throw "Enrollment failed."
    }
    $result = $out | ConvertFrom-Json
    Write-RaphaLog -Message "Enrolled sensor_id=$($result.sensor_id) tenant_id=$($result.tenant_id) already_enrolled=$($result.already_enrolled)"
    return $result
}

function Split-ServiceAccount {
    param([Parameter(Mandatory = $true)] [string] $Account)
    $a = $Account.Trim()
    if ([string]::IsNullOrWhiteSpace($a)) { throw "Service account must not be empty." }
    $bs = ($a.ToCharArray() | Where-Object { $_ -eq '\' } | Measure-Object).Count
    if ($bs -eq 0) { return [pscustomobject]@{ Domain = ''; User = $a } }
    if ($bs -gt 1) { throw "Malformed service account '$Account'." }
    $idx = $a.IndexOf('\')
    return [pscustomobject]@{ Domain = $a.Substring(0, $idx).Trim(); User = $a.Substring($idx + 1).Trim() }
}

function New-WinswConfigXml {
    param([string] $PythonExe, [string] $InstallDir, [string] $ConfigPath, [string] $LogDir,
          [string] $ServiceAccount, [string] $TemplatePath)
    $acct = Split-ServiceAccount -Account $ServiceAccount
    $tpl = Get-Content -Path $TemplatePath -Raw -ErrorAction Stop
    return $tpl.Replace('@@PYTHON_EXE@@', $PythonExe).Replace('@@INSTALL_DIR@@', $InstallDir).
               Replace('@@CONFIG_PATH@@', $ConfigPath).Replace('@@LOG_DIR@@', $LogDir).
               Replace('@@SERVICE_ACCOUNT_DOMAIN@@', $acct.Domain).
               Replace('@@SERVICE_ACCOUNT_USER@@', $acct.User)
}

function Install-Service {
    if ($SkipService) { Write-RaphaLog -Message "SkipService set; not installing service"; return }
    Write-RaphaLog -Level STEP -Message "Installing Windows service ($script:ServiceId)"
    $py = Resolve-PythonExe -Explicit $PythonExe -InstallDir $InstallDir
    $winsw = Join-Path $InstallDir 'winsw.exe'
    if (-not (Test-Path $winsw)) { throw "Bundled winsw.exe not found in the package. Re-download and retry." }
    $tplPath = Join-Path $InstallDir 'windows\rapha-agent.winsw.xml.template'
    $xml = New-WinswConfigXml -PythonExe $py -InstallDir $InstallDir -ConfigPath $script:ConfigPath `
                              -LogDir $script:LogDir -ServiceAccount $ServiceAccount -TemplatePath $tplPath
    # WinSW v2 auto-discovers <exe-basename>.xml beside the exe.
    Set-Content -Path (Join-Path $InstallDir 'winsw.xml') -Value $xml -Encoding UTF8
    & $winsw install
    if ($LASTEXITCODE -ne 0) { throw "Service install failed (winsw install exit $LASTEXITCODE)." }
    & $winsw start
    Write-RaphaLog -Message "Service installed and start requested"
}

function Test-ServiceHealth {
    if ($SkipService) { return $true }
    Write-RaphaLog -Level STEP -Message "Waiting for agent health"
    $py = Resolve-PythonExe -Explicit $PythonExe -InstallDir $InstallDir
    $probe = "import sys; sys.path.insert(0, r'$InstallDir'); " +
             "from rapha_agent.health import is_healthy, default_heartbeat_path; " +
             "sys.exit(0 if is_healthy(default_heartbeat_path()) else 1)"
    $deadline = (Get-Date).AddSeconds($HealthTimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $svc = Get-Service -Name $script:ServiceId -ErrorAction SilentlyContinue
        if ($svc -and $svc.Status -eq 'Running') {
            & $py -c $probe 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) { Write-RaphaLog -Message "Health check passed"; return $true }
        }
        Start-Sleep -Seconds 5
    }
    return $false
}

function Invoke-Rollback {
    param([string] $Reason)
    Write-RaphaLog -Level ERROR -Message "Rolling back: $Reason"
    try {
        $winsw = Join-Path $InstallDir 'winsw.exe'
        if ((Test-Path $winsw) -and (Test-Path (Join-Path $InstallDir 'winsw.xml'))) {
            & $winsw stop 2>$null
            & $winsw uninstall 2>$null
        }
    } catch { }
    Write-RaphaLog -Level WARN -Message "Rollback complete. See $($script:LogDir)\install.log"
}

# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
function Invoke-Main {
    $token = Read-EnrollmentTokenIfNeeded
    $stage = Join-Path ([IO.Path]::GetTempPath()) ("rapha-install-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Force -Path $stage | Out-Null
    try {
        Invoke-EnvironmentChecks -Token $token
        Test-Connectivity
        Remove-ExistingService
        $zip = Get-AgentPackage -StageDir $stage
        Install-AgentFiles -ZipPath $zip
        $result = Invoke-Provisioning -Token $token
        $token = $null   # discard token from memory as soon as enrollment returns
        if (-not $SkipService) {
            Install-Service
            if (-not (Test-ServiceHealth)) { throw "Service health check failed." }
        }
        Write-RaphaLog -Level STEP -Message "RAPHA agent installation SUCCESSFUL (sensor_id=$($result.sensor_id)). It should appear in your EmmaTech Console shortly."
    } catch {
        Invoke-Rollback -Reason $_.Exception.Message
        throw
    } finally {
        $token = $null
        try { Remove-Item -Recurse -Force $stage -ErrorAction SilentlyContinue } catch { }
    }
}

if (-not $script:RaphaDotSource) {
    try { Invoke-Main; exit 0 }
    catch { Write-RaphaLog -Level ERROR -Message ("Installation failed: " + $_.Exception.Message); exit 1 }
}
