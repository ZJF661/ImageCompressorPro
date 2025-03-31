// DOM元素
const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');
const selectImageBtn = document.getElementById('selectImageBtn');
const compressBtn = document.getElementById('compressBtn');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const maxWidthInput = document.getElementById('maxWidthInput');
const maxHeightInput = document.getElementById('maxHeightInput');
const resultContainer = document.getElementById('resultContainer');
const originalImage = document.getElementById('originalImage');
const compressedImage = document.getElementById('compressedImage');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const originalResolution = document.getElementById('originalResolution');
const compressedResolution = document.getElementById('compressedResolution');
const sizeDifference = document.getElementById('sizeDifference');
const downloadBtn = document.getElementById('downloadBtn');
const newImageBtn = document.getElementById('newImageBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const statusIndicator = document.getElementById('statusIndicator');
const debugLogs = document.getElementById('debugLogs');

// 立即隐藏loading遮罩层
if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
    loadingOverlay.style.display = 'none';
}

// 全局变量
let originalFile = null;
let compressedBlob = null;
let originalImageElement = new Image();
let compressedImageElement = new Image();
let isProcessingFile = false;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);

// 显示状态信息
function showStatus(message, type) {
    if (!statusIndicator) return;
    
    // 添加到调试日志
    addDebugLog(message);
    
    // 更新状态指示器
    statusIndicator.textContent = message;
    statusIndicator.className = 'status-indicator';
    
    if (type === 'success') {
        statusIndicator.classList.add('status-success');
    } else if (type === 'error') {
        statusIndicator.classList.add('status-error');
    } else if (type === 'warning') {
        statusIndicator.classList.add('status-warning');
    }
    
    statusIndicator.classList.remove('hidden');
}

// 添加调试日志
function addDebugLog(message) {
    if (!debugLogs) return;
    
    console.log(message); // 同时输出到控制台
    
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.textContent = `${timestamp} - ${message}`;
    debugLogs.appendChild(logEntry);
    
    // 自动滚动到底部
    debugLogs.scrollTop = debugLogs.scrollHeight;
}

// 初始化应用
function initApp() {
    addDebugLog('初始化应用...');
    
    // 确保loading遮罩隐藏
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        loadingOverlay.style.display = 'none';
    }
    
    // 检查压缩库是否加载成功
    if (typeof imageCompression === 'undefined') {
        console.error('图片压缩库加载失败');
        showStatus('压缩库加载失败，请检查控制台', 'error');
    } else {
        addDebugLog('图片压缩库加载成功');
        showStatus('准备就绪，请选择图片', 'success');
    }
    
    // 验证关键DOM元素
    validateDOMElements();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始化质量滑块值
    updateQualityValue();
}

// 验证必要的DOM元素是否存在
function validateDOMElements() {
    const requiredElements = [
        { name: 'fileInput', element: fileInput },
        { name: 'selectImageBtn', element: selectImageBtn },
        { name: 'dropArea', element: dropArea },
        { name: 'compressBtn', element: compressBtn },
        { name: 'originalImage', element: originalImage },
        { name: 'compressedImage', element: compressedImage }
    ];
    
    let allValid = true;
    
    requiredElements.forEach(item => {
        if (!item.element) {
            addDebugLog(`错误: 缺少必要元素 ${item.name}`);
            allValid = false;
        }
    });
    
    if (!allValid) {
        showStatus('页面初始化失败，缺少必要元素，请刷新页面重试', 'error');
    }
    
    return allValid;
}

// 设置事件监听器
function setupEventListeners() {
    addDebugLog('设置事件监听器...');
    
    // 选择图片按钮点击事件
    if (selectImageBtn && fileInput) {
        // 清除旧的事件监听器（如果有的话）
        selectImageBtn.removeEventListener('click', handleSelectImageBtnClick);
        selectImageBtn.addEventListener('click', handleSelectImageBtnClick);
        addDebugLog('选择图片按钮事件已设置');
    } else {
        addDebugLog('错误: 选择图片按钮或文件输入元素不存在');
    }
    
    // 文件输入变化事件 - 直接使用函数引用以便调试
    if (fileInput) {
        // 移除以前可能存在的事件监听器
        fileInput.removeEventListener('change', handleFileInputChange);
        fileInput.addEventListener('change', handleFileInputChange);
        addDebugLog('文件输入事件已设置');
        
        // 为了调试，添加一个直接的事件监听
        fileInput.onchange = function(e) {
            addDebugLog('原生onchange事件触发');
        };
    }
    
    // 拖放区域事件
    if (dropArea) {
        dropArea.addEventListener('dragover', handleDragOver);
        dropArea.addEventListener('dragleave', handleDragLeave);
        dropArea.addEventListener('drop', handleFileDrop);
    }
    
    // 其他按钮事件
    if (compressBtn) compressBtn.addEventListener('click', startCompression);
    if (qualitySlider) qualitySlider.addEventListener('input', updateQualityValue);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadCompressedImage);
    if (newImageBtn) newImageBtn.addEventListener('click', resetApp);
    
    addDebugLog('所有事件监听器设置完成');
}

// 处理选择图片按钮点击
function handleSelectImageBtnClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    addDebugLog('选择图片按钮被点击');
    
    if (isProcessingFile) {
        addDebugLog('正在处理文件，忽略点击');
        return;
    }
    
    if (fileInput) {
        addDebugLog('触发文件选择框');
        // 确保文件输入被重置，这可以解决某些浏览器不触发change事件的问题
        fileInput.value = '';
        // 点击文件输入框触发文件选择
        fileInput.click();
    } else {
        addDebugLog('错误: 文件输入元素不存在');
    }
}

// 处理文件输入变化
function handleFileInputChange(e) {
    addDebugLog('文件输入变化事件触发');
    
    if (!e || !e.target) {
        addDebugLog('错误: 事件对象无效');
        return;
    }
    
    if (isProcessingFile) {
        addDebugLog('正在处理文件，忽略变化');
        return;
    }
    
    // 显示视觉反馈
    if (selectImageBtn) {
        selectImageBtn.textContent = '文件已选择...';
        selectImageBtn.classList.add('active');
    }
    
    const files = e.target.files;
    addDebugLog(`选择的文件数量: ${files ? files.length : 0}`);
    
    if (!files || files.length === 0) {
        addDebugLog('错误: 没有选择文件');
        resetProcessingState();
        showStatus('未选择任何文件', 'warning');
        return;
    }
    
    const file = files[0];
    addDebugLog(`选择的文件: ${file.name}, 类型: ${file.type}, 大小: ${formatFileSize(file.size)}`);
    
    // 处理所选文件
    setTimeout(() => processSelectedFile(file), 100);
}

// 处理所选文件
function processSelectedFile(file) {
    addDebugLog(`开始处理文件: ${file.name}`);
    showStatus(`处理文件: ${file.name}`, 'success');
    isProcessingFile = true;
    
    // 验证文件类型
    if (!validateImageFile(file)) {
        resetProcessingState();
        return;
    }
    
    // 保存原始文件
    originalFile = file;
    
    // 读取文件内容
    readFileAsDataURL(file);
}

// 验证图片文件
function validateImageFile(file) {
    if (!file) {
        addDebugLog('错误: 文件对象为空');
        showStatus('文件无效', 'error');
        return false;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    addDebugLog(`验证文件类型: ${file.type}`);
    
    if (!validTypes.includes(file.type)) {
        addDebugLog(`错误: 不支持的文件类型: ${file.type}`);
        showStatus('请上传有效的图片文件 (JPG, PNG, WEBP, GIF)', 'error');
        return false;
    }
    
    if (file.size <= 0) {
        addDebugLog(`错误: 文件大小无效: ${file.size}`);
        showStatus('所选文件无效，请选择其他图片', 'error');
        return false;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB
        addDebugLog(`错误: 文件太大: ${formatFileSize(file.size)}`);
        showStatus('文件太大，请选择小于50MB的图片', 'error');
        return false;
    }
    
    return true;
}

// 读取文件为Data URL
function readFileAsDataURL(file) {
    addDebugLog('开始读取文件...');
    
    try {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            addDebugLog('文件读取完成');
            handleFileReadComplete(e.target.result);
        };
        
        reader.onerror = function(error) {
            addDebugLog(`错误: 文件读取失败: ${error}`);
            showStatus('文件读取失败，请尝试重新选择或换一张图片', 'error');
            resetProcessingState();
        };
        
        reader.onprogress = function(e) {
            if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                addDebugLog(`读取进度: ${progress}%`);
            }
        };
        
        addDebugLog('开始读取文件数据');
        reader.readAsDataURL(file);
    } catch (error) {
        addDebugLog(`错误: 读取文件时出错: ${error.message}`);
        showStatus(`处理文件时出错: ${error.message}`, 'error');
        resetProcessingState();
    }
}

// 处理文件读取完成
function handleFileReadComplete(dataURL) {
    addDebugLog('处理文件读取完成');
    
    try {
        // 加载图像以获取尺寸信息
        originalImageElement = new Image();
        
        originalImageElement.onload = function() {
            addDebugLog(`原始图像加载成功，尺寸: ${originalImageElement.width} x ${originalImageElement.height}`);
            
            // 设置原始图像预览
            originalImage.src = dataURL;
            originalSize.textContent = formatFileSize(originalFile.size);
            originalResolution.textContent = `${originalImageElement.width} x ${originalImageElement.height}`;
            
            // 更新宽高输入的占位符
            if (maxWidthInput) maxWidthInput.placeholder = originalImageElement.width;
            if (maxHeightInput) maxHeightInput.placeholder = originalImageElement.height;
            
            // 启用压缩按钮
            if (compressBtn) {
                compressBtn.disabled = false;
                // 自动滚动到压缩按钮
                compressBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // 更新选择按钮文本
            if (selectImageBtn) {
                selectImageBtn.textContent = '更换图片';
                selectImageBtn.classList.remove('active');
            }
            
            showStatus('图片已加载，可以进行压缩', 'success');
            
            // 复位处理状态
            resetProcessingState();
        };
        
        originalImageElement.onerror = function(error) {
            addDebugLog(`错误: 图像加载错误: ${error}`);
            showStatus('无法加载所选图片，请尝试其他图片', 'error');
            resetProcessingState();
        };
        
        // 设置图像源
        originalImageElement.src = dataURL;
    } catch (error) {
        addDebugLog(`错误: 处理图像时出错: ${error.message}`);
        showStatus(`处理图像时出错: ${error.message}`, 'error');
        resetProcessingState();
    }
}

// 处理拖放区域拖动悬停
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    addDebugLog('文件拖动悬停');
    dropArea.classList.add('dragover');
}

// 处理拖放区域拖动离开
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    addDebugLog('文件拖动离开');
    dropArea.classList.remove('dragover');
}

// 处理文件拖放
function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    addDebugLog('文件已拖放');
    
    dropArea.classList.remove('dragover');
    
    if (isProcessingFile) {
        addDebugLog('正在处理文件，忽略拖放');
        return;
    }
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) {
        addDebugLog('错误: 没有拖放文件');
        return;
    }
    
    const file = files[0];
    addDebugLog(`拖放的文件: ${file.name}, 类型: ${file.type}`);
    
    // 处理所选文件
    processSelectedFile(file);
    
    // 更新文件输入元素以保持一致性
    try {
        // 注意：DataTransfer对象在某些浏览器上无法直接赋值
        // 这是一个兼容性尝试，但在某些浏览器上可能不起作用
        fileInput.files = files;
    } catch(error) {
        addDebugLog(`警告: 无法更新文件输入元素: ${error.message}`);
    }
}

// 重置处理状态
function resetProcessingState() {
    addDebugLog('重置处理状态');
    isProcessingFile = false;
    if (selectImageBtn && selectImageBtn.classList.contains('active')) {
        selectImageBtn.classList.remove('active');
    }
}

// 更新质量值显示
function updateQualityValue() {
    if (qualitySlider && qualityValue) {
        qualityValue.textContent = `${qualitySlider.value}%`;
    }
}

// 开始压缩
function startCompression() {
    addDebugLog('开始压缩...');
    
    if (!originalFile) {
        addDebugLog('错误: 没有原始文件可压缩');
        showStatus('请先选择一张图片', 'warning');
        return;
    }
    
    if (isProcessingFile) {
        addDebugLog('正在处理文件，请稍候');
        return;
    }
    
    isProcessingFile = true;
    
    // 检查压缩库
    if (typeof imageCompression === 'undefined') {
        addDebugLog('错误: 压缩库未定义');
        showStatus('图片压缩库未加载成功，请刷新页面后重试', 'error');
        resetProcessingState();
        return;
    }
    
    // 显示加载状态
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.style.display = 'flex';
    }
    showStatus('正在压缩图片...', 'warning');
    
    // 获取用户设置
    const quality = parseFloat(qualitySlider.value) / 100;
    const maxWidth = parseInt(maxWidthInput.value) || originalImageElement.width;
    const maxHeight = parseInt(maxHeightInput.value) || originalImageElement.height;
    
    // 准备压缩选项
    const options = {
        maxSizeMB: 10,
        maxWidthOrHeight: Math.max(maxWidth, maxHeight),
        useWebWorker: true,
        maxIteration: 10,
        quality: quality
    };
    
    addDebugLog(`压缩选项: 质量=${quality}, 最大尺寸=${Math.max(maxWidth, maxHeight)}px`);
    
    // 执行压缩
    try {
        imageCompression(originalFile, options)
            .then(function(compressedFile) {
                compressedBlob = compressedFile;
                addDebugLog(`压缩完成，原始大小: ${formatFileSize(originalFile.size)}, 压缩后大小: ${formatFileSize(compressedBlob.size)}`);
                
                if (compressedBlob.size > originalFile.size) {
                    addDebugLog('警告: 压缩后文件更大了！');
                    showStatus('注意: 压缩后文件比原始文件更大', 'warning');
                }
                
                // 显示压缩后的图片
                const compressedURL = URL.createObjectURL(compressedBlob);
                compressedImage.src = compressedURL;
                
                // 加载压缩后的图片以获取尺寸
                compressedImageElement = new Image();
                compressedImageElement.onload = function() {
                    addDebugLog(`压缩图像加载完成，尺寸: ${compressedImageElement.width} x ${compressedImageElement.height}`);
                    
                    // 更新压缩结果信息
                    compressedSize.textContent = formatFileSize(compressedBlob.size);
                    compressedResolution.textContent = `${compressedImageElement.width} x ${compressedImageElement.height}`;
                    
                    // 计算压缩率
                    const reduction = Math.max(0, 100 - Math.round((compressedBlob.size / originalFile.size) * 100));
                    sizeDifference.textContent = `${reduction}%`;
                    
                    // 显示结果
                    if (resultContainer) resultContainer.classList.remove('hidden');
                    
                    // 滚动到结果
                    if (resultContainer) resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    // 隐藏加载状态
                    if (loadingOverlay) {
                        loadingOverlay.classList.add('hidden');
                        loadingOverlay.style.display = 'none';
                    }
                    
                    showStatus(`压缩完成! 减小了 ${reduction}%`, 'success');
                    
                    resetProcessingState();
                };
                
                compressedImageElement.onerror = function(error) {
                    addDebugLog(`错误: 压缩图像加载错误: ${error}`);
                    showStatus('无法加载压缩后的图片', 'error');
                    
                    // 隐藏加载状态
                    if (loadingOverlay) {
                        loadingOverlay.classList.add('hidden');
                        loadingOverlay.style.display = 'none';
                    }
                    
                    resetProcessingState();
                };
                
                compressedImageElement.src = compressedURL;
            })
            .catch(function(error) {
                addDebugLog(`错误: 压缩过程出错: ${error.message}`);
                showStatus(`压缩图片时出错: ${error.message}`, 'error');
                
                // 隐藏加载状态
                if (loadingOverlay) {
                    loadingOverlay.classList.add('hidden');
                    loadingOverlay.style.display = 'none';
                }
                
                resetProcessingState();
            });
    } catch (error) {
        addDebugLog(`错误: 调用压缩库时出错: ${error.message}`);
        showStatus(`压缩图片时出错: ${error.message}`, 'error');
        
        // 隐藏加载状态
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            loadingOverlay.style.display = 'none';
        }
        
        resetProcessingState();
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 下载压缩后的图片
function downloadCompressedImage() {
    if (!compressedBlob) {
        showStatus('请先压缩图片', 'warning');
        return;
    }
    
    if (isProcessingFile) return;
    isProcessingFile = true;
    
    try {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(compressedBlob);
        
        // 设置下载文件名
        const fileName = originalFile.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();
        const newFileName = fileName.replace(
            '.' + fileExtension, 
            `-compressed.${fileExtension === 'png' || fileExtension === 'gif' ? fileExtension : 'jpg'}`
        );
        
        link.download = newFileName;
        addDebugLog(`触发下载: ${newFileName}`);
        showStatus(`正在下载: ${newFileName}`, 'success');
        link.click();
        
        // 清理URL对象
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
            addDebugLog('URL对象已清理');
        }, 100);
    } catch (error) {
        addDebugLog(`错误: 下载图片时出错: ${error.message}`);
        showStatus(`下载图片时出错: ${error.message}`, 'error');
    }
    
    setTimeout(resetProcessingState, 500);
}

// 重置应用状态
function resetApp() {
    addDebugLog('重置应用');
    
    if (isProcessingFile) return;
    isProcessingFile = true;
    
    // 重置文件输入
    if (fileInput) fileInput.value = '';
    originalFile = null;
    compressedBlob = null;
    
    // 重置UI
    originalImage.src = '';
    compressedImage.src = '';
    if (compressBtn) compressBtn.disabled = true;
    if (resultContainer) resultContainer.classList.add('hidden');
    
    // 重置信息显示
    originalSize.textContent = '0 KB';
    compressedSize.textContent = '0 KB';
    originalResolution.textContent = '0 x 0';
    compressedResolution.textContent = '0 x 0';
    sizeDifference.textContent = '0%';
    
    // 重置输入默认值
    if (maxWidthInput) maxWidthInput.value = '';
    if (maxHeightInput) maxHeightInput.value = '';
    if (maxWidthInput) maxWidthInput.placeholder = '原始尺寸';
    if (maxHeightInput) maxHeightInput.placeholder = '原始尺寸';
    if (qualitySlider) qualitySlider.value = 80;
    updateQualityValue();
    
    // 重置选择按钮文本
    if (selectImageBtn) {
        selectImageBtn.textContent = '选择图片';
    }
    
    // 状态更新
    showStatus('准备就绪，请选择图片', 'success');
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setTimeout(resetProcessingState, 500);
} 