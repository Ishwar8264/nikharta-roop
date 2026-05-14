export type MediaUploaderItem = {
  alt?: string;
  id: string;
  name: string;
  url: string;
};

export type MediaUploaderUpload = (
  file: File,
) => Promise<MediaUploaderItem>;

export type MediaUploaderProps = {
  accept?: string;
  helperText?: string;
  initialItems?: MediaUploaderItem[];
  onSelect?: (item: MediaUploaderItem) => void;
  onSelectComplete?: (item: MediaUploaderItem) => void;
  onOpen?: () => void;
  onUploadComplete?: (item: MediaUploaderItem) => void;
  onUpload: MediaUploaderUpload;
  selectedUrl?: string | null;
};
