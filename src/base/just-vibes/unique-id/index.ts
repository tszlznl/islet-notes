// 唯一 ID 工具。
// 把标准 UUID 编码成更短、便于展示或输入的分段 ID，也可直接生成新 ID。
export { createUniqueId, uniqueIdFromUuid, type RandomUuidProvider } from './impl';
