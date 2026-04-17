$pdf_mode = 1;
$pdflatex = 'pdflatex -shell-escape -interaction=nonstopmode %O %S';
$out_dir = 'out';
$aux_dir = 'out';
$bibtex_use = 2;
$clean_ext = "synctex.gz loa run.xml fdb_latexmk bbl blg soc aux log out toc lof lot";

# If you use minted, you need -shell-escape
$pdflatex = "pdflatex -shell-escape -interaction=nonstopmode %O %S";
