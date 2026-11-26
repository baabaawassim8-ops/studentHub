$ErrorActionPreference = "Stop"

function Wait-Health {
    for ($i = 0; $i -lt 40; $i++) {
        try {
            $health = Invoke-RestMethod http://localhost:8000/health
            if ($health.status -eq "ok") { return }
        } catch {
            Start-Sleep -Seconds 3
        }
    }
    throw "La boutique ne répond pas sur http://localhost:8000"
}

Wait-Health
Invoke-RestMethod http://localhost:8000/api/products | ConvertTo-Json -Depth 5
$order = Invoke-RestMethod http://localhost:8000/api/orders -Method Post -ContentType "application/json" -Body '{"product_id":1,"quantity":1,"customer_name":"Amira Ben Ali","customer_email":"amira@example.com"}'
$order | ConvertTo-Json -Depth 5
Invoke-RestMethod http://localhost:8000/api/notifications | ConvertTo-Json -Depth 5
Write-Output "Smoke test OK"
