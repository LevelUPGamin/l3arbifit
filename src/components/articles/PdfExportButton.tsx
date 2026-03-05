import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2pdf from "html2pdf.js";

interface PdfExportButtonProps {
  article: {
    title: string;
    content: string | null;
    excerpt: string | null;
    published_at: string | null;
    reading_time_minutes: number | null;
  };
  variant?: "default" | "outline" | "ghost";
}

export const PdfExportButton = ({ article, variant = "outline" }: PdfExportButtonProps) => {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    
    try {
      // Create a temporary container for the PDF content
      const container = document.createElement("div");
      container.style.padding = "40px";
      container.style.fontFamily = "'Source Sans Pro', sans-serif";
      container.style.maxWidth = "800px";
      container.style.margin = "0 auto";
      container.style.color = "#1a1a1a";
      container.style.backgroundColor = "#ffffff";
      
      const date = article.published_at 
        ? new Date(article.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : '';

      container.innerHTML = `
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px;">
          <h1 style="font-family: 'Playfair Display', serif; font-size: 32px; margin-bottom: 16px; line-height: 1.2;">
            ${article.title}
          </h1>
          ${article.excerpt ? `<p style="font-style: italic; color: #666; font-size: 16px; margin-bottom: 16px;">${article.excerpt}</p>` : ''}
          <div style="font-size: 14px; color: #888;">
            ${date}${article.reading_time_minutes ? ` • ${article.reading_time_minutes} min read` : ''}
          </div>
        </div>
        <div style="font-size: 16px; line-height: 1.8;">
          ${article.content || ''}
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #888;">
          Exported from L3arbiFit
        </div>
      `;

      document.body.appendChild(container);

      const options = {
        margin: [10, 10],
        filename: `${article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(options).from(container).save();
      
      document.body.removeChild(container);

      toast({
        title: "PDF Exported",
        description: "Your article has been downloaded as a PDF.",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant={variant} size="sm" onClick={handleExport} disabled={exporting}>
      {exporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4 mr-2" />
      )}
      {exporting ? "Exporting..." : "Export PDF"}
    </Button>
  );
};
