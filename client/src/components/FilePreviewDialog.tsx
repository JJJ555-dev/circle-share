import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    id?: number;
    fileId?: number;
    filename: string;
    fileUrl: string;
    fileType: "video" | "audio" | "image";
    mimeType: string;
  } | null;
}

export default function FilePreviewDialog({ open, onOpenChange, file }: FilePreviewDialogProps) {
  if (!file) return null;

  const handleDownload = () => {
    // Use the proper download endpoint with Content-Disposition header
    window.location.href = `/api/download/${file.fileId}`;
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
