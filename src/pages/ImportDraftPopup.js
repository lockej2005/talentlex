import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const ImportDraftPopup = ({ isOpen, onClose, onImport }) => {
  const [draftText, setDraftText] = useState('');

  const handleImport = () => {
    onImport(draftText);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Previous Draft</DialogTitle>
        </DialogHeader>
        <Textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder="Paste your previous draft here..."
          className="min-h-[200px]"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDraftPopup;