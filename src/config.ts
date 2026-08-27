// 版本模式配置
// 通过 Vite 构建模式区分：
//   - 正式版：vite build（默认 production 模式，.env.production → VITE_APP_MODE=official）
//   - 测试版：vite build --mode test（.env.test → VITE_APP_MODE=test）
export const APP_MODE: 'official' | 'test' =
  (import.meta.env.VITE_APP_MODE as 'official' | 'test') || 'official';

// 是否为测试版
export const IS_TEST_BUILD = APP_MODE === 'test';

// 是否允许参与者之间切换视角（测试版开启，正式版关闭）
export const ALLOW_SWITCH_PERSPECTIVE = IS_TEST_BUILD;
