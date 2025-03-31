package com.example.eduscanai.api

import com.google.gson.annotations.SerializedName

/**
 * DeepSeep API请求体
 */
data class TeacherRequestBody(
    @SerializedName("prompt")
    val prompt: String,
    
    @SerializedName("temperature")
    val temperature: Double = 0.7,
    
    @SerializedName("max_tokens")
    val max_tokens: Int = 2000
) 