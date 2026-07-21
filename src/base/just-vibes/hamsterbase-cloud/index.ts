// HamsterBase Cloud 接口 SDK。
// 封装屿声自有后端（会员状态查询、面包多兑换等）的 HTTP 调用与统一响应/错误处理，
// 对业务层暴露固定指向 cloud.hamsterbase.com 的会员接口。
export {
  createHamsterBaseCloudClient,
  type HamsterBaseCloudClient,
  type HamsterBaseCloudClientOptions,
  type HamsterBaseMembershipStatus,
  type RedeemAppStoreTransactionInput,
  type RedeemMbdOrderInput,
} from './impl';
