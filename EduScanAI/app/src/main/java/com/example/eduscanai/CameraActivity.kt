package com.example.eduscanai

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import com.example.eduscanai.databinding.ActivityCameraBinding
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class CameraActivity : AppCompatActivity() {
    private lateinit var binding: ActivityCameraBinding
    private lateinit var cameraExecutor: ExecutorService
    private var imageCapture: ImageCapture? = null
    private val TAG = "CameraActivity"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCameraBinding.inflate(layoutInflater)
        setContentView(binding.root)

        cameraExecutor = Executors.newSingleThreadExecutor()
        startCamera()

        binding.captureButton.setOnClickListener {
            takePhoto()
        }

        binding.closeButton.setOnClickListener {
            finish()
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            // 相机提供者现在可用
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()

            // 预览
            val preview = Preview.Builder()
                .build()
                .also {
                    it.setSurfaceProvider(binding.viewFinder.surfaceProvider)
                }

            // 图像捕获
            imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                .build()

            // 默认使用后置相机
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            try {
                // 解绑所有用例
                cameraProvider.unbindAll()

                // 绑定用例到相机
                cameraProvider.bindToLifecycle(
                    this, cameraSelector, preview, imageCapture
                )

            } catch (exc: Exception) {
                Log.e(TAG, "相机绑定失败", exc)
            }

        }, ContextCompat.getMainExecutor(this))
    }

    private fun takePhoto() {
        // 获取当前的ImageCapture实例
        val imageCapture = imageCapture ?: return

        // 创建时间戳命名的文件
        val photoFile = File(
            outputDirectory,
            SimpleDateFormat(
                "yyyy-MM-dd-HH-mm-ss-SSS",
                Locale.getDefault()
            ).format(System.currentTimeMillis()) + ".jpg"
        )

        // 创建输出选项对象
        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

        // 设置图像捕获监听器
        imageCapture.takePicture(
            outputOptions,
            ContextCompat.getMainExecutor(this),
            object : ImageCapture.OnImageSavedCallback {
                override fun onError(exc: ImageCaptureException) {
                    Log.e(TAG, "Photo capture failed: ${exc.message}", exc)
                    Toast.makeText(
                        this@CameraActivity,
                        "拍照失败: ${exc.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }

                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                    // 成功保存照片，现在跳转到结果活动
                    startResultActivity(photoFile.absolutePath)
                }
            })
    }

    private fun startResultActivity(imagePath: String) {
        val intent = Intent(this, ResultActivity::class.java).apply {
            putExtra("IMAGE_PATH", imagePath)
        }
        startActivity(intent)
        finish() // 关闭相机活动
    }

    // 获取应用程序私有目录
    private val outputDirectory: File by lazy {
        val mediaDir = externalMediaDirs.firstOrNull()?.let {
            File(it, resources.getString(R.string.app_name)).apply { mkdirs() }
        }
        mediaDir ?: filesDir
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
} 