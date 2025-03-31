package com.example.eduscanai.api

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

interface DeepSeepApi {
    @POST("v1/chat/completions")
    fun getTeacherResponse(@Body requestBody: TeacherRequestBody): Call<TeacherResponse>
} 