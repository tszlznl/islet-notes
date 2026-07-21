import { format } from 'date-fns';
import { getCurrentLocale, getValidLocaleKey } from '@/locales/common/locale';
import {
  getEntriesByNotebook,
  getEntryDisplayTime,
  getIdentityById,
  getNotebookById,
} from './selectors';
import type { DiaryEntryRecord, DiaryModelData } from './type';

export interface NotebookTextExport {
  filename: string;
  entryCount: number;
  text: string;
}

export interface NotebookTextExportOptions {
  locale?: string;
}

interface NotebookTextExportCopy {
  productName: string;
  notebookLabel: string;
  timeLabel: string;
  roleLabel: string;
  contentLabel: string;
}

type NotebookTextExportLocale = 'zh-CN' | 'en-US';

const notebookTextExportCopy = {
  'zh-CN': {
    productName: '屿声',
    notebookLabel: '日记本',
    timeLabel: '时间',
    roleLabel: '角色',
    contentLabel: '内容',
  },
  'en-US': {
    productName: 'ISLET',
    notebookLabel: 'NOTEBOOK',
    timeLabel: 'TIME',
    roleLabel: 'ROLE',
    contentLabel: 'CONTENT',
  },
} satisfies Record<NotebookTextExportLocale, NotebookTextExportCopy>;

export function buildNotebookTextExport(
  model: DiaryModelData,
  notebookId: string,
  options: NotebookTextExportOptions = {},
): NotebookTextExport | undefined {
  const notebook = getNotebookById(model, notebookId);
  if (!notebook) return undefined;

  const copy = getNotebookTextExportCopy(options.locale);
  const filename = createNotebookTextExportFilename(notebook.name, options);
  const entries = getEntriesByNotebook(model, notebook.id).filter(hasExportableText);
  const blocks = entries.map((entry) => {
    const role = getExportRole(model, entry);
    const lines = [
      `${copy.notebookLabel}: ${notebook.name}`,
      `${copy.timeLabel}: ${formatExportTime(getEntryDisplayTime(entry))}`,
    ];
    if (role) lines.push(`${copy.roleLabel}: ${role}`);
    lines.push(`${copy.contentLabel}: ${entry.text ?? ''}`);
    return lines.join('\n');
  });

  return {
    filename,
    entryCount: entries.length,
    text: blocks.join('\n\n') + (blocks.length > 0 ? '\n' : ''),
  };
}

export function createNotebookTextExportFilename(
  notebookName: string,
  options: NotebookTextExportOptions = {},
): string {
  const copy = getNotebookTextExportCopy(options.locale);
  const trimmedName = notebookName.trim();
  if (!trimmedName) throw new Error('Notebook name is required.');
  const safeName = trimmedName
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .slice(0, 60);
  return `${copy.productName}-${safeName}.txt`;
}

function formatExportTime(timestamp: number): string {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
}

function getExportRole(model: DiaryModelData, entry: DiaryEntryRecord): string | undefined {
  if (!entry.identityId) return undefined;
  return getIdentityById(model, entry.identityId)?.name.trim() || undefined;
}

function hasExportableText(entry: DiaryEntryRecord): boolean {
  return entry.type === 'text' && !!entry.text?.trim();
}

function getNotebookTextExportCopy(localeInput?: string): NotebookTextExportCopy {
  const locale = getValidLocaleKey(localeInput ?? getCurrentLocale());
  return locale === 'zh-CN' ? notebookTextExportCopy['zh-CN'] : notebookTextExportCopy['en-US'];
}
