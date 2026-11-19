---
name: pdf
description: Use this skill whenever the user wants to do anything with PDF files in the workspace. This includes creating a new PDF (a one-pager, report, post export, or brief), merging or splitting PDFs, rotating pages, adding a watermark, reading page counts and metadata, and filling form fields. If the user mentions a .pdf file or asks to produce one, use this skill.
license: Apache-2.0. Complete terms in LICENSE.txt
---

# PDF processing with pdf-lib

Adapted from Anthropic's `pdf` skill (Apache-2.0): its pdf-lib material, rewritten for Node so it runs in this workspace's sandbox without Python.

## How to run PDF code here

1. Write an ES module script into the workspace, for example `scripts/make-pdf.mjs`, with the file write tool.
2. Run it with the execute command tool: `node scripts/make-pdf.mjs`. Commands run from the workspace root, and `pdf-lib` is already installed, so `import { PDFDocument } from "pdf-lib"` works. Do not run `npm install`; the sandbox has no network.
3. Write output PDFs under `exports/` (create it with `mkdir -p exports` in the same command) and tell the user the path.
4. Check the result: print the page count from the script, or read the PDF back with the read file tool.

## Rules that avoid broken output

- The standard fonts only encode WinAnsi. Replace characters they cannot draw before drawing: curly quotes to straight quotes, em and en dashes to `-`, and drop emoji. The template's `toWinAnsi` does this.
- pdf-lib does not wrap text. Wrap it yourself by measuring with `font.widthOfTextAtSize`, as `wrapText` in the template does, and add a page when the cursor reaches the bottom margin.
- Coordinates start at the bottom-left. A page's top is `page.getHeight()`.
- Sizes are in points: A4 is `[595.28, 841.89]`, US Letter is `[612, 792]`.

## Template: text document

```js
import { mkdirSync, writeFileSync } from "node:fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE = [595.28, 841.89];
const MARGIN = 56;

const toWinAnsi = (text) =>
  text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x0A\x20-\x7E\xA0-\xFF]/g, "");

function wrapText(text, font, size, maxWidth) {
  const lines = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
}

const doc = await PDFDocument.create();
const body = await doc.embedFont(StandardFonts.Helvetica);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);
let page = doc.addPage(PAGE);
let y = page.getHeight() - MARGIN;

function draw(text, { font = body, size = 11, gap = 6, color = rgb(0.09, 0.08, 0.09) } = {}) {
  const width = page.getWidth() - MARGIN * 2;
  for (const line of wrapText(toWinAnsi(text), font, size, width)) {
    if (y < MARGIN + size) {
      page = doc.addPage(PAGE);
      y = page.getHeight() - MARGIN;
    }
    page.drawText(line, { x: MARGIN, y: y - size, size, font, color });
    y -= size * 1.4;
  }
  y -= gap;
}

draw("Title goes here", { font: bold, size: 20, gap: 12 });
draw("Body text goes here. Paragraphs split on newlines.");

doc.setTitle("Title goes here");
mkdirSync("exports", { recursive: true });
writeFileSync("exports/document.pdf", await doc.save());
console.log(`exports/document.pdf: ${doc.getPageCount()} page(s)`);
```

## Merge and split

```js
import { readFileSync, writeFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";

const merged = await PDFDocument.create();
for (const path of ["a.pdf", "b.pdf"]) {
  const source = await PDFDocument.load(readFileSync(path));
  const pages = await merged.copyPages(source, source.getPageIndices());
  pages.forEach((page) => merged.addPage(page));
}
writeFileSync("exports/merged.pdf", await merged.save());

const source = await PDFDocument.load(readFileSync("exports/merged.pdf"));
for (const index of source.getPageIndices()) {
  const single = await PDFDocument.create();
  const [page] = await single.copyPages(source, [index]);
  single.addPage(page);
  writeFileSync(`exports/page-${index + 1}.pdf`, await single.save());
}
```

## Rotate, watermark, metadata

```js
import { readFileSync, writeFileSync } from "node:fs";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

const doc = await PDFDocument.load(readFileSync("input.pdf"));
const font = await doc.embedFont(StandardFonts.HelveticaBold);
for (const page of doc.getPages()) {
  page.setRotation(degrees(90));
  page.drawText("DRAFT", {
    x: page.getWidth() / 4,
    y: page.getHeight() / 2,
    size: 72,
    font,
    color: rgb(0.83, 0.44, 0.49),
    opacity: 0.25,
    rotate: degrees(45),
  });
}
console.log({ pages: doc.getPageCount(), title: doc.getTitle(), author: doc.getAuthor() });
writeFileSync("exports/watermarked.pdf", await doc.save());
```

## Images

`embedPng` and `embedJpg` take the file bytes. Scale with `image.scale(0.5)` and draw with `page.drawImage(image, { x, y, width, height })`.

## Form fields

```js
const form = doc.getForm();
for (const field of form.getFields()) console.log(field.constructor.name, field.getName());
form.getTextField("Name").setText("Alex Rivera");
form.getCheckBox("Agree").check();
form.flatten();
```

## Reading text

pdf-lib cannot extract page text. To read what a PDF says, open it with the read file tool, which passes the PDF to the model directly.
