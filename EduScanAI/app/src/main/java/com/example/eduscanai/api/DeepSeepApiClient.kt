package com.example.eduscanai.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * DeepSeep API客户端单例类
 */
object DeepSeepApiClient {
    private const val BASE_URL = "https://api.deepseek.com/" // 请替换为实际的DeepSeep API URL
    private const val API_KEY = "YOUR_API_KEY" // 请替换为您的实际API密钥

    // 创建OkHttpClient，添加API密钥和日志拦截器
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor { chain ->
            val original = chain.request()
            val requestBuilder = original.newBuilder()
                .header("Authorization", "Bearer $API_KEY")
                .header("Content-Type", "application/json")
                .method(original.method, original.body)
            
            val request = requestBuilder.build()
            chain.proceed(request)
        }
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    // 创建Retrofit实例
    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    // 创建API服务接口
    private val apiService: DeepSeepApi = retrofit.create(DeepSeepApi::class.java)

    // 提供API服务实例的方法
    fun getInstance(): DeepSeepApi {
        return apiService
    }
} 