$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== CreatorHub API Smoke Test ===" -ForegroundColor Cyan

# 1. Health check
$health = Invoke-RestMethod -Uri "http://localhost:5000/api/health"
Write-Host "Health: $($health.status)" -ForegroundColor Green

# 2. Register
$regBody = '{"username":"smoketest2","email":"smoketest2@test.com","password":"password123"}'

try {
    $reg = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body $regBody
    $token = $reg.token
    Write-Host "Register: OK - user created: $($reg.user.username)" -ForegroundColor Green
} catch {
    $loginBody = '{"email":"smoketest2@test.com","password":"password123"}'
    $login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $token = $login.token
    Write-Host "Login (existing): OK - $($login.user.username)" -ForegroundColor Yellow
}

# 3. Auth /me
$headers = @{ Authorization = "Bearer $token" }
$me = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Headers $headers
Write-Host "Auth /me: OK - $($me.username)" -ForegroundColor Green

# 4. List advertisements
$ads = Invoke-RestMethod -Uri "http://localhost:5000/api/advertisements"
Write-Host "List Ads: OK - $($ads.pagination.total) total" -ForegroundColor Green

# 5. Create advertisement (JSON body, no file upload needed)
$adBody = '{"title":"Looking for a Roblox Builder for Horror Game","category":"roblox","job_type":"Builder","description":"I need an experienced Roblox builder to create a detailed abandoned hospital for my horror game with approximately 10 rooms and exterior.","payment_type":"Fixed Price","payment_amount":5000,"payment_currency":"Robux","tags":"[\"horror\",\"building\"]","required_skills":"[\"Roblox Studio\"]","contact_links":"[{\"platform\":\"discord\",\"url\":\"testuser1234\"}]"}'

$newAd = Invoke-RestMethod -Uri "http://localhost:5000/api/advertisements" -Method POST -ContentType "application/json" -Body $adBody -Headers $headers
Write-Host "Create Ad: OK - $($newAd.advertisement.title)" -ForegroundColor Green
$adId = $newAd.advertisement.id

# 6. Get ad by ID
$adDetail = Invoke-RestMethod -Uri "http://localhost:5000/api/advertisements/$adId"
Write-Host "Get Ad: OK - category=$($adDetail.category) job=$($adDetail.job_type)" -ForegroundColor Green

# 7. Search
$search = Invoke-RestMethod -Uri "http://localhost:5000/api/advertisements/search?q=roblox"
Write-Host "Search: OK - $($search.total) results for roblox" -ForegroundColor Green

# 8. Dashboard my ads
$myAds = Invoke-RestMethod -Uri "http://localhost:5000/api/users/dashboard/my-ads" -Headers $headers
Write-Host "Dashboard: OK - $($myAds.Count) ad(s) owned" -ForegroundColor Green

# 9. Mark as filled
$statusBody = '{"status":"filled"}'
$statusRes = Invoke-RestMethod -Uri "http://localhost:5000/api/advertisements/$adId/status" -Method PATCH -ContentType "application/json" -Body $statusBody -Headers $headers
Write-Host "Status update: OK - $($statusRes.message)" -ForegroundColor Green

# 10. Delete
$del = Invoke-RestMethod -Uri "http://localhost:5000/api/advertisements/$adId" -Method DELETE -Headers $headers
Write-Host "Delete: OK - $($del.message)" -ForegroundColor Green

Write-Host ""
Write-Host "=== All 10 tests passed! ===" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend:  http://localhost:5000" -ForegroundColor White
