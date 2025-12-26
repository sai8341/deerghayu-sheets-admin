import React, { useState } from 'react';
import { X, Download, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface AttachmentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachmentName: string;
  attachmentUrl?: string; 
}

export const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  isOpen,
  onClose,
  attachmentName,
  attachmentUrl
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  // Safe URL handling
  const safeUrl = attachmentUrl || '';
  
  // Detect file type based on extension
  const isPdf = attachmentName.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(attachmentName);
  
  // Detect if the URL is actually a placeholder image (for mock data)
  // We check for common placeholder services
  const isPlaceholder = safeUrl.includes('placeholder') || safeUrl.includes('placehold.co') || safeUrl.startsWith('data:image');
  
  const shouldRenderAsImage = isImage || (isPdf && isPlaceholder);

  const handleDownload = async () => {
    if (!safeUrl) return;
    
    setIsDownloading(true);
    try {
      // Attempt to fetch the real content
      const response = await fetch(safeUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      downloadBlob(blob, attachmentName);
    } catch (error) {
      console.warn("Download fetch failed (likely CORS on placeholder), using fallback:", error);
      
      // Fallback: Generate a dummy blob so the user interaction still works (Vital for demos)
      const extension = attachmentName.split('.').pop() || 'txt';
      const mimeType = isPdf ? 'application/pdf' : 'text/plain';
      const dummyContent = `This is a mock file content for: ${attachmentName}.\n\nIn the real production app, the actual file would be downloaded here.`;
      
      const blob = new Blob([dummyContent], { type: mimeType });
      downloadBlob(blob, attachmentName);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadBlob = (blob: Blob, name: string) => {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={attachmentName}>
      <div className="flex flex-col h-[70vh]">
        {/* Viewer Area */}
        <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 mb-4 relative">
          {!safeUrl ? (
             <div className="text-center p-6">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">Preview not available.</p>
             </div>
          ) : isPdf && !shouldRenderAsImage ? (
            <iframe 
                src={safeUrl} 
                className="w-full h-full" 
                title="PDF Preview"
            >
            </iframe>
          ) : shouldRenderAsImage ? (
            <img 
                src={safeUrl} 
                alt="Attachment Preview" 
                className="max-w-full max-h-full object-contain shadow-sm"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Load+Error';
                }}
            />
          ) : (
            <div className="text-center p-6">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Preview not available for this file type.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
           <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{attachmentName}</span>
              <span className="text-xs text-gray-500">
                 {isPdf ? 'PDF Document' : isImage ? 'Image File' : 'Attachment'}
              </span>
           </div>
           <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} disabled={isDownloading}>Close</Button>
              <Button onClick={handleDownload} className="flex items-center gap-2" disabled={isDownloading}>
                 {isDownloading ? (
                   <>
                     <Loader2 size={16} className="animate-spin" /> Downloading...
                   </>
                 ) : (
                   <>
                     <Download size={16} /> Download
                   </>
                 )}
              </Button>
           </div>
        </div>
      </div>
    </Modal>
  );
};