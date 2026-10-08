# 欧拉图课堂投票 - GitHub Pages

这个项目是一个纯课堂投票页面：

- 显示 A/B/C/D 四幅图
- 学生直接点击 A/B/C/D
- 显示全班实时结果
- 刷新页面后结果仍保留
- 默认每台设备只能投一次
- GitHub Pages 负责网页，Supabase 负责保存票数

## 一、先看页面效果

如果还没配置 Supabase，也可以直接部署。
此时网页会进入“演示模式”，只会在当前设备保存一票。

## 二、GitHub Pages 部署

把这些文件上传到一个仓库：

- index.html
- style.css
- script.js
- config.js
- assets/euler-question.png

然后：

Settings → Pages → Build and deployment → Deploy from a branch

Branch 选择：

main / root

保存。

稍等一会，就会得到：

https://你的用户名.github.io/仓库名/

如果仓库本身叫：

你的用户名.github.io

那么地址就是：

https://你的用户名.github.io/

## 三、让全班票数永久共享

GitHub Pages 本身不能保存数据库，所以用 Supabase 免费数据库。

1. 注册 Supabase 并新建 Project。
2. 打开 SQL Editor。
3. 把 `supabase-setup.sql` 全部粘贴进去执行。
4. 在 Project Settings / API 中找到：
   - Project URL
   - anon public key
5. 打开 `config.js`，替换：

   YOUR_SUPABASE_URL
   YOUR_SUPABASE_ANON_KEY

6. Commit 后，GitHub Pages 会自动更新。

注意：

`anon key` 本来就是给浏览器公开使用的。
不要把 `service_role` key 放进 GitHub 仓库。

## 四、课堂使用

打开网页后，同学们直接点 A/B/C/D。

默认规则：
- 同一浏览器/设备只允许投一次
- 投完立即显示实时结果
- 其他同学投票时，结果会自动刷新
- 投票数据保存在 Supabase

如果老师需要重新开始一轮投票：
在 Supabase Table Editor 中清空 `votes` 表即可。
