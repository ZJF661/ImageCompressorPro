# EduScanAI - 教育题目解答应用

EduScanAI是一款教育类Android应用，通过拍照或上传题目图片，利用OCR技术识别题目文字，再通过DeepSeep AI大模型以中学老师的人设解答题目。

## 功能特点

- **拍照或选择图片**：用户可以使用相机拍摄题目或从图库选择已有图片
- **OCR文字识别**：使用Google ML Kit进行高精度的中英文OCR识别
- **AI老师解答**：接入DeepSeep智能体API，以中学老师身份专业解答题目
- **分享功能**：支持分享问题和答案给他人
- **简洁友好的界面**：符合Material Design设计规范的直观界面

## 技术栈

- Kotlin语言开发
- Android Jetpack组件
- CameraX用于相机功能
- Google ML Kit用于OCR识别
- Retrofit用于API网络请求
- MVVM架构设计

## 使用说明

1. 首次启动应用会请求相机和存储权限
2. 在首页选择"拍照"或"从图库选择"
3. 拍照时将题目放入取景框内
4. 应用会自动识别文字并发送给AI进行解答
5. 在结果页面查看识别的文字和AI老师的解答
6. 点击"分享"可将结果发送给他人

## 注意事项

- 使用前请确保已在DeepSeepApiClient.kt中设置了正确的API URL和API KEY
- 拍照时保持光线充足，题目文字清晰可见
- 目前主要针对中文类文本题目进行优化

## 开发环境

- Android Studio Chipmunk 或更高版本
- Gradle 7.2.0 或更高版本
- Android SDK 33 (Android 13)
- 最低支持 Android SDK 24 (Android 7.0)

## 未来计划

- 添加更多学科的专项处理能力
- 优化OCR识别中的数学公式识别
- 增加历史记录功能
- 支持夜间模式
- 添加题目分类功能 