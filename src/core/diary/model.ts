import { localize } from '@/nls';
import { nanoid } from 'nanoid';
import { Emitter } from 'vscf/base/common/event';
import { loadLoro, type LoroDoc, type LoroMap, type LoroMovableList, type PeerID } from './loro';
import { isNotebookNameTaken } from './selectors';
import {
  AttachmentRecord,
  CreateAttachmentEntryOptions,
  CreateTextEntryOptions,
  DiaryEntryRecord,
  DiaryModelData,
  IdentityMessagePosition,
  IdentityRecord,
  NotebookRecord,
  ProfileRecord,
} from './type';

const PROFILE = 'profile';
const NOTEBOOK_ORDER = 'notebookOrder';
const NOTEBOOKS = 'notebooks';
const ENTRIES = 'entries';
const ATTACHMENTS = 'attachments';
const IDENTITIES = 'identities';

export class DiaryModel {
  private readonly _onModelChange = new Emitter<void>();
  public readonly onModelChange = this._onModelChange.event;

  static async create(): Promise<DiaryModel> {
    const { LoroDoc } = await loadLoro();
    return new DiaryModel(new LoroDoc());
  }

  private constructor(private readonly doc: LoroDoc) {
    this.doc.subscribeLocalUpdates(() => {
      this._onModelChange.fire();
    });
  }

  import(data: Array<Uint8Array>) {
    data.forEach((item) => this.doc.import(item));
  }

  export() {
    return this.doc.export({ mode: 'snapshot' });
  }

  getVersionKey(): string {
    return JSON.stringify(
      Object.entries(this.getVersion()).sort(([left], [right]) => left.localeCompare(right)),
    );
  }

  ensureDefaultNotebook() {
    const notebooks = this.listNotebooks();
    if (notebooks.length > 0) return notebooks[0].id;
    return this.addNotebook(localize('diary.defaultNotebookName', 'My diary'));
  }

  addNotebook(name: string, createdAt = Date.now()): string {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Notebook name is required.');
    if (this.isNotebookNameTaken(trimmedName)) throw new Error('Notebook name already exists.');
    const id = nanoid();
    const record: NotebookRecord = {
      id,
      name: trimmedName,
      createdAt,
      updatedAt: createdAt,
    };
    this.notebooksMap.set(id, record);
    this.notebookOrder.push(id);
    this.doc.commit();
    return id;
  }

  updateNotebookName(notebookId: string, name: string) {
    const existing = this.getNotebook(notebookId);
    if (!existing) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (this.isNotebookNameTaken(trimmedName, notebookId)) {
      throw new Error('Notebook name already exists.');
    }
    if (existing.name === trimmedName) return;
    this.notebooksMap.set(notebookId, {
      ...existing,
      name: trimmedName,
      updatedAt: Date.now(),
    });
    this.doc.commit();
  }

  updateNotebookAvatar(notebookId: string, avatarAttachmentId: string | undefined) {
    const existing = this.getNotebook(notebookId);
    if (!existing) return;
    this.notebooksMap.set(notebookId, {
      ...existing,
      avatarAttachmentId,
      updatedAt: Date.now(),
    });

    this.doc.commit();
  }

  updateNotebookChatBackground(notebookId: string, chatBackgroundAttachmentId: string | undefined) {
    const existing = this.getNotebook(notebookId);
    if (!existing) return;
    this.notebooksMap.set(notebookId, {
      ...existing,
      chatBackgroundAttachmentId,
      updatedAt: Date.now(),
    });

    this.doc.commit();
  }

  updateProfileName(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    this.profileMap.set('name', trimmedName);
    this.profileMap.set('updatedAt', Date.now());
    this.doc.commit();
  }

  updateProfileAvatar(avatarAttachmentId: string | undefined) {
    this.profileMap.set('avatarAttachmentId', avatarAttachmentId ?? '');
    this.profileMap.set('updatedAt', Date.now());
    this.doc.commit();
  }

  addIdentity(name: string, createdAt = Date.now()): string {
    const id = nanoid();
    const record: IdentityRecord = {
      id,
      name,
      messagePosition: 'right',
      createdAt,
      updatedAt: createdAt,
    };
    this.identitiesMap.set(id, record);
    this.doc.commit();
    return id;
  }

  updateIdentityName(identityId: string, name: string) {
    const existing = this.getIdentity(identityId);
    if (!existing) return;
    this.identitiesMap.set(identityId, {
      ...existing,
      name,
      updatedAt: Date.now(),
    });
    this.doc.commit();
  }

  updateIdentityAvatar(identityId: string, avatarAttachmentId: string | undefined) {
    const existing = this.getIdentity(identityId);
    if (!existing) return;
    this.identitiesMap.set(identityId, {
      ...existing,
      avatarAttachmentId,
      updatedAt: Date.now(),
    });
    this.doc.commit();
  }

  updateIdentityMessagePosition(identityId: string, messagePosition: IdentityMessagePosition) {
    const existing = this.getIdentity(identityId);
    if (!existing) return;
    this.identitiesMap.set(identityId, {
      ...existing,
      messagePosition,
      updatedAt: Date.now(),
    });
    this.doc.commit();
  }

  archiveIdentity(identityId: string) {
    const existing = this.getIdentity(identityId);
    if (!existing || existing.archivedAt) return;
    this.identitiesMap.set(identityId, {
      ...existing,
      archivedAt: Date.now(),
      updatedAt: Date.now(),
    });
    this.doc.commit();
  }

  unarchiveIdentity(identityId: string) {
    const existing = this.getIdentity(identityId);
    if (!existing || !existing.archivedAt) return;
    // 直接写 undefined 会被序列化为 null，这里整体删掉 archivedAt 字段。
    const record: IdentityRecord = { ...existing, updatedAt: Date.now() };
    delete record.archivedAt;
    this.identitiesMap.set(identityId, record);
    this.doc.commit();
  }

  softDeleteNotebook(notebookId: string) {
    const existing = this.getNotebook(notebookId);
    if (!existing || existing.deletedAt) return;
    this.notebooksMap.set(notebookId, {
      ...existing,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
    this.doc.commit();
  }

  addTextEntry(options: CreateTextEntryOptions): string {
    const now = options.createdAt ?? Date.now();
    const id = nanoid();

    const entry: DiaryEntryRecord = {
      id,
      notebookId: options.notebookId,
      type: 'text',
      text: options.text,
      identityId: options.identityId,
      createdAt: now,
      updatedAt: now,
      externalSource: options.externalSource,
      externalId: options.externalId,
    };
    applyCreateDisplayAt(entry, options.displayAt);
    applyCreateReplyTo(entry, options.replyToEntryId);
    this.entriesMap.set(id, entry);
    this.touchNotebook(options.notebookId, now);
    this.doc.commit();
    return id;
  }

  addTextEntries(optionsList: CreateTextEntryOptions[]): string[] {
    const ids: string[] = [];
    const touchedNotebooks = new Map<string, number>();

    for (const options of optionsList) {
      const now = options.createdAt ?? Date.now();
      const id = nanoid();
      const entry: DiaryEntryRecord = {
        id,
        notebookId: options.notebookId,
        type: 'text',
        text: options.text,
        identityId: options.identityId,
        createdAt: now,
        updatedAt: now,
        externalSource: options.externalSource,
        externalId: options.externalId,
      };
      applyCreateDisplayAt(entry, options.displayAt);
      applyCreateReplyTo(entry, options.replyToEntryId);
      this.entriesMap.set(id, entry);
      ids.push(id);
      touchedNotebooks.set(
        options.notebookId,
        Math.max(touchedNotebooks.get(options.notebookId) ?? 0, now),
      );
    }

    for (const [notebookId, updatedAt] of touchedNotebooks) {
      this.touchNotebook(notebookId, updatedAt);
    }
    this.doc.commit();
    return ids;
  }

  addEntryForTest(entry: DiaryEntryRecord): string {
    this.entriesMap.set(entry.id, entry);
    this.touchNotebook(entry.notebookId, entry.updatedAt);
    this.doc.commit();
    return entry.id;
  }

  updateTextEntry(entryId: string, text: string) {
    const existing = this.getEntry(entryId);
    if (!existing || existing.type !== 'text' || existing.deletedAt) return;
    this.entriesMap.set(entryId, {
      ...existing,
      text,
      updatedAt: Date.now(),
    });
    this.doc.commit();
  }

  addAttachmentEntry(options: CreateAttachmentEntryOptions): string {
    const entryId = nanoid();
    const entry: DiaryEntryRecord = {
      id: entryId,
      notebookId: options.attachment.notebookId,
      type: 'attachment',
      text: options.text,
      attachmentId: options.attachment.id,
      identityId: options.identityId,
      createdAt: options.createdAt,
      updatedAt: options.createdAt,
      externalSource: options.externalSource,
      externalId: options.externalId,
    };
    applyCreateDisplayAt(entry, options.displayAt);
    this.attachmentsMap.set(options.attachment.id, options.attachment);
    this.entriesMap.set(entryId, entry);
    this.touchNotebook(options.attachment.notebookId, options.createdAt);
    this.doc.commit();
    return entryId;
  }

  updateAttachmentEntryText(entryId: string, text: string | undefined) {
    const existing = this.getEntry(entryId);
    if (!existing || existing.type !== 'attachment' || existing.deletedAt) return;
    const nextText = text?.trim() ? text : undefined;
    this.entriesMap.set(entryId, {
      ...existing,
      text: nextText,
      updatedAt: Date.now(),
    });
    this.doc.commit();
  }

  /** 切换记录归属身份;传 undefined 表示恢复为本人消息。目标身份必须存在且未归档。 */
  updateEntryIdentity(entryId: string, identityId: string | undefined) {
    const existing = this.getEntry(entryId);
    if (!existing || existing.deletedAt) return;
    if ((existing.identityId ?? undefined) === identityId) return;
    if (identityId) {
      const identity = this.getIdentity(identityId);
      if (!identity || identity.archivedAt) return;
    }
    this.entriesMap.set(entryId, {
      ...existing,
      identityId,
      updatedAt: Date.now(),
    });
    this.doc.commit();
  }

  updateEntryDisplayAt(entryId: string, displayAt: number) {
    const existing = this.getEntry(entryId);
    if (!existing || existing.deletedAt || !Number.isFinite(displayAt)) return;
    if ((existing.displayAt ?? existing.createdAt) === displayAt) return;
    const now = Date.now();
    const nextEntry: DiaryEntryRecord = {
      ...existing,
      updatedAt: now,
    };
    if (displayAt === existing.createdAt) {
      delete nextEntry.displayAt;
    } else {
      nextEntry.displayAt = displayAt;
    }
    this.entriesMap.set(entryId, nextEntry);
    this.touchNotebook(existing.notebookId, now);
    this.doc.commit();
  }

  moveEntryToNotebook(entryId: string, targetNotebookId: string) {
    const existing = this.getEntry(entryId);
    const targetNotebook = this.getNotebook(targetNotebookId);
    if (!existing || existing.deletedAt || !targetNotebook || targetNotebook.deletedAt) return;
    if (existing.notebookId === targetNotebookId) return;

    const now = Date.now();
    this.entriesMap.set(entryId, {
      ...existing,
      notebookId: targetNotebookId,
      updatedAt: now,
    });

    if (existing.attachmentId) {
      const attachment = this.getAttachment(existing.attachmentId);
      if (attachment && !attachment.deletedAt) {
        this.attachmentsMap.set(existing.attachmentId, {
          ...attachment,
          notebookId: targetNotebookId,
        });
      }
    }

    this.touchNotebook(existing.notebookId, now);
    this.touchNotebook(targetNotebookId, now);
    this.doc.commit();
  }

  addAttachment(attachment: AttachmentRecord) {
    this.attachmentsMap.set(attachment.id, attachment);
    this.doc.commit();
  }

  softDeleteEntry(entryId: string) {
    const existing = this.getEntry(entryId);
    if (!existing || existing.deletedAt) return;
    this.entriesMap.set(entryId, {
      ...existing,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
    if (existing.attachmentId) {
      this.softDeleteAttachment(existing.attachmentId, false);
    }
    this.doc.commit();
  }

  softDeleteAttachment(attachmentId: string, shouldCommit = true) {
    const existing = this.getAttachment(attachmentId);
    if (!existing || existing.deletedAt) return;
    this.attachmentsMap.set(attachmentId, {
      ...existing,
      deletedAt: Date.now(),
    });
    if (shouldCommit) this.doc.commit();
  }

  toJSON(): DiaryModelData {
    const notebooksRecord = this.notebooksMap.toJSON() as Record<string, NotebookRecord>;
    const entriesRecord = this.entriesMap.toJSON() as Record<string, DiaryEntryRecord>;
    const attachmentsRecord = this.attachmentsMap.toJSON() as Record<string, AttachmentRecord>;
    const notebookOrder = this.notebookOrder.toArray() as string[];
    const orderedIds = [
      ...notebookOrder,
      ...Object.keys(notebooksRecord).filter((id) => !notebookOrder.includes(id)),
    ];
    const notebooks = orderedIds
      .map((id) => notebooksRecord[id])
      .filter((notebook): notebook is NotebookRecord => !!notebook && !notebook.deletedAt);
    const entries = Object.values(entriesRecord);
    const attachments = Object.values(attachmentsRecord);
    const profile = this.readProfile();
    const { identities, identityMap } = this.readIdentities();
    return {
      version: this.getVersion(),
      profile,
      notebookOrder: orderedIds,
      notebooks,
      notebookMap: new Map(Object.entries(notebooksRecord)),
      entries,
      entryMap: new Map(Object.entries(entriesRecord)),
      attachments,
      attachmentMap: new Map(Object.entries(attachmentsRecord)),
      identities,
      identityMap,
    };
  }

  private getVersion(): Record<PeerID, number> {
    const version: Record<PeerID, number> = {};
    this.doc
      .version()
      .toJSON()
      .forEach((value, peerId) => {
        version[peerId] = value;
      });
    return version;
  }

  private listNotebooks(): NotebookRecord[] {
    return this.toJSON().notebooks;
  }

  private isNotebookNameTaken(name: string, excludeNotebookId?: string): boolean {
    return isNotebookNameTaken(this.toJSON(), name, excludeNotebookId);
  }

  private getNotebook(notebookId: string): NotebookRecord | undefined {
    return this.notebooksMap.get(notebookId) as NotebookRecord | undefined;
  }

  private getEntry(entryId: string): DiaryEntryRecord | undefined {
    return this.entriesMap.get(entryId) as DiaryEntryRecord | undefined;
  }

  private getAttachment(attachmentId: string): AttachmentRecord | undefined {
    return this.attachmentsMap.get(attachmentId) as AttachmentRecord | undefined;
  }

  private touchNotebook(notebookId: string, updatedAt: number) {
    const notebook = this.getNotebook(notebookId);
    if (!notebook) return;
    this.notebooksMap.set(notebookId, {
      ...notebook,
      updatedAt,
    });
  }

  private getIdentity(identityId: string): IdentityRecord | undefined {
    return this.identitiesMap.get(identityId) as IdentityRecord | undefined;
  }

  /** 归一化身份记录：跳过缺 id/name 的脏数据，非法 messagePosition 按 'right' 容错。 */
  private readIdentities(): {
    identities: IdentityRecord[];
    identityMap: Map<string, IdentityRecord>;
  } {
    const raw = this.identitiesMap.toJSON() as Record<string, Partial<IdentityRecord>>;
    const identities: IdentityRecord[] = [];
    for (const value of Object.values(raw)) {
      if (typeof value?.id !== 'string' || typeof value.name !== 'string') continue;
      const record: IdentityRecord = {
        id: value.id,
        name: value.name,
        messagePosition: value.messagePosition === 'left' ? 'left' : 'right',
        createdAt: typeof value.createdAt === 'number' ? value.createdAt : 0,
        updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : 0,
      };
      if (typeof value.avatarAttachmentId === 'string' && value.avatarAttachmentId) {
        record.avatarAttachmentId = value.avatarAttachmentId;
      }
      if (typeof value.archivedAt === 'number') {
        record.archivedAt = value.archivedAt;
      }
      identities.push(record);
    }
    identities.sort((a, b) =>
      a.createdAt !== b.createdAt ? a.createdAt - b.createdAt : a.id.localeCompare(b.id),
    );
    return {
      identities,
      identityMap: new Map(identities.map((identity) => [identity.id, identity])),
    };
  }

  private readProfile(): ProfileRecord {
    const raw = this.profileMap.toJSON() as Partial<ProfileRecord>;
    const profile: ProfileRecord = {};
    if (typeof raw.name === 'string' && raw.name.trim()) {
      profile.name = raw.name;
    }
    if (typeof raw.avatarAttachmentId === 'string' && raw.avatarAttachmentId.trim()) {
      profile.avatarAttachmentId = raw.avatarAttachmentId;
    }
    if (typeof raw.updatedAt === 'number') {
      profile.updatedAt = raw.updatedAt;
    }
    return profile;
  }

  private get profileMap(): LoroMap<Record<string, unknown>> {
    return this.doc.getMap(PROFILE) as LoroMap<Record<string, unknown>>;
  }

  private get notebookOrder(): LoroMovableList<string> {
    return this.doc.getMovableList(NOTEBOOK_ORDER) as LoroMovableList<string>;
  }

  private get notebooksMap(): LoroMap<Record<string, unknown>> {
    return this.doc.getMap(NOTEBOOKS) as LoroMap<Record<string, unknown>>;
  }

  private get entriesMap(): LoroMap<Record<string, unknown>> {
    return this.doc.getMap(ENTRIES) as LoroMap<Record<string, unknown>>;
  }

  private get attachmentsMap(): LoroMap<Record<string, unknown>> {
    return this.doc.getMap(ATTACHMENTS) as LoroMap<Record<string, unknown>>;
  }

  private get identitiesMap(): LoroMap<Record<string, unknown>> {
    return this.doc.getMap(IDENTITIES) as LoroMap<Record<string, unknown>>;
  }
}

/** 与 updateEntryDisplayAt 语义一致：非法值或与 createdAt 相同时不落库 displayAt。 */
function applyCreateDisplayAt(entry: DiaryEntryRecord, displayAt: number | undefined) {
  if (typeof displayAt !== 'number' || !Number.isFinite(displayAt)) return;
  if (displayAt === entry.createdAt) return;
  entry.displayAt = displayAt;
}

/** 直接写 undefined 会被序列化为 null，缺省时整体不落库 replyToEntryId 字段。 */
function applyCreateReplyTo(entry: DiaryEntryRecord, replyToEntryId: string | undefined) {
  if (typeof replyToEntryId !== 'string' || !replyToEntryId) return;
  entry.replyToEntryId = replyToEntryId;
}
