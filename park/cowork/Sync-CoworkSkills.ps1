<#
.SYNOPSIS
    Downloads Claude Code skills from GitHub and packages them as ZIPs for Cowork Desktop import.

.DESCRIPTION
    Standalone PowerShell script -- no CC CLI, no git, no Syncthing needed.
    Downloads skills from a GitHub marketplace repo, generates individual ZIP files
    ready for upload via Cowork Desktop UI (Settings > Skills > Upload).

    First run: guided setup (repo, branch).
    Subsequent runs: detects version changes, regenerates only updated ZIPs.

.PARAMETER DryRun
    Show what would be packaged without making changes.

.PARAMETER Repo
    GitHub repo in owner/repo format. Default: digital-stoic-org/agent-skills

.PARAMETER Branch
    Git branch to pull from. Default: main

.PARAMETER Plugins
    Comma-separated list of plugins to package. Default: all.

.PARAMETER Skills
    Comma-separated list of specific skill names to package. Default: all.

.PARAMETER ListPlugins
    Show available plugins and skills without packaging.

.PARAMETER Force
    Re-download and repackage even if versions haven't changed.

.PARAMETER Reset
    Delete local config and cache, start fresh.

.PARAMETER Open
    Open the ZIPs output folder in Explorer after packaging.

.EXAMPLE
    .\Sync-CoworkSkills.ps1                          # First run = guided setup, then package all
    .\Sync-CoworkSkills.ps1 -DryRun                  # Preview what would be packaged
    .\Sync-CoworkSkills.ps1 -ListPlugins              # List available plugins and skills
    .\Sync-CoworkSkills.ps1 -Plugins dstoic,biz      # Package specific plugins only
    .\Sync-CoworkSkills.ps1 -Skills switch,troubleshoot,commit-repo  # Package specific skills
    .\Sync-CoworkSkills.ps1 -Force                    # Force repackage even if up to date
    .\Sync-CoworkSkills.ps1 -Open                     # Package and open output folder
    .\Sync-CoworkSkills.ps1 -Repo myorg/my-skills     # Use different marketplace repo
    .\Sync-CoworkSkills.ps1 -Reset                    # Clear config and cache
#>

param(
    [switch]$DryRun,
    [string]$Repo = "",
    [string]$Branch = "",
    [string]$Plugins = "",
    [string]$Skills = "",
    [switch]$ListPlugins,
    [switch]$Force,
    [switch]$Reset,
    [switch]$Open
)

$ErrorActionPreference = "Stop"
$script:CacheDir = Join-Path $env:USERPROFILE ".cowork-sync"
$script:ConfigPath = Join-Path $script:CacheDir "config.json"
$script:ZipsDir = Join-Path $script:CacheDir "zips"
$script:VersionsPath = Join-Path $script:CacheDir "versions.json"

# -- Helpers ---------------------------------------------------------------

function Write-Step($Icon, $Text) {
    Write-Host "  $Icon " -NoNewline
    Write-Host $Text
}

function Write-Header($Text) {
    Write-Host ""
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "  $('-' * $Text.Length)" -ForegroundColor DarkGray
}

function Load-Config {
    if (Test-Path $script:ConfigPath) {
        return Get-Content $script:ConfigPath -Raw | ConvertFrom-Json
    }
    return $null
}

function Save-Config($Config) {
    if (-not (Test-Path $script:CacheDir)) {
        New-Item -Path $script:CacheDir -ItemType Directory -Force | Out-Null
    }
    $Config | ConvertTo-Json -Depth 5 | Set-Content $script:ConfigPath -Encoding UTF8
}

function Load-Versions {
    if (Test-Path $script:VersionsPath) {
        return Get-Content $script:VersionsPath -Raw | ConvertFrom-Json
    }
    return [PSCustomObject]@{}
}

function Save-Versions($Versions) {
    $Versions | ConvertTo-Json -Depth 5 | Set-Content $script:VersionsPath -Encoding UTF8
}

function Download-RepoZip($RepoSlug, $BranchName) {
    $ZipUrl = "https://github.com/$RepoSlug/archive/refs/heads/$BranchName.zip"
    $ZipPath = Join-Path $script:CacheDir "repo.zip"
    $ExtractDir = Join-Path $script:CacheDir "repo"

    Write-Step "[DL]" "Downloading $RepoSlug@$BranchName..."

    if (Test-Path $ExtractDir) {
        Remove-Item $ExtractDir -Recurse -Force
    }

    try {
        Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing
    } catch {
        Write-Host "  [ERR] Download failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "     URL: $ZipUrl" -ForegroundColor DarkGray
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "     Check that repo '$RepoSlug' exists and branch '$BranchName' is correct." -ForegroundColor Yellow
        }
        exit 1
    }

    Write-Step "[OK]" "Extracting..."
    Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force

    # GitHub ZIPs extract to repo-branch/ subfolder
    $Inner = Get-ChildItem -Path $ExtractDir -Directory | Select-Object -First 1
    if (-not $Inner) {
        Write-Host "  [ERR] ZIP extraction produced no directory" -ForegroundColor Red
        exit 1
    }

    Remove-Item $ZipPath -Force
    return $Inner.FullName
}

function Read-Marketplace($RepoRoot) {
    $MarketplacePath = Join-Path $RepoRoot ".claude-plugin\marketplace.json"
    if (-not (Test-Path $MarketplacePath)) {
        Write-Host "  [ERR] No .claude-plugin/marketplace.json found in repo" -ForegroundColor Red
        Write-Host "     This doesn't look like a Claude Code marketplace repo." -ForegroundColor Yellow
        exit 1
    }
    return Get-Content $MarketplacePath -Raw | ConvertFrom-Json
}

function Parse-SkillFrontmatter($SkillMdPath) {
    $Content = Get-Content $SkillMdPath -Raw
    $Name = ""
    $Desc = ""

    if ($Content -match '(?s)^---\s*\n(.*?)\n---') {
        $Fm = $Matches[1]
        if ($Fm -match 'name:\s*(.+)') {
            $Name = $Matches[1].Trim().Trim('"').Trim("'")
        }
        if ($Fm -match 'description:\s*"([^"]+)"') {
            $Desc = $Matches[1].Trim()
        } elseif ($Fm -match "description:\s*'([^']+)'") {
            $Desc = $Matches[1].Trim()
        } elseif ($Fm -match 'description:\s*(.+)') {
            $Desc = $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
    return @{ Name = $Name; Description = $Desc }
}

function New-SkillZip($SkillSourceDir, $SkillName, $OutputDir) {
    $ZipPath = Join-Path $OutputDir "$SkillName.zip"

    if (Test-Path $ZipPath) {
        Remove-Item $ZipPath -Force
    }

    # Build ZIP with explicit relative entry paths using .NET API
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $Zip = [System.IO.Compression.ZipFile]::Open($ZipPath, 'Create')

    try {
        $Files = Get-ChildItem -Path $SkillSourceDir -Recurse -File
        foreach ($File in $Files) {
            # Entry path: SKILL.md (flat at root, no folder wrapper)
            $RelPath = $File.FullName.Substring($SkillSourceDir.Length + 1)
            $EntryName = $RelPath -replace '\\', '/'
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $Zip, $File.FullName, $EntryName
            ) | Out-Null
        }
    } finally {
        $Zip.Dispose()
    }

    return $ZipPath
}

# -- Reset -----------------------------------------------------------------

if ($Reset) {
    if (Test-Path $script:CacheDir) {
        Remove-Item $script:CacheDir -Recurse -Force
        Write-Host "  [DEL] Config, cache, and ZIPs cleared." -ForegroundColor Yellow
    } else {
        Write-Host "  Nothing to reset." -ForegroundColor DarkGray
    }
    exit 0
}

# -- Setup / Config --------------------------------------------------------

$Config = Load-Config
$IsFirstRun = ($null -eq $Config)

if ($IsFirstRun) {
    Write-Host ""
    Write-Host "  +======================================+" -ForegroundColor Cyan
    Write-Host "  |   Cowork Skills Sync -- First Setup   |" -ForegroundColor Cyan
    Write-Host "  +======================================+" -ForegroundColor Cyan
    Write-Host ""

    # Repo
    $DefaultRepo = "digital-stoic-org/agent-skills"
    if ($Repo -eq "") {
        $InputRepo = Read-Host "  GitHub repo [$DefaultRepo]"
        $Repo = if ($InputRepo -eq "") { $DefaultRepo } else { $InputRepo }
    }

    # Branch
    $DefaultBranch = "main"
    if ($Branch -eq "") {
        $InputBranch = Read-Host "  Branch [$DefaultBranch]"
        $Branch = if ($InputBranch -eq "") { $DefaultBranch } else { $InputBranch }
    }

    # Save config
    $Config = [PSCustomObject]@{
        repo        = $Repo
        branch      = $Branch
        lastSync    = $null
        lastVersion = $null
    }
    Save-Config $Config
    Write-Host ""
    Write-Step "[OK]" "Config saved to $($script:ConfigPath)"

} else {
    # Apply CLI overrides to saved config
    if ($Repo -ne "")   { $Config.repo = $Repo }
    if ($Branch -ne "") { $Config.branch = $Branch }
    $Repo = $Config.repo
    $Branch = $Config.branch
}

# -- Clean and ensure ZIPs directory ----------------------------------------

if (Test-Path $script:ZipsDir) {
    Remove-Item $script:ZipsDir -Recurse -Force
}
New-Item -Path $script:ZipsDir -ItemType Directory -Force | Out-Null

# -- Download --------------------------------------------------------------

Write-Header "Cowork Skills Sync"
Write-Host "  Repo:   $Repo@$Branch" -ForegroundColor DarkGray
Write-Host "  Output: $($script:ZipsDir)" -ForegroundColor DarkGray
if ($DryRun) { Write-Host "  [DRY RUN]" -ForegroundColor Yellow }
Write-Host ""

$RepoRoot = Download-RepoZip $Repo $Branch
$Marketplace = Read-Marketplace $RepoRoot

# -- Version check ---------------------------------------------------------

$CurrentVersion = $Marketplace.metadata.version
if (-not $Force -and -not $ListPlugins -and $Config.lastVersion -eq $CurrentVersion) {
    Write-Step "[OK]" "Already up to date [v$CurrentVersion]. Use -Force to re-sync."
    $ExtractDir = Join-Path $script:CacheDir "repo"
    if (Test-Path $ExtractDir) { Remove-Item $ExtractDir -Recurse -Force }
    exit 0
}

$pCount = $Marketplace.plugins.Count
Write-Step "[i]" "Marketplace: $($Marketplace.name) v$CurrentVersion -- $pCount plugins"

# -- List mode -------------------------------------------------------------

if ($ListPlugins) {
    Write-Header "Available Plugins"
    foreach ($p in $Marketplace.plugins) {
        $PluginSkillsDir = Join-Path $RepoRoot "$($p.source.TrimStart('./'))\skills"
        $SkillCount = 0
        $SkillNames = @()
        if (Test-Path $PluginSkillsDir) {
            $SkillDirs = Get-ChildItem -Path $PluginSkillsDir -Directory
            $SkillCount = $SkillDirs.Count
            $SkillNames = $SkillDirs | ForEach-Object { $_.Name }
        }
        Write-Host ""
        Write-Host "  $($p.name)" -ForegroundColor White -NoNewline
        Write-Host " v$($p.version)" -ForegroundColor DarkGray -NoNewline
        Write-Host " [$SkillCount skills]" -ForegroundColor DarkGray
        foreach ($sn in $SkillNames) {
            Write-Host "    - $sn" -ForegroundColor Gray
        }
    }
    Write-Host ""
    # Cleanup
    $ExtractDir = Join-Path $script:CacheDir "repo"
    if (Test-Path $ExtractDir) { Remove-Item $ExtractDir -Recurse -Force }
    exit 0
}

# -- Determine targets -----------------------------------------------------

if ($Plugins -ne "") {
    $TargetPluginNames = $Plugins -split ","
} else {
    $TargetPluginNames = $Marketplace.plugins | ForEach-Object { $_.name }
}

$TargetSkillNames = @()
if ($Skills -ne "") {
    $TargetSkillNames = $Skills -split ","
}

# -- Load previous versions for change detection ---------------------------

$PrevVersions = Load-Versions
$NewVersions = [PSCustomObject]@{}
$PackagedCount = 0
$SkippedCount = 0
$UpdatedSkills = @()

# -- Process each plugin ---------------------------------------------------

foreach ($PluginName in $TargetPluginNames) {
    $PluginMeta = $Marketplace.plugins | Where-Object { $_.name -eq $PluginName }
    if (-not $PluginMeta) {
        Write-Step "[!!]" "SKIP $PluginName -- not in marketplace.json"
        continue
    }

    $PluginSourceDir = Join-Path $RepoRoot ($PluginMeta.source.TrimStart("./"))
    $PluginSkillsDir = Join-Path $PluginSourceDir "skills"

    if (-not (Test-Path $PluginSkillsDir)) {
        Write-Step "[!!]" "SKIP $PluginName -- no skills/ directory"
        continue
    }

    $SkillFolders = Get-ChildItem -Path $PluginSkillsDir -Directory
    $sCount = $SkillFolders.Count
    Write-Step "[PKG]" "$PluginName v$($PluginMeta.version) -- $sCount skills"

    $PluginVersion = $PluginMeta.version

    foreach ($SkillFolder in $SkillFolders) {
        $SkillMdPath = Join-Path $SkillFolder.FullName "SKILL.md"
        if (-not (Test-Path $SkillMdPath)) {
            Write-Host "       SKIP $($SkillFolder.Name) -- no SKILL.md" -ForegroundColor DarkGray
            $SkippedCount++
            continue
        }

        $SkillInfo = Parse-SkillFrontmatter $SkillMdPath
        $SkillName = $SkillInfo.Name
        if ($SkillName -eq "") { $SkillName = $SkillFolder.Name }

        # Filter by -Skills if specified
        if ($TargetSkillNames.Count -gt 0 -and $SkillName -notin $TargetSkillNames) {
            continue
        }

        $ZipName = $SkillName

        # Output to plugin subfolder
        $PluginZipsDir = Join-Path $script:ZipsDir $PluginName
        if (-not (Test-Path $PluginZipsDir)) {
            New-Item -Path $PluginZipsDir -ItemType Directory -Force | Out-Null
        }

        # Track version for this skill
        $SkillVersionKey = "$PluginName/$SkillName"
        $NewVersions | Add-Member -NotePropertyName $SkillVersionKey -NotePropertyValue $PluginVersion -Force

        # Check if version changed
        $PrevVersion = $null
        if ($PrevVersions.PSObject.Properties.Name -contains $SkillVersionKey) {
            $PrevVersion = $PrevVersions.$SkillVersionKey
        }

        $ZipExists = Test-Path (Join-Path $PluginZipsDir "$ZipName.zip")
        $NeedsUpdate = $Force -or -not $ZipExists -or ($PrevVersion -ne $PluginVersion)

        if (-not $NeedsUpdate) {
            Write-Host "       [--] $ZipName [unchanged]" -ForegroundColor DarkGray
            $SkippedCount++
            continue
        }

        if ($DryRun) {
            $Status = if ($ZipExists) { "UPDATE" } else { "NEW" }
            Write-Host "       [DRY] $ZipName [$Status]" -ForegroundColor DarkGray
        } else {
            New-SkillZip $SkillFolder.FullName $ZipName $PluginZipsDir | Out-Null
            $Status = if ($PrevVersion) { "UPDATED" } else { "NEW" }
            Write-Host "       [OK] $ZipName.zip [$Status]" -ForegroundColor Green
            $UpdatedSkills += "$PluginName/$ZipName"
        }
        $PackagedCount++
    }
}

# -- Save versions ---------------------------------------------------------

if (-not $DryRun) {
    Save-Versions $NewVersions
    $Config.lastSync = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $Config.lastVersion = $CurrentVersion
    Save-Config $Config
}

# -- Cleanup extracted repo ------------------------------------------------

$ExtractDir = Join-Path $script:CacheDir "repo"
if (Test-Path $ExtractDir) { Remove-Item $ExtractDir -Recurse -Force }

# -- Summary ---------------------------------------------------------------

Write-Header "Summary"
Write-Step "[i]" "Packaged: $PackagedCount | Unchanged: $SkippedCount"
Write-Step "[i]" "ZIPs folder: $($script:ZipsDir)"

if ($UpdatedSkills.Count -gt 0 -and -not $DryRun) {
    Write-Host ""
    Write-Host "  Upload these ZIPs via Cowork Desktop:" -ForegroundColor Yellow
    Write-Host "  Settings > Skills > [+] > Upload a skill" -ForegroundColor Yellow
    Write-Host ""
    foreach ($s in $UpdatedSkills) {
        Write-Host "    $s.zip" -ForegroundColor White
    }
}

if (-not $DryRun -and $PackagedCount -eq 0) {
    Write-Host ""
    Write-Host "  All skills up to date. Nothing to upload." -ForegroundColor DarkGray
}

Write-Host ""

# -- Open folder -----------------------------------------------------------

if ($Open -and -not $DryRun) {
    if ($TargetPluginNames.Count -eq 1) {
        $OpenDir = Join-Path $script:ZipsDir $TargetPluginNames[0]
    } else {
        $OpenDir = $script:ZipsDir
    }
    Start-Process explorer.exe $OpenDir
}
