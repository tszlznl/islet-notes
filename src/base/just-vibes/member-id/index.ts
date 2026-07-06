// 会员 ID 派生工具。
// 从同步身份的 recoveryKeyHash 稳定派生出对外展示的会员 ID，令付费权益跟随账号而非单机。
export { memberIdFromRecoveryKeyHash } from './impl';
