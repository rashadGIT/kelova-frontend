export interface IHeadingBlock {
  id: string;
  type: 'heading';
  text: string;
}

export interface IParagraphBlock {
  id: string;
  type: 'paragraph';
  text: string;
}

export interface IImageBlock {
  id: string;
  type: 'image';
  documentId: string;
  caption?: string;
}

export interface IDividerBlock {
  id: string;
  type: 'divider';
}

export interface IPageBreakBlock {
  id: string;
  type: 'page-break';
}

export type ObituaryBlock =
  | IHeadingBlock
  | IParagraphBlock
  | IImageBlock
  | IDividerBlock
  | IPageBreakBlock;

export interface IObituaryContent {
  blocks: ObituaryBlock[];
}

export interface IObituary {
  id: string;
  tenantId: string;
  caseId: string;
  content: IObituaryContent;
  status: string;
  sharedWithFamilyAt: string | null;
  createdAt: string;
  updatedAt: string;
}
