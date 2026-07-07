export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

const card =
  'relative bg-surface before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-line ' +
  'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-line';

/**
 * Typography scale (参照微信字阶 22 / 17 / 15 / 14 / 12)。
 * 每个 token 固定 size + weight + leading 的搭配,按用途取用。
 */
const font = {
  /** 一级标题 — 22 Semibold,资料页姓名等页面主信息 */
  Headline: 'text-[22px] font-semibold leading-8',
  /** 页面大标题 — 24 Semibold / 34px 行高,WeUI 表单页顶部标题 */
  PageTitle: 'text-[24px] font-semibold leading-[34px]',
  /** 强调正文 / 二级标题、弹窗文案、WeUI 大按钮文字 — 17 Medium / 24px 行高 */
  EmBody: 'text-[17px] font-medium leading-6',
  /** 导航栏标题 — 17 Medium / 44px 行高(等于导航栏高度) */
  NavTitle: 'text-[17px] font-medium leading-[44px]',
  /** 按钮文字 — 17 Medium,行高随容器居中 */
  Button: 'text-[17px] font-medium',
  /** 小按钮文字 — 14 Medium(发送按钮) */
  ButtonSmall: 'text-[14px] font-medium',
  /** 导航栏操作按钮文字 — 15 Medium / 20px 行高(保存按钮) */
  HeaderButton: 'text-[15px] font-medium leading-5',
  /** 列表条目标题 — 17 Semibold(日记本名称) */
  ListTitle: 'text-[17px] font-semibold leading-6',
  /** 占位/加载失败提示 — 13 / 20px 行高 */
  Caption: 'text-[13px] leading-5',
  /** 聊天输入框文字 — 17 / 22px 行高 */
  ChatInput: 'text-[17px] leading-[22px]',
  /** 密钥/代码文字 — 等宽 14 / 20px 行高 */
  Code: 'font-mono text-[14px] leading-5',
  /** 封面首字母(大,48px 封面) — 20 Semibold */
  CoverInitialLg: 'text-[20px] font-semibold',
  /** 封面首字母(小,32px 封面) — 15 Semibold */
  CoverInitialSm: 'text-[15px] font-semibold',
  /** 底部标签栏文字 — 10 / 14px 行高 */
  TabLabel: 'text-[10px] leading-[14px]',
  /** 正文 — 17 Regular / 24px 行高,列表行、表单字段、输入框等主要内容 */
  Body: 'text-[17px] leading-6',
  /** 三级标题 / 分组标题、列表副标题 — 15 Regular / 20px 行高 */
  GroupTitle: 'text-[15px] leading-5',
  /** 次要描述 — 15 Regular / 22px 行高,卡片描述等多行文案 */
  SubBody: 'text-[15px] leading-[22px]',
  /** 辅助内容 — 14 Regular / 20px 行高,提示、错误、Toast、说明文字 */
  Desc: 'text-[14px] leading-5',
  /** 注释 — 12 Regular,时间分隔线、角标说明 */
  Footnote: 'text-[12px] leading-4',
};

export const zIndex = {
  pageHeader: 20,
  bottomTabBar: 30,
  chatFooter: 40,
  imagePreview: 2000,
  videoPlayer: 2100,
  menu: 4500,
  videoPreview: 4800,
  dialog: 5000,
  voiceRecording: 5200,
  toast: 5500,
  topTips: 5600,
} as const;

export const styles = {
  Font: font,
  Common: {
    PagePadding: 'px-4',
    SectionGap: 'mt-6',
    AvatarRounded: 'rounded-lg',
    Spin: 'animate-spin',
  },
  Page: {
    Root: 'min-h-[100dvh] bg-canvas text-ink',
    GroupedRoot: 'min-h-[100dvh] bg-grouped text-ink',
    SurfaceRoot: 'min-h-[100dvh] bg-surface text-ink',
    Content: 'pt-3 pb-[calc(1.5rem+var(--sab))]',
    ContentTabbed: 'pt-3 pb-[calc(4.5rem+var(--sab))]',
  },
  Choice: {
    Input:
      'relative h-8 w-[52px] flex-none appearance-none rounded-full bg-line transition-colors checked:bg-accent ' +
      'before:absolute before:left-[2px] before:top-[2px] before:h-7 before:w-7 before:rounded-full before:bg-white ' +
      'before:shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] before:transition-transform checked:before:translate-x-5 disabled:opacity-40',
    CheckboxCircle:
      'relative h-5 w-5 flex-none appearance-none rounded-full border border-placeholder bg-transparent transition-colors ' +
      'checked:border-accent checked:bg-accent disabled:opacity-40 ' +
      'checked:after:absolute checked:after:left-1/2 checked:after:top-[45%] checked:after:h-[10px] checked:after:w-[5px] ' +
      "checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:rotate-45 checked:after:border-b-2 checked:after:border-r-2 checked:after:border-white checked:after:content-['']",
  },
  Header: {
    Root:
      'sticky top-0 grid min-h-[calc(44px+var(--sat))] grid-cols-[88px_minmax(0,1fr)_88px] items-center relative ' +
      'pt-[var(--sat)] pl-[calc(4px+var(--sal))] pr-[calc(4px+var(--sar))]',
    Title: cx('min-w-0 overflow-hidden text-center text-ellipsis whitespace-nowrap', font.NavTitle),
  },
  Button: {
    HeaderSave: cx(
      'mr-2 inline-grid h-8 min-w-[56px] place-items-center rounded bg-accent px-3 text-onaccent transition active:opacity-85 disabled:opacity-40',
      font.HeaderButton,
    ),
    Icon: 'inline-grid h-11 w-11 place-items-center text-ink transition-opacity active:opacity-50 disabled:text-muted disabled:opacity-40',
    Send: cx(
      'inline-grid h-8 min-w-[54px] place-items-center rounded px-3 bg-accent text-onaccent transition active:opacity-85 disabled:opacity-40',
      font.ButtonSmall,
    ),
    IconOnDark:
      'inline-grid place-items-center w-9 h-9 flex-none rounded-full text-white bg-black/45 backdrop-blur-sm transition active:bg-black/65',
  },
  Cell: {
    GroupStack: 'flex flex-col gap-2',
    InsetGroup: 'relative bg-surface overflow-hidden',
    RowLabel: cx('flex-1 min-w-0', font.Body),
    RowValue: cx(
      'max-w-[55%] flex-none overflow-hidden text-right text-muted text-ellipsis whitespace-nowrap',
      font.Body,
    ),
    GroupStackLoose: 'flex flex-col gap-3',
    CheckIcon: 'flex-none text-accent',
  },
  Field: {
    InputRow: 'flex min-h-[56px] items-center bg-surface px-4',
    BareInput: cx('min-w-0 flex-1 bg-transparent text-ink placeholder:text-placeholder', font.Body),
  },
  Action: {
    DangerCell: cx(
      'flex min-h-[56px] w-full items-center justify-center bg-surface px-4 text-center text-danger transition-colors active:bg-soft',
      font.Body,
    ),
  },
  WeuiButton: {
    Primary: cx(
      'relative mx-auto block w-fit min-w-[184px] max-w-[280px] rounded-lg bg-accent px-6 py-3 text-center text-onaccent transition active:brightness-90 disabled:bg-black/5 disabled:text-black/15',
      font.EmBody,
    ),
    Default: cx(
      'relative mx-auto block w-fit min-w-[184px] max-w-[280px] rounded-lg bg-soft px-6 py-3 text-center text-ink transition active:brightness-95 disabled:opacity-40',
      font.EmBody,
    ),
    Warn: cx(
      'relative mx-auto block w-fit min-w-[184px] max-w-[280px] rounded-lg bg-danger px-6 py-3 text-center text-white transition active:brightness-90 disabled:bg-black/5 disabled:text-black/15',
      font.EmBody,
    ),
  },
  WeuiForm: {
    Root: 'flex min-h-[calc(100dvh-132px-var(--sat))] flex-col',
    TextArea: 'px-8 pt-10 text-center',
    Title: cx('m-0 text-ink', font.PageTitle),
    Description: cx('mx-auto mt-3 max-w-[320px] text-muted [overflow-wrap:anywhere]', font.SubBody),
    ControlArea: 'mb-6 mt-8 flex-1 px-8',
    CellsGroup: 'mt-10 first:mt-0',
    CellsTitle: cx('m-0 border-b border-line pb-3 text-muted', font.GroupTitle),
    TipsArea: 'mb-6 px-8 text-center',
    OprArea: 'px-8',
    OprStack: 'flex flex-col gap-4',
    PageMain: 'bg-surface pb-[calc(1.75rem+var(--sab))]',
  },
  FeatureCard: {
    Root: 'flex w-full items-start gap-4 rounded-[10px] bg-surface px-5 py-[18px] text-left transition-colors active:bg-soft',
    Icon: 'mt-px flex-none text-ink',
    Body: 'flex min-w-0 flex-1 flex-col gap-1',
    Title: cx(font.EmBody, 'text-ink'),
    Description: cx(font.SubBody, 'text-muted'),
    Chevron: 'flex-none self-center text-placeholder',
  },
  Link: {
    Footer: cx(
      'mx-auto block px-4 py-2 text-center text-link transition-opacity active:opacity-60',
      font.Body,
    ),
  },
  Text: {
    Hint: cx(font.Desc, 'text-muted'),
    Error: cx(font.Desc, 'text-danger'),
  },
  Dialog: {
    Root: 'fixed inset-0',
    Backdrop: 'absolute inset-0 bg-black/50',
    Dialog:
      'absolute left-4 right-4 top-1/2 mx-auto flex max-h-[90%] max-w-[320px] -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-surface text-center outline-none',
    Title: cx('flex-none px-6 pb-4 pt-8 text-center text-ink', font.EmBody),
    Message: cx(
      'flex min-h-10 min-w-0 flex-col justify-center overflow-y-auto px-6 pb-8 pt-8 text-center text-ink [-webkit-overflow-scrolling:touch]',
      font.EmBody,
    ),
    MessageWithTitle: cx(
      'min-h-0 overflow-y-auto px-6 pb-8 text-center text-muted [-webkit-overflow-scrolling:touch]',
      font.Body,
    ),
    Actions:
      'relative flex flex-none before:absolute before:left-0 before:right-0 before:top-0 before:h-px before:bg-line',
    CancelButton: cx('h-16 min-w-0 flex-1 text-ink transition-colors active:bg-soft', font.Button),
    ConfirmButton: cx(
      'relative h-16 min-w-0 flex-1 transition-colors active:bg-soft before:absolute before:bottom-0 before:left-0 before:top-0 before:w-px before:bg-line',
      font.Button,
    ),
    ConfirmPrimary: 'text-link',
    ConfirmDanger: 'text-danger',
  },
  // 文本编辑半屏弹窗(WeUI half-screen-dialog 风格,与 VideoPreview 一致):
  // 底部贴边、圆角 12px、左右 24px(含安全区),标题/关闭 + 输入框 + 取消/保存。
  TextInputDialog: {
    Root: 'fixed inset-0 flex items-end bg-black/40',
    Backdrop: 'absolute inset-0',
    Sheet:
      'relative w-full rounded-t-xl bg-surface pt-2 pb-[calc(var(--sab)+16px)] ' +
      'pl-[calc(24px+var(--sal))] pr-[calc(24px+var(--sar))]',
    Header: 'relative flex min-h-[44px] items-center justify-center',
    Title: 'text-[15px] font-medium leading-6 text-ink',
    CloseButton:
      'absolute right-0 grid h-8 w-8 place-items-center text-muted transition active:opacity-60',
    FieldWrap: 'pb-3 pt-1',
    Textarea: cx(
      'block h-[144px] max-h-[42dvh] w-full rounded-lg bg-soft px-3 py-2.5 text-left text-ink placeholder:text-placeholder [-webkit-user-select:text] [user-select:text]',
      font.Body,
    ),
    // 样式四:取消(default) + 保存(primary) 并排。
    Actions: 'flex items-center gap-3',
    CancelButton: cx(
      'flex-1 rounded-lg bg-soft py-3 text-center text-ink transition active:brightness-95',
      font.EmBody,
    ),
    SaveButton: cx(
      'flex-1 rounded-lg bg-accent py-3 text-center text-onaccent transition active:brightness-90 disabled:opacity-40',
      font.EmBody,
    ),
  },
  NotebookPicker: {
    Root: 'fixed inset-0 flex items-end bg-black/40',
    Backdrop: 'absolute inset-0',
    Sheet:
      'relative flex h-[56dvh] max-h-[480px] min-h-[340px] w-full flex-col rounded-t-xl bg-surface pt-2 ' +
      'pl-[calc(24px+var(--sal))] pr-[calc(24px+var(--sar))] pb-[var(--sab)]',
    Header: 'relative flex min-h-[44px] flex-none items-center justify-center',
    Title: 'text-[15px] font-medium leading-6 text-ink',
    CloseButton:
      'absolute right-0 grid h-8 w-8 place-items-center text-muted transition active:opacity-60',
    SearchBox: 'mb-2 flex h-10 flex-none items-center gap-2 rounded-lg bg-soft px-3 text-muted',
    SearchIcon: 'flex-none text-placeholder',
    SearchInput: cx(
      'min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-placeholder [-webkit-user-select:text] [user-select:text]',
      font.Body,
    ),
    List: 'min-h-0 flex-1 overflow-y-auto pb-4 [-webkit-overflow-scrolling:touch]',
    Item: 'relative flex min-h-14 w-full items-center gap-3 rounded-lg bg-surface px-0 text-left transition active:bg-soft',
    ItemCover: 'h-9 w-9 rounded-md',
    ItemCoverText: font.CoverInitialSm,
    ItemName: cx(
      'min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-ink',
      font.Body,
    ),
    Empty: cx('grid min-h-32 place-items-center px-2 text-center text-muted', font.Body),
  },
  AttachmentImage: {
    ImageButton:
      'relative block w-full select-none touch-manipulation overflow-hidden rounded bg-transparent p-0 [-webkit-touch-callout:none]',
    Image:
      'block w-full select-none rounded bg-soft object-cover aspect-[var(--message-image-aspect-ratio)]',
    PlaceholderFull: 'w-full rounded aspect-[var(--message-image-aspect-ratio)]',
    PlaceholderOverThumb: 'absolute inset-0 rounded',
    LivePhotoBadge:
      'absolute right-2 top-2 z-[1] grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition active:bg-black/70',
  },
  ImagePreview: {
    Portal: 'fixed inset-0',
    Photo: 'image-preview',
    OverlayRoot: 'pointer-events-none fixed inset-0 grid place-items-center',
    Failed: 'h-[72px] w-[96px] rounded-lg',
    SpinnerBox: 'grid h-[72px] w-[72px] place-items-center rounded-lg bg-[#4c4c4c]/90',
    Spinner: 'h-8 w-8 border-[3px]',
  },
  // 视频预览半屏弹窗(WeUI half-screen-dialog 风格):顶部拖动条 + 标题/关闭,
  // 圆角 12px、左右 24px(含安全区)。
  VideoPreview: {
    Root: 'fixed inset-0 flex items-end bg-black/40',
    Backdrop: 'absolute inset-0',
    Sheet:
      'relative w-full rounded-t-xl bg-surface pt-2 pb-[calc(var(--sab)+16px)] ' +
      'pl-[calc(24px+var(--sal))] pr-[calc(24px+var(--sar))]',
    Header: 'relative flex min-h-[44px] items-center justify-center',
    Title: 'text-[15px] font-medium leading-6 text-ink',
    CloseButton:
      'absolute right-0 grid h-8 w-8 place-items-center text-muted transition active:opacity-60',
    MediaFrame:
      'relative mt-1 flex items-center justify-center overflow-hidden rounded-xl bg-black',
    MediaFramePortrait: 'mx-auto h-[52vh] w-[29.25vh] max-w-full',
    MediaFrameLandscape: 'mx-auto aspect-video w-full max-w-[60.444vh]',
    PlayerBoxPortrait: 'h-full w-full',
    PlayerBoxLandscape: 'h-full w-full',
    PlayButton: 'relative flex h-full w-full items-center justify-center',
    Thumbnail: 'block h-full w-full object-cover',
    ThumbnailPortrait: '',
    ThumbnailLandscape: '',
    ThumbnailFallback: 'block h-full w-full',
    ThumbnailFallbackPortrait: '',
    ThumbnailFallbackLandscape: '',
    PlayOverlay: 'pointer-events-none absolute inset-0 grid place-items-center',
    PlayIconBox: 'grid h-14 w-14 place-items-center rounded-full bg-black/45',
    PlayIcon: 'ml-0.5',
    DurationBadge: cx(
      'pointer-events-none absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-white tabular-nums',
      font.Footnote,
    ),
    CheckboxRow: cx('flex items-center gap-3 pb-3 pt-4 text-ink', font.EmBody),
    Divider: 'h-px bg-line',
    EstimateRow: 'flex items-center justify-between gap-3',
    EstimateRowWithCheckbox: 'min-h-[40px] pb-3 pt-0',
    EstimateRowStandalone: 'pb-2 pt-4',
    EstimateLabel: cx('text-muted', font.Body),
    EstimateValue: 'flex items-center gap-1.5',
    EstimateNumber: cx('text-ink tabular-nums', font.ListTitle),
    EstimateSuffix: cx('text-muted', font.SubBody),
    // 样式四:取消(default) + 确认保存(primary) 并排。
    Actions: 'flex items-center gap-3 pt-0',
    CancelButton: cx(
      'flex-1 rounded-lg bg-soft py-3 text-center text-ink transition active:brightness-95',
      font.EmBody,
    ),
    ConfirmButton: cx(
      'flex-1 rounded-lg bg-accent py-3 text-center text-onaccent transition active:brightness-90',
      font.EmBody,
    ),
  },
  VideoPlayerOverlay: {
    Root: 'fixed inset-0 box-border grid place-items-center bg-black pt-[var(--sat)] pb-[calc(var(--sab)+16px)]',
    CloseButton:
      'absolute right-3 top-[calc(var(--sat)+12px)] z-[1] grid h-10 w-10 place-items-center rounded-full border-0 bg-black/45 text-white',
    Hint: cx('px-8 text-center text-white/85', font.Body),
  },
  PageHeader: {
    ToneNav: 'bg-nav',
    ToneSurface: 'bg-surface',
    Left: 'flex min-w-0 items-center justify-start',
    Right: 'flex min-w-0 items-center justify-end',
  },
  BottomTabBar: {
    Root: cx(
      'fixed inset-x-0 bottom-0 grid grid-cols-3 bg-nav pb-[var(--sab)]',
      'before:absolute before:left-0 before:right-0 before:top-0 before:h-px before:bg-line',
    ),
    Button: cx(
      'flex min-h-[60px] flex-col items-center justify-center gap-0.5 py-2 transition-colors active:bg-soft',
      font.TabLabel,
    ),
    ButtonActive: 'text-accent',
    ButtonInactive: 'text-muted',
    Label: 'block max-w-full overflow-hidden text-ellipsis whitespace-nowrap',
  },
  CalendarPage: {
    Root: 'min-h-[100dvh] bg-canvas text-ink',
    Content: 'pb-[calc(4.5rem+var(--sab))]',
  },
  // 顶部日历卡片(白色模块):底部细线 + 下方灰色间隙形成分组
  CalendarCard: {
    Root: 'bg-surface border-b border-line pb-3 pt-2 pl-[calc(12px+var(--sal))] pr-[calc(12px+var(--sar))]',
    // 月份导航:箭头紧贴标题居中,“今天”绝对定位于右侧
    MonthRow: 'relative flex items-center justify-center gap-4 pb-2 pt-1',
    MonthButton:
      'grid h-8 w-8 place-items-center rounded-full text-muted transition-colors active:bg-soft disabled:opacity-30 disabled:active:bg-transparent',
    MonthTitle: cx(
      'min-w-0 overflow-hidden text-center text-ellipsis whitespace-nowrap text-ink',
      'text-[16px] font-medium leading-6',
    ),
    TodayButton:
      'absolute right-0 top-1/2 -translate-y-1/2 px-1 text-[13px] leading-5 text-link transition-opacity active:opacity-60',
    WeekRow: 'mb-1 grid grid-cols-7 text-center text-[12px] leading-5 text-placeholder',
    // 月份轮播:视口裁掉相邻面板,轨道横向平移跟手滑动
    SliderViewport: 'overflow-hidden touch-pan-y',
    SliderTrack: 'flex w-[300%] items-start will-change-transform',
    SliderPanel: 'w-1/3 shrink-0',
  },
  // 日期单元格:数字居上,下方留一行占位保持行高(ROW_HEIGHT)一致
  MonthGrid: {
    DayGrid: 'grid grid-cols-7 gap-y-1',
    DayButton: 'flex flex-col items-center py-[3px] disabled:cursor-default',
    DayInner:
      'grid h-[30px] w-[30px] place-items-center rounded-full text-[15px] leading-none transition-colors',
    DayNormal: 'text-ink',
    DayPastEmpty: 'text-[rgba(0,0,0,.38)] dark:text-[rgba(255,255,255,.32)]',
    DayFuture: 'text-placeholder',
    DaySelected: 'bg-accent text-onaccent font-medium',
    DayDotRow: 'mt-0.5 flex h-1.5 justify-center',
  },
  // 当日记录(独立白色模块,顶部留灰色间隙)
  DayRecords: {
    Root: 'mt-2 bg-surface pb-3.5 pt-3 pl-[calc(14px+var(--sal))] pr-[calc(14px+var(--sar))]',
    Title: 'mb-1.5 text-[13px] leading-5 text-muted',
    Timeline:
      'relative flex flex-col gap-5 before:absolute before:left-[42px] before:top-1 before:bottom-1 before:z-0 before:w-[1.5px] before:-translate-x-1/2 before:bg-[rgba(0,0,0,.08)] dark:before:bg-[rgba(255,255,255,.08)]',
    Empty: 'py-12 text-center text-[13px] leading-5 text-placeholder',
  },
  DayRecordItem: {
    Root: 'relative grid grid-cols-[32px_12px_minmax(0,1fr)] gap-x-1',
    Time: 'block h-4 text-left text-[11px] leading-4 text-[rgba(0,0,0,.4)] dark:text-[rgba(255,255,255,.4)]',
    Point:
      "relative z-10 grid h-4 w-full place-items-center after:block after:h-2 after:w-2 after:rounded-full after:border-2 after:border-surface after:bg-[#c7c7c7] after:content-[''] dark:after:bg-[#666]",
    Body: 'min-w-0 text-left',
    MediaBody: 'relative min-w-0 text-left',
    MediaOpenButton: 'absolute inset-0 z-0 h-full w-full text-left',
    MediaContent: 'pointer-events-none relative z-10 min-w-0',
    NotebookName:
      'mb-1.5 block h-4 max-w-[175px] overflow-hidden text-ellipsis whitespace-nowrap text-[11px] leading-4 text-[rgba(0,0,0,.35)] dark:text-[rgba(255,255,255,.35)]',
  },
  CalendarRecordText: {
    Root: 'whitespace-pre-wrap text-[15px] font-normal leading-[1.55] text-ink [overflow-wrap:anywhere]',
  },
  CalendarRecordAudio: {
    Root: 'flex min-w-0 flex-col items-start gap-2',
    Button:
      'pointer-events-auto flex min-h-10 items-center justify-between rounded bg-bubble px-3 py-2 text-left text-onbubble transition active:opacity-85',
    WaveIcon: 'inline-block h-5 w-5 origin-center rotate-90',
  },
  CalendarRecordImage: {
    Button:
      'pointer-events-auto relative block h-[120px] w-[120px] overflow-hidden rounded-[10px] bg-soft',
    Image: 'h-[120px] w-[120px] rounded-[10px] bg-soft object-cover',
    Placeholder: 'block h-[120px] w-[120px] rounded-[10px] bg-soft',
    LivePhotoBadge:
      'absolute right-1.5 top-1.5 z-[1] grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition active:bg-black/70',
  },
  CalendarRecordVideo: {
    Root: 'min-w-0',
    PreviewBox:
      'pointer-events-auto relative mb-2 block h-[120px] w-[120px] overflow-hidden rounded-[10px] bg-soft',
    PreviewImage: 'block h-full w-full object-cover',
    PreviewPlaceholder: 'block h-full w-full bg-soft',
    PlayBadge:
      'pointer-events-none absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white',
    PlayIcon: 'ml-0.5',
    BottomOverlay: cx(
      'pointer-events-none absolute inset-x-0 bottom-0 flex h-7 items-center justify-between gap-2 bg-black/50 px-2 text-white backdrop-blur-[1px]',
      font.Footnote,
    ),
    SizeBadge: 'min-w-0 overflow-hidden text-ellipsis whitespace-nowrap drop-shadow',
    DurationBadge: 'flex-none tabular-nums drop-shadow',
  },
  // 「查找日记内容」入口:居中提示 + 快捷入口(日期 / 图片与视频)
  DiarySearchPage: {
    Root: 'flex min-h-[55dvh] flex-col items-center justify-center gap-7 px-8 text-center',
    Hint: 'text-[15px] leading-5 text-placeholder',
    Grid: 'flex items-center justify-center gap-4',
    Option: cx('text-link transition active:opacity-60', font.Body),
    Divider: cx('select-none text-line', font.Body),
  },
  // 「图片与视频」相册:按月分组,每行 4 个 1:1 方图
  DiaryMediaPage: {
    Content: 'pb-[calc(1.5rem+var(--sab))]',
    Section: 'mb-1',
    MonthTitle: 'px-3 pb-1.5 pt-3 text-[13px] leading-5 text-muted',
    Grid: 'grid grid-cols-4 gap-0.5 px-0.5',
    Cell: 'relative block aspect-square w-full overflow-hidden bg-soft transition active:opacity-85',
    Image: 'h-full w-full object-cover',
    Placeholder: 'h-full w-full bg-soft',
    VideoPlayBadge:
      'pointer-events-none absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white',
    VideoPlayIcon: 'ml-0.5',
    Empty: 'px-8 py-16 text-center text-[15px] leading-6 text-placeholder',
  },
  ImageLoading: {
    PlaceholderBase: 'grid place-items-center overflow-hidden bg-soft',
    FailedBase: cx('grid place-items-center overflow-hidden bg-soft text-center', font.Caption),
    FailedLight: 'bg-[#4c4c4c]/90 text-white/85',
    FailedMuted: 'text-muted',
    SpinnerBase: 'block h-5 w-5 animate-spin rounded-full border-2',
    SpinnerLight: 'border-white/30 border-l-white',
    SpinnerMuted: 'border-muted/20 border-l-muted/70',
  },
  WeuiFormParts: {
    GroupBody: 'border-b border-line',
    FieldWrap:
      'relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-line [&:last-child::after]:hidden',
    FieldRow: 'flex min-h-[56px] items-center bg-surface py-4',
    FieldLabel: cx('mr-3 w-[105px] flex-none text-ink', font.Body),
    FieldInput: cx(
      'min-w-0 flex-1 bg-transparent text-ink placeholder:text-placeholder',
      font.Body,
    ),
    FileInput: 'hidden',
    FileRow:
      'flex min-h-[56px] w-full items-center bg-surface py-4 text-left transition-colors active:bg-soft disabled:opacity-60',
    FileValue: cx(
      'min-w-0 flex-1 overflow-hidden text-right text-muted text-ellipsis whitespace-nowrap',
      font.Body,
    ),
    FileChevron: 'ml-2 flex-none text-placeholder',
    OptionRow:
      'relative flex min-h-[56px] w-full items-center gap-3 bg-surface py-4 text-left transition-colors active:bg-soft disabled:opacity-60 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-line [&:last-child::after]:hidden',
    OptionLabel: cx('min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap', font.Body),
    FieldError: cx('-mt-1.5 mb-0 pb-3 text-danger', font.Desc),
    ToggleRow: cx(
      'relative flex min-h-[56px] items-center justify-between gap-3 bg-surface py-4 text-left',
      font.Body,
      'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-line [&:last-child::after]:hidden',
    ),
    ReadonlyField:
      'relative flex min-h-[56px] items-center bg-surface py-4 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-line [&:last-child::after]:hidden',
    ReadonlyLabel: cx('mr-3 w-[105px] flex-none text-muted', font.Body),
    ReadonlyValue: cx('min-w-0 flex-1 [overflow-wrap:anywhere] text-ink', font.Body),
    NavigationRow:
      'relative flex w-full items-center gap-6 py-[18px] text-left transition-colors after:absolute after:bottom-0 after:left-[50px] after:right-0 after:h-px after:bg-line [&:last-child::after]:hidden active:bg-soft',
    NavigationIcon: 'flex-none text-ink',
    NavigationBody: 'flex min-w-0 flex-1 flex-col gap-0.5',
    NavigationTitle: cx(font.Body, 'text-ink'),
    NavigationChevron: 'flex-none text-placeholder',
  },
  SpeechRecognitionSettingsPage: {
    ProviderIcon: 'h-7 w-7 rounded-[4px]',
  },
  VoiceRecording: {
    Overlay:
      'pointer-events-none fixed inset-0 flex flex-col items-center justify-center bg-black/40',
    Panel:
      'flex w-[220px] flex-col items-center justify-center gap-2.5 rounded-[20px] bg-[#4a4a4a] px-7 py-5 text-white',
    Timer: 'text-[15px] font-semibold tabular-nums',
    TimerNormal: 'text-white/90',
    TimerWarning: 'text-warning',
    CancelIconBox: 'flex h-9 items-center justify-center',
    CancelIcon: 'text-danger',
    Waveform: 'flex h-9 items-center justify-center gap-[3px]',
    WaveformBar: 'w-[3px] flex-none rounded-full bg-current',
    Hint: 'text-center text-[13px] font-medium leading-4',
    HintCancel: 'text-danger',
    HintDefault: 'text-white/75',
    HoldButton:
      'h-10 min-w-0 flex-1 select-none rounded text-[16px] font-medium text-ink transition-colors [touch-action:none]',
    HoldButtonIdle: 'bg-surface',
    HoldButtonActive: 'bg-soft',
    HoldButtonContent: 'inline-flex items-center justify-center gap-1.5',
    HoldPreparingDots: 'inline-flex items-center gap-[3px] pb-0.5',
    HoldPreparingDot: 'transcribe-dot',
  },
  Toast: {
    Root: 'fixed inset-0',
    RootPassive: 'pointer-events-none fixed inset-0',
    Box: 'fixed left-1/2 top-[40%] box-border flex min-w-[132px] max-w-[320px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-lg bg-[#4c4c4c] px-5 py-7 text-center text-white/90 drop-shadow-[0_8px_25px_rgba(0,0,0,0.1)]',
    BoxCompact:
      'fixed left-1/2 top-[40%] box-border flex max-w-[280px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-[#4c4c4c] px-5 py-3 text-center text-white/90 drop-shadow-[0_8px_25px_rgba(0,0,0,0.1)]',
    Content: 'flex flex-col items-center gap-4',
    Spinner: 'h-10 w-10 animate-spin rounded-full border-4 border-[#ededed]/30 border-l-[#ededed]',
    Message: font.Desc,
  },
  LongPressMenu: {
    Root: 'fixed inset-0',
    Backdrop: 'absolute inset-0 bg-transparent',
    Panel:
      'fixed grid grid-cols-[repeat(var(--menu-columns),64px)] overflow-hidden rounded-lg bg-[#4c4c4c] px-2 py-2 text-white/90 shadow-[0_10px_28px_rgba(0,0,0,0.22)]',
    Action:
      'flex h-[56px] w-16 flex-col items-center justify-center gap-1.5 text-center transition active:bg-white/10 disabled:opacity-45',
    Icon: 'grid h-6 w-6 place-items-center',
    Label: cx(font.Footnote, 'block w-full overflow-hidden text-ellipsis whitespace-nowrap'),
  },
  NotebookCover: {
    Thumb: 'flex-none rounded bg-soft',
    ThumbImage: 'flex-none rounded bg-soft object-cover',
    Placeholder: 'grid flex-none place-items-center rounded bg-soft text-muted',
    Initial: 'grid flex-none place-items-center rounded bg-soft text-muted',
  },
  CellList: {
    GroupTitle: cx('mb-2 px-4 text-muted', font.Desc),
    Group: 'relative bg-surface overflow-hidden',
    GroupBordered: cx(card, 'overflow-hidden'),
    GroupDividers:
      '[&>*+*]:relative [&>*+*]:before:absolute [&>*+*]:before:left-4 [&>*+*]:before:right-0 [&>*+*]:before:top-0 [&>*+*]:before:h-px [&>*+*]:before:bg-line',
    Row: 'flex min-h-[56px] w-full items-center gap-3 bg-surface px-4 text-left',
    RowPressable: 'transition-colors active:bg-soft disabled:opacity-60 disabled:active:bg-surface',
    Icon: 'grid h-6 w-6 flex-none place-items-center text-muted',
    Chevron: 'flex-none text-muted',
    RightImage: 'h-8 w-8 flex-none rounded-md bg-soft object-cover',
    RightImageFallback:
      'grid h-8 w-8 flex-none place-items-center overflow-hidden rounded-md bg-soft text-muted',
    RightInitial: cx(
      'grid h-8 w-8 flex-none place-items-center rounded-md bg-soft text-muted',
      font.CoverInitialSm,
    ),
    Action: cx(
      'flex min-h-[56px] w-full items-center justify-center bg-surface px-4 text-center transition-colors active:bg-soft disabled:opacity-60 disabled:active:bg-surface',
      font.Body,
    ),
    ActionDanger: '!text-danger',
  },
  UserAvatar: {
    Root: 'grid flex-none place-items-center overflow-hidden rounded-md bg-soft text-muted',
    ImageFit: 'object-cover',
  },
  UploadFailureIndicator: {
    Button: cx(
      'grid h-[21px] w-[21px] flex-none place-items-center rounded-full bg-danger text-center text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition active:brightness-95',
      'text-[15px] font-medium leading-[21px]',
    ),
  },
  ActionSheet: {
    Root: 'fixed inset-0',
    Backdrop: 'absolute inset-0 bg-black/50 transition-opacity duration-300 ease-out',
    BackdropHidden: 'opacity-0',
    BackdropVisible: 'opacity-100',
    Panel:
      'absolute inset-x-0 bottom-0 overflow-hidden rounded-t-xl bg-canvas transition-transform duration-300 ease-out will-change-transform',
    PanelHidden: 'translate-y-full',
    PanelVisible: 'translate-y-0',
    ActionGroup: 'bg-surface',
    Header:
      'flex flex-col gap-1 border-b border-line py-3 pl-[calc(24px+var(--sal))] pr-[calc(24px+var(--sar))] text-center',
    Caption: cx('text-muted', font.Footnote),
    Description: cx('text-muted [overflow-wrap:anywhere]', font.Footnote),
    Action: cx(
      'grid min-h-14 w-full place-items-center border-b border-line bg-surface py-4 pl-[calc(16px+var(--sal))] pr-[calc(16px+var(--sar))] text-center leading-6 transition active:bg-soft disabled:opacity-40',
      font.Button,
    ),
    ActionLast: 'border-b-0',
    ActionDefault: 'text-ink',
    ActionDanger: 'text-danger',
    CancelAction: cx(
      'mt-2 grid min-h-14 w-full place-items-center bg-surface py-4 pb-[calc(16px+var(--sab))] pl-[calc(16px+var(--sal))] pr-[calc(16px+var(--sar))] text-center text-ink leading-6 transition active:bg-soft',
      font.Button,
    ),
  },
  UploadImageMessage: {
    Root: 'flex flex-col items-end',
    RootLeft: 'flex flex-col items-start',
    // 失败图标放在靠屏幕中间的一侧:右侧消息在图片左边,左侧身份消息镜像到右边。
    FailedRow: 'flex items-center justify-end gap-2',
    FailedRowLeft: 'flex items-center justify-start gap-2',
    ImageBox:
      'relative w-[min(64vw,var(--message-image-fit-width),180px)] overflow-hidden rounded-md',
    UploadingOverlay: 'absolute inset-0 grid place-items-center rounded-md bg-black/45 text-white',
    FailedOverlay: 'absolute inset-0 rounded-md bg-black/[0.18]',
  },
  VideoMessage: {
    PlayBadge: 'pointer-events-none absolute inset-0 flex items-center justify-center',
    PlayCircle: 'flex h-9 w-9 items-center justify-center rounded-full bg-black/45',
    PlayIcon: 'ml-0.5',
  },
  MePage: {
    Content: 'flex flex-col gap-2 pb-[calc(4.5rem+var(--sab))]',
    ProfileButton:
      'flex w-full items-center gap-5 bg-surface pb-7 pl-6 pr-4 pt-[calc(1.75rem+var(--sat))] text-left transition-colors active:bg-soft',
    ProfileBody: 'min-w-0 flex-1',
    ProfileName: cx(
      'block overflow-hidden text-ellipsis whitespace-nowrap text-ink',
      font.Headline,
    ),
    ProfileMeta: cx(
      'mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-muted',
      font.GroupTitle,
    ),
    Chevron: 'flex-none text-placeholder',
  },
  DiaryListPage: {
    Content: 'min-h-[calc(100dvh-44px)] bg-surface pt-0',
  },
  NotebookItem: {
    Root: 'relative grid min-h-[76px] w-full grid-cols-[48px_minmax(0,1fr)_52px] items-center gap-3 bg-surface px-4 py-2.5 text-left transition-colors after:absolute after:bottom-0 after:left-[76px] after:right-0 after:h-px after:bg-line [&:last-child::after]:hidden active:bg-soft',
    Cover: 'h-12 w-12 rounded-md',
    CoverText: font.CoverInitialLg,
    Body: 'min-w-0',
    TitleRow: 'flex min-w-0 items-baseline gap-2',
    Name: cx('min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap', font.ListTitle),
    Summary: cx(
      'mt-0.5 min-h-5 overflow-hidden text-ellipsis whitespace-nowrap text-muted',
      font.Desc,
    ),
    Time: cx('self-start pt-1 text-right text-muted', font.Desc),
  },
  IdentityItem: {
    Root: 'relative flex min-h-[64px] w-full items-center gap-3 bg-surface px-4 py-2.5 text-left transition-colors after:absolute after:bottom-0 after:left-[76px] after:right-0 after:h-px after:bg-line [&:last-child::after]:hidden active:bg-soft',
    Avatar: 'h-12 w-12 rounded-md',
    Name: cx('min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap', font.ListTitle),
  },
  IdentityListPage: {
    SwitchRow: 'flex min-h-[56px] items-center justify-between gap-3 px-4',
    SwitchLabel: cx('min-w-0 flex-1 text-ink', font.Body),
    ArchivedLink: cx(
      'mx-auto mt-4 block px-4 py-2 text-center text-link transition-opacity active:opacity-60',
      font.Body,
    ),
    Empty: cx('grid place-items-center px-4 py-16 text-center text-muted', font.Desc),
  },
  StartupPage: {
    RootColumn: 'flex flex-col',
    Content: 'flex min-h-0 flex-1 flex-col px-4 pb-[calc(1.5rem+var(--sab))] pt-4',
    Cards: 'flex flex-col gap-4',
    Footer: 'mt-auto pt-10',
  },
  StartupExperiencePage: {
    Root: 'flex min-h-[100dvh] flex-col bg-surface text-ink',
    Content: 'flex min-h-0 flex-1 flex-col px-8 pb-[calc(2.5rem+var(--sab))]',
    TextArea: 'pt-14 text-center',
    Description: cx('mx-auto mt-4 max-w-[320px] text-muted', font.SubBody),
    Actions: 'mt-auto flex flex-col items-center gap-4 pt-16',
  },
  RecoveryKey: {
    Row: 'flex min-h-[56px] items-center gap-2 bg-surface py-2.5',
    Code: cx('min-w-0 flex-1 [overflow-wrap:anywhere] tracking-[0.04em] text-ink', font.Code),
    BackupLabel: cx(
      'mb-6 flex items-center justify-center gap-2 px-8 text-left text-muted',
      font.Desc,
    ),
  },
  DiaryChatPage: {
    RootChat: 'relative overflow-hidden bg-chat',
    Background: 'fixed left-0 top-0 z-0 bg-chat bg-cover bg-center',
    Content: 'relative z-[1] min-h-[100dvh]',
    Main: 'pl-[calc(0.75rem+var(--sal))] pr-[calc(0.75rem+var(--sar))]',
    Empty: cx('grid place-items-center h-full text-muted', font.Desc),
  },
  DiaryChatFooter: {
    // 根容器透明:身份 tag 悬浮在聊天背景上,只有输入区(InputArea)有背景,两者视觉分离。
    Root: 'fixed inset-x-0 bottom-0',
    InputArea:
      'relative bg-canvas pb-[calc(0.625rem+var(--sab))] pl-[calc(0.5rem+var(--sal))] pr-[calc(0.5rem+var(--sar))] pt-2 before:absolute before:left-0 before:right-0 before:top-0 before:h-px before:bg-line',
    InputErrorGap: 'mb-1.5 px-1',
    InputRow: 'flex items-end gap-1',
    TextareaWrap: 'relative flex min-h-10 min-w-0 flex-1 items-end rounded bg-surface',
    Textarea: cx(
      'min-h-10 max-h-[116px] min-w-0 flex-1 bg-transparent py-[9px] px-3 text-ink',
      font.ChatInput,
    ),
    SendSize: 'h-10 min-w-[58px] rounded',
    PlusButton:
      'grid h-10 w-9 flex-none place-items-center text-muted transition active:opacity-60',
    PlusPanel: 'flex flex-wrap gap-x-9 gap-y-5 px-1 pb-4 pt-7',
    PlusAction: 'flex flex-col items-center gap-2 active:opacity-70',
    PlusTile: 'grid h-16 w-16 place-items-center rounded-2xl bg-surface text-ink',
    PlusLabel: cx(font.Footnote, 'text-muted'),
    IdentityTagRow:
      'mb-1.5 flex items-center pl-[calc(1rem+var(--sal))] pr-[calc(1rem+var(--sar))]',
    IdentityTag:
      'flex max-w-full min-w-0 items-center gap-1.5 rounded bg-surface px-2 py-1 text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
    IdentityTagAvatar: 'rounded-full',
    IdentityTagName: cx('min-w-0 overflow-hidden text-ellipsis whitespace-nowrap', font.Desc),
    IdentityTagRemove:
      'grid h-5 w-5 flex-none place-items-center rounded-full text-muted transition active:opacity-60',
  },
  ChatMessage: {
    RowRight: 'flex items-start justify-end gap-2 py-[3px]',
    RowLeft: 'flex items-start justify-start gap-2 py-[3px]',
    // 叠加在带右尾巴的气泡上，把小尾巴翻到左侧；用 ! 确保覆盖基类的 right 定位。
    BubbleTailLeft: 'after:!-left-1 after:!right-auto',
  },
  TextMessage: {
    Root: cx(
      'relative max-w-[min(72vw,340px)] min-h-10 px-3 py-2 rounded bg-bubble text-onbubble text-left whitespace-pre-wrap [overflow-wrap:anywhere]',
      font.Body,
      "after:absolute after:-right-1 after:top-[15px] after:h-2 after:w-2 after:rotate-45 after:rounded-[1px] after:bg-bubble after:content-['']",
    ),
    // 左侧身份消息：仿微信接收方气泡，白色底 + 左侧小尾巴。
    RootLeft: cx(
      'relative max-w-[min(72vw,340px)] min-h-10 px-3 py-2 rounded bg-surface text-ink text-left whitespace-pre-wrap [overflow-wrap:anywhere]',
      font.Body,
      "after:absolute after:-left-1 after:top-[15px] after:h-2 after:w-2 after:rotate-45 after:rounded-[1px] after:bg-surface after:content-['']",
    ),
  },
  ImageMessage: {
    Root: 'relative w-[min(64vw,var(--message-image-fit-width),180px)]',
  },
  DividerMessage: {
    Root: cx('flex items-center justify-center text-muted', font.Footnote),
    Text: 'px-2 py-1',
  },
  UnknownAttachmentMessage: {
    Root: cx(
      'relative flex max-w-[min(72vw,300px)] items-start gap-2 rounded bg-surface px-3 py-2.5 text-left text-ink',
      "after:absolute after:-right-1 after:top-[15px] after:h-2 after:w-2 after:rotate-45 after:rounded-[1px] after:bg-surface after:content-['']",
    ),
    Icon: 'mt-0.5 grid h-8 w-8 flex-none place-items-center rounded bg-soft text-muted',
    Body: 'min-w-0 flex-1',
    Title: cx(font.Desc, 'block font-medium text-ink'),
    Description: cx(font.Footnote, 'mt-0.5 block text-muted'),
  },
  ChatAudio: {
    AudioMessageStack: 'flex max-w-[min(72vw,340px)] flex-col items-end gap-1.5',
    AudioMessageStackLeft: 'flex max-w-[min(72vw,340px)] flex-col items-start gap-1.5',
    AudioMessage: cx(
      'relative flex min-h-10 items-center justify-end gap-1 rounded bg-bubble px-3 py-2 text-left text-onbubble transition active:opacity-85',
      "after:absolute after:-right-1 after:top-[15px] after:h-2 after:w-2 after:rotate-45 after:rounded-[1px] after:bg-bubble after:content-['']",
    ),
    // 左侧身份语音：仿微信接收方气泡，白色底 + 左侧小尾巴，内容靠左。
    AudioMessageLeft: cx(
      'relative flex min-h-10 items-center justify-start gap-1 rounded bg-surface px-3 py-2 text-left text-ink transition active:opacity-85',
      "after:absolute after:-left-1 after:top-[15px] after:h-2 after:w-2 after:rotate-45 after:rounded-[1px] after:bg-surface after:content-['']",
    ),
    AudioWaveIcon: 'inline-block h-5 w-5 origin-center',
    // 波纹方向与微信一致:右侧气泡喇叭口朝左,左侧气泡镜像后朝右。
    AudioWaveIconRight: '-rotate-90',
    AudioWaveIconLeft: 'rotate-90',
    AudioWavePlaying: 'voice-wifi-playing',
    AudioWaveFailed: 'opacity-40',
    AudioDuration: 'text-[16px] leading-6 tabular-nums',
    AudioLoadingSpinner:
      'h-4 w-4 animate-spin rounded-full border-2 border-onbubble/30 border-t-onbubble',
    AudioTranscript: cx(
      'relative rounded bg-surface px-3 py-2 text-left text-ink whitespace-pre-wrap [overflow-wrap:anywhere]',
      font.Body,
    ),
    AudioTranscribing: cx(
      'relative flex h-8 items-center gap-1 rounded bg-surface px-3 text-muted',
      font.Footnote,
    ),
    AudioTranscribingDots: 'inline-flex items-center gap-[3px] pb-0.5',
    AudioTranscribeDot: 'transcribe-dot',
    UploadSendingSpinner:
      'h-3.5 w-3.5 flex-none animate-spin rounded-full border-[1.5px] border-line border-t-placeholder',
    UploadAudioFailedRoot: 'flex flex-col items-end',
    UploadAudioFailedRootLeft: 'flex flex-col items-start',
    UploadFailedRow: 'flex items-center justify-end gap-2',
    UploadFailedRowLeft: 'flex items-center justify-start gap-2',
    UploadAudioRow: 'flex items-center justify-end gap-1.5',
    UploadAudioRowLeft: 'flex items-center justify-start gap-1.5',
    UploadAudioBubble: cx(
      'relative flex min-h-10 items-center justify-end gap-1 rounded bg-bubble px-3 py-2 text-onbubble opacity-80',
      'after:absolute after:-right-1 after:top-[15px] after:h-2 after:w-2 after:rotate-45 after:rounded-[1px] after:bg-bubble after:content-[""]',
    ),
    UploadAudioBubbleLeft: cx(
      'relative flex min-h-10 items-center justify-start gap-1 rounded bg-surface px-3 py-2 text-ink opacity-80',
      'after:absolute after:-left-1 after:top-[15px] after:h-2 after:w-2 after:rotate-45 after:rounded-[1px] after:bg-surface after:content-[""]',
    ),
  },
  S3SettingsPage: {
    SetupContent: 'bg-surface pb-[calc(5.25rem+var(--sab))]',
    ManagementContent: 'pt-3 pb-[calc(1.75rem+var(--sab))]',
    GeneratedKeyCode: cx('min-w-0 flex-1 [overflow-wrap:anywhere] text-ink', font.Code),
    Status: cx('flex items-center justify-center gap-1.5', font.Desc),
    StatusSuccess: 'text-success',
    StatusDanger: 'text-danger',
    StatusText: 'min-w-0 text-left',
    Group: 'mt-5 first:mt-0',
  },
  Membership: {
    PageContent: 'px-3 pt-2 pb-[calc(1.25rem+var(--sab))]',
    HeroCard: 'rounded-[10px] bg-surface px-5 pb-8 pt-9 text-center',
    HeroIcon: 'mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full [&>svg]:h-8 [&>svg]:w-8',
    HeroIconActive: 'bg-accent text-onaccent',
    HeroIconPurchase: 'bg-[#e6a817] text-white',
    HeroTitle: cx('m-0 text-ink', font.Headline),
    HeroDesc: cx('m-0 mt-1 text-muted', font.Desc),
    Card: 'flex min-h-12 items-center justify-between gap-3 rounded-[10px] bg-surface py-2 pl-4 pr-2',
    AccountLabel: cx('m-0 mb-2 mt-4 px-4 text-muted', font.Desc),
    AccountId: cx('min-w-0 flex-1 [overflow-wrap:anywhere] text-ink', font.Code),
    CopyButton: cx(
      'inline-grid h-8 w-8 flex-none place-items-center rounded text-accent transition active:bg-accent/10 disabled:opacity-40',
    ),
    FeatureSection: 'overflow-hidden rounded-[10px] bg-surface',
    FeatureSectionTitle: cx('m-0 mb-2 mt-4 px-4 text-muted', font.Desc),
    FeatureRow: 'flex items-center gap-3 px-4 py-3',
    FeatureIcon: 'grid h-6 w-6 flex-none place-items-center text-accent',
    FeatureBody: 'min-w-0 flex-1',
    FeatureTitle: cx('m-0 text-ink', font.Body),
    FeatureDesc: cx('m-0 mt-0.5 text-muted', font.Footnote),
    FeatureBadge: cx('flex-none text-muted', font.Desc),
    FeatureCheck: 'flex-none text-accent',
    PurchaseActions: 'px-0 py-5',
    PurchaseButton: cx(
      'block h-12 w-full rounded-lg bg-accent text-center text-onaccent transition active:brightness-90 disabled:opacity-40',
      font.Button,
    ),
    StepList: 'flex flex-col gap-4 bg-surface py-4',
    StepItem: 'grid grid-cols-[28px_minmax(0,1fr)] gap-3',
    StepNumber: cx(
      'grid h-7 w-7 place-items-center rounded-full bg-soft text-muted',
      font.Footnote,
    ),
    StepBody: 'min-w-0',
    StepTitle: cx('text-ink', font.Body),
    StepDesc: cx('mt-1 text-muted', font.Desc),
    PurchaseLink: cx(
      'mt-3 inline-flex min-h-9 items-center gap-1.5 rounded bg-accent px-3 text-onaccent transition active:brightness-90',
      font.ButtonSmall,
    ),
  },
  StepDots: {
    Root: 'flex gap-1.5 items-center pr-2',
    Dot: 'w-[7px] h-[7px] rounded-full',
    DotActive: 'bg-accent',
    DotInactive: 'bg-line',
  },
  TopTips: {
    Root: cx(
      'fixed left-4 right-4 top-[calc(var(--sat)+8px)] rounded-lg bg-danger px-4 py-2.5 text-center text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]',
      font.Desc,
    ),
  },
  ProgressBar: {
    Track: 'h-2 overflow-hidden rounded-full bg-line',
    Bar: 'h-full rounded-full bg-accent transition-[width]',
  },
  MinimalDiaryImportPage: {
    Status: cx('pt-4 text-center text-muted', font.Desc),
    Error: cx('pt-4 text-center text-danger', font.Desc),
    ResultStats: 'mt-7 flex flex-col gap-0 border-y border-line',
    ResultStatRow: cx(
      'flex min-h-[52px] items-center justify-between gap-4 border-b border-line text-ink last:border-b-0',
      font.Body,
    ),
  },
};
