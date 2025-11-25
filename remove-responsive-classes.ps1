# Script to remove all responsive classes (md:, lg:, sm:, xl:, 2xl:) from TSX files
# This ensures all pages use the unified responsive system

$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Remove responsive classes from className attributes
    # Pattern: md:classname, lg:classname, sm:classname, xl:classname, 2xl:classname
    $content = $content -replace '\b(md|lg|sm|xl|2xl):([a-zA-Z0-9-]+)', '$2'
    
    # Remove responsive classes with spaces: "md: text-lg" -> "text-lg"
    $content = $content -replace '\b(md|lg|sm|xl|2xl):\s+', ''
    
    # Remove responsive classes in conditional expressions
    $content = $content -replace '\b(md|lg|sm|xl|2xl):([a-zA-Z0-9-]+)', '$2'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Done removing responsive classes!"

