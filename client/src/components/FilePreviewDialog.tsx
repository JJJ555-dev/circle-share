import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    filename: string;
    fileUrl: string;
    fileType: "video" | "audio" | "image";
    mimeType: string;
  } | null;
}

export default function FilePreviewDialog({ open, onOpenChange, file }: FilePreviewDialogProps) {
  if (!file) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = file.fileUrl;
    link.download = file.filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="truncate">{file.filename}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              下载
            </Button>
          </div>
        </DialogHeader>

        <div className="w-full flex items-center justify-center bg-muted rounded-lg p-4">
          {file.fileType === "image" && (
            <img
              src={file.fileUrl}
              alt={file.filename}
              className="max-w-full max-h-[70vh] object-contain"
            />
          )}

          {file.fileType === "video" && (
            <video
              src={file.fileUrl}
              controls
              className="max-w-full max-h-[70vh]"
              style={{ maxWidth: "100%", maxHeight: "70vh" }}
            />
          )}

          {file.fileType === "audio" && (
            <div className="w-full">
              <audio
                src={file.fileUrl}
                controls
                className="w-full"
              />
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>{file.filename}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
