export class fileResponse {
  id: number;
  name: string;
  file_size: number;
  content_type: string;
  file_extension: string;
  document_type: string;
  ref_document_name: string;
  developer_code: string;
  url: string;

  constructor(item: any) {
    this.id = item.id;
    this.name = item.file_name;
    this.file_size = item.file_size;
    this.content_type = item.file_type;
    this.file_extension = item.file_extension;
    this.document_type = item.group_type;
    this.ref_document_name = item.ref_type;
    this.developer_code = item?.developer_code || "";
    this.url = process.env.URL + `/files/${item.id}`;
  }
}

export function convertFileResponse(items: any): fileResponse[] {
  return items.map((n: any) => {
    return new fileResponse(n);
  });
}
