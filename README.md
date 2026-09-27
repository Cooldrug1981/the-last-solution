# 最后的解答 · 网页版 1.0

一部可以选择的图文故事。22 张牌，18 道问题，54 组选项反馈，三种结局。

出品：大阴希声@UglyNakedGuy

## 游玩

打开部署后的网址，点击“接起电话”。手机可上下滚动阅读。

- 点击对白或按空格：先显示全文，再翻页。
- 回答问题：点选答案，再点“确认回答”。确认后不能通过回看来改答案。
- 键盘数字 1 / 2 / 3 选择回答；左方向键回看；Esc 暂停。
- 设置中可关闭绿色字符动效、调整字速、开启环境音。系统开启“减少动态效果”时，文字直接显示。
- 浏览器自动保存进度。设置中可以导出 JSON 存档，或在另一台设备导入。

游戏不要求玩家注册，没有广告、统计代码或付费入口。故事包含死亡、胁迫和文明危机等虚构情节。角色的判断不代表创作者立场。

## 最简单的 GitHub Pages 发布方法

此文件夹已是完整网站，不需要云端安装依赖，也不需要编译。

1. 自己在浏览器登录 GitHub。不要向任何人发送密码、验证码或访问令牌。
2. 新建专门用于游戏的仓库，例如 `the-last-solution`。免费个人账号可使用公开仓库发布 Pages；公开仓库的网页代码、剧本和图片可被他人下载。确认接受这一点再选择 **Public**。
3. 将发布 ZIP 解压到一个文件夹。把里面的文件和 `assets`、`data` 文件夹上传到仓库的根目录。`index.html` 应直接出现在仓库首页，不能外面再套一层 `web` 或 ZIP 文件夹。
4. 在仓库页面打开 **Settings → Pages**，在 **Build and deployment** 中选择 **Deploy from a branch**。
5. Branch 选择 `main`，文件夹选择 `/(root)`，点击 **Save**。
6. 等待部署结束。回到 Pages 页面，点击显示的网站链接，一般形如 `https://你的用户名.github.io/the-last-solution/`。首次部署可能需要几分钟。
7. 在电脑及 iPhone Safari 各打开一次：开始游戏、回答问题、刷新后继续、导出存档。把确认可用的网址分享给朋友即可。

浏览器上传时若看不到 `.github`、`.nojekyll` 等隐藏文件，可先走上面的“从分支发布”方式；本项目没有以下划线开头的网站资源。图片均已压缩，不需要 Git LFS。不要上传 Windows EXE、整个开发项目、原始文章或个人存档。

### 可选：自动部署工作流

包内 `.github/workflows/pages.yml` 可用于 GitHub Actions 部署。使用 Git 上传完整目录（含隐藏文件）后，将 **Settings → Pages → Source** 改为 **GitHub Actions**，在 **Actions** 页手动运行 `Publish game to GitHub Pages`，或再向 `main` 推送一次提交。工作流只发布网站文件，不需要个人访问令牌。

两种发布方式选择一种即可。如果仓库或组织限制了 Pages / Actions，请依照账户实际可用设置操作，不要绕过组织策略。

官方说明：[从分支发布](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)、[自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。界面名称可能随 GitHub 更新而变化。

## 发布前要知道

- 网站文件无需后端服务器。GitHub Pages 提供静态托管；这不是 App Store 或微信小游戏上架。
- 玩家首次打开及加载新图片时需要网络；未承诺断网可玩，也没有安装离线缓存。
- GitHub Pages 在中国大陆的访问速度和可达性不保证。需用目标网络实测，不能当作大陆稳定分发渠道的保证。
- 不含联网生成剧情、账号系统、云存档、排行榜、支付或多人功能。
- 网页存档与 Windows 版独立。本地预览与正式网址也各自保存进度；迁移请用导出/导入。
- 无痕浏览、清理网站数据或更换浏览器可能丢失进度。重要存档请下载备份。
- 本作不读取设备上的其他文件；只有手动选择的存档文件会在本地解析。GitHub 托管服务会按其隐私声明处理访问日志。
- 公开托管不等于自动获得作品传播或商业运营所需许可；若增加商业化、面向特定地区大规模运营，应另行核查适用要求。

## 本地预览与文件说明

不要直接双击 `index.html`，浏览器可能禁止读取剧本模块。若电脑已安装 Python，在解压目录的终端运行 `python -m http.server 4193 --bind 127.0.0.1`，再打开 `http://127.0.0.1:4193/`。按 Ctrl+C 停止。此命令只供本机预览。

`data/story.json` 为确认后的完整中文定稿；`app.mjs` 为界面，`model.mjs` 为游戏规则；`assets` 包含全部压缩图片和字体。没有远程字体或第三方脚本依赖。

作品、图像与代码的使用说明见 `LICENSE.txt`；素材及创作来源见 `SOURCES.md`；字体采用 SIL OFL 1.1，许可见 `assets/fonts/OFL.txt`。字体已制作网页子集并改名为 TLS Web Pixel。
