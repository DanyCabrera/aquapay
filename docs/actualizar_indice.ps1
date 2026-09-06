$ErrorActionPreference = "Stop"
$path = "C:\Users\Usuario\Desktop\aquapay\docs\Documentacion-Tecnica-AquaPay.docx"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$doc = $word.Documents.Open($path)

# Actualizar campos (indice y numeros de pagina)
foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
$doc.Fields.Update() | Out-Null
foreach ($toc in $doc.TablesOfContents) { $toc.Update() }

$pages = $doc.ComputeStatistics(2)   # wdStatisticPages
$words = $doc.ComputeStatistics(0)   # wdStatisticWords

$doc.Save()
$doc.Close(0)
$word.Quit()

[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null

Write-Output "PAGINAS=$pages"
Write-Output "PALABRAS=$words"
