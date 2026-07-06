// HamsterBase Cloud 接口 SDK。
// 封装屿声自有后端（会员状态查询、面包多兑换等）的 HTTP 调用与统一响应/错误处理，
// 对业务层暴露稳定的类型化方法；默认指向 cloud.hamsterbase.com，可通过 baseUrl 覆盖。
export {
  createHamsterBaseCloudClient,
  type HamsterBaseCloudClient,
  type HamsterBaseCloudClientOptions,
  type HamsterBaseMembershipStatus,
  type RedeemMbdOrderInput,
} from './impl';
