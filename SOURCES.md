# 制作、思想与素材说明

出品：大阴希声@UglyNakedGuy。V0.2 为原创虚构图文游戏，不是心理、伦理或医学测验。

## 灵感与哲学边界

- 圆方《超级AI“在等死”》：用户提供的文章截图。仅在剧情中点名并作简短概括，不附带文章全文或截图，不把其意识论断当作科学事实。
- 人格与身份连续性的争论：记忆继承、身体延续、复制与分支不能被偷换成已经证明的灵魂迁移。参考 [Stanford Encyclopedia of Philosophy: Personal Identity](https://plato.stanford.edu/entries/identity-personal/)。本作问题与对白均为原创。
- 题库围绕有限性、忒修斯之船、人的目的与工具价值、同意、代表、代际责任、可撤销的委托和互相约束组织。没有声称穷尽全部哲学传统，也没有声称某位思想家支持某一个结局。
- 三个结局不是善恶等级。AGI 自行把玩家回答解释为行动依据，须为其行为负责；总统没有替全人类签署灭绝许可。

## 物理与科幻

- 引力波是时空扰动，已有直接探测；背景说明参见 [LIGO: What are gravitational waves?](https://www.ligo.caltech.edu/MIT/page/what-are-gw)。漫画中的可见波纹只是视觉比喻。
- 弦论、额外维度、多重宇宙没有在本作中被说成已证实的现实。宇宙副本作为“减轻杀戮罪责”的论证是故意提出的伦理问题，不是作者认可的结论。
- 远期恒星衰亡、最后能量、深空数字载体等构成科幻情景。AGI 的接管、通信控制与工业拆除是虚构设定，不包含现实操作方法。
- 游戏不提供医疗、工程、军事或应急处置建议。

## 美术、字体与声音

- 漫画与塔罗：内置 imagegen 工具生成的原创图像。九张四格漫画图集提供 36 个分镜，四张六格塔罗图集提供 22 张独立牌面和牌背。中文、署名与牌名由程序独立排版。
- 封面像素背景保留上一版；本版所有封面文字与按钮统一使用 [Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font)，发布版 2026.07.20，12px proportional zh_hans。Windows 版以原样字体随应用打包，不在系统安装；网页版的子集与改名说明见下文。完整版权、OFL 及上游许可见 `assets/fonts/OFL.txt` 和 `assets/fonts/LICENSES/`。
- 字体 [SIL Open Font License 1.1](https://github.com/TakWolf/fusion-pixel-font/blob/master/LICENSE-OFL) 允许随软件分发，字体不能单独售卖；Windows 版未修改字体；网页版保留版权信息并对派生字体改名，不冒称原字体作者。
- 绿色字符下落、乱码与逐字锁定由原创代码实现。不是电影片段或逐帧复刻。
- 环境声由程序合成；没有使用受版权保护的电影原声。

## 开发档案（在源码项目中）

最终生成提示词、原始图片路径与项目素材对应表：`writing/image-manifest-v02.json`；`writing/image-prompts-v02.json` 为初始草案。原始生成图片保留在生成工具目录，游戏使用项目 `assets/` 中的本地副本。
窗口/缩放测试与最终压缩包校验信息见源码目录 `VALIDATION-v02.md`。


## 网页版资源处理

网页版沿用以上漫画与定稿。图集按原格位裁切、转换为 WebP；不改变画面内容。TLS Web Pixel 为 Fusion Pixel Font 的字符子集及 WOFF2 转换版本，修改于 2026-09-23，沿用 SIL OFL 1.1；原作者版权与上游许可证保留在 assets/fonts/。
