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

// 新增批量处理和实时预览DOM元素
const thumbnailsContainer = document.getElementById('thumbnailsContainer');
const livePreviewContainer = document.getElementById('livePreviewContainer');
const liveOriginalImage = document.getElementById('liveOriginalImage');
const liveCompressedImage = document.getElementById('liveCompressedImage');
const liveOriginalSize = document.getElementById('liveOriginalSize');
const liveCompressedSize = document.getElementById('liveCompressedSize');
const liveOriginalResolution = document.getElementById('liveOriginalResolution');
const liveCompressedResolution = document.getElementById('liveCompressedResolution');
const liveOriginalType = document.getElementById('liveOriginalType');
const liveCompressionRate = document.getElementById('liveCompressionRate');
const liveSizeDifference = document.getElementById('liveSizeDifference');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const removeSelectedBtn = document.getElementById('removeSelectedBtn');
const batchResults = document.getElementById('batchResults');
const batchResultsList = document.getElementById('batchResultsList');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const singleResultView = document.getElementById('singleResultView');

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

// 新增全局变量
let imageFiles = []; // 存储多个图片文件
let selectedFiles = []; // 存储选中的图片索引
let currentPreviewIndex = -1; // 当前预览的图片索引
let compressedResults = []; // 存储所有压缩结果
let livePreviewTimeoutId = null; // 实时预览的定时器ID
let isGeneratingLivePreview = false; // 是否正在生成实时预览

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
    
    // 检查批量下载所需的库
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
        addDebugLog('警告: 批量下载库未加载成功，批量下载功能可能不可用');
        showStatus('部分功能不可用，请刷新页面重试', 'warning');
    } else {
        addDebugLog('批量下载库加载成功');
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
        { name: 'thumbnailsContainer', element: thumbnailsContainer },
        { name: 'livePreviewContainer', element: livePreviewContainer }
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
    
    // 质量滑块事件 - 添加实时预览功能
    if (qualitySlider) {
        // 移除原有监听器
        qualitySlider.removeEventListener('input', updateQualityValue);
        // 添加新的监听器，包含实时预览
        qualitySlider.addEventListener('input', function() {
            updateQualityValue();
            // 触发实时预览
            debounceGenerateLivePreview();
        });
    }
    
    // 最大尺寸输入事件 - 添加实时预览
    if (maxWidthInput) {
        maxWidthInput.addEventListener('input', debounceGenerateLivePreview);
    }
    
    if (maxHeightInput) {
        maxHeightInput.addEventListener('input', debounceGenerateLivePreview);
    }
    
    // 批量处理按钮事件
    if (selectAllBtn) selectAllBtn.addEventListener('click', selectAllFiles);
    if (deselectAllBtn) deselectAllBtn.addEventListener('click', deselectAllFiles);
    if (removeSelectedBtn) removeSelectedBtn.addEventListener('click', removeSelectedFiles);
    
    // 压缩和下载按钮事件
    if (compressBtn) compressBtn.addEventListener('click', startCompression);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadCompressedImage);
    if (downloadAllBtn) downloadAllBtn.addEventListener('click', downloadAllCompressedImages);
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
    
    // 处理所选的多个文件
    processSelectedFiles(files);
}

// 处理多个选择的文件
function processSelectedFiles(files) {
    addDebugLog(`处理 ${files.length} 个文件`);
    isProcessingFile = true;
    
    let validFiles = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (validateImageFile(file)) {
            validFiles.push(file);
            addDebugLog(`有效文件 #${validFiles.length}: ${file.name}`);
        }
    }
    
    if (validFiles.length === 0) {
        resetProcessingState();
        showStatus('未选择有效的图片文件', 'error');
        return;
    }
    
    // 添加到全局图片数组
    for (const file of validFiles) {
        imageFiles.push(file);
    }
    
    showStatus(`已添加 ${validFiles.length} 个图片`, 'success');
    
    // 更新缩略图容器
    updateThumbnails();
    
    // 如果有图片，更新预览并启用按钮
    if (imageFiles.length > 0) {
        // 默认选择第一张图片
        if (currentPreviewIndex === -1) {
            selectThumbnail(imageFiles.length - 1);
        }
        
        // 启用批量操作按钮
        if (selectAllBtn) selectAllBtn.disabled = false;
        if (deselectAllBtn) deselectAllBtn.disabled = false;
        if (removeSelectedBtn) removeSelectedBtn.disabled = false;
        if (compressBtn) compressBtn.disabled = false;
    }
    
    // 更新选择按钮文本
    if (selectImageBtn) {
        selectImageBtn.textContent = '添加更多图片';
        selectImageBtn.classList.remove('active');
    }
    
    resetProcessingState();
}

// 更新缩略图显示
function updateThumbnails() {
    if (!thumbnailsContainer) return;
    
    // 清空容器
    thumbnailsContainer.innerHTML = '';
    
    if (imageFiles.length === 0) {
        thumbnailsContainer.classList.add('hidden');
        return;
    }
    
    // 显示容器
    thumbnailsContainer.classList.remove('hidden');
    
    // 创建每个文件的缩略图
    imageFiles.forEach((file, index) => {
        createThumbnail(file, index);
    });
}

// 创建单个缩略图
function createThumbnail(file, index) {
    const thumbnailItem = document.createElement('div');
    thumbnailItem.className = 'thumbnail-item';
    thumbnailItem.dataset.index = index;
    
    // 选中状态
    if (selectedFiles.includes(index)) {
        thumbnailItem.classList.add('selected');
    }
    
    // 预览区域
    const thumbnailPreview = document.createElement('div');
    thumbnailPreview.className = 'thumbnail-preview';
    
    // 预览图像
    const img = document.createElement('img');
    img.alt = file.name;
    
    // 读取文件并设置预览
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    thumbnailPreview.appendChild(img);
    
    // 移除按钮
    const closeButton = document.createElement('div');
    closeButton.className = 'thumbnail-close';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', function(e) {
        e.stopPropagation();
        removeFile(index);
    });
    
    // 文件信息
    const thumbnailInfo = document.createElement('div');
    thumbnailInfo.className = 'thumbnail-info';
    
    const fileName = document.createElement('span');
    fileName.className = 'thumbnail-name';
    fileName.textContent = file.name;
    
    const fileSize = document.createElement('span');
    fileSize.className = 'thumbnail-size';
    fileSize.textContent = formatFileSize(file.size);
    
    thumbnailInfo.appendChild(fileName);
    thumbnailInfo.appendChild(fileSize);
    
    // 组装
    thumbnailItem.appendChild(closeButton);
    thumbnailItem.appendChild(thumbnailPreview);
    thumbnailItem.appendChild(thumbnailInfo);
    
    // 点击事件 - 选择/取消选择
    thumbnailItem.addEventListener('click', function() {
        toggleSelection(index);
    });
    
    // 双击事件 - 预览
    thumbnailItem.addEventListener('dblclick', function() {
        selectThumbnail(index);
    });
    
    thumbnailsContainer.appendChild(thumbnailItem);
}

// 选择缩略图进行预览
function selectThumbnail(index) {
    if (index < 0 || index >= imageFiles.length) return;
    
    currentPreviewIndex = index;
    addDebugLog(`选择图片 #${index} 进行预览: ${imageFiles[index].name}`);
    
    // 读取并显示原始图像
    readImageForPreview(imageFiles[index]);
}

// 切换文件选择状态
function toggleSelection(index) {
    if (index < 0 || index >= imageFiles.length) return;
    
    const idx = selectedFiles.indexOf(index);
    if (idx === -1) {
        // 添加到选中数组
        selectedFiles.push(index);
        addDebugLog(`选中图片 #${index}`);
    } else {
        // 从选中数组中移除
        selectedFiles.splice(idx, 1);
        addDebugLog(`取消选中图片 #${index}`);
    }
    
    // 更新UI
    updateThumbnails();
    updateBatchActionButtons();
}

// 选择所有文件
function selectAllFiles() {
    selectedFiles = [];
    for (let i = 0; i < imageFiles.length; i++) {
        selectedFiles.push(i);
    }
    addDebugLog(`选中所有 ${selectedFiles.length} 个图片`);
    updateThumbnails();
    updateBatchActionButtons();
}

// 取消选择所有文件
function deselectAllFiles() {
    selectedFiles = [];
    addDebugLog('取消选择所有图片');
    updateThumbnails();
    updateBatchActionButtons();
}

// 移除选中的文件
function removeSelectedFiles() {
    if (selectedFiles.length === 0) {
        showStatus('未选择任何图片', 'warning');
        return;
    }
    
    addDebugLog(`移除 ${selectedFiles.length} 个选中的图片`);
    
    // 降序排列，以便从后向前删除
    const sortedIndices = [...selectedFiles].sort((a, b) => b - a);
    
    // 从数组中移除
    for (const index of sortedIndices) {
        imageFiles.splice(index, 1);
    }
    
    // 重置选择
    selectedFiles = [];
    
    // 如果当前预览的图片被删除，重置预览
    if (currentPreviewIndex >= imageFiles.length) {
        currentPreviewIndex = imageFiles.length > 0 ? 0 : -1;
    }
    
    // 更新UI
    updateThumbnails();
    updateBatchActionButtons();
    
    // 如果还有图片，更新预览
    if (currentPreviewIndex >= 0) {
        selectThumbnail(currentPreviewIndex);
    } else {
        clearPreviews();
    }
    
    showStatus(`已移除选中的图片，剩余 ${imageFiles.length} 个`, 'success');
}

// 移除单个文件
function removeFile(index) {
    if (index < 0 || index >= imageFiles.length) return;
    
    addDebugLog(`移除图片 #${index}: ${imageFiles[index].name}`);
    
    // 从数组中移除
    imageFiles.splice(index, 1);
    
    // 更新选中数组
    selectedFiles = selectedFiles.filter(idx => {
        if (idx === index) return false;
        if (idx > index) return idx - 1 >= 0; // 调整索引
        return true;
    }).map(idx => idx > index ? idx - 1 : idx); // 重新映射索引
    
    // 如果当前预览的图片被删除，重置预览
    if (currentPreviewIndex === index) {
        currentPreviewIndex = imageFiles.length > 0 ? 0 : -1;
    } else if (currentPreviewIndex > index) {
        currentPreviewIndex--; // 调整当前预览索引
    }
    
    // 更新UI
    updateThumbnails();
    updateBatchActionButtons();
    
    // 如果还有图片，更新预览
    if (currentPreviewIndex >= 0) {
        selectThumbnail(currentPreviewIndex);
    } else {
        clearPreviews();
    }
}

// 清除预览区域
function clearPreviews() {
    // 清除实时预览
    if (livePreviewContainer) {
        livePreviewContainer.classList.add('hidden');
    }
    
    if (liveOriginalImage) liveOriginalImage.src = '';
    if (liveCompressedImage) liveCompressedImage.src = '';
    if (liveOriginalSize) liveOriginalSize.textContent = '0 KB';
    if (liveCompressedSize) liveCompressedSize.textContent = '0 KB';
    if (liveOriginalResolution) liveOriginalResolution.textContent = '0 x 0';
    if (liveCompressedResolution) liveCompressedResolution.textContent = '0 x 0';
    if (liveOriginalType) liveOriginalType.textContent = '未知';
    if (liveCompressionRate) liveCompressionRate.textContent = '0%';
    if (liveSizeDifference) liveSizeDifference.textContent = '0 KB (0%)';
    
    // 禁用压缩按钮
    if (compressBtn) compressBtn.disabled = true;
}

// 更新批量操作按钮状态
function updateBatchActionButtons() {
    const hasFiles = imageFiles.length > 0;
    const hasSelection = selectedFiles.length > 0;
    
    if (selectAllBtn) selectAllBtn.disabled = !hasFiles;
    if (deselectAllBtn) deselectAllBtn.disabled = !hasFiles;
    if (removeSelectedBtn) removeSelectedBtn.disabled = !hasSelection;
    if (compressBtn) compressBtn.disabled = !hasFiles;
}

// 验证图片文件
function validateImageFiles(files) {
    let allValid = true;
    
    files.forEach(file => {
        if (!validateImageFile(file)) {
            allValid = false;
        }
    });
    
    if (!allValid) {
        showStatus('部分文件无效，请检查控制台', 'error');
    }
    
    return allValid;
}

// 验证单个图片文件
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
    
    addDebugLog(`拖放的文件数量: ${files.length}`);
    
    // 处理所选的多个文件
    processSelectedFiles(files);
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

// 读取图像用于预览
function readImageForPreview(file) {
    if (!file || !livePreviewContainer) return;
    
    addDebugLog(`读取图片进行预览: ${file.name}`);
    
    // 显示预览容器
    livePreviewContainer.classList.remove('hidden');
    
    try {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // 设置原始图像预览
            const image = new Image();
            image.onload = function() {
                // 设置原始图像信息
                if (liveOriginalImage) liveOriginalImage.src = e.target.result;
                if (liveOriginalSize) liveOriginalSize.textContent = formatFileSize(file.size);
                if (liveOriginalResolution) liveOriginalResolution.textContent = `${image.width} x ${image.height}`;
                if (liveOriginalType) liveOriginalType.textContent = file.type;
                
                // 设置占位符
                if (maxWidthInput) maxWidthInput.placeholder = image.width;
                if (maxHeightInput) maxHeightInput.placeholder = image.height;
                
                // 生成实时压缩预览
                generateLivePreview(file, e.target.result, image.width, image.height);
                
                // 启用压缩按钮
                if (compressBtn) compressBtn.disabled = false;
            };
            
            image.onerror = function() {
                addDebugLog(`错误: 无法加载图片 ${file.name}`);
                showStatus(`无法加载图片预览: ${file.name}`, 'error');
            };
            
            image.src = e.target.result;
        };
        
        reader.onerror = function() {
            addDebugLog(`错误: 读取文件失败 ${file.name}`);
            showStatus('读取文件失败，请重试', 'error');
        };
        
        reader.readAsDataURL(file);
    } catch (error) {
        addDebugLog(`错误: 预览图片时出错: ${error.message}`);
        showStatus(`预览图片时出错: ${error.message}`, 'error');
    }
}

// 延迟执行实时预览（防抖）
function debounceGenerateLivePreview() {
    if (livePreviewTimeoutId) {
        clearTimeout(livePreviewTimeoutId);
    }
    
    livePreviewTimeoutId = setTimeout(() => {
        if (currentPreviewIndex >= 0 && currentPreviewIndex < imageFiles.length) {
            const file = imageFiles[currentPreviewIndex];
            
            // 读取文件并更新预览
            const reader = new FileReader();
            reader.onload = function(e) {
                const image = new Image();
                image.onload = function() {
                    generateLivePreview(file, e.target.result, image.width, image.height);
                };
                image.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }, 300); // 300ms延迟，避免频繁更新
}

// 生成实时压缩预览
async function generateLivePreview(file, dataUrl, width, height) {
    if (!file || !dataUrl || isGeneratingLivePreview) return;
    
    isGeneratingLivePreview = true;
    addDebugLog(`生成实时压缩预览: ${file.name}`);
    
    try {
        // 获取压缩设置
        const quality = parseFloat(qualitySlider.value) / 100;
        const maxWidth = parseInt(maxWidthInput.value) || width;
        const maxHeight = parseInt(maxHeightInput.value) || height;
        
        // 设置压缩选项
        const options = {
            maxSizeMB: 10,
            maxWidthOrHeight: Math.max(maxWidth, maxHeight),
            useWebWorker: true,
            maxIteration: 3, // 减少迭代次数，提高速度
            quality: quality
        };
        
        addDebugLog(`预览压缩选项: 质量=${quality}, 最大尺寸=${Math.max(maxWidth, maxHeight)}px`);
        
        // 显示实时压缩率
        if (liveCompressionRate) {
            liveCompressionRate.textContent = `${quality * 100}%`;
        }
        
        // 执行轻量级压缩
        imageCompression(file, options)
            .then(function(compressedFile) {
                // 创建预览URL
                const compressedUrl = URL.createObjectURL(compressedFile);
                
                // 加载压缩后的图像获取尺寸
                const compressedImage = new Image();
                compressedImage.onload = function() {
                    // 设置压缩后图像信息
                    if (liveCompressedImage) liveCompressedImage.src = compressedUrl;
                    if (liveCompressedSize) liveCompressedSize.textContent = formatFileSize(compressedFile.size);
                    if (liveCompressedResolution) {
                        liveCompressedResolution.textContent = `${compressedImage.width} x ${compressedImage.height}`;
                    }
                    
                    // 计算节省大小和百分比
                    const savedBytes = file.size - compressedFile.size;
                    const savedPercent = Math.max(0, Math.round((savedBytes / file.size) * 100));
                    
                    if (liveSizeDifference) {
                        liveSizeDifference.textContent = `${formatFileSize(savedBytes)} (${savedPercent}%)`;
                    }
                    
                    // 释放URL
                    setTimeout(() => URL.revokeObjectURL(compressedUrl), 3000);
                    isGeneratingLivePreview = false;
                };
                
                compressedImage.onerror = function() {
                    addDebugLog('错误: 无法加载压缩预览');
                    isGeneratingLivePreview = false;
                };
                
                compressedImage.src = compressedUrl;
            })
            .catch(function(error) {
                addDebugLog(`错误: 生成预览时出错: ${error.message}`);
                isGeneratingLivePreview = false;
            });
    } catch (error) {
        addDebugLog(`错误: 实时预览出错: ${error.message}`);
        isGeneratingLivePreview = false;
    }
}

// 开始压缩 - 支持批量处理
function startCompression() {
    addDebugLog('开始压缩...');
    
    if (imageFiles.length === 0) {
        addDebugLog('错误: 没有图片可压缩');
        showStatus('请先选择图片', 'warning');
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
    
    // 获取用户设置
    const quality = parseFloat(qualitySlider.value) / 100;
    const maxWidth = parseInt(maxWidthInput.value) || 0;
    const maxHeight = parseInt(maxHeightInput.value) || 0;
    
    // 准备压缩选项
    const options = {
        maxSizeMB: 10,
        maxWidthOrHeight: Math.max(maxWidth, maxHeight) || undefined,
        useWebWorker: true,
        maxIteration: 10,
        quality: quality
    };
    
    addDebugLog(`压缩选项: 质量=${quality}, 最大尺寸=${options.maxWidthOrHeight || '原始尺寸'}`);
    
    // 确定要压缩的文件
    let filesToCompress = [];
    
    if (selectedFiles.length > 0) {
        // 如果有选中的文件，只压缩选中的文件
        filesToCompress = selectedFiles.map(index => imageFiles[index]);
        addDebugLog(`压缩 ${filesToCompress.length} 个选中的图片`);
    } else {
        // 否则压缩所有文件
        filesToCompress = [...imageFiles];
        addDebugLog(`压缩所有 ${filesToCompress.length} 个图片`);
    }
    
    // 重置结果数组
    compressedResults = [];
    
    // 是否是单文件模式
    const isSingleFile = filesToCompress.length === 1;
    
    showStatus(`正在压缩 ${filesToCompress.length} 个图片...`, 'warning');
    
    // 压缩每个文件
    const compressionPromises = filesToCompress.map((file, index) => {
        return compressFile(file, options, index)
            .then(result => {
                compressedResults.push(result);
                addDebugLog(`压缩完成 (${index + 1}/${filesToCompress.length}): ${file.name}`);
                return result;
            })
            .catch(error => {
                addDebugLog(`压缩失败 (${index + 1}/${filesToCompress.length}): ${file.name} - ${error.message}`);
                return null;
            });
    });
    
    // 处理所有压缩任务
    Promise.all(compressionPromises)
        .then(() => {
            // 过滤掉失败的结果
            compressedResults = compressedResults.filter(result => result !== null);
            
            // 隐藏加载状态
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
                loadingOverlay.style.display = 'none';
            }
            
            if (compressedResults.length === 0) {
                showStatus('所有图片压缩失败', 'error');
                resetProcessingState();
                return;
            }
            
            // 显示结果
            showCompressionResults(isSingleFile);
            
            // 计算总压缩率
            const totalOriginalSize = compressedResults.reduce((sum, result) => sum + result.originalSize, 0);
            const totalCompressedSize = compressedResults.reduce((sum, result) => sum + result.compressedSize, 0);
            const savedPercent = Math.max(0, Math.round((1 - totalCompressedSize / totalOriginalSize) * 100));
            
            showStatus(`压缩完成! 共压缩 ${compressedResults.length} 张图片，平均减小 ${savedPercent}%`, 'success');
            
            resetProcessingState();
        })
        .catch(error => {
            addDebugLog(`错误: 批量压缩过程出错: ${error.message}`);
            showStatus(`压缩过程出错: ${error.message}`, 'error');
            
            // 隐藏加载状态
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
                loadingOverlay.style.display = 'none';
            }
            
            resetProcessingState();
        });
}

// 压缩单个文件
async function compressFile(file, options, index) {
    return new Promise(async (resolve, reject) => {
        try {
            const start = performance.now();
            const compressedFile = await imageCompression(file, options);
            const end = performance.now();
            
            // 读取原始和压缩后的图像尺寸
            const originalUrl = URL.createObjectURL(file);
            const compressedUrl = URL.createObjectURL(compressedFile);
            
            const loadOriginalImage = new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve({ width: img.width, height: img.height });
                img.onerror = () => resolve({ width: 0, height: 0 });
                img.src = originalUrl;
            });
            
            const loadCompressedImage = new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve({ width: img.width, height: img.height });
                img.onerror = () => resolve({ width: 0, height: 0 });
                img.src = compressedUrl;
            });
            
            const [originalDimensions, compressedDimensions] = await Promise.all([
                loadOriginalImage,
                loadCompressedImage
            ]);
            
            // 释放URL
            URL.revokeObjectURL(originalUrl);
            URL.revokeObjectURL(compressedUrl);
            
            // 返回压缩结果
            resolve({
                originalFile: file,
                compressedFile: compressedFile,
                originalSize: file.size,
                compressedSize: compressedFile.size,
                originalWidth: originalDimensions.width,
                originalHeight: originalDimensions.height,
                compressedWidth: compressedDimensions.width,
                compressedHeight: compressedDimensions.height,
                fileName: file.name,
                fileType: file.type,
                compressionTime: Math.round(end - start),
                index: index
            });
        } catch (error) {
            reject(error);
        }
    });
}

// 显示压缩结果
function showCompressionResults(isSingleFile) {
    if (compressedResults.length === 0) return;
    
    // 显示结果容器
    if (resultContainer) {
        resultContainer.classList.remove('hidden');
    }
    
    if (isSingleFile) {
        // 单图片模式
        showSingleFileResult(compressedResults[0]);
    } else {
        // 批量模式
        showBatchResults();
    }
    
    // 滚动到结果
    if (resultContainer) {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 显示单个文件的压缩结果
function showSingleFileResult(result) {
    // 保存当前文件
    originalFile = result.originalFile;
    compressedBlob = result.compressedFile;
    
    // 显示单文件视图，隐藏批量视图
    if (singleResultView) singleResultView.classList.remove('hidden');
    if (batchResults) batchResults.classList.add('hidden');
    
    // 显示原始图像
    const originalUrl = URL.createObjectURL(result.originalFile);
    if (originalImage) originalImage.src = originalUrl;
    if (originalSize) originalSize.textContent = formatFileSize(result.originalSize);
    if (originalResolution) {
        originalResolution.textContent = `${result.originalWidth} x ${result.originalHeight}`;
    }
    
    // 显示压缩图像
    const compressedUrl = URL.createObjectURL(result.compressedFile);
    if (compressedImage) compressedImage.src = compressedUrl;
    if (compressedSize) compressedSize.textContent = formatFileSize(result.compressedSize);
    if (compressedResolution) {
        compressedResolution.textContent = `${result.compressedWidth} x ${result.compressedHeight}`;
    }
    
    // 计算压缩率
    const reduction = Math.max(0, Math.round((1 - result.compressedSize / result.originalSize) * 100));
    if (sizeDifference) sizeDifference.textContent = `${reduction}%`;
}

// 显示批量压缩结果
function showBatchResults() {
    // 隐藏单文件视图，显示批量视图
    if (singleResultView) singleResultView.classList.add('hidden');
    if (batchResults) batchResults.classList.remove('hidden');
    
    // 清空结果列表
    if (batchResultsList) batchResultsList.innerHTML = '';
    
    // 添加每个结果项
    compressedResults.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'batch-result-item';
        
        // 文件名
        const fileName = document.createElement('div');
        fileName.className = 'result-filename';
        fileName.textContent = result.fileName;
        
        // 原始大小
        const originalSize = document.createElement('div');
        originalSize.className = 'result-original-size';
        originalSize.textContent = formatFileSize(result.originalSize);
        
        // 压缩后大小
        const compressedSize = document.createElement('div');
        compressedSize.className = 'result-compressed-size';
        compressedSize.textContent = formatFileSize(result.compressedSize);
        
        // 节省大小
        const saved = document.createElement('div');
        saved.className = 'result-saved';
        const savedPercent = Math.max(0, Math.round((1 - result.compressedSize / result.originalSize) * 100));
        saved.textContent = `${savedPercent}%`;
        
        // 下载按钮
        const action = document.createElement('div');
        action.className = 'result-action';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = '下载';
        downloadBtn.style.width = 'auto';
        downloadBtn.style.padding = '5px 10px';
        downloadBtn.style.marginTop = '0';
        downloadBtn.onclick = function() {
            downloadSingleResult(result);
        };
        
        action.appendChild(downloadBtn);
        
        // 添加到行
        resultItem.appendChild(fileName);
        resultItem.appendChild(originalSize);
        resultItem.appendChild(compressedSize);
        resultItem.appendChild(saved);
        resultItem.appendChild(action);
        
        // 添加到列表
        batchResultsList.appendChild(resultItem);
    });
}

// 下载单个压缩结果
function downloadSingleResult(result) {
    try {
        addDebugLog(`下载单个压缩图片: ${result.fileName}`);
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(result.compressedFile);
        
        // 设置下载文件名
        const fileName = result.fileName;
        const fileExtension = fileName.split('.').pop().toLowerCase();
        const newFileName = fileName.replace(
            '.' + fileExtension, 
            `-compressed.${fileExtension === 'png' || fileExtension === 'gif' ? fileExtension : 'jpg'}`
        );
        
        link.download = newFileName;
        
        // 触发下载
        link.click();
        
        // 清理URL对象
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
        }, 100);
        
        showStatus(`下载完成: ${newFileName}`, 'success');
    } catch (error) {
        addDebugLog(`错误: 下载图片时出错: ${error.message}`);
        showStatus(`下载图片时出错: ${error.message}`, 'error');
    }
}

// 下载压缩后的图片 (单个)
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

// 下载所有压缩图片（批量，使用ZIP）
async function downloadAllCompressedImages() {
    if (compressedResults.length === 0) {
        showStatus('没有可下载的图片', 'warning');
        return;
    }
    
    if (isProcessingFile) return;
    isProcessingFile = true;
    
    // 检查JSZip是否可用
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
        addDebugLog('错误: JSZip或FileSaver库未加载，无法批量下载');
        showStatus('批量下载功能不可用，请刷新页面重试', 'error');
        setTimeout(resetProcessingState, 500);
        return;
    }
    
    try {
        addDebugLog(`开始打包 ${compressedResults.length} 个压缩图片...`);
        showStatus('正在准备下载包，请稍候...', 'warning');
        
        // 创建新的ZIP文件
        const zip = new JSZip();
        
        // 添加每个文件到zip
        for (let i = 0; i < compressedResults.length; i++) {
            const result = compressedResults[i];
            const fileName = result.fileName;
            const fileExtension = fileName.split('.').pop().toLowerCase();
            const newFileName = fileName.replace(
                '.' + fileExtension, 
                `-compressed.${fileExtension === 'png' || fileExtension === 'gif' ? fileExtension : 'jpg'}`
            );
            
            // 添加到zip
            zip.file(newFileName, result.compressedFile);
            addDebugLog(`添加到ZIP: ${newFileName}`);
        }
        
        // 生成ZIP文件
        addDebugLog('生成ZIP文件...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // 下载ZIP文件
        const zipName = `compressed-images-${new Date().toISOString().slice(0, 10)}.zip`;
        saveAs(zipBlob, zipName);
        
        addDebugLog(`ZIP文件生成完成，正在下载: ${zipName}`);
        showStatus(`正在下载: ${zipName}`, 'success');
    } catch (error) {
        addDebugLog(`错误: 批量下载时出错: ${error.message}`);
        showStatus(`批量下载时出错: ${error.message}`, 'error');
    }
    
    setTimeout(resetProcessingState, 1000);
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
    
    // 重置全局变量
    imageFiles = [];
    selectedFiles = [];
    currentPreviewIndex = -1;
    compressedResults = [];
    
    // 重置UI
    originalImage.src = '';
    compressedImage.src = '';
    if (compressBtn) compressBtn.disabled = true;
    if (resultContainer) resultContainer.classList.add('hidden');
    
    // 重置缩略图和预览
    if (thumbnailsContainer) {
        thumbnailsContainer.innerHTML = '';
        thumbnailsContainer.classList.add('hidden');
    }
    
    // 重置实时预览
    clearPreviews();
    if (livePreviewContainer) {
        livePreviewContainer.classList.add('hidden');
    }
    
    // 重置批量操作按钮
    if (selectAllBtn) selectAllBtn.disabled = true;
    if (deselectAllBtn) deselectAllBtn.disabled = true;
    if (removeSelectedBtn) removeSelectedBtn.disabled = true;
    
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

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 