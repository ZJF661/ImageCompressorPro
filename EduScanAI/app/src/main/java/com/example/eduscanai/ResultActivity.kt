package com.example.eduscanai

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import com.bumptech.glide.Glide
import com.example.eduscanai.api.DeepSeepApi
import com.example.eduscanai.api.DeepSeepApiClient
import com.example.eduscanai.api.TeacherRequestBody
import com.example.eduscanai.api.TeacherResponse
import com.example.eduscanai.databinding.ActivityResultBinding
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.io.File
import java.io.IOException

class ResultActivity : AppCompatActivity() {

    private lateinit var binding: ActivityResultBinding
    private var imagePath: String? = null
    private var recognizedText: String = ""
    private val TAG = "ResultActivity"
    private lateinit var deepSeepApi: DeepSeepApi

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityResultBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // 初始化DeepSeep API客户端
        deepSeepApi = DeepSeepApiClient.getInstance()

        // 获取传入的图片路径
        imagePath = intent.getStringExtra("IMAGE_PATH")
        if (imagePath == null) {
            Toast.makeText(this, R.string.error_processing, Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        // 加载图片到ImageView
        loadImage()

        // 进行OCR识别
        processImageWithOCR()

        // 设置UI点击事件
        setupClickListeners()
    }

    private fun loadImage() {
        imagePath?.let { path ->
            Glide.with(this)
                .load(File(path))
                .into(binding.capturedImageView)
        }
    }

    private fun processImageWithOCR() {
        imagePath?.let { path ->
            try {
                val bitmap = BitmapFactory.decodeFile(path)
                val image = InputImage.fromBitmap(bitmap, 0)
                
                // 显示进度条
                binding.loadingProgressBar.visibility = View.VISIBLE
                binding.ocrResultText.text = getString(R.string.processing)
                binding.teacherResponseText.text = getString(R.string.loading)

                // 使用中文OCR识别器
                val recognizer = TextRecognition.getClient(ChineseTextRecognizerOptions.Builder().build())
                recognizer.process(image)
                    .addOnSuccessListener { text ->
                        handleOCRSuccess(text)
                    }
                    .addOnFailureListener { e ->
                        Log.e(TAG, "OCR识别失败", e)
                        binding.loadingProgressBar.visibility = View.GONE
                        binding.ocrResultText.text = getString(R.string.error_processing)
                        Toast.makeText(this, R.string.error_processing, Toast.LENGTH_SHORT).show()
                    }
            } catch (e: IOException) {
                Log.e(TAG, "读取图片失败", e)
                binding.loadingProgressBar.visibility = View.GONE
                binding.ocrResultText.text = getString(R.string.error_processing)
                Toast.makeText(this, R.string.error_processing, Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun handleOCRSuccess(text: Text) {
        recognizedText = text.text
        binding.ocrResultText.text = recognizedText

        if (recognizedText.isNotEmpty()) {
            // 调用DeepSeep AI获取老师解答
            getTeacherResponse(recognizedText)
        } else {
            binding.loadingProgressBar.visibility = View.GONE
            binding.teacherResponseText.text = "未能识别到文字，请重新拍照或选择清晰的图片"
        }
    }

    private fun getTeacherResponse(text: String) {
        // 构建请求体
        val requestBody = TeacherRequestBody(
            prompt = "你是一名经验丰富的中学老师，请解答下面的题目：\n\n$text",
            temperature = 0.7,
            max_tokens = 2000
        )

        // 调用API
        deepSeepApi.getTeacherResponse(requestBody).enqueue(object : Callback<TeacherResponse> {
            override fun onResponse(call: Call<TeacherResponse>, response: Response<TeacherResponse>) {
                binding.loadingProgressBar.visibility = View.GONE
                if (response.isSuccessful) {
                    val teacherResponse = response.body()
                    teacherResponse?.let {
                        binding.teacherResponseText.text = it.choices[0].text
                    }
                } else {
                    Log.e(TAG, "API响应错误: ${response.code()}")
                    binding.teacherResponseText.text = "获取解答失败，请重试"
                }
            }

            override fun onFailure(call: Call<TeacherResponse>, t: Throwable) {
                binding.loadingProgressBar.visibility = View.GONE
                Log.e(TAG, "API调用失败", t)
                binding.teacherResponseText.text = "获取解答失败，请检查网络连接后重试"
            }
        })
    }

    private fun setupClickListeners() {
        binding.analyzeAgainButton.setOnClickListener {
            finish() // 返回上一个页面
        }

        binding.shareResultButton.setOnClickListener {
            shareResult()
        }
    }

    private fun shareResult() {
        val shareText = "题目：\n$recognizedText\n\n解答：\n${binding.teacherResponseText.text}"
        
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, getString(R.string.app_name))
            putExtra(Intent.EXTRA_TEXT, shareText)
        }
        
        // 可选：如果要包含图片
        imagePath?.let { path ->
            val imageFile = File(path)
            val imageUri = FileProvider.getUriForFile(
                this,
                "${applicationContext.packageName}.provider",
                imageFile
            )
            intent.putExtra(Intent.EXTRA_STREAM, imageUri)
            intent.type = "image/jpeg"
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        
        startActivity(Intent.createChooser(intent, getString(R.string.share_result)))
    }
} 