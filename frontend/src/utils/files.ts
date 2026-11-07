export const spreadsheetExtensions = ['xls', 'xlsx', 'mdb', 'accdb'];
export const documentExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];

export const acceptAttr = (exts: string[]) => exts.map((e) => `.${e}`).join(',');

export const extensionOf = (name: string) => {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i + 1).toLowerCase();
};

export const isImage = (name: string) => ['jpg', 'jpeg', 'png'].includes(extensionOf(name));

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}