export function writeFanCopyCatalog(): number;
export function fanCopyPlugin(): { name: string; enforce: string; transform(code: string, id: string): unknown };