import { useState } from "react";
import { Download, FileText, File } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ExportMenu({ title, content }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportMarkdown = () => {
    const temp = document.createElement("div");
    temp.innerHTML = content;

    let markdown = `# ${title || "Untitled"}\n\n`;

    temp.childNodes.forEach((node) => {
      if (node.nodeName === "H1") markdown += `# ${node.textContent}\n\n`;
      else if (node.nodeName === "H2") markdown += `## ${node.textContent}\n\n`;
      else if (node.nodeName === "H3") markdown += `### ${node.textContent}\n\n`;
      else if (node.nodeName === "BLOCKQUOTE") markdown += `> ${node.textContent}\n\n`;
      else if (node.nodeName === "UL") {
        node.querySelectorAll("li").forEach((li) => {
          markdown += `- ${li.textContent}\n`;
        });
        markdown += "\n";
      } else if (node.nodeName === "OL") {
        node.querySelectorAll("li").forEach((li, i) => {
          markdown += `${i + 1}. ${li.textContent}\n`;
        });
        markdown += "\n";
      } else if (node.nodeName === "HR") {
        markdown += `---\n\n`;
      } else {
        const text = node.textContent?.trim();
        if (text) markdown += `${text}\n\n`;
      }
    });

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "Untitled"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportPDF = async () => {
    setExporting(true);
    setOpen(false);
    try {
      const container = document.createElement("div");
      container.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 794px;
        padding: 60px;
        background: white;
        font-family: Georgia, serif;
        color: #1a1a1a;
        line-height: 1.8;
      `;

      container.innerHTML = `
        <h1 style="font-size:2.2rem;font-weight:700;margin-bottom:8px;color:#111;">
          ${title || "Untitled"}
        </h1>
        <hr style="border:none;border-top:2px solid #e5e7eb;margin-bottom:32px;" />
        <div style="font-size:1rem;color:#333;">
          ${content
            .replace(/<h1>/g, '<h1 style="font-size:1.8rem;font-weight:700;margin:24px 0 8px;color:#111;">')
            .replace(/<h2>/g, '<h2 style="font-size:1.4rem;font-weight:600;margin:20px 0 8px;color:#222;">')
            .replace(/<h3>/g, '<h3 style="font-size:1.2rem;font-weight:600;margin:16px 0 8px;color:#333;">')
            .replace(/<ul>/g, '<ul style="padding-left:24px;margin:8px 0;">')
            .replace(/<ol>/g, '<ol style="padding-left:24px;margin:8px 0;">')
            .replace(/<li>/g, '<li style="margin-bottom:4px;">')
            .replace(/<blockquote>/g, '<blockquote style="border-left:4px solid #d1d5db;padding-left:16px;color:#6b7280;margin:16px 0;">')
            .replace(/<p>/g, '<p style="margin-bottom:12px;">')
          }
        </div>
      `;

      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${title || "Untitled"}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
      >
        <Download size={15} />
        {exporting ? "Exporting..." : "Export"}
      </button>

      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-9 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 w-44 overflow-hidden">
            <button
              onClick={exportMarkdown}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <FileText size={15} />
              Export as .md
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <File size={15} />
              Export as PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}