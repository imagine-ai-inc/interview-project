# Notice

This skill is a derivative of the `pdf` skill from Anthropic's skills repository, licensed under the Apache License 2.0 (see `LICENSE.txt`).

Changes from the original:

- Dropped the Python (pypdf, pdfplumber, reportlab, pypdfium2), command-line (qpdf, poppler), and OCR material, along with `FORMS.md`, `REFERENCE.md`, and `scripts/`.
- Rewrote the guide around pdf-lib and Node, run through the workspace's local sandbox.
- Added a text-document template with WinAnsi sanitizing and line wrapping.
