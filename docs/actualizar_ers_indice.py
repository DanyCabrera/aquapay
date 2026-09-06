# -*- coding: utf-8 -*-
import shutil
import win32com.client as win32

paths = [
    r"C:\Users\Usuario\Desktop\aquapay\docs\ERS-AquaPay.docx",
    r"c:\Users\Usuario\Desktop\Universidad Mariano Galvez 2022 Dany\Semestre #9\PROYECTO DE GRADUACIÓN\ERS-AquaPay.docx",
]

word = win32.Dispatch("Word.Application")
word.Visible = False
word.DisplayAlerts = 0

for path in paths:
    doc = word.Documents.Open(path)
    for i in range(1, doc.TablesOfContents.Count + 1):
        doc.TablesOfContents(i).Update()
    doc.Fields.Update()
    for i in range(1, doc.TablesOfContents.Count + 1):
        doc.TablesOfContents(i).Update()
    pages = doc.ComputeStatistics(2)
    words = doc.ComputeStatistics(0)
    doc.Save()
    doc.Close(False)
    print(f"{path}")
    print(f"  PAGINAS={pages} PALABRAS={words}")

word.Quit()
print("DONE")
