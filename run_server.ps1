$proc = Start-Process -FilePath "catalyst.cmd" -ArgumentList "serve" -PassThru
Wait-Process -Id $proc.Id
