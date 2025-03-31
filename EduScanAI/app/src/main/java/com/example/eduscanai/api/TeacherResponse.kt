package com.example.eduscanai.api

import com.google.gson.annotations.SerializedName

/**
 * DeepSeep API响应模型
 */
data class TeacherResponse(
    @SerializedName("id")
    val id: String,
    
    @SerializedName("object")
    val objectType: String,
    
    @SerializedName("created")
    val created: Long,
    
    @SerializedName("model")
    val model: String,
    
    @SerializedName("choices")
    val choices: List<Choice>,
    
    @SerializedName("usage")
    val usage: Usage
)

data class Choice(
    @SerializedName("text")
    val text: String,
    
    @SerializedName("index")
    val index: Int,
    
    @SerializedName("finish_reason")
    val finishReason: String
)

data class Usage(
    @SerializedName("prompt_tokens")
    val promptTokens: Int,
    
    @SerializedName("completion_tokens")
    val completionTokens: Int,
    
    @SerializedName("total_tokens")
    val totalTokens: Int
) 