# Domain Verification Script for Firebase Hosting
# Usage: .\check-domain.ps1 yourdomain.com

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain
)

Write-Host "`n🔍 Checking DNS configuration for: $Domain" -ForegroundColor Cyan
Write-Host "=" * 60

# Check A records (for root domain)
Write-Host "`n📍 A Records:" -ForegroundColor Yellow
try {
    $aRecords = Resolve-DnsName -Name $Domain -Type A -ErrorAction SilentlyContinue
    if ($aRecords) {
        foreach ($record in $aRecords) {
            if ($record.Type -eq "A") {
                Write-Host "  ✓ $($record.IPAddress)" -ForegroundColor Green
                
                # Check if it matches Firebase IPs
                $firebaseIPs = @("151.101.1.195", "151.101.65.195")
                if ($firebaseIPs -contains $record.IPAddress) {
                    Write-Host "    → Correct Firebase IP!" -ForegroundColor Green
                } else {
                    Write-Host "    → Not a Firebase IP (Expected: 151.101.1.195 or 151.101.65.195)" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "  ✗ No A records found" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Error checking A records: $($_.Exception.Message)" -ForegroundColor Red
}

# Check CNAME for www
Write-Host "`n📍 CNAME Records (www):" -ForegroundColor Yellow
try {
    $cnameRecords = Resolve-DnsName -Name "www.$Domain" -Type CNAME -ErrorAction SilentlyContinue
    if ($cnameRecords) {
        foreach ($record in $cnameRecords) {
            if ($record.Type -eq "CNAME") {
                Write-Host "  ✓ $($record.NameHost)" -ForegroundColor Green
                
                if ($record.NameHost -like "*web.app") {
                    Write-Host "    → Correct Firebase CNAME!" -ForegroundColor Green
                } else {
                    Write-Host "    → Not pointing to Firebase (.web.app domain)" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "  ✗ No CNAME records found for www.$Domain" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Error checking CNAME records: $($_.Exception.Message)" -ForegroundColor Red
}

# Check TXT records (for verification)
Write-Host "`n📍 TXT Records:" -ForegroundColor Yellow
try {
    $txtRecords = Resolve-DnsName -Name $Domain -Type TXT -ErrorAction SilentlyContinue
    if ($txtRecords) {
        foreach ($record in $txtRecords) {
            if ($record.Type -eq "TXT") {
                $txt = $record.Strings -join ""
                if ($txt -like "*firebase*") {
                    Write-Host "  ✓ Firebase verification record found" -ForegroundColor Green
                } else {
                    Write-Host "  • $txt" -ForegroundColor Gray
                }
            }
        }
    } else {
        Write-Host "  • No TXT records found" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ✗ Error checking TXT records: $($_.Exception.Message)" -ForegroundColor Red
}

# Try to connect via HTTPS
Write-Host "`n🔒 HTTPS Connectivity:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$Domain" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ HTTPS working! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*SSL*" -or $_.Exception.Message -like "*certificate*") {
        Write-Host "  ⚠ SSL certificate issue (may still be provisioning)" -ForegroundColor Yellow
    } elseif ($_.Exception.Message -like "*could not be resolved*") {
        Write-Host "  ✗ Domain not resolving yet (DNS not propagated)" -ForegroundColor Red
    } else {
        Write-Host "  ✗ Cannot connect: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n" + ("=" * 60)
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Ensure domain is added in Firebase Console" -ForegroundColor White
Write-Host "2. Verify DNS records match Firebase requirements" -ForegroundColor White
Write-Host "3. Wait for DNS propagation (up to 48 hours)" -ForegroundColor White
Write-Host "4. Wait for SSL certificate provisioning (up to 24 hours)" -ForegroundColor White
Write-Host "`n🔗 Useful Links:" -ForegroundColor Cyan
Write-Host "  • Firebase Console: https://console.firebase.google.com/project/simplysoph-66c78/hosting" -ForegroundColor White
Write-Host "  • DNS Propagation Check: https://www.whatsmydns.net/#A/$Domain" -ForegroundColor White
Write-Host "  • Firebase Docs: https://firebase.google.com/docs/hosting/custom-domain" -ForegroundColor White
Write-Host ""
